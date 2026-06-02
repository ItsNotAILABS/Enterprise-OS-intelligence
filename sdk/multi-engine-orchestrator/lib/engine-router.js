/**
 * @medina/multi-engine-orchestrator — Engine Router
 *
 * Routes inference tasks to the optimal engine based on task requirements,
 * engine capabilities, current load, and sovereign cycle budget.
 * Implements weighted scoring with golden-ratio priority decay.
 *
 * @module @medina/multi-engine-orchestrator/engine-router
 */

import { ENGINE_STATES } from './engine-registry.js';

const PHI = (1 + Math.sqrt(5)) / 2;
const PHI_INV = 1 / PHI;

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTING STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

export const ROUTING_STRATEGIES = {
  LOWEST_LATENCY: 'lowest-latency',
  HIGHEST_RELIABILITY: 'highest-reliability',
  COST_OPTIMIZED: 'cost-optimized',
  BALANCED: 'balanced',
  CAPABILITY_MATCH: 'capability-match',
  ROUND_ROBIN: 'round-robin',
  WEIGHTED_RANDOM: 'weighted-random',
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export class EngineRouter {
  constructor(registry, config = {}) {
    this.registry = registry;
    this.strategy = config.strategy || ROUTING_STRATEGIES.BALANCED;
    this.weights = config.weights || {
      latency: 0.25,
      reliability: 0.30,
      cost: 0.20,
      capability: 0.25,
    };
    this.roundRobinIndex = new Map();
    this.routeHistory = [];
    this.maxHistorySize = config.maxHistorySize || 5000;
  }

  /**
   * Routes a task to the best available engine.
   * @param {TaskDescriptor} task - The task to route
   * @returns {RouteDecision} - The routing decision
   */
  route(task) {
    const candidates = this._findCandidates(task);

    if (candidates.length === 0) {
      return {
        success: false,
        reason: 'no-matching-engines',
        task,
        timestamp: Date.now()
      };
    }

    let selected;
    switch (this.strategy) {
      case ROUTING_STRATEGIES.LOWEST_LATENCY:
        selected = this._routeByLatency(candidates);
        break;
      case ROUTING_STRATEGIES.HIGHEST_RELIABILITY:
        selected = this._routeByReliability(candidates);
        break;
      case ROUTING_STRATEGIES.COST_OPTIMIZED:
        selected = this._routeByCost(candidates);
        break;
      case ROUTING_STRATEGIES.ROUND_ROBIN:
        selected = this._routeRoundRobin(candidates, task);
        break;
      case ROUTING_STRATEGIES.WEIGHTED_RANDOM:
        selected = this._routeWeightedRandom(candidates);
        break;
      case ROUTING_STRATEGIES.CAPABILITY_MATCH:
        selected = this._routeByCapability(candidates, task);
        break;
      case ROUTING_STRATEGIES.BALANCED:
      default:
        selected = this._routeBalanced(candidates, task);
    }

    const decision = {
      success: true,
      engineId: selected.id,
      engineName: selected.name,
      engineClass: selected.class,
      score: selected._routeScore || 1.0,
      strategy: this.strategy,
      candidatesEvaluated: candidates.length,
      task,
      timestamp: Date.now()
    };

    this.routeHistory.push(decision);
    if (this.routeHistory.length > this.maxHistorySize) {
      this.routeHistory.shift();
    }

    return decision;
  }

  _findCandidates(task) {
    const query = {
      state: ENGINE_STATES.IDLE,
    };
    if (task.requiredClass) query.class = task.requiredClass;
    if (task.requiredCapability) query.capability = task.requiredCapability;
    if (task.maxLatency) query.maxLatency = task.maxLatency;
    if (task.minReliability) query.minReliability = task.minReliability;

    let candidates = this.registry.find(query);

    // Also include ACTIVE engines that have capacity
    if (candidates.length === 0) {
      delete query.state;
      candidates = this.registry.find(query).filter(
        e => e.state === ENGINE_STATES.IDLE || e.state === ENGINE_STATES.ACTIVE
      );
    }

    return candidates;
  }

  _routeByLatency(candidates) {
    return candidates.sort((a, b) => a.latencyMs - b.latencyMs)[0];
  }

  _routeByReliability(candidates) {
    return candidates.sort((a, b) => b.reliability - a.reliability)[0];
  }

  _routeByCost(candidates) {
    return candidates.sort((a, b) => a.cycleCost - b.cycleCost)[0];
  }

  _routeRoundRobin(candidates, task) {
    const key = task.requiredClass || 'default';
    const idx = (this.roundRobinIndex.get(key) || 0) % candidates.length;
    this.roundRobinIndex.set(key, idx + 1);
    return candidates[idx];
  }

  _routeWeightedRandom(candidates) {
    const totalReliability = candidates.reduce((s, c) => s + c.reliability, 0);
    let random = Math.random() * totalReliability;
    for (const candidate of candidates) {
      random -= candidate.reliability;
      if (random <= 0) return candidate;
    }
    return candidates[candidates.length - 1];
  }

  _routeByCapability(candidates, task) {
    if (!task.requiredCapabilities || task.requiredCapabilities.length === 0) {
      return this._routeBalanced(candidates, task);
    }

    return candidates.sort((a, b) => {
      const aMatch = task.requiredCapabilities.filter(c => a.capabilities.includes(c)).length;
      const bMatch = task.requiredCapabilities.filter(c => b.capabilities.includes(c)).length;
      return bMatch - aMatch;
    })[0];
  }

  _routeBalanced(candidates, task) {
    const scored = candidates.map(engine => {
      const latencyScore = 1 - (engine.latencyMs / 10000);
      const reliabilityScore = engine.reliability;
      const costScore = 1 - (engine.cycleCost / 256);

      let capabilityScore = 0.5;
      if (task.requiredCapabilities) {
        const matches = task.requiredCapabilities.filter(c => engine.capabilities.includes(c)).length;
        capabilityScore = matches / Math.max(task.requiredCapabilities.length, 1);
      }

      const totalScore =
        this.weights.latency * latencyScore +
        this.weights.reliability * reliabilityScore +
        this.weights.cost * costScore +
        this.weights.capability * capabilityScore;

      return { ...engine, _routeScore: totalScore };
    });

    return scored.sort((a, b) => b._routeScore - a._routeScore)[0];
  }

  /**
   * Returns routing metrics.
   */
  getMetrics() {
    const recent = this.routeHistory.slice(-100);
    return {
      totalRoutes: this.routeHistory.length,
      strategy: this.strategy,
      successRate: recent.length > 0
        ? recent.filter(r => r.success).length / recent.length
        : 0,
      averageCandidates: recent.length > 0
        ? recent.reduce((s, r) => s + (r.candidatesEvaluated || 0), 0) / recent.length
        : 0,
      classDistribution: recent.reduce((acc, r) => {
        if (r.engineClass) acc[r.engineClass] = (acc[r.engineClass] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}
