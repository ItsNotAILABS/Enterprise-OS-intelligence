# @medina/medina-queries

**Query Operations for Intelligence Data**

> *φ-weighted querying, filtering, and aggregation for intelligence modules.*

## Overview

A powerful query engine for intelligence data with φ-weighted algorithms for fuzzy matching, time-series analysis, and multi-source search.

- φ-weighted fuzzy matching
- Time-series φ-EMA and moving averages
- Multi-source intelligence search
- Query builder with method chaining
- No external dependencies

## Installation

```bash
npm install @medina/medina-queries
```

## Quick Start

```javascript
import { query, createQueryEngine, timeSeries } from '@medina/medina-queries';

// Query an array
const results = query(myData)
  .where(item => item.score > 0.5)
  .fuzzyMatch('name', 'neural')
  .orderByPhi('reputation')
  .limit(10)
  .execute();

// Create an intelligence query engine
const engine = createQueryEngine();
engine.registerProtocol('neural-sync', neuralProtocol);
engine.registerModule('memory', memoryModule);

const searchResults = engine.search('synchronization');
```

## API Reference

### query(source)

Create a query builder for an array of data.

```javascript
import { query } from '@medina/medina-queries';

const results = query(users)
  .where(u => u.age > 18)
  .orderBy('name', 'asc')
  .limit(5)
  .execute();
```

**Methods:**
- `where(predicate)` - Filter with predicate function
- `fuzzyMatch(field, query, threshold)` - φ-weighted fuzzy matching
- `orderBy(field, order)` - Sort by field ('asc' or 'desc')
- `orderByPhi(field)` - Sort with φ-weighting (higher scores first)
- `limit(count)` - Limit results
- `offset(count)` - Skip results
- `execute()` - Execute query and return results
- `aggregate()` - Execute and return aggregated statistics

### Fuzzy Matching

φ-weighted fuzzy string matching with configurable threshold.

```javascript
const results = query(protocols)
  .fuzzyMatch('description', 'neural network', 0.6)
  .execute();
```

Default threshold is φ⁻¹ ≈ 0.618.

### Aggregation

Get φ-weighted statistics:

```javascript
const stats = query(models)
  .where(m => m.active)
  .aggregate();

console.log(stats);
// {
//   count: 23,
//   phiMean: 0.7823,
//   phiSum: 17.989,
//   phiMax: 1.4562,
//   phiMin: 0.3854,
//   data: [...]
// }
```

### createQueryEngine()

Create an intelligence query engine for multi-source search.

```javascript
import { createQueryEngine } from '@medina/medina-queries';

const engine = createQueryEngine();

// Register data sources
engine.registerProtocol('neural-sync', neuralSyncProtocol);
engine.registerModule('memory', cognitiveMemory);
engine.registerAgent('analyst', analystAgent);
engine.addMemory({ content: 'Important insight', tags: ['learning'] });

// Query specific sources
const protocols = engine.queryProtocols()
  .where(p => p.active)
  .execute();

const modules = engine.queryModules()
  .fuzzyMatch('name', 'cognitive')
  .execute();

// Search across all sources
const results = engine.search('synchronization');
console.log(results);
// {
//   protocols: [{ name: '...', data: {...}, score: 2.43 }],
//   modules: [{ name: '...', data: {...}, score: 1.89 }],
//   agents: [...],
//   memories: [...]
// }
```

**Methods:**
- `registerProtocol(name, protocol)` - Register a protocol
- `registerModule(name, module)` - Register a module
- `registerAgent(name, agent)` - Register an agent
- `addMemory(memory)` - Add a memory entry
- `queryProtocols()` - Get QueryBuilder for protocols
- `queryModules()` - Get QueryBuilder for modules
- `queryAgents()` - Get QueryBuilder for agents
- `queryMemories()` - Get QueryBuilder for memories
- `search(query, threshold)` - Search across all sources
- `getStats()` - Get engine statistics

### timeSeries(data)

Create a time-series query engine for φ-weighted analysis.

```javascript
import { timeSeries } from '@medina/medina-queries';

const ts = timeSeries(heartbeatData);

// φ-windowed moving average
const smoothed = ts.phiMovingAverage('heartRate', 7).getData();

// φ-exponential moving average
const ema = ts.phiEMA('heartRate', 0.618).getData();
```

**Methods:**
- `phiMovingAverage(field, windowSize)` - φ-weighted MA
- `phiEMA(field, alpha)` - φ-exponential MA (default α = φ⁻¹)
- `getData()` - Get processed data

## Examples

### Protocol Query

```javascript
import { createQueryEngine } from '@medina/medina-queries';

const engine = createQueryEngine();

// Register protocols
engine.registerProtocol('neural-sync', neuralProtocol);
engine.registerProtocol('emergence', emergenceProtocol);
engine.registerProtocol('memory', memoryProtocol);

// Find active protocols with high reputation
const activeProtocols = engine.queryProtocols()
  .where(p => p.active && p.reputation > 0.8)
  .orderByPhi('reputation')
  .execute();

console.log(`Found ${activeProtocols.length} high-reputation protocols`);
```

### Fuzzy Search

```javascript
import { query } from '@medina/medina-queries';

const agents = [
  { name: 'neural-agent', type: 'reasoning' },
  { name: 'memory-agent', type: 'storage' },
  { name: 'neuro-processor', type: 'computation' },
];

// Find agents with 'neur' in name (fuzzy)
const results = query(agents)
  .fuzzyMatch('name', 'neur', 0.5)
  .execute();

// Returns: neural-agent, neuro-processor
```

### Time-Series Analysis

```javascript
import { timeSeries } from '@medina/medina-queries';

const heartbeats = [
  { timestamp: 0, rate: 2.3 },
  { timestamp: 873, rate: 2.5 },
  { timestamp: 1746, rate: 2.4 },
  { timestamp: 2619, rate: 2.6 },
  // ...
];

// Calculate φ-EMA
const smoothed = timeSeries(heartbeats)
  .phiEMA('rate')
  .getData();

smoothed.forEach(beat => {
  console.log(`Beat at ${beat.timestamp}: ${beat.rate_phi_ema}`);
});
```

### Multi-Source Search

```javascript
import { createQueryEngine } from '@medina/medina-queries';

const engine = createQueryEngine();

// Register all intelligence components
engine.registerProtocol('neural', neuralProtocol);
engine.registerProtocol('cognitive', cognitiveProtocol);
engine.registerModule('memory', memoryModule);
engine.registerAgent('analyst', analystAgent);

// Search across everything
const results = engine.search('learning', 0.5);

console.log(`Protocols: ${results.protocols.length}`);
console.log(`Modules: ${results.modules.length}`);
console.log(`Agents: ${results.agents.length}`);
console.log(`Memories: ${results.memories.length}`);

// Top result from each category
if (results.protocols.length > 0) {
  console.log(`Top protocol: ${results.protocols[0].name} (score: ${results.protocols[0].score})`);
}
```

### Aggregation

```javascript
import { query } from '@medina/medina-queries';

const models = [
  { name: 'gpt-4', reputation: 0.85, tasks: 234 },
  { name: 'claude-3', reputation: 0.88, tasks: 189 },
  { name: 'gemini', reputation: 0.82, tasks: 156 },
];

// Get φ-weighted statistics
const stats = query(models)
  .aggregate();

console.log(stats);
// {
//   count: 3,
//   phiMean: 0.5283,  // φ-weighted mean
//   phiSum: 1.585,    // φ-weighted sum
//   phiMax: 1.423,    // reputation × φ
//   phiMin: 1.326,
//   data: [...]
// }
```

## The Mathematics

### φ-Weighted Fuzzy Matching

```
score = (matches / query_length) × φ⁻¹
```

Where matches is the count of query characters found in the target string.

### φ-Exponential Moving Average

```
EMA[t] = α × value[t] + (1 - α) × EMA[t-1]
```

Default α = φ⁻¹ ≈ 0.618

### φ-Weighted Aggregations

```
phi_mean = (sum / count) × φ⁻¹
phi_sum = sum × φ⁻¹
phi_max = max × φ
phi_min = min × φ
```

## Performance

- All queries operate in-memory
- No database required
- O(n) filtering and searching
- O(n log n) sorting
- φ-weighted algorithms add minimal overhead

## License

See [LICENSE](../../LICENSE) - © 2026 Alfredo Medina Hernandez

## Related

- `@medina/organism-ai` - Multi-model AI orchestration
- `@medina/protocol-composer` - Protocol composition
- `@medina/medina-registry` - Sovereign package registry

---

*φ-weighted queries. Fuzzy matching. Time-series analysis.*
