/**
 * HDI — Human Device Interface
 *
 * Theory: EXECUTIO UNIVERSALIS (Paper X)
 *
 * No dashboards. No modules. No configuration. No training required.
 * You speak. The OS acts.
 *
 * The HDI implements the full MERIDIAN pipeline in a single motion:
 *   1. CEREBEX scores the command against 40 categories (~O(categories) operation)
 *   2. Top categories activate and build the execution plan
 *   3. NEXORIS routes the plan to the correct system workers (pheromone field)
 *   4. CHRONO logs the execution with sovereign proof
 *   5. Confirmation response is returned
 *
 * Query-as-Execute (Paper VII): every query trains the world model. Asking and
 * acting are the same operation on the intelligence manifold. The HDI makes
 * no distinction between questions and commands at the routing layer.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

export class HDI {
  /**
   * @param {object} engines
   * @param {import('./cerebex.js').CEREBEX} engines.cerebex
   * @param {import('./nexoris.js').NEXORIS}  engines.nexoris
   * @param {import('./chrono.js').CHRONO}    engines.chrono
   * @param {import('./cognovex.js').CognovexNetwork} [engines.cognovex]
   * @param {string} [agentId]
   */
  constructor({ cerebex, nexoris, chrono, cognovex = null }, agentId = 'MERIDIAN_HDI') {
    this.cerebex  = cerebex;
    this.nexoris  = nexoris;
    this.chrono   = chrono;
    this.cognovex = cognovex;
    this.agentId  = agentId;
    this._executionCount = 0;
  }

  // ── Execute ───────────────────────────────────────────────────────────────

  /**
   * Execute a natural language command or query through the full MERIDIAN pipeline.
   *
   * @param {string} input - Natural language command or question
   * @returns {Promise<{
   *   activatedCategories: Array,
   *   routes: Array,
   *   response: string,
   *   chronoEntry: object,
   *   freeEnergy: number
   * }>}
   */
  async execute(input) {
    const trimmed = input.trim();
    if (!trimmed) throw new Error('HDI: empty input');

    // ── Step 1: CEREBEX — score + route ──────────────────────────────────
    const { activatedCategories, executionPlan, freeEnergy } = this.cerebex.route(trimmed);

    // ── Step 2: NEXORIS — synchronization check + pheromone routing ──────
    const syncState = this.nexoris.tick();
    const routeResult = this.nexoris.route({
      targets: executionPlan.targets,
      category: executionPlan.topCategory,
      command: trimmed,
    });

    // Reinforce successful routing with quality proportional to top category score
    const topScore = activatedCategories[0]?.score ?? 0.5;
    for (const route of routeResult.routes) {
      this.nexoris.reinforce(route.operationKey, topScore);
    }

    // ── Step 3: COGNOVEX — observe and tick if available ─────────────────
    let quorumResult = null;
    if (this.cognovex) {
      // Route the top category as evidence for the cognovex network
      const topCat = executionPlan.topCategory;
      for (const [id, unit] of this.cognovex._units) {
        unit.observe(topCat, topScore);
      }
      quorumResult = this.cognovex.tick();
    }

    // ── Step 4: CHRONO — log the full execution ───────────────────────────
    this._executionCount++;
    const chronoEntry = this.chrono.append({
      type: 'HDI_EXECUTE',
      agentId: this.agentId,
      input: trimmed.slice(0, 200),
      topCategory: executionPlan.topCategory,
      activatedCount: activatedCategories.length,
      targets: executionPlan.targets,
      routes: routeResult.routes.map((r) => r.target),
      orderParameter: syncState.orderParameter,
      freeEnergy,
      executionNumber: this._executionCount,
      ...(quorumResult?.crystallized ? { quorumCrystallized: quorumResult.option } : {}),
    });

    // ── Step 5: Build response ────────────────────────────────────────────
    const response = this._buildResponse({
      input: trimmed,
      activatedCategories,
      routeResult,
      syncState,
      chronoEntry,
      quorumResult,
    });

    return {
      activatedCategories,
      routes: routeResult.routes,
      response,
      chronoEntry,
      freeEnergy,
      orderParameter: syncState.orderParameter,
      ...(quorumResult ? { quorum: quorumResult } : {}),
    };
  }

  // ── Response builder ──────────────────────────────────────────────────────

  _buildResponse({ input, activatedCategories, routeResult, syncState, chronoEntry, quorumResult }) {
    const topCats = activatedCategories.slice(0, 3).map((c) => c.category.replace(/_/g, ' ')).join(', ');
    const targets = routeResult.routes.map((r) => r.target).join(', ') || 'MERIDIAN CORE';
    const hashShort = chronoEntry.hash.slice(0, 12);
    const syncStatus = syncState.synchronized ? 'synchronized' : `desync (R=${syncState.orderParameter.toFixed(2)})`;

    let response = `Executed across ${targets}. ` +
      `Categories activated: ${topCats || 'EXECUTIVE_SYNTHESIS'}. ` +
      `Systems ${syncStatus}. ` +
      `Logged at ${hashShort}.`;

    if (quorumResult?.crystallized) {
      response += ` Quorum crystallized: ${quorumResult.option}.`;
    }

    return response;
  }

  // ── Convenience: query (alias for execute — no semantic difference) ────────

  /**
   * Query is an alias for execute. The HDI makes no distinction.
   * Query-as-Execute Theorem (Paper VII): both operations advance the world model.
   */
  async query(input) {
    return this.execute(input);
  }

  get executionCount() { return this._executionCount; }
}

export default HDI;
