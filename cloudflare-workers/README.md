# RSHIP AIS — Cloudflare Workers

**Five sovereign AI intelligence workers, each bearing a Latin name.**

```
CEREBRUM  — Master AGI Portal  (brain)
ANIMUS    — Sovereign Terminal  (soul / intelligence gate)
NEXUS     — Supply Chain AI     (bond / network)
VIGIL     — Market Sentinel     (watchman)
CURSOR    — Travel Intelligence (messenger / runner)
```

> **AIS** = Artificial Intelligence Systems · RSHIP AGI Networks · © 2026 Alfredo Medina Hernandez

---

## Auto-Deploy via Cloudflare (Recommended)

Since this repo is already connected to Cloudflare, each worker auto-deploys when you push to GitHub:

1. Go to **Cloudflare Dashboard → Workers & Pages → Create Application → Connect to Git**
2. Select the `FreddyCreates/Enterprise-OS-intelligence` repository
3. Set the **Root directory** to `cloudflare-workers/<worker-name>` (e.g. `cloudflare-workers/cerebrum`)
4. Set **Build command** to `npm install` (or leave blank — no build step needed)
5. Set **Main** to `src/worker.js`
6. Click **Deploy**

Repeat for each of the 5 workers. Every `git push` will trigger an automatic redeploy.

---

## Manual Deploy via Wrangler

```bash
# Install wrangler globally (one time)
npm install -g wrangler
wrangler login

# From this directory — deploy all 5 workers at once
npm run deploy:all

# Or deploy individually
npm run deploy:cerebrum
npm run deploy:animus
npm run deploy:nexus
npm run deploy:vigil
npm run deploy:cursor
```

## Local Development

```bash
npm run dev:cerebrum   # http://localhost:8787
npm run dev:animus     # http://localhost:8788
npm run dev:nexus      # http://localhost:8789
npm run dev:vigil      # http://localhost:8790
npm run dev:cursor     # http://localhost:8791
```

---

## Worker Registry

| Latin Name | Designation      | Route                              | Intelligence Domain        |
|------------|------------------|------------------------------------|----------------------------|
| CEREBRUM   | RSHIP-AIS-CB-001 | `cerebrum.rship.workers.dev`       | Master AGI Dashboard       |
| ANIMUS     | RSHIP-AIS-AN-001 | `animus.rship.workers.dev`         | Sovereign Terminal · AI/Machine Gate |
| NEXUS      | RSHIP-AIS-NX-001 | `nexus.rship.workers.dev`          | Supply Chain Intelligence  |
| VIGIL      | RSHIP-AIS-VG-001 | `vigil.rship.workers.dev`          | Market Prediction Sentinel |
| CURSOR     | RSHIP-AIS-CS-001 | `cursor.rship.workers.dev`         | Travel Intelligence        |

---

## API Overview

Every worker serves:
- `GET /` — Beautiful live HTML dashboard (auto-refreshes every 3s)
- `GET /api/status` — JSON status of the worker
- Domain-specific endpoints (see each worker's source)

### ANIMUS — Intelligence vs Machine
```
POST /api/intelligence/dock       — Dock an AI via φ-resonance key
POST /api/intelligence/exchange   — Bilateral awareness exchange
DELETE /api/intelligence/undock   — Graceful undock
POST /api/machine/request         — Machine API request (JSON in/out)
GET  /api/key/generate            — Generate a demo geometric key
```

### NEXUS — Supply Chain
```
GET  /api/nodes                   — All network nodes + sync status
POST /api/disruption/report       — Report a disruption
GET  /api/disruption/active       — Active disruptions
POST /api/route/optimize          — Optimal route calculation
```

### VIGIL — Market Prediction
```
POST /api/market/predict          — Predict market regime + movement
GET  /api/market/regime           — Current regime (CHAOTIC / STABLE)
POST /api/portfolio/analyze       — Portfolio intelligence analysis
```

### CURSOR — Travel Intelligence
```
POST /api/companion/interact      — Travel companion AI interaction
POST /api/flight/predict          — Flight price prediction (Lyapunov)
GET  /api/social/mesh             — Airport social graph snapshot
GET  /api/crisis/active           — Active travel disruptions
```

---

## Architecture

All workers share the same φ-resonance constants from the RSHIP framework:

```js
const PHI          = 1.618033988749895;  // Golden ratio
const PHI_INV      = 0.618033988749895;  // φ⁻¹ coherence threshold
const GOLDEN_ANGLE = 2.399963229728653;  // 2π/φ² radians
const HEARTBEAT_MS = 873;               // Sovereign heartbeat
```

Workers are **stateless by default** — for persistent state, wire Cloudflare KV or Durable Objects via `wrangler.toml` bindings.

---

© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
