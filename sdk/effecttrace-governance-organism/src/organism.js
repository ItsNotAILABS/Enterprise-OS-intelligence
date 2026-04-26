/**
 * ORO Governance Organism — 24-Hour Autonomous Watch Loop
 *
 * Internal name: ORO Governance Organism
 * Public name:   EffectTrace
 *
 * Three-word encoding: TRACE · VERIFY · REMEMBER
 *
 * This is not a query. It is execution.
 *
 * The organism does not wait to be asked. It:
 *   - Watches NNS/SNS proposals continuously
 *   - Traces their effect paths (TRACE — STIGMERGY field)
 *   - Verifies truth status at each stage (VERIFY — QUORUM crystallization)
 *   - Builds governance memory over time (REMEMBER — AURUM φ-compounding)
 *
 * Wired into the MERIDIAN engines:
 *   NEXORIS (pheromone field) → routes proposals to risk classification
 *   COGNOVEX (quorum dynamics) → agent council reaches consensus
 *   CEREBEX (φ⁻¹ learning) → world model learns governance patterns
 *   CHRONO (hash chain) → every decision permanently anchored
 *   CORDEX (Lotka-Volterra) → monitors organism expansion vs resistance
 *   CYCLOVEX (φᵗ capacity) → manages 24-hour processing capacity
 *
 * "24 hours" = the watch cycle runs continuously.
 * The organism is always alive. It generates its own activity.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { ProposalIngestEngine }       from './engines/e1-proposal-ingest.js';
import { PayloadParserEngine }        from './engines/e2-payload-parser.js';
import { TargetResolverEngine }       from './engines/e3-target-resolver.js';
import { EffectPathEngine }           from './engines/e4-effect-path.js';
import { RuntimeTruthEngine }         from './engines/e5-runtime-truth.js';
import { RiskClassifierEngine }       from './engines/e6-risk-classifier.js';
import { VerificationPlanEngine }     from './engines/e7-verification-plan.js';
import { ReviewerIntegrationEngine }  from './engines/e8-reviewer-integration.js';
import { GovernanceMemoryEngine }     from './engines/e9-governance-memory.js';
import { PostExecutionWatchEngine }   from './engines/e10-post-execution-watch.js';
import { AgentCouncilEngine }         from './engines/e11-agent-council.js';
import { PublicSummaryEngine }        from './engines/e12-public-summary.js';
import { EvidenceRegistryEngine }     from './engines/e13-evidence-registry.js';
import { DisputeCorrectionEngine }    from './engines/e14-dispute-correction.js';
import { RenderabilityExportEngine }  from './engines/e15-render-export.js';

import { IntegrityAgent }       from './agents/integrity.js';
import { ExecutionTraceAgent }  from './agents/execution-trace.js';
import { ContextMapAgent }      from './agents/context-map.js';
import { VerificationLabAgent } from './agents/verification-lab.js';

import {
  createEffectTraceRecord,
  TRACE_STATUS,
  TRUTH_STATUS,
  TRACE, VERIFY, REMEMBER,
} from './types.js';

// 24-hour default cycle: check every hour (3,600,000 ms)
// For development, set cyclePeriodMs to a shorter interval
const DEFAULT_CYCLE_PERIOD_MS = 60 * 60 * 1000;   // 1 hour
const DEFAULT_MEMORY_TICK_INTERVAL = 6;            // tick memory every 6 cycles

// ---------------------------------------------------------------------------
// ORO Governance Organism
// ---------------------------------------------------------------------------

export class OROGovernanceOrganism {
  /**
   * @param {object} [options]
   * @param {object} [options.meridian]   - Injected MERIDIAN engines { chrono, nexoris, cerebex, cordex, cyclovex, cognovex }
   * @param {number} [options.cyclePeriodMs] - Watch cycle interval in ms (default: 1 hour)
   * @param {Function} [options.proposalFetcher] - async () => [rawProposal, ...]
   * @param {Function} [options.statusFetcher]   - async (proposalId) => { status, executedAt, failureReason }
   * @param {Function} [options.afterStateFetcher] - async (proposalId, entry) => { verified, evidence, notes }
   */
  constructor({
    meridian = null,
    cyclePeriodMs = DEFAULT_CYCLE_PERIOD_MS,
    proposalFetcher = null,
    statusFetcher = null,
    afterStateFetcher = null,
  } = {}) {
    // Three-word identity
    this.TRACE    = TRACE;
    this.VERIFY   = VERIFY;
    this.REMEMBER = REMEMBER;

    // MERIDIAN engines (optional — organism works without them)
    this._meridian = meridian;

    // Lifecycle
    this._cyclePeriodMs = cyclePeriodMs;
    this._cycleCount    = 0;
    this._alive         = false;
    this._cycleTimer    = null;
    this._startedAt     = null;
    this._listeners     = [];

    // External data adapters
    this._proposalFetcher   = proposalFetcher;
    this._statusFetcher     = statusFetcher;
    this._afterStateFetcher = afterStateFetcher;

    // Internal trace store
    this._traces = new Map();   // traceId → EffectTraceRecord
    this._tracesByProposal = new Map();  // proposalId → traceId

    // ── All 15 engines ────────────────────────────────────────────────────
    const chrono = meridian?.chrono ?? null;

    this.e1  = new ProposalIngestEngine();
    this.e2  = new PayloadParserEngine();
    this.e3  = new TargetResolverEngine();
    this.e4  = new EffectPathEngine();
    this.e5  = new RuntimeTruthEngine();
    this.e6  = new RiskClassifierEngine();
    this.e7  = new VerificationPlanEngine();
    this.e8  = new ReviewerIntegrationEngine();
    this.e9  = new GovernanceMemoryEngine();
    this.e10 = new PostExecutionWatchEngine();
    this.e11 = new AgentCouncilEngine({
      cognovex: meridian?.cognovex ?? null,
      nexoris:  meridian?.nexoris  ?? null,
    });
    this.e12 = new PublicSummaryEngine();
    this.e13 = new EvidenceRegistryEngine();
    this.e14 = new DisputeCorrectionEngine();
    this.e15 = new RenderabilityExportEngine();

    if (chrono) {
      [this.e1, this.e9, this.e10, this.e11, this.e14].forEach((e) => e.setChrono?.(chrono));
    }

    // ── Four agents ───────────────────────────────────────────────────────
    this.agents = {
      integrity:      new IntegrityAgent(),
      executionTrace: new ExecutionTraceAgent(),
      contextMap:     new ContextMapAgent(),
      verificationLab: new VerificationLabAgent(),
    };

    // Post-execution watch callbacks
    this.e10.onStatusChange((result) => {
      this._emit('execution', result);
      // Advance truth status in the trace
      const traceId = this._tracesByProposal.get(result.proposalId);
      if (traceId) {
        const trace = this._traces.get(traceId);
        if (trace) {
          const newTruth = this.e5.advance(
            trace.runtimeTruth,
            result.truthAdvancement ?? 'execution_confirmed',
          );
          const updated = { ...trace, runtimeTruth: newTruth, updatedAt: new Date().toISOString() };
          this._traces.set(traceId, updated);
        }
      }
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Start the 24-hour autonomous watch loop.
   * The organism is alive. It does not wait to be asked.
   */
  start() {
    if (this._alive) return this;
    this._alive = true;
    this._startedAt = new Date().toISOString();

    if (this._meridian?.chrono) {
      this._meridian.chrono.append({
        type: 'ORO_START',
        threeWords: [TRACE, VERIFY, REMEMBER],
        cyclePeriodMs: this._cyclePeriodMs,
        startedAt: this._startedAt,
      });
    }

    // Run first cycle immediately, then on interval
    this._runCycle().catch(() => {});
    this._cycleTimer = setInterval(() => this._runCycle().catch(() => {}), this._cyclePeriodMs);

    return this;
  }

  /** Stop the organism. */
  stop() {
    if (this._cycleTimer) {
      clearInterval(this._cycleTimer);
      this._cycleTimer = null;
    }
    this._alive = false;
    return this;
  }

  // ── Autonomous cycle ──────────────────────────────────────────────────────

  async _runCycle() {
    this._cycleCount++;
    const cycleStart = Date.now();

    this._emit('cycle_start', { cycleNumber: this._cycleCount, timestamp: new Date().toISOString() });

    // 1. CORDEX heartbeat (organism expansion vs resistance)
    if (this._meridian?.cordex) {
      const cordexBeat = this._meridian.cordex.tick();
      // 2. CYCLOVEX capacity advance
      if (this._meridian?.cyclovex) {
        this._meridian.cyclovex.tick(this._meridian.cordex.chronicFear());
      }
    }

    // 3. NEXORIS synchronization tick
    if (this._meridian?.nexoris) {
      this._meridian.nexoris.tick();
    }

    // 4. Fetch new proposals (if adapter connected)
    let newProposals = [];
    if (this._proposalFetcher) {
      try {
        const raw = await this._proposalFetcher();
        newProposals = this.e1.ingestBatch(Array.isArray(raw) ? raw : []);
      } catch (err) {
        this._emit('error', { phase: 'proposal_fetch', error: err.message });
      }
    }

    // 5. Run full pipeline for each new proposal
    for (const proposal of newProposals) {
      try {
        const trace = await this._processProposal(proposal);
        this._emit('trace_created', { proposalId: proposal.proposalId, traceId: trace.traceId });
      } catch (err) {
        this._emit('error', { phase: 'process_proposal', proposalId: proposal.proposalId, error: err.message });
      }
    }

    // 6. Post-execution watch queue
    if (this._statusFetcher) {
      try {
        const watchResults = await this.e10.processQueue(
          this._statusFetcher,
          this._afterStateFetcher,
        );
        if (watchResults.length > 0) {
          this._emit('watch_results', watchResults);
        }
      } catch (err) {
        this._emit('error', { phase: 'post_execution_watch', error: err.message });
      }
    }

    // 7. CEREBEX world model update (φ⁻¹ learning — AURUM)
    if (this._meridian?.cerebex) {
      const openProposals = this.e1.list({ status: 'open' });
      for (const p of openProposals.slice(0, 5)) {
        this._meridian.cerebex.score(`ICP governance proposal: ${p.topic ?? p.actionType ?? 'unknown'}`);
      }
    }

    // 8. Governance memory tick (STIGMERGY field evaporation + diffusion)
    if (this._cycleCount % DEFAULT_MEMORY_TICK_INTERVAL === 0) {
      this.e9.tick();
    }

    // 9. COGNOVEX quorum tick (QUORUM crystallization)
    if (this._meridian?.cognovex) {
      this._meridian.cognovex.tick();
    }

    const cycleDuration = Date.now() - cycleStart;
    this._emit('cycle_end', {
      cycleNumber: this._cycleCount,
      duration: cycleDuration,
      newProposals: newProposals.length,
      watchQueueSize: this.e10.queueSize(),
      traceCount: this._traces.size,
    });
  }

  // ── Proposal processing pipeline ─────────────────────────────────────────

  /**
   * Run the full 15-engine pipeline for a single proposal.
   * This is the TRACE → VERIFY → REMEMBER pipeline.
   *
   * @param {import('./types.js').ProposalRecord} proposal
   * @returns {import('./types.js').EffectTraceRecord}
   */
  async _processProposal(proposal) {
    // E2: Parse payload
    const parsed = this.e2.parse(proposal);

    // E3: Resolve target
    const target = this.e3.resolve(parsed, proposal);

    // E4: Build effect path (TRACE)
    const effectPath = this.e4.build(proposal, parsed, target);

    // E6: Classify risk (AURUM φ-weighting)
    const memoryData = this.e9.findRelated(proposal.proposalId);
    const riskProfile = this.e6.classify({
      proposal, parsed, target, effectPath,
      memoryPrecedents: memoryData.proposals.length,
    });

    // E7: Generate verification plan (VERIFY)
    const verificationPlan = this.e7.generate(riskProfile, target, proposal);

    // E5: Assess runtime truth (VERIFY)
    const runtimeTruth = this.e5.assess({ proposal, parsed, target, effectPath, findings: [] });

    // Create initial trace record
    let trace = createEffectTraceRecord({
      proposalId: proposal.proposalId,
      publicTitle: proposal.title,
      plainSummary: proposal.summary?.slice(0, 500) ?? '',
      effectPath,
      runtimeTruth,
      riskProfile,
      verificationPlan,
      memoryLinks: memoryData.proposals.slice(0, 5).map((p) => ({
        linkId: `auto-${proposal.proposalId}-${p.proposalId}`,
        sourceProposalId: proposal.proposalId,
        targetProposalId: p.proposalId,
        linkType: p.linkType ?? 'related',
        description: 'Auto-linked by governance memory engine',
        createdAt: new Date().toISOString(),
      })),
      agentFindings: [],
      status: TRACE_STATUS.DRAFT,
      confidence: riskProfile.riskClass !== 'unknown' && target.resolved ? 'medium' : 'low',
    });

    // E11: Run agent council (TRACE + VERIFY + REMEMBER)
    const { findings, councilStatus } = this.e11.run(trace, proposal, target, parsed);

    // Also run individual agents for granular findings
    const agentFindings = [
      ...this.agents.integrity.run(trace, proposal, parsed, target),
      ...this.agents.executionTrace.run(trace, proposal, target),
      ...this.agents.contextMap.run(trace, proposal, memoryData),
      ...this.agents.verificationLab.run(trace, proposal, target),
      ...findings,
    ];

    trace.agentFindings = agentFindings;
    trace.status = councilStatus.includes('CRITICAL') ? TRACE_STATUS.NEEDS_REVIEW : TRACE_STATUS.DRAFT;

    // E9: Register in governance memory (REMEMBER — STIGMERGY deposit)
    this.e9.register(proposal, riskProfile);

    // E10: Add to post-execution watch queue if adopted or open
    this.e10.watch(proposal, trace);

    // NEXORIS pheromone: reinforce routing for this risk class
    if (this._meridian?.nexoris) {
      this._meridian.nexoris.reinforce(
        `ORO:${riskProfile.riskClass}`,
        riskProfile.riskLevel === 'critical' ? 1.0 : 0.5,
      );
    }

    // Store
    this._traces.set(trace.traceId, trace);
    this._tracesByProposal.set(proposal.proposalId, trace.traceId);

    return trace;
  }

  // ── Manual operations ─────────────────────────────────────────────────────

  /**
   * Manually ingest a proposal and immediately run the full pipeline.
   * Does not wait for the next autonomous cycle.
   *
   * @param {object} rawProposal - raw proposal data
   * @returns {Promise<{ proposal, trace, summary }>}
   */
  async processNow(rawProposal) {
    const proposal = this.e1.ingest(rawProposal);
    const trace = await this._processProposal(proposal);
    const summary = this.e12.generate(trace, proposal);
    return { proposal, trace, summary };
  }

  /**
   * Get the current operator dashboard state.
   * Section 1: Live Governance Pulse
   */
  dashboard() {
    const openTraces = [...this._traces.values()].filter(
      (t) => t.status !== TRACE_STATUS.ARCHIVED,
    );

    const criticalTraces = openTraces.filter(
      (t) => t.riskProfile?.riskLevel === 'critical',
    );
    const pendingVerification = openTraces.filter(
      (t) => t.runtimeTruth?.truthStatus === TRUTH_STATUS.EXECUTED_NOT_VERIFIED,
    );
    const disputed = openTraces.filter(
      (t) => t.runtimeTruth?.truthStatus === TRUTH_STATUS.DISPUTED,
    );
    const watchQueueSize = this.e10.queueSize();

    return {
      threeWords: [TRACE, VERIFY, REMEMBER],
      alive: this._alive,
      cycleCount: this._cycleCount,
      startedAt: this._startedAt,
      proposals: this.e1.count(),
      traces: this._traces.size,
      watchQueue: watchQueueSize,
      critical: criticalTraces.length,
      pendingVerification: pendingVerification.length,
      disputed: disputed.length,
      memoryField: this.e9.fieldSnapshot(),
      meridianSync: this._meridian?.nexoris
        ? { orderParameter: this._meridian.nexoris.orderParameter, synchronized: this._meridian.nexoris.synchronized }
        : null,
    };
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  getTrace(traceId)         { return this._traces.get(traceId) ?? null; }
  getTraceByProposal(pid)   { return this._traces.get(this._tracesByProposal.get(String(pid))) ?? null; }
  listTraces(filter = {})   {
    let all = [...this._traces.values()];
    if (filter.status)    all = all.filter((t) => t.status === filter.status);
    if (filter.riskLevel) all = all.filter((t) => t.riskProfile?.riskLevel === filter.riskLevel);
    if (filter.riskClass) all = all.filter((t) => t.riskProfile?.riskClass === filter.riskClass);
    return all.slice(filter.offset ?? 0, (filter.offset ?? 0) + (filter.limit ?? 100));
  }

  // ── Events ────────────────────────────────────────────────────────────────

  on(event, callback) {
    this._listeners.push({ event, callback });
    return () => {
      const idx = this._listeners.findIndex((l) => l.callback === callback);
      if (idx >= 0) this._listeners.splice(idx, 1);
    };
  }

  _emit(event, data) {
    for (const l of this._listeners) {
      if (l.event === event || l.event === '*') {
        try { l.callback(data); } catch (_) {}
      }
    }
  }

  // ── Observability ─────────────────────────────────────────────────────────

  get alive()       { return this._alive; }
  get cycleCount()  { return this._cycleCount; }
  get traceCount()  { return this._traces.size; }
}

export default OROGovernanceOrganism;
