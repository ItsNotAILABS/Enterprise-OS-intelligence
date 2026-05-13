/**
 * IMPERIUM — Enterprise Command Center Bot
 *
 * Designation:  RSHIP-BOT-IMP-001
 * Latin:        imperium (command · authority · empire)
 * Type:         ENTERPRISE CONTROL BOT · Cloudflare Worker
 *
 * IMPERIUM is the command center of the RSHIP Organism.
 * Every critical enterprise function is one Slack command away.
 * You run the entire enterprise from this bot.
 *
 * Slash command: /org [subcommand] [args]
 *   /org brief                    → Full executive morning briefing (all agents + market + supply)
 *   /org agents                   → All 6 RSHIP agents with live status
 *   /org market [SYMBOL]          → Market regime + action + confidence
 *   /org supply                   → Supply chain network overview + disruptions
 *   /org deploy [AGENT-NAME]      → Agent deployment spec + wrangler config
 *   /org alert [HIGH|MED|LOW]     → Recent SENTINEL alerts (optionally filtered by severity)
 *   /org report [market|supply|network] → Trigger PULSE intelligence report
 *   /org speak [#channel] [msg]   → Broadcast message to a Slack channel as the bot
 *   /org ping                     → Instant RSHIP network ping — all agents respond
 *   /org help                     → Command reference
 *
 * Routes:
 *   POST /slack/command     → Slash command handler
 *   POST /slack/events      → Events API (app_mention)
 *   GET  /api/status        → Bot health
 *   GET  /                  → Info page
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI      = 1.618033988749895;
const VERSION  = '1.0.0';

const AGENTS = {
  CEREBRUM : 'https://cerebrum.rship.workers.dev',
  ANIMUS   : 'https://animus.rship.workers.dev',
  NEXUS    : 'https://nexus.rship.workers.dev',
  VIGIL    : 'https://vigil.rship.workers.dev',
  CURSOR   : 'https://cursor.rship.workers.dev',
  AGENS    : 'https://agens.rship.workers.dev',
};

const BOTS = {
  HERALD   : 'https://rship-herald.workers.dev',
  CONDUIT  : 'https://rship-conduit.workers.dev',
  PULSE    : 'https://rship-pulse.workers.dev',
  SENTINEL : 'https://rship-sentinel.workers.dev',
  NUNTIUS  : 'https://rship-nuntius.workers.dev',
};

// ── Slack signature verification ───────────────────────────────────────────────
async function verifySlack(request, rawBody, secret) {
  if (!secret) return true;
  const ts  = request.headers.get('x-slack-request-timestamp') || '0';
  const sig = request.headers.get('x-slack-signature') || '';
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name:'HMAC', hash:'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`v0:${ts}:${rawBody}`));
  const hex = 'v0=' + [...new Uint8Array(mac)].map(b=>b.toString(16).padStart(2,'0')).join('');
  return hex === sig;
}

function parseBody(raw) {
  const p = {};
  for (const pair of raw.split('&')) {
    const [k,v] = pair.split('=').map(decodeURIComponent);
    p[k.replace(/\+/g,' ')] = (v||'').replace(/\+/g,' ');
  }
  return p;
}

// ── Fetch helpers ──────────────────────────────────────────────────────────────
async function get(url) {
  try {
    const r = await fetch(url, { signal:AbortSignal.timeout(5000) });
    return await r.json();
  } catch(e) { return { error:String(e.message), unreachable:true }; }
}
async function post(url, body) {
  try {
    const r = await fetch(url, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body), signal:AbortSignal.timeout(5000),
    });
    return await r.json();
  } catch(e) { return { error:String(e.message), unreachable:true }; }
}

// ── Post message to Slack channel (bot token) ──────────────────────────────────
async function slackPost(token, channel, payload) {
  if (!token || !channel) return { ok:false, error:'NO_TOKEN_OR_CHANNEL' };
  try {
    const r = await fetch('https://slack.com/api/chat.postMessage', {
      method:'POST', headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' },
      body:JSON.stringify({ channel, ...payload }),
      signal:AbortSignal.timeout(5000),
    });
    return await r.json();
  } catch(e) { return { ok:false, error:String(e.message) }; }
}

// ── Block Kit helpers ──────────────────────────────────────────────────────────
const mkH  = t => ({ type:'header', text:{type:'plain_text', text:t, emoji:true} });
const mkS  = t => ({ type:'section', text:{type:'mrkdwn', text:t} });
const mkD  = ()=> ({ type:'divider' });
const mkF  = fs => ({ type:'section', fields:fs.map(f=>({type:'mrkdwn',text:f})) });
const mkCx = els => ({ type:'context', elements:els.map(t=>({type:'mrkdwn',text:t})) });

// ── Commands ───────────────────────────────────────────────────────────────────

// /org brief — Full executive morning briefing
async function cmdBrief() {
  const [health, vigil, nexus, nexusDist, catalog] = await Promise.all([
    get(`${AGENTS.CEREBRUM}/api/health`),
    get(`${AGENTS.VIGIL}/api/market/regime`),
    get(`${AGENTS.NEXUS}/api/nodes`),
    get(`${AGENTS.NEXUS}/api/disruption/active`),
    get(`${AGENTS.AGENS}/api/catalog`),
  ]);

  const ts        = new Date().toUTCString();
  const agents    = health.agents || [];
  const emergence = health.cerebrum?.emergence ?? '—';
  const beat      = health.beat ?? '—';

  const vigilInst   = vigil.instruments || [];
  const chaotic     = vigilInst.filter(i=>i.regime==='CHAOTIC');
  const stable      = vigilInst.filter(i=>i.regime==='STABLE');
  const netRegime   = vigil.networkRegime || 'UNKNOWN';
  const regEmoji    = netRegime==='CHAOTIC'?'🔴':netRegime==='STABLE'?'🟢':'🟡';

  const nodeList  = nexus.nodes || [];
  const distList  = nexusDist.active || [];
  const avgCap    = nodeList.length ? Math.round(nodeList.reduce((s,n)=>s+n.capacity,0)/nodeList.length*100) : 0;
  const kuRStr    = nexus.kuramotoR !== undefined ? nexus.kuramotoR : '—';

  const agentList = catalog.catalog || catalog.agents || [];

  const bestSignal = [...vigilInst].sort((a,b)=>(b.confidence||0)-(a.confidence||0))[0];

  return { blocks:[
    mkH(`☀ RSHIP ENTERPRISE BRIEFING — ${ts}`),
    mkD(),

    mkH('◎ RSHIP Organism'),
    mkF([
      `*Emergence*\n${emergence}`,
      `*Heartbeat*\n${beat}`,
      `*Agents Online*\n${agents.length} / 6`,
      `*φ*\n${PHI.toFixed(4)}`,
    ]),

    mkD(),
    mkH(`${regEmoji} Market Intelligence (VIGIL)`),
    mkF([
      `*Network Regime*\n${regEmoji} ${netRegime}`,
      `*Chaotic*\n🔴 ${chaotic.length} — ${chaotic.map(i=>i.symbol).join(', ')||'none'}`,
      `*Stable*\n🟢 ${stable.length}`,
      `*Best Signal*\n${bestSignal ? `${bestSignal.symbol} \`${bestSignal.action}\` (${Math.round((bestSignal.confidence||0)*100)}%)` : '—'}`,
    ]),

    mkD(),
    mkH('⬡ Supply Chain (NEXUS)'),
    mkF([
      `*Kuramoto R*\n${kuRStr}`,
      `*Nodes*\n${nodeList.length}`,
      `*Avg Capacity*\n${avgCap}%`,
      `*Active Disruptions*\n${distList.length > 0 ? `🚨 ${distList.length}` : '✅ 0'}`,
    ]),
    distList.length > 0 ? mkS(distList.map(d=>`⚠ \`${d.id}\` — ${d.type} at ${d.nodeId} (${d.severity})`).join('\n')) : mkS('✅ No active disruptions.'),

    mkD(),
    mkCx([
      `IMPERIUM · RSHIP-BOT-IMP-001`,
      `φ = ${PHI} · ${ts}`,
      `Agents: ${agents.map(a=>a.name||a).join(' · ')||'—'}`,
    ]),
  ]};
}

// /org agents — All agents with live status
async function cmdAgents() {
  const health = await get(`${AGENTS.CEREBRUM}/api/health`);
  const agents = health.agents || [];
  const emergence = health.cerebrum?.emergence ?? '—';

  const rows = agents.map(a => {
    const name = a.name || String(a);
    const url  = a.url  || AGENTS[name] || '—';
    const status = a.status || '—';
    return `*${name}* · \`${url}\`\n${status}`;
  });

  // Fallback: show known agents if cerebrum unreachable
  const agentLines = rows.length > 0 ? rows : Object.entries(AGENTS).map(([k,v]) =>
    `*${k}* · \`${v}\``
  );

  return { blocks:[
    mkH('◎ RSHIP Agent Fleet'),
    mkF([
      `*Emergence Level*\n${emergence}`,
      `*Agents Online*\n${agents.length || '—'} / 6`,
      `*Beat*\n${health.beat || '—'}`,
      `*φ*\n${PHI.toFixed(4)}`,
    ]),
    mkD(),
    ...agentLines.map(l => mkS(l)),
    mkD(),
    mkCx([`IMPERIUM · RSHIP-BOT-IMP-001`, `CEREBRUM · RSHIP-AIS-CB-001`]),
  ]};
}

// /org market [symbol]
async function cmdMarket(symbol = 'SPY') {
  const sym  = symbol.toUpperCase().slice(0,10);
  const data = await post(`${AGENTS.VIGIL}/api/market/predict`, { symbol:sym });
  if (data.error || data.unreachable) return { blocks:[mkH(`⚠ VIGIL Unreachable`), mkS(data.error||'timeout')] };

  const a          = data.analysis || data;
  const regime     = a.regime || '—';
  const action     = a.action || '—';
  const conf       = a.confidence ? Math.round(a.confidence*100) : 0;
  const confBar    = '█'.repeat(Math.round(conf/10)) + '░'.repeat(10-Math.round(conf/10));
  const regEmoji   = regime==='CHAOTIC'?'🔴':regime==='STABLE'?'🟢':'🟡';
  const actEmoji   = action==='BUY_NOW'?'🚀':action==='WAIT_FOR_DIP'?'⬇️':action==='BOOK_SOON'?'⏰':'👀';

  return { blocks:[
    mkH(`◉ ${sym} — Market Intelligence`),
    mkF([
      `*Regime*\n${regEmoji} ${regime}`,
      `*Action*\n${actEmoji} \`${action}\``,
      `*Lyapunov λ*\n\`${a.lyapunov||'—'}\``,
      `*Ising Demand*\n\`${a.isingOrder||a.isingDemand||'—'}\``,
      `*5d Change*\n${a.change5d !== undefined ? (a.change5d>=0?'+':'')+a.change5d+'%' : '—'}`,
      `*Confidence*\n${conf}%`,
    ]),
    mkS(`\`${confBar}\` *${conf}%* confidence`),
    mkCx([`◉ VIGIL · RSHIP-AIS-VG-001`, 'Lyapunov exponent · Ising demand field']),
  ]};
}

// /org supply
async function cmdSupply() {
  const [nodes, disruptions] = await Promise.all([
    get(`${AGENTS.NEXUS}/api/nodes`),
    get(`${AGENTS.NEXUS}/api/disruption/active`),
  ]);
  const nodeList = nodes.nodes || [];
  const distList = disruptions.active || [];
  const avgCap   = nodeList.length ? Math.round(nodeList.reduce((s,n)=>s+n.capacity,0)/nodeList.length*100) : 0;
  const lowCap   = nodeList.filter(n=>n.capacity<0.6);

  const nodeLines = nodeList.slice(0,8).map(n => {
    const pct = Math.round(n.capacity*100);
    const e = pct>75?'🟢':pct>50?'🟡':'🔴';
    return `${e} \`${n.id}\` — ${n.name} · ${pct}%`;
  });

  return { blocks:[
    mkH('⬡ Supply Chain Network (NEXUS)'),
    mkF([
      `*Kuramoto R*\n${nodes.kuramotoR ?? '—'}`,
      `*Synced*\n${nodes.synced ? '✅ YES' : '⏳ EMERGING'}`,
      `*Nodes*\n${nodeList.length}`,
      `*Avg Capacity*\n${avgCap}%`,
      `*Low-Cap Nodes*\n${lowCap.length > 0 ? `🔴 ${lowCap.length}` : '✅ 0'}`,
      `*Disruptions*\n${distList.length > 0 ? `🚨 ${distList.length}` : '✅ 0'}`,
    ]),
    mkD(),
    mkS(nodeLines.join('\n') + (nodeList.length > 8 ? `\n_…and ${nodeList.length-8} more nodes_` : '')),
    distList.length > 0 ? mkS('*Active Disruptions*\n' + distList.map(d=>`🚨 \`${d.id}\` ${d.type} @ ${d.nodeId} — ${d.severity}`).join('\n')) : mkS('✅ No active disruptions'),
    mkCx([`⬡ NEXUS · RSHIP-AIS-NX-001`]),
  ]};
}

// /org deploy [agent-name]
async function cmdDeploy(agentName) {
  if (!agentName) return { blocks:[
    mkH('⬡ AGENS — Deploy an Agent'),
    mkS('Usage: `/org deploy [agent-name]`\n\nAvailable agents:\n' + Object.keys(AGENTS).map(a=>`• \`${a}\``).join('\n')),
    mkCx([`⬡ AGENS · RSHIP-AIS-AG-001`]),
  ]};

  const data = await post(`${AGENTS.AGENS}/api/agents/deploy`, { agentName });
  if (data.error || data.unreachable) return { blocks:[mkH(`⚠ AGENS Unreachable`), mkS(data.error||'timeout')] };

  const spec = data.spec || data.deployment || data;
  const specStr = JSON.stringify(spec, null, 2).slice(0, 1500);

  return { blocks:[
    mkH(`⬡ AGENS — Deploy: ${agentName.toUpperCase()}`),
    mkS(data.message || `Deployment spec generated for **${agentName}**.`),
    mkS('```\n' + specStr + '\n```'),
    mkCx([`⬡ AGENS · RSHIP-AIS-AG-001`, `Deployment ID: ${data.deploymentId || '—'}`]),
  ]};
}

// /org alert [HIGH|MED|LOW]
async function cmdAlert(severity) {
  const data = await get(`${BOTS.SENTINEL}/api/alerts/history`);
  if (data.error || data.unreachable) return { blocks:[mkH(`⚠ SENTINEL Unreachable`), mkS(data.error||'timeout')] };

  let alerts = data.alerts || [];
  if (severity) {
    const s = severity.toUpperCase();
    alerts = alerts.filter(a => a.severity === s || (s==='MED' && a.severity==='MEDIUM'));
  }
  const recent = alerts.slice(0, 5);

  if (!recent.length) return { blocks:[
    mkH('◉ SENTINEL — Alert History'),
    mkS(severity ? `No *${severity.toUpperCase()}* severity alerts in recent history.` : 'No recent alerts. Network is calm. ✅'),
    mkCx([`◉ SENTINEL · RSHIP-BOT-SNT-001`]),
  ]};

  const alertLines = recent.map(a => {
    const sevEmoji = a.severity==='HIGH'?'🔴':a.severity==='MEDIUM'?'🟡':'🟢';
    return `${sevEmoji} *${a.title}* — ${a.firedAt}\n${String(a.details||'').slice(0,120)}`;
  });

  return { blocks:[
    mkH(`◉ SENTINEL — Recent Alerts (${recent.length})`),
    mkS(alertLines.join('\n\n')),
    mkF([
      `*Total Fired*\n${data.totalFired || 0}`,
      `*Showing*\n${recent.length} most recent`,
    ]),
    mkCx([`◉ SENTINEL · RSHIP-BOT-SNT-001`]),
  ]};
}

// /org report [market|supply|network]
async function cmdReport(type = 'market') {
  const t    = ['market','supply','network'].includes(type.toLowerCase()) ? type.toLowerCase() : 'market';
  const data = await post(`${BOTS.PULSE}/report/trigger`, { type:t });
  if (data.error || data.unreachable) return { blocks:[mkH(`⚠ PULSE Unreachable`), mkS(data.error||'timeout')] };

  const report = data.report || {};
  const summary = String(report.summary || 'Report generated.').slice(0, 2500);

  return { blocks:[
    mkH(`◉ PULSE — ${t.toUpperCase()} REPORT`),
    mkS(summary),
    mkCx([`◉ PULSE · RSHIP-BOT-PLS-001`, `Generated: ${new Date(report.generatedAt||Date.now()).toUTCString()}`]),
  ]};
}

// /org speak [#channel-or-id] [message]
async function cmdSpeak(args, env) {
  const parts = (args || '').trim().split(/\s+/);
  let channel, message;
  if (parts[0] && (parts[0].startsWith('#') || parts[0].startsWith('C'))) {
    channel = parts[0].replace('#','');
    message = parts.slice(1).join(' ');
  } else {
    channel = env.IMPERIUM_OPS_CHANNEL || '';
    message = args;
  }
  if (!message) return { blocks:[mkH('⬡ IMPERIUM — Speak'), mkS('Usage: `/org speak [#channel] [your message]`')] };
  if (!channel) return { blocks:[mkH('⬡ IMPERIUM — Speak'), mkS('No channel specified and `IMPERIUM_OPS_CHANNEL` not set. Usage: `/org speak #rship-ops your message`')] };

  const posted = await slackPost(env.SLACK_BOT_TOKEN, channel, {
    text: message,
    blocks:[
      mkS(message),
      mkCx([`◎ RSHIP Organism · IMPERIUM · ${new Date().toUTCString()}`]),
    ],
  });

  return { blocks:[
    mkH('◎ IMPERIUM — Message Sent'),
    mkS(posted.ok ? `✅ Posted to \`${channel}\`:\n> ${message}` : `❌ Failed: ${posted.error}`),
    mkCx([`IMPERIUM · RSHIP-BOT-IMP-001`]),
  ]};
}

// /org ping — fast pulse of all agents
async function cmdPing() {
  const start = Date.now();
  const results = await Promise.all(
    Object.entries(AGENTS).map(async ([name, url]) => {
      const t0 = Date.now();
      const d  = await get(`${url}/api/status`);
      const ms = Date.now() - t0;
      return { name, url, ms, alive:!d.unreachable && !d.error };
    })
  );
  const total = Date.now() - start;
  const alive = results.filter(r=>r.alive).length;

  const lines = results.map(r =>
    `${r.alive?'🟢':'🔴'} *${r.name}* — ${r.ms}ms`
  );

  return { blocks:[
    mkH(`◎ RSHIP Network Ping — ${alive}/6 alive`),
    mkS(lines.join('\n')),
    mkF([
      `*Total Scan Time*\n${total}ms`,
      `*Alive*\n${alive} / ${results.length}`,
      `*φ*\n${PHI.toFixed(4)}`,
    ]),
    mkCx([`IMPERIUM · RSHIP-BOT-IMP-001`, `Scanned at ${new Date().toUTCString()}`]),
  ]};
}

function cmdHelp() {
  return { blocks:[
    mkH('◎ IMPERIUM — Enterprise Command Center'),
    mkS('*Run your entire RSHIP Organism from Slack.*'),
    mkD(),
    mkS([
      '`/org brief`                    — Full executive briefing: organism + market + supply',
      '`/org agents`                   — All 6 RSHIP agents with live status',
      '`/org ping`                     — Instant network ping — all agents',
      '`/org market [SYMBOL]`          — VIGIL market regime + action (default: SPY)',
      '`/org supply`                   — NEXUS supply chain + disruptions',
      '`/org deploy [AGENT-NAME]`      — Deployment spec for any RSHIP agent',
      '`/org alert [HIGH|MED|LOW]`     — SENTINEL recent alerts (optionally filtered)',
      '`/org report [market|supply|network]` — Trigger PULSE intelligence report',
      '`/org speak [#channel] [msg]`   — Broadcast a message to a Slack channel',
      '`/org help`                     — This reference',
    ].join('\n')),
    mkD(),
    mkCx([
      'IMPERIUM · RSHIP-BOT-IMP-001',
      '6 AI Agents · 5 Bot Workers · 1 Organism',
      `φ = ${PHI}`,
    ]),
  ]};
}

// ── Route command ──────────────────────────────────────────────────────────────
async function routeCommand(text, env) {
  const [sub, ...rest] = (text || '').trim().split(/\s+/);
  const arg = rest.join(' ').trim();
  switch((sub||'brief').toLowerCase()) {
    case 'brief':  return cmdBrief();
    case 'agents': return cmdAgents();
    case 'ping':   return cmdPing();
    case 'market': return cmdMarket(arg || 'SPY');
    case 'supply': return cmdSupply();
    case 'deploy': return cmdDeploy(arg);
    case 'alert':  return cmdAlert(arg);
    case 'report': return cmdReport(arg || 'market');
    case 'speak':  return cmdSpeak(arg, env);
    case 'help':   return cmdHelp();
    default:       return cmdHelp();
  }
}

// ── Slash command handler ──────────────────────────────────────────────────────
async function handleCommand(request, env) {
  const raw   = await request.text();
  const valid = await verifySlack(request, raw, env.SLACK_SIGNING_SECRET);
  if (!valid) return new Response('Unauthorized', { status:401 });
  const params  = parseBody(raw);
  const payload = await routeCommand(params.text || '', env);
  return Response.json({ response_type:'in_channel', ...payload });
}

// ── Events API handler ─────────────────────────────────────────────────────────
async function handleEvents(request, env) {
  const raw   = await request.text();
  const valid = await verifySlack(request, raw, env.SLACK_SIGNING_SECRET);
  if (!valid) return new Response('Unauthorized', { status:401 });
  const body  = JSON.parse(raw);
  if (body.type === 'url_verification') return Response.json({ challenge:body.challenge });
  const event = body.event || {};
  if (event.type === 'app_mention' && event.text) {
    const text    = event.text.replace(/<@[A-Z0-9]+>/,'').trim();
    const payload = await routeCommand(text, env);
    if (env.SLACK_BOT_TOKEN && event.channel) {
      fetch('https://slack.com/api/chat.postMessage', {
        method:'POST',
        headers:{'Authorization':`Bearer ${env.SLACK_BOT_TOKEN}`,'Content-Type':'application/json'},
        body:JSON.stringify({ channel:event.channel, ...payload }),
      });
    }
  }
  return Response.json({ ok:true });
}

// ── Info page ──────────────────────────────────────────────────────────────────
function buildInfoPage() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>IMPERIUM — RSHIP Enterprise Command Bot</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#02050f;color:#c8d8f8;font-family:'Courier New',monospace;padding:48px;max-width:800px;margin:0 auto}
h1{font-size:2.5rem;color:#ffd700;margin-bottom:8px}
.latin{font-size:.9rem;color:#445566;font-style:italic;margin-bottom:32px}
h2{font-size:1rem;color:#8899bb;letter-spacing:.1em;text-transform:uppercase;margin:32px 0 12px}
code{background:#060d1a;border:1px solid #0d2030;padding:2px 8px;border-radius:3px;color:#ffd700;font-size:.82rem}
pre{background:#060d1a;border:1px solid #0d2030;padding:20px;border-radius:6px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin:8px 0 20px}
.cmd{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #060d1a;flex-wrap:wrap}
.cmd-name{min-width:300px;color:#ffd700;font-size:.82rem}
.cmd-desc{color:#667788;font-size:.82rem;line-height:1.5}
footer{margin-top:48px;color:#223344;font-size:.75rem}
</style></head><body>
<h1>◎ IMPERIUM</h1>
<div class="latin">imperium · "command · authority · empire" · RSHIP-BOT-IMP-001</div>
<p style="color:#667788;line-height:1.7;font-size:.88rem">The enterprise command center. Control the entire RSHIP Organism from a single Slack slash command. Every critical enterprise function is one command away.</p>

<h2>Commands</h2>
<div class="cmd"><div class="cmd-name"><code>/org brief</code></div><div class="cmd-desc">Full executive morning briefing — organism + market + supply chain</div></div>
<div class="cmd"><div class="cmd-name"><code>/org agents</code></div><div class="cmd-desc">All 6 RSHIP agents with live status and emergence level</div></div>
<div class="cmd"><div class="cmd-name"><code>/org ping</code></div><div class="cmd-desc">Instant network ping — all agents respond with latency</div></div>
<div class="cmd"><div class="cmd-name"><code>/org market [SYMBOL]</code></div><div class="cmd-desc">VIGIL market regime + action + Lyapunov + confidence</div></div>
<div class="cmd"><div class="cmd-name"><code>/org supply</code></div><div class="cmd-desc">NEXUS supply chain network + all disruptions</div></div>
<div class="cmd"><div class="cmd-name"><code>/org deploy [AGENT-NAME]</code></div><div class="cmd-desc">AGENS deployment spec for any RSHIP agent</div></div>
<div class="cmd"><div class="cmd-name"><code>/org alert [HIGH|MED|LOW]</code></div><div class="cmd-desc">SENTINEL recent alerts, optionally filtered by severity</div></div>
<div class="cmd"><div class="cmd-name"><code>/org report [market|supply|network]</code></div><div class="cmd-desc">Trigger PULSE intelligence report on demand</div></div>
<div class="cmd"><div class="cmd-name"><code>/org speak [#channel] [msg]</code></div><div class="cmd-desc">Broadcast a message to any Slack channel as the RSHIP bot</div></div>

<h2>Endpoints</h2>
<pre>POST /slack/command   → /org slash command
POST /slack/events    → Events API (app_mention)
GET  /api/status      → Bot health</pre>

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

    if (request.method === 'OPTIONS') return new Response(null, {status:204,headers:cors});
    if (path === '/slack/command' && request.method === 'POST') return handleCommand(request, env);
    if (path === '/slack/events'  && request.method === 'POST') return handleEvents(request, env);
    if (path === '/api/status')
      return Response.json({
        designation:'RSHIP-BOT-IMP-001', name:'IMPERIUM', type:'ENTERPRISE_CONTROL_BOT',
        latin:'imperium', meaning:'command · authority · empire',
        commands:['/org brief','/org agents','/org ping','/org market','/org supply','/org deploy','/org alert','/org report','/org speak','/org help'],
        agents:Object.keys(AGENTS), bots:Object.keys(BOTS),
        requestCount, uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)),
        phi:PHI, alive:true
      }, {headers:cors});
    if (path === '/')
      return new Response(buildInfoPage(), {headers:{'Content-Type':'text/html;charset=UTF-8',...cors}});
    return Response.json({ error:'NOT_FOUND', path,
      available:['/slack/command','/slack/events','/api/status','/']
    }, {status:404, headers:cors});
  },
};
