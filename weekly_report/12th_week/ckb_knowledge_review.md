# CKB Journey — Personal Knowledge Review (Week 1–12)

*Cross-referenced against `nervosnetwork/ckb` and `nervosnetwork/fiber` official docs — 8 August 2026*

---

## What I covered so far

| Week | Topic | How deep |
|------|-------|----------|
| 1–2 | Blockchain basics, CKB devnet setup, simple transfer | Just getting started |
| 3 | Data cells, capacity math (61 CKB base + 1 CKB/byte) | Solid |
| 4 | Nervos DAO lifecycle (Deposit → Prepare → Claim), epoch math, Rust basics | Solid |
| 5 | Custom lock scripts, QuickJS VM, Blake2b preimage auth | Good |
| 6 | Molecule serialization, iCKB liquid staking, CCC SDK quirks | Good |
| 7 | RGB++ isomorphic binding, Bitcoin UTXO model | Good |
| 8 | Fiber Layer 2 architecture, TlcErr RPC flattening issue | Went deep |
| 9 | Integration tests, FNN hex encoding quirks, static JSON fallback | Went deep |
| 10 | Modular refactor, stats panel, node alias resolution | Went deep |
| 11 | BFS route fee estimation, PPM fee math | Went deep |
| 12 | FNN v0.8.1 schema fixes, probe classification, Ubuntu deployment | Went deep |

---

## Things I haven't covered / should still learn

### 1. How the mempool actually works

I know how to build and send transactions with CCC SDK, but I never really dug into what happens in the mempool.

- **No RBF on CKB** — once a transaction is broadcast with a low fee, you can't bump it. It either gets confirmed or eventually evicted. Unlike Ethereum, there's no replace-by-fee.
- **Minimum relay fee** — confirmed in the official `ckb.toml` config: `min_fee_rate = 1_000 # shannons/KB`. The formula is `fee / (1000 * tx_size_in_bytes)`. If you go below this, the node rejects the transaction with an explicit error (`PoolRejectedTransactionByMinFeeRate -1104`). I originally thought it was a silent drop — it's not.
- **CPFP** — you can spend an unconfirmed output in a new transaction at a higher fee to incentivize miners to pull in the parent. Good to know if a tx gets stuck.
- **`estimate_cycles` RPC** — CKB has an official RPC to pre-estimate how many cycles a transaction will consume before submitting it. I should use this when working with expensive scripts.

---

### 2. Lock scripts I haven't touched

I built a custom Blake2b passphrase lock in Week 5 which was a good exercise, but there are important lock patterns I haven't worked with yet.

- **Omnilock** — this is the lock that every real wallet (JoyID, Neuron, MetaMask-CKB) actually uses. It supports SECP256K1, Ethereum addresses, WebAuthn/passkeys, multisig, and time-lock modes through a single configurable `args` layout. If I build a dApp for real users, they'll be holding Omnilock cells — so I need to understand how to unlock them.
- **`since` field (time locks)** — I used `since` in Week 4 only for DAO maturity epochs. But `since` is a general-purpose input modifier that supports block height, epoch, and timestamp modes. Useful for vesting, escrow, or any timed release.
- **Type ID pattern** — a way to give a script cell a stable, globally unique identifier even after its code is updated. Without this, if I update a deployed contract, every cell locked under the old code hash becomes un-unlockable. This is critical to understand before putting anything on testnet or mainnet.

---

### 3. Multi-sig wallets

Never covered this at all. CKB has a native `multisig-lock` script where the `args` field encodes the threshold config like `[required_first_n, threshold, pubkey_count, ...pubkey_hashes]`. A 2-of-3 setup means any two of the three registered keys need to co-sign to unlock. Relevant for things like team treasury, shared custody, or DAO voting.

---

### 4. Production script deployment

I deployed Rust scripts in weeks 9–12 but didn't look into how production deployments are structured:

- **Dep Group** — common system scripts (like `secp256k1_blake160`) are grouped into a single dep cell so you don't have to repeat them in every transaction's `cellDeps`. Reduces transaction size and fees.
- **Upgradeable scripts via Type ID** — same as what I mentioned above, but the deployment side: how you actually set up the initial deploy and how you push updates without breaking existing cells.

---

### 5. What CCC SDK does under the hood for cell collection

I've been relying on the SDK's automatic coin selection without knowing what happens when it doesn't work:

- **Minimum capacity per cell** — it's not always 61 CKB. The actual minimum is `61 + data_size + lock_args_size + type_args_size`. Locks with big args (like Omnilock with passkey) push this up.
- **ckb-indexer is a separate process** — the SDK's `getLiveCells()` calls depend on a sidecar indexer service. If it's not running alongside the CKB node, queries come back empty. Ran into a version of this confusion in Week 6 with the CCC fallback.
- **Short vs full address format** — `ckb1q...` short addresses encode only SECP256K1 locks. Full addresses encode any lock script. They look similar but are different and mixing them up causes subtle issues.

---

### 6. CKB VM cycle limits in practice

I measured cycles carefully in Weeks 8–10 (QuickJS ~13.3M vs Rust ~17K) but didn't connect this to the actual network constraints:

- There is a **hard block-level cycle cap** (~3.5 billion cycles on mainnet). Transactions that push over it are simply rejected by the network — not slowed down, just invalid.
- Individual transactions have their own limits too, enforced at the relay layer.
- The practical concern: if a QuickJS contract consumes 13.3M cycles per cell and a batch transaction touches many cells, total cycles stack up fast. I should benchmark worst-case multi-cell scenarios before deploying anything computationally heavy.

---

### 7. Fiber stuff I didn't get to

#### HTLC vs PTLC

Fiber currently uses **HTLCs** — I tested these through payment probing. The privacy issue with HTLCs is that the same payment hash appears at every hop, so intermediate routing nodes can correlate multiple hops as part of the same payment. **PTLCs** (Point Time-Locked Contracts) solve this with Schnorr adaptor signatures where each hop sees a different "point", so no hop can link the payment to any other hop. FNN is working toward PTLC support — good to be aware of.

#### Channel rebalancing

This was listed as future work in the project but it turns out FNN already has it documented and implemented:

- **Automatic** — call `send_payment` with `target_pubkey` set to your own node's pubkey and `allow_self_payment: true`. The routing algorithm finds a circular path by itself.
  ```json
  { "target_pubkey": "<my_pubkey>", "amount": "0x5F5E100", "keysend": true, "allow_self_payment": true }
  ```
- **Manual** — use `build_router` to define exact hops, then `send_payment_with_router` to force the payment through that specific path. More control, but requires knowing the network topology.

Worth experimenting with this on my local test setup.

#### Watchtowers

My diagnostics tool monitors channel health but I never looked at what happens if a counterparty tries to cheat — broadcasting an old revoked state. A **watchtower** watches the chain and, if it sees a revoked commitment transaction, automatically submits a penalty transaction to take all the channel funds. FNN has basic watchtower support. For any real node deployment this matters.

---

### 8. Tools I haven't really used

| Tool | What it does | Why I should learn it |
|------|-------------|----------------------|
| **ckb-cli** | Raw RPC and wallet CLI | Useful for interacting with the node directly without the SDK abstraction layer |
| **Omnilock** (as a library) | Universal lock used in production | Need to understand how to build transactions that interact with real wallet users |
| **Molecule codegen** | Generates typed Rust/TS bindings from `.mol` files | I manually serialized data in Week 6; for more complex schemas, codegen is the right approach |
| **Lumos** (legacy SDK) | Older transaction builder | Shows up in a lot of community tutorials and examples; important to recognize it and know CCC is the modern replacement |
| **ckb-debugger (Rust mode)** | Step-debug Rust script execution locally | I only used it for QuickJS bytecode; never explored it for debugging native Rust contracts |

---

## What to prioritize next

| Priority | Topic | Why |
|----------|-------|-----|
| High | **Omnilock** | Real wallet users have Omnilock cells. Can't build a usable dApp without understanding this. |
| High | **Type ID pattern** | I need this before deploying any real contract — otherwise updates break existing cells. |
| Medium | **HTLC vs PTLC** | Good to understand the privacy tradeoffs in Fiber's routing, especially if I keep working on network tooling. |
| Medium | **VM cycle limits** | Need to run worst-case benchmarks before putting any QuickJS-based contracts in production. |
| Lower | **Multi-sig** | Good for governance or shared treasury use cases. Not urgent yet. |
| Lower | **Watchtower config** | Would matter if I ran a production Fiber node. |
| Lower | **Channel rebalancing** | Already exists in FNN — worth trying on the test setup when I get time. |
