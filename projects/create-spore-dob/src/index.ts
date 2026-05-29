/**
 * WHAT THIS CODE DOES:
 * Mints an on-chain Digital Object Byte (DOB) using the Spore SDK and CCC.
 * It reads a local file, packages it into a Spore structure, constructs and signs
 * the transaction on the local devnet, and queries it back via CKB JSON-RPC to verify content.
 * 
 * HOW TO RUN IT:
 * 1. cd ckb_journey/projects/create-spore-dob
 * 2. npm install
 * 3. NETWORK=devnet npm start
 * 
 * DIRECT EQUIVALENT IN MICROCONTROLLER C FIRMWARE:
 * In C, this is equivalent to writing structured raw digital data (e.g. calibration settings,
 * firmware images, raw logs) directly to a dedicated EEPROM sector on-chain:
 * ```c
 * eeprom_write_block(raw_data_buffer, TARGET_SECTOR_ADDRESS, data_length);
 * ```
 * The CKB Spore protocol secures this byte memory block on the decentralized global heap (Cells).
 */

import fs from "fs";
import path from "path";
import { generateAccountFromPrivateKey, capacityOf, createSporeDOB, showSporeContent, shannonToCKB } from "./lib";

// Visual separator helper
function separator(): void {
  console.log("=".repeat(80));
}

// Visual divider helper
function divider(): void {
  console.log("-".repeat(80));
}

// Pre-funded Devnet Account 2 credentials
const SENDER_PRIVKEY = "0x59ddda57ba06d6e9c5fa9040bdb98b4b098c2fce6520d39f51bc5e825364697a";

async function main() {
  separator();
  console.log("=== STARTING LESSON 07: Spore DOB Creation (create-dob) ===");
  separator();

  // Create a mock raw binary asset to store on CKB
  const assetContent = "Ngoc's persistent digital object bytes flashed onto CKB global memory!";
  const sampleFilePath = path.join(__dirname, "sample-asset.txt");
  fs.writeFileSync(sampleFilePath, assetContent, "utf-8");

  console.log("[INFO] Running Part 1: Initializing Sender & Reading Asset");

  // 1. Initial State Check
  const senderInfo = await generateAccountFromPrivateKey(SENDER_PRIVKEY);
  const initialBalance = await capacityOf(senderInfo.address);

  console.log(`   - Sender Address:   ${senderInfo.address.slice(0, 15)}...${senderInfo.address.slice(-15)}`);
  console.log(`   - Native CKB:       ${shannonToCKB(initialBalance)} CKB`);

  const rawBytes = fs.readFileSync(sampleFilePath);
  console.log(`   - Local Asset File: ${sampleFilePath}`);
  console.log(`   - Size of Asset:    ${rawBytes.length} bytes`);
  console.log();

  // 2. Part 1: Minting the Spore DOB
  divider();
  console.log("[INFO] Running Part 2: Minting Spore DOB On-Chain");
  divider();

  console.log("[INFO] Constructing Spore skeleton and broadcasting mint transaction...");
  const { txHash, outputIndex } = await createSporeDOB(SENDER_PRIVKEY, new Uint8Array(rawBytes));
  console.log("[SUCCESS] Spore DOB successfully created!");
  console.log(`   - Mint Tx Hash:     ${txHash}`);
  console.log(`   - Output Cell Index: ${outputIndex}`);
  console.log();

  // 3. Part 2: Querying the Spore DOB Cell from CKB
  divider();
  console.log("[INFO] Running Part 3: Retrieving and Verifying On-Chain Content");
  divider();

  console.log("[INFO] Querying live Spore cell via CKB JSON-RPC...");
  const sporeData = await showSporeContent(txHash, outputIndex);

  if (!sporeData) {
    throw new Error("[ERROR] Failed to retrieve Spore cell data from the blockchain.");
  }

  // Parse retrieved content back to raw string.
  // sporeData.content is a 0x-prefixed hex string (CCC Bytes type), so we must
  // strip the prefix and decode from hex before converting to UTF-8.
  const contentHex = typeof sporeData.content === "string"
    ? (sporeData.content as string).replace(/^0x/, "")
    : Buffer.from(sporeData.content as Uint8Array).toString("hex");
  const retrievedContent = Buffer.from(contentHex, "hex").toString("utf-8");

  console.log(`   - Decoded Content:  "${retrievedContent}"`);
  console.log(`   - Content Type:     ${sporeData.contentType}`);
  console.log(`   - Content Match:    ${retrievedContent === assetContent ? "YES" : "NO"}`);
  console.log();

  // Capacity cost analysis
  const finalBalance = await capacityOf(senderInfo.address);
  const lockedCapacity = initialBalance - finalBalance;
  console.log(`[INFO] Capacity cost analysis:`);
  console.log(`   - Locked Capacity:  ${shannonToCKB(lockedCapacity)} CKB`);
  console.log("     (Includes base cell size, data size, and transaction fees)");

  if (retrievedContent === assetContent) {
    console.log("   [SUCCESS] Spore DOB verified successfully. Content round-trip matches exactly!");
  } else {
    console.log("   [ERROR] DOB Content mismatch.");
  }

  separator();
  console.log("=== LESSON 07 COMPLETED SUCCESSFULLY ===");
  separator();

  // Cleanly exit network sockets
  process.exit(0);
}

main().catch((err) => {
  console.error("[ERROR] Fatal error running create-spore-dob script:", err);
  process.exit(1);
});
