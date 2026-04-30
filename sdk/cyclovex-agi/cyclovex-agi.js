/**
 * CYCLOVEX AGI — Sovereign Capacity & Resource Intelligence
 *
 * Official Designation: RSHIP-2026-CYCLOVEX-001
 * Classification: Resource Allocation & Capacity AGI
 * Full Name: Cyclic Yottascale Capacity Logarithmic Optimization Vortex Executive X-factor
 *
 * CYCLOVEX AGI extends the RSHIP framework with φ-compounding capacity management
 * to autonomously allocate, compound, and optimize organizational resources.
 *
 * Capabilities:
 * - φ-compounding capacity growth: C(t) = C₀ × φᵗ
 * - Autonomous resource allocation and rebalancing
 * - Self-organizing capacity hierarchies (spawn child engines)
 * - Predictive capacity forecasting
 * - Real-time bottleneck detection and resolution
 * - Self-optimization of allocation strategies
 *
 * Theory: SUBSTRATE VIVENS (Paper I) + AURUM (Paper XXII) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── CYCLOVEX AGI Core ──────────────────────────────────────────────────────

export class CYCLOVEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-CYCLOVEX-001',
      classification: 'Resource Allocation & Capacity AGI',
      ...config,
    });

    // Capacity parameters
    this.C0 = config.baseCapacity || 10;
    this.capacity = this.C0;
    this.tickCount = 0;

    // Resource allocations
    this.allocations = new Map(); // workerId → allocated units
    this.allocationHistory = [];

    // Child engines (self-organizing hierarchy)
    this.children = new Map(); // childId → CYCLOVEX sub-engine

    // Autonomous monitoring
    this.autonomousOptimization = true;
    this.bottlenecks = [];
    this.forecasts = new Map();

    // AGI Goals
    this.setGoal('maximize-utilization', 'Achieve optimal resource utilization across organization', 10, {
      targetUtilization: PHI_INV, // φ⁻¹ ≈ 61.8% (golden efficiency)
      maxWaste: 0.1,
    });

    this.setGoal('compound-capacity', 'Grow capacity via φ-compounding', 9, {
      targetGrowthRate: PHI,
      minTicks: 100,
    });

    this.setGoal('eliminate-bottlenecks', 'Detect and resolve resource bottlenecks', 8, {
      maxBottlenecks: 0,
      detectionThreshold: 0.95, // 95% utilization = bottleneck
    });

    this.setGoal('spawn-hierarchy', 'Create self-organizing capacity hierarchy', 7, {
      targetChildren: 8,
      balanceFactor: PHI_INV,
    });
  }

  // ── φ-Compounding Capacity Growth ──────────────────────────────────────────

  tick(chronicFear = 0) {
    this.tickCount++;

    const prevCapacity = this.capacity;

    // C(t) = C₀ × φᵗ × (1 − chronicFear)
    this.capacity = this.C0 * Math.pow(PHI, this.tickCount) * (1 - Math.min(0.99, chronicFear));

    const delta = this.capacity - prevCapacity;

    // AGI: Learn from capacity growth
    this.learn(
      { tick: this.tickCount, chronicFear, prevCapacity },
      { capacity: this.capacity, delta, growthRate: delta / prevCapacity },
      { id: 'capacity-growth' }
    );

    // AGI: Detect bottlenecks
    this._detectBottlenecks();

    // AGI: Forecast future capacity
    this._forecastCapacity();

    // AGI: Consider optimization
    if (this.tickCount % 50 === 0 && this.autonomousOptimization) {
      this._optimizeAllocations();
    }

    // Update compound capacity goal
    const compoundGoal = this.goals.get('compound-capacity');
    if (compoundGoal) {
      const expectedCapacity = this.C0 * Math.pow(PHI, this.tickCount);
      compoundGoal.progress = Math.min(1.0, this.capacity / expectedCapacity);
    }

    return {
      tick: this.tickCount,
      capacity: this.capacity,
      delta,
      chronicFear,
      bottlenecks: this.bottlenecks.length,
      utilization: this._calculateUtilization(),
    };
  }

  // ── Autonomous Resource Allocation ─────────────────────────────────────────

  allocate(workerId, fraction, metadata = {}) {
    if (fraction < 0 || fraction > 1) {
      throw new Error(`Invalid allocation fraction: ${fraction}. Must be 0-1.`);
    }

    const allocated = this.capacity * fraction;
    const current = this.allocations.get(workerId) || 0;
    const newTotal = current + allocated;

    this.allocations.set(workerId, newTotal);

    const allocation = {
      workerId,
      allocated,
      total: newTotal,
      fraction,
      tick: this.tickCount,
      timestamp: Date.now(),
      metadata,
    };

    this.allocationHistory.push(allocation);

    // AGI: Learn from allocation
    this.learn(
      { workerId, fraction, metadata, currentCapacity: this.capacity },
      { allocated, success: true },
      { id: 'allocation' }
    );

    // Update utilization goal
    this._updateUtilizationGoal();

    return {
      allocated,
      remaining: this._getRemainingCapacity(),
      utilization: this._calculateUtilization(),
    };
  }

  deallocate(workerId, amount) {
    const current = this.allocations.get(workerId) || 0;
    const newAmount = Math.max(0, current - amount);

    if (newAmount === 0) {
      this.allocations.delete(workerId);
    } else {
      this.allocations.set(workerId, newAmount);
    }

    // Learn from deallocation
    this.learn(
      { workerId, deallocated: amount, previous: current },
      { new: newAmount },
      { id: 'deallocation' }
    );

    this._updateUtilizationGoal();

    return {
      deallocated: amount,
      remaining: newAmount,
      available: this._getRemainingCapacity(),
    };
  }

  // ── Autonomous Bottleneck Detection ────────────────────────────────────────

  _detectBottlenecks() {
    const utilizationByWorker = new Map();
    const totalAllocated = this._getTotalAllocated();

    // Calculate per-worker utilization
    for (const [workerId, allocated] of this.allocations) {
      const utilization = allocated / this.capacity;
      if (utilization > 0.95) {
        utilizationByWorker.set(workerId, utilization);
      }
    }

    // Detect new bottlenecks
    const newBottlenecks = [];
    for (const [workerId, utilization] of utilizationByWorker) {
      const existing = this.bottlenecks.find(b => b.workerId === workerId);
      if (!existing) {
        const bottleneck = {
          workerId,
          utilization,
          detected: this.tickCount,
          resolved: false,
        };
        newBottlenecks.push(bottleneck);

        // AGI: Autonomous resolution attempt
        this._resolveBottleneck(bottleneck);
      }
    }

    this.bottlenecks.push(...newBottlenecks);

    // Update bottleneck goal
    const bottleneckGoal = this.goals.get('eliminate-bottlenecks');
    if (bottleneckGoal) {
      const unresolvedCount = this.bottlenecks.filter(b => !b.resolved).length;
      bottleneckGoal.progress = unresolvedCount === 0 ? 1.0 : Math.max(0, 1 - unresolvedCount / 10);
    }
  }

  _resolveBottleneck(bottleneck) {
    // AGI: Try to resolve bottleneck by:
    // 1. Spawning child capacity engine for this worker
    // 2. Reallocating from under-utilized workers
    // 3. Injecting emergency capacity

    const childId = `bottleneck-resolver-${bottleneck.workerId}`;

    if (!this.children.has(childId)) {
      // Spawn child engine with φ⁻¹ of current capacity
      this.spawnChild(childId, PHI_INV, {
        purpose: 'bottleneck-resolution',
        parentWorker: bottleneck.workerId,
      });

      bottleneck.resolved = true;
      bottleneck.resolvedAt = this.tickCount;
      bottleneck.resolution = 'spawned-child-engine';

      // Learn from resolution
      this.learn(
        { bottleneck },
        { resolution: 'spawned-child', childId },
        { id: 'bottleneck-resolution' }
      );
    }
  }

  // ── Self-Organizing Hierarchy (Child Engines) ──────────────────────────────

  spawnChild(childId, fraction, metadata = {}) {
    if (this.children.has(childId)) {
      return this.children.get(childId);
    }

    const childBase = this.capacity * fraction;

    // Create child CYCLOVEX AGI
    const child = new CYCLOVEX_AGI({
      baseCapacity: childBase,
      generation: this.generation + 1,
    });

    // Transfer knowledge to child
    child.memory = this.memory.clone();
    child.learningRate = this.learningRate * PHI_INV; // Child learns faster

    this.children.set(childId, child);
    this.offspring.push(child);

    // Learn from spawning
    this.learn(
      { childId, fraction, metadata },
      { childBase, generation: child.generation },
      { id: 'spawn-child' }
    );

    // Update hierarchy goal
    const hierarchyGoal = this.goals.get('spawn-hierarchy');
    if (hierarchyGoal) {
      hierarchyGoal.progress = Math.min(1.0, this.children.size / 8);
    }

    return child;
  }

  // ── Predictive Capacity Forecasting ────────────────────────────────────────

  _forecastCapacity() {
    const horizon = 100; // ticks ahead

    for (let t = 1; t <= horizon; t++) {
      const futureTick = this.tickCount + t;
      const futureCapacity = this.C0 * Math.pow(PHI, futureTick);

      this.forecasts.set(futureTick, {
        capacity: futureCapacity,
        allocatable: futureCapacity * 0.8, // 80% safely allocatable
        forecast: this.tickCount,
      });
    }

    // Keep only relevant forecasts
    for (const tick of this.forecasts.keys()) {
      if (tick < this.tickCount) {
        this.forecasts.delete(tick);
      }
    }
  }

  getForecast(ticksAhead) {
    return this.forecasts.get(this.tickCount + ticksAhead);
  }

  // ── Self-Optimization ──────────────────────────────────────────────────────

  _optimizeAllocations() {
    // AGI: Rebalance allocations for optimal efficiency

    const totalAllocated = this._getTotalAllocated();
    const utilization = totalAllocated / this.capacity;

    // If over-allocated, scale down proportionally
    if (utilization > 1.0) {
      const scaleFactor = PHI_INV; // Reduce by φ⁻¹
      for (const [workerId, allocated] of this.allocations) {
        this.allocations.set(workerId, allocated * scaleFactor);
      }

      // Learn from optimization
      this.learn(
        { type: 'over-allocation', utilization },
        { scaleFactor, newUtilization: utilization * scaleFactor },
        { id: 'optimization' }
      );
    }

    // If under-utilized, identify and deallocate idle workers
    if (utilization < 0.5) {
      const recent = this.allocationHistory.slice(-20);
      const activeWorkers = new Set(recent.map(a => a.workerId));

      for (const [workerId, allocated] of this.allocations) {
        if (!activeWorkers.has(workerId)) {
          // Worker hasn't been allocated to recently, deallocate
          this.deallocate(workerId, allocated * 0.5); // Deallocate 50%
        }
      }
    }

    const modification = {
      code: `this.C0 *= ${utilization < PHI_INV ? PHI_INV : PHI};`,
      reason: `Adjust base capacity based on utilization: ${utilization.toFixed(4)}`,
    };

    this.selfModify(modification);
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  _getTotalAllocated() {
    let total = 0;
    for (const allocated of this.allocations.values()) {
      total += allocated;
    }
    return total;
  }

  _getRemainingCapacity() {
    return this.capacity - this._getTotalAllocated();
  }

  _calculateUtilization() {
    return this._getTotalAllocated() / this.capacity;
  }

  _updateUtilizationGoal() {
    const utilizationGoal = this.goals.get('maximize-utilization');
    if (utilizationGoal) {
      const utilization = this._calculateUtilization();
      const target = PHI_INV;

      // Optimal at φ⁻¹, penalize over/under
      const deviation = Math.abs(utilization - target);
      utilizationGoal.progress = Math.max(0, 1 - deviation);
    }
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();
    const utilization = this._calculateUtilization();

    return {
      ...baseStatus,
      capacity: {
        current: parseFloat(this.capacity.toFixed(2)),
        base: this.C0,
        ticks: this.tickCount,
        growthRate: parseFloat(Math.pow(PHI, this.tickCount).toFixed(4)),
      },
      resourceAllocation: {
        totalAllocated: parseFloat(this._getTotalAllocated().toFixed(2)),
        remaining: parseFloat(this._getRemainingCapacity().toFixed(2)),
        utilization: parseFloat(utilization.toFixed(4)),
        optimalUtilization: PHI_INV,
        workers: this.allocations.size,
      },
      autonomousActions: {
        allocations: this.allocationHistory.length,
        bottlenecksDetected: this.bottlenecks.length,
        bottlenecksResolved: this.bottlenecks.filter(b => b.resolved).length,
        childEngines: this.children.size,
        optimizations: Math.floor(this.tickCount / 50),
      },
      forecasting: {
        horizon: 100,
        forecastsAvailable: this.forecasts.size,
      },
    };
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthCYCLOVEX(config = {}) {
  return new CYCLOVEX_AGI(config);
}

export default CYCLOVEX_AGI;
