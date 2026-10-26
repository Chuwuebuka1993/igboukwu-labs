import { spawn } from "node:child_process";
import { realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const ALLOWLIST = new Map([
  ["npm test", { file: "npm", args: ["test"] }],
  ["npm run build", { file: "npm", args: ["run", "build"] }],
  ["git diff --check", { file: "git", args: ["diff", "--check"] }],
  ["git rev-parse HEAD", { file: "git", args: ["rev-parse", "HEAD"] }],
]);

function isWithin(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel));
}

/**
 * Runs allowlisted verification commands without a shell. Lexical and real
 * paths are both checked to prevent a symlink inside the workspace escaping
 * its approved root. This is still not an OS sandbox.
 */
export function runVerificationCommand({
  command, cwd, workspaceRoot, timeoutMs = 120_000,
  maxOutputBytes = 1_000_000, spawnImpl = spawn,
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
  if (!isWithin(approvedRoot, workingDirectory)) {
    throw new Error("cwd must be inside the approved workspace");
  }
  let canonicalRoot;
  let canonicalCwd;
  try {
    canonicalRoot = realpathSync(approvedRoot);
    canonicalCwd = realpathSync(workingDirectory);
  } catch {
    throw new Error("workspaceRoot and cwd must exist before verification");
  }
  if (!isWithin(canonicalRoot, canonicalCwd)) {
    throw new Error("real cwd must remain inside the approved workspace (symlink escape rejected)");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new RangeError("timeoutMs must be positive");
  if (!Number.isInteger(maxOutputBytes) || maxOutputBytes < 1) throw new RangeError("maxOutputBytes must be positive");
  if (typeof spawnImpl !== "function") throw new TypeError("spawnImpl must be a function");

  return new Promise((resolvePromise, reject) => {
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
      resolvePromise({
        command, cwd: canonicalCwd, workspaceRoot: canonicalRoot, ...result,
        stdout, stderr, timedOut, outputLimitExceeded,
      });
    };
    let child;
    try {
      child = spawnImpl(allowed.file, allowed.args, {
        cwd: canonicalCwd, shell: false, windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { PATH: process.env.PATH ?? "", CI: "1", NODE_ENV: "test" },
      });
    } catch (error) {
      reject(error);
      return;
    }
    const append = (target, chunk) => {
      const value = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
      outputBytes += Buffer.byteLength(value);
      if (outputBytes > maxOutputBytes) {
        outputLimitExceeded = true;
        child.kill("SIGTERM");
        return;
      }
      if (target === "stdout") stdout += value;
      else stderr += value;
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
      setTimeout(() => { if (!settled) child.kill("SIGKILL"); }, 1_000).unref?.();
    }, timeoutMs);
    timer.unref?.();
  });
}
