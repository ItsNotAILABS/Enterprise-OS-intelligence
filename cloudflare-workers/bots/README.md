# RSHIP Bot Fleet — Cloudflare Worker Bots

> **Type:** BOT — distinct from the AI Agent workers (CEREBRUM, ANIMUS, NEXUS, VIGIL, CURSOR, AGENS)
> **Runtime:** Cloudflare Workers Edge Network · Deploy with `wrangler deploy`
> **Owner:** RSHIP AGI Systems · © 2026 Alfredo Medina Hernandez

**→ [SETUP.md](./SETUP.md) — Complete setup guide. You're live in 10 minutes.**

---

## Bot Roster

| Bot | Designation | Type | Description |
|-----|-------------|------|-------------|
| [HERALD](./herald/) | `RSHIP-BOT-HLD-001` | Slack Bot | `/rship` slash command — intelligence queries (market, supply, flight, status, ask) |
| [IMPERIUM](./imperium/) | `RSHIP-BOT-IMP-001` | Enterprise Control | `/org` slash command — run the entire RSHIP Organism from Slack |
| [NUNTIUS](./nuntius/) | `RSHIP-BOT-NNT-001` | Broadcast Bot | `/announce` + auto morning/evening briefings → all configured channels |
| [CONDUIT](./conduit/) | `RSHIP-BOT-CDT-001` | Workflow Bus | Webhook message router — route events to any RSHIP agent, broadcast, chain pipelines |
| [PULSE](./pulse/) | `RSHIP-BOT-PLS-001` | Cron Bot | Scheduled intelligence reports — market, supply chain, network digest → Slack + Discord |
| [SENTINEL](./sentinel/) | `RSHIP-BOT-SNT-001` | Alert Bot | Real-time threshold monitoring — fires alerts when chaos, disruptions, or signals trigger |

**Quick deploy (just the Slack bots):**
```bash
cd cloudflare-workers/bots && npm run deploy:slack
```

---

## HERALD — Slack Slash Command Bot

```bash
cd herald
wrangler secret put SLACK_SIGNING_SECRET   # From Slack app settings
wrangler secret put SLACK_BOT_TOKEN        # Bot OAuth token (xoxb-...)
wrangler deploy
```

**Commands in Slack:**
```
/rship status               → Full network health (all 6 agents)
/rship market SPY           → VIGIL market regime + action
/rship flight LHR-LAX       → CURSOR flight price prediction
/rship supply PORT-SHA      → NEXUS supply chain node status
/rship ask what is ANIMUS?  → AGENS master agent answers
/rship help                 → Command reference
```

---

## IMPERIUM — Enterprise Command Center

```bash
cd imperium
wrangler secret put SLACK_SIGNING_SECRET   # From Slack app settings
wrangler secret put SLACK_BOT_TOKEN        # Bot OAuth token (xoxb-...)
wrangler secret put IMPERIUM_OPS_CHANNEL   # Default channel ID for /org speak
wrangler deploy
```

**Run the entire organism from Slack:**
```
/org brief               → Full executive briefing: organism + market + supply chain
/org agents              → All 6 RSHIP agents with live status
/org ping                → Network ping — all agents respond with latency
/org market BTC          → VIGIL market regime + action + confidence
/org supply              → NEXUS network + all disruptions
/org deploy CEREBRUM     → AGENS deployment spec for any agent
/org alert HIGH          → SENTINEL recent alerts filtered by severity
/org report network      → Trigger PULSE network digest
/org speak #rship-ops We're live.  → Broadcast message to any channel
/org help                → Full command reference
```

---

## NUNTIUS — Broadcast & Announcement Bot

```bash
cd nuntius
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put NUNTIUS_OPS_CHANNEL       # #rship-ops channel ID (C0123...)
wrangler secret put NUNTIUS_MARKET_CHANNEL    # #rship-market channel ID
wrangler secret put NUNTIUS_ALERTS_CHANNEL    # #rship-alerts channel ID
wrangler secret put NUNTIUS_INTEL_CHANNEL     # #rship-intel channel ID
wrangler deploy
```

**Broadcast from Slack:**
```
/announce Today we ship.                          → Post to #rship-ops
/announce #rship-market BTC is STABLE.            → Post to specific channel
/announce all RSHIP Organism is now fully live.   → Post to ALL channels at once
/announce brief                                   → Post live enterprise briefing NOW
```

**Auto briefings (no human needed):**
- 09:00 UTC Mon–Fri → Morning enterprise briefing → `#rship-ops`
- 17:00 UTC Mon–Fri → End-of-day summary → `#rship-ops`

**API (CONDUIT/IMPERIUM can call this):**
```json
POST /broadcast/ops     { "text": "Supply chain disruption resolved." }
POST /broadcast/all     { "title": "Alert", "text": "Network entering CHAOTIC regime." }
POST /broadcast/market  { "text": "SPY — BUY_NOW signal at 94% confidence." }
```

---

```bash
cd conduit
wrangler secret put CONDUIT_AUTH_TOKEN     # Optional API auth
wrangler secret put SLACK_WEBHOOK_URL      # Default Slack webhook
wrangler secret put DISCORD_WEBHOOK_URL    # Default Discord webhook
wrangler deploy
```

**Route events to RSHIP agents:**
```json
POST /route
{
  "route": "vigil.predict",
  "payload": { "symbol": "SPY" },
  "destination": "slack"
}
```

**18 registered RSHIP routes** covering CEREBRUM, VIGIL, NEXUS, CURSOR, ANIMUS, AGENS.

---

## PULSE — Scheduled Intelligence Reports

```bash
cd pulse
wrangler secret put PULSE_WEBHOOK_SLACK    # Slack incoming webhook
wrangler secret put PULSE_WEBHOOK_DISCORD  # Discord webhook
wrangler deploy
```

**Cron Schedule:**
- `0 * * * *` — Every hour: market pulse
- `0 9 * * 1-5` — 09:00 UTC Mon–Fri: market open briefing
- `0 0 * * *` — Midnight UTC daily: full intelligence digest

**Manual trigger:**
```json
POST /report/trigger
{ "type": "market", "destination": "slack" }
```

---

## SENTINEL — Real-Time Alert Bot

```bash
cd sentinel
wrangler secret put SENTINEL_SLACK_WEBHOOK    # Slack webhook
wrangler secret put SENTINEL_DISCORD_WEBHOOK  # Discord webhook
wrangler deploy
```

**Scans every 5 minutes. Default alert rules:**
- 🔴 `R-001` — Market chaos: ≥ 3 instruments in CHAOTIC regime (HIGH)
- 🚨 `R-002` — Supply disruption: active NEXUS disruptions (HIGH)
- ⚡ `R-003` — Network desync: Kuramoto R < 0.5 (MEDIUM)
- 📈 `R-004` — High-confidence signal: VIGIL confidence ≥ 92% (LOW)
- 📦 `R-005` — Low capacity: NEXUS node < 55% (MEDIUM)

**Test your setup:**
```
POST /webhook/test  → Fires a test alert to all configured webhooks
```

---

## Architecture

```
RSHIP Agent Network (AI Agents)          RSHIP Bot Fleet
┌─────────────────────────────┐          ┌──────────────────────────────┐
│  ◎ CEREBRUM  Intelligence OS│◄─────────│  ◎ HERALD   Slack slash cmd  │
│  ✦ ANIMUS    AI Interface   │          │  ⬡ CONDUIT  Workflow bus      │
│  ⬡ NEXUS     Supply Chain   │◄─────────│  ◉ PULSE    Cron reports      │
│  ◉ VIGIL     Market Sentinel│◄─────────│  ◉ SENTINEL Alert monitor     │
│  ↗ CURSOR    Travel AI      │          └──────────────────────────────┘
│  ⬡ AGENS     Agent Services │                         │
└─────────────────────────────┘                         ▼
                                           Slack · Discord · Webhooks
```

> **AI Agents** = sovereign intelligence organisms (RSHIP-AIS-*)
> **Bots** = integration layer — they consume agents and deliver results (RSHIP-BOT-*)

---

© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved
