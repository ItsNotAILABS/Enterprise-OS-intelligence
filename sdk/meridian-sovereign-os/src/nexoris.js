/**
 * NEXORIS — The Sovereign Router (Kuramoto Coupling)
 *
 * Routes intelligence between connected systems and applies the Kuramoto
 * synchronization model to bring desynchronized enterprise systems into
 * phase coherence.
 *
 * Kuramoto equation per system node:
 *   dθᵢ/dt = ωᵢ + (K/N) × Σⱼ sin(θⱼ − θᵢ)
 *
 * Where:
 *   θᵢ = phase of system i
 *   ωᵢ = natural update frequency of system i
 *   K  = coupling strength (NEXORIS routing intensity)
 *   N  = total connected systems
 *
 * The order parameter R = |Σe^(iθ)| / N measures organizational coherence.
 * R = 1.0 → fully synchronized.
 * R < 0.75 → NEXORIS flags the desynchronized node and routes correction.
 */
export class NEXORIS {
  /** @type {number} Sovereign coherence floor */
  static COHERENCE_FLOOR = 0.75;

  /**
   * @param {Object} [options]
   * @param {number} [options.couplingStrength=2.0] K — coupling intensity
   * @param {number} [options.dt=0.01] Integration step
   */
  constructor(options = {}) {
    this.K = options.couplingStrength ?? 2.0;
    this.dt = options.dt ?? 0.01;

    /** @type {Map<string, { omega: number, theta: number, label: string }>} */
    this._nodes = new Map();

    this._beat = 0;
    this._history = [];
    this._routingLog = [];
  }

  /**
   * Register a system node with its natural update frequency.
   * @param {string} systemId
   * @param {Object} config
   * @param {number} config.omega - Natural update frequency in rad/beat
   * @param {string} [config.label] - Human-readable label
   * @param {number} [config.theta0] - Initial phase (default random)
   * @returns {{ systemId: string, omega: number, theta: number }}
   */
  registerSystem(systemId, config = {}) {
    if (!config.omega && config.omega !== 0) {
      throw new Error(`[NEXORIS] omega (natural frequency) is required for system "${systemId}"`);
    }

    const theta = config.theta0 ?? Math.random() * 2 * Math.PI;

    this._nodes.set(systemId, {
      omega: config.omega,
      theta,
      label: config.label ?? systemId,
    });

    return { systemId, omega: config.omega, theta };
  }

  /**
   * Deregister a system node.
   * @param {string} systemId
   */
  deregisterSystem(systemId) {
    this._nodes.delete(systemId);
  }

  /**
   * Advance one Kuramoto integration step.
   * @returns {{ beat: number, orderParameter: number, synchronized: boolean, desynchronizedNodes: string[] }}
   */
  tick() {
    const nodes = [...this._nodes.entries()];
    const N = nodes.length;

    if (N === 0) {
      return { beat: ++this._beat, orderParameter: 1, synchronized: true, desynchronizedNodes: [] };
    }

    // Compute new phases
    const newThetas = new Map();

    for (const [id, node] of nodes) {
      let coupling = 0;
      for (const [, other] of nodes) {
        coupling += Math.sin(other.theta - node.theta);
      }
      const dtheta = (node.omega + (this.K / N) * coupling) * this.dt;
      newThetas.set(id, node.theta + dtheta);
    }

    // Apply updates
    for (const [id, theta] of newThetas) {
      this._nodes.get(id).theta = theta;
    }

    this._beat++;

    // Compute order parameter R = |Σe^(iθ)| / N
    const R = this._computeOrderParameter();
    const synchronized = R >= NEXORIS.COHERENCE_FLOOR;

    // Identify desynchronized nodes (those far from the mean phase)
    const meanTheta = this._meanPhase();
    const desynchronizedNodes = nodes
      .filter(([, n]) => Math.abs(Math.sin(n.theta - meanTheta)) > 0.5)
      .map(([id]) => id);

    const state = {
      beat: this._beat,
      orderParameter: R,
      synchronized,
      desynchronizedNodes,
      timestamp: new Date().toISOString(),
    };

    this._history.push(state);
    return state;
  }

  /**
   * Route a command execution plan to the correct system workers.
   * @param {Object} executionPlan - From CEREBEX.route()
   * @returns {{ routed: boolean, routes: Array, orderParameter: number }}
   */
  route(executionPlan) {
    const R = this._computeOrderParameter();

    const routes = (executionPlan.targets ?? []).map((target) => ({
      target,
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
    }));

    const entry = {
      command: executionPlan.command,
      routes,
      orderParameter: R,
      routedAt: new Date().toISOString(),
    };

    this._routingLog.push(entry);
    return { routed: true, routes, orderParameter: R };
  }

  /**
   * Returns the current Kuramoto order parameter R.
   * @returns {number} Value in [0, 1]
   */
  getOrderParameter() {
    return this._computeOrderParameter();
  }

  /**
   * Returns all registered systems and their phases.
   * @returns {Array<{ systemId: string, omega: number, theta: number, label: string }>}
   */
  getSystems() {
    return [...this._nodes.entries()].map(([id, node]) => ({ systemId: id, ...node }));
  }

  /**
   * Returns the routing log.
   * @returns {Array<Object>}
   */
  getRoutingLog() {
    return [...this._routingLog];
  }

  /**
   * Returns the phase history.
   * @returns {Array<Object>}
   */
  getHistory() {
    return [...this._history];
  }

  /* ---- internal ---- */

  _computeOrderParameter() {
    const nodes = [...this._nodes.values()];
    if (nodes.length === 0) return 1;

    const sumCos = nodes.reduce((s, n) => s + Math.cos(n.theta), 0);
    const sumSin = nodes.reduce((s, n) => s + Math.sin(n.theta), 0);
    const N = nodes.length;

    return Math.sqrt(sumCos ** 2 + sumSin ** 2) / N;
  }

  _meanPhase() {
    const nodes = [...this._nodes.values()];
    if (nodes.length === 0) return 0;
    return nodes.reduce((s, n) => s + n.theta, 0) / nodes.length;
  }
}

export default NEXORIS;
