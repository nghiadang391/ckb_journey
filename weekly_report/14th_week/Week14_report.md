## Builder Track Weekly Report — Week 14

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 21 August 2026  

---

## Overview

Building upon the signature framework and prototype established in Week 13, work during **Week 14** focused on **production hardening, serverless persistence migration, L2/L1 payment resilience, edge performance optimization, and rigorous automated testing**. 

Key milestones include transitioning the platform to a persistent serverless cloud database (**Turso LibSQL**), implementing a dedicated isolated testing database architecture, resolving passkey origin-binding constraints on production deployments, achieving sub-millisecond price-feed caching, and synthesizing a comprehensive **Web3 Engineering Playbook** documenting technical lessons learned from building on Nervos CKB.

---

## Key Achievements & Technical Milestones

### 1. Serverless Cloud Database Migration (Turso LibSQL Architecture)
- **Eliminated Ephemeral File System Loss**: Migrated the local SQLite setup to **Turso Serverless SQLite (LibSQL)**. Resolved the `/tmp` read-only/ephemeral data loss inherent to serverless hosting (Vercel) upon new deployments.
- **Database Synchronization Scripts**: Developed direct SQL schema migration tooling (`scripts/sync-turso.ts`) using `@libsql/client` and Prisma driver adapters to sync DDL definitions to Turso cloud clusters without build-time CLI schema push blockers.
- **Defensive Environment Variable Hygiene**: Implemented sanitization routines in the database client to automatically strip enclosing quotes and whitespace from `TURSO_AUTH_TOKEN` and `DATABASE_URL`.

### 2. Isolated Test Database Architecture & Automated Safety Guardrails
- **Dedicated Test Environment (`toytrade-test`)**: Provisioned an isolated Turso test database to completely segregate integration tests from production data.
- **Dynamic Runtime Interception**: Enhanced `src/lib/prisma.ts` to automatically route database traffic to `TEST_DATABASE_URL` whenever `NODE_ENV === 'test'`.
- **Test Suite Expansion & Coverage**: Expanded automated testing to **23 comprehensive test cases across 7 suites** (77.6% line coverage) covering:
  - User registration & on-the-fly passkey upserting.
  - Full listing lifecycle with defensive enum normalization (`VN` $\rightarrow$ `VIETNAM`, `USED` $\rightarrow$ `GOOD`).
  - Escrow trade lock state transitions (`ACTIVE` $\rightarrow$ `RESERVED` $\rightarrow$ `TRADED`).
  - Instant Fiber L2 invoice settlement and immutable `PassportLog` creation.

### 3. Three-Tier Caching & High-Performance Price Feed
- **N+1 Request Elimination**: Resolved redundant per-component price polling across listing cards by lifting and sharing CKB exchange rate state at the client module level.
- **In-Memory Server-Side TTL Caching**: Added a 60-second in-memory cache to `src/lib/ckb/price-feed.ts` to avoid CoinGecko rate limiting and drop API latency from ~500ms to **<1ms**.
- **Edge CDN Caching**: Configured `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` on `/api/price/ckb` for instantaneous Edge delivery.

### 4. JoyID Passkey Production Hardening & Full-Stack Web3 Fixes
- **Origin-Binding Resilience**: Dynamically bound JoyID passkey initialization to runtime browser origin (`window.location.origin`), eliminating popup blocker errors and cross-origin authentication failures across environments.
- **BigInt JSON Serialization Handling**: Fixed serialization crashes (`TypeError: Do not know how to serialize a BigInt`) when handling CKB token amounts (measured in Shannons, $10^8$) across API endpoints.
- **Safety Recall Live Checker**: Optimized debounce intervals and integrated live safety alerts into listing creation forms against official safety hazard datasets.

### 5. Documentation & Developer Knowledge Synthesis
- **Web3 Engineering Playbook**: Authored `docs/web3_engineering_playbook.md` (and mirrored to `ckb_journey/01_doc/`) detailing 8 key engineering principles:
  1. Web3 UX & Biometric Passkey Account Abstraction (JoyID).
  2. Layer 2 Payment Channels & Fallback Escrow (Fiber).
  3. Three-Tier Performance Caching Architecture.
  4. Serverless Cloud Databases vs. Ephemeral File Systems.
  5. Isolated Test Databases & Defensive Normalization.
  6. CKB Cell Model vs. EVM Account Model ($1\text{ CKB} = 1\text{ Byte}$ capacity rule).
  7. Spore DOB Protocol for On-Chain Digital Passports.
  8. Full-Stack Web3 Serialization & Browser Security Nuances.

---

## Test Suite & Verification Results

- **Complete Test Suite**: **23 out of 23 tests passing** across 7 test suites:
  - `tests/api_comprehensive.test.ts`: 8/8 passing (User registration, defensive normalization, user auto-upsert, listings, trades, Fiber settlement).
  - `tests/api.test.ts`: 1/1 passing (Local & cloud DB sanity).
  - `tests/auth.test.ts`: 2/2 passing (Cryptographic signature verification & rejection).
  - `tests/escrow.test.ts`: 4/4 passing (Dual confirmation & timeout reclaim contract logic).
  - `tests/spore.test.ts`: 1/1 passing (Spore DOB passport transaction builder).
  - `tests/fiber.test.ts`: 3/3 passing (Fiber invoice generation, payment dispatch, health checks).
  - `tests/errorBoundary.test.ts`: 4/4 passing (UI fault tolerance).
- **Production Build**: `next build` compiled cleanly with zero TypeScript errors.
