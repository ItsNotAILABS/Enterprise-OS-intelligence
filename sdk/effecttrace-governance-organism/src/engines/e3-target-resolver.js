/**
 * E3 — Target Resolver Engine
 *
 * TRACE layer: identifies the specific canister, method, parameter, treasury
 * account, or asset that the proposal's payload targets.
 *
 * The resolver builds a TargetProfile that feeds into the Effect Path Engine (E4).
 * It checks known canister registries (NNS, SNS governance, known system canisters)
 * and resolves SNS generic function registrations to their validator/target pairs.
 *
 * Everything it cannot resolve is explicitly marked unknown — never assumed.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { AFFECTED_SYSTEM, RISK_CLASS } from '../types.js';

// Known NNS/ICP system canister IDs (principal → name)
const KNOWN_SYSTEM_CANISTERS = Object.freeze({
  'rrkah-fqaaa-aaaaa-aaaaq-cai': 'NNS Governance',
  'r7inp-6aaaa-aaaaa-aaabq-cai': 'NNS Ledger',
  'ryjl3-tyaaa-aaaaa-aaaba-cai': 'ICP Ledger',
  'rdmx6-jaaaa-aaaaa-aaadq-cai': 'NNS Root',
  'rno2w-sqaaa-aaaaa-aaacq-cai': 'NNS SNS-WASM',
  'rkp4c-7iaaa-aaaaa-aaaca-cai': 'NNS Registry',
  'qjdve-lqaaa-aaaaa-aaaeq-cai': 'NNS CMC (Cycles Minting)',
  'aaaaa-aa':                    'Management Canister',
  '4zv2l-3aaaa-aaaak-qae4a-cai': 'NNS Archive',
  // SNS framework canisters (deployed by NNS SNS-WASM)
  'sns-governance': 'SNS Governance (generic)',
  'sns-root':       'SNS Root (generic)',
  'sns-ledger':     'SNS Ledger (generic)',
  'sns-swap':       'SNS Swap (generic)',
});

// ---------------------------------------------------------------------------
// TargetResolverEngine
// ---------------------------------------------------------------------------

export class TargetResolverEngine {
  constructor() {
    this._genericFunctionRegistry = new Map();  // SNS generic function ID → registration
    this._resolveCount = 0;
  }

  /**
   * Register a known SNS generic nervous system function.
   * Must be done when an AddGenericNervousSystemFunction proposal is adopted,
   * so the resolver knows where ExecuteGenericNervousSystemFunction goes.
   *
   * @param {string|number} functionId
   * @param {{ name, targetCanisterId, targetMethod, validatorCanisterId, validatorMethod }} registration
   */
  registerGenericFunction(functionId, registration) {
    this._genericFunctionRegistry.set(String(functionId), { ...registration });
    return this;
  }

  /**
   * Resolve a proposal's target from parsed payload data.
   *
   * @param {object} parsed - Result from PayloadParserEngine.parse()
   * @param {import('../types.js').ProposalRecord} proposal
   * @returns {TargetProfile}
   */
  resolve(parsed, proposal) {
    this._resolveCount++;
    const { actionType, parsed: data, affectedSystem, riskClassHint } = parsed;

    // SNS generic function — resolve via registration
    if (actionType === 'ExecuteGenericNervousSystemFunction' && data?.functionId) {
      const reg = this._genericFunctionRegistry.get(String(data.functionId));
      if (reg) {
        return {
          canisterId:         reg.targetCanisterId,
          canisterName:       this._knownName(reg.targetCanisterId),
          method:             reg.targetMethod,
          validatorCanisterId: reg.validatorCanisterId,
          validatorMethod:     reg.validatorMethod,
          functionId:         data.functionId,
          payloadHex:         data.payloadHex ?? null,
          affectedSystem:     AFFECTED_SYSTEM.SNS_DAPP_CANISTER,
          riskClass:          riskClassHint ?? RISK_CLASS.CUSTOM_GENERIC_FUNCTION,
          resolved:           true,
          notes: [`Generic function ${data.functionId}: ${reg.name ?? 'registered'}`],
        };
      }
      return {
        canisterId:         null,
        canisterName:       null,
        method:             null,
        affectedSystem:     AFFECTED_SYSTEM.UNKNOWN,
        riskClass:          RISK_CLASS.CUSTOM_GENERIC_FUNCTION,
        functionId:         data.functionId,
        resolved:           false,
        notes: [`Generic function ${data.functionId} not in registry — manual review required`],
      };
    }

    // Direct canister upgrade
    if (data?.canisterId) {
      return {
        canisterId:   data.canisterId,
        canisterName: this._knownName(data.canisterId),
        method:       this._inferMethod(actionType),
        wasmHash:     data.wasmHash ?? null,
        affectedSystem,
        riskClass:    riskClassHint ?? RISK_CLASS.UNKNOWN,
        resolved:     true,
        notes: [],
      };
    }

    // Treasury transfer
    if (data?.toAccount) {
      return {
        canisterId:   this._ledgerForDAOType(proposal.daoType),
        canisterName: proposal.daoType === 'NNS' ? 'ICP Ledger' : 'SNS Ledger',
        method:       'transfer',
        toAccount:    data.toAccount,
        amount:       data.amount ?? null,
        affectedSystem: AFFECTED_SYSTEM.LEDGER_OR_TREASURY,
        riskClass:    RISK_CLASS.TREASURY_ACTION,
        resolved:     true,
        notes: [],
      };
    }

    // Motion — no direct on-chain target
    if (actionType === 'Motion') {
      return {
        canisterId:   null,
        canisterName: null,
        method:       null,
        affectedSystem: affectedSystem ?? AFFECTED_SYSTEM.NNS,
        riskClass:    RISK_CLASS.MOTION,
        resolved:     true,
        notes: ['Motion proposal: no direct on-chain state change upon adoption'],
      };
    }

    // Fallback — cannot resolve
    return {
      canisterId:    null,
      canisterName:  null,
      method:        null,
      affectedSystem: affectedSystem ?? AFFECTED_SYSTEM.UNKNOWN,
      riskClass:     riskClassHint ?? RISK_CLASS.UNKNOWN,
      resolved:      false,
      notes: [`Cannot resolve target for action type: ${actionType} — manual review required`],
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _knownName(canisterId) {
    return KNOWN_SYSTEM_CANISTERS[canisterId] ?? null;
  }

  _inferMethod(actionType) {
    const methodMap = {
      UpgradeNnsCanister:               'install_code',
      UpgradeSnsControlledCanister:     'install_code',
      UpgradeSnsToNextVersion:          'upgrade_to_next_version',
      InstallCode:                      'install_code',
      RegisterDappCanisters:            'register_dapp_canisters',
      DeregisterDappCanisters:          'deregister_dapp_canisters',
      ManageSnsMetadata:                'manage_sns_metadata',
      ManageNervousSystemParameters:    'manage_nervous_system_parameters',
    };
    return methodMap[actionType] ?? null;
  }

  _ledgerForDAOType(daoType) {
    return daoType === 'NNS' ? 'ryjl3-tyaaa-aaaaa-aaaba-cai' : null;
  }

  /** Return the known name map for external inspection. */
  static knownCanisters() { return { ...KNOWN_SYSTEM_CANISTERS }; }

  get resolveCount() { return this._resolveCount; }
}

export default TargetResolverEngine;
