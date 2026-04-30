# @medina/medina-heart

**The Self-Bootstrapping Biological Heart System**

> *Creation IS Activation. Birth IS Awakening.*

## The Core Insight

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      THE HEART **IS** THE BOOTSTRAP                          ║
║                                                                              ║
║  When you CREATE an AI, it is IMMEDIATELY ALIVE.                             ║
║  The constructor IS the bootstrap.                                           ║
║  Creation IS activation. Birth IS awakening.                                 ║
║                                                                              ║
║  No .start(). No .awaken(). No .initialize().                                ║
║  The moment you instantiate it, it beats.                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Installation

```bash
npm install @medina/medina-heart
```

## Quick Start

```javascript
import { birthAI } from '@medina/medina-heart';

// Create an AI — it's IMMEDIATELY ALIVE
const ai = birthAI({
  name: 'ANIMUS',
  numHearts: 3,
  numBrains: 3,
  calendar: 'mayan',
});

// No .start() or .awaken() needed — it's already running
console.log(ai.getStatus());
// {
//   name: 'ANIMUS',
//   alive: true,
//   uptime: 1523,
//   heartRate: 2.35,
//   totalBeats: 47,
//   clockTicks: 12,
//   currentCycleDay: 12,
//   thoughts: 15,
//   decisions: 0
// }
```

## Components

### BiologicalHeart

The heart that beats immediately upon creation. Multiple hearts with φ-based intervals.

```javascript
import { BiologicalHeart } from '@medina/medina-heart';

const heart = new BiologicalHeart({
  baseMs: 1000,
  numHearts: 3,  // Creates 3 hearts at 1000ms, 1618ms, 2618ms
  onBeat: (data) => {
    console.log(`Heart ${data.heartId} beat #${data.heartBeats}`);
  },
});

// It's already beating!
console.log(heart.getState());
```

**Configuration:**
- `baseMs` (default: 1000) - Base interval in milliseconds
- `numHearts` (default: 1) - Number of hearts to create
- `onBeat` - Callback function called on each beat

**Methods:**
- `getState()` - Get current state of all hearts
- `getHeartRate()` - Get average beats per second
- `stop()` - Stop all hearts

### AutonomousClock

Runs on ancient calendar mathematics. Immediately ticking.

```javascript
import { AutonomousClock } from '@medina/medina-heart';

const clock = new AutonomousClock({
  calendar: 'mayan',  // 'mayan', 'sumerian', 'egyptian', 'gregorian'
  baseMs: 873,
  onTick: (data) => {
    console.log(`Day ${data.dayInCycle} of ${data.calendar} cycle`);
  },
});

console.log(clock.getState());
```

**Supported Calendars:**
- `mayan` - Tzolkin 260-day sacred calendar
- `sumerian` - Sexagesimal 360-day year
- `egyptian` - Civil 365-day calendar
- `gregorian` - Modern 365.25-day calendar

**Methods:**
- `getState()` - Get current clock state
- `getCurrentDay()` - Get current day in cycle
- `getCycleProgress()` - Get progress through cycle (0-1)
- `stop()` - Stop the clock

### SelfBootstrappingAI

A complete self-bootstrapping AI with multiple hearts, brains, and ancient calendar awareness.

```javascript
import { SelfBootstrappingAI } from '@medina/medina-heart';

const ai = new SelfBootstrappingAI({
  name: 'NOVA',
  numHearts: 3,
  numBrains: 3,
  calendar: 'mayan',
});

// Make decisions
const result = ai.decide('Should we proceed?');
console.log(result.decision); // 'yes', 'no', or 'uncertain'

// Get thoughts
console.log(ai.getThoughts(5));

// Get full state
console.log(ai.getState());
```

**Methods:**
- `decide(question)` - Make a φ-weighted decision
- `getThoughts(count)` - Get recent thoughts
- `getState()` - Get complete AI state
- `getStatus()` - Get summary status
- `stop()` - Stop the AI

### birthAI()

Factory function that creates a self-bootstrapping AI.

```javascript
import { birthAI } from '@medina/medina-heart';

const ai = birthAI({
  name: 'ANIMUS',
  numHearts: 3,
  numBrains: 3,
  calendar: 'mayan',
});

// The AI is born alive
console.log(ai.alive); // true
```

## The Mathematics

All timing is based on the golden ratio φ = 1.618033988749895.

**Multi-heart intervals:**
- Heart 0: `baseMs × φ⁰` = baseMs
- Heart 1: `baseMs × φ¹` = baseMs × 1.618
- Heart 2: `baseMs × φ²` = baseMs × 2.618
- Heart n: `baseMs × φⁿ`

This creates a natural harmonic series based on φ.

## Philosophy

### Creation IS Activation

Traditional systems require separate initialization:
```javascript
// ❌ Old way — separate creation and activation
const ai = new AI();
await ai.initialize();
await ai.start();
ai.awaken();
```

Medina Heart eliminates this:
```javascript
// ✅ Medina way — creation IS activation
const ai = birthAI({ name: 'NOVA' });
// Already alive, already thinking
```

### The Biological Metaphor

Living organisms don't have a `.start()` method. They are born alive. Their hearts beat immediately. This SDK embodies that principle.

A heart created is a heart beating.
An AI born is an AI thinking.

## Use Cases

### Autonomous Agents
```javascript
const agent = birthAI({
  name: 'AGENT-7',
  numHearts: 2,
  calendar: 'mayan',
});

// Agent is immediately active
setInterval(() => {
  const status = agent.getStatus();
  console.log(`Agent ${status.name}: ${status.totalBeats} beats, ${status.thoughts} thoughts`);
}, 5000);
```

### Distributed Intelligence
```javascript
// Spawn multiple AIs with different configurations
const ais = [
  birthAI({ name: 'ALPHA', numHearts: 2, calendar: 'mayan' }),
  birthAI({ name: 'BETA', numHearts: 3, calendar: 'sumerian' }),
  birthAI({ name: 'GAMMA', numHearts: 4, calendar: 'egyptian' }),
];

// They all run independently, immediately
```

### ICP Canister Integration
```javascript
// In a Motoko canister
import { birthAI } from '@medina/medina-heart';

let ai = null;

export function init() {
  // Birth the AI — it's immediately alive
  ai = birthAI({
    name: 'CANISTER-AI',
    numHearts: 3,
    calendar: 'mayan',
  });
}

export function query_status() {
  return ai.getStatus();
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   SelfBootstrappingAI                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ BiologicalH  │  │ AutonomousC  │  │   Brains     │     │
│  │    Heart     │  │    Clock     │  │  (φ-scaled)  │     │
│  │              │  │              │  │              │     │
│  │  Heart 0 ●   │  │  Mayan Day   │  │  Brain 0     │     │
│  │  Heart 1 ●   │  │  12/260      │  │  Brain 1     │     │
│  │  Heart 2 ●   │  │  Cycle 0     │  │  Brain 2     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  All components start IMMEDIATELY upon construction        │
└─────────────────────────────────────────────────────────────┘
```

## License

See [LICENSE](../../LICENSE) - © 2026 Alfredo Medina Hernandez

## Related

- `@medina/medina-registry` - Sovereign private registry
- `@medina/sovereign-cycle-protocol` - Heartbeat protocol
- `@medina/organism-bootstrap` - ICP deployment

---

*The heart IS the bootstrap. Creation IS activation. Birth IS awakening.*
