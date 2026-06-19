import { Resource, Verifier } from "ckb-testtool";
import { hexFrom, Transaction } from "@ckb-ccc/core";
import { readFileSync } from "fs";

import { createScript, SCRIPT_ALWAYS_SUCCESS } from "./misc";

const SCRIPT_PAUSE_EXTENSION = readFileSync("build/release/pause-extension");

describe("xUDT Pause Extension Script Tests", () => {
  test("Scenario 1: Token is not paused (active) -> verification succeeds", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    // Lock scripts
    const userLockScript = createScript(
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

    // Deploy pause extension script as a type script
    // args: owner lock hash
    const extensionScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_PAUSE_EXTENSION),
      ownerLockScript.hash(),
    );

    // Mock an input cell locked by the extension
    const inputCell = resource.mockCell(
      userLockScript,
      extensionScript,
      "0x00",
    );
    tx.inputs.push(Resource.createCellInput(inputCell));

    // Mock the Pause State cell dependency (1 byte = 0: Active)
    const pauseStateCell = resource.mockCell(
      userLockScript,
      undefined,
      "0x00", // 0: Active / Not Paused
    );
    tx.cellDeps.push(Resource.createCellDep(pauseStateCell, "code"));

    tx.outputs.push(Resource.createCellOutput(userLockScript, extensionScript));
    tx.outputsData.push("0x00");

    // Verify: should pass
    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifySuccess(true);
  });

  test("Scenario 2: Token is paused -> verification fails with exit code 88", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const userLockScript = createScript(
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

    const extensionScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_PAUSE_EXTENSION),
      ownerLockScript.hash(),
    );

    const inputCell = resource.mockCell(
      userLockScript,
      extensionScript,
      "0x00",
    );
    tx.inputs.push(Resource.createCellInput(inputCell));

    // Mock the Pause State cell dependency (1 byte = 1: Paused)
    const pauseStateCell = resource.mockCell(
      userLockScript,
      undefined,
      "0x01", // 1: Paused
    );
    tx.cellDeps.push(Resource.createCellDep(pauseStateCell, "code"));

    tx.outputs.push(Resource.createCellOutput(userLockScript, extensionScript));
    tx.outputsData.push("0x00");

    // Verify: should fail
    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifyFailure();
  });

  test("Scenario 3: Token is paused but owner is present -> verification succeeds (override)", async () => {
    const resource = Resource.default();
    const tx = Transaction.default();

    const userLockScript = createScript(
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

    const extensionScript = createScript(
      resource,
      tx,
      hexFrom(SCRIPT_PAUSE_EXTENSION),
      ownerLockScript.hash(),
    );

    const inputCell = resource.mockCell(
      userLockScript,
      extensionScript,
      "0x00",
    );
    tx.inputs.push(Resource.createCellInput(inputCell));

    // Add owner lock cell to inputs (proves authorization / owner mode)
    const ownerInputCell = resource.mockCell(ownerLockScript);
    tx.inputs.push(Resource.createCellInput(ownerInputCell));

    // Mock the Pause State cell dependency (1 byte = 1: Paused)
    const pauseStateCell = resource.mockCell(
      userLockScript,
      undefined,
      "0x01", // 1: Paused
    );
    tx.cellDeps.push(Resource.createCellDep(pauseStateCell, "code"));

    tx.outputs.push(Resource.createCellOutput(userLockScript, extensionScript));
    tx.outputsData.push("0x00");

    // Verify: should succeed because owner lock is in inputs
    const verifier = Verifier.from(resource, tx);
    verifier.args = ["--script-version", "2"];
    await verifier.verifySuccess(true);
  });
});
