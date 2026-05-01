/**
 * ANNOUNCEMENT-BOARD — School News & Communications
 * ──────────────────────────────────────────────────────────────────────────────
 * Manages school-wide and classroom-specific communications:
 *   - School-wide announcements
 *   - Per-classroom announcements
 *   - Emergency alerts
 *   - Parent notification hooks
 *   - Event calendar integration
 *   - Newsletter generation
 *
 * Theory basis:
 *   Paper XIX  — CIVITAS MERIDIANA: civic infrastructure layer
 *   Paper XX   — STIGMERGY: immutable pheromone trail (CHRONO)
 *   Paper IV   — DOCTRINA VOXIS: sovereign compute unit
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// AnnouncementBoard
// ---------------------------------------------------------------------------

export class AnnouncementBoard {
  /**
   * Create an announcement board for a school.
   *
   * @param {object} options
   * @param {string} options.schoolId   - School identifier
   * @param {string} options.schoolName - School name (for newsletters)
   */
  constructor({ schoolId, schoolName }) {
    if (!schoolId) throw new Error('AnnouncementBoard requires a schoolId');

    /** @type {string} */
    this.schoolId = schoolId;

    /** @type {string} */
    this.schoolName = schoolName || schoolId;

    /**
     * Announcements storage (announcementId → announcement object)
     * @type {Map<string, object>}
     */
    this._announcements = new Map();

    /**
     * Emergency alerts (active)
     * @type {object[]}
     */
    this._emergencyAlerts = [];

    /**
     * Newsletter templates
     * @type {Map<string, object>}
     */
    this._newsletters = new Map();

    /**
     * Parent notification hooks (webhooks, etc.)
     * @type {Map<string, object>}
     */
    this._parentHooks = new Map();

    /** @type {object|null} */
    this._chrono = null;

    /** @type {number} */
    this._announcementCounter = 0;

    /** @type {string} */
    this._createdAt = new Date().toISOString();
  }

  /**
   * Attach CHRONO for audit trail.
   * @param {object} chrono - CHRONO instance
   * @returns {AnnouncementBoard}
   */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  // ── Announcements ────────────────────────────────────────────────────────

  /**
   * Priority levels for announcements.
   */
  static PRIORITY = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
    EMERGENCY: 'emergency',
  };

  /**
   * Audience types for announcements.
   */
  static AUDIENCE = {
    ALL: 'all',
    STUDENTS: 'students',
    TEACHERS: 'teachers',
    PARENTS: 'parents',
    STAFF: 'staff',
    CLASSROOM: 'classroom',
  };

  /**
   * Post a new announcement.
   *
   * @param {object} announcement
   * @param {string} announcement.title       - Announcement title
   * @param {string} announcement.content     - Announcement content
   * @param {string} [announcement.audience]  - Target audience (AUDIENCE constant)
   * @param {string} [announcement.priority]  - Priority level (PRIORITY constant)
   * @param {string} [announcement.classroomId] - If audience is 'classroom', specify which
   * @param {string} [announcement.authorId]  - Author identifier
   * @param {string} [announcement.authorName] - Author name
   * @param {string} [announcement.expiresAt] - Expiration date (ISO string)
   * @param {string[]} [announcement.tags]    - Tags for categorization
   * @returns {{ posted: boolean, announcementId: string, timestamp: string }}
   */
  post(announcement) {
    const {
      title,
      content,
      audience = AnnouncementBoard.AUDIENCE.ALL,
      priority = AnnouncementBoard.PRIORITY.NORMAL,
      classroomId = null,
      authorId = null,
      authorName = null,
      expiresAt = null,
      tags = [],
    } = announcement;

    if (!title) throw new Error('Announcement requires a title');
    if (!content) throw new Error('Announcement requires content');

    this._announcementCounter++;
    const announcementId = `ANN-${this.schoolId}-${this._announcementCounter}`;
    const now = new Date().toISOString();

    const announcementObj = {
      announcementId,
      title,
      content,
      audience,
      priority,
      classroomId,
      authorId,
      authorName,
      expiresAt,
      tags,
      schoolId: this.schoolId,
      postedAt: now,
      read: new Set(), // Track who has read it
      archived: false,
    };

    this._announcements.set(announcementId, announcementObj);

    this._log('ANNOUNCEMENT_POSTED', {
      announcementId,
      title,
      audience,
      priority,
      classroomId,
    });

    // Trigger parent hooks if appropriate
    if (audience === AnnouncementBoard.AUDIENCE.ALL ||
        audience === AnnouncementBoard.AUDIENCE.PARENTS) {
      this._triggerParentHooks(announcementObj);
    }

    return { posted: true, announcementId, timestamp: now };
  }

  /**
   * Get an announcement by ID.
   *
   * @param {string} announcementId - Announcement identifier
   * @returns {object|null} Announcement or null
   */
  get(announcementId) {
    const announcement = this._announcements.get(announcementId);
    if (!announcement) return null;

    return {
      ...announcement,
      read: Array.from(announcement.read),
    };
  }

  /**
   * List announcements with optional filters.
   *
   * @param {object} [filters]
   * @param {string} [filters.audience]     - Filter by audience
   * @param {string} [filters.priority]     - Filter by priority
   * @param {string} [filters.classroomId]  - Filter by classroom
   * @param {boolean} [filters.active]      - Only active (not expired, not archived)
   * @param {string[]} [filters.tags]       - Filter by tags (any match)
   * @param {number} [filters.limit]        - Limit results
   * @returns {object[]} Array of announcements
   */
  list(filters = {}) {
    const now = new Date().toISOString();
    let announcements = Array.from(this._announcements.values());

    if (filters.audience) {
      announcements = announcements.filter(a =>
        a.audience === filters.audience || a.audience === AnnouncementBoard.AUDIENCE.ALL
      );
    }
    if (filters.priority) {
      announcements = announcements.filter(a => a.priority === filters.priority);
    }
    if (filters.classroomId) {
      announcements = announcements.filter(a =>
        a.classroomId === filters.classroomId || a.audience !== AnnouncementBoard.AUDIENCE.CLASSROOM
      );
    }
    if (filters.active) {
      announcements = announcements.filter(a =>
        !a.archived && (!a.expiresAt || a.expiresAt > now)
      );
    }
    if (filters.tags && filters.tags.length > 0) {
      announcements = announcements.filter(a =>
        a.tags.some(t => filters.tags.includes(t))
      );
    }

    // Sort by date (newest first) then by priority
    announcements.sort((a, b) => {
      const priorityOrder = { emergency: 0, urgent: 1, high: 2, normal: 3, low: 4 };
      const pA = priorityOrder[a.priority] ?? 3;
      const pB = priorityOrder[b.priority] ?? 3;
      if (pA !== pB) return pA - pB;
      return new Date(b.postedAt) - new Date(a.postedAt);
    });

    if (filters.limit) {
      announcements = announcements.slice(0, filters.limit);
    }

    return announcements.map(a => ({
      ...a,
      read: Array.from(a.read),
    }));
  }

  /**
   * Mark an announcement as read by a user.
   *
   * @param {string} announcementId - Announcement identifier
   * @param {string} userId         - User identifier
   * @returns {{ marked: boolean, announcementId: string }}
   */
  markRead(announcementId, userId) {
    const announcement = this._announcements.get(announcementId);
    if (!announcement) {
      return { marked: false, announcementId, error: 'Announcement not found' };
    }

    announcement.read.add(userId);
    return { marked: true, announcementId };
  }

  /**
   * Archive an announcement.
   *
   * @param {string} announcementId - Announcement identifier
   * @returns {{ archived: boolean, announcementId: string }}
   */
  archive(announcementId) {
    const announcement = this._announcements.get(announcementId);
    if (!announcement) {
      return { archived: false, announcementId, error: 'Announcement not found' };
    }

    announcement.archived = true;
    this._log('ANNOUNCEMENT_ARCHIVED', { announcementId });

    return { archived: true, announcementId };
  }

  /**
   * Delete an announcement.
   *
   * @param {string} announcementId - Announcement identifier
   * @returns {{ deleted: boolean, announcementId: string }}
   */
  delete(announcementId) {
    const existed = this._announcements.delete(announcementId);
    
    if (existed) {
      this._log('ANNOUNCEMENT_DELETED', { announcementId });
    }

    return { deleted: existed, announcementId };
  }

  // ── Emergency Alerts ─────────────────────────────────────────────────────

  /**
   * Post an emergency alert (highest priority, immediate distribution).
   *
   * @param {string} content    - Alert content
   * @param {object} [options]
   * @param {string} [options.type] - Alert type (lockdown, evacuation, weather, etc.)
   * @param {string} [options.authorId] - Author identifier
   * @returns {{ alerted: boolean, alertId: string, timestamp: string }}
   */
  postEmergencyAlert(content, options = {}) {
    if (!content) throw new Error('Emergency alert requires content');

    const alertId = `EMRG-${this.schoolId}-${Date.now()}`;
    const now = new Date().toISOString();

    const alert = {
      alertId,
      content,
      type: options.type || 'general',
      authorId: options.authorId || null,
      schoolId: this.schoolId,
      postedAt: now,
      active: true,
      acknowledged: new Set(),
    };

    this._emergencyAlerts.push(alert);

    // Also create an announcement
    this.post({
      title: `🚨 EMERGENCY: ${options.type || 'Alert'}`,
      content,
      audience: AnnouncementBoard.AUDIENCE.ALL,
      priority: AnnouncementBoard.PRIORITY.EMERGENCY,
      authorId: options.authorId,
      tags: ['emergency', options.type || 'alert'],
    });

    this._log('EMERGENCY_ALERT', {
      alertId,
      type: options.type || 'general',
      content: content.slice(0, 100),
    });

    // Trigger all parent hooks immediately
    this._triggerEmergencyHooks(alert);

    return { alerted: true, alertId, timestamp: now };
  }

  /**
   * Get active emergency alerts.
   *
   * @returns {object[]} Array of active alerts
   */
  getActiveAlerts() {
    return this._emergencyAlerts
      .filter(a => a.active)
      .map(a => ({
        ...a,
        acknowledged: Array.from(a.acknowledged),
      }));
  }

  /**
   * Acknowledge an emergency alert.
   *
   * @param {string} alertId - Alert identifier
   * @param {string} userId  - User acknowledging
   * @returns {{ acknowledged: boolean, alertId: string }}
   */
  acknowledgeAlert(alertId, userId) {
    const alert = this._emergencyAlerts.find(a => a.alertId === alertId);
    if (!alert) {
      return { acknowledged: false, alertId, error: 'Alert not found' };
    }

    alert.acknowledged.add(userId);
    return { acknowledged: true, alertId };
  }

  /**
   * Clear an emergency alert (mark as inactive).
   *
   * @param {string} alertId   - Alert identifier
   * @param {string} clearedBy - Who cleared it
   * @returns {{ cleared: boolean, alertId: string }}
   */
  clearAlert(alertId, clearedBy) {
    const alert = this._emergencyAlerts.find(a => a.alertId === alertId);
    if (!alert) {
      return { cleared: false, alertId, error: 'Alert not found' };
    }

    alert.active = false;
    alert.clearedAt = new Date().toISOString();
    alert.clearedBy = clearedBy;

    this._log('EMERGENCY_CLEARED', { alertId, clearedBy });

    return { cleared: true, alertId };
  }

  // ── Parent Notification Hooks ────────────────────────────────────────────

  /**
   * Register a parent notification hook (webhook, SMS gateway, etc.).
   *
   * @param {object} hook
   * @param {string} hook.hookId   - Hook identifier
   * @param {string} hook.type     - Hook type: 'webhook', 'sms', 'email', 'push'
   * @param {string} hook.endpoint - Hook endpoint/URL
   * @param {string[]} [hook.events] - Events to trigger on: 'announcement', 'emergency', 'all'
   * @returns {{ registered: boolean, hookId: string }}
   */
  registerParentHook(hook) {
    const { hookId, type, endpoint, events = ['all'] } = hook;

    if (!hookId) throw new Error('Hook requires a hookId');
    if (!type) throw new Error('Hook requires a type');
    if (!endpoint) throw new Error('Hook requires an endpoint');

    this._parentHooks.set(hookId, {
      hookId,
      type,
      endpoint,
      events,
      registeredAt: new Date().toISOString(),
      active: true,
    });

    this._log('PARENT_HOOK_REGISTERED', { hookId, type });

    return { registered: true, hookId };
  }

  /**
   * Unregister a parent hook.
   *
   * @param {string} hookId - Hook identifier
   * @returns {{ unregistered: boolean, hookId: string }}
   */
  unregisterParentHook(hookId) {
    const existed = this._parentHooks.delete(hookId);
    return { unregistered: existed, hookId };
  }

  /**
   * List registered parent hooks.
   *
   * @returns {object[]} Array of hooks
   */
  listParentHooks() {
    return Array.from(this._parentHooks.values());
  }

  // ── Newsletter Generation ────────────────────────────────────────────────

  /**
   * Generate a newsletter for a period.
   *
   * @param {string} period      - Period identifier (e.g., '2024-W01', '2024-01')
   * @param {object} [options]
   * @param {string} [options.startDate] - Start date for announcements
   * @param {string} [options.endDate]   - End date for announcements
   * @param {object} [options.calendar]  - AcademicCalendar instance for events
   * @returns {{ newsletter: object }}
   */
  generateNewsletter(period, options = {}) {
    const { startDate, endDate, calendar } = options;

    // Get announcements for the period
    let announcements = Array.from(this._announcements.values())
      .filter(a => !a.archived && a.priority !== AnnouncementBoard.PRIORITY.EMERGENCY);

    if (startDate && endDate) {
      announcements = announcements.filter(a =>
        a.postedAt >= startDate && a.postedAt <= endDate
      );
    }

    // Get upcoming events from calendar if provided
    let upcomingEvents = [];
    if (calendar && typeof calendar.getEvents === 'function') {
      upcomingEvents = calendar.getEvents({ startDate, endDate }) || [];
    }

    const newsletter = {
      period,
      schoolId: this.schoolId,
      schoolName: this.schoolName,
      generatedAt: new Date().toISOString(),
      sections: {
        header: {
          title: `${this.schoolName} Newsletter - ${period}`,
          subtitle: 'Keeping Our Community Informed',
        },
        announcements: announcements.map(a => ({
          title: a.title,
          content: a.content,
          postedAt: a.postedAt,
          tags: a.tags,
        })),
        upcomingEvents: upcomingEvents.map(e => ({
          title: e.title,
          date: e.date,
          type: e.type,
          description: e.description,
        })),
        footer: {
          schoolName: this.schoolName,
          contact: 'Contact your school office for more information.',
        },
      },
      stats: {
        announcementCount: announcements.length,
        eventCount: upcomingEvents.length,
      },
    };

    this._newsletters.set(period, newsletter);

    this._log('NEWSLETTER_GENERATED', { period, announcementCount: announcements.length });

    return { newsletter };
  }

  /**
   * Get a previously generated newsletter.
   *
   * @param {string} period - Period identifier
   * @returns {object|null} Newsletter or null
   */
  getNewsletter(period) {
    return this._newsletters.get(period) || null;
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  /**
   * Get announcement board statistics.
   *
   * @returns {{ schoolId: string, totalAnnouncements: number, activeAnnouncements: number, emergencyAlerts: number, parentHooks: number }}
   */
  stats() {
    const now = new Date().toISOString();
    const announcements = Array.from(this._announcements.values());
    const active = announcements.filter(a => !a.archived && (!a.expiresAt || a.expiresAt > now));

    return {
      schoolId: this.schoolId,
      totalAnnouncements: announcements.length,
      activeAnnouncements: active.length,
      emergencyAlerts: this._emergencyAlerts.filter(a => a.active).length,
      parentHooks: this._parentHooks.size,
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

  /** @private */
  _triggerParentHooks(announcement) {
    for (const hook of this._parentHooks.values()) {
      if (!hook.active) continue;
      if (hook.events.includes('all') || hook.events.includes('announcement')) {
        // In production, this would make HTTP calls, send SMS, etc.
        this._log('PARENT_HOOK_TRIGGERED', {
          hookId: hook.hookId,
          type: hook.type,
          event: 'announcement',
          announcementId: announcement.announcementId,
        });
      }
    }
  }

  /** @private */
  _triggerEmergencyHooks(alert) {
    for (const hook of this._parentHooks.values()) {
      if (!hook.active) continue;
      if (hook.events.includes('all') || hook.events.includes('emergency')) {
        this._log('EMERGENCY_HOOK_TRIGGERED', {
          hookId: hook.hookId,
          type: hook.type,
          alertId: alert.alertId,
        });
      }
    }
  }
}
