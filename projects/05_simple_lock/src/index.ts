import { ccc } from "@ckb-ccc/core";
import fs from "fs";
import path from "path";

// ============================================================================
// EMBEDDED CONCEPTS & SETTINGS
// ============================================================================

// 1 CKB = 100,000,000 Shannons
const ONE_CKB = 100_000_000n;

// OffCKB pre-funded devnet accounts:
// We use the same pre-funded Sender Account #2
const SENDER_PRIVKEY = "0x59ddda57ba06d6e9c5fa9040bdb98b4b098c2fce6520d39f51bc5e825364697a";
const SENDER_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";

// Passphrase logic
const CORRECT_PASSPHRASE = "NgocPassphrase123";
const WRONG_PASSPHRASE = "WrongPassphrase123";

import systemScripts from "../system-scripts.json";

// Configure known scripts for our local devnet environment.
const DEVNET_SCRIPTS = {
  [ccc.KnownScript.Secp256k1Blake160]:
    systemScripts.devnet.secp256k1_blake160_sighash_all!.script,
  [ccc.KnownScript.Secp256k1Multisig]:
    systemScripts.devnet.secp256k1_blake160_multisig_all!.script,
  [ccc.KnownScript.AnyoneCanPay]: systemScripts.devnet.anyone_can_pay!.script,
  [ccc.KnownScript.OmniLock]: systemScripts.devnet.omnilock!.script,
  [ccc.KnownScript.XUdt]: systemScripts.devnet.xudt!.script,
  [ccc.KnownScript.NervosDao]: systemScripts.devnet.dao!.script,
};

// Connect to Local Devnet node started by `offckb node`
const client = new ccc.ClientPublicTestnet({
  url: "http://127.0.0.1:28114", // Local RPC proxy
  scripts: DEVNET_SCRIPTS as any,
});

// CKB JS VM configuration from local system scripts:
// Code hash for the ckb_js_vm RISC-V engine on devnet genesis block
const JS_VM_CODE_HASH = "0xac4db0d0c028ba0d73dec9ee5e6a3c0c98fcdfca895402a3285d680e964dcb46";
const JS_VM_CELL_DEP = {
  outPoint: {
    txHash: "0x1bb87da347a776a927ab6593e1e10304ca195f8e24279f039008d5e3115b1bf7",
    index: 15,
  },
  depType: "code" as const,
};

// Visual separator
function separator(): void {
  console.log("=".repeat(80));
}

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function main() {
  separator();
  console.log("=== STARTING LESSON 5: Custom Lock Script (TypeScript via ckb-js-vm) ===");
  separator();

  // 0. Verify Connection
  const tip = await client.getTip();
  console.log(`[INFO] Local Devnet is online! Current block height: ${tip}`);
  console.log();

  // Load signer
  console.log("[INFO] Initializing cryptographic signer...");
  const signer = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);
  const senderAddressObj = await ccc.Address.fromString(SENDER_ADDRESS, client);
  console.log("   Signer initialized successfully.");
  console.log();

  // ============================================================================
  // PART 1 — DEPLOY: Load and Deploy TypeScript Contract Bytecode
  // ============================================================================
  separator();
  console.log("[PART 1] DEPLOYING CUSTOM CONTRACT BYTECODE");
  separator();

  const bytecodePath = path.join("dist", "hash-lock.bc");
  if (!fs.existsSync(bytecodePath)) {
    throw new Error("[ERROR] Compiled bytecode dist/hash-lock.bc not found. Did you run 'npm run build:contract'?");
  }

  const bytecode = fs.readFileSync(bytecodePath);
  const bytecodeHex = "0x" + bytecode.toString("hex");
  const contractDataHash = ccc.hashCkb(bytecode);

  console.log(`   Read compiled bytecode: ${bytecode.length} bytes`);
  console.log(`   Computed Contract Hash: ${contractDataHash}`);
  console.log();

  console.log("[INFO] Allocating cell to deploy contract bytecode...");
  const deployTx = ccc.Transaction.from({
    outputs: [
      {
        lock: senderAddressObj.script,
      },
    ],
    outputsData: [bytecodeHex],
  });

  await deployTx.completeInputsByCapacity(signer);
  await deployTx.completeFeeBy(signer, 1000n);

  console.log("[INFO] Signing and broadcasting Contract Deployment transaction...");
  const deployTxHash = await signer.sendTransaction(deployTx);
  console.log(`[TX] Deployment Transaction Hash: ${deployTxHash}`);
  console.log("   Waiting for block inclusion (approx. 1-2s)...");

  // Poll transaction status
  let isCommitted = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const status = await client.getTransaction(deployTxHash);
    console.log(`   Polling status (Attempt ${attempt}/20): ${status ? status.status : "unknown"}`);
    if (status && status.status === "committed") {
      isCommitted = true;
      break;
    }
    await sleep(1500);
  }

  if (!isCommitted) {
    throw new Error("[ERROR] Deployment transaction was not committed in time.");
  }
  console.log("[SUCCESS] Contract successfully deployed on-chain!");
  console.log();

  // Create references to the deployed contract cell
  const contractCellDep = {
    outPoint: {
      txHash: deployTxHash,
      index: 0,
    },
    depType: "code" as const,
  };

  // ============================================================================
  // PART 2 — LOCK: Create Cell Secured by Our Custom Hash Lock
  // ============================================================================
  separator();
  console.log("[PART 2] LOCKING A CELL UNDER OUR HASH LOCK");
  separator();

  console.log(`[INFO] Configuring expected passphrase: "${CORRECT_PASSPHRASE}"`);
  
  // Blake2b hash of the correct passphrase
  const expectedPassphraseHash = ccc.hashCkb(Buffer.from(CORRECT_PASSPHRASE, "utf-8"));
  console.log(`   Expected Passphrase Hash: ${expectedPassphraseHash}`);

  // Construct mainScript args for CKB-JS-VM:
  // Layout: [2-byte flags (0000)] + [32-byte contract codeHash] + [1-byte hashType (00 for data)] + [32-byte custom args]
  const mainScriptArgs = 
    "0x0000" +
    contractDataHash.slice(2) + 
    "00" + 
    expectedPassphraseHash.slice(2);
  
  const mainScript = {
    codeHash: JS_VM_CODE_HASH,
    hashType: "type" as const,
    args: mainScriptArgs,
  };

  console.log(`   Custom Lock Script Args:  ${mainScriptArgs}`);
  console.log();

  console.log("[INFO] Allocating cell locked by our Hash Lock script (Capacity: 150 CKB)...");
  const lockTx = ccc.Transaction.from({
    outputs: [
      {
        lock: mainScript,
        capacity: 150n * ONE_CKB,
      },
    ],
    outputsData: ["0x"],
    cellDeps: [JS_VM_CELL_DEP, contractCellDep],
  });

  await lockTx.completeInputsByCapacity(signer);
  await lockTx.completeFeeBy(signer, 1000n);

  console.log("[INFO] Broadcasting Lock transaction...");
  const lockTxHash = await signer.sendTransaction(lockTx);
  console.log(`[TX] Lock Transaction Hash: ${lockTxHash}`);
  console.log("   Waiting for block inclusion...");

  isCommitted = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const status = await client.getTransaction(lockTxHash);
    console.log(`   Polling status (Attempt ${attempt}/20): ${status ? status.status : "unknown"}`);
    if (status && status.status === "committed") {
      isCommitted = true;
      break;
    }
    await sleep(1500);
  }
  
  if (!isCommitted) {
    throw new Error("[ERROR] Lock transaction failed to commit.");
  }
  console.log("[SUCCESS] Cell locked successfully!");
  console.log();

  // ============================================================================
  // PART 3 — VERIFY: Test Unlocking Cases
  // ============================================================================
  separator();
  console.log("[PART 3] VERIFYING VALIDATION LOGIC ON-CHAIN");
  separator();

  // Case A: Unlock with the WRONG passphrase
  console.log(`[CASE A] Attempting to unlock with WRONG passphrase "${WRONG_PASSPHRASE}"...`);
  
  const wrongUnlockTx = ccc.Transaction.from({
    inputs: [
      {
        previousOutput: {
          txHash: lockTxHash,
          index: 0,
        },
      },
    ],
    outputs: [
      {
        lock: senderAddressObj.script, // Claim capacity back to our personal wallet
        capacity: 149n * ONE_CKB,
      },
    ],
    outputsData: ["0x"],
    cellDeps: [JS_VM_CELL_DEP, contractCellDep],
  });

  // Inject the WRONG preimage into the witness lock field
  const wrongPreimageBytes = Buffer.from(WRONG_PASSPHRASE, "utf-8");
  wrongUnlockTx.witnesses.push(
    ccc.hexFrom(
      new ccc.WitnessArgs(
        "0x" + wrongPreimageBytes.toString("hex")
      ).toBytes()
    )
  );

  await wrongUnlockTx.completeInputsByCapacity(signer);
  await wrongUnlockTx.completeFeeBy(signer, 1000n);

  try {
    console.log("[INFO] Broadcasting unauthorized unlock transaction (expecting REJECTION)...");
    await signer.sendTransaction(wrongUnlockTx);
    console.log("[WARNING] ERROR: Transaction should have been REJECTED by CKB-VM, but it went through!");
  } catch (error: any) {
    console.log("[SUCCESS] SUCCESS: Transaction was correctly REJECTED by CKB-VM lock script!");
    console.log(`   Validation Error message: "${error.message.split("\n")[0]}"`);
  }
  console.log();

  // Case B: Unlock with the CORRECT passphrase
  console.log(`[CASE B] Attempting to unlock with CORRECT passphrase "${CORRECT_PASSPHRASE}"...`);
  
  const correctUnlockTx = ccc.Transaction.from({
    inputs: [
      {
        previousOutput: {
          txHash: lockTxHash,
          index: 0,
        },
      },
    ],
    outputs: [
      {
        lock: senderAddressObj.script, // Return locked 150 CKB back to our main wallet
        capacity: 149n * ONE_CKB,
      },
    ],
    outputsData: ["0x"],
    cellDeps: [JS_VM_CELL_DEP, contractCellDep],
  });

  // Inject the CORRECT preimage into the witness lock field
  const correctPreimageBytes = Buffer.from(CORRECT_PASSPHRASE, "utf-8");
  correctUnlockTx.witnesses.push(
    ccc.hexFrom(
      new ccc.WitnessArgs(
        "0x" + correctPreimageBytes.toString("hex")
      ).toBytes()
    )
  );

  await correctUnlockTx.completeInputsByCapacity(signer);
  await correctUnlockTx.completeFeeBy(signer, 1000n);

  console.log("[INFO] Broadcasting authorized unlock transaction (expecting SUCCESS)...");
  const correctTxHash = await signer.sendTransaction(correctUnlockTx);
  console.log(`[TX] Unlock Transaction Hash: ${correctTxHash}`);
  console.log("   Waiting for block inclusion...");

  isCommitted = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const status = await client.getTransaction(correctTxHash);
    console.log(`   Polling status (Attempt ${attempt}/20): ${status ? status.status : "unknown"}`);
    if (status && status.status === "committed") {
      isCommitted = true;
      break;
    }
    await sleep(1500);
  }

  if (isCommitted) {
    console.log("[SUCCESS] SUCCESS: Cell successfully unlocked and claimed using the correct passcode! Match!");
  } else {
    console.log("[ERROR] ERROR: Correct unlock transaction failed to commit.");
  }

  separator();
  console.log("=== LESSON 5 COMPLETED SUCCESSFULLY ===");
  separator();
  
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal Error executing Simple Lock loader:", err);
  process.exit(1);
});
