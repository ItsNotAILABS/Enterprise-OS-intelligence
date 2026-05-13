/**
 * MORPHIC FIELD SDK
 * RSHIP-2026-MORPHIC-FIELD-001
 *
 * Morphogenetic field modeling for AGI systems. Implements field resonance,
 * morphic inheritance, and φ-weighted pattern propagation for emergent
 * collective intelligence.
 *
 * @module morphic-field-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;

// ═══════════════════════════════════════════════════════════════════════════
// FIELD TYPES
// ═══════════════════════════════════════════════════════════════════════════

const FieldType = {
  BEHAVIORAL: 'behavioral',
  STRUCTURAL: 'structural',
  COGNITIVE: 'cognitive',
  COLLECTIVE: 'collective'
};

const ResonanceMode = {
  HARMONIC: 'harmonic',
  CHAOTIC: 'chaotic',
  ENTRAINING: 'entraining',
  DECOUPLED: 'decoupled'
};

// ═══════════════════════════════════════════════════════════════════════════
// MORPHIC PATTERN
// ═══════════════════════════════════════════════════════════════════════════

class MorphicPattern {
  constructor(id, template, options = {}) {
    this.id = id;
    this.template = template;
    this.strength = options.strength || 1.0;
    this.frequency = options.frequency || SCHUMANN_HZ;
    this.inheritance = [];
    this.instances = new Set();
    this.mutations = [];
    this.created = Date.now();
    this.lastResonance = Date.now();
    this.resonanceCount = 0;
  }

  inherit(parentPattern) {
    this.inheritance.push(parentPattern.id);
    this.template = this._mutate(parentPattern.template, 0.1);
    this.frequency = parentPattern.frequency * PHI / (PHI + 1);
  }

  _mutate(template, rate) {
    if (typeof template === 'object') {
      const mutated = Array.isArray(template) ? [...template] : { ...template };
      for (const key in mutated) {
        if (Math.random() < rate) {
          if (typeof mutated[key] === 'number') {
            mutated[key] *= (1 + (Math.random() - 0.5) * rate);
          }
        }
      }
      return mutated;
    }
    return template;
  }

  registerInstance(instanceId) {
    this.instances.add(instanceId);
    this.strength += 0.01;
  }

  unregisterInstance(instanceId) {
    this.instances.delete(instanceId);
    this.strength = Math.max(0.1, this.strength - 0.01);
  }

  resonate() {
    this.lastResonance = Date.now();
    this.resonanceCount++;
    this.strength = Math.min(10, this.strength + 0.001 * this.instances.size);
  }

  decay(rate = 0.0001) {
    const timeSinceResonance = Date.now() - this.lastResonance;
    this.strength *= Math.exp(-rate * timeSinceResonance / 1000);
  }

  similarity(other) {
    if (typeof this.template !== typeof other.template) return 0;
    if (typeof this.template === 'object') {
      const keys1 = Object.keys(this.template);
      const keys2 = Object.keys(other.template);
      const commonKeys = keys1.filter(k => keys2.includes(k));
      return commonKeys.length / Math.max(keys1.length, keys2.length);
    }
    return this.template === other.template ? 1 : 0;
  }

  toJSON() {
    return {
      id: this.id,
      template: this.template,
      strength: this.strength,
      frequency: this.frequency,
      inheritanceDepth: this.inheritance.length,
      instanceCount: this.instances.size,
      resonanceCount: this.resonanceCount
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MORPHIC FIELD
// ═══════════════════════════════════════════════════════════════════════════

class MorphicField extends EventEmitter {
  constructor(id, type, options = {}) {
    super();
    this.id = id;
    this.type = type;
    this.patterns = new Map();
    this.resonanceMode = ResonanceMode.HARMONIC;
    this.fieldStrength = 1.0;
    this.coherence = 1.0;
    this.frequency = options.frequency || SCHUMANN_HZ;
    this.coupling = new Map();
    this.created = Date.now();
    this.metrics = {
      patternsCreated: 0,
      resonanceEvents: 0,
      inheritanceEvents: 0
    };
  }

  addPattern(template, options = {}) {
    const id = options.id || crypto.randomUUID();
    const pattern = new MorphicPattern(id, template, {
      ...options,
      frequency: options.frequency || this.frequency
    });
    this.patterns.set(id, pattern);
    this.metrics.patternsCreated++;
    this.emit('pattern-added', { pattern: pattern.toJSON() });
    return pattern;
  }

  getPattern(id) {
    return this.patterns.get(id);
  }

  inheritPattern(childTemplate, parentId, options = {}) {
    const parent = this.patterns.get(parentId);
    if (!parent) return { success: false, reason: 'Parent not found' };
    const child = this.addPattern(childTemplate, options);
    child.inherit(parent);
    this.metrics.inheritanceEvents++;
    this.emit('pattern-inherited', { childId: child.id, parentId });
    return { success: true, pattern: child };
  }

  resonate() {
    for (const [id, pattern] of this.patterns) {
      pattern.resonate();
    }
    this._updateCoherence();
    this.metrics.resonanceEvents++;
    this.emit('resonance', { coherence: this.coherence, mode: this.resonanceMode });
  }

  _updateCoherence() {
    if (this.patterns.size < 2) {
      this.coherence = 1.0;
      return;
    }
    let totalSimilarity = 0;
    let comparisons = 0;
    const patternArray = Array.from(this.patterns.values());
    for (let i = 0; i < patternArray.length; i++) {
      for (let j = i + 1; j < patternArray.length; j++) {
        totalSimilarity += patternArray[i].similarity(patternArray[j]);
        comparisons++;
      }
    }
    this.coherence = comparisons > 0 ? totalSimilarity / comparisons : 1.0;
    if (this.coherence > 0.8) this.resonanceMode = ResonanceMode.HARMONIC;
    else if (this.coherence > 0.5) this.resonanceMode = ResonanceMode.ENTRAINING;
    else if (this.coherence > 0.2) this.resonanceMode = ResonanceMode.CHAOTIC;
    else this.resonanceMode = ResonanceMode.DECOUPLED;
  }

  coupleWith(otherField, strength = 1.0) {
    this.coupling.set(otherField.id, { field: otherField, strength });
    otherField.coupling.set(this.id, { field: this, strength });
    this.emit('coupled', { otherId: otherField.id, strength });
  }

  propagate(patternId) {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;
    for (const [id, coupling] of this.coupling) {
      const propagationStrength = pattern.strength * coupling.strength * this.fieldStrength;
      if (propagationStrength > 0.5) {
        const newPattern = coupling.field.addPattern(pattern.template, {
          strength: propagationStrength,
          frequency: pattern.frequency * coupling.strength
        });
        newPattern.inherit(pattern);
        this.emit('pattern-propagated', { from: this.id, to: id, patternId: newPattern.id });
      }
    }
  }

  findResonantPatterns(template, threshold = 0.7) {
    const testPattern = new MorphicPattern('test', template);
    const resonant = [];
    for (const [id, pattern] of this.patterns) {
      const similarity = pattern.similarity(testPattern);
      if (similarity >= threshold) resonant.push({ pattern, similarity });
    }
    resonant.sort((a, b) => (b.similarity * b.pattern.strength) - (a.similarity * a.pattern.strength));
    return resonant;
  }

  decay(rate = 0.0001) {
    for (const [id, pattern] of this.patterns) pattern.decay(rate);
    this.fieldStrength *= 0.9999;
  }

  status() {
    let totalStrength = 0;
    for (const [id, pattern] of this.patterns) totalStrength += pattern.strength;
    return {
      id: this.id,
      type: this.type,
      patternCount: this.patterns.size,
      resonanceMode: this.resonanceMode,
      fieldStrength: this.fieldStrength,
      coherence: this.coherence,
      frequency: this.frequency,
      couplingCount: this.coupling.size,
      averagePatternStrength: this.patterns.size > 0 ? totalStrength / this.patterns.size : 0,
      metrics: { ...this.metrics }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MORPHIC FIELD SDK
// ═══════════════════════════════════════════════════════════════════════════

class MorphicFieldSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = 'RSHIP-2026-MORPHIC-FIELD-001';
    this.name = 'MorphicFieldSDK';
    this.version = '1.0.0';
    this.config = config;
    this.fields = new Map();
    this.state = 'initialized';
    this.running = false;
    this._resonanceInterval = null;
  }

  async start() {
    this.running = true;
    this.state = 'running';
    this._resonanceInterval = setInterval(() => {
      for (const [id, field] of this.fields) {
        field.resonate();
        field.decay();
      }
    }, 1000 / SCHUMANN_HZ);
    this.emit('started');
  }

  async stop() {
    this.running = false;
    this.state = 'stopped';
    if (this._resonanceInterval) {
      clearInterval(this._resonanceInterval);
      this._resonanceInterval = null;
    }
    this.emit('stopped');
  }

  createField(id, type, options = {}) {
    const field = new MorphicField(id, type, options);
    this.fields.set(id, field);
    field.on('pattern-added', (e) => this.emit('pattern-added', { fieldId: id, ...e }));
    field.on('resonance', (e) => this.emit('resonance', { fieldId: id, ...e }));
    field.on('pattern-propagated', (e) => this.emit('pattern-propagated', e));
    this.emit('field-created', { id, type });
    return field;
  }

  getField(id) {
    return this.fields.get(id) || null;
  }

  status() {
    const fieldStats = {};
    for (const [id, field] of this.fields) fieldStats[id] = field.status();
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      state: this.state,
      fieldCount: this.fields.size,
      fields: fieldStats
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  FieldType,
  ResonanceMode,
  MorphicPattern,
  MorphicField,
  MorphicFieldSDK
};
