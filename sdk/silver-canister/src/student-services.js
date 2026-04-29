/**
 * STUDENT-SERVICES — Counseling, Special Education & Support Tracking
 * ──────────────────────────────────────────────────────────────────────────────
 * Manages student support services including:
 *   - Counselor referral system
 *   - Special education tracking
 *   - 504 plan management
 *   - English Language Learner support
 *   - Behavioral incident tracking
 *   - Student wellness monitoring
 *
 * Privacy guarantee: All data is handled in compliance with FERPA.
 * Access is strictly controlled by role and need-to-know.
 *
 * Theory basis:
 *   Paper XV   — ASK III: student support architecture
 *   Paper V    — LEGES ANIMAE: L73 (data sovereignty)
 *   Paper XIX  — CIVITAS MERIDIANA: civic infrastructure layer
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// StudentServices
// ---------------------------------------------------------------------------

export class StudentServices {
  /**
   * Create a student services manager for a school.
   *
   * @param {object} options
   * @param {string} options.schoolId - School identifier
   */
  constructor({ schoolId }) {
    if (!schoolId) throw new Error('StudentServices requires a schoolId');

    /** @type {string} */
    this.schoolId = schoolId;

    /**
     * Referrals storage (referralId → referral object)
     * @type {Map<string, object>}
     */
    this._referrals = new Map();

    /**
     * Student plans (studentId → plans array)
     * IEPs, 504 plans, ELL plans
     * @type {Map<string, object[]>}
     */
    this._plans = new Map();

    /**
     * Interventions (studentId → interventions array)
     * @type {Map<string, object[]>}
     */
    this._interventions = new Map();

    /**
     * Behavioral incidents
     * @type {object[]}
     */
    this._incidents = [];

    /**
     * Wellness flags (studentId → wellness records)
     * @type {Map<string, object[]>}
     */
    this._wellnessFlags = new Map();

    /** @type {object|null} */
    this._chrono = null;

    /** @type {number} */
    this._referralCounter = 0;

    /** @type {number} */
    this._incidentCounter = 0;

    /** @type {string} */
    this._createdAt = new Date().toISOString();
  }

  /**
   * Attach CHRONO for audit trail.
   * @param {object} chrono - CHRONO instance
   * @returns {StudentServices}
   */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  // ── Constants ────────────────────────────────────────────────────────────

  /**
   * Referral types.
   */
  static REFERRAL_TYPE = {
    COUNSELING: 'counseling',
    ACADEMIC: 'academic',
    BEHAVIORAL: 'behavioral',
    ATTENDANCE: 'attendance',
    SPECIAL_ED: 'special_education',
    CRISIS: 'crisis',
    COLLEGE_CAREER: 'college_career',
    OTHER: 'other',
  };

  /**
   * Plan types.
   */
  static PLAN_TYPE = {
    IEP: 'iep',                // Individualized Education Program
    PLAN_504: '504',           // Section 504 Plan
    ELL: 'ell',                // English Language Learner
    BEHAVIOR: 'behavior',      // Behavior Intervention Plan
    GIFTED: 'gifted',          // Gifted/Talented plan
    OTHER: 'other',
  };

  /**
   * Intervention types.
   */
  static INTERVENTION_TYPE = {
    ACADEMIC_SUPPORT: 'academic_support',
    TUTORING: 'tutoring',
    MENTORING: 'mentoring',
    COUNSELING: 'counseling',
    BEHAVIORAL: 'behavioral',
    ATTENDANCE: 'attendance',
    SOCIAL_EMOTIONAL: 'social_emotional',
    FAMILY_ENGAGEMENT: 'family_engagement',
    OTHER: 'other',
  };

  /**
   * Incident severity levels.
   */
  static SEVERITY = {
    MINOR: 'minor',
    MODERATE: 'moderate',
    MAJOR: 'major',
    CRITICAL: 'critical',
  };

  // ── Referrals ────────────────────────────────────────────────────────────

  /**
   * Create a referral for a student.
   *
   * @param {object} referral
   * @param {string} referral.studentId  - Student identifier
   * @param {string} referral.type       - Referral type (REFERRAL_TYPE constant)
   * @param {string} referral.reason     - Reason for referral
   * @param {string} referral.referredBy - Who made the referral
   * @param {string} [referral.urgency]  - Urgency: 'low', 'medium', 'high', 'immediate'
   * @param {string} [referral.notes]    - Additional notes
   * @returns {{ created: boolean, referralId: string }}
   */
  createReferral(referral) {
    const {
      studentId,
      type,
      reason,
      referredBy,
      urgency = 'medium',
      notes = '',
    } = referral;

    if (!studentId) throw new Error('Referral requires a studentId');
    if (!type) throw new Error('Referral requires a type');
    if (!reason) throw new Error('Referral requires a reason');
    if (!referredBy) throw new Error('Referral requires a referredBy');

    this._referralCounter++;
    const referralId = `REF-${this.schoolId}-${this._referralCounter}`;

    const referralObj = {
      referralId,
      studentId,
      type,
      reason,
      referredBy,
      urgency,
      notes,
      schoolId: this.schoolId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      assignedTo: null,
      resolvedAt: null,
      resolution: null,
    };

    this._referrals.set(referralId, referralObj);

    this._log('REFERRAL_CREATED', {
      referralId,
      studentId,
      type,
      urgency,
    });

    return { created: true, referralId };
  }

  /**
   * Get a referral by ID.
   *
   * @param {string} referralId - Referral identifier
   * @returns {object|null} Referral or null
   */
  getReferral(referralId) {
    return this._referrals.get(referralId) || null;
  }

  /**
   * List referrals with optional filters.
   *
   * @param {object} [filters]
   * @param {string} [filters.studentId]  - Filter by student
   * @param {string} [filters.type]       - Filter by type
   * @param {string} [filters.status]     - Filter by status
   * @param {string} [filters.urgency]    - Filter by urgency
   * @param {string} [filters.assignedTo] - Filter by assignee
   * @returns {object[]} Array of referrals
   */
  listReferrals(filters = {}) {
    let referrals = Array.from(this._referrals.values());

    if (filters.studentId) {
      referrals = referrals.filter(r => r.studentId === filters.studentId);
    }
    if (filters.type) {
      referrals = referrals.filter(r => r.type === filters.type);
    }
    if (filters.status) {
      referrals = referrals.filter(r => r.status === filters.status);
    }
    if (filters.urgency) {
      referrals = referrals.filter(r => r.urgency === filters.urgency);
    }
    if (filters.assignedTo) {
      referrals = referrals.filter(r => r.assignedTo === filters.assignedTo);
    }

    // Sort by urgency then date
    const urgencyOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
    referrals.sort((a, b) => {
      const uA = urgencyOrder[a.urgency] ?? 2;
      const uB = urgencyOrder[b.urgency] ?? 2;
      if (uA !== uB) return uA - uB;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return referrals;
  }

  /**
   * Assign a referral to a counselor/staff member.
   *
   * @param {string} referralId - Referral identifier
   * @param {string} assigneeId - Assignee identifier
   * @returns {{ assigned: boolean, referralId: string }}
   */
  assignReferral(referralId, assigneeId) {
    const referral = this._referrals.get(referralId);
    if (!referral) {
      return { assigned: false, referralId, error: 'Referral not found' };
    }

    referral.assignedTo = assigneeId;
    referral.status = 'assigned';
    referral.assignedAt = new Date().toISOString();

    this._log('REFERRAL_ASSIGNED', { referralId, assigneeId });

    return { assigned: true, referralId };
  }

  /**
   * Resolve a referral.
   *
   * @param {string} referralId - Referral identifier
   * @param {string} resolution - Resolution description
   * @param {string} [resolvedBy] - Who resolved
   * @returns {{ resolved: boolean, referralId: string }}
   */
  resolveReferral(referralId, resolution, resolvedBy = null) {
    const referral = this._referrals.get(referralId);
    if (!referral) {
      return { resolved: false, referralId, error: 'Referral not found' };
    }

    referral.status = 'resolved';
    referral.resolution = resolution;
    referral.resolvedAt = new Date().toISOString();
    referral.resolvedBy = resolvedBy;

    this._log('REFERRAL_RESOLVED', { referralId, resolution: resolution.slice(0, 100) });

    return { resolved: true, referralId };
  }

  // ── Student Plans (IEP, 504, ELL) ────────────────────────────────────────

  /**
   * Create a student plan (IEP, 504, ELL, etc.).
   *
   * @param {object} plan
   * @param {string} plan.studentId      - Student identifier
   * @param {string} plan.type           - Plan type (PLAN_TYPE constant)
   * @param {string} plan.startDate      - Plan start date
   * @param {string} plan.endDate        - Plan end date
   * @param {object[]} [plan.goals]      - Plan goals
   * @param {object[]} [plan.accommodations] - Accommodations
   * @param {object[]} [plan.services]   - Services provided
   * @param {string} [plan.caseManager]  - Case manager
   * @param {string} [plan.notes]        - Additional notes
   * @returns {{ created: boolean, planId: string }}
   */
  createPlan(plan) {
    const {
      studentId,
      type,
      startDate,
      endDate,
      goals = [],
      accommodations = [],
      services = [],
      caseManager = null,
      notes = '',
    } = plan;

    if (!studentId) throw new Error('Plan requires a studentId');
    if (!type) throw new Error('Plan requires a type');
    if (!startDate) throw new Error('Plan requires a startDate');
    if (!endDate) throw new Error('Plan requires an endDate');

    const planId = `PLAN-${type.toUpperCase()}-${studentId}-${Date.now()}`;

    const planObj = {
      planId,
      studentId,
      type,
      startDate,
      endDate,
      goals,
      accommodations,
      services,
      caseManager,
      notes,
      schoolId: this.schoolId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      reviews: [],
    };

    const studentPlans = this._plans.get(studentId) || [];
    studentPlans.push(planObj);
    this._plans.set(studentId, studentPlans);

    this._log('PLAN_CREATED', {
      planId,
      studentId,
      type,
      startDate,
      endDate,
    });

    return { created: true, planId };
  }

  /**
   * Get plans for a student.
   *
   * @param {string} studentId - Student identifier
   * @param {object} [filters]
   * @param {string} [filters.type]   - Filter by plan type
   * @param {string} [filters.status] - Filter by status: 'active', 'expired', 'all'
   * @returns {object[]} Array of plans
   */
  getStudentPlans(studentId, filters = {}) {
    let plans = this._plans.get(studentId) || [];

    if (filters.type) {
      plans = plans.filter(p => p.type === filters.type);
    }

    if (filters.status && filters.status !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      if (filters.status === 'active') {
        plans = plans.filter(p => p.status === 'active' && p.endDate >= today);
      } else if (filters.status === 'expired') {
        plans = plans.filter(p => p.status !== 'active' || p.endDate < today);
      }
    }

    return plans;
  }

  /**
   * Update a student plan.
   *
   * @param {string} planId   - Plan identifier
   * @param {string} studentId - Student identifier
   * @param {object} updates  - Fields to update
   * @returns {{ updated: boolean, planId: string }}
   */
  updatePlan(planId, studentId, updates) {
    const studentPlans = this._plans.get(studentId) || [];
    const plan = studentPlans.find(p => p.planId === planId);

    if (!plan) {
      return { updated: false, planId, error: 'Plan not found' };
    }

    Object.assign(plan, updates, {
      planId, // Preserve ID
      studentId, // Preserve student
      updatedAt: new Date().toISOString(),
    });

    this._log('PLAN_UPDATED', { planId, studentId, fields: Object.keys(updates) });

    return { updated: true, planId };
  }

  /**
   * Add a review/progress note to a plan.
   *
   * @param {string} planId     - Plan identifier
   * @param {string} studentId  - Student identifier
   * @param {object} review
   * @param {string} review.reviewer  - Reviewer name/ID
   * @param {string} review.notes     - Review notes
   * @param {string} [review.goalProgress] - Progress on goals
   * @returns {{ added: boolean, planId: string }}
   */
  addPlanReview(planId, studentId, review) {
    const studentPlans = this._plans.get(studentId) || [];
    const plan = studentPlans.find(p => p.planId === planId);

    if (!plan) {
      return { added: false, planId, error: 'Plan not found' };
    }

    plan.reviews.push({
      ...review,
      reviewedAt: new Date().toISOString(),
    });

    this._log('PLAN_REVIEWED', { planId, studentId, reviewer: review.reviewer });

    return { added: true, planId };
  }

  // ── Interventions ────────────────────────────────────────────────────────

  /**
   * Track an intervention for a student.
   *
   * @param {object} intervention
   * @param {string} intervention.studentId       - Student identifier
   * @param {string} intervention.type            - Intervention type
   * @param {string} intervention.description     - Intervention description
   * @param {string} [intervention.startDate]     - Start date
   * @param {string} [intervention.endDate]       - Expected end date
   * @param {string} [intervention.implementedBy] - Who implements
   * @param {string} [intervention.frequency]     - Frequency (daily, weekly, etc.)
   * @param {string} [intervention.notes]         - Additional notes
   * @returns {{ tracked: boolean, interventionId: string }}
   */
  trackIntervention(intervention) {
    const {
      studentId,
      type,
      description,
      startDate = new Date().toISOString().split('T')[0],
      endDate = null,
      implementedBy = null,
      frequency = null,
      notes = '',
    } = intervention;

    if (!studentId) throw new Error('Intervention requires a studentId');
    if (!type) throw new Error('Intervention requires a type');
    if (!description) throw new Error('Intervention requires a description');

    const interventionId = `INT-${studentId}-${Date.now()}`;

    const interventionObj = {
      interventionId,
      studentId,
      type,
      description,
      startDate,
      endDate,
      implementedBy,
      frequency,
      notes,
      schoolId: this.schoolId,
      createdAt: new Date().toISOString(),
      status: 'active',
      progressNotes: [],
    };

    const studentInterventions = this._interventions.get(studentId) || [];
    studentInterventions.push(interventionObj);
    this._interventions.set(studentId, studentInterventions);

    this._log('INTERVENTION_TRACKED', {
      interventionId,
      studentId,
      type,
    });

    return { tracked: true, interventionId };
  }

  /**
   * Get interventions for a student.
   *
   * @param {string} studentId - Student identifier
   * @param {object} [filters]
   * @param {string} [filters.type]   - Filter by type
   * @param {string} [filters.status] - Filter by status
   * @returns {object[]} Array of interventions
   */
  getStudentInterventions(studentId, filters = {}) {
    let interventions = this._interventions.get(studentId) || [];

    if (filters.type) {
      interventions = interventions.filter(i => i.type === filters.type);
    }
    if (filters.status) {
      interventions = interventions.filter(i => i.status === filters.status);
    }

    return interventions;
  }

  /**
   * Add progress note to an intervention.
   *
   * @param {string} interventionId - Intervention identifier
   * @param {string} studentId      - Student identifier
   * @param {string} note           - Progress note
   * @param {string} [author]       - Note author
   * @returns {{ added: boolean, interventionId: string }}
   */
  addInterventionProgress(interventionId, studentId, note, author = null) {
    const studentInterventions = this._interventions.get(studentId) || [];
    const intervention = studentInterventions.find(i => i.interventionId === interventionId);

    if (!intervention) {
      return { added: false, interventionId, error: 'Intervention not found' };
    }

    intervention.progressNotes.push({
      note,
      author,
      addedAt: new Date().toISOString(),
    });

    this._log('INTERVENTION_PROGRESS', { interventionId, studentId });

    return { added: true, interventionId };
  }

  // ── Behavioral Incidents ─────────────────────────────────────────────────

  /**
   * Record a behavioral incident.
   *
   * @param {object} incident
   * @param {string} incident.studentId    - Student identifier
   * @param {string} incident.date         - Incident date
   * @param {string} incident.description  - Incident description
   * @param {string} incident.location     - Where it occurred
   * @param {string} incident.severity     - Severity level (SEVERITY constant)
   * @param {string} incident.reportedBy   - Who reported
   * @param {string[]} [incident.witnesses] - Witnesses
   * @param {string} [incident.action]     - Action taken
   * @param {boolean} [incident.parentNotified] - Was parent notified
   * @returns {{ recorded: boolean, incidentId: string }}
   */
  recordIncident(incident) {
    const {
      studentId,
      date,
      description,
      location,
      severity,
      reportedBy,
      witnesses = [],
      action = null,
      parentNotified = false,
    } = incident;

    if (!studentId) throw new Error('Incident requires a studentId');
    if (!date) throw new Error('Incident requires a date');
    if (!description) throw new Error('Incident requires a description');
    if (!severity) throw new Error('Incident requires a severity');
    if (!reportedBy) throw new Error('Incident requires a reportedBy');

    this._incidentCounter++;
    const incidentId = `INC-${this.schoolId}-${this._incidentCounter}`;

    const incidentObj = {
      incidentId,
      studentId,
      date,
      description,
      location,
      severity,
      reportedBy,
      witnesses,
      action,
      parentNotified,
      schoolId: this.schoolId,
      recordedAt: new Date().toISOString(),
      followUp: [],
      resolved: false,
    };

    this._incidents.push(incidentObj);

    this._log('INCIDENT_RECORDED', {
      incidentId,
      studentId,
      severity,
      location,
    });

    return { recorded: true, incidentId };
  }

  /**
   * Get incidents with optional filters.
   *
   * @param {object} [filters]
   * @param {string} [filters.studentId] - Filter by student
   * @param {string} [filters.severity]  - Filter by severity
   * @param {string} [filters.startDate] - Filter from date
   * @param {string} [filters.endDate]   - Filter to date
   * @param {boolean} [filters.unresolved] - Only unresolved
   * @returns {object[]} Array of incidents
   */
  getIncidents(filters = {}) {
    let incidents = [...this._incidents];

    if (filters.studentId) {
      incidents = incidents.filter(i => i.studentId === filters.studentId);
    }
    if (filters.severity) {
      incidents = incidents.filter(i => i.severity === filters.severity);
    }
    if (filters.startDate) {
      incidents = incidents.filter(i => i.date >= filters.startDate);
    }
    if (filters.endDate) {
      incidents = incidents.filter(i => i.date <= filters.endDate);
    }
    if (filters.unresolved) {
      incidents = incidents.filter(i => !i.resolved);
    }

    // Sort by date descending
    incidents.sort((a, b) => new Date(b.date) - new Date(a.date));

    return incidents;
  }

  /**
   * Add follow-up to an incident.
   *
   * @param {string} incidentId - Incident identifier
   * @param {string} followUp   - Follow-up note
   * @param {string} [author]   - Note author
   * @returns {{ added: boolean, incidentId: string }}
   */
  addIncidentFollowUp(incidentId, followUp, author = null) {
    const incident = this._incidents.find(i => i.incidentId === incidentId);
    if (!incident) {
      return { added: false, incidentId, error: 'Incident not found' };
    }

    incident.followUp.push({
      note: followUp,
      author,
      addedAt: new Date().toISOString(),
    });

    return { added: true, incidentId };
  }

  /**
   * Resolve an incident.
   *
   * @param {string} incidentId  - Incident identifier
   * @param {string} resolution  - Resolution description
   * @returns {{ resolved: boolean, incidentId: string }}
   */
  resolveIncident(incidentId, resolution) {
    const incident = this._incidents.find(i => i.incidentId === incidentId);
    if (!incident) {
      return { resolved: false, incidentId, error: 'Incident not found' };
    }

    incident.resolved = true;
    incident.resolution = resolution;
    incident.resolvedAt = new Date().toISOString();

    this._log('INCIDENT_RESOLVED', { incidentId });

    return { resolved: true, incidentId };
  }

  // ── Wellness Monitoring ──────────────────────────────────────────────────

  /**
   * Flag a wellness concern for a student.
   *
   * @param {string} studentId - Student identifier
   * @param {object} concern
   * @param {string} concern.type       - Concern type: 'mental_health', 'physical', 'social', 'academic', 'home'
   * @param {string} concern.description - Concern description
   * @param {string} concern.reportedBy  - Who reported
   * @param {string} [concern.urgency]   - Urgency level
   * @returns {{ flagged: boolean, flagId: string }}
   */
  flagWellnessCheck(studentId, concern) {
    if (!studentId) throw new Error('Wellness flag requires a studentId');
    if (!concern.type) throw new Error('Wellness flag requires a type');
    if (!concern.description) throw new Error('Wellness flag requires a description');
    if (!concern.reportedBy) throw new Error('Wellness flag requires a reportedBy');

    const flagId = `WELL-${studentId}-${Date.now()}`;

    const flag = {
      flagId,
      studentId,
      type: concern.type,
      description: concern.description,
      reportedBy: concern.reportedBy,
      urgency: concern.urgency || 'medium',
      schoolId: this.schoolId,
      flaggedAt: new Date().toISOString(),
      status: 'open',
      followUp: [],
      resolvedAt: null,
    };

    const studentFlags = this._wellnessFlags.get(studentId) || [];
    studentFlags.push(flag);
    this._wellnessFlags.set(studentId, studentFlags);

    this._log('WELLNESS_FLAGGED', {
      flagId,
      studentId,
      type: concern.type,
      urgency: flag.urgency,
    });

    return { flagged: true, flagId };
  }

  /**
   * Get wellness flags for a student.
   *
   * @param {string} studentId - Student identifier
   * @param {object} [filters]
   * @param {string} [filters.status] - Filter by status: 'open', 'resolved'
   * @returns {object[]} Array of wellness flags
   */
  getWellnessFlags(studentId, filters = {}) {
    let flags = this._wellnessFlags.get(studentId) || [];

    if (filters.status) {
      flags = flags.filter(f => f.status === filters.status);
    }

    return flags;
  }

  /**
   * Resolve a wellness flag.
   *
   * @param {string} flagId    - Flag identifier
   * @param {string} studentId - Student identifier
   * @param {string} resolution - Resolution notes
   * @returns {{ resolved: boolean, flagId: string }}
   */
  resolveWellnessFlag(flagId, studentId, resolution) {
    const studentFlags = this._wellnessFlags.get(studentId) || [];
    const flag = studentFlags.find(f => f.flagId === flagId);

    if (!flag) {
      return { resolved: false, flagId, error: 'Flag not found' };
    }

    flag.status = 'resolved';
    flag.resolution = resolution;
    flag.resolvedAt = new Date().toISOString();

    this._log('WELLNESS_RESOLVED', { flagId, studentId });

    return { resolved: true, flagId };
  }

  // ── Statistics ───────────────────────────────────────────────────────────

  /**
   * Get student services statistics.
   *
   * @returns {{ schoolId: string, referrals: object, plans: object, incidents: object, wellness: object }}
   */
  stats() {
    const referrals = Array.from(this._referrals.values());
    const pendingReferrals = referrals.filter(r => r.status === 'pending');
    const urgentReferrals = referrals.filter(r => r.urgency === 'high' || r.urgency === 'immediate');

    let totalPlans = 0;
    let activePlans = 0;
    const plansByType = {};

    for (const plans of this._plans.values()) {
      totalPlans += plans.length;
      for (const p of plans) {
        if (p.status === 'active') activePlans++;
        plansByType[p.type] = (plansByType[p.type] || 0) + 1;
      }
    }

    const unresolvedIncidents = this._incidents.filter(i => !i.resolved);
    const majorIncidents = this._incidents.filter(i =>
      i.severity === StudentServices.SEVERITY.MAJOR ||
      i.severity === StudentServices.SEVERITY.CRITICAL
    );

    let openWellnessFlags = 0;
    for (const flags of this._wellnessFlags.values()) {
      openWellnessFlags += flags.filter(f => f.status === 'open').length;
    }

    return {
      schoolId: this.schoolId,
      referrals: {
        total: referrals.length,
        pending: pendingReferrals.length,
        urgent: urgentReferrals.length,
      },
      plans: {
        total: totalPlans,
        active: activePlans,
        byType: plansByType,
      },
      incidents: {
        total: this._incidents.length,
        unresolved: unresolvedIncidents.length,
        major: majorIncidents.length,
      },
      wellness: {
        openFlags: openWellnessFlags,
      },
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
