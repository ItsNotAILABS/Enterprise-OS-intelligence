/**
 * Tally Governance Fetcher — Production Adapter
 *
 * POWERED BY ORO · TRACE · VERIFY · REMEMBER
 *
 * Fetches on-chain governance proposals via the Tally API — the leading
 * explorer and API for Governor Bravo / OpenZeppelin Governor contracts.
 *
 * Tally covers every major on-chain EVM DAO:
 *   - Compound (the original Governor Bravo reference implementation)
 *   - Uniswap (on-chain)
 *   - Nouns DAO
 *   - Arbitrum DAO
 *   - Optimism Collective
 *   - ENS DAO (on-chain)
 *   - Any EVM DAO using OpenZeppelin Governor or Governor Bravo
 *
 * Unlike Snapshot (off-chain voting), Tally proposals are executed ON-CHAIN:
 * if a proposal passes, the calldata is executed by the timelock contract
 * with no human intervention required. This makes consequence tracing
 * significantly more important — and MERIDIAN's E5 WASM/calldata comparison
 * directly applicable.
 *
 * Tally API: https://api.tally.xyz/query (GraphQL)
 * Docs: https://docs.tally.xyz/tally-api
 * API key: Required (free tier available at https://tally.xyz/user/settings)
 *
 * UNIVERSALIS GUBERNATIO — Paper XXXI
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const TALLY_GRAPHQL_URL = 'https://api.tally.xyz/query';

// Tally proposal type / action → ORO risk hint for E6
const TALLY_RISK_HINT = {
  'transfer':     'treasury_action',
  'custom':       'code_upgrade',
  'upgrade':      'code_upgrade',
  'setAdmin':     'governance_rule_change',
  'execute':      'code_upgrade',
  'setParameter': 'parameter_change',
  'vote':         'governance_rule_change',
};

// GraphQL query for Tally proposals
const TALLY_PROPOSALS_QUERY = `
  query GetProposals($chainId: ChainID!, $governorIds: [AccountID!], $pagination: Pagination, $sort: ProposalSort) {
    proposals(
      chainId: $chainId
      governorIds: $governorIds
      pagination: $pagination
      sort: $sort
    ) {
      id
      title
      description
      status
      start { timestamp }
      end   { timestamp }
      eta
      quorum
      votes { forVotes againstVotes abstainVotes }
      executable { callDatas targets values signatures }
      proposer { address }
      governor {
        id
        name
        type
        tokens { symbol decimals }
        contracts { governor { address } timelock { address } }
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * TallyGovernanceFetcher
 *
 * Fetches on-chain governance proposals from Tally for one or more DAO
 * governors. Returns normalized ProposalRecord-compatible objects for E1.
 *
 * On-chain governance is the highest-stakes governance class: passed proposals
 * are executed by the timelock contract automatically. MERIDIAN's E5 calldata
 * comparison is most critical here — because what the calldata actually does
 * often differs from what the proposal description says.
 *
 * @example
 *   const fetcher = new TallyGovernanceFetcher({
 *     apiKey:    process.env.TALLY_API_KEY,
 *     chainId:   'eip155:1',   // Ethereum mainnet
 *     governorIds: [
 *       'eip155:1:0xc0Da02939E1441F497fd74F78cE7Decb17B66529',  // Compound
 *     ],
 *   });
 *   const proposals = await fetcher.fetch();
 */
export class TallyGovernanceFetcher {
  /**
   * @param {object} [options]
   * @param {string}   options.apiKey                - Tally API key (required)
   * @param {string}   [options.chainId='eip155:1']  - EIP-155 chain ID
   * @param {string[]} [options.governorIds=[]]      - Tally governor account IDs
   * @param {number}   [options.limit=50]            - Max proposals per fetch
   * @param {string}   [options.graphqlUrl]          - Override GraphQL endpoint
   * @param {Function} [options.fetchFn=fetch]       - Override fetch (for testing)
   */
  constructor({
    apiKey,
    chainId     = 'eip155:1',
    governorIds = [],
    limit       = 50,
    graphqlUrl  = TALLY_GRAPHQL_URL,
    fetchFn     = null,
  } = {}) {
    if (!apiKey) throw new Error('[TallyFetcher] apiKey is required. Get a free key at https://tally.xyz/user/settings');
    this._apiKey      = apiKey;
    this._chainId     = chainId;
    this._governorIds = [...governorIds];
    this._limit       = Math.min(100, Math.max(1, limit));
    this._graphqlUrl  = graphqlUrl;
    this._fetchFn     = fetchFn ?? ((...args) => fetch(...args));
  }

  /**
   * Fetch on-chain governance proposals from all watched governors.
   * @returns {Promise<object[]>} Normalized proposals
   */
  async fetch() {
    if (this._governorIds.length === 0) return [];

    let response;
    try {
      response = await this._fetchFn(this._graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
          'Api-Key':      this._apiKey,
        },
        body: JSON.stringify({
          query: TALLY_PROPOSALS_QUERY,
          variables: {
            chainId:     this._chainId,
            governorIds: this._governorIds,
            pagination:  { limit: this._limit },
            sort:        { field: 'CREATED_AT', order: 'DESC' },
          },
        }),
      });
    } catch (err) {
      throw new Error(`[TallyFetcher] Network error: ${err.message}`);
    }

    if (!response.ok) {
      throw new Error(`[TallyFetcher] API error ${response.status}: ${response.statusText}`);
    }

    const body = await response.json();
    if (body.errors) {
      throw new Error(`[TallyFetcher] GraphQL error: ${JSON.stringify(body.errors)}`);
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
   * Add a governor to the watch list at runtime.
   * @param {string} governorId - Tally governor account ID
   */
  watchGovernor(governorId) {
    if (!this._governorIds.includes(governorId)) {
      this._governorIds.push(governorId);
    }
    return this;
  }

  /** Remove a governor from the watch list. */
  unwatchGovernor(governorId) {
    this._governorIds = this._governorIds.filter((id) => id !== governorId);
    return this;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  _normalize(item) {
    const governor   = item.governor ?? {};
    const govName    = governor.name ?? 'Unknown DAO';
    const govAddress = governor.contracts?.governor?.address ?? null;
    const timelockAddress = governor.contracts?.timelock?.address ?? null;
    const tokenSymbol = governor.tokens?.[0]?.symbol ?? 'GOV';

    // Status
    let status = 'unknown';
    const s = (item.status ?? '').toLowerCase();
    if (s === 'active' || s === 'pending') status = 'open';
    else if (s === 'succeeded' || s === 'queued') status = 'adopted';
    else if (s === 'defeated' || s === 'canceled') status = 'rejected';
    else if (s === 'executed') status = 'executed';
    else if (s === 'expired') status = 'rejected';

    // Timestamps
    const createdAt  = item.createdAt  ? BigInt(new Date(item.createdAt).getTime()) * 1_000_000n : undefined;
    const decidedAt  = item.end?.timestamp ? BigInt(new Date(item.end.timestamp).getTime()) * 1_000_000n : undefined;
    const executedAt = (s === 'executed' && item.updatedAt)
      ? BigInt(new Date(item.updatedAt).getTime()) * 1_000_000n
      : undefined;

    // Vote totals
    const votes = item.votes ?? {};
    const forVotes     = votes.forVotes     ? BigInt(votes.forVotes)     : 0n;
    const againstVotes = votes.againstVotes ? BigInt(votes.againstVotes) : 0n;
    const abstainVotes = votes.abstainVotes ? BigInt(votes.abstainVotes) : 0n;

    // Executable calldata — this is the most important field for MERIDIAN's E5
    const executable = item.executable ?? {};
    const targets    = executable.targets    ?? [];
    const callDatas  = executable.callDatas  ?? [];
    const signatures = executable.signatures ?? [];
    const values     = executable.values     ?? [];

    // Detect action types from calldata/signatures
    const actionTypes = signatures.length > 0
      ? signatures.map((sig) => sig.split('(')[0].trim()).filter(Boolean)
      : ['custom'];

    const primaryActionType = actionTypes[0] ?? 'custom';

    // Infer risk hint from action types
    let riskHint = 'code_upgrade'; // default for on-chain proposals — they execute calldata
    if (primaryActionType.toLowerCase().includes('transfer')) riskHint = 'treasury_action';
    else if (primaryActionType.toLowerCase().includes('upgrade')) riskHint = 'code_upgrade';
    else if (primaryActionType.toLowerCase().includes('admin') || primaryActionType.toLowerCase().includes('owner')) riskHint = 'governance_rule_change';
    else if (primaryActionType.toLowerCase().includes('set')) riskHint = 'parameter_change';
    else riskHint = TALLY_RISK_HINT[primaryActionType] ?? 'code_upgrade';

    const now = new Date().toISOString();

    const sourceLinks = [
      {
        type:        'tally_proposal',
        url:         `https://www.tally.xyz/gov/${governor.id}/proposal/${item.id}`,
        title:       `Tally — ${govName}`,
        description: 'On-chain governance proposal on Tally',
        retrievedAt: now,
      },
    ];

    if (govAddress) {
      sourceLinks.push({
        type:        'etherscan_governor',
        url:         `https://etherscan.io/address/${govAddress}#readContract`,
        title:       `Governor contract ${_shortAddr(govAddress)}`,
        description: 'Governor contract on Etherscan — verify calldata execution',
        retrievedAt: now,
      });
    }

    if (timelockAddress) {
      sourceLinks.push({
        type:        'etherscan_timelock',
        url:         `https://etherscan.io/address/${timelockAddress}`,
        title:       `Timelock ${_shortAddr(timelockAddress)}`,
        description: 'Timelock contract — queued proposals execute here',
        retrievedAt: now,
      });
    }

    return {
      proposalId:           `tally:${this._chainId}:${item.id}`,
      daoType:              'TALLY_ONCHAIN',
      snsRootCanisterId:    undefined,
      governanceCanisterId: governor.id ?? 'unknown',

      title:   item.title       ?? '(untitled)',
      summary: _truncate(item.description ?? '', 2000),
      url:     `https://www.tally.xyz/gov/${governor.id}/proposal/${item.id}`,

      topic:        `Tally:${govName}`,
      proposalType: primaryActionType,
      actionType:   primaryActionType,

      proposer: item.proposer?.address ?? undefined,
      status,

      createdAt,
      decidedAt,
      executedAt,

      rawPayload: JSON.stringify({ targets, callDatas, signatures, values }),
      sourceLinks,

      // ORO internal hints
      _actionData: {
        targets,
        callDatas,   // E5 (Runtime Truth Engine) should compare these against description claims
        signatures,
        values,
        governorId: governor.id,
        govName,
        tokenSymbol,
      },
      _riskHint:    riskHint,
      _forVotes:    forVotes.toString(),
      _againstVotes: againstVotes.toString(),
      _abstainVotes: abstainVotes.toString(),
      _timelockAddress: timelockAddress,
      _govAddress:      govAddress,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

function _shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '(unknown)';
}

/**
 * Convenience factory for bootstrapOROProduction.
 *
 * @param {object} options
 * @param {string}   options.apiKey           - Tally API key (required)
 * @param {string}   [options.chainId]        - EIP-155 chain ID
 * @param {string[]} [options.governorIds=[]] - Governor account IDs
 * @param {number}   [options.limit=50]
 * @returns {{ proposalFetcher: Function, fetcher: TallyGovernanceFetcher }}
 */
export function createTallyFetcher({ apiKey, chainId, governorIds = [], limit = 50, fetchFn } = {}) {
  const fetcher = new TallyGovernanceFetcher({ apiKey, chainId, governorIds, limit, fetchFn });
  return {
    proposalFetcher: fetcher.asFetcher(),
    fetcher,
  };
}

/**
 * Well-known Tally governor IDs for major on-chain EVM DAOs.
 * Format: eip155:{chainId}:{governorContractAddress}
 */
export const KNOWN_TALLY_GOVERNORS = {
  COMPOUND_MAINNET:  'eip155:1:0xc0Da02939E1441F497fd74F78cE7Decb17B66529',
  UNISWAP_MAINNET:   'eip155:1:0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
  ENS_MAINNET:       'eip155:1:0x323A76393544d5ecca80cd6ef2A560C6a395b7E3',
  NOUNS_MAINNET:     'eip155:1:0x6f3E6272A167e8AcCb32072d08E0957F9c79223d',
  ARBITRUM_CORE:     'eip155:42161:0xf07DeD9dC292157749B6Fd268E37DF6EA38395B9',
  OPTIMISM_TOKEN:    'eip155:10:0xcDF27F107725988f2261Ce2256bDfCdE8B382B10',
  FRAX_MAINNET:      'eip155:1:0xe8Ab863E629a05c73D6a23b99d37027E3763156E',
  AAVE_MAINNET:      'eip155:1:0x9AEE0B04504CeF83A65AC3f0e838D0593BCb2BC7',
};

/**
 * Tally chain IDs for common EVM networks.
 */
export const TALLY_CHAIN_IDS = {
  ETHEREUM:  'eip155:1',
  ARBITRUM:  'eip155:42161',
  OPTIMISM:  'eip155:10',
  POLYGON:   'eip155:137',
  BASE:      'eip155:8453',
  AVALANCHE: 'eip155:43114',
  BNB:       'eip155:56',
};
