/**
 * RESONANCE CORE SDK
 * RSHIP-2026-RESONANCE-CORE-001
 *
 * Resonance Core provides harmonic resonance detection and synchronization
 * for AGI cognitive layers. Implements φ-frequency analysis, coherence
 * detection, and resonance amplification.
 *
 * @module resonance-core
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;

// ═══════════════════════════════════════════════════════════════════════════
// RESONANCE ANALYZER
// ═══════════════════════════════════════════════════════════════════════════

class ResonanceAnalyzer {
  constructor(sampleRate = 1000) {
    this.sampleRate = sampleRate;
    this.buffer = [];
    this.bufferSize = 1024;
  }

  addSample(value) {
    this.buffer.push(value);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
  }

  analyze() {
    if (this.buffer.length < 64) {
      return { frequencies: [], dominant: null, coherence: 0 };
    }

    const frequencies = this._fft();
    const dominant = this._findDominant(frequencies);
    const coherence = this._calculateCoherence(frequencies);

    return { frequencies, dominant, coherence };
  }

  _fft() {
    // Simplified DFT for key frequencies
    const n = this.buffer.length;
    const frequencies = [];

    // Check φ-ladder frequencies
    const phiFreqs = [
      SCHUMANN_HZ / (PHI * PHI),
      SCHUMANN_HZ / PHI,
      SCHUMANN_HZ,
      SCHUMANN_HZ * PHI,
      SCHUMANN_HZ * PHI * PHI
    ];

    for (const freq of phiFreqs) {
      let real = 0, imag = 0;

      for (let k = 0; k < n; k++) {
        const angle = 2 * Math.PI * freq * k / this.sampleRate;
        real += this.buffer[k] * Math.cos(angle);
        imag -= this.buffer[k] * Math.sin(angle);
      }

      const magnitude = Math.sqrt(real * real + imag * imag) / n;
      const phase = Math.atan2(imag, real);

      frequencies.push({
        frequency: freq,
        magnitude,
        phase,
        phiRatio: freq / SCHUMANN_HZ
      });
    }

    return frequencies.sort((a, b) => b.magnitude - a.magnitude);
  }

  _findDominant(frequencies) {
    if (frequencies.length === 0) return null;
    return frequencies[0];
  }

  _calculateCoherence(frequencies) {
    if (frequencies.length < 2) return 0;

    // Coherence based on phase alignment
    const phases = frequencies.map(f => f.phase);
    let sum = 0;

    for (let i = 0; i < phases.length; i++) {
      for (let j = i + 1; j < phases.length; j++) {
        const diff = Math.abs(phases[i] - phases[j]);
        sum += Math.cos(diff);
      }
    }

    const pairs = (phases.length * (phases.length - 1)) / 2;
    return pairs > 0 ? sum / pairs : 0;
  }

  clear() {
    this.buffer = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESONANCE DETECTOR
// ═══════════════════════════════════════════════════════════════════════════

class ResonanceDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.analyzer = new ResonanceAnalyzer(options.sampleRate);
    this.threshold = options.threshold || 0.5;
    this.phiTolerance = options.phiTolerance || 0.05;
    this.lastDetection = null;
    this.detections = [];
    this.maxDetections = 100;
  }

  process(value) {
    this.analyzer.addSample(value);
    const analysis = this.analyzer.analyze();

    if (analysis.dominant && analysis.dominant.magnitude > this.threshold) {
      const resonance = this._classifyResonance(analysis.dominant);

      if (resonance) {
        this.lastDetection = {
          resonance,
          analysis,
          timestamp: Date.now()
        };

        this.detections.push(this.lastDetection);
        if (this.detections.length > this.maxDetections) {
          this.detections.shift();
        }

        this.emit('resonance', this.lastDetection);
      }
    }

    return analysis;
  }

  _classifyResonance(dominant) {
    const ratio = dominant.frequency / SCHUMANN_HZ;

    // Check if close to φ power
    for (let p = -2; p <= 2; p++) {
      const phiPower = Math.pow(PHI, p);
      if (Math.abs(ratio - phiPower) < this.phiTolerance) {
        return {
          type: 'phi',
          power: p,
          frequency: dominant.frequency,
          deviation: Math.abs(ratio - phiPower)
        };
      }
    }

    // Check if close to Schumann
    if (Math.abs(ratio - 1) < this.phiTolerance) {
      return {
        type: 'schumann',
        frequency: dominant.frequency,
        deviation: Math.abs(dominant.frequency - SCHUMANN_HZ)
      };
    }

    return null;
  }

  getPatterns() {
    if (this.detections.length < 5) return [];

    const patterns = [];
    const typeCount = {};

    for (const d of this.detections) {
      const key = d.resonance.type + (d.resonance.power || '');
      typeCount[key] = (typeCount[key] || 0) + 1;
    }

    for (const [type, count] of Object.entries(typeCount)) {
      if (count >= 3) {
        patterns.push({ type, count, frequency: count / this.detections.length });
      }
    }

    return patterns;
  }

  status() {
    return {
      detectionCount: this.detections.length,
      lastDetection: this.lastDetection,
      patterns: this.getPatterns(),
      threshold: this.threshold
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESONANCE AMPLIFIER
// ═══════════════════════════════════════════════════════════════════════════

class ResonanceAmplifier extends EventEmitter {
  constructor(targetFrequency = SCHUMANN_HZ, Q = PHI) {
    super();
    this.targetFrequency = targetFrequency;
    this.Q = Q; // Quality factor
    this.bandwidth = targetFrequency / Q;
    this.gain = 1;
    this.phase = 0;
    this.history = [];
    this.maxHistory = 100;
  }

  amplify(input, inputFrequency) {
    // Calculate resonance response
    const omega = inputFrequency / this.targetFrequency;
    const denom = Math.sqrt(Math.pow(1 - omega * omega, 2) + Math.pow(omega / this.Q, 2));
    const response = 1 / denom;

    // Calculate phase shift
    const phaseShift = Math.atan2(omega / this.Q, 1 - omega * omega);

    const output = input * response * this.gain;

    this.history.push({
      input,
      output,
      response,
      frequency: inputFrequency,
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return {
      value: output,
      gain: response,
      phase: phaseShift,
      atResonance: Math.abs(omega - 1) < 0.1
    };
  }

  tune(frequency) {
    this.targetFrequency = frequency;
    this.bandwidth = frequency / this.Q;
    this.emit('tuned', { frequency, Q: this.Q });
  }

  setQ(Q) {
    this.Q = Q;
    this.bandwidth = this.targetFrequency / Q;
    this.emit('q-changed', { Q, bandwidth: this.bandwidth });
  }

  setGain(gain) {
    this.gain = gain;
    this.emit('gain-changed', { gain });
  }

  frequencyResponse(freqMin, freqMax, steps = 100) {
    const response = [];
    const step = (freqMax - freqMin) / steps;

    for (let f = freqMin; f <= freqMax; f += step) {
      const omega = f / this.targetFrequency;
      const denom = Math.sqrt(Math.pow(1 - omega * omega, 2) + Math.pow(omega / this.Q, 2));
      const mag = this.gain / denom;
      const phase = Math.atan2(omega / this.Q, 1 - omega * omega);

      response.push({ frequency: f, magnitude: mag, phase });
    }

    return response;
  }

  status() {
    return {
      targetFrequency: this.targetFrequency,
      Q: this.Q,
      bandwidth: this.bandwidth,
      gain: this.gain,
      historyLength: this.history.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COHERENCE TRACKER
// ═══════════════════════════════════════════════════════════════════════════

class CoherenceTracker extends EventEmitter {
  constructor(windowSize = 100) {
    super();
    this.windowSize = windowSize;
    this.signals = new Map();
    this.coherenceMatrix = null;
  }

  addSignal(id) {
    this.signals.set(id, {
      samples: [],
      phase: 0,
      amplitude: 0
    });
  }

  removeSignal(id) {
    return this.signals.delete(id);
  }

  update(id, value) {
    const signal = this.signals.get(id);
    if (!signal) return;

    signal.samples.push(value);
    if (signal.samples.length > this.windowSize) {
      signal.samples.shift();
    }

    // Update instantaneous phase and amplitude (Hilbert-like)
    if (signal.samples.length > 2) {
      const n = signal.samples.length;
      signal.amplitude = Math.sqrt(
        signal.samples[n - 1] * signal.samples[n - 1] +
        signal.samples[n - 2] * signal.samples[n - 2]
      );
      signal.phase = Math.atan2(signal.samples[n - 1], signal.samples[n - 2]);
    }

    this._updateCoherence();
  }

  _updateCoherence() {
    const ids = Array.from(this.signals.keys());
    const n = ids.length;

    if (n < 2) {
      this.coherenceMatrix = null;
      return;
    }

    this.coherenceMatrix = [];

    for (let i = 0; i < n; i++) {
      this.coherenceMatrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          this.coherenceMatrix[i][j] = 1;
        } else {
          const sig1 = this.signals.get(ids[i]);
          const sig2 = this.signals.get(ids[j]);
          const phaseDiff = Math.abs(sig1.phase - sig2.phase);
          this.coherenceMatrix[i][j] = Math.cos(phaseDiff);
        }
      }
    }

    // Calculate global coherence
    let sum = 0, count = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sum += this.coherenceMatrix[i][j];
        count++;
      }
    }

    const globalCoherence = count > 0 ? sum / count : 0;

    if (globalCoherence > 0.8) {
      this.emit('high-coherence', { coherence: globalCoherence, signals: ids });
    }
  }

  getCoherence(id1, id2) {
    const ids = Array.from(this.signals.keys());
    const i = ids.indexOf(id1);
    const j = ids.indexOf(id2);

    if (i === -1 || j === -1 || !this.coherenceMatrix) return null;
    return this.coherenceMatrix[i][j];
  }

  globalCoherence() {
    if (!this.coherenceMatrix) return 0;

    const n = this.coherenceMatrix.length;
    let sum = 0, count = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sum += this.coherenceMatrix[i][j];
        count++;
      }
    }

    return count > 0 ? sum / count : 0;
  }

  status() {
    return {
      signalCount: this.signals.size,
      windowSize: this.windowSize,
      globalCoherence: this.globalCoherence(),
      hasMatrix: this.coherenceMatrix !== null
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESONANCE CORE
// ═══════════════════════════════════════════════════════════════════════════

class ResonanceCore extends EventEmitter {
  constructor(options = {}) {
    super();
    this.detector = new ResonanceDetector(options);
    this.amplifier = new ResonanceAmplifier(options.targetFrequency, options.Q);
    this.tracker = new CoherenceTracker(options.windowSize);
    this.running = false;
  }

  process(signalId, value) {
    // Track signal
    if (!this.tracker.signals.has(signalId)) {
      this.tracker.addSignal(signalId);
    }
    this.tracker.update(signalId, value);

    // Detect resonance
    const analysis = this.detector.process(value);

    // Amplify if at resonance
    let amplified = value;
    if (analysis.dominant) {
      const amp = this.amplifier.amplify(value, analysis.dominant.frequency);
      if (amp.atResonance) {
        amplified = amp.value;
      }
    }

    return {
      original: value,
      amplified,
      analysis,
      coherence: this.tracker.globalCoherence()
    };
  }

  status() {
    return {
      running: this.running,
      detector: this.detector.status(),
      amplifier: this.amplifier.status(),
      tracker: this.tracker.status()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  ResonanceAnalyzer,
  ResonanceDetector,
  ResonanceAmplifier,
  CoherenceTracker,
  ResonanceCore
};
