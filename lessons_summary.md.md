# CKB Builders' Track: Embedded Systems Reference Sheet

## Lesson 02: Simple CKB Transfer
*   **High-Level Concept:** Transferring ownership of CKB capacity from a sender's public key address to a receiver.
*   **Embedded Rosetta Stone:** **Modifying write-protection registers / ownership flags.** 
    *   Think of CKB cell capacity as an allocation block in RAM. Doing a transfer doesn't "move" coins; it destroys the input allocation struct and creates a new one with a different lock-pointer address.
*   **Key Highlights & Code Assets:**
    *   Learned to load private keys and initiate signers using the CCC SDK.
    *   Understood **UTXO matching**—the transaction builder automatically gathers inputs (like harvesting free memory blocks) and returns the unused portion to a change cell.
    *   Enforced the baseline transaction fee rate: `1000 shannons/byte`.
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/02_simple_transfer/src/index.ts) | [system-scripts.json](file:///Users/nghiadang/CKB/ckb_journey/projects/02_simple_transfer/system-scripts.json)

---

## Lesson 03: Store Data on Cell
*   **High-Level Concept:** Writing arbitrary text/data bytes directly onto the global state of the blockchain.
*   **Embedded Rosetta Stone:** **Writing raw data structures to Flash Memory/EEPROM.**
    *   **Capacity Limit:** Storing data takes up physical hardware SSD space on all validation nodes. Therefore, CKB tokens must be locked to pay for the bytes: `1 CKB = 1 Byte` of storage.
    *   **Base Overhead:** A cell requires `61 CKB` of base overhead just to store its descriptors (lock script, capacity fields, etc.) before writing a single byte of actual data.
*   **Key Highlights & Code Assets:**
    *   Parsed string arrays into hex representations for storage.
    *   Calculated minimum capacity dynamically: `base_overhead (61 bytes) + data_length (N bytes)`.
    *   Polled the transaction state until the write block committed, then decoded the binary data back to UTF-8.
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/03_store_data_on_cell/src/index.ts)

---

## Lesson 04: Fungible Tokens (xUDT) & Metadata
*   **High-Level Concept:** Minting and transferring custom assets using the Extensible User Defined Token (xUDT) standard, and linking metadata.
*   **Embedded Rosetta Stone:** **Implementing custom partitioned memory registers and standard brand descriptors.**
    *   A UDT balance is stored as a 128-bit unsigned integer (`u128`) in the first 16 bytes of the cell's data field.
*   **Key Highlights & Code Assets:**
    *   **xUDT Arguments:** The script's argument is the hash of the owner's lock script, proving who authorized the token mint.
    *   **Branding Metadata:** Packed standard metadata (token name, symbol, decimal precision) into separate descriptor cells locked under the issuer script.
    *   Parsed UDT balances using a little-endian byte parser (`u128LE`).
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/04_fungible_tokens/src/index.ts)

---

## Lesson 05: Custom Lock Script
*   **High-Level Concept:** Deploying and locking cells under a custom authentication script that verifies a passcode.
*   **Embedded Rosetta Stone:** **Custom hardware authentication callback / secure boot passcode validation.**
    *   Instead of standard cryptography (SECP256K1), the cell's lock script checks a custom Blake2b hash preimage.
*   **Key Highlights & Code Assets:**
    *   Wrote the lock validation logic in TypeScript, compiling it to QuickJS bytecode (`.bc`).
    *   Locked a cell with the hash of `"NgocPassphrase123"`.
    *   **Lock Verification:**
        *   Passing the incorrect passcode yielded validation rejection (Exit code `11`).
        *   Passing the correct passcode preimage validated successfully (Exit code `0`).
    *   Files: [contract/src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/05_simple_lock/contract/src/index.ts) | [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/05_simple_lock/src/index.ts)

---

## Lesson 06: Molecule Serialization
*   **High-Level Concept:** Processing CKB's serialization framework used to structure schemas and arguments on-chain.
*   **Embedded Rosetta Stone:** **Strict byte packing and padding mitigation for low-level bus protocols (like SPI/I2C/CAN).**
    *   To prevent different compiler target architectures from adding custom struct padding (which breaks hashes), Molecule strictly structures data into fixed `structs` (no padding) and dynamic `tables` (with offset pointers).
*   **Key Highlights & Code Assets:**
    *   Used `@ckb-ccc/shell` to handle serialization.
    *   Serialized Uint8 (1 byte) and Uint128LE (16 bytes).
    *   Packed a fixed-layout `Attributes` struct (`strength`, `dexterity`, `endurance`, `speed`), compressing it to exactly 4 bytes.
    *   Serialized nested class entities using decorators (`@mol.codec`).
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/06_molecule_serialization/src/index.ts)

---

## Lesson 07: Spore DOB (Digital Object Base)
*   **High-Level Concept:** Creating a Zero-Asset Non-Fungible Token (Spore NFT) where content is stored directly inside the cell.
*   **Embedded Rosetta Stone:** **Statically allocated on-chip ROM firmware sectors.**
    *   Unlike ERC-721 which links to an external image URL, a Spore DOB stores its complete media asset on-chain. Melting/destroying the token gives the locked CKB storage capacity back.
*   **Key Highlights & Code Assets:**
    *   Utilized `@spore-sdk/core` to build transaction skeletons.
    *   Minted a unique spore token containing raw data onto the devnet node.
    *   Extracted the binary spore payload from the live cell, decoded it, and verified content integrity.
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/07_create_spore_dob/src/index.ts)

---

## Lesson 08: TS Hello World Script
*   **High-Level Concept:** Constructing and running custom validation logic inside the CKB-VM using TypeScript and the QuickJS VM.
*   **Embedded Rosetta Stone:** **Running a lightweight scripting engine (like JerryScript) on a bare-metal CPU.**
    *   Instead of writing assembly/C, JS bytecode is run inside a RISC-V CKB-VM emulator.
*   **Key Highlights & Code Assets:**
    *   Bundled TypeScript into JS via `esbuild`, then compiled it to QuickJS bytecode (`.bc`) using `ckb-debugger`.
    *   The basic Hello World script consumed **`3,604,926` (3.6M) cycles** due to QuickJS VM engine startup overhead.
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/08_ts_hello_world_script/src/index.ts)

---

## Lesson 09: TS sUDT Script
*   **High-Level Concept:** Recreating the Simple UDT (sUDT) balance verification rules using TypeScript running on-chain.
*   **Embedded Rosetta Stone:** **Interpreter-based dynamic memory safety and boundary checking.**
*   **Key Highlights & Code Assets:**
    *   Iterates through input and output cells via `QueryIter` and `loadCellLockHash`.
    *   Sums input vs output balances and verifies `sum(inputs) >= sum(outputs)` (the inflation prevention rule).
    *   Because of the QuickJS engine interpreter overhead, execution consumes **`13,362,395` (13.3M) cycles** on the RISC-V CKB-VM.
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/src/index.ts) | [src/sudt.test.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/src/sudt.test.ts)

---

## Lesson 10: Rust sUDT Script
*   **High-Level Concept:** Writing and compiling the same sUDT contract natively in Rust using `no_std`.
*   **Embedded Rosetta Stone:** **Direct compilation to bare-metal RISC-V machine assembly.**
    *   By removing the QuickJS interpreter, the contract runs directly as native RISC-V instructions on CKB-VM.
*   **Key Highlights & Code Assets:**
    *   Configured cross-compilation target: `riscv64imac-unknown-none-elf` and compiler flags `RUSTFLAGS="-C target-feature=-a"` (disabling atomic extensions).
    *   **Atomics Resolution:** Patched standard dependencies crate (`bytes`) to use single-threaded `UnsafeCell` operations, resolving compiler instruction selection errors.
    *   **Cycle Optimization:** Rust executed sUDT validations in **`17,841` cycles**—a massive **750x to 940x** efficiency gain over TypeScript!
    *   Files: [contracts/sudt/src/main.rs](file:///Users/nghiadang/CKB/ckb_journey/projects/10_rust_sudt_script/contracts/sudt/src/main.rs) | [bytes-patch/src/lib.rs](file:///Users/nghiadang/CKB/ckb_journey/projects/10_rust_sudt_script/bytes-patch/src/lib.rs)

---

## Lesson 11: Nervos DAO
*   **High-Level Concept:** Interacting with the Nervos DAO smart contract to earn inflation protection against CKB's Secondary Issuance (State Rent).
*   **Embedded Rosetta Stone:** **Releasing allocated RAM/flash buffers to avoid power/rent dilution, guarded by a hardware watchdog timer.**
    *   **State Rent:** Active data-storing cells pay state rent via secondary issuance inflation. Passive non-data-storing cells lock themselves in the DAO to collect a secondary issuance rebate, nullifying the inflation.
*   **Technical Details:**
    *   Uses a 3-step lifecycle: Deposit -> Prepare (request withdraw) -> Claim (unlock capacity + interest).
    *   Claim locks are computed using fixed-point math on `Epoch` tuples.
    *   accrued interest is computed using DAO arithmetic accumulator ratios (`ar`) stored in block headers.
    *   Maturity lock parameters are hex-encoded into the inputs' `since` field using **180-epoch** cycles.
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/11_nervos_dao/src/index.ts)
