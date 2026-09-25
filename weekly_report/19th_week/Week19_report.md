## Builder Track Weekly Report — Week 19

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 25 September 2026  

---

## Overview

Work during **Week 19** focused on **conducting a rigorous security audit against the official CKB Development Guardrails, remediating critical verification and authorization gaps across trade and payment endpoints, and standing up a live Fiber Network Node (`fnn` v0.9.1) on CKB Testnet (Aggron4) with funded Layer 2 payment channel liquidity**.

---

## Key Achievements & Technical Milestones

### 1. Security Re-Audit & Vulnerability Remediation (CKB Development Guardrails)
Audited all client and server endpoints against the Nervos AI Development Guardrails, identifying and remediating 3 security gaps:

- **Gap 1: Caller Authorization in Dual-Confirmation Endpoint (`POST /api/trades/[id]/confirm`)**
  - **Vulnerability**: The endpoint previously accepted `actorType: "BUYER"` or `"SELLER"` without verifying whether the caller actually owned the trade party address, allowing arbitrary state progression to `BUYER_CONFIRMED` or `SELLER_CONFIRMED`.
  - **Fix**: Required `callerAddress` in the request body. Enforced strict identity checks:
    - If `actorType === "BUYER"`, verified `callerAddress === trade.buyer.joyIdAddress`.
    - If `actorType === "SELLER"`, verified `callerAddress === trade.seller.joyIdAddress`.
    - Unauthorized calls are rejected with `403 Forbidden`.
  - **Tests**: Added `[IT-ESC-010]` (unauthorized rejection) and `[IT-ESC-011]` (authorized confirmation).

- **Gap 2: Fiber Lightning Invoice Settlement Authorization (`POST /api/fiber/pay`)**
  - **Vulnerability**: Any client knowing a `tradeId` could trigger `/api/fiber/pay` to dispatch outbound Fiber liquidity without proof of buyer identity.
  - **Fix**: Updated `QrHandoverModal.tsx` to include `callerAddress` in the payment payload. The backend endpoint enforces `callerAddress === trade.buyer.joyIdAddress` prior to triggering outbound payment, rejecting third parties with `403 Forbidden`.
  - **Tests**: Added `[IT-PAY-005]` to verify unauthorized payment attempts are blocked.

- **Gap 3: CKB On-Chain Live Cell & Capacity Verification (`POST /api/trades`)**
  - **Vulnerability**: Trade creation accepted client-supplied `escrowCellOutpoint` strings without verifying on-chain existence, opening the system to ghost trades backed by spent or non-existent cells.
  - **Fix**: Integrated `@ckb-ccc/core`'s `ClientPublicTestnet`. The endpoint now queries `client.getCellLive({ txHash, index })` against CKB Testnet (Aggron4):
    - Asserts the cell exists and is currently live (`cell.cellOutput`).
    - Verifies that on-chain capacity satisfies or exceeds the required listing price (`BigInt(cell.cellOutput.capacity) >= BigInt(priceCkb)`).
    - Preserves test runner mock bypasses for offline CI environments.
  - **Tests**: Added `[IT-ESC-012]` to verify on-chain cell existence and capacity validation.

---

### 2. Live Fiber Network (L2) Testnet Integration (`fnn` v0.9.1)
Transitioned the Layer 2 payment infrastructure from simulated mock invoices to a live, functional Fiber Network Node:

- **Node Setup & Daemon Deployment**:
  - Installed and configured the official `fnn` v0.9.1 binary on Apple Silicon (`aarch64-darwin-portable`).
  - Configured testnet connectivity in `config.yml`:
    - Chain: CKB Testnet (`Aggron4`).
    - CKB RPC: `https://testnet.ckbapp.dev/`.
    - JSON-RPC Port: `127.0.0.1:8227`.
    - P2P Port: `0.0.0.0:8228`.
  - Connected to official Nervos Fiber testnet bootnodes (`54.179.226.154` and `16.163.7.105`).
- **Node Wallet & Funding**:
  - Generated node identity and funding lock script (`0x9bd7e06f...`).
  - Derived CKB testnet address:
    `ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwcvr60nfcffdw5q65p9pypu8ykpwdacqqcx02jx`.
  - Funded the wallet with 300,000 testnet CKB from the Nervos faucet.
- **Payment Channel Establishment**:
  - Opened a peer payment channel with official bootnode `024714ca19abea4ddc0f3863ffdfb2e2cee76af87c477de4bc67c74a83f8140042` with 500 CKB initial funding.
  - Monitored on-chain funding transaction (`0xc557b20341e5f08f10cf07e3d5b96ef5b5d08d328c49d135dafb71cfe398d35e`).
  - Channel successfully confirmed on CKB Testnet (block `0x156f701`) and reached **`ChannelReady`** state.
- **Client Normalization & Real Invoices**:
  - Updated `src/lib/fiber/fnnClient.ts` to communicate with port `8227` using testnet currency `Fibt`.
  - Normalized `new_invoice` response handling to support nested `v0.9.x` invoice structures.
  - Successfully produced authentic, cryptographically signed Bech32m `fibt1...` invoices containing valid payment hashes.

---

## Test Verification Results

- **Automated Tests**: **100% pass rate (45/45 tests passing across 9 test suites)** via `npx jest --runInBand`.
  - Smart contract RISC-V unit tests (`tests/unit/escrow_lock.test.ts`): 4/4 passing.
  - Escrow and trade integration tests (`tests/integration/trades_escrow.test.ts`): 12/12 passing (including `[IT-ESC-010]`, `[IT-ESC-011]`, and `[IT-ESC-012]`).
  - Fiber L2 integration tests (`tests/fiber.test.ts`): 5/5 passing (including `[IT-PAY-005]` and live node invoice generation).
  - API, auth signature, spore builder, and UI tests: All passing cleanly.
- **Production Build**: `npm run build` compiled all 19 application routes with **zero TypeScript errors** and validated static/dynamic generation.
