/**
 * Ethereum Snapshot Fetcher — Production Adapter
 *
 * POWERED BY ORO · TRACE · VERIFY · REMEMBER
 *
 * Fetches governance proposals from Snapshot.org — the dominant off-chain
 * governance platform for Ethereum-ecosystem DAOs. Covers thousands of DAOs
 * including Uniswap, ENS, AAVE, Optimism, Arbitrum, 1inch, dYdX, Gitcoin,
 * Balancer, Curve, Lido, Sushi, Yearn, Gnosis, and every other major EVM DAO
 * that uses Snapshot for proposal voting.
 *
 * Snapshot uses a public GraphQL API (no API key required for basic access).
 * API: https://hub.snapshot.org/graphql
 * Docs: https://docs.snapshot.org/tools/graphql-api
 *
 * UNIVERSALIS GUBERNATIO — Paper XXXI
 * MERIDIAN governs any system with a ProposalFetcher adapter.
 * Snapshot is Target D — the Ethereum governance entry point.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const SNAPSHOT_GRAPHQL_URL = 'https://hub.snapshot.org/graphql';

// Snapshot proposal type → ORO risk hint for E6
const SNAPSHOT_RISK_HINT = {
  'single-choice':       'motion',
  'approval':            'motion',
  'quadratic':           'motion',
  'ranked-choice':       'motion',
  'weighted':            'motion',
  'basic':               'motion',
  // Executable proposals (Snapshot X)
  'basic_executable':    'code_upgrade',
  'weighted_executable': 'code_upgrade',
};

// GraphQL query — fetch recent proposals from watched spaces
const PROPOSALS_QUERY = `
  query GetProposals($spaces: [String!]!, $first: Int!, $skip: Int!, $state: String) {
    proposals(
      first: $first
      skip:  $skip
      where: { space_in: $spaces, state: $state }
      orderBy: "created"
      orderDirection: desc
    ) {
      id
      title
      body
      start
      end
      state
      type
      choices
      scores
      scores_total
      votes
      quorum
      author
      created
      updated
      link
      space {
        id
        name
        network
      }
      strategies {
        name
        params
      }
      plugins
      ipfs
    }
  }
`;

/**
 * EthereumSnapshotFetcher
 *
 * Watches one or more Snapshot spaces (DAO governance hubs) and fetches
 * their latest proposals. Returns normalized ProposalRecord-compatible
 * objects for E1.
 *
 * @example
 *   const fetcher = new EthereumSnapshotFetcher({
 *     spaces: ['ens.eth', 'uniswapgovernance.eth', 'aave.eth'],
 *   });
 *   const proposals = await fetcher.fetch();
 */
export class EthereumSnapshotFetcher {
  /**
   * @param {object} [options]
   * @param {string[]} [options.spaces=[]]         - Snapshot space IDs (ENS names or addresses)
   * @param {number}   [options.limit=50]          - Max proposals per fetch
   * @param {string}   [options.state='active']    - Filter: 'active', 'closed', 'pending', or null for all
   * @param {string}   [options.graphqlUrl]        - Override GraphQL endpoint
   * @param {Function} [options.fetchFn=fetch]     - Override fetch (for testing)
   */
  constructor({
    spaces      = [],
    limit       = 50,
    state       = 'active',
    graphqlUrl  = SNAPSHOT_GRAPHQL_URL,
    fetchFn     = null,
  } = {}) {
    this._spaces     = [...spaces];
    this._limit      = Math.min(1000, Math.max(1, limit));
    this._state      = state ?? null;
    this._graphqlUrl = graphqlUrl;
    this._fetchFn    = fetchFn ?? ((...args) => fetch(...args));

    // Track last seen proposal ID per space for deduplication
    this._seenIds = new Set();
  }

  /**
   * Fetch proposals from all watched Snapshot spaces.
   * @returns {Promise<object[]>} Normalized proposals
   */
  async fetch() {
    if (this._spaces.length === 0) return [];

    let response;
    try {
      response = await this._fetchFn(this._graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
        },
        body: JSON.stringify({
          query: PROPOSALS_QUERY,
          variables: {
            spaces: this._spaces,
            first:  this._limit,
            skip:   0,
            state:  this._state,
          },
        }),
      });
    } catch (err) {
      throw new Error(`[SnapshotFetcher] Network error: ${err.message}`);
    }

    if (!response.ok) {
      throw new Error(`[SnapshotFetcher] API error ${response.status}: ${response.statusText}`);
    }

    const body = await response.json();

    if (body.errors) {
      throw new Error(`[SnapshotFetcher] GraphQL error: ${JSON.stringify(body.errors)}`);
    }

    const items = body.data?.proposals ?? [];
    return items.map((item) => this._normalize(item));
  }

  /**
   * Returns a fetcher function for bootstrapORO({ proposalFetcher }).
   * @returns {Function} async () => object[]
   */
  asFetcher() {
    return () => this.fetch();
  }

  /**
   * Add a space to the watch list at runtime.
   * @param {string} spaceId - Snapshot space ID (e.g., 'ens.eth')
   */
  watchSpace(spaceId) {
    if (!this._spaces.includes(spaceId)) {
      this._spaces.push(spaceId);
    }
    return this;
  }

  /** Remove a space from the watch list. */
  unwatchSpace(spaceId) {
    this._spaces = this._spaces.filter((s) => s !== spaceId);
    return this;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  _normalize(item) {
    const space     = item.space ?? {};
    const spaceId   = space.id   ?? 'unknown';
    const spaceName = space.name ?? spaceId;
    const network   = space.network ?? 'ethereum';

    // Status mapping
    let status = 'unknown';
    if (item.state === 'active')  status = 'open';
    else if (item.state === 'closed') {
      // Determine if it passed based on quorum and scores
      const total   = item.scores_total ?? 0;
      const quorum  = item.quorum       ?? 0;
      status = (quorum === 0 || total >= quorum) ? 'adopted' : 'rejected';
    }
    else if (item.state === 'pending') status = 'open';

    // Vote summary
    const scoresSummary = Array.isArray(item.choices) && Array.isArray(item.scores)
      ? item.choices.map((choice, i) => `${choice}: ${(item.scores[i] ?? 0).toLocaleString()}`).join(' | ')
      : '';

    // Timestamps (Snapshot uses Unix seconds)
    const createdAt = item.created ? BigInt(item.created) * 1_000_000_000n : undefined;
    const decidedAt = item.end     ? BigInt(item.end)     * 1_000_000_000n : undefined;

    // Source links
    const proposalLink = item.link ?? `https://snapshot.org/#/${spaceId}/proposal/${item.id}`;
    const sourceLinks = [
      {
        type:        'snapshot_proposal',
        url:         proposalLink,
        title:       `Snapshot — ${spaceName}`,
        description: 'Snapshot governance proposal',
        retrievedAt: new Date().toISOString(),
      },
    ];

    if (item.ipfs) {
      sourceLinks.push({
        type:        'ipfs_snapshot',
        url:         `https://ipfs.io/ipfs/${item.ipfs}`,
        title:       'IPFS snapshot record',
        description: 'Immutable IPFS record of this Snapshot proposal',
        retrievedAt: new Date().toISOString(),
      });
    }

    return {
      proposalId:           `snapshot:${spaceId}:${item.id}`,
      daoType:              'SNAPSHOT',
      snsRootCanisterId:    undefined,
      governanceCanisterId: spaceId,

      title:   item.title   ?? '(untitled)',
      summary: _truncate(item.body ?? '', 2000),
      url:     proposalLink,

      topic:        `Snapshot:${spaceName}`,
      proposalType: item.type ?? 'basic',
      actionType:   item.type ?? 'basic',

      proposer: item.author ?? undefined,
      status,

      createdAt,
      decidedAt,
      executedAt: undefined, // Snapshot proposals are off-chain; execution is manual

      rawPayload: JSON.stringify({
        type:        item.type,
        choices:     item.choices,
        scores:      item.scores,
        scoresTotal: item.scores_total,
        quorum:      item.quorum,
        votes:       item.votes,
        network,
        strategies:  item.strategies,
      }),
      sourceLinks,

      // ORO internal hints
      _actionData:   { type: item.type, choices: item.choices, spaceId, spaceName, network },
      _riskHint:     SNAPSHOT_RISK_HINT[item.type ?? 'basic'] ?? 'motion',
      _scoreSummary: scoresSummary,
      _network:      network,
      _spaceName:    spaceName,
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
 * @param {string[]} [options.spaces=[]]       - Snapshot space IDs to watch
 * @param {number}   [options.limit=50]        - Max proposals per fetch
 * @param {string}   [options.state='active']  - Proposal state filter
 * @returns {{ proposalFetcher: Function, fetcher: EthereumSnapshotFetcher }}
 */
export function createSnapshotFetcher({ spaces = [], limit = 50, state = 'active', fetchFn } = {}) {
  const fetcher = new EthereumSnapshotFetcher({ spaces, limit, state, fetchFn });
  return {
    proposalFetcher: fetcher.asFetcher(),
    fetcher,
  };
}

/**
 * Well-known Snapshot space IDs for major EVM DAOs.
 * These represent the primary governance hubs for their protocols.
 */
export const KNOWN_SNAPSHOT_SPACES = {
  ENS:         'ens.eth',
  UNISWAP:     'uniswapgovernance.eth',
  AAVE:        'aave.eth',
  OPTIMISM:    'opcollective.eth',
  ARBITRUM:    'arbitrumfoundation.eth',
  INCH:        '1inch.eth',
  GITCOIN:     'gitcoindao.eth',
  BALANCER:    'balancer.eth',
  CURVE:       'curve.eth',
  LIDO:        'lido-snapshot.eth',
  SUSHI:       'sushigov.eth',
  YEARN:       'yearn.eth',
  GNOSIS:      'gnosis.eth',
  COMPOUND:    'compound-governance.eth',
  FRAX:        'frax.eth',
  DYDX:        'dydxgov.eth',
  ACROSS:      'acrossprotocol.eth',
  SAFE:        'safe.eth',
  SYNTHETIX:   'synthetixambassador.eth',
  STARKNET:    'starknet.eth',
};
