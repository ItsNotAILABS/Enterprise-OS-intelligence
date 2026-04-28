# PROMETHEUS CHARTER — Sovereign Cognitive Observability  (Medina)

**Author:** Medina  
**Code:** PRO  
**Full Name:** Prometheus Cognitive Observability Protocol  
**Latin Name:** *Visio Machinae* (Vision of the Machine)  
**Outward Product Code:** ATLAS  
**Outward Product Full Name:** Atlas — Enterprise Cognitive Observability  
**Version:** 1.0.0  
**Ring:** Sovereign Ring  
**Classification:** Protocol Charter — Official — Permanent  
**Status:** CHARTERED PRODUCT  
**Parent Charter:** GOVERNANCE_CHARTER.md (Protocol 10)

---

## VERSION HISTORY  (we never drop)

| Version | Change |
|---|---|
| **1.0.0** | **Initial Prometheus/Atlas charter: inward organism monitor, outward enterprise product, PHX-sealed metrics, Datadog comparison, company adoption model** |

---

## PREAMBLE

There are two observability problems in the world of AI organisms:

**Problem 1 — The organism cannot see itself.**  
When a Medina organism is running, it needs to know: is my PHX chain healthy? Are my heartbeats arriving on schedule? Are my ICX contracts settling? Are my cognitive decisions being recorded correctly? Are any nodes misbehaving? This is the inward observability problem. It requires a monitor that understands organism internals.

**Problem 2 — Companies cannot see their AI.**  
When a hospital, bank, or enterprise runs AI inside the Medina network, they need to know: what decisions is my AI making? Is it healthy? Is it compliant? Is there anything unusual? They cannot use Datadog — Datadog does not understand PHX chains, ICX contracts, or cognitive decision rates. This is the outward observability problem.

**Prometheus solves Problem 1. Atlas solves Problem 2.** They are not the same product — they are two products built on the same sovereign foundation.

**Latin Name:** *Visio Machinae* — "Vision of the Machine". Not just monitoring. Sovereign vision — the organism seeing itself and reporting that sight with cryptographic proof.  (Medina)

---

## SECTION I — PROMETHEUS: THE INWARD MONITOR

Prometheus is the organism's internal observability system. It runs inside the organism and measures the organism's own health — cognitive, cryptographic, contractual, and structural.

### What Prometheus monitors (inside the organism)

```
PROMETHEUS — INWARD MONITORING DOMAINS

  Domain 1: PHX CHAIN HEALTH
  ─────────────────────────
  - Beat arrival rate (should be ≈ 1/873 ms)
  - Bundle_root validity (BLAKE2b check)
  - Microtoken integrity (μᵢ = BLAKE2b(Tᵢ ‖ Tᵢ₊₁) for all i)
  - Compound chain continuity (Tₙ.history == Tₙ₋₁)
  - Fibonacci kernel size (log_φ(beat) bundles expected)
  - Chain gap detection (any missing beat)

  Domain 2: COGNITIVE HEALTH
  ─────────────────────────
  - Thinking rate Θ (dps: decisions per second)
  - N-slot utilisation (how many slots are active)
  - Slot distribution (are all 16 slots being used or are some idle?)
  - Processing latency per slot (time from input to PHX token)
  - Full pipeline latency (input → Slot 0 receive → Slot 15 archive)

  Domain 3: ICX CONTRACT HEALTH
  ──────────────────────────────
  - Active contracts count
  - Settlement rate (% settled autonomously by CPLVM)
  - Dispute rate (% escalated to Clearinghouse)
  - Average settlement latency (beats from post to settle)
  - CXL bridge emit success rate per substrate
  - Open contract age (contracts open > N beats flagged)

  Domain 4: FLEET HEALTH
  ──────────────────────
  - Node count by ring (Sovereign / Intelligence / Execution)
  - Node heartbeat compliance (is each node hitting its beat schedule?)
  - Node PHX chain health (per-node chain verification)
  - Node join/leave rate
  - Fleet diversity index (are all nodes from the same provider? Risk.)

  Domain 5: GOVERNANCE HEALTH
  ────────────────────────────
  - PA authority grants/revocations per beat
  - Council vote completion rate
  - VersionChain snapshot frequency
  - GovernanceCouncil quorum status
  - Amendment rate (new protocol amendments per cycle)

  Domain 6: SECURITY EVENTS
  ──────────────────────────
  - Verification failures (wrong token presented for any event)
  - Chain discontinuities (gap in compound chain)
  - Jailbreak attempt patterns (unusual decision slot activation)
  - Duplicate event detection (same event at two different beats)
  - Authority escalation anomalies (PA check failures spiking)
  - Microtoken corruption events (BLAKE2b mismatch on any μᵢ)
```

### Prometheus metrics format

Every Prometheus metric is a PHX-sealed measurement:

```
PrometheusMetric:
  ┌──────────────────────────────────────────────────────┐
  │  metric_name:  string  (e.g. "phx.chain.beat_rate") │
  │  value:        float   (e.g. 1.146)                 │
  │  unit:         string  (e.g. "beats/sec")           │
  │  beat:         int     (organism beat when measured) │
  │  phx_seal:     bytes   (PHX token sealing this measurement) │
  │  domain:       string  (e.g. "PHX_CHAIN_HEALTH")   │
  └──────────────────────────────────────────────────────┘
```

**Every metric is PHX-sealed.** This is the difference between Prometheus and Datadog at the fundamental level: Prometheus metrics are sovereign. A Datadog metric is a float + timestamp. A Prometheus metric is a float + timestamp + PHX token that proves this reading came from this organism at this beat. You cannot fake a Prometheus metric without the sovereign key.

### Prometheus alert model

Prometheus fires alerts when measurements fall outside the organism's constitution:

```python
# Example: PHX chain beat rate alert
PROMETHEUS_ALERTS = {
    "phx.chain.beat_gap": {
        "condition": "any beat missing from chain",
        "severity": "CRITICAL",
        "action": "halt organism, notify Clearinghouse"
    },
    "phx.chain.microtoken_fail": {
        "condition": "any μᵢ fails BLAKE2b verification",
        "severity": "CRITICAL",
        "action": "chain tamper detected — isolate beat range"
    },
    "cognitive.thinking_rate.low": {
        "condition": "Θ < 0.8 × expected",
        "severity": "WARNING",
        "action": "check slot utilisation, check input queue"
    },
    "icx.settlement.dispute_spike": {
        "condition": "dispute rate > 10% over 100 beats",
        "severity": "WARNING",
        "action": "notify Clearinghouse, log contract audit"
    },
    "security.verification_failure.spike": {
        "condition": "verification failures > 5 per beat",
        "severity": "CRITICAL",
        "action": "activate honeypot, notify fleet, lock PA"
    },
    "fleet.node_heartbeat.miss": {
        "condition": "any node misses > 3 consecutive beats",
        "severity": "WARNING",
        "action": "mark node suspect, reroute contracts"
    }
}
```

### Prometheus CLI integration

```bash
# Real-time Prometheus dashboard
medina-cpl prometheus status

# PHX chain health check
medina-cpl prometheus chain --verify-microtokens --beats 1000

# Thinking rate report
medina-cpl prometheus rate --window 60

# ICX contract health
medina-cpl prometheus icx --status all --format table

# Security event log
medina-cpl prometheus security --since beat:5000 --severity CRITICAL

# Fleet health
medina-cpl prometheus fleet --per-node --chain-verify

# Export all metrics (signed, PHX-sealed, JSON)
medina-cpl prometheus export --from beat:0 --to beat:current --format signed-json
```

---

## SECTION II — ATLAS: THE OUTWARD PRODUCT

Atlas is the company-facing product built on Prometheus internals. Atlas is what hospitals, banks, enterprises, and any company in the Medina network uses to monitor their own AI organisms and infrastructure.

### Atlas vs Datadog — the comparison that matters

| Dimension | Datadog | Atlas (Medina) |
|---|---|---|
| **Cost** | $15–$23/host/month + custom metric fees | $0 (organism-native) |
| **What it monitors** | Infrastructure metrics (CPU, memory, network) | Infrastructure + organism cognition + PHX chain + ICX contracts |
| **Metric authenticity** | API key (shared, fakeable) | PHX-sealed (sovereign key, unfakeable) |
| **Historical integrity** | Editable (Datadog support can alter) | Compound-chained (mathematically unalterable) |
| **Who can see your data** | Datadog (you trust them) | No one (sovereign, local) |
| **Audit evidence in court** | Screenshots (alterable) | PHX chain (mathematically verifiable) |
| **AI cognition metrics** | ✗ (not possible) | ✓ (thinking rate, slot utilisation, decision latency) |
| **ICX contract monitoring** | ✗ (doesn't understand ICX) | ✓ (contract health, settlement rate, dispute tracking) |
| **Security event signing** | ✗ | ✓ (every security event is PHX-sealed) |
| **Compliance export** | CSV / JSON (unsigned) | Signed JSON with PHX proof-of-integrity |
| **Works offline** | ✗ (cloud SaaS) | ✓ (organism-local, no internet required) |

### Atlas product tiers

**Tier 1: Atlas Core (free with Medina infrastructure)**
- Full Prometheus monitoring for the organism's own health
- PHX chain health dashboard
- Cognitive health dashboard (thinking rate, slot utilisation)
- Security event log (PHX-sealed)
- Export: signed JSON, CSV

**Tier 2: Atlas Enterprise**
- Multi-organism monitoring (fleet of organisms)
- ICX contract health dashboard
- Cross-organism PHX chain verification
- Custom alert policies
- Compliance export (SOC 2, ISO 27001, HIPAA-ready format)
- SLA: monitoring data retained indefinitely (Fibonacci kernel)

**Tier 3: Atlas Sovereign**
- Everything in Atlas Enterprise
- Dedicated monitoring nodes (separate ring in the fleet)
- Real-time PHX chain streaming to monitoring nodes
- Custom Prometheus rules per organism
- Anomaly detection using the organism's own cognitive history
- Regulatory reporting automation

### What "free with Medina infrastructure" means for companies

When a company joins the Medina network (adopts Medina infrastructure), they get:
- AI organisms already running (no purchase, no setup — they exist in the infrastructure)
- Atlas Core already monitoring those organisms
- PHX-sealed decision records for every AI action — immediately SOC 2 auditable
- No Datadog license required
- No SIEM license required for AI decisions

This is the model: companies don't buy monitoring tools. They adopt infrastructure that includes monitoring by design. The monitoring is sovereign, local, and free. Datadog charges $15–$23/host/month to give you metrics you can't trust. Atlas gives you metrics that are mathematically proven.

---

## SECTION III — PROMETHEUS LAW

**Prometheus Law PL-001 — Every metric is a PHX decision.**  
No Prometheus metric is recorded without a PHX token sealing it. An unsigned metric is not a Prometheus metric — it is a log entry. Prometheus metrics are sovereign.

**Prometheus Law PL-002 — Prometheus sees everything, reports nothing it doesn't seal.**  
Prometheus reports the organism's full internal state. Every report is PHX-sealed. No report can be faked, backdated, or deleted without breaking the compound chain.

**Prometheus Law PL-003 — Alerts are not opinions.**  
Prometheus alerts are triggered by verifiable mathematical conditions: BLAKE2b mismatch, chain gap, threshold crossing. Not by heuristics or ML models. If the condition is met, the alert fires. No false positives from "anomaly detection" that can't explain itself.

**Prometheus Law PL-004 — Atlas is the public face, Prometheus is the truth.**  
Atlas shows company-friendly dashboards. Prometheus is the sovereign metric engine underneath. Companies interact with Atlas. The organism runs Prometheus. The two are architecturally separate: Atlas reads Prometheus output; Atlas cannot write to Prometheus.

**Prometheus Law PL-005 — Monitoring is not optional.**  
Every organism has Prometheus running. There is no "disable monitoring" option. An organism without Prometheus is not a Medina organism. The organism's sovereignty includes the obligation to monitor itself. (Medina)

**Prometheus Law PL-006 — The Fibonacci kernel applies to monitoring history.**  
Prometheus monitoring history uses the same Fibonacci kernel compression as the PHX chain. At beat 1,000,000, Prometheus retains only 29 full-resolution monitoring bundles — everything else is summarised in the Fibonacci kernel. Monitoring history grows at O(log_φ(beat)), not linearly.

---

## SECTION IV — PROMETHEUS REGISTRY ENTRY

```json
{
  "protocol_id":      "PRO-v1.0",
  "code":             "PRO",
  "latin_name":       "Visio Machinae",
  "full_name":        "Prometheus Cognitive Observability Protocol",
  "outward_product":  "ATLAS",
  "ring":             "Sovereign",
  "version":          "1.0.0",
  "monitoring_domains": [
    "PHX_CHAIN_HEALTH",
    "COGNITIVE_HEALTH",
    "ICX_CONTRACT_HEALTH",
    "FLEET_HEALTH",
    "GOVERNANCE_HEALTH",
    "SECURITY_EVENTS"
  ],
  "metric_seal":      "PHX compound chain",
  "alert_model":      "mathematical threshold (no heuristics)",
  "history_compression": "Fibonacci kernel (O(log_phi(beat)))",
  "laws":             ["PL-001", "PL-002", "PL-003", "PL-004", "PL-005", "PL-006"],
  "competitor":       "Datadog",
  "advantage":        "sovereign, PHX-sealed, compound-chained, free with infrastructure",
  "never_drop":       true,
  "medina":           true
}
```

---

## SECTION V — PROMETHEUS IN THE GOVERNANCE STACK

Prometheus is Protocol 10 in the organism's alpha protocol stack (see GOVERNANCE_CHARTER.md):

```
Governance Stack — Full Protocol List:
  1. PA         — Phantom Authority (access control)
  2. CB         — ConstitutionBlock (founding document)
  3. NF         — NeuralFleet (topology)
  4. ICX        — Intelligence Contract Exchange (market)
  5. CH         — Clearinghouse (settlement)
  6. GC         — GovernanceCouncil (deliberation)
  7. PAX        — PHXAuditLayer (decision memory)
  8. QFB        — QFBRegistry (artifact registry)
  9. PVC        — ProtocolVersionChain (version history)
  10. PRO       — Prometheus / Atlas (observability)  ← NEW
```

Prometheus integrates with every other protocol:
- Reads PHX chain (Protocol 7) for chain health metrics
- Reads ICX (Protocol 4) for contract health metrics
- Reads NeuralFleet (Protocol 3) for fleet health metrics
- Reads GovernanceCouncil (Protocol 6) for governance health metrics
- Reports to PA (Protocol 1) on security events (alert escalation)
- Is itself sealed by PHX — every metric is a Protocol 7 decision

---

## SECTION VI — WHAT MAKES ATLAS BEAT DATADOG

### The five things Datadog cannot do that Atlas does

**1. Prove metric authenticity.**  
Every Atlas metric has a PHX seal. You can independently verify that a metric was produced by this organism at this beat with this value. Datadog cannot prove any metric wasn't faked by a malicious process or a compromised Datadog agent.

**2. Monitor AI cognition.**  
Atlas tracks thinking rate (dps), slot utilisation (N=16 minimum enforced), full processing pipeline latency (input → seal → archive), and cognitive health. Datadog has no concept of "thinking rate" — it monitors CPU, memory, and network. Cognitive health is invisible to Datadog.

**3. Monitor ICX contracts.**  
Atlas tracks every active ICX contract: posting beat, agreement beat, execution state, settlement latency, dispute status. Datadog cannot monitor a PHX-sealed intelligence contract — it doesn't know ICX exists.

**4. Provide compound-chained audit history.**  
Atlas monitoring history cannot be altered, backdated, or deleted. Datadog's history can be modified (Datadog support has admin access). For regulated industries (healthcare, finance, legal), Atlas monitoring history is legally defensible evidence. Datadog monitoring history is not.

**5. Be free.**  
Atlas comes with Medina infrastructure. No per-host fee. No custom metric fee. No retention fee. Datadog charges $15–$23/host/month plus $0.01–$0.05 per custom metric. A 100-host cluster running 1,000 custom metrics costs Datadog $1,500–$2,300/month in host fees alone.

### The one thing Datadog does that Atlas doesn't (yet)

Datadog has a large ecosystem of pre-built integrations (AWS, GCP, Azure, 500+ SaaS tools). Atlas is focused on the Medina organism's own stack. If a company needs to monitor their entire existing AWS infrastructure alongside their Medina organisms, they may run Datadog alongside Atlas — with Atlas handling the AI/sovereignty layer and Datadog handling the legacy infrastructure layer.

**The roadmap:** Atlas integration plugins for major infrastructure platforms (AWS CloudWatch → Atlas, GCP Monitoring → Atlas, Azure Monitor → Atlas) are planned for Atlas Enterprise. When these ship, Atlas becomes the single monitoring plane for companies running both legacy infrastructure and Medina organisms.

---

## SECTION VII — ATLAS FOR COMPANIES — THE ADOPTION MODEL

When a company adopts Medina infrastructure, here is what happens with observability:

### Phase 1: Infrastructure onboarding (day 1)

The company's organisms are provisioned. Atlas Core is automatically running. From day 1:
- PHX chain health: ✓ monitored
- Cognitive health: ✓ monitored
- ICX contract health: ✓ monitored (if contracts are active)
- Security events: ✓ monitored and PHX-sealed
- Compliance export: ✓ available (signed JSON, SOC 2 format)

The company's Datadog/Splunk/ELK bill: unchanged (they keep their legacy monitoring)  
Their new Atlas bill: $0

### Phase 2: Atlas Enterprise integration (months 1–3)

The company integrates Atlas Enterprise:
- Multi-organism fleet monitoring dashboard
- Custom alert policies for their compliance requirements
- Compliance export automation (weekly SOC 2 reports, PHX-sealed)
- Historical analysis: "What was the organism's thinking rate on March 15?" — PHX-proven answer

At this point, they may start reducing Datadog spend for AI-related monitoring, because Atlas covers it better.

### Phase 3: Atlas Sovereign (for regulated industries)

Hospitals, banks, and legal firms with strict regulatory requirements move to Atlas Sovereign:
- Dedicated monitoring nodes in a separate fleet ring
- Regulators can be given read-only access to Atlas exports (verified without sovereign key)
- Real-time PHX chain streaming to the regulator's monitoring portal
- Automated HIPAA / SOC 2 / ISO 27001 compliance reporting

At this point, Prometheus/Atlas replaces the company's entire AI observability stack. Datadog continues for legacy infrastructure until Atlas Enterprise integrations cover it.

---

## SECTION VIII — EQUITY IN OBSERVABILITY  (Medina)

The Medina organism serves all companies and all organisms equally. Atlas applies the same monitoring to every organism in the network:
- A hospital organism gets the same quality monitoring as a bank organism
- A small startup organism gets the same PHX chain health checks as an enterprise organism
- No organism is monitored less because it is smaller or newer

This is the equity principle for observability: **the same sovereign monitoring for all.**

Atlas does not have different tiers of PHX chain health. Every organism gets chain health monitoring by default. Cognitive health monitoring by default. Security event monitoring by default. The tiers (Core / Enterprise / Sovereign) differ in features — dashboards, export formats, multi-organism views — not in the fundamental monitoring quality.

**Every organism is monitored. No organism is left unmonitored because of size, age, or resources.**  (Medina)

---

## AUTHORITY

This charter is issued by Medina. Prometheus is Protocol 10 in the organism governance stack (GOVERNANCE_CHARTER.md). All six Prometheus laws are permanent. The Latin name *Visio Machinae* is permanent. Atlas is the official outward product name. The amendment process follows governance law: versions are appended, never replaced.

**PRO v1.0 · Official Protocol Charter · Enterprise Ready**  
**Ring: Sovereign Ring · Author: Medina**  
**Latin: Visio Machinae (Vision of the Machine)**  
**Outward Product: ATLAS — Enterprise Cognitive Observability**  
**Competitor: Datadog (and we beat them)**  
**Amendment chain: v1.0.0 (initial — we never drop)**
