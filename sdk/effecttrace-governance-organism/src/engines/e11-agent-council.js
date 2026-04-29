/**
 * E11 — Agent Council Engine
 *
 * TRACE · VERIFY · REMEMBER — all three, integrated.
 *
 * Theory: QUORUM (Paper XXI)
 *
 * The Agent Council runs the four internal agents (Integrity, Execution Trace,
 * Context Map, Verification Lab) and uses the COGNOVEX quorum dynamics to
 * produce a collective finding.
 *
 * Each agent is a sovereign cognitive unit that forms conviction independently.
 * They do not talk to each other — they deposit into the shared pheromone field
 * (NEXORIS). Consensus emerges from the field, not from coordination.
 *
 * When enough agents crystallize on a risk assessment, the quorum crystallizes
 * and a council finding is produced without any central authority deciding.
 *
 * Internally: ARCHON (Integrity), VECTOR (Execution), LUMEN (Context), FORGE (Verification)
 * Publicly:   Integrity Check, Execution Trace, Context Map, Verification Lab
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createAgentFinding, AGENT_ROLE, SEVERITY, RISK_LEVEL } from '../types.js';

// ---------------------------------------------------------------------------
// AgentCouncilEngine
// ---------------------------------------------------------------------------

export class AgentCouncilEngine {
  /**
   * @param {object} [options]
   * @param {import('../../../meridian-sovereign-os/src/cognovex.js').CognovexNetwork} [options.cognovex]
   * @param {import('../../../meridian-sovereign-os/src/nexoris.js').NEXORIS} [options.nexoris]
   */
  constructor({ cognovex = null, nexoris = null } = {}) {
    this._cognovex = cognovex;
    this._nexoris  = nexoris;
    this._findings = new Map();   // proposalId → [AgentFinding]
    this._runCount = 0;
  }

  setChrono(chrono) { this._chrono = chrono; return this; }

  // ── Council run ───────────────────────────────────────────────────────────

  /**
   * Run all four agents against a trace and produce a collective finding set.
   *
   * @param {import('../types.js').EffectTraceRecord} trace
   * @param {import('../types.js').ProposalRecord}    proposal
   * @param {object}  target     - TargetResolver output
   * @param {object}  parsed     - PayloadParser output
   * @returns {{ findings: AgentFinding[], councilStatus: string, quorum: object|null }}
   */
  run(trace, proposal, target, parsed) {
    this._runCount++;

    const findings = [
      this._runIntegrity(trace, proposal, target, parsed),
      this._runExecutionTrace(trace, proposal, target),
      this._runContextMap(trace, proposal),
      this._runVerificationLab(trace, target),
    ].flat();

    // Record findings
    const existing = this._findings.get(proposal.proposalId) ?? [];
    const updated = [...existing, ...findings];
    this._findings.set(proposal.proposalId, updated);

    // COGNOVEX quorum — each agent's severity deposits as commitment
    let quorum = null;
    if (this._cognovex) {
      for (const finding of findings) {
        const strength = this._severityToStrength(finding.severity);
        const unit = this._cognovex.unit(`council-${finding.agent}`);
        if (unit) {
          unit.observe(finding.severity === SEVERITY.CRITICAL ? 'CRITICAL_RISK' : 'REVIEW_NEEDED', strength);
        }
      }
      quorum = this._cognovex.tick();
    }

    // NEXORIS pheromone deposit for routing (STIGMERGY)
    if (this._nexoris) {
      const criticalCount = findings.filter((f) => f.severity === SEVERITY.CRITICAL).length;
      this._nexoris.reinforce(`EFFECTTRACE:${trace.riskProfile?.riskClass ?? 'unknown'}`, criticalCount / 4);
    }

    const councilStatus = this._deriveCouncilStatus(findings, quorum);

    if (this._chrono) {
      this._chrono.append({
        type: 'E11_COUNCIL_RUN',
        proposalId: proposal.proposalId,
        traceId: trace.traceId,
        findingCount: findings.length,
        criticalCount: findings.filter((f) => f.severity === SEVERITY.CRITICAL).length,
        councilStatus,
        quorumCrystallized: quorum?.crystallized ?? false,
      });
    }

    return { findings, councilStatus, quorum };
  }

  // ── Agent: Integrity (ARCHON / TRACE) ─────────────────────────────────────

  _runIntegrity(trace, proposal, target, parsed) {
    const findings = [];

    // Check 1: proposal title vs payload match
    if (trace.effectPath?.affectedSystem === 'UNKNOWN') {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: 'Affected system not identified. The proposal title does not map to a known on-chain target.',
        severity: SEVERITY.WARNING,
        evidence: [],
      }));
    }

    // Check 2: payload parse failure
    if (!parsed?.parseSuccess) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: 'Proposal payload could not be parsed. Cannot confirm the execution target matches the title.',
        severity: SEVERITY.WARNING,
        evidence: [],
      }));
    }

    // Check 3: missing evidence for non-motion
    if (
      trace.riskProfile?.riskClass !== 'motion' &&
      (trace.agentFindings ?? []).length === 0
    ) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: 'No external evidence sources attached. The trace relies on claim text only.',
        severity: SEVERITY.WATCH,
        evidence: [],
      }));
    }

    // Check 4: critical risk, no reviewer
    if (
      [RISK_LEVEL.HIGH, RISK_LEVEL.CRITICAL].includes(trace.riskProfile?.riskLevel) &&
      !trace.runtimeTruth?.reviewerConfirmed
    ) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: `${trace.riskProfile.riskLevel.toUpperCase()} risk proposal with no confirmed reviewer. Integrity cannot be established.`,
        severity: SEVERITY.CRITICAL,
        evidence: [],
      }));
    }

    if (findings.length === 0) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.INTEGRITY,
        finding: 'No integrity flags at this time. Continue monitoring.',
        severity: SEVERITY.INFO,
      }));
    }

    return findings;
  }

  // ── Agent: Execution Trace (VECTOR / TRACE) ────────────────────────────────

  _runExecutionTrace(trace, proposal, target) {
    const findings = [];

    if (!target?.resolved) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: 'Execution target could not be resolved. The canister, method, or payload destination is unidentified.',
        severity: SEVERITY.WARNING,
      }));
    } else {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: `Execution target identified: ${target.canisterId ?? 'unknown'} (${target.canisterName ?? 'unknown name'}) via ${target.method ?? 'unknown method'}.` +
          (target.wasmHash ? ` WASM hash: ${target.wasmHash.slice(0, 16)}...` : ''),
        severity: SEVERITY.INFO,
      }));
    }

    // SNS generic function: validator chain
    if (target?.validatorCanisterId) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: `SNS generic function: validator at ${target.validatorCanisterId}::${target.validatorMethod ?? 'validate'} must accept payload before execution.`,
        severity: SEVERITY.WATCH,
      }));
    }

    // Treasury: flag for independent verification
    if (target?.amount) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.EXECUTION_TRACE,
        finding: `Treasury action: ${target.amount} tokens to ${target.toAccount ?? 'unidentified recipient'}. Independent verification required.`,
        severity: target.amount > 10000 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
      }));
    }

    return findings;
  }

  // ── Agent: Context Map (LUMEN / REMEMBER) ─────────────────────────────────

  _runContextMap(trace, proposal) {
    const findings = [];

    const memLinks = trace.memoryLinks ?? [];
    if (memLinks.length > 0) {
      const reverseLinks = memLinks.filter((l) => l.linkType === 'reversed');
      if (reverseLinks.length > 0) {
        findings.push(createAgentFinding({
          agent: AGENT_ROLE.CONTEXT_MAP,
          finding: `${reverseLinks.length} prior proposal(s) in governance memory were reversed or contradicted by proposals in this area. Check if this proposal repeats or re-reverses a prior governance decision.`,
          severity: SEVERITY.WARNING,
        }));
      }

      findings.push(createAgentFinding({
        agent: AGENT_ROLE.CONTEXT_MAP,
        finding: `${memLinks.length} related proposal(s) found in governance memory. Review memory thread for prior precedent.`,
        severity: SEVERITY.INFO,
      }));
    } else {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.CONTEXT_MAP,
        finding: 'No related proposals found in governance memory. This may be a first-of-kind action in this area.',
        severity: SEVERITY.WATCH,
      }));
    }

    return findings;
  }

  // ── Agent: Verification Lab (FORGE / VERIFY) ──────────────────────────────

  _runVerificationLab(trace, target) {
    const findings = [];

    const plan = trace.verificationPlan;
    if (!plan || plan.steps.length === 0) {
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.VERIFICATION_LAB,
        finding: 'No verification plan generated. Cannot confirm post-execution state.',
        severity: SEVERITY.WARNING,
      }));
    } else {
      const incomplete = plan.steps.filter((s) => !s.verified).length;
      const total = plan.steps.length;
      findings.push(createAgentFinding({
        agent: AGENT_ROLE.VERIFICATION_LAB,
        finding: `Verification plan: ${total - incomplete}/${total} steps completed.` +
          (incomplete > 0 ? ` ${incomplete} step(s) still require evidence.` : ' All steps verified.'),
        severity: incomplete === 0 ? SEVERITY.INFO : SEVERITY.WATCH,
      }));
    }

    return findings;
  }

  // ── Council status ────────────────────────────────────────────────────────

  _deriveCouncilStatus(findings, quorum) {
    if (findings.some((f) => f.severity === SEVERITY.CRITICAL)) {
      return 'CRITICAL_FLAGS';
    }
    if (quorum?.crystallized) {
      return `QUORUM_CRYSTALLIZED:${quorum.option}`;
    }
    if (findings.some((f) => f.severity === SEVERITY.WARNING)) {
      return 'WARNINGS_PRESENT';
    }
    return 'REVIEWED_NO_FLAGS';
  }

  _severityToStrength(severity) {
    const map = {
      [SEVERITY.INFO]: 0.2,
      [SEVERITY.WATCH]: 0.4,
      [SEVERITY.WARNING]: 0.7,
      [SEVERITY.CRITICAL]: 1.0,
    };
    return map[severity] ?? 0.3;
  }

  getFindings(proposalId) {
    return this._findings.get(String(proposalId)) ?? [];
  }

  get runCount() { return this._runCount; }
}

export default AgentCouncilEngine;
