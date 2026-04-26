import { BaseConnector } from './base-connector.js';

/**
 * Zendesk Support connector.
 * Supported entities: tickets, users, organizations, satisfaction_ratings
 */
export class ZendeskConnector extends BaseConnector {
  name = 'zendesk';
  supportedEntities = new Set(['tickets', 'users', 'organizations', 'satisfaction_ratings']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['tickets', []],
    ['users', []],
    ['organizations', []],
    ['satisfaction_ratings', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { subdomain?: string, email?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.subdomain = config.subdomain ?? '';
    this.email = config.email ?? '';
    this.baseUrl = config.baseUrl ?? `https://${this.subdomain}.zendesk.com/api/v2`;
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, subdomain: this.subdomain };
  }

  /**
   * Zendesk API sync with cursor-based pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[zendesk] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[zendesk] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter((r) => new Date(r.updated_at ?? r.updatedAt) >= sinceDate);
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
      afterCursor: filtered.length > 0 ? `zendesk-cursor-${Date.now()}` : null,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map Zendesk field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const zdAliases = {
      id: 'ticketId',
      subject: 'subject',
      description: 'description',
      status: 'status',
      priority: 'priority',
      requester_id: 'requesterId',
      assignee_id: 'assigneeId',
      organization_id: 'organizationId',
      satisfaction_rating: 'csatScore',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
    };

    const extraMappings = [];
    for (const [zdField, alias] of Object.entries(zdAliases)) {
      const inSource = sourceSchema[zdField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === zdField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: zdField, target: alias });
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

export default ZendeskConnector;
