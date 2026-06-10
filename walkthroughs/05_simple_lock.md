# Walkthrough — Lesson 05: Custom Lock Script (TypeScript via ckb-js-vm)

The Custom Lock Script project was successfully created and executed. This project compiles a custom smart contract written in TypeScript down to CKB JS-VM bytecode (.bc), deploys it, locks cells under it, and runs two validation test cases (valid and invalid preimage secrets) live on CKB.

---

## Codebase Additions

The following files were created inside the new project directory:
* package.json: Configuration for TS runner, CCC SDK, and build pipeline using esbuild and offckb debugger to compile bytecode.
* tsconfig.json: TypeScript compilation specs.
* system-scripts.json: Reference script mapping.
* contract/src/index.ts: The CKB-JS-VM smart contract logic:
  * Loads expected hash from cell script args.
  * Loads the preimage passcode from the witness lock field.
  * Hashes the passcode using Blake2b.
  * Compares expected vs computed, exiting with 0 (unlock approved) or 11 (unauthorized spend rejected).
* src/index.ts: The loader and tester dApp:
  * Part 1 (Deploy): Loads the compiled bytecode, wraps it in a cell on the local blockchain, and gets the contract reference outPoint.
  * Part 2 (Lock): Creates a new cell locked under the custom lock (code hash = JS-VM codeHash, args = JS-VM prefix + contract cell dataHash + hash of the passcode "NgocPassphrase123").
  * Part 3 (Verify): Executes two test cases:
    1. Case A (Unauthorized Spend): Attempts to spend with wrong passcode "WrongPassphrase123" -> CKB-VM rejects transaction (exit code 11).
    2. Case B (Authorized Spend): Attempts to spend with correct passcode "NgocPassphrase123" -> Transaction successfully mined.

---

## Execution & Verification Results

The script executed successfully on the local CKB Devnet node:

1. Part 1 (Deploy):
   * Compiled TypeScript contract to dist/hash-lock.bc.
   * Broadcasted deployment transaction.
   * Transaction was successfully committed to the devnet blockchain.

2. Part 2 (Lock):
   * Blake2b hashed the correct passcode "NgocPassphrase123".
   * Locked a new 150 CKB cell under the custom Lock Script.
   * Transaction committed successfully.

3. Part 3 (Verify):
   * Test Case A: Attempted to spend the cell using the invalid passcode "WrongPassphrase123". The CKB node rejected the transaction, outputting: "Verification failed Script ... cause: ValidationFailure: see error code 11". This proves the lock script successfully defended the cell.
   * Test Case B: Attempted to spend the cell using the valid passcode "NgocPassphrase123". The transaction was successfully approved, signed, broadcasted, and committed to a block.
