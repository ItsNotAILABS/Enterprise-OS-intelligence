/**
 * AEROLEX AGI — Airport Operations Intelligence
 *
 * Official Designation: RSHIP-2026-AEROLEX-001
 * Classification: Airport Operations & API Bridge AGI
 * Full Name: Aeronautical Executive Routing & Operations Logistics EXpert
 *
 * AEROLEX AGI extends the RSHIP framework with real-time airport operations
 * intelligence — gate management, delay propagation, API bridge routing,
 * and baggage tracking — modeled on M/D/1 queuing theory and directed graph
 * delay cascades.
 *
 * Capabilities:
 * - M/D/1 queuing model for gate and security throughput
 * - Directed delay propagation graph (cascade detection)
 * - Live API bridge metrics (requests, latency, saturation)
 * - Baggage reconciliation tracking with φ⁻¹ match decay
 * - Autonomous gate reallocation under disruption
 * - Predictive delay scoring via Bayesian inference
 *
 * Theory: CONCORDIA MACHINAE (Paper II) + STIGMERGY (Paper XX) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── M/D/1 Queue (Gate / Security throughput) ──────────────────────────────

class MD1Queue {
  constructor({ serviceRate, label = 'queue' }) {
    this.serviceRate = serviceRate; // passengers per minute
    this.label = label;
    this.queue = [];
    this.servedTotal = 0;
    this.waitTimes = [];
  }

  arrive(count = 1) {
    const arrival = { count, arrivedAt: Date.now() };
    this.queue.push(arrival);
    return arrival;
  }

  tick(dt = 1) {
    const capacity = this.serviceRate * dt;
    let processed = 0;
    const now = Date.now();

    while (this.queue.length > 0 && processed < capacity) {
      const batch = this.queue[0];
      const toProcess = Math.min(batch.count, capacity - processed);
      batch.count -= toProcess;
      processed += toProcess;
      this.servedTotal += toProcess;
      const wait = (now - batch.arrivedAt) / 1000; // seconds
      this.waitTimes.push(wait);
      if (this.waitTimes.length > 500) this.waitTimes.shift();
      if (batch.count <= 0) this.queue.shift();
    }

    return { processed, queueLength: this.totalWaiting() };
  }

  totalWaiting() {
    return this.queue.reduce((sum, b) => sum + b.count, 0);
  }

  avgWaitTime() {
    if (this.waitTimes.length === 0) return 0;
    return this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length;
  }

  utilization(arrivalRate) {
    // ρ = λ/μ — M/D/1 utilization
    return Math.min(1, arrivalRate / this.serviceRate);
  }
}

// ── Delay Propagation Graph ────────────────────────────────────────────────

class DelayGraph {
  constructor() {
    this.nodes = new Map(); // flightId → { delay, gate, destination }
    this.edges = new Map(); // flightId → Set<flightId> (connections)
  }

  addFlight(flightId, { gate, destination, scheduledDep }) {
    this.nodes.set(flightId, {
      flightId,
      gate,
      destination,
      scheduledDep,
      delay: 0,
      propagatedDelay: 0,
      status: 'on-time',
    });
    if (!this.edges.has(flightId)) this.edges.set(flightId, new Set());
    return this;
  }

  connect(originFlight, connectionFlight) {
    if (!this.edges.has(originFlight)) this.edges.set(originFlight, new Set());
    this.edges.get(originFlight).add(connectionFlight);
    return this;
  }

  applyDelay(flightId, delayMinutes) {
    const node = this.nodes.get(flightId);
    if (!node) return [];

    node.delay = delayMinutes;
    node.status = delayMinutes > 0 ? 'delayed' : 'on-time';

    // Cascade to connections (BFS)
    const affected = [];
    const queue = [flightId];
    const visited = new Set([flightId]);

    while (queue.length > 0) {
      const current = queue.shift();
      const currentNode = this.nodes.get(current);
      const connections = this.edges.get(current) || new Set();

      for (const connId of connections) {
        if (!visited.has(connId)) {
          visited.add(connId);
          const conn = this.nodes.get(connId);
          if (conn) {
            // Propagate with φ⁻¹ decay (each hop attenuates delay)
            conn.propagatedDelay = (currentNode.delay + currentNode.propagatedDelay) * PHI_INV;
            if (conn.propagatedDelay > 5) {
              conn.status = 'at-risk';
              affected.push({ flightId: connId, propagatedDelay: conn.propagatedDelay });
            }
            queue.push(connId);
          }
        }
      }
    }

    return affected;
  }

  getDelayedFlights() {
    return [...this.nodes.values()].filter(n => n.delay > 0 || n.propagatedDelay > 5);
  }

  snapshot() {
    return {
      totalFlights: this.nodes.size,
      delayed: this.getDelayedFlights().length,
      onTime: [...this.nodes.values()].filter(n => n.status === 'on-time').length,
    };
  }
}

// ── API Bridge Monitor ─────────────────────────────────────────────────────

class APIBridgeMonitor {
  constructor({ maxLatencyMs = 500 } = {}) {
    this.maxLatencyMs = maxLatencyMs;
    this.requestLog = [];
    this.totalRequests = 0;
    this.errorCount = 0;
    this.latencies = [];
  }

  recordRequest({ latencyMs, success = true, endpoint = 'dfw-api' }) {
    this.totalRequests++;
    this.requestLog.push({ latencyMs, success, endpoint, ts: Date.now() });
    this.latencies.push(latencyMs);

    if (!success) this.errorCount++;
    if (this.latencies.length > 1000) this.latencies.shift();
    if (this.requestLog.length > 1000) this.requestLog.shift();
  }

  avgLatency() {
    if (this.latencies.length === 0) return 0;
    return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  requestsPerMinute(windowMs = 60_000) {
    const cutoff = Date.now() - windowMs;
    return this.requestLog.filter(r => r.ts >= cutoff).length;
  }

  errorRate() {
    if (this.totalRequests === 0) return 0;
    return this.errorCount / this.totalRequests;
  }

  health() {
    const avg = this.avgLatency();
    if (avg === 0) return 'nominal';
    if (avg < this.maxLatencyMs * PHI_INV) return 'nominal';
    if (avg < this.maxLatencyMs) return 'degraded';
    return 'critical';
  }
}

// ── AEROLEX AGI Core ───────────────────────────────────────────────────────

export class AEROLEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-AEROLEX-001',
      classification: 'Airport Operations & API Bridge AGI',
      ...config,
    });

    // Gate queues (M/D/1)
    this.gateQueues = new Map();
    this.securityQueue = new MD1Queue({ serviceRate: config.securityRate || 120, label: 'TSA-main' });

    // Delay graph
    this.delayGraph = new DelayGraph();

    // API bridge
    this.apiBridge = new APIBridgeMonitor({ maxLatencyMs: config.maxLatencyMs || 500 });

    // AGI state
    this.operationalTick = 0;
    this.gateReallocations = 0;
    this.baggageReconciliations = 0;
    this.autonomousInterventions = [];

    // Bayesian delay scoring
    this.delayPriors = new Map(); // airline → historical delay probability
    this.delayLikelihoods = new Map();

    // AGI Goals
    this.setGoal('minimize-cascade-delays', 'Detect and contain delay cascade propagation', 10, {
      maxCascadeDepth: 2,
      targetContainmentRate: 0.90,
    });

    this.setGoal('maintain-api-bridge', 'Keep API bridge latency below SLA threshold', 9, {
      maxAvgLatencyMs: 300,
      minUptimeRate: 0.999,
    });

    this.setGoal('optimize-gate-flow', 'Maximize gate utilization via M/D/1 throughput', 8, {
      targetUtilization: 0.85,
      maxAvgWaitSec: 45,
    });

    this.setGoal('reconcile-baggage', 'Achieve zero unclaimed baggage per cycle', 7, {
      targetReconciliationRate: 0.995,
    });
  }

  // ── Gate Management ────────────────────────────────────────────────────────

  registerGate(gateId, { serviceRate = 30, terminal = 'A' } = {}) {
    this.gateQueues.set(gateId, {
      queue: new MD1Queue({ serviceRate, label: gateId }),
      terminal,
      assignedFlight: null,
      status: 'available',
    });

    this.learn(
      { gateId, serviceRate, terminal },
      { registered: true },
      { id: 'gate-registration' }
    );

    return this;
  }

  assignFlightToGate(flightId, gateId) {
    const gate = this.gateQueues.get(gateId);
    if (!gate) return { success: false, reason: 'gate-not-found' };
    if (gate.assignedFlight && gate.status === 'boarding') {
      return { success: false, reason: 'gate-occupied' };
    }

    gate.assignedFlight = flightId;
    gate.status = 'boarding';

    this.learn(
      { flightId, gateId },
      { assigned: true },
      { id: 'gate-assignment' }
    );

    return { success: true, gate: gateId, flight: flightId };
  }

  reallocateGate(flightId, preferredTerminal = null) {
    // AGI: autonomously find best available gate
    const candidates = [...this.gateQueues.entries()]
      .filter(([, g]) => g.status === 'available')
      .filter(([, g]) => !preferredTerminal || g.terminal === preferredTerminal);

    if (candidates.length === 0) return { success: false, reason: 'no-gates-available' };

    // Choose gate with lowest queue
    candidates.sort((a, b) => a[1].queue.totalWaiting() - b[1].queue.totalWaiting());
    const [gateId, gate] = candidates[0];

    gate.assignedFlight = flightId;
    gate.status = 'boarding';
    this.gateReallocations++;

    this.autonomousInterventions.push({
      type: 'gate-reallocation',
      flightId,
      gateId,
      tick: this.operationalTick,
      ts: Date.now(),
    });

    this.learn(
      { flightId, gateId, preferredTerminal },
      { reallocated: true, gateReallocations: this.gateReallocations },
      { id: 'gate-reallocation' }
    );

    return { success: true, gate: gateId };
  }

  // ── Delay Intelligence ─────────────────────────────────────────────────────

  registerFlight(flightId, details) {
    this.delayGraph.addFlight(flightId, details);
    return this;
  }

  connectFlights(originFlight, connectionFlight) {
    this.delayGraph.connect(originFlight, connectionFlight);
    return this;
  }

  reportDelay(flightId, delayMinutes, airline = 'unknown') {
    const affected = this.delayGraph.applyDelay(flightId, delayMinutes);

    // Update Bayesian delay prior for this airline
    const prior = this.delayPriors.get(airline) || 0.15;
    const updated = prior + PHI_INV * (1 - prior); // sticky update when delay observed
    this.delayPriors.set(airline, updated);

    // AGI: if cascade detected, auto-intervene
    if (affected.length > 0) {
      this._handleCascade(flightId, affected, delayMinutes);
    }

    // Update delay containment goal
    const goal = this.goals.get('minimize-cascade-delays');
    if (goal) {
      const containmentRate = affected.length === 0 ? 1.0 : Math.max(0, 1 - affected.length / 10);
      goal.progress = goal.progress * PHI_INV + containmentRate * (1 - PHI_INV);
    }

    this.learn(
      { flightId, delayMinutes, airline },
      { affectedFlights: affected.length, cascaded: affected.length > 0 },
      { id: 'delay-report' }
    );

    return { flightId, delayMinutes, affectedConnections: affected };
  }

  _handleCascade(originFlight, affectedFlights, originDelay) {
    const intervention = {
      type: 'cascade-containment',
      originFlight,
      originDelay,
      affectedCount: affectedFlights.length,
      actions: [],
      tick: this.operationalTick,
      ts: Date.now(),
    };

    for (const { flightId, propagatedDelay } of affectedFlights) {
      if (propagatedDelay > 15) {
        // Attempt gate reallocation to closer terminal
        const realloc = this.reallocateGate(flightId);
        intervention.actions.push({ flightId, action: 'gate-reallocation', result: realloc });
      } else {
        intervention.actions.push({ flightId, action: 'monitor', propagatedDelay });
      }
    }

    this.autonomousInterventions.push(intervention);
    return intervention;
  }

  predictDelayProbability(flightId, airline = 'unknown') {
    const prior = this.delayPriors.get(airline) || 0.15;
    const node = this.delayGraph.nodes.get(flightId);
    const propagated = node?.propagatedDelay || 0;

    // Bayesian update: P(delay|cascade) = P(cascade|delay) × P(delay) / P(cascade)
    const likelihood = propagated > 5 ? 0.85 : 0.20;
    const posterior = (likelihood * prior) / (likelihood * prior + (1 - likelihood) * (1 - prior));

    return {
      flightId,
      airline,
      prior,
      likelihood,
      posterior,
      risk: posterior > 0.7 ? 'high' : posterior > 0.4 ? 'moderate' : 'low',
    };
  }

  // ── API Bridge ─────────────────────────────────────────────────────────────

  logAPIRequest(options = {}) {
    this.apiBridge.recordRequest(options);

    // Update API goal
    const goal = this.goals.get('maintain-api-bridge');
    if (goal) {
      const health = this.apiBridge.health();
      goal.progress = health === 'nominal' ? 1.0 : health === 'degraded' ? 0.6 : 0.2;
    }

    this.learn(
      { endpoint: options.endpoint, latencyMs: options.latencyMs },
      { success: options.success !== false, health: this.apiBridge.health() },
      { id: 'api-request' }
    );
  }

  // ── Baggage Reconciliation ─────────────────────────────────────────────────

  reconcileBaggage(flightId, { totalBags, matchedBags }) {
    this.baggageReconciliations++;
    const matchRate = totalBags > 0 ? matchedBags / totalBags : 1.0;
    const unmatched = totalBags - matchedBags;

    const goal = this.goals.get('reconcile-baggage');
    if (goal) {
      goal.progress = goal.progress * PHI_INV + matchRate * (1 - PHI_INV);
    }

    this.learn(
      { flightId, totalBags, matchedBags },
      { matchRate, unmatched },
      { id: 'baggage-reconciliation' }
    );

    return {
      flightId,
      matchRate,
      unmatched,
      status: matchRate >= 0.995 ? 'clean' : matchRate >= 0.95 ? 'acceptable' : 'action-required',
    };
  }

  // ── Operational Tick ───────────────────────────────────────────────────────

  tick(dt = 1) {
    this.operationalTick++;

    // Service all gate queues
    const gateResults = new Map();
    for (const [gateId, gate] of this.gateQueues) {
      const result = gate.queue.tick(dt);
      gateResults.set(gateId, result);
    }

    // Service security queue
    const secResult = this.securityQueue.tick(dt);

    // Update gate flow goal
    const gateGoal = this.goals.get('optimize-gate-flow');
    if (gateGoal) {
      const avgWait = this._avgGateWait();
      gateGoal.progress = avgWait <= 45 ? 1.0 : Math.max(0, 1 - (avgWait - 45) / 100);
    }

    this.learn(
      { tick: this.operationalTick, gates: gateResults.size },
      { security: secResult, interventions: this.autonomousInterventions.length },
      { id: 'operational-tick' }
    );

    return {
      tick: this.operationalTick,
      gateResults: Object.fromEntries(gateResults),
      securityQueue: secResult,
      delaySnapshot: this.delayGraph.snapshot(),
      apiHealth: this.apiBridge.health(),
    };
  }

  _avgGateWait() {
    const queues = [...this.gateQueues.values()].map(g => g.queue.avgWaitTime());
    if (queues.length === 0) return 0;
    return queues.reduce((a, b) => a + b, 0) / queues.length;
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();

    return {
      ...baseStatus,
      airportOperations: {
        operationalTick: this.operationalTick,
        gates: this.gateQueues.size,
        gateReallocations: this.gateReallocations,
        baggageReconciliations: this.baggageReconciliations,
        autonomousInterventions: this.autonomousInterventions.length,
        avgGateWaitSec: parseFloat(this._avgGateWait().toFixed(2)),
      },
      delayIntelligence: {
        ...this.delayGraph.snapshot(),
        delayPriorsTracked: this.delayPriors.size,
      },
      apiBridge: {
        health: this.apiBridge.health(),
        totalRequests: this.apiBridge.totalRequests,
        requestsPerMinute: this.apiBridge.requestsPerMinute(),
        avgLatencyMs: parseFloat(this.apiBridge.avgLatency().toFixed(2)),
        errorRate: parseFloat(this.apiBridge.errorRate().toFixed(4)),
      },
    };
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthAEROLEX(config = {}) {
  return new AEROLEX_AGI(config);
}

export default AEROLEX_AGI;
