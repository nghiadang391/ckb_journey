## Builder Track Weekly Report — Week 10

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 24 July 2026  

---

## Overview

This week continued the Fiber Route Diagnostics project, shifting from the testnet experiments of Week 9 into structured development on the Ubuntu server environment. Three areas were covered: environment setup, a README audit that turned up two incorrect claims, and the start of a feature build-out.

---

## Environment Setup (Ubuntu)

The project repository ships a macOS ARM64 `fnn` binary — it fails immediately on Linux. The correct `fnn_v0.8.1-x86_64-linux-portable.tar.gz` was downloaded from the Fiber releases page and placed in `bin/`.

A second issue: the system has Node.js v12 at `/usr/bin/node`, but the project requires v18+. Node v20 was already installed via `nvm` at `/home/ngocvo/.nvm/versions/node/v20.20.2/bin/node`, but it was not on the default `PATH` in non-interactive shells. Adding `nvm use 20 --silent` to `~/.bashrc` fixed this.

Post-setup verification:

| Check | Result |
|---|---|
| `node --version` | v20.20.2 |
| `bin/fnn --version` | Fiber v0.8.1 |
| `npm install` | 390 packages, 0 vulnerabilities |
| `npm test` | 22/22 pass |
| `GET /api/payments` | Returns `[]` (no FNN node running, expected) |

---

## README Audit

The updated README from last week was validated against the actual source code before replacing `README.md`. Two discrepancies were found:

**`graph_nodes` listed as a used RPC method** — searching the entire `src/` tree confirmed it is not called anywhere. Pubkeys are resolved through `node_info`, `decode_invoice`, and `list_channels` instead.

**Failure Statistics panel described as current functionality** — the dashboard's `index.html` has two panels: a payment feed and a payment detail view. No statistics aggregation panel exists in the file.

Both were annotated as `(NOT YET IMPLEMENTED — planned)` in the README rather than removed, since they describe intended behavior. The corrected file replaced `README.md`.

---

## Architecture Refactor

Before adding new features, `server.ts` needed to be broken up. It embedded all FNN RPC calls, path construction logic, and payment polling inline, making none of it unit-testable. Four new modules were extracted:

**`src/proxy/fnnClient.ts`** — A single factory function `createFnnClient({rpcUrl, postFn?})` that centralizes all FNN JSON-RPC calls. The `postFn` parameter defaults to `axios.post` but accepts a Jest mock in tests, making every RPC path testable without a running node.

**`src/proxy/db.ts` (extended)** — Added a module-level in-memory cache so repeated reads within a single request cycle do not hit disk. The schema gained three new collections: `channel_snapshots`, `hop_failure_counts`, and `node_aliases`, with backward-compatible migration in `initDb()` for existing database files.

**`src/proxy/routing.ts`** — `getDynamicHops` was moved here and refactored from an async function that calls FNN directly into a pure function `buildApproximateHops(payerNodeId, recipientId, channels, failingNodeId?)` that takes data as arguments. Also added pure functions for later use: `findDisconnectedChannels`, `findDrainedChannels`, `suggestCircularRoutes`, `excludeChannelFromHops`.

**`src/proxy/stats.ts`** — `computePaymentStats(payments): PaymentStats` aggregates total counts, success/failure rates, average fee, total volume, and a ranked error code frequency list.

`server.ts` was refactored to use a single `fnnClient` instance and import from the new modules. No behavioral changes to the proxy.

---

## Failure Statistics Panel

The statistics panel described in the README but missing from the dashboard was implemented.

`broadcastRaw(type, payload)` was added to `ws.ts` as a general-purpose broadcast primitive. The existing `broadcastPaymentUpdate` now delegates to it. A helper `broadcastPaymentAndStats(paymentHash)` was added to `server.ts` — it fires both a `PAYMENT_UPDATE` and a `STATS_UPDATE` in one call, replacing the scattered `getPaymentWithHops + broadcastPaymentUpdate` pairs that appeared in multiple places.

`GET /api/stats` returns the `PaymentStats` object. The SDK gained a `getStats()` method.

The dashboard now shows a **Network Health Overview** panel permanently anchored to the top of the right column — six metric tiles (Total, Success Rate, Failure Rate, Succeeded, Failed, Avg Fee) plus a row of color-coded error code badges. It updates live via `STATS_UPDATE` and bootstraps from `GET /api/stats` on first WebSocket connection.

---

## Node Name Resolution

`src/proxy/nodeRegistry.ts` was added with two functions:

- `refreshNodeAliases(client)` — calls `graph_nodes`, iterates the result, and writes each `node_id → alias` pair to the database. On failure (FNN not reachable, or `graph_nodes` not supported by the running version), it logs a warning and returns without error. Raw pubkeys continue to display as before.
- `resolveAlias(pubkey, aliases)` — returns the stored alias, or the first 8 characters of the pubkey followed by `…` as fallback.

The server refreshes aliases at startup and on a 5-minute interval, broadcasting `NODE_ALIASES_UPDATED` to connected clients after each refresh. `GET /api/nodes` exposes the full alias map.

In the dashboard, the hop chain now calls `resolveAlias()` for each node circle label. When a `NODE_ALIASES_UPDATED` message arrives, the active payment detail re-renders immediately.

---

## Test Coverage

Test count grew from 22 (end of Week 9) to 88 this week. All pass. `tsc --noEmit` reports zero errors.