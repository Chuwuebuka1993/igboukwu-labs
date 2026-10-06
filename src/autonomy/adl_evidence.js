export function createEvidenceRecord({ id, source, claim, hash }) {
  if (!id || !source || !claim || !hash) throw new TypeError("id, source, claim and hash are required");
  return { id, source, claim, hash, state: "SUPPORTING", verified: false, provenance: { recordedAt: new Date().toISOString() } };
}