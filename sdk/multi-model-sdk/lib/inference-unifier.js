export class InferenceUnifier {
  normalize(raw = {}, route = {}) {
    return {
      success: raw.success !== false,
      modelId: raw.modelId || route.modelId || null,
      provider: raw.provider || route.provider || null,
      lane: route.lane || raw.lane || 'interior',
      securityLevel: route.securityLevel || raw.securityLevel || 'standard',
      output: raw.output ?? raw.response ?? null,
      usage: raw.usage || null,
      latencyMs: raw.latencyMs ?? null,
      timestamp: Date.now(),
    };
  }
}

export default InferenceUnifier;
