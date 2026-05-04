/**
 * SENTINEL — Real-Time Alert Bot
 *
 * Designation:  RSHIP-BOT-SNT-001
 * Latin:        sentinel (watchman · guardian · alert monitor)
 * Type:         ALERT BOT · Cloudflare Scheduled + Fetch Worker
 *
 * SENTINEL watches the RSHIP agent network every 5 minutes.
 * When predefined thresholds are crossed, it fires alerts to Slack and Discord.
 *
 * Default Alert Rules:
 *   • VIGIL regime turns CHAOTIC for ≥ 3 instruments → 🔴 Market Chaos Alert
 *   • NEXUS disruptions > 0 → 🚨 Supply Chain Disruption Alert
 *   • NEXUS Kuramoto R < 0.5 → ⚡ Network Desync Alert
 *   • VIGIL instrument confidence > 90% → 📈 High-Confidence Signal Alert
 *   • NEXUS node capacity < 50% → 📦 Low Capacity Alert
 *
 * Routes:
 *   GET  /                      → Info page
 *   GET  /api/status            → Bot health + alert stats
 *   GET  /api/rules             → List active alert rules
 *   POST /api/rules/add         → Add a custom alert rule
 *   POST /api/rules/remove      → Remove an alert rule
 *   GET  /api/alerts/history    → Recent alert history (in-memory)
 *   POST /api/scan              → Manual scan + alert fire
 *   POST /webhook/test          → Send test alert to configured webhooks
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI          = 1.618033988749895;
const PHI_INV      = 0.618033988749895;
const HEARTBEAT_MS = 873;
const VERSION      = '1.0.0';

const AGENTS = {
  VIGIL : 'https://vigil.rship.workers.dev',
  NEXUS : 'https://nexus.rship.workers.dev',
  CEREBRUM: 'https://cerebrum.rship.workers.dev',
};

// ── Alert history (in-memory) ──────────────────────────────────────────────────
const alertHistory = [];
const MAX_HISTORY  = 100;
let   scanCount    = 0;
let   alertCount   = 0;
let   startTime    = Date.now();

// ── Default alert rules ────────────────────────────────────────────────────────
const rules = [
  {
    id:'R-001', name:'Market Chaos Alert', active:true,
    description:'VIGIL reports ≥ 3 instruments in CHAOTIC regime',
    agent:'VIGIL', check:'chaotic_count_gte', threshold:3,
    severity:'HIGH', emoji:'🔴', channel:'both',
  },
  {
    id:'R-002', name:'Supply Disruption Alert', active:true,
    description:'NEXUS has active disruptions',
    agent:'NEXUS', check:'active_disruptions_gt', threshold:0,
    severity:'HIGH', emoji:'🚨', channel:'both',
  },
  {
    id:'R-003', name:'Network Desync Alert', active:true,
    description:'NEXUS Kuramoto R drops below 0.5 (desync)',
    agent:'NEXUS', check:'kuramoto_r_lt', threshold:0.5,
    severity:'MEDIUM', emoji:'⚡', channel:'both',
  },
  {
    id:'R-004', name:'High-Confidence Signal', active:true,
    description:'Any VIGIL instrument hits ≥ 92% prediction confidence',
    agent:'VIGIL', check:'max_confidence_gte', threshold:0.92,
    severity:'LOW', emoji:'📈', channel:'both',
  },
  {
    id:'R-005', name:'Low Capacity Node', active:true,
    description:'Any NEXUS supply node drops below 55% capacity',
    agent:'NEXUS', check:'min_capacity_lt', threshold:0.55,
    severity:'MEDIUM', emoji:'📦', channel:'both',
  },
];

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
      body:JSON.stringify(body), signal:AbortSignal.timeout(5000),
    });
    return await r.json();
  } catch(e) { return { error:String(e.message), unreachable:true }; }
}

// ── Collect network snapshot ───────────────────────────────────────────────────
async function collectSnapshot() {
  const [vigil, nexusNodes, nexusDisruptions] = await Promise.all([
    safeGet(`${AGENTS.VIGIL}/api/market/regime`),
    safeGet(`${AGENTS.NEXUS}/api/nodes`),
    safeGet(`${AGENTS.NEXUS}/api/disruption/active`),
  ]);

  const vigilInstruments = vigil.instruments || [];
  const nexusNodeList    = nexusNodes.nodes   || [];
  const nexusDist        = nexusDisruptions.active || [];

  return {
    ts:Date.now(),
    vigil: {
      networkRegime: vigil.networkRegime || 'UNKNOWN',
      instruments: vigilInstruments,
      chaoticCount: vigilInstruments.filter(i=>i.regime==='CHAOTIC').length,
      stableCount:  vigilInstruments.filter(i=>i.regime==='STABLE').length,
      maxConfidence: vigilInstruments.reduce((m,i)=>Math.max(m,i.confidence||0),0),
      bestSignal: vigilInstruments.sort((a,b)=>(b.confidence||0)-(a.confidence||0))[0] || null,
    },
    nexus: {
      kuramotoR: nexusNodes.kuramotoR || 0,
      synced:    nexusNodes.synced || false,
      nodeCount: nexusNodeList.length,
      activeDisruptions: nexusDist.length,
      disruptions: nexusDist,
      minCapacity: nexusNodeList.reduce((m,n)=>Math.min(m,n.capacity), 1),
      lowCapNodes: nexusNodeList.filter(n=>n.capacity<0.55).map(n=>({id:n.id,capacity:n.capacity})),
    },
    reachable: !vigil.unreachable && !nexusNodes.unreachable,
  };
}

// ── Evaluate rules against snapshot ───────────────────────────────────────────
function evaluateRules(snapshot) {
  const fired = [];
  for (const rule of rules) {
    if (!rule.active) continue;
    let triggered = false;
    let value;

    switch(rule.check) {
      case 'chaotic_count_gte':
        value = snapshot.vigil.chaoticCount;
        triggered = value >= rule.threshold;
        break;
      case 'active_disruptions_gt':
        value = snapshot.nexus.activeDisruptions;
        triggered = value > rule.threshold;
        break;
      case 'kuramoto_r_lt':
        value = snapshot.nexus.kuramotoR;
        triggered = value < rule.threshold;
        break;
      case 'max_confidence_gte':
        value = snapshot.vigil.maxConfidence;
        triggered = value >= rule.threshold;
        break;
      case 'min_capacity_lt':
        value = snapshot.nexus.minCapacity;
        triggered = value < rule.threshold;
        break;
    }

    if (triggered) {
      fired.push({ ...rule, firedValue:value, snapshot_ts:snapshot.ts });
    }
  }
  return fired;
}

// ── Build alert message ────────────────────────────────────────────────────────
function buildAlertMessage(rule, snapshot) {
  const details = {
    'R-001': [
      `Network regime: **${snapshot.vigil.networkRegime}**`,
      `Chaotic instruments: ${snapshot.vigil.chaoticCount} — ${snapshot.vigil.instruments.filter(i=>i.regime==='CHAOTIC').map(i=>i.symbol).join(', ')}`,
      `Stable instruments: ${snapshot.vigil.stableCount}`,
    ].join('\n'),
    'R-002': [
      `Active disruptions: **${snapshot.nexus.activeDisruptions}**`,
      snapshot.nexus.disruptions.map(d=>`⚠ ${d.id}: ${d.type} at ${d.nodeId} — ${d.severity}`).join('\n'),
    ].join('\n'),
    'R-003': `Kuramoto R: **${snapshot.nexus.kuramotoR}** (threshold: ${rule.threshold}) — Network desync detected.`,
    'R-004': [
      `Max confidence: **${Math.round((snapshot.vigil.maxConfidence||0)*100)}%**`,
      snapshot.vigil.bestSignal ? `Best signal: ${snapshot.vigil.bestSignal.symbol} — ${snapshot.vigil.bestSignal.action} (${Math.round((snapshot.vigil.bestSignal.confidence||0)*100)}%)` : '',
    ].join('\n'),
    'R-005': [
      `Min capacity: **${Math.round((snapshot.nexus.minCapacity||0)*100)}%** (threshold: ${Math.round(rule.threshold*100)}%)`,
      `Low-cap nodes: ${snapshot.nexus.lowCapNodes.map(n=>`${n.id} (${Math.round(n.capacity*100)}%)`).join(', ')}`,
    ].join('\n'),
  }[rule.id] || `Value: ${rule.firedValue} · Threshold: ${rule.threshold}`;

  return {
    title: `${rule.emoji} RSHIP ALERT — ${rule.name}`,
    severity: rule.severity,
    description: rule.description,
    details,
    ruleId: rule.id,
    firedAt: new Date(snapshot.ts).toUTCString(),
    phi: PHI,
  };
}

// ── Deliver alert to Slack ─────────────────────────────────────────────────────
async function fireSlack(webhookUrl, alert) {
  if (!webhookUrl) return { delivered:false, reason:'NO_WEBHOOK' };
  const severityColor = alert.severity==='HIGH'?'danger':alert.severity==='MEDIUM'?'warning':'good';
  const message = {
    username:'SENTINEL · RSHIP Alerts',
    icon_emoji:':rotating_light:',
    attachments:[{
      color: severityColor,
      title: alert.title,
      text: [alert.description, '', alert.details].join('\n').slice(0,2800),
      footer:`SENTINEL · RSHIP-BOT-SNT-001 · Rule ${alert.ruleId}`,
      ts: Math.floor(Date.now()/1000),
    }],
  };
  try {
    const r = await fetch(webhookUrl, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify(message), signal:AbortSignal.timeout(4000),
    });
    return { delivered:true, status:r.status };
  } catch(e) { return { delivered:false, error:String(e.message) }; }
}

// ── Deliver alert to Discord ───────────────────────────────────────────────────
async function fireDiscord(webhookUrl, alert) {
  if (!webhookUrl) return { delivered:false, reason:'NO_WEBHOOK' };
  const color = alert.severity==='HIGH'?0xff4455:alert.severity==='MEDIUM'?0xff9500:0x00ff88;
  const embed = {
    title: alert.title,
    description: [alert.description, '', alert.details].join('\n').slice(0,2000),
    color,
    timestamp: new Date().toISOString(),
    footer:{ text:`SENTINEL · RSHIP-BOT-SNT-001 · Rule ${alert.ruleId}` },
    fields:[
      {name:'Severity', value:alert.severity, inline:true},
      {name:'Rule', value:alert.ruleId, inline:true},
      {name:'φ', value:String(PHI.toFixed(4)), inline:true},
    ],
  };
  try {
    const r = await fetch(webhookUrl, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:'SENTINEL · RSHIP',embeds:[embed]}), signal:AbortSignal.timeout(4000),
    });
    return { delivered:true, status:r.status };
  } catch(e) { return { delivered:false, error:String(e.message) }; }
}

// ── Main scan runner ───────────────────────────────────────────────────────────
async function runScan(env) {
  scanCount++;
  const snapshot = await collectSnapshot();
  if (!snapshot.reachable) return { scanned:false, reason:'AGENTS_UNREACHABLE' };

  const fired = evaluateRules(snapshot);
  const deliveries = [];

  for (const rule of fired) {
    alertCount++;
    const alert = buildAlertMessage(rule, snapshot);

    // Deliver
    const slackResult   = await fireSlack(env.SENTINEL_SLACK_WEBHOOK, alert);
    const discordResult = await fireDiscord(env.SENTINEL_DISCORD_WEBHOOK, alert);

    const record = { ...alert, slackResult, discordResult, ts:Date.now() };
    alertHistory.unshift(record);
    if (alertHistory.length > MAX_HISTORY) alertHistory.pop();
    deliveries.push(record);
  }

  return {
    scanned:true, scanCount, alertsFired:fired.length,
    snapshot:{ ts:snapshot.ts, vigil:{chaoticCount:snapshot.vigil.chaoticCount, networkRegime:snapshot.vigil.networkRegime},
      nexus:{kuramotoR:snapshot.nexus.kuramotoR, activeDisruptions:snapshot.nexus.activeDisruptions} },
    deliveries,
  };
}

// ── Auth ───────────────────────────────────────────────────────────────────────
function isAuthorized(request, env) {
  if (!env.SENTINEL_AUTH_TOKEN) return true;
  return (request.headers.get('Authorization')||'') === `Bearer ${env.SENTINEL_AUTH_TOKEN}`;
}

// ── Info page ──────────────────────────────────────────────────────────────────
function buildInfoPage() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>SENTINEL — RSHIP Alert Bot</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#02050f;color:#c8d8f8;font-family:'Courier New',monospace;padding:48px;max-width:800px;margin:0 auto}
h1{font-size:2.5rem;color:#ff9500;margin-bottom:8px}
.latin{font-size:.9rem;color:#445566;font-style:italic;margin-bottom:32px}
h2{font-size:1rem;color:#8899bb;letter-spacing:.1em;text-transform:uppercase;margin:32px 0 12px}
code{background:#060d1a;border:1px solid #0d2030;padding:2px 8px;border-radius:3px;color:#ffd700;font-size:.82rem}
pre{background:#060d1a;border:1px solid #0d2030;padding:20px;border-radius:6px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin:8px 0 20px}
.rule{border:1px solid #0d2030;border-radius:6px;padding:14px;margin-bottom:10px;background:#060d1a}
.rule-id{color:#ffd700;font-size:.75rem;margin-bottom:4px}.rule-name{font-weight:bold;margin-bottom:4px}
.rule-desc{font-size:.82rem;color:#667788}.rule-sev{font-size:.7rem;padding:2px 6px;border-radius:2px;font-weight:bold;display:inline-block;margin-top:6px}
.HIGH{color:#ff4455;background:#ff445520}.MEDIUM{color:#ff9500;background:#ff950020}.LOW{color:#00ff88;background:#00ff8820}
footer{margin-top:48px;color:#223344;font-size:.75rem}
</style></head><body>
<h1>◉ SENTINEL</h1>
<div class="latin">sentinel · "watchman · guardian · alert monitor" · RSHIP-BOT-SNT-001</div>
<p style="color:#667788;line-height:1.7;font-size:.88rem">Real-time alert bot. Scans the RSHIP agent network every 5 minutes. Fires Slack and Discord alerts the moment thresholds are crossed — market chaos, supply disruptions, network desync, high-confidence signals.</p>

<h2>Alert Rules</h2>
${rules.map(r=>`<div class="rule"><div class="rule-id">${r.id} · ${r.emoji}</div><div class="rule-name">${r.name}</div><div class="rule-desc">${r.description}</div><div class="rule-sev ${r.severity}">${r.severity}</div></div>`).join('')}

<h2>Endpoints</h2>
<pre>GET  /api/status           → Bot health + scan stats
GET  /api/rules            → Active alert rules
POST /api/rules/add        → Add custom rule
POST /api/rules/remove     → Remove rule by ID
GET  /api/alerts/history   → Last ${MAX_HISTORY} fired alerts
POST /api/scan             → Manual scan (fire alerts if triggered)
POST /webhook/test         → Test alert delivery to webhooks</pre>

<h2>Setup</h2>
<pre>wrangler secret put SENTINEL_SLACK_WEBHOOK    # Slack incoming webhook
wrangler secret put SENTINEL_DISCORD_WEBHOOK  # Discord webhook
wrangler secret put SENTINEL_AUTH_TOKEN       # Optional API auth
wrangler deploy</pre>

<footer>© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved</footer>
</body></html>`;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScan(env));
  },

  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;
    const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization' };

    if (request.method === 'OPTIONS') return new Response(null, {status:204,headers:cors});

    if (path === '/')
      return new Response(buildInfoPage(), {headers:{'Content-Type':'text/html;charset=UTF-8',...cors}});

    if (path === '/api/status')
      return Response.json({
        designation:'RSHIP-BOT-SNT-001', name:'SENTINEL', type:'ALERT_BOT',
        latin:'sentinel', meaning:'watchman · guardian · alert monitor',
        scanCount, alertCount, rulesActive:rules.filter(r=>r.active).length,
        recentAlerts:alertHistory.length,
        cronSchedule:'*/5 * * * *',
        phi:PHI, uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)), alive:true
      }, {headers:cors});

    if (path === '/api/rules')
      return Response.json({ rules, count:rules.length, active:rules.filter(r=>r.active).length }, {headers:cors});

    if (path === '/api/rules/add' && request.method === 'POST') {
      if (!isAuthorized(request, env)) return Response.json({error:'UNAUTHORIZED'},{status:401,headers:cors});
      let body={}; try{body=await request.json();}catch{}
      const rule={id:`R-${String(rules.length+1).padStart(3,'0')}`,name:String(body.name||'Custom Rule'),active:true,
        description:String(body.description||''),agent:String(body.agent||'VIGIL'),
        check:String(body.check||'chaotic_count_gte'),threshold:Number(body.threshold||1),
        severity:String(body.severity||'MEDIUM'),emoji:String(body.emoji||'⚠'),channel:'both'};
      rules.push(rule);
      return Response.json({added:true,rule},{headers:cors});
    }

    if (path === '/api/rules/remove' && request.method === 'POST') {
      if (!isAuthorized(request, env)) return Response.json({error:'UNAUTHORIZED'},{status:401,headers:cors});
      let body={}; try{body=await request.json();}catch{}
      const idx=rules.findIndex(r=>r.id===body.id);
      if(idx===-1)return Response.json({error:'RULE_NOT_FOUND'},{status:404,headers:cors});
      const removed=rules.splice(idx,1)[0];
      return Response.json({removed:true,rule:removed},{headers:cors});
    }

    if (path === '/api/alerts/history')
      return Response.json({ alerts:alertHistory, count:alertHistory.length, totalFired:alertCount }, {headers:cors});

    if (path === '/api/scan' && request.method === 'POST') {
      if (!isAuthorized(request, env)) return Response.json({error:'UNAUTHORIZED'},{status:401,headers:cors});
      const result = await runScan(env);
      return Response.json(result, {headers:cors});
    }

    if (path === '/webhook/test' && request.method === 'POST') {
      const testAlert = {
        title:'🧪 SENTINEL TEST ALERT',
        severity:'LOW', description:'Test message from SENTINEL',
        details:'This is a test. Your SENTINEL bot is correctly configured.',
        ruleId:'TEST', firedAt:new Date().toUTCString(), phi:PHI,
      };
      const [slack, discord] = await Promise.all([
        fireSlack(env.SENTINEL_SLACK_WEBHOOK, testAlert),
        fireDiscord(env.SENTINEL_DISCORD_WEBHOOK, testAlert),
      ]);
      return Response.json({ test:true, slack, discord }, {headers:cors});
    }

    return Response.json({ error:'NOT_FOUND', path,
      available:['/','/api/status','/api/rules','/api/rules/add','/api/rules/remove',
        '/api/alerts/history','/api/scan','/webhook/test']
    }, {status:404, headers:cors});
  },
};
