/**
 * ACADEMIC-CALENDAR — School Calendar Management
 * ──────────────────────────────────────────────────────────────────────────────
 * Manages the school's academic calendar including:
 *   - School year calendar
 *   - Grading periods
 *   - Holidays and breaks
 *   - Testing windows
 *   - Parent-teacher conferences
 *   - Events and activities
 *
 * Theory basis:
 *   Paper XIX  — CIVITAS MERIDIANA: civic infrastructure layer
 *   Paper XX   — STIGMERGY: immutable pheromone trail (CHRONO)
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// AcademicCalendar
// ---------------------------------------------------------------------------

export class AcademicCalendar {
  /**
   * Create an academic calendar for a school.
   *
   * @param {object} options
   * @param {string} options.schoolId    - School identifier
   * @param {string} options.schoolYear  - School year (e.g., '2024-2025')
   */
  constructor({ schoolId, schoolYear }) {
    if (!schoolId) throw new Error('AcademicCalendar requires a schoolId');
    if (!schoolYear) throw new Error('AcademicCalendar requires a schoolYear');

    /** @type {string} */
    this.schoolId = schoolId;

    /** @type {string} */
    this.schoolYear = schoolYear;

    /**
     * Events storage (eventId → event object)
     * @type {Map<string, object>}
     */
    this._events = new Map();

    /**
     * Grading periods
     * @type {object[]}
     */
    this._gradingPeriods = [];

    /**
     * School year configuration
     * @type {object|null}
     */
    this._yearConfig = null;

    /** @type {object|null} */
    this._chrono = null;

    /** @type {number} */
    this._eventCounter = 0;

    /** @type {string} */
    this._createdAt = new Date().toISOString();
  }

  /**
   * Attach CHRONO for audit trail.
   * @param {object} chrono - CHRONO instance
   * @returns {AcademicCalendar}
   */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  // ── Event Types ──────────────────────────────────────────────────────────

  /**
   * Event type constants.
   */
  static EVENT_TYPE = {
    SCHOOL_DAY: 'school_day',
    HOLIDAY: 'holiday',
    BREAK: 'break',
    TESTING: 'testing',
    CONFERENCE: 'conference',
    ACTIVITY: 'activity',
    MEETING: 'meeting',
    DEADLINE: 'deadline',
    SPORTS: 'sports',
    PERFORMANCE: 'performance',
    FIELD_TRIP: 'field_trip',
    PROFESSIONAL_DEVELOPMENT: 'professional_development',
    EARLY_RELEASE: 'early_release',
    LATE_START: 'late_start',
    GRADUATION: 'graduation',
    ORIENTATION: 'orientation',
    OTHER: 'other',
  };

  // ── School Year Configuration ────────────────────────────────────────────

  /**
   * Configure the school year.
   *
   * @param {object} config
   * @param {string} config.firstDay      - First day of school
   * @param {string} config.lastDay       - Last day of school
   * @param {number} config.totalDays     - Total instructional days
   * @param {string[]} [config.weekDays]  - School days (e.g., ['Mon','Tue','Wed','Thu','Fri'])
   * @param {string} [config.startTime]   - Default start time
   * @param {string} [config.endTime]     - Default end time
   * @returns {{ configured: boolean, schoolYear: string }}
   */
  configureSchoolYear(config) {
    const {
      firstDay,
      lastDay,
      totalDays,
      weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime = '08:00',
      endTime = '15:30',
    } = config;

    if (!firstDay) throw new Error('School year requires a firstDay');
    if (!lastDay) throw new Error('School year requires a lastDay');

    this._yearConfig = {
      schoolYear: this.schoolYear,
      firstDay,
      lastDay,
      totalDays: totalDays || 180,
      weekDays,
      startTime,
      endTime,
      configuredAt: new Date().toISOString(),
    };

    this._log('SCHOOL_YEAR_CONFIGURED', {
      schoolYear: this.schoolYear,
      firstDay,
      lastDay,
      totalDays: this._yearConfig.totalDays,
    });

    return { configured: true, schoolYear: this.schoolYear };
  }

  /**
   * Get school year configuration.
   *
   * @returns {object|null} Year configuration
   */
  getSchoolYearConfig() {
    return this._yearConfig;
  }

  // ── Grading Periods ──────────────────────────────────────────────────────

  /**
   * Set grading periods for the year.
   *
   * @param {object[]} periods - Array of grading period objects
   * @param {string} periods[].periodId   - Period identifier
   * @param {string} periods[].name       - Period name (e.g., "Q1", "Semester 1")
   * @param {string} periods[].startDate  - Start date
   * @param {string} periods[].endDate    - End date
   * @param {string} [periods[].gradesDue] - Grades due date
   * @param {string} [periods[].reportCards] - Report cards date
   * @returns {{ set: boolean, periodCount: number }}
   */
  setGradingPeriods(periods) {
    if (!Array.isArray(periods)) {
      throw new Error('Grading periods must be an array');
    }

    this._gradingPeriods = periods.map(p => ({
      periodId: p.periodId,
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      gradesDue: p.gradesDue || null,
      reportCards: p.reportCards || null,
      schoolYear: this.schoolYear,
    }));

    this._log('GRADING_PERIODS_SET', {
      schoolYear: this.schoolYear,
      periodCount: periods.length,
    });

    return { set: true, periodCount: periods.length };
  }

  /**
   * Get grading periods.
   *
   * @returns {object[]} Array of grading periods
   */
  getGradingPeriods() {
    return [...this._gradingPeriods];
  }

  /**
   * Get current grading period.
   *
   * @returns {object|null} Current grading period or null
   */
  getCurrentGradingPeriod() {
    const today = new Date().toISOString().split('T')[0];

    return this._gradingPeriods.find(p =>
      p.startDate <= today && p.endDate >= today
    ) || null;
  }

  // ── Events ───────────────────────────────────────────────────────────────

  /**
   * Add an event to the calendar.
   *
   * @param {object} event
   * @param {string} [event.eventId]     - Event identifier (auto-generated if omitted)
   * @param {string} event.title         - Event title
   * @param {string} event.date          - Event date (or start date)
   * @param {string} [event.endDate]     - End date (for multi-day events)
   * @param {string} [event.startTime]   - Start time
   * @param {string} [event.endTime]     - End time
   * @param {string} [event.type]        - Event type (EVENT_TYPE constant)
   * @param {string} [event.description] - Event description
   * @param {string} [event.location]    - Event location
   * @param {string[]} [event.audience]  - Who should see this event
   * @param {string[]} [event.classroomIds] - Specific classrooms
   * @param {boolean} [event.recurring]  - Is this recurring?
   * @param {object} [event.recurrence]  - Recurrence pattern
   * @returns {{ added: boolean, eventId: string }}
   */
  addEvent(event) {
    const {
      title,
      date,
      endDate = null,
      startTime = null,
      endTime = null,
      type = AcademicCalendar.EVENT_TYPE.OTHER,
      description = '',
      location = '',
      audience = ['all'],
      classroomIds = [],
      recurring = false,
      recurrence = null,
    } = event;

    if (!title) throw new Error('Event requires a title');
    if (!date) throw new Error('Event requires a date');

    this._eventCounter++;
    const eventId = event.eventId || `EVT-${this.schoolId}-${this._eventCounter}`;

    const eventObj = {
      eventId,
      title,
      date,
      endDate,
      startTime,
      endTime,
      type,
      description,
      location,
      audience,
      classroomIds,
      recurring,
      recurrence,
      schoolId: this.schoolId,
      schoolYear: this.schoolYear,
      createdAt: new Date().toISOString(),
      cancelled: false,
    };

    this._events.set(eventId, eventObj);

    this._log('EVENT_ADDED', { eventId, title, date, type });

    return { added: true, eventId };
  }

  /**
   * Get an event by ID.
   *
   * @param {string} eventId - Event identifier
   * @returns {object|null} Event or null
   */
  getEvent(eventId) {
    return this._events.get(eventId) || null;
  }

  /**
   * Get events with optional filters.
   *
   * @param {object} [filters]
   * @param {string} [filters.startDate] - Start of date range
   * @param {string} [filters.endDate]   - End of date range
   * @param {string} [filters.type]      - Event type
   * @param {string} [filters.classroomId] - Specific classroom
   * @param {boolean} [filters.includeCancelled] - Include cancelled events
   * @returns {object[]} Array of events
   */
  getEvents(filters = {}) {
    let events = Array.from(this._events.values());

    if (!filters.includeCancelled) {
      events = events.filter(e => !e.cancelled);
    }
    if (filters.startDate) {
      events = events.filter(e => e.date >= filters.startDate || (e.endDate && e.endDate >= filters.startDate));
    }
    if (filters.endDate) {
      events = events.filter(e => e.date <= filters.endDate);
    }
    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }
    if (filters.classroomId) {
      events = events.filter(e =>
        e.classroomIds.length === 0 || e.classroomIds.includes(filters.classroomId)
      );
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    return events;
  }

  /**
   * Update an event.
   *
   * @param {string} eventId - Event identifier
   * @param {object} updates - Fields to update
   * @returns {{ updated: boolean, eventId: string }}
   */
  updateEvent(eventId, updates) {
    const event = this._events.get(eventId);
    if (!event) {
      return { updated: false, eventId, error: 'Event not found' };
    }

    const updatedEvent = {
      ...event,
      ...updates,
      eventId, // Preserve ID
      updatedAt: new Date().toISOString(),
    };

    this._events.set(eventId, updatedEvent);

    this._log('EVENT_UPDATED', { eventId, fields: Object.keys(updates) });

    return { updated: true, eventId };
  }

  /**
   * Cancel an event.
   *
   * @param {string} eventId - Event identifier
   * @param {string} [reason] - Cancellation reason
   * @returns {{ cancelled: boolean, eventId: string }}
   */
  cancelEvent(eventId, reason = '') {
    const event = this._events.get(eventId);
    if (!event) {
      return { cancelled: false, eventId, error: 'Event not found' };
    }

    event.cancelled = true;
    event.cancelledAt = new Date().toISOString();
    event.cancellationReason = reason;

    this._log('EVENT_CANCELLED', { eventId, reason });

    return { cancelled: true, eventId };
  }

  /**
   * Delete an event.
   *
   * @param {string} eventId - Event identifier
   * @returns {{ deleted: boolean, eventId: string }}
   */
  deleteEvent(eventId) {
    const existed = this._events.delete(eventId);
    
    if (existed) {
      this._log('EVENT_DELETED', { eventId });
    }

    return { deleted: existed, eventId };
  }

  // ── Quick Add Methods ────────────────────────────────────────────────────

  /**
   * Add a holiday.
   *
   * @param {string} name  - Holiday name
   * @param {string} date  - Holiday date
   * @param {string} [endDate] - End date (for multi-day holidays)
   * @returns {{ added: boolean, eventId: string }}
   */
  addHoliday(name, date, endDate = null) {
    return this.addEvent({
      title: name,
      date,
      endDate,
      type: AcademicCalendar.EVENT_TYPE.HOLIDAY,
      audience: ['all'],
    });
  }

  /**
   * Add a break (spring break, winter break, etc.).
   *
   * @param {string} name      - Break name
   * @param {string} startDate - Break start
   * @param {string} endDate   - Break end
   * @returns {{ added: boolean, eventId: string }}
   */
  addBreak(name, startDate, endDate) {
    return this.addEvent({
      title: name,
      date: startDate,
      endDate,
      type: AcademicCalendar.EVENT_TYPE.BREAK,
      audience: ['all'],
    });
  }

  /**
   * Add a testing window.
   *
   * @param {string} name       - Test name (e.g., "STAAR Testing")
   * @param {string} startDate  - Testing start
   * @param {string} endDate    - Testing end
   * @param {string} [description] - Additional details
   * @returns {{ added: boolean, eventId: string }}
   */
  addTestingWindow(name, startDate, endDate, description = '') {
    return this.addEvent({
      title: name,
      date: startDate,
      endDate,
      type: AcademicCalendar.EVENT_TYPE.TESTING,
      description,
      audience: ['all'],
    });
  }

  /**
   * Add a parent-teacher conference day.
   *
   * @param {string} date      - Conference date
   * @param {string} startTime - Start time
   * @param {string} endTime   - End time
   * @param {string} [location] - Location
   * @returns {{ added: boolean, eventId: string }}
   */
  addConference(date, startTime, endTime, location = '') {
    return this.addEvent({
      title: 'Parent-Teacher Conferences',
      date,
      startTime,
      endTime,
      type: AcademicCalendar.EVENT_TYPE.CONFERENCE,
      location,
      audience: ['parents', 'teachers'],
    });
  }

  // ── Calendar Views ───────────────────────────────────────────────────────

  /**
   * Get calendar for a specific month.
   *
   * @param {number} year  - Year
   * @param {number} month - Month (1-12)
   * @returns {{ year: number, month: number, events: object[], holidays: object[], days: object[] }}
   */
  getMonthView(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const events = this.getEvents({ startDate, endDate });
    const holidays = events.filter(e => e.type === AcademicCalendar.EVENT_TYPE.HOLIDAY);

    // Build day-by-day view
    const days = [];
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter(e =>
        e.date === dateStr || (e.date <= dateStr && e.endDate && e.endDate >= dateStr)
      );

      days.push({
        date: dateStr,
        dayOfMonth: d,
        dayOfWeek: new Date(year, month - 1, d).toLocaleDateString('en-US', { weekday: 'short' }),
        events: dayEvents,
        isHoliday: dayEvents.some(e => e.type === AcademicCalendar.EVENT_TYPE.HOLIDAY),
        isBreak: dayEvents.some(e => e.type === AcademicCalendar.EVENT_TYPE.BREAK),
      });
    }

    return { year, month, events, holidays, days };
  }

  /**
   * Get upcoming events.
   *
   * @param {number} [days=7] - Number of days to look ahead
   * @returns {object[]} Array of upcoming events
   */
  getUpcoming(days = 7) {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const endDate = future.toISOString().split('T')[0];

    return this.getEvents({ startDate, endDate });
  }

  /**
   * Get today's events.
   *
   * @returns {object[]} Today's events
   */
  getToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.getEvents({ startDate: today, endDate: today });
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  /**
   * Get calendar statistics.
   *
   * @returns {{ schoolId: string, schoolYear: string, totalEvents: number, byType: object, gradingPeriods: number }}
   */
  stats() {
    const events = Array.from(this._events.values()).filter(e => !e.cancelled);

    const byType = {};
    for (const e of events) {
      byType[e.type] = (byType[e.type] || 0) + 1;
    }

    return {
      schoolId: this.schoolId,
      schoolYear: this.schoolYear,
      totalEvents: events.length,
      byType,
      gradingPeriods: this._gradingPeriods.length,
      configured: this._yearConfig !== null,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /** @private */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({
        type,
        schoolId: this.schoolId,
        schoolYear: this.schoolYear,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
