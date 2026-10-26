import { runControlledTask } from "./processor.js";

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

/**
 * Dispatches only the control plane's currently planned action.
 * approvalVerifier must be supplied by the host integration and validate an
 * approval against a trusted record store; proposal.status alone is not proof.
 * This module does not implement or authenticate that store.
 */
export function dispatchPlannedAction(plane, { policy, execute, approvalVerifier } = {}) {
  const action = planNextAction(plane);
  if (action.type !== "implement") {
    return { dispatched: false, action, reason: action.type === "await_approval" ? "approval_required" : "implementation_not_planned" };
  }
  if (typeof approvalVerifier !== "function") {
    return { dispatched: false, action, reason: "trusted_approval_verifier_required" };
  }
  const approval = approvalVerifier({
    proposalId: plane.proposal?.id,
    taskId: plane.task.id,
    evidenceState: plane.evidenceState,
  });
  if (approval !== true) {
    return { dispatched: false, action, reason: "trusted_approval_not_confirmed" };
  }
  const result = runControlledTask(plane.task, {
    execute,
    policy: {
      ...policy,
      action: "write_code",
      evidenceState: plane.evidenceState,
      proposalStatus: "approved",
    },
  });
  return { dispatched: result.executed === true, action, result, reason: result.executed ? null : result.authorization?.reason ?? "execution_denied" };
}
