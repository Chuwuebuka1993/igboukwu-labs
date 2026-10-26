# ADL-009 — Approval decision-state enforcement and runtime boundary audit

Status: **IMPLEMENTED IN TESTS / PENDING CI / NO PRODUCTION AUTHORITY**

## Finding addressed

The ADL-007 verifier required identity, scope, time, and single-use checks but did not itself require the persisted record's `decision` to equal `approved`. That left the contract dependent on the host's `verifyApprover` implementation to reject pending, denied, or revoked records. ADL-009 makes this invariant explicit in the verifier itself.

## Runtime inventory finding

The repository tree at the ADL-007 base contains the React/Vite client, autonomy modules, and Node test suite. The inspected tree does not show a server entrypoint, authentication provider adapter, or database driver/schema for approval records. This is a bounded repository-tree observation, not proof that no external backend exists. Production identity authority and durable datastore remain **UNKNOWN / NOT INTEGRATED**.

## Security boundary

A browser/client-supplied callback or object cannot establish trusted identity merely by returning `true`. Any approval verifier used for production writes must execute in a trusted server-side boundary that authenticates the principal, retrieves the persisted approval, checks its decision and exact scope, and atomically consumes it in durable storage. The current UI repository must not be treated as that authority.

## Gate before enabling writes

- Identify and inspect the real backend repository/service.
- Integrate authenticated principal validation with the actual approval record store.
- Enforce `decision === "approved"`, expiry, scope, revocation, and durable atomic single-use consumption server-side.
- Verify no alternate executor path bypasses the guard.
- Run independent-process replay tests against the actual database and test outage/restart behavior.
- Keep merge/release/publish and cultural-semantic approval human-only.
