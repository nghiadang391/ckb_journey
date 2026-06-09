const { Resource, Verifier } = require("ckb-testtool");
const { hexFrom, Transaction } = require("@ckb-ccc/core");
const { readFileSync } = require("fs");

const SCRIPT_SUDT = readFileSync("build/release/sudt");
const SCRIPT_ALWAYS_SUCCESS = readFileSync("node_modules/ckb-testtool/src/unittest/defaultScript/alwaysSuccess");

function bigintToHex(value) {
  const buf = new Uint8Array(16);
  let tmp = value;
  for (let i = 0; i < 16; i++) {
    buf[i] = Number(tmp & 0xffn);
    tmp >>= 8n;
  }
  const hex = Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}`;
}

function createScript(resource, tx, scriptBin, args) {
  const lockScript = resource.deployCell(scriptBin, tx, false);
  lockScript.hashType = "data2";
  lockScript.args = args;
  return lockScript;
}

function dump() {
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

  const inputCell = resource.mockCell(
    lockScript,
    sudtScript,
    bigintToHex(100n),
  );
  tx.inputs.push(Resource.createCellInput(inputCell));
  tx.outputs.push(Resource.createCellOutput(lockScript, sudtScript));
  tx.outputsData.push(bigintToHex(90n));

  const verifier = Verifier.from(resource, tx);
  verifier.dump("tx.json");
  console.log("SUCCESS: dumped tx.json");
}

dump();
