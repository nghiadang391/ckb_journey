#![no_std]
#![no_main]

ckb_std::entry!(program_entry);
ckb_std::default_alloc!(16384, 1258306, 64);

use alloc::borrow::Cow;
use alloc::vec::Vec;
use ckb_std::ckb_constants::Source;
use ckb_std::ckb_types::{bytes::Bytes, prelude::*};
use ckb_std::error::SysError;
use ckb_std::high_level::{load_cell_data, load_cell_lock_hash, load_script, QueryIter};

use ckb_ssri_std::public_module_traits::udt::UDT;
use ckb_ssri_std::ssri_methods;

// sUDT definitions
const UDT_AMOUNT_LEN: usize = 16;

#[derive(Debug)]
#[repr(i8)]
pub enum Error {
    IndexOutOfBound = 1,
    ItemMissing,
    LengthNotEnough,
    WaitFailure,
    InvalidFd,
    OtherEndClosed,
    MaxVmsSpawned,
    MaxFdsCreated,
    AmountEncoding = 12,
    InvalidAmount,
    InvalidVmVersion = 14,
    SSRIError = 15,
}

impl From<SysError> for Error {
    fn from(err: SysError) -> Self {
        use SysError::*;
        match err {
            IndexOutOfBound => Self::IndexOutOfBound,
            ItemMissing => Self::ItemMissing,
            LengthNotEnough(_) => Self::LengthNotEnough,
            WaitFailure => Self::WaitFailure,
            InvalidFd => Self::InvalidFd,
            OtherEndClosed => Self::OtherEndClosed,
            MaxVmsSpawned => Self::MaxVmsSpawned,
            MaxFdsCreated => Self::MaxFdsCreated,
            Encoding => Self::AmountEncoding,
            Unknown(err_code) => panic!("unexpected sys error {}", err_code),
            #[allow(unreachable_patterns)]
            _ => panic!("Unknown SysError"),
        }
    }
}

struct MyToken;

impl UDT for MyToken {
    type Error = Error;

    fn name() -> Result<Bytes, Self::Error> {
        Ok(Bytes::from("SSRI-sUDT"))
    }

    fn symbol() -> Result<Bytes, Self::Error> {
        Ok(Bytes::from("SSU"))
    }

    fn decimals() -> Result<u8, Self::Error> {
        Ok(8)
    }

    fn icon() -> Result<Bytes, Self::Error> {
        Ok(Bytes::new())
    }

    fn transfer(
        _tx: Option<ckb_gen_types::packed::Transaction>,
        _to_lock_vec: Vec<ckb_gen_types::packed::Script>,
        _to_amount_vec: Vec<u128>,
    ) -> Result<ckb_gen_types::packed::Transaction, Self::Error> {
        Err(Error::SSRIError)
    }

    fn verify_transfer() -> Result<(), Self::Error> {
        Ok(())
    }

    fn mint(
        _tx: Option<ckb_gen_types::packed::Transaction>,
        _to_lock_vec: Vec<ckb_gen_types::packed::Script>,
        _to_amount_vec: Vec<u128>,
    ) -> Result<ckb_gen_types::packed::Transaction, Self::Error> {
        Err(Error::SSRIError)
    }

    fn verify_mint() -> Result<(), Self::Error> {
        Ok(())
    }
}

fn check_owner_mode(args: &Bytes) -> bool {
    QueryIter::new(load_cell_lock_hash, Source::Input).any(|lock_hash| args[..] == lock_hash[..])
}

fn collect_inputs_amount() -> Result<u128, Error> {
    let mut buf = [0u8; UDT_AMOUNT_LEN];
    let udt_list = QueryIter::new(load_cell_data, Source::GroupInput)
        .map(|data| {
            if data.len() >= UDT_AMOUNT_LEN {
                buf.copy_from_slice(&data[0..UDT_AMOUNT_LEN]);
                Ok(u128::from_le_bytes(buf))
            } else {
                Err(Error::AmountEncoding)
            }
        })
        .collect::<Result<Vec<_>, Error>>()?;
    Ok(udt_list.into_iter().sum::<u128>())
}

fn collect_outputs_amount() -> Result<u128, Error> {
    let mut buf = [0u8; UDT_AMOUNT_LEN];
    let udt_list = QueryIter::new(load_cell_data, Source::GroupOutput)
        .map(|data| {
            if data.len() >= UDT_AMOUNT_LEN {
                buf.copy_from_slice(&data[0..UDT_AMOUNT_LEN]);
                Ok(u128::from_le_bytes(buf))
            } else {
                Err(Error::AmountEncoding)
            }
        })
        .collect::<Result<Vec<_>, Error>>()?;
    Ok(udt_list.into_iter().sum::<u128>())
}

// Writes the query output back to the CKB VM via the set_content syscall (ID 2104)
pub fn set_content(content: &[u8]) -> Result<(), Error> {
    let mut len = content.len() as u64;
    let ret = unsafe {
        ckb_ssri_std::utils::syscalls::syscall(
            content.as_ptr() as u64,
            &mut len as *mut u64 as u64,
            0,
            0,
            0,
            0,
            0,
            2104, // SYS_SET_CONTENT
        )
    };
    if ret == 0 {
        Ok(())
    } else {
        Err(Error::SSRIError)
    }
}

fn handle_ssri_methods(argv: &[ckb_std::env::Arg]) -> Result<Cow<'static, [u8]>, Error> {
    ssri_methods! {
        argv: argv,
        invalid_method: Error::SSRIError,
        invalid_args: Error::SSRIError,
        "UDT.name" => MyToken::name().map(|b| Cow::Owned(b.to_vec())),
        "UDT.symbol" => MyToken::symbol().map(|b| Cow::Owned(b.to_vec())),
        "UDT.decimals" => MyToken::decimals().map(|d| Cow::Owned(d.to_le_bytes().to_vec())),
        "UDT.icon" => MyToken::icon().map(|b| Cow::Owned(b.to_vec())),
    }
}

pub fn program_entry() -> i8 {
    // Determine whether to run standard validation or SSRI query routing
    match ckb_ssri_std::utils::should_fallback() {
        Ok(true) => {
            // Standard sUDT validation logic (Lesson 10)
            let script = load_script().unwrap();
            let args: Bytes = script.args().unpack();

            if check_owner_mode(&args) {
                return 0;
            }

            let inputs_amount = match collect_inputs_amount() {
                Ok(amt) => amt,
                Err(err) => return err as i8,
            };
            let outputs_amount = match collect_outputs_amount() {
                Ok(amt) => amt,
                Err(err) => return err as i8,
            };

            if inputs_amount < outputs_amount {
                return Error::InvalidAmount as i8;
            }

            0
        }
        Ok(false) => {
            // SSRI Query Routing
            let argv = ckb_std::env::argv();
            match handle_ssri_methods(&argv) {
                Ok(content) => match set_content(&content) {
                    Ok(_) => 0,
                    Err(err) => err as i8,
                },
                Err(err) => err as i8,
            }
        }
        Err(_) => Error::InvalidVmVersion as i8,
    }
}

