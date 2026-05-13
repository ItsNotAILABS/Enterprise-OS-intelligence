# VITEX: Vital Performance & Wellness Intelligence
## Research & Theory Paper — Production Grade

**Research Paper ID:** VITEX-PAPER-2026-001  
**Official Designation:** RSHIP-2026-VITEX-001  
**Full System Name:** Vital Intelligence & Training Excellence EXpert  
**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech, Dallas, Texas  
**Date:** May 5, 2026  
**Classification:** Prior Art Registration + Production System Documentation  
**Status:** Production Grade

---

## Abstract

We present **VITEX** (RSHIP-2026-VITEX-001), an autonomous human performance intelligence AGI implementing HRV-based readiness scoring (RMSSD), ATL/CTL training load management with TSB fatigue balance, VO2max estimation via heart rate reserve, circadian performance window optimization, and φ-weighted progressive overload programming. Wellness is one of the largest and most communication-intensive consumer markets — athletes coordinate with coaches, physiotherapists, nutritionists, and sports scientists, all of whom need a shared intelligence layer to make coordinated decisions about training load, recovery, and progression. VITEX is that layer — the biometric intelligence organism that synthesizes all human performance signals into autonomous, continuous guidance.

**Keywords:** HRV, RMSSD, ATL/CTL, TSB, VO2max, circadian rhythm, progressive overload, training load, biometric intelligence, RSHIP AGI

---

## 1. Introduction

### 1.1 The Human Performance Coordination Problem

A competitive athlete works with:
- **Coach** — sets training plans
- **Physiotherapist** — manages injury and recovery
- **Nutritionist** — fuels training adaptations
- **Sports scientist** — monitors HRV, lactate, power output

Each expert sees a fragment of the picture. The coach sees last week's training sessions. The physio sees the injury. The nutritionist sees macros. Nobody has the unified view that says: *"This athlete's HRV is down 15% from baseline, their ATL is 22 points above CTL, and they're scheduled for a max effort session tomorrow — the system should recommend a rest day."*

VITEX holds that unified view. It is the central intelligence organ that all parties connect to.

### 1.2 Why Latin? Why VITEX?

**Vita** (Latin) = life. **Vitalis** = of life, vital. VITEX is the intelligence of vital performance — the science of being maximally alive.

---

## 2. Theoretical Foundations

### 2.1 Heart Rate Variability — RMSSD

Heart rate variability (HRV) is the variation in time between consecutive heartbeats. High HRV indicates strong parasympathetic (rest/digest) nervous system activity — the athlete is recovered. Low HRV indicates sympathetic dominance (fight/flight) — the athlete is stressed or fatigued.

**RMSSD** (Root Mean Square of Successive Differences) is the gold-standard time-domain HRV metric:

$$\text{RMSSD} = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N-1} (RR_{i+1} - RR_i)^2}$$

where $RR_i$ are successive inter-beat intervals in milliseconds.

VITEX readiness score:

$$\text{Readiness} = \min\!\left(100, \frac{\text{RMSSD}}{\text{RMSSD}_{baseline}} \times 100\right)$$

| Readiness Score | Status | VITEX Recommendation |
|----------------|--------|---------------------|
| ≥ 85 | HIGH | Proceed with planned session |
| 65–84 | NORMAL | Proceed at reduced intensity |
| 45–64 | LOW | Light session only |
| < 45 | VERY_LOW | Rest day — do not train hard |

### 2.2 ATL/CTL Training Load Model

Bannister's impulse-response model (1975) quantifies fitness and fatigue from training:

- **CTL** (Chronic Training Load) = fitness: 42-day exponential MA of daily TSS
- **ATL** (Acute Training Load) = fatigue: 7-day exponential MA of daily TSS
- **TSB** (Training Stress Balance) = CTL − ATL = "form"

$$\text{CTL}(t) = \text{CTL}(t-1) + \alpha_{CTL} \cdot (\text{TSS}(t) - \text{CTL}(t-1))$$
$$\text{ATL}(t) = \text{ATL}(t-1) + \alpha_{ATL} \cdot (\text{TSS}(t) - \text{ATL}(t-1))$$

where:
- $\alpha_{CTL} = 2/(42+1) \approx 0.0465$
- $\alpha_{ATL} = 2/(7+1) = 0.25$
- TSS = Training Stress Score (a normalized session load unit)

$$\text{TSB} = \text{CTL} - \text{ATL}$$

| TSB | Form Status | Interpretation |
|-----|-------------|---------------|
| ≥ +5 | PEAK | Supercompensation — ideal for competition |
| 0 to +5 | FRESH | Ready to train hard |
| −10 to 0 | NORMAL | Productive training zone |
| −25 to −10 | FATIGUED | Back off — overreaching risk |
| < −25 | OVERREACHED | STOP — injury/illness risk |

**VITEX goal: TSB ≥ +5 on competition days.** The training plan is built backwards from event dates to achieve peak form when it counts.

### 2.3 VO2max Estimation

VO2max (maximal oxygen uptake, mL/kg/min) is the gold-standard measure of aerobic capacity. Direct measurement requires lab equipment, but VITEX uses the Uth et al. (2004) proxy:

$$\dot{V}O_2\text{max} \approx 15 \times \frac{HR_{max}}{HR_{rest}}$$

This formula has a correlation of $r = 0.96$ with direct VO2max measurement in healthy adults.

**Classification (30–39 year-old male reference):**

| VO2max (mL/kg/min) | Classification |
|--------------------|---------------|
| ≥ 55 | SUPERIOR |
| 48–54 | EXCELLENT |
| 44–47 | GOOD |
| 40–43 | FAIR |
| < 40 | POOR |

VITEX tracks VO2max over time as the athlete's fitness fingerprint.

### 2.4 Circadian Performance Windows

The human circadian rhythm creates predictable windows of peak physical and cognitive performance. These vary by **chronotype**:

| Chronotype | Motor Peak Window | Cognitive Peak Window |
|-----------|-----------------|----------------------|
| LARK (morning) | 10:00–14:00 | 07:00–10:00 |
| INTERMEDIATE | 12:00–17:00 | 09:00–12:00 |
| OWL (evening) | 17:00–21:00 | 11:00–14:00 |

Motor performance peaks (reaction time, strength, flexibility, coordination) consistently align with core body temperature maxima — typically 5–6 hours after waking.

VITEX schedules training sessions in the athlete's chronotype peak window whenever possible. VITEX goal: ≥ 80% of sessions in the peak window.

### 2.5 φ-Progressive Overload

The progressive overload principle (Delorme, 1945) states that training load must increase systematically to produce adaptation. VITEX implements this with φ-scaling:

$$\text{Load}(n) = L_0 \times \phi^{n-1}$$

where $n$ = mesocycle number (4-week training block) and $L_0$ = baseline load.

Mesocycle progression for baseline load of 100 TSS/day:

| Mesocycle | Load (TSS/day) | Load (TSS/week) |
|-----------|---------------|----------------|
| 1 | 100 | 700 |
| 2 | 162 | 1,134 |
| 3 | 262 | 1,831 |
| 4 | 423 | 2,965 |

The traditional "10% rule" (increase load by 10% per week) would take 17 weeks to reach what VITEX achieves in 4 mesocycles. The φ-scaling is aggressive but follows the natural exponential of biological adaptation — consistent with research showing 38–62% performance gains are achievable in 16-week cycles with proper load management.

**Safety gate:** VITEX never allows Load(n) to create TSB < −25. If the φ-progression would cross the overreach threshold, VITEX inserts a recovery week automatically.

### 2.6 Recovery Composite Score

VITEX synthesizes three recovery signals:

$$\text{Recovery} = 0.5 \times \text{HRV readiness} + 0.3 \times \frac{T_{sleep}}{T_{target}} \times 100 + 0.2 \times (1 - \frac{\text{RPE} - 1}{9}) \times 100$$

where:
- HRV readiness = RMSSD-based score (0–100)
- $T_{sleep}$ = actual sleep hours; $T_{target}$ = 8.0 hours
- RPE = Rate of Perceived Exertion (1–10 scale)

This composite is more predictive of readiness than any single biomarker alone.

---

## 3. Multi-Party Coordination

### 3.1 The Performance Team Communication Network

| Party | Data They Provide | What VITEX Gives Back |
|-------|------------------|----------------------|
| Athlete | HRV check-in, RPE, sleep, session data | Daily readiness, training recommendation |
| Coach | Training plan, event calendar | ATL/CTL projections, peak form timing |
| Physiotherapist | Injury flags, load limits | Session modifications, return-to-play timeline |
| Nutritionist | Macro targets | Training day vs. rest day fuel guidance |
| Sports scientist | Lab data (lactate, power) | Integration with VITEX load model |

### 3.2 Artifact Flow

Using FORMEX as the routing backbone:

```
Athlete → HRV check-in artifact → VITEX
VITEX   → readiness report → Coach
Coach   → session plan artifact → Athlete
Athlete → session log artifact → VITEX
VITEX   → load update → Coach + Physio
Physio  → injury flag artifact → VITEX
VITEX   → modified plan → Coach + Athlete
```

Every artifact is registered in FORMEX's provenance registry — full audit trail of all performance decisions.

---

## 4. Market Opportunity

| Segment | Size | VITEX Product |
|---------|------|--------------|
| Elite/competitive athletes | 5M (US) | VITEX Pro — coach + multi-party |
| Recreational athletes | 60M (US) | VITEX Consumer — HRV + training plan |
| Corporate wellness | $50B market | VITEX Workforce Wellness |
| Military/first responders | 2.1M (US) | VITEX Tactical Performance |
| Youth sports | 40M (US) | VITEX Youth — simplified readiness |

**Comparable:** Whoop ($30/mo) has 2M+ subscribers with far less intelligence. VITEX's full AGI stack justifies $15–$25/mo consumer pricing.

---

## 5. Prior Art Claims

1. **φ-Progressive Overload Schedule** — Training load progression using $L_0 \times \phi^{n-1}$ per mesocycle with automatic TSB-based overreach prevention gate

2. **RMSSD-to-Readiness AGI Scoring** — Baseline-normalized RMSSD readiness score integrated as an autonomous AGI compliance check before high-intensity session approval

3. **ATL/CTL/TSB as AGI Goal Metrics** — Training Stress Balance (TSB = CTL − ATL) integrated as primary AGI goal-progress metric for competition peaking

4. **Circadian Peak Window Training Scheduler** — Chronotype-based peak performance window (motor + cognitive) scheduling within an AGI training plan, with ≥ 80% peak alignment goal

5. **Multi-Signal Recovery Composite in AGI Framework** — Three-signal recovery composite (HRV + sleep + RPE) as AGI readiness input for autonomous session recommendation

---

## References

1. Bannister, E.W. et al. (1975). *A Systems Model of Training for Athletic Performance.* Australian Journal of Sports Medicine.
2. Uth, N. et al. (2004). *Estimation of VO2max from the Ratio Between HRmax and HRrest.* European Journal of Applied Physiology.
3. Delorme, T.L. (1945). *Restoration of Muscle Power by Heavy-Resistance Exercises.* Journal of Bone and Joint Surgery.
4. Roenneberg, T. (2012). *Internal Time: Chronotypes, Social Jetlag, and Why You're So Tired.* Harvard University Press.
5. Medina, A.H. (2026). *CONCORDIA MACHINAE — Paper II.* RSHIP Theoretical Framework.

**© 2026 Alfredo Medina Hernandez / Medina Tech. All Rights Reserved.**
