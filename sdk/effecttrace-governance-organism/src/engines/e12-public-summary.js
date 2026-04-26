/**
 * E12 — Public Summary Engine
 *
 * TRACE · VERIFY · REMEMBER → plain language.
 *
 * Converts the internal EffectTraceRecord into clean, forum-safe language.
 *
 * Rules:
 * - No internal doctrine names (no ARCHON, VECTOR, LUMEN, FORGE, ORO, MERIDIAN)
 * - No adopt/reject recommendation
 * - No hype language
 * - Every claim labeled with its truth status
 * - Risk class and level stated plainly
 * - Open questions listed explicitly
 * - Unverified items not presented as facts
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { TRUTH_STATUS, RISK_CLASS, RISK_LEVEL, SEVERITY } from '../types.js';

const TRUTH_LABELS = {
  [TRUTH_STATUS.CLAIM_ONLY]:            '⚠️ Claim only — not yet verified',
  [TRUTH_STATUS.PAYLOAD_IDENTIFIED]:    '🔍 Target identified from payload',
  [TRUTH_STATUS.REVIEW_SUPPORTED]:      '✅ Review evidence attached',
  [TRUTH_STATUS.EXECUTION_PENDING]:     '⏳ Adopted — awaiting execution',
  [TRUTH_STATUS.EXECUTED_NOT_VERIFIED]: '🟡 Executed — after-state not checked',
  [TRUTH_STATUS.VERIFIED_AFTER_STATE]:  '✅ Executed and after-state verified',
  [TRUTH_STATUS.DISPUTED]:              '⚠️ Disputed — conflicting findings',
  [TRUTH_STATUS.UNKNOWN]:               '❓ Insufficient data',
};

const RISK_LEVEL_ICONS = {
  [RISK_LEVEL.LOW]:      '🟢',
  [RISK_LEVEL.MEDIUM]:   '🟡',
  [RISK_LEVEL.HIGH]:     '🔴',
  [RISK_LEVEL.CRITICAL]: '🚨',
  [RISK_LEVEL.UNKNOWN]:  '❓',
};

const RISK_CLASS_PLAIN = {
  [RISK_CLASS.MOTION]:                  'Motion (no direct on-chain effect)',
  [RISK_CLASS.PARAMETER_CHANGE]:        'Parameter change',
  [RISK_CLASS.CODE_UPGRADE]:            'Code upgrade',
  [RISK_CLASS.TREASURY_ACTION]:         'Treasury action',
  [RISK_CLASS.GOVERNANCE_RULE_CHANGE]:  'Governance rule change',
  [RISK_CLASS.CANISTER_CONTROL_CHANGE]: 'Canister control change',
  [RISK_CLASS.FRONTEND_ASSET_CHANGE]:   'Frontend asset change',
  [RISK_CLASS.REGISTRY_OR_NETWORK_CHANGE]: 'Network registry change',
  [RISK_CLASS.CUSTOM_GENERIC_FUNCTION]: 'Custom governance function',
  [RISK_CLASS.SYSTEMIC_OR_EMERGENCY]:   'Systemic / emergency action',
  [RISK_CLASS.UNKNOWN]:                 'Unknown',
};

export class PublicSummaryEngine {
  constructor() {
    this._generateCount = 0;
  }

  /**
   * Generate a public-safe plain-language summary of an EffectTraceRecord.
   *
   * @param {import('../types.js').EffectTraceRecord} trace
   * @param {import('../types.js').ProposalRecord} proposal
   * @returns {{ headline, body, markdownFull, jsonExport }}
   */
  generate(trace, proposal) {
    this._generateCount++;

    const headline = this._headline(trace, proposal);
    const body = this._body(trace, proposal);
    const markdownFull = this._markdownFull(trace, proposal, headline, body);
    const jsonExport = this._jsonExport(trace, proposal);

    return { headline, body, markdownFull, jsonExport };
  }

  _headline(trace, proposal) {
    const icon = RISK_LEVEL_ICONS[trace.riskProfile?.riskLevel] ?? '❓';
    const riskClass = RISK_CLASS_PLAIN[trace.riskProfile?.riskClass] ?? 'Unknown';
    return `${icon} ${proposal.daoType} Proposal: ${proposal.title || proposal.proposalId} — ${riskClass}`;
  }

  _body(trace, proposal) {
    const sections = [];

    // What is being proposed
    sections.push(`**What is being proposed:**\n${proposal.summary || 'No summary available.'}`);

    // Effect path
    const ep = trace.effectPath;
    if (ep) {
      sections.push(`**What it changes:**\n${ep.affectedState || 'Not determined.'}` +
        (ep.expectedAfterState ? `\n\nExpected outcome: ${ep.expectedAfterState}` : ''));

      if (ep.targetCanisterId) {
        const name = ep.targetMethod
          ? `${ep.targetCanisterId} via \`${ep.targetMethod}\``
          : ep.targetCanisterId;
        sections.push(`**Execution target:** ${name}`);
      }

      if (ep.executionDependency) {
        sections.push(`**Execution dependency:** ${ep.executionDependency}`);
      }
    }

    // Risk
    const rp = trace.riskProfile;
    if (rp) {
      const icon = RISK_LEVEL_ICONS[rp.riskLevel] ?? '❓';
      sections.push(`**Risk:** ${icon} ${rp.riskLevel?.toUpperCase()} — ${RISK_CLASS_PLAIN[rp.riskClass] ?? rp.riskClass}\n${rp.explanation || ''}`);
      if (rp.openQuestions?.length > 0) {
        sections.push(`**Open questions:**\n${rp.openQuestions.map((q) => `- ${q}`).join('\n')}`);
      }
    }

    // Truth status
    const rt = trace.runtimeTruth;
    if (rt) {
      const label = TRUTH_LABELS[rt.truthStatus] ?? '❓ Unknown';
      sections.push(`**Verification status:** ${label}`);
      if (rt.unresolvedQuestions?.length > 0) {
        sections.push(`**Unresolved:**\n${rt.unresolvedQuestions.map((q) => `- ${q}`).join('\n')}`);
      }
    }

    // Agent findings (public-safe language only — no internal names)
    const publicFindings = (trace.agentFindings ?? [])
      .filter((f) => f.severity !== SEVERITY.INFO)
      .slice(0, 5);
    if (publicFindings.length > 0) {
      const findingLines = publicFindings.map((f) => {
        const icon = { watch: '👁', warning: '⚠️', critical: '🚨' }[f.severity] ?? '';
        const agentLabel = {
          integrity: 'Integrity Check',
          execution_trace: 'Execution Trace',
          context_map: 'Context Map',
          verification_lab: 'Verification Lab',
          risk: 'Risk Analysis',
          memory: 'Governance Memory',
        }[f.agent] ?? f.agent;
        return `${icon} **${agentLabel}:** ${f.finding}`;
      });
      sections.push(`**Analysis findings:**\n${findingLines.join('\n')}`);
    }

    // Memory links
    const links = trace.memoryLinks ?? [];
    if (links.length > 0) {
      sections.push(`**Related governance history:** ${links.length} related proposal(s) in governance memory. See memory thread for precedent.`);
    }

    // Disclaimer
    sections.push('---\n*EffectTrace traces what proposals change. It does not recommend adopt or reject. No DFINITY endorsement. Not a substitute for independent review.*');

    return sections.join('\n\n');
  }

  _markdownFull(trace, proposal, headline, body) {
    const date = new Date().toISOString().slice(0, 10);
    return [
      `# ${headline}`,
      '',
      `> Trace ID: \`${trace.traceId}\` | Proposal: \`${proposal.proposalId}\` | Status: \`${proposal.status}\` | Generated: ${date}`,
      '',
      body,
      '',
      `---`,
      `*EffectTrace — Governance Consequence Intelligence for ICP | [effecttrace.io](https://effecttrace.io)*`,
    ].join('\n');
  }

  _jsonExport(trace, proposal) {
    return {
      traceId: trace.traceId,
      proposalId: proposal.proposalId,
      daoType: proposal.daoType,
      title: proposal.title,
      status: proposal.status,
      truthStatus: trace.runtimeTruth?.truthStatus,
      riskClass: trace.riskProfile?.riskClass,
      riskLevel: trace.riskProfile?.riskLevel,
      affectedSystem: trace.effectPath?.affectedSystem,
      targetCanisterId: trace.effectPath?.targetCanisterId,
      targetMethod: trace.effectPath?.targetMethod,
      confidence: trace.confidence,
      generatedAt: new Date().toISOString(),
    };
  }

  get generateCount() { return this._generateCount; }
}

export default PublicSummaryEngine;
