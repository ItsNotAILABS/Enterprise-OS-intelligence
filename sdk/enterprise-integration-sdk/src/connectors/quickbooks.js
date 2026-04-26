import { BaseConnector } from './base-connector.js';

/**
 * QuickBooks Online connector.
 * Supported entities: customers, invoices, expenses, accounts
 */
export class QuickBooksConnector extends BaseConnector {
  name = 'quickbooks';
  supportedEntities = new Set(['customers', 'invoices', 'expenses', 'accounts']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['customers', []],
    ['invoices', []],
    ['expenses', []],
    ['accounts', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { realmId?: string, environment?: 'sandbox'|'production' }} config
   */
  constructor(config = {}) {
    super(config);
    this.realmId = config.realmId ?? '';
    this.environment = config.environment ?? 'production';
    this.baseUrl =
      config.baseUrl ??
      (this.environment === 'sandbox'
        ? 'https://sandbox-quickbooks.api.intuit.com/v3/company'
        : 'https://quickbooks.api.intuit.com/v3/company');
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, realmId: this.realmId, environment: this.environment };
  }

  /**
   * QuickBooks v3 REST sync with startPosition pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[quickbooks] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[quickbooks] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter(
        (r) => new Date(r.MetaData?.LastUpdatedTime ?? r.updatedAt) >= sinceDate,
      );
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
      startPosition: filtered.length + 1,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map QuickBooks field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const qbAliases = {
      Id: 'id',
      DisplayName: 'name',
      PrimaryEmailAddr: 'email',
      PrimaryPhone: 'phone',
      TxnDate: 'transactionDate',
      TotalAmt: 'amount',
      Balance: 'balance',
      AccountType: 'accountType',
      FullyQualifiedName: 'accountName',
    };

    const extraMappings = [];
    for (const [qbField, alias] of Object.entries(qbAliases)) {
      const inSource = sourceSchema[qbField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === qbField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: qbField, target: alias });
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

export default QuickBooksConnector;
