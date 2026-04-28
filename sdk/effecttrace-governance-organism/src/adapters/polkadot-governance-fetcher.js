/**
 * Polkadot OpenGov Fetcher — Production Adapter
 *
 * POWERED BY ORO · TRACE · VERIFY · REMEMBER
 *
 * Fetches governance referenda from Polkadot and Kusama via the Polkassembly
 * public API — the primary governance explorer for the Polkadot ecosystem.
 *
 * Polkadot introduced OpenGov (Governance v2) which features:
 *   - Multiple parallel referenda tracks (Root, Whitelist, Treasurer, etc.)
 *   - Approval + Support curves (no simple majority)
 *   - No Council — direct stakeholder governance
 *   - Fellowship for technical votes
 *
 * This is the most sophisticated on-chain governance system in production
 * and represents the highest governance intelligence challenge for MERIDIAN:
 * the multi-track system requires tracking consequence across different
 * authority levels simultaneously.
 *
 * Polkassembly API: https://api.polkassembly.io/api/v1
 * Docs: https://documenter.getpostman.com/view/5229531/UyrDFEPC
 * No API key required for public endpoints.
 *
 * Polkadot Subscan: https://polkadot.api.subscan.io/api/scan/democracy/referendums
 * (alternative data source — available as a secondary link)
 *
 * UNIVERSALIS GUBERNATIO — Paper XXXI
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const POLKASSEMBLY_BASE = 'https://api.polkassembly.io/api/v1';

// Polkadot OpenGov tracks → ORO risk hint for E6
// Higher authority tracks = higher risk
const TRACK_RISK_HINT = {
  // Polkadot OpenGov tracks (numeric IDs)
  0:  'systemic_or_emergency',    // Root — highest authority
  1:  'code_upgrade',             // Whitelisted Caller
  10: 'governance_rule_change',   // Staking Admin
  11: 'treasury_action',          // Treasurer
  12: 'motion',                   // Lease Admin
  13: 'registry_or_network_change', // Fellowship Admin
  14: 'governance_rule_change',   // General Admin
  15: 'systemic_or_emergency',    // Referendum Canceller
  17: 'systemic_or_emergency',    // Referendum Killer
  20: 'parameter_change',         // Small Tipper
  21: 'parameter_change',         // Big Tipper
  30: 'treasury_action',          // Small Spender
  31: 'treasury_action',          // Medium Spender
  32: 'treasury_action',          // Big Spender
};

// Polkassembly proposal status → ORO status
const POLKADOT_STATUS_MAP = {
  Submitted:         'open',
  Deciding:          'open',
  ConfirmStarted:    'open',
  Approved:          'adopted',
  Passed:            'adopted',
  Executed:          'executed',
  ExecutionFailed:   'failed',
  Rejected:          'rejected',
  Cancelled:         'rejected',
  Killed:            'rejected',
  TimedOut:          'rejected',
};

// Named OpenGov tracks for human-readable topic
const TRACK_NAMES = {
  0:  'Root',
  1:  'Whitelisted Caller',
  10: 'Staking Admin',
  11: 'Treasurer',
  12: 'Lease Admin',
  13: 'Fellowship Admin',
  14: 'General Admin',
  15: 'Referendum Canceller',
  17: 'Referendum Killer',
  20: 'Small Tipper',
  21: 'Big Tipper',
  30: 'Small Spender',
  31: 'Medium Spender',
  32: 'Big Spender',
};

/**
 * PolkadotGovernanceFetcher
 *
 * Watches Polkadot and/or Kusama OpenGov referenda, with optional track
 * filtering. Returns normalized ProposalRecord-compatible objects for E1.
 *
 * The multi-track system means a Root track referendum (requiring 50%+
 * turnout approval) carries dramatically different risk than a Small Tipper
 * referendum. MERIDIAN's E6 Risk Scorer uses the track number to apply the
 * appropriate risk classification.
 *
 * @example
 *   const fetcher = new PolkadotGovernanceFetcher({
 *     networks: ['polkadot'],
 *     trackIds: [0, 1, 11, 32],  // Root, Whitelisted, Treasurer, Big Spender
 *   });
 *   const proposals = await fetcher.fetch();
 */
export class PolkadotGovernanceFetcher {
  /**
   * @param {object} [options]
   * @param {string[]} [options.networks=['polkadot']]  - 'polkadot' and/or 'kusama'
   * @param {number[]} [options.trackIds=[]]            - OpenGov track IDs to filter (empty = all)
   * @param {number}   [options.limit=25]               - Max referenda per network per fetch
   * @param {string}   [options.status='active']        - 'active', 'all', or specific status string
   * @param {string}   [options.apiBase]                - Override API base URL
   * @param {Function} [options.fetchFn=fetch]          - Override fetch (for testing)
   */
  constructor({
    networks  = ['polkadot'],
    trackIds  = [],
    limit     = 25,
    status    = 'active',
    apiBase   = POLKASSEMBLY_BASE,
    fetchFn   = null,
  } = {}) {
    // Validate networks
    const validNetworks = new Set(['polkadot', 'kusama']);
    this._networks  = networks.filter((n) => validNetworks.has(n));
    this._trackIds  = new Set(trackIds);
    this._limit     = Math.min(100, Math.max(1, limit));
    this._status    = status;
    this._apiBase   = apiBase;
    this._fetchFn   = fetchFn ?? ((...args) => fetch(...args));
  }

  /**
   * Fetch referenda from all watched networks.
   * @returns {Promise<object[]>} Normalized proposals
   */
  async fetch() {
    if (this._networks.length === 0) return [];

    const results = await Promise.allSettled(
      this._networks.map((network) => this._fetchForNetwork(network))
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

  /** Add a network to the watch list. */
  watchNetwork(network) {
    if (['polkadot', 'kusama'].includes(network) && !this._networks.includes(network)) {
      this._networks.push(network);
    }
    return this;
  }

  /** Remove a network from the watch list. */
  unwatchNetwork(network) {
    this._networks = this._networks.filter((n) => n !== network);
    return this;
  }

  /** Add an OpenGov track to the filter. An empty filter watches all tracks. */
  watchTrack(trackId) {
    this._trackIds.add(trackId);
    return this;
  }

  /** Remove an OpenGov track from the filter. */
  unwatchTrack(trackId) {
    this._trackIds.delete(trackId);
    return this;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  async _fetchForNetwork(network) {
    // Polkassembly uses a network header, not path
    const url = `${this._apiBase}/listing/on-chain-posts`;

    const params = new URLSearchParams();
    params.set('proposalType', 'referendums_v2');
    params.set('page', '1');
    params.set('listingLimit', String(this._limit));
    params.set('sortBy', 'newest');

    if (this._status && this._status !== 'all') {
      params.set('filterBy', this._status === 'active' ? 'active' : this._status);
    }

    if (this._trackIds.size > 0) {
      params.set('trackNo', [...this._trackIds].join(','));
    }

    let response;
    try {
      response = await this._fetchFn(`${url}?${params.toString()}`, {
        headers: {
          'Accept':  'application/json',
          'x-network': network,
        },
      });
    } catch (err) {
      throw new Error(`[PolkadotFetcher:${network}] Network error: ${err.message}`);
    }

    if (!response.ok) {
      throw new Error(`[PolkadotFetcher:${network}] API error ${response.status}`);
    }

    const body  = await response.json();
    const items = body.posts ?? body.data ?? [];
    return items.map((item) => this._normalize(item, network));
  }

  _normalize(item, network) {
    const refIndex = item.post_id ?? item.index ?? null;
    const trackId  = item.track_number ?? item.trackNumber ?? null;
    const trackName = trackId !== null ? (TRACK_NAMES[trackId] ?? `Track ${trackId}`) : 'Unknown';
    const symbol    = network === 'kusama' ? 'KSM' : 'DOT';

    // Status
    const rawStatus = item.status ?? item.onchainId?.status ?? '';
    const status    = POLKADOT_STATUS_MAP[rawStatus] ?? 'unknown';

    // Timestamps
    const createdAt = item.created_at
      ? BigInt(Math.round(new Date(item.created_at).getTime())) * 1_000_000n
      : undefined;
    const decidedAt = item.end
      ? BigInt(Math.round(new Date(item.end).getTime())) * 1_000_000n
      : undefined;

    // Vote tally
    const tally = item.tally ?? {};

    // Proposal content
    const title   = item.title   ?? `${symbol} Referendum #${refIndex}`;
    const summary = _truncate(item.content ?? item.description ?? '', 2000);

    // Risk hint based on track
    const riskHint = trackId !== null
      ? (TRACK_RISK_HINT[trackId] ?? 'motion')
      : 'motion';

    const now = new Date().toISOString();
    const polkassemblyUrl = `https://${network}.polkassembly.io/referenda/${refIndex}`;
    const subscanUrl      = `https://${network}.subscan.io/referenda_v2/${refIndex}`;

    const sourceLinks = [
      {
        type:        'polkassembly',
        url:         polkassemblyUrl,
        title:       `Polkassembly — ${symbol} Referendum #${refIndex}`,
        description: `${network} OpenGov referendum on Polkassembly`,
        retrievedAt: now,
      },
      {
        type:        'subscan',
        url:         subscanUrl,
        title:       `Subscan — ${symbol} Referendum #${refIndex}`,
        description: `${network} referendum on Subscan block explorer`,
        retrievedAt: now,
      },
    ];

    return {
      proposalId:           `polkadot:${network}:${refIndex}`,
      daoType:              'POLKADOT_OPENGOV',
      snsRootCanisterId:    undefined,
      governanceCanisterId: `polkadot:${network}:gov`,

      title,
      summary,
      url: polkassemblyUrl,

      topic:        `Polkadot:${symbol}:${trackName}`,
      proposalType: trackName,
      actionType:   trackName,

      proposer: item.proposer ?? undefined,
      status,

      createdAt,
      decidedAt,
      executedAt: status === 'executed' && item.updated_at
        ? BigInt(Math.round(new Date(item.updated_at).getTime())) * 1_000_000n
        : undefined,

      rawPayload: JSON.stringify({
        trackId,
        trackName,
        tally,
        hash: item.hash ?? null,
        preimage: item.preimage ?? null,
      }),
      sourceLinks,

      // ORO internal hints
      _actionData:  { trackId, trackName, network, tally, hash: item.hash },
      _riskHint:    riskHint,
      _network:     network,
      _symbol:      symbol,
      _trackId:     trackId,
      _trackName:   trackName,
      _tally:       tally,
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
 * @param {string[]} [options.networks=['polkadot']]  - 'polkadot' and/or 'kusama'
 * @param {number[]} [options.trackIds=[]]            - Track IDs to watch (empty = all)
 * @param {number}   [options.limit=25]
 * @returns {{ proposalFetcher: Function, fetcher: PolkadotGovernanceFetcher }}
 */
export function createPolkadotFetcher({ networks = ['polkadot'], trackIds = [], limit = 25, fetchFn } = {}) {
  const fetcher = new PolkadotGovernanceFetcher({ networks, trackIds, limit, fetchFn });
  return {
    proposalFetcher: fetcher.asFetcher(),
    fetcher,
  };
}

/**
 * Polkadot OpenGov track IDs grouped by risk tier.
 * Use these to create targeted watchers for specific governance domains.
 */
export const POLKADOT_TRACKS = {
  ALL_NETWORKS:  ['polkadot', 'kusama'],
  HIGH_RISK:     [0, 1, 15, 17],        // Root, Whitelisted, Canceller, Killer
  TREASURY:      [11, 20, 21, 30, 31, 32], // Treasurer, Tippers, Spenders
  ADMIN:         [10, 12, 13, 14],       // Staking, Lease, Fellowship, General Admin
  ALL_TRACKS:    Object.keys(TRACK_NAMES).map(Number),
};

/**
 * Named track constants for composing filtered watchers.
 */
export const POLKADOT_TRACK_IDS = {
  ROOT:                  0,
  WHITELISTED_CALLER:    1,
  STAKING_ADMIN:         10,
  TREASURER:             11,
  LEASE_ADMIN:           12,
  FELLOWSHIP_ADMIN:      13,
  GENERAL_ADMIN:         14,
  REFERENDUM_CANCELLER:  15,
  REFERENDUM_KILLER:     17,
  SMALL_TIPPER:          20,
  BIG_TIPPER:            21,
  SMALL_SPENDER:         30,
  MEDIUM_SPENDER:        31,
  BIG_SPENDER:           32,
};
