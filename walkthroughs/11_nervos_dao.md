# Lesson 11: Nervos DAO — The Inflation Shelter and State Rent

Before writing the transaction scripts, it is essential to understand the core concepts behind the **Nervos DAO** and why it exists.

---

## 1. What is the Nervos DAO?

The **Nervos DAO** is an on-chain smart contract (deployed at genesis) that acts as an **inflation shelter** for CKB token holders. By locking your CKB in the DAO, you receive a share of the CKB inflation, preserving your token value against dilution.

---

## 2. Why does CKB have inflation (Secondary Issuance)?

Unlike Bitcoin, which only has a fixed block reward (Primary Issuance), CKB has two types of token creation:

1. **Primary Issuance**: Shipped with a halving schedule (similar to Bitcoin) to reward miners for securing the network.
2. **Secondary Issuance**: A flat rate of **1.344 billion CKB** minted every single year. 

### The State Rent Problem
On CKB, **1 CKB capacity = 1 byte of storage space**. 
If someone buys CKB, writes data on-chain once, and leaves it there forever, they occupy physical SSD storage space on all validator nodes indefinitely. Without secondary issuance, state storage would be a one-time fee, leading to an unsustainable, ever-expanding state size.

To solve this, CKB charges **State Rent**:
- If you use CKB to store data, your cells are occupied. 
- The inflation from the **Secondary Issuance** dilutes the value of your occupied CKB. This dilution is effectively the "state rent" you pay to miners for storing your data.

---

## 3. The Role of the Nervos DAO: Shelter for Non-Storeholders

What if you are a long-term investor holding CKB but **not storing any data**? You are not occupying any SSD space, so you shouldn't have to pay state rent.

* If you keep CKB in your normal address, your holdings are diluted by the Secondary Issuance.
* If you **deposit your CKB into the Nervos DAO**, CKB automatically calculates and pays you a portion of the Secondary Issuance. This interest payment matches the inflation rate exactly, shielding you from dilution.

---

## 4. 🛠️ The Embedded Analogy: Dynamic Storage vs. Cache Rent

Think of CKB as a **Microcontroller's volatile RAM and flash memory storage**:

* **Occupied Cell (Data Storage)** -> Allocating memory statically (e.g., `static char buffer[1024];`). This takes up hardware space forever, so the system charges a continuous runtime power cycle cost (inflation dilution).
* **Nervos DAO** -> Releasing static memory back into the dynamic pool. Because you released the hardware resource, the system rewards you by giving you "unused capacity rebates" (DAO rewards) to protect your allocation budget.
* **The 180-Epoch Cycle** -> A hardware **Watchdog Timer**. The co-processor locks your memory segments in fixed blocks. You can only safely release and claim the memory rebate at the tick boundary of the watchdog cycle.

---

## 5. Codebase Additions

The following files were created and configured in the project directory [projects/11_nervos_dao](file:///Users/nghiadang/CKB/ckb_journey/projects/11_nervos_dao):
* [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/11_nervos_dao/package.json): Handles dependencies (TypeScript, TSX runner, CCC SDK) and run targets (`npm start`).
* [system-scripts.json](file:///Users/nghiadang/CKB/ckb_journey/projects/11_nervos_dao/system-scripts.json): Local CKB script paths updated to target user paths (`/Users/nghiadang/...`).
* [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/11_nervos_dao/src/index.ts): The script automating the DAO lifecycle steps:
  * **Step 1 (Deposit)**: Creates a cell with the `NervosDao` type script and 8 bytes of zeroes in output data.
  * **Step 2 (Prepare/Withdraw)**: Consumes the deposit cell as input, referencing the deposit block hash in `headerDeps`, and outputs a withdrawing cell with the deposit block number written to its data in little-endian.
  * **Step 3 (Simulation & Claim)**: Computes the deposit/withdraw epochs, calculates the claim maturity epoch (adding 180-epoch intervals to the deposit epoch), computes interest profits using the CKB DAO accumulator indexes, and outputs final transaction parameters.

---

## 6. Verification Results

The entire 3-step DAO lifecycle was successfully verified on the local `offckb` devnet (telemetry saved in [lesson_11_nervos_dao.log](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/logs/lesson_11_nervos_dao.log)):

1. **Step 1: DAO Deposit**
   * Deposit transaction broadcasted and committed:
     * **Tx Hash**: `0x2adc4accd0988dfb4610d5643d44626e2a0584c84ae0761328ce1727f6f1e2a0`
     * **Committed block**: `#15445`
   
2. **Step 2: Request Withdrawal (Prepare)**
   * Prepare transaction broadcasted and committed:
     * **Tx Hash**: `0xdf0a13c102a27b4599c311b2eae8e300356a5e6539f5e5805302a36665fa7a47`
     * **Committed block**: `#15448`

3. **Step 3: Simulate Claim & Epoch Math**
   * Calculated values and parameters:
     * **Deposit Epoch**: `902500000`
     * **Withdraw Epoch**: `902666666`
     * **Maturity Epoch**: `18902500000` (Calculated using watchdog 180-epoch cycle logic)
     * **Profitable Base Capacity**: `199.99999931 CKB` (Principal minus script overhead)
     * **Earned Interest Profit**: `2207.85088248 CKB` (Calculated dynamically via DAO accumulator indexes)
     * **Since Value (Hex Lock)**: `"2307822130898665661"` (Locks the input until maturity)
     * **Target Output Capacity**: `2407.8508778 CKB` (Includes base capacity + interest)

This successfully completes the verification of the Nervos DAO interaction lifecycle!

