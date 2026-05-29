import { ccc } from "@ckb-ccc/core";

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/** Print a visual separator line */
function separator(): void {
  console.log("=".repeat(70));
}

/**
 * Convert shannons (the smallest CKB unit) to a human-readable CKB string.
 *
 * Just like Bitcoin has satoshis (1 BTC = 100,000,000 satoshis),
 * CKB has shannons:  1 CKByte = 100,000,000 shannons
 * The name "shannon" honours Claude Shannon, father of information theory.
 */
function shannonsToCKB(shannons: bigint): string {
  const whole = shannons / 100_000_000n;
  const frac = shannons % 100_000_000n;
  return frac === 0n
    ? `${whole} CKB`
    : `${whole}.${frac.toString().padStart(8, "0").replace(/0+$/, "")} CKB`;
}

/**
 * Calculate the minimum capacity needed for a cell.
 *
 * Every cell must have enough capacity (CKBytes) to cover its own size in bytes:
 *   8 bytes  — the capacity field itself (uint64)
 *   32 bytes — lock code_hash
 *   1 byte   — lock hash_type
 *   N bytes  — lock args
 *  [32 bytes — type code_hash      (if hasType)
 *   1 byte   — type hash_type      (if hasType)
 *   M bytes  — type args           (if hasType)]
 *   D bytes  — data
 */
function calculateMinCapacity(
  dataBytes: number,
  lockArgsBytes: number,
  hasType: boolean,
  typeArgsBytes: number = 0
): bigint {
  const BASE = 8n + 32n + 1n; // capacity + lock code_hash + lock hash_type
  const lockArgs = BigInt(lockArgsBytes);
  const data = BigInt(dataBytes);
  const typeOverhead = hasType ? 32n + 1n + BigInt(typeArgsBytes) : 0n;
  return (BASE + lockArgs + data + typeOverhead) * 100_000_000n; // to shannons
}

/**
 * Display a Script (lock or type) in a human-friendly way.
 * A Script has three parts:
 *   - codeHash: identifies WHICH program to run (32 bytes as hex)
 *   - hashType: HOW to locate that program on-chain ("type" | "data" | "data1")
 *   - args:     data passed INTO the program (for SECP256K1 this is the owner's pubkey hash)
 */
function displayScript(
  label: string,
  script: ccc.ScriptLike | null | undefined
): void {
  if (!script) {
    console.log(`  ${label}: (none)`);
    console.log(
      `    -> No ${label.toLowerCase()} means this cell has no extra rules.`
    );
    return;
  }

  const codeHash =
    typeof script.codeHash === "string"
      ? script.codeHash
      : "0x" + Buffer.from(script.codeHash as Uint8Array).toString("hex");

  const args =
    typeof script.args === "string"
      ? script.args
      : "0x" + Buffer.from(script.args as Uint8Array).toString("hex");

  const shortCodeHash =
    codeHash.length > 20
      ? codeHash.slice(0, 10) + "..." + codeHash.slice(-8)
      : codeHash;
  const shortArgs =
    args.length > 20 ? args.slice(0, 10) + "..." + args.slice(-8) : args;

  console.log(`  ${label}:`);
  console.log(`    codeHash: ${shortCodeHash}  (full: ${codeHash})`);
  console.log(`    hashType: "${script.hashType}"`);
  console.log(`    args:     ${shortArgs}`);

  if (label === "Lock Script") {
    console.log(
      `    -> The codeHash points to the lock PROGRAM (e.g., secp256k1).`
    );
    console.log(`    -> The args are the owner's public key hash (20 bytes).`);
    console.log(
      `    -> Only the person who can produce a valid signature for these args`
    );
    console.log(`       is allowed to spend this cell.`);
  } else {
    console.log(
      `    -> A type script is present! This cell holds a token, NFT, or`
    );
    console.log(
      `       other structured asset governed by extra validation rules.`
    );
  }
}

// ============================================================================
// MAIN PROGRAM
// ============================================================================
async function main(): Promise<void> {
  separator();
  console.log("  LESSON 1: CKB Cell Model Explorer");
  console.log("  Exploring live cells on CKB Testnet (Pudge)");
  separator();
  console.log();

  // -----------------------------------------------------------------------
  // STEP 2: Connect to CKB Testnet
  // -----------------------------------------------------------------------
  // The CCC SDK ships with a pre-configured public testnet client.
  // No API keys or manual RPC config needed!
  //
  // Think of this like opening a TCP socket to a known CKB node endpoint.
  // Under the hood it points to a public RPC at rpc.ankr.com or similar.
  console.log(">> Step 2: Connecting to CKB Testnet (Pudge)...");
  console.log();

  const client = new ccc.ClientPublicTestnet();

  // Fetch the latest block height to verify the connection.
  // getTip() returns the block number at the tip of the canonical chain.
  const tip = await client.getTip();
  console.log(`   Connected! Current block height: ${tip}`);
  console.log();
  console.log(
    "   What this means: the testnet has produced this many blocks so far."
  );
  console.log(
    "   Each block contains transactions that consume old cells and create new ones."
  );
  console.log();

  // -----------------------------------------------------------------------
  // STEP 3: Define the Lock Script to Query
  // -----------------------------------------------------------------------
  // We search for cells by their LOCK SCRIPT.
  //
  // This lock script uses the standard SECP256K1-BLAKE160 algorithm —
  // the same ownership model as Bitcoin's P2PKH, just with BLAKE160 instead of RIPEMD160.
  //
  // Fields:
  //   codeHash — the hash that identifies the secp256k1 lock program on-chain
  //   hashType  — "type" means we look it up by its type script hash
  //   args      — the owner's public key hash (this is effectively the "address")
  //
  // To use YOUR own address: replace args with your own lock args.
  // You can find them via: offckb accounts  (on your local devnet)
  //                     or: any CKB wallet's "Lock Args" display
  console.log(">> Step 3: Querying live cells by lock script...");
  console.log();

  const lockScript: ccc.ScriptLike = {
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type",
    args: "0xe2fa82e70b062c8644b80ad7ecf6e015e5f352f6",
  };

  console.log(
    "   Searching for cells belonging to address with lock args:",
    lockScript.args
  );
  console.log();
  console.log("   Lock script breakdown:");
  displayScript("Lock Script (Search Filter)", lockScript);
  console.log();
  console.log(
    "   The CKB node will scan its UTXO set and return every live cell"
  );
  console.log("   whose lock script matches this exact pattern.");
  console.log();

  // -----------------------------------------------------------------------
  // STEP 4: Iterate and Display Cells
  // -----------------------------------------------------------------------
  // findCellsByLock() returns an ASYNC GENERATOR.
  //
  // An async generator is like a lazy stream: it fetches cells in batches
  // from the RPC and yields them one by one. This is memory-efficient for
  // addresses with thousands of cells — we never load them all at once.
  //
  // Each yielded `cell` has:
  //   cell.cellOutput.capacity  — capacity in shannons (bigint)
  //   cell.cellOutput.lock      — the lock script object
  //   cell.cellOutput.type      — the type script object (or null/undefined)
  //   cell.outputData           — raw bytes stored in the cell (hex string or Uint8Array)
  console.log(">> Step 4: Analyzing cell structure...");
  console.log();

  const MAX_CELLS_TO_DISPLAY = 5;
  let cellCount = 0;
  let totalCapacity = 0n;
  let cellsWithTypeScript = 0;
  let cellsWithoutTypeScript = 0;

  try {
    for await (const cell of client.findCellsByLock(lockScript)) {
      cellCount++;
      const capacity = cell.cellOutput.capacity;
      totalCapacity += capacity;

      const lock = cell.cellOutput.lock;
      const type = cell.cellOutput.type ?? null;
      const dataHex =
        typeof cell.outputData === "string"
          ? cell.outputData
          : "0x" +
            Buffer.from(cell.outputData as Uint8Array).toString("hex");

      if (type) {
        cellsWithTypeScript++;
      } else {
        cellsWithoutTypeScript++;
      }

      // Print this cell
      separator();
      console.log(`  CELL #${cellCount}`);
      separator();
      console.log();

      // --- Capacity ---
      console.log(`  Capacity:`);
      console.log(`    -> Raw: ${capacity.toString()} shannons`);
      console.log(
        `    -> Human-readable: ${shannonsToCKB(capacity)}`
      );
      console.log(
        `    -> This cell can store up to ${(
          capacity / 100_000_000n
        ).toString()} bytes on-chain.`
      );
      console.log();

      // --- Data ---
      const dataLength = cell.outputData.length;
      if (dataLength === 0 || dataHex === "0x") {
        console.log(`  Data: (empty)`);
        console.log(
          `    -> This cell stores no extra data — just native CKByte value.`
        );
        console.log(
          `    -> It is a "plain CKB cell" used purely to hold capacity.`
        );
      } else {
        const displayData =
          dataHex.length > 66 ? dataHex.slice(0, 66) + "..." : dataHex;
        console.log(`  Data: ${displayData}`);
        console.log(`    -> ${dataLength} bytes of data stored in this cell.`);
        console.log(
          `    -> Could be: token amounts, NFT content, counters, config...`
        );
      }
      console.log();

      // --- Lock Script ---
      displayScript("Lock Script", lock);
      console.log();

      // --- Type Script ---
      displayScript("Type Script", type);
      console.log();

      if (cellCount >= MAX_CELLS_TO_DISPLAY) {
        console.log(
          `   (Showing first ${MAX_CELLS_TO_DISPLAY} cells only. Breaking loop.)`
        );
        break;
      }
    }
  } catch (error) {
    console.error("Error fetching cells:", error);
    console.log();
    console.log("Troubleshooting tips:");
    console.log("  - Make sure you have internet access");
    console.log("  - The testnet RPC endpoint might be temporarily down");
    console.log("  - Try again in a few moments");
    console.log();
  }

  // -----------------------------------------------------------------------
  // STEP 5: Summary
  // -----------------------------------------------------------------------
  console.log();
  separator();
  console.log("  SUMMARY");
  separator();

  if (cellCount === 0) {
    console.log("  No cells were found. This could mean:");
    console.log("    - The address has no live cells on testnet");
    console.log("    - The RPC endpoint is experiencing issues");
    console.log("    - The testnet was recently reset");
  } else {
    console.log(`  Total cells examined:       ${cellCount}`);
    console.log(`  Total capacity:             ${shannonsToCKB(totalCapacity)}`);
    console.log(`  Cells WITH type script:     ${cellsWithTypeScript}`);
    console.log(`  Cells WITHOUT type script:  ${cellsWithoutTypeScript}`);
    console.log();
    console.log(
      "  Cells WITHOUT a type script = plain CKB holders (no extra logic)"
    );
    console.log(
      "  Cells WITH a type script    = tokens, NFTs, or structured assets"
    );
  }

  console.log();

  // -----------------------------------------------------------------------
  // MINIMUM CAPACITY EXAMPLES
  // -----------------------------------------------------------------------
  separator();
  console.log("  MINIMUM CAPACITY EXAMPLES");
  separator();
  console.log();
  console.log(
    "  Every cell needs a minimum amount of CKBytes to cover its own byte size."
  );
  console.log("  1 CKByte = 1 byte of on-chain storage.");
  console.log();

  const minBasic = calculateMinCapacity(0, 20, false);
  console.log("  1. Basic cell (no type script, no data):");
  console.log(
    "     8 (capacity) + 32 (lock code_hash) + 1 (hash_type) + 20 (lock args)"
  );
  console.log(`     = 61 bytes = ${shannonsToCKB(minBasic)}`);
  console.log();

  const minWithType = calculateMinCapacity(0, 20, true, 20);
  console.log("  2. Cell with type script (no data):");
  console.log(
    "     61 + 32 (type code_hash) + 1 (hash_type) + 20 (type args)"
  );
  console.log(`     = 114 bytes = ${shannonsToCKB(minWithType)}`);
  console.log();

  const minWithData = calculateMinCapacity(32, 20, true, 20);
  console.log(
    "  3. Cell with type script + 32 bytes of data (e.g., a token balance):"
  );
  console.log("     114 + 32 (data)");
  console.log(`     = 146 bytes = ${shannonsToCKB(minWithData)}`);
  console.log();

  // -----------------------------------------------------------------------
  // COMPARISON TABLE
  // -----------------------------------------------------------------------
  separator();
  console.log("  COMPARISON: CKB Cell vs Bitcoin UTXO vs Ethereum Account");
  separator();
  console.log();
  console.log(
    "  ┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐"
  );
  console.log(
    "  │ Feature          │ CKB Cell         │ Bitcoin UTXO     │ Ethereum Account │"
  );
  console.log(
    "  ├──────────────────┼──────────────────┼──────────────────┼──────────────────┤"
  );
  console.log(
    "  │ Stores value?    │ Yes (capacity)   │ Yes (satoshis)   │ Yes (balance)    │"
  );
  console.log(
    "  │ Stores data?     │ Yes (arbitrary)  │ Limited (OP_RET) │ Yes (storage)    │"
  );
  console.log(
    "  │ Programmable?    │ Yes (lock+type)  │ Limited (Script) │ Yes (EVM code)   │"
  );
  console.log(
    "  │ Model            │ Generalized UTXO │ UTXO             │ Account          │"
  );
  console.log(
    "  │ Parallelism      │ Natural (UTXO)   │ Natural (UTXO)   │ Sequential       │"
  );
  console.log(
    "  │ State location   │ In cells         │ In UTXOs         │ In contract      │"
  );
  console.log(
    "  │ Update mechanism │ Consume+Create   │ Spend+Create     │ Mutate in place  │"
  );
  console.log(
    "  └──────────────────┴──────────────────┴──────────────────┴──────────────────┘"
  );
  console.log();

  // -----------------------------------------------------------------------
  // KEY CONCEPTS RECAP
  // -----------------------------------------------------------------------
  separator();
  console.log("  KEY CONCEPTS TO REMEMBER");
  separator();
  console.log();
  console.log("  1. CELLS are the fundamental unit of state in CKB.");
  console.log("     Everything on CKB lives in a cell.");
  console.log();
  console.log("  2. Every cell has 4 FIELDS:");
  console.log("     - capacity: CKByte value AND max storage size");
  console.log("     - data:     arbitrary bytes stored in the cell");
  console.log("     - lock:     script controlling WHO can spend the cell");
  console.log("     - type:     optional script controlling WHAT the cell can do");
  console.log();
  console.log("  3. CAPACITY has a dual purpose:");
  console.log("     - It IS the cell's CKByte value (like satoshis in Bitcoin)");
  console.log("     - It LIMITS how much on-chain space the cell can use");
  console.log("     - 1 CKByte = 1 byte of on-chain storage");
  console.log();
  console.log("  4. Cells are CONSUMED and CREATED (never mutated in place).");
  console.log('     To "update" data: destroy the old cell, create a new one.');
  console.log("     This is the consume-and-create pattern.");
  console.log();
  console.log("  5. CKB is BITCOIN-ISOMORPHIC:");
  console.log("     Cells generalize Bitcoin UTXOs — same parallelism, more power.");
  console.log();

  separator();
  console.log("  End of Lesson 1. Next up: Lesson 2 — Transaction Anatomy!");
  separator();
  console.log();
  console.log("Done! You have explored the CKB Cell Model on the live testnet.");
}

// ============================================================================
// RUN
// ============================================================================
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
