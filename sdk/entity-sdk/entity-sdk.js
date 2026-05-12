/**
 * ENTITY SDK
 * RSHIP-2026-ENTITY-SDK-001
 *
 * Entity SDK provides the core entity management framework for RSHIP.
 * Implements entity lifecycle, relationships, and φ-weighted scoring.
 *
 * @module entity-sdk
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
  SERVICE: 'SERVICE',
  USER: 'USER',
  RESOURCE: 'RESOURCE'
};

const EntityState = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived'
};

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY
// ═══════════════════════════════════════════════════════════════════════════

class Entity {
  constructor(type, name, options = {}) {
    this.id = this._generateId(type, name);
    this.type = type;
    this.name = name;
    this.state = EntityState.DRAFT;
    this.version = options.version || '1.0.0';
    this.attributes = new Map(Object.entries(options.attributes || {}));
    this.tags = new Set(options.tags || []);
    this.relationships = [];
    this.metadata = options.metadata || {};
    this.created = Date.now();
    this.updated = Date.now();
    this.score = 1.0;
  }

  _generateId(type, name) {
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 999) + 1;
    const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    return `RSHIP-${year}-${type}-${cleanName}-${String(seq).padStart(3, '0')}`;
  }

  setAttribute(key, value) {
    this.attributes.set(key, value);
    this.updated = Date.now();
    return this;
  }

  getAttribute(key) {
    return this.attributes.get(key);
  }

  addTag(tag) {
    this.tags.add(tag);
    this.updated = Date.now();
    return this;
  }

  removeTag(tag) {
    this.tags.delete(tag);
    this.updated = Date.now();
    return this;
  }

  hasTag(tag) {
    return this.tags.has(tag);
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

  archive() {
    this.state = EntityState.ARCHIVED;
    this.updated = Date.now();
    return this;
  }

  addRelationship(targetId, relationshipType, metadata = {}) {
    this.relationships.push({
      target: targetId,
      type: relationshipType,
      metadata,
      created: Date.now()
    });
    this.updated = Date.now();
    return this;
  }

  getRelationships(type = null) {
    if (type === null) return [...this.relationships];
    return this.relationships.filter(r => r.type === type);
  }

  updateScore(metrics) {
    let score = 1.0;

    if (metrics.activity !== undefined) {
      score *= Math.pow(metrics.activity, 1 / PHI);
    }
    if (metrics.reliability !== undefined) {
      score *= metrics.reliability;
    }
    if (metrics.connections !== undefined) {
      score *= Math.log(1 + metrics.connections) / Math.log(PHI + 1);
    }

    this.score = Math.max(0, Math.min(1, score));
    this.updated = Date.now();
    return this.score;
  }

  clone() {
    const cloned = new Entity(this.type, this.name + '_clone');
    cloned.attributes = new Map(this.attributes);
    cloned.tags = new Set(this.tags);
    cloned.metadata = { ...this.metadata };
    return cloned;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      state: this.state,
      version: this.version,
      attributes: Object.fromEntries(this.attributes),
      tags: Array.from(this.tags),
      relationships: this.relationships,
      metadata: this.metadata,
      created: this.created,
      updated: this.updated,
      score: this.score
    };
  }

  static fromJSON(json) {
    const entity = new Entity(json.type, json.name, {
      version: json.version,
      attributes: json.attributes,
      tags: json.tags,
      metadata: json.metadata
    });
    entity.id = json.id;
    entity.state = json.state;
    entity.relationships = json.relationships;
    entity.created = json.created;
    entity.updated = json.updated;
    entity.score = json.score;
    return entity;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY FACTORY
// ═══════════════════════════════════════════════════════════════════════════

class EntityFactory {
  constructor() {
    this.templates = new Map();
  }

  registerTemplate(type, template) {
    this.templates.set(type, template);
  }

  create(type, name, options = {}) {
    const template = this.templates.get(type);
    const merged = template ? { ...template, ...options } : options;
    return new Entity(type, name, merged);
  }

  createAGI(name, options = {}) {
    return this.create(EntityType.AGI, name, {
      ...options,
      tags: ['agi', 'intelligent', ...(options.tags || [])]
    });
  }

  createSDK(name, options = {}) {
    return this.create(EntityType.SDK, name, {
      ...options,
      tags: ['sdk', 'library', ...(options.tags || [])]
    });
  }

  createProtocol(name, options = {}) {
    return this.create(EntityType.PROTOCOL, name, {
      ...options,
      tags: ['protocol', ...(options.tags || [])]
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY STORE
// ═══════════════════════════════════════════════════════════════════════════

class EntityStore extends EventEmitter {
  constructor() {
    super();
    this.entities = new Map();
    this.indexes = {
      byType: new Map(),
      byTag: new Map(),
      byState: new Map()
    };
  }

  add(entity) {
    if (this.entities.has(entity.id)) {
      throw new Error(`Entity ${entity.id} already exists`);
    }

    this.entities.set(entity.id, entity);
    this._addToIndexes(entity);
    this.emit('added', entity);
    return entity;
  }

  get(id) {
    return this.entities.get(id) || null;
  }

  update(id, updates) {
    const entity = this.entities.get(id);
    if (!entity) return null;

    this._removeFromIndexes(entity);

    if (updates.attributes) {
      for (const [key, value] of Object.entries(updates.attributes)) {
        entity.setAttribute(key, value);
      }
    }

    if (updates.tags) {
      for (const tag of updates.tags) {
        entity.addTag(tag);
      }
    }

    if (updates.metadata) {
      entity.metadata = { ...entity.metadata, ...updates.metadata };
    }

    entity.updated = Date.now();
    this._addToIndexes(entity);
    this.emit('updated', entity);
    return entity;
  }

  remove(id) {
    const entity = this.entities.get(id);
    if (!entity) return false;

    this._removeFromIndexes(entity);
    this.entities.delete(id);
    this.emit('removed', entity);
    return true;
  }

  _addToIndexes(entity) {
    // Type index
    if (!this.indexes.byType.has(entity.type)) {
      this.indexes.byType.set(entity.type, new Set());
    }
    this.indexes.byType.get(entity.type).add(entity.id);

    // Tag index
    for (const tag of entity.tags) {
      if (!this.indexes.byTag.has(tag)) {
        this.indexes.byTag.set(tag, new Set());
      }
      this.indexes.byTag.get(tag).add(entity.id);
    }

    // State index
    if (!this.indexes.byState.has(entity.state)) {
      this.indexes.byState.set(entity.state, new Set());
    }
    this.indexes.byState.get(entity.state).add(entity.id);
  }

  _removeFromIndexes(entity) {
    // Type index
    const typeSet = this.indexes.byType.get(entity.type);
    if (typeSet) typeSet.delete(entity.id);

    // Tag index
    for (const tag of entity.tags) {
      const tagSet = this.indexes.byTag.get(tag);
      if (tagSet) tagSet.delete(entity.id);
    }

    // State index
    const stateSet = this.indexes.byState.get(entity.state);
    if (stateSet) stateSet.delete(entity.id);
  }

  findByType(type) {
    const ids = this.indexes.byType.get(type) || new Set();
    return Array.from(ids).map(id => this.entities.get(id));
  }

  findByTag(tag) {
    const ids = this.indexes.byTag.get(tag) || new Set();
    return Array.from(ids).map(id => this.entities.get(id));
  }

  findByState(state) {
    const ids = this.indexes.byState.get(state) || new Set();
    return Array.from(ids).map(id => this.entities.get(id));
  }

  query(criteria) {
    let results = Array.from(this.entities.values());

    if (criteria.type) {
      results = results.filter(e => e.type === criteria.type);
    }

    if (criteria.state) {
      results = results.filter(e => e.state === criteria.state);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(e =>
        criteria.tags.every(tag => e.hasTag(tag))
      );
    }

    if (criteria.minScore !== undefined) {
      results = results.filter(e => e.score >= criteria.minScore);
    }

    if (criteria.attribute) {
      const { key, value, operator = '=' } = criteria.attribute;
      results = results.filter(e => {
        const attrValue = e.getAttribute(key);
        switch (operator) {
          case '=': return attrValue === value;
          case '!=': return attrValue !== value;
          case '>': return attrValue > value;
          case '<': return attrValue < value;
          case 'contains': return String(attrValue).includes(value);
          default: return true;
        }
      });
    }

    // Sort by φ-weighted score
    results.sort((a, b) => b.score - a.score);

    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  getRelated(id, relationshipType = null) {
    const entity = this.entities.get(id);
    if (!entity) return [];

    const relationships = entity.getRelationships(relationshipType);
    return relationships
      .map(r => this.entities.get(r.target))
      .filter(Boolean);
  }

  status() {
    const byType = {};
    for (const [type, ids] of this.indexes.byType) {
      byType[type] = ids.size;
    }

    const byState = {};
    for (const [state, ids] of this.indexes.byState) {
      byState[state] = ids.size;
    }

    return {
      total: this.entities.size,
      byType,
      byState,
      tagCount: this.indexes.byTag.size
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY MANAGER
// ═══════════════════════════════════════════════════════════════════════════

class EntityManager extends EventEmitter {
  constructor() {
    super();
    this.store = new EntityStore();
    this.factory = new EntityFactory();

    // Forward store events
    this.store.on('added', (e) => this.emit('entity-added', e));
    this.store.on('updated', (e) => this.emit('entity-updated', e));
    this.store.on('removed', (e) => this.emit('entity-removed', e));
  }

  create(type, name, options = {}) {
    const entity = this.factory.create(type, name, options);
    return this.store.add(entity);
  }

  get(id) {
    return this.store.get(id);
  }

  update(id, updates) {
    return this.store.update(id, updates);
  }

  remove(id) {
    return this.store.remove(id);
  }

  query(criteria) {
    return this.store.query(criteria);
  }

  link(sourceId, targetId, relationshipType, metadata = {}) {
    const source = this.store.get(sourceId);
    if (!source) throw new Error(`Source entity ${sourceId} not found`);
    if (!this.store.get(targetId)) throw new Error(`Target entity ${targetId} not found`);

    source.addRelationship(targetId, relationshipType, metadata);
    this.emit('entities-linked', { source: sourceId, target: targetId, type: relationshipType });
    return source;
  }

  getRelated(id, relationshipType = null) {
    return this.store.getRelated(id, relationshipType);
  }

  status() {
    return this.store.status();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  EntityType,
  EntityState,
  Entity,
  EntityFactory,
  EntityStore,
  EntityManager
};
