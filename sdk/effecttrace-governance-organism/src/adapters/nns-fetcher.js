/**
 * NNS Proposal Fetcher — Production Adapter
 *
 * POWERED BY ORO · TRACE · VERIFY · REMEMBER
 *
 * Fetches live NNS proposals from the Internet Computer public API.
 * Normalizes them into ProposalRecord format for E1 (Proposal Ingest Engine).
 *
 * IC API base: https://ic-api.internetcomputer.org/api/v3/proposals
 *
 * No API key required — this is a public endpoint.
 *
 * Docs: https://ic-api.internetcomputer.org/api/v3/swagger-ui
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

// Public IC API base
const NNS_API_BASE = 'https://ic-api.internetcomputer.org/api/v3';

// NNS proposal status codes (from IC API spec)
const NNS_STATUS_MAP = {
  1: 'open',
  2: 'rejected',
  4: 'adopted',
  // Note: execution is a separate field; adopted proposals can be in flight
};

// NNS topic codes → human-readable
const NNS_TOPIC_MAP = {
  0: 'Unspecified',
  1: 'ManageNeuron',
  2: 'ExchangeRate',
  3: 'NetworkEconomics',
  4: 'Governance',
  5: 'NodeAdmin',
  6: 'ParticipantManagement',
  7: 'SubnetManagement',
  8: 'NetworkCanisterManagement',
  9: 'KYC',
  10: 'NodeProviderRewards',
  12: 'SubnetReplicaVersionManagement',
  13: 'ReplicaVersionManagement',
  14: 'SnsAndCommunityFund',
};

// NNS action type (proposal.action keys) → risk hint for E6
const NNS_ACTION_RISK_HINT = {
  InstallCode:                         'code_upgrade',
  NnsFunction:                         'registry_or_network_change',
  SetDefaultFollowees:                 'governance_rule_change',
  CreateSubnet:                        'registry_or_network_change',
  AddNodeToSubnet:                     'registry_or_network_change',
  RemoveNodeFromSubnet:                'registry_or_network_change',
  Motion:                              'motion',
  ManageNeuron:                        'governance_rule_change',
  UpdateNodeOperatorConfig:            'parameter_change',
  RegisterKnownNeuron:                 'motion',
  SetSnsTokenSwapOpenTimeWindow:       'parameter_change',
  OpenSnsTokenSwap:                    'treasury_action',
  UpdateSnsSubnetList:                 'registry_or_network_change',
  UpdateAllowedPrincipals:             'governance_rule_change',
  SetFirewallConfig:                   'parameter_change',
  AddFirewallRules:                    'parameter_change',
  RemoveFirewallRules:                 'parameter_change',
  UpdateFirewallRules:                 'parameter_change',
  StopOrStartNnsCanister:              'canister_control_change',
  HardResetNnsRootToVersion:           'systemic_or_emergency',
};

/**
 * NNSProposalFetcher
 *
 * Fetches live NNS proposals. Returns an array of normalized objects
 * ready for E1 (ProposalIngestEngine.ingest()).
 *
 * @example
 *   const fetcher = new NNSProposalFetcher({ limit: 50, afterProposalId: 130000n });
 *   const raw = await fetcher.fetch();
 *   // raw is an array of normalized proposal objects
 */
export class NNSProposalFetcher {
  /**
   * @param {object} [options]
   * @param {number}  [options.limit=100]            - Max proposals per fetch (1–100)
   * @param {bigint}  [options.afterProposalId=null] - Fetch proposals with ID > this value
   * @param {number[]} [options.includeStatus=[1]]   - Status filter: 1=open, 2=rejected, 4=adopted
   * @param {number[]} [options.topics=[]]           - Topic filter (empty = all topics)
   * @param {Function} [options.fetchFn=fetch]       - Override the global fetch (for testing)
   */
  constructor({
    limit = 100,
    afterProposalId = null,
    includeStatus = [1],  // default: open proposals
    topics = [],
    fetchFn = null,
  } = {}) {
    this._limit = Math.min(100, Math.max(1, limit));
    this._afterProposalId = afterProposalId;
    this._includeStatus = includeStatus;
    this._topics = topics;
    this._fetchFn = fetchFn ?? ((...args) => fetch(...args));
    this._lastSeenId = afterProposalId;
  }

  /**
   * Fetch the latest NNS proposals.
   * Returns an array of normalized objects for E1.
   *
   * @returns {Promise<object[]>}
   */
  async fetch() {
    const url = this._buildUrl();
    let response;

    try {
      response = await this._fetchFn(url, {
        headers: { 'Accept': 'application/json' },
      });
    } catch (err) {
      throw new Error(`[NNSFetcher] Network error: ${err.message}`);
    }

    if (!response.ok) {
      throw new Error(`[NNSFetcher] API error ${response.status}: ${response.statusText}`);
    }

    const body = await response.json();
    const items = Array.isArray(body.data) ? body.data : [];

    const normalized = items.map((item) => this._normalize(item));

    // Track the highest ID seen for incremental polling
    if (normalized.length > 0) {
      const maxId = normalized.reduce((max, p) => {
        const id = BigInt(p.proposalId);
        return id > max ? id : max;
      }, this._lastSeenId ?? 0n);
      this._lastSeenId = maxId;
    }

    return normalized;
  }

  /**
   * Returns a fetcher function compatible with bootstrapORO({ proposalFetcher }).
   * This is the function ORO calls every cycle.
   *
   * @returns {Function} async () => ProposalRecord[]
   */
  asFetcher() {
    return () => this.fetch();
  }

  /** Fetch only proposals newer than the last seen ID (incremental polling). */
  async fetchIncremental() {
    const prev = this._afterProposalId;
    this._afterProposalId = this._lastSeenId;
    const results = await this.fetch();
    this._afterProposalId = prev;  // restore original baseline
    return results;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  _buildUrl() {
    const params = new URLSearchParams();
    params.set('limit', String(this._limit));

    if (this._afterProposalId != null) {
      // IC API uses "after_proposal_id" to fetch proposals with id > value
      params.set('after_proposal_id', String(this._afterProposalId));
    }

    for (const status of this._includeStatus) {
      params.append('include_reward_status', String(status));
    }

    for (const topic of this._topics) {
      params.append('topic', String(topic));
    }

    return `${NNS_API_BASE}/proposals?${params.toString()}`;
  }

  _normalize(item) {
    // The IC API returns proposal data nested under `proposal` key
    const proposal = item.proposal ?? {};
    const id = item.id?.id ?? item.id ?? null;
    const statusCode = item.status ?? item.latest_tally?.yes ?? null;

    // Determine action type from proposal.action (first key)
    const action = proposal.action ?? {};
    const actionType = Object.keys(action)[0] ?? null;

    // Source links: proposal URL + NNS dashboard
    const sourceLinks = [];
    if (proposal.url) {
      sourceLinks.push({
        type: 'proposal_url',
        url: proposal.url,
        title: 'Proposal URL',
        description: 'URL provided by the proposer',
        retrievedAt: new Date().toISOString(),
      });
    }
    if (id != null) {
      sourceLinks.push({
        type: 'nns_dashboard',
        url: `https://dashboard.internetcomputer.org/proposal/${id}`,
        title: 'NNS Dashboard',
        description: 'Official NNS proposal page',
        retrievedAt: new Date().toISOString(),
      });
      sourceLinks.push({
        type: 'nns_dashboard',
        url: `https://nns.ic0.app/proposal/?u=qoctq-giaaa-aaaaa-aaaea-cai&proposal=${id}`,
        title: 'NNS dApp',
        description: 'NNS dApp proposal page',
        retrievedAt: new Date().toISOString(),
      });
    }

    // Map status
    let status = 'unknown';
    if (statusCode === 1) status = 'open';
    else if (statusCode === 2) status = 'rejected';
    else if (statusCode === 4) {
      // Check if executed
      status = item.executed_timestamp_seconds > 0 ? 'executed'
             : item.failed_timestamp_seconds > 0   ? 'failed'
             : 'adopted';
    }

    const topicCode = item.topic ?? null;

    return {
      // ProposalRecord fields
      proposalId: id != null ? String(id) : null,
      daoType: 'NNS',
      snsRootCanisterId: undefined,
      governanceCanisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai', // NNS governance

      title:   proposal.title   ?? '(untitled)',
      summary: proposal.summary ?? '',
      url:     proposal.url     ?? undefined,

      topic:        NNS_TOPIC_MAP[topicCode]            ?? String(topicCode ?? 'Unknown'),
      proposalType: actionType                           ?? 'Unknown',
      actionType:   actionType                           ?? 'Unknown',

      proposer: item.proposer?.id != null ? String(item.proposer.id) : undefined,
      status,

      createdAt:  item.proposal_timestamp_seconds
                    ? BigInt(Math.round(item.proposal_timestamp_seconds)) * 1_000_000_000n
                    : undefined,
      decidedAt:  item.decided_timestamp_seconds && item.decided_timestamp_seconds > 0
                    ? BigInt(Math.round(item.decided_timestamp_seconds)) * 1_000_000_000n
                    : undefined,
      executedAt: item.executed_timestamp_seconds && item.executed_timestamp_seconds > 0
                    ? BigInt(Math.round(item.executed_timestamp_seconds)) * 1_000_000_000n
                    : undefined,

      rawPayload: JSON.stringify(action),
      sourceLinks,

      // ORO internal hints (not part of canonical ProposalRecord but used by E2/E6)
      _actionData:   action,
      _riskHint:     NNS_ACTION_RISK_HINT[actionType] ?? 'unknown',
      _failureReason: item.failure_reason ?? undefined,
    };
  }
}

/**
 * Convenience: create a production NNS fetcher for bootstrapOROProduction.
 *
 * @param {object} [options] - Same as NNSProposalFetcher constructor
 * @returns {{ proposalFetcher: Function, fetcher: NNSProposalFetcher }}
 */
export function createNNSFetcher(options = {}) {
  const fetcher = new NNSProposalFetcher(options);
  return {
    proposalFetcher: fetcher.asFetcher(),
    fetcher,
  };
}
