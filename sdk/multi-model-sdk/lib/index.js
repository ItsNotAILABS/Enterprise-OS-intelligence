import { ModelOrchestrator } from './model-orchestrator.js';
import { ProviderRouter } from './provider-router.js';
import { InferenceUnifier } from './inference-unifier.js';
import { FallbackChain } from './fallback-chain.js';
import { ModelRegistry } from './model-registry.js';
import { ContextManager } from './context-manager.js';

export { ModelOrchestrator, ProviderRouter, InferenceUnifier, FallbackChain, ModelRegistry, ContextManager };

export function createMultiModelOrchestrator(config = {}) {
  return new ModelOrchestrator(config);
}

export function createDefaultMultiModelStack() {
  const registry = new ModelRegistry();

  registry.register({
    id: 'medina-core-reasoner',
    provider: 'internal',
    taskTypes: ['reasoning', 'analysis', 'workflow'],
    lanes: ['interior'],
    securityLevel: 'critical',
    latencyMs: 1400,
    reliability: 0.96,
  });

  registry.register({
    id: 'medina-edge-operator',
    provider: 'internal',
    taskTypes: ['workflow', 'ops', 'routing'],
    lanes: ['exterior', 'interior'],
    securityLevel: 'hardened',
    latencyMs: 900,
    reliability: 0.92,
  });

  registry.register({
    id: 'partner-generalist',
    provider: 'partner',
    taskTypes: ['general', 'creative', 'coding'],
    lanes: ['exterior'],
    securityLevel: 'standard',
    latencyMs: 700,
    reliability: 0.88,
  });

  return new ModelOrchestrator({
    registry,
    router: new ProviderRouter(registry),
    fallbackChain: new FallbackChain(),
    contextManager: new ContextManager(),
    unifier: new InferenceUnifier(),
  });
}
