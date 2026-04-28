/**
 * Status Fetcher — Production Adapter
 *
 * POWERED BY ORO · TRACE · VERIFY · REMEMBER
 *
 * Provides:
 *   1. statusFetcher    — checks current execution status of a proposal
 *   2. afterStateFetcher — verifies after-state for executed proposals
 *
 * These are wired into E10 (Post-Execution Watch Engine) via bootstrapOROProduction.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const NNS_API_BASE = 'https://ic-api.internetcomputer.org/api/v3';
const SNS_API_BASE = 'https://sns-api.internetcomputer.org/api/v1';

/**
 * StatusFetcher
 *
 * Checks the current status of a proposal from the live IC API.
 * Used by E10 to detect execution or failure of adopted proposals.
 *
 * Compatible with bootstrapORO({ statusFetcher }).
 */
export class StatusFetcher {
  /**
   * @param {object} [options]
   * @param {Function} [options.fetchFn] - Override fetch (for testing)
   */
  constructor({ fetchFn = null } = {}) {
    this._fetchFn = fetchFn ?? ((...args) => fetch(...args));
  }

  /**
   * Fetch the current status of a proposal.
   *
   * @param {string} proposalId - The proposal ID.
   *   For NNS: numeric string (e.g., "130421")
   *   For SNS: composite string (e.g., "rrkah-fqaaa-aaaaa-aaaaq-cai:42")
   * @param {object} entry - The current trace entry (for context).
   *   entry.daoType: 'NNS' | 'SNS'
   *   entry.snsRootCanisterId: string (for SNS)
   *
   * @returns {Promise<{
   *   proposalId: string,
   *   status: 'open'|'adopted'|'rejected'|'executed'|'failed'|'unknown',
   *   executedAt: bigint | undefined,
   *   failureReason: string | undefined,
   *   truthAdvancement: string | undefined
   * }>}
   */
  async fetchStatus(proposalId, entry = {}) {
    const daoType = entry.daoType ?? (proposalId.includes(':') ? 'SNS' : 'NNS');

    if (daoType === 'NNS') {
      return this._fetchNNSStatus(proposalId);
    } else {
      return this._fetchSNSStatus(proposalId, entry.snsRootCanisterId);
    }
  }

  /**
   * Returns a statusFetcher function compatible with bootstrapORO({ statusFetcher }).
   * @returns {Function} async (proposalId, entry) => StatusResult
   */
  asFetcher() {
    return (proposalId, entry) => this.fetchStatus(proposalId, entry);
  }

  // ── Private ─────────────────────────────────────────────────────────────

  async _fetchNNSStatus(proposalId) {
    const url = `${NNS_API_BASE}/proposals/${proposalId}`;
    let response;

    try {
      response = await this._fetchFn(url, { headers: { Accept: 'application/json' } });
    } catch (err) {
      return this._unknownStatus(proposalId, `Network error: ${err.message}`);
    }

    if (!response.ok) {
      return this._unknownStatus(proposalId, `API error ${response.status}`);
    }

    const item = await response.json();
    const statusCode = item.status ?? null;

    let status = 'unknown';
    if (statusCode === 1) status = 'open';
    else if (statusCode === 2) status = 'rejected';
    else if (statusCode === 4) {
      if (item.executed_timestamp_seconds > 0) status = 'executed';
      else if (item.failed_timestamp_seconds > 0) status = 'failed';
      else status = 'adopted';
    }

    const executedAt = item.executed_timestamp_seconds > 0
      ? BigInt(Math.round(item.executed_timestamp_seconds)) * 1_000_000_000n
      : undefined;

    const failureReason = item.failure_reason
      ? (typeof item.failure_reason === 'string'
          ? item.failure_reason
          : JSON.stringify(item.failure_reason))
      : undefined;

    return {
      proposalId,
      status,
      executedAt,
      failureReason,
      truthAdvancement: status === 'executed' ? 'execution_confirmed'
                      : status === 'failed'   ? 'execution_failed'
                      : undefined,
    };
  }

  async _fetchSNSStatus(proposalId, rootCanisterId) {
    // Composite ID: "rootCanisterId:numericId"
    const parts = proposalId.split(':');
    const root = rootCanisterId ?? parts[0];
    const numericId = parts[parts.length - 1];

    const url = `${SNS_API_BASE}/snses/${root}/proposals/${numericId}`;
    let response;

    try {
      response = await this._fetchFn(url, { headers: { Accept: 'application/json' } });
    } catch (err) {
      return this._unknownStatus(proposalId, `Network error: ${err.message}`);
    }

    if (!response.ok) {
      return this._unknownStatus(proposalId, `API error ${response.status}`);
    }

    const item = await response.json();
    const decisionStatus = item.status ?? '';

    let status = 'unknown';
    if (decisionStatus.includes('Open'))     status = 'open';
    else if (decisionStatus.includes('Rejected')) status = 'rejected';
    else if (decisionStatus.includes('Adopted'))  status = 'adopted';
    else if (decisionStatus.includes('Executed')) status = 'executed';
    else if (decisionStatus.includes('Failed'))   status = 'failed';

    const executedAt = item.executed_timestamp_seconds > 0
      ? BigInt(Math.round(item.executed_timestamp_seconds)) * 1_000_000_000n
      : undefined;

    const failureReason = item.failure_reason ?? undefined;

    return {
      proposalId,
      status,
      executedAt,
      failureReason,
      truthAdvancement: status === 'executed' ? 'execution_confirmed'
                      : status === 'failed'   ? 'execution_failed'
                      : undefined,
    };
  }

  _unknownStatus(proposalId, reason) {
    return { proposalId, status: 'unknown', failureReason: reason };
  }
}

/**
 * AfterStateFetcher
 *
 * Attempts to verify the after-state of an executed proposal.
 * This is a structured best-effort — it provides what it can verify
 * from public IC APIs and flags what requires human confirmation.
 *
 * Compatible with bootstrapORO({ afterStateFetcher }).
 */
export class AfterStateFetcher {
  /**
   * @param {object} [options]
   * @param {Function} [options.fetchFn] - Override fetch (for testing)
   */
  constructor({ fetchFn = null } = {}) {
    this._fetchFn = fetchFn ?? ((...args) => fetch(...args));
  }

  /**
   * Attempt after-state verification for an executed proposal.
   *
   * Returns a structured result:
   * {
   *   verified: boolean,         // true only if machine-verifiable evidence exists
   *   evidence: SourceLink[],    // source-linked evidence records
   *   notes: string,             // plain-language description of what was checked
   *   requiresHumanVerification: boolean
   * }
   *
   * ORO Guardrail: verified=true ONLY when machine-verifiable evidence is attached.
   * If the after-state requires human inspection, verified=false and
   * requiresHumanVerification=true is returned.
   */
  async fetchAfterState(proposalId, entry = {}) {
    const riskClass = entry.riskClass ?? 'unknown';
    const actionType = entry.actionType ?? '';
    const targetCanisterId = entry.targetCanisterId;
    const daoType = entry.daoType ?? 'NNS';

    const evidence = [];
    let verified = false;
    let requiresHumanVerification = true;
    const checks = [];

    // ── Dashboard evidence link (always available) ──────────────────────
    if (daoType === 'NNS') {
      const numericId = proposalId;
      evidence.push({
        type: 'nns_dashboard',
        url: `https://dashboard.internetcomputer.org/proposal/${numericId}`,
        title: 'NNS Proposal Dashboard',
        description: 'IC Dashboard — check execution status and timeline',
        retrievedAt: new Date().toISOString(),
      });
      checks.push('IC Dashboard execution record linked');
    } else {
      const parts = proposalId.split(':');
      const root = entry.snsRootCanisterId ?? parts[0];
      const numId = parts[parts.length - 1];
      evidence.push({
        type: 'sns_dashboard',
        url: `https://dashboard.internetcomputer.org/sns/${root}/proposal/${numId}`,
        title: 'SNS Proposal Dashboard',
        description: 'IC Dashboard — check SNS execution status',
        retrievedAt: new Date().toISOString(),
      });
      checks.push('IC Dashboard SNS execution record linked');
    }

    // ── Canister module hash check (for code upgrade proposals) ──────────
    if (
      (actionType === 'InstallCode' || actionType === 'UpgradeSnsControlledCanister') &&
      targetCanisterId
    ) {
      const moduleHashUrl = `https://ic-api.internetcomputer.org/api/v3/canisters/${targetCanisterId}`;
      try {
        const resp = await this._fetchFn(moduleHashUrl, { headers: { Accept: 'application/json' } });
        if (resp.ok) {
          const data = await resp.json();
          const moduleHash = data.module_hash ?? data.wasm_hash ?? null;
          if (moduleHash) {
            evidence.push({
              type: 'canister_module_hash',
              url: `https://dashboard.internetcomputer.org/canister/${targetCanisterId}`,
              title: `Canister ${targetCanisterId} module hash`,
              description: `Post-execution module hash: ${moduleHash}. Compare to proposal WASM hash to confirm upgrade.`,
              retrievedAt: new Date().toISOString(),
            });
            checks.push(`Module hash fetched for ${targetCanisterId}: ${moduleHash}`);
            // We have machine evidence — but human must compare the hashes
            requiresHumanVerification = true;
            verified = false; // verified=true only when hash comparison is automated
          }
        }
      } catch (_) {
        checks.push(`Module hash fetch failed for ${targetCanisterId} — requires manual check`);
      }
    }

    // ── Treasury proposal: flag for human verification ───────────────────
    if (riskClass === 'treasury_action' || actionType === 'TransferSnsTreasuryFunds' || actionType === 'MintSnsTokens') {
      checks.push(
        'Treasury action: check destination account balance on ICP ledger or SNS ledger. ' +
        'Human verification required — ORO cannot verify private account balances.'
      );
      requiresHumanVerification = true;
    }

    // ── Build verification notes ─────────────────────────────────────────
    const notes = [
      `After-state check for ${proposalId} (${actionType}).`,
      ...checks,
      requiresHumanVerification
        ? 'Human verification required to advance truth status to verified_after_state.'
        : 'Machine verification complete.',
    ].join('\n');

    return { verified, evidence, notes, requiresHumanVerification };
  }

  /**
   * Returns an afterStateFetcher function for bootstrapORO({ afterStateFetcher }).
   * @returns {Function}
   */
  asFetcher() {
    return (proposalId, entry) => this.fetchAfterState(proposalId, entry);
  }
}

/**
 * Convenience: create production status and after-state fetchers.
 *
 * @param {object} [options]
 * @returns {{
 *   statusFetcher: Function,
 *   afterStateFetcher: Function,
 *   statusFetcherInstance: StatusFetcher,
 *   afterStateFetcherInstance: AfterStateFetcher
 * }}
 */
export function createStatusFetchers({ fetchFn } = {}) {
  const statusFetcherInstance    = new StatusFetcher({ fetchFn });
  const afterStateFetcherInstance = new AfterStateFetcher({ fetchFn });

  return {
    statusFetcher:             statusFetcherInstance.asFetcher(),
    afterStateFetcher:         afterStateFetcherInstance.asFetcher(),
    statusFetcherInstance,
    afterStateFetcherInstance,
  };
}
