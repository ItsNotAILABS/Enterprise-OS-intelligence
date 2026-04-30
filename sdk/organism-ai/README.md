# @medina/organism-ai

**Multi-Model AI Orchestration Engine**

> *Route tasks to 40+ AI models using φ-weighted scoring.*

## Overview

An intelligent orchestration system that routes tasks to the optimal AI model based on task type, model capabilities, and adaptive reputation tracking.

- φ-weighted scoring algorithm
- Cascade fallback across 40 model families
- Adaptive reputation via φ-EMA
- Self-bootstrapping (immediately active on creation)
- 873ms heartbeat for automatic rebalancing

## Installation

```bash
npm install @medina/organism-ai
```

## Quick Start

```javascript
import { createOrchestrator, TaskType, Priority } from '@medina/organism-ai';

// Create orchestrator — immediately active
const orchestrator = createOrchestrator();

// Route a task
const result = orchestrator.route({
  type: TaskType.CODING,
  priority: Priority.HIGH,
  payload: 'Write a function to calculate Fibonacci numbers',
});

console.log(result);
// {
//   modelId: 'deepseek-coder',
//   score: 14.56,
//   alternatives: ['gpt-4o', 'claude-3.5-sonnet', 'deepseek-v3']
// }
```

## Task Types

```javascript
TaskType.REASONING     // Logic, problem-solving
TaskType.CODING        // Code generation, debugging
TaskType.CREATIVE      // Writing, ideation
TaskType.ANALYSIS      // Data analysis, insights
TaskType.CONVERSATION  // Chat, dialogue
```

## Priority Levels

```javascript
Priority.LOW       // 0 - Background tasks
Priority.NORMAL    // 1 - Standard tasks
Priority.HIGH      // 2 - Important tasks
Priority.CRITICAL  // 3 - Urgent tasks
```

## API Reference

### createOrchestrator()

Creates a new intelligence orchestrator with 40 pre-registered models.

```javascript
const orch = createOrchestrator();
```

### route(task)

Route a task to the best model using φ-weighted scoring.

```javascript
const result = orch.route({
  type: TaskType.CREATIVE,
  priority: Priority.HIGH,
  payload: 'Write a haiku about AI',
});
```

**Returns:**
```javascript
{
  modelId: 'claude-3-opus',        // Best model
  score: 12.84,                     // φ-weighted score
  alternatives: ['claude-4', ...]   // Fallback options
}
```

### cascadeFallback(task, failed)

Find the best untried model after failures.

```javascript
const result = orch.cascadeFallback(
  { type: TaskType.CODING, priority: Priority.HIGH },
  ['deepseek-coder', 'gpt-4o']  // Models that already failed
);
```

### recordOutcome(modelId, success, latencyMs)

Update model reputation based on task outcome.

```javascript
orch.recordOutcome('gpt-4o', true, 1234);  // Success, 1234ms latency
orch.recordOutcome('claude-3-opus', false, 5678);  // Failure
```

Reputation is updated using φ-EMA:
```
reputation = φ⁻¹ × outcome + (1 - φ⁻¹) × old_reputation
```

### rebalance()

Recompute routing weights from empirical success rates.

```javascript
orch.rebalance();
```

Called automatically every 50 heartbeats (43.65 seconds).

### getMetrics()

Get orchestrator performance metrics.

```javascript
const metrics = orch.getMetrics();
console.log(metrics);
// {
//   totalRouted: 156,
//   successRate: 0.8974,
//   avgLatencyMs: 1247.3,
//   topModel: 'claude-3.5-sonnet',
//   modelCount: 40,
//   currentBeat: 127
// }
```

### getRoutingTable()

Get detailed information about all models.

```javascript
const table = orch.getRoutingTable();
console.log(table);
// [
//   {
//     modelId: 'gpt-4o',
//     reputation: 0.8534,
//     totalTasks: 23,
//     successRate: 0.9130,
//     avgLatencyMs: 1342.5,
//     capabilities: {
//       REASONING: 0.90,
//       CODING: 0.85,
//       CREATIVE: 0.80,
//       ANALYSIS: 0.88,
//       CONVERSATION: 0.85
//     }
//   },
//   ...
// ]
```

## Supported Models

### OpenAI GPT (8 models)
- gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo
- o1-preview, o1-mini, o3-mini, o3
- gpt-5-mini

### Anthropic Claude (6 models)
- claude-4, claude-3.5-sonnet, claude-3.5-haiku
- claude-3-opus, claude-3-sonnet, claude-3-haiku

### Google Gemini (4 models)
- gemini-ultra, gemini-2.0-flash
- gemini-1.5-pro, gemini-1.5-flash

### Meta Llama (4 models)
- llama-3.1-405b, llama-3.1-70b, llama-3.1-8b
- llama-3.2-90b

### Mistral (5 models)
- mistral-large, mistral-medium, mistral-small
- mixtral-8x22b, mixtral-8x7b

### Cohere Command (3 models)
- command-r-plus, command-r, command-light

### DeepSeek (3 models)
- deepseek-v3, deepseek-r1, deepseek-coder

### Qwen (2 models)
- qwen-2.5-72b, qwen-2.5-32b

### Microsoft Phi (2 models)
- phi-3-medium, phi-3-mini

### Others (3 models)
- dbrx, gemma-2-27b

## The Mathematics

### φ-Weighted Scoring

Task scores are calculated using the golden ratio φ = 1.618:

```
score = φ^(4 - priority) × capability × reputation
```

Where:
- `priority` ∈ {0, 1, 2, 3} (LOW to CRITICAL)
- `capability` ∈ [0, 1] for the task type
- `reputation` ∈ [0, 1] from adaptive tracking

### Cascade Fallback

Position decay in fallback cascade:

```
adjusted_score = original_score × φ^(-position)
```

This creates natural preference for earlier candidates while still allowing lower-ranked models to be selected.

### Reputation Update (φ-EMA)

Exponential moving average with φ⁻¹ smoothing:

```
new_reputation = φ⁻¹ × outcome + (1 - φ⁻¹) × old_reputation
new_latency = φ⁻¹ × current + (1 - φ⁻¹) × old_latency
```

Where φ⁻¹ ≈ 0.618, giving 61.8% weight to new data.

## Self-Bootstrapping Architecture

The orchestrator follows MEDINA's core principle:

**Creation IS Activation**

```javascript
// ❌ Old way
const orch = new Orchestrator();
await orch.initialize();
await orch.start();

// ✅ MEDINA way
const orch = createOrchestrator();
// Already running, already routing
```

The 873ms heartbeat starts immediately on construction.

## Use Cases

### Adaptive Task Routing

```javascript
const tasks = [
  { type: TaskType.CODING, priority: Priority.HIGH, payload: '...' },
  { type: TaskType.CREATIVE, priority: Priority.NORMAL, payload: '...' },
  { type: TaskType.ANALYSIS, priority: Priority.CRITICAL, payload: '...' },
];

for (const task of tasks) {
  const route = orch.route(task);
  console.log(`Route ${task.type} to ${route.modelId}`);
}
```

### Fallback Chain

```javascript
const task = { type: TaskType.REASONING, priority: Priority.HIGH };
const failed = new Set();

let result = orch.route(task);
while (!executeTask(result.modelId, task)) {
  failed.add(result.modelId);
  result = orch.cascadeFallback(task, failed);
  if (!result.modelId) break;  // All models failed
}
```

### Performance Monitoring

```javascript
setInterval(() => {
  const metrics = orch.getMetrics();
  console.log(`Success rate: ${(metrics.successRate * 100).toFixed(2)}%`);
  console.log(`Top model: ${metrics.topModel}`);
  console.log(`Avg latency: ${metrics.avgLatencyMs.toFixed(1)}ms`);
}, 10000);
```

## License

See [LICENSE](../../LICENSE) - © 2026 Alfredo Medina Hernandez

## Related

- `@medina/medina-heart` - Self-bootstrapping biological heart
- `@medina/protocol-composer` - Protocol composition
- `@medina/medina-registry` - Sovereign package registry

---

*φ-weighted intelligence. Adaptive routing. Cascade fallback.*
