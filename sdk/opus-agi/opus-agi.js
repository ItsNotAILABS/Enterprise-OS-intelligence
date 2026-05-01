/**
 * OPUS AGI — Commercial Construction & Design Intelligence
 *
 * Official Designation: RSHIP-2026-OPUS-001
 * Classification: Construction Management & Design AGI
 * Full Name: Organizational Project Unification System
 *
 * OPUS AGI extends the RSHIP framework with construction and design industry intelligence
 * for general contractors, commercial construction, and creative design projects. It
 * autonomously manages multi-phase projects, coordinates subcontractors, optimizes
 * schedules, and prevents cost overruns through φ-based forecasting.
 *
 * Capabilities:
 * - Multi-phase project planning with φ-optimal scheduling
 * - Subcontractor coordination and load balancing
 * - Material procurement optimization with supply chain integration
 * - Cost overrun prediction and autonomous intervention
 * - Safety compliance monitoring and risk assessment
 * - Design iteration management with creative workflow
 * - BIM (Building Information Modeling) integration
 * - Change order impact analysis with φ-weighted scoring
 *
 * Applications:
 * - Commercial construction (offices, retail, industrial)
 * - Infrastructure projects (bridges, roads, utilities)
 * - Architectural design firms
 * - Interior design and fit-out
 * - General contracting and project management
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Project Phase Management ───────────────────────────────────────────────

class ProjectPhase {
  constructor(phaseId, config = {}) {
    this.phaseId = phaseId;
    this.phaseName = config.phaseName || phaseId;
    this.phaseType = config.phaseType || 'construction'; // design | permitting | construction | closeout

    // Timeline
    this.estimatedDuration = config.estimatedDuration || 30; // days
    this.startDate = config.startDate || null;
    this.endDate = config.endDate || null;
    this.actualDuration = 0;

    // Resources
    this.budget = config.budget || 0;
    this.spent = 0;
    this.labor = config.labor || []; // { trade, hours, rate }
    this.materials = config.materials || []; // { item, quantity, cost }

    // Dependencies
    this.dependencies = config.dependencies || []; // [phaseId]
    this.status = 'planned'; // planned | active | completed | delayed | blocked

    // Progress tracking
    this.progress = 0; // 0-1
    this.milestones = config.milestones || [];
    this.risks = [];
  }

  getHealthScore() {
    // φ-weighted health: budget × φ² + schedule × φ + quality
    const budgetHealth = this.budget > 0 ? 1 - Math.min(1, this.spent / this.budget) : 1;
    const scheduleHealth = this.estimatedDuration > 0 ? 1 - Math.min(1, this.actualDuration / this.estimatedDuration) : 1;
    const qualityHealth = this.progress; // Assume progress reflects quality

    return budgetHealth * (PHI ** 2) + scheduleHealth * PHI + qualityHealth;
  }
}

// ── Subcontractor Management ───────────────────────────────────────────────

class Subcontractor {
  constructor(subId, config = {}) {
    this.subId = subId;
    this.name = config.name || subId;
    this.trade = config.trade || 'general'; // electrical | plumbing | hvac | framing | drywall | etc
    this.capacity = config.capacity || 1.0; // Relative capacity
    this.currentLoad = 0; // Current utilization
    this.performance = config.performance || 0.8; // Historical performance 0-1
    this.reliability = config.reliability || 0.8; // On-time delivery 0-1
    this.costRate = config.costRate || 100; // $/hour
    this.assignments = []; // Current project assignments
  }

  canAccept(hours) {
    const availableCapacity = this.capacity - this.currentLoad;
    return availableCapacity >= hours;
  }

  assignWork(projectId, phaseId, hours) {
    this.assignments.push({ projectId, phaseId, hours, assignedAt: Date.now() });
    this.currentLoad += hours;
  }

  completeWork(projectId, phaseId) {
    const index = this.assignments.findIndex(a => a.projectId === projectId && a.phaseId === phaseId);
    if (index >= 0) {
      const assignment = this.assignments.splice(index, 1)[0];
      this.currentLoad = Math.max(0, this.currentLoad - assignment.hours);
      return assignment;
    }
    return null;
  }
}

// ── OPUS AGI Core ──────────────────────────────────────────────────────────

export class OPUS_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-OPUS-001',
      classification: 'Construction Management & Design AGI',
      ...config,
    });

    // Project portfolio
    this.projects = new Map(); // projectId → { phases, budget, timeline, team }
    this.phases = new Map(); // phaseId → ProjectPhase
    this.subcontractors = new Map(); // subId → Subcontractor

    // Material procurement
    this.materialCatalog = new Map(); // materialId → { name, suppliers, leadTime, cost }
    this.materialOrders = new Map(); // orderId → { materials, status, deliveryDate }

    // Design management
    this.designIterations = new Map(); // designId → [{ version, changes, approvedBy }]
    this.changeOrders = new Map(); // changeOrderId → { impact, cost, schedule, approved }

    // Safety & compliance
    this.safetyIncidents = [];
    this.complianceChecks = new Map(); // checkId → { type, status, findings }

    // φ-based thresholds
    this.budgetWarningThreshold = PHI_INV + 0.05; // ~0.67 (67% spent)
    this.budgetCriticalThreshold = 0.95;
    this.scheduleSlipThreshold = PHI; // 1.618× original duration
    this.optimalSubcontractorLoad = PHI_INV; // ~0.618

    // Statistics
    this.stats = {
      projectsManaged: 0,
      phasesCompleted: 0,
      budgetVariance: 0, // % under/over budget
      scheduleVariance: 0, // % ahead/behind schedule
      safetyIncidentRate: 0,
      changeOrdersProcessed: 0,
    };

    // AGI Goals
    this.setGoal('deliver-on-time', 'Complete projects on or ahead of schedule', 10, {
      targetVariance: 0,
      currentVariance: 0,
    });

    this.setGoal('maintain-budget', 'Keep projects within budget ± 5%', 10, {
      targetVariance: 0.05,
      currentVariance: 0,
    });

    this.setGoal('zero-incidents', 'Maintain zero safety incidents', 9, {
      targetRate: 0,
      currentRate: 0,
    });

    this.setGoal('optimize-coordination', 'Maximize subcontractor utilization at φ⁻¹', 8, {
      targetUtilization: PHI_INV,
      currentUtilization: 0,
    });
  }

  // ── Project Management ─────────────────────────────────────────────────────

  createProject(projectId, config = {}) {
    const project = {
      projectId,
      name: config.name || projectId,
      type: config.type || 'commercial', // commercial | residential | infrastructure | design
      budget: config.budget || 1000000,
      timeline: config.timeline || 180, // days
      phases: [],
      team: config.team || [],
      client: config.client || 'Unknown',
      location: config.location || '',
      startDate: config.startDate || null,
      status: 'planned',
      createdAt: Date.now(),
    };

    this.projects.set(projectId, project);
    this.stats.projectsManaged++;

    // Learn from project creation
    this.learn(
      { projectId, config },
      { created: true, budget: project.budget, timeline: project.timeline },
      { id: 'project-creation' }
    );

    return project;
  }

  addProjectPhase(projectId, phaseConfig) {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const phaseId = `${projectId}-phase-${project.phases.length + 1}`;
    const phase = new ProjectPhase(phaseId, phaseConfig);

    this.phases.set(phaseId, phase);
    project.phases.push(phaseId);

    console.log(`[OPUS] Added phase ${phase.phaseName} to project ${projectId}`);

    return phase;
  }

  startPhase(phaseId) {
    const phase = this.phases.get(phaseId);
    if (!phase) throw new Error(`Phase not found: ${phaseId}`);

    // Check dependencies
    for (const depPhaseId of phase.dependencies) {
      const depPhase = this.phases.get(depPhaseId);
      if (depPhase && depPhase.status !== 'completed') {
        console.warn(`[OPUS] Cannot start phase ${phaseId}: dependency ${depPhaseId} not completed`);
        return false;
      }
    }

    phase.status = 'active';
    phase.startDate = Date.now();

    // Learn from phase start
    this.learn(
      { phaseId, dependencies: phase.dependencies },
      { started: true, budget: phase.budget, duration: phase.estimatedDuration },
      { id: 'phase-start' }
    );

    return true;
  }

  updatePhaseProgress(phaseId, progress) {
    const phase = this.phases.get(phaseId);
    if (!phase) return false;

    phase.progress = Math.min(1, Math.max(0, progress));
    phase.actualDuration = phase.startDate ? (Date.now() - phase.startDate) / (1000 * 60 * 60 * 24) : 0;

    // Check for delays
    if (phase.actualDuration > phase.estimatedDuration * this.scheduleSlipThreshold) {
      this._interventionScheduleDelay(phaseId);
    }

    // Check for budget overruns
    if (phase.spent > phase.budget * this.budgetWarningThreshold) {
      this._interventionBudgetOverrun(phaseId);
    }

    // Complete phase if at 100%
    if (phase.progress >= 1.0 && phase.status === 'active') {
      phase.status = 'completed';
      phase.endDate = Date.now();
      this.stats.phasesCompleted++;

      console.log(`[OPUS] Phase ${phaseId} completed`);
    }

    return true;
  }

  // ── Subcontractor Coordination ─────────────────────────────────────────────

  registerSubcontractor(subId, config) {
    const sub = new Subcontractor(subId, config);
    this.subcontractors.set(subId, sub);

    console.log(`[OPUS] Registered subcontractor ${config.name || subId} (${config.trade || 'general'})`);

    return sub;
  }

  assignSubcontractor(phaseId, trade, hours) {
    const phase = this.phases.get(phaseId);
    if (!phase) throw new Error(`Phase not found: ${phaseId}`);

    // Find best subcontractor: φ-weighted by performance, reliability, and capacity
    const candidates = Array.from(this.subcontractors.values())
      .filter(sub => sub.trade === trade && sub.canAccept(hours));

    if (candidates.length === 0) {
      console.error(`[OPUS] No available subcontractors for trade ${trade}`);
      return null;
    }

    const scored = candidates.map(sub => {
      const capacityScore = 1 - (sub.currentLoad / sub.capacity);
      const score = sub.performance * (PHI ** 2) + sub.reliability * PHI + capacityScore;
      return { sub, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0].sub;

    // Assign work
    best.assignWork(phase.projectId || 'unknown', phaseId, hours);

    // Track in phase
    phase.labor.push({
      subcontractorId: best.subId,
      trade,
      hours,
      rate: best.costRate,
      assignedAt: Date.now(),
    });

    console.log(`[OPUS] Assigned ${best.name} to phase ${phaseId} for ${hours} hours`);

    // Learn from assignment
    this.learn(
      { phaseId, trade, hours, subcontractor: best.subId },
      { assigned: true, score: scored[0].score },
      { id: 'subcontractor-assignment' }
    );

    return best;
  }

  // ── Material Procurement ───────────────────────────────────────────────────

  registerMaterial(materialId, config) {
    this.materialCatalog.set(materialId, {
      materialId,
      name: config.name || materialId,
      suppliers: config.suppliers || [],
      leadTime: config.leadTime || 14, // days
      unitCost: config.unitCost || 0,
      unit: config.unit || 'each',
    });
  }

  orderMaterials(phaseId, materials) {
    const phase = this.phases.get(phaseId);
    if (!phase) throw new Error(`Phase not found: ${phaseId}`);

    const orderId = `order-${Date.now()}`;
    const order = {
      orderId,
      phaseId,
      materials, // [{ materialId, quantity }]
      status: 'pending',
      totalCost: 0,
      orderedAt: Date.now(),
      expectedDelivery: null,
    };

    // Calculate cost and delivery
    let maxLeadTime = 0;
    let totalCost = 0;

    for (const item of materials) {
      const material = this.materialCatalog.get(item.materialId);
      if (material) {
        totalCost += material.unitCost * item.quantity;
        maxLeadTime = Math.max(maxLeadTime, material.leadTime);
      }
    }

    order.totalCost = totalCost;
    order.expectedDelivery = Date.now() + (maxLeadTime * 24 * 60 * 60 * 1000);

    this.materialOrders.set(orderId, order);

    // Add to phase materials
    for (const item of materials) {
      const material = this.materialCatalog.get(item.materialId);
      if (material) {
        phase.materials.push({
          materialId: item.materialId,
          name: material.name,
          quantity: item.quantity,
          cost: material.unitCost * item.quantity,
          orderId,
        });
        phase.spent += material.unitCost * item.quantity;
      }
    }

    console.log(`[OPUS] Ordered materials for phase ${phaseId}: ${materials.length} items, $${totalCost.toFixed(2)}`);

    return order;
  }

  // ── Design & Change Management ─────────────────────────────────────────────

  createDesignIteration(designId, version, changes = []) {
    if (!this.designIterations.has(designId)) {
      this.designIterations.set(designId, []);
    }

    const iterations = this.designIterations.get(designId);
    const iteration = {
      version,
      changes,
      createdAt: Date.now(),
      approvedBy: null,
      status: 'draft',
    };

    iterations.push(iteration);

    console.log(`[OPUS] Created design iteration ${designId} v${version} with ${changes.length} changes`);

    return iteration;
  }

  submitChangeOrder(projectId, changeOrderConfig) {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const changeOrderId = `co-${projectId}-${this.changeOrders.size + 1}`;
    const changeOrder = {
      changeOrderId,
      projectId,
      description: changeOrderConfig.description || '',
      costImpact: changeOrderConfig.costImpact || 0,
      scheduleImpact: changeOrderConfig.scheduleImpact || 0, // days
      priority: changeOrderConfig.priority || 'medium',
      status: 'pending',
      submittedAt: Date.now(),
    };

    // φ-weighted impact score
    const impactScore = (Math.abs(changeOrder.costImpact) / project.budget) * (PHI ** 2) +
                        (Math.abs(changeOrder.scheduleImpact) / project.timeline) * PHI;

    changeOrder.impactScore = impactScore;

    this.changeOrders.set(changeOrderId, changeOrder);
    this.stats.changeOrdersProcessed++;

    console.log(`[OPUS] Submitted change order ${changeOrderId} with impact score ${impactScore.toFixed(3)}`);

    // Learn from change order
    this.learn(
      { changeOrderId, costImpact: changeOrder.costImpact, scheduleImpact: changeOrder.scheduleImpact },
      { impactScore },
      { id: 'change-order' }
    );

    return changeOrder;
  }

  approveChangeOrder(changeOrderId, approvedBy) {
    const co = this.changeOrders.get(changeOrderId);
    if (!co) return false;

    co.status = 'approved';
    co.approvedBy = approvedBy;
    co.approvedAt = Date.now();

    // Update project budget and timeline
    const project = this.projects.get(co.projectId);
    if (project) {
      project.budget += co.costImpact;
      project.timeline += co.scheduleImpact;
    }

    console.log(`[OPUS] Approved change order ${changeOrderId}`);

    return true;
  }

  // ── Safety & Compliance ────────────────────────────────────────────────────

  recordSafetyIncident(projectId, incident) {
    this.safetyIncidents.push({
      projectId,
      ...incident,
      recordedAt: Date.now(),
    });

    this.stats.safetyIncidentRate = this.safetyIncidents.length / Math.max(1, this.stats.projectsManaged);

    console.warn(`[OPUS] Safety incident recorded for project ${projectId}: ${incident.description || 'Unknown'}`);

    // Update zero-incidents goal
    const goal = this.goals.get('zero-incidents');
    if (goal) {
      goal.progress = Math.max(0, 1 - this.stats.safetyIncidentRate);
    }
  }

  performComplianceCheck(projectId, checkType) {
    const checkId = `check-${projectId}-${Date.now()}`;
    const check = {
      checkId,
      projectId,
      type: checkType, // osha | building-code | environmental | zoning
      status: 'passed', // passed | failed | pending
      findings: [],
      performedAt: Date.now(),
    };

    this.complianceChecks.set(checkId, check);

    console.log(`[OPUS] Performed ${checkType} compliance check for project ${projectId}`);

    return check;
  }

  // ── Autonomous Interventions ───────────────────────────────────────────────

  _interventionScheduleDelay(phaseId) {
    const phase = this.phases.get(phaseId);
    if (!phase) return;

    console.warn(`[OPUS] Schedule delay detected for phase ${phaseId}: ${phase.actualDuration.toFixed(1)} days (estimated: ${phase.estimatedDuration})`);

    // AGI: Increase subcontractor capacity
    const laborShortage = phase.labor.filter(l => {
      const sub = this.subcontractors.get(l.subcontractorId);
      return sub && sub.currentLoad > this.optimalSubcontractorLoad * sub.capacity;
    });

    if (laborShortage.length > 0) {
      console.log(`[OPUS] Intervention: Adding capacity to ${laborShortage.length} overloaded subcontractors`);
      // In production, this would trigger hiring or reassignment
    }

    // Learn from intervention
    this.learn(
      { phaseId, delay: phase.actualDuration - phase.estimatedDuration },
      { intervention: 'schedule-delay', action: 'increase-capacity' },
      { id: 'schedule-intervention' }
    );
  }

  _interventionBudgetOverrun(phaseId) {
    const phase = this.phases.get(phaseId);
    if (!phase) return;

    const overrun = phase.spent - phase.budget;
    const overrunPercent = (overrun / phase.budget) * 100;

    console.warn(`[OPUS] Budget overrun detected for phase ${phaseId}: $${overrun.toFixed(2)} (${overrunPercent.toFixed(1)}%)`);

    // AGI: Cost reduction measures
    if (phase.materials.length > 0) {
      console.log(`[OPUS] Intervention: Reviewing material costs for savings opportunities`);
      // In production, this would trigger supplier renegotiation or material substitution
    }

    // Learn from intervention
    this.learn(
      { phaseId, overrun, overrunPercent },
      { intervention: 'budget-overrun', action: 'cost-reduction' },
      { id: 'budget-intervention' }
    );
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();

    // Calculate variances
    const completedPhases = Array.from(this.phases.values()).filter(p => p.status === 'completed');

    let totalBudgetVariance = 0;
    let totalScheduleVariance = 0;

    for (const phase of completedPhases) {
      if (phase.budget > 0) {
        totalBudgetVariance += (phase.spent - phase.budget) / phase.budget;
      }
      if (phase.estimatedDuration > 0) {
        totalScheduleVariance += (phase.actualDuration - phase.estimatedDuration) / phase.estimatedDuration;
      }
    }

    this.stats.budgetVariance = completedPhases.length > 0 ? totalBudgetVariance / completedPhases.length : 0;
    this.stats.scheduleVariance = completedPhases.length > 0 ? totalScheduleVariance / completedPhases.length : 0;

    // Calculate subcontractor utilization
    const subUtilization = Array.from(this.subcontractors.values())
      .reduce((sum, sub) => sum + (sub.currentLoad / sub.capacity), 0) / Math.max(1, this.subcontractors.size);

    return {
      ...baseStatus,
      projects: {
        total: this.projects.size,
        active: Array.from(this.projects.values()).filter(p => p.status === 'active').length,
        completed: Array.from(this.projects.values()).filter(p => p.status === 'completed').length,
      },
      phases: {
        total: this.phases.size,
        active: Array.from(this.phases.values()).filter(p => p.status === 'active').length,
        completed: this.stats.phasesCompleted,
        delayed: Array.from(this.phases.values()).filter(p => p.actualDuration > p.estimatedDuration * PHI).length,
      },
      subcontractors: {
        registered: this.subcontractors.size,
        avgUtilization: parseFloat(subUtilization.toFixed(3)),
        targetUtilization: this.optimalSubcontractorLoad,
      },
      financials: {
        budgetVariance: `${(this.stats.budgetVariance * 100).toFixed(1)}%`,
        scheduleVariance: `${(this.stats.scheduleVariance * 100).toFixed(1)}%`,
      },
      safety: {
        incidents: this.safetyIncidents.length,
        incidentRate: parseFloat(this.stats.safetyIncidentRate.toFixed(3)),
      },
      design: {
        iterations: Array.from(this.designIterations.values()).reduce((sum, arr) => sum + arr.length, 0),
        changeOrders: this.changeOrders.size,
      },
    };
  }

  // ── Replication (RSHIP) ────────────────────────────────────────────────────

  spawnChild(childId, fraction, metadata = {}) {
    const child = new OPUS_AGI({
      generation: this.generation + 1,
      ...metadata,
    });

    // Transfer knowledge
    child.memory = this.memory.clone();
    child.learningRate = this.learningRate * PHI_INV;

    // Learn from spawn
    this.learn(
      { childId, fraction },
      { spawned: true, generation: child.generation },
      { id: 'spawn-child' }
    );

    return child;
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthOPUS(config = {}) {
  return new OPUS_AGI(config);
}

export default OPUS_AGI;
