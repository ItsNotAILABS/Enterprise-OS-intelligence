/**
 * MEMORIA — The Memory of the Civilization
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Latin: MEMORIA (memory, remembrance, recollection)
 * 
 * MEMORIA is the storage and recall engine of the AI civilization. It:
 *   - Stores all experiences, decisions, and outcomes
 *   - Enables learning from past events
 *   - Provides recall for other organs
 *   - Manages knowledge consolidation
 *
 * MEMORIA runs AUTONOMOUSLY, constantly consolidating and indexing memories.
 *
 * Theory basis:
 *   Paper XX  — STIGMERGY: the pheromone trail is memory
 *   Paper VII — QUAESTIO ET ACTIO: query = execute = learn
 *   Paper XXII — AURUM: φ⁻¹ learning rate
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// φ⁻¹ ≈ 0.618 — golden ratio learning rate
const PHI_INV = 0.6180339887;

// ══════════════════════════════════════════════════════════════════════════════
// MEMORIA — THE MEMORY
// ══════════════════════════════════════════════════════════════════════════════

export class MEMORIA extends EventEmitter {
  /**
   * @param {object} options
   * @param {object} options.chrono - CHRONO instance for logging
   * @param {number} [options.consolidateIntervalMs=1000] - Memory consolidation interval
   */
  constructor({ chrono, consolidateIntervalMs = 1000 }) {
    super();
    
    /** @type {string} */
    this.name = 'MEMORIA';
    
    /** @type {string} */
    this.latinMeaning = 'Memory, Remembrance, Recollection';
    
    /** @type {object} */
    this._chrono = chrono;
    
    /** @type {number} */
    this._consolidateIntervalMs = consolidateIntervalMs;
    
    /** @type {boolean} */
    this._alive = false;
    
    /** @type {NodeJS.Timer|null} */
    this._consolidateLoop = null;
    
    // Memory stores
    /** @type {Map} Short-term memory — recent events */
    this._shortTerm = new Map();
    
    /** @type {Map} Long-term memory — consolidated knowledge */
    this._longTerm = new Map();
    
    /** @type {Map} Episodic memory — event sequences */
    this._episodic = new Map();
    
    /** @type {Map} Semantic memory — facts and concepts */
    this._semantic = new Map();
    
    /** @type {Map} Procedural memory — how to do things */
    this._procedural = new Map();
    
    // Indexes for fast recall
    /** @type {Map} Tag index */
    this._tagIndex = new Map();
    
    /** @type {Map} Time index */
    this._timeIndex = new Map();
    
    /** @type {object} Memory state */
    this._memoryState = {
      storeCount: 0,
      recallCount: 0,
      consolidationCount: 0,
      lastConsolidation: null,
      shortTermSize: 0,
      longTermSize: 0,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Awaken MEMORIA — start consolidating memories.
   */
  awaken() {
    if (this._alive) return { awakened: false, message: 'Already alive' };
    
    this._alive = true;
    this._log('MEMORIA_AWAKENED', { consolidateIntervalMs: this._consolidateIntervalMs });
    
    // Start the autonomous consolidation loop
    this._consolidateLoop = setInterval(() => this._consolidate(), this._consolidateIntervalMs);
    
    this.emit('awakened', { organ: 'MEMORIA' });
    
    return { awakened: true, organ: 'MEMORIA' };
  }

  /**
   * Put MEMORIA to sleep.
   */
  sleep() {
    if (!this._alive) return { sleeping: false, message: 'Already sleeping' };
    
    this._alive = false;
    if (this._consolidateLoop) {
      clearInterval(this._consolidateLoop);
      this._consolidateLoop = null;
    }
    
    this._log('MEMORIA_SLEEPING', { storeCount: this._memoryState.storeCount });
    this.emit('sleeping', { organ: 'MEMORIA' });
    
    return { sleeping: true, organ: 'MEMORIA', totalStores: this._memoryState.storeCount };
  }

  /**
   * Check if MEMORIA is alive.
   */
  isAlive() {
    return this._alive;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STORAGE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Store a memory.
   * 
   * @param {object} memory
   * @param {string} memory.type - Memory type (EXPERIENCE, DECISION, OUTCOME, FACT, PROCEDURE)
   * @param {any} memory.content - The memory content
   * @param {string[]} [memory.tags] - Tags for indexing
   * @param {number} [memory.importance=5] - Importance (1-10)
   * @returns {{ stored: boolean, memoryId: string }}
   */
  store(memory) {
    const memoryId = `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const memoryObj = {
      memoryId,
      type: memory.type,
      content: memory.content,
      tags: memory.tags || [],
      importance: memory.importance || 5,
      storedAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessedAt: null,
      strength: 1.0, // Memory strength (decays without access)
    };
    
    // Store in short-term first
    this._shortTerm.set(memoryId, memoryObj);
    
    // Index by tags
    for (const tag of memoryObj.tags) {
      if (!this._tagIndex.has(tag)) {
        this._tagIndex.set(tag, new Set());
      }
      this._tagIndex.get(tag).add(memoryId);
    }
    
    // Index by time (hour bucket)
    const hourKey = new Date().toISOString().slice(0, 13);
    if (!this._timeIndex.has(hourKey)) {
      this._timeIndex.set(hourKey, new Set());
    }
    this._timeIndex.get(hourKey).add(memoryId);
    
    this._memoryState.storeCount++;
    this._memoryState.shortTermSize = this._shortTerm.size;
    
    this._log('MEMORY_STORED', { memoryId, type: memory.type, importance: memory.importance });
    this.emit('memory_stored', { memoryId, type: memory.type });
    
    return { stored: true, memoryId };
  }

  /**
   * Store a fact (semantic memory).
   * 
   * @param {string} factId - Unique fact identifier
   * @param {any} fact - The fact content
   * @param {string[]} [tags] - Tags
   */
  storeFact(factId, fact, tags = []) {
    this._semantic.set(factId, {
      factId,
      fact,
      tags,
      storedAt: new Date().toISOString(),
      verified: false,
    });
    
    return this.store({ type: 'FACT', content: { factId, fact }, tags, importance: 7 });
  }

  /**
   * Store a procedure (how to do something).
   * 
   * @param {string} procedureId - Unique procedure identifier
   * @param {object} procedure - The procedure
   * @param {string} procedure.name - Procedure name
   * @param {Array} procedure.steps - Steps to execute
   */
  storeProcedure(procedureId, procedure) {
    this._procedural.set(procedureId, {
      procedureId,
      name: procedure.name,
      steps: procedure.steps,
      storedAt: new Date().toISOString(),
      executionCount: 0,
      successRate: 1.0,
    });
    
    return this.store({ type: 'PROCEDURE', content: procedure, tags: ['procedure', procedure.name], importance: 8 });
  }

  /**
   * Store an episode (sequence of events).
   * 
   * @param {string} episodeId - Unique episode identifier
   * @param {object} episode - The episode
   * @param {Array} episode.events - Sequence of events
   * @param {string} [episode.outcome] - Final outcome
   */
  storeEpisode(episodeId, episode) {
    this._episodic.set(episodeId, {
      episodeId,
      events: episode.events,
      outcome: episode.outcome,
      storedAt: new Date().toISOString(),
    });
    
    return this.store({ type: 'EPISODE', content: episode, tags: ['episode'], importance: 6 });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RECALL
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Recall a memory by ID.
   * 
   * @param {string} memoryId - Memory ID
   * @returns {object|null} The memory or null
   */
  recall(memoryId) {
    let memory = this._shortTerm.get(memoryId) || this._longTerm.get(memoryId);
    
    if (memory) {
      memory.accessCount++;
      memory.lastAccessedAt = new Date().toISOString();
      // Strengthen memory with φ⁻¹ learning
      memory.strength = Math.min(1.0, memory.strength + PHI_INV * (1 - memory.strength));
      
      this._memoryState.recallCount++;
      this._log('MEMORY_RECALLED', { memoryId, strength: memory.strength });
    }
    
    return memory || null;
  }

  /**
   * Recall memories by tag.
   * 
   * @param {string} tag - Tag to search
   * @param {number} [limit=10] - Maximum results
   * @returns {Array} Matching memories
   */
  recallByTag(tag, limit = 10) {
    const memoryIds = this._tagIndex.get(tag);
    if (!memoryIds) return [];
    
    const memories = [];
    for (const memoryId of memoryIds) {
      const memory = this.recall(memoryId);
      if (memory) {
        memories.push(memory);
        if (memories.length >= limit) break;
      }
    }
    
    // Sort by strength descending
    memories.sort((a, b) => b.strength - a.strength);
    
    return memories;
  }

  /**
   * Recall a fact.
   * 
   * @param {string} factId - Fact ID
   * @returns {object|null}
   */
  recallFact(factId) {
    return this._semantic.get(factId) || null;
  }

  /**
   * Recall a procedure.
   * 
   * @param {string} procedureId - Procedure ID
   * @returns {object|null}
   */
  recallProcedure(procedureId) {
    return this._procedural.get(procedureId) || null;
  }

  /**
   * Recall an episode.
   * 
   * @param {string} episodeId - Episode ID
   * @returns {object|null}
   */
  recallEpisode(episodeId) {
    return this._episodic.get(episodeId) || null;
  }

  /**
   * Search memories by content (simple text search).
   * 
   * @param {string} query - Search query
   * @param {number} [limit=10] - Maximum results
   * @returns {Array} Matching memories
   */
  search(query, limit = 10) {
    const queryLower = query.toLowerCase();
    const results = [];
    
    // Search short-term
    for (const [memoryId, memory] of this._shortTerm) {
      const contentStr = JSON.stringify(memory.content).toLowerCase();
      if (contentStr.includes(queryLower)) {
        results.push(memory);
        if (results.length >= limit) break;
      }
    }
    
    // Search long-term if needed
    if (results.length < limit) {
      for (const [memoryId, memory] of this._longTerm) {
        const contentStr = JSON.stringify(memory.content).toLowerCase();
        if (contentStr.includes(queryLower)) {
          results.push(memory);
          if (results.length >= limit) break;
        }
      }
    }
    
    this._log('MEMORY_SEARCH', { query, resultCount: results.length });
    
    return results;
  }

  /**
   * Get memory state.
   */
  getMemoryState() {
    return {
      ...this._memoryState,
      shortTermSize: this._shortTerm.size,
      longTermSize: this._longTerm.size,
      episodicSize: this._episodic.size,
      semanticSize: this._semantic.size,
      proceduralSize: this._procedural.size,
      tagCount: this._tagIndex.size,
      isAlive: this._alive,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE — AUTONOMOUS CONSOLIDATION
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * The consolidation function — moves important memories to long-term.
   * @private
   */
  _consolidate() {
    if (!this._alive) return;
    
    this._memoryState.consolidationCount++;
    const now = new Date().toISOString();
    
    // Process short-term memories
    for (const [memoryId, memory] of this._shortTerm) {
      // Decay memory strength
      memory.strength *= (1 - PHI_INV * 0.1); // Slow decay
      
      // Consolidate to long-term if:
      // 1. High importance and accessed recently
      // 2. Accessed multiple times
      const shouldConsolidate = 
        (memory.importance >= 7 && memory.accessCount >= 1) ||
        (memory.accessCount >= 3);
      
      if (shouldConsolidate && !this._longTerm.has(memoryId)) {
        this._longTerm.set(memoryId, { ...memory, consolidatedAt: now });
        this._log('MEMORY_CONSOLIDATED', { memoryId, importance: memory.importance });
        this.emit('memory_consolidated', { memoryId });
      }
      
      // Remove very weak short-term memories
      if (memory.strength < 0.1) {
        this._shortTerm.delete(memoryId);
      }
    }
    
    this._memoryState.lastConsolidation = now;
    this._memoryState.shortTermSize = this._shortTerm.size;
    this._memoryState.longTermSize = this._longTerm.size;
    
    // Emit heartbeat every 60 consolidations
    if (this._memoryState.consolidationCount % 60 === 0) {
      this.emit('heartbeat', { organ: 'MEMORIA', consolidationCount: this._memoryState.consolidationCount });
    }
  }

  /**
   * Log to CHRONO.
   * @private
   */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({ type, organ: 'MEMORIA', ...data, timestamp: new Date().toISOString() });
    }
  }
}
