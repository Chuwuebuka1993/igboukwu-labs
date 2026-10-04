import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SAFE_TASKS = new Set(["audit", "test"]);
const SAFE_COMMANDS = Object.freeze({
  test: ["npm", ["test"]],
  audit: ["npm", ["test"]],
});

export function executeRepositoryTask({ task, cloneRepository }) {
  if (!task || !SAFE_TASKS.has(task.kind)) {
    throw new Error("repository runner only permits bounded audit/test tasks");
  }
  if (typeof cloneRepository !== "function") {
    throw new TypeError("cloneRepository must be a function");
  }

  const workspace = mkdtempSync(join(tmpdir(), "afa-adl-"));
  try {
    cloneRepository(workspace);
    const [command, args] = SAFE_COMMANDS[task.kind];
    const output = execFileSync(command, args, {
      cwd: workspace,
      encoding: "utf8",
      timeout: 120000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return {
      taskId: task.id,
      command: [command, ...args].join(" "),
      exitCode: 0,
      output,
      evidenceState: "TESTED",
      verified: false,
    };
  } catch (error) {
    return {
      taskId: task.id,
      command: SAFE_COMMANDS[task.kind].join(" "),
      exitCode: typeof error?.status === "number" ? error.status : 1,
      output: String(error?.stdout ?? "") + String(error?.stderr ?? error?.message ?? error),
      evidenceState: "FAILED",
      verified: false,
    };
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
}
