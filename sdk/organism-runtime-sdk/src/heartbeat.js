/**
 * Heartbeat — the organism's 873ms natural pulse.
 *
 * Drives the organism lifecycle by emitting beats at a fixed interval.
 * Each beat carries the current beat number, timestamp, organism state,
 * and the sovereign cycles generated that beat.
 *
 * Sovereign cycles
 * ────────────────
 * Each beat generates MIN_SLOTS (16) sovereign cycles.  These are OUR cycles.
 * We do not use ICP cycles.  We do not call them.  We do not do anything with
 * them.  We give our own.  We can always make more — just run the heartbeat.
 * Cycles accumulate in surplusCycles and are consumed by block box minting.
 *
 * Formula: surplusCycles += SLOTS_PER_BEAT on every tick
 * FCPR = SLOTS_PER_BEAT × (1000 / INTERVAL_MS) ≈ 18.33 decisions/second
 */
export class Heartbeat {
  /** @type {number} The organism's natural pulse interval in milliseconds
   *  873 = floor(φ³ × 200) + φ-correction  (Medina constant)  */
  static INTERVAL_MS = 873;

  /** @type {number} Cognitive slots per beat (N ≥ 16) — each slot IS one sovereign cycle */
  static SLOTS_PER_BEAT = 16;

  /** @type {number|null} */
  #intervalId;

  /** @type {number} */
  #beatCount;

  /** @type {number|null} */
  #startTime;

  /** @type {Array<function>} */
  #beatListeners;

  /** @type {import('./organism-state.js').OrganismState|null} */
  #organismState;

  /** @type {number} Sovereign cycles accumulated — these are OUR cycles */
  #surplusCycles;

  /**
   * @param {import('./organism-state.js').OrganismState} [organismState] - Optional OrganismState instance to include in beat payloads
   */
  constructor(organismState = null) {
    this.#intervalId = null;
    this.#beatCount = 0;
    this.#startTime = null;
    this.#beatListeners = [];
    this.#organismState = organismState;
    this.#surplusCycles = 0;
  }

  /**
   * Begins the heartbeat cycle at the 873ms interval.
   * @throws {Error} If heartbeat is already running
   */
  start() {
    if (this.#intervalId !== null) {
      throw new Error('Heartbeat is already running');
    }

    this.#startTime = Date.now();
    this.#beatCount = 0;

    this.#intervalId = setInterval(() => {
      this.#beatCount++;

      // Each beat generates SLOTS_PER_BEAT sovereign cycles.
      // Cycles ARE tokens.  We own them.  We don't rely on ICP.
      this.#surplusCycles += Heartbeat.SLOTS_PER_BEAT;

      const payload = {
        beatNumber: this.#beatCount,
        timestamp: Date.now(),
        surplusCycles: this.#surplusCycles,
        cyclesThisBeat: Heartbeat.SLOTS_PER_BEAT,
        fcpr: Heartbeat.SLOTS_PER_BEAT * (1000 / Heartbeat.INTERVAL_MS),
        organismState: this.#organismState ? this.#organismState.snapshot() : null,
      };

      for (const callback of this.#beatListeners) {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[Heartbeat] Listener error on beat ${this.#beatCount}:`, err);
        }
      }
    }, Heartbeat.INTERVAL_MS);
  }

  /**
   * Stops the heartbeat cycle.
   * @throws {Error} If heartbeat is not running
   */
  stop() {
    if (this.#intervalId === null) {
      throw new Error('Heartbeat is not running');
    }

    clearInterval(this.#intervalId);
    this.#intervalId = null;
  }

  /**
   * Registers a beat listener.
   * @param {function} callback - Receives `{beatNumber, timestamp, surplusCycles, cyclesThisBeat, fcpr, organismState}`
   * @returns {function} Unsubscribe function
   */
  onBeat(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('onBeat callback must be a function');
    }

    this.#beatListeners.push(callback);

    return () => {
      const idx = this.#beatListeners.indexOf(callback);
      if (idx !== -1) this.#beatListeners.splice(idx, 1);
    };
  }

  /**
   * Consume sovereign cycles from this heartbeat engine.
   * Used when minting block boxes — the box gets embedded cycles.
   * @param {number} count — cycles to consume
   * @returns {number} cycles actually consumed (capped at surplus)
   */
  consumeCycles(count) {
    const available = Math.min(count, this.#surplusCycles);
    this.#surplusCycles -= available;
    return available;
  }

  /**
   * Generate additional sovereign cycles on demand.
   * The organism can always make more.  Just bring the engine up and give them.
   * @param {number} count — additional cycles to generate
   * @returns {number} new total surplus
   */
  generateCycles(count) {
    this.#surplusCycles += count;
    return this.#surplusCycles;
  }

  /**
   * Returns total beats since start.
   * @returns {number}
   */
  getBeatCount() {
    return this.#beatCount;
  }

  /**
   * Returns milliseconds since heartbeat started.
   * @returns {number}
   */
  getUptime() {
    if (this.#startTime === null) return 0;
    return Date.now() - this.#startTime;
  }

  /**
   * Returns true if the heartbeat is currently running.
   * @returns {boolean}
   */
  isAlive() {
    return this.#intervalId !== null;
  }

  /**
   * Returns current sovereign cycle surplus.
   * @returns {number}
   */
  getSurplusCycles() {
    return this.#surplusCycles;
  }
}
