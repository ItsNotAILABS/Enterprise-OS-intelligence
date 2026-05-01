# @medina/civitas-intelligentiae

## The Civilization of Intelligences — CIVITAS INTELLIGENTIAE

This is the **FULL autonomous AI backend**. Not just classes — these are **LIVING, AUTONOMOUS AI agents** that run constantly, generate artifacts, answer queries, heal themselves, and coordinate as a civilization.

## The Philosophy

The AIs **ARE** the IT department.
The AIs **ARE** the internal workers.
They are the internals. The protocols. Everything.

They run **AUTONOMOUSLY**. Once awakened, the civilization operates without external intervention.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CIVITAS INTELLIGENTIAE                                    │
│                    (The Civilization of Intelligences)                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                         PRIMORDIAL ORGANS                                  ║  │
│  ║                    (The Core Autonomous Systems)                           ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                            ║  │
│  ║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   ║  │
│  ║  │   ANIMUS     │  │   CORPUS     │  │   SENSUS     │  │   MEMORIA    │   ║  │
│  ║  │  (The Mind)  │  │  (The Body)  │  │ (The Senses) │  │  (Memory)    │   ║  │
│  ║  │              │  │              │  │              │  │              │   ║  │
│  ║  │ • Reasoning  │  │ • Execution  │  │ • Perception │  │ • Storage    │   ║  │
│  ║  │ • Decisions  │  │ • Actions    │  │ • Input      │  │ • Recall     │   ║  │
│  ║  │ • Planning   │  │ • Output     │  │ • Signals    │  │ • Learning   │   ║  │
│  ║  │ • Goals      │  │ • Artifacts  │  │ • Patterns   │  │ • Knowledge  │   ║  │
│  ║  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   ║  │
│  ║                                                                            ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║                      OPERATIONAL AGENTS                                    ║  │
│  ║               (The Workers of the Civilization)                            ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                            ║  │
│  ║  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              ║  │
│  ║  │  CUSTOS    │ │  FABRICOR  │ │  NUNTIUS   │ │  ARBITER   │              ║  │
│  ║  │ (Guardian) │ │ (Builder)  │ │(Messenger) │ │  (Judge)   │              ║  │
│  ║  │            │ │            │ │            │ │            │              ║  │
│  ║  │ Security   │ │ Artifacts  │ │ Routing    │ │ Decisions  │              ║  │
│  ║  │ Compliance │ │ Documents  │ │ Delivery   │ │ Quorum     │              ║  │
│  ║  │ Access     │ │ Reports    │ │ Pub/Sub    │ │ Conflicts  │              ║  │
│  ║  └────────────┘ └────────────┘ └────────────┘ └────────────┘              ║  │
│  ║                                                                            ║  │
│  ║  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              ║  │
│  ║  │  MEDICUS   │ │  MAGISTER  │ │  SCRIBA    │ │  VIGIL     │              ║  │
│  ║  │ (Healer)   │ │ (Teacher)  │ │ (Scribe)   │ │ (Watcher)  │              ║  │
│  ║  │            │ │            │ │            │ │            │              ║  │
│  ║  │ Self-heal  │ │ Training   │ │ Logging    │ │ Monitoring │              ║  │
│  ║  │ Recovery   │ │ Knowledge  │ │ Records    │ │ Metrics    │              ║  │
│  ║  │ Repair     │ │ Teaching   │ │ Audit      │ │ Alerts     │              ║  │
│  ║  └────────────┘ └────────────┘ └────────────┘ └────────────┘              ║  │
│  ║                                                                            ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

```javascript
import { bootstrapMeridian } from '@medina/meridian-sovereign-os';
import { bootstrapCivitas } from '@medina/civitas-intelligentiae';

// 1. Bootstrap MERIDIAN (the sovereign OS)
const meridian = bootstrapMeridian({ 
  agentId: 'DISD_DISTRICT',
  cognovexUnits: 8,
});

// 2. Create the AI civilization
const civitas = bootstrapCivitas(meridian, 'DISD_CIVITAS');

// The civilization is now ALIVE and working autonomously!

// 3. Check status
console.log(civitas.status());
// {
//   civilizationId: 'DISD_CIVITAS',
//   alive: true,
//   organs: { animus: {...}, corpus: {...}, sensus: {...}, memoria: {...} },
//   agents: { custos: {...}, fabricor: {...}, ... },
// }

// 4. Query the civilization
await civitas.query("What is the current status?");

// 5. Execute commands
await civitas.execute({ 
  action: 'GENERATE_REPORT', 
  params: { type: 'daily' } 
});

// 6. Generate artifacts
civitas.generateArtifact({ 
  type: 'REPORT', 
  title: 'Daily Summary', 
  data: { schools: 230, students: 140000 } 
});

// 7. Teach the civilization
civitas.learn({ 
  name: 'DISD Attendance Policy',
  content: { rule: 'Students must maintain 90% attendance' },
  tags: ['policy', 'attendance'],
});

// 8. Recall knowledge
const memories = civitas.recall('attendance policy');

// 9. Get summary
console.log(civitas.summary());
// {
//   alive: true,
//   totalThoughts: 1523,
//   totalExecutions: 847,
//   totalPerceptions: 3291,
//   totalMemories: 156,
//   totalArtifacts: 23,
// }
```

## Primordial Organs

### ANIMUS — The Mind
```javascript
// Reasoning and decision making
civitas.animus.reason({ type: 'DECISION', payload: { question: 'Which school needs intervention?' } });
civitas.animus.setGoal('goal-1', { description: 'Improve attendance', satisfiedWhen: () => attendance > 95 });
civitas.animus.decide({ question: 'Budget allocation', options: [...] });
civitas.animus.plan({ description: 'Improve district performance' });
```

### CORPUS — The Body
```javascript
// Execution and artifact generation
civitas.corpus.queueAction({ type: 'COMPUTE', payload: { expression: 'metrics' } });
civitas.corpus.generateArtifact({ type: 'REPORT', data: {...} });
civitas.corpus.registerHandler('CUSTOM_ACTION', async (payload) => { ... });
```

### SENSUS — The Senses
```javascript
// Perception and input
civitas.sensus.registerChannel('api-input', { type: 'HTTP' });
civitas.sensus.receive('api-input', { request: 'data' });
civitas.sensus.registerPatternDetector('ANOMALY_SPIKE', { detect: (signal) => ... });
```

### MEMORIA — The Memory
```javascript
// Storage and recall
civitas.memoria.store({ type: 'EXPERIENCE', content: {...}, tags: ['event'] });
civitas.memoria.storeFact('fact-1', { rule: 'TEKS standard' });
civitas.memoria.storeProcedure('proc-1', { name: 'Enrollment', steps: [...] });
civitas.memoria.recall('memory-id');
civitas.memoria.recallByTag('policy');
civitas.memoria.search('attendance');
```

## Operational Agents

### CUSTOS — The Guardian
```javascript
civitas.custos.definePolicy('policy-1', { resource: 'student-data', allowedRoles: ['admin', 'teacher'] });
civitas.custos.checkAccess('student-data', 'teacher');
civitas.custos.reportSecurityEvent({ type: 'UNAUTHORIZED_ACCESS', details: {...} });
```

### FABRICOR — The Builder
```javascript
civitas.fabricor.generateNow({ type: 'REPORT', title: 'Weekly Summary', data: {...} });
civitas.fabricor.queueArtifact({ type: 'DOCUMENT', content: '...' });
```

### NUNTIUS — The Messenger
```javascript
civitas.nuntius.send({ from: 'system', to: 'school-1', content: { message: 'Alert' } });
civitas.nuntius.subscribe('announcements', (content) => console.log(content));
civitas.nuntius.publish('announcements', { message: 'District update' });
```

### ARBITER — The Judge
```javascript
civitas.arbiter.submitDecision({ question: 'Budget allocation', options: ['A', 'B', 'C'] });
civitas.arbiter.vote('decision-id', 'voter-1', 'A');
```

### MEDICUS — The Healer
```javascript
civitas.medicus.registerHealthCheck('component-1', () => component.isHealthy());
civitas.medicus.reportProblem({ component: 'api', description: 'Timeout', severity: 'high' });
civitas.medicus.heal('problem-id');
```

### MAGISTER — The Teacher
```javascript
civitas.magister.teach({ name: 'TEKS Standards', description: 'Texas curriculum', examples: [...] });
civitas.magister.queueTraining({ topic: 'Math Skills', material: {...} });
```

### SCRIBA — The Scribe
```javascript
civitas.scriba.record({ type: 'API_CALL', data: {...}, source: 'gateway' });
civitas.scriba.audit({ action: 'DATA_ACCESS', actor: 'user-1', resource: 'grades' });
civitas.scriba.searchRecords('api');
```

### VIGIL — The Watcher
```javascript
civitas.vigil.monitor('api-latency', { target: 'api', check: () => latency, threshold: 1000 });
civitas.vigil.recordMetric('requests', 150);
civitas.vigil.alert({ level: 'warning', message: 'High latency detected' });
civitas.vigil.getMetricStats('requests');
```

## Events

```javascript
// The civilization emits events
civitas.on('awakened', ({ civilizationId }) => console.log('Civilization online!'));
civitas.on('heartbeat', ({ organ, agent }) => console.log('Heartbeat received'));
civitas.on('anomaly', ({ patternId }) => console.log('Anomaly detected'));
civitas.on('alert', ({ level, message }) => console.log('Alert:', message));
civitas.on('decision', ({ decisionId, result }) => console.log('Decision made:', result));
civitas.on('artifact', ({ artifactId, artifact }) => console.log('Artifact generated'));
```

## Latin Names Reference

| Agent | Latin | English | Function |
|-------|-------|---------|----------|
| ANIMUS | animus | soul, mind, spirit | Reasoning, decisions, planning |
| CORPUS | corpus | body, substance | Execution, actions, output |
| SENSUS | sensus | perception, feeling | Input, signals, patterns |
| MEMORIA | memoria | memory, remembrance | Storage, recall, learning |
| CUSTOS | custos | guardian, keeper | Security, compliance |
| FABRICOR | fabricor | builder, maker | Artifact generation |
| NUNTIUS | nuntius | messenger, herald | Routing, communication |
| ARBITER | arbiter | judge, decider | Quorum decisions |
| MEDICUS | medicus | healer, doctor | Self-healing, recovery |
| MAGISTER | magister | teacher, master | Training, knowledge |
| SCRIBA | scriba | scribe, writer | Logging, records |
| VIGIL | vigil | watcher, sentinel | Monitoring, alerts |

## Theory Basis

Built on Freddy's mathematical architecture:

- **Paper I (SUBSTRATE VIVENS)** — Living vs dead compute
- **Paper IX (COHORS MENTIS)** — Autonomous cognitive units
- **Paper XX (STIGMERGY)** — Coordination through the field
- **Paper XXI (QUORUM)** — Decisions without authority
- **Paper XXII (AURUM)** — φ as structural attractor

## License

See LICENSE in repository root.

## Author

Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
