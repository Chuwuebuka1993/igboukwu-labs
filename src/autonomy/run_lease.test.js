import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { acquireRunLease } from "./run_lease.js";

async function withTempDir(run) {
  const directory = await mkdtemp(join(tmpdir(), "adl-run-lease-"));
  try { await run(directory); } finally { await rm(directory, { recursive: true, force: true }); }
}

test("only one overlapping claimant can own a run lease", async () => {
  await withTempDir(async (directory) => {
    const path = join(directory, "run.lease");
    const outcomes = await Promise.allSettled([
      acquireRunLease(path, "run-1"),
      acquireRunLease(path, "run-1"),
    ]);
    assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((x) => x.status === "rejected").length, 1);
    const owner = outcomes.find((x) => x.status === "fulfilled").value;
    await owner.release();
    const replacement = await acquireRunLease(path, "run-1");
    await replacement.release();
  });
});

test("stale lease fails closed instead of being silently stolen", async () => {
  await withTempDir(async (directory) => {
    const path = join(directory, "run.lease");
    const first = await acquireRunLease(path, "run-2");
    await assert.rejects(acquireRunLease(path, "run-2"), /reconcile the existing run/);
    await first.release();
  });
});

test("lease release refuses to remove a lease owned by a different token", async () => {
  await withTempDir(async (directory) => {
    const path = join(directory, "run.lease");
    const first = await acquireRunLease(path, "run-3");
    const lease = JSON.parse(await readFile(path, "utf8"));
    lease.token = "replaced-token";
    await writeFile(path, JSON.stringify(lease));
    await assert.rejects(first.release(), /refusing to release another owner's lease/);
  });
});
