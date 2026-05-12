/**
 * MEDINA REGISTRY SDK
 * RSHIP-2026-MEDINA-REGISTRY-001
 *
 * Medina Registry provides the sovereign entity registry for AGI organisms.
 * Implements RSHIP entity management, capability declarations, and
 * φ-weighted discovery protocols.
 *
 * Features:
 * - Hierarchical entity registration (RSHIP-YYYY-TYPE-NNN)
 * - Capability-based discovery
 * - φ-weighted scoring for service selection
 * - Lifecycle management
 *
 * @module medina-registry
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY TYPES
// ═══════════════════════════════════════════════════════════════════════════

const EntityType = {
  AGI: 'AGI',
  SDK: 'SDK',
  PROTOCOL: 'PROTOCOL',
  ORGANISM: 'ORGANISM',
  AGENT: 'AGENT',
  SERVICE: 'SERVICE',
  CANISTER: 'CANISTER'
};

const EntityState = {
  REGISTERED: 'registered',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEPRECATED: 'deprecated',
  REMOVED: 'removed'
};

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY CLASS
// ═══════════════════════════════════════════════════════════════════════════

class RSHIPEntity {
  constructor(type, name, options = {}) {
    this.id = this._generateId(type, name, options.year || new Date().getFullYear());
    this.type = type;
    this.name = name;
    this.version = options.version || '1.0.0';
    this.state = EntityState.REGISTERED;
    this.capabilities = new Set(options.capabilities || []);
    this.dependencies = new Set(options.dependencies || []);
    this.metadata = options.metadata || {};
    this.created = Date.now();
    this.updated = Date.now();
    this.lastHeartbeat = null;
    this.score = 1.0;
    this.owner = options.owner || null;
  }

  _generateId(type, name, year) {
    const seq = Math.floor(Math.random() * 999) + 1;
    const suffix = String(seq).padStart(3, '0');
    return `RSHIP-${year}-${type}-${name.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${suffix}`;
  }

  addCapability(cap) {
    this.capabilities.add(cap);
    this.updated = Date.now();
    return this;
  }

  removeCapability(cap) {
    this.capabilities.delete(cap);
    this.updated = Date.now();
    return this;
  }

  hasCapability(cap) {
    return this.capabilities.has(cap);
  }

  addDependency(dep) {
    this.dependencies.add(dep);
    this.updated = Date.now();
    return this;
  }

  activate() {
    this.state = EntityState.ACTIVE;
    this.updated = Date.now();
    return this;
  }

  suspend() {
    this.state = EntityState.SUSPENDED;
    this.updated = Date.now();
    return this;
  }

  deprecate() {
    this.state = EntityState.DEPRECATED;
    this.updated = Date.now();
    return this;
  }

  heartbeat() {
    this.lastHeartbeat = Date.now();
    return this;
  }

  isAlive(timeoutMs = 30000) {
    if (!this.lastHeartbeat) return false;
    return Date.now() - this.lastHeartbeat < timeoutMs;
  }

  updateScore(metrics) {
    // φ-weighted scoring based on various metrics
    let score = 1.0;

    if (metrics.reliability !== undefined) {
      score *= Math.pow(metrics.reliability, 1 / PHI);
    }
    if (metrics.latency !== undefined) {
      score *= Math.exp(-metrics.latency / (1000 * PHI));
    }
    if (metrics.load !== undefined) {
      score *= 1 - (metrics.load / (PHI + 1));
    }
    if (metrics.uptime !== undefined) {
      score *= Math.pow(metrics.uptime, 1 / (PHI * PHI));
    }

    this.score = Math.max(0, Math.min(1, score));
    return this.score;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      version: this.version,
      state: this.state,
      capabilities: Array.from(this.capabilities),
      dependencies: Array.from(this.dependencies),
      metadata: this.metadata,
      created: this.created,
      updated: this.updated,
      lastHeartbeat: this.lastHeartbeat,
      score: this.score,
      owner: this.owner
    };
  }

  static fromJSON(json) {
    const entity = new RSHIPEntity(json.type, json.name, {
      version: json.version,
      capabilities: json.capabilities,
      dependencies: json.dependencies,
      metadata: json.metadata,
      owner: json.owner
    });
    entity.id = json.id;
    entity.state = json.state;
    entity.created = json.created;
    entity.updated = json.updated;
    entity.lastHeartbeat = json.lastHeartbeat;
    entity.score = json.score;
    return entity;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPABILITY INDEX
// ═══════════════════════════════════════════════════════════════════════════

class CapabilityIndex {
  constructor() {
    this.index = new Map(); // capability -> Set<entityId>
    this.reverseIndex = new Map(); // entityId -> Set<capability>
  }

  add(entityId, capabilities) {
    if (!this.reverseIndex.has(entityId)) {
      this.reverseIndex.set(entityId, new Set());
    }

    for (const cap of capabilities) {
      if (!this.index.has(cap)) {
        this.index.set(cap, new Set());
      }
      this.index.get(cap).add(entityId);
      this.reverseIndex.get(entityId).add(cap);
    }
  }

  remove(entityId) {
    const caps = this.reverseIndex.get(entityId);
    if (caps) {
      for (const cap of caps) {
        const entities = this.index.get(cap);
        if (entities) {
          entities.delete(entityId);
          if (entities.size === 0) {
            this.index.delete(cap);
          }
        }
      }
      this.reverseIndex.delete(entityId);
    }
  }

  findByCapability(capability) {
    return this.index.get(capability) || new Set();
  }

  findByCapabilities(capabilities) {
    const sets = capabilities.map(cap => this.findByCapability(cap));
    if (sets.length === 0) return new Set();

    // Intersection of all sets
    return sets.reduce((acc, set) =>
      new Set([...acc].filter(x => set.has(x)))
    );
  }

  getCapabilities(entityId) {
    return this.reverseIndex.get(entityId) || new Set();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDINA REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

class MedinaRegistry extends EventEmitter {
  constructor(options = {}) {
    super();
    this.entities = new Map();
    this.capabilityIndex = new CapabilityIndex();
    this.typeIndex = new Map();
    this.namespaces = new Map();
    this.heartbeatTimeout = options.heartbeatTimeout || 30000;
    this.cleanupInterval = null;
    this.running = false;
  }

  register(entity) {
    if (!(entity instanceof RSHIPEntity)) {
      throw new Error('Must register RSHIPEntity instance');
    }

    if (this.entities.has(entity.id)) {
      throw new Error(`Entity ${entity.id} already registered`);
    }

    this.entities.set(entity.id, entity);
    this.capabilityIndex.add(entity.id, entity.capabilities);

    if (!this.typeIndex.has(entity.type)) {
      this.typeIndex.set(entity.type, new Set());
    }
    this.typeIndex.get(entity.type).add(entity.id);

    entity.heartbeat();
    this.emit('registered', entity);
    return entity;
  }

  unregister(entityId) {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    entity.state = EntityState.REMOVED;
    this.capabilityIndex.remove(entityId);

    const typeSet = this.typeIndex.get(entity.type);
    if (typeSet) {
      typeSet.delete(entityId);
    }

    this.entities.delete(entityId);
    this.emit('unregistered', entity);
    return true;
  }

  get(entityId) {
    return this.entities.get(entityId) || null;
  }

  getByName(name) {
    for (const [, entity] of this.entities) {
      if (entity.name.toLowerCase() === name.toLowerCase()) {
        return entity;
      }
    }
    return null;
  }

  findByType(type) {
    const ids = this.typeIndex.get(type) || new Set();
    return Array.from(ids).map(id => this.entities.get(id)).filter(Boolean);
  }

  findByCapability(capability) {
    const ids = this.capabilityIndex.findByCapability(capability);
    return Array.from(ids)
      .map(id => this.entities.get(id))
      .filter(e => e && e.state === EntityState.ACTIVE)
      .sort((a, b) => b.score - a.score);
  }

  findByCapabilities(capabilities) {
    const ids = this.capabilityIndex.findByCapabilities(capabilities);
    return Array.from(ids)
      .map(id => this.entities.get(id))
      .filter(e => e && e.state === EntityState.ACTIVE)
      .sort((a, b) => b.score - a.score);
  }

  discover(query) {
    let results = Array.from(this.entities.values());

    if (query.type) {
      results = results.filter(e => e.type === query.type);
    }

    if (query.capabilities && query.capabilities.length > 0) {
      results = results.filter(e =>
        query.capabilities.every(cap => e.hasCapability(cap))
      );
    }

    if (query.state) {
      results = results.filter(e => e.state === query.state);
    }

    if (query.alive !== undefined) {
      results = results.filter(e =>
        query.alive ? e.isAlive(this.heartbeatTimeout) : !e.isAlive(this.heartbeatTimeout)
      );
    }

    if (query.minScore !== undefined) {
      results = results.filter(e => e.score >= query.minScore);
    }

    // Sort by φ-weighted score
    results.sort((a, b) => {
      const scoreA = a.score * (a.isAlive() ? PHI : 1);
      const scoreB = b.score * (b.isAlive() ? PHI : 1);
      return scoreB - scoreA;
    });

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  heartbeat(entityId) {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.heartbeat();
      this.emit('heartbeat', entity);
      return true;
    }
    return false;
  }

  updateScore(entityId, metrics) {
    const entity = this.entities.get(entityId);
    if (entity) {
      const score = entity.updateScore(metrics);
      this.emit('score-updated', { entity, score });
      return score;
    }
    return null;
  }

  start() {
    if (this.running) return;
    this.running = true;

    // Periodic cleanup of dead entities
    this.cleanupInterval = setInterval(() => {
      this._cleanup();
    }, this.heartbeatTimeout);

    this.emit('started');
  }

  stop() {
    this.running = false;
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.emit('stopped');
  }

  _cleanup() {
    const now = Date.now();
    for (const [id, entity] of this.entities) {
      if (entity.state === EntityState.ACTIVE && !entity.isAlive(this.heartbeatTimeout * 3)) {
        entity.suspend();
        this.emit('entity-suspended', entity);
      }
    }
  }

  createNamespace(name) {
    if (this.namespaces.has(name)) {
      throw new Error(`Namespace ${name} already exists`);
    }
    this.namespaces.set(name, new Set());
    return name;
  }

  addToNamespace(namespace, entityId) {
    if (!this.namespaces.has(namespace)) {
      throw new Error(`Namespace ${namespace} doesn't exist`);
    }
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} not registered`);
    }
    this.namespaces.get(namespace).add(entityId);
  }

  getNamespace(namespace) {
    const ids = this.namespaces.get(namespace);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entities.get(id)).filter(Boolean);
  }

  status() {
    const byType = {};
    for (const [type, ids] of this.typeIndex) {
      byType[type] = ids.size;
    }

    const byState = {};
    for (const [, entity] of this.entities) {
      byState[entity.state] = (byState[entity.state] || 0) + 1;
    }

    const alive = Array.from(this.entities.values())
      .filter(e => e.isAlive(this.heartbeatTimeout)).length;

    return {
      running: this.running,
      totalEntities: this.entities.size,
      byType,
      byState,
      aliveEntities: alive,
      namespaces: this.namespaces.size,
      capabilities: this.capabilityIndex.index.size
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  EntityType,
  EntityState,
  RSHIPEntity,
  CapabilityIndex,
  MedinaRegistry
};
