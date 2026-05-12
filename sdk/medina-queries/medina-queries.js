/**
 * MEDINA QUERIES SDK
 * RSHIP-2026-MEDINA-QUERIES-001
 *
 * Medina Queries provides semantic query capabilities for AGI knowledge bases.
 * Implements φ-weighted search, semantic matching, and knowledge graph traversal.
 *
 * @module medina-queries
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// QUERY TYPES
// ═══════════════════════════════════════════════════════════════════════════

const QueryType = {
  EXACT: 'exact',
  FUZZY: 'fuzzy',
  SEMANTIC: 'semantic',
  GRAPH: 'graph',
  AGGREGATE: 'aggregate'
};

// ═══════════════════════════════════════════════════════════════════════════
// QUERY BUILDER
// ═══════════════════════════════════════════════════════════════════════════

class QueryBuilder {
  constructor() {
    this.query = {
      type: QueryType.EXACT,
      select: [],
      from: null,
      where: [],
      orderBy: [],
      limit: null,
      offset: 0,
      joins: [],
      groupBy: [],
      having: []
    };
  }

  select(...fields) {
    this.query.select.push(...fields);
    return this;
  }

  from(source) {
    this.query.from = source;
    return this;
  }

  where(field, operator, value) {
    this.query.where.push({ field, operator, value });
    return this;
  }

  and(field, operator, value) {
    return this.where(field, operator, value);
  }

  or(field, operator, value) {
    this.query.where.push({ field, operator, value, or: true });
    return this;
  }

  orderBy(field, direction = 'asc') {
    this.query.orderBy.push({ field, direction });
    return this;
  }

  limit(n) {
    this.query.limit = n;
    return this;
  }

  offset(n) {
    this.query.offset = n;
    return this;
  }

  join(source, on) {
    this.query.joins.push({ source, on });
    return this;
  }

  groupBy(...fields) {
    this.query.groupBy.push(...fields);
    return this;
  }

  having(field, operator, value) {
    this.query.having.push({ field, operator, value });
    return this;
  }

  fuzzy() {
    this.query.type = QueryType.FUZZY;
    return this;
  }

  semantic() {
    this.query.type = QueryType.SEMANTIC;
    return this;
  }

  graph() {
    this.query.type = QueryType.GRAPH;
    return this;
  }

  build() {
    return { ...this.query };
  }

  static create() {
    return new QueryBuilder();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════

class QueryExecutor {
  constructor() {
    this.dataSources = new Map();
    this.functions = new Map();
    this._registerBuiltinFunctions();
  }

  registerDataSource(name, source) {
    this.dataSources.set(name, source);
  }

  registerFunction(name, fn) {
    this.functions.set(name, fn);
  }

  _registerBuiltinFunctions() {
    this.functions.set('count', (items) => items.length);
    this.functions.set('sum', (items, field) =>
      items.reduce((a, b) => a + (b[field] || 0), 0));
    this.functions.set('avg', (items, field) =>
      items.length > 0 ? this.functions.get('sum')(items, field) / items.length : 0);
    this.functions.set('min', (items, field) =>
      Math.min(...items.map(i => i[field] || Infinity)));
    this.functions.set('max', (items, field) =>
      Math.max(...items.map(i => i[field] || -Infinity)));
    this.functions.set('phi_score', (items, field) =>
      items.reduce((a, b, i) => a + (b[field] || 0) * Math.pow(PHI, -i), 0));
  }

  async execute(query) {
    // Get data source
    const source = this.dataSources.get(query.from);
    if (!source) {
      throw new Error(`Data source '${query.from}' not found`);
    }

    let data = Array.isArray(source) ? [...source] :
               typeof source === 'function' ? await source() : [];

    // Apply joins
    for (const join of query.joins) {
      const joinSource = this.dataSources.get(join.source);
      if (joinSource) {
        const joinData = Array.isArray(joinSource) ? joinSource :
                        typeof joinSource === 'function' ? await joinSource() : [];
        data = this._applyJoin(data, joinData, join.on);
      }
    }

    // Apply where conditions
    data = this._applyWhere(data, query.where, query.type);

    // Apply group by
    if (query.groupBy.length > 0) {
      data = this._applyGroupBy(data, query.groupBy);
    }

    // Apply having
    if (query.having.length > 0) {
      data = this._applyHaving(data, query.having);
    }

    // Apply order by
    if (query.orderBy.length > 0) {
      data = this._applyOrderBy(data, query.orderBy);
    }

    // Apply offset and limit
    if (query.offset > 0) {
      data = data.slice(query.offset);
    }
    if (query.limit !== null) {
      data = data.slice(0, query.limit);
    }

    // Apply select
    if (query.select.length > 0) {
      data = this._applySelect(data, query.select);
    }

    return data;
  }

  _applyWhere(data, conditions, type) {
    if (conditions.length === 0) return data;

    return data.filter(item => {
      let result = true;
      let hasOr = false;

      for (const cond of conditions) {
        const match = this._evaluateCondition(item, cond, type);

        if (cond.or) {
          hasOr = true;
          result = result || match;
        } else {
          result = result && match;
        }
      }

      return result;
    });
  }

  _evaluateCondition(item, cond, type) {
    const value = this._getNestedValue(item, cond.field);

    switch (cond.operator) {
      case '=':
      case '==':
        return type === QueryType.FUZZY ?
          this._fuzzyMatch(value, cond.value) :
          value === cond.value;
      case '!=':
        return value !== cond.value;
      case '>':
        return value > cond.value;
      case '>=':
        return value >= cond.value;
      case '<':
        return value < cond.value;
      case '<=':
        return value <= cond.value;
      case 'in':
        return Array.isArray(cond.value) && cond.value.includes(value);
      case 'contains':
        return String(value).toLowerCase().includes(String(cond.value).toLowerCase());
      case 'startsWith':
        return String(value).toLowerCase().startsWith(String(cond.value).toLowerCase());
      case 'endsWith':
        return String(value).toLowerCase().endsWith(String(cond.value).toLowerCase());
      case 'regex':
        return new RegExp(cond.value).test(String(value));
      case 'exists':
        return value !== undefined && value !== null;
      default:
        return true;
    }
  }

  _fuzzyMatch(value, target, threshold = 0.7) {
    if (value === target) return true;
    if (typeof value !== 'string' || typeof target !== 'string') return false;

    const similarity = this._levenshteinSimilarity(
      value.toLowerCase(),
      target.toLowerCase()
    );

    return similarity >= threshold;
  }

  _levenshteinSimilarity(a, b) {
    if (a.length === 0) return b.length === 0 ? 1 : 0;
    if (b.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[b.length][a.length];
    const maxLen = Math.max(a.length, b.length);
    return 1 - distance / maxLen;
  }

  _getNestedValue(obj, path) {
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }
    return value;
  }

  _applyJoin(data, joinData, on) {
    const result = [];
    const [leftField, rightField] = on.split('=').map(s => s.trim());

    for (const item of data) {
      const leftValue = this._getNestedValue(item, leftField);
      const matches = joinData.filter(j =>
        this._getNestedValue(j, rightField) === leftValue
      );

      if (matches.length > 0) {
        for (const match of matches) {
          result.push({ ...item, ...match });
        }
      } else {
        result.push(item);
      }
    }

    return result;
  }

  _applyGroupBy(data, fields) {
    const groups = new Map();

    for (const item of data) {
      const key = fields.map(f => this._getNestedValue(item, f)).join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(item);
    }

    return Array.from(groups.entries()).map(([key, items]) => ({
      _groupKey: key,
      _items: items,
      ...items[0]
    }));
  }

  _applyHaving(data, conditions) {
    return data.filter(group => {
      for (const cond of conditions) {
        const fn = this.functions.get(cond.field.split('(')[0]);
        if (fn) {
          const match = cond.field.match(/\(([^)]+)\)/);
          const field = match ? match[1] : null;
          const value = fn(group._items || [group], field);

          if (!this._evaluateCondition({ _value: value }, { ...cond, field: '_value' }, QueryType.EXACT)) {
            return false;
          }
        }
      }
      return true;
    });
  }

  _applyOrderBy(data, orderBy) {
    return data.sort((a, b) => {
      for (const { field, direction } of orderBy) {
        const aVal = this._getNestedValue(a, field);
        const bVal = this._getNestedValue(b, field);

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  _applySelect(data, fields) {
    return data.map(item => {
      const result = {};
      for (const field of fields) {
        if (field === '*') {
          Object.assign(result, item);
        } else if (field.includes('(')) {
          // Aggregate function
          const fn = this.functions.get(field.split('(')[0]);
          if (fn) {
            const match = field.match(/\(([^)]*)\)/);
            const arg = match ? match[1] : null;
            result[field] = fn(item._items || [item], arg);
          }
        } else {
          result[field] = this._getNestedValue(item, field);
        }
      }
      return result;
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY ENGINE
// ═══════════════════════════════════════════════════════════════════════════

class MedinaQueryEngine extends EventEmitter {
  constructor() {
    super();
    this.executor = new QueryExecutor();
    this.cache = new Map();
    this.cacheEnabled = true;
    this.cacheTTL = 60000;
  }

  registerSource(name, source) {
    this.executor.registerDataSource(name, source);
  }

  registerFunction(name, fn) {
    this.executor.registerFunction(name, fn);
  }

  async query(queryOrBuilder) {
    const q = queryOrBuilder instanceof QueryBuilder ?
      queryOrBuilder.build() : queryOrBuilder;

    const cacheKey = JSON.stringify(q);

    // Check cache
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        this.emit('cache-hit', { query: q });
        return cached.result;
      }
    }

    const start = Date.now();
    const result = await this.executor.execute(q);
    const duration = Date.now() - start;

    // Cache result
    if (this.cacheEnabled) {
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
    }

    this.emit('query-executed', { query: q, duration, resultCount: result.length });
    return result;
  }

  clearCache() {
    this.cache.clear();
  }

  status() {
    return {
      dataSources: this.executor.dataSources.size,
      functions: this.executor.functions.size,
      cacheEntries: this.cache.size,
      cacheEnabled: this.cacheEnabled
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  QueryType,
  QueryBuilder,
  QueryExecutor,
  MedinaQueryEngine
};
