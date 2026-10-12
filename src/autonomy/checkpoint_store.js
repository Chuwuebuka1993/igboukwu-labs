import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const SCHEMA = "ADL-CHECKPOINT/v1";
const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const STATUSES = new Set(["queued", "running", "paused", "blocked", "failed", "completed"]);

function validateCheckpoint(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("checkpoint must be an object");
  }
  for (const field of ["taskId", "repository", "commitSha", "phase", "status", "nextStep"]) {
    if (typeof value[field] !== "string" || value[field].trim() === "") {
      throw new TypeError(`checkpoint ${field} is required`);
    }
  }
  if (!/^[^/\s]+\/[^/\s]+$/.test(value.repository)) {
    throw new TypeError("repository must use owner/repo format");
  }
  if (!SHA_PATTERN.test(value.commitSha)) {
    throw new TypeError("commitSha must be a 40-character commit SHA");
  }
  if (!STATUSES.has(value.status)) {
    throw new RangeError("checkpoint status is invalid");
  }
  if (!Array.isArray(value.completedSteps) || value.completedSteps.some((step) => typeof step !== "string")) {
    throw new TypeError("completedSteps must be an array of strings");
  }
  if (!value.approval || typeof value.approval.required !== "boolean" || typeof value.approval.granted !== "boolean") {
    throw new TypeError("approval must explicitly define required and granted booleans");
  }
  if (value.approval.required && value.approval.granted !== true && value.status === "running" && value.phase === "implementation") {
    throw new Error("implementation cannot run without explicit approval");
  }
}

/**
 * Loads a durable checkpoint. Missing state is distinct from malformed state:
 * missing returns null; malformed JSON or invalid schema throws.
 */
export async function loadCheckpoint(path) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }

  const checkpoint = JSON.parse(raw);
  if (checkpoint?.schema !== SCHEMA || !Number.isInteger(checkpoint.revision) || checkpoint.revision < 1) {
    throw new Error("checkpoint schema or revision is invalid");
  }
  validateCheckpoint(checkpoint);
  return checkpoint;
}

/**
 * Writes through a same-directory temporary file followed by atomic rename.
 * Revision is assigned by the store; caller-supplied revision values are ignored.
 */
export async function saveCheckpoint(path, input) {
  validateCheckpoint(input);
  await mkdir(dirname(path), { recursive: true });

  const current = await loadCheckpoint(path);
  const checkpoint = {
    schema: SCHEMA,
    revision: (current?.revision ?? 0) + 1,
    taskId: input.taskId,
    repository: input.repository,
    commitSha: input.commitSha,
    phase: input.phase,
    status: input.status,
    completedSteps: [...input.completedSteps],
    nextStep: input.nextStep,
    approval: { required: input.approval.required, granted: input.approval.granted },
    updatedAt: new Date().toISOString(),
  };

  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, JSON.stringify(checkpoint, null, 2) + "\n", {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
  return checkpoint;
}
