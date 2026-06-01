/**
 * @medina/multi-engine-orchestrator
 *
 * Sovereign Multi-Engine Orchestration System
 * Routes, manages, and monitors multiple AI engine classes:
 * - Reasoning Engines (deep logic, theorem proving, causal inference)
 * - Creative Engines (generation, synthesis, artistic composition)
 * - Analytical Engines (data processing, statistical modeling, pattern detection)
 * - Operational Engines (workflow automation, scheduling, resource management)
 * - Sovereign Engines (self-governance, cycle management, organism control)
 * - Vision Engines (image understanding, spatial reasoning)
 * - Language Engines (NLP, translation, summarization)
 * - Code Engines (generation, review, refactoring)
 * - Multimodal Engines (cross-modal reasoning, fusion)
 *
 * @module @medina/multi-engine-orchestrator
 */

import { EngineRegistry, ENGINE_CLASSES, ENGINE_STATES } from './engine-registry.js';
import { EngineRouter, ROUTING_STRATEGIES } from './engine-router.js';
import { EnginePool } from './engine-pool.js';
import { InferencePipeline, STAGE_TYPES } from './inference-pipeline.js';
import { FailoverController } from './failover-controller.js';
import { MetricsCollector } from './metrics-collector.js';
import crypto from 'node:crypto';

// Re-export all modules
export {
  EngineRegistry,
  EngineRouter,
  EnginePool,
  InferencePipeline,
  FailoverController,
  MetricsCollector,
  ENGINE_CLASSES,
  ENGINE_STATES,
  ROUTING_STRATEGIES,
  STAGE_TYPES,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-ENGINE ORCHESTRATOR (Top-Level Facade)
// ═══════════════════════════════════════════════════════════════════════════════

export class MultiEngineOrchestrator {
  constructor(config = {}) {
    this.registry = new EngineRegistry();
    this.router = new EngineRouter(this.registry, config.routing);
    this.failover = new FailoverController(this.registry, config.failover);
    this.metrics = new MetricsCollector(config.metrics);
    this.pools = new Map();
    this.pipelines = new Map();

    // Register default engines if provided
    if (config.engines) {
      for (const engine of config.engines) {
        this.registry.register(engine);
      }
    }
  }

  /**
   * Dispatches a task to the best available engine.
   */
  async dispatch(task) {
    const startTime = Date.now();
    this.metrics.increment('tasks.dispatched');

    // Route task
    const route = this.router.route(task);
    if (!route.success) {
      this.metrics.increment('tasks.routing_failed');
      return { success: false, error: route.reason };
    }

    // Check failover availability
    if (!this.failover.isAvailable(route.engineId)) {
      const failoverTarget = this.failover._getFailoverTarget(route.engineId);
      if (failoverTarget) {
        route.engineId = failoverTarget.id;
        route.engineName = failoverTarget.name;
        this.metrics.increment('tasks.failover');
      } else {
        this.metrics.increment('tasks.no_available_engine');
        return { success: false, error: 'all-engines-unavailable' };
      }
    }

    // Execute (simulation — real engines would have actual inference)
    const result = {
      success: true,
      taskId: task.id || crypto.randomUUID(),
      engineId: route.engineId,
      engineName: route.engineName,
      engineClass: route.engineClass,
      startTime,
      endTime: Date.now(),
      latency: Date.now() - startTime,
    };

    // Record metrics
    this.metrics.record('engine.latency', result.latency, { engine: route.engineId });
    this.metrics.increment('tasks.completed');
    this.failover.recordSuccess(route.engineId);

    return result;
  }

  /**
   * Creates and registers a new engine pool.
   */
  createPool(name, config = {}) {
    const pool = new EnginePool({ name, ...config });
    this.pools.set(name, pool);
    return pool;
  }

  /**
   * Creates a new inference pipeline.
   */
  createPipeline(name, config = {}) {
    const pipeline = new InferencePipeline({ name, ...config });
    this.pipelines.set(name, pipeline);
    return pipeline;
  }

  /**
   * Returns full system status.
   */
  getStatus() {
    return {
      registry: this.registry.stats(),
      routing: this.router.getMetrics(),
      health: this.failover.getHealthReport(),
      pools: [...this.pools.entries()].map(([name, pool]) => ({
        name,
        ...pool.getUtilization()
      })),
      pipelines: [...this.pipelines.entries()].map(([name, pipeline]) => ({
        name,
        ...pipeline.getMetrics()
      })),
      metrics: this.metrics.getDashboard(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY: Create default multi-engine stack
// ═══════════════════════════════════════════════════════════════════════════════

export function createDefaultMultiEngineStack() {
  const orchestrator = new MultiEngineOrchestrator({
    engines: [
      // Reasoning Engines
      {
        id: 'reasoning-primary',
        name: 'Sovereign Reasoner',
        class: ENGINE_CLASSES.REASONING,
        capabilities: ['logic', 'theorem-proving', 'causal-inference', 'planning'],
        taskTypes: ['reasoning', 'analysis', 'decision'],
        latencyMs: 2000,
        throughput: 50,
        cycleCost: 128,
        reliability: 0.97,
        securityLevel: 'sovereign',
      },
      {
        id: 'reasoning-fast',
        name: 'Fast Reasoner',
        class: ENGINE_CLASSES.REASONING,
        capabilities: ['logic', 'planning', 'quick-inference'],
        taskTypes: ['reasoning', 'classification'],
        latencyMs: 400,
        throughput: 200,
        cycleCost: 32,
        reliability: 0.93,
        securityLevel: 'hardened',
      },

      // Creative Engines
      {
        id: 'creative-primary',
        name: 'Creative Synthesizer',
        class: ENGINE_CLASSES.CREATIVE,
        capabilities: ['generation', 'synthesis', 'composition', 'ideation'],
        taskTypes: ['creative', 'generation', 'writing'],
        latencyMs: 3000,
        throughput: 80,
        cycleCost: 96,
        reliability: 0.92,
        securityLevel: 'standard',
      },
      {
        id: 'creative-visual',
        name: 'Visual Creator',
        class: ENGINE_CLASSES.CREATIVE,
        capabilities: ['image-generation', 'design', 'layout-synthesis'],
        taskTypes: ['creative', 'visual', 'design'],
        latencyMs: 5000,
        throughput: 30,
        cycleCost: 160,
        reliability: 0.89,
        securityLevel: 'standard',
      },

      // Analytical Engines
      {
        id: 'analytical-primary',
        name: 'Deep Analyst',
        class: ENGINE_CLASSES.ANALYTICAL,
        capabilities: ['statistics', 'pattern-detection', 'anomaly-detection', 'forecasting'],
        taskTypes: ['analysis', 'data-processing', 'reporting'],
        latencyMs: 1500,
        throughput: 120,
        cycleCost: 64,
        reliability: 0.96,
        securityLevel: 'hardened',
      },
      {
        id: 'analytical-realtime',
        name: 'Realtime Analyst',
        class: ENGINE_CLASSES.ANALYTICAL,
        capabilities: ['streaming-analysis', 'alerting', 'monitoring'],
        taskTypes: ['analysis', 'monitoring', 'alerting'],
        latencyMs: 100,
        throughput: 1000,
        cycleCost: 16,
        reliability: 0.99,
        securityLevel: 'standard',
      },

      // Operational Engines
      {
        id: 'operational-primary',
        name: 'Operations Controller',
        class: ENGINE_CLASSES.OPERATIONAL,
        capabilities: ['workflow', 'scheduling', 'resource-management', 'orchestration'],
        taskTypes: ['workflow', 'ops', 'automation'],
        latencyMs: 500,
        throughput: 300,
        cycleCost: 32,
        reliability: 0.98,
        securityLevel: 'hardened',
      },

      // Sovereign Engine
      {
        id: 'sovereign-core',
        name: 'Sovereign Core',
        class: ENGINE_CLASSES.SOVEREIGN,
        capabilities: ['self-governance', 'cycle-management', 'organism-control', 'meta-reasoning'],
        taskTypes: ['governance', 'meta', 'control'],
        latencyMs: 800,
        throughput: 50,
        cycleCost: 256,
        reliability: 0.999,
        securityLevel: 'sovereign',
      },

      // Code Engine
      {
        id: 'code-primary',
        name: 'Code Intelligence',
        class: ENGINE_CLASSES.CODE,
        capabilities: ['code-generation', 'code-review', 'refactoring', 'bug-detection'],
        taskTypes: ['coding', 'review', 'generation'],
        latencyMs: 1200,
        throughput: 150,
        cycleCost: 48,
        reliability: 0.94,
        securityLevel: 'hardened',
      },

      // Language Engine
      {
        id: 'language-primary',
        name: 'Language Processor',
        class: ENGINE_CLASSES.LANGUAGE,
        capabilities: ['nlp', 'translation', 'summarization', 'sentiment'],
        taskTypes: ['language', 'translation', 'summarization'],
        latencyMs: 600,
        throughput: 250,
        cycleCost: 24,
        reliability: 0.95,
        securityLevel: 'standard',
      },

      // Multimodal Engine
      {
        id: 'multimodal-primary',
        name: 'Multimodal Fusion',
        class: ENGINE_CLASSES.MULTIMODAL,
        capabilities: ['cross-modal', 'vision-language', 'audio-text', 'sensor-fusion'],
        taskTypes: ['multimodal', 'fusion', 'understanding'],
        latencyMs: 2500,
        throughput: 60,
        cycleCost: 192,
        reliability: 0.91,
        securityLevel: 'hardened',
      },
    ],
    routing: {
      strategy: ROUTING_STRATEGIES.BALANCED,
    },
  });

  // Register failover chains
  orchestrator.failover.registerFailoverChain(ENGINE_CLASSES.REASONING, ['reasoning-primary', 'reasoning-fast']);
  orchestrator.failover.registerFailoverChain(ENGINE_CLASSES.CREATIVE, ['creative-primary', 'creative-visual']);
  orchestrator.failover.registerFailoverChain(ENGINE_CLASSES.ANALYTICAL, ['analytical-primary', 'analytical-realtime']);

  // Create default pools
  orchestrator.createPool('reasoning-pool', { minInstances: 2, maxInstances: 8 });
  orchestrator.createPool('creative-pool', { minInstances: 1, maxInstances: 4 });
  orchestrator.createPool('operational-pool', { minInstances: 2, maxInstances: 16 });

  return orchestrator;
}
