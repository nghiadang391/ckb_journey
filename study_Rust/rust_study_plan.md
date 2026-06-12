# Rust Crash Course: Core Concepts for Embedded Systems Engineers

This plan establishes a structured pathway to master Rust's core safety and performance guarantees. The topics are framed using analogies to microcontroller hardware, registers, and memory mappings.

---

## Study Roadmap

Our learning plan is divided into three key lessons. Each lesson covers fundamental Rust concepts by building a simulation of an embedded component.

```
                  ┌──────────────────────────────┐
                  │  Lesson 1: Hardware I/O      │
                  │  - Mutability & Structs      │
                  │  - Bitwise Operations        │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  Lesson 2: UART Ring Buffer  │
                  │  - Ownership & Lifetimes     │
                  │  - Memory Safety (References)│
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │  Lesson 3: Command Parser    │
                  │  - Enums & Match Statements  │
                  │  - Error Handling (Result)   │
                  └──────────────────────────────┘
```

---

## Lesson Details

### 1. Lesson 1: GPIO & Register Emulator (Basics)
*   **Goal:** Learn how to declare data structures, implement methods, handle variable mutability, and perform low-level bitwise manipulation without pointers.
*   **Core Rust Concepts:**
    *   `struct` definitions and `impl` code blocks.
    *   Variable mutability (`mut` vs immutable).
    *   Associated functions (static constructors) vs methods (functions taking `self`).
    *   Passing self by reference (`&self` vs `&mut self`).
    *   Types: Unsigned integers (`u8`, `u32`) and basic strings (`&str` vs `String`).
*   **Target Code:** [study_Rust/rust_playground/src/main.rs](file:///Users/nghiadang/CKB/ckb_journey/study_Rust/rust_playground/src/main.rs).

### 2. Lesson 2: Ring Buffer / FIFO Queue (Ownership & References)
*   **Goal:** Understand the "Borrow Checker" (Rust's compilation safety mechanism) which prevents race conditions and memory access violations at compile time instead of using a runtime garbage collector.
*   **Core Rust Concepts:**
    *   **Ownership:** The rule that every value has a single owner. When the owner goes out of scope, the memory is freed.
    *   **Borrowing:** Creating references to data using `&` (read-only) and `&mut` (read-write).
    *   **The Borrowing Rule:** You can have either *one* mutable reference OR *many* immutable references to a variable at any one time, never both. This prevents data races.
    *   **Slices:** Working with contiguous subsets of arrays/buffers without copying data.
*   **Target Code:** We will write a circular FIFO buffer representing a serial port UART RX interrupt buffer.

### 3. Lesson 3: Command Parser & State Machine (Pattern Matching & Error Handling)
*   **Goal:** Replace C-style unchecked enum casting and error codes (like `-1` or `NULL` checks) with Rust's type-safe alternatives.
*   **Core Rust Concepts:**
    *   `enum` (algebraic data types that can hold variables/payloads inside their variants).
    *   Pattern matching (`match`) for control flow, forcing the compiler to verify that all possible states are handled.
    *   `Option<T>` for representing values that might be empty/null safely.
    *   `Result<T, E>` for returning either a success value or a typed error struct.
    *   The `?` operator for clean error propagation.
*   **Target Code:** A CLI parser that decodes strings received from our serial buffer and executes functions.

---

## Verification Plan

For each lesson, we will:
1.  Write the implementation in our `rust_playground` project.
2.  Compile and execute it using `cargo run`.
3.  Add custom exercises (e.g., adding hardware registers or handling edge cases) to test your understanding.
