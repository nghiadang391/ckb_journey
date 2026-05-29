# Walkthrough — Lesson 04: Fungible Tokens (xUDT) & Metadata

We have successfully created and executed the Fungible Tokens project. This project mints a custom token supply using the xUDT standard, manages token transfers, and registers standard branded metadata on-chain.

---

## Codebase Additions

We created the following files inside the project directory:
* [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/fungible-tokens/package.json): Project specifications.
* [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/fungible-tokens/tsconfig.json): TypeScript specifications.
* [system-scripts.json](file:///Users/nghiadang/CKB/ckb_journey/projects/fungible-tokens/system-scripts.json): Ref scripts.
* [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/fungible-tokens/src/index.ts): The main token operations runner:
  * Part 1 (xUDT): Computes unique xUDT script arguments, mints a total supply of 1,000,000 tokens to the issuer, and executes a transfer of 250,000 tokens to a receiver address.
  * Part 2 (Branding): Packages and serializes metadata (decimals: 8, symbol: xNGOCVO, name: Ngoc's Extensible Token) into standard binary cells locked to the issuer address to register standard brand identification.

---

## Verification Results

Our script executed successfully on the public Testnet:

1. **xUDT Mint & Query**:
   * Minted core token supply successfully.
   * Query balances using custom little-endian parsers confirmed the exact balance ledgers of 1,000,000 tokens.

2. **UDT Transfer**:
   * Broadcasted a transfer transaction.
   * CCC completed input UDT gathering and calculated correct change cells returning the remaining balance to the issuer.
   * Confirmed ledger state: Sender balance became 750,000 tokens, Receiver balance became 250,000 tokens.

3. **Metadata Dashboard**:
   * Packed metadata parameters correctly.
   * Created the metadata cell and read it back from the blockchain.
   * Decoded binary properties back to original attributes and printed a clean branded dashboard verifying symbol `xNGOCVO` and name `Ngoc's Extensible Token`.
