/**
 * WHAT THIS CODE DOES:
 * The simplest possible on-chain CKB script using ckb-js-vm.
 * When executed by the CKB-VM (on-chain), it logs a debug message and exits 0.
 * Exit code 0 = the script validates successfully (transaction is accepted).
 * Non-zero exit = transaction is rejected.
 *
 * HOW TO BUILD AND RUN:
 * 1. cd ckb_journey/projects/08_ts_hello_world_script
 * 2. pnpm install
 * 3. pnpm build      (TypeScript -> JS -> .bc bytecode)
 * 4. pnpm start      (runs in ckb-debugger CKB-VM emulator)
 *
 * DIRECT EQUIVALENT IN C FIRMWARE:
 * This is analogous to the simplest bare-metal firmware:
 * ```c
 * int main(void) {
 *     ckb_debug("Hello from CKB-VM!");
 *     return CKB_SUCCESS; // 0
 * }
 * ```
 * Compiled with: riscv64-unknown-elf-gcc -o contract.elf main.c
 * Then deployed as raw bytecode to a CKB cell.
 *
 * KEY CONCEPTS:
 * - @ckb-js-std/bindings: Low-level syscall bindings (direct CKB-VM interface)
 * - bindings.exit(n): Terminates the VM. 0 = accept tx, non-zero = reject tx.
 * - console.log() here routes to ckb_debug syscall — visible only in debugger,
 *   not stored on-chain.
 */

import * as bindings from "@ckb-js-std/bindings";

function main(): number {
  console.log("=== STARTING LESSON 08: On-Chain TS Script (Hello World) ===");
  console.log("[INFO] Script is executing inside CKB-VM (QuickJS via ckb-js-vm).");
  console.log("[INFO] Hello from an embedded developer on Nervos CKB!");
  console.log("[SUCCESS] Script validation passed. Exiting with code 0.");
  return 0;
}

bindings.exit(main());
