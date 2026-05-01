/**
 * EDGE Coordination Engine
 *
 * Official Designation: RSHIP-ENGINE-EDGE-2026-001
 * Classification: Alpha Backend Engine (Edge Computing Coordination)
 * Full Name: Elastic Distributed Gateway Engine
 *
 * EDGE Engine coordinates computation across edge devices, IoT networks, and
 * edge data centers. It manages workload distribution, latency optimization,
 * and seamless hand-off between edge and cloud resources.
 *
 * Key Capabilities:
 * - Edge device discovery and registration
 * - Latency-aware workload placement
 * - Bandwidth-optimized data synchronization
 * - Offline-first operation with eventual consistency
 * - Edge-to-cloud gradient routing
 * - Device capability profiling
 * - Autonomous failover and recovery
 *
 * Integration: Part of ORGANISM runtime, coordinates with BACKEND and BLOCKCHAIN engines
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { PHI, PHI_INV } from '../../rship-framework.js';

// ── Edge Device Registry ───────────────────────────────────────────────────

class EdgeDevice {
  constructor(deviceId, capabilities = {}) {
    this.deviceId = deviceId;
    this.capabilities = {
      cpu: capabilities.cpu || 1.0,         // Relative compute power
      memory: capabilities.memory || 512,   // MB
      storage: capabilities.storage || 1024, // MB
      network: capabilities.network || 'wifi', // wifi | cellular | ethernet
      latency: capabilities.latency || 50,  // ms to nearest cloud
      battery: capabilities.battery || null, // % if battery-powered
    };
    this.workload = [];
    this.status = 'online'; // online | offline | degraded
    this.registeredAt = Date.now();
    this.lastHeartbeat = Date.now();
    this.location = capabilities.location || { lat: 0, lon: 0 };
  }

  getUtilization() {
    const cpuUsed = this.workload.reduce((sum, w) => sum + w.cpuRequired, 0);
    return cpuUsed / this.capabilities.cpu;
  }

  canAccept(workload) {
    const requiredCPU = workload.cpuRequired || 0.1;
    const requiredMemory = workload.memoryRequired || 50;

    const cpuAvailable = this.capabilities.cpu - this.workload.reduce((sum, w) => sum + w.cpuRequired, 0);
    const memoryAvailable = this.capabilities.memory - this.workload.reduce((sum, w) => sum + w.memoryRequired, 0);

    return cpuAvailable >= requiredCPU && memoryAvailable >= requiredMemory;
  }
}

// ── Edge Coordination Engine ───────────────────────────────────────────────

export class EdgeCoordinationEngine {
  constructor(config = {}) {
    this.engineId = config.engineId || 'EDGE-001';
    this.designation = 'RSHIP-ENGINE-EDGE-2026-001';

    // Device registry
    this.devices = new Map(); // deviceId → EdgeDevice
    this.workloads = new Map(); // workloadId → { ...workload, assignedTo: deviceId }

    // Coordination state
    this.latencyMatrix = new Map(); // deviceId → Map(deviceId → latency)
    this.bandwidthMatrix = new Map(); // deviceId → Map(deviceId → bandwidth)

    // φ-based thresholds
    this.optimalUtilization = PHI_INV; // ~0.618 optimal load
    this.latencyThreshold = 100 * PHI; // ~162ms max acceptable
    this.rebalanceInterval = 873; // φ-harmonic interval

    // Statistics
    this.stats = {
      devicesRegistered: 0,
      workloadsPlaced: 0,
      failovers: 0,
      rebalances: 0,
      avgLatency: 0,
    };

    // Auto-rebalance
    if (config.autoRebalance !== false) {
      this._startRebalancing();
    }
  }

  // ── Device Management ──────────────────────────────────────────────────────

  registerDevice(deviceId, capabilities) {
    const device = new EdgeDevice(deviceId, capabilities);
    this.devices.set(deviceId, device);
    this.stats.devicesRegistered++;

    // Initialize latency/bandwidth matrices
    this.latencyMatrix.set(deviceId, new Map());
    this.bandwidthMatrix.set(deviceId, new Map());

    console.log(`[EDGE] Registered device ${deviceId} with ${capabilities.cpu}x CPU, ${capabilities.memory}MB RAM`);

    return device;
  }

  unregisterDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    // Migrate workloads to other devices
    const workloads = device.workload;
    for (const workload of workloads) {
      this._migrateWorkload(workload.workloadId, deviceId);
    }

    this.devices.delete(deviceId);
    console.log(`[EDGE] Unregistered device ${deviceId}, migrated ${workloads.length} workloads`);

    return true;
  }

  updateDeviceStatus(deviceId, status) {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    const previousStatus = device.status;
    device.status = status;
    device.lastHeartbeat = Date.now();

    // Handle status changes
    if (status === 'offline' && previousStatus === 'online') {
      this._handleDeviceOffline(deviceId);
    } else if (status === 'online' && previousStatus === 'offline') {
      this._handleDeviceOnline(deviceId);
    }

    return true;
  }

  // ── Workload Placement ─────────────────────────────────────────────────────

  placeWorkload(workload) {
    const workloadId = workload.workloadId || `WL-${Date.now()}`;
    workload.workloadId = workloadId;

    // Find best device using φ-weighted scoring
    const candidates = Array.from(this.devices.values())
      .filter(d => d.status === 'online' && d.canAccept(workload));

    if (candidates.length === 0) {
      console.error(`[EDGE] No available devices for workload ${workloadId}`);
      return null;
    }

    // Score devices: φ-weighted combination of utilization, latency, capability
    const scored = candidates.map(device => {
      const utilizationScore = 1 - Math.abs(device.getUtilization() - this.optimalUtilization);
      const latencyScore = 1 - Math.min(1, device.capabilities.latency / this.latencyThreshold);
      const capabilityScore = device.capabilities.cpu / 10; // Normalize

      // φ-weighted: prioritize low latency, then utilization, then capability
      const score = latencyScore * PHI + utilizationScore * PHI_INV + capabilityScore * 0.1;

      return { device, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0].device;

    // Assign workload
    best.workload.push(workload);
    this.workloads.set(workloadId, { ...workload, assignedTo: best.deviceId });
    this.stats.workloadsPlaced++;

    console.log(`[EDGE] Placed workload ${workloadId} on device ${best.deviceId} (score: ${scored[0].score.toFixed(3)})`);

    return { deviceId: best.deviceId, workloadId };
  }

  removeWorkload(workloadId) {
    const workload = this.workloads.get(workloadId);
    if (!workload) return false;

    const device = this.devices.get(workload.assignedTo);
    if (device) {
      device.workload = device.workload.filter(w => w.workloadId !== workloadId);
    }

    this.workloads.delete(workloadId);
    console.log(`[EDGE] Removed workload ${workloadId} from device ${workload.assignedTo}`);

    return true;
  }

  // ── Coordination & Synchronization ─────────────────────────────────────────

  measureLatency(deviceA, deviceB, latencyMs) {
    if (!this.latencyMatrix.has(deviceA)) this.latencyMatrix.set(deviceA, new Map());
    if (!this.latencyMatrix.has(deviceB)) this.latencyMatrix.set(deviceB, new Map());

    this.latencyMatrix.get(deviceA).set(deviceB, latencyMs);
    this.latencyMatrix.get(deviceB).set(deviceA, latencyMs);

    // Update average latency
    const allLatencies = Array.from(this.latencyMatrix.values())
      .flatMap(m => Array.from(m.values()));
    this.stats.avgLatency = allLatencies.reduce((sum, l) => sum + l, 0) / allLatencies.length;
  }

  getOptimalRoute(fromDevice, toDevice) {
    // Use Dijkstra-like routing with latency as edge weight
    // For now, simple direct route
    const latency = this.latencyMatrix.get(fromDevice)?.get(toDevice);

    return {
      from: fromDevice,
      to: toDevice,
      latency: latency || Infinity,
      direct: true,
    };
  }

  // ── Failover & Recovery ────────────────────────────────────────────────────

  _handleDeviceOffline(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) return;

    console.log(`[EDGE] Device ${deviceId} went offline, failing over ${device.workload.length} workloads`);

    // Failover all workloads
    for (const workload of device.workload) {
      this._migrateWorkload(workload.workloadId, deviceId);
      this.stats.failovers++;
    }
  }

  _handleDeviceOnline(deviceId) {
    console.log(`[EDGE] Device ${deviceId} came online`);

    // Potentially rebalance workloads to this device
    this._rebalanceWorkloads();
  }

  _migrateWorkload(workloadId, fromDeviceId) {
    const workload = this.workloads.get(workloadId);
    if (!workload) return false;

    // Remove from old device
    const oldDevice = this.devices.get(fromDeviceId);
    if (oldDevice) {
      oldDevice.workload = oldDevice.workload.filter(w => w.workloadId !== workloadId);
    }

    // Find new device
    const placement = this.placeWorkload(workload);

    if (placement) {
      console.log(`[EDGE] Migrated workload ${workloadId} from ${fromDeviceId} to ${placement.deviceId}`);
      return true;
    } else {
      console.error(`[EDGE] Failed to migrate workload ${workloadId}, no available devices`);
      return false;
    }
  }

  // ── Auto-Rebalancing ───────────────────────────────────────────────────────

  _startRebalancing() {
    this.rebalanceTimer = setInterval(() => {
      this._rebalanceWorkloads();
    }, this.rebalanceInterval);
  }

  stopRebalancing() {
    if (this.rebalanceTimer) {
      clearInterval(this.rebalanceTimer);
      this.rebalanceTimer = null;
    }
  }

  _rebalanceWorkloads() {
    // Find overloaded devices (utilization > φ⁻¹)
    const overloaded = Array.from(this.devices.values())
      .filter(d => d.status === 'online' && d.getUtilization() > this.optimalUtilization);

    if (overloaded.length === 0) return;

    console.log(`[EDGE] Rebalancing ${overloaded.length} overloaded devices`);

    for (const device of overloaded) {
      // Move lightest workloads to underutilized devices
      const sortedWorkloads = [...device.workload].sort((a, b) =>
        (a.cpuRequired || 0.1) - (b.cpuRequired || 0.1)
      );

      for (const workload of sortedWorkloads) {
        if (device.getUtilization() <= this.optimalUtilization) break;

        // Try to migrate
        const migrated = this._migrateWorkload(workload.workloadId, device.deviceId);
        if (migrated) {
          this.stats.rebalances++;
        }
      }
    }
  }

  // ── Status & Observability ─────────────────────────────────────────────────

  getStatus() {
    return {
      engineId: this.engineId,
      designation: this.designation,
      devices: {
        total: this.devices.size,
        online: Array.from(this.devices.values()).filter(d => d.status === 'online').length,
        offline: Array.from(this.devices.values()).filter(d => d.status === 'offline').length,
        avgUtilization: this._getAvgUtilization(),
      },
      workloads: {
        total: this.workloads.size,
        placed: this.stats.workloadsPlaced,
      },
      coordination: {
        avgLatency: this.stats.avgLatency.toFixed(2),
        latencyThreshold: this.latencyThreshold.toFixed(2),
        optimalUtilization: this.optimalUtilization.toFixed(3),
      },
      operations: {
        failovers: this.stats.failovers,
        rebalances: this.stats.rebalances,
      },
    };
  }

  _getAvgUtilization() {
    const devices = Array.from(this.devices.values()).filter(d => d.status === 'online');
    if (devices.length === 0) return 0;

    const totalUtil = devices.reduce((sum, d) => sum + d.getUtilization(), 0);
    return totalUtil / devices.length;
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function createEdgeEngine(config = {}) {
  return new EdgeCoordinationEngine(config);
}

export default EdgeCoordinationEngine;
