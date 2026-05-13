/**
 * NUNTIUS — Voice of the RSHIP Organism
 *
 * Designation:  RSHIP-BOT-NNT-001
 * Latin:        nuntius (messenger · announcer · news-bearer)
 * Type:         BROADCAST BOT · Cloudflare Scheduled + Fetch Worker
 *
 * NUNTIUS is the public voice of the RSHIP Organism in Slack.
 * It speaks. It announces. It keeps every channel in sync.
 *
 * Automatic broadcasts (Cron Triggers):
 *   09:00 UTC Mon-Fri → Morning enterprise briefing → #rship-ops
 *   17:00 UTC Mon-Fri → End-of-day intelligence summary → #rship-ops
 *
 * Slash command: /announce [#channel] [message]
 *   /announce Today we ship.                   → posts to #rship-ops (default)
 *   /announce #rship-market BTC is STABLE now. → posts to specific channel
 *   /announce all RSHIP Organism is live.       → posts to ALL configured channels
 *
 * Routes:
 *   POST /slack/command        → /announce slash command
 *   POST /slack/events         → Events API
 *   POST /broadcast            → Programmatic broadcast (called by CONDUIT/IMPERIUM)
 *   POST /broadcast/all        → Post to ALL configured channels
 *   POST /broadcast/ops        → Post to #rship-ops
 *   POST /broadcast/market     → Post to #rship-market
 *   POST /broadcast/alerts     → Post to #rship-alerts
 *   POST /broadcast/intel      → Post to #rship-intel
 *   GET  /channels             → List configured channels
 *   GET  /history              → Recent broadcast history
 *   GET  /api/status           → Bot health
 *   GET  /                     → Info page
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI     = 1.618033988749895;
const VERSION = '1.0.0';

const AGENTS = {
  CEREBRUM : 'https://cerebrum.rship.workers.dev',
  VIGIL    : 'https://vigil.rship.workers.dev',
  NEXUS    : 'https://nexus.rship.workers.dev',
};

// ── Broadcast history (in-memory) ──────────────────────────────────────────────
const history = [];
const MAX_HIST = 50;
let broadcastCount = 0, startTime = Date.now();

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

// ── Get configured channels from env ──────────────────────────────────────────
function getChannels(env) {
  return {
    ops    : env.NUNTIUS_OPS_CHANNEL    || '',
    market : env.NUNTIUS_MARKET_CHANNEL || '',
    alerts : env.NUNTIUS_ALERTS_CHANNEL || '',
    intel  : env.NUNTIUS_INTEL_CHANNEL  || '',
  };
}

// ── Post to Slack via bot token ────────────────────────────────────────────────
async function slackPost(token, channel, payload) {
  if (!token)   return { ok:false, error:'NO_SLACK_BOT_TOKEN — run: wrangler secret put SLACK_BOT_TOKEN' };
  if (!channel) return { ok:false, error:'NO_CHANNEL — set the channel ID env var in wrangler secrets' };
  try {
    const r = await fetch('https://slack.com/api/chat.postMessage', {
      method:'POST',
      headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({ channel, ...payload }),
      signal:AbortSignal.timeout(5000),
    });
    return await r.json();
  } catch(e) { return { ok:false, error:String(e.message) }; }
}

// ── Record broadcast ───────────────────────────────────────────────────────────
function record(channel, message, result) {
  broadcastCount++;
  const entry = { ts:Date.now(), channel, message:String(message).slice(0,200), ok:result.ok };
  history.unshift(entry);
  if (history.length > MAX_HIST) history.pop();
  return entry;
}

// ── Fetch helpers ──────────────────────────────────────────────────────────────
async function safeGet(url) {
  try { const r = await fetch(url, {signal:AbortSignal.timeout(4000)}); return await r.json(); }
  catch(e) { return { error:String(e.message), unreachable:true }; }
}
async function safePost(url, body) {
  try {
    const r = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(4000)});
    return await r.json();
  } catch(e) { return { error:String(e.message), unreachable:true }; }
}

// ── Block Kit helpers ──────────────────────────────────────────────────────────
const mkH  = t => ({ type:'header', text:{type:'plain_text', text:t, emoji:true} });
const mkS  = t => ({ type:'section', text:{type:'mrkdwn', text:t} });
const mkD  = ()=> ({ type:'divider' });
const mkF  = fs => ({ type:'section', fields:fs.map(f=>({type:'mrkdwn',text:f})) });
const mkCx = els => ({ type:'context', elements:els.map(t=>({type:'mrkdwn',text:t})) });

// ── Generate morning briefing content ─────────────────────────────────────────
async function generateBriefing(type = 'morning') {
  const [health, vigil, nexus, nexusDist] = await Promise.all([
    safeGet(`${AGENTS.CEREBRUM}/api/health`),
    safeGet(`${AGENTS.VIGIL}/api/market/regime`),
    safeGet(`${AGENTS.NEXUS}/api/nodes`),
    safeGet(`${AGENTS.NEXUS}/api/disruption/active`),
  ]);

  const ts          = new Date().toUTCString();
  const agents      = health.agents || [];
  const emergence   = health.cerebrum?.emergence ?? '—';
  const instruments = vigil.instruments || [];
  const chaotic     = instruments.filter(i=>i.regime==='CHAOTIC');
  const netRegime   = vigil.networkRegime || 'UNKNOWN';
  const regEmoji    = netRegime==='CHAOTIC'?'🔴':netRegime==='STABLE'?'🟢':'🟡';
  const nodeList    = nexus.nodes || [];
  const distList    = nexusDist.active || [];
  const avgCap      = nodeList.length ? Math.round(nodeList.reduce((s,n)=>s+n.capacity,0)/nodeList.length*100) : 0;
  const bestSignal  = [...instruments].sort((a,b)=>(b.confidence||0)-(a.confidence||0))[0];

  const header = type === 'morning'
    ? `☀ RSHIP MORNING BRIEFING — ${ts}`
    : `🌙 RSHIP END-OF-DAY SUMMARY — ${ts}`;

  return {
    blocks:[
      mkH(header),
      mkD(),
      mkF([
        `*Organism Status*\n${agents.length >= 5 ? '✅ OPERATIONAL' : '⚠ DEGRADED'}`,
        `*Emergence*\n${emergence}`,
        `*Agents*\n${agents.length} / 6 online`,
        `*φ*\n${PHI.toFixed(4)}`,
      ]),
      mkD(),
      mkF([
        `*Market Regime*\n${regEmoji} ${netRegime}`,
        `*Chaotic Instruments*\n${chaotic.length > 0 ? '🔴 '+chaotic.map(i=>i.symbol).join(', ') : '✅ None'}`,
        `*Best Signal*\n${bestSignal ? `${bestSignal.symbol} — \`${bestSignal.action}\`` : '—'}`,
        `*Disruptions*\n${distList.length > 0 ? `🚨 ${distList.length} active` : '✅ Clear'}`,
        `*Nodes*\n${nodeList.length} · Avg ${avgCap}%`,
        `*Kuramoto R*\n${nexus.kuramotoR ?? '—'}`,
      ]),
      mkCx([
        'NUNTIUS · RSHIP-BOT-NNT-001',
        `φ = ${PHI} · ${ts}`,
      ]),
    ],
  };
}

// ── /announce handler ──────────────────────────────────────────────────────────
async function handleAnnounce(raw, env) {
  const params = parseBody(raw);
  const text   = (params.text || '').trim();

  if (!text || text === 'help') {
    return Response.json({
      response_type:'ephemeral',
      blocks:[
        mkH('/announce — Broadcast to RSHIP Channels'),
        mkS([
          '`/announce [message]`                → Post to #rship-ops (default)',
          '`/announce #rship-market [message]`  → Post to specific channel',
          '`/announce #rship-alerts [message]`  → Post to alerts channel',
          '`/announce all [message]`            → Post to ALL configured channels',
          '`/announce brief`                    → Post live briefing to #rship-ops',
        ].join('\n')),
        mkCx(['NUNTIUS · RSHIP-BOT-NNT-001']),
      ]
    });
  }

  const ch       = getChannels(env);
  const token    = env.SLACK_BOT_TOKEN;
  const ts       = new Date().toUTCString();

  // /announce brief → post live briefing
  if (text.toLowerCase() === 'brief') {
    const briefing = await generateBriefing('morning');
    const result   = await slackPost(token, ch.ops, briefing);
    record(ch.ops, '[BRIEFING]', result);
    return Response.json({
      response_type:'ephemeral',
      text: result.ok ? `✅ Briefing posted to <#${ch.ops}>` : `❌ ${result.error}`,
    });
  }

  // /announce all [message]
  if (text.toLowerCase().startsWith('all ') || text.toLowerCase() === 'all') {
    const msg = text.slice(4).trim() || text;
    const channels = Object.values(ch).filter(Boolean);
    if (!channels.length) return Response.json({ response_type:'ephemeral', text:'❌ No channels configured. Set NUNTIUS_*_CHANNEL secrets.' });
    const payload = {
      blocks:[
        mkS(msg),
        mkCx([`◎ RSHIP Organism · NUNTIUS · ${ts}`]),
      ]
    };
    const results = await Promise.all(channels.map(c => slackPost(token, c, payload).then(r => ({ c, r }))));
    results.forEach(({c,r}) => record(c, msg, r));
    const ok = results.filter(x=>x.r.ok).length;
    return Response.json({ response_type:'ephemeral', text:`✅ Posted to ${ok}/${channels.length} channels.` });
  }

  // /announce #channel [message]
  let targetChannel = ch.ops;
  let message = text;
  const parts = text.split(/\s+/);
  if (parts[0].startsWith('#')) {
    const name = parts[0].slice(1).toLowerCase();
    targetChannel = ch[name] || ch.ops;
    message = parts.slice(1).join(' ');
  } else if (parts[0].startsWith('C') && parts[0].length > 8) {
    targetChannel = parts[0];
    message = parts.slice(1).join(' ');
  }

  if (!message.trim()) return Response.json({ response_type:'ephemeral', text:'❌ No message provided after channel.' });

  const payload = {
    blocks:[
      mkS(message),
      mkCx([`◎ RSHIP Organism · NUNTIUS · ${ts}`]),
    ]
  };
  const result = await slackPost(token, targetChannel, payload);
  record(targetChannel, message, result);
  return Response.json({
    response_type:'ephemeral',
    text: result.ok ? `✅ Posted to <#${targetChannel}>` : `❌ Failed: ${result.error}`,
  });
}

// ── Cron handler ───────────────────────────────────────────────────────────────
async function runScheduled(cron, env) {
  const ch    = getChannels(env);
  const token = env.SLACK_BOT_TOKEN;
  const type  = cron.includes('9') ? 'morning' : 'evening';
  const channel = ch.ops;

  if (!token || !channel) return;

  const briefing = await generateBriefing(type);
  const result   = await slackPost(token, channel, briefing);
  record(channel, `[AUTO-BRIEFING:${type.toUpperCase()}]`, result);
}

// ── Programmatic broadcast endpoint ───────────────────────────────────────────
async function handleBroadcastAPI(request, env, channelKey) {
  let body = {}; try { body = await request.json(); } catch {}
  const ch    = getChannels(env);
  const token = env.SLACK_BOT_TOKEN;
  const ts    = new Date().toUTCString();

  const channels = channelKey === 'all'
    ? Object.entries(ch).filter(([,v])=>v).map(([k,v])=>({k,v}))
    : channelKey
      ? (ch[channelKey] ? [{k:channelKey, v:ch[channelKey]}] : [])
      : (body.channel ? [{k:'custom', v:body.channel}] : [{k:'ops', v:ch.ops}]);

  if (!channels.length)
    return Response.json({ error:'NO_CHANNELS_CONFIGURED', hint:'Set NUNTIUS_*_CHANNEL secrets and redeploy.' }, {status:400});

  const message = body.text || body.message || '';
  const payload = body.blocks
    ? { blocks:body.blocks }
    : {
        blocks:[
          body.title ? mkH(body.title) : null,
          mkS(message || '*(empty)*'),
          mkCx([`◎ RSHIP Organism · NUNTIUS · ${ts}`]),
        ].filter(Boolean),
      };

  const results = await Promise.all(channels.map(({k,v}) =>
    slackPost(token, v, payload).then(r => { record(v, message, r); return {channel:k, id:v, ok:r.ok, error:r.error}; })
  ));

  return Response.json({ broadcast:true, results, successCount:results.filter(r=>r.ok).length });
}

// ── Info page ──────────────────────────────────────────────────────────────────
function buildInfoPage() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>NUNTIUS — RSHIP Broadcast Bot</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#02050f;color:#c8d8f8;font-family:'Courier New',monospace;padding:48px;max-width:800px;margin:0 auto}
h1{font-size:2.5rem;color:#00ff88;margin-bottom:8px}
.latin{font-size:.9rem;color:#445566;font-style:italic;margin-bottom:32px}
h2{font-size:1rem;color:#8899bb;letter-spacing:.1em;text-transform:uppercase;margin:32px 0 12px}
code{background:#060d1a;border:1px solid #0d2030;padding:2px 8px;border-radius:3px;color:#ffd700;font-size:.82rem}
pre{background:#060d1a;border:1px solid #0d2030;padding:20px;border-radius:6px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin:8px 0 20px}
.cmd{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #060d1a;flex-wrap:wrap}
.cmd-name{min-width:340px;color:#ffd700;font-size:.82rem}
.cmd-desc{color:#667788;font-size:.82rem;line-height:1.5}
footer{margin-top:48px;color:#223344;font-size:.75rem}
</style></head><body>
<h1>◎ NUNTIUS</h1>
<div class="latin">nuntius · "messenger · announcer · news-bearer" · RSHIP-BOT-NNT-001</div>
<p style="color:#667788;line-height:1.7;font-size:.88rem">The voice of the RSHIP Organism in Slack. Broadcasts automatically every morning and evening. Accepts commands, programmatic API calls, and pipeline delivery from CONDUIT.</p>

<h2>Slash Commands</h2>
<div class="cmd"><div class="cmd-name"><code>/announce [message]</code></div><div class="cmd-desc">Post to #rship-ops (default channel)</div></div>
<div class="cmd"><div class="cmd-name"><code>/announce #rship-market [message]</code></div><div class="cmd-desc">Post to specific channel by name</div></div>
<div class="cmd"><div class="cmd-name"><code>/announce all [message]</code></div><div class="cmd-desc">Broadcast to ALL configured channels simultaneously</div></div>
<div class="cmd"><div class="cmd-name"><code>/announce brief</code></div><div class="cmd-desc">Post live enterprise briefing to #rship-ops immediately</div></div>

<h2>Cron Schedule</h2>
<pre>09:00 UTC Mon-Fri  → Morning enterprise briefing → #rship-ops
17:00 UTC Mon-Fri  → End-of-day intelligence summary → #rship-ops</pre>

<h2>API Endpoints (for CONDUIT / IMPERIUM)</h2>
<pre>POST /broadcast          → Post to default channel (ops)
POST /broadcast/all      → Post to ALL configured channels
POST /broadcast/ops      → Post to #rship-ops
POST /broadcast/market   → Post to #rship-market
POST /broadcast/alerts   → Post to #rship-alerts
POST /broadcast/intel    → Post to #rship-intel
GET  /channels           → List configured channels
GET  /history            → Recent broadcast history
GET  /api/status         → Bot health</pre>

<h2>Broadcast API Payload</h2>
<pre>{
  "text": "RSHIP Organism is now fully operational.",
  "title": "Optional header",
  "channel": "C0123456789"  // optional channel ID override
}</pre>

<h2>Setup</h2>
<pre>wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put NUNTIUS_OPS_CHANNEL      # C0123... (right-click channel → copy link)
wrangler secret put NUNTIUS_MARKET_CHANNEL
wrangler secret put NUNTIUS_ALERTS_CHANNEL
wrangler secret put NUNTIUS_INTEL_CHANNEL
wrangler deploy</pre>

<footer>© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved</footer>
</body></html>`;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(event.cron || '', env));
  },

  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;
    const cors = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization' };

    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});

    // Slack slash command
    if (path === '/slack/command' && request.method === 'POST') {
      const raw   = await request.text();
      const valid = await verifySlack(request, raw, env.SLACK_SIGNING_SECRET);
      if (!valid) return new Response('Unauthorized',{status:401});
      return handleAnnounce(raw, env);
    }

    // Events API
    if (path === '/slack/events' && request.method === 'POST') {
      const raw  = await request.text();
      const valid= await verifySlack(request, raw, env.SLACK_SIGNING_SECRET);
      if (!valid) return new Response('Unauthorized',{status:401});
      const body = JSON.parse(raw);
      if (body.type === 'url_verification') return Response.json({challenge:body.challenge});
      return Response.json({ok:true});
    }

    // Broadcast API endpoints
    if (path === '/broadcast'         && request.method === 'POST') return handleBroadcastAPI(request, env, 'ops');
    if (path === '/broadcast/all'     && request.method === 'POST') return handleBroadcastAPI(request, env, 'all');
    if (path === '/broadcast/ops'     && request.method === 'POST') return handleBroadcastAPI(request, env, 'ops');
    if (path === '/broadcast/market'  && request.method === 'POST') return handleBroadcastAPI(request, env, 'market');
    if (path === '/broadcast/alerts'  && request.method === 'POST') return handleBroadcastAPI(request, env, 'alerts');
    if (path === '/broadcast/intel'   && request.method === 'POST') return handleBroadcastAPI(request, env, 'intel');

    // Info endpoints
    if (path === '/channels')
      return Response.json({ channels:getChannels(env), configured:Object.values(getChannels(env)).filter(Boolean).length }, {headers:cors});

    if (path === '/history')
      return Response.json({ history, count:history.length, totalBroadcasts:broadcastCount }, {headers:cors});

    if (path === '/api/status')
      return Response.json({
        designation:'RSHIP-BOT-NNT-001', name:'NUNTIUS', type:'BROADCAST_BOT',
        latin:'nuntius', meaning:'messenger · announcer · news-bearer',
        totalBroadcasts:broadcastCount, recentBroadcasts:history.length,
        cronSchedules:['0 9 * * 1-5','0 17 * * 1-5'],
        configuredChannels:Object.values(getChannels(env)).filter(Boolean).length,
        phi:PHI, uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)), alive:true
      }, {headers:cors});

    if (path === '/')
      return new Response(buildInfoPage(),{headers:{'Content-Type':'text/html;charset=UTF-8',...cors}});

    return Response.json({ error:'NOT_FOUND', path,
      available:['/','/slack/command','/slack/events','/broadcast','/broadcast/all','/broadcast/ops','/broadcast/market','/broadcast/alerts','/broadcast/intel','/channels','/history','/api/status']
    }, {status:404, headers:cors});
  },
};
