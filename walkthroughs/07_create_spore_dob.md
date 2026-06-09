# Walkthrough — Lesson 07: Spore DOB Creation (create-dob)

We have successfully created and executed the Spore DOB Creation project. This lesson demonstrates how to mint persistent binary payloads natively inside cells on-chain and retrieve/verify them.

---

## Codebase Additions

We created the following files inside the new project directory:
* [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/07_create_spore_dob/package.json): Project dependencies including `@spore-sdk/core` and CLI scripts.
* [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/07_create_spore_dob/tsconfig.json): TypeScript compilation specs.
* [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/07_create_spore_dob/src/index.ts): The Spore minting and verification script:
  * **Part 1 (Mint)**: Reads a local asset file, builds the Spore skeleton with `@spore-sdk/core`, and broadcasts the transaction to create a DOB cell on the local devnet.
  * **Part 2 (Verify)**: Query the live DOB cell directly from CKB JSON-RPC, extract the binary payload using the `unpackToRawSporeData` decoder, and assert content equivalence.

---

## Verification Results

Our script executed successfully and printed high-fidelity telemetry logs:

1. **Part 1 (Mint)**:
   * Instantiated private keys and checked native CKB balances.
   * Successfully constructed transaction skeletons using the Spore SDK.
   * Minted a Spore DOB on-chain with unique ID `0xa482a9a48afe9c7f5dbfb96cb5295b8bfde12348fc2ebb1d00f06a9cfeb933c0`.

2. **Part 2 (Verify)**:
   * Successfully polled transaction block inclusion until committed.
   * Retrieved live cell data, decoded the raw binary hex back to string content, and asserted `Content Match: YES` successfully.
