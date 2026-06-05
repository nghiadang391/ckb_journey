const { Resource, DEFAULT_SCRIPT_ALWAYS_SUCCESS } = require("ckb-testtool");
const { hexFrom, Transaction, hashCkb } = require("@ckb-ccc/core");
const { readFileSync, writeFileSync } = require("fs");

const SCRIPT_SUDT = readFileSync("dist/index.bc");
const CKB_JS_VM_SCRIPT = readFileSync("node_modules/ckb-testtool/src/unittest/defaultScript/ckb-js-vm");
const SCRIPT_ALWAYS_SUCCESS = readFileSync(DEFAULT_SCRIPT_ALWAYS_SUCCESS);

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

function createJSScript(resource, tx, jsCode, args) {
  const lockScript = resource.deployCell(hexFrom(CKB_JS_VM_SCRIPT), tx, false);

  const cell = resource.mockCell(
    resource.createScriptUnused(),
    undefined,
    jsCode,
  );
  tx.cellDeps.push(resource.createCellDep(cell, "code"));

  let code_hash = hashCkb(jsCode);
  lockScript.args = hexFrom(
    "0x0000" + code_hash.slice(2) + "04" + args.slice(2),
  );

  return lockScript;
}

function createScript(resource, tx, scriptBin, args) {
  const lockScript = resource.deployCell(scriptBin, tx, false);
  lockScript.args = args;
  return lockScript;
}

function generate() {
  const resource = Resource.default();
  const tx = Transaction.default();
  
  const lockScript = createScript(
    resource,
    tx,
    hexFrom(SCRIPT_ALWAYS_SUCCESS),
    "0x01",
  );
  
  const dummyOwnerHash = "0x0102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f00";
  const sudtScript = createJSScript(
    resource,
    tx,
    hexFrom(SCRIPT_SUDT),
    dummyOwnerHash,
  );

  // Input cell has 100 tokens
  const inputCell = resource.mockCell(
    lockScript,
    sudtScript,
    bigintToHex(100n),
  );
  tx.inputs.push(Resource.createCellInput(inputCell));

  // Output cell has 90 tokens (conservation holds)
  tx.outputs.push(Resource.createCellOutput(lockScript, sudtScript));
  tx.outputsData.push(bigintToHex(90n));

  // Export transaction context using ckb-testtool internal serialization format
  const { Verifier } = require("ckb-testtool");
  const verifier = Verifier.from(resource, tx);
  const jsonMock = verifier.txFile();
  writeFileSync("mock_tx.json", JSON.stringify(jsonMock, null, 2));
  console.log("SUCCESS: generated mock_tx.json");
}

generate();
