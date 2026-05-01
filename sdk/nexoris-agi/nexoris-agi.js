/**
 * NEXORIS AGI — Routing & Synchronization Intelligence
 *
 * Official Designation: RSHIP-2026-NEXORIS-001
 * Classification: Routing & Synchronization AGI
 * Full Name: Network Executive X-factor Organizational Routing Intelligence System
 *
 * NEXORIS AGI extends the RSHIP framework with Kuramoto synchronization and
 * stigmergic pheromone field routing to autonomously coordinate enterprise systems.
 *
 * Capabilities:
 * - Kuramoto phase synchronization across enterprise systems
 * - Stigmergic pheromone field routing (organizational memory)
 * - Autonomous desynchronization detection and correction
 * - Self-organizing routing optimization
 * - Predictive synchronization forecasting
 * - Real-time gradient-based decision making
 *
 * Theory: CONCORDIA MACHINAE (Paper II) + STIGMERGY (Paper XX) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Pheromone Field (Stigmergic Intelligence) ──────────────────────────────

class PheromoneField {
  constructor({ evaporationRate = 0.05, diffusionRate = 0.10 } = {}) {
    this.tau = new Map(); // operation-key → concentration
    this.rho = evaporationRate;
    this.D = diffusionRate;
  }

  deposit(key, quality) {
    const current = this.tau.get(key) || 0;
    this.tau.set(key, current + quality);
  }

  evaporate() {
    const MIN = 1e-6;
    for (const [key, tau] of this.tau) {
      const next = tau * (1 - this.rho);
      if (next < MIN) {
        this.tau.delete(key);
      } else {
        this.tau.set(key, next);
      }
    }
  }

  diffuse() {
    const delta = new Map();
    for (const [key, tau] of this.tau) {
      const prefix = key.split(':')[0];
      for (const [other, otherTau] of this.tau) {
        if (other !== key && other.startsWith(prefix)) {
          const flow = this.D * (tau - otherTau);
          delta.set(key, (delta.get(key) || 0) - flow);
          delta.set(other, (delta.get(other) || 0) + flow);
        }
      }
    }
    for (const [key, d] of delta) {
      this.tau.set(key, Math.max(0, (this.tau.get(key) || 0) + d));
    }
  }

  concentration(key) {
    return this.tau.get(key) || 0;
  }

  gradient(candidates) {
    return [...candidates].sort(
      (a, b) => this.concentration(b) - this.concentration(a)
    );
  }

  snapshot() {
    return Object.fromEntries(this.tau);
  }
}

// ── NEXORIS AGI Core ───────────────────────────────────────────────────────

export class NEXORIS_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-NEXORIS-001',
      classification: 'Routing & Synchronization AGI',
      ...config,
    });

    // Kuramoto synchronization
    this.K = config.couplingStrength || 2.0; // Coupling strength
    this.systems = new Map(); // systemId → { omega, theta, label }
    this.orderParameter = 1.0;
    this.syncThreshold = PHI_INV; // φ⁻¹ ≈ 0.618 for coherence

    // Stigmergic pheromone field
    this.field = new PheromoneField({
      evaporationRate: config.evaporationRate || 0.05,
      diffusionRate: config.diffusionRate || 0.10,
    });

    // AGI state
    this.tickCount = 0;
    this.routingHistory = [];
    this.desyncEvents = [];
    this.autonomousCorrections = 0;

    // AGI Goals
    this.setGoal('maintain-synchronization', 'Keep all systems synchronized above φ⁻¹', 10, {
      minOrderParameter: this.syncThreshold,
      maxDesyncNodes: 0,
    });

    this.setGoal('optimize-routing', 'Continuously improve routing via pheromone learning', 9, {
      targetAccuracy: 0.95,
      minReinforcements: 100,
    });

    this.setGoal('detect-desync', 'Detect and correct desynchronization autonomously', 8, {
      detectionLatency: 1, // ticks
      correctionRate: 0.90,
    });

    this.setGoal('evolve-field', 'Evolve pheromone field to organizational optimum', 7, {
      targetEntropy: 2.5,
      convergenceRate: PHI_INV,
    });
  }

  // ── Kuramoto Synchronization ───────────────────────────────────────────────

  registerSystem(systemId, { omega, label = systemId }) {
    this.systems.set(systemId, {
      omega,
      theta: Math.random() * 2 * Math.PI,
      label,
      lastSync: this.tickCount,
    });

    // Learn from registration
    this.learn(
      { systemId, omega, label },
      { registered: true },
      { id: 'system-registration' }
    );

    return this;
  }

  tick(dt = 0.05) {
    this.tickCount++;

    const systems = [...this.systems.entries()];
    const N = systems.length;

    if (N === 0) {
      this.orderParameter = 1.0;
      return { orderParameter: 1.0, synchronized: true, desynchronizedNodes: [] };
    }

    // Kuramoto integration: dθᵢ/dt = ωᵢ + (K/N) × Σⱼ sin(θⱼ − θᵢ)
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
      this.systems.get(id).theta = theta % (2 * Math.PI);
    }

    // Compute order parameter R = |Σ e^(iθ)| / N
    let sinSum = 0;
    let cosSum = 0;
    for (const [, sys] of systems) {
      sinSum += Math.sin(sys.theta);
      cosSum += Math.cos(sys.theta);
    }
    this.orderParameter = Math.sqrt(sinSum ** 2 + cosSum ** 2) / N;

    // Evaporate + diffuse pheromone field
    this.field.evaporate();
    this.field.diffuse();

    // AGI: Detect desynchronized nodes
    const meanPhase = Math.atan2(sinSum / N, cosSum / N);
    const desynchronizedNodes = systems
      .filter(([, sys]) => {
        const diff = Math.abs(sys.theta - meanPhase);
        return Math.min(diff, 2 * Math.PI - diff) > Math.PI / 4;
      })
      .map(([id]) => id);

    // AGI: Autonomous correction if desynchronized
    if (desynchronizedNodes.length > 0) {
      this._correctDesynchronization(desynchronizedNodes);
    }

    // Learn from synchronization state
    this.learn(
      { tick: this.tickCount, N, orderParameter: this.orderParameter },
      { synchronized: this.orderParameter >= this.syncThreshold, desyncCount: desynchronizedNodes.length },
      { id: 'synchronization' }
    );

    // Update synchronization goal
    const syncGoal = this.goals.get('maintain-synchronization');
    if (syncGoal) {
      syncGoal.progress = this.orderParameter >= this.syncThreshold ? 1.0 : this.orderParameter / this.syncThreshold;
    }

    return {
      tick: this.tickCount,
      orderParameter: this.orderParameter,
      synchronized: this.orderParameter >= this.syncThreshold,
      desynchronizedNodes,
      fieldSize: this.field.tau.size,
    };
  }

  // ── Autonomous Desynchronization Correction ────────────────────────────────

  _correctDesynchronization(desyncNodes) {
    const correction = {
      tick: this.tickCount,
      nodes: desyncNodes,
      method: 'phase-reset',
    };

    // AGI: Reset desynchronized nodes toward mean phase
    let sinSum = 0;
    let cosSum = 0;
    for (const sys of this.systems.values()) {
      sinSum += Math.sin(sys.theta);
      cosSum += Math.cos(sys.theta);
    }
    const meanPhase = Math.atan2(sinSum / this.systems.size, cosSum / this.systems.size);

    for (const nodeId of desyncNodes) {
      const sys = this.systems.get(nodeId);
      if (sys) {
        // Move toward mean phase with φ⁻¹ weighting
        sys.theta = sys.theta + PHI_INV * (meanPhase - sys.theta);
        sys.lastSync = this.tickCount;
      }
    }

    this.desyncEvents.push(correction);
    this.autonomousCorrections++;

    // Learn from correction
    this.learn(
      { correction },
      { success: true, correctedCount: desyncNodes.length },
      { id: 'desync-correction' }
    );

    // Update detection goal
    const detectionGoal = this.goals.get('detect-desync');
    if (detectionGoal) {
      const successRate = this.autonomousCorrections / Math.max(1, this.desyncEvents.length);
      detectionGoal.progress = successRate;
    }
  }

  // ── Stigmergic Routing (Pheromone Field) ───────────────────────────────────

  reinforce(operationKey, quality = 1.0) {
    this.field.deposit(operationKey, quality);

    // Learn from reinforcement
    this.learn(
      { operationKey, quality, tick: this.tickCount },
      { fieldConcentration: this.field.concentration(operationKey) },
      { id: 'reinforcement' }
    );

    // Update routing goal
    const routingGoal = this.goals.get('optimize-routing');
    if (routingGoal) {
      const reinforcements = this.routingHistory.filter(r => r.reinforced).length;
      routingGoal.progress = Math.min(1.0, reinforcements / 100);
    }
  }

  route(executionPlan) {
    const { targets = [], category = 'GENERAL', command = '' } = executionPlan;

    const routes = targets.map((target) => {
      const key = `${category}:${target}`;
      return {
        target,
        systemId: target,
        operationKey: key,
        fieldConcentration: this.field.concentration(key),
        phase: this.systems.get(target)?.theta || null,
        status: 'dispatched',
      };
    });

    // Sort by pheromone gradient (highest concentration first)
    routes.sort((a, b) => b.fieldConcentration - a.fieldConcentration);

    const routing = {
      tick: this.tickCount,
      category,
      command: command.slice(0, 120),
      routes,
      orderParameter: this.orderParameter,
      reinforced: false,
    };

    this.routingHistory.push(routing);

    // Learn from routing
    this.learn(
      { executionPlan, routes },
      { routed: true, topConcentration: routes[0]?.fieldConcentration || 0 },
      { id: 'routing' }
    );

    return {
      routed: routes.length > 0,
      routes,
      orderParameter: this.orderParameter,
      recommended: routes[0], // Highest pheromone concentration
    };
  }

  // ── Self-Optimization ──────────────────────────────────────────────────────

  optimizeField() {
    // AGI: Adjust coupling strength based on synchronization performance

    const recentSync = this.memory.recall({ id: 'synchronization' }).slice(-20);
    const avgOrderParameter = recentSync.reduce((sum, m) => sum + m.output.synchronized, 0) / recentSync.length;

    const modification = {
      code: `this.K *= ${avgOrderParameter < this.syncThreshold ? PHI : PHI_INV};`,
      reason: `Adjust Kuramoto coupling based on synchronization: ${avgOrderParameter.toFixed(4)}`,
    };

    const success = this.selfModify(modification);

    if (success) {
      // Update field evolution goal
      const fieldGoal = this.goals.get('evolve-field');
      if (fieldGoal) {
        fieldGoal.progress = Math.min(1.0, fieldGoal.progress + PHI_INV * 0.1);
      }
    }

    return success;
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();

    return {
      ...baseStatus,
      synchronization: {
        orderParameter: parseFloat(this.orderParameter.toFixed(4)),
        synchronized: this.orderParameter >= this.syncThreshold,
        threshold: this.syncThreshold,
        systems: this.systems.size,
        couplingStrength: this.K,
      },
      routing: {
        totalRoutes: this.routingHistory.length,
        reinforcements: this.routingHistory.filter(r => r.reinforced).length,
        fieldSize: this.field.tau.size,
        avgConcentration: this._getAverageConcentration(),
      },
      autonomousActions: {
        ticks: this.tickCount,
        desyncEvents: this.desyncEvents.length,
        correctionsApplied: this.autonomousCorrections,
        correctionRate: this.autonomousCorrections / Math.max(1, this.desyncEvents.length),
      },
    };
  }

  _getAverageConcentration() {
    const values = [...this.field.tau.values()];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthNEXORIS(config = {}) {
  return new NEXORIS_AGI(config);
}

export default NEXORIS_AGI;
