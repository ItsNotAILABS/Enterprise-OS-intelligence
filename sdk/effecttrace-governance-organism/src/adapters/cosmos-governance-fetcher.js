/**
 * Cosmos Governance Fetcher — Production Adapter
 *
 * POWERED BY ORO · TRACE · VERIFY · REMEMBER
 *
 * Fetches governance proposals from any Cosmos SDK chain via the standard
 * Cosmos REST (LCD) governance API. Every Cosmos SDK chain exposes the same
 * governance module endpoints — MERIDIAN can govern all of them with this
 * single adapter.
 *
 * Covers (among others):
 *   - Cosmos Hub (ATOM)  — https://rest.cosmos.directory/cosmoshub
 *   - Osmosis    (OSMO)  — https://rest.cosmos.directory/osmosis
 *   - Juno       (JUNO)  — https://rest.cosmos.directory/juno
 *   - Neutron    (NTRN)  — https://rest.cosmos.directory/neutron
 *   - Stride     (STRD)  — https://rest.cosmos.directory/stride
 *   - Injective  (INJ)   — https://rest.cosmos.directory/injective
 *   - Celestia   (TIA)   — https://rest.cosmos.directory/celestia
 *   - dYdX v4    (DYDX)  — https://rest.cosmos.directory/dydx
 *   - Any chain in the Cosmos directory
 *
 * Public LCD proxy: https://rest.cosmos.directory/{chainName}
 * No API key required — public endpoints with rate limits.
 *
 * Gov API v1 (Cosmos SDK ≥ 0.46): GET /cosmos/gov/v1/proposals
 * Gov API v1beta1 (older chains):  GET /cosmos/gov/v1beta1/proposals
 *
 * UNIVERSALIS GUBERNATIO — Paper XXXI
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const COSMOS_DIR_BASE = 'https://rest.cosmos.directory';

// Cosmos proposal status → ORO status
const COSMOS_STATUS_MAP = {
  PROPOSAL_STATUS_UNSPECIFIED:         'unknown',
  PROPOSAL_STATUS_DEPOSIT_PERIOD:      'open',
  PROPOSAL_STATUS_VOTING_PERIOD:       'open',
  PROPOSAL_STATUS_PASSED:              'adopted',
  PROPOSAL_STATUS_REJECTED:            'rejected',
  PROPOSAL_STATUS_FAILED:              'failed',
  // v1beta1 numeric values
  '0': 'unknown',
  '1': 'open',
  '2': 'open',
  '3': 'adopted',
  '4': 'rejected',
  '5': 'failed',
};

// Cosmos proposal type URL → ORO risk hint for E6
const COSMOS_RISK_HINT = {
  '/cosmos.gov.v1beta1.TextProposal':                   'motion',
  '/cosmos.params.v1beta1.ParameterChangeProposal':     'parameter_change',
  '/cosmos.upgrade.v1beta1.SoftwareUpgradeProposal':    'code_upgrade',
  '/cosmos.upgrade.v1beta1.CancelSoftwareUpgradeProposal': 'code_upgrade',
  '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal': 'treasury_action',
  '/ibc.core.client.v1.ClientUpdateProposal':           'registry_or_network_change',
  '/ibc.core.client.v1.UpgradeProposal':                'code_upgrade',
  '/osmosis.gamm.v1beta1.SetSuperfluidAssetsProposal':  'parameter_change',
  '/osmosis.poolincentives.v1beta1.ReplacePoolIncentivesProposal': 'parameter_change',
  '/cosmos.gov.v1.MsgExecLegacyContent':                'governance_rule_change',
  '/cosmos.gov.v1.MsgSoftwareUpgrade':                  'code_upgrade',
  '/cosmwasm.wasm.v1.StoreCodeProposal':                'code_upgrade',
  '/cosmwasm.wasm.v1.InstantiateContractProposal':      'code_upgrade',
  '/cosmwasm.wasm.v1.MigrateContractProposal':          'code_upgrade',
  '/cosmwasm.wasm.v1.UpdateAdminProposal':              'governance_rule_change',
  '/cosmwasm.wasm.v1.ClearAdminProposal':               'governance_rule_change',
  '/cosmos.bank.v1beta1.MsgSend':                       'treasury_action',
};

/**
 * CosmosGovernanceFetcher
 *
 * Watches one or more Cosmos SDK chains and fetches their active governance
 * proposals. Returns normalized ProposalRecord-compatible objects for E1.
 *
 * Automatically tries the v1 API first (Cosmos SDK ≥ 0.46), and falls back
 * to v1beta1 for older chains.
 *
 * @example
 *   const fetcher = new CosmosGovernanceFetcher({
 *     chains: [
 *       { name: 'cosmoshub',  symbol: 'ATOM', lcdUrl: 'https://rest.cosmos.directory/cosmoshub' },
 *       { name: 'osmosis',    symbol: 'OSMO', lcdUrl: 'https://rest.cosmos.directory/osmosis' },
 *     ],
 *   });
 *   const proposals = await fetcher.fetch();
 */
export class CosmosGovernanceFetcher {
  /**
   * @param {object} [options]
   * @param {Array<{name: string, symbol?: string, lcdUrl?: string}>} [options.chains=[]]
   *   Cosmos chains to watch. If lcdUrl is omitted, uses cosmos.directory proxy.
   * @param {string}   [options.status='PROPOSAL_STATUS_VOTING_PERIOD']
   *   Filter by proposal status. Use null for all statuses.
   * @param {number}   [options.limit=50]           - Max proposals per chain per fetch
   * @param {Function} [options.fetchFn=fetch]      - Override fetch (for testing)
   */
  constructor({
    chains    = [],
    status    = 'PROPOSAL_STATUS_VOTING_PERIOD',
    limit     = 50,
    fetchFn   = null,
  } = {}) {
    this._chains  = chains.map((c) => ({
      name:   c.name,
      symbol: c.symbol ?? c.name.toUpperCase(),
      lcdUrl: c.lcdUrl ?? `${COSMOS_DIR_BASE}/${c.name}`,
    }));
    this._status  = status;
    this._limit   = Math.min(100, Math.max(1, limit));
    this._fetchFn = fetchFn ?? ((...args) => fetch(...args));
    // API version cache: chain name → 'v1' | 'v1beta1'
    this._apiVersionCache = new Map();
  }

  /**
   * Fetch governance proposals from all watched Cosmos chains.
   * @returns {Promise<object[]>} Normalized proposals
   */
  async fetch() {
    if (this._chains.length === 0) return [];

    const results = await Promise.allSettled(
      this._chains.map((chain) => this._fetchForChain(chain))
    );

    const proposals = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        proposals.push(...result.value);
      }
    }
    return proposals;
  }

  /**
   * Returns a fetcher function for bootstrapORO({ proposalFetcher }).
   * @returns {Function} async () => object[]
   */
  asFetcher() {
    return () => this.fetch();
  }

  /**
   * Add a chain to the watch list at runtime.
   * @param {{ name: string, symbol?: string, lcdUrl?: string }} chain
   */
  watchChain(chain) {
    const exists = this._chains.some((c) => c.name === chain.name);
    if (!exists) {
      this._chains.push({
        name:   chain.name,
        symbol: chain.symbol ?? chain.name.toUpperCase(),
        lcdUrl: chain.lcdUrl ?? `${COSMOS_DIR_BASE}/${chain.name}`,
      });
    }
    return this;
  }

  /** Remove a chain from the watch list. */
  unwatchChain(chainName) {
    this._chains = this._chains.filter((c) => c.name !== chainName);
    this._apiVersionCache.delete(chainName);
    return this;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  async _fetchForChain(chain) {
    // Try v1 first, fall back to v1beta1
    const version = this._apiVersionCache.get(chain.name) ?? 'v1';

    try {
      const proposals = await this._fetchWithVersion(chain, version);
      this._apiVersionCache.set(chain.name, version);
      return proposals;
    } catch (err) {
      if (version === 'v1') {
        // Fall back to v1beta1
        try {
          const proposals = await this._fetchWithVersion(chain, 'v1beta1');
          this._apiVersionCache.set(chain.name, 'v1beta1');
          return proposals;
        } catch (_) {
          return [];
        }
      }
      return [];
    }
  }

  async _fetchWithVersion(chain, version) {
    const params = new URLSearchParams();
    params.set('pagination.limit', String(this._limit));
    params.set('pagination.reverse', 'true'); // newest first

    if (this._status) {
      params.set('proposal_status', this._status);
    }

    const url = `${chain.lcdUrl}/cosmos/gov/${version}/proposals?${params.toString()}`;

    let response;
    try {
      response = await this._fetchFn(url, { headers: { Accept: 'application/json' } });
    } catch (err) {
      throw new Error(`[CosmosFetcher:${chain.name}] Network error: ${err.message}`);
    }

    if (!response.ok) {
      throw new Error(`[CosmosFetcher:${chain.name}] API ${version} error ${response.status}`);
    }

    const body  = await response.json();
    const items = body.proposals ?? [];
    return items.map((item) => this._normalize(item, chain, version));
  }

  _normalize(item, chain, version) {
    const id = item.id ?? item.proposal_id ?? null;

    // Extract proposal type from content
    const content = item.content ?? (item.messages?.[0] ?? {});
    const typeUrl = content['@type'] ?? content.type_url ?? null;

    // Title / description — varies by API version
    let title   = '(untitled)';
    let summary = '';

    if (item.title)       title   = item.title;       // v1
    else if (content.title)  title   = content.title;   // v1beta1 embedded
    else if (item.metadata) title   = `Proposal #${id}`;

    if (item.summary)          summary = item.summary;              // v1
    else if (content.description) summary = content.description;    // v1beta1

    // Status
    const rawStatus = item.status ?? '';
    const status    = COSMOS_STATUS_MAP[rawStatus] ?? 'unknown';

    // Timestamps
    const createdAt  = item.submit_time
      ? BigInt(Math.round(new Date(item.submit_time).getTime())) * 1_000_000n
      : undefined;
    const decidedAt  = item.voting_end_time
      ? BigInt(Math.round(new Date(item.voting_end_time).getTime())) * 1_000_000n
      : undefined;

    // Tally (v1beta1: final_tally_result, v1: final_tally_result)
    const tally = item.final_tally_result ?? {};

    // Deposit info
    const totalDeposit = (item.total_deposit ?? [])
      .map((c) => `${c.amount}${c.denom}`)
      .join(', ');

    const now = new Date().toISOString();
    const explorerBase = `https://www.mintscan.io/${chain.name}`;

    const sourceLinks = [
      {
        type:        'mintscan_proposal',
        url:         `${explorerBase}/proposals/${id}`,
        title:       `Mintscan — ${chain.symbol} Proposal #${id}`,
        description: `${chain.name} governance proposal on Mintscan`,
        retrievedAt: now,
      },
      {
        type:        'cosmos_lcd',
        url:         `${chain.lcdUrl}/cosmos/gov/${version}/proposals/${id}`,
        title:       'Cosmos LCD API — proposal data',
        description: 'Machine-readable proposal data from the Cosmos REST API',
        retrievedAt: now,
      },
    ];

    return {
      proposalId:           `cosmos:${chain.name}:${id}`,
      daoType:              'COSMOS',
      snsRootCanisterId:    undefined,
      governanceCanisterId: `cosmos:${chain.name}:gov`,

      title,
      summary: _truncate(summary, 2000),
      url:     `${explorerBase}/proposals/${id}`,

      topic:        `Cosmos:${chain.symbol}`,
      proposalType: typeUrl ?? 'TextProposal',
      actionType:   typeUrl ?? 'TextProposal',

      proposer: item.proposer ?? undefined,
      status,

      createdAt,
      decidedAt,
      executedAt: undefined,

      rawPayload: JSON.stringify(content),
      sourceLinks,

      // ORO internal hints
      _actionData:    content,
      _riskHint:      COSMOS_RISK_HINT[typeUrl] ?? 'motion',
      _chain:         chain.name,
      _symbol:        chain.symbol,
      _tallyResult:   tally,
      _totalDeposit:  totalDeposit,
      _apiVersion:    version,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Convenience factory for bootstrapOROProduction.
 *
 * @param {object} [options]
 * @param {string[]}  [options.chainNames=[]] - Chain names from cosmos.directory
 * @param {string}    [options.status]        - Proposal status filter
 * @param {number}    [options.limit=50]
 * @returns {{ proposalFetcher: Function, fetcher: CosmosGovernanceFetcher }}
 */
export function createCosmosFetcher({ chainNames = [], status, limit = 50, fetchFn } = {}) {
  const chains  = chainNames.map((name) => ({ name }));
  const fetcher = new CosmosGovernanceFetcher({ chains, status, limit, fetchFn });
  return {
    proposalFetcher: fetcher.asFetcher(),
    fetcher,
  };
}

/**
 * Well-known Cosmos chains with their cosmos.directory names and symbols.
 * Pass as { name } objects to CosmosGovernanceFetcher({ chains: [...] }).
 */
export const KNOWN_COSMOS_CHAINS = {
  COSMOS_HUB:  { name: 'cosmoshub',   symbol: 'ATOM' },
  OSMOSIS:     { name: 'osmosis',     symbol: 'OSMO' },
  JUNO:        { name: 'juno',        symbol: 'JUNO' },
  NEUTRON:     { name: 'neutron',     symbol: 'NTRN' },
  STRIDE:      { name: 'stride',      symbol: 'STRD' },
  INJECTIVE:   { name: 'injective',   symbol: 'INJ'  },
  CELESTIA:    { name: 'celestia',    symbol: 'TIA'  },
  DYDX:        { name: 'dydx',        symbol: 'DYDX' },
  AKASH:       { name: 'akash',       symbol: 'AKT'  },
  STARGAZE:    { name: 'stargaze',    symbol: 'STARS'},
  SECRET:      { name: 'secretnetwork', symbol: 'SCRT'},
  EVMOS:       { name: 'evmos',       symbol: 'EVMOS'},
  KUJIRA:      { name: 'kujira',      symbol: 'KUJI' },
  PERSISTENCE: { name: 'persistence', symbol: 'XPRT' },
  AGORIC:      { name: 'agoric',      symbol: 'BLD'  },
};
