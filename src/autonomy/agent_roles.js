/**
 * ADL-007: bounded role registry for the ALPHA autonomous worker.
 *
 * This module is a policy decision aid, not an execution sandbox or identity
 * system. Callers must enforce returned decisions at every tool boundary.
 * Unknown roles/actions and missing evidence fail closed. Merge, release,
 * external publication, and culturally normative Afa decisions remain human-only.
 */
const ROLE_POLICIES = Object.freeze({
  researcher: {
    purpose: "Find and evaluate evidence; distinguish fact, inference, and unknowns.",
    actions: ["inspect_repository", "search_sources", "extract_evidence", "draft_spec", "propose_change"],
    prohibited: ["write_code", "merge", "release", "publish_external", "approve_cultural_semantics"],
  },
  engineer: {
    purpose: "Implement an approved, scoped change and add regression tests.",
    actions: ["inspect_repository", "write_code", "write_tests", "run_tests", "draft_pr"],
    prohibited: ["merge", "release", "publish_external", "approve_cultural_semantics"],
  },
  verifier: {
    purpose: "Independently run checks and assess evidence without modifying source.",
    actions: ["inspect_repository", "run_tests", "inspect_ci", "verify_provenance", "report_findings"],
    prohibited: ["write_code", "merge", "release", "publish_external", "approve_cultural_semantics"],
  },
  security_reviewer: {
    purpose: "Review attack surfaces, permissions, secrets, isolation, and failure modes.",
    actions: ["inspect_repository", "inspect_security", "run_tests", "draft_security_findings", "propose_change"],
    prohibited: ["merge", "release", "publish_external", "approve_cultural_semantics"],
  },
  release_steward: {
    purpose: "Assemble release evidence and identify missing gates; never publish autonomously.",
    actions: ["inspect_repository", "inspect_ci", "verify_provenance", "prepare_release_checklist"],
    prohibited: ["merge", "release", "publish_external", "approve_cultural_semantics"],
  },
});

const ACTIONS_REQUIRING_APPROVED_PROPOSAL = new Set(["write_code", "write_tests", "draft_pr"]);
const HUMAN_ONLY_ACTIONS = new Set(["merge", "release", "publish_external", "approve_cultural_semantics"]);
const EVIDENCE_STATES = new Set([
  "CONFIRMED", "IMPLEMENTED", "TESTED", "RESEARCH-SUPPORTED", "DERIVED",
  "PROPOSED", "USER-ASSERTED", "UNVERIFIED", "UNKNOWN", "REJECTED-SUPERSEDED",
]);

export function listAgentRoles() {
  return Object.entries(ROLE_POLICIES).map(([id, policy]) => ({
    id, purpose: policy.purpose, actions: [...policy.actions], prohibited: [...policy.prohibited],
  }));
}

export function authorizeAgentAction({ role, action, evidenceState, proposalStatus, humanApproval = false } = {}) {
  if (typeof role !== "string" || !Object.hasOwn(ROLE_POLICIES, role)) {
    return { allowed: false, reason: "unknown_role", requiresHumanApproval: false };
  }
  if (typeof action !== "string" || !/^[a-z][a-z0-9_]*$/.test(action)) {
    return { allowed: false, reason: "invalid_action", requiresHumanApproval: false };
  }
  if (HUMAN_ONLY_ACTIONS.has(action)) {
    return { allowed: false, reason: "human_only_action", requiresHumanApproval: true };
  }
  const policy = ROLE_POLICIES[role];
  if (policy.prohibited.includes(action) || !policy.actions.includes(action)) {
    return { allowed: false, reason: "role_scope_denied", requiresHumanApproval: false };
  }
  if (action === "approve_cultural_semantics") {
    return { allowed: false, reason: "human_only_cultural_authority", requiresHumanApproval: true };
  }
  if (ACTIONS_REQUIRING_APPROVED_PROPOSAL.has(action)) {
    if (!EVIDENCE_STATES.has(evidenceState)) {
      return { allowed: false, reason: "unknown_evidence_state", requiresHumanApproval: false };
    }
    if (proposalStatus !== "approved") {
      return { allowed: false, reason: "approved_proposal_required", requiresHumanApproval: true };
    }
    if (evidenceState === "UNKNOWN" || evidenceState === "UNVERIFIED" || evidenceState === "USER-ASSERTED" ||
        evidenceState === "PROPOSED" || evidenceState === "REJECTED-SUPERSEDED") {
      return { allowed: false, reason: "evidence_not_implementation_ready", requiresHumanApproval: true };
    }
  }
  return { allowed: true, reason: "within_role_scope", requiresHumanApproval: false };
}
