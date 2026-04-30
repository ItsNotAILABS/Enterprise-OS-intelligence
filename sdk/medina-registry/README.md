# @medina/medina-registry

**Sovereign Private Registry — Your Own Git/NPM**

> *YOUR package registry. Not npm. Not GitHub. YOURS.*

## Overview

A sovereign, independent package registry for MEDINA SDKs. Publish, install, and manage packages without external dependencies or central authorities.

Runs entirely in JavaScript — works in browsers, Node.js, Edge workers, and ICP canisters.

## Installation

```bash
npm install @medina/medina-registry
```

## Quick Start

```javascript
import { getRegistry, publish, install, list } from '@medina/medina-registry';

// Get the sovereign registry
const registry = getRegistry();

// Publish your own SDK
publish({
  name: '@medina/my-custom-ai',
  version: '1.0.0',
  description: 'My custom AI SDK',
  keywords: ['ai', 'custom'],
}, myModuleExports);

// Install from registry
const sdk = install('@medina/medina-heart');

// List all packages
const packages = list();
console.log(packages);
```

## Core Functions

### getRegistry()

Get the global sovereign registry instance.

```javascript
import { getRegistry } from '@medina/medina-registry';

const registry = getRegistry();
console.log(registry.getStats());
```

### publish(packageInfo, exports)

Publish a package to the registry.

```javascript
import { publish } from '@medina/medina-registry';

const result = publish({
  name: '@medina/my-sdk',
  version: '1.0.0',
  description: 'My SDK description',
  main: 'src/index.js',
  keywords: ['medina', 'sdk'],
  dependencies: {
    '@medina/medina-heart': '1.0.0',
  },
}, myExports);

console.log(result);
// { success: true, package: '@medina/my-sdk@1.0.0', publishedAt: 1735603200000 }
```

**Parameters:**
- `packageInfo` - Package metadata (name, version, description, etc.)
- `exports` - Optional module exports object

### install(packageName, version)

Install a package from the registry.

```javascript
import { install } from '@medina/medina-registry';

// Install latest version
const result = install('@medina/medina-heart');

// Install specific version
const result2 = install('@medina/medina-heart', '1.0.0');

console.log(result);
// { success: true, package: '@medina/medina-heart@1.0.0', installedAt: ..., exports: ... }
```

### list(filter)

List all packages, optionally filtered by name.

```javascript
import { list } from '@medina/medina-registry';

// List all packages
const all = list();

// Filter by name
const protocols = list('protocol');

console.log(protocols);
// [
//   { name: '@medina/sovereign-cycle-protocol', version: '1.0.0', ... },
//   { name: '@medina/neural-synchronization-protocol', version: '1.0.0', ... },
//   ...
// ]
```

### search(query)

Search for packages by keyword or description.

```javascript
import { search } from '@medina/medina-registry';

const results = search('neural');
console.log(results);
// [
//   { name: '@medina/neural-synchronization-protocol', score: 16.18, ... },
//   ...
// ]
```

Results are φ-weighted by relevance.

### getInfo(packageName, version)

Get detailed information about a package.

```javascript
import { getInfo } from '@medina/medina-registry';

const info = getInfo('@medina/medina-heart');
console.log(info);
// {
//   name: '@medina/medina-heart',
//   version: '1.0.0',
//   description: '...',
//   downloads: 42,
//   keywords: ['heart', 'biological', ...],
//   ...
// }
```

### getDependencyTree(packageName, version)

Get the complete dependency tree for a package.

```javascript
import { getDependencyTree } from '@medina/medina-registry';

const tree = getDependencyTree('@medina/my-sdk');
console.log(tree);
// {
//   name: '@medina/my-sdk',
//   version: '1.0.0',
//   dependencies: [
//     {
//       name: '@medina/medina-heart',
//       version: '1.0.0',
//       dependencies: []
//     }
//   ]
// }
```

### getStats()

Get registry statistics.

```javascript
import { getStats } from '@medina/medina-registry';

const stats = getStats();
console.log(stats);
// {
//   totalPackages: 13,
//   totalDownloads: 156,
//   installedPackages: 3,
//   topKeywords: [
//     { keyword: 'protocol', count: 7 },
//     { keyword: 'ai', count: 4 },
//     ...
//   ],
//   registryAge: 3600000
// }
```

## Pre-Registered Packages

The registry comes pre-loaded with all core MEDINA SDKs:

### Intelligence Protocols
- `@medina/sovereign-cycle-protocol` - 873ms heartbeat protocol
- `@medina/autonomous-division-protocol` - AI division coordination
- `@medina/neural-synchronization-protocol` - 21-species neurochemistry
- `@medina/emergence-detection-protocol` - Ising/Landau/percolation
- `@medina/cognitive-memory-protocol` - Working/episodic/semantic memory
- `@medina/adaptive-learning-protocol` - Lyapunov stability/antifragility
- `@medina/scalability-coordination-protocol` - Swarm coordination

### Core SDKs
- `@medina/medina-heart` - Self-bootstrapping biological heart
- `@medina/medina-registry` - This registry
- `@medina/organism-ai` - AI model orchestration

### Domain AI Tools
- `@medina/paralegal-ai` - Legal professional AI
- `@medina/analyst-ai` - Business analyst AI
- `@medina/student-ai` - Student learning AI

## SovereignRegistry Class

For advanced usage, you can create custom registry instances.

```javascript
import { SovereignRegistry } from '@medina/medina-registry';

const customRegistry = new SovereignRegistry();

// Use all the same methods
customRegistry.publish({...}, exports);
customRegistry.install('@medina/some-package');
```

**Methods:**
- `publish(packageInfo, exports)` - Publish a package
- `install(packageName, version)` - Install a package
- `list(filter)` - List packages
- `search(query)` - Search packages
- `getInfo(packageName, version)` - Get package info
- `getDependencyTree(packageName, version)` - Get dependency tree
- `getStats()` - Get statistics

## Use Cases

### Private Enterprise Registry

```javascript
import { SovereignRegistry } from '@medina/medina-registry';

// Create enterprise-specific registry
const enterpriseRegistry = new SovereignRegistry();

// Publish internal SDKs
enterpriseRegistry.publish({
  name: '@company/internal-ai',
  version: '2.0.0',
  description: 'Internal AI tools',
}, internalExports);

// Employees install from your registry
const sdk = enterpriseRegistry.install('@company/internal-ai');
```

### ICP Canister Package Manager

```javascript
// In a Motoko canister
import { getRegistry, install } from '@medina/medina-registry';

export function install_package(name: Text, version: Text) {
  let registry = getRegistry();
  let result = registry.install(name, version);
  result
}

export function list_packages() {
  let registry = getRegistry();
  let packages = registry.list();
  packages
}
```

### Offline Development

```javascript
// The registry works completely offline
import { getRegistry } from '@medina/medina-registry';

const registry = getRegistry();

// All core SDKs are pre-registered
const protocols = registry.search('protocol');
console.log(`Found ${protocols.length} protocols offline`);
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              SovereignRegistry                          │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Packages   │  │ Dependencies │  │  Installed   │ │
│  │              │  │              │  │              │ │
│  │  Map<key,    │  │  Map<key,    │  │  Map<name,   │ │
│  │   pkg>       │  │   deps[]>    │  │   pkg>       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ● No external network required                        │
│  ● No central authority                                │
│  ● Pure JavaScript                                     │
│  ● φ-weighted search                                   │
└─────────────────────────────────────────────────────────┘
```

## Philosophy

### Sovereignty

Traditional package managers (npm, Maven, pip) depend on central registries controlled by third parties. If the registry goes down, your builds break. If the registry decides to remove a package, it's gone.

Medina Registry is **sovereign**:
- Runs on YOUR infrastructure
- YOU control what's published
- YOU control access
- No external dependencies
- Works completely offline

### Simplicity

No complex package.json parsing. No network calls. No database. Just a Map in memory. You can persist it however you want (localStorage, ICP stable memory, database, file system).

## Persistence

The registry runs in-memory by default, but you can persist it:

```javascript
import { getRegistry } from '@medina/medina-registry';

const registry = getRegistry();

// Serialize to JSON
const snapshot = JSON.stringify({
  packages: Array.from(registry.packages.entries()),
  dependencies: Array.from(registry.dependencies.entries()),
  installed: Array.from(registry.installed.entries()),
});

// Save to your storage (localStorage, ICP stable memory, etc.)
localStorage.setItem('medina-registry', snapshot);

// Restore from storage
const saved = localStorage.getItem('medina-registry');
if (saved) {
  const data = JSON.parse(saved);
  data.packages.forEach(([k, v]) => registry.packages.set(k, v));
  data.dependencies.forEach(([k, v]) => registry.dependencies.set(k, v));
  data.installed.forEach(([k, v]) => registry.installed.set(k, v));
}
```

## License

See [LICENSE](../../LICENSE) - © 2026 Alfredo Medina Hernandez

## Related

- `@medina/medina-heart` - Self-bootstrapping biological heart
- `@medina/sovereign-cycle-protocol` - Heartbeat protocol
- `@medina/organism-bootstrap` - ICP deployment

---

*YOUR registry. YOUR sovereignty. YOUR control.*
