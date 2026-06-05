 # Lesson 10: On-Chain Rust Script — sUDT Script in Rust

We successfully built, compiled, and verified the **On-Chain Rust sUDT Script** for CKB. By patching the `bytes` dependency crate with a custom non-atomic implementation, we successfully resolved LLVM instruction selection errors under `target-feature=-a`.

---

## My First Step into Rust & Cargo

Prior to this lesson, I had no prior experience with **Rust** or **Cargo**. Through this exercise, I learned:
- **Rust**: A systems programming language focusing on safety, concurrency, and speed. It allows us to write memory-safe code without a garbage collector (`no_std` environments), making it the perfect choice for writing secure, audited, and resource-constrained blockchain smart contracts.
- **Cargo**: Rust's build system and package manager. It automates fetching dependencies, compiling code, and packaging libraries (crates) for our compilation target.

---

## New Tools & Packages Installed

To cross-compile and link Rust code to the RISC-V CKB-VM architecture on macOS, we installed and used the following tools:

1. **Rust Target: `riscv64imac-unknown-none-elf`**:
   - *Introduction*: By default, Rust compiles binaries for the host machine (e.g., Apple Silicon M-series chips). We added this cross-compilation target so the compiler knows how to generate bare-metal RISC-V 64-bit ELF binaries compatible with the CKB-VM.
   
2. **GCC Toolchain: `riscv64-elf-gcc`**:
   - *Introduction*: A cross-compiler toolchain installed via Homebrew. It provides the necessary GNU linker and compiler tools to link C-based dependencies of crates (like `ckb-std`) when compiling for RISC-V targets.

3. **CKB Syscall Bindings: `ckb-std`**:
   - *Introduction*: A Rust library (crate) containing low-level syscall wrappers and high-level helper utilities. It allows our contract to communicate directly with the CKB-VM to load transaction inputs/outputs, cell data, and script configurations.

---

## Technical Highlights

1. **Atomics and CKB-VM compatibility**:
   - CKB-VM is single-threaded and does not support the RISC-V "A" (atomic memory operations) extension.
   - The `bytes` crate (a dependency of `molecule` and `ckb-std`) uses `AtomicUsize` for reference counting, causing LLVM compilation crashes when the `A` extension is disabled.
   - We patched `bytes` with a local implementation (`bytes-patch`) that maps atomic types like `AtomicUsize` and `AtomicPtr` directly to single-threaded `UnsafeCell` operations. This resolved the compiler error and allowed safe cross-compilation to `riscv64imac-unknown-none-elf` without generating atomic instruction sets.

2. **Cycle Optimization**:
   - Rust compiled directly to RISC-V ELF runs with zero VM overhead (no JavaScript virtual machine interpreter).

---

## Comparison: TypeScript sUDT vs Rust sUDT

Here is the side-by-side comparison of cycles consumed between the TypeScript sUDT script (Lesson 9) and the Rust sUDT script (Lesson 10):

| Scenario | TypeScript sUDT (ckb-js-vm) | Rust sUDT (Native RISC-V) | Efficiency Gain |
| :--- | :--- | :--- | :--- |
| **Simple Transfer Success** (Inputs 100 >= Outputs 90) | 13,362,395 cycles | **17,841 cycles** | **~749x** |
| **Owner Mode Bypass** (Issuer present in inputs) | 13,185,445 cycles | **13,985 cycles** | **~942x** |

> [!NOTE]
> The TypeScript implementation has to load the entire QuickJS engine (~500KB) into CKB-VM memory and interpret JavaScript bytecode, costing over 13 million cycles. The Rust implementation runs as a bare-metal RISC-V binary, verifying transactions in under 18,000 cycles.

---

## Verification Logs

The tests successfully pass inside `projects/rust-sudt`:
```bash
> rust-sudt-tests@1.0.0 test
> NODE_OPTIONS='--no-warnings' jest --maxWorkers=1

PASS src/sudt.test.ts
  sUDT On-Chain Rust Script Tests
    ✓ sudt-simple transfer success (inputs 100 >= outputs 90) (43 ms)
    ✓ sudt transfer failed (inflation: inputs 100 < outputs 110) (27 ms)
    ✓ sudt owner mode (bypass balance check: outputs 500 > inputs 100) (32 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        0.676 s
Ran all test suites.
```

The full test verification logs are saved in [lesson_10_rust_sudt.log](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/logs/lesson_10_rust_sudt.log).
