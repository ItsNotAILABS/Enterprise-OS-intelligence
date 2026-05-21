# Polyrepo Build-Out Blueprint

This folder captures the concrete build-out for the three approved repository identities:

- `alpha-core`
- `omega-mesh`
- `emergent-nexus`

## Responsibility Matrix

| Repository | Primary ownership | What belongs here | What does not belong here |
|---|---|---|---|
| `alpha-core` | Core domain intelligence and canonical contracts | Core domain models, canonical contracts, shared domain services, validation rules, stable interfaces | Environment-specific deployment logic, edge transport adapters, experimental orchestration prototypes |
| `omega-mesh` | Runtime orchestration and cross-system coordination | Routing/orchestration services, workflow agents, mesh coordination logic, integration adapters, runtime policies | Canonical domain ownership, long-term memory substrate ownership, business-domain source of truth |
| `emergent-nexus` | Learning/memory substrate and emergent intelligence systems | Memory models, synthesis/insight engines, long-horizon learning loops, emergence analytics, intelligence evolution services | Low-level transport concerns, vendor-specific infra glue, canonical transactional domain boundaries |

## Shared Folder Convention (applies to each repo)

- `apps/` — deployable applications/APIs
- `services/` — domain and business services
- `agents/` — autonomous agent implementations
- `models/` — intelligence models/substrate logic
- `contracts/` — schemas, APIs, and interfaces
- `infra/` — infrastructure and deployment configuration
- `docs/` — architecture, ADRs, and operational docs
- `tests/` — integration/end-to-end/system tests

## Boundary Rules

1. Canonical domain contracts are authored in `alpha-core` and consumed elsewhere.
2. Runtime coordination is authored in `omega-mesh`; it orchestrates but does not become domain source-of-truth.
3. Emergent learning and memory lifecycle logic is authored in `emergent-nexus`.
4. Cross-repo interactions should use explicit contracts and versioned interfaces only.
5. Any shared primitive required by all three repos should start in `alpha-core/contracts` and be versioned before adoption.

## Scaffold Included

This directory includes pre-created scaffold trees for each repo with the standardized folder convention so implementation can begin immediately.
