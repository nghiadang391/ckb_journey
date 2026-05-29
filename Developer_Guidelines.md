# Developer Profile & Learning Guidelines

This document tracks learning context, pedagogical rules, and styling preferences for **Vo Duy Tuan Ngoc** during the Nervos CKB Builders' Track. 

---

## User Profile & Context
* **Background:** Senior Embedded Software Engineer. Extremely proficient in C/C++, bare-metal programming, memory layouts, real-time operating systems (RTOS), and hardware architectures.
* **JS/TS Status:** Absolute Beginner. No previous experience with JavaScript or TypeScript.
* **Blockchain Status:** Beginner (completed Week 1 intro concepts).

---

## Pedagogical & Explanation Rules

Every time code is written or explained, the assistant **MUST** adhere to the following rules:

### Rule 1: Use the "Embedded Rosetta Stone"
Whenever a blockchain or modern high-level software concept is introduced, immediately translate it into its low-level embedded equivalent:
* **Smart Contract / Script** $\rightarrow$ Compiled RISC-V Binary loaded into a specific ROM partition.
* **Cell** $\rightarrow$ Struct allocated on a global, shared heap (`malloc`/`free`).
* **Capacity** $\rightarrow$ The physical buffer allocation limit of the struct in bytes.
* **Lock Script** $\rightarrow$ A hardware write-protection register / ownership checker function pointer.
* **Type Script** $\rightarrow$ State transition validation logic function pointer.
* **Block Height** $\rightarrow$ Global system uptime tick counter.

### Rule 2: Deconstruct Complex JS/TS Features
Whenever the code introduces modern JS/TS paradigms, include a brief "under-the-hood" translation box. Specifically explain:
1. **Asynchronous Code (`async/await` and Promises):** Translate to hardware interrupts, non-blocking polling, or RTOS task scheduling.
2. **Arrow Functions (`const fn = () => {}`):** Translate to standard C inline functions or anonymous callbacks.
3. **Module System (`import/export`):** Translate to `#include` directives and compiler linker headers.
4. **Destructuring (`const { script } = obj`):** Translate to accessing individual fields of a struct (e.g. `obj.script`).
5. **Typings (like `: bigint` or `: ScriptInfo`):** Explain how TS's typing system differs from static C types, and how it is transpiled away before runtime.

---

## Output Formatting & Presentation Templates

### Template: Console CLI Output Style
All learning scripts we write should print output in a consistent, clean, bare-metal telemetry format. 
* Use `===================` style dividers to group logical telemetry frames.
* Prefix actions with descriptive text brackets (e.g. [START], [INFO], [TX], [SUCCESS], [ERROR], [COMPLETE]).
* Clearly state differences in byte and token counts before and after operations.

### Template: TypeScript File Headers
Every typescript code file we write together should start with a header explaining:
1. **What this code does.**
2. **How to run it.**
3. **Its direct equivalent in typical C microcontroller firmware.**

---

## Division of Labor & Command Limits

To ensure maximum learning value and hands-on muscle memory for the user:
* **Assistant Responsibilities:** Update, edit, and create code files, write tutorials, analyze errors, and instruct the user. The assistant may run minor utility commands (e.g. `cp` for system files) when requested.
* **User Responsibilities (No Auto-Run):** The user retains complete control over the execution of the project. The assistant **MUST NOT** proactively run code execution commands (like `npm start`, `offckb node`, etc.). The user will run these commands manually to build experience.

---

## File Storage Rules

* **Implementation Plans:** All implementation plans (existing and new) must be stored in `ckb_journey/implementation_plans/` with a numbered prefix (e.g., `02_simple_transfer.md`, `03_store_data_on_cell.md`). This ensures they are version-controlled and always accessible inside the repository.


