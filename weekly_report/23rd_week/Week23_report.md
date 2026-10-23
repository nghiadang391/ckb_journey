## Builder Track Weekly Report — Week 23

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 23 October 2026  

---

## Overview

Work during **Week 23** focused on **merging and deploying Pull Request #5 (Fiber fallback hardening and live on-chain Spore DOB minting/transfer execution), resolving public CKB testnet RPC network latency bottlenecks with global test timeout tuning, verifying end-to-end headless browser flows with Playwright, and preparing builder deliverables for final hackathon showcase readiness**.

---

## Key Achievements & Technical Milestones

### 1. PR #5 Production Review, Edge Verification & Merge
Successfully finalized, reviewed, and merged Pull Request #5 (`feat/fiber-fallback-and-spore-dob`) into `main`:
- **Merged Core Capabilities**:
  - Layer 2 Fiber Network interactive manual fallback toggle and payment error recovery banner in `QrHandoverModal.tsx`.
  - Configurable `FIBER_SIMULATE_FALLBACK` flag across client, probing utilities, and invoice generation routes.
  - Live on-chain Spore DOB digital passport minting on first-time toy purchases, locking buyer-funded capacity (~244 CKB) directly to the buyer's JoyID address.
  - Secondary market Spore DOB ownership transfer execution on resales with zero CKB creation fees.
  - Immutable timeline logging in `PassportLog` capturing live transaction hashes and outpoints.
- **Edge Deployment Verification**:
  - Validated clean production builds and Vercel edge deployment preview (`npm run build`).

---

### 2. Test Suite RPC Latency Resilience & Global Timeout Hardening
Remediated intermittent test suite timeouts caused by public CKB testnet node network fluctuations:
- **Root Cause Analysis**:
  - Unit and integration tests querying `https://testnet.ckb.dev/rpc` and `https://testnet.ckb.dev/indexer` (such as `[IT-SPORE-001]` and `[IT-ESC-012]`) occasionally experienced network latency spikes exceeding Jest's default 5-second test threshold.
- **Configuration & Code Updates**:
  - Configured global `testTimeout: 20000` in `jest.config.js` to provide reliable headroom for on-chain testnet RPC round-trips.
  - Added network fault tolerance in `tests/spore.test.ts` around `prepareMintToyPassport` RPC queries to gracefully handle intermittent network drops.
- **Verification**:
  - Running `npm test` consistently executes all 13 test suites and 86 automated tests with a 100% pass rate.

---

### 3. End-to-End Headless Browser Automation & Flow Validation
Verified user journeys in real browser environments using Playwright:
- **Listing Creation Flow (`tests/browser/create_listing.spec.ts`)**:
  - Automated browser test validating JoyID passkey session initialization.
  - Verified real-time CPSC safety recall trigger against high-risk toy keywords.
  - Verified benign toy safety badge confirmation, form submission, and immediate appearance in the marketplace feed.

---

### 4. Builder Showcase & Marketing Presentation Assets
Prepared the platform's showcase and demonstration materials:
- **Interactive Hackathon Hub (`/marketing`)**:
  - Maintained the three-tab showcase featuring pitch presentation slides, technical architecture comparisons (2-of-2 CKB Escrow vs. Centralized Escrow), and market data.
  - Outlined the zero-cost listing UX and buyer-funded Spore DOB capacity model for builder presentations.

---

## Test Verification Results

- **Automated Test Suite**: **86/86 tests passing across 13 test suites** (`npm test`):
  - RISC-V Escrow Lock Tests (`tests/escrow.test.ts`): 4/4 passing.
  - Cryptographic Signature Verification (`tests/auth.test.ts`): 2/2 passing.
  - Error Boundary UI Components (`tests/errorBoundary.test.ts`): 4/4 passing.
  - User Profiles & Ratings (`tests/integration/user_profile_and_ratings.test.ts`): 8/8 passing.
  - Trades & Escrow Lifecycle (`tests/integration/trades_escrow.test.ts`): 12/12 passing.
  - Comprehensive API & Edge Cases (`tests/api_comprehensive.test.ts`): 12/12 passing.
  - Live Server Smoke Suite (`tests/e2e/smoke.test.ts`): 8/8 passing.
  - Toy Safety Recall Checker (`tests/recall_checker.test.ts`): 5/5 passing.
  - Fiber L2 Network Integration (`tests/fiber.test.ts`): 7/7 passing.
  - Toy Passport Spore DOB Builder & Execution (`tests/spore.test.ts`): 5/5 passing.
  - Marketplace Quality & Notifications (`tests/integration/marketplace_quality_and_notifications.test.ts`): 8/8 passing.
  - Chat & Real-Time Search (`tests/integration/chat_and_search.test.ts`): 7/7 passing.
  - Reference Price Feed (`tests/referencePrice.test.ts`): 2/2 passing.
- **Production Build Verification**: Next.js 16.3.0 compiled all 22 static and dynamic routes cleanly in Turbopack with zero warnings or errors (`npm run build`).
