/**
 * NEURAL EMERGENCE CORE SDK
 * RSHIP-2026-NEURAL-EMERGENCE-001
 *
 * Neural Emergence Core provides emergent behavior detection and coordination
 * for AGI cognitive systems. Implements phase transition detection, criticality
 * analysis, and φ-weighted emergence amplification.
 *
 * @module neural-emergence-core
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// EMERGENCE TYPES
// ═══════════════════════════════════════════════════════════════════════════

const EmergenceType = {
  WEAK: 'weak',          // Predictable from components
  STRONG: 'strong',      // Unpredictable, truly emergent
  CRITICAL: 'critical'   // At phase transition
};

const PhaseState = {
  SUBCRITICAL: 'subcritical',
  CRITICAL: 'critical',
  SUPERCRITICAL: 'supercritical'
};

// ═══════════════════════════════════════════════════════════════════════════
// ORDER PARAMETER
// ═══════════════════════════════════════════════════════════════════════════

class OrderParameter {
  constructor(dimensions = 1) {
    this.dimensions = dimensions;
    this.values = new Array(dimensions).fill(0);
    this.history = [];
    this.maxHistory = 1000;
  }

  update(newValues) {
    if (!Array.isArray(newValues)) {
      newValues = [newValues];
    }

    for (let i = 0; i < this.dimensions; i++) {
      this.values[i] = newValues[i] !== undefined ? newValues[i] : this.values[i];
    }

    this.history.push({
      values: [...this.values],
      magnitude: this.magnitude(),
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  magnitude() {
    return Math.sqrt(this.values.reduce((sum, v) => sum + v * v, 0));
  }

  derivative() {
    if (this.history.length < 2) return 0;

    const recent = this.history.slice(-10);
    if (recent.length < 2) return 0;

    const dt = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
    const dm = recent[recent.length - 1].magnitude - recent[0].magnitude;

    return dt > 0 ? dm / dt : 0;
  }

  susceptibility() {
    // χ = d<m>/dh - response to perturbation
    if (this.history.length < 10) return 0;

    const mags = this.history.slice(-20).map(h => h.magnitude);
    const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
    const variance = mags.reduce((a, b) => a + (b - mean) ** 2, 0) / mags.length;

    return variance * PHI; // φ-weighted susceptibility
  }

  correlation(lag = 1) {
    if (this.history.length < lag + 10) return 0;

    const mags = this.history.map(h => h.magnitude);
    const n = mags.length - lag;
    const mean = mags.reduce((a, b) => a + b, 0) / mags.length;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (mags[i] - mean) * (mags[i + lag] - mean);
      den += (mags[i] - mean) ** 2;
    }

    return den > 0 ? num / den : 0;
  }

  status() {
    return {
      dimensions: this.dimensions,
      values: [...this.values],
      magnitude: this.magnitude(),
      derivative: this.derivative(),
      susceptibility: this.susceptibility(),
      correlation: this.correlation(),
      historyLength: this.history.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CRITICALITY DETECTOR
// ═══════════════════════════════════════════════════════════════════════════

class CriticalityDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.orderParameter = new OrderParameter(options.dimensions || 1);
    this.criticalThreshold = options.criticalThreshold || 0.1;
    this.state = PhaseState.SUBCRITICAL;
    this.criticalExponent = options.criticalExponent || 0.5;
  }

  update(values) {
    this.orderParameter.update(values);
    this._detectPhaseTransition();
  }

  _detectPhaseTransition() {
    const susceptibility = this.orderParameter.susceptibility();
    const correlation = this.orderParameter.correlation();
    const derivative = Math.abs(this.orderParameter.derivative());

    // Critical slowing down: high susceptibility and correlation
    const criticalScore = (susceptibility + Math.abs(correlation)) / 2;

    let newState = this.state;

    if (criticalScore > 1 / this.criticalThreshold) {
      newState = PhaseState.CRITICAL;
    } else if (this.orderParameter.magnitude() > PHI) {
      newState = PhaseState.SUPERCRITICAL;
    } else {
      newState = PhaseState.SUBCRITICAL;
    }

    if (newState !== this.state) {
      const oldState = this.state;
      this.state = newState;

      this.emit('phase-transition', {
        from: oldState,
        to: newState,
        criticalScore,
        orderParameter: this.orderParameter.status()
      });
    }
  }

  scalingExponent() {
    // Near criticality: m ~ (T - Tc)^β
    const mags = this.orderParameter.history.slice(-50).map(h => h.magnitude);
    if (mags.length < 10) return this.criticalExponent;

    // Estimate from log-log slope
    const logMags = mags.filter(m => m > 0).map(m => Math.log(m));
    const n = logMags.length;
    if (n < 5) return this.criticalExponent;

    // Simple linear regression
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = logMags.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, i) => a + i * logMags[i], 0);
    const sumX2 = x.reduce((a, i) => a + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return Math.abs(slope) || this.criticalExponent;
  }

  status() {
    return {
      state: this.state,
      orderParameter: this.orderParameter.status(),
      scalingExponent: this.scalingExponent(),
      criticalThreshold: this.criticalThreshold
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMERGENCE DETECTOR
// ═══════════════════════════════════════════════════════════════════════════

class EmergenceDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.components = new Map();
    this.systemState = [];
    this.emergenceThreshold = options.emergenceThreshold || 0.3;
    this.windowSize = options.windowSize || 100;
    this.history = [];
  }

  registerComponent(id, initialState = 0) {
    this.components.set(id, {
      state: initialState,
      history: [initialState]
    });
  }

  updateComponent(id, state) {
    const component = this.components.get(id);
    if (!component) return;

    component.state = state;
    component.history.push(state);
    if (component.history.length > this.windowSize) {
      component.history.shift();
    }

    this._detectEmergence();
  }

  _detectEmergence() {
    if (this.components.size < 2) return;

    // Calculate system-level entropy
    const systemEntropy = this._systemEntropy();

    // Calculate sum of component entropies
    let componentEntropySum = 0;
    for (const [, component] of this.components) {
      componentEntropySum += this._componentEntropy(component.history);
    }

    // Emergence = System entropy - Sum of component entropies
    // Positive means emergent properties exist
    const emergence = systemEntropy - componentEntropySum / this.components.size;

    this.history.push({
      emergence,
      systemEntropy,
      componentEntropySum,
      timestamp: Date.now()
    });

    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // Classify emergence
    let emergenceType = EmergenceType.WEAK;
    if (emergence > this.emergenceThreshold * PHI) {
      emergenceType = EmergenceType.STRONG;
    } else if (Math.abs(emergence) < this.emergenceThreshold / PHI) {
      emergenceType = EmergenceType.CRITICAL;
    }

    if (emergence > this.emergenceThreshold) {
      this.emit('emergence', {
        type: emergenceType,
        magnitude: emergence,
        systemEntropy,
        componentCount: this.components.size
      });
    }
  }

  _systemEntropy() {
    // Joint entropy of all components
    const states = Array.from(this.components.values()).map(c => c.state);
    const joint = this._discretize(states);

    const counts = new Map();
    for (const s of joint) {
      counts.set(s, (counts.get(s) || 0) + 1);
    }

    let entropy = 0;
    const n = joint.length;
    for (const count of counts.values()) {
      const p = count / n;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  _componentEntropy(history) {
    if (history.length < 2) return 0;

    const discretized = this._discretize(history);
    const counts = new Map();

    for (const s of discretized) {
      counts.set(s, (counts.get(s) || 0) + 1);
    }

    let entropy = 0;
    const n = discretized.length;
    for (const count of counts.values()) {
      const p = count / n;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  _discretize(values, bins = 10) {
    const arr = Array.isArray(values[0]) ? values : [values];
    const result = [];

    for (const v of arr) {
      const val = Array.isArray(v) ? v.reduce((a, b) => a + b, 0) : v;
      result.push(Math.floor(val * bins) % bins);
    }

    return result;
  }

  emergenceTrend() {
    if (this.history.length < 5) return 0;

    const recent = this.history.slice(-10);
    const first = recent.slice(0, Math.floor(recent.length / 2));
    const second = recent.slice(Math.floor(recent.length / 2));

    const avg1 = first.reduce((a, b) => a + b.emergence, 0) / first.length;
    const avg2 = second.reduce((a, b) => a + b.emergence, 0) / second.length;

    return avg2 - avg1;
  }

  status() {
    return {
      componentCount: this.components.size,
      historyLength: this.history.length,
      latestEmergence: this.history.length > 0 ? this.history[this.history.length - 1].emergence : 0,
      trend: this.emergenceTrend(),
      threshold: this.emergenceThreshold
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURAL EMERGENCE CORE
// ═══════════════════════════════════════════════════════════════════════════

class NeuralEmergenceCore extends EventEmitter {
  constructor(options = {}) {
    super();
    this.criticalityDetector = new CriticalityDetector(options);
    this.emergenceDetector = new EmergenceDetector(options);

    // Forward events
    this.criticalityDetector.on('phase-transition', (data) => {
      this.emit('phase-transition', data);
    });

    this.emergenceDetector.on('emergence', (data) => {
      this.emit('emergence', data);
    });
  }

  registerNeuron(id, initialState = 0) {
    this.emergenceDetector.registerComponent(id, initialState);
  }

  update(neuronId, state) {
    this.emergenceDetector.updateComponent(neuronId, state);

    // Update criticality with average state
    const states = Array.from(this.emergenceDetector.components.values()).map(c => c.state);
    const avgState = states.reduce((a, b) => a + b, 0) / states.length;
    this.criticalityDetector.update([avgState]);
  }

  getPhase() {
    return this.criticalityDetector.state;
  }

  isEmergent() {
    const status = this.emergenceDetector.status();
    return status.latestEmergence > status.threshold;
  }

  isCritical() {
    return this.criticalityDetector.state === PhaseState.CRITICAL;
  }

  status() {
    return {
      criticality: this.criticalityDetector.status(),
      emergence: this.emergenceDetector.status(),
      phase: this.getPhase(),
      isEmergent: this.isEmergent(),
      isCritical: this.isCritical()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  EmergenceType,
  PhaseState,
  OrderParameter,
  CriticalityDetector,
  EmergenceDetector,
  NeuralEmergenceCore
};
