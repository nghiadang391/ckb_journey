#![no_std]
#![no_main]

ckb_std::entry!(program_entry);
ckb_std::default_alloc!(16384, 1258306, 64);

use alloc::vec::Vec;
use ckb_std::ckb_constants::Source;
use ckb_std::ckb_types::{bytes::Bytes, prelude::*};
use ckb_std::high_level::{load_cell_data, load_cell_lock_hash, load_script, QueryIter};

#[repr(i8)]
pub enum ExitCode {
    Success = 0,
    StateCellMissing = 42,
    TokenPaused = 88,
}

fn check_owner_mode(args: &Bytes) -> bool {
    // If any input cell's lock hash matches the script arguments, owner mode is true.
    QueryIter::new(load_cell_lock_hash, Source::Input)
        .any(|lock_hash| args[..] == lock_hash[..])
}

pub fn program_entry() -> i8 {
    let script = load_script().unwrap();
    let args: Bytes = script.args().unpack();

    // 1. Check Owner Mode
    if check_owner_mode(&args) {
        return ExitCode::Success as i8;
    }

    // 2. Scan Cell Deps for the Pause State Cell
    let mut found_state = false;
    let mut paused = false;

    for data in QueryIter::new(load_cell_data, Source::CellDep) {
        if data.len() == 1 {
            found_state = true;
            if data[0] == 1 {
                paused = true;
            }
        }
    }

    // 3. Enforce validation rules
    if !found_state {
        return ExitCode::StateCellMissing as i8;
    }

    if paused {
        return ExitCode::TokenPaused as i8;
    }

    ExitCode::Success as i8
}
