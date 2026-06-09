import { ccc } from "@ckb-ccc/core";

// ============================================================================
// EMBEDDED CONCEPTS & SETTINGS
// ============================================================================

// Decimals for our custom token (Standard for CKB tokens is 8)
const DECIMALS = 8;
const TOKEN_FACTOR = 10n ** BigInt(DECIMALS);

// Supply sizes
const TOTAL_MINT_SUPPLY = 1_000_000n * TOKEN_FACTOR; // 1M tokens
const TRANSFER_AMOUNT = 250_000n * TOKEN_FACTOR;     // 250k tokens

// Brand Config (Ngoc's Extensible Token)
const TOKEN_SYMBOL = "xNGOCVO";
const TOKEN_NAME = "Ngoc's Extensible Token";

// OffCKB pre-funded Devnet/Testnet accounts:
// We use the same Sender Account #2 as Sender/Issuer and Account #5 as Receiver
const SENDER_PRIVKEY = "0x59ddda57ba06d6e9c5fa9040bdb98b4b098c2fce6520d39f51bc5e825364697a";
const SENDER_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";
const RECEIVER_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgdl92j7574rgmc4w3x00y93kk6g3lggqq23mmmd";

// Connect to CKB Public Testnet
const client = new ccc.ClientPublicTestnet();

// ============================================================================
// METADATA SERIALIZER HELPERS
// ============================================================================

/**
 * Tightly packs token metadata into a binary buffer matching the standard format:
 * [decimals: 1 byte] [symbol_len: 1 byte] [symbol: var bytes] [name_len: 1 byte] [name: var bytes]
 */
function tokenInfoToBytes(decimals: number, symbol: string, name: string): string {
  const decimalsBuf = Buffer.alloc(1);
  decimalsBuf.writeUInt8(decimals, 0);

  const symbolBuf = Buffer.from(symbol, "utf-8");
  const symbolLenBuf = Buffer.alloc(1);
  symbolLenBuf.writeUInt8(symbolBuf.length, 0);

  const nameBuf = Buffer.from(name, "utf-8");
  const nameLenBuf = Buffer.alloc(1);
  nameLenBuf.writeUInt8(nameBuf.length, 0);

  const totalBuf = Buffer.concat([decimalsBuf, symbolLenBuf, symbolBuf, nameLenBuf, nameBuf]);
  return "0x" + totalBuf.toString("hex");
}

/**
 * Parses packed binary token metadata from on-chain back to structured fields.
 */
function bytesToTokenInfo(hex: string): { decimals: number; symbol: string; name: string } {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const buf = Buffer.from(cleanHex, "hex");
  let offset = 0;

  const decimals = buf.readUInt8(offset);
  offset += 1;

  const symbolLen = buf.readUInt8(offset);
  offset += 1;

  const symbol = buf.toString("utf-8", offset, offset + symbolLen);
  offset += symbolLen;

  const nameLen = buf.readUInt8(offset);
  offset += 1;

  const name = buf.toString("utf-8", offset, offset + nameLen);

  return { decimals, symbol, name };
}

/**
 * Helper to display large token balances cleanly with decimal points
 */
function formatTokenBalance(amount: bigint): string {
  const whole = amount / TOKEN_FACTOR;
  const frac = amount % TOKEN_FACTOR;
  const wholeNum = Number(whole);
  return frac === 0n
    ? `${wholeNum.toLocaleString()}`
    : `${wholeNum.toLocaleString()}.${frac.toString().padStart(DECIMALS, "0").replace(/0+$/, "")}`;
}

// Visual separator
function separator(): void {
  console.log("=".repeat(80));
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function main() {
  separator();
  console.log("=== STARTING LESSON 4: Fungible Tokens (xUDT Core & Brand Metadata) ===");
  separator();

  const tip = await client.getTip();
  console.log(`[INFO] Public Testnet is online! Current block height: ${tip}`);
  console.log();

  // Helper for native CKB balance
  const getCkbBalance = async (addr: string): Promise<bigint> => {
    const addrObj = await ccc.Address.fromString(addr, client);
    return await client.getBalance([addrObj.script]);
  };

  console.log("[INFO] Checking Sender/Receiver native wallet balances...");
  const initialSenderCKB = await getCkbBalance(SENDER_ADDRESS);
  const initialReceiverCKB = await getCkbBalance(RECEIVER_ADDRESS);
  console.log(`   [Sender]   Native CKB: ${(initialSenderCKB / 100_000_000n).toLocaleString()} CKB`);
  console.log(`   [Receiver] Native CKB: ${(initialReceiverCKB / 100_000_000n).toLocaleString()} CKB`);
  console.log();

  // Initialize cryptographic signer
  console.log("[INFO] Initializing cryptographical signer...");
  const signer = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);
  const senderAddressObj = await ccc.Address.fromString(SENDER_ADDRESS, client);
  const receiverAddressObj = await ccc.Address.fromString(RECEIVER_ADDRESS, client);
  
  // Calculate token script arguments
  // xUDT args: owner lock script hash + 4 bytes extension flags ("00000000" for none)
  const xudtArgs = senderAddressObj.script.hash() + "00000000";
  const xUdtType = await ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.XUdt,
    xudtArgs
  );
  console.log(`   xUDT Type Script Args: ${xudtArgs}`);
  console.log();

  // ============================================================================
  // PART 1 — CORE xUDT OPERATIONS
  // ============================================================================
  separator();
  console.log("=== [PART 1] CORE xUDT OPERATIONS: Issuance, Query, and Transfer ===");
  separator();

  // 1. Issuance (Minting)
  console.log(`[INFO] Minting ${formatTokenBalance(TOTAL_MINT_SUPPLY)} custom tokens to Sender...`);
  
  const mintTx = ccc.Transaction.from({
    outputs: [
      {
        lock: senderAddressObj.script,
        type: xUdtType,
      }
    ],
    outputsData: [ccc.numLeToBytes(TOTAL_MINT_SUPPLY, 16)] // uint128 balance representation
  });

  await mintTx.addCellDepsOfKnownScripts(client, ccc.KnownScript.XUdt);
  await mintTx.completeInputsByCapacity(signer);
  await mintTx.completeFeeBy(signer, 1000n);

  console.log("[INFO] Signing and broadcasting Token Minting transaction...");
  const mintTxHash = await signer.sendTransaction(mintTx);
  console.log(`[TX] Mint Transaction Hash: ${mintTxHash}`);
  console.log("   Waiting for mint transaction to commit (approx. 5-10s)...");
  
  // Poll transaction status
  let isCommitted = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    process.stdout.write(`   Polling status... (Attempt ${attempt}/20)\r`);
    const status = await client.getTransaction(mintTxHash);
    if (status && status.status === "committed") {
      isCommitted = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log();
  if (isCommitted) console.log("[SUCCESS] Mint transaction successfully committed!");
  console.log();

  // 2. Query Balance
  console.log("[INFO] Scanning ledger for live xUDT token cells...");
  const queryBalance = async (addrScript: ccc.Script): Promise<bigint> => {
    let balance = 0n;
    const collector = client.findCellsByLock(addrScript, xUdtType);
    for await (const cell of collector) {
      balance += ccc.numLeFromBytes(cell.outputData); // parse uint128 Little Endian
    }
    return balance;
  };

  const senderBalanceBefore = await queryBalance(senderAddressObj.script);
  console.log(`   [Sender] Token Balance: ${formatTokenBalance(senderBalanceBefore)} tokens`);
  console.log();

  // 3. Transfer UDT
  console.log(`[INFO] Transferring ${formatTokenBalance(TRANSFER_AMOUNT)} tokens to Receiver...`);
  
  const transferTx = ccc.Transaction.from({
    outputs: [
      {
        lock: receiverAddressObj.script,
        type: xUdtType,
      }
    ],
    outputsData: [ccc.numLeToBytes(TRANSFER_AMOUNT, 16)]
  });

  // Automatically fetch input cells containing Sender's tokens to cover transfer
  await transferTx.completeInputsByUdt(signer, xUdtType);

  // Calculate UDT change cell
  const inputsBalance = await transferTx.getInputsUdtBalance(client, xUdtType);
  const outputsBalance = transferTx.getOutputsUdtBalance(xUdtType);
  const changeBalance = inputsBalance - outputsBalance;
  
  if (changeBalance > 0n) {
    console.log(`   Generating change cell returning ${formatTokenBalance(changeBalance)} tokens to Sender...`);
    transferTx.addOutput(
      {
        lock: senderAddressObj.script,
        type: xUdtType,
      },
      ccc.numLeToBytes(changeBalance, 16)
    );
  }

  await transferTx.addCellDepsOfKnownScripts(client, ccc.KnownScript.XUdt);
  await transferTx.completeInputsByCapacity(signer);
  await transferTx.completeFeeBy(signer, 1000n);

  console.log("[INFO] Signing and broadcasting Transfer transaction...");
  const transferTxHash = await signer.sendTransaction(transferTx);
  console.log(`[TX] Transfer Transaction Hash: ${transferTxHash}`);
  console.log("   Waiting for transfer transaction to commit (approx. 5-10s)...");

  isCommitted = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    process.stdout.write(`   Polling status... (Attempt ${attempt}/20)\r`);
    const status = await client.getTransaction(transferTxHash);
    if (status && status.status === "committed") {
      isCommitted = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log();
  if (isCommitted) console.log("[SUCCESS] Transfer transaction committed!");
  console.log();

  const senderBalanceAfter = await queryBalance(senderAddressObj.script);
  const receiverBalanceAfter = await queryBalance(receiverAddressObj.script);
  
  console.log("=== Post-Transfer Token Ledgers ===");
  console.log(`   - [Sender]   Balance: ${formatTokenBalance(senderBalanceAfter)} tokens`);
  console.log(`   - [Receiver] Balance: ${formatTokenBalance(receiverBalanceAfter)} tokens`);
  console.log();

  // ============================================================================
  // PART 2 — TOKEN BRANDING & METADATA
  // ============================================================================
  separator();
  console.log("=== [PART 2] TOKEN BRANDING: Generating On-Chain Token Metadata Cell ===");
  separator();

  console.log(`[INFO] Packaging metadata parameters:`);
  console.log(`   - Name:      "${TOKEN_NAME}"`);
  console.log(`   - Symbol:    "${TOKEN_SYMBOL}"`);
  console.log(`   - Decimals:  ${DECIMALS}`);
  
  const packedMetadataHex = tokenInfoToBytes(DECIMALS, TOKEN_SYMBOL, TOKEN_NAME);
  console.log(`   Packed Hex representation: ${packedMetadataHex}`);
  console.log();

  console.log("[INFO] Allocating Metadata Cell...");
  // We lock this metadata cell under the Issuer's address to maintain administrative ownership.
  const metadataTx = ccc.Transaction.from({
    outputs: [
      {
        lock: senderAddressObj.script,
      }
    ],
    outputsData: [packedMetadataHex]
  });

  await metadataTx.completeInputsByCapacity(signer);
  await metadataTx.completeFeeBy(signer, 1000n);

  console.log("[INFO] Broadcasting Metadata Registration...");
  const metadataTxHash = await signer.sendTransaction(metadataTx);
  console.log(`[TX] Metadata Transaction Hash: ${metadataTxHash}`);
  console.log("   Waiting for block inclusion...");

  isCommitted = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    process.stdout.write(`   Polling status... (Attempt ${attempt}/20)\r`);
    const status = await client.getTransaction(metadataTxHash);
    if (status && status.status === "committed") {
      isCommitted = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log();
  if (isCommitted) console.log("[SUCCESS] Metadata successfully written on-chain!");
  console.log();

  // Read metadata back from the chain
  console.log("[INFO] Querying live Metadata Cell from the ledger...");
  const liveMetadataCell = await client.getCellLive({ txHash: metadataTxHash, index: 0 }, true);
  if (!liveMetadataCell) {
    throw new Error("[ERROR] Could not query the written metadata cell.");
  }

  const retrievedMetadataHex = liveMetadataCell.outputData;
  console.log(`   Fetched Raw Hex from chain: ${retrievedMetadataHex}`);

  console.log("[INFO] Unpacking and parsing binary fields...");
  const parsedBrand = bytesToTokenInfo(retrievedMetadataHex);
  
  console.log();
  separator();
  console.log("=== ON-CHAIN BRANDED TOKEN DASHBOARD ===");
  separator();
  console.log(`   Token Name:   ${parsedBrand.name}`);
  console.log(`   Token Symbol: ${parsedBrand.symbol}`);
  console.log(`   Decimals:     ${parsedBrand.decimals}`);
  console.log(`   Description:  My first custom token on Nervos CKB!`);
  console.log(`   Type Script:  xUDT Script (Args: ${xudtArgs.slice(0, 20)}...)`);
  separator();
  console.log();

  const finalSenderCKB = await getCkbBalance(SENDER_ADDRESS);
  console.log(`[INFO] Sender Final Native Balance: ${(finalSenderCKB / 100_000_000n).toLocaleString()} CKB`);
  separator();
  
  // Cleanly terminate HTTP sockets to exit immediately
  process.exit(0);
}

main().catch((err) => {
  console.error("[ERROR] Fatal Error executing Token script:", err);
  process.exit(1);
});
