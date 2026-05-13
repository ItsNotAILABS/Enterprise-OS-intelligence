/**
 * MEDINA TIMERS SDK
 * RSHIP-2026-MEDINA-TIMERS-001
 *
 * Medina Timers provides φ-scaled timing primitives for AGI coordination.
 * Implements golden ratio intervals, adaptive scheduling, and temporal
 * synchronization across distributed intelligence.
 *
 * Features:
 * - φ-scaled intervals (φ, φ², φ³...)
 * - Adaptive timer coalescing
 * - Temporal deadlines with drift compensation
 * - Hierarchical timer wheels
 *
 * @module medina-timers
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_MS = 1000 / 7.83; // ~127.7ms

// ═══════════════════════════════════════════════════════════════════════════
// PHI INTERVAL CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════

class PhiIntervals {
  static ladder(baseMs = SCHUMANN_MS, levels = 10) {
    const intervals = [];
    for (let i = -levels; i <= levels; i++) {
      intervals.push({
        level: i,
        ms: baseMs * Math.pow(PHI, i)
      });
    }
    return intervals;
  }

  static nearest(targetMs, baseMs = SCHUMANN_MS) {
    // Find nearest φ-scaled interval
    const level = Math.round(Math.log(targetMs / baseMs) / Math.log(PHI));
    return baseMs * Math.pow(PHI, level);
  }

  static fibonacci(n) {
    const fibs = [1, 1];
    for (let i = 2; i < n; i++) {
      fibs[i] = fibs[i - 1] + fibs[i - 2];
    }
    return fibs;
  }

  static goldenSpiral(steps, baseMs = 1000) {
    const intervals = [];
    const fibs = this.fibonacci(steps + 2);
    for (let i = 0; i < steps; i++) {
      intervals.push(baseMs * fibs[i + 2] / fibs[2]);
    }
    return intervals;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class MedinaTimer extends EventEmitter {
  constructor(callback, intervalMs, options = {}) {
    super();
    this.id = options.id || `timer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.callback = callback;
    this.baseInterval = intervalMs;
    this.interval = intervalMs;
    this.adaptive = options.adaptive !== false;
    this.phiScaled = options.phiScaled !== false;

    this.running = false;
    this.paused = false;
    this.handle = null;
    this.executionCount = 0;
    this.lastExecution = null;
    this.drift = 0;
    this.executionTimes = [];
    this.maxExecutionTimes = 50;
  }

  start() {
    if (this.running) return this;
    this.running = true;
    this.paused = false;
    this._scheduleNext();
    this.emit('started');
    return this;
  }

  stop() {
    this.running = false;
    if (this.handle) {
      clearTimeout(this.handle);
      this.handle = null;
    }
    this.emit('stopped');
    return this;
  }

  pause() {
    if (!this.running || this.paused) return this;
    this.paused = true;
    if (this.handle) {
      clearTimeout(this.handle);
      this.handle = null;
    }
    this.emit('paused');
    return this;
  }

  resume() {
    if (!this.running || !this.paused) return this;
    this.paused = false;
    this._scheduleNext();
    this.emit('resumed');
    return this;
  }

  _scheduleNext() {
    if (!this.running || this.paused) return;

    // Compensate for drift
    let nextInterval = this.interval - this.drift;
    nextInterval = Math.max(1, nextInterval);

    this.handle = setTimeout(() => {
      this._execute();
    }, nextInterval);
  }

  async _execute() {
    const scheduled = Date.now();
    const expected = this.lastExecution ?
      this.lastExecution + this.interval :
      scheduled;

    this.drift = scheduled - expected;

    const start = Date.now();
    try {
      await this.callback();
      this.emit('executed', { count: this.executionCount });
    } catch (error) {
      this.emit('error', error);
    }
    const duration = Date.now() - start;

    this.executionTimes.push(duration);
    if (this.executionTimes.length > this.maxExecutionTimes) {
      this.executionTimes.shift();
    }

    this.lastExecution = scheduled;
    this.executionCount++;

    // Adaptive interval adjustment
    if (this.adaptive) {
      this._adaptInterval(duration);
    }

    this._scheduleNext();
  }

  _adaptInterval(executionDuration) {
    const avgDuration = this.executionTimes.reduce((a, b) => a + b, 0) /
                       this.executionTimes.length;

    // If execution is taking too long, increase interval
    if (avgDuration > this.interval * 0.5) {
      if (this.phiScaled) {
        this.interval = PhiIntervals.nearest(this.interval * PHI);
      } else {
        this.interval = Math.min(this.interval * 1.5, this.baseInterval * 10);
      }
      this.emit('interval-increased', { interval: this.interval });
    }
    // If execution is fast, consider decreasing
    else if (avgDuration < this.interval * 0.1 && this.interval > this.baseInterval) {
      if (this.phiScaled) {
        this.interval = PhiIntervals.nearest(this.interval / PHI);
      } else {
        this.interval = Math.max(this.interval / 1.5, this.baseInterval);
      }
      this.emit('interval-decreased', { interval: this.interval });
    }
  }

  setInterval(ms) {
    this.interval = ms;
    this.baseInterval = ms;
  }

  status() {
    return {
      id: this.id,
      running: this.running,
      paused: this.paused,
      interval: this.interval,
      baseInterval: this.baseInterval,
      executionCount: this.executionCount,
      drift: this.drift,
      avgExecutionTime: this.executionTimes.length > 0 ?
        this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length : 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEADLINE TIMER
// ═══════════════════════════════════════════════════════════════════════════

class DeadlineTimer extends EventEmitter {
  constructor(deadline, callback, options = {}) {
    super();
    this.id = options.id || `deadline-${Date.now()}`;
    this.deadline = deadline;
    this.callback = callback;
    this.warningThreshold = options.warningThreshold || 0.8;
    this.handle = null;
    this.warningHandle = null;
    this.fired = false;
    this.cancelled = false;
  }

  start() {
    if (this.fired || this.cancelled) return this;

    const now = Date.now();
    const remaining = this.deadline - now;

    if (remaining <= 0) {
      this._fire();
      return this;
    }

    // Schedule warning
    const warningTime = remaining * this.warningThreshold;
    this.warningHandle = setTimeout(() => {
      this.emit('warning', {
        remaining: this.deadline - Date.now(),
        threshold: this.warningThreshold
      });
    }, remaining - warningTime);

    // Schedule deadline
    this.handle = setTimeout(() => {
      this._fire();
    }, remaining);

    this.emit('started', { deadline: this.deadline, remaining });
    return this;
  }

  cancel() {
    this.cancelled = true;
    if (this.handle) {
      clearTimeout(this.handle);
      this.handle = null;
    }
    if (this.warningHandle) {
      clearTimeout(this.warningHandle);
      this.warningHandle = null;
    }
    this.emit('cancelled');
    return this;
  }

  extend(additionalMs) {
    if (this.fired) return this;

    this.cancel();
    this.cancelled = false;
    this.deadline += additionalMs;
    this.emit('extended', { newDeadline: this.deadline, extension: additionalMs });
    return this.start();
  }

  async _fire() {
    this.fired = true;
    try {
      await this.callback();
      this.emit('completed');
    } catch (error) {
      this.emit('error', error);
    }
  }

  remaining() {
    if (this.fired || this.cancelled) return 0;
    return Math.max(0, this.deadline - Date.now());
  }

  status() {
    return {
      id: this.id,
      deadline: this.deadline,
      remaining: this.remaining(),
      fired: this.fired,
      cancelled: this.cancelled
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMER WHEEL
// ═══════════════════════════════════════════════════════════════════════════

class TimerWheel extends EventEmitter {
  constructor(options = {}) {
    super();
    this.tickMs = options.tickMs || 100;
    this.wheelSize = options.wheelSize || 512;
    this.wheel = new Array(this.wheelSize).fill(null).map(() => []);
    this.currentSlot = 0;
    this.running = false;
    this.handle = null;
    this.timerCount = 0;
  }

  schedule(callback, delayMs, options = {}) {
    const ticks = Math.ceil(delayMs / this.tickMs);
    const slot = (this.currentSlot + ticks) % this.wheelSize;
    const rounds = Math.floor(ticks / this.wheelSize);

    const timer = {
      id: options.id || `wheel-${Date.now()}-${++this.timerCount}`,
      callback,
      rounds,
      slot,
      created: Date.now()
    };

    this.wheel[slot].push(timer);
    return timer.id;
  }

  cancel(timerId) {
    for (const slot of this.wheel) {
      const index = slot.findIndex(t => t.id === timerId);
      if (index !== -1) {
        slot.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  start() {
    if (this.running) return;
    this.running = true;

    this.handle = setInterval(() => {
      this._tick();
    }, this.tickMs);

    this.emit('started');
  }

  stop() {
    this.running = false;
    if (this.handle) {
      clearInterval(this.handle);
      this.handle = null;
    }
    this.emit('stopped');
  }

  _tick() {
    const slot = this.wheel[this.currentSlot];
    const toExecute = [];

    // Process timers in current slot
    for (let i = slot.length - 1; i >= 0; i--) {
      const timer = slot[i];
      if (timer.rounds === 0) {
        toExecute.push(timer);
        slot.splice(i, 1);
      } else {
        timer.rounds--;
      }
    }

    // Execute ready timers
    for (const timer of toExecute) {
      try {
        timer.callback();
        this.emit('executed', { id: timer.id });
      } catch (error) {
        this.emit('error', { id: timer.id, error });
      }
    }

    this.currentSlot = (this.currentSlot + 1) % this.wheelSize;
  }

  status() {
    let totalTimers = 0;
    for (const slot of this.wheel) {
      totalTimers += slot.length;
    }

    return {
      running: this.running,
      tickMs: this.tickMs,
      wheelSize: this.wheelSize,
      currentSlot: this.currentSlot,
      totalTimers
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULER
// ═══════════════════════════════════════════════════════════════════════════

class MedinaScheduler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.timers = new Map();
    this.deadlines = new Map();
    this.wheel = new TimerWheel(options);
    this.running = false;
  }

  createTimer(id, callback, intervalMs, options = {}) {
    if (this.timers.has(id)) {
      throw new Error(`Timer ${id} already exists`);
    }

    const timer = new MedinaTimer(callback, intervalMs, { ...options, id });
    this.timers.set(id, timer);

    timer.on('error', (error) => this.emit('timer-error', { id, error }));

    if (this.running) {
      timer.start();
    }

    return timer;
  }

  createDeadline(id, deadline, callback, options = {}) {
    if (this.deadlines.has(id)) {
      throw new Error(`Deadline ${id} already exists`);
    }

    const timer = new DeadlineTimer(deadline, callback, { ...options, id });
    this.deadlines.set(id, timer);

    timer.on('completed', () => this.deadlines.delete(id));
    timer.on('cancelled', () => this.deadlines.delete(id));
    timer.on('error', (error) => this.emit('deadline-error', { id, error }));

    if (this.running) {
      timer.start();
    }

    return timer;
  }

  scheduleOnce(callback, delayMs, options = {}) {
    return this.wheel.schedule(callback, delayMs, options);
  }

  cancelScheduled(id) {
    return this.wheel.cancel(id);
  }

  start() {
    this.running = true;
    this.wheel.start();

    for (const [, timer] of this.timers) {
      timer.start();
    }

    for (const [, deadline] of this.deadlines) {
      deadline.start();
    }

    this.emit('started');
  }

  stop() {
    this.running = false;
    this.wheel.stop();

    for (const [, timer] of this.timers) {
      timer.stop();
    }

    for (const [, deadline] of this.deadlines) {
      deadline.cancel();
    }

    this.emit('stopped');
  }

  pauseTimer(id) {
    const timer = this.timers.get(id);
    if (timer) timer.pause();
  }

  resumeTimer(id) {
    const timer = this.timers.get(id);
    if (timer) timer.resume();
  }

  removeTimer(id) {
    const timer = this.timers.get(id);
    if (timer) {
      timer.stop();
      this.timers.delete(id);
      return true;
    }
    return false;
  }

  status() {
    const timerStatuses = {};
    for (const [id, timer] of this.timers) {
      timerStatuses[id] = timer.status();
    }

    const deadlineStatuses = {};
    for (const [id, deadline] of this.deadlines) {
      deadlineStatuses[id] = deadline.status();
    }

    return {
      running: this.running,
      timerCount: this.timers.size,
      deadlineCount: this.deadlines.size,
      wheel: this.wheel.status(),
      timers: timerStatuses,
      deadlines: deadlineStatuses
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_MS,
  PhiIntervals,
  MedinaTimer,
  DeadlineTimer,
  TimerWheel,
  MedinaScheduler
};
