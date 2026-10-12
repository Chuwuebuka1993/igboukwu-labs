import { inspectRepository } from "./repository_inspector.js";

const DEFAULT_API_BASE = "https://api.github.com";
const API_VERSION = "2022-11-28";

function parseRepository(value) {
  if (typeof value !== "string" || !/^[^/\s]+\/[^/\s]+$/.test(value)) {
    throw new TypeError("repository must use owner/repo format");
  }
  const [owner, repo] = value.split("/");
  return { owner, repo };
}

export function createGitHubRepositoryAdapter({
  token,
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_API_BASE,
  statePath = "autonomy/PROJECT_STATE.json",
} = {}) {
  if (typeof token !== "string" || token.trim() === "") {
    throw new TypeError("a GitHub read token is required");
  }
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
  if (typeof statePath !== "string" || statePath.startsWith("/") || statePath.split("/").includes("..")) {
    throw new TypeError("statePath must be a safe repository-relative path");
  }

  const base = apiBaseUrl.replace(/\/$/, "");

  async function get(path, { allowNotFound = false } = {}) {
    const response = await fetchImpl(`${base}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": API_VERSION,
      },
    });

    if (allowNotFound && response.status === 404) return null;
    if (!response.ok) {
      // Never include request headers or token values in errors.
      throw new Error(`GitHub API request failed with HTTP ${response.status} for ${path.split("?")[0]}`);
    }
    return response.json();
  }

  return {
    async inspectRepository({ repository, ref = "HEAD" } = {}) {
      const { owner, repo } = parseRepository(repository);
      if (typeof ref !== "string" || ref.trim() === "") throw new TypeError("ref is required");
      const root = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      const commit = await get(`${root}/commits/${encodeURIComponent(ref)}`);
      const commitSha = commit?.sha;
      const treeSha = commit?.commit?.tree?.sha;
      if (typeof commitSha !== "string" || !/^[a-f0-9]{40}$/i.test(commitSha)) {
        throw new Error("GitHub returned an invalid commit SHA");
      }
      if (typeof treeSha !== "string" || !/^[a-f0-9]{40}$/i.test(treeSha)) {
        throw new Error("GitHub returned an invalid tree SHA");
      }

      const tree = await get(`${root}/git/trees/${treeSha}?recursive=1`);
      if (tree?.truncated === true) {
        throw new Error("GitHub returned a truncated repository tree; inventory is incomplete");
      }
      if (!Array.isArray(tree?.tree)) throw new Error("GitHub returned an invalid repository tree");

      const workflowResponse = await get(`${root}/actions/runs?head_sha=${commitSha}&per_page=100`);
      const workflows = Array.isArray(workflowResponse?.workflow_runs)
        ? workflowResponse.workflow_runs
            .filter((run) => run?.head_sha === commitSha)
            .map((run) => ({ name: run.name, status: run.status, conclusion: run.conclusion }))
        : [];

      let projectState = {};
      const encodedStatePath = statePath.split("/").map(encodeURIComponent).join("/");
      const stateResponse = await get(`${root}/contents/${encodedStatePath}?ref=${commitSha}`, { allowNotFound: true });
      if (stateResponse) {
        if (stateResponse.encoding !== "base64" || typeof stateResponse.content !== "string") {
          throw new Error("Project state file is not returned as base64 content");
        }
        try {
          projectState = JSON.parse(Buffer.from(stateResponse.content, "base64").toString("utf8"));
        } catch {
          throw new Error("Project state file contains invalid JSON");
        }
      }

      const paths = tree.tree
        .filter((entry) => entry?.type === "blob" && typeof entry.path === "string")
        .map((entry) => entry.path);

      const snapshot = inspectRepository({
        repository: `${owner}/${repo}`,
        commitSha,
        files: paths,
        workflows,
        projectState,
      });

      return {
        ...snapshot,
        treeSha,
        source: "github-rest-api",
        evidence: {
          commitEndpoint: `${root}/commits/${commitSha}`,
          treeEndpoint: `${root}/git/trees/${treeSha}?recursive=1`,
          workflowCount: workflows.length,
          projectStatePath: stateResponse ? statePath : null,
        },
        gates: {
          ...snapshot.gates,
          treeComplete: true,
          workflowEvidencePresent: workflows.length > 0,
        },
        blockers: [
          ...snapshot.blockers,
          ...(workflows.length === 0 ? ["workflowEvidenceMissing"] : []),
        ],
        readyForProposal: snapshot.readyForProposal && workflows.length > 0,
        // Inspection is never sufficient authority to write or execute changes.
        readyForAutonomousWrite: false,
      };
    },
  };
}
