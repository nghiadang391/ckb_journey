# Implementation Plan — Lesson 5: Custom Lock Script (TypeScript via ckb-js-vm)

## Background

In previous lessons, we used the standard **SECP256K1** signature lock script built into CKB. In Lesson 5, we will create our own **custom cryptographic lock script** using the modern **CKB JavaScript VM (`ckb-js-vm`)**!

This allows us to write smart contracts in **TypeScript**, compile them to bytecode (`.bc`), and run them on the RISC-V engine in CKB-VM without needing a heavy Rust RISC-V compilation toolchain!

### Our Custom Contract: A Hash Lock
We will implement a **Hash Lock**:
* **Args**: A 32-byte Blake2b hash of a secret passphrase.
* **Witness**: When unlocking, the user must supply the raw secret passphrase (preimage) inside the transaction's witness field.
* **On-Chain Validator (TypeScript)**:
  * Loads its own script args (the expected hash).
  * Loads the witness preimage.
  * Hashes the witness preimage using Blake2b.
  * Compares the computed hash to the expected hash.
  * Exits with `0` (success) on a match, or a non-zero error code on mismatch.

---

## Proposed Changes

### Project Structure

We will create a new sub-project called `simple-lock` containing:
1. **The TypeScript Smart Contract**: Smart contract logic in TypeScript using `@ckb-js-std/bindings` and `@ckb-js-std/core`.
2. **The Loader/dApp Script**: A TS script using the CCC SDK to read the compiled contract bytecode, deploy it to our devnet, lock a cell under our new script, and test unlocking it with both valid and invalid passphrases.

```text
ckb_journey/
└── projects/
    └── simple-lock/
        ├── contract/           # Smart contract source code
        │   ├── src/
        │   │   └── index.ts    # Contract validation logic in TypeScript
        │   ├── package.json    # Build dependencies (esbuild, ckb-js-std)
        │   └── tsconfig.json
        ├── package.json        # Loader/dApp runner configuration
        ├── tsconfig.json
        └── src/
            └── index.ts        # Deploys contract and executes lock/unlock transactions
```

---

## Technical Specifications

### 1. The TypeScript Contract (`contract/src/index.ts`)
Using the standard CKB JS-VM core library:
```typescript
import * as bindings from "@ckb-js-std/bindings";
import { HighLevel, log, hashCkb, bytesEq } from "@ckb-js-std/core";

function main(): number {
  log.setLevel(log.LogLevel.Debug);
  
  // 1. Load Expected Hash from script args
  // For ckb-js-vm, script args can be loaded via HighLevel.loadScript().args
  let script = HighLevel.loadScript();
  let args = new Uint8Array(script.args);
  
  // Expected hash starts after the JS VM script prefix
  let expect_hash = args.slice(args.length - 32); 

  // 2. Load Preimage from Witness
  let witness_args = HighLevel.loadWitnessArgs(0, bindings.SOURCE_GROUP_INPUT);
  if (!witness_args.lock) {
    log.error("Missing witness lock preimage");
    return 10;
  }
  let preimage = new Uint8Array(witness_args.lock);

  // 3. Compute Blake2b Hash & Compare
  let hash = hashCkb(preimage);

  if (!bytesEq(hash, expect_hash.buffer)) {
    log.error("Passphrase verification failed: Hash mismatch!");
    return 11;
  }
  
  log.debug("Verification success!");
  return 0;
}

bindings.exit(main());
```

### 2. The TypeScript Integration (`src/index.ts`)
* **Deploy**: Reads the compiled `.bc` bytecode, creates a transaction using the CCC SDK to store it in a cell on the blockchain, and retrieves the contract's `outPoint`.
* **Lock**: Locks a cell under our new Type Script:
  * `codeHash` = hash of our compiled contract.
  * `args` = Blake2b hash of our passphrase `"NgocPassphrase123"`.
* **Unlock (Spend)**: Builds a transaction using the locked cell as input, injects `"NgocPassphrase123"` into the witness lock, and broadcasts it to verify a successful spend.

---

## Verification Plan

### Automated Testing
1. Build contract: `cd contract && npm run build` (produces `dist/index.bc` bytecode).
2. Start local devnet: `offckb node`.
3. Run loader dApp: `npm start`.
4. Verification outputs:
   - Successful contract deployment.
   - Successful lock cell creation.
   - **Unlock test 1**: Attempt unlocking with the WRONG passphrase $\rightarrow$ expect block producer to **reject** the transaction!
   - **Unlock test 2**: Attempt unlocking with the CORRECT passphrase $\rightarrow$ expect block producer to **commit** successfully!


