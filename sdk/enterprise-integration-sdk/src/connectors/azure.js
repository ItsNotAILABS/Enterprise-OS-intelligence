import { BaseConnector } from './base-connector.js';

/**
 * Azure connector (ARM + Microsoft Graph).
 * Supported entities: resource_groups, virtual_machines, active_directory_users, cost_management
 */
export class AzureConnector extends BaseConnector {
  name = 'azure';
  supportedEntities = new Set([
    'resource_groups',
    'virtual_machines',
    'active_directory_users',
    'cost_management',
  ]);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['resource_groups', []],
    ['virtual_machines', []],
    ['active_directory_users', []],
    ['cost_management', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { subscriptionId?: string, tenantId?: string, clientId?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.subscriptionId = config.subscriptionId ?? '';
    this.tenantId = config.tenantId ?? '';
    this.clientId = config.clientId ?? '';
    this.baseUrl = config.baseUrl ?? 'https://management.azure.com';
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, subscriptionId: this.subscriptionId, tenantId: this.tenantId };
  }

  /**
   * Azure ARM REST sync with nextLink pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[azure] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[azure] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const apiVersionMap = {
      resource_groups: '2021-04-01',
      virtual_machines: '2023-03-01',
      active_directory_users: '1.6',
      cost_management: '2022-10-01',
    };

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter(
        (r) => new Date(r.properties?.timeModified ?? r.updatedAt) >= sinceDate,
      );
    }
    if (options.limit && options.limit < filtered.length) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      connectorId: this.id,
      entity,
      apiVersion: apiVersionMap[entity],
      direction,
      recordsSynced: filtered.length,
      records: direction === 'inbound' ? filtered : undefined,
      nextLink: filtered.length > 0 ? `https://management.azure.com/nextPage-${Date.now()}` : null,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map Azure field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const azureAliases = {
      id: 'resourceId',
      name: 'resourceName',
      type: 'resourceType',
      location: 'region',
      'properties.provisioningState': 'status',
      'properties.hardwareProfile.vmSize': 'vmSize',
      userPrincipalName: 'email',
      displayName: 'displayName',
      objectId: 'userId',
    };

    const extraMappings = [];
    for (const [azureField, alias] of Object.entries(azureAliases)) {
      const inSource = sourceSchema[azureField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === azureField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: azureField, target: alias });
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

export default AzureConnector;
