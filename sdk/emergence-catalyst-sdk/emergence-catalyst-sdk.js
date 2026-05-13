/**
 * EMERGENCE CATALYST SDK
 * RSHIP-2026-EMERGENCE-CATALYST-001
 *
 * Phase transition catalysis for AGI systems. Implements criticality
 * detection, emergence triggers, and φ-weighted bifurcation analysis
 * for controlled system transformation.
 *
 * @module emergence-catalyst-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;

// ═══════════════════════════════════════════════════════════════════════════
// EMERGENCE TYPES
// ═══════════════════════════════════════════════════════════════════════════

const EmergencePhase = {
  SUBCRITICAL: 'subcritical',
  CRITICAL: 'critical',
  SUPERCRITICAL: 'supercritical',
  EMERGENT: 'emergent'
};

const TransitionType = {
  CONTINUOUS: 'continuous',
  DISCONTINUOUS: 'discontinuous',
  EXPLOSIVE: 'explosive'
};

const CatalystType = {
  AMPLIFIER: 'amplifier',
  SYNCHRONIZER: 'synchronizer',
  DESTABILIZER: 'destabilizer',
  NUCLEATOR: 'nucleator'
};

// ═══════════════════════════════════════════════════════════════════════════
// ORDER PARAMETER
// ═══════════════════════════════════════════════════════════════════════════

class OrderParameter {
  constructor(id, options = {}) {
    this.id = id;
    this.value = options.initialValue || 0;
    this.history = [];
    this.maxHistory = options.maxHistory || 1000;
    this.criticalValue = options.criticalValue || PHI - 1; // ~0.618
    this.fluctuations = [];
    this.created = Date.now();
  }

  update(value) {
    this.history.push({ value: this.value, timestamp: Date.now() });
    if (this.history.length > this.maxHistory) this.history.shift();
    this.value = value;
    this._recordFluctuation();
  }

  _recordFluctuation() {
    if (this.history.length < 2) return;
    const prev = this.history[this.history.length - 1].value;
    const delta = this.value - prev;
    this.fluctuations.push(Math.abs(delta));
    if (this.fluctuations.length > 100) this.fluctuations.shift();
  }

  getFluctuationMagnitude() {
    if (this.fluctuations.length === 0) return 0;
    return this.fluctuations.reduce((a, b) => a + b, 0) / this.fluctuations.length;
  }

  isCritical() {
    return Math.abs(this.value - this.criticalValue) < 0.1;
  }

  getPhase() {
    if (this.value < this.criticalValue * 0.8) return EmergencePhase.SUBCRITICAL;
    if (Math.abs(this.value - this.criticalValue) < 0.1) return EmergencePhase.CRITICAL;
    if (this.value > this.criticalValue) return EmergencePhase.SUPERCRITICAL;
    return EmergencePhase.SUBCRITICAL;
  }

  getSusceptibility() {
    // Diverges near critical point
    const distance = Math.abs(this.value - this.criticalValue);
    if (distance < 0.01) return 1000;
    return 1 / distance;
  }

  getCorrelationLength() {
    // Also diverges near critical point
    const distance = Math.abs(this.value - this.criticalValue);
    if (distance < 0.01) return 100;
    return Math.pow(distance, -0.5);
  }

  toJSON() {
    return {
      id: this.id,
      value: this.value,
      phase: this.getPhase(),
      isCritical: this.isCritical(),
      fluctuationMagnitude: this.getFluctuationMagnitude(),
      susceptibility: this.getSusceptibility(),
      correlationLength: this.getCorrelationLength()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CATALYST
// ═══════════════════════════════════════════════════════════════════════════

class Catalyst {
  constructor(id, type, options = {}) {
    this.id = id;
    this.type = type;
    this.strength = options.strength || 1.0;
    this.threshold = options.threshold || 0.5;
    this.activated = false;
    this.activationCount = 0;
    this.lastActivation = null;
    this.created = Date.now();
  }

  shouldActivate(orderParameter) {
    switch (this.type) {
      case CatalystType.AMPLIFIER:
        return orderParameter.value > this.threshold;
      case CatalystType.SYNCHRONIZER:
        return orderParameter.getFluctuationMagnitude() > this.threshold;
      case CatalystType.DESTABILIZER:
        return orderParameter.isCritical();
      case CatalystType.NUCLEATOR:
        return orderParameter.value < this.threshold && Math.random() < 0.1;
      default:
        return false;
    }
  }

  activate(orderParameter) {
    this.activated = true;
    this.activationCount++;
    this.lastActivation = Date.now();

    let effect = 0;

    switch (this.type) {
      case CatalystType.AMPLIFIER:
        effect = orderParameter.value * this.strength * 0.1;
        break;
      case CatalystType.SYNCHRONIZER:
        effect = (orderParameter.criticalValue - orderParameter.value) * this.strength * 0.05;
        break;
      case CatalystType.DESTABILIZER:
        effect = (Math.random() - 0.5) * this.strength * 0.2;
        break;
      case CatalystType.NUCLEATOR:
        effect = this.strength * 0.3;
        break;
    }

    return effect;
  }

  deactivate() {
    this.activated = false;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      strength: this.strength,
      threshold: this.threshold,
      activated: this.activated,
      activationCount: this.activationCount
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMERGENCE REACTOR
// ═══════════════════════════════════════════════════════════════════════════

class EmergenceReactor extends EventEmitter {
  constructor(id, options = {}) {
    super();
    this.id = id;
    this.orderParameters = new Map();
    this.catalysts = new Map();
    this.phase = EmergencePhase.SUBCRITICAL;
    this.temperature = options.temperature || 1.0;
    this.pressure = options.pressure || 1.0;
    this.emergenceCount = 0;
    this.created = Date.now();
    this.metrics = {
      cycles: 0,
      emergenceEvents: 0,
      catalystActivations: 0
    };
  }

  addOrderParameter(id, options = {}) {
    const param = new OrderParameter(id, options);
    this.orderParameters.set(id, param);
    this.emit('parameter-added', { parameter: param.toJSON() });
    return param;
  }

  getOrderParameter(id) {
    return this.orderParameters.get(id);
  }

  addCatalyst(type, options = {}) {
    const id = options.id || crypto.randomUUID();
    const catalyst = new Catalyst(id, type, options);
    this.catalysts.set(id, catalyst);
    this.emit('catalyst-added', { catalyst: catalyst.toJSON() });
    return catalyst;
  }

  evolve() {
    this.metrics.cycles++;

    // Update order parameters with thermal noise
    for (const [id, param] of this.orderParameters) {
      const noise = (Math.random() - 0.5) * this.temperature * 0.1;
      const pressure_effect = this.pressure * 0.01;

      // Natural dynamics toward criticality
      let delta = noise + pressure_effect;

      // Apply catalysts
      for (const [cId, catalyst] of this.catalysts) {
        if (catalyst.shouldActivate(param)) {
          delta += catalyst.activate(param);
          this.metrics.catalystActivations++;
          catalyst.deactivate();
        }
      }

      param.update(param.value + delta);
    }

    // Check for phase transitions
    this._checkPhaseTransition();

    this.emit('evolved', { phase: this.phase, metrics: this.metrics });
  }

  _checkPhaseTransition() {
    let criticalCount = 0;
    let supercriticalCount = 0;

    for (const [id, param] of this.orderParameters) {
      if (param.isCritical()) criticalCount++;
      if (param.getPhase() === EmergencePhase.SUPERCRITICAL) supercriticalCount++;
    }

    const totalParams = this.orderParameters.size;
    if (totalParams === 0) return;

    const criticalFraction = criticalCount / totalParams;
    const supercriticalFraction = supercriticalCount / totalParams;

    const previousPhase = this.phase;

    if (supercriticalFraction > 0.5) {
      this.phase = EmergencePhase.EMERGENT;
    } else if (criticalFraction > 0.3) {
      this.phase = EmergencePhase.CRITICAL;
    } else if (supercriticalFraction > 0.1) {
      this.phase = EmergencePhase.SUPERCRITICAL;
    } else {
      this.phase = EmergencePhase.SUBCRITICAL;
    }

    if (this.phase === EmergencePhase.EMERGENT && previousPhase !== EmergencePhase.EMERGENT) {
      this.emergenceCount++;
      this.metrics.emergenceEvents++;
      this.emit('emergence', {
        count: this.emergenceCount,
        parameters: Array.from(this.orderParameters.entries()).map(([id, p]) => p.toJSON())
      });
    }
  }

  heat(amount = 0.1) {
    this.temperature = Math.min(10, this.temperature + amount);
    this.emit('temperature-changed', { temperature: this.temperature });
  }

  cool(amount = 0.1) {
    this.temperature = Math.max(0.01, this.temperature - amount);
    this.emit('temperature-changed', { temperature: this.temperature });
  }

  compress(amount = 0.1) {
    this.pressure = Math.min(10, this.pressure + amount);
    this.emit('pressure-changed', { pressure: this.pressure });
  }

  expand(amount = 0.1) {
    this.pressure = Math.max(0.1, this.pressure - amount);
    this.emit('pressure-changed', { pressure: this.pressure });
  }

  triggerEmergence() {
    // Force parameters toward critical point
    for (const [id, param] of this.orderParameters) {
      const target = param.criticalValue * (1 + (Math.random() - 0.5) * 0.1);
      param.update(param.value + (target - param.value) * 0.5);
    }

    // Activate all catalysts
    for (const [id, catalyst] of this.catalysts) {
      for (const [pId, param] of this.orderParameters) {
        if (catalyst.shouldActivate(param)) {
          param.update(param.value + catalyst.activate(param));
        }
      }
    }

    this._checkPhaseTransition();
    this.emit('triggered', { phase: this.phase });
  }

  status() {
    const paramStats = {};
    for (const [id, param] of this.orderParameters) paramStats[id] = param.toJSON();

    const catalystStats = {};
    for (const [id, cat] of this.catalysts) catalystStats[id] = cat.toJSON();

    return {
      id: this.id,
      phase: this.phase,
      temperature: this.temperature,
      pressure: this.pressure,
      emergenceCount: this.emergenceCount,
      orderParameterCount: this.orderParameters.size,
      catalystCount: this.catalysts.size,
      orderParameters: paramStats,
      catalysts: catalystStats,
      metrics: { ...this.metrics }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMERGENCE CATALYST SDK
// ═══════════════════════════════════════════════════════════════════════════

class EmergenceCatalystSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = 'RSHIP-2026-EMERGENCE-CATALYST-001';
    this.name = 'EmergenceCatalystSDK';
    this.version = '1.0.0';
    this.config = config;
    this.reactors = new Map();
    this.state = 'initialized';
    this.running = false;
    this._evolutionInterval = null;
  }

  async start() {
    this.running = true;
    this.state = 'running';
    this._evolutionInterval = setInterval(() => {
      for (const [id, reactor] of this.reactors) reactor.evolve();
    }, 100);
    this.emit('started');
  }

  async stop() {
    this.running = false;
    this.state = 'stopped';
    if (this._evolutionInterval) {
      clearInterval(this._evolutionInterval);
      this._evolutionInterval = null;
    }
    this.emit('stopped');
  }

  createReactor(id, options = {}) {
    const reactor = new EmergenceReactor(id, options);
    this.reactors.set(id, reactor);
    reactor.on('emergence', (e) => this.emit('emergence', { reactorId: id, ...e }));
    this.emit('reactor-created', { id });
    return reactor;
  }

  getReactor(id) {
    return this.reactors.get(id) || null;
  }

  status() {
    const reactorStats = {};
    for (const [id, reactor] of this.reactors) reactorStats[id] = reactor.status();
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      state: this.state,
      reactorCount: this.reactors.size,
      reactors: reactorStats
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  EmergencePhase,
  TransitionType,
  CatalystType,
  OrderParameter,
  Catalyst,
  EmergenceReactor,
  EmergenceCatalystSDK
};
