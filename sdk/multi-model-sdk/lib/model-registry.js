import { PHI_INV } from '../../../rship-framework.js';

export class ModelRegistry {
  constructor() {
    this.models = new Map();
  }

  register(model) {
    const normalized = {
      id: model.id,
      provider: model.provider || 'internal',
      taskTypes: model.taskTypes || ['general'],
      lanes: model.lanes || ['interior', 'exterior'],
      securityLevel: model.securityLevel || 'standard',
      latencyMs: model.latencyMs || 1200,
      reliability: model.reliability ?? 0.9,
      weight: model.weight ?? PHI_INV,
    };
    this.models.set(normalized.id, normalized);
    return normalized;
  }

  get(modelId) {
    return this.models.get(modelId) || null;
  }

  list(filters = {}) {
    return Array.from(this.models.values()).filter(model => {
      if (filters.taskType && !model.taskTypes.includes(filters.taskType)) return false;
      if (filters.lane && !model.lanes.includes(filters.lane)) return false;
      if (filters.securityLevel) {
        const order = ['standard', 'hardened', 'critical'];
        return order.indexOf(model.securityLevel) >= order.indexOf(filters.securityLevel);
      }
      return true;
    });
  }

  best(filters = {}) {
    const candidates = this.list(filters);
    if (!candidates.length) return null;

    return candidates
      .map(model => ({
        model,
        score: (model.reliability * model.weight) - (model.latencyMs / 10000),
      }))
      .sort((a, b) => b.score - a.score)[0].model;
  }
}

export default ModelRegistry;
