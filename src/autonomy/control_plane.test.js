import test from "node:test";
import assert from "node:assert/strict";
import { createControlPlane, planNextAction, recordResult } from "./control_plane.js";

test("control plane selects research before implementation when evidence is missing", () => {
  const plane = createControlPlane({
    task: { id: "TASK-001", title: "Determine whether claim is established", kind: "research", risk: "low" },
    evidenceState: "UNKNOWN",
  });

  const action = planNextAction(plane);

  assert.equal(action.type, "research");
  assert.equal(action.requiresApproval, false);
});

test("control plane stops at proposal approval boundary", () => {
  const plane = createControlPlane({
    task: { id: "TASK-002", title: "Implement approved finding", kind: "build", risk: "medium" },
    evidenceState: "SUPPORTING",
    proposal: { id: "PROP-002", status: "awaiting_approval" },
  });

  const action = planNextAction(plane);

  assert.equal(action.type, "await_approval");
  assert.equal(action.requiresApproval, true);
});

test("approved proposal advances to implementation", () => {
  const plane = createControlPlane({
    task: { id: "TASK-003", title: "Implement finding", kind: "build", risk: "medium" },
    evidenceState: "FORMALLY_ESTABLISHED",
    proposal: { id: "PROP-003", status: "approved" },
  });

  const action = planNextAction(plane);

  assert.equal(action.type, "implement");
  assert.equal(action.requiresApproval, false);
});

test("failed implementation schedules diagnosis and repair without claiming verification", () => {
  const plane = createControlPlane({
    task: { id: "TASK-004", title: "Build feature", kind: "build", risk: "medium" },
    evidenceState: "FORMALLY_ESTABLISHED",
    proposal: { id: "PROP-004", status: "approved" },
  });

  const next = recordResult(plane, { status: "failed", error: "test failure" });

  assert.equal(next.status, "repair_required");
  assert.equal(next.verified, false);
  assert.equal(next.nextAction.type, "diagnose_and_repair");
});

test("successful tested implementation becomes PR-ready but not merged", () => {
  const plane = createControlPlane({
    task: { id: "TASK-005", title: "Build feature", kind: "build", risk: "medium" },
    evidenceState: "FORMALLY_ESTABLISHED",
    proposal: { id: "PROP-005", status: "approved" },
  });

  const next = recordResult(plane, { status: "passed", testsPassed: 5, testsFailed: 0 });

  assert.equal(next.status, "pr_ready");
  assert.equal(next.verified, false);
  assert.equal(next.nextAction.type, "open_pr");
  assert.equal(next.humanMergeRequired, true);
});