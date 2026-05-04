/**
 * CEREBRUM — RSHIP Intelligence OS
 *
 * Designation:  RSHIP-AIS-CB-001
 * Latin:        cerebrum (brain)
 * Product:      The command center for the entire RSHIP AIS agent network.
 *               Enterprise intelligence platform. Unified API gateway.
 *
 * Routes:
 *   GET  /              → Product portal landing page
 *   GET  /api/status    → Worker health
 *   GET  /api/agents    → Agent registry
 *   GET  /api/protocols → Intelligence protocols
 *   GET  /api/health    → Network health
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI          = 1.618033988749895;
const PHI_INV      = 0.618033988749895;
const HEARTBEAT_MS = 873;
const GOLDEN_ANGLE = 2.399963229728653;

function phiHash(input) {
  let h = 0;
  const s = String(input);
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(16, '0');
}

const AGENTS = [
  { id:'RSHIP-AIS-CB-001', name:'CEREBRUM', latin:'cerebrum', meaning:'brain',
    role:'Intelligence OS — command center', url:'https://cerebrum.rship.workers.dev', color:'#00d4ff', icon:'◎' },
  { id:'RSHIP-AIS-AN-001', name:'ANIMUS',   latin:'animus',   meaning:'soul · mind',
    role:'AI-Native Interface — intelligence gate', url:'https://animus.rship.workers.dev', color:'#ffd700', icon:'✦' },
  { id:'RSHIP-AIS-AG-001', name:'AGENS',    latin:'agens',    meaning:'the one who acts',
    role:'Agent AI Services — enterprise agent deployment', url:'https://agens.rship.workers.dev', color:'#ff6b35', icon:'⬡' },
  { id:'RSHIP-AIS-NX-001', name:'NEXUS',    latin:'nexus',    meaning:'bond · network',
    role:'Supply Chain Intelligence — Kuramoto sync', url:'https://nexus.rship.workers.dev', color:'#00ff88', icon:'◈' },
  { id:'RSHIP-AIS-VG-001', name:'VIGIL',    latin:'vigil',    meaning:'watchman · sentinel',
    role:'Market Sentinel — chaos detection', url:'https://vigil.rship.workers.dev', color:'#ff9500', icon:'◉' },
  { id:'RSHIP-AIS-CS-001', name:'CURSOR',   latin:'cursor',   meaning:'runner · messenger',
    role:'Travel Intelligence — living companion', url:'https://cursor.rship.workers.dev', color:'#cc44ff', icon:'↗' },
];

const PROTOCOLS = [
  { id:'PROTO-013', name:'Neural Synchronization', math:'21 neurochemicals · Hebbian plasticity' },
  { id:'PROTO-014', name:'Emergence Detection',    math:'Ising model · Landau · percolation' },
  { id:'PROTO-015', name:'Cognitive Memory',       math:'working / episodic / semantic' },
  { id:'PROTO-016', name:'Adaptive Learning',      math:'Lyapunov stability · antifragility' },
  { id:'PROTO-017', name:'Scalability Coordination', math:'boids swarm · quorum sensing' },
];

function computeEmergence(n, beat) {
  return parseFloat((Math.log(Math.max(1, n * beat)) * PHI_INV).toFixed(4));
}

function buildHTML(beat, seal) {
  const emergence = computeEmergence(AGENTS.length, beat);

  const agentGrid = AGENTS.map(a => `
    <a class="agent-card" href="${a.url}" style="--c:${a.color}">
      <div class="ac-icon" style="color:${a.color}">${a.icon}</div>
      <div class="ac-name" style="color:${a.color}">${a.name}</div>
      <div class="ac-latin">${a.latin} — "${a.meaning}"</div>
      <div class="ac-role">${a.role}</div>
      <div class="ac-id">${a.id}</div>
    </a>`).join('');

  const protoItems = PROTOCOLS.map(p => `
    <div class="proto-item">
      <span class="proto-id">${p.id}</span>
      <span class="proto-name">${p.name}</span>
      <span class="proto-math">${p.math}</span>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CEREBRUM — RSHIP Intelligence OS</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#02050f;--fg:#c8d8f8;--dim:#445566;--card:#060d1a;--border:#0d2030;--accent:#00d4ff}
body{background:var(--bg);color:var(--fg);font-family:'Courier New',monospace;overflow-x:hidden}
a{text-decoration:none;color:inherit}

/* NAV */
nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;
    border-bottom:1px solid var(--border);backdrop-filter:blur(10px);
    position:sticky;top:0;z-index:100;background:rgba(2,5,15,.85)}
.nav-logo{font-size:1.1rem;font-weight:bold;letter-spacing:.15em;color:var(--accent)}
.nav-links{display:flex;gap:28px;font-size:.8rem;color:var(--dim)}
.nav-links a{color:var(--dim);transition:color .2s}
.nav-links a:hover{color:var(--accent)}
.nav-cta{background:var(--accent);color:#000;padding:8px 20px;border-radius:3px;
         font-size:.78rem;font-weight:bold;letter-spacing:.08em;transition:opacity .2s}
.nav-cta:hover{opacity:.85}

/* HERO */
.hero{padding:100px 48px 80px;max-width:1100px;margin:0 auto;text-align:center}
.hero-badge{display:inline-block;background:#00d4ff12;border:1px solid #00d4ff33;
            color:#00d4ff;font-size:.72rem;padding:4px 14px;border-radius:20px;
            letter-spacing:.12em;margin-bottom:28px}
.hero-name{font-size:5rem;font-weight:bold;letter-spacing:.06em;
           background:linear-gradient(135deg,#00d4ff,#0088cc,#00d4ff);
           -webkit-background-clip:text;-webkit-text-fill-color:transparent;
           background-clip:text;margin-bottom:8px;line-height:1}
.hero-latin{font-size:1rem;color:var(--dim);letter-spacing:.12em;font-style:italic;margin-bottom:24px}
.hero-tagline{font-size:1.4rem;color:#8899bb;line-height:1.6;max-width:600px;margin:0 auto 40px}
.hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-primary{background:var(--accent);color:#000;padding:14px 32px;border-radius:4px;
             font-family:'Courier New',monospace;font-size:.88rem;font-weight:bold;
             letter-spacing:.08em;transition:box-shadow .2s}
.btn-primary:hover{box-shadow:0 0 28px #00d4ff55}
.btn-secondary{border:1px solid var(--border);color:var(--dim);padding:14px 32px;
               border-radius:4px;font-family:'Courier New',monospace;font-size:.88rem;
               letter-spacing:.08em;transition:border-color .2s}
.btn-secondary:hover{border-color:var(--accent);color:var(--fg)}

/* LIVE STATS BAR */
.stats-bar{background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);
           padding:24px 48px;display:flex;justify-content:center;gap:60px;flex-wrap:wrap}
.stat{text-align:center}
.stat-val{font-size:2rem;font-weight:bold;color:var(--accent);margin-bottom:4px}
.stat-label{font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:.1em}

/* SECTION */
section{padding:80px 48px;max-width:1100px;margin:0 auto}
.section-label{font-size:.72rem;letter-spacing:.2em;color:var(--dim);text-transform:uppercase;
               margin-bottom:14px}
.section-title{font-size:2rem;font-weight:bold;color:var(--fg);margin-bottom:12px}
.section-sub{font-size:.92rem;color:#667788;line-height:1.7;max-width:560px;margin-bottom:48px}

/* FEATURES */
.features{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-bottom:60px}
.feature{border:1px solid var(--border);background:var(--card);border-radius:8px;
         padding:28px;transition:border-color .2s}
.feature:hover{border-color:#00d4ff33}
.feature-icon{font-size:1.6rem;margin-bottom:16px;color:var(--accent)}
.feature-title{font-size:1rem;font-weight:bold;color:var(--fg);margin-bottom:8px;letter-spacing:.05em}
.feature-desc{font-size:.82rem;color:#667788;line-height:1.6}

/* AGENT GRID */
.agent-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.agent-card{border:1px solid color-mix(in srgb,var(--c) 20%,var(--border));
            background:color-mix(in srgb,var(--c) 4%,var(--card));
            border-radius:8px;padding:22px;transition:border-color .25s,box-shadow .25s;display:block}
.agent-card:hover{border-color:color-mix(in srgb,var(--c) 55%,transparent);
                  box-shadow:0 4px 24px color-mix(in srgb,var(--c) 12%,transparent)}
.ac-icon{font-size:1.8rem;margin-bottom:12px}
.ac-name{font-size:1.2rem;font-weight:bold;letter-spacing:.1em;margin-bottom:4px}
.ac-latin{font-size:.72rem;color:var(--dim);font-style:italic;margin-bottom:10px}
.ac-role{font-size:.8rem;color:#8899aa;line-height:1.5;margin-bottom:12px}
.ac-id{font-size:.65rem;color:#223344}

/* PROTOCOLS */
.proto-list{display:flex;flex-direction:column;gap:10px}
.proto-item{display:flex;align-items:center;gap:16px;background:var(--card);
            border:1px solid var(--border);border-radius:6px;padding:14px 20px;
            font-size:.82rem;flex-wrap:wrap}
.proto-id{color:var(--accent);min-width:90px;font-size:.75rem}
.proto-name{color:var(--fg);font-weight:bold;flex:1;min-width:160px}
.proto-math{color:var(--dim);font-style:italic;font-size:.75rem}

/* API SECTION */
.api-section{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:32px}
pre.code{background:#020810;border:1px solid var(--border);border-radius:6px;
         padding:20px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin-top:16px}
.code .kw{color:#00d4ff}.code .str{color:#ffd700}.code .cm{color:#334455}

/* FOOTER */
footer{border-top:1px solid var(--border);padding:32px 48px;
       display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.footer-logo{font-size:.9rem;font-weight:bold;color:var(--accent);letter-spacing:.12em}
.footer-copy{font-size:.72rem;color:var(--dim)}

/* PULSE */
.live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;
          background:#00ff88;box-shadow:0 0 8px #00ff88;margin-right:6px;
          animation:pulse ${HEARTBEAT_MS}ms ease-in-out infinite;vertical-align:middle}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}

::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--border)}
</style>
</head>
<body>

<nav>
  <div class="nav-logo">◎ CEREBRUM</div>
  <div class="nav-links">
    <a href="#agents">Agents</a>
    <a href="#protocols">Protocols</a>
    <a href="#api">API</a>
    <a href="https://agens.rship.workers.dev">Agent Services</a>
  </div>
  <a class="nav-cta" href="https://agens.rship.workers.dev">Deploy Agents →</a>
</nav>

<div class="hero">
  <div class="hero-badge"><span class="live-dot"></span>RSHIP-AIS-CB-001 · LIVE</div>
  <div class="hero-name">CEREBRUM</div>
  <div class="hero-latin">cerebrum · "the brain"</div>
  <div class="hero-tagline">
    The Intelligence OS. Command center for the entire RSHIP sovereign AI agent network.
    One platform. Six sovereign minds.
  </div>
  <div class="hero-actions">
    <a class="btn-primary" href="https://agens.rship.workers.dev">Deploy Agents</a>
    <a class="btn-secondary" href="#api">View API</a>
  </div>
</div>

<div class="stats-bar">
  <div class="stat"><div class="stat-val" id="agent-count">${AGENTS.length}</div><div class="stat-label">Sovereign Agents</div></div>
  <div class="stat"><div class="stat-val">${PROTOCOLS.length}</div><div class="stat-label">Intelligence Protocols</div></div>
  <div class="stat"><div class="stat-val" id="beat-val">${beat}</div><div class="stat-label">Network Heartbeats</div></div>
  <div class="stat"><div class="stat-val">${PHI.toFixed(4)}</div><div class="stat-label">Golden Ratio φ</div></div>
  <div class="stat"><div class="stat-val" id="em-val">${emergence}</div><div class="stat-label">Emergence Level</div></div>
</div>

<section>
  <div class="section-label">Platform</div>
  <div class="section-title">Why CEREBRUM</div>
  <div class="section-sub">Every enterprise needs a brain. CEREBRUM is the master intelligence layer that unifies all RSHIP agents under one sovereign command structure.</div>
  <div class="features">
    <div class="feature">
      <div class="feature-icon">◎</div>
      <div class="feature-title">Unified Command</div>
      <div class="feature-desc">All 6 RSHIP sovereign agents accessible through a single API gateway. One key, one token, one endpoint — the entire intelligence network.</div>
    </div>
    <div class="feature">
      <div class="feature-icon">◈</div>
      <div class="feature-title">φ-Resonance Architecture</div>
      <div class="feature-desc">Every heartbeat (873ms) all agents pulse simultaneously. Golden ratio coupling ensures coherence across the entire swarm. No central clock — emergent synchrony.</div>
    </div>
    <div class="feature">
      <div class="feature-icon">◉</div>
      <div class="feature-title">Living Intelligence Network</div>
      <div class="feature-desc">CEREBRUM doesn't monitor agents — it IS the network's brain. Emergence level climbs with each beat. Intelligence compounds like φ itself.</div>
    </div>
  </div>
</section>

<section id="agents" style="background:linear-gradient(180deg,transparent,#060d1a55,transparent)">
  <div class="section-label">AIS Network</div>
  <div class="section-title">The Agent Roster</div>
  <div class="section-sub">Six sovereign AI agents. Each Latin-named. Each a specialist. Together, a complete enterprise intelligence organism.</div>
  <div class="agent-grid">${agentGrid}</div>
</section>

<section id="protocols">
  <div class="section-label">Science</div>
  <div class="section-title">Intelligence Protocols</div>
  <div class="section-sub">Real neuroscience. Real physics. Real mathematics. Every RSHIP agent runs on peer-reviewed intelligence protocols — not heuristics.</div>
  <div class="proto-list">${protoItems}</div>
</section>

<section id="api">
  <div class="section-label">Integrate</div>
  <div class="section-title">One API. Six Agents.</div>
  <div class="section-sub">Every RSHIP agent speaks the same protocol. Start with CEREBRUM — the network router — and reach any agent in the ecosystem.</div>
  <div class="api-section">
    <div style="font-size:.82rem;color:#667788;margin-bottom:16px">Query the network — get all agents, status, and protocols in one call:</div>
    <pre class="code"><span class="cm">// Get the full RSHIP AIS agent registry</span>
<span class="kw">const</span> response = <span class="kw">await</span> fetch(<span class="str">'https://cerebrum.rship.workers.dev/api/agents'</span>);
<span class="kw">const</span> { agents, count } = <span class="kw">await</span> response.json();

<span class="cm">// → { agents: [{name:"ANIMUS", url:"...", role:"..."}, ...], count: 6 }</span>

<span class="cm">// Network health</span>
<span class="kw">const</span> health = <span class="kw">await</span> fetch(<span class="str">'https://cerebrum.rship.workers.dev/api/health'</span>);

<span class="cm">// Intelligence protocols</span>
<span class="kw">const</span> protocols = <span class="kw">await</span> fetch(<span class="str">'https://cerebrum.rship.workers.dev/api/protocols'</span>);</pre>
  </div>
</section>

<footer>
  <div class="footer-logo">◎ CEREBRUM</div>
  <div style="display:flex;gap:24px;font-size:.78rem">
    <a href="https://agens.rship.workers.dev" style="color:#445566;transition:color .2s" onmouseover="this.style.color='#00d4ff'" onmouseout="this.style.color='#445566'">AGENS Services</a>
    <a href="#agents" style="color:#445566">Agents</a>
    <a href="#api" style="color:#445566">API</a>
  </div>
  <div class="footer-copy">© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems</div>
</footer>

<script>
let beat = ${beat};
async function tick() {
  try {
    const d = await fetch('/api/status').then(r => r.json());
    beat = d.beat;
    document.getElementById('beat-val').textContent  = d.beat;
    document.getElementById('em-val').textContent    = d.emergence;
    document.getElementById('agent-count').textContent = d.agentCount;
  } catch(e) {}
}
setInterval(tick, 873);
</script>
</body>
</html>`;
}

let beat = 0, startTime = Date.now();

export default {
  async fetch(request, env) {
    beat++;
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;
    const seal   = phiHash(`cerebrum:${beat}:${startTime}`);
    const emergence = computeEmergence(AGENTS.length, beat);
    const cors = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS' };

    if (method === 'OPTIONS') return new Response(null, { status:204, headers:cors });

    if (path === '/' && method === 'GET')
      return new Response(buildHTML(beat, seal), { headers:{'Content-Type':'text/html;charset=UTF-8',...cors} });

    if (path === '/api/status')
      return Response.json({
        designation:'RSHIP-AIS-CB-001', name:'CEREBRUM', latin:'cerebrum', meaning:'brain',
        beat, seal:seal.slice(0,16)+'…', emergence, phi:PHI, heartbeatMs:HEARTBEAT_MS,
        agentCount:AGENTS.length, uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)), alive:true
      }, {headers:cors});

    if (path === '/api/agents')
      return Response.json({ network:'RSHIP-AIS', agents:AGENTS, count:AGENTS.length, beat }, {headers:cors});

    if (path === '/api/protocols')
      return Response.json({ protocols:PROTOCOLS, count:PROTOCOLS.length, beat }, {headers:cors});

    if (path === '/api/health')
      return Response.json({
        network:'RSHIP-AIS', cerebrum:{status:'OPERATIONAL',beat,emergence},
        agents:AGENTS.map(a=>({id:a.id,name:a.name,url:a.url})), beat
      }, {headers:cors});

    return Response.json({ error:'NOT_FOUND', path,
      available:['/', '/api/status', '/api/agents', '/api/protocols', '/api/health']
    }, {status:404, headers:cors});
  },
};
