/**
 * CKB Builder's Journey — Lesson 15: RGB++ Protocol & Isomorphic Binding Simulation
 * 
 * ==========================================================================
 * RUNNING THE SCRIPT:
 * 1. Navigate to: cd projects/15_rgbpp
 * 2. Install dependencies: npm install
 * 3. Start the script: npm start
 * ==========================================================================
 * 
 * UNDER-THE-HOOD EMBEDDED SYSTEM EQUIVALENT:
 * 
 * Think of RGB++ Isomorphic Binding as a "Dual-Core IPC Handshake with Shared MPU registers":
 * 
 * 1. Core A (Bitcoin) is a highly secure but slow and simple co-processor (like an HSM/TPM chip). 
 *    It cannot execute complex smart contract firmware, but it maintains the master security keys 
 *    and ownership logs (UTXOs).
 * 
 * 2. Core B (CKB) is a fast, high-performance application processor running an RTOS (CKB-VM). 
 *    It handles all smart contracts, custom tokens, and complex state changes (Cells).
 * 
 * 3. When Core B wants to execute a state transfer (virtual CKB transaction):
 *    - It packages the state changes and computes a security checksum hash (the CKB commitment).
 *    - It triggers an Inter-Processor Communication (IPC) hardware interrupt to Core A.
 *    - Core A (Bitcoin) receives the interrupt and writes the checksum hash directly to a secure, 
 *      read-only status log register (the Bitcoin OP_RETURN output).
 *    - The Memory Protection Unit (MPU) lock script (RgbppLock) on Core B only releases the memory segments (cells) 
 *      if it verifies that Core A has successfully written the matching checksum hash to its secure status register.
 * 
 * This enables secure, bridge-less smart contract execution backed by the safety of Core A's consensus.
 */

import { ccc } from "@ckb-ccc/core";
import * as crypto from "crypto";

// Mock Bitcoin and CKB Coordinates
const SENDER_ADDRESS_CKB = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";
const RECEIVER_ADDRESS_CKB = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahuzqfkq6ktuf3wd8azaas0h24c9myfq7";

// A Bitcoin UTXO is represented by a 32-byte Transaction ID and a 4-byte Output Index
const BOUND_BTC_TXID = "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const BOUND_BTC_INDEX = 0; // Index 0 of the Bitcoin output

function separator() {
  console.log("=".repeat(78));
}

// Compute Double-SHA256 hash (Bitcoin's standard hash function)
function doubleSha256(data: Buffer): string {
  const hash1 = crypto.createHash("sha256").update(data).digest();
  const hash2 = crypto.createHash("sha256").update(hash1).digest();
  return "0x" + hash2.toString("hex");
}

async function main() {
  separator();
  console.log("=== STARTING LESSON 15: RGB++ Protocol Isomorphic Binding Simulation ===");
  separator();

  // ==========================================================================
  // STEP 1: CONSTRUCT VIRTUAL CKB TRANSACTION
  // ==========================================================================
  console.log("[START] Step 1: Constructing Virtual CKB Transaction...");
  
  // Define mock lock scripts representing the RGB++ lock
  // RgbppLock script arguments pack the reference to the bound Bitcoin UTXO:
  // args = [32 bytes BTC Txid] + [4 bytes BTC index (little endian)]
  const btcIndexBuffer = Buffer.alloc(4);
  btcIndexBuffer.writeUInt32LE(BOUND_BTC_INDEX, 0);
  const rgbppLockArgs = BOUND_BTC_TXID + btcIndexBuffer.toString("hex");

  const mockRgbppLockScript = ccc.Script.from({
    codeHash: "0x" + "8".repeat(64), // Mock RgbppLock codehash
    hashType: "type",
    args: rgbppLockArgs,
  });

  const mockReceiverLockScript = ccc.Script.from({
    codeHash: "0x" + "9".repeat(64), // Mock Receiver standard lock script
    hashType: "type",
    args: "0x02",
  });

  // Construct the virtual CKB transaction transferring an RGB++ asset
  const virtualCkbTx = ccc.Transaction.from({
    inputs: [
      {
        previousOutput: {
          txHash: "0x" + "3".repeat(64), // Mock previous CKB tx id
          index: 0,
        }
      }
    ],
    outputs: [
      // Output 0: The transferred asset, locked with RgbppLock bound to a new UTXO (or standard receiver lock)
      {
        lock: mockReceiverLockScript,
        capacity: 1000n * 100_000_000n, // 1000 CKB
      }
    ],
    outputsData: [
      "0x00010000000000000000000000000000", // 128-bit little endian: 256 custom RGB++ tokens
    ]
  });

  console.log(`[INFO] Virtual CKB Transaction assembled.`);
  console.log(`  Inputs:  Consuming CKB cell locked under RgbppLock`);
  console.log(`           Bound to BTC UTXO:   ${BOUND_BTC_TXID} (Index: ${BOUND_BTC_INDEX})`);
  console.log(`  Outputs: Sending 256 RGB++ custom tokens to receiver.`);
  console.log();

  // ==========================================================================
  // STEP 2: CALCULATE COMMITMENT HASH
  // ==========================================================================
  console.log("[START] Step 2: Calculating Virtual CKB Transaction Commitment...");
  
  const replacer = (key: string, value: any) => typeof value === "bigint" ? value.toString() : value;
  const serializedInputs = Buffer.from(virtualCkbTx.inputs.map(i => JSON.stringify(i, replacer)).join(""));
  const serializedOutputs = Buffer.from(virtualCkbTx.outputs.map(o => JSON.stringify(o, replacer)).join(""));
  const serializedData = Buffer.from(virtualCkbTx.outputsData.join(""));
  const combinedBuffer = Buffer.concat([serializedInputs, serializedOutputs, serializedData]);

  const ckbCommitmentHash = doubleSha256(combinedBuffer);

  console.log(`[MATH] Double-SHA256 Commitment Formula:`);
  console.log(`       Commitment = SHA256(SHA256(Virtual_CKB_Tx_Data))`);
  console.log(`[OUTPUT] Computed CKB Commitment Hash: ${ckbCommitmentHash}`);
  console.log();

  // ==========================================================================
  // STEP 3: CONSTRUCT MOCK BITCOIN TRANSACTION
  // ==========================================================================
  console.log("[START] Step 3: Constructing Isomorphic Bitcoin Transaction...");

  // Simulate spending the bound Bitcoin UTXO on the Bitcoin network
  const mockBtcTx = {
    txid: "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
    inputs: [
      {
        previousTxid: BOUND_BTC_TXID,
        previousIndex: BOUND_BTC_INDEX,
        signature: "0x304402206efbc726..." // Mock BTC signature authorizing the spend
      }
    ],
    outputs: [
      // Output 0: Bitcoin payment/change output
      {
        address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kfjte3y",
        amount: 50000n, // satoshis
      },
      // Output 1: OP_RETURN commitment mapping to CKB
      {
        scriptPubKey: `OP_RETURN ${ckbCommitmentHash}`,
        amount: 0n,
      }
    ]
  };

  console.log(`[INFO] Mock Bitcoin Transaction created.`);
  console.log(`  Inputs:  Consuming the bound Bitcoin UTXO.`);
  console.log(`           Spent UTXO:          ${mockBtcTx.inputs[0].previousTxid} (Index: ${mockBtcTx.inputs[0].previousIndex})`);
  console.log(`  Outputs: Output 0: Payment Change`);
  console.log(`           Output 1: OP_RETURN Commitment: ${mockBtcTx.outputs[1].scriptPubKey}`);
  console.log();

  // ==========================================================================
  // STEP 4: VERIFY BINDING (RgbppLock VALIDATION SIMULATION)
  // ==========================================================================
  console.log("[START] Step 4: Simulating RgbppLock Validation on CKB-VM...");
  console.log(`[INFO] CKB-VM loading input lock arguments: ${rgbppLockArgs}`);
  
  // CKB-VM parses the lock args to verify isomorphic binding:
  const parsedTxid = rgbppLockArgs.substring(0, 66); // Extracted BTC Txid
  const parsedIndexHex = rgbppLockArgs.substring(66); // Extracted index hex
  const parsedIndex = Buffer.from(parsedIndexHex, "hex").readUInt32LE(0);

  console.log(`[INFO] Parsed bound Bitcoin UTXO reference:`);
  console.log(`       Txid:  ${parsedTxid}`);
  console.log(`       Index: ${parsedIndex}`);

  // Validator logic check:
  // 1. Verify that the Bitcoin transaction spent the exact UTXO referenced in CKB RgbppLock args
  const spentBtcUtxoMatched = mockBtcTx.inputs[0].previousTxid === parsedTxid && mockBtcTx.inputs[0].previousIndex === parsedIndex;
  
  // 2. Verify that the Bitcoin transaction contains the correct OP_RETURN commitment matching the virtual CKB transaction hash
  const expectedOpReturnPrefix = `OP_RETURN ${ckbCommitmentHash}`;
  const btcOpReturnMatched = mockBtcTx.outputs[1].scriptPubKey === expectedOpReturnPrefix;

  console.log();
  console.log(`[INFO] Running verification checks:`);
  console.log(`       Check 1: Does BTC transaction spend the bound UTXO?      ➔ ${spentBtcUtxoMatched ? "PASSED" : "FAILED"}`);
  console.log(`       Check 2: Does BTC transaction contain OP_RETURN hash?  ➔ ${btcOpReturnMatched ? "PASSED" : "FAILED"}`);
  console.log();

  if (spentBtcUtxoMatched && btcOpReturnMatched) {
    separator();
    console.log(`[SUCCESS] Isomorphic Binding Verification: PASSED (Exit code: 0)`);
    console.log(`          Virtual CKB state transfer is legally bound to the Bitcoin transaction.`);
    separator();
  } else {
    separator();
    console.log(`[ERROR] Isomorphic Binding Verification: FAILED (Exit code: 45)`);
    console.log(`        The commitment hash or the spent Bitcoin UTXO reference did not match.`);
    separator();
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("[ERROR] Fatal error running RGB++ simulation:", err);
  process.exit(1);
});
