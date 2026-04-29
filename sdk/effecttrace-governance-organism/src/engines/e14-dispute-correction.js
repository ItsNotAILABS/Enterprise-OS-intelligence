/**
 * E14 — Dispute & Correction Engine
 *
 * VERIFY layer: allows corrections, disputed findings, and full revision history.
 *
 * Every finding is reviewable. Every dispute is recorded. Every correction
 * creates a new version while preserving the prior state.
 * Nothing is silently overwritten.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { TRUTH_STATUS } from '../types.js';

export class DisputeCorrectionEngine {
  constructor() {
    this._revisions = new Map();  // traceId → [Revision]
    this._disputes  = new Map();  // findingId → [Dispute]
    this._revisionCount = 0;
    this._chrono = null;
  }

  setChrono(chrono) { this._chrono = chrono; return this; }

  // ── Corrections ───────────────────────────────────────────────────────────

  /**
   * Apply a correction to a trace. Creates a new revision in history.
   * The original record is preserved — never overwritten.
   *
   * @param {import('../types.js').EffectTraceRecord} currentTrace
   * @param {object} patch - fields to update
   * @param {string} reason - why the correction was made
   * @param {string} [author] - who made the correction
   * @returns {{ revision: Revision, updatedTrace: object }}
   */
  correct(currentTrace, patch, reason, author = 'reviewer') {
    this._revisionCount++;

    const revision = {
      revisionId: `rev-${currentTrace.traceId}-${this._revisionCount}`,
      traceId: currentTrace.traceId,
      proposalId: currentTrace.proposalId,
      previousVersion: { ...currentTrace },
      patch,
      reason,
      author,
      timestamp: new Date().toISOString(),
      revisionNumber: this._revisionCount,
    };

    const existing = this._revisions.get(currentTrace.traceId) ?? [];
    existing.push(revision);
    this._revisions.set(currentTrace.traceId, existing);

    const updatedTrace = {
      ...currentTrace,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    if (this._chrono) {
      this._chrono.append({
        type: 'E14_CORRECTION',
        traceId: currentTrace.traceId,
        proposalId: currentTrace.proposalId,
        revisionNumber: this._revisionCount,
        patchKeys: Object.keys(patch),
        author,
        reason: reason.slice(0, 200),
      });
    }

    return { revision, updatedTrace };
  }

  // ── Disputes ──────────────────────────────────────────────────────────────

  /**
   * File a dispute against a specific agent finding.
   *
   * @param {string} findingId
   * @param {object} dispute
   * @param {string} dispute.by - neuron ID or handle of disputing party
   * @param {string} dispute.reason
   * @param {string} [dispute.evidenceUrl]
   * @returns {object} dispute record
   */
  dispute(findingId, { by, reason, evidenceUrl = null }) {
    const record = {
      disputeId: `dis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      findingId,
      by,
      reason,
      evidenceUrl,
      filedAt: new Date().toISOString(),
      resolution: null,  // null | 'upheld' | 'overturned'
      resolvedAt: null,
    };

    const existing = this._disputes.get(findingId) ?? [];
    existing.push(record);
    this._disputes.set(findingId, existing);

    return record;
  }

  /**
   * Resolve a dispute.
   * @param {string} disputeId
   * @param {string} resolution - 'upheld' | 'overturned'
   * @param {string} [by]
   */
  resolve(disputeId, resolution, by = 'council') {
    for (const [findingId, disputes] of this._disputes) {
      const d = disputes.find((x) => x.disputeId === disputeId);
      if (d) {
        d.resolution = resolution;
        d.resolvedBy = by;
        d.resolvedAt = new Date().toISOString();
        return d;
      }
    }
    return null;
  }

  // ── Observability ─────────────────────────────────────────────────────────

  getRevisions(traceId) {
    return this._revisions.get(traceId) ?? [];
  }

  getDisputes(findingId) {
    return this._disputes.get(findingId) ?? [];
  }

  hasOpenDisputes(findingId) {
    return this.getDisputes(findingId).some((d) => !d.resolution);
  }

  get revisionCount() { return this._revisionCount; }
}

export default DisputeCorrectionEngine;
