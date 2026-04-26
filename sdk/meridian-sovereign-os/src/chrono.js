import crypto from 'node:crypto';

/**
 * CHRONO — The Immutable Anchor
 *
 * Every execution is logged to CHRONO. Nothing is ever lost.
 * The audit trail is automatic and permanent. Each entry is hash-chained
 * to the previous entry so any tampering is detectable.
 */
export class CHRONO {
  constructor() {
    /** @type {Array<Object>} Immutable log entries */
    this._log = [];

    /** @type {string} Hash of the last committed entry */
    this._lastHash = '0'.repeat(64);
  }

  /**
   * Append an execution record to the immutable log.
   *
   * @param {Object} record
   * @param {string} record.command - The command that was executed
   * @param {string[]} [record.systemsWritten] - Systems that were written to
   * @param {string[]} [record.systemsRead] - Systems that were read from
   * @param {Object} [record.payload] - Execution payload/result
   * @param {string} [record.executedBy] - Agent or user identifier
   * @returns {{ entryId: string, timestamp: string, hash: string, previousHash: string }}
   */
  append(record) {
    if (!record || typeof record.command !== 'string') {
      throw new Error('[CHRONO] record.command must be a non-empty string');
    }

    const timestamp = new Date().toISOString();
    const entryId = crypto.randomUUID();

    const entry = {
      entryId,
      timestamp,
      previousHash: this._lastHash,
      command: record.command,
      systemsWritten: record.systemsWritten ?? [],
      systemsRead: record.systemsRead ?? [],
      payload: record.payload ?? null,
      executedBy: record.executedBy ?? 'MERIDIAN',
    };

    // Compute the chain hash over the canonical JSON of the entry (minus the hash field itself)
    const canonical = JSON.stringify({
      entryId: entry.entryId,
      timestamp: entry.timestamp,
      previousHash: entry.previousHash,
      command: entry.command,
      systemsWritten: entry.systemsWritten,
      systemsRead: entry.systemsRead,
      executedBy: entry.executedBy,
    });

    const hash = crypto.createHash('sha256').update(canonical).digest('hex');
    entry.hash = hash;

    this._lastHash = hash;
    Object.freeze(entry);
    this._log.push(entry);

    return { entryId, timestamp, hash, previousHash: entry.previousHash };
  }

  /**
   * Retrieve a single log entry by ID.
   * @param {string} entryId
   * @returns {Object|undefined}
   */
  getEntry(entryId) {
    return this._log.find((e) => e.entryId === entryId);
  }

  /**
   * Retrieve all entries, optionally filtered by time range.
   * @param {Object} [options]
   * @param {string} [options.since] - ISO timestamp
   * @param {string} [options.until] - ISO timestamp
   * @param {string} [options.executedBy] - Filter by agent/user
   * @returns {Array<Object>}
   */
  query(options = {}) {
    let results = this._log;

    if (options.since) {
      const since = new Date(options.since);
      results = results.filter((e) => new Date(e.timestamp) >= since);
    }

    if (options.until) {
      const until = new Date(options.until);
      results = results.filter((e) => new Date(e.timestamp) <= until);
    }

    if (options.executedBy) {
      results = results.filter((e) => e.executedBy === options.executedBy);
    }

    return results;
  }

  /**
   * Verify the integrity of the full chain.
   * Returns true if no entries have been tampered with.
   * @returns {{ valid: boolean, brokenAt: number|null, totalEntries: number }}
   */
  verify() {
    let expectedPrev = '0'.repeat(64);

    for (let i = 0; i < this._log.length; i++) {
      const entry = this._log[i];

      if (entry.previousHash !== expectedPrev) {
        return { valid: false, brokenAt: i, totalEntries: this._log.length };
      }

      const canonical = JSON.stringify({
        entryId: entry.entryId,
        timestamp: entry.timestamp,
        previousHash: entry.previousHash,
        command: entry.command,
        systemsWritten: entry.systemsWritten,
        systemsRead: entry.systemsRead,
        executedBy: entry.executedBy,
      });

      const expected = crypto.createHash('sha256').update(canonical).digest('hex');

      if (entry.hash !== expected) {
        return { valid: false, brokenAt: i, totalEntries: this._log.length };
      }

      expectedPrev = entry.hash;
    }

    return { valid: true, brokenAt: null, totalEntries: this._log.length };
  }

  /**
   * Returns the total number of log entries.
   * @returns {number}
   */
  size() {
    return this._log.length;
  }

  /**
   * Returns the hash of the last committed entry (the chain tip).
   * @returns {string}
   */
  getChainTip() {
    return this._lastHash;
  }
}

export default CHRONO;
