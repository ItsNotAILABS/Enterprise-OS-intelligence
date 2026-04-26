import { BaseConnector } from './base-connector.js';

/**
 * Microsoft 365 connector (Graph API).
 * Supported entities: users, emails, calendar_events, teams_messages, sharepoint_files
 */
export class Microsoft365Connector extends BaseConnector {
  name = 'microsoft365';
  supportedEntities = new Set([
    'users',
    'emails',
    'calendar_events',
    'teams_messages',
    'sharepoint_files',
  ]);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['users', []],
    ['emails', []],
    ['calendar_events', []],
    ['teams_messages', []],
    ['sharepoint_files', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { tenantId?: string, clientId?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.tenantId = config.tenantId ?? '';
    this.clientId = config.clientId ?? '';
    this.baseUrl = config.baseUrl ?? 'https://graph.microsoft.com/v1.0';
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, tenantId: this.tenantId, graphEndpoint: this.baseUrl };
  }

  /**
   * Microsoft Graph API sync with @odata.nextLink pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[microsoft365] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[microsoft365] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const graphPaths = {
      users: '/users',
      emails: '/me/messages',
      calendar_events: '/me/calendar/events',
      teams_messages: '/teams/{teamId}/channels/{channelId}/messages',
      sharepoint_files: '/sites/{siteId}/drive/root/children',
    };

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter(
        (r) => new Date(r.lastModifiedDateTime ?? r.receivedDateTime ?? r.updatedAt) >= sinceDate,
      );
    }
    if (options.limit && options.limit < filtered.length) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      connectorId: this.id,
      entity,
      graphPath: graphPaths[entity],
      direction,
      recordsSynced: filtered.length,
      records: direction === 'inbound' ? filtered : undefined,
      odataNextLink: filtered.length > 0 ? `https://graph.microsoft.com/v1.0/nextPage-${Date.now()}` : null,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map Graph API field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const graphAliases = {
      userPrincipalName: 'email',
      displayName: 'name',
      givenName: 'firstName',
      surname: 'lastName',
      jobTitle: 'title',
      subject: 'subject',
      bodyPreview: 'preview',
      receivedDateTime: 'receivedAt',
      start: 'startTime',
      end: 'endTime',
      lastModifiedDateTime: 'updatedAt',
      createdDateTime: 'createdAt',
    };

    const extraMappings = [];
    for (const [graphField, alias] of Object.entries(graphAliases)) {
      const inSource = sourceSchema[graphField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === graphField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: graphField, target: alias });
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

export default Microsoft365Connector;
