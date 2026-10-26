# ADL-007 — Agent role boundaries

**Status:** IMPLEMENTED on this branch; CI pending.
**Security classification:** policy guardrail, not a sandbox.
**Human authority:** merge, release, external publication, and culturally normative Afa decisions are explicitly excluded from agent authority.

## Roles

- **Researcher:** inspect repositories, search sources, extract evidence, draft specifications, propose changes. Cannot write code.
- **Engineer:** implement scoped approved proposals, write tests, run tests, and draft pull requests. Cannot merge or release.
- **Verifier:** inspect repositories/CI/provenance, run tests, report findings; no source mutation.
- **Security reviewer:** inspect security controls, run tests, draft findings, propose changes.
- **Release steward:** assemble release evidence/checklists; cannot publish or release.

## Enforcement contract

`authorizeAgentAction` is a fail-closed policy decision helper. It rejects unknown roles/actions, actions outside the role allowlist, write actions without an approved proposal, and write actions with missing/unknown/unverified/user-asserted/proposed/superseded evidence. It returns explicit denial reasons and whether human approval is required.

The registry does not itself grant or revoke GitHub permissions, authenticate an agent, sandbox a process, or enforce policy unless every executor/tool adapter checks the decision. It must not be treated as a substitute for repository permissions, OS isolation, secret controls, or branch protection.

## Non-negotiable boundaries

- No agent can merge, release, or externally publish.
- No agent can approve culturally normative Afa semantics.
- Evidence labels describe provenance/status; they are not interchangeable with approval.
- Human approval is scoped to the proposal and task; it is not blanket authority for unrelated actions.

## Run tests

```sh
npm test
```
