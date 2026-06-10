# Walkthrough — Lesson 03: Store Data on Cell

The Store Data project was successfully created and executed. This project implements writing an arbitrary text message directly into a cell's data field and then reading it back natively from the blockchain.

---

## Codebase Additions

The following files were created inside the project directory:
* [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/03_store_data_on_cell/package.json): Standard runner configurations.
* [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/03_store_data_on_cell/tsconfig.json): TypeScript configuration specifications.
* [system-scripts.json](file:///Users/nghiadang/CKB/ckb_journey/projects/03_store_data_on_cell/system-scripts.json): Ref system scripts.
* [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/03_store_data_on_cell/src/index.ts): The main text storage runner:
  * Part 1 (Write): Converts a UTF-8 string into hex bytes and creates a transaction that allocates a new cell containing the hex data.
  * Part 2 (Read): Polls block inclusion, queries the live cell by transaction hash, extracts the hex data, and decodes it back to human-readable UTF-8.
  * Part 3 (Analysis): Breaks down the exact on-chain memory capacity allocation (61 CKB base overhead + N CKB data bytes).

---

## Verification Results

The script executed successfully on the network:

1. **Transaction Broadcast**:
   * Text message converted to hex representation.
   * Calculated minimum cell capacity dynamically.
   * Transaction broadcasted and successfully committed into a block.

2. **Read Verification**:
   * Retrieved the committed cell and parsed the raw hex.
   * Decoded the hex payload successfully back to the original UTF-8 string.
   * Validated a perfect content match.

3. **Memory Allocation**:
   * Telemetry broke down the exact state bytes in real-time, verifying that the CKB storage capacity matches `1 CKB = 1 Byte` of global distributed space.
