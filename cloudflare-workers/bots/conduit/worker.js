/**
 * CONDUIT — Workflow Message Bus & Webhook Router
 *
 * Designation:  RSHIP-BOT-CDT-001
 * Latin:        conduit (channel · pipe · connector)
 * Type:         WORKFLOW BOT · MESSAGE BUS · Cloudflare Worker
 *
 * CONDUIT is the intelligence plumbing layer of the RSHIP ecosystem.
 * It receives events, routes them to RSHIP agents, aggregates responses,
 * and delivers results to Slack, Discord, or any webhook destination.
 *
 * Use cases:
 *   • Route CI/CD alerts → VIGIL for market context → Slack
 *   • Pipe new order events → NEXUS for supply routing → webhook
 *   • Broadcast status updates to multiple destinations at once
 *   • Build no-code workflows between RSHIP agents and external systems
 *
 * Routes:
 *   POST /route              → Send event to one RSHIP agent, deliver to destination
 *   POST /broadcast          → Fan out event to multiple agents, aggregate responses
 *   POST /pipe               → Chain: event → agent A → agent B → destination
 *   POST /deliver/slack      → Format any payload as Slack message, send to webhook
 *   POST /deliver/discord    → Format any payload as Discord embed, send to webhook
 *   GET  /routes/list        → List all built-in RSHIP agent endpoints
 *   GET  /api/status         → Bot health
 *   GET  /                   → Info page
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI          = 1.618033988749895;
const PHI_INV      = 0.618033988749895;
const HEARTBEAT_MS = 873;
const VERSION      = '1.0.0';

// ── RSHIP Agent Route Registry ─────────────────────────────────────────────────
const ROUTES = {
  'cerebrum.status'      : { url:'https://cerebrum.rship.workers.dev/api/status',       method:'GET' },
  'cerebrum.agents'      : { url:'https://cerebrum.rship.workers.dev/api/agents',        method:'GET' },
  'cerebrum.health'      : { url:'https://cerebrum.rship.workers.dev/api/health',        method:'GET' },
  'vigil.predict'        : { url:'https://vigil.rship.workers.dev/api/market/predict',   method:'POST', bodyKey:'symbol' },
  'vigil.regime'         : { url:'https://vigil.rship.workers.dev/api/market/regime',    method:'GET' },
  'vigil.portfolio'      : { url:'https://vigil.rship.workers.dev/api/portfolio/analyze',method:'POST' },
  'nexus.nodes'          : { url:'https://nexus.rship.workers.dev/api/nodes',            method:'GET' },
  'nexus.route'          : { url:'https://nexus.rship.workers.dev/api/route/optimize',   method:'POST' },
  'nexus.disruptions'    : { url:'https://nexus.rship.workers.dev/api/disruption/active',method:'GET' },
  'nexus.report'         : { url:'https://nexus.rship.workers.dev/api/disruption/report',method:'POST' },
  'cursor.predict'       : { url:'https://cursor.rship.workers.dev/api/flight/predict',  method:'POST', bodyKey:'route' },
  'cursor.crises'        : { url:'https://cursor.rship.workers.dev/api/crisis/active',   method:'GET' },
  'cursor.chat'          : { url:'https://cursor.rship.workers.dev/api/agent/chat',      method:'POST' },
  'animus.status'        : { url:'https://animus.rship.workers.dev/api/status',          method:'GET' },
  'animus.chat'          : { url:'https://animus.rship.workers.dev/api/agent/chat',      method:'POST' },
  'animus.dock'          : { url:'https://animus.rship.workers.dev/api/intelligence/dock',method:'POST' },
  'agens.catalog'        : { url:'https://agens.rship.workers.dev/api/catalog',          method:'GET' },
  'agens.chat'           : { url:'https://agens.rship.workers.dev/api/agent/chat',       method:'POST' },
  'agens.deploy'         : { url:'https://agens.rship.workers.dev/api/agents/deploy',    method:'POST' },
};

// ── Auth ───────────────────────────────────────────────────────────────────────
function isAuthorized(request, env) {
  if (!env.CONDUIT_AUTH_TOKEN) return true; // open in dev
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.CONDUIT_AUTH_TOKEN}`;
}

// ── Fetch agent route ──────────────────────────────────────────────────────────
async function callRoute(routeKey, payload = {}) {
  const route = ROUTES[routeKey];
  if (!route) return { error:`UNKNOWN_ROUTE: ${routeKey}`, available:Object.keys(ROUTES) };
  try {
    const options = { signal:AbortSignal.timeout(5000) };
    if (route.method === 'POST') {
      options.method  = 'POST';
      options.headers = { 'Content-Type':'application/json' };
      options.body    = JSON.stringify(payload);
    }
    const resp = await fetch(route.url, options);
    const data = await resp.json();
    return { route:routeKey, url:route.url, success:true, data };
  } catch(e) {
    return { route:routeKey, url:route.url, success:false, error:String(e.message) };
  }
}

// ── Slack delivery ─────────────────────────────────────────────────────────────
async function deliverSlack(webhookUrl, result) {
  if (!webhookUrl) return { delivered:false, reason:'NO_WEBHOOK_URL' };
  const text = typeof result === 'string' ? result : [
    `*Route:* \`${result.route||'—'}\``,
    `*Success:* ${result.success ? '✅' : '❌'}`,
    '```' + JSON.stringify(result.data || result.error, null, 2).slice(0, 2000) + '```',
  ].join('\n');
  try {
    const r = await fetch(webhookUrl, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text, username:'CONDUIT · RSHIP', icon_emoji:':satellite:' }),
      signal: AbortSignal.timeout(4000),
    });
    return { delivered:true, status:r.status };
  } catch(e) { return { delivered:false, error:String(e.message) }; }
}

// ── Discord delivery ───────────────────────────────────────────────────────────
async function deliverDiscord(webhookUrl, result) {
  if (!webhookUrl) return { delivered:false, reason:'NO_WEBHOOK_URL' };
  const description = typeof result === 'string' ? result :
    ('```json\n' + JSON.stringify(result.data || result.error, null, 2).slice(0, 1900) + '\n```');
  const color = result.success === false ? 0xff4455 : 0x00ff88;
  const embed = {
    title: `⬡ CONDUIT — \`${result.route || 'result'}\``,
    description, color,
    footer: { text:'RSHIP-BOT-CDT-001 · CONDUIT' },
    timestamp: new Date().toISOString(),
  };
  try {
    const r = await fetch(webhookUrl, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username:'CONDUIT · RSHIP', embeds:[embed] }),
      signal: AbortSignal.timeout(4000),
    });
    return { delivered:true, status:r.status };
  } catch(e) { return { delivered:false, error:String(e.message) }; }
}

// ── /route handler ─────────────────────────────────────────────────────────────
async function handleRoute(request, env) {
  let body = {}; try { body = await request.json(); } catch {}
  const { route, payload={}, destination, webhookUrl } = body;
  if (!route) return Response.json({ error:'MISSING_FIELD: route' }, {status:400});

  const result = await callRoute(route, payload);

  // Optional delivery
  let delivery = null;
  const destUrl = webhookUrl || '';
  if (destination === 'slack') {
    delivery = await deliverSlack(destUrl || env.SLACK_WEBHOOK_URL, result);
  } else if (destination === 'discord') {
    delivery = await deliverDiscord(destUrl || env.DISCORD_WEBHOOK_URL, result);
  }

  return Response.json({ ...result, delivery });
}

// ── /broadcast handler ────────────────────────────────────────────────────────
async function handleBroadcast(request, env) {
  let body = {}; try { body = await request.json(); } catch {}
  const { routes=[], payload={}, destination, webhookUrl } = body;
  if (!routes.length) return Response.json({ error:'MISSING_FIELD: routes (array)' }, {status:400});

  const results = await Promise.all(routes.map(r => callRoute(r, payload)));

  // Aggregate delivery
  let delivery = null;
  const destUrl = webhookUrl || '';
  if (destination === 'slack') {
    const summary = results.map(r =>
      `${r.success ? '✅' : '❌'} \`${r.route}\` — ${r.success ? 'OK' : r.error}`
    ).join('\n');
    delivery = await deliverSlack(destUrl || env.SLACK_WEBHOOK_URL, summary);
  } else if (destination === 'discord') {
    const summary = results.map(r =>
      `${r.success ? '✅' : '❌'} \`${r.route}\` — ${r.success ? 'OK' : r.error}`
    ).join('\n');
    delivery = await deliverDiscord(destUrl || env.DISCORD_WEBHOOK_URL, { route:'broadcast', success:true, data:summary });
  }

  return Response.json({
    broadcast:true, routeCount:routes.length, results,
    successCount:results.filter(r=>r.success).length,
    delivery
  });
}

// ── /pipe handler — chain A → B → destination ─────────────────────────────────
async function handlePipe(request, env) {
  let body = {}; try { body = await request.json(); } catch {}
  const { pipeline=[], initialPayload={}, destination, webhookUrl } = body;
  if (!pipeline.length) return Response.json({ error:'MISSING_FIELD: pipeline (array of route names)' }, {status:400});

  const steps = [];
  let currentPayload = initialPayload;

  for (const routeKey of pipeline) {
    const result = await callRoute(routeKey, currentPayload);
    steps.push(result);
    if (!result.success) break; // abort pipeline on failure
    // Pass output data as next step's payload
    currentPayload = result.data || {};
  }

  const finalResult = steps[steps.length - 1] || {};
  let delivery = null;
  const destUrl = webhookUrl || '';
  if (destination === 'slack') delivery = await deliverSlack(destUrl || env.SLACK_WEBHOOK_URL, finalResult);
  else if (destination === 'discord') delivery = await deliverDiscord(destUrl || env.DISCORD_WEBHOOK_URL, finalResult);

  return Response.json({ pipeline:true, steps, finalResult, delivery });
}

// ── /deliver endpoints ─────────────────────────────────────────────────────────
async function handleDeliverSlack(request, env) {
  let body = {}; try { body = await request.json(); } catch {}
  const { text, webhookUrl } = body;
  const delivery = await deliverSlack(webhookUrl || env.SLACK_WEBHOOK_URL, text || JSON.stringify(body));
  return Response.json(delivery);
}

async function handleDeliverDiscord(request, env) {
  let body = {}; try { body = await request.json(); } catch {}
  const { text, webhookUrl } = body;
  const delivery = await deliverDiscord(webhookUrl || env.DISCORD_WEBHOOK_URL,
    { route:'deliver', success:true, data:text || body });
  return Response.json(delivery);
}

// ── Info page ──────────────────────────────────────────────────────────────────
function buildInfoPage() {
  const routeList = Object.entries(ROUTES).map(([k,v]) =>
    `<div class="route"><code>${k}</code><span class="method ${v.method}">${v.method}</span><span class="url">${v.url}</span></div>`
  ).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>CONDUIT — RSHIP Workflow Bot</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#02050f;color:#c8d8f8;font-family:'Courier New',monospace;padding:48px;max-width:900px;margin:0 auto}
h1{font-size:2.5rem;color:#00ff88;margin-bottom:8px}
.latin{font-size:.9rem;color:#445566;font-style:italic;margin-bottom:32px}
h2{font-size:1rem;color:#8899bb;letter-spacing:.1em;text-transform:uppercase;margin:32px 0 12px}
code{background:#060d1a;border:1px solid #0d2030;padding:2px 8px;border-radius:3px;color:#ffd700;font-size:.82rem}
pre{background:#060d1a;border:1px solid #0d2030;padding:20px;border-radius:6px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin:8px 0 20px}
.route{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #060d1a;flex-wrap:wrap}
.route code{min-width:220px}
.method{font-size:.65rem;padding:2px 6px;border-radius:2px;font-weight:bold}
.method.GET{color:#00ff88;background:#00ff8814}
.method.POST{color:#ffd700;background:#ffd70014}
.url{font-size:.72rem;color:#334455}
footer{margin-top:48px;color:#223344;font-size:.75rem}
</style></head><body>
<h1>⬡ CONDUIT</h1>
<div class="latin">conduit · "channel · pipe · connector" · RSHIP-BOT-CDT-001</div>
<p style="color:#667788;line-height:1.7;font-size:.88rem">The intelligence plumbing layer. Routes events between any external system and any RSHIP agent. Broadcasts to multiple agents, chains pipelines, delivers to Slack or Discord.</p>

<h2>Endpoints</h2>
<pre>POST /route           → Call one RSHIP agent route, optionally deliver result
POST /broadcast       → Call multiple routes in parallel, aggregate results
POST /pipe            → Chain routes sequentially (output of A becomes input of B)
POST /deliver/slack   → Send any payload to a Slack webhook
POST /deliver/discord → Send any payload to a Discord webhook
GET  /routes/list     → List all ${Object.keys(ROUTES).length} registered RSHIP routes
GET  /api/status      → Bot health</pre>

<h2>Quick Example</h2>
<pre>// Route: call VIGIL market predict, deliver to Slack
POST /route
{
  "route": "vigil.predict",
  "payload": { "symbol": "SPY" },
  "destination": "slack",
  "webhookUrl": "https://hooks.slack.com/services/..."
}

// Broadcast: check network health across 3 agents simultaneously
POST /broadcast
{
  "routes": ["cerebrum.health", "nexus.nodes", "cursor.crises"],
  "destination": "discord"
}

// Pipeline: route optimize → deliver to Slack
POST /pipe
{
  "pipeline": ["nexus.nodes", "nexus.route"],
  "initialPayload": { "origin": "PORT-SHA", "destinations": ["PORT-RTM"] }
}</pre>

<h2>All ${Object.keys(ROUTES).length} RSHIP Routes</h2>
${routeList}

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
    const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization' };

    if (request.method === 'OPTIONS') return new Response(null, {status:204,headers:cors});

    // Auth check for mutation endpoints
    const mutationPaths = ['/route','/broadcast','/pipe','/deliver/slack','/deliver/discord'];
    if (mutationPaths.includes(path) && !isAuthorized(request, env))
      return Response.json({ error:'UNAUTHORIZED' }, {status:401, headers:cors});

    if (path === '/' && request.method === 'GET')
      return new Response(buildInfoPage(), {headers:{'Content-Type':'text/html;charset=UTF-8',...cors}});

    if (path === '/api/status')
      return Response.json({
        designation:'RSHIP-BOT-CDT-001', name:'CONDUIT', type:'WORKFLOW_BOT',
        latin:'conduit', meaning:'channel · pipe · connector',
        registeredRoutes:Object.keys(ROUTES).length,
        endpoints:['/route','/broadcast','/pipe','/deliver/slack','/deliver/discord','/routes/list'],
        requestCount, uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)),
        phi:PHI, alive:true
      }, {headers:cors});

    if (path === '/routes/list')
      return Response.json({ routes:ROUTES, count:Object.keys(ROUTES).length }, {headers:cors});

    if (path === '/route'           && request.method === 'POST') return handleRoute(request, env);
    if (path === '/broadcast'       && request.method === 'POST') return handleBroadcast(request, env);
    if (path === '/pipe'            && request.method === 'POST') return handlePipe(request, env);
    if (path === '/deliver/slack'   && request.method === 'POST') return handleDeliverSlack(request, env);
    if (path === '/deliver/discord' && request.method === 'POST') return handleDeliverDiscord(request, env);

    return Response.json({ error:'NOT_FOUND', path,
      available:['/','/api/status','/routes/list','/route','/broadcast','/pipe','/deliver/slack','/deliver/discord']
    }, {status:404, headers:cors});
  },
};
