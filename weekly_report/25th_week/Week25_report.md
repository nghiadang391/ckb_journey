## Builder Track Weekly Report — Week 25

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 6 November 2026  

---

## Overview

Work during **Week 25** focused on **architecting and building `ckb-whitehat` (`https://github.com/nghiadang391/ckb-whitehat`), an authorized security challenge framework, installable agent skill, and terminal CLI for CKB and Fiber Network (FNN) money products following the principle *"AI finds, the PoC proves"*, and executing two full security challenges with deterministic, replayable PoCs and on-chain CKB testnet evidence against `Dular` (M-Pesa to RUSD ramp over Fiber) and `tapfiber` (tap-to-pay order and receipt library)**.

---

## Key Achievements & Technical Milestones

### 1. `ckb-whitehat` Methodology Skill & Zero-API-Key Terminal CLI
Built a reusable security audit workflow and CLI harness that turns AI-assisted threat modeling into machine-checkable exploit and regression artifacts:
- **Installable Security Methodology Skill (`.claude/skills/ckb-whitehat/SKILL.md`)**:
  - Formalized the 8-step whitehat pipeline: isolated target cloning -> AI-assisted triage -> threat modeling of money invariants -> ranked attack hypotheses -> deterministic single-command PoCs -> mandatory on-chain/state evidence -> minimal patch verification -> `FINDINGS.md` generation.
  - Enforced strict scope and consent guardrails: zero live-service probing against deployed targets, untrusted-directory isolation (PoCs never execute inside the target repository tree), and on-chain testing confined strictly to self-owned CKB testnet addresses and local 2-node FNN stacks.
  - Documented CKB + Fiber domain rules (Lina vs. Pudge testnet faucet boundaries, outpoint-to-funding-tx derivation on FNN v0.9.1, UDT cell 32-byte big-endian `u128` layout, and FNN single-session invoice idempotency).
- **Zero-Key Terminal CLI (`cli/bin/ckb-whitehat.mjs`, `cli/package.json`)**:
  - Implemented `ckb-whitehat` (`v0.1.0`) supporting `init`, `run`, `status`, and `report` commands with `--scope app,chain` and `--agent claude|codex` flags.
  - Designed out-of-tree workspace isolation at `~/.ckb-whitehat/<target>/` (`config.json`, `poc/`, `FINDINGS.md`, `run.log`) and zero-API-key execution by delegating to the operator's authenticated local agent binary (`claude -p` or `codex exec`).

---

### 2. Target Challenge #1: `Dular` M-Pesa -> RUSD Fiber Ramp (`dular/`)
Executed a full two-layer security challenge (offline application/DB/config layer + live CKB Lina testnet / FNN v0.9.1 RUSD channel layer) against `duongja/Dular` (`dular/FINDINGS.md`, `dular/poc/`):
- **Offline App, Ledger & Config Findings (`F1`–`F9`)**:
  - **`F1` (CRITICAL, Fired — `dular/poc/f1-forged-callback.mjs`)**: Demonstrated unauthenticated legacy M-Pesa STK callbacks (`POST /api/mpesa/callback/stk`) and demo-mode callback token bypass (`rampRoutes.js`), crediting 1 RUSD (`100,000,000` base units) and triggering operator Fiber settlement with zero Daraja vendor calls.
  - **`F2` (HIGH, Fired — `dular/poc/f2-ledger-race.mjs` & `fixed-ledger.js`)**: Proved a double-spend race condition in `ledger.js debit()` (missing transaction and `SELECT ... FOR UPDATE`), where 12 concurrent 600-unit debits against a 1,000-unit balance posted 9 times (`-4,400` final balance). Shipped a verified 3-line fix in `dular/poc/fixed-ledger.js` using `withTransaction` + `FOR UPDATE` that restores the invariant (`1` debit accepted, `11` rejected, `400` remaining balance).
  - **`F3` (HIGH, Fired — `dular/poc/f3-demo-mode.mjs`)**: Proved `DEMO_MODE=true` coexisting with `MPESA_ENVIRONMENT=production` self-confirms STK deposits and B2C payouts without startup rejection.
  - **`F4`–`F9` (MEDIUM/LOW — `f4-amount-parsing.mjs`, `f5-secret-default.mjs`, `f6-pin-wallet.mjs`, `f7-cors-error-leak.mjs`, `f8f9-hygiene-supply.mjs`)**:Proved `Math.round(Number())` KES coercion flaws (`NaN`, hex `0x10`, negative values), `<0.1s` offline OTP hash brute-forcing across the `900,000` keyspace due to fallback `SESSION_SECRET`, 4-digit browser wallet PIN brute-force timing (`~3.4 min` for full `10,000` keyspace), wildcard CORS + 400 error oracle leaks, committed PII/unredacted screenshots, and pre-release `@nervosnetwork/fiber-js` keygen pinning.
- **On-Chain CKB Testnet & 2-Node FNN v0.9.1 Evidence (`C4.1`–`C4.5`)**:
  - Funded a live 10-RUSD Fiber channel (`0xcef4106e`, funding tx `0x72ed0d77...df27d3` at Lina testnet block `0x15e1b32`) across two local FNN v0.9.1 nodes (`dular/poc/c4-onchain.mjs`, `c4-openchannel2.mjs`, `c4-finalize2.mjs`, `c4-record.json`).
  - **`C4.1` (Control — GREEN)**: Settled `0.1 RUSD` honestly (`payment_hash: 0x76da2929...39f1`).
  - **`C4.2` (`F1` Forged Callback — RED)**: Proved the app-layer `F1` callback forgery causes the operator's live FNN node to release `0.5 RUSD` on-chain (`payment_hash: 0x9f22a21a...a4daba`) with zero M-Pesa funds received.
  - **`C4.3` (`F2` Double-Settle — SAFE-AT-CHAIN)**: Confirmed FNN v0.9.1 rejects duplicate concurrent `send_payment` calls on the same invoice (`Payment session already exists` after `0x864781d3...5bd14`), isolating `F2` strictly to Dular's PostgreSQL ledger.
  - **`C4.4` & `C4.5` (Invoice Guards & Auto-Accept Minimum)**: Verified attach-time-only invoice validation (`validateRampInvoice`) and live FNN RUSD `auto_accept_amount` liquidity gating.

---

### 3. Target Challenge #2: `tapfiber` Tap-to-Pay Order & Receipt Library (`tapfiber/`)
Audited `0xVida/tapfiber` (`tapfiber-core` v0.1.0) and built a single-command deterministic exploit suite (`tapfiber/poc/attack.mjs`, `tapfiber/FINDINGS.md`):
- **Order Lifecycle & Payment Binding Findings (`S1`–`S3`)**:
  - **`S1` (HIGH)**: Proved post-expiry payment confirmation succeeds when optional `event.at` is omitted in `applyEvent` (`src/order.js`), transitioning expired orders to `PAID`.
  - **`S2` (MEDIUM)**: Proved `createOrder` does not enforce `expiresAt`, accepting confirmations up to `Number.MAX_SAFE_INTEGER` (`~year 285,000`).
  - **`S3` (HIGH)**: Proved orders created without `paymentHash` skip hash verification and transition to `PAID` on any attacker-supplied `paymentHash` with matching amount/asset.
- **Cryptographic Receipt & Payload Integrity Findings (`S4`–`S7`)**:
  - **`S4` (HIGH)**: Proved `verifyReceipt(receipt)` defaults to `valid: true` when `expectedPublicKey` is omitted, allowing rogue Ed25519 keypairs to forge valid payment receipts (including via the CLI `verify` command).
  - **`S5` (MEDIUM)**: Documented 32-bit truncated SHA-256 checksum (`8` hex chars) in `payload.js` (`2^32` brute-force collision work on NFC payload tampering without merchant signature).
  - **`S6` & `S7` (LOW–MEDIUM)**: Proved `issueReceipt` omits `invoice` and `expiresAt` from the signed Ed25519 body and lacks a `nonce`/TTL, allowing a single captured receipt to verify `{"valid":true}` across unlimited replays (`3/3` replays passing).

---

## Test & PoC Verification Results

- **`tapfiber` Deterministic Exploit PoC & Unit Suite**:
  - **Attack PoC (`node tapfiber/poc/attack.mjs`)**: **7/7 security checks (`S1`–`S7`) deterministically reproduced** against unmodified `tapfiber-core` v0.1.0 source with zero network or external dependencies.
  - **Upstream Baseline Test Suite (`npm --prefix tapfiber test`)**: **6/6 unit tests passing** (`test/core.test.js`), confirming unmodified library baseline behavior alongside the PoC findings.
- **`Dular` Offline PoC Suite & On-Chain Evidence (`dular/poc/`)**:
  - **Offline PoC Harnesses (`f1` through `f8f9`)**: **9/9 findings (`6` fired dynamically, `3` confirmed structurally)** reproduced against unmodified Dular server modules, plus **12-parallel-debit regression verification** passing against `dular/poc/fixed-ledger.js`.
  - **On-Chain CKB Testnet Evidence (`dular/poc/c4-record.json`)**: **5/5 FNN v0.9.1 / Lina testnet traces (`C4.1`–`C4.5`)** recorded with verifiable on-chain transaction and payment hashes (`funding tx 0x72ed0d77...df27d3`, `9.1 + 0.9 = 10.0 RUSD` channel balance reconciliation).

