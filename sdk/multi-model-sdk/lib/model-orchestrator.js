import { ModelRegistry } from './model-registry.js';
import { ProviderRouter } from './provider-router.js';
import { FallbackChain } from './fallback-chain.js';
import { ContextManager } from './context-manager.js';
import { InferenceUnifier } from './inference-unifier.js';

export class ModelOrchestrator {
  constructor(config = {}) {
    this.registry = config.registry || new ModelRegistry();
    this.router = config.router || new ProviderRouter(this.registry);
    this.fallbackChain = config.fallbackChain || new FallbackChain();
    this.contextManager = config.contextManager || new ContextManager();
    this.unifier = config.unifier || new InferenceUnifier();
    this.metrics = { routed: 0, failed: 0 };
  }

  registerModel(model) {
    return this.registry.register(model);
  }

  route(request = {}) {
    return this.router.route(request);
  }

  infer(request = {}, handlers = []) {
    const route = this.route(request);
    if (!route.routed) {
      this.metrics.failed++;
      return { success: false, route };
    }

    const contextId = request.contextId || request.workflowId || 'default';
    this.contextManager.append(contextId, {
      type: 'route',
      route,
      payloadDigest: JSON.stringify(request.payload || {}).slice(0, 120),
    });

    const chainResult = this.fallbackChain.execute(handlers, {
      ...request,
      route,
    });

    if (!chainResult.success) {
      this.metrics.failed++;
      return { success: false, route, fallback: chainResult };
    }

    this.metrics.routed++;
    const normalized = this.unifier.normalize(chainResult.result, route);
    this.contextManager.append(contextId, { type: 'result', normalized });
    return { success: true, route, result: normalized, fallback: chainResult };
  }

  getMetrics() {
    return {
      ...this.metrics,
      contexts: this.contextManager.contexts.size,
      models: this.registry.models.size,
    };
  }
}

export default ModelOrchestrator;
