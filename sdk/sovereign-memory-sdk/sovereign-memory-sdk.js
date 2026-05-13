/**
 * SOVEREIGN MEMORY SDK
 * RSHIP-2026-SOVEREIGN-MEMORY-001
 *
 * Sovereign Memory SDK provides persistent, tamper-evident memory
 * systems for AGI cognitive layers. Implements φ-weighted forgetting,
 * Merkle-anchored recall, and temporal indexing.
 *
 * @module sovereign-memory-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY TYPES
// ═══════════════════════════════════════════════════════════════════════════

const MemoryType = {
  EPISODIC: 'episodic',
  SEMANTIC: 'semantic',
  PROCEDURAL: 'procedural',
  WORKING: 'working'
};

const MemoryState = {
  ACTIVE: 'active',
  CONSOLIDATED: 'consolidated',
  ARCHIVED: 'archived',
  FORGOTTEN: 'forgotten'
};

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY ITEM
// ═══════════════════════════════════════════════════════════════════════════

class MemoryItem {
  constructor(content, options = {}) {
    this.id = crypto.randomUUID();
    this.content = content;
    this.type = options.type || MemoryType.EPISODIC;
    this.state = MemoryState.ACTIVE;
    this.importance = options.importance || 0.5;
    this.emotionalValence = options.emotionalValence || 0;
    this.associations = new Set(options.associations || []);
    this.accessCount = 0;
    this.lastAccess = null;
    this.created = Date.now();
    this.modified = Date.now();
    this.hash = this._computeHash();
  }

  _computeHash() {
    const data = JSON.stringify({
      content: this.content,
      type: this.type,
      created: this.created
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  access() {
    this.accessCount++;
    this.lastAccess = Date.now();
    return this;
  }

  addAssociation(memoryId) {
    this.associations.add(memoryId);
    this.modified = Date.now();
    return this;
  }

  removeAssociation(memoryId) {
    this.associations.delete(memoryId);
    this.modified = Date.now();
    return this;
  }

  strength() {
    // Memory strength based on recency, frequency, importance, and emotion
    const now = Date.now();
    const age = (now - this.created) / (1000 * 60 * 60 * 24); // days
    const recency = this.lastAccess ?
      Math.exp(-(now - this.lastAccess) / (1000 * 60 * 60 * 24 * PHI)) : 0;

    const frequencyFactor = Math.log(1 + this.accessCount) / Math.log(PHI + 1);
    const emotionFactor = 1 + Math.abs(this.emotionalValence) * 0.5;
    const decayFactor = Math.exp(-age / (30 * PHI)); // 30-day half-life scaled by φ

    return (this.importance + recency + frequencyFactor) * emotionFactor * decayFactor / 3;
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      type: this.type,
      state: this.state,
      importance: this.importance,
      emotionalValence: this.emotionalValence,
      associations: Array.from(this.associations),
      accessCount: this.accessCount,
      lastAccess: this.lastAccess,
      created: this.created,
      modified: this.modified,
      hash: this.hash,
      strength: this.strength()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY INDEX
// ═══════════════════════════════════════════════════════════════════════════

class MemoryIndex {
  constructor() {
    this.byType = new Map();
    this.byState = new Map();
    this.temporal = [];
    this.associations = new Map();
  }

  add(memory) {
    // Type index
    if (!this.byType.has(memory.type)) {
      this.byType.set(memory.type, new Set());
    }
    this.byType.get(memory.type).add(memory.id);

    // State index
    if (!this.byState.has(memory.state)) {
      this.byState.set(memory.state, new Set());
    }
    this.byState.get(memory.state).add(memory.id);

    // Temporal index (sorted)
    this.temporal.push({ id: memory.id, time: memory.created });
    this.temporal.sort((a, b) => b.time - a.time);

    // Association index
    this.associations.set(memory.id, memory.associations);
  }

  remove(memory) {
    const typeSet = this.byType.get(memory.type);
    if (typeSet) typeSet.delete(memory.id);

    const stateSet = this.byState.get(memory.state);
    if (stateSet) stateSet.delete(memory.id);

    this.temporal = this.temporal.filter(t => t.id !== memory.id);
    this.associations.delete(memory.id);
  }

  updateState(memory, oldState) {
    const oldSet = this.byState.get(oldState);
    if (oldSet) oldSet.delete(memory.id);

    if (!this.byState.has(memory.state)) {
      this.byState.set(memory.state, new Set());
    }
    this.byState.get(memory.state).add(memory.id);
  }

  getByType(type) {
    return this.byType.get(type) || new Set();
  }

  getByState(state) {
    return this.byState.get(state) || new Set();
  }

  getRecent(limit = 10) {
    return this.temporal.slice(0, limit).map(t => t.id);
  }

  getRelated(memoryId) {
    return this.associations.get(memoryId) || new Set();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY STORE
// ═══════════════════════════════════════════════════════════════════════════

class SovereignMemoryStore extends EventEmitter {
  constructor(options = {}) {
    super();
    this.memories = new Map();
    this.index = new MemoryIndex();
    this.forgetThreshold = options.forgetThreshold || 0.1;
    this.maxMemories = options.maxMemories || 10000;
    this.merkleRoot = null;
    this.consolidationInterval = null;
  }

  store(content, options = {}) {
    const memory = new MemoryItem(content, options);
    this.memories.set(memory.id, memory);
    this.index.add(memory);
    this._updateMerkleRoot();

    this.emit('stored', { id: memory.id, type: memory.type });

    // Check capacity
    if (this.memories.size > this.maxMemories) {
      this._forgetWeakest();
    }

    return memory;
  }

  recall(id) {
    const memory = this.memories.get(id);
    if (!memory || memory.state === MemoryState.FORGOTTEN) {
      return null;
    }

    memory.access();
    this.emit('recalled', { id, strength: memory.strength() });
    return memory;
  }

  search(query) {
    const results = [];

    for (const [, memory] of this.memories) {
      if (memory.state === MemoryState.FORGOTTEN) continue;

      const content = JSON.stringify(memory.content).toLowerCase();
      const queryLower = query.toLowerCase();

      if (content.includes(queryLower)) {
        results.push({
          memory,
          relevance: this._calculateRelevance(memory, queryLower)
        });
      }
    }

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .map(r => r.memory);
  }

  _calculateRelevance(memory, query) {
    const content = JSON.stringify(memory.content).toLowerCase();
    const matchCount = (content.match(new RegExp(query, 'g')) || []).length;
    return matchCount * memory.strength() * PHI;
  }

  associate(id1, id2) {
    const m1 = this.memories.get(id1);
    const m2 = this.memories.get(id2);

    if (!m1 || !m2) return false;

    m1.addAssociation(id2);
    m2.addAssociation(id1);
    this.index.associations.set(id1, m1.associations);
    this.index.associations.set(id2, m2.associations);

    this.emit('associated', { id1, id2 });
    return true;
  }

  getRelated(id, depth = 1) {
    const memory = this.memories.get(id);
    if (!memory) return [];

    const related = new Set();
    const toExplore = [{ ids: memory.associations, currentDepth: 1 }];

    while (toExplore.length > 0) {
      const { ids, currentDepth } = toExplore.shift();

      for (const relatedId of ids) {
        if (!related.has(relatedId) && relatedId !== id) {
          related.add(relatedId);

          if (currentDepth < depth) {
            const relatedMemory = this.memories.get(relatedId);
            if (relatedMemory) {
              toExplore.push({
                ids: relatedMemory.associations,
                currentDepth: currentDepth + 1
              });
            }
          }
        }
      }
    }

    return Array.from(related)
      .map(rid => this.memories.get(rid))
      .filter(Boolean)
      .sort((a, b) => b.strength() - a.strength());
  }

  forget(id) {
    const memory = this.memories.get(id);
    if (!memory) return false;

    const oldState = memory.state;
    memory.state = MemoryState.FORGOTTEN;
    this.index.updateState(memory, oldState);
    this._updateMerkleRoot();

    this.emit('forgotten', { id });
    return true;
  }

  _forgetWeakest() {
    const activeMemories = Array.from(this.memories.values())
      .filter(m => m.state !== MemoryState.FORGOTTEN);

    const weakest = activeMemories
      .sort((a, b) => a.strength() - b.strength())
      .slice(0, Math.ceil(activeMemories.length * 0.1));

    for (const memory of weakest) {
      if (memory.strength() < this.forgetThreshold) {
        this.forget(memory.id);
      }
    }
  }

  consolidate() {
    const active = Array.from(this.index.getByState(MemoryState.ACTIVE));

    for (const id of active) {
      const memory = this.memories.get(id);
      if (!memory) continue;

      const age = (Date.now() - memory.created) / (1000 * 60 * 60);
      if (age > 24 && memory.accessCount > 2) {
        const oldState = memory.state;
        memory.state = MemoryState.CONSOLIDATED;
        this.index.updateState(memory, oldState);
        this.emit('consolidated', { id });
      }
    }

    this._updateMerkleRoot();
  }

  _updateMerkleRoot() {
    const hashes = Array.from(this.memories.values())
      .filter(m => m.state !== MemoryState.FORGOTTEN)
      .map(m => m.hash)
      .sort();

    if (hashes.length === 0) {
      this.merkleRoot = null;
      return;
    }

    let level = hashes;
    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left;
        const combined = crypto.createHash('sha256')
          .update(left + right)
          .digest('hex');
        next.push(combined);
      }
      level = next;
    }

    this.merkleRoot = level[0];
  }

  startConsolidation(intervalMs = 3600000) {
    this.consolidationInterval = setInterval(() => {
      this.consolidate();
    }, intervalMs);
  }

  stopConsolidation() {
    if (this.consolidationInterval) {
      clearInterval(this.consolidationInterval);
      this.consolidationInterval = null;
    }
  }

  status() {
    const byState = {};
    for (const [state, ids] of this.index.byState) {
      byState[state] = ids.size;
    }

    return {
      totalMemories: this.memories.size,
      byState,
      merkleRoot: this.merkleRoot,
      forgetThreshold: this.forgetThreshold
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  MemoryType,
  MemoryState,
  MemoryItem,
  MemoryIndex,
  SovereignMemoryStore
};
