import test from "node:test";
import assert from "node:assert/strict";
import { createGitHubRepositoryAdapter } from "./github_repository_adapter.js";

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return body; },
  };
}

test("GitHub adapter pins tree, state and workflow metadata to the resolved commit", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith("/commits/main")) return response(200, { sha: "a".repeat(40), commit: { tree: { sha: "b".repeat(40) } } });
    if (String(url).includes("/git/trees/")) return response(200, { tree: [
      { path: "src/index.js", type: "blob" },
      { path: "src/index.test.js", type: "blob" },
      { path: ".github/workflows/ci.yml", type: "blob" },
      { path: "autonomy/PROJECT_STATE.json", type: "blob" },
    ], truncated: false });
    if (String(url).includes("/actions/runs")) return response(200, { workflow_runs: [
      { name: "CI", status: "completed", conclusion: "success", head_sha: "a".repeat(40) },
    ] });
    if (String(url).includes("/contents/autonomy/PROJECT_STATE.json")) return response(200, {
      encoding: "base64",
      content: Buffer.from(JSON.stringify({ known_failures: [], unresolved_questions: [] })).toString("base64"),
    });
    throw new Error("Unexpected request URL");
  };

  const adapter = createGitHubRepositoryAdapter({ token: "test-token", fetchImpl });
  const snapshot = await adapter.inspectRepository({ repository: "owner/repo", ref: "main" });

  assert.equal(snapshot.commitSha, "a".repeat(40));
  assert.equal(snapshot.inventory.tests.includes("src/index.test.js"), true);
  assert.equal(snapshot.inventory.workflows.includes(".github/workflows/ci.yml"), true);
  assert.equal(snapshot.ci.status, "passed");
  assert.equal(snapshot.authority.inspectionIsReadOnly, true);
  assert.equal(snapshot.readyForAutonomousWrite, false);
  assert.equal(calls.every((call) => call.options.method === "GET"), true);
  assert.equal(calls.every((call) => call.options.headers.Authorization === "Bearer test-token"), true);
});

test("GitHub adapter rejects truncated repository trees instead of reporting a partial inventory as complete", async () => {
  const fetchImpl = async (url) => {
    if (String(url).endsWith("/commits/main")) return response(200, { sha: "a".repeat(40), commit: { tree: { sha: "b".repeat(40) } } });
    if (String(url).includes("/git/trees/")) return response(200, { tree: [], truncated: true });
    throw new Error("Unexpected request URL");
  };
  const adapter = createGitHubRepositoryAdapter({ token: "test-token", fetchImpl });
  await assert.rejects(adapter.inspectRepository({ repository: "owner/repo", ref: "main" }), /truncated/);
});

test("GitHub adapter does not disclose token in HTTP errors", async () => {
  const fetchImpl = async () => response(401, { message: "Bad credentials" });
  const adapter = createGitHubRepositoryAdapter({ token: "secret-token", fetchImpl });
  await assert.rejects(
    adapter.inspectRepository({ repository: "owner/repo", ref: "main" }),
    (error) => error.message.includes("401") && !error.message.includes("secret-token"),
  );
});
