# Walkthrough — Lesson 08: On-Chain TypeScript Script — Hello World (ts-hello-world)

The on-chain TypeScript Hello World contract was successfully created and executed. This lesson demonstrates how to construct, bundle, and run custom validation logic inside the CKB-VM emulator using TypeScript and the QuickJS VM engine (`ckb-js-vm`).

---

## Codebase Additions

The following files were created inside the project directory:
* [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/08_ts_hello_world_script/package.json): Handles dependencies (like `@ckb-js-std/bindings` and `esbuild`), build configurations, and emulator running scripts.
* [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/08_ts_hello_world_script/tsconfig.json) / [tsconfig.base.json](file:///Users/nghiadang/CKB/ckb_journey/projects/08_ts_hello_world_script/tsconfig.base.json): Configures TypeScript settings targeting modern Javascript suitable for the QuickJS engine.
* [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/08_ts_hello_world_script/src/index.ts): The custom on-chain contract source code:
  * Exposes a `main()` function returning `0` for success.
  * Uses `bindings.exit()` to terminate execution and return the status code directly to the CKB-VM kernel.

---

## Verification Results

Verification of the build pipeline and contract execution was completed locally:

1. **Compilation & Bytecode Generation (`npm run build`)**:
   * TypeScript is compiled and bundled into a single JavaScript file (`dist/index.js`).
   * The JS bundle is compiled to QuickJS bytecode (`dist/index.bc`) via `ckb-debugger` (run via `offckb debugger`).
   * Execution of the build command consumes `3.7M` RISC-V cycles.

2. **Execution inside CKB-VM Emulator (`npm start`)**:
   * Running `npm start` executes `dist/index.bc` inside the RISC-V VM emulator directly.
   * Telemetry logs successfully printed using `ckb_debug` output redirection:
     ```
     Script log: Run from file, local access enabled. For Testing only.
     Script log: === STARTING LESSON 08: On-Chain TS Script (Hello World) ===
     Script log: [INFO] Script is executing inside CKB-VM (QuickJS via ckb-js-vm).
     Script log: [INFO] Hello from an embedded developer on Nervos CKB!
     Script log: [SUCCESS] Script validation passed. Exiting with code 0.
     Run result: 0
     All cycles: 3604926(3.4M)
     ```
   * The script terminated with `Run result: 0` (indicating validation success) and consumed `3,604,926` cycles (approx. 3.4M).
