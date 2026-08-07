## Builder Track Weekly Report — Week 11

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 31 July 2026  

---

## Overview

Work this week picked up mid-way through Phase 9 (fee simulation), then moved into cleanup: repository hygiene around what gets committed, and a full audit and rewrite of the README to match the code.

---

## Recovering Phase 9 After the Outage

The fee simulation module, `src/proxy/feeSimulator.ts`, and its test file were already complete and passing on their own — eleven tests covering both `estimateRouteFees` (pure fee scoring across candidate routes) and `getCandidateRoutes` (BFS over `graph_channels`, falling back to the single approximate hop when the graph is unsupported or empty).

The break was in `server.ts`: a call to `estimateFeesForInvoice(invoice)` had been added inside the dry-run handler, but the function itself was never written before the outage. `tsc --noEmit` caught it immediately:

```
src/proxy/server.ts(185,31): error TS2304: Cannot find name 'estimateFeesForInvoice'.
```

The helper was added — it resolves the recipient pubkey and amount from the invoice, asks `feeSimulator.ts` for up to three candidate routes, pulls `graph_channels` for fee-rate data (falling back gracefully if the RPC is unavailable), and scores each route. `POST /api/payments/estimate-fees` was wired up as its own endpoint, and the dry-run response was extended to carry the same fee estimate.

On the dashboard side, a Fee Estimate card was added under the route simulation result: one row per candidate route showing the fee in CKB and a confidence badge (`graph_data` when every hop resolved against real graph data, `approximated` otherwise).

With that in place, `tsc --noEmit` came back clean and the full suite passed: 134 tests across 11 files, up from 88 at the end of Week 10.

---

## Repository Hygiene

A few files that should never have been tracked were cleaned up

Each was added to `.gitignore` and removed from version control with `git rm --cached`, which drops them from future commits while leaving the files on disk untouched.

---

## README Audit and Rewrite

The README had drifted well behind the codebase — several sections still described features under "Future Work" or "NOT YET IMPLEMENTED" that had shipped over the preceding phases.

---

## Test Coverage

Test count grew from 88 (end of Week 10) to 134 this week, all passing. `tsc --noEmit` reports zero errors.

