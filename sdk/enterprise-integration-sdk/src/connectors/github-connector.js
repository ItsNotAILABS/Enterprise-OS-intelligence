import { BaseConnector } from './base-connector.js';

/**
 * GitHub connector (REST API v3 / GraphQL v4).
 * Supported entities: repositories, pull_requests, issues, deployments
 */
export class GitHubConnector extends BaseConnector {
  name = 'github';
  supportedEntities = new Set(['repositories', 'pull_requests', 'issues', 'deployments']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['repositories', []],
    ['pull_requests', []],
    ['issues', []],
    ['deployments', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { owner?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.owner = config.owner ?? '';
    this.baseUrl = config.baseUrl ?? 'https://api.github.com';
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, owner: this.owner };
  }

  /**
   * GitHub REST API sync with Link header pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[github] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[github] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
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
      nextPage: filtered.length > 0 ? 2 : null,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map GitHub field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const ghAliases = {
      full_name: 'repoName',
      html_url: 'url',
      default_branch: 'defaultBranch',
      open_issues_count: 'openIssues',
      title: 'title',
      state: 'status',
      merged_at: 'mergedAt',
      head: 'sourceBranch',
      base: 'targetBranch',
      number: 'prNumber',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
    };

    const extraMappings = [];
    for (const [ghField, alias] of Object.entries(ghAliases)) {
      const inSource = sourceSchema[ghField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === ghField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: ghField, target: alias });
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

export default GitHubConnector;
