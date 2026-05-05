/**
 * FORMEX AGI — Formic Swarm & Artifact Exchange Intelligence
 *
 * Official Designation: RSHIP-2026-FORMEX-001
 * Classification: Multi-Agent Swarm Coordination & Artifact Routing AGI
 * Full Name: Formic Orchestration & Resource Multi-agent EXchange EXpert
 *
 * FORMEX AGI extends the RSHIP framework with Ant Colony Optimization (ACO)
 * swarm intelligence — stigmergic pheromone trails for artifact routing,
 * beacon-driven agent coordination, and emergent collective intelligence
 * modeled on the exact mathematics of real formic colony behavior.
 *
 * The core insight: any system where agents pass artifacts (documents, data,
 * tasks) between each other is a colony. FORMEX finds optimal routing paths
 * through that colony the same way ants find optimal food paths — through
 * pheromone reinforcement and evaporation, not central control.
 *
 * Capabilities:
 * - Ant Colony Optimization (ACO) routing for multi-agent task pipelines
 * - Stigmergic pheromone matrix: τ(i,j) deposition and ρ-evaporation
 * - Beacon signal propagation (breadth-first colony radius alerts)
 * - Artifact handoff registry: tracks every document/task between agents
 * - Colony convergence detection (√variance < ε threshold)
 * - Division-of-labor scoring: role specialization entropy index
 * - φ-weighted trail reinforcement for superior path amplification
 *
 * Theory: STIGMERGY (Paper XX) + CONCORDIA MACHINAE (Paper II) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Pheromone Matrix ───────────────────────────────────────────────────────
// τ(i,j): pheromone concentration on edge from node i → node j
// Models the stigmergic trail — each successful artifact handoff deposits τ_deposit
// Evaporation rate ρ ensures old paths decay and new optima can emerge

class PheromoneMatrix {
  constructor({ evapRate = 0.1, initTau = 0.1, deposit = 1.0 } = {}) {
    this.evapRate  = evapRate;  // ρ ∈ (0,1)
    this.initTau   = initTau;   // τ₀ — initial uniform trail strength
    this.deposit   = deposit;   // Δτ — amount deposited per successful transit
    this.tau       = new Map(); // key: "i→j" → concentration
  }

  _key(from, to) { return `${from}→${to}`; }

  get(from, to) {
    return this.tau.get(this._key(from, to)) ?? this.initTau;
  }

  // Called after a successful artifact transit from→to
  reinforce(from, to, quality = 1.0) {
    const k   = this._key(from, to);
    const old = this.tau.get(k) ?? this.initTau;
    // Δτ(i,j) = deposit × quality × φ (superior paths amplified by φ)
    this.tau.set(k, old + this.deposit * quality * PHI);
  }

  // Global evaporation: τ(i,j) ← (1 − ρ) × τ(i,j)
  // Called each cycle to prevent trail saturation
  evaporate() {
    for (const [k, val] of this.tau) {
      const updated = (1 - this.evapRate) * val;
      if (updated < 0.001) this.tau.delete(k); // prune dead trails
      else this.tau.set(k, updated);
    }
  }

  // Returns all trails above threshold (active paths)
  activeTrails(minStrength = 0.5) {
    const trails = [];
    for (const [k, v] of this.tau) {
      if (v >= minStrength) trails.push({ path: k, strength: v });
    }
    return trails.sort((a, b) => b.strength - a.strength);
  }
}

// ── ACO Path Selection ─────────────────────────────────────────────────────
// Probability that ant k at node i chooses node j next:
// p(i,j) = [τ(i,j)]^α × [η(i,j)]^β / Σ_l [τ(i,l)]^α × [η(i,l)]^β
// where η(i,j) = 1/d(i,j) is the heuristic (inverse distance/cost)

function acoSelectNext({ from, candidates, pheromoneMatrix, alpha = 1.0, beta = 2.0 }) {
  if (!candidates || candidates.length === 0) return null;

  // Compute attractiveness scores
  const scores = candidates.map(({ node, cost }) => {
    const tau = pheromoneMatrix.get(from, node);
    const eta = cost > 0 ? 1.0 / cost : 1.0; // heuristic: inverse cost
    return { node, score: Math.pow(tau, alpha) * Math.pow(eta, beta) };
  });

  const total = scores.reduce((s, x) => s + x.score, 0);
  if (total === 0) return candidates[Math.floor(Math.random() * candidates.length)].node;

  // Roulette wheel selection
  let r = Math.random() * total;
  for (const { node, score } of scores) {
    r -= score;
    if (r <= 0) return node;
  }
  return scores[scores.length - 1].node;
}

// ── Colony Beacon ──────────────────────────────────────────────────────────
// Beacon: a broadcast signal emitted by an agent when it needs help,
// receives an artifact, or detects a problem. Propagates outward by radius.

class ColonyBeacon {
  constructor() {
    this.signals = []; // { id, source, type, payload, radius, timestamp }
    this.receivedBy = new Map(); // agentId → Set of beaconIds received
  }

  emit({ source, type, payload, radius = 2 }) {
    const id = `BCN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.signals.push({ id, source, type, payload, radius, timestamp: Date.now() });
    return id;
  }

  // Returns all beacons within hop-radius of agent
  visibleTo(agentId, topology) {
    return this.signals.filter(sig => {
      const dist = topology.hopDistance(sig.source, agentId);
      return dist !== undefined && dist <= sig.radius;
    });
  }

  markReceived(agentId, beaconId) {
    if (!this.receivedBy.has(agentId)) this.receivedBy.set(agentId, new Set());
    this.receivedBy.get(agentId).add(beaconId);
  }

  isNew(agentId, beaconId) {
    return !(this.receivedBy.get(agentId)?.has(beaconId));
  }
}

// ── Artifact Registry ──────────────────────────────────────────────────────
// Every artifact (document, task, dataset) that passes through the colony
// is registered here with full provenance: who created it, who touched it.

class ArtifactRegistry {
  constructor() {
    this.artifacts = new Map(); // artifactId → ArtifactRecord
    this.handoffs  = [];        // { artifactId, from, to, timestamp, quality }
  }

  register({ id, type, creator, payload = {} }) {
    this.artifacts.set(id, {
      id, type, creator, payload,
      createdAt: Date.now(),
      holders: [creator],
      handoffCount: 0,
    });
    return id;
  }

  handoff(artifactId, from, to, quality = 1.0) {
    const art = this.artifacts.get(artifactId);
    if (!art) throw new Error(`Artifact ${artifactId} not found`);
    art.holders.push(to);
    art.handoffCount++;
    const h = { artifactId, from, to, timestamp: Date.now(), quality };
    this.handoffs.push(h);
    return h;
  }

  provenance(artifactId) {
    return {
      artifact: this.artifacts.get(artifactId),
      history: this.handoffs.filter(h => h.artifactId === artifactId),
    };
  }

  summary() {
    return {
      total: this.artifacts.size,
      totalHandoffs: this.handoffs.length,
      avgHandoffsPerArtifact: this.artifacts.size > 0
        ? (this.handoffs.length / this.artifacts.size).toFixed(2)
        : 0,
    };
  }
}

// ── Colony Topology ────────────────────────────────────────────────────────
// Adjacency graph of agent-to-agent connections. Used for beacon routing
// and ACO neighbor selection.

class ColonyTopology {
  constructor() {
    this.edges = new Map(); // agentId → Set of connected agentIds
    this.costs = new Map(); // "i→j" → edge cost
  }

  connect(a, b, cost = 1.0) {
    if (!this.edges.has(a)) this.edges.set(a, new Set());
    if (!this.edges.has(b)) this.edges.set(b, new Set());
    this.edges.get(a).add(b);
    this.edges.get(b).add(a);
    this.costs.set(`${a}→${b}`, cost);
    this.costs.set(`${b}→${a}`, cost);
  }

  neighbors(agentId) {
    return [...(this.edges.get(agentId) ?? [])].map(n => ({
      node: n,
      cost: this.costs.get(`${agentId}→${n}`) ?? 1.0,
    }));
  }

  hopDistance(from, to) {
    // BFS shortest hop count
    if (from === to) return 0;
    const visited = new Set([from]);
    const queue   = [[from, 0]];
    while (queue.length) {
      const [cur, dist] = queue.shift();
      for (const nb of (this.edges.get(cur) ?? [])) {
        if (nb === to) return dist + 1;
        if (!visited.has(nb)) { visited.add(nb); queue.push([nb, dist + 1]); }
      }
    }
    return undefined; // unreachable
  }
}

// ── FORMEX AGI ─────────────────────────────────────────────────────────────

class FORMEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-FORMEX-001',
      classification: 'Multi-Agent Swarm Coordination & Artifact Routing AGI',
      ...config,
    });

    // Core swarm structures
    this.pheromones  = new PheromoneMatrix(config.pheromone ?? {});
    this.beacon      = new ColonyBeacon();
    this.artifacts   = new ArtifactRegistry();
    this.topology    = new ColonyTopology();

    // Colony state
    this.agents      = new Map(); // agentId → { id, role, currentNode, load }
    this.colonies    = new Map(); // colonyId → { id, agents, purpose }

    // Metrics
    this.cycleCount       = 0;
    this.artifactsRouted  = 0;
    this.beaconsEmitted   = 0;
    this.convergenceScore = 0;

    // AGI Goals
    this.setGoal('optimal-routing',        'Minimize artifact transit hops via ACO', 10, { metric: 'avgHops' });
    this.setGoal('colony-convergence',     'Achieve trail convergence (√var < ε)',    9,  { metric: 'convergenceScore' });
    this.setGoal('artifact-provenance',    'Zero artifact provenance gaps',           8,  { metric: 'gapCount' });
    this.setGoal('division-of-labor',      'Maximize role specialization entropy',    7,  { metric: 'roleEntropy' });
    this.setGoal('beacon-response-time',   'All beacons answered within 2 hops',      8,  { metric: 'beaconHops' });
  }

  // ── Colony Registration ──────────────────────────────────────────────────

  registerAgent({ id, role = 'worker', startNode = id, load = 0 } = {}) {
    this.agents.set(id, { id, role, currentNode: startNode, load });
    if (!this.topology.edges.has(id)) this.topology.edges.set(id, new Set());
    this.learn({ event: 'agent-registered', id, role }, { status: 'active' }, { id });
    return id;
  }

  connectAgents(agentA, agentB, cost = 1.0) {
    this.topology.connect(agentA, agentB, cost);
  }

  createColony({ id, agentIds, purpose = 'general' } = {}) {
    this.colonies.set(id, { id, agents: new Set(agentIds), purpose });
    return id;
  }

  // ── Artifact Lifecycle ───────────────────────────────────────────────────

  createArtifact({ id, type, creator, payload = {} }) {
    return this.artifacts.register({ id, type, creator, payload });
  }

  routeArtifact(artifactId, from, to, quality = 1.0) {
    const handoff = this.artifacts.handoff(artifactId, from, to, quality);
    this.pheromones.reinforce(from, to, quality);
    this.artifactsRouted++;

    // Update agent load
    const fromAgent = this.agents.get(from);
    const toAgent   = this.agents.get(to);
    if (fromAgent) fromAgent.load = Math.max(0, fromAgent.load - 1);
    if (toAgent)   toAgent.load++;

    this.learn(
      { event: 'artifact-routed', artifactId, from, to },
      { quality, handoffCount: this.artifacts.artifacts.get(artifactId)?.handoffCount },
      { id: `route-${artifactId}` }
    );

    return handoff;
  }

  // ── ACO Path Finding ─────────────────────────────────────────────────────

  findPath(fromNode, toNode, { antCount = 5, alpha = 1.0, beta = 2.0 } = {}) {
    // Multi-ant BFS + ACO selection to find optimal route
    const paths = [];
    for (let a = 0; a < antCount; a++) {
      let cur     = fromNode;
      const path  = [cur];
      const visited = new Set([cur]);
      while (cur !== toNode) {
        const neighbors = this.topology.neighbors(cur)
          .filter(n => !visited.has(n.node));
        if (!neighbors.length) break; // dead end — ant dies
        const next = acoSelectNext({
          from: cur,
          candidates: neighbors,
          pheromoneMatrix: this.pheromones,
          alpha, beta,
        });
        visited.add(next);
        path.push(next);
        cur = next;
      }
      if (cur === toNode) paths.push(path);
    }

    if (!paths.length) return null;

    // Best path = shortest (fewest hops)
    const best = paths.reduce((a, b) => a.length <= b.length ? a : b);

    // Reinforce best path
    for (let i = 0; i < best.length - 1; i++) {
      this.pheromones.reinforce(best[i], best[i + 1], 1.0);
    }

    return { path: best, hops: best.length - 1 };
  }

  // ── Beacon Operations ────────────────────────────────────────────────────

  emitBeacon({ source, type, payload, radius = 2 }) {
    const id = this.beacon.emit({ source, type, payload, radius });
    this.beaconsEmitted++;
    this.learn({ event: 'beacon-emitted', source, type }, { id, radius }, { id: `bcn-${id}` });
    return id;
  }

  scanBeacons(agentId) {
    return this.beacon.visibleTo(agentId, this.topology)
      .filter(sig => this.beacon.isNew(agentId, sig.id));
  }

  acknowledgeBeacon(agentId, beaconId) {
    this.beacon.markReceived(agentId, beaconId);
  }

  // ── Cycle: Evaporate + Score Convergence ─────────────────────────────────

  runCycle() {
    this.cycleCount++;
    this.pheromones.evaporate();

    // Convergence: how clustered are trail strengths? Lower variance = more converged
    const trails = this.pheromones.activeTrails(0);
    if (trails.length >= 2) {
      const strengths = trails.map(t => t.strength);
      const mean      = strengths.reduce((s, v) => s + v, 0) / strengths.length;
      const variance  = strengths.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / strengths.length;
      this.convergenceScore = Math.max(0, 1 - Math.sqrt(variance) / (mean + 1e-9));
    }

    this.learn(
      { event: 'cycle', cycle: this.cycleCount },
      { convergence: this.convergenceScore, activeTrails: this.pheromones.activeTrails().length },
      { id: `cycle-${this.cycleCount}` }
    );

    return this.getColonyStatus();
  }

  // ── Division of Labor Entropy ─────────────────────────────────────────────
  // Shannon entropy over role distribution: H = -Σ p(r) log₂ p(r)
  // Higher entropy = more balanced specialization

  divisionOfLaborEntropy() {
    const roleCounts = {};
    for (const { role } of this.agents.values()) {
      roleCounts[role] = (roleCounts[role] ?? 0) + 1;
    }
    const total = this.agents.size;
    if (total === 0) return 0;
    return -Object.values(roleCounts)
      .reduce((H, count) => {
        const p = count / total;
        return H + (p > 0 ? p * Math.log2(p) : 0);
      }, 0);
  }

  // ── Status ───────────────────────────────────────────────────────────────

  getColonyStatus() {
    const baseStatus = this.getStatus();
    return {
      ...baseStatus,
      colony: {
        agents:         this.agents.size,
        colonies:       this.colonies.size,
        artifactsTotal: this.artifacts.artifacts.size,
        ...this.artifacts.summary(),
        activeTrails:   this.pheromones.activeTrails().length,
        convergence:    parseFloat(this.convergenceScore.toFixed(4)),
        beaconsEmitted: this.beaconsEmitted,
        cycleCount:     this.cycleCount,
        roleEntropy:    parseFloat(this.divisionOfLaborEntropy().toFixed(4)),
      },
    };
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthFORMEX(config = {}) {
  return new FORMEX_AGI(config);
}

export default FORMEX_AGI;
