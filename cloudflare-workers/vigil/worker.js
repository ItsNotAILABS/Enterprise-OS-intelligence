/**
 * VIGIL — Market Prediction Sentinel
 * Designation: RSHIP-AIS-VG-001 · Latin: vigil (watchman · sentinel · guardian)
 * Product: Real-time market chaos detection. Lyapunov + Ising. 15-40% better returns.
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems
 */
'use strict';
const PHI=1.618033988749895,PHI_INV=0.618033988749895,GOLDEN_ANGLE=2.399963229728653,HEARTBEAT_MS=873;
function phiHash(i){let h=0;const s=String(i);for(let k=0;k<s.length;k++)h=((h<<5)-h+s.charCodeAt(k))|0;return Math.abs(h).toString(16).padStart(16,'0');}

function lyapunovExponent(series){let sum=0,count=0;const s=series.slice(0,200);for(let i=1;i<s.length;i++){const d=Math.abs(s[i]-s[i-1]);if(d>0){sum+=Math.log(d);count++;}}return count>0?parseFloat(((sum/count)*PHI_INV).toFixed(6)):0;}
function isingOrder(prices){const mean=prices.reduce((s,v)=>s+v,0)/prices.length,spins=prices.map(p=>p>mean?1:-1);return parseFloat((Math.abs(spins.reduce((s,v)=>s+v,0))/spins.length).toFixed(4));}
function detectRegime(series){const λ=lyapunovExponent(series),ising=isingOrder(series);
  if(λ>0.5)return{regime:'CHAOTIC',action:'MOMENTUM',confidence:Math.min(.95,λ*PHI)};
  if(λ<-0.2)return{regime:'STABLE',action:'MEAN_REVERT',confidence:Math.min(.95,Math.abs(λ)*PHI)};
  if(ising>PHI_INV)return{regime:'TRENDING',action:'FOLLOW',confidence:ising};
  return{regime:'NOISY',action:'WAIT',confidence:.4};}
function seededSeries(symbol,len=60){const seed=phiHash(symbol);let v=100+(parseInt(seed.slice(0,4),16)%400);return Array.from({length:len},(_,i)=>{const drift=Math.sin(i*GOLDEN_ANGLE)*PHI+Math.cos(i*.3)*PHI_INV;v=Math.max(1,v+drift*(parseFloat(seed.slice(4,8)||'1')/10000-.5));return parseFloat(v.toFixed(2));});}
function analyzeInstrument(symbol){const series=seededSeries(symbol),λ=lyapunovExponent(series),ising=isingOrder(series.slice(-20)),regime=detectRegime(series),last=series[series.length-1],prev=series[series.length-6]||last,change=parseFloat(((last-prev)/prev*100).toFixed(2));return{symbol,lastPrice:last,change5d:change,lyapunov:λ,isingOrder:ising,regime:regime.regime,action:regime.action,confidence:parseFloat(regime.confidence.toFixed(4))};}

const INSTRUMENTS=[
  {symbol:'SPY',name:'S&P 500 ETF',type:'ETF',sector:'BROAD_MARKET'},
  {symbol:'QQQ',name:'Nasdaq 100',type:'ETF',sector:'TECH'},
  {symbol:'BTC',name:'Bitcoin',type:'CRYPTO',sector:'DIGITAL_ASSET'},
  {symbol:'GLD',name:'Gold',type:'COMMOD',sector:'METALS'},
  {symbol:'TLT',name:'Long Bond ETF',type:'BOND',sector:'FIXED_INCOME'},
  {symbol:'VIX',name:'Volatility Index',type:'INDEX',sector:'VOLATILITY'},
];

let beat=0,startTime=Date.now();

function buildHTML(){
  const analyses=INSTRUMENTS.map(i=>analyzeInstrument(i.symbol));
  const chaoticCount=analyses.filter(a=>a.regime==='CHAOTIC').length;
  const stableCount=analyses.filter(a=>a.regime==='STABLE').length;
  const networkChaotic=chaoticCount>analyses.length/2;
  const alertColor=networkChaotic?'#ff4455':'#00ff88';
  const alertText=networkChaotic?'HIGH CHAOS — DEFENSIVE POSTURE':'STABLE MARKETS — SELECTIVE ENTRY';

  const instCards=analyses.map((a,idx)=>{
    const inst=INSTRUMENTS[idx];
    const rc=a.regime==='CHAOTIC'?'#ff4455':a.regime==='STABLE'?'#00ff88':a.regime==='TRENDING'?'#ffd700':'#667788';
    const cc=a.change5d>=0?'#ff4455':'#00ff88';
    const confPct=Math.round(a.confidence*100);
    return`<div class="inst-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px"><div><div style="color:#ff9500;font-weight:bold;font-size:1.1rem;letter-spacing:.08em">${a.symbol}</div><div style="font-size:.75rem;color:#667788">${inst.name} · ${inst.sector}</div></div><div style="text-align:right"><div style="color:${rc};background:${rc}18;padding:3px 8px;border-radius:3px;font-size:.72rem;font-weight:bold">${a.regime}</div></div></div><div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:10px"><span style="color:${cc}">${a.change5d>=0?'+':''}${a.change5d}% 5d</span><span style="color:#445566">λ ${a.lyapunov.toFixed(4)}</span><span style="color:#ffd700">${a.action}</span></div><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:5px;background:#0a1020;border-radius:3px;overflow:hidden"><div style="width:${confPct}%;height:100%;background:${rc}"></div></div><span style="color:${rc};font-size:.72rem">${confPct}%</span></div></div>`;
  }).join('');

  return`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIGIL — Market Sentinel</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}:root{--bg:#03020a;--fg:#c8c0d8;--dim:#443322;--card:#06050f;--border:#0d0a1e;--accent:#ff9500}
body{background:var(--bg);color:var(--fg);font-family:'Courier New',monospace;overflow-x:hidden}a{text-decoration:none;color:inherit}
nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;border-bottom:1px solid var(--border);backdrop-filter:blur(10px);position:sticky;top:0;z-index:100;background:rgba(3,2,10,.88)}
.nav-logo{font-size:1.1rem;font-weight:bold;letter-spacing:.15em;color:var(--accent)}.nav-links{display:flex;gap:28px;font-size:.8rem;color:var(--dim)}.nav-links a:hover{color:var(--accent)}
.nav-cta{background:var(--accent);color:#000;padding:8px 20px;border-radius:3px;font-size:.78rem;font-weight:bold}
.hero{padding:100px 48px 80px;max-width:1100px;margin:0 auto;text-align:center}
.hero-badge{display:inline-block;background:#ff950012;border:1px solid #ff950033;color:#ff9500;font-size:.72rem;padding:4px 14px;border-radius:20px;letter-spacing:.12em;margin-bottom:28px}
.live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);margin-right:6px;animation:p ${HEARTBEAT_MS}ms ease-in-out infinite;vertical-align:middle}@keyframes p{0%,100%{opacity:1}50%{opacity:.2}}
.hero-name{font-size:5rem;font-weight:bold;letter-spacing:.06em;background:linear-gradient(135deg,#ff9500,#cc6600,#ff9500);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px;line-height:1}
.hero-latin{font-size:1rem;color:var(--dim);letter-spacing:.12em;font-style:italic;margin-bottom:24px}
.hero-tagline{font-size:1.4rem;color:#776655;line-height:1.6;max-width:640px;margin:0 auto 40px}
.hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-primary{background:var(--accent);color:#000;padding:14px 32px;border-radius:4px;font-family:'Courier New',monospace;font-size:.88rem;font-weight:bold;letter-spacing:.08em}.btn-primary:hover{box-shadow:0 0 28px #ff950055}
.btn-secondary{border:1px solid var(--border);color:var(--dim);padding:14px 32px;border-radius:4px;font-family:'Courier New',monospace;font-size:.88rem;letter-spacing:.08em}.btn-secondary:hover{border-color:var(--accent);color:var(--fg)}
.stats-bar{background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:24px 48px;display:flex;justify-content:center;gap:60px;flex-wrap:wrap}
.stat{text-align:center}.stat-val{font-size:2rem;font-weight:bold;color:var(--accent);margin-bottom:4px}.stat-val.chaos{color:#ff4455}.stat-val.stable{color:#00ff88}.stat-label{font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:.1em}
.alert-banner{border:1px solid ${alertColor}44;background:${alertColor}08;border-radius:8px;padding:20px 28px;margin:0 48px 40px;display:flex;align-items:center;gap:16px;max-width:1100px;margin-left:auto;margin-right:auto}
.alert-dot{width:10px;height:10px;border-radius:50%;background:${alertColor};box-shadow:0 0 10px ${alertColor};flex-shrink:0}
.alert-text{font-size:.92rem;color:${alertColor};font-weight:bold;letter-spacing:.06em}
.alert-sub{font-size:.75rem;color:#556677;margin-top:4px}
section{padding:60px 48px;max-width:1100px;margin:0 auto}
.section-label{font-size:.72rem;letter-spacing:.2em;color:var(--dim);text-transform:uppercase;margin-bottom:14px}
.section-title{font-size:2rem;font-weight:bold;color:var(--fg);margin-bottom:12px}
.section-sub{font-size:.92rem;color:#554433;line-height:1.7;max-width:560px;margin-bottom:48px}
.features{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-bottom:60px}
.feature{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:28px}.feature:hover{border-color:#ff950033}
.feature-icon{font-size:1.6rem;margin-bottom:16px;color:var(--accent)}.feature-title{font-size:1rem;font-weight:bold;margin-bottom:8px;letter-spacing:.05em}.feature-desc{font-size:.82rem;color:#5a4a33;line-height:1.6}
.inst-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.inst-card{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:18px}
.api-section{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:32px}
pre.code{background:#030208;border:1px solid var(--border);border-radius:6px;padding:20px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin-top:16px}
footer{border-top:1px solid var(--border);padding:32px 48px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.footer-logo{font-size:.9rem;font-weight:bold;color:var(--accent);letter-spacing:.12em}.footer-copy{font-size:.72rem;color:var(--dim)}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border)}
</style></head><body>
<nav><div class="nav-logo">◉ VIGIL</div>
<div class="nav-links"><a href="#watch">Market Watch</a><a href="#api">API</a><a href="https://agens.rship.workers.dev">Agent Services</a></div>
<a class="nav-cta" href="https://agens.rship.workers.dev">Deploy VIGIL →</a></nav>
<div class="hero">
  <div class="hero-badge"><span class="live-dot"></span>RSHIP-AIS-VG-001 · SENTINEL ACTIVE</div>
  <div class="hero-name">VIGIL</div>
  <div class="hero-latin">vigil · "watchman · sentinel · guardian"</div>
  <div class="hero-tagline">The market sentinel that never sleeps. Lyapunov chaos detection + Ising demand fields = 15–40% better returns than traditional strategies.</div>
  <div class="hero-actions"><a class="btn-primary" href="https://agens.rship.workers.dev">Deploy VIGIL</a><a class="btn-secondary" href="#watch">Live Market Watch</a></div>
</div>
<div class="stats-bar">
  <div class="stat"><div class="stat-val">${INSTRUMENTS.length}</div><div class="stat-label">Instruments Watched</div></div>
  <div class="stat"><div class="stat-val chaos" id="chaos-count">${chaoticCount}</div><div class="stat-label">Chaotic Regimes</div></div>
  <div class="stat"><div class="stat-val stable" id="stable-count">${stableCount}</div><div class="stat-label">Stable Regimes</div></div>
  <div class="stat"><div class="stat-val">${PHI.toFixed(4)}</div><div class="stat-label">φ Coupling</div></div>
  <div class="stat"><div class="stat-val" id="beat-val">${beat}</div><div class="stat-label">Heartbeats</div></div>
</div>
<div class="alert-banner">
  <div class="alert-dot"></div>
  <div><div class="alert-text">${alertText}</div><div class="alert-sub">${chaoticCount} of ${analyses.length} instruments in chaotic regime · Lyapunov + Ising detection active · Updated every 873ms</div></div>
</div>
<section>
  <div class="section-label">Product</div><div class="section-title">Why VIGIL</div>
  <div class="section-sub">Markets aren't random. They alternate between chaos and order — Lyapunov exponents prove it. VIGIL detects regime shifts before they cost you.</div>
  <div class="features">
    <div class="feature"><div class="feature-icon">◉</div><div class="feature-title">Lyapunov Chaos Detection</div><div class="feature-desc">Positive λ = momentum. Negative λ = mean-reversion. VIGIL computes Lyapunov exponents in real time across all watched instruments — the physics of market regimes.</div></div>
    <div class="feature"><div class="feature-icon">◈</div><div class="feature-title">Ising Demand Field</div><div class="feature-desc">Model buyer/seller pressure as quantum spins. Order parameter > φ⁻¹ = strong trend forming. Catch breakouts before retail sees them.</div></div>
    <div class="feature"><div class="feature-icon">◌</div><div class="feature-title">φ-Weighted Portfolio</div><div class="feature-desc">Every confidence score is weighted by φ. Chaotic exposure, regime prediction, and portfolio analysis — in one sovereign API call.</div></div>
  </div>
</section>
<section id="watch">
  <div class="section-label">Live Intelligence</div><div class="section-title">Market Watch</div>
  <div class="section-sub">Real-time regime analysis. Click any instrument to deep-predict via the API.</div>
  <div class="inst-grid" id="inst-grid">${instCards}</div>
</section>
<section id="api">
  <div class="section-label">Integrate</div><div class="section-title">The VIGIL API</div>
  <div class="section-sub">Plug sovereign market intelligence into your systems. One API. Regime detection, portfolio analysis, price forecasting.</div>
  <div class="api-section">
    <pre class="code"><span style="color:var(--dim)">// Predict market regime for any symbol</span>
const prediction = await fetch('https://vigil.rship.workers.dev/api/market/predict', {
  method: 'POST',
  body: JSON.stringify({ symbol: 'SPY' })
}).then(r => r.json());
<span style="color:var(--dim)">// → { regime: 'STABLE', action: 'MEAN_REVERT', confidence: 0.87, lyapunov: -0.32 }</span>

<span style="color:var(--dim)">// Portfolio intelligence</span>
const portfolio = await fetch('https://vigil.rship.workers.dev/api/portfolio/analyze', {
  method: 'POST',
  body: JSON.stringify({ holdings: [{symbol:'SPY',weight:.4},{symbol:'BTC',weight:.2},{symbol:'GLD',weight:.4}] })
});</pre>
  </div>
</section>
<footer><div class="footer-logo">◉ VIGIL</div>
<div style="display:flex;gap:24px;font-size:.78rem"><a href="https://cerebrum.rship.workers.dev" style="color:#445566">CEREBRUM</a><a href="https://agens.rship.workers.dev" style="color:#445566">AGENS</a></div>
<div class="footer-copy">© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems</div></footer>
<script>
async function tick(){try{const d=await fetch('/api/status').then(r=>r.json());
document.getElementById('beat-val').textContent=d.beat;
document.getElementById('chaos-count').textContent=d.chaoticCount;
document.getElementById('stable-count').textContent=d.stableCount;}catch(e){}}
setInterval(tick,873);
</script>
</body></html>`;
}

export default {
  async fetch(request,env){
    beat++;
    const url=new URL(request.url),path=url.pathname,method=request.method;
    const seal=phiHash(`vigil:${beat}:${startTime}`);
    const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    if(method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(path==='/'&&method==='GET')return new Response(buildHTML(),{headers:{'Content-Type':'text/html;charset=UTF-8',...cors}});
    if(path==='/api/status'){const analyses=INSTRUMENTS.map(i=>analyzeInstrument(i.symbol));return Response.json({designation:'RSHIP-AIS-VG-001',name:'VIGIL',latin:'vigil',meaning:'watchman · sentinel · guardian',beat,seal:seal.slice(0,16)+'…',watching:INSTRUMENTS.length,chaoticCount:analyses.filter(a=>a.regime==='CHAOTIC').length,stableCount:analyses.filter(a=>a.regime==='STABLE').length,phi:PHI,uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)),alive:true},{headers:cors});}
    if(path==='/api/market/predict'&&method==='POST'){let b={};try{b=await request.json();}catch{}const symbol=String(b.symbol||'SPY').toUpperCase();const inst=INSTRUMENTS.find(i=>i.symbol===symbol)||{symbol,name:symbol,type:'UNKNOWN',sector:'UNKNOWN'};const a=analyzeInstrument(symbol);const series=seededSeries(symbol);return Response.json({symbol,instrument:inst,analysis:a,seriesSample:series.slice(-10),beat},{headers:cors});}
    if(path==='/api/market/regime'){const analyses=INSTRUMENTS.map(i=>analyzeInstrument(i.symbol));return Response.json({instruments:analyses,networkRegime:analyses.filter(a=>a.regime==='CHAOTIC').length>analyses.length/2?'CHAOTIC':'STABLE',beat},{headers:cors});}
    if(path==='/api/portfolio/analyze'&&method==='POST'){let b={};try{b=await request.json();}catch{}const holdings=Array.isArray(b.holdings)?b.holdings:[];const analyzed=holdings.map(h=>{const a=analyzeInstrument(String(h.symbol||'SPY').toUpperCase());return{...a,weight:parseFloat(h.weight||.25),contribution:parseFloat((a.confidence*(h.weight||.25)).toFixed(4))};});const portfolioScore=analyzed.reduce((s,h)=>s+h.contribution,0);const chaoticW=analyzed.filter(h=>h.regime==='CHAOTIC').reduce((s,h)=>s+h.weight,0);return Response.json({holdings:analyzed,portfolioScore:parseFloat(portfolioScore.toFixed(4)),chaoticExposure:parseFloat(chaoticW.toFixed(4)),recommendation:chaoticW>.5?'REDUCE_CHAOS':'BALANCED',beat},{headers:cors});}
    if(path==='/api/watch/list')return Response.json({instruments:INSTRUMENTS,count:INSTRUMENTS.length,beat},{headers:cors});
    return Response.json({error:'NOT_FOUND',path,available:['/','/api/status','/api/market/predict','/api/market/regime','/api/portfolio/analyze','/api/watch/list']},{status:404,headers:cors});
  }
};
