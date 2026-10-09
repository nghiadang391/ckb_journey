## Builder Track Weekly Report — Week 21

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 9 October 2026  

---

## Overview

Work during **Week 21** focused on **resolving critical trade handover UX and accidental escrow release vulnerabilities, implementing a platform-wide real-time notification engine, optimizing marketplace load performance to sub-50ms via multi-tier caching, enforcing marketplace data hygiene by filtering traded items, building an accessible public user profile system, and delivering reactive real-time state synchronization across handover, chat, and marketplace views without requiring manual browser reloads**.

---

## Key Achievements & Technical Milestones

### 1. Handover Role Separation & Accidental Escrow Release Safeguards
Remediated an urgent usability and security vulnerability where buyers reserving toys were immediately shown the QR handover modal, allowing accidental escrow release before physically meeting the seller:
- **Role-Based Isolation in `BuyToyModal`**:
  - Replaced the immediate handover modal launch with an on-chain escrow confirmation screen detailing meetup and inspection rules.
  - Advised buyers to inspect physical toys first and only initiate QR scanning during the in-person meeting.
- **Server-Side Token Masking (`GET /api/trades/[id]/qr`)**:
  - Enforced strict token protection: when queried by the buyer's JoyID address, the secret handover token is masked (`token: null`).
  - Only the seller receives the secret handover token and displayable QR code to present at meetup.
- **Client Verification Hardening (`QrHandoverModal.tsx`)**:
  - Removed the "Auto-fill Active Code" button on the buyer view to prevent bypass of physical inspection.
  - Added an explicit pre-settlement confirmation dialog requiring the buyer to confirm physical inspection before dispatching the release transaction.
  - Added dedicated role headers: "Seller Handover View" (present QR) vs "Buyer Verification View" (inspect & scan).

---

### 2. Platform-Wide Real-Time Notification System
Engineered a persistent, real-time notification engine across trade events and user communications:
- **Database Schema & Turso Migration**:
  - Added `Notification` model to Prisma schema with fields for `type`, `title`, `message`, `link`, `read`, and foreign key relations to `User`.
  - Migrated schema to production Turso database.
- **Notification API Endpoints (`GET` and `PATCH /api/notifications`)**:
  - Implemented endpoints to fetch unread notification counts, retrieve recent notification lists, and batch-mark notifications as read.
- **Automated Event Triggers**:
  - `TRADE_BOOKED`: Alerts sellers when a buyer reserves their toy and locks escrow on-chain.
  - `MESSAGE_RECEIVED`: Alerts users upon receiving incoming peer-to-peer messages.
  - `TRADE_COMPLETED`: Alerts both counterparty participants when escrow funds are released.
- **Navbar Integration (`Navbar.tsx`)**:
  - Built a Notification Bell dropdown in the top navigation featuring unread count badges, mark-all-read action, and an unread dot indicator on the Messages link.

---

### 3. Marketplace Load Performance Optimization (<0.5s Target)
Engineered multi-tier caching to reduce marketplace load times from several seconds to under 50ms:
- **Client-Side SWR Cache**:
  - Implemented module-level in-memory caching in `src/app/listings/page.tsx`. Repeat navigations render instantly in <50ms without loading spinners.
- **Zero-Delay Initial Mount**:
  - Eliminated the 250ms debounce delay on initial component mount (`isInitialMount.current = true`), launching data retrieval immediately at 0ms. Debouncing remains active only on search and filter inputs.
- **Server-Side In-Memory Cache**:
  - Built an in-memory cache in `/api/listings/route.ts` with 15-second TTL and ~2ms response times.
  - Added cache invalidation hooks (`invalidateListingsCache()`) to guarantee cache consistency.
- **Route Prefetching**:
  - Enabled Next.js `prefetch={true}` on the "Browse Toys" navigation link.

---

### 4. Marketplace Data Hygiene & Traded Item Filtering
Cleaned up marketplace listings feed to maintain catalog integrity:
- **Exclusion of Traded Toys**:
  - Configured `GET /api/listings` where-clause to exclude traded items by default (`whereClause.status = { not: "TRADED" }`).
  - Active listings and cancelled trades (reverted to `ACTIVE`) remain visible in the marketplace feed.
  - Added defensive client-side filtering in `src/app/listings/page.tsx`.

---

### 5. Accessible Public User Profile & Reputation Hub (`/profile`)
Built an end-to-end user profile page connecting JoyID identities with listing history and reputation:
- **Profile Hub (`src/app/profile/page.tsx`)**:
  - Displays user identity card, JoyID address copy button, member tenure, aggregated star rating, and completed trade count.
  - Three-tab interface:
    - **Open Selling Toys**: Active listings with edit/delete actions for owners.
    - **Sold Toys**: Historically traded items with immutable Toy Passport (Spore DOB) records.
    - **Reviews & Ratings**: Mutual peer ratings, scores, and counterparty reviews.
- **Public Linking**:
  - Linked seller display names on all toy listing cards to `/profile?userId=...`.
  - Added direct "Profile" item to desktop and mobile navigation.

---

### 6. Reactive State Synchronization Without Manual Browser Reloads
Eliminated the requirement for manual browser reloads by implementing platform-wide reactive polling and event-driven revalidation:
- **Live Meetup Handover Sync (`QrHandoverModal.tsx`)**:
  - Added a 2-second polling loop querying `GET /api/trades/[id]/qr`.
  - Automatically detects when buyer confirms release, transitions seller modal to a dedicated completion confirmation screen, triggers mutual rating review after 1.5s, and synchronizes parent views.
  - Added real-time tracking for mutual cancellation requests (`CANCEL_REQUESTED`) and cancellations (`CANCELLED`).
- **Marketplace Silent Revalidation (`src/app/listings/page.tsx`)**:
  - Implemented `isSilent = true` background revalidation so listings refresh seamlessly without flickering or full-page spinners.
  - Added 10-second background polling, tab focus/visibility handlers, and listeners for `toytrade:tradeUpdated` and `toytrade:listingUpdated`.
- **Live Profile Sync (`src/app/profile/page.tsx`)**:
  - Added 8-second silent polling and event listeners for real-time reputation, sold count, and listings updates.
- **Snappy Chat & Notifications (`Navbar.tsx`, `messages/page.tsx`, `ChatModal.tsx`)**:
  - Shortened notification polling to 4 seconds with window focus synchronization.
  - Shortened chat room and message polling to 4s and 2s with immediate refetch on `toytrade:notification`.
- **Server-Side Cache Invalidation**:
  - Wired `invalidateListingsCache()` into all mutation endpoints (`/api/trades`, `/api/trades/[id]/qr`, `/api/trades/[id]/cancel`, `/api/fiber/pay`).

---

### 7. Fiber Network L2 Fallback & Diagnostic Analysis
Conducted diagnostic evaluation of the Layer 2 Fiber Network integration:
- Verified that on-chain CKB L1 Escrow is pre-locked upon trade creation (`escrowCellOutpoint`), guaranteeing safe zero-loss fallback to L1 if Layer 2 payment channels are unreachable.
- Analyzed the pre-flight route probe (`runPreflightProbe`) and parsed Fiber error categories (`InsufficientLocalBalance`, `NoRouteFound`, `ExpiryTooSoon`).
- Scoped controllable simulation flags (`FIBER_SIMULATE_FALLBACK`) and in-modal manual fallback triggers to enhance offline testability.

---

## Test Verification Results

- **Automated Test Suite**: **80/80 tests passing across 13 test suites** (`npm test`):
  - RISC-V Escrow Lock Tests (`tests/unit/escrow_lock.test.ts`): 4/4 passing.
  - Cryptographic Signature Verification (`tests/auth.test.ts`): 2/2 passing.
  - Error Boundary UI Components (`tests/errorBoundary.test.ts`): 4/4 passing.
  - User Profiles & Ratings (`tests/integration/user_profile_and_ratings.test.ts`): 8/8 passing.
  - Trades & Escrow Lifecycle (`tests/integration/trades_escrow.test.ts`): 12/12 passing.
  - Live Server Smoke Suite (`tests/e2e/smoke.test.ts`): 8/8 passing.
  - Toy Safety Recall Checker (`tests/unit/recall_checker.test.ts`): 4/4 passing.
  - Fiber L2 Network (`tests/fiber.test.ts`): 5/5 passing.
  - Marketplace Quality & Notifications (`tests/integration/marketplace_quality_and_notifications.test.ts`): 8/8 passing.
- **Production Build Verification**: Next.js 16.3.0 compiled all 22 static and dynamic routes cleanly in Turbopack with zero TypeScript or syntax errors (`npm run build`).
