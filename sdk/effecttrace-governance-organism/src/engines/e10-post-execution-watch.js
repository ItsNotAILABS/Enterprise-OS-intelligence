/**
 * E10 — Post-Execution Watch Engine
 *
 * VERIFY layer: monitors proposals after adoption for execution and after-state.
 *
 * An adopted proposal on ICP is not done — it still needs to:
 *   1. Execute on-chain (automatically for NNS/SNS if no error)
 *   2. Be observed as executed (execution_state = Executed vs ExecutionFailed)
 *   3. Have its after-state checked against the expected effect path
 *
 * This engine maintains a watch queue, processes proposals on each cycle,
 * and updates the RuntimeTruthBlock when evidence arrives.
 *
 * "24 hours" — this engine is the one that makes EffectTrace a living organism.
 * It runs continuously, not on request.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { PROPOSAL_STATUS, TRUTH_STATUS } from '../types.js';

export class PostExecutionWatchEngine {
  constructor() {
    this._watchQueue  = new Map();   // proposalId → watchEntry
    this._completed   = new Map();   // proposalId → completedEntry
    this._watchCount  = 0;
    this._cycleCount  = 0;
    this._callbacks   = [];          // onStatusChange callbacks
    this._chrono      = null;
  }

  setChrono(chrono) { this._chrono = chrono; return this; }

  // ── Watch queue management ────────────────────────────────────────────────

  /**
   * Add a proposal to the post-execution watch queue.
   *
   * @param {import('../types.js').ProposalRecord} proposal
   * @param {import('../types.js').EffectTraceRecord} trace
   */
  watch(proposal, trace) {
    if (
      proposal.status === PROPOSAL_STATUS.REJECTED ||
      proposal.status === PROPOSAL_STATUS.EXECUTED
    ) return;  // already resolved

    this._watchCount++;
    this._watchQueue.set(proposal.proposalId, {
      proposalId: proposal.proposalId,
      traceId: trace.traceId,
      addedAt: new Date().toISOString(),
      lastCheckedAt: null,
      attempts: 0,
      expectedStatus: proposal.status === PROPOSAL_STATUS.ADOPTED
        ? PROPOSAL_STATUS.EXECUTED
        : null,
    });
  }

  /**
   * Process the watch queue — called on each autonomous cycle.
   *
   * @param {Function} statusFetcher - async (proposalId) => { status, executedAt, failureReason }
   * @param {Function} afterStateFetcher - async (proposalId, trace) => { verified, evidence, notes }
   * @returns {Array<WatchResult>}
   */
  async processQueue(statusFetcher, afterStateFetcher = null) {
    this._cycleCount++;
    const results = [];

    for (const [proposalId, entry] of this._watchQueue) {
      try {
        entry.attempts++;
        entry.lastCheckedAt = new Date().toISOString();

        // Fetch latest status from governance canister / adapter
        const statusResult = await statusFetcher(proposalId);

        const result = {
          proposalId,
          traceId: entry.traceId,
          previousStatus: entry.currentStatus ?? 'unknown',
          newStatus: statusResult.status,
          cycleNumber: this._cycleCount,
          timestamp: new Date().toISOString(),
        };

        entry.currentStatus = statusResult.status;

        if (
          statusResult.status === PROPOSAL_STATUS.EXECUTED ||
          statusResult.status === PROPOSAL_STATUS.FAILED
        ) {
          result.executedAt = statusResult.executedAt ?? new Date().toISOString();
          result.failureReason = statusResult.failureReason ?? null;
          result.executionConfirmed = statusResult.status === PROPOSAL_STATUS.EXECUTED;
          result.truthAdvancement = result.executionConfirmed
            ? 'execution_confirmed'
            : 'execution_failed';

          // Check after-state if executed and fetcher available
          if (result.executionConfirmed && afterStateFetcher) {
            const afterState = await afterStateFetcher(proposalId, entry);
            result.afterStateVerified = afterState.verified ?? false;
            result.afterStateEvidence = afterState.evidence ?? null;
            result.afterStateNotes = afterState.notes ?? [];
            if (afterState.verified) result.truthAdvancement = 'after_state_verified';
          }

          // Move to completed
          this._completed.set(proposalId, { ...entry, ...result });
          this._watchQueue.delete(proposalId);

          if (this._chrono) {
            this._chrono.append({
              type: 'E10_EXECUTION_OBSERVED',
              proposalId,
              traceId: entry.traceId,
              status: statusResult.status,
              executionConfirmed: result.executionConfirmed,
              afterStateVerified: result.afterStateVerified ?? false,
            });
          }

          // Fire callbacks
          for (const cb of this._callbacks) {
            try { cb(result); } catch (_) {}
          }
        }

        results.push(result);
      } catch (err) {
        results.push({
          proposalId,
          traceId: entry.traceId,
          error: err.message,
          cycleNumber: this._cycleCount,
        });
      }
    }

    return results;
  }

  // ── Callbacks ─────────────────────────────────────────────────────────────

  onStatusChange(callback) {
    this._callbacks.push(callback);
    return () => {
      const idx = this._callbacks.indexOf(callback);
      if (idx >= 0) this._callbacks.splice(idx, 1);
    };
  }

  // ── Observability ─────────────────────────────────────────────────────────

  queueSize()       { return this._watchQueue.size; }
  completedCount()  { return this._completed.size; }
  get cycleCount()  { return this._cycleCount; }
  get watchCount()  { return this._watchCount; }

  getQueueSnapshot() {
    return [...this._watchQueue.values()];
  }

  getCompleted(proposalId) {
    return this._completed.get(String(proposalId)) ?? null;
  }
}

export default PostExecutionWatchEngine;
