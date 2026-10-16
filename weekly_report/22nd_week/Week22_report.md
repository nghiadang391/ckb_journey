## Builder Track Weekly Report — Week 22

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 16 October 2026  

---

## Overview

Work during **Week 22** focused on **hardening the Layer 2 Fiber Network fallback engine with interactive recovery and simulation controls, implementing live on-chain Spore DOB digital passport minting and transfer execution during trade settlement, establishing sustainable buyer-funded cell capacity economics, and ensuring end-to-end test reliability and deterministic CI execution across all platform modules**.

---

## Key Achievements & Technical Milestones

### 1. Fiber Network L2 Fallback Hardening & Graceful Recovery
Remediated operational and usability gaps in the Layer 2 payment pipeline to ensure trades can always complete even if peer nodes or payment routes degrade:
- **Manual L1 Fallback Toggle (`QrHandoverModal.tsx`)**:
  - Added an interactive "Use Standard L1 Escrow" action button in the handover modal header.
  - Allows either the buyer or seller to manually bypass the Fiber Layer 2 route and switch to standard Layer 1 escrow if the peer channel is unresponsive or slow.
- **Payment Failure Recovery Action**:
  - Implemented error recovery handling for `POST /api/fiber/pay`.
  - If Fiber payment routing fails during in-person meetup (e.g. insufficient route liquidity, channel exhaustion, or node timeout), the modal transitions to an actionable error state with a single-tap button to complete the trade via standard L1 handover instead of stranding the buyer on an error string.
- **Configurable Fallback Simulation (`FIBER_SIMULATE_FALLBACK`)**:
  - Added support for `FIBER_SIMULATE_FALLBACK=true` environment flag and request-level `simulateFallback: true` parameters across `fnnClient.ts`, `prober.ts`, and `/api/fiber/invoice/route.ts`.
  - Ensures automated tests and CI environments can evaluate the full fallback pipeline without dev mocks concealing routing failures.
- **Bilingual Interface Support (`LanguageContext.tsx`)**:
  - Added localized strings in English and Vietnamese for fallback actions, payment error prompts, and retry mechanisms (`switchToL1Btn`, `fiberFailedPrompt`, `retryFiber`).
- **Automated Fallback Tests (`tests/fiber.test.ts`)**:
  - Added test `[IT-PAY-006]` validating route fallback parameters and fallback payload structure.
  - Added test `[IT-PAY-007]` verifying offline health reporting and route blocking under active simulation flags.

---

### 2. Live On-Chain Spore DOB Minting & Transfer Execution
Built out the full on-chain lifecycle for Toy Passports utilizing Spore Protocol (DOB-0) on CKB:
- **Capacity Economics Alignment**:
  - Formalized the buyer-funded capacity model: the ~244 CKB capacity lock cost (£1.00 / 30,000 VND) is bundled into the initial toy purchase price.
  - Sellers list items at zero CKB cost. For subsequent resales, the pre-existing Spore DOB cell is reused, resulting in 0 CKB creation fee on future trades.
- **Execution Engine (`src/lib/ckb/spore.ts`)**:
  - Implemented `executeMintToyPassport` to prepare and execute Spore cell creation with structured toy metadata (title, condition, category, timestamp, shipping region, image search hash) targeting CKB Testnet (Aggron4) using `@spore-sdk/core` and `@ckb-ccc/core`.
  - Implemented `executeTransferToyPassport` to handle cell ownership transfer between counterparty JoyID addresses on secondary market sales.
  - Included deterministic testnet outpoint generation and fallback handling for offline and local testing environments.
- **Trade Settlement Integration (`/api/trades/[id]/qr` and `/api/fiber/pay`)**:
  - Wired Spore DOB minting into both meetup QR handover settlement and instant Fiber payment settlement.
  - **First-Time Trades**: Mints a new Spore DOB cell directly to the buyer's JoyID address, locking the capacity funded by the escrow payment, and records `sporeDobId` and `sporeTxHash` on the listing.
  - **Resale Trades**: Detects existing `sporeDobId`, executes an on-chain ownership transfer to the new buyer, and appends the event to the immutable `PassportLog` timeline.
- **Automated Spore Test Suite (`tests/spore.test.ts`)**:
  - Added 5 comprehensive test cases (`[IT-SPORE-001]` to `[IT-SPORE-005]`) verifying mint skeleton generation, deterministic outpoint formatting, first-time handover minting, resale transfer persistence, and `/api/passport/[id]` timeline retrieval.

---

### 3. Test Suite Hardening & Deterministic Execution
Resolved external dependency bottlenecks to maintain high testing reliability:
- **SaferProducts API Isolation (`tests/recall_checker.test.ts`)**:
  - Isolated the asynchronous recall checker test suite from external US CPSC government API (`saferproducts.gov`) network latency and rate limiting using controlled test mocks.
  - Reduced recall test suite runtime from over 17 seconds to 150 milliseconds.
- **Concurrency Timeout Buffering (`tests/api_comprehensive.test.ts`)**:
  - Configured 15-second test timeouts in the comprehensive API suite to eliminate false-positive timeouts during concurrent test runs under high CPU load.
- **Clean Production Verification**:
  - All 13 test suites and 86 automated tests pass consistently with zero failures.
  - Next.js Turbopack build compiles all 22 static and dynamic routes cleanly with zero TypeScript or build errors.

---

## Test Verification Results

- **Automated Test Suite**: **86/86 tests passing across 13 test suites** (`npx jest --runInBand`):
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

---
