/**
 * E13 — Evidence Registry Engine
 *
 * VERIFY layer: ensures every claim in a trace is either backed by a source
 * link or explicitly marked unknown.
 *
 * The invariant: EffectTrace does not lie. It does not present claims as facts
 * unless evidence is attached. The registry enforces this.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createSourceLink } from '../types.js';

export class EvidenceRegistryEngine {
  constructor() {
    this._evidence = new Map();  // claimKey → [SourceLink]
    this._registerCount = 0;
  }

  /**
   * Register a source link as evidence for a specific claim.
   *
   * @param {string} claimKey - e.g. "proposalId:wasm_hash" or "proposalId:recipient_identity"
   * @param {object} source
   * @returns {import('../types.js').SourceLink}
   */
  register(claimKey, source) {
    this._registerCount++;
    const link = createSourceLink({
      url: source.url,
      type: source.type ?? 'unknown',
      title: source.title ?? '',
      verified: source.verified ?? false,
    });
    const existing = this._evidence.get(claimKey) ?? [];
    existing.push(link);
    this._evidence.set(claimKey, existing);
    return link;
  }

  /**
   * Check whether a claim has any attached evidence.
   */
  hasEvidence(claimKey) {
    return (this._evidence.get(claimKey) ?? []).length > 0;
  }

  /**
   * Get all evidence for a claim.
   */
  getEvidence(claimKey) {
    return this._evidence.get(claimKey) ?? [];
  }

  /**
   * Audit a trace: return all claim keys that have no evidence.
   *
   * @param {string[]} expectedClaimKeys - list of required claim keys for this trace
   * @returns {{ missingEvidence: string[], coveragePercent: number }}
   */
  audit(expectedClaimKeys) {
    const missing = expectedClaimKeys.filter((k) => !this.hasEvidence(k));
    const coverage = expectedClaimKeys.length > 0
      ? Math.round(((expectedClaimKeys.length - missing.length) / expectedClaimKeys.length) * 100)
      : 0;
    return { missingEvidence: missing, coveragePercent: coverage };
  }

  evidenceSnapshot() {
    return Object.fromEntries(
      [...this._evidence.entries()].map(([k, v]) => [k, v]),
    );
  }

  get registerCount() { return this._registerCount; }
}

export default EvidenceRegistryEngine;
