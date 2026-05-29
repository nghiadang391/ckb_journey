import { ccc, CellDepInfoLike, KnownScript, Script } from "@ckb-ccc/core";
import systemScripts from "../system-scripts.json";

// ============================================================================
// EMBEDDED CONCEPTS & SETTINGS
// ============================================================================

// 1 CKB = 100,000,000 Shannons (1 shannon is the smallest unit of CKB)
const ONE_CKB = 100_000_000n;

// OffCKB pre-funded Devnet accounts:
// We use Account #2 as Sender and Account #5 as Receiver
const SENDER_PRIVKEY = "0x59ddda57ba06d6e9c5fa9040bdb98b4b098c2fce6520d39f51bc5e825364697a";
const SENDER_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";

const RECEIVER_PRIVKEY = "0x6f358d92f408511707803d292efa148236a2e114d73a472be2a07e0ba49200c7";
const RECEIVER_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgdl92j7574rgmc4w3x00y93kk6g3lggqq23mmmd";

// Amount to transfer: 500 CKB
const TRANSFER_AMOUNT_CKB = 500n;

type ScriptInfo = Pick<Script, "codeHash" | "hashType"> & { cellDeps: CellDepInfoLike[] };

// Configure known scripts for our local devnet environment.
// These point the CCC SDK to local system contracts (like SECP256K1) on our Devnet blockchain node.
const DEVNET_SCRIPTS: Record<string, ScriptInfo> = {
  [KnownScript.Secp256k1Blake160]:
    systemScripts.devnet.secp256k1_blake160_sighash_all!.script as ScriptInfo,
  [KnownScript.Secp256k1Multisig]:
    systemScripts.devnet.secp256k1_blake160_multisig_all!.script as ScriptInfo,
  [KnownScript.AnyoneCanPay]: systemScripts.devnet.anyone_can_pay!.script as ScriptInfo,
  [KnownScript.OmniLock]: systemScripts.devnet.omnilock!.script as ScriptInfo,
  [KnownScript.XUdt]: systemScripts.devnet.xudt!.script as ScriptInfo,
  [KnownScript.NervosDao]: systemScripts.devnet.dao!.script as ScriptInfo,
};

// Connect to the public Testnet (Pudge)
const client = new ccc.ClientPublicTestnet();

// Helper for shannon conversion
function shannonsToCKB(shannons: bigint): string {
  const whole = shannons / ONE_CKB;
  const frac = shannons % ONE_CKB;
  return frac === 0n
    ? `${whole} CKB`
    : `${whole}.${frac.toString().padStart(8, "0").replace(/0+$/, "")} CKB`;
}

// Visual separator
function separator(): void {
  console.log("=".repeat(70));
}

// Function to fetch wallet balance in CKB
async function getBalance(address: string): Promise<bigint> {
  const addr = await ccc.Address.fromString(address, client);
  return await client.getBalance([addr.script]);
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function main() {
  separator();
  console.log("=== STARTING LESSON 2: Simple CKB Transfer on Local Devnet ===");
  separator();

  // 1. Verify Connection
  const tip = await client.getTip();
  console.log(`[INFO] Local node is online! Current Devnet Block Height: ${tip}`);
  console.log();

  // 2. Query initial balances
  console.log("[INFO] Reading initial ledger balances...");
  const initialSenderBalance = await getBalance(SENDER_ADDRESS);
  const initialReceiverBalance = await getBalance(RECEIVER_ADDRESS);

  console.log(`   [Sender]   ${SENDER_ADDRESS.slice(0, 10)}...${SENDER_ADDRESS.slice(-8)}`);
  console.log(`              Balance: ${shannonsToCKB(initialSenderBalance)}`);
  console.log(`   [Receiver] ${RECEIVER_ADDRESS.slice(0, 10)}...${RECEIVER_ADDRESS.slice(-8)}`);
  console.log(`              Balance: ${shannonsToCKB(initialReceiverBalance)}`);
  console.log();

  if (initialSenderBalance < (TRANSFER_AMOUNT_CKB * ONE_CKB)) {
    throw new Error("[ERROR] Sender does not have enough CKB to cover the transfer!");
  }

  // 3. Initialize Signer
  // A Signer holds the private key used to sign transaction hashes
  console.log("[INFO] Initializing Sender cryptographic signer...");
  const senderSigner = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);
  console.log("   Sender Signer initialized successfully.");
  console.log();

  // 4. Construct Transaction (malloc new memory cell for Receiver)
  console.log(`[INFO] Allocating transfer transaction (Sending ${TRANSFER_AMOUNT_CKB} CKB)...`);
  const receiverAddrObj = await ccc.Address.fromString(RECEIVER_ADDRESS, client);

  // We define the target Output cell that will be allocated to the Receiver
  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: receiverAddrObj.script,
        capacity: TRANSFER_AMOUNT_CKB * ONE_CKB
      }
    ],
    outputsData: ["0x"] // No data stored in this cell, just native capacity transfer
  });

  // 5. Complete transaction inputs & fees (free up old cells for balance)
  console.log("[INFO] Assembling transaction inputs (UTXO matching)...");
  // Automatically search the sender's live cells and add them as Inputs to cover output capacity
  await tx.completeInputsByCapacity(senderSigner);

  console.log("[INFO] Calculating and adding transaction gas/byte fees...");
  // Automatically calculate the required transaction fee and subtract it from the change cell
  await tx.completeFeeBy(senderSigner, 1000n); // 1000 shannons per byte fee rate

  // 6. Sign and broadcast transaction to Devnet pool
  console.log("[INFO] Signing transaction inputs with Sender private key...");
  const txHash = await senderSigner.sendTransaction(tx);

  console.log(`[TX] Transaction broadcasted to local Devnet mempool!`);
  console.log(`   Transaction Hash: ${txHash}`);
  console.log("   Waiting for block producer to mine the transaction (approx. 1-2s)...");
  console.log();

  // 7. Wait and check final balances
  // We poll the transaction status until it is confirmed
  let isConfirmed = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    const status = await client.getTransaction(txHash);
    if (status && status.status === "committed") {
      isConfirmed = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (isConfirmed) {
    console.log("[SUCCESS] Transaction successfully mined and committed into block!");
  } else {
    console.log("[WARNING] Transaction is taking longer than expected to commit. Checking balances anyway...");
  }
  console.log();

  separator();
  console.log("=== TRANSACTION RESULT & FINAL BALANCES ===");
  separator();

  const finalSenderBalance = await getBalance(SENDER_ADDRESS);
  const finalReceiverBalance = await getBalance(RECEIVER_ADDRESS);

  console.log(`   [Sender]   Balance: ${shannonsToCKB(finalSenderBalance)}`);
  console.log(`              Diff:    -${shannonsToCKB(initialSenderBalance - finalSenderBalance)}`);
  console.log(`   [Receiver] Balance: ${shannonsToCKB(finalReceiverBalance)}`);
  console.log(`              Diff:    +${shannonsToCKB(finalReceiverBalance - initialReceiverBalance)}`);
  console.log();
  console.log("[SUCCESS] Success! You just executed a bare-metal state transition on CKB!");
  separator();
}

main().catch((err) => {
  console.error("[ERROR] Fatal Error executing transfer script:", err);
  process.exit(1);
});
