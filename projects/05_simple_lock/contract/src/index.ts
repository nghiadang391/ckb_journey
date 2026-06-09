import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log, hashCkb, bytesEq } from "@ckb-js-std/core";

function main(): number {
  log.setLevel(log.LogLevel.Debug);
  log.debug("--- [ON-CHAIN HASH LOCK] Validation Started ---");

  // Load Expected Hash from script args (offset 35: 2 bytes flags + 32 bytes codeHash + 1 byte hashType)
  const expect_hash = new Uint8Array(HighLevel.loadScript().args).slice(35);

  // Load preimage from Witness (WitnessArgs.lock)
  const witness_args = HighLevel.loadWitnessArgs(0, bindings.SOURCE_GROUP_INPUT);
  const preimage = witness_args.lock!;

  // Compute Blake2b Hash
  const hash = hashCkb(preimage);

  // Compare expected vs computed
  if (!bytesEq(hash, expect_hash.buffer)) {
    log.error("Validation failed: PASSCODE INCORRECT! Hash mismatch.");
    return 11;
  }

  log.debug("--- [ON-CHAIN HASH LOCK] Validation Success! Cell Unlocked. ---");
  return 0;
}

bindings.exit(main());
