import test from "node:test";
import assert from "node:assert/strict";
import { verifyScopedApproval } from "./trusted_approval_verifier.js";

const now = Date.parse("2026-10-26T12:00:00.000Z");
const request = { approvalId: "APR-001", taskId: "TASK-001", proposalId: "PROP-001", action: "implement" };
const record = { ...request, approverId: "human:reviewer-1", approvedAt: "2026-10-26T11:00:00.000Z", expiresAt: "2026-10-26T13:00:00.000Z", decision: "approved" };
function host(overrides = {}) {
  return { loadApprovalRecord: async () => ({ ...record }), verifyApprover: async () => true, consumeApproval: async () => true, ...overrides };
}

test("caller status alone is not trusted authorization", async () => {
  assert.deepEqual(await verifyScopedApproval({ request, now }), { allowed: false, reason: "trusted_approval_host_not_integrated" });
});
test("accepts exact, trusted, unexpired, one-time approval", async () => {
  const r = await verifyScopedApproval({ request, trustedHost: host(), now });
  assert.equal(r.allowed, true);
  assert.equal(r.reason, "trusted_scoped_approval_verified");
  assert.equal(r.taskId, request.taskId);
  assert.equal(r.action, request.action);
});
test("rejects records whose decision is not explicitly approved", async () => {
  for (const decision of ["denied", "pending", "revoked", "", undefined]) {
    const r = await verifyScopedApproval({ request, trustedHost: host({ loadApprovalRecord: async () => {
      const value = { ...record };
      if (decision === undefined) delete value.decision;
      else value.decision = decision;
      return value;
    } }), now });
    assert.equal(r.allowed, false, String(decision));
    assert.equal(r.reason, "approval_decision_not_approved", String(decision));
  }
});
test("rejects missing record", async () => {
  const r = await verifyScopedApproval({ request, trustedHost: host({ loadApprovalRecord: async () => null }), now });
  assert.equal(r.reason, "approval_record_not_found");
});
for (const field of ["approvalId", "taskId", "proposalId", "action"]) {
  test("rejects scope mismatch: " + field, async () => {
    const r = await verifyScopedApproval({ request, trustedHost: host({ loadApprovalRecord: async () => ({ ...record, [field]: "OTHER" }) }), now });
    assert.equal(r.allowed, false);
    assert.equal(r.reason, "approval_scope_mismatch");
  });
}
test("rejects expired approval", async () => {
  const r = await verifyScopedApproval({ request, trustedHost: host({ loadApprovalRecord: async () => ({ ...record, expiresAt: "2026-10-26T11:59:59.000Z" }) }), now });
  assert.equal(r.reason, "approval_expired_or_invalid_time");
});
test("rejects future-dated approval", async () => {
  const r = await verifyScopedApproval({ request, trustedHost: host({ loadApprovalRecord: async () => ({ ...record, approvedAt: "2026-10-26T12:00:01.000Z" }) }), now });
  assert.equal(r.reason, "approval_expired_or_invalid_time");
});
test("rejects malformed records", async () => {
  const r = await verifyScopedApproval({ request, trustedHost: host({ loadApprovalRecord: async () => ({ ...record, approverId: "" }) }), now });
  assert.equal(r.reason, "approval_record_malformed");
});
test("rejects unauthorized approver", async () => {
  const r = await verifyScopedApproval({ request, trustedHost: host({ verifyApprover: async () => false }), now });
  assert.equal(r.reason, "approver_not_authorized");
});
test("rejects reused approval", async () => {
  const r = await verifyScopedApproval({ request, trustedHost: host({ consumeApproval: async () => false }), now });
  assert.equal(r.reason, "approval_already_used_or_not_consumed");
});
test("fails closed if replay guard throws", async () => {
  const r = await verifyScopedApproval({ request, trustedHost: host({ consumeApproval: async () => { throw Error("store unavailable"); } }), now });
  assert.equal(r.reason, "approval_replay_guard_failed");
});
test("fails closed if identity verification throws", async () => {
  const r = await verifyScopedApproval({ request, trustedHost: host({ verifyApprover: async () => { throw Error("identity unavailable"); } }), now });
  assert.equal(r.reason, "approver_verification_failed");
});
