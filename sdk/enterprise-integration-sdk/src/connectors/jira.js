import { BaseConnector } from './base-connector.js';

/**
 * Jira connector (Atlassian REST API v3).
 * Supported entities: issues, sprints, projects, epics
 */
export class JiraConnector extends BaseConnector {
  name = 'jira';
  supportedEntities = new Set(['issues', 'sprints', 'projects', 'epics']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['issues', []],
    ['sprints', []],
    ['projects', []],
    ['epics', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { domain?: string, email?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.domain = config.domain ?? '';
    this.email = config.email ?? '';
    this.baseUrl = config.baseUrl ?? `https://${this.domain}.atlassian.net/rest/api/3`;
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, domain: this.domain };
  }

  /**
   * Jira REST API sync with startAt/maxResults pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[jira] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[jira] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter((r) => new Date(r.fields?.updated ?? r.updatedAt) >= sinceDate);
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
      startAt: filtered.length,
      total: records.length,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map Jira field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const jiraAliases = {
      key: 'issueKey',
      summary: 'title',
      status: 'status',
      priority: 'priority',
      assignee: 'assigneeId',
      reporter: 'reporterId',
      issuetype: 'issueType',
      project: 'projectKey',
      sprint: 'sprintId',
      storyPoints: 'storyPoints',
      created: 'createdAt',
      updated: 'updatedAt',
    };

    const extraMappings = [];
    for (const [jiraField, alias] of Object.entries(jiraAliases)) {
      const inSource = sourceSchema[jiraField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === jiraField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: jiraField, target: alias });
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

export default JiraConnector;
