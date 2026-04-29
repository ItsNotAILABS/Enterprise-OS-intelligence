/**
 * PROTO-011: Sovereign Cycle Protocol (SCP)  (Medina)
 *
 * The organism's self-generated heartbeat — implemented as a JS protocol.
 *
 * 873ms per beat.  N=16 parallel cognitive slots.  PHX-sealed compound chain.
 * Fibonacci kernel compression.  Kuramoto synchronisation.
 *
 * No external compute purchased.  No cycles requested.  The organism beats.
 *
 * Engines wired: SovereignCycle + PHXChain + FibonacciKernel + KuramotoSync
 * Ring: Sovereign Ring | Organism placement: Organism core / heartbeat layer
 * Wire: intelligence-wire/scp
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const HEARTBEAT_MS = 873;
const HEARTBEAT_HZ = 1000.0 / HEARTBEAT_MS;
const MIN_SLOTS = 16;
const SYNC_THRESHOLD = PHI_INV;

// ── Fibonacci check ───────────────────────────────────────────────────────────

/**
 * Return true if n is a Fibonacci number (O(1) perfect-square test).
 * @param {number} n
 * @returns {boolean}
 */
function isFibonacci(n) {
  if (n < 0) return false;
  const isPerfectSq = (x) => {
    if (x < 0) return false;
    const s = Math.round(Math.sqrt(x));
    return s * s === x;
  };
  const fiveNSq = 5 * n * n;
  return isPerfectSq(fiveNSq + 4) || isPerfectSq(fiveNSq - 4);
}

// ── Fibonacci Kernel ──────────────────────────────────────────────────────────

class FibonacciKernel {
  constructor() {
    /** @type {Map<number, string>} beat → seal hex */
    this.preserved = new Map();
    /** @type {string|null} crystallised non-Fibonacci hash */
    this.crystal = null;
    /** @type {number} */
    this.crystalCount = 0;
  }

  /**
   * Ingest a bundle seal.
   * @param {number} beat
   * @param {string} sealHex
   */
  ingest(beat, sealHex) {
    if (isFibonacci(beat)) {
      this.preserved.set(beat, sealHex);
    } else {
      if (this.crystal === null) {
        this.crystal = sealHex;
      } else {
        // Simple fold: XOR-combine (in production, use BLAKE2b)
        this.crystal = this._fold(this.crystal, sealHex);
      }
      this.crystalCount++;
    }
  }

  _fold(a, b) {
    // Simple deterministic fold for JS: hash-combine two hex strings
    let hash = 0;
    const combined = a + b;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  get preservedCount() { return this.preserved.size; }
  get totalIngested() { return this.preserved.size + this.crystalCount; }

  sizeBytes() {
    return this.preserved.size * 32 + (this.crystal ? 32 : 0);
  }

  stats() {
    const total = this.totalIngested;
    return {
      totalBeatsIngested: total,
      preservedFibonacci: this.preservedCount,
      crystallised: this.crystalCount,
      kernelSizeBytes: this.sizeBytes(),
      compressionRatio: total > 0
        ? Math.round((total * 1568) / Math.max(this.sizeBytes(), 1) * 100) / 100
        : 0,
    };
  }
}

// ── Kuramoto Synchronisation ─────────────────────────────────────────────────

class KuramotoSync {
  /**
   * @param {number} nodeCount
   * @param {number} [coupling=PHI]
   */
  constructor(nodeCount, coupling = PHI) {
    this.phases = Array.from({ length: nodeCount }, (_, i) =>
      i * (2 * Math.PI / nodeCount)
    );
    this.frequencies = Array.from({ length: nodeCount }, (_, i) =>
      HEARTBEAT_HZ + i * 0.01
    );
    this.coupling = coupling;
  }

  /**
   * Advance oscillators by one time step.
   * @param {number} [dt=HEARTBEAT_MS/1000]
   */
  step(dt = HEARTBEAT_MS / 1000) {
    const n = this.phases.length;
    if (n === 0) return;
    const deltas = this.phases.map((theta_i, i) => {
      const interaction = this.phases.reduce(
        (sum, theta_j) => sum + Math.sin(theta_j - theta_i), 0
      );
      return this.frequencies[i] + (this.coupling / n) * interaction;
    });
    this.phases = this.phases.map((theta, i) => theta + deltas[i] * dt);
  }

  /**
   * Kuramoto order parameter R ∈ [0, 1].
   * @returns {number}
   */
  order() {
    const n = this.phases.length;
    if (n === 0) return 0;
    const re = this.phases.reduce((s, θ) => s + Math.cos(θ), 0) / n;
    const im = this.phases.reduce((s, θ) => s + Math.sin(θ), 0) / n;
    return Math.sqrt(re * re + im * im);
  }

  /**
   * True if R ≥ φ⁻¹ ≈ 0.618.
   * @returns {boolean}
   */
  isSynchronised() {
    return this.order() >= SYNC_THRESHOLD;
  }
}

// ── Sovereign Cycle Protocol ─────────────────────────────────────────────────

class SovereignCycleProtocol {
  /**
   * @param {Object} config
   * @param {number} [config.slots=16]
   * @param {number} [config.nodeCount=4]
   */
  constructor(config = {}) {
    this.slots = Math.max(config.slots || MIN_SLOTS, MIN_SLOTS);
    this.beat = 0;
    this.bootTime = Date.now();
    this.bundles = [];
    this.kernel = new FibonacciKernel();
    this.kuramoto = new KuramotoSync(config.nodeCount || 4);
    this.latestSeal = null;
    this.eventLog = [];
  }

  // ── Core Tick ──────────────────────────────────────────────────────────────

  /**
   * Execute one sovereign cycle (one heartbeat).
   * @param {string[]} [events] - Decision event strings
   * @returns {Object} Bundle record
   */
  tick(events = []) {
    const beat = this.beat;

    // Pad to N slots
    while (events.length < this.slots) {
      events.push(`heartbeat:${beat}:slot:${events.length}`);
    }

    // Simple seal: hash all events + beat + previous seal
    const sealInput = events.join('|') + '|' + beat + '|' + (this.latestSeal || 'genesis');
    const seal = this._hash(sealInput);

    const recordBytes = this.slots * 32 + (this.slots - 1) * 64 + 32 + 32;

    const bundle = {
      beat,
      slotCount: this.slots,
      seal,
      recordBytes,
      timestampMs: Date.now(),
    };

    // Update state
    this.latestSeal = seal;
    this.bundles.push(bundle);
    this.kernel.ingest(beat, seal);
    this.beat++;

    // Kuramoto step
    this.kuramoto.step();

    // Log
    this.eventLog.push({
      beat,
      seal: seal.substring(0, 16) + '…',
      isFibonacci: isFibonacci(beat),
    });

    return bundle;
  }

  _hash(input) {
    // Deterministic hash (phi-resonance hash, same as phi_hash in other modules)
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) - h + input.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16).padStart(16, '0');
  }

  // ── FCPR ───────────────────────────────────────────────────────────────────

  /**
   * Full Cognitive Processing Rate (decisions per second).
   * @returns {number}
   */
  fcpr() {
    return this.slots * HEARTBEAT_HZ;
  }

  fcprSummary() {
    const dps = this.fcpr();
    return {
      slots: this.slots,
      heartbeatMs: HEARTBEAT_MS,
      heartbeatHz: Math.round(HEARTBEAT_HZ * 1e6) / 1e6,
      decisionsPerSecond: Math.round(dps * 1e4) / 1e4,
      decisionsPerMinute: Math.round(dps * 60 * 100) / 100,
      decisionsPerHour: Math.round(dps * 3600),
      recordBytesPerBeat: this.slots * 32 + (this.slots - 1) * 64 + 64,
      chainGrowthBps: Math.round(
        (this.slots * 32 + (this.slots - 1) * 64 + 96) * HEARTBEAT_HZ
      ),
    };
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  status() {
    return {
      code: 'SVC',
      name: 'Sovereign Cycle',
      version: '1.0.0',
      ring: 'Sovereign',
      beat: this.beat,
      slots: this.slots,
      heartbeatMs: HEARTBEAT_MS,
      fcprDps: Math.round(this.fcpr() * 1e4) / 1e4,
      kuramotoR: Math.round(this.kuramoto.order() * 1e6) / 1e6,
      synchronised: this.kuramoto.isSynchronised(),
      uptimeMs: Date.now() - this.bootTime,
      latestSeal: this.latestSeal,
      kernel: this.kernel.stats(),
      cycleCostUsd: 0.000001,
      externalDependency: 'None',
    };
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  PHI,
  PHI_INV,
  HEARTBEAT_MS,
  HEARTBEAT_HZ,
  MIN_SLOTS,
  SYNC_THRESHOLD,
  isFibonacci,
  FibonacciKernel,
  KuramotoSync,
  SovereignCycleProtocol,
};
