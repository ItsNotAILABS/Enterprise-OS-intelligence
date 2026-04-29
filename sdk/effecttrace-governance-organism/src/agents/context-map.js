/**
 * Context Map Agent — LUMEN (internal) / Context Map (public)
 *
 * REMEMBER layer: links the proposal to prior governance history and forum context.
 *
 * Primary questions:
 * - Have similar proposals been tried before?
 * - Was a prior proposal in this area reversed or extended?
 * - What do reviewers and the forum say?
 * - What is the long-term governance pattern this proposal fits into?
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createAgentFinding, AGENT_ROLE, SEVERITY } from '../types.js';

export class ContextMapAgent {
  constructor() {
    this._runCount = 0;
  }

  /**
   * @param {import('../types.js').EffectTraceRecord} trace
   * @param {import('../types.js').ProposalRecord} proposal
   * @param {{ proposals: object[], linkCount: number, fieldConcentration: number }} memory
   * @returns {import('../types.js').AgentFinding[]}
   */
  run(trace, proposal, memory) {
    this._runCount++;
    const findings = [];

    const { proposals: related, linkCount, fieldConcentration } = memory ?? { proposals: [], linkCount: 0, fieldConcentration: 0 };

    // 1. No precedent
    if (related.length === 0) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.CONTEXT_MAP,
        finding: `No related proposals found in governance memory for this risk class (${trace.riskProfile?.riskClass ?? 'unknown'}). This may be a first-of-kind action — increased scrutiny recommended.`,
        severity: SEVERITY.WATCH,
      }));
    }

    // 2. Reversals in history
    const reversals = related.filter((p) => p.linkType === 'reversed' || p.linkType === 'contradicts');
    if (reversals.length > 0) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.CONTEXT_MAP,
        finding: `Governance memory contains ${reversals.length} proposal(s) that reversed or contradicted prior actions in this area. Review whether this proposal repeats a governance pattern that was previously corrected.`,
        severity: SEVERITY.WARNING,
        evidence: reversals.slice(0, 3).map((p) => ({
          url: null,
          type: 'governance_memory',
          title: `Proposal ${p.proposalId}: ${p.title ?? 'untitled'} (${p.linkType})`,
          verified: false,
        })),
      }));
    }

    // 3. High field concentration
    if (fieldConcentration > 2.0) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.CONTEXT_MAP,
        finding: `High governance activity in this risk class (field concentration: ${fieldConcentration.toFixed(2)}). This proposal joins a pattern of governance actions in this area — review the full memory thread for context.`,
        severity: SEVERITY.WATCH,
      }));
    }

    // 4. Related proposals found
    if (related.length > 0 && reversals.length === 0) {
      const titles = related.slice(0, 3).map((p) => `Proposal ${p.proposalId}`).join(', ');
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.CONTEXT_MAP,
        finding: `${related.length} related proposal(s) in governance memory: ${titles}. Review for precedent.`,
        severity: SEVERITY.INFO,
      }));
    }

    // 5. Forum links
    const forumLinks = (proposal.sourceLinks ?? []).filter((l) => l.type === 'forum');
    if (forumLinks.length === 0) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.CONTEXT_MAP,
        finding: 'No forum discussion link attached. Community context is unavailable.',
        severity: SEVERITY.WATCH,
      }));
    }

    return findings;
  }

  get runCount() { return this._runCount; }
}

export default ContextMapAgent;
