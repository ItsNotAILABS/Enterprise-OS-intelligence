import { BaseConnector } from './base-connector.js';

/**
 * ServiceNow ITSM connector.
 * Supported entities: incidents, change_requests, cmdb_items, service_catalog
 */
export class ServiceNowConnector extends BaseConnector {
  name = 'servicenow';
  supportedEntities = new Set(['incidents', 'change_requests', 'cmdb_items', 'service_catalog']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['incidents', []],
    ['change_requests', []],
    ['cmdb_items', []],
    ['service_catalog', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { instanceName?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.instanceName = config.instanceName ?? 'dev';
    this.baseUrl = config.baseUrl ?? `https://${this.instanceName}.service-now.com/api/now`;
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, instanceName: this.instanceName };
  }

  /**
   * ServiceNow Table API sync with sysparm_offset pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[servicenow] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[servicenow] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const tableMap = {
      incidents: 'incident',
      change_requests: 'change_request',
      cmdb_items: 'cmdb_ci',
      service_catalog: 'sc_cat_item',
    };

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter((r) => new Date(r.sys_updated_on ?? r.updatedAt) >= sinceDate);
    }
    if (options.limit && options.limit < filtered.length) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      connectorId: this.id,
      entity,
      table: tableMap[entity],
      direction,
      recordsSynced: filtered.length,
      records: direction === 'inbound' ? filtered : undefined,
      sysparmOffset: filtered.length,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map ServiceNow sys_ field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const snowAliases = {
      sys_id: 'id',
      number: 'ticketNumber',
      short_description: 'summary',
      description: 'description',
      state: 'status',
      priority: 'priority',
      assigned_to: 'assigneeId',
      cmdb_ci: 'configurationItemId',
      sys_updated_on: 'updatedAt',
      sys_created_on: 'createdAt',
    };

    const extraMappings = [];
    for (const [snowField, alias] of Object.entries(snowAliases)) {
      const inSource = sourceSchema[snowField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === snowField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: snowField, target: alias });
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

export default ServiceNowConnector;
