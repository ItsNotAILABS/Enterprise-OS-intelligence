/**
 * ORGANISM BOOTSTRAP SDK
 * RSHIP-2026-ORGANISM-BOOTSTRAP-001
 *
 * Organism Bootstrap provides the initialization and lifecycle management
 * for AGI organisms. Implements self-bootstrapping sequences, dependency
 * injection, and φ-weighted startup ordering.
 *
 * @module organism-bootstrap
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// LIFECYCLE STATES
// ═══════════════════════════════════════════════════════════════════════════

const LifecycleState = {
  CREATED: 'created',
  INITIALIZING: 'initializing',
  READY: 'ready',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  FAILED: 'failed'
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

class BootstrapComponent {
  constructor(name, options = {}) {
    this.name = name;
    this.priority = options.priority || 0;
    this.dependencies = options.dependencies || [];
    this.factory = options.factory;
    this.instance = null;
    this.state = LifecycleState.CREATED;
    this.startTime = null;
    this.stopTime = null;
    this.error = null;
  }

  async initialize(context) {
    this.state = LifecycleState.INITIALIZING;
    try {
      if (this.factory) {
        this.instance = await this.factory(context);
      }
      this.state = LifecycleState.READY;
      return this.instance;
    } catch (error) {
      this.state = LifecycleState.FAILED;
      this.error = error;
      throw error;
    }
  }

  async start() {
    if (this.state !== LifecycleState.READY) {
      throw new Error(`Cannot start component in state: ${this.state}`);
    }

    this.state = LifecycleState.STARTING;
    this.startTime = Date.now();

    try {
      if (this.instance && typeof this.instance.start === 'function') {
        await this.instance.start();
      }
      this.state = LifecycleState.RUNNING;
    } catch (error) {
      this.state = LifecycleState.FAILED;
      this.error = error;
      throw error;
    }
  }

  async stop() {
    if (this.state !== LifecycleState.RUNNING) {
      return;
    }

    this.state = LifecycleState.STOPPING;

    try {
      if (this.instance && typeof this.instance.stop === 'function') {
        await this.instance.stop();
      }
      this.state = LifecycleState.STOPPED;
      this.stopTime = Date.now();
    } catch (error) {
      this.state = LifecycleState.FAILED;
      this.error = error;
      throw error;
    }
  }

  uptime() {
    if (!this.startTime) return 0;
    const end = this.stopTime || Date.now();
    return end - this.startTime;
  }

  status() {
    return {
      name: this.name,
      state: this.state,
      priority: this.priority,
      dependencies: this.dependencies,
      uptime: this.uptime(),
      hasInstance: this.instance !== null,
      error: this.error ? this.error.message : null
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPENDENCY RESOLVER
// ═══════════════════════════════════════════════════════════════════════════

class DependencyResolver {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(name, priority = 0) {
    this.nodes.set(name, { priority, inDegree: 0 });
    if (!this.edges.has(name)) {
      this.edges.set(name, []);
    }
  }

  addDependency(from, to) {
    // from depends on to
    if (!this.edges.has(to)) {
      this.edges.set(to, []);
    }
    this.edges.get(to).push(from);

    const node = this.nodes.get(from);
    if (node) {
      node.inDegree++;
    }
  }

  resolve() {
    // Kahn's algorithm with priority ordering
    const result = [];
    const queue = [];

    // Find nodes with no dependencies
    for (const [name, node] of this.nodes) {
      if (node.inDegree === 0) {
        queue.push({ name, priority: node.priority });
      }
    }

    // Sort by priority (higher first), then by φ-weighted order
    queue.sort((a, b) => b.priority - a.priority);

    while (queue.length > 0) {
      // Sort queue by priority each iteration
      queue.sort((a, b) => b.priority - a.priority);

      const { name } = queue.shift();
      result.push(name);

      // Remove edges from this node
      const dependents = this.edges.get(name) || [];
      for (const dependent of dependents) {
        const node = this.nodes.get(dependent);
        if (node) {
          node.inDegree--;
          if (node.inDegree === 0) {
            queue.push({ name: dependent, priority: node.priority });
          }
        }
      }
    }

    // Check for cycles
    if (result.length !== this.nodes.size) {
      const missing = Array.from(this.nodes.keys()).filter(n => !result.includes(n));
      throw new Error(`Circular dependency detected involving: ${missing.join(', ')}`);
    }

    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOTSTRAP CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

class BootstrapContext {
  constructor() {
    this.instances = new Map();
    this.config = new Map();
    this.services = new Map();
  }

  register(name, instance) {
    this.instances.set(name, instance);
  }

  get(name) {
    return this.instances.get(name);
  }

  setConfig(key, value) {
    this.config.set(key, value);
  }

  getConfig(key, defaultValue = null) {
    return this.config.has(key) ? this.config.get(key) : defaultValue;
  }

  registerService(name, service) {
    this.services.set(name, service);
  }

  getService(name) {
    return this.services.get(name);
  }

  inject(target) {
    // Simple dependency injection
    if (typeof target === 'function') {
      const paramNames = this._getParamNames(target);
      const args = paramNames.map(name =>
        this.instances.get(name) || this.services.get(name)
      );
      return target(...args);
    }
    return target;
  }

  _getParamNames(fn) {
    const match = fn.toString().match(/\(([^)]*)\)/);
    if (!match) return [];
    return match[1].split(',').map(p => p.trim()).filter(p => p.length > 0);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ORGANISM BOOTSTRAP
// ═══════════════════════════════════════════════════════════════════════════

class OrganismBootstrap extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.components = new Map();
    this.context = new BootstrapContext();
    this.state = LifecycleState.CREATED;
    this.bootOrder = [];
    this.shutdownOrder = [];
    this.healthChecks = new Map();
    this.startTime = null;
    this.options = options;
  }

  register(name, options = {}) {
    const component = new BootstrapComponent(name, options);
    this.components.set(name, component);
    return this;
  }

  registerHealthCheck(name, checkFn) {
    this.healthChecks.set(name, checkFn);
    return this;
  }

  async boot() {
    this.state = LifecycleState.INITIALIZING;
    this.emit('booting');

    try {
      // Resolve dependencies
      const resolver = new DependencyResolver();
      for (const [name, component] of this.components) {
        resolver.addNode(name, component.priority);
        for (const dep of component.dependencies) {
          resolver.addDependency(name, dep);
        }
      }

      this.bootOrder = resolver.resolve();
      this.shutdownOrder = [...this.bootOrder].reverse();

      // Initialize in order
      for (const name of this.bootOrder) {
        const component = this.components.get(name);
        this.emit('component-initializing', { name });

        const instance = await component.initialize(this.context);
        if (instance) {
          this.context.register(name, instance);
        }

        this.emit('component-initialized', { name });
      }

      this.state = LifecycleState.READY;
      this.emit('ready');

      // Start all components
      await this.start();

    } catch (error) {
      this.state = LifecycleState.FAILED;
      this.emit('error', error);
      throw error;
    }
  }

  async start() {
    if (this.state !== LifecycleState.READY) {
      throw new Error(`Cannot start in state: ${this.state}`);
    }

    this.state = LifecycleState.STARTING;
    this.startTime = Date.now();
    this.emit('starting');

    for (const name of this.bootOrder) {
      const component = this.components.get(name);
      this.emit('component-starting', { name });
      await component.start();
      this.emit('component-started', { name });
    }

    this.state = LifecycleState.RUNNING;
    this.emit('started');
  }

  async shutdown() {
    if (this.state !== LifecycleState.RUNNING) {
      return;
    }

    this.state = LifecycleState.STOPPING;
    this.emit('stopping');

    // Stop in reverse order
    for (const name of this.shutdownOrder) {
      const component = this.components.get(name);
      this.emit('component-stopping', { name });

      try {
        await component.stop();
        this.emit('component-stopped', { name });
      } catch (error) {
        this.emit('component-stop-error', { name, error });
      }
    }

    this.state = LifecycleState.STOPPED;
    this.emit('stopped');
  }

  async healthCheck() {
    const results = {};

    for (const [name, checkFn] of this.healthChecks) {
      try {
        const result = await checkFn(this.context);
        results[name] = { healthy: true, ...result };
      } catch (error) {
        results[name] = { healthy: false, error: error.message };
      }
    }

    // Check component states
    for (const [name, component] of this.components) {
      if (component.state !== LifecycleState.RUNNING) {
        results[`component:${name}`] = {
          healthy: false,
          state: component.state,
          error: component.error?.message
        };
      }
    }

    const healthy = Object.values(results).every(r => r.healthy !== false);
    return { healthy, checks: results };
  }

  uptime() {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  status() {
    const componentStatuses = {};
    for (const [name, component] of this.components) {
      componentStatuses[name] = component.status();
    }

    return {
      name: this.name,
      state: this.state,
      uptime: this.uptime(),
      componentCount: this.components.size,
      bootOrder: this.bootOrder,
      components: componentStatuses
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  LifecycleState,
  BootstrapComponent,
  DependencyResolver,
  BootstrapContext,
  OrganismBootstrap
};
