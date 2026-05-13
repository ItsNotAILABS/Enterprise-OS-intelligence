/**
 * POWER CORE SDK
 * RSHIP-2026-POWER-CORE-001
 *
 * Power Core provides energy management and resource allocation
 * for AGI systems. Implements φ-weighted power distribution,
 * computational budgeting, and adaptive throttling.
 *
 * @module power-core
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// POWER STATES
// ═══════════════════════════════════════════════════════════════════════════

const PowerState = {
  FULL: 'full',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
  CRITICAL: 'critical',
  HIBERNATE: 'hibernate'
};

const PowerLevel = {
  [PowerState.FULL]: 1.0,
  [PowerState.HIGH]: 0.8,
  [PowerState.NORMAL]: 0.6,
  [PowerState.LOW]: 0.4,
  [PowerState.CRITICAL]: 0.2,
  [PowerState.HIBERNATE]: 0.05
};

// ═══════════════════════════════════════════════════════════════════════════
// POWER BUDGET
// ═══════════════════════════════════════════════════════════════════════════

class PowerBudget {
  constructor(totalUnits = 1000) {
    this.total = totalUnits;
    this.allocated = 0;
    this.allocations = new Map();
    this.history = [];
    this.maxHistory = 1000;
  }

  allocate(consumerId, units, priority = 1) {
    const available = this.total - this.allocated;
    const weighted = units * Math.pow(PHI, priority - 1);
    const actual = Math.min(units, available);

    if (actual < units * 0.5) {
      return { success: false, allocated: 0, requested: units };
    }

    this.allocations.set(consumerId, {
      units: actual,
      priority,
      timestamp: Date.now()
    });

    this.allocated += actual;
    this._log('allocate', consumerId, actual);

    return { success: true, allocated: actual, requested: units };
  }

  release(consumerId) {
    const allocation = this.allocations.get(consumerId);
    if (!allocation) return 0;

    this.allocated -= allocation.units;
    this.allocations.delete(consumerId);
    this._log('release', consumerId, allocation.units);

    return allocation.units;
  }

  adjust(consumerId, newUnits) {
    const current = this.allocations.get(consumerId);
    if (!current) return this.allocate(consumerId, newUnits);

    const delta = newUnits - current.units;

    if (delta > 0) {
      const available = this.total - this.allocated;
      const actual = Math.min(delta, available);
      current.units += actual;
      this.allocated += actual;
      this._log('adjust', consumerId, actual);
      return { success: true, allocated: current.units };
    } else {
      current.units = newUnits;
      this.allocated += delta;
      this._log('adjust', consumerId, delta);
      return { success: true, allocated: current.units };
    }
  }

  getAllocation(consumerId) {
    return this.allocations.get(consumerId) || null;
  }

  available() {
    return this.total - this.allocated;
  }

  utilization() {
    return this.allocated / this.total;
  }

  _log(action, consumerId, units) {
    this.history.push({
      action,
      consumerId,
      units,
      timestamp: Date.now(),
      utilization: this.utilization()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  status() {
    return {
      total: this.total,
      allocated: this.allocated,
      available: this.available(),
      utilization: this.utilization(),
      consumerCount: this.allocations.size
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POWER GOVERNOR
// ═══════════════════════════════════════════════════════════════════════════

class PowerGovernor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.budget = new PowerBudget(options.totalPower || 1000);
    this.state = PowerState.NORMAL;
    this.throttleLevel = 0;
    this.consumers = new Map();
    this.policies = new Map();
    this._setupDefaultPolicies();
  }

  _setupDefaultPolicies() {
    this.policies.set('critical', {
      threshold: 0.95,
      action: () => {
        this.setState(PowerState.CRITICAL);
        this._enforceEmergencyThrottle();
      }
    });

    this.policies.set('high', {
      threshold: 0.8,
      action: () => {
        this.setState(PowerState.HIGH);
        this._requestReduction(0.2);
      }
    });

    this.policies.set('recovery', {
      threshold: 0.5,
      action: () => {
        if (this.state !== PowerState.NORMAL) {
          this.setState(PowerState.NORMAL);
          this._releaseThrottle();
        }
      }
    });
  }

  registerConsumer(id, config = {}) {
    this.consumers.set(id, {
      id,
      minPower: config.minPower || 10,
      maxPower: config.maxPower || 100,
      priority: config.priority || 1,
      elastic: config.elastic !== false,
      currentPower: 0
    });
  }

  unregisterConsumer(id) {
    this.budget.release(id);
    return this.consumers.delete(id);
  }

  requestPower(consumerId, units) {
    const consumer = this.consumers.get(consumerId);
    if (!consumer) {
      throw new Error(`Consumer ${consumerId} not registered`);
    }

    // Apply throttle
    const throttled = units * (1 - this.throttleLevel);
    const clamped = Math.min(throttled, consumer.maxPower);

    const result = this.budget.allocate(consumerId, clamped, consumer.priority);

    if (result.success) {
      consumer.currentPower = result.allocated;
      this._checkPolicies();
    }

    return result;
  }

  releasePower(consumerId) {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.currentPower = 0;
    }
    const released = this.budget.release(consumerId);
    this._checkPolicies();
    return released;
  }

  setState(state) {
    const oldState = this.state;
    this.state = state;
    this.emit('state-change', { from: oldState, to: state });
  }

  setThrottle(level) {
    this.throttleLevel = Math.max(0, Math.min(1, level));
    this.emit('throttle-change', { level: this.throttleLevel });
  }

  _checkPolicies() {
    const utilization = this.budget.utilization();

    for (const [name, policy] of this.policies) {
      if (name === 'recovery') {
        if (utilization <= policy.threshold) {
          policy.action();
        }
      } else {
        if (utilization >= policy.threshold) {
          policy.action();
          break;
        }
      }
    }
  }

  _enforceEmergencyThrottle() {
    this.setThrottle(0.5);

    // Force reduction on elastic consumers
    for (const [id, consumer] of this.consumers) {
      if (consumer.elastic && consumer.currentPower > consumer.minPower) {
        const reduction = (consumer.currentPower - consumer.minPower) * 0.5;
        this.budget.adjust(id, consumer.currentPower - reduction);
        consumer.currentPower -= reduction;
      }
    }

    this.emit('emergency-throttle');
  }

  _requestReduction(percentage) {
    for (const [id, consumer] of this.consumers) {
      if (consumer.elastic && consumer.currentPower > consumer.minPower) {
        const reduction = consumer.currentPower * percentage;
        const newPower = Math.max(consumer.minPower, consumer.currentPower - reduction);
        this.budget.adjust(id, newPower);
        consumer.currentPower = newPower;
      }
    }

    this.emit('reduction-requested', { percentage });
  }

  _releaseThrottle() {
    this.setThrottle(0);
    this.emit('throttle-released');
  }

  status() {
    return {
      state: this.state,
      powerLevel: PowerLevel[this.state],
      throttleLevel: this.throttleLevel,
      budget: this.budget.status(),
      consumerCount: this.consumers.size
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPUTE METER
// ═══════════════════════════════════════════════════════════════════════════

class ComputeMeter {
  constructor(options = {}) {
    this.window = options.window || 60000;
    this.samples = [];
    this.maxSamples = options.maxSamples || 1000;
  }

  record(units, duration) {
    this.samples.push({
      units,
      duration,
      timestamp: Date.now(),
      rate: units / (duration / 1000)
    });

    this._cleanup();
  }

  _cleanup() {
    const cutoff = Date.now() - this.window;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);

    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }

  totalUnits() {
    this._cleanup();
    return this.samples.reduce((sum, s) => sum + s.units, 0);
  }

  averageRate() {
    this._cleanup();
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((sum, s) => sum + s.rate, 0) / this.samples.length;
  }

  peakRate() {
    this._cleanup();
    if (this.samples.length === 0) return 0;
    return Math.max(...this.samples.map(s => s.rate));
  }

  status() {
    return {
      sampleCount: this.samples.length,
      windowMs: this.window,
      totalUnits: this.totalUnits(),
      averageRate: this.averageRate(),
      peakRate: this.peakRate()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POWER CORE MANAGER
// ═══════════════════════════════════════════════════════════════════════════

class PowerCoreManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.governor = new PowerGovernor(options);
    this.meters = new Map();
    this.running = false;
    this.monitorInterval = null;
    this.monitorFrequency = options.monitorFrequency || 1000;
  }

  registerConsumer(id, config = {}) {
    this.governor.registerConsumer(id, config);
    this.meters.set(id, new ComputeMeter());
  }

  unregisterConsumer(id) {
    this.governor.unregisterConsumer(id);
    this.meters.delete(id);
  }

  async withPower(consumerId, units, fn) {
    const result = this.governor.requestPower(consumerId, units);
    if (!result.success) {
      throw new Error(`Insufficient power for ${consumerId}`);
    }

    const start = Date.now();
    try {
      return await fn(result.allocated);
    } finally {
      const duration = Date.now() - start;
      const meter = this.meters.get(consumerId);
      if (meter) {
        meter.record(result.allocated, duration);
      }
      this.governor.releasePower(consumerId);
    }
  }

  start() {
    if (this.running) return;
    this.running = true;

    this.monitorInterval = setInterval(() => {
      this._monitor();
    }, this.monitorFrequency);

    this.emit('started');
  }

  stop() {
    this.running = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.emit('stopped');
  }

  _monitor() {
    const status = this.status();
    this.emit('monitor', status);

    // Auto-adjust based on patterns
    if (status.governor.budget.utilization > 0.9) {
      this.governor._requestReduction(0.1);
    }
  }

  status() {
    const meterStatuses = {};
    for (const [id, meter] of this.meters) {
      meterStatuses[id] = meter.status();
    }

    return {
      running: this.running,
      governor: this.governor.status(),
      meters: meterStatuses
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  PowerState,
  PowerLevel,
  PowerBudget,
  PowerGovernor,
  ComputeMeter,
  PowerCoreManager
};
