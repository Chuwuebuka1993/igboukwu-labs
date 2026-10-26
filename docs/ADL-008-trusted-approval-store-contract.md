# ADL-008 — Trusted approval store integration contract

Status: **SPECIFIED / TEST-DOUBLE-VERIFIED / NOT INTEGRATED**

This contract narrows the remaining gap between the ADL-007 approval verifier and a real host. It does not authorize deployment, merging, release, or autonomous writes.

## Required host guarantees

1. **Authenticated approver identity** — derive identity from a trusted host session or cryptographically verified principal. Never trust `approverId`, `decision: "approved"`, proposal status, or role names supplied by an untrusted caller.
2. **Immutable scoped record** — persist approval ID, task ID, proposal ID, exact action, authenticated approver, approval time, expiry, and a unique record/version identifier. A change to any scope field invalidates the approval.
3. **Atomic single-use consumption** — `consumeApproval(approvalId, taskId)` must be a durable compare-and-set/transaction that returns boolean `true` for exactly one consumer and `false` thereafter. A process-local boolean or in-memory set is not sufficient across workers, restarts, or hosts.
4. **Expiry and clock policy** — use a trusted clock, bounded approval lifetime, explicit UTC timestamps, and reject future-issued, expired, or malformed records.
5. **Fail-closed errors** — storage, identity, signature, transaction, and audit failures deny the action. Never fall back to proposal status or an allow-by-default path.
6. **Auditability** — record decision ID, task/proposal/action scope, authenticated principal, outcome/reason, timestamp, and correlation ID. Do not log secrets or session tokens.
7. **Execution boundary** — after approval consumption, route the operation through the role-authorized executor and a separately enforced least-privilege sandbox. Verification returning `allowed: true` is a decision result, not permission to bypass those controls.

## Interface contract

The existing `verifyScopedApproval` expects a trusted host exposing:

- `loadApprovalRecord(approvalId)`
- `verifyApprover(record)`
- `consumeApproval(approvalId, taskId)`

The host adapter must enforce the guarantees above. The verifier's unit tests use test doubles; they do not establish that a real identity provider, durable database, transaction, audit sink, or production host exists.

## Required integration evidence before enabling writes

- Identify the actual runtime and persistent datastore; current status remains **UNKNOWN** until inspected.
- Document the authentication authority, principal binding, approval-record schema, retention, and revocation behavior.
- Demonstrate concurrent single-use consumption against the actual datastore with two independent workers/processes.
- Demonstrate replay rejection after process restart.
- Test database/network outage, transaction conflict, clock skew, expired approval, wrong principal, scope substitution, and audit sink failure.
- Verify the control-plane caller cannot fabricate a trusted host object or invoke an unguarded alternate executor path.
- Run the complete CI suite on the exact proposed commit and review the resulting diff.

Until this evidence exists, trusted approval infrastructure is **NOT INTEGRATED**, and autonomous implementation remains blocked. Human approval to continue engineering does not authorize merging or release.
