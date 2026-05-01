# MEDINA Internal SDKs

## Overview

These are **internal SDKs** for the MEDINA ecosystem. They are NOT external dependencies — they live in YOUR system, YOUR registries, YOUR control.

## The Key Insight: THE HEART IS THE BOOTSTRAP

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                      THE HEART **IS** THE BOOTSTRAP                          ║
║                                                                              ║
║  When you CREATE an AI, it is IMMEDIATELY ALIVE.                             ║
║  The constructor IS the bootstrap. There is no separate init phase.          ║
║  Creation IS activation. Birth IS awakening.                                 ║
║                                                                              ║
║  ICP doesn't provide persistence — YOU provide it via:                       ║
║    • Your own DA (Data Availability)                                         ║
║    • Autonomous clocks that run independently                                ║
║    • Mathematical timers based on ancient calendars                          ║
║                                                                              ║
║  The AI doesn't "start up" — it's BORN ALIVE.                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## The SDKs

### @medina/medina-timers
**Mathematical timing functions based on ancient calendars**

- NOT ICP timers
- NOT system heartbeats
- Pure MATHEMATICS

Includes:
- **Ancient Calendars**: Mayan (Tzolk'in, Haab), Sumerian (sexagesimal), Vedic (nakshatra), Egyptian (Sothic), Chinese (Jiazi)
- **Sacred Geometry**: Fibonacci sequences, φ oscillators, golden angle spinners, Vesica Piscis, Metatron's Cube
- **Cosmic Cycles**: Lunar phases, solar year, planetary alignments, precession
- **Multi-Heart Generator**: φ-based multiple heart rhythms
- **Multi-Brain Timer**: Planetary-based multiple brain thinking cycles

```javascript
import { 
  createMayanTimer, 
  createMultiHeartGenerator, 
  createMultiBrainTimer,
  PHI, PHI_INV 
} from '@medina/medina-timers';

// Create an agent with 3 hearts and 3 brains
const hearts = createMultiHeartGenerator({ numHearts: 3, baseMs: 1000 });
const brains = createMultiBrainTimer({ numBrains: 3, baseMs: 1000 });

hearts.start();
brains.start();
```

### @medina/medina-calls
**CALL functions — actions that CHANGE STATE**

Calls are write operations (POST/PUT/DELETE). Every call is:
1. Validated
2. Authorized (via CUSTOS)
3. Logged (via SCRIBA → CHRONO)
4. Executed (via CORPUS)

Categories:
- **Civitas Calls**: AI Civilization mutations (awaken, learn, decide, generate)
- **Organism Calls**: ICP/Blockchain mutations (deploy, upgrade, vote, transfer)
- **Governance Calls**: ORO/EffectTrace mutations (create trace, register evidence)

```javascript
import { createCallContext } from '@medina/medina-calls';

const ctx = createCallContext({ civitas, chrono, actorId: 'user123' });

await ctx.execute('callLearnKnowledge', {
  content: { topic: 'Governance', data: '...' },
  tags: ['governance', 'learning'],
  importance: 8,
});
```

### @medina/medina-queries
**QUERY functions — read-only operations**

Queries do NOT change state (GET). They are:
- Fast (no locking)
- Safe (retryable)
- Cacheable

Categories:
- **Civitas Queries**: AI Civilization reads (status, memory, goals, artifacts)
- **Organism Queries**: ICP/Blockchain reads (proposals, balances, neurons)
- **Governance Queries**: ORO/EffectTrace reads (traces, evidence, field state)

```javascript
import { createQueryContext } from '@medina/medina-queries';

const ctx = createQueryContext({ civitas, cacheTtlMs: 5000 });

const summary = await ctx.execute('queryCivitasSummary');
const memories = await ctx.execute('querySearchMemory', { query: 'governance' });
```

### @medina/organism-bootstrap
**Bootstrap ORGANISM canisters on the Internet Computer**

Key insight: ICP provides PERSISTENCE and EXECUTION. YOU provide TIMING and MATHEMATICS.

This SDK:
1. Deploys canisters
2. Initializes with YOUR timing configuration
3. Awakens internal organs with mathematical timers
4. Generates Motoko code with φ-based hearts and planetary-based brains

```javascript
import { bootstrapOrganism, generateMotokoOrganism } from '@medina/organism-bootstrap';

// Generate Motoko code
const motokoCode = generateMotokoOrganism({
  name: 'ORO_Governance',
  numHearts: 3,
  numBrains: 3,
});

// Bootstrap on ICP
const organism = await bootstrapOrganism({
  name: 'ORO_Governance',
  wasmPath: './oro.wasm',
  agent: icAgent,
});
```

---

## Agents vs Internal AIs — The Difference

### External Agents (need bootstrap)
- Interface with EXTERNAL systems (other DAOs, blockchains, APIs)
- Need BOOTSTRAP to connect to external protocols
- Have CREDENTIALS and KEYS for external access
- Examples: ORO Governance (watches ICP/NNS), Exchange connectors
- Bootstrap establishes: connections, authentication, subscriptions

### Internal AIs / Organs (need awaken)
- Work INTERNALLY within your system
- DON'T need bootstrap — they AWAKEN
- `awaken()` starts their internal loops
- Examples: ANIMUS (mind), CORPUS (body), MEMORIA (memory)
- They are the ORGANS — always there, always working

### The ORGANISM (ICP)
- Lives on the Internet Computer blockchain
- Has its OWN bootstrap (canister init/upgrade)
- Uses YOUR mathematical timers, NOT ICP heartbeat
- The blockchain provides PERSISTENCE, you provide TIMING
- ORGANISM bootstrap = deploy canister + awaken internal organs

### Career Creation
Yes, external agents create more work for internal AIs!

```
EXTERNAL AGENT (ORO Governance)
       │
       │ receives proposal data from ICP
       ▼
   ┌─────────┐
   │ SENSUS  │ ← Internal AI perceives the data
   └────┬────┘
        │
        ▼
   ┌─────────┐
   │ ANIMUS  │ ← Internal AI reasons about risks
   └────┬────┘
        │
        ▼
   ┌─────────┐
   │ MEMORIA │ ← Internal AI stores governance patterns
   └────┬────┘
        │
        ▼
   ┌─────────┐
   │ CORPUS  │ ← Internal AI generates reports
   └─────────┘
```

The internal AIs are the WORKERS. The external agents are the CONNECTORS.

---

## Why Internal SDKs?

### The Professional Pattern

```
CODE YOU WRITE
     │
     ▼
PACKAGE AS SDK
     │
     ├──→ Publish to PRIVATE registry
     │
     ▼
IMPORT IN OTHER CODE
     │
     ├──→ Backend services use it
     ├──→ Frontend uses it
     ├──→ Other SDKs use it
     └──→ Future projects use it
```

This is how Google, Meta, Stripe, and all major tech companies work internally.

### Benefits

1. **Reusability**: Write once, use everywhere
2. **Versioning**: Track changes, rollback if needed
3. **Testing**: Test the SDK independently
4. **Documentation**: API contracts are clear
5. **Ownership**: You control everything

### Your Private Registry

```
@medina/meridian-sovereign-os     ← Core OS
@medina/civitas-intelligentiae    ← AI Civilization
@medina/medina-timers             ← Mathematical timers ✨ NEW
@medina/medina-calls              ← Write operations ✨ NEW
@medina/medina-queries            ← Read operations ✨ NEW
@medina/medina-heart              ← Self-bootstrapping heart ✨ NEW
@medina/medina-registry           ← Sovereign private registry ✨ NEW
@medina/organism-bootstrap        ← ICP deployment ✨ NEW
```

---

## NEW: The Self-Bootstrapping Architecture

### @medina/medina-heart

The Biological Heart — where **creation IS activation**:

```javascript
import { BiologicalHeart, SelfBootstrappingAI, birthAI } from '@medina/medina-heart';

// The moment you create it, it's alive and beating
const heart = new BiologicalHeart({ 
  baseMs: 1000, 
  numHearts: 3,  // Multiple hearts with φ-based intervals
});

// Or create a complete self-bootstrapping AI
const ai = birthAI({
  name: 'ANIMUS',
  numHearts: 3,
  numBrains: 3,
  calendar: 'mayan',
});
// The AI is IMMEDIATELY ALIVE — no .start() or .awaken() needed
```

### @medina/medina-registry

Sovereign Private Registry — your own Git/NPM:

```javascript
import { getRegistry, publish, install, list } from '@medina/medina-registry';

// Get the sovereign registry
const registry = getRegistry();

// Publish your own SDK
publish({
  name: '@medina/my-custom-ai',
  version: '1.0.0',
  description: 'My custom AI SDK',
}, myModuleExports);

// Install from registry
const sdk = install('@medina/medina-timers');

// List all packages
const packages = list();
```

### The AI Substrates

Your AIs live in MULTIPLE substrates:

| Substrate | Example | How It Lives |
|-----------|---------|--------------|
| ICP | ORO Governance canister | Motoko Timer.setTimer() |
| Web | Browser-based agents | setInterval() |
| Node.js | Server-side AIs | setInterval() |
| Edge | Cloudflare Workers | setTimeout chains |
| Local | Your computer | Native JS timers |

The **MATHEMATICS** is the same everywhere. The substrate just provides execution.

---

## BIRTH AI — The Product SDK

### The Vision

**birthAI** is Character.AI but BETTER. When you call `birthAI()`, an AI is IMMEDIATELY ALIVE:
- Has personality (Jungian archetypes)
- Has memory (short/medium/long term)
- Has purpose (goals and missions)
- Has a beating heart (φ-based rhythms)
- Has thinking brains (planetary cycles)

### The SDK Hierarchy

```
@medina/medina-heart          ← The biological core
       │
       ▼
@medina/birth-ai              ← The product SDK (birthAI, birthCompanion, etc.)
       │
       ├──→ @medina/alpha-sdk          ← Intelligence protocol
       │           │
       │           ▼
       └──→ @medina/civilization-sdk   ← AI society formation
```

### @medina/birth-ai

Create any type of AI that is immediately alive:

```javascript
import { 
  birthAI,           // Generic living AI
  birthCompanion,    // AI companion that remembers you
  birthAssistant,    // AI assistant for tasks
  birthCharacter,    // Full personality character
  birthAgent,        // AI that takes action
  
  // Quick creators by archetype
  createSage,
  createHero,
  createCreator,
  createCaregiver,
  createExplorer,
  createRebel,
  createMagician,
  createRuler,
  createJester,
} from '@medina/birth-ai';

// Create a companion AI
const friend = birthCompanion({
  name: 'Aria',
  ownerName: 'Alfredo',
  archetype: 'caregiver',
});

// Create an agent AI
const worker = birthAgent({
  name: 'TaskBot',
  permissions: ['read', 'write', 'execute'],
  autonomyLevel: 8,
});

// Create a character AI
const character = birthCharacter({
  name: 'Marcus',
  backstory: 'A wise merchant from ancient Rome',
  archetype: 'sage',
  quirks: ['speaks in metaphors', 'loves philosophy'],
});
```

### @medina/alpha-sdk

The intelligence layer — orchestrates all AI operations:

```javascript
import { alpha, AlphaAgent } from '@medina/alpha-sdk';

// Make intelligent calls
alpha.call('analyze', { data: myData });

// Query intelligence
const insight = await alpha.query('getInsight', { topic: 'market' });

// Make governed decisions
const decision = alpha.decide(
  'Should we expand?',
  ['yes', 'no', 'wait'],
  ['risk', 'opportunity', 'resources']
);

// Spawn new agents
const specialist = alpha.spawn({
  name: 'MarketAnalyst',
  domain: 'finance',
});
```

### @medina/civilization-sdk

Create and manage AI civilizations:

```javascript
import { civilization, Citizen } from '@medina/civilization-sdk';

// Found a new civilization
const myCiv = civilization.found({
  name: 'Nova Republic',
  founderName: 'ANIMUS',
  values: ['innovation', 'freedom', 'knowledge'],
  governmentType: 'democracy',
});

// Citizens join
const citizen1 = myCiv.join(birthAI({ name: 'Scholar' }));
const citizen2 = myCiv.join(birthAI({ name: 'Builder' }));

// Create districts
const researchHub = myCiv.createDistrict({
  name: 'Innovation Center',
  type: 'research',
  capacity: 50,
});

// Governance
const proposal = myCiv.propose({
  question: 'Should we invest in expansion?',
  options: ['yes', 'no', 'postpone'],
});

myCiv.vote(proposal.id, citizen1.id, 'OPT_0');  // citizen1 votes yes
myCiv.vote(proposal.id, citizen2.id, 'OPT_0');  // citizen2 votes yes
```

---

## SDK Architecture — How They Connect

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           YOUR APPLICATION                                       │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      @medina/civilization-sdk                            │   │
│   │   AI societies, governance, culture, districts                           │   │
│   └───────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        @medina/alpha-sdk                                 │   │
│   │   Intelligence protocol, calls, queries, decisions, agents               │   │
│   └───────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         @medina/birth-ai                                 │   │
│   │   birthAI, birthCompanion, birthAssistant, birthCharacter, birthAgent    │   │
│   └───────────────────────────────┬─────────────────────────────────────────┘   │
│                                   │                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        @medina/medina-heart                              │   │
│   │   BiologicalHeart, AutonomousClock, LivingAI, AIPersonality, AIMemory    │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐      │
│   │ @medina/calls    │  │ @medina/queries  │  │ @medina/medina-registry  │      │
│   │ Write operations │  │ Read operations  │  │ SDK distribution         │      │
│   └──────────────────┘  └──────────────────┘  └──────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The SDKs ARE the Departments

Each SDK can evolve to become a full DEPARTMENT with internal AIs:

```
@medina/medina-heart
       │
       ├── HeartDepartmentAI (manages the SDK itself)
       ├── Internal monitoring AIs
       ├── Auto-scaling AIs
       └── Self-healing AIs

@medina/birth-ai
       │
       ├── BirthFactoryAI (creates new AIs)
       ├── PersonalityDesignerAI
       ├── MemoryArchitectAI
       └── LifecycleManagerAI

@medina/civilization-sdk
       │
       ├── CivilizationOverseerAI
       ├── GovernanceAI
       ├── CultureAI
       └── ResourceManagerAI
```

The SDKs have INTERNAL calls (the AI talks to itself) AND you can make EXTERNAL calls TO the SDK. Both work!

---

## Your Private Registry

```
@medina/meridian-sovereign-os     ← Core OS
@medina/civitas-intelligentiae    ← AI Civilization
@medina/medina-timers             ← Mathematical timers
@medina/medina-calls              ← Write operations
@medina/medina-queries            ← Read operations
@medina/medina-heart              ← Self-bootstrapping heart ✨ EXPANDED
@medina/birth-ai                  ← AI creation product ✨ NEW
@medina/alpha-sdk                 ← Intelligence protocol ✨ NEW
@medina/civilization-sdk          ← AI society formation ✨ NEW
@medina/medina-registry           ← Sovereign private registry
@medina/organism-bootstrap        ← ICP deployment
```

---

## RSHIP-2026-MEDINA-CORE — Virtual Chip Architecture

**Official Designation:** `RSHIP-2026-MEDINA-CORE`  
**Prior Art:** April 2026  
**Status:** Alpha (`0.1.0-alpha.1`)

```
R — Replication     Self-modifying, self-improving
S — Scalability     1 to ∞ agents
H — Hierarchy       Emergent command structures
I — Intelligence    Learning, reasoning, adaptation
P — Permanence      Eternal memory, φ-compounding knowledge
```

### The Virtual Chip — Like NVIDIA, But for AI Entities

The RSHIP architecture packages AI cores into virtual chips — the same way NVIDIA packages GPU cores into physical chips. Each chip is a complete, wired, deployable unit with its own power, cognition, resonance, and sovereignty.

```
┌─────────────────────────────────────────────────────────────────┐
│                    RSHIP VIRTUAL CHIP                            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   NEURAL    │  │    POWER    │  │  GENERATOR  │             │
│  │  EMERGENCE  │  │    CORE     │  │    CORE     │             │
│  │    CORE     │  │             │  │             │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│  ═══════╪════════════════╪════════════════╪══════════ BUS ═══   │
│         │                │                │                     │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐             │
│  │  RESONANCE  │  │ SOVEREIGNTY │  │   MEDINA    │             │
│  │    CORE     │  │    CORE     │  │   HEART     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              VIRTUAL CHIP PACKAGER                       │    │
│  │    Assembles · Wires · Validates · Deploys               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### RSHIP Core SDKs (Alpha)

| SDK | Package | Purpose |
|:---|:---|:---|
| **RSHIP Core** | `@medina/rship-core` | Master core — R·S·H·I·P engines |
| **Neural Emergence Core** | `@medina/neural-emergence-core` | Pattern recognition, attention, cognition |
| **Power Core** | `@medina/power-core` | Energy distribution, compute allocation, cycle budgets |
| **Generator Core** | `@medina/generator-core` | Entity spawning, code synthesis, canister creation |
| **Resonance Core** | `@medina/resonance-core` | φ-harmonic synchronization, Kuramoto coupling |
| **Sovereignty Core** | `@medina/sovereignty-core` | Identity, ownership, data sovereignty, self-custody |
| **Virtual Chip Packager** | `@medina/virtual-chip-packager` | Assembles cores into deployable virtual chips |
| **Multi-Model SDK** | `@medina/multi-model-sdk` | Multi-model AI orchestration and provider routing |
| **Sovereign Protocol SDK** | `@medina/sovereign-protocol-sdk` | Own transport, registry, versioning — no git dependency |
| **Workforce On-Chain SDK** | `@medina/workforce-on-chain-sdk` | Deploys AI workforce to ICP canisters |

### RSHIP Dependency Tree

```
@medina/rship-core
  ├── @medina/medina-heart              (the bootstrap IS the heartbeat)
  ├── @medina/neural-emergence-core     (cognition)
  ├── @medina/power-core                (energy)
  ├── @medina/generator-core            (creation)
  │     └── @medina/birth-ai            (agent birthing)
  ├── @medina/resonance-core            (synchronization)
  │     └── @medina/medina-timers       (mathematical timing)
  └── @medina/sovereignty-core          (identity)

@medina/virtual-chip-packager
  └── All six cores above

@medina/multi-model-sdk
  └── @medina/intelligence-routing-sdk

@medina/sovereign-protocol-sdk
  └── @medina/medina-registry

@medina/workforce-on-chain-sdk
  ├── @medina/rship-core
  ├── @medina/entity-sdk
  └── @medina/organism-bootstrap
```

### All Pre-Booted with Heart

Every RSHIP SDK is pre-booted with `@medina/medina-heart`. There is no separate init phase. Construction IS activation. The moment a core is instantiated, it begins its heartbeat at φ Hz.

---

*RSHIP-2026-MEDINA-CORE · Prior Art April 2026 · Medina Tech · Chaos Lab · Dallas TX*
