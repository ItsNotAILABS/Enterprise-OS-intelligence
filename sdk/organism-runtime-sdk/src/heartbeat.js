/**
 * Heartbeat — Autonomous Organism Pulse
 *
 * Theory: SUBSTRATE VIVENS (Paper I) — Vitality. The system generates its own
 * activity. It does not wait to be triggered. It ticks, processes, and updates
 * on its own rhythm, whether or not anyone is interacting with it at that moment.
 *
 * The 873ms interval is not arbitrary. It is close to the human resting heart
 * rate (~70 bpm = 857ms) and falls within the range of φ-harmonic intervals
 * derived from the base 1000ms: 1000/φ ≈ 618ms, 1000/φ⁻¹ ≈ 1618ms.
 * 873ms ≈ (618 + 1618) / 2.618 — the midpoint scaled by φ².
 *
 * Sovereign cycles
 * ────────────────
 * Each beat generates SLOTS_PER_BEAT (16) sovereign cycles — one per cognitive slot.
 * These are OUR cycles. We do not use ICP cycles. We generate our own.
 * Cycles accumulate in _surplusCycles and are consumed by block box minting.
 * Formula: _surplusCycles += SLOTS_PER_BEAT on every pulse.
 * FCPR = SLOTS_PER_BEAT × (1000 / intervalMs) ≈ 18.33 decisions/second
 *
 * @medina/organism-runtime-sdk — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const DEFAULT_INTERVAL_MS = 873;

/** Cognitive slots per beat (N ≥ 16) — each slot IS one sovereign cycle */
const SLOTS_PER_BEAT = 16;

export class Heartbeat {
  /** @type {number} The organism's natural pulse interval in milliseconds */
  static INTERVAL_MS = DEFAULT_INTERVAL_MS;

  /** @type {number} Cognitive slots per beat — each slot is one sovereign cycle */
  static SLOTS_PER_BEAT = SLOTS_PER_BEAT;

  /**
   * @param {import('./organism-state.js').OrganismState} [state]
   * @param {number} [intervalMs]
   */
  constructor(state = null, intervalMs = DEFAULT_INTERVAL_MS) {
    this._state = state;
    this._intervalMs = intervalMs;
    this._beatCount = 0;
    this._startTime = null;
    this._intervalId = null;
    this._listeners = [];

    /** Sovereign cycles accumulated — these are OUR cycles (not ICP's) */
    this._surplusCycles = 0;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  start() {
    if (this._intervalId) return this;
    this._startTime = Date.now();
    this._intervalId = setInterval(() => this._pulse(), this._intervalMs);
    return this;
  }

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    return this;
  }

  // ── Internal pulse ────────────────────────────────────────────────────────

  _pulse() {
    this._beatCount++;
    const timestamp = new Date().toISOString();

    // Each beat generates SLOTS_PER_BEAT sovereign cycles.
    // Cycles ARE tokens. We own them. We don't rely on ICP.
    this._surplusCycles += SLOTS_PER_BEAT;

    const beatEvent = {
      beatNumber: this._beatCount,
      timestamp,
      surplusCycles: this._surplusCycles,
      cyclesThisBeat: SLOTS_PER_BEAT,
      fcpr: SLOTS_PER_BEAT * (1000 / this._intervalMs),
      organismState: this._state ? this._state.snapshot() : null,
    };

    // Update somatic register if state is connected
    if (this._state) {
      this._state.setRegister('somatic', 'body', {
        beatNumber: this._beatCount,
        uptime: this.getUptime(),
        surplusCycles: this._surplusCycles,
      });
    }

    for (const cb of this._listeners) {
      try { cb(beatEvent); } catch (_) { /* listeners must not crash the pulse */ }
    }
  }

  // ── Listeners ─────────────────────────────────────────────────────────────

  onBeat(callback) {
    this._listeners.push(callback);
    return () => {
      const idx = this._listeners.indexOf(callback);
      if (idx >= 0) this._listeners.splice(idx, 1);
    };
  }

  // ── Sovereign cycle management ────────────────────────────────────────────

  /**
   * Consume sovereign cycles from this heartbeat engine.
   * Used when minting block boxes — the box gets embedded cycles.
   * @param {number} count — cycles to consume
   * @returns {number} cycles actually consumed (capped at surplus)
   */
  consumeCycles(count) {
    const available = Math.min(count, this._surplusCycles);
    this._surplusCycles -= available;
    return available;
  }

  /**
   * Generate additional sovereign cycles on demand.
   * The organism can always make more — just run the heartbeat.
   * @param {number} count — additional cycles to generate
   * @returns {number} new total surplus
   */
  generateCycles(count) {
    this._surplusCycles += count;
    return this._surplusCycles;
  }

  /**
   * Returns current sovereign cycle surplus.
   * @returns {number}
   */
  getSurplusCycles() {
    return this._surplusCycles;
  }

  // ── Observability ─────────────────────────────────────────────────────────

  getBeatCount()  { return this._beatCount; }
  getUptime()     { return this._startTime ? Date.now() - this._startTime : 0; }
  isAlive()       { return this._intervalId !== null; }
}
