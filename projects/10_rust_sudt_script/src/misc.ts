import { Resource } from "ckb-testtool";
import { Hex, Script } from "@ckb-ccc/core";
import { readFileSync } from "fs";

export const SCRIPT_ALWAYS_SUCCESS = readFileSync(
  "node_modules/ckb-testtool/src/unittest/defaultScript/alwaysSuccess",
);

export function createScript(
  resource: Resource,
  tx: any,
  scriptBin: Hex,
  args: Hex,
): Script {
  const lockScript = resource.deployCell(scriptBin, tx, false);
  lockScript.hashType = "data2";
  lockScript.args = args;
  return lockScript;
}
