# Walkthrough — Lesson 09: On-Chain TypeScript Script — Simple UDT (ts-sudt)

The on-chain TypeScript Simple UDT (sUDT) type script was successfully created, compiled, and executed. This lesson implements the core validation rules of the sUDT token standard (RFC-0025) running inside the CKB-VM emulator via `ckb-js-vm`.

---

## Codebase Additions

The following files were created and configured in the project directory:
* [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/package.json): Defines build and run scripts using `tsc`, `esbuild`, Jest (`npm test`), and `offckb debugger`.
* [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/tsconfig.json) / [tsconfig.base.json](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/tsconfig.base.json): Handles TypeScript configurations.
* [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/src/index.ts): The type script implementation:
  * **Args Processing**: Slices off the 35-byte host engine header to retrieve the 32-byte owner lock hash.
  * **Owner Mode Detection**: Iterates through input cells using `QueryIter` and `loadCellLockHash` to check if the transaction is signed by the token owner. If so, skips conservation checks.
  * **Conservation Rule**: If not in owner mode, sums input and output token amounts (represented as u128 values in the first 16 bytes of cell data) and enforces `sum(inputs) >= sum(outputs)`.
* [generate-mock-tx.cjs](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/generate-mock-tx.cjs) / [mock_tx.json](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/mock_tx.json): Code and exported transaction JSON containing mock inputs, outputs, lock scripts, and type script properties.
* [jest.config.cjs](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/jest.config.cjs) / [src/misc.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/src/misc.ts) / [src/sudt.test.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/09_ts_sudt_script/src/sudt.test.ts): Unit tests and helper modules validating token transfers under simulated CKB-VM contexts.

---

## Verification Results

Verification of the compilation and execution logic was completed:

1. **Compilation & Bytecode Generation (`npm run build`)**:
   * TypeScript files compiled cleanly and bundled into `dist/index.js` via `esbuild`.
   * The bundled Javascript was successfully compiled into CKB-VM bytecode `dist/index.bc` via `ckb-debugger`.

2. **Standalone Execution inside CKB-VM Emulator with Transaction Context (`npm start`)**:
   * A mock transaction (`mock_tx.json`) was generated with input = 100 and output = 90.
   * Running `npm start` loads this transaction, validates it, prints telemetry logs, and exits with code `0` (Success):
     ```
     Script log: Run from file, local access enabled. For Testing only.
     Script log: === STARTING LESSON 09: sUDT Type Script (RFC-0025) ===
     Script log: [INFO] Script args length (after VM header slice): 32 bytes
     Script log: [INFO] Checking for owner mode (issuer presence in inputs)...
     Script log: [INFO] Transfer mode: verifying token conservation...
     Script log: [INFO] Input token sum:  100
     Script log: [INFO] Output token sum: 90
     Script log: [SUCCESS] sUDT validation passed (conservation holds). Exit 0.
     Run result: 0
     All cycles: 13353166(12.7M)
     ```

3. **Complete Context Validation via WASM Unit Tests (`npm test`)**:
   * Running Jest unit tests with the WebAssembly CKB-VM debugger simulator enabled (`verifier.setWasmDebuggerEnabled(true)`) allows testing full transaction contexts without local binary dependencies:
     * **Success Transfer**: input = 100, output = 90. Passes validation successfully with exit code 0.
     * **Failed Transfer**: input = 100, output = 110. Fails validation due to inflation detection.
     * **Owner Minting**: input = 100, output = 500, owner lock is present in input cells. Passes validation successfully.
   * All three tests completed successfully:
     ```
     PASS src/sudt.test.ts
       sUDT On-Chain TypeScript Script Tests
         ✓ sudt-simple transfer success (inputs 100 >= outputs 90) (548 ms)
         ✓ sudt transfer failed (inflation: inputs 100 < outputs 110) (380 ms)
         ✓ sudt owner mode (bypass balance check: outputs 500 > inputs 100) (384 ms)
     ```
