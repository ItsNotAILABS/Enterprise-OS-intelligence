# ICP CANISTER ARCHITECTURE CHARTER
## The Five-Canister Substrate of ORO

**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech · Chaos Lab · Dallas, Texas  
**Contact:** Medinasitech@outlook.com  
**Date:** April 2026  
**Subordinate to:** [Master Charter](MASTER-CHARTER.md) · [ORO Charter](ORO-CHARTER.md)

---

## Section 1 — Why Five Canisters

ORO is ICP-native. Not localStorage. Not a cloud database. Not a server that gets turned off.

The five-canister architecture reflects five functional domains that must be sovereign from each other:

| Domain | Why it is its own canister |
|:---|:---|
| Proposal Index | High-volume read/write; needs its own upgrade path; must not block trace operations |
| Effect Traces | Primary intelligence layer; has its own revision history; must survive independent of proposal index |
| Governance Memory | The pheromone field and precedent graph; grow indefinitely; must have dedicated stable memory |
| Agent Findings | High-frequency writes during processing; must be auditable; needs dispute state separate from traces |
| Public Frontend | Certified HTTP responses; read-only access pattern; must be upgradeable without touching data canisters |

Each canister is a sovereign compute unit. Each has its own stable memory. Each can be upgraded independently. Each owns the data it holds.

---

## Section 2 — Canister Specifications

### Canister 1 — Proposal Index Canister

**Language:** Motoko or Rust  
**Role:** The source of truth for all governance proposals that ORO has ever seen

**Stable storage:**
- Proposal records keyed by `proposalId`
- Index: NNS proposals by topic
- Index: SNS proposals by root canister ID
- Proposal-to-trace mapping
- Fetch timestamps per source

**Public query methods:**
```motoko
public query func getProposal(id: Text) : async ?ProposalRecord
public query func listProposals(filter: ProposalFilter) : async [ProposalRecord]
public query func countProposals() : async Nat
public query func getProposalsByStatus(status: Text) : async [ProposalRecord]
public query func getProposalsBySNS(rootCanisterId: Text) : async [ProposalRecord]
```

**Public update methods:**
```motoko
public shared func ingestProposal(input: ProposalInput) : async ProposalId
public shared func refreshProposalStatus(id: Text) : async RefreshResult
public shared func updateProposalExecution(id: Text, result: ExecutionResult) : async Result
```

**Governing rules:**
- A proposal ID, once assigned, is never reassigned or deleted
- Status updates are append-only (each status change is recorded with timestamp)
- The canister never holds data owned by another canister; proposals are canonical here

---

### Canister 2 — EffectTrace Canister

**Language:** Motoko or Rust  
**Role:** The primary intelligence store — holds all effect trace records

**Stable storage:**
- Effect trace records keyed by `traceId`
- Index: traces by proposalId
- Index: traces by risk class
- Index: traces by truth status
- Revision history per trace (append-only)
- ANTE/MEDIUS/POST state records (separately keyed and immutable after write)

**Public query methods:**
```motoko
public query func getTrace(id: Text) : async ?EffectTraceRecord
public query func getTraceByProposal(proposalId: Text) : async ?EffectTraceRecord
public query func listTraces(filter: TraceFilter) : async [EffectTraceSummary]
public query func getRevisionHistory(traceId: Text) : async [RevisionRecord]
public query func getAnteState(traceId: Text) : async ?ChronoState
public query func getMediusState(traceId: Text) : async ?ChronoState
public query func getPostState(traceId: Text) : async ?ChronoState
```

**Public update methods:**
```motoko
public shared func createTrace(input: TraceInput) : async TraceId
public shared func updateTrace(id: Text, patch: TracePatch) : async Result
public shared func publishTrace(id: Text) : async Result
public shared func lockAnteState(traceId: Text, state: ChronoState) : async Result
public shared func anchorMediusState(traceId: Text, state: ChronoState) : async Result
public shared func writePostState(traceId: Text, state: ChronoState, evidence: [SourceLink]) : async Result
```

**Governing rules:**
- ANTE state can be written once. It cannot be updated after locking.
- MEDIUS state can be written once (when execution is confirmed). It cannot be mutated after anchoring.
- POST state can only be written if MEDIUS exists for the same trace.
- Every update to a trace creates a revision record. Original data is never deleted.
- `publishTrace` transitions the trace from draft/internal to publicly visible. Once published, trace core fields are append-only (amendments create revisions).

---

### Canister 3 — Governance Memory Canister

**Language:** Motoko or Rust  
**Role:** The REMEMBER substrate — holds the governance pheromone field and precedent graph

**Stable storage:**
- Pheromone field as sparse matrix keyed by `(targetCanisterId, targetMethod, riskClass)`
- Memory links keyed by `linkId`
- Proposal-to-proposal precedent graph (adjacency list)
- Post-execution check records
- Repeated-risk pattern records
- Memory tick history (when did evaporation/diffusion last run)

**Public query methods:**
```motoko
public query func getGovernanceMemory(proposalId: Text) : async GovernanceMemory
public query func findRelatedProposals(proposalId: Text) : async [ProposalSummary]
public query func getFieldIntensity(targetId: Text, method: Text) : async Float
public query func getFieldSnapshot() : async [(Text, Float)]
public query func getPrecedentGraph(proposalId: Text, depth: Nat) : async PrecedentGraph
```

**Public update methods:**
```motoko
public shared func linkProposals(input: MemoryLinkInput) : async LinkId
public shared func depositToField(targetId: Text, method: Text, weight: Float) : async Result
public shared func tickField() : async FieldTickResult
public shared func addPostExecutionCheck(input: PostExecutionCheck) : async CheckId
public shared func recordPatternDetection(pattern: RepeatedRiskPattern) : async PatternId
```

**Governing rules:**
- Field values are always >= 0. Evaporation cannot push a field value below zero.
- Verified outcomes are deposited at 2× weight relative to unverified claims.
- Memory tick interval is enforced at the canister level; no external actor can force more than one tick per minimum interval.
- Precedent links are directional: source proposal → target proposal. A link is created when a reviewer or agent identifies the relationship; it is not inferred automatically.

---

### Canister 4 — Agent Findings Canister

**Language:** Motoko or Rust  
**Role:** The structured output store for all four agents

**Stable storage:**
- Agent findings keyed by `findingId`
- Index: findings by proposalId
- Index: findings by agent role
- Index: findings by severity
- Dispute records keyed by `disputeId`
- Review decisions keyed by `decisionId`

**Public query methods:**
```motoko
public query func getFindingsByProposal(proposalId: Text) : async [AgentFinding]
public query func getFinding(id: Text) : async ?AgentFinding
public query func getDisputeHistory(findingId: Text) : async [DisputeRecord]
public query func countCriticalFindings() : async Nat
```

**Public update methods:**
```motoko
public shared func submitFinding(input: AgentFindingInput) : async FindingId
public shared func reviewFinding(id: Text, decision: ReviewDecision) : async Result
public shared func disputeFinding(id: Text, dispute: DisputeInput) : async DisputeId
public shared func resolveDi spute(disputeId: Text, resolution: DisputeResolution) : async Result
```

**Governing rules:**
- No finding is deleted when disputed. The original finding record is preserved alongside the dispute.
- Only an authorized reviewer can mark a finding `confirmed` or `superseded`.
- A `CRITICAL` finding remains visible in all public views until it is either confirmed or disputed and resolved.
- Finding review decisions are hash-anchored to CHRONO at the moment of review.

---

### Canister 5 — Certified Public Frontend

**Language:** Motoko (asset canister) or Rust with certified variables  
**Role:** Public-facing web interface with certified HTTP responses

**Certification:** Uses IC certified assets or certified variables to provide tamper-evident responses. Clients can verify that the data they receive has not been modified in transit.

**Pages:**
- `/` — Governance Pulse (open high-risk proposals)
- `/proposals` — Proposal search and list
- `/proposals/:id` — Proposal detail with effect trace
- `/traces/:id` — Effect trace detail page
- `/risk-radar` — Risk radar (proposals by risk class and level)
- `/memory-graph` — Governance memory graph (placeholder → full in Pass 3)
- `/operator` — Operator dashboard (authenticated; operator-only)
- `/export/:id` — Markdown export for forum posts

**Governing rules:**
- The frontend canister is read-only with respect to data. It never writes to data canisters directly.
- The operator dashboard requires Internet Identity authentication.
- Public pages use certified HTTP responses so users can verify response authenticity.
- Internal agent names (ARCHON, VECTOR, LUMEN, FORGE) are not rendered on public pages.
- The required disclaimer is rendered on every trace detail page.

---

## Section 3 — Canister Communication

The canisters communicate through inter-canister calls, not through shared state:

```
Frontend → Proposal Index Canister (query)
Frontend → EffectTrace Canister (query)
Frontend → Governance Memory Canister (query)
Frontend → Agent Findings Canister (query)

ORO Organism (backend) → Proposal Index Canister (update)
ORO Organism (backend) → EffectTrace Canister (update)
ORO Organism (backend) → Governance Memory Canister (update)
ORO Organism (backend) → Agent Findings Canister (update)
```

The ORO organism (backend service) holds no permanent state itself. All state lives in the canisters. The organism is a stateless pipeline that reads from and writes to the canisters.

---

## Section 4 — Upgrade Discipline

**Pass-based upgrades:**
- Each canister has its own upgrade path. Upgrading Canister 2 does not require upgrading Canister 3.
- Pre-upgrade hooks preserve stable memory before every upgrade.
- Post-upgrade hooks validate that stable memory is consistent after the upgrade.
- A canister is not upgraded in production until the upgrade has been tested against a replica of the production stable memory.

**WASM verification:**
- Every canister upgrade is a governance proposal (at least internally). The WASM hash of each deployed module is recorded in CHRONO.
- ORO can trace its own canister upgrades through the same 15-engine pipeline it uses for governance proposals.

---

## Section 5 — Stable Memory Schema

Each canister's stable memory uses a versioned schema. The schema version is stored in a dedicated stable variable and checked on every post-upgrade hook. If the schema version has changed, the migration path is executed.

**Schema versioning format:** `{majorVersion}.{minorVersion}.{patchVersion}`

Schema changes that are backward-incompatible increment the major version and require a migration plan before the upgrade is executed.

---

*ICP Canister Architecture Charter · Medina Tech · Chaos Lab · Dallas, Texas · April 2026*  
*TRACE · VERIFY · REMEMBER*
