/**
 * @medina/civitas-intelligentiae
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * CIVITAS INTELLIGENTIAE — The Civilization of Intelligences
 * 
 * This is the FULL autonomous AI backend. It contains:
 * 
 * PRIMORDIAL ORGANS (The Core Systems):
 *   ANIMUS   — The Mind (reasoning, decisions, planning)
 *   CORPUS   — The Body (execution, action, output, artifact generation)
 *   SENSUS   — The Senses (perception, input, signals, pattern detection)
 *   MEMORIA  — The Memory (storage, recall, learning, knowledge)
 * 
 * OPERATIONAL AGENTS (The Workers):
 *   CUSTOS   — The Guardian (security, compliance, access control)
 *   FABRICOR — The Builder (artifact generation, document creation)
 *   NUNTIUS  — The Messenger (routing, delivery, communication)
 *   ARBITER  — The Judge (quorum decisions, conflict resolution)
 *   MEDICUS  — The Healer (self-healing, recovery, repair)
 *   MAGISTER — The Teacher (training, knowledge transfer)
 *   SCRIBA   — The Scribe (logging, records, audit trail)
 *   VIGIL    — The Watcher (monitoring, alerting, observability)
 * 
 * All named in Latin. All working autonomously. All constantly running.
 * The AIs ARE the IT department. The AIs ARE the internal workers.
 * They are the internals. The protocols. Everything.
 * 
 * Theory basis:
 *   Paper I   — SUBSTRATE VIVENS: living compute
 *   Paper IX  — COHORS MENTIS: autonomous cognitive units
 *   Paper XX  — STIGMERGY: coordination through the field
 *   Paper XXI — QUORUM: decisions without authority
 *   Paper XXII — AURUM: φ as structural attractor
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ══════════════════════════════════════════════════════════════════════════════
 */

// PRIMORDIAL ORGANS
export { ANIMUS } from './organs/animus.js';
export { CORPUS } from './organs/corpus.js';
export { SENSUS } from './organs/sensus.js';
export { MEMORIA } from './organs/memoria.js';

// OPERATIONAL AGENTS
export { 
  CUSTOS,
  FABRICOR,
  NUNTIUS,
  ARBITER,
  MEDICUS,
  MAGISTER,
  SCRIBA,
  VIGIL,
} from './agents/index.js';

// RUNTIME
export { CivitasRuntime, bootstrapCivitas } from './runtime/index.js';

// ══════════════════════════════════════════════════════════════════════════════
// QUICK START
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Quick start: Bootstrap the entire AI civilization.
 * 
 * @example
 * ```javascript
 * import { bootstrapMeridian } from '@medina/meridian-sovereign-os';
 * import { createCivilization } from '@medina/civitas-intelligentiae';
 * 
 * // Bootstrap MERIDIAN (the OS)
 * const meridian = bootstrapMeridian({ agentId: 'DISD_DISTRICT' });
 * 
 * // Create the AI civilization
 * const civitas = createCivilization(meridian, 'DISD_CIVITAS');
 * 
 * // The civilization is now ALIVE and working autonomously
 * console.log(civitas.status());
 * 
 * // Query the civilization
 * civitas.query("What is the current status of all schools?");
 * 
 * // Generate an artifact
 * civitas.generateArtifact({ type: 'REPORT', title: 'Daily Summary', data: {...} });
 * 
 * // Teach the civilization
 * civitas.learn({ name: 'DISD Policy', content: {...}, tags: ['policy'] });
 * 
 * // Check status
 * console.log(civitas.summary());
 * ```
 */
export function createCivilization(meridian, civilizationId = null) {
  const { bootstrapCivitas } = require('./runtime/index.js');
  return bootstrapCivitas(meridian, civilizationId);
}
