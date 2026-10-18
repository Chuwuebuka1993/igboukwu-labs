import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";

/**
 * Exclusive per-run lease. A stale lease is intentionally NOT auto-stolen:
 * recovery requires explicit operator reconciliation so a paused old process
 * cannot resume alongside a new owner. This is a process-level lock, not a
 * distributed fencing token or an OS sandbox.
 */
export async function acquireRunLease(leasePath, runId) {
  if (typeof leasePath !== "string" || !isAbsolute(leasePath)) {
    throw new TypeError("leasePath must be an absolute path");
  }
  if (typeof runId !== "string" || !/^[A-Za-z0-9._-]{1,100}$/.test(runId)) {
    throw new TypeError("runId contains unsupported characters");
  }

  const path = resolve(leasePath);
  await mkdir(dirname(path), { recursive: true });
  const lease = { schema: "ADL-RUN-LEASE/v1", runId, token: randomUUID(), pid: process.pid, acquiredAt: new Date().toISOString() };
  let handle;
  try {
    handle = await open(path, "wx", 0o600);
    await handle.writeFile(JSON.stringify(lease) + "\n", "utf8");
    await handle.sync();
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    if (error?.code === "EEXIST") {
      throw new Error("run lease already exists; reconcile the existing run before retrying");
    }
    throw error;
  }
  await handle.close();

  let released = false;
  return {
    token: lease.token,
    async release() {
      if (released) return;
      const current = JSON.parse(await readFile(path, "utf8"));
      if (current?.token !== lease.token || current?.runId !== runId) {
        throw new Error("run lease ownership changed; refusing to release another owner's lease");
      }
      await unlink(path);
      released = true;
    },
  };
}
