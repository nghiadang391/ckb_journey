# Lesson 12: SSRI-Compliant UDT in Rust

This plan outlines the steps to upgrade our native Rust sUDT contract from Lesson 10 to implement the **SSRI (Script-Sourced Rich Information)** protocol, allowing off-chain applications to query token data and behaviors dynamically.

## Proposed Changes

We will create a new project directory `12_ssri_sudt/` inside `ckb_journey/projects/` (cloned and modified from `10_rust_sudt_script/`).

### [Component: 12_ssri_sudt]

#### [NEW] [Cargo.toml](file:///Users/nghiadang/CKB/ckb_journey/projects/12_ssri_sudt/Cargo.toml)
Configure dependencies to include `ckb-ssri-std` (compatible with `no_std` RISC-V environment) alongside CKB standard libraries.
*Note: To resolve duplicate atomic symbol conflicts, the contract's direct `ckb-std` dependency must be aligned to version `0.16.4` to match `ckb-ssri-std`'s requirements.*

#### [NEW] [contracts/ssri-sudt/src/main.rs](file:///Users/nghiadang/CKB/ckb_journey/projects/12_ssri_sudt/contracts/ssri-sudt/src/main.rs)
The smart contract code. We will:
1. Initialize the entry point with `#![no_main]`.
2. Define the token structure.
3. Implement the `UDT` trait from `ckb-ssri-std`:
   * Expose standard functions like `name()`, `symbol()`, `decimals()`, and `balance()`.
4. Define the execution route (using SSRI dispatching) so that off-chain queries are routed correctly to the trait methods, while standard transaction verification routes to validation.

#### [NEW] [src/sudt.test.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/12_ssri_sudt/src/sudt.test.ts)
A TypeScript script using `ckb-testtool` to verify standard sUDT validation rules (transfer, owner mode, inflation) against the compiled RISC-V binary `ssri-sudt`.

---

## Verification Plan

### Automated/Manual Tests
1. **Compilation**: Run `make build` inside the Rust directory to cross-compile the contract to `riscv64imac-unknown-none-elf`.
2. **SSRI Verification**:
   * Start local CKB node using `offckb node`.
   * Run the TypeScript script (`npm start`).
   * The script should:
     1. Deploy the compiled Rust contract.
     2. Query the contract's metadata (e.g. `name`, `symbol`, `decimals`) using SSRI off-chain execution calls.
     3. Verify the output printed in the console match the values defined in the Rust contract.
