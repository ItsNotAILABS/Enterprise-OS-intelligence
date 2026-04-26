/**
 * CEREBEX — Organizational Brain
 *
 * Theory: QUAESTIO ET ACTIO (Paper VII) + AURUM (Paper XXII)
 *
 * CEREBEX maintains a continuous world model of the organization across
 * 40 analytical categories. Every query and every command advances the model
 * (the Query-as-Execute Theorem, Paper VII).
 *
 * World model updates use the golden ratio learning coefficient φ⁻¹ ≈ 0.618
 * (AURUM, Paper XXII). This is the natural scaling factor for processes that
 * must be consistent across multiple time scales simultaneously — organizational
 * learning happens at the level of individual queries AND quarterly patterns AND
 * multi-year cultural shifts. φ⁻¹ is the only learning rate that is self-similar
 * across all of them.
 *
 * Update rule (Friston Free Energy minimization):
 *   FE = (sensory_input − prior_model)²
 *   Δmodel = φ⁻¹ × ∇FE   (gradient of free energy w.r.t. model belief)
 *
 * Which simplifies to the exponential moving average:
 *   score_new = score_old + φ⁻¹ × (signal − score_old)
 *
 * 40 Categories — all active in parallel on every query. No mode switching.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { PHI_INV } from './nexoris.js';

// ---------------------------------------------------------------------------
// 40 Analytical Categories
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  'SWOT',
  'PORTERS_FIVE_FORCES',
  'PESTLE',
  'JTBD',
  'LEAN_CANVAS',
  'OKR_BUILDER',
  'TAM_SAM_SOM',
  'MOAT_ANALYSIS',
  'FAILURE_MODE_ANALYSIS',
  'FIVE_WHYS',
  'SCENARIO_PLANNING',
  'FERMI_ESTIMATION',
  'LTV_CAC',
  'MENTAL_MODEL_INVERSION',
  'MENTAL_MODEL_SECOND_ORDER',
  'MENTAL_MODEL_OCCAMS_RAZOR',
  'MENTAL_MODEL_PARETO',
  'MENTAL_MODEL_CIRCLE_OF_COMPETENCE',
  'SOCRATIC_CHALLENGE',
  'STEELMANNING',
  'SYNTHESIS',
  'BUILD_MVP_SPEC',
  'UNIT_ECONOMICS',
  'CONTRACT_MANAGEMENT',
  'REVENUE_PLANNING',
  'CRM_UPDATE',
  'HR_WORKFLOW',
  'IT_WORKFLOW',
  'COMPLIANCE_MONITORING',
  'RISK_ASSESSMENT',
  'VENDOR_MANAGEMENT',
  'FINANCIAL_CLOSE',
  'SUPPLY_CHAIN',
  'AUDIT_TRAIL',
  'INCIDENT_RESPONSE',
  'ASSET_MANAGEMENT',
  'ACCESS_CONTROL',
  'EXECUTIVE_SYNTHESIS',
  'SOVEREIGNTY_CHECK',
  'CHRONO_ANCHORING',
];

// Keywords that activate each category
const CATEGORY_SIGNALS = {
  SWOT:                          ['strength', 'weakness', 'opportunity', 'threat', 'swot'],
  PORTERS_FIVE_FORCES:           ['competitive', 'rivalry', 'supplier', 'buyer', 'entrant', 'substitute', 'porter'],
  PESTLE:                        ['political', 'economic', 'social', 'technological', 'legal', 'environmental', 'pestle'],
  JTBD:                          ['job', 'hire', 'outcome', 'progress', 'goal', 'why do', 'jtbd'],
  LEAN_CANVAS:                   ['canvas', 'business model', 'channel', 'segment', 'proposition'],
  OKR_BUILDER:                   ['okr', 'objective', 'key result', 'goal', 'target', 'metric'],
  TAM_SAM_SOM:                   ['market size', 'tam', 'sam', 'som', 'addressable', 'total market'],
  MOAT_ANALYSIS:                 ['moat', 'defensible', 'advantage', 'barrier', 'sustainable'],
  FAILURE_MODE_ANALYSIS:         ['fail', 'failure', 'risk', 'fmea', 'fault', 'break', 'outage'],
  FIVE_WHYS:                     ['why', 'root cause', 'five whys', 'cause', 'reason'],
  SCENARIO_PLANNING:             ['scenario', 'if', 'what if', 'forecast', 'projection', 'future'],
  FERMI_ESTIMATION:              ['estimate', 'how many', 'order of magnitude', 'fermi', 'approximately'],
  LTV_CAC:                       ['ltv', 'cac', 'lifetime value', 'acquisition cost', 'retention', 'churn'],
  MENTAL_MODEL_INVERSION:        ['inversion', 'avoid', 'opposite', 'what not to do'],
  MENTAL_MODEL_SECOND_ORDER:     ['second order', 'downstream', 'consequence', 'effect of the effect'],
  MENTAL_MODEL_OCCAMS_RAZOR:     ['simplest', 'simplify', 'occam', 'parse', 'razor'],
  MENTAL_MODEL_PARETO:           ['pareto', '80/20', 'vital few', 'leverage', 'high impact'],
  MENTAL_MODEL_CIRCLE_OF_COMPETENCE: ['circle of competence', 'know', 'expertise', 'within our'],
  SOCRATIC_CHALLENGE:            ['challenge', 'question', 'assumption', 'socratic', 'interrogate'],
  STEELMANNING:                  ['steelman', 'best case', 'strongest argument', 'charitable'],
  SYNTHESIS:                     ['synthesize', 'combine', 'summary', 'overall', 'across all'],
  BUILD_MVP_SPEC:                ['mvp', 'spec', 'build', 'feature', 'requirements', 'product'],
  UNIT_ECONOMICS:                ['unit economics', 'margin', 'cogs', 'contribution', 'gross margin'],
  CONTRACT_MANAGEMENT:           ['contract', 'agreement', 'signed', 'review', 'clause', 'terms'],
  REVENUE_PLANNING:              ['revenue', 'forecast', 'q1', 'q2', 'q3', 'q4', 'pipeline', 'arr', 'mrr'],
  CRM_UPDATE:                    ['crm', 'salesforce', 'hubspot', 'lead', 'opportunity', 'deal', 'stage'],
  HR_WORKFLOW:                   ['hr', 'workday', 'hire', 'headcount', 'employee', 'payroll', 'adp'],
  IT_WORKFLOW:                   ['it', 'servicenow', 'ticket', 'jira', 'deploy', 'infrastructure', 'incident'],
  COMPLIANCE_MONITORING:         ['compliance', 'audit', 'regulation', 'gdpr', 'sox', 'policy', 'legal'],
  RISK_ASSESSMENT:               ['risk', 'exposure', 'probability', 'impact', 'mitigate', 'hedge'],
  VENDOR_MANAGEMENT:             ['vendor', 'supplier', 'procurement', 'coupa', 'ariba', 'sow', 'rfp'],
  FINANCIAL_CLOSE:               ['close', 'financial close', 'quarter end', 'reconcile', 'journal', 'gl'],
  SUPPLY_CHAIN:                  ['supply chain', 'inventory', 'logistics', 'warehouse', 'fulfillment'],
  AUDIT_TRAIL:                   ['audit', 'log', 'history', 'trace', 'record', 'who changed'],
  INCIDENT_RESPONSE:             ['incident', 'outage', 'breach', 'down', 'alert', 'pagerduty', 'sev'],
  ASSET_MANAGEMENT:              ['asset', 'fixed asset', 'depreciation', 'equipment', 'fleet'],
  ACCESS_CONTROL:                ['access', 'permission', 'role', 'sso', 'identity', 'authentication'],
  EXECUTIVE_SYNTHESIS:           ['executive', 'ceo', 'board', 'summary', 'brief', 'strategic'],
  SOVEREIGNTY_CHECK:             ['sovereign', 'doctrine', 'identity', 'voxis', 'meridian', 'ownership'],
  CHRONO_ANCHORING:              ['log', 'record', 'persist', 'chrono', 'immutable', 'anchor'],
};

// ---------------------------------------------------------------------------
// CEREBEX
// ---------------------------------------------------------------------------

export class CEREBEX {
  /**
   * @param {object} [options]
   * @param {number} [options.learningCoefficient] - φ⁻¹ by default (AURUM)
   */
  constructor({ learningCoefficient = PHI_INV } = {}) {
    this.eta = learningCoefficient;   // φ⁻¹ ≈ 0.618

    // World model: category → belief score [0, 1], initialized to maximum uncertainty
    this._worldModel = new Map(
      CATEGORIES.map((cat) => [cat, 0.5]),
    );

    this._queryCount = 0;
    this._commandCount = 0;
    this._chrono = null;
  }

  /** Inject CHRONO for permanent trail record. */
  setChrono(chrono) { this._chrono = chrono; return this; }

  // ── World model update (φ⁻¹ learning) ────────────────────────────────────

  /**
   * Update belief for a category given a new signal.
   * Implements: score_new = score_old + φ⁻¹ × (signal − score_old)
   *
   * @param {string} category - One of the 40 categories
   * @param {number} signal   - New evidence, 0–1
   */
  update(category, signal) {
    const prior = this._worldModel.get(category) ?? 0.5;
    const updated = prior + this.eta * (signal - prior);
    this._worldModel.set(category, Math.max(0, Math.min(1, updated)));
  }

  // ── Scoring ───────────────────────────────────────────────────────────────

  /**
   * Score an input (query or command) against all 40 categories.
   * Returns categories sorted by activation score descending.
   *
   * Each category gets a relevance signal from keyword matching, then
   * the world model belief is updated (Query-as-Execute: asking trains the system).
   *
   * @param {string} input - Natural language input
   * @returns {Array<{ category: string, score: number }>}
   */
  score(input) {
    const lower = input.toLowerCase();
    const scored = [];

    for (const category of CATEGORIES) {
      const keywords = CATEGORY_SIGNALS[category] ?? [];
      let matchStrength = 0;

      for (const kw of keywords) {
        if (lower.includes(kw)) {
          // Longer keywords = stronger signal (more specific match)
          matchStrength += kw.length / 20;
        }
      }

      const signal = Math.min(1, matchStrength);
      const prior = this._worldModel.get(category);

      // Query-as-Execute: every score call updates the world model
      if (signal > 0) {
        this.update(category, prior + signal * 0.1);
      }

      // Combined score: raw signal weighted by world-model belief
      const combined = 0.6 * signal + 0.4 * this._worldModel.get(category);
      scored.push({ category, score: Math.round(combined * 100) / 100 });
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    this._queryCount++;

    return scored;
  }

  // ── Routing ───────────────────────────────────────────────────────────────

  /**
   * Route a command: score it, build an execution plan, optionally log.
   *
   * @param {string} command - Natural language command
   * @returns {{ activatedCategories: Array, executionPlan: object, freeEnergy: number }}
   */
  route(command) {
    const scores = this.score(command);
    const activatedCategories = scores.filter((s) => s.score > 0.3);

    // Free Energy = Σ (1 - score)² across top categories
    const freeEnergy = activatedCategories.reduce(
      (fe, s) => fe + (1 - s.score) ** 2,
      0,
    ) / Math.max(1, activatedCategories.length);

    const executionPlan = this._buildExecutionPlan(command, activatedCategories);

    if (this._chrono) {
      this._chrono.append({
        type: 'CEREBEX_ROUTE',
        command: command.slice(0, 120),
        topCategories: activatedCategories.slice(0, 5).map((c) => c.category),
        freeEnergy: Math.round(freeEnergy * 10000) / 10000,
        worldModelEntropy: this._entropy(),
      });
    }

    this._commandCount++;
    return { activatedCategories, executionPlan, freeEnergy };
  }

  // ── Execution plan builder ────────────────────────────────────────────────

  _buildExecutionPlan(command, activatedCategories) {
    const topCat = activatedCategories[0]?.category ?? 'EXECUTIVE_SYNTHESIS';

    const systemMap = {
      CONTRACT_MANAGEMENT: ['DocuSign', 'Salesforce', 'NetSuite'],
      CRM_UPDATE: ['Salesforce', 'HubSpot'],
      HR_WORKFLOW: ['Workday', 'ADP', 'Rippling'],
      IT_WORKFLOW: ['ServiceNow', 'Jira', 'Confluence'],
      REVENUE_PLANNING: ['NetSuite', 'Salesforce', 'QuickBooks'],
      FINANCIAL_CLOSE: ['NetSuite', 'QuickBooks', 'Oracle'],
      SUPPLY_CHAIN: ['SAP', 'NetSuite', 'Oracle'],
      COMPLIANCE_MONITORING: ['ServiceNow', 'Jira', 'SAP'],
      VENDOR_MANAGEMENT: ['Coupa', 'Ariba', 'SAP'],
      INCIDENT_RESPONSE: ['ServiceNow', 'PagerDuty', 'Jira'],
      ACCESS_CONTROL: ['Okta', 'Azure AD', 'Google Workspace'],
    };

    const targets = systemMap[topCat] ?? ['MERIDIAN_CORE'];

    return {
      topCategory: topCat,
      targets,
      command: command.slice(0, 120),
      activatedCount: activatedCategories.length,
      timestamp: new Date().toISOString(),
    };
  }

  // ── World model introspection ─────────────────────────────────────────────

  /** Shannon entropy of the world model — lower = more confident. */
  _entropy() {
    let h = 0;
    for (const score of this._worldModel.values()) {
      const p = Math.max(1e-9, score);
      h -= p * Math.log2(p);
    }
    return Math.round(h * 10000) / 10000;
  }

  /** Returns a sorted snapshot of the current world model. */
  worldModel() {
    return [...this._worldModel.entries()]
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score);
  }

  get queryCount()   { return this._queryCount; }
  get commandCount() { return this._commandCount; }
  get learningCoefficient() { return this.eta; }
}

export default CEREBEX;
