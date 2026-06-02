/**
 * @medina/multi-engine-orchestrator — Engine Registry
 *
 * Central registry of all available AI engines. Each engine is registered
 * with its capabilities, resource requirements, latency profile, and
 * sovereign cycle cost. The registry supports hot-swap of engine versions.
 *
 * @module @medina/multi-engine-orchestrator/engine-registry
 */

import crypto from 'node:crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE CLASS DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const ENGINE_CLASSES = {
  REASONING: 'reasoning',
  CREATIVE: 'creative',
  ANALYTICAL: 'analytical',
  OPERATIONAL: 'operational',
  SOVEREIGN: 'sovereign',
  VISION: 'vision',
  LANGUAGE: 'language',
  CODE: 'code',
  MULTIMODAL: 'multimodal',
};

export const ENGINE_STATES = {
  IDLE: 'idle',
  ACTIVE: 'active',
  WARMING: 'warming',
  COOLING: 'cooling',
  FAILED: 'failed',
  MAINTENANCE: 'maintenance',
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

export class EngineRegistry {
  constructor() {
    /** @type {Map<string, EngineDefinition>} */
    this.engines = new Map();
    /** @type {Map<string, string[]>} class → engine IDs */
    this.classIndex = new Map();
    /** @type {Map<string, string[]>} capability → engine IDs */
    this.capabilityIndex = new Map();
  }

  /**
   * Registers a new engine in the system.
   * @param {EngineDefinition} definition
   */
  register(definition) {
    const engine = {
      id: definition.id || crypto.randomUUID(),
      name: definition.name,
      class: definition.class,
      version: definition.version || '1.0.0',
      provider: definition.provider || 'internal',
      capabilities: definition.capabilities || [],
      taskTypes: definition.taskTypes || [],
      latencyMs: definition.latencyMs || 1000,
      throughput: definition.throughput || 100, // tokens/sec
      maxConcurrency: definition.maxConcurrency || 8,
      cycleCost: definition.cycleCost || 32,
      reliability: definition.reliability || 0.95,
      securityLevel: definition.securityLevel || 'standard',
      state: ENGINE_STATES.IDLE,
      registeredAt: Date.now(),
      metadata: definition.metadata || {},
    };

    this.engines.set(engine.id, engine);

    // Update class index
    if (!this.classIndex.has(engine.class)) {
      this.classIndex.set(engine.class, []);
    }
    this.classIndex.get(engine.class).push(engine.id);

    // Update capability index
    for (const cap of engine.capabilities) {
      if (!this.capabilityIndex.has(cap)) {
        this.capabilityIndex.set(cap, []);
      }
      this.capabilityIndex.get(cap).push(engine.id);
    }

    return engine;
  }

  /**
   * Finds engines matching a query.
   */
  find(query = {}) {
    let candidates = [...this.engines.values()];

    if (query.class) {
      candidates = candidates.filter(e => e.class === query.class);
    }
    if (query.capability) {
      candidates = candidates.filter(e => e.capabilities.includes(query.capability));
    }
    if (query.taskType) {
      candidates = candidates.filter(e => e.taskTypes.includes(query.taskType));
    }
    if (query.maxLatency) {
      candidates = candidates.filter(e => e.latencyMs <= query.maxLatency);
    }
    if (query.minReliability) {
      candidates = candidates.filter(e => e.reliability >= query.minReliability);
    }
    if (query.securityLevel) {
      candidates = candidates.filter(e => e.securityLevel === query.securityLevel);
    }
    if (query.state) {
      candidates = candidates.filter(e => e.state === query.state);
    }

    return candidates;
  }

  /**
   * Gets engine by ID.
   */
  get(engineId) {
    return this.engines.get(engineId) || null;
  }

  /**
   * Updates engine state.
   */
  setState(engineId, state) {
    const engine = this.engines.get(engineId);
    if (engine) {
      engine.state = state;
      engine.lastStateChange = Date.now();
    }
    return engine;
  }

  /**
   * Returns all registered engines.
   */
  list() {
    return [...this.engines.values()];
  }

  /**
   * Returns engines grouped by class.
   */
  byClass() {
    const grouped = {};
    for (const [cls, ids] of this.classIndex) {
      grouped[cls] = ids.map(id => this.engines.get(id));
    }
    return grouped;
  }

  /**
   * Returns registry stats.
   */
  stats() {
    const engines = [...this.engines.values()];
    return {
      total: engines.length,
      byClass: Object.fromEntries(
        [...this.classIndex.entries()].map(([k, v]) => [k, v.length])
      ),
      byState: engines.reduce((acc, e) => {
        acc[e.state] = (acc[e.state] || 0) + 1;
        return acc;
      }, {}),
      averageLatency: engines.length > 0
        ? engines.reduce((s, e) => s + e.latencyMs, 0) / engines.length
        : 0,
      averageReliability: engines.length > 0
        ? engines.reduce((s, e) => s + e.reliability, 0) / engines.length
        : 0,
    };
  }
}
