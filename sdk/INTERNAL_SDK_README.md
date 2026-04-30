# MEDINA Internal SDKs

## Overview

These are **internal SDKs** for the MEDINA ecosystem. They are NOT external dependencies — they live in YOUR system, YOUR registries, YOUR control.

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
@medina/organism-bootstrap        ← ICP deployment ✨ NEW
```
