/**
 * @medina/meridian-sovereign-os — v1.0.0
 *
 * MERIDIAN SUBSTRATE — the sovereign operating system that runs underneath
 * your existing enterprise stack and connects all of it.
 *
 * Three gold engines:
 *   CORDEX   — Organizational Heart (Lotka-Volterra dynamics)
 *   CEREBEX  — Organizational Brain (40 categories + Friston FE)
 *   CYCLOVEX — Organizational Cycle Engine (φ-compounding capacity)
 *
 * Routing + Audit:
 *   NEXORIS  — Kuramoto coupling router
 *   CHRONO   — Immutable hash-chained audit anchor
 *
 * Interface:
 *   HDI      — Human Device Interface (natural language → execution)
 *
 * Compute unit:
 *   VOXIS    — Sovereign compute unit with SPINOR deployment geometry
 */

export { CORDEX } from './cordex.js';
export { CEREBEX, CATEGORIES } from './cerebex.js';
export { CYCLOVEX } from './cyclovex.js';
export { NEXORIS } from './nexoris.js';
export { CHRONO } from './chrono.js';
export { HDI } from './hdi.js';
export { VOXIS } from './voxis.js';

import { CORDEX } from './cordex.js';
import { CEREBEX } from './cerebex.js';
import { CYCLOVEX } from './cyclovex.js';
import { NEXORIS } from './nexoris.js';
import { CHRONO } from './chrono.js';
import { HDI } from './hdi.js';

/**
 * Bootstrap a fully wired MERIDIAN substrate with all three gold engines,
 * NEXORIS router, CHRONO anchor, and HDI command layer.
 *
 * @param {Object} [options]
 * @param {Object} [options.cordex] - CORDEX constructor options
 * @param {Object} [options.cyclovex] - CYCLOVEX constructor options
 * @param {Object} [options.nexoris] - NEXORIS constructor options
 * @param {string} [options.agentId] - HDI agent identifier
 * @returns {{ cordex: CORDEX, cerebex: CEREBEX, cyclovex: CYCLOVEX, nexoris: NEXORIS, chrono: CHRONO, hdi: HDI }}
 */
export function bootstrapMeridian(options = {}) {
  const cordex = new CORDEX(options.cordex);
  const cerebex = new CEREBEX();
  const cyclovex = new CYCLOVEX(options.cyclovex);
  const nexoris = new NEXORIS(options.nexoris);
  const chrono = new CHRONO();
  const hdi = new HDI({
    cerebex,
    nexoris,
    chrono,
    agentId: options.agentId,
  });

  return { cordex, cerebex, cyclovex, nexoris, chrono, hdi };
}
