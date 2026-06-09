# Lesson 07: Spore DOB Creation (create-dob)

This lesson explores the Spore Protocol on CKB, demonstrating how to mint and retrieve Digital Object Bytes (DOBs) directly from cells.

---

## Under-the-Hood: The Embedded Analogy

In typical high-level architectures, when an application needs to store a media file (like an image or audio clip) referencing an asset (such as an NFT), it stores a URI pointing to a central server or IPFS. If the server goes down, the asset is lost.

In CKB, because the cell model acts as a direct, distributed global memory pool (`malloc` and `free`), we can write the **entire binary payload** of our file directly into on-chain memory. **Spore DOBs** are like flashing raw media binary configurations directly into dedicated sector segments of a persistent EEPROM block on-chain. When you own the cell capacity, you physically own the storage containing the raw asset bits, and no third party can modify or delete it.

---

## Proposed Changes

We will create a new project under `ckb_journey/projects/07_create_spore_dob/` that compiles and runs a clean, telemetry-style CLI runner.

### Component: Spore DOB Project

#### [NEW] [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/07_create_spore_dob/package.json)
Establishes project specifications and loads dependencies: `@spore-sdk/core`, `@ckb-ccc/core`, and typical developmental scripts.

#### [NEW] [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/07_create_spore_dob/tsconfig.json)
Configures TypeScript module paths.

#### [NEW] [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/07_create_spore_dob/src/index.ts)
Our main runner script which will perform:
1. **Part 1 (Mint)**: Reads a sample asset file from the local disk, builds the Spore skeleton with `@spore-sdk/core`, and broadcasts the transaction to create a DOB cell on the local devnet.
2. **Part 2 (Verify)**: Query the live DOB cell directly from CKB JSON-RPC, extract the binary payload using the `unpackToRawSporeData` decoder, and assert content equivalence.

---

## Verification Plan

### Manual Verification
1. Navigate to the new project directory:
   `cd ckb_journey/projects/07_create_spore_dob`
2. Install workspace dependencies:
   `npm install`
3. Run the script:
   `npm start`
4. The console output must log the transaction hash, the unique Spore on-chain ID, and print a successful verification report confirming the retrieved file type and content match.
