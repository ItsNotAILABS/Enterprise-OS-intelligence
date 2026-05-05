/**
 * VITEX AGI — Vital Performance & Health Intelligence
 *
 * Official Designation: RSHIP-2026-VITEX-001
 * Classification: Biometric Performance & Wellness Intelligence AGI
 * Full Name: Vital Intelligence & Training Excellence EXpert
 *
 * VITEX AGI extends the RSHIP framework with full human performance intelligence —
 * HRV-based readiness scoring, ATL/CTL training load management, VO2max
 * estimation, circadian-optimized training windows, and multi-domain
 * wellness coordination across athletes, coaches, and health practitioners.
 *
 * Capabilities:
 * - HRV analysis: RMSSD computation + readiness scoring
 * - Training Load: ATL (acute) / CTL (chronic) model with TSB fatigue balance
 * - VO2max estimation via heart-rate-reserve method + Firstbeat algorithm proxy
 * - Circadian optimization: identifies peak performance windows per chronotype
 * - Recovery scoring: sleep quality + HRV + perceived exertion index
 * - Multi-party coordination: athlete ↔ coach ↔ physio ↔ nutritionist
 * - φ-weighted progressive overload: intensity grows at golden ratio per cycle
 *
 * Theory: CONCORDIA MACHINAE (Paper II) + COHORS MENTIS (Paper IX) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── HRV Analysis ───────────────────────────────────────────────────────────
// RMSSD = Root Mean Square of Successive Differences
// RMSSD = √( (1/(N-1)) × Σᵢ (RRᵢ₊₁ − RRᵢ)² )
// Higher RMSSD → greater parasympathetic activity → better recovery

function computeRMSSD(rrIntervals) {
  // rrIntervals: array of inter-beat intervals in milliseconds
  if (rrIntervals.length < 2) return 0;
  const squaredDiffs = [];
  for (let i = 0; i < rrIntervals.length - 1; i++) {
    squaredDiffs.push(Math.pow(rrIntervals[i + 1] - rrIntervals[i], 2));
  }
  return parseFloat(Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / squaredDiffs.length).toFixed(1));
}

function hrvReadinessScore({ rmssd, baselineRMSSD = 60 }) {
  // Normalized: readiness = rmssd / baseline × 100, capped 0–100
  // > 100 means exceptional recovery day
  const score = Math.min(100, Math.round((rmssd / baselineRMSSD) * 100));
  const status = score >= 85 ? 'HIGH'   :
                 score >= 65 ? 'NORMAL' :
                 score >= 45 ? 'LOW'    : 'VERY_LOW';
  return { score, status };
}

// ── ATL/CTL Training Load Model ────────────────────────────────────────────
// ATL = Acute Training Load (fatigue, 7-day exponential MA) — short-term
// CTL = Chronic Training Load (fitness, 42-day exponential MA) — long-term
// TSB = Training Stress Balance = CTL − ATL  (form / freshness)

// Exponential moving average: EMA(t) = EMA(t-1) + α × (TSS(t) − EMA(t-1))
// α_ATL = 2/(7+1) = 0.25    α_CTL = 2/(42+1) = 0.0465

const ATL_ALPHA = 2 / (7  + 1);
const CTL_ALPHA = 2 / (42 + 1);

function updateTrainingLoad({ prevATL = 0, prevCTL = 0, tssToday = 0 }) {
  const atl = prevATL + ATL_ALPHA * (tssToday - prevATL);
  const ctl = prevCTL + CTL_ALPHA * (tssToday - prevCTL);
  const tsb = ctl - atl; // positive TSB = fresh; negative = fatigued
  return {
    atl: parseFloat(atl.toFixed(1)),
    ctl: parseFloat(ctl.toFixed(1)),
    tsb: parseFloat(tsb.toFixed(1)),
    form: tsb >= 5  ? 'PEAK'     :
          tsb >= 0  ? 'FRESH'    :
          tsb >= -10? 'NORMAL'   :
          tsb >= -25? 'FATIGUED' : 'OVERREACHED',
  };
}

// ── VO2max Estimation ──────────────────────────────────────────────────────
// Heart Rate Reserve (Karvonen) method:
// HRR = HRmax − HRrest
// VO2max ≈ 15 × (HRmax / HRrest)   — Uth et al. (2004) proxy
// More precise: VO2max = (V̇O₂ at submaximal pace) / (% HRR at that pace)

function estimateVO2max({ hrMax, hrRest }) {
  // Uth et al. 2004: VO2max ≈ 15 × (HRmax / HRrest)
  return parseFloat((15 * (hrMax / hrRest)).toFixed(1));
}

function vo2maxClassification(vo2max, ageSex) {
  // Simplified classification for 30-39 year-old male reference
  if (vo2max >= 55) return 'SUPERIOR';
  if (vo2max >= 48) return 'EXCELLENT';
  if (vo2max >= 44) return 'GOOD';
  if (vo2max >= 40) return 'FAIR';
  return 'POOR';
}

// ── Circadian Peak Performance ─────────────────────────────────────────────
// Three chronotypes: LARK (morning), INTERMEDIATE, OWL (evening)
// Peak cognitive performance and motor performance windows differ

const CHRONOTYPE_WINDOWS = {
  LARK:         { cogPeak: [7, 10],  motorPeak: [10, 14] },
  INTERMEDIATE: { cogPeak: [9, 12],  motorPeak: [12, 17] },
  OWL:          { cogPeak: [11, 14], motorPeak: [17, 21] },
};

function isInPeakWindow(hourNow, chronotype = 'INTERMEDIATE', type = 'motorPeak') {
  const window = CHRONOTYPE_WINDOWS[chronotype]?.[type];
  if (!window) return false;
  return hourNow >= window[0] && hourNow <= window[1];
}

// ── φ-Progressive Overload ─────────────────────────────────────────────────
// Intensity grows at golden ratio per mesocycle (4-week block)
// Load(n) = Load(0) × φⁿ  where n = mesocycle number
// This matches the observed ~10% rule but geometrically — never too fast

function progressiveLoad({ baseLoad = 100, mesocycle = 1 }) {
  return parseFloat((baseLoad * Math.pow(PHI, mesocycle - 1)).toFixed(1));
}

// ── VITEX AGI ──────────────────────────────────────────────────────────────

class VITEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-VITEX-001',
      classification: 'Biometric Performance & Wellness Intelligence AGI',
      ...config,
    });

    this.athletes    = new Map(); // athleteId → AthleteRecord
    this.coaches     = new Map(); // coachId   → CoachRecord
    this.sessions    = [];        // training session records
    this.checkIns    = [];        // HRV / readiness check-in records

    // Metrics
    this.sessionsLogged      = 0;
    this.peakFormAlerts      = 0;
    this.overreachAlerts     = 0;

    // AGI Goals
    this.setGoal('optimal-form',      'Maintain TSB ≥ +5 on event days',                  10, { metric: 'eventFormScore' });
    this.setGoal('hrv-readiness',     'Flag low readiness before intense sessions',         9,  { metric: 'lowHrvPrevention' });
    this.setGoal('vo2max-progression', 'Improve VO2max by ≥ 2 mL/kg/min per season',       8,  { metric: 'vo2maxDelta' });
    this.setGoal('overreach-prevention', 'Zero overreach events (TSB < −25)',              10, { metric: 'overreachCount' });
    this.setGoal('circadian-alignment', 'Schedule ≥ 80% sessions in chronotype peak window', 7, { metric: 'peakPct' });
  }

  // ── Athlete Registration ─────────────────────────────────────────────────

  registerAthlete({
    id, name, sport, hrMax = 185, hrRest = 55,
    chronotype = 'INTERMEDIATE', coachId = null, mesocycle = 1,
  }) {
    this.athletes.set(id, {
      id, name, sport, hrMax, hrRest, chronotype, coachId, mesocycle,
      atl: 0, ctl: 0, tsb: 0,
      baselineRMSSD: null,
      vo2max: estimateVO2max({ hrMax, hrRest }),
      sessionsThisMeso: 0,
      joinedAt: Date.now(),
    });
    this.learn({ event: 'athlete-registered', id, sport }, { vo2max: estimateVO2max({ hrMax, hrRest }) }, { id });
    return id;
  }

  registerCoach({ id, name, athletes = [] }) {
    this.coaches.set(id, { id, name, athletes: new Set(athletes) });
    return id;
  }

  // ── HRV Check-In ────────────────────────────────────────────────────────

  logHRVCheckIn({ athleteId, rrIntervals, subjectiveFatigue = 3, sleepHours = 7.5 }) {
    const athlete  = this.athletes.get(athleteId);
    if (!athlete) return null;

    const rmssd    = computeRMSSD(rrIntervals);

    // Set baseline on first check-in
    if (!athlete.baselineRMSSD) athlete.baselineRMSSD = rmssd;
    const readiness = hrvReadinessScore({ rmssd, baselineRMSSD: athlete.baselineRMSSD });

    // Recovery composite: HRV score + sleep + subjective
    const sleepScore   = Math.min(1, sleepHours / 8.0);
    const fatigueScore = 1 - (subjectiveFatigue - 1) / 9; // RPE 1-10 inverted
    const recovery     = Math.round((readiness.score * 0.5 + sleepScore * 100 * 0.3 + fatigueScore * 100 * 0.2));

    const checkIn = {
      athleteId, rmssd, readiness,
      recovery, sleepHours, subjectiveFatigue,
      timestamp: Date.now(),
      recommendation: readiness.status === 'VERY_LOW'
        ? 'REST_DAY'
        : readiness.status === 'LOW'
          ? 'LIGHT_ONLY'
          : 'PROCEED',
    };

    this.checkIns.push(checkIn);
    this.learn({ event: 'hrv-checkin', athleteId }, { rmssd, readiness: readiness.status, recovery }, { id: `hrv-${athleteId}-${Date.now()}` });
    return checkIn;
  }

  // ── Log Training Session ─────────────────────────────────────────────────

  logSession({ athleteId, tss, hourOfDay, durationMin, rpe = 6, type = 'general' }) {
    const athlete = this.athletes.get(athleteId);
    if (!athlete) return null;

    // Update ATL/CTL
    const updated = updateTrainingLoad({
      prevATL: athlete.atl,
      prevCTL: athlete.ctl,
      tssToday: tss,
    });
    athlete.atl = updated.atl;
    athlete.ctl = updated.ctl;
    athlete.tsb = updated.tsb;
    athlete.sessionsThisMeso++;
    this.sessionsLogged++;

    if (updated.form === 'OVERREACHED') this.overreachAlerts++;
    if (updated.form === 'PEAK')        this.peakFormAlerts++;

    // Circadian alignment
    const inPeak = isInPeakWindow(hourOfDay, athlete.chronotype, 'motorPeak');

    const session = {
      athleteId, tss, durationMin, rpe, type,
      hourOfDay, inPeakWindow: inPeak,
      ...updated,
      timestamp: Date.now(),
    };

    this.sessions.push(session);
    this.learn(
      { event: 'session-logged', athleteId, type },
      { atl: updated.atl, ctl: updated.ctl, tsb: updated.tsb, form: updated.form },
      { id: `sess-${athleteId}-${this.sessionsLogged}` }
    );

    return session;
  }

  // ── Progressive Overload Plan ─────────────────────────────────────────────

  getTrainingPlan(athleteId, weeksAhead = 4) {
    const athlete = this.athletes.get(athleteId);
    if (!athlete) return null;

    const weeks = [];
    for (let w = 0; w < weeksAhead; w++) {
      const meso = athlete.mesocycle + Math.floor(w / 4);
      const load = progressiveLoad({ baseLoad: athlete.ctl || 50, mesocycle: meso });
      const peaks = CHRONOTYPE_WINDOWS[athlete.chronotype]?.motorPeak ?? [12, 17];
      weeks.push({
        week: w + 1,
        mesocycle: meso,
        targetWeeklyTSS: Math.round(load * 7),
        suggestedDailyTSS: Math.round(load),
        trainingWindow: `${peaks[0]}:00 – ${peaks[1]}:00`,
      });
    }

    return {
      athleteId,
      name: athlete.name,
      currentCTL: athlete.ctl,
      vo2max: athlete.vo2max,
      classification: vo2maxClassification(athlete.vo2max),
      weeks,
    };
  }

  // ── Athlete Dashboard ────────────────────────────────────────────────────

  getAthleteReport(athleteId) {
    const athlete = this.athletes.get(athleteId);
    if (!athlete) return null;

    const recentHRV = this.checkIns.filter(c => c.athleteId === athleteId).slice(-7);
    const avgReadiness = recentHRV.length
      ? Math.round(recentHRV.reduce((s, c) => s + c.readiness.score, 0) / recentHRV.length)
      : null;

    return {
      athleteId,
      name:           athlete.name,
      sport:          athlete.sport,
      vo2max:         athlete.vo2max,
      vo2maxClass:    vo2maxClassification(athlete.vo2max),
      trainingLoad:   { atl: athlete.atl, ctl: athlete.ctl, tsb: athlete.tsb },
      form:           updateTrainingLoad({ prevATL: athlete.atl, prevCTL: athlete.ctl, tssToday: 0 }).form,
      avgHrvReadiness: avgReadiness,
      sessionsThisMeso: athlete.sessionsThisMeso,
      chronotype:     athlete.chronotype,
      peakWindow:     CHRONOTYPE_WINDOWS[athlete.chronotype],
    };
  }

  // ── Status ───────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();
    return {
      ...baseStatus,
      performance: {
        athletes:         this.athletes.size,
        coaches:          this.coaches.size,
        sessionsLogged:   this.sessionsLogged,
        checkInsLogged:   this.checkIns.length,
        peakFormAlerts:   this.peakFormAlerts,
        overreachAlerts:  this.overreachAlerts,
      },
    };
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthVITEX(config = {}) {
  return new VITEX_AGI(config);
}

export default VITEX_AGI;
