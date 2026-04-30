# @medina/protocol-composer

**Protocol Composition Engine**

> *Compose multiple intelligence protocols with φ-weighted synchronization.*

## Overview

A composition engine for orchestrating multiple intelligence protocols together with dependency management, execution ordering, and phase synchronization.

- Dependency-aware execution
- φ-weighted phase synchronization
- Composition patterns (chain, parallel, fan-out, fan-in)
- Self-bootstrapping (immediately active on creation)
- 873ms heartbeat for sync updates

## Installation

```bash
npm install @medina/protocol-composer
```

## Quick Start

```javascript
import { createComposer } from '@medina/protocol-composer';

// Create composer — immediately active
const composer = createComposer();

// Register protocols with dependencies
composer
  .registerProtocol('neural-sync', neuralSyncProtocol, [])
  .registerProtocol('memory', memoryProtocol, ['neural-sync'])
  .registerProtocol('decision', decisionProtocol, ['memory', 'neural-sync']);

// Execute in dependency order
const results = composer.executeAll({ input: 'data' });
```

## API Reference

### createComposer(config)

Create a new protocol composer.

```javascript
import { createComposer } from '@medina/protocol-composer';

const composer = createComposer();
```

### registerProtocol(name, protocol, dependencies)

Register a protocol with optional dependencies.

```javascript
composer.registerProtocol('neural-sync', neuralProtocol, []);
composer.registerProtocol('memory', memoryProtocol, ['neural-sync']);
```

**Parameters:**
- `name` - Protocol name
- `protocol` - Protocol object (must have `execute(input)` method)
- `dependencies` - Array of protocol names this depends on

### execute(protocolName, input)

Execute a single protocol with its dependencies.

```javascript
const result = composer.execute('memory', { data: [1, 2, 3] });
```

Returns the protocol's output.

### executeAll(input)

Execute all active protocols in dependency order.

```javascript
const results = composer.executeAll({ timestamp: Date.now() });

console.log(results);
// {
//   'neural-sync': { ... },
//   'memory': { ... },
//   'decision': { ... }
// }
```

### Composition Patterns

#### chain(protocols)

Connect protocols in sequence: A → B → C

```javascript
composer.chain(['neural-sync', 'memory', 'decision']);
```

#### parallel(protocols)

Execute protocols simultaneously (no dependencies).

```javascript
composer.parallel(['protocol-a', 'protocol-b', 'protocol-c']);
```

#### fanOut(source, targets)

One protocol feeds multiple: A → [B, C, D]

```javascript
composer.fanOut('neural-sync', ['memory', 'learning', 'decision']);
```

#### fanIn(sources, target)

Multiple protocols feed one: [A, B, C] → D

```javascript
composer.fanIn(['neural-sync', 'memory', 'learning'], 'decision');
```

### Synchronization

#### syncPhase(protocol1, protocol2)

Calculate φ-weighted phase synchronization between two protocols.

```javascript
const sync = composer.syncPhase('neural-sync', 'memory');
console.log(sync);  // 0.0 to 1.0
```

Returns synchronization coefficient (1.0 = perfectly in phase).

#### getSyncMatrix()

Get full synchronization matrix for all protocols.

```javascript
const matrix = composer.getSyncMatrix();
console.log(matrix);
// {
//   'neural-sync': {
//     'neural-sync': 1.0,
//     'memory': 0.8234,
//     'decision': 0.7123
//   },
//   'memory': { ... },
//   ...
// }
```

### Metrics

#### getMetrics()

Get composer performance metrics.

```javascript
const metrics = composer.getMetrics();
console.log(metrics);
// {
//   totalProtocols: 5,
//   activeProtocols: 4,
//   totalExecutions: 234,
//   avgExecTimeMs: 12.4,
//   currentBeat: 127,
//   phiRatio: 1.295
// }
```

#### getProtocolState(name)

Get state of a specific protocol.

```javascript
const state = composer.getProtocolState('memory');
console.log(state);
// {
//   name: 'memory',
//   active: true,
//   dependencies: ['neural-sync'],
//   execCount: 47,
//   lastExecTime: 13.2,
//   lastOutput: { ... }
// }
```

#### getAllStates()

Get states of all protocols.

```javascript
const states = composer.getAllStates();
```

### Control

#### activateProtocol(name)

Activate a protocol.

```javascript
composer.activateProtocol('memory');
```

#### deactivateProtocol(name)

Deactivate a protocol (won't execute).

```javascript
composer.deactivateProtocol('decision');
```

### Composition Graph

#### getCompositionGraph()

Get the full dependency graph.

```javascript
const graph = composer.getCompositionGraph();
console.log(graph);
// Map {
//   'neural-sync' => {
//     protocol: 'neural-sync',
//     dependencies: [],
//     dependents: ['memory', 'decision']
//   },
//   'memory' => {
//     protocol: 'memory',
//     dependencies: ['neural-sync'],
//     dependents: ['decision']
//   },
//   ...
// }
```

## Examples

### Simple Chain

```javascript
import { createComposer } from '@medina/protocol-composer';

const composer = createComposer();

// Register protocols
composer
  .registerProtocol('input', inputProtocol, [])
  .registerProtocol('process', processProtocol, [])
  .registerProtocol('output', outputProtocol, []);

// Create chain
composer.chain(['input', 'process', 'output']);

// Execute
const results = composer.executeAll({ data: 'hello' });
```

### Parallel Processing

```javascript
const composer = createComposer();

// Register parallel protocols
composer
  .registerProtocol('analyze-a', analyzerA, [])
  .registerProtocol('analyze-b', analyzerB, [])
  .registerProtocol('analyze-c', analyzerC, []);

// Mark as parallel
composer.parallel(['analyze-a', 'analyze-b', 'analyze-c']);

// All execute simultaneously
const results = composer.executeAll({ input: 'data' });
```

### Fan-Out Pattern

```javascript
const composer = createComposer();

composer
  .registerProtocol('source', sourceProtocol, [])
  .registerProtocol('branch-1', branch1Protocol, [])
  .registerProtocol('branch-2', branch2Protocol, [])
  .registerProtocol('branch-3', branch3Protocol, []);

// One source, multiple branches
composer.fanOut('source', ['branch-1', 'branch-2', 'branch-3']);

const results = composer.executeAll({ input: 'data' });
```

### Fan-In Pattern

```javascript
const composer = createComposer();

composer
  .registerProtocol('input-a', inputA, [])
  .registerProtocol('input-b', inputB, [])
  .registerProtocol('input-c', inputC, [])
  .registerProtocol('aggregator', aggregator, []);

// Multiple inputs, one aggregator
composer.fanIn(['input-a', 'input-b', 'input-c'], 'aggregator');

const results = composer.executeAll({ timestamp: Date.now() });
```

### Complex Composition

```javascript
const composer = createComposer();

// Register all protocols
composer
  .registerProtocol('sensor', sensorProtocol, [])
  .registerProtocol('neural', neuralProtocol, ['sensor'])
  .registerProtocol('memory', memoryProtocol, ['neural'])
  .registerProtocol('learning', learningProtocol, ['neural'])
  .registerProtocol('decision', decisionProtocol, ['memory', 'learning']);

// sensor → neural → [memory, learning] → decision

const results = composer.executeAll({ timestamp: Date.now() });
console.log(results);
```

### Phase Synchronization

```javascript
const composer = createComposer();

// Register protocols
composer
  .registerProtocol('oscillator-a', oscA, [])
  .registerProtocol('oscillator-b', oscB, []);

// Run them for a while
for (let i = 0; i < 100; i++) {
  composer.execute('oscillator-a', {});
  composer.execute('oscillator-b', {});
}

// Check synchronization
const sync = composer.syncPhase('oscillator-a', 'oscillator-b');
console.log(`Phase sync: ${sync.toFixed(4)}`);

// Get full matrix
const matrix = composer.getSyncMatrix();
console.log(matrix);
```

## The Mathematics

### φ-Weighted Phase Synchronization

Each protocol's execution count is converted to a phase:

```
phase = (execCount × φ) mod 2π
```

Synchronization between two protocols:

```
sync = cos(|phase₁ - phase₂|) × φ⁻¹
```

Range: [0, φ⁻¹] where φ⁻¹ ≈ 0.618

### Execution Order

Protocols are executed using topological sort (Kahn's algorithm) based on dependency graph. This ensures dependencies always execute before dependents.

## Self-Bootstrapping Architecture

The composer follows MEDINA's core principle:

**Creation IS Activation**

```javascript
// ❌ Old way
const composer = new Composer();
await composer.initialize();
await composer.start();

// ✅ MEDINA way
const composer = createComposer();
// Already running, already synchronizing
```

The 873ms heartbeat starts immediately on construction.

## License

See [LICENSE](../../LICENSE) - © 2026 Alfredo Medina Hernandez

## Related

- `@medina/medina-heart` - Self-bootstrapping biological heart
- `@medina/organism-ai` - Multi-model AI orchestration
- `@medina/medina-registry` - Sovereign package registry

---

*Protocol composition. φ-weighted synchronization. Dependency management.*
