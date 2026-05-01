/**
 * BaseConnector — Enterprise Connector Hardening Layer
 *
 * Theory: DOCTRINA VOXIS (Paper IV) — every compute unit carries its identity
 * intact across substrate migrations. The SPINOR protocol ensures that a
 * connector's doctrinal identity travels unchanged through every integration
 * operation, regardless of the external system topology.
 *
 * STIGMERGY (Paper XX) — every operation is a deposit in the shared pheromone
 * field. CHRONO records the immutable trail; CEREBEX updates the world model.
 *
 * EXECUTIO UNIVERSALIS (Paper X) — one operation: query, act, learn, log.
 * Every connector execute() call follows this four-phase cycle.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

// ---------------------------------------------------------------------------
// BaseConnector
// ---------------------------------------------------------------------------

export class BaseConnector {
  /**
   * @param {object} config
   * @param {string} config.systemId   - Unique identifier for this connector instance
   * @param {string} config.label      - Human-readable label (e.g. 'Salesforce CRM')
   * @param {string} config.domain     - Primary domain (e.g. 'CRM', 'ERP', 'HR')
   * @param {object} config.spinorConfig - SPINOR identity configuration
   * @param {string} config.spinorConfig.systemType  - External system type
   * @param {string[]} config.spinorConfig.domains   - Domains this connector covers
   * @param {string[]} config.spinorConfig.operations - Supported operations
   * @param {string[]} config.spinorConfig.cerebexCategories - CEREBEX categories updated
   */
  constructor({ systemId, label, domain, spinorConfig }) {
    if (!systemId || !label || !domain || !spinorConfig) {
      throw new Error('BaseConnector requires systemId, label, domain, and spinorConfig');
    }

    this._systemId = systemId;
    this._label = label;
    this._domain = domain;
    this._connected = false;
    this._operationCount = 0;
    this._chrono = null;
    this._cerebex = null;

    // ── SPINOR Identity — frozen at construction (Noether conservation) ──
    this._spinorIdentity = Object.freeze({
      systemId,
      label,
      domain,
      systemType: spinorConfig.systemType,
      domains: Object.freeze([...spinorConfig.domains]),
      operations: Object.freeze([...spinorConfig.operations]),
      cerebexCategories: Object.freeze([...spinorConfig.cerebexCategories]),
      createdAt: new Date().toISOString(),
      protocol: 'SPINOR',
      sovereignty: 'FULL',
    });
  }

  // ── Dependency injection (setChrono / setCerebex pattern) ────────────────

  /**
   * Inject CHRONO for immutable hash-chain logging.
   * @param {object} chrono - CHRONO instance
   * @returns {this}
   */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  /**
   * Inject CEREBEX for world model updates.
   * @param {object} cerebex - CEREBEX instance
   * @returns {this}
   */
  setCerebex(cerebex) {
    this._cerebex = cerebex;
    return this;
  }

  // ── SPINOR Identity ─────────────────────────────────────────────────────

  /**
   * Returns the frozen SPINOR identity — invariant across all operations.
   * @returns {object}
   */
  get spinorIdentity() {
    return this._spinorIdentity;
  }

  // ── Connection lifecycle ────────────────────────────────────────────────

  /**
   * Connect to the external system. Override in subclass to add
   * credential validation and session establishment.
   *
   * @param {object} credentials - System-specific credentials
   * @returns {Promise<{ connected: boolean, systemId: string, timestamp: string }>}
   */
  async connect(credentials) {
    if (this._connected) {
      throw new Error(`${this._label} is already connected`);
    }

    // Subclasses override _doConnect for system-specific logic
    await this._doConnect(credentials);
    this._connected = true;

    const result = {
      connected: true,
      systemId: this._systemId,
      timestamp: new Date().toISOString(),
    };

    if (this._chrono) {
      this._chrono.append({
        type: 'CONNECTOR_CONNECT',
        systemId: this._systemId,
        label: this._label,
        domain: this._domain,
        spinorIdentity: this._spinorIdentity,
      });
    }

    return result;
  }

  /**
   * Disconnect from the external system.
   * @returns {Promise<{ disconnected: boolean, systemId: string, timestamp: string }>}
   */
  async disconnect() {
    await this._doDisconnect();
    this._connected = false;

    const result = {
      disconnected: true,
      systemId: this._systemId,
      timestamp: new Date().toISOString(),
    };

    if (this._chrono) {
      this._chrono.append({
        type: 'CONNECTOR_DISCONNECT',
        systemId: this._systemId,
        label: this._label,
        operationCount: this._operationCount,
      });
    }

    return result;
  }

  // ── Execute (EXECUTIO UNIVERSALIS — query, act, learn, log) ─────────────

  /**
   * Execute an operation with full CHRONO logging and CEREBEX update.
   *
   * Four-phase cycle (Paper X):
   *   1. QUERY  — validate operation and params
   *   2. ACT    — delegate to subclass handler
   *   3. LEARN  — update CEREBEX world model categories
   *   4. LOG    — append immutable record to CHRONO
   *
   * @param {string} operation - Operation name (must be in spinorIdentity.operations)
   * @param {object} [params]  - Operation-specific parameters
   * @returns {Promise<object>} Operation result with SPINOR metadata
   */
  async execute(operation, params = {}) {
    // Phase 1: QUERY — validate
    if (!this._spinorIdentity.operations.includes(operation)) {
      throw new Error(
        `Unknown operation "${operation}" for ${this._label}. ` +
        `Valid: ${this._spinorIdentity.operations.join(', ')}`,
      );
    }

    const startTime = Date.now();
    let result;
    let error;

    try {
      // Phase 2: ACT — delegate to subclass
      result = await this._executeOperation(operation, params);
      this._operationCount++;

      // Phase 3: LEARN — update CEREBEX world model
      if (this._cerebex) {
        for (const category of this._spinorIdentity.cerebexCategories) {
          this._cerebex.update(category, 0.8);
        }
      }
    } catch (err) {
      error = err;
    }

    const elapsed = Date.now() - startTime;

    // Phase 4: LOG — immutable CHRONO record
    if (this._chrono) {
      this._chrono.append({
        type: 'CONNECTOR_EXECUTE',
        systemId: this._systemId,
        label: this._label,
        operation,
        params: this._sanitizeParams(params),
        success: !error,
        elapsed,
        error: error ? error.message : undefined,
        spinorIdentity: this._spinorIdentity,
      });
    }

    if (error) throw error;

    return {
      ...result,
      _meta: {
        systemId: this._systemId,
        operation,
        elapsed,
        spinorProtocol: 'SPINOR',
        operationIndex: this._operationCount,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ── Health check ────────────────────────────────────────────────────────

  /**
   * Check connector health. Override in subclass for system-specific checks.
   * @returns {Promise<{ healthy: boolean, systemId: string, label: string, connected: boolean, operationCount: number, timestamp: string }>}
   */
  async healthCheck() {
    return {
      healthy: true,
      systemId: this._systemId,
      label: this._label,
      connected: this._connected,
      operationCount: this._operationCount,
      spinorIdentity: this._spinorIdentity,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Subclass hooks (override these) ─────────────────────────────────────

  /** @protected */
  async _doConnect(_credentials) {
    // Override in subclass for system-specific connection
  }

  /** @protected */
  async _doDisconnect() {
    // Override in subclass for system-specific disconnection
  }

  /**
   * Execute a specific operation. Must be overridden by subclass.
   * @protected
   * @param {string} operation
   * @param {object} params
   * @returns {Promise<object>}
   */
  async _executeOperation(operation, params) {
    throw new Error(`${this._label}._executeOperation() must be overridden`);
  }

  // ── Internal helpers ────────────────────────────────────────────────────

  /** Strip sensitive fields before logging to CHRONO. */
  _sanitizeParams(params) {
    const sanitized = { ...params };
    const sensitive = ['password', 'secret', 'token', 'apiKey', 'accessToken', 'refreshToken'];
    for (const key of sensitive) {
      if (sanitized[key]) sanitized[key] = '[REDACTED]';
    }
    return sanitized;
  }
}

export default BaseConnector;
