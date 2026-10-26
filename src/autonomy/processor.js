import { summarizeRun, transitionTask } from "./task_queue.js";
import { authorizeAgentAction } from "./agent_roles.js";

export function runControlledTask(task, { execute, policy } = {}) {
  const authorization = authorizeAgentAction(policy);
  if (!authorization.allowed) {
    return {
      task: { ...task },
      run: summarizeRun({
        taskId: task?.id ?? null,
        testsPassed: 0,
        testsFailed: 0,
        reproduction: "DENIED:" + authorization.reason,
        evidenceState: "BLOCKED",
      }),
      authorization,
      executed: false,
    };
  }
  if (typeof execute !== "function") {
    throw new TypeError("execute must be a function");
  }

  const runningTask = transitionTask(task, "running");

  try {
    const outcome = execute();
    if (!outcome || !Number.isInteger(outcome.testsPassed) || !Number.isInteger(outcome.testsFailed)) {
      throw new TypeError("execution result must include integer test counts");
    }

    const completedTask = transitionTask(runningTask, "completed");
    const run = summarizeRun({
      taskId: completedTask.id,
      testsPassed: outcome.testsPassed,
      testsFailed: outcome.testsFailed,
      reproduction: String(outcome.reproduction ?? ""),
      evidenceState: "TESTED",
    });

    return { task: completedTask, run, authorization, executed: true };
  } catch (error) {
    const blockedTask = transitionTask(runningTask, "blocked");
    const run = summarizeRun({
      taskId: blockedTask.id,
      testsPassed: 0,
      testsFailed: 1,
      reproduction: error instanceof Error ? error.message : String(error),
      evidenceState: "FAILED",
    });

    return { task: blockedTask, run, authorization, executed: true };
  }
}
