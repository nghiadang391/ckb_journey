## Builder Track Weekly Report — Week 3

**Name:** Vo Duy Tuan Ngoc
**Week Ending:** 5 June 2026

### Courses Completed

- Below is what I have learned and implemented this week:
  - **Lesson 08: On-Chain TypeScript Script — Hello World**: Developed our first on-chain script using TypeScript compiled to QuickJS bytecode (`.bc`) via `ckb-js-vm`. Integrated automated unit testing using `ckb-testtool` to verify script output directly in Jest.
  - **Lesson 09: On-Chain TypeScript Script — Simple UDT (sUDT)**: Re-implemented the standard sUDT validation rules (RFC-0025) using TypeScript. Checked token conservation (inputs sum >= outputs sum) and owner-mode bypass when the issuer is present in transaction inputs. Wrote unit tests confirming validation success, owner bypass, and validation failure (inflation).
  - **Lesson 10: On-Chain Rust Script — Simple UDT (sUDT)**: Re-implemented the sUDT logic in Rust compiled directly to bare RISC-V (`riscv64imac-unknown-none-elf`). Handled compiling with atomic instructions disabled (`-C target-feature=-a`) to match CKB-VM constraints.

---

### New Knowledge & Key Learnings

1. **Rust and Cargo (First-time Experience)**:
   - Having had **no prior experience** with Rust or Cargo, I learned the basics of Rust's compiler safety, package structures, and the Cargo build manager. I worked with `Cargo.toml` dependencies, workspace members, and cargo overrides.
   
2. **RISC-V Tooling and Setup**:
   - Installed the Rust target `riscv64imac-unknown-none-elf` to compile bare-metal RISC-V ELF binaries.
   - Installed the GNU cross-linker `riscv64-elf-gcc` to compile low-level C bindings.
   - Learned the role of the CKB contract SDK `ckb-std` to interface with cellular values and sys-call context.

3. **Debugging the CKB-VM Atomic instruction blocker**:
   - *The Problem*: CKB-VM runs single-threaded and lacks the RISC-V "A" (atomic instructions) extension. However, dependencies like the `bytes` crate use `AtomicUsize` for reference counting. Simply compiling with `-C target-feature=-a` causes LLVM to crash with a `Cannot select: AtomicLoadAdd` error because LLVM still tries to emit atomic instructions for 64-bit platforms.
   - *The Workaround*: We copied `bytes` locally (`bytes-patch`) and substituted all atomic references in `loom.rs` with single-threaded `UnsafeCell` based wrappers. Using Cargo's `[patch.crates-io]` override, we resolved the compilation failure and successfully compiled the contract without any atomic instructions.

4. **Interpreter Overhead vs. Bare-Metal Performance**:
   - Compared the performance profiles of TypeScript (running QuickJS inside CKB-VM) against native Rust RISC-V binaries.
   - We observed a **~750x to 940x** efficiency gain with Rust. TypeScript takes millions of cycles to load the JS virtual machine interpreter, whereas Rust executes in a few thousand cycles.

---

### Practical Progress

- Successfully implemented and verified **three developer exercises** (Lessons 08–10).
- Handled advanced compiler diagnostics and custom dependency patching.
- Structured automated tests using Jest and `ckb-testtool` to verify on-chain script validity.

---

### Performance Comparison: TypeScript vs Rust sUDT

Below is the cycle cost measured during our unit tests:

| Test Case | TypeScript sUDT (Lesson 9) | Rust sUDT (Lesson 10) | Cycle Efficiency Gain |
| :--- | :--- | :--- | :--- |
| **Simple Transfer Success** (Inputs 100 >= Outputs 90) | 13,362,395 cycles | **17,841 cycles** | **~749x** |
| **Owner Mode Bypass** (Issuer present in inputs) | 13,185,445 cycles | **13,985 cycles** | **~942x** |
| **Execution Overhead** | High (Embeds QuickJS Interpreter) | Zero (Runs directly on bare VM) | Extremely High |
