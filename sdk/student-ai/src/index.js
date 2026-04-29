/**
 * @medina/student-ai — src/index.js
 * ══════════════════════════════════════════════════════════════════════════════
 * STUDENT LIFE OPERATING SYSTEM
 * 
 * This is not a study tool. This is everything a student needs to manage their
 * entire life — at school, at home, and planning for their future.
 *
 * Built for REAL students with REAL needs:
 *   - Elementary school kids who need help staying organized
 *   - Middle schoolers juggling multiple classes for the first time
 *   - High schoolers balancing academics, activities, and college prep
 *   - Parents who want to stay informed and supportive
 *
 * Version: 2.0.0
 * Author: Alfredo Medina Hernandez · Medina Tech · Dallas, Texas
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════════════════════════════
// THE STUDENT AI CLASS
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
   */
  constructor({ studentId, studentName, grade, schoolId, timezone = 'America/Chicago' }) {
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

    // ═══════════════════════════════════════════════════════════════════════
    // DATA STORES
    // ═══════════════════════════════════════════════════════════════════════

    // Schedule & Classes
    this._classes = new Map();          // classId → class info
    this._schedule = [];                 // daily schedule with periods
    this._bellSchedule = [];             // period start/end times

    // Assignments & Homework
    this._assignments = new Map();       // assignmentId → assignment
    this._submissions = new Map();       // assignmentId → submission status

    // Notes & Materials
    this._notes = new Map();             // noteId → note content
    this._syllabi = new Map();           // classId → syllabus

    // Grades & Progress
    this._grades = new Map();            // classId → array of grades
    this._gpa = { current: 0, cumulative: 0, history: [] };

    // Goals & Planning
    this._goals = [];                    // semester/year goals
    this._collegeList = [];              // colleges of interest
    this._scholarships = [];             // scholarship tracking
    this._extracurriculars = [];         // activities for college apps

    // Study & Time Management
    this._studySessions = [];            // logged study sessions
    this._streaks = { current: 0, longest: 0, lastDate: null };
    this._habits = new Map();            // habitId → habit tracking

    // Social & Collaboration
    this._studyGroups = [];              // study group memberships
    this._projectTeams = new Map();      // projectId → team members
    this._tutoringSessions = [];         // tutoring appointments

    // School Life
    this._announcements = [];            // school announcements
    this._events = [];                   // school events
    this._clubs = [];                    // club memberships
    this._sports = [];                   // sports/activities

    // Transportation
    this._transportation = {
      type: null,                        // 'bus', 'car', 'walk', 'bike'
      busRoute: null,
      busStop: null,
      pickupTime: null,
      dropoffTime: null,
    };

    // Parent Connection
    this._parentAlerts = [];             // alerts sent to parents
    this._progressReports = [];          // generated progress reports

    // Wellness
    this._wellnessCheckins = [];         // mental health check-ins
    this._sleepLog = [];                 // sleep tracking

    // Future Planning
    this._collegeApps = new Map();       // collegeId → application status
    this._testScores = [];               // SAT, ACT, AP scores
    this._resume = null;                 // student resume data
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📅 SCHEDULE & PLANNING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a class to the student's schedule.
   */
  addClass({ classId, className, teacherName, teacherEmail, room, period, subject, days = ['M', 'T', 'W', 'TH', 'F'] }) {
    this._classes.set(classId, {
      classId,
      className,
      teacherName,
      teacherEmail,
      room,
      period,
      subject,
      days,
      addedAt: new Date().toISOString(),
    });
    return { added: true, classId, className };
  }

  /**
   * Get all classes.
   */
  getClasses() {
    return [...this._classes.values()];
  }

  /**
   * Set the bell schedule (period times).
   */
  setBellSchedule(schedule) {
    // schedule: [{ period: 1, startTime: '8:00', endTime: '8:50' }, ...]
    this._bellSchedule = schedule;
    return { set: true, periods: schedule.length };
  }

  /**
   * Get today's schedule with times and rooms.
   */
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

  /**
   * Get what's happening this week.
   */
  getWeekOverview() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Get assignments due this week
    const assignmentsDue = [...this._assignments.values()].filter(a => {
      const due = new Date(a.dueDate);
      return due >= weekStart && due <= weekEnd;
    });

    // Get events this week
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
      })),
      events: weekEvents,
      testCount: assignmentsDue.filter(a => a.type === 'test' || a.type === 'exam').length,
    };
  }

  /**
   * Set transportation info.
   */
  setTransportation({ type, busRoute, busStop, pickupTime, dropoffTime }) {
    this._transportation = { type, busRoute, busStop, pickupTime, dropoffTime };
    return { set: true, type };
  }

  /**
   * Get transportation info.
   */
  getTransportation() {
    return { ...this._transportation };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📝 ASSIGNMENTS & HOMEWORK
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a new assignment.
   */
  addAssignment({ classId, title, description, dueDate, type = 'homework', points = 100, priority = 'medium' }) {
    const assignmentId = `ASGN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    this._assignments.set(assignmentId, {
      assignmentId,
      classId,
      title,
      description,
      dueDate,
      type, // 'homework', 'project', 'test', 'quiz', 'essay', 'lab'
      points,
      priority, // 'low', 'medium', 'high', 'urgent'
      status: 'pending', // 'pending', 'in_progress', 'completed', 'submitted', 'graded', 'late', 'missing'
      createdAt: new Date().toISOString(),
      completedAt: null,
      submittedAt: null,
      grade: null,
    });

    return { added: true, assignmentId, title, dueDate };
  }

  /**
   * Get all assignments, optionally filtered.
   */
  getAssignments({ classId = null, status = null, upcoming = false } = {}) {
    let assignments = [...this._assignments.values()];

    if (classId) {
      assignments = assignments.filter(a => a.classId === classId);
    }

    if (status) {
      assignments = assignments.filter(a => a.status === status);
    }

    if (upcoming) {
      const now = new Date();
      assignments = assignments.filter(a => new Date(a.dueDate) >= now);
    }

    // Sort by due date
    assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return assignments;
  }

  /**
   * Get what's due today.
   */
  getDueToday() {
    const today = new Date().toISOString().split('T')[0];
    return [...this._assignments.values()].filter(a => 
      a.dueDate.split('T')[0] === today && a.status !== 'submitted' && a.status !== 'graded'
    );
  }

  /**
   * Get overdue assignments.
   */
  getOverdue() {
    const now = new Date();
    return [...this._assignments.values()].filter(a => 
      new Date(a.dueDate) < now && a.status !== 'submitted' && a.status !== 'graded'
    );
  }

  /**
   * Mark assignment as in progress.
   */
  startAssignment(assignmentId) {
    const assignment = this._assignments.get(assignmentId);
    if (!assignment) return { error: 'Assignment not found' };

    assignment.status = 'in_progress';
    return { updated: true, assignmentId, status: 'in_progress' };
  }

  /**
   * Mark assignment as completed.
   */
  completeAssignment(assignmentId) {
    const assignment = this._assignments.get(assignmentId);
    if (!assignment) return { error: 'Assignment not found' };

    assignment.status = 'completed';
    assignment.completedAt = new Date().toISOString();
    return { updated: true, assignmentId, status: 'completed' };
  }

  /**
   * Submit an assignment.
   */
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

    return { submitted: true, assignmentId, isLate, submittedAt: assignment.submittedAt };
  }

  /**
   * Record a grade for an assignment.
   */
  recordGrade(assignmentId, { score, feedback = '' }) {
    const assignment = this._assignments.get(assignmentId);
    if (!assignment) return { error: 'Assignment not found' };

    assignment.status = 'graded';
    assignment.grade = { score, outOf: assignment.points, percentage: (score / assignment.points) * 100, feedback };

    // Add to class grades
    if (!this._grades.has(assignment.classId)) {
      this._grades.set(assignment.classId, []);
    }
    this._grades.get(assignment.classId).push({
      assignmentId,
      title: assignment.title,
      type: assignment.type,
      score,
      outOf: assignment.points,
      percentage: assignment.grade.percentage,
      gradedAt: new Date().toISOString(),
    });

    return { graded: true, assignmentId, score, outOf: assignment.points, percentage: assignment.grade.percentage };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📚 NOTES & CLASS MATERIALS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add notes for a class.
   */
  addNotes({ classId, title, content, date = new Date().toISOString(), tags = [] }) {
    const noteId = `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    this._notes.set(noteId, {
      noteId,
      classId,
      title,
      content,
      date,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { added: true, noteId, title };
  }

  /**
   * Get notes for a class.
   */
  getNotes({ classId = null, search = null } = {}) {
    let notes = [...this._notes.values()];

    if (classId) {
      notes = notes.filter(n => n.classId === classId);
    }

    if (search) {
      const lower = search.toLowerCase();
      notes = notes.filter(n => 
        n.title.toLowerCase().includes(lower) || 
        n.content.toLowerCase().includes(lower) ||
        n.tags.some(t => t.toLowerCase().includes(lower))
      );
    }

    return notes.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Update existing notes.
   */
  updateNotes(noteId, { title, content, tags }) {
    const note = this._notes.get(noteId);
    if (!note) return { error: 'Note not found' };

    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    note.updatedAt = new Date().toISOString();

    return { updated: true, noteId };
  }

  /**
   * Save syllabus for a class.
   */
  saveSyllabus(classId, syllabusContent) {
    this._syllabi.set(classId, {
      classId,
      content: syllabusContent,
      savedAt: new Date().toISOString(),
    });
    return { saved: true, classId };
  }

  /**
   * Get syllabus for a class.
   */
  getSyllabus(classId) {
    return this._syllabi.get(classId) || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 GRADES & PROGRESS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get grades for a class.
   */
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

  /**
   * Get overall GPA.
   */
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

  /**
   * Set a goal.
   */
  setGoal({ title, description, category, targetDate, milestones = [] }) {
    const goalId = `GOAL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    this._goals.push({
      goalId,
      title,
      description,
      category, // 'academic', 'extracurricular', 'personal', 'college', 'career'
      targetDate,
      milestones: milestones.map((m, i) => ({ ...m, id: i, completed: false })),
      status: 'active', // 'active', 'completed', 'abandoned'
      progress: 0,
      createdAt: new Date().toISOString(),
    });

    return { created: true, goalId, title };
  }

  /**
   * Update goal progress.
   */
  updateGoalProgress(goalId, { progress, completedMilestones = [] }) {
    const goal = this._goals.find(g => g.goalId === goalId);
    if (!goal) return { error: 'Goal not found' };

    if (progress !== undefined) goal.progress = progress;
    
    for (const milestoneId of completedMilestones) {
      const milestone = goal.milestones.find(m => m.id === milestoneId);
      if (milestone) milestone.completed = true;
    }

    if (progress >= 100) goal.status = 'completed';

    return { updated: true, goalId, progress: goal.progress };
  }

  /**
   * Get all goals.
   */
  getGoals({ category = null, status = 'active' } = {}) {
    let goals = this._goals;

    if (category) {
      goals = goals.filter(g => g.category === category);
    }

    if (status) {
      goals = goals.filter(g => g.status === status);
    }

    return goals;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⏰ STUDY & TIME MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start a study session.
   */
  startStudySession({ subject, classId = null, goal = '' }) {
    const sessionId = `STUDY-${Date.now()}`;

    const session = {
      sessionId,
      subject,
      classId,
      goal,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      breaks: [],
      notes: '',
      productivity: null,
    };

    this._studySessions.push(session);

    return { started: true, sessionId, startTime: session.startTime };
  }

  /**
   * Take a break during study session.
   */
  takeBreak(sessionId) {
    const session = this._studySessions.find(s => s.sessionId === sessionId);
    if (!session) return { error: 'Session not found' };

    session.breaks.push({
      startTime: new Date().toISOString(),
      endTime: null,
    });

    return { breakStarted: true, sessionId };
  }

  /**
   * End break.
   */
  endBreak(sessionId) {
    const session = this._studySessions.find(s => s.sessionId === sessionId);
    if (!session) return { error: 'Session not found' };

    const currentBreak = session.breaks.find(b => b.endTime === null);
    if (currentBreak) {
      currentBreak.endTime = new Date().toISOString();
    }

    return { breakEnded: true, sessionId };
  }

  /**
   * End a study session.
   */
  endStudySession(sessionId, { notes = '', productivity = 3 } = {}) {
    const session = this._studySessions.find(s => s.sessionId === sessionId);
    if (!session) return { error: 'Session not found' };

    session.endTime = new Date().toISOString();
    session.notes = notes;
    session.productivity = productivity; // 1-5 scale

    // Calculate duration (minus breaks)
    const totalMs = new Date(session.endTime) - new Date(session.startTime);
    const breakMs = session.breaks.reduce((sum, b) => {
      if (b.endTime) {
        return sum + (new Date(b.endTime) - new Date(b.startTime));
      }
      return sum;
    }, 0);

    session.duration = Math.round((totalMs - breakMs) / 60000); // minutes

    // Update streak
    this._updateStreak();

    return { 
      ended: true, 
      sessionId, 
      duration: session.duration,
      productivity,
    };
  }

  /**
   * Get study statistics.
   */
  getStudyStats({ period = 'week' } = {}) {
    const now = new Date();
    let startDate = new Date(now);

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'semester') {
      startDate.setMonth(now.getMonth() - 4);
    }

    const sessions = this._studySessions.filter(s => 
      s.endTime && new Date(s.startTime) >= startDate
    );

    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgProductivity = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.productivity || 3), 0) / sessions.length
      : 0;

    // Group by subject
    const bySubject = {};
    for (const session of sessions) {
      if (!bySubject[session.subject]) {
        bySubject[session.subject] = { minutes: 0, sessions: 0 };
      }
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
    
    if (this._streaks.lastDate === today) {
      return; // Already studied today
    }

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
  }

  /**
   * Get current streak.
   */
  getStreak() {
    return { ...this._streaks };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 👥 COLLABORATION & STUDY GROUPS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a study group.
   */
  createStudyGroup({ name, subject, classId = null, members = [] }) {
    const groupId = `GROUP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    this._studyGroups.push({
      groupId,
      name,
      subject,
      classId,
      members: [...members, this.studentId],
      createdBy: this.studentId,
      createdAt: new Date().toISOString(),
      meetings: [],
      sharedNotes: [],
    });

    return { created: true, groupId, name };
  }

  /**
   * Schedule a study group meeting.
   */
  scheduleGroupMeeting(groupId, { date, time, location, agenda }) {
    const group = this._studyGroups.find(g => g.groupId === groupId);
    if (!group) return { error: 'Study group not found' };

    const meetingId = `MTG-${Date.now()}`;
    group.meetings.push({
      meetingId,
      date,
      time,
      location,
      agenda,
      attendees: [],
      status: 'scheduled',
    });

    return { scheduled: true, meetingId, date, time };
  }

  /**
   * Get study groups.
   */
  getStudyGroups() {
    return this._studyGroups;
  }

  /**
   * Create a project team.
   */
  createProjectTeam(assignmentId, { teamName, members = [] }) {
    this._projectTeams.set(assignmentId, {
      assignmentId,
      teamName,
      members: [...members, this.studentId],
      tasks: [],
      createdAt: new Date().toISOString(),
    });

    return { created: true, assignmentId, teamName };
  }

  /**
   * Add task to project.
   */
  addProjectTask(assignmentId, { task, assignedTo, dueDate }) {
    const team = this._projectTeams.get(assignmentId);
    if (!team) return { error: 'Project team not found' };

    const taskId = `TASK-${Date.now()}`;
    team.tasks.push({
      taskId,
      task,
      assignedTo,
      dueDate,
      status: 'pending',
      completedAt: null,
    });

    return { added: true, taskId, task };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏫 SCHOOL LIFE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add school announcement.
   */
  addAnnouncement({ title, content, category, date = new Date().toISOString(), important = false }) {
    const announcementId = `ANN-${Date.now()}`;

    this._announcements.push({
      announcementId,
      title,
      content,
      category, // 'general', 'academic', 'sports', 'clubs', 'emergency'
      date,
      important,
      read: false,
    });

    return { added: true, announcementId };
  }

  /**
   * Get announcements.
   */
  getAnnouncements({ unreadOnly = false, category = null } = {}) {
    let announcements = this._announcements;

    if (unreadOnly) {
      announcements = announcements.filter(a => !a.read);
    }

    if (category) {
      announcements = announcements.filter(a => a.category === category);
    }

    return announcements.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Add school event.
   */
  addEvent({ title, date, time, location, category, description = '' }) {
    const eventId = `EVT-${Date.now()}`;

    this._events.push({
      eventId,
      title,
      date,
      time,
      location,
      category, // 'sports', 'dance', 'concert', 'meeting', 'deadline', 'holiday'
      description,
      attending: false,
    });

    return { added: true, eventId };
  }

  /**
   * Get upcoming events.
   */
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

  /**
   * Join a club.
   */
  joinClub({ clubName, meetingDay, meetingTime, advisor, room }) {
    const clubId = `CLUB-${Date.now()}`;

    this._clubs.push({
      clubId,
      clubName,
      meetingDay,
      meetingTime,
      advisor,
      room,
      joinedAt: new Date().toISOString(),
      role: 'member',
      hoursLogged: 0,
    });

    return { joined: true, clubId, clubName };
  }

  /**
   * Log club hours.
   */
  logClubHours(clubId, hours, activity) {
    const club = this._clubs.find(c => c.clubId === clubId);
    if (!club) return { error: 'Club not found' };

    club.hoursLogged += hours;

    return { logged: true, clubId, hours, totalHours: club.hoursLogged };
  }

  /**
   * Get club memberships.
   */
  getClubs() {
    return this._clubs;
  }

  /**
   * Add sport/activity.
   */
  addSport({ sportName, season, coach, practiceSchedule }) {
    const sportId = `SPORT-${Date.now()}`;

    this._sports.push({
      sportId,
      sportName,
      season,
      coach,
      practiceSchedule, // [{ day: 'M', time: '3:30 PM' }, ...]
      games: [],
      stats: {},
      joinedAt: new Date().toISOString(),
    });

    return { added: true, sportId, sportName };
  }

  /**
   * Get sports/activities.
   */
  getSports() {
    return this._sports;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 👨‍👩‍👧 PARENT CONNECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate progress report for parents.
   */
  generateProgressReport() {
    const gpa = this.calculateGPA();
    const overdue = this.getOverdue();
    const dueThisWeek = this.getWeekOverview();
    const studyStats = this.getStudyStats({ period: 'week' });

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
    };

    this._progressReports.push(report);

    return report;
  }

  /**
   * Get alerts for parents.
   */
  getParentAlerts() {
    const alerts = [];

    // Check for overdue assignments
    const overdue = this.getOverdue();
    if (overdue.length > 0) {
      alerts.push({
        type: 'overdue',
        severity: 'high',
        message: `${overdue.length} overdue assignment(s)`,
        details: overdue.map(a => a.title),
      });
    }

    // Check for low grades
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

    // Check for upcoming tests
    const thisWeek = this.getWeekOverview();
    if (thisWeek.testCount > 0) {
      const tests = thisWeek.assignments.filter(a => a.priority === 'high' || a.type === 'test');
      alerts.push({
        type: 'upcoming_test',
        severity: 'medium',
        message: `${thisWeek.testCount} test(s) this week`,
        details: tests.map(t => `${t.title} - ${t.dueDate}`),
      });
    }

    // Check streak
    if (this._streaks.current >= 7) {
      alerts.push({
        type: 'achievement',
        severity: 'positive',
        message: `🔥 ${this._streaks.current} day study streak!`,
        details: [],
      });
    }

    return alerts;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🆘 HELP & SUPPORT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Request tutoring.
   */
  requestTutoring({ subject, topic, preferredTimes = [], urgency = 'normal' }) {
    const requestId = `TUTOR-${Date.now()}`;

    this._tutoringSessions.push({
      requestId,
      subject,
      topic,
      preferredTimes,
      urgency, // 'normal', 'urgent', 'before_test'
      status: 'requested',
      tutor: null,
      scheduledTime: null,
      createdAt: new Date().toISOString(),
    });

    return { requested: true, requestId, subject, topic };
  }

  /**
   * Get tutoring sessions.
   */
  getTutoringSessions() {
    return this._tutoringSessions;
  }

  /**
   * Mental health check-in.
   */
  wellnessCheckin({ mood, stressLevel, sleepHours, notes = '' }) {
    const checkinId = `WELL-${Date.now()}`;

    this._wellnessCheckins.push({
      checkinId,
      date: new Date().toISOString(),
      mood, // 1-5 scale
      stressLevel, // 1-5 scale
      sleepHours,
      notes,
    });

    // Generate recommendations based on check-in
    const recommendations = [];
    
    if (stressLevel >= 4) {
      recommendations.push('Consider talking to a counselor');
      recommendations.push('Try a short break or walk');
    }
    
    if (sleepHours < 7) {
      recommendations.push('Try to get more sleep tonight');
    }
    
    if (mood <= 2) {
      recommendations.push('Reach out to a friend or trusted adult');
    }

    return { 
      recorded: true, 
      checkinId, 
      recommendations,
    };
  }

  /**
   * Get wellness history.
   */
  getWellnessHistory({ days = 7 } = {}) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this._wellnessCheckins.filter(c => 
      new Date(c.date) >= startDate
    );
  }

  /**
   * Log sleep.
   */
  logSleep({ date, bedtime, wakeTime, quality }) {
    const sleepId = `SLEEP-${Date.now()}`;

    // Calculate hours
    const bed = new Date(`${date}T${bedtime}`);
    const wake = new Date(`${date}T${wakeTime}`);
    if (wake < bed) wake.setDate(wake.getDate() + 1);
    const hours = (wake - bed) / (1000 * 60 * 60);

    this._sleepLog.push({
      sleepId,
      date,
      bedtime,
      wakeTime,
      hours: Math.round(hours * 10) / 10,
      quality, // 1-5
    });

    return { logged: true, sleepId, hours: Math.round(hours * 10) / 10 };
  }

  /**
   * Get sleep stats.
   */
  getSleepStats({ days = 7 } = {}) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentSleep = this._sleepLog.filter(s => 
      new Date(s.date) >= startDate
    );

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

  /**
   * Add college to list.
   */
  addCollege({ collegeName, location, type, deadline, requirements = [], notes = '' }) {
    const collegeId = `COL-${Date.now()}`;

    this._collegeList.push({
      collegeId,
      collegeName,
      location,
      type, // 'reach', 'match', 'safety'
      deadline,
      requirements,
      notes,
      status: 'researching', // 'researching', 'applying', 'applied', 'accepted', 'rejected', 'waitlisted', 'enrolled'
      addedAt: new Date().toISOString(),
    });

    return { added: true, collegeId, collegeName };
  }

  /**
   * Update college application status.
   */
  updateCollegeStatus(collegeId, status) {
    const college = this._collegeList.find(c => c.collegeId === collegeId);
    if (!college) return { error: 'College not found' };

    college.status = status;
    return { updated: true, collegeId, status };
  }

  /**
   * Get college list.
   */
  getCollegeList() {
    return this._collegeList;
  }

  /**
   * Add scholarship.
   */
  addScholarship({ name, amount, deadline, requirements, link = '' }) {
    const scholarshipId = `SCHOL-${Date.now()}`;

    this._scholarships.push({
      scholarshipId,
      name,
      amount,
      deadline,
      requirements,
      link,
      status: 'researching', // 'researching', 'applying', 'applied', 'awarded', 'denied'
      addedAt: new Date().toISOString(),
    });

    return { added: true, scholarshipId, name };
  }

  /**
   * Get scholarships.
   */
  getScholarships() {
    return this._scholarships.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  /**
   * Add test score.
   */
  addTestScore({ testName, date, score, percentile = null, sections = {} }) {
    const scoreId = `SCORE-${Date.now()}`;

    this._testScores.push({
      scoreId,
      testName, // 'SAT', 'ACT', 'PSAT', 'AP Biology', etc.
      date,
      score,
      percentile,
      sections,
    });

    return { added: true, scoreId, testName, score };
  }

  /**
   * Get test scores.
   */
  getTestScores() {
    return this._testScores;
  }

  /**
   * Add extracurricular activity (for college apps).
   */
  addExtracurricular({ activity, organization, role, startDate, endDate = null, hoursPerWeek, weeksPerYear, description }) {
    const activityId = `ECA-${Date.now()}`;

    this._extracurriculars.push({
      activityId,
      activity,
      organization,
      role,
      startDate,
      endDate,
      hoursPerWeek,
      weeksPerYear,
      description,
      totalHours: hoursPerWeek * weeksPerYear * (endDate ? 
        Math.ceil((new Date(endDate) - new Date(startDate)) / (365 * 24 * 60 * 60 * 1000)) : 1
      ),
    });

    return { added: true, activityId, activity };
  }

  /**
   * Get extracurriculars.
   */
  getExtracurriculars() {
    return this._extracurriculars;
  }

  /**
   * Build resume.
   */
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
        ...this._clubs.map(c => ({
          name: c.clubName,
          role: c.role,
          hours: c.hoursLogged,
        })),
        ...this._sports.map(s => ({
          name: s.sportName,
          season: s.season,
        })),
      ],
    };

    return this._resume;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📤 EXPORT & IMPORT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Export all student data.
   */
  exportData() {
    return {
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
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import student data.
   */
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

    return { imported: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏠 DAILY DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get everything a student needs to see when they wake up.
   */
  getMorningBriefing() {
    const today = getTodaySchedule();
    const dueToday = this.getDueToday();
    const overdue = this.getOverdue();
    const studyStats = this.getStudyStats({ period: 'week' });
    const unreadAnnouncements = this.getAnnouncements({ unreadOnly: true });
    const upcomingEvents = this.getUpcomingEvents({ days: 3 });
    const sleepStats = this.getSleepStats({ days: 7 });

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
    };
  }

  _getGreeting() {
    const hour = new Date().getHours();
    const name = this.studentName.split(' ')[0];
    
    if (hour < 12) return `Good morning, ${name}! ☀️`;
    if (hour < 17) return `Good afternoon, ${name}! 📚`;
    return `Good evening, ${name}! 🌙`;
  }

  /**
   * Get what to focus on tonight (homework planning).
   */
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

    // Prioritize: overdue > due today > tests this week > due tomorrow
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
      const full = this._assignments.get(a.assignmentId);
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

    return {
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      totalItems: priorityList.length,
      priorityList: priorityList.slice(0, 10).map(p => ({
        title: p.title,
        className: this._classes.get(p.classId)?.className,
        urgency: p.urgency,
        dueDate: p.dueDate,
        type: p.type,
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
    // Rough estimates by type
    const estimates = {
      homework: 30,
      quiz: 20,
      test: 60,
      exam: 90,
      essay: 60,
      project: 90,
      lab: 45,
      reading: 30,
    };

    const totalMinutes = assignments.reduce((sum, a) => {
      return sum + (estimates[a.type] || 30);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default StudentAI;
