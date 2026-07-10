# CKB General Hurdles & Fiber Network Challenges

This document outlines the core difficulties of developing on Nervos CKB in general, and the specific challenges associated with the **Fiber Network** (a payment-channel network).

---

## 1. General CKB Hurdles

### Cell Contention (UTXO Model)
* **The Hurdle:** On CKB, state is stored in discrete Cells (UTXOs). Unlike account-based chains (like Ethereum) where multiple transactions can write to the same contract concurrently, once a CKB Cell is consumed in a transaction, it is destroyed. If two users try to update the same Cell simultaneously, one transaction will succeed and the other will fail with a "double spend" error.
* **Impact:** Off-chain coordination or partitioning state across multiple cells is required to prevent users from blocking each other.

### State Rent (Capacity Lock)
* **The Hurdle:** Storing data on-chain requires locking CKB (`1 CKB = 1 Byte`). Every cell has a minimum overhead of `61 CKB` for its descriptors (lock script, capacity fields, etc.).
* **Impact:** This creates a funding barrier. You cannot simply create a new user account or state cell for free; someone must provide the CKB capacity to lock up.

### Heavy Off-Chain Lifting
* **The Hurdle:** The CKB-VM is purely a validator. It does not calculate state; it only verifies that the state transition is valid. This means the client-side code (SDK) must do all the hard work: finding the right input cells, assembling the outputs, gathering the exact cell dependencies, and signing the transaction.
* **Impact:** If the client misses a single cell dependency, the transaction fails on-chain.

---

## 2. Specific Fiber Network Challenges

Fiber is an off-chain payment-channel network. It introduces hurdles that are very different from standard on-chain development:

### Inbound/Outbound Liquidity Constraints
* **The Hurdle:** If you open a channel and fund it with 100 CKB, you can send up to 100 CKB (outbound capacity). However, you have **zero inbound capacity**; you cannot receive any payments until you first spend some of your CKB, or until your channel partner funds their side.
* **Impact:** Managing this balance dynamically is a major user experience hurdle. Users do not want to think about "liquidity direction."

### The Online Requirement
* **The Hurdle:** Unlike on-chain transactions where you can receive funds while your wallet is offline, payment channels require both the sender and receiver (and all intermediate routing nodes) to be online to sign and exchange channel state updates.
* **Impact:** If a node goes offline during a transaction, the payment fails or gets stuck.

### Multi-Asset Routing & Swaps
* **The Hurdle:** Fiber supports CKB, stablecoins, and RGB++ assets. If a sender wants to pay in USD stablecoins, but the receiver only accepts CKB, the routing path must perform an atomic swap midway through the route.
* **Impact:** Finding paths that have the right asset liquidity and executing the swaps atomically is complex.

### Cross-Chain Timing (CKB vs. Bitcoin)
* **The Hurdle:** Linking Fiber to the Bitcoin Lightning Network requires coordinating HTLCs (Hashed Time-Locked Contracts) across two chains with vastly different block times (10-second blocks on CKB vs. 10-minute blocks on Bitcoin).
* **Impact:** Setting the expiration times correctly is critical to prevent funds from being locked up for too long if a node fails.
