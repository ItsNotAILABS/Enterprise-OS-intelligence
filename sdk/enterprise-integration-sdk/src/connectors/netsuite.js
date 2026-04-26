import { BaseConnector } from './base-connector.js';

/**
 * NetSuite ERP connector.
 * Supported entities: revenue, invoices, journal_entries, inventory
 */
export class NetSuiteConnector extends BaseConnector {
  name = 'netsuite';
  supportedEntities = new Set(['revenue', 'invoices', 'journal_entries', 'inventory']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['revenue', []],
    ['invoices', []],
    ['journal_entries', []],
    ['inventory', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { accountId?: string, realm?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.accountId = config.accountId ?? '';
    this.realm = config.realm ?? 'production';
    this.baseUrl =
      config.baseUrl ??
      `https://${this.accountId}.suitetalk.api.netsuite.com/services/rest`;
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, accountId: this.accountId, realm: this.realm };
  }

  /**
   * NetSuite SuiteQL / REST sync with paging.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[netsuite] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[netsuite] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter((r) => new Date(r.lastModified ?? r.updatedAt) >= sinceDate);
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
      pageOffset: filtered.length,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map NetSuite field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const netsuiteAliases = {
      internalId: 'id',
      tranId: 'transactionId',
      tranDate: 'transactionDate',
      entity: 'customerId',
      amount: 'amount',
      currency: 'currency',
      memo: 'notes',
      lastModified: 'updatedAt',
      dateCreated: 'createdAt',
      itemId: 'sku',
      quantityOnHand: 'quantityAvailable',
    };

    const extraMappings = [];
    for (const [nsField, alias] of Object.entries(netsuiteAliases)) {
      const inSource = sourceSchema[nsField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === nsField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: nsField, target: alias });
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

export default NetSuiteConnector;
