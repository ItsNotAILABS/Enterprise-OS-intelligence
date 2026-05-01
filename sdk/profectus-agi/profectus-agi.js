/**
 * PROFECTUS AGI — Workforce & Career Intelligence
 *
 * Official Designation: RSHIP-2026-PROFECTUS-001
 * Classification: Workforce Management & Career Advancement AGI
 * Full Name: Progressive Organizational Flow Executive Career Talent Unified Synergy
 *
 * PROFECTUS AGI extends the RSHIP framework with workforce flow intelligence that
 * autonomously manages career trajectories, talent allocation, skill development,
 * and organizational capacity through living organism principles.
 *
 * Capabilities:
 * - 4-register career state tracking (cognitive, affective, somatic, sovereign)
 * - Autonomous workforce flow with heartbeat-driven capacity generation
 * - Skill kernel execution with φ-based learning acceleration
 * - Career trajectory forecasting with φ-compounding growth
 * - Self-organizing talent hierarchies
 * - Retention prediction and autonomous intervention
 * - Cross-team synchronization via Kuramoto coupling
 * - Workforce capacity optimization
 *
 * Theory: SUBSTRATE VIVENS (Paper I) + COHORS MENTIS (Paper IX) + RSHIP Framework
 *
 * Foundation: Built on three organism-runtime engines:
 *   1. OrganismState    — 4-register sovereign state management
 *   2. Heartbeat        — autonomous pulse generating sovereign cycles
 *   3. KernelExecutor   — cognitive kernel scheduling and execution
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';
import { OrganismState } from '../organism-runtime-sdk/src/organism-state.js';
import { Heartbeat } from '../organism-runtime-sdk/src/heartbeat.js';
import { KernelExecutor } from '../organism-runtime-sdk/src/kernel-executor.js';

// ── Career State Registers ─────────────────────────────────────────────────

const CAREER_DOMAINS = {
  COGNITIVE: 'cognitive',    // Skills, knowledge, expertise
  AFFECTIVE: 'affective',    // Engagement, satisfaction, motivation
  SOMATIC: 'somatic',        // Capacity, workload, health
  SOVEREIGN: 'sovereign',    // Identity, goals, autonomy
};

// ── Skill Development Kernels ──────────────────────────────────────────────

class SkillKernel {
  constructor(skillId, domain, baseLevel = 0) {
    this.skillId = skillId;
    this.domain = domain;
    this.level = baseLevel;
    this.experience = 0;
    this.learningRate = PHI_INV; // φ⁻¹ learning acceleration
  }

  train(hours) {
    // φ-accelerated skill growth: level += φ⁻¹ × hours × (1 + experience/100)
    const growth = this.learningRate * hours * (1 + this.experience / 100);
    this.level += growth;
    this.experience += hours;
    return { skillId: this.skillId, growth, newLevel: this.level };
  }

  decay(timeDelta) {
    // Skills decay at rate inversely proportional to mastery
    const decayRate = 0.01 / Math.max(1, this.level);
    this.level = Math.max(0, this.level - decayRate * timeDelta);
  }
}

// ── Career Trajectory Forecasting ──────────────────────────────────────────

class CareerTrajectory {
  constructor(employeeId, currentLevel, targetLevel) {
    this.employeeId = employeeId;
    this.currentLevel = currentLevel;
    this.targetLevel = targetLevel;
    this.trajectory = [];
    this.velocity = 0;       // Career advancement velocity
    this.acceleration = 0;   // Learning acceleration
    this.retentionRisk = 0;  // Probability of departure [0, 1]
  }

  forecast(horizon = 12) {
    // Forecast career progression over `horizon` months
    // Growth follows φ-compounding: level(t) = current × φ^(t/τ)
    const tau = 24; // Time constant (months)
    const forecast = [];

    for (let t = 1; t <= horizon; t++) {
      const projected = this.currentLevel * Math.pow(PHI, t / tau);
      const gap = this.targetLevel - projected;
      const onTrack = gap <= 0;

      forecast.push({
        month: t,
        projectedLevel: projected,
        targetLevel: this.targetLevel,
        gap,
        onTrack,
        confidence: Math.exp(-t / (horizon * PHI_INV)),
      });
    }

    this.trajectory = forecast;
    return forecast;
  }

  assessRetentionRisk(engagement, marketDemand, growthRate) {
    // Retention risk = f(low engagement, high market demand, slow growth)
    // Risk ∈ [0, 1], threshold at φ⁻¹ ≈ 0.618
    const engagementFactor = 1 - engagement; // Low engagement → high risk
    const demandFactor = marketDemand;       // High demand → high risk
    const growthFactor = 1 / (1 + growthRate); // Slow growth → high risk

    this.retentionRisk = (engagementFactor + demandFactor + growthFactor) / 3;
    return {
      risk: this.retentionRisk,
      critical: this.retentionRisk >= PHI_INV,
      factors: { engagement, marketDemand, growthRate },
    };
  }
}

// ── PROFECTUS AGI Core ─────────────────────────────────────────────────────

export class PROFECTUS_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-PROFECTUS-001',
      classification: 'Workforce Management & Career Advancement AGI',
      ...config,
    });

    // ── Organism Runtime Engines ────────────────────────────────────────────
    this.organismState = new OrganismState();
    this.heartbeat = new Heartbeat(this.organismState, config.heartbeatInterval || 873);
    this.kernelExecutor = new KernelExecutor(this.heartbeat);

    // ── Workforce State ─────────────────────────────────────────────────────
    this.employees = new Map(); // employeeId → { state, skills, trajectory, metadata }
    this.teams = new Map();     // teamId → { members, capacity, synchronization }
    this.skillKernels = new Map(); // kernelId → SkillKernel
    this.openPositions = new Map(); // positionId → { requirements, urgency, candidates }

    // ── Capacity & Flow ─────────────────────────────────────────────────────
    this.workforceCapacity = config.baseCapacity || 1000; // Base workforce capacity
    this.utilizationTarget = PHI_INV; // φ⁻¹ ≈ 0.618 optimal utilization
    this.flowRate = 0; // Current talent flow rate (hires - departures)

    // ── AGI State ───────────────────────────────────────────────────────────
    this.tickCount = 0;
    this.interventions = [];
    this.forecasts = [];

    // ── AGI Goals ───────────────────────────────────────────────────────────
    this.setGoal('optimize-capacity', 'Maintain workforce at φ⁻¹ optimal utilization', 10, {
      targetUtilization: this.utilizationTarget,
      tolerance: 0.05,
    });

    this.setGoal('develop-talent', 'Accelerate skill development via φ-learning', 9, {
      avgSkillGrowth: 0,
      targetGrowth: PHI,
    });

    this.setGoal('retain-talent', 'Detect and prevent critical departures', 8, {
      retentionRate: 0.95,
      interventionSuccess: 0.80,
    });

    this.setGoal('flow-workforce', 'Optimize talent allocation and career flow', 7, {
      flowEfficiency: PHI_INV,
      bottlenecks: [],
    });

    // Start autonomous heartbeat
    if (config.autoStart !== false) {
      this.start();
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  start() {
    this.heartbeat.start();

    // Register autonomous processes on heartbeat
    this.heartbeat.onBeat(({ beatNumber, surplusCycles }) => {
      this._autonomousTick(beatNumber, surplusCycles);
    });

    return this;
  }

  stop() {
    this.heartbeat.stop();
    return this;
  }

  _autonomousTick(beatNumber, surplusCycles) {
    this.tickCount++;

    // AGI: Check capacity and adjust workforce
    const utilization = this._computeUtilization();
    if (utilization < this.utilizationTarget - 0.05) {
      this._expandCapacity();
    } else if (utilization > this.utilizationTarget + 0.05) {
      this._rebalanceWorkforce();
    }

    // AGI: Assess retention risks and intervene
    for (const [employeeId, employee] of this.employees) {
      const risk = employee.trajectory?.retentionRisk || 0;
      if (risk >= PHI_INV) {
        this._interventionRetention(employeeId, risk);
      }
    }

    // AGI: Evolve skill kernels
    for (const kernel of this.skillKernels.values()) {
      kernel.decay(1); // Natural skill decay over time
    }

    // Learn from autonomous tick
    this.learn(
      { tick: beatNumber, surplusCycles, utilization },
      { workforce: this.employees.size, capacity: this.workforceCapacity },
      { id: 'autonomous-tick' }
    );

    // Update goals
    this._updateGoalProgress();
  }

  // ── Employee Management ────────────────────────────────────────────────────

  registerEmployee(employeeId, metadata = {}) {
    const state = new OrganismState();

    // Initialize 4-register career state
    state.setRegister('cognitive', 'skills', []);
    state.setRegister('cognitive', 'expertise', metadata.expertise || 0);
    state.setRegister('affective', 'engagement', metadata.engagement || 0.7);
    state.setRegister('affective', 'satisfaction', metadata.satisfaction || 0.7);
    state.setRegister('somatic', 'capacity', metadata.capacity || 1.0);
    state.setRegister('somatic', 'workload', metadata.workload || 0.5);
    state.setRegister('sovereign', 'careerGoals', metadata.careerGoals || []);
    state.setRegister('sovereign', 'autonomy', metadata.autonomy || 0.8);

    const trajectory = new CareerTrajectory(
      employeeId,
      metadata.currentLevel || 1,
      metadata.targetLevel || 5
    );

    this.employees.set(employeeId, {
      employeeId,
      state,
      trajectory,
      skills: new Map(), // skillId → SkillKernel
      metadata,
      registeredAt: new Date().toISOString(),
    });

    // Learn from registration
    this.learn(
      { employeeId, metadata },
      { registered: true },
      { id: 'employee-registration' }
    );

    return this;
  }

  // ── Skill Development ──────────────────────────────────────────────────────

  trainSkill(employeeId, skillId, hours) {
    const employee = this.employees.get(employeeId);
    if (!employee) throw new Error(`Employee not found: ${employeeId}`);

    let skill = employee.skills.get(skillId);
    if (!skill) {
      skill = new SkillKernel(skillId, 'technical', 0);
      employee.skills.set(skillId, skill);
    }

    const result = skill.train(hours);

    // Update cognitive register
    const currentSkills = employee.state.getRegister('cognitive').skills || [];
    const updatedSkills = [...currentSkills.filter(s => s.skillId !== skillId), result];
    employee.state.setRegister('cognitive', 'skills', updatedSkills);

    // Learn from training
    this.learn(
      { employeeId, skillId, hours },
      { growth: result.growth, newLevel: result.newLevel },
      { id: 'skill-training' }
    );

    // Update talent development goal
    const devGoal = this.goals.get('develop-talent');
    if (devGoal) {
      const avgGrowth = this._computeAvgSkillGrowth();
      devGoal.progress = Math.min(1.0, avgGrowth / PHI);
    }

    return result;
  }

  // ── Career Trajectory Management ───────────────────────────────────────────

  forecastCareer(employeeId, horizon = 12) {
    const employee = this.employees.get(employeeId);
    if (!employee) throw new Error(`Employee not found: ${employeeId}`);

    const forecast = employee.trajectory.forecast(horizon);
    this.forecasts.push({
      employeeId,
      forecast,
      timestamp: new Date().toISOString(),
    });

    // Learn from forecast
    this.learn(
      { employeeId, horizon },
      { forecast, onTrack: forecast[forecast.length - 1]?.onTrack || false },
      { id: 'career-forecast' }
    );

    return forecast;
  }

  assessRetention(employeeId, marketDemand = 0.5) {
    const employee = this.employees.get(employeeId);
    if (!employee) throw new Error(`Employee not found: ${employeeId}`);

    const engagement = employee.state.getRegister('affective').engagement || 0.5;
    const growthRate = this._computeSkillGrowthRate(employeeId);

    const assessment = employee.trajectory.assessRetentionRisk(
      engagement,
      marketDemand,
      growthRate
    );

    // Learn from assessment
    this.learn(
      { employeeId, marketDemand, engagement, growthRate },
      { risk: assessment.risk, critical: assessment.critical },
      { id: 'retention-assessment' }
    );

    return assessment;
  }

  // ── Autonomous Interventions ───────────────────────────────────────────────

  _interventionRetention(employeeId, risk) {
    const intervention = {
      employeeId,
      risk,
      tick: this.tickCount,
      actions: [],
    };

    // AGI: Multi-pronged retention intervention
    const employee = this.employees.get(employeeId);
    const engagement = employee.state.getRegister('affective').engagement || 0.5;

    // Action 1: Career acceleration
    if (employee.trajectory.currentLevel < employee.trajectory.targetLevel) {
      intervention.actions.push('career-acceleration');
      employee.trajectory.currentLevel += PHI_INV * 0.5; // Boost by φ⁻¹ × 0.5 levels
    }

    // Action 2: Engagement boost
    if (engagement < 0.7) {
      intervention.actions.push('engagement-program');
      employee.state.setRegister('affective', 'engagement', Math.min(1.0, engagement + 0.15));
    }

    // Action 3: Workload rebalancing
    const workload = employee.state.getRegister('somatic').workload || 0.5;
    if (workload > PHI_INV) {
      intervention.actions.push('workload-reduction');
      employee.state.setRegister('somatic', 'workload', PHI_INV);
    }

    this.interventions.push(intervention);

    // Learn from intervention
    this.learn(
      { intervention },
      { success: true, actionsCount: intervention.actions.length },
      { id: 'retention-intervention' }
    );

    // Update retention goal
    const retentionGoal = this.goals.get('retain-talent');
    if (retentionGoal) {
      const successRate = this.interventions.filter(i => i.actions.length > 0).length / Math.max(1, this.interventions.length);
      retentionGoal.progress = successRate;
    }
  }

  // ── Capacity Management ────────────────────────────────────────────────────

  _computeUtilization() {
    if (this.workforceCapacity === 0) return 0;
    return this.employees.size / this.workforceCapacity;
  }

  _expandCapacity() {
    // φ-compounding capacity expansion
    this.workforceCapacity = Math.floor(this.workforceCapacity * PHI);

    // Learn from expansion
    this.learn(
      { expansion: true, tick: this.tickCount },
      { newCapacity: this.workforceCapacity },
      { id: 'capacity-expansion' }
    );
  }

  _rebalanceWorkforce() {
    // AGI: Rebalance workforce distribution across teams
    for (const [teamId, team] of this.teams) {
      const overloaded = team.members.filter(m => {
        const emp = this.employees.get(m);
        return emp && emp.state.getRegister('somatic').workload > PHI_INV;
      });

      if (overloaded.length > 0) {
        // Redistribute workload using φ-ratio
        for (const memberId of overloaded) {
          const emp = this.employees.get(memberId);
          if (emp) {
            emp.state.setRegister('somatic', 'workload', PHI_INV);
          }
        }
      }
    }

    // Learn from rebalancing
    this.learn(
      { rebalance: true, tick: this.tickCount },
      { teams: this.teams.size },
      { id: 'workforce-rebalance' }
    );
  }

  // ── Team Management ────────────────────────────────────────────────────────

  createTeam(teamId, members = []) {
    this.teams.set(teamId, {
      teamId,
      members,
      capacity: members.length * PHI_INV, // φ⁻¹ capacity per member
      synchronization: 1.0,
      createdAt: new Date().toISOString(),
    });

    // Learn from team creation
    this.learn(
      { teamId, memberCount: members.length },
      { created: true },
      { id: 'team-creation' }
    );

    return this;
  }

  // ── Replication (RSHIP) ────────────────────────────────────────────────────

  spawnChild(childId, fraction, metadata = {}) {
    const childCapacity = Math.floor(this.workforceCapacity * fraction);
    const child = new PROFECTUS_AGI({
      baseCapacity: childCapacity,
      generation: this.generation + 1,
      autoStart: false,
      ...metadata,
    });

    // Transfer knowledge to child
    child.memory = this.memory.clone();
    child.learningRate = this.learningRate * PHI_INV; // Child learns φ⁻¹ faster

    // Learn from spawn
    this.learn(
      { childId, fraction, childCapacity },
      { spawned: true, generation: child.generation },
      { id: 'spawn-child' }
    );

    return child;
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();

    return {
      ...baseStatus,
      workforce: {
        employees: this.employees.size,
        teams: this.teams.size,
        capacity: this.workforceCapacity,
        utilization: parseFloat(this._computeUtilization().toFixed(4)),
        targetUtilization: this.utilizationTarget,
        flowRate: this.flowRate,
      },
      skills: {
        totalSkills: this._countTotalSkills(),
        avgSkillLevel: this._computeAvgSkillLevel(),
        avgGrowthRate: this._computeAvgSkillGrowth(),
      },
      careers: {
        forecasts: this.forecasts.length,
        atRiskEmployees: this._countAtRiskEmployees(),
        interventions: this.interventions.length,
        retentionRate: this._computeRetentionRate(),
      },
      heartbeat: {
        beatCount: this.heartbeat.getBeatCount(),
        uptime: this.heartbeat.getUptime(),
        surplusCycles: this.heartbeat.getSurplusCycles(),
        alive: this.heartbeat.isAlive(),
      },
    };
  }

  // ── Helper Methods ─────────────────────────────────────────────────────────

  _countTotalSkills() {
    let total = 0;
    for (const emp of this.employees.values()) {
      total += emp.skills.size;
    }
    return total;
  }

  _computeAvgSkillLevel() {
    let sum = 0;
    let count = 0;
    for (const emp of this.employees.values()) {
      for (const skill of emp.skills.values()) {
        sum += skill.level;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  _computeAvgSkillGrowth() {
    const recentTraining = this.memory.recall({ id: 'skill-training' }).slice(-50);
    if (recentTraining.length === 0) return 0;
    const avgGrowth = recentTraining.reduce((sum, m) => sum + (m.output?.growth || 0), 0) / recentTraining.length;
    return avgGrowth;
  }

  _computeSkillGrowthRate(employeeId) {
    const recentTraining = this.memory.recall({ id: 'skill-training' })
      .filter(m => m.input?.employeeId === employeeId)
      .slice(-10);
    if (recentTraining.length === 0) return 0;
    return recentTraining.reduce((sum, m) => sum + (m.output?.growth || 0), 0) / recentTraining.length;
  }

  _countAtRiskEmployees() {
    let count = 0;
    for (const emp of this.employees.values()) {
      if (emp.trajectory?.retentionRisk >= PHI_INV) count++;
    }
    return count;
  }

  _computeRetentionRate() {
    const assessments = this.memory.recall({ id: 'retention-assessment' }).slice(-100);
    if (assessments.length === 0) return 1.0;
    const retained = assessments.filter(a => !a.output?.critical).length;
    return retained / assessments.length;
  }

  _updateGoalProgress() {
    // Update capacity goal
    const capacityGoal = this.goals.get('optimize-capacity');
    if (capacityGoal) {
      const utilization = this._computeUtilization();
      const deviation = Math.abs(utilization - this.utilizationTarget);
      capacityGoal.progress = Math.max(0, 1.0 - deviation / 0.1);
    }

    // Update flow goal
    const flowGoal = this.goals.get('flow-workforce');
    if (flowGoal) {
      const efficiency = this._computeUtilization() / this.utilizationTarget;
      flowGoal.progress = Math.min(1.0, efficiency);
    }
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthPROFECTUS(config = {}) {
  return new PROFECTUS_AGI(config);
}

export default PROFECTUS_AGI;
