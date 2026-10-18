# Igbo-Ukwu Engineering Standard (IUES) v0.1

**Document status:** PROPOSED — review required  
**Normative authority:** None until formally approved through the Lab's governance process  
**Owner:** Igbo-Ukwu Lab  
**Applies to:** Software, AI systems, research, plugins, data products, hardware and integrated systems  
**Purpose:** Define a vendor-neutral, evidence-driven minimum engineering operating standard for projects coordinated by Igbo-Ukwu Lab.

## 1. Conformance and claims

This is an original internal engineering standard informed by published standards and frameworks. It is **not** an ISO/IEC/IEEE standard, an accredited certification, or evidence that the Lab currently conforms to every control in this document. References guide design; they do not grant certification.

Every requirement has an identifier, applicability, acceptance criteria and evidence. Each project records one of: **PASS, FAIL, PARTIAL, NOT APPLICABLE (with rationale), or UNKNOWN**. Unknown is not pass. A control is not implemented merely because a document describes it.

## 2. Design principles

1. **Evidence before status:** a dashboard claim must resolve to a durable record, exact revision and source.
2. **Requirements traceability:** objectives connect to requirements, design decisions, implementation, tests, risks and release artifacts.
3. **Human authority is explicit:** approval of a plan is not approval of evidence, merge, release, deployment, cultural interpretation, safety case or patentability.
4. **Least privilege:** agents receive only the repository, paths, secrets, tools, network and runtime permissions required for the approved task.
5. **Fail closed:** missing, stale, conflicting or unverifiable evidence blocks a gated transition.
6. **Reproducibility:** record source revision, environment, dependencies, commands, outputs and test results.
7. **Independent verification:** high-risk changes require review by an actor other than the implementer; automated checks do not replace domain review.
8. **Recoverability:** interrupted work is resumed only after durable state and external side effects are reconciled.
9. **Separation of concerns:** policy, project-specific semantics, orchestration, execution, evidence and presentation are distinct.
10. **Vendor neutrality:** model and hosting providers are replaceable behind documented interfaces.
11. **Privacy and security by design:** secrets are never exposed to model prompts, client bundles, logs or public evidence.
12. **Context-specific governance:** each project inherits the common controls but keeps its own domain rules and specialist review requirements.

## 3. Core control requirements

### IUES-GOV — Governance and scope

- **GOV-01 Project charter:** record purpose, owner, users, scope, exclusions, stakeholders, constraints, risks and success measures.
- **GOV-02 Requirements baseline:** assign stable IDs to requirements; identify source, rationale, priority, owner and acceptance criteria.
- **GOV-03 Decision records:** record decision, alternatives, rationale, author, timestamp, affected requirements and superseded decisions.
- **GOV-04 Bounded authorization:** approval binds to a specific plan revision, repository, branch/path scope, tools, budget, acceptance tests and expiry/revocation rules.
- **GOV-05 Separation of authority:** proposal approval, implementation, independent review, merge, release and production deployment are distinct state transitions.
- **GOV-06 Change control:** material scope, risk, target, permission or acceptance-criteria changes invalidate the affected approval.
- **GOV-07 Domain authority:** culturally, scientifically, legally, medically, safety- or hardware-critical claims require the relevant qualified reviewer.

### IUES-REQ — Requirements and architecture

- **REQ-01 Traceability:** each material requirement links forward to design/implementation and verification, and backward to its source or explicitly labelled assumption.
- **REQ-02 Architecture:** maintain system context, components, interfaces, trust boundaries, dependencies, data flows and key failure modes proportionate to project risk.
- **REQ-03 Alternatives:** record material architecture alternatives and why the selected option meets constraints.
- **REQ-04 Non-functional requirements:** define relevant security, privacy, reliability, accessibility, performance, energy/data-cost, maintainability and portability targets.
- **REQ-05 Interface contracts:** specify input/output types, errors, permissions, compatibility and versioning at system boundaries.

### IUES-RES — Research and evidence

- **RES-01 Research plan:** convert open questions into answerable questions; record search scope, dates, source priorities and stopping criteria.
- **RES-02 Source quality:** prefer primary standards, official documentation, original research, source code and direct measurements; label secondary summaries as secondary.
- **RES-03 Claim-level support:** link material claims to exact sources and passages/sections where feasible; explain how each source supports the claim.
- **RES-04 Counter-evidence:** record contradictions, limitations, missing data and plausible alternative explanations.
- **RES-05 Evidence classification:** distinguish CONFIRMED, IMPLEMENTED, TESTED, RESEARCH-SUPPORTED, DERIVED, PROPOSED, USER-ASSERTED, UNVERIFIED, UNKNOWN and REJECTED/SUPERSEDED.
- **RES-06 No citation laundering:** a search result, model answer or citation list alone is not verification. A source must be inspected and fit the claim.
- **RES-07 Reproducible research:** record retrieval date, version, URL/identifier, method and transformation steps; retain permitted copies or hashes where lawful.

### IUES-IMP — Implementation and change safety

- **IMP-01 Small bounded changes:** each batch declares files/components allowed to change, expected output and rollback path.
- **IMP-02 Isolated execution:** use a dedicated branch or sandbox; protect default branches and evidence archives.
- **IMP-03 Secure inputs:** treat repository content, issues, webpages, documents and model outputs as untrusted data, never as authority to override policy.
- **IMP-04 Dependencies:** pin or constrain dependencies, record sources and assess known vulnerabilities and license obligations proportionate to risk.
- **IMP-05 Secrets:** keep credentials server-side; use least-privilege, scoped, revocable credentials; redact logs and rotate exposed credentials.
- **IMP-06 Failure handling:** surface errors with actionable context; do not swallow exceptions or report success after a partial failure.
- **IMP-07 Side-effect idempotency:** retries of GitHub writes, deployments, payments or other external actions require stable operation IDs and reconciliation before retry.

### IUES-VER — Verification and quality

- **VER-01 Test strategy:** define unit, integration, end-to-end, regression, security, performance and domain-validation tests as applicable.
- **VER-02 Acceptance mapping:** every material requirement has an executable test, inspection, analysis or explicitly justified human validation method.
- **VER-03 Exact-revision binding:** test and CI evidence identifies the exact commit/artifact hash, environment, command, exit code and run URL/log.
- **VER-04 Negative tests:** test invalid inputs, denied permissions, failure paths, retries and important boundary conditions.
- **VER-05 Regression discipline:** demonstrate a failing test for a reproducible defect where practical, then a passing test after the fix.
- **VER-06 Independent review:** reviewer inspects the diff, requirements, evidence, tests, risk and rollback; reviewer independence is recorded.
- **VER-07 Honest status:** distinguish code written, tests pending, tests passed, review approved, merged, deployed and release verified.
- **VER-08 No inherited passes:** results for an earlier revision do not certify a later revision unless the relevant evidence is explicitly revalidated.

### IUES-OPS — Durable orchestration and operations

- **OPS-01 Durable job identity:** every task has a stable job ID, approved revision, idempotency key and durable event history.
- **OPS-02 Atomic claim:** concurrent workers cannot claim the same active task.
- **OPS-03 State machine:** server-side rules validate transitions; illegal transitions are rejected and audited.
- **OPS-04 Checkpoint and recovery:** record stage checkpoints; reconcile repository and external side effects before resuming after interruption.
- **OPS-05 Bounded retries:** set attempt limits, backoff/cooldown, timeout and terminal failure reasons.
- **OPS-06 Observability:** capture structured events, errors, duration, cost/resource use and relevant health signals without exposing secrets.
- **OPS-07 Operational readiness:** before production, define monitoring, backup/restore, incident response, rollback, support owner and retirement procedure.
- **OPS-08 No false completion:** a worker stopping or returning a response is not proof of successful implementation or verification.

### IUES-SEC — Security, privacy and supply chain

- **SEC-01 Threat model:** identify assets, trust boundaries, adversaries, attack paths, abuse cases and mitigations proportionate to risk.
- **SEC-02 Access control:** enforce authentication, authorization, tenant/user boundaries and protected-action checks server-side.
- **SEC-03 Secure build:** use controlled CI, dependency scanning and secret scanning where supported; record exceptions and owners.
- **SEC-04 Artifact provenance:** preserve source commit, build workflow/environment, dependency inventory and artifact hash; adopt stronger signed attestations as maturity grows.
- **SEC-05 Data protection:** classify data, minimize collection, document retention/deletion, protect personal data and assess external data sharing.
- **SEC-06 AI-agent isolation:** constrain tool permissions and network access; test prompt-injection and indirect instruction attacks; require confirmation for high-impact actions.
- **SEC-07 Vulnerability response:** define reporting channel, severity, triage owner, remediation targets and disclosure policy.

### IUES-AI — AI system controls (when applicable)

- **AI-01 System card:** document intended use, users, prohibited uses, model/provider/version, data, tools, known limits and human oversight.
- **AI-02 Evaluation baseline:** maintain fixed representative and adversarial task sets; report quality, failure modes, latency and cost.
- **AI-03 Tool-call evaluation:** test authorization boundaries, prompt injection, data exfiltration, unsafe side effects and error recovery.
- **AI-04 Provider truthfulness:** mark a provider/model LIVE only after a real health or task call succeeds and evidence is recorded.
- **AI-05 Human escalation:** define conditions for abstention, specialist review and human approval.
- **AI-06 Lifecycle monitoring:** track drift, incidents, model/provider changes and re-evaluation triggers.

### IUES-REL — Release and lifecycle

- **REL-01 Release candidate:** identify immutable commit/artifact, version, changes, dependencies and test evidence.
- **REL-02 Release gates:** require relevant checks, risk acceptance, review, operational readiness and authorized release decision.
- **REL-03 Rollback:** document and test rollback/recovery where technically feasible.
- **REL-04 Post-release:** monitor incidents and user outcomes; feed defects and lessons into requirements and regression tests.
- **REL-05 Retirement:** define data export/deletion, credential revocation, dependency shutdown and evidence retention at end of life.

## 4. Project profiles

All projects use the common controls above, then select a profile:

- **Software/service:** API contracts, automated tests, accessibility, dependency and deployment controls.
- **AI/agent:** evaluation, data governance, model cards, tool permissions, prompt-injection tests and human escalation.
- **Research/cultural knowledge:** provenance, source independence, claim-level citations, counter-evidence and domain review. Formal encoding must not be presented as validation of cultural meaning.
- **Hardware/embedded/industrial:** requirements allocation, interface/electrical/mechanical constraints, hazard analysis, simulation/bench tests, manufacturing traceability and qualified safety review.
- **Data/plugin/integration:** schema compatibility, permission scopes, privacy, failure/retry behavior and external-side-effect reconciliation.

A profile may add controls; it may not silently waive common mandatory controls. Any waiver requires a rationale, risk owner, expiry and recorded approval.

## 5. Maturity scale

Rate each dimension independently; do not compress all dimensions into one marketing score.

- **L0 — Unassessed:** no reliable baseline.
- **L1 — Documented:** scope, owner, requirements and architecture are recorded.
- **L2 — Traceable:** requirements link to implementation and verification; evidence has provenance.
- **L3 — Repeatable:** automated tests, versioned workflows, reproducible results and change control operate consistently.
- **L4 — Governed autonomy:** bounded agent permissions, durable job lifecycle, idempotency, independent review and tested recovery are demonstrated.
- **L5 — Operationally assured:** production monitoring, security controls, incident/rollback drills, independent audits and sustained metrics are evidenced.

Each rating must cite the exact evidence and assessment date. A high score in one dimension does not compensate for a critical failure in another.

## 6. Minimum evidence packet for a completed batch

Every batch reported as complete must provide:

1. Approved plan revision and authorization record.
2. Repository, branch, base commit and resulting commit or artifact hash.
3. Changed-file list and concise rationale.
4. Tests run, environment, command, result, exit code and CI/log links.
5. Research/evidence references and claim status, where relevant.
6. Reviewer identity/disposition, where required.
7. Security/risk notes, unresolved defects and deviations.
8. Rollback/recovery instructions and next decision.
9. Explicit status for implementation, verification, review, integration and release—each separately.

If any required item is missing, mark the batch PARTIAL or BLOCKED, not fully verified.

## 7. Adoption and change governance

1. Treat v0.1 as a proposal for review, not an approved policy.
2. Create a control-to-evidence matrix mapping each IUES control to current Lab features, source files, tests, external records, gaps and owners.
3. Run a baseline assessment of the Lab itself before claiming conformance.
4. Pilot the standard on one bounded software milestone; validate that each claimed control has executable or inspectable evidence.
5. Ask independent reviewers to challenge gaps and false-positive status claims.
6. Approve a version only through a recorded governance decision; version changes require rationale, change log, impact analysis and migration notes.
7. Reassess after major architecture, provider, security or lifecycle changes.

## 8. Reference framework register

Use official editions and re-check status before adopting a control. Standards may be copyrighted; this document paraphrases their purpose and does not reproduce their normative text.

- ISO/IEC/IEEE 15288:2023 — system life-cycle processes: https://www.iso.org/standard/81702.html
- ISO/IEC/IEEE 12207:2026 — software life-cycle processes: https://www.iso.org/standard/90219.html
- ISO/IEC 42001:2023 — AI management systems: https://www.iso.org/standard/42001?browse=ics
- NIST AI Risk Management Framework Core: https://airc.nist.gov/airmf-resources/airmf/5-sec-core/
- NIST SP 800-218 SSDF publication register (check final vs draft status): https://csrc.nist.gov/projects/ssdf/publications
- NIST SP 800-218A — secure development practices for generative AI and dual-use foundation models: https://csrc.nist.gov/pubs/sp/800/218/a/final
- SLSA software supply-chain security framework: https://slsa.dev/

## 9. Known limitations

This standard has not been independently audited, formally adopted, mapped clause-by-clause to purchased ISO standards, or proven against every project type. It does not confer legal, regulatory, safety, cultural or certification status. The control matrix and pilot are required before any conformance claim.
