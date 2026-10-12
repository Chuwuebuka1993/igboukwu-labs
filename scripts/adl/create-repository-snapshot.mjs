import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { inspectRepository } from "../../src/autonomy/repository_inspector.js";

const root = process.cwd();
const repository = process.env.GITHUB_REPOSITORY;
if (!repository) {
  throw new Error("GITHUB_REPOSITORY is required; run this command inside a GitHub checkout.");
}

const commitSha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
}).trim();

const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage", ".next"]);
function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...walk(absolute));
    else if (entry.isFile()) found.push(relative(root, absolute).replaceAll("\\", "/"));
  }
  return found;
}

let projectState = {};
const statePath = resolve(root, "autonomy/PROJECT_STATE.json");
try {
  projectState = JSON.parse(readFileSync(statePath, "utf8"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const snapshot = inspectRepository({
  repository,
  commitSha,
  files: walk(root),
  // Do not infer workflow success from the workflow currently generating this snapshot.
  // A separate status adapter must supply completed GitHub Actions results.
  workflows: [],
  projectState,
});

const outputPath = resolve(root, "artifacts/adl-repository-snapshot.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
process.stdout.write(JSON.stringify({
  output: relative(root, outputPath),
  commitSha,
  fileCount: snapshot.inventory.source.length + snapshot.inventory.tests.length,
  ciStatus: snapshot.ci.status,
  blockerCount: snapshot.blockers.length,
  readyForAutonomousWrite: snapshot.readyForAutonomousWrite,
}, null, 2) + "\n");
