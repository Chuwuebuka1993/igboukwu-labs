import test from "node:test";
import assert from "node:assert/strict";
import { buildVerifiedDispatchDecision } from "./verified_dispatch.js";

const now = Date.parse("2026-10-26T12:00:00.000Z");
const plane = {
  task: { id: "TASK-001" }, status: "active",
  evidenceState: "TESTED", proposal: { id: "PROP-001", status: "approved" },
};
const approval = { approvalId: "APR-001", action: "implement" };
const record = {
  approvalId: "APR-001", taskId: "TASK-001", proposalId: "PROP-001", action: "implement",
  approverId: "human:reviewer-1", approvedAt: "2026-10-26T11:00:00.000Z",
  expiresAt: "2026-10-26T13:00:00.000Z", decision: "approved",
};
const trustedHost = {
  loadApprovalRecord: async () => ({ ...record }),
  verifyApprover: async () => true,
  consumeApproval: async () => true,
};

test("verified dispatch permits only after trusted scoped approval succeeds", async () => {
  const result = await buildVerifiedDispatchDecision(plane, approval, trustedHost, now);
  assert.equal(result.allowed, true);
  assert.equal(result.taskId, plane.task.id);
  assert.equal(result.proposalId, plane.proposal.id);
});

test("caller approved status alone cannot permit dispatch", async () => {
  const result = await buildVerifiedDispatchDecision(plane, approval, null, now);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "trusted_approval_host_not_integrated");
});

test("dispatch blocks proposal/task mismatch", async () => {
  const result = await buildVerifiedDispatchDecision(plane, approval, {
    ...trustedHost,
    loadApprovalRecord: async () => ({ ...record, taskId: "TASK-OTHER" }),
  }, now);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "approval_scope_mismatch");
});

test("dispatch blocks unready evidence before consuming approval", async () => {
  let consumed = false;
  const result = await buildVerifiedDispatchDecision(
    { ...plane, evidenceState: "PROPOSED" }, approval,
    { ...trustedHost, consumeApproval: async () => { consumed = true; return true; } }, now,
  );
  assert.equal(result.allowed, false);
  assert.equal(consumed, false);
});

test("dispatch requires implementation action approval", async () => {
  const result = await buildVerifiedDispatchDecision(plane, { ...approval, action: "publish_external" }, trustedHost, now);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "implementation_approval_required");
});
