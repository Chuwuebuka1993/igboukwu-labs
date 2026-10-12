import test from "node:test";
import assert from "node:assert/strict";
import { inspectRepository } from "./repository_inspector.js";

const commitSha = "a".repeat(40);

test("repository inspection creates a commit-pinned inventory and reports verification gaps", () => {
  const snapshot = inspectRepository({
    repository: "owner/repo",
    commitSha,
    files: [
      "package.json",
      "src/autonomy/control_plane.js",
      "src/autonomy/control_plane.test.js",
      ".github/workflows/ci.yml",
      "docs/evidence.md",
    ],
    workflows: [{ name: "CI", status: "completed", conclusion: "success" }],
    projectState: { known_failures: [], unresolved_questions: ["Wire executor"] },
  });

  assert.equal(snapshot.repository, "owner/repo");
  assert.equal(snapshot.commitSha, commitSha);
  assert.deepEqual(snapshot.inventory.tests, ["src/autonomy/control_plane.test.js"]);
  assert.deepEqual(snapshot.inventory.workflows, [".github/workflows/ci.yml"]);
  assert.equal(snapshot.ci.status, "passed");
  assert.equal(snapshot.gates.repositoryPinned, true);
  assert.equal(snapshot.gates.knownFailuresClear, true);
  assert.equal(snapshot.gates.unresolvedQuestionsClear, false);
  assert.equal(snapshot.readyForAutonomousWrite, false);
});

test("repository inspection does not infer CI success from a missing or running workflow", () => {
  const snapshot = inspectRepository({
    repository: "owner/repo",
    commitSha,
    files: ["package.json"],
    workflows: [{ name: "CI", status: "in_progress", conclusion: null }],
    projectState: { known_failures: [], unresolved_questions: [] },
  });

  assert.equal(snapshot.ci.status, "pending");
  assert.equal(snapshot.readyForAutonomousWrite, false);
});

test("repository inspection rejects incomplete repository identity", () => {
  assert.throws(
    () => inspectRepository({ repository: "owner/repo", commitSha: "abc", files: [] }),
    /40-character commit SHA/,
  );
});

test("repository inspection treats failed workflow as a blocking failure", () => {
  const snapshot = inspectRepository({
    repository: "owner/repo",
    commitSha,
    files: ["src/index.js"],
    workflows: [{ name: "CI", status: "completed", conclusion: "failure" }],
    projectState: { known_failures: ["failing test"], unresolved_questions: [] },
  });

  assert.equal(snapshot.ci.status, "failed");
  assert.equal(snapshot.gates.knownFailuresClear, false);
  assert.equal(snapshot.readyForAutonomousWrite, false);
});
