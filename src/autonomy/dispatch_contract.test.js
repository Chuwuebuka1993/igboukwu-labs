import test from "node:test";
import assert from "node:assert/strict";
import { buildDispatchDecision } from "./dispatch_contract.js";

function plane(overrides = {}) {
  return {
    task: { id: "TASK-DISPATCH-001" },
    status: "active",
    evidenceState: "FORMALLY_ESTABLISHED",
    proposal: { id: "PROP-001", status: "approved" },
    ...overrides,
  };
}

test("dispatch contract fails closed when proposal approval is absent", () => {
  const decision = buildDispatchDecision(plane({ proposal: { id: "PROP-001", status: "awaiting_approval" } }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "approval_record_not_verified");
  assert.equal(decision.action, "await_approval");
});

test("dispatch contract does not treat an approved status string as trusted authorization", () => {
  const decision = buildDispatchDecision(plane());
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "trusted_approval_verifier_not_integrated");
  assert.equal(decision.action, "implement");
});

test("dispatch contract blocks evidence that is not implementation-ready", () => {
  const decision = buildDispatchDecision(plane({ evidenceState: "UNKNOWN" }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "evidence_not_implementation_ready");
  assert.equal(decision.action, "research");
});

test("dispatch contract blocks inactive control planes", () => {
  const decision = buildDispatchDecision(plane({ status: "closed" }));
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "control_plane_not_active");
});
