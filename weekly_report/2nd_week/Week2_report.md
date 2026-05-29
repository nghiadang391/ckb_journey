## Builder Track Weekly Report — Week 2

**Name:** Vo Duy Tuan Ngoc
**Week Ending:** 29 May 2026

### Courses Completed

- Below is what I have learned and implemented this week:
  - **Lesson 02: Simple CKB Transfer**: Programmed a bare-metal state transition utilizing the CCC SDK to consume existing input cells and allocate new capacity cells to a receiver on the local devnet and testnet.
  - **Lesson 03: Store Data on Cell**: Mastered the core concept of state storage costs on CKB (where 1 CKB capacity covers 1 byte of state memory). Programmed write, read, and capacity breakdown analysis scripts.
  - **Lesson 04: Fungible Tokens (xUDT)**: Implemented extensible user-defined tokens (xUDT) and created supplementary metadata cells on-chain representing decimals, symbol, and name parameters.
  - **Lesson 05: Custom Lock Script**: Built a custom cryptographical Hash Lock contract using TypeScript compiled down to RISC-V bytecode via `ckb-js-vm`, testing spend permissions on local devnet.
  - **Lesson 06: Molecule Serialization**: Explored CKB's native binary serialization standard using the CCC codec interfaces, validating primitive types, fixed-layout structs, and decorator-based Entity classes.
  - **Lesson 07: Spore DOB Creation**: Minted Digital Object Bytes (DOBs) directly on-chain using the Spore SDK, bypassing centralized servers or IPFS, and retrieved binary payloads natively via JSON-RPC.

### Key Learnings

- **Distributed State Capacity**: Deep understanding of base overhead sizes (61 CKB lock scripts) and dynamic data costs inside the cell model.
- **CKB JavaScript VM (ckb-js-vm)**: A major milestone learned this week. Instead of setting up complex Rust RISC-V compilation toolchains, `ckb-js-vm` hosts an on-chain QuickJS engine. We wrote smart contracts in **TypeScript**, compiled them to lightweight JS bytecode (`.bc`), and ran them natively inside CKB's RISC-V virtual machine. Learned strict embedded constraints like replacing Node's global `Buffer` API with standard `Uint8Array` allocations to prevent CKB-VM memory crashes.
- **Molecule Binary Codecs**: Mapping arrays, vectors, options, and tables natively to simulate packed C structs and hardware telemetry frames.
- **Spore Protocol DOBs**: Physical data ownership on CKB global cells with built-in capability recovery features.

### Practical Progress

- Successfully implemented and verified **six robust developer exercises** in the local workspace (Lessons 02–07).
- Structured all workspace logging outputs to utilize clean, telemetry-style text brackets.
- Created local, version-controlled implementation plans and walkthrough verification files for all modules.

### On-Chain Verification (Pudge Testnet)

The following lessons broadcast real transactions to the **CKB Pudge public testnet** and can be independently verified via the Nervos Explorer:

**Lesson 03 — Store Data on Cell**
- Network: Pudge Testnet
- Operation: Write UTF-8 message `"Hello CKB from an embedded developer! Lesson 03 completed."` (58 bytes) into a new cell data field
- Capacity locked: 119 CKB (61 CKB base + 58 CKB data)
- Transaction: `0x85ed860a14462a0137e6113b8d261a7e960a74f9a61bdc5a2cfd61009dc05bde`
- Explorer: https://pudge.explorer.nervos.org/transaction/0x85ed860a14462a0137e6113b8d261a7e960a74f9a61bdc5a2cfd61009dc05bde

**Lesson 04 — Fungible Tokens (xUDT)**
- Network: Pudge Testnet
- Token: `xNGOCVO` ("Ngoc's Extensible Token"), decimals: 8, total minted: 1,000,000 tokens
- Token Type Args: `0x0abf028eb7f3927ac1ee9761fb650b60f16ea4c25e6a076db1cd94eff954b41300000000`
- Mint Transaction: `0xcd4429a6b47c46952277312dde12bac9ea26b31da40e11606fd3ea131db0a469`
  - Explorer: https://pudge.explorer.nervos.org/transaction/0xcd4429a6b47c46952277312dde12bac9ea26b31da40e11606fd3ea131db0a469
- Transfer Transaction (250,000 tokens to Receiver): `0x9ebf8ccb96f54692ad5a3015f00f452b89d44c329c419963d8761bae30591e1b`
  - Explorer: https://pudge.explorer.nervos.org/transaction/0x9ebf8ccb96f54692ad5a3015f00f452b89d44c329c419963d8761bae30591e1b
- Token Metadata Cell Registration: `0x2d276b45ea82c6ce0afe2c121ecae07e16cfe19e9b40c6cf4cebe6c4e577d460`
  - Explorer: https://pudge.explorer.nervos.org/transaction/0x2d276b45ea82c6ce0afe2c121ecae07e16cfe19e9b40c6cf4cebe6c4e577d460

> Lessons 02, 05, 06, and 07 executed against the local offckb devnet and do not produce public on-chain traces.
