# Lesson 10: On-Chain Rust Script — Simple UDT (sUDT) in Rust/RISC-V

## Objective

Re-implement the same sUDT validation logic from Lesson 9 using **Rust compiled to RISC-V**—the production-grade approach used by real CKB contracts. Compare the Rust implementation against the TypeScript version to understand the tradeoffs.

---

## Why Rust over TypeScript for Production Scripts

| Aspect | TypeScript (ckb-js-vm) | Rust (native RISC-V) |
|--------|----------------------|---------------------|
| Runtime overhead | Embeds QuickJS VM (~500KB) | Zero overhead, bare RISC-V |
| Cycle cost | Higher (interpreter overhead) | Minimal (direct instructions) |
| Binary size | Larger | Compact |
| Development speed | Fast (familiar ecosystem) | Slower (no_std constraints) |
| Memory safety | GC managed | Rust ownership (zero GC) |
| Production usage | Prototyping / simple contracts | High-value / audited contracts |
| Embedded parallel | Like running Python on an MCU | Like writing bare-metal C firmware |

**Bottom line**: TypeScript via ckb-js-vm is perfect for learning and prototyping. Rust is what you'd use when deploying real assets on mainnet.

---

## Rust no_std Environment

CKB scripts run in a **bare-metal RISC-V** environment with:
- No operating system
- No standard library (`no_std`)
- No heap by default (must declare a custom allocator)
- No threads, no I/O, no networking
- Only CKB syscalls to communicate with the outside world

---

## CKB-VM Atomic Instruction Compatibility Workaround

> [!IMPORTANT]
> CKB-VM is single-threaded and does not support the RISC-V "A" (atomic memory operations) extension.
> Standard Rust crates like `bytes` (used by `molecule` and `ckb-std`) rely on atomic types like `AtomicUsize` for reference counting. 
> When we disable the A-extension via `RUSTFLAGS="-C target-feature=-a"`, the LLVM backend fails to compile the `bytes` crate, yielding a `Cannot select: AtomicLoadAdd` error.
> 
> To resolve this, we:
> 1. Patched the `bytes` crate locally in `projects/rust-sudt/bytes-patch`.
> 2. Replaced standard atomic types (`AtomicUsize`, `AtomicPtr`) in `bytes-patch/src/loom.rs` with custom single-threaded wrappers using `UnsafeCell`.
> 3. Overrode the `bytes` dependency in workspace `Cargo.toml` with `[patch.crates-io]`.

---

## Toolchain Setup

| Tool | Purpose | Install Command |
|------|---------|-----------------|
| Rust & Cargo | Language compiler and package manager | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| RISC-V target | Cross-compile to CKB's ISA | `rustup target add riscv64imac-unknown-none-elf` |
| Linker: `riscv64-elf-gcc` | Link low-level components for RISC-V | `brew install riscv64-elf-gcc` |
| `ckb-std` crate | CKB syscall bindings for Rust | In `Cargo.toml` |

---

## Build Commands

```bash
# Build the sUDT contract with target features: +zba,+zbb,+zbc,+zbs,-a
make build

# Run unit tests
npm test

# The compiled binary will be at:
# build/release/sudt
```

---

## Project Structure

```
projects/rust-sudt/
    ├── Cargo.toml             # Workspace Cargo config with [patch.crates-io]
    ├── Makefile               # Build orchestrator (specifies target features)
    ├── bytes-patch/           # Patched bytes crate using non-atomic wrappers
    ├── contracts/
    │   └── sudt/
    │       ├── Cargo.toml     # Contract spec with dummy-atomic feature enabled
    │       └── src/
    │           └── main.rs    # Entry point + program_entry
    └── build/
        └── release/
            └── sudt           # Compiled RISC-V ELF binary
```

---

## Verification Plan

### Automated Tests
- Build contract and run test suites:
  ```bash
  make build
  npm test
  ```

### Manual Verification
- Gather and compare cycle logs between TypeScript (Lesson 9) and Rust (Lesson 10) implementations.
