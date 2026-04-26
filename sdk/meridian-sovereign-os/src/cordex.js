/**
 * CORDEX — Organizational Heart (Lotka-Volterra Tension Field)
 *
 * Theory: SUBSTRATE VIVENS (Paper I) + SYSTEMA INVICTUM (Paper III)
 *
 * CORDEX never waits for a user. It tracks the organizational balance between
 * expansion forces and resistance forces on every heartbeat, continuously,
 * and signals when intervention is needed.
 *
 * Governed by the Lotka-Volterra equations:
 *   dx/dt = r·x·(1 − x/K) − α·x·y   (expansion dynamics)
 *   dy/dt = δ·x·y − β·y              (resistance/threat dynamics)
 *
 *   x = expansion force (growth initiatives, new capabilities, momentum)
 *   y = resistance force (technical debt, fear, bottlenecks, friction)
 *   r = intrinsic growth rate
 *   K = carrying capacity (max expansion given current resources)
 *   α = how much resistance suppresses expansion
 *   δ = how much expansion generates new resistance
 *   β = natural decay rate of resistance
 *
 * dominanceRatio = x/(x+y) ∈ [0,1]
 * When dominanceRatio < 0.5, resistance dominates → CORDEX signals CEREBEX
 * to route automation into high-friction areas.
 *
 * chronicFear = rolling average of (1 − dominanceRatio) over last N beats
 * Used by CYCLOVEX: C(t) = C₀ × φᵗ × (1 − chronicFear)
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const DEFAULTS = {
  x: 0.6,     // initial expansion
  y: 0.3,     // initial resistance
  r: 0.4,     // intrinsic growth rate
  K: 1.0,     // carrying capacity
  alpha: 0.3, // α — resistance suppresses expansion
  delta: 0.2, // δ — expansion generates resistance
  beta: 0.15, // β — resistance natural decay
  dt: 0.05,   // time step (Euler integration)
  fearWindow: 20, // beats for chronicFear rolling average
};

export class CORDEX {
  /**
   * @param {object} [options] - Override any Lotka-Volterra parameter.
   */
  constructor(options = {}) {
    const cfg = { ...DEFAULTS, ...options };

    this.x = cfg.x;       // expansion
    this.y = cfg.y;       // resistance
    this.r = cfg.r;
    this.K = cfg.K;
    this.alpha = cfg.alpha;
    this.delta = cfg.delta;
    this.beta = cfg.beta;
    this.dt = cfg.dt;
    this._fearWindow = cfg.fearWindow;

    this._beatCount = 0;
    this._fearHistory = [];   // rolling window of fear values
    this._correctionActive = false;
    this._chrono = null;
  }

  /** Inject CHRONO for logging. */
  setChrono(chrono) { this._chrono = chrono; return this; }

  // ── Heartbeat tick ────────────────────────────────────────────────────────

  /**
   * Advance the Lotka-Volterra system by one time step.
   *
   * @returns {{ x: number, y: number, dominanceRatio: number,
   *             correctionSignal: boolean, beatNumber: number }}
   */
  tick() {
    // Euler integration
    const dx = this.r * this.x * (1 - this.x / this.K) - this.alpha * this.x * this.y;
    const dy = this.delta * this.x * this.y - this.beta * this.y;

    this.x = Math.max(0.01, this.x + dx * this.dt);
    this.y = Math.max(0.01, this.y + dy * this.dt);

    const dominanceRatio = this.x / (this.x + this.y);
    const fear = 1 - dominanceRatio;

    this._fearHistory.push(fear);
    if (this._fearHistory.length > this._fearWindow) {
      this._fearHistory.shift();
    }

    this._beatCount++;

    // Correction signal: resistance has taken over
    const correctionSignal = dominanceRatio < 0.45;
    this._correctionActive = correctionSignal;

    if (this._chrono && (correctionSignal || this._beatCount % 50 === 0)) {
      this._chrono.append({
        type: 'CORDEX_TICK',
        beatNumber: this._beatCount,
        x: Math.round(this.x * 10000) / 10000,
        y: Math.round(this.y * 10000) / 10000,
        dominanceRatio: Math.round(dominanceRatio * 10000) / 10000,
        correctionSignal,
      });
    }

    return {
      x: this.x,
      y: this.y,
      dominanceRatio,
      correctionSignal,
      beatNumber: this._beatCount,
    };
  }

  // ── External force injection ──────────────────────────────────────────────

  /**
   * Inject an expansion event (new initiative, capability, momentum).
   * @param {number} amount - Additional expansion force (0–1)
   */
  injectExpansion(amount) {
    this.x = Math.min(this.K, this.x + amount);
  }

  /**
   * Inject a resistance event (technical debt, organizational friction).
   * @param {number} amount - Additional resistance (0–1)
   */
  injectResistance(amount) {
    this.y += amount;
  }

  // ── chronicFear ───────────────────────────────────────────────────────────

  /**
   * Rolling average fear over the last N beats.
   * Used by CYCLOVEX to modulate compounding capacity.
   *
   * @param {number} [window] - Override window size.
   * @returns {number} chronicFear ∈ [0, 1]
   */
  chronicFear(window) {
    const history = window
      ? this._fearHistory.slice(-window)
      : this._fearHistory;
    if (history.length === 0) return 0;
    return history.reduce((a, b) => a + b, 0) / history.length;
  }

  get beatCount()        { return this._beatCount; }
  get dominanceRatio()   { return this.x / (this.x + this.y); }
  get correctionActive() { return this._correctionActive; }
}

export default CORDEX;
