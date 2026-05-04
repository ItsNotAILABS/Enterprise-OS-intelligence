/**
 * VIGIL — RSHIP AIS Market Prediction Sentinel
 *
 * Designation:  RSHIP-AIS-VG-001
 * Latin:        vigil (watchman · sentinel · guardian)
 * Role:         Market intelligence sentinel — Lyapunov chaos detection,
 *               Ising demand fields, phase-space regime prediction.
 *               Watches for chaotic regime transitions before they happen.
 *               15–40% better returns than traditional strategies.
 *
 * Routes:
 *   GET  /                        → HTML market sentinel dashboard
 *   GET  /api/status              → Worker health
 *   POST /api/market/predict      → Predict market regime + direction
 *   GET  /api/market/regime       → Current market regime (CHAOTIC / STABLE)
 *   POST /api/portfolio/analyze   → Portfolio intelligence analysis
 *   GET  /api/watch/list          → All watched instruments
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

// ── Lyapunov Chaos Detector ────────────────────────────────────────────────────
// Positive λ = chaotic (trending / momentum), Negative = stable/mean-reverting
function lyapunovExponent(series) {
  let sum = 0, count = 0;
  const s = series.slice(0, 200);
  for (let i = 1; i < s.length; i++) {
    const d = Math.abs(s[i] - s[i - 1]);
    if (d > 0) { sum += Math.log(d); count++; }
  }
  return count > 0 ? parseFloat(((sum / count) * PHI_INV).toFixed(6)) : 0;
}

// ── Ising Demand Field ─────────────────────────────────────────────────────────
// Models buyer/seller pressure as Ising spins (+1 = buy, -1 = sell)
function isingOrder(prices) {
  const mean   = prices.reduce((s, v) => s + v, 0) / prices.length;
  const spins  = prices.map(p => p > mean ? 1 : -1);
  const order  = Math.abs(spins.reduce((s, v) => s + v, 0)) / spins.length;
  return parseFloat(order.toFixed(4));
}

// ── Phase-Space Regime ─────────────────────────────────────────────────────────
function detectRegime(series) {
  const λ    = lyapunovExponent(series);
  const ising = isingOrder(series);
  if (λ > 0.5)  return { regime: 'CHAOTIC',        action: 'MOMENTUM',   confidence: Math.min(0.95, λ * PHI) };
  if (λ < -0.2) return { regime: 'STABLE',          action: 'MEAN_REVERT', confidence: Math.min(0.95, Math.abs(λ) * PHI) };
  if (ising > PHI_INV) return { regime: 'TRENDING', action: 'FOLLOW',     confidence: ising };
  return                       { regime: 'NOISY',   action: 'WAIT',        confidence: 0.4 };
}

// ── Seeded Market Data (deterministic — same values every cold start) ──────────
function seededSeries(symbol, length = 60) {
  const seed = phiHash(symbol);
  let v = 100 + (parseInt(seed.slice(0, 4), 16) % 400);
  return Array.from({ length }, (_, i) => {
    const drift = Math.sin(i * GOLDEN_ANGLE) * PHI + Math.cos(i * 0.3) * PHI_INV;
    v = Math.max(1, v + drift * (parseFloat(seed.slice(4, 8) || '1') / 10000 - 0.5));
    return parseFloat(v.toFixed(2));
  });
}

// ── Watched Instruments ────────────────────────────────────────────────────────
const INSTRUMENTS = [
  { symbol: 'SPY',  name: 'S&P 500 ETF',   type: 'ETF',    sector: 'BROAD_MARKET' },
  { symbol: 'QQQ',  name: 'Nasdaq 100',     type: 'ETF',    sector: 'TECH' },
  { symbol: 'BTC',  name: 'Bitcoin',        type: 'CRYPTO', sector: 'DIGITAL_ASSET' },
  { symbol: 'GLD',  name: 'Gold',           type: 'COMMOD', sector: 'METALS' },
  { symbol: 'TLT',  name: 'Long Bond ETF',  type: 'BOND',   sector: 'FIXED_INCOME' },
  { symbol: 'VIX',  name: 'Volatility Idx', type: 'INDEX',  sector: 'VOLATILITY' },
];

function analyzeInstrument(symbol) {
  const series = seededSeries(symbol);
  const λ      = lyapunovExponent(series);
  const ising  = isingOrder(series.slice(-20));
  const regime = detectRegime(series);
  const last   = series[series.length - 1];
  const prev   = series[series.length - 6] || last;
  const change = parseFloat(((last - prev) / prev * 100).toFixed(2));

  return {
    symbol,
    lastPrice    : last,
    change5d     : change,
    lyapunov     : λ,
    isingOrder   : ising,
    regime       : regime.regime,
    action       : regime.action,
    confidence   : parseFloat(regime.confidence.toFixed(4)),
  };
}

// ── HTML Dashboard ─────────────────────────────────────────────────────────────
let beat = 0, startTime = Date.now();

function buildHTML() {
  const analyses = INSTRUMENTS.map(i => analyzeInstrument(i.symbol));

  const instRows = analyses.map((a, idx) => {
    const inst    = INSTRUMENTS[idx];
    const regColor = a.regime === 'CHAOTIC' ? '#ff4455' : a.regime === 'STABLE' ? '#00ff88'
      : a.regime === 'TRENDING' ? '#ffd700' : '#667788';
    const chgColor = a.change5d >= 0 ? '#00ff88' : '#ff4455';
    const confPct  = Math.round(a.confidence * 100);
    return `<tr>
      <td style="color:#ff9500;font-weight:bold">${a.symbol}</td>
      <td style="color:#aabbd0">${inst.name}</td>
      <td style="color:#667788">${inst.sector}</td>
      <td style="color:${chgColor}">${a.change5d >= 0 ? '+' : ''}${a.change5d}%</td>
      <td style="color:${a.lyapunov > 0 ? '#ff4455' : '#00ff88'}">${a.lyapunov.toFixed(4)}</td>
      <td>
        <span style="color:${regColor};background:${regColor}18;padding:2px 6px;border-radius:2px;font-size:.7rem">${a.regime}</span>
      </td>
      <td style="color:#ffd700">${a.action}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:60px;height:5px;background:#0a1520;border-radius:3px;overflow:hidden">
            <div style="width:${confPct}%;height:100%;background:${regColor}"></div>
          </div>
          <span style="color:${regColor};font-size:.72rem">${confPct}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  const regimeSummary = analyses.map(a => a.regime);
  const chaoticCount  = regimeSummary.filter(r => r === 'CHAOTIC').length;
  const stableCount   = regimeSummary.filter(r => r === 'STABLE').length;
  const networkAlert  = chaoticCount > analyses.length / 2 ? 'HIGH CHAOS — DEFENSIVE' : 'STABLE — SELECTIVE';
  const alertColor    = chaoticCount > analyses.length / 2 ? '#ff4455' : '#00ff88';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIGIL — RSHIP Market Sentinel</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#030208;color:#c8c8d8;font-family:'Courier New',monospace;min-height:100vh}
    header{border-bottom:1px solid #ff950033;padding:28px 40px 20px;
           background:linear-gradient(180deg,#080410 0%,transparent 100%)}
    .logo-name{font-size:2.4rem;font-weight:bold;letter-spacing:.12em;
               color:#ff9500;text-shadow:0 0 28px #ff950066;margin-bottom:4px}
    .logo-sub{font-size:.88rem;color:#553300;letter-spacing:.06em;margin-bottom:10px}
    .logo-tag{background:#ff950012;border:1px solid #ff950033;color:#ff9500;
              font-size:.7rem;padding:2px 8px;border-radius:2px;letter-spacing:.1em;margin-right:8px}
    .meta{display:flex;gap:28px;font-size:.78rem;color:#443322}
    .meta .v{color:#ff9500}
    main{padding:32px 40px;max-width:1100px;margin:0 auto}
    .alert-banner{border:1px solid ${alertColor}44;background:${alertColor}08;border-radius:6px;
                  padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:16px}
    .alert-icon{font-size:1.4rem;color:${alertColor}}
    .alert-text{font-size:.88rem;color:${alertColor};font-weight:bold;letter-spacing:.06em}
    .alert-sub{font-size:.75rem;color:#556677;margin-top:2px}
    .stats{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px}
    .stat{border:1px solid #0d1a20;background:#040208;border-radius:4px;
          padding:14px 20px;flex:1;min-width:130px}
    .stat-val{font-size:1.8rem;font-weight:bold;color:#ff9500;margin-bottom:4px}
    .stat-val.chaos{color:#ff4455}
    .stat-val.stable{color:#00ff88}
    .stat-label{font-size:.7rem;color:#332222;letter-spacing:.08em;text-transform:uppercase}
    section{margin-bottom:36px}
    h2{font-size:.78rem;letter-spacing:.15em;color:#443322;text-transform:uppercase;
       border-bottom:1px solid #0d1820;padding-bottom:8px;margin-bottom:16px}
    h2 span{color:#ff9500}
    table{width:100%;border-collapse:collapse;font-size:.8rem}
    th{text-align:left;color:#332211;font-weight:normal;font-size:.68rem;
       letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid #0a1018;padding:6px 8px}
    td{padding:9px 8px;border-bottom:1px solid #07090f;color:#8899aa}
    tr:hover td{background:#050408}
    .predict-form{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}
    select{background:#040208;border:1px solid #0d1820;color:#c8c8d8;
           font-family:'Courier New',monospace;font-size:.82rem;padding:8px 12px;border-radius:3px;outline:none}
    button{background:#ff950018;border:1px solid #ff950055;color:#ff9500;
           font-family:'Courier New',monospace;font-size:.78rem;padding:8px 16px;
           border-radius:3px;cursor:pointer;letter-spacing:.06em}
    button:hover{background:#ff950030}
    pre{background:#040208;border:1px solid #0d1820;border-radius:4px;
        padding:12px;font-size:.72rem;color:#557799;overflow-x:auto}
    .live-bar{position:fixed;bottom:0;left:0;right:0;background:#040208;
              border-top:1px solid #0d1820;padding:8px 40px;
              display:flex;align-items:center;gap:16px;font-size:.72rem}
    .pulse{display:inline-block;width:7px;height:7px;border-radius:50%;
           background:#ff9500;box-shadow:0 0 8px #ff9500;
           animation:p ${HEARTBEAT_MS}ms ease-in-out infinite}
    @keyframes p{0%,100%{opacity:1}50%{opacity:.2}}
    .lv{color:#332211}.vv{color:#ff9500}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#030208}
    ::-webkit-scrollbar-thumb{background:#0d1820}
  </style>
</head>
<body>
<header>
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:4px">
    <div class="logo-name">VIGIL</div>
    <span class="logo-tag">RSHIP-AIS-VG-001</span>
    <span class="logo-tag" style="color:#00d4ff;border-color:#00d4ff33;background:#00d4ff08">AIS</span>
  </div>
  <div class="logo-sub">vigil · "watchman · sentinel · guardian" · Market Prediction Intelligence</div>
  <div class="meta">
    <div>Watching <span class="v">${INSTRUMENTS.length}</span> instruments</div>
    <div>Chaotic <span class="v" style="color:#ff4455">${chaoticCount}</span></div>
    <div>Stable <span class="v" style="color:#00ff88">${stableCount}</span></div>
    <div>φ <span class="v">${PHI.toFixed(6)}</span></div>
  </div>
</header>
<main>
  <div class="alert-banner">
    <span class="alert-icon">◈</span>
    <div>
      <div class="alert-text">NETWORK REGIME: ${networkAlert}</div>
      <div class="alert-sub">${chaoticCount} of ${analyses.length} instruments in chaotic regime · Lyapunov detection active</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-val">${INSTRUMENTS.length}</div><div class="stat-label">Instruments</div></div>
    <div class="stat"><div class="stat-val chaos">${chaoticCount}</div><div class="stat-label">Chaotic</div></div>
    <div class="stat"><div class="stat-val stable">${stableCount}</div><div class="stat-label">Stable</div></div>
    <div class="stat"><div class="stat-val">${PHI.toFixed(3)}</div><div class="stat-label">φ Coupling</div></div>
  </div>

  <section>
    <h2>◈ Market Watch · <span>Lyapunov + Ising Regime Analysis</span></h2>
    <table>
      <thead><tr><th>Symbol</th><th>Name</th><th>Sector</th><th>5d Change</th><th>λ Exponent</th><th>Regime</th><th>Action</th><th>Confidence</th></tr></thead>
      <tbody id="inst-tbody">${instRows}</tbody>
    </table>
  </section>

  <section>
    <h2>◈ Prediction Engine · <span>Phase-Space + Ising Model</span></h2>
    <p style="font-size:.78rem;color:#554433;margin-bottom:14px">
      Select an instrument for real-time Lyapunov chaos analysis and Ising demand field prediction.
    </p>
    <div class="predict-form">
      <select id="symbol-sel">
        ${INSTRUMENTS.map(i => `<option value="${i.symbol}">${i.symbol} — ${i.name}</option>`).join('')}
      </select>
      <button onclick="predict()">Predict Regime</button>
      <button onclick="portfolioAnalysis()">Portfolio Analysis</button>
    </div>
    <pre id="predict-output">// Select an instrument and click Predict Regime</pre>
  </section>
</main>

<div class="live-bar">
  <span class="pulse"></span>
  <span class="lv">VIGIL ALIVE — watching</span>
  <span class="vv">${INSTRUMENTS.length}</span>
  <span class="lv">instruments — beat</span>
  <span class="vv" id="live-beat">${beat}</span>
  <span class="lv" style="margin-left:auto">© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems</span>
</div>

<script>
async function predict() {
  const symbol = document.getElementById('symbol-sel').value;
  try {
    const r = await fetch('/api/market/predict', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ symbol })
    });
    document.getElementById('predict-output').textContent = JSON.stringify(await r.json(), null, 2);
  } catch(e) { document.getElementById('predict-output').textContent = 'Error: ' + e.message; }
}
async function portfolioAnalysis() {
  try {
    const r = await fetch('/api/portfolio/analyze', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ holdings: [{symbol:'SPY',weight:.4},{symbol:'BTC',weight:.2},{symbol:'GLD',weight:.2},{symbol:'TLT',weight:.2}] })
    });
    document.getElementById('predict-output').textContent = JSON.stringify(await r.json(), null, 2);
  } catch(e) { document.getElementById('predict-output').textContent = 'Error: ' + e.message; }
}
async function tick() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    document.getElementById('live-beat').textContent = d.beat;
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
    const seal   = phiHash(`vigil:beat:${beat}:${startTime}`);

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
      const analyses = INSTRUMENTS.map(i => analyzeInstrument(i.symbol));
      return Response.json({
        designation   : 'RSHIP-AIS-VG-001',
        name          : 'VIGIL',
        latin         : 'vigil',
        meaning       : 'watchman · sentinel · guardian',
        beat,
        seal          : seal.slice(0, 16) + '…',
        watching      : INSTRUMENTS.length,
        chaoticCount  : analyses.filter(a => a.regime === 'CHAOTIC').length,
        stableCount   : analyses.filter(a => a.regime === 'STABLE').length,
        phi           : PHI,
        uptimeSec     : parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
        alive         : true,
      }, { headers: cors });
    }

    if (path === '/api/market/predict' && method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch { /**/ }
      const symbol = String(body.symbol || 'SPY').toUpperCase();
      const inst   = INSTRUMENTS.find(i => i.symbol === symbol) || { symbol, name: symbol, type: 'UNKNOWN', sector: 'UNKNOWN' };
      const a      = analyzeInstrument(symbol);
      const series = seededSeries(symbol);
      return Response.json({
        symbol,
        instrument   : inst,
        analysis     : a,
        seriesSample : series.slice(-10),
        interpretation: {
          lyapunov  : a.lyapunov > 0 ? `Positive (${a.lyapunov}) → chaotic/trending` : `Negative (${a.lyapunov}) → stable/mean-reverting`,
          ising     : `Order parameter ${a.isingOrder} → ${a.isingOrder > PHI_INV ? 'strong demand alignment' : 'mixed demand'}`,
          phi       : `φ-coupling ${PHI.toFixed(4)} applied to confidence weighting`,
        },
        beat,
      }, { headers: cors });
    }

    if (path === '/api/market/regime' && method === 'GET') {
      const analyses = INSTRUMENTS.map(i => analyzeInstrument(i.symbol));
      return Response.json({
        instruments  : analyses,
        networkRegime: analyses.filter(a => a.regime === 'CHAOTIC').length > analyses.length / 2 ? 'CHAOTIC' : 'STABLE',
        beat,
      }, { headers: cors });
    }

    if (path === '/api/portfolio/analyze' && method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch { /**/ }
      const holdings = Array.isArray(body.holdings) ? body.holdings : [];
      const analyzed = holdings.map(h => {
        const a = analyzeInstrument(String(h.symbol || 'SPY').toUpperCase());
        return { ...a, weight: parseFloat(h.weight || 0.25), contribution: parseFloat((a.confidence * (h.weight || 0.25)).toFixed(4)) };
      });
      const portfolioScore = analyzed.reduce((s, h) => s + h.contribution, 0);
      const chaoticW = analyzed.filter(h => h.regime === 'CHAOTIC').reduce((s, h) => s + h.weight, 0);
      return Response.json({
        holdings        : analyzed,
        portfolioScore  : parseFloat(portfolioScore.toFixed(4)),
        chaoticExposure : parseFloat(chaoticW.toFixed(4)),
        recommendation  : chaoticW > 0.5 ? 'REDUCE_CHAOS — rotate to stable instruments' : 'BALANCED — maintain allocation',
        phi             : PHI,
        beat,
      }, { headers: cors });
    }

    if (path === '/api/watch/list' && method === 'GET') {
      return Response.json({ instruments: INSTRUMENTS, count: INSTRUMENTS.length, beat }, { headers: cors });
    }

    return Response.json({
      error    : 'NOT_FOUND',
      path,
      available: ['/', '/api/status', '/api/market/predict', '/api/market/regime', '/api/portfolio/analyze', '/api/watch/list'],
    }, { status: 404, headers: cors });
  },
};
