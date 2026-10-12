# ADL-003: Repository inspection

This module adds a deterministic, read-only inventory builder for repository metadata already retrieved by an adapter.

## Contract

`inspectRepository({ repository, commitSha, files, workflows, projectState })` returns a versioned snapshot containing:

- A repository identity pinned to a 40-character commit SHA.
- Categorized source, test, workflow, project-state and package-manifest paths.
- A conservative CI summary (`passed`, `failed`, or `pending`).
- Explicit verification gates and blockers derived from supplied project state.
- An explicit authority boundary: inspection never grants write, merge or release permission.

## Deliberate limitations

- The function is pure and read-only; it does not call GitHub, execute shell commands or fetch repository contents.
- A caller must retrieve metadata for the same pinned commit and pass the actual workflow status. Missing workflow evidence is `pending`, not success.
- A successful inspection is not human approval. `readyForAutonomousWrite` always remains `false`.
- The GitHub adapter, persisted checkpoint integration and isolated command executor remain subsequent work.

## Verification

Run `npm test`. The ADL-specific GitHub Actions workflow runs this suite on changes to autonomy code and package manifests.
