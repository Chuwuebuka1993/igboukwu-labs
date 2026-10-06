import test from "node:test";
import assert from "node:assert/strict";
import { createProjectState, addTask, addResearchQuestion, openProposal } from "./project_state.js";

test("creates a self-describing autonomous project state", () => {
  const state = createProjectState({
    projectId: "igboukwu-labs",
    currentMilestone: "M3",
  });

  assert.equal(state.projectId, "igboukwu-labs");
  assert.equal(state.currentMilestone, "M3");
  assert.equal(state.milestoneStatus, "active");
  assert.deepEqual(state.completedWork, []);
  assert.deepEqual(state.activeTasks, []);
  assert.deepEqual(state.blockedTasks, []);
  assert.deepEqual(state.approvedTasks, []);
  assert.deepEqual(state.researchQueue, []);
  assert.deepEqual(state.evidenceQueue, []);
  assert.deepEqual(state.openProposals, []);
  assert.deepEqual(state.experiments, []);
  assert.deepEqual(state.benchmarks, []);
  assert.deepEqual(state.knownFailures, []);
  assert.deepEqual(state.unresolvedQuestions, []);
  assert.deepEqual(state.nextActions, []);
  assert.equal(state.testStatus, "unknown");
});

test("adds tasks without mutating the existing state", () => {
  const state = createProjectState({ projectId: "p", currentMilestone: "M3" });
  const task = { id: "ADL-003", title: "Research evidence", status: "queued" };
  const next = addTask(state, task);

  assert.deepEqual(state.activeTasks, []);
  assert.deepEqual(next.activeTasks, [task]);
});

test("queues research questions and opens approval-bound proposals", () => {
  const state = createProjectState({ projectId: "p", currentMilestone: "M3" });
  const researched = addResearchQuestion(state, {
    id: "RQ-001",
    question: "What is established?",
    status: "queued",
  });
  const proposed = openProposal(researched, {
    id: "PROP-001",
    title: "Implement verified finding",
    status: "awaiting_approval",
  });

  assert.equal(proposed.researchQueue.length, 1);
  assert.equal(proposed.openProposals[0].status, "awaiting_approval");
});