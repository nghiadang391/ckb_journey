## Builder Track Weekly Report — Week 16

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 4 September 2026  

---

## Overview

Work during **Week 16** focused on **CKB Storage Economics integration, Spore DOB on-chain lifecycle architecture, fiat-friendly embedded fee modeling, and marketplace UI transparency enhancements**.

Key achievements include designing and implementing the economic model for CKB Cell storage (distinguishing initial minting vs. subsequent resales), calculating exact on-chain capacity requirements for Spore DOB cells (~244 CKB), building an educational "Why CKB?" showcase on the homepage, introducing transparent storage fee badges across listing and creation workflows, and ensuring complete bilingual (English & Vietnamese) support.

---

## Key Achievements & Technical Milestones

### 1. CKB Storage Economics & Spore DOB Capacity Engineering
- **Cell Capacity Decomposition**: Analyzed the exact byte requirements for on-chain Spore DOB passports based on CKB's Cell Model (1 CKB = 1 Byte):
  - Base Cell Overhead (Capacity 8B + Lock Script 33B + Type Script 65B): ~106 bytes
  - Spore Molecule Container & `contentType` (`application/json`): ~24 bytes
  - JSON Passport Metadata (name, condition, category, origin, timestamps): ~100–130 bytes
  - **Total Capacity Required**: **~230–260 CKB (~244 CKB average)** locked directly in the cell.
- **Embedded Storage Fee Model**: Addressed how non-crypto fiat users interact with CKB storage:
  - Standardized an embedded storage fee (~₫30,000 / ~£1.00 at ~$0.005/CKB) built into the toy's initial sale price.
  - Zero wallet friction for everyday parents trading toys: users pay in fiat while the platform manages capacity backing seamlessly.

### 2. Spore DOB Lifecycle Management (First Sale vs. Resale)
- **Architectural Distinction**: Formulated and documented the lifecycle difference between first-time toy registration and subsequent peer-to-peer trades:
  - **First Sale (Genesis)**: Mints a new Spore DOB cell via `createSpore()`, locking ~244 CKB and funding the passport storage.
  - **Subsequent Resales**: Executes `transferSpore()` by updating the cell's lock script to the new buyer. Requires **0 additional CKB locked** and charges **₫0 passport fee** (with trivial transfer transaction gas < 0.001 CKB).
  - **Retirement / Reclamation**: Clarified the recoverable nature of CKB storage—if a passport cell is ever retired, the 244 CKB locked capacity is 100% refunded to the owner.

### 3. UI/UX & Transparency Implementation
- **"Why Nervos CKB?" Educational Showcase (`page.tsx`)**: Built a dedicated section explaining CKB's core advantages to mainstream users:
  - 💾 **Storage = Real Ownership**: 1 CKB = 1 Byte permanent on-chain storage, contrasting with fragile off-chain URL pointers typical in legacy NFTs.
  - 🔄 **Mint Once, Trade Forever**: Clarifies that the 244 CKB capacity is funded only on initial creation, enabling free transfers on all subsequent trades.
  - ♻️ **100% Recoverable Asset**: Highlights that capacity is stored wealth rather than burned gas fees.
- **Marketplace Listing Badges (`listings/page.tsx`)**:
  - Initial listings display a subtle `📦 Includes on-chain passport` badge with capacity tag (`244 CKB`) and informative hover tooltips.
  - Resales display a `✨ Verified Passport (₫0 mint fee)` badge, demonstrating real lifecycle benefits.
- **Create Listing Transparency Card (`listings/create/page.tsx`)**:
  - Integrated an interactive fee breakdown directly under the price inputs, informing sellers of the 244 CKB storage allocation.
- **Enhanced Passport Modal (`ToyPassportModal.tsx`)**:
  - Added live on-chain backing indicators: `CKB Storage Backing: 244 CKB` and `Storage Lifecycle: Permanent • 100% Recoverable`.
- **Bilingual Localization (`LanguageContext.tsx`)**:
  - Added full English and Vietnamese localization for all educational cards, tooltips, and fee badges.
- **Branded 404 & UI Resilience (`not-found.tsx`)**:
  - Deployed a custom branded 404 page and resolved passport modal hash wrapping on narrow mobile screens.

---

## Test Suite & Verification Results

- **Production Build Verification**: Ran `npm run build` with Next.js Turbopack — all 19 app routes compiled and statically optimized with **zero TypeScript or linting errors**.
- **Automated Test Suite**: Maintained **100% pass rate (27/27 tests)** across API, escrow contract logic, Fiber Network payment flows, Spore builders, and error boundaries.
