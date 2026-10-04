import test from "node:test";
import assert from "node:assert/strict";
import { executeRepositoryTask } from "./repository_runner.js";

test("repository runner executes only bounded audit/test tasks", () => {
  const result = executeRepositoryTask({
    task: { id: "ADL-002", kind: "test" },
    cloneRepository: (workspace) => {
      assert.ok(workspace.includes("afa-adl-"));
      throw new Error("test clone sandbox");
    },
  });

  assert.equal(result.taskId, "ADL-002");
  assert.equal(result.evidenceState, "FAILED");
  assert.equal(result.verified, false);
});

test("repository runner rejects build tasks before execution", () => {
  assert.throws(
    () => executeRepositoryTask({
      task: { id: "ADL-003", kind: "build" },
      cloneRepository: () => {},
    }),
    /bounded audit\/test tasks/
  );
});
