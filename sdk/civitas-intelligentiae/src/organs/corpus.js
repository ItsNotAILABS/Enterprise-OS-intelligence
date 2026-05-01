/**
 * CORPUS — The Body of the Civilization
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Latin: CORPUS (body, substance, the physical)
 * 
 * CORPUS is the execution engine of the AI civilization. It:
 *   - Receives commands from ANIMUS (the mind)
 *   - Executes actions in the physical/digital world
 *   - Manages all output operations
 *   - Coordinates with external systems
 *
 * CORPUS runs AUTONOMOUSLY, constantly processing the execution queue.
 *
 * Theory basis:
 *   Paper X  — EXECUTIO UNIVERSALIS: one operation: query, act, learn, log
 *   Paper IV — DOCTRINA VOXIS: sovereign compute units
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ══════════════════════════════════════════════════════════════════════════════
// CORPUS — THE BODY
// ══════════════════════════════════════════════════════════════════════════════

export class CORPUS extends EventEmitter {
  /**
   * @param {object} options
   * @param {object} options.chrono - CHRONO instance for logging
   * @param {object} options.nexoris - NEXORIS instance for routing
   * @param {number} [options.executeIntervalMs=50] - How often CORPUS executes (ms)
   */
  constructor({ chrono, nexoris, executeIntervalMs = 50 }) {
    super();
    
    /** @type {string} */
    this.name = 'CORPUS';
    
    /** @type {string} */
    this.latinMeaning = 'The Body, Substance, Physical Form';
    
    /** @type {object} */
    this._chrono = chrono;
    
    /** @type {object} */
    this._nexoris = nexoris;
    
    /** @type {number} */
    this._executeIntervalMs = executeIntervalMs;
    
    /** @type {boolean} */
    this._alive = false;
    
    /** @type {NodeJS.Timer|null} */
    this._executeLoop = null;
    
    /** @type {Array} Queue of actions to execute */
    this._executionQueue = [];
    
    /** @type {Map} Registered action handlers */
    this._actionHandlers = new Map();
    
    /** @type {Map} Active executions */
    this._activeExecutions = new Map();
    
    /** @type {object} Body state */
    this._bodyState = {
      energy: 1.0,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      lastExecution: null,
    };
    
    // Register default action handlers
    this._registerDefaultHandlers();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Awaken CORPUS — start the autonomous execution loop.
   */
  awaken() {
    if (this._alive) return { awakened: false, message: 'Already alive' };
    
    this._alive = true;
    this._log('CORPUS_AWAKENED', { executeIntervalMs: this._executeIntervalMs });
    
    // Start the autonomous execution loop
    this._executeLoop = setInterval(() => this._execute(), this._executeIntervalMs);
    
    this.emit('awakened', { organ: 'CORPUS' });
    
    return { awakened: true, organ: 'CORPUS' };
  }

  /**
   * Put CORPUS to sleep.
   */
  sleep() {
    if (!this._alive) return { sleeping: false, message: 'Already sleeping' };
    
    this._alive = false;
    if (this._executeLoop) {
      clearInterval(this._executeLoop);
      this._executeLoop = null;
    }
    
    this._log('CORPUS_SLEEPING', { executionCount: this._bodyState.executionCount });
    this.emit('sleeping', { organ: 'CORPUS' });
    
    return { sleeping: true, organ: 'CORPUS', totalExecutions: this._bodyState.executionCount };
  }

  /**
   * Check if CORPUS is alive.
   */
  isAlive() {
    return this._alive;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ACTION EXECUTION
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Queue an action for execution.
   * 
   * @param {object} action
   * @param {string} action.type - Action type (must have registered handler)
   * @param {object} action.payload - Action payload
   * @param {number} [action.priority=5] - Priority (1-10)
   * @returns {{ queued: boolean, actionId: string }}
   */
  queueAction(action) {
    const actionId = `ACTION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem = {
      actionId,
      type: action.type,
      payload: action.payload,
      priority: action.priority || 5,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    };
    
    // Insert by priority
    const insertIndex = this._executionQueue.findIndex(q => q.priority < queueItem.priority);
    if (insertIndex === -1) {
      this._executionQueue.push(queueItem);
    } else {
      this._executionQueue.splice(insertIndex, 0, queueItem);
    }
    
    this._log('ACTION_QUEUED', { actionId, type: action.type, priority: action.priority });
    
    return { queued: true, actionId };
  }

  /**
   * Execute an action immediately (bypass queue).
   * 
   * @param {object} action
   * @param {string} action.type - Action type
   * @param {object} action.payload - Action payload
   * @returns {Promise<object>} Execution result
   */
  async executeNow(action) {
    const actionId = `IMMEDIATE-${Date.now()}`;
    
    const handler = this._actionHandlers.get(action.type);
    if (!handler) {
      return { executed: false, error: `No handler for action type: ${action.type}` };
    }
    
    try {
      const result = await handler(action.payload);
      this._bodyState.executionCount++;
      this._bodyState.successCount++;
      
      this._log('ACTION_EXECUTED', { actionId, type: action.type, success: true });
      this.emit('action_executed', { actionId, type: action.type, result });
      
      return { executed: true, actionId, result };
    } catch (error) {
      this._bodyState.executionCount++;
      this._bodyState.failureCount++;
      
      this._log('ACTION_FAILED', { actionId, type: action.type, error: error.message });
      this.emit('action_failed', { actionId, type: action.type, error: error.message });
      
      return { executed: false, actionId, error: error.message };
    }
  }

  /**
   * Register an action handler.
   * 
   * @param {string} actionType - Type of action
   * @param {function} handler - Async function to handle the action
   */
  registerHandler(actionType, handler) {
    this._actionHandlers.set(actionType, handler);
    this._log('HANDLER_REGISTERED', { actionType });
    return this;
  }

  /**
   * Generate an artifact (documents, reports, data structures).
   * 
   * @param {object} spec
   * @param {string} spec.type - Artifact type
   * @param {object} spec.data - Data for the artifact
   * @param {string} [spec.format='json'] - Output format
   * @returns {{ generated: boolean, artifactId: string, artifact: any }}
   */
  generateArtifact(spec) {
    const artifactId = `ARTIFACT-${Date.now()}`;
    
    let artifact = null;
    
    switch (spec.type) {
      case 'REPORT':
        artifact = this._generateReport(spec.data, spec.format);
        break;
      case 'DOCUMENT':
        artifact = this._generateDocument(spec.data, spec.format);
        break;
      case 'DATA_STRUCTURE':
        artifact = this._generateDataStructure(spec.data);
        break;
      case 'FLOW':
        artifact = this._generateFlow(spec.data);
        break;
      default:
        artifact = { type: spec.type, data: spec.data, generatedAt: new Date().toISOString() };
    }
    
    this._log('ARTIFACT_GENERATED', { artifactId, type: spec.type });
    this.emit('artifact_generated', { artifactId, type: spec.type, artifact });
    
    return { generated: true, artifactId, artifact };
  }

  /**
   * Get body state.
   */
  getBodyState() {
    return {
      ...this._bodyState,
      queueLength: this._executionQueue.length,
      activeExecutions: this._activeExecutions.size,
      registeredHandlers: this._actionHandlers.size,
      isAlive: this._alive,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE — AUTONOMOUS EXECUTION LOOP
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * The core execution function — runs autonomously.
   * @private
   */
  async _execute() {
    if (!this._alive) return;
    
    // Process execution queue
    if (this._executionQueue.length > 0) {
      const item = this._executionQueue.shift();
      await this._processAction(item);
    }
    
    // Update body state
    this._bodyState.lastExecution = new Date().toISOString();
    
    // Energy management (recover slowly)
    if (this._bodyState.energy < 1.0) {
      this._bodyState.energy = Math.min(1.0, this._bodyState.energy + 0.001);
    }
    
    // Emit heartbeat every 200 executions
    if (this._bodyState.executionCount % 200 === 0 && this._bodyState.executionCount > 0) {
      this.emit('heartbeat', { organ: 'CORPUS', executionCount: this._bodyState.executionCount });
    }
  }

  /**
   * Process a single action from the queue.
   * @private
   */
  async _processAction(item) {
    item.status = 'executing';
    item.startedAt = new Date().toISOString();
    
    this._activeExecutions.set(item.actionId, item);
    
    const handler = this._actionHandlers.get(item.type);
    
    if (!handler) {
      item.status = 'failed';
      item.error = `No handler for: ${item.type}`;
      this._bodyState.failureCount++;
    } else {
      try {
        item.result = await handler(item.payload);
        item.status = 'completed';
        this._bodyState.successCount++;
      } catch (error) {
        item.status = 'failed';
        item.error = error.message;
        this._bodyState.failureCount++;
      }
    }
    
    item.completedAt = new Date().toISOString();
    this._bodyState.executionCount++;
    this._activeExecutions.delete(item.actionId);
    
    this._log('ACTION_PROCESSED', { actionId: item.actionId, type: item.type, status: item.status });
    this.emit('action_processed', { actionId: item.actionId, status: item.status, result: item.result });
  }

  /**
   * Register default action handlers.
   * @private
   */
  _registerDefaultHandlers() {
    // WRITE handler — write data somewhere
    this.registerHandler('WRITE', async (payload) => {
      return { written: true, target: payload.target, size: JSON.stringify(payload.data).length };
    });
    
    // READ handler — read data from somewhere
    this.registerHandler('READ', async (payload) => {
      return { read: true, source: payload.source, data: {} };
    });
    
    // TRANSFORM handler — transform data
    this.registerHandler('TRANSFORM', async (payload) => {
      return { transformed: true, from: payload.from, to: payload.to };
    });
    
    // SEND handler — send message/data
    this.registerHandler('SEND', async (payload) => {
      return { sent: true, to: payload.to, message: payload.message };
    });
    
    // COMPUTE handler — perform computation
    this.registerHandler('COMPUTE', async (payload) => {
      // Simulate computation
      return { computed: true, result: payload.expression || 'computed' };
    });
  }

  /**
   * Generate a report artifact.
   * @private
   */
  _generateReport(data, format = 'json') {
    return {
      type: 'REPORT',
      generatedAt: new Date().toISOString(),
      generatedBy: 'CORPUS',
      format,
      content: data,
      metadata: {
        sections: Object.keys(data).length,
        format,
      },
    };
  }

  /**
   * Generate a document artifact.
   * @private
   */
  _generateDocument(data, format = 'json') {
    return {
      type: 'DOCUMENT',
      generatedAt: new Date().toISOString(),
      generatedBy: 'CORPUS',
      format,
      content: data,
      metadata: {
        title: data.title || 'Untitled',
        format,
      },
    };
  }

  /**
   * Generate a data structure artifact.
   * @private
   */
  _generateDataStructure(data) {
    return {
      type: 'DATA_STRUCTURE',
      generatedAt: new Date().toISOString(),
      generatedBy: 'CORPUS',
      structure: data,
      metadata: {
        fields: Object.keys(data).length,
      },
    };
  }

  /**
   * Generate a flow artifact.
   * @private
   */
  _generateFlow(data) {
    return {
      type: 'FLOW',
      generatedAt: new Date().toISOString(),
      generatedBy: 'CORPUS',
      flow: data,
      metadata: {
        steps: data.steps?.length || 0,
        name: data.name || 'Unnamed Flow',
      },
    };
  }

  /**
   * Log to CHRONO.
   * @private
   */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({ type, organ: 'CORPUS', ...data, timestamp: new Date().toISOString() });
    }
  }
}
