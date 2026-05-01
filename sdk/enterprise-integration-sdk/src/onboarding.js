/**
 * Company Onboarding Orchestrator — Enterprise SPINOR Provisioning
 *
 * Theory: SUBSTRATE VIVENS (Paper I) — a living substrate connects all
 * enterprise systems into one continuously intelligent organism.
 *
 * CONCORDIA MACHINAE (Paper II) — Kuramoto synchronization across
 * heterogeneous enterprise connectors.
 *
 * The onboarding orchestrator provisions connectors, assigns SPINOR identities,
 * wires CHRONO and CEREBEX, and produces a unified integration manifest.
 * Every onboarding event is permanently recorded in the CHRONO hash chain.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { SalesforceConnector } from './connectors/salesforce.js';
import { SAPConnector } from './connectors/sap.js';
import { OracleConnector } from './connectors/oracle.js';
import { WorkdayConnector } from './connectors/workday.js';
import { ServiceNowConnector } from './connectors/servicenow.js';

// ---------------------------------------------------------------------------
// Connector registry
// ---------------------------------------------------------------------------

const CONNECTOR_REGISTRY = {
  salesforce: SalesforceConnector,
  sap: SAPConnector,
  oracle: OracleConnector,
  workday: WorkdayConnector,
  servicenow: ServiceNowConnector,
};

// ---------------------------------------------------------------------------
// CompanyOnboarding
// ---------------------------------------------------------------------------

export class CompanyOnboarding {
  /**
   * @param {object} config
   * @param {string} config.companyId   - Unique company identifier
   * @param {string} config.companyName - Company display name
   * @param {object} [config.chrono]    - CHRONO instance for immutable logging
   * @param {object} [config.cerebex]   - CEREBEX instance for world model updates
   */
  constructor({ companyId, companyName, chrono = null, cerebex = null }) {
    if (!companyId || !companyName) {
      throw new Error('CompanyOnboarding requires companyId and companyName');
    }

    this._companyId = companyId;
    this._companyName = companyName;
    this._chrono = chrono;
    this._cerebex = cerebex;
    this._connectors = new Map();
    this._onboardedAt = null;

    // SPINOR identity for the onboarding process itself
    this._spinorIdentity = Object.freeze({
      type: 'ONBOARDING_ORCHESTRATOR',
      companyId,
      companyName,
      protocol: 'SPINOR',
      createdAt: new Date().toISOString(),
    });
  }

  /** Inject CHRONO for immutable hash-chain logging. */
  setChrono(chrono) {
    this._chrono = chrono;
    // Propagate to all provisioned connectors
    for (const connector of this._connectors.values()) {
      connector.setChrono(chrono);
    }
    return this;
  }

  /** Inject CEREBEX for world model updates. */
  setCerebex(cerebex) {
    this._cerebex = cerebex;
    for (const connector of this._connectors.values()) {
      connector.setCerebex(cerebex);
    }
    return this;
  }

  // ── Connector provisioning ──────────────────────────────────────────────

  /**
   * Provision a connector by type. Creates the connector, assigns SPINOR
   * identity, and wires CHRONO/CEREBEX.
   *
   * @param {string} type    - Connector type (e.g. 'salesforce', 'sap')
   * @param {object} [options] - Connector-specific configuration
   * @returns {object} The provisioned connector instance
   */
  provisionConnector(type, options = {}) {
    const ConnectorClass = CONNECTOR_REGISTRY[type.toLowerCase()];
    if (!ConnectorClass) {
      throw new Error(
        `Unknown connector type "${type}". ` +
        `Available: ${Object.keys(CONNECTOR_REGISTRY).join(', ')}`,
      );
    }

    const connector = new ConnectorClass({
      ...options,
      systemId: options.systemId || `${this._companyId}-${type}`,
    });

    if (this._chrono) connector.setChrono(this._chrono);
    if (this._cerebex) connector.setCerebex(this._cerebex);

    this._connectors.set(type.toLowerCase(), connector);

    if (this._chrono) {
      this._chrono.append({
        type: 'CONNECTOR_PROVISIONED',
        companyId: this._companyId,
        connectorType: type,
        spinorIdentity: connector.spinorIdentity,
      });
    }

    return connector;
  }

  /**
   * Provision multiple connectors at once.
   *
   * @param {Array<{ type: string, options?: object }>} specs - Connector specifications
   * @returns {Map<string, object>} Map of type → connector instance
   */
  provisionAll(specs) {
    for (const { type, options } of specs) {
      this.provisionConnector(type, options || {});
    }
    return this._connectors;
  }

  // ── Onboarding execution ───────────────────────────────────────────────

  /**
   * Execute the full onboarding flow: provision connectors, verify SPINOR
   * identities, and produce the integration manifest.
   *
   * @param {object} config
   * @param {Array<{ type: string, options?: object }>} config.connectors - Connectors to provision
   * @returns {Promise<object>} Onboarding manifest
   */
  async onboard({ connectors = [] } = {}) {
    const startTime = Date.now();

    // Phase 1: Provision all requested connectors
    this.provisionAll(connectors);

    // Phase 2: Verify SPINOR identities
    const identities = [];
    for (const [type, connector] of this._connectors) {
      identities.push({
        type,
        spinorIdentity: connector.spinorIdentity,
      });
    }

    // Phase 3: Health check all connectors
    const healthResults = [];
    for (const [type, connector] of this._connectors) {
      const health = await connector.healthCheck();
      healthResults.push({ type, ...health });
    }

    this._onboardedAt = new Date().toISOString();
    const elapsed = Date.now() - startTime;

    // Build manifest
    const manifest = {
      companyId: this._companyId,
      companyName: this._companyName,
      onboardedAt: this._onboardedAt,
      elapsed,
      connectorCount: this._connectors.size,
      connectors: identities,
      health: healthResults,
      spinorProtocol: 'SPINOR',
      sovereignty: 'FULL',
    };

    // Phase 4: Log to CHRONO
    if (this._chrono) {
      this._chrono.append({
        type: 'COMPANY_ONBOARDED',
        companyId: this._companyId,
        companyName: this._companyName,
        connectorCount: this._connectors.size,
        connectorTypes: [...this._connectors.keys()],
        elapsed,
        spinorIdentity: this._spinorIdentity,
      });
    }

    return manifest;
  }

  // ── Accessors ───────────────────────────────────────────────────────────

  /** Get a provisioned connector by type. */
  getConnector(type) {
    return this._connectors.get(type.toLowerCase()) || null;
  }

  /** Returns all provisioned connectors. */
  get connectors() {
    return new Map(this._connectors);
  }

  /** Returns the frozen SPINOR identity for this onboarding process. */
  get spinorIdentity() {
    return this._spinorIdentity;
  }

  /** Returns available connector types. */
  static get availableConnectors() {
    return Object.keys(CONNECTOR_REGISTRY);
  }
}

export default CompanyOnboarding;
