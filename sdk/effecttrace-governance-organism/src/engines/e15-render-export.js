/**
 * E15 — Renderability & Export Engine
 *
 * TRACE · VERIFY · REMEMBER → output formats.
 *
 * Produces: forum markdown, JSON export, plain text, review packet.
 *
 * Matches the existing Renderability layer in the MERIDIAN architecture:
 * ingest → structure parse → integrity validation → layout → render → export.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

export class RenderabilityExportEngine {
  constructor() {
    this._exportCount = 0;
  }

  /**
   * Export a trace + public summary as forum-ready markdown.
   * This is what gets posted to the ICP forum or governance channels.
   *
   * @param {object} summary - From PublicSummaryEngine.generate()
   * @param {import('../types.js').EffectTraceRecord} trace
   * @param {import('../types.js').ProposalRecord} proposal
   * @returns {string} Forum markdown string
   */
  toForumMarkdown(summary, trace, proposal) {
    this._exportCount++;
    return summary.markdownFull;
  }

  /**
   * Export a minimal JSON record for API consumers or cross-system indexing.
   */
  toJSON(summary, trace, proposal) {
    this._exportCount++;
    return JSON.stringify(summary.jsonExport, null, 2);
  }

  /**
   * Export a full review packet — all fields, for serious reviewers.
   */
  toReviewPacket(trace, proposal) {
    this._exportCount++;
    return {
      proposalId: proposal.proposalId,
      title: proposal.title,
      daoType: proposal.daoType,
      status: proposal.status,
      proposer: proposal.proposer,
      sourceLinks: proposal.sourceLinks,
      effectPath: trace.effectPath,
      runtimeTruth: trace.runtimeTruth,
      riskProfile: trace.riskProfile,
      verificationPlan: trace.verificationPlan,
      agentFindings: trace.agentFindings,
      memoryLinks: trace.memoryLinks,
      confidence: trace.confidence,
      traceStatus: trace.status,
      createdAt: trace.createdAt,
      updatedAt: trace.updatedAt,
    };
  }

  /**
   * Export a plain-text version (for Telegram, Discord, or compact output).
   */
  toPlainText(summary, proposal) {
    this._exportCount++;
    // Strip markdown formatting
    return summary.body
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#+\s/g, '')
      .replace(/---/g, '---');
  }

  get exportCount() { return this._exportCount; }
}

export default RenderabilityExportEngine;
