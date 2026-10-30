## Builder Track Weekly Report — Week 24

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 30 October 2026  

---

## Overview

Work during **Week 24** focused on **architecting and building `x402-facilitator` (`https://github.com/nghiadang391/x402-facilitator`), an application-layer x402 payment facilitator service and `@x402-fiber` TypeScript SDK that bridges HTTP 402 AI agent payments to CKB's Fiber Network (FNN), implementing the end-to-end `exact` settlement scheme, engineering server-side `upto` metered capability math and physical channel-cap design, and benchmarking live FNN v0.9.1 testnet RPC behavior**.

---

## Key Achievements & Technical Milestones

### 1. `@x402-fiber` SDK & End-to-End `exact` Scheme Implementation
Built the foundational bridge between the `@x402/core` (v2.29.0) payment standard and CKB's Fiber Network without legacy Lumos or frozen `@nervosnetwork/ckb-types` dependencies (using `@ckb-ccc/core` v1.23.0):
- **CAIP Network & Wire Type Pinning (`src/types.ts`)**:
  - Defined the Fiber CAIP namespace (`FIBER_CAIP_FAMILY = "fiber"`, `FIBER_NETWORK = "fiber:ckb-testnet"`) to register cleanly with `@x402/core` client and facilitator routers.
- **Agent-Side Scheme Client (`src/scheme.ts` — `createExactFiberClient`)**:
  - Implemented `SchemeNetworkClient` to construct x402 v2 payment payloads (`FiberExactPayload` with keysend delivery proof flags and payer pubkey identity) in response to `402 Payment Required` challenges.
- **Facilitator-Side Scheme Handler (`src/scheme.ts` — `createExactFiberFacilitator`)**:
  - Implemented `SchemeNetworkFacilitator` (`getSupported`, `verify`, `settle`) validating scheme, `fiber:*` network namespace, and positive shannon amounts (decimal or `0x`-hex via `parseShannons`).
  - Wired `settle` to open node-signed FNN invoices (`new_invoice`) and execute keysend settlement (`send_payment`), returning the node-issued `payment_hash` in `SettleResponse.transaction`.
- **Facilitator HTTP Service (`src/server.ts`)**:
  - Built the Hono-based facilitator HTTP server (`createFacilitatorApp`) exposing the standard `@x402/core/http` endpoints (`GET /supported`, `POST /verify`, `POST /settle`, and `GET /__meta`) on port `4020`.

---

### 2. Metered `upto` Capability Math & Physical Channel-Cap Architecture
Designed and implemented the core metering and security primitives for variable-cost AI/API calls (`docs/upto-design.md`, `src/capability.ts`):
- **Physical Channel-Cap Security Model (`docs/upto-design.md`)**:
  - Addressed the prompt-injection budget-bypass risk by binding session caps to a dedicated, pre-funded FNN channel rather than an SDK-side counter, ensuring a compromised agent physically cannot spend beyond the funded channel balance.
- **Settlement Override Parser & Resolver (`src/capability.ts`)**:
  - Implemented `parseOverride` and `resolveOverrideToMeasured` supporting all three `@x402/core` `Settlement-Overrides` formats: raw atomic shannons (decimal or `0x` hex), percentage of cap (`<= 2` decimal places, floored to atomic units), and USD amount conversion via asset decimals.
  - Built `enforceCap` as an unbypassable server-side clamp guaranteeing `measured <= capShannons` regardless of provider override headers.
- **Single-Use Preimage Replay Protection & Deadlines (`src/capability.ts`)**:
  - Implemented `PreimageRegistry` (`canUse`, `consume`, `has`) and SHA-256 `commitmentFromPreimage` (`H(s)`) to enforce single-use preimage redemption and reject replay attempts (`preimage_replayed`).
  - Added `checkDeadline` to validate capability expiration timestamps prior to settlement.

---

### 3. Live FNN v0.9.1 Testnet Spike, RPC Transport & Reproducible Evidence Scripts
Conducted live protocol verification against a local FNN v0.9.1 testnet node (`~/.fiber/bin/fnn`) and built reproducible verification scripts (`docs/spikes/w1-reality-check.md`, `docs/evidence-w1.md`):
- **FNN v0.9.x JSON-RPC Transport (`src/fnnClient.ts`)**:
  - Implemented `FnnClient` with `AbortController` request timeouts, dual-path invoice response normalization (`result.invoice.data.payment_hash` vs. flat shape), injectable `fetchImpl` for zero-network unit testing, and `simulateFallback` offline mode.
  - Isolated FNN v0.9.1 connection-drop behavior on `send_payment` / `get_payment` / `node_info` into a structured `FnnTransportError` (`errorReason: "fnn_transport_unavailable"`), ensuring the facilitator never crashes with unhandled exceptions while `list_channels`, `new_invoice`, and `get_invoice` operate live.
- **Reproducible Verification Scripts (`scripts/`)**:
  - `scripts/gap-repro.ts`: Contrasts fabricated mock receipts (`fbr_mock_`) against live FNN node-issued `fibt1...` invoices and signed `payment_hash` receipts (`docs/spikes/gap-repro-output.txt`).
  - `scripts/exact-poc.ts`: Executes the end-to-end 402 flow (`PaymentRequired` -> `createPaymentPayload` -> `facilitator.verify` -> `facilitator.settle`) over FNN (`docs/spikes/exact-poc-output.txt`).

---

## Test Verification Results

- **Automated Unit Test Suite**: **24/24 tests passing across 2 test suites** (`npm test` in `x402_facilitator`, 100% offline with zero network/DB dependencies):
  - **`exact` Scheme Client & Facilitator (`tests/exact.test.ts`)**: **9/9 passing**
    - `createPaymentPayload` fiber payload construction.
    - `getSupported` registration for `exact` / `fiber:ckb-testnet`.
    - `verify` acceptance of valid requests and rejection of non-fiber networks, unregistered routers, and non-positive amounts.
    - `settle` execution against simulated FNN transport and structural `fnn_transport_unavailable` reporting on transport drop.
    - `parseShannons` decimal, `0x`-hex, and invalid input handling.
  - **`upto` Capability Math & Replay Guards (`tests/capability.test.ts`)**: **15/15 passing**
    - `parseOverride` validation for raw decimal, raw `0x`-hex, percentage (`<= 2` decimal places), USD strings, and malformed inputs.
    - `resolveOverrideToMeasured` cap clamping, pass-through under cap, and basis-point flooring.
    - `enforceCap` server-side ceiling enforcement and non-bigint type rejection.
    - `PreimageRegistry` single-use consumption, replay rejection, and SHA-256 commitment binding.
    - `checkDeadline` future and expired capability validation.
- **TypeScript Build & Typecheck Verification**: Clean zero-error compilation against `@x402/core` v2.29.0 and `@ckb-ccc/core` v1.23.0 (`npm run typecheck`).

