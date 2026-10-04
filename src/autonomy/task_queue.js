const ALLOWED_KINDS = new Set(["audit", "test", "research", "build"]);
const ALLOWED_RISKS = new Set(["low", "medium", "high"]);
const STATUSES = new Set(["queued", "running", "completed", "blocked"]);

export function createTask({ id, title, kind, risk }) {
  if (!id || !title) throw new TypeError("id and title are required");
  if (!ALLOWED_KINDS.has(kind)) throw new RangeError("unsupported task kind");
  if (!ALLOWED_RISKS.has(risk)) throw new RangeError("unsupported task risk");
  return { id, title, kind, risk, status: "queued" };
}

export function nextTask(queue) {
  if (!Array.isArray(queue)) throw new TypeError("queue must be an array");
  return queue
    .filter((task) => task && task.status === "queued")
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))[0] ?? null;
}

export function summarizeRun({ taskId, testsPassed, testsFailed, reproduction, evidenceState }) {
  if (!taskId) throw new TypeError("taskId is required");
  if (!Number.isInteger(testsPassed) || testsPassed < 0) throw new RangeError("testsPassed must be a non-negative integer");
  if (!Number.isInteger(testsFailed) || testsFailed < 0) throw new RangeError("testsFailed must be a non-negative integer");
  if (typeof reproduction !== "string") throw new TypeError("reproduction must be a string");
  if (typeof evidenceState !== "string") throw new TypeError("evidenceState must be a string");
  return {
    taskId,
    testsPassed,
    testsFailed,
    reproduction,
    evidenceState,
    verified: false,
  };
}

export { ALLOWED_KINDS, ALLOWED_RISKS, STATUSES };
