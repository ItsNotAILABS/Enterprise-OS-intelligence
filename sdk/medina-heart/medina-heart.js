/**
 * MEDINA HEART SDK
 * RSHIP-2026-MEDINA-HEART-001
 *
 * Medina Heart provides the living pulse of AGI organisms.
 * Implements heartbeat monitoring, health checks, and cardiac-style
 * rhythm coordination for distributed intelligence.
 *
 * Features:
 * - φ-paced heartbeat at Schumann resonance (7.83 Hz base)
 * - Cardiac rhythm variability for adaptive systems
 * - Health monitoring and failure detection
 * - Distributed heartbeat synchronization
 *
 * @module medina-heart
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;
const BASE_INTERVAL_MS = 1000 / SCHUMANN_HZ; // ~127.7ms

// ═══════════════════════════════════════════════════════════════════════════
// HEART RHYTHM
// ═══════════════════════════════════════════════════════════════════════════

const RhythmState = {
  SINUS: 'sinus',           // Normal rhythm
  TACHYCARDIA: 'tachycardia', // Accelerated (high load)
  BRADYCARDIA: 'bradycardia', // Slowed (idle)
  ARRHYTHMIA: 'arrhythmia',   // Irregular (stress)
  ASYSTOLE: 'asystole'        // Stopped (failure)
};

const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  CRITICAL: 'critical',
  FAILED: 'failed'
};

// ═══════════════════════════════════════════════════════════════════════════
// HEARTBEAT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

class HeartbeatGenerator {
  constructor(baseRate = SCHUMANN_HZ) {
    this.baseRate = baseRate;
    this.currentRate = baseRate;
    this.variability = 0.1; // Heart rate variability (10%)
    this.rhythm = RhythmState.SINUS;
    this.beatCount = 0;
    this.lastBeat = null;
    this.intervals = [];
    this.maxIntervals = 100;
  }

  beat() {
    const now = Date.now();

    if (this.lastBeat) {
      const interval = now - this.lastBeat;
      this.intervals.push(interval);
      if (this.intervals.length > this.maxIntervals) {
        this.intervals.shift();
      }
    }

    this.lastBeat = now;
    this.beatCount++;

    return {
      count: this.beatCount,
      timestamp: now,
      rate: this.currentRate,
      rhythm: this.rhythm,
      interval: this.currentInterval()
    };
  }

  currentInterval() {
    const baseInterval = 1000 / this.currentRate;
    const variability = baseInterval * this.variability;
    const randomFactor = (Math.random() - 0.5) * 2 * variability;
    return baseInterval + randomFactor;
  }

  adjustRate(factor) {
    this.currentRate = this.baseRate * factor;

    if (factor > PHI) {
      this.rhythm = RhythmState.TACHYCARDIA;
    } else if (factor < 1 / PHI) {
      this.rhythm = RhythmState.BRADYCARDIA;
    } else {
      this.rhythm = RhythmState.SINUS;
    }

    return this.currentRate;
  }

  setVariability(hrv) {
    this.variability = Math.max(0, Math.min(1, hrv));
  }

  hrv() {
    if (this.intervals.length < 2) return 0;

    // Calculate RMSSD (Root Mean Square of Successive Differences)
    let sumSqDiff = 0;
    for (let i = 1; i < this.intervals.length; i++) {
      const diff = this.intervals[i] - this.intervals[i - 1];
      sumSqDiff += diff * diff;
    }

    return Math.sqrt(sumSqDiff / (this.intervals.length - 1));
  }

  meanInterval() {
    if (this.intervals.length === 0) return 1000 / this.baseRate;
    return this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length;
  }

  status() {
    return {
      baseRate: this.baseRate,
      currentRate: this.currentRate,
      rhythm: this.rhythm,
      beatCount: this.beatCount,
      hrv: this.hrv(),
      meanInterval: this.meanInterval(),
      variability: this.variability
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH MONITOR
// ═══════════════════════════════════════════════════════════════════════════

class HealthMonitor {
  constructor(options = {}) {
    this.checks = new Map();
    this.history = [];
    this.maxHistory = options.maxHistory || 100;
    this.degradedThreshold = options.degradedThreshold || 0.7;
    this.criticalThreshold = options.criticalThreshold || 0.3;
  }

  registerCheck(name, checkFn, weight = 1) {
    this.checks.set(name, {
      fn: checkFn,
      weight,
      lastResult: null,
      lastCheck: null
    });
  }

  removeCheck(name) {
    return this.checks.delete(name);
  }

  async runChecks() {
    const results = {};
    let totalWeight = 0;
    let healthyWeight = 0;

    for (const [name, check] of this.checks) {
      try {
        const start = Date.now();
        const result = await check.fn();
        const duration = Date.now() - start;

        results[name] = {
          healthy: result.healthy,
          message: result.message,
          duration,
          timestamp: Date.now()
        };

        check.lastResult = results[name];
        check.lastCheck = Date.now();

        totalWeight += check.weight;
        if (result.healthy) {
          healthyWeight += check.weight;
        }
      } catch (error) {
        results[name] = {
          healthy: false,
          message: error.message,
          error: true,
          timestamp: Date.now()
        };
        check.lastResult = results[name];
        check.lastCheck = Date.now();
        totalWeight += check.weight;
      }
    }

    const score = totalWeight > 0 ? healthyWeight / totalWeight : 1;
    let status;

    if (score >= this.degradedThreshold) {
      status = HealthStatus.HEALTHY;
    } else if (score >= this.criticalThreshold) {
      status = HealthStatus.DEGRADED;
    } else if (score > 0) {
      status = HealthStatus.CRITICAL;
    } else {
      status = HealthStatus.FAILED;
    }

    const report = {
      status,
      score,
      checks: results,
      timestamp: Date.now()
    };

    this.history.push(report);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return report;
  }

  getHistory() {
    return [...this.history];
  }

  trend() {
    if (this.history.length < 2) return 0;

    const recent = this.history.slice(-10);
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b.score, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDINA HEART
// ═══════════════════════════════════════════════════════════════════════════

class MedinaHeart extends EventEmitter {
  constructor(entityId, options = {}) {
    super();
    this.entityId = entityId;
    this.generator = new HeartbeatGenerator(options.baseRate || SCHUMANN_HZ);
    this.monitor = new HealthMonitor(options);
    this.interval = null;
    this.running = false;
    this.listeners = new Map();
    this.missedBeats = 0;
    this.maxMissedBeats = options.maxMissedBeats || 3;

    // Register default health checks
    this._registerDefaultChecks();
  }

  _registerDefaultChecks() {
    this.monitor.registerCheck('heartbeat', async () => {
      const hrv = this.generator.hrv();
      const healthy = this.generator.rhythm !== RhythmState.ASYSTOLE &&
                     this.missedBeats < this.maxMissedBeats;
      return {
        healthy,
        message: healthy ? `HRV: ${hrv.toFixed(2)}ms` : 'Heartbeat failure detected'
      };
    }, 2);

    this.monitor.registerCheck('memory', async () => {
      const used = process.memoryUsage();
      const heapUsed = used.heapUsed / used.heapTotal;
      return {
        healthy: heapUsed < 0.9,
        message: `Heap usage: ${(heapUsed * 100).toFixed(1)}%`
      };
    }, 1);

    this.monitor.registerCheck('rhythm', async () => {
      const healthy = this.generator.rhythm === RhythmState.SINUS ||
                     this.generator.rhythm === RhythmState.TACHYCARDIA ||
                     this.generator.rhythm === RhythmState.BRADYCARDIA;
      return {
        healthy,
        message: `Rhythm: ${this.generator.rhythm}`
      };
    }, 1);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.missedBeats = 0;

    const pulse = () => {
      if (!this.running) return;

      try {
        const beat = this.generator.beat();
        this.emit('beat', beat);

        // Notify listeners
        for (const [id, listener] of this.listeners) {
          try {
            listener(beat);
          } catch (e) {
            this.emit('listener-error', { id, error: e });
          }
        }

        this.missedBeats = 0;
      } catch (error) {
        this.missedBeats++;
        this.emit('error', error);

        if (this.missedBeats >= this.maxMissedBeats) {
          this.generator.rhythm = RhythmState.ASYSTOLE;
          this.emit('asystole');
        }
      }

      // Schedule next beat
      const nextInterval = this.generator.currentInterval();
      this.interval = setTimeout(pulse, nextInterval);
    };

    pulse();
    this.emit('started');
  }

  stop() {
    this.running = false;
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    this.emit('stopped');
  }

  addListener(id, callback) {
    this.listeners.set(id, callback);
  }

  removeListener(id) {
    return this.listeners.delete(id);
  }

  async checkHealth() {
    return this.monitor.runChecks();
  }

  addHealthCheck(name, fn, weight = 1) {
    this.monitor.registerCheck(name, fn, weight);
  }

  accelerate(factor = PHI) {
    this.generator.adjustRate(factor);
    this.emit('rate-change', { rate: this.generator.currentRate, rhythm: this.generator.rhythm });
  }

  decelerate(factor = 1 / PHI) {
    this.generator.adjustRate(factor);
    this.emit('rate-change', { rate: this.generator.currentRate, rhythm: this.generator.rhythm });
  }

  normalize() {
    this.generator.adjustRate(1);
    this.emit('rate-change', { rate: this.generator.currentRate, rhythm: this.generator.rhythm });
  }

  status() {
    return {
      entityId: this.entityId,
      running: this.running,
      generator: this.generator.status(),
      listenerCount: this.listeners.size,
      missedBeats: this.missedBeats,
      lastHealth: this.monitor.history[this.monitor.history.length - 1] || null,
      healthTrend: this.monitor.trend()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HEART NETWORK (Distributed Hearts)
// ═══════════════════════════════════════════════════════════════════════════

class HeartNetwork extends EventEmitter {
  constructor() {
    super();
    this.hearts = new Map();
    this.syncInterval = null;
    this.syncRunning = false;
  }

  register(heart) {
    this.hearts.set(heart.entityId, heart);

    heart.on('beat', (beat) => {
      this.emit('beat', { entityId: heart.entityId, beat });
    });

    heart.on('asystole', () => {
      this.emit('asystole', { entityId: heart.entityId });
    });

    return heart;
  }

  unregister(entityId) {
    const heart = this.hearts.get(entityId);
    if (heart) {
      heart.stop();
      this.hearts.delete(entityId);
      return true;
    }
    return false;
  }

  startSync(intervalMs = 5000) {
    if (this.syncRunning) return;
    this.syncRunning = true;

    this.syncInterval = setInterval(() => {
      this._synchronize();
    }, intervalMs);
  }

  stopSync() {
    this.syncRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  _synchronize() {
    // Calculate mean phase
    const phases = [];
    for (const [, heart] of this.hearts) {
      const beatCount = heart.generator.beatCount;
      const phase = (beatCount % 100) / 100 * 2 * Math.PI;
      phases.push(phase);
    }

    if (phases.length === 0) return;

    // Kuramoto order parameter
    let sumCos = 0, sumSin = 0;
    for (const phase of phases) {
      sumCos += Math.cos(phase);
      sumSin += Math.sin(phase);
    }

    const r = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / phases.length;

    this.emit('sync', {
      orderParameter: r,
      synchronized: r > 0.8,
      heartCount: this.hearts.size
    });
  }

  async checkAllHealth() {
    const results = {};

    for (const [id, heart] of this.hearts) {
      results[id] = await heart.checkHealth();
    }

    return results;
  }

  status() {
    const heartStatuses = {};
    for (const [id, heart] of this.hearts) {
      heartStatuses[id] = heart.status();
    }

    return {
      heartCount: this.hearts.size,
      syncRunning: this.syncRunning,
      hearts: heartStatuses
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  BASE_INTERVAL_MS,
  RhythmState,
  HealthStatus,
  HeartbeatGenerator,
  HealthMonitor,
  MedinaHeart,
  HeartNetwork
};
