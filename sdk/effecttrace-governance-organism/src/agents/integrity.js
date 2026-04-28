/**
 * Integrity Agent — ARCHON (internal) / Integrity Check (public)
 *
 * TRACE layer: detects mismatches between proposal claims and observed payload.
 *
 * Primary questions:
 * - Does the title match the action?
 * - Is the payload consistent with the summary?
 * - Are there hidden risks not named in the summary?
 * - Is evidence missing for critical claims?
 *
 * This agent runs before any other finding is published.
 * A finding from Integrity that is never disputed can advance the truth status.
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createAgentFinding, AGENT_ROLE, SEVERITY, RISK_CLASS, RISK_LEVEL } from '../types.js';

export class IntegrityAgent {
  constructor() {
    this._runCount = 0;
  }

  /**
   * Run integrity analysis on a trace.
   *
   * @param {import('../types.js').EffectTraceRecord} trace
   * @param {import('../types.js').ProposalRecord} proposal
   * @param {object} parsed - PayloadParser output
   * @param {object} target - TargetResolver output
   * @returns {import('../types.js').AgentFinding[]}
   */
  run(trace, proposal, parsed, target) {
    this._runCount++;
    const findings = [];

    // 1. Title / action consistency
    const titleLower = (proposal.title ?? '').toLowerCase();
    const summaryLower = (proposal.summary ?? '').toLowerCase();
    const riskClass = trace.riskProfile?.riskClass;

    // Check for treasury keywords in non-treasury proposal
    if (riskClass !== RISK_CLASS.TREASURY_ACTION) {
      const treasuryWords = ['transfer', 'icp', 'token', 'fund', 'treasury', 'payment'];
      const hasTreasurySignal = parsed?.parsed?.amount || parsed?.parsed?.toAccount;
      const titleHasTreasury = treasuryWords.some((w) => titleLower.includes(w));
      if (hasTreasurySignal && !titleHasTreasury) {
        findings.push(createAgentFinding({
          agent: AGENT_ROLE.INTEGRITY,
          finding: 'Payload contains treasury transfer fields not mentioned in proposal title. Potential mismatch between stated purpose and execution.',
          severity: SEVERITY.WARNING,
        }));
      }
    }

    // 2. Code upgrade without WASM hash in title/summary
    if (riskClass === RISK_CLASS.CODE_UPGRADE && !target?.wasmHash) {
      const hasHashInText = titleLower.includes('hash') || summaryLower.includes('hash') || summaryLower.includes('sha');
      if (!hasHashInText) {
        findings.push(createAgentFinding({
          agent: AGENT_ROLE.INTEGRITY,
          finding: 'Code upgrade proposal does not reference a WASM hash in the title or summary. Cannot verify the upgrade target without an independent hash comparison.',
          severity: SEVERITY.WARNING,
        }));
      }
    }

    // 3. High-risk class not labeled in title
    if (
      [RISK_LEVEL.HIGH, RISK_LEVEL.CRITICAL].includes(trace.riskProfile?.riskLevel) &&
      !trace.runtimeTruth?.reviewerConfirmed
    ) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: `This proposal is classified as ${trace.riskProfile.riskLevel.toUpperCase()} risk (${RISK_CLASS[riskClass] ?? riskClass}). No reviewer has confirmed the effect path yet.`,
        severity: SEVERITY.CRITICAL,
      }));
    }

    // 4. Parse failure with non-trivial action
    if (!parsed?.parseSuccess && riskClass !== RISK_CLASS.MOTION) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: 'Proposal payload could not be parsed. The actual execution target is unverifiable from the on-chain action data.',
        severity: SEVERITY.WARNING,
      }));
    }

    // 5. Generic function: validator not identified
    if (riskClass === RISK_CLASS.CUSTOM_GENERIC_FUNCTION && !target?.validatorCanisterId) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: 'This is a custom SNS generic function execution. The validator canister has not been registered in the resolver. The execution target and payload cannot be independently verified.',
        severity: SEVERITY.CRITICAL,
      }));
    }

    if (findings.length === 0) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: 'No integrity mismatches detected. Title, payload, and risk classification appear consistent.',
        severity: SEVERITY.INFO,
      }));
    }

    return findings;
  }

  get runCount() { return this._runCount; }
}

export default IntegrityAgent;
