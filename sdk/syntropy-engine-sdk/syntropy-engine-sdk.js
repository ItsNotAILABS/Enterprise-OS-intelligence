/**
 * SYNTROPY ENGINE SDK
 * RSHIP-2026-SYNTROPY-001
 *
 * Negative entropy and order emergence engine for AGI systems. Implements
 * syntropy dynamics, self-organization, and φ-weighted order amplification
 * for coherent system evolution.
 *
 * @module syntropy-engine-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;
const BOLTZMANN = 1.380649e-23;

// ═══════════════════════════════════════════════════════════════════════════
// SYNTROPY TYPES
// ═══════════════════════════════════════════════════════════════════════════

const SyntropyState = {
  DISORDERED: 'disordered',
  ORGANIZING: 'organizing',
  ORDERED: 'ordered',
  CRYSTALLINE: 'crystalline'
};

const AttractorType = {
  POINT: 'point',
  LIMIT_CYCLE: 'limit_cycle',
  TORUS: 'torus',
  STRANGE: 'strange'
};

// ═══════════════════════════════════════════════════════════════════════════
// MICROSTATE
// ═══════════════════════════════════════════════════════════════════════════

class Microstate {
  constructor(id, configuration) {
    this.id = id;
    this.configuration = configuration;
    this.energy = this._computeEnergy();
    this.weight = 1.0;
    this.probability = 0;
    this.created = Date.now();
  }

  _computeEnergy() {
    if (typeof this.configuration === 'object') {
      const values = Object.values(this.configuration);
      return values.reduce((sum, v) => sum + (typeof v === 'number' ? Math.abs(v) : 0), 0);
    }
    return Math.abs(this.configuration);
  }

  orderParameter() {
    if (typeof this.configuration !== 'object') return 1;
    const values = Object.values(this.configuration).filter(v => typeof v === 'number');
    if (values.length === 0) return 1;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return 1 / (1 + variance);
  }

  distance(other) {
    if (typeof this.configuration !== typeof other.configuration) return Infinity;
    if (typeof this.configuration !== 'object') {
      return Math.abs(this.configuration - other.configuration);
    }
    const keys = new Set([...Object.keys(this.configuration), ...Object.keys(other.configuration)]);
    let sumSquared = 0;
    for (const key of keys) {
      const v1 = this.configuration[key] || 0;
      const v2 = other.configuration[key] || 0;
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        sumSquared += (v1 - v2) ** 2;
      }
    }
    return Math.sqrt(sumSquared);
  }

  toJSON() {
    return {
      id: this.id,
      configuration: this.configuration,
      energy: this.energy,
      orderParameter: this.orderParameter(),
      probability: this.probability
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTRACTOR
// ═══════════════════════════════════════════════════════════════════════════

class Attractor {
  constructor(id, type, basin, options = {}) {
    this.id = id;
    this.type = type;
    this.basin = basin;
    this.strength = options.strength || 1.0;
    this.radius = options.radius || 1.0;
    this.captured = new Set();
    this.created = Date.now();
  }

  contains(microstate) {
    const center = this.basin;
    if (typeof center !== 'object' || typeof microstate.configuration !== 'object') {
      return false;
    }
    let sumSquared = 0;
    for (const key in center) {
      const v1 = center[key] || 0;
      const v2 = microstate.configuration[key] || 0;
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        sumSquared += (v1 - v2) ** 2;
      }
    }
    return Math.sqrt(sumSquared) <= this.radius;
  }

  attract(microstate) {
    if (!this.contains(microstate)) return null;

    const attracted = { ...microstate.configuration };
    for (const key in this.basin) {
      if (typeof attracted[key] === 'number' && typeof this.basin[key] === 'number') {
        const diff = this.basin[key] - attracted[key];
        attracted[key] += diff * this.strength * 0.1;
      }
    }

    this.captured.add(microstate.id);
    return attracted;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      basin: this.basin,
      strength: this.strength,
      radius: this.radius,
      capturedCount: this.captured.size
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNTROPY FIELD
// ═══════════════════════════════════════════════════════════════════════════

class SyntropyField extends EventEmitter {
  constructor(id, options = {}) {
    super();
    this.id = id;
    this.microstates = new Map();
    this.attractors = new Map();
    this.state = SyntropyState.DISORDERED;
    this.temperature = options.temperature || 1.0;
    this.entropy = 0;
    this.syntropy = 0;
    this.orderParameter = 0;
    this.created = Date.now();
    this.metrics = {
      microstatesCreated: 0,
      attractorsCreated: 0,
      orderingEvents: 0
    };
  }

  addMicrostate(configuration, options = {}) {
    const id = options.id || crypto.randomUUID();
    const microstate = new Microstate(id, configuration);
    this.microstates.set(id, microstate);
    this.metrics.microstatesCreated++;
    this._updateStatistics();
    this.emit('microstate-added', { microstate: microstate.toJSON() });
    return microstate;
  }

  getMicrostate(id) {
    return this.microstates.get(id);
  }

  addAttractor(type, basin, options = {}) {
    const id = options.id || crypto.randomUUID();
    const attractor = new Attractor(id, type, basin, options);
    this.attractors.set(id, attractor);
    this.metrics.attractorsCreated++;
    this.emit('attractor-added', { attractor: attractor.toJSON() });
    return attractor;
  }

  _updateStatistics() {
    const n = this.microstates.size;
    if (n === 0) {
      this.entropy = 0;
      this.syntropy = 0;
      this.orderParameter = 0;
      return;
    }

    // Calculate probabilities
    let totalEnergy = 0;
    for (const [id, ms] of this.microstates) {
      totalEnergy += Math.exp(-ms.energy / this.temperature);
    }

    for (const [id, ms] of this.microstates) {
      ms.probability = Math.exp(-ms.energy / this.temperature) / totalEnergy;
    }

    // Shannon entropy
    this.entropy = 0;
    for (const [id, ms] of this.microstates) {
      if (ms.probability > 0) {
        this.entropy -= ms.probability * Math.log(ms.probability);
      }
    }

    // Order parameter (average)
    let totalOrder = 0;
    for (const [id, ms] of this.microstates) {
      totalOrder += ms.orderParameter();
    }
    this.orderParameter = totalOrder / n;

    // Syntropy = negative entropy contribution from order
    this.syntropy = Math.log(n) - this.entropy;

    // Update state based on order
    if (this.orderParameter > 0.9) {
      this.state = SyntropyState.CRYSTALLINE;
    } else if (this.orderParameter > 0.6) {
      this.state = SyntropyState.ORDERED;
    } else if (this.orderParameter > 0.3) {
      this.state = SyntropyState.ORGANIZING;
    } else {
      this.state = SyntropyState.DISORDERED;
    }
  }

  evolve() {
    // Apply attractors to microstates
    for (const [msId, microstate] of this.microstates) {
      for (const [attId, attractor] of this.attractors) {
        const newConfig = attractor.attract(microstate);
        if (newConfig) {
          microstate.configuration = newConfig;
          microstate.energy = microstate._computeEnergy();
        }
      }
    }

    // Add thermal fluctuations
    for (const [id, ms] of this.microstates) {
      if (typeof ms.configuration === 'object') {
        for (const key in ms.configuration) {
          if (typeof ms.configuration[key] === 'number') {
            ms.configuration[key] += (Math.random() - 0.5) * this.temperature * 0.1;
          }
        }
        ms.energy = ms._computeEnergy();
      }
    }

    this._updateStatistics();
    this.metrics.orderingEvents++;
    this.emit('evolved', { entropy: this.entropy, syntropy: this.syntropy, order: this.orderParameter });
  }

  cool(rate = 0.01) {
    this.temperature = Math.max(0.01, this.temperature * (1 - rate));
    this._updateStatistics();
    this.emit('temperature-changed', { temperature: this.temperature });
  }

  heat(rate = 0.1) {
    this.temperature = Math.min(10, this.temperature * (1 + rate));
    this._updateStatistics();
    this.emit('temperature-changed', { temperature: this.temperature });
  }

  anneal(steps = 100, coolingRate = 0.01) {
    for (let i = 0; i < steps; i++) {
      this.evolve();
      this.cool(coolingRate);
    }
    this.emit('annealing-complete', { finalOrder: this.orderParameter });
  }

  findGroundState() {
    let lowestEnergy = Infinity;
    let groundState = null;

    for (const [id, ms] of this.microstates) {
      if (ms.energy < lowestEnergy) {
        lowestEnergy = ms.energy;
        groundState = ms;
      }
    }

    return groundState;
  }

  status() {
    return {
      id: this.id,
      state: this.state,
      microstateCount: this.microstates.size,
      attractorCount: this.attractors.size,
      temperature: this.temperature,
      entropy: this.entropy,
      syntropy: this.syntropy,
      orderParameter: this.orderParameter,
      metrics: { ...this.metrics }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNTROPY ENGINE SDK
// ═══════════════════════════════════════════════════════════════════════════

class SyntropyEngineSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = 'RSHIP-2026-SYNTROPY-001';
    this.name = 'SyntropyEngineSDK';
    this.version = '1.0.0';
    this.config = config;
    this.fields = new Map();
    this.state = 'initialized';
    this.running = false;
    this._evolutionInterval = null;
  }

  async start() {
    this.running = true;
    this.state = 'running';
    this._evolutionInterval = setInterval(() => {
      for (const [id, field] of this.fields) {
        field.evolve();
      }
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

  createField(id, options = {}) {
    const field = new SyntropyField(id, options);
    this.fields.set(id, field);
    field.on('evolved', (e) => this.emit('evolved', { fieldId: id, ...e }));
    this.emit('field-created', { id });
    return field;
  }

  getField(id) {
    return this.fields.get(id) || null;
  }

  status() {
    const fieldStats = {};
    for (const [id, field] of this.fields) fieldStats[id] = field.status();
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      state: this.state,
      fieldCount: this.fields.size,
      fields: fieldStats
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  BOLTZMANN,
  SyntropyState,
  AttractorType,
  Microstate,
  Attractor,
  SyntropyField,
  SyntropyEngineSDK
};
