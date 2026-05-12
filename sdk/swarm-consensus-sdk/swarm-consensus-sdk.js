/**
 * SWARM CONSENSUS SDK
 * RSHIP-2026-SWARM-CONSENSUS-001
 *
 * Distributed consensus for AGI swarms. Implements Byzantine fault-tolerant
 * consensus, φ-weighted voting, and emergent agreement protocols for
 * multi-agent coordination.
 *
 * @module swarm-consensus-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;

// ═══════════════════════════════════════════════════════════════════════════
// CONSENSUS TYPES
// ═══════════════════════════════════════════════════════════════════════════

const ConsensusState = {
  IDLE: 'idle',
  PROPOSING: 'proposing',
  VOTING: 'voting',
  COMMITTED: 'committed',
  ABORTED: 'aborted'
};

const VoteType = {
  APPROVE: 'approve',
  REJECT: 'reject',
  ABSTAIN: 'abstain'
};

const ConsensusAlgorithm = {
  SIMPLE_MAJORITY: 'simple_majority',
  SUPERMAJORITY: 'supermajority',
  UNANIMOUS: 'unanimous',
  PHI_WEIGHTED: 'phi_weighted',
  BYZANTINE: 'byzantine'
};

// ═══════════════════════════════════════════════════════════════════════════
// PARTICIPANT
// ═══════════════════════════════════════════════════════════════════════════

class ConsensusParticipant {
  constructor(id, options = {}) {
    this.id = id;
    this.weight = options.weight || 1.0;
    this.reputation = options.reputation || 1.0;
    this.publicKey = options.publicKey || this._generatePublicKey();
    this.isValidator = options.isValidator !== false;
    this.lastActivity = Date.now();
    this.votescast = 0;
    this.proposalsMade = 0;
    this.byzantine = false;
  }

  _generatePublicKey() {
    return crypto.createHash('sha256')
      .update(this.id + Date.now().toString())
      .digest('hex');
  }

  effectiveWeight() {
    return this.weight * this.reputation * (this.byzantine ? 0 : 1);
  }

  updateReputation(delta) {
    this.reputation = Math.max(0, Math.min(2, this.reputation + delta));
  }

  recordVote() {
    this.votescast++;
    this.lastActivity = Date.now();
  }

  recordProposal() {
    this.proposalsMade++;
    this.lastActivity = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      weight: this.weight,
      reputation: this.reputation,
      effectiveWeight: this.effectiveWeight(),
      isValidator: this.isValidator,
      votescast: this.votescast,
      proposalsMade: this.proposalsMade,
      lastActivity: this.lastActivity
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPOSAL
// ═══════════════════════════════════════════════════════════════════════════

class Proposal {
  constructor(id, proposer, value, options = {}) {
    this.id = id;
    this.proposer = proposer;
    this.value = value;
    this.state = ConsensusState.PROPOSING;
    this.votes = new Map();
    this.created = Date.now();
    this.timeout = options.timeout || 30000;
    this.quorum = options.quorum || 0.67;
    this.algorithm = options.algorithm || ConsensusAlgorithm.SIMPLE_MAJORITY;
    this.metadata = options.metadata || {};
    this.hash = this._computeHash();
  }

  _computeHash() {
    return crypto.createHash('sha256')
      .update(JSON.stringify({
        id: this.id,
        proposer: this.proposer,
        value: this.value,
        created: this.created
      }))
      .digest('hex');
  }

  addVote(participantId, vote, weight = 1) {
    if (this.state !== ConsensusState.VOTING) {
      return { success: false, reason: 'Not in voting state' };
    }

    if (this.votes.has(participantId)) {
      return { success: false, reason: 'Already voted' };
    }

    this.votes.set(participantId, { vote, weight, timestamp: Date.now() });
    return { success: true };
  }

  startVoting() {
    if (this.state !== ConsensusState.PROPOSING) {
      return false;
    }
    this.state = ConsensusState.VOTING;
    return true;
  }

  isExpired() {
    return Date.now() - this.created > this.timeout;
  }

  calculateResult(participants) {
    let totalWeight = 0;
    let approveWeight = 0;
    let rejectWeight = 0;

    for (const [participantId, voteData] of this.votes) {
      const participant = participants.get(participantId);
      if (!participant) continue;

      const effectiveWeight = participant.effectiveWeight() * voteData.weight;
      totalWeight += effectiveWeight;

      if (voteData.vote === VoteType.APPROVE) {
        approveWeight += effectiveWeight;
      } else if (voteData.vote === VoteType.REJECT) {
        rejectWeight += effectiveWeight;
      }
    }

    return {
      totalWeight,
      approveWeight,
      rejectWeight,
      abstainWeight: totalWeight - approveWeight - rejectWeight,
      approvalRatio: totalWeight > 0 ? approveWeight / totalWeight : 0,
      participation: participants.size > 0 ? this.votes.size / participants.size : 0
    };
  }

  checkConsensus(participants) {
    const result = this.calculateResult(participants);

    // Check quorum
    if (result.participation < this.quorum) {
      return { reached: false, reason: 'Quorum not met' };
    }

    switch (this.algorithm) {
      case ConsensusAlgorithm.SIMPLE_MAJORITY:
        return {
          reached: result.approvalRatio > 0.5,
          approved: result.approvalRatio > 0.5,
          result
        };

      case ConsensusAlgorithm.SUPERMAJORITY:
        return {
          reached: result.approvalRatio >= 0.67,
          approved: result.approvalRatio >= 0.67,
          result
        };

      case ConsensusAlgorithm.UNANIMOUS:
        return {
          reached: result.approvalRatio === 1.0,
          approved: result.approvalRatio === 1.0,
          result
        };

      case ConsensusAlgorithm.PHI_WEIGHTED:
        const phiThreshold = 1 / PHI; // ~0.618
        return {
          reached: result.approvalRatio >= phiThreshold,
          approved: result.approvalRatio >= phiThreshold,
          result
        };

      case ConsensusAlgorithm.BYZANTINE:
        // Byzantine fault tolerance: n > 3f means we need > 2/3 agreement
        const byzantineThreshold = 2 / 3;
        return {
          reached: result.approvalRatio > byzantineThreshold,
          approved: result.approvalRatio > byzantineThreshold,
          result
        };

      default:
        return { reached: false, reason: 'Unknown algorithm' };
    }
  }

  finalize(approved) {
    this.state = approved ? ConsensusState.COMMITTED : ConsensusState.ABORTED;
  }

  toJSON() {
    return {
      id: this.id,
      proposer: this.proposer,
      value: this.value,
      state: this.state,
      hash: this.hash,
      voteCount: this.votes.size,
      algorithm: this.algorithm,
      created: this.created,
      timeout: this.timeout
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSENSUS ROUND
// ═══════════════════════════════════════════════════════════════════════════

class ConsensusRound extends EventEmitter {
  constructor(roundNumber, options = {}) {
    super();
    this.roundNumber = roundNumber;
    this.proposals = new Map();
    this.participants = new Map();
    this.state = ConsensusState.IDLE;
    this.started = null;
    this.ended = null;
    this.winner = null;
    this.options = options;
  }

  addParticipant(participant) {
    this.participants.set(participant.id, participant);
  }

  removeParticipant(participantId) {
    return this.participants.delete(participantId);
  }

  propose(proposerId, value, options = {}) {
    const participant = this.participants.get(proposerId);
    if (!participant) {
      return { success: false, reason: 'Not a participant' };
    }

    const proposalId = crypto.randomUUID();
    const proposal = new Proposal(proposalId, proposerId, value, {
      ...this.options,
      ...options
    });

    this.proposals.set(proposalId, proposal);
    participant.recordProposal();

    this.emit('proposal', { proposal: proposal.toJSON() });
    return { success: true, proposalId };
  }

  startVoting(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return { success: false, reason: 'Proposal not found' };
    }

    if (proposal.startVoting()) {
      this.state = ConsensusState.VOTING;
      this.started = Date.now();
      this.emit('voting-started', { proposalId });
      return { success: true };
    }

    return { success: false, reason: 'Cannot start voting' };
  }

  vote(proposalId, participantId, vote) {
    const proposal = this.proposals.get(proposalId);
    const participant = this.participants.get(participantId);

    if (!proposal) {
      return { success: false, reason: 'Proposal not found' };
    }

    if (!participant) {
      return { success: false, reason: 'Not a participant' };
    }

    const result = proposal.addVote(participantId, vote, participant.effectiveWeight());

    if (result.success) {
      participant.recordVote();
      this.emit('vote', { proposalId, participantId, vote });

      // Check if consensus reached
      const consensus = proposal.checkConsensus(this.participants);
      if (consensus.reached) {
        this._finalizeProposal(proposalId, consensus.approved, consensus.result);
      }
    }

    return result;
  }

  _finalizeProposal(proposalId, approved, result) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return;

    proposal.finalize(approved);

    if (approved) {
      this.winner = proposal;
      this.state = ConsensusState.COMMITTED;
    } else {
      this.state = ConsensusState.ABORTED;
    }

    this.ended = Date.now();

    // Update reputations
    for (const [participantId, voteData] of proposal.votes) {
      const participant = this.participants.get(participantId);
      if (!participant) continue;

      const correctVote = (approved && voteData.vote === VoteType.APPROVE) ||
                         (!approved && voteData.vote === VoteType.REJECT);

      participant.updateReputation(correctVote ? 0.01 : -0.01);
    }

    this.emit('consensus', {
      proposalId,
      approved,
      result,
      winner: this.winner?.toJSON()
    });
  }

  checkTimeouts() {
    for (const [proposalId, proposal] of this.proposals) {
      if (proposal.state === ConsensusState.VOTING && proposal.isExpired()) {
        const consensus = proposal.checkConsensus(this.participants);
        this._finalizeProposal(proposalId, consensus.approved, consensus.result);
      }
    }
  }

  status() {
    return {
      roundNumber: this.roundNumber,
      state: this.state,
      proposalCount: this.proposals.size,
      participantCount: this.participants.size,
      started: this.started,
      ended: this.ended,
      winner: this.winner?.toJSON()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SWARM CONSENSUS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

class SwarmConsensusEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.participants = new Map();
    this.rounds = [];
    this.currentRound = null;
    this.roundNumber = 0;
    this.running = false;
    this.options = {
      timeout: options.timeout || 30000,
      quorum: options.quorum || 0.67,
      algorithm: options.algorithm || ConsensusAlgorithm.PHI_WEIGHTED,
      ...options
    };
    this.metrics = {
      roundsCompleted: 0,
      consensusReached: 0,
      totalVotes: 0
    };
  }

  addParticipant(id, options = {}) {
    const participant = new ConsensusParticipant(id, options);
    this.participants.set(id, participant);
    this.emit('participant-added', { participant: participant.toJSON() });
    return participant;
  }

  removeParticipant(id) {
    const removed = this.participants.delete(id);
    if (removed) {
      this.emit('participant-removed', { id });
    }
    return removed;
  }

  startRound() {
    this.roundNumber++;
    this.currentRound = new ConsensusRound(this.roundNumber, this.options);

    // Add all participants to round
    for (const [id, participant] of this.participants) {
      this.currentRound.addParticipant(participant);
    }

    // Forward events
    this.currentRound.on('proposal', (e) => this.emit('proposal', e));
    this.currentRound.on('voting-started', (e) => this.emit('voting-started', e));
    this.currentRound.on('vote', (e) => {
      this.metrics.totalVotes++;
      this.emit('vote', e);
    });
    this.currentRound.on('consensus', (e) => {
      this.metrics.roundsCompleted++;
      if (e.approved) this.metrics.consensusReached++;
      this.rounds.push(this.currentRound);
      this.emit('consensus', e);
    });

    this.emit('round-started', { roundNumber: this.roundNumber });
    return this.currentRound;
  }

  propose(proposerId, value, options = {}) {
    if (!this.currentRound) {
      this.startRound();
    }
    return this.currentRound.propose(proposerId, value, options);
  }

  startVoting(proposalId) {
    if (!this.currentRound) {
      return { success: false, reason: 'No active round' };
    }
    return this.currentRound.startVoting(proposalId);
  }

  vote(proposalId, participantId, vote) {
    if (!this.currentRound) {
      return { success: false, reason: 'No active round' };
    }
    return this.currentRound.vote(proposalId, participantId, vote);
  }

  start() {
    if (this.running) return;
    this.running = true;

    // Periodic timeout check
    this._timeoutCheck = setInterval(() => {
      if (this.currentRound) {
        this.currentRound.checkTimeouts();
      }
    }, 1000);

    this.emit('started');
  }

  stop() {
    this.running = false;
    if (this._timeoutCheck) {
      clearInterval(this._timeoutCheck);
      this._timeoutCheck = null;
    }
    this.emit('stopped');
  }

  status() {
    return {
      running: this.running,
      participantCount: this.participants.size,
      roundNumber: this.roundNumber,
      currentRound: this.currentRound?.status(),
      completedRounds: this.rounds.length,
      metrics: { ...this.metrics },
      options: this.options
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SWARM CONSENSUS SDK
// ═══════════════════════════════════════════════════════════════════════════

class SwarmConsensusSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = 'RSHIP-2026-SWARM-CONSENSUS-001';
    this.name = 'SwarmConsensusSDK';
    this.version = '1.0.0';
    this.config = config;
    this.engine = new SwarmConsensusEngine(config);
    this.state = 'initialized';

    // Forward events
    this.engine.on('participant-added', (e) => this.emit('participant-added', e));
    this.engine.on('proposal', (e) => this.emit('proposal', e));
    this.engine.on('consensus', (e) => this.emit('consensus', e));
  }

  async start() {
    this.engine.start();
    this.state = 'running';
    this.emit('started');
  }

  async stop() {
    this.engine.stop();
    this.state = 'stopped';
    this.emit('stopped');
  }

  addParticipant(id, options = {}) {
    return this.engine.addParticipant(id, options);
  }

  propose(proposerId, value, options = {}) {
    return this.engine.propose(proposerId, value, options);
  }

  vote(proposalId, participantId, vote) {
    return this.engine.vote(proposalId, participantId, vote);
  }

  status() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      state: this.state,
      engine: this.engine.status()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  ConsensusState,
  VoteType,
  ConsensusAlgorithm,
  ConsensusParticipant,
  Proposal,
  ConsensusRound,
  SwarmConsensusEngine,
  SwarmConsensusSDK
};
