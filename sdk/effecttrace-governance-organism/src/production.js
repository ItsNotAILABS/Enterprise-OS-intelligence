/**
 * EffectTrace — Production Bootstrap
 *
 * ╔═══════════════════════════════════════════════════════════╗
 * ║              POWERED BY ORO                               ║
 * ║         TRACE · VERIFY · REMEMBER                        ║
 * ║                                                           ║
 * ║  ORO is not a product. ORO is the engine.                 ║
 * ║  EffectTrace is powered by ORO.                           ║
 * ║                                                           ║
 * ║  TRACE    — STIGMERGY (Paper XX)                          ║
 * ║  VERIFY   — QUORUM    (Paper XXI)                         ║
 * ║  REMEMBER — AURUM     (Paper XXII)                        ║
 * ║                                                           ║
 * ║  The organism is always alive.                            ║
 * ║  It generates its own activity.                           ║
 * ╚═══════════════════════════════════════════════════════════╝
 *
 * This module wires real NNS/SNS proposal fetchers, production status
 * checkers, and the full 15-engine pipeline into a single bootstrapOROProduction()
 * call that returns a live OROGovernanceOrganism ready to start().
 *
 * Usage:
 *   import { bootstrapOROProduction } from '@medina/effecttrace-governance-organism/production';
 *
 *   const oro = bootstrapOROProduction({
 *     watchedSNSDaos: ['rootCanisterId1', 'rootCanisterId2'],
 *     autoStart: true,
 *   });
 *
 *   oro.on('alert', ({ proposalId, riskLevel, findings }) => {
 *     // Handle high-risk governance alerts
 *   });
 *
 *   oro.on('trace_complete', ({ traceId, proposalId, confidence }) => {
 *     // Handle completed trace records
 *   });
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { OROGovernanceOrganism }  from './organism.js';
import { NNSProposalFetcher }     from './adapters/nns-fetcher.js';
import { SNSProposalFetcher }     from './adapters/sns-fetcher.js';
import { StatusFetcher, AfterStateFetcher } from './adapters/status-fetcher.js';
import { TRACE, VERIFY, REMEMBER, THREE_WORDS } from './types.js';

// ── POWERED BY ORO branding ───────────────────────────────────────────────

export const ORO_ENGINE = Object.freeze({
  name:        'ORO',
  fullName:    'ORO Governance Organism',
  publicFace:  'EffectTrace',
  tagline:     'POWERED BY ORO',
  threeWords:  [TRACE, VERIFY, REMEMBER],
  papers: {
    TRACE:    'XX-STIGMERGY',
    VERIFY:   'XXI-QUORUM',
    REMEMBER: 'XXII-AURUM',
    ORGANISM: 'XXIII-ORO-GOVERNANCE-INTELLIGENCE',
  },
  mission:      'Convert governance noise into structured runtime truth.',
  publicHeadline: 'Trace what governance proposals actually change.',
  version:     '1.0.0',
  author:      'Alfredo Medina Hernandez · Medina Tech · Dallas TX',
});

export const POWERED_BY_ORO = `POWERED BY ORO — ${THREE_WORDS} — EffectTrace Governance Intelligence`;

/**
 * Combined proposal fetcher: NNS + optionally SNS.
 * Called by the organism every watch cycle.
 */
class CombinedProposalFetcher {
  constructor({ nnsFetcher, snsFetcher }) {
    this._nns = nnsFetcher;
    this._sns = snsFetcher;
  }

  async fetch() {
    const results = await Promise.allSettled([
      this._nns.fetch(),
      this._sns ? this._sns.fetch() : Promise.resolve([]),
    ]);

    const proposals = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        proposals.push(...result.value);
      }
    }
    return proposals;
  }

  asFetcher() {
    return () => this.fetch();
  }
}

/**
 * bootstrapOROProduction
 *
 * Creates and optionally starts a fully-wired ORO Governance Organism
 * connected to live NNS and SNS proposal APIs.
 *
 * @param {object} [options]
 *
 * @param {string[]} [options.watchedSNSDaos=[]]
 *   SNS root canister IDs to watch. Leave empty to watch NNS only.
 *   See KNOWN_SNS_DAOS in sns-fetcher.js for well-known DAOs.
 *   Example: ['rrkah-fqaaa-aaaaa-aaaaq-cai', 'tw2vt-hqaaa-aaaaq-aab6a-cai']
 *
 * @param {number} [options.nnsLimit=100]
 *   Max NNS proposals per fetch cycle (1–100).
 *
 * @param {number} [options.snsLimit=50]
 *   Max SNS proposals per DAO per fetch cycle (1–100).
 *
 * @param {number[]} [options.nnsIncludeStatus=[1]]
 *   NNS status codes to fetch: 1=open, 2=rejected, 4=adopted.
 *   Default fetches open proposals only.
 *
 * @param {number} [options.cyclePeriodMs=3_600_000]
 *   Watch cycle interval in milliseconds. Default: 1 hour.
 *   For development: use 30_000 (30 seconds) to see cycles quickly.
 *
 * @param {object|null} [options.meridian=null]
 *   Inject MERIDIAN engines for full pheromone/quorum/memory dynamics.
 *   If null, the organism operates without MERIDIAN integration
 *   (all core governance functions still work).
 *
 * @param {boolean} [options.autoStart=true]
 *   Start the organism immediately. The organism is always alive by default.
 *   Set to false only in test environments where you need to control timing.
 *
 * @param {Function} [options.fetchFn=fetch]
 *   Override the global fetch (for testing or custom HTTP clients).
 *
 * @returns {OROGovernanceOrganism}
 */
export function bootstrapOROProduction({
  watchedSNSDaos   = [],
  nnsLimit         = 100,
  snsLimit         = 50,
  nnsIncludeStatus = [1],   // open proposals
  cyclePeriodMs    = 60 * 60 * 1000,   // 1 hour
  meridian         = null,
  autoStart        = true,  // always alive — the organism does not wait to be asked
  fetchFn          = null,
} = {}) {

  // ── Print ORO banner ───────────────────────────────────────────────────
  _printBanner();

  // ── NNS fetcher ────────────────────────────────────────────────────────
  const nnsFetcher = new NNSProposalFetcher({
    limit: nnsLimit,
    includeStatus: nnsIncludeStatus,
    fetchFn,
  });

  // ── SNS fetcher (optional) ─────────────────────────────────────────────
  const snsFetcher = watchedSNSDaos.length > 0
    ? new SNSProposalFetcher({
        watchedDaos: watchedSNSDaos.map((id) => ({ rootCanisterId: id })),
        limit: snsLimit,
        fetchFn,
      })
    : null;

  // ── Combined fetcher ───────────────────────────────────────────────────
  const combined = new CombinedProposalFetcher({ nnsFetcher, snsFetcher });

  // ── Status fetcher ─────────────────────────────────────────────────────
  const statusFetcherInstance    = new StatusFetcher({ fetchFn });
  const afterStateFetcherInstance = new AfterStateFetcher({ fetchFn });

  // ── Create the organism ────────────────────────────────────────────────
  const organism = new OROGovernanceOrganism({
    meridian,
    cyclePeriodMs,
    proposalFetcher:   combined.asFetcher(),
    statusFetcher:     statusFetcherInstance.asFetcher(),
    afterStateFetcher: afterStateFetcherInstance.asFetcher(),
  });

  // ── Attach ORO engine metadata ─────────────────────────────────────────
  organism.ORO_ENGINE = ORO_ENGINE;
  organism.POWERED_BY = POWERED_BY_ORO;

  // ── Expose adapters for operator use ───────────────────────────────────
  organism.adapters = {
    nns:         nnsFetcher,
    sns:         snsFetcher,
    status:      statusFetcherInstance,
    afterState:  afterStateFetcherInstance,
  };

  // ── Auto-start if requested ────────────────────────────────────────────
  if (autoStart) {
    organism.start();
  }

  return organism;
}

// ── Banner ─────────────────────────────────────────────────────────────────

function _printBanner() {
  /* eslint-disable no-console */
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                  POWERED BY ORO                          ║');
  console.log('║              TRACE · VERIFY · REMEMBER                   ║');
  console.log('║                                                           ║');
  console.log('║  EffectTrace — Governance Consequence Intelligence        ║');
  console.log('║  Internal: ORO Governance Organism                        ║');
  console.log('║                                                           ║');
  console.log('║  TRACE    — STIGMERGY  (Paper XX)                         ║');
  console.log('║  VERIFY   — QUORUM     (Paper XXI)                        ║');
  console.log('║  REMEMBER — AURUM      (Paper XXII)                       ║');
  console.log('║                                                           ║');
  console.log('║  The organism is always alive.                            ║');
  console.log('║  It generates its own activity.                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  /* eslint-enable no-console */
}

// ── Re-exports for convenience ──────────────────────────────────────────────

export { NNSProposalFetcher, createNNSFetcher }    from './adapters/nns-fetcher.js';
export { SNSProposalFetcher, createSNSFetcher, KNOWN_SNS_DAOS } from './adapters/sns-fetcher.js';
export { StatusFetcher, AfterStateFetcher, createStatusFetchers } from './adapters/status-fetcher.js';
export { OROGovernanceOrganism }                   from './organism.js';
export { TRACE, VERIFY, REMEMBER, THREE_WORDS }    from './types.js';
