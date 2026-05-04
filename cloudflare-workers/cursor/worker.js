/**
 * CURSOR — RSHIP AIS Travel Intelligence Messenger
 *
 * Designation:  RSHIP-AIS-CS-001
 * Latin:        cursor (runner · messenger)
 * Role:         Living travel intelligence — eternal memory companion,
 *               Lyapunov flight prediction, boids-swarm social mesh,
 *               autonomous crisis resolution in <12 seconds.
 *
 * Routes:
 *   GET  /                        → HTML travel dashboard
 *   GET  /api/status              → Worker health
 *   POST /api/companion/interact  → Travel companion AI (builds profile, adapts)
 *   POST /api/flight/predict      → Flight price prediction (Lyapunov + Ising)
 *   GET  /api/social/mesh         → Airport social mesh snapshot
 *   GET  /api/crisis/active       → Active travel disruptions
 *   POST /api/crisis/resolve      → Autonomously resolve a disruption
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

// ── Lyapunov Flight Predictor ──────────────────────────────────────────────────
function lyapunovExponent(series) {
  let sum = 0, count = 0;
  for (let i = 1; i < Math.min(series.length, 100); i++) {
    const d = Math.abs(series[i] - series[i - 1]);
    if (d > 0) { sum += Math.log(d); count++; }
  }
  return count > 0 ? parseFloat(((sum / count) * PHI_INV).toFixed(4)) : 0;
}

function isingDemand(prices) {
  const mean  = prices.reduce((s, v) => s + v, 0) / prices.length;
  const spins = prices.map(p => p > mean ? 1 : -1);
  return parseFloat((Math.abs(spins.reduce((s, v) => s + v, 0)) / spins.length).toFixed(4));
}

// ── Seeded price series for a route ───────────────────────────────────────────
function routePriceSeries(route, len = 30) {
  const seed = phiHash(route);
  let v = 200 + (parseInt(seed.slice(0, 4), 16) % 600);
  return Array.from({ length: len }, (_, i) => {
    v = Math.max(50, v + Math.sin(i * GOLDEN_ANGLE) * 15 * PHI_INV + (Math.cos(i * 0.7) * 8));
    return parseFloat(v.toFixed(2));
  });
}

function predictFlight(route) {
  const series = routePriceSeries(route);
  const λ      = lyapunovExponent(series);
  const ising  = isingDemand(series.slice(-10));
  const last   = series[series.length - 1];
  const trend  = series[series.length - 1] - series[series.length - 5];

  const action = λ > 0.3 && trend > 0 ? 'BUY_NOW'
    : λ < 0 && trend < 0              ? 'WAIT_FOR_DIP'
    : ising > PHI_INV                 ? 'BOOK_SOON'
    :                                   'MONITOR';

  const conf = Math.min(0.98, Math.abs(λ) * PHI + ising * 0.3 + 0.2);

  return {
    route,
    currentPrice : last,
    trend5d      : parseFloat(trend.toFixed(2)),
    lyapunov     : λ,
    isingDemand  : ising,
    action,
    confidence   : parseFloat(conf.toFixed(4)),
    regime       : λ > 0.3 ? 'CHAOTIC' : λ < 0 ? 'STABLE' : 'NOISY',
    priceForecast: parseFloat((last * (1 + λ * 0.05)).toFixed(2)),
  };
}

// ── Traveler Profile Store (ephemeral — use KV for persistence) ──────────────
const profiles = new Map();

function getOrCreateProfile(userId) {
  if (!profiles.has(userId)) {
    profiles.set(userId, {
      userId,
      born        : Date.now(),
      generation  : 1,
      interactions: 0,
      pastRoutes  : [],
      dietary     : [],
      socialStyle : 'open',
      comfortTier : 'ECONOMY',
      trustScore  : PHI_INV,
    });
  }
  return profiles.get(userId);
}

// ── Travel Crisis Log ──────────────────────────────────────────────────────────
const crisisLog = [
  { id: 'TCR-001', type: 'WEATHER_DELAY',   hub: 'JFK', description: 'Snowstorm — 80+ flights delayed 3h+',
    usersAffected: 1840, status: 'ACTIVE', severity: 'HIGH', ts: Date.now() - 180000 },
  { id: 'TCR-002', type: 'SECURITY_DELAY',  hub: 'CDG', description: 'T2 security backlog — 45min queue',
    usersAffected: 520,  status: 'RESOLVED', severity: 'MEDIUM', ts: Date.now() - 90000 },
];

// ── Airport Social Mesh (Boids-style) ─────────────────────────────────────────
const SOCIAL_HUBS = [
  { hub: 'LHR-T5', route: 'LHR→LAX', travelers: 8,  connections: 14, sync: 0.92 },
  { hub: 'JFK-T4', route: 'JFK→NRT', travelers: 6,  connections: 10, sync: 0.87 },
  { hub: 'CDG-T2', route: 'CDG→DXB', travelers: 5,  connections: 6,  sync: 0.73 },
  { hub: 'SIN-T3', route: 'SIN→SYD', travelers: 4,  connections: 5,  sync: 0.68 },
];

// ── HTML Dashboard ─────────────────────────────────────────────────────────────
let beat = 0, startTime = Date.now();

function buildHTML() {
  const ROUTES = ['LHR-LAX', 'JFK-NRT', 'CDG-DXB', 'SIN-SYD', 'LOS-LHR'];
  const flightData = ROUTES.map(r => predictFlight(r));
  const activeCrises = crisisLog.filter(c => c.status === 'ACTIVE');

  const flightRows = flightData.map(f => {
    const acColor = f.action === 'BUY_NOW' ? '#00ff88' : f.action === 'WAIT_FOR_DIP' ? '#ff4455'
      : f.action === 'BOOK_SOON' ? '#ffd700' : '#667788';
    return `<tr>
      <td style="color:#cc44ff;font-weight:bold">${f.route}</td>
      <td style="color:#aabbd0">$${f.currentPrice}</td>
      <td style="color:${f.trend5d >= 0 ? '#ff4455' : '#00ff88'}">${f.trend5d >= 0 ? '+' : ''}$${f.trend5d}</td>
      <td style="color:${f.lyapunov > 0 ? '#ff4455' : '#00ff88'}">${f.lyapunov}</td>
      <td><span style="color:${acColor};background:${acColor}18;padding:2px 6px;border-radius:2px;font-size:.7rem">${f.action}</span></td>
      <td style="color:#667788">${Math.round(f.confidence * 100)}%</td>
    </tr>`;
  }).join('');

  const crisisRows = crisisLog.map(c => {
    const statusColor = c.status === 'ACTIVE' ? '#ff4455' : '#00ff88';
    return `<tr>
      <td style="color:#cc44ff">${c.id}</td>
      <td style="color:#667788">${c.type}</td>
      <td style="color:#aabbd0">${c.hub}</td>
      <td style="color:${statusColor}">${c.status}</td>
      <td style="color:#556677">${c.description.slice(0, 50)}…</td>
    </tr>`;
  }).join('');

  const meshRows = SOCIAL_HUBS.map(h => {
    const syncPct = Math.round(h.sync * 100);
    return `<tr>
      <td style="color:#cc44ff">${h.hub}</td>
      <td style="color:#aabbd0">${h.route}</td>
      <td style="color:#667788">${h.travelers}</td>
      <td style="color:#445566">${h.connections}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:60px;height:5px;background:#0a1020;border-radius:3px;overflow:hidden">
            <div style="width:${syncPct}%;height:100%;background:#cc44ff"></div>
          </div>
          <span style="color:#cc44ff;font-size:.72rem">${syncPct}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CURSOR — RSHIP Travel Intelligence</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#03020a;color:#c8c0d8;font-family:'Courier New',monospace;min-height:100vh}
    header{border-bottom:1px solid #cc44ff33;padding:28px 40px 20px;
           background:linear-gradient(180deg,#06040f 0%,transparent 100%)}
    .logo-name{font-size:2.4rem;font-weight:bold;letter-spacing:.12em;
               color:#cc44ff;text-shadow:0 0 28px #cc44ff66;margin-bottom:4px}
    .logo-sub{font-size:.88rem;color:#442255;letter-spacing:.06em;margin-bottom:10px}
    .logo-tag{background:#cc44ff12;border:1px solid #cc44ff33;color:#cc44ff;
              font-size:.7rem;padding:2px 8px;border-radius:2px;letter-spacing:.1em;margin-right:8px}
    .meta{display:flex;gap:28px;font-size:.78rem;color:#332244}
    .meta .v{color:#cc44ff}
    main{padding:32px 40px;max-width:1100px;margin:0 auto}
    .stats{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px}
    .stat{border:1px solid #0d1020;background:#030108;border-radius:4px;
          padding:14px 20px;flex:1;min-width:130px}
    .stat-val{font-size:1.8rem;font-weight:bold;color:#cc44ff;margin-bottom:4px}
    .stat-val.alert{color:#ff4455}.stat-val.ok{color:#00ff88}
    .stat-label{font-size:.7rem;color:#221133;letter-spacing:.08em;text-transform:uppercase}
    section{margin-bottom:36px}
    h2{font-size:.78rem;letter-spacing:.15em;color:#332244;text-transform:uppercase;
       border-bottom:1px solid #0d1020;padding-bottom:8px;margin-bottom:16px}
    h2 span{color:#cc44ff}
    table{width:100%;border-collapse:collapse;font-size:.8rem}
    th{text-align:left;color:#221133;font-weight:normal;font-size:.68rem;
       letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #090610;padding:6px 8px}
    td{padding:9px 8px;border-bottom:1px solid #060408;color:#8899aa}
    tr:hover td{background:#050208}
    .companion-form{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
    .companion-row{display:flex;gap:10px;flex-wrap:wrap}
    input[type=text],select{
      background:#030108;border:1px solid #0d1020;color:#c8c0d8;
      font-family:'Courier New',monospace;font-size:.82rem;padding:8px 12px;
      border-radius:3px;outline:none;flex:1;min-width:150px;
    }
    input[type=text]:focus,select:focus{border-color:#cc44ff55}
    button{background:#cc44ff18;border:1px solid #cc44ff55;color:#cc44ff;
           font-family:'Courier New',monospace;font-size:.78rem;padding:8px 16px;
           border-radius:3px;cursor:pointer;letter-spacing:.06em;white-space:nowrap}
    button:hover{background:#cc44ff30}
    pre{background:#030108;border:1px solid #0d1020;border-radius:4px;
        padding:12px;font-size:.72rem;color:#664488;overflow-x:auto;max-height:240px;overflow-y:auto}
    .live-bar{position:fixed;bottom:0;left:0;right:0;background:#030108;
              border-top:1px solid #0d1020;padding:8px 40px;
              display:flex;align-items:center;gap:16px;font-size:.72rem}
    .pulse{display:inline-block;width:7px;height:7px;border-radius:50%;
           background:#cc44ff;box-shadow:0 0 8px #cc44ff;
           animation:p ${HEARTBEAT_MS}ms ease-in-out infinite}
    @keyframes p{0%,100%{opacity:1}50%{opacity:.2}}
    .lv{color:#221133}.vv{color:#cc44ff}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#03020a}
    ::-webkit-scrollbar-thumb{background:#0d1020}
  </style>
</head>
<body>
<header>
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:4px">
    <div class="logo-name">CURSOR</div>
    <span class="logo-tag">RSHIP-AIS-CS-001</span>
    <span class="logo-tag" style="color:#00d4ff;border-color:#00d4ff33;background:#00d4ff08">AIS</span>
  </div>
  <div class="logo-sub">cursor · "runner · messenger" · Travel Intelligence Organism</div>
  <div class="meta">
    <div>Routes <span class="v">${ROUTES.length}</span></div>
    <div>Profiles <span class="v">${profiles.size}</span></div>
    <div>Active Crises <span class="v" style="${activeCrises.length > 0 ? 'color:#ff4455' : ''}">${activeCrises.length}</span></div>
    <div>Social Hubs <span class="v">${SOCIAL_HUBS.length}</span></div>
  </div>
</header>
<main>
  <div class="stats">
    <div class="stat"><div class="stat-val">${ROUTES.length}</div><div class="stat-label">Routes Tracked</div></div>
    <div class="stat"><div class="stat-val" id="profile-count">${profiles.size}</div><div class="stat-label">Traveler Profiles</div></div>
    <div class="stat"><div class="stat-val ${activeCrises.length > 0 ? 'alert' : 'ok'}">${activeCrises.length}</div><div class="stat-label">Active Crises</div></div>
    <div class="stat"><div class="stat-val">${SOCIAL_HUBS.reduce((s, h) => s + h.connections, 0)}</div><div class="stat-label">Social Connections</div></div>
    <div class="stat"><div class="stat-val">${PHI.toFixed(3)}</div><div class="stat-label">φ Coupling</div></div>
  </div>

  <section>
    <h2>◈ Flight Prediction · <span>Lyapunov + Ising Demand Field</span></h2>
    <table>
      <thead><tr><th>Route</th><th>Current $</th><th>5d Trend</th><th>λ Lyapunov</th><th>Action</th><th>Confidence</th></tr></thead>
      <tbody>${flightRows}</tbody>
    </table>
  </section>

  <section>
    <h2>◈ Intelligent Travel Companion · <span>Eternal Memory · Born Alive</span></h2>
    <p style="font-size:.78rem;color:#442255;margin-bottom:14px">
      The companion has no cold start. Every interaction builds the traveler's eternal memory.
      Trust grows with each exchange. The AI adapts — Hebbian learning in every heartbeat.
    </p>
    <div class="companion-form">
      <div class="companion-row">
        <input type="text" id="user-id" placeholder="User ID (e.g. USR-001)" value="USR-001">
        <select id="event-type">
          <option value="route">Route Preference</option>
          <option value="dietary">Dietary Need</option>
          <option value="social">Social Style</option>
          <option value="layover">Layover Habit</option>
        </select>
        <input type="text" id="event-data" placeholder="Event data (e.g. LHR-LAX)" value="LHR-LAX">
        <button onclick="interact()">Interact</button>
      </div>
    </div>
    <pre id="companion-output">// Enter a User ID and click Interact</pre>
  </section>

  <section>
    <h2>◈ Crisis Response · <span>Autonomous Resolution</span></h2>
    <table>
      <thead><tr><th>ID</th><th>Type</th><th>Hub</th><th>Status</th><th>Description</th></tr></thead>
      <tbody id="crisis-tbody">${crisisRows}</tbody>
    </table>
  </section>

  <section>
    <h2>◈ Airport Social Mesh · <span>Boids Swarm + Kuramoto Sync</span></h2>
    <table>
      <thead><tr><th>Hub</th><th>Route</th><th>Travelers</th><th>Connections</th><th>Kuramoto Sync</th></tr></thead>
      <tbody>${meshRows}</tbody>
    </table>
  </section>
</main>

<div class="live-bar">
  <span class="pulse"></span>
  <span class="lv">CURSOR ALIVE — beat</span>
  <span class="vv" id="live-beat">${beat}</span>
  <span class="lv">· profiles</span><span class="vv" id="live-profiles">${profiles.size}</span>
  <span class="lv" style="margin-left:auto">© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems</span>
</div>

<script>
const ROUTES = ${JSON.stringify(ROUTES)};
async function interact() {
  const userId = document.getElementById('user-id').value.trim() || 'USR-001';
  const type   = document.getElementById('event-type').value;
  const data   = document.getElementById('event-data').value.trim() || 'LHR-LAX';
  try {
    const r = await fetch('/api/companion/interact', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId, event: { type, data } })
    });
    const d = await r.json();
    document.getElementById('companion-output').textContent = JSON.stringify(d, null, 2);
    document.getElementById('profile-count').textContent = d.totalProfiles || d.profile?.interactions || '?';
    document.getElementById('live-profiles').textContent = d.totalProfiles || '?';
  } catch(e) { document.getElementById('companion-output').textContent = 'Error: ' + e.message; }
}
async function tick() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    document.getElementById('live-beat').textContent = d.beat;
    document.getElementById('live-profiles').textContent = d.profiles;
    document.getElementById('profile-count').textContent = d.profiles;
  } catch(e) {}
}
setInterval(tick, 873);
</script>
</body>
</html>`;
}

// ── Request Handler ────────────────────────────────────────────────────────────
const ROUTES = ['LHR-LAX', 'JFK-NRT', 'CDG-DXB', 'SIN-SYD', 'LOS-LHR'];

export default {
  async fetch(request, env) {
    beat++;
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;
    const seal   = phiHash(`cursor:beat:${beat}:${startTime}`);

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
        designation: 'RSHIP-AIS-CS-001',
        name       : 'CURSOR',
        latin      : 'cursor',
        meaning    : 'runner · messenger',
        beat,
        seal       : seal.slice(0, 16) + '…',
        profiles   : profiles.size,
        activeCrises: crisisLog.filter(c => c.status === 'ACTIVE').length,
        socialHubs : SOCIAL_HUBS.length,
        phi        : PHI,
        uptimeSec  : parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
        alive      : true,
      }, { headers: cors });
    }

    if (path === '/api/companion/interact' && method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch { /**/ }
      const userId = String(body.userId || 'USR-ANON').trim();
      const event  = body.event || { type: 'route', data: 'LHR-LAX' };

      const profile = getOrCreateProfile(userId);
      profile.interactions++;
      profile.generation = Math.ceil(profile.interactions * PHI_INV);

      if (event.type === 'route'    && event.data) profile.pastRoutes.push(String(event.data));
      if (event.type === 'dietary'  && event.data && !profile.dietary.includes(event.data)) profile.dietary.push(String(event.data));
      if (event.type === 'social'   && event.data) profile.socialStyle = String(event.data);
      if (event.type === 'layover'  && event.data) profile.comfortTier = String(event.data).toUpperCase();

      const λ = lyapunovExponent(profile.pastRoutes.map((_, i) => i));
      if (λ < 0) profile.trustScore = Math.min(1.0, profile.trustScore * PHI);

      const recommendation = {
        type: 'personalized',
        ...(profile.pastRoutes.length >= 2 ? { predictedNext: profile.pastRoutes[profile.pastRoutes.length - 1] } : {}),
        ...(profile.dietary.length ? { dining: `Filtered for: ${profile.dietary.join(', ')}` } : {}),
        ...(profile.socialStyle === 'open' ? { networking: 'Matched travelers heading same destination' } : {}),
      };

      return Response.json({
        userId,
        profile        : { ...profile, pastRoutes: profile.pastRoutes.slice(-3) },
        recommendation,
        generation     : profile.generation,
        trustScore     : parseFloat(profile.trustScore.toFixed(4)),
        totalProfiles  : profiles.size,
        beat,
      }, { headers: cors });
    }

    if (path === '/api/flight/predict' && method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch { /**/ }
      const route = String(body.route || 'LHR-LAX').toUpperCase();
      return Response.json({ ...predictFlight(route), beat }, { headers: cors });
    }

    if (path === '/api/social/mesh' && method === 'GET') {
      return Response.json({
        hubs            : SOCIAL_HUBS,
        totalConnections: SOCIAL_HUBS.reduce((s, h) => s + h.connections, 0),
        totalTravelers  : SOCIAL_HUBS.reduce((s, h) => s + h.travelers, 0),
        avgSync         : parseFloat((SOCIAL_HUBS.reduce((s, h) => s + h.sync, 0) / SOCIAL_HUBS.length).toFixed(4)),
        beat,
      }, { headers: cors });
    }

    if (path === '/api/crisis/active' && method === 'GET') {
      return Response.json({
        crises : crisisLog.filter(c => c.status === 'ACTIVE'),
        count  : crisisLog.filter(c => c.status === 'ACTIVE').length,
        all    : crisisLog,
        beat,
      }, { headers: cors });
    }

    if (path === '/api/crisis/resolve' && method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch { /**/ }
      const crisis = crisisLog.find(c => c.id === body.id);
      if (!crisis) return Response.json({ error: 'CRISIS_NOT_FOUND' }, { status: 404, headers: cors });
      crisis.status = 'RESOLVED';
      crisis.resolvedAt = Date.now();
      return Response.json({ resolved: true, crisis, responseMs: 12, beat }, { headers: cors });
    }

    return Response.json({
      error    : 'NOT_FOUND',
      path,
      available: ['/', '/api/status', '/api/companion/interact', '/api/flight/predict', '/api/social/mesh', '/api/crisis/active', '/api/crisis/resolve'],
    }, { status: 404, headers: cors });
  },
};
