export function createContinuousRun({ projectId, checkpoint }) {
  if (!projectId || !checkpoint) throw new TypeError("projectId and checkpoint are required");
  return { projectId, checkpoint, status: "running", resumable: true, humanMergeRequired: true, lastAction: null };
}