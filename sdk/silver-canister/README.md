# @medina/silver-canister

**School-Level Sovereign System**

The Silver Canister is the school-level orchestration layer that controls all Bronze Canisters (students) and manages the entire school system. A school administrator can run their entire school through this Silver Canister.

## Installation

```bash
npm install @medina/silver-canister
```

## Quick Start

```javascript
import { SilverCanister } from '@medina/silver-canister';

// Create and provision a school
const school = new SilverCanister({
  schoolId: 'lincoln-hs',
  schoolName: 'Lincoln High School',
  districtId: 'dallas-isd',
  principalId: 'principal-001',
  principalName: 'Dr. Sarah Johnson',
  schoolYear: '2024-2025',
  state: 'TX',
});

school.provision();

// Create classrooms
school.createClassroom({
  classroomId: 'math-101',
  teacherId: 'teacher-001',
  teacherName: 'Mr. Smith',
  subject: 'Mathematics',
  grade: 9,
  period: '1st Period',
  room: 'A-101',
});

// Enroll students (creates their Bronze Canisters)
school.enrollStudent({
  studentId: 'student-001',
  studentName: 'Alice Johnson',
  grade: 9,
  classroomIds: ['math-101'],
});

// Get school status
console.log(school.status());
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SILVER CANISTER                                   │
│                     School-Level Sovereign System                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   CHRONO    │  │   CEREBEX   │  │   NEXORIS   │  │  COGNOVEX   │        │
│  │ Audit Trail │  │  Analytics  │  │   Routing   │  │  Decisions  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SUBSYSTEMS                                    │   │
│  │  Curriculum    Announcements   Calendar     Resources                │   │
│  │  Analytics     Student Services Compliance                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      BRONZE CANISTERS (Students)                     │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │Student 1│  │Student 2│  │Student 3│  │Student 4│  │  ...    │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Classroom Orchestration
- Create and manage multiple classrooms
- Teacher assignments and schedules
- Student rosters and transfers
- Teacher dashboards with observability

```javascript
// Create classroom
school.createClassroom({
  classroomId: 'science-201',
  teacherId: 'teacher-002',
  subject: 'Biology',
  grade: 10,
  period: '2nd Period',
  room: 'B-201',
});

// Assign a new teacher
school.assignTeacher('science-201', 'teacher-003', 'Ms. Garcia');

// Get teacher dashboard
const dashboard = school.getClassroomDashboard('science-201');
console.log(dashboard.classroomStats());
```

### 2. Curriculum Management
- Upload and manage curricula
- Map to state standards
- Distribute to classrooms
- Pacing guides and version control

```javascript
// Upload curriculum
school.uploadCurriculum({
  curriculumId: 'algebra-1-2024',
  subject: 'Mathematics',
  grade: 9,
  title: 'Algebra 1 Curriculum',
  track: 'standard',
  units: [
    { unitId: 'unit-1', title: 'Linear Equations', weeks: 4 },
    { unitId: 'unit-2', title: 'Quadratic Functions', weeks: 5 },
  ],
  standards: ['TEKS.MATH.A1.1A', 'TEKS.MATH.A1.2B'],
});

// Distribute to classrooms
school.distributeCurriculum('algebra-1-2024', ['math-101', 'math-102']);

// Update pacing
school.updateCurriculumPacing('algebra-1-2024', {
  startDate: '2024-08-19',
  endDate: '2025-05-23',
  unitSchedule: [
    { unitId: 'unit-1', startDate: '2024-08-19', endDate: '2024-09-13' },
  ],
});
```

### 3. Announcements & News
- School-wide announcements
- Emergency alerts
- Parent notifications
- Newsletter generation

```javascript
// Post announcement
school.postAnnouncement({
  title: 'Fall Festival',
  content: 'Join us for the annual Fall Festival on October 15th!',
  audience: 'all',
  priority: 'normal',
  tags: ['event', 'community'],
});

// Emergency alert
school.postEmergencyAlert(
  'Weather alert: School closing early at 1:00 PM due to severe weather.',
  { type: 'weather' }
);

// Generate newsletter
const { newsletter } = school.generateNewsletter('2024-W42');
```

### 4. Academic Calendar
- School year configuration
- Grading periods
- Holidays and breaks
- Events and activities

```javascript
// Configure school year
school.calendar.configureSchoolYear({
  firstDay: '2024-08-19',
  lastDay: '2025-05-23',
  totalDays: 180,
});

// Set grading periods
school.setGradingPeriods([
  { periodId: 'Q1', name: 'Quarter 1', startDate: '2024-08-19', endDate: '2024-10-18' },
  { periodId: 'Q2', name: 'Quarter 2', startDate: '2024-10-21', endDate: '2024-12-20' },
]);

// Add holiday
school.calendar.addHoliday('Thanksgiving Break', '2024-11-25', '2024-11-29');

// Add event
school.addCalendarEvent({
  title: 'Homecoming Game',
  date: '2024-10-11',
  startTime: '19:00',
  type: 'sports',
  location: 'Stadium',
});
```

### 5. Resource Management
- Textbook and device inventory
- Allocation to classrooms
- Budget tracking
- Maintenance reporting

```javascript
// Add devices to inventory
school.addResource({
  type: 'device',
  name: 'Chromebook',
  quantity: 500,
  unitCost: 299,
  departmentId: 'technology',
});

// Allocate to classroom
school.allocateResource('RES-lincoln-hs-1', 'math-101', 30);

// Track budget
school.trackBudget({
  departmentId: 'mathematics',
  departmentName: 'Mathematics Department',
  allocated: 50000,
  fiscalYear: '2024-2025',
});
```

### 6. Analytics (Anonymized)
- School-wide metrics
- Department performance
- Achievement gap analysis
- Trend tracking

```javascript
// Ingest classroom metrics
school.ingestClassroomMetrics({
  classroomId: 'math-101',
  subject: 'Mathematics',
  grade: 9,
  teacherId: 'teacher-001',
  date: '2024-10-15',
  metrics: {
    attendanceRate: 94.5,
    avgEngagement: 78,
    avgPerformance: 82,
    studentCount: 28,
  },
});

// Get school-wide metrics
const metrics = school.schoolwideMetrics();

// Identify gaps
const { gaps, recommendations } = school.identifyGaps({ groupBy: 'subject' });

// Trend analysis
const trend = school.trendAnalysis('performance', { granularity: 'week' });
```

### 7. Student Services
- Counselor referrals
- IEP/504 plan tracking
- Interventions
- Behavioral incidents
- Wellness monitoring

```javascript
// Create referral
school.createReferral({
  studentId: 'student-001',
  type: 'counseling',
  reason: 'Academic stress concerns',
  referredBy: 'teacher-001',
  urgency: 'medium',
});

// Create student plan (IEP)
school.createStudentPlan({
  studentId: 'student-002',
  type: 'iep',
  startDate: '2024-08-19',
  endDate: '2025-08-18',
  goals: [{ goal: 'Reading comprehension', target: 'Grade level' }],
  accommodations: ['Extended time on tests', 'Preferential seating'],
});

// Track intervention
school.trackIntervention({
  studentId: 'student-001',
  type: 'tutoring',
  description: 'After-school math tutoring',
  frequency: 'twice weekly',
});

// Flag wellness concern
school.flagWellnessCheck('student-003', {
  type: 'social',
  description: 'Student appears withdrawn',
  reportedBy: 'teacher-002',
});
```

### 8. Compliance & Reporting
- FERPA compliance
- State reporting
- Graduation tracking
- Audit trail

```javascript
// Verify FERPA compliance
const ferpa = school.verifyFerpaCompliance();
console.log(ferpa.compliant, ferpa.issues);

// Generate state report
const { report } = school.generateStateReport('attendance', {
  period: 'Q1',
  startDate: '2024-08-19',
  endDate: '2024-10-18',
});

// Track graduation progress
school.trackGraduationProgress('student-001', {
  totalCredits: 18,
  creditsBySubject: { english: 3, math: 3, science: 3 },
  expectedGraduation: '2027-05-23',
});

// Get audit trail
const { auditTrail } = school.getAuditTrail({ type: 'STUDENT_ENROLLED' });
```

### 9. Facility Management
- Room scheduling
- Maintenance requests

```javascript
// Add room
school.addRoom({
  roomId: 'auditorium',
  name: 'Main Auditorium',
  type: 'auditorium',
  capacity: 500,
});

// Schedule room
school.scheduleRoom('auditorium', {
  title: 'Fall Assembly',
  date: '2024-10-20',
  startTime: '09:00',
  endTime: '10:30',
  organizer: 'principal-001',
});

// Submit maintenance request
school.submitMaintenanceRequest({
  location: 'A-101',
  issue: 'Projector not working',
  priority: 'high',
  reportedBy: 'teacher-001',
});
```

### 10. Communication Hub
- Broadcast messages
- Internal messaging

```javascript
// Send broadcast
school.sendBroadcast(
  'Reminder: Parent-teacher conferences next week.',
  'parents',
  { subject: 'Conference Reminder' }
);

// Get messages
const messages = school.getMessages('teacher-001');
```

## Student Management

```javascript
// Enroll student (creates Bronze Canister)
school.enrollStudent({
  studentId: 'student-005',
  studentName: 'Bob Williams',
  grade: 10,
  classroomIds: ['science-201', 'english-301'],
});

// Transfer student
school.transferStudent('student-005', 'science-202', 'science-201');

// Get student's Bronze Canister
const canister = school.getStudentCanister('student-005');
canister.speak('help me study photosynthesis');

// Unenroll (exports data first - L78 Persistence Guarantee)
const { exportedData } = school.unenrollStudent('student-005');
```

## Direct Subsystem Access

For advanced operations, access subsystems directly:

```javascript
// Curriculum repository
const versions = school.curriculum.getVersionHistory('algebra-1-2024');

// Announcements
const activeAlerts = school.announcements.getActiveAlerts();

// Calendar
const today = school.calendar.getToday();

// Resources
const report = school.resources.inventoryReport();

// Analytics
const recommendations = school.analytics.generateRecommendations();

// Student services
const stats = school.studentServices.stats();

// Compliance
const integrity = school.compliance.verifyAuditTrailIntegrity();
```

## 🧠 AI Intelligence System (NEW in v2.0)

The Silver Canister now includes **real AI uses** powered by MERIDIAN engines:

### AI School Health Analysis

```javascript
// Comprehensive AI analysis of school health
const analysis = school.analyzeSchool();
console.log(analysis);
// {
//   healthScore: 87,
//   riskLevel: 'normal',
//   totalStudents: 450,
//   metrics: { avgAttendance: 94.2, avgPerformance: 78, avgEngagement: 3.6 },
//   patterns: ['consistent_attendance', 'improving_performance'],
//   alerts: [],
//   recommendations: [
//     { type: 'INTERVENTION_PROGRAM', priority: 'medium', reason: '12% of students at risk' }
//   ],
//   cognovexAssessment: { risk: 'normal', consensus: true }
// }
```

### AI At-Risk Student Detection

```javascript
// CEREBEX pattern detection + COGNOVEX quorum for risk assessment
const riskAnalysis = school.identifyAtRiskStudents();
// {
//   totalStudents: 450,
//   totalAtRisk: 54,
//   atRiskPercent: 12.0,
//   byCategory: {
//     academic: 28,      // Low GPA
//     attendance: 15,    // Chronic absenteeism
//     behavioral: 8,     // Multiple incidents
//     wellness: 12,      // Flagged by wellness checks
//     graduation: 5,     // Behind on credits
//   },
//   recommendations: [
//     { category: 'academic', action: 'Implement targeted tutoring program', urgency: 'high' }
//   ]
// }
```

### AI Outcome Predictions

```javascript
// CEREBEX trend analysis for predictions
const prediction = school.predictOutcomes({ metric: 'graduation', timeframe: 'year' });
// {
//   metric: 'graduation',
//   currentValue: 89,
//   predictedValue: 91,
//   confidence: 75,
//   trend: 'improving',
//   factors: [{ factor: 'high_engagement', impact: 'positive' }]
// }
```

### AI Intervention Recommendations

```javascript
// COGNOVEX multi-stakeholder quorum for school-wide decisions
const interventions = school.recommendInterventions();
// {
//   interventions: [
//     {
//       type: 'TUTORING_PROGRAM',
//       priority: 'high',
//       targetGroup: 'academically at-risk students',
//       estimatedStudents: 28,
//       estimatedCost: 5600,
//       estimatedImpact: 'GPA improvement of 0.3-0.5 points',
//       cognovexApproval: true
//     },
//     {
//       type: 'ATTENDANCE_INCENTIVE',
//       priority: 'high',
//       targetGroup: 'chronically absent students',
//       estimatedStudents: 15,
//       estimatedCost: 750,
//       estimatedImpact: '10-15% attendance improvement',
//       cognovexApproval: true
//     }
//   ],
//   totalEstimatedCost: 6350,
//   approvedCount: 2
// }
```

### AI Staffing Recommendations

```javascript
// CEREBEX analyzes teacher load and class sizes
const staffing = school.aiStaffingRecommendations();
// {
//   teacherCount: 25,
//   avgStudentsPerTeacher: 72,
//   recommendations: [
//     { type: 'HIRE_SUPPORT', priority: 'high', reason: '3 teachers have classes over 30' }
//   ]
// }
```

### AI Resource Allocation

```javascript
// Optimize device and textbook distribution
const resources = school.aiResourceAllocation();
// {
//   totalStudents: 450,
//   totalDevices: 420,
//   deviceGap: 30,
//   recommendations: [
//     { type: 'PURCHASE_DEVICES', priority: 'high', estimatedCost: 9000 }
//   ]
// }
```

### AI Schedule Optimization

```javascript
// Room utilization and bell schedule analysis
const schedule = school.aiScheduleOptimization();
// {
//   totalRooms: 40,
//   avgUtilization: 72,
//   recommendations: [
//     { type: 'ROOM_CONSOLIDATION', priority: 'low', reason: '5 rooms < 50% utilized' }
//   ]
// }
```

## 🔗 StudentAI ↔ SilverCanister Connection

The school and students are **connected**:

### School → Student (Push)

```javascript
// Push schedule to StudentAI
const schedule = school.getStudentSchedule('student-001');
// StudentAI calls this to sync classes, bell times, grading periods

// Push announcements to students
const news = school.getAnnouncementsForStudents({ limit: 5 });
```

### Student → School (Pull)

```javascript
// StudentAI pushes metrics up to school
school.receiveStudentMetrics({
  studentId: 'student-001',
  grade: 10,
  studyHoursWeek: 12,
  gpa: 3.4,
  overdueCount: 0,
  streak: 14,
  wellnessAvg: 4.2
});
```

### Request Routing (NEXORIS)

```javascript
// StudentAI routes requests through school
school.routeStudentRequest({
  studentId: 'student-001',
  type: 'TUTORING_REQUEST',
  data: { subject: 'Math', urgency: 'high' }
});
// → Routed to tutoring_services, referral created

school.routeStudentRequest({
  studentId: 'student-002',
  type: 'WELLNESS_CONCERN',
  data: { type: 'stress', reason: 'Academic pressure' }
});
// → Routed to counseling_services, wellness check flagged
```

## 🏛️ District Integration (BISD)

### Push to District

```javascript
// School pushes metrics to district
const metrics = school.getDistrictMetrics();
// {
//   schoolId: 'lincoln-hs',
//   districtId: 'dallas-isd',
//   enrollment: { totalStudents: 450, totalClassrooms: 25, byGrade: {...} },
//   performance: { avgAttendance: 94.2, avgPerformance: 78, graduationRate: 91 },
//   atRisk: { totalAtRisk: 54, atRiskPercent: 12 },
//   compliance: { openIssues: 0 }
// }
```

### Receive from District

```javascript
// District pushes directives to schools
school.receiveDistrictDirective({
  type: 'CURRICULUM_UPDATE',
  content: { curriculumId: 'math-standards-2025', updates: {...} },
  mandatory: true
});

school.receiveDistrictDirective({
  type: 'POLICY_CHANGE',
  content: { title: 'Updated Attendance Policy', description: '...' }
});
```

### Benchmark Against District

```javascript
// Compare school vs district performance
const benchmark = school.benchmarkAgainstDistrict({
  avgAttendance: 93,
  avgPerformance: 75,
  graduationRate: 88,
  atRiskPercent: 15
});
// {
//   metrics: [
//     { metric: 'attendance', school: 94.2, district: 93, status: 'above_average' },
//     { metric: 'performance', school: 78, district: 75, status: 'above_average' }
//   ],
//   summary: { aboveAverage: 3, belowAverage: 1, overallStatus: 'performing_well' }
// }
```

## Theory Basis

The Silver Canister is built on the theoretical foundations of the MERIDIAN papers:

- **Paper XV (ASK III)** — School-level canister architecture
- **Paper V (LEGES ANIMAE)** — Behavioral Laws enforcement
- **Paper XIX (CIVITAS MERIDIANA)** — Civic infrastructure layer
- **Paper XX (STIGMERGY)** — Immutable pheromone trail (CHRONO)
- **Paper X (EXECUTIO UNIVERSALIS)** — query = act = learn = log
- **Paper II (CONCORDIA MACHINAE)** — Kuramoto synchronization

## Exports

```javascript
import {
  SilverCanister,
  CurriculumRepository,
  AnnouncementBoard,
  AcademicCalendar,
  ResourceInventory,
  SchoolAnalytics,
  StudentServices,
  ComplianceEngine,
} from '@medina/silver-canister';
```

## License

See LICENSE in the repository root.

## Author

Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
