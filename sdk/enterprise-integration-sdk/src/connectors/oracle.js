import { BaseConnector } from './base-connector.js';

/**
 * Oracle ERP connector.
 * Supported entities: invoices, purchase_orders, employees, financial_periods
 */
export class OracleConnector extends BaseConnector {
  name = 'oracle';
  supportedEntities = new Set(['invoices', 'purchase_orders', 'employees', 'financial_periods']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['invoices', []],
    ['purchase_orders', []],
    ['employees', []],
    ['financial_periods', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { serviceUrl?: string, username?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.serviceUrl = config.serviceUrl ?? 'https://your-tenant.oraclecloud.com';
    this.username = config.username ?? '';
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, serviceUrl: this.serviceUrl };
  }

  /**
   * Oracle REST/SOAP sync with cursor-based pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[oracle] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[oracle] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
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
      cursor: filtered.length > 0 ? `oracle-cursor-${Date.now()}` : null,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map Oracle field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const oracleAliases = {
      InvoiceId: 'invoiceId',
      InvoiceNumber: 'invoiceNumber',
      InvoiceAmount: 'amount',
      SupplierName: 'supplierName',
      PurchaseOrderNumber: 'purchaseOrderNumber',
      EmployeeNumber: 'employeeId',
      PersonFullName: 'fullName',
      BusinessUnit: 'businessUnit',
      LedgerName: 'ledger',
      PeriodName: 'periodName',
    };

    const extraMappings = [];
    for (const [oracleField, alias] of Object.entries(oracleAliases)) {
      const inSource = sourceSchema[oracleField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === oracleField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: oracleField, target: alias });
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

export default OracleConnector;
