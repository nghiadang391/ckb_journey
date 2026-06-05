/**
 * WHAT THIS CODE DOES:
 * Implements the Simple UDT (sUDT) token standard (RFC-0025) as an on-chain
 * TypeScript type script running inside ckb-js-vm.
 *
 * VALIDATION RULE:
 * When NOT in owner mode: sum(input tokens) >= sum(output tokens)
 * This prevents inflation — tokens cannot be created from thin air.
 * Owner mode (issuer's lock hash matches script args) bypasses this check,
 * allowing the issuer to mint new tokens.
 *
 * HOW TO BUILD AND RUN:
 * 1. cd ckb_journey/projects/ts-sudt
 * 2. npm install
 * 3. npm run build    (TypeScript -> JS -> .bc bytecode)
 * 4. npm start        (runs in ckb-debugger CKB-VM emulator)
 *
 * sUDT vs xUDT (from Lesson 4):
 * - sUDT (RFC-0025): Minimal, no extension hooks, simpler logic.
 * - xUDT (RFC-0052): Superset of sUDT, supports extension scripts for
 *   custom mint/burn/transfer rules. Every sUDT is a valid xUDT.
 *
 * KEY CKB-VM SYSCALLS USED:
 * - HighLevel.loadScript()         -> ckb_load_script (read current type script)
 * - HighLevel.loadCellData         -> ckb_load_cell_data (read cell data field)
 * - HighLevel.loadCellLockHash     -> ckb_load_cell_by_field (read lock hash)
 * - HighLevel.QueryIter            -> loop over cells in a source group
 * - SOURCE_GROUP_INPUT/OUTPUT      -> only cells sharing this exact type script
 *
 * THE 35-BYTE ARGS OFFSET:
 * When ckb-js-vm wraps a TypeScript contract, the first 35 bytes of the
 * type script args are consumed by the VM itself (to locate the .bc cell).
 * User-defined args start at byte 35. This is a fundamental ckb-js-vm constraint.
 *
 * DIRECT EQUIVALENT IN C FIRMWARE:
 * ```c
 * uint128_t input_sum = 0, output_sum = 0;
 * // Loop over GroupInput cells
 * for (size_t i = 0; ; i++) {
 *     uint128_t amount;
 *     int ret = ckb_load_cell_data(&amount, sizeof(amount), 0, i, CKB_SOURCE_GROUP_INPUT);
 *     if (ret == CKB_INDEX_OUT_OF_BOUND) break;
 *     input_sum += amount;
 * }
 * if (input_sum < output_sum) return ERROR_AMOUNT;
 * ```
 */

import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, bytesEq } from "@ckb-js-std/core";

// ============================================================================
// ERROR CODES (mirrors sUDT RFC-0025 error definitions)
// ============================================================================
const ERROR_AMOUNT = -52;       // input token sum < output token sum
const ERROR_ARGS_FAILED = -53;  // args field is wrong size (must be 32 bytes)

// ============================================================================
// HELPER: Sum token amounts across all cells in a source group
// ============================================================================
/**
 * Reads all cell data fields in the given source group and sums them as
 * little-endian u128 values (16 bytes each).
 * This is identical to reading packed uint128_t values from an EEPROM sector.
 */
function getTokenAmount(source: bindings.SourceType): bigint {
  let total = 0n;
  const iter = new HighLevel.QueryIter(HighLevel.loadCellData, source);
  for (const cellData of iter) {
    if (cellData.byteLength !== 16) {
      throw `[ERROR] Invalid cell data length: expected 16 bytes (u128), got ${cellData.byteLength}`;
    }
    // Interpret as two 64-bit words (lo, hi) and assemble into u128
    const words = new BigUint64Array(cellData);
    const w0 = words[0];
    const w1 = words[1];
    if (w0 === undefined || w1 === undefined) {
      throw `[ERROR] Failed to read u128 components`;
    }
    const amount = w0 | (w1 << 64n);
    total += amount;
  }
  return total;
}

// ============================================================================
// MAIN VALIDATION ENTRY POINT
// ============================================================================
function main(): number {
  console.log("=== STARTING LESSON 09: sUDT Type Script (RFC-0025) ===");

  // Step 1: Load this script's args field.
  // In ckb-js-vm, the first 35 bytes are consumed by the VM host header.
  // The actual owner lock hash starts at byte 35 and is 32 bytes long.
  const rawArgs = HighLevel.loadScript().args;
  const args = rawArgs.slice(35);
  console.log(`[INFO] Script args length (after VM header slice): ${args.byteLength} bytes`);

  if (args.byteLength !== 32) {
    console.log(`[ERROR] Args length invalid: expected 32 bytes, got ${args.byteLength}`);
    return ERROR_ARGS_FAILED;
  }

  // Step 2: Check Owner Mode.
  // If any INPUT cell's lock hash matches the owner lock hash in args,
  // the issuer is present — minting is allowed, skip balance check.
  console.log("[INFO] Checking for owner mode (issuer presence in inputs)...");
  let ownerMode = false;
  for (const lockHash of new HighLevel.QueryIter(
    HighLevel.loadCellLockHash,
    bindings.SOURCE_INPUT,
  )) {
    if (bytesEq(lockHash, args)) {
      ownerMode = true;
      break;
    }
  }

  if (ownerMode) {
    console.log("[INFO] Owner mode: issuer's lock detected in inputs. Minting allowed.");
    console.log("[SUCCESS] sUDT validation passed (owner mode). Exit 0.");
    return 0;
  }

  // Step 3: Enforce conservation — inputs >= outputs (no inflation).
  // SOURCE_GROUP_INPUT/OUTPUT only counts cells that use THIS exact type script.
  console.log("[INFO] Transfer mode: verifying token conservation...");
  const inputAmount = getTokenAmount(bindings.SOURCE_GROUP_INPUT);
  const outputAmount = getTokenAmount(bindings.SOURCE_GROUP_OUTPUT);
  console.log(`[INFO] Input token sum:  ${inputAmount}`);
  console.log(`[INFO] Output token sum: ${outputAmount}`);

  if (inputAmount < outputAmount) {
    console.log(`[ERROR] Token inflation detected! inputs(${inputAmount}) < outputs(${outputAmount})`);
    return ERROR_AMOUNT;
  }

  console.log("[SUCCESS] sUDT validation passed (conservation holds). Exit 0.");
  return 0;
}

// ============================================================================
// CONTRACT EXIT
// ============================================================================
const exitCode = main();
if (exitCode !== 0) {
  bindings.exit(exitCode);
}
