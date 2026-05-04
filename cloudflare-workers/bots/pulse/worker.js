/**
 * PULSE — Scheduled Intelligence Report Bot
 *
 * Designation:  RSHIP-BOT-PLS-001
 * Latin:        pulsus (heartbeat · rhythm · impulse)
 * Type:         CRON BOT · Cloudflare Scheduled Worker
 *
 * PULSE runs on Cloudflare Cron Triggers to deliver scheduled intelligence
 * briefings from the RSHIP agent network to Slack and Discord.
 *
 * Cron Schedule (configure in wrangler.toml):
 *   Every hour        → Hourly network pulse
 *   09:00 UTC M-F     → Market open briefing (VIGIL + NEXUS)
 *   00:00 UTC daily   → Full intelligence digest (all agents)
 *
 * Routes:
 *   GET  /                    → Info page
 *   GET  /api/status          → Bot health
 *   GET  /report/latest       → Latest generated report (in-memory)
 *   GET  /report/market       → Market intelligence report
 *   GET  /report/supply       → Supply chain intelligence report
 *   GET  /report/network      → Full network status
 *   POST /report/trigger      → Manually trigger a report + optional delivery
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI          = 1.618033988749895;
const PHI_INV      = 0.618033988749895;
const HEARTBEAT_MS = 873;
const VERSION      = '1.0.0';

const AGENTS = {
  CEREBRUM : 'https://cerebrum.rship.workers.dev',
  VIGIL    : 'https://vigil.rship.workers.dev',
  NEXUS    : 'https://nexus.rship.workers.dev',
  CURSOR   : 'https://cursor.rship.workers.dev',
  AGENS    : 'https://agens.rship.workers.dev',
};

// ── Report store (in-memory — resets on cold start) ───────────────────────────
const reports = {
  latest  : null,
  market  : null,
  supply  : null,
  network : null,
};
let reportCount = 0, startTime = Date.now();

// ── Fetch helpers ──────────────────────────────────────────────────────────────
async function safeGet(url) {
  try {
    const r = await fetch(url, { signal:AbortSignal.timeout(5000) });
    return await r.json();
  } catch(e) { return { error:String(e.message), unreachable:true }; }
}

async function safePost(url, body) {
  try {
    const r = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body), signal:AbortSignal.timeout(5000),
    });
    return await r.json();
  } catch(e) { return { error:String(e.message), unreachable:true }; }
}

// ── Report generators ──────────────────────────────────────────────────────────
async function generateMarketReport() {
  const [regime, portfolio] = await Promise.all([
    safeGet(`${AGENTS.VIGIL}/api/market/regime`),
    safePost(`${AGENTS.VIGIL}/api/portfolio/analyze`, {
      holdings:[
        {symbol:'SPY',weight:.4},{symbol:'BTC',weight:.2},
        {symbol:'GLD',weight:.2},{symbol:'QQQ',weight:.2}
      ]
    }),
  ]);

  const instruments = regime.instruments || [];
  const chaotic = instruments.filter(i => i.regime==='CHAOTIC');
  const stable  = instruments.filter(i => i.regime==='STABLE');
  const networkRegime = regime.networkRegime || 'UNKNOWN';

  const summary = [
    `• Network Regime: **${networkRegime}**`,
    `• Chaotic Instruments: ${chaotic.length} (${chaotic.map(i=>i.symbol).join(', ')||'none'})`,
    `• Stable Instruments: ${stable.length} (${stable.map(i=>i.symbol).join(', ')||'none'})`,
    `• Portfolio Score: ${portfolio.portfolioScore ?? '—'}`,
    `• Chaotic Exposure: ${portfolio.chaoticExposure !== undefined ? Math.round(portfolio.chaoticExposure*100)+'%' : '—'}`,
    `• Recommendation: ${portfolio.recommendation || '—'}`,
  ].join('\n');

  const topPrediction = instruments[0] || {};
  const report = {
    type:'MARKET', generatedAt:Date.now(),
    networkRegime, chaoticCount:chaotic.length, stableCount:stable.length,
    portfolioScore:portfolio.portfolioScore,
    recommendation:portfolio.recommendation,
    instruments: instruments.slice(0,6).map(i => ({
      symbol:i.symbol, regime:i.regime, action:i.action,
      lyapunov:i.lyapunov, confidence:i.confidence,
    })),
    summary,
  };
  reports.market = report;
  reports.latest = report;
  return report;
}

async function generateSupplyReport() {
  const [nodes, disruptions] = await Promise.all([
    safeGet(`${AGENTS.NEXUS}/api/nodes`),
    safeGet(`${AGENTS.NEXUS}/api/disruption/active`),
  ]);

  const nodeList  = nodes.nodes || [];
  const distList  = disruptions.active || [];
  const avgCap    = nodeList.length
    ? Math.round(nodeList.reduce((s,n)=>s+n.capacity,0)/nodeList.length*100) : 0;
  const lowCap    = nodeList.filter(n=>n.capacity<0.6);

  const summary = [
    `• Kuramoto Sync R: **${nodes.kuramotoR ?? '—'}** (${nodes.synced ? 'SYNCED' : 'EMERGING'})`,
    `• Network Nodes: ${nodeList.length}`,
    `• Avg Capacity: ${avgCap}%`,
    `• Low Capacity Nodes: ${lowCap.length} — ${lowCap.map(n=>n.id).join(', ')||'none'}`,
    `• Active Disruptions: **${distList.length}**`,
    distList.length > 0 ? distList.map(d=>`  ⚠ ${d.id}: ${d.type} at ${d.nodeId} (${d.severity})`).join('\n') : '',
  ].filter(Boolean).join('\n');

  const report = {
    type:'SUPPLY', generatedAt:Date.now(),
    kuramotoR:nodes.kuramotoR, synced:nodes.synced,
    nodeCount:nodeList.length, avgCapacityPct:avgCap,
    lowCapacityCount:lowCap.length, activeDisruptions:distList.length,
    disruptions:distList, summary,
  };
  reports.supply = report;
  reports.latest = report;
  return report;
}

async function generateNetworkReport() {
  const [health, marketRpt, supplyRpt] = await Promise.all([
    safeGet(`${AGENTS.CEREBRUM}/api/health`),
    generateMarketReport(),
    generateSupplyReport(),
  ]);

  const agentList = health.agents || [];
  const emergenceLevel = health.cerebrum?.emergence ?? '—';
  const beat = health.beat ?? '—';

  const summary = [
    `**RSHIP Network Intelligence Digest**`,
    `• Emergence Level: ${emergenceLevel}`,
    `• Beat: ${beat}`,
    `• Agents Online: ${agentList.length}`,
    ``,
    `**Market** — ${marketRpt.networkRegime}`,
    `${marketRpt.summary}`,
    ``,
    `**Supply Chain** — ${supplyRpt.activeDisruptions} disruptions`,
    `${supplyRpt.summary}`,
  ].join('\n');

  const report = {
    type:'NETWORK', generatedAt:Date.now(),
    emergenceLevel, beat, agentCount:agentList.length,
    market:marketRpt, supply:supplyRpt, summary,
  };
  reports.network = report;
  reports.latest  = report;
  return report;
}

// ── Deliver to Slack ───────────────────────────────────────────────────────────
async function deliverToSlack(webhookUrl, report) {
  if (!webhookUrl) return { delivered:false, reason:'NO_WEBHOOK' };
  const emoji = report.type==='MARKET'?'��':report.type==='SUPPLY'?'🚚':'🌐';
  const message = {
    username:'PULSE · RSHIP Intelligence',
    icon_emoji:':satellite_antenna:',
    text:`${emoji} *RSHIP ${report.type} REPORT* — ${new Date(report.generatedAt).toUTCString()}`,
    blocks:[
      {type:'header', text:{type:'plain_text', text:`${emoji} RSHIP ${report.type} REPORT`, emoji:true}},
      {type:'section', text:{type:'mrkdwn', text:String(report.summary||'').slice(0,2800)}},
      {type:'context', elements:[
        {type:'mrkdwn', text:`PULSE · RSHIP-BOT-PLS-001`},
        {type:'mrkdwn', text:`φ = ${PHI} · ${new Date(report.generatedAt).toUTCString()}`},
      ]},
    ],
  };
  try {
    const r = await fetch(webhookUrl, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify(message), signal:AbortSignal.timeout(5000),
    });
    return { delivered:true, status:r.status };
  } catch(e) { return { delivered:false, error:String(e.message) }; }
}

// ── Deliver to Discord ─────────────────────────────────────────────────────────
async function deliverToDiscord(webhookUrl, report) {
  if (!webhookUrl) return { delivered:false, reason:'NO_WEBHOOK' };
  const emoji = report.type==='MARKET'?'📈':report.type==='SUPPLY'?'🚚':'🌐';
  const color = report.type==='MARKET'?0xff9500:report.type==='SUPPLY'?0x00ff88:0x00d4ff;
  const embed = {
    title: `${emoji} RSHIP ${report.type} REPORT`,
    description: String(report.summary||'').slice(0, 2000),
    color, timestamp: new Date(report.generatedAt).toISOString(),
    footer:{ text:'PULSE · RSHIP-BOT-PLS-001' },
    fields: report.type==='MARKET' ? [
      {name:'Network Regime', value:report.networkRegime||'—', inline:true},
      {name:'Chaotic', value:String(report.chaoticCount||0), inline:true},
      {name:'Portfolio Rec.', value:report.recommendation||'—', inline:true},
    ] : report.type==='SUPPLY' ? [
      {name:'Kuramoto R', value:String(report.kuramotoR||'—'), inline:true},
      {name:'Disruptions', value:String(report.activeDisruptions||0), inline:true},
      {name:'Avg Capacity', value:`${report.avgCapacityPct||0}%`, inline:true},
    ] : [
      {name:'Agents', value:String(report.agentCount||'—'), inline:true},
      {name:'Emergence', value:String(report.emergenceLevel||'—'), inline:true},
      {name:'Beat', value:String(report.beat||'—'), inline:true},
    ],
  };
  try {
    const r = await fetch(webhookUrl, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:'PULSE · RSHIP',embeds:[embed]}), signal:AbortSignal.timeout(5000),
    });
    return { delivered:true, status:r.status };
  } catch(e) { return { delivered:false, error:String(e.message) }; }
}

// ── Cron scheduled handler ─────────────────────────────────────────────────────
async function runScheduled(event, env) {
  reportCount++;
  const cron = event.cron || '';
  let report;

  if (cron === '0 * * * *') {
    // Hourly — quick network pulse
    report = await generateMarketReport();
  } else if (cron === '0 9 * * 1-5') {
    // Market open M-F — market + supply briefing
    report = await generateNetworkReport();
  } else {
    // Daily midnight — full digest
    report = await generateNetworkReport();
  }

  // Deliver to Slack
  if (env.PULSE_WEBHOOK_SLACK) await deliverToSlack(env.PULSE_WEBHOOK_SLACK, report);
  // Deliver to Discord
  if (env.PULSE_WEBHOOK_DISCORD) await deliverToDiscord(env.PULSE_WEBHOOK_DISCORD, report);
}

// ── Info page ──────────────────────────────────────────────────────────────────
function buildInfoPage() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>PULSE — RSHIP Intelligence Bot</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#02050f;color:#c8d8f8;font-family:'Courier New',monospace;padding:48px;max-width:800px;margin:0 auto}
h1{font-size:2.5rem;color:#ffd700;margin-bottom:8px}
.latin{font-size:.9rem;color:#445566;font-style:italic;margin-bottom:32px}
h2{font-size:1rem;color:#8899bb;letter-spacing:.1em;text-transform:uppercase;margin:32px 0 12px}
code{background:#060d1a;border:1px solid #0d2030;padding:2px 8px;border-radius:3px;color:#ffd700;font-size:.85rem}
pre{background:#060d1a;border:1px solid #0d2030;padding:20px;border-radius:6px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin:8px 0 20px}
.cron{display:flex;gap:16px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #060d1a}
.cron-expr{color:#ffd700;min-width:180px;font-size:.82rem}
.cron-desc{color:#667788;font-size:.82rem;line-height:1.5}
footer{margin-top:48px;color:#223344;font-size:.75rem}
</style></head><body>
<h1>◉ PULSE</h1>
<div class="latin">pulsus · "heartbeat · rhythm · intelligence signal" · RSHIP-BOT-PLS-001</div>
<p style="color:#667788;line-height:1.7;font-size:.88rem">Scheduled intelligence briefing bot. Runs on Cloudflare Cron Triggers to deliver RSHIP market, supply chain, and network reports to Slack and Discord on schedule — automatically, no human needed.</p>

<h2>Cron Schedule</h2>
<div class="cron"><div class="cron-expr"><code>0 * * * *</code></div><div class="cron-desc">Every hour — Hourly market pulse (VIGIL regime + portfolio)</div></div>
<div class="cron"><div class="cron-expr"><code>0 9 * * 1-5</code></div><div class="cron-desc">09:00 UTC Mon–Fri — Market open briefing (VIGIL + NEXUS)</div></div>
<div class="cron"><div class="cron-expr"><code>0 0 * * *</code></div><div class="cron-desc">Midnight UTC daily — Full intelligence digest (all agents)</div></div>

<h2>Report Endpoints</h2>
<pre>GET  /report/latest    → Last generated report (any type)
GET  /report/market    → Generate + return live market report (VIGIL)
GET  /report/supply    → Generate + return live supply report (NEXUS)
GET  /report/network   → Generate + return full network digest
POST /report/trigger   → Manually trigger report + deliver to webhook</pre>

<h2>Setup</h2>
<pre>wrangler secret put PULSE_WEBHOOK_SLACK      # Slack incoming webhook URL
wrangler secret put PULSE_WEBHOOK_DISCORD    # Discord webhook URL
wrangler deploy</pre>

<h2>Manual Trigger</h2>
<pre>POST /report/trigger
{
  "type": "market",       // "market" | "supply" | "network"
  "destination": "slack", // "slack" | "discord" | null
  "webhookUrl": "https://hooks.slack.com/services/..."  // optional
}</pre>

<footer>© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved</footer>
</body></html>`;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(event, env));
  },

  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;
    const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type' };

    if (request.method === 'OPTIONS') return new Response(null, {status:204,headers:cors});

    if (path === '/')
      return new Response(buildInfoPage(), {headers:{'Content-Type':'text/html;charset=UTF-8',...cors}});

    if (path === '/api/status')
      return Response.json({
        designation:'RSHIP-BOT-PLS-001', name:'PULSE', type:'CRON_BOT',
        latin:'pulsus', meaning:'heartbeat · rhythm · intelligence signal',
        reportCount, lastReport:reports.latest?.generatedAt || null,
        cronSchedules:['0 * * * *','0 9 * * 1-5','0 0 * * *'],
        phi:PHI, uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)), alive:true
      }, {headers:cors});

    if (path === '/report/latest')
      return Response.json(reports.latest || { message:'No reports generated yet. POST /report/trigger to generate one.' }, {headers:cors});

    if (path === '/report/market' && request.method === 'GET') {
      const report = await generateMarketReport();
      return Response.json(report, {headers:cors});
    }
    if (path === '/report/supply' && request.method === 'GET') {
      const report = await generateSupplyReport();
      return Response.json(report, {headers:cors});
    }
    if (path === '/report/network' && request.method === 'GET') {
      const report = await generateNetworkReport();
      return Response.json(report, {headers:cors});
    }

    if (path === '/report/trigger' && request.method === 'POST') {
      let body = {}; try { body = await request.json(); } catch {}
      const type = String(body.type || 'market');
      let report;
      if (type === 'supply')  report = await generateSupplyReport();
      else if (type==='network') report = await generateNetworkReport();
      else report = await generateMarketReport();
      reportCount++;

      let delivery = null;
      const dest = body.destination;
      const wh   = body.webhookUrl || '';
      if (dest === 'slack')   delivery = await deliverToSlack(wh || env.PULSE_WEBHOOK_SLACK, report);
      if (dest === 'discord') delivery = await deliverToDiscord(wh || env.PULSE_WEBHOOK_DISCORD, report);

      return Response.json({ triggered:true, report, delivery }, {headers:cors});
    }

    return Response.json({ error:'NOT_FOUND', path,
      available:['/','/api/status','/report/latest','/report/market','/report/supply','/report/network','/report/trigger']
    }, {status:404, headers:cors});
  },
};
