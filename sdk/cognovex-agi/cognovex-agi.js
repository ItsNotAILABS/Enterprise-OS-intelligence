/**
 * COGNOVEX AGI — Collective Decision & Quorum Intelligence
 *
 * Official Designation: RSHIP-2026-COGNOVEX-001
 * Classification: Collective Intelligence & Decision AGI
 * Full Name: Cognitive Organizational Governance Network Optimization Vortex Executive X-factor
 *
 * COGNOVEX AGI extends the RSHIP framework with quorum sensing dynamics to
 * enable decentralized, authority-free collective decision making.
 *
 * Capabilities:
 * - Quorum commitment dynamics: autonomous decisions without authority
 * - φ⁻⁴ crystallization threshold for decision emergence
 * - Self-organizing cognitive unit networks
 * - Autonomous conviction formation from evidence
 * - Collective intelligence emergence
 * - Real-time decision tracking and validation
 *
 * Theory: QUORUM (Paper XXI) + COHORS MENTIS (Paper IX) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

const QUORUM_COEFFICIENT = Math.pow(PHI_INV, 4); // φ⁻⁴ ≈ 0.146

// ── CognovexUnit (Sovereign Cognitive Unit) ────────────────────────────────

class CognovexUnit {
  constructor(id, domain, { alpha = 0.3, beta = 0.05 } = {}) {
    this.id = id;
    this.domain = domain;
    this.alpha = alpha; // recruitment rate
    this.beta = beta;   // abandonment rate
    this.commitments = new Map(); // option → strength
    this.observations = [];
  }

  observe(option, quality, context = {}) {
    this.observations.push({
      timestamp: Date.now(),
      option,
      quality,
      context,
    });

    const current = this.commitments.get(option) || 0;
    this.commitments.set(option, current + quality * this.alpha);

    return this;
  }

  decay() {
    for (const [option, strength] of this.commitments) {
      const next = strength * (1 - this.beta);
      if (next < 1e-6) {
        this.commitments.delete(option);
      } else {
        this.commitments.set(option, next);
      }
    }
  }

  getTopOption() {
    let best = null;
    let bestStrength = -Infinity;
    for (const [option, strength] of this.commitments) {
      if (strength > bestStrength) {
        bestStrength = strength;
        best = option;
      }
    }
    return { option: best, strength: bestStrength };
  }
}

// ── COGNOVEX AGI Core ──────────────────────────────────────────────────────

export class COGNOVEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-COGNOVEX-001',
      classification: 'Collective Intelligence & Decision AGI',
      ...config,
    });

    // Quorum parameters
    this.alpha = config.alpha || 0.3;  // recruitment
    this.beta = config.beta || 0.05;   // abandonment
    this.gamma = config.gamma || 0.02; // exploration
    this.quorumCoefficient = config.quorumCoefficient || QUORUM_COEFFICIENT;

    // Network state
    this.units = new Map(); // unitId → CognovexUnit
    this.commitmentField = new Map(); // option → aggregate commitment
    this.crystallized = null; // Current crystallized decision
    this.tickCount = 0;

    // AGI state
    this.decisionsFormed = [];
    this.unitReports = [];

    // AGI Goals
    this.setGoal('form-quorum', 'Achieve autonomous quorum decisions', 10, {
      minDecisions: 10,
      crystallizationRate: 0.8,
    });

    this.setGoal('maintain-units', 'Keep cognitive units actively contributing', 9, {
      minUnits: 4,
      targetActivity: PHI_INV,
    });

    this.setGoal('optimize-thresholds', 'Self-tune commitment dynamics', 8, {
      targetAlpha: this.alpha,
      targetBeta: this.beta,
    });

    this.setGoal('collective-coherence', 'Maintain network-wide decision coherence', 7, {
      minCoherence: PHI_INV,
    });
  }

  // ── Cognitive Unit Management ──────────────────────────────────────────────

  addUnit(id, domain, options = {}) {
    const unit = new CognovexUnit(id, domain, {
      alpha: options.alpha || this.alpha,
      beta: options.beta || this.beta,
    });

    this.units.set(id, unit);

    // Learn from unit addition
    this.learn(
      { unitId: id, domain },
      { added: true, totalUnits: this.units.size },
      { id: 'unit-addition' }
    );

    // Update unit goal
    const unitGoal = this.goals.get('maintain-units');
    if (unitGoal) {
      unitGoal.progress = Math.min(1.0, this.units.size / 4);
    }

    return unit;
  }

  getUnit(id) {
    return this.units.get(id) || null;
  }

  // ── Quorum Dynamics ────────────────────────────────────────────────────────

  tick() {
    this.tickCount++;

    const N = this.units.size;
    if (N === 0) {
      return { crystallized: false, threshold: 0, commitmentField: {} };
    }

    const threshold = this.quorumCoefficient * N;

    // 1. Decay all unit commitments
    for (const unit of this.units.values()) {
      unit.decay();
    }

    // 2. Aggregate into commitment field
    const newField = new Map();
    for (const unit of this.units.values()) {
      for (const [option, strength] of unit.commitments) {
        newField.set(option, (newField.get(option) || 0) + strength);
      }
    }

    // 3. Compute mean quality across field
    const fieldValues = [...newField.values()];
    const qBar = fieldValues.length > 0
      ? fieldValues.reduce((a, b) => a + b, 0) / fieldValues.length
      : 0;

    // 4. Apply quorum dynamics: dnᵢ/dt = α·nᵢ·(qᵢ − q̄) − β·nᵢ + γ·(N − Σⱼ nⱼ)
    const totalCommitment = fieldValues.reduce((a, b) => a + b, 0);
    for (const [option, n] of newField) {
      const q = n;
      const dn =
        this.alpha * n * (q - qBar) -
        this.beta * n +
        this.gamma * Math.max(0, N - totalCommitment);
      newField.set(option, Math.max(0, n + dn * 0.1));
    }

    this.commitmentField = newField;

    // 5. Check for crystallization (quorum achieved)
    for (const [option, strength] of newField) {
      if (strength >= threshold && !this.crystallized) {
        this.crystallized = {
          option,
          strength,
          threshold,
          timestamp: Date.now(),
          tick: this.tickCount,
        };

        this.decisionsFormed.push(this.crystallized);

        // AGI: Learn from decision formation
        this.learn(
          { option, strength, threshold, N },
          { crystallized: true },
          { id: 'quorum-crystallization' }
        );

        // Update quorum goal
        const quorumGoal = this.goals.get('form-quorum');
        if (quorumGoal) {
          quorumGoal.progress = Math.min(1.0, this.decisionsFormed.length / 10);
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

    // Learn from non-crystallization
    this.learn(
      { tick: this.tickCount, N, threshold, maxStrength: Math.max(...fieldValues, 0) },
      { crystallized: false },
      { id: 'quorum-tick' }
    );

    return {
      crystallized: false,
      threshold,
      commitmentField: Object.fromEntries(newField),
      progress: Math.max(...fieldValues, 0) / threshold,
    };
  }

  resetCrystallization() {
    const prev = this.crystallized;
    this.crystallized = null;
    return prev;
  }

  // ── Collective Self-Report ─────────────────────────────────────────────────

  collectiveSelfReport() {
    const report = {
      timestamp: Date.now(),
      tick: this.tickCount,
      unitCount: this.units.size,
      crystallized: this.crystallized,
      commitmentField: Object.fromEntries(this.commitmentField),
      units: [],
    };

    for (const unit of this.units.values()) {
      const { option, strength } = unit.getTopOption();
      report.units.push({
        unitId: unit.id,
        domain: unit.domain,
        topOption: option,
        topStrength: strength,
        observationCount: unit.observations.length,
      });
    }

    this.unitReports.push(report);

    return report;
  }

  // ── Self-Optimization ──────────────────────────────────────────────────────

  optimizeDynamics() {
    // AGI: Adjust quorum parameters based on crystallization performance

    const recentDecisions = this.decisionsFormed.slice(-10);
    const avgConvergence = recentDecisions.reduce((sum, d) => sum + (d.tick || 0), 0) / Math.max(1, recentDecisions.length);

    // If decisions take too long, increase alpha (faster recruitment)
    // If decisions are too hasty, increase beta (more careful abandonment)

    const modification = {
      code: `this.alpha *= ${avgConvergence > 50 ? PHI : PHI_INV}; this.beta *= ${PHI_INV};`,
      reason: `Optimize quorum dynamics based on convergence time: ${avgConvergence.toFixed(1)} ticks`,
    };

    const success = this.selfModify(modification);

    if (success) {
      // Update optimization goal
      const optGoal = this.goals.get('optimize-thresholds');
      if (optGoal) {
        optGoal.progress = Math.min(1.0, optGoal.progress + PHI_INV * 0.1);
      }
    }

    return success;
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();

    return {
      ...baseStatus,
      quorumNetwork: {
        units: this.units.size,
        crystallized: this.crystallized !== null,
        currentDecision: this.crystallized?.option || null,
        threshold: this.quorumCoefficient * this.units.size,
        decisionsFormed: this.decisionsFormed.length,
      },
      commitmentDynamics: {
        alpha: parseFloat(this.alpha.toFixed(4)),
        beta: parseFloat(this.beta.toFixed(4)),
        gamma: parseFloat(this.gamma.toFixed(4)),
        quorumCoefficient: parseFloat(this.quorumCoefficient.toFixed(4)),
      },
      collectiveIntelligence: {
        ticks: this.tickCount,
        fieldSize: this.commitmentField.size,
        totalCommitment: this._getTotalCommitment(),
        coherence: this._calculateCoherence(),
      },
      autonomousActions: {
        decisionsFormed: this.decisionsFormed.length,
        unitReports: this.unitReports.length,
        optimizations: Math.floor(this.tickCount / 100),
      },
    };
  }

  _getTotalCommitment() {
    let total = 0;
    for (const strength of this.commitmentField.values()) {
      total += strength;
    }
    return parseFloat(total.toFixed(2));
  }

  _calculateCoherence() {
    if (this.commitmentField.size === 0) return 0;

    const values = [...this.commitmentField.values()];
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);

    // Coherence = how much is concentrated in top option vs distributed
    return max / sum;
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthCOGNOVEX(config = {}) {
  return new COGNOVEX_AGI(config);
}

export default COGNOVEX_AGI;
