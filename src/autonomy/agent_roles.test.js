import test from "node:test";
import assert from "node:assert/strict";
import { authorizeAgentAction, listAgentRoles } from "./agent_roles.js";

test("role registry exposes distinct research, engineering, verification, security, and release roles", () => {
  const roles = listAgentRoles();
  assert.deepEqual(roles.map((role) => role.id), [
    "researcher", "engineer", "verifier", "security_reviewer", "release_steward",
  ]);
  assert.ok(roles.every((role) => role.purpose && Array.isArray(role.actions)));
});

test("unknown roles and actions fail closed", () => {
  assert.equal(authorizeAgentAction({ role: "superuser", action: "write_code" }).allowed, false);
  assert.equal(authorizeAgentAction({ role: "engineer", action: "run_arbitrary_shell" }).allowed, false);
});

test("engineer can implement only after an approved proposal and adequate evidence state", () => {
  assert.deepEqual(
    authorizeAgentAction({ role: "engineer", action: "write_code", evidenceState: "TESTED", proposalStatus: "approved" }),
    { allowed: true, reason: "within_role_scope", requiresHumanApproval: false },
  );
  assert.equal(
    authorizeAgentAction({ role: "engineer", action: "write_code", evidenceState: "TESTED", proposalStatus: "awaiting_approval" }).reason,
    "approved_proposal_required",
  );
  assert.equal(
    authorizeAgentAction({ role: "engineer", action: "write_code", evidenceState: "UNKNOWN", proposalStatus: "approved" }).reason,
    "evidence_not_implementation_ready",
  );
});

test("researcher cannot write code and verifier cannot mutate source", () => {
  assert.equal(authorizeAgentAction({ role: "researcher", action: "write_code" }).reason, "role_scope_denied");
  assert.equal(authorizeAgentAction({ role: "verifier", action: "write_tests" }).reason, "role_scope_denied");
});

test("release and merge remain human-only for every agent role", () => {
  for (const role of listAgentRoles()) {
    for (const action of ["merge", "release", "publish_external"]) {
      const decision = authorizeAgentAction({ role: role.id, action });
      assert.equal(decision.allowed, false);
      assert.equal(decision.requiresHumanApproval, true);
    }
  }
});

test("culturally normative Afa semantics cannot be approved by an agent", () => {
  assert.equal(
    authorizeAgentAction({ role: "researcher", action: "approve_cultural_semantics" }).allowed,
    false,
  );
});

test("write actions reject absent or malformed evidence state", () => {
  assert.equal(
    authorizeAgentAction({ role: "engineer", action: "draft_pr", proposalStatus: "approved" }).reason,
    "unknown_evidence_state",
  );
  assert.equal(
    authorizeAgentAction({ role: "engineer", action: "draft_pr", evidenceState: "IMPLEMENTED", proposalStatus: "approved" }).allowed,
    true,
  );
});
