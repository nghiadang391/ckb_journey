import { Resource, Verifier } from "ckb-testtool";
import { hexFrom, Hex, Transaction } from "@ckb-ccc/core";
import { readFileSync } from "fs";

import { createScript, SCRIPT_ALWAYS_SUCCESS } from "./misc";

const SCRIPT_SUDT = readFileSync("build/release/sudt");

function bigintToHex(value: bigint): Hex {
  const buf = new Uint8Array(16);
  let tmp = value;
  for (let i = 0; i < 16; i++) {
    buf[i] = Number(tmp & 0xffn);
    tmp >>= 8n;
  }
  const hex = Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}` as Hex;
}

describe("sUDT On-Chain Rust Script Tests", () => {
  test("sudt-simple transfer success (inputs 100 >= outputs 90)", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();
    
    const lockScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_ALWAYS_SUCCESS),
      "0x01",
    );
    
    // Deploys the native Rust binary as a type script
    // Note: Rust scripts don't have the 35-byte host header prefix.
    // The script args is just the 32-byte owner lock hash directly!
    const dummyOwnerHash = "0x000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";
    const sudtScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_SUDT),
      dummyOwnerHash,
    );

    // Mock an input cell containing 100 tokens
    const inputCell = resource.mockCell(
      lockScript,
      sudtScript,
      bigintToHex(100n),
    );

    tx.inputs.push(Resource.createCellInput(inputCell));
    tx.outputs.push(Resource.createCellOutput(lockScript, sudtScript));
    tx.outputsData.push(bigintToHex(90n));

    // Verify: transaction should pass validation
    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifySuccess(true);
  });

  test("sudt transfer failed (inflation: inputs 100 < outputs 110)", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();
    const lockScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_ALWAYS_SUCCESS),
      "0x01",
    );
    
    const dummyOwnerHash = "0x000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f";
    const sudtScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_SUDT),
      dummyOwnerHash,
    );

    // Mock an input cell containing 100 tokens
    const inputCell = resource.mockCell(
      lockScript,
      sudtScript,
      bigintToHex(100n),
    );

    tx.inputs.push(Resource.createCellInput(inputCell));
    tx.outputs.push(Resource.createCellOutput(lockScript, sudtScript));
    tx.outputsData.push(bigintToHex(110n)); // 110 > 100, invalid!

    // Verify: transaction validation should fail
    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifyFailure();
  });

  test("sudt owner mode (bypass balance check: outputs 500 > inputs 100)", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();
    
    const lockScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_ALWAYS_SUCCESS),
      "0x01",
    );
    const ownerLockScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_ALWAYS_SUCCESS),
      "0x02",
    );

    // script args set to owner's lock hash directly (no 35-byte offset!)
    const sudtScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_SUDT),
      ownerLockScript.hash(),
    );

    const inputCell = resource.mockCell(
      lockScript,
      sudtScript,
      bigintToHex(100n),
    );
    tx.inputs.push(Resource.createCellInput(inputCell));

    // Owner lock must be present in inputs to activate owner mode
    tx.inputs.push(Resource.createCellInput(resource.mockCell(ownerLockScript)));

    tx.outputs.push(Resource.createCellOutput(lockScript, sudtScript));
    tx.outputsData.push(bigintToHex(500n)); // Inflation allowed because owner is present

    // Verify: transaction should pass validation
    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifySuccess(true);
  });
});
