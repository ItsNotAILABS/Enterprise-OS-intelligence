# @medina/organism-bootstrap

**ICP Deployment Helpers**

> *Bootstrap self-bootstrapping intelligence organisms on the Internet Computer.*

## Overview

Deploy MEDINA intelligence organisms as ICP canisters with automatic Motoko wrapper generation, deployment scripts, and state management.

- Generate Motoko canister code
- Self-bootstrapping (873ms heartbeat)
- ICP stable state management
- Deployment validation
- Multi-canister orchestration

## Installation

```bash
npm install @medina/organism-bootstrap
```

## Quick Start

```javascript
import { createBootstrap } from '@medina/organism-bootstrap';

// Create bootstrap helper
const bootstrap = createBootstrap({
  network: 'ic',  // 'ic' or 'local'
});

// Register modules
bootstrap
  .registerModule('neural-sync', neuralSyncModule)
  .registerModule('memory', memoryModule);

// Generate deployment package
const package = bootstrap.getDeploymentPackage();

// Write files
fs.writeFileSync('src/neural_sync.mo', package.wrappers['neural_sync.mo']);
fs.writeFileSync('dfx.json', package.dfxJson);
fs.writeFileSync('deploy.sh', package.deployScript);
```

## API Reference

### createBootstrap(config)

Create a new canister bootstrap helper.

```javascript
import { createBootstrap } from '@medina/organism-bootstrap';

const bootstrap = createBootstrap({
  canisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai',  // Optional
  network: 'ic',  // 'ic' or 'local'
});
```

### registerModule(name, module)

Register a module for deployment.

```javascript
bootstrap.registerModule('neural-sync', neuralSyncModule);
bootstrap.registerModule('memory', memoryModule);
```

### generateMotokoWrapper(moduleName)

Generate Motoko canister code for a module.

```javascript
const motokoCode = bootstrap.generateMotokoWrapper('neural-sync');
console.log(motokoCode);
```

Returns Motoko actor code with:
- 873ms recurring timer (self-bootstrapping heartbeat)
- Stable state variables
- Query and update methods
- Automatic lifecycle management

### generateDfxConfig()

Generate `dfx.json` configuration file.

```javascript
const dfxJson = bootstrap.generateDfxConfig();
fs.writeFileSync('dfx.json', dfxJson);
```

### generateDeployScript()

Generate bash deployment script.

```javascript
const deployScript = bootstrap.generateDeployScript();
fs.writeFileSync('deploy.sh', deployScript);
fs.chmodSync('deploy.sh', '755');
```

### getDeploymentPackage()

Get complete deployment package.

```javascript
const package = bootstrap.getDeploymentPackage();

// package.wrappers: Map of .mo files
// package.dfxJson: dfx.json content
// package.deployScript: deploy.sh content

// Write all files
for (const [filename, content] of Object.entries(package.wrappers)) {
  fs.writeFileSync(`src/${filename}`, content);
}
fs.writeFileSync('dfx.json', package.dfxJson);
fs.writeFileSync('deploy.sh', package.deployScript);
```

## ICP State Manager

### createStateManager()

Create a state manager for ICP stable variables.

```javascript
import { createStateManager } from '@medina/organism-bootstrap';

const state = createStateManager();

// Stable variables (persist across upgrades)
state.setStable('beatCount', 127);
state.setStable('reputation', 0.8534);

// Transient variables (reset on upgrade)
state.setTransient('tempCache', { ... });

// Serialize for Motoko
const serialized = state.serializeStableState();
console.log(serialized);
// {
//   stableVars: [
//     { key: 'beatCount', value: '127', phiWeight: 78.486 },
//     { key: 'reputation', value: '0.8534', phiWeight: 0.527 }
//   ],
//   totalEntries: 2,
//   phiSum: 79.013
// }
```

**Methods:**
- `setStable(key, value)` - Set stable variable
- `getStable(key)` - Get stable variable
- `setTransient(key, value)` - Set transient variable
- `getTransient(key)` - Get transient variable
- `serializeStableState()` - Serialize for Motoko

## Deployment Validator

### createValidator()

Create a deployment validator.

```javascript
import { createValidator } from '@medina/organism-bootstrap';

const validator = createValidator();

// Add validation checks
validator.addCheck('dfx-installed', async () => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    exec('dfx --version', (error) => {
      resolve({
        passed: !error,
        message: error ? 'dfx not found' : 'dfx installed',
      });
    });
  });
});

validator.addCheck('network-reachable', async () => {
  // Check ICP network
  return { passed: true, message: 'Network reachable' };
});

// Run validation
const results = await validator.validate();
console.log(results);
// {
//   results: [
//     { name: 'dfx-installed', passed: true, message: 'dfx installed', phiScore: 1.618 },
//     { name: 'network-reachable', passed: true, message: 'Network reachable', phiScore: 1.618 }
//   ],
//   totalScore: 3.236,
//   maxScore: 3.236,
//   successRate: 1.0,
//   passed: true
// }
```

**Methods:**
- `addCheck(name, checkFn)` - Add validation check
- `validate()` - Run all checks

## Generated Motoko Code

The generated Motoko canister includes:

```motoko
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";

actor neural_sync {
  let PHI : Float = 1.618033988749895;
  let HEARTBEAT_MS : Nat = 873_000_000;  // 873ms in nanoseconds

  stable var beatCount : Nat = 0;
  stable var isActive : Bool = true;

  // Self-bootstrapping heartbeat (starts immediately)
  let heartbeat = Timer.recurringTimer(
    #nanoseconds(HEARTBEAT_MS),
    func() : async () {
      if (isActive) {
        beatCount += 1;
        await onHeartbeat(beatCount);
      };
    }
  );

  func onHeartbeat(beat : Nat) : async () {
    Debug.print("Heartbeat " # Nat.toText(beat));
  };

  public query func getState() : async {
    beatCount : Nat;
    isActive : Bool;
    phiRatio : Float;
  } {
    return {
      beatCount = beatCount;
      isActive = isActive;
      phiRatio = Float.fromInt(beatCount) * PHI;
    };
  };

  public func activate() : async () {
    isActive := true;
  };

  public func deactivate() : async () {
    isActive := false;
  };
};
```

## Examples

### Single Module Deployment

```javascript
import { createBootstrap } from '@medina/organism-bootstrap';
import fs from 'fs';

const bootstrap = createBootstrap({ network: 'local' });

// Register module
bootstrap.registerModule('heartbeat', heartbeatModule);

// Generate and write files
const package = bootstrap.getDeploymentPackage();

fs.mkdirSync('src', { recursive: true });
fs.writeFileSync('src/heartbeat.mo', package.wrappers['heartbeat.mo']);
fs.writeFileSync('dfx.json', package.dfxJson);
fs.writeFileSync('deploy.sh', package.deployScript);

console.log('Deployment package generated. Run: ./deploy.sh local');
```

### Multi-Module Organism

```javascript
const bootstrap = createBootstrap({ network: 'ic' });

// Register all intelligence modules
bootstrap
  .registerModule('neural-sync', neuralSyncModule)
  .registerModule('memory', memoryModule)
  .registerModule('learning', learningModule)
  .registerModule('decision', decisionModule);

// Generate package
const package = bootstrap.getDeploymentPackage();

// Write all wrappers
for (const [filename, content] of Object.entries(package.wrappers)) {
  fs.writeFileSync(`src/${filename}`, content);
}

fs.writeFileSync('dfx.json', package.dfxJson);
fs.writeFileSync('deploy.sh', package.deployScript);

console.log('Multi-module organism ready for deployment');
```

### With Validation

```javascript
import { createBootstrap, createValidator } from '@medina/organism-bootstrap';

const bootstrap = createBootstrap({ network: 'ic' });
const validator = createValidator();

// Add checks
validator.addCheck('dfx-installed', async () => ({ passed: true }));
validator.addCheck('wallet-configured', async () => ({ passed: true }));
validator.addCheck('cycles-available', async () => ({ passed: true }));

// Validate before deployment
const validation = await validator.validate();

if (!validation.passed) {
  console.error('Validation failed');
  validation.results.forEach(r => {
    if (!r.passed) console.error(`  ❌ ${r.name}: ${r.message}`);
  });
  process.exit(1);
}

console.log('✓ All validation checks passed');
console.log(`Success rate: ${(validation.successRate * 100).toFixed(2)}%`);

// Proceed with deployment
bootstrap.registerModule('organism', organismModule);
const package = bootstrap.getDeploymentPackage();
// ... write files and deploy
```

### State Management

```javascript
import { createStateManager } from '@medina/organism-bootstrap';

const state = createStateManager();

// Store organism state
state.setStable('beatCount', 1234);
state.setStable('reputation', 0.8765);
state.setStable('lastSync', Date.now());

// Store configuration
state.setStable('config', {
  heartbeatMs: 873,
  numHearts: 3,
  calendar: 'mayan',
});

// Transient cache
state.setTransient('cache', new Map());

// Serialize for Motoko
const serialized = state.serializeStableState();
console.log(`Total stable vars: ${serialized.totalEntries}`);
console.log(`φ-sum: ${serialized.phiSum}`);

// Later, restore state
const beatCount = state.getStable('beatCount');
const reputation = state.getStable('reputation');
```

## Deployment Steps

1. **Generate deployment package:**
   ```javascript
   const package = bootstrap.getDeploymentPackage();
   ```

2. **Write files:**
   ```bash
   # Motoko wrappers
   src/neural_sync.mo
   src/memory.mo

   # Configuration
   dfx.json

   # Deployment script
   deploy.sh
   ```

3. **Deploy locally:**
   ```bash
   ./deploy.sh local
   ```

4. **Deploy to IC:**
   ```bash
   ./deploy.sh
   ```

## The Mathematics

### φ-Weighted Validation

Each check receives a φ score:
- Passed: φ ≈ 1.618
- Failed: φ⁻¹ ≈ 0.618

Success rate:
```
success_rate = total_score / max_score
```

Deployment passes if `success_rate >= φ⁻¹`

## License

See [LICENSE](../../LICENSE) - © 2026 Alfredo Medina Hernandez

## Related

- `@medina/medina-heart` - Self-bootstrapping biological heart
- `@medina/organism-ai` - Multi-model AI orchestration
- `@medina/protocol-composer` - Protocol composition

---

*Self-bootstrapping on ICP. φ-resonant heartbeat. Automatic deployment.*
