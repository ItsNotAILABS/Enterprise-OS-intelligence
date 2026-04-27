/**
 * @medina/effecttrace-governance-organism — RELEASE EDITION
 * ─────────────────────────────────────────────────────────────
 * Stable public API. Versioned. Typed. Production-ready.
 *
 * For external builders, integrators, and organizations deploying
 * EffectTrace in production. Guardrails on. Min cycle 1 minute.
 *
 * Gubernatio Viva — VIVIT · MEMINIT · GUBERNAT
 * TRACE · VERIFY · REMEMBER
 * Alfredo Medina Hernandez · Medina Tech · Dallas TX
 *
 * @module @medina/effecttrace-governance-organism/release
 * @version 1.1.0 — Release Edition
 */

// ── Core organism ──────────────────────────────────────────────────────────────
export { OROGovernanceOrganism }  from './organism.js';

// ── Production bootstrap ───────────────────────────────────────────────────────
export { bootstrapOROProduction as bootstrapORORelease,
         ORO_ENGINE,
         POWERED_BY_ORO }         from './production.js';

// ── Adapters (stable, validated interfaces) ────────────────────────────────────
export { NNSProposalFetcher, createNNSFetcher }                from './adapters/nns-fetcher.js';
export { SNSProposalFetcher, createSNSFetcher }                from './adapters/sns-fetcher.js';
export { StatusFetcher, AfterStateFetcher, createStatusFetcher,
         createAfterStateFetcher }                             from './adapters/status-fetcher.js';

// ── All 15 engines ────────────────────────────────────────────────────────────
// TRACE GROUP
export { ProposalIngestEngine }       from './engines/e1-proposal-ingest.js';
export { PayloadParserEngine }        from './engines/e2-payload-parser.js';
export { TargetResolverEngine }       from './engines/e3-target-resolver.js';
export { EffectPathEngine }           from './engines/e4-effect-path.js';
export { EvidenceRegistryEngine }     from './engines/e13-evidence-registry.js';
// VERIFY GROUP
export { RuntimeTruthEngine }         from './engines/e5-runtime-truth.js';
export { RiskClassifierEngine }       from './engines/e6-risk-classifier.js';
export { VerificationPlanEngine }     from './engines/e7-verification-plan.js';
export { ReviewerIntegrationEngine }  from './engines/e8-reviewer-integration.js';
export { DisputeCorrectionEngine }    from './engines/e14-dispute-correction.js';
// REMEMBER GROUP
export { GovernanceMemoryEngine }     from './engines/e9-governance-memory.js';
export { PostExecutionWatchEngine }   from './engines/e10-post-execution-watch.js';
export { AgentCouncilEngine }         from './engines/e11-agent-council.js';
export { PublicSummaryEngine }        from './engines/e12-public-summary.js';
export { RenderabilityExportEngine }  from './engines/e15-render-export.js';

// ── Agent Council ──────────────────────────────────────────────────────────────
export { IntegrityAgent }       from './agents/integrity.js';
export { ExecutionTraceAgent }  from './agents/execution-trace.js';
export { ContextMapAgent }      from './agents/context-map.js';
export { VerificationLabAgent } from './agents/verification-lab.js';

// ── Type system and constants ──────────────────────────────────────────────────
export {
  createEffectTraceRecord, createProposalRecord, createSourceLink,
  createFinding, createRiskScore,
  TRACE_STATUS, TRUTH_STATUS, RISK_LEVEL, RISK_CLASS,
  TRACE, VERIFY, REMEMBER, THREE_WORDS, PHI,
} from './types.js';

// ── Ecosystem catalog ──────────────────────────────────────────────────────────
export { ECOSYSTEM_CATALOG, SYSTEM_IDENTITY,
         BEHAVIORAL_LAWS, CONSERVATION_LAWS, MATHEMATICAL_LAWS,
         ENGINES, AGENTS, PROTOCOLS } from './ecosystem-catalog.js';
