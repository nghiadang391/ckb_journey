# Hackathon Preparation & Investigation Plan: Fiber Route Diagnostics

This plan outlines a structured, 15-day roadmap to build **Fiber Route Diagnostics** for the **Gone in 60ms: Fiber Network Infrastructure Hackathon** (July 1 - July 15).

This project fits into **Category 2: Node, Routing, Cross-Chain, and Diagnostics Infrastructure**.

---

## Project Goal: Fiber Route Diagnostics
A diagnostic middleware, visual dashboard, and client SDK that allows developers to:
1. **Intercept JSON-RPC responses** from a running Fiber Network Node (FNN) using a transparent local proxy.
2. **Parse flat error strings** (e.g. `failed_error: Option<String>`) into structured `TlcErr` schemas, capturing exact error codes, failing node IDs, and channel outpoints.
3. **Persist transaction telemetry** in a local SQLite database for historical diagnostics and peer failure tracking.
4. **Visualize payment lifecycles and hop statuses** on a single-page web dashboard with failure statistics and heatmaps.

---

## 15-Day Roadmap

### Phase 1: Research & Investigation (Days 1–4)
* **Objective:** Audit the FNN codebase and map TLC error states.
* **Tasks:**
  * Study the reference code in `nervosnetwork/fiber` for payment schemas, specifically `SendPaymentResponse` and `TlcErr` in `crates/fiber-types/src/payment.rs`.
  * Catalog the flat JSON-RPC error strings returned by FNN and match them to internal `TlcErrorCode` variants.
  * Define the JSON schemas for the enriched proxy diagnostics.

### Phase 2: Design & Scaffolding (Days 5–7)
* **Objective:** Set up the workspace and project files.
* **Tasks:**
  * Scaffold a new TypeScript workspace `/Users/nghiadang/CKB/fiber_diagnostics/` containing `package.json`, `tsconfig.json`, and `jest.config.js`.
  * Set up dependencies (Express, better-sqlite3, ws, ccc, jest).
  * Design database schemas for SQLite payment history storage.

### Phase 3: Core Implementation (Days 8–11)
* **Objective:** Implement the proxy server, interceptor, and parser.
* **Tasks:**
  * Write the error parser in `src/proxy/parser.ts` to map error strings to structured objects.
  * Build the HTTP RPC Proxy Server in `src/proxy/server.ts` to intercept `send_payment` and `get_payment` calls.
  * Implement the database store in `src/db/store.ts` to log all successful and failed payment sessions.
  * Write Jest unit tests in `tests/parser.test.ts` to verify parser parsing logic under different mock FNN outputs.

### Phase 4: Web Dashboard & SDK (Days 12–13)
* **Objective:** Build the dashboard interface and the client wrapper SDK.
* **Tasks:**
  * Implement `src/dashboard/` consisting of a static HTML view, styling, and WebSocket listeners to stream real-time payments.
  * Build a payment timeline feed showing successful, failed, and inflight runs.
  * Code the lightweight `FiberDiag` SDK client wrapper in `src/sdk/index.ts` to expose clean methods for dApps.

### Phase 5: Presentation & Submission (Days 14–15)
* **Objective:** Wrap up and submit the project.
* **Tasks:**
  * Record a 5-minute video demonstrating the proxy server intercepting payments and the dashboard updating in real-time.
  * Write a detailed technical README explaining the Fiber RPC diagnostic gap addressed.
  * Submit the repository on CKBoost before the July 15 deadline.

---

## Verification Plan
1. **Parser Tests:** Verify that raw strings like `"TemporaryChannelFailure"` or `"AmountBelowMinimum"` are correctly mapped to structural categories with suggestions.
2. **Proxy Forwarding:** Verify that all non-payment JSON-RPC methods are forwarded to FNN completely unmodified.
3. **Database Logging:** Verify that all processed payments are successfully persisted in SQLite with their full diagnostics payload.
