/**
 * @medina/effecttrace-governance-organism — SPEEDSTER EDITION
 * ─────────────────────────────────────────────────────────────
 * Raw dev access. Zero guardrails. Full internals exposed.
 * Built for builders who move fast and know what they're doing.
 *
 * Extra vs Release:
 *   E1–E15 aliases · ARCHON/VECTOR/LUMEN/FORGE aliases
 *   createSpeedsterOrganism() · withDebug() · buildEngineChain()
 *   DEBUG_EVENTS · SPEEDSTER_DEFAULTS · 1-second min cycle
 *
 * DO NOT USE IN PRODUCTION.
 * Gubernatio Viva — VIVIT · MEMINIT · GUBERNAT
 * Alfredo Medina Hernandez · Medina Tech · Dallas TX
 *
 * @module @medina/effecttrace-governance-organism/speedster
 * @version 1.1.0 — Speedster Edition
 */

// ── Re-export everything from release ─────────────────────────────────────────
export * from './release.js';

// ── E-number aliases (direct engine access) ───────────────────────────────────
export { ProposalIngestEngine       as E1  } from './engines/e1-proposal-ingest.js';
export { PayloadParserEngine        as E2  } from './engines/e2-payload-parser.js';
export { TargetResolverEngine       as E3  } from './engines/e3-target-resolver.js';
export { EffectPathEngine           as E4  } from './engines/e4-effect-path.js';
export { RuntimeTruthEngine         as E5  } from './engines/e5-runtime-truth.js';
export { RiskClassifierEngine       as E6  } from './engines/e6-risk-classifier.js';
export { VerificationPlanEngine     as E7  } from './engines/e7-verification-plan.js';
export { ReviewerIntegrationEngine  as E8  } from './engines/e8-reviewer-integration.js';
export { GovernanceMemoryEngine     as E9  } from './engines/e9-governance-memory.js';
export { PostExecutionWatchEngine   as E10 } from './engines/e10-post-execution-watch.js';
export { AgentCouncilEngine         as E11 } from './engines/e11-agent-council.js';
export { PublicSummaryEngine        as E12 } from './engines/e12-public-summary.js';
export { EvidenceRegistryEngine     as E13 } from './engines/e13-evidence-registry.js';
export { DisputeCorrectionEngine    as E14 } from './engines/e14-dispute-correction.js';
export { RenderabilityExportEngine  as E15 } from './engines/e15-render-export.js';

// ── Agent codename aliases ────────────────────────────────────────────────────
export { IntegrityAgent       as ARCHON } from './agents/integrity.js';
export { ExecutionTraceAgent  as VECTOR } from './agents/execution-trace.js';
export { ContextMapAgent      as LUMEN  } from './agents/context-map.js';
export { VerificationLabAgent as FORGE  } from './agents/verification-lab.js';

// ── Full ecosystem catalog ────────────────────────────────────────────────────
export { ECOSYSTEM_CATALOG as ECOSYSTEM,
         ENGINES_BY_ID, ENGINES_BY_GROUP, AGENTS_BY_CODENAME,
         DOCUMENT_PIPELINE, SUPPORTING_SDKS, PAPERS, CANISTERS,
         SDK_EDITIONS, CHARTERS, SOVEREIGN_DISTRIBUTION } from './ecosystem-catalog.js';

// ── Speedster defaults ────────────────────────────────────────────────────────
export const SPEEDSTER_DEFAULTS = Object.freeze({
  cyclePeriodMs:  5_000,    // 5-second cycles (vs 1-hour in release)
  minCycleMs:     1_000,    // hard floor — 1 second
  autoStart:      true,
  debugEvents:    true,
  verboseLogging: true,
});

export const DEBUG_EVENTS = Object.freeze([
  'cycle_start',
  'cycle_complete',
  'proposal_fetched',
  'trace_start',
  'trace_complete',
  'engine_result',       // fires after every engine with { engineId, result }
  'agent_invoked',
  'agent_finding',
  'risk_classified',
  'truth_advanced',
  'memory_deposited',
  'ecosystem_loaded',    // fires on start — full ECOSYSTEM_CATALOG emitted
  'alert',
  'execution',
  'error',
  'stop',
]);

// ── Debug wrapper ─────────────────────────────────────────────────────────────
/**
 * Wrap any organism with verbose console logging on every event.
 * @param {import('./organism.js').OROGovernanceOrganism} organism
 * @param {{ prefix?: string }} [opts]
 */
export function withDebug(organism, opts = {}) {
  const prefix = opts.prefix ?? '[ORO SPEEDSTER]';
  for (const event of DEBUG_EVENTS) {
    organism.on(event, (payload) => {
      console.log(`${prefix} [${new Date().toISOString()}] ${event.toUpperCase()}`, payload ?? '');
    });
  }
  return organism;
}

// ── Manual engine chain builder ───────────────────────────────────────────────
/**
 * Wire all 15 engines manually without the organism wrapper.
 * Use when you want to drive the pipeline proposal-by-proposal.
 * @returns {Promise<{e1, e2, ..., e15}>}
 */
export function buildEngineChain() {
  return Promise.all([
    import('./engines/e1-proposal-ingest.js'),
    import('./engines/e2-payload-parser.js'),
    import('./engines/e3-target-resolver.js'),
    import('./engines/e4-effect-path.js'),
    import('./engines/e5-runtime-truth.js'),
    import('./engines/e6-risk-classifier.js'),
    import('./engines/e7-verification-plan.js'),
    import('./engines/e8-reviewer-integration.js'),
    import('./engines/e9-governance-memory.js'),
    import('./engines/e10-post-execution-watch.js'),
    import('./engines/e11-agent-council.js'),
    import('./engines/e12-public-summary.js'),
    import('./engines/e13-evidence-registry.js'),
    import('./engines/e14-dispute-correction.js'),
    import('./engines/e15-render-export.js'),
  ]).then(([m1,m2,m3,m4,m5,m6,m7,m8,m9,m10,m11,m12,m13,m14,m15]) => ({
    e1:  new m1.ProposalIngestEngine(),
    e2:  new m2.PayloadParserEngine(),
    e3:  new m3.TargetResolverEngine(),
    e4:  new m4.EffectPathEngine(),
    e5:  new m5.RuntimeTruthEngine(),
    e6:  new m6.RiskClassifierEngine(),
    e7:  new m7.VerificationPlanEngine(),
    e8:  new m8.ReviewerIntegrationEngine(),
    e9:  new m9.GovernanceMemoryEngine(),
    e10: new m10.PostExecutionWatchEngine(),
    e11: new m11.AgentCouncilEngine(),
    e12: new m12.PublicSummaryEngine(),
    e13: new m13.EvidenceRegistryEngine(),
    e14: new m14.DisputeCorrectionEngine(),
    e15: new m15.RenderabilityExportEngine(),
  }));
}

// ── Speedster organism factory ────────────────────────────────────────────────
/**
 * Create a fast-cycle organism with debug mode enabled.
 * @param {{ watchedSNSDaos?: string[], cyclePeriodMs?: number, autoStart?: boolean, verbose?: boolean }} config
 * @returns {Promise<import('./organism.js').OROGovernanceOrganism>}
 */
export async function createSpeedsterOrganism(config = {}) {
  const { bootstrapOROProduction } = await import('./production.js');
  const cyclePeriodMs = Math.max(
    config.cyclePeriodMs ?? SPEEDSTER_DEFAULTS.cyclePeriodMs,
    SPEEDSTER_DEFAULTS.minCycleMs,
  );
  const organism = bootstrapOROProduction({
    watchedSNSDaos: config.watchedSNSDaos ?? [],
    cyclePeriodMs,
    meridian:  config.meridian  ?? null,
    autoStart: config.autoStart ?? SPEEDSTER_DEFAULTS.autoStart,
  });
  if (config.verbose !== false) {
    withDebug(organism, { prefix: '[ORO⚡SPEEDSTER]' });
  }
  return organism;
}
