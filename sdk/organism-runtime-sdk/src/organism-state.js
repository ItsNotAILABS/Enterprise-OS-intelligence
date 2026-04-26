/**
 * OrganismState — 4-Register Sovereign State Management
 *
 * Theory: SUBSTRATE VIVENS (Paper I) — persistent memory is one of the five
 * properties of a living substrate. The organism's state is continuous, internal,
 * and never erased by the platform.
 *
 * The four registers reflect the four domains of a sovereign intelligence entity:
 *   Cognitive  — reasoning, planning, analysis
 *   Affective  — emotional tone, mood, urgency signal
 *   Somatic    — hardware/resource state
 *   Sovereign  — identity, doctrine, governance
 *
 * @medina/organism-runtime-sdk — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const REGISTERS = ['cognitive', 'affective', 'somatic', 'sovereign'];

const INITIAL_STATE = {
  cognitive: { reasoning: null, planning: null, analysis: null },
  affective: { emotion: null, mood: null, sentiment: null },
  somatic:   { body: null, resources: null },
  sovereign: { identity: null, doctrine: null, governance: null },
};

export class OrganismState {
  constructor() {
    this._state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this._listeners = new Map(REGISTERS.map((r) => [r, []]));
    this._snapshotCount = 0;
  }

  // ── Register access ───────────────────────────────────────────────────────

  getRegister(name) {
    if (!REGISTERS.includes(name)) throw new Error(`Unknown register: ${name}`);
    return JSON.parse(JSON.stringify(this._state[name]));
  }

  setRegister(name, key, value) {
    if (!REGISTERS.includes(name)) throw new Error(`Unknown register: ${name}`);
    const previousValue = this._state[name][key] ?? null;
    this._state[name][key] = value;

    const event = {
      register: name,
      key,
      previousValue,
      newValue: value,
      timestamp: new Date().toISOString(),
    };
    for (const cb of this._listeners.get(name)) cb(event);
    return this;
  }

  // ── Snapshots ─────────────────────────────────────────────────────────────

  snapshot() {
    this._snapshotCount++;
    return Object.freeze({
      snapshotId: `snap-${this._snapshotCount}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...JSON.parse(JSON.stringify(this._state)),
    });
  }

  diff(snapA, snapB) {
    const changes = {};
    for (const reg of REGISTERS) {
      const regChanges = {};
      const allKeys = new Set([
        ...Object.keys(snapA[reg] ?? {}),
        ...Object.keys(snapB[reg] ?? {}),
      ]);
      for (const key of allKeys) {
        const before = (snapA[reg] ?? {})[key] ?? null;
        const after  = (snapB[reg] ?? {})[key] ?? null;
        if (before !== after) {
          regChanges[key] = { before, after };
        }
      }
      if (Object.keys(regChanges).length > 0) changes[reg] = regChanges;
    }
    return changes;
  }

  // ── Listeners ─────────────────────────────────────────────────────────────

  onStateChange(register, callback) {
    if (!REGISTERS.includes(register)) throw new Error(`Unknown register: ${register}`);
    this._listeners.get(register).push(callback);
    return () => {
      const listeners = this._listeners.get(register);
      const idx = listeners.indexOf(callback);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }
}

export default OrganismState;
