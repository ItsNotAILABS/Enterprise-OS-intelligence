# ENGINE PIPELINE CHARTER
## The 15-Engine Governance Consequence Pipeline of ORO

**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech · Chaos Lab · Dallas, Texas  
**Contact:** Medinasitech@outlook.com  
**Date:** April 2026  
**Subordinate to:** [Master Charter](MASTER-CHARTER.md) · [ORO Charter](ORO-CHARTER.md)

---

## Section 1 — Purpose

The 15-engine pipeline is the spine of ORO. Every proposal that ORO watches runs through all 15 engines in sequence. No engine can be removed. No engine can be skipped. The output of each engine is the input discipline of the next.

This charter defines:
- The purpose of each engine
- The input each engine requires
- The output each engine produces
- The governing rule each engine must follow
- The relationship between engines

---

## Section 2 — The Pipeline Architecture

The 15 engines form three functional groups aligned to the three-word encoding:

```
TRACE GROUP (E1–E4, E13)
  E1  — Proposal Ingestor
  E2  — Payload Parser
  E3  — Target Resolver
  E4  — Effect Path Builder
  E13 — Evidence Registry

VERIFY GROUP (E5–E8, E14)
  E5  — Runtime Truth Engine
  E6  — Risk Scorer
  E7  — Verification Plan Builder
  E8  — Reviewer Integration
  E14 — Dispute/Correction Engine

REMEMBER GROUP (E9–E12, E15)
  E9  — Governance Memory Engine
  E10 — Post-Execution Watch
  E11 — Agent Council
  E12 — Public Summary Engine
  E15 — Render/Export Engine
```

---

## Section 3 — Engine Specifications

### E1 — Proposal Ingestor

**Group:** TRACE  
**Role:** Normalises raw NNS/SNS data into a sovereign `ProposalRecord`  

**Input:** Raw proposal from NNS API or SNS API  
**Output:** `ProposalRecord` with all known fields populated, unknown fields marked null

**Governing rule:** Every ingested proposal gets a stable `proposalId`. IDs are never reassigned. If a proposal arrives twice, E1 updates the existing record — it does not create a duplicate.

**What it captures:**

- Proposal ID
- DAO type (NNS or SNS)
- SNS root canister ID (if SNS)
- Governance canister ID
- Title, summary, URL
- Topic, proposal type, action type
- Proposer
- Status (open / adopted / rejected / executed / failed / unknown)
- Timestamps (created, decided, executed)
- Raw payload
- Source links
- Ingest timestamp

---

### E2 — Payload Parser

**Group:** TRACE  
**Role:** Decodes the raw candid payload and extracts structured data

**Input:** `ProposalRecord.rawPayload`  
**Output:** Parsed payload structure with WASM hash, arguments, targets, and action type

**Governing rule:** If the payload cannot be decoded, E2 marks the parse result as `unknown` and does not fabricate fields. A failed parse is not an error — it is a data point that advances the truth status from `claim_only` to the edge case that payload was unreadable.

**What it extracts (where available):**
- WASM module hash (for `InstallCode` proposals)
- Target canister ID
- Target method name
- Encoded arguments
- Proposal function type
- Validator canister/method (for SNS generic proposals)
- Treasury amount and destination (for treasury proposals)

---

### E3 — Target Resolver

**Group:** TRACE  
**Role:** Maps raw canister IDs and methods to known system names, risk classes, and human-readable descriptions

**Input:** E2 parsed payload with raw canister IDs  
**Output:** Resolved target record with known system name, risk class hint, and resolution confidence

**Governing rule:** E3 maintains a registry of known ICP canisters. If a canister ID is not in the registry, E3 marks the target as `unresolved` — it does not guess. The registry is updated as the network evolves.

**Known registries:**
- NNS canisters (governance, ledger, CMC, registry, identity, root)
- SNS canisters (for watched DAOs)
- Well-known dapp canisters
- Custom registry (operator-maintained)

---

### E4 — Effect Path Builder

**Group:** TRACE  
**Role:** Constructs the full TRACE for the proposal — what it claims, what it actually targets, and what the before/after state is expected to be

**Input:** `ProposalRecord` + E2 parsed payload + E3 resolved target  
**Output:** `EffectPath` record with ANTE state locked in CHRONO

**Governing rule:** E4 must lock the ANTE state the moment it is computed. The ANTE state is what existed on-chain before this proposal was adopted. It is the immutable baseline for all future verification. E4 calls CHRONO to anchor the ANTE state hash.

**What it builds:**

- `claim` — what the proposal summary says it does
- `affectedSystem` — NNS / SNS / protocol canister / registry / ledger / governance rule / unknown
- `targetCanisterId` — resolved canister
- `targetMethod` — the on-chain method that will execute
- `affectedState` — what state this touches
- `beforeState` — the ANTE state (locked immediately)
- `expectedAfterState` — what the POST state should be if the proposal executes as claimed
- `executionTrigger` — what causes execution (NNS governance adoption, SNS adoption, generic function)

---

### E5 — Runtime Truth Engine

**Group:** VERIFY  
**Role:** Derives and maintains the current truth status on the VERIFY ladder

**Input:** `ProposalRecord` + `EffectPath` + agent findings + reviewer confirmations  
**Output:** `RuntimeTruthBlock` with current `truthStatus`

**The VERIFY Ladder:**

```
claim_only
  ↓ (payload observed)
payload_identified
  ↓ (human reviewer confirmed)
review_supported
  ↓ (proposal adopted)
execution_pending
  ↓ (execution confirmed on-chain)
executed_not_verified
  ↓ (after-state evidence attached to MEDIUS baseline)
verified_after_state

Side states: disputed · unknown
```

**Governing rule:** Truth status can only advance when the condition for that step is met. It cannot advance by assertion alone. E5 checks each condition before advancing. A false advancement is a protocol violation.

---

### E6 — Risk Scorer

**Group:** VERIFY  
**Role:** Computes the φ-weighted 6-axis risk profile

**Input:** `ProposalRecord` + `EffectPath` + resolved target + memory precedents  
**Output:** `RiskProfile` with risk class, risk level, and per-axis scores

**The 6 Axes:**

| Axis | What it measures | Weight factor |
|:---|:---|:---|
| Technical | Complexity of the code change, WASM verification difficulty | φ¹ |
| Treasury | Size and irreversibility of fund movements | φ² |
| Governance | Impact on voting rules, neuron mechanics, governance structure | φ¹ |
| Irreversibility | Can this be reversed if it goes wrong? | φ² |
| Verification Difficulty | How hard is it to confirm the after-state? | φ¹ |
| Precedent Weight | Does this set a precedent for future governance? | φ⁰ |

**Risk Classes:** motion · parameter_change · code_upgrade · treasury_action · governance_rule_change · canister_control_change · frontend_asset_change · registry_or_network_change · custom_generic_function · systemic_or_emergency · unknown

**Risk Levels:** low · medium · high · critical · unknown

**Governing rule:** Risk scores are 0–10 per axis. The composite risk level is determined by the highest φ-weighted axis score, not the average. One critical axis makes the proposal critical-risk regardless of other axes.

---

### E7 — Verification Plan Builder

**Group:** VERIFY  
**Role:** Generates concrete, actionable steps to verify the effect after execution

**Input:** `RiskProfile` + resolved target + `ProposalRecord`  
**Output:** `VerificationPlan` with ordered steps

**What a verification step contains:**
- Description of the check
- Tool (IC dashboard, canister query, Rosetta API, release notes, etc.)
- Expected result if the proposal executed as claimed
- Canister ID to query (if applicable)
- Method to call (if applicable)
- Whether this step has been completed

**Governing rule:** E7 generates steps based on the proposal type. A `code_upgrade` proposal gets different verification steps than a `treasury_action`. The plan is concrete — it does not say "check if the upgrade worked"; it says "query `canister.getVersion()` and confirm the returned version hash matches `0xabcd...`."

---

### E8 — Reviewer Integration

**Group:** VERIFY  
**Role:** Ingests human reviewer findings and advances truth status accordingly

**Input:** External review artifacts (CodeGov reviews, forum posts, manual reviewer submissions)  
**Output:** Updated `EffectTraceRecord` with reviewer evidence attached; truth status potentially advanced to `review_supported`

**Governing rule:** E8 does not trust a review link alone. The reviewer must confirm the effect path, not just the technical validity. A CodeGov review that says "code is technically sound" without confirming the effect path does not advance truth status beyond `payload_identified`. Only a review that confirms the effect path advances to `review_supported`.

---

### E9 — Governance Memory Engine

**Group:** REMEMBER  
**Role:** Links proposals across time and maintains the governance pheromone field

**Input:** `ProposalRecord` + `RiskProfile`  
**Output:** `GovernanceMemoryLink[]` for related prior proposals; updated field intensity at relevant positions

**The Memory Field:**

The governance pheromone field is a sparse matrix over the space of (canister × method × risk_class). When a proposal targets a specific canister/method combination, E9 deposits signal at that position. Signal evaporates at rate ρ per cycle unless reinforced by additional proposals or verified outcomes.

**Field operations:**
- **Deposit** — add q(x, t) signal at position x when a proposal targets that position
- **Evaporate** — multiply all field values by (1 - ρ·Δt) each memory tick
- **Diffuse** — distribute signal to adjacent positions (related canisters, methods in the same system)

**Governing rule:** E9 runs a memory tick every `DEFAULT_MEMORY_TICK_INTERVAL` cycles. Field values never go below zero. Verified outcomes are deposited at 2× the weight of unverified claims.

---

### E10 — Post-Execution Watch

**Group:** REMEMBER  
**Role:** Monitors adopted proposals for execution; captures the MEDIUS state

**Input:** Adopted proposals from the watch queue; status updates from the `statusFetcher`  
**Output:** MEDIUS state anchored in CHRONO; truth status advanced to `execution_pending` or `executed_not_verified`

**The MEDIUS anchoring:**

The moment execution is confirmed on-chain, E10 captures the MEDIUS state — the exact system state at the moment execution occurred. MEDIUS is:
- Hash-anchored in CHRONO immediately
- Immutable after anchoring
- The baseline against which POST (after-state) is verified

**Governing rule:** MEDIUS cannot be mutated after anchoring. If the after-state fetcher returns data that conflicts with MEDIUS, the trace advances to `disputed`, not `verified_after_state`. The baseline is sovereign.

---

### E11 — Agent Council

**Group:** REMEMBER  
**Role:** Coordinates the four agents and produces the council status

**Input:** `EffectTraceRecord` + `ProposalRecord` + resolved target + parsed payload  
**Output:** Combined `AgentFinding[]` + `councilStatus` (one of: CLEAR · WATCH · NEEDS_REVIEW · CRITICAL)

**Council logic:**

```
Any agent produces CRITICAL finding → councilStatus = CRITICAL
All agents produce INFO only → councilStatus = CLEAR
One or more WATCH findings, no WARNING or CRITICAL → councilStatus = WATCH
One or more WARNING findings, no CRITICAL → councilStatus = NEEDS_REVIEW
```

**Governing rule:** The council does not vote. Each agent runs independently and produces findings. E11 aggregates findings by severity. The `councilStatus` is a derived property, not a consensus decision.

Full specification: [Agent Council Charter](AGENT-COUNCIL-CHARTER.md)

---

### E12 — Public Summary Engine

**Group:** REMEMBER  
**Role:** Translates the internal trace record into clean, forum-safe public language

**Input:** `EffectTraceRecord` + `ProposalRecord` + agent findings  
**Output:** Public summary string suitable for forum posts; plain-language effect explanation; clean risk label

**Governing rule:** E12 strips all internal doctrine language. No NEXORIS. No COGNOVEX. No ARCHON. No φ. The public summary uses plain language that any ICP participant can understand without knowing the internal architecture.

E12 must not make claims beyond what the evidence supports. If the truth status is `claim_only`, the public summary says "The proposal claims..." — not "The proposal will...".

---

### E13 — Evidence Registry

**Group:** TRACE  
**Role:** Maintains the authoritative record of all source links attached to any claim

**Input:** `SourceLink` records from any engine or agent  
**Output:** Registered source links with validation status and retrieval timestamp

**Governing rule:** Every claim that appears in any output of any engine or agent must have a corresponding entry in the Evidence Registry. Unregistered claims are invalid. A claim with no source link is marked `unknown`.

**Source link types:** forum · codegov · dashboard · canister_query · review · release_notes · unknown

---

### E14 — Dispute/Correction Engine

**Group:** VERIFY  
**Role:** Manages corrections, disputed findings, and revision history

**Input:** Dispute submissions with evidence; correction requests with source links  
**Output:** Revised `EffectTraceRecord`; dispute records; version history

**Governing rule:** Every revision is versioned. The original trace is never deleted. A dispute does not override existing findings — it adds a dispute record that human reviewers must resolve. Resolution moves the trace to either `review_supported` (dispute resolved in favor of original) or `disputed` (unresolved) or a new truth status (if the dispute reveals new evidence).

---

### E15 — Render/Export Engine

**Group:** REMEMBER  
**Role:** Produces all output formats for all audiences

**Input:** `EffectTraceRecord` + `ProposalRecord` + public summary  
**Output:** Forum markdown · JSON · public web page data · review packet · future: PDF

**Formats:**
- **Forum markdown** — ready to paste into the ICP governance forum
- **JSON** — machine-readable structured trace data
- **Public page** — data structure for the certified public frontend canister
- **Review packet** — structured summary for human reviewers with evidence checklist
- **Operator report** — full trace with internal fields for operator dashboard

**Governing rule:** E15 applies different disclosure rules per format. The operator format shows all internal fields. The public format strips internal names and confidence scores below medium. The forum markdown includes the required disclaimer.

---

## Section 4 — The Pipeline Invariants

These rules apply to the pipeline as a whole:

1. **No engine fabricates data.** If a field is unknown, it is marked unknown.
2. **Every claim has a source link or is marked unknown.** No claim is made without E13 registration.
3. **Truth status advances only when conditions are met.** E5 is the gatekeeper. No engine bypasses E5.
4. **ANTE is locked before POST is allowed to exist.** E4 anchors ANTE before E10 can write MEDIUS. E10 anchors MEDIUS before E11/E8 can write POST.
5. **MEDIUS is immutable after anchoring.** No engine writes to a MEDIUS record after E10 has anchored it.
6. **Agent findings are reviewable.** E14 can correct any finding from any engine or agent.
7. **The pipeline runs in order.** E1 before E2 before E3 before E4. Parallel execution is permitted within a functional group but groups must complete in order.

---

*Engine Pipeline Charter · Medina Tech · Chaos Lab · Dallas, Texas · April 2026*  
*TRACE · VERIFY · REMEMBER*
