export function createEngineeringRun({ taskId, branch }) {
  if (!taskId || !branch) throw new TypeError("taskId and branch are required");
  return { taskId, branch, status: "ready", testsPassed: 0, testsFailed: 0, humanMergeRequired: true, releaseAllowed: false };
}