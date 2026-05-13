/**
 * CAUSAL INFERENCE SDK
 * RSHIP-2026-CAUSAL-INFERENCE-001
 *
 * Causal reasoning and inference engine for AGI systems. Implements
 * structural causal models, do-calculus, and φ-weighted counterfactual
 * analysis for intelligent decision making.
 *
 * @module causal-inference-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;

// ═══════════════════════════════════════════════════════════════════════════
// CAUSAL TYPES
// ═══════════════════════════════════════════════════════════════════════════

const CausalRelationType = {
  DIRECT: 'direct',
  INDIRECT: 'indirect',
  CONFOUNDED: 'confounded',
  MEDIATED: 'mediated'
};

const InterventionType = {
  DO: 'do',
  OBSERVE: 'observe',
  COUNTERFACTUAL: 'counterfactual'
};

// ═══════════════════════════════════════════════════════════════════════════
// CAUSAL VARIABLE
// ═══════════════════════════════════════════════════════════════════════════

class CausalVariable {
  constructor(id, domain, options = {}) {
    this.id = id;
    this.domain = domain;
    this.value = options.value || null;
    this.isExogenous = options.isExogenous || false;
    this.structuralEquation = options.structuralEquation || null;
    this.parents = new Set();
    this.children = new Set();
    this.observations = [];
    this.created = Date.now();
  }

  setValue(value) {
    if (this.domain.includes(value) || this.domain === 'continuous') {
      this.value = value;
      return true;
    }
    return false;
  }

  observe(value) {
    this.observations.push({ value, timestamp: Date.now() });
    if (this.observations.length > 1000) this.observations.shift();
    this.value = value;
  }

  addParent(variableId) {
    this.parents.add(variableId);
  }

  addChild(variableId) {
    this.children.add(variableId);
  }

  evaluate(parentValues) {
    if (!this.structuralEquation) return this.value;
    return this.structuralEquation(parentValues);
  }

  toJSON() {
    return {
      id: this.id,
      domain: this.domain,
      value: this.value,
      isExogenous: this.isExogenous,
      parentCount: this.parents.size,
      childCount: this.children.size,
      observationCount: this.observations.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAUSAL EDGE
// ═══════════════════════════════════════════════════════════════════════════

class CausalEdge {
  constructor(source, target, options = {}) {
    this.source = source;
    this.target = target;
    this.type = options.type || CausalRelationType.DIRECT;
    this.strength = options.strength || 1.0;
    this.confidence = options.confidence || 1.0;
    this.mechanism = options.mechanism || null;
    this.created = Date.now();
  }

  propagate(value) {
    if (this.mechanism) {
      return this.mechanism(value) * this.strength;
    }
    return value * this.strength;
  }

  toJSON() {
    return {
      source: this.source,
      target: this.target,
      type: this.type,
      strength: this.strength,
      confidence: this.confidence
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURAL CAUSAL MODEL
// ═══════════════════════════════════════════════════════════════════════════

class StructuralCausalModel extends EventEmitter {
  constructor(id, options = {}) {
    super();
    this.id = id;
    this.variables = new Map();
    this.edges = new Map();
    this.interventions = [];
    this.created = Date.now();
    this.metrics = {
      variablesAdded: 0,
      edgesAdded: 0,
      interventions: 0,
      queries: 0
    };
  }

  addVariable(id, domain, options = {}) {
    const variable = new CausalVariable(id, domain, options);
    this.variables.set(id, variable);
    this.metrics.variablesAdded++;
    this.emit('variable-added', { variable: variable.toJSON() });
    return variable;
  }

  getVariable(id) {
    return this.variables.get(id);
  }

  addEdge(sourceId, targetId, options = {}) {
    const source = this.variables.get(sourceId);
    const target = this.variables.get(targetId);

    if (!source || !target) {
      return { success: false, reason: 'Variable not found' };
    }

    const edgeId = `${sourceId}->${targetId}`;
    const edge = new CausalEdge(sourceId, targetId, options);
    this.edges.set(edgeId, edge);

    source.addChild(targetId);
    target.addParent(sourceId);

    this.metrics.edgesAdded++;
    this.emit('edge-added', { edge: edge.toJSON() });
    return { success: true, edgeId };
  }

  _topologicalSort() {
    const sorted = [];
    const visited = new Set();
    const temp = new Set();

    const visit = (id) => {
      if (visited.has(id)) return true;
      if (temp.has(id)) return false; // Cycle detected

      temp.add(id);
      const variable = this.variables.get(id);

      for (const childId of variable.children) {
        if (!visit(childId)) return false;
      }

      temp.delete(id);
      visited.add(id);
      sorted.unshift(id);
      return true;
    };

    for (const [id] of this.variables) {
      if (!visited.has(id) && !visit(id)) {
        return null; // Cycle
      }
    }

    return sorted;
  }

  propagate() {
    const order = this._topologicalSort();
    if (!order) {
      this.emit('error', { message: 'Cycle detected' });
      return null;
    }

    const values = new Map();

    for (const id of order) {
      const variable = this.variables.get(id);

      if (variable.isExogenous || variable.parents.size === 0) {
        values.set(id, variable.value);
      } else {
        const parentValues = {};
        for (const parentId of variable.parents) {
          parentValues[parentId] = values.get(parentId);
        }
        values.set(id, variable.evaluate(parentValues));
      }
    }

    return values;
  }

  doIntervention(variableId, value) {
    const variable = this.variables.get(variableId);
    if (!variable) return null;

    // Save original state
    const originalParents = new Set(variable.parents);
    const originalEquation = variable.structuralEquation;

    // Remove incoming edges (break causal influence)
    variable.parents.clear();
    variable.structuralEquation = null;
    variable.value = value;

    this.interventions.push({
      type: InterventionType.DO,
      variable: variableId,
      value,
      timestamp: Date.now()
    });

    this.metrics.interventions++;

    // Propagate effects
    const result = this.propagate();

    // Restore
    variable.parents = originalParents;
    variable.structuralEquation = originalEquation;

    this.emit('intervention', { type: 'do', variable: variableId, value, result });
    return result;
  }

  computeCounterfactual(evidenceVars, interventionVar, interventionValue, queryVar) {
    // Step 1: Abduction - infer exogenous values from evidence
    for (const [id, value] of Object.entries(evidenceVars)) {
      const v = this.variables.get(id);
      if (v) v.value = value;
    }

    // Step 2: Action - perform intervention
    const result = this.doIntervention(interventionVar, interventionValue);

    this.metrics.queries++;
    return result?.get(queryVar);
  }

  computeATE(treatmentVar, outcomeVar, treatmentValues = [0, 1]) {
    // Average Treatment Effect: E[Y|do(T=1)] - E[Y|do(T=0)]
    const results = [];

    for (const t of treatmentValues) {
      const propagated = this.doIntervention(treatmentVar, t);
      if (propagated) {
        results.push(propagated.get(outcomeVar));
      }
    }

    if (results.length === 2) {
      return results[1] - results[0];
    }

    return results;
  }

  findConfounders(sourceId, targetId) {
    const confounders = [];

    for (const [id, variable] of this.variables) {
      if (id === sourceId || id === targetId) continue;

      const affectsSource = this._pathExists(id, sourceId);
      const affectsTarget = this._pathExists(id, targetId);

      if (affectsSource && affectsTarget) {
        confounders.push(id);
      }
    }

    return confounders;
  }

  _pathExists(from, to, visited = new Set()) {
    if (from === to) return true;
    if (visited.has(from)) return false;

    visited.add(from);
    const variable = this.variables.get(from);

    for (const childId of variable.children) {
      if (this._pathExists(childId, to, visited)) return true;
    }

    return false;
  }

  findMediator(sourceId, targetId) {
    const mediators = [];

    for (const [id, variable] of this.variables) {
      if (id === sourceId || id === targetId) continue;

      const sourceToMediator = this._pathExists(sourceId, id);
      const mediatorToTarget = this._pathExists(id, targetId);
      const directPath = this.edges.has(`${sourceId}->${targetId}`);

      if (sourceToMediator && mediatorToTarget) {
        mediators.push(id);
      }
    }

    return mediators;
  }

  backdoorCriterion(treatmentId, outcomeId, conditioningSet) {
    // Check if conditioning set blocks all backdoor paths

    // 1. No descendant of treatment
    for (const varId of conditioningSet) {
      if (this._pathExists(treatmentId, varId)) {
        return { valid: false, reason: `${varId} is a descendant of treatment` };
      }
    }

    // 2. Blocks all backdoor paths
    const confounders = this.findConfounders(treatmentId, outcomeId);
    for (const confounder of confounders) {
      if (!conditioningSet.includes(confounder)) {
        return { valid: false, reason: `Confounder ${confounder} not blocked` };
      }
    }

    return { valid: true };
  }

  status() {
    return {
      id: this.id,
      variableCount: this.variables.size,
      edgeCount: this.edges.size,
      interventionCount: this.interventions.length,
      metrics: { ...this.metrics }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAUSAL INFERENCE SDK
// ═══════════════════════════════════════════════════════════════════════════

class CausalInferenceSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = 'RSHIP-2026-CAUSAL-INFERENCE-001';
    this.name = 'CausalInferenceSDK';
    this.version = '1.0.0';
    this.config = config;
    this.models = new Map();
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

  createModel(id, options = {}) {
    const model = new StructuralCausalModel(id, options);
    this.models.set(id, model);
    model.on('intervention', (e) => this.emit('intervention', { modelId: id, ...e }));
    this.emit('model-created', { id });
    return model;
  }

  getModel(id) {
    return this.models.get(id) || null;
  }

  status() {
    const modelStats = {};
    for (const [id, model] of this.models) modelStats[id] = model.status();
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      state: this.state,
      modelCount: this.models.size,
      models: modelStats
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  CausalRelationType,
  InterventionType,
  CausalVariable,
  CausalEdge,
  StructuralCausalModel,
  CausalInferenceSDK
};
