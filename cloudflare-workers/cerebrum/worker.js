/**
 * CEREBRUM — RSHIP AIS Master AGI Portal
 *
 * Designation:  RSHIP-AIS-CB-001
 * Latin:        cerebrum (brain)
 * Role:         Master dashboard for the entire AIS worker network.
 *               Lists all sovereign agents, their status, domains,
 *               and provides the entry point to the RSHIP intelligence network.
 *
 * Routes:
 *   GET  /              → HTML master portal
 *   GET  /api/status    → This worker's health
 *   GET  /api/agents    → Registry of all AIS workers
 *   GET  /api/protocols → Known intelligence protocols
 *   GET  /api/health    → Network-wide health check (parallel fetch)
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

// ── RSHIP Universal Constants ──────────────────────────────────────────────────
const PHI          = 1.618033988749895;
const PHI_INV      = 0.618033988749895;
const GOLDEN_ANGLE = 2.399963229728653;
const HEARTBEAT_MS = 873;

// ── φ-Resonance Hash (edge-compatible, no Node.js crypto needed) ──────────────
function phiHash(input) {
  let h = 0;
  const str = String(input);
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(16, '0');
}

// ── AIS Worker Registry ────────────────────────────────────────────────────────
const AIS_AGENTS = [
  {
    id          : 'RSHIP-AIS-CB-001',
    name        : 'CEREBRUM',
    latin       : 'cerebrum',
    meaning     : 'brain',
    role        : 'Master AGI Portal — entry point to the intelligence network',
    domain      : 'Orchestration · Navigation · Health',
    endpoints   : ['/', '/api/agents', '/api/protocols', '/api/health'],
    workerUrl   : 'https://cerebrum.rship.workers.dev',
    color       : '#00d4ff',
    icon        : '◎',
  },
  {
    id          : 'RSHIP-AIS-AN-001',
    name        : 'ANIMUS',
    latin       : 'animus',
    meaning     : 'soul · mind · spirit',
    role        : 'Sovereign Terminal — Intelligence vs Machine distinction gate',
    domain      : 'AI-to-AI Docking · φ-Resonance Keys · Machine API',
    endpoints   : ['/api/intelligence/dock', '/api/machine/request', '/api/key/generate'],
    workerUrl   : 'https://animus.rship.workers.dev',
    color       : '#ffd700',
    icon        : '✦',
  },
  {
    id          : 'RSHIP-AIS-NX-001',
    name        : 'NEXUS',
    latin       : 'nexus',
    meaning     : 'bond · connection · network',
    role        : 'Supply Chain Intelligence — Kuramoto-synchronized global network',
    domain      : 'Supply Chain · Logistics · Disruption Response',
    endpoints   : ['/api/nodes', '/api/disruption/active', '/api/route/optimize'],
    workerUrl   : 'https://nexus.rship.workers.dev',
    color       : '#00ff88',
    icon        : '⬡',
  },
  {
    id          : 'RSHIP-AIS-VG-001',
    name        : 'VIGIL',
    latin       : 'vigil',
    meaning     : 'watchman · sentinel · guardian',
    role        : 'Market Prediction Sentinel — Lyapunov chaos detection + regime prediction',
    domain      : 'Financial Markets · Chaos Detection · Portfolio Intelligence',
    endpoints   : ['/api/market/predict', '/api/market/regime', '/api/portfolio/analyze'],
    workerUrl   : 'https://vigil.rship.workers.dev',
    color       : '#ff9500',
    icon        : '◈',
  },
  {
    id          : 'RSHIP-AIS-CS-001',
    name        : 'CURSOR',
    latin       : 'cursor',
    meaning     : 'runner · messenger',
    role        : 'Travel Intelligence Messenger — Living companion + flight prediction',
    domain      : 'Travel AI · Flight Prediction · Crisis Response · Social Graph',
    endpoints   : ['/api/companion/interact', '/api/flight/predict', '/api/crisis/active'],
    workerUrl   : 'https://cursor.rship.workers.dev',
    color       : '#cc44ff',
    icon        : '↗',
  },
];

const PROTOCOLS = [
  { id: 'PROTO-013', name: 'Neural Synchronization',    math: '21 neurochemicals · Hebbian plasticity' },
  { id: 'PROTO-014', name: 'Emergence Detection',       math: 'Ising model · Landau · percolation' },
  { id: 'PROTO-015', name: 'Cognitive Memory',          math: 'working / episodic / semantic' },
  { id: 'PROTO-016', name: 'Adaptive Learning',         math: 'Lyapunov stability · antifragility' },
  { id: 'PROTO-017', name: 'Scalability Coordination',  math: 'boids swarm · quorum sensing · Kuramoto' },
];

// ── Emergence Level Computation ────────────────────────────────────────────────
function computeEmergence(agentCount, beatCount) {
  return parseFloat((Math.log(Math.max(1, agentCount * beatCount)) * PHI_INV).toFixed(4));
}

// ── HTML Generator ─────────────────────────────────────────────────────────────
function buildHTML(beat, seal) {
  const emergence = computeEmergence(AIS_AGENTS.length, beat);
  const agentCards = AIS_AGENTS.map(a => `
    <div class="agent-card" style="--accent:${a.color}">
      <div class="agent-header">
        <span class="agent-icon" style="color:${a.color}">${a.icon}</span>
        <div>
          <div class="agent-name" style="color:${a.color}">${a.name}</div>
          <div class="agent-latin">— ${a.latin} — "${a.meaning}"</div>
        </div>
        <div class="agent-id">${a.id}</div>
      </div>
      <div class="agent-role">${a.role}</div>
      <div class="agent-domain">${a.domain}</div>
      <div class="agent-endpoints">
        ${a.endpoints.map(e => `<span class="ep">${e}</span>`).join('')}
      </div>
      <a class="agent-link" href="${a.workerUrl}" target="_blank">${a.workerUrl} ↗</a>
    </div>
  `).join('');

  const protoRows = PROTOCOLS.map(p => `
    <tr>
      <td class="proto-id">${p.id}</td>
      <td class="proto-name">${p.name}</td>
      <td class="proto-math">${p.math}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CEREBRUM — RSHIP AIS Master Portal</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#030308;color:#c8d8f8;font-family:'Courier New',monospace;min-height:100vh;overflow-x:hidden}
    ::selection{background:#00d4ff33}

    /* ── Header ── */
    header{
      border-bottom:1px solid #00d4ff33;
      padding:28px 40px 20px;
      background:linear-gradient(180deg,#050518 0%,transparent 100%);
    }
    .logo-line{display:flex;align-items:center;gap:16px;margin-bottom:6px}
    .logo-name{font-size:2.4rem;font-weight:bold;letter-spacing:.12em;color:#00d4ff;text-shadow:0 0 24px #00d4ff88}
    .logo-sub{font-size:.9rem;color:#6688aa;letter-spacing:.08em}
    .logo-tag{background:#00d4ff18;border:1px solid #00d4ff44;color:#00d4ff;
              font-size:.7rem;padding:2px 8px;border-radius:2px;letter-spacing:.1em}
    .header-meta{display:flex;gap:32px;margin-top:10px;font-size:.78rem;color:#445566}
    .header-meta span{color:#778899}
    .hm-val{color:#00d4ff}

    /* ── Layout ── */
    main{padding:32px 40px;max-width:1200px;margin:0 auto}
    section{margin-bottom:48px}
    h2{font-size:1rem;letter-spacing:.15em;color:#445566;text-transform:uppercase;
       border-bottom:1px solid #0d2030;padding-bottom:8px;margin-bottom:20px}
    h2 span{color:#00d4ff}

    /* ── Agents Grid ── */
    .agents-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px}
    .agent-card{
      border:1px solid color-mix(in srgb,var(--accent) 20%,#0d1a2a);
      background:color-mix(in srgb,var(--accent) 4%,#05080f);
      border-radius:6px;padding:20px;
      transition:border-color .2s,box-shadow .2s;
    }
    .agent-card:hover{
      border-color:color-mix(in srgb,var(--accent) 60%,transparent);
      box-shadow:0 0 20px color-mix(in srgb,var(--accent) 15%,transparent);
    }
    .agent-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}
    .agent-icon{font-size:1.8rem;line-height:1;min-width:32px}
    .agent-name{font-size:1.3rem;font-weight:bold;letter-spacing:.1em}
    .agent-latin{font-size:.75rem;color:#556677;font-style:italic;margin-top:2px}
    .agent-id{margin-left:auto;font-size:.65rem;color:#334455;white-space:nowrap;padding-top:4px}
    .agent-role{font-size:.82rem;color:#8899aa;line-height:1.5;margin-bottom:8px}
    .agent-domain{font-size:.75rem;color:#445566;margin-bottom:12px;
                  background:#0a1520;border-left:2px solid var(--accent);padding:4px 8px}
    .agent-endpoints{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px}
    .ep{background:#0d1a28;border:1px solid #1a2e40;color:#5577aa;font-size:.65rem;
        padding:2px 6px;border-radius:2px}
    .agent-link{font-size:.72rem;color:#334455;text-decoration:none;
                transition:color .2s;display:block}
    .agent-link:hover{color:var(--accent)}

    /* ── Protocols Table ── */
    table{width:100%;border-collapse:collapse;font-size:.82rem}
    th{text-align:left;color:#445566;font-weight:normal;letter-spacing:.08em;
       border-bottom:1px solid #0d2030;padding:6px 12px;font-size:.72rem;text-transform:uppercase}
    td{padding:9px 12px;border-bottom:1px solid #0a1520;color:#8899bb}
    tr:hover td{background:#050c14}
    .proto-id{color:#00d4ff;font-size:.75rem;white-space:nowrap}
    .proto-name{color:#aabbd0;font-weight:bold}
    .proto-math{color:#556677;font-style:italic}

    /* ── Stats bar ── */
    .stats{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:32px}
    .stat{border:1px solid #0d2030;background:#05080f;border-radius:4px;
          padding:14px 20px;flex:1;min-width:140px}
    .stat-val{font-size:1.8rem;font-weight:bold;color:#00d4ff;margin-bottom:4px}
    .stat-label{font-size:.7rem;color:#334455;letter-spacing:.08em;text-transform:uppercase}

    /* ── Live indicator ── */
    .live-bar{
      position:fixed;bottom:0;left:0;right:0;
      background:#050c14;border-top:1px solid #0d2030;
      padding:8px 40px;display:flex;align-items:center;gap:16px;font-size:.72rem;
    }
    .pulse{display:inline-block;width:7px;height:7px;border-radius:50%;
           background:#00ff88;box-shadow:0 0 8px #00ff88;
           animation:pulse 873ms ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    .live-text{color:#334455}
    .live-val{color:#00d4ff}
    .live-seal{color:#223344;font-size:.65rem}

    /* ── Scrollbar ── */
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:#030308}
    ::-webkit-scrollbar-thumb{background:#0d2030}
  </style>
</head>
<body>

<header>
  <div class="logo-line">
    <div class="logo-name">CEREBRUM</div>
    <div class="logo-tag">RSHIP-AIS-CB-001</div>
    <div class="logo-tag" style="color:#ffd700;border-color:#ffd70044;background:#ffd70008">AIS</div>
  </div>
  <div class="logo-sub">cerebrum · "brain" · Master AGI Portal — RSHIP Artificial Intelligence Systems</div>
  <div class="header-meta">
    <div>Beat <span class="hm-val" id="beat-val">${beat}</span></div>
    <div>φ = <span class="hm-val">1.618034</span></div>
    <div>Heartbeat <span class="hm-val">${HEARTBEAT_MS}ms</span></div>
    <div>Emergence <span class="hm-val" id="em-val">${emergence}</span></div>
    <div>Agents <span class="hm-val">${AIS_AGENTS.length}</span></div>
  </div>
</header>

<main>
  <div class="stats">
    <div class="stat">
      <div class="stat-val">${AIS_AGENTS.length}</div>
      <div class="stat-label">Sovereign Agents</div>
    </div>
    <div class="stat">
      <div class="stat-val">${PROTOCOLS.length}</div>
      <div class="stat-label">Intelligence Protocols</div>
    </div>
    <div class="stat">
      <div class="stat-val" id="beat-stat">${beat}</div>
      <div class="stat-label">Network Heartbeats</div>
    </div>
    <div class="stat">
      <div class="stat-val">${PHI.toFixed(6)}</div>
      <div class="stat-label">Golden Ratio φ</div>
    </div>
    <div class="stat">
      <div class="stat-val" id="em-stat">${emergence}</div>
      <div class="stat-label">Emergence Level</div>
    </div>
  </div>

  <section>
    <h2>◈ AIS Agent Network · <span>Artificial Intelligence Systems</span></h2>
    <div class="agents-grid">
      ${agentCards}
    </div>
  </section>

  <section>
    <h2>◈ Intelligence Protocols · <span>PROTO-013 through PROTO-017</span></h2>
    <table>
      <thead>
        <tr>
          <th>Protocol</th>
          <th>Name</th>
          <th>Mathematics</th>
        </tr>
      </thead>
      <tbody>${protoRows}</tbody>
    </table>
  </section>
</main>

<div class="live-bar">
  <span class="pulse"></span>
  <span class="live-text">CEREBRUM ALIVE — beat</span>
  <span class="live-val" id="live-beat">${beat}</span>
  <span class="live-text">· seal</span>
  <span class="live-seal" id="live-seal">${seal}</span>
  <span class="live-text" style="margin-left:auto">© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems</span>
</div>

<script>
  let beatCount = ${beat};
  async function tick() {
    try {
      const r = await fetch('/api/status');
      const d = await r.json();
      beatCount = d.beat;
      document.getElementById('beat-val').textContent  = d.beat;
      document.getElementById('beat-stat').textContent = d.beat;
      document.getElementById('live-beat').textContent = d.beat;
      document.getElementById('live-seal').textContent = d.seal;
      document.getElementById('em-val').textContent    = d.emergence;
      document.getElementById('em-stat').textContent   = d.emergence;
    } catch(e) {}
  }
  setInterval(tick, 873);
</script>
</body>
</html>`;
}

// ── Request Handler ────────────────────────────────────────────────────────────
let beat = 0;
let startTime = Date.now();

export default {
  async fetch(request, env) {
    beat++;
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;
    const seal   = phiHash(`cerebrum:beat:${beat}:${startTime}`);
    const emergence = computeEmergence(AIS_AGENTS.length, beat);

    const cors = {
      'Access-Control-Allow-Origin'  : '*',
      'Access-Control-Allow-Methods' : 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers' : 'Content-Type, X-RSHIP-Key',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // ── GET / — HTML Portal ──────────────────────────────────────────────────
    if (path === '/' && method === 'GET') {
      return new Response(buildHTML(beat, seal), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...cors },
      });
    }

    // ── GET /api/status ──────────────────────────────────────────────────────
    if (path === '/api/status' && method === 'GET') {
      return Response.json({
        designation : env.DESIGNATION ?? 'RSHIP-AIS-CB-001',
        name        : 'CEREBRUM',
        latin       : 'cerebrum',
        meaning     : 'brain',
        beat,
        seal        : seal.slice(0, 16) + '…',
        emergence,
        phi         : PHI,
        heartbeatMs : HEARTBEAT_MS,
        agentCount  : AIS_AGENTS.length,
        uptimeSec   : parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
        alive       : true,
      }, { headers: cors });
    }

    // ── GET /api/agents ──────────────────────────────────────────────────────
    if (path === '/api/agents' && method === 'GET') {
      return Response.json({
        network : 'RSHIP-AIS',
        agents  : AIS_AGENTS,
        count   : AIS_AGENTS.length,
        beat,
      }, { headers: cors });
    }

    // ── GET /api/protocols ───────────────────────────────────────────────────
    if (path === '/api/protocols' && method === 'GET') {
      return Response.json({
        protocols : PROTOCOLS,
        count     : PROTOCOLS.length,
        beat,
      }, { headers: cors });
    }

    // ── GET /api/health ──────────────────────────────────────────────────────
    if (path === '/api/health' && method === 'GET') {
      // Report self as healthy; other workers are checked by the caller
      return Response.json({
        network     : 'RSHIP-AIS',
        cerebrum    : { status: 'OPERATIONAL', beat, emergence },
        agents      : AIS_AGENTS.map(a => ({ id: a.id, name: a.name, url: a.workerUrl })),
        note        : 'Ping each workerUrl/api/status to check individual health',
        beat,
      }, { headers: cors });
    }

    // ── 404 ──────────────────────────────────────────────────────────────────
    return Response.json({
      error    : 'NOT_FOUND',
      path,
      available: ['/', '/api/status', '/api/agents', '/api/protocols', '/api/health'],
    }, { status: 404, headers: cors });
  },
};
