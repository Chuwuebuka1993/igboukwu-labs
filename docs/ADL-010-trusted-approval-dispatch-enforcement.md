# ADL-010 — Trusted approval enforcement at dispatch

Status: **IMPLEMENTED ON BRANCH / CI VERIFICATION PENDING / PRODUCTION HOST NOT INTEGRATED**

## Change

`dispatchPlannedAction` no longer accepts a caller-provided `approvalVerifier` callback as proof of approval. It requires an approval ID and delegates verification to `verifyScopedApproval`, which requires a trusted host adapter to load the persisted record, verify the approver, and atomically consume the scoped approval.

The request scope is constructed from the control plane's task and proposal plus the exact `write_code` action. The caller cannot choose a different task/proposal scope through the approval request. Missing host, non-approved decision, scope mismatch, expiry, identity failure, or replay-consumption failure must deny dispatch before the executor is called.

## Regression coverage

`control_plane_secure_dispatch.test.js` covers:
- legacy callback-only approval attempts fail closed;
- pending stored decisions do not execute;
- failed single-use consumption does not execute;
- a successful trusted-host test double permits the scoped execution path.

## Evidence boundary

These tests validate application control flow against a test double. They do **not** prove that the host adapter is server-side, authenticated, durable, atomic across independent processes, or connected to a production database. Repository inspection has not established a real approval backend. Production writes remain **BLOCKED / NOT INTEGRATED** until the actual host and durable store are identified and independently tested.

## Remaining integration gates

1. Identify the real server runtime, authentication authority, database and audit sink.
2. Ensure the trusted host object is constructed only inside that server boundary, not accepted from a browser/client request.
3. Run concurrency and restart/replay tests against the real database from independent workers.
4. Test outage, transaction conflict, clock skew, revocation, wrong principal, and audit failure.
5. Audit all alternate executor paths and run the complete CI suite on the exact commit.
6. Keep merge, release, external publication, and culturally normative Afa approval human-only.
