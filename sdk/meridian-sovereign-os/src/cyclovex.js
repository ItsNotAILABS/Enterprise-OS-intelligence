/**
 * CYCLOVEX — Sovereign Capacity Engine
 *
 * Theory: SUBSTRATE VIVENS (Paper I) + AURUM (Paper XXII)
 *
 * CYCLOVEX manages compute and automation capacity as a sovereign resource
 * that compounds over time via the golden ratio (AURUM, Paper XXII).
 *
 * Capacity formula:
 *   C(t) = C₀ × φᵗ × (1 − chronicFear)
 *
 * where t is the number of elapsed ticks and chronicFear is the rolling
 * resistance signal from CORDEX. The capacity grows at the rate φ per tick
 * rather than φ per unit time because the golden ratio is the natural scaling
 * factor for compounding processes that must remain coherent across scales
 * (AURUM §2).
 *
 * Sovereign capacity is allocated to workers, sub-engines, and scripts.
 * CYCLOVEX never bills per request — it generates capacity that belongs to
 * the organization permanently.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { PHI } from './nexoris.js';

export class CYCLOVEX {
  /**
   * @param {object} [options]
   * @param {number} [options.baseCapacity] - C₀ — initial capacity units
   */
  constructor({ baseCapacity = 10 } = {}) {
    this.C0 = baseCapacity;
    this._capacity = baseCapacity;
    this._tickCount = 0;
    this._allocations = new Map();   // workerId → allocated units
    this._children = new Map();      // childId → CYCLOVEX sub-engine
    this._chrono = null;
  }

  /** Inject CHRONO for logging. */
  setChrono(chrono) { this._chrono = chrono; return this; }

  // ── Tick ──────────────────────────────────────────────────────────────────

  /**
   * Advance one beat.
   * C(t) = C₀ × φᵗ × (1 − chronicFear)
   *
   * @param {number} [chronicFear=0] - Fear coefficient from CORDEX (0–1)
   * @returns {{ capacity: number, delta: number, tick: number }}
   */
  tick(chronicFear = 0) {
    this._tickCount++;
    const prevCapacity = this._capacity;
    this._capacity = this.C0 * (PHI ** this._tickCount) * (1 - Math.min(0.99, chronicFear));
    const delta = this._capacity - prevCapacity;

    return {
      capacity: this._capacity,
      delta,
      tick: this._tickCount,
    };
  }

  // ── Allocation ────────────────────────────────────────────────────────────

  /**
   * Allocate a fraction of current capacity to a worker or script.
   *
   * @param {string} workerId - Identifier for the worker/script
   * @param {number} fraction - Fraction of current capacity to allocate (0–1)
   * @returns {{ allocated: number, remaining: number }}
   */
  allocate(workerId, fraction) {
    const allocated = this._capacity * fraction;
    const current = this._allocations.get(workerId) ?? 0;
    this._allocations.set(workerId, current + allocated);

    if (this._chrono) {
      this._chrono.append({
        type: 'CYCLOVEX_ALLOCATE',
        workerId,
        allocated: Math.round(allocated * 100) / 100,
        totalCapacity: Math.round(this._capacity * 100) / 100,
        tick: this._tickCount,
      });
    }

    return {
      allocated,
      remaining: this._capacity - [...this._allocations.values()].reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Spawn a child CYCLOVEX sub-engine for a department or domain.
   * The child receives a fraction of current capacity as its C₀.
   *
   * @param {string} childId    - Identifier for the sub-engine
   * @param {number} fraction   - Fraction of parent capacity to give the child
   * @returns {CYCLOVEX} The new child engine
   */
  spawnChild(childId, fraction) {
    const childBase = this._capacity * fraction;
    const child = new CYCLOVEX({ baseCapacity: childBase });
    if (this._chrono) child.setChrono(this._chrono);
    this._children.set(childId, child);
    return child;
  }

  // ── Observability ─────────────────────────────────────────────────────────

  get capacity()  { return this._capacity; }
  get tickCount() { return this._tickCount; }

  /** Returns current allocation map. */
  allocationSnapshot() {
    return Object.fromEntries(this._allocations);
  }

  /** Returns list of child sub-engines. */
  children() {
    return [...this._children.entries()].map(([id, engine]) => ({
      childId: id,
      capacity: engine.capacity,
      tick: engine.tickCount,
    }));
  }
}

export default CYCLOVEX;
