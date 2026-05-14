/**
 * AGENT RUNTIME MESH SDK
 *
 * Official Designation: RSHIP-2026-ARMESH-001
 * Classification: Internal Runtime SDK
 *
 * Internal runtime fabric for building multi-agent systems:
 * - Agent registry with capability labels
 * - Capability-aware task routing
 * - Structured execution tracing
 * - Runtime health snapshots
 */

import { RSHIPCore, PHI } from '../../rship-framework.js';

export class AgentRuntimeMeshSDK extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-ARMESH-001',
      classification: 'Internal Runtime SDK',
      ...config,
    });

    this.agents = new Map();
    this.taskHistory = [];
    this.maxTaskHistory = Math.max(config.maxTaskHistory || 5000, 200);
    this.routingBias = Number.isFinite(config.routingBias)
      ? Math.max(0.1, config.routingBias)
      : PHI;
  }

  registerAgent(agent = {}) {
    if (!agent.id || typeof agent.id !== 'string') {
      throw new Error('agent.id is required');
    }
    if (typeof agent.handleTask !== 'function') {
      throw new Error('agent.handleTask(task, context) must be a function');
    }

    this.agents.set(agent.id, {
      id: agent.id,
      capabilities: Array.isArray(agent.capabilities) ? agent.capabilities : [],
      load: Number.isFinite(agent.load) ? Math.max(0, agent.load) : 0,
      priority: Number.isFinite(agent.priority) ? Math.max(0.1, agent.priority) : 1,
      handleTask: agent.handleTask,
      metadata: agent.metadata || {},
      registeredAt: Date.now(),
    });

    return { registered: true, agentId: agent.id };
  }

  routeTask(task = {}) {
    if (!task.id || !task.capability) {
      throw new Error('task.id and task.capability are required');
    }
    if (this.agents.size === 0) {
      throw new Error('no agents registered');
    }

    const candidates = this._eligibleAgents(task.capability);
    if (candidates.length === 0) {
      return this._record(task, null, 'no_capable_agent', null);
    }

    candidates.sort((a, b) => this._scoreAgent(b) - this._scoreAgent(a));
    const selected = candidates[0];

    const context = {
      capability: task.capability,
      routedAt: Date.now(),
      priority: task.priority || 'standard',
    };
    const result = selected.handleTask(task, context);

    selected.load += 1;
    return this._record(task, selected.id, 'dispatched', result);
  }

  completeTask(agentId) {
    if (!this.agents.has(agentId)) return false;
    const agent = this.agents.get(agentId);
    agent.load = Math.max(0, agent.load - 1);
    return true;
  }

  status() {
    return {
      designation: this.designation,
      classification: this.classification,
      agents: this.agents.size,
      queuedOrInFlightLoad: Array.from(this.agents.values()).reduce((sum, a) => sum + a.load, 0),
      taskHistory: this.taskHistory.length,
      uptimeMs: Date.now() - this.birthDate,
    };
  }

  _eligibleAgents(capability) {
    return Array.from(this.agents.values()).filter((a) =>
      a.capabilities.includes(capability)
    );
  }

  _scoreAgent(agent) {
    const loadPenalty = 1 / (1 + agent.load);
    return agent.priority * this.routingBias * loadPenalty;
  }

  _record(task, agentId, status, result) {
    const record = {
      taskId: task.id,
      capability: task.capability,
      agentId,
      status,
      result,
      ts: Date.now(),
    };

    this.taskHistory.push(record);
    if (this.taskHistory.length > this.maxTaskHistory) {
      this.taskHistory.shift();
    }
    return record;
  }
}

export function createAgentRuntimeMesh(config = {}) {
  return new AgentRuntimeMeshSDK(config);
}

