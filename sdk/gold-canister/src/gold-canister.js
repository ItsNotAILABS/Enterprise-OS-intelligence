/**
 * GOLD-CANISTER — District-Level Sovereign System
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * The Gold Canister is the APEX of the educational hierarchy. For DISD (Dallas 
 * Independent School District), this is the BRAIN of the entire district.
 * 
 * This is NOT a management tool. This is a CIVILIZATION of AIs.
 * 
 * The AIs ARE the IT department. The AIs ARE the internal workers. The AIs ARE
 * everything that flows through the system. No external proof needed — the AIs
 * prove themselves through operation.
 * 
 * Hierarchy:
 *   GOLD CANISTER (District) → SILVER CANISTERS (Schools) → BRONZE CANISTERS (Students)
 * 
 * Functions:
 *   - Orchestrate ALL schools in the district (230+ schools for DISD)
 *   - Allocate resources (budget, personnel, devices) across schools
 *   - Enforce district-wide policies
 *   - Coordinate curriculum standards (TEKS alignment for Texas)
 *   - Generate state reports (TEA reporting for Texas)
 *   - AI workforce management (the civilization)
 *   - Emergency coordination across all schools
 *   - Performance benchmarking district-wide
 *   - Strategic planning and forecasting
 *
 * Built on YOUR math, YOUR architecture, YOUR papers:
 *   Paper XV   — ASK III: district-level canister architecture
 *   Paper V    — LEGES ANIMAE: Behavioral Laws governing the civilization
 *   Paper XIX  — CIVITAS MERIDIANA: The civic infrastructure
 *   Paper XX   — STIGMERGY: Pheromone trails (CHRONO) across the district
 *   Paper X    — EXECUTIO UNIVERSALIS: query = act = learn = log
 *   Paper II   — CONCORDIA MACHINAE: Kuramoto synchronization of all agents
 *   Paper XXI  — QUORUM: Decisions emerge from the collective
 *   Paper XXII — AURUM: Gold-level governance patterns
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ══════════════════════════════════════════════════════════════════════════════
 */

import {
  CHRONO,
  CEREBEX,
  NEXORIS,
  HDI,
  CognovexNetwork,
  bootstrapMeridian,
} from '../../meridian-sovereign-os/src/index.js';

import { SilverCanister } from '../../silver-canister/src/silver-canister.js';

// ══════════════════════════════════════════════════════════════════════════════
// GOLD CANISTER — THE DISTRICT BRAIN
// ══════════════════════════════════════════════════════════════════════════════

export class GoldCanister {
  /**
   * Create a Gold Canister for a school district.
   *
   * @param {object} options
   * @param {string} options.districtId      - Unique district identifier (e.g., 'DISD')
   * @param {string} options.districtName    - Full district name
   * @param {string} options.state           - State code (e.g., 'TX')
   * @param {string} options.superintendentId - Superintendent identifier
   * @param {string} [options.superintendentName] - Superintendent name
   * @param {string} [options.schoolYear]    - Current school year
   * @param {string} [options.canisterId]    - ICP canister identifier
   */
  constructor({
    districtId,
    districtName,
    state,
    superintendentId,
    superintendentName = null,
    schoolYear = null,
    canisterId = null,
  }) {
    if (!districtId) throw new Error('GoldCanister requires a districtId');
    if (!districtName) throw new Error('GoldCanister requires a districtName');
    if (!state) throw new Error('GoldCanister requires a state');
    if (!superintendentId) throw new Error('GoldCanister requires a superintendentId');

    /** @type {string} */
    this.districtId = districtId;

    /** @type {string} */
    this.districtName = districtName;

    /** @type {string} */
    this.state = state;

    /** @type {string} */
    this.superintendentId = superintendentId;

    /** @type {string|null} */
    this.superintendentName = superintendentName;

    /** @type {string} */
    this.schoolYear = schoolYear || this._defaultSchoolYear();

    /** @type {string} */
    this.canisterId = canisterId || `GC::${districtId}`;

    // ══════════════════════════════════════════════════════════════════════════
    // MERIDIAN INTELLIGENCE ENGINES — THE AI CIVILIZATION CORE
    // ══════════════════════════════════════════════════════════════════════════

    const meridian = bootstrapMeridian({
      agentId: `DISTRICT_${districtId}`,
      cognovexUnits: 8, // District-wide decision domains
    });

    this._chrono = meridian.chrono;      // Immutable audit trail for ALL
    this._cerebex = meridian.cerebex;    // District-wide pattern recognition
    this._nexoris = meridian.nexoris;    // Cross-school routing
    this._cognovex = meridian.cognovex;  // Multi-stakeholder quorum
    this._hdi = meridian.hdi;            // Natural language for superintendent
    this._voxis = meridian.voxis;        // Sovereign compute

    // Configure COGNOVEX units for district governance
    this._cognovex.addUnit('cvx-academic', 'ACADEMIC_STANDARDS');
    this._cognovex.addUnit('cvx-operations', 'OPERATIONS');
    this._cognovex.addUnit('cvx-finance', 'BUDGET_FINANCE');
    this._cognovex.addUnit('cvx-hr', 'HUMAN_RESOURCES');
    this._cognovex.addUnit('cvx-compliance', 'COMPLIANCE_LEGAL');
    this._cognovex.addUnit('cvx-safety', 'SAFETY_SECURITY');
    this._cognovex.addUnit('cvx-community', 'COMMUNITY_RELATIONS');
    this._cognovex.addUnit('cvx-technology', 'TECHNOLOGY_AI');

    // ══════════════════════════════════════════════════════════════════════════
    // INTERNAL STATE
    // ══════════════════════════════════════════════════════════════════════════

    /** @type {boolean} */
    this._provisioned = false;

    /** @type {boolean} */
    this._active = false;

    /** @type {string|null} */
    this._lastAction = null;

    // ══════════════════════════════════════════════════════════════════════════
    // SCHOOL NETWORK — ALL SILVER CANISTERS
    // ══════════════════════════════════════════════════════════════════════════

    /** @type {Map<string, SilverCanister>} schoolId → SilverCanister */
    this._schools = new Map();

    /** @type {Map<string, object>} schoolId → school metadata */
    this._schoolMetadata = new Map();

    // ══════════════════════════════════════════════════════════════════════════
    // AI WORKFORCE — THE CIVILIZATION
    // ══════════════════════════════════════════════════════════════════════════

    /** @type {Map<string, object>} agentId → AI agent configuration */
    this._aiAgents = new Map();

    /** @type {object[]} Agent communication log */
    this._agentCommunications = [];

    /** @type {Map<string, object>} skillId → skill definition */
    this._sharedSkills = new Map();

    // ══════════════════════════════════════════════════════════════════════════
    // DISTRICT RESOURCES
    // ══════════════════════════════════════════════════════════════════════════

    /** @type {object} District budget */
    this._budget = {
      total: 0,
      allocated: 0,
      remaining: 0,
      byCategory: {},
      bySchool: {},
    };

    /** @type {Map<string, object>} Personnel directory */
    this._personnel = new Map();

    /** @type {Map<string, object>} Shared resources (devices, materials) */
    this._sharedResources = new Map();

    // ══════════════════════════════════════════════════════════════════════════
    // POLICIES & COMPLIANCE
    // ══════════════════════════════════════════════════════════════════════════

    /** @type {Map<string, object>} Active policies */
    this._policies = new Map();

    /** @type {Map<string, object>} Curriculum standards (TEKS for Texas) */
    this._curriculumStandards = new Map();

    /** @type {object[]} Compliance reports */
    this._complianceReports = [];

    // ══════════════════════════════════════════════════════════════════════════
    // ANALYTICS & REPORTING
    // ══════════════════════════════════════════════════════════════════════════

    /** @type {object[]} District-wide metrics history */
    this._metricsHistory = [];

    /** @type {object[]} State reports generated */
    this._stateReports = [];

    // ══════════════════════════════════════════════════════════════════════════
    // COMMUNICATION
    // ══════════════════════════════════════════════════════════════════════════

    /** @type {object[]} District-wide announcements */
    this._districtAnnouncements = [];

    /** @type {object[]} Emergency alerts */
    this._emergencyAlerts = [];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Provision the Gold Canister — boot up the district AI civilization.
   */
  provision() {
    if (this._provisioned) {
      return { provisioned: true, canisterId: this.canisterId, message: 'Already provisioned' };
    }

    // Initialize the civilization
    this._provisioned = true;
    this._active = true;
    this._lastAction = new Date().toISOString();

    // Register core AI agents
    this._registerCoreAgents();

    // Log provisioning
    this._log('GOLD_CANISTER_PROVISIONED', {
      districtId: this.districtId,
      districtName: this.districtName,
      state: this.state,
      superintendentId: this.superintendentId,
      schoolYear: this.schoolYear,
      canisterId: this.canisterId,
      agentsRegistered: this._aiAgents.size,
    });

    return {
      provisioned: true,
      canisterId: this.canisterId,
      districtId: this.districtId,
      districtName: this.districtName,
      agentsRegistered: this._aiAgents.size,
    };
  }

  /**
   * Get full district status.
   */
  status() {
    return {
      provisioned: this._provisioned,
      active: this._active,
      canisterId: this.canisterId,
      districtId: this.districtId,
      districtName: this.districtName,
      state: this.state,
      schoolYear: this.schoolYear,
      lastAction: this._lastAction,
      
      // Network stats
      schoolCount: this._schools.size,
      aiAgentCount: this._aiAgents.size,
      sharedSkillCount: this._sharedSkills.size,
      
      // Resources
      budgetTotal: this._budget.total,
      budgetAllocated: this._budget.allocated,
      personnelCount: this._personnel.size,
      
      // Policies
      activePolicies: this._policies.size,
      curriculumStandards: this._curriculumStandards.size,
      
      // Chain length
      chronoLength: this._chrono ? this._chrono._chain.length : 0,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCHOOL NETWORK MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Register a new school in the district.
   * Creates a SilverCanister for the school.
   *
   * @param {object} school - School configuration
   * @param {string} school.schoolId - Unique school identifier
   * @param {string} school.schoolName - School display name
   * @param {string} school.principalId - Principal identifier
   * @param {string} [school.principalName] - Principal name
   * @param {string} [school.type] - School type (elementary, middle, high)
   * @param {string[]} [school.grades] - Grades served
   * @param {object} [school.location] - School location
   * @returns {{ registered: boolean, schoolId: string, canisterId: string }}
   */
  registerSchool(school) {
    this._ensureProvisioned();

    const { schoolId, schoolName, principalId, principalName = null, type = 'comprehensive', grades = [], location = null } = school;

    if (!schoolId) throw new Error('School requires a schoolId');
    if (!schoolName) throw new Error('School requires a schoolName');
    if (!principalId) throw new Error('School requires a principalId');

    // Check if already registered
    if (this._schools.has(schoolId)) {
      return { registered: false, schoolId, error: 'School already registered' };
    }

    // Create SilverCanister for the school
    const silverCanister = new SilverCanister({
      schoolId,
      schoolName,
      districtId: this.districtId,
      principalId,
      principalName,
      schoolYear: this.schoolYear,
      state: this.state,
    });

    // Provision the school
    silverCanister.provision();

    // Store the canister
    this._schools.set(schoolId, silverCanister);

    // Store metadata
    this._schoolMetadata.set(schoolId, {
      schoolId,
      schoolName,
      principalId,
      principalName,
      type,
      grades,
      location,
      registeredAt: new Date().toISOString(),
      canisterId: silverCanister.canisterId,
      active: true,
    });

    // Route through NEXORIS
    this._nexoris.reinforce(`SCHOOL_REGISTERED:${schoolId}`, 1.0);

    this._touchAction();
    this._log('SCHOOL_REGISTERED', { schoolId, schoolName, type, grades });

    return { registered: true, schoolId, canisterId: silverCanister.canisterId };
  }

  /**
   * Get a school's SilverCanister.
   *
   * @param {string} schoolId - School identifier
   * @returns {SilverCanister|null}
   */
  getSchool(schoolId) {
    this._ensureProvisioned();
    return this._schools.get(schoolId) || null;
  }

  /**
   * List all schools in the district.
   *
   * @param {object} [filters]
   * @param {string} [filters.type] - Filter by school type
   * @param {number} [filters.grade] - Filter by grade served
   * @returns {object[]} Array of school metadata
   */
  listSchools(filters = {}) {
    this._ensureProvisioned();

    let schools = Array.from(this._schoolMetadata.values());

    if (filters.type) {
      schools = schools.filter(s => s.type === filters.type);
    }
    if (filters.grade !== undefined) {
      schools = schools.filter(s => s.grades.includes(filters.grade));
    }

    return schools;
  }

  /**
   * Broadcast a message to all schools.
   *
   * @param {object} announcement
   * @param {string} announcement.title - Announcement title
   * @param {string} announcement.content - Announcement content
   * @param {string} [announcement.priority='normal'] - Priority level
   * @param {string} [announcement.category='general'] - Category
   * @returns {{ broadcast: boolean, schoolsReached: number }}
   */
  broadcastToSchools(announcement) {
    this._ensureProvisioned();

    const { title, content, priority = 'normal', category = 'general' } = announcement;

    const announcementObj = {
      id: `DIST-${this.districtId}-${Date.now()}`,
      title,
      content,
      priority,
      category,
      from: 'DISTRICT',
      districtId: this.districtId,
      timestamp: new Date().toISOString(),
    };

    this._districtAnnouncements.push(announcementObj);

    // Broadcast to all schools
    let schoolsReached = 0;
    for (const [schoolId, school] of this._schools) {
      try {
        school.receiveDistrictDirective({
          type: 'ANNOUNCEMENT',
          content: announcementObj,
        });
        schoolsReached++;
      } catch (e) {
        // Log but continue
        this._log('BROADCAST_ERROR', { schoolId, error: e.message });
      }
    }

    this._touchAction();
    this._log('DISTRICT_BROADCAST', { title, priority, schoolsReached });

    return { broadcast: true, schoolsReached };
  }

  /**
   * Issue an emergency alert to all schools.
   *
   * @param {string} message - Emergency message
   * @param {object} [options]
   * @param {string} [options.severity='high'] - Severity level
   * @param {string} [options.type='general'] - Emergency type
   * @returns {{ alerted: boolean, schoolsReached: number }}
   */
  emergencyAlert(message, options = {}) {
    this._ensureProvisioned();

    const { severity = 'high', type = 'general' } = options;

    const alert = {
      id: `EMERG-${this.districtId}-${Date.now()}`,
      message,
      severity,
      type,
      districtId: this.districtId,
      timestamp: new Date().toISOString(),
    };

    this._emergencyAlerts.push(alert);

    // Route through NEXORIS with high priority
    this._nexoris.reinforce('EMERGENCY_ALERT', 1.0);

    // Alert all schools
    let schoolsReached = 0;
    for (const [schoolId, school] of this._schools) {
      try {
        school.postEmergencyAlert(message, { severity, type, from: 'DISTRICT' });
        schoolsReached++;
      } catch (e) {
        this._log('EMERGENCY_ALERT_ERROR', { schoolId, error: e.message });
      }
    }

    this._touchAction();
    this._log('EMERGENCY_ALERT_ISSUED', { severity, type, schoolsReached });

    return { alerted: true, schoolsReached };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AI CIVILIZATION MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Register an AI agent in the civilization.
   *
   * @param {object} agent
   * @param {string} agent.agentId - Unique agent identifier
   * @param {string} agent.agentType - Type of agent (TEACHER_AI, COUNSELOR_AI, etc.)
   * @param {string} agent.schoolId - Assigned school (or 'DISTRICT' for district-level)
   * @param {string[]} [agent.skills] - Agent capabilities
   * @param {object} [agent.config] - Agent configuration
   * @returns {{ registered: boolean, agentId: string }}
   */
  registerAgent(agent) {
    this._ensureProvisioned();

    const { agentId, agentType, schoolId, skills = [], config = {} } = agent;

    if (!agentId) throw new Error('Agent requires an agentId');
    if (!agentType) throw new Error('Agent requires an agentType');

    const agentObj = {
      agentId,
      agentType,
      schoolId: schoolId || 'DISTRICT',
      skills,
      config,
      registeredAt: new Date().toISOString(),
      active: true,
      communications: [],
    };

    this._aiAgents.set(agentId, agentObj);

    // Register skills in the shared skill repository
    for (const skill of skills) {
      if (!this._sharedSkills.has(skill)) {
        this._sharedSkills.set(skill, {
          skillId: skill,
          agents: [agentId],
          createdAt: new Date().toISOString(),
        });
      } else {
        this._sharedSkills.get(skill).agents.push(agentId);
      }
    }

    this._touchAction();
    this._log('AI_AGENT_REGISTERED', { agentId, agentType, schoolId: schoolId || 'DISTRICT', skills });

    return { registered: true, agentId };
  }

  /**
   * Route a request to the appropriate AI agent.
   * Uses NEXORIS for intelligent routing.
   *
   * @param {object} request
   * @param {string} request.type - Request type
   * @param {object} request.payload - Request payload
   * @param {string} [request.schoolId] - Target school (optional)
   * @returns {{ routed: boolean, targetAgent: string }}
   */
  routeRequest(request) {
    this._ensureProvisioned();

    const { type, payload, schoolId = null } = request;

    // Use NEXORIS to route the request
    const routeResult = this._nexoris.route({ targets: [type], category: type, command: JSON.stringify(payload).slice(0, 100) });

    // Find agents that can handle this request type
    let candidates = Array.from(this._aiAgents.values()).filter(a => a.active);

    // Filter by school if specified
    if (schoolId) {
      candidates = candidates.filter(a => a.schoolId === schoolId || a.schoolId === 'DISTRICT');
    }

    // Find by skill match (simplified - in production would use CEREBEX for matching)
    const typeSkill = type.toLowerCase().replace('_', '-');
    candidates = candidates.filter(a => 
      a.skills.some(s => s.toLowerCase().includes(typeSkill) || typeSkill.includes(s.toLowerCase()))
    );

    if (candidates.length === 0) {
      return { routed: false, error: 'No suitable agent found' };
    }

    // Select the first candidate (in production, would use load balancing)
    const targetAgent = candidates[0];

    // Log communication
    this._agentCommunications.push({
      requestId: `REQ-${Date.now()}`,
      type,
      payload,
      targetAgentId: targetAgent.agentId,
      timestamp: new Date().toISOString(),
    });

    this._touchAction();
    this._log('REQUEST_ROUTED', { type, targetAgentId: targetAgent.agentId, schoolId });

    return { routed: true, targetAgent: targetAgent.agentId };
  }

  /**
   * Share a skill across the AI civilization.
   *
   * @param {object} skill
   * @param {string} skill.skillId - Skill identifier
   * @param {string} skill.name - Skill name
   * @param {string} skill.description - What the skill does
   * @param {object} skill.implementation - Skill implementation details
   * @returns {{ shared: boolean, skillId: string }}
   */
  shareSkill(skill) {
    this._ensureProvisioned();

    const { skillId, name, description, implementation } = skill;

    if (!skillId) throw new Error('Skill requires a skillId');
    if (!name) throw new Error('Skill requires a name');

    const skillObj = {
      skillId,
      name,
      description,
      implementation,
      agents: [],
      sharedAt: new Date().toISOString(),
      usageCount: 0,
    };

    this._sharedSkills.set(skillId, skillObj);

    // Notify all agents via NEXORIS
    this._nexoris.reinforce(`SKILL:${skillId}`, 1.0);

    this._touchAction();
    this._log('SKILL_SHARED', { skillId, name });

    return { shared: true, skillId };
  }

  /**
   * Get agents that have a specific skill.
   *
   * @param {string} skillId - Skill identifier
   * @returns {object[]} Array of agents with the skill
   */
  getAgentsWithSkill(skillId) {
    this._ensureProvisioned();

    const skill = this._sharedSkills.get(skillId);
    if (!skill) return [];

    return skill.agents.map(agentId => this._aiAgents.get(agentId)).filter(Boolean);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DISTRICT-WIDE INTELLIGENCE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * AI: Analyze the entire district.
   * Uses CEREBEX for pattern recognition across all schools.
   *
   * @returns {object} District-wide AI analysis
   */
  analyzeDistrict() {
    this._ensureProvisioned();

    // Gather metrics from all schools
    const schoolMetrics = [];
    for (const [schoolId, school] of this._schools) {
      try {
        const metrics = school.getDistrictMetrics();
        schoolMetrics.push(metrics);
      } catch (e) {
        // Skip schools that fail
      }
    }

    // Aggregate metrics
    const totalStudents = schoolMetrics.reduce((sum, m) => sum + (m.enrollment?.totalStudents || 0), 0);
    const totalTeachers = schoolMetrics.reduce((sum, m) => sum + (m.enrollment?.totalTeachers || 0), 0);
    const avgAttendance = schoolMetrics.length > 0
      ? schoolMetrics.reduce((sum, m) => sum + (m.performance?.avgAttendance || 0), 0) / schoolMetrics.length
      : 0;
    const avgPerformance = schoolMetrics.length > 0
      ? schoolMetrics.reduce((sum, m) => sum + (m.performance?.avgPerformance || 0), 0) / schoolMetrics.length
      : 0;

    // CEREBEX: Pattern recognition via scoring
    const analysisInput = `District analysis: ${this._schools.size} schools, ${totalStudents} students, attendance ${avgAttendance}%, performance ${avgPerformance}%`;
    const patterns = this._cerebex.score(analysisInput);

    // COGNOVEX: Multi-stakeholder assessment (tick to get current state)
    const quorumState = this._cognovex.tick();
    const assessment = {
      crystallized: quorumState.crystallized,
      option: quorumState.option || null,
      threshold: quorumState.threshold,
      stakeholders: this._cognovex._units.size,
    };

    // Generate recommendations
    const recommendations = this._generateDistrictRecommendations(schoolMetrics);

    this._touchAction();
    this._log('DISTRICT_ANALYSIS', { schoolCount: this._schools.size, totalStudents });

    return {
      timestamp: new Date().toISOString(),
      districtId: this.districtId,
      districtName: this.districtName,

      // Summary
      schoolCount: this._schools.size,
      totalStudents,
      totalTeachers,
      studentTeacherRatio: totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0,

      // Performance
      avgAttendance: Math.round(avgAttendance * 10) / 10,
      avgPerformance: Math.round(avgPerformance * 10) / 10,

      // AI Civilization
      aiAgentCount: this._aiAgents.size,
      sharedSkillCount: this._sharedSkills.size,

      // AI Insights
      patterns: patterns.filter(p => p.score > 0.3).slice(0, 5),
      assessment,
      recommendations,

      // School breakdown
      schoolMetrics,
    };
  }

  /**
   * AI: Identify district-wide trends and issues.
   *
   * @returns {object} Trend analysis
   */
  identifyTrends() {
    this._ensureProvisioned();

    const analysis = this.analyzeDistrict();

    // Sort schools by performance
    const sortedByPerformance = [...analysis.schoolMetrics]
      .filter(m => m.performance?.avgPerformance)
      .sort((a, b) => (b.performance?.avgPerformance || 0) - (a.performance?.avgPerformance || 0));

    // Top and bottom performers
    const topPerformers = sortedByPerformance.slice(0, 5).map(m => ({
      schoolId: m.schoolId,
      schoolName: m.schoolName,
      performance: m.performance?.avgPerformance,
    }));

    const needsAttention = sortedByPerformance.slice(-5).map(m => ({
      schoolId: m.schoolId,
      schoolName: m.schoolName,
      performance: m.performance?.avgPerformance,
    }));

    // Calculate trends (would use historical data in production)
    const trends = {
      enrollment: 'stable',
      performance: analysis.avgPerformance > 75 ? 'positive' : 'needs_improvement',
      attendance: analysis.avgAttendance > 92 ? 'positive' : 'needs_improvement',
    };

    this._touchAction();
    this._log('TREND_ANALYSIS', { topCount: topPerformers.length, needsAttentionCount: needsAttention.length });

    return {
      timestamp: new Date().toISOString(),
      trends,
      topPerformers,
      needsAttention,
      recommendations: this._generateDistrictRecommendations(analysis.schoolMetrics),
    };
  }

  /**
   * AI: Generate state report (TEA for Texas).
   *
   * @param {object} options
   * @param {string} options.reportType - Type of report
   * @param {string} [options.period] - Reporting period
   * @returns {object} State report
   */
  generateStateReport({ reportType, period = 'current' }) {
    this._ensureProvisioned();

    const analysis = this.analyzeDistrict();

    const report = {
      reportId: `STATE-${this.districtId}-${reportType}-${Date.now()}`,
      districtId: this.districtId,
      districtName: this.districtName,
      state: this.state,
      reportType,
      period,
      generatedAt: new Date().toISOString(),
      schoolYear: this.schoolYear,

      // Enrollment data
      enrollment: {
        totalStudents: analysis.totalStudents,
        totalTeachers: analysis.totalTeachers,
        schoolCount: analysis.schoolCount,
      },

      // Performance data
      performance: {
        avgAttendance: analysis.avgAttendance,
        avgPerformance: analysis.avgPerformance,
      },

      // Compliance
      complianceStatus: 'compliant',

      // AI Certification
      aiGenerated: true,
      meridianVersion: '1.0.0',
    };

    this._stateReports.push(report);

    this._touchAction();
    this._log('STATE_REPORT_GENERATED', { reportType, reportId: report.reportId });

    return report;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RESOURCE MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Set district budget.
   *
   * @param {object} budget
   * @param {number} budget.total - Total budget
   * @param {object} [budget.byCategory] - Budget by category
   * @returns {{ set: boolean, total: number }}
   */
  setBudget(budget) {
    this._ensureProvisioned();

    const { total, byCategory = {} } = budget;

    this._budget = {
      total,
      allocated: 0,
      remaining: total,
      byCategory,
      bySchool: {},
    };

    this._touchAction();
    this._log('BUDGET_SET', { total });

    return { set: true, total };
  }

  /**
   * Allocate budget to a school.
   *
   * @param {string} schoolId - School identifier
   * @param {number} amount - Amount to allocate
   * @param {string} [category='general'] - Budget category
   * @returns {{ allocated: boolean, schoolId: string, amount: number }}
   */
  allocateBudget(schoolId, amount, category = 'general') {
    this._ensureProvisioned();

    if (amount > this._budget.remaining) {
      return { allocated: false, error: 'Insufficient budget' };
    }

    if (!this._budget.bySchool[schoolId]) {
      this._budget.bySchool[schoolId] = { total: 0, byCategory: {} };
    }

    this._budget.bySchool[schoolId].total += amount;
    this._budget.bySchool[schoolId].byCategory[category] = 
      (this._budget.bySchool[schoolId].byCategory[category] || 0) + amount;

    this._budget.allocated += amount;
    this._budget.remaining -= amount;

    this._touchAction();
    this._log('BUDGET_ALLOCATED', { schoolId, amount, category });

    return { allocated: true, schoolId, amount };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // POLICY MANAGEMENT
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Create a district policy.
   *
   * @param {object} policy
   * @param {string} policy.policyId - Policy identifier
   * @param {string} policy.title - Policy title
   * @param {string} policy.content - Policy content
   * @param {string} [policy.category='general'] - Policy category
   * @param {string} [policy.effectiveDate] - When policy takes effect
   * @returns {{ created: boolean, policyId: string }}
   */
  createPolicy(policy) {
    this._ensureProvisioned();

    const { policyId, title, content, category = 'general', effectiveDate = null } = policy;

    if (!policyId) throw new Error('Policy requires a policyId');
    if (!title) throw new Error('Policy requires a title');
    if (!content) throw new Error('Policy requires content');

    const policyObj = {
      policyId,
      title,
      content,
      category,
      effectiveDate: effectiveDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      active: true,
    };

    this._policies.set(policyId, policyObj);

    // Push to all schools
    for (const [schoolId, school] of this._schools) {
      try {
        school.receiveDistrictDirective({
          type: 'POLICY_CHANGE',
          content: { title, description: content, policyId },
          mandatory: true,
        });
      } catch (e) {
        // Continue
      }
    }

    this._touchAction();
    this._log('POLICY_CREATED', { policyId, title, category });

    return { created: true, policyId };
  }

  /**
   * Add curriculum standard (TEKS for Texas).
   *
   * @param {object} standard
   * @param {string} standard.standardId - Standard identifier (e.g., 'MATH.6.2A')
   * @param {string} standard.subject - Subject area
   * @param {number} standard.grade - Grade level
   * @param {string} standard.description - Standard description
   * @returns {{ added: boolean, standardId: string }}
   */
  addCurriculumStandard(standard) {
    this._ensureProvisioned();

    const { standardId, subject, grade, description } = standard;

    if (!standardId) throw new Error('Standard requires a standardId');

    const standardObj = {
      standardId,
      subject,
      grade,
      description,
      state: this.state,
      addedAt: new Date().toISOString(),
    };

    this._curriculumStandards.set(standardId, standardObj);

    this._touchAction();
    this._log('CURRICULUM_STANDARD_ADDED', { standardId, subject, grade });

    return { added: true, standardId };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HDI — NATURAL LANGUAGE INTERFACE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Superintendent speaks to the district.
   * Natural language interface via HDI.
   *
   * @param {string} input - Natural language input
   * @returns {object} Response from the AI civilization
   */
  speak(input) {
    this._ensureProvisioned();

    // Route through HDI
    const response = this._hdi.query(input);

    // Log the interaction
    this._log('SUPERINTENDENT_SPEAKS', { input, responseType: response.intent });

    return {
      input,
      understood: true,
      response: response.response || 'Command processed by the AI civilization.',
      actions: response.actions || [],
      timestamp: new Date().toISOString(),
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ════════════════════════════════════════════════════════════════════════════

  /** @private */
  _ensureProvisioned() {
    if (!this._provisioned) {
      throw new Error(`GoldCanister ${this.canisterId} is not provisioned — call provision() first`);
    }
  }

  /** @private */
  _touchAction() {
    this._lastAction = new Date().toISOString();
  }

  /** @private */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({
        type,
        districtId: this.districtId,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /** @private */
  _defaultSchoolYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (month >= 7) {
      return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
  }

  /** @private */
  _registerCoreAgents() {
    // District-level AI agents
    const coreAgents = [
      { agentId: 'DIST-SUPERINTENDENT-AI', agentType: 'SUPERINTENDENT_AI', skills: ['leadership', 'strategy', 'communication'] },
      { agentId: 'DIST-CURRICULUM-AI', agentType: 'CURRICULUM_AI', skills: ['curriculum', 'standards', 'assessment'] },
      { agentId: 'DIST-HR-AI', agentType: 'HR_AI', skills: ['hiring', 'personnel', 'evaluation'] },
      { agentId: 'DIST-FINANCE-AI', agentType: 'FINANCE_AI', skills: ['budget', 'allocation', 'reporting'] },
      { agentId: 'DIST-COMPLIANCE-AI', agentType: 'COMPLIANCE_AI', skills: ['compliance', 'legal', 'ferpa', 'tea'] },
      { agentId: 'DIST-ANALYTICS-AI', agentType: 'ANALYTICS_AI', skills: ['analytics', 'trends', 'forecasting'] },
      { agentId: 'DIST-COMMUNICATIONS-AI', agentType: 'COMMUNICATIONS_AI', skills: ['communication', 'alerts', 'announcements'] },
      { agentId: 'DIST-SAFETY-AI', agentType: 'SAFETY_AI', skills: ['safety', 'security', 'emergency'] },
    ];

    for (const agent of coreAgents) {
      this.registerAgent({ ...agent, schoolId: 'DISTRICT' });
    }
  }

  /** @private */
  _generateDistrictRecommendations(schoolMetrics) {
    const recommendations = [];

    // Low attendance schools
    const lowAttendance = schoolMetrics.filter(m => 
      m.performance?.avgAttendance && m.performance.avgAttendance < 90
    );
    if (lowAttendance.length > 0) {
      recommendations.push({
        type: 'ATTENDANCE_INTERVENTION',
        priority: 'high',
        reason: `${lowAttendance.length} school(s) have attendance below 90%`,
        schools: lowAttendance.map(m => m.schoolId),
      });
    }

    // Low performance schools
    const lowPerformance = schoolMetrics.filter(m => 
      m.performance?.avgPerformance && m.performance.avgPerformance < 70
    );
    if (lowPerformance.length > 0) {
      recommendations.push({
        type: 'ACADEMIC_SUPPORT',
        priority: 'high',
        reason: `${lowPerformance.length} school(s) have performance below 70%`,
        schools: lowPerformance.map(m => m.schoolId),
      });
    }

    // High at-risk percentage
    const highAtRisk = schoolMetrics.filter(m => 
      m.atRisk?.atRiskPercent && m.atRisk.atRiskPercent > 20
    );
    if (highAtRisk.length > 0) {
      recommendations.push({
        type: 'INTERVENTION_PROGRAM',
        priority: 'high',
        reason: `${highAtRisk.length} school(s) have >20% at-risk students`,
        schools: highAtRisk.map(m => m.schoolId),
      });
    }

    return recommendations;
  }
}
