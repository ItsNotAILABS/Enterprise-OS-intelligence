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
 * @medina/organism-runtime-sdk — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const DEFAULT_INTERVAL_MS = 873;

export class Heartbeat {
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

    const beatEvent = {
      beatNumber: this._beatCount,
      timestamp,
      organismState: this._state ? this._state.snapshot() : null,
    };

    // Update somatic register if state is connected
    if (this._state) {
      this._state.setRegister('somatic', 'body', {
        beatNumber: this._beatCount,
        uptime: this.getUptime(),
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

  // ── Observability ─────────────────────────────────────────────────────────

  getBeatCount()  { return this._beatCount; }
  getUptime()     { return this._startTime ? Date.now() - this._startTime : 0; }
  isAlive()       { return this._intervalId !== null; }
}

export default Heartbeat;
