# ADL-004: Durable inspection and verification bridge

ADL-004 adds three bounded building blocks for a real worker:

1. `createGitHubRepositoryAdapter` performs read-only GitHub REST requests to resolve a commit, enumerate its tree, retrieve workflow runs for that commit, and optionally read the project-state JSON.
2. `saveCheckpoint` and `loadCheckpoint` persist versioned, resumable state using a same-directory temporary file and atomic rename. Implementation-phase running checkpoints require an explicit approval grant.
3. `runVerificationCommand` permits only `npm test`, `npm run build`, and `git diff --check`; it disables shell interpretation and bounds runtime and output.

## Configuration

Supply a read-only GitHub token through the host's secret manager and pass it to `createGitHubRepositoryAdapter({ token })`. Do not commit tokens or place them in project state, checkpoints, logs, or workflow artifacts.

## Safety limits

- Repository adapter requests are GET-only.
- A truncated tree is rejected instead of reported as a complete inventory.
- Missing workflow evidence remains a blocker.
- Inspection never grants write permission.
- The verification runner does not accept arbitrary shell commands.
- Checkpoint storage is a local persistence primitive; deployment must provide a durable volume or database and enforce single-writer/locking semantics before concurrent workers are enabled.
- This stage does not create branches, write source files, open pull requests, merge, release, or start a background service.

## Verification

Run `npm test` in the repository. The ADL workflow should execute the full test suite on the pull request and attach the repository snapshot as a workflow artifact.


## Verification runner boundary hardening (follow-up draft)

The runner now requires an explicit absolute `workspaceRoot` and rejects a `cwd` that is lexically outside that root. This reduces accidental execution against unrelated directories.

**This is not an OS-level sandbox.** Lexical path checks do not stop symlink escapes, and `npm test` / `npm run build` execute project-defined scripts. Before using this runner on untrusted repositories, run it in an isolated container or equivalent sandbox with least-privilege credentials, bounded filesystem/network access, and no production secrets. The caller must provide the approved workspace root and bind evidence to the exact checkout commit.

The new boundary tests are authored but have not yet been executed in this environment. Do not mark ADL-004 verified until the repository's full `npm test` suite runs successfully on the exact commit and its CI evidence is inspected.
