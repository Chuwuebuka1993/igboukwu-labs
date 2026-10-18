# ADL-005: Commit-pinned verification job

**Status:** IMPLEMENTED ON THIS BRANCH; CI evidence required for every revision. Not integrated or production-verified.

## Purpose

\`runPinnedVerification\` composes the read-only repository inspector, checkpoint store, and allowlisted verification runner into one bounded attempt. It is deliberately a verification coordinator, not a general-purpose autonomous shell.

## Contract

- Requires a stable task ID and run ID.
- Requires an explicit authorization object matching task ID, repository, ref, and allowed command. The caller must construct this object from the trusted server-side approval ledger; user-supplied request JSON is not proof of authorization.
- Resolves the requested ref through the adapter and validates repository identity, commit SHA, and complete-tree evidence.
- Checks that the workspace HEAD matches the resolved SHA before running the requested command.
- Requires checkpoint and evidence paths outside the checkout workspace.
- Records a versioned checkpoint before execution and after meaningful stages.
- Writes a content-hashed evidence JSON with commit, approval ID, command, environment, timestamps, result, bounded output, CI context, and \`verified: false\`.
- Uses exclusive artifact creation. If the run's checkpoint or evidence path already exists, it stops and requires reconciliation rather than rerunning the same run ID.
- Does not self-authorize, merge, release, or claim scientific verification.

## Security limits

This module is not a sandbox. Workspace containment is lexical and does not prevent symlink escapes. The verification runner's \`npm test\` and \`npm run build\` commands execute scripts defined by the checked-out repository. For untrusted code, the caller must use an OS/container sandbox with least privilege, no production secrets, restricted network and filesystem access, and resource limits. Never pass a user-supplied authorization object directly through as a trusted grant.

The GitHub adapter uses read-only requests. The coordinator's test suite uses injected adapter/runner doubles; this proves orchestration logic but does not prove credentials, checkout materialization, the private Afa-language repository, or a live sandbox integration.

## Verification

Run \`npm test\`. CI must run on the exact head commit and upload \`adl-repository-snapshot\`. Test pass means only that the declared verification command passed against the recorded commit. Independent review, cultural/scientific validation, merge, and release are separate gates.
