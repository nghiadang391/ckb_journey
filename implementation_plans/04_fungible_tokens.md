# Implementation Plan — Lesson 4: Fungible Tokens (xUDT) & Metadata

## Background

In Lesson 3, we stored raw text data in a cell's `data` field. Now, in Lesson 4, we will learn how to issue and transfer **Fungible Tokens** on CKB using the **xUDT (Extensible User Defined Token)** standard, and how to create a **Metadata Cell** on-chain for standard wallet/explorer visualization!

This lesson is divided into two parts:
* **Part 1 — Core xUDT mechanics**: Minting the core token supply, querying balances, and transferring custom tokens between wallets using the CCC SDK.
* **Part 2 — Token Branding & Metadata**: Packaging and storing custom metadata for your own token on the blockchain:
  * **Name**: `Ngoc's Extensible Token`
  * **Symbol**: `xNGOCVO`
  * **Decimals**: `8` (standard for CKB)
  * **Description**: `My first custom token on Nervos CKB!`

---

## Technical Specifications

### 1. Core Token Cell (xUDT)
* **Type Script**: `xUDT` system script.
* **Args**: `lock_script.hash() + "00000000"`.
* **Data Field**: A 128-bit unsigned integer (16 bytes) in **little-endian** format representing the balance.

### 2. Token Metadata Cell
To make the token recognizable by on-chain browsers and wallets, we will create a supplementary cell containing custom metadata with the following structure:
* **Type Script**: `UniqueType` script (enforces a single unique instance of this metadata).
* **Data Field**: Packed binary structure of:
  * `decimals`: 1 byte (`uint8`)
  * `symbol_len`: 1 byte (`uint8`)
  * `symbol`: Variable length UTF-8 string
  * `name_len`: 1 byte (`uint8`)
  * `name`: Variable length UTF-8 string

---

## Proposed Changes

### Project Setup

#### [NEW] package.json
- Located at `ckb_journey/projects/04_fungible_tokens/package.json`
- Similar to Lesson 3, with dependency `@ckb-ccc/core`, `tsx`, and `typescript`.

#### [NEW] tsconfig.json
- Located at `ckb_journey/projects/04_fungible_tokens/tsconfig.json`
- Identical TypeScript compiler config.

#### [COPY] system-scripts.json
- Copied from `store-data` for devnet script references.

---

### Core Script

#### [NEW] src/index.ts

The script will execute two parts:

### Part 1: Core xUDT Mechanics
1. **ISSUE (Mint)**: Connect to the public Testnet, compile custom `xudtArgs` linked to the Sender's Lock Script, and issue `1,000,000` tokens using `ccc.numLeToBytes`.
2. **BALANCE QUERY**: Scan the blockchain for live cells matching our xUDT script and print the Sender's balance.
3. **TRANSFER**: Transfer `250,000` tokens to the Receiver address. Automatically gather inputs with `tx.completeInputsByUdt`, generate the change cell returning leftovers back to the Sender, and broadcast.

### Part 2: Custom Metadata Integration (xNGOCVO)
1. **SERIALIZE**: Implement a custom helper `tokenInfoToBytes(decimals, symbol, name)` to tightly pack `decimals` (8), `symbol` (`xNGOCVO`), and `name` (`Ngoc's Extensible Token`) into the on-chain specification layout.
2. **BROADCAST METADATA**: Construct a metadata cell holding this byte array, lock it under the Issuer's script, and broadcast the transaction.
3. **READBACK**: Retrieve the metadata cell from the blockchain, parse the bytes back to readable properties, and print a custom dashboard verifying your new branded token!

---

## Proposed Project Structure

```text
ckb_journey/
└── projects/
    └── fungible-tokens/
        ├── package.json
        ├── tsconfig.json
        ├── system-scripts.json
        └── src/
            └── index.ts      # Core xUDT operations & xNGOCVO metadata
```

---

## Verification Plan

### Automated Testing
1. Install dependencies and run: `npm start` (user runs manually).
2. The script will output:
   - Part 1 success: Mint and Transfer balance updates.
   - Part 2 success: Serializing, writing, reading, and parsing the brand metadata on-chain!


