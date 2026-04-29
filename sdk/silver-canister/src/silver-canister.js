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
