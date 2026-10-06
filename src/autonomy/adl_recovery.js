export function createRecoveryPlan({ taskId, failure }) {
  if (!taskId || !failure) throw new TypeError("taskId and failure are required");
  return { taskId, failure, status: "repair_required", attempts: 0, maxAttempts: 3, verified: false, nextAction: "diagnose_and_retest" };
}