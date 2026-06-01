/**
 * @medina/multi-engine-orchestrator — Engine Pool
 *
 * Manages pools of engine instances with warm/cool lifecycle,
 * concurrency control, and automatic scaling. Implements sovereign
 * cycle budgeting per pool.
 *
 * @module @medina/multi-engine-orchestrator/engine-pool
 */

import crypto from 'node:crypto';
import { ENGINE_STATES } from './engine-registry.js';

const PHI = (1 + Math.sqrt(5)) / 2;
const HEARTBEAT_MS = 873;

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE POOL
// ═══════════════════════════════════════════════════════════════════════════════

export class EnginePool {
  constructor(config = {}) {
    this.id = crypto.randomUUID();
    this.name = config.name || 'default-pool';
    this.minInstances = config.minInstances || 1;
    this.maxInstances = config.maxInstances || 16;
    this.scaleUpThreshold = config.scaleUpThreshold || 0.8;
    this.scaleDownThreshold = config.scaleDownThreshold || 0.2;
    this.cooldownMs = config.cooldownMs || 30000;
    this.warmupMs = config.warmupMs || 5000;

    /** @type {Map<string, PooledEngine>} */
    this.instances = new Map();
    this.queue = [];
    this.cycleBudget = config.cycleBudget || 10000;
    this.cyclesConsumed = 0;
    this.lastScaleEvent = 0;
  }

  /**
   * Acquires an engine instance from the pool.
   * If no idle instance is available and pool is below max, scales up.
   */
  acquire(taskDescriptor = {}) {
    // Find idle instance
    const idle = [...this.instances.values()].find(i => i.state === ENGINE_STATES.IDLE);
    if (idle) {
      idle.state = ENGINE_STATES.ACTIVE;
      idle.lastAcquired = Date.now();
      idle.tasksProcessed++;
      return { success: true, instance: idle };
    }

    // Scale up if possible
    if (this.instances.size < this.maxInstances) {
      const instance = this._createInstance(taskDescriptor);
      instance.state = ENGINE_STATES.ACTIVE;
      instance.lastAcquired = Date.now();
      return { success: true, instance, scaled: true };
    }

    // Queue the request
    const queued = {
      id: crypto.randomUUID(),
      taskDescriptor,
      queuedAt: Date.now()
    };
    this.queue.push(queued);

    return { success: false, queued: true, position: this.queue.length, id: queued.id };
  }

  /**
   * Releases an engine instance back to the pool.
   */
  release(instanceId, result = {}) {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    instance.state = ENGINE_STATES.IDLE;
    instance.lastReleased = Date.now();
    if (result.cyclesConsumed) {
      this.cyclesConsumed += result.cyclesConsumed;
    }

    // Process queued tasks
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      instance.state = ENGINE_STATES.ACTIVE;
      instance.lastAcquired = Date.now();
      instance.tasksProcessed++;
      return { reassigned: true, taskId: next.id, instance };
    }

    // Scale down if underutilized
    this._evaluateScaleDown();

    return { released: true };
  }

  /**
   * Returns pool utilization metrics.
   */
  getUtilization() {
    const instances = [...this.instances.values()];
    const active = instances.filter(i => i.state === ENGINE_STATES.ACTIVE).length;
    const total = instances.length;

    return {
      poolId: this.id,
      name: this.name,
      instances: total,
      active,
      idle: total - active,
      utilization: total > 0 ? active / total : 0,
      queueDepth: this.queue.length,
      cyclesRemaining: this.cycleBudget - this.cyclesConsumed,
      cycleUtilization: this.cyclesConsumed / this.cycleBudget,
      totalTasksProcessed: instances.reduce((s, i) => s + i.tasksProcessed, 0)
    };
  }

  _createInstance(descriptor = {}) {
    const instance = {
      id: crypto.randomUUID(),
      poolId: this.id,
      state: ENGINE_STATES.WARMING,
      createdAt: Date.now(),
      lastAcquired: null,
      lastReleased: null,
      tasksProcessed: 0,
      engineClass: descriptor.requiredClass || 'general',
      metadata: {}
    };
    this.instances.set(instance.id, instance);
    return instance;
  }

  _evaluateScaleDown() {
    const now = Date.now();
    if (now - this.lastScaleEvent < this.cooldownMs) return;

    const utilization = this.getUtilization().utilization;
    if (utilization < this.scaleDownThreshold && this.instances.size > this.minInstances) {
      // Remove oldest idle instance
      const idle = [...this.instances.values()]
        .filter(i => i.state === ENGINE_STATES.IDLE)
        .sort((a, b) => (a.lastReleased || 0) - (b.lastReleased || 0));

      if (idle.length > 0) {
        this.instances.delete(idle[0].id);
        this.lastScaleEvent = now;
      }
    }
  }
}
