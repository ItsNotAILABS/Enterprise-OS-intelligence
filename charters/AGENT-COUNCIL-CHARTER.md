# AGENT COUNCIL CHARTER
## The Four-Agent Review System of ORO

**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech · Chaos Lab · Dallas, Texas  
**Contact:** Medinasitech@outlook.com  
**Date:** April 2026  
**Subordinate to:** [Master Charter](MASTER-CHARTER.md) · [ORO Charter](ORO-CHARTER.md)

---

## Section 1 — Identity

The Agent Council is the analysis layer of ORO. It consists of four agents that run independently on every trace record, produce structured findings, and report their severity. The council does not vote. It does not elect a leader. It does not reach consensus by authority.

The council crystallizes — based on the QUORUM model (Paper XXI). When the evidence density is sufficient, the council status resolves. When it is not, the status remains open.

| Public Name | Internal Name | Word |
|:---|:---|:---|
| Integrity Check | ARCHON | TRACE |
| Execution Trace | VECTOR | TRACE |
| Context Map | LUMEN | REMEMBER |
| Verification Lab | FORGE | VERIFY |

---

## Section 2 — The Council Model

The council does not use authority to resolve disagreement. It uses evidence density.

Based on QUORUM (Paper XXI): The honeybee swarm does not vote. It reaches quorum when enough sovereign agents independently arrive at the same conclusion at the same time. The swarm crystallizes.

The council operates the same way. Each agent runs independently and deposits a finding. The council status is a derived property of the finding set — not a negotiated outcome.

**Council status derivation:**

```
If any agent produces a CRITICAL finding:
  → councilStatus = CRITICAL
  → trace advances to NEEDS_REVIEW
  → operator alert is emitted

If one or more agents produce WARNING findings (and no CRITICAL):
  → councilStatus = NEEDS_REVIEW
  → trace is flagged for human attention

If one or more agents produce WATCH findings (and no WARNING or CRITICAL):
  → councilStatus = WATCH
  → trace continues processing; operator is informed

If all agents produce INFO only:
  → councilStatus = CLEAR
  → trace continues to public summary

If evidence is insufficient for any agent to assess:
  → councilStatus = UNKNOWN
  → trace truth status remains at claim_only
```

---

## Section 3 — Agent Specifications

### Agent 1: Integrity Check (ARCHON)

**Word:** TRACE  
**Internal name:** ARCHON (not exposed publicly)  
**Public name:** Integrity Check

**Mission:** Find mismatches between what the proposal claims and what the payload actually does.

**What ARCHON checks:**

1. **Summary/payload mismatch** — Does the proposal title/summary accurately describe the payload action?
2. **Unclear claims** — Are there vague phrases in the summary that could mean different things? ("improve security" — what specifically? which canister? which method?)
3. **Missing evidence** — Is critical information absent? (WASM hash not provided? No target canister specified? Treasury amount unspecified?)
4. **Hidden risk** — Does the proposal have a secondary effect not mentioned in the summary? (An `InstallCode` proposal that also changes governance parameters? A parameter change that implicitly enables a previously blocked function?)
5. **Summary inconsistency** — Does different language in the summary, URL, and forum post tell different stories about what the proposal does?

**Severity rules:**
- CRITICAL: Payload targets a different canister than the summary claims · Treasury amount exceeds stated amount · The execution mechanism contradicts the stated intent
- WARNING: Summary is vague about the target · Evidence is missing but proposal type is high-risk · Forum post and proposal summary disagree
- WATCH: Minor language ambiguity · One missing evidence field on a low-risk proposal
- INFO: All claims are consistent and evidence is present

**Output format:**
```json
{
  "agent": "integrity",
  "finding": "string — specific description of the integrity concern",
  "severity": "info | watch | warning | critical",
  "evidence": [SourceLink],
  "reviewStatus": "pending"
}
```

---

### Agent 2: Execution Trace (VECTOR)

**Word:** TRACE  
**Internal name:** VECTOR (not exposed publicly)  
**Public name:** Execution Trace

**Mission:** Map the actual on-chain execution path of the proposal.

**What VECTOR traces:**

1. **Which governance system executes** — NNS governance canister? SNS governance canister?
2. **Which function is called** — `install_code`? `update_settings`? `disburse`? custom generic function?
3. **Which canister is the target** — fully resolved canister ID and known name
4. **Which arguments are passed** — decoded from the payload where possible
5. **What state is expected to change** — based on the function semantics
6. **What the before-state is** — ANTE state from E4
7. **What the expected after-state is** — based on execution semantics
8. **Whether execution is deterministic** — will the same payload always produce the same result? (WASM upgrades generally are; parameter changes generally are; some generic functions may not be)

**VECTOR and the ANTE/MEDIUS/POST triple:**

VECTOR is responsible for defining the specific on-chain queries that will capture the MEDIUS and POST states. For every execution trace, VECTOR produces a canister query specification:

```
Query the following to capture POST state:
  Canister: <id>
  Method: <method>
  Arguments: <args>
  Expected return: <expected>
```

**Severity rules:**
- CRITICAL: Cannot determine target canister · Cannot decode payload · Execution mechanism is ambiguous
- WARNING: Target is partially resolved · Method semantics are unclear · Arguments cannot be decoded
- WATCH: Some fields resolved but confidence is medium
- INFO: Full execution path mapped with high confidence

---

### Agent 3: Context Map (LUMEN)

**Word:** REMEMBER  
**Internal name:** LUMEN (not exposed publicly)  
**Public name:** Context Map

**Mission:** Place the proposal in the governance memory context — what came before, what is happening around it, and what comes after.

**What LUMEN maps:**

1. **Related prior proposals** — proposals that targeted the same canister, method, or parameter
2. **Precedent created** — if this proposal passes, what precedent does it set for future proposals?
3. **Governance history** — has this type of change been made before? How was it received?
4. **Forum context** — what is the community saying about this proposal? Are there significant objections not mentioned in the proposal?
5. **Ecosystem context** — does this affect other SNS DAOs, dapps, or ecosystem participants beyond the stated scope?
6. **Long-term effect** — does this proposal open or close a governance path that was not previously available?
7. **Reviewer notes** — what have known reviewers said?

**LUMEN and the memory field:**

LUMEN reads from the governance pheromone field (E9) to find related proposals. Field intensity at a given (canister × method) position is proportional to how many prior proposals have targeted that position. High field intensity means this target has been frequently governed. LUMEN interprets field intensity as governance attention concentration.

**Severity rules:**
- CRITICAL: This proposal directly reverses a recently verified prior proposal without explanation · This proposal is the second in a sequence that together would achieve an undisclosed outcome
- WARNING: Related proposals exist that this proposal should have referenced but did not · Forum discussion contains significant reviewer concerns not addressed in the proposal
- WATCH: Tangentially related proposals exist · Community discussion is active
- INFO: Full context map built; no anomalies detected

---

### Agent 4: Verification Lab (FORGE)

**Word:** VERIFY  
**Internal name:** FORGE (not exposed publicly)  
**Public name:** Verification Lab

**Mission:** Generate the concrete verification plan for confirming the after-state.

**What FORGE produces:**

1. **Verification steps** — ordered list of specific actions to verify the after-state
2. **Canister query specifications** — which canister to query, which method, what arguments, what the expected return is
3. **Dashboard links** — ICP dashboard pages that will reflect the change
4. **Release note checks** — for code upgrades, where to find the release notes and what to verify
5. **Hash verification steps** — for WASM upgrades, how to verify the module hash against the proposal
6. **Post-execution checklist** — a complete checklist for the reviewer to sign off after execution
7. **Timing notes** — some effects are not immediate (e.g., a governance parameter change may take effect after the next governance tick)

**FORGE and the MEDIUS baseline:**

FORGE defines the exact MEDIUS capture specification — what must be recorded the moment execution is confirmed so that the POST state can be diffed against it. Without a FORGE-specified MEDIUS capture, the after-state cannot be verified.

**Severity rules:**
- CRITICAL: Cannot determine how to verify this proposal's after-state · No on-chain evidence of execution is observable
- WARNING: Verification is possible but requires elevated access · Verification depends on off-chain evidence
- WATCH: Verification steps exist but are partially manual
- INFO: Full verification plan with concrete automated steps

---

## Section 4 — Finding Lifecycle

Every agent finding goes through the following lifecycle:

```
pending    → the finding has been generated but not reviewed by a human
confirmed  → a human reviewer has confirmed the finding is accurate
disputed   → a human reviewer has disputed the finding
superseded → a newer finding has replaced this finding (correction applied)
```

Disputed findings do not disappear. They remain in the record with their dispute history. The trace truth status advances to `disputed` when any finding is disputed and unresolved.

**Governing rule:** No agent finding is final. The Dispute/Correction Engine (E14) can accept a dispute from any participant, attach evidence, and flag the finding for human resolution.

---

## Section 5 — The Council and CodeGov

The Agent Council is not a replacement for human technical review. It is a structured analysis layer that prepares human reviewers to do their work more efficiently.

The council's relationship to CodeGov:

| CodeGov role | Agent Council role |
|:---|:---|
| Technical review of code changes | Integrity Check and Execution Trace map the claim/payload |
| Reviewer ratings and comments | Reviewer Integration Engine (E8) ingests CodeGov reviews as evidence |
| Forum discussion tracking | Context Map links forum discussion to the trace |
| None | Verification Lab generates the post-execution checklist |
| None | Council status alerts operator when coverage is missing |

The Agent Council alerts the operator when a critical or high-risk proposal has arrived without reviewer coverage. This is not a judgment on the proposal — it is a signal that human attention is needed.

---

## Section 6 — Internal vs Public Naming

The internal names (ARCHON, VECTOR, LUMEN, FORGE) are not exposed in any public-facing output until the builder authorizes it.

All public output uses:
- Integrity Check
- Execution Trace
- Context Map
- Verification Lab

This naming discipline is maintained in E12 (Public Summary Engine) and E15 (Render/Export Engine) at the output layer.

---

*Agent Council Charter · Medina Tech · Chaos Lab · Dallas, Texas · April 2026*  
*TRACE · VERIFY · REMEMBER*
