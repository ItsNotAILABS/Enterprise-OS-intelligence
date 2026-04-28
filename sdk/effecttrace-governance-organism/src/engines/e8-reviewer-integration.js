/**
 * E8 — Reviewer Integration Engine
 *
 * VERIFY layer: links external review evidence (CodeGov, forum, manual reviews)
 * to a trace and advances its truth status accordingly.
 *
 * CodeGov's GaaS platform already stores proposal and review data in stable memory
 * with certified HTTP responses. EffectTrace sits above that lane — it consumes
 * CodeGov's review outputs as evidence sources, does not duplicate them.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createSourceLink, SEVERITY, createAgentFinding, AGENT_ROLE } from '../types.js';

const REVIEW_SOURCE_TYPES = Object.freeze({
  CODEGOV:   'codegov',
  FORUM:     'forum',
  DASHBOARD: 'dashboard',
  MANUAL:    'manual',
  CANISTER_QUERY: 'canister_query',
});

export class ReviewerIntegrationEngine {
  constructor() {
    this._submissions = new Map();  // proposalId → [ReviewSubmission]
    this._submitCount = 0;
  }

  /**
   * Submit a review or external evidence link for a proposal.
   *
   * @param {string} proposalId
   * @param {object} review
   * @param {string} review.sourceType  - 'codegov' | 'forum' | 'dashboard' | 'manual' | 'canister_query'
   * @param {string} review.url
   * @param {string} review.title
   * @param {string} review.summary
   * @param {string} review.reviewer   - Neuron ID or handle
   * @param {boolean} review.verified  - Has this source been independently checked?
   * @returns {object} submission record
   */
  submit(proposalId, review) {
    this._submitCount++;
    const submission = {
      submissionId: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      proposalId: String(proposalId),
      sourceType: review.sourceType ?? REVIEW_SOURCE_TYPES.MANUAL,
      url: review.url ?? null,
      title: review.title ?? '',
      summary: review.summary ?? '',
      reviewer: review.reviewer ?? 'anonymous',
      verified: review.verified ?? false,
      submittedAt: new Date().toISOString(),
      sourceLink: createSourceLink({
        url: review.url,
        type: review.sourceType ?? 'manual',
        title: review.title,
        verified: review.verified ?? false,
      }),
    };

    const existing = this._submissions.get(String(proposalId)) ?? [];
    existing.push(submission);
    this._submissions.set(String(proposalId), existing);
    return submission;
  }

  /**
   * Synthesize all review submissions for a proposal into an AgentFinding.
   * This feeds the Agent Council (E11) and the Runtime Truth Engine (E5).
   */
  synthesize(proposalId) {
    const submissions = this._submissions.get(String(proposalId)) ?? [];
    if (submissions.length === 0) {
      return createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: 'No external reviews or evidence submitted yet.',
        severity: SEVERITY.WATCH,
        evidence: [],
      });
    }

    const codegovReviews = submissions.filter((s) => s.sourceType === REVIEW_SOURCE_TYPES.CODEGOV);
    const forumLinks     = submissions.filter((s) => s.sourceType === REVIEW_SOURCE_TYPES.FORUM);
    const queryResults   = submissions.filter((s) => s.sourceType === REVIEW_SOURCE_TYPES.CANISTER_QUERY);

    let finding = `${submissions.length} review source(s) attached.`;
    if (codegovReviews.length > 0) {
      finding += ` ${codegovReviews.length} CodeGov review(s).`;
    }
    if (forumLinks.length > 0) {
      finding += ` ${forumLinks.length} forum reference(s).`;
    }
    if (queryResults.length > 0) {
      finding += ` ${queryResults.length} canister query result(s).`;
    }

    const severity = submissions.some((s) => s.verified)
      ? SEVERITY.INFO
      : SEVERITY.WATCH;

    return createAgentFinding({
      agent: AGENT_ROLE.INTEGRITY,
      finding,
      severity,
      evidence: submissions.map((s) => s.sourceLink),
      reviewStatus: submissions.some((s) => s.verified) ? 'confirmed' : 'pending',
    });
  }

  getSubmissions(proposalId) {
    return this._submissions.get(String(proposalId)) ?? [];
  }

  get submitCount() { return this._submitCount; }
  static get REVIEW_SOURCE_TYPES() { return REVIEW_SOURCE_TYPES; }
}

export default ReviewerIntegrationEngine;
