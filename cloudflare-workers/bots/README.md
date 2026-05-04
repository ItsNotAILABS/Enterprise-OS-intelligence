# RSHIP Bot Fleet — Cloudflare Worker Bots

> **Type:** BOT — distinct from the AI Agent workers (CEREBRUM, ANIMUS, NEXUS, VIGIL, CURSOR, AGENS)
> **Runtime:** Cloudflare Workers Edge Network · Deploy with `wrangler deploy`
> **Owner:** RSHIP AGI Systems · © 2026 Alfredo Medina Hernandez

---

## Bot Roster

| Bot | Designation | Type | Description |
|-----|-------------|------|-------------|
| [HERALD](./herald/) | `RSHIP-BOT-HLD-001` | Slack Bot | `/rship` slash command — delivers live RSHIP intelligence into any Slack workspace |
| [CONDUIT](./conduit/) | `RSHIP-BOT-CDT-001` | Workflow Bus | Webhook message router — route events to any RSHIP agent, broadcast, chain pipelines |
| [PULSE](./pulse/) | `RSHIP-BOT-PLS-001` | Cron Bot | Scheduled intelligence reports — market, supply chain, network digest → Slack + Discord |
| [SENTINEL](./sentinel/) | `RSHIP-BOT-SNT-001` | Alert Bot | Real-time threshold monitoring — fires alerts when chaos, disruptions, or signals trigger |

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

## CONDUIT — Workflow Message Bus

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
