# @medina/meridian-sovereign-os — v1.0.0

**MERIDIAN SUBSTRATE** — the sovereign operating system that runs underneath your existing enterprise stack and connects all of it.

**Creator:** Alfredo Medina Hernandez · Dallas, Texas · Medinasitech@outlook.com  
**Forge:** Medina Tech

---

## What This Is

MERIDIAN is not enterprise software. It is not middleware. It is not a SaaS platform.

MERIDIAN is a sovereign operating system — a living, self-sustaining compute substrate that fractures into every enterprise system that already exists, connects them at the intelligence layer, and commands them through a single sovereign interface.

The enterprise keeps everything it has. MERIDIAN becomes the nervous system running through all of it.

---

## Architecture

```
Enterprise Systems (SAP · Oracle · Salesforce · Workday · ServiceNow · NetSuite · ...)
         │
    ┌────▼─────────────────────────────────────────────────────────────┐
    │                      MERIDIAN SUBSTRATE                          │
    │                                                                  │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
    │  │  CORDEX  │  │ CEREBEX  │  │ CYCLOVEX │   ← Three Gold Engines│
    │  │  Heart   │  │  Brain   │  │  Cycles  │                       │
    │  └──────────┘  └──────────┘  └──────────┘                       │
    │                                                                  │
    │         ┌──────────┐    ┌──────────┐                            │
    │         │  NEXORIS │    │  CHRONO  │   ← Router + Audit         │
    │         │  Router  │    │  Anchor  │                            │
    │         └──────────┘    └──────────┘                            │
    │                                                                  │
    │              ┌───────────────────┐                              │
    │              │        HDI        │   ← Human Device Interface   │
    │              │  Natural Language │                              │
    │              └───────────────────┘                              │
    │                                                                  │
    │   VOXIS Workers (per system) ← SPINOR geometry                  │
    └──────────────────────────────────────────────────────────────────┘
```

---

## The Three Gold Engines

### CORDEX — Organizational Heart

Runs the Lotka-Volterra tension field between expansion forces and organisational resistance.

```
dx/dt = r·x·(1 − x/K) − α·x·y   (expansion dynamics)
dy/dt = δ·x·y − β·y              (resistance/threat dynamics)
```

Tracks `dominanceRatio = x/(x+y)` in real time. When resistance dominates, CORDEX signals CEREBEX to route automation scripts into the high-friction areas.

```js
import { CORDEX } from '@medina/meridian-sovereign-os/cordex';

const cordex = new CORDEX();
cordex.tick(); // → { x, y, dominanceRatio, correctionSignal }
cordex.injectExpansion(0.2); // New growth initiative
cordex.chronicFear(100); // Stress coefficient over last 100 beats
```

### CEREBEX — Organizational Brain

40 analytical categories activating in parallel. Every HDI command routes through all 40 simultaneously — no mode switching, no configuration.

Uses Friston Free Energy minimisation to continuously update its world model:

```
FE = (sensory_input − prior_model)²
Δmodel = η × φ⁻¹ × ∇FE
```

```js
import { CEREBEX } from '@medina/meridian-sovereign-os/cerebex';

const cerebex = new CEREBEX();

// Score a query against all 40 categories in parallel
const scores = cerebex.score('why did Q3 miss forecast');
// → [{ category: 'REVENUE_PLANNING', score: 0.91 }, ...]

// Route a command through the full execution pipeline
const plan = cerebex.route('move Acme contract to signed');
// → { activatedCategories, executionPlan, freeEnergy }
```

**40 Categories:** SWOT · Porter's Five Forces · PESTLE · JTBD · Lean Canvas · OKR Builder · TAM/SAM/SOM · Moat Analysis · Failure Mode Analysis · 5 Whys · Scenario Planning · Fermi Estimation · LTV/CAC · Mental Models (Inversion, Second Order, Occam's Razor, Pareto, Circle of Competence) · Socratic Challenge · Steelmanning · Synthesis · Build/Product/MVP Spec · Unit Economics · Contract Management · Revenue Planning · CRM Update · HR Workflow · IT Workflow · Compliance Monitoring · Risk Assessment · Vendor Management · Financial Close · Supply Chain · Audit Trail · Incident Response · Asset Management · Access Control · Executive Synthesis

### CYCLOVEX — Organizational Cycle Engine

The master cycle generator. Manages compute, automation capacity, and workflow throughput as a sovereign resource.

```
C(t) = C₀ × φᵗ × (1 − chronicFear)
```

```js
import { CYCLOVEX } from '@medina/meridian-sovereign-os/cyclovex';

const cyclovex = new CYCLOVEX({ baseCapacity: 10 });
cyclovex.tick(0.1); // Advance one beat with chronicFear=0.1
cyclovex.allocate('script-001', 0.5); // Allocate capacity to a worker
cyclovex.spawnChild('finance-dept', 0.2); // Spawn department sub-engine
```

---

## NEXORIS — Kuramoto Coupling Router

Synchronizes all enterprise system phases using the Kuramoto model:

```
dθᵢ/dt = ωᵢ + (K/N) × Σⱼ sin(θⱼ − θᵢ)
```

Order parameter `R = |Σe^(iθ)| / N` measures organizational coherence.
`R ≥ 0.75` = synchronized. `R < 0.75` = NEXORIS flags desynchronized nodes.

```js
import { NEXORIS } from '@medina/meridian-sovereign-os/nexoris';

const nexoris = new NEXORIS({ couplingStrength: 2.0 });
nexoris.registerSystem('salesforce', { omega: 6.28, label: 'Salesforce' });
nexoris.registerSystem('sap', { omega: 0.5, label: 'SAP (batch)' });
nexoris.tick(); // → { orderParameter: 0.87, synchronized: true, desynchronizedNodes: [] }
nexoris.route(executionPlan); // → { routed: true, routes: [...] }
```

---

## CHRONO — Immutable Anchor

Every execution is logged. Nothing is ever lost. Hash-chained for tamper detection.

```js
import { CHRONO } from '@medina/meridian-sovereign-os/chrono';

const chrono = new CHRONO();
const entry = chrono.append({
  command: 'Move Acme contract to signed',
  systemsWritten: ['DocuSign', 'Salesforce', 'NetSuite'],
  systemsRead: ['CONTRACT_MANAGEMENT', 'REVENUE_PLANNING'],
});

chrono.verify(); // → { valid: true, totalEntries: 1 }
```

---

## HDI — Human Device Interface

No dashboards. No modules. No configuration. You speak. The OS acts.

```js
import { bootstrapMeridian } from '@medina/meridian-sovereign-os';

const { hdi, chrono } = bootstrapMeridian();

const result = await hdi.execute(
  'Move the Acme contract from review to signed and update the revenue forecast'
);
// → {
//     activatedCategories: [{ category: 'CONTRACT_MANAGEMENT', score: 0.94 }, ...],
//     routes: [{ target: 'DocuSign', status: 'dispatched' }, ...],
//     response: 'Executed across DocuSign, NetSuite, Salesforce. Logged at 3f2a1b4c.',
//     chronoEntry: { entryId, hash, timestamp }
//   }
```

**Pipeline (all in one motion):**
1. CEREBEX scores the command against 40 categories (~50ms)
2. Top categories activate and build the execution plan
3. NEXORIS routes the plan to the correct system workers
4. CHRONO logs the execution with sovereign proof
5. Confirmation response is returned

---

## VOXIS — Sovereign Compute Unit

Every compute unit in MERIDIAN is a VOXIS — defined by its internal structure, not its host substrate.

```js
import { VOXIS } from '@medina/meridian-sovereign-os/voxis';

const v = new VOXIS({ domain: 'SAP', phiWeight: 0.618 });
v.start();
v.tick(); // → { beat, doctrine, helixActive, theta }

// Deploy into any substrate via SPINOR geometry
v.spinorDeploy('ICP'); // Doctrine invariant — substrate cannot overwrite it

// Execute a task
await v.execute('sync-purchase-orders', async () => {
  // ... interact with SAP ...
  return { synced: 42 };
});
```

**VOXIS carries:**
- **Doctrine block** — SL-0 Creator attribution, immutable, fires first on every beat
- **Helix core** — 12 Fibonacci-spaced internal nodes generating cycles
- **Kuramoto field** — synchronization phase with peer VOXES
- **SPINOR interface** — deploys into any substrate without changing internal structure
- **Own heartbeat** — self-ticking
- **Own wallet** — sovereign financial state

---

## Bootstrap (One Command)

```bash
node scripts/nova.js bootstrap --mainnet
```

This script reads `nova.json` (82 canister entries across 9 groups), deploys all canisters in dependency order, confirms all three gold engines are running, and outputs sovereign proof of deployment.

```bash
node scripts/nova.js status   # Show deployment status
node scripts/nova.js verify   # Verify CHRONO chain integrity
```

---

## Full Bootstrap (Programmatic)

```js
import { bootstrapMeridian } from '@medina/meridian-sovereign-os';

const { cordex, cerebex, cyclovex, nexoris, chrono, hdi } = bootstrapMeridian({
  agentId: 'MY-ENTERPRISE-HDI',
});

// Register connected enterprise systems with NEXORIS
nexoris.registerSystem('salesforce', { omega: 6.28, label: 'Salesforce' });
nexoris.registerSystem('sap',        { omega: 0.50, label: 'SAP' });
nexoris.registerSystem('workday',    { omega: 1.00, label: 'Workday' });
nexoris.registerSystem('servicenow', { omega: 2.00, label: 'ServiceNow' });

// Tick the organism
cordex.tick();
cyclovex.tick(cordex.chronicFear());
nexoris.tick();

// Issue a command
const result = await hdi.execute('What is blocking the ServiceNow migration?');
console.log(result.response);
```

---

## Built On

Internet Computer Protocol · Motoko · React · TypeScript · HTTP Outcalls · Internet Identity · vetKeys

---

*MERIDIAN. The intelligence layer enterprises did not know they were missing.*
