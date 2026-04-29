/**
 * E1 — Proposal Ingest Engine
 *
 * TRACE layer: pulls proposal metadata and stores it as a ProposalRecord.
 *
 * The ICP governance domain defines NNS proposal types (UpgradeNnsCanister,
 * Motion, ExecuteNnsFunction, ManageNeuron, InstallCode, SetDefaultFollowees,
 * AddOrRemoveNodeProviders, etc.) and SNS proposal types (NativeUpgradeSnsControlledCanister,
 * TransferSnsTreasuryFunds, RegisterDappCanisters, GenericNervousSystemFunction, etc.).
 *
 * For SNS generic proposals: the ExecuteGenericNervousSystemFunction action
 * carries a function_id and payload — NEXORIS routes these to the right
 * target resolver based on the registered validator/target method pair.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import {
  createProposalRecord,
  PROPOSAL_STATUS,
  DAO_TYPE,
  createSourceLink,
} from '../types.js';

// NNS topic → risk class hint mapping
const NNS_TOPIC_HINTS = {
  'Governance':                 'governance_rule_change',
  'NetworkEconomics':           'parameter_change',
  'NodeAdmin':                  'registry_or_network_change',
  'ParticipantManagement':      'registry_or_network_change',
  'SubnetManagement':           'registry_or_network_change',
  'NetworkCanisterManagement':  'code_upgrade',
  'KYC':                        'registry_or_network_change',
  'NodeProviderRewards':        'treasury_action',
  'SnsAndCommunityFund':        'treasury_action',
  'IcpXdrConversionRate':       'parameter_change',
  'UpdateElectedHostosVersions':'code_upgrade',
  'UpdateSubnetsType':          'registry_or_network_change',
  'SnsDecentralizationSale':    'treasury_action',
  'ApiBoundaryNodeManagement':  'registry_or_network_change',
  'Unspecified':                'unknown',
};

// SNS proposal type → risk class hint mapping
const SNS_TYPE_HINTS = {
  'UpgradeSnsControlledCanister':          'code_upgrade',
  'UpgradeSnsToNextVersion':               'code_upgrade',
  'TransferSnsTreasuryFunds':              'treasury_action',
  'MintSnsTokens':                         'treasury_action',
  'RegisterDappCanisters':                 'canister_control_change',
  'DeregisterDappCanisters':               'canister_control_change',
  'AddGenericNervousSystemFunction':       'custom_generic_function',
  'RemoveGenericNervousSystemFunction':    'custom_generic_function',
  'ExecuteGenericNervousSystemFunction':   'custom_generic_function',
  'ManageSnsMetadata':                     'governance_rule_change',
  'ManageNervousSystemParameters':         'parameter_change',
  'Motion':                                'motion',
};

// ---------------------------------------------------------------------------
// ProposalIngestEngine
// ---------------------------------------------------------------------------

export class ProposalIngestEngine {
  constructor() {
    this._proposals = new Map();    // proposalId → ProposalRecord
    this._fetchCount = 0;
    this._lastIngestedAt = null;
    this._chrono = null;
  }

  setChrono(chrono) { this._chrono = chrono; return this; }

  // ── Ingest ────────────────────────────────────────────────────────────────

  /**
   * Ingest a single proposal from raw data (from NNS/SNS adapter or manual entry).
   *
   * @param {object} raw - Raw proposal data from adapter or manual input
   * @returns {import('../types.js').ProposalRecord}
   */
  ingest(raw) {
    const {
      proposalId,
      daoType = DAO_TYPE.NNS,
      snsRootCanisterId,
      governanceCanisterId,
      title = '',
      summary = '',
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
      sourceLinks = [],
    } = raw;

    // Normalize status
    const normalizedStatus = this._normalizeStatus(status);

    // Derive source links
    const links = [
      ...sourceLinks,
      ...(url ? [createSourceLink({ url, type: 'forum', title: 'Proposal URL' })] : []),
    ];

    const record = createProposalRecord({
      proposalId,
      daoType,
      snsRootCanisterId,
      governanceCanisterId,
      title,
      summary,
      url,
      topic,
      proposalType: proposalType ?? this._inferProposalType(daoType, actionType, topic),
      actionType,
      proposer,
      status: normalizedStatus,
      createdAt,
      decidedAt,
      executedAt,
      rawPayload,
      sourceLinks: links,
    });

    this._proposals.set(record.proposalId, record);
    this._fetchCount++;
    this._lastIngestedAt = new Date().toISOString();

    if (this._chrono) {
      this._chrono.append({
        type: 'E1_INGEST',
        proposalId: record.proposalId,
        daoType,
        status: normalizedStatus,
        riskHint: this._riskHint(daoType, proposalType ?? actionType, topic),
      });
    }

    return record;
  }

  /**
   * Batch ingest multiple proposals.
   */
  ingestBatch(raws) {
    return raws.map((r) => this.ingest(r));
  }

  /**
   * Update the status of an existing proposal (e.g. adopted → executed).
   */
  updateStatus(proposalId, newStatus, extras = {}) {
    const existing = this._proposals.get(String(proposalId));
    if (!existing) throw new Error(`Proposal not found: ${proposalId}`);

    const updated = createProposalRecord({
      ...existing,
      status: this._normalizeStatus(newStatus),
      executedAt: extras.executedAt ?? existing.executedAt,
      decidedAt: extras.decidedAt ?? existing.decidedAt,
    });

    this._proposals.set(updated.proposalId, updated);
    return updated;
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  get(proposalId) {
    return this._proposals.get(String(proposalId)) ?? null;
  }

  list({ daoType, status, topic, limit = 100, offset = 0 } = {}) {
    let results = [...this._proposals.values()];
    if (daoType)  results = results.filter((p) => p.daoType === daoType);
    if (status)   results = results.filter((p) => p.status === status);
    if (topic)    results = results.filter((p) => p.topic === topic);
    return results.slice(offset, offset + limit);
  }

  count() { return this._proposals.size; }
  get lastIngestedAt() { return this._lastIngestedAt; }

  // ── Internals ─────────────────────────────────────────────────────────────

  _normalizeStatus(raw) {
    if (!raw) return PROPOSAL_STATUS.UNKNOWN;
    const s = String(raw).toLowerCase().replace(/\s+/g, '_');
    const map = {
      open: PROPOSAL_STATUS.OPEN, pending: PROPOSAL_STATUS.OPEN,
      adopted: PROPOSAL_STATUS.ADOPTED, accepted: PROPOSAL_STATUS.ADOPTED,
      rejected: PROPOSAL_STATUS.REJECTED, denied: PROPOSAL_STATUS.REJECTED,
      executed: PROPOSAL_STATUS.EXECUTED, succeeded: PROPOSAL_STATUS.EXECUTED,
      failed: PROPOSAL_STATUS.FAILED, execution_failed: PROPOSAL_STATUS.FAILED,
    };
    return map[s] ?? PROPOSAL_STATUS.UNKNOWN;
  }

  _inferProposalType(daoType, actionType, topic) {
    if (actionType) return actionType;
    if (daoType === DAO_TYPE.NNS && topic) return topic;
    return null;
  }

  _riskHint(daoType, type, topic) {
    if (daoType === DAO_TYPE.NNS) {
      return NNS_TOPIC_HINTS[topic] ?? NNS_TOPIC_HINTS[type] ?? 'unknown';
    }
    return SNS_TYPE_HINTS[type] ?? 'unknown';
  }

  /** For use by adapters — map NNS/SNS API response to ingest input format. */
  static normalizeNNSResponse(nnsApiResponse) {
    const p = nnsApiResponse.proposal ?? nnsApiResponse;
    return {
      proposalId: String(p.id?.id ?? p.proposalId ?? p.id),
      daoType: DAO_TYPE.NNS,
      title: p.proposal?.title ?? p.title ?? '',
      summary: p.proposal?.summary ?? p.summary ?? '',
      url: p.proposal?.url ?? p.url ?? null,
      topic: p.topic ?? null,
      actionType: p.proposal?.action ? Object.keys(p.proposal.action)[0] : null,
      proposer: p.proposer?.id ? String(p.proposer.id) : null,
      status: p.status ?? null,
      rawPayload: JSON.stringify(p.proposal?.action ?? {}),
    };
  }

  static normalizeSNSResponse(snsApiResponse, snsRootCanisterId) {
    const p = snsApiResponse.proposal ?? snsApiResponse;
    const action = p.action ?? {};
    const actionType = Object.keys(action)[0] ?? null;
    return {
      proposalId: String(p.id?.id ?? p.id),
      daoType: DAO_TYPE.SNS,
      snsRootCanisterId,
      title: p.proposal?.title ?? p.title ?? '',
      summary: p.proposal?.summary ?? p.summary ?? '',
      url: p.proposal?.url ?? null,
      proposalType: actionType,
      actionType,
      status: p.status ?? null,
      rawPayload: JSON.stringify(action),
    };
  }
}

export default ProposalIngestEngine;
