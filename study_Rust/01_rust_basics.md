# Rust Basics 1: Project Structure & Basic Syntax

## 1. Typical Rust Project Structure

When you create a Rust project using Cargo (Rust's build system and package manager), it generates a structured folder layout. Below is the layout for a standard project:

```text
my_rust_project/
├── Cargo.toml            # Project manifest (metadata, dependencies)
├── Cargo.lock            # Lockfile (exact versions of dependencies built)
├── src/                  # Source code directory
│   ├── main.rs           # Entry point for a binary application
│   └── lib.rs            # Entry point for a library (optional)
└── target/               # Build outputs (binaries, intermediate files)
    └── debug/            # Debug build output (from `cargo build`)
```

### Creating a New Project: `cargo new --bin`
To initialize a new project, we use the Cargo CLI. For example:
```bash
cargo new --bin study_Rust/hello_ckb
```

Here is what each token means:
1.  **`cargo`**: The Rust build manager CLI.
2.  **`new`**: Command telling Cargo to scaffold a new project folder.
3.  **`--bin`**: Short for *binary*. Tells Cargo to create an executable application with an entry point (`src/main.rs`), rather than a reusable library (`src/lib.rs`).
4.  **`study_Rust/hello_ckb`**: The directory path where the project will be created. The folder name (`hello_ckb`) will automatically be assigned as the package name in `Cargo.toml`.

> [!NOTE]
> While you can create these directories and files manually, using `cargo new` is the standard approach. It ensures the manifest configuration syntax is error-free and automatically generates working boilerplate code (`src/main.rs` with `fn main()`).

### Compiling and Running: The Core Cargo Commands

Once a project is created, you use these three Cargo CLI commands in your terminal (make sure your terminal is inside the project directory, e.g., `study_Rust/hello_ckb`):

> [!NOTE]
> **Under the Hood:** While Cargo manages projects and dependencies, it does not compile code directly. When you run `cargo build` or `cargo run`, Cargo executes **`rustc`** (the official Rust Compiler, equivalent to `gcc` or `clang` in C) under the hood to compile your source files into machine code.

1.  **`cargo check`**
    *   *What it does:* Analyzes the code to verify that it compiles (checks types, borrowing, and syntax) but **does not** output a binary file.
    *   *Why use it:* It is much faster than `cargo build` because it skips the code generation phase. Developers run it frequently while writing code to catch syntax and type errors quickly.

2.  **`cargo build`**
    *   *What it does:* Compiles your source files, downloads dependencies, and outputs an executable binary file in your `target/debug/` folder (e.g. `target/debug/hello_ckb`).
    *   *Why use it:* To build the project when you want to produce the executable file but do not want to run it immediately.

3.  **`cargo run`**
    *   *What it does:* Performs a build step (equivalent to `cargo build`) and then **immediately runs** the compiled binary.
    *   *Smart Recompilation:* Cargo automatically checks the modification timestamps of your source code files. If no code changes are detected, it skips compilation and immediately launches the existing binary. If changes are detected, it rebuilds only the modified sections (incremental build) before running.
    *   *Why use it:* This is the most common command during testing and active development because it compiles and executes your code in one step.

---

## 6. Memory Management: Can Rust Leak Memory?

In C/C++, memory leaks occur when heap allocations (`malloc` or `new`) are not paired with a deallocation command (`free` or `delete`).

Rust does **not** have a garbage collector, but it prevents memory leaks through **compile-time ownership scopes**.

### Automatic Deallocation (RAII)
When a variable that owns heap memory goes out of scope, Rust automatically generates the deallocation instructions during compilation:

```rust
fn process() {
    let mut data = String::from("Buffer"); // Allocated on the heap
    data.push_str(" data");
    println!("{}", data);
} // <-- 'data' goes out of scope here.
  // The compiler automatically inserts the free/drop command here.
```

### Scenarios where Rust CAN leak memory:
While Rust prevents accidental leaks, there are specific patterns where leaks can still happen:

1.  **Reference Cycles:** If you use Reference Counting smart pointers (`Rc` or `Arc`) and configure them to point to each other (e.g. Node A references Node B, and Node B references Node A), their reference counters will never reach zero. Consequently, Rust will never drop them from memory.
2.  **Explicit Leaks (`Box::leak`):** Rust provides explicit APIs to intentionally leak memory. This is sometimes used in embedded systems to allocate a runtime configuration buffer once at startup and convert it into a static reference (`&'static mut`) that lives for the entire power cycle.
3.  **Unbounded Growth:** Continuously pushing items to a global database, vector, or cache without clearing it will grow heap consumption until the system runs out of memory (OOM).


### What is a "Manifest"?
*   **In Programming:** A manifest is a configuration file (like `Cargo.toml`) that serves as the project's official registry. It tells the compiler who wrote the project, what external libraries it requires (its "cargo"), and how to compile it.

Unlike C/C++ where you manually configure compilation paths in a `Makefile` or `CMakeLists.txt`, in Rust you simply declare your requirements in the manifest, and Cargo resolves the dependencies automatically.

### Manifest File: `Cargo.toml`
This is the project manifest using the TOML (Tom's Obvious Minimal Language) format:

```toml
[package]
name = "my_rust_project"
version = "0.1.0"
edition = "2021"

[dependencies]
# External crates (libraries) are listed here, e.g.:
# ckb-std = "0.14.0"
```

---

## 2. Source Files: Binaries vs. Libraries

Rust projects have two primary types of outputs:
*   **Binaries (`src/main.rs`):** Compile to a standalone executable. They must contain a `fn main()` function which acts as the execution entry point (like `int main()` in C).
*   **Libraries (`src/lib.rs`):** Compile to reusable modules. They do not have a `main()` function. Instead, they expose APIs that other binaries or libraries can import.

---

## 3. Variables & Mutability

In C, variables are writeable (mutable) by default unless prefixed with `const`.
In Rust, **variables are read-only (immutable) by default**.

### Immutability
```rust
let x = 10;
// x = 20; // ERROR: Cannot assign twice to immutable variable
```
*   **Why?** If data cannot change, it is impossible to introduce bugs from accidental data modifications, null pointers, or memory access race conditions.

### Mutability
To allow a variable's value to change, use the `mut` keyword:
```rust
let mut y = 10;
y = 20; // Allowed!
```

---

## 4. Basic Data Types (Memory Layout)

Rust types map directly to standard C types:

| Rust Type | Description | C/C++ Equivalent | Bit Size |
|---|---|---|---|
| `u8` | Unsigned 8-bit integer | `uint8_t` | 8 bits |
| `i8` | Signed 8-bit integer | `int8_t` | 8 bits |
| `u32` | Unsigned 32-bit integer | `uint32_t` | 32 bits |
| `i32` | Signed 32-bit integer | `int32_t` | 32 bits |
| `f32` | Single-precision float | `float` | 32 bits |
| `f64` | Double-precision float | `double` | 64 bits |
| `bool` | Boolean (`true` or `false`) | `bool` | 8 bits |
| `char` | Unicode character | `wchar_t` / `char32_t` | 32 bits |
| `usize` | Pointer-sized unsigned int | `uintptr_t` / `size_t` | 32/64 bits |
| `isize` | Pointer-sized signed int | `intptr_t` / `ptrdiff_t` | 32/64 bits |

---

## 5. Control Flow: Conditional Statements

Rust's conditional syntax is very similar to C, but with safety enforcement:

```rust
let voltage = 3.3;

if voltage > 3.6 {
    println!("Voltage too high!");
} else if voltage < 3.0 {
    println!("Voltage too low!");
} else {
    println!("Voltage normal.");
}
```

### Differences from C/C++:
1.  **No Parentheses:** You write `if voltage > 3.6`, not `if (voltage > 3.6)`. Parentheses are optional and generally omitted unless needed for operator grouping.
2.  **Mandatory Curly Braces:** The `{}` block braces are always mandatory. In C, you can write:
    ```c
    if (voltage > 3.6)
        shutdown(); // No braces
    ```
    Rust bans this to prevent structural bugs where a developer incorrectly indents a second line thinking it belongs to the `if` statement when it does not.
3.  **Strict Boolean Checks:** The condition must be a strict `bool` type.
    *   In C: `if (1)` or `if (status_reg)` evaluates to true if non-zero.
    *   In Rust: `if status_reg != 0` is required. The compiler will not implicitly cast integers or pointers to booleans.

