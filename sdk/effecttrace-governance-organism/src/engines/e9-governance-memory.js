/**
 * E9 — Governance Memory Engine
 *
 * REMEMBER layer: the STIGMERGY pheromone trail for governance.
 *
 * This is where EffectTrace stops being a tool and becomes intelligence.
 * Every proposal is a deposit in the shared field. The field accumulates
 * the governance history of the network — proposal by proposal.
 *
 * STIGMERGY (Paper XX): the environment is the memory. Agents (reviewers,
 * voters) don't need to remember prior proposals — they read the field.
 * The field tells them what has been tried, what succeeded, what was reversed,
 * and what risks keep appearing.
 *
 * The NEXORIS pheromone mechanics from the MERIDIAN SDK are directly used here:
 * - Each proposal class deposits pheromone into the field
 * - Pheromone evaporates at rate ρ (old history fades)
 * - Diffusion connects related categories
 * - The gradient reveals which categories have accumulated the most governance activity
 *
 * EffectTrace Governance Intelligence — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createGovernanceMemoryLink, RISK_CLASS } from '../types.js';

const PHI     = 1.6180339887;
const PHI_INV = 1 / PHI;

// Evaporation rate: governance history fades slowly (lower than operational stigmergy)
const DEFAULT_RHO = 0.01;
// Diffusion: governance topics are closely coupled
const DEFAULT_D   = 0.05;

// ---------------------------------------------------------------------------
// GovernanceMemoryEngine
// ---------------------------------------------------------------------------

export class GovernanceMemoryEngine {
  constructor({ evaporationRate = DEFAULT_RHO, diffusionRate = DEFAULT_D } = {}) {
    this.rho = evaporationRate;
    this.D = diffusionRate;

    this._proposals = new Map();        // proposalId → { riskClass, status, title, executedAt, ... }
    this._links = new Map();            // linkId → GovernanceMemoryLink
    this._linksByProposal = new Map();  // proposalId → [linkId]
    this._pheromoneField = new Map();   // riskClass → concentration
    this._postExecutionChecks = new Map(); // proposalId → [PostExecutionCheck]
    this._tickCount = 0;
    this._chrono = null;
  }

  setChrono(chrono) { this._chrono = chrono; return this; }

  // ── Proposal registration ─────────────────────────────────────────────────

  /**
   * Register a proposal in the memory graph.
   * Deposits pheromone proportional to the risk level (STIGMERGY).
   *
   * @param {import('../types.js').ProposalRecord} proposal
   * @param {import('../types.js').RiskProfile} riskProfile
   */
  register(proposal, riskProfile) {
    const quality = this._riskLevelToQuality(riskProfile.riskLevel);

    this._proposals.set(proposal.proposalId, {
      proposalId: proposal.proposalId,
      title: proposal.title,
      status: proposal.status,
      riskClass: riskProfile.riskClass,
      riskLevel: riskProfile.riskLevel,
      registeredAt: new Date().toISOString(),
      executedAt: proposal.executedAt ?? null,
    });

    // STIGMERGY: deposit governance pheromone for this risk class
    this._deposit(riskProfile.riskClass, quality);

    return this;
  }

  // ── Proposal linking ──────────────────────────────────────────────────────

  /**
   * Link two proposals in the governance memory graph.
   *
   * @param {string} sourceProposalId
   * @param {string} targetProposalId
   * @param {string} linkType - 'related' | 'reversed' | 'extended' | 'contradicts' | 'depends_on' | 'precedes'
   * @param {string} [description]
   * @returns {import('../types.js').GovernanceMemoryLink}
   */
  link(sourceProposalId, targetProposalId, linkType, description = '') {
    const memLink = createGovernanceMemoryLink({
      sourceProposalId: String(sourceProposalId),
      targetProposalId: String(targetProposalId),
      linkType,
      description,
    });

    this._links.set(memLink.linkId, memLink);

    // Index both directions
    for (const id of [sourceProposalId, targetProposalId]) {
      const existing = this._linksByProposal.get(String(id)) ?? [];
      existing.push(memLink.linkId);
      this._linksByProposal.set(String(id), existing);
    }

    if (this._chrono) {
      this._chrono.append({
        type: 'E9_MEMORY_LINK',
        sourceProposalId,
        targetProposalId,
        linkType,
      });
    }

    return memLink;
  }

  // ── Related proposal search ───────────────────────────────────────────────

  /**
   * Find proposals related to a given one, ordered by pheromone concentration
   * (proposals in the same risk class that have accumulated more field activity
   * are more likely to be relevant precedents).
   *
   * @param {string} proposalId
   * @param {string} [riskClass] - narrow search by risk class
   * @returns {{ proposals: object[], linkCount: number, fieldConcentration: number }}
   */
  findRelated(proposalId, riskClass = null) {
    const pid = String(proposalId);

    // Direct links
    const linkIds = this._linksByProposal.get(pid) ?? [];
    const directlyLinked = linkIds
      .map((lid) => this._links.get(lid))
      .filter(Boolean)
      .map((l) => {
        const otherId = l.sourceProposalId === pid ? l.targetProposalId : l.sourceProposalId;
        return { ...this._proposals.get(otherId), linkType: l.linkType };
      })
      .filter(Boolean);

    // Same risk class (pheromone gradient — STIGMERGY)
    const proposal = this._proposals.get(pid);
    const targetClass = riskClass ?? proposal?.riskClass;
    const sameClass = targetClass
      ? [...this._proposals.values()]
          .filter((p) => p.proposalId !== pid && p.riskClass === targetClass)
          .sort((a, b) =>
            (this._pheromoneField.get(b.riskClass) ?? 0) - (this._pheromoneField.get(a.riskClass) ?? 0),
          )
          .slice(0, 10)
      : [];

    // Merge (direct links first, then field-based)
    const seen = new Set([pid]);
    const merged = [];
    for (const p of [...directlyLinked, ...sameClass]) {
      if (p.proposalId && !seen.has(p.proposalId)) {
        seen.add(p.proposalId);
        merged.push(p);
      }
    }

    return {
      proposals: merged,
      linkCount: directlyLinked.length,
      fieldConcentration: this._pheromoneField.get(targetClass ?? '') ?? 0,
    };
  }

  // ── Post-execution checks ─────────────────────────────────────────────────

  /**
   * Record a post-execution observation (populated by E10).
   */
  addPostExecutionCheck(proposalId, check) {
    const existing = this._postExecutionChecks.get(String(proposalId)) ?? [];
    existing.push({ ...check, checkedAt: new Date().toISOString() });
    this._postExecutionChecks.set(String(proposalId), existing);

    // Reinforce the pheromone field with evidence-quality signal (AURUM φ⁻¹)
    const proposal = this._proposals.get(String(proposalId));
    if (proposal) {
      this._deposit(proposal.riskClass, check.quality ?? PHI_INV);
    }

    return this;
  }

  getPostExecutionChecks(proposalId) {
    return this._postExecutionChecks.get(String(proposalId)) ?? [];
  }

  // ── Field mechanics (STIGMERGY) ───────────────────────────────────────────

  _deposit(riskClass, quality) {
    const current = this._pheromoneField.get(riskClass) ?? 0;
    this._pheromoneField.set(riskClass, current + quality);
  }

  /**
   * Tick the pheromone field: evaporate + diffuse.
   * Call once per governance watch cycle (e.g. hourly or daily).
   */
  tick() {
    this._tickCount++;
    // Evaporate: τ ← τ × (1 − ρ)
    for (const [key, tau] of this._pheromoneField) {
      const next = tau * (1 - this.rho);
      if (next < 1e-6) this._pheromoneField.delete(key);
      else this._pheromoneField.set(key, next);
    }
    // Diffuse: share between adjacent risk classes
    const classes = [...this._pheromoneField.keys()];
    for (let i = 0; i < classes.length - 1; i++) {
      const a = classes[i], b = classes[i + 1];
      const tauA = this._pheromoneField.get(a) ?? 0;
      const tauB = this._pheromoneField.get(b) ?? 0;
      const flow = this.D * (tauA - tauB);
      this._pheromoneField.set(a, Math.max(0, tauA - flow));
      this._pheromoneField.set(b, Math.max(0, tauB + flow));
    }
  }

  // ── Observability ─────────────────────────────────────────────────────────

  /** The governance memory field — what categories have accumulated the most activity. */
  fieldSnapshot() {
    return [...this._pheromoneField.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([riskClass, concentration]) => ({ riskClass, concentration }));
  }

  getMemory(proposalId) {
    const proposal = this._proposals.get(String(proposalId));
    const related = this.findRelated(proposalId);
    const postChecks = this.getPostExecutionChecks(proposalId);
    return { proposal, ...related, postExecutionChecks: postChecks };
  }

  _riskLevelToQuality(level) {
    const map = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0, unknown: 0.3 };
    return map[level] ?? 0.3;
  }

  get proposalCount() { return this._proposals.size; }
  get linkCount()     { return this._links.size; }
  get tickCount()     { return this._tickCount; }
}

export default GovernanceMemoryEngine;
