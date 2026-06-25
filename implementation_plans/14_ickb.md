# Implementation Plan - Lesson 14: iCKB Protocol Simulation

This plan outlines the steps to implement a TypeScript simulation script representing the **iCKB Protocol** (liquid staking wrapper for the Nervos DAO). We will build transaction constructors using the **CCC SDK** to simulate depositing CKB, minting liquid iCKB tokens, and redeeming iCKB tokens for the underlying CKB plus interest.

## Real-Life Analogy: The Liquid Coat-Check Ticket
Imagine you go to a theater and want to check your heavy winter coat (your CKB tokens) into the theater's cloakroom (staked in the Nervos DAO) to earn a premium reward for keeping it there. The cloakroom locks your coat in a vault. Because the coat is locked, you can't wear it, trade it, or use it for the next few weeks (Nervos DAO's 30-day/180-epoch maturity cycle).

To solve this, the theater issues you a special **liquid coat-check ticket** (the iCKB token). This ticket guarantees that whoever holds it can redeem it for a coat from the vault. Furthermore, the ticket's face value dynamically increases over time to reflect the accrued staking rewards (interest). Instead of waiting out the maturity cycle, you can sell or trade this ticket (iCKB) to anyone else in the theater immediately. When the buyer is ready, they can go to the vault, present the ticket, and redeem the coat plus the accrued interest.

---

## Technical Concept: Accumulated Rate (AR)
The exchange rate between iCKB and CKB is determined by the **Accumulated Rate (AR)**. The AR is a mathematical accumulator value stored in block headers that represents the compounding interest rate of the Nervos DAO since the blockchain's genesis.

As Nervos DAO rewards accrue, the AR grows:
* When **depositing** CKB at block $t_d$, the amount of iCKB minted is:
  $$\text{iCKB Minted} = \frac{\text{CKB Deposited}}{\text{AR}_{deposit}}$$
* When **redeeming** iCKB at block $t_w$, the amount of CKB returned (including interest) is:
  $$\text{CKB Returned} = \text{iCKB Burned} \times \text{AR}_{withdraw}$$

This ensures that the value of iCKB steadily appreciates relative to CKB, protecting the holder against secondary issuance inflation.

---

## Proposed Changes

We will create a new project directory `14_ickb/` inside `ckb_journey/projects/`.

### [Component: 14_ickb]

#### [NEW] [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/14_ickb/package.json)
Configure the project dependencies, including the CCC SDK (`@ckb-ccc/core`) and the TypeScript execution engine (`tsx`).

#### [NEW] [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/14_ickb/tsconfig.json)
TypeScript compiler configuration enabling modern ESM modules and strict type checking.

#### [NEW] [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/14_ickb/src/index.ts)
The simulation script. It will connect to the local OffCKB devnet and execute the following:
1. **Initialize Accounts**: Load SENDER private keys and derive addresses.
2. **Phase 1: Deposit & Mint**:
   * Create a Nervos DAO deposit cell using the CCC SDK.
   * Fetch the current block's Accumulated Rate (AR).
   * Calculate the corresponding amount of iCKB to mint.
   * Simulate minting the iCKB tokens (represented as custom xUDT tokens) to the depositor.
3. **Phase 2: Burn & Withdraw**:
   * Simulate burning the user's iCKB tokens.
   * Fetch a later block's Accumulated Rate (AR) (simulated or actual after mining new blocks).
   * Compute the total CKB returned (principal + interest) using the AR ratio.
   * Construct the withdrawal request transaction.
4. **Telemetry Logging**: Output all step transitions, AR values, and capacity differences in a clear CLI style.

---

## Verification Plan

### Automated / Manual Verification
1. **Local Devnet**: Ensure the `offckb node` is running in the background.
2. **Execution**: The user will navigate to `ckb_journey/projects/14_ickb/` and run `npm install && npm start`.
3. **Telemetry Validation**: Verify the console outputs:
   * Correct calculation of iCKB minted based on deposit block AR.
   * Correct calculation of CKB returned (including interest) based on a simulated increased withdraw block AR.
   * Successful assembly of both the Deposit and Withdrawal transactions using the CCC SDK.
