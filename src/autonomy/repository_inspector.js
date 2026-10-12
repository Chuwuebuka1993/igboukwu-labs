const SHA_PATTERN = /^[a-f0-9]{40}$/i;

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} is required`);
  }
  return value.trim();
}

function normalizeFiles(files) {
  if (!Array.isArray(files)) throw new TypeError("files must be an array");
  return [...new Set(files.map((file) => {
    if (typeof file !== "string" || file.trim() === "") {
      throw new TypeError("each file path must be a non-empty string");
    }
    return file.trim().replace(/^\.\//, "");
  }))].sort();
}

function summarizeCi(workflows) {
  if (!Array.isArray(workflows)) throw new TypeError("workflows must be an array");
  if (workflows.length === 0) return { status: "pending", total: 0, passed: 0, failed: 0 };

  const passed = workflows.filter((run) =>
    run && run.status === "completed" && run.conclusion === "success"
  ).length;
  const failed = workflows.filter((run) =>
    run && (run.conclusion === "failure" || run.conclusion === "cancelled" || run.conclusion === "timed_out")
  ).length;

  return {
    status: failed > 0 ? "failed" : passed === workflows.length ? "passed" : "pending",
    total: workflows.length,
    passed,
    failed,
  };
}

/**
 * Builds a deterministic, read-only repository inventory from already-retrieved
 * GitHub metadata. It does not fetch files, run commands, or grant write authority.
 */
export function inspectRepository({ repository, commitSha, files, workflows = [], projectState = {} }) {
  const repo = requireNonEmptyString(repository, "repository");
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) {
    throw new TypeError("repository must use owner/repo format");
  }
  const sha = requireNonEmptyString(commitSha, "commitSha");
  if (!SHA_PATTERN.test(sha)) throw new TypeError("commitSha must be a 40-character commit SHA");

  const paths = normalizeFiles(files);
  if (!projectState || typeof projectState !== "object" || Array.isArray(projectState)) {
    throw new TypeError("projectState must be an object");
  }

  const knownFailures = Array.isArray(projectState.known_failures)
    ? projectState.known_failures
    : Array.isArray(projectState.knownFailures) ? projectState.knownFailures : [];
  const unresolvedQuestions = Array.isArray(projectState.unresolved_questions)
    ? projectState.unresolved_questions
    : Array.isArray(projectState.unresolvedQuestions) ? projectState.unresolvedQuestions : [];

  const ci = summarizeCi(workflows);
  const inventory = {
    source: paths.filter((path) => /(^|\/)(src|lib|app)\//.test(path) && !/\.test\.[cm]?[jt]sx?$/.test(path)),
    tests: paths.filter((path) => /(^|\/)(test|tests|__tests__)\//.test(path) || /\.test\.[cm]?[jt]sx?$/.test(path) || /\.spec\.[cm]?[jt]sx?$/.test(path)),
    workflows: paths.filter((path) => path.startsWith(".github/workflows/") && /\.(yml|yaml)$/.test(path)),
    projectState: paths.filter((path) => /(^|\/)(PROJECT_STATE\.json|project[-_]state\.(json|ya?ml))$/i.test(path)),
    packageManifests: paths.filter((path) => /(^|\/)(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|pom\.xml|build\.gradle)$/i.test(path)),
  };

  const gates = {
    repositoryPinned: true,
    filesDiscovered: paths.length > 0,
    testInventoryPresent: inventory.tests.length > 0,
    workflowInventoryPresent: inventory.workflows.length > 0,
    ciPassed: ci.status === "passed",
    knownFailuresClear: knownFailures.length === 0,
    unresolvedQuestionsClear: unresolvedQuestions.length === 0,
    approvalRequired: true,
  };

  const blockers = Object.entries(gates)
    .filter(([name, passed]) => name !== "approvalRequired" && passed === false)
    .map(([name]) => name);
  if (gates.approvalRequired) blockers.push("human approval is not represented by repository inspection");

  return {
    schema: "ADL-REPOSITORY-SNAPSHOT/v1",
    repository: repo,
    commitSha: sha,
    inventory,
    ci,
    projectState: {
      knownFailureCount: knownFailures.length,
      unresolvedQuestionCount: unresolvedQuestions.length,
    },
    gates,
    blockers,
    readyForProposal: blockers.length === 0,
    readyForAutonomousWrite: false,
    authority: {
      inspectionIsReadOnly: true,
      humanApprovalRequiredForWrites: true,
      humanMergeRequired: true,
      humanReleaseRequired: true,
    },
  };
}
