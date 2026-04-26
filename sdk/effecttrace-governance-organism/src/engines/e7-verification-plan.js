/**
 * E7 — Verification Plan Engine
 *
 * VERIFY layer: generates concrete, actionable steps to confirm effect after execution.
 *
 * Steps are not generic — they name specific canister query methods, dashboard URLs,
 * or hash comparison procedures relevant to the specific risk class and target.
 *
 * A step is not marked verified until evidence is attached.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createVerificationPlan, RISK_CLASS } from '../types.js';

export class VerificationPlanEngine {
  constructor() {
    this._planCount = 0;
  }

  /**
   * Generate a verification plan from risk profile and target.
   *
   * @param {import('../types.js').RiskProfile} riskProfile
   * @param {object} target - TargetResolver output
   * @param {import('../types.js').ProposalRecord} proposal
   * @returns {import('../types.js').VerificationPlan}
   */
  generate(riskProfile, target, proposal) {
    this._planCount++;
    const steps = [];

    switch (riskProfile.riskClass) {
      case RISK_CLASS.CODE_UPGRADE:
        steps.push({
          step: 'Retrieve canister WASM hash post-execution',
          tool: 'dfx canister info or management canister query',
          method: 'module_hash',
          canisterId: target?.canisterId ?? null,
          expectedResult: target?.wasmHash
            ? `Hash should match: ${target.wasmHash.slice(0, 32)}...`
            : 'Compare against published build artifact hash',
          verified: false,
          evidence: null,
        });
        steps.push({
          step: 'Verify canister controllers remain as expected',
          tool: 'dfx canister info --network ic',
          canisterId: target?.canisterId ?? null,
          expectedResult: 'Controllers unchanged or updated as specified in proposal',
          verified: false,
          evidence: null,
        });
        steps.push({
          step: 'Check canister status (running/stopped) after upgrade',
          tool: 'dfx canister status --network ic',
          canisterId: target?.canisterId ?? null,
          expectedResult: 'Status: running',
          verified: false,
          evidence: null,
        });
        if (target?.canisterName?.toLowerCase().includes('ledger')) {
          steps.push({
            step: 'Verify ledger archive linkage and balance integrity',
            tool: 'IC Dashboard or Ledger archive query',
            expectedResult: 'Balances consistent pre/post upgrade',
            verified: false,
            evidence: null,
          });
        }
        break;

      case RISK_CLASS.TREASURY_ACTION:
        steps.push({
          step: 'Verify transfer executed to correct account',
          tool: 'IC Dashboard — Transactions',
          url: `https://dashboard.internetcomputer.org/`,
          expectedResult: target?.toAccount
            ? `Transfer of ${target.amount ?? 'amount'} to ${target.toAccount}`
            : 'Confirm transfer recipient matches proposal',
          verified: false,
          evidence: null,
        });
        steps.push({
          step: 'Confirm treasury balance reduced by stated amount',
          tool: 'SNS governance canister query: get_nervous_system_parameters',
          canisterId: proposal.governanceCanisterId ?? null,
          expectedResult: 'Treasury ledger balance reduced accordingly',
          verified: false,
          evidence: null,
        });
        break;

      case RISK_CLASS.GOVERNANCE_RULE_CHANGE:
        steps.push({
          step: 'Query governance canister for updated parameters',
          tool: 'Governance canister query: get_nervous_system_parameters',
          canisterId: proposal.governanceCanisterId ?? null,
          expectedResult: 'Parameters reflect proposal changes',
          verified: false,
          evidence: null,
        });
        steps.push({
          step: 'Verify default following behavior unchanged (if applicable)',
          tool: 'NNS Dapp or governance query',
          expectedResult: 'Following weights / topic assignments as expected',
          verified: false,
          evidence: null,
        });
        break;

      case RISK_CLASS.CUSTOM_GENERIC_FUNCTION:
        steps.push({
          step: 'Confirm generic function execution status',
          tool: 'SNS governance proposal status query',
          canisterId: proposal.governanceCanisterId ?? null,
          expectedResult: 'Proposal status: executed (not failed)',
          verified: false,
          evidence: null,
        });
        if (target?.validatorCanisterId) {
          steps.push({
            step: 'Query target canister to confirm state change',
            tool: `dfx canister call ${target.canisterId ?? '[target]'} ${target.method ?? '[method]'}`,
            canisterId: target?.canisterId ?? null,
            expectedResult: 'State reflects executed payload',
            verified: false,
            evidence: null,
          });
        } else {
          steps.push({
            step: 'Manually identify target canister and verify state change',
            tool: 'Manual review — validator not registered',
            expectedResult: 'State change consistent with proposal claim',
            verified: false,
            evidence: null,
          });
        }
        break;

      case RISK_CLASS.CANISTER_CONTROL_CHANGE:
        steps.push({
          step: 'Verify canister control list updated as specified',
          tool: 'dfx canister info or management canister query',
          canisterId: target?.canisterId ?? null,
          expectedResult: 'Controllers match proposal specification',
          verified: false,
          evidence: null,
        });
        break;

      default:
        steps.push({
          step: 'Verify proposal execution status in governance UI',
          tool: 'NNS Dapp or SNS Dapp proposal detail page',
          expectedResult: 'Status: Executed',
          verified: false,
          evidence: null,
        });
        steps.push({
          step: 'Confirm actual state change matches proposal claim',
          tool: 'Canister query or dashboard — manually determined',
          expectedResult: 'As described in proposal summary',
          verified: false,
          evidence: null,
        });
    }

    // Always add: execution failure check
    steps.push({
      step: 'Check for execution failure or rejection',
      tool: 'Governance canister proposal query',
      canisterId: proposal.governanceCanisterId ?? null,
      expectedResult: 'No failure reason present; execution_state: executed',
      verified: false,
      evidence: null,
    });

    return createVerificationPlan({ steps });
  }

  /**
   * Mark a specific step as verified with attached evidence.
   */
  completeStep(plan, stepIndex, evidence) {
    const steps = plan.steps.map((s, i) =>
      i === stepIndex ? { ...s, verified: true, evidence } : s,
    );
    const completedSteps = steps.filter((s) => s.verified).length;
    return { ...plan, steps, completedSteps };
  }

  get planCount() { return this._planCount; }
}

export default VerificationPlanEngine;
