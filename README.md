# CKB Builder's Journey

> A developer log and learning repository for the **[Nervos CKB Builders' Track](https://docs.google.com/document/d/1aFHXU1ZL1MyIbBAIVRjG6stqdWwPUPyHV90O1QNwY-M/)** — documenting my journey from embedded engineer to blockchain developer.

---

## Track Progress

| Level | Status | Topics |
|---|---|---|
| **Intro** | Done | CKB concepts, OffCKB setup, CKB Academy Lessons 1 & 2 |
| **Beginner** | In Progress | Transfer CKB, Store Data on Cell, Fungible Tokens, Simple Lock |
| **Intermediate** | Pending | Script dev course, sUDT, Nervos DAO, Spore/DOBs |
| **Advanced** | Pending | SSRI protocol, RGB++, xUDT, iCKB |

---

## Development Environment

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | v26+ | JavaScript runtime |
| **npm** | v11+ | Package manager |
| **OffCKB** | ≥ v0.4.0 | Local CKB Devnet & dev tooling |
| **CCC SDK** | ≥ v0.0.14 | JavaScript/TypeScript SDK for CKB dApps |
| **Rust** | latest stable | Smart contract (Script) development |

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
├── README.md                   # This file — overview and progress tracker
├── blockchain_intro.md         # Personal notes: blockchain for embedded engineers
├── weekly-logs/                # Weekly developer logs (required for the program)
│   ├── week-01.md
│   └── ...
└── projects/                   # Hands-on dApp and script projects
    ├── simple-transfer/        # Beginner: Transfer CKB between accounts
    ├── store-data/             # Beginner: Store data on a Cell
    ├── fungible-token/         # Beginner: Create a token (xUDT standard)
    └── simple-lock/            # Beginner: Custom lock script in Rust
```

---

## Weekly Developer Logs

Weekly logs are maintained in the [`weekly-logs/`](./weekly-logs/) directory,
published every week as required by the CKB Builders' Track.

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

> Full notes in [`blockchain_intro.md`](./blockchain_intro.md)

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
