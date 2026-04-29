/**
 * E2 — Payload Parser Engine
 *
 * TRACE layer: parses the proposal action/payload to extract structured data
 * from the raw governance function call arguments.
 *
 * NNS proposal actions carry strongly-typed payloads (e.g. UpgradeNnsCanister
 * carries wasm_module_hash, canister_id, arg). SNS generic proposals carry
 * function_id + payload bytes that target a registered validator/target pair.
 *
 * The parser never claims to fully decode — it extracts what it can and marks
 * the rest as requiring reviewer examination (TRUTH_STATUS.CLAIM_ONLY).
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { AFFECTED_SYSTEM, RISK_CLASS } from '../types.js';

// NNS action type → structured extractor
const NNS_ACTION_EXTRACTORS = {
  UpgradeNnsCanister: (action) => ({
    canisterId:    action.canister_id?.toString() ?? action.canisterId ?? null,
    wasmHash:      action.wasm_module_hash ? bytesToHex(action.wasm_module_hash) : null,
    arg:           action.arg ? bytesToHex(action.arg) : null,
    upgradeMode:   action.mode ?? null,
    affectedSystem: AFFECTED_SYSTEM.PROTOCOL_CANISTER,
    riskClassHint:  RISK_CLASS.CODE_UPGRADE,
  }),

  ExecuteNnsFunction: (action) => ({
    nnsFunctionId: action.nns_function ?? action.function_id ?? null,
    payloadHex:    action.payload ? bytesToHex(action.payload) : null,
    affectedSystem: AFFECTED_SYSTEM.NNS,
    riskClassHint:  inferNNSFunctionRisk(action.nns_function),
  }),

  Motion: (action) => ({
    motionText:    action.motion_text ?? action.summary ?? '',
    affectedSystem: AFFECTED_SYSTEM.NNS,
    riskClassHint:  RISK_CLASS.MOTION,
  }),

  SetDefaultFollowees: (action) => ({
    topic:         action.topic ?? null,
    followees:     action.default_followees ?? [],
    affectedSystem: AFFECTED_SYSTEM.GOVERNANCE_RULE,
    riskClassHint:  RISK_CLASS.GOVERNANCE_RULE_CHANGE,
  }),

  AddOrRemoveNodeProviders: (action) => ({
    change:        action.change ?? null,
    affectedSystem: AFFECTED_SYSTEM.REGISTRY,
    riskClassHint:  RISK_CLASS.REGISTRY_OR_NETWORK_CHANGE,
  }),

  InstallCode: (action) => ({
    canisterId:    action.canister_id?.toString() ?? null,
    wasmHash:      action.wasm_module_hash ? bytesToHex(action.wasm_module_hash) : null,
    affectedSystem: AFFECTED_SYSTEM.PROTOCOL_CANISTER,
    riskClassHint:  RISK_CLASS.CODE_UPGRADE,
  }),
};

// SNS action type → structured extractor
const SNS_ACTION_EXTRACTORS = {
  UpgradeSnsControlledCanister: (action) => ({
    canisterId:    action.canister_id?.toString() ?? null,
    wasmHash:      action.new_canister_wasm?.wasm ? 'wasm_present' : null,
    mode:          action.mode ?? null,
    affectedSystem: AFFECTED_SYSTEM.SNS_DAPP_CANISTER,
    riskClassHint:  RISK_CLASS.CODE_UPGRADE,
  }),

  UpgradeSnsToNextVersion: (_action) => ({
    affectedSystem: AFFECTED_SYSTEM.SNS,
    riskClassHint:  RISK_CLASS.CODE_UPGRADE,
  }),

  TransferSnsTreasuryFunds: (action) => ({
    toAccount:     action.to_principal?.toString() ?? null,
    amount:        action.amount_e8s ? Number(action.amount_e8s) / 1e8 : null,
    memo:          action.memo ?? null,
    affectedSystem: AFFECTED_SYSTEM.LEDGER_OR_TREASURY,
    riskClassHint:  RISK_CLASS.TREASURY_ACTION,
  }),

  MintSnsTokens: (action) => ({
    toAccount:     action.to_principal?.toString() ?? null,
    amount:        action.amount_e8s ? Number(action.amount_e8s) / 1e8 : null,
    affectedSystem: AFFECTED_SYSTEM.LEDGER_OR_TREASURY,
    riskClassHint:  RISK_CLASS.TREASURY_ACTION,
  }),

  RegisterDappCanisters: (action) => ({
    canisterIds:   (action.canister_ids ?? []).map((id) => id.toString()),
    affectedSystem: AFFECTED_SYSTEM.SNS_DAPP_CANISTER,
    riskClassHint:  RISK_CLASS.CANISTER_CONTROL_CHANGE,
  }),

  DeregisterDappCanisters: (action) => ({
    canisterIds:   (action.canister_ids ?? []).map((id) => id.toString()),
    affectedSystem: AFFECTED_SYSTEM.SNS_DAPP_CANISTER,
    riskClassHint:  RISK_CLASS.CANISTER_CONTROL_CHANGE,
  }),

  ExecuteGenericNervousSystemFunction: (action) => ({
    functionId:    action.function_id ?? null,
    payloadHex:    action.payload ? bytesToHex(action.payload) : null,
    affectedSystem: AFFECTED_SYSTEM.UNKNOWN,
    riskClassHint:  RISK_CLASS.CUSTOM_GENERIC_FUNCTION,
  }),

  AddGenericNervousSystemFunction: (action) => ({
    functionId:       action.id ?? null,
    functionName:     action.name ?? null,
    validatorCanister: action.validator_canister_id?.toString() ?? null,
    validatorMethod:   action.validator_method_name ?? null,
    targetCanister:    action.target_canister_id?.toString() ?? null,
    targetMethod:      action.target_method_name ?? null,
    affectedSystem: AFFECTED_SYSTEM.SNS,
    riskClassHint:  RISK_CLASS.GOVERNANCE_RULE_CHANGE,
  }),

  ManageSnsMetadata: (action) => ({
    name:          action.name ?? null,
    description:   action.description ?? null,
    logo:          action.logo ? '[logo_present]' : null,
    affectedSystem: AFFECTED_SYSTEM.GOVERNANCE_RULE,
    riskClassHint:  RISK_CLASS.GOVERNANCE_RULE_CHANGE,
  }),

  ManageNervousSystemParameters: (action) => ({
    parameterKeys: Object.keys(action).filter((k) => action[k] !== null),
    affectedSystem: AFFECTED_SYSTEM.SNS,
    riskClassHint:  RISK_CLASS.PARAMETER_CHANGE,
  }),

  Motion: (action) => ({
    motionText:    action.motion_text ?? '',
    affectedSystem: AFFECTED_SYSTEM.SNS,
    riskClassHint:  RISK_CLASS.MOTION,
  }),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bytesToHex(bytes) {
  if (!bytes) return null;
  if (typeof bytes === 'string') return bytes;
  if (Array.isArray(bytes)) return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return String(bytes);
}

function inferNNSFunctionRisk(id) {
  if (!id) return RISK_CLASS.UNKNOWN;
  // NNS function IDs (public knowledge): 1=CreateSubnet, 2=AddNodeToSubnet,
  // 4=NnsRootUpgrade, 6=BlessReplicaVersion, 7=RecoverSubnet, 8=UpdateSubnetConfig,
  // 11=AddNodesToSubnet, 12=UpgradeNssCanister, etc.
  const treasuryFns = [5, 14, 48];      // ICP/cycle treasury operations
  const upgradeFns  = [4, 6, 12, 38, 39, 40, 41, 42, 43];
  const registryFns = [1, 2, 7, 8, 11, 13, 15, 16, 17, 18, 19];
  const n = Number(id);
  if (treasuryFns.includes(n))  return RISK_CLASS.TREASURY_ACTION;
  if (upgradeFns.includes(n))   return RISK_CLASS.CODE_UPGRADE;
  if (registryFns.includes(n))  return RISK_CLASS.REGISTRY_OR_NETWORK_CHANGE;
  return RISK_CLASS.UNKNOWN;
}

// ---------------------------------------------------------------------------
// PayloadParserEngine
// ---------------------------------------------------------------------------

export class PayloadParserEngine {
  constructor() {
    this._parseCount = 0;
  }

  /**
   * Parse a proposal's action/payload into structured field data.
   *
   * @param {import('../types.js').ProposalRecord} proposal
   * @returns {{ actionType, parsed, affectedSystem, riskClassHint, parseSuccess, notes }}
   */
  parse(proposal) {
    const { daoType, actionType, rawPayload } = proposal;
    this._parseCount++;

    let actionData = {};
    try {
      actionData = rawPayload ? JSON.parse(rawPayload) : {};
      // If the raw payload is itself wrapped in an action key, unwrap it
      if (actionType && actionData[actionType]) {
        actionData = actionData[actionType];
      }
    } catch {
      return {
        actionType,
        parsed: null,
        affectedSystem: AFFECTED_SYSTEM.UNKNOWN,
        riskClassHint: RISK_CLASS.UNKNOWN,
        parseSuccess: false,
        notes: ['Payload could not be parsed as JSON — manual review required'],
      };
    }

    const extractors = daoType === 'NNS' ? NNS_ACTION_EXTRACTORS : SNS_ACTION_EXTRACTORS;
    const extractor = extractors[actionType];

    if (!extractor) {
      return {
        actionType,
        parsed: actionData,
        affectedSystem: AFFECTED_SYSTEM.UNKNOWN,
        riskClassHint: RISK_CLASS.UNKNOWN,
        parseSuccess: false,
        notes: [`No extractor for action type: ${actionType}`],
      };
    }

    try {
      const parsed = extractor(actionData);
      const { affectedSystem, riskClassHint, ...rest } = parsed;
      return {
        actionType,
        parsed: rest,
        affectedSystem,
        riskClassHint,
        parseSuccess: true,
        notes: [],
      };
    } catch (err) {
      return {
        actionType,
        parsed: actionData,
        affectedSystem: AFFECTED_SYSTEM.UNKNOWN,
        riskClassHint: RISK_CLASS.UNKNOWN,
        parseSuccess: false,
        notes: [`Extractor error: ${err.message}`],
      };
    }
  }

  get parseCount() { return this._parseCount; }
}

export default PayloadParserEngine;
