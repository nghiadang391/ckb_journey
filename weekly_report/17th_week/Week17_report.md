## Builder Track Weekly Report — Week 17

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 11 September 2026  

---

## Overview

Work during **Week 17** focused on **transitioning ToyTrade from an initial MVP into a stable, enterprise-grade architecture governed by the V-Model SDLC**, alongside eliminating production rendering flicker (FOUC) and establishing complete bidirectional test traceability.

---

## Key Achievements & Technical Milestones

### 1. FOUC Resolution & Production UI Performance
- **Root Cause**: Next.js client components using `<style jsx>` delayed style application until hydration, causing a visible flash of unstyled text.
- **Fix**: Extracted landing, navbar, and footer styling into `globals.css` so styles are embedded directly in the server-rendered HTML payload.
- **Outcome**: Zero layout shift on initial load; sustained **99–100 Lighthouse performance scores**.

### 2. V-Model SDLC Framework (`SDLC_GUIDE.md`)
- Established the formal V-Model engineering standard linking design and verification phases:
  - **RD** (Requirements Definition) <-> **IT** (Integration Testing)
  - **AD** (Architectural Design) <-> **IT** (Integration Testing)
  - **UD** (Unit / Detailed Design) <-> **UT** (Unit Testing)
  - **CD** (Coding / Development) at the vertex
- Standardized traceability IDs (`REQ-`, `ARCH-`, `SPEC-`, `UT-`, `IT-`) across all 6 platform domains (`ESC`, `LST`, `CHT`, `PAS`, `USR`, `PAY`).
- Codified strict Web3 rules: capacity cost transparency (~61–142 CKB cell storage, who pays, and reclamation mechanisms) and frontend/backend boundary separation.

### 3. Escrow & QR Handover Pilot Specification Package
Delivered a complete 4-document specification package for the zero-trust settlement engine (`docs/sdlc/escrow/`):
- **RD.md**: Functional requirements (`REQ-ESC-001..006`) covering escrow initiation, self-trade prevention, 15-minute ephemeral QR tokens, buyer handover verification, and 7-day timeout sweeps.
- **AD.md**: 3-tier boundary architecture (Client JoyID <-> Next.js APIs <-> Prisma DB <-> CKB L1 `escrow-lock`) and deterministic state machine (`PENDING` -> `ESCROWED` -> `RELEASED` / `REFUNDED`).
- **UD.md**: Route handler specifications and binary layout for the RISC-V `escrow-lock` contract (dual-signature vs. timeout reclamation branches).
- **RTM.md**: Bidirectional traceability matrix mapping all requirements to test cases.

### 4. Test Suite Restructuring & Test Specifications
- **Test Architecture**: Restructured tests into dedicated unit (`tests/unit/escrow_lock.test.ts`) and integration (`tests/integration/trades_escrow.test.ts`) suites with matching `package.json` scripts (`test:unit`, `test:integration`).
- **In-Code Traceability**: Annotated all test cases in the codebase with standardized RTM IDs.
- **Test Specifications (`docs/testing/TEST_SPECIFICATIONS.md`)**: Authored technical reference covering preconditions, input payloads, execution steps, expected outcomes, and traceability links for all 38 active tests.

---

## Test Verification Results

- **Automated Tests**: **100% pass rate (38/38 tests passing across 9 test suites)** via `npx jest --runInBand`.
  - `npm run test:unit`: 4/4 passing (smart contract RISC-V unit tests).
  - `npm run test:integration`: 6/6 passing (escrow and QR handover integration tests).
- **Production Build**: `npm run build` compiled all 19 application routes with **zero TypeScript or linting errors**.
