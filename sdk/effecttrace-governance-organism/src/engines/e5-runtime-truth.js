/**
 * E5 — Runtime Truth Engine
 *
 * VERIFY layer: classifies the truth status of every claim in a trace.
 *
 * The system never lies. It says what it knows, what it has seen, what has
 * been confirmed, and what remains unresolved. The truth ladder is:
 *
 *   claim_only              → proposal text exists, nothing else confirmed
 *   payload_identified      → payload parsed, target identified
 *   review_supported        → a reviewer has submitted linked evidence
 *   execution_pending       → proposal adopted, execution not yet confirmed
 *   executed_not_verified   → execution recorded, after-state not checked
 *   verified_after_state    → after-state matches expectation with evidence
 *   disputed                → conflicting evidence from multiple reviewers
 *   unknown                 → insufficient data to classify
 *
 * Every advancement up the truth ladder requires evidence. No skipping.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createRuntimeTruthBlock, TRUTH_STATUS, PROPOSAL_STATUS } from '../types.js';

// ---------------------------------------------------------------------------
// RuntimeTruthEngine
// ---------------------------------------------------------------------------

export class RuntimeTruthEngine {
  constructor() {
    this._assessCount = 0;
  }

  /**
   * Derive the current RuntimeTruthBlock for a trace given all available signals.
   *
   * @param {object} inputs
   * @param {import('../types.js').ProposalRecord}   inputs.proposal
   * @param {object}                                 inputs.parsed     - PayloadParser output
   * @param {object}                                 inputs.target     - TargetResolver output
   * @param {import('../types.js').EffectPath}       inputs.effectPath
   * @param {object[]}                               inputs.findings   - AgentFinding[]
   * @param {boolean}                                inputs.executed   - E10 confirmed execution?
   * @param {string|null}                            inputs.afterStateEvidence - URL or null
   * @returns {import('../types.js').RuntimeTruthBlock}
   */
  assess(inputs) {
    const {
      proposal,
      parsed,
      target,
      effectPath,
      findings = [],
      executed = false,
      afterStateEvidence = null,
    } = inputs;

    this._assessCount++;

    const claimObserved     = Boolean(proposal.title || proposal.summary);
    const payloadObserved   = parsed?.parseSuccess === true;
    const targetIdentified  = target?.resolved === true;
    const reviewerConfirmed = findings.some(
      (f) => ['execution_trace', 'integrity', 'verification_lab'].includes(f.agent) &&
             f.reviewStatus === 'confirmed',
    );
    const executionObserved = executed ||
      proposal.status === PROPOSAL_STATUS.EXECUTED ||
      proposal.status === PROPOSAL_STATUS.FAILED;
    const afterStateVerified = Boolean(afterStateEvidence) && executionObserved;

    const unresolvedQuestions = this._deriveUnresolvedQuestions({
      proposal, parsed, target, effectPath, findings, executed, afterStateEvidence,
    });

    const truthStatus = this._deriveTruthStatus({
      claimObserved, payloadObserved, targetIdentified, reviewerConfirmed,
      executionObserved, afterStateVerified,
      disputed: findings.some((f) => f.reviewStatus === 'disputed'),
    });

    return createRuntimeTruthBlock({
      claimObserved,
      payloadObserved,
      targetIdentified,
      reviewerConfirmed,
      executionObserved,
      afterStateVerified,
      truthStatus,
      unresolvedQuestions,
    });
  }

  // ── Truth status derivation ───────────────────────────────────────────────

  _deriveTruthStatus({
    claimObserved, payloadObserved, targetIdentified, reviewerConfirmed,
    executionObserved, afterStateVerified, disputed,
  }) {
    if (disputed)          return TRUTH_STATUS.DISPUTED;
    if (!claimObserved)    return TRUTH_STATUS.UNKNOWN;
    if (afterStateVerified) return TRUTH_STATUS.VERIFIED_AFTER_STATE;
    if (executionObserved) return TRUTH_STATUS.EXECUTED_NOT_VERIFIED;
    if (reviewerConfirmed) return TRUTH_STATUS.REVIEW_SUPPORTED;
    if (targetIdentified)  return TRUTH_STATUS.PAYLOAD_IDENTIFIED;
    if (payloadObserved)   return TRUTH_STATUS.PAYLOAD_IDENTIFIED;
    return TRUTH_STATUS.CLAIM_ONLY;
  }

  // ── Unresolved question generation ───────────────────────────────────────

  _deriveUnresolvedQuestions({ proposal, parsed, target, effectPath, findings, executed, afterStateEvidence }) {
    const q = [];

    if (!parsed?.parseSuccess) {
      q.push('Payload could not be parsed — what is the actual execution target?');
    }

    if (!target?.resolved) {
      q.push('Target canister/method not identified — where does the execution land?');
    }

    if (target?.resolved && !target.canisterName) {
      q.push(`Target canister ${target.canisterId} is not in known registry — is this a known canister?`);
    }

    if (target?.riskClass === 'code_upgrade' && !target?.wasmHash) {
      q.push('WASM hash not extracted from payload — cannot verify build artifact match');
    }

    if (target?.riskClass === 'treasury_action') {
      if (!target.toAccount) q.push('Transfer recipient not identified');
      if (!target.amount)    q.push('Transfer amount not confirmed from payload');
    }

    if (target?.riskClass === 'custom_generic_function' && !target.validatorCanisterId) {
      q.push('SNS generic function validator not identified — execution path unverifiable before execution');
    }

    const reviewerFindings = findings.filter(
      (f) => f.agent === 'execution_trace' || f.agent === 'integrity',
    );
    if (reviewerFindings.length === 0) {
      q.push('No Execution Trace or Integrity review submitted yet');
    }

    if (proposal.status === PROPOSAL_STATUS.ADOPTED && !executed) {
      q.push('Proposal adopted — awaiting execution confirmation and after-state check');
    }

    if (executed && !afterStateEvidence) {
      q.push('Execution recorded but no after-state evidence attached — verify canister state');
    }

    return q;
  }

  /**
   * Advance the truth status for a trace given a new piece of evidence.
   * Used by E10 (Post-Execution Watch) and E8 (Reviewer Integration).
   *
   * @param {import('../types.js').RuntimeTruthBlock} current
   * @param {string} evidenceType - 'execution_confirmed' | 'after_state_verified' | 'reviewer_confirmed' | 'dispute_filed'
   * @param {string} [evidenceUrl]
   * @returns {import('../types.js').RuntimeTruthBlock}
   */
  advance(current, evidenceType, evidenceUrl = null) {
    const updates = { ...current };

    switch (evidenceType) {
      case 'reviewer_confirmed':
        updates.reviewerConfirmed = true;
        break;
      case 'execution_confirmed':
        updates.executionObserved = true;
        break;
      case 'after_state_verified':
        updates.afterStateVerified = true;
        break;
      case 'dispute_filed':
        return createRuntimeTruthBlock({ ...current, truthStatus: TRUTH_STATUS.DISPUTED });
    }

    return createRuntimeTruthBlock({
      ...updates,
      truthStatus: this._deriveTruthStatus({
        claimObserved:    updates.claimObserved,
        payloadObserved:  updates.payloadObserved,
        targetIdentified: updates.targetIdentified,
        reviewerConfirmed: updates.reviewerConfirmed,
        executionObserved: updates.executionObserved,
        afterStateVerified: updates.afterStateVerified,
        disputed: false,
      }),
    });
  }

  get assessCount() { return this._assessCount; }
}

export default RuntimeTruthEngine;
