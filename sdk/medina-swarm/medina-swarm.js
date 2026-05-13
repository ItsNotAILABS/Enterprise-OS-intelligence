/**
 * MEDINA SWARM SDK
 * RSHIP-2026-MEDINA-SWARM-001
 *
 * Medina Swarm provides swarm intelligence coordination for AGI networks.
 * Implements ant colony optimization, particle swarm optimization, and
 * φ-weighted collective behavior for distributed decision making.
 *
 * @module medina-swarm
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// SWARM AGENT
// ═══════════════════════════════════════════════════════════════════════════

class SwarmAgent {
  constructor(id, dimensions = 2) {
    this.id = id;
    this.position = new Array(dimensions).fill(0).map(() => Math.random());
    this.velocity = new Array(dimensions).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bestPosition = [...this.position];
    this.bestFitness = -Infinity;
    this.fitness = -Infinity;
    this.neighbors = [];
  }

  updateVelocity(globalBest, params) {
    const { w, c1, c2 } = params;

    for (let i = 0; i < this.velocity.length; i++) {
      const r1 = Math.random();
      const r2 = Math.random();

      const cognitive = c1 * r1 * (this.bestPosition[i] - this.position[i]);
      const social = c2 * r2 * (globalBest[i] - this.position[i]);

      this.velocity[i] = w * this.velocity[i] + cognitive + social;

      // Clamp velocity
      this.velocity[i] = Math.max(-1, Math.min(1, this.velocity[i]));
    }
  }

  updatePosition(bounds = { min: 0, max: 1 }) {
    for (let i = 0; i < this.position.length; i++) {
      this.position[i] += this.velocity[i];

      // Boundary handling
      if (this.position[i] < bounds.min) {
        this.position[i] = bounds.min;
        this.velocity[i] *= -0.5;
      } else if (this.position[i] > bounds.max) {
        this.position[i] = bounds.max;
        this.velocity[i] *= -0.5;
      }
    }
  }

  evaluate(fitnessFunction) {
    this.fitness = fitnessFunction(this.position);

    if (this.fitness > this.bestFitness) {
      this.bestFitness = this.fitness;
      this.bestPosition = [...this.position];
    }

    return this.fitness;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE SWARM OPTIMIZER
// ═══════════════════════════════════════════════════════════════════════════

class ParticleSwarmOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.dimensions = options.dimensions || 2;
    this.swarmSize = options.swarmSize || 30;
    this.maxIterations = options.maxIterations || 100;

    // PSO parameters
    this.w = options.w || 0.729; // Inertia (φ-1)
    this.c1 = options.c1 || 1.49445; // Cognitive
    this.c2 = options.c2 || 1.49445; // Social

    this.agents = [];
    this.globalBest = null;
    this.globalBestFitness = -Infinity;
    this.iteration = 0;
    this.fitnessFunction = null;
  }

  initialize(fitnessFunction) {
    this.fitnessFunction = fitnessFunction;
    this.agents = [];
    this.globalBestFitness = -Infinity;

    for (let i = 0; i < this.swarmSize; i++) {
      const agent = new SwarmAgent(`agent-${i}`, this.dimensions);
      agent.evaluate(fitnessFunction);

      if (agent.fitness > this.globalBestFitness) {
        this.globalBestFitness = agent.fitness;
        this.globalBest = [...agent.position];
      }

      this.agents.push(agent);
    }

    this.iteration = 0;
    this.emit('initialized', { swarmSize: this.swarmSize, dimensions: this.dimensions });
  }

  step() {
    const params = { w: this.w, c1: this.c1, c2: this.c2 };

    for (const agent of this.agents) {
      agent.updateVelocity(this.globalBest, params);
      agent.updatePosition();
      agent.evaluate(this.fitnessFunction);

      if (agent.fitness > this.globalBestFitness) {
        this.globalBestFitness = agent.fitness;
        this.globalBest = [...agent.position];
      }
    }

    this.iteration++;
    this.emit('iteration', {
      iteration: this.iteration,
      globalBest: this.globalBest,
      globalBestFitness: this.globalBestFitness
    });

    return { position: this.globalBest, fitness: this.globalBestFitness };
  }

  optimize() {
    if (!this.fitnessFunction) {
      throw new Error('Must initialize with fitness function first');
    }

    while (this.iteration < this.maxIterations) {
      this.step();
    }

    this.emit('completed', {
      iterations: this.iteration,
      solution: this.globalBest,
      fitness: this.globalBestFitness
    });

    return { position: this.globalBest, fitness: this.globalBestFitness };
  }

  status() {
    return {
      swarmSize: this.swarmSize,
      dimensions: this.dimensions,
      iteration: this.iteration,
      maxIterations: this.maxIterations,
      globalBestFitness: this.globalBestFitness,
      globalBest: this.globalBest,
      params: { w: this.w, c1: this.c1, c2: this.c2 }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ANT COLONY OPTIMIZER
// ═══════════════════════════════════════════════════════════════════════════

class Ant {
  constructor(id, nodeCount) {
    this.id = id;
    this.path = [];
    this.visited = new Set();
    this.pathLength = 0;
  }

  reset(startNode) {
    this.path = [startNode];
    this.visited = new Set([startNode]);
    this.pathLength = 0;
  }

  selectNext(pheromones, distances, params) {
    const current = this.path[this.path.length - 1];
    const unvisited = [];

    // Find unvisited nodes
    for (let i = 0; i < pheromones.length; i++) {
      if (!this.visited.has(i)) {
        unvisited.push(i);
      }
    }

    if (unvisited.length === 0) return -1;

    // Calculate probabilities
    const probabilities = [];
    let sum = 0;

    for (const next of unvisited) {
      const tau = Math.pow(pheromones[current][next], params.alpha);
      const eta = Math.pow(1 / distances[current][next], params.beta);
      const prob = tau * eta;
      probabilities.push({ node: next, prob });
      sum += prob;
    }

    // Roulette wheel selection
    let r = Math.random() * sum;
    for (const { node, prob } of probabilities) {
      r -= prob;
      if (r <= 0) {
        this.path.push(node);
        this.visited.add(node);
        this.pathLength += distances[current][node];
        return node;
      }
    }

    // Fallback
    const node = unvisited[0];
    this.path.push(node);
    this.visited.add(node);
    this.pathLength += distances[current][node];
    return node;
  }
}

class AntColonyOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.antCount = options.antCount || 20;
    this.alpha = options.alpha || 1.0;  // Pheromone importance
    this.beta = options.beta || PHI;    // Distance importance (φ-weighted)
    this.rho = options.rho || 0.5;      // Evaporation rate
    this.Q = options.Q || 100;          // Pheromone deposit factor
    this.maxIterations = options.maxIterations || 100;

    this.distances = null;
    this.pheromones = null;
    this.ants = [];
    this.bestPath = null;
    this.bestLength = Infinity;
    this.iteration = 0;
  }

  initialize(distances) {
    const n = distances.length;
    this.distances = distances;

    // Initialize pheromones
    this.pheromones = [];
    for (let i = 0; i < n; i++) {
      this.pheromones[i] = new Array(n).fill(1);
    }

    // Create ants
    this.ants = [];
    for (let i = 0; i < this.antCount; i++) {
      this.ants.push(new Ant(`ant-${i}`, n));
    }

    this.bestPath = null;
    this.bestLength = Infinity;
    this.iteration = 0;

    this.emit('initialized', { nodeCount: n, antCount: this.antCount });
  }

  step() {
    const n = this.distances.length;
    const params = { alpha: this.alpha, beta: this.beta };

    // Move ants
    for (const ant of this.ants) {
      ant.reset(Math.floor(Math.random() * n));

      while (ant.visited.size < n) {
        const next = ant.selectNext(this.pheromones, this.distances, params);
        if (next === -1) break;
      }

      // Complete the tour
      if (ant.path.length === n) {
        const start = ant.path[0];
        const end = ant.path[ant.path.length - 1];
        ant.pathLength += this.distances[end][start];
        ant.path.push(start);

        if (ant.pathLength < this.bestLength) {
          this.bestLength = ant.pathLength;
          this.bestPath = [...ant.path];
        }
      }
    }

    // Evaporate pheromones
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        this.pheromones[i][j] *= (1 - this.rho);
      }
    }

    // Deposit new pheromones
    for (const ant of this.ants) {
      if (ant.path.length > n) {
        const deposit = this.Q / ant.pathLength;
        for (let i = 0; i < ant.path.length - 1; i++) {
          const from = ant.path[i];
          const to = ant.path[i + 1];
          this.pheromones[from][to] += deposit;
          this.pheromones[to][from] += deposit;
        }
      }
    }

    this.iteration++;
    this.emit('iteration', {
      iteration: this.iteration,
      bestLength: this.bestLength,
      bestPath: this.bestPath
    });

    return { path: this.bestPath, length: this.bestLength };
  }

  optimize() {
    while (this.iteration < this.maxIterations) {
      this.step();
    }

    this.emit('completed', {
      iterations: this.iteration,
      solution: this.bestPath,
      length: this.bestLength
    });

    return { path: this.bestPath, length: this.bestLength };
  }

  status() {
    return {
      antCount: this.antCount,
      iteration: this.iteration,
      maxIterations: this.maxIterations,
      bestLength: this.bestLength,
      params: { alpha: this.alpha, beta: this.beta, rho: this.rho, Q: this.Q }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SWARM COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════

class SwarmCoordinator extends EventEmitter {
  constructor() {
    super();
    this.swarms = new Map();
    this.results = new Map();
  }

  createPSO(id, options = {}) {
    const pso = new ParticleSwarmOptimizer(options);
    this.swarms.set(id, { type: 'PSO', optimizer: pso });

    pso.on('completed', (result) => {
      this.results.set(id, result);
      this.emit('swarm-completed', { id, type: 'PSO', result });
    });

    return pso;
  }

  createACO(id, options = {}) {
    const aco = new AntColonyOptimizer(options);
    this.swarms.set(id, { type: 'ACO', optimizer: aco });

    aco.on('completed', (result) => {
      this.results.set(id, result);
      this.emit('swarm-completed', { id, type: 'ACO', result });
    });

    return aco;
  }

  getSwarm(id) {
    const swarm = this.swarms.get(id);
    return swarm ? swarm.optimizer : null;
  }

  getResult(id) {
    return this.results.get(id) || null;
  }

  removeSwarm(id) {
    return this.swarms.delete(id);
  }

  status() {
    const swarmStatuses = {};
    for (const [id, { type, optimizer }] of this.swarms) {
      swarmStatuses[id] = {
        type,
        status: optimizer.status()
      };
    }

    return {
      swarmCount: this.swarms.size,
      completedCount: this.results.size,
      swarms: swarmStatuses
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SwarmAgent,
  ParticleSwarmOptimizer,
  Ant,
  AntColonyOptimizer,
  SwarmCoordinator
};
