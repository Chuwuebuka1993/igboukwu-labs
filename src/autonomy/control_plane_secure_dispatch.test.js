import test from "node:test";
import assert from "node:assert/strict";
import { createControlPlane, dispatchPlannedAction } from "./control_plane.js";

const now = Date.parse("2026-10-26T12:00:00.000Z");
const plane = () => createControlPlane({
  task: { id: "TASK-DISPATCH-010", title: "Implement approved code change", kind: "build", risk: "medium" },
  evidenceState: "IMPLEMENTED",
  proposal: { id: "PROP-DISPATCH-010", status: "approved" },
});
const approvalRecord = {
  approvalId: "APR-DISPATCH-010",
  taskId: "TASK-DISPATCH-010",
  proposalId: "PROP-DISPATCH-010",
  action: "write_code",
  approverId: "human:reviewer-1",
  approvedAt: "2026-10-26T11:00:00.000Z",
  expiresAt: "2026-10-26T13:00:00.000Z",
  decision: "approved",
};
const host = (overrides = {}) => ({
  loadApprovalRecord: async () => ({ ...approvalRecord }),
  verifyApprover: async () => true,
  consumeApproval: async () => true,
  ...overrides,
});
const policy = { role: "engineer", action: "write_code", evidenceState: "IMPLEMENTED", proposalStatus: "approved" };

test("dispatch does not accept a caller-supplied approvalVerifier callback", async () => {
  let executions = 0;
  const result = await dispatchPlannedAction(plane(), {
    policy, approvalId: approvalRecord.approvalId,
    approvalVerifier: () => true,
    execute: () => { executions += 1; return { testsPassed: 1, testsFailed: 0 }; },
    now,
  });
  assert.equal(result.dispatched, false);
  assert.equal(result.reason, "trusted_approval_host_not_integrated");
  assert.equal(executions, 0);
});

test("dispatch denies when persisted decision is not approved and never executes", async () => {
  let executions = 0;
  const result = await dispatchPlannedAction(plane(), {
    policy, approvalId: approvalRecord.approvalId,
    trustedHost: host({ loadApprovalRecord: async () => ({ ...approvalRecord, decision: "pending" }) }),
    execute: () => { executions += 1; return { testsPassed: 1, testsFailed: 0 }; },
    now,
  });
  assert.equal(result.dispatched, false);
  assert.equal(result.reason, "approval_decision_not_approved");
  assert.equal(executions, 0);
});

test("dispatch denies when durable single-use consumption fails and never executes", async () => {
  let executions = 0;
  const result = await dispatchPlannedAction(plane(), {
    policy, approvalId: approvalRecord.approvalId,
    trustedHost: host({ consumeApproval: async () => false }),
    execute: () => { executions += 1; return { testsPassed: 1, testsFailed: 0 }; },
    now,
  });
  assert.equal(result.dispatched, false);
  assert.equal(result.reason, "approval_already_used_or_not_consumed");
  assert.equal(executions, 0);
});

test("dispatch proceeds only after trusted scoped approval verification", async () => {
  let executions = 0;
  const result = await dispatchPlannedAction(plane(), {
    policy, approvalId: approvalRecord.approvalId, trustedHost: host(),
    execute: () => { executions += 1; return { testsPassed: 2, testsFailed: 0, reproduction: "controlled-test" }; },
    now,
  });
  assert.equal(result.dispatched, true);
  assert.equal(result.result.executed, true);
  assert.equal(executions, 1);
});


test("control plane initializes dispatch tasks in the queued state", () => {
  assert.equal(plane().task.status, "queued");
});

test("role-policy denial occurs before a single-use approval is consumed", async () => {
  let consumes = 0;
  let executions = 0;
  const result = await dispatchPlannedAction(plane(), {
    policy: { role: "researcher", action: "write_code", evidenceState: "IMPLEMENTED", proposalStatus: "approved" },
    approvalId: approvalRecord.approvalId,
    trustedHost: host({ consumeApproval: async () => { consumes += 1; return true; } }),
    execute: () => { executions += 1; return { testsPassed: 1, testsFailed: 0 }; },
    now,
  });
  assert.equal(result.dispatched, false);
  assert.equal(result.reason, "role_scope_denied");
  assert.equal(consumes, 0);
  assert.equal(executions, 0);
});
