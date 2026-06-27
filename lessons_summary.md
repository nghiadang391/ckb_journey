# CKB Builders' Track: Embedded Systems Reference Sheet

## Lesson 02: Simple CKB Transfer
*   **High-Level Concept:** Transferring ownership of CKB capacity from a sender's public key address to a receiver.
*   **Why We Need This:** To perform the most fundamental blockchain operation: transferring ownership of value (capacity) between users on the CKB network.
*   **Embedded Rosetta Stone:** **Modifying write-protection registers / ownership flags.** 
    *   Think of CKB cell capacity as an allocation block in RAM. Doing a transfer doesn't "move" coins; it destroys the input allocation struct and creates a new one with a different lock-pointer address.
*   **Key Highlights & Code Assets:**
    *   Learned to load private keys and initiate signers using the CCC SDK.
    *   Understood **UTXO matching**—the transaction builder automatically gathers inputs (like harvesting free memory blocks) and returns the unused portion to a change cell.
    *   Enforced the baseline transaction fee rate: `1000 shannons/KB` (1 shannon/byte).
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/02_simple_transfer/src/index.ts) | [system-scripts.json](file:///Users/nghiadang/CKB/ckb_journey/projects/02_simple_transfer/system-scripts.json)

---

## Lesson 03: Store Data on Cell
*   **High-Level Concept:** Writing arbitrary text/data bytes directly onto the global state of the blockchain.
*   **Why We Need This:** To store structured data (such as parameters, states, or logs) directly inside CKB cells, which is the foundational way data is persisted on CKB.
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
*   **Why We Need This:** To issue custom fungible assets (like stablecoins or governance tokens) and attach descriptive metadata (name, symbol, decimals) so wallets and explorers can identify and display them properly.
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
*   **Why We Need This:** To enforce custom rules for accessing or unlocking assets (like passphrases, multisigs, or time-locks) instead of being restricted to standard private key signature checks.
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
*   **Why We Need This:** To package and parse complex on-chain structures without compiler-dependent byte padding, preventing validation mismatches across different CPU architectures.
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
*   **Why We Need This:** To issue digital assets/NFTs that store their actual media data directly on-chain rather than linking to external servers, protecting them from link rot or deletion.
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
*   **Why We Need This:** To write smart contracts in a high-level scripting language (TypeScript), lowering the barrier to entry and accelerating development compared to writing assembly or C.
*   **Embedded Rosetta Stone:** **Running a lightweight scripting engine (like JerryScript) on a bare-metal CPU.**
    *   Instead of writing assembly/C, JS bytecode is run inside a RISC-V CKB-VM emulator.
*   **Key Highlights & Code Assets:**
    *   Bundled TypeScript into JS via `esbuild`, then compiled it to QuickJS bytecode (`.bc`) using `ckb-debugger`.
    *   The basic Hello World script consumed **`3,604,926` (3.6M) cycles** due to QuickJS VM engine startup overhead.
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/08_ts_hello_world_script/src/index.ts)

---

## Lesson 09: TS sUDT Script
*   **High-Level Concept:** Recreating the Simple UDT (sUDT) balance verification rules using TypeScript running on-chain.
*   **Why We Need This:** To prototype token balance verification rules (enforcing inputs >= outputs) in TypeScript, simplifying testing before deploying final optimized code.
*   **Embedded Rosetta Stone:** **Interpreter-based dynamic memory safety and boundary checking.**
*   **Key Highlights & Code Assets:**
    *   Iterates through input and output cells via `QueryIter` and `loadCellLockHash`.
    *   Sums input vs output balances and verifies `sum(inputs) >= sum(outputs)` (the inflation prevention rule).
    *   Because of the QuickJS engine interpreter overhead, execution consumes **`13,362,395` (13.3M) cycles** on the RISC-V CKB-VM.
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/src/index.ts) | [src/sudt.test.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/src/sudt.test.ts)

---

## Lesson 10: Rust sUDT Script
*   **High-Level Concept:** Writing and compiling the same sUDT contract natively in Rust using `no_std`.
*   **Why We Need This:** To achieve massive cycle optimization. Native RISC-V execution in Rust is ~750x-940x faster and cheaper than interpreted TypeScript, saving transaction costs.
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
*   **Why We Need This:** To hedge locked capacity against supply inflation, collecting rebates to offset state rent costs for long-term storage or holding.
*   **Embedded Rosetta Stone:** **Releasing allocated RAM/flash buffers to avoid power/rent dilution, guarded by a hardware watchdog timer.**
    *   **State Rent:** Active data-storing cells pay state rent via secondary issuance inflation. Passive non-data-storing cells lock themselves in the DAO to collect a secondary issuance rebate, nullifying the inflation.
*   **Technical Details:**
    *   Uses a 3-step lifecycle: Deposit -> Prepare (request withdraw) -> Claim (unlock capacity + interest).
    *   Claim locks are computed using fixed-point math on `Epoch` tuples.
    *   accrued interest is computed using DAO arithmetic accumulator ratios (`ar`) stored in block headers.
    *   Maturity lock parameters are hex-encoded into the inputs' `since` field using **180-epoch** cycles.
    *   Files: [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/11_nervos_dao/src/index.ts)

---

## Lesson 12: SSRI-Compliant UDT in Rust
*   **High-Level Concept:** Implementing the SSRI (Script-Sourced Rich Information) protocol in a native Rust sUDT token contract, allowing off-chain clients to query token metadata dynamically.
*   **Why We Need This:** To allow off-chain wallets/interfaces to dynamically query a smart contract for its metadata (decimals, name) without hardcoding values client-side.
*   **Embedded Rosetta Stone:** **Standardized on-chip diagnostic register query protocol (like Unified Diagnostic Services / UDS over CAN bus).**
    *   Rather than hardcoding static information in client code, the off-chain system queries the contract dynamically via standard execution arguments (`argv`), returning up-to-date, self-descriptive metadata.
*   **Key Highlights & Code Assets:**
    *   Configured the compiler to target bare-metal RISC-V and compile with the `ckb-ssri-std` library.
    *   Resolved `rust-lld` duplicate linker symbol conflicts by pinning dependencies to `ckb-std v0.16.4`.
    *   Implemented the SSRI `UDT` trait and verified metadata queries using Jest.
    *   Files: [Cargo.toml](file:///Users/nghiadang/CKB/ckb_journey/projects/12_ssri_sudt/Cargo.toml) | [contracts/ssri-sudt/src/main.rs](file:///Users/nghiadang/CKB/ckb_journey/projects/12_ssri_sudt/contracts/ssri-sudt/src/main.rs)

---

## Lesson 13: xUDT Extensions (Advanced Patterns)
*   **High-Level Concept:** Building a custom pausable compliance validation script in Rust chained as an extension to an xUDT token to veto transactions based on global status cells.
*   **Why We Need This:** To plug custom validation rules (like global freeze, blocklists, or time-locks) into an existing token standard without modifying the base contract.
*   **Embedded Rosetta Stone:** **Chaining hardware security policies (like secure boot check sequences or memory protection unit / MPU access guards).**
    *   The base token contract checks balances (ownership). The extension script acts as an external security guard checking custom rules (such as checking if a pause switch cell is active in the transaction dependency layout) and can veto the transaction before completion.
*   **Key Highlights & Code Assets:**
    *   Implemented active, paused, and owner override states.
    *   **Bypass Optimization:** Achieved a **~8.3x cycle reduction** (down to `13,569` cycles) in Owner Mode by immediately exiting when the owner signature is present, bypassing the cell dependency search loops entirely.
    *   Files: [contracts/pause-extension/src/main.rs](file:///Users/nghiadang/CKB/ckb_journey/projects/13_xudt_extensions/contracts/pause-extension/src/main.rs) | [src/extension.test.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/13_xudt_extensions/src/extension.test.ts)

---

## Lesson 14: iCKB Protocol
*   **High-Level Concept:** Designing and simulating the iCKB liquid staking protocol, tokenizing locked Nervos DAO deposits into liquid, inflation-protected xUDT tokens.
*   **Why We Need This:** To earn staking yield from the Nervos DAO while retaining asset liquidity (the ability to trade, sell, or spend the assets instantly) rather than locking capital in 30-day cycles.
*   **Embedded Rosetta Stone:** **DMA Ring Buffering with non-blocking buffer descriptor handles.**
    *   Direct staking is like a synchronous blocking flash write (freezing CPU resources). iCKB is like a non-blocking DMA ring buffer that handles the slow write in the background and immediately returns a "buffer descriptor" (the iCKB token) that the CPU can pass and use in other tasks immediately.
*   **Key Highlights & Code Assets:**
    *   Calculated deposit minting rates and withdrawal redemptions using the deterministic **Accumulated Rate (AR)** compounding formula.
    *   Constructed valid CKB transaction skeletons for the deposit and burn processes using the CCC SDK.
    *   Successfully executed the simulation against a live local `offckb` devnet node, extracting real-time block headers.
    *   Files: [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/14_ickb/package.json) | [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/14_ickb/src/index.ts)

---

## Lesson 15: RGB++ Protocol & Isomorphic Binding
*   **High-Level Concept:** Simulating the RGB++ protocol to bind smart contract assets on CKB directly to Bitcoin UTXOs (isomorphic binding) using OP_RETURN commitments.
*   **Why We Need This:** To enable Turing-complete smart contracts and custom tokens on Bitcoin (or other UTXO-based chains that lack native smart contracts) without relying on centralized, risky asset bridges.
*   **Embedded Rosetta Stone:** **Dual-Core IPC Handshake via Shared Memory and MPU Status Registers.**
    *   Think of Bitcoin (Core A) as a highly secure, slow security co-processor maintaining master keys (UTXOs), and CKB (Core B) as a fast application processor running smart contracts. Core B calculates a checksum (commitment) and triggers Core A to write it to its status register (`OP_RETURN`). Core B's Memory Protection Unit (`RgbppLock`) only releases memory cells if it verifies the matching checksum in Core A's register.
*   **Key Highlights & Code Assets:**
    *   Clarified that RGB++ is specifically and only for Bitcoin/UTXO assets to interact with CKB, and is not needed for native CKB dApps.
    *   Constructed a virtual CKB transaction and calculated its Double-SHA256 commitment hash.
    *   Simulated the corresponding Bitcoin transaction spending the bound UTXO and logging the computed commitment in an `OP_RETURN` script.
    *   Simulated the CKB-VM `RgbppLock` verification checks to validate the isomorphic binding.
    *   Files: [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/15_rgbpp/package.json) | [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/15_rgbpp/src/index.ts)


