/**
 * CURRICULUM-REPOSITORY — School Curriculum Management
 * ──────────────────────────────────────────────────────────────────────────────
 * Manages the school's curriculum library including:
 *   - Lesson plans, units, and standards
 *   - Learning objectives mapped to state standards
 *   - Pacing guides with timeline tracking
 *   - Curriculum distribution to classrooms
 *   - Version control for curriculum updates
 *   - Differentiated curriculum tracks (honors, standard, remedial)
 *
 * Theory basis:
 *   Paper XV   — ASK III: curriculum architecture
 *   Paper XX   — STIGMERGY: immutable pheromone trail (CHRONO)
 *   Paper X    — EXECUTIO UNIVERSALIS: query = act = learn = log
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// CurriculumRepository
// ---------------------------------------------------------------------------

export class CurriculumRepository {
  /**
   * Create a curriculum repository for a school.
   *
   * @param {object} options
   * @param {string} options.schoolId - School identifier
   */
  constructor({ schoolId }) {
    if (!schoolId) throw new Error('CurriculumRepository requires a schoolId');

    /** @type {string} */
    this.schoolId = schoolId;

    /**
     * Curriculum storage (curriculumId → curriculum object)
     * @type {Map<string, object>}
     */
    this._curricula = new Map();

    /**
     * Version history for curricula (curriculumId → versions array)
     * @type {Map<string, object[]>}
     */
    this._versions = new Map();

    /**
     * Distribution tracking (curriculumId → Set<classroomId>)
     * @type {Map<string, Set<string>>}
     */
    this._distributions = new Map();

    /**
     * Standards library (standardId → standard object)
     * @type {Map<string, object>}
     */
    this._standards = new Map();

    /** @type {object|null} */
    this._chrono = null;

    /** @type {string} */
    this._createdAt = new Date().toISOString();
  }

  /**
   * Attach CHRONO for audit trail.
   * @param {object} chrono - CHRONO instance
   * @returns {CurriculumRepository}
   */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  // ── Curriculum Management ────────────────────────────────────────────────

  /**
   * Upload a new curriculum to the repository.
   *
   * @param {object} curriculum
   * @param {string} curriculum.curriculumId - Unique curriculum identifier
   * @param {string} curriculum.subject      - Subject area (Math, Science, etc.)
   * @param {number} curriculum.grade        - Grade level
   * @param {string} curriculum.title        - Curriculum title
   * @param {string} [curriculum.track]      - Track: 'honors', 'standard', 'remedial'
   * @param {object[]} curriculum.units      - Array of unit objects
   * @param {string[]} [curriculum.standards] - Mapped standard IDs
   * @param {object} [curriculum.metadata]   - Additional metadata
   * @returns {{ uploaded: boolean, curriculumId: string, version: number }}
   */
  upload(curriculum) {
    const { curriculumId, subject, grade, title, track = 'standard', units = [], standards = [], metadata = {} } = curriculum;

    if (!curriculumId) throw new Error('Curriculum requires a curriculumId');
    if (!subject) throw new Error('Curriculum requires a subject');
    if (grade === undefined) throw new Error('Curriculum requires a grade');
    if (!title) throw new Error('Curriculum requires a title');

    const now = new Date().toISOString();
    const version = 1;

    const curriculumObj = {
      curriculumId,
      subject,
      grade,
      title,
      track,
      units,
      standards,
      metadata,
      version,
      createdAt: now,
      updatedAt: now,
      schoolId: this.schoolId,
    };

    this._curricula.set(curriculumId, curriculumObj);
    this._versions.set(curriculumId, [{ ...curriculumObj }]);
    this._distributions.set(curriculumId, new Set());

    this._log('CURRICULUM_UPLOADED', { curriculumId, subject, grade, track, unitCount: units.length });

    return { uploaded: true, curriculumId, version };
  }

  /**
   * Get a curriculum by ID.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @returns {object|null} Curriculum object or null
   */
  get(curriculumId) {
    return this._curricula.get(curriculumId) || null;
  }

  /**
   * List all curricula with optional filters.
   *
   * @param {object} [filters]
   * @param {string} [filters.subject] - Filter by subject
   * @param {number} [filters.grade]   - Filter by grade
   * @param {string} [filters.track]   - Filter by track
   * @returns {object[]} Array of curriculum objects
   */
  list(filters = {}) {
    let curricula = Array.from(this._curricula.values());

    if (filters.subject) {
      curricula = curricula.filter(c => c.subject === filters.subject);
    }
    if (filters.grade !== undefined) {
      curricula = curricula.filter(c => c.grade === filters.grade);
    }
    if (filters.track) {
      curricula = curricula.filter(c => c.track === filters.track);
    }

    return curricula;
  }

  /**
   * Update a curriculum (creates a new version).
   *
   * @param {string} curriculumId - Curriculum identifier
   * @param {object} updates      - Fields to update
   * @returns {{ updated: boolean, curriculumId: string, version: number }}
   */
  update(curriculumId, updates) {
    const existing = this._curricula.get(curriculumId);
    if (!existing) {
      return { updated: false, curriculumId, error: 'Curriculum not found' };
    }

    const now = new Date().toISOString();
    const newVersion = existing.version + 1;

    const updated = {
      ...existing,
      ...updates,
      curriculumId, // Preserve ID
      version: newVersion,
      updatedAt: now,
    };

    this._curricula.set(curriculumId, updated);

    const versions = this._versions.get(curriculumId) || [];
    versions.push({ ...updated });
    this._versions.set(curriculumId, versions);

    this._log('CURRICULUM_UPDATED', { curriculumId, version: newVersion, fields: Object.keys(updates) });

    return { updated: true, curriculumId, version: newVersion };
  }

  /**
   * Delete a curriculum.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @returns {{ deleted: boolean, curriculumId: string }}
   */
  delete(curriculumId) {
    const existed = this._curricula.delete(curriculumId);
    
    if (existed) {
      this._log('CURRICULUM_DELETED', { curriculumId });
    }

    return { deleted: existed, curriculumId };
  }

  // ── Version Control ──────────────────────────────────────────────────────

  /**
   * Get version history for a curriculum.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @returns {{ curriculumId: string, versions: object[] }}
   */
  getVersionHistory(curriculumId) {
    const versions = this._versions.get(curriculumId) || [];
    return { curriculumId, versions };
  }

  /**
   * Get a specific version of a curriculum.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @param {number} version      - Version number
   * @returns {object|null} Curriculum version or null
   */
  getVersion(curriculumId, version) {
    const versions = this._versions.get(curriculumId) || [];
    return versions.find(v => v.version === version) || null;
  }

  /**
   * Rollback to a previous version.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @param {number} version      - Version to rollback to
   * @returns {{ rolledBack: boolean, curriculumId: string, currentVersion: number }}
   */
  rollback(curriculumId, version) {
    const targetVersion = this.getVersion(curriculumId, version);
    if (!targetVersion) {
      return { rolledBack: false, curriculumId, error: 'Version not found' };
    }

    const current = this._curricula.get(curriculumId);
    const newVersion = current ? current.version + 1 : version + 1;

    const restored = {
      ...targetVersion,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      restoredFrom: version,
    };

    this._curricula.set(curriculumId, restored);

    const versions = this._versions.get(curriculumId) || [];
    versions.push({ ...restored });
    this._versions.set(curriculumId, versions);

    this._log('CURRICULUM_ROLLBACK', { curriculumId, restoredFrom: version, newVersion });

    return { rolledBack: true, curriculumId, currentVersion: newVersion };
  }

  // ── Distribution ─────────────────────────────────────────────────────────

  /**
   * Distribute a curriculum to classrooms.
   *
   * @param {string} curriculumId    - Curriculum identifier
   * @param {string[]} classroomIds  - Array of classroom IDs
   * @returns {{ distributed: boolean, curriculumId: string, classroomIds: string[] }}
   */
  distribute(curriculumId, classroomIds) {
    const curriculum = this._curricula.get(curriculumId);
    if (!curriculum) {
      return { distributed: false, curriculumId, error: 'Curriculum not found' };
    }

    const distribution = this._distributions.get(curriculumId) || new Set();
    for (const classroomId of classroomIds) {
      distribution.add(classroomId);
    }
    this._distributions.set(curriculumId, distribution);

    this._log('CURRICULUM_DISTRIBUTED', { curriculumId, classroomIds });

    return { distributed: true, curriculumId, classroomIds };
  }

  /**
   * Get classrooms where a curriculum is distributed.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @returns {{ curriculumId: string, classroomIds: string[] }}
   */
  getDistribution(curriculumId) {
    const distribution = this._distributions.get(curriculumId) || new Set();
    return { curriculumId, classroomIds: Array.from(distribution) };
  }

  /**
   * Revoke a curriculum from classrooms.
   *
   * @param {string} curriculumId   - Curriculum identifier
   * @param {string[]} classroomIds - Array of classroom IDs to revoke from
   * @returns {{ revoked: boolean, curriculumId: string, classroomIds: string[] }}
   */
  revoke(curriculumId, classroomIds) {
    const distribution = this._distributions.get(curriculumId);
    if (!distribution) {
      return { revoked: false, curriculumId, classroomIds: [] };
    }

    for (const classroomId of classroomIds) {
      distribution.delete(classroomId);
    }

    this._log('CURRICULUM_REVOKED', { curriculumId, classroomIds });

    return { revoked: true, curriculumId, classroomIds };
  }

  // ── Pacing Guides ────────────────────────────────────────────────────────

  /**
   * Update pacing for a curriculum.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @param {object} pacing       - Pacing configuration
   * @param {string} pacing.startDate  - Pacing start date
   * @param {string} pacing.endDate    - Pacing end date
   * @param {object[]} pacing.unitSchedule - Array of { unitId, startDate, endDate }
   * @returns {{ updated: boolean, curriculumId: string }}
   */
  updatePacing(curriculumId, pacing) {
    const curriculum = this._curricula.get(curriculumId);
    if (!curriculum) {
      return { updated: false, curriculumId, error: 'Curriculum not found' };
    }

    curriculum.pacing = {
      ...pacing,
      updatedAt: new Date().toISOString(),
    };

    this._log('CURRICULUM_PACING_UPDATED', { curriculumId, startDate: pacing.startDate, endDate: pacing.endDate });

    return { updated: true, curriculumId };
  }

  /**
   * Get pacing guide for a curriculum.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @returns {{ curriculumId: string, pacing: object|null }}
   */
  getPacing(curriculumId) {
    const curriculum = this._curricula.get(curriculumId);
    return { curriculumId, pacing: curriculum?.pacing || null };
  }

  // ── Standards ────────────────────────────────────────────────────────────

  /**
   * Add a state/national standard to the library.
   *
   * @param {object} standard
   * @param {string} standard.standardId - Standard identifier (e.g., "CCSS.MATH.6.RP.A.1")
   * @param {string} standard.title      - Standard title
   * @param {string} standard.description - Standard description
   * @param {string} [standard.category]  - Category (e.g., "Mathematics", "ELA")
   * @param {string} [standard.source]    - Source (e.g., "Common Core", "TEKS")
   * @returns {{ added: boolean, standardId: string }}
   */
  addStandard(standard) {
    const { standardId, title, description, category = '', source = '' } = standard;

    if (!standardId) throw new Error('Standard requires a standardId');
    if (!title) throw new Error('Standard requires a title');

    this._standards.set(standardId, {
      standardId,
      title,
      description,
      category,
      source,
      addedAt: new Date().toISOString(),
    });

    return { added: true, standardId };
  }

  /**
   * Get a standard by ID.
   *
   * @param {string} standardId - Standard identifier
   * @returns {object|null} Standard object or null
   */
  getStandard(standardId) {
    return this._standards.get(standardId) || null;
  }

  /**
   * List all standards with optional filters.
   *
   * @param {object} [filters]
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.source]   - Filter by source
   * @returns {object[]} Array of standard objects
   */
  listStandards(filters = {}) {
    let standards = Array.from(this._standards.values());

    if (filters.category) {
      standards = standards.filter(s => s.category === filters.category);
    }
    if (filters.source) {
      standards = standards.filter(s => s.source === filters.source);
    }

    return standards;
  }

  /**
   * Map standards to a curriculum.
   *
   * @param {string} curriculumId - Curriculum identifier
   * @param {string[]} standardIds - Array of standard IDs
   * @returns {{ mapped: boolean, curriculumId: string, standardIds: string[] }}
   */
  mapStandards(curriculumId, standardIds) {
    const curriculum = this._curricula.get(curriculumId);
    if (!curriculum) {
      return { mapped: false, curriculumId, error: 'Curriculum not found' };
    }

    curriculum.standards = [...new Set([...(curriculum.standards || []), ...standardIds])];
    curriculum.updatedAt = new Date().toISOString();

    this._log('STANDARDS_MAPPED', { curriculumId, standardIds });

    return { mapped: true, curriculumId, standardIds: curriculum.standards };
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  /**
   * Get repository statistics.
   *
   * @returns {{ schoolId: string, totalCurricula: number, totalStandards: number, bySubject: object, byTrack: object }}
   */
  stats() {
    const curricula = Array.from(this._curricula.values());

    const bySubject = {};
    const byTrack = {};

    for (const c of curricula) {
      bySubject[c.subject] = (bySubject[c.subject] || 0) + 1;
      byTrack[c.track] = (byTrack[c.track] || 0) + 1;
    }

    return {
      schoolId: this.schoolId,
      totalCurricula: curricula.length,
      totalStandards: this._standards.size,
      bySubject,
      byTrack,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

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
}
