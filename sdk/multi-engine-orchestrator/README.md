# Multi-Engine Orchestrator

> **Sovereign AI Engine Routing, Load Balancing, Failover, and Unified Inference**

## @medina/multi-engine-orchestrator

The Multi-Engine Orchestrator manages 9 classes of AI engines with intelligent routing, pool management, failover handling, and metrics collection.

## Engine Classes

| Class | Purpose | Default Engines |
|-------|---------|-----------------|
| **Reasoning** | Logic, theorem proving, causal inference | Sovereign Reasoner, Fast Reasoner |
| **Creative** | Generation, synthesis, composition | Creative Synthesizer, Visual Creator |
| **Analytical** | Statistics, pattern detection, forecasting | Deep Analyst, Realtime Analyst |
| **Operational** | Workflow, scheduling, orchestration | Operations Controller |
| **Sovereign** | Self-governance, cycle management | Sovereign Core |
| **Vision** | Image understanding, spatial reasoning | — |
| **Language** | NLP, translation, summarization | Language Processor |
| **Code** | Generation, review, refactoring | Code Intelligence |
| **Multimodal** | Cross-modal reasoning, fusion | Multimodal Fusion |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   MULTI-ENGINE ORCHESTRATOR                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │  Engine Router   │────▶│  Engine Pool    │────▶│  Inference   │  │
│  │  (7 strategies) │     │  (auto-scale)   │     │  Pipeline    │  │
│  └────────┬────────┘     └─────────────────┘     └──────────────┘  │
│           │                                                          │
│  ┌────────▼────────┐     ┌─────────────────┐     ┌──────────────┐  │
│  │ Engine Registry │     │    Failover     │     │   Metrics    │  │
│  │ (9 classes)     │     │   Controller    │     │  Collector   │  │
│  └─────────────────┘     │ (circuit break) │     │  (real-time) │  │
│                           └─────────────────┘     └──────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  ENGINES:                                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Reason│ │Create│ │Analyt│ │ Ops  │ │Sovrgn│ │ Code │ │Multi │  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Routing Strategies

- **Balanced** (default) — Weighted scoring across latency, reliability, cost, capability
- **Lowest Latency** — Route to fastest engine
- **Highest Reliability** — Route to most reliable engine
- **Cost Optimized** — Minimize sovereign cycle consumption
- **Capability Match** — Best capability overlap
- **Round Robin** — Equal distribution
- **Weighted Random** — Probabilistic by reliability

## Usage

```javascript
import { createDefaultMultiEngineStack } from '@medina/multi-engine-orchestrator';

const orchestrator = createDefaultMultiEngineStack();

// Dispatch a reasoning task
const result = await orchestrator.dispatch({
  requiredClass: 'reasoning',
  requiredCapabilities: ['causal-inference'],
  input: { query: 'Analyze root cause of system degradation' }
});

// Create inference pipeline
const pipeline = orchestrator.createPipeline('analysis-pipeline');
pipeline
  .addStage({ name: 'classify', engineClass: 'language', type: 'inference' })
  .addStage({ name: 'analyze', engineClass: 'analytical', type: 'inference' })
  .addStage({ name: 'reason', engineClass: 'reasoning', type: 'inference' });

const pipelineResult = await pipeline.execute(
  { text: 'Revenue dropped 15% in Q3' },
  { router: orchestrator.router }
);

// Check system status
console.log(orchestrator.getStatus());
```

## Modules

| Module | Description |
|--------|-------------|
| `engine-registry` | Central registry of all engines with capability indexing |
| `engine-router` | Task-to-engine routing with 7 strategies |
| `engine-pool` | Instance pooling with auto-scaling |
| `inference-pipeline` | Multi-stage chained inference execution |
| `failover-controller` | Circuit breaking and automatic recovery |
| `metrics-collector` | Real-time metrics with percentile aggregation |
