# IUES v0.1 — Lab Control-to-Evidence Baseline

**Assessment date:** 2026-10-18  
**Target:** ALPHA Evidence Control Center / Igbo-Ukwu Lab  
**Source snapshot inspected:** AppDeploy version `1792307052986`  
**Assessment type:** Static source and deployment-status inspection; NOT a penetration test, independent audit, or end-to-end execution test  
**Overall status:** BASELINE IN PROGRESS — no conformance claim

## Status vocabulary

- **SOURCE PRESENT:** relevant logic/document exists in inspected source; behavior is not thereby proven.
- **DOCUMENTED:** described in a design or test plan; execution evidence not established.
- **PARTIAL:** some control exists, but material requirements or evidence remain missing.
- **NOT EVIDENCED:** no sufficient evidence in the inspected snapshot.
- **NOT ASSESSED:** requires runtime, database, credential-scope, CI or independent review access.

A ready deployment, empty error log, successful scheduled handler, or test description is not equivalent to a passing end-to-end test.

## Baseline observations

1. AppDeploy reported deployment status `ready` for snapshot `1792307052986`; reported frontend/backend error arrays were empty.
2. The same status response did not establish a passing E2E QA run. Treat E2E result as **NOT EVIDENCED**, not PASS.
3. The hourly `autonomous-worker` and 15-minute `repository-sync` schedules were enabled and each showed a latest scheduled status of `success` at inspection. This proves handler-level scheduling status only; it does not prove an engineering task was processed, tested, or merged.
4. Backend source contains an atomic conditional proposal claim and run creation transaction, bounded retries (up to three attempts), audit records, explicit review transitions, and no worker merge/release operation in the inspected completion path.
5. Backend source also creates an evidence manifest and GitHub pull request before persisting the final database run state. If the external write succeeds and a later operation fails, retry/recovery may duplicate a branch/manifest/PR or leave the DB inconsistent. Stable external-operation idempotency and reconciliation are not evidenced.
6. The authorization route persists authorization and returns a message that worker dispatch was requested; worker execution is asynchronous. The route's response is not proof a durable run completed.
7. `tests/tests.json` contains five scenario descriptions. They are test specifications, not proof those scenarios were executed or passed.
8. UI milestone cards contain some `complete: true` claims whose evidence strings refer to earlier commits/local results. Those claims need to be reconciled against current commit-pinned source and CI before they are treated as current verified status.
9. AI roles default to `PLANNED`; the source describes OpenRouter as configured but the first request as not yet verified. A provider should not be called operationally verified until a real request and recorded result support that status.

## Control-to-evidence matrix

| IUES control | Inspected evidence | Baseline status | Gap / required proof |
|---|---|---|---|
| GOV-01 Project charter | `docs/AUTONOMOUS_ENGINEERING_CONTROL_PLANE.md`, UI project/milestone content | PARTIAL | Confirm owner, scope, exclusions, success measures and approved authority are canonical and versioned. |
| GOV-02 Requirements baseline | Proposal records contain title/description; AFA batch description states scope and limits | PARTIAL | Generic stable requirement IDs, acceptance criteria, source, owner and traceability are not enforced by schema/API. |
| GOV-03 Decision records | `audit_events`, proposal history, GitHub run manifest | PARTIAL | Validate append-only properties, actor identity, retention, tamper resistance and links from decisions to exact plan revisions. |
| GOV-04 Bounded authorization | Proposal states and AFA write-path allowlist / 8-file limit | PARTIAL | Approval is not demonstrably bound to immutable plan digest, permission set, expiry and full acceptance-test revision. |
| GOV-05 Separation of authority | Independent reviewer checks; self-approval rejected; worker says human merge required | SOURCE PRESENT | Test all forbidden transitions and prove release/deploy authority is separate at runtime. |
| GOV-06 Change control | Proposal transition state machine | NOT EVIDENCED | Demonstrate that material scope or acceptance changes invalidate prior authorization. |
| GOV-07 Domain authority | AFA batch forbids silent changes to cultural semantics/mappings | PARTIAL | Generic qualified-review rules for safety, legal, hardware, cultural and scientific claims need explicit profiles. |
| REQ-01 Traceability | Milestone cards and proposal descriptions | PARTIAL | No complete requirement-to-design-to-code-to-test-to-release trace graph demonstrated. |
| REQ-02 Architecture | `docs/AUTONOMOUS_ENGINEERING_CONTROL_PLANE.md` | DOCUMENTED | Independently review interfaces, data flows, trust boundaries and failure modes against deployed source. |
| REQ-03 Alternatives | Not found in reviewed files | NOT EVIDENCED | Add decision records for material architecture choices. |
| REQ-04 Non-functional requirements | Some safety, retries and scope limits documented | PARTIAL | Quantified availability, latency, cost, privacy, accessibility, recovery and performance targets missing or not evidenced. |
| RES-01 Research plan | Worker prompts/tools support research and source URLs | PARTIAL | Record search scope, retrieval dates, stopping criteria and research method for each task. |
| RES-02/03 Source quality and claim support | Report sources and evidence manifest fields exist | PARTIAL | Verify claim-level source passages, source relevance, primary-source preference and reviewer confirmation. |
| RES-04 Counter-evidence | Not evidenced in typed report schema reviewed | NOT EVIDENCED | Add contradictory evidence, limitations and alternative explanations to research report contract. |
| RES-05 Evidence classes | Run manifest has evidence state; Lab docs describe evidence statuses | PARTIAL | Validate allowed evidence taxonomy and transitions consistently across API, UI and storage. |
| IMP-01 Bounded changes | AFA batch scope, path allowlist and maximum write count | SOURCE PRESENT | Exercise adversarial path cases and confirm no alternate tool bypasses the limits. |
| IMP-02 Isolated execution | Autonomous branch and PR flow | SOURCE PRESENT | Test branch naming, base-commit pinning and isolation under concurrent runs. |
| IMP-03 Untrusted inputs | Tool allowlist and prompt constraints exist | PARTIAL | Prompt-injection/indirect-instruction tests and data-vs-instruction isolation not evidenced. |
| IMP-04 Dependencies | CI workflow is constructed for the AFA task | NOT EVIDENCED | Review dependency pinning, license inventory and vulnerability scanning. |
| IMP-05 Secrets | Backend reads `GITHUB_TOKEN` and `OPENROUTER_API_KEY` via secret store | SOURCE PRESENT | Verify secret scopes/expiry in provider settings, log redaction, rotation and no client exposure. |
| IMP-06 Failure handling | Error catches and audit events in worker | PARTIAL | Test DB failure during recovery/audit persistence and confirm no false success. |
| IMP-07 Side-effect idempotency | PR/manifest writes precede final run-state persistence | FAIL / HIGH PRIORITY GAP | Introduce durable operation IDs, lookup-before-retry and reconciliation for branch, manifest, PR and DB updates. |
| VER-01 Test strategy | Five scenarios in `tests/tests.json` | DOCUMENTED | Obtain actual E2E run ID, per-scenario result, trace and timestamp. |
| VER-02 Acceptance mapping | Test scenarios cover history, inspection, teacher, governance and worker | PARTIAL | Map every mandatory IUES control to executable test or justified inspection. |
| VER-03 Exact-revision evidence | ADL inspection records commit SHA and workflow runs by SHA; run manifest records base commit | PARTIAL | Verify generated PR head SHA and CI run IDs/conclusions are persisted and linked to the exact tested artifact. |
| VER-04 Negative tests | State transition guardrails and path allowlists in source | PARTIAL | No executed negative-test evidence for invalid transitions, path traversal, duplicate PR retry or denied actions. |
| VER-05 Regression discipline | Not evidenced for this Lab snapshot | NOT EVIDENCED | Add tests for identified defects and prove red/green where practical. |
| VER-06 Independent review | Review queue and independent reviewer checks | SOURCE PRESENT | Verify second-user workflow with real authenticated records; no self-approval and no identity spoofing. |
| VER-07 Honest status | UI distinguishes `IMPLEMENTATION_WRITTEN_CI_PENDING` and run state | SOURCE PRESENT | Audit every UI card for stale/manual `complete: true` status and reconcile to current evidence. |
| VER-08 No inherited passes | Some cards cite older commit/local results | PARTIAL / HIGH PRIORITY GAP | Make all PASS claims revision-specific and expire/revalidate evidence on source changes. |
| OPS-01 Durable job identity | Run IDs and proposal IDs stored | SOURCE PRESENT | Verify uniqueness, correlation IDs and persistence under interrupted requests. |
| OPS-02 Atomic claim | `db.transact` conditional update from AUTHORIZED plus run creation | SOURCE PRESENT | Concurrency test with simultaneous worker calls and verify exactly one active claim. |
| OPS-03 State machine | `nextState` and server-side transition guards | SOURCE PRESENT | Test race conditions between user transitions and worker claims; review all mutation routes. |
| OPS-04 Recovery | Bounded retry state and error records | PARTIAL | Reconcile external side effects before retry; test process termination after each external write. |
| OPS-05 Bounded retries | `worker_attempts` capped at three attempts | SOURCE PRESENT | Test exact boundary, repeated failures and no retry after terminal failure. |
| OPS-06 Observability | Run progress, audit events and errors | PARTIAL | Verify correlation, audit persistence failures, redaction, retention and useful metrics. |
| OPS-07 Operational readiness | Scheduled jobs enabled | PARTIAL | Backup/restore, incident response, alerting, support owner and rollback drills not evidenced. |
| OPS-08 No false completion | Run evidence state can remain `IMPLEMENTATION_WRITTEN_CI_PENDING`; UI reflects it | SOURCE PRESENT | Verify every completion path and UI state with failed/pending CI fixtures. |
| SEC-01 Threat model | Not found in reviewed files | NOT EVIDENCED | Produce a threat model for auth, agent tools, repository writes, secrets, data and prompt injection. |
| SEC-02 Access control | `requireAuth()`, owner checks, independent-review checks, repository allowlist | SOURCE PRESENT | Runtime tests for unauthenticated access, cross-user records and all protected endpoints. |
| SEC-03 Secure build | CI workflow is generated for AFA validation | PARTIAL | Verify least-privilege workflow permissions, immutable action pinning, secret/dependency scanning and branch protections. |
| SEC-04 Artifact provenance | Manifest records base commit, branch, model/provider, changes and evidence state | PARTIAL | Add exact resulting commit, CI run IDs, artifact hash and authenticated/signed attestation where feasible. |
| SEC-05 Data protection | No comprehensive policy evidence in inspected snapshot | NOT EVIDENCED | Document data classification, retention/deletion and external provider sharing. |
| SEC-06 AI-agent isolation | Tool schema/allowlist and path checks | PARTIAL | Execute prompt-injection, data-exfiltration and unsafe-tool-call test suite. |
| SEC-07 Vulnerability response | Not found in reviewed files | NOT EVIDENCED | Define reporting, triage, severity, remediation and disclosure process. |
| AI-01 System card | Role assignments and worker model/provider fields | PARTIAL | Create system card covering intended use, prohibited uses, tools, data, limits and oversight. |
| AI-02 Evaluation baseline | Five UI scenarios; no benchmark results in inspected snapshot | NOT EVIDENCED | Build repeatable representative/adversarial benchmark with versioned outcomes. |
| AI-03 Tool-call evaluation | Worker tool allowlist in source | PARTIAL | Run adversarial tool-call authorization and injection tests. |
| AI-04 Provider truthfulness | Default role statuses are PLANNED; OpenRouter first request not yet verified | PARTIAL | Ensure live status is assigned only after real successful calls and evidence persistence. |
| AI-05 Human escalation | Explicit human review/merge boundary | SOURCE PRESENT | Add risk-tiered abstention and domain-review routing for high-impact tasks. |
| AI-06 Lifecycle monitoring | Scheduled runs and audit history | PARTIAL | Monitor provider drift, model changes, incidents and trigger re-evaluation. |
| REL-01 Release candidate | GitHub PR plus run manifest | PARTIAL | Record immutable candidate commit, dependencies, test evidence and release version. |
| REL-02 Release gates | Worker does not merge/release in inspected path | SOURCE PRESENT | Verify branch protections and production deployment require separate authorized action. |
| REL-03 Rollback | Not evidenced | NOT EVIDENCED | Define and test rollback/recovery procedure. |
| REL-04 Post-release | Schedules and history exist | PARTIAL | Define production health, incident and user-outcome review. |
| REL-05 Retirement | Not evidenced | NOT EVIDENCED | Add data export/deletion, credential revocation and retention procedure. |

## Prioritized remediation queue

### P0 — Before trusting autonomous writes at scale
1. **Idempotent external operations and reconciliation.** Persist an operation intent before each GitHub side effect. On retry, query whether the branch, manifest or PR already exists; reuse or repair it rather than duplicating. Record external IDs and outcomes.
2. **Real concurrency and recovery tests.** Simulate simultaneous worker invocations and terminate/fail after each external side effect and each DB write. Assert one active claim, no duplicate PR, and truthful run/proposal state.
3. **Current evidence reconciliation.** Audit UI `complete: true` milestone claims against exact commits, current CI and durable evidence; downgrade stale claims to UNKNOWN/NOT EVIDENCED until proven.
4. **Execute E2E suite.** Obtain a real QA run and inspect all five scenarios; repair failures only after inspecting the run transcript and trace.

### P1 — Establish verifiable conformance
5. Add stable requirement IDs and a requirement-to-test/evidence map.
6. Bind approval to an immutable plan digest, allowed paths/tools, acceptance criteria, budget and expiry.
7. Add threat model, prompt-injection tests, dependency/secret scanning and operational rollback evidence.
8. Persist exact PR head SHA, workflow run IDs, conclusions and artifact hashes in the run manifest/database.

### P2 — Operational maturity
9. Add versioned AI system cards and representative/adversarial model evaluations.
10. Add monitoring, alerting, restore drills, incident response and retirement controls.
11. Conduct independent review of this baseline and update IUES maturity ratings with evidence.

## Acceptance criteria for the first pilot

The baseline pilot is not complete until:
- all five UI E2E scenarios have a real recorded result or an explicitly diagnosed blocker;
- concurrent invocations demonstrate a single durable claim;
- fault injection after each external GitHub operation produces no duplicate PR and reconciles the DB to reality;
- a later commit cannot inherit a prior commit's passing test status without new matching evidence;
- all UI claims marked complete point to current evidence or are downgraded;
- an independent reviewer checks the matrix and accepts or records objections.

## Assessment limitations

This document is based on source snapshot inspection and deployment metadata. It does not prove live database state, authenticated-user behavior, actual worker success, E2E passage, token scope, branch protection, absence of vulnerabilities, or production recoverability. No conformance certification is claimed.
