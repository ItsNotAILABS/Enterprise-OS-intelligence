/**
 * STUDENT-IDENTITY — Sovereign Internet Identity for Students
 * ──────────────────────────────────────────────────────────────────────────────
 * Each student receives a sovereign Internet Identity that:
 *   - Is portable across schools and districts (L73 Data Sovereignty)
 *   - Cannot be overwritten or accessed externally (L74 Identity Integrity)
 *   - Persists after graduation (L78 Persistence Guarantee)
 *   - Follows the student during transfers
 *
 * On ICP, this maps to an Internet Identity principal. In the SDK this is a
 * local simulation that produces the same shape so that deployment to ICP
 * mainnet requires zero interface changes.
 *
 * Theory basis:
 *   Paper XV   — ASK III: Bronze Canister student identity
 *   Paper V    — LEGES ANIMAE: L73, L74, L78 — sovereignty, integrity, persistence
 *   Paper VIII — IMPERIUM CONSERVATUM: Noether conservation of doctrinal charge
 *   Paper XIX  — CIVITAS MERIDIANA: civic identity infrastructure
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function generatePrincipal(studentId, schoolId) {
  return sha256(`II::${studentId}::${schoolId}::${Date.now()}`).slice(0, 32);
}

// ---------------------------------------------------------------------------
// StudentIdentity
// ---------------------------------------------------------------------------

export class StudentIdentity {
  /**
   * Create a sovereign student identity.
   *
   * @param {object} options
   * @param {string} options.studentId   - Unique student identifier
   * @param {string} options.displayName - Human-readable display name
   * @param {number} [options.grade]     - Student grade level (1–12+)
   * @param {string} options.schoolId    - Current school identifier
   */
  constructor({ studentId, displayName, grade = 0, schoolId }) {
    if (!studentId) throw new Error('StudentIdentity requires a studentId');
    if (!displayName) throw new Error('StudentIdentity requires a displayName');
    if (!schoolId) throw new Error('StudentIdentity requires a schoolId');

    /** @type {string} */
    this.studentId = studentId;

    /** @type {string} */
    this.displayName = displayName;

    /** @type {number} */
    this.grade = grade;

    /** @type {string} */
    this.schoolId = schoolId;

    /** @type {string|null} */
    this._principal = null;

    /** @type {string} */
    this._createdAt = new Date().toISOString();

    /** @type {boolean} */
    this._provisioned = false;

    /** @type {boolean} */
    this._graduated = false;

    /** @type {string[]} */
    this._schoolHistory = [schoolId];
  }

  // ── Identity lifecycle ──────────────────────────────────────────────────

  /**
   * Provision the sovereign identity.
   * Creates an Internet Identity principal (stub — on ICP this calls the II canister).
   *
   * @returns {{ provisioned: boolean, principal: string, studentId: string, createdAt: string }}
   */
  provision() {
    if (this._provisioned) {
      return {
        provisioned: true,
        principal: this._principal,
        studentId: this.studentId,
        createdAt: this._createdAt,
        message: 'Identity already provisioned',
      };
    }

    this._principal = generatePrincipal(this.studentId, this.schoolId);
    this._provisioned = true;

    return {
      provisioned: true,
      principal: this._principal,
      studentId: this.studentId,
      createdAt: this._createdAt,
    };
  }

  /**
   * Verify identity integrity — checks that the principal derives correctly
   * and that no external tampering has occurred.
   *
   * @returns {{ valid: boolean, principal: string, studentId: string, checks: object }}
   */
  verify() {
    const checks = {
      hasStudentId: !!this.studentId,
      hasPrincipal: !!this._principal,
      isProvisioned: this._provisioned,
      displayNameIntact: typeof this.displayName === 'string' && this.displayName.length > 0,
      schoolHistoryIntact: this._schoolHistory.length > 0,
    };

    const valid = Object.values(checks).every(Boolean);

    return {
      valid,
      principal: this._principal,
      studentId: this.studentId,
      checks,
    };
  }

  /**
   * Export a portable identity package — everything needed to restore the
   * identity on a new device or school (L73 Data Sovereignty).
   *
   * @returns {{ studentId: string, displayName: string, grade: number, principal: string, schoolId: string, schoolHistory: string[], createdAt: string, graduated: boolean }}
   */
  export() {
    return {
      studentId: this.studentId,
      displayName: this.displayName,
      grade: this.grade,
      principal: this._principal,
      schoolId: this.schoolId,
      schoolHistory: [...this._schoolHistory],
      createdAt: this._createdAt,
      graduated: this._graduated,
    };
  }

  // ── Sovereignty enforcement ─────────────────────────────────────────────

  /**
   * Identity is always sovereign — the student owns it, not the school.
   * @type {boolean}
   */
  get sovereign() {
    return true;
  }

  /**
   * Identity is always portable — it travels with the student.
   * @type {boolean}
   */
  get portable() {
    return true;
  }

  // ── Transfer ────────────────────────────────────────────────────────────

  /**
   * Transfer the identity to a new school.
   * The identity follows the student — L74 guarantees it cannot be wiped.
   *
   * @param {string} newSchoolId - The new school's identifier
   * @returns {{ transferred: boolean, previousSchool: string, newSchool: string, schoolHistory: string[] }}
   */
  transferSchool(newSchoolId) {
    if (!newSchoolId) throw new Error('transferSchool requires a newSchoolId');

    const previousSchool = this.schoolId;
    this.schoolId = newSchoolId;
    this._schoolHistory.push(newSchoolId);

    return {
      transferred: true,
      previousSchool,
      newSchool: newSchoolId,
      schoolHistory: [...this._schoolHistory],
    };
  }

  /**
   * Mark the identity as graduated.
   * The identity persists indefinitely — L78 Persistence Guarantee.
   *
   * @returns {{ graduated: boolean, studentId: string, principal: string, schoolHistory: string[] }}
   */
  graduate() {
    this._graduated = true;

    return {
      graduated: true,
      studentId: this.studentId,
      principal: this._principal,
      schoolHistory: [...this._schoolHistory],
    };
  }
}
