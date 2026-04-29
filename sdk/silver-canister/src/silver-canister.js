/**
 * SILVER-CANISTER — School-Level Sovereign System
 * ──────────────────────────────────────────────────────────────────────────────
 * The Silver Canister is the school-level orchestration layer. It controls all
 * Bronze Canisters (students) and manages the entire school system:
 *
 *   - Classroom orchestration (teachers, rosters, schedules)
 *   - Curriculum management (lesson plans, standards, pacing)
 *   - News & announcements (school-wide, emergency alerts)
 *   - Academic calendar (grading periods, holidays, events)
 *   - Resource management (textbooks, devices, budgets)
 *   - Performance analytics (anonymized school-wide metrics)
 *   - Student services (counseling, special ed, interventions)
 *   - Compliance & reporting (FERPA, state reports, audit trail)
 *   - Facility management (room scheduling, maintenance)
 *   - Communication hub (broadcasts, messaging)
 *
 * The school administrator speaks. The Silver Canister acts. Everything is logged.
 *
 * Theory basis:
 *   Paper XV   — ASK III: school-level canister architecture
 *   Paper V    — LEGES ANIMAE: Behavioral Laws enforcement
 *   Paper XIX  — CIVITAS MERIDIANA: civic infrastructure layer
 *   Paper XX   — STIGMERGY: immutable pheromone trail (CHRONO)
 *   Paper X    — EXECUTIO UNIVERSALIS: query = act = learn = log
 *   Paper II   — CONCORDIA MACHINAE: Kuramoto synchronization
 *   Paper XXI  — QUORUM: decisions without authority
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

import {
  CHRONO,
  CEREBEX,
  NEXORIS,
  HDI,
  CognovexNetwork,
} from '../../meridian-sovereign-os/src/index.js';

import { BronzeCanister } from '../../bronze-canister/src/bronze-canister.js';
import { TeacherDashboard } from '../../bronze-canister/src/teacher-dashboard.js';

import { CurriculumRepository } from './curriculum-repository.js';
import { AnnouncementBoard } from './announcement-board.js';
import { AcademicCalendar } from './academic-calendar.js';
import { ResourceInventory } from './resource-inventory.js';
import { SchoolAnalytics } from './school-analytics.js';
import { StudentServices } from './student-services.js';
import { ComplianceEngine } from './compliance-engine.js';

// ---------------------------------------------------------------------------
// SilverCanister
// ---------------------------------------------------------------------------

export class SilverCanister {
  /**
   * Create a Silver Canister for a school.
   *
   * @param {object} options
   * @param {string} options.schoolId      - Unique school identifier
   * @param {string} options.schoolName    - School display name
   * @param {string} options.districtId    - District identifier
   * @param {string} options.principalId   - Principal identifier
   * @param {string} [options.principalName] - Principal display name
   * @param {string} [options.schoolYear]  - Current school year (e.g., '2024-2025')
   * @param {string} [options.state]       - State for compliance reporting
   * @param {string} [options.canisterId]  - ICP canister identifier
   */
  constructor({
    schoolId,
    schoolName,
    districtId,
    principalId,
    principalName = null,
    schoolYear = null,
    state = '',
    canisterId = null,
  }) {
    if (!schoolId) throw new Error('SilverCanister requires a schoolId');
    if (!schoolName) throw new Error('SilverCanister requires a schoolName');
    if (!districtId) throw new Error('SilverCanister requires a districtId');
    if (!principalId) throw new Error('SilverCanister requires a principalId');

    /** @type {string} */
    this.schoolId = schoolId;

    /** @type {string} */
    this.schoolName = schoolName;

    /** @type {string} */
    this.districtId = districtId;

    /** @type {string} */
    this.principalId = principalId;

    /** @type {string|null} */
    this.principalName = principalName;

    /** @type {string} */
    this.schoolYear = schoolYear || this._defaultSchoolYear();

    /** @type {string} */
    this.state = state;

    /** @type {string} */
    this.canisterId = canisterId || `SC::${districtId}::${schoolId}`;

    // ── Internal state ────────────────────────────────────────────────────
    /** @type {boolean} */
    this._provisioned = false;

    /** @type {boolean} */
    this._active = false;

    /** @type {string|null} */
    this._lastAction = null;

    // ── Classrooms (classroomId → classroom object) ───────────────────────
    /** @type {Map<string, object>} */
    this._classrooms = new Map();

    // ── Students/Bronze Canisters (studentId → BronzeCanister) ────────────
    /** @type {Map<string, object>} */
    this._studentCanisters = new Map();

    // ── Student enrollment (studentId → enrollment info) ──────────────────
    /** @type {Map<string, object>} */
    this._enrollments = new Map();

    // ── Teacher Dashboards (classroomId → TeacherDashboard) ───────────────
    /** @type {Map<string, object>} */
    this._teacherDashboards = new Map();

    // ── Rooms/Facilities (roomId → room object) ───────────────────────────
    /** @type {Map<string, object>} */
    this._rooms = new Map();

    // ── Room schedules (roomId → schedule array) ──────────────────────────
    /** @type {Map<string, object[]>} */
    this._roomSchedules = new Map();

    // ── Maintenance requests ──────────────────────────────────────────────
    /** @type {object[]} */
    this._maintenanceRequests = [];

    // ── Messages ──────────────────────────────────────────────────────────
    /** @type {object[]} */
    this._messages = [];

    // ── Engines (initialized on provision) ────────────────────────────────
    /** @type {object|null} */
    this._chrono = null;

    /** @type {object|null} */
    this._cerebex = null;

    /** @type {object|null} */
    this._nexoris = null;

    /** @type {object|null} */
    this._hdi = null;

    /** @type {object|null} */
    this._cognovex = null;

    // ── Sub-systems ───────────────────────────────────────────────────────
    /** @type {object|null} */
    this._curriculum = null;

    /** @type {object|null} */
    this._announcements = null;

    /** @type {object|null} */
    this._calendar = null;

    /** @type {object|null} */
    this._resources = null;

    /** @type {object|null} */
    this._analytics = null;

    /** @type {object|null} */
    this._studentServices = null;

    /** @type {object|null} */
    this._compliance = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Provision the Silver Canister.
   * Initializes all engines and sub-systems.
   *
   * @returns {{ provisioned: boolean, canisterId: string, schoolId: string, engines: string[], systems: string[] }}
   */
  provision() {
    if (this._provisioned) {
      return {
        provisioned: true,
        canisterId: this.canisterId,
        schoolId: this.schoolId,
        message: 'Already provisioned',
        engines: this._listEngines(),
        systems: this._listSystems(),
      };
    }

    // ── 1. CHRONO — immutable hash-chain audit trail ──────────────────────
    this._chrono = new CHRONO({ genesisLabel: `SILVER_CANISTER::${this.canisterId}` });

    // ── 2. NEXORIS — pheromone field for routing ──────────────────────────
    this._nexoris = new NEXORIS({ couplingStrength: 1.0 });
    this._nexoris.setChrono(this._chrono);

    // ── 3. CEREBEX — world model for analytics ────────────────────────────
    this._cerebex = new CEREBEX();
    this._cerebex.setChrono(this._chrono);

    // ── 4. COGNOVEX — multi-stakeholder decision support ──────────────────
    this._cognovex = new CognovexNetwork();
    this._cognovex.setChrono(this._chrono).setNexoris(this._nexoris);
    // Add school stakeholder units
    const domains = ['ACADEMICS', 'OPERATIONS', 'STUDENT_SERVICES', 'COMPLIANCE', 'FINANCE', 'COMMUNITY'];
    for (let i = 0; i < domains.length; i++) {
      this._cognovex.addUnit(`school-${i}`, domains[i]);
    }

    // ── 5. HDI — natural language → pipeline interface ────────────────────
    this._hdi = new HDI(
      { cerebex: this._cerebex, nexoris: this._nexoris, chrono: this._chrono, cognovex: this._cognovex },
      `SC::${this.schoolId}`,
    );

    // ── 6. Sub-systems ────────────────────────────────────────────────────

    // Curriculum Repository
    this._curriculum = new CurriculumRepository({ schoolId: this.schoolId });
    this._curriculum.setChrono(this._chrono);

    // Announcement Board
    this._announcements = new AnnouncementBoard({
      schoolId: this.schoolId,
      schoolName: this.schoolName,
    });
    this._announcements.setChrono(this._chrono);

    // Academic Calendar
    this._calendar = new AcademicCalendar({
      schoolId: this.schoolId,
      schoolYear: this.schoolYear,
    });
    this._calendar.setChrono(this._chrono);

    // Resource Inventory
    this._resources = new ResourceInventory({ schoolId: this.schoolId });
    this._resources.setChrono(this._chrono);

    // School Analytics
    this._analytics = new SchoolAnalytics({ schoolId: this.schoolId });
    this._analytics.setChrono(this._chrono);
    this._analytics.setCerebex(this._cerebex);

    // Student Services
    this._studentServices = new StudentServices({ schoolId: this.schoolId });
    this._studentServices.setChrono(this._chrono);

    // Compliance Engine
    this._compliance = new ComplianceEngine({
      schoolId: this.schoolId,
      districtId: this.districtId,
      state: this.state,
    });
    this._compliance.setChrono(this._chrono);

    // ── Mark provisioned ──────────────────────────────────────────────────
    this._provisioned = true;
    this._active = true;
    this._lastAction = new Date().toISOString();

    this._chrono.append({
      type: 'SILVER_CANISTER_PROVISIONED',
      schoolId: this.schoolId,
      schoolName: this.schoolName,
      districtId: this.districtId,
      canisterId: this.canisterId,
      principalId: this.principalId,
      schoolYear: this.schoolYear,
      timestamp: this._lastAction,
    });

    return {
      provisioned: true,
      canisterId: this.canisterId,
      schoolId: this.schoolId,
      engines: this._listEngines(),
      systems: this._listSystems(),
    };
  }

  /**
   * Get full school status.
   *
   * @returns {object} Complete status object
   */
  status() {
    return {
      provisioned: this._provisioned,
      active: this._active,
      canisterId: this.canisterId,
      schoolId: this.schoolId,
      schoolName: this.schoolName,
      districtId: this.districtId,
      principalId: this.principalId,
      schoolYear: this.schoolYear,
      lastAction: this._lastAction,
      classrooms: this._classrooms.size,
      students: this._studentCanisters.size,
      enrollments: this._enrollments.size,
      rooms: this._rooms.size,
      chronoLength: this._chrono ? (typeof this._chrono.chain === 'function' ? this._chrono.chain().length : 0) : 0,
      subsystems: {
        curriculum: this._curriculum?.stats() || null,
        announcements: this._announcements?.stats() || null,
        calendar: this._calendar?.stats() || null,
        resources: this._resources?.stats() || null,
        analytics: this._analytics?.stats() || null,
        studentServices: this._studentServices?.stats() || null,
        compliance: this._compliance?.stats() || null,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSROOM MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a classroom.
   *
   * @param {object} classroom
   * @param {string} classroom.classroomId - Classroom identifier
   * @param {string} classroom.teacherId   - Assigned teacher
   * @param {string} classroom.subject     - Subject area
   * @param {number} classroom.grade       - Grade level
   * @param {string} [classroom.period]    - Period/time slot
   * @param {string} [classroom.room]      - Room number
   * @param {string} [classroom.teacherName] - Teacher display name
   * @returns {{ created: boolean, classroomId: string }}
   */
  createClassroom(classroom) {
    this._ensureProvisioned();

    const { classroomId, teacherId, subject, grade, period = null, room = null, teacherName = null } = classroom;

    if (!classroomId) throw new Error('Classroom requires a classroomId');
    if (!teacherId) throw new Error('Classroom requires a teacherId');
    if (!subject) throw new Error('Classroom requires a subject');
    if (grade === undefined) throw new Error('Classroom requires a grade');

    const classroomObj = {
      classroomId,
      teacherId,
      teacherName,
      subject,
      grade,
      period,
      room,
      schoolId: this.schoolId,
      students: new Set(),
      createdAt: new Date().toISOString(),
      active: true,
    };

    this._classrooms.set(classroomId, classroomObj);

    // Create teacher dashboard
    const dashboard = new TeacherDashboard({
      teacherId,
      classroomId,
      schoolId: this.schoolId,
    });
    this._teacherDashboards.set(classroomId, dashboard);

    this._touchAction();
    this._log('CLASSROOM_CREATED', { classroomId, teacherId, subject, grade });

    return { created: true, classroomId };
  }

  /**
   * Remove a classroom.
   *
   * @param {string} classroomId - Classroom identifier
   * @returns {{ removed: boolean, classroomId: string }}
   */
  removeClassroom(classroomId) {
    this._ensureProvisioned();

    const classroom = this._classrooms.get(classroomId);
    if (!classroom) {
      return { removed: false, classroomId, error: 'Classroom not found' };
    }

    // Unenroll students from classroom
    for (const studentId of classroom.students) {
      const enrollment = this._enrollments.get(studentId);
      if (enrollment) {
        enrollment.classroomIds = enrollment.classroomIds.filter(id => id !== classroomId);
      }
    }

    this._classrooms.delete(classroomId);
    this._teacherDashboards.delete(classroomId);

    this._touchAction();
    this._log('CLASSROOM_REMOVED', { classroomId });

    return { removed: true, classroomId };
  }

  /**
   * List all classrooms.
   *
   * @param {object} [filters]
   * @param {string} [filters.teacherId] - Filter by teacher
   * @param {string} [filters.subject]   - Filter by subject
   * @param {number} [filters.grade]     - Filter by grade
   * @returns {object[]} Array of classrooms
   */
  listClassrooms(filters = {}) {
    this._ensureProvisioned();

    let classrooms = Array.from(this._classrooms.values());

    if (filters.teacherId) {
      classrooms = classrooms.filter(c => c.teacherId === filters.teacherId);
    }
    if (filters.subject) {
      classrooms = classrooms.filter(c => c.subject === filters.subject);
    }
    if (filters.grade !== undefined) {
      classrooms = classrooms.filter(c => c.grade === filters.grade);
    }

    return classrooms.map(c => ({
      ...c,
      students: Array.from(c.students),
      studentCount: c.students.size,
    }));
  }

  /**
   * Assign a teacher to a classroom.
   *
   * @param {string} classroomId - Classroom identifier
   * @param {string} teacherId   - New teacher identifier
   * @param {string} [teacherName] - Teacher display name
   * @returns {{ assigned: boolean, classroomId: string, teacherId: string }}
   */
  assignTeacher(classroomId, teacherId, teacherName = null) {
    this._ensureProvisioned();

    const classroom = this._classrooms.get(classroomId);
    if (!classroom) {
      return { assigned: false, classroomId, error: 'Classroom not found' };
    }

    const previousTeacher = classroom.teacherId;
    classroom.teacherId = teacherId;
    classroom.teacherName = teacherName || classroom.teacherName;

    // Update teacher dashboard
    const dashboard = new TeacherDashboard({
      teacherId,
      classroomId,
      schoolId: this.schoolId,
    });

    // Transfer student canisters to new dashboard
    for (const studentId of classroom.students) {
      const canister = this._studentCanisters.get(studentId);
      if (canister) {
        dashboard.addCanister(canister);
      }
    }

    this._teacherDashboards.set(classroomId, dashboard);

    this._touchAction();
    this._log('TEACHER_ASSIGNED', { classroomId, teacherId, previousTeacher });

    return { assigned: true, classroomId, teacherId };
  }

  /**
   * Get teacher dashboard for a classroom.
   *
   * @param {string} classroomId - Classroom identifier
   * @returns {object|null} TeacherDashboard or null
   */
  getClassroomDashboard(classroomId) {
    this._ensureProvisioned();
    return this._teacherDashboards.get(classroomId) || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENT / BRONZE CANISTER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enroll a student (creates their Bronze Canister).
   *
   * @param {object} student
   * @param {string} student.studentId   - Student identifier
   * @param {number} student.grade       - Student grade level
   * @param {string[]} student.classroomIds - Classrooms to enroll in
   * @param {string} [student.studentName] - Student display name
   * @returns {{ enrolled: boolean, studentId: string, canisterId: string }}
   */
  enrollStudent(student) {
    this._ensureProvisioned();

    const { studentId, grade, classroomIds = [], studentName = null } = student;

    if (!studentId) throw new Error('Student requires a studentId');
    if (grade === undefined) throw new Error('Student requires a grade');

    // Create Bronze Canister for student
    const canister = new BronzeCanister({
      studentId,
      grade,
      schoolId: this.schoolId,
    });
    canister.provision();

    this._studentCanisters.set(studentId, canister);

    // Create enrollment record
    const enrollment = {
      studentId,
      studentName,
      grade,
      classroomIds: [...classroomIds],
      schoolId: this.schoolId,
      enrolledAt: new Date().toISOString(),
      active: true,
    };
    this._enrollments.set(studentId, enrollment);

    // Add to classrooms
    for (const classroomId of classroomIds) {
      const classroom = this._classrooms.get(classroomId);
      if (classroom) {
        classroom.students.add(studentId);

        // Add to teacher dashboard
        const dashboard = this._teacherDashboards.get(classroomId);
        if (dashboard) {
          dashboard.addCanister(canister);
        }
      }
    }

    this._touchAction();
    this._log('STUDENT_ENROLLED', {
      studentId,
      grade,
      classroomIds,
      canisterId: canister.canisterId,
    });

    return { enrolled: true, studentId, canisterId: canister.canisterId };
  }

  /**
   * Unenroll a student.
   *
   * @param {string} studentId - Student identifier
   * @returns {{ unenrolled: boolean, studentId: string, exportedData: object }}
   */
  unenrollStudent(studentId) {
    this._ensureProvisioned();

    const canister = this._studentCanisters.get(studentId);
    const enrollment = this._enrollments.get(studentId);

    if (!canister || !enrollment) {
      return { unenrolled: false, studentId, error: 'Student not found' };
    }

    // Export data before removing (L78 Persistence Guarantee)
    const exportedData = canister.exportData();

    // Remove from classrooms
    for (const classroomId of enrollment.classroomIds) {
      const classroom = this._classrooms.get(classroomId);
      if (classroom) {
        classroom.students.delete(studentId);
      }

      const dashboard = this._teacherDashboards.get(classroomId);
      if (dashboard) {
        dashboard.removeCanister(studentId);
      }
    }

    // Destroy canister (data is exported first)
    canister.destroy();

    this._studentCanisters.delete(studentId);
    this._enrollments.delete(studentId);

    this._touchAction();
    this._log('STUDENT_UNENROLLED', { studentId });

    return { unenrolled: true, studentId, exportedData };
  }

  /**
   * Transfer a student to a different classroom.
   *
   * @param {string} studentId     - Student identifier
   * @param {string} toClassroomId - Target classroom
   * @param {string} [fromClassroomId] - Source classroom (optional, removes from all if not specified)
   * @returns {{ transferred: boolean, studentId: string, toClassroomId: string }}
   */
  transferStudent(studentId, toClassroomId, fromClassroomId = null) {
    this._ensureProvisioned();

    const canister = this._studentCanisters.get(studentId);
    const enrollment = this._enrollments.get(studentId);
    const toClassroom = this._classrooms.get(toClassroomId);

    if (!canister || !enrollment) {
      return { transferred: false, studentId, error: 'Student not found' };
    }
    if (!toClassroom) {
      return { transferred: false, studentId, error: 'Target classroom not found' };
    }

    // Remove from source classroom(s)
    if (fromClassroomId) {
      const fromClassroom = this._classrooms.get(fromClassroomId);
      if (fromClassroom) {
        fromClassroom.students.delete(studentId);
        const dashboard = this._teacherDashboards.get(fromClassroomId);
        if (dashboard) dashboard.removeCanister(studentId);
        enrollment.classroomIds = enrollment.classroomIds.filter(id => id !== fromClassroomId);
      }
    }

    // Add to target classroom
    if (!enrollment.classroomIds.includes(toClassroomId)) {
      enrollment.classroomIds.push(toClassroomId);
    }
    toClassroom.students.add(studentId);

    const dashboard = this._teacherDashboards.get(toClassroomId);
    if (dashboard) {
      dashboard.addCanister(canister);
    }

    this._touchAction();
    this._log('STUDENT_TRANSFERRED', { studentId, toClassroomId, fromClassroomId });

    return { transferred: true, studentId, toClassroomId };
  }

  /**
   * List students with optional filters.
   *
   * @param {string} [classroomId] - Filter by classroom
   * @returns {object[]} Array of student enrollment info
   */
  listStudents(classroomId = null) {
    this._ensureProvisioned();

    let enrollments = Array.from(this._enrollments.values());

    if (classroomId) {
      enrollments = enrollments.filter(e => e.classroomIds.includes(classroomId));
    }

    return enrollments.map(e => ({
      ...e,
      canisterId: this._studentCanisters.get(e.studentId)?.canisterId || null,
    }));
  }

  /**
   * Get a student's Bronze Canister.
   *
   * @param {string} studentId - Student identifier
   * @returns {object|null} BronzeCanister or null
   */
  getStudentCanister(studentId) {
    this._ensureProvisioned();
    return this._studentCanisters.get(studentId) || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CURRICULUM
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Upload a curriculum to the repository.
   *
   * @param {object} curriculum - Curriculum object
   * @returns {{ uploaded: boolean, curriculumId: string, version: number }}
   */
  uploadCurriculum(curriculum) {
    this._ensureProvisioned();
    this._touchAction();
    return this._curriculum.upload(curriculum);
  }

  /**
   * Get a curriculum by ID.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @returns {object|null} Curriculum or null
   */
  getCurriculum(curriculumId) {
    this._ensureProvisioned();
    return this._curriculum.get(curriculumId);
  }

  /**
   * List all curricula.
   *
   * @param {object} [filters] - Optional filters
   * @returns {object[]} Array of curricula
   */
  listCurricula(filters = {}) {
    this._ensureProvisioned();
    return this._curriculum.list(filters);
  }

  /**
   * Distribute curriculum to classrooms.
   *
   * @param {string} curriculumId   - Curriculum identifier
   * @param {string[]} classroomIds - Target classrooms
   * @returns {{ distributed: boolean, curriculumId: string, classroomIds: string[] }}
   */
  distributeCurriculum(curriculumId, classroomIds) {
    this._ensureProvisioned();
    this._touchAction();
    return this._curriculum.distribute(curriculumId, classroomIds);
  }

  /**
   * Update curriculum pacing.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @param {object} pacing       - Pacing configuration
   * @returns {{ updated: boolean, curriculumId: string }}
   */
  updateCurriculumPacing(curriculumId, pacing) {
    this._ensureProvisioned();
    this._touchAction();
    return this._curriculum.updatePacing(curriculumId, pacing);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANNOUNCEMENTS / NEWS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Post an announcement.
   *
   * @param {object} announcement - Announcement object
   * @returns {{ posted: boolean, announcementId: string, timestamp: string }}
   */
  postAnnouncement(announcement) {
    this._ensureProvisioned();
    this._touchAction();
    return this._announcements.post(announcement);
  }

  /**
   * Get announcements with optional filters.
   *
   * @param {object} [filters] - Optional filters
   * @returns {object[]} Array of announcements
   */
  getAnnouncements(filters = {}) {
    this._ensureProvisioned();
    return this._announcements.list(filters);
  }

  /**
   * Post an emergency alert.
   *
   * @param {string} content  - Alert content
   * @param {object} [options] - Alert options
   * @returns {{ alerted: boolean, alertId: string, timestamp: string }}
   */
  postEmergencyAlert(content, options = {}) {
    this._ensureProvisioned();
    this._touchAction();
    return this._announcements.postEmergencyAlert(content, options);
  }

  /**
   * Generate a newsletter for a period.
   *
   * @param {string} period   - Period identifier
   * @param {object} [options] - Newsletter options
   * @returns {{ newsletter: object }}
   */
  generateNewsletter(period, options = {}) {
    this._ensureProvisioned();
    return this._announcements.generateNewsletter(period, {
      ...options,
      calendar: this._calendar,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALENDAR
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a calendar event.
   *
   * @param {object} event - Event object
   * @returns {{ added: boolean, eventId: string }}
   */
  addCalendarEvent(event) {
    this._ensureProvisioned();
    this._touchAction();
    return this._calendar.addEvent(event);
  }

  /**
   * Get calendar events.
   *
   * @param {string} [startDate] - Start date filter
   * @param {string} [endDate]   - End date filter
   * @returns {object[]} Array of events
   */
  getCalendar(startDate = null, endDate = null) {
    this._ensureProvisioned();
    return this._calendar.getEvents({ startDate, endDate });
  }

  /**
   * Set grading periods.
   *
   * @param {object[]} periods - Array of grading period objects
   * @returns {{ set: boolean, periodCount: number }}
   */
  setGradingPeriods(periods) {
    this._ensureProvisioned();
    this._touchAction();
    return this._calendar.setGradingPeriods(periods);
  }

  /**
   * Get grading periods.
   *
   * @returns {object[]} Array of grading periods
   */
  getGradingPeriods() {
    this._ensureProvisioned();
    return this._calendar.getGradingPeriods();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a resource to inventory.
   *
   * @param {object} resource - Resource object
   * @returns {{ added: boolean, resourceId: string }}
   */
  addResource(resource) {
    this._ensureProvisioned();
    this._touchAction();
    return this._resources.addResource(resource);
  }

  /**
   * Allocate a resource to a classroom.
   *
   * @param {string} resourceId  - Resource identifier
   * @param {string} classroomId - Classroom identifier
   * @param {number} [quantity]  - Quantity to allocate
   * @returns {{ allocated: boolean, resourceId: string, allocationId: string }}
   */
  allocateResource(resourceId, classroomId, quantity = 1) {
    this._ensureProvisioned();
    this._touchAction();
    return this._resources.allocate(resourceId, {
      assigneeType: 'classroom',
      assigneeId: classroomId,
      quantity,
    });
  }

  /**
   * Get resource inventory.
   *
   * @param {object} [filters] - Optional filters
   * @returns {object[]} Array of resources
   */
  getResourceInventory(filters = {}) {
    this._ensureProvisioned();
    return this._resources.listResources(filters);
  }

  /**
   * Track department budget.
   *
   * @param {object} budget - Budget object
   * @returns {{ set: boolean, departmentId: string }}
   */
  trackBudget(budget) {
    this._ensureProvisioned();
    this._touchAction();
    return this._resources.setBudget(budget);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS (Anonymized)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get school-wide metrics.
   *
   * @param {object} [options] - Options (startDate, endDate)
   * @returns {{ schoolId: string, period: object, metrics: object, classroomCount: number }}
   */
  schoolwideMetrics(options = {}) {
    this._ensureProvisioned();
    return this._analytics.schoolwideMetrics(options);
  }

  /**
   * Get department/subject metrics.
   *
   * @param {string} subject   - Subject area
   * @param {object} [options] - Options
   * @returns {{ subject: string, metrics: object, classroomCount: number }}
   */
  departmentMetrics(subject, options = {}) {
    this._ensureProvisioned();
    return this._analytics.departmentMetrics(subject, options);
  }

  /**
   * Identify achievement gaps.
   *
   * @param {object} [options] - Options
   * @returns {{ gaps: object[], recommendations: string[] }}
   */
  identifyGaps(options = {}) {
    this._ensureProvisioned();
    return this._analytics.identifyGaps(options);
  }

  /**
   * Analyze trends over time.
   *
   * @param {string} metric     - Metric to analyze
   * @param {object} [timeRange] - Time range options
   * @returns {{ metric: string, trend: string, dataPoints: object[], change: number }}
   */
  trendAnalysis(metric, timeRange = {}) {
    this._ensureProvisioned();
    return this._analytics.trendAnalysis(metric, timeRange);
  }

  /**
   * Ingest classroom metrics for analytics.
   *
   * @param {object} data - Classroom metrics data
   * @returns {{ ingested: boolean, classroomId: string }}
   */
  ingestClassroomMetrics(data) {
    this._ensureProvisioned();
    return this._analytics.ingestClassroomMetrics(data);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENT SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a referral.
   *
   * @param {object} referral - Referral object
   * @returns {{ created: boolean, referralId: string }}
   */
  createReferral(referral) {
    this._ensureProvisioned();
    this._touchAction();
    return this._studentServices.createReferral(referral);
  }

  /**
   * Get referrals with optional filters.
   *
   * @param {object} [filters] - Optional filters
   * @returns {object[]} Array of referrals
   */
  getReferrals(filters = {}) {
    this._ensureProvisioned();
    return this._studentServices.listReferrals(filters);
  }

  /**
   * Track an intervention.
   *
   * @param {object} intervention - Intervention object
   * @returns {{ tracked: boolean, interventionId: string }}
   */
  trackIntervention(intervention) {
    this._ensureProvisioned();
    this._touchAction();
    return this._studentServices.trackIntervention(intervention);
  }

  /**
   * Flag a wellness check.
   *
   * @param {string} studentId - Student identifier
   * @param {object} concern   - Concern details
   * @returns {{ flagged: boolean, flagId: string }}
   */
  flagWellnessCheck(studentId, concern) {
    this._ensureProvisioned();
    this._touchAction();
    return this._studentServices.flagWellnessCheck(studentId, concern);
  }

  /**
   * Create a student plan (IEP, 504, etc.).
   *
   * @param {object} plan - Plan object
   * @returns {{ created: boolean, planId: string }}
   */
  createStudentPlan(plan) {
    this._ensureProvisioned();
    this._touchAction();
    return this._studentServices.createPlan(plan);
  }

  /**
   * Record a behavioral incident.
   *
   * @param {object} incident - Incident object
   * @returns {{ recorded: boolean, incidentId: string }}
   */
  recordIncident(incident) {
    this._ensureProvisioned();
    this._touchAction();
    return this._studentServices.recordIncident(incident);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a state report.
   *
   * @param {string} reportType - Report type
   * @param {object} [options]  - Report options
   * @returns {{ generated: boolean, reportId: string, report: object }}
   */
  generateStateReport(reportType, options = {}) {
    this._ensureProvisioned();
    this._touchAction();
    return this._compliance.generateStateReport(reportType, options);
  }

  /**
   * Verify FERPA compliance.
   *
   * @returns {{ compliant: boolean, checks: object[], issues: string[] }}
   */
  verifyFerpaCompliance() {
    this._ensureProvisioned();
    return this._compliance.verifyFerpaCompliance();
  }

  /**
   * Track graduation progress for a student.
   *
   * @param {string} studentId - Student identifier
   * @param {object} [progress] - Progress data
   * @returns {{ tracked: boolean, studentId: string, onTrack: boolean }}
   */
  trackGraduationProgress(studentId, progress = {}) {
    this._ensureProvisioned();
    this._touchAction();
    return this._compliance.trackGraduationProgress(studentId, progress);
  }

  /**
   * Get the audit trail.
   *
   * @param {object} [filters] - Optional filters
   * @returns {{ auditTrail: object[], chronoActive: boolean }}
   */
  getAuditTrail(filters = {}) {
    this._ensureProvisioned();
    return this._compliance.getAuditTrail(filters);
  }

  /**
   * Log data access for FERPA.
   *
   * @param {object} access - Access details
   * @returns {{ logged: boolean, accessId: string }}
   */
  logDataAccess(access) {
    this._ensureProvisioned();
    return this._compliance.logDataAccess(access);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FACILITY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a room/facility.
   *
   * @param {object} room
   * @param {string} room.roomId   - Room identifier
   * @param {string} room.name     - Room name
   * @param {string} [room.type]   - Room type (classroom, lab, gym, etc.)
   * @param {number} [room.capacity] - Room capacity
   * @returns {{ added: boolean, roomId: string }}
   */
  addRoom(room) {
    this._ensureProvisioned();

    const { roomId, name, type = 'classroom', capacity = 30 } = room;

    if (!roomId) throw new Error('Room requires a roomId');
    if (!name) throw new Error('Room requires a name');

    this._rooms.set(roomId, {
      roomId,
      name,
      type,
      capacity,
      schoolId: this.schoolId,
      createdAt: new Date().toISOString(),
    });

    this._roomSchedules.set(roomId, []);

    this._touchAction();
    this._log('ROOM_ADDED', { roomId, name, type });

    return { added: true, roomId };
  }

  /**
   * Schedule a room.
   *
   * @param {string} roomId - Room identifier
   * @param {object} event  - Event to schedule
   * @param {string} event.title     - Event title
   * @param {string} event.date      - Event date
   * @param {string} event.startTime - Start time
   * @param {string} event.endTime   - End time
   * @param {string} [event.organizer] - Event organizer
   * @returns {{ scheduled: boolean, roomId: string, scheduleId: string }}
   */
  scheduleRoom(roomId, event) {
    this._ensureProvisioned();

    const room = this._rooms.get(roomId);
    if (!room) {
      return { scheduled: false, roomId, error: 'Room not found' };
    }

    const scheduleId = `SCHED-${roomId}-${Date.now()}`;
    const schedule = this._roomSchedules.get(roomId) || [];

    schedule.push({
      scheduleId,
      ...event,
      roomId,
      scheduledAt: new Date().toISOString(),
    });

    this._roomSchedules.set(roomId, schedule);

    this._touchAction();
    this._log('ROOM_SCHEDULED', { roomId, scheduleId, title: event.title });

    return { scheduled: true, roomId, scheduleId };
  }

  /**
   * Get room schedule.
   *
   * @param {string} roomId   - Room identifier
   * @param {string} [date]   - Filter by date
   * @returns {object[]} Array of scheduled events
   */
  getRoomSchedule(roomId, date = null) {
    this._ensureProvisioned();

    let schedule = this._roomSchedules.get(roomId) || [];

    if (date) {
      schedule = schedule.filter(s => s.date === date);
    }

    return schedule;
  }

  /**
   * Submit a maintenance request.
   *
   * @param {object} request
   * @param {string} request.location    - Location (room, area)
   * @param {string} request.issue       - Issue description
   * @param {string} [request.priority]  - Priority: low, medium, high, critical
   * @param {string} [request.reportedBy] - Reporter
   * @returns {{ submitted: boolean, requestId: string }}
   */
  submitMaintenanceRequest(request) {
    this._ensureProvisioned();

    const { location, issue, priority = 'medium', reportedBy = null } = request;

    if (!location) throw new Error('Maintenance request requires a location');
    if (!issue) throw new Error('Maintenance request requires an issue');

    const requestId = `MAINT-${this.schoolId}-${Date.now()}`;

    this._maintenanceRequests.push({
      requestId,
      location,
      issue,
      priority,
      reportedBy,
      schoolId: this.schoolId,
      submittedAt: new Date().toISOString(),
      status: 'open',
      resolvedAt: null,
    });

    this._touchAction();
    this._log('MAINTENANCE_REQUEST_SUBMITTED', { requestId, location, priority });

    return { submitted: true, requestId };
  }

  /**
   * Get maintenance requests.
   *
   * @param {object} [filters]
   * @param {string} [filters.status]   - Filter by status
   * @param {string} [filters.priority] - Filter by priority
   * @returns {object[]} Array of maintenance requests
   */
  getMaintenanceStatus(filters = {}) {
    this._ensureProvisioned();

    let requests = [...this._maintenanceRequests];

    if (filters.status) {
      requests = requests.filter(r => r.status === filters.status);
    }
    if (filters.priority) {
      requests = requests.filter(r => r.priority === filters.priority);
    }

    return requests;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNICATION HUB
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Send a broadcast message.
   *
   * @param {string} message   - Message content
   * @param {string} audience  - Audience: 'all', 'teachers', 'staff', 'parents'
   * @param {object} [options]
   * @param {string} [options.subject] - Message subject
   * @param {string} [options.senderId] - Sender identifier
   * @returns {{ sent: boolean, messageId: string }}
   */
  sendBroadcast(message, audience, options = {}) {
    this._ensureProvisioned();

    const messageId = `MSG-${this.schoolId}-${Date.now()}`;

    const messageObj = {
      messageId,
      content: message,
      audience,
      subject: options.subject || null,
      senderId: options.senderId || this.principalId,
      schoolId: this.schoolId,
      sentAt: new Date().toISOString(),
      type: 'broadcast',
    };

    this._messages.push(messageObj);

    this._touchAction();
    this._log('BROADCAST_SENT', { messageId, audience });

    return { sent: true, messageId };
  }

  /**
   * Get messages for a recipient.
   *
   * @param {string} recipientId - Recipient identifier
   * @param {object} [filters]
   * @param {string} [filters.type] - Filter by type
   * @returns {object[]} Array of messages
   */
  getMessages(recipientId, filters = {}) {
    this._ensureProvisioned();

    // For broadcasts, return all that match the recipient's role
    // This is simplified - in production, would need role lookup
    let messages = [...this._messages];

    if (filters.type) {
      messages = messages.filter(m => m.type === filters.type);
    }

    return messages;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧠 AI INTELLIGENCE SYSTEM — REAL USES OF MERIDIAN ENGINES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * AI School Health Analysis
   * 
   * Uses CEREBEX for pattern recognition, COGNOVEX for multi-stakeholder assessment,
   * NEXORIS for routing recommendations to appropriate departments.
   *
   * @returns {object} Comprehensive AI analysis of school health
   */
  analyzeSchool() {
    this._ensureProvisioned();

    // Gather data from all systems
    const classroomData = this._gatherClassroomMetrics();
    const studentData = this._gatherStudentMetrics();
    const resourceData = this._resources.stats();
    const complianceData = this._compliance.stats();

    // CEREBEX: Pattern recognition across the school
    const patterns = this._cerebex.categorize(JSON.stringify({
      classrooms: classroomData,
      students: studentData,
      resources: resourceData,
    }), 'school_health');

    // COGNOVEX: Multi-stakeholder assessment
    const evidence = {
      avgAttendance: studentData.avgAttendance,
      avgPerformance: studentData.avgPerformance,
      atRiskCount: studentData.atRiskCount,
      totalStudents: this._studentCanisters.size,
      totalClassrooms: this._classrooms.size,
      resourceUtilization: resourceData.utilization || 0,
      complianceIssues: complianceData.openIssues || 0,
    };

    const riskAssessment = this._cognovex.propose(
      'What is the overall health of this school?',
      evidence
    );

    // Generate recommendations using NEXORIS routing
    const recommendations = this._generateSchoolRecommendations(evidence, patterns);

    // Log analysis
    this._log('AI_SCHOOL_ANALYSIS', { 
      riskLevel: riskAssessment.risk || 'normal',
      recommendationCount: recommendations.length,
    });

    return {
      timestamp: new Date().toISOString(),
      schoolId: this.schoolId,
      schoolName: this.schoolName,

      // Health Metrics
      healthScore: this._calculateHealthScore(evidence),
      riskLevel: riskAssessment.risk || 'normal',

      // Population
      totalStudents: this._studentCanisters.size,
      totalClassrooms: this._classrooms.size,
      totalTeachers: new Set([...this._classrooms.values()].map(c => c.teacherId)).size,

      // Performance (anonymized aggregates)
      metrics: {
        avgAttendance: studentData.avgAttendance,
        avgPerformance: studentData.avgPerformance,
        avgEngagement: studentData.avgEngagement,
      },

      // AI Insights
      patterns: patterns.detectedPatterns || [],
      alerts: this._generateSchoolAlerts(evidence),
      recommendations,

      // COGNOVEX decision
      cognovexAssessment: riskAssessment,
    };
  }

  /**
   * AI: Identify at-risk students across the school.
   * Uses CEREBEX pattern detection and COGNOVEX quorum for risk assessment.
   *
   * @returns {object} At-risk student analysis (anonymized counts, not individual data)
   */
  identifyAtRiskStudents() {
    this._ensureProvisioned();

    const riskCategories = {
      academic: [],      // Failing grades, low performance
      attendance: [],    // Chronic absenteeism
      behavioral: [],    // Multiple incidents
      wellness: [],      // Flagged by wellness checks
      graduation: [],    // Behind on credits
    };

    let totalAtRisk = 0;

    // Analyze each student canister
    for (const [studentId, canister] of this._studentCanisters) {
      // Get anonymized metrics from student
      const metrics = canister.getAnonymizedMetrics?.() || {};
      const enrollment = this._enrollments.get(studentId);

      // CEREBEX: Categorize student risk
      const riskAnalysis = this._cerebex.categorize(JSON.stringify({
        gpa: metrics.gpa,
        attendanceRate: metrics.attendanceRate,
        overdueCount: metrics.overdueCount,
        streak: metrics.streak,
        wellnessAvg: metrics.wellnessAvg,
        grade: enrollment?.grade,
      }), 'student_risk');

      // COGNOVEX: Quorum decision on risk level
      const decision = this._cognovex.propose('Is this student at risk?', {
        gpa: metrics.gpa,
        overdueCount: metrics.overdueCount || 0,
        attendanceRate: metrics.attendanceRate,
        wellnessScore: metrics.wellnessAvg,
      });

      if (decision.atRisk || decision.escalate) {
        totalAtRisk++;

        // Categorize the risk type (no student names, just counts)
        if (metrics.gpa !== null && metrics.gpa < 2.0) {
          riskCategories.academic.push(studentId);
        }
        if (metrics.attendanceRate && metrics.attendanceRate < 85) {
          riskCategories.attendance.push(studentId);
        }
        if (metrics.overdueCount && metrics.overdueCount > 5) {
          riskCategories.behavioral.push(studentId);
        }
        if (metrics.wellnessAvg && metrics.wellnessAvg < 2.5) {
          riskCategories.wellness.push(studentId);
        }
      }
    }

    // NEXORIS: Route interventions
    if (totalAtRisk > this._studentCanisters.size * 0.15) {
      this._nexoris.emit('SCHOOL_WIDE_INTERVENTION', {
        atRiskPercent: (totalAtRisk / this._studentCanisters.size) * 100,
        schoolId: this.schoolId,
      });
    }

    this._log('AI_RISK_ANALYSIS', { totalAtRisk, categories: Object.keys(riskCategories).map(k => ({ category: k, count: riskCategories[k].length })) });

    return {
      timestamp: new Date().toISOString(),
      totalStudents: this._studentCanisters.size,
      totalAtRisk,
      atRiskPercent: this._studentCanisters.size > 0 
        ? Math.round((totalAtRisk / this._studentCanisters.size) * 1000) / 10
        : 0,

      // Anonymized category counts (not individual students)
      byCategory: {
        academic: riskCategories.academic.length,
        attendance: riskCategories.attendance.length,
        behavioral: riskCategories.behavioral.length,
        wellness: riskCategories.wellness.length,
        graduation: riskCategories.graduation.length,
      },

      // Recommendations
      recommendations: this._generateRiskRecommendations(riskCategories, totalAtRisk),
    };
  }

  /**
   * AI: Predict school outcomes (graduation rates, test scores, trends).
   * Uses CEREBEX for trend analysis and pattern prediction.
   *
   * @param {object} [options]
   * @param {string} [options.metric='graduation'] - What to predict
   * @param {string} [options.timeframe='year'] - Prediction timeframe
   * @returns {object} Predictions with confidence levels
   */
  predictOutcomes({ metric = 'graduation', timeframe = 'year' } = {}) {
    this._ensureProvisioned();

    const currentData = this._gatherStudentMetrics();
    const historicalData = this._analytics.getHistory?.() || [];

    // CEREBEX: Analyze trends
    const trendAnalysis = this._cerebex.categorize(JSON.stringify({
      current: currentData,
      historical: historicalData.slice(-12), // Last 12 data points
    }), 'trend_prediction');

    // Generate predictions based on metric type
    const predictions = {
      timestamp: new Date().toISOString(),
      metric,
      timeframe,
      currentValue: null,
      predictedValue: null,
      confidence: 0,
      trend: 'stable',
      factors: [],
    };

    switch (metric) {
      case 'graduation':
        predictions.currentValue = currentData.onTrackGraduation || 0;
        predictions.predictedValue = this._predictGraduation(currentData);
        predictions.confidence = this._calculatePredictionConfidence(historicalData, 'graduation');
        break;
      
      case 'test_scores':
        predictions.currentValue = currentData.avgPerformance;
        predictions.predictedValue = this._predictTestScores(currentData, trendAnalysis);
        predictions.confidence = this._calculatePredictionConfidence(historicalData, 'performance');
        break;

      case 'attendance':
        predictions.currentValue = currentData.avgAttendance;
        predictions.predictedValue = this._predictAttendance(currentData, trendAnalysis);
        predictions.confidence = this._calculatePredictionConfidence(historicalData, 'attendance');
        break;

      default:
        predictions.currentValue = currentData[metric] || 0;
        predictions.predictedValue = currentData[metric] || 0;
        predictions.confidence = 50;
    }

    // Determine trend direction
    if (predictions.predictedValue > predictions.currentValue * 1.05) {
      predictions.trend = 'improving';
    } else if (predictions.predictedValue < predictions.currentValue * 0.95) {
      predictions.trend = 'declining';
    }

    // Add contributing factors
    predictions.factors = this._identifyContributingFactors(currentData, metric);

    this._log('AI_PREDICTION', { metric, timeframe, trend: predictions.trend });

    return predictions;
  }

  /**
   * AI: Recommend school-wide interventions.
   * Uses COGNOVEX quorum for multi-stakeholder decision making.
   *
   * @returns {object} Intervention recommendations with priority and impact estimates
   */
  recommendInterventions() {
    this._ensureProvisioned();

    const schoolAnalysis = this.analyzeSchool();
    const riskAnalysis = this.identifyAtRiskStudents();
    const resourceAnalysis = this._resources.stats();

    // COGNOVEX: Multi-stakeholder quorum on interventions
    const evidence = {
      healthScore: schoolAnalysis.healthScore,
      atRiskPercent: riskAnalysis.atRiskPercent,
      academicRiskCount: riskAnalysis.byCategory.academic,
      attendanceRiskCount: riskAnalysis.byCategory.attendance,
      wellnessRiskCount: riskAnalysis.byCategory.wellness,
      budgetAvailable: resourceAnalysis.budgetRemaining || 0,
    };

    const interventions = [];

    // Academic intervention
    if (riskAnalysis.byCategory.academic > this._studentCanisters.size * 0.1) {
      const decision = this._cognovex.propose('Should we implement tutoring program?', evidence);
      interventions.push({
        type: 'TUTORING_PROGRAM',
        priority: decision.priority || 'high',
        targetGroup: 'academically at-risk students',
        estimatedStudents: riskAnalysis.byCategory.academic,
        estimatedCost: riskAnalysis.byCategory.academic * 200, // $200/student estimate
        estimatedImpact: 'GPA improvement of 0.3-0.5 points',
        cognovexApproval: decision.approved !== false,
      });
    }

    // Attendance intervention
    if (riskAnalysis.byCategory.attendance > this._studentCanisters.size * 0.08) {
      const decision = this._cognovex.propose('Should we implement attendance incentive program?', evidence);
      interventions.push({
        type: 'ATTENDANCE_INCENTIVE',
        priority: decision.priority || 'high',
        targetGroup: 'chronically absent students',
        estimatedStudents: riskAnalysis.byCategory.attendance,
        estimatedCost: riskAnalysis.byCategory.attendance * 50,
        estimatedImpact: '10-15% attendance improvement',
        cognovexApproval: decision.approved !== false,
      });
    }

    // Wellness intervention
    if (riskAnalysis.byCategory.wellness > this._studentCanisters.size * 0.05) {
      const decision = this._cognovex.propose('Should we expand counseling services?', evidence);
      interventions.push({
        type: 'COUNSELING_EXPANSION',
        priority: decision.priority || 'medium',
        targetGroup: 'students with wellness concerns',
        estimatedStudents: riskAnalysis.byCategory.wellness,
        estimatedCost: 5000, // Counselor hours
        estimatedImpact: 'Improved student wellbeing and retention',
        cognovexApproval: decision.approved !== false,
      });
    }

    // Teacher support intervention
    const teacherLoad = this._analyzeTeacherLoad();
    if (teacherLoad.overloadedTeachers > 0) {
      const decision = this._cognovex.propose('Should we hire additional support staff?', evidence);
      interventions.push({
        type: 'TEACHER_SUPPORT',
        priority: decision.priority || 'medium',
        targetGroup: 'overloaded teachers',
        estimatedTeachers: teacherLoad.overloadedTeachers,
        estimatedCost: teacherLoad.overloadedTeachers * 3000,
        estimatedImpact: 'Reduced teacher burnout, improved instruction quality',
        cognovexApproval: decision.approved !== false,
      });
    }

    // NEXORIS: Route approved interventions
    for (const intervention of interventions.filter(i => i.cognovexApproval)) {
      this._nexoris.emit('INTERVENTION_APPROVED', {
        type: intervention.type,
        schoolId: this.schoolId,
        priority: intervention.priority,
      });
    }

    this._log('AI_INTERVENTIONS', { count: interventions.length, approved: interventions.filter(i => i.cognovexApproval).length });

    return {
      timestamp: new Date().toISOString(),
      interventions,
      totalEstimatedCost: interventions.reduce((sum, i) => sum + (i.estimatedCost || 0), 0),
      approvedCount: interventions.filter(i => i.cognovexApproval).length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔗 STUDENTAI ↔ SILVERCANISTER CONNECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get schedule for a student (to push to StudentAI).
   * StudentAI calls this to sync with school schedule.
   *
   * @param {string} studentId - Student identifier
   * @returns {object} Student's schedule from school perspective
   */
  getStudentSchedule(studentId) {
    this._ensureProvisioned();

    const enrollment = this._enrollments.get(studentId);
    if (!enrollment) {
      return { error: 'Student not enrolled', studentId };
    }

    const classes = [];
    for (const classroomId of enrollment.classroomIds) {
      const classroom = this._classrooms.get(classroomId);
      if (classroom) {
        classes.push({
          classId: classroom.classroomId,
          className: `${classroom.subject} - Period ${classroom.period || 'N/A'}`,
          teacherName: classroom.teacherName,
          teacherId: classroom.teacherId,
          room: classroom.room,
          period: classroom.period,
          subject: classroom.subject,
          days: ['M', 'T', 'W', 'TH', 'F'], // Default weekdays
        });
      }
    }

    const bellSchedule = this._calendar?.getBellSchedule?.() || [];
    const gradingPeriods = this._calendar?.getGradingPeriods?.() || [];

    return {
      studentId,
      schoolId: this.schoolId,
      schoolName: this.schoolName,
      schoolYear: this.schoolYear,
      grade: enrollment.grade,
      classes,
      bellSchedule,
      gradingPeriods,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Get announcements for students (to push to StudentAI).
   * StudentAI calls this to sync school news.
   *
   * @param {object} [options]
   * @param {boolean} [options.unreadOnly=false] - Only unread announcements
   * @param {number} [options.limit=10] - Max announcements
   * @returns {object[]} Announcements for students
   */
  getAnnouncementsForStudents(options = {}) {
    this._ensureProvisioned();

    const { unreadOnly = false, limit = 10 } = options;

    let announcements = this._announcements.list({ audience: 'students' });

    if (unreadOnly) {
      announcements = announcements.filter(a => !a.read);
    }

    return announcements.slice(0, limit).map(a => ({
      id: a.announcementId,
      title: a.title,
      content: a.content,
      category: a.category,
      date: a.createdAt,
      important: a.priority === 'high',
    }));
  }

  /**
   * Receive metrics from a StudentAI instance.
   * Called when StudentAI pushes anonymized metrics up to the school.
   *
   * @param {object} metrics - Anonymized student metrics
   * @returns {{ received: boolean }}
   */
  receiveStudentMetrics(metrics) {
    this._ensureProvisioned();

    if (!metrics.studentId) {
      return { received: false, error: 'Missing studentId' };
    }

    // Feed into school analytics (anonymized)
    this._analytics.ingestStudentMetrics?.({
      studentId: metrics.studentId,
      grade: metrics.grade,
      date: new Date().toISOString(),
      metrics: {
        studyHours: metrics.studyHoursWeek,
        gpa: metrics.gpa,
        overdueCount: metrics.overdueCount,
        streak: metrics.streak,
        wellnessAvg: metrics.wellnessAvg,
      },
    });

    this._log('STUDENT_METRICS_RECEIVED', { studentId: metrics.studentId });

    return { received: true };
  }

  /**
   * Route a student request to school services.
   * Uses NEXORIS to route tutoring, wellness, counseling requests.
   *
   * @param {object} request - Student request
   * @param {string} request.studentId - Student identifier
   * @param {string} request.type - Request type (TUTORING, WELLNESS, COUNSELING, etc.)
   * @param {object} request.data - Request details
   * @returns {{ routed: boolean, destination: string }}
   */
  routeStudentRequest(request) {
    this._ensureProvisioned();

    const { studentId, type, data } = request;

    // NEXORIS: Route to appropriate service
    const signal = this._nexoris.emit(type, { studentId, ...data });

    let destination = 'general_services';
    let action = null;

    switch (type) {
      case 'TUTORING_REQUEST':
      case 'TUTORING_NEEDED':
        destination = 'tutoring_services';
        action = () => this._studentServices.createReferral?.({
          studentId,
          type: 'tutoring',
          reason: data.reason || 'Student requested tutoring',
          subject: data.subject,
          urgency: data.urgency || 'normal',
        });
        break;

      case 'WELLNESS_CONCERN':
      case 'WELLNESS_CHECK':
        destination = 'counseling_services';
        action = () => this._studentServices.flagWellnessCheck?.({
          studentId,
          type: data.type || 'general',
          description: data.reason || 'Wellness concern flagged',
          urgency: data.urgency || 'normal',
        });
        break;

      case 'PARENT_ALERT':
      case 'LOW_GRADE_ALERT':
        destination = 'parent_communication';
        action = () => this._announcements.postParentAlert?.({
          studentId,
          type: data.type || 'academic',
          message: data.message || 'Academic concern',
        });
        break;

      case 'LATE_SUBMISSION':
        destination = 'academic_records';
        // Just log, no escalation needed
        break;

      default:
        destination = 'general_services';
    }

    // Execute the routed action
    if (action) {
      try {
        action();
      } catch (e) {
        // Log but don't fail
        this._log('ROUTE_ACTION_ERROR', { type, error: e.message });
      }
    }

    this._log('STUDENT_REQUEST_ROUTED', { studentId, type, destination });

    return { routed: true, destination, type };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏫 AI-POWERED SCHOOL OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * AI: Staffing recommendations based on class sizes, teacher load, performance.
   * Uses CEREBEX for pattern analysis.
   *
   * @returns {object} Staffing recommendations
   */
  aiStaffingRecommendations() {
    this._ensureProvisioned();

    const teacherLoad = this._analyzeTeacherLoad();
    const classroomData = this._gatherClassroomMetrics();

    // CEREBEX: Analyze staffing patterns
    const analysis = this._cerebex.categorize(JSON.stringify({
      teachers: teacherLoad,
      classrooms: classroomData,
    }), 'staffing_analysis');

    const recommendations = [];

    // Check for overloaded teachers
    if (teacherLoad.overloadedTeachers > 0) {
      recommendations.push({
        type: 'HIRE_SUPPORT',
        priority: 'high',
        reason: `${teacherLoad.overloadedTeachers} teacher(s) have class sizes over 30 students`,
        action: 'Consider hiring teaching assistants or reducing class loads',
        estimatedCost: teacherLoad.overloadedTeachers * 25000, // TA salary estimate
      });
    }

    // Check for underutilized teachers
    if (teacherLoad.underutilizedTeachers > 0) {
      recommendations.push({
        type: 'REBALANCE',
        priority: 'medium',
        reason: `${teacherLoad.underutilizedTeachers} teacher(s) have classes under 15 students`,
        action: 'Consider consolidating small classes or assigning additional duties',
        estimatedSavings: teacherLoad.underutilizedTeachers * 10000,
      });
    }

    // Subject coverage gaps
    const subjectCoverage = this._analyzeSubjectCoverage();
    for (const gap of subjectCoverage.gaps) {
      recommendations.push({
        type: 'HIRE_SPECIALIST',
        priority: 'medium',
        reason: `No teacher for ${gap.subject} in grade ${gap.grade}`,
        action: `Hire a ${gap.subject} teacher or cross-train existing staff`,
        estimatedCost: 55000, // Average teacher salary
      });
    }

    this._log('AI_STAFFING_ANALYSIS', { recommendationCount: recommendations.length });

    return {
      timestamp: new Date().toISOString(),
      teacherCount: teacherLoad.totalTeachers,
      avgStudentsPerTeacher: teacherLoad.avgStudentsPerTeacher,
      recommendations,
      teacherLoad,
    };
  }

  /**
   * AI: Resource allocation optimization.
   * Uses CEREBEX to optimize device and textbook distribution.
   *
   * @returns {object} Resource allocation recommendations
   */
  aiResourceAllocation() {
    this._ensureProvisioned();

    const inventory = this._resources.getInventory?.() || [];
    const allocations = this._resources.getAllocations?.() || [];
    const classrooms = this.listClassrooms();

    // Calculate needs vs. current allocation
    const recommendations = [];
    const needsByClassroom = new Map();

    for (const classroom of classrooms) {
      const studentCount = classroom.studentCount || 0;
      const currentDevices = allocations.filter(a => 
        a.classroomId === classroom.classroomId && a.type === 'device'
      ).reduce((sum, a) => sum + (a.quantity || 0), 0);

      const deviceGap = studentCount - currentDevices;
      if (deviceGap > 0) {
        needsByClassroom.set(classroom.classroomId, {
          classroom: classroom.classroomId,
          teacher: classroom.teacherName,
          subject: classroom.subject,
          needed: deviceGap,
          type: 'device',
        });
      }
    }

    // CEREBEX: Optimize allocation
    const analysis = this._cerebex.categorize(JSON.stringify({
      inventory,
      needs: [...needsByClassroom.values()],
    }), 'resource_optimization');

    // Generate recommendations
    const totalNeeded = [...needsByClassroom.values()].reduce((sum, n) => sum + n.needed, 0);
    const availableDevices = inventory.filter(i => i.type === 'device').reduce((sum, i) => sum + (i.available || 0), 0);

    if (totalNeeded > availableDevices) {
      recommendations.push({
        type: 'PURCHASE_DEVICES',
        priority: 'high',
        reason: `Need ${totalNeeded} devices but only ${availableDevices} available`,
        action: `Purchase ${totalNeeded - availableDevices} additional devices`,
        estimatedCost: (totalNeeded - availableDevices) * 300,
      });
    }

    // Reallocation suggestions
    const overallocated = classrooms.filter(c => {
      const allocated = allocations.filter(a => a.classroomId === c.classroomId && a.type === 'device')
        .reduce((sum, a) => sum + (a.quantity || 0), 0);
      return allocated > (c.studentCount || 0) * 1.2; // 20% buffer
    });

    if (overallocated.length > 0) {
      recommendations.push({
        type: 'REALLOCATE',
        priority: 'medium',
        reason: `${overallocated.length} classroom(s) have excess devices`,
        action: 'Redistribute devices to classrooms with shortages',
        classrooms: overallocated.map(c => c.classroomId),
      });
    }

    this._log('AI_RESOURCE_ALLOCATION', { recommendationCount: recommendations.length });

    return {
      timestamp: new Date().toISOString(),
      totalStudents: this._studentCanisters.size,
      totalDevices: inventory.filter(i => i.type === 'device').reduce((sum, i) => sum + (i.total || 0), 0),
      deviceGap: totalNeeded - availableDevices,
      recommendations,
      allocationsByClassroom: [...needsByClassroom.values()],
    };
  }

  /**
   * AI: Schedule optimization.
   * Analyzes room utilization and suggests bell schedule improvements.
   *
   * @returns {object} Schedule optimization recommendations
   */
  aiScheduleOptimization() {
    this._ensureProvisioned();

    const rooms = [...this._rooms.values()];
    const schedules = [...this._roomSchedules.entries()];
    const classrooms = this.listClassrooms();

    // Calculate room utilization
    const roomUtilization = new Map();
    for (const room of rooms) {
      const schedule = this._roomSchedules.get(room.roomId) || [];
      const utilizationPercent = schedule.length / 8 * 100; // Assume 8 periods
      roomUtilization.set(room.roomId, {
        roomId: room.roomId,
        name: room.name,
        capacity: room.capacity,
        utilizationPercent,
        scheduleCount: schedule.length,
      });
    }

    const recommendations = [];

    // Underutilized rooms
    const underutilized = [...roomUtilization.values()].filter(r => r.utilizationPercent < 50);
    if (underutilized.length > 0) {
      recommendations.push({
        type: 'ROOM_CONSOLIDATION',
        priority: 'low',
        reason: `${underutilized.length} room(s) are less than 50% utilized`,
        action: 'Consider consolidating classes or repurposing rooms',
        rooms: underutilized.map(r => r.roomId),
      });
    }

    // Overcrowded rooms
    const overcrowded = [...roomUtilization.values()].filter(r => r.utilizationPercent > 95);
    if (overcrowded.length > 0) {
      recommendations.push({
        type: 'ROOM_EXPANSION',
        priority: 'medium',
        reason: `${overcrowded.length} room(s) are at full capacity`,
        action: 'Consider adding rooms or staggering schedules',
        rooms: overcrowded.map(r => r.roomId),
      });
    }

    // Period imbalances
    const periodCounts = new Map();
    for (const classroom of classrooms) {
      const period = classroom.period || 'unassigned';
      periodCounts.set(period, (periodCounts.get(period) || 0) + 1);
    }

    const periods = [...periodCounts.entries()];
    const avgPerPeriod = classrooms.length / periods.length;
    const imbalancedPeriods = periods.filter(([_, count]) => 
      count > avgPerPeriod * 1.3 || count < avgPerPeriod * 0.7
    );

    if (imbalancedPeriods.length > 0) {
      recommendations.push({
        type: 'PERIOD_REBALANCE',
        priority: 'low',
        reason: 'Class distribution across periods is uneven',
        action: 'Rebalance class times to even out facility usage',
        details: imbalancedPeriods.map(([period, count]) => ({ period, count })),
      });
    }

    this._log('AI_SCHEDULE_OPTIMIZATION', { recommendationCount: recommendations.length });

    return {
      timestamp: new Date().toISOString(),
      totalRooms: rooms.length,
      avgUtilization: rooms.length > 0 
        ? Math.round([...roomUtilization.values()].reduce((sum, r) => sum + r.utilizationPercent, 0) / rooms.length)
        : 0,
      recommendations,
      roomUtilization: [...roomUtilization.values()],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏛️ DISTRICT CONNECTION (BISD)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Push school metrics up to district.
   * For district-level reporting and benchmarking.
   *
   * @returns {object} Metrics package for district
   */
  getDistrictMetrics() {
    this._ensureProvisioned();

    const studentMetrics = this._gatherStudentMetrics();
    const classroomMetrics = this._gatherClassroomMetrics();

    return {
      schoolId: this.schoolId,
      schoolName: this.schoolName,
      districtId: this.districtId,
      schoolYear: this.schoolYear,
      reportDate: new Date().toISOString(),

      enrollment: {
        totalStudents: this._studentCanisters.size,
        totalClassrooms: this._classrooms.size,
        totalTeachers: new Set([...this._classrooms.values()].map(c => c.teacherId)).size,
        byGrade: this._getEnrollmentByGrade(),
      },

      performance: {
        avgAttendance: studentMetrics.avgAttendance,
        avgPerformance: studentMetrics.avgPerformance,
        avgEngagement: studentMetrics.avgEngagement,
        graduationRate: studentMetrics.onTrackGraduation,
      },

      atRisk: {
        totalAtRisk: studentMetrics.atRiskCount,
        atRiskPercent: this._studentCanisters.size > 0 
          ? (studentMetrics.atRiskCount / this._studentCanisters.size) * 100 
          : 0,
      },

      compliance: this._compliance.stats(),
    };
  }

  /**
   * Receive directives from district.
   * For curriculum mandates, policy updates, etc.
   *
   * @param {object} directive - District directive
   * @returns {{ received: boolean, applied: boolean }}
   */
  receiveDistrictDirective(directive) {
    this._ensureProvisioned();

    const { type, content, effectiveDate, mandatory = false } = directive;

    let applied = false;

    switch (type) {
      case 'CURRICULUM_UPDATE':
        if (content.curriculumId && content.updates) {
          this._curriculum.applyDistrictUpdate?.(content);
          applied = true;
        }
        break;

      case 'POLICY_CHANGE':
        // Log for admin review
        this._announcements.post({
          title: `District Policy Update: ${content.title || 'New Policy'}`,
          content: content.description || 'Please review the updated policy.',
          category: 'policy',
          audience: 'staff',
          priority: mandatory ? 'high' : 'normal',
        });
        applied = true;
        break;

      case 'CALENDAR_EVENT':
        if (content.event) {
          this._calendar.addEvent(content.event);
          applied = true;
        }
        break;

      case 'COMPLIANCE_REQUIREMENT':
        this._compliance.addRequirement?.(content);
        applied = true;
        break;

      default:
        // Unknown directive type - log but don't fail
        break;
    }

    this._log('DISTRICT_DIRECTIVE_RECEIVED', { type, mandatory, applied });

    return { received: true, applied };
  }

  /**
   * Benchmark against district averages.
   * Compare school performance to district-wide metrics.
   *
   * @param {object} districtAverages - District-wide averages
   * @returns {object} Benchmarking results
   */
  benchmarkAgainstDistrict(districtAverages) {
    this._ensureProvisioned();

    const schoolMetrics = this._gatherStudentMetrics();

    const comparisons = {
      timestamp: new Date().toISOString(),
      schoolId: this.schoolId,
      metrics: [],
    };

    const compare = (name, schoolValue, districtValue) => {
      const diff = schoolValue - districtValue;
      const percentDiff = districtValue > 0 ? (diff / districtValue) * 100 : 0;
      return {
        metric: name,
        school: schoolValue,
        district: districtValue,
        difference: Math.round(diff * 10) / 10,
        percentDifference: Math.round(percentDiff * 10) / 10,
        status: diff >= 0 ? 'above_average' : 'below_average',
      };
    };

    if (districtAverages.avgAttendance !== undefined) {
      comparisons.metrics.push(compare('attendance', schoolMetrics.avgAttendance, districtAverages.avgAttendance));
    }
    if (districtAverages.avgPerformance !== undefined) {
      comparisons.metrics.push(compare('performance', schoolMetrics.avgPerformance, districtAverages.avgPerformance));
    }
    if (districtAverages.graduationRate !== undefined) {
      comparisons.metrics.push(compare('graduation_rate', schoolMetrics.onTrackGraduation, districtAverages.graduationRate));
    }
    if (districtAverages.atRiskPercent !== undefined) {
      // For at-risk, lower is better
      const comparison = compare('at_risk_percent', 
        (schoolMetrics.atRiskCount / this._studentCanisters.size) * 100, 
        districtAverages.atRiskPercent
      );
      comparison.status = comparison.difference <= 0 ? 'above_average' : 'below_average';
      comparisons.metrics.push(comparison);
    }

    // Generate summary
    const aboveCount = comparisons.metrics.filter(m => m.status === 'above_average').length;
    comparisons.summary = {
      aboveAverage: aboveCount,
      belowAverage: comparisons.metrics.length - aboveCount,
      overallStatus: aboveCount >= comparisons.metrics.length / 2 ? 'performing_well' : 'needs_attention',
    };

    this._log('DISTRICT_BENCHMARK', { overallStatus: comparisons.summary.overallStatus });

    return comparisons;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔧 AI HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _gatherStudentMetrics() {
    let totalGPA = 0;
    let gpaCount = 0;
    let totalAttendance = 0;
    let attendanceCount = 0;
    let totalEngagement = 0;
    let engagementCount = 0;
    let atRiskCount = 0;
    let onTrackGraduation = 0;

    for (const [studentId, canister] of this._studentCanisters) {
      const metrics = canister.getAnonymizedMetrics?.() || {};
      
      if (metrics.gpa !== null && metrics.gpa !== undefined) {
        totalGPA += metrics.gpa;
        gpaCount++;
        if (metrics.gpa >= 2.0) onTrackGraduation++;
      }

      if (metrics.attendanceRate !== undefined) {
        totalAttendance += metrics.attendanceRate;
        attendanceCount++;
      }

      if (metrics.avgProductivity !== undefined) {
        totalEngagement += metrics.avgProductivity;
        engagementCount++;
      }

      if (metrics.overdueCount > 3 || (metrics.gpa !== null && metrics.gpa < 2.0)) {
        atRiskCount++;
      }
    }

    return {
      avgGPA: gpaCount > 0 ? Math.round((totalGPA / gpaCount) * 100) / 100 : null,
      avgAttendance: attendanceCount > 0 ? Math.round((totalAttendance / attendanceCount) * 10) / 10 : null,
      avgPerformance: gpaCount > 0 ? Math.round((totalGPA / gpaCount) * 25) : null, // Convert GPA to 0-100
      avgEngagement: engagementCount > 0 ? Math.round((totalEngagement / engagementCount) * 10) / 10 : null,
      atRiskCount,
      onTrackGraduation: gpaCount > 0 ? Math.round((onTrackGraduation / gpaCount) * 100) : 0,
    };
  }

  /** @private */
  _gatherClassroomMetrics() {
    const metrics = [];
    for (const [classroomId, classroom] of this._classrooms) {
      metrics.push({
        classroomId,
        subject: classroom.subject,
        grade: classroom.grade,
        studentCount: classroom.students.size,
        teacherId: classroom.teacherId,
      });
    }
    return metrics;
  }

  /** @private */
  _analyzeTeacherLoad() {
    const teacherStudents = new Map();
    
    for (const [_, classroom] of this._classrooms) {
      const current = teacherStudents.get(classroom.teacherId) || 0;
      teacherStudents.set(classroom.teacherId, current + classroom.students.size);
    }

    const loads = [...teacherStudents.values()];
    const totalStudents = loads.reduce((sum, l) => sum + l, 0);
    const avgStudentsPerTeacher = loads.length > 0 ? totalStudents / loads.length : 0;

    return {
      totalTeachers: teacherStudents.size,
      avgStudentsPerTeacher: Math.round(avgStudentsPerTeacher),
      overloadedTeachers: loads.filter(l => l > 90).length, // More than 90 students
      underutilizedTeachers: loads.filter(l => l < 15).length, // Less than 15 students
    };
  }

  /** @private */
  _analyzeSubjectCoverage() {
    const grades = new Set([...this._classrooms.values()].map(c => c.grade));
    const subjects = new Set([...this._classrooms.values()].map(c => c.subject));
    const coverage = new Map();
    const gaps = [];

    for (const classroom of this._classrooms.values()) {
      const key = `${classroom.grade}-${classroom.subject}`;
      coverage.set(key, true);
    }

    // Check for gaps (simplified - in production would check against requirements)
    const requiredSubjects = ['Math', 'English', 'Science', 'Social Studies'];
    for (const grade of grades) {
      for (const subject of requiredSubjects) {
        const key = `${grade}-${subject}`;
        if (!coverage.has(key)) {
          gaps.push({ grade, subject });
        }
      }
    }

    return { coverage: coverage.size, gaps };
  }

  /** @private */
  _calculateHealthScore(evidence) {
    let score = 100;

    // Deductions
    if (evidence.avgAttendance && evidence.avgAttendance < 95) score -= (95 - evidence.avgAttendance) * 2;
    if (evidence.avgPerformance && evidence.avgPerformance < 80) score -= (80 - evidence.avgPerformance);
    if (evidence.atRiskCount > evidence.totalStudents * 0.15) score -= 15;
    if (evidence.complianceIssues > 0) score -= evidence.complianceIssues * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /** @private */
  _generateSchoolRecommendations(evidence, patterns) {
    const recommendations = [];

    if (evidence.atRiskCount > evidence.totalStudents * 0.1) {
      recommendations.push({
        type: 'INTERVENTION_PROGRAM',
        priority: 'high',
        reason: `${Math.round((evidence.atRiskCount / evidence.totalStudents) * 100)}% of students at risk`,
      });
    }

    if (evidence.avgAttendance && evidence.avgAttendance < 92) {
      recommendations.push({
        type: 'ATTENDANCE_INITIATIVE',
        priority: 'high',
        reason: `Attendance rate ${evidence.avgAttendance}% is below target (92%)`,
      });
    }

    if (evidence.complianceIssues > 0) {
      recommendations.push({
        type: 'COMPLIANCE_REVIEW',
        priority: 'medium',
        reason: `${evidence.complianceIssues} open compliance issue(s)`,
      });
    }

    return recommendations;
  }

  /** @private */
  _generateSchoolAlerts(evidence) {
    const alerts = [];

    if (evidence.atRiskCount > evidence.totalStudents * 0.2) {
      alerts.push({
        type: 'critical',
        message: 'High percentage of at-risk students',
        metric: `${Math.round((evidence.atRiskCount / evidence.totalStudents) * 100)}%`,
      });
    }

    if (evidence.avgAttendance && evidence.avgAttendance < 90) {
      alerts.push({
        type: 'warning',
        message: 'Attendance below acceptable threshold',
        metric: `${evidence.avgAttendance}%`,
      });
    }

    return alerts;
  }

  /** @private */
  _generateRiskRecommendations(riskCategories, totalAtRisk) {
    const recommendations = [];

    if (riskCategories.academic.length > 0) {
      recommendations.push({
        category: 'academic',
        action: 'Implement targeted tutoring program',
        urgency: riskCategories.academic.length > 10 ? 'high' : 'medium',
      });
    }

    if (riskCategories.attendance.length > 0) {
      recommendations.push({
        category: 'attendance',
        action: 'Launch attendance incentive program',
        urgency: riskCategories.attendance.length > 10 ? 'high' : 'medium',
      });
    }

    if (riskCategories.wellness.length > 0) {
      recommendations.push({
        category: 'wellness',
        action: 'Expand counseling availability',
        urgency: riskCategories.wellness.length > 5 ? 'high' : 'medium',
      });
    }

    return recommendations;
  }

  /** @private */
  _predictGraduation(currentData) {
    // Simple prediction based on current on-track rate
    const base = currentData.onTrackGraduation || 85;
    // Adjust based on at-risk count
    const adjustment = currentData.atRiskCount > 0 ? -2 : 1;
    return Math.min(100, Math.max(0, base + adjustment));
  }

  /** @private */
  _predictTestScores(currentData, trendAnalysis) {
    const base = currentData.avgPerformance || 75;
    // Simple trend adjustment
    return Math.min(100, Math.max(0, Math.round(base * 1.02))); // 2% improvement target
  }

  /** @private */
  _predictAttendance(currentData, trendAnalysis) {
    const base = currentData.avgAttendance || 92;
    // Attendance tends to decline toward end of year
    return Math.max(85, Math.round(base - 1));
  }

  /** @private */
  _calculatePredictionConfidence(historicalData, metric) {
    // More historical data = higher confidence
    const dataPoints = historicalData.length;
    if (dataPoints < 3) return 40;
    if (dataPoints < 6) return 60;
    if (dataPoints < 12) return 75;
    return 85;
  }

  /** @private */
  _identifyContributingFactors(currentData, metric) {
    const factors = [];

    if (metric === 'graduation' || metric === 'test_scores') {
      if (currentData.atRiskCount > 0) {
        factors.push({ factor: 'at_risk_students', impact: 'negative' });
      }
      if (currentData.avgEngagement && currentData.avgEngagement > 3.5) {
        factors.push({ factor: 'high_engagement', impact: 'positive' });
      }
    }

    if (metric === 'attendance') {
      factors.push({ factor: 'seasonal_variation', impact: 'neutral' });
    }

    return factors;
  }

  /** @private */
  _getEnrollmentByGrade() {
    const byGrade = {};
    for (const enrollment of this._enrollments.values()) {
      byGrade[enrollment.grade] = (byGrade[enrollment.grade] || 0) + 1;
    }
    return byGrade;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECT SUBSYSTEM ACCESS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get direct access to subsystems for advanced operations.
   */
  get curriculum() { return this._curriculum; }
  get announcements() { return this._announcements; }
  get calendar() { return this._calendar; }
  get resources() { return this._resources; }
  get analytics() { return this._analytics; }
  get studentServices() { return this._studentServices; }
  get compliance() { return this._compliance; }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _ensureProvisioned() {
    if (!this._provisioned) {
      throw new Error(`SilverCanister ${this.canisterId} is not provisioned — call provision() first`);
    }
  }

  /** @private */
  _touchAction() {
    this._lastAction = new Date().toISOString();
  }

  /** @private */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({
        type,
        schoolId: this.schoolId,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /** @private */
  _listEngines() {
    return ['CHRONO', 'CEREBEX', 'NEXORIS', 'HDI', 'COGNOVEX'];
  }

  /** @private */
  _listSystems() {
    return [
      'CurriculumRepository',
      'AnnouncementBoard',
      'AcademicCalendar',
      'ResourceInventory',
      'SchoolAnalytics',
      'StudentServices',
      'ComplianceEngine',
    ];
  }

  /** @private */
  _defaultSchoolYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Academic year starts in August
    if (month >= 7) { // August or later
      return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
  }
}
