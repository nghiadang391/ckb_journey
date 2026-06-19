## Builder Track Weekly Report — Week 5

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 19 June 2026  

---

### Courses & Lessons Completed

1. **Lesson 12: SSRI-Compliant UDT in Rust**  
   Upgraded our native Rust sUDT token contract from Lesson 10 to support the **SSRI (Script-Sourced Rich Information)** protocol, allowing off-chain clients (like wallets) to query token metadata dynamically.
2. **Lesson 13: xUDT Extensions (Advanced Patterns)**  
   Built a custom on-chain validation script in Rust representing a **Pausable Token Extension** for xUDT, checking global status cells and supporting owner override mode.

---

### New Knowledge & Key Learnings (Plain English Explanations)

#### 1. Linker Duplicate Symbol Errors (`rust-lld`)
* **What happened:** When dependencies require different incompatible versions of the same library (e.g. our contract requested `ckb-std v0.17` while `ckb-ssri-std` required `ckb-std v0.16.4`), Cargo compiles both. 
* **The conflict:** Because bare-metal RISC-V targets do not natively support atomic operations, `ckb-std` includes global assembly overrides. Compiling both versions causes the linker to find two identical assembly routines, crashing the build.
* **The fix:** We pinned our contract's dependency to `ckb-std v0.16.4` to unify them.

#### 2. Hardcoded vs. Dynamic Queries (SSRI)
* **Hardcoded:** Writing information (like token name or decimals) directly into the client application code. If the token is renamed, a developer must update the app code and release a new update to the App Store.
* **Dynamic (SSRI):** The application code does not guess. It queries the smart contract code directly for its metadata. If the token rules or names change on-chain, the application automatically displays the new information without needing any updates.

#### 3. Why we use a Makefile in a Rust CKB Project
* Rust projects usually compile using only `Cargo.toml` and standard `cargo build` command structures.
* However, CKB smart contracts must be **cross-compiled** for a completely different bare-metal CPU architecture (RISC-V `riscv64imac-unknown-none-elf`) rather than our host operating system (macOS).
* This requires setting up complex compiler overrides:
  1. Specifying the target cross-compiler binary (`riscv64-elf-gcc`).
  2. Injecting CKB-VM optimization flags (`RUSTFLAGS="-C target-feature=+zba,+zbb,+zbc,+zbs,-a"`).
  3. Specifying the target target-architecture parameters.
  4. Creating build folders and copying the compiled output binary to a location where the TypeScript tests can find it.
* A `Makefile` serves as a convenient **wrapper script** that bundles all of these environment variables, target flags, and directory cleanup operations into a single command (`make build`).

#### 4. sUDT vs. SSRI vs. xUDT Extensions
* **sUDT (Lesson 10):** Basic accounting rules (*do not create money out of thin air*). It only says Yes or No to a transfer.
* **SSRI (Lesson 12):** Interactive query capability. It allows external applications to ask the contract questions (*"what is your name?"*).
* **xUDT Extensions (Lesson 13):** A modular "security guard" (compliance script) plugged into the token. It checks external policies (like checking if the token is paused in a state cell dependency) and can veto transactions.


---

### Practical Progress & Verification

* **Lesson 12 sUDT Verification**: Successfully compiled the SSRI dispatch router and validated standard sUDT rules using Jest.
* **Lesson 13 xUDT Extension Verification**: Successfully compiled the `pause-extension` RISC-V binary and verified its state enforcement using Jest.

#### Telemetry Results (Lesson 13):

| Scenario | Pause State Cell Dep | Owner Lock in Inputs | Result | VM Cycles Consumed |
| :--- | :--- | :--- | :--- | :--- |
| **1. Unpaused** | `0x00` (Active) | Absent | **Success (Allowed)** | 113,404 cycles |
| **2. Paused** | `0x01` (Paused) | Absent | **Failure (Exit code 88)** | 113,406 cycles |
| **3. Owner Mode** | `0x01` (Paused) | Present | **Success (Allowed)** | **13,569 cycles** (~8.3x lower) |

> [!TIP]
> **Owner Mode Cycle Optimization:** When the owner's signature is present in the inputs, the pause extension immediately triggers an early exit. This saves CKB-VM cycles by bypassing the cell dependency search loops entirely.

---

### Verification Logs

* **Lesson 12 Logs:** Saved in [lesson_12_ssri_sudt.log](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/logs/lesson_12_ssri_sudt.log)
* **Lesson 13 Logs:** Saved in [lesson_13_xudt_extensions.log](file:///Users/nghiadang/CKB/ckb_journey/walkthroughs/logs/lesson_13_xudt_extensions.log)
