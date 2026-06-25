/**
 * CKB Builder's Journey — Lesson 14: iCKB Liquid Staking Protocol Simulation
 * 
 * ==========================================================================
 * RUNNING THE SCRIPT:
 * 1. Navigate to: cd projects/14_ickb
 * 2. Install dependencies: npm install
 * 3. Start the script: npm start
 * ==========================================================================
 * 
 * UNDER-THE-HOOD EMBEDDED SYSTEM EQUIVALENT:
 * 
 * Think of CKB liquid staking as "Non-Blocking DMA Ring Buffering with descriptors":
 * 
 * 1. Direct Staking (Nervos DAO) is like a Synchronous Blocking Flash Write.
 *    The CPU invokes a slow write sector command (30ms write time). During this write, 
 *    the CPU is blocked, execution halts, and no other tasks can run. Your resource (time/RAM) 
 *    is frozen.
 * 
 * 2. Liquid Staking (iCKB) is like a Non-Blocking DMA Ring Buffer.
 *    Instead of blocking the CPU, the firmware passes the data payload to a DMA channel 
 *    which handles the slow flash write in the background (implicit DAO deposit).
 *    The CPU is immediately returned a "DMA Buffer Descriptor" (the iCKB token). 
 *    The CPU can read, modify, or pass this descriptor to other active tasks in the RTOS 
 *    immediately, keeping the system fully active and fluid.
 */

import { ccc } from "@ckb-ccc/core";
import systemScripts from "../system-scripts.json" assert { type: "json" };

const ONE_CKB = 100_000_000n;
const DEPOSIT_AMOUNT_CKB = 500n; // 500 CKB to deposit

// Account #2 (Sender)
const SENDER_PRIVKEY = "0x59ddda57ba06d6e9c5fa9040bdb98b4b098c2fce6520d39f51bc5e825364697a";
const SENDER_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";

// Devnet script configurations
const DEVNET_SCRIPTS = {
  [ccc.KnownScript.Secp256k1Blake160]: systemScripts.devnet.secp256k1_blake160_sighash_all!.script,
  [ccc.KnownScript.NervosDao]: systemScripts.devnet.dao!.script,
  [ccc.KnownScript.Xudt]: systemScripts.devnet.xudt!.script,
};

const client = new ccc.ClientPublicTestnet({
  url: "http://127.0.0.1:28114",
  scripts: DEVNET_SCRIPTS as any,
});

function separator() {
  console.log("=".repeat(78));
}

function shannonsToCKB(shannons: bigint): string {
  const whole = shannons / ONE_CKB;
  const frac = shannons % ONE_CKB;
  return frac === 0n
    ? `${whole} CKB`
    : `${whole}.${frac.toString().padStart(8, "0").replace(/0+$/, "")} CKB`;
}

// Format little-endian u128 for xUDT balance representation
function u128ToHexLE(amount: bigint): string {
  const buffer = Buffer.alloc(16);
  buffer.writeBigUInt64LE(amount & 0xffffffffffffffffn, 0);
  buffer.writeBigUInt64LE(amount >> 64n, 8);
  return "0x" + buffer.toString("hex");
}

async function main() {
  separator();
  console.log("=== STARTING LESSON 14: iCKB Liquid Staking Protocol Simulation ===");
  separator();

  // 1. Detect environment and fetch network parameters
  let isDevnetOnline = false;
  let depositAR = ccc.fixedPointFrom("1.02"); // Default mock deposit Accumulated Rate
  let connectedNetwork = "Offline / Mock Mode";
  
  console.log("[START] Phase 1: Network Connection and AR Detection...");
  
  // Perform a direct check to see if the local node port is open
  try {
    const checkResponse = await fetch("http://127.0.0.1:28114", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "local_node_info",
        params: []
      }),
    });
    if (checkResponse.ok) {
      connectedNetwork = "Local Devnet (offckb)";
    } else {
      connectedNetwork = "Public CKB Testnet (via CCC Silent Fallback)";
    }
  } catch (err) {
    connectedNetwork = "Public CKB Testnet (via CCC Silent Fallback)";
  }

  try {
    const tip = await client.getTip();
    console.log(`[INFO] Connection Status: Connected to ${connectedNetwork}`);
    console.log(`[INFO] Current Tip Block: #${tip}`);
    
    // Fetch tip block header to read live Accumulated Rate (AR)
    const tipHeader = await client.getHeaderByNumber(tip);
    if (tipHeader && tipHeader.dao) {
      depositAR = tipHeader.dao.ar;
      isDevnetOnline = true;
      console.log(`[INFO] Live DAO Accumulator detected from Block Header.`);
    }
  } catch (err) {
    connectedNetwork = "Offline / Mock Mode";
    console.log(`[WARNING] Network connection failed. Falling back to high-fidelity mock calculations.`);
  }
  
  console.log(`[INFO] Base Deposit Accumulated Rate (AR_deposit): ${depositAR.toString()}`);
  console.log();

  const senderSigner = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);
  const senderAddrObj = await ccc.Address.fromString(SENDER_ADDRESS, client);

  // ==========================================================================
  // PHASE 2: DEPOSIT CKB & MINT iCKB
  // ==========================================================================
  separator();
  console.log("[START] Phase 2: Simulating CKB Deposit & iCKB Token Minting...");
  separator();

  const depositShannons = DEPOSIT_AMOUNT_CKB * ONE_CKB;
  console.log(`[INPUT] CKB to lock in pool:      ${shannonsToCKB(depositShannons)}`);

  // Calculate the amount of iCKB tokens to mint
  // Math: iCKB_minted = CKB_deposited / AR_deposit
  const depositAR_FP = ccc.fixedPointFrom(depositAR.toString());
  const ckb_FP = ccc.fixedPointFrom(depositShannons.toString());
  const iCKB_Minted_FP = (ckb_FP * ccc.fixedPointFrom("1.0")) / depositAR_FP;
  
  // Convert FixedPoint back to integer representation (UDT balances are integers)
  const iCKB_Minted_Raw = BigInt(iCKB_Minted_FP.toString().split(".")[0]);
  console.log(`[MATH] iCKB Minting Formula:     iCKB = CKB_deposited / AR_deposit`);
  console.log(`[MATH] Calculation:              ${depositShannons} / ${depositAR_FP.toString()}`);
  console.log(`[OUTPUT] Liquid iCKB to Mint:    ${shannonsToCKB(iCKB_Minted_Raw)} (represented as xUDT)`);
  console.log();

  console.log("[INFO] Assembling Deposit & Mint Transaction Skeleton...");
  
  // Create mock iCKB Logic script coordinates
  // iCKB Logic script acts as the lock script for the deposited cell
  const mockIckbLogicScript = ccc.Script.from({
    codeHash: "0x" + "1".repeat(64), // Representing iCKB Logic Lock Script
    hashType: "type",
    args: "0x",
  });

  // iCKB xUDT Type Script
  // xUDT args: Owner Lock Hash (which is the iCKB Logic Script Hash) + Flags (0x80000000)
  const ickbUdtType = ccc.Script.from({
    codeHash: systemScripts.devnet.xudt!.script.codeHash,
    hashType: "type",
    args: mockIckbLogicScript.hash() + "80000000",
  });

  // Construct the Deposit & Mint Transaction
  const depositTx = ccc.Transaction.from({
    outputs: [
      // Output 1: The Nervos DAO Deposit Cell (locked under the iCKB Logic Script)
      {
        lock: mockIckbLogicScript,
        type: (await client.getKnownScript(ccc.KnownScript.NervosDao)).script,
        capacity: depositShannons,
      },
      // Output 2: The minted iCKB xUDT Cell (sent to the user)
      {
        lock: senderAddrObj.script,
        type: ickbUdtType,
        capacity: 142n * ONE_CKB, // 142 CKB required for xUDT cell base overhead
      }
    ],
    outputsData: [
      "0x0000000000000000", // DAO Deposit data: 8 bytes of zeroes
      u128ToHexLE(iCKB_Minted_Raw), // xUDT Data: iCKB balance (little-endian u128)
    ]
  });

  console.log("   --- TX Telemetry Frame ---");
  console.log(`   Output 0 (DAO Deposit):`);
  console.log(`     Lock Script (Owner):  iCKB_Logic_Script (0x1111...)`);
  console.log(`     Type Script (Asset):  NervosDAO_System_Script`);
  console.log(`     Capacity:             ${shannonsToCKB(depositTx.outputs[0].capacity)}`);
  console.log(`     Data:                 ${depositTx.outputsData[0]}`);
  console.log(`   Output 1 (Liquid iCKB):`);
  console.log(`     Lock Script (Owner):  User_Address_Lock`);
  console.log(`     Type Script (Asset):  iCKB_xUDT_Token_Script`);
  console.log(`     Capacity:             ${shannonsToCKB(depositTx.outputs[1].capacity)}`);
  console.log(`     Data (iCKB Balance):  ${depositTx.outputsData[1]} (${shannonsToCKB(iCKB_Minted_Raw)})`);
  console.log("   --------------------------");
  console.log("[SUCCESS] Phase 2 Simulation Completed: CKB locked and liquid iCKB minted.");
  console.log();

  // ==========================================================================
  // PHASE 3: BURN iCKB & REDEEM CKB
  // ==========================================================================
  separator();
  console.log("[START] Phase 3: Simulating iCKB Token Burn & CKB Redemption...");
  separator();

  // We simulate that epochs have passed and the Accumulated Rate has grown
  // (e.g. from 1.02 to 1.085, representing compounding staking interest)
  const withdrawAR = ccc.fixedPointFrom("1.085");
  console.log(`[INFO] Simulating time progression (epochs passed).`);
  console.log(`[INFO] Current Withdraw Accumulated Rate (AR_withdraw): ${withdrawAR.toString()}`);
  console.log();

  console.log(`[INPUT] Burning iCKB tokens:      ${shannonsToCKB(iCKB_Minted_Raw)}`);

  // Calculate the returned CKB amount (principal + earned interest)
  // Math: CKB_returned = iCKB_burned * AR_withdraw
  const iCKB_Burned_FP = ccc.fixedPointFrom(iCKB_Minted_Raw.toString());
  const ckb_Returned_FP = iCKB_Burned_FP * withdrawAR;
  const ckb_Returned_Raw = BigInt(ckb_Returned_FP.toString().split(".")[0]);
  
  const interest_Earned = ckb_Returned_Raw - depositShannons;

  console.log(`[MATH] CKB Redemption Formula:  CKB_returned = iCKB_burned * AR_withdraw`);
  console.log(`[MATH] Calculation:             ${iCKB_Minted_Raw} * ${withdrawAR.toString()}`);
  console.log(`[OUTPUT] Principal CKB:         ${shannonsToCKB(depositShannons)}`);
  console.log(`[OUTPUT] Earned Interest Yield: ${shannonsToCKB(interest_Earned)}`);
  console.log(`[OUTPUT] Total CKB Returned:    ${shannonsToCKB(ckb_Returned_Raw)}`);
  console.log();

  console.log("[INFO] Assembling Burn & Redemption Transaction Skeleton...");

  // Construct the Burn & Redemption Transaction
  // Consumes the iCKB xUDT cell and the DAO Deposit cell, outputting the unlocked CKB + interest
  const redeemTx = ccc.Transaction.from({
    inputs: [
      // Input 0: The DAO Deposit cell being unlocked
      {
        previousOutput: {
          txHash: "0x" + "2".repeat(64), // Mock previous tx hash
          index: 0,
        }
      },
      // Input 1: The user's iCKB xUDT cell being burned
      {
        previousOutput: {
          txHash: "0x" + "2".repeat(64),
          index: 1,
        }
      }
    ],
    outputs: [
      // Output 0: Unlocked CKB capacity returned to the user (includes interest)
      {
        lock: senderAddrObj.script,
        capacity: ckb_Returned_Raw,
      }
    ],
    outputsData: [
      "0x", // Standard cell has no data
    ]
  });

  console.log("   --- TX Telemetry Frame ---");
  console.log(`   Input 0 (DAO Deposit locked under iCKB Logic):`);
  console.log(`     Capacity:             ${shannonsToCKB(depositShannons)}`);
  console.log(`   Input 1 (Liquid iCKB xUDT being Burned):`);
  console.log(`     iCKB Burned:          ${shannonsToCKB(iCKB_Minted_Raw)}`);
  console.log(`   Output 0 (Redeemed Funds to User):`);
  console.log(`     Lock Script (Owner):  User_Address_Lock`);
  console.log(`     Capacity (Returned):  ${shannonsToCKB(redeemTx.outputs[0].capacity)}`);
  console.log(`     Data:                 0x (Empty)`);
  console.log("   --------------------------");
  console.log("[SUCCESS] Phase 3 Simulation Completed: iCKB burned and CKB + interest redeemed.");
  separator();
  console.log("=== LESSON 14 COMPLETED: Liquid Staking Mechanics Successfully Simulated ===");
  separator();
  process.exit(0);
}

main().catch((err) => {
  console.error("[ERROR] Fatal error running iCKB simulation:", err);
  process.exit(1);
});
