# STUDEX: Education & Learning Intelligence
## Research & Theory Paper — Production Grade

**Research Paper ID:** STUDEX-PAPER-2026-001  
**Official Designation:** RSHIP-2026-STUDEX-001  
**Full System Name:** Student Trajectory & Universal Development EXpert  
**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech, Dallas, Texas  
**Date:** May 5, 2026  
**Classification:** Prior Art Registration + Production System Documentation  
**Status:** Production Grade

---

## Abstract

We present **STUDEX** (RSHIP-2026-STUDEX-001), an autonomous educational intelligence AGI implementing the Ebbinghaus forgetting curve with spaced repetition scheduling, Newell-Rosenbloom power-law learning curves, knowledge graph prerequisite gating, and Bloom's Taxonomy 6-level mastery assessment. Education is the world's largest communication network — 1.5 billion students coordinating with 80 million teachers, parents, and institutions. STUDEX replaces disconnected learning management systems with a unified intelligence organism that knows what each learner knows, when they're about to forget it, what they're ready to learn next, and when to alert a teacher. The system's φ-weighted difficulty progression ensures learners are always challenged at the right level — never bored, never overwhelmed.

**Keywords:** Ebbinghaus forgetting curve, spaced repetition, power law learning, Bloom's taxonomy, knowledge graph, prerequisite gating, educational intelligence, RSHIP AGI

---

## 1. Introduction

### 1.1 The Education Information Problem

The world's educational system has a fundamental information asymmetry:
- Teachers teach to the average — not the individual
- Spaced repetition is known to be 2–3× more effective than massed practice, but almost no school uses it systematically
- Prerequisite gaps cause cascading failures (a student who doesn't understand fractions will fail algebra, then calculus)
- Parents get report cards 4 times a year — interventions happen months too late

STUDEX addresses all four with autonomous, continuous intelligence.

### 1.2 Why Latin? Why STUDEX?

**Studium** (Latin) = application, zeal, eagerness to learn. It captures both the student's drive and the systematic nature of learning — not passive reception but active pursuit. STUDEX is the intelligence organ for that active pursuit.

---

## 2. Theoretical Foundations

### 2.1 Ebbinghaus Forgetting Curve

Ebbinghaus (1885) discovered that memory retention decays exponentially with time:

$$R(t) = e^{-t/S}$$

where:
- $R \in [0,1]$ = fraction of material retained
- $t$ = time since last review (days)
- $S$ = memory stability (higher = slower forgetting)

**Critical insight:** $S$ grows with each successful review. In STUDEX:

$$S_{new} = S_{old} \times \phi$$

Each successful recall multiplies the stability by $\phi = 1.618\ldots$. After 5 reviews:

$$S_5 = S_1 \times \phi^4 \approx S_1 \times 6.85$$

A memory with initial stability of 1 day becomes stable for ~6.85 days after just 4 reviews. This is why spaced repetition is so powerful.

### 2.2 Spaced Repetition Scheduling

The optimal next review time is when retention has decayed to a target level $R^*$ (typically 90%):

$$t^* = -S \ln(R^*)$$

For $R^* = 0.9$: $t^* \approx 0.105 \times S$

| Stability $S$ | Days Until Next Review |
|---------------|----------------------|
| 1 day | 0.1 days (few hours) |
| 7 days | 0.73 days |
| 30 days | 3.2 days |
| 180 days | 18.9 days |
| 365 days | 38.4 days |

STUDEX computes this schedule per learner per concept, generating a prioritized review queue where urgency = $1 - R(t_{now})$.

### 2.3 Power-Law Learning Curve

Newell and Rosenbloom (1981) showed that skill acquisition follows a power law:

$$T(n) = T_1 \cdot n^{-b}$$

where:
- $T(n)$ = time to complete trial $n$ (or error rate on trial $n$)
- $T_1$ = time/error on first trial
- $b \approx 0.301 = \log_{10}(2)$ — the "learning constant"

This is the mathematical form of "practice makes perfect." Importantly, the same law holds across all cognitive skills — typing, chess, mathematics, language learning.

#### Trials to Mastery

Solving for $n$ when $T(n) = T_{mastery}$:

$$n^* = \left(\frac{T_1}{T_{mastery}}\right)^{1/b}$$

STUDEX uses this to predict mastery arrival time for each learner based on their observed first-trial performance.

### 2.4 Bloom's Taxonomy

Bloom et al. (1956) classified cognitive levels into a hierarchy:

| Level | Name | φ-Score | Cognitive Demand |
|-------|------|---------|----------------|
| 1 | Remember | 1 | Recall, identify, list |
| 2 | Understand | φ | Explain, summarize |
| 3 | Apply | φ² | Use, execute, implement |
| 4 | Analyze | φ³ | Differentiate, compare |
| 5 | Evaluate | φ⁴ | Judge, defend, critique |
| 6 | Create | φ⁵ | Design, construct, produce |

STUDEX assigns φ-scaled difficulty scores to each level: a learner at level 6 (Create) is working at φ⁵ ≈ 11.09× the cognitive demand of level 1 (Remember). The φ scaling reflects the compounding nature of cognitive complexity.

The prerequisite rule: you cannot advance to level L+1 until you have demonstrated mastery at level L for all relevant concepts.

### 2.5 Knowledge Graph

STUDEX models the curriculum as a directed acyclic graph (DAG):

```
[Arithmetic] → [Fractions] → [Algebra] → [Calculus]
                    ↑
            [Decimals] ──────────→ [Statistics]
```

A learner is **locked** from a concept until all its prerequisites are mastered. This prevents the silent failure pattern: a student who can't do fractions gets placed in algebra, falls behind, and never catches up because the gap is never diagnosed.

**Prerequisite gate function:**

$$\text{unlocked}(c, M) = \bigwedge_{p \in \text{prereqs}(c)} p \in M$$

where $M$ is the set of mastered concepts.

---

## 3. Multi-Party Coordination

### 3.1 The Education Communication Network

| Party | What They Need |
|-------|---------------|
| Student | Know what to study next and when |
| Teacher | Know which students need intervention |
| Parent | Know if their child is falling behind in real time |
| Institution | Aggregate cohort performance for curriculum decisions |

STUDEX coordinates all four parties through a unified artifact flow:
- **Assignment artifact:** teacher → student → graded assessment → back to teacher
- **Review schedule artifact:** STUDEX → student (daily)
- **Alert artifact:** STUDEX → parent + teacher (when overdue reviews accumulate ≥3)
- **Report artifact:** STUDEX → institution (weekly cohort summary)

### 3.2 Intervention Triggers

STUDEX autonomously triggers interventions when:

1. **Overdue reviews ≥ 3** — learner has not kept up with spaced repetition schedule
2. **Bloom level stalled ≥ 2 cycles** — learner not advancing through taxonomy
3. **Prerequisite cluster incomplete** — learner attempting advanced concept without foundation
4. **Score < 0.6 on assessment** — below minimum threshold for any level

---

## 4. Market Opportunity

| Segment | Size | STUDEX Product |
|---------|------|---------------|
| US K-12 students | 50M | STUDEX School Platform |
| US college students | 20M | STUDEX Higher Ed |
| Global online learners | 300M | STUDEX Consumer App |
| Corporate L&D | $370B market | STUDEX Workforce Learning |
| Language learning (Duolingo-adjacent) | 500M+ users | STUDEX Language Module |

**Total Addressable Users: 500M+** — this is one of the largest consumer markets on earth.

### Consumer App Pitch

*"STUDEX knows what you need to study, exactly when you need to study it, and what you're about to forget — before you forget it."*

---

## 5. Prior Art Claims

1. **φ-Compounding Memory Stability** — Using $S_{new} = S_{old} \times \phi$ as the stability growth rule in an Ebbinghaus spaced repetition system integrated into an AGI goal framework

2. **Bloom's Taxonomy φ-Scoring** — Assigning $\phi^{L-1}$ difficulty scores to Bloom's taxonomy levels within an AGI mastery assessment system

3. **Knowledge Graph Prerequisite Gate as AGI Goal** — Knowledge graph prerequisite enforcement (all prerequisites mastered before unlock) implemented as a zero-violation AGI goal

4. **Power-Law Mastery Prediction per Learner** — Per-learner mastery arrival time prediction using the Newell-Rosenbloom power law as an AGI intelligence capability

---

## References

1. Ebbinghaus, H. (1885). *Über das Gedächtnis.* Duncker & Humblot, Leipzig.
2. Newell, A. & Rosenbloom, P.S. (1981). *Mechanisms of Skill Acquisition and the Law of Practice.* In: J.R. Anderson (Ed.), Cognitive Skills and Their Acquisition.
3. Bloom, B.S. et al. (1956). *Taxonomy of Educational Objectives.* Longman.
4. Wozniak, P.A. (1990). *Optimization of Learning.* University of Technology, Poznan.
5. Medina, A.H. (2026). *COHORS MENTIS — Paper IX.* RSHIP Theoretical Framework.

**© 2026 Alfredo Medina Hernandez / Medina Tech. All Rights Reserved.**
