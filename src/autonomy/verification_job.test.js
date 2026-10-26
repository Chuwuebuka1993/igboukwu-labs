import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { runPinnedVerification } from "./verification_job.js";

const COMMIT = "a".repeat(40);
const REPOSITORY = "owner/repo";

async function withTempDir(run) {
  const directory = await mkdtemp(join(tmpdir(), "adl-verification-job-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function input(directory, overrides = {}) {
  const taskId = "ADL-005-TEST";
  const repository = REPOSITORY;
  const ref = "main";
  const options = {
    taskId,
    repository,
    ref,
    runId: "run-001",
    command: "npm test",
    workspaceRoot: join(directory, "workspace"),
    cwd: join(directory, "workspace", "checkout"),
    checkpointPath: join(directory, "state", "run-001.json"),
    evidencePath: join(directory, "evidence", "run-001.json"),
    authorization: {
      approved: true,
      approvalId: "approval-001",
      taskId,
      repository,
      ref,
      allowedCommands: ["npm test"],
    },
    adapter: {
      async inspectRepository() {
        return {
          repository,
          commitSha: COMMIT,
          blockers: ["ciPending"],
          ci: { status: "pending" },
          gates: { treeComplete: true },
        };
      },
    },
    runner: async ({ command }) => command === "git rev-parse HEAD"
      ? { status: "passed", exitCode: 0, stdout: COMMIT + "\n", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null }
      : { status: "passed", exitCode: 0, stdout: "44 tests passed", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null },
    now: (() => {
      let tick = 0;
      return () => new Date(Date.UTC(2026, 9, 18, 10, 0, tick++)).toISOString();
    })(),
  };
  Object.assign(options, overrides);
  if (Object.prototype.hasOwnProperty.call(overrides, "sandbox")) {
    options.sandbox = overrides.sandbox;
  } else {
    options.sandbox = {
      profileId: "test-sandbox",
      isolation: "container",
      verified: true,
      workspaceRoot: options.workspaceRoot,
      run: (args) => options.runner(args),
    };
  }
  return options;
}

test("pinned verification records the exact commit, approval, command, and content hash", async () => {
  await withTempDir(async (directory) => {
    const result = await runPinnedVerification(input(directory));
    assert.equal(result.status, "TESTS_PASSED");
    assert.equal(result.evidence.commitSha, COMMIT);
    assert.equal(result.evidence.approvalId, "approval-001");
    assert.equal(result.evidence.command, "npm test");

    const saved = JSON.parse(await readFile(join(directory, "evidence", "run-001.json"), "utf8"));
    const { artifactSha256, ...payload } = saved;
    assert.equal(artifactSha256, createHash("sha256").update(JSON.stringify(payload)).digest("hex"));
    const checkpoint = JSON.parse(await readFile(join(directory, "state", "run-001.json"), "utf8"));
    assert.equal(checkpoint.status, "completed");
    assert.equal(checkpoint.commitSha, COMMIT);
    assert.deepEqual(checkpoint.completedSteps, ["repository_inspected", "workspace_commit_verified", "verification_executed"]);
  });
});

test("workspace commit mismatch blocks verification before the requested command", async () => {
  await withTempDir(async (directory) => {
    const calls = [];
    const result = await runPinnedVerification(input(directory, {
      runner: async ({ command }) => {
        calls.push(command);
        return { status: "passed", exitCode: 0, stdout: "b".repeat(40) + "\n", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null };
      },
    }));
    assert.equal(result.status, "BLOCKED");
    assert.deepEqual(calls, ["git rev-parse HEAD"]);
    assert.equal(result.reason, "workspace_commit_mismatch");
    const checkpoint = JSON.parse(await readFile(join(directory, "state", "run-001.json"), "utf8"));
    assert.equal(checkpoint.status, "blocked");
  });
});

test("missing or mismatched approval is rejected before repository inspection", async () => {
  await withTempDir(async (directory) => {
    let inspected = false;
    const options = input(directory, {
      adapter: { async inspectRepository() { inspected = true; return { repository: REPOSITORY, commitSha: COMMIT, blockers: [] }; } },
      authorization: { approved: true, approvalId: "approval-001", taskId: "OTHER", repository: REPOSITORY, ref: "main", allowedCommands: ["npm test"] },
    });
    await assert.rejects(runPinnedVerification(options), /authorization does not match the task scope/);
    assert.equal(inspected, false);
  });
});

test("failed verification persists a failed evidence record without claiming verification", async () => {
  await withTempDir(async (directory) => {
    const result = await runPinnedVerification(input(directory, {
      runner: async ({ command }) => command === "git rev-parse HEAD"
        ? { status: "passed", exitCode: 0, stdout: COMMIT + "\n", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null }
        : { status: "failed", exitCode: 1, stdout: "", stderr: "test failed", timedOut: false, outputLimitExceeded: false, signal: null },
    }));
    assert.equal(result.status, "FAILED");
    assert.equal(result.evidence.verified, false);
    assert.equal(result.evidence.result.exitCode, 1);
    const checkpoint = JSON.parse(await readFile(join(directory, "state", "run-001.json"), "utf8"));
    assert.equal(checkpoint.status, "failed");
  });
});

test("duplicate run evidence is rejected before any command is executed", async () => {
  await withTempDir(async (directory) => {
    const options = input(directory);
    await runPinnedVerification(options);
    let commandCount = 0;
    await assert.rejects(
      runPinnedVerification({ ...options, runner: async () => { commandCount++; throw new Error("must not run"); } }),
      /already exists; reconcile the existing run before retrying/,
    );
    assert.equal(commandCount, 0);
  });
});

test("captured output redacts common GitHub token formats", async () => {
  await withTempDir(async (directory) => {
    const result = await runPinnedVerification(input(directory, {
      runner: async ({ command }) => command === "git rev-parse HEAD"
        ? { status: "passed", exitCode: 0, stdout: COMMIT + "\n", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null }
        : { status: "passed", exitCode: 0, stdout: "token=github_pat_abcdefghijklmnopqrstuvwxyz1234567890", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null },
    }));
    assert.doesNotMatch(result.evidence.result.stdout, /github_pat_abcdefghijklmnopqrstuvwxyz1234567890/);
    assert.match(result.evidence.result.stdout, /REDACTED/);
  });
});


test("verification job rejects ambiguous surrounding whitespace in command metadata", async () => {
  await withTempDir(async (directory) => {
    let inspected = false;
    const options = input(directory, {
      command: " npm test ",
      adapter: { async inspectRepository() { inspected = true; return { repository: REPOSITORY, commitSha: COMMIT, blockers: [], gates: { treeComplete: true } }; } },
    });
    await assert.rejects(runPinnedVerification(options), /command must not have surrounding whitespace/);
    assert.equal(inspected, false);
  });
});


test("verification job refuses to execute without a trusted sandbox adapter", async () => {
  await withTempDir(async (directory) => {
    let inspected = false;
    const options = input(directory, {
      sandbox: null,
      adapter: { async inspectRepository() { inspected = true; return { repository: REPOSITORY, commitSha: COMMIT, blockers: [], gates: { treeComplete: true } }; } },
    });
    await assert.rejects(runPinnedVerification(options), /trusted sandbox adapter is required/);
    assert.equal(inspected, false);
  });
});


test("overlapping verification calls cannot execute the same run twice", async () => {
  await withTempDir(async (directory) => {
    let announceInspection;
    let releaseInspection;
    const inspectionStarted = new Promise((resolve) => { announceInspection = resolve; });
    const inspectionGate = new Promise((resolve) => { releaseInspection = resolve; });
    let commandCount = 0;
    const options = input(directory, {
      adapter: {
        async inspectRepository() {
          announceInspection();
          await inspectionGate;
          return { repository: REPOSITORY, commitSha: COMMIT, blockers: [], gates: { treeComplete: true } };
        },
      },
      runner: async ({ command }) => {
        commandCount += 1;
        return command === "git rev-parse HEAD"
          ? { status: "passed", exitCode: 0, stdout: COMMIT + "\n", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null }
          : { status: "passed", exitCode: 0, stdout: "tests passed", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null };
      },
    });
    const first = runPinnedVerification(options);
    await inspectionStarted;
    await assert.rejects(runPinnedVerification(options), /run lease already exists/);
    releaseInspection();
    const result = await first;
    assert.equal(result.status, "TESTS_PASSED");
    assert.equal(commandCount, 2, "only the lease owner should run HEAD check and verification command");
  });
});


test("malformed existing checkpoint fails closed before repository inspection or execution", async () => {
  await withTempDir(async (directory) => {
    const options = input(directory);
    await (await import("node:fs/promises")).mkdir(join(directory, "state"), { recursive: true });
    await (await import("node:fs/promises")).writeFile(options.checkpointPath, "{ malformed checkpoint", "utf8");
    let inspected = false;
    let commands = 0;
    options.adapter = { async inspectRepository() { inspected = true; return { repository: REPOSITORY, commitSha: COMMIT, blockers: [], gates: { treeComplete: true } }; } };
    options.sandbox.run = async () => { commands += 1; throw new Error("must not execute"); };
    await assert.rejects(runPinnedVerification(options), /checkpoint already exists; reconcile the existing run before retrying/);
    assert.equal(inspected, false);
    assert.equal(commands, 0);
  });
});

test("evidence persistence failure marks checkpoint failed and propagates the write error", async () => {
  await withTempDir(async (directory) => {
    const options = input(directory);
    const evidenceParent = join(directory, "evidence");
    const fs = await import("node:fs/promises");
    await fs.mkdir(evidenceParent, { recursive: true });
    let commandCount = 0;
    options.sandbox.run = async ({ command }) => {
      commandCount += 1;
      if (command === "git rev-parse HEAD") {
        return { status: "passed", exitCode: 0, stdout: COMMIT + "\n", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null };
      }
      // Simulate a competing writer winning the exclusive artifact path after
      // the preflight absence check but before the evidence hard-link is created.
      await fs.writeFile(options.evidencePath, "competing artifact", { encoding: "utf8", flag: "wx" });
      return { status: "passed", exitCode: 0, stdout: "tests passed", stderr: "", timedOut: false, outputLimitExceeded: false, signal: null };
    };
    await assert.rejects(runPinnedVerification(options));
    assert.equal(commandCount, 2);
    const checkpoint = JSON.parse(await fs.readFile(options.checkpointPath, "utf8"));
    assert.equal(checkpoint.status, "failed");
    assert.equal(checkpoint.nextStep, "reconcile_evidence_write");
  });
});
