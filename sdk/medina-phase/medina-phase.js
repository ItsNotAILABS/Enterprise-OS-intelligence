/**
 * MEDINA PHASE SDK
 * RSHIP-2026-MEDINA-PHASE-001
 *
 * Medina Phase provides phase-space dynamics for φ-field coherence tracking.
 * Implements Kuramoto oscillator coupling, phase locking detection, and
 * φ-harmonic resonance alignment for distributed AGI synchronization.
 *
 * Mathematical Foundation:
 * - Kuramoto model: dθᵢ/dt = ωᵢ + (K/N)Σⱼsin(θⱼ - θᵢ)
 * - Order parameter: r·e^(iψ) = (1/N)Σⱼe^(iθⱼ)
 * - φ-lock condition: |θᵢ - θⱼ| < π/φ³
 *
 * @module medina-phase
 * @version 1.0.0
 */

'use strict';

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;

// ═══════════════════════════════════════════════════════════════════════════
// PHASE OSCILLATOR
// ═══════════════════════════════════════════════════════════════════════════

class PhaseOscillator {
  constructor(id, naturalFrequency = SCHUMANN_HZ) {
    this.id = id;
    this.omega = naturalFrequency;
    this.theta = Math.random() * 2 * Math.PI;
    this.lastUpdate = Date.now();
    this.couplings = new Map();
  }

  couple(other, strength = 1.0) {
    this.couplings.set(other.id, { oscillator: other, K: strength });
  }

  step(dt) {
    let coupling = 0;
    const N = this.couplings.size || 1;

    for (const [, { oscillator, K }] of this.couplings) {
      coupling += (K / N) * Math.sin(oscillator.theta - this.theta);
    }

    this.theta += (this.omega + coupling) * dt;
    this.theta = this.theta % (2 * Math.PI);
    this.lastUpdate = Date.now();
    return this.theta;
  }

  phaseDifference(other) {
    let diff = Math.abs(this.theta - other.theta);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    return diff;
  }

  isLocked(other, tolerance = Math.PI / (PHI * PHI * PHI)) {
    return this.phaseDifference(other) < tolerance;
  }

  toJSON() {
    return {
      id: this.id,
      omega: this.omega,
      theta: this.theta,
      couplingCount: this.couplings.size,
      lastUpdate: this.lastUpdate
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KURAMOTO NETWORK
// ═══════════════════════════════════════════════════════════════════════════

class KuramotoNetwork {
  constructor(globalCoupling = 1.0) {
    this.oscillators = new Map();
    this.K = globalCoupling;
    this.history = [];
    this.maxHistory = 1000;
  }

  addOscillator(id, frequency = SCHUMANN_HZ) {
    const osc = new PhaseOscillator(id, frequency);
    this.oscillators.set(id, osc);

    // Couple to all existing oscillators
    for (const [otherId, other] of this.oscillators) {
      if (otherId !== id) {
        osc.couple(other, this.K);
        other.couple(osc, this.K);
      }
    }

    return osc;
  }

  removeOscillator(id) {
    const osc = this.oscillators.get(id);
    if (!osc) return false;

    // Remove couplings from other oscillators
    for (const [, other] of this.oscillators) {
      other.couplings.delete(id);
    }

    this.oscillators.delete(id);
    return true;
  }

  step(dt = 0.01) {
    const phases = [];
    for (const [, osc] of this.oscillators) {
      phases.push(osc.step(dt));
    }

    const order = this.orderParameter();
    this.history.push({
      time: Date.now(),
      r: order.r,
      psi: order.psi,
      phases: [...phases]
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return order;
  }

  orderParameter() {
    if (this.oscillators.size === 0) {
      return { r: 0, psi: 0 };
    }

    let sumCos = 0, sumSin = 0;
    for (const [, osc] of this.oscillators) {
      sumCos += Math.cos(osc.theta);
      sumSin += Math.sin(osc.theta);
    }

    const N = this.oscillators.size;
    sumCos /= N;
    sumSin /= N;

    const r = Math.sqrt(sumCos * sumCos + sumSin * sumSin);
    const psi = Math.atan2(sumSin, sumCos);

    return { r, psi };
  }

  isSynchronized(threshold = 0.9) {
    return this.orderParameter().r >= threshold;
  }

  phiLockCount() {
    let count = 0;
    const tolerance = Math.PI / (PHI * PHI * PHI);
    const oscs = Array.from(this.oscillators.values());

    for (let i = 0; i < oscs.length; i++) {
      for (let j = i + 1; j < oscs.length; j++) {
        if (oscs[i].isLocked(oscs[j], tolerance)) {
          count++;
        }
      }
    }

    return count;
  }

  status() {
    const order = this.orderParameter();
    const maxPairs = (this.oscillators.size * (this.oscillators.size - 1)) / 2;

    return {
      oscillatorCount: this.oscillators.size,
      globalCoupling: this.K,
      orderParameter: order.r,
      meanPhase: order.psi,
      synchronized: this.isSynchronized(),
      phiLockedPairs: this.phiLockCount(),
      maxPairs,
      lockRatio: maxPairs > 0 ? this.phiLockCount() / maxPairs : 0,
      historyLength: this.history.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE SPACE TRACKER
// ═══════════════════════════════════════════════════════════════════════════

class PhaseSpaceTracker {
  constructor(dimensions = 2) {
    this.dimensions = dimensions;
    this.trajectory = [];
    this.maxPoints = 10000;
  }

  addPoint(state) {
    if (!Array.isArray(state) || state.length !== this.dimensions) {
      throw new Error(`State must be ${this.dimensions}-dimensional array`);
    }

    this.trajectory.push({
      state: [...state],
      time: Date.now()
    });

    if (this.trajectory.length > this.maxPoints) {
      this.trajectory.shift();
    }
  }

  lyapunovExponent(neighborhoodSize = 0.01) {
    if (this.trajectory.length < 100) return null;

    let sum = 0;
    let count = 0;

    for (let i = 10; i < this.trajectory.length - 10; i++) {
      const p1 = this.trajectory[i].state;
      const p2 = this.trajectory[i + 1].state;

      // Find nearby trajectory
      for (let j = 0; j < i - 10; j++) {
        const q1 = this.trajectory[j].state;
        const d0 = this._distance(p1, q1);

        if (d0 < neighborhoodSize && d0 > 1e-10) {
          const q2 = this.trajectory[j + 1].state;
          const d1 = this._distance(p2, q2);

          if (d1 > 1e-10) {
            sum += Math.log(d1 / d0);
            count++;
          }
          break;
        }
      }
    }

    return count > 0 ? sum / count : 0;
  }

  _distance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  }

  attractorDimension(epsilon = 0.1) {
    if (this.trajectory.length < 50) return null;

    const points = this.trajectory.map(t => t.state);
    let correlationSum = 0;

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (this._distance(points[i], points[j]) < epsilon) {
          correlationSum++;
        }
      }
    }

    const pairs = (points.length * (points.length - 1)) / 2;
    const C = correlationSum / pairs;

    return C > 0 ? Math.log(C) / Math.log(epsilon) : 0;
  }

  recurrencePlot(threshold = 0.1) {
    const n = Math.min(this.trajectory.length, 100);
    const plot = [];

    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        const d = this._distance(
          this.trajectory[i].state,
          this.trajectory[j].state
        );
        row.push(d < threshold ? 1 : 0);
      }
      plot.push(row);
    }

    return plot;
  }

  status() {
    return {
      dimensions: this.dimensions,
      trajectoryLength: this.trajectory.length,
      lyapunovExponent: this.lyapunovExponent(),
      attractorDimension: this.attractorDimension()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHI-HARMONIC RESONATOR
// ═══════════════════════════════════════════════════════════════════════════

class PhiHarmonicResonator {
  constructor(baseFrequency = SCHUMANN_HZ) {
    this.base = baseFrequency;
    this.harmonics = this._generateHarmonics();
    this.currentMode = 0;
    this.amplitude = 1.0;
    this.phase = 0;
  }

  _generateHarmonics() {
    return [
      this.base,           // φ⁰
      this.base * PHI,     // φ¹
      this.base * PHI * PHI,    // φ²
      this.base * PHI ** 3,     // φ³
      this.base * PHI ** 4,     // φ⁴
      this.base / PHI,          // φ⁻¹
      this.base / (PHI * PHI)   // φ⁻²
    ];
  }

  setMode(index) {
    if (index >= 0 && index < this.harmonics.length) {
      this.currentMode = index;
      return this.harmonics[index];
    }
    return null;
  }

  frequency() {
    return this.harmonics[this.currentMode];
  }

  sample(t) {
    const f = this.frequency();
    return this.amplitude * Math.sin(2 * Math.PI * f * t + this.phase);
  }

  compositeWave(t) {
    let sum = 0;
    for (let i = 0; i < this.harmonics.length; i++) {
      const f = this.harmonics[i];
      const weight = 1 / Math.pow(PHI, i);
      sum += weight * Math.sin(2 * Math.PI * f * t);
    }
    return sum * this.amplitude;
  }

  resonanceStrength(inputFrequency) {
    let maxResonance = 0;
    for (const h of this.harmonics) {
      const ratio = inputFrequency / h;
      const deviation = Math.abs(ratio - Math.round(ratio));
      const resonance = Math.exp(-deviation * PHI);
      maxResonance = Math.max(maxResonance, resonance);
    }
    return maxResonance;
  }

  findBestHarmonic(inputFrequency) {
    let bestIndex = 0;
    let bestResonance = 0;

    for (let i = 0; i < this.harmonics.length; i++) {
      const ratio = inputFrequency / this.harmonics[i];
      const deviation = Math.abs(ratio - Math.round(ratio));
      const resonance = Math.exp(-deviation * PHI);

      if (resonance > bestResonance) {
        bestResonance = resonance;
        bestIndex = i;
      }
    }

    return { index: bestIndex, frequency: this.harmonics[bestIndex], resonance: bestResonance };
  }

  status() {
    return {
      baseFrequency: this.base,
      currentMode: this.currentMode,
      currentFrequency: this.frequency(),
      harmonics: this.harmonics,
      amplitude: this.amplitude,
      phase: this.phase
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDINA PHASE COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════

class MedinaPhaseCoordinator {
  constructor(config = {}) {
    this.network = new KuramotoNetwork(config.globalCoupling || 1.0);
    this.tracker = new PhaseSpaceTracker(config.dimensions || 2);
    this.resonator = new PhiHarmonicResonator(config.baseFrequency || SCHUMANN_HZ);
    this.syncCallbacks = [];
    this.running = false;
    this.interval = null;
    this.stepSize = config.stepSize || 0.01;
    this.updateRate = config.updateRate || 100;
  }

  addAgent(id, frequency = SCHUMANN_HZ) {
    return this.network.addOscillator(id, frequency);
  }

  removeAgent(id) {
    return this.network.removeOscillator(id);
  }

  onSync(callback) {
    this.syncCallbacks.push(callback);
  }

  start() {
    if (this.running) return;
    this.running = true;

    this.interval = setInterval(() => {
      const order = this.network.step(this.stepSize);

      // Track in phase space
      this.tracker.addPoint([order.r, order.psi]);

      // Check synchronization
      if (order.r > 0.9) {
        for (const cb of this.syncCallbacks) {
          cb(order);
        }
      }
    }, this.updateRate);
  }

  stop() {
    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  forceSync(targetPhase = 0) {
    for (const [, osc] of this.network.oscillators) {
      osc.theta = targetPhase;
    }
  }

  status() {
    return {
      running: this.running,
      network: this.network.status(),
      tracker: this.tracker.status(),
      resonator: this.resonator.status()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  PhaseOscillator,
  KuramotoNetwork,
  PhaseSpaceTracker,
  PhiHarmonicResonator,
  MedinaPhaseCoordinator
};
