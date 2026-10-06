import test from "node:test";
import assert from "node:assert/strict";
import { createResearchJob } from "./adl_research.js";
import { createEvidenceRecord } from "./adl_evidence.js";
import { createApproval } from "./adl_approval.js";
import { createEngineeringRun } from "./adl_engineering.js";
import { createRecoveryPlan } from "./adl_recovery.js";
import { createBenchmark } from "./adl_benchmark.js";
import { createContinuousRun } from "./adl_continuous.js";

test("ADL-003 creates research jobs with explicit evidence targets", () => {
  const x = createResearchJob({ id:"RQ-1", question:"Is the claim established?" });
  assert.equal(x.status, "queued"); assert.equal(x.evidenceTarget, "established");
});
test("ADL-004 records evidence with provenance and no automatic verification", () => {
  const x = createEvidenceRecord({ id:"E-1", source:"paper", claim:"C", hash:"h" });
  assert.equal(x.state, "SUPPORTING"); assert.equal(x.verified, false);
});
test("ADL-005 creates an approval-gated engineering run", () => {
  const x = createApproval({ proposalId:"P-1", decision:"pending" });
  assert.equal(x.required, true); assert.equal(x.decision, "pending");
});
test("ADL-006 creates a bounded engineering run", () => {
  const x = createEngineeringRun({ taskId:"T-1", branch:"autonomous/T-1" });
  assert.equal(x.status, "ready"); assert.equal(x.humanMergeRequired, true);
});
test("ADL-007 converts failures into bounded repair plans", () => {
  const x = createRecoveryPlan({ taskId:"T-1", failure:"tests failed" });
  assert.equal(x.status, "repair_required"); assert.equal(x.verified, false);
});
test("ADL-008 creates reproducible benchmark records", () => {
  const x = createBenchmark({ id:"B-1", command:"npm test", expected:"pass" });
  assert.equal(x.status, "pending"); assert.equal(x.reproducible, true);
});
test("ADL-009 creates resumable autonomous runs", () => {
  const x = createContinuousRun({ projectId:"p", checkpoint:"M3" });
  assert.equal(x.status, "running"); assert.equal(x.resumable, true);
});