# Lesson 13: xUDT Extensions — Pausable Token Extension in Rust

We successfully built, compiled, and verified a custom **xUDT (Extensible User-Defined Token)** validation script in Rust. This extension script allows token transfers to be dynamically locked/unlocked via a global Pause State cell dependency, with a built-in authorization bypass for the token owner.

---

## Embedded Rosetta Stone

* **High-Level Concept:** Chaining custom rules (like pause flags, blacklists, or supply caps) onto standard token verification.
* **Embedded Rosetta Stone:** **Implementing external validation interrupts / watchdog validation callbacks on standard memory transactions.**
  * The main token contract behaves like the hardware memory manager validating standard memory reads/writes.
  * The xUDT Extension acts like an external security coprocessor (validation interrupt). Before the transaction is finalized, the host CPU executes the extension script in a nested context. If the extension script asserts a block (returns a non-zero code), the whole memory write is rolled back.

---

## Technical Highlights & Optimizations

1. **Owner Mode early exit**:
   - If the script arguments (containing the 32-byte owner lock hash) match any of the transaction inputs, the contract immediately returns `ExitCode::Success` (`0`).
   - This bypasses all cell dep scanning and Blake2b evaluation, running in just **`13,569` cycles**.

2. **Pause state scanning**:
   - When not in owner mode, the contract scans the transaction's `CellDep` memory space. It searches for a state cell of size `1`.
   - If the byte is `1`, the validation fails and returns exit code `88` (**Token Paused**).
   - If the state cell is missing, the validation fails and returns exit code `42` (**State Cell Missing**).
   - This full scanning and validation logic consumes **`113,404` cycles**.

---

## Execution Metrics & Verification Logs

The behavior was verified using `ckb-testtool` with Jest:

```bash
npm test
```

### Verification Outputs

```text
PASS src/extension.test.ts
  xUDT Pause Extension Script Tests
    ✓ Scenario 1: Token is not paused (active) -> verification succeeds (54 ms)
    ✓ Scenario 2: Token is paused -> verification fails with exit code 88 (33 ms)
    ✓ Scenario 3: Token is paused but owner is present -> verification succeeds (override) (39 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.026 s
Ran all test suites.
```

The detailed terminal log is saved in [lesson_13_xudt_extensions.log](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/logs/lesson_13_xudt_extensions.log).
