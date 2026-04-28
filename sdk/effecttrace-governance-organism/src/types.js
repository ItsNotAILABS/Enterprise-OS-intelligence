/**
 * EffectTrace — ORO Governance Organism
 * Type Definitions
 *
 * Three-word encoding: TRACE · VERIFY · REMEMBER
 *
 * TRACE   → Effect Path — what a proposal actually changes (STIGMERGY field)
 * VERIFY  → Runtime Truth — what has been confirmed vs only claimed (QUORUM)
 * REMEMBER → Governance Memory — precedent graph that outlasts any proposal (AURUM)
 *
 * These types are the spine of all 15 engines and 4 agents.
 * Every claim must be source-linked or marked unknown.
 * Nothing is verified unless evidence is attached.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

// ---------------------------------------------------------------------------
// Constants — the three-word encoding
// ---------------------------------------------------------------------------

export const TRACE    = 'TRACE';    // STIGMERGY — pheromone trail of governance effects
export const VERIFY   = 'VERIFY';   // QUORUM    — crystallization of verified truth
export const REMEMBER = 'REMEMBER'; // AURUM     — φ-compounding governance memory

export const THREE_WORDS = [TRACE, VERIFY, REMEMBER];

// ---------------------------------------------------------------------------
// DAO types
// ---------------------------------------------------------------------------

export const DAO_TYPE = Object.freeze({
  NNS: 'NNS',
  SNS: 'SNS',
});

// ---------------------------------------------------------------------------
// Proposal status
// ---------------------------------------------------------------------------

export const PROPOSAL_STATUS = Object.freeze({
  OPEN: 'open',
  ADOPTED: 'adopted',
  REJECTED: 'rejected',
  EXECUTED: 'executed',
  FAILED: 'failed',
  UNKNOWN: 'unknown',
});

// ---------------------------------------------------------------------------
// Runtime Truth Status — VERIFY layer
// Maps what is claimed vs what is confirmed
// ---------------------------------------------------------------------------

export const TRUTH_STATUS = Object.freeze({
  CLAIM_ONLY:              'claim_only',
  PAYLOAD_IDENTIFIED:      'payload_identified',
  REVIEW_SUPPORTED:        'review_supported',
  EXECUTION_PENDING:       'execution_pending',
  EXECUTED_NOT_VERIFIED:   'executed_not_verified',
  VERIFIED_AFTER_STATE:    'verified_after_state',
  DISPUTED:                'disputed',
  UNKNOWN:                 'unknown',
});

// ---------------------------------------------------------------------------
// Affected system — what part of the ICP does this touch
// ---------------------------------------------------------------------------

export const AFFECTED_SYSTEM = Object.freeze({
  NNS:                     'NNS',
  SNS:                     'SNS',
  SNS_DAPP_CANISTER:       'SNS_DAPP_CANISTER',
  PROTOCOL_CANISTER:       'PROTOCOL_CANISTER',
  REGISTRY:                'REGISTRY',
  LEDGER_OR_TREASURY:      'LEDGER_OR_TREASURY',
  FRONTEND_ASSET_CANISTER: 'FRONTEND_ASSET_CANISTER',
  GOVERNANCE_RULE:         'GOVERNANCE_RULE',
  UNKNOWN:                 'UNKNOWN',
});

// ---------------------------------------------------------------------------
// Risk Class — TRACE layer: what category of change is this
// ---------------------------------------------------------------------------

export const RISK_CLASS = Object.freeze({
  MOTION:                  'motion',
  PARAMETER_CHANGE:        'parameter_change',
  CODE_UPGRADE:            'code_upgrade',
  TREASURY_ACTION:         'treasury_action',
  GOVERNANCE_RULE_CHANGE:  'governance_rule_change',
  CANISTER_CONTROL_CHANGE: 'canister_control_change',
  FRONTEND_ASSET_CHANGE:   'frontend_asset_change',
  REGISTRY_OR_NETWORK_CHANGE: 'registry_or_network_change',
  CUSTOM_GENERIC_FUNCTION: 'custom_generic_function',
  SYSTEMIC_OR_EMERGENCY:   'systemic_or_emergency',
  UNKNOWN:                 'unknown',
});

// ---------------------------------------------------------------------------
// Risk Level
// ---------------------------------------------------------------------------

export const RISK_LEVEL = Object.freeze({
  LOW:      'low',
  MEDIUM:   'medium',
  HIGH:     'high',
  CRITICAL: 'critical',
  UNKNOWN:  'unknown',
});

// ---------------------------------------------------------------------------
// Agent roles — public names + internal names
// ---------------------------------------------------------------------------

export const AGENT_ROLE = Object.freeze({
  INTEGRITY:        'integrity',        // ARCHON  — TRACE mismatch detection
  EXECUTION_TRACE:  'execution_trace',  // VECTOR  — TRACE execution path
  CONTEXT_MAP:      'context_map',      // LUMEN   — REMEMBER precedent
  VERIFICATION_LAB: 'verification_lab', // FORGE   — VERIFY post-execution
  RISK:             'risk',             // Risk scoring engine
  MEMORY:           'memory',           // REMEMBER graph engine
});

// ---------------------------------------------------------------------------
// Finding severity
// ---------------------------------------------------------------------------

export const SEVERITY = Object.freeze({
  INFO:     'info',
  WATCH:    'watch',
  WARNING:  'warning',
  CRITICAL: 'critical',
});

// ---------------------------------------------------------------------------
// Trace lifecycle status
// ---------------------------------------------------------------------------

export const TRACE_STATUS = Object.freeze({
  DRAFT:                  'draft',
  NEEDS_REVIEW:           'needs_review',
  COMMUNITY_REVIEWED:     'community_reviewed',
  EXECUTION_PENDING:      'execution_pending',
  POST_EXECUTION_CHECKED: 'post_execution_checked',
  DISPUTED:               'disputed',
  ARCHIVED:               'archived',
});

// ---------------------------------------------------------------------------
// Factory functions — create typed records with defaults
// ---------------------------------------------------------------------------

/**
 * Create a SourceLink record.
 * Every claim must be attached to a source or marked unknown.
 */
export function createSourceLink({
  url = null,
  type = 'unknown',  // 'forum' | 'codegov' | 'dashboard' | 'canister_query' | 'review' | 'unknown'
  title = '',
  retrievedAt = new Date().toISOString(),
  verified = false,
} = {}) {
  return Object.freeze({ url, type, title, retrievedAt, verified });
}

/**
 * Create a ProposalRecord.
 */
export function createProposalRecord({
  proposalId,
  daoType = DAO_TYPE.NNS,
  snsRootCanisterId = null,
  governanceCanisterId = null,
  title = '',
  summary = '',
  url = null,
  topic = null,
  proposalType = null,
  actionType = null,
  proposer = null,
  status = PROPOSAL_STATUS.UNKNOWN,
  createdAt = null,
  decidedAt = null,
  executedAt = null,
  rawPayload = null,
  sourceLinks = [],
  ingestedAt = new Date().toISOString(),
} = {}) {
  if (!proposalId) throw new Error('proposalId is required');
  return Object.freeze({
    proposalId: String(proposalId),
    daoType,
    snsRootCanisterId,
    governanceCanisterId,
    title,
    summary,
    url,
    topic,
    proposalType,
    actionType,
    proposer,
    status,
    createdAt,
    decidedAt,
    executedAt,
    rawPayload,
    sourceLinks,
    ingestedAt,
  });
}

/**
 * Create an EffectPath record — the TRACE layer.
 * What the proposal claims to do, what it actually touches, and what changes.
 */
export function createEffectPath({
  claim = '',
  affectedSystem = AFFECTED_SYSTEM.UNKNOWN,
  targetCanisterId = null,
  targetMethod = null,
  validatorCanisterId = null,
  validatorMethod = null,
  affectedState = '',
  beforeState = null,
  expectedAfterState = '',
  executionTrigger = '',
  executionDependency = null,
} = {}) {
  return Object.freeze({
    claim,
    affectedSystem,
    targetCanisterId,
    targetMethod,
    validatorCanisterId,
    validatorMethod,
    affectedState,
    beforeState,
    expectedAfterState,
    executionTrigger,
    executionDependency,
  });
}

/**
 * Create a RuntimeTruthBlock — the VERIFY layer.
 * Separates what is claimed from what has been confirmed.
 */
export function createRuntimeTruthBlock({
  claimObserved = false,
  payloadObserved = false,
  targetIdentified = false,
  reviewerConfirmed = false,
  executionObserved = false,
  afterStateVerified = false,
  truthStatus = TRUTH_STATUS.UNKNOWN,
  unresolvedQuestions = [],
} = {}) {
  return Object.freeze({
    claimObserved,
    payloadObserved,
    targetIdentified,
    reviewerConfirmed,
    executionObserved,
    afterStateVerified,
    truthStatus,
    unresolvedQuestions,
  });
}

/**
 * Create a RiskProfile — φ-weighted scoring (AURUM).
 * Each axis score is 0–10. Aggregate uses φ-weighting.
 */
export function createRiskProfile({
  riskClass = RISK_CLASS.UNKNOWN,
  riskLevel = RISK_LEVEL.UNKNOWN,
  scores = {
    technical: 0,
    treasury: 0,
    governance: 0,
    irreversibility: 0,
    verificationDifficulty: 0,
    precedentWeight: 0,
  },
  explanation = '',
  openQuestions = [],
} = {}) {
  return Object.freeze({ riskClass, riskLevel, scores, explanation, openQuestions });
}

/**
 * Create an AgentFinding — output from any of the four agent roles.
 * Every finding must be reviewable and disputable.
 */
export function createAgentFinding({
  findingId = `finding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  agent = AGENT_ROLE.INTEGRITY,
  finding = '',
  severity = SEVERITY.INFO,
  evidence = [],
  reviewStatus = 'pending',   // 'pending' | 'confirmed' | 'disputed' | 'superseded'
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    findingId,
    agent,
    finding,
    severity,
    evidence,
    reviewStatus,
    createdAt,
  };
}

/**
 * Create a GovernanceMemoryLink — the REMEMBER layer.
 * Connects proposals across time to build the precedent graph.
 */
export function createGovernanceMemoryLink({
  linkId = `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sourceProposalId,
  targetProposalId,
  linkType = 'related',  // 'related' | 'reversed' | 'extended' | 'contradicts' | 'depends_on' | 'precedes'
  description = '',
  createdAt = new Date().toISOString(),
} = {}) {
  if (!sourceProposalId || !targetProposalId) throw new Error('both proposal IDs required');
  return Object.freeze({ linkId, sourceProposalId, targetProposalId, linkType, description, createdAt });
}

/**
 * Create a VerificationPlan — concrete steps to confirm effect after execution.
 */
export function createVerificationPlan({
  steps = [],       // [{ step, tool, expectedResult, canisterId, method, verified }]
  generatedAt = new Date().toISOString(),
  completedSteps = 0,
} = {}) {
  return { steps, generatedAt, completedSteps };
}

/**
 * Create a full EffectTraceRecord.
 * The central record that TRACE·VERIFY·REMEMBER all write to.
 */
export function createEffectTraceRecord({
  traceId = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  proposalId,
  publicTitle = '',
  plainSummary = '',
  effectPath = createEffectPath(),
  runtimeTruth = createRuntimeTruthBlock(),
  riskProfile = createRiskProfile(),
  verificationPlan = createVerificationPlan(),
  memoryLinks = [],
  agentFindings = [],
  confidence = 'low',
  status = TRACE_STATUS.DRAFT,
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString(),
} = {}) {
  if (!proposalId) throw new Error('proposalId is required');
  return {
    traceId,
    proposalId,
    publicTitle,
    plainSummary,
    effectPath,
    runtimeTruth,
    riskProfile,
    verificationPlan,
    memoryLinks,
    agentFindings,
    confidence,
    status,
    createdAt,
    updatedAt,
  };
}

export default {
  TRACE, VERIFY, REMEMBER, THREE_WORDS,
  DAO_TYPE, PROPOSAL_STATUS, TRUTH_STATUS, AFFECTED_SYSTEM,
  RISK_CLASS, RISK_LEVEL, AGENT_ROLE, SEVERITY, TRACE_STATUS,
  createSourceLink, createProposalRecord, createEffectPath,
  createRuntimeTruthBlock, createRiskProfile, createAgentFinding,
  createGovernanceMemoryLink, createVerificationPlan, createEffectTraceRecord,
};
