# Walkthrough — Lesson 02: Simple CKB Transfer

We have successfully created and executed the Simple Transfer project. This project implements a CKB transaction that destroys existing input cells and allocates a new cell containing 500 CKB to a receiver address.

---

## Codebase Additions

We created the following files inside the project directory:
* [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/simple-transfer/package.json): Handles dependencies including the `@ckb-ccc/core` SDK.
* [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/simple-transfer/tsconfig.json): TypeScript compilation specs.
* [system-scripts.json](file:///Users/nghiadang/CKB/ckb_journey/projects/simple-transfer/system-scripts.json): Local devnet configuration for resolving SECP256K1 cell dependency scripts.
* [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/simple-transfer/src/index.ts): The main transfer runner:
  * Part 1: Connects to the local devnet node and queries initial sender/receiver CKB balances.
  * Part 2: Sets up a cryptographic signer using pre-funded devnet private keys.
  * Part 3: Allocates a new transaction structure with an output cell targeting the receiver with 500 CKB.
  * Part 4: Automatically performs input UTXO matching and calculates required byte gas fees.
  * Part 5: Signs and broadcasts the transaction, polling status until committed to a block.

---

## Verification Results

Our script executed successfully on the local CKB Devnet node:

1. **Initial State Check**:
   * Confirmed connection to local blockchain node.
   * Sender and receiver addresses parsed successfully.
   * Verified sender balance was sufficient to cover 500 CKB plus transaction fee.

2. **Transaction Broadcast**:
   * Gathered UTXO inputs and computed gas fee using standard 1000 shannons/byte fee rate.
   * Transaction broadcasted and successfully committed into a block.
   * Telemetry logged the exact transaction hash representing the state transition on-chain.

3. **Final Balances**:
   * Receiver final balance showed an exact increase of `+500 CKB`.
   * Sender final balance was reduced by exactly `500 CKB` plus transaction fee, proving clean state transition.
