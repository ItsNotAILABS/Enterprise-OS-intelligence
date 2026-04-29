/**
 * TEACHER-DASHBOARD — Teacher Observability Layer
 * ──────────────────────────────────────────────────────────────────────────────
 * What the teacher sees. NO access to student canister contents.
 *
 * The dashboard provides:
 *   - Activity overview (who is active, last action time)
 *   - Engagement metrics (anonymized: sessions, commands, build actions)
 *   - Project milestones (student-shared portfolio entries only)
 *   - Classroom aggregate statistics
 *   - Alerts (inactive students, students needing help)
 *   - Weekly/monthly report generation
 *
 * Privacy guarantee: The teacher never sees the student's canister contents.
 * Only metadata, timestamps, and student-shared portfolio entries are visible.
 * This is enforced architecturally — the dashboard holds canister references
 * but only calls status() and portfolio() on them.
 *
 * Theory basis:
 *   Paper XV  — ASK III: teacher observability without content access
 *   Paper V   — LEGES ANIMAE: L73 (data sovereignty), L77 (no extraction)
 *   Paper XIX — CIVITAS MERIDIANA: civic infrastructure for education
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// TeacherDashboard
// ---------------------------------------------------------------------------

export class TeacherDashboard {
  /**
   * Create a teacher dashboard for a classroom.
   *
   * @param {object} options
   * @param {string} options.teacherId    - Teacher identifier
   * @param {string} options.classroomId  - Classroom identifier
   * @param {string} options.schoolId     - School identifier
   */
  constructor({ teacherId, classroomId, schoolId }) {
    if (!teacherId) throw new Error('TeacherDashboard requires a teacherId');
    if (!classroomId) throw new Error('TeacherDashboard requires a classroomId');
    if (!schoolId) throw new Error('TeacherDashboard requires a schoolId');

    /** @type {string} */
    this.teacherId = teacherId;

    /** @type {string} */
    this.classroomId = classroomId;

    /** @type {string} */
    this.schoolId = schoolId;

    /**
     * Registered student canisters (studentId → canister reference).
     * @type {Map<string, object>}
     */
    this._canisters = new Map();

    /** @type {string} */
    this._createdAt = new Date().toISOString();
  }

  // ── Register canisters ──────────────────────────────────────────────────

  /**
   * Register a student's Bronze Canister for observation.
   *
   * @param {object} canister - A BronzeCanister instance
   * @returns {{ added: boolean, studentId: string, totalCanisters: number }}
   */
  addCanister(canister) {
    if (!canister || !canister.studentId) {
      throw new Error('addCanister requires a canister with a studentId');
    }

    this._canisters.set(canister.studentId, canister);

    return {
      added: true,
      studentId: canister.studentId,
      totalCanisters: this._canisters.size,
    };
  }

  /**
   * Remove a student's canister from observation.
   *
   * @param {string} studentId - Student identifier to remove
   * @returns {{ removed: boolean, studentId: string, totalCanisters: number }}
   */
  removeCanister(studentId) {
    const existed = this._canisters.delete(studentId);

    return {
      removed: existed,
      studentId,
      totalCanisters: this._canisters.size,
    };
  }

  // ── Observability (metadata only, never content) ────────────────────────

  /**
   * Activity overview — which students are active and when they last acted.
   * Uses only canister.status() — never accesses content.
   *
   * @returns {Array<{ studentId: string, active: boolean, lastAction: string|null, grade: number|null }>}
   */
  activityOverview() {
    const overview = [];

    for (const [studentId, canister] of this._canisters) {
      const st = typeof canister.status === 'function' ? canister.status() : {};
      overview.push({
        studentId,
        active: st.active ?? false,
        lastAction: st.lastAction ?? null,
        grade: st.grade ?? null,
      });
    }

    return overview;
  }

  /**
   * Engagement metrics — anonymized per-student metrics.
   * Counts sessions, commands, and build actions from canister status.
   *
   * @returns {Array<{ studentId: string, sessionCount: number, commandCount: number, buildActions: number, memoryCount: number }>}
   */
  engagementMetrics() {
    const metrics = [];

    for (const [studentId, canister] of this._canisters) {
      const st = typeof canister.status === 'function' ? canister.status() : {};
      metrics.push({
        studentId,
        sessionCount: st.sessionCount ?? 0,
        commandCount: st.commandCount ?? 0,
        buildActions: st.chronoLength ?? 0,
        memoryCount: st.memoryCount ?? 0,
      });
    }

    return metrics;
  }

  /**
   * Project milestones — only student-shared portfolio entries.
   * Calls canister.portfolio() which returns the CHRONO audit trail as
   * portfolio entries. These are build actions the student chose to make
   * visible — the teacher never sees private canister data.
   *
   * @returns {Array<{ studentId: string, milestones: object[] }>}
   */
  projectMilestones() {
    const milestones = [];

    for (const [studentId, canister] of this._canisters) {
      const entries = typeof canister.portfolio === 'function'
        ? canister.portfolio()
        : [];

      // Only include entries explicitly shared by the student
      const shared = Array.isArray(entries)
        ? entries.filter(e => e.shared === true || e.data?.shared === true)
        : [];

      milestones.push({ studentId, milestones: shared });
    }

    return milestones;
  }

  /**
   * Classroom-level aggregate statistics.
   *
   * @returns {{ classroomId: string, teacherId: string, totalStudents: number, activeStudents: number, totalSessions: number, totalCommands: number, totalBuildActions: number, avgEngagement: number }}
   */
  classroomStats() {
    let activeStudents = 0;
    let totalSessions = 0;
    let totalCommands = 0;
    let totalBuildActions = 0;

    for (const [, canister] of this._canisters) {
      const st = typeof canister.status === 'function' ? canister.status() : {};
      if (st.active) activeStudents++;
      totalSessions += st.sessionCount ?? 0;
      totalCommands += st.commandCount ?? 0;
      totalBuildActions += st.chronoLength ?? 0;
    }

    const totalStudents = this._canisters.size;
    const avgEngagement = totalStudents > 0
      ? Math.round((totalCommands / totalStudents) * 100) / 100
      : 0;

    return {
      classroomId: this.classroomId,
      teacherId: this.teacherId,
      totalStudents,
      activeStudents,
      totalSessions,
      totalCommands,
      totalBuildActions,
      avgEngagement,
    };
  }

  // ── Alerts ──────────────────────────────────────────────────────────────

  /**
   * Generate alerts for the teacher.
   * Flags inactive students and students who may need help.
   *
   * @param {object} [options]
   * @param {number} [options.inactiveThresholdMs] - Milliseconds after which a student is "inactive" (default: 24 hours)
   * @param {number} [options.lowEngagementThreshold] - Minimum commands to not trigger help alert (default: 3)
   * @returns {{ inactive: Array<{ studentId: string, lastAction: string|null }>, needsHelp: Array<{ studentId: string, commandCount: number }> }}
   */
  alerts({ inactiveThresholdMs = 24 * 60 * 60 * 1000, lowEngagementThreshold = 3 } = {}) {
    const now = Date.now();
    const inactive = [];
    const needsHelp = [];

    for (const [studentId, canister] of this._canisters) {
      const st = typeof canister.status === 'function' ? canister.status() : {};

      // Inactive check
      if (st.lastAction) {
        const lastTime = new Date(st.lastAction).getTime();
        if (now - lastTime > inactiveThresholdMs) {
          inactive.push({ studentId, lastAction: st.lastAction });
        }
      } else if (st.provisioned) {
        inactive.push({ studentId, lastAction: null });
      }

      // Low engagement check
      const commands = st.commandCount ?? 0;
      if (commands < lowEngagementThreshold && st.provisioned) {
        needsHelp.push({ studentId, commandCount: commands });
      }
    }

    return { inactive, needsHelp };
  }

  // ── Export ───────────────────────────────────────────────────────────────

  /**
   * Generate a report for a given period.
   *
   * @param {string} [period='weekly'] - Report period: 'weekly' or 'monthly'
   * @returns {{ report: object }}
   */
  generateReport(period = 'weekly') {
    const stats = this.classroomStats();
    const alertData = this.alerts();
    const milestones = this.projectMilestones();

    const totalMilestones = milestones.reduce((sum, m) => sum + m.milestones.length, 0);

    return {
      report: {
        period,
        generatedAt: new Date().toISOString(),
        classroomId: this.classroomId,
        teacherId: this.teacherId,
        schoolId: this.schoolId,
        summary: {
          totalStudents: stats.totalStudents,
          activeStudents: stats.activeStudents,
          totalSessions: stats.totalSessions,
          totalCommands: stats.totalCommands,
          totalBuildActions: stats.totalBuildActions,
          avgEngagement: stats.avgEngagement,
          totalSharedMilestones: totalMilestones,
        },
        alerts: {
          inactiveCount: alertData.inactive.length,
          needsHelpCount: alertData.needsHelp.length,
          inactive: alertData.inactive,
          needsHelp: alertData.needsHelp,
        },
      },
    };
  }
}
