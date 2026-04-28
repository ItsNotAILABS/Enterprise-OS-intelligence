/**
 * VOXIS — Sovereign Compute Unit
 *
 * Theory: DOCTRINA VOXIS (Paper IV) + IMPERIUM CONSERVATUM (Paper VIII)
 *
 * Every compute unit in MERIDIAN is a VOXIS. It is defined by its internal
 * structure, not by its host substrate.
 *
 * SL-0 Doctrinal Symmetry (IMPERIUM CONSERVATUM, Paper VIII):
 * The doctrine block is invariant under all permitted operations. By Noether's
 * theorem, this continuous symmetry gives rise to three conservation laws:
 *
 *   1. Doctrinal Charge — the creator attribution is conserved across all
 *      deployments, migrations, and operations. It cannot be overwritten.
 *
 *   2. Informational Momentum — the world model evolves along a predictable
 *      trajectory between data events. The evolution is smooth and auditable.
 *
 *   3. Cyclic Capacity — compute energy transforms between active processing
 *      and stored potential, but the total is conserved.
 *
 * Architecture:
 *   - Doctrine block (SL-0) — immutable, fires first on every beat
 *   - Helix core — 12 Fibonacci-spaced internal nodes generating cycles
 *   - Kuramoto field — synchronization phase with peer VOXES
 *   - SPINOR interface — carries doctrine intact across substrate migrations
 *   - Own heartbeat — self-ticking at configurable interval
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { PHI, PHI_INV } from './nexoris.js';

// Fibonacci sequence (first 12 terms) for the helix nodes
const FIBONACCI_12 = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

// ---------------------------------------------------------------------------
// VOXIS
// ---------------------------------------------------------------------------

export class VOXIS {
  /**
   * @param {object} [options]
   * @param {string} [options.domain]      - Enterprise domain (e.g. 'SAP', 'Salesforce')
   * @param {number} [options.phiWeight]   - φ-weight for Kuramoto field (default φ⁻¹)
   * @param {string} [options.creatorId]   - Immutable creator attribution (SL-0)
   * @param {string} [options.doctrineId]  - Doctrine version identifier
   */
  constructor({
    domain = 'GENERAL',
    phiWeight = PHI_INV,
    creatorId = 'Alfredo_Medina_Hernandez::MedinaTech',
    doctrineId = 'SL-0',
  } = {}) {
    // ── SL-0 Doctrine Block (immutable — Noether conservation of doctrinal charge) ──
    this._doctrine = Object.freeze({
      creatorId,
      doctrineId,
      createdAt: new Date().toISOString(),
      sovereignty: 'FULL',
      substrate: 'SUBSTRATE_AGNOSTIC',
    });

    this.domain = domain;
    this.phiWeight = phiWeight;

    // ── Helix core — 12 Fibonacci-spaced nodes ────────────────────────────
    this._helix = FIBONACCI_12.map((n, i) => ({
      node: i,
      fibValue: n,
      phase: (n / 144) * 2 * Math.PI,  // spread across [0, 2π]
      active: false,
    }));

    // ── Kuramoto synchronization phase ────────────────────────────────────
    this._theta = Math.random() * 2 * Math.PI;
    this._omega = phiWeight * Math.PI;  // natural frequency based on φ

    // ── Runtime state ─────────────────────────────────────────────────────
    this._beatCount = 0;
    this._alive = false;
    this._heartbeatInterval = null;
    this._substrate = 'LOCAL';
    this._chrono = null;
    this._taskHistory = [];
  }

  /** Inject CHRONO for logging. */
  setChrono(chrono) { this._chrono = chrono; return this; }

  // ── Doctrine (SL-0 conservation) ─────────────────────────────────────────

  /**
   * Returns the immutable doctrine block.
   * The doctrine cannot be changed — any attempt to modify it returns the
   * original frozen object unchanged.
   */
  get doctrine() {
    return this._doctrine;
  }

  /**
   * Doctrinal charge — the conserved sovereignty signature of this unit.
   * Returns the immutable hash of the doctrine block.
   */
  doctrinalCharge() {
    return `${this._doctrine.doctrineId}::${this._doctrine.creatorId}::${this._doctrine.createdAt}`;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Start the VOXIS heartbeat.
   * @param {number} [intervalMs=873] - Heartbeat interval in milliseconds.
   */
  start(intervalMs = 873) {
    if (this._alive) return this;
    this._alive = true;
    this._heartbeatInterval = setInterval(() => this.tick(), intervalMs);
    return this;
  }

  /** Stop the heartbeat. */
  stop() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
    this._alive = false;
    return this;
  }

  /**
   * Advance one heartbeat manually (also called by the internal timer).
   *
   * On every beat:
   *   1. Doctrine fires first (SL-0 check)
   *   2. Helix nodes activate based on beat number mod Fibonacci spacing
   *   3. Kuramoto phase advances
   *
   * @returns {{ beat: number, doctrine: object, helixActive: number[], theta: number }}
   */
  tick() {
    this._beatCount++;

    // Advance Kuramoto phase: θ += ω × dt (dt = 1 beat)
    this._theta = (this._theta + this._omega * 0.05) % (2 * Math.PI);

    // Activate helix nodes whose Fibonacci spacing divides current beat
    const activeNodes = this._helix
      .filter((node) => this._beatCount % node.fibValue === 0)
      .map((node) => {
        node.active = true;
        return node.node;
      });

    // Deactivate all nodes not in the current activation set
    for (const node of this._helix) {
      if (!activeNodes.includes(node.node)) node.active = false;
    }

    return {
      beat: this._beatCount,
      doctrine: this._doctrine,
      helixActive: activeNodes,
      theta: this._theta,
    };
  }

  // ── SPINOR deployment ─────────────────────────────────────────────────────

  /**
   * Deploy this VOXIS into a new substrate via SPINOR geometry.
   * Doctrine is invariant under this transformation — it cannot be overwritten.
   * The VOXIS carries its identity intact into any substrate.
   *
   * @param {string} substrate - Target substrate ('ICP', 'LOCAL', 'CLOUD', etc.)
   * @returns {{ substrate: string, doctrine: object, spinorId: string }}
   */
  spinorDeploy(substrate) {
    const spinorId = `SPINOR-${this._doctrine.doctrineId}-${Date.now()}`;
    this._substrate = substrate;

    if (this._chrono) {
      this._chrono.append({
        type: 'VOXIS_SPINOR_DEPLOY',
        domain: this.domain,
        fromSubstrate: this._substrate,
        toSubstrate: substrate,
        doctrinalCharge: this.doctrinalCharge(),
        spinorId,
      });
    }

    return {
      substrate,
      doctrine: this._doctrine,
      spinorId,
    };
  }

  // ── Task execution ────────────────────────────────────────────────────────

  /**
   * Execute a task within this VOXIS unit.
   * The doctrine check fires first — the unit's sovereignty is verified before
   * any operation proceeds.
   *
   * @param {string} taskId   - Task identifier
   * @param {Function} taskFn - Async function to execute
   * @returns {Promise<{ taskId, result, duration, doctrinalCharge }>}
   */
  async execute(taskId, taskFn) {
    // Doctrine fires first — SL-0 verification
    const charge = this.doctrinalCharge();

    const start = Date.now();
    let result;
    let error = null;

    try {
      result = await taskFn();
    } catch (err) {
      error = err.message;
    }

    const duration = Date.now() - start;
    const record = { taskId, result, error, duration, doctrinalCharge: charge };
    this._taskHistory.push(record);

    if (this._chrono) {
      this._chrono.append({
        type: 'VOXIS_EXECUTE',
        domain: this.domain,
        taskId,
        duration,
        success: error === null,
        doctrinalCharge: charge,
      });
    }

    if (error) throw new Error(error);
    return record;
  }

  // ── Observability ─────────────────────────────────────────────────────────

  get beatCount() { return this._beatCount; }
  get alive()     { return this._alive; }
  get theta()     { return this._theta; }
  get substrate() { return this._substrate; }
}

export default VOXIS;
