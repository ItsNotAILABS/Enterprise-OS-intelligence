/**
 * E6 — Risk Classifier Engine
 *
 * TRACE + AURUM layer: φ-weighted multi-axis risk scoring.
 *
 * Each proposal is scored across six axes (0–10 each):
 *   technical              — how complex is the code change?
 *   treasury               — how much financial exposure exists?
 *   governance             — how much does this affect voting power/rules?
 *   irreversibility        — how hard to undo if wrong?
 *   verificationDifficulty — how hard to confirm the after-state?
 *   precedentWeight        — how much does this change the governance landscape?
 *
 * The aggregate risk score uses φ-weighting (AURUM, Paper XXII):
 *   irreversibility and verificationDifficulty are weighted by φ (≈1.618)
 *   because consequences that cannot be reversed or verified compound over time
 *   at the natural rate of φ — they become more dangerous with each passing cycle.
 *
 * Risk Level thresholds (raw score on 0–10 scale):
 *   0–3.0  → low
 *   3.1–5.5 → medium
 *   5.6–7.5 → high
 *   7.6+   → critical
 *
 * The system does not recommend adopt/reject.
 * It names the risk class and level, explains the reasoning, and lists
 * open questions. What to do about it is the voter's decision.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createRiskProfile, RISK_CLASS, RISK_LEVEL, AFFECTED_SYSTEM } from '../types.js';

const PHI     = 1.6180339887;
const PHI_INV = 1 / PHI;  // ≈ 0.618

// ---------------------------------------------------------------------------
// Base risk matrices per risk class
// ---------------------------------------------------------------------------

const BASE_SCORES = {
  [RISK_CLASS.MOTION]: {
    technical: 0, treasury: 0, governance: 1, irreversibility: 0, verificationDifficulty: 0, precedentWeight: 2,
  },
  [RISK_CLASS.PARAMETER_CHANGE]: {
    technical: 2, treasury: 1, governance: 5, irreversibility: 4, verificationDifficulty: 3, precedentWeight: 4,
  },
  [RISK_CLASS.CODE_UPGRADE]: {
    technical: 7, treasury: 2, governance: 3, irreversibility: 6, verificationDifficulty: 6, precedentWeight: 5,
  },
  [RISK_CLASS.TREASURY_ACTION]: {
    technical: 1, treasury: 8, governance: 2, irreversibility: 8, verificationDifficulty: 4, precedentWeight: 3,
  },
  [RISK_CLASS.GOVERNANCE_RULE_CHANGE]: {
    technical: 3, treasury: 0, governance: 8, irreversibility: 7, verificationDifficulty: 5, precedentWeight: 8,
  },
  [RISK_CLASS.CANISTER_CONTROL_CHANGE]: {
    technical: 5, treasury: 3, governance: 6, irreversibility: 8, verificationDifficulty: 7, precedentWeight: 7,
  },
  [RISK_CLASS.FRONTEND_ASSET_CHANGE]: {
    technical: 2, treasury: 0, governance: 1, irreversibility: 3, verificationDifficulty: 2, precedentWeight: 2,
  },
  [RISK_CLASS.REGISTRY_OR_NETWORK_CHANGE]: {
    technical: 5, treasury: 1, governance: 4, irreversibility: 7, verificationDifficulty: 6, precedentWeight: 5,
  },
  [RISK_CLASS.CUSTOM_GENERIC_FUNCTION]: {
    technical: 6, treasury: 4, governance: 4, irreversibility: 7, verificationDifficulty: 8, precedentWeight: 6,
  },
  [RISK_CLASS.SYSTEMIC_OR_EMERGENCY]: {
    technical: 9, treasury: 7, governance: 9, irreversibility: 9, verificationDifficulty: 9, precedentWeight: 10,
  },
  [RISK_CLASS.UNKNOWN]: {
    technical: 5, treasury: 5, governance: 5, irreversibility: 5, verificationDifficulty: 7, precedentWeight: 5,
  },
};

// ---------------------------------------------------------------------------
// RiskClassifierEngine
// ---------------------------------------------------------------------------

export class RiskClassifierEngine {
  constructor() {
    this._classifyCount = 0;
  }

  /**
   * Classify and score a proposal's risk.
   *
   * @param {object} inputs
   * @param {import('../types.js').ProposalRecord} inputs.proposal
   * @param {object} inputs.parsed      - PayloadParser output
   * @param {object} inputs.target      - TargetResolver output
   * @param {import('../types.js').EffectPath} inputs.effectPath
   * @param {number} [inputs.memoryPrecedents] - Number of related historical proposals (from E9)
   * @returns {import('../types.js').RiskProfile}
   */
  classify(inputs) {
    const { proposal, parsed, target, effectPath, memoryPrecedents = 0 } = inputs;
    this._classifyCount++;

    const riskClass = this._deriveRiskClass(target, parsed);
    const base = { ...BASE_SCORES[riskClass] };

    // Modulate scores based on contextual signals
    this._applyContextModifiers(base, {
      proposal, parsed, target, effectPath, memoryPrecedents, riskClass,
    });

    // Clamp all scores to [0, 10]
    for (const k of Object.keys(base)) {
      base[k] = Math.min(10, Math.max(0, Math.round(base[k] * 10) / 10));
    }

    // φ-weighted aggregate
    const aggregate = this._phiWeightedAggregate(base);

    // Risk level from aggregate
    const riskLevel = this._deriveRiskLevel(aggregate);

    const explanation = this._buildExplanation(riskClass, riskLevel, base, target, proposal);
    const openQuestions = this._buildOpenQuestions(riskClass, target, parsed);

    return createRiskProfile({
      riskClass,
      riskLevel,
      scores: base,
      explanation,
      openQuestions,
    });
  }

  // ── Risk class derivation ─────────────────────────────────────────────────

  _deriveRiskClass(target, parsed) {
    return target?.riskClass ?? parsed?.riskClassHint ?? RISK_CLASS.UNKNOWN;
  }

  // ── Contextual modifiers ──────────────────────────────────────────────────

  _applyContextModifiers(scores, { proposal, parsed, target, effectPath, memoryPrecedents, riskClass }) {
    // Treasury amount: scale treasury risk with amount
    if (target?.amount) {
      const amountRisk = Math.min(3, Math.log10(target.amount + 1));
      scores.treasury = Math.min(10, scores.treasury + amountRisk);
    }

    // Unresolved target: bump verification difficulty
    if (!target?.resolved) {
      scores.verificationDifficulty = Math.min(10, scores.verificationDifficulty + 2);
      scores.irreversibility = Math.min(10, scores.irreversibility + 1);
    }

    // No WASM hash for code upgrade: bump technical risk
    if (riskClass === RISK_CLASS.CODE_UPGRADE && !target?.wasmHash) {
      scores.technical = Math.min(10, scores.technical + 2);
      scores.verificationDifficulty = Math.min(10, scores.verificationDifficulty + 2);
    }

    // Generic function with no validator: maximum uncertainty
    if (riskClass === RISK_CLASS.CUSTOM_GENERIC_FUNCTION && !target?.validatorCanisterId) {
      scores.verificationDifficulty = Math.min(10, scores.verificationDifficulty + 2);
    }

    // Historical precedent: more precedents reduce uncertainty (lower verification difficulty)
    if (memoryPrecedents > 0) {
      const reductionFactor = Math.min(2, memoryPrecedents * 0.5);
      scores.verificationDifficulty = Math.max(0, scores.verificationDifficulty - reductionFactor);
      scores.precedentWeight = Math.min(10, scores.precedentWeight + Math.min(2, memoryPrecedents * 0.3));
    }

    // NNS system canister upgrade: higher irreversibility (consensus-required revert)
    if (riskClass === RISK_CLASS.CODE_UPGRADE &&
        target?.canisterName?.includes('NNS')) {
      scores.irreversibility = Math.min(10, scores.irreversibility + 1);
      scores.governance = Math.min(10, scores.governance + 1);
    }
  }

  // ── φ-weighted aggregate ──────────────────────────────────────────────────

  /**
   * φ-weighted aggregate (AURUM, Paper XXII):
   * Consequences that cannot be reversed or verified compound at rate φ.
   *
   *   aggregate = (Σ raw_scores + φ × irreversibility + φ × verificationDifficulty) /
   *               (N_axes + 2(φ − 1))
   */
  _phiWeightedAggregate(scores) {
    const {
      technical, treasury, governance, irreversibility, verificationDifficulty, precedentWeight,
    } = scores;

    const sumRaw = technical + treasury + governance + irreversibility + verificationDifficulty + precedentWeight;
    const phiBonus = (PHI - 1) * (irreversibility + verificationDifficulty);
    const denominator = 6 + 2 * (PHI - 1);

    return (sumRaw + phiBonus) / denominator;
  }

  // ── Risk level from aggregate ─────────────────────────────────────────────

  _deriveRiskLevel(aggregate) {
    if (aggregate <= 3.0) return RISK_LEVEL.LOW;
    if (aggregate <= 5.5) return RISK_LEVEL.MEDIUM;
    if (aggregate <= 7.5) return RISK_LEVEL.HIGH;
    return RISK_LEVEL.CRITICAL;
  }

  // ── Explanation builder ───────────────────────────────────────────────────

  _buildExplanation(riskClass, riskLevel, scores, target, proposal) {
    const classLabels = {
      [RISK_CLASS.MOTION]:                  'Motion (no direct on-chain effect)',
      [RISK_CLASS.CODE_UPGRADE]:            'Code upgrade',
      [RISK_CLASS.TREASURY_ACTION]:         'Treasury action',
      [RISK_CLASS.GOVERNANCE_RULE_CHANGE]:  'Governance rule change',
      [RISK_CLASS.CANISTER_CONTROL_CHANGE]: 'Canister control change',
      [RISK_CLASS.CUSTOM_GENERIC_FUNCTION]: 'Custom/generic SNS function execution',
      [RISK_CLASS.PARAMETER_CHANGE]:        'Parameter change',
      [RISK_CLASS.REGISTRY_OR_NETWORK_CHANGE]: 'Registry or network change',
      [RISK_CLASS.FRONTEND_ASSET_CHANGE]:   'Frontend asset change',
      [RISK_CLASS.SYSTEMIC_OR_EMERGENCY]:   'Systemic or emergency action',
      [RISK_CLASS.UNKNOWN]:                 'Unknown risk class',
    };

    const label = classLabels[riskClass] ?? riskClass;
    const highestAxis = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

    let explanation = `${label}. Risk level: ${riskLevel.toUpperCase()}.`;
    if (highestAxis[1] >= 7) {
      explanation += ` Primary concern: ${highestAxis[0].replace(/([A-Z])/g, ' $1').trim()} (score: ${highestAxis[1]}/10).`;
    }
    if (target?.canisterId) {
      const name = target.canisterName ? ` (${target.canisterName})` : '';
      explanation += ` Target: ${target.canisterId}${name}.`;
    }
    if (target?.amount) {
      explanation += ` Treasury exposure: ${target.amount} tokens.`;
    }
    return explanation;
  }

  _buildOpenQuestions(riskClass, target, parsed) {
    const q = [];
    if (riskClass === RISK_CLASS.CODE_UPGRADE) {
      q.push('Has the WASM hash been verified against the published release?');
      q.push('Has the canister migration path been reviewed?');
    }
    if (riskClass === RISK_CLASS.TREASURY_ACTION) {
      q.push('Has the recipient identity been independently verified?');
      q.push('Is this amount within previously approved treasury parameters?');
    }
    if (riskClass === RISK_CLASS.CUSTOM_GENERIC_FUNCTION) {
      if (!target?.validatorCanisterId) {
        q.push('What does the generic function execute? No validator registered.');
      }
      q.push('Has the target method been audited for this payload?');
    }
    if (riskClass === RISK_CLASS.GOVERNANCE_RULE_CHANGE) {
      q.push('What neurons or following relationships does this affect?');
      q.push('Is this reversible with another proposal?');
    }
    if (!target?.resolved) {
      q.push('The execution target has not been identified — where does this proposal act?');
    }
    return q;
  }

  get classifyCount() { return this._classifyCount; }
}

export default RiskClassifierEngine;
