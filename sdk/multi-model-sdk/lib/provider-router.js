export class ProviderRouter {
  constructor(registry) {
    this.registry = registry;
  }

  route(request = {}) {
    const lane = request.lane || 'interior';
    const taskType = request.taskType || 'general';
    const securityLevel = request.securityLevel || 'standard';

    const best = this.registry.best({ lane, taskType, securityLevel });
    if (!best) {
      return { routed: false, reason: 'NO_MODEL_AVAILABLE', lane, taskType, securityLevel };
    }

    return {
      routed: true,
      modelId: best.id,
      provider: best.provider,
      lane,
      taskType,
      securityLevel,
    };
  }
}

export default ProviderRouter;
