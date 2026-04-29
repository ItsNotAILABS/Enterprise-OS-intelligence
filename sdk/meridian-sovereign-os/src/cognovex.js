/**
 * COGNOVEX — Sovereign Cognitive Unit with Quorum Commitment Dynamics
 *
 * Theory: QUORUM (Paper XXI) + COHORS MENTIS (Paper IX)
 *
 * A COGNOVEX unit is a sovereign forager in the stigmergic model. It:
 *   - Operates autonomously, monitoring a domain of enterprise reality
 *   - Forms independent conviction based on evidence it observes
 *   - Deposits commitment signals into the shared NEXORIS field
 *   - Does NOT route messages to other units — coordination emerges from the field
 *
 * A network of COGNOVEX units implements quorum governance (Paper XXI):
 *   dnᵢ/dt = α·nᵢ·(qᵢ − q̄) − β·nᵢ + γ·(N − Σⱼ nⱼ)
 *
 *   α = recruitment coefficient (how fast strong evidence recruits more commitment)
 *   β = abandonment coefficient (conviction decays without fresh reinforcement)
 *   γ = exploration coefficient (uncommitted capacity independently discovers options)
 *
 * Crystallization threshold: θ = PHI⁻⁴ × N  (≈ 0.146 × N)
 * When any option's commitment crosses θ, the network crystallizes — the decision
 * is made without any authority, without any override, without any deadlock.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { PHI_INV } from './nexoris.js';

// Quorum threshold coefficient: φ⁻⁴ ≈ 0.146 (AURUM, Paper XXII)
const QUORUM_COEFFICIENT = PHI_INV ** 4; // ≈ 0.146

// Default commitment dynamics parameters (tunable per deployment)
const DEFAULT_ALPHA = 0.3;   // recruitment rate
const DEFAULT_BETA  = 0.05;  // abandonment rate
const DEFAULT_GAMMA = 0.02;  // exploration rate

// ---------------------------------------------------------------------------
// CognovexUnit — individual sovereign cognitive unit
// ---------------------------------------------------------------------------

export class CognovexUnit {
  /**
   * @param {string} id       - Unique unit identifier
   * @param {string} domain   - Enterprise domain this unit monitors (e.g. 'FINANCE', 'IT')
   * @param {object} [options]
   * @param {number} [options.alpha] - Recruitment coefficient
   * @param {number} [options.beta]  - Abandonment coefficient
   */
  constructor(id, domain, { alpha = DEFAULT_ALPHA, beta = DEFAULT_BETA } = {}) {
    this.id = id;
    this.domain = domain;
    this.alpha = alpha;
    this.beta = beta;
    this._commitments = new Map();  // option → commitment strength [0,∞)
    this._observations = [];
    this._selfReports = [];
    this._active = false;
  }

  // ── Observation ───────────────────────────────────────────────────────────

  /**
   * Observe a signal from the enterprise environment.
   * This is the unit's evidence channel — what it "sees" in its domain.
   *
   * @param {string} option    - Decision option this signal supports
   * @param {number} quality   - Evidence quality, 0–1
   * @param {object} [context] - Additional context metadata
   */
  observe(option, quality, context = {}) {
    this._observations.push({
      timestamp: new Date().toISOString(),
      option,
      quality,
      context,
    });

    // Increase commitment proportional to evidence quality
    const current = this._commitments.get(option) ?? 0;
    this._commitments.set(option, current + quality * this.alpha);

    return this;
  }

  /**
   * Decay all commitments by the abandonment coefficient β.
   * Call once per heartbeat tick.
   */
  decay() {
    for (const [option, strength] of this._commitments) {
      const next = strength * (1 - this.beta);
      if (next < 1e-6) {
        this._commitments.delete(option);
      } else {
        this._commitments.set(option, next);
      }
    }
  }

  /**
   * Self-report: publish this unit's current conviction state without being asked.
   * This is the "shows up to work whether or not you called it" behavior (Paper IX).
   */
  selfReport() {
    const topOption = this._topOption();
    const report = {
      unitId: this.id,
      domain: this.domain,
      timestamp: new Date().toISOString(),
      topOption,
      topStrength: topOption ? this._commitments.get(topOption) : 0,
      allCommitments: Object.fromEntries(this._commitments),
      observationCount: this._observations.length,
    };
    this._selfReports.push(report);
    return report;
  }

  _topOption() {
    let best = null;
    let bestStrength = -Infinity;
    for (const [option, strength] of this._commitments) {
      if (strength > bestStrength) {
        bestStrength = strength;
        best = option;
      }
    }
    return best;
  }

  get commitments() {
    return new Map(this._commitments);
  }

  get observations() {
    return [...this._observations];
  }
}

// ---------------------------------------------------------------------------
// CognovexNetwork — quorum sensing across a population of units
// ---------------------------------------------------------------------------

export class CognovexNetwork {
  /**
   * @param {object} [options]
   * @param {number} [options.alpha]   - Recruitment coefficient
   * @param {number} [options.beta]    - Abandonment coefficient
   * @param {number} [options.gamma]   - Exploration coefficient
   * @param {number} [options.quorumCoefficient] - Override θ = coefficient × N
   */
  constructor({
    alpha = DEFAULT_ALPHA,
    beta  = DEFAULT_BETA,
    gamma = DEFAULT_GAMMA,
    quorumCoefficient = QUORUM_COEFFICIENT,
  } = {}) {
    this.alpha = alpha;
    this.beta  = beta;
    this.gamma = gamma;
    this.quorumCoefficient = quorumCoefficient;

    this._units = new Map();          // unitId → CognovexUnit
    this._commitmentField = new Map(); // option → aggregate commitment
    this._crystallized = null;         // null or { option, strength, timestamp }
    this._chrono = null;
    this._nexoris = null;
    this._tickCount = 0;
  }

  /** Inject CHRONO for permanent trail record. */
  setChrono(chrono) { this._chrono = chrono; return this; }
  /** Inject NEXORIS for pheromone field integration. */
  setNexoris(nexoris) { this._nexoris = nexoris; return this; }

  // ── Network management ────────────────────────────────────────────────────

  /**
   * Add a COGNOVEX unit to the network.
   */
  addUnit(id, domain, options = {}) {
    const unit = new CognovexUnit(id, domain, {
      alpha: options.alpha ?? this.alpha,
      beta: options.beta ?? this.beta,
    });
    this._units.set(id, unit);
    return unit;
  }

  /**
   * Get an existing unit by ID.
   */
  unit(id) {
    return this._units.get(id) ?? null;
  }

  // ── Quorum dynamics ───────────────────────────────────────────────────────

  /**
   * Advance network dynamics by one tick.
   *
   * Implements the full commitment evolution:
   *   dnᵢ/dt = α·nᵢ·(qᵢ − q̄) − β·nᵢ + γ·(N − Σⱼ nⱼ)
   *
   * Then checks whether any option has crossed the quorum threshold θ.
   *
   * @returns {{ crystallized: boolean, option?: string, strength?: number,
   *             threshold: number, commitmentField: object }}
   */
  tick() {
    const N = this._units.size;
    if (N === 0) return { crystallized: false, threshold: 0, commitmentField: {} };

    const threshold = this.quorumCoefficient * N;

    // 1. Each unit decays its commitments
    for (const unit of this._units.values()) {
      unit.decay();
    }

    // 2. Aggregate individual commitments into the shared field
    const newField = new Map();
    for (const unit of this._units.values()) {
      for (const [option, strength] of unit.commitments) {
        newField.set(option, (newField.get(option) ?? 0) + strength);
      }
    }

    // 3. Compute mean quality q̄ across all options in the field
    const fieldValues = [...newField.values()];
    const qBar = fieldValues.length > 0
      ? fieldValues.reduce((a, b) => a + b, 0) / fieldValues.length
      : 0;

    // 4. Apply the quorum dynamics to the field level (macro equation)
    //    dnᵢ/dt = α·nᵢ·(qᵢ − q̄) − β·nᵢ + γ·(N − Σⱼ nⱼ)
    const totalCommitment = fieldValues.reduce((a, b) => a + b, 0);
    for (const [option, n] of newField) {
      const q = n;
      const dn =
        this.alpha * n * (q - qBar) -
        this.beta  * n +
        this.gamma * Math.max(0, N - totalCommitment);
      newField.set(option, Math.max(0, n + dn * 0.1)); // dt = 0.1
    }

    this._commitmentField = newField;
    this._tickCount++;

    // 5. Deposit into NEXORIS pheromone field
    if (this._nexoris) {
      for (const [option, strength] of newField) {
        this._nexoris.reinforce(`COGNOVEX:${option}`, Math.min(1, strength / (N + 1)));
      }
    }

    // 6. Check quorum threshold — phase transition detection
    for (const [option, strength] of newField) {
      if (strength >= threshold && !this._crystallized) {
        this._crystallized = {
          option,
          strength,
          threshold,
          timestamp: new Date().toISOString(),
          tick: this._tickCount,
        };

        if (this._chrono) {
          this._chrono.append({
            type: 'COGNOVEX_CRYSTALLIZATION',
            option,
            strength,
            threshold,
            N,
            tick: this._tickCount,
          });
        }

        return {
          crystallized: true,
          option,
          strength,
          threshold,
          commitmentField: Object.fromEntries(newField),
        };
      }
    }

    return {
      crystallized: false,
      threshold,
      commitmentField: Object.fromEntries(newField),
    };
  }

  /**
   * Reset crystallization state — allows new quorum cycle after a decision
   * has been acted on.
   */
  resetCrystallization() {
    const prev = this._crystallized;
    this._crystallized = null;
    return prev;
  }

  /**
   * Issue a collective self-report from all units.
   * This is the COGNOVEX network showing up to work — surfacing its current
   * state without being asked.
   */
  collectiveSelfReport() {
    return {
      timestamp: new Date().toISOString(),
      unitCount: this._units.size,
      tick: this._tickCount,
      crystallized: this._crystallized,
      commitmentField: Object.fromEntries(this._commitmentField),
      unitReports: [...this._units.values()].map((u) => u.selfReport()),
    };
  }

  get crystallized() { return this._crystallized; }
  get tickCount()    { return this._tickCount; }
  get unitCount()    { return this._units.size; }
}

export default CognovexNetwork;
