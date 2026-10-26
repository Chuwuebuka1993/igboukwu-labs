import { authorizeAgentAction } from "./agent_roles.js";
import { runControlledTask } from "./processor.js";

/**
 * Apply role/evidence policy immediately before a controlled task executes.
 * Denial returns without invoking execute(). This remains an in-process guard;
 * callers must still isolate the workspace and enforce repository permissions.
 */
export function runRoleAuthorizedTask(task, policy, { execute } = {}) {
  const decision = authorizeAgentAction(policy);
  if (!decision.allowed) {
    return {
      task: { ...task },
      run: {
        taskId: task?.id ?? null,
        testsPassed: 0,
        testsFailed: 0,
        reproduction: "DENIED:" + decision.reason,
        evidenceState: "BLOCKED",
        verified: false,
      },
      authorization: decision,
      executed: false,
    };
  }
  if (typeof execute !== "function") throw new TypeError("execute must be a function");
  const result = runControlledTask(task, { execute, policy });
  return { ...result, authorization: decision, executed: true };
}
