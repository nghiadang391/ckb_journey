# Lesson 11: Nervos DAO Interaction (Deposit, Prepare, and Claim)

## Objective

Interact with the **Nervos DAO** system script using the **CCC SDK** in TypeScript. Implement a 3-step automated runner that executes against the local `offckb` devnet (or testnet):
1. **Step 1: Deposit** CKB to the Nervos DAO (creating a deposit cell).
2. **Step 2: Prepare (Withdrawal Request)** the deposit cell by converting it into a withdrawing cell (storing the block height when deposited).
3. **Step 3: Unlock / Claim** CKB and accumulated profit from the withdrawing cell back to the user's lock script.

---

## Under-the-Hood: The Embedded Analogy

For an embedded engineer, the **Nervos DAO** is analogous to a **Hardware Security Module (HSM) / Cryptographic Co-processor (like an ATECC608A)** containing a pre-programmed interest-accruing ROM script:
* **Deposit**: We invoke an instruction to "lock" a set capacity (`capacity`) into a hardware address protected by the DAO co-processor. The data register is set to all zeros (`0x0000000000000000`).
* **Preparation**: We signal a "request to withdraw" interrupt. The co-processor reads the block number at which the deposit was locked, writes this block number into the cell's data register, and transitions the cell to the "withdrawing" state.
* **Claim**: After a specific timer (epochs) expires, we send a third instruction with the appropriate `since` register constraint. The co-processor checks that the time has elapsed, calculates the secondary issuance interest, and releases the capacity plus profit back to our main memory.

---

## Proposed Changes

We will create a new project at `ckb_journey/projects/nervos-dao/` with a CLI script.

### Component: Nervos DAO Project

#### [NEW] [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/nervos-dao/package.json)
Standard node package specifications loading `@ckb-ccc/core`, `typescript`, `ts-node`, and configuration tools.

#### [NEW] [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/nervos-dao/tsconfig.json)
Configures TypeScript compilation options.

#### [NEW] [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/nervos-dao/src/index.ts)
The main executable containing:
- **Part 1 (Deposit)**: Locks CKB into the Nervos DAO.
- **Part 2 (Prepare/Withdrawal Request)**: Submits a transaction converting the deposit cell to a withdrawing cell.
- **Part 3 (Claim/Unlock)**: Unlocks the CKB + earned profit.

---

## Verification Plan

### Manual Verification
1. Navigate to the new project directory:
   ```bash
   cd ckb_journey/projects/nervos-dao
   ```
2. Install workspace dependencies:
   ```bash
   npm install
   ```
3. Run the script:
   ```bash
   npm start
   ```
4. The output must log step-by-step progress, the transaction hashes of the deposit, prepare, and claim stages, and print the calculated profit details.

> [!NOTE]
> Testing step 3 (Claim/Unlock) on the public testnet requires waiting for a full 180-epoch cycle (~30 days). For local testing and execution on `offckb` devnet, we can reduce the epoch length or configure the mock transaction state to skip the epoch wait. We will simulate/execute the flow using `offckb` or a simulated transaction runner.
