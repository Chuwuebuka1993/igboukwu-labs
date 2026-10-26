/**
 * ADL-007 trusted approval verification boundary.
 * Authentication, durable storage and atomic replay protection belong to a trusted host.
 * Caller-supplied status strings and approval flags are never authorization.
 */
const REQUIRED_FIELDS = ["approvalId", "taskId", "proposalId", "action", "approverId", "approvedAt", "expiresAt"];
const nonempty = (v) => typeof v === "string" && v.trim().length > 0;
const timestamp = (v) => nonempty(v) ? Date.parse(v) : NaN;

/**
 * trustedHost must supply loadApprovalRecord(id), verifyApprover(record), and
 * consumeApproval(id, taskId). consumeApproval must atomically allow one use only.
 */
export async function verifyScopedApproval({ request, trustedHost, now = Date.now() }) {
  if (!request || !["approvalId", "taskId", "proposalId", "action"].every((k) => nonempty(request[k]))) {
    return { allowed: false, reason: "invalid_approval_request" };
  }
  if (!trustedHost || typeof trustedHost.loadApprovalRecord !== "function" ||
      typeof trustedHost.verifyApprover !== "function" ||
      typeof trustedHost.consumeApproval !== "function") {
    return { allowed: false, reason: "trusted_approval_host_not_integrated" };
  }

  let record;
  try { record = await trustedHost.loadApprovalRecord(request.approvalId); }
  catch { return { allowed: false, reason: "approval_record_lookup_failed" }; }
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { allowed: false, reason: "approval_record_not_found" };
  }
  if (REQUIRED_FIELDS.some((field) => !nonempty(record[field]))) {
    return { allowed: false, reason: "approval_record_malformed" };
  }
  if (record.approvalId !== request.approvalId || record.taskId !== request.taskId ||
      record.proposalId !== request.proposalId || record.action !== request.action) {
    return { allowed: false, reason: "approval_scope_mismatch" };
  }
  const approvedAt = timestamp(record.approvedAt);
  const expiresAt = timestamp(record.expiresAt);
  if (!Number.isFinite(approvedAt) || !Number.isFinite(expiresAt) ||
      approvedAt > now || expiresAt <= now || expiresAt <= approvedAt) {
    return { allowed: false, reason: "approval_expired_or_invalid_time" };
  }

  let verified = false;
  try { verified = await trustedHost.verifyApprover(record) === true; }
  catch { return { allowed: false, reason: "approver_verification_failed" }; }
  if (!verified) return { allowed: false, reason: "approver_not_authorized" };

  let consumed = false;
  try { consumed = await trustedHost.consumeApproval(record.approvalId, request.taskId) === true; }
  catch { return { allowed: false, reason: "approval_replay_guard_failed" }; }
  if (!consumed) return { allowed: false, reason: "approval_already_used_or_not_consumed" };

  return {
    allowed: true, reason: "trusted_scoped_approval_verified",
    approvalId: record.approvalId, taskId: record.taskId,
    proposalId: record.proposalId, action: record.action, approverId: record.approverId,
  };
}
