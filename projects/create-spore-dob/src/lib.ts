import { setSporeConfig, createSpore } from "@spore-sdk/core";
import { SPORE_CONFIG } from "./spore-config";
import { createDefaultLockWallet } from "./helper";
import { unpackToRawSporeData } from "@spore-sdk/core";
import { ccc, Script } from "@ckb-ccc/core";
import { cccClient } from "./ccc-client";

setSporeConfig(SPORE_CONFIG);

type Account = {
  lockScript: Script;
  address: string;
  pubKey: string;
};

export const generateAccountFromPrivateKey = async (
  privKey: string
): Promise<Account> => {
  const signer = new ccc.SignerCkbPrivateKey(cccClient, privKey);
  const lock = await signer.getAddressObjSecp256k1();
  return {
    lockScript: lock.script,
    address: lock.toString(),
    pubKey: signer.publicKey,
  };
};

export async function capacityOf(address: string): Promise<bigint> {
  const addr = await ccc.Address.fromString(address, cccClient);
  let balance = await cccClient.getBalance([addr.script]);
  return balance;
}

export async function createSporeDOB(
  privkey: string,
  content: Uint8Array,
  contentType = "text/plain"
): Promise<{ txHash: string; outputIndex: number }> {
  const wallet = createDefaultLockWallet(privkey);

  const { txSkeleton, outputIndex } = await createSpore({
    data: {
      contentType,
      content,
    },
    toLock: wallet.lock,
    fromInfos: [wallet.address],
    config: SPORE_CONFIG,
  });

  const txHash = await wallet.signAndSendTransaction(txSkeleton);
  console.log(`Spore created at transaction: ${txHash}`);
  console.log(
    `Spore ID: ${
      txSkeleton.get("outputs").get(outputIndex)!.cellOutput.type!.args
    }`
  );
  return { txHash, outputIndex };
}

// maybe change this to spore id
export async function showSporeContent(txHash: string, index = 0) {
  console.log("   Waiting for transaction block inclusion (polling devnet)...");
  let isCommitted = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const status = await cccClient.getTransaction(txHash);
    if (status && status.status === "committed") {
      isCommitted = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!isCommitted) {
    throw new Error("[ERROR] Transaction took too long to commit.");
  }

  const indexHex = "0x" + index.toString(16);
  const cell = await cccClient.getCellLive({ txHash, index: indexHex }, true);
  if (cell == null) {
    throw new Error("[ERROR] Cell not found, even after transaction block commitment.");
  }
  const sporeData = unpackToRawSporeData(cell.outputData);
  console.log("spore data: ", sporeData);
  return sporeData;
}

export function shannonToCKB(amount: bigint){
  return amount / 100000000n;
}
