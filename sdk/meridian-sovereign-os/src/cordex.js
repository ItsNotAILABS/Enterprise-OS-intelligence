/**
 * CORDEX — The Organizational Heart
 *
 * Runs the Lotka-Volterra tension field between expansion forces and
 * organisational resistance. Tracks the dominanceRatio in real time and
 * emits correction signals when resistance dominates.
 *
 * Equations:
 *   dx/dt = r·x·(1 − x/K) − α·x·y   (expansion dynamics)
 *   dy/dt = δ·x·y − β·y              (resistance/threat dynamics)
 *
 * Where:
 *   x = expansion force  (growth initiatives, new signals)
 *   y = resistance force (bureaucracy, technical debt, legacy friction)
 */
export class CORDEX {
  /** @type {number} Golden ratio */
  static PHI = 1.6180339887;

  /**
   * @param {Object} [params]
   * @param {number} [params.r=0.3]    Intrinsic growth rate of expansion
   * @param {number} [params.K=1.0]    Carrying capacity of the organisation
   * @param {number} [params.alpha=0.4] Predation coefficient (resistance on expansion)
   * @param {number} [params.delta=0.3] Conversion efficiency (expansion → resistance)
   * @param {number} [params.beta=0.2]  Natural decay of resistance
   * @param {number} [params.dt=0.01]  Integration step size (beats)
   */
  constructor(params = {}) {
    this.r = params.r ?? 0.3;
    this.K = params.K ?? 1.0;
    this.alpha = params.alpha ?? 0.4;
    this.delta = params.delta ?? 0.3;
    this.beta = params.beta ?? 0.2;
    this.dt = params.dt ?? 0.01;

    // Initial state: healthy org — 80% expansion, 20% resistance
    this.x = params.x0 ?? 0.8;
    this.y = params.y0 ?? 0.2;

    this._beatCount = 0;
    this._history = [];
    this._correctionSignals = [];
  }

  /**
   * Advance the Lotka-Volterra field by one integration step.
   * @returns {{ x: number, y: number, dominanceRatio: number, beat: number, correctionSignal: boolean }}
   */
  tick() {
    const { r, K, alpha, delta, beta, dt } = this;

    // Euler integration
    const dx = (r * this.x * (1 - this.x / K) - alpha * this.x * this.y) * dt;
    const dy = (delta * this.x * this.y - beta * this.y) * dt;

    this.x = Math.max(0, this.x + dx);
    this.y = Math.max(0, this.y + dy);

    this._beatCount++;

    const dominanceRatio = this.x / (this.x + this.y || 1);
    const correctionSignal = dominanceRatio < 0.5;

    const state = {
      x: this.x,
      y: this.y,
      dominanceRatio,
      beat: this._beatCount,
      correctionSignal,
      timestamp: new Date().toISOString(),
    };

    this._history.push(state);

    if (correctionSignal) {
      this._correctionSignals.push(state);
    }

    return state;
  }

  /**
   * Inject an expansion impulse (new growth initiative, positive signal).
   * @param {number} [magnitude=0.1]
   * @returns {{ x: number, y: number, dominanceRatio: number }}
   */
  injectExpansion(magnitude = 0.1) {
    this.x = Math.min(this.K, this.x + magnitude);
    return this.snapshot();
  }

  /**
   * Inject a resistance impulse (bureaucratic spike, incident, etc.).
   * @param {number} [magnitude=0.1]
   * @returns {{ x: number, y: number, dominanceRatio: number }}
   */
  injectResistance(magnitude = 0.1) {
    this.y = this.y + magnitude;
    return this.snapshot();
  }

  /**
   * Returns the current state snapshot without advancing the field.
   * @returns {{ x: number, y: number, dominanceRatio: number, beat: number }}
   */
  snapshot() {
    const dominanceRatio = this.x / (this.x + this.y || 1);
    return {
      x: this.x,
      y: this.y,
      dominanceRatio,
      beat: this._beatCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns all historical states.
   * @returns {Array<Object>}
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Returns all correction signal events.
   * @returns {Array<Object>}
   */
  getCorrectionSignals() {
    return [...this._correctionSignals];
  }

  /**
   * Returns the chronic fear coefficient — the proportion of time in
   * correction-signal state over the last N beats.
   * @param {number} [window=100]
   * @returns {number} Value in [0, 1]
   */
  chronicFear(window = 100) {
    const recent = this._history.slice(-window);
    if (recent.length === 0) return 0;
    const stressed = recent.filter((s) => s.correctionSignal).length;
    return stressed / recent.length;
  }
}

export default CORDEX;
