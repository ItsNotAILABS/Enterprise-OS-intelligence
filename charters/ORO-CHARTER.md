# ORO GOVERNANCE ORGANISM CHARTER
## Internal Name: ORO · Public Face: EffectTrace

**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech · Chaos Lab · Dallas, Texas  
**Contact:** Medinasitech@outlook.com  
**Date:** April 2026  
**Subordinate to:** [Master Charter](MASTER-CHARTER.md)

---

## Section 1 — Identity

| Field | Value |
|:---|:---|
| **Internal Name** | ORO (Organism for Runtime Observation) |
| **Public Name** | EffectTrace |
| **Full Public Name** | EffectTrace — Governance Consequence Intelligence |
| **Technical Class** | ICP-native governance intelligence substrate |
| **Substrate** | Internet Computer Protocol |
| **Mission** | Convert governance noise into structured runtime truth |
| **Public Headline** | Trace what governance proposals actually change |
| **Three-Word Encoding** | TRACE · VERIFY · REMEMBER |

---

## Section 2 — What ORO Is

ORO is a governance nervous system for the Internet Computer Protocol. It is not a governance dashboard. It is not a proposal template generator. It is not a voting recommendation engine.

ORO is an always-alive organism that:

1. **Watches** every NNS and SNS governance proposal continuously
2. **Traces** the actual on-chain effect path of each proposal — what canister, what method, what parameter, what treasury, what state
3. **Verifies** the truth status of every claim at each stage of the proposal lifecycle
4. **Remembers** every governance decision permanently, building a precedent graph that compounds at rate φ
5. **Alerts** operators when critical or high-risk proposals arrive without reviewer coverage
6. **Reports** post-execution outcomes — confirming or disputing what actually changed vs what was claimed

The organism starts the moment `bootstrapOROProduction()` is called. It runs on the default 1-hour cycle unless configured otherwise. It does not wait to be asked. It generates its own activity.

---

## Section 3 — What ORO Is Not

- Not a replacement for CodeGov (technical review)
- Not a governance voting advisory service
- Not an official DFINITY product or affiliation
- Not a claim-maker — every output is evidence-gated
- Not a small tool — ORO is a 15-engine, 4-agent, 5-canister ICP organism

### The Relationship with CodeGov

| Lane | System | Answers |
|:---|:---|:---|
| Technical review | CodeGov | Is this proposal technically valid? Has it been reviewed? |
| Consequence intelligence | EffectTrace (ORO) | What will this proposal change? Where does the effect land? How do we verify the after-state? What does it mean in governance memory? |

These lanes do not overlap. ORO is designed to complement CodeGov, not compete with it. EffectTrace links to CodeGov reviews as source evidence for truth status advancement.

---

## Section 4 — The Three Theoretical Foundations

ORO is grounded in three papers from the Sovereign Intelligence Research series. Each paper provides one of the three words.

### TRACE — Paper XX: STIGMERGY

The pheromone field model. The intelligence lives in the field between agents, not in the agents.

ORO's governance effect field is a NEXORIS-equivalent pheromone substrate. Every traced proposal deposits signal on its target canister and method. Future proposals targeting the same canister or method encounter a field already shaped by prior traces. The consequence pattern becomes visible without being computed from scratch.

The governing equation:

```
τ(x, t+Δt) = τ(x, t) · (1 - ρ·Δt) + Σ q(xᵢ, t)
```

Where ρ is the evaporation rate, q(xᵢ, t) is the deposit from proposal i, and τ(x, t) is the field intensity at position x (canister/method space) at time t.

### VERIFY — Paper XXI: QUORUM

Phase-transition truth crystallization. Truth status does not advance by authority. It advances when evidence accumulates to the threshold.

The truth status ladder:

```
claim_only → payload_identified → review_supported → execution_pending
         → executed_not_verified → verified_after_state
```

Side paths: `disputed` · `unknown`

No reviewer can override the ladder. No proposal can reach `verified_after_state` without source-linked after-state evidence against the MEDIUS baseline.

### REMEMBER — Paper XXII: AURUM

φ-compounding governance memory. The precedent graph grows denser with every cycle.

Memory accumulation rate:

```
M(t) = M₀ · φᵗ
```

Where φ = 1.6180339887 and t is measured in governance cycles. Verified outcomes persist at full weight. Unverified claims decay at evaporation rate ρ. The ICP's stable memory is the only substrate where this accumulation can be permanent.

---

## Section 5 — The Five Canister Architecture

ORO is ICP-native from the first line. Not localStorage. Not a cloud database. Five canisters.

| Canister | Role |
|:---|:---|
| **Proposal Index Canister** | Stores proposal metadata, indexes NNS/SNS proposals, maps proposal IDs to trace records |
| **EffectTrace Canister** | Stores effect traces, runtime truth status, risk profiles, verification plans, revision history |
| **Governance Memory Canister** | Proposal-to-proposal links, precedent graph, follow-up obligations, post-execution outcomes |
| **Agent Findings Canister** | Structured outputs from all four agents, review/dispute state, evidence linkage |
| **Certified Public Frontend** | Public browsing, trace pages, proposal search, markdown export |

Full canister specification: [Canister Architecture Charter](CANISTER-CHARTER.md) · [Paper XXIII](../papers/XXIII-ORO-GOVERNANCE-INTELLIGENCE.md)

---

## Section 6 — The 15-Engine Pipeline

Every proposal that enters ORO runs through 15 engines in sequence.

| # | Engine | Role |
|:---:|:---|:---|
| E1 | Proposal Ingestor | Normalises NNS/SNS proposals into `ProposalRecord` |
| E2 | Payload Parser | Decodes raw candid payload, extracts WASM hash, args, targets |
| E3 | Target Resolver | Maps canister IDs to known names, methods, risk classes |
| E4 | Effect Path Builder | Constructs the TRACE — claim, target, ANTE state, expected POST |
| E5 | Runtime Truth Engine | Derives truth status on the VERIFY ladder |
| E6 | Risk Scorer | φ-weighted 6-axis risk profile (technical, treasury, governance, irreversibility, verification difficulty, precedent weight) |
| E7 | Verification Plan Builder | Generates concrete after-state check steps per proposal type |
| E8 | Reviewer Integration | Ingests human reviewer findings; advances truth status |
| E9 | Governance Memory Engine | Links proposals, deposits to memory field, finds related precedent |
| E10 | Post-Execution Watch | Monitors adopted proposals; observes execution; captures MEDIUS |
| E11 | Agent Council | Integrity · Execution Trace · Context Map · Verification Lab agents |
| E12 | Public Summary Engine | Turns internal trace into clean forum-safe language |
| E13 | Evidence Registry | Keeps every claim attached to a source link |
| E14 | Dispute/Correction Engine | Allows corrections, disputed findings, version history |
| E15 | Render/Export Engine | Forum markdown · JSON · public web page · review packet |

Full engine specification: [Engine Pipeline Charter](ENGINE-CHARTER.md)

---

## Section 7 — The Four Agent Roles

| Public Name | Internal Name | Role |
|:---|:---|:---|
| **Integrity Check** | ARCHON | Checks proposal/payload mismatch, unclear claims, missing evidence, hidden risk, summary inconsistency |
| **Execution Trace** | VECTOR | Identifies target canister/method/parameter/state and the before/after effect path |
| **Context Map** | LUMEN | Links related proposals, governance history, forum discussion, reviewer notes, ecosystem context |
| **Verification Lab** | FORGE | Generates concrete verification steps, dashboard links, canister query suggestions, post-execution checklist |

Internal names are not exposed publicly. Public-facing text uses the four public names only.

Full agent specification: [Agent Council Charter](AGENT-COUNCIL-CHARTER.md)

---

## Section 8 — The ANTE · MEDIUS · POST State Triple

Every proposal that ORO watches passes through three named states. This is the chrono state triple.

| Latin | Meaning | When | Immutability |
|:---|:---|:---|:---|
| **ANTE** | Before — the state that exists | At proposal ingest. Before-state captured, sourced, and locked | Immutable once written |
| **MEDIUS** | Middle — the execution snapshot | The moment execution is confirmed. CHRONO-anchored | Immutable after anchoring. Cannot be mutated |
| **POST** | After — the verified outcome | After `afterStateFetcher` returns source-linked evidence against MEDIUS baseline | Writable only when MEDIUS exists and evidence is attached |

MEDIUS is the chrono twin. POST can only advance to `verified_after_state` when evidence is diffed against MEDIUS. The gap between execution and verification is no longer dark.

Full specification: [Paper XXIV — ANTE · MEDIUS · POST](../papers/XXIV-ANTE-MEDIUS-POST.md)

---

## Section 9 — The Autonomous Cycle

The organism runs a 10-step autonomous cycle every `cyclePeriodMs` (default: 3,600,000 ms = 1 hour).

```
1.  Fetch new NNS proposals from the IC API
2.  Fetch new SNS proposals from watched DAOs
3.  Process each new proposal through the 15-engine pipeline
4.  Update the post-execution watch queue for adopted proposals
5.  Check execution status of watched proposals
6.  Trigger after-state verification for executed proposals
7.  Tick the governance memory field (deposit, evaporate, diffuse)
8.  Run the agent council on unreviewed traces
9.  Emit alerts for critical or high-risk proposals without reviewer coverage
10. Update the operator dashboard state
```

The organism does not wait to be asked. Steps 1–10 execute every cycle without external instruction.

---

## Section 10 — The Operator Dashboard

The operator dashboard gives the builder full observability into the organism's state.

| Section | What it shows |
|:---|:---|
| **Live Governance Pulse** | Open high-risk proposals · proposals nearing vote deadline · proposals adopted but not checked · proposals executed but after-state unclear · reviewer disagreement |
| **Risk Radar** | Code upgrades · treasury actions · governance-rule changes · canister-control changes · custom generic functions · critical SNS proposals |
| **Effect Graph** | Proposal → target → state changed → related prior proposals → follow-up obligations |
| **Memory Thread** | What led to this? What changed? Who reviewed it? What happened after? What future proposals depend on it? |
| **Truth Status Board** | Every proposal labeled: claim_only · payload_identified · review_supported · executed · after_state_checked · disputed · unknown |
| **Watchlist** | SNS DAOs · proposal types · canisters · known neurons · treasury actions · governance-rule changes |

Full specification: [Operator Dashboard Charter](OPERATOR-CHARTER.md)

---

## Section 11 — Governing Commitments

These commitments apply to every output ORO produces:

1. **No adopt/reject recommendations** — ORO traces consequences, it does not advise votes
2. **No DFINITY affiliation claims** — ORO is independently built and maintained
3. **No CodeGov displacement** — ORO complements technical review, it does not replace it
4. **No unverified "verified"** — `verified_after_state` requires evidence attached to MEDIUS
5. **Every claim is source-linked or marked unknown** — no claim exists without a source link
6. **Every agent finding is reviewable and disputable** — no AI output is final
7. **Every correction is versioned** — the dispute/correction engine preserves history

---

## Section 12 — The Protocols

ORO operates under five formal protocols:

| Protocol | What it governs |
|:---|:---|
| [Protocol I — Governance Consequence](../protocols/PROTOCOL-I-GOVERNANCE-CONSEQUENCE.md) | How ORO processes any proposal from ingest through memory |
| [Protocol II — Truth Ladder](../protocols/PROTOCOL-II-TRUTH-LADDER.md) | How truth status advances and what evidence each step requires |
| [Protocol III — Risk Scoring](../protocols/PROTOCOL-III-RISK-SCORING.md) | How the φ-weighted 6-axis risk profile is computed |
| [Protocol IV — Memory Field](../protocols/PROTOCOL-IV-MEMORY-FIELD.md) | How the governance pheromone field deposits, evaporates, and diffuses |
| [Protocol V — Agent Council](../protocols/PROTOCOL-V-AGENT-COUNCIL.md) | How the four agents are invoked, coordinated, and how their findings are resolved |

---

## Section 13 — Build Phases

ORO is built in 8 sovereign passes:

| Pass | What is built | Output |
|:---:|:---|:---|
| 1 | Core canister substrate, stable storage, core types, manual ingestion, public query methods, frontend shell | Real ICP-native trace registry |
| 2 | Effect Path Engine, Runtime Truth Engine, risk class fields, evidence links, truth status labels, revision history | Every proposal becomes a structured effect record |
| 3 | Proposal-to-proposal links, precedent graph, follow-up obligations, post-execution check records | System starts remembering governance over time |
| 4 | Integrity Agent, Execution Trace Agent, Context Agent, Verification Agent, findings registry, human review/dispute state | System starts analyzing, not just storing |
| 5 | NNS adapter, SNS adapter, generic function parser, dashboard/forum/review source manager | Ingestion becomes semi-automatic |
| 6 | Live governance pulse, risk radar, watchlist, effect graph, open questions board, post-execution queue | Operator knows what's going on |
| 7 | Public trace pages, markdown export, community-safe language, public disclaimer | Community can use it |
| 8 | Cross-proposal pattern detection, reviewer reliability map, governance drift detection, consequence forecasting | Governance intelligence infrastructure |

---

*ORO Governance Organism Charter · Medina Tech · Chaos Lab · Dallas, Texas · April 2026*  
*TRACE · VERIFY · REMEMBER*
