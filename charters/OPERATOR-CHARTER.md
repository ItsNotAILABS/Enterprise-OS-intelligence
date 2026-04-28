# OPERATOR DASHBOARD CHARTER
## The Builder's Observability Layer for ORO

**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech · Chaos Lab · Dallas, Texas  
**Contact:** Medinasitech@outlook.com  
**Date:** April 2026  
**Subordinate to:** [Master Charter](MASTER-CHARTER.md) · [ORO Charter](ORO-CHARTER.md)

---

## Section 1 — Purpose

The operator dashboard exists so the builder knows exactly what is going on.

Not approximately. Exactly.

The operator dashboard is not a product feature. It is the instrument panel of the organism. It gives the operator complete, unfiltered observability into the state of ORO, the state of ICP governance, and the state of the intelligence that ORO has accumulated.

This dashboard is private by default. It requires Internet Identity authentication. The public sees EffectTrace. The operator sees ORO.

---

## Section 2 — Dashboard Architecture

The operator dashboard reads from all five canisters and from the organism's live state. It is not a snapshot — it is a live view that updates every cycle.

**Authentication:** Internet Identity  
**Access level:** Operator only  
**Update frequency:** Every organism cycle (default: 1 hour)  
**Canister:** Rendered by the Certified Public Frontend Canister at `/operator`

---

## Section 3 — The Six Dashboard Sections

### Section 1: Live Governance Pulse

**What it answers:** What requires attention right now?

| Item | Condition |
|:---|:---|
| Open high-risk proposals | `status = open` AND `riskLevel ∈ {high, critical}` |
| Proposals nearing vote deadline | `status = open` AND `decidedAt < now + 24h` |
| Proposals adopted but not checked | `status = adopted` AND `traceStatus ≠ execution_pending` |
| Proposals executed — after-state unclear | `status = executed` AND `truthStatus = executed_not_verified` |
| Proposals with reviewer disagreement | `truthStatus = disputed` |
| Proposals with CRITICAL council status | `councilStatus = CRITICAL` AND `reviewStatus ≠ confirmed` |
| Overdue post-execution obligations | `PostExecutionCheck.status = overdue` |

The Pulse section is ordered by urgency. CRITICAL proposals with vote deadlines in the next 24 hours appear first.

---

### Section 2: Risk Radar

**What it answers:** Across all open governance, where is the risk concentrated?

The Risk Radar displays a structured breakdown of all open proposals by risk class and risk level:

```
CRITICAL
  Code Upgrades (n)
  Treasury Actions (n)
  Systemic/Emergency (n)

HIGH
  Governance Rule Changes (n)
  Canister Control Changes (n)
  Registry/Network Changes (n)
  Custom Generic Functions (n)

MEDIUM
  Parameter Changes (n)
  Frontend/Asset Changes (n)

LOW
  Motions (n)
  Other (n)
```

Each category is clickable to show the specific proposals in that risk class/level combination.

**Radar alert conditions:**
- Any CRITICAL proposal without reviewer coverage
- Any HIGH treasury action without reviewer coverage
- Any governance rule change without human confirmation
- Any custom generic function without Execution Trace agent findings

---

### Section 3: Effect Graph

**What it answers:** How are governance decisions related to each other?

The Effect Graph is a visual representation of the precedent graph from the Governance Memory Canister.

For any selected proposal, the graph shows:
- What proposals preceded this one (what governance history led here)
- What this proposal targets (canister → method → state change)
- What proposals extend or reverse this one (follow-on governance)
- What follow-up obligations remain open from this proposal

The graph is navigable. The operator can traverse the precedent graph to trace governance sequences across time.

---

### Section 4: Memory Thread

**What it answers:** For any specific proposal, what is its complete story?

For any proposal the operator selects, the Memory Thread shows:

1. **What led to this** — prior proposals in the precedent graph
2. **What this changes** — the full effect trace including ANTE state, expected POST state
3. **Who reviewed it** — reviewer names, review links, CodeGov findings
4. **What happened after** — MEDIUS state, POST state, verification result
5. **What future proposals depend on it** — follow-on governance
6. **What precedent it created** — field intensity change at its target position
7. **Open obligations** — post-execution checks that are pending or overdue

The Memory Thread is how the operator moves from "a proposal exists" to "a complete picture of what it is and where it sits in governance history."

---

### Section 5: Truth Status Board

**What it answers:** Where is every proposal in the verification lifecycle?

The Truth Status Board shows every proposal ORO is tracking, organized by truth status:

| Status | Count | Oldest | Most recent |
|:---|:---|:---|:---|
| Claim Only | n | ... | ... |
| Payload Identified | n | ... | ... |
| Review Supported | n | ... | ... |
| Execution Pending | n | ... | ... |
| Executed — Unverified | n | ... | ... |
| After-State Verified | n | ... | ... |
| Disputed | n | ... | ... |
| Unknown | n | ... | ... |

The `Executed — Unverified` and `Disputed` rows are the operator's action queue. These are proposals where the organism has detected an execution or a dispute but the truth status has not advanced because the verification evidence is missing.

**Alert condition:** If any proposal has been in `Executed — Unverified` for more than `DEFAULT_VERIFICATION_DEADLINE` cycles, an alert is emitted.

---

### Section 6: Watchlist

**What it answers:** What is happening with the things I specifically care about?

The operator configures the watchlist at deployment time. The watchlist can track:

- Specific SNS DAOs (by root canister ID)
- Specific NNS proposal types (e.g., all `InstallCode` proposals)
- Specific canisters (by canister ID)
- Specific known neurons (by neuron ID)
- Proposal risk categories (e.g., all `treasury_action` proposals)
- Governance rule changes (all proposals of type `governance_rule_change`)

Every item on the watchlist generates a dedicated feed showing all proposals that match the watchlist condition, in chronological order with their current truth status and risk level.

---

## Section 4 — The Alert Stream

The operator dashboard includes a persistent alert stream showing all alerts generated by the organism:

**Alert types:**

| Alert | Trigger | Severity |
|:---|:---|:---|
| `CRITICAL_NO_COVERAGE` | CRITICAL risk proposal with no reviewer evidence within 12h of creation | CRITICAL |
| `HIGH_TREASURY_NO_REVIEW` | HIGH risk treasury action without reviewer confirmation | HIGH |
| `EXECUTION_UNVERIFIED_OVERDUE` | Executed proposal without after-state verification past deadline | HIGH |
| `DISPUTE_UNRESOLVED` | Disputed trace with no human resolution after 24h | MEDIUM |
| `VOTE_DEADLINE_APPROACHING` | Open proposal with vote deadline < 24h and no trace confidence above `low` | MEDIUM |
| `COUNCIL_STATUS_CRITICAL` | Agent council produced CRITICAL status | CRITICAL |
| `PATTERN_DETECTED` | Memory canister detected a repeated risk pattern | HIGH |
| `MEMORY_FIELD_ANOMALY` | Field intensity spike at a position without a corresponding proposal | WATCH |

Alerts are persisted in CHRONO. Every alert has a timestamp, a proposalId, a description, and a resolution status.

---

## Section 5 — The Organism Status Panel

The operator dashboard includes a live organism status panel showing:

| Field | What it shows |
|:---|:---|
| `alive` | Whether the organism is running |
| `cycleCount` | How many autonomous cycles have completed |
| `startedAt` | When the organism started |
| `proposals` | Total proposals ingested |
| `traces` | Total effect traces created |
| `watchQueue` | Current size of the post-execution watch queue |
| `critical` | Open proposals with CRITICAL risk level |
| `pendingVerification` | Proposals in `executed_not_verified` state |
| `disputed` | Proposals in `disputed` state |
| `memoryField` | Current pheromone field snapshot (top 10 hottest positions) |
| `meridianSync` | NEXORIS order parameter (if MERIDIAN is wired in) |

This panel is the organism's vital signs readout.

---

## Section 6 — The Operator Modes

The operator dashboard supports four access modes. Each mode is a different view of the same underlying data.

| Mode | For | What it shows |
|:---|:---|:---|
| **Operator Mode** | Builder (default) | All sections, full internal state, all agent findings, all alerts, memory graph |
| **Reviewer Mode** | Technical reviewers | Trace pages with evidence submission, finding confirmation/dispute, after-state verification |
| **Public Mode** | Community | Effect trace browsing, proposal search, markdown export, community notes |
| **Builder Mode** | Development | Canister methods, schema browser, ingestion queue, agent task status, source adapter health |

The operator grants access to Reviewer Mode via Internet Identity principal. Public Mode requires no authentication. Builder Mode is restricted to the operator's own Internet Identity.

---

*Operator Dashboard Charter · Medina Tech · Chaos Lab · Dallas, Texas · April 2026*  
*TRACE · VERIFY · REMEMBER*
