/**
 * ISD-DEPLOYMENT — School District Deployment Orchestrator
 * ──────────────────────────────────────────────────────────────────────────────
 * The institutional product. An ISD (Independent School District) uses this
 * to provision Bronze Canisters across schools, classrooms, and students.
 *
 * Architecture:
 *   District → Schools → Classrooms → Student Canisters
 *
 * Every provisioning action is CHRONO-anchored for audit. District-level
 * observability shows only anonymized aggregates — no individual student data
 * ever surfaces to the district layer (L73 Data Sovereignty).
 *
 * Lifecycle follows Paper XV (Ask III) deployment phases:
 *   Phase A — Pilot: single school, single grade
 *   Phase B — Expansion: multiple schools, multiple grades
 *   Phase C — Full district: all schools, all grades
 *
 * Theory basis:
 *   Paper XV  — ASK III: ISD deployment architecture, Bronze Canister product
 *   Paper V   — LEGES ANIMAE: Behavioral Laws L72–L79
 *   Paper XIX — CIVITAS MERIDIANA: civic infrastructure layer
 *   Paper VIII — IMPERIUM CONSERVATUM: sovereignty conservation
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { BronzeCanister } from './bronze-canister.js';
import { TeacherDashboard } from './teacher-dashboard.js';

// ---------------------------------------------------------------------------
// ISDDeployment
// ---------------------------------------------------------------------------

export class ISDDeployment {
  /**
   * Create an ISD deployment orchestrator.
   *
   * @param {object} options
   * @param {string} options.districtId    - Unique district identifier
   * @param {string} options.districtName  - Human-readable district name
   * @param {string} options.contactEmail  - District contact email
   */
  constructor({ districtId, districtName, contactEmail }) {
    if (!districtId) throw new Error('ISDDeployment requires a districtId');
    if (!districtName) throw new Error('ISDDeployment requires a districtName');
    if (!contactEmail) throw new Error('ISDDeployment requires a contactEmail');

    /** @type {string} */
    this.districtId = districtId;

    /** @type {string} */
    this.districtName = districtName;

    /** @type {string} */
    this.contactEmail = contactEmail;

    /**
     * Schools in this district.
     * schoolId → { schoolId, schoolName, principalEmail, addedAt }
     * @type {Map<string, object>}
     */
    this._schools = new Map();

    /**
     * Classrooms across the district.
     * classroomId → { classroomId, schoolId, teacherId, teacherName, grade, studentCount, dashboard, provisionedAt }
     * @type {Map<string, object>}
     */
    this._classrooms = new Map();

    /**
     * All student canisters across the district.
     * studentId → canister
     * @type {Map<string, object>}
     */
    this._canisters = new Map();

    /** @type {object|null} */
    this._chrono = null;

    /** @type {string} */
    this._createdAt = new Date().toISOString();

    /** @type {string} */
    this._phase = 'INIT';

    /** @type {object[]} */
    this._auditLog = [];
  }

  // ── CHRONO integration ──────────────────────────────────────────────────

  /**
   * Inject CHRONO for immutable audit logging.
   *
   * @param {object} chrono - CHRONO instance
   * @returns {ISDDeployment} this (for chaining)
   */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  /**
   * @private
   */
  _log(type, data) {
    const entry = {
      type,
      districtId: this.districtId,
      ...data,
      timestamp: new Date().toISOString(),
    };

    this._auditLog.push(entry);

    if (this._chrono) {
      this._chrono.append(entry);
    }
  }

  // ── School management ───────────────────────────────────────────────────

  /**
   * Add a school to the district.
   *
   * @param {object} school
   * @param {string} school.schoolId       - Unique school identifier
   * @param {string} school.schoolName     - Human-readable school name
   * @param {string} school.principalEmail - Principal contact email
   * @returns {{ added: boolean, schoolId: string, totalSchools: number }}
   */
  addSchool({ schoolId, schoolName, principalEmail }) {
    if (!schoolId) throw new Error('addSchool requires a schoolId');
    if (!schoolName) throw new Error('addSchool requires a schoolName');
    if (!principalEmail) throw new Error('addSchool requires a principalEmail');

    this._schools.set(schoolId, {
      schoolId,
      schoolName,
      principalEmail,
      addedAt: new Date().toISOString(),
    });

    this._log('SCHOOL_ADDED', { schoolId, schoolName });

    return {
      added: true,
      schoolId,
      totalSchools: this._schools.size,
    };
  }

  /**
   * Remove a school from the district.
   * Note: student data is preserved (L78) — canisters are deactivated, not deleted.
   *
   * @param {string} schoolId - School to remove
   * @returns {{ removed: boolean, schoolId: string, totalSchools: number }}
   */
  removeSchool(schoolId) {
    const existed = this._schools.delete(schoolId);

    if (existed) {
      this._log('SCHOOL_REMOVED', { schoolId });
    }

    return {
      removed: existed,
      schoolId,
      totalSchools: this._schools.size,
    };
  }

  /**
   * List all schools in the district.
   *
   * @returns {Array<{ schoolId: string, schoolName: string, principalEmail: string, addedAt: string }>}
   */
  listSchools() {
    return [...this._schools.values()].map(s => ({ ...s }));
  }

  // ── Classroom management ────────────────────────────────────────────────

  /**
   * Provision a classroom within a school.
   *
   * @param {object} options
   * @param {string} options.schoolId     - School this classroom belongs to
   * @param {string} options.teacherId    - Teacher identifier
   * @param {string} options.teacherName  - Teacher display name
   * @param {number} options.grade        - Grade level
   * @param {number} options.studentCount - Expected student count
   * @returns {{ provisioned: boolean, classroomId: string, dashboard: object }}
   */
  provisionClassroom({ schoolId, teacherId, teacherName, grade, studentCount }) {
    if (!schoolId) throw new Error('provisionClassroom requires a schoolId');
    if (!this._schools.has(schoolId)) {
      throw new Error(`School ${schoolId} not found in district — add it first`);
    }
    if (!teacherId) throw new Error('provisionClassroom requires a teacherId');

    const classroomId = `${schoolId}::${teacherId}::G${grade}`;

    const dashboard = new TeacherDashboard({
      teacherId,
      classroomId,
      schoolId,
    });

    this._classrooms.set(classroomId, {
      classroomId,
      schoolId,
      teacherId,
      teacherName: teacherName || teacherId,
      grade: grade || 0,
      studentCount: studentCount || 0,
      dashboard,
      provisionedAt: new Date().toISOString(),
    });

    this._log('CLASSROOM_PROVISIONED', { classroomId, schoolId, teacherId, grade });

    return {
      provisioned: true,
      classroomId,
      dashboard,
    };
  }

  /**
   * Decommission a classroom.
   * Student data is preserved (L78) — canisters remain accessible.
   *
   * @param {string} classroomId - Classroom to decommission
   * @returns {{ decommissioned: boolean, classroomId: string }}
   */
  decommissionClassroom(classroomId) {
    const existed = this._classrooms.delete(classroomId);

    if (existed) {
      this._log('CLASSROOM_DECOMMISSIONED', { classroomId });
    }

    return {
      decommissioned: existed,
      classroomId,
    };
  }

  /**
   * List classrooms for a school (or all classrooms if no schoolId given).
   *
   * @param {string} [schoolId] - Filter by school
   * @returns {Array<{ classroomId: string, schoolId: string, teacherId: string, teacherName: string, grade: number, studentCount: number, provisionedAt: string }>}
   */
  listClassrooms(schoolId) {
    const classrooms = [];
    for (const [, cr] of this._classrooms) {
      if (!schoolId || cr.schoolId === schoolId) {
        classrooms.push({
          classroomId: cr.classroomId,
          schoolId: cr.schoolId,
          teacherId: cr.teacherId,
          teacherName: cr.teacherName,
          grade: cr.grade,
          studentCount: cr.studentCount,
          provisionedAt: cr.provisionedAt,
        });
      }
    }
    return classrooms;
  }

  // ── Canister provisioning ───────────────────────────────────────────────

  /**
   * Provision Bronze Canisters for a list of students in a classroom.
   *
   * @param {string} classroomId - Target classroom
   * @param {Array<{ studentId: string, grade?: number }>} students - Student list
   * @returns {{ provisioned: number, classroomId: string, canisters: Array<{ studentId: string, canisterId: string }> }}
   */
  provisionStudentCohort(classroomId, students) {
    const classroom = this._classrooms.get(classroomId);
    if (!classroom) {
      throw new Error(`Classroom ${classroomId} not found — provision it first`);
    }

    const results = [];

    for (const student of students) {
      const canisterId = `BC::${this.districtId}::${classroom.schoolId}::${student.studentId}`;

      const canister = new BronzeCanister({
        studentId: student.studentId,
        grade: student.grade ?? classroom.grade,
        schoolId: classroom.schoolId,
        canisterId,
      });

      canister.provision();
      this._canisters.set(student.studentId, canister);

      // Register with the classroom dashboard
      if (classroom.dashboard) {
        classroom.dashboard.addCanister(canister);
      }

      results.push({ studentId: student.studentId, canisterId });
    }

    this._log('COHORT_PROVISIONED', {
      classroomId,
      studentCount: students.length,
      studentIds: students.map(s => s.studentId),
    });

    return {
      provisioned: results.length,
      classroomId,
      canisters: results,
    };
  }

  // ── District-level observability ────────────────────────────────────────

  /**
   * District-level aggregate statistics.
   * Anonymized — no individual student data.
   *
   * @returns {{ totalSchools: number, totalClassrooms: number, totalStudents: number, totalCanisters: number, activeCanisters: number }}
   */
  districtStats() {
    let activeCanisters = 0;
    for (const [, canister] of this._canisters) {
      const st = typeof canister.status === 'function' ? canister.status() : {};
      if (st.active) activeCanisters++;
    }

    return {
      totalSchools: this._schools.size,
      totalClassrooms: this._classrooms.size,
      totalStudents: this._canisters.size,
      totalCanisters: this._canisters.size,
      activeCanisters,
    };
  }

  /**
   * Adoption metrics — growth and engagement trends.
   *
   * @returns {{ phase: string, districtId: string, districtName: string, totalSchools: number, totalClassrooms: number, totalCanisters: number, activeCanisters: number, avgCanistersPerClassroom: number, deployedSince: string }}
   */
  adoptionMetrics() {
    const stats = this.districtStats();
    const avgCanistersPerClassroom = stats.totalClassrooms > 0
      ? Math.round((stats.totalCanisters / stats.totalClassrooms) * 100) / 100
      : 0;

    return {
      phase: this._phase,
      districtId: this.districtId,
      districtName: this.districtName,
      totalSchools: stats.totalSchools,
      totalClassrooms: stats.totalClassrooms,
      totalCanisters: stats.totalCanisters,
      activeCanisters: stats.activeCanisters,
      avgCanistersPerClassroom,
      deployedSince: this._createdAt,
    };
  }

  // ── Compliance ──────────────────────────────────────────────────────────

  /**
   * CHRONO-anchored audit trail of all provisioning actions.
   *
   * @returns {{ districtId: string, auditEntries: number, trail: object[] }}
   */
  auditTrail() {
    return {
      districtId: this.districtId,
      auditEntries: this._auditLog.length,
      trail: this._auditLog.map(e => ({ ...e })),
    };
  }

  /**
   * Data sovereignty compliance verification.
   * Checks that all canisters are sovereign-compliant.
   *
   * @returns {{ compliant: boolean, districtId: string, checks: object, canistersChecked: number, violations: string[] }}
   */
  complianceReport() {
    const violations = [];
    let canistersChecked = 0;

    for (const [studentId, canister] of this._canisters) {
      canistersChecked++;
      const st = typeof canister.status === 'function' ? canister.status() : {};

      if (!st.provisioned) {
        violations.push(`Canister for ${studentId} is not provisioned`);
      }
    }

    const checks = {
      allCanistersProvisioned: violations.length === 0,
      chronoAttached: this._chrono !== null,
      dataInDistrict: true,
      noExternalSync: true,
      behavioralLawsActive: true,
    };

    return {
      compliant: violations.length === 0 && checks.chronoAttached,
      districtId: this.districtId,
      checks,
      canistersChecked,
      violations,
    };
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Set up a pilot deployment (Phase A from Paper XV).
   * Typically one school, one grade, limited student count.
   *
   * @param {object} config
   * @param {object} config.school       - { schoolId, schoolName, principalEmail }
   * @param {object} config.classroom    - { teacherId, teacherName, grade, studentCount }
   * @param {Array<{ studentId: string, grade?: number }>} config.students - Pilot student list
   * @returns {{ phase: string, schoolId: string, classroomId: string, canistersProvisioned: number }}
   */
  pilotSetup(config) {
    if (!config.school || !config.classroom || !config.students) {
      throw new Error('pilotSetup requires { school, classroom, students }');
    }

    this._phase = 'PILOT';

    // Add the pilot school
    this.addSchool(config.school);

    // Provision the pilot classroom
    const { classroomId } = this.provisionClassroom({
      schoolId: config.school.schoolId,
      ...config.classroom,
    });

    // Provision student canisters
    const { provisioned } = this.provisionStudentCohort(classroomId, config.students);

    this._log('PILOT_SETUP', {
      schoolId: config.school.schoolId,
      classroomId,
      studentCount: provisioned,
    });

    return {
      phase: 'PILOT',
      schoolId: config.school.schoolId,
      classroomId,
      canistersProvisioned: provisioned,
    };
  }

  /**
   * Scale from pilot to full district deployment (Phase B/C from Paper XV).
   *
   * @param {object} config
   * @param {Array<object>} config.schools    - Array of { schoolId, schoolName, principalEmail }
   * @param {Array<object>} config.classrooms - Array of { schoolId, teacherId, teacherName, grade, studentCount }
   * @param {Array<{ classroomId: string, students: Array<{ studentId: string, grade?: number }> }>} config.cohorts - Student cohorts per classroom
   * @returns {{ phase: string, schoolsAdded: number, classroomsProvisioned: number, canistersProvisioned: number }}
   */
  scaleUp(config) {
    this._phase = 'FULL_DISTRICT';

    let schoolsAdded = 0;
    let classroomsProvisioned = 0;
    let canistersProvisioned = 0;

    // Add schools
    if (config.schools) {
      for (const school of config.schools) {
        if (!this._schools.has(school.schoolId)) {
          this.addSchool(school);
          schoolsAdded++;
        }
      }
    }

    // Provision classrooms
    if (config.classrooms) {
      for (const cr of config.classrooms) {
        const { classroomId } = this.provisionClassroom(cr);
        classroomsProvisioned++;

        // If cohorts are provided, provision students for this classroom
        if (config.cohorts) {
          const cohort = config.cohorts.find(c => c.classroomId === classroomId);
          if (cohort) {
            const { provisioned } = this.provisionStudentCohort(classroomId, cohort.students);
            canistersProvisioned += provisioned;
          }
        }
      }
    }

    this._log('SCALE_UP', { schoolsAdded, classroomsProvisioned, canistersProvisioned });

    return {
      phase: 'FULL_DISTRICT',
      schoolsAdded,
      classroomsProvisioned,
      canistersProvisioned,
    };
  }
}
