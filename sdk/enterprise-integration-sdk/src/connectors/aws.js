import { BaseConnector } from './base-connector.js';

/**
 * AWS connector (SDK-based).
 * Supported entities: ec2_instances, s3_buckets, lambda_functions, cost_explorer
 */
export class AWSConnector extends BaseConnector {
  name = 'aws';
  supportedEntities = new Set(['ec2_instances', 's3_buckets', 'lambda_functions', 'cost_explorer']);

  /** @type {Map<string, Object[]>} */
  _store = new Map([
    ['ec2_instances', []],
    ['s3_buckets', []],
    ['lambda_functions', []],
    ['cost_explorer', []],
  ]);

  /**
   * @param {import('./base-connector.js').ConnectorConfig & { region?: string, accessKeyId?: string }} config
   */
  constructor(config = {}) {
    super(config);
    this.region = config.region ?? 'us-east-1';
    this.accessKeyId = config.accessKeyId ?? '';
  }

  /** @override */
  async connect() {
    const result = await super.connect();
    return { ...result, region: this.region };
  }

  /**
   * AWS SDK-style sync with NextToken pagination.
   * @override
   */
  async sync(direction, entity, options = {}) {
    if (!this.connected) throw new Error('[aws] connector is not connected');
    if (!this.supportedEntities.has(entity)) {
      throw new Error(
        `[aws] unsupported entity "${entity}". Supported: ${[...this.supportedEntities].join(', ')}`,
      );
    }

    const serviceMap = {
      ec2_instances: 'EC2::DescribeInstances',
      s3_buckets: 'S3::ListBuckets',
      lambda_functions: 'Lambda::ListFunctions',
      cost_explorer: 'CostExplorer::GetCostAndUsage',
    };

    const records = this._store.get(entity) ?? [];
    let filtered = records;

    if (options.since) {
      const sinceDate = new Date(options.since);
      filtered = records.filter((r) => new Date(r.LaunchTime ?? r.updatedAt) >= sinceDate);
    }
    if (options.limit && options.limit < filtered.length) {
      filtered = filtered.slice(0, options.limit);
    }

    return {
      connectorId: this.id,
      entity,
      service: serviceMap[entity],
      direction,
      recordsSynced: filtered.length,
      records: direction === 'inbound' ? filtered : undefined,
      nextToken: filtered.length > 0 ? `aws-token-${Date.now()}` : null,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Map AWS field names to the internal schema.
   * @override
   */
  mapFields(sourceSchema, targetSchema) {
    const base = super.mapFields(sourceSchema, targetSchema);

    const awsAliases = {
      InstanceId: 'instanceId',
      InstanceType: 'instanceType',
      State: 'status',
      LaunchTime: 'launchedAt',
      PublicIpAddress: 'publicIp',
      FunctionName: 'functionName',
      Runtime: 'runtime',
      MemorySize: 'memorySizeMb',
      LastModified: 'updatedAt',
      BucketName: 'bucketName',
      CreationDate: 'createdAt',
    };

    const extraMappings = [];
    for (const [awsField, alias] of Object.entries(awsAliases)) {
      const inSource = sourceSchema[awsField] !== undefined;
      const aliasInTarget = targetSchema[alias] !== undefined;
      const alreadyMapped = base.auto.some((m) => m.source === awsField);

      if (inSource && aliasInTarget && !alreadyMapped) {
        extraMappings.push({ source: awsField, target: alias });
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

export default AWSConnector;
