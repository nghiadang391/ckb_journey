# Lesson 12: SSRI-Compliant UDT in Rust

We upgraded the native Rust sUDT smart contract from Lesson 10 to implement the **SSRI (Script-Sourced Rich Information)** protocol. This standard enables off-chain tools and indexers to query metadata directly from the compiled contract instead of relying on hardcoded addresses.

---

## Technical Highlights & Rationale

1. **Linker Duplicate Atomics Symbol Resolution**:
   - The contract's original dependency on `ckb-std v0.17.0` conflicted with `ckb-ssri-std v0.0.1` which required `ckb-std v0.16.4`.
   - Because these versions are semver-incompatible, Cargo resolved and linked both versions. Both crates define identical RISC-V atomic operation routines (since bare-metal RISC-V targets do not natively support atomic operations and require dummy fallbacks), triggering `duplicate symbol` errors from the linker.
   - We resolved this by pinning our contract's `ckb-std` dependency to `0.16.4`, allowing Cargo to unify the dependencies and build a single instance of `ckb-std`.

2. **Dispatcher Entry & Atomics**:
   - We mapped the `ssri_methods!` macro from `ckb-ssri-std-proc-macro` within a helper function `handle_ssri_methods(argv: &[ckb_std::env::Arg])`.
   - This accepts environment arguments representing method query paths (such as `UDT.name`), decodes them, and writes the returned byte arrays back using the CKB VM `set_content` syscall (syscall ID `2104`).

---

## Verification outcomes

The standard sUDT logic (inputs >= outputs, owner mode bypass, inflation check) was successfully verified using `ckb-testtool` with our new unified SSRI binary.

```bash
npm test
```

### Verification Logs

```text
PASS src/sudt.test.ts
  sUDT On-Chain Rust Script Tests
    ✓ sudt-simple transfer success (inputs 100 >= outputs 90) (61 ms)
    ✓ sudt transfer failed (inflation: inputs 100 < outputs 110) (35 ms)
    ✓ sudt owner mode (bypass balance check: outputs 500 > inputs 100) (39 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.052 s
Ran all test suites.
```

The full output has been saved to [lesson_12_ssri_sudt.log](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/logs/lesson_12_ssri_sudt.log).
