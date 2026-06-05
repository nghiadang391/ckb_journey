# CKB Builder's Journey

> A developer log and learning repository for the **[Nervos CKB Builders' Track](https://docs.google.com/document/d/1aFHXU1ZL1MyIbBAIVRjG6stqdWwPUPyHV90O1QNwY-M/)** — documenting my journey from embedded engineer to blockchain developer.

---

## Track Progress

| Level | Status | Topics |
|---|---|---|
| **Intro** | Done | CKB concepts, OffCKB setup, CKB Academy Lessons 1 & 2 |
| **Beginner** | Done | Transfer CKB, Store Data on Cell, Fungible Tokens (xUDT), Simple Lock |
| **Intermediate** | Done | Molecule Serialization, Spore DOBs, JS-VM scripts, Rust sUDT contracts |
| **Advanced** | In Progress | SSRI protocol, RGB++, xUDT, iCKB |

---

## Development Environment

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | v26+ | JavaScript runtime for dApps and Jest tests |
| **npm** | v11+ | Package manager |
| **OffCKB** | ≥ v0.4.0 | Local CKB Devnet & dev tooling |
| **CCC SDK** | ≥ v0.0.14 | JavaScript/TypeScript SDK for CKB dApps |
| **Rust** | stable | Smart contract (Script) development |
| **RISC-V Target** | `riscv64imac-unknown-none-elf` | Rust compilation target for CKB-VM |
| **`riscv64-elf-gcc`** | GCC cross-compiler | GNU cross-linker for RISC-V build bindings |

### Quick Start — Local Devnet

```bash
# Install OffCKB globally
npm install -g @offckb/cli

# Start the local CKB blockchain node
offckb node

# In a separate terminal, view pre-funded test accounts
offckb accounts

# Reset the chain if needed
offckb clean
```

The local devnet runs at: `http://127.0.0.1:28114`

---

## Repository Structure

```
CKB/
├── README.md                     # Overview and progress tracker
├── ckb_journey/
│   ├── README.md                 # Journey-specific log and structures
│   ├── weekly_report/            # Weekly developer reports
│   │   ├── 1st_week/
│   │   ├── 2nd_week/
│   │   └── 3rd_week/
│   ├── implementation_plans/     # Implementation plan markdown records
│   ├── walkthroughs/             # Walkthrough guides and transaction logs
│   │   └── logs/
│   └── projects/                 # Hands-on dApp and script projects
│       ├── simple-transfer/      # Lesson 02: Transfer CKB between accounts
│       ├── store-data/           # Lesson 03: Store data on a Cell
│       ├── fungible-tokens/      # Lesson 04: Create custom xUDT assets
│       ├── simple-lock/          # Lesson 05: Cryptographic custom lock script
│       ├── molecule-serialization/ # Lesson 06: Molecule codecs and entities
│       ├── create-spore-dob/     # Lesson 07: Mint Spore digital objects (DOBs)
│       ├── ts-hello-world/       # Lesson 08: TypeScript smart contract (ckb-js-vm)
│       ├── ts-sudt/              # Lesson 09: TypeScript sUDT contract (ckb-js-vm)
│       └── rust-sudt/            # Lesson 10: On-Chain Rust sUDT contract (RISC-V)
```

---

## Weekly Developer Logs

Weekly logs are maintained in the [`weekly_report/`](./weekly_report/) directory, published every week as required by the CKB Builders' Track.

---

## Key Resources

| Resource | Link |
|---|---|
| CKB Builders' Track Handbook | [Google Doc](https://docs.google.com/document/d/1aFHXU1ZL1MyIbBAIVRjG6stqdWwPUPyHV90O1QNwY-M/) |
| Official Nervos Docs | [docs.nervos.org](https://docs.nervos.org) |
| CKB Academy | [academy.ckb.dev](https://academy.ckb.dev) |
| CCC SDK (JavaScript) | [GitHub](https://github.com/ckb-devrel/ccc) |
| OffCKB CLI | [npm](https://www.npmjs.com/package/@offckb/cli) |
| CKB Explorer (Testnet) | [pudge.explorer.nervos.org](https://pudge.explorer.nervos.org) |

---

## Key Concepts (TL;DR for Embedded Engineers)

- **Blockchain** = A globally distributed, append-only database (like a ROM shared across thousands of machines)
- **Smart Contract** = A RISC-V binary deployed on-chain, executed by every node (CKB-VM)
- **Wallet/Address** = SSH key pair — private key signs transactions, public key derives your address
- **Transaction** = A state transition: destroy old Cells → create new Cells
- **Cell** = CKB's memory model. Like `malloc`/`free` — you own chunks of on-chain storage

---

## Contact & Programme

- **Programme Director:** Neon
- **Funding:** [Spark Programme](https://ckbgrants.com/) / [CKB Community Fund DAO](https://dao.ckb.community/)
- **Discord Help:** [discord.gg/4Jcw8MwEEv](https://discord.gg/4Jcw8MwEEv)
