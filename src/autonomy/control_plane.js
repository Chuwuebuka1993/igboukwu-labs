const IMPLEMENTABLE_EVIDENCE = new Set(["FORMALLY_ESTABLISHED", "IMPLEMENTED", "TESTED", "EXPERIMENTALLY_VALIDATED"]);
const PROPOSAL_READY_EVIDENCE = new Set([...IMPLEMENTABLE_EVIDENCE, "SUPPORTING"]);

export function createControlPlane({ task, evidenceState, proposal = null }) {
  if (!task || !task.id) throw new TypeError("task with id is required");
  if (typeof evidenceState !== "string") throw new TypeError("evidenceState is required");
  return { task: structuredClone(task), evidenceState, proposal: proposal ? structuredClone(proposal) : null, status: "active", verified: false, humanMergeRequired: true };
}
export function planNextAction(plane) {
  if (!plane || !plane.task) throw new TypeError("control plane is required");
  if (!PROPOSAL_READY_EVIDENCE.has(plane.evidenceState)) return { type: "research", requiresApproval: false };
  if (!plane.proposal || plane.proposal.status === "awaiting_approval") return { type: "await_approval", requiresApproval: true };
  if (plane.proposal.status === "approved" && IMPLEMENTABLE_EVIDENCE.has(plane.evidenceState)) return { type: "implement", requiresApproval: false };
  return { type: "research", requiresApproval: false };
}
export function recordResult(plane, result) {
  if (!result || !["passed", "failed"].includes(result.status)) throw new RangeError("result status must be passed or failed");
  const next = structuredClone(plane); next.verified = false;
  if (result.status === "failed") { next.status = "repair_required"; next.failure = { error: result.error ?? "unspecified failure" }; next.nextAction = { type: "diagnose_and_repair", requiresApproval: false }; return next; }
  if (!Number.isInteger(result.testsPassed) || result.testsPassed < 0) throw new RangeError("testsPassed must be a non-negative integer");
  if (!Number.isInteger(result.testsFailed) || result.testsFailed < 0) throw new RangeError("testsFailed must be a non-negative integer");
  if (result.testsFailed > 0) { next.status = "repair_required"; next.failure = { error: "tests_failed", testsFailed: result.testsFailed }; next.nextAction = { type: "diagnose_and_repair", requiresApproval: false }; return next; }
  next.status = "pr_ready"; next.testResult = { testsPassed: result.testsPassed, testsFailed: result.testsFailed }; next.nextAction = { type: "open_pr", requiresApproval: false }; return next;
}