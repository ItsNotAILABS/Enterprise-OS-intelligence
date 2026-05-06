export class ContextManager {
  constructor() {
    this.contexts = new Map();
  }

  get(contextId) {
    return this.contexts.get(contextId) || { contextId, history: [], meta: {} };
  }

  append(contextId, entry) {
    const ctx = this.get(contextId);
    ctx.history.push({ ...entry, timestamp: Date.now() });
    this.contexts.set(contextId, ctx);
    return ctx;
  }

  setMeta(contextId, key, value) {
    const ctx = this.get(contextId);
    ctx.meta[key] = value;
    this.contexts.set(contextId, ctx);
    return ctx;
  }
}

export default ContextManager;
