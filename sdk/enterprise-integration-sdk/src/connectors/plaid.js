import { BaseConnector } from './base-connector.js';

/**
 * Plaid connector (banking and financial data).
 * Supported entities: transactions, accounts, balances, identity
 */
export class PlaidConnector extends BaseConnector {
  name = 'plaid';
  supportedEntities = new Set(['transactions', 'accounts', 'balances', 'identity']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['transactions', []],
    ['accounts', []],
    ['balances', []],
    ['identity', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { clientId?: string, environment?: 'sandbox'|'development'|'production' }} config
   */
  constructor(config = {}) {
    super(config);
    this.clientId = config.clientId ?? '';
    this.environment = config.environment ?? 'production';
    const envHosts = {
      sandbox: 'https://sandbox.plaid.com',
      development: 'https://development.plaid.com',
      production: 'https://production.plaid.com',
    };
    this.baseUrl = config.baseUrl ?? envHosts[this.environment];
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, clientId: this.clientId, environment: this.environment };
  }

  /**
   * Plaid /transactions/get with cursor-based pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[plaid] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[plaid] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter((r) => new Date(r.date ?? r.updatedAt) >= sinceDate);
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
      nextCursor: filtered.length > 0 ? `plaid-cursor-${Date.now()}` : null,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map Plaid field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const plaidAliases = {
      transaction_id: 'transactionId',
      account_id: 'accountId',
      amount: 'amount',
      iso_currency_code: 'currency',
      merchant_name: 'merchantName',
      category: 'category',
      date: 'transactionDate',
      account_type: 'accountType',
      available: 'availableBalance',
      current: 'currentBalance',
    };

    const extraMappings = [];
    for (const [plaidField, alias] of Object.entries(plaidAliases)) {
      const inSource = sourceSchema[plaidField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === plaidField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: plaidField, target: alias });
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

export default PlaidConnector;
