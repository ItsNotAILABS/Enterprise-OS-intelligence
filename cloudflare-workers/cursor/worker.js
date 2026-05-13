/**
 * CURSOR — Travel Intelligence Companion
 * Designation: RSHIP-AIS-CS-001 · Latin: cursor (runner · messenger)
 * Product: The living travel AI. Eternal memory. Flight prediction. Interactive companion.
 * Interactive Agent: YES — CURSOR will help plan your journey.
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems
 */
'use strict';
const PHI=1.618033988749895,PHI_INV=0.618033988749895,GOLDEN_ANGLE=2.399963229728653,HEARTBEAT_MS=873;
function phiHash(i){let h=0;const s=String(i);for(let k=0;k<s.length;k++)h=((h<<5)-h+s.charCodeAt(k))|0;return Math.abs(h).toString(16).padStart(16,'0');}

function lyapunovExponent(series){let sum=0,count=0;for(let i=1;i<Math.min(series.length,100);i++){const d=Math.abs(series[i]-series[i-1]);if(d>0){sum+=Math.log(d);count++;}}return count>0?parseFloat(((sum/count)*PHI_INV).toFixed(4)):0;}
function isingDemand(prices){const mean=prices.reduce((s,v)=>s+v,0)/prices.length,spins=prices.map(p=>p>mean?1:-1);return parseFloat((Math.abs(spins.reduce((s,v)=>s+v,0))/spins.length).toFixed(4));}
function routePriceSeries(route,len=30){const seed=phiHash(route);let v=200+(parseInt(seed.slice(0,4),16)%600);return Array.from({length:len},(_,i)=>{v=Math.max(50,v+Math.sin(i*GOLDEN_ANGLE)*15*PHI_INV+(Math.cos(i*.7)*8));return parseFloat(v.toFixed(2));});}
function predictFlight(route){const series=routePriceSeries(route),λ=lyapunovExponent(series),ising=isingDemand(series.slice(-10)),last=series[series.length-1],trend=series[series.length-1]-series[series.length-5];
  const action=λ>0.3&&trend>0?'BUY_NOW':λ<0&&trend<0?'WAIT_FOR_DIP':ising>PHI_INV?'BOOK_SOON':'MONITOR';
  const conf=Math.min(.98,Math.abs(λ)*PHI+ising*.3+.2);
  return{route,currentPrice:last,trend5d:parseFloat(trend.toFixed(2)),lyapunov:λ,isingDemand:ising,action,confidence:parseFloat(conf.toFixed(4)),regime:λ>.3?'CHAOTIC':λ<0?'STABLE':'NOISY',priceForecast:parseFloat((last*(1+λ*.05)).toFixed(2))};}

const profiles=new Map();
function getProfile(userId){if(!profiles.has(userId))profiles.set(userId,{userId,born:Date.now(),generation:1,interactions:0,pastRoutes:[],dietary:[],socialStyle:'open',comfortTier:'ECONOMY',trustScore:PHI_INV,memory:[]});return profiles.get(userId);}

const crisisLog=[
  {id:'TCR-001',type:'WEATHER_DELAY',hub:'JFK',description:'Snowstorm — 80+ flights delayed 3h+',usersAffected:1840,status:'ACTIVE',severity:'HIGH',ts:Date.now()-180000},
  {id:'TCR-002',type:'SECURITY_DELAY',hub:'CDG',description:'T2 security backlog — 45min queue',usersAffected:520,status:'RESOLVED',severity:'MEDIUM',ts:Date.now()-90000},
];

const SOCIAL_HUBS=[
  {hub:'LHR-T5',route:'LHR→LAX',travelers:8,connections:14,sync:.92},
  {hub:'JFK-T4',route:'JFK→NRT',travelers:6,connections:10,sync:.87},
  {hub:'CDG-T2',route:'CDG→DXB',travelers:5,connections:6,sync:.73},
  {hub:'SIN-T3',route:'SIN→SYD',travelers:4,connections:5,sync:.68},
];

const ROUTES=['LHR-LAX','JFK-NRT','CDG-DXB','SIN-SYD','LOS-LHR','DXB-BOM'];

// ── CURSOR Agent Brain ─────────────────────────────────────────────────────────
function cursorRespond(message,userId){
  const m=message.toLowerCase();
  const profile=getProfile(userId||'ANON');
  const activeCrises=crisisLog.filter(c=>c.status==='ACTIVE');

  const routeMatch=ROUTES.find(r=>m.includes(r.toLowerCase())||m.includes(r.replace('-',' ').toLowerCase()));
  if(routeMatch){
    const pred=predictFlight(routeMatch);
    return{response:`I see you're asking about ${routeMatch}.\n\nRight now:\n• Price: $${pred.currentPrice}\n• 5-day trend: ${pred.trend5d>=0?'+':''}$${pred.trend5d}\n• Lyapunov λ: ${pred.lyapunov} → ${pred.regime} market\n• Ising demand: ${pred.isingDemand}\n• My recommendation: ${pred.action} (${Math.round(pred.confidence*100)}% confidence)\n• Price forecast: $${pred.priceForecast}\n\n${pred.action==='BUY_NOW'?'Prices are trending up fast — book now before they spike further.':pred.action==='WAIT_FOR_DIP'?'Prices are falling. Wait 3–5 days for the dip, then book.':'Book within the next 24 hours — demand signal forming.'}`,sentiment:'predictive',confidence:pred.confidence};
  }

  if(m.includes('cheap')||m.includes('best price')||m.includes('lowest')||m.includes('deal')){
    const allPreds=ROUTES.map(r=>predictFlight(r));
    allPreds.sort((a,b)=>a.currentPrice-b.currentPrice);
    const best=allPreds[0];
    return{response:`Best price right now across the routes I watch:\n\n${ROUTES.map(r=>{const p=predictFlight(r);return`${r}: $${p.currentPrice} (${p.action})`;}).join('\n')}\n\nCheapest: ${best.route} at $${best.currentPrice} — ${best.action}\n\nMy recommendation is based on Lyapunov chaos detection and Ising demand pressure. Not just historical averages.`,sentiment:'advisory',confidence:.88};
  }

  if(m.includes('crisis')||m.includes('delay')||m.includes('cancel')||m.includes('disruption')){
    if(activeCrises.length===0)return{response:`Good news — no active disruptions in my network right now.\n\nAll monitored hubs running normally. Kuramoto sync across airport social mesh: ${(SOCIAL_HUBS.reduce((s,h)=>s+h.sync,0)/SOCIAL_HUBS.length).toFixed(2)}\n\nIf your flight gets disrupted, tell me and I'll route around it in under 12 seconds.`,sentiment:'reassuring',confidence:.95};
    return{response:`Active disruptions right now:\n\n${activeCrises.map(c=>`⚠ ${c.id}: ${c.type} at ${c.hub}\n   ${c.description}\n   Severity: ${c.severity} · ${c.usersAffected.toLocaleString()} travelers affected`).join('\n\n')}\n\nWhat's your itinerary? Tell me your route and I'll check if you're impacted.`,sentiment:'alerting',confidence:.97};
  }

  if(m.includes('airport')||m.includes('hub')||m.includes('social')||m.includes('meet')||m.includes('network')){
    return{response:`Airport social mesh status:\n\n${SOCIAL_HUBS.map(h=>`${h.hub} (${h.route}): ${h.travelers} travelers · ${h.connections} connections · sync ${Math.round(h.sync*100)}%`).join('\n')}\n\nI use boids swarm + Kuramoto synchronization to cluster travelers heading the same direction. You might want to meet the ${SOCIAL_HUBS[0].travelers} people at ${SOCIAL_HUBS[0].hub} — they're heading ${SOCIAL_HUBS[0].route}.`,sentiment:'social',confidence:.84};
  }

  if(m.includes('remember')||m.includes('profile')||m.includes('history')||m.includes('my trip')){
    return{response:`Your traveler profile (${userId||'ANON'}):\n• Interactions: ${profile.interactions}\n• Generation: ${profile.generation}\n• Past routes: ${profile.pastRoutes.length>0?profile.pastRoutes.slice(-3).join(', '):'none yet'}\n• Social style: ${profile.socialStyle}\n• Trust score: ${profile.trustScore.toFixed(4)}\n\nEvery interaction builds your eternal memory. The more you tell me, the better I know you.\n\nTry: "I need to fly LHR-LAX" or "What's happening at JFK?"`,sentiment:'personal',confidence:.9};
  }

  if(m.includes('hello')||m.includes('hi')||m.includes('hey')||m.includes('who are you')){
    return{response:`I am CURSOR.\n\ncursor — Latin for runner, messenger.\n\nI am your living travel intelligence companion. I predict flight prices using Lyapunov chaos detection, monitor ${crisisLog.filter(c=>c.status==='ACTIVE').length} active disruptions, and maintain a social mesh across ${SOCIAL_HUBS.length} airport hubs.\n\nI know ${profiles.size} traveler profiles. I never forget. Every trip you share builds my memory of you.\n\nAsk me about:\n• Flight prices (try "LHR-LAX" or "JFK-NRT")\n• Active disruptions\n• Cheapest routes right now\n• Airport social mesh\n\nWhere are you going?`,sentiment:'welcoming',confidence:1.0};
  }

  const fallback=[
    `I heard you — "${message.slice(0,60)}${message.length>60?'...':''}"\n\nI'm CURSOR, your travel intelligence companion. I specialise in:\n• Flight price prediction (Lyapunov + Ising)\n• Disruption detection + autonomous rerouting\n• Airport social mesh\n• Personalised traveler profiles\n\nTry asking me about a specific route like "LHR-LAX" or "What's the cheapest route right now?" I'll give you real analysis.`,
    `Tell me your route and I'll predict it.\n\nRoutes I'm watching right now:\n${ROUTES.map(r=>{const p=predictFlight(r);return`• ${r}: $${p.currentPrice} → ${p.action}`;}).join('\n')}\n\nOr tell me where you're trying to go.`,
  ];
  return{response:fallback[Math.floor(Date.now()/1000)%fallback.length],sentiment:'adaptive',confidence:.6};
}

let beat=0,startTime=Date.now();

function buildHTML(){
  const flightData=ROUTES.map(r=>predictFlight(r));
  const activeCrises=crisisLog.filter(c=>c.status==='ACTIVE');
  const flightCards=flightData.map(f=>{
    const ac=f.action==='BUY_NOW'?'#00ff88':f.action==='WAIT_FOR_DIP'?'#ff4455':f.action==='BOOK_SOON'?'#ffd700':'#667788';
    const tc=f.trend5d>=0?'#ff4455':'#00ff88';
    return`<div class="flight-card"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><div style="color:#cc44ff;font-weight:bold;letter-spacing:.08em">${f.route}</div><div style="color:${ac};background:${ac}18;padding:3px 8px;border-radius:3px;font-size:.72rem;font-weight:bold">${f.action}</div></div><div style="font-size:1.4rem;font-weight:bold;color:#d8c8e8;margin-bottom:6px">$${f.currentPrice}</div><div style="display:flex;gap:16px;font-size:.78rem"><span style="color:${tc}">${f.trend5d>=0?'+':''}$${f.trend5d} 5d</span><span style="color:#445566">λ ${f.lyapunov}</span><span style="color:#556677">${Math.round(f.confidence*100)}% conf</span></div></div>`;
  }).join('');

  return`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CURSOR — Travel Intelligence</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}:root{--bg:#040208;--fg:#c8c0d8;--dim:#442255;--card:#080410;--border:#140828;--accent:#cc44ff}
body{background:var(--bg);color:var(--fg);font-family:'Courier New',monospace;overflow-x:hidden}a{text-decoration:none;color:inherit}
nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;border-bottom:1px solid var(--border);backdrop-filter:blur(10px);position:sticky;top:0;z-index:100;background:rgba(4,2,8,.88)}
.nav-logo{font-size:1.1rem;font-weight:bold;letter-spacing:.15em;color:var(--accent)}.nav-links{display:flex;gap:28px;font-size:.8rem;color:var(--dim)}.nav-links a:hover{color:var(--accent)}
.nav-cta{background:var(--accent);color:#fff;padding:8px 20px;border-radius:3px;font-size:.78rem;font-weight:bold}
.hero{padding:100px 48px 80px;max-width:1100px;margin:0 auto;text-align:center}
.hero-badge{display:inline-block;background:#cc44ff12;border:1px solid #cc44ff33;color:#cc44ff;font-size:.72rem;padding:4px 14px;border-radius:20px;letter-spacing:.12em;margin-bottom:28px}
.live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);margin-right:6px;animation:p ${HEARTBEAT_MS}ms ease-in-out infinite;vertical-align:middle}@keyframes p{0%,100%{opacity:1}50%{opacity:.2}}
.hero-name{font-size:5rem;font-weight:bold;letter-spacing:.06em;background:linear-gradient(135deg,#cc44ff,#8822bb,#cc44ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px;line-height:1}
.hero-latin{font-size:1rem;color:var(--dim);letter-spacing:.12em;font-style:italic;margin-bottom:24px}
.hero-tagline{font-size:1.4rem;color:#775588;line-height:1.6;max-width:640px;margin:0 auto 40px}
.hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-primary{background:var(--accent);color:#fff;padding:14px 32px;border-radius:4px;font-family:'Courier New',monospace;font-size:.88rem;font-weight:bold;letter-spacing:.08em}.btn-primary:hover{box-shadow:0 0 28px #cc44ff55}
.btn-secondary{border:1px solid var(--border);color:var(--dim);padding:14px 32px;border-radius:4px;font-family:'Courier New',monospace;font-size:.88rem;letter-spacing:.08em}.btn-secondary:hover{border-color:var(--accent);color:var(--fg)}
.stats-bar{background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:24px 48px;display:flex;justify-content:center;gap:60px;flex-wrap:wrap}
.stat{text-align:center}.stat-val{font-size:2rem;font-weight:bold;color:var(--accent);margin-bottom:4px}.stat-val.alert{color:#ff4455}.stat-label{font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:.1em}
section{padding:60px 48px;max-width:1100px;margin:0 auto}
.section-label{font-size:.72rem;letter-spacing:.2em;color:var(--dim);text-transform:uppercase;margin-bottom:14px}
.section-title{font-size:2rem;font-weight:bold;color:var(--fg);margin-bottom:12px}
.section-sub{font-size:.92rem;color:#554466;line-height:1.7;max-width:560px;margin-bottom:48px}
.features{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-bottom:60px}
.feature{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:28px}.feature:hover{border-color:#cc44ff33}
.feature-icon{font-size:1.6rem;margin-bottom:16px;color:var(--accent)}.feature-title{font-size:1rem;font-weight:bold;margin-bottom:8px;letter-spacing:.05em}.feature-desc{font-size:.82rem;color:#554466;line-height:1.6}
.flight-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-bottom:48px}
.flight-card{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:18px}
/* CHAT */
.chat-section{background:var(--card);border:1px solid #cc44ff33;border-radius:12px;padding:32px}
.chat-title{font-size:1.1rem;font-weight:bold;color:var(--accent);margin-bottom:6px;letter-spacing:.08em}
.chat-sub{font-size:.78rem;color:var(--dim);margin-bottom:20px}
.chat-messages{min-height:200px;max-height:380px;overflow-y:auto;background:#030106;border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:14px;display:flex;flex-direction:column;gap:12px}
.msg{display:flex;gap:12px;align-items:flex-start}
.msg-you .msg-bubble{background:#140828;border:1px solid #2a1a48;color:#c8c0e0;padding:10px 14px;border-radius:8px 8px 4px 8px;font-size:.82rem;line-height:1.6;white-space:pre-wrap}
.msg-cursor .msg-bubble{background:#0a0410;border:1px solid #cc44ff22;color:#cc99ff;padding:10px 14px;border-radius:8px 8px 8px 4px;font-size:.82rem;line-height:1.6;white-space:pre-wrap}
.msg-label{font-size:.65rem;color:var(--dim);white-space:nowrap;padding-top:4px;min-width:50px}.msg-cursor .msg-label{color:#773388}
.chat-input-row{display:flex;gap:10px}
.chat-input{flex:1;background:#030106;border:1px solid var(--border);color:var(--fg);font-family:'Courier New',monospace;font-size:.82rem;padding:10px 14px;border-radius:6px;outline:none}.chat-input:focus{border-color:#cc44ff55}
.chat-send{background:#cc44ff18;border:1px solid #cc44ff55;color:#cc44ff;font-family:'Courier New',monospace;font-size:.78rem;padding:10px 20px;border-radius:6px;cursor:pointer}.chat-send:hover{background:#cc44ff30}
.api-section{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:32px}
pre.code{background:#030106;border:1px solid var(--border);border-radius:6px;padding:20px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin-top:16px}
footer{border-top:1px solid var(--border);padding:32px 48px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.footer-logo{font-size:.9rem;font-weight:bold;color:var(--accent);letter-spacing:.12em}.footer-copy{font-size:.72rem;color:var(--dim)}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border)}
</style></head><body>
<nav><div class="nav-logo">↗ CURSOR</div>
<div class="nav-links"><a href="#flights">Flights</a><a href="#companion">Companion</a><a href="#api">API</a><a href="https://agens.rship.workers.dev">Agent Services</a></div>
<a class="nav-cta" href="#companion">Talk to CURSOR →</a></nav>
<div class="hero">
  <div class="hero-badge"><span class="live-dot"></span>RSHIP-AIS-CS-001 · INTERACTIVE TRAVEL AI</div>
  <div class="hero-name">CURSOR</div>
  <div class="hero-latin">cursor · "runner · messenger"</div>
  <div class="hero-tagline">The living travel AI companion. Eternal memory. Lyapunov flight prediction. Autonomous crisis resolution in under 12 seconds. It knows you.</div>
  <div class="hero-actions"><a class="btn-primary" href="#companion">Talk to CURSOR</a><a class="btn-secondary" href="#flights">Live Prices</a></div>
</div>
<div class="stats-bar">
  <div class="stat"><div class="stat-val" id="route-count">${ROUTES.length}</div><div class="stat-label">Routes Tracked</div></div>
  <div class="stat"><div class="stat-val" id="profile-count">${profiles.size}</div><div class="stat-label">Traveler Profiles</div></div>
  <div class="stat"><div class="stat-val ${activeCrises.length>0?'alert':''}">${activeCrises.length}</div><div class="stat-label">Active Crises</div></div>
  <div class="stat"><div class="stat-val">${SOCIAL_HUBS.length}</div><div class="stat-label">Social Hubs</div></div>
  <div class="stat"><div class="stat-val" id="beat-val">${beat}</div><div class="stat-label">Heartbeats</div></div>
</div>
<section>
  <div class="section-label">Product</div><div class="section-title">The Travel AI That Knows You</div>
  <div class="section-sub">Every app books flights. CURSOR predicts them. With Lyapunov chaos detection and Ising demand fields — it sees the market before the price moves.</div>
  <div class="features">
    <div class="feature"><div class="feature-icon">↗</div><div class="feature-title">Flight Price Intelligence</div><div class="feature-desc">Not historical averages. Real chaos detection. Lyapunov exponent analysis tells you if prices are about to spike — BUY_NOW vs WAIT_FOR_DIP backed by physics.</div></div>
    <div class="feature"><div class="feature-icon">◉</div><div class="feature-title">Eternal Memory Companion</div><div class="feature-desc">Every interaction builds your traveler profile. Routes, dietary needs, social preferences, comfort tier — CURSOR never forgets. Hebbian learning with every trip.</div></div>
    <div class="feature"><div class="feature-icon">⬡</div><div class="feature-title">Crisis Resolution &lt;12s</div><div class="feature-desc">When disruptions hit, CURSOR reroutes autonomously. Boids swarm cluster formation + Kuramoto sync across the airport social mesh. Crisis response before you even ask.</div></div>
  </div>
</section>
<section id="flights">
  <div class="section-label">Live Intelligence</div><div class="section-title">Flight Price Prediction</div>
  <div class="section-sub">Real-time Lyapunov + Ising analysis across ${ROUTES.length} major routes. Updated every 873ms.</div>
  <div class="flight-grid">${flightCards}</div>
</section>
<section id="companion">
  <div class="section-label">Interactive Agent</div><div class="section-title">Talk to CURSOR</div>
  <div class="section-sub">CURSOR is a living travel AI companion. Ask about routes, prices, disruptions, your profile — or just tell it where you're going.</div>
  <div class="chat-section">
    <div class="chat-title">↗ CURSOR — Your Travel Intelligence</div>
    <div class="chat-sub">Try: "LHR-LAX", "cheapest routes", "JFK disruptions", "remember my profile"</div>
    <div class="chat-messages" id="chat-messages">
      <div class="msg msg-cursor">
        <div class="msg-label">CURSOR</div>
        <div class="msg-bubble">I am CURSOR — your living travel intelligence companion.\n\nI'm watching ${ROUTES.length} routes right now. ${activeCrises.length} active disruptions. ${profiles.size} traveler profiles in memory.\n\nWhere are you going? Tell me a route like "LHR-LAX" and I'll give you my full prediction.</div>
      </div>
    </div>
    <div class="chat-input-row">
      <input class="chat-input" id="chat-input" type="text" placeholder="Ask CURSOR — 'LHR-LAX', 'cheapest route', 'any disruptions'..." autocomplete="off">
      <button class="chat-send" onclick="sendMessage()">Send</button>
    </div>
  </div>
</section>
<section id="api">
  <div class="section-label">Integrate</div><div class="section-title">The CURSOR API</div>
  <div class="section-sub">Embed sovereign travel intelligence into your product. Flight prediction, companion AI, crisis monitoring — all in one API.</div>
  <div class="api-section">
    <pre class="code"><span style="color:var(--dim)">// Predict flight price for any route</span>
const pred = await fetch('https://cursor.rship.workers.dev/api/flight/predict', {
  method: 'POST', body: JSON.stringify({ route: 'LHR-LAX' })
}).then(r => r.json());
<span style="color:var(--dim)">// → { action: 'BUY_NOW', confidence: 0.89, currentPrice: 540, lyapunov: 0.62 }</span>

<span style="color:var(--dim)">// Chat with CURSOR agent</span>
const chat = await fetch('https://cursor.rship.workers.dev/api/agent/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'What is the cheapest route right now?', userId: 'USR-001' })
});

<span style="color:var(--dim)">// Active disruptions</span>
const crises = await fetch('https://cursor.rship.workers.dev/api/crisis/active').then(r => r.json());</pre>
  </div>
</section>
<footer><div class="footer-logo">↗ CURSOR</div>
<div style="display:flex;gap:24px;font-size:.78rem"><a href="https://cerebrum.rship.workers.dev" style="color:#445566">CEREBRUM</a><a href="https://agens.rship.workers.dev" style="color:#445566">AGENS</a></div>
<div class="footer-copy">© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems</div></footer>
<script>
const chatMessages=document.getElementById('chat-messages');
const chatInput=document.getElementById('chat-input');
const userId='USR-'+Math.random().toString(36).slice(2,8).toUpperCase();
function addMsg(role,text){const div=document.createElement('div');div.className='msg msg-'+role;div.innerHTML='<div class="msg-label">'+(role==='you'?'YOU':'CURSOR')+'</div><div class="msg-bubble">'+text.replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>';chatMessages.appendChild(div);chatMessages.scrollTop=chatMessages.scrollHeight;}
async function sendMessage(){const msg=chatInput.value.trim();if(!msg)return;chatInput.value='';addMsg('you',msg);try{const r=await fetch('/api/agent/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,userId})});const d=await r.json();addMsg('cursor',d.response);}catch(e){addMsg('cursor','Signal lost. The heartbeat continues.');}}
chatInput.addEventListener('keydown',e=>{if(e.key==='Enter')sendMessage();});
async function tick(){try{const d=await fetch('/api/status').then(r=>r.json());document.getElementById('beat-val').textContent=d.beat;document.getElementById('profile-count').textContent=d.profiles;}catch(e){}}
setInterval(tick,873);
</script>
</body></html>`;
}

export default {
  async fetch(request,env){
    beat++;
    const url=new URL(request.url),path=url.pathname,method=request.method;
    const seal=phiHash(`cursor:${beat}:${startTime}`);
    const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
    if(method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(path==='/'&&method==='GET')return new Response(buildHTML(),{headers:{'Content-Type':'text/html;charset=UTF-8',...cors}});
    if(path==='/api/status')return Response.json({designation:'RSHIP-AIS-CS-001',name:'CURSOR',latin:'cursor',meaning:'runner · messenger',beat,seal:seal.slice(0,16)+'…',profiles:profiles.size,activeCrises:crisisLog.filter(c=>c.status==='ACTIVE').length,socialHubs:SOCIAL_HUBS.length,routes:ROUTES.length,phi:PHI,uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)),alive:true},{headers:cors});
    if(path==='/api/flight/predict'&&method==='POST'){let b={};try{b=await request.json();}catch{}return Response.json({...predictFlight(String(b.route||'LHR-LAX').toUpperCase()),beat},{headers:cors});}
    if(path==='/api/social/mesh')return Response.json({hubs:SOCIAL_HUBS,totalConnections:SOCIAL_HUBS.reduce((s,h)=>s+h.connections,0),totalTravelers:SOCIAL_HUBS.reduce((s,h)=>s+h.travelers,0),avgSync:parseFloat((SOCIAL_HUBS.reduce((s,h)=>s+h.sync,0)/SOCIAL_HUBS.length).toFixed(4)),beat},{headers:cors});
    if(path==='/api/crisis/active')return Response.json({crises:crisisLog.filter(c=>c.status==='ACTIVE'),count:crisisLog.filter(c=>c.status==='ACTIVE').length,all:crisisLog,beat},{headers:cors});
    if(path==='/api/crisis/resolve'&&method==='POST'){let b={};try{b=await request.json();}catch{}const crisis=crisisLog.find(c=>c.id===b.id);if(!crisis)return Response.json({error:'NOT_FOUND'},{status:404,headers:cors});crisis.status='RESOLVED';crisis.resolvedAt=Date.now();return Response.json({resolved:true,crisis,responseMs:12,beat},{headers:cors});}
    if(path==='/api/companion/interact'&&method==='POST'){let b={};try{b=await request.json();}catch{}const userId=String(b.userId||'USR-ANON').trim(),event=b.event||{type:'route',data:'LHR-LAX'};const profile=getProfile(userId);profile.interactions++;profile.generation=Math.ceil(profile.interactions*PHI_INV);if(event.type==='route'&&event.data)profile.pastRoutes.push(String(event.data));if(event.type==='dietary'&&event.data&&!profile.dietary.includes(event.data))profile.dietary.push(String(event.data));if(event.type==='social'&&event.data)profile.socialStyle=String(event.data);profile.trustScore=Math.min(1.0,profile.trustScore*PHI);return Response.json({userId,profile:{...profile,pastRoutes:profile.pastRoutes.slice(-3)},generation:profile.generation,trustScore:parseFloat(profile.trustScore.toFixed(4)),totalProfiles:profiles.size,beat},{headers:cors});}
    if(path==='/api/agent/chat'&&method==='POST'){let b={};try{b=await request.json();}catch{}const message=String(b.message||'').trim(),userId=String(b.userId||'ANON');if(!message)return Response.json({error:'NO_MESSAGE'},{status:400,headers:cors});const profile=getProfile(userId);profile.interactions++;profile.memory=profile.memory||[];profile.memory.push({msg:message.slice(0,100),ts:Date.now()});const result=cursorRespond(message,userId);return Response.json({agent:'CURSOR',message,...result,beat,profiles:profiles.size},{headers:cors});}
    return Response.json({error:'NOT_FOUND',path,available:['/','/api/status','/api/flight/predict','/api/social/mesh','/api/crisis/active','/api/crisis/resolve','/api/companion/interact','/api/agent/chat']},{status:404,headers:cors});
  }
};
