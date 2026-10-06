const DEFAULTS = {
  milestoneStatus: "active",
  testStatus: "unknown",
};

function cloneState(state) {
  return structuredClone(state);
}

export function createProjectState({ projectId, currentMilestone }) {
  if (!projectId || !currentMilestone) {
    throw new TypeError("projectId and currentMilestone are required");
  }

  return {
    projectId,
    currentMilestone,
    milestoneStatus: DEFAULTS.milestoneStatus,
    completedWork: [],
    activeTasks: [],
    blockedTasks: [],
    approvedTasks: [],
    researchQueue: [],
    evidenceQueue: [],
    openProposals: [],
    experiments: [],
    benchmarks: [],
    repositories: [],
    testStatus: DEFAULTS.testStatus,
    knownFailures: [],
    unresolvedQuestions: [],
    nextActions: [],
  };
}

export function addTask(state, task) {
  if (!task || typeof task !== "object" || !task.id) {
    throw new TypeError("task with id is required");
  }
  const next = cloneState(state);
  next.activeTasks.push(task);
  return next;
}

export function addResearchQuestion(state, question) {
  if (!question || typeof question !== "object" || !question.id) {
    throw new TypeError("research question with id is required");
  }
  const next = cloneState(state);
  next.researchQueue.push(question);
  return next;
}

export function openProposal(state, proposal) {
  if (!proposal || typeof proposal !== "object" || !proposal.id) {
    throw new TypeError("proposal with id is required");
  }
  if (proposal.status !== "awaiting_approval") {
    throw new RangeError("proposal must be awaiting_approval");
  }
  const next = cloneState(state);
  next.openProposals.push(proposal);
  return next;
}