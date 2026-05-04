/**
 * HERALD — RSHIP Slack Intelligence Bot
 *
 * Designation:  RSHIP-BOT-HLD-001
 * Latin:        heraldus (messenger · herald · announcer)
 * Type:         SLACK BOT · Cloudflare Worker
 *
 * Slash command: /rship [subcommand] [args]
 *   /rship status               → RSHIP network health across all 6 agents
 *   /rship market [SYMBOL]      → VIGIL regime prediction (e.g. /rship market SPY)
 *   /rship flight [ROUTE]       → CURSOR flight prediction (e.g. /rship flight LHR-LAX)
 *   /rship supply [NODE-ID]     → NEXUS node status (e.g. /rship supply PORT-SHA)
 *   /rship ask [QUESTION]       → AGENS master agent answer
 *   /rship help                 → command reference
 *
 * Setup:
 *   1. Create Slack app at api.slack.com/apps
 *   2. Add slash command /rship → https://your-worker.workers.dev/slack/command
 *   3. wrangler secret put SLACK_SIGNING_SECRET
 *   4. wrangler secret put SLACK_BOT_TOKEN
 *   5. wrangler deploy
 *
 * Handles:
 *   POST /slack/command    → Slash command handler
 *   POST /slack/events     → Events API (message/mention)
 *   POST /slack/actions    → Block Kit interactive actions
 *   GET  /api/status       → Bot health
 *   GET  /                 → Info page
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
  ANIMUS   : 'https://animus.rship.workers.dev',
  NEXUS    : 'https://nexus.rship.workers.dev',
  VIGIL    : 'https://vigil.rship.workers.dev',
  CURSOR   : 'https://cursor.rship.workers.dev',
  AGENS    : 'https://agens.rship.workers.dev',
};

// ── Slack signature verification (Web Crypto, no Node.js crypto needed) ────────
async function verifySlackSignature(request, rawBody, signingSecret) {
  if (!signingSecret) return true; // dev mode — skip verification
  const timestamp = request.headers.get('x-slack-request-timestamp') || '0';
  const slackSig  = request.headers.get('x-slack-signature') || '';
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false; // replay guard
  const base = `v0:${timestamp}:${rawBody}`;
  const key  = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(signingSecret),
    { name:'HMAC', hash:'SHA-256' }, false, ['sign']
  );
  const sig  = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(base));
  const hex  = 'v0=' + [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2,'0')).join('');
  return hex === slackSig;
}

// ── Parse Slack slash command body ─────────────────────────────────────────────
function parseSlackBody(raw) {
  const params = {};
  for (const pair of raw.split('&')) {
    const [k, v] = pair.split('=').map(decodeURIComponent);
    params[k.replace(/\+/g,' ')] = (v||'').replace(/\+/g,' ');
  }
  return params;
}

// ── Fetch RSHIP agent API ──────────────────────────────────────────────────────
async function fetchAgent(url, options = {}) {
  try {
    const resp = await fetch(url, { ...options, signal: AbortSignal.timeout(4000) });
    return await resp.json();
  } catch (e) {
    return { error: String(e.message), unreachable: true };
  }
}

// ── Slack Block Kit builders ───────────────────────────────────────────────────
function mkSection(text) {
  return { type:'section', text:{ type:'mrkdwn', text } };
}
function mkDivider() { return { type:'divider' }; }
function mkHeader(text) {
  return { type:'header', text:{ type:'plain_text', text, emoji:true } };
}
function mkContext(elements) {
  return { type:'context', elements: elements.map(t => ({ type:'mrkdwn', text:t })) };
}
function mkFields(fields) {
  return { type:'section', fields: fields.map(f => ({ type:'mrkdwn', text:f })) };
}

// ── Command handlers ───────────────────────────────────────────────────────────
async function cmdStatus() {
  const data = await fetchAgent(`${AGENTS.CEREBRUM}/api/health`);
  if (data.error || data.unreachable) {
    return {
      blocks: [
        mkHeader('⚠️ RSHIP Network Unreachable'),
        mkSection(`CEREBRUM could not be reached.\n\`${data.error || 'timeout'}\``),
        mkContext(['RSHIP-BOT-HLD-001 · HERALD']),
      ]
    };
  }
  const agentLines = (data.agents || []).map(a => `• *${a.name}* — ${a.url}`).join('\n');
  const emergence = data.cerebrum?.emergence ?? '—';
  const beat = data.beat ?? '—';
  return {
    blocks: [
      mkHeader('◎ RSHIP Network Status'),
      mkFields([
        `*Emergence Level*\n${emergence}`,
        `*Network Heartbeat*\n${beat}`,
        `*Golden Ratio φ*\n${PHI.toFixed(4)}`,
        `*Status*\n🟢 OPERATIONAL`,
      ]),
      mkDivider(),
      mkSection(`*Active Agents (${(data.agents||[]).length})*\n${agentLines || '—'}`),
      mkContext(['◎ CEREBRUM · RSHIP-AIS-CB-001', `φ = ${PHI}`]),
    ]
  };
}

async function cmdMarket(symbol = 'SPY') {
  const sym = symbol.toUpperCase().slice(0, 10);
  const data = await fetchAgent(`${AGENTS.VIGIL}/api/market/predict`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ symbol: sym })
  });
  if (data.error || data.unreachable) {
    return { blocks:[mkHeader(`⚠️ VIGIL Unreachable`), mkSection(`${data.error||'timeout'}`)] };
  }
  const a = data.analysis || data;
  const regimeEmoji = a.regime==='CHAOTIC'?'🔴':a.regime==='STABLE'?'🟢':a.regime==='TRENDING'?'🟡':'⚪';
  const actionEmoji = a.action==='BUY_NOW'?'🚀':a.action==='WAIT_FOR_DIP'?'⬇️':a.action==='BOOK_SOON'?'⏰':'👀';
  const confPct = a.confidence ? Math.round(a.confidence * 100) : '—';
  const confBar = a.confidence ? '█'.repeat(Math.round(a.confidence*10)) + '░'.repeat(10-Math.round(a.confidence*10)) : '—';
  return {
    blocks: [
      mkHeader(`◉ VIGIL — ${sym} Market Intelligence`),
      mkFields([
        `*Regime*\n${regimeEmoji} ${a.regime||'—'}`,
        `*Action*\n${actionEmoji} \`${a.action||'—'}\``,
        `*Lyapunov λ*\n\`${a.lyapunov||a.analysis?.lyapunov||'—'}\``,
        `*Ising Demand*\n\`${a.isingOrder||a.isingDemand||'—'}\``,
        `*5d Change*\n${(a.change5d >= 0 ? '+' : '')}${a.change5d||'—'}%`,
        `*Confidence*\n${confPct}%`,
      ]),
      mkSection(`\`${confBar}\` ${confPct}%`),
      mkContext(['◉ VIGIL · RSHIP-AIS-VG-001', 'Lyapunov exponent + Ising demand field']),
    ]
  };
}

async function cmdFlight(route = 'LHR-LAX') {
  const rt = route.toUpperCase().replace(/\s+/g,'-').slice(0, 20);
  const data = await fetchAgent(`${AGENTS.CURSOR}/api/flight/predict`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ route: rt })
  });
  if (data.error || data.unreachable) {
    return { blocks:[mkHeader(`⚠️ CURSOR Unreachable`), mkSection(`${data.error||'timeout'}`)] };
  }
  const actionEmoji = data.action==='BUY_NOW'?'🚀':data.action==='WAIT_FOR_DIP'?'⬇️':data.action==='BOOK_SOON'?'⏰':'👀';
  const regimeEmoji = data.regime==='CHAOTIC'?'🔴':data.regime==='STABLE'?'🟢':'🟡';
  return {
    blocks: [
      mkHeader(`↗ CURSOR — ${rt} Flight Intelligence`),
      mkFields([
        `*Current Price*\n💰 $${data.currentPrice||'—'}`,
        `*Recommendation*\n${actionEmoji} \`${data.action||'—'}\``,
        `*5d Trend*\n${data.trend5d >= 0 ? '+' : ''}$${data.trend5d||'—'}`,
        `*Price Forecast*\n$${data.priceForecast||'—'}`,
        `*Regime*\n${regimeEmoji} ${data.regime||'—'}`,
        `*Confidence*\n${data.confidence ? Math.round(data.confidence*100) : '—'}%`,
      ]),
      mkContext(['↗ CURSOR · RSHIP-AIS-CS-001', 'Lyapunov + Ising flight price prediction']),
    ]
  };
}

async function cmdSupply(nodeId) {
  const data = await fetchAgent(`${AGENTS.NEXUS}/api/nodes`);
  if (data.error || data.unreachable) {
    return { blocks:[mkHeader(`⚠️ NEXUS Unreachable`), mkSection(`${data.error||'timeout'}`)] };
  }
  const nodes = data.nodes || [];
  if (nodeId) {
    const id  = nodeId.toUpperCase();
    const node = nodes.find(n => n.id === id || n.name.toLowerCase().includes(id.toLowerCase()));
    if (!node) return {
      blocks: [
        mkHeader('⬡ NEXUS — Node Not Found'),
        mkSection(`No node matching \`${id}\`\n\nAvailable: ${nodes.map(n=>n.id).join(', ')}`),
      ]
    };
    const pct = Math.round(node.capacity * 100);
    const capBar = '█'.repeat(Math.round(node.capacity*10)) + '░'.repeat(10-Math.round(node.capacity*10));
    const capEmoji = pct > 80 ? '🟢' : pct > 50 ? '🟡' : '🔴';
    return {
      blocks: [
        mkHeader(`⬡ NEXUS — ${node.name}`),
        mkFields([
          `*Node ID*\n\`${node.id}\``,
          `*Type*\n${node.type}`,
          `*Region*\n${node.region}`,
          `*Capacity*\n${capEmoji} ${pct}%`,
        ]),
        mkSection(`\`${capBar}\` ${pct}% · Kuramoto R: ${data.kuramotoR}`),
        mkContext(['⬡ NEXUS · RSHIP-AIS-NX-001', `Synced: ${data.synced ? '✅' : '⏳'}`]),
      ]
    };
  }
  // No specific node — network overview
  const disruptions = nodes.filter(n => n.capacity < 0.6).length;
  const avgCap = Math.round(nodes.reduce((s,n) => s+n.capacity,0)/nodes.length*100);
  return {
    blocks: [
      mkHeader('⬡ NEXUS — Supply Chain Network'),
      mkFields([
        `*Nodes*\n${nodes.length}`,
        `*Kuramoto R*\n${data.kuramotoR}`,
        `*Avg Capacity*\n${avgCap}%`,
        `*Low-Cap Nodes*\n${disruptions > 0 ? '🔴' : '🟢'} ${disruptions}`,
      ]),
      mkSection(nodes.slice(0,5).map(n => {
        const pct = Math.round(n.capacity*100);
        const e = pct>80?'🟢':pct>50?'🟡':'🔴';
        return `${e} *${n.id}* — ${n.name} (${pct}%)`;
      }).join('\n') + (nodes.length > 5 ? `\n_…and ${nodes.length-5} more_` : '')),
      mkContext(['⬡ NEXUS · RSHIP-AIS-NX-001', `Synced: ${data.synced ? '✅' : '⏳'}`]),
    ]
  };
}

async function cmdAsk(question) {
  if (!question) return {
    blocks: [mkHeader('⬡ AGENS — Ask Anything'), mkSection('Usage: `/rship ask [your question]`\nExample: `/rship ask what is ANIMUS?`')]
  };
  const data = await fetchAgent(`${AGENTS.AGENS}/api/agent/chat`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ message: question })
  });
  if (data.error || data.unreachable) {
    return { blocks:[mkHeader(`⚠️ AGENS Unreachable`), mkSection(`${data.error||'timeout'}`)] };
  }
  const response = String(data.response || '').slice(0, 2800);
  return {
    blocks: [
      mkHeader('⬡ AGENS — Agent Response'),
      mkSection(`*You asked:* ${question}`),
      mkDivider(),
      mkSection(response),
      mkContext([`⬡ AGENS · RSHIP-AIS-AG-001`, `Confidence: ${data.confidence ? Math.round(data.confidence*100)+'%' : '—'}`]),
    ]
  };
}

function cmdHelp() {
  return {
    blocks: [
      mkHeader('◎ HERALD — RSHIP Intelligence Bot'),
      mkSection('*Available Commands*'),
      mkSection([
        '`/rship status`               — Full network health across all 6 agents',
        '`/rship market [SYMBOL]`      — Market regime prediction (SPY, BTC, GLD…)',
        '`/rship flight [ROUTE]`       — Flight price prediction (LHR-LAX, JFK-NRT…)',
        '`/rship supply [NODE-ID]`     — Supply chain node status (PORT-SHA, HUB-DXB…)',
        '`/rship supply`               — Full NEXUS network overview',
        '`/rship ask [QUESTION]`       — Ask the AGENS master AI agent anything',
        '`/rship help`                 — This help menu',
      ].join('\n')),
      mkDivider(),
      mkContext([
        'HERALD · RSHIP-BOT-HLD-001',
        'RSHIP AIS Network · 6 Sovereign Agents',
        `φ = ${PHI}`,
      ]),
    ]
  };
}

// ── Route command text ─────────────────────────────────────────────────────────
async function routeCommand(text) {
  const [sub, ...args] = (text || '').trim().split(/\s+/);
  const arg = args.join(' ').trim();
  switch ((sub || 'help').toLowerCase()) {
    case 'status': return cmdStatus();
    case 'market': return cmdMarket(arg || 'SPY');
    case 'flight': return cmdFlight(arg || 'LHR-LAX');
    case 'supply': return cmdSupply(arg || '');
    case 'ask':    return cmdAsk(arg);
    default:       return cmdHelp();
  }
}

// ── Handle Slack slash command ─────────────────────────────────────────────────
async function handleSlashCommand(request, env) {
  const rawBody = await request.text();
  const valid = await verifySlackSignature(request, rawBody, env.SLACK_SIGNING_SECRET);
  if (!valid) return new Response('Unauthorized', { status:401 });

  const params = parseSlackBody(rawBody);
  const text   = params.text || '';

  // Immediate ack response (Slack requires <3s)
  const payload = await routeCommand(text);
  return Response.json({ response_type:'in_channel', ...payload });
}

// ── Handle Slack Events API ────────────────────────────────────────────────────
async function handleSlackEvent(request, env) {
  const rawBody = await request.text();
  const valid = await verifySlackSignature(request, rawBody, env.SLACK_SIGNING_SECRET);
  if (!valid) return new Response('Unauthorized', { status:401 });

  const body = JSON.parse(rawBody);

  // URL verification challenge
  if (body.type === 'url_verification') {
    return Response.json({ challenge: body.challenge });
  }

  const event = body.event || {};

  // Respond to app mentions: "@HERALD market SPY"
  if (event.type === 'app_mention' && event.text) {
    const text = event.text.replace(/<@[A-Z0-9]+>/, '').trim();
    const payload = await routeCommand(text);

    // Post back to Slack via bot token
    if (env.SLACK_BOT_TOKEN && event.channel) {
      fetch('https://slack.com/api/chat.postMessage', {
        method:'POST',
        headers:{ 'Authorization':`Bearer ${env.SLACK_BOT_TOKEN}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ channel: event.channel, ...payload }),
      });
    }
  }

  return Response.json({ ok: true });
}

// ── Handle Block Kit actions ───────────────────────────────────────────────────
async function handleSlackAction(request, env) {
  const rawBody = await request.text();
  const valid = await verifySlackSignature(request, rawBody, env.SLACK_SIGNING_SECRET);
  if (!valid) return new Response('Unauthorized', { status:401 });
  // Future: handle button clicks, menu selections
  return Response.json({ ok: true });
}

// ── Info HTML page ─────────────────────────────────────────────────────────────
function buildInfoPage() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>HERALD — RSHIP Slack Bot</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#02050f;color:#c8d8f8;font-family:'Courier New',monospace;padding:48px;max-width:800px;margin:0 auto}
h1{font-size:2.5rem;color:#00d4ff;margin-bottom:8px}
.latin{font-size:.9rem;color:#445566;font-style:italic;margin-bottom:32px}
h2{font-size:1rem;color:#8899bb;letter-spacing:.1em;text-transform:uppercase;margin:32px 0 12px}
code{background:#060d1a;border:1px solid #0d2030;padding:2px 8px;border-radius:3px;color:#ffd700;font-size:.85rem}
pre{background:#060d1a;border:1px solid #0d2030;padding:20px;border-radius:6px;font-size:.82rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin-top:8px}
.cmd{display:flex;gap:16px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #0d2030}
.cmd-name{color:#ffd700;min-width:220px;font-size:.85rem}
.cmd-desc{color:#667788;font-size:.82rem;line-height:1.5}
footer{margin-top:48px;color:#223344;font-size:.75rem}
</style></head><body>
<h1>◎ HERALD</h1>
<div class="latin">heraldus · "messenger · herald · announcer" · RSHIP-BOT-HLD-001</div>

<h2>What is HERALD?</h2>
<p style="color:#667788;line-height:1.7;font-size:.88rem">HERALD is the RSHIP Slack intelligence bot. It brings the full RSHIP AIS agent network — CEREBRUM, VIGIL, NEXUS, CURSOR, AGENS — directly into your Slack workspace via slash commands.</p>

<h2>Slash Commands</h2>
<div class="cmd"><div class="cmd-name"><code>/rship status</code></div><div class="cmd-desc">Full network health across all 6 RSHIP agents</div></div>
<div class="cmd"><div class="cmd-name"><code>/rship market [SYMBOL]</code></div><div class="cmd-desc">VIGIL market regime prediction — SPY, BTC, GLD, QQQ…</div></div>
<div class="cmd"><div class="cmd-name"><code>/rship flight [ROUTE]</code></div><div class="cmd-desc">CURSOR flight price prediction — LHR-LAX, JFK-NRT…</div></div>
<div class="cmd"><div class="cmd-name"><code>/rship supply [NODE-ID]</code></div><div class="cmd-desc">NEXUS supply chain node — PORT-SHA, HUB-DXB… (omit for overview)</div></div>
<div class="cmd"><div class="cmd-name"><code>/rship ask [QUESTION]</code></div><div class="cmd-desc">Ask the AGENS master AI agent anything</div></div>
<div class="cmd"><div class="cmd-name"><code>/rship help</code></div><div class="cmd-desc">Show this command reference</div></div>

<h2>Endpoints</h2>
<pre>POST /slack/command   → Slash command handler
POST /slack/events    → Events API (app mentions)
POST /slack/actions   → Block Kit interactive actions
GET  /api/status      → Bot health check</pre>

<h2>Setup</h2>
<pre>1. Create Slack app at api.slack.com/apps
2. Add slash command /rship → https://your-worker.workers.dev/slack/command
3. Subscribe to bot_mention events → https://your-worker.workers.dev/slack/events
4. wrangler secret put SLACK_SIGNING_SECRET
5. wrangler secret put SLACK_BOT_TOKEN
6. wrangler deploy</pre>

<footer>© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved</footer>
</body></html>`;
}

// ── Main ───────────────────────────────────────────────────────────────────────
let requestCount = 0, startTime = Date.now();

export default {
  async fetch(request, env) {
    requestCount++;
    const url  = new URL(request.url);
    const path = url.pathname;
    const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS' };

    if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });

    // Slack endpoints
    if (path === '/slack/command' && request.method === 'POST')
      return handleSlashCommand(request, env);
    if (path === '/slack/events' && request.method === 'POST')
      return handleSlackEvent(request, env);
    if (path === '/slack/actions' && request.method === 'POST')
      return handleSlackAction(request, env);

    // Health / status
    if (path === '/api/status')
      return Response.json({
        designation:'RSHIP-BOT-HLD-001', name:'HERALD', type:'SLACK_BOT',
        latin:'heraldus', meaning:'messenger · herald · announcer',
        commands:['/rship status','/rship market','/rship flight','/rship supply','/rship ask','/rship help'],
        endpoints:['/slack/command','/slack/events','/slack/actions'],
        agents:Object.keys(AGENTS), requestCount,
        uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)),
        phi:PHI, alive:true
      }, {headers:cors});

    // Info page
    if (path === '/' && request.method === 'GET')
      return new Response(buildInfoPage(), { headers:{'Content-Type':'text/html;charset=UTF-8',...cors} });

    return Response.json({ error:'NOT_FOUND', path,
      available:['/slack/command','/slack/events','/slack/actions','/api/status','/']
    }, {status:404, headers:cors});
  },
};
