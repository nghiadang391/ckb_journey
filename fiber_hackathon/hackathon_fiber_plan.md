# Hackathon Preparation & Investigation Plan: Fiber Routing Simulator

This plan outlines a structured, 15-day roadmap to participate in the **Fiber Network Infrastructure Hackathon** (July 1 - July 15). 

Given your background in embedded systems and completion of the CKB Advanced Track, we propose building a **Fiber Payment-Channel & Routing Simulator**. This project fits into **Category 2: Node, Routing, Cross-Chain, and Diagnostics Infrastructure**.

---

## Project Goal: Fiber Routing & Diagnostic Simulator
A tool that allows developers to:
1. Define a local network topology of Fiber nodes and channels.
2. Run simulated payments, finding the best route using Dijkstra's algorithm based on fee rates and channel capacities.
3. Simulate failure states (e.g., node offline, insufficient liquidity, fee mismatch) and print detailed diagnostics.
4. Visualize the state of the channels (balances, capacities) before and after routing.

*Why this is suitable:* It does not require running heavy node infrastructure on day one. It allows you to learn the exact mathematical and logical rules of Fiber payment channels by coding them, resulting in a highly reusable developer tool.

---

## 15-Day Roadmap

### Phase 1: Research & Investigation (Days 1–4)
* **Objective:** Understand the mechanics of payment channels and HTLCs (Hashed Time-Locked Contracts).
* **Tasks:**
  * Read the [Fiber Network Docs](https://www.fiber.world/docs) and the [Fiber Hackathon Documentation](https://github.com/RetricSu/fiber-hackathon-docs).
  * Study the lifecycle of a channel: Funding, Commitment Updates, and Closing.
  * Study HTLCs: How a payment hash and secret preimage are used to route payments across multiple hops securely.
  * Research routing fee structures: Base Fee (flat fee per payment) + Proportional Fee (fee based on payment size).

### Phase 2: Design & Scaffolding (Days 5–7)
* **Objective:** Define data structures and initialize the project.
* **Tasks:**
  * Scaffold a new TypeScript project `projects/hackathon_fiber_simulator/`.
  * Define data structures:
    * `Node`: ID, online status.
    * `Channel`: ID, Node A, Node B, Node A Balance, Node B Balance, Base Fee, Proportional Fee.
    * `HTLC`: Amount, Payment Hash, Locktime.
  * Design the routing algorithm (Dijkstra's pathfinding) that takes channel capacities and routing fees into account.

### Phase 3: Core Implementation (Days 8–11)
* **Objective:** Code the payment simulation and state transitions.
* **Tasks:**
  * Implement pathfinding: Find the cheapest valid route from Sender to Receiver.
  * Implement the HTLC lifecycle:
    * Step 1: Lock HTLCs along the path from Sender to Receiver.
    * Step 2: The Receiver reveals the secret preimage.
    * Step 3: Unlock HTLCs and update channel balances in reverse order.
  * Implement diagnostic checks:
    * Insufficient capacity at any hop.
    * Target node offline.
    * Exceeded maximum locktime.

### Phase 4: Interface & Diagnostics (Days 12–13)
* **Objective:** Build a user interface (CLI or Web) and format outputs.
* **Tasks:**
  * Create a CLI or a clean Web interface using Vanilla CSS to visualize the network graph and channel balances.
  * Output detailed step-by-step transaction telemetry using standard brackets and dividers (matching the style of your CKB journey lessons).

### Phase 5: Presentation & Submission (Days 14–15)
* **Objective:** Prepare deliverables.
* **Tasks:**
  * Record a 5-minute video demonstrating the simulator running different scenarios.
  * Write the README and technical breakdown explaining the Fiber infrastructure gap addressed.
  * Submit the project on CKBoost before the July 15 deadline.
