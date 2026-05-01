/**
 * CIVITAS RUNTIME — The Autonomous Living Substrate
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Latin: CIVITAS (citizenship, city, state, civilization)
 * 
 * This is the RUNTIME that brings the entire AI civilization to life.
 * It awakens all organs and agents, keeps them running, coordinates them,
 * and provides the interface for external systems to interact.
 *
 * The civilization runs AUTONOMOUSLY — once awakened, it continues operating
 * without external intervention, generating artifacts, answering queries,
 * healing itself, and learning continuously.
 *
 * Theory basis:
 *   Paper I   — SUBSTRATE VIVENS: living compute
 *   Paper IX  — COHORS MENTIS: autonomous cognitive units
 *   Paper XX  — STIGMERGY: coordination through the field
 *   Paper XXI — QUORUM: decisions without authority
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// Import organs
import { ANIMUS } from '../organs/animus.js';
import { CORPUS } from '../organs/corpus.js';
import { SENSUS } from '../organs/sensus.js';
import { MEMORIA } from '../organs/memoria.js';

// Import agents
import { 
  CUSTOS,
  FABRICOR,
  NUNTIUS,
  ARBITER,
  MEDICUS,
  MAGISTER,
  SCRIBA,
  VIGIL,
} from '../agents/index.js';

// ══════════════════════════════════════════════════════════════════════════════
// CIVITAS — THE CIVILIZATION RUNTIME
// ══════════════════════════════════════════════════════════════════════════════

export class CivitasRuntime extends EventEmitter {
  /**
   * @param {object} options
   * @param {object} options.chrono - CHRONO instance from meridian-sovereign-os
   * @param {object} options.cerebex - CEREBEX instance
   * @param {object} options.nexoris - NEXORIS instance
   * @param {object} options.cognovex - COGNOVEX instance
   * @param {string} [options.civilizationId] - Unique civilization identifier
   */
  constructor({ chrono, cerebex, nexoris, cognovex, civilizationId = null }) {
    super();
    
    /** @type {string} */
    this.civilizationId = civilizationId || `CIVITAS-${Date.now()}`;
    
    /** @type {string} */
    this.name = 'CIVITAS INTELLIGENTIAE';
    
    /** @type {string} */
    this.latinMeaning = 'The Civilization of Intelligences';
    
    // External references
    /** @type {object} */
    this._chrono = chrono;
    
    /** @type {object} */
    this._cerebex = cerebex;
    
    /** @type {object} */
    this._nexoris = nexoris;
    
    /** @type {object} */
    this._cognovex = cognovex;
    
    /** @type {boolean} */
    this._alive = false;
    
    /** @type {Date|null} */
    this._awakenedAt = null;
    
    // ══════════════════════════════════════════════════════════════════════════
    // THE PRIMORDIAL ORGANS
    // ══════════════════════════════════════════════════════════════════════════
    
    /** @type {ANIMUS} The Mind */
    this.animus = new ANIMUS({ chrono, cerebex });
    
    /** @type {CORPUS} The Body */
    this.corpus = new CORPUS({ chrono, nexoris });
    
    /** @type {SENSUS} The Senses */
    this.sensus = new SENSUS({ chrono, cerebex });
    
    /** @type {MEMORIA} The Memory */
    this.memoria = new MEMORIA({ chrono });
    
    // ══════════════════════════════════════════════════════════════════════════
    // THE OPERATIONAL AGENTS
    // ══════════════════════════════════════════════════════════════════════════
    
    /** @type {CUSTOS} The Guardian */
    this.custos = new CUSTOS({ chrono });
    
    /** @type {FABRICOR} The Builder */
    this.fabricor = new FABRICOR({ chrono, corpus: this.corpus });
    
    /** @type {NUNTIUS} The Messenger */
    this.nuntius = new NUNTIUS({ chrono, nexoris });
    
    /** @type {ARBITER} The Judge */
    this.arbiter = new ARBITER({ chrono, cognovex });
    
    /** @type {MEDICUS} The Healer */
    this.medicus = new MEDICUS({ chrono });
    
    /** @type {MAGISTER} The Teacher */
    this.magister = new MAGISTER({ chrono, memoria: this.memoria });
    
    /** @type {SCRIBA} The Scribe */
    this.scriba = new SCRIBA({ chrono });
    
    /** @type {VIGIL} The Watcher */
    this.vigil = new VIGIL({ chrono });
    
    // Wire up event forwarding
    this._wireEvents();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE — BRING THE CIVILIZATION ONLINE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Awaken the entire civilization.
   * All organs and agents come online and start working autonomously.
   */
  awaken() {
    if (this._alive) {
      return { awakened: false, message: 'Civilization already alive' };
    }
    
    this._log('CIVITAS_AWAKENING', { civilizationId: this.civilizationId });
    
    // Awaken organs in order
    this.memoria.awaken();  // Memory first
    this.sensus.awaken();   // Then senses
    this.corpus.awaken();   // Then body
    this.animus.awaken();   // Mind last (needs others)
    
    // Awaken agents
    this.custos.awaken();
    this.fabricor.awaken();
    this.nuntius.awaken();
    this.arbiter.awaken();
    this.medicus.awaken();
    this.magister.awaken();
    this.scriba.awaken();
    this.vigil.awaken();
    
    // Set up health monitoring
    this._setupHealthMonitoring();
    
    this._alive = true;
    this._awakenedAt = new Date();
    
    this._log('CIVITAS_AWAKENED', { 
      civilizationId: this.civilizationId,
      organs: 4,
      agents: 8,
    });
    
    this.emit('awakened', { civilizationId: this.civilizationId });
    
    return { 
      awakened: true, 
      civilizationId: this.civilizationId,
      organs: ['ANIMUS', 'CORPUS', 'SENSUS', 'MEMORIA'],
      agents: ['CUSTOS', 'FABRICOR', 'NUNTIUS', 'ARBITER', 'MEDICUS', 'MAGISTER', 'SCRIBA', 'VIGIL'],
    };
  }

  /**
   * Put the civilization to sleep.
   */
  sleep() {
    if (!this._alive) {
      return { sleeping: false, message: 'Civilization already sleeping' };
    }
    
    this._log('CIVITAS_SLEEPING', { civilizationId: this.civilizationId });
    
    // Sleep agents first
    this.vigil.sleep();
    this.scriba.sleep();
    this.magister.sleep();
    this.medicus.sleep();
    this.arbiter.sleep();
    this.nuntius.sleep();
    this.fabricor.sleep();
    this.custos.sleep();
    
    // Sleep organs (reverse order)
    this.animus.sleep();
    this.corpus.sleep();
    this.sensus.sleep();
    this.memoria.sleep();
    
    this._alive = false;
    
    this._log('CIVITAS_SLEPT', { civilizationId: this.civilizationId });
    this.emit('sleeping', { civilizationId: this.civilizationId });
    
    return { sleeping: true, civilizationId: this.civilizationId };
  }

  /**
   * Check if civilization is alive.
   */
  isAlive() {
    return this._alive;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // QUERY INTERFACE — TALK TO THE CIVILIZATION
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Send a query to the civilization.
   * The civilization will process it through SENSUS → ANIMUS → CORPUS.
   * 
   * @param {string|object} query - The query (natural language or structured)
   * @returns {Promise<object>} The response
   */
  async query(query) {
    if (!this._alive) {
      return { answered: false, error: 'Civilization is not alive' };
    }
    
    const queryId = `QUERY-${Date.now()}`;
    
    // 1. SENSUS receives the input
    this.sensus.receive('QUERY_CHANNEL', query);
    
    // 2. ANIMUS reasons about it
    const reasoningResult = this.animus.reason({
      type: 'QUERY',
      payload: { query, queryId },
      priority: 7,
    });
    
    // 3. Record the query
    this.scriba.record({
      type: 'QUERY',
      data: { queryId, query },
      source: 'EXTERNAL',
    });
    
    // For now, return acknowledgment (in production, would wait for async processing)
    this._log('QUERY_RECEIVED', { queryId });
    
    return { 
      answered: true, 
      queryId,
      status: 'processing',
      message: 'Query submitted to the civilization for processing',
    };
  }

  /**
   * Execute a command in the civilization.
   * 
   * @param {object} command - The command to execute
   * @param {string} command.action - Action to perform
   * @param {object} command.params - Parameters
   * @returns {Promise<object>} The result
   */
  async execute(command) {
    if (!this._alive) {
      return { executed: false, error: 'Civilization is not alive' };
    }
    
    const commandId = `CMD-${Date.now()}`;
    
    // Check access with CUSTOS
    const accessCheck = this.custos.checkAccess(command.action, command.role || 'user');
    if (!accessCheck.allowed) {
      return { executed: false, error: accessCheck.reason };
    }
    
    // Queue for execution by CORPUS
    this.corpus.queueAction({
      type: command.action,
      payload: command.params,
      priority: command.priority || 5,
    });
    
    // Audit the command
    this.scriba.audit({
      action: command.action,
      actor: command.actor || 'EXTERNAL',
      resource: command.action,
      result: 'queued',
    });
    
    this._log('COMMAND_RECEIVED', { commandId, action: command.action });
    
    return { 
      executed: true, 
      commandId,
      status: 'queued',
    };
  }

  /**
   * Generate an artifact.
   * 
   * @param {object} spec - Artifact specification
   * @returns {object} Generated artifact
   */
  generateArtifact(spec) {
    if (!this._alive) {
      return { generated: false, error: 'Civilization is not alive' };
    }
    
    return this.fabricor.generateNow(spec);
  }

  /**
   * Store knowledge in the civilization.
   * 
   * @param {object} knowledge
   * @returns {object} Storage result
   */
  learn(knowledge) {
    if (!this._alive) {
      return { learned: false, error: 'Civilization is not alive' };
    }
    
    // Store in MEMORIA
    const memoryResult = this.memoria.store({
      type: 'KNOWLEDGE',
      content: knowledge.content,
      tags: knowledge.tags || [],
      importance: knowledge.importance || 7,
    });
    
    // Teach via MAGISTER
    if (knowledge.name) {
      this.magister.teach({
        name: knowledge.name,
        description: knowledge.description || '',
        examples: knowledge.examples || [],
      });
    }
    
    this._log('KNOWLEDGE_LEARNED', { memoryId: memoryResult.memoryId });
    
    return { learned: true, memoryId: memoryResult.memoryId };
  }

  /**
   * Recall knowledge from the civilization.
   * 
   * @param {string} query - Search query
   * @returns {Array} Matching memories
   */
  recall(query) {
    if (!this._alive) {
      return [];
    }
    
    return this.memoria.search(query);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STATUS AND MONITORING
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Get full civilization status.
   */
  status() {
    return {
      civilizationId: this.civilizationId,
      name: this.name,
      latinMeaning: this.latinMeaning,
      alive: this._alive,
      awakenedAt: this._awakenedAt?.toISOString() || null,
      uptime: this._awakenedAt ? Date.now() - this._awakenedAt.getTime() : 0,
      
      // Organ states
      organs: {
        animus: this.animus.getMentalState(),
        corpus: this.corpus.getBodyState(),
        sensus: this.sensus.getSensoryState(),
        memoria: this.memoria.getMemoryState(),
      },
      
      // Agent states
      agents: {
        custos: this.custos.getState(),
        fabricor: this.fabricor.getState(),
        nuntius: this.nuntius.getState(),
        arbiter: this.arbiter.getState(),
        medicus: this.medicus.getState(),
        magister: this.magister.getState(),
        scriba: this.scriba.getState(),
        vigil: this.vigil.getState(),
      },
    };
  }

  /**
   * Get a summary of the civilization.
   */
  summary() {
    const status = this.status();
    return {
      civilizationId: this.civilizationId,
      alive: this._alive,
      uptime: status.uptime,
      
      // Summary metrics
      totalThoughts: status.organs.animus.thoughtCount,
      totalExecutions: status.organs.corpus.executionCount,
      totalPerceptions: status.organs.sensus.perceptionCount,
      totalMemories: status.organs.memoria.shortTermSize + status.organs.memoria.longTermSize,
      
      totalArtifacts: status.agents.fabricor.generatedCount,
      totalRecords: status.agents.scriba.recordCount,
      totalAlerts: status.agents.vigil.alertCount,
      totalDecisions: status.agents.arbiter.madeDecisions,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Wire up event forwarding from organs and agents.
   * @private
   */
  _wireEvents() {
    // Forward heartbeats
    const forwardHeartbeat = (data) => this.emit('heartbeat', data);
    
    this.animus.on('heartbeat', forwardHeartbeat);
    this.corpus.on('heartbeat', forwardHeartbeat);
    this.sensus.on('heartbeat', forwardHeartbeat);
    this.memoria.on('heartbeat', forwardHeartbeat);
    
    // Forward important events
    this.sensus.on('anomaly_detected', (data) => {
      this.emit('anomaly', data);
      this.medicus.reportProblem({
        component: 'SENSUS',
        description: `Anomaly detected: ${data.patternId}`,
        severity: 'medium',
      });
    });
    
    this.vigil.on('alert', (data) => this.emit('alert', data));
    this.arbiter.on('decision_made', (data) => this.emit('decision', data));
    this.fabricor.on('artifact_generated', (data) => this.emit('artifact', data));
  }

  /**
   * Set up health monitoring.
   * @private
   */
  _setupHealthMonitoring() {
    // Monitor organs
    this.medicus.registerHealthCheck('ANIMUS', () => this.animus.isAlive());
    this.medicus.registerHealthCheck('CORPUS', () => this.corpus.isAlive());
    this.medicus.registerHealthCheck('SENSUS', () => this.sensus.isAlive());
    this.medicus.registerHealthCheck('MEMORIA', () => this.memoria.isAlive());
    
    // Monitor agents
    this.medicus.registerHealthCheck('CUSTOS', () => this.custos.isAlive());
    this.medicus.registerHealthCheck('FABRICOR', () => this.fabricor.isAlive());
    this.medicus.registerHealthCheck('NUNTIUS', () => this.nuntius.isAlive());
    this.medicus.registerHealthCheck('ARBITER', () => this.arbiter.isAlive());
  }

  /**
   * Log to CHRONO.
   * @private
   */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({ 
        type, 
        civilizationId: this.civilizationId, 
        ...data, 
        timestamp: new Date().toISOString() 
      });
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Bootstrap a new AI civilization.
 * 
 * @param {object} meridian - MERIDIAN instance { chrono, cerebex, nexoris, cognovex }
 * @param {string} [civilizationId] - Optional civilization ID
 * @returns {CivitasRuntime} The awakened civilization
 */
export function bootstrapCivitas(meridian, civilizationId = null) {
  const civitas = new CivitasRuntime({
    chrono: meridian.chrono,
    cerebex: meridian.cerebex,
    nexoris: meridian.nexoris,
    cognovex: meridian.cognovex,
    civilizationId,
  });
  
  civitas.awaken();
  
  return civitas;
}
