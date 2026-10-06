export function createResearchJob({ id, question }) {
  if (!id || !question) throw new TypeError("id and question are required");
  return { id, question, status: "queued", evidenceTarget: "established", sources: [], claims: [], conflicts: [] };
}