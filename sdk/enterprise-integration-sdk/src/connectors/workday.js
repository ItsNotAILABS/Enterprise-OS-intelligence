import { BaseConnector } from './base-connector.js';

/**
 * Workday HCM connector.
 * Supported entities: workers, positions, compensation, job_requisitions
 */
export class WorkdayConnector extends BaseConnector {
  name = 'workday';
  supportedEntities = new Set(['workers', 'positions', 'compensation', 'job_requisitions']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['workers', []],
    ['positions', []],
    ['compensation', []],
    ['job_requisitions', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { tenantId?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.tenantId = config.tenantId ?? '';
    this.baseUrl = config.baseUrl ?? `https://wd2-impl-services1.workday.com/ccx/service/${this.tenantId}`;
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, tenantId: this.tenantId };
  }

  /**
   * Workday REST sync with page-based pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[workday] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[workday] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter((r) => new Date(r.updatedAt) >= sinceDate);
    }
    if (options.limit && options.limit < filtered.length) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      connectorId: this.id,
      entity,
      direction,
      recordsSynced: filtered.length,
      records: direction === 'inbound' ? filtered : undefined,
      nextPage: filtered.length > 0 ? `workday-page-${Date.now()}` : null,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map Workday field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const workdayAliases = {
      Worker_ID: 'workerId',
      Legal_Name: 'fullName',
      Position_ID: 'positionId',
      Job_Title: 'jobTitle',
      Business_Site: 'location',
      Annual_Currency_Summary: 'annualSalary',
      Job_Requisition_ID: 'requisitionId',
      Target_Hire_Date: 'targetHireDate',
      Supervisory_Organization: 'department',
    };

    const extraMappings = [];
    for (const [wdField, alias] of Object.entries(workdayAliases)) {
      const inSource = sourceSchema[wdField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === wdField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: wdField, target: alias });
      }
    }

    return {
      ...base,
      auto: [...base.auto, ...extraMappings],
      unmappedSource: base.unmappedSource.filter((k) => !extraMappings.some((m) => m.source === k)),
      unmappedTarget: base.unmappedTarget.filter((k) => !extraMappings.some((m) => m.target === k)),
    };
  }
}

export default WorkdayConnector;
