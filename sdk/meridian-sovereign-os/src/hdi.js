/**
 * HDI — Human Device Interface
 *
 * The command layer that requires no dashboards, no modules, no configuration.
 * You speak in plain language. The HDI understands intent, routes to the correct
 * system via CEREBEX + NEXORIS, executes, confirms, and logs to CHRONO —
 * all in one motion.
 *
 * Example command flow:
 *   "Move the Acme contract from review to signed and update the revenue forecast"
 *   → CEREBEX scores: CONTRACT_MANAGEMENT (0.94) + REVENUE_PLANNING (0.87) + CRM_UPDATE (0.91)
 *   → NEXORIS routes to: DocuSign + NetSuite + Salesforce
 *   → All three execute simultaneously
 *   → CHRONO logs the full execution
 *   → Response: "Acme contract closed. Revenue forecast updated. Logged."
 */
export class HDI {
  /**
   * @param {Object} options
   * @param {import('./cerebex.js').CEREBEX} options.cerebex
   * @param {import('./nexoris.js').NEXORIS} options.nexoris
   * @param {import('./chrono.js').CHRONO} options.chrono
   * @param {string} [options.agentId] - Identifier for this HDI instance
   */
  constructor(options = {}) {
    if (!options.cerebex) throw new Error('[HDI] cerebex instance is required');
    if (!options.nexoris) throw new Error('[HDI] nexoris instance is required');
    if (!options.chrono) throw new Error('[HDI] chrono instance is required');

    this.cerebex = options.cerebex;
    this.nexoris = options.nexoris;
    this.chrono = options.chrono;
    this.agentId = options.agentId ?? 'HDI-MERIDIAN';

    this._sessionLog = [];
  }

  /**
   * Execute a natural language command through the full MERIDIAN pipeline.
   *
   * Pipeline:
   *   1. CEREBEX scores the command against 40 categories (~50ms)
   *   2. Top categories activate and build execution plan
   *   3. NEXORIS routes the plan to the correct system workers
   *   4. CHRONO logs the execution with sovereign proof
   *   5. Confirmation response is returned
   *
   * @param {string} command - Natural language command
   * @param {Object} [options]
   * @param {string} [options.executedBy] - Override the executor identity
   * @param {number} [options.topK=5] - Number of top CEREBEX categories to activate
   * @returns {Promise<{
   *   command: string,
   *   activatedCategories: Array,
   *   routes: Array,
   *   chronoEntry: Object,
   *   response: string,
   *   executedAt: string,
   *   orderParameter: number
   * }>}
   */
  async execute(command, options = {}) {
    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('[HDI] command must be a non-empty string');
    }

    const cmd = command.trim();
    const topK = options.topK ?? 5;

    // Step 1: CEREBEX scores and routes
    const routingResult = this.cerebex.route(cmd, topK);

    // Step 2: NEXORIS dispatches
    const dispatchResult = this.nexoris.route(routingResult.executionPlan);

    // Step 3: CHRONO logs
    const chronoEntry = this.chrono.append({
      command: cmd,
      systemsWritten: dispatchResult.routes.map((r) => r.target),
      systemsRead: routingResult.activatedCategories.map((a) => a.category),
      payload: {
        activatedCategories: routingResult.activatedCategories,
        routes: dispatchResult.routes,
        orderParameter: dispatchResult.orderParameter,
      },
      executedBy: options.executedBy ?? this.agentId,
    });

    // Step 4: Build confirmation response
    const response = this._buildResponse(cmd, dispatchResult.routes, chronoEntry);

    const result = {
      command: cmd,
      activatedCategories: routingResult.activatedCategories,
      routes: dispatchResult.routes,
      chronoEntry,
      response,
      executedAt: new Date().toISOString(),
      orderParameter: dispatchResult.orderParameter,
    };

    this._sessionLog.push(result);
    return result;
  }

  /**
   * Returns the session execution log.
   * @returns {Array<Object>}
   */
  getSessionLog() {
    return [...this._sessionLog];
  }

  /**
   * Suggest completions for partial input (delegates to CEREBEX scoring).
   * @param {string} partialInput
   * @returns {string[]} Suggested category names
   */
  suggest(partialInput) {
    if (!partialInput || partialInput.trim().length === 0) return [];
    const scores = this.cerebex.score(partialInput.trim());
    return scores
      .filter((s) => s.score > 0.1)
      .slice(0, 5)
      .map((s) => s.category);
  }

  /* ---- internal ---- */

  _buildResponse(command, routes, chronoEntry) {
    if (routes.length === 0) {
      return `Processed. Logged at ${chronoEntry.entryId.slice(0, 8)}.`;
    }

    const systemList = routes.map((r) => r.target).join(', ');
    return `Executed across ${systemList}. Logged at ${chronoEntry.entryId.slice(0, 8)}.`;
  }
}

export default HDI;
