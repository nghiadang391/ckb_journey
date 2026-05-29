import { ccc } from "@ckb-ccc/core";

// ============================================================================
// EMBEDDED CONCEPTS & SETTINGS
// ============================================================================

// 1 CKB = 100,000,000 Shannons (1 shannon is the smallest unit of CKB)
const ONE_CKB = 100_000_000n;

// OffCKB pre-funded account:
// We use the same Sender Account #2 as in Lesson 2
const SENDER_PRIVKEY = "0x59ddda57ba06d6e9c5fa9040bdb98b4b098c2fce6520d39f51bc5e825364697a";
const SENDER_ADDRESS = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";

// The message we want to store on-chain.
const MESSAGE_TO_STORE = "Hello CKB from an embedded developer! Lesson 03 completed.";

// Connect to the public Testnet (Pudge) to align with Lesson 2
const client = new ccc.ClientPublicTestnet();

// ============================================================================
// HELPER FUNCTIONS (UTF-8 <-> Hex Converter)
// ============================================================================

/**
 * Converts a UTF-8 string to a '0x'-prefixed hex string.
 * Equiv to: memcpy(hex_buf, utf8_str, len) in C but outputting hex characters.
 */
function utf8ToHex(str: string): string {
  return "0x" + Buffer.from(str, "utf-8").toString("hex");
}

/**
 * Converts a '0x'-prefixed hex string back to a UTF-8 string.
 */
function hexToUtf8(hex: string): string {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  return Buffer.from(cleanHex, "hex").toString("utf-8");
}

/**
 * Helper to display shannons in clean CKB format
 */
function shannonsToCKB(shannons: bigint): string {
  const whole = shannons / ONE_CKB;
  const frac = shannons % ONE_CKB;
  return frac === 0n
    ? `${whole} CKB`
    : `${whole}.${frac.toString().padStart(8, "0").replace(/0+$/, "")} CKB`;
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
  console.log("=== STARTING LESSON 3: Store Data on Cell (WRITE -> READ -> ANALYZE) ===");
  separator();

  // 0. Verify Connection
  const tip = await client.getTip();
  console.log(`[INFO] Public Testnet is online! Current block height: ${tip}`);
  console.log();

  // Helper for balance
  const getBalance = async (addr: string): Promise<bigint> => {
    const addrObj = await ccc.Address.fromString(addr, client);
    return await client.getBalance([addrObj.script]);
  };

  // 1. Initial State Check
  console.log("[INFO] Checking Sender wallet balance...");
  const initialBalance = await getBalance(SENDER_ADDRESS);
  console.log(`   Address: ${SENDER_ADDRESS.slice(0, 15)}...${SENDER_ADDRESS.slice(-15)}`);
  console.log(`   Balance: ${shannonsToCKB(initialBalance)}`);
  console.log();

  // ============================================================================
  // OPERATION 1 — WRITE: Store a text message on-chain
  // ============================================================================
  console.log("[WRITE] Storing UTF-8 message on-chain");
  console.log(`   Original Message: "${MESSAGE_TO_STORE}"`);
  
  const hexMessage = utf8ToHex(MESSAGE_TO_STORE);
  const messageBytes = Buffer.byteLength(MESSAGE_TO_STORE, "utf-8");
  console.log(`   Hex Encoded:      ${hexMessage}`);
  console.log(`   Message Size:     ${messageBytes} bytes`);
  console.log();

  console.log("[INFO] Initializing cryptographical signer...");
  const signer = new ccc.SignerCkbPrivateKey(client, SENDER_PRIVKEY);
  const senderAddressObj = await ccc.Address.fromString(SENDER_ADDRESS, client);
  console.log("   Signer initialized successfully.");
  console.log();

  console.log("[INFO] Constructing Cell structure...");
  // In CKB, cells store data in their data field.
  // 1 CKB capacity covers 1 byte of space.
  // Base Cell overhead is 61 CKB (lock script: 53 bytes, capacity: 8 bytes).
  // Total capacity needed = 61 CKB + messageBytes CKB.
  const requiredCapacity = (61n + BigInt(messageBytes)) * ONE_CKB;
  console.log(`   Required Cell Capacity: ${shannonsToCKB(requiredCapacity)} (61 CKB base + ${messageBytes} CKB data)`);

  const tx = ccc.Transaction.from({
    outputs: [
      {
        lock: senderAddressObj.script,
        capacity: requiredCapacity,
      },
    ],
    outputsData: [hexMessage],
  });

  console.log("[INFO] Assembling inputs and calculating transaction fees...");
  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000n); // 1000 shannons/byte fee rate

  console.log("[INFO] Signing and broadcasting transaction...");
  const txHash = await signer.sendTransaction(tx);
  console.log(`[TX] Transaction broadcasted to Mempool!`);
  console.log(`   Transaction Hash: ${txHash}`);
  console.log("   Waiting for transaction to be mined and committed (approx. 5-10s)...");
  console.log();

  // Poll transaction status
  let isConfirmed = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    process.stdout.write(`   Polling transaction status... (Attempt ${attempt}/20)\r`);
    const status = await client.getTransaction(txHash);
    if (status && status.status === "committed") {
      isConfirmed = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log();

  if (isConfirmed) {
    console.log("[SUCCESS] Transaction successfully committed to block!");
  } else {
    console.log("[WARNING] Transaction took longer than expected to commit. Querying the state anyway...");
  }
  console.log();

  // ============================================================================
  // OPERATION 2 — READ: Retrieve the stored message from the chain
  // ============================================================================
  separator();
  console.log("=== [READ] Querying cell data from the blockchain ===");
  separator();
  console.log(`[INFO] Fetching live cell at Transaction Hash ${txHash}, output index 0...`);
  
  // Fetch live cell from the chain
  const cell = await client.getCellLive({ txHash, index: 0 }, true);

  if (!cell) {
    throw new Error("[ERROR] Could not retrieve the freshly created cell from the blockchain.");
  }

  const fetchedDataHex = cell.outputData;
  console.log(`   Retrieved Hex from chain: ${fetchedDataHex}`);
  
  console.log("[INFO] Decoding hex back to human-readable UTF-8 string...");
  const decodedMessage = hexToUtf8(fetchedDataHex);
  console.log(`   Decoded Message:          "${decodedMessage}"`);
  console.log();

  // Verify match
  if (decodedMessage === MESSAGE_TO_STORE) {
    console.log("   [SUCCESS] Decoded message matches original input! Match!");
  } else {
    console.log("   [ERROR] Decoded message does NOT match original! Mismatch.");
  }
  console.log();

  // ============================================================================
  // OPERATION 3 — CAPACITY ANALYSIS: Show the storage cost
  // ============================================================================
  separator();
  console.log("=== [ANALYSIS] Calculating distributed storage cost ===");
  separator();
  
  const cellCapacity = cell.cellOutput.capacity;
  const baseOverheadBytes = 61;
  const dataBytes = messageBytes;
  const totalLockedCKB = cellCapacity / ONE_CKB;

  console.log(`[INFO] Storage Breakdown for this cell:`);
  console.log(`   - Lock Script Size:    53 bytes (SECP256K1 signature validation)`);
  console.log(`   - Capacity Field Size:  8 bytes (tracks native token balance)`);
  console.log(`   --------------------------------------------------------------`);
  console.log(`   - Base Cell Overhead:  ${baseOverheadBytes} CKB`);
  console.log(`   - User Data Field:     ${dataBytes} CKB (${dataBytes} bytes of text)`);
  console.log(`   ==============================================================`);
  console.log(`   - Total Locked Space:  ${totalLockedCKB} CKB (${shannonsToCKB(cellCapacity)})`);
  console.log();
  console.log("[INFO] Key Takeaway: Since 1 CKB = 1 Byte of state storage, this data is locked");
  console.log("   on-chain permanently until the cell is consumed/destroyed.");
  console.log("   When you delete the cell, you get all your CKB back!");
  console.log();

  const finalBalance = await getBalance(SENDER_ADDRESS);
  console.log(`[INFO] Sender Final Balance: ${shannonsToCKB(finalBalance)}`);
  console.log(`[INFO] Total Cost of operation: ${shannonsToCKB(initialBalance - finalBalance)} (including transaction fee)`);
  separator();

  // Cleanly terminate active network sockets to exit the process
  process.exit(0);
}

main().catch((err) => {
  console.error("[ERROR] Fatal Error executing Store Data script:", err);
  process.exit(1);
});
