# Lesson 13: xUDT Extensions (Advanced Patterns)

This plan outlines the steps to build a custom **xUDT (Extensible User-Defined Token)** compliance extension script in Rust. We will implement a **Pausable Token Extension** that halts token transactions if a global pause switch is activated.

## Proposed Changes

We will create a new project directory `13_xudt_extensions/` inside `ckb_journey/projects/`.

### [Component: 13_xudt_extensions]

#### [NEW] [Cargo.toml](file:///Users/nghiadang/CKB/ckb_journey/projects/13_xudt_extensions/Cargo.toml)
Workspace definition to manage the extension contract and its dependencies.

#### [NEW] [contracts/pause-extension/Cargo.toml](file:///Users/nghiadang/CKB/ckb_journey/projects/13_xudt_extensions/contracts/pause-extension/Cargo.toml)
Configure dependencies for the pause extension contract, utilizing `ckb-std = "0.16.4"` and the single-threaded atomics byte-patch to ensure clean bare-metal RISC-V compilation.

#### [NEW] [contracts/pause-extension/src/main.rs](file:///Users/nghiadang/CKB/ckb_journey/projects/13_xudt_extensions/contracts/pause-extension/src/main.rs)
The on-chain extension script. It will:
1. Load the transaction context.
2. Read the inputs/cell deps to find the "Pause State" cell (a cell containing a single byte: `1` for Paused, `0` for Active).
3. If the state is `1` (Paused):
   * Check if the token owner is authorizing this transaction (by looking for the owner lock hash in inputs).
   * If yes (Owner Mode), allow the transaction (`return 0`).
   * If no, reject the transaction with exit code `88` (Token Paused).
4. If the state is `0`, allow the transaction (`return 0`).

#### [NEW] [Makefile](file:///Users/nghiadang/CKB/ckb_journey/projects/13_xudt_extensions/Makefile)
A script to compile the extension contract to RISC-V (`riscv64imac-unknown-none-elf`) and copy the output binary to `build/release/pause-extension`.

#### [NEW] [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/13_xudt_extensions/package.json) & [jest.config.cjs](file:///Users/nghiadang/CKB/ckb_journey/projects/13_xudt_extensions/jest.config.cjs)
Configuration files to set up the Node.js/TypeScript testing environment with Jest and `ckb-testtool`.

#### [NEW] [src/extension.test.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/13_xudt_extensions/src/extension.test.ts)
A TypeScript integration test suite verifying the behavior of the extension script:
* **Test Case 1**: Token is not paused $\rightarrow$ transaction succeeds.
* **Test Case 2**: Token is paused $\rightarrow$ transaction is rejected with exit code `88`.
* **Test Case 3**: Token is paused but owner is present $\rightarrow$ transaction succeeds (owner override).

---

## Verification Plan

### Automated/Manual Tests
1. **Compilation**: Run `make build` inside the project folder to cross-compile the pause extension contract to RISC-V.
2. **Execution**: Run `npm install && npm test` to execute Jest tests and verify that the CKB VM properly executes and enforces the pause extension validation logic under all conditions.
