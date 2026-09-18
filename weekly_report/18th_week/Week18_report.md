## Builder Track Weekly Report — Week 18

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 18 September 2026  

---

## Overview

Work during **Week 18** focused on **implementing live in-browser mobile camera QR scanning and real 2D QR code generation for in-person meetups, engineering a cryptographically balanced mutual cancellation ("Reject Toy") state machine with seller possession verification, and expanding full-stack automated test coverage across CKB contracts and application APIs**.

---

## Key Achievements & Technical Milestones

### 1. In-Browser Mobile Camera QR Scanner & Real 2D QR Code Generation
- **Problem**: The initial UI presented a visual mockup indicating camera scanning, but only allowed manual keyboard string entry, creating friction during physical handovers.
- **Seller View (Real 2D QR Generation)**:
  - Replaced static placeholder styling with `qrcode.react` (`QRCodeSVG`).
  - Encodes the dynamic 1-time handover token or Fiber payment invoice with high contrast and scannable error correction.
- **Buyer View (Live Camera Stream)**:
  - Integrated `html5-qrcode` to enable real-time camera scanning directly in mobile and desktop browsers.
  - Implemented camera stream controls (start/stop), an animated scanning viewfinder, and device camera permission error handling.
  - Added auto-capture and instant token decoding, which populates the confirmation input and halts the camera stream.
  - Enforced stream teardown on tab switch and modal unmount to prevent camera lock leaks.
  - Maintained manual code entry and demo auto-fill as fallback options for headless or webcam-less testing.

### 2. Mutual Cancellation & "Reject Toy" Game Theory Flow
- **Game Theory & Exploit Prevention**:
  - Addressed the limitation where a buyer inspecting a damaged or counterfeit toy in person had to either accept the trade or wait out the 7-day timeout for locked funds.
  - Prevented the reverse vulnerability (where an untrusted buyer could take the physical toy, tap cancel unilaterally, and walk away with both the item and the refund).
- **Two-Step Bilateral Workflow**:
  - **Step 1 (Buyer Rejection)**: Buyer taps "Reject Toy / Request Refund" in the handover modal and selects a structured reason (damaged/missing parts, condition mismatch, counterfeit item, or changed mind). Trade transitions to `CANCEL_REQUESTED`.
  - **Step 2 (Seller Possession Check & Approval)**: The seller interface presents the buyer's reason and prompts: *"Do you have the physical toy in your possession?"*
  - Upon seller confirmation, the system atomically marks the trade as `CANCELLED`, restores the listing status from `RESERVED` back to `ACTIVE`, and records an audit log entry in `PassportLog`.
  - Provided a dispute escalation path (`DISPUTED`) if the seller contests the rejection.

### 3. Database Schema & State Machine Expansion
- **Prisma & Turso Synchronization**:
  - Extended `TradeStatus` enum with `CANCEL_REQUESTED` and `CANCELLED`.
  - Added `cancelReason` and `cancelRequestedBy` fields to the `Trade` model.
  - Migrated schema to both primary and test Turso databases via `@libsql/client` and regenerated `@prisma/client`.
- **API Endpoints**:
  - Implemented `POST /api/trades/[id]/cancel` supporting `REQUEST_CANCEL`, `CONFIRM_CANCEL`, and `DISPUTE` operations with caller address verification.
  - Implemented `GET /api/trades/[id]/cancel` for status inspection.
  - Updated `GET /api/trades/[id]/qr` to maintain access for trades in `CANCEL_REQUESTED` state during dispute resolution.

### 4. Bilingual Localization & UI Polish
- Expanded `src/lib/LanguageContext.tsx` with complete English and Vietnamese dictionaries covering:
  - Camera scanner controls, hints, permissions, and detection confirmations.
  - Toy rejection reasons, seller possession confirmation prompts, dispute alerts, and cancellation success notices.

---

## Test Verification Results

- **Automated Tests**: **100% pass rate (41/41 tests passing across 9 test suites)** via `npx jest --runInBand`.
  - Smart contract RISC-V unit tests (`tests/unit/escrow_lock.test.ts`): 4/4 passing using `ckb-debugger`.
  - Escrow and trade integration tests (`tests/integration/trades_escrow.test.ts`): 9/9 passing.
    - Added `[IT-ESC-007]`: Buyer rejection request transitions status to `CANCEL_REQUESTED`.
    - Added `[IT-ESC-008]`: Seller in-hand possession confirmation triggers `CANCELLED` and reactivates listing to `ACTIVE`.
    - Added `[IT-ESC-009]`: Rejection of unauthorized third-party cancellation requests with 403 Forbidden.
- **Production Build**: `npm run build` compiled all 19 application routes with **zero TypeScript errors** and verified route optimization for `ƒ /api/trades/[id]/cancel`.
