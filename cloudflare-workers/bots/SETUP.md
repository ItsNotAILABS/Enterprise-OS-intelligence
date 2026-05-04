# RSHIP Slack Bots — Complete Setup Guide
## You're live in 10 minutes.

---

## How Slack Slash Commands Work

**You just type a command in any Slack message box and press Enter.** That's it. No code, no buttons.

```
/org brief        ← type this in any channel → press Enter → bot replies instantly
/task new INCIDENT client=AcmeCorp
/announce all 🚀 We're live.
```

The bot (`@RSHIP`) appears in the channel and responds. Works in DMs too.
The only one-time setup: wiring the worker URLs in the Slack app settings (Steps 3–4 below).

---

## Option A — Auto-Deploy via GitHub Actions (Recommended — No manual deploy ever again)

Set these 4 secrets in your GitHub repo (**Settings → Secrets and variables → Actions → New repository secret**):

| Secret | How to get it |
|--------|---------------|
| `CLOUDFLARE_API_TOKEN` | [dash.cloudflare.com](https://dash.cloudflare.com) → My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | [dash.cloudflare.com](https://dash.cloudflare.com) → any zone → Overview → scroll right sidebar |
| `SLACK_BOT_TOKEN` | api.slack.com/apps → your app → OAuth & Permissions → Bot User OAuth Token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | api.slack.com/apps → your app → Basic Information → Signing Secret |

That's it. Every push to `main` that touches `cloudflare-workers/` auto-deploys everything.
Or manually trigger: **Actions → RSHIP — Auto-Deploy Cloudflare Workers → Run workflow**.

---

## Option B — Deploy Manually (One-time)



1. Go to **[api.slack.com/apps](https://api.slack.com/apps)** → **Create New App** → **From an app manifest**
2. Select your workspace
3. Paste the contents of [`slack-app-manifest.json`](./slack-app-manifest.json) into the YAML/JSON editor
4. Click **Create**
5. Click **Install to Workspace** → **Allow**

Done. Your Slack app now has `/rship`, `/org`, `/announce`, and `/task` commands registered.

---

## Step 2 — Deploy the Workers (5 min)

You need [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and a Cloudflare account.

### Deploy HERALD (`/rship` commands)

```bash
cd cloudflare-workers/bots/herald

# Set your secrets (from Step 3 below)
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN

# Deploy
wrangler deploy
```

Note the deployed URL: `https://rship-herald.YOUR-SUBDOMAIN.workers.dev`

### Deploy IMPERIUM (`/org` commands)

```bash
cd cloudflare-workers/bots/imperium

wrangler secret put SLACK_SIGNING_SECRET   # same as above
wrangler secret put SLACK_BOT_TOKEN        # same as above

wrangler deploy
```

URL: `https://rship-imperium.YOUR-SUBDOMAIN.workers.dev`

### Deploy NUNTIUS (broadcasts + `/announce`)

```bash
cd cloudflare-workers/bots/nuntius

wrangler secret put SLACK_SIGNING_SECRET   # same as above
wrangler secret put SLACK_BOT_TOKEN        # same as above
wrangler secret put NUNTIUS_OPS_CHANNEL    # e.g. C0123456789 (channel ID for #rship-ops)
wrangler secret put NUNTIUS_MARKET_CHANNEL # channel ID for #rship-market
wrangler secret put NUNTIUS_ALERTS_CHANNEL # channel ID for #rship-alerts

wrangler deploy
```

### Deploy ARBITER (`/task` — workflow & task orchestration)

```bash
cd cloudflare-workers/bots/arbiter

wrangler secret put SLACK_SIGNING_SECRET   # same as above
wrangler secret put SLACK_BOT_TOKEN        # same as above

wrangler deploy
```

URL: `https://rship-arbiter.YOUR-SUBDOMAIN.workers.dev`

### Deploy PULSE + SENTINEL (optional — scheduled reports + alerts)

```bash
cd cloudflare-workers/bots/pulse
wrangler secret put PULSE_WEBHOOK_SLACK   # from Step 4
wrangler deploy

cd ../sentinel
wrangler secret put SENTINEL_SLACK_WEBHOOK  # from Step 4
wrangler deploy
```

---

## Step 3 — Get Your Slack Secrets (2 min)

In your Slack app at [api.slack.com/apps](https://api.slack.com/apps):

| Secret | Where to find it |
|--------|-----------------|
| `SLACK_SIGNING_SECRET` | **Basic Information** → App Credentials → Signing Secret |
| `SLACK_BOT_TOKEN` | **OAuth & Permissions** → Bot User OAuth Token (`xoxb-...`) |

---

## Step 4 — Wire Slash Commands to Workers (3 min)

In your Slack app → **Slash Commands** → edit each command:

| Command | Request URL |
|---------|-------------|
| `/rship` | `https://rship-herald.YOUR-SUBDOMAIN.workers.dev/slack/command` |
| `/org` | `https://rship-imperium.YOUR-SUBDOMAIN.workers.dev/slack/command` |
| `/announce` | `https://rship-nuntius.YOUR-SUBDOMAIN.workers.dev/slack/command` |
| `/task` | `https://rship-arbiter.YOUR-SUBDOMAIN.workers.dev/slack/command` |

In **Event Subscriptions** → **Request URL**:
```
https://rship-herald.YOUR-SUBDOMAIN.workers.dev/slack/events
```
Subscribe to bot events: `app_mention`, `message.im`

Click **Save Changes** → Slack will verify the endpoint (your deployed worker handles this automatically).

---

## Step 5 — Create Slack Channels

Create these channels in your workspace (or use existing ones):

| Channel | Purpose |
|---------|---------|
| `#rship-ops` | Operations briefings, agent status, enterprise commands |
| `#rship-market` | Market intelligence, VIGIL regime updates |
| `#rship-alerts` | SENTINEL threshold alerts, disruption warnings |
| `#rship-intel` | General RSHIP intelligence output |

Get channel IDs: Right-click channel → **View channel details** → copy ID at bottom (`C0123456789`).

---

## Step 6 — Get Slack Incoming Webhooks (for PULSE + NUNTIUS)

In your Slack app → **Incoming Webhooks** → **Activate** → **Add New Webhook** → select channel.

Copy the webhook URL (`https://hooks.slack.com/services/...`) and use as `PULSE_WEBHOOK_SLACK` / `SENTINEL_SLACK_WEBHOOK`.

---

## You're Done. Here's What You Can Now Do:

### In any Slack channel:

```
/rship status           → Full RSHIP network health
/rship market SPY       → VIGIL market regime + action
/rship supply           → NEXUS network overview
/rship ask [anything]   → AGENS master agent answers

/org brief              → Full enterprise morning briefing
/org agents             → All 6 RSHIP agents + status
/org market BTC         → Market intelligence
/org alert              → Recent SENTINEL alerts
/org report market      → Trigger PULSE market report
/org speak #rship-ops Today we're live.  → Broadcast to channel

/announce #rship-market VIGIL is now watching BTC.  → Direct broadcast

/task new DEPLOYMENT agent=CEREBRUM     → 7-step agent deployment workflow
/task new INCIDENT client=AcmeCorp      → Full incident response pipeline
/task new ONBOARDING name="Acme Inc"    → Enterprise onboarding workflow
/task new ENTERPRISE_INTAKE             → Sales pipeline
/task new MARKET_BRIEF                  → Market intelligence workflow
/task workflows                         → See all active workflows
/task done T-1ABC230-0001 deployed ok   → Complete task → auto-advances workflow
/task assign T-1ABC230-0001 Freddy      → Assign task to someone
/task report                            → Full enterprise report with φ-health score
/task templates                         → See all 5 workflow templates with step graphs
```

---

## Troubleshooting

**"dispatch_failed" from Slack** — Your worker URL isn't responding. Run `wrangler dev` locally and test with curl.

**"invalid_signature"** — `SLACK_SIGNING_SECRET` is wrong. Re-run `wrangler secret put SLACK_SIGNING_SECRET`.

**Slash command not appearing** — Reinstall the app: **Install App** → **Reinstall to Workspace**.

**Bot can't post to channel** — Invite the bot: `/invite @RSHIP` in the channel.

---

## One-liner test (no Slack needed)

```bash
# Test HERALD is alive
curl https://rship-herald.YOUR-SUBDOMAIN.workers.dev/api/status

# Test IMPERIUM
curl https://rship-imperium.YOUR-SUBDOMAIN.workers.dev/api/status

# Test ARBITER + see all workflows
curl https://rship-arbiter.YOUR-SUBDOMAIN.workers.dev/api/workflows
curl https://rship-arbiter.YOUR-SUBDOMAIN.workers.dev/api/report

# Manually trigger a PULSE report
curl -X POST https://rship-pulse.YOUR-SUBDOMAIN.workers.dev/report/trigger \
  -H "Content-Type: application/json" \
  -d '{"type":"market"}'
```

---

© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved
