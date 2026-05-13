/**
 * KNOWLEDGE CRYSTALLIZATION SDK
 * RSHIP-2026-KNOWLEDGE-CRYSTAL-001
 *
 * Knowledge graph solidification and crystallization. Implements semantic
 * compression, concept lattice formation, and φ-weighted knowledge
 * hardening for persistent AGI memory structures.
 *
 * @module knowledge-crystallization-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;

// ═══════════════════════════════════════════════════════════════════════════
// CRYSTAL TYPES
// ═══════════════════════════════════════════════════════════════════════════

const CrystalState = {
  FLUID: 'fluid',
  CRYSTALLIZING: 'crystallizing',
  SOLID: 'solid',
  METAMORPHIC: 'metamorphic'
};

const ConceptType = {
  ENTITY: 'entity',
  RELATION: 'relation',
  ATTRIBUTE: 'attribute',
  PATTERN: 'pattern',
  AXIOM: 'axiom'
};

// ═══════════════════════════════════════════════════════════════════════════
// CONCEPT NODE
// ═══════════════════════════════════════════════════════════════════════════

class ConceptNode {
  constructor(id, type, value, options = {}) {
    this.id = id;
    this.type = type;
    this.value = value;
    this.weight = options.weight || 1.0;
    this.confidence = options.confidence || 1.0;
    this.hardness = 0; // 0 = fluid, 1 = crystallized
    this.connections = new Map();
    this.attributes = new Map();
    this.embeddings = options.embeddings || null;
    this.created = Date.now();
    this.lastAccessed = Date.now();
    this.accessCount = 0;
    this.hash = this._computeHash();
  }

  _computeHash() {
    return crypto.createHash('sha256')
      .update(JSON.stringify({ id: this.id, type: this.type, value: this.value }))
      .digest('hex').slice(0, 16);
  }

  connect(nodeId, relationshipType, weight = 1.0) {
    this.connections.set(nodeId, {
      type: relationshipType,
      weight,
      created: Date.now()
    });
  }

  disconnect(nodeId) {
    return this.connections.delete(nodeId);
  }

  setAttribute(key, value) {
    this.attributes.set(key, value);
  }

  getAttribute(key) {
    return this.attributes.get(key);
  }

  access() {
    this.lastAccessed = Date.now();
    this.accessCount++;
    // Hardening through use
    this.hardness = Math.min(1, this.hardness + 0.01 * (1 - this.hardness));
  }

  decay(rate = 0.001) {
    const timeSinceAccess = Date.now() - this.lastAccessed;
    const decayFactor = Math.exp(-rate * timeSinceAccess / 1000);
    this.confidence *= decayFactor;
    // Fluid concepts decay faster
    if (this.hardness < 0.5) {
      this.weight *= Math.pow(decayFactor, PHI);
    }
  }

  crystallize() {
    this.hardness = 1.0;
  }

  melt() {
    this.hardness = 0;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      value: this.value,
      weight: this.weight,
      confidence: this.confidence,
      hardness: this.hardness,
      connectionCount: this.connections.size,
      attributeCount: this.attributes.size,
      accessCount: this.accessCount,
      hash: this.hash
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONCEPT LATTICE
// ═══════════════════════════════════════════════════════════════════════════

class ConceptLattice {
  constructor(options = {}) {
    this.nodes = new Map();
    this.levels = new Map();
    this.supremum = null;
    this.infimum = null;
    this.options = options;
  }

  addNode(node) {
    this.nodes.set(node.id, node);
    this._updateLevels(node);
  }

  removeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Remove connections
    for (const [otherId] of this.nodes) {
      const other = this.nodes.get(otherId);
      if (other) other.disconnect(nodeId);
    }

    // Update levels
    for (const [level, nodeIds] of this.levels) {
      nodeIds.delete(nodeId);
    }

    return this.nodes.delete(nodeId);
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  _updateLevels(node) {
    // Simple level assignment based on connection count
    const level = node.connections.size;
    if (!this.levels.has(level)) {
      this.levels.set(level, new Set());
    }
    this.levels.get(level).add(node.id);
  }

  findSubconcepts(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const subconcepts = [];
    for (const [connId, conn] of node.connections) {
      if (conn.type === 'subsumes' || conn.type === 'specializes') {
        subconcepts.push(this.nodes.get(connId));
      }
    }
    return subconcepts.filter(Boolean);
  }

  findSuperconcepts(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const superconcepts = [];
    for (const [otherId, other] of this.nodes) {
      for (const [connId, conn] of other.connections) {
        if (connId === nodeId &&
           (conn.type === 'subsumes' || conn.type === 'specializes')) {
          superconcepts.push(other);
        }
      }
    }
    return superconcepts;
  }

  computeExtent(nodeId) {
    // Objects that have all attributes of the concept
    const visited = new Set();
    const queue = [nodeId];
    const extent = new Set();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      extent.add(currentId);

      const subconcepts = this.findSubconcepts(currentId);
      for (const sub of subconcepts) {
        queue.push(sub.id);
      }
    }

    return Array.from(extent);
  }

  computeIntent(nodeId) {
    // Attributes shared by all objects in extent
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    const intent = new Map(node.attributes);

    const extent = this.computeExtent(nodeId);
    for (const id of extent) {
      const n = this.nodes.get(id);
      if (!n) continue;

      // Keep only common attributes
      for (const [key, value] of intent) {
        if (!n.attributes.has(key) || n.attributes.get(key) !== value) {
          intent.delete(key);
        }
      }
    }

    return Array.from(intent.entries());
  }

  toJSON() {
    const nodesJson = {};
    for (const [id, node] of this.nodes) {
      nodesJson[id] = node.toJSON();
    }

    return {
      nodeCount: this.nodes.size,
      levelCount: this.levels.size,
      nodes: nodesJson
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE CRYSTAL
// ═══════════════════════════════════════════════════════════════════════════

class KnowledgeCrystal extends EventEmitter {
  constructor(id, options = {}) {
    super();
    this.id = id;
    this.lattice = new ConceptLattice(options);
    this.state = CrystalState.FLUID;
    this.temperature = 1.0; // 1 = hot/fluid, 0 = cold/crystallized
    this.pressure = options.pressure || 1.0;
    this.created = Date.now();
    this.metrics = {
      conceptsAdded: 0,
      crystallizations: 0,
      queries: 0
    };
  }

  addConcept(type, value, options = {}) {
    const id = options.id || crypto.randomUUID();
    const node = new ConceptNode(id, type, value, options);
    this.lattice.addNode(node);
    this.metrics.conceptsAdded++;
    this.emit('concept-added', { node: node.toJSON() });
    return node;
  }

  getConcept(id) {
    const node = this.lattice.getNode(id);
    if (node) node.access();
    this.metrics.queries++;
    return node;
  }

  linkConcepts(sourceId, targetId, relationshipType, weight = 1.0) {
    const source = this.lattice.getNode(sourceId);
    const target = this.lattice.getNode(targetId);

    if (!source || !target) {
      return { success: false, reason: 'Concept not found' };
    }

    source.connect(targetId, relationshipType, weight);
    target.connect(sourceId, this._inverseRelation(relationshipType), weight);

    this.emit('concepts-linked', { sourceId, targetId, relationshipType });
    return { success: true };
  }

  _inverseRelation(type) {
    const inverses = {
      'subsumes': 'subsumed_by',
      'subsumed_by': 'subsumes',
      'causes': 'caused_by',
      'caused_by': 'causes',
      'part_of': 'has_part',
      'has_part': 'part_of'
    };
    return inverses[type] || `inverse_${type}`;
  }

  query(pattern) {
    this.metrics.queries++;
    const results = [];

    for (const [id, node] of this.lattice.nodes) {
      let matches = true;

      if (pattern.type && node.type !== pattern.type) matches = false;
      if (pattern.minHardness && node.hardness < pattern.minHardness) matches = false;
      if (pattern.minConfidence && node.confidence < pattern.minConfidence) matches = false;

      if (pattern.hasAttribute) {
        for (const [key, value] of Object.entries(pattern.hasAttribute)) {
          if (node.getAttribute(key) !== value) matches = false;
        }
      }

      if (matches) {
        node.access();
        results.push(node);
      }
    }

    // φ-weighted sorting by relevance
    results.sort((a, b) => {
      const scoreA = a.weight * a.confidence * Math.pow(PHI, a.hardness);
      const scoreB = b.weight * b.confidence * Math.pow(PHI, b.hardness);
      return scoreB - scoreA;
    });

    return results;
  }

  cool(rate = 0.01) {
    this.temperature = Math.max(0, this.temperature - rate);

    // Crystallize high-hardness concepts when cold
    if (this.temperature < 0.3) {
      for (const [id, node] of this.lattice.nodes) {
        if (node.hardness > 0.7 && node.accessCount > 5) {
          node.crystallize();
          this.metrics.crystallizations++;
        }
      }
      this.state = CrystalState.CRYSTALLIZING;
    }

    if (this.temperature < 0.1) {
      this.state = CrystalState.SOLID;
    }

    this.emit('temperature-changed', { temperature: this.temperature, state: this.state });
  }

  heat(rate = 0.1) {
    this.temperature = Math.min(1, this.temperature + rate);

    if (this.temperature > 0.7) {
      this.state = CrystalState.FLUID;
    } else if (this.temperature > 0.3) {
      this.state = CrystalState.METAMORPHIC;
    }

    this.emit('temperature-changed', { temperature: this.temperature, state: this.state });
  }

  applyPressure(amount) {
    this.pressure += amount;
    // Higher pressure accelerates crystallization
    for (const [id, node] of this.lattice.nodes) {
      node.hardness = Math.min(1, node.hardness + amount * 0.1);
    }
    this.emit('pressure-applied', { pressure: this.pressure });
  }

  compress() {
    // Remove low-value fluid concepts
    const toRemove = [];

    for (const [id, node] of this.lattice.nodes) {
      if (node.hardness < 0.3 && node.accessCount < 3 && node.confidence < 0.5) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.lattice.removeNode(id);
    }

    this.emit('compressed', { removed: toRemove.length });
    return toRemove.length;
  }

  status() {
    let totalHardness = 0;
    let crystallizedCount = 0;

    for (const [id, node] of this.lattice.nodes) {
      totalHardness += node.hardness;
      if (node.hardness >= 1) crystallizedCount++;
    }

    const avgHardness = this.lattice.nodes.size > 0 ?
      totalHardness / this.lattice.nodes.size : 0;

    return {
      id: this.id,
      state: this.state,
      temperature: this.temperature,
      pressure: this.pressure,
      conceptCount: this.lattice.nodes.size,
      crystallizedCount,
      averageHardness: avgHardness,
      metrics: { ...this.metrics }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE CRYSTALLIZATION SDK
// ═══════════════════════════════════════════════════════════════════════════

class KnowledgeCrystallizationSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = 'RSHIP-2026-KNOWLEDGE-CRYSTAL-001';
    this.name = 'KnowledgeCrystallizationSDK';
    this.version = '1.0.0';
    this.config = config;
    this.crystals = new Map();
    this.state = 'initialized';
  }

  async start() {
    this.state = 'running';
    this.emit('started');
  }

  async stop() {
    this.state = 'stopped';
    this.emit('stopped');
  }

  createCrystal(id, options = {}) {
    const crystal = new KnowledgeCrystal(id, options);
    this.crystals.set(id, crystal);

    // Forward events
    crystal.on('concept-added', (e) => this.emit('concept-added', { crystalId: id, ...e }));
    crystal.on('concepts-linked', (e) => this.emit('concepts-linked', { crystalId: id, ...e }));

    this.emit('crystal-created', { id });
    return crystal;
  }

  getCrystal(id) {
    return this.crystals.get(id) || null;
  }

  status() {
    const crystalStats = {};
    for (const [id, crystal] of this.crystals) {
      crystalStats[id] = crystal.status();
    }

    return {
      id: this.id,
      name: this.name,
      version: this.version,
      state: this.state,
      crystalCount: this.crystals.size,
      crystals: crystalStats
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  CrystalState,
  ConceptType,
  ConceptNode,
  ConceptLattice,
  KnowledgeCrystal,
  KnowledgeCrystallizationSDK
};
