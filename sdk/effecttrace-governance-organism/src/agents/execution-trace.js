/**
 * Execution Trace Agent — VECTOR (internal) / Execution Trace (public)
 *
 * TRACE layer: maps the full execution path from proposal action to on-chain state.
 *
 * Primary questions:
 * - Which canister receives the execution call?
 * - Which method is invoked?
 * - What payload does it receive?
 * - What is the before-state?
 * - What is the expected after-state?
 * - Was there a validator that ran first?
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createAgentFinding, AGENT_ROLE, SEVERITY, AFFECTED_SYSTEM } from '../types.js';

export class ExecutionTraceAgent {
  constructor() {
    this._runCount = 0;
  }

  /**
   * @param {import('../types.js').EffectTraceRecord} trace
   * @param {import('../types.js').ProposalRecord} proposal
   * @param {object} target - TargetResolver output
   * @returns {import('../types.js').AgentFinding[]}
   */
  run(trace, proposal, target) {
    this._runCount++;
    const findings = [];
    const ep = trace.effectPath;

    // Execution chain summary
    if (target?.resolved && ep) {
      const chain = [
        proposal.daoType === 'NNS' ? 'NNS Governance' : `SNS Governance (${proposal.snsRootCanisterId ?? 'unknown'})`,
        ep.targetCanisterId ? `${ep.targetCanisterId} (${ep.targetMethod ?? 'method unknown'})` : null,
      ].filter(Boolean);

      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: `Execution chain: ${chain.join(' → ')}.\n` +
          `Affected state: ${ep.affectedState}\n` +
          `Expected after: ${ep.expectedAfterState}` +
          (target.wasmHash ? `\nWASM hash: ${target.wasmHash.slice(0, 32)}...` : ''),
        severity: SEVERITY.INFO,
      }));
    }

    // Unresolved target
    if (!target?.resolved) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: 'Execution chain INCOMPLETE. The target canister or method could not be resolved from the proposal payload. Manual trace required.',
        severity: SEVERITY.WARNING,
      }));
    }

    // SNS generic: validator chain
    if (target?.validatorCanisterId) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: `Validator chain: SNS governance → validate at ${target.validatorCanisterId}::${target.validatorMethod ?? 'validate'} → if accepted → ${target.canisterId ?? 'target'}::${target.method ?? 'method'}.`,
        severity: SEVERITY.WATCH,
      }));
    }

    // No validator for generic function
    if (ep?.affectedSystem === AFFECTED_SYSTEM.SNS_DAPP_CANISTER && !target?.validatorCanisterId && target?.functionId) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: `Generic function ${target.functionId} has no registered validator in the resolver. Execution path cannot be traced to target method.`,
        severity: SEVERITY.CRITICAL,
      }));
    }

    // Execution trigger description
    if (ep?.executionTrigger) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: `Execution trigger: ${ep.executionTrigger}`,
        severity: SEVERITY.INFO,
      }));
    }

    // Dependency
    if (ep?.executionDependency) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: `Pre-execution dependency: ${ep.executionDependency}`,
        severity: SEVERITY.WATCH,
      }));
    }

    return findings;
  }

  get runCount() { return this._runCount; }
}

export default ExecutionTraceAgent;
