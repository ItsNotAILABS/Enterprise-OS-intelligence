/**
 * E4 — Effect Path Engine
 *
 * TRACE layer: the core.
 *
 * Takes a proposal, its parsed payload, and its resolved target, then builds
 * the complete Effect Path record:
 *
 *   Proposal
 *   → Governance system (NNS/SNS)
 *   → Proposal type/action
 *   → Target canister / parameter / treasury / registry / asset
 *   → Method or payload
 *   → Expected state change
 *   → Risk class
 *   → Verification evidence
 *   → Post-execution result (populated later by E10)
 *   → Governance memory (populated by E9)
 *
 * The claim field always restates exactly what the proposal claims, in plain text.
 * Everything else is the engine's analysis — labeled separately.
 *
 * "The system does not lie. It says: the proposal claims X. The payload appears
 *  to target Y. Reviewers confirmed Z. After-state not yet verified."
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createEffectPath, AFFECTED_SYSTEM, RISK_CLASS } from '../types.js';

// ---------------------------------------------------------------------------
// EffectPathEngine
// ---------------------------------------------------------------------------

export class EffectPathEngine {
  constructor() {
    this._buildCount = 0;
  }

  /**
   * Build an EffectPath from proposal, parsed payload, and resolved target.
   *
   * @param {import('../types.js').ProposalRecord} proposal
   * @param {object} parsed - From PayloadParserEngine
   * @param {object} target - From TargetResolverEngine
   * @returns {import('../types.js').EffectPath}
   */
  build(proposal, parsed, target) {
    this._buildCount++;

    const claim = this._extractClaim(proposal);
    const affectedSystem = target.affectedSystem ?? parsed.affectedSystem ?? AFFECTED_SYSTEM.UNKNOWN;
    const riskClass = target.riskClass ?? parsed.riskClassHint ?? RISK_CLASS.UNKNOWN;

    const affectedState = this._describeAffectedState(affectedSystem, target, parsed);
    const expectedAfterState = this._describeExpectedAfterState(affectedSystem, target, parsed, proposal);
    const executionTrigger = this._describeExecutionTrigger(proposal.daoType, proposal.proposalType ?? proposal.actionType);
    const executionDependency = this._describeExecutionDependency(riskClass, target);

    return createEffectPath({
      claim,
      affectedSystem,
      targetCanisterId: target.canisterId ?? null,
      targetMethod: target.method ?? null,
      validatorCanisterId: target.validatorCanisterId ?? null,
      validatorMethod: target.validatorMethod ?? null,
      affectedState,
      beforeState: null,  // populated post-adoption by E10
      expectedAfterState,
      executionTrigger,
      executionDependency,
    });
  }

  // ── Claim extraction ──────────────────────────────────────────────────────

  _extractClaim(proposal) {
    const parts = [];
    if (proposal.title) parts.push(proposal.title);
    if (proposal.summary) parts.push(proposal.summary.slice(0, 300));
    if (parts.length === 0) parts.push('No claim text available');
    return parts.join(' — ');
  }

  // ── State descriptions ────────────────────────────────────────────────────

  _describeAffectedState(system, target, parsed) {
    switch (system) {
      case AFFECTED_SYSTEM.PROTOCOL_CANISTER:
        return target.canisterName
          ? `${target.canisterName} (${target.canisterId ?? 'unknown'}) WASM and execution state`
          : `Protocol canister ${target.canisterId ?? 'unknown'} WASM and execution state`;

      case AFFECTED_SYSTEM.SNS_DAPP_CANISTER:
        if (target.functionId) {
          return `SNS dapp canister via generic function ${target.functionId}: ${target.canisterId ?? 'unknown target'}`;
        }
        return target.canisterId
          ? `SNS-controlled canister ${target.canisterId} (${target.canisterName ?? 'unknown'}) WASM`
          : 'SNS-controlled canister WASM';

      case AFFECTED_SYSTEM.LEDGER_OR_TREASURY:
        return target.amount
          ? `Treasury balance: transfer of ${target.amount} tokens to ${target.toAccount ?? 'recipient'}`
          : 'Treasury or ledger balance';

      case AFFECTED_SYSTEM.REGISTRY:
        return 'Network registry: node/subnet/provider entries';

      case AFFECTED_SYSTEM.GOVERNANCE_RULE:
        return 'Governance rules: neuron following, parameter configuration, or metadata';

      case AFFECTED_SYSTEM.FRONTEND_ASSET_CANISTER:
        return `Frontend asset canister ${target.canisterId ?? 'unknown'} content`;

      case AFFECTED_SYSTEM.NNS:
        return 'NNS governance state, system parameters, or NNS canister WASM';

      case AFFECTED_SYSTEM.SNS:
        return 'SNS governance parameters, metadata, or nervous system configuration';

      default:
        return 'Unknown system state — target requires manual identification';
    }
  }

  _describeExpectedAfterState(system, target, parsed, proposal) {
    const actionType = proposal.actionType ?? proposal.proposalType;

    switch (system) {
      case AFFECTED_SYSTEM.PROTOCOL_CANISTER:
      case AFFECTED_SYSTEM.SNS_DAPP_CANISTER: {
        const hash = target.wasmHash ? ` (hash: ${target.wasmHash.slice(0, 16)}...)` : '';
        return `Canister running new WASM version${hash} via ${target.method ?? 'install_code'}`;
      }

      case AFFECTED_SYSTEM.LEDGER_OR_TREASURY:
        return target.amount
          ? `${target.amount} tokens transferred to ${target.toAccount ?? 'recipient'}; treasury reduced accordingly`
          : 'Treasury balance reflects completed transfer';

      case AFFECTED_SYSTEM.GOVERNANCE_RULE:
        return `Governance parameters updated as specified in ${actionType ?? 'proposal payload'}`;

      case AFFECTED_SYSTEM.NNS:
        if (actionType === 'Motion') return 'No direct on-chain state change; adoption signals governance intent only';
        return 'NNS state updated per executed function';

      case AFFECTED_SYSTEM.SNS:
        return 'SNS configuration updated per adopted proposal';

      default:
        return 'Expected after-state unknown — requires reviewer analysis or canister query';
    }
  }

  _describeExecutionTrigger(daoType, actionType) {
    if (actionType === 'Motion') return 'No execution trigger — motion has no on-chain effect upon adoption';
    return daoType === 'NNS'
      ? 'NNS governance canister automatically executes adopted proposal via installed action handler'
      : 'SNS governance canister automatically calls target canister method with proposal payload if adopted';
  }

  _describeExecutionDependency(riskClass, target) {
    switch (riskClass) {
      case RISK_CLASS.CODE_UPGRADE:
        return 'Requires WASM hash verification against released build artifacts before vote';
      case RISK_CLASS.TREASURY_ACTION:
        return 'Requires independent treasury balance verification and recipient identity check';
      case RISK_CLASS.CUSTOM_GENERIC_FUNCTION:
        return target.validatorCanisterId
          ? `Validator canister ${target.validatorCanisterId}::${target.validatorMethod ?? 'validate'} must accept the payload before SNS executes`
          : 'Generic function validator not identified — execution dependency unclear';
      case RISK_CLASS.GOVERNANCE_RULE_CHANGE:
        return 'Requires review of parameter ranges and downstream behavioral effect on neuron voting';
      default:
        return null;
    }
  }

  get buildCount() { return this._buildCount; }
}

export default EffectPathEngine;
