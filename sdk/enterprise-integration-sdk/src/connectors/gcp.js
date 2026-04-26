import { BaseConnector } from './base-connector.js';

/**
 * GCP connector (Google Cloud Platform).
 * Supported entities: compute_instances, bigquery_datasets, cloud_storage, billing
 */
export class GCPConnector extends BaseConnector {
  name = 'gcp';
  supportedEntities = new Set([
    'compute_instances',
    'bigquery_datasets',
    'cloud_storage',
    'billing',
  ]);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['compute_instances', []],
    ['bigquery_datasets', []],
    ['cloud_storage', []],
    ['billing', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { projectId?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.projectId = config.projectId ?? '';
    this.baseUrl = config.baseUrl ?? 'https://compute.googleapis.com/compute/v1';
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, projectId: this.projectId };
  }

  /**
   * GCP REST API sync with pageToken pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[gcp] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[gcp] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const apiMap = {
      compute_instances: 'compute.googleapis.com/compute/v1',
      bigquery_datasets: 'bigquery.googleapis.com/bigquery/v2',
      cloud_storage: 'storage.googleapis.com/storage/v1',
      billing: 'cloudbilling.googleapis.com/v1',
    };

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter(
        (r) => new Date(r.lastStartTimestamp ?? r.timeCreated ?? r.updatedAt) >= sinceDate,
      );
    }
    if (options.limit && options.limit < filtered.length) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      connectorId: this.id,
      entity,
      api: apiMap[entity],
      direction,
      recordsSynced: filtered.length,
      records: direction === 'inbound' ? filtered : undefined,
      nextPageToken: filtered.length > 0 ? `gcp-page-${Date.now()}` : null,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map GCP field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const gcpAliases = {
      id: 'instanceId',
      name: 'resourceName',
      status: 'status',
      zone: 'zone',
      machineType: 'machineType',
      selfLink: 'resourceUrl',
      creationTimestamp: 'createdAt',
      lastStartTimestamp: 'lastStartedAt',
      datasetId: 'datasetId',
      projectId: 'projectId',
      timeCreated: 'createdAt',
      timeModified: 'updatedAt',
    };

    const extraMappings = [];
    for (const [gcpField, alias] of Object.entries(gcpAliases)) {
      const inSource = sourceSchema[gcpField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === gcpField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: gcpField, target: alias });
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

export default GCPConnector;
