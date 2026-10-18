# SS-01 — Sound Signature Studio Engine Feasibility Plan

**Status:** PROPOSED PLAN — not a benchmark result, model approval, or release decision  
**Work item:** [igboukwu-labs issue #15](https://github.com/Chuwuebuka1993/igboukwu-labs/issues/15)  
**Date opened:** 2026-10-18  
**Decision owner:** Human approval required

## 1. Product boundaries

ALPHA is the shared ecosystem/platform. These are separate products in that ecosystem:

1. **Digital Twin** — separate product and domain model.
2. **Sound Signature Studio** — separate audio/music product and the first product in this workstream.
3. **Video Engine** — separate video product; implementation is deferred until Sound Signature Studio passes its quality and cost gates.

Products may reuse identity, navigation, orchestration, security, provenance, usage metering and project storage. They must not be collapsed into one engine. The broader Digital Workshop / engineering expansion remains a later phase.

## 2. Objective

Choose the lowest-risk path to a high-quality first Sound Signature Studio release for:

- Igbo highlife and contemporary highlife
- Amapiano
- Reggae
- Calypso
- Praise and worship
- Igbo praise, including language and call-and-response fidelity

The objective is not to train a foundation model immediately. It is to measure whether an existing hosted or open model can meet the first-release quality target, then determine whether a deterministic beat/MIDI engine and/or a small adaptation meaningfully improves the result.

## 3. Candidate lanes

Candidates are hypotheses until their exact model/checkpoint, current terms and performance are verified.

| Lane | Candidate | Intended role | Main questions |
|---|---|---|---|
| Hosted full-song generation | Google Lyria through the Gemini API, if current account/API access supports the intended workflow | Fast baseline; avoid operating GPUs | Current model/version, supported duration/lyrics/vocals, price, quota, data-use terms, commercial terms and API stability |
| Open self-hosted generation | ACE-Step family, exact checkpoint to be selected only after review | Control over deployment and potential adaptation | Exact weight/code licence, commercial-use conditions, VRAM, offload support, output quality, generation speed, training tooling and dependency licences |
| Deterministic beat/MIDI engine | AFA-compatible or standalone tested procedural engine | Editable rhythms, bass, chords, arrangement templates and MIDI export | Genre authenticity, determinism, editability, sample/synth licensing and integration effort |

Do not assume the most permissive repository licence automatically governs model weights, training data, codecs, samples or all dependencies. Record each relevant licence separately.

## 4. Benchmark design

Create at least 50 prompts, stratified across the six target genre families. Each prompt must specify the intended musical characteristics without copying protected lyrics or asking for an imitation of a living artist's distinctive voice.

Each test record must include:

- Stable test ID and benchmark version
- Genre/subgenre and intended language
- Prompt and generation parameters
- Candidate provider/model/checkpoint and version/date
- Runtime configuration and available hardware
- Start/end time, latency, error state and retry count
- Cost calculation and source used for the rate
- Audio artifact URI and SHA-256 hash, where storage supports it
- Evaluator scores and written notes
- Rights/provenance classification for every input asset

Keep prompts and scores in a versioned manifest. Never overwrite an earlier result; create a new run record.

### Initial scoring rubric

Score each dimension from 1 to 5, with written justification. Treat this as an evaluation rubric, not a claim that any candidate has passed.

| Dimension | What to evaluate |
|---|---|
| Genre fidelity | Rhythm, groove, instrumentation and arrangement match the requested genre |
| Musical coherence | Structure, transitions, phrasing and ending sound intentional |
| Vocal quality | Clarity, intelligibility, naturalness and consistency |
| Igbo language/cultural fidelity | Pronunciation, tone, phrasing, context and appropriateness, reviewed by qualified speakers/musicians |
| Controllability | Ability to follow BPM, mood, language, instruments and requested song sections |
| Production quality | Balance, clipping, artifacts, distortion and perceived mix quality |
| Reliability | Success rate, repeatability, timeout/error behaviour |
| Cost/latency | Cost per accepted result and end-to-end wait time |

Do not collapse all dimensions into a single average that hides a critical weakness. Publish per-genre results and confidence/limitations. Use blind listening by multiple musicians where feasible; retain disagreements rather than inventing consensus.

## 5. Rights and data governance

- Do not scrape or download YouTube/commercial recordings for model training without the required rights and permissions.
- Distinguish reference listening, transcription/analysis, training, fine-tuning, commercial generation and redistribution rights; permission for one does not imply permission for the others.
- Prefer commissioned original recordings, written licences permitting AI training, appropriately verified public-domain material and creator-consented stems.
- Record rights holder, asset hash, source, licence/consent, allowed purposes, territory, expiry/revocation terms and review status.
- Keep unverified assets out of training datasets.
- Do not intentionally train a voice clone of an identifiable artist without the relevant consent and rights.

## 6. Hardware and cost protocol

1. Start with a small inference benchmark on currently available resources (including eligible Colab resources if the account exposes them).
2. Record actual hardware, VRAM, runtime, memory use, failures and artifact quality.
3. Estimate costs using current primary-source pricing and the exact machine/region/attached storage configuration.
4. For hosted APIs, record model, request parameters, current price source, usage limits and actual billed usage where available.
5. Do not assume a subscription includes a fixed number of GPU hours. Compute-unit availability and hardware access must be checked in the active account.
6. No GPU purchase, paid long-running instance or model-training expenditure without a separate budget decision.

## 7. Decision gates

### Gate A — access and licence
Confirm access to each candidate, exact version/checkpoint, current licence/terms, quota, data handling and commercial-use requirements. Stop a candidate if essential rights or access are unclear.

### Gate B — reproducible baseline
Generate and preserve the initial benchmark outputs. Report failed generations as well as successful ones.

### Gate C — quality/cost decision
Choose one of:
- Integrate hosted generation API.
- Self-host an open model.
- Run a bounded LoRA experiment with an appropriately licensed dataset.
- Reject the candidate and test another.

A fine-tuning experiment must state the hypothesis, dataset version, base checkpoint, training configuration, compute used, evaluation set and acceptance threshold before the run begins.

### Gate D — application integration
Only after the active application source is identified, add a replaceable generation-adapter interface and a separate deterministic beat/MIDI service. Test job status, retries, cancellation, audio persistence, usage limits, error states and mobile behaviour. Do not claim integration until tests run against the actual project.

### Deferred
- Full foundation-model training
- GPU/server purchase
- Video-generation implementation
- Digital Workshop engineering implementation
- Production launch or commercial claims

## 8. Current blockers / unknowns

- The active Google Labs / Google AI Studio project URL or project identifier has not yet been connected to this repository workstream.
- The two visible GitHub repositories `Chuwuebuka1993/Soundsignature-ng` and `Chuwuebuka1993/soundsignature.ng` currently contain minimal README content, not the active music-engine source.
- Exact model/API access and account entitlements must be checked in the user's active account; no fixed GPU-hour entitlement is assumed.
- No benchmark has been executed by this plan. No audio quality, cost, latency or training-duration result is claimed.

## 9. Required report

The SS-01 report must distinguish:

- **DOCUMENTED** — supported by a current primary source
- **MEASURED** — captured in a reproducible run
- **ESTIMATED** — calculated from stated assumptions
- **UNKNOWN** — not yet verified
- **BLOCKED** — cannot proceed until a named dependency is resolved

Deliverables: candidate matrix, rights/terms matrix, benchmark manifest, generated audio evidence, scorecards, cost calculations, failure analysis and a recommendation with explicit limitations.

## 10. Governance

This plan does not authorize a merge, release, deployment, foundation-model training or expenditure. Human review is required at decision gates. Keep this workstream separate from ADL-005/ADL-006 reliability changes. Test execution, model quality review, legal/rights review, merge and release are distinct states.
