/**
 * @medina/effecttrace-governance-organism
 *
 * ╔═══════════════════════════════════════════════════════════╗
 * ║                  POWERED BY ORO                          ║
 * ║              TRACE · VERIFY · REMEMBER                   ║
 * ╚═══════════════════════════════════════════════════════════╝
 *
 * EffectTrace — Governance Consequence Intelligence for ICP
 * Internal name: ORO Governance Organism
 *
 * ORO IS THE ENGINE. EFFECTTRACE IS THE FACE.
 *
 *   TRACE    — STIGMERGY (Paper XX)
 *              The pheromone trail of governance effects.
 *              Every proposal deposits in the field. The field knows what changed.
 *              NEXORIS routes consequences the way trails route foragers.
 *
 *   VERIFY   — QUORUM (Paper XXI)
 *              Truth is not claimed. It crystallizes.
 *              Agent Council runs COGNOVEX dynamics.
 *              When enough agents converge, the quorum crystallizes — no authority needed.
 *
 *   REMEMBER — AURUM (Paper XXII)
 *              Governance memory compounds at rate φ.
 *              CEREBEX learns the governance pattern at φ⁻¹ per cycle.
 *              CYCLOVEX grows capacity at φᵗ per 24-hour beat.
 *              The past is not stored. It is alive.
 *
 * Not a query. Not a tool. Execution. 24 hours.
 *
 * Research: Papers XX (STIGMERGY), XXI (QUORUM), XXII (AURUM), XXIII (ORO GOVERNANCE INTELLIGENCE)
 * Sovereign Intelligence Research Series — Prior art established 2026
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

// ── POWERED BY ORO engine constants ──────────────────────────────────────
export { ORO_ENGINE, POWERED_BY_ORO, bootstrapOROProduction } from './production.js';
export { NNSProposalFetcher, createNNSFetcher }               from './adapters/nns-fetcher.js';
export { SNSProposalFetcher, createSNSFetcher, KNOWN_SNS_DAOS } from './adapters/sns-fetcher.js';
export { StatusFetcher, AfterStateFetcher, createStatusFetchers } from './adapters/status-fetcher.js';

// ── Three-word encoding ───────────────────────────────────────────────────
export { TRACE, VERIFY, REMEMBER, THREE_WORDS } from './types.js';

// ── All type schemas ──────────────────────────────────────────────────────
export {
  DAO_TYPE,
  PROPOSAL_STATUS,
  TRUTH_STATUS,
  AFFECTED_SYSTEM,
  RISK_CLASS,
  RISK_LEVEL,
  AGENT_ROLE,
  SEVERITY,
  TRACE_STATUS,
  createSourceLink,
  createProposalRecord,
  createEffectPath,
  createRuntimeTruthBlock,
  createRiskProfile,
  createAgentFinding,
  createGovernanceMemoryLink,
  createVerificationPlan,
  createEffectTraceRecord,
} from './types.js';

// ── The Organism ──────────────────────────────────────────────────────────
export { OROGovernanceOrganism } from './organism.js';

// ── All 15 engines ────────────────────────────────────────────────────────
export { ProposalIngestEngine }       from './engines/e1-proposal-ingest.js';
export { PayloadParserEngine }        from './engines/e2-payload-parser.js';
export { TargetResolverEngine }       from './engines/e3-target-resolver.js';
export { EffectPathEngine }           from './engines/e4-effect-path.js';
export { RuntimeTruthEngine }         from './engines/e5-runtime-truth.js';
export { RiskClassifierEngine }       from './engines/e6-risk-classifier.js';
export { VerificationPlanEngine }     from './engines/e7-verification-plan.js';
export { ReviewerIntegrationEngine }  from './engines/e8-reviewer-integration.js';
export { GovernanceMemoryEngine }     from './engines/e9-governance-memory.js';
export { PostExecutionWatchEngine }   from './engines/e10-post-execution-watch.js';
export { AgentCouncilEngine }         from './engines/e11-agent-council.js';
export { PublicSummaryEngine }        from './engines/e12-public-summary.js';
export { EvidenceRegistryEngine }     from './engines/e13-evidence-registry.js';
export { DisputeCorrectionEngine }    from './engines/e14-dispute-correction.js';
export { RenderabilityExportEngine }  from './engines/e15-render-export.js';

// ── Four agents ───────────────────────────────────────────────────────────
export { IntegrityAgent }        from './agents/integrity.js';
export { ExecutionTraceAgent }   from './agents/execution-trace.js';
export { ContextMapAgent }       from './agents/context-map.js';
export { VerificationLabAgent }  from './agents/verification-lab.js';

// ---------------------------------------------------------------------------
// bootstrapORO — one call to bring the governance organism online
// ---------------------------------------------------------------------------

import { OROGovernanceOrganism } from './organism.js';

/**
 * Bootstrap the ORO Governance Organism and return it ready to start.
 *
 * @param {object} [options]
 * @param {object} [options.meridian]        - Injected MERIDIAN engines (from bootstrapMeridian())
 * @param {number} [options.cyclePeriodMs]   - Watch cycle interval (default: 1 hour)
 * @param {Function} [options.proposalFetcher]   - async () => [rawProposal, ...]
 * @param {Function} [options.statusFetcher]     - async (proposalId) => { status, executedAt }
 * @param {Function} [options.afterStateFetcher] - async (proposalId, entry) => { verified, evidence }
 * @param {boolean} [options.autoStart]      - Start the 24-hour watch loop immediately (default: true — always alive)
 * @returns {OROGovernanceOrganism}
 */
export function bootstrapORO({
  meridian         = null,
  cyclePeriodMs    = 60 * 60 * 1000,
  proposalFetcher  = null,
  statusFetcher    = null,
  afterStateFetcher = null,
  autoStart        = true,  // always alive — the organism does not wait to be asked
} = {}) {
  const organism = new OROGovernanceOrganism({
    meridian,
    cyclePeriodMs,
    proposalFetcher,
    statusFetcher,
    afterStateFetcher,
  });

  if (autoStart) {
    organism.start();
  }

  return organism;
}
