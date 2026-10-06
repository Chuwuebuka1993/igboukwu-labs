export function createApproval({ proposalId, decision = "pending" }) {
  if (!proposalId) throw new TypeError("proposalId is required");
  if (!["pending", "approved", "rejected"].includes(decision)) throw new RangeError("invalid decision");
  return { proposalId, decision, required: true, humanAuthority: true, mergeAllowed: decision === "approved" };
}