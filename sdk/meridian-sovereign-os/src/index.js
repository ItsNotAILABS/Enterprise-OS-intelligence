/**
 * @medina/meridian-sovereign-os — MERIDIAN Sovereign OS
 *
 * The sovereign operating system that runs underneath your existing enterprise
 * stack and connects all of it into one continuously intelligent organism.
 *
 * Theory basis:
 *   - SUBSTRATE VIVENS (Paper I) — living vs dead compute
 *   - CONCORDIA MACHINAE (Paper II) — Kuramoto synchronization
 *   - SYSTEMA INVICTUM (Paper III) — antifragility engines
 *   - DOCTRINA VOXIS (Paper IV) — sovereign compute unit
 *   - QUAESTIO ET ACTIO (Paper VII) — query-as-execute
 *   - IMPERIUM CONSERVATUM (Paper VIII) — conservation laws of sovereignty
 *   - COHORS MENTIS (Paper IX) — autonomous cognitive units
 *   - EXECUTIO UNIVERSALIS (Paper X) — one operation: query, act, learn, log
 *   - STIGMERGY (Paper XX) — intelligence lives in the field between agents
 *   - QUORUM (Paper XXI) — decisions without authority
 *   - AURUM (Paper XXII) — φ as structural attractor; substrate is intelligence
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { CHRONO }   from './chrono.js';
import { NEXORIS, PHI, PHI_INV } from './nexoris.js';
import { CEREBEX, CATEGORIES } from './cerebex.js';
import { CORDEX }   from './cordex.js';
import { CYCLOVEX } from './cyclovex.js';
import { VOXIS }    from './voxis.js';
import { HDI }      from './hdi.js';
import { CognovexUnit, CognovexNetwork } from './cognovex.js';
import { VetKeys } from './vetkeys.js';
import { BehavioralLaws, EduConfig } from './edu-config.js';
import { VoiceSession, ClassroomVoiceManager, VoiceTranscriber } from './voice-interface.js';

export { CHRONO };
export { NEXORIS, PHI, PHI_INV };
export { CEREBEX, CATEGORIES };
export { CORDEX };
export { CYCLOVEX };
export { VOXIS };
export { HDI };
export { CognovexUnit, CognovexNetwork };
export { VetKeys };
export { BehavioralLaws, EduConfig };
export { VoiceSession, ClassroomVoiceManager, VoiceTranscriber };

// ---------------------------------------------------------------------------
// bootstrapMeridian — one call to bring the organism online
// ---------------------------------------------------------------------------

/**
 * Bootstrap the full MERIDIAN organism.
 *
 * Wires all engines together and returns them as a single object:
 *   { chrono, nexoris, cerebex, cordex, cyclovex, voxis, hdi, cognovex }
 *
 * @param {object} [options]
 * @param {string} [options.agentId]          - HDI agent identifier
 * @param {number} [options.baseCapacity]     - CYCLOVEX C₀
 * @param {number} [options.couplingStrength] - NEXORIS Kuramoto K
 * @param {number} [options.cognovexUnits]    - Number of COGNOVEX units to spawn (max 8)
 * @param {string} [options.keyDerivationDomain] - VetKeys derivation domain
 * @returns {{ chrono, nexoris, cerebex, cordex, cyclovex, voxis, hdi, cognovex, vetkeys }}
 */
export function bootstrapMeridian({
  agentId           = 'MERIDIAN_HDI',
  baseCapacity      = 10,
  couplingStrength  = 2.0,
  cognovexUnits     = 4,
  keyDerivationDomain = 'MERIDIAN_SOVEREIGN',
} = {}) {
  // ── 1. CHRONO — foundation, everything logs to it ────────────────────────
  const chrono = new CHRONO();

  // ── 2. NEXORIS — Kuramoto synchronization + pheromone field routing ──────
  const nexoris = new NEXORIS({ couplingStrength });
  nexoris.setChrono(chrono);

  // ── 3. CEREBEX — 40-category world model with φ⁻¹ learning ───────────────
  const cerebex = new CEREBEX();
  cerebex.setChrono(chrono);

  // ── 4. CORDEX — Lotka-Volterra organizational heartbeat ──────────────────
  const cordex = new CORDEX();
  cordex.setChrono(chrono);

  // ── 5. CYCLOVEX — φᵗ compounding capacity engine ─────────────────────────
  const cyclovex = new CYCLOVEX({ baseCapacity });
  cyclovex.setChrono(chrono);

  // ── 6. VOXIS — sovereign compute unit (SL-0 doctrine, SPINOR deploy) ─────
  const voxis = new VOXIS({ domain: 'ENTERPRISE_HDI' });
  voxis.setChrono(chrono);

  // ── 7. COGNOVEX — quorum commitment network (Paper XXI) ──────────────────
  const cognovex = new CognovexNetwork();
  cognovex.setChrono(chrono).setNexoris(nexoris);
  const domains = ['FINANCE', 'IT', 'SUPPLY_CHAIN', 'COMPLIANCE',
                   'STRATEGY', 'REVENUE', 'HR', 'OPERATIONS'];
  for (let i = 0; i < Math.min(cognovexUnits, domains.length); i++) {
    cognovex.addUnit(`cvx-${i}`, domains[i]);
  }

  // ── 8. VETKEYS — substrate-level encryption (Paper VIII) ────────────────
  const vetkeys = new VetKeys({ canisterId: agentId, keyDerivationDomain });
  vetkeys.setChrono(chrono);

  // ── 9. HDI — natural language → pipeline interface ───────────────────────
  const hdi = new HDI({ cerebex, nexoris, chrono, cognovex }, agentId);

  // Bootstrap record in CHRONO
  chrono.append({
    type: 'BOOTSTRAP',
    agentId,
    baseCapacity,
    couplingStrength,
    cognovexUnits,
    keyDerivationDomain,
    timestamp: new Date().toISOString(),
  });

  return { chrono, nexoris, cerebex, cordex, cyclovex, voxis, hdi, cognovex, vetkeys };
}
