/**
 * @medina/multi-engine-orchestrator — Inference Pipeline
 *
 * Multi-stage inference pipeline that chains engines together for
 * complex task execution. Supports sequential, parallel, and
 * conditional branching patterns.
 *
 * @module @medina/multi-engine-orchestrator/inference-pipeline
 */

import crypto from 'node:crypto';

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE STAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const STAGE_TYPES = {
  INFERENCE: 'inference',
  TRANSFORM: 'transform',
  FILTER: 'filter',
  AGGREGATE: 'aggregate',
  BRANCH: 'branch',
  PARALLEL: 'parallel',
  VALIDATE: 'validate',
};

// ═══════════════════════════════════════════════════════════════════════════════
// INFERENCE PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

export class InferencePipeline {
  constructor(config = {}) {
    this.id = config.id || crypto.randomUUID();
    this.name = config.name || 'default-pipeline';
    this.stages = [];
    this.executionHistory = [];
    this.maxRetries = config.maxRetries || 3;
    this.timeoutMs = config.timeoutMs || 60000;
  }

  /**
   * Adds a stage to the pipeline.
   */
  addStage(stage) {
    const normalizedStage = {
      id: stage.id || crypto.randomUUID(),
      name: stage.name || `stage-${this.stages.length}`,
      type: stage.type || STAGE_TYPES.INFERENCE,
      engineClass: stage.engineClass,
      engineId: stage.engineId,
      capabilities: stage.capabilities || [],
      transform: stage.transform || null,
      condition: stage.condition || null,
      config: stage.config || {},
      retries: stage.retries || this.maxRetries,
      timeoutMs: stage.timeoutMs || this.timeoutMs,
    };

    this.stages.push(normalizedStage);
    return this;
  }

  /**
   * Executes the pipeline with given input.
   * @param {object} input - The input data
   * @param {object} context - Execution context (router, pool, etc.)
   */
  async execute(input, context = {}) {
    const execution = {
      id: crypto.randomUUID(),
      pipelineId: this.id,
      startedAt: Date.now(),
      input,
      stages: [],
      status: 'running',
    };

    let currentData = input;

    for (const stage of this.stages) {
      const stageResult = await this._executeStage(stage, currentData, context);
      execution.stages.push(stageResult);

      if (stageResult.status === 'failed') {
        execution.status = 'failed';
        execution.error = stageResult.error;
        execution.completedAt = Date.now();
        execution.duration = execution.completedAt - execution.startedAt;
        this.executionHistory.push(execution);
        return execution;
      }

      currentData = stageResult.output;
    }

    execution.status = 'completed';
    execution.output = currentData;
    execution.completedAt = Date.now();
    execution.duration = execution.completedAt - execution.startedAt;
    this.executionHistory.push(execution);
    return execution;
  }

  async _executeStage(stage, input, context) {
    const stageExecution = {
      stageId: stage.id,
      stageName: stage.name,
      type: stage.type,
      startedAt: Date.now(),
      retries: 0,
    };

    // Check condition
    if (stage.condition && !stage.condition(input)) {
      stageExecution.status = 'skipped';
      stageExecution.output = input;
      stageExecution.completedAt = Date.now();
      return stageExecution;
    }

    for (let attempt = 0; attempt <= stage.retries; attempt++) {
      try {
        let output;

        switch (stage.type) {
          case STAGE_TYPES.TRANSFORM:
            output = stage.transform ? stage.transform(input) : input;
            break;

          case STAGE_TYPES.FILTER:
            output = stage.transform ? stage.transform(input) : input;
            break;

          case STAGE_TYPES.AGGREGATE:
            output = Array.isArray(input) ? { aggregated: input, count: input.length } : input;
            break;

          case STAGE_TYPES.VALIDATE:
            const isValid = stage.config.validator ? stage.config.validator(input) : true;
            if (!isValid) throw new Error(`Validation failed at stage ${stage.name}`);
            output = input;
            break;

          case STAGE_TYPES.PARALLEL:
            output = await this._executeParallel(stage, input, context);
            break;

          case STAGE_TYPES.INFERENCE:
          default:
            output = await this._executeInference(stage, input, context);
            break;
        }

        stageExecution.status = 'completed';
        stageExecution.output = output;
        stageExecution.completedAt = Date.now();
        stageExecution.duration = stageExecution.completedAt - stageExecution.startedAt;
        return stageExecution;

      } catch (error) {
        stageExecution.retries = attempt + 1;
        if (attempt >= stage.retries) {
          stageExecution.status = 'failed';
          stageExecution.error = error.message;
          stageExecution.completedAt = Date.now();
          return stageExecution;
        }
        // Exponential backoff with PHI multiplier
        await this._delay(Math.pow(PHI, attempt) * 100);
      }
    }

    return stageExecution;
  }

  async _executeInference(stage, input, context) {
    // Route to engine via context router
    if (context.router) {
      const route = context.router.route({
        requiredClass: stage.engineClass,
        requiredCapabilities: stage.capabilities,
      });

      if (!route.success) {
        throw new Error(`No engine available for stage ${stage.name}: ${route.reason}`);
      }

      // Simulate inference execution
      return {
        engineId: route.engineId,
        engineClass: route.engineClass,
        input,
        inference: {
          processed: true,
          stage: stage.name,
          timestamp: Date.now()
        }
      };
    }

    // Fallback: pass-through
    return { ...input, _processedBy: stage.name };
  }

  async _executeParallel(stage, input, context) {
    const subStages = stage.config.stages || [];
    const results = await Promise.all(
      subStages.map(sub => this._executeStage(sub, input, context))
    );
    return results.map(r => r.output);
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Returns pipeline execution metrics.
   */
  getMetrics() {
    const recent = this.executionHistory.slice(-100);
    return {
      pipelineId: this.id,
      name: this.name,
      stages: this.stages.length,
      totalExecutions: this.executionHistory.length,
      successRate: recent.length > 0
        ? recent.filter(e => e.status === 'completed').length / recent.length
        : 0,
      averageDuration: recent.length > 0
        ? recent.reduce((s, e) => s + (e.duration || 0), 0) / recent.length
        : 0,
    };
  }
}
