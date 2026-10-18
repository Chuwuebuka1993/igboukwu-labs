import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { runVerificationCommand } from "./verification_runner.js";

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

test("verification runner executes only an allowlisted command without a shell", async () => {
  let invocation;
  const result = await runVerificationCommand({
    command: "npm test",
    cwd: "/tmp/workspace/repo",
    workspaceRoot: "/tmp/workspace",
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

test("verification runner rejects arbitrary commands", async () => {
  assert.throws(
    () => runVerificationCommand({ command: "rm -rf /", cwd: "/workspace/repo" }),
    /not allowlisted/,
  );
});

test("verification runner records non-zero exit as failure", async () => {
  const result = await runVerificationCommand({
    command: "npm test",
    cwd: "/tmp/workspace/repo",
    workspaceRoot: "/tmp/workspace",
    spawnImpl: () => fakeChild({ stderr: "test failure", code: 1 }),
  });

  assert.equal(result.status, "failed");
  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /test failure/);
});

test("verification runner rejects invalid working directory", async () => {
  assert.throws(
    () => runVerificationCommand({ command: "npm test", cwd: "", workspaceRoot: "/tmp/workspace" }),
    /cwd must be an absolute path/,
  );
});


test("verification runner rejects a working directory outside the approved workspace", async () => {
  assert.throws(
    () => runVerificationCommand({
      command: "npm test",
      cwd: "/tmp/other-repo",
      workspaceRoot: "/tmp/workspace",
    }),
    /inside the approved workspace/,
  );
});

test("verification runner requires an explicit approved workspace root", () => {
  assert.throws(
    () => runVerificationCommand({ command: "npm test", cwd: "/tmp/workspace/repo" }),
    /workspaceRoot must be an absolute path/,
  );
});
