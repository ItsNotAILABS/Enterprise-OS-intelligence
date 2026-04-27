/**
 * Blockbox Canister Fetcher — Production Adapter
 *
 * POWERED BY ORO · TRACE · VERIFY · REMEMBER
 *
 * Monitors governance-relevant events in Alfredo Medina Hernandez's
 * Blockbox canister ecosystem — approximately 200 deployed canisters
 * maintained through autonomous heartbeat functions.
 *
 * This adapter treats every canister upgrade, controller change, settings
 * modification, and stop/start event as a "governance proposal" — because
 * in a sovereign 200-canister ecosystem, every change to any canister IS
 * a governance event that needs consequence tracing.
 *
 * The adapter polls the IC public API for:
 *   1. Canister version/module hash changes      (code_upgrade risk)
 *   2. Controller additions or removals          (governance_rule_change risk)
 *   3. Freezing threshold changes                (parameter_change risk)
 *   4. Memory allocation changes                 (parameter_change risk)
 *
 * Source: https://ic-api.internetcomputer.org/api/v3/canisters/{canisterId}
 *         https://ic-api.internetcomputer.org/api/v3
 *
 * No API key required — public IC endpoints.
 *
 * Usage with bootstrapORO:
 *   import { BlockboxFetcher, createBlockboxFetcher } from './adapters/blockbox-fetcher.js';
 *
 *   const { proposalFetcher, fetcher } = createBlockboxFetcher({
 *     canisterIds: ['aaaaa-aa', 'rrkah-fqaaa-aaaaa-aaaaq-cai'],
 *     ecosystemName: 'Alfredo Blockbox Builds',
 *   });
 *
 *   const oro = bootstrapORO({ proposalFetcher });
 *
 * UNIVERSALIS GUBERNATIO — Paper XXXI — ICP is first, not only.
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const IC_API_BASE = 'https://ic-api.internetcomputer.org/api/v3';

// Risk hint map for canister change types
const BLOCKBOX_RISK_HINT = {
  module_upgrade:         'code_upgrade',
  controller_change:      'governance_rule_change',
  freeze_threshold_change:'parameter_change',
  memory_allocation_change:'parameter_change',
  compute_allocation_change:'parameter_change',
  canister_stopped:       'canister_control_change',
  canister_started:       'canister_control_change',
  canister_deleted:       'canister_control_change',
  heartbeat_change:       'parameter_change',
};

/**
 * BlockboxFetcher
 *
 * Polls the IC API for governance-relevant changes across a named set of
 * canister IDs. Each detected change is normalized into a ProposalRecord
 * for E1 (ProposalIngestEngine).
 *
 * In a 200-canister autonomous ecosystem, MERIDIAN becomes the intelligence
 * layer that tracks what changed, what the consequence was, and what the
 * safe upgrade path looks like — replacing manual tracking that is impossible
 * at this scale.
 *
 * @example
 *   const fetcher = new BlockboxFetcher({
 *     canisterIds: ['rrkah-fqaaa-aaaaa-aaaaq-cai'],
 *     ecosystemName: 'Alfredo Blockbox Builds',
 *   });
 *   const proposals = await fetcher.fetch();
 */
export class BlockboxFetcher {
  /**
   * @param {object} [options]
   * @param {string[]}  [options.canisterIds=[]]      - ICP canister IDs to monitor
   * @param {string}    [options.ecosystemName='Blockbox']  - Human name for this ecosystem
   * @param {string}    [options.ownerId]             - Principal ID of the ecosystem owner (for source links)
   * @param {number}    [options.batchSize=10]        - Max concurrent IC API requests
   * @param {Function}  [options.fetchFn=fetch]       - Override fetch (for testing)
   */
  constructor({
    canisterIds   = [],
    ecosystemName = 'Blockbox',
    ownerId       = null,
    batchSize     = 10,
    fetchFn       = null,
  } = {}) {
    this._canisterIds   = [...canisterIds];
    this._ecosystemName = ecosystemName;
    this._ownerId       = ownerId;
    this._batchSize     = Math.max(1, batchSize);
    this._fetchFn       = fetchFn ?? ((...args) => fetch(...args));

    // Snapshot cache: canisterId → last known state { moduleHash, controllers, settings }
    this._lastState = new Map();
    this._syntheticSeq = 0; // sequence counter for synthetic proposal IDs
  }

  /**
   * Fetch governance-relevant changes across all monitored canisters.
   * On first call: returns the current state as baseline (no proposals).
   * On subsequent calls: returns proposals for every state change detected.
   *
   * @returns {Promise<object[]>} Normalized ProposalRecord-compatible objects
   */
  async fetch() {
    const proposals = [];
    const ids = [...this._canisterIds];

    // Process in batches to respect rate limits
    for (let i = 0; i < ids.length; i += this._batchSize) {
      const batch = ids.slice(i, i + this._batchSize);
      const results = await Promise.allSettled(
        batch.map((id) => this._checkCanister(id))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          proposals.push(...result.value);
        }
      }
    }

    return proposals;
  }

  /**
   * Returns a fetcher function compatible with bootstrapORO({ proposalFetcher }).
   * @returns {Function} async () => ProposalRecord[]
   */
  asFetcher() {
    return () => this.fetch();
  }

  /**
   * Add a canister to the monitored set at runtime.
   * @param {string} canisterId
   */
  watchCanister(canisterId) {
    if (!this._canisterIds.includes(canisterId)) {
      this._canisterIds.push(canisterId);
    }
    return this;
  }

  /** Remove a canister from the monitored set. */
  unwatchCanister(canisterId) {
    this._canisterIds = this._canisterIds.filter((id) => id !== canisterId);
    this._lastState.delete(canisterId);
    return this;
  }

  /** Return the list of currently monitored canister IDs. */
  get watchedCanisterIds() {
    return [...this._canisterIds];
  }

  // ── Private ──────────────────────────────────────────────────────────────

  async _checkCanister(canisterId) {
    const url = `${IC_API_BASE}/canisters/${canisterId}`;
    let response;

    try {
      response = await this._fetchFn(url, { headers: { Accept: 'application/json' } });
    } catch (err) {
      // Network error — skip this canister this cycle
      return [];
    }

    if (!response.ok) {
      // Canister not found or API error — skip silently
      return [];
    }

    let data;
    try {
      data = await response.json();
    } catch (_) {
      return [];
    }

    const current = this._extractState(data);
    const prev    = this._lastState.get(canisterId);

    // First time seeing this canister: store as baseline, no proposals
    if (!prev) {
      this._lastState.set(canisterId, current);
      return [];
    }

    // Diff current against previous — produce a proposal for each change
    const changes = this._diffState(prev, current, canisterId, data);
    this._lastState.set(canisterId, current);
    return changes;
  }

  _extractState(data) {
    return {
      moduleHash:           data.module_hash      ?? data.wasm_hash      ?? null,
      controllers:          _sortedJson(data.controllers ?? []),
      freezingThreshold:    data.settings?.freezing_threshold            ?? data.freezing_threshold ?? null,
      memoryAllocation:     data.settings?.memory_allocation             ?? data.memory_allocation  ?? null,
      computeAllocation:    data.settings?.compute_allocation            ?? data.compute_allocation ?? null,
      status:               data.status                                   ?? null,
      cyclesBalance:        data.cycles_balance                          ?? null,
    };
  }

  _diffState(prev, current, canisterId, rawData) {
    const proposals = [];
    const dashUrl   = `https://dashboard.internetcomputer.org/canister/${canisterId}`;
    const now       = new Date().toISOString();
    const createdAt = BigInt(Date.now()) * 1_000_000n; // ms → ns

    // ── Module hash change (upgrade) ──────────────────────────────────────
    if (prev.moduleHash !== current.moduleHash && current.moduleHash !== null) {
      proposals.push(this._makeProposal({
        canisterId,
        changeType:  'module_upgrade',
        title:       `Canister Upgrade Detected — ${_shortId(canisterId)}`,
        summary:
          `Module hash changed on canister ${canisterId}.\n` +
          `Previous hash: ${prev.moduleHash ?? '(unknown)'}\n` +
          `Current hash:  ${current.moduleHash}\n\n` +
          `This is a code upgrade event. E5 (Runtime Truth Engine) should compare ` +
          `the new module hash against any expected WASM to confirm the upgrade is as claimed.`,
        rawPayload: JSON.stringify({
          previousHash: prev.moduleHash,
          currentHash:  current.moduleHash,
        }),
        dashUrl,
        createdAt,
        riskHint: 'code_upgrade',
        evidence: [
          { type: 'ic_dashboard', url: dashUrl, title: `Canister ${canisterId}`, retrievedAt: now },
          {
            type: 'module_hash',
            url: `${IC_API_BASE}/canisters/${canisterId}`,
            title: 'IC API — module hash',
            description: `New module hash: ${current.moduleHash}`,
            retrievedAt: now,
          },
        ],
      }));
    }

    // ── Controller change ─────────────────────────────────────────────────
    if (prev.controllers !== current.controllers) {
      proposals.push(this._makeProposal({
        canisterId,
        changeType: 'controller_change',
        title:      `Controller Change — ${_shortId(canisterId)}`,
        summary:
          `Controllers changed on canister ${canisterId}.\n` +
          `Previous: ${prev.controllers}\n` +
          `Current:  ${current.controllers}\n\n` +
          `Controller changes affect who can upgrade, stop, or delete this canister. ` +
          `This is a governance-rule-class change — who holds authority has changed.`,
        rawPayload: JSON.stringify({
          previousControllers: JSON.parse(prev.controllers || '[]'),
          currentControllers:  JSON.parse(current.controllers || '[]'),
        }),
        dashUrl,
        createdAt,
        riskHint: 'governance_rule_change',
        evidence: [{ type: 'ic_dashboard', url: dashUrl, title: `Canister ${canisterId}`, retrievedAt: now }],
      }));
    }

    // ── Freezing threshold change ─────────────────────────────────────────
    if (prev.freezingThreshold !== current.freezingThreshold && current.freezingThreshold !== null) {
      proposals.push(this._makeProposal({
        canisterId,
        changeType: 'freeze_threshold_change',
        title:      `Freezing Threshold Changed — ${_shortId(canisterId)}`,
        summary:
          `Freezing threshold changed on canister ${canisterId}.\n` +
          `Previous: ${prev.freezingThreshold}\n` +
          `Current:  ${current.freezingThreshold}\n\n` +
          `The freezing threshold determines the cycles balance at which the canister ` +
          `will be frozen by the system. A lower threshold increases the risk of unexpected ` +
          `freezing if cycles are not replenished.`,
        rawPayload: JSON.stringify({ previous: prev.freezingThreshold, current: current.freezingThreshold }),
        dashUrl,
        createdAt,
        riskHint: 'parameter_change',
        evidence: [{ type: 'ic_dashboard', url: dashUrl, title: `Canister ${canisterId}`, retrievedAt: now }],
      }));
    }

    // ── Memory allocation change ──────────────────────────────────────────
    if (prev.memoryAllocation !== current.memoryAllocation && current.memoryAllocation !== null) {
      proposals.push(this._makeProposal({
        canisterId,
        changeType: 'memory_allocation_change',
        title:      `Memory Allocation Changed — ${_shortId(canisterId)}`,
        summary:
          `Memory allocation changed on canister ${canisterId}.\n` +
          `Previous: ${prev.memoryAllocation} bytes\n` +
          `Current:  ${current.memoryAllocation} bytes`,
        rawPayload: JSON.stringify({ previous: prev.memoryAllocation, current: current.memoryAllocation }),
        dashUrl,
        createdAt,
        riskHint: 'parameter_change',
        evidence: [{ type: 'ic_dashboard', url: dashUrl, title: `Canister ${canisterId}`, retrievedAt: now }],
      }));
    }

    // ── Status change (stopped/started) ──────────────────────────────────
    if (prev.status !== current.status && current.status !== null) {
      const changeType = current.status === 'stopped' ? 'canister_stopped' : 'canister_started';
      proposals.push(this._makeProposal({
        canisterId,
        changeType,
        title:   `Canister ${current.status === 'stopped' ? 'Stopped' : 'Started'} — ${_shortId(canisterId)}`,
        summary: `Canister ${canisterId} status changed from ${prev.status ?? 'unknown'} to ${current.status}.`,
        rawPayload: JSON.stringify({ previousStatus: prev.status, currentStatus: current.status }),
        dashUrl,
        createdAt,
        riskHint: 'canister_control_change',
        evidence: [{ type: 'ic_dashboard', url: dashUrl, title: `Canister ${canisterId}`, retrievedAt: now }],
      }));
    }

    return proposals;
  }

  _makeProposal({ canisterId, changeType, title, summary, rawPayload, dashUrl, createdAt, riskHint, evidence }) {
    this._syntheticSeq += 1;
    const proposalId = `blockbox:${canisterId}:${changeType}:${this._syntheticSeq}`;

    return {
      proposalId,
      daoType:              'BLOCKBOX',
      snsRootCanisterId:    undefined,
      governanceCanisterId: canisterId,

      title,
      summary,
      url: dashUrl,

      topic:        'BlockboxCanisterGovernance',
      proposalType: changeType,
      actionType:   changeType,

      proposer: this._ownerId ?? undefined,
      status:   'executed',  // canister changes are already executed when detected

      createdAt,
      decidedAt:  createdAt,
      executedAt: createdAt,

      rawPayload,
      sourceLinks: evidence.map((e) => ({
        type:        e.type,
        url:         e.url,
        title:       e.title ?? '',
        description: e.description ?? '',
        retrievedAt: e.retrievedAt,
      })),

      _actionData:  { changeType, canisterId, ecosystemName: this._ecosystemName },
      _riskHint:    riskHint,
      _ecosystemName: this._ecosystemName,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _sortedJson(arr) {
  if (!Array.isArray(arr)) return JSON.stringify(arr);
  return JSON.stringify([...arr].sort());
}

function _shortId(canisterId) {
  return canisterId.length > 15 ? `${canisterId.slice(0, 7)}…${canisterId.slice(-5)}` : canisterId;
}

/**
 * Convenience factory for bootstrapOROProduction.
 *
 * @param {object} options
 * @param {string[]} options.canisterIds        - ICP canister IDs to monitor
 * @param {string}   [options.ecosystemName]    - Human name for this ecosystem
 * @param {string}   [options.ownerId]          - Owner principal ID
 * @param {number}   [options.batchSize=10]     - Concurrent request batch size
 * @param {Function} [options.fetchFn]          - Override fetch (for testing)
 * @returns {{ proposalFetcher: Function, fetcher: BlockboxFetcher }}
 */
export function createBlockboxFetcher({
  canisterIds   = [],
  ecosystemName = 'Blockbox',
  ownerId       = null,
  batchSize     = 10,
  fetchFn,
} = {}) {
  const fetcher = new BlockboxFetcher({ canisterIds, ecosystemName, ownerId, batchSize, fetchFn });
  return {
    proposalFetcher: fetcher.asFetcher(),
    fetcher,
  };
}
