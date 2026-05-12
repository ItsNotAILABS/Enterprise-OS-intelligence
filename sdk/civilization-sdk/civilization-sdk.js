/**
 * CIVILIZATION SDK
 * RSHIP-2026-CIVILIZATION-001
 *
 * Civilization SDK provides frameworks for modeling and simulating
 * societal systems, governance structures, and collective intelligence.
 *
 * @module civilization-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// AGENT
// ═══════════════════════════════════════════════════════════════════════════

class CivilizationAgent {
  constructor(id, options = {}) {
    this.id = id;
    this.resources = options.resources || 100;
    this.trust = new Map();
    this.skills = new Map(Object.entries(options.skills || {}));
    this.position = options.position || { x: 0, y: 0 };
    this.state = 'active';
    this.history = [];
  }

  interact(other, type = 'trade') {
    const trustLevel = this.trust.get(other.id) || 0.5;

    switch (type) {
      case 'trade':
        return this._trade(other, trustLevel);
      case 'cooperate':
        return this._cooperate(other, trustLevel);
      case 'compete':
        return this._compete(other, trustLevel);
      default:
        return { success: false, reason: 'Unknown interaction type' };
    }
  }

  _trade(other, trust) {
    const amount = Math.min(this.resources * 0.1 * trust, other.resources * 0.1 * trust);
    this.resources -= amount;
    other.resources += amount * PHI; // φ-weighted benefit
    this._updateTrust(other.id, 0.1);
    return { success: true, amount, type: 'trade' };
  }

  _cooperate(other, trust) {
    const synergy = (this.resources + other.resources) * trust * 0.05;
    this.resources += synergy;
    other.resources += synergy;
    this._updateTrust(other.id, 0.2);
    return { success: true, synergy, type: 'cooperate' };
  }

  _compete(other, trust) {
    const myPower = this.resources * Math.random();
    const theirPower = other.resources * Math.random();

    if (myPower > theirPower) {
      const gain = other.resources * 0.1;
      this.resources += gain;
      other.resources -= gain;
      this._updateTrust(other.id, -0.1);
      return { success: true, winner: this.id, gain, type: 'compete' };
    } else {
      const loss = this.resources * 0.1;
      this.resources -= loss;
      other.resources += loss;
      this._updateTrust(other.id, -0.1);
      return { success: true, winner: other.id, loss, type: 'compete' };
    }
  }

  _updateTrust(otherId, delta) {
    const current = this.trust.get(otherId) || 0.5;
    this.trust.set(otherId, Math.max(0, Math.min(1, current + delta)));
  }

  addSkill(name, level = 1) {
    this.skills.set(name, level);
  }

  status() {
    return {
      id: this.id,
      resources: this.resources,
      trustRelationships: this.trust.size,
      skills: Object.fromEntries(this.skills),
      state: this.state
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTITUTION
// ═══════════════════════════════════════════════════════════════════════════

class Institution extends EventEmitter {
  constructor(name, type, options = {}) {
    super();
    this.name = name;
    this.type = type;
    this.members = new Map();
    this.rules = options.rules || [];
    this.resources = options.resources || 1000;
    this.reputation = options.reputation || 0.5;
    this.created = Date.now();
  }

  addMember(agent, role = 'member') {
    this.members.set(agent.id, { agent, role, joined: Date.now() });
    this.emit('member-added', { agentId: agent.id, role });
    return this;
  }

  removeMember(agentId) {
    const member = this.members.get(agentId);
    if (member) {
      this.members.delete(agentId);
      this.emit('member-removed', { agentId });
      return true;
    }
    return false;
  }

  addRule(rule) {
    this.rules.push({
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      created: Date.now()
    });
    this.emit('rule-added', rule);
    return this;
  }

  enforceRules(action) {
    for (const rule of this.rules) {
      if (rule.condition && !rule.condition(action)) {
        return { allowed: false, rule: rule.id, reason: rule.reason };
      }
    }
    return { allowed: true };
  }

  collectTax(rate = 0.1) {
    let collected = 0;
    for (const [, { agent }] of this.members) {
      const tax = agent.resources * rate;
      agent.resources -= tax;
      collected += tax;
    }
    this.resources += collected;
    this.emit('tax-collected', { amount: collected, rate });
    return collected;
  }

  distribute(amount, method = 'equal') {
    if (this.resources < amount) {
      return { success: false, reason: 'Insufficient resources' };
    }

    const memberCount = this.members.size;
    if (memberCount === 0) return { success: false, reason: 'No members' };

    this.resources -= amount;

    switch (method) {
      case 'equal':
        const perMember = amount / memberCount;
        for (const [, { agent }] of this.members) {
          agent.resources += perMember;
        }
        break;

      case 'proportional':
        const total = Array.from(this.members.values())
          .reduce((sum, { agent }) => sum + agent.resources, 0);
        for (const [, { agent }] of this.members) {
          agent.resources += (agent.resources / total) * amount;
        }
        break;

      case 'phi':
        // φ-weighted distribution (leaders get more)
        const sorted = Array.from(this.members.values())
          .sort((a, b) => b.agent.resources - a.agent.resources);
        let remaining = amount;
        for (let i = 0; i < sorted.length; i++) {
          const share = remaining / PHI;
          sorted[i].agent.resources += share;
          remaining -= share;
        }
        break;
    }

    this.emit('resources-distributed', { amount, method });
    return { success: true, amount, method };
  }

  status() {
    return {
      name: this.name,
      type: this.type,
      memberCount: this.members.size,
      resources: this.resources,
      reputation: this.reputation,
      ruleCount: this.rules.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCIETY
// ═══════════════════════════════════════════════════════════════════════════

class Society extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.agents = new Map();
    this.institutions = new Map();
    this.metrics = {
      gini: 0,
      trust: 0,
      productivity: 0
    };
    this.tick = 0;
    this.history = [];
  }

  addAgent(agent) {
    this.agents.set(agent.id, agent);
    this.emit('agent-added', { agentId: agent.id });
    return this;
  }

  removeAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.emit('agent-removed', { agentId });
      return true;
    }
    return false;
  }

  addInstitution(institution) {
    this.institutions.set(institution.name, institution);
    this.emit('institution-added', { name: institution.name });
    return this;
  }

  simulate() {
    this.tick++;

    // Random interactions
    const agentList = Array.from(this.agents.values());
    const interactionCount = Math.floor(agentList.length * PHI);

    for (let i = 0; i < interactionCount; i++) {
      const a = agentList[Math.floor(Math.random() * agentList.length)];
      const b = agentList[Math.floor(Math.random() * agentList.length)];

      if (a.id !== b.id) {
        const types = ['trade', 'cooperate', 'compete'];
        const type = types[Math.floor(Math.random() * types.length)];
        a.interact(b, type);
      }
    }

    // Update metrics
    this._updateMetrics();

    // Record history
    this.history.push({
      tick: this.tick,
      metrics: { ...this.metrics },
      timestamp: Date.now()
    });

    if (this.history.length > 1000) {
      this.history.shift();
    }

    this.emit('tick', { tick: this.tick, metrics: this.metrics });
    return this.metrics;
  }

  _updateMetrics() {
    const resources = Array.from(this.agents.values()).map(a => a.resources);

    // Calculate Gini coefficient
    this.metrics.gini = this._calculateGini(resources);

    // Calculate average trust
    let totalTrust = 0, trustCount = 0;
    for (const agent of this.agents.values()) {
      for (const trust of agent.trust.values()) {
        totalTrust += trust;
        trustCount++;
      }
    }
    this.metrics.trust = trustCount > 0 ? totalTrust / trustCount : 0.5;

    // Calculate productivity (total resources)
    this.metrics.productivity = resources.reduce((a, b) => a + b, 0);
  }

  _calculateGini(values) {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const mean = sorted.reduce((a, b) => a + b, 0) / n;

    if (mean === 0) return 0;

    let sumDiff = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        sumDiff += Math.abs(sorted[i] - sorted[j]);
      }
    }

    return sumDiff / (2 * n * n * mean);
  }

  status() {
    return {
      name: this.name,
      agentCount: this.agents.size,
      institutionCount: this.institutions.size,
      tick: this.tick,
      metrics: { ...this.metrics }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE
// ═══════════════════════════════════════════════════════════════════════════

class GovernanceSystem extends EventEmitter {
  constructor(type = 'democracy') {
    super();
    this.type = type;
    this.proposals = new Map();
    this.votes = new Map();
    this.decisions = [];
  }

  createProposal(id, content, options = {}) {
    const proposal = {
      id,
      content,
      creator: options.creator,
      created: Date.now(),
      deadline: options.deadline || Date.now() + 86400000,
      status: 'active',
      votesFor: 0,
      votesAgainst: 0,
      threshold: options.threshold || 0.5
    };

    this.proposals.set(id, proposal);
    this.votes.set(id, new Map());
    this.emit('proposal-created', proposal);
    return proposal;
  }

  vote(proposalId, voterId, inFavor, weight = 1) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'active') {
      return { success: false, reason: 'Proposal not active' };
    }

    if (Date.now() > proposal.deadline) {
      this._finalizeProposal(proposalId);
      return { success: false, reason: 'Voting closed' };
    }

    const votes = this.votes.get(proposalId);
    const previousVote = votes.get(voterId);

    // Remove previous vote if exists
    if (previousVote) {
      if (previousVote.inFavor) {
        proposal.votesFor -= previousVote.weight;
      } else {
        proposal.votesAgainst -= previousVote.weight;
      }
    }

    // Record new vote
    votes.set(voterId, { inFavor, weight, timestamp: Date.now() });

    if (inFavor) {
      proposal.votesFor += weight;
    } else {
      proposal.votesAgainst += weight;
    }

    this.emit('vote-cast', { proposalId, voterId, inFavor });
    return { success: true, proposal };
  }

  _finalizeProposal(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'active') return;

    const total = proposal.votesFor + proposal.votesAgainst;
    const approvalRate = total > 0 ? proposal.votesFor / total : 0;

    proposal.status = approvalRate >= proposal.threshold ? 'approved' : 'rejected';
    proposal.finalizedAt = Date.now();

    this.decisions.push({
      proposalId,
      status: proposal.status,
      approvalRate,
      timestamp: Date.now()
    });

    this.emit('proposal-finalized', proposal);
  }

  checkDeadlines() {
    const now = Date.now();
    for (const [id, proposal] of this.proposals) {
      if (proposal.status === 'active' && now > proposal.deadline) {
        this._finalizeProposal(id);
      }
    }
  }

  status() {
    return {
      type: this.type,
      activeProposals: Array.from(this.proposals.values())
        .filter(p => p.status === 'active').length,
      totalProposals: this.proposals.size,
      decisions: this.decisions.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  CivilizationAgent,
  Institution,
  Society,
  GovernanceSystem
};
