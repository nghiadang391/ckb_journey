# Implementation Plan — Lesson 3: Store Data on Cell

## Background

In Lesson 2 (Simple Transfer), we transferred **empty capacity** between addresses — the cell's `data` field was always `"0x"` (NULL). 

In this lesson, we will learn to **write arbitrary data bytes into a cell's `data` field** and then **read that data back from the blockchain**. This is the foundation of everything on CKB: tokens, NFTs, game state, and configuration all live inside cell data fields.

### Embedded Analogy
- **Lesson 2** was like calling `malloc(500)` — allocating an empty buffer on the global heap.
- **Lesson 3** is like calling `malloc(500)` AND THEN writing actual bytes into it via `memcpy(buffer, "Hello CKB!", 10)`. The blockchain permanently stores this data on its global, distributed flash memory.

### Key Concept: Capacity Must Cover Data Size
Because `1 CKB = 1 Byte` of on-chain storage, if we write a 20-byte string into a cell's data field, we must lock an **additional 20 CKB** of capacity on top of the 61 CKB base overhead. The SDK handles this calculation automatically.

---

## Proposed Changes

### Project Setup

#### [NEW] package.json
- Same structure as simple-transfer: CCC SDK, tsx, typescript dependencies.

#### [NEW] tsconfig.json
- Identical compiler configuration to previous project.

#### [COPY] system-scripts.json
- Copied from the simple-transfer project for devnet script references.

---

### Core Script

#### [NEW] src/index.ts

The script will perform **three operations** in sequence:

**Operation 1 — WRITE: Store a text message on-chain**
1. Connect to the local OffCKB Devnet (switchable to public Testnet).
2. Convert a human-readable string (e.g., `"Hello CKB from embedded engineer!"`) to hex bytes using a `utf8ToHex()` helper function.
3. Construct a transaction with:
   - **Output cell:** Locked to the Sender's own address, with the hex-encoded message placed in the `outputsData` field.
   - The SDK will automatically calculate the minimum capacity needed to cover the data size.
4. Sign and broadcast the transaction.
5. Print the Transaction Hash.

**Operation 2 — READ: Retrieve the stored message from the chain**
1. Using the Transaction Hash from Operation 1, query the node for the specific cell.
2. Extract the raw hex bytes from the cell's `outputData` field.
3. Convert the hex bytes back to a human-readable UTF-8 string using a `hexToUtf8()` helper function.
4. Print the decoded message to the terminal.

**Operation 3 — CAPACITY ANALYSIS: Show the storage cost**
1. Display how many bytes the message occupies.
2. Show the total capacity locked in the cell (base overhead + data bytes).
3. Print a breakdown: `61 CKB (base) + N CKB (data) = Total CKB`.

### Key Helper Functions

| Function | Purpose | C Equivalent |
| :--- | :--- | :--- |
| `utf8ToHex(str)` | Convert a UTF-8 string to `0x`-prefixed hex bytes | `sprintf(buf, "%02x", char)` in a loop |
| `hexToUtf8(hex)` | Convert `0x`-prefixed hex bytes back to UTF-8 string | `sscanf(hex, "%02x", &byte)` in a loop |

---

## Proposed Project Structure

```text
ckb_journey/
└── projects/
    └── store-data/
        ├── package.json
        ├── tsconfig.json
        ├── system-scripts.json
        └── src/
            └── index.ts      # Write, Read, and Analyze on-chain data
```

---

## Verification Plan

### Automated Testing
1. Start local devnet: `offckb node` (user runs manually).
2. Run the script: `npm start` (user runs manually).
3. The script itself will verify the data round-trip by:
   - Writing a message to a cell.
   - Reading the message back from the chain.
   - Comparing the original string with the decoded string and printing a `[MATCH] Match!` or `[MISMATCH] Mismatch!` result.

### Manual Verification
- If running on the public Testnet, the user can paste the Transaction Hash into the CKB Explorer to visually inspect the `outputData` hex bytes stored in the cell.


