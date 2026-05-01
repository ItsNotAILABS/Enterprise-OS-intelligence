/**
 * @medina/student-ai — v3.0.0
 * ══════════════════════════════════════════════════════════════════════════════
 * STUDENT LIFE OPERATING SYSTEM — POWERED BY MERIDIAN INTELLIGENCE
 * 
 * This is not just a planner. This is an INTELLIGENT operating system for a 
 * student's entire life — powered by MERIDIAN's AI engines.
 *
 * MERIDIAN Integration:
 *   - CHRONO: Every action is logged. Full audit trail. Portfolio ready.
 *   - CEREBEX: AI categorizes, predicts, and models the student's world
 *   - NEXORIS: Routes requests to the right handler (tutoring, counselor, parent)
 *   - COGNOVEX: Quorum decisions (is this student at risk? escalate?)
 *   - HDI: Natural language interface ("Help me study for my test")
 *
 * Connected To:
 *   - BronzeCanister: StudentAI is the BRAIN inside the student's canister
 *   - SilverCanister: School pushes schedules, students pull assignments
 *
 * Version: 3.0.0
 * Author: Alfredo Medina Hernandez · Medina Tech · Dallas, Texas
 * ══════════════════════════════════════════════════════════════════════════════
 */

import {
  CHRONO,
  CEREBEX,
  CATEGORIES,
  NEXORIS,
  PHI,
  PHI_INV,
  CognovexNetwork,
  HDI,
  bootstrapMeridian,
} from '../../meridian-sovereign-os/src/index.js';

// ══════════════════════════════════════════════════════════════════════════════
// THE STUDENT AI CLASS — v3.0.0 WITH MERIDIAN INTELLIGENCE
// ══════════════════════════════════════════════════════════════════════════════

export class StudentAI {
  /**
   * Create a new StudentAI instance for a student.
   * 
   * @param {object} options
   * @param {string} options.studentId - Unique identifier for the student
   * @param {string} options.studentName - Student's display name
   * @param {number} options.grade - Current grade level (K=0, 1-12)
   * @param {string} options.schoolId - School identifier
   * @param {string} [options.timezone='America/Chicago'] - Student's timezone
   * @param {object} [options.silverCanister] - Reference to school's SilverCanister
   */
  constructor({ studentId, studentName, grade, schoolId, timezone = 'America/Chicago', silverCanister = null }) {
    if (!studentId) throw new Error('StudentAI requires a studentId');
    if (!studentName) throw new Error('StudentAI requires a studentName');
    if (grade === undefined) throw new Error('StudentAI requires a grade level');
    if (!schoolId) throw new Error('StudentAI requires a schoolId');

    this.studentId = studentId;
    this.studentName = studentName;
    this.grade = grade;
    this.schoolId = schoolId;
    this.timezone = timezone;
    this.createdAt = new Date().toISOString();
    this._silverCanister = silverCanister;

    // ═══════════════════════════════════════════════════════════════════════
    // MERIDIAN INTELLIGENCE ENGINES
    // ═══════════════════════════════════════════════════════════════════════
    
    const meridian = bootstrapMeridian({
      agentId: `STUDENT_${studentId}`,
      cognovexUnits: 4, // ACADEMIC, WELLNESS, SOCIAL, COLLEGE domains
    });

    this._chrono = meridian.chrono;      // Immutable audit trail
    this._cerebex = meridian.cerebex;    // World model & categorization
    this._nexoris = meridian.nexoris;    // Routing & pheromone field
    this._cognovex = meridian.cognovex;  // Quorum decisions
    this._hdi = meridian.hdi;            // Natural language interface
    this._voxis = meridian.voxis;        // Sovereign compute

    // Configure COGNOVEX units for student domains
    this._cognovex.addUnit('cvx-academic', 'ACADEMIC');
    this._cognovex.addUnit('cvx-wellness', 'WELLNESS');
    this._cognovex.addUnit('cvx-social', 'SOCIAL');
    this._cognovex.addUnit('cvx-college', 'COLLEGE_PREP');

    // Log creation
    this._log('STUDENT_CREATED', {
      studentId,
      studentName,
      grade,
      schoolId,
      timezone,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // DATA STORES
    // ═══════════════════════════════════════════════════════════════════════

    // Schedule & Classes
    this._classes = new Map();
    this._schedule = [];
    this._bellSchedule = [];

    // Assignments & Homework
    this._assignments = new Map();
    this._submissions = new Map();

    // Notes & Materials
    this._notes = new Map();
    this._syllabi = new Map();

    // Grades & Progress
    this._grades = new Map();
    this._gpa = { current: 0, cumulative: 0, history: [] };

    // Goals & Planning
    this._goals = [];
    this._collegeList = [];
    this._scholarships = [];
    this._extracurriculars = [];

    // Study & Time Management
    this._studySessions = [];
    this._streaks = { current: 0, longest: 0, lastDate: null };

    // Social & Collaboration
    this._studyGroups = [];
    this._projectTeams = new Map();
    this._tutoringSessions = [];

    // School Life
    this._announcements = [];
    this._events = [];
    this._clubs = [];
    this._sports = [];

    // Transportation
    this._transportation = { type: null, busRoute: null, busStop: null, pickupTime: null, dropoffTime: null };

    // Parent Connection
    this._parentAlerts = [];
    this._progressReports = [];

    // Wellness
    this._wellnessCheckins = [];
    this._sleepLog = [];

    // Future Planning
    this._collegeApps = new Map();
    this._testScores = [];
    this._resume = null;

    // AI Analysis Cache
    this._aiInsights = {
      riskLevel: 'normal',      // COGNOVEX assessment
      predictedGrades: {},       // CEREBEX predictions
      recommendedActions: [],    // NEXORIS routing
      lastAnalysis: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧠 MERIDIAN INTELLIGENCE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Log an action to CHRONO (immutable audit trail).
   * Every student action is tracked for portfolio, parent review, and compliance.
   */
  _log(type, data) {
    this._chrono.append({
      type,
      studentId: this.studentId,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Categorize something using CEREBEX (AI world model).
   * @param {string} text - Text to categorize
   * @param {string} context - Context hint (e.g., 'assignment', 'goal', 'event')
   */
  _categorize(text, context = 'general') {
    const result = this._cerebex.categorize(text, context);
    return result;
  }

  /**
   * Route a request using NEXORIS (pheromone field routing).
   * Determines where a request should go: tutoring, counselor, parent, etc.
   */
  _route(request) {
    // NEXORIS pheromone routing - finds the best handler
    const signal = this._nexoris.emit(request.type, request.data);
    return signal;
  }

  /**
   * Make a decision using COGNOVEX (quorum consensus).
   * For important decisions like "is this student at risk?"
   */
  _decide(question, evidence) {
    const decision = this._cognovex.propose(question, evidence);
    this._log('COGNOVEX_DECISION', { question, evidence, decision });
    return decision;
  }

  /**
   * Talk to the student AI using natural language (HDI interface).
   * @param {string} input - What the student says
   * @returns {object} Response with action taken
   */
  async speak(input) {
    this._log('STUDENT_SPOKE', { input });

    // CEREBEX categorizes the intent
    const intent = this._categorize(input, 'student_request');

    // Route to the right handler
    const handlers = {
      'homework': () => this._handleHomeworkHelp(input),
      'schedule': () => this._handleScheduleQuery(input),
      'grade': () => this._handleGradeQuery(input),
      'study': () => this._handleStudyRequest(input),
      'wellness': () => this._handleWellnessQuery(input),
      'college': () => this._handleCollegeQuery(input),
      'social': () => this._handleSocialQuery(input),
      'general': () => this._handleGeneralQuery(input),
    };

    const handler = handlers[intent.primaryCategory] || handlers['general'];
    const response = await handler();

    this._log('AI_RESPONSE', { input, intent, response });
    return response;
  }

  // AI Request Handlers
  async _handleHomeworkHelp(input) {
    const dueToday = this.getDueToday();
    const overdue = this.getOverdue();
    return {
      type: 'homework_help',
      message: `I see you have ${dueToday.length} items due today and ${overdue.length} overdue. Let me help you prioritize.`,
      dueToday,
      overdue,
      suggestedAction: overdue.length > 0 ? 'Start with overdue items' : 'Work on today\'s assignments',
    };
  }

  async _handleScheduleQuery(input) {
    const schedule = this.getTodaySchedule();
    return {
      type: 'schedule',
      message: `Here's your schedule for today:`,
      schedule,
    };
  }

  async _handleGradeQuery(input) {
    const gpa = this.calculateGPA();
    return {
      type: 'grades',
      message: `Your current GPA is ${gpa.gpa}`,
      gpa,
      breakdown: gpa.breakdown,
    };
  }

  async _handleStudyRequest(input) {
    const session = this.startStudySession({ subject: 'general', goal: input });
    return {
      type: 'study_session',
      message: 'Study session started! I\'ll help you stay focused.',
      session,
    };
  }

  async _handleWellnessQuery(input) {
    const history = this.getWellnessHistory({ days: 7 });
    return {
      type: 'wellness',
      message: 'How are you feeling today?',
      recentCheckins: history,
    };
  }

  async _handleCollegeQuery(input) {
    const colleges = this.getCollegeList();
    const scholarships = this.getScholarships();
    return {
      type: 'college',
      message: `You're tracking ${colleges.length} colleges and ${scholarships.length} scholarships.`,
      colleges,
      scholarships,
    };
  }

  async _handleSocialQuery(input) {
    const groups = this.getStudyGroups();
    return {
      type: 'social',
      message: `You're in ${groups.length} study groups.`,
      studyGroups: groups,
    };
  }

  async _handleGeneralQuery(input) {
    const briefing = this.getMorningBriefing();
    return {
      type: 'general',
      message: briefing.greeting,
      briefing,
    };
  }

  /**
   * AI Analysis: Analyze the student's current state.
   * Uses CEREBEX for predictions, COGNOVEX for risk assessment.
   */
  analyzeStudent() {
    this._log('AI_ANALYSIS_START', {});

    // Gather evidence
    const overdue = this.getOverdue();
    const gpaData = this.calculateGPA();
    const studyStats = this.getStudyStats({ period: 'week' });
    const wellnessData = this.getWellnessHistory({ days: 7 });
    const sleepData = this.getSleepStats({ days: 7 });

    // CEREBEX: Predict grades based on study patterns
    const predictions = this._cerebex.categorize(JSON.stringify({
      currentGPA: gpaData.gpa,
      studyHours: studyStats.totalHours,
      overdueCount: overdue.length,
    }), 'grade_prediction');

    // COGNOVEX: Risk assessment quorum
    const evidence = {
      overdueCount: overdue.length,
      gpa: gpaData.gpa,
      studyHoursWeek: studyStats.totalHours,
      avgSleep: sleepData.avgHours,
      avgWellness: wellnessData.length > 0 
        ? wellnessData.reduce((s, w) => s + w.mood, 0) / wellnessData.length 
        : 3,
      streak: this._streaks.current,
    };

    const riskDecision = this._decide('Is this student at academic risk?', evidence);

    // NEXORIS: Route recommendations based on risk
    const recommendations = [];
    
    if (overdue.length > 3) {
      recommendations.push({
        action: 'REQUEST_TUTORING',
        priority: 'high',
        reason: `${overdue.length} overdue assignments`,
      });
      this._route({ type: 'TUTORING_NEEDED', data: { studentId: this.studentId, overdue } });
    }

    if (gpaData.gpa !== null && gpaData.gpa < 2.0) {
      recommendations.push({
        action: 'PARENT_ALERT',
        priority: 'high',
        reason: `GPA below 2.0 (${gpaData.gpa})`,
      });
      this._route({ type: 'PARENT_ALERT', data: { studentId: this.studentId, gpa: gpaData.gpa } });
    }

    if (sleepData.avgHours && sleepData.avgHours < 6) {
      recommendations.push({
        action: 'WELLNESS_CHECK',
        priority: 'medium',
        reason: `Averaging ${sleepData.avgHours} hours of sleep`,
      });
      this._route({ type: 'WELLNESS_CHECK', data: { studentId: this.studentId, avgSleep: sleepData.avgHours } });
    }

    if (studyStats.totalHours < 5 && overdue.length > 0) {
      recommendations.push({
        action: 'STUDY_INTERVENTION',
        priority: 'medium',
        reason: `Only ${studyStats.totalHours} study hours this week with overdue work`,
      });
    }

    // Update AI insights cache
    this._aiInsights = {
      riskLevel: riskDecision.risk || 'normal',
      predictedGrades: predictions,
      recommendedActions: recommendations,
      lastAnalysis: new Date().toISOString(),
    };

    this._log('AI_ANALYSIS_COMPLETE', { insights: this._aiInsights });

    return this._aiInsights;
  }

  /**
   * Get AI insights about this student.
   */
  getAIInsights() {
    if (!this._aiInsights.lastAnalysis || 
        Date.now() - new Date(this._aiInsights.lastAnalysis).getTime() > 24 * 60 * 60 * 1000) {
      // Re-analyze if stale (>24h)
      this.analyzeStudent();
    }
    return { ...this._aiInsights };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔗 SCHOOL CONNECTION (SilverCanister Integration)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Connect to a school's SilverCanister.
   */
  connectToSchool(silverCanister) {
    this._silverCanister = silverCanister;
    this._log('SCHOOL_CONNECTED', { schoolId: silverCanister.schoolId });
  }

  /**
   * Sync schedule from school.
   */
  syncScheduleFromSchool() {
    if (!this._silverCanister) {
      return { error: 'Not connected to school' };
    }

    // Pull student's schedule from SilverCanister
    const schoolData = this._silverCanister.getStudentSchedule?.(this.studentId);
    if (schoolData) {
      if (schoolData.classes) {
        for (const cls of schoolData.classes) {
          this.addClass(cls);
        }
      }
      if (schoolData.bellSchedule) {
        this.setBellSchedule(schoolData.bellSchedule);
      }
    }

    this._log('SCHEDULE_SYNCED', { source: 'school' });
    return { synced: true };
  }

  /**
   * Sync announcements from school.
   */
  syncAnnouncementsFromSchool() {
    if (!this._silverCanister) {
      return { error: 'Not connected to school' };
    }

    const announcements = this._silverCanister.getAnnouncements?.({ unreadOnly: true });
    if (announcements) {
      for (const ann of announcements) {
        this.addAnnouncement(ann);
      }
    }

    this._log('ANNOUNCEMENTS_SYNCED', { count: announcements?.length || 0 });
    return { synced: true, count: announcements?.length || 0 };
  }

  /**
   * Push analytics to school (anonymized).
   * Called by SilverCanister to gather metrics.
   */
  getAnonymizedMetrics() {
    const studyStats = this.getStudyStats({ period: 'week' });
    const gpa = this.calculateGPA();

    return {
      studentId: this.studentId, // School can see student ID
      grade: this.grade,
      // Anonymized metrics - no personal content
      studyHoursWeek: studyStats.totalHours,
      studySessions: studyStats.totalSessions,
      avgProductivity: studyStats.avgProductivity,
      gpa: gpa.gpa,
      overdueCount: this.getOverdue().length,
      streak: this._streaks.current,
      wellnessAvg: this._getAvgWellness(),
      // NO content - just metrics
    };
  }

  _getAvgWellness() {
    const recent = this.getWellnessHistory({ days: 7 });
    if (recent.length === 0) return null;
    return Math.round(recent.reduce((s, w) => s + w.mood, 0) / recent.length * 10) / 10;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📅 SCHEDULE & PLANNING
  // ═══════════════════════════════════════════════════════════════════════════

  addClass({ classId, className, teacherName, teacherEmail, room, period, subject, days = ['M', 'T', 'W', 'TH', 'F'] }) {
    this._classes.set(classId, {
      classId, className, teacherName, teacherEmail, room, period, subject, days,
      addedAt: new Date().toISOString(),
    });
    this._log('CLASS_ADDED', { classId, className, subject });
    return { added: true, classId, className };
  }

  getClasses() {
    return [...this._classes.values()];
  }

  setBellSchedule(schedule) {
    this._bellSchedule = schedule;
    this._log('BELL_SCHEDULE_SET', { periods: schedule.length });
    return { set: true, periods: schedule.length };
  }

  getTodaySchedule() {
    const today = new Date();
    const dayMap = ['SU', 'M', 'T', 'W', 'TH', 'F', 'SA'];
    const todayDay = dayMap[today.getDay()];

    const todayClasses = [...this._classes.values()]
      .filter(c => c.days.includes(todayDay))
      .sort((a, b) => a.period - b.period);

    return todayClasses.map(c => {
      const bell = this._bellSchedule.find(b => b.period === c.period);
      return {
        period: c.period,
        className: c.className,
        teacherName: c.teacherName,
        room: c.room,
        startTime: bell?.startTime || 'TBD',
        endTime: bell?.endTime || 'TBD',
      };
    });
  }

  getWeekOverview() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const assignmentsDue = [...this._assignments.values()].filter(a => {
      const due = new Date(a.dueDate);
      return due >= weekStart && due <= weekEnd;
    });

    const weekEvents = this._events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    return {
      weekOf: weekStart.toISOString().split('T')[0],
      assignmentsDue: assignmentsDue.length,
      assignments: assignmentsDue.map(a => ({
        title: a.title,
        className: this._classes.get(a.classId)?.className,
        dueDate: a.dueDate,
        priority: a.priority,
        type: a.type,
      })),
      events: weekEvents,
      testCount: assignmentsDue.filter(a => a.type === 'test' || a.type === 'exam').length,
    };
  }

  setTransportation({ type, busRoute, busStop, pickupTime, dropoffTime }) {
    this._transportation = { type, busRoute, busStop, pickupTime, dropoffTime };
    this._log('TRANSPORTATION_SET', { type });
    return { set: true, type };
  }

  getTransportation() {
    return { ...this._transportation };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📝 ASSIGNMENTS & HOMEWORK
  // ═══════════════════════════════════════════════════════════════════════════

  addAssignment({ classId, title, description, dueDate, type = 'homework', points = 100, priority = 'medium' }) {
    const assignmentId = `ASGN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // CEREBEX categorizes the assignment
    const aiCategory = this._categorize(`${title} ${description || ''}`, 'assignment');
    
    this._assignments.set(assignmentId, {
      assignmentId, classId, title, description, dueDate, type, points, priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
      submittedAt: null,
      grade: null,
      aiCategory: aiCategory.primaryCategory,
      aiDifficulty: aiCategory.difficulty || 'medium',
    });

    this._log('ASSIGNMENT_ADDED', { assignmentId, title, dueDate, type, aiCategory: aiCategory.primaryCategory });
    return { added: true, assignmentId, title, dueDate };
  }

  getAssignments({ classId = null, status = null, upcoming = false } = {}) {
    let assignments = [...this._assignments.values()];

    if (classId) assignments = assignments.filter(a => a.classId === classId);
    if (status) assignments = assignments.filter(a => a.status === status);
    if (upcoming) {
      const now = new Date();
      assignments = assignments.filter(a => new Date(a.dueDate) >= now);
    }

    return assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  getDueToday() {
    const today = new Date().toISOString().split('T')[0];
    return [...this._assignments.values()].filter(a => 
      a.dueDate.split('T')[0] === today && a.status !== 'submitted' && a.status !== 'graded'
    );
  }

  getOverdue() {
    const now = new Date();
    return [...this._assignments.values()].filter(a => 
      new Date(a.dueDate) < now && a.status !== 'submitted' && a.status !== 'graded'
    );
  }

  startAssignment(assignmentId) {
    const assignment = this._assignments.get(assignmentId);
    if (!assignment) return { error: 'Assignment not found' };

    assignment.status = 'in_progress';
    this._log('ASSIGNMENT_STARTED', { assignmentId, title: assignment.title });
    return { updated: true, assignmentId, status: 'in_progress' };
  }

  completeAssignment(assignmentId) {
    const assignment = this._assignments.get(assignmentId);
    if (!assignment) return { error: 'Assignment not found' };

    assignment.status = 'completed';
    assignment.completedAt = new Date().toISOString();
    this._log('ASSIGNMENT_COMPLETED', { assignmentId, title: assignment.title });
    return { updated: true, assignmentId, status: 'completed' };
  }

  submitAssignment(assignmentId, { notes = '', attachments = [] } = {}) {
    const assignment = this._assignments.get(assignmentId);
    if (!assignment) return { error: 'Assignment not found' };

    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isLate = now > dueDate;

    assignment.status = isLate ? 'late' : 'submitted';
    assignment.submittedAt = now.toISOString();

    this._submissions.set(assignmentId, {
      assignmentId,
      submittedAt: assignment.submittedAt,
      isLate,
      notes,
      attachments,
    });

    this._log('ASSIGNMENT_SUBMITTED', { 
      assignmentId, 
      title: assignment.title, 
      isLate,
      onTime: !isLate,
    });

    // NEXORIS: Route late submission alerts
    if (isLate) {
      this._route({ type: 'LATE_SUBMISSION', data: { studentId: this.studentId, assignmentId, title: assignment.title } });
    }

    return { submitted: true, assignmentId, isLate, submittedAt: assignment.submittedAt };
  }

  recordGrade(assignmentId, { score, feedback = '' }) {
    const assignment = this._assignments.get(assignmentId);
    if (!assignment) return { error: 'Assignment not found' };

    assignment.status = 'graded';
    const percentage = (score / assignment.points) * 100;
    assignment.grade = { score, outOf: assignment.points, percentage, feedback };

    if (!this._grades.has(assignment.classId)) {
      this._grades.set(assignment.classId, []);
    }
    this._grades.get(assignment.classId).push({
      assignmentId,
      title: assignment.title,
      type: assignment.type,
      score,
      outOf: assignment.points,
      percentage,
      gradedAt: new Date().toISOString(),
    });

    this._log('GRADE_RECORDED', { 
      assignmentId, 
      title: assignment.title, 
      score, 
      percentage,
    });

    // COGNOVEX: Evaluate if grade needs escalation
    if (percentage < 60) {
      const decision = this._decide('Should we alert parent about low grade?', {
        assignment: assignment.title,
        score,
        percentage,
        type: assignment.type,
      });
      
      if (decision.escalate) {
        this._route({ type: 'LOW_GRADE_ALERT', data: { 
          studentId: this.studentId, 
          assignment: assignment.title, 
          score, 
          percentage,
        }});
        this._parentAlerts.push({
          type: 'low_grade',
          assignment: assignment.title,
          score,
          percentage,
          date: new Date().toISOString(),
        });
      }
    }

    return { graded: true, assignmentId, score, outOf: assignment.points, percentage };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📚 NOTES & CLASS MATERIALS
  // ═══════════════════════════════════════════════════════════════════════════

  addNotes({ classId, title, content, date = new Date().toISOString(), tags = [] }) {
    const noteId = `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // CEREBEX categorizes the notes for smart retrieval
    const aiCategory = this._categorize(`${title} ${content}`, 'notes');

    this._notes.set(noteId, {
      noteId, classId, title, content, date, tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiTopics: aiCategory.topics || [],
    });

    this._log('NOTES_ADDED', { noteId, classId, title });
    return { added: true, noteId, title };
  }

  getNotes({ classId = null, search = null } = {}) {
    let notes = [...this._notes.values()];

    if (classId) notes = notes.filter(n => n.classId === classId);

    if (search) {
      const lower = search.toLowerCase();
      notes = notes.filter(n => 
        n.title.toLowerCase().includes(lower) || 
        n.content.toLowerCase().includes(lower) ||
        n.tags.some(t => t.toLowerCase().includes(lower)) ||
        n.aiTopics?.some(t => t.toLowerCase().includes(lower))
      );
    }

    return notes.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  updateNotes(noteId, { title, content, tags }) {
    const note = this._notes.get(noteId);
    if (!note) return { error: 'Note not found' };

    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    note.updatedAt = new Date().toISOString();

    this._log('NOTES_UPDATED', { noteId });
    return { updated: true, noteId };
  }

  saveSyllabus(classId, syllabusContent) {
    this._syllabi.set(classId, {
      classId,
      content: syllabusContent,
      savedAt: new Date().toISOString(),
    });
    this._log('SYLLABUS_SAVED', { classId });
    return { saved: true, classId };
  }

  getSyllabus(classId) {
    return this._syllabi.get(classId) || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 GRADES & PROGRESS
  // ═══════════════════════════════════════════════════════════════════════════

  getClassGrades(classId) {
    const grades = this._grades.get(classId) || [];
    
    if (grades.length === 0) {
      return { classId, grades: [], average: null, letterGrade: null };
    }

    const totalPoints = grades.reduce((sum, g) => sum + g.score, 0);
    const totalPossible = grades.reduce((sum, g) => sum + g.outOf, 0);
    const average = (totalPoints / totalPossible) * 100;

    return {
      classId,
      className: this._classes.get(classId)?.className,
      grades,
      average: Math.round(average * 100) / 100,
      letterGrade: this._getLetterGrade(average),
      totalAssignments: grades.length,
    };
  }

  calculateGPA() {
    const classGrades = [...this._classes.keys()].map(classId => this.getClassGrades(classId));
    const gradedClasses = classGrades.filter(c => c.average !== null);

    if (gradedClasses.length === 0) {
      return { gpa: null, classes: 0 };
    }

    const gradePoints = gradedClasses.map(c => this._getGradePoints(c.average));
    const gpa = gradePoints.reduce((sum, gp) => sum + gp, 0) / gradePoints.length;

    this._gpa.current = Math.round(gpa * 100) / 100;

    return {
      gpa: this._gpa.current,
      classes: gradedClasses.length,
      breakdown: gradedClasses.map(c => ({
        className: c.className,
        average: c.average,
        letterGrade: c.letterGrade,
      })),
    };
  }

  _getLetterGrade(percentage) {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  }

  _getGradePoints(percentage) {
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 63) return 1.0;
    if (percentage >= 60) return 0.7;
    return 0.0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎯 GOALS & PLANNING
  // ═══════════════════════════════════════════════════════════════════════════

  setGoal({ title, description, category, targetDate, milestones = [] }) {
    const goalId = `GOAL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    this._goals.push({
      goalId, title, description,
      category,
      targetDate,
      milestones: milestones.map((m, i) => ({ ...m, id: i, completed: false })),
      status: 'active',
      progress: 0,
      createdAt: new Date().toISOString(),
    });

    this._log('GOAL_SET', { goalId, title, category, targetDate });
    return { created: true, goalId, title };
  }

  updateGoalProgress(goalId, { progress, completedMilestones = [] }) {
    const goal = this._goals.find(g => g.goalId === goalId);
    if (!goal) return { error: 'Goal not found' };

    if (progress !== undefined) goal.progress = progress;
    
    for (const milestoneId of completedMilestones) {
      const milestone = goal.milestones.find(m => m.id === milestoneId);
      if (milestone) milestone.completed = true;
    }

    if (progress >= 100) {
      goal.status = 'completed';
      this._log('GOAL_COMPLETED', { goalId, title: goal.title });
    }

    return { updated: true, goalId, progress: goal.progress };
  }

  getGoals({ category = null, status = 'active' } = {}) {
    let goals = this._goals;
    if (category) goals = goals.filter(g => g.category === category);
    if (status) goals = goals.filter(g => g.status === status);
    return goals;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⏰ STUDY & TIME MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  startStudySession({ subject, classId = null, goal = '' }) {
    const sessionId = `STUDY-${Date.now()}`;

    const session = {
      sessionId, subject, classId, goal,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      breaks: [],
      notes: '',
      productivity: null,
    };

    this._studySessions.push(session);
    this._log('STUDY_SESSION_STARTED', { sessionId, subject, goal });

    return { started: true, sessionId, startTime: session.startTime };
  }

  takeBreak(sessionId) {
    const session = this._studySessions.find(s => s.sessionId === sessionId);
    if (!session) return { error: 'Session not found' };

    session.breaks.push({ startTime: new Date().toISOString(), endTime: null });
    return { breakStarted: true, sessionId };
  }

  endBreak(sessionId) {
    const session = this._studySessions.find(s => s.sessionId === sessionId);
    if (!session) return { error: 'Session not found' };

    const currentBreak = session.breaks.find(b => b.endTime === null);
    if (currentBreak) currentBreak.endTime = new Date().toISOString();

    return { breakEnded: true, sessionId };
  }

  endStudySession(sessionId, { notes = '', productivity = 3 } = {}) {
    const session = this._studySessions.find(s => s.sessionId === sessionId);
    if (!session) return { error: 'Session not found' };

    session.endTime = new Date().toISOString();
    session.notes = notes;
    session.productivity = productivity;

    const totalMs = new Date(session.endTime) - new Date(session.startTime);
    const breakMs = session.breaks.reduce((sum, b) => {
      if (b.endTime) return sum + (new Date(b.endTime) - new Date(b.startTime));
      return sum;
    }, 0);

    session.duration = Math.round((totalMs - breakMs) / 60000);

    this._updateStreak();
    this._log('STUDY_SESSION_ENDED', { sessionId, duration: session.duration, productivity });

    return { ended: true, sessionId, duration: session.duration, productivity };
  }

  getStudyStats({ period = 'week' } = {}) {
    const now = new Date();
    let startDate = new Date(now);

    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'semester') startDate.setMonth(now.getMonth() - 4);

    const sessions = this._studySessions.filter(s => 
      s.endTime && new Date(s.startTime) >= startDate
    );

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgProductivity = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.productivity || 3), 0) / sessions.length
      : 0;

    const bySubject = {};
    for (const session of sessions) {
      if (!bySubject[session.subject]) bySubject[session.subject] = { minutes: 0, sessions: 0 };
      bySubject[session.subject].minutes += session.duration || 0;
      bySubject[session.subject].sessions += 1;
    }

    return {
      period,
      totalSessions: sessions.length,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      avgProductivity: Math.round(avgProductivity * 10) / 10,
      bySubject,
      streak: this._streaks,
    };
  }

  _updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    
    if (this._streaks.lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (this._streaks.lastDate === yesterdayStr) {
      this._streaks.current += 1;
    } else {
      this._streaks.current = 1;
    }

    if (this._streaks.current > this._streaks.longest) {
      this._streaks.longest = this._streaks.current;
    }

    this._streaks.lastDate = today;
    
    // Log streak milestone
    if (this._streaks.current % 7 === 0) {
      this._log('STREAK_MILESTONE', { days: this._streaks.current });
    }
  }

  getStreak() {
    return { ...this._streaks };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 👥 COLLABORATION & STUDY GROUPS
  // ═══════════════════════════════════════════════════════════════════════════

  createStudyGroup({ name, subject, classId = null, members = [] }) {
    const groupId = `GROUP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    this._studyGroups.push({
      groupId, name, subject, classId,
      members: [...members, this.studentId],
      createdBy: this.studentId,
      createdAt: new Date().toISOString(),
      meetings: [],
      sharedNotes: [],
    });

    this._log('STUDY_GROUP_CREATED', { groupId, name, subject });
    return { created: true, groupId, name };
  }

  scheduleGroupMeeting(groupId, { date, time, location, agenda }) {
    const group = this._studyGroups.find(g => g.groupId === groupId);
    if (!group) return { error: 'Study group not found' };

    const meetingId = `MTG-${Date.now()}`;
    group.meetings.push({
      meetingId, date, time, location, agenda,
      attendees: [],
      status: 'scheduled',
    });

    this._log('GROUP_MEETING_SCHEDULED', { groupId, meetingId, date });
    return { scheduled: true, meetingId, date, time };
  }

  getStudyGroups() {
    return this._studyGroups;
  }

  createProjectTeam(assignmentId, { teamName, members = [] }) {
    this._projectTeams.set(assignmentId, {
      assignmentId, teamName,
      members: [...members, this.studentId],
      tasks: [],
      createdAt: new Date().toISOString(),
    });

    this._log('PROJECT_TEAM_CREATED', { assignmentId, teamName });
    return { created: true, assignmentId, teamName };
  }

  addProjectTask(assignmentId, { task, assignedTo, dueDate }) {
    const team = this._projectTeams.get(assignmentId);
    if (!team) return { error: 'Project team not found' };

    const taskId = `TASK-${Date.now()}`;
    team.tasks.push({
      taskId, task, assignedTo, dueDate,
      status: 'pending',
      completedAt: null,
    });

    this._log('PROJECT_TASK_ADDED', { assignmentId, taskId, task });
    return { added: true, taskId, task };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏫 SCHOOL LIFE
  // ═══════════════════════════════════════════════════════════════════════════

  addAnnouncement({ title, content, category, date = new Date().toISOString(), important = false }) {
    const announcementId = `ANN-${Date.now()}`;

    this._announcements.push({
      announcementId, title, content, category, date, important,
      read: false,
    });

    this._log('ANNOUNCEMENT_RECEIVED', { announcementId, title, important });
    return { added: true, announcementId };
  }

  getAnnouncements({ unreadOnly = false, category = null } = {}) {
    let announcements = this._announcements;

    if (unreadOnly) announcements = announcements.filter(a => !a.read);
    if (category) announcements = announcements.filter(a => a.category === category);

    return announcements.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  markAnnouncementRead(announcementId) {
    const ann = this._announcements.find(a => a.announcementId === announcementId);
    if (ann) ann.read = true;
    return { marked: true };
  }

  addEvent({ title, date, time, location, category, description = '' }) {
    const eventId = `EVT-${Date.now()}`;

    this._events.push({
      eventId, title, date, time, location, category, description,
      attending: false,
    });

    this._log('EVENT_ADDED', { eventId, title, date });
    return { added: true, eventId };
  }

  getUpcomingEvents({ days = 30 } = {}) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + days);

    return this._events
      .filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= now && eventDate <= endDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  joinClub({ clubName, meetingDay, meetingTime, advisor, room }) {
    const clubId = `CLUB-${Date.now()}`;

    this._clubs.push({
      clubId, clubName, meetingDay, meetingTime, advisor, room,
      joinedAt: new Date().toISOString(),
      role: 'member',
      hoursLogged: 0,
    });

    this._log('CLUB_JOINED', { clubId, clubName });
    return { joined: true, clubId, clubName };
  }

  logClubHours(clubId, hours, activity) {
    const club = this._clubs.find(c => c.clubId === clubId);
    if (!club) return { error: 'Club not found' };

    club.hoursLogged += hours;
    this._log('CLUB_HOURS_LOGGED', { clubId, hours, totalHours: club.hoursLogged });

    return { logged: true, clubId, hours, totalHours: club.hoursLogged };
  }

  getClubs() {
    return this._clubs;
  }

  addSport({ sportName, season, coach, practiceSchedule }) {
    const sportId = `SPORT-${Date.now()}`;

    this._sports.push({
      sportId, sportName, season, coach, practiceSchedule,
      games: [],
      stats: {},
      joinedAt: new Date().toISOString(),
    });

    this._log('SPORT_ADDED', { sportId, sportName, season });
    return { added: true, sportId, sportName };
  }

  getSports() {
    return this._sports;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 👨‍👩‍👧 PARENT CONNECTION
  // ═══════════════════════════════════════════════════════════════════════════

  generateProgressReport() {
    const gpa = this.calculateGPA();
    const overdue = this.getOverdue();
    const dueThisWeek = this.getWeekOverview();
    const studyStats = this.getStudyStats({ period: 'week' });
    const aiInsights = this.getAIInsights();

    const report = {
      studentName: this.studentName,
      grade: this.grade,
      generatedAt: new Date().toISOString(),
      
      academics: {
        currentGPA: gpa.gpa,
        classBreakdown: gpa.breakdown,
      },
      
      assignments: {
        overdueCount: overdue.length,
        overdueList: overdue.map(a => ({ title: a.title, dueDate: a.dueDate })),
        dueThisWeek: dueThisWeek.assignmentsDue,
        upcomingTests: dueThisWeek.testCount,
      },
      
      effort: {
        studyHoursThisWeek: studyStats.totalHours,
        studySessions: studyStats.totalSessions,
        currentStreak: this._streaks.current,
        avgProductivity: studyStats.avgProductivity,
      },
      
      activities: {
        clubs: this._clubs.map(c => c.clubName),
        sports: this._sports.map(s => s.sportName),
        totalExtracurricularHours: this._clubs.reduce((sum, c) => sum + c.hoursLogged, 0),
      },

      // AI-powered insights for parents
      aiInsights: {
        riskLevel: aiInsights.riskLevel,
        recommendations: aiInsights.recommendedActions,
      },
    };

    this._progressReports.push(report);
    this._log('PROGRESS_REPORT_GENERATED', { reportDate: report.generatedAt });

    return report;
  }

  getParentAlerts() {
    const alerts = [];

    const overdue = this.getOverdue();
    if (overdue.length > 0) {
      alerts.push({
        type: 'overdue',
        severity: 'high',
        message: `${overdue.length} overdue assignment(s)`,
        details: overdue.map(a => a.title),
      });
    }

    const classGrades = [...this._classes.keys()].map(classId => this.getClassGrades(classId));
    const lowGrades = classGrades.filter(c => c.average !== null && c.average < 70);
    if (lowGrades.length > 0) {
      alerts.push({
        type: 'low_grade',
        severity: 'high',
        message: `Low grade(s) in ${lowGrades.length} class(es)`,
        details: lowGrades.map(c => `${c.className}: ${c.average}%`),
      });
    }

    const thisWeek = this.getWeekOverview();
    if (thisWeek.testCount > 0) {
      alerts.push({
        type: 'upcoming_test',
        severity: 'medium',
        message: `${thisWeek.testCount} test(s) this week`,
        details: thisWeek.assignments.filter(a => a.type === 'test' || a.type === 'exam').map(t => t.title),
      });
    }

    if (this._streaks.current >= 7) {
      alerts.push({
        type: 'achievement',
        severity: 'positive',
        message: `🔥 ${this._streaks.current} day study streak!`,
        details: [],
      });
    }

    // Include AI-generated alerts
    const aiInsights = this.getAIInsights();
    if (aiInsights.riskLevel !== 'normal') {
      alerts.push({
        type: 'ai_concern',
        severity: aiInsights.riskLevel === 'high' ? 'high' : 'medium',
        message: `AI detected ${aiInsights.riskLevel} risk level`,
        details: aiInsights.recommendedActions.map(r => r.reason),
      });
    }

    return alerts;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🆘 HELP & SUPPORT
  // ═══════════════════════════════════════════════════════════════════════════

  requestTutoring({ subject, topic, preferredTimes = [], urgency = 'normal' }) {
    const requestId = `TUTOR-${Date.now()}`;

    this._tutoringSessions.push({
      requestId, subject, topic, preferredTimes, urgency,
      status: 'requested',
      tutor: null,
      scheduledTime: null,
      createdAt: new Date().toISOString(),
    });

    this._log('TUTORING_REQUESTED', { requestId, subject, topic, urgency });

    // NEXORIS: Route tutoring request to school
    this._route({ type: 'TUTORING_REQUEST', data: { 
      studentId: this.studentId, 
      requestId, 
      subject, 
      topic, 
      urgency,
    }});

    return { requested: true, requestId, subject, topic };
  }

  getTutoringSessions() {
    return this._tutoringSessions;
  }

  wellnessCheckin({ mood, stressLevel, sleepHours, notes = '' }) {
    const checkinId = `WELL-${Date.now()}`;

    this._wellnessCheckins.push({
      checkinId,
      date: new Date().toISOString(),
      mood,
      stressLevel,
      sleepHours,
      notes,
    });

    this._log('WELLNESS_CHECKIN', { checkinId, mood, stressLevel, sleepHours });

    // COGNOVEX: Evaluate if wellness concern needs escalation
    const decision = this._decide('Should we flag a wellness concern?', {
      mood,
      stressLevel,
      sleepHours,
      recentTrend: this._getWellnessTrend(),
    });

    const recommendations = [];
    
    if (stressLevel >= 4) {
      recommendations.push('Consider talking to a counselor');
      recommendations.push('Try a short break or walk');
      
      if (decision.escalate) {
        this._route({ type: 'WELLNESS_CONCERN', data: { 
          studentId: this.studentId, 
          stressLevel, 
          mood,
        }});
      }
    }
    
    if (sleepHours < 7) {
      recommendations.push('Try to get more sleep tonight');
    }
    
    if (mood <= 2) {
      recommendations.push('Reach out to a friend or trusted adult');
      
      if (decision.escalate) {
        this._route({ type: 'WELLNESS_CONCERN', data: { 
          studentId: this.studentId, 
          mood,
          type: 'low_mood',
        }});
      }
    }

    return { recorded: true, checkinId, recommendations };
  }

  _getWellnessTrend() {
    const recent = this.getWellnessHistory({ days: 7 });
    if (recent.length < 3) return 'insufficient_data';
    
    const avgMood = recent.reduce((s, w) => s + w.mood, 0) / recent.length;
    const avgStress = recent.reduce((s, w) => s + w.stressLevel, 0) / recent.length;
    
    if (avgMood < 2.5 || avgStress > 3.5) return 'concerning';
    if (avgMood > 3.5 && avgStress < 2.5) return 'positive';
    return 'neutral';
  }

  getWellnessHistory({ days = 7 } = {}) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this._wellnessCheckins.filter(c => new Date(c.date) >= startDate);
  }

  logSleep({ date, bedtime, wakeTime, quality }) {
    const sleepId = `SLEEP-${Date.now()}`;

    const bed = new Date(`${date}T${bedtime}`);
    const wake = new Date(`${date}T${wakeTime}`);
    if (wake < bed) wake.setDate(wake.getDate() + 1);
    const hours = (wake - bed) / (1000 * 60 * 60);

    this._sleepLog.push({
      sleepId, date, bedtime, wakeTime,
      hours: Math.round(hours * 10) / 10,
      quality,
    });

    this._log('SLEEP_LOGGED', { sleepId, hours: Math.round(hours * 10) / 10, quality });
    return { logged: true, sleepId, hours: Math.round(hours * 10) / 10 };
  }

  getSleepStats({ days = 7 } = {}) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentSleep = this._sleepLog.filter(s => new Date(s.date) >= startDate);

    if (recentSleep.length === 0) {
      return { avgHours: null, avgQuality: null, entries: 0 };
    }

    const avgHours = recentSleep.reduce((sum, s) => sum + s.hours, 0) / recentSleep.length;
    const avgQuality = recentSleep.reduce((sum, s) => sum + s.quality, 0) / recentSleep.length;

    return {
      avgHours: Math.round(avgHours * 10) / 10,
      avgQuality: Math.round(avgQuality * 10) / 10,
      entries: recentSleep.length,
      recentSleep,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 💼 FUTURE PLANNING (College & Career)
  // ═══════════════════════════════════════════════════════════════════════════

  addCollege({ collegeName, location, type, deadline, requirements = [], notes = '' }) {
    const collegeId = `COL-${Date.now()}`;

    this._collegeList.push({
      collegeId, collegeName, location, type, deadline, requirements, notes,
      status: 'researching',
      addedAt: new Date().toISOString(),
    });

    this._log('COLLEGE_ADDED', { collegeId, collegeName, type });
    return { added: true, collegeId, collegeName };
  }

  updateCollegeStatus(collegeId, status) {
    const college = this._collegeList.find(c => c.collegeId === collegeId);
    if (!college) return { error: 'College not found' };

    college.status = status;
    this._log('COLLEGE_STATUS_UPDATED', { collegeId, collegeName: college.collegeName, status });
    return { updated: true, collegeId, status };
  }

  getCollegeList() {
    return this._collegeList;
  }

  addScholarship({ name, amount, deadline, requirements, link = '' }) {
    const scholarshipId = `SCHOL-${Date.now()}`;

    this._scholarships.push({
      scholarshipId, name, amount, deadline, requirements, link,
      status: 'researching',
      addedAt: new Date().toISOString(),
    });

    this._log('SCHOLARSHIP_ADDED', { scholarshipId, name, amount });
    return { added: true, scholarshipId, name };
  }

  getScholarships() {
    return this._scholarships.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  addTestScore({ testName, date, score, percentile = null, sections = {} }) {
    const scoreId = `SCORE-${Date.now()}`;

    this._testScores.push({
      scoreId, testName, date, score, percentile, sections,
    });

    this._log('TEST_SCORE_ADDED', { scoreId, testName, score });
    return { added: true, scoreId, testName, score };
  }

  getTestScores() {
    return this._testScores;
  }

  addExtracurricular({ activity, organization, role, startDate, endDate = null, hoursPerWeek, weeksPerYear, description }) {
    const activityId = `ECA-${Date.now()}`;

    this._extracurriculars.push({
      activityId, activity, organization, role, startDate, endDate,
      hoursPerWeek, weeksPerYear, description,
      totalHours: hoursPerWeek * weeksPerYear * (endDate ? 
        Math.ceil((new Date(endDate) - new Date(startDate)) / (365 * 24 * 60 * 60 * 1000)) : 1
      ),
    });

    this._log('EXTRACURRICULAR_ADDED', { activityId, activity, organization });
    return { added: true, activityId, activity };
  }

  getExtracurriculars() {
    return this._extracurriculars;
  }

  buildResume() {
    const gpa = this.calculateGPA();

    this._resume = {
      name: this.studentName,
      grade: this.grade,
      generatedAt: new Date().toISOString(),
      
      academics: {
        gpa: gpa.gpa,
        relevantCourses: [...this._classes.values()].map(c => c.className),
      },
      
      testScores: this._testScores.map(t => ({
        test: t.testName,
        score: t.score,
        date: t.date,
      })),
      
      extracurriculars: this._extracurriculars.map(e => ({
        activity: e.activity,
        organization: e.organization,
        role: e.role,
        dates: `${e.startDate} - ${e.endDate || 'Present'}`,
        description: e.description,
      })),
      
      clubsAndActivities: [
        ...this._clubs.map(c => ({ name: c.clubName, role: c.role, hours: c.hoursLogged })),
        ...this._sports.map(s => ({ name: s.sportName, season: s.season })),
      ],
    };

    this._log('RESUME_BUILT', {});
    return this._resume;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📤 EXPORT & IMPORT
  // ═══════════════════════════════════════════════════════════════════════════

  exportData() {
    const data = {
      studentInfo: {
        studentId: this.studentId,
        studentName: this.studentName,
        grade: this.grade,
        schoolId: this.schoolId,
        timezone: this.timezone,
        createdAt: this.createdAt,
      },
      classes: [...this._classes.values()],
      bellSchedule: this._bellSchedule,
      assignments: [...this._assignments.values()],
      notes: [...this._notes.values()],
      grades: Object.fromEntries(this._grades),
      gpa: this._gpa,
      goals: this._goals,
      studySessions: this._studySessions,
      streaks: this._streaks,
      studyGroups: this._studyGroups,
      announcements: this._announcements,
      events: this._events,
      clubs: this._clubs,
      sports: this._sports,
      transportation: this._transportation,
      wellnessCheckins: this._wellnessCheckins,
      sleepLog: this._sleepLog,
      tutoringSessions: this._tutoringSessions,
      collegeList: this._collegeList,
      scholarships: this._scholarships,
      testScores: this._testScores,
      extracurriculars: this._extracurriculars,
      resume: this._resume,
      aiInsights: this._aiInsights,
      // CHRONO audit trail (portfolio)
      auditTrail: this._chrono.export(),
      exportedAt: new Date().toISOString(),
    };

    this._log('DATA_EXPORTED', {});
    return data;
  }

  importData(data) {
    if (data.classes) this._classes = new Map(data.classes.map(c => [c.classId, c]));
    if (data.bellSchedule) this._bellSchedule = data.bellSchedule;
    if (data.assignments) this._assignments = new Map(data.assignments.map(a => [a.assignmentId, a]));
    if (data.notes) this._notes = new Map(data.notes.map(n => [n.noteId, n]));
    if (data.grades) this._grades = new Map(Object.entries(data.grades));
    if (data.gpa) this._gpa = data.gpa;
    if (data.goals) this._goals = data.goals;
    if (data.studySessions) this._studySessions = data.studySessions;
    if (data.streaks) this._streaks = data.streaks;
    if (data.studyGroups) this._studyGroups = data.studyGroups;
    if (data.announcements) this._announcements = data.announcements;
    if (data.events) this._events = data.events;
    if (data.clubs) this._clubs = data.clubs;
    if (data.sports) this._sports = data.sports;
    if (data.transportation) this._transportation = data.transportation;
    if (data.wellnessCheckins) this._wellnessCheckins = data.wellnessCheckins;
    if (data.sleepLog) this._sleepLog = data.sleepLog;
    if (data.tutoringSessions) this._tutoringSessions = data.tutoringSessions;
    if (data.collegeList) this._collegeList = data.collegeList;
    if (data.scholarships) this._scholarships = data.scholarships;
    if (data.testScores) this._testScores = data.testScores;
    if (data.extracurriculars) this._extracurriculars = data.extracurriculars;
    if (data.resume) this._resume = data.resume;
    if (data.aiInsights) this._aiInsights = data.aiInsights;

    this._log('DATA_IMPORTED', {});
    return { imported: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📋 PORTFOLIO (CHRONO-based)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get the student's portfolio from CHRONO audit trail.
   * This is a verifiable record of all the student's work and achievements.
   */
  getPortfolio() {
    const trail = this._chrono.export();
    
    // Filter and format for portfolio
    const portfolioEntries = trail.entries
      .filter(e => [
        'ASSIGNMENT_SUBMITTED', 'GRADE_RECORDED', 'GOAL_COMPLETED', 
        'STUDY_SESSION_ENDED', 'STREAK_MILESTONE', 'CLUB_HOURS_LOGGED',
        'TEST_SCORE_ADDED', 'EXTRACURRICULAR_ADDED', 'RESUME_BUILT',
      ].includes(e.type))
      .map(e => ({
        type: e.type,
        timestamp: e.timestamp,
        details: this._formatPortfolioEntry(e),
      }));

    return {
      studentName: this.studentName,
      grade: this.grade,
      entries: portfolioEntries,
      totalEntries: portfolioEntries.length,
      verifiable: true, // CHRONO provides immutable audit trail
      generatedAt: new Date().toISOString(),
    };
  }

  _formatPortfolioEntry(entry) {
    switch (entry.type) {
      case 'ASSIGNMENT_SUBMITTED':
        return { title: entry.title, onTime: entry.onTime };
      case 'GRADE_RECORDED':
        return { title: entry.title, score: entry.score, percentage: entry.percentage };
      case 'GOAL_COMPLETED':
        return { title: entry.title };
      case 'STUDY_SESSION_ENDED':
        return { duration: entry.duration, productivity: entry.productivity };
      case 'STREAK_MILESTONE':
        return { days: entry.days };
      case 'CLUB_HOURS_LOGGED':
        return { clubId: entry.clubId, hours: entry.hours, totalHours: entry.totalHours };
      case 'TEST_SCORE_ADDED':
        return { testName: entry.testName, score: entry.score };
      default:
        return {};
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏠 DAILY DASHBOARDS
  // ═══════════════════════════════════════════════════════════════════════════

  getMorningBriefing() {
    const today = this.getTodaySchedule();
    const dueToday = this.getDueToday();
    const overdue = this.getOverdue();
    const studyStats = this.getStudyStats({ period: 'week' });
    const unreadAnnouncements = this.getAnnouncements({ unreadOnly: true });
    const upcomingEvents = this.getUpcomingEvents({ days: 3 });
    const sleepStats = this.getSleepStats({ days: 7 });
    const aiInsights = this.getAIInsights();

    this._log('MORNING_BRIEFING_VIEWED', {});

    return {
      greeting: this._getGreeting(),
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      
      todaySchedule: today,
      transportation: this._transportation.type ? {
        type: this._transportation.type,
        time: this._transportation.pickupTime,
        details: this._transportation.busRoute ? `Bus ${this._transportation.busRoute}` : null,
      } : null,
      
      assignments: {
        dueToday: dueToday.length,
        overdue: overdue.length,
        dueTodayList: dueToday.map(a => a.title),
      },
      
      streak: this._streaks.current,
      studyHoursThisWeek: studyStats.totalHours,
      
      announcements: unreadAnnouncements.slice(0, 3),
      upcomingEvents: upcomingEvents.slice(0, 3),
      
      wellness: {
        avgSleep: sleepStats.avgHours,
        recommendation: sleepStats.avgHours && sleepStats.avgHours < 7 
          ? 'Try to get more sleep!' 
          : 'Great sleep habits!',
      },

      // AI insights
      aiTip: aiInsights.recommendedActions.length > 0 
        ? aiInsights.recommendedActions[0].reason 
        : 'Keep up the great work!',
    };
  }

  _getGreeting() {
    const hour = new Date().getHours();
    const name = this.studentName.split(' ')[0];
    
    if (hour < 12) return `Good morning, ${name}! ☀️`;
    if (hour < 17) return `Good afternoon, ${name}! 📚`;
    return `Good evening, ${name}! 🌙`;
  }

  getEveningPlan() {
    const dueToday = this.getDueToday();
    const dueTomorrow = [...this._assignments.values()].filter(a => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return a.dueDate.split('T')[0] === tomorrow.toISOString().split('T')[0] &&
        a.status !== 'submitted' && a.status !== 'graded';
    });
    const overdue = this.getOverdue();
    const weekOverview = this.getWeekOverview();

    const priorityList = [];

    for (const a of overdue) {
      priorityList.push({ ...a, urgency: 'OVERDUE', priority: 1 });
    }

    for (const a of dueToday) {
      if (!priorityList.find(p => p.assignmentId === a.assignmentId)) {
        priorityList.push({ ...a, urgency: 'DUE TODAY', priority: 2 });
      }
    }

    const testsThisWeek = weekOverview.assignments.filter(a => a.type === 'test' || a.type === 'exam');
    for (const a of testsThisWeek) {
      const full = [...this._assignments.values()].find(x => x.title === a.title);
      if (full && !priorityList.find(p => p.assignmentId === full.assignmentId)) {
        priorityList.push({ ...full, urgency: 'TEST THIS WEEK', priority: 3 });
      }
    }

    for (const a of dueTomorrow) {
      if (!priorityList.find(p => p.assignmentId === a.assignmentId)) {
        priorityList.push({ ...a, urgency: 'DUE TOMORROW', priority: 4 });
      }
    }

    priorityList.sort((a, b) => a.priority - b.priority);

    this._log('EVENING_PLAN_VIEWED', {});

    return {
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      totalItems: priorityList.length,
      priorityList: priorityList.slice(0, 10).map(p => ({
        title: p.title,
        className: this._classes.get(p.classId)?.className,
        urgency: p.urgency,
        dueDate: p.dueDate,
        type: p.type,
        aiDifficulty: p.aiDifficulty,
      })),
      estimatedTime: this._estimateStudyTime(priorityList.slice(0, 10)),
      recommendation: priorityList.length > 5 
        ? 'Heavy workload tonight - start early and take breaks!'
        : priorityList.length > 0
          ? 'Manageable workload - you got this!'
          : 'All caught up! Consider reviewing for upcoming tests.',
    };
  }

  _estimateStudyTime(assignments) {
    const estimates = {
      homework: 30, quiz: 20, test: 60, exam: 90,
      essay: 60, project: 90, lab: 45, reading: 30,
    };

    const totalMinutes = assignments.reduce((sum, a) => {
      return sum + (estimates[a.type] || 30);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default StudentAI;
