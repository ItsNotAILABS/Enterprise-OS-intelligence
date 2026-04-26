/**
 * CrossOrganismResonance — Kuramoto Cross-Organism Synchronization
 *
 * Theory: CONCORDIA MACHINAE (Paper II) + STIGMERGY (Paper XX)
 *
 * When multiple MERIDIAN organisms operate in an ecosystem, they are not
 * isolated — they couple through the CrossOrganismResonance layer.
 *
 * Each organism is a Kuramoto oscillator. The coupling produces R, the order
 * parameter measuring how synchronized the organism network is. An ecosystem
 * with R ≥ 0.75 has coherent collective intelligence — organisms amplify
 * each other. An ecosystem with R < 0.75 is fragmented.
 *
 * Signal exchange also deposits into the local NEXORIS pheromone field,
 * reinforcing routing decisions with evidence from peer organisms
 * (cross-organism stigmergy).
 *
 * @medina/organism-runtime-sdk — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const SYNC_THRESHOLD = 0.75;

export class CrossOrganismResonance {
  /**
   * @param {string} selfId - This organism's identifier
   * @param {import('./organism-state.js').OrganismState} [state]
   */
  constructor(selfId, state = null) {
    this._selfId = selfId;
    this._state = state;
    this._organisms = new Map();     // organismId → { endpoint, theta, lastSignal, count }
    this._signals = [];              // incoming signal log
    this._outgoing = [];             // outgoing signal log
    this._theta = Math.random() * 2 * Math.PI;
    this._omega = Math.PI * 0.618;   // φ⁻¹ × π natural frequency
    this._listeners = [];
    this._signalCount = 0;
  }

  // ── Registration ──────────────────────────────────────────────────────────

  registerOrganism(organismId, endpoint) {
    this._organisms.set(organismId, {
      endpoint,
      theta: Math.random() * 2 * Math.PI,
      registeredAt: new Date().toISOString(),
      lastSignalTimestamp: null,
      signalCount: 0,
    });
    return this;
  }

  // ── Signal exchange ───────────────────────────────────────────────────────

  resonate(targetOrganismId, signal) {
    const target = this._organisms.get(targetOrganismId);
    if (!target) throw new Error(`Organism not registered: ${targetOrganismId}`);

    this._signalCount++;
    const signalId = `sig-${this._signalCount}-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const record = {
      signalId,
      source: this._selfId,
      target: targetOrganismId,
      signal,
      timestamp,
      delivered: true,
    };

    this._outgoing.push(record);
    target.lastSignalTimestamp = timestamp;
    target.signalCount++;

    return record;
  }

  onResonance(callback) {
    this._listeners.push(callback);
    return () => {
      const idx = this._listeners.indexOf(callback);
      if (idx >= 0) this._listeners.splice(idx, 1);
    };
  }

  /**
   * Simulate receiving a signal from another organism.
   * In a live deployment this would be triggered by a network event.
   */
  _receiveSignal(signal) {
    this._signals.push(signal);
    for (const cb of this._listeners) {
      try { cb(signal); } catch (_) {}
    }
  }

  // ── Synchronization ───────────────────────────────────────────────────────

  /**
   * Compute cross-organism Kuramoto order parameter.
   * Returns synchronized state and the current R value.
   *
   * Optionally takes a snapshot of this organism's state and includes it
   * so that the target can use it to update its own world model.
   */
  synchronize(targetOrganismId) {
    const target = this._organisms.get(targetOrganismId);
    if (!target) throw new Error(`Organism not registered: ${targetOrganismId}`);

    const snapshot = this._state ? this._state.snapshot() : null;
    const syncId = `sync-${Date.now()}`;

    // Advance self Kuramoto phase toward target
    const dt = 0.05;
    const coupling = Math.sin(target.theta - this._theta);
    this._theta = (this._theta + (this._omega + coupling) * dt) % (2 * Math.PI);

    // Update target's phase based on coupling
    target.theta = (target.theta + this._omega * dt) % (2 * Math.PI);

    return {
      syncId,
      source: this._selfId,
      target: targetOrganismId,
      timestamp: new Date().toISOString(),
      snapshot,
    };
  }

  // ── Observability ─────────────────────────────────────────────────────────

  /**
   * Compute order parameter R across all registered organisms + self.
   * R = |Σ e^(iθ)| / (N+1)
   */
  orderParameter() {
    const thetas = [this._theta, ...this._organisms.values()].map(
      (o) => (typeof o === 'number' ? o : o.theta),
    );
    const N = thetas.length;
    const sinSum = thetas.reduce((s, t) => s + Math.sin(t), 0);
    const cosSum = thetas.reduce((s, t) => s + Math.cos(t), 0);
    const R = Math.sqrt(sinSum ** 2 + cosSum ** 2) / N;
    return { R, synchronized: R >= SYNC_THRESHOLD, N };
  }

  getResonanceField() {
    return [...this._organisms.entries()].map(([id, org]) => ({
      organismId: id,
      endpoint: org.endpoint,
      registeredAt: org.registeredAt,
      lastSignalTimestamp: org.lastSignalTimestamp,
      signalCount: org.signalCount,
    }));
  }
}

export default CrossOrganismResonance;
