/**
 * SCHOOL-ANALYTICS — CEREBEX-Powered School Analytics
 * ──────────────────────────────────────────────────────────────────────────────
 * Provides anonymized analytics across the school including:
 *   - School-wide metrics (attendance, grades, engagement)
 *   - Department/subject performance
 *   - Teacher effectiveness (anonymized)
 *   - Student achievement gaps
 *   - Intervention recommendations
 *   - Trend analysis over time
 *
 * Privacy guarantee: All analytics are anonymized and aggregated.
 * Individual student data is never exposed — only patterns and trends.
 *
 * Theory basis:
 *   Paper XV   — ASK III: privacy-preserving analytics
 *   Paper V    — LEGES ANIMAE: L73 (data sovereignty), L77 (no extraction)
 *   Paper II   — CONCORDIA MACHINAE: Kuramoto synchronization patterns
 *   Paper XX   — STIGMERGY: intelligence in the field
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// SchoolAnalytics
// ---------------------------------------------------------------------------

export class SchoolAnalytics {
  /**
   * Create a school analytics engine.
   *
   * @param {object} options
   * @param {string} options.schoolId - School identifier
   */
  constructor({ schoolId }) {
    if (!schoolId) throw new Error('SchoolAnalytics requires a schoolId');

    /** @type {string} */
    this.schoolId = schoolId;

    /**
     * Aggregated metrics storage
     * @type {Map<string, object>}
     */
    this._metrics = new Map();

    /**
     * Historical data for trend analysis
     * @type {object[]}
     */
    this._history = [];

    /**
     * Department metrics (departmentId → metrics)
     * @type {Map<string, object>}
     */
    this._departmentMetrics = new Map();

    /**
     * Classroom metrics cache (classroomId → metrics)
     * @type {Map<string, object>}
     */
    this._classroomMetrics = new Map();

    /** @type {object|null} */
    this._chrono = null;

    /** @type {object|null} */
    this._cerebex = null;

    /** @type {string} */
    this._createdAt = new Date().toISOString();
  }

  /**
   * Attach CHRONO for audit trail.
   * @param {object} chrono - CHRONO instance
   * @returns {SchoolAnalytics}
   */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  /**
   * Attach CEREBEX for pattern recognition.
   * @param {object} cerebex - CEREBEX instance
   * @returns {SchoolAnalytics}
   */
  setCerebex(cerebex) {
    this._cerebex = cerebex;
    return this;
  }

  // ── Metric Types ─────────────────────────────────────────────────────────

  /**
   * Metric type constants.
   */
  static METRIC = {
    ATTENDANCE: 'attendance',
    ENGAGEMENT: 'engagement',
    PERFORMANCE: 'performance',
    BEHAVIOR: 'behavior',
    GRADUATION_PROGRESS: 'graduation_progress',
    INTERVENTION_RATE: 'intervention_rate',
    TEACHER_LOAD: 'teacher_load',
  };

  // ── Data Ingestion (Anonymized) ──────────────────────────────────────────

  /**
   * Ingest classroom-level metrics (already anonymized/aggregated).
   * This is the primary way data enters analytics — always aggregated.
   *
   * @param {object} data
   * @param {string} data.classroomId    - Classroom identifier
   * @param {string} data.subject        - Subject area
   * @param {number} data.grade          - Grade level
   * @param {string} data.teacherId      - Teacher identifier
   * @param {string} data.date           - Data date
   * @param {object} data.metrics        - Aggregated metrics
   * @param {number} [data.metrics.attendanceRate]  - % present
   * @param {number} [data.metrics.avgEngagement]   - Engagement score 0-100
   * @param {number} [data.metrics.avgPerformance]  - Performance score 0-100
   * @param {number} [data.metrics.studentCount]    - Number of students
   * @param {number} [data.metrics.behaviorIncidents] - Incident count
   * @returns {{ ingested: boolean, classroomId: string }}
   */
  ingestClassroomMetrics(data) {
    const { classroomId, subject, grade, teacherId, date, metrics } = data;

    if (!classroomId) throw new Error('Data requires a classroomId');
    if (!date) throw new Error('Data requires a date');

    const record = {
      classroomId,
      subject,
      grade,
      teacherId,
      date,
      metrics: {
        attendanceRate: metrics.attendanceRate ?? null,
        avgEngagement: metrics.avgEngagement ?? null,
        avgPerformance: metrics.avgPerformance ?? null,
        studentCount: metrics.studentCount ?? 0,
        behaviorIncidents: metrics.behaviorIncidents ?? 0,
      },
      ingestedAt: new Date().toISOString(),
    };

    // Store latest metrics for classroom
    this._classroomMetrics.set(classroomId, record);

    // Add to history
    this._history.push(record);

    // Update CEREBEX pattern field if available
    if (this._cerebex && typeof this._cerebex.observe === 'function') {
      this._cerebex.observe({
        type: 'CLASSROOM_METRICS',
        subject,
        grade,
        ...metrics,
      });
    }

    this._log('CLASSROOM_METRICS_INGESTED', { classroomId, date });

    return { ingested: true, classroomId };
  }

  /**
   * Ingest department-level metrics.
   *
   * @param {object} data
   * @param {string} data.departmentId   - Department identifier
   * @param {string} data.subject        - Subject area
   * @param {string} data.date           - Data date
   * @param {object} data.metrics        - Aggregated metrics
   * @returns {{ ingested: boolean, departmentId: string }}
   */
  ingestDepartmentMetrics(data) {
    const { departmentId, subject, date, metrics } = data;

    if (!departmentId) throw new Error('Data requires a departmentId');

    this._departmentMetrics.set(departmentId, {
      departmentId,
      subject,
      date,
      metrics,
      updatedAt: new Date().toISOString(),
    });

    this._log('DEPARTMENT_METRICS_INGESTED', { departmentId, date });

    return { ingested: true, departmentId };
  }

  // ── School-Wide Metrics ──────────────────────────────────────────────────

  /**
   * Calculate school-wide metrics from all classroom data.
   *
   * @param {object} [options]
   * @param {string} [options.startDate] - Start of period
   * @param {string} [options.endDate]   - End of period
   * @returns {{ schoolId: string, period: object, metrics: object, classroomCount: number }}
   */
  schoolwideMetrics(options = {}) {
    const { startDate, endDate } = options;
    const now = new Date().toISOString();

    let records = [...this._history];

    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    if (records.length === 0) {
      return {
        schoolId: this.schoolId,
        period: { startDate: startDate || null, endDate: endDate || null },
        metrics: {
          avgAttendanceRate: null,
          avgEngagement: null,
          avgPerformance: null,
          totalStudents: 0,
          totalBehaviorIncidents: 0,
        },
        classroomCount: 0,
      };
    }

    // Aggregate metrics
    let totalAttendance = 0;
    let attendanceCount = 0;
    let totalEngagement = 0;
    let engagementCount = 0;
    let totalPerformance = 0;
    let performanceCount = 0;
    let totalStudents = 0;
    let totalIncidents = 0;

    const classrooms = new Set();

    for (const r of records) {
      classrooms.add(r.classroomId);

      if (r.metrics.attendanceRate !== null) {
        totalAttendance += r.metrics.attendanceRate;
        attendanceCount++;
      }
      if (r.metrics.avgEngagement !== null) {
        totalEngagement += r.metrics.avgEngagement;
        engagementCount++;
      }
      if (r.metrics.avgPerformance !== null) {
        totalPerformance += r.metrics.avgPerformance;
        performanceCount++;
      }
      totalStudents += r.metrics.studentCount || 0;
      totalIncidents += r.metrics.behaviorIncidents || 0;
    }

    const metrics = {
      avgAttendanceRate: attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount * 10) / 10 : null,
      avgEngagement: engagementCount > 0 ? Math.round(totalEngagement / engagementCount * 10) / 10 : null,
      avgPerformance: performanceCount > 0 ? Math.round(totalPerformance / performanceCount * 10) / 10 : null,
      totalStudents: Math.round(totalStudents / records.length), // Average across records
      totalBehaviorIncidents: totalIncidents,
    };

    this._log('SCHOOLWIDE_METRICS_CALCULATED', {
      period: { startDate, endDate },
      classroomCount: classrooms.size,
    });

    return {
      schoolId: this.schoolId,
      period: { startDate: startDate || null, endDate: endDate || now },
      metrics,
      classroomCount: classrooms.size,
    };
  }

  // ── Department Metrics ───────────────────────────────────────────────────

  /**
   * Get metrics for a specific subject/department.
   *
   * @param {string} subject - Subject area
   * @param {object} [options]
   * @param {string} [options.startDate] - Start of period
   * @param {string} [options.endDate]   - End of period
   * @returns {{ subject: string, metrics: object, classroomCount: number }}
   */
  departmentMetrics(subject, options = {}) {
    const { startDate, endDate } = options;

    let records = this._history.filter(r => r.subject === subject);

    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    if (records.length === 0) {
      return {
        subject,
        metrics: {
          avgAttendanceRate: null,
          avgEngagement: null,
          avgPerformance: null,
        },
        classroomCount: 0,
      };
    }

    let totalPerformance = 0;
    let performanceCount = 0;
    let totalEngagement = 0;
    let engagementCount = 0;
    let totalAttendance = 0;
    let attendanceCount = 0;

    const classrooms = new Set();

    for (const r of records) {
      classrooms.add(r.classroomId);

      if (r.metrics.avgPerformance !== null) {
        totalPerformance += r.metrics.avgPerformance;
        performanceCount++;
      }
      if (r.metrics.avgEngagement !== null) {
        totalEngagement += r.metrics.avgEngagement;
        engagementCount++;
      }
      if (r.metrics.attendanceRate !== null) {
        totalAttendance += r.metrics.attendanceRate;
        attendanceCount++;
      }
    }

    return {
      subject,
      metrics: {
        avgAttendanceRate: attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount * 10) / 10 : null,
        avgEngagement: engagementCount > 0 ? Math.round(totalEngagement / engagementCount * 10) / 10 : null,
        avgPerformance: performanceCount > 0 ? Math.round(totalPerformance / performanceCount * 10) / 10 : null,
      },
      classroomCount: classrooms.size,
    };
  }

  // ── Achievement Gap Analysis ─────────────────────────────────────────────

  /**
   * Identify achievement gaps across grades, subjects, or classrooms.
   * All data is anonymized — no individual students are identified.
   *
   * @param {object} [options]
   * @param {string} [options.groupBy] - 'grade', 'subject', or 'classroom'
   * @param {number} [options.threshold] - Gap threshold (default 10 points)
   * @returns {{ gaps: object[], recommendations: string[] }}
   */
  identifyGaps(options = {}) {
    const { groupBy = 'subject', threshold = 10 } = options;

    // Get latest metrics for each classroom
    const classrooms = Array.from(this._classroomMetrics.values());

    if (classrooms.length === 0) {
      return { gaps: [], recommendations: [] };
    }

    // Group and calculate averages
    const groups = {};

    for (const c of classrooms) {
      const key = groupBy === 'grade' ? c.grade :
                  groupBy === 'subject' ? c.subject :
                  c.classroomId;

      if (!groups[key]) {
        groups[key] = { total: 0, count: 0 };
      }

      if (c.metrics.avgPerformance !== null) {
        groups[key].total += c.metrics.avgPerformance;
        groups[key].count++;
      }
    }

    // Calculate averages and find gaps
    const averages = [];
    for (const [key, data] of Object.entries(groups)) {
      if (data.count > 0) {
        averages.push({
          group: key,
          avgPerformance: Math.round(data.total / data.count * 10) / 10,
          sampleSize: data.count,
        });
      }
    }

    // Find overall average
    const overallAvg = averages.length > 0
      ? averages.reduce((sum, a) => sum + a.avgPerformance, 0) / averages.length
      : 0;

    // Identify gaps (below threshold from average)
    const gaps = averages
      .filter(a => overallAvg - a.avgPerformance >= threshold)
      .map(a => ({
        ...a,
        gap: Math.round((overallAvg - a.avgPerformance) * 10) / 10,
        percentile: Math.round((averages.filter(x => x.avgPerformance < a.avgPerformance).length / averages.length) * 100),
      }))
      .sort((a, b) => b.gap - a.gap);

    // Generate recommendations
    const recommendations = gaps.map(g => {
      const groupType = groupBy === 'grade' ? `Grade ${g.group}` :
                        groupBy === 'subject' ? g.group :
                        `Classroom ${g.group}`;
      return `${groupType} is ${g.gap} points below school average. Consider targeted intervention.`;
    });

    this._log('GAPS_IDENTIFIED', { groupBy, gapCount: gaps.length });

    return { gaps, recommendations, overallAverage: Math.round(overallAvg * 10) / 10 };
  }

  // ── Trend Analysis ───────────────────────────────────────────────────────

  /**
   * Analyze trends over time for a specific metric.
   *
   * @param {string} metric   - Metric to analyze: 'attendance', 'engagement', 'performance'
   * @param {object} [options]
   * @param {string} [options.startDate] - Start date
   * @param {string} [options.endDate]   - End date
   * @param {string} [options.granularity] - 'day', 'week', 'month'
   * @returns {{ metric: string, trend: string, dataPoints: object[], change: number }}
   */
  trendAnalysis(metric, options = {}) {
    const { startDate, endDate, granularity = 'week' } = options;

    const metricKey = metric === 'attendance' ? 'attendanceRate' :
                      metric === 'engagement' ? 'avgEngagement' :
                      metric === 'performance' ? 'avgPerformance' : metric;

    let records = [...this._history];

    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    records.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (records.length < 2) {
      return {
        metric,
        trend: 'insufficient_data',
        dataPoints: [],
        change: 0,
      };
    }

    // Group by time period
    const periods = {};

    for (const r of records) {
      const date = new Date(r.date);
      let periodKey;

      if (granularity === 'day') {
        periodKey = r.date;
      } else if (granularity === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else { // month
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!periods[periodKey]) {
        periods[periodKey] = { total: 0, count: 0 };
      }

      const value = r.metrics[metricKey];
      if (value !== null && value !== undefined) {
        periods[periodKey].total += value;
        periods[periodKey].count++;
      }
    }

    // Calculate averages per period
    const dataPoints = Object.entries(periods)
      .map(([period, data]) => ({
        period,
        value: data.count > 0 ? Math.round(data.total / data.count * 10) / 10 : null,
      }))
      .filter(d => d.value !== null)
      .sort((a, b) => a.period.localeCompare(b.period));

    if (dataPoints.length < 2) {
      return {
        metric,
        trend: 'insufficient_data',
        dataPoints,
        change: 0,
      };
    }

    // Calculate trend
    const firstValue = dataPoints[0].value;
    const lastValue = dataPoints[dataPoints.length - 1].value;
    const change = Math.round((lastValue - firstValue) * 10) / 10;

    let trend;
    if (Math.abs(change) < 2) {
      trend = 'stable';
    } else if (change > 0) {
      trend = 'improving';
    } else {
      trend = 'declining';
    }

    this._log('TREND_ANALYSIS', { metric, trend, change, periods: dataPoints.length });

    return { metric, trend, dataPoints, change };
  }

  // ── Intervention Recommendations ─────────────────────────────────────────

  /**
   * Generate intervention recommendations based on current analytics.
   *
   * @returns {{ recommendations: object[], priority: string }}
   */
  generateRecommendations() {
    const recommendations = [];
    const schoolMetrics = this.schoolwideMetrics();
    const gaps = this.identifyGaps();

    // Check attendance
    if (schoolMetrics.metrics.avgAttendanceRate !== null && schoolMetrics.metrics.avgAttendanceRate < 90) {
      recommendations.push({
        type: 'attendance',
        severity: schoolMetrics.metrics.avgAttendanceRate < 85 ? 'high' : 'medium',
        message: `School attendance rate (${schoolMetrics.metrics.avgAttendanceRate}%) is below target (90%). Consider attendance intervention programs.`,
        metric: schoolMetrics.metrics.avgAttendanceRate,
        target: 90,
      });
    }

    // Check engagement
    if (schoolMetrics.metrics.avgEngagement !== null && schoolMetrics.metrics.avgEngagement < 70) {
      recommendations.push({
        type: 'engagement',
        severity: schoolMetrics.metrics.avgEngagement < 60 ? 'high' : 'medium',
        message: `School engagement score (${schoolMetrics.metrics.avgEngagement}) is below optimal. Consider student engagement initiatives.`,
        metric: schoolMetrics.metrics.avgEngagement,
        target: 70,
      });
    }

    // Check performance
    if (schoolMetrics.metrics.avgPerformance !== null && schoolMetrics.metrics.avgPerformance < 70) {
      recommendations.push({
        type: 'performance',
        severity: schoolMetrics.metrics.avgPerformance < 60 ? 'high' : 'medium',
        message: `School performance average (${schoolMetrics.metrics.avgPerformance}) needs improvement. Review curriculum effectiveness.`,
        metric: schoolMetrics.metrics.avgPerformance,
        target: 70,
      });
    }

    // Add gap-based recommendations
    for (const gap of gaps.gaps.slice(0, 3)) { // Top 3 gaps
      recommendations.push({
        type: 'achievement_gap',
        severity: gap.gap > 15 ? 'high' : 'medium',
        message: `${gap.group} shows a ${gap.gap}-point gap from school average. Targeted support recommended.`,
        metric: gap.avgPerformance,
        gap: gap.gap,
      });
    }

    // Check behavior
    if (schoolMetrics.metrics.totalBehaviorIncidents > schoolMetrics.classroomCount * 5) {
      recommendations.push({
        type: 'behavior',
        severity: 'medium',
        message: `Behavior incidents (${schoolMetrics.metrics.totalBehaviorIncidents}) are elevated. Review PBIS implementation.`,
        metric: schoolMetrics.metrics.totalBehaviorIncidents,
      });
    }

    // Determine overall priority
    const highSeverity = recommendations.filter(r => r.severity === 'high').length;
    const priority = highSeverity >= 2 ? 'critical' :
                     highSeverity === 1 ? 'high' :
                     recommendations.length > 0 ? 'normal' : 'low';

    this._log('RECOMMENDATIONS_GENERATED', { count: recommendations.length, priority });

    return { recommendations, priority };
  }

  // ── Export & Reporting ───────────────────────────────────────────────────

  /**
   * Export analytics report for a period.
   *
   * @param {object} [options]
   * @param {string} [options.startDate] - Report start
   * @param {string} [options.endDate]   - Report end
   * @returns {{ report: object }}
   */
  exportReport(options = {}) {
    const schoolMetrics = this.schoolwideMetrics(options);
    const gaps = this.identifyGaps();
    const recommendations = this.generateRecommendations();

    const attendanceTrend = this.trendAnalysis('attendance', options);
    const performanceTrend = this.trendAnalysis('performance', options);

    return {
      report: {
        schoolId: this.schoolId,
        generatedAt: new Date().toISOString(),
        period: schoolMetrics.period,
        summary: schoolMetrics.metrics,
        trends: {
          attendance: attendanceTrend,
          performance: performanceTrend,
        },
        gaps: gaps.gaps,
        recommendations: recommendations.recommendations,
        priority: recommendations.priority,
      },
    };
  }

  /**
   * Get analytics statistics.
   *
   * @returns {{ schoolId: string, historyRecords: number, classroomsTracked: number, departmentsTracked: number }}
   */
  stats() {
    return {
      schoolId: this.schoolId,
      historyRecords: this._history.length,
      classroomsTracked: this._classroomMetrics.size,
      departmentsTracked: this._departmentMetrics.size,
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
