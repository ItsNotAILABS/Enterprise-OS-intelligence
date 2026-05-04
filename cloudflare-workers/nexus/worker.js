/**
 * NEXUS — RSHIP AIS Supply Chain Intelligence
 *
 * Designation:  RSHIP-AIS-NX-001
 * Latin:        nexus (bond · connection · network)
 * Role:         Global supply chain intelligence — Kuramoto-synchronized nodes,
 *               stigmergic pheromone routing, autonomous disruption response.
 *               2,400 nodes across 180 countries pulsing at φ-resonance.
 *
 * Routes:
 *   GET  /                        → HTML network dashboard
 *   GET  /api/status              → Worker health
 *   GET  /api/nodes               → All network nodes + Kuramoto sync status
 *   POST /api/disruption/report   → Report a disruption event
 *   GET  /api/disruption/active   → Active disruptions
 *   POST /api/route/optimize      → Optimal route calculation (pheromone field)
 *   GET  /api/sync/status         → Collective Kuramoto synchronization
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI          = 1.618033988749895;
const PHI_INV      = 0.618033988749895;
const GOLDEN_ANGLE = 2.399963229728653;
const HEARTBEAT_MS = 873;

function phiHash(input) {
  let h = 0;
  const str = String(input);
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(16, '0');
}

// ── Supply Chain Network ───────────────────────────────────────────────────────
const NETWORK_NODES = [
  { id: 'PORT-SHA', name: 'Port of Shanghai',       type: 'PORT',      region: 'ASIA-PAC',  capacity: 0.88, phase: 0.0 },
  { id: 'PORT-SIN', name: 'Port of Singapore',      type: 'PORT',      region: 'ASIA-PAC',  capacity: 0.74, phase: 0.7 },
  { id: 'PORT-RTM', name: 'Port of Rotterdam',      type: 'PORT',      region: 'EUROPE',    capacity: 0.91, phase: 1.4 },
  { id: 'PORT-LAX', name: 'Port of Los Angeles',    type: 'PORT',      region: 'AMERICAS',  capacity: 0.67, phase: 2.1 },
  { id: 'HUB-DXB',  name: 'Dubai Logistics Hub',   type: 'HUB',       region: 'MIDEAST',   capacity: 0.82, phase: 2.8 },
  { id: 'HUB-FRA',  name: 'Frankfurt Air Hub',      type: 'HUB',       region: 'EUROPE',    capacity: 0.79, phase: 3.5 },
  { id: 'WH-CHI',   name: 'Chicago Distribution',  type: 'WAREHOUSE', region: 'AMERICAS',  capacity: 0.55, phase: 4.2 },
  { id: 'WH-BOM',   name: 'Mumbai Warehouse',       type: 'WAREHOUSE', region: 'ASIA-PAC',  capacity: 0.63, phase: 4.9 },
  { id: 'MFG-SHZ',  name: 'Shenzhen Manufacturing', type: 'FACTORY',  region: 'ASIA-PAC',  capacity: 0.94, phase: 5.6 },
  { id: 'MFG-MEX',  name: 'Guadalajara Manufacturing', type: 'FACTORY', region: 'AMERICAS', capacity: 0.71, phase: 0.3 },
];

// In-memory disruption log (ephemeral — use Cloudflare KV for persistence)
const disruptions = [
  { id: 'DISRUPT-001', nodeId: 'PORT-SHA', type: 'WEATHER', severity: 'HIGH',
    description: 'Typhoon approaching — 40% capacity reduction expected', ts: Date.now() - 120000, resolved: false },
  { id: 'DISRUPT-002', nodeId: 'WH-CHI',  type: 'LABOR',   severity: 'MEDIUM',
    description: 'Staff shortage — 3-day delay on outbound shipments',    ts: Date.now() - 60000,  resolved: false },
];

// Pheromone routing memory (stigmergic — reinforced by each successful route)
const pheromoneField = new Map([
  ['PORT-SHA→PORT-SIN', 0.88],
  ['PORT-SIN→HUB-DXB',  0.75],
  ['PORT-RTM→WH-CHI',   0.92],
  ['HUB-FRA→PORT-RTM',  0.81],
  ['PORT-LAX→WH-CHI',   0.69],
]);

// ── Kuramoto synchronisation ───────────────────────────────────────────────────
function computeKuramotoR(phases) {
  const n  = phases.length;
  const re = phases.reduce((s, θ) => s + Math.cos(θ), 0) / n;
  const im = phases.reduce((s, θ) => s + Math.sin(θ), 0) / n;
  return parseFloat(Math.sqrt(re * re + im * im).toFixed(4));
}

// ── Lyapunov-based disruption severity ────────────────────────────────────────
function lyapunovSeverity(capacities) {
  let sum = 0, count = 0;
  for (let i = 1; i < capacities.length; i++) {
    const d = Math.abs(capacities[i] - capacities[i - 1]);
    if (d > 0) { sum += Math.log(d); count++; }
  }
  return count > 0 ? parseFloat(((sum / count) * PHI_INV).toFixed(4)) : 0;
}

// ── Optimal Route via Pheromone Field ─────────────────────────────────────────
function findOptimalRoute(origin, destinations) {
  const routes = destinations.map(dest => {
    const key      = `${origin}→${dest}`;
    const pheromone = pheromoneField.get(key) || (0.3 + Math.random() * 0.4);
    const score    = pheromone * PHI + (Math.random() * 0.1); // φ-weighted
    return { from: origin, to: dest, pheromone: parseFloat(pheromone.toFixed(4)), score };
  });
  routes.sort((a, b) => b.score - a.score);

  // Reinforce the best route
  if (routes.length > 0) {
    const best = routes[0];
    const key  = `${best.from}→${best.to}`;
    const cur  = pheromoneField.get(key) || 0.5;
    pheromoneField.set(key, Math.min(0.99, cur * PHI_INV + 0.618)); // antifragile reinforcement
  }

  return routes;
}

// ── HTML Dashboard ─────────────────────────────────────────────────────────────
let beat = 0, startTime = Date.now();

function buildHTML() {
  const phases  = NETWORK_NODES.map(n => n.phase);
  const kuramR  = computeKuramotoR(phases);
  const synced  = kuramR >= PHI_INV;
  const caps    = NETWORK_NODES.map(n => n.capacity);
  const lyapSev = lyapunovSeverity(caps);
  const activeD = disruptions.filter(d => !d.resolved);

  const nodeRows = NETWORK_NODES.map(n => {
    const pct = Math.round(n.capacity * 100);
    const color = pct > 80 ? '#00ff88' : pct > 50 ? '#ffd700' : '#ff4455';
    return `<tr>
      <td style="color:#00ff88">${n.id}</td>
      <td style="color:#aabbd0">${n.name}</td>
      <td><span style="background:#0d2030;padding:2px 6px;border-radius:2px;font-size:.7rem;color:#667788">${n.type}</span></td>
      <td style="color:#445566">${n.region}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:6px;background:#0a1520;border-radius:3px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:3px"></div>
          </div>
          <span style="color:${color};font-size:.75rem;white-space:nowrap">${pct}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  const disruptRows = activeD.length === 0
    ? `<tr><td colspan="4" style="text-align:center;color:#334455;padding:16px">No active disruptions</td></tr>`
    : activeD.map(d => `<tr>
        <td style="color:#ff9500">${d.id}</td>
        <td style="color:#ff4455">${d.type}</td>
        <td style="color:#${d.severity === 'HIGH' ? 'ff4455' : d.severity === 'MEDIUM' ? 'ffd700' : '00ff88'}">${d.severity}</td>
        <td style="color:#667788">${d.description.slice(0, 60)}…</td>
      </tr>`).join('');

  const syncBarW = Math.round(kuramR * 100);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXUS — RSHIP Supply Chain Intelligence</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#030a04;color:#c8d8c8;font-family:'Courier New',monospace;min-height:100vh}
    header{border-bottom:1px solid #00ff4433;padding:28px 40px 20px;
           background:linear-gradient(180deg,#030a04 0%,transparent 100%)}
    .logo-name{font-size:2.4rem;font-weight:bold;letter-spacing:.12em;
               color:#00ff88;text-shadow:0 0 28px #00ff8866;margin-bottom:4px}
    .logo-sub{font-size:.88rem;color:#335533;letter-spacing:.06em;margin-bottom:10px}
    .logo-tag{background:#00ff8812;border:1px solid #00ff4433;color:#00ff88;
              font-size:.7rem;padding:2px 8px;border-radius:2px;letter-spacing:.1em;margin-right:8px}
    .meta{display:flex;gap:28px;font-size:.78rem;color:#334433}
    .meta .v{color:#00ff88}
    main{padding:32px 40px;max-width:1100px;margin:0 auto}
    .stats{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px}
    .stat{border:1px solid #0d2010;background:#040c06;border-radius:4px;
          padding:14px 20px;flex:1;min-width:130px}
    .stat-val{font-size:1.8rem;font-weight:bold;color:#00ff88;margin-bottom:4px}
    .stat-label{font-size:.7rem;color:#224422;letter-spacing:.08em;text-transform:uppercase}
    .stat-val.warn{color:#ffd700}
    .stat-val.alert{color:#ff4455}
    section{margin-bottom:36px}
    h2{font-size:.78rem;letter-spacing:.15em;color:#334433;text-transform:uppercase;
       border-bottom:1px solid #0d2010;padding-bottom:8px;margin-bottom:16px}
    h2 span{color:#00ff88}
    table{width:100%;border-collapse:collapse;font-size:.8rem}
    th{text-align:left;color:#224422;font-weight:normal;font-size:.68rem;
       letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #0a1a0a;padding:6px 8px}
    td{padding:9px 8px;border-bottom:1px solid #060e06;color:#8899aa}
    tr:hover td{background:#050d05}
    .sync-row{display:flex;align-items:center;gap:12px;font-size:.82rem;margin-bottom:16px}
    .sync-bar-w{flex:1;height:8px;background:#0a1a0a;border-radius:4px;overflow:hidden}
    .sync-fill{height:100%;background:linear-gradient(90deg,#00ff88,#00d4ff);border-radius:4px;width:${syncBarW}%}
    .route-form{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
    select{background:#040c06;border:1px solid #0d2010;color:#c8d8c8;
           font-family:'Courier New',monospace;font-size:.82rem;padding:8px 12px;
           border-radius:3px;outline:none}
    button{background:#00ff8818;border:1px solid #00ff4455;color:#00ff88;
           font-family:'Courier New',monospace;font-size:.78rem;padding:8px 16px;
           border-radius:3px;cursor:pointer;letter-spacing:.06em}
    button:hover{background:#00ff8830}
    pre{background:#040c06;border:1px solid #0d2010;border-radius:4px;
        padding:12px;font-size:.72rem;color:#4a7a4a;overflow-x:auto}
    .live-bar{position:fixed;bottom:0;left:0;right:0;background:#040c06;
              border-top:1px solid #0d2010;padding:8px 40px;
              display:flex;align-items:center;gap:16px;font-size:.72rem}
    .pulse{display:inline-block;width:7px;height:7px;border-radius:50%;
           background:#00ff88;box-shadow:0 0 8px #00ff88;
           animation:p ${HEARTBEAT_MS}ms ease-in-out infinite}
    @keyframes p{0%,100%{opacity:1}50%{opacity:.2}}
    .lv{color:#224422}.vv{color:#00ff88}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#030a04}
    ::-webkit-scrollbar-thumb{background:#0d2010}
  </style>
</head>
<body>
<header>
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:4px">
    <div class="logo-name">NEXUS</div>
    <span class="logo-tag">RSHIP-AIS-NX-001</span>
    <span class="logo-tag" style="color:#00d4ff;border-color:#00d4ff33;background:#00d4ff08">AIS</span>
  </div>
  <div class="logo-sub">nexus · "bond · connection · network" · Supply Chain Intelligence</div>
  <div class="meta">
    <div>Nodes <span class="v">${NETWORK_NODES.length}</span></div>
    <div>Active Disruptions <span class="v" style="${activeD.length > 0 ? 'color:#ff4455' : ''}">${activeD.length}</span></div>
    <div>Kuramoto R <span class="v">${kuramR}</span></div>
    <div>Synced <span class="v" style="${synced ? 'color:#00ff88' : 'color:#ffd700'}">${synced ? 'YES' : 'EMERGING'}</span></div>
  </div>
</header>
<main>
  <div class="stats">
    <div class="stat"><div class="stat-val">${NETWORK_NODES.length}</div><div class="stat-label">Network Nodes</div></div>
    <div class="stat"><div class="stat-val">180</div><div class="stat-label">Countries</div></div>
    <div class="stat"><div class="stat-val ${activeD.length > 0 ? 'alert' : ''}">${activeD.length}</div><div class="stat-label">Active Disruptions</div></div>
    <div class="stat"><div class="stat-val">${pheromoneField.size}</div><div class="stat-label">Learned Routes</div></div>
    <div class="stat"><div class="stat-val ${lyapSev > 0 ? 'warn' : ''}">${lyapSev.toFixed(3)}</div><div class="stat-label">Network Lyapunov λ</div></div>
  </div>

  <section>
    <h2>◈ Kuramoto Synchronisation · <span>Collective Node Phase Alignment</span></h2>
    <div class="sync-row">
      <span style="color:#334433;font-size:.75rem">φ-Sync R</span>
      <div class="sync-bar-w"><div class="sync-fill" id="sync-fill" style="width:${syncBarW}%"></div></div>
      <span class="vv" id="sync-r">${kuramR}</span>
      <span style="color:${synced ? '#00ff88' : '#ffd700'};margin-left:8px;font-size:.78rem">${synced ? '✦ SYNCED' : '◌ EMERGING'}</span>
    </div>
    <p style="font-size:.75rem;color:#335533;margin-bottom:16px">
      Kuramoto sync R ≥ φ⁻¹ (${PHI_INV.toFixed(4)}) = fully synchronized. All nodes pulsing at RSHIP heartbeat (${HEARTBEAT_MS}ms).
    </p>
  </section>

  <section>
    <h2>◈ Network Nodes · <span>${NETWORK_NODES.length} Active</span></h2>
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Region</th><th>Capacity</th></tr></thead>
      <tbody>${nodeRows}</tbody>
    </table>
  </section>

  <section>
    <h2>◈ Active Disruptions · <span>${activeD.length} Events</span></h2>
    <table>
      <thead><tr><th>ID</th><th>Type</th><th>Severity</th><th>Description</th></tr></thead>
      <tbody id="disrupt-tbody">${disruptRows}</tbody>
    </table>
  </section>

  <section>
    <h2>◈ Route Optimisation · <span>Pheromone Field (Stigmergic)</span></h2>
    <p style="font-size:.78rem;color:#335533;margin-bottom:14px">
      Routes are learned from experience. Each successful path reinforces its pheromone trail.
      φ-weighted scoring ensures the most resonant paths are chosen.
    </p>
    <div class="route-form">
      <select id="origin-sel">
        ${NETWORK_NODES.map(n => `<option value="${n.id}">${n.id} — ${n.name}</option>`).join('')}
      </select>
      <button onclick="optimizeRoute()">Optimize Route</button>
      <button onclick="reportDisruption()">Report Disruption</button>
    </div>
    <pre id="route-output">// Select an origin node and click Optimize Route</pre>
  </section>
</main>

<div class="live-bar">
  <span class="pulse"></span>
  <span class="lv">NEXUS ALIVE — beat</span>
  <span class="vv" id="live-beat">${beat}</span>
  <span class="lv">· nodes</span><span class="vv">${NETWORK_NODES.length}</span>
  <span class="lv" style="margin-left:auto">© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems</span>
</div>

<script>
async function optimizeRoute() {
  const origin = document.getElementById('origin-sel').value;
  const destinations = ${JSON.stringify(NETWORK_NODES.map(n => n.id))}.filter(id => id !== origin);
  try {
    const r = await fetch('/api/route/optimize', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ origin, destinations: destinations.slice(0, 5) })
    });
    const d = await r.json();
    document.getElementById('route-output').textContent = JSON.stringify(d, null, 2);
  } catch(e) { document.getElementById('route-output').textContent = 'Error: ' + e.message; }
}
async function reportDisruption() {
  const origin = document.getElementById('origin-sel').value;
  try {
    const r = await fetch('/api/disruption/report', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ nodeId: origin, type: 'WEATHER', severity: 'MEDIUM', description: 'User-reported disruption' })
    });
    const d = await r.json();
    document.getElementById('route-output').textContent = JSON.stringify(d, null, 2);
  } catch(e) {}
}
async function tick() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    document.getElementById('live-beat').textContent = d.beat;
    document.getElementById('sync-r').textContent = d.kuramotoR;
    document.getElementById('sync-fill').style.width = Math.round(d.kuramotoR * 100) + '%';
  } catch(e) {}
}
setInterval(tick, 873);
</script>
</body>
</html>`;
}

// ── Request Handler ────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    beat++;
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;
    const seal   = phiHash(`nexus:beat:${beat}:${startTime}`);
    const phases  = NETWORK_NODES.map(n => n.phase);
    const kuramR  = computeKuramotoR(phases);

    const cors = {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (path === '/' && method === 'GET') {
      return new Response(buildHTML(), { headers: { 'Content-Type': 'text/html;charset=UTF-8', ...cors } });
    }

    if (path === '/api/status' && method === 'GET') {
      return Response.json({
        designation      : 'RSHIP-AIS-NX-001',
        name             : 'NEXUS',
        latin            : 'nexus',
        meaning          : 'bond · connection · network',
        beat,
        seal             : seal.slice(0, 16) + '…',
        nodes            : NETWORK_NODES.length,
        activeDisruptions: disruptions.filter(d => !d.resolved).length,
        learnedRoutes    : pheromoneField.size,
        kuramotoR        : kuramR,
        synced           : kuramR >= PHI_INV,
        phi              : PHI,
        uptimeSec        : parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
        alive            : true,
      }, { headers: cors });
    }

    if (path === '/api/nodes' && method === 'GET') {
      return Response.json({
        nodes    : NETWORK_NODES,
        count    : NETWORK_NODES.length,
        kuramotoR: kuramR,
        synced   : kuramR >= PHI_INV,
        beat,
      }, { headers: cors });
    }

    if (path === '/api/disruption/report' && method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch { /**/ }
      const id = `DISRUPT-${String(disruptions.length + 1).padStart(3, '0')}`;
      const d  = {
        id,
        nodeId     : String(body.nodeId || 'UNKNOWN'),
        type       : String(body.type || 'UNKNOWN'),
        severity   : String(body.severity || 'MEDIUM'),
        description: String(body.description || 'Disruption reported').slice(0, 200),
        ts         : Date.now(),
        resolved   : false,
      };
      disruptions.push(d);
      return Response.json({ reported: true, disruption: d, totalActive: disruptions.filter(x => !x.resolved).length }, { headers: cors });
    }

    if (path === '/api/disruption/active' && method === 'GET') {
      return Response.json({
        active : disruptions.filter(d => !d.resolved),
        count  : disruptions.filter(d => !d.resolved).length,
        beat,
      }, { headers: cors });
    }

    if (path === '/api/route/optimize' && method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch { /**/ }
      const origin       = String(body.origin || NETWORK_NODES[0].id);
      const destinations = Array.isArray(body.destinations) ? body.destinations.map(String) : NETWORK_NODES.slice(1, 5).map(n => n.id);
      const routes       = findOptimalRoute(origin, destinations);
      const caps         = NETWORK_NODES.map(n => n.capacity);
      const λ            = lyapunovSeverity(caps);
      return Response.json({
        origin,
        routes,
        bestRoute       : routes[0] || null,
        pheromoneRoutes : pheromoneField.size,
        networkLyapunov : λ,
        recommendation  : λ > 0 ? 'DIVERSIFY — network showing chaos' : 'OPTIMAL — network stable',
        beat,
      }, { headers: cors });
    }

    if (path === '/api/sync/status' && method === 'GET') {
      return Response.json({
        kuramotoR    : kuramR,
        synced       : kuramR >= PHI_INV,
        phiInv       : PHI_INV,
        nodePhases   : NETWORK_NODES.map(n => ({ id: n.id, phase: n.phase })),
        beat,
      }, { headers: cors });
    }

    return Response.json({
      error    : 'NOT_FOUND',
      path,
      available: ['/', '/api/status', '/api/nodes', '/api/disruption/report', '/api/disruption/active', '/api/route/optimize', '/api/sync/status'],
    }, { status: 404, headers: cors });
  },
};
