import test from "node:test";
import assert from "node:assert/strict";
import { createTask, nextTask, summarizeRun } from "./task_queue.js";

test("creates a queued task with deterministic identity", () => {
  const task = createTask({
    id: "ADL-001",
    title: "Reproduce and audit the current Afa-language baseline",
    kind: "audit",
    risk: "low",
  });
  assert.deepEqual(task, {
    id: "ADL-001",
    title: "Reproduce and audit the current Afa-language baseline",
    kind: "audit",
    risk: "low",
    status: "queued",
  });
});

test("selects the highest-priority queued task without mutating the queue", () => {
  const queue = [
    createTask({ id: "ADL-002", title: "Differential conformance", kind: "test", risk: "medium" }),
    createTask({ id: "ADL-001", title: "Baseline audit", kind: "audit", risk: "low" }),
  ];
  const next = nextTask(queue);
  assert.equal(next.id, "ADL-001");
  assert.equal(queue[0].status, "queued");
});

test("summarizes a run without claiming verification", () => {
  const result = summarizeRun({
    taskId: "ADL-001",
    testsPassed: 8,
    testsFailed: 0,
    reproduction: "PASS",
    evidenceState: "TESTED",
  });
  assert.deepEqual(result, {
    taskId: "ADL-001",
    testsPassed: 8,
    testsFailed: 0,
    reproduction: "PASS",
    evidenceState: "TESTED",
    verified: false,
  });
});
