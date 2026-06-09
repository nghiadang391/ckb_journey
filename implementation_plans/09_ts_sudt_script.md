# Lesson 09: On-Chain TypeScript Script — Simple UDT (sUDT)

## Objective

Implement the **Simple UDT (sUDT)** token standard entirely as an on-chain TypeScript script
running inside `ckb-js-vm`. Then compare the sUDT implementation against the xUDT
(Extensible UDT) we interacted with in Lesson 4 to understand how the two standards relate.

## sUDT vs xUDT — Key Differences

| Aspect | sUDT (RFC-0025) | xUDT (RFC-0052) |
|--------|----------------|-----------------|
| Standard | Older, minimal | Newer, extensible |
| Token amount | 16-byte u128 in cell data | Same u128 encoding |
| Extension hooks | None | Supports extension scripts |
| Owner mode | Lock hash in args | Lock hash in args |
| Backward compatible | Baseline | Yes, superset of sUDT |
| Usage | Simple tokens | Tokens with custom logic |

**Key insight**: xUDT is a superset of sUDT. Every sUDT is a valid xUDT with no extensions.
The core validation logic (sum inputs ≥ sum outputs) is identical in both.

## Validation Logic

The sUDT type script enforces one rule when not in owner mode:

```
sum(input_token_amounts) >= sum(output_token_amounts)
```

This prevents inflation — you cannot create tokens out of thin air.
**Owner mode exception**: If any input cell's lock hash matches the script args
(the issuer's lock hash), minting is allowed (outputs can exceed inputs).

## Contract Logic (src/index.ts)

```typescript
import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, bytesEq } from "@ckb-js-std/core";

const ERROR_AMOUNT = -52;
const ERROR_ARGS_FAILED = -53;

function getAmount(source: bindings.SourceType): bigint {
  let amount = 0n;
  const iter = new HighLevel.QueryIter(HighLevel.loadCellData, source);
  for (const data of iter) {
    if (data.byteLength !== 16) throw `Invalid data length: ${data.byteLength}`;
    const n = new BigUint64Array(data);
    amount += n[0] | (n[1] << 64n);  // little-endian u128 assembly
  }
  return amount;
}

function main(): number {
  // ckb-js-vm prepends 35 bytes to script args; slice them off
  const args = HighLevel.loadScript().args.slice(35);
  if (args.byteLength !== 32) return ERROR_ARGS_FAILED;

  // Check owner mode: issuer can bypass balance check
  let ownerMode = false;
  for (const lockHash of new HighLevel.QueryIter(
    HighLevel.loadCellLockHash, bindings.SOURCE_INPUT
  )) {
    if (bytesEq(lockHash, args)) { ownerMode = true; break; }
  }
  if (ownerMode) return 0;

  // Enforce: inputs >= outputs (no inflation)
  const inputAmount = getAmount(bindings.SOURCE_GROUP_INPUT);
  const outputAmount = getAmount(bindings.SOURCE_GROUP_OUTPUT);
  if (inputAmount < outputAmount) return ERROR_AMOUNT;
  return 0;
}

let exitCode = main();
if (exitCode !== 0) bindings.exit(exitCode);
```

## Key CKB-VM API Calls Used

| API | Equivalent Syscall | What it does |
|-----|-------------------|--------------|
| `HighLevel.loadScript()` | `ckb_load_script` | Load current script (gets args) |
| `HighLevel.loadCellData` | `ckb_load_cell_data` | Load raw bytes from a cell's data field |
| `HighLevel.loadCellLockHash` | `ckb_load_cell_by_field(Lock)` | Load a cell's lock script hash |
| `HighLevel.QueryIter` | Loop over cells | Iterator over cell groups |
| `bindings.SOURCE_GROUP_INPUT` | `CKB_SOURCE_GROUP_INPUT` | Only cells with this same type script |

## The 35-byte args offset

When `ckb-js-vm` runs a TypeScript contract, the first 35 bytes of the type script `args`
field are consumed by the VM itself (to locate the JS bytecode cell). The actual user-defined
args start at byte 35. This is a fundamental constraint of the ckb-js-vm wrapper pattern.

## Embedded Parallel

In C, the token validation would be a `for` loop over cell data buffers:
```c
uint128_t input_sum = 0, output_sum = 0;
for (int i = 0; ...) {
    uint128_t amount;
    ckb_load_cell_data(&amount, sizeof(amount), 0, i, CKB_SOURCE_GROUP_INPUT);
    input_sum += amount;
}
if (input_sum < output_sum) return ERROR_AMOUNT;
```

## Project Structure

```
projects/09_ts_sudt_script/
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   └── index.ts       # sUDT type script
    └── dist/
        ├── index.js       # Bundled JS
        └── index.bc       # On-chain bytecode
```

## Build Steps

```bash
# 1. Install deps
npm install

# 2. Build: TypeScript -> JS -> .bc bytecode
npm run build

# 3. Generate mock transaction JSON context
node generate-mock-tx.cjs

# 4. Run in CKB-VM emulator (loads transaction context and passes validation)
npm start

# 5. Run full unit tests via Jest (simulates multiple transaction contexts)
npm test
```

## Verification Plan

1. `npm run build` produces `dist/index.bc`
2. `node generate-mock-tx.cjs` successfully creates the transaction template `mock_tx.json`.
3. `npm start` (ckb-debugger loading transaction context) exits successfully with `Run result: 0` (validation passes).
4. `npm test` executes the test suite using `ckb-testtool` with WASM debugging enabled and all tests (Success, Inflation Fail, Owner Bypass) pass cleanly.
5. Add a brief analysis comparing this code to the xUDT interaction from Lesson 4



