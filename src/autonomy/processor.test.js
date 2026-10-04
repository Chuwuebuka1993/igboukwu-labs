import test from "node:test";
import assert from "node:assert/strict";
import { createTask } from "./task_queue.js";
import { runControlledTask } from "./processor.js";

test("processor executes an allowed local task and captures evidence", () => {
  const task = createTask({
    id: "ADL-EXEC-001",
    title: "Run deterministic local benchmark",
    kind: "test",
    risk: "low",
  });

  const result = runControlledTask(task, {
    execute: () => ({ testsPassed: 1, testsFailed: 0, reproduction: "PASS" }),
  });

  assert.equal(result.task.status, "completed");
  assert.equal(result.run.testsPassed, 1);
  assert.equal(result.run.testsFailed, 0);
  assert.equal(result.run.evidenceState, "TESTED");
  assert.equal(result.run.verified, false);
});

test("processor blocks a task when execution throws", () => {
  const task = createTask({
    id: "ADL-EXEC-002",
    title: "Failing controlled task",
    kind: "test",
    risk: "low",
  });

  const result = runControlledTask(task, {
    execute: () => {
      throw new Error("controlled failure");
    },
  });

  assert.equal(result.task.status, "blocked");
  assert.equal(result.run.testsPassed, 0);
  assert.equal(result.run.testsFailed, 1);
  assert.equal(result.run.evidenceState, "FAILED");
  assert.equal(result.run.verified, false);
});
