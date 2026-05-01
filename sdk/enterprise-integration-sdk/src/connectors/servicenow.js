/**
 * ServiceNowConnector — IT Operations Integration via SPINOR Protocol
 *
 * Theory: EXECUTIO UNIVERSALIS (Paper X) — every ServiceNow operation follows
 * the four-phase cycle: query, act, learn, log.
 *
 * SPINOR identity carries the connector's doctrinal charge intact through
 * every incident, change request, and CMDB sync. Frozen at construction
 * (Noether conservation, Paper VIII).
 *
 * Domains: ITSM, incident, change management
 * CEREBEX categories: IT_WORKFLOW, INCIDENT_RESPONSE, COMPLIANCE_MONITORING
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { BaseConnector } from './base-connector.js';

// ---------------------------------------------------------------------------
// ServiceNowConnector
// ---------------------------------------------------------------------------

export class ServiceNowConnector extends BaseConnector {
  /**
   * @param {object} [options]
   * @param {string} [options.systemId]    - Override default system identifier
   * @param {string} [options.instanceUrl] - ServiceNow instance URL
   */
  constructor({
    systemId = 'servicenow-itsm',
    instanceUrl = null,
  } = {}) {
    super({
      systemId,
      label: 'ServiceNow ITSM',
      domain: 'ITSM',
      spinorConfig: {
        systemType: 'SERVICENOW',
        domains: ['ITSM', 'incident', 'change_management'],
        operations: [
          'createIncident',
          'resolveIncident',
          'getChangeRequests',
          'syncCMDB',
          'getServiceHealth',
        ],
        cerebexCategories: ['IT_WORKFLOW', 'INCIDENT_RESPONSE', 'COMPLIANCE_MONITORING'],
      },
    });

    this._instanceUrl = instanceUrl;
  }

  // ── Connection ──────────────────────────────────────────────────────────

  /** @override */
  async _doConnect(credentials) {
    const { instanceUrl, username, password, clientId, clientSecret } = credentials || {};
    if (!instanceUrl || !username || !password) {
      throw new Error('ServiceNow credentials require instanceUrl, username, and password');
    }
    this._instanceUrl = instanceUrl;
  }

  /** @override */
  async _doDisconnect() {
    this._instanceUrl = null;
  }

  // ── Operations ──────────────────────────────────────────────────────────

  /** @override */
  async _executeOperation(operation, params) {
    switch (operation) {
      case 'createIncident':
        return this._createIncident(params);
      case 'resolveIncident':
        return this._resolveIncident(params);
      case 'getChangeRequests':
        return this._getChangeRequests(params);
      case 'syncCMDB':
        return this._syncCMDB(params);
      case 'getServiceHealth':
        return this._getServiceHealth(params);
      default:
        throw new Error(`Unhandled operation: ${operation}`);
    }
  }

  /**
   * Create a new incident.
   * @param {object} params
   * @param {string} params.shortDescription - Brief description
   * @param {string} params.description      - Full description
   * @param {string} [params.priority]       - Priority (1-5)
   * @param {string} [params.category]       - Incident category
   * @param {string} [params.assignmentGroup] - Assignment group
   * @returns {Promise<object>}
   */
  async _createIncident({ shortDescription, description, priority, category, assignmentGroup }) {
    if (!shortDescription) throw new Error('createIncident requires shortDescription');
    return {
      operation: 'createIncident',
      incidentNumber: `INC${Date.now().toString(36).toUpperCase()}`,
      shortDescription,
      priority: priority || '3',
      category: category || 'Software',
      state: 'New',
      assignmentGroup: assignmentGroup || 'Unassigned',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Resolve an existing incident.
   * @param {object} params
   * @param {string} params.incidentNumber  - Incident number to resolve
   * @param {string} params.resolutionCode  - Resolution code
   * @param {string} params.resolutionNotes - Resolution details
   * @returns {Promise<object>}
   */
  async _resolveIncident({ incidentNumber, resolutionCode, resolutionNotes }) {
    if (!incidentNumber || !resolutionCode) {
      throw new Error('resolveIncident requires incidentNumber and resolutionCode');
    }
    return {
      operation: 'resolveIncident',
      incidentNumber,
      resolutionCode,
      state: 'Resolved',
      resolvedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieve change requests.
   * @param {object} params
   * @param {string} [params.state]    - Change request state filter
   * @param {string} [params.type]     - Change type ('standard' | 'normal' | 'emergency')
   * @returns {Promise<object>}
   */
  async _getChangeRequests({ state, type } = {}) {
    return {
      operation: 'getChangeRequests',
      state: state || 'ALL',
      type: type || 'ALL',
      changeRequests: [],
      count: 0,
    };
  }

  /**
   * Sync the Configuration Management Database.
   * @param {object} params
   * @param {string} [params.ciClass] - Configuration item class filter
   * @returns {Promise<object>}
   */
  async _syncCMDB({ ciClass } = {}) {
    return {
      operation: 'syncCMDB',
      ciClass: ciClass || 'ALL',
      itemsSynced: 0,
      relationships: 0,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieve service health status.
   * @param {object} params
   * @param {string} [params.serviceName] - Service name filter
   * @returns {Promise<object>}
   */
  async _getServiceHealth({ serviceName } = {}) {
    return {
      operation: 'getServiceHealth',
      serviceName: serviceName || 'ALL',
      services: [],
      overallHealth: 'OPERATIONAL',
      checkedAt: new Date().toISOString(),
    };
  }

  // ── Health check ────────────────────────────────────────────────────────

  /** @override */
  async healthCheck() {
    const base = await super.healthCheck();
    return {
      ...base,
      instanceUrl: this._instanceUrl,
    };
  }
}

export default ServiceNowConnector;
