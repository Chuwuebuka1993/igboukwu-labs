# ADL-002 baseline execution

This workflow is the first controlled execution bridge from Igboukwu Labs to the private Afa-language repository.

## One-time setup

In **Igboukwu Labs → Settings → Secrets and variables → Actions**, add:

- `AFA_REPOSITORY_TOKEN`: a fine-grained GitHub token owned by the project maintainer, restricted to `Chuwuebuka1993/Afa-language`, with **Contents: read-only**. Never put the token in source code, workflow inputs, issues, or chat.

The token is required because the AFA repository is private. The workflow does not print it and checkout credentials are not persisted.

## Execute the first baseline

1. Open the Actions tab in `Chuwuebuka1993/igboukwu-labs`.
2. Select **ADL-002 AFA baseline execution**.
3. Select **Run workflow**.
4. Use task ID `ADL-002` and source ref `fix/gate0-parser-defects` for the known eight-test baseline branch, or supply another authorized branch/tag/exact commit.
5. Open the run and inspect the test output and uploaded `adl-002-baseline-…` artifact.

The workflow executes only the fixed command:

```sh
python -m unittest discover -s tests -v
```

The artifact contains the requested ref, resolved commit SHA, tracked-file manifest, runtime/OS details, command output, exit code, machine-readable summary and SHA-256 checksums. Artifacts are retained for 90 days.

## Evidence semantics

A passing test run means the recorded test suite passed on the recorded commit and runner. It does not prove scientific correctness, complete conformance, or release readiness. The summary therefore always keeps `verified: false`, `scientifically_verified: false`, and `approval_required: true`.

The workflow does not modify the AFA source repository, commit changes, merge a pull request, or release software. It can also be triggered by a future authenticated `repository_dispatch` event of type `adl-002-baseline`; the hosted Lab is not yet wired to dispatch that event.
