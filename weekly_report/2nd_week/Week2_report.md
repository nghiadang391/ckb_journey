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

- Successfully implemented and verified **five robust developer exercises** in the local workspace.
- Structured all workspace logging outputs to utilize clean, telemetry-style text brackets.
- Created local, version-controlled implementation plans and walkthrough verification files for all advanced modules.
