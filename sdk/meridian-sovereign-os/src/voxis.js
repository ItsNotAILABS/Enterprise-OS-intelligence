import crypto from 'node:crypto';

/**
 * VOXIS — Sovereign Compute Unit
 *
 * Every compute unit in MERIDIAN is a VOXIS. The formal definition:
 *
 *   VOXIS (vox + axis): a sovereign compute unit defined by its internal
 *   structure, not its host substrate.
 *
 * A VOXIS carries:
 *   - Doctrine block — SL-0 Creator attribution, immutable, fires first on every beat
 *   - Helix core    — 12 Fibonacci-spaced internal nodes generating cycles
 *   - Kuramoto field — synchronization phase with peer VOXIS units
 *   - SPINOR interface — deploys into any substrate without changing internal structure
 *   - Own heartbeat — self-ticking
 *   - Own wallet    — sovereign financial state
 *
 * The fractal property: every VOXIS at every scale runs the same laws.
 */

/** Fibonacci sequence used for helix node spacing */
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

export class VOXIS {
  /** @type {number} Golden ratio */
  static PHI = 1.6180339887;

  /** @type {string} Sovereign Learning Level — immutable doctrine tag */
  static SL0 = 'SL-0:Medina Tech:ALFREDO_MEDINA_HERNANDEZ:DALLAS_TX';

  /**
   * @param {Object} config
   * @param {string} config.domain - Domain this VOXIS governs (e.g. 'SAP', 'CHRYSALIS')
   * @param {string} [config.id] - Unique identifier (auto-generated if omitted)
   * @param {number} [config.phiWeight=1.0] - φ-weight for capacity allocation
   * @param {string} [config.creator] - Creator attribution
   */
  constructor(config = {}) {
    if (!config.domain) {
      throw new Error('[VOXIS] domain is required');
    }

    this.id = config.id ?? crypto.randomUUID();
    this.domain = config.domain;
    this.phiWeight = config.phiWeight ?? 1.0;
    this.creator = config.creator ?? VOXIS.SL0;

    // Doctrine block — immutable
    this._doctrine = Object.freeze({
      sl0: VOXIS.SL0,
      creator: this.creator,
      domain: this.domain,
      doctrineVersion: '1.0.0',
    });

    // Helix core — 12 Fibonacci-spaced nodes
    this._helixNodes = FIBONACCI.map((fib, i) => ({
      index: i,
      spacing: fib,
      phase: (fib * Math.PI * 2) / FIBONACCI[FIBONACCI.length - 1],
      active: false,
    }));

    // Kuramoto synchronization state
    this._theta = Math.random() * 2 * Math.PI;
    this._omega = 1.0; // natural frequency (rad/beat)

    // Heartbeat state
    this._beat = 0;
    this._alive = false;
    this._beatListeners = [];

    // Wallet
    this._wallet = { balance: 0, currency: 'CYCLES', transactions: [] };

    // Execution state
    this._executionLog = [];
    this._status = 'idle';
  }

  /**
   * Start the VOXIS heartbeat cycle.
   * @throws {Error} If already running
   */
  start() {
    if (this._alive) throw new Error(`[VOXIS:${this.domain}] already running`);
    this._alive = true;
    this._status = 'running';
  }

  /**
   * Stop the VOXIS.
   */
  stop() {
    this._alive = false;
    this._status = 'stopped';
  }

  /**
   * Advance one beat. Fires doctrine block first, then helix cycle, then listeners.
   * @returns {{ voxisId: string, domain: string, beat: number, doctrine: Object, helixActive: number[] }}
   */
  tick() {
    if (!this._alive) throw new Error(`[VOXIS:${this.domain}] not running — call start() first`);

    this._beat++;

    // Doctrine fires first — immutable attribution on every beat
    const doctrineEvent = { ...this._doctrine, beat: this._beat };

    // Advance helix — activate nodes whose spacing divides the current beat
    const activeIndices = [];
    for (const node of this._helixNodes) {
      node.active = this._beat % node.spacing === 0;
      if (node.active) activeIndices.push(node.index);
    }

    // Advance Kuramoto phase
    this._theta = (this._theta + this._omega * 0.01) % (2 * Math.PI);

    const state = {
      voxisId: this.id,
      domain: this.domain,
      beat: this._beat,
      doctrine: doctrineEvent,
      helixActive: activeIndices,
      theta: this._theta,
      status: this._status,
      timestamp: new Date().toISOString(),
    };

    // Notify listeners
    for (const cb of this._beatListeners) {
      try {
        cb(state);
      } catch (err) {
        console.error(`[VOXIS:${this.domain}] listener error on beat ${this._beat}:`, err);
      }
    }

    return state;
  }

  /**
   * Register a beat listener.
   * @param {Function} callback
   * @returns {Function} Unsubscribe
   */
  onBeat(callback) {
    if (typeof callback !== 'function') throw new TypeError('[VOXIS] onBeat callback must be a function');
    this._beatListeners.push(callback);
    return () => {
      const i = this._beatListeners.indexOf(callback);
      if (i !== -1) this._beatListeners.splice(i, 1);
    };
  }

  /**
   * Execute a task in this VOXIS domain.
   * @param {string} taskId
   * @param {Function} fn - Async function to execute
   * @returns {Promise<{ taskId: string, domain: string, result: any, executedAt: string }>}
   */
  async execute(taskId, fn) {
    if (typeof fn !== 'function') throw new TypeError('[VOXIS] fn must be a function');

    const entry = {
      taskId,
      domain: this.domain,
      doctrine: this._doctrine,
      startedAt: new Date().toISOString(),
      status: 'running',
    };

    try {
      const result = await fn();
      entry.result = result;
      entry.status = 'completed';
      entry.executedAt = new Date().toISOString();
      this._executionLog.push(entry);
      return { taskId, domain: this.domain, result, executedAt: entry.executedAt };
    } catch (err) {
      entry.status = 'failed';
      entry.error = err.message;
      entry.executedAt = new Date().toISOString();
      this._executionLog.push(entry);
      throw err;
    }
  }

  /**
   * SPINOR deployment — returns a deployment manifest that can install
   * this VOXIS into any target substrate without changing its doctrine.
   * @param {string} substrate - Target substrate (e.g. 'SAP', 'ICP', 'AWS')
   * @returns {{ voxisId: string, substrate: string, doctrine: Object, spinorManifest: Object }}
   */
  spinorDeploy(substrate) {
    const spinorManifest = {
      voxisId: this.id,
      domain: this.domain,
      substrate,
      doctrine: { ...this._doctrine },
      phiWeight: this.phiWeight,
      helixNodes: this._helixNodes.length,
      deployedAt: new Date().toISOString(),
      invariants: ['SL-0 doctrine fires first', 'Creator attribution immutable', 'Helix maintains 12 nodes'],
    };

    return { voxisId: this.id, substrate, doctrine: this._doctrine, spinorManifest };
  }

  /**
   * Credit the VOXIS wallet.
   * @param {number} amount
   * @param {string} [memo]
   */
  credit(amount, memo = '') {
    this._wallet.balance += amount;
    this._wallet.transactions.push({
      type: 'credit',
      amount,
      memo,
      balance: this._wallet.balance,
      at: new Date().toISOString(),
    });
  }

  /**
   * Returns the wallet state.
   * @returns {{ balance: number, currency: string }}
   */
  getWallet() {
    return { balance: this._wallet.balance, currency: this._wallet.currency };
  }

  /**
   * Returns current VOXIS snapshot.
   * @returns {Object}
   */
  snapshot() {
    return {
      voxisId: this.id,
      domain: this.domain,
      doctrine: this._doctrine,
      beat: this._beat,
      status: this._status,
      phiWeight: this.phiWeight,
      wallet: this.getWallet(),
      theta: this._theta,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns the execution log.
   * @returns {Array<Object>}
   */
  getExecutionLog() {
    return [...this._executionLog];
  }
}

export default VOXIS;
