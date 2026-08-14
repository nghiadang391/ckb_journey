## Builder Track Weekly Report — Week 13

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 14 August 2026  

---

## Overview

Work this week focused on designing, building, and securing the **ToyTrade** peer-to-peer toy exchange platform. This practical application applies on-chain escrow contracts and CKB-centric workflows directly to a Web3 retail use case. Key accomplishments include migrating backend infrastructure to SQLite with Prisma 7, deploying server-side and client-side cryptographic signature authorization using the CKB CCC SDK, establishing bilingual localization, and verifying the platform via integration test suites.

---

## Key Achievements & Technical Milestones

### 1. Cryptographic Signature Validation API Security Framework
- **CCC SDK Core Verifier Implementation:** Created `src/lib/ckb/auth.ts` to perform server-side verification using the CKB Common Chain Connector (CCC) SDK. Supports both JoyID passkey signature payloads (`ccc.verifyMessageJoyId`) and standard CKB Secp256k1 message signing (`ccc.verifyMessageCkbSecp256k1`).
- **Endpoint Guarding:** Implemented middleware protection across core write actions:
  - `POST /api/listings` (validates `create-listing:${title}:${priceFiat}`)
  - `POST /api/chat/rooms` (validates `create-room:${buyerId}:${sellerId}`)
  - `POST /api/chat/rooms/[id]/messages` (validates `send-message:${roomId}:${content}`)
- **Safe Development Mocking:** Introduced restricted non-production mock-signature checking (`mock-sig-[address]`) to enable smooth integration test passes without requiring live WebAuthn prompt actions in headless developer testing pipelines.

### 2. Client-Side Signature Coordination
- **Dynamic Address Resolution:** Integrated a database profile fetch in the Chat component to locate the buyer's public registered JoyID address at runtime.
- **Client Signature Payload Delivery:** Configured listing submission and P2P messaging controllers to generate mock signatures matching backend challenge formats, securing operations against identity spoofing.

### 3. Database Migration & Schema Compatibility
- **SQLite Database Adaptability:** Replaced PostgreSQL references with local SQLite database config using Prisma 7 and the `@prisma/adapter-libsql` driver adapter.
- **Stringified Multi-Image Storage:** Handled SQLite's limitation on native primitive arrays by adapting the schema to store listing image arrays as stringified JSON.
- **Wipe and Seed Scripts:** Rebuilt a robust seed setup using `prisma/seed.ts` to automatically populate 3 sample toy listings matched with local file system images and region tags.

### 4. Bilingual P2P User Experience & Copy Polish
- **Vietnamese/English Localization:** Designed a context-based Language Switcher. Updated generic translation outputs to authentic local trading terminology (e.g. replacing robotic translations like *"Tham chiếu thị trường"* with *"Giá tham khảo"*, and setting trade methods to clear options like *"Gặp mặt hoặc Giao hàng"*).
- **P2P Parent Chat Messaging:** Implemented full message streams with automated message polling (3s interval) to enable coordination of meetup handovers.

---

## Test Suite & Verification Results

- **Unit and Integration Test Suite**: 8 out of 8 tests passing successfully (`npx jest`) across 4 modules:
  - `tests/auth.test.ts`: Cryptographic validator checks (validating both valid and invalid signature flows).
  - `tests/api.test.ts`: Prisma model write/read schema validation checks.
  - `tests/escrow.test.ts`: Escrow lock contract transaction validation tests.
  - `tests/spore.test.ts`: Spore DOB passport transaction builder validation tests.
- **TypeScript Compilation**: Compiled cleanly with zero errors (`tsc --noEmit`).
