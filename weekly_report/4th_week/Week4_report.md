 ## Builder Track Weekly Report — Week 4

**Name:** Vo Duy Tuan Ngoc
**Week Ending:** 12 June 2026

### Courses Completed

- Below is what I have learned and implemented this week:
  - **Lesson 11: Nervos DAO Interaction**: Built a complete DAO lifecycle script that automates the 3-step process: **Deposit** (lock CKB into the DAO), **Prepare** (request withdrawal), and **Claim** (unlock capacity + earned interest). Learned about CKB's dual-issuance economic model and how secondary issuance creates an implicit state rent mechanism.

---

### New Knowledge & Key Learnings

1. **CKB's Dual-Issuance Economic Model:**
   - **Primary Issuance** follows a Bitcoin-like halving schedule to reward miners.
   - **Secondary Issuance** mints a flat 1.344 billion CKB per year indefinitely. This constant inflation acts as an implicit state rent — diluting the value of CKB locked inside data-storing cells, effectively charging those users for occupying on-chain storage space.

2. **Nervos DAO as an Inflation Shelter:**
   - Long-term CKB holders who are **not** storing data can deposit into the Nervos DAO to receive secondary issuance rewards that exactly offset the inflation rate — preserving their token value.
   - The DAO uses on-chain accumulator ratios (`ar` values in block headers) to compute interest dynamically.

   **Key Features of the Nervos DAO:**

   | Feature | Description |
   | :--- | :--- |
   | **Eligibility** | Any holder with a minimum of 102 CKB can deposit into the DAO. |
   | **Deposit Cycle** | The minimum deposit period is roughly 30 days (one DAO cycle). |
   | **Withdrawal Process** | Withdrawals can only be made at the end of the current cycle. Early requests stop reward accrual. |
   | **Interest Type** | The yield is annual, compound, but variable—decreasing as the total CKB supply grows. |
   | **Security** | Smart contract-based and operates equivalently across all major Nervos wallets. |
   | **Compound Interest** | Deposits benefit from automatic compounding; there's no need to redeposit rewards. |

3. **DAO Lifecycle Mechanics (3-Step Process):**
   - **Step 1 — Deposit:** Create a cell with `NervosDao` type script and 8 bytes of zeroes as output data.
   - **Step 2 — Prepare (Request Withdrawal):** Consume the deposit cell, reference the deposit block hash in `headerDeps`, and write the deposit block number (little-endian) into the output data.
   - **Step 3 — Claim (Unlock):** After a 180-epoch maturity period (≈30 days), unlock the cell with interest. The `since` field enforces the time-lock using epoch-based absolute locking.

4. **System Scripts Configuration Debugging:**
   - Discovered that the `system-scripts.json` file contained stale file paths (from another developer's machine). Regenerated it using `offckb system-scripts -o system-scripts.json` to match the local devnet environment.
   - Learned about the CCC library's silent fallback behavior: `ClientPublicTestnet` silently falls back to the public testnet when the local devnet node is unreachable, which can cause confusing `OutPoint` resolution failures when system script configurations don't match the target network.

5.  **Epoch Math and Fixed-Point Arithmetic:**
    - CKB epochs are represented as 3-element tuples: `[epochNumber, blockIndex, epochLength]`.
    - Maturity epoch is calculated by rounding up to the next 180-epoch boundary from the deposit epoch.
    - Interest profit uses fixed-point division on the `ar` (accumulator rate) values extracted from block headers.

6.  **Rust Basics (Beginning the Local Crash Course):**
    - Established a dedicated `study_Rust/` directory to track absolute basics separately from complex blockchain script frameworks.
    - **Project Manifests vs Makefiles:** Learned that `Cargo.toml` acts as the project manifest (metadata, compilation properties, and dependencies) replacing manual configuration layouts like C `Makefiles`.
    - **Compilation & Execution CLI Tools:** 
      - `cargo check` for rapid type-checking and compiler diagnostics without generating executable overhead.
      - `cargo build` for compiling the final binary artifact under `target/debug/`.
      - `cargo run` which uses smart file timestamp checks to skip recompilation if no changes exist, and then runs the binary.
      - Directly running the compiled executable via path commands (e.g. `./target/debug/binary_name`) bypassing Cargo compilation validations.
    - **Type Safety & Mutability:** Rust enforces strict variable immutability by default. To alter variables or properties, variables must be explicitly defined using the `mut` keyword, encouraging predictable thread safety and memory layout.

---

### Practical Progress

- Successfully implemented and verified the **Nervos DAO lifecycle** (Deposit → Prepare → Claim simulation) on the local `offckb` devnet.
- Debugged and resolved a `system-scripts.json` path mismatch issue.
- Verified interest calculation of **2,207.85 CKB** on a 200 CKB deposit (amplified by devnet's accelerated epoch progression).
- Initialized local Rust workspace packages (`hello_ckb` and `rust_playground` inside `study_Rust/`) for foundational programming practice.

---

### Verification Results

| Step | Transaction Hash | Block |
| :--- | :--- | :--- |
| **Deposit** | `0x2adc4accd0988dfb...` | #15445 |
| **Prepare** | `0xdf0a13c102a27b45...` | #15448 |
| **Claim** | Simulated (180-epoch lock) | Maturity epoch: 18902500000 |

| Metric | Value |
| :--- | :--- |
| **Deposit Amount** | 200 CKB |
| **Earned Interest** | 2,207.85 CKB |
| **Total Claimable** | 2,407.85 CKB |
