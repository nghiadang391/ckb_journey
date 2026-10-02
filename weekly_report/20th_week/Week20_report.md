## Builder Track Weekly Report — Week 20

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 2 October 2026  

---

## Overview

Work during **Week 20** focused on **resolving production JoyID passkey cryptographic authorization issues on Vercel, integrating live US CPSC toy recall safety checks, implementing user profile customization with mutual post-trade ratings and reputation aggregation, building a real browser E2E test suite using Playwright and Chromium, and enforcing strict test database isolation**.

---

## Key Achievements & Technical Milestones

### 1. JoyID Passkey Cryptographic Verification in Production
Diagnosed and remediated a critical production failure where listing creation on Vercel (`POST /api/listings`) failed with `Cryptographic signature verification failed`:
- **Root Cause**: The frontend previously submitted a placeholder mock signature string (`mock-sig-...`) that was rejected by the backend's strict cryptographic verification in production (`NODE_ENV === "production"`).
- **Client Passkey Integration**: Updated `src/app/listings/create/page.tsx` to dynamically import `@joyid/ckb` and invoke `signChallenge(message, activeUser.joyIdAddress)` with graceful cancellation and user-facing error handling.
- **Backend Verification**: Updated `src/lib/ckb/auth.ts` to parse JoyID `SignMessageResponseData` JSON and execute native `@joyid/ckb` `verifySignature()` verification with fallback to `@ckb-ccc/core` JoyID verification.
- **Production Validation**: Successfully verified authentic JoyID passkey signatures on live Vercel production deployment.

---

### 2. User Profiles, Mutual Ratings & Reputation Aggregation
Built the peer-to-peer trust and reputation system across trades:
- **Profile Customization (`PATCH /api/users/profile`)**:
  - Implemented user profile updates (display name, avatar, and region selection).
  - Added automated user record provisioning upon first wallet connect.
  - Test coverage: Added `[IT-USR-001]` and `[IT-USR-002]` verifying creation and updates.
- **Mutual Post-Trade Ratings (`POST /api/trades/[id]/rate`)**:
  - Implemented 1-to-5 star rating and review submissions once an escrow trade reaches `COMPLETED` status.
  - Enforced single-rating constraints (`@@unique([tradeId, raterId])`) and blocked unauthorized participants or premature ratings (`403 Forbidden`).
  - Test coverage: Added `[IT-USR-003]` through `[IT-USR-007]`.
- **Reputation Metrics Aggregation**:
  - Updated `Navbar.tsx` and `src/app/listings/page.tsx` to aggregate average ratings and completed trade volume on seller badges.
  - Test coverage: Added `[IT-USR-008]`.

---

### 3. Live US CPSC Product Safety Recall Integration
Integrated real-time toy safety compliance against official regulatory data:
- **CPSC Recall Verification (`src/lib/safety/recall-checker.ts`)**:
  - Connected real-time search queries to the US Consumer Product Safety Commission API (`api.cpsc.gov/recalls`).
  - Built an in-memory keyword fallback (hazardous magnet sets, lead paint toys, choke-hazard action figures) to guarantee offline reliability and rate-limit resilience.
- **Reactive UI Alerts**: Added live debounced safety feedback on the listing creation form before submission.
- **Test Coverage**: Added `[UT-SAF-001]` through `[UT-SAF-004]`.

---

### 4. Real Browser E2E Test Suite (Playwright & Headless Chromium)
Replaced synthetic HTTP `fetch()` tests with real browser end-to-end execution to eliminate test-to-production divergence:
- **Playwright Configuration**: Added `playwright.config.ts` targeting headless Chromium and configured `"test:browser": "playwright test"`.
- **Browser User Journey (`tests/browser/create_listing.spec.ts`)**:
  - Automates pre-seeding logged-in wallet state in localStorage.
  - Validates safety recall warning display on recalled models and clearance on safe models.
  - Completes full form entry, submits listing, verifies URL navigation, and confirms marketplace DOM rendering.

---

### 5. Strict Test Database Isolation & Safeguards
Enforced database hygiene to prevent test pollution of the live Turso instance shared with production:
- **Database Sanitization**: Removed all dummy test listings (`LEGO Millennium Falcon` test records) and test users from the production database.
- **Rule 6 Codified in `AGENTS.md`**: Mandated that all test suites target `TEST_DATABASE_URL` and guarantee teardown in `afterAll` hooks.
- **Automated Self-Teardown**: Added `DELETE /api/listings?address=...` restricted to automated test prefixes (`ckt1_browser_` and `ckt1_smoke_`) and hooked it into Playwright's `test.afterAll`.

---

## Test Verification Results

- **Unit & Integration Suite**: **60/60 tests passing across 11 test suites** (`npm test`):
  - RISC-V Escrow Lock Tests (`tests/unit/escrow_lock.test.ts`): 4/4 passing.
  - User Profiles & Ratings (`tests/integration/user_profile_and_ratings.test.ts`): 8/8 passing.
  - Trades & Escrow Lifecycle (`tests/integration/trades_escrow.test.ts`): 12/12 passing.
  - Live Server Smoke Suite (`tests/e2e/smoke.test.ts`): 8/8 passing.
  - Toy Safety Recall Checker (`tests/unit/recall_checker.test.ts`): 4/4 passing.
  - Fiber L2 Network (`tests/fiber.test.ts`): 5/5 passing.
- **Real Browser E2E Suite**: **1/1 passed in 6.5s** (`npm run test:browser` via Chromium).
- **Production Build**: `npm run build` compiled all routes cleanly with zero TypeScript or lint errors.
