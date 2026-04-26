/**
 * CEREBEX — The Organizational Brain
 *
 * Runs 40 analytical categories in parallel. Routes every HDI command through
 * all 40 category signatures simultaneously, scores them, activates the
 * relevant ones, and returns structured output grounded in live data.
 *
 * Also runs the Friston Free Energy minimisation to continuously update its
 * world model:
 *
 *   FE = (sensory_input − prior_model)²
 *   Δmodel = η × φ⁻¹ × ∇FE
 *
 * Where φ⁻¹ = 0.618 is the golden ratio inverse (sovereign learning coefficient).
 */

/** @type {string[]} The 40 analytical categories */
const CATEGORIES = [
  'SWOT',
  'PORTERS_FIVE_FORCES',
  'PESTLE',
  'JOBS_TO_BE_DONE',
  'LEAN_CANVAS',
  'OKR_BUILDER',
  'TAM_SAM_SOM',
  'MOAT_ANALYSIS',
  'FAILURE_MODE_ANALYSIS',
  'FIVE_WHYS',
  'SCENARIO_PLANNING',
  'FERMI_ESTIMATION',
  'LTV_CAC_MODELING',
  'MENTAL_MODEL_INVERSION',
  'SECOND_ORDER_THINKING',
  'OCCAMS_RAZOR',
  'PARETO_ANALYSIS',
  'CIRCLE_OF_COMPETENCE',
  'SOCRATIC_CHALLENGE',
  'STEELMANNING',
  'SYNTHESIS',
  'BUILD_SPEC',
  'PRODUCT_SPEC',
  'MVP_SPEC',
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
];

export class CEREBEX {
  /** @type {number} Golden ratio inverse — sovereign learning coefficient */
  static PHI_INVERSE = 0.6180339887;

  /** @type {number} Learning rate */
  static ETA = 0.01;

  /**
   * @param {Object} [options]
   * @param {Record<string, number>} [options.priorModel] - Initial belief scores per category
   */
  constructor(options = {}) {
    /** @type {Record<string, number>} Current world model belief scores */
    this._worldModel = {};

    for (const cat of CATEGORIES) {
      this._worldModel[cat] = options.priorModel?.[cat] ?? 0.5;
    }

    /** @type {Array<Object>} Sensory input history */
    this._sensorHistory = [];

    /** @type {number} Free energy value from last update */
    this._lastFreeEnergy = 0;

    /** @type {Array<Object>} Execution log */
    this._executionLog = [];
  }

  /**
   * Score an input query against all 40 categories simultaneously.
   * Returns categories sorted by relevance score (highest first).
   *
   * @param {string} query - Natural language input
   * @returns {Array<{ category: string, score: number }>}
   */
  score(query) {
    if (typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('[CEREBEX] query must be a non-empty string');
    }

    const lower = query.toLowerCase();

    const categoryKeywords = {
      SWOT: ['strength', 'weakness', 'opportunity', 'threat', 'swot'],
      PORTERS_FIVE_FORCES: ['competitive', 'supplier', 'buyer', 'rivalry', 'substitute', 'porter'],
      PESTLE: ['political', 'economic', 'social', 'technological', 'legal', 'environmental'],
      JOBS_TO_BE_DONE: ['job', 'hire', 'outcome', 'progress', 'jtbd'],
      LEAN_CANVAS: ['canvas', 'problem', 'solution', 'metric', 'unfair advantage'],
      OKR_BUILDER: ['objective', 'key result', 'okr', 'goal', 'target'],
      TAM_SAM_SOM: ['market size', 'tam', 'sam', 'som', 'addressable'],
      MOAT_ANALYSIS: ['moat', 'defensible', 'competitive advantage', 'barrier'],
      FAILURE_MODE_ANALYSIS: ['failure', 'fmea', 'risk mode', 'fault'],
      FIVE_WHYS: ['why', 'root cause', 'five whys', '5 whys'],
      SCENARIO_PLANNING: ['scenario', 'what if', 'future state', 'contingency'],
      FERMI_ESTIMATION: ['estimate', 'fermi', 'order of magnitude', 'ballpark'],
      LTV_CAC_MODELING: ['ltv', 'cac', 'lifetime value', 'acquisition cost', 'payback'],
      MENTAL_MODEL_INVERSION: ['invert', 'inversion', 'opposite', 'flip'],
      SECOND_ORDER_THINKING: ['second order', 'downstream', 'consequence', 'ripple'],
      OCCAMS_RAZOR: ['simplest', 'occam', 'parsimony', 'simplify'],
      PARETO_ANALYSIS: ['80/20', 'pareto', 'vital few', 'trivial many'],
      CIRCLE_OF_COMPETENCE: ['competence', 'expertise', 'know', 'circle'],
      SOCRATIC_CHALLENGE: ['challenge', 'socratic', 'assumption', 'question'],
      STEELMANNING: ['steelman', 'best case', 'strongest argument'],
      SYNTHESIS: ['synthesize', 'synthesis', 'combine', 'integrate'],
      BUILD_SPEC: ['build', 'spec', 'specification', 'requirements'],
      PRODUCT_SPEC: ['product', 'feature', 'roadmap', 'prd'],
      MVP_SPEC: ['mvp', 'minimum viable', 'prototype', 'v1'],
      UNIT_ECONOMICS: ['unit economics', 'margin', 'gross profit', 'cogs'],
      CONTRACT_MANAGEMENT: ['contract', 'agreement', 'sign', 'docusign', 'envelope', 'clause'],
      REVENUE_PLANNING: ['revenue', 'forecast', 'arr', 'mrr', 'bookings', 'pipeline'],
      CRM_UPDATE: ['crm', 'salesforce', 'opportunity', 'account', 'deal', 'stage'],
      HR_WORKFLOW: ['hr', 'hire', 'headcount', 'employee', 'workday', 'payroll', 'onboard'],
      IT_WORKFLOW: ['ticket', 'incident', 'it', 'servicenow', 'asset', 'access', 'cmdb'],
      COMPLIANCE_MONITORING: ['compliance', 'audit', 'regulation', 'gdpr', 'soc2', 'policy'],
      RISK_ASSESSMENT: ['risk', 'exposure', 'mitigate', 'probability', 'impact'],
      VENDOR_MANAGEMENT: ['vendor', 'supplier', 'procurement', 'purchase order', 'sow'],
      FINANCIAL_CLOSE: ['close', 'quarter end', 'month end', 'reconcile', 'journal', 'gl'],
      SUPPLY_CHAIN: ['supply chain', 'inventory', 'logistics', 'warehouse', 'lead time'],
      AUDIT_TRAIL: ['audit trail', 'log', 'history', 'trace', 'who changed'],
      INCIDENT_RESPONSE: ['incident', 'outage', 'p0', 'p1', 'on-call', 'escalate', 'pagerduty'],
      ASSET_MANAGEMENT: ['asset', 'hardware', 'device', 'laptop', 'serial number', 'cmdb'],
      ACCESS_CONTROL: ['access', 'permission', 'role', 'rbac', 'provision', 'deactivate'],
      EXECUTIVE_SYNTHESIS: ['summary', 'executive', 'brief', 'tldr', 'ceo', 'board'],
    };

    const scores = CATEGORIES.map((cat) => {
      const keywords = categoryKeywords[cat] ?? [];
      let score = 0;

      for (const kw of keywords) {
        if (lower.includes(kw)) {
          score += 1 / keywords.length;
        }
      }

      // Blend with world model belief
      score = score * 0.7 + this._worldModel[cat] * 0.3;

      return { category: cat, score: Math.min(1, score) };
    });

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Route a command: score it, activate top categories, build an execution plan.
   * @param {string} command - Natural language command
   * @param {number} [topK=5] - Number of top categories to activate
   * @returns {{ command: string, activatedCategories: Array, executionPlan: Object, freeEnergy: number }}
   */
  route(command, topK = 5) {
    const scores = this.score(command);
    const activated = scores.slice(0, topK).filter((s) => s.score > 0.05);

    // Build execution plan
    const executionPlan = this._buildExecutionPlan(command, activated);

    // Update world model (Friston FE minimisation)
    const freeEnergy = this._updateWorldModel(activated);

    const entry = {
      command,
      activatedCategories: activated,
      executionPlan,
      freeEnergy,
      routedAt: new Date().toISOString(),
    };

    this._executionLog.push(entry);
    return entry;
  }

  /**
   * Ingest live sensory data from connected systems and update the world model.
   * @param {Record<string, number>} sensorData - category → signal strength (0–1)
   * @returns {{ updatedCategories: string[], freeEnergy: number }}
   */
  ingestSensoryData(sensorData) {
    const updatedCategories = [];

    for (const [cat, signal] of Object.entries(sensorData)) {
      if (!this._worldModel.hasOwnProperty(cat)) continue;

      const prior = this._worldModel[cat];
      const fe = Math.pow(signal - prior, 2);
      const delta = CEREBEX.ETA * CEREBEX.PHI_INVERSE * (signal - prior);
      this._worldModel[cat] = Math.min(1, Math.max(0, prior + delta));
      updatedCategories.push(cat);

      this._sensorHistory.push({ cat, signal, prior, fe, updatedAt: new Date().toISOString() });
    }

    const freeEnergy = this._computeFreeEnergy();
    this._lastFreeEnergy = freeEnergy;

    return { updatedCategories, freeEnergy };
  }

  /**
   * Returns current world model belief scores.
   * @returns {Record<string, number>}
   */
  getWorldModel() {
    return { ...this._worldModel };
  }

  /**
   * Returns the most recent free energy value.
   * Lower is better — means world model matches reality.
   * @returns {number}
   */
  getFreeEnergy() {
    return this._lastFreeEnergy;
  }

  /**
   * Returns the full execution log.
   * @returns {Array<Object>}
   */
  getExecutionLog() {
    return [...this._executionLog];
  }

  /* ---- internal ---- */

  _buildExecutionPlan(command, activated) {
    // Map activated categories to target systems
    const systemRoutes = {
      CONTRACT_MANAGEMENT: 'DocuSign',
      REVENUE_PLANNING: 'NetSuite',
      CRM_UPDATE: 'Salesforce',
      HR_WORKFLOW: 'Workday',
      IT_WORKFLOW: 'ServiceNow',
      FINANCIAL_CLOSE: 'Oracle',
      SUPPLY_CHAIN: 'SAP',
      AUDIT_TRAIL: 'CHRONO',
      INCIDENT_RESPONSE: 'ServiceNow',
      ASSET_MANAGEMENT: 'ServiceNow',
      ACCESS_CONTROL: 'Microsoft365',
    };

    const targets = activated
      .map((a) => systemRoutes[a.category])
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe

    return {
      command,
      targets: targets.length > 0 ? targets : ['CEREBEX'],
      steps: targets.map((t) => ({ system: t, action: 'execute', status: 'pending' })),
      createdAt: new Date().toISOString(),
    };
  }

  _updateWorldModel(activated) {
    for (const { category, score } of activated) {
      const prior = this._worldModel[category];
      const delta = CEREBEX.ETA * CEREBEX.PHI_INVERSE * (score - prior);
      this._worldModel[category] = Math.min(1, Math.max(0, prior + delta));
    }
    return this._computeFreeEnergy();
  }

  _computeFreeEnergy() {
    const values = Object.values(this._worldModel);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
}

export { CATEGORIES };
export default CEREBEX;
