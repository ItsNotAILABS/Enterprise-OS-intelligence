/**
 * CHRONO — Immutable Hash-Chain Anchor
 *
 * Theory: STIGMERGY (Paper XX) — the immutable pheromone trail record.
 * Every operation ever executed is a deposit in the shared field. CHRONO
 * is that field preserved permanently: hash-chained so that any tampering
 * is detectable, and sovereign so that the record belongs to the
 * organization, not to a vendor.
 *
 * Each entry carries its own hash = SHA-256(index ‖ timestamp ‖ JSON(data) ‖ prevHash).
 * Verification re-derives every hash from scratch and checks the chain.
 * The record cannot be silently altered: you would have to recompute every
 * subsequent hash, and the current tip hash is publicly observable.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function deriveHash(index, timestamp, data, prevHash) {
  const payload = `${index}|${timestamp}|${JSON.stringify(data)}|${prevHash}`;
  return sha256(payload);
}

// ---------------------------------------------------------------------------
// CHRONO
// ---------------------------------------------------------------------------

export class CHRONO {
  /**
   * @param {object} [options]
   * @param {string} [options.genesisLabel] - Label for the genesis (entry 0) block.
   */
  constructor({ genesisLabel = 'MERIDIAN_GENESIS' } = {}) {
    this._chain = [];
    this._genesisLabel = genesisLabel;
    this._initGenesis();
  }

  // ── Genesis ──────────────────────────────────────────────────────────────

  _initGenesis() {
    const genesis = {
      index: 0,
      timestamp: new Date().toISOString(),
      data: { type: 'GENESIS', label: this._genesisLabel },
      prevHash: '0'.repeat(64),
      hash: '',
    };
    genesis.hash = deriveHash(
      genesis.index,
      genesis.timestamp,
      genesis.data,
      genesis.prevHash,
    );
    this._chain.push(genesis);
  }

  // ── Append ────────────────────────────────────────────────────────────────

  /**
   * Append a new entry to the chain.
   *
   * @param {object} data - The operation payload to record permanently.
   * @returns {{ entryId: string, index: number, timestamp: string, hash: string, prevHash: string }}
   */
  append(data) {
    const prev = this._chain[this._chain.length - 1];
    const index = prev.index + 1;
    const timestamp = new Date().toISOString();
    const hash = deriveHash(index, timestamp, data, prev.hash);

    const entry = { index, timestamp, data, prevHash: prev.hash, hash };
    this._chain.push(entry);

    return {
      entryId: `CHR-${index.toString().padStart(8, '0')}`,
      index,
      timestamp,
      hash,
      prevHash: prev.hash,
    };
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /**
   * Returns the full entry at the given index (read-only copy).
   */
  get(index) {
    const entry = this._chain[index];
    if (!entry) return null;
    return { ...entry, data: JSON.parse(JSON.stringify(entry.data)) };
  }

  /** Returns all entries (read-only copies). */
  all() {
    return this._chain.map((e) => ({
      ...e,
      data: JSON.parse(JSON.stringify(e.data)),
    }));
  }

  /** Returns the hash of the most-recent entry (the chain tip). */
  tip() {
    return this._chain[this._chain.length - 1].hash;
  }

  /** Total number of entries including genesis. */
  get length() {
    return this._chain.length;
  }

  // ── Verify ────────────────────────────────────────────────────────────────

  /**
   * Re-derives every hash in the chain from scratch.
   * Returns { valid: boolean, totalEntries: number, firstCorruptIndex?: number }.
   */
  verify() {
    for (let i = 1; i < this._chain.length; i++) {
      const e = this._chain[i];
      const prev = this._chain[i - 1];

      // Check back-link
      if (e.prevHash !== prev.hash) {
        return { valid: false, totalEntries: this._chain.length, firstCorruptIndex: i };
      }

      // Re-derive hash
      const expected = deriveHash(e.index, e.timestamp, e.data, e.prevHash);
      if (expected !== e.hash) {
        return { valid: false, totalEntries: this._chain.length, firstCorruptIndex: i };
      }
    }
    return { valid: true, totalEntries: this._chain.length };
  }

  // ── Query helpers ─────────────────────────────────────────────────────────

  /**
   * Returns the last N entries (excluding genesis), most recent last.
   */
  recent(n = 10) {
    return this._chain
      .slice(Math.max(1, this._chain.length - n))
      .map((e) => ({ ...e, data: JSON.parse(JSON.stringify(e.data)) }));
  }

  /**
   * Find all entries whose data matches the given predicate.
   */
  find(predicate) {
    return this._chain
      .filter((e) => predicate(e.data))
      .map((e) => ({ ...e, data: JSON.parse(JSON.stringify(e.data)) }));
  }
}

export default CHRONO;
