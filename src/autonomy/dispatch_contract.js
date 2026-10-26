/**
 * ADL-007 control-plane dispatch contract.
 *
 * Proposal status is caller-supplied metadata, not an authenticated approval.
 * A host must validate approval records independently before executing writes.
 */
export function buildDispatchDecision(plane) {
  if (!plane || !plane.task || !plane.task.id) {
    return { allowed: false, reason: "invalid_control_plane", action: "none" };
  }
  if (plane.status !== "active") {
    return { allowed: false, reason: "control_plane_not_active", action: "none" };
  }
  if (!plane.proposal || plane.proposal.status !== "approved") {
    return { allowed: false, reason: "approval_record_not_verified", action: "await_approval" };
  }
  const implementable = new Set([
    "FORMALLY_ESTABLISHED", "IMPLEMENTED", "TESTED", "EXPERIMENTALLY_VALIDATED",
  ]);
  if (!implementable.has(plane.evidenceState)) {
    return { allowed: false, reason: "evidence_not_implementation_ready", action: "research" };
  }
  return {
    allowed: false,
    reason: "trusted_approval_verifier_not_integrated",
    action: "implement",
    taskId: plane.task.id,
    proposalId: plane.proposal.id ?? null,
  };
}
