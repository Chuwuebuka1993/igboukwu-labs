import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, mkdirSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runVerificationCommand } from "./verification_runner.js";

function workspace(t) {
  const root = mkdtempSync(join(tmpdir(), "adl-verify-"));
  const cwd = join(root, "repo");
  mkdirSync(cwd);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, cwd };
}
function fakeChild({ stdout = "ok", stderr = "", code = 0, delay = 0 } = {}) {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => { child.killed = true; };
  queueMicrotask(() => {
    if (stdout) child.stdout.emit("data", Buffer.from(stdout));
    if (stderr) child.stderr.emit("data", Buffer.from(stderr));
    setTimeout(() => child.emit("close", code), delay);
  });
  return child;
}

test("verification runner executes only an allowlisted command without a shell", async (t) => {
  const { root, cwd } = workspace(t);
  let invocation;
  const result = await runVerificationCommand({
    command: "npm test", cwd, workspaceRoot: root,
    spawnImpl: (file, args, options) => {
      invocation = { file, args, options };
      return fakeChild({ stdout: "tests passed", code: 0 });
    },
  });
  assert.equal(invocation.file, "npm");
  assert.deepEqual(invocation.args, ["test"]);
  assert.equal(invocation.options.shell, false);
  assert.equal(result.status, "passed");
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /tests passed/);
});

test("verification runner rejects arbitrary commands", (t) => {
  const { root, cwd } = workspace(t);
  assert.throws(() => runVerificationCommand({ command: "rm -rf /", cwd, workspaceRoot: root }), /not allowlisted/);
});

test("verification runner records non-zero exit as failure", async (t) => {
  const { root, cwd } = workspace(t);
  const result = await runVerificationCommand({
    command: "npm test", cwd, workspaceRoot: root,
    spawnImpl: () => fakeChild({ stderr: "test failure", code: 1 }),
  });
  assert.equal(result.status, "failed");
  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /test failure/);
});

test("verification runner rejects invalid working directory", (t) => {
  const { root } = workspace(t);
  assert.throws(() => runVerificationCommand({ command: "npm test", cwd: "", workspaceRoot: root }), /cwd must be an absolute path/);
});

test("verification runner rejects a working directory outside the approved workspace", (t) => {
  const { root } = workspace(t);
  assert.throws(() => runVerificationCommand({ command: "npm test", cwd: "/tmp/other-repo", workspaceRoot: root }), /inside the approved workspace/);
});

test("verification runner requires an explicit approved workspace root", (t) => {
  const { cwd } = workspace(t);
  assert.throws(() => runVerificationCommand({ command: "npm test", cwd }), /workspaceRoot must be an absolute path/);
});

test("verification runner rejects symlink escape from the approved workspace", (t) => {
  const { root, cwd } = workspace(t);
  const outside = mkdtempSync(join(tmpdir(), "adl-outside-"));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const link = join(cwd, "escape");
  symlinkSync(outside, link, "dir");
  assert.throws(
    () => runVerificationCommand({ command: "npm test", cwd: link, workspaceRoot: root }),
    /symlink escape rejected/,
  );
});

test("verification runner fails closed when captured output exceeds the configured limit", async (t) => {
  const { root, cwd } = workspace(t);
  const result = await runVerificationCommand({
    command: "npm test", cwd, workspaceRoot: root, maxOutputBytes: 4,
    spawnImpl: () => fakeChild({ stdout: "output is too large", code: 0 }),
  });
  assert.equal(result.status, "failed");
  assert.equal(result.outputLimitExceeded, true);
});

test("verification runner records timeout as failure", async (t) => {
  const { root, cwd } = workspace(t);
  const result = await runVerificationCommand({
    command: "npm test", cwd, workspaceRoot: root, timeoutMs: 5,
    spawnImpl: () => fakeChild({ stdout: "still running", code: 0, delay: 20 }),
  });
  assert.equal(result.status, "failed");
  assert.equal(result.timedOut, true);
});
