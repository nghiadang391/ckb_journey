# CKB Advanced Track: Technical Brief & Next Steps

This document outlines the four upcoming advanced topics in the CKB Builders' Track, comparing their scope, dependencies, and integration models.

---

## Topic Briefs

### 1. SSRI (Script-Sourced Rich Information)
SSRI is an interface standard for CKB smart contracts. It functions as an on-chain/off-chain ABI, enabling external tools and scripts to query contract capabilities dynamically instead of hardcoding target outpoints.

*   **Analogy:** **An interactive touchscreen menu on a vending machine.** Instead of having to guess which buttons do what, the machine itself presents a standard screen explaining its functions (like checking your balance or transferring items). Any customer (wallet or explorer) can walk up, read the screen, and interact with it without needing a manual.
*   **Prerequisites:** Rust contract development (Lesson 10).
*   **Implementation Target:** Modify the Rust sUDT script from Lesson 10 to implement the SSRI `UDT` trait, exposing its metadata and validation methods via `argv`.

### 2. xUDT Advanced Patterns
The "x" in xUDT stands for Extensible. This topic covers the implementation of extension scripts—custom validation logic (e.g., blocklists, supply caps, admin-controlled pause flags) chained onto standard token transactions.

*   **Analogy:** **An airport security checklist.** The base token contract checks if you have a valid ticket (balance conservation). The extension scripts are like security checkpoints along the way (checking blocklists, scanning bags, verifying permissions) that can veto the transfer before the transaction is finalized.
*   **Prerequisites:** xUDT (Lesson 04), Rust (Lesson 10).
*   **Implementation Target:** Deploy a custom extension script (like a pausable/freezable token) and chain it into an xUDT cell lock sequence.

### 3. iCKB Protocol
iCKB is a liquid staking protocol that wraps native Nervos DAO deposits.

*   **Analogy:** **A cloakroom coat-check ticket.** When you lock a valuable coat (your CKB) in the cloakroom for the season (locked in Nervos DAO), you receive a ticket (iCKB token). Instead of waiting for winter to end to get your coat back, you can trade or sell the ticket to someone else, who can later use it to redeem the coat plus interest.
*   **Prerequisites:** Nervos DAO (Lesson 11), xUDT (Lesson 04).
*   **Implementation Target:** Inspect the pool settlement code and write a script to deposit CKB, mint iCKB, and handle withdrawal redemption math.

### 4. RGB++ Protocol
RGB++ maps Bitcoin UTXOs to CKB Cells via isomorphic binding, running Turing-complete contracts on CKB to manage Bitcoin assets without cross-chain bridges.

*   **Analogy:** **A property deed mapped to a physical house.** Bitcoin is the physical house (highly secure but slow/hard to remodel). CKB is the public land registry database (fast and supports smart contracts). Whenever you buy or transfer the physical house on Bitcoin, the deed registry on CKB automatically updates, letting you use CKB's smart contracts to rent, borrow against, or divide the house ownership.
*   **Prerequisites:** Full understanding of the CKB cell model and the Bitcoin UTXO/commitment model.
*   **Implementation Target:** Use the `@rgbpp-sdk/btc` and `@rgbpp-sdk/ckb` packages to construct a virtual CKB transaction, commit its hash via an OP_RETURN on the Bitcoin blockchain, and verify the resulting binding.

---

## Suggested Path

SSRI is the logical starting point. It extends your Rust sUDT codebase from Lesson 10 and has no external blockchain dependencies (unlike RGB++ which requires Bitcoin testnet orchestration).

```
[Lesson 10 Rust] ──→ [SSRI Interface] ──→ [xUDT Extensions] ──→ [iCKB / RGB++]
```

### Plan Details
1.  **Phase 1 (SSRI):** Upgrade the Lesson 10 Rust contract to compile with the `ckb-ssri-std` crate.
2.  **Phase 2 (xUDT Advanced):** Write an extension script that intercepts xUDT transfers.
3.  **Phase 3 (iCKB & RGB++):** Setup a local testnet environment or use mock headers to simulate the Bitcoin SPV client validation on CKB.

