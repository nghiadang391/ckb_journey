## Builder Track Weekly Report — Week 12

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 7 August 2026  

---

## Overview

Work this week focused on verifying the expanded **Fiber Route Diagnostics** tool, executing live integration tests on macOS with Fiber Node `v0.8.1`, resolving environment and schema compatibility risks, testing advanced UI features (Pre-Flight Route Check, Payment Probing, and Fee Simulation), and preparing deployment environment guides for Ubuntu Linux servers.

---

## Key Achievements & Technical Milestones

### 1. Environment & Fiber v0.8.1 Compatibility Verification
- **Binary Architecture Update:** Updated the local FNN binaries to the official Fiber `v0.8.1` macOS ARM64 release (`Mach-O 64-bit executable arm64`).
- **RPC Shape Probing & Schema Alignment:** Created `src/probe_rpc_shapes.js` to probe live JSON-RPC outputs from `v0.8.1`. Identified that `graph_channels` returns nested `update_info_of_node1` and `update_info_of_node2` objects containing `fee_rate`. Updated `GraphChannelInfo` in `fnnClient.ts` and fee rate calculation logic in `feeSimulator.ts` accordingly.
- **Database Store Cleaning:** Diagnosed and fixed FNN startup timeouts caused by stale RocksDB schema files (`Current database version [20260618120000] vs latest db version [20260302100001]`). Cleared obsolete RocksDB store directories to ensure clean node initialization.

### 2. Live Verification of Extended Diagnostic Features
- **Pre-Flight Route Check (`/api/payments/dry-run`)**: Verified dry-run route simulations from the Web UI. Confirmed that local capacity failures (such as `InsufficientLocalBalance`) are trapped and explained with actionable suggestions before any TLC is dispatched to the network.
- **Payment Probing (`/api/payments/probe`)**: Tested live probing with 32-byte random payment hashes. Enhanced `classifyProbeResult()` in `prober.ts` to recognize FNN's destination rejection pattern (`"payment_hash does not match the invoice"`), accurately classifying live paths as `ROUTE_VIABLE` with millisecond latency metrics.
- **Fee Simulation (`/api/payments/estimate-fees`)**: Verified multi-candidate route cost estimation (PPM fee rates converted to CKB shannons) with confidence indicators (`graph_data` vs `approximated`).
- **Channel & Peer Health Monitoring**: Verified live periodic polling of channel balance ratios and peer connectivity states in the dedicated "Channel Health" dashboard tab.

### 3. Documentation & Deployment Preparation
- **Ubuntu Server Setup Guide (`UBUNTU_SETUP.txt`)**: Authored a comprehensive deployment guide detailing APT system dependencies, Node.js v20 LTS runtime requirements, Linux x86_64 FNN binary substitution, firewall port configuration (`9227`, `8227`, `8228`), and daemon startup steps.
- **Vercel Demo History Sync**: Synchronized real payment diagnostic records from `diagnostics_db.json` into `src/dashboard/history.json` to ensure the hosted Vercel preview reflects up-to-date network statistics and error classifications.
- **System Port & Link Alignment**: Performed a repository-wide audit to eliminate outdated port references (updating remaining `9228` logs to `9227`).

---

## Test Suite & Verification Results

- **Unit Test Suite**: `134 / 134` tests passing across 11 test modules (`npm test`).
- **TypeScript Build**: Zero compilation errors (`tsc`).
- **Integration Test Execution**: `real_fnn_error_scenarios.js` successfully executed live error scenarios (`ExpiryTooSoon`, `HoldTlcTimeout`, `InsufficientLocalBalance`) against a multi-node FNN cluster.


