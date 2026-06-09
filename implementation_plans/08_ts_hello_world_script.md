# Lesson 08: On-Chain TypeScript Script — Hello World (ckb-js-vm)

## Objective

Write, compile, and execute the simplest possible on-chain script using the `ckb-js-vm`
TypeScript toolchain. This lesson establishes the **full build/test pipeline** for on-chain
TypeScript contracts — the same pipeline that Lesson 5's hash lock used under the hood.

The key difference from Lesson 5:
- Lesson 5 used a **pre-built** `.bc` bytecode file from the offckb toolkit.
- This lesson **builds** the bytecode from TypeScript source from scratch.

## Architecture

```
TypeScript source (src/index.ts)
    |
    | esbuild (bundle + minify)
    v
Bundled JS (dist/index.js)
    |
    | ckb-debugger (compile JS -> QuickJS bytecode)
    v
On-chain bytecode (dist/index.bc)
    |
    | ckb-debugger (run in CKB-VM emulation)
    v
Execution result (exit code 0 = success)
```

## Key Concepts

- `@ckb-js-std/bindings`: Low-level syscall bindings — direct interface to the CKB-VM.
  Equivalent to calling RISC-V system calls from C firmware.
- `bindings.exit(n)`: Terminates the script. Exit code 0 = transaction valid.
  Non-zero = transaction rejected. This is identical to a C `main()` return code.
- `console.log()` inside a CKB script routes to `ckb_debug` syscall (only visible in
  debug/test mode, not on mainnet).

## Contract Source (src/index.ts)

```typescript
import * as bindings from "@ckb-js-std/bindings";

function main(): number {
  console.log("Hello from CKB-VM! Lesson 08 complete.");
  return 0;
}

bindings.exit(main());
```

## Toolchain Requirements

| Tool | Purpose | Install Command |
|------|---------|-----------------|
| `pnpm` | Workspace package manager | `npm install -g pnpm` |
| `ckb-debugger` | Compile JS → bytecode + run in CKB-VM | `cargo install ckb-debugger` OR via offckb |
| `esbuild` | Bundle TypeScript to single JS file | installed via pnpm |
| `@ckb-js-std/bindings` | CKB-VM syscall bindings | installed via pnpm |
| `ckb-js-vm` binary | QuickJS engine for CKB | installed via ckb-testtool |

> Note: `ckb-debugger` is also bundled inside the offckb toolkit. Check if
> `offckb debugger` is available as a subcommand.

## Project Structure

```
projects/08_ts_hello_world_script/
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   └── index.ts       # On-chain contract code
    └── dist/
        ├── index.js       # Bundled JS (intermediate)
        └── index.bc       # Compiled bytecode (deploy this)
```

## Build Steps

```bash
# 1. Install deps
npm install

# 2. Build: TypeScript -> JS -> .bc bytecode
npm run build

# 3. Run in CKB-VM emulator (validates the contract logic)
npm start
```

## Embedded Parallel

In C firmware, this is equivalent to:
```c
int main() {
    ckb_debug("Hello from CKB-VM!");
    return CKB_SUCCESS;
}
```
And then cross-compiling with `riscv64-unknown-elf-gcc -o contract.elf main.c`.

## Verification Plan

1. `npm run build` completes without errors and produces `dist/index.bc`
2. `npm start` (ckb-debugger run) exits with code 0
3. Console output shows the debug string in ckb-debugger output
