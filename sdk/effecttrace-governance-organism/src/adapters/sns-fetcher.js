/**
 * SNS Proposal Fetcher — Production Adapter
 *
 * POWERED BY ORO · TRACE · VERIFY · REMEMBER
 *
 * Fetches live SNS proposals from the IC SNS aggregator API.
 * Supports any number of watched SNS DAOs.
 * Normalizes proposals into ProposalRecord format for E1.
 *
 * SNS API base: https://sns-api.internetcomputer.org/api/v1
 *
 * No API key required — public endpoint.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

// Public SNS aggregator API base
const SNS_API_BASE = 'https://sns-api.internetcomputer.org/api/v1';

// SNS proposal action types → risk hint for E6
const SNS_ACTION_RISK_HINT = {
  Motion:                      'motion',
  ManageNervousSystemParameters: 'governance_rule_change',
  UpgradeSnsControlledCanister: 'code_upgrade',
  AddGenericNervousSystemFunction: 'custom_generic_function',
  RemoveGenericNervousSystemFunction: 'governance_rule_change',
  ExecuteGenericNervousSystemFunction: 'custom_generic_function',
  TransferSnsTreasuryFunds:     'treasury_action',
  MintSnsTokens:                'treasury_action',
  ManageSnsMetadata:            'motion',
  UpgradeSnsToNextVersion:      'code_upgrade',
  RegisterDappCanisters:        'canister_control_change',
  DeregisterDappCanisters:      'canister_control_change',
  FreezeCanister:               'canister_control_change',
  UnfreezeCanister:             'canister_control_change',
};

/**
 * SNSProposalFetcher
 *
 * Watches one or more SNS DAOs and fetches their latest proposals.
 * Returns normalized proposal objects for E1.
 *
 * @example
 *   const fetcher = new SNSProposalFetcher({
 *     watchedDaos: [
 *       { rootCanisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai', name: 'OpenChat' },
 *     ],
 *   });
 *   const raw = await fetcher.fetch();
 */
export class SNSProposalFetcher {
  /**
   * @param {object} [options]
   * @param {Array<{rootCanisterId: string, name?: string}>} [options.watchedDaos=[]]
   *   - List of SNS DAOs to watch. Each entry needs `rootCanisterId`.
   * @param {number}  [options.limit=50]    - Max proposals per DAO per fetch
   * @param {Function} [options.fetchFn]    - Override fetch (for testing)
   */
  constructor({
    watchedDaos = [],
    limit = 50,
    fetchFn = null,
  } = {}) {
    this._watchedDaos = watchedDaos;
    this._limit = Math.min(100, Math.max(1, limit));
    this._fetchFn = fetchFn ?? ((...args) => fetch(...args));
    // Track last seen proposal ID per DAO for incremental polling
    this._lastSeenIds = new Map(); // rootCanisterId → BigInt
  }

  /**
   * Returns the list of currently known SNS DAOs from the aggregator.
   * Call once to discover available DAOs; filter and add to watchedDaos.
   *
   * @returns {Promise<Array<{rootCanisterId: string, name: string, governanceCanisterId: string}>>}
   */
  async discoverDaos() {
    const url = `${SNS_API_BASE}/snses`;
    const response = await this._fetchFn(url, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      throw new Error(`[SNSFetcher] DAO discovery error ${response.status}`);
    }

    const body = await response.json();
    const daos = Array.isArray(body.data) ? body.data : [];

    return daos.map((dao) => ({
      rootCanisterId:       dao.root_canister_id,
      governanceCanisterId: dao.governance_canister_id,
      name:                 dao.meta?.name ?? dao.root_canister_id,
      description:          dao.meta?.description ?? '',
      tokenSymbol:          dao.meta?.token_symbol ?? '',
      dashboardUrl:         `https://dashboard.internetcomputer.org/sns/${dao.root_canister_id}`,
    }));
  }

  /**
   * Fetch proposals for all watched DAOs.
   * @returns {Promise<object[]>} Normalized proposal objects
   */
  async fetch() {
    if (this._watchedDaos.length === 0) return [];

    const results = await Promise.allSettled(
      this._watchedDaos.map((dao) => this._fetchForDao(dao))
    );

    const normalized = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        normalized.push(...result.value);
      }
      // Silently skip failed DAOs — one DAO being unreachable should not kill the cycle
    }

    return normalized;
  }

  /**
   * Returns a fetcher function compatible with bootstrapORO({ proposalFetcher }).
   * @returns {Function} async () => object[]
   */
  asFetcher() {
    return () => this.fetch();
  }

  /**
   * Add a DAO to the watch list at runtime.
   * @param {{ rootCanisterId: string, name?: string }} dao
   */
  watchDao(dao) {
    const exists = this._watchedDaos.some((d) => d.rootCanisterId === dao.rootCanisterId);
    if (!exists) {
      this._watchedDaos.push(dao);
    }
    return this;
  }

  /** Remove a DAO from the watch list. */
  unwatchDao(rootCanisterId) {
    this._watchedDaos = this._watchedDaos.filter((d) => d.rootCanisterId !== rootCanisterId);
    return this;
  }

  // ── Private ─────────────────────────────────────────────────────────────

  async _fetchForDao(dao) {
    const { rootCanisterId, name, governanceCanisterId } = dao;

    const params = new URLSearchParams();
    params.set('limit', String(this._limit));

    const lastSeen = this._lastSeenIds.get(rootCanisterId);
    if (lastSeen != null) {
      params.set('after_proposal_id', String(lastSeen));
    }

    const url = `${SNS_API_BASE}/snses/${rootCanisterId}/proposals?${params.toString()}`;

    let response;
    try {
      response = await this._fetchFn(url, { headers: { Accept: 'application/json' } });
    } catch (err) {
      throw new Error(`[SNSFetcher:${rootCanisterId}] Network error: ${err.message}`);
    }

    if (!response.ok) {
      throw new Error(`[SNSFetcher:${rootCanisterId}] API error ${response.status}`);
    }

    const body = await response.json();
    const items = Array.isArray(body.data) ? body.data : [];
    const normalized = items.map((item) => this._normalize(item, dao));

    // Track last seen ID per DAO
    if (normalized.length > 0) {
      const maxId = normalized.reduce((max, p) => {
        const id = BigInt(p.proposalId.split(':')[1] ?? p.proposalId);
        return id > max ? id : max;
      }, lastSeen ?? 0n);
      this._lastSeenIds.set(rootCanisterId, maxId);
    }

    return normalized;
  }

  _normalize(item, dao) {
    const { rootCanisterId, name: daoName, governanceCanisterId } = dao;

    const proposal = item.proposal ?? {};
    const id = item.id?.id ?? item.id ?? null;

    // SNS action: may be nested under `proposal.action`
    const action = proposal.action ?? {};
    const actionType = Object.keys(action)[0] ?? null;

    // SNS-specific: extract generic function target/validator if present
    const genericAction = action.ExecuteGenericNervousSystemFunction ?? {};
    const addGenericAction = action.AddGenericNervousSystemFunction ?? {};

    const targetCanisterId  = genericAction.target_canister_id  ?? addGenericAction.target_canister_id  ?? null;
    const targetMethod      = genericAction.target_method        ?? addGenericAction.target_method        ?? null;
    const validatorCanisterId = genericAction.validator_canister_id ?? addGenericAction.validator_canister_id ?? null;
    const validatorMethod     = genericAction.validator_method       ?? addGenericAction.validator_method       ?? null;

    // Determine status
    let status = 'unknown';
    const decisionStatus = item.status ?? null;
    if (typeof decisionStatus === 'string') {
      if (decisionStatus.includes('Open'))     status = 'open';
      else if (decisionStatus.includes('Rejected')) status = 'rejected';
      else if (decisionStatus.includes('Adopted'))  status = 'adopted';
      else if (decisionStatus.includes('Executed')) status = 'executed';
      else if (decisionStatus.includes('Failed'))   status = 'failed';
    }

    // Composite proposal ID: rootCanisterId:proposalId
    const compositeId = id != null ? `${rootCanisterId}:${id}` : null;

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
    if (rootCanisterId && id != null) {
      sourceLinks.push({
        type: 'sns_dashboard',
        url: `https://dashboard.internetcomputer.org/sns/${rootCanisterId}/proposal/${id}`,
        title: `${daoName ?? 'SNS'} Dashboard`,
        description: 'SNS proposal page',
        retrievedAt: new Date().toISOString(),
      });
    }

    return {
      proposalId:           compositeId,
      daoType:              'SNS',
      snsRootCanisterId:    rootCanisterId,
      governanceCanisterId: governanceCanisterId ?? undefined,

      title:   proposal.title   ?? '(untitled)',
      summary: proposal.summary ?? '',
      url:     proposal.url     ?? undefined,

      topic:        'SNS',
      proposalType: actionType ?? 'Unknown',
      actionType:   actionType ?? 'Unknown',

      proposer: item.proposer?.id != null ? String(item.proposer.id) : undefined,
      status,

      createdAt:  item.proposal_creation_timestamp_seconds
                    ? BigInt(Math.round(item.proposal_creation_timestamp_seconds)) * 1_000_000_000n
                    : undefined,
      decidedAt:  item.decided_timestamp_seconds && item.decided_timestamp_seconds > 0
                    ? BigInt(Math.round(item.decided_timestamp_seconds)) * 1_000_000_000n
                    : undefined,
      executedAt: item.executed_timestamp_seconds && item.executed_timestamp_seconds > 0
                    ? BigInt(Math.round(item.executed_timestamp_seconds)) * 1_000_000_000n
                    : undefined,

      rawPayload: JSON.stringify(action),
      sourceLinks,

      // ORO internal hints
      _actionData:          action,
      _riskHint:            SNS_ACTION_RISK_HINT[actionType] ?? 'unknown',
      _failureReason:       item.failure_reason ?? undefined,
      _targetCanisterId:    targetCanisterId,
      _targetMethod:        targetMethod,
      _validatorCanisterId: validatorCanisterId,
      _validatorMethod:     validatorMethod,
      _daoName:             daoName,
    };
  }
}

/**
 * Convenience: create a production SNS fetcher for bootstrapOROProduction.
 *
 * @param {object} [options]
 * @param {string[]} [options.rootCanisterIds=[]] - SNS root canister IDs to watch
 * @param {number}   [options.limit=50]
 * @returns {{ proposalFetcher: Function, fetcher: SNSProposalFetcher }}
 */
export function createSNSFetcher({ rootCanisterIds = [], limit = 50, fetchFn } = {}) {
  const watchedDaos = rootCanisterIds.map((id) => ({ rootCanisterId: id }));
  const fetcher = new SNSProposalFetcher({ watchedDaos, limit, fetchFn });
  return {
    proposalFetcher: fetcher.asFetcher(),
    fetcher,
  };
}

/**
 * Well-known SNS DAO root canister IDs for easy watchlist configuration.
 * Add more as the SNS ecosystem grows.
 */
export const KNOWN_SNS_DAOS = {
  OPENCHAT:        'rrkah-fqaaa-aaaaa-aaaaq-cai',  // OpenChat (verify at launch)
  HOTORNOT:        'thipk-4qaaa-aaaal-ajbhq-cai',
  DRAGGINZ:        'zxeu2-7aaaa-aaaaq-aaafa-cai',
  FUNDED:          '4m3sz-lqaaa-aaaaq-aajdq-cai',
  NEUTRINITE:      'jcmow-hyaaa-aaaaq-aadlq-cai',
  SONIC:           'qtooy-2yaaa-aaaaq-aabvq-cai',
  GOLDDAO:         'tw2vt-hqaaa-aaaaq-aab6a-cai',
  KINIC:           '7jkta-eyaaa-aaaaq-aaarq-cai',
  MODCLUB:         'k37c6-riaaa-aaaaq-aaioa-cai',
  BOOM_DAO:        'xjngq-yaaaa-aaaaq-aabha-cai',
  ELNAAI:          'gemj7-oyaaa-aaaaq-aacnq-cai',
  YRAL:            '4m3sz-lqaaa-aaaaq-aajdq-cai',
};
