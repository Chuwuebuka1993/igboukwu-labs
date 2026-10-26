import test from "node:test";
import assert from "node:assert/strict";
import { createTask } from "./task_queue.js";
import { runRoleAuthorizedTask } from "./authorized_processor.js";

function task() {
  return createTask({ id: "ADL-007-EXEC-001", title: "Test authorized execution", kind: "test", risk: "low" });
}

test("authorized execution calls the executor and captures result", () => {
  let calls = 0;
  const result = runRoleAuthorizedTask(task(), {
    role: "engineer", action: "write_tests", evidenceState: "TESTED", proposalStatus: "approved",
  }, { execute: () => { calls += 1; return { testsPassed: 2, testsFailed: 0, reproduction: "pass" }; } });
  assert.equal(calls, 1);
  assert.equal(result.executed, true);
  assert.equal(result.task.status, "completed");
  assert.equal(result.authorization.allowed, true);
});

test("missing approval denies before executor is called", () => {
  let calls = 0;
  const result = runRoleAuthorizedTask(task(), {
    role: "engineer", action: "write_code", evidenceState: "TESTED", proposalStatus: "awaiting_approval",
  }, { execute: () => { calls += 1; return { testsPassed: 1, testsFailed: 0 }; } });
  assert.equal(calls, 0);
  assert.equal(result.executed, false);
  assert.equal(result.run.evidenceState, "BLOCKED");
  assert.equal(result.authorization.reason, "approved_proposal_required");
});

test("unverified evidence denies implementation before executor is called", () => {
  let calls = 0;
  const result = runRoleAuthorizedTask(task(), {
    role: "engineer", action: "write_code", evidenceState: "UNVERIFIED", proposalStatus: "approved",
  }, { execute: () => { calls += 1; return { testsPassed: 1, testsFailed: 0 }; } });
  assert.equal(calls, 0);
  assert.equal(result.authorization.reason, "evidence_not_implementation_ready");
});

test("human-only release actions cannot reach the executor", () => {
  let calls = 0;
  const result = runRoleAuthorizedTask(task(), { role: "release_steward", action: "release" }, {
    execute: () => { calls += 1; return { testsPassed: 1, testsFailed: 0 }; },
  });
  assert.equal(calls, 0);
  assert.equal(result.authorization.requiresHumanApproval, true);
});

test("invalid execution function is rejected after an allowed policy decision", () => {
  assert.throws(() => runRoleAuthorizedTask(task(), {
    role: "engineer", action: "write_tests", evidenceState: "TESTED", proposalStatus: "approved",
  }), /execute must be a function/);
});
