## Builder Track Weekly Report — Week 6

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 26 June 2026  

---

### Courses & Lessons Completed

1. **Lesson 14: iCKB Protocol (Liquid Staking Wrapper for Nervos DAO)**  
   Studied, designed, and implemented a high-fidelity TypeScript transaction simulation representing the **iCKB Liquid Staking Protocol** using the **CCC SDK**. Executed the simulation successfully against both our local `offckb` devnet and the public CKB Testnet.

---

### New Knowledge & Key Learnings (Plain English Explanations)

#### 1. Direct Staking (Nervos DAO) vs. Liquid Staking (iCKB)
* **Direct Staking (Illiquid):** Locks your CKB directly into the Nervos DAO for 30-day (180-epoch) cycles to earn inflation protection against state rent. Your funds are physically frozen; you cannot trade or spend them if you need emergency cash.
* **Liquid Staking (iCKB):** Keeps your underlying CKB locked inside the Nervos DAO (preserving inflation rewards) but hands you a **liquid Gold Warehouse Receipt** (the iCKB token), similar to how early paper money was backed 100% by physical gold locked in a vault. You can trade or sell this receipt immediately in the market for liquidity, while the real asset remains safely locked to secure the network.

#### 2. The CCC SDK's Silent Fallback Behavior
* **The Discovery:** We noticed that when our local `offckb node` was offline, the script still successfully executed and returned a massive block height (`#21539263`). 
* **The Cause:** The CCC SDK's `ClientPublicTestnet` class is designed to silently fall back to the public CKB Testnet over the internet if the local URL (`http://127.0.0.1:28114`) is unreachable. It does not throw an error.
* **The Solution:** We updated our script to perform a lightweight HTTP handshake on the local port first. This allows us to accurately detect and print the active network name (`Local Devnet` vs. `Public CKB Testnet`) in our telemetry console.

#### 3. Debugging Process Hanging in Node.js (Keep-Alive Sockets)
* **The Problem:** When running our script against the public testnet, the terminal would hang indefinitely upon completion instead of returning to the command prompt.
* **The Cause:** When connecting over the internet, the CCC SDK opens persistent TCP connections (Keep-Alive sockets) to keep the connection fast. In Node.js, a process will never exit as long as there are open sockets in the event loop.
* **The Solution:** We resolved this by adding explicit `process.exit(0)` and `process.exit(1)` calls at the end of the script to force the process to shut down and release all network sockets.

#### 4. Alignment of Nervos DAO Key Features
* Standardized our past Lesson 11 walkthrough and Week 4 report to include the exact Nervos DAO key features structure:
  * **Eligibility**: Minimum 102 CKB required to deposit.
  * **Deposit Cycle**: Roughly 30 days (180 epochs) minimum lock.
  * **Withdrawal Process**: Only at cycle boundaries; preparing early halts reward accrual.
  * **Interest Type**: Annual, compound, but variable relative to CKB supply.
  * **Security**: Smart contract-based, supported across all wallets.
  * **Compound Interest**: Benefits from automatic compounding without manual redeposits.

---

### Practical Progress & Verification

* **Lesson 14 Telemetry Verification**: Successfully ran the iCKB simulation against both our local devnet and the public CKB Testnet.
* **Math Accuracy**: 
  * Locked `500 CKB` at a live Accumulated Rate (AR) of `1.0008` (block `#21308`), minting `499 Shannons` of iCKB xUDT.
  * Redeemed the `499 Shannons` of iCKB at a future simulated rate of `1.085`, returning `541.415 CKB` (`500 CKB` principal + `41.415 CKB` compounding staking interest).

---

### Verification Logs

* **Lesson 14 Logs:** Saved in [lesson_14_ickb.log](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/logs/lesson_14_ickb.log)
* **Lesson 14 Walkthrough:** Saved in [14_ickb.md](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/14_ickb.md)
