import { createHash, randomUUID } from "node:crypto";
import { access, link, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { saveCheckpoint } from "./checkpoint_store.js";
import { runVerificationCommand } from "./verification_runner.js";

const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const SAFE_RUN_ID = /^[A-Za-z0-9._-]{1,100}$/;
const SUPPORTED_COMMANDS = new Set(["npm test", "npm run build", "git diff --check"]);

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(field + " is required");
  }
  if (value !== value.trim()) {
    throw new TypeError(field + " must not have surrounding whitespace");
  }
  return value;
}

function isInside(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel));
}

function redact(value) {
  return String(value ?? "")
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/(token|secret|password|api[_-]?key)(\s*[:=]\s*["']?)[^\s"'&,;]+/gi, "$1$2[REDACTED]")
    .slice(0, 64_000);
}

async function assertPathAbsent(path, label) {
  try {
    await access(path);
    throw new Error(label + " already exists; reconcile the existing run before retrying");
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists; reconcile")) throw error;
    if (error?.code !== "ENOENT") throw error;
  }
}

async function writeEvidenceExclusive(path, evidence) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = path + "." + randomUUID() + ".tmp";
  try {
    await writeFile(temporaryPath, JSON.stringify(evidence, null, 2) + "\n", {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    // Hard-link creation is exclusive: an existing run artifact is never overwritten.
    await link(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => {});
  }
}

function createEvidence(input, snapshot, status, details, startedAt, finishedAt, workspaceHeadSha) {
  const evidence = {
    schema: "ADL-VERIFICATION-EVIDENCE/v1",
    runId: input.runId,
    taskId: input.taskId,
    repository: input.repository,
    requestedRef: input.ref,
    commitSha: snapshot.commitSha,
    approvalId: input.authorization.approvalId,
    command: input.command,
    status,
    verified: false,
    startedAt,
    finishedAt,
    environment: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
    },
    workspace: {
      root: resolve(input.workspaceRoot),
      cwd: resolve(input.cwd),
      headSha: workspaceHeadSha,
    },
    inspection: {
      ci: snapshot.ci ?? null,
      blockers: Array.isArray(snapshot.blockers) ? snapshot.blockers : [],
    },
    result: details,
  };
  const artifactSha256 = createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
  return { ...evidence, artifactSha256 };
}

function checkpointFor(input, commitSha, status, nextStep, completedSteps) {
  return {
    taskId: input.taskId,
    repository: input.repository,
    commitSha,
    phase: "verification",
    status,
    completedSteps,
    nextStep,
    approval: { required: true, granted: true },
  };
}

/**
 * Runs one explicitly authorized, commit-pinned verification attempt.
 *
 * The caller must supply an isolated workspace. Path containment is only a
 * guardrail; it is not an OS sandbox and does not make repository scripts safe.
 */
export async function runPinnedVerification(input = {}) {
  const taskId = requireText(input.taskId, "taskId");
  const repository = requireText(input.repository, "repository");
  const ref = requireText(input.ref, "ref");
  const runId = requireText(input.runId, "runId");
  const command = requireText(input.command, "command");
  if (!SAFE_RUN_ID.test(runId)) throw new TypeError("runId contains unsupported characters");
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) throw new TypeError("repository must use owner/repo format");
  if (!SUPPORTED_COMMANDS.has(command)) throw new Error("command is not allowlisted for verification");
  if (typeof input.adapter?.inspectRepository !== "function") throw new TypeError("adapter.inspectRepository is required");
  if (typeof input.runner !== "undefined" && typeof input.runner !== "function") throw new TypeError("runner must be a function");
  if (typeof input.now !== "undefined" && typeof input.now !== "function") throw new TypeError("now must be a function");

  const authorization = input.authorization;
  if (!authorization || authorization.approved !== true ||
      typeof authorization.approvalId !== "string" || authorization.approvalId.trim() === "" || authorization.approvalId !== authorization.approvalId.trim() ||
      authorization.taskId !== taskId || authorization.repository !== repository ||
      authorization.ref !== ref || !Array.isArray(authorization.allowedCommands) ||
      !authorization.allowedCommands.includes(command)) {
    throw new Error("authorization does not match the task scope");
  }

  for (const field of ["workspaceRoot", "cwd", "checkpointPath", "evidencePath"]) {
    if (typeof input[field] !== "string" || !isAbsolute(input[field])) {
      throw new TypeError(field + " must be an absolute path");
    }
  }
  const workspaceRoot = resolve(input.workspaceRoot);
  const cwd = resolve(input.cwd);
  const checkpointPath = resolve(input.checkpointPath);
  const evidencePath = resolve(input.evidencePath);
  if (!isInside(workspaceRoot, cwd)) throw new Error("cwd must be inside the approved workspace");
  if (isInside(workspaceRoot, checkpointPath) || isInside(workspaceRoot, evidencePath)) {
    throw new Error("checkpoint and evidence paths must be outside the checkout workspace");
  }
  if (checkpointPath === evidencePath) throw new Error("checkpointPath and evidencePath must be different");
  await assertPathAbsent(checkpointPath, "checkpoint");
  await assertPathAbsent(evidencePath, "evidence path");

  const now = input.now ?? (() => new Date().toISOString());
  const runner = input.runner ?? runVerificationCommand;
  const startedAt = now();
  const snapshot = await input.adapter.inspectRepository({ repository, ref });
  if (snapshot?.repository !== repository || typeof snapshot.commitSha !== "string" || !SHA_PATTERN.test(snapshot.commitSha)) {
    throw new Error("repository inspection did not return the requested repository and a valid commit SHA");
  }
  if (snapshot.gates?.treeComplete !== true) throw new Error("repository inventory is not confirmed complete");

  let completedSteps = ["repository_inspected"];
  await saveCheckpoint(checkpointPath, checkpointFor(input, snapshot.commitSha, "running", "verify_workspace_commit", completedSteps));

  let headResult;
  try {
    headResult = await runner({ command: "git rev-parse HEAD", cwd, workspaceRoot });
  } catch (error) {
    headResult = { status: "failed", exitCode: null, stdout: "", stderr: redact(error?.message ?? "workspace HEAD check failed"), timedOut: false, outputLimitExceeded: false, signal: null };
  }
  const workspaceHeadSha = String(headResult?.stdout ?? "").trim();
  const headValid = headResult?.status === "passed" && headResult?.exitCode === 0 && SHA_PATTERN.test(workspaceHeadSha);
  if (!headValid || workspaceHeadSha.toLowerCase() !== snapshot.commitSha.toLowerCase()) {
    const finishedAt = now();
    const reason = headValid ? "workspace_commit_mismatch" : "workspace_head_check_failed";
    const evidence = createEvidence(input, snapshot, "BLOCKED", {
      reason,
      command: "git rev-parse HEAD",
      exitCode: headResult?.exitCode ?? null,
      stdout: redact(headResult?.stdout),
      stderr: redact(headResult?.stderr),
      timedOut: Boolean(headResult?.timedOut),
      outputLimitExceeded: Boolean(headResult?.outputLimitExceeded),
    }, startedAt, finishedAt, workspaceHeadSha || null);
    await writeEvidenceExclusive(evidencePath, evidence);
    await saveCheckpoint(checkpointPath, checkpointFor(input, snapshot.commitSha, "blocked", "reconcile_workspace", completedSteps));
    return { status: "BLOCKED", reason, evidence };
  }

  completedSteps = [...completedSteps, "workspace_commit_verified"];
  await saveCheckpoint(checkpointPath, checkpointFor(input, snapshot.commitSha, "running", "run_verification_command", completedSteps));

  let commandResult;
  try {
    commandResult = await runner({ command, cwd, workspaceRoot });
  } catch (error) {
    commandResult = { status: "failed", exitCode: null, stdout: "", stderr: redact(error?.message ?? "verification command failed to start"), timedOut: false, outputLimitExceeded: false, signal: null };
  }
  const passed = commandResult?.status === "passed" && commandResult?.exitCode === 0 &&
    !commandResult?.timedOut && !commandResult?.outputLimitExceeded;
  const status = passed ? "TESTS_PASSED" : "FAILED";
  const finishedAt = now();
  const details = {
    command,
    exitCode: Number.isInteger(commandResult?.exitCode) ? commandResult.exitCode : null,
    signal: commandResult?.signal ?? null,
    timedOut: Boolean(commandResult?.timedOut),
    outputLimitExceeded: Boolean(commandResult?.outputLimitExceeded),
    stdout: redact(commandResult?.stdout),
    stderr: redact(commandResult?.stderr),
  };
  const evidence = createEvidence(input, snapshot, status, details, startedAt, finishedAt, workspaceHeadSha);

  try {
    await writeEvidenceExclusive(evidencePath, evidence);
  } catch (error) {
    await saveCheckpoint(checkpointPath, checkpointFor(input, snapshot.commitSha, "failed", "reconcile_evidence_write", completedSteps));
    throw error;
  }
  completedSteps = [...completedSteps, "verification_executed"];
  await saveCheckpoint(checkpointPath, checkpointFor(
    input,
    snapshot.commitSha,
    passed ? "completed" : "failed",
    passed ? "done" : "inspect_failure",
    completedSteps,
  ));
  return { status, evidence };
}
