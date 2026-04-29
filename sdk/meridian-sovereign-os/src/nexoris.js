/**
 * NEXORIS — Kuramoto Synchronization Router + Stigmergic Pheromone Field
 *
 * Theory: CONCORDIA MACHINAE (Paper II) + STIGMERGY (Paper XX)
 *
 * Two layered intelligence mechanisms:
 *
 * 1. Kuramoto phase synchronization
 *    Each connected enterprise system is an oscillator with natural frequency ωᵢ.
 *    NEXORIS couples them: dθᵢ/dt = ωᵢ + (K/N) × Σⱼ sin(θⱼ − θᵢ)
 *    Order parameter R = |Σ e^(iθ)| / N measures coherence.
 *    R ≥ 0.75 → systems are synchronized; R < 0.75 → NEXORIS flags desync.
 *
 * 2. Stigmergic pheromone field routing (STIGMERGY, Paper XX)
 *    Discretized reaction-diffusion: ∂τ/∂t = D∇²τ − ρτ + Σᵢ δ(xᵢ)·q(xᵢ,t)
 *    Each successful route deposits pheromone proportional to result quality.
 *    Field evaporates at rate ρ per tick, ensuring the field stays current.
 *    Routing decisions follow the gradient — highest concentration wins.
 *    The field is the organizational memory of every good routing decision ever made.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

export const PHI = 1.6180339887;
export const PHI_INV = 1 / PHI; // ≈ 0.618 — golden ratio inverse (AURUM, Paper XXII)

const SYNC_THRESHOLD = 0.75;   // R below this → desynchronized
const DEFAULT_K = 2.0;         // Kuramoto coupling strength
const DEFAULT_RHO = 0.05;      // Pheromone evaporation rate ρ
const DEFAULT_D = 0.10;        // Diffusion coefficient D

// ---------------------------------------------------------------------------
// Pheromone Field (STIGMERGY)
// ---------------------------------------------------------------------------

class PheromoneField {
  /**
   * @param {{ evaporationRate?: number, diffusionRate?: number }} opts
   */
  constructor({ evaporationRate = DEFAULT_RHO, diffusionRate = DEFAULT_D } = {}) {
    this._tau = new Map();   // operation-key → concentration τ
    this.rho = evaporationRate;
    this.D = diffusionRate;
  }

  /**
   * Deposit reinforcement at key with quality q (proportional to outcome quality).
   * Implements the Σᵢ δ(xᵢ)·q(xᵢ,t) source term.
   */
  deposit(key, quality) {
    const current = this._tau.get(key) ?? 0;
    this._tau.set(key, current + quality);
  }

  /**
   * Evaporate field: τ ← τ × (1 − ρ).
   * Implements the −ρτ decay term.
   * Keys that fall below a minimum threshold are pruned.
   */
  evaporate() {
    const MIN = 1e-6;
    for (const [key, tau] of this._tau) {
      const next = tau * (1 - this.rho);
      if (next < MIN) {
        this._tau.delete(key);
      } else {
        this._tau.set(key, next);
      }
    }
  }

  /**
   * Diffuse: spread concentration to neighbors (keys sharing a prefix).
   * Implements the D∇²τ term (simplified 1-hop diffusion).
   */
  diffuse() {
    const delta = new Map();
    for (const [key, tau] of this._tau) {
      const prefix = key.split(':')[0];
      for (const [other, otherTau] of this._tau) {
        if (other !== key && other.startsWith(prefix)) {
          const flow = this.D * (tau - otherTau);
          delta.set(key, (delta.get(key) ?? 0) - flow);
          delta.set(other, (delta.get(other) ?? 0) + flow);
        }
      }
    }
    for (const [key, d] of delta) {
      this._tau.set(key, Math.max(0, (this._tau.get(key) ?? 0) + d));
    }
  }

  /** Return current concentration for key (or 0). */
  concentration(key) {
    return this._tau.get(key) ?? 0;
  }

  /**
   * Given a list of candidate keys, return them sorted by concentration
   * descending — the gradient the pheromone field recommends.
   */
  gradient(candidates) {
    return [...candidates].sort(
      (a, b) => this.concentration(b) - this.concentration(a),
    );
  }

  /** Snapshot of the full field. */
  snapshot() {
    return Object.fromEntries(this._tau);
  }
}

// ---------------------------------------------------------------------------
// NEXORIS
// ---------------------------------------------------------------------------

export class NEXORIS {
  /**
   * @param {object} [options]
   * @param {number} [options.couplingStrength] - Kuramoto K parameter.
   * @param {number} [options.evaporationRate]  - Pheromone ρ parameter.
   * @param {number} [options.diffusionRate]    - Pheromone D parameter.
   */
  constructor({
    couplingStrength = DEFAULT_K,
    evaporationRate = DEFAULT_RHO,
    diffusionRate = DEFAULT_D,
  } = {}) {
    this.K = couplingStrength;
    this._systems = new Map();  // systemId → { omega, theta, label }
    this._field = new PheromoneField({ evaporationRate, diffusionRate });
    this._orderParameter = 1.0;
    this._tickCount = 0;
    this._chrono = null;        // injected by bootstrapMeridian
  }

  /** Inject CHRONO for logging. */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  // ── Kuramoto synchronization ──────────────────────────────────────────────

  /**
   * Register an enterprise system as a Kuramoto oscillator.
   * @param {string} systemId
   * @param {{ omega: number, label?: string }} config
   *   omega — natural update frequency (rad/s equivalent, e.g. 6.28 for hourly)
   */
  registerSystem(systemId, { omega, label = systemId }) {
    this._systems.set(systemId, {
      omega,
      theta: Math.random() * 2 * Math.PI,  // random initial phase
      label,
    });
    return this;
  }

  /**
   * Advance the Kuramoto phase dynamics by dt time steps and evaporate the field.
   * dθᵢ/dt = ωᵢ + (K/N) × Σⱼ sin(θⱼ − θᵢ)
   *
   * @param {number} [dt=0.05] - Time step size.
   * @returns {{ orderParameter: number, synchronized: boolean, desynchronizedNodes: string[] }}
   */
  tick(dt = 0.05) {
    const systems = [...this._systems.entries()];
    const N = systems.length;

    if (N === 0) {
      this._orderParameter = 1.0;
      return { orderParameter: 1.0, synchronized: true, desynchronizedNodes: [] };
    }

    // Compute new phases via Euler integration
    const newThetas = new Map();
    for (const [id, sys] of systems) {
      let coupling = 0;
      for (const [, other] of systems) {
        coupling += Math.sin(other.theta - sys.theta);
      }
      const dTheta = sys.omega + (this.K / N) * coupling;
      newThetas.set(id, sys.theta + dTheta * dt);
    }
    for (const [id, theta] of newThetas) {
      this._systems.get(id).theta = theta % (2 * Math.PI);
    }

    // Compute order parameter R = |Σ e^(iθ)| / N
    let sinSum = 0;
    let cosSum = 0;
    for (const [, sys] of systems) {
      sinSum += Math.sin(sys.theta);
      cosSum += Math.cos(sys.theta);
    }
    this._orderParameter = Math.sqrt(sinSum ** 2 + cosSum ** 2) / N;

    // Evaporate + diffuse the pheromone field on every tick
    this._field.evaporate();
    this._field.diffuse();

    this._tickCount++;

    // Identify desynchronized nodes (phase deviation > π/4 from mean)
    const meanPhase = Math.atan2(sinSum / N, cosSum / N);
    const desynchronizedNodes = systems
      .filter(([, sys]) => {
        const diff = Math.abs(sys.theta - meanPhase);
        return Math.min(diff, 2 * Math.PI - diff) > Math.PI / 4;
      })
      .map(([id]) => id);

    return {
      orderParameter: this._orderParameter,
      synchronized: this._orderParameter >= SYNC_THRESHOLD,
      desynchronizedNodes,
    };
  }

  // ── Pheromone routing ─────────────────────────────────────────────────────

  /**
   * Reinforce a routing decision after a successful outcome.
   * Deposits pheromone proportional to quality on the operation key.
   * Implements CHRONO trail anchoring: every reinforcement is traceable.
   *
   * @param {string} operationKey - e.g. "CONTRACT_MANAGEMENT:salesforce"
   * @param {number} quality - 0–1, proportional to outcome quality
   */
  reinforce(operationKey, quality = 1.0) {
    this._field.deposit(operationKey, quality);
    if (this._chrono) {
      this._chrono.append({
        type: 'NEXORIS_REINFORCE',
        operationKey,
        quality,
        tick: this._tickCount,
      });
    }
  }

  /**
   * Route an execution plan through the synchronized systems.
   * Uses the pheromone gradient to rank candidate system routes.
   *
   * @param {object} executionPlan - { targets: string[], category: string, command: string }
   * @returns {{ routed: boolean, routes: Array<{ target, systemId, fieldConcentration, phase }> }}
   */
  route(executionPlan) {
    const { targets = [], category = 'GENERAL', command = '' } = executionPlan;

    const routes = targets.map((target) => {
      const key = `${category}:${target}`;
      return {
        target,
        systemId: target,
        operationKey: key,
        fieldConcentration: this._field.concentration(key),
        phase: this._systems.get(target)?.theta ?? null,
        status: 'dispatched',
      };
    });

    // Sort by pheromone concentration (field gradient) descending
    routes.sort((a, b) => b.fieldConcentration - a.fieldConcentration);

    if (this._chrono) {
      this._chrono.append({
        type: 'NEXORIS_ROUTE',
        category,
        command: command.slice(0, 120),
        routes: routes.map((r) => ({ target: r.target, concentration: r.fieldConcentration })),
        orderParameter: this._orderParameter,
      });
    }

    return { routed: routes.length > 0, routes };
  }

  // ── Observability ─────────────────────────────────────────────────────────

  get orderParameter() { return this._orderParameter; }
  get synchronized() { return this._orderParameter >= SYNC_THRESHOLD; }

  /** Full phase + frequency state of all registered systems. */
  systemsState() {
    return [...this._systems.entries()].map(([id, sys]) => ({
      systemId: id,
      label: sys.label,
      omega: sys.omega,
      theta: sys.theta,
    }));
  }

  /** Snapshot of the pheromone field. */
  fieldSnapshot() {
    return this._field.snapshot();
  }
}

export default NEXORIS;
