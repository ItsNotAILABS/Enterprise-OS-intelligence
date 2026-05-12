/**
 * HARMONIC BRIDGE SDK
 * RSHIP-2026-HARMONIC-BRIDGE-001
 *
 * Inter-system resonance bridging for AGI systems. Implements harmonic
 * coupling, frequency synchronization, and φ-weighted coherence transfer
 * for unified multi-system coordination.
 *
 * @module harmonic-bridge-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;
const PHI_FREQUENCIES = [
  SCHUMANN_HZ,
  SCHUMANN_HZ * PHI,
  SCHUMANN_HZ * PHI * PHI,
  SCHUMANN_HZ * PHI * PHI * PHI
];

// ═══════════════════════════════════════════════════════════════════════════
// BRIDGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

const BridgeState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  RESONATING: 'resonating',
  SYNCHRONIZED: 'synchronized'
};

const CouplingMode = {
  UNIDIRECTIONAL: 'unidirectional',
  BIDIRECTIONAL: 'bidirectional',
  HIERARCHICAL: 'hierarchical',
  MESH: 'mesh'
};

// ═══════════════════════════════════════════════════════════════════════════
// RESONATOR
// ═══════════════════════════════════════════════════════════════════════════

class Resonator {
  constructor(id, frequency, options = {}) {
    this.id = id;
    this.frequency = frequency;
    this.phase = options.phase || 0;
    this.amplitude = options.amplitude || 1.0;
    this.damping = options.damping || 0.01;
    this.naturalFrequency = frequency;
    this.coupledTo = new Map();
    this.history = [];
    this.created = Date.now();
  }

  oscillate(dt = 0.01) {
    // Update phase
    this.phase += 2 * Math.PI * this.frequency * dt;
    if (this.phase > 2 * Math.PI) this.phase -= 2 * Math.PI;

    // Apply damping
    this.amplitude *= (1 - this.damping * dt);

    // Record history
    this.history.push({
      time: Date.now(),
      phase: this.phase,
      amplitude: this.amplitude,
      frequency: this.frequency
    });
    if (this.history.length > 1000) this.history.shift();

    return this.getSignal();
  }

  getSignal() {
    return this.amplitude * Math.sin(this.phase);
  }

  couple(other, strength = 0.1) {
    this.coupledTo.set(other.id, { resonator: other, strength });
    other.coupledTo.set(this.id, { resonator: this, strength });
  }

  decouple(otherId) {
    const coupling = this.coupledTo.get(otherId);
    if (coupling) {
      coupling.resonator.coupledTo.delete(this.id);
      this.coupledTo.delete(otherId);
    }
  }

  receiveCoupling() {
    if (this.coupledTo.size === 0) return 0;

    let totalInfluence = 0;

    for (const [id, coupling] of this.coupledTo) {
      const other = coupling.resonator;
      const strength = coupling.strength;

      // Phase influence (Kuramoto-style)
      const phaseDiff = other.phase - this.phase;
      totalInfluence += strength * Math.sin(phaseDiff);
    }

    return totalInfluence;
  }

  update(dt = 0.01) {
    // Natural oscillation
    this.oscillate(dt);

    // Apply coupling influence
    const coupling = this.receiveCoupling();
    this.frequency = this.naturalFrequency + coupling;
  }

  phaseCoherence(other) {
    const phaseDiff = Math.abs(this.phase - other.phase);
    const normalizedDiff = Math.min(phaseDiff, 2 * Math.PI - phaseDiff);
    return 1 - normalizedDiff / Math.PI;
  }

  frequencyRatio(other) {
    return this.frequency / other.frequency;
  }

  isHarmonic(other, tolerance = 0.05) {
    const ratio = this.frequencyRatio(other);
    const nearestHarmonic = Math.round(ratio);
    if (nearestHarmonic === 0) return false;
    return Math.abs(ratio - nearestHarmonic) < tolerance;
  }

  toJSON() {
    return {
      id: this.id,
      frequency: this.frequency,
      naturalFrequency: this.naturalFrequency,
      phase: this.phase,
      amplitude: this.amplitude,
      couplingCount: this.coupledTo.size,
      signal: this.getSignal()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HARMONIC BRIDGE
// ═══════════════════════════════════════════════════════════════════════════

class HarmonicBridge extends EventEmitter {
  constructor(id, options = {}) {
    super();
    this.id = id;
    this.resonators = new Map();
    this.state = BridgeState.DISCONNECTED;
    this.mode = options.mode || CouplingMode.BIDIRECTIONAL;
    this.globalCoupling = options.globalCoupling || 0.1;
    this.targetFrequency = options.targetFrequency || SCHUMANN_HZ;
    this.coherence = 0;
    this.created = Date.now();
    this.metrics = {
      resonatorsAdded: 0,
      synchronizationEvents: 0,
      cycles: 0
    };
  }

  addResonator(frequency, options = {}) {
    const id = options.id || crypto.randomUUID();
    const resonator = new Resonator(id, frequency, options);
    this.resonators.set(id, resonator);
    this.metrics.resonatorsAdded++;

    // Auto-couple based on mode
    if (this.mode === CouplingMode.MESH) {
      for (const [otherId, other] of this.resonators) {
        if (otherId !== id) {
          resonator.couple(other, this.globalCoupling);
        }
      }
    }

    this.emit('resonator-added', { resonator: resonator.toJSON() });
    return resonator;
  }

  getResonator(id) {
    return this.resonators.get(id);
  }

  connect(id1, id2, strength = null) {
    const r1 = this.resonators.get(id1);
    const r2 = this.resonators.get(id2);

    if (!r1 || !r2) {
      return { success: false, reason: 'Resonator not found' };
    }

    r1.couple(r2, strength || this.globalCoupling);
    this.state = BridgeState.CONNECTING;
    this.emit('connected', { id1, id2, strength: strength || this.globalCoupling });
    return { success: true };
  }

  evolve(dt = 0.01) {
    this.metrics.cycles++;

    // Update all resonators
    for (const [id, resonator] of this.resonators) {
      resonator.update(dt);
    }

    // Calculate global coherence
    this._calculateCoherence();

    // Update state
    if (this.coherence > 0.9) {
      if (this.state !== BridgeState.SYNCHRONIZED) {
        this.state = BridgeState.SYNCHRONIZED;
        this.metrics.synchronizationEvents++;
        this.emit('synchronized', { coherence: this.coherence });
      }
    } else if (this.coherence > 0.5) {
      this.state = BridgeState.RESONATING;
    } else if (this.resonators.size > 1) {
      this.state = BridgeState.CONNECTING;
    } else {
      this.state = BridgeState.DISCONNECTED;
    }

    this.emit('evolved', { coherence: this.coherence, state: this.state });
  }

  _calculateCoherence() {
    if (this.resonators.size < 2) {
      this.coherence = 1;
      return;
    }

    let totalCoherence = 0;
    let pairs = 0;

    const resonatorArray = Array.from(this.resonators.values());

    for (let i = 0; i < resonatorArray.length; i++) {
      for (let j = i + 1; j < resonatorArray.length; j++) {
        totalCoherence += resonatorArray[i].phaseCoherence(resonatorArray[j]);
        pairs++;
      }
    }

    this.coherence = pairs > 0 ? totalCoherence / pairs : 1;
  }

  getOrderParameter() {
    // Kuramoto order parameter
    if (this.resonators.size === 0) return { r: 0, psi: 0 };

    let sumCos = 0;
    let sumSin = 0;

    for (const [id, resonator] of this.resonators) {
      sumCos += Math.cos(resonator.phase);
      sumSin += Math.sin(resonator.phase);
    }

    const n = this.resonators.size;
    sumCos /= n;
    sumSin /= n;

    const r = Math.sqrt(sumCos ** 2 + sumSin ** 2);
    const psi = Math.atan2(sumSin, sumCos);

    return { r, psi };
  }

  entrainTo(frequency) {
    this.targetFrequency = frequency;

    // Add a strong reference oscillator at target frequency
    const ref = this.addResonator(frequency, {
      id: 'reference',
      amplitude: 2.0,
      damping: 0
    });

    // Couple all resonators to reference
    for (const [id, resonator] of this.resonators) {
      if (id !== 'reference') {
        ref.couple(resonator, this.globalCoupling * 2);
      }
    }

    this.emit('entrainment-started', { targetFrequency: frequency });
  }

  findHarmonics() {
    const harmonicGroups = [];
    const processed = new Set();

    for (const [id1, r1] of this.resonators) {
      if (processed.has(id1)) continue;

      const group = [id1];
      processed.add(id1);

      for (const [id2, r2] of this.resonators) {
        if (id1 !== id2 && !processed.has(id2) && r1.isHarmonic(r2)) {
          group.push(id2);
          processed.add(id2);
        }
      }

      if (group.length > 1) {
        harmonicGroups.push({
          baseFrequency: r1.frequency,
          members: group,
          ratios: group.map(id => this.resonators.get(id).frequencyRatio(r1))
        });
      }
    }

    return harmonicGroups;
  }

  getCompositeSignal() {
    let signal = 0;
    for (const [id, resonator] of this.resonators) {
      signal += resonator.getSignal();
    }
    return signal / this.resonators.size;
  }

  status() {
    const resonatorStats = {};
    for (const [id, res] of this.resonators) resonatorStats[id] = res.toJSON();

    const orderParam = this.getOrderParameter();

    return {
      id: this.id,
      state: this.state,
      mode: this.mode,
      coherence: this.coherence,
      orderParameter: orderParam.r,
      meanPhase: orderParam.psi,
      targetFrequency: this.targetFrequency,
      resonatorCount: this.resonators.size,
      harmonicGroups: this.findHarmonics().length,
      resonators: resonatorStats,
      metrics: { ...this.metrics }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HARMONIC BRIDGE SDK
// ═══════════════════════════════════════════════════════════════════════════

class HarmonicBridgeSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = 'RSHIP-2026-HARMONIC-BRIDGE-001';
    this.name = 'HarmonicBridgeSDK';
    this.version = '1.0.0';
    this.config = config;
    this.bridges = new Map();
    this.state = 'initialized';
    this.running = false;
    this._evolutionInterval = null;
  }

  async start() {
    this.running = true;
    this.state = 'running';
    this._evolutionInterval = setInterval(() => {
      for (const [id, bridge] of this.bridges) bridge.evolve();
    }, 10);
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

  createBridge(id, options = {}) {
    const bridge = new HarmonicBridge(id, options);
    this.bridges.set(id, bridge);
    bridge.on('synchronized', (e) => this.emit('synchronized', { bridgeId: id, ...e }));
    this.emit('bridge-created', { id });
    return bridge;
  }

  getBridge(id) {
    return this.bridges.get(id) || null;
  }

  interconnect(bridgeId1, bridgeId2, resonatorPairs) {
    const b1 = this.bridges.get(bridgeId1);
    const b2 = this.bridges.get(bridgeId2);

    if (!b1 || !b2) return { success: false, reason: 'Bridge not found' };

    for (const [r1Id, r2Id] of resonatorPairs) {
      const r1 = b1.getResonator(r1Id);
      const r2 = b2.getResonator(r2Id);
      if (r1 && r2) {
        r1.couple(r2, 0.05);
      }
    }

    this.emit('bridges-interconnected', { bridgeId1, bridgeId2 });
    return { success: true };
  }

  status() {
    const bridgeStats = {};
    for (const [id, bridge] of this.bridges) bridgeStats[id] = bridge.status();
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      state: this.state,
      bridgeCount: this.bridges.size,
      bridges: bridgeStats
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  PHI_FREQUENCIES,
  BridgeState,
  CouplingMode,
  Resonator,
  HarmonicBridge,
  HarmonicBridgeSDK
};
