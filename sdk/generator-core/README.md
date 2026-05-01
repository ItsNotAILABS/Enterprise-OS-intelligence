# Generator Core

**Package:** `@medina/generator-core`  
**Version:** `0.1.0-alpha.1`  
**Classification:** RSHIP Virtual Chip Core  
**Author:** Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX

---

## Purpose

The Generator Core handles entity creation, code synthesis, canister spawning, and artifact production within the RSHIP virtual chip. This is the productive output — where intelligence becomes action and new entities are born.

## Modules

| Module | Export Path | Purpose |
|:---|:---|:---|
| Entity Generator | `./entity-generator` | Births new AI entities with personality, role, and tier |
| Code Synthesizer | `./code-synthesizer` | Generates executable code from specifications |
| Canister Spawner | `./canister-spawner` | Deploys new ICP canisters for entity housing |
| Agent Birther | `./agent-birther` | Uses `@medina/birth-ai` to create immediately-alive agents |
| Artifact Producer | `./artifact-producer` | Generates documents, reports, analyses as output artifacts |

## Architecture

```
Specification ──→ [Code Synthesizer] ──→ Executable Code
                         │
Role Definition ──→ [Entity Generator] ──→ Entity Record
                         │
                  [Agent Birther] ──→ Living AI (heartbeat active)
                         │
                  [Canister Spawner] ──→ On-chain housing
                         │
                  [Artifact Producer] ──→ Output documents
```

## Pre-Booted

The Generator Core is ready to birth entities from the moment of instantiation. Each generated entity inherits a heartbeat from `@medina/medina-heart` — born alive.

---

*Generator Core · RSHIP-2026 · Medina Tech*
