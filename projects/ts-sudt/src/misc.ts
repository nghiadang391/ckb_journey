import { Resource } from "ckb-testtool/dist.commonjs/unittest/core.js";
import { hashCkb, hexFrom, Hex, Script } from "@ckb-ccc/core";
import { readFileSync } from "fs";

export const CKB_JS_VM_SCRIPT = readFileSync(
  "node_modules/ckb-testtool/src/unittest/defaultScript/ckb-js-vm",
);

export const SCRIPT_ALWAYS_SUCCESS = readFileSync(
  "node_modules/ckb-testtool/src/unittest/defaultScript/alwaysSuccess",
);

export function createJSScript(
  resource: Resource,
  tx: any, // Use any to match core types loaded in workspace
  jsCode: Hex,
  args: Hex,
): Script {
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

export function createScript(
  resource: Resource,
  tx: any,
  scriptBin: Hex,
  args: Hex,
): Script {
  const lockScript = resource.deployCell(scriptBin, tx, false);
  lockScript.args = args;
  return lockScript;
}
