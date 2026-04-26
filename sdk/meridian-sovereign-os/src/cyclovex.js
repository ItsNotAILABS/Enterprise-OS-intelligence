/**
 * CYCLOVEX — The Organizational Cycle Engine
 *
 * The master cycle generator. Manages compute, automation capacity, and
 * workflow throughput as a sovereign resource. Perpetually generates and
 * distributes capacity. Child cycle generators can be spawned per department
 * or subsidiary — they inherit from the master and never deplete it.
 *
 * Cycle generation formula:
 *   C(t) = C₀ × φᵗ × (1 − chronicFear)
 *
 * Where:
 *   C₀         = base capacity
 *   φ           = golden ratio (1.618…) compounding factor
 *   t           = beats elapsed
 *   chronicFear = organizational stress coefficient from CORDEX [0, 1]
 */
export class CYCLOVEX {
  /** @type {number} Golden ratio */
  static PHI = 1.6180339887;

  /**
   * @param {Object} [options]
   * @param {number} [options.baseCapacity=1.0] Initial capacity C₀
   * @param {number} [options.maxCapacity=1000] Safety ceiling
   * @param {string} [options.id='master'] Identifier for this cycle engine
   */
  constructor(options = {}) {
    this.id = options.id ?? 'master';
    this.baseCapacity = options.baseCapacity ?? 1.0;
    this.maxCapacity = options.maxCapacity ?? 1_000;
    this._beats = 0;
    this._chronicFear = 0;
    this._allocations = new Map();
    this._children = new Map();
    this._history = [];
  }

  /**
   * Advance one beat and regenerate capacity.
   * @param {number} [chronicFear=0] Current organizational stress coefficient (0–1)
   * @returns {{ id: string, beat: number, capacity: number, chronicFear: number }}
   */
  tick(chronicFear = 0) {
    this._beats++;
    this._chronicFear = Math.min(1, Math.max(0, chronicFear));

    const capacity = Math.min(
      this.maxCapacity,
      this.baseCapacity * Math.pow(CYCLOVEX.PHI, this._beats * 0.001) * (1 - this._chronicFear),
    );

    const state = {
      id: this.id,
      beat: this._beats,
      capacity,
      chronicFear: this._chronicFear,
      timestamp: new Date().toISOString(),
    };

    this._history.push(state);

    // Tick all children too
    for (const child of this._children.values()) {
      child.tick(chronicFear);
    }

    return state;
  }

  /**
   * Allocate capacity to a named consumer (script, workflow, department).
   * @param {string} consumerId
   * @param {number} amount
   * @returns {{ consumerId: string, allocated: number, remainingCapacity: number }}
   */
  allocate(consumerId, amount) {
    const current = this._getCurrentCapacity();

    if (amount > current) {
      throw new Error(
        `[CYCLOVEX:${this.id}] insufficient capacity — requested ${amount}, available ${current.toFixed(4)}`,
      );
    }

    const existing = this._allocations.get(consumerId) ?? 0;
    this._allocations.set(consumerId, existing + amount);

    return {
      consumerId,
      allocated: existing + amount,
      remainingCapacity: current - amount,
    };
  }

  /**
   * Release capacity from a named consumer.
   * @param {string} consumerId
   * @param {number} [amount] If omitted, releases all allocation for this consumer
   * @returns {{ consumerId: string, released: number }}
   */
  release(consumerId, amount) {
    const existing = this._allocations.get(consumerId) ?? 0;
    const released = amount !== undefined ? Math.min(amount, existing) : existing;
    const remaining = existing - released;

    if (remaining <= 0) {
      this._allocations.delete(consumerId);
    } else {
      this._allocations.set(consumerId, remaining);
    }

    return { consumerId, released };
  }

  /**
   * Spawn a child cycle engine for a department or subsidiary.
   * The child inherits a fraction of the master's base capacity.
   * @param {string} childId
   * @param {number} [capacityFraction=0.1] Fraction of master's base capacity
   * @returns {CYCLOVEX}
   */
  spawnChild(childId, capacityFraction = 0.1) {
    if (this._children.has(childId)) {
      return this._children.get(childId);
    }

    const child = new CYCLOVEX({
      id: childId,
      baseCapacity: this.baseCapacity * capacityFraction,
      maxCapacity: this.maxCapacity * capacityFraction,
    });

    this._children.set(childId, child);
    return child;
  }

  /**
   * Returns a child cycle engine by ID.
   * @param {string} childId
   * @returns {CYCLOVEX|undefined}
   */
  getChild(childId) {
    return this._children.get(childId);
  }

  /**
   * Returns the current available (unallocated) capacity.
   * @returns {number}
   */
  getAvailableCapacity() {
    return this._getCurrentCapacity();
  }

  /**
   * Returns the full capacity history.
   * @returns {Array<Object>}
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Returns current snapshot without advancing the beat.
   * @returns {{ id: string, beat: number, capacity: number, allocations: Object }}
   */
  snapshot() {
    return {
      id: this.id,
      beat: this._beats,
      capacity: this._getCurrentCapacity(),
      allocations: Object.fromEntries(this._allocations),
      children: [...this._children.keys()],
      timestamp: new Date().toISOString(),
    };
  }

  /* ---- internal ---- */

  _getCurrentCapacity() {
    const gross = Math.min(
      this.maxCapacity,
      this.baseCapacity * Math.pow(CYCLOVEX.PHI, this._beats * 0.001) * (1 - this._chronicFear),
    );
    const allocated = [...this._allocations.values()].reduce((a, b) => a + b, 0);
    return Math.max(0, gross - allocated);
  }
}

export default CYCLOVEX;
