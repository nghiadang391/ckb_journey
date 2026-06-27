## Builder Track Weekly Report — Week 7

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 3 July 2026  

---

### Courses & Lessons Completed

1. **Lesson 15: RGB++ Protocol & Isomorphic Binding Simulation**  
   Designed and implemented a TypeScript simulation script representing the **RGB++ Protocol** and its core mechanism, **Isomorphic Binding**, using the **CCC SDK**. We simulated constructing a virtual CKB transaction, calculating its Double-SHA256 commitment hash, binding it to a simulated Bitcoin UTXO, and verifying the resulting binding via an `OP_RETURN` script inside a simulated CKB-VM environment.

---

### New Knowledge & Key Learnings (Plain English Explanations)

#### 1. Bitcoin UTXOs (Unspent Transaction Outputs)
* **The Concept:** Bitcoin does not use accounts with balances. Instead, a user's wallet contains a collection of individual, unspent digital transaction outputs (UTXOs).
* **The Analogy:** UTXOs act exactly like **physical paper cash bills** in a wallet. If you want to spend money, you must select entire bills (inputs), spend them completely, and receive any leftover change back as a brand new bill (output). You cannot tear a bill in half.

#### 2. Why RGB++ is Needed (Bridge-less Design)
* **The Problem:** Bitcoin is highly secure but cannot execute complex smart contracts natively. Historically, users had to use **Bridges** (locking real Bitcoin in a third-party vault and printing a synthetic copy on another chain), which are highly vulnerable to hacks.
* **The Solution:** RGB++ binds a CKB smart contract cell (which acts as a digital property deed) directly to a Bitcoin UTXO. When you spend the Bitcoin UTXO on the Bitcoin network, the CKB cell automatically updates its state in lockstep. This allows you to run smart contracts on your Bitcoin assets without trusting centralized bridge vaults.

#### 3. Scope of RGB++
* **The Context:** RGB++ is **only** needed when you are working with assets on Bitcoin (or other UTXO-based chains like Litecoin or Dogecoin).
* **Native CKB Apps:** If you are building a native application exclusively for CKB (e.g., a native CKB token or DeFi protocol), you **do not** need RGB++.

#### 4. Dual-Core IPC Handshake Analogy
We mapped the isomorphic binding mechanism to a dual-core microcontroller system:
* **Core A (Bitcoin):** A highly secure but slow TPM co-processor that holds master keys (UTXOs).
* **Core B (CKB):** A fast application processor running smart contracts.
* **Handshake:** Core B writes transaction parameters, calculates a checksum hash (commitment), and triggers Core A to log it in a secure status register (`OP_RETURN`). Core B's Memory Protection Unit (`RgbppLock`) only releases memory cells if it verifies the matching checksum in Core A's register.

---

### Practical Progress & Verification

* **Simulation Project Scaffolded:** Scaffolding complete with custom dependency settings, TS module configuration, and execution files.
* **Successful Execution:** Verified that the computed CKB virtual transaction commitment matches the simulated Bitcoin `OP_RETURN` payload, resulting in a successful simulated validation run.

---

### Verification Logs

* **Lesson 15 Logs:** Saved in [lesson_15_rgbpp.log](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/logs/lesson_15_rgbpp.log)
* **Lesson 15 Walkthrough:** Saved in [15_rgbpp.md](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/15_rgbpp.md)
