/**
 * Verification Lab Agent — FORGE (internal) / Verification Lab (public)
 *
 * VERIFY layer: generates concrete verification steps and confirms their completion.
 *
 * Primary questions:
 * - What specific canister queries confirm the after-state?
 * - What dashboard views or hash comparisons are required?
 * - Has each step been completed with evidence?
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createAgentFinding, AGENT_ROLE, SEVERITY } from '../types.js';

export class VerificationLabAgent {
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

    const plan = trace.verificationPlan;

    if (!plan || plan.steps.length === 0) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.VERIFICATION_LAB,
        finding: 'No verification plan available. Cannot confirm post-execution state for this proposal.',
        severity: SEVERITY.WARNING,
      }));
      return findings;
    }

    const total = plan.steps.length;
    const completed = plan.steps.filter((s) => s.verified).length;
    const remaining = total - completed;

    // Overall plan status
    findings.push(createAgentFinding({
      agent: AGENT_ROLE.VERIFICATION_LAB,
      finding: `Verification plan: ${completed}/${total} steps completed.`,
      severity: completed === total ? SEVERITY.INFO : SEVERITY.WATCH,
    }));

    // List unverified steps
    if (remaining > 0) {
      const unverifiedSteps = plan.steps
        .filter((s) => !s.verified)
        .map((s) => `- ${s.step} (tool: ${s.tool ?? 'unknown'})`)
        .join('\n');

      findings.push(createAgentFinding({
        agent: AGENT_ROLE.VERIFICATION_LAB,
        finding: `${remaining} unverified step(s) require evidence:\n${unverifiedSteps}`,
        severity: remaining >= total / 2 ? SEVERITY.WARNING : SEVERITY.WATCH,
      }));
    }

    // If executed but no steps completed: critical gap
    const rt = trace.runtimeTruth;
    if (
      rt?.executionObserved &&
      !rt?.afterStateVerified &&
      completed === 0
    ) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.VERIFICATION_LAB,
        finding: 'Proposal has been executed but no verification steps have been completed. After-state is unknown.',
        severity: SEVERITY.CRITICAL,
      }));
    }

    return findings;
  }

  get runCount() { return this._runCount; }
}

export default VerificationLabAgent;
