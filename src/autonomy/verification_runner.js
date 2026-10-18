import { spawn } from "node:child_process";
import { isAbsolute, relative, resolve, sep } from "node:path";

const ALLOWLIST = new Map([
  ["npm test", { file: "npm", args: ["test"] }],
  ["npm run build", { file: "npm", args: ["run", "build"] }],
  ["git diff --check", { file: "git", args: ["diff", "--check"] }],
  ["git rev-parse HEAD", { file: "git", args: ["rev-parse", "HEAD"] }],
]);

/**
 * Runs verification-only commands without a shell. This module does not execute
 * arbitrary implementation commands or grant repository write authority.
 */
export function runVerificationCommand({
  command,
  cwd,
  workspaceRoot,
  timeoutMs = 120_000,
  maxOutputBytes = 1_000_000,
  spawnImpl = spawn,
} = {}) {
  const allowed = ALLOWLIST.get(command);
  if (!allowed) throw new Error("command is not allowlisted for verification");
  if (typeof workspaceRoot !== "string" || !isAbsolute(workspaceRoot)) {
    throw new TypeError("workspaceRoot must be an absolute path");
  }
  if (typeof cwd !== "string" || !isAbsolute(cwd)) {
    throw new TypeError("cwd must be an absolute path");
  }
  const approvedRoot = resolve(workspaceRoot);
  const workingDirectory = resolve(cwd);
  const workspaceRelativePath = relative(approvedRoot, workingDirectory);
  if (workspaceRelativePath === ".." || workspaceRelativePath.startsWith(".." + sep) || isAbsolute(workspaceRelativePath)) {
    throw new Error("cwd must be inside the approved workspace");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new RangeError("timeoutMs must be positive");
  if (!Number.isInteger(maxOutputBytes) || maxOutputBytes < 1) throw new RangeError("maxOutputBytes must be positive");
  if (typeof spawnImpl !== "function") throw new TypeError("spawnImpl must be a function");

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let timedOut = false;
    let outputLimitExceeded = false;
    let settled = false;
    let timer;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        command,
        cwd: workingDirectory,
        workspaceRoot: approvedRoot,
        ...result,
        stdout,
        stderr,
        timedOut,
        outputLimitExceeded,
      });
    };

    let child;
    try {
      child = spawnImpl(allowed.file, allowed.args, {
        cwd,
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { PATH: process.env.PATH ?? "", CI: "1", NODE_ENV: "test" },
      });
    } catch (error) {
      reject(error);
      return;
    }

    const append = (target, chunk) => {
      const text = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
      outputBytes += Buffer.byteLength(text);
      if (outputBytes > maxOutputBytes) {
        outputLimitExceeded = true;
        child.kill("SIGTERM");
        return;
      }
      if (target === "stdout") stdout += text;
      else stderr += text;
    };

    child.stdout?.on("data", (chunk) => append("stdout", chunk));
    child.stderr?.on("data", (chunk) => append("stderr", chunk));
    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (exitCode, signal) => {
      const status = timedOut || outputLimitExceeded || exitCode !== 0 ? "failed" : "passed";
      finish({ status, exitCode, signal: signal ?? null });
    });

    timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      // A process that ignores SIGTERM must not leave the runner hanging.
      setTimeout(() => {
        if (!settled) child.kill("SIGKILL");
      }, 1_000).unref?.();
    }, timeoutMs);
    timer.unref?.();
  });
}
