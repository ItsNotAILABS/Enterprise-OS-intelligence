# EFFECTTRACE CHARTER
## Public Face of the ORO Governance Organism

**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech · Chaos Lab · Dallas, Texas  
**Contact:** Medinasitech@outlook.com  
**Date:** April 2026  
**Subordinate to:** [Master Charter](MASTER-CHARTER.md) · [ORO Charter](ORO-CHARTER.md)

---

## Section 1 — Identity

| Field | Value |
|:---|:---|
| **Public Name** | EffectTrace |
| **Full Name** | EffectTrace — Governance Consequence Intelligence for ICP |
| **Powered By** | ORO Governance Organism |
| **Technical Class** | ICP-native governance intelligence public interface |
| **Audience** | ICP token holders · governance participants · SNS DAO members · technical reviewers · neuron operators |
| **Public Headline** | Trace what governance proposals actually change |
| **Public Promise** | Know what a proposal changes before it passes, verify what changed after it executes, and remember what it means for future governance |

---

## Section 2 — What EffectTrace Does

EffectTrace is the public face of ORO. Everything the public sees, reads, exports, and shares comes through the EffectTrace layer. ORO's internal engines, agents, and organism name are not exposed publicly until the builder authorizes it.

EffectTrace provides:

### For Every Governance Proposal
- **Effect Trace** — what the proposal claims to change, what canister/method/parameter is actually targeted, what the expected before and after states are
- **Risk Label** — the risk class (code upgrade, treasury action, governance rule change, etc.) and risk level (low / medium / high / critical)
- **Truth Status Label** — what has been confirmed vs only claimed
- **Verification Checklist** — concrete steps to confirm the effect after execution
- **Before/After Explanation** — plain language description suitable for the forum
- **Public Summary** — forum-safe explanation that does not use internal doctrine language

### For the Community
- Proposal search
- Effect trace browsing
- Markdown export for forum posts
- Community note submission
- Public risk category browsing

### For Reviewers
- Evidence submission
- Finding confirmation/dispute
- After-state verification marking
- Review linking (CodeGov, forum, dashboards)

### For the Operator
- Full governance pulse dashboard
- Risk radar
- Memory graph
- Watchlist
- Alert stream

---

## Section 3 — Public Language Guardrails

The following language rules apply to every public-facing output:

| Forbidden | Reason |
|:---|:---|
| Recommend adopt or reject | EffectTrace traces consequences; it does not advise votes |
| Claim DFINITY affiliation or approval | EffectTrace is independently built |
| Use internal names (ORO, NEXORIS, COGNOVEX, ARCHON, VECTOR, LUMEN, FORGE) publicly | Internal doctrine is not public yet |
| Mark anything verified without evidence | `verified_after_state` requires source-linked evidence against MEDIUS |
| Call anything "safe" or "dangerous" | Risk labels describe class and level; they do not make safety claims |

### The Required Disclaimer

Every EffectTrace page includes:

> *EffectTrace traces the on-chain consequences of ICP governance proposals. It does not recommend voting decisions. Findings are evidence-gated: nothing is marked verified unless source-linked evidence against a confirmed baseline exists. Agent findings are reviewable and disputable. EffectTrace is not affiliated with DFINITY.*

---

## Section 4 — The Public Mode Stack

### Layer 0 — Public Interface

What every visitor sees:

- Clean non-hype UI
- Proposal search
- Effect trace pages with risk labels
- Before/after explanation in plain language
- Verification checklist (public view)
- Markdown export
- Truth status label per proposal
- Community notes

Public language stays simple. No acronyms from internal architecture. No claims beyond what evidence supports.

### Layer 1 — Reviewer Interface

For technical reviewers:

- Add evidence sources
- Submit structured findings
- Confirm or dispute existing findings
- Mark after-state verified (with attached evidence)
- Link CodeGov and forum review artifacts

### Layer 2 — Operator Dashboard

For the builder:

- Private access
- Full organism state
- All agent findings
- Risk alerts
- Memory graph
- Follow-up obligation queue
- Emerging governance patterns
- Live governance pulse

---

## Section 5 — The Four Public Agent Labels

| Public Label | What It Reports |
|:---|:---|
| **Integrity Check** | Whether the proposal summary matches the payload; whether claims are verifiable; whether key evidence is missing |
| **Execution Trace** | What canister is called, what method, what arguments, what state is expected to change |
| **Context Map** | Related prior proposals; governance history; forum discussion; reviewer notes; ecosystem context |
| **Verification Lab** | Concrete steps to confirm the after-state; canister query suggestions; dashboard links; release note checks |

These are the public names. The internal agent names (ARCHON, VECTOR, LUMEN, FORGE) are not exposed.

---

## Section 6 — The Truth Status Display

Every proposal displayed in EffectTrace carries one of eight truth status labels:

| Label | What it means |
|:---|:---|
| `Claim Only` | The proposal has been ingested but only the summary/title has been assessed. No payload analysis. |
| `Payload Identified` | The proposal payload has been parsed and the target canister/method has been identified |
| `Review Supported` | A human reviewer has confirmed or provided evidence for the effect path |
| `Execution Pending` | The proposal has been adopted; execution has not yet been confirmed |
| `Executed — Unverified` | Execution has been observed on-chain; after-state has not been verified against a baseline |
| `After-State Verified` | The post-execution state has been confirmed with source-linked evidence against the MEDIUS baseline |
| `Disputed` | One or more findings are disputed; the trace requires human resolution |
| `Unknown` | Insufficient information to assess any component of the effect path |

---

## Section 7 — The Public Risk Label System

Every traced proposal receives a risk class and risk level.

**Risk Classes:**
- Motion (no direct on-chain effect)
- Parameter Change
- Code Upgrade
- Treasury Action
- Governance Rule Change
- Canister Control Change
- Frontend / Asset Change
- Registry / Network Change
- Custom Generic Function
- Systemic / Emergency
- Unknown

**Risk Levels:** Low · Medium · High · Critical · Unknown

The risk label is not a safety claim. It describes the category and magnitude of the governance action based on the φ-weighted scoring model. It does not advise the voter.

---

## Section 8 — The Markdown Export

Every EffectTrace record can be exported as a markdown forum post. The export format:

```markdown
## [EffectTrace] Proposal #<ID> — <Title>

**Risk Class:** <class> | **Risk Level:** <level>
**Truth Status:** <status>
**Traced:** <date>

---

### What This Proposes
<plain language summary>

### Effect Path
**Targets:** <canister> / <method>  
**Expected Change:** <expected state change>  
**Before State:** <before state if known>  

### Integrity Check
<integrity agent finding>

### Execution Trace
<execution trace finding>

### Verification Steps
1. <step>
2. <step>
...

### Context
<context map finding>

---

*EffectTrace — Governance Consequence Intelligence for ICP*  
*This trace does not recommend voting decisions.*  
*Nothing is marked verified without source-linked evidence.*
```

---

## Section 9 — Relationship to the Research Series

EffectTrace is the living implementation of:

| Paper | Title | What it provides |
|:---|:---|:---|
| I | SUBSTRATE VIVENS | The ICP substrate that makes EffectTrace possible |
| XX | STIGMERGY | The TRACE word — governance pheromone field |
| XXI | QUORUM | The VERIFY word — truth crystallization without authority |
| XXII | AURUM | The REMEMBER word — φ-compounding governance memory |
| XXIII | ORO GOVERNANCE INTELLIGENCE | The full organism specification |
| XXIV | ANTE · MEDIUS · POST | The chrono state triple — before/execution/after |
| XXV | PROTOCOLLUM CONSEQUENTIAE | The formal governance consequence protocol |

---

*EffectTrace Charter · Powered by ORO · Medina Tech · Chaos Lab · Dallas, Texas · April 2026*  
*Trace what governance proposals actually change.*
