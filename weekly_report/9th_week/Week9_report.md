## Builder Track Weekly Report — Week 9

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 17 July 2026  

---

### Courses & Lessons Completed

1. **Fiber Route Diagnostics — Code & Architecture Audit**  
   Conducted a detailed code audit of our hackathon codebase to detect edge cases, naming mismatches, and double-spend/reconciliation vulnerabilities before submission.
   
2. **Integration Test Suite Construction & Automation**  
   Designed and automated simulation routines to test multiple failure scenarios directly on running testnet nodes, replacing mock frameworks with real FNN binary node processes.

3. **Production Deployment & Repository Restructuring**  
   Organized the project to exist as a standalone repository, established custom git-ignore guidelines for compiled binaries and databases, and prepared a static fallback pipeline for cloud hosting on Vercel.

---

### New Knowledge & Key Learnings (Plain English Explanations)

#### 1. FNN RPC Parameter Constraints
* **The Concept:** FNN node APIs require all integer arguments (amounts, block expiries, and delta increments) to be sent as strict `0x`-prefixed hex strings rather than standard integer strings.
* **The Fix:** Discovered this behavior during integration tests where FNN rejected invoices with integer expirations. Updated our invoice builder to perform hex conversions across all transaction parameter schemas.

#### 2. SDK vs. Proxy Reconciliation Windows
* **The Concept:** If a client SDK stops waiting for a payment (times out) before the proxy's polling cycle terminates, a transaction might settle in the background after the user has been told it failed.
* **The Fix:** Synchronized the SDK's timeout window to 95 seconds, comfortably exceeding the proxy's 90-second polling boundary to ensure there is no state mismatch between what the user sees and what actually happens on-chain.

#### 3. Static JSON Fallback for Cloud Hosting
* **The Concept:** Web hosting platforms like Vercel and Netlify are static environments that cannot run Node/Express backend servers or hold active WebSocket links directly.
* **The Fix:** Implemented a pre-compiled telemetry exporter that outputs current payment history to `history.json`. Added a fallback in `index.html` to load this static file if WebSockets fail, allowing the dashboard UI to remain fully browsable online even when local FNN nodes are offline.

---

### Practical Progress & Verification

* **Audit Fixes Implemented:**
  * **Case-Sensitivity:** Replaced strict index lookup with a case-insensitive `.findIndex()` comparison for node public keys.
  * **Hop Telemetry:** Extracted `failingNodeId` and passed it dynamically to `getDynamicHops()` to fix the missing node link in path graphs.
  * **Visual Error Graph:** Resolved the bug where failed payments showed all-green success hops.
* **Expanded Parser & Unit Tests:** Added 16 new test cases (bringing the total to 22 tests) to verify CLTV expiries, tiny HTLC limits, and real FNN expired invoice validation errors. All tests pass successfully.
* **Refined Integration Scenarios (`real_fnn_error_scenarios.js`):** Script now automatically boots the testnet nodes A, B, and D, sets up peer connections, and triggers:
  * **Scenario A:** `NoRouteFound` (breaks path topology by terminating bridge Node B).
  * **Scenario B:** `ExpiryTooSoon` (sends a payment to an invoice that expired 5s prior).
  * **Scenario C:** `HoldTlcTimeout` (terminates recipient Node D mid-routing to hang TLC settlement).
  * **Scenario D:** `AmountBelowMinimum` (routes 1 Shannon to check intermediate forwarding thresholds).
* **Hosted & Pushed:** Pushed the cleaned repository directly to the new Github repository: `https://github.com/nghiadang391/Fiber-Route-Diagnostics` and deployed the live dashboard at: `https://fiber-route-diagnostics.vercel.app/`.
