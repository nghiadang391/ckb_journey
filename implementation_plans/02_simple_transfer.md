# Implementation Plan — Lesson 2: Simple CKB Transfer

## Background

In CKB's Cell model, transferring CKB is the process of **destroying** existing cells (inputs) and **creating** new cells (outputs) with a total capacity balance.

### Embedded Analogy
- A CKB transaction is a **state transition** that consumes old memory addresses (Inputs) and allocates new memory addresses (Outputs).
- **Inputs:** The live Cells we want to consume (free up).
- **Outputs:** The new Cells we want to allocate (malloc).
- **Witnesses:** The cryptographic signatures proving we own the Inputs.

---

## Project Structure

```text
ckb_journey/
└── projects/
    └── simple-transfer/
        ├── package.json
        ├── tsconfig.json
        ├── system-scripts.json
        └── src/
            └── index.ts
```

---

## Technical Approach

### Step-by-Step Script Execution Flow
1. **Initialize Wallet:** Load a pre-funded private key from `offckb accounts`.
2. **Formulate Output Cell:** Define a new cell for the receiver with the target capacity (500 CKB) and the receiver's Lock Script.
3. **Collect Input Cells (UTXO selection):** Query the ledger for enough of the sender's cells to cover 500 CKB plus a small transaction fee.
4. **Construct Transaction:** Combine inputs and outputs.
5. **Sign & Broadcast:** Sign the transaction using the sender's private key and send it to the CKB node pool.
6. **Wait for Confirmation:** Wait for the transaction to be mined into a block and print the transaction hash.

---
