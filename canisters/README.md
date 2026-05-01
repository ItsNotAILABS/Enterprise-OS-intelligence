# ICP Motoko Canisters — ORO Five-Canister Architecture

**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech · Chaos Lab · Dallas, Texas  
**Date:** April 2026  
**Governed by:** [Canister Charter](../charters/CANISTER-CHARTER.md) · [Master Charter](../charters/MASTER-CHARTER.md)

---

## Overview

Five sovereign Motoko canisters for ICP deployment. Each canister owns its own stable memory, upgrade path, and data. No shared state — communication happens through inter-canister calls.

```
┌──────────────────────────────────────────────────────────────────┐
│                    ORO ORGANISM (stateless)                       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Proposal │  │  Effect  │  │Governance│  │  Agent   │        │
│  │  Index   │  │  Trace   │  │  Memory  │  │ Findings │        │
│  │ (Can. 1) │  │ (Can. 2) │  │ (Can. 3) │  │ (Can. 4) │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              AI Entity Workforce (Can. 5)                │    │
│  │  φ-based hearts · planetary brains · persistent memory   │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

## Canisters

### Canister 1 — ProposalIndex.mo

Source of truth for all governance proposals (NNS, SNS, Internal).

| Method | Type | Description |
|:---|:---|:---|
| `getProposal(id)` | query | Get proposal by ID |
| `listProposals(filter)` | query | List with status/topic/source filters |
| `countProposals()` | query | Total count |
| `getProposalsByStatus(status)` | query | Filter by status string |
| `getProposalsBySNS(rootCanisterId)` | query | Filter by SNS root |
| `ingestProposal(input)` | update | Ingest new proposal → returns ID |
| `refreshProposalStatus(id)` | update | Refresh from source |
| `updateProposalExecution(id, result)` | update | Record execution outcome |

### Canister 2 — EffectTrace.mo

Primary intelligence store with ANTE/MEDIUS/POST chronological states.

| Method | Type | Description |
|:---|:---|:---|
| `getTrace(id)` | query | Get full trace record |
| `getTraceByProposal(proposalId)` | query | Lookup by proposal |
| `listTraces(filter)` | query | List with risk/truth/proposal filters |
| `getRevisionHistory(traceId)` | query | Append-only revision log |
| `getAnteState(traceId)` | query | Pre-execution state |
| `getMediusState(traceId)` | query | Execution state |
| `getPostState(traceId)` | query | Post-execution state |
| `createTrace(input)` | update | Create new trace |
| `updateTrace(id, patch)` | update | Patch fields (creates revision) |
| `publishTrace(id)` | update | Draft → Published |
| `lockAnteState(traceId, state)` | update | Write-once ANTE lock |
| `anchorMediusState(traceId, state)` | update | Write-once MEDIUS anchor |
| `writePostState(traceId, state, evidence)` | update | Requires MEDIUS exists |

### Canister 3 — GovernanceMemory.mo

Stigmergic pheromone field and precedent graph.

| Method | Type | Description |
|:---|:---|:---|
| `getGovernanceMemory(proposalId)` | query | Memory summary for proposal |
| `findRelatedProposals(proposalId)` | query | Precedent-linked proposals |
| `getFieldIntensity(targetId, method)` | query | Pheromone intensity |
| `getFieldSnapshot()` | query | Full field state |
| `getPrecedentGraph(proposalId, depth)` | query | BFS traversal to depth |
| `linkProposals(input)` | update | Create directional precedent link |
| `depositToField(targetId, method, weight)` | update | Add pheromone |
| `tickField()` | update | Evaporation cycle (60s minimum) |
| `addPostExecutionCheck(input)` | update | 2× weight if verified |
| `recordPatternDetection(pattern)` | update | Track repeated risks |

### Canister 4 — AgentFindings.mo

Structured output for ARCHON, VECTOR, LUMEN, FORGE agents.

| Method | Type | Description |
|:---|:---|:---|
| `getFindingsByProposal(proposalId)` | query | All findings for a proposal |
| `getFinding(id)` | query | Single finding by ID |
| `getDisputeHistory(findingId)` | query | Dispute chain |
| `countCriticalFindings()` | query | Unresolved critical count |
| `submitFinding(input)` | update | Submit new finding |
| `reviewFinding(id, decision)` | update | Confirm/supersede |
| `disputeFinding(id, dispute)` | update | Dispute (original preserved) |
| `resolveDispute(disputeId, resolution)` | update | Resolve dispute |

### Canister 5 — AIEntity.mo ✨ NEW

On-chain AI workforce — Motoko version of the internal AI entities.

| Method | Type | Description |
|:---|:---|:---|
| `getEntity(id)` | query | Get entity record |
| `listEntities(filter)` | query | Filter by dept/tier/status |
| `countByDepartment()` | query | Entity count per department |
| `countEntities()` | query | Total workforce size |
| `getEntityMemory(entityId)` | query | Entity's memory store |
| `getEntityTasks(entityId)` | query | Entity's task queue |
| `getTotalHeartbeats()` | query | Cumulative heartbeats |
| `getWorkforceStatus()` | query | Aggregate workforce metrics |
| `birthEntity(input)` | update | Create entity (born alive) |
| `heartbeat(entityId)` | update | Record φ-based heartbeat |
| `storeMemory(entityId, key, value, cat, importance)` | update | Persist memory entry |
| `assignTask(entityId, description, priority)` | update | Queue task |
| `completeTask(entityId, taskId, result)` | update | Mark task done |
| `updateStatus(entityId, status)` | update | Change entity status |
| `terminateEntity(entityId)` | update | Terminate (record preserved) |

## Shared Types — Types.mo

All type definitions live in `src/Types.mo`. No canister redefines types locally. Categories:

- **Proposal types** — ProposalRecord, ProposalInput, ProposalFilter, etc.
- **Trace types** — EffectTraceRecord, ChronoState, RevisionRecord, etc.
- **Memory types** — GovernanceMemory, PrecedentGraph, FieldTickResult, etc.
- **Finding types** — AgentFinding, DisputeRecord, ReviewDecision, etc.
- **Entity types** — AIEntityRecord, EntityTier, HeartConfig, BrainConfig, etc.

## Deployment

```bash
# Install dfx
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Start local replica
cd canisters
dfx start --background

# Deploy all five canisters
dfx deploy

# Or deploy individually
dfx deploy proposal_index
dfx deploy effect_trace
dfx deploy governance_memory
dfx deploy agent_findings
dfx deploy ai_entity
```

## Testing (via dfx canister call)

```bash
# Ingest a proposal
dfx canister call proposal_index ingestProposal '(record { source = variant { NNS }; title = "Test Proposal"; summary = "Test summary"; topic = "governance"; rootCanisterId = null })'

# Birth an AI entity
dfx canister call ai_entity birthEntity '(record { name = "ARCHON-1"; role = "analyzer"; department = "Engineering"; tier = variant { Specialist }; heartConfig = record { numHearts = 3; baseIntervalNs = 618_033_988; phiMultiplier = 1.618 }; brainConfig = record { numBrains = 3; baseIntervalNs = 1_000_000_000; thinkingModel = "fibonacci" } })'

# Check workforce status
dfx canister call ai_entity getWorkforceStatus
```

## Upgrade Discipline

- Each canister has independent upgrade path
- `preupgrade` serializes runtime state to stable variables
- `postupgrade` rebuilds runtime state from stable variables
- Schema version tracked per canister (`_schemaVersion`)
- WASM hash recorded in CHRONO on every upgrade

---

*ICP Motoko Canisters · Medina Tech · Chaos Lab · Dallas, Texas · April 2026*  
*TRACE · VERIFY · REMEMBER*
