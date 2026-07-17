## Builder Track Weekly Report — Week 8

**Name:** Vo Duy Tuan Ngoc  
**Week Ending:** 10 July 2026  

---

### Courses & Lessons Completed

1. **Curriculum Verification & Progress Sync**  
   Conducted a comprehensive audit of all CKB Builders' Track progress. Checked all completed lesson directories (`02` through `15`) against the curriculum criteria, ensuring every simulation script, Rust script, and walkthrough document was present and verified. Updated the progress tables in the root [README.md](file:///Users/nghiadang/CKB/README.md) to mark the Advanced level as 100% completed.

2. **Fiber Network Investigation & Hackathon Planning**  
   Transited from the learning track to active participation in the Fiber Network Infrastructure Hackathon. Investigated the architectural details of the Fiber Network (CKB's Layer 2 off-chain payment channel network) and performed technical code auditing to identify key pain points for developers and operators.

---

### New Knowledge & Key Learnings (Plain English Explanations)

#### 1. Layer 2 Payment Channels & Atomic Swaps
* **The Concept:** A Layer 2 network like Fiber operates off-chain to achieve near-instant speed and negligible fees. Channels are established on CKB (L1), and subsequent payments are routed off-chain through multiple hops.
* **Atomic Nature:** Transactions are executed "atomically" (all-or-nothing). If a payment succeeds, all hops settle. If any hop fails, the locked funds are refunded automatically. There is no intermediate state where funds can be stolen.

#### 2. RPC Data Flattening Pain Point
* **The Issue:** Inside the Fiber codebase (`payment.rs`), the execution engine tracks granular error metadata using the `TlcErr` struct (containing exact `TlcErrorCode` enums and structured `TlcErrData` like failing node IDs and channel outpoints).
* **The Gap:** When this error is returned to client-side developers via the FNN JSON-RPC API, it is flattened into a simple `failed_error: Option<String>` field. The structured, per-hop details are lost at the RPC boundary, making client-side debugging difficult.

---

### Practical Progress & Verification

* **Git Organization:** Created the dedicated `fiber_hackathon/` folder to isolate all hackathon analysis from the core learning tracks. Updated `.gitignore` to track these files in version control.
* **API Validation:** Inspected the Fiber reference node codebase (`crates/fiber-lib/src/fiber/network.rs` and `crates/fiber-types/src/payment.rs`) to verify the type signatures of `SendPaymentResponse` and trace how error codes flow from internal logic to RPC endpoints.
* **Project Specifications:** Wrote a comprehensive, plain-text blueprint detailing the **Fiber Route Diagnostics** project in [project_description.md](file:///Users/nghiadang/CKB/ckb_journey/fiber_hackathon/project_description.md).
* **Local Devnet Success Demo:** Developed and ran [real_fnn_success.js](file:///Users/nghiadang/CKB/ckb_journey/fiber_hackathon/fiber_route_diagnostics/src/real_fnn_success.js) to automate peer connection, L1 channel funding, and a successful **500 CKB** off-chain payment settlement in under 1 second.
* **Public Testnet Integration:** Upgraded the local FNN binary to `v0.9.0-rc7` for public protocol compatibility. Claimed CKB from the testnet faucet to Account 10 and opened a real channel to the public Nervos bootnode, generating L1 transaction `0xe7f5f98d34cd35a35500f75b192023b33c8e932d4912184ca9026cd4b734f0a1` which is confirmed on the public CKB Testnet Explorer.

---


