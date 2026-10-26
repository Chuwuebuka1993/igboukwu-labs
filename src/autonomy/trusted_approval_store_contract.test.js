import test from "node:test";
import assert from "node:assert/strict";
import { verifyScopedApproval } from "./trusted_approval_verifier.js";

const now = Date.parse("2026-10-26T12:00:00.000Z");
const request = { approvalId: "APR-RACE", taskId: "TASK-RACE", proposalId: "PROP-RACE", action: "implement" };
const record = {
  ...request, approverId: "human:reviewer-1",
  approvedAt: "2026-10-26T11:00:00.000Z",
  expiresAt: "2026-10-26T13:00:00.000Z", decision: "approved",
};

test("concurrent verification permits at most one consumer when host consume is atomic", async () => {
  // This models the required host contract, not a production persistence adapter.
  let consumed = false;
  let consumeCalls = 0;
  const trustedHost = {
    loadApprovalRecord: async () => ({ ...record }),
    verifyApprover: async () => true,
    consumeApproval: async (approvalId, taskId) => {
      consumeCalls += 1;
      assert.equal(approvalId, request.approvalId);
      assert.equal(taskId, request.taskId);
      if (consumed) return false;
      consumed = true; // atomic compare-and-set in this deterministic test double
      return true;
    },
  };

  const results = await Promise.all([
    verifyScopedApproval({ request, trustedHost, now }),
    verifyScopedApproval({ request, trustedHost, now }),
  ]);
  assert.equal(consumeCalls, 2);
  assert.equal(results.filter((r) => r.allowed).length, 1);
  assert.equal(results.filter((r) => !r.allowed).length, 1);
});

test("a host cannot claim one-time consumption when it returns a non-boolean result", async () => {
  const trustedHost = {
    loadApprovalRecord: async () => ({ ...record }),
    verifyApprover: async () => true,
    consumeApproval: async () => ({ consumed: true }),
  };
  const result = await verifyScopedApproval({ request, trustedHost, now });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "approval_already_used_or_not_consumed");
});
