# Implementation Plan - Lesson 15: RGB++ Protocol Simulation

This plan outlines the steps to implement a TypeScript simulation script representing the **RGB++ Protocol** and its core mechanism: **Isomorphic Binding**. We will build a transaction-assembling script using the **CCC SDK** to simulate constructing a virtual CKB transaction, calculating its commitment hash, binding it to a simulated Bitcoin UTXO, and verifying the resulting binding via an `OP_RETURN` commitment.

## Real-Life Analogy: The Physical House and the Digital Property Deed
Imagine you own a physical house (a Bitcoin UTXO). The house is highly secure and durable, but because it is physical, you cannot easily move it, divide it, or add complex automated rules to it (like setting up an instant automated rental agreement or escrow).

To solve this, you create a digital **Property Deed** (a CKB Cell) and record it in a high-speed digital registry database (Nervos CKB). 

You establish a strict **isomorphic binding** (a one-to-one mapping) between the physical house and the digital deed. The rules say: the digital deed is only valid if it is linked to the ownership of the physical house.

When you want to transfer ownership of the house:
1. You sign a quick transaction on the digital registry (the **virtual CKB transaction**) and lock it using a special lock script (**RgbppLock**).
2. To finalize and validate this digital deed update, you write a small note (an **OP_RETURN commitment** containing the CKB virtual transaction hash) directly onto the physical house's public deed log (the Bitcoin blockchain).

Anyone looking at the digital registry can verify: *"Ah, the digital deed transferred, and I can see the matching commitment hash logged on the physical house's blockchain. Therefore, the transfer is valid!"* 

This is **isomorphic binding**: CKB handles the fast smart contract logic (Turing-complete execution), while Bitcoin provides the ultimate secure settlement and consensus.

---

## Technical Concept: Isomorphic Binding & Commitments
In the RGB++ protocol:
* **Bitcoin UTXO:** Acts as the hardware authorization key. The owner of the Bitcoin UTXO is the owner of the bound CKB Cell.
* **CKB Cell:** Stores the assets (e.g. custom tokens or NFTs) and runs smart contract logic.
* **RgbppLock Script:** A lock script on the CKB Cell. Instead of verifying standard signatures (like SECP256K1), the `RgbppLock` checks if the transaction inputs correspond to a spent Bitcoin UTXO and if the corresponding Bitcoin transaction contains an `OP_RETURN` output with the hash of the virtual CKB transaction.
* **OP_RETURN Commitment:** A hash of the virtual CKB transaction data committed to the Bitcoin blockchain.
  $$\text{Commitment} = \text{Double-SHA256}(\text{Virtual CKB Tx Data})$$

---

## Proposed Changes

We will create a new project directory `15_rgbpp/` inside `ckb_journey/projects/`.

### [Component: 15_rgbpp]

#### [NEW] [package.json](file:///Users/nghiadang/CKB/ckb_journey/projects/15_rgbpp/package.json)
Configure the project dependencies, including the CCC SDK (`@ckb-ccc/core`) and the TypeScript execution engine (`tsx`).

#### [NEW] [tsconfig.json](file:///Users/nghiadang/CKB/ckb_journey/projects/15_rgbpp/tsconfig.json)
TypeScript compiler configuration enabling ESM modules and strict type checking.

#### [NEW] [src/index.ts](file:///Users/nghiadang/CKB/ckb_journey/projects/15_rgbpp/src/index.ts)
The simulation script. It will execute the following steps:
1. **Define Assets**: Simulate an RGB++ asset cell (CKB cell containing custom tokens) locked under `RgbppLock`.
2. **Build Virtual CKB Tx**:
   * Construct a virtual CKB transaction representing the asset transfer from Sender to Receiver.
3. **Calculate Commitment**:   
   * Serialize the virtual CKB transaction inputs and outputs.
   * Calculate the Double-SHA256 hash of the virtual transaction (representing the commitment).
4. **Construct Mock Bitcoin Tx**:
   * Construct a mock Bitcoin transaction representing the spending of the bound Bitcoin UTXO.
   * Include the computed virtual CKB transaction commitment in the Bitcoin transaction's `OP_RETURN` output data.
5. **Verify Binding**:
   * Simulate the `RgbppLock` validation: verify that the inputs match the spent Bitcoin UTXO and that the Bitcoin transaction contains the correct `OP_RETURN` hash matching the virtual CKB transaction.
6. **Telemetry Logging**: Output all state details, commitment hashes, and binding verification results in a clear CLI style.

---

## Verification Plan

### Automated / Manual Verification
1. **Execution**: The user will navigate to `ckb_journey/projects/15_rgbpp/` and run `npm install && npm start`.
2. **Telemetry Validation**: Verify the console outputs:
   * Correct construction of the CKB virtual transaction.
   * Correct Double-SHA256 commitment calculation.
   * Correct formatting of the Bitcoin `OP_RETURN` output.
   * Successful validation of the isomorphic binding (RgbppLock verification).
