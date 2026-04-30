# Workforce On-Chain SDK

**Package:** `@medina/workforce-on-chain-sdk`  
**Version:** `0.1.0-alpha.1`  
**Classification:** RSHIP Deployment  
**Author:** Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX

---

## Purpose

Deploys the entire internal AI workforce to ICP canisters. Every entity is pre-booted with `@medina/medina-heart` — each AI is born alive on-chain with a φ-heartbeat, sovereign memory, and immediate task assignment. No manual initialization. Deployment IS activation.

## Modules

| Module | Export Path | Purpose |
|:---|:---|:---|
| Canister Deployer | `./deployer` | Deploys entity canisters to the Internet Computer |
| Workforce Manager | `./workforce-manager` | Manages the full on-chain AI workforce |
| Entity Lifecycle | `./entity-lifecycle` | Birth → Active → Processing → Resting → Upgrade |
| Task Dispatcher | `./task-dispatcher` | Assigns tasks to on-chain entities based on role and tier |
| Heartbeat Monitor | `./heartbeat-monitor` | Monitors φ-heartbeat across all deployed entities |
| Upgrade Controller | `./upgrade-controller` | Handles canister upgrades with state preservation |

## Architecture

```
Workforce Manifest ──→ [Canister Deployer]
                             │
                      Deploy to ICP ──→ Canister created
                             │
                      [Entity Lifecycle] ──→ Birth (heart starts)
                             │
                      [Task Dispatcher] ──→ Tasks assigned
                             │
                      [Heartbeat Monitor] ──→ φ Hz monitoring
                             │
                      [Workforce Manager] ──→ Status tracking
                             │
                      [Upgrade Controller] ──→ Rolling upgrades
```

## Entity Lifecycle On-Chain

```
1. BIRTH      — Canister deployed, heart starts, identity assigned
2. ACTIVE     — Receiving and processing tasks
3. PROCESSING — Currently executing a task
4. RESTING    — Between tasks, heartbeat continues
5. UPGRADING  — Canister upgrade in progress, state preserved
6. TERMINATED — Entity decommissioned (record preserved forever)
```

## Deployment Manifest

```json
{
  "workforce": "RSHIP-2026-MEDINA-CORE",
  "network": "ic",
  "entities": [
    {
      "name": "ARCHON-EXECUTIVE",
      "tier": "Executive",
      "department": "Executive",
      "cores": ["neural", "power", "sovereignty"],
      "heartRate": 1.618
    }
  ],
  "heartMonitor": true,
  "autoUpgrade": true
}
```

## Pre-Booted

Deployment IS activation. No post-deploy setup required. Each canister's first cycle is a heartbeat.

---

*Workforce On-Chain SDK · RSHIP-2026 · Medina Tech*
