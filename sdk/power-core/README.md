# Power Core

**Package:** `@medina/power-core`  
**Version:** `0.1.0-alpha.1`  
**Classification:** RSHIP Virtual Chip Core  
**Author:** Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX

---

## Purpose

The Power Core manages energy distribution, compute allocation, cycle budgeting, and resource throttling within the RSHIP virtual chip. Every computation costs cycles. The Power Core ensures no entity exceeds its allocation and no core starves.

## Modules

| Module | Export Path | Purpose |
|:---|:---|:---|
| Energy Distributor | `./energy-distributor` | Distributes compute energy across cores proportionally |
| Compute Allocator | `./compute-allocator` | Assigns ICP cycles to entities based on priority and tier |
| Cycle Budget | `./cycle-budget` | Tracks cycle consumption, enforces budgets per department |
| Thermal Governor | `./thermal-governor` | Prevents runaway processes, enforces cooldown periods |
| Resource Throttle | `./resource-throttle` | Adaptive throttling under load — graceful degradation |

## Architecture

```
Cycle Pool ──→ [Energy Distributor] ──→ Core A (Neural)
                      │                  Core B (Generator)
                      │                  Core C (Resonance)
                      ▼
              [Compute Allocator] ──→ Entity assignments
                      │
              [Cycle Budget] ──→ Department tracking
                      │
              [Thermal Governor] ──→ Cooldown enforcement
                      │
              [Resource Throttle] ──→ Adaptive load management
```

## Pre-Booted

Power Core begins distributing energy at the moment of instantiation. The heartbeat drives the power cycle at φ Hz.

---

*Power Core · RSHIP-2026 · Medina Tech*
