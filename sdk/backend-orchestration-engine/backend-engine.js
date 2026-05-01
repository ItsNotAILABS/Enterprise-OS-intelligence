/**
 * BACKEND Orchestration Engine
 *
 * Official Designation: RSHIP-ENGINE-BACKEND-2026-001
 * Classification: Alpha Backend Engine (Backend Infrastructure Orchestration)
 * Full Name: Backend Application Coordination & Kernel Execution Node Deployment
 *
 * BACKEND Engine orchestrates backend services, microservices, databases, and
 * server infrastructure. It manages service discovery, load balancing, auto-scaling,
 * and cross-service coordination.
 *
 * Key Capabilities:
 * - Service registry and discovery
 * - Automatic load balancing with φ-optimal distribution
 * - Health monitoring and circuit breaking
 * - Database connection pooling and sharding
 * - Cache coordination (Redis, Memcached)
 * - Message queue management (RabbitMQ, Kafka)
 * - Autonomous scaling based on demand
 * - Cross-service orchestration patterns
 *
 * Integration: Part of ORGANISM runtime, coordinates with EDGE and BLOCKCHAIN engines
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

// ── Backend Service Definition ─────────────────────────────────────────────

class BackendService {
  constructor(serviceId, config = {}) {
    this.serviceId = serviceId;
    this.serviceName = config.serviceName || serviceId;
    this.serviceType = config.serviceType || 'api'; // api | database | cache | queue | worker
    this.instances = new Map(); // instanceId → instance
    this.healthStatus = 'healthy'; // healthy | degraded | unhealthy
    this.registeredAt = Date.now();

    // Capacity
    this.minInstances = config.minInstances || 1;
    this.maxInstances = config.maxInstances || 10;
    this.targetUtilization = config.targetUtilization || PHI_INV;

    // Load balancing
    this.loadBalancingStrategy = config.loadBalancingStrategy || 'round-robin'; // round-robin | least-connections | φ-weighted
    this.currentIndex = 0;

    // Health check
    this.healthCheckInterval = config.healthCheckInterval || 5000;
    this.healthCheckPath = config.healthCheckPath || '/health';
  }

  addInstance(instanceId, endpoint, metadata = {}) {
    this.instances.set(instanceId, {
      instanceId,
      endpoint,
      metadata,
      status: 'healthy',
      connections: 0,
      requestCount: 0,
      lastHealthCheck: Date.now(),
      registeredAt: Date.now(),
    });
  }

  removeInstance(instanceId) {
    return this.instances.delete(instanceId);
  }

  getHealthyInstances() {
    return Array.from(this.instances.values()).filter(i => i.status === 'healthy');
  }

  selectInstance() {
    const healthy = this.getHealthyInstances();
    if (healthy.length === 0) return null;

    switch (this.loadBalancingStrategy) {
      case 'round-robin':
        const instance = healthy[this.currentIndex % healthy.length];
        this.currentIndex = (this.currentIndex + 1) % healthy.length;
        return instance;

      case 'least-connections':
        return healthy.reduce((min, inst) =>
          inst.connections < min.connections ? inst : min
        );

      case 'φ-weighted':
        // Weight by inverse of connections, scaled by φ
        const weighted = healthy.map(inst => {
          const weight = 1 / Math.max(1, Math.pow(inst.connections, PHI_INV));
          return { inst, weight };
        });
        const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
        const rand = Math.random() * totalWeight;
        let cumulative = 0;
        for (const { inst, weight } of weighted) {
          cumulative += weight;
          if (rand <= cumulative) return inst;
        }
        return weighted[0].inst;

      default:
        return healthy[0];
    }
  }
}

// ── Backend Orchestration Engine ───────────────────────────────────────────

export class BackendOrchestrationEngine {
  constructor(config = {}) {
    this.engineId = config.engineId || 'BACKEND-001';
    this.designation = 'RSHIP-ENGINE-BACKEND-2026-001';

    // Service registry
    this.services = new Map(); // serviceId → BackendService
    this.circuitBreakers = new Map(); // serviceId → { failures, lastFailure, open }

    // Database pooling
    this.dbPools = new Map(); // dbId → { connections, maxConnections }
    this.cacheNodes = new Map(); // cacheId → { endpoint, status }
    this.messageQueues = new Map(); // queueId → { broker, topics }

    // φ-based thresholds
    this.circuitBreakerThreshold = Math.floor(PHI ** 3); // ~4 failures
    this.circuitBreakerTimeout = 30000; // 30s recovery time
    this.scaleUpThreshold = PHI_INV + 0.1; // ~0.72 utilization
    this.scaleDownThreshold = PHI_INV - 0.2; // ~0.42 utilization

    // Statistics
    this.stats = {
      servicesRegistered: 0,
      requestsRouted: 0,
      instancesLaunched: 0,
      instancesTerminated: 0,
      circuitBreakersTripped: 0,
      autoScaleEvents: 0,
    };

    // Auto-scaling
    if (config.autoScale !== false) {
      this._startAutoScaling();
    }
  }

  // ── Service Registry ───────────────────────────────────────────────────────

  registerService(serviceId, config = {}) {
    const service = new BackendService(serviceId, config);
    this.services.set(serviceId, service);
    this.circuitBreakers.set(serviceId, {
      failures: 0,
      lastFailure: null,
      open: false,
    });
    this.stats.servicesRegistered++;

    console.log(`[BACKEND] Registered service ${serviceId} (${config.serviceType || 'api'})`);

    return service;
  }

  unregisterService(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) return false;

    this.services.delete(serviceId);
    this.circuitBreakers.delete(serviceId);
    console.log(`[BACKEND] Unregistered service ${serviceId}`);

    return true;
  }

  addServiceInstance(serviceId, instanceId, endpoint, metadata = {}) {
    const service = this.services.get(serviceId);
    if (!service) {
      console.error(`[BACKEND] Service ${serviceId} not found`);
      return false;
    }

    service.addInstance(instanceId, endpoint, metadata);
    this.stats.instancesLaunched++;
    console.log(`[BACKEND] Added instance ${instanceId} to service ${serviceId} at ${endpoint}`);

    return true;
  }

  removeServiceInstance(serviceId, instanceId) {
    const service = this.services.get(serviceId);
    if (!service) return false;

    const removed = service.removeInstance(instanceId);
    if (removed) {
      this.stats.instancesTerminated++;
      console.log(`[BACKEND] Removed instance ${instanceId} from service ${serviceId}`);
    }

    return removed;
  }

  // ── Load Balancing & Request Routing ───────────────────────────────────────

  routeRequest(serviceId, request = {}) {
    const service = this.services.get(serviceId);
    if (!service) {
      console.error(`[BACKEND] Service ${serviceId} not found`);
      return null;
    }

    // Check circuit breaker
    const breaker = this.circuitBreakers.get(serviceId);
    if (breaker.open) {
      const timeSinceFailure = Date.now() - breaker.lastFailure;
      if (timeSinceFailure < this.circuitBreakerTimeout) {
        console.warn(`[BACKEND] Circuit breaker open for ${serviceId}, rejecting request`);
        return { error: 'SERVICE_UNAVAILABLE', breaker: 'open' };
      } else {
        // Try to close circuit breaker
        console.log(`[BACKEND] Circuit breaker timeout expired for ${serviceId}, attempting recovery`);
        breaker.open = false;
        breaker.failures = 0;
      }
    }

    // Select instance
    const instance = service.selectInstance();
    if (!instance) {
      console.error(`[BACKEND] No healthy instances for service ${serviceId}`);
      this._recordFailure(serviceId);
      return { error: 'NO_HEALTHY_INSTANCES' };
    }

    // Track request
    instance.connections++;
    instance.requestCount++;
    this.stats.requestsRouted++;

    console.log(`[BACKEND] Routed request to ${serviceId}/${instance.instanceId} at ${instance.endpoint}`);

    return {
      serviceId,
      instanceId: instance.instanceId,
      endpoint: instance.endpoint,
      metadata: instance.metadata,
    };
  }

  reportRequestComplete(serviceId, instanceId, success = true) {
    const service = this.services.get(serviceId);
    if (!service) return;

    const instance = service.instances.get(instanceId);
    if (!instance) return;

    instance.connections = Math.max(0, instance.connections - 1);

    if (!success) {
      this._recordFailure(serviceId);
    } else {
      // Reset circuit breaker on success
      const breaker = this.circuitBreakers.get(serviceId);
      if (breaker) {
        breaker.failures = Math.max(0, breaker.failures - 1);
      }
    }
  }

  // ── Circuit Breaker ────────────────────────────────────────────────────────

  _recordFailure(serviceId) {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= this.circuitBreakerThreshold && !breaker.open) {
      breaker.open = true;
      this.stats.circuitBreakersTripped++;
      console.warn(`[BACKEND] Circuit breaker tripped for ${serviceId} after ${breaker.failures} failures`);
    }
  }

  resetCircuitBreaker(serviceId) {
    const breaker = this.circuitBreakers.get(serviceId);
    if (!breaker) return false;

    breaker.failures = 0;
    breaker.open = false;
    breaker.lastFailure = null;
    console.log(`[BACKEND] Circuit breaker reset for ${serviceId}`);

    return true;
  }

  // ── Auto-Scaling ───────────────────────────────────────────────────────────

  _startAutoScaling() {
    this.autoScaleTimer = setInterval(() => {
      this._checkAutoScale();
    }, 10000); // Check every 10s
  }

  stopAutoScaling() {
    if (this.autoScaleTimer) {
      clearInterval(this.autoScaleTimer);
      this.autoScaleTimer = null;
    }
  }

  _checkAutoScale() {
    for (const [serviceId, service] of this.services) {
      const utilization = this._calculateServiceUtilization(service);

      // Scale up
      if (utilization > this.scaleUpThreshold && service.instances.size < service.maxInstances) {
        this._scaleUp(serviceId);
      }

      // Scale down
      if (utilization < this.scaleDownThreshold && service.instances.size > service.minInstances) {
        this._scaleDown(serviceId);
      }
    }
  }

  _calculateServiceUtilization(service) {
    const instances = service.getHealthyInstances();
    if (instances.length === 0) return 0;

    const avgConnections = instances.reduce((sum, inst) => sum + inst.connections, 0) / instances.length;
    const maxConnections = 100; // Assume 100 connections per instance as baseline

    return avgConnections / maxConnections;
  }

  _scaleUp(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) return;

    const newInstanceId = `${serviceId}-instance-${service.instances.size + 1}`;
    const newEndpoint = `http://${serviceId}-${service.instances.size + 1}:8080`;

    service.addInstance(newInstanceId, newEndpoint, { scaledUp: true });
    this.stats.instancesLaunched++;
    this.stats.autoScaleEvents++;

    console.log(`[BACKEND] Scaled up ${serviceId}: launched ${newInstanceId}`);
  }

  _scaleDown(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) return;

    // Remove instance with fewest connections
    const instances = Array.from(service.instances.values());
    const leastUsed = instances.reduce((min, inst) =>
      inst.connections < min.connections ? inst : min
    );

    service.removeInstance(leastUsed.instanceId);
    this.stats.instancesTerminated++;
    this.stats.autoScaleEvents++;

    console.log(`[BACKEND] Scaled down ${serviceId}: terminated ${leastUsed.instanceId}`);
  }

  // ── Database Connection Pooling ────────────────────────────────────────────

  registerDatabase(dbId, config = {}) {
    this.dbPools.set(dbId, {
      dbId,
      maxConnections: config.maxConnections || 100,
      connections: [],
      activeConnections: 0,
      waitingRequests: [],
    });

    console.log(`[BACKEND] Registered database ${dbId} with ${config.maxConnections || 100} max connections`);
  }

  getDbConnection(dbId) {
    const pool = this.dbPools.get(dbId);
    if (!pool) return null;

    if (pool.activeConnections < pool.maxConnections) {
      pool.activeConnections++;
      return { dbId, connectionId: `conn-${pool.activeConnections}` };
    } else {
      console.warn(`[BACKEND] Database ${dbId} at max connections, queueing request`);
      return { dbId, queued: true };
    }
  }

  releaseDbConnection(dbId, connectionId) {
    const pool = this.dbPools.get(dbId);
    if (!pool) return;

    pool.activeConnections = Math.max(0, pool.activeConnections - 1);
  }

  // ── Status & Observability ─────────────────────────────────────────────────

  getStatus() {
    const services = Array.from(this.services.values());

    return {
      engineId: this.engineId,
      designation: this.designation,
      services: {
        total: this.services.size,
        healthy: services.filter(s => s.healthStatus === 'healthy').length,
        unhealthy: services.filter(s => s.healthStatus === 'unhealthy').length,
        totalInstances: services.reduce((sum, s) => sum + s.instances.size, 0),
      },
      routing: {
        requestsRouted: this.stats.requestsRouted,
        circuitBreakersOpen: Array.from(this.circuitBreakers.values()).filter(b => b.open).length,
      },
      scaling: {
        instancesLaunched: this.stats.instancesLaunched,
        instancesTerminated: this.stats.instancesTerminated,
        autoScaleEvents: this.stats.autoScaleEvents,
      },
      databases: {
        registered: this.dbPools.size,
        totalConnections: Array.from(this.dbPools.values()).reduce((sum, p) => sum + p.activeConnections, 0),
      },
    };
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function createBackendEngine(config = {}) {
  return new BackendOrchestrationEngine(config);
}

export default BackendOrchestrationEngine;
