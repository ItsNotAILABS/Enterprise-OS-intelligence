/**
 * @medina/multi-engine-orchestrator — Failover Controller
 *
 * Manages engine failover, health monitoring, circuit breaking,
 * and automatic recovery. Ensures continuous inference availability
 * across all engine classes.
 *
 * @module @medina/multi-engine-orchestrator/failover-controller
 */

import crypto from 'node:crypto';
import { ENGINE_STATES } from './engine-registry.js';

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER STATES
// ═══════════════════════════════════════════════════════════════════════════════

const CIRCUIT_STATES = {
  CLOSED: 'closed',       // Normal operation
  OPEN: 'open',           // Failing, requests rejected
  HALF_OPEN: 'half-open', // Testing recovery
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAILOVER CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

export class FailoverController {
  constructor(registry, config = {}) {
    this.registry = registry;
    this.failureThreshold = config.failureThreshold || 5;
    this.recoveryTimeMs = config.recoveryTimeMs || 30000;
    this.healthCheckIntervalMs = config.healthCheckIntervalMs || 5000;
    this.maxConsecutiveFailures = config.maxConsecutiveFailures || 3;

    /** @type {Map<string, CircuitBreaker>} engineId → circuit */
    this.circuits = new Map();
    /** @type {Map<string, FailoverChain>} engineClass → chain */
    this.failoverChains = new Map();
    this.events = [];
  }

  /**
   * Records a success for an engine.
   */
  recordSuccess(engineId) {
    const circuit = this._getCircuit(engineId);
    circuit.consecutiveFailures = 0;
    circuit.totalSuccesses++;
    circuit.lastSuccess = Date.now();

    if (circuit.state === CIRCUIT_STATES.HALF_OPEN) {
      circuit.state = CIRCUIT_STATES.CLOSED;
      this.registry.setState(engineId, ENGINE_STATES.IDLE);
      this._recordEvent('circuit-closed', engineId);
    }
  }

  /**
   * Records a failure for an engine.
   */
  recordFailure(engineId, error = {}) {
    const circuit = this._getCircuit(engineId);
    circuit.consecutiveFailures++;
    circuit.totalFailures++;
    circuit.lastFailure = Date.now();
    circuit.lastError = error.message || 'unknown';

    if (circuit.consecutiveFailures >= this.maxConsecutiveFailures) {
      if (circuit.state === CIRCUIT_STATES.CLOSED) {
        circuit.state = CIRCUIT_STATES.OPEN;
        circuit.openedAt = Date.now();
        this.registry.setState(engineId, ENGINE_STATES.FAILED);
        this._recordEvent('circuit-opened', engineId, error);
      }
    }

    return this._getFailoverTarget(engineId);
  }

  /**
   * Checks if an engine is available (circuit not open).
   */
  isAvailable(engineId) {
    const circuit = this._getCircuit(engineId);

    if (circuit.state === CIRCUIT_STATES.CLOSED) return true;

    if (circuit.state === CIRCUIT_STATES.OPEN) {
      const elapsed = Date.now() - circuit.openedAt;
      if (elapsed >= this.recoveryTimeMs) {
        circuit.state = CIRCUIT_STATES.HALF_OPEN;
        this._recordEvent('circuit-half-open', engineId);
        return true; // Allow one test request
      }
      return false;
    }

    // HALF_OPEN: allow test requests
    return true;
  }

  /**
   * Registers a failover chain for an engine class.
   * When primary fails, requests route to next in chain.
   */
  registerFailoverChain(engineClass, engineIds) {
    this.failoverChains.set(engineClass, {
      class: engineClass,
      engines: engineIds,
      currentPrimary: 0,
      createdAt: Date.now()
    });
  }

  /**
   * Gets the failover target when an engine fails.
   */
  _getFailoverTarget(failedEngineId) {
    const engine = this.registry.get(failedEngineId);
    if (!engine) return null;

    const chain = this.failoverChains.get(engine.class);
    if (!chain) {
      // Find any available engine in same class
      const alternatives = this.registry.find({ class: engine.class })
        .filter(e => e.id !== failedEngineId && this.isAvailable(e.id));
      return alternatives.length > 0 ? alternatives[0] : null;
    }

    // Walk chain for next available
    for (const id of chain.engines) {
      if (id !== failedEngineId && this.isAvailable(id)) {
        return this.registry.get(id);
      }
    }

    return null;
  }

  _getCircuit(engineId) {
    if (!this.circuits.has(engineId)) {
      this.circuits.set(engineId, {
        engineId,
        state: CIRCUIT_STATES.CLOSED,
        consecutiveFailures: 0,
        totalFailures: 0,
        totalSuccesses: 0,
        lastFailure: null,
        lastSuccess: null,
        lastError: null,
        openedAt: null,
      });
    }
    return this.circuits.get(engineId);
  }

  _recordEvent(type, engineId, data = {}) {
    this.events.push({
      id: crypto.randomUUID(),
      type,
      engineId,
      data,
      timestamp: Date.now()
    });
    if (this.events.length > 1000) this.events.shift();
  }

  /**
   * Returns health status of all engines.
   */
  getHealthReport() {
    const circuits = [...this.circuits.values()];
    return {
      totalEngines: circuits.length,
      healthy: circuits.filter(c => c.state === CIRCUIT_STATES.CLOSED).length,
      degraded: circuits.filter(c => c.state === CIRCUIT_STATES.HALF_OPEN).length,
      failed: circuits.filter(c => c.state === CIRCUIT_STATES.OPEN).length,
      circuits: circuits.map(c => ({
        engineId: c.engineId,
        state: c.state,
        failures: c.totalFailures,
        successes: c.totalSuccesses,
        reliability: c.totalSuccesses + c.totalFailures > 0
          ? c.totalSuccesses / (c.totalSuccesses + c.totalFailures)
          : 1.0,
      })),
      recentEvents: this.events.slice(-20)
    };
  }
}
