import test from "node:test";
import assert from "node:assert/strict";
import { createTask, transitionTask } from "./task_queue.js";

test("transitions a queued task to running", () => {
  const task = createTask({ id: "ADL-001", title: "Baseline audit", kind: "audit", risk: "low" });
  assert.deepEqual(transitionTask(task, "running"), { ...task, status: "running" });
});

test("allows running to completed and running to blocked", () => {
  const task = createTask({ id: "ADL-001", title: "Baseline audit", kind: "audit", risk: "low" });
  const running = transitionTask(task, "running");
  assert.equal(transitionTask(running, "completed").status, "completed");
  assert.equal(transitionTask(running, "blocked").status, "blocked");
});

test("rejects invalid task status transitions", () => {
  const task = createTask({ id: "ADL-001", title: "Baseline audit", kind: "audit", risk: "low" });
  assert.throws(() => transitionTask(task, "completed"), /invalid task status transition/);
  assert.throws(() => transitionTask(task, "queued"), /invalid task status transition/);
});
