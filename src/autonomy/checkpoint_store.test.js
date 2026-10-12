import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCheckpoint, saveCheckpoint } from "./checkpoint_store.js";

async function withTempDir(run) {
  const directory = await mkdtemp(join(tmpdir(), "adl-checkpoint-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("checkpoint store persists and reloads a versioned resumable state", async () => {
  await withTempDir(async (directory) => {
    const path = join(directory, "checkpoint.json");
    const checkpoint = {
      taskId: "ADL-004-001",
      repository: "owner/repo",
      commitSha: "a".repeat(40),
      phase: "inspection",
      status: "paused",
      completedSteps: ["fetch_tree"],
      nextStep: "summarize",
      approval: { required: true, granted: false },
    };

    await saveCheckpoint(path, checkpoint);
    const loaded = await loadCheckpoint(path);

    assert.deepEqual(loaded, {
      schema: "ADL-CHECKPOINT/v1",
      revision: 1,
      ...checkpoint,
    });
  });
});

test("checkpoint store increments revisions instead of overwriting history silently", async () => {
  await withTempDir(async (directory) => {
    const path = join(directory, "checkpoint.json");
    const checkpoint = {
      taskId: "ADL-004-002",
      repository: "owner/repo",
      commitSha: "b".repeat(40),
      phase: "inspection",
      status: "paused",
      completedSteps: [],
      nextStep: "fetch_tree",
      approval: { required: true, granted: false },
    };

    const first = await saveCheckpoint(path, checkpoint);
    const second = await saveCheckpoint(path, { ...first, nextStep: "summarize" });

    assert.equal(first.revision, 1);
    assert.equal(second.revision, 2);
    assert.equal((await loadCheckpoint(path)).nextStep, "summarize");
  });
});

test("checkpoint store returns null when no checkpoint exists", async () => {
  await withTempDir(async (directory) => {
    assert.equal(await loadCheckpoint(join(directory, "missing.json")), null);
  });
});

test("checkpoint store rejects malformed checkpoint identity and status", async () => {
  await withTempDir(async (directory) => {
    const path = join(directory, "checkpoint.json");
    await assert.rejects(
      saveCheckpoint(path, { taskId: "x", repository: "owner/repo", commitSha: "bad" }),
      /40-character commit SHA/,
    );
  });
});

test("persisted checkpoint is valid JSON and never includes an approval grant by default", async () => {
  await withTempDir(async (directory) => {
    const path = join(directory, "checkpoint.json");
    const checkpoint = {
      taskId: "ADL-004-003",
      repository: "owner/repo",
      commitSha: "c".repeat(40),
      phase: "inspection",
      status: "paused",
      completedSteps: [],
      nextStep: "fetch_tree",
      approval: { required: true, granted: false },
    };

    await saveCheckpoint(path, checkpoint);
    const raw = JSON.parse(await readFile(path, "utf8"));
    assert.equal(raw.approval.granted, false);
    assert.equal(raw.schema, "ADL-CHECKPOINT/v1");
  });
});
