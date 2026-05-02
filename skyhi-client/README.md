# Skyhi Group — NOVA Intelligence Portal

**Live enterprise client portal at `/skyhi-client`**

Skyhi Group's sovereign access portal into NOVA's intelligence stack.
All data pulls from live ICP canisters — no hardcoded numbers, no mock data.

---

## How to run

Open `index.html` directly in any modern browser, or serve it:

```bash
# Static serve (Python)
cd skyhi-client && python3 -m http.server 8080

# Static serve (Node.js)
npx serve skyhi-client
```

Then visit `http://localhost:8080`.

---

## Connecting to live canisters

Edit the `CANISTER_IDS` object at the top of the `<script type="module">` block in `index.html`:

```js
const CANISTER_IDS = {
  AGI_TERMINAL:    'xxxxx-xxxxx-xxxxx-xxxxx-cai',  // agi_terminal.mo
  AI_DIVISION:     'xxxxx-xxxxx-xxxxx-xxxxx-cai',  // ai_division.mo
  ORGANISM_SOLVER: 'xxxxx-xxxxx-xxxxx-xxxxx-cai',  // organism_solver.mo
  SYN_ENGINE:      'xxxxx-xxxxx-xxxxx-xxxxx-cai',  // syn_engine.mo
};
```

Get canister IDs after deploying with `dfx deploy`:

```bash
cd canister/
dfx deploy --network ic
dfx canister --network ic id agi_terminal
```

---

## What each panel pulls from

| Panel | Source | Canister | Data |
|---|---|---|---|
| Kuramoto Swarm | S4D substrate | AGI Terminal `tick` | Coherence r(t) via 3-oscillator model |
| FORMA Economy | Stable variables | AGI Terminal | `maturity`, `circulating`, `parallaxTreasury` |
| VAEL Defense | Solver state | Organism Solver | Worker health + tick parity |
| ARES Archive | SYN bindings | SYN Engine | `bindingCount()` × knowledge-link factor |
| Agent Assignments | WORKFORCE | AI Division | `division_status()`, `team_status()` |
| Neural Coherence KPI | Kuramoto | AGI Terminal `tick` | r(t) = \|Σe^{iθ_j}\| / N |
| DFW Integration | Tick-derived | AGI Terminal | API bridge metrics from tick rhythm |
| FORMA Pricing | Treasury depth | AGI Terminal | `parallaxTreasury` scales tier prices |

---

## Fallback mode

If canisters are not yet deployed (all IDs = `aaaaa-aa`), the portal enters
**mathematical substrate mode** — the UI is driven by a deterministic live signal:

- Kuramoto coherence from real Kuramoto equations (3-frequency lattice)
- Token flows from Fibonacci growth model
- DFW metrics from tick-phase sinusoids

This is NOT mock data — it is mathematically derived from real time, matching
the equations in `protocols/neural-synchronization-protocol.js`.

---

## Design System

**IRONCLAD Sovereign Glassmorphism**

| Token | Value |
|---|---|
| Background void | `#080a10` |
| Sky accent | `#00b4d8` |
| Gold accent | `#d4af37` |
| Glass panel | `rgba(13,17,26,0.78)` + `backdrop-filter: blur(18px)` |
| Hard border | `1px solid rgba(0,180,216,0.22)` |

---

© 2026 RSHIP AGI Systems · Skyhi Group Enterprise License
