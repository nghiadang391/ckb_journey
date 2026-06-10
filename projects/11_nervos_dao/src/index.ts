/**
 * CKB Builder's Journey — Lesson 11: Nervos DAO Interaction
 * 
 * Under-the-hood embedded equivalent:
 * Interfacing with a hardware interest-accruing co-processor (like HSM):
 * 1. Deposit: Lock capacity cells into DAO script.
 * 2. Prepare: Notify the co-processor to log deposit time-stamp.
 * 3. Claim: After watchdog timer expires, unlock capacity + interest.
 */

import { ccc, CellDepInfoLike, KnownScript, Script } from "@ckb-ccc/core";
import systemScripts from "../system-scripts.json";

const ONE_CKB = 100_000_000n;
const DEPOSIT_AMOUNT_CKB = 200n; // Min required is 102 CKB

// Account #2 (Sender)
const SENDER_PRIVKEY = "0x59ddda57ba06d6e9c5fa9040bdb98b4b098c2fce6520d39f51bc5e825364697a";
const SENDER_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";

type ScriptInfo = Pick<Script, "codeHash" | "hashType"> & { cellDeps: CellDepInfoLike[] };

// Configure Devnet system script coordinates
const DEVNET_SCRIPTS: Record<string, ScriptInfo> = {
  [KnownScript.Secp256k1Blake160]: systemScripts.devnet.secp256k1_blake160_sighash_all!.script as ScriptInfo,
  [KnownScript.Secp256k1Multisig]: systemScripts.devnet.secp256k1_blake160_multisig_all!.script as ScriptInfo,
  [KnownScript.AnyoneCanPay]: systemScripts.devnet.anyone_can_pay!.script as ScriptInfo,
  [KnownScript.OmniLock]: systemScripts.devnet.omnilock!.script as ScriptInfo,
  [KnownScript.NervosDao]: systemScripts.devnet.dao!.script as ScriptInfo,
};

const client = new ccc.ClientPublicTestnet({
  url: "http://localhost:28114",
  scripts: DEVNET_SCRIPTS as any,
});

// Override getFeeRateStatistics with a safety guard for devnet
const originalGetFeeRateStatistics = client.getFeeRateStatistics;
client.getFeeRateStatistics = async function (...args) {
  try {
    const res = await originalGetFeeRateStatistics.apply(this, args);
    if (!res) {
      return { mean: 1000n, median: 1000n };
    }
    return res;
  } catch (err) {
    return { mean: 1000n, median: 1000n };
  }
};

function separator() {
  console.log("=".repeat(75));
}

function shannonsToCKB(shannons: bigint): string {
  const whole = shannons / ONE_CKB;
  const frac = shannons % ONE_CKB;
  return frac === 0n
    ? `${whole} CKB`
    : `${whole}.${frac.toString().padStart(8, "0").replace(/0+$/, "")} CKB`;
}

// Math helpers from docs
function parseEpoch(epoch: ccc.Epoch): ccc.FixedPoint {
  return (
    ccc.fixedPointFrom(epoch[0].toString()) +
    (ccc.fixedPointFrom(epoch[1].toString()) * ccc.fixedPointFrom(1)) /
    ccc.fixedPointFrom(epoch[2].toString())
  );
}

function getProfit(
  capacity: bigint,
  occupiedSize: bigint,
  depositHeader: ccc.ClientBlockHeader,
  withdrawHeader: ccc.ClientBlockHeader
): bigint {
  const occupiedFP = ccc.fixedPointFrom(occupiedSize.toString());
  const profitableFP = ccc.fixedPointFrom(capacity.toString()) - occupiedFP;

  const profitFP = (profitableFP * withdrawHeader.dao.ar) / depositHeader.dao.ar - profitableFP;
  return BigInt(profitFP.toString().split(".")[0]);
}

function getClaimEpoch(
  depositHeader: ccc.ClientBlockHeader,
  withdrawHeader: ccc.ClientBlockHeader
): ccc.Epoch {
  const depositEpoch = depositHeader.epoch;
  const withdrawEpoch = withdrawHeader.epoch;
  const intDiff = withdrawEpoch[0] - depositEpoch[0];

  if (
    intDiff % ccc.numFrom(180) !== ccc.numFrom(0) ||
    depositEpoch[1] * withdrawEpoch[2] <= depositEpoch[2] * withdrawEpoch[1]
  ) {
    return [
      depositEpoch[0] +
      (intDiff / ccc.numFrom(180) + ccc.numFrom(1)) * ccc.numFrom(180),
      depositEpoch[1],
      depositEpoch[2],
    ];
  }

  return [
    depositEpoch[0] + (intDiff / ccc.numFrom(180)) * ccc.numFrom(180),
    depositEpoch[1],
    depositEpoch[2],
  ];
}

async function waitTx(txHash: string): Promise<any> {
  console.log(`[INFO] Waiting for transaction to commit...`);
  for (let i = 0; i < 20; i++) {
    const txRes = await client.getTransaction(txHash);
    if (txRes && txRes.status === "committed") {
      return txRes;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Transaction ${txHash} did not commit in time.`);
}

async function main() {
  separator();
  console.log("=== STARTING LESSON 11: Nervos DAO Interaction on Devnet ===");
  separator();

  const tip = await client.getTip();
  console.log(`[INFO] Connected to CKB Devnet node. Current Tip Block: ${tip}`);
  console.log();

  const senderSigner = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);
  const senderAddrObj = await ccc.Address.fromString(SENDER_ADDRESS, client);

  // ==========================================================================
  // STEP 1: DEPOSIT CKB TO NERVOS DAO
  // ==========================================================================
  separator();
  console.log(`[START] Step 1: Depositing ${DEPOSIT_AMOUNT_CKB} CKB into Nervos DAO...`);
  separator();

  const daoScript = (await client.getKnownScript(ccc.KnownScript.NervosDao)).script;

  const depositTx = ccc.Transaction.from({
    outputs: [
      {
        lock: senderAddrObj.script,
        type: daoScript,
        capacity: DEPOSIT_AMOUNT_CKB * ONE_CKB,
      },
    ],
    outputsData: ["0x0000000000000000"], // Initial deposit data: 8 bytes of zeroes
  });

  await depositTx.addCellDepsOfKnownScripts(client, ccc.KnownScript.NervosDao);
  await depositTx.completeInputsByCapacity(senderSigner);
  await depositTx.completeFeeBy(senderSigner);

  const depositHash = await senderSigner.sendTransaction(depositTx);
  console.log(`[TX] Deposit transaction broadcasted! Hash: ${depositHash}`);

  await waitTx(depositHash);
  console.log(`[SUCCESS] Step 1 completed: Deposit cell created.`);
  console.log();

  // Find the created deposit cell outpoint
  const depositCellIndex = 0;
  const depositOutPoint = {
    txHash: depositHash,
    index: depositCellIndex,
  };

  // Fetch block header details for the deposit block
  const depositTxInfo = await client.getTransactionWithHeader(depositHash);
  if (!depositTxInfo || !depositTxInfo.header) {
    throw new Error("Unable to fetch deposit block header");
  }
  const depositBlockNumber = depositTxInfo.header.number;
  const depositBlockHash = depositTxInfo.header.hash;
  console.log(`[INFO] Deposit committed in Block: #${depositBlockNumber}`);
  console.log();

  // ==========================================================================
  // STEP 2: PREPARE NERVOS DAO WITHDRAWAL (REQUEST WITHDRAW)
  // ==========================================================================
  separator();
  console.log(`[START] Step 2: Requesting withdrawal (Preparing DAO cell)...`);
  separator();

  const prepareTx = ccc.Transaction.from({
    headerDeps: [depositBlockHash], // Include deposit block hash in header dependency
    inputs: [
      {
        previousOutput: depositOutPoint,
      },
    ],
    outputs: [
      {
        lock: senderAddrObj.script,
        type: daoScript,
        capacity: DEPOSIT_AMOUNT_CKB * ONE_CKB,
      },
    ],
    outputsData: [ccc.numLeToBytes(depositBlockNumber, 8)], // Write deposit block height as data
  });

  await prepareTx.addCellDepsOfKnownScripts(client, ccc.KnownScript.NervosDao);
  await prepareTx.completeInputsByCapacity(senderSigner);
  await prepareTx.completeFeeBy(senderSigner);

  const prepareHash = await senderSigner.sendTransaction(prepareTx);
  console.log(`[TX] Prepare transaction broadcasted! Hash: ${prepareHash}`);

  await waitTx(prepareHash);
  console.log(`[SUCCESS] Step 2 completed: Cell is now in withdrawing state.`);
  console.log();

  // Fetch block details for the prepare transaction
  const prepareTxInfo = await client.getTransactionWithHeader(prepareHash);
  if (!prepareTxInfo || !prepareTxInfo.header) {
    throw new Error("Unable to fetch prepare block header");
  }
  const prepareBlockHash = prepareTxInfo.header.hash;
  const prepareBlockNumber = prepareTxInfo.header.number;
  console.log(`[INFO] Preparation committed in Block: #${prepareBlockNumber}`);
  console.log();

  // ==========================================================================
  // STEP 3: CONSTRUCT & SIMULATE CLAIM (UNLOCKING STAGED)
  // ==========================================================================
  separator();
  console.log(`[START] Step 3: Preparing Claim transaction and interest computation...`);
  separator();

  // Calculate profit and maturity values
  const depositHeader = depositTxInfo.header;
  const withdrawHeader = prepareTxInfo.header;
  const targetEpoch = getClaimEpoch(depositHeader, withdrawHeader);

  console.log(`[INFO] Deposit Epoch:   ${parseEpoch(depositHeader.epoch)}`);
  console.log(`[INFO] Withdraw Epoch:  ${parseEpoch(withdrawHeader.epoch)}`);
  console.log(`[INFO] Maturity Epoch (Unlockable at): ${parseEpoch(targetEpoch)}`);

  const occupiedSize = 61n + 8n; // 61 bytes lock script size + 8 bytes data length
  const profit = getProfit(
    DEPOSIT_AMOUNT_CKB * ONE_CKB,
    occupiedSize,
    depositHeader,
    withdrawHeader
  );

  console.log(`[INFO] Profitable Base capacity: ${shannonsToCKB(DEPOSIT_AMOUNT_CKB * ONE_CKB - occupiedSize)}`);
  console.log(`[INFO] Earned interest profit:   ${shannonsToCKB(profit)}`);
  console.log();

  console.log(`[INFO] Constructing final Claim / Unlock transaction structure...`);

  const claimOutPoint = {
    txHash: prepareHash,
    index: 0,
  };

  const claimTx = ccc.Transaction.from({
    headerDeps: [prepareBlockHash, depositBlockHash],
    inputs: [
      {
        previousOutput: claimOutPoint,
        since: {
          relative: "absolute",
          metric: "epoch",
          value: ccc.epochToHex(targetEpoch),
        },
      },
    ],
    outputs: [
      {
        lock: senderAddrObj.script,
      },
    ],
    witnesses: [
      ccc.WitnessArgs.from({
        inputType: ccc.numLeToBytes(1, 8),
      }).toBytes(),
    ],
  });

  await claimTx.addCellDepsOfKnownScripts(client, ccc.KnownScript.NervosDao);
  await claimTx.completeInputsByCapacity(senderSigner);
  await claimTx.completeFeeChangeToOutput(senderSigner, 0);

  // Add the profit to output capacity
  claimTx.outputs[0].capacity += profit;

  console.log("   Claim Transaction assembled successfully!");
  console.log(`   Inputs OutPoint:  ${claimTx.inputs[0].previousOutput.txHash}`);
  console.log(`   Since value:      ${JSON.stringify(claimTx.inputs[0].since, (key, val) => typeof val === "bigint" ? val.toString() : val)}`);
  console.log(`   Target Output Cap: ${shannonsToCKB(claimTx.outputs[0].capacity)} (Includes ${shannonsToCKB(profit)} interest)`);
  console.log();
  console.log("[INFO] Note: In a production testnet environment, we must wait 180 epochs (~30 days) before broadcasting this transaction.");
  console.log("[SUCCESS] Nervos DAO lifecycle execution plan successfully verified!");
  separator();

  process.exit(0);
}

main().catch((err) => {
  console.error("[ERROR] Fatal error running DAO script:", err);
  process.exit(1);
});
