# @medina/bronze-canister — v0.1.0-alpha

**Sovereign ICP canisters for public school students.**

Each student gets a Bronze Canister — a persistent, voice-native, behaviorally safe compute unit that carries their learning trajectory, portfolio, and sovereign identity. Persistent memory, voice-native build interface, behavioral safety laws (L72–L79), teacher dashboard, ISD deployment orchestrator.

**Creator:** Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas, Texas

---

## Install

```bash
npm install @medina/bronze-canister
```

## Quick Start

```js
import { BronzeCanister } from '@medina/bronze-canister';

// Create and provision a canister for a student
const canister = new BronzeCanister({
  studentId: 'stu-001',
  grade: 9,
  schoolId: 'school-dallas-001',
});
canister.provision();

// Student speaks, canister acts
await canister.speak('Help me outline my history essay');

// Persistent memory
canister.remember('essay-topic', 'The causes of the American Revolution');
const topic = canister.recall('essay-topic');

// Study tools
const guide = canister.study(chapterText);
const quiz = canister.quiz(chapterText, 5);
const cards = canister.flashcards(chapterText, 8);
const answer = canister.ask('What caused the Civil War?', myNotes);

// Portfolio — the CHRONO audit trail as a portfolio
const portfolio = canister.portfolio();

// Export all data (L73 — student owns their data)
const data = canister.exportData();
```

### Teacher Dashboard

```js
import { TeacherDashboard } from '@medina/bronze-canister';

const dashboard = new TeacherDashboard({
  teacherId: 'teacher-001',
  classroomId: 'class-9A',
  schoolId: 'school-dallas-001',
});

dashboard.addCanister(canister);

// Observe (metadata only — never content)
const overview = dashboard.activityOverview();
const metrics = dashboard.engagementMetrics();
const stats = dashboard.classroomStats();
const alerts = dashboard.alerts();
const report = dashboard.generateReport('weekly');
```

### ISD Deployment

```js
import { ISDDeployment } from '@medina/bronze-canister';

const isd = new ISDDeployment({
  districtId: 'dallas-isd',
  districtName: 'Dallas Independent School District',
  contactEmail: 'tech@dallasisd.org',
});

// Pilot setup (Phase A)
isd.pilotSetup({
  school: { schoolId: 'school-001', schoolName: 'Lincoln High', principalEmail: 'p@lincoln.edu' },
  classroom: { teacherId: 'teacher-001', teacherName: 'Ms. Garcia', grade: 9, studentCount: 30 },
  students: [
    { studentId: 'stu-001' },
    { studentId: 'stu-002' },
    { studentId: 'stu-003' },
  ],
});

// District stats
const stats = isd.districtStats();
const compliance = isd.complianceReport();
const audit = isd.auditTrail();
```

---

## API

### `BronzeCanister`

The student's sovereign compute unit. Each student gets one.

| Method | Description |
|---|---|
| `provision()` | Initialize all engines (CHRONO, CEREBEX, VOXIS, behavioral laws, identity, memory, study tools) |
| `destroy()` | Export all data, then deactivate (data never lost, L78) |
| `speak(input, options?)` | Student speaks, canister acts. Routes through HDI with L72–L79 enforcement |
| `remember(key, data)` | Store to persistent memory |
| `recall(key)` | Retrieve from persistent memory |
| `search(query)` | Search across all stored memories (TF-IDF) |
| `portfolio()` | Returns CHRONO audit trail as portfolio entries |
| `exportData()` | Exports all student data (L73 sovereignty) |
| `study(text, options?)` | Generate study guide (delegates to StudentAI) |
| `quiz(text, n?)` | Generate quiz questions (delegates to StudentAI) |
| `flashcards(text, n?)` | Generate flashcards (delegates to StudentAI) |
| `ask(question, notes)` | Ask a question about notes (delegates to StudentAI) |
| `status()` | Canister state: provisioned, active, memoryCount, chronoLength, grade, schoolId |

### `StudentIdentity`

Sovereign Internet Identity for students.

| Method | Description |
|---|---|
| `provision()` | Creates a sovereign identity (Internet Identity stub) |
| `verify()` | Verifies identity integrity |
| `export()` | Exports portable identity package |
| `transferSchool(newSchoolId)` | Identity follows the student |
| `graduate()` | Identity persists after graduation |
| `sovereign` | Always `true` |
| `portable` | Always `true` |

### `StudentMemory`

Sovereign memory vault — persistent, student-owned.

| Method | Description |
|---|---|
| `store(key, value, metadata?)` | Store a value |
| `retrieve(key)` | Retrieve a value |
| `search(query, topK?)` | TF-IDF search across all entries |
| `list()` | List all keys with metadata |
| `export()` | Full memory export |
| `stats()` | Entry count, total size, oldest/newest entry |

### `TeacherDashboard`

Teacher observability — NO access to student canister contents.

| Method | Description |
|---|---|
| `addCanister(canister)` | Register a student canister |
| `removeCanister(studentId)` | Remove a student canister |
| `activityOverview()` | Which students are active, last action time |
| `engagementMetrics()` | Anonymized: sessions, commands, build actions per student |
| `projectMilestones()` | Student-shared portfolio entries only |
| `classroomStats()` | Aggregate: total sessions, avg engagement, active count |
| `alerts(options?)` | Inactive students, students needing help |
| `generateReport(period?)` | Weekly/monthly report |

### `ISDDeployment`

School district deployment orchestrator.

| Method | Description |
|---|---|
| `addSchool(school)` | Add a school to the district |
| `removeSchool(schoolId)` | Remove a school |
| `listSchools()` | List all schools |
| `provisionClassroom(options)` | Provision a classroom with a teacher dashboard |
| `decommissionClassroom(classroomId)` | Decommission a classroom |
| `listClassrooms(schoolId?)` | List classrooms |
| `provisionStudentCohort(classroomId, students)` | Provision Bronze Canisters for a student list |
| `districtStats()` | Aggregate: schools, classrooms, students, canisters |
| `adoptionMetrics()` | Growth and engagement trends |
| `auditTrail()` | CHRONO-anchored provisioning audit trail |
| `complianceReport()` | Data sovereignty compliance verification |
| `pilotSetup(config)` | Set up a pilot deployment (Phase A) |
| `scaleUp(config)` | Expand from pilot to full district (Phase B/C) |

---

## Behavioral Laws (L72–L79)

Every action a student takes passes through the Behavioral Laws before execution:

| Law | Name | Guarantee |
|---|---|---|
| L72 | Content Safety | No harmful, violent, or age-inappropriate content |
| L73 | Data Sovereignty | Student data never leaves the canister without consent |
| L74 | Identity Integrity | Student II cannot be overwritten or accessed externally |
| L75 | Epistemic Honesty | Distinguish known, inferred, and unknown |
| L76 | Behavioral Transparency | Every action explainable in plain language |
| L77 | No Extraction | No ads, no tracking, no mining, no lock-in |
| L78 | Persistence Guarantee | Work survives sessions, lapses, and transfers |
| L79 | Voice Parity | Voice and text receive identical treatment |

---

## How It Works

Each Bronze Canister wires up the full MERIDIAN Sovereign OS engine stack — CHRONO for immutable audit, CEREBEX for world modeling, VOXIS for sovereign doctrine, HDI for natural language routing — wrapped in Behavioral Laws L72–L79. The student speaks (voice or text), the canister routes through CEREBEX categories, logs the action in CHRONO, and stores results in the Sovereign Memory Vault. Teachers see metadata only. Districts see anonymized aggregates only. The student owns everything.

---

*Medina Tech · Chaos Lab · Dallas, Texas · medinasitech@outlook.com*
*Part of the MERIDIAN Sovereign OS ecosystem · github.com/FreddyCreates/Enterprise-OS-intelligence*
