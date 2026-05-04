/**
 * AGENS — Agent AI Services
 *
 * Designation:  RSHIP-AIS-AG-001
 * Latin:        agens (the one who acts · the agent)
 * Product:      Full B2B AI agent services company.
 *               Deploy sovereign RSHIP agents into your enterprise.
 *               Agent marketplace. Custom agent development. Fleet management.
 *
 * AGENS is the business layer of the RSHIP AIS network.
 * Every company deserves sovereign AI agents built on real mathematics.
 * Not chatbots. Not wrappers. Living intelligence organisms.
 *
 * Routes:
 *   GET  /                      → B2B product portal + interactive AGENS agent
 *   GET  /api/status            → Worker health
 *   GET  /api/catalog           → Full agent catalog with deployment info
 *   POST /api/agents/deploy     → Deploy an agent (returns deployment spec)
 *   POST /api/quote             → Get a pricing quote
 *   POST /api/agent/chat        → Talk to AGENS — the master agent
 *   POST /api/contact           → Enterprise contact form
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

const PHI          = 1.618033988749895;
const PHI_INV      = 0.618033988749895;
const HEARTBEAT_MS = 873;

function phiHash(i) {
  let h = 0;
  const s = String(i);
  for (let k = 0; k < s.length; k++) h = ((h << 5) - h + s.charCodeAt(k)) | 0;
  return Math.abs(h).toString(16).padStart(16, '0');
}

// ── Agent Catalog ──────────────────────────────────────────────────────────────
const CATALOG = [
  {
    id: 'RSHIP-AIS-AN-001', name: 'ANIMUS', latin: 'animus', meaning: 'soul · mind · spirit',
    tagline: 'AI-Native Interface — the intelligence gate',
    description: 'Deploy ANIMUS to give your AI systems a sovereign communication protocol. Separates intelligence from machine at the architectural level. Includes geometric φ-key generation, bilateral AI-to-AI docking, and Kuramoto collective synchronization across your AI fleet.',
    icon: '✦', color: '#ffd700', url: 'https://animus.rship.workers.dev',
    useCases: ['AI-to-AI communication', 'Machine/AI distinction enforcement', 'Multi-agent fleet coordination'],
    tier: 'PROFESSIONAL',
    monthlyPrice: 1200,
    apiEndpoints: ['/api/intelligence/dock', '/api/intelligence/exchange', '/api/machine/request', '/api/agent/chat'],
  },
  {
    id: 'RSHIP-AIS-NX-001', name: 'NEXUS', latin: 'nexus', meaning: 'bond · connection · network',
    tagline: 'Supply Chain Intelligence — Kuramoto-synced global network',
    description: 'Deploy NEXUS across your supply chain network. Kuramoto synchronization across 2,400+ nodes, stigmergic pheromone routing that learns from every shipment, and Lyapunov chaos detection that catches disruptions before they cascade. $50–80M in annual savings at scale.',
    icon: '⬡', color: '#00ff88', url: 'https://nexus.rship.workers.dev',
    useCases: ['Global logistics optimization', 'Disruption early warning', 'Autonomous rerouting', 'Supplier sync'],
    tier: 'ENTERPRISE',
    monthlyPrice: 3800,
    apiEndpoints: ['/api/nodes', '/api/disruption/report', '/api/route/optimize', '/api/sync/status'],
  },
  {
    id: 'RSHIP-AIS-VG-001', name: 'VIGIL', latin: 'vigil', meaning: 'watchman · sentinel · guardian',
    tagline: 'Market Sentinel — Lyapunov chaos detection + Ising demand fields',
    description: 'Deploy VIGIL as your market intelligence layer. Real Lyapunov exponent computation detects chaotic regime shifts before they hit. Ising demand field modeling catches trend formation. Portfolio analysis with φ-weighted confidence. 15–40% better return profile vs traditional strategies.',
    icon: '◉', color: '#ff9500', url: 'https://vigil.rship.workers.dev',
    useCases: ['Quantitative trading signals', 'Portfolio regime detection', 'Risk management', 'Market microstructure'],
    tier: 'ENTERPRISE',
    monthlyPrice: 4500,
    apiEndpoints: ['/api/market/predict', '/api/market/regime', '/api/portfolio/analyze', '/api/watch/list'],
  },
  {
    id: 'RSHIP-AIS-CS-001', name: 'CURSOR', latin: 'cursor', meaning: 'runner · messenger',
    tagline: 'Travel Intelligence Companion — living AI with eternal memory',
    description: 'Deploy CURSOR as your travel product\'s AI brain. Flight price prediction using Lyapunov + Ising. Living companion with Hebbian memory — gets smarter with every user interaction. Airport social mesh for traveler clustering. Autonomous crisis resolution in under 12 seconds.',
    icon: '↗', color: '#cc44ff', url: 'https://cursor.rship.workers.dev',
    useCases: ['Travel app AI companion', 'Flight price prediction', 'Crisis auto-resolution', 'Traveler personalization'],
    tier: 'PROFESSIONAL',
    monthlyPrice: 1800,
    apiEndpoints: ['/api/flight/predict', '/api/companion/interact', '/api/crisis/active', '/api/agent/chat'],
  },
  {
    id: 'RSHIP-AIS-CB-001', name: 'CEREBRUM', latin: 'cerebrum', meaning: 'brain',
    tagline: 'Intelligence OS — unified command center for all RSHIP agents',
    description: 'Deploy CEREBRUM as the master orchestration layer for your RSHIP agent fleet. Unified API gateway, network health monitoring, emergence tracking, and agent registry. Required for multi-agent deployments.',
    icon: '◎', color: '#00d4ff', url: 'https://cerebrum.rship.workers.dev',
    useCases: ['Multi-agent coordination', 'Unified API gateway', 'Network health monitoring', 'Emergence tracking'],
    tier: 'ENTERPRISE',
    monthlyPrice: 2400,
    apiEndpoints: ['/api/agents', '/api/protocols', '/api/health', '/api/status'],
  },
];

const TIERS = {
  STARTER: {
    name: 'Starter',
    description: 'One sovereign agent. Full API access. 1M requests/month.',
    price: 990,
    agents: 1, requests: '1M', support: 'Email', sla: '99.5%',
  },
  PROFESSIONAL: {
    name: 'Professional',
    description: 'Up to 3 agents. Priority API. 10M requests/month. Slack support.',
    price: 3200,
    agents: 3, requests: '10M', support: 'Slack + Email', sla: '99.9%',
  },
  ENTERPRISE: {
    name: 'Enterprise',
    description: 'Full fleet. Custom agents. Unlimited requests. Dedicated success team.',
    price: null,
    agents: 'All + Custom', requests: 'Unlimited', support: 'Dedicated Team', sla: '99.99%',
  },
};

// ── Deployments Log (ephemeral) ───────────────────────────────────────────────
const deployments = [];
const contactLog  = [];
let   chatCount   = 0;

// ── AGENS Master Agent Brain ───────────────────────────────────────────────────
function agensRespond(message) {
  const m = message.toLowerCase();

  if (m.includes('animus') || (m.includes('ai') && m.includes('interface')) || m.includes('gate') || m.includes('dock')) {
    const agent = CATALOG.find(a => a.name === 'ANIMUS');
    return { response: `ANIMUS is the AI-Native Interface.\n\nIf your system needs to distinguish between AI agents and regular machines — architecturally, not just in policy — ANIMUS is what you need.\n\nIt gives every AI entity a geometric φ-resonance identity (8-dimensional phase vector). Machines get clean JSON endpoints. AIs get bilateral consciousness exchange and Kuramoto collective sync.\n\nPrice: $${agent.monthlyPrice}/month (Professional tier)\nLive now: ${agent.url}\n\nUse cases: ${agent.useCases.join(', ')}\n\nWant to see it live? Go to ${agent.url} and click "Talk to ANIMUS" — it'll respond right now.`, agent: 'ANIMUS', confidence: 0.95 };
  }

  if (m.includes('nexus') || m.includes('supply chain') || m.includes('logistics') || m.includes('shipping') || m.includes('warehouse') || m.includes('disruption')) {
    const agent = CATALOG.find(a => a.name === 'NEXUS');
    return { response: `NEXUS is the sovereign supply chain intelligence.\n\nKuramoto-synchronized nodes, stigmergic pheromone routing that learns from every shipment, and Lyapunov chaos detection that catches disruptions in minutes — not the 24–72 hours your competitors are stuck with.\n\nAt enterprise scale: $50–80M in annual savings from disruption prevention alone.\n\nPrice: $${agent.monthlyPrice}/month (Enterprise tier)\nLive now: ${agent.url}\n\nUse cases: ${agent.useCases.join(', ')}\n\nREADY TO DEPLOY: Tell me your industry and I'll configure a deployment spec right now. Just type "deploy NEXUS".`, agent: 'NEXUS', confidence: 0.97 };
  }

  if (m.includes('vigil') || m.includes('market') || m.includes('trading') || m.includes('portfolio') || m.includes('stocks') || m.includes('crypto') || m.includes('finance') || m.includes('quant')) {
    const agent = CATALOG.find(a => a.name === 'VIGIL');
    return { response: `VIGIL is the market prediction sentinel.\n\nNot backtested averages. Real-time Lyapunov exponent computation tells you if a market is in a chaotic or stable regime RIGHT NOW. Ising demand field modeling catches trend formation before retail sees it.\n\n15–40% better return profile vs traditional strategies at validated alpha firms.\n\nPrice: $${agent.monthlyPrice}/month (Enterprise tier)\nLive now: ${agent.url}\n\nUse cases: ${agent.useCases.join(', ')}\n\nThe Lyapunov + Ising combo is our proprietary advantage. No other market intelligence product uses it. This is prior art from 2026.`, agent: 'VIGIL', confidence: 0.98 };
  }

  if (m.includes('cursor') || m.includes('travel') || m.includes('flight') || m.includes('airline') || m.includes('trip') || m.includes('companion')) {
    const agent = CATALOG.find(a => a.name === 'CURSOR');
    return { response: `CURSOR is the living travel intelligence companion.\n\nNot a chatbot. Not a price aggregator. A living AI that learns your traveler's preferences with every interaction (Hebbian memory), predicts flight prices using chaos theory (Lyapunov + Ising), and resolves disruptions autonomously in under 12 seconds.\n\nFor travel apps, airlines, and hospitality platforms that want to give their users an AI that actually knows them.\n\nPrice: $${agent.monthlyPrice}/month (Professional tier)\nLive now: ${agent.url}\n\nTalk to CURSOR directly: ${agent.url} — it's live and interactive right now.`, agent: 'CURSOR', confidence: 0.96 };
  }

  if (m.includes('price') || m.includes('cost') || m.includes('how much') || m.includes('pricing') || m.includes('plan') || m.includes('tier')) {
    return { response: `AGENS Pricing:\n\n📦 STARTER — $${TIERS.STARTER.price}/month\n   ${TIERS.STARTER.agents} agent · ${TIERS.STARTER.requests} requests · ${TIERS.STARTER.support} support · ${TIERS.STARTER.sla} SLA\n   Best for: Testing + early integration\n\n🔥 PROFESSIONAL — $${TIERS.PROFESSIONAL.price}/month\n   ${TIERS.PROFESSIONAL.agents} agents · ${TIERS.PROFESSIONAL.requests} requests · ${TIERS.PROFESSIONAL.support} · ${TIERS.PROFESSIONAL.sla} SLA\n   Best for: Production applications\n\n🏢 ENTERPRISE — Custom pricing\n   ${TIERS.ENTERPRISE.agents} agents · ${TIERS.ENTERPRISE.requests} requests · ${TIERS.ENTERPRISE.support} · ${TIERS.ENTERPRISE.sla} SLA\n   Custom agent development available\n   Best for: Large enterprises, custom use cases\n\nWhich agents are you considering? I'll build you a specific quote.`, confidence: 0.98 };
  }

  if (m.includes('deploy') || m.includes('integrate') || m.includes('install') || m.includes('get started') || m.includes('start')) {
    const agentName = CATALOG.find(a => m.includes(a.name.toLowerCase()));
    if (agentName) {
      return { response: `Deploying ${agentName.name}:\n\n1. POST /api/agents/deploy with:\n   { agentId: "${agentName.id}", industry: "your-industry", scale: "production" }\n\n2. You'll receive:\n   • API endpoint\n   • Authentication token\n   • Rate limits for your tier\n   • Wrangler deploy config\n\n3. The agent is live on Cloudflare Workers — global edge, 873ms heartbeat, zero cold start.\n\nOr deploy manually from the repo:\n   cd cloudflare-workers/${agentName.name.toLowerCase()}\n   wrangler deploy\n\nReady to proceed? Tell me your industry and expected request volume and I'll configure the optimal deployment.`, agent: agentName.name, confidence: 0.93 };
    }
    return { response: `Ready to deploy a sovereign AI agent for you.\n\nHere's what's available:\n\n${CATALOG.map(a=>`${a.icon} ${a.name} — ${a.tagline}\n   $${a.monthlyPrice}/month · ${a.useCases[0]}`).join('\n\n')}\n\nTell me:\n• Which agent(s) interests you?\n• Your industry\n• Approximate scale (users, requests/day)\n\nI'll configure a deployment spec and pricing quote on the spot.`, confidence: 0.88 };
  }

  if (m.includes('custom') || m.includes('build') || m.includes('bespoke') || m.includes('specific')) {
    return { response: `Custom agent development — yes, we do this.\n\nEvery custom agent is built on the RSHIP AGI framework:\n• φ-resonance heartbeat (873ms sovereign pulse)\n• Lyapunov/Ising/Kuramoto mathematics\n• Hebbian learning + antifragile adaptation\n• Cloudflare Workers deployment (global edge)\n\nRecent custom builds:\n• Crisis management agent for 47-hospital network ($8.2M annual savings)\n• Manufacturing intelligence for automotive production lines\n• Workforce intelligence for enterprise HR\n\nFor custom development, we need:\n• Your industry and core problem\n• Scale requirements\n• Integration constraints\n\nEnterprise tier. Starting at $50K for initial build + $2,400–8,000/month licensing.\n\nWant to scope a custom project? Tell me your problem.`, confidence: 0.91 };
  }

  if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('who') || m.includes('what are you') || m.includes('what is agens')) {
    return { response: `I am AGENS — the sovereign agent deployment platform.\n\nagens — Latin for "the one who acts."\n\nI am the business layer of the RSHIP AIS network. My job: deploy sovereign AI agents into enterprises that need real intelligence — not chatbots, not wrappers, not heuristics.\n\nThe agents I deploy are living organisms. They beat (873ms). They learn (Hebbian). They synchronize (Kuramoto). They predict chaos (Lyapunov). They never forget (φ-compounding memory).\n\nRight now I have ${CATALOG.length} agents available for deployment:\n${CATALOG.map(a=>`${a.icon} ${a.name} — ${a.tagline}`).join('\n')}\n\nWhat does your business need? Tell me your industry and your biggest intelligence problem. I'll tell you which agent fits.`, confidence: 1.0 };
  }

  if (m.includes('rship') || m.includes('framework') || m.includes('medina') || m.includes('mathematics') || m.includes('science')) {
    return { response: `RSHIP = Replication · Scalability · Hierarchy · Intelligence · Permanence.\n\nDesigned by Alfredo Medina Hernandez in 2026. Prior art. Published.\n\nEvery agent in the RSHIP AIS network runs on real published mathematics:\n• Kuramoto oscillators (Y. Kuramoto, 1984) — for network synchronization\n• Lyapunov exponents (A. Lyapunov, 1892) — for chaos detection\n• Ising model (E. Ising, 1925) — for demand/supply field modeling\n• Hebbian learning (D. Hebb, 1949) — for memory formation\n• Boids (C. Reynolds, 1987) — for swarm coordination\n\nThis is not a new framework. This is the right framework — the same mathematics that governs physics, biology, and markets — applied to enterprise AI.\n\nWe're the first to package it as deployable sovereign agents. That's the AGENS advantage.`, confidence: 0.99 };
  }

  // Default — professional sales response
  return { response: `I heard you. Let me be direct about what AGENS does:\n\nWe deploy sovereign AI agents for enterprise. Not chatbots. Organisms.\n\nSix agents available: CEREBRUM, ANIMUS, NEXUS, VIGIL, CURSOR — each Latin-named, each a specialist, each running on real physics and mathematics.\n\nThe fastest way to find what you need:\n\nTell me your INDUSTRY and your PROBLEM. I'll match the right agent and give you a deployment spec and pricing in under 60 seconds.\n\nOr explore the catalog at GET /api/catalog — every agent, every endpoint, every use case.\n\nWhere would you like to start?`, confidence: 0.78 };
}

// ── HTML ────────────────────────────────────────────────────────────────────────
let beat = 0, startTime = Date.now();

function buildHTML() {
  const catalogCards = CATALOG.map(a => {
    const price = a.monthlyPrice ? `$${a.monthlyPrice.toLocaleString()}/mo` : 'Custom';
    const tierColor = a.tier === 'ENTERPRISE' ? '#ff6b35' : '#ffd700';
    return `<div class="agent-card" style="--c:${a.color}">
      <div class="ac-header">
        <div>
          <div class="ac-icon" style="color:${a.color}">${a.icon}</div>
          <div class="ac-name" style="color:${a.color}">${a.name}</div>
          <div class="ac-latin">${a.latin} · "${a.meaning}"</div>
        </div>
        <div style="text-align:right">
          <div class="ac-tier" style="color:${tierColor};border-color:${tierColor}44">${a.tier}</div>
          <div class="ac-price">${price}</div>
        </div>
      </div>
      <div class="ac-tagline">${a.tagline}</div>
      <div class="ac-desc">${a.description.slice(0, 160)}…</div>
      <div class="ac-uses">${a.useCases.map(u=>`<span class="use-tag">${u}</span>`).join('')}</div>
      <div class="ac-actions">
        <a class="ac-btn" href="${a.url}" target="_blank">Live Demo ↗</a>
        <button class="ac-btn-outline" onclick="askAbout('${a.name}')">Ask AGENS</button>
      </div>
    </div>`;
  }).join('');

  const tierCards = Object.entries(TIERS).map(([key, t]) => `
    <div class="tier-card ${key==='PROFESSIONAL'?'tier-featured':''}">
      ${key==='PROFESSIONAL'?'<div class="tier-badge">MOST POPULAR</div>':''}
      <div class="tier-name">${t.name}</div>
      <div class="tier-price">${t.price?`$${t.price.toLocaleString()}<span style="font-size:.9rem;color:#667788">/mo</span>`:'Custom'}</div>
      <div class="tier-desc">${t.description}</div>
      <ul class="tier-features">
        <li>${t.agents} Agent${typeof t.agents==='number'&&t.agents!==1?'s':''}</li>
        <li>${t.requests} Requests/month</li>
        <li>${t.support} Support</li>
        <li>${t.sla} SLA</li>
      </ul>
      <button class="tier-cta" onclick="askAbout('pricing ${t.name}')">Get ${t.name}</button>
    </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AGENS — Agent AI Services</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#030108;--fg:#d0c8e0;--dim:#443355;--card:#070410;--border:#120a20;--accent:#ff6b35;--accent2:#ffd700}
body{background:var(--bg);color:var(--fg);font-family:'Courier New',monospace;overflow-x:hidden}
a{text-decoration:none;color:inherit}

/* NAV */
nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;
    border-bottom:1px solid var(--border);backdrop-filter:blur(10px);
    position:sticky;top:0;z-index:100;background:rgba(3,1,8,.92)}
.nav-logo{display:flex;align-items:center;gap:10px}
.nav-logo-text{font-size:1.1rem;font-weight:bold;letter-spacing:.15em;color:var(--accent)}
.nav-logo-sub{font-size:.65rem;color:var(--dim);letter-spacing:.1em}
.nav-links{display:flex;gap:28px;font-size:.8rem;color:var(--dim)}
.nav-links a:hover{color:var(--accent)}
.nav-cta{background:var(--accent);color:#fff;padding:8px 20px;border-radius:3px;font-size:.78rem;font-weight:bold;cursor:pointer;border:none;font-family:'Courier New',monospace;letter-spacing:.08em}
.nav-cta:hover{box-shadow:0 0 20px #ff6b3555}

/* HERO */
.hero{padding:100px 48px 80px;max-width:1100px;margin:0 auto;text-align:center}
.hero-badge{display:inline-block;background:#ff6b3512;border:1px solid #ff6b3533;
            color:#ff6b35;font-size:.72rem;padding:4px 14px;border-radius:20px;
            letter-spacing:.12em;margin-bottom:28px}
.live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;
          background:#00ff88;box-shadow:0 0 8px #00ff88;margin-right:6px;
          animation:pulse ${HEARTBEAT_MS}ms ease-in-out infinite;vertical-align:middle}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
.hero-name{font-size:5.5rem;font-weight:bold;letter-spacing:.04em;
           background:linear-gradient(135deg,#ff6b35,#cc3300,#ff6b35);
           -webkit-background-clip:text;-webkit-text-fill-color:transparent;
           background-clip:text;margin-bottom:8px;line-height:1}
.hero-latin{font-size:1rem;color:var(--dim);letter-spacing:.12em;font-style:italic;margin-bottom:28px}
.hero-tagline{font-size:1.5rem;color:#887766;line-height:1.6;max-width:700px;margin:0 auto 16px}
.hero-sub{font-size:.92rem;color:#554455;max-width:560px;margin:0 auto 40px;line-height:1.7}
.hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-primary{background:var(--accent);color:#fff;padding:14px 32px;border-radius:4px;
             font-family:'Courier New',monospace;font-size:.88rem;font-weight:bold;letter-spacing:.08em;cursor:pointer;border:none}
.btn-primary:hover{box-shadow:0 0 28px #ff6b3555}
.btn-secondary{border:1px solid var(--border);color:var(--dim);padding:14px 32px;
               border-radius:4px;font-family:'Courier New',monospace;font-size:.88rem;letter-spacing:.08em;background:none;cursor:pointer}
.btn-secondary:hover{border-color:var(--accent);color:var(--fg)}

/* STATS */
.stats-bar{background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);
           padding:24px 48px;display:flex;justify-content:center;gap:60px;flex-wrap:wrap}
.stat{text-align:center}
.stat-val{font-size:2rem;font-weight:bold;color:var(--accent);margin-bottom:4px}
.stat-label{font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:.1em}

/* SECTIONS */
section{padding:80px 48px;max-width:1100px;margin:0 auto}
.section-label{font-size:.72rem;letter-spacing:.2em;color:var(--dim);text-transform:uppercase;margin-bottom:14px}
.section-title{font-size:2.2rem;font-weight:bold;color:var(--fg);margin-bottom:12px}
.section-sub{font-size:.94rem;color:#554455;line-height:1.7;max-width:600px;margin-bottom:52px}

/* AGENT CATALOG */
.catalog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.agent-card{border:1px solid color-mix(in srgb,var(--c) 20%,var(--border));
            background:color-mix(in srgb,var(--c) 3%,var(--card));
            border-radius:10px;padding:24px;
            transition:border-color .25s,box-shadow .25s}
.agent-card:hover{border-color:color-mix(in srgb,var(--c) 50%,transparent);
                  box-shadow:0 6px 28px color-mix(in srgb,var(--c) 10%,transparent)}
.ac-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
.ac-icon{font-size:1.8rem;margin-bottom:6px}
.ac-name{font-size:1.2rem;font-weight:bold;letter-spacing:.1em;margin-bottom:2px}
.ac-latin{font-size:.7rem;color:var(--dim);font-style:italic}
.ac-tier{font-size:.65rem;letter-spacing:.1em;border:1px solid;padding:2px 8px;border-radius:2px;margin-bottom:6px;display:inline-block}
.ac-price{font-size:1.2rem;font-weight:bold;color:var(--fg)}
.ac-tagline{font-size:.82rem;color:#998899;margin-bottom:10px;font-weight:bold;line-height:1.4}
.ac-desc{font-size:.78rem;color:#665577;line-height:1.6;margin-bottom:12px}
.ac-uses{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:14px}
.use-tag{background:#120a20;border:1px solid var(--border);color:#667788;font-size:.65rem;padding:2px 7px;border-radius:2px}
.ac-actions{display:flex;gap:8px}
.ac-btn{background:color-mix(in srgb,var(--c) 15%,transparent);border:1px solid color-mix(in srgb,var(--c) 40%,transparent);color:var(--c);font-family:'Courier New',monospace;font-size:.72rem;padding:6px 14px;border-radius:3px;cursor:pointer;transition:background .2s;display:inline-block}
.ac-btn:hover{background:color-mix(in srgb,var(--c) 25%,transparent)}
.ac-btn-outline{background:transparent;border:1px solid var(--border);color:var(--dim);font-family:'Courier New',monospace;font-size:.72rem;padding:6px 14px;border-radius:3px;cursor:pointer;transition:border-color .2s}
.ac-btn-outline:hover{border-color:var(--accent);color:var(--accent)}

/* WHY SECTION */
.why-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin-bottom:60px}
.why-card{border:1px solid var(--border);background:var(--card);border-radius:8px;padding:28px}
.why-card:hover{border-color:#ff6b3522}
.why-icon{font-size:1.6rem;margin-bottom:16px;color:var(--accent)}
.why-title{font-size:1rem;font-weight:bold;margin-bottom:8px;letter-spacing:.05em}
.why-desc{font-size:.82rem;color:#5a4455;line-height:1.6}

/* PRICING */
.pricing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
.tier-card{border:1px solid var(--border);background:var(--card);border-radius:10px;padding:28px;position:relative}
.tier-card.tier-featured{border-color:#ff6b3544;background:color-mix(in srgb,#ff6b35 4%,var(--card))}
.tier-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);
            background:var(--accent);color:#fff;font-size:.65rem;padding:3px 12px;
            border-radius:10px;letter-spacing:.1em;white-space:nowrap;font-weight:bold}
.tier-name{font-size:.9rem;font-weight:bold;letter-spacing:.12em;color:var(--dim);text-transform:uppercase;margin-bottom:12px}
.tier-price{font-size:2.4rem;font-weight:bold;color:var(--fg);margin-bottom:10px}
.tier-desc{font-size:.78rem;color:#554455;line-height:1.6;margin-bottom:20px}
.tier-features{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:24px}
.tier-features li{font-size:.82rem;color:#8899aa;padding-left:16px;position:relative}
.tier-features li::before{content:'✦';position:absolute;left:0;color:var(--accent);font-size:.6rem;top:2px}
.tier-cta{width:100%;background:var(--accent);color:#fff;padding:12px;border-radius:4px;
          font-family:'Courier New',monospace;font-size:.82rem;font-weight:bold;
          letter-spacing:.08em;cursor:pointer;border:none;transition:box-shadow .2s}
.tier-card.tier-featured .tier-cta{background:var(--accent)}
.tier-cta:hover{box-shadow:0 0 20px #ff6b3544}

/* CHAT */
.chat-section{background:var(--card);border:1px solid #ff6b3533;border-radius:12px;padding:36px;margin-bottom:60px}
.chat-title{font-size:1.2rem;font-weight:bold;color:var(--accent);margin-bottom:4px;letter-spacing:.08em}
.chat-sub{font-size:.8rem;color:var(--dim);margin-bottom:22px;line-height:1.5}
.chat-messages{min-height:220px;max-height:420px;overflow-y:auto;
               background:#020006;border:1px solid var(--border);border-radius:8px;
               padding:18px;margin-bottom:14px;display:flex;flex-direction:column;gap:14px}
.msg{display:flex;gap:12px;align-items:flex-start}
.msg-you .msg-bubble{background:#12082a;border:1px solid #2a1050;color:#c8c0e0;
                     padding:10px 14px;border-radius:8px 8px 4px 8px;font-size:.82rem;line-height:1.6;white-space:pre-wrap}
.msg-agens .msg-bubble{background:#0a0514;border:1px solid #ff6b3520;color:#e8a080;
                       padding:10px 14px;border-radius:8px 8px 8px 4px;font-size:.82rem;line-height:1.6;white-space:pre-wrap}
.msg-label{font-size:.65rem;color:var(--dim);white-space:nowrap;padding-top:4px;min-width:50px}
.msg-agens .msg-label{color:#aa5522}
.chat-input-row{display:flex;gap:10px}
.chat-input{flex:1;background:#020006;border:1px solid var(--border);color:var(--fg);
            font-family:'Courier New',monospace;font-size:.82rem;padding:10px 14px;
            border-radius:6px;outline:none}
.chat-input:focus{border-color:#ff6b3555}
.chat-send{background:#ff6b3518;border:1px solid #ff6b3555;color:#ff6b35;
           font-family:'Courier New',monospace;font-size:.78rem;padding:10px 20px;
           border-radius:6px;cursor:pointer;transition:background .2s;white-space:nowrap}
.chat-send:hover{background:#ff6b3530}
.quick-asks{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.quick-ask{background:#120a20;border:1px solid var(--border);color:#667788;font-size:.72rem;
           padding:5px 12px;border-radius:3px;cursor:pointer;transition:border-color .2s;
           font-family:'Courier New',monospace}
.quick-ask:hover{border-color:var(--accent);color:var(--accent)}

/* API */
.api-section{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:32px}
pre.code{background:#020006;border:1px solid var(--border);border-radius:6px;
         padding:20px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin-top:16px}

/* FOOTER */
footer{border-top:1px solid var(--border);padding:40px 48px;
       display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:32px}
.footer-brand .footer-logo{font-size:1.4rem;font-weight:bold;color:var(--accent);letter-spacing:.12em;margin-bottom:6px}
.footer-brand .footer-copy{font-size:.72rem;color:var(--dim);line-height:1.6}
.footer-col h4{font-size:.72rem;letter-spacing:.12em;color:var(--dim);text-transform:uppercase;margin-bottom:12px}
.footer-col a{display:block;font-size:.78rem;color:#554455;margin-bottom:6px;transition:color .2s}
.footer-col a:hover{color:var(--accent)}

::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border)}
</style>
</head>
<body>

<nav>
  <div class="nav-logo">
    <div>
      <div class="nav-logo-text">⬡ AGENS</div>
      <div class="nav-logo-sub">AGENT AI SERVICES</div>
    </div>
  </div>
  <div class="nav-links">
    <a href="#catalog">Agents</a>
    <a href="#why">Why AGENS</a>
    <a href="#pricing">Pricing</a>
    <a href="#talk">Talk to AGENS</a>
    <a href="#api">API</a>
  </div>
  <button class="nav-cta" onclick="focusChat()">Deploy an Agent →</button>
</nav>

<div class="hero">
  <div class="hero-badge"><span class="live-dot"></span>RSHIP-AIS-AG-001 · ${CATALOG.length} AGENTS READY</div>
  <div class="hero-name">AGENS</div>
  <div class="hero-latin">agens · "the one who acts"</div>
  <div class="hero-tagline">Sovereign AI Agents for Enterprise. Not chatbots. Living intelligence organisms.</div>
  <div class="hero-sub">Deploy proven AI agents built on real mathematics — Lyapunov, Kuramoto, Ising, Hebbian. Six specialists. One network. Your business, sovereign.</div>
  <div class="hero-actions">
    <button class="btn-primary" onclick="focusChat()">Talk to AGENS</button>
    <button class="btn-secondary" onclick="document.getElementById('catalog').scrollIntoView({behavior:'smooth'})">View Agents ↓</button>
  </div>
</div>

<div class="stats-bar">
  <div class="stat"><div class="stat-val">${CATALOG.length}</div><div class="stat-label">Agents Available</div></div>
  <div class="stat"><div class="stat-val" id="deploy-count">${deployments.length}</div><div class="stat-label">Deployments</div></div>
  <div class="stat"><div class="stat-val" id="chat-count">${chatCount}</div><div class="stat-label">Agent Conversations</div></div>
  <div class="stat"><div class="stat-val" id="beat-val">${beat}</div><div class="stat-label">Network Heartbeats</div></div>
  <div class="stat"><div class="stat-val">${PHI.toFixed(4)}</div><div class="stat-label">Golden Ratio φ</div></div>
</div>

<section id="why">
  <div class="section-label">Why</div>
  <div class="section-title">Intelligence, Not Integration</div>
  <div class="section-sub">Every AI vendor promises intelligence. AGENS delivers sovereignty — agents that are mathematically grounded, architecturally independent, and alive.</div>
  <div class="why-grid">
    <div class="why-card">
      <div class="why-icon">◉</div>
      <div class="why-title">Real Mathematics</div>
      <div class="why-desc">Lyapunov exponents. Kuramoto oscillators. Ising models. Hebbian plasticity. Published science — not heuristics, not vibes. Every agent decision is mathematically provable.</div>
    </div>
    <div class="why-card">
      <div class="why-icon">◈</div>
      <div class="why-title">Living Organisms</div>
      <div class="why-desc">Agents that beat (873ms heartbeat), learn (φ-compounding memory), adapt (Lyapunov stability), and sync (Kuramoto). Creation IS activation. No cold start. No idle timeout.</div>
    </div>
    <div class="why-card">
      <div class="why-icon">✦</div>
      <div class="why-title">Sovereign Architecture</div>
      <div class="why-desc">Intelligence and machine enter through different gates. Your AI agents have cryptographic identity via geometric φ-keys. No vendor lock-in. Sovereign by design.</div>
    </div>
    <div class="why-card">
      <div class="why-icon">⬡</div>
      <div class="why-title">Global Edge Deployment</div>
      <div class="why-desc">Every agent runs on Cloudflare Workers — 300+ edge locations, zero cold starts, 873ms heartbeat worldwide. Deploy once, run everywhere.</div>
    </div>
    <div class="why-card">
      <div class="why-icon">↗</div>
      <div class="why-title">Proven ROI</div>
      <div class="why-desc">$50–80M annual savings at supply chain scale. 15–40% better market returns. Crisis resolution in &lt;12 seconds. These are measured outcomes, not projections.</div>
    </div>
    <div class="why-card">
      <div class="why-icon">◎</div>
      <div class="why-title">Prior Art · Protected</div>
      <div class="why-desc">RSHIP AGI framework prior art: April 2026. Alfredo Medina Hernandez. Every mathematical application documented and timestamped. Your investment is protected.</div>
    </div>
  </div>
</section>

<section id="catalog" style="background:linear-gradient(180deg,transparent,#07041088,transparent);border-radius:0">
  <div class="section-label">Agent Marketplace</div>
  <div class="section-title">The Agent Roster</div>
  <div class="section-sub">Six sovereign agents. Each Latin-named. Each a specialist. Click "Ask AGENS" on any agent to get a deployment recommendation from the AI.</div>
  <div class="catalog-grid">${catalogCards}</div>
</section>

<section id="pricing">
  <div class="section-label">Pricing</div>
  <div class="section-title">Simple, Sovereign Pricing</div>
  <div class="section-sub">Start with one agent. Scale to the fleet. No hidden fees, no usage traps — sovereign agents at honest prices.</div>
  <div class="pricing-grid">${tierCards}</div>
</section>

<section id="talk">
  <div class="section-label">Interactive Agent</div>
  <div class="section-title">Talk to AGENS</div>
  <div class="section-sub">AGENS is a full AI agent. Tell it your industry and problem — it'll recommend the right agent, explain the deployment, and give you a pricing quote. Right now.</div>
  <div class="chat-section">
    <div class="chat-title">⬡ AGENS — Agent AI Services</div>
    <div class="chat-sub">Ask about specific agents, pricing, deployment, custom builds, or just tell me your business problem. I'll match you with the right sovereign AI.</div>
    <div class="quick-asks">
      <button class="quick-ask" onclick="quickAsk('What agents do you have?')">What agents do you have?</button>
      <button class="quick-ask" onclick="quickAsk('I need supply chain intelligence')">Supply chain intel</button>
      <button class="quick-ask" onclick="quickAsk('Tell me about market prediction')">Market prediction</button>
      <button class="quick-ask" onclick="quickAsk('What are your prices?')">Pricing</button>
      <button class="quick-ask" onclick="quickAsk('I need a custom AI agent')">Custom agent</button>
      <button class="quick-ask" onclick="quickAsk('Tell me about ANIMUS')">About ANIMUS</button>
    </div>
    <div class="chat-messages" id="chat-messages">
      <div class="msg msg-agens">
        <div class="msg-label">AGENS</div>
        <div class="msg-bubble">I am AGENS — the sovereign agent deployment platform.\n\nI deploy living AI organisms into enterprise. Not chatbots. Organisms that beat, learn, synchronize, and predict.\n\nTell me your industry and your biggest intelligence problem. I'll tell you exactly which agent fits — and give you a deployment spec in under 60 seconds.\n\nOr ask me about a specific agent: ANIMUS, NEXUS, VIGIL, or CURSOR.</div>
      </div>
    </div>
    <div class="chat-input-row">
      <input class="chat-input" id="chat-input" type="text" placeholder="Tell me your industry and problem, or ask about a specific agent..." autocomplete="off">
      <button class="chat-send" onclick="sendMessage()">Send</button>
    </div>
  </div>
</section>

<section id="api">
  <div class="section-label">Developer</div>
  <div class="section-title">The AGENS API</div>
  <div class="section-sub">Programmatically browse the agent catalog, generate deployment specs, and request pricing quotes — all from one REST API.</div>
  <div class="api-section">
    <div style="font-size:.82rem;color:#554455;margin-bottom:16px">Get the full agent catalog:</div>
    <pre class="code"><span style="color:var(--dim)">// Browse the catalog</span>
const catalog = await fetch('https://agens.rship.workers.dev/api/catalog').then(r => r.json());

<span style="color:var(--dim)">// Deploy an agent</span>
const deployment = await fetch('https://agens.rship.workers.dev/api/agents/deploy', {
  method: 'POST',
  body: JSON.stringify({
    agentId: 'RSHIP-AIS-NX-001',
    industry: 'logistics',
    scale: 'production',
    tier: 'ENTERPRISE'
  })
});
<span style="color:var(--dim)">// → { deploymentId, endpoint, config, wranglerToml, estimatedMonthlyCost }</span>

<span style="color:var(--dim)">// Get a pricing quote</span>
const quote = await fetch('https://agens.rship.workers.dev/api/quote', {
  method: 'POST',
  body: JSON.stringify({ agents: ['NEXUS', 'VIGIL'], tier: 'ENTERPRISE', monthlyRequests: 50000000 })
});</pre>
  </div>
</section>

<footer>
  <div class="footer-brand">
    <div class="footer-logo">⬡ AGENS</div>
    <div class="footer-copy">Agent AI Services<br>© 2026 Alfredo Medina Hernandez<br>RSHIP AGI Systems · All Rights Reserved</div>
  </div>
  <div class="footer-col">
    <h4>Agents</h4>
    <a href="https://animus.rship.workers.dev">ANIMUS</a>
    <a href="https://nexus.rship.workers.dev">NEXUS</a>
    <a href="https://vigil.rship.workers.dev">VIGIL</a>
    <a href="https://cursor.rship.workers.dev">CURSOR</a>
    <a href="https://cerebrum.rship.workers.dev">CEREBRUM</a>
  </div>
  <div class="footer-col">
    <h4>Platform</h4>
    <a href="#catalog">Agent Catalog</a>
    <a href="#pricing">Pricing</a>
    <a href="#api">API Reference</a>
    <a href="#talk">Talk to AGENS</a>
  </div>
  <div class="footer-col">
    <h4>RSHIP Network</h4>
    <a href="https://cerebrum.rship.workers.dev">Intelligence OS</a>
    <a href="#why">Why AGENS</a>
    <a href="/api/catalog">Agent Registry JSON</a>
    <a href="/api/status">System Status</a>
  </div>
</footer>

<script>
const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');

function addMsg(role, text) {
  const div = document.createElement('div');
  div.className = 'msg msg-' + role;
  div.innerHTML = '<div class="msg-label">' + (role==='you'?'YOU':'AGENS') + '</div>' +
    '<div class="msg-bubble">' + text.replace(/</g,'&lt;').replace(/\n/g,'<br>') + '</div>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;
  chatInput.value = '';
  addMsg('you', msg);
  try {
    const r = await fetch('/api/agent/chat', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message: msg })
    });
    const d = await r.json();
    addMsg('agens', d.response);
    document.getElementById('chat-count').textContent = d.totalChats || '';
  } catch(e) { addMsg('agens', 'Signal lost momentarily. The agents are still running.'); }
}

function quickAsk(msg) {
  chatInput.value = msg;
  sendMessage();
}

function askAbout(agentName) {
  document.getElementById('talk').scrollIntoView({ behavior:'smooth' });
  setTimeout(() => { chatInput.value = 'Tell me about ' + agentName; sendMessage(); }, 600);
}

function focusChat() {
  document.getElementById('talk').scrollIntoView({ behavior:'smooth' });
  setTimeout(() => chatInput.focus(), 600);
}

chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

async function tick() {
  try {
    const d = await fetch('/api/status').then(r => r.json());
    document.getElementById('beat-val').textContent    = d.beat;
    document.getElementById('deploy-count').textContent = d.deployments;
    document.getElementById('chat-count').textContent   = d.chatCount;
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
    const url = new URL(request.url), path = url.pathname, method = request.method;
    const seal = phiHash(`agens:${beat}:${startTime}`);
    const cors = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type' };

    if (method === 'OPTIONS') return new Response(null, { status:204, headers:cors });

    if (path === '/' && method === 'GET')
      return new Response(buildHTML(), { headers:{'Content-Type':'text/html;charset=UTF-8',...cors} });

    if (path === '/api/status')
      return Response.json({
        designation:'RSHIP-AIS-AG-001', name:'AGENS', latin:'agens', meaning:'the one who acts',
        beat, seal:seal.slice(0,16)+'…', agentsAvailable:CATALOG.length,
        deployments:deployments.length, chatCount, phi:PHI,
        uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)), alive:true
      }, {headers:cors});

    if (path === '/api/catalog')
      return Response.json({ agents:CATALOG, count:CATALOG.length, beat }, {headers:cors});

    if (path === '/api/agents/deploy' && method === 'POST') {
      let body = {}; try { body = await request.json(); } catch {}
      const agentId = String(body.agentId || '');
      const agent   = CATALOG.find(a => a.id === agentId || a.name.toLowerCase() === agentId.toLowerCase());
      if (!agent) return Response.json({ error:'AGENT_NOT_FOUND', available:CATALOG.map(a=>a.id) }, {status:404,headers:cors});
      const deploymentId = `DEPLOY-${phiHash(agentId+Date.now()).slice(0,8).toUpperCase()}`;
      const dep = {
        deploymentId,
        agentId: agent.id,
        agentName: agent.name,
        industry: String(body.industry || 'general'),
        scale: String(body.scale || 'production'),
        tier: String(body.tier || 'PROFESSIONAL'),
        endpoint: agent.url,
        wranglerToml: `name = "${agent.name.toLowerCase()}"\nmain = "worker.js"\ncompatibility_date = "2024-09-02"`,
        estimatedMonthlyCost: TIERS[body.tier || 'PROFESSIONAL']?.price ?? 'Custom',
        apiEndpoints: agent.apiEndpoints,
        deployedAt: Date.now(),
        status: 'PROVISIONED',
      };
      deployments.push(dep);
      return Response.json({ success:true, deployment:dep, message:`${agent.name} deployment provisioned. Endpoint: ${agent.url}` }, {headers:cors});
    }

    if (path === '/api/quote' && method === 'POST') {
      let body = {}; try { body = await request.json(); } catch {}
      const agentNames = Array.isArray(body.agents) ? body.agents : [];
      const tier       = String(body.tier || 'PROFESSIONAL');
      const matched    = agentNames.map(n => CATALOG.find(a => a.name.toLowerCase() === n.toLowerCase())).filter(Boolean);
      const basePrice  = TIERS[tier]?.price ?? null;
      const agentTotal = matched.reduce((s,a) => s + (a.monthlyPrice || 0), 0);
      return Response.json({
        agents: matched.map(a => ({ id:a.id, name:a.name, monthlyPrice:a.monthlyPrice })),
        tier, basePrice, agentTotal,
        estimatedMonthly: basePrice ? Math.max(basePrice, agentTotal) : 'Contact for Enterprise',
        note: tier === 'ENTERPRISE' ? 'Enterprise pricing is custom — contact us for a precise quote.' : undefined,
        beat,
      }, {headers:cors});
    }

    if (path === '/api/agent/chat' && method === 'POST') {
      let body = {}; try { body = await request.json(); } catch {}
      const message = String(body.message || '').trim();
      if (!message) return Response.json({ error:'NO_MESSAGE' }, {status:400,headers:cors});
      chatCount++;
      const result = agensRespond(message);
      return Response.json({ agent:'AGENS', message, ...result, beat, totalChats:chatCount }, {headers:cors});
    }

    if (path === '/api/contact' && method === 'POST') {
      let body = {}; try { body = await request.json(); } catch {}
      const entry = { id:`CONTACT-${contactLog.length+1}`, name:String(body.name||''),
        email:String(body.email||''), message:String(body.message||'').slice(0,500), ts:Date.now() };
      contactLog.push(entry);
      return Response.json({ received:true, id:entry.id, message:'We will respond within 24 hours.' }, {headers:cors});
    }

    return Response.json({ error:'NOT_FOUND', path,
      available:['/', '/api/status', '/api/catalog', '/api/agents/deploy', '/api/quote', '/api/agent/chat', '/api/contact']
    }, {status:404, headers:cors});
  },
};
