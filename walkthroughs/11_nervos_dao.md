# Lesson 11: Nervos DAO — The Inflation Shelter and State Rent

Before writing the transaction scripts, we must understand the core concepts behind the **Nervos DAO** and why it exists.

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

* **Occupied Cell (Data Storage)** $\rightarrow$ Allocating memory statically (e.g., `static char buffer[1024];`). This takes up hardware space forever, so the system charges a continuous runtime power cycle cost (inflation dilution).
* **Nervos DAO** $\rightarrow$ Releasing static memory back into the dynamic pool. Because you released the hardware resource, the system rewards you by giving you "unused capacity rebates" (DAO rewards) to protect your allocation budget.
* **The 180-Epoch Cycle** $\rightarrow$ A hardware **Watchdog Timer**. The co-processor locks your memory segments in fixed blocks. You can only safely release and claim the memory rebate at the tick boundary of the watchdog cycle.
