import { buildDispatchDecision } from "./dispatch_contract.js";
import { verifyScopedApproval } from "./trusted_approval_verifier.js";

const IMPLEMENTABLE = new Set([
  "FORMALLY_ESTABLISHED", "IMPLEMENTED", "TESTED", "EXPERIMENTALLY_VALIDATED",
]);

/**
 * Trusted async dispatch gate. This returns a decision only; it does not execute
 * code. The caller must still route execution through the role-authorized executor.
 */
export async function buildVerifiedDispatchDecision(plane, approval, trustedHost, now = Date.now()) {
  const preliminary = buildDispatchDecision(plane);
  if (!plane || !plane.task || !plane.task.id) return preliminary;
  if (plane.status !== "active") return preliminary;
  if (!plane.proposal || !plane.proposal.id) {
    return { allowed: false, reason: "proposal_identity_missing", action: "await_approval" };
  }
  if (!IMPLEMENTABLE.has(plane.evidenceState)) return preliminary;
  if (!approval || approval.action !== "implement") {
    return { allowed: false, reason: "implementation_approval_required", action: "await_approval" };
  }

  const verified = await verifyScopedApproval({
    request: {
      approvalId: approval.approvalId,
      taskId: plane.task.id,
      proposalId: plane.proposal.id,
      action: "implement",
    },
    trustedHost,
    now,
  });
  if (!verified.allowed) {
    return { allowed: false, reason: verified.reason, action: "await_approval" };
  }
  return {
    allowed: true,
    reason: "trusted_scoped_approval_verified",
    action: "implement",
    taskId: plane.task.id,
    proposalId: plane.proposal.id,
    approvalId: verified.approvalId,
  };
}
