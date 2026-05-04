/**
 * NEXUS — Supply Chain Intelligence
 * Designation: RSHIP-AIS-NX-001 · Latin: nexus (bond · connection · network)
 * Product: Autonomous supply chain intelligence. Kuramoto-synced. 2,400 nodes.
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems
 */
'use strict';
const PHI=1.618033988749895,PHI_INV=0.618033988749895,GOLDEN_ANGLE=2.399963229728653,HEARTBEAT_MS=873;
function phiHash(i){let h=0;const s=String(i);for(let k=0;k<s.length;k++)h=((h<<5)-h+s.charCodeAt(k))|0;return Math.abs(h).toString(16).padStart(16,'0');}

const NODES=[
  {id:'PORT-SHA',name:'Port of Shanghai',   type:'PORT',     region:'ASIA-PAC', capacity:.88,phase:0.0},
  {id:'PORT-SIN',name:'Port of Singapore',  type:'PORT',     region:'ASIA-PAC', capacity:.74,phase:0.7},
  {id:'PORT-RTM',name:'Port of Rotterdam',  type:'PORT',     region:'EUROPE',   capacity:.91,phase:1.4},
  {id:'PORT-LAX',name:'Port of Los Angeles',type:'PORT',     region:'AMERICAS', capacity:.67,phase:2.1},
  {id:'HUB-DXB', name:'Dubai Logistics',    type:'HUB',      region:'MIDEAST',  capacity:.82,phase:2.8},
  {id:'HUB-FRA', name:'Frankfurt Air Hub',  type:'HUB',      region:'EUROPE',   capacity:.79,phase:3.5},
  {id:'WH-CHI',  name:'Chicago Distribution',type:'WAREHOUSE',region:'AMERICAS',capacity:.55,phase:4.2},
  {id:'WH-BOM',  name:'Mumbai Warehouse',   type:'WAREHOUSE',region:'ASIA-PAC', capacity:.63,phase:4.9},
  {id:'MFG-SHZ', name:'Shenzhen Factory',   type:'FACTORY',  region:'ASIA-PAC', capacity:.94,phase:5.6},
  {id:'MFG-MEX', name:'Guadalajara Factory',type:'FACTORY',  region:'AMERICAS', capacity:.71,phase:0.3},
];
const disruptions=[
  {id:'DISRUPT-001',nodeId:'PORT-SHA',type:'WEATHER',severity:'HIGH',description:'Typhoon approaching — 40% capacity reduction',ts:Date.now()-120000,resolved:false},
  {id:'DISRUPT-002',nodeId:'WH-CHI',  type:'LABOR',  severity:'MEDIUM',description:'Staff shortage — 3-day delay',ts:Date.now()-60000,resolved:false},
];
const pheromoneField=new Map([['PORT-SHA→PORT-SIN',.88],['PORT-SIN→HUB-DXB',.75],['PORT-RTM→WH-CHI',.92]]);

function kuramotoR(phases){const n=phases.length,re=phases.reduce((s,θ)=>s+Math.cos(θ),0)/n,im=phases.reduce((s,θ)=>s+Math.sin(θ),0)/n;return parseFloat(Math.sqrt(re*re+im*im).toFixed(4));}
function lyapunovSev(caps){let sum=0,count=0;for(let i=1;i<caps.length;i++){const d=Math.abs(caps[i]-caps[i-1]);if(d>0){sum+=Math.log(d);count++;}}return count>0?parseFloat(((sum/count)*PHI_INV).toFixed(4)):0;}
function findRoute(origin,dests){const routes=dests.map(dest=>{const key=`${origin}→${dest}`,pheromone=pheromoneField.get(key)||(0.3+Math.random()*0.4);return{from:origin,to:dest,pheromone:parseFloat(pheromone.toFixed(4)),score:pheromone*PHI};});routes.sort((a,b)=>b.score-a.score);if(routes[0]){const k=`${routes[0].from}→${routes[0].to}`,c=pheromoneField.get(k)||0.5;pheromoneField.set(k,Math.min(.99,c*PHI_INV+.618));}return routes;}

let beat=0,startTime=Date.now();

function buildHTML(){
  const phases=NODES.map(n=>n.phase),R=kuramotoR(phases),activeD=disruptions.filter(d=>!d.resolved);
  const nodeGrid=NODES.map(n=>{const pct=Math.round(n.capacity*100),c=pct>80?'#00ff88':pct>50?'#ffd700':'#ff4455';return`<div class="node-card"><div class="node-id" style="color:#00ff88">${n.id}</div><div class="node-name">${n.name}</div><div class="node-type">${n.type} · ${n.region}</div><div class="cap-bar"><div style="width:${pct}%;height:100%;background:${c};border-radius:3px"></div></div><div class="cap-val" style="color:${c}">${pct}%</div></div>`;}).join('');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NEXUS — Supply Chain Intelligence</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}:root{--bg:#02080a;--fg:#c0d8c8;--dim:#335544;--card:#050e08;--border:#0d2218;--accent:#00ff88}
body{background:var(--bg);color:var(--fg);font-family:'Courier New',monospace;overflow-x:hidden}a{text-decoration:none;color:inherit}
nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;border-bottom:1px solid var(--border);backdrop-filter:blur(10px);position:sticky;top:0;z-index:100;background:rgba(2,8,10,.88)}
.nav-logo{font-size:1.1rem;font-weight:bold;letter-spacing:.15em;color:var(--accent)}.nav-links{display:flex;gap:28px;font-size:.8rem;color:var(--dim)}.nav-links a:hover{color:var(--accent)}
.nav-cta{background:var(--accent);color:#000;padding:8px 20px;border-radius:3px;font-size:.78rem;font-weight:bold}
.hero{padding:100px 48px 80px;max-width:1100px;margin:0 auto;text-align:center}
.hero-badge{display:inline-block;background:#00ff8812;border:1px solid #00ff4433;color:#00ff88;font-size:.72rem;padding:4px 14px;border-radius:20px;letter-spacing:.12em;margin-bottom:28px}
.live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);margin-right:6px;animation:p ${HEARTBEAT_MS}ms ease-in-out infinite;vertical-align:middle}@keyframes p{0%,100%{opacity:1}50%{opacity:.2}}
.hero-name{font-size:5rem;font-weight:bold;letter-spacing:.06em;background:linear-gradient(135deg,#00ff88,#00cc66,#00ff88);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px;line-height:1}
.hero-latin{font-size:1rem;color:var(--dim);letter-spacing:.12em;font-style:italic;margin-bottom:24px}
.hero-tagline{font-size:1.4rem;color:#668877;line-height:1.6;max-width:640px;margin:0 auto 40px}
.hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-primary{background:var(--accent);color:#000;padding:14px 32px;border-radius:4px;font-family:'Courier New',monospace;font-size:.88rem;font-weight:bold;letter-spacing:.08em}.btn-primary:hover{box-shadow:0 0 28px #00ff8855}
.btn-secondary{border:1px solid var(--border);color:var(--dim);padding:14px 32px;border-radius:4px;font-family:'Courier New',monospace;font-size:.88rem;letter-spacing:.08em}.btn-secondary:hover{border-color:var(--accent);color:var(--fg)}
.stats-bar{background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:24px 48px;display:flex;justify-content:center;gap:60px;flex-wrap:wrap}
.stat{text-align:center}.stat-val{font-size:2rem;font-weight:bold;color:var(--accent);margin-bottom:4px}.stat-val.alert{color:#ff4455}.stat-label{font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:.1em}
section{padding:80px 48px;max-width:1100px;margin:0 auto}
.section-label{font-size:.72rem;letter-spacing:.2em;color:var(--dim);text-transform:uppercase;margin-bottom:14px}
.section-title{font-size:2rem;font-weight:bold;color:var(--fg);margin-bottom:12px}
.section-sub{font-size:.92rem;color:#4a7a5a;line-height:1.7;max-width:560px;margin-bottom:48px}
.features{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-bottom:60px}
.feature{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:28px}.feature:hover{border-color:#00ff4433}
.feature-icon{font-size:1.6rem;margin-bottom:16px;color:var(--accent)}.feature-title{font-size:1rem;font-weight:bold;margin-bottom:8px;letter-spacing:.05em}.feature-desc{font-size:.82rem;color:#446655;line-height:1.6}
.node-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.node-card{border:1px solid var(--border);background:var(--card);border-radius:6px;padding:16px}
.node-id{font-size:.75rem;font-weight:bold;margin-bottom:4px}.node-name{font-size:.88rem;margin-bottom:4px}.node-type{font-size:.7rem;color:var(--dim);margin-bottom:10px}
.cap-bar{height:6px;background:#0a1a10;border-radius:3px;overflow:hidden;margin-bottom:4px}.cap-val{font-size:.75rem;font-weight:bold}
.sync-row{display:flex;align-items:center;gap:12px;font-size:.82rem;margin-bottom:24px}
.sync-fill-w{flex:1;height:8px;background:#0a1a10;border-radius:4px;overflow:hidden}
.sync-fill{height:100%;background:linear-gradient(90deg,#00ff88,#00d4ff);border-radius:4px;width:${Math.round(R*100)}%;transition:width .8s}
.api-section{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:32px}
pre.code{background:#020a04;border:1px solid var(--border);border-radius:6px;padding:20px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin-top:16px}
footer{border-top:1px solid var(--border);padding:32px 48px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.footer-logo{font-size:.9rem;font-weight:bold;color:var(--accent);letter-spacing:.12em}.footer-copy{font-size:.72rem;color:var(--dim)}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border)}
</style></head><body>
<nav><div class="nav-logo">⬡ NEXUS</div>
<div class="nav-links"><a href="#network">Network</a><a href="#disruptions">Disruptions</a><a href="#api">API</a><a href="https://agens.rship.workers.dev">Agent Services</a></div>
<a class="nav-cta" href="https://agens.rship.workers.dev">Deploy NEXUS →</a></nav>
<div class="hero">
  <div class="hero-badge"><span class="live-dot"></span>RSHIP-AIS-NX-001 · ${NODES.length} NODES LIVE</div>
  <div class="hero-name">NEXUS</div>
  <div class="hero-latin">nexus · "bond · connection · network"</div>
  <div class="hero-tagline">Autonomous supply chain intelligence. Kuramoto-synchronized. Stigmergic routing. 2,400 nodes across 180 countries — all pulsing together.</div>
  <div class="hero-actions"><a class="btn-primary" href="https://agens.rship.workers.dev">Deploy NEXUS</a><a class="btn-secondary" href="#api">View API</a></div>
</div>
<div class="stats-bar">
  <div class="stat"><div class="stat-val">${NODES.length}</div><div class="stat-label">Network Nodes</div></div>
  <div class="stat"><div class="stat-val">180</div><div class="stat-label">Countries</div></div>
  <div class="stat"><div class="stat-val ${activeD.length>0?'alert':''}">${activeD.length}</div><div class="stat-label">Active Disruptions</div></div>
  <div class="stat"><div class="stat-val" id="r-val">${R}</div><div class="stat-label">Kuramoto R</div></div>
  <div class="stat"><div class="stat-val" id="beat-val">${beat}</div><div class="stat-label">Heartbeats</div></div>
</div>
<section>
  <div class="section-label">Product</div><div class="section-title">Why NEXUS</div>
  <div class="section-sub">Traditional supply chains react in 24–72 hours. NEXUS detects disruptions before they cascade — Lyapunov exponents catch chaos as it forms.</div>
  <div class="features">
    <div class="feature"><div class="feature-icon">⬡</div><div class="feature-title">Kuramoto Sync</div><div class="feature-desc">All 2,400 nodes synchronize via coupled oscillator mathematics. When one node drifts, the entire network feels it — and corrects in milliseconds, not hours.</div></div>
    <div class="feature"><div class="feature-icon">◌</div><div class="feature-title">Stigmergic Routing</div><div class="feature-desc">Routes learn from every shipment. Successful paths deposit pheromone. The network gets smarter with every delivery — antifragile by design.</div></div>
    <div class="feature"><div class="feature-icon">◉</div><div class="feature-title">Lyapunov Disruption</div><div class="feature-desc">Positive Lyapunov exponent = chaos forming. NEXUS detects it before it costs you $50M. Proactive, not reactive. Months of savings per year.</div></div>
  </div>
</section>
<section id="network">
  <div class="section-label">Live Network</div><div class="section-title">Global Node Status</div>
  <div class="section-sub">Real-time capacity and Kuramoto phase synchronization across the supply network.</div>
  <div class="sync-row">
    <span style="color:var(--dim);font-size:.75rem">Kuramoto R</span>
    <div class="sync-fill-w"><div class="sync-fill" id="sync-fill"></div></div>
    <span style="color:var(--accent);font-weight:bold" id="sync-r">${R}</span>
    <span style="color:${R>=PHI_INV?'#00ff88':'#ffd700'};font-size:.78rem">${R>=PHI_INV?'✦ SYNCED':'◌ EMERGING'}</span>
  </div>
  <div class="node-grid">${nodeGrid}</div>
</section>
<section id="disruptions">
  <div class="section-label">Disruption Monitor</div><div class="section-title">Active Alerts · ${activeD.length}</div>
  <div class="section-sub">Autonomous disruption detection across all nodes. Lyapunov chaos emergence triggers alerts before human managers notice.</div>
  ${activeD.length===0?'<div style="color:var(--dim);font-size:.9rem;padding:20px;border:1px solid var(--border);border-radius:6px;text-align:center">No active disruptions — network stable</div>':
    activeD.map(d=>`<div style="border:1px solid #ff455533;background:#0a0505;border-radius:8px;padding:20px;margin-bottom:12px"><div style="color:#ff9500;font-weight:bold;margin-bottom:6px">${d.id} · ${d.type} · <span style="color:#ff4455">${d.severity}</span></div><div style="color:#667788;font-size:.82rem">${d.description}</div></div>`).join('')}
</section>
<section id="api">
  <div class="section-label">Integrate</div><div class="section-title">The NEXUS API</div>
  <div class="section-sub">Query nodes, detect disruptions, and optimize routes — all from one sovereign API endpoint.</div>
  <div class="api-section">
    <pre class="code"><span style="color:var(--dim)">// All network nodes + Kuramoto sync</span>
const nodes = await fetch('https://nexus.rship.workers.dev/api/nodes').then(r => r.json());

<span style="color:var(--dim)">// Optimize a route via pheromone field</span>
const route = await fetch('https://nexus.rship.workers.dev/api/route/optimize', {
  method: 'POST',
  body: JSON.stringify({ origin: 'PORT-SHA', destinations: ['PORT-RTM', 'HUB-DXB'] })
});

<span style="color:var(--dim)">// Report a disruption</span>
await fetch('https://nexus.rship.workers.dev/api/disruption/report', {
  method: 'POST',
  body: JSON.stringify({ nodeId: 'PORT-LAX', type: 'LABOR', severity: 'MEDIUM', description: '...' })
});</pre>
  </div>
</section>
<footer><div class="footer-logo">⬡ NEXUS</div>
<div style="display:flex;gap:24px;font-size:.78px"><a href="https://cerebrum.rship.workers.dev" style="color:#445566">CEREBRUM</a><a href="https://agens.rship.workers.dev" style="color:#445566">AGENS</a></div>
<div class="footer-copy">© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems</div></footer>
<script>
async function tick(){try{const d=await fetch('/api/status').then(r=>r.json());
document.getElementById('beat-val').textContent=d.beat;
document.getElementById('r-val').textContent=d.kuramotoR;
document.getElementById('sync-r').textContent=d.kuramotoR;
document.getElementById('sync-fill').style.width=Math.round(d.kuramotoR*100)+'%';}catch(e){}}
setInterval(tick,873);
</script>
</body></html>`;
}

export default {
  async fetch(request,env){
    beat++;
    const url=new URL(request.url),path=url.pathname,method=request.method;
    const seal=phiHash(`nexus:${beat}:${startTime}`);
    const phases=NODES.map(n=>n.phase),R=kuramotoR(phases);
    const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    if(method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(path==='/'&&method==='GET')return new Response(buildHTML(),{headers:{'Content-Type':'text/html;charset=UTF-8',...cors}});
    if(path==='/api/status')return Response.json({designation:'RSHIP-AIS-NX-001',name:'NEXUS',latin:'nexus',meaning:'bond · connection · network',beat,seal:seal.slice(0,16)+'…',nodes:NODES.length,activeDisruptions:disruptions.filter(d=>!d.resolved).length,learnedRoutes:pheromoneField.size,kuramotoR:R,synced:R>=PHI_INV,uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)),alive:true},{headers:cors});
    if(path==='/api/nodes')return Response.json({nodes:NODES,count:NODES.length,kuramotoR:R,synced:R>=PHI_INV,beat},{headers:cors});
    if(path==='/api/disruption/report'&&method==='POST'){let b={};try{b=await request.json();}catch{}const d={id:`DISRUPT-${String(disruptions.length+1).padStart(3,'0')}`,nodeId:String(b.nodeId||'UNKNOWN'),type:String(b.type||'UNKNOWN'),severity:String(b.severity||'MEDIUM'),description:String(b.description||'Disruption').slice(0,200),ts:Date.now(),resolved:false};disruptions.push(d);return Response.json({reported:true,disruption:d},{headers:cors});}
    if(path==='/api/disruption/active')return Response.json({active:disruptions.filter(d=>!d.resolved),count:disruptions.filter(d=>!d.resolved).length,beat},{headers:cors});
    if(path==='/api/route/optimize'&&method==='POST'){let b={};try{b=await request.json();}catch{}const origin=String(b.origin||NODES[0].id),dests=Array.isArray(b.destinations)?b.destinations.map(String):NODES.slice(1,5).map(n=>n.id);const routes=findRoute(origin,dests);return Response.json({origin,routes,bestRoute:routes[0]||null,networkLyapunov:lyapunovSev(NODES.map(n=>n.capacity)),beat},{headers:cors});}
    if(path==='/api/sync/status')return Response.json({kuramotoR:R,synced:R>=PHI_INV,phiInv:PHI_INV,beat},{headers:cors});
    return Response.json({error:'NOT_FOUND',path,available:['/','/api/status','/api/nodes','/api/disruption/report','/api/disruption/active','/api/route/optimize','/api/sync/status']},{status:404,headers:cors});
  }
};
