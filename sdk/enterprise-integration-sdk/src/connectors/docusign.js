import { BaseConnector } from './base-connector.js';

/**
 * DocuSign eSignature connector.
 * Supported entities: envelopes, templates, recipients, audit_events
 */
export class DocuSignConnector extends BaseConnector {
  name = 'docusign';
  supportedEntities = new Set(['envelopes', 'templates', 'recipients', 'audit_events']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['envelopes', []],
    ['templates', []],
    ['recipients', []],
    ['audit_events', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { accountId?: string, environment?: 'demo'|'production' }} config
   */
  constructor(config = {}) {
    super(config);
    this.accountId = config.accountId ?? '';
    this.environment = config.environment ?? 'production';
    this.baseUrl =
      config.baseUrl ??
      (this.environment === 'demo'
        ? 'https://demo.docusign.net/restapi/v2.1'
        : 'https://na1.docusign.net/restapi/v2.1');
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, accountId: this.accountId, environment: this.environment };
  }

  /**
   * DocuSign eSignature API sync with count/start_position pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[docusign] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[docusign] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter((r) => new Date(r.statusChangedDateTime ?? r.updatedAt) >= sinceDate);
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
      startPosition: filtered.length,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map DocuSign field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const docusignAliases = {
      envelopeId: 'envelopeId',
      status: 'status',
      emailSubject: 'subject',
      sentDateTime: 'sentAt',
      completedDateTime: 'completedAt',
      statusChangedDateTime: 'updatedAt',
      templateId: 'templateId',
      templateName: 'templateName',
      recipientId: 'recipientId',
      email: 'recipientEmail',
      name: 'recipientName',
      routingOrder: 'signingOrder',
    };

    const extraMappings = [];
    for (const [dsField, alias] of Object.entries(docusignAliases)) {
      const inSource = sourceSchema[dsField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === dsField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: dsField, target: alias });
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

export default DocuSignConnector;
