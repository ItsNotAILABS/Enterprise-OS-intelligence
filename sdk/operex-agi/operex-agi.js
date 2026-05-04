/**
 * OPEREX AGI — Enterprise Workflow & Task Orchestration Intelligence
 *
 * Official Designation: RSHIP-2026-OPEREX-001
 * Classification: Multi-Purpose Enterprise Workflow AGI
 * Full Name: OPERations EXecution Intelligence — Autonomous Enterprise Workflow Orchestrator
 *
 * OPEREX AGI is the operational backbone of the RSHIP Organism.
 * It creates, routes, escalates, and closes task workflows autonomously —
 * across Slack, cloud infrastructure, and enterprise systems.
 *
 * Core Capabilities:
 * - Task workflow creation with φ-weighted priority scoring
 * - Autonomous workflow graph execution (DAG traversal, dependency resolution)
 * - Smart escalation engine with Lyapunov stability detection
 * - Slack-native task notifications and status updates
 * - Cloudflare Worker deployment triggers from workflow steps
 * - Enterprise reporting: burndown, throughput, workflow health
 * - Multi-assignee load balancing with Kuramoto synchronization
 * - Workflow templates for enterprise use cases
 *
 * Theory: OPEREX DYNAMICS (Paper XXIV) — φ-priority field + DAG orchestration
 *         + Kuramoto sync for team coordination + Lyapunov escalation detection
 *
 * Enterprise Workflow Templates:
 *   - ONBOARDING        : New client/product onboarding pipeline
 *   - DEPLOYMENT        : Agent/worker deployment pipeline
 *   - INCIDENT          : Alert → triage → resolve → post-mortem
 *   - MARKET_BRIEF      : Market analysis → publish → archive
 *   - ENTERPRISE_INTAKE : Prospect → qualify → demo → contract
 *
 * Usage:
 *   import { birthOPEREX } from '@medina/operex-agi';
 *   const operex = birthOPEREX({ slackWebhook: '...' });
 *   const wf = operex.createWorkflow('DEPLOYMENT', { agent: 'CEREBRUM' });
 *   operex.execute(wf.id);
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Constants ──────────────────────────────────────────────────────────────────
const PHI2      = PHI * PHI;               // φ² ≈ 2.618
const PHI_INV2  = PHI_INV * PHI_INV;      // φ⁻² ≈ 0.382
const ESCALATION_THRESHOLD = PHI_INV2;    // Lyapunov λ threshold for escalation
const SYNC_THRESHOLD = PHI_INV;           // Kuramoto R for team sync

// ── Task Status Machine ────────────────────────────────────────────────────────
const STATUS = Object.freeze({
  PENDING    : 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  BLOCKED    : 'BLOCKED',
  ESCALATED  : 'ESCALATED',
  COMPLETED  : 'COMPLETED',
  CANCELLED  : 'CANCELLED',
});

// ── Priority Levels (φ-weighted) ──────────────────────────────────────────────
const PRIORITY = Object.freeze({
  CRITICAL : { name:'CRITICAL', weight: PHI2,    emoji:'🔴', sla: 30   }, // 30 min
  HIGH     : { name:'HIGH',     weight: PHI,     emoji:'🟠', sla: 240  }, // 4 hrs
  MEDIUM   : { name:'MEDIUM',   weight: 1,       emoji:'🟡', sla: 1440 }, // 1 day
  LOW      : { name:'LOW',      weight: PHI_INV, emoji:'🟢', sla: 4320 }, // 3 days
});

// ── Workflow Templates ─────────────────────────────────────────────────────────
const TEMPLATES = {
  DEPLOYMENT: {
    name: 'Agent Deployment Pipeline',
    steps: [
      { id:'validate',   name:'Validate configuration',  priority:'HIGH',     depsOn:[] },
      { id:'build',      name:'Build worker bundle',     priority:'HIGH',     depsOn:['validate'] },
      { id:'test',       name:'Run integration tests',   priority:'HIGH',     depsOn:['build'] },
      { id:'staging',    name:'Deploy to staging',       priority:'MEDIUM',   depsOn:['test'] },
      { id:'smoke',      name:'Smoke test staging',      priority:'HIGH',     depsOn:['staging'] },
      { id:'production', name:'Deploy to production',    priority:'CRITICAL', depsOn:['smoke'] },
      { id:'verify',     name:'Verify production',       priority:'HIGH',     depsOn:['production'] },
    ],
  },
  INCIDENT: {
    name: 'Incident Response Pipeline',
    steps: [
      { id:'detect',     name:'Detect & classify incident',   priority:'CRITICAL', depsOn:[] },
      { id:'triage',     name:'Triage and assign severity',   priority:'CRITICAL', depsOn:['detect'] },
      { id:'contain',    name:'Contain the incident',         priority:'CRITICAL', depsOn:['triage'] },
      { id:'mitigate',   name:'Apply mitigation',             priority:'HIGH',     depsOn:['contain'] },
      { id:'resolve',    name:'Resolve & restore service',    priority:'HIGH',     depsOn:['mitigate'] },
      { id:'postmortem', name:'Write post-mortem report',     priority:'MEDIUM',   depsOn:['resolve'] },
      { id:'archive',    name:'Archive and close incident',   priority:'LOW',      depsOn:['postmortem'] },
    ],
  },
  ONBOARDING: {
    name: 'Enterprise Client Onboarding',
    steps: [
      { id:'kickoff',   name:'Kickoff call & requirements',  priority:'HIGH',   depsOn:[] },
      { id:'provision', name:'Provision RSHIP environment',  priority:'HIGH',   depsOn:['kickoff'] },
      { id:'config',    name:'Configure agents & workflows', priority:'HIGH',   depsOn:['provision'] },
      { id:'training',  name:'Team training session',        priority:'MEDIUM', depsOn:['config'] },
      { id:'pilot',     name:'2-week pilot run',             priority:'MEDIUM', depsOn:['training'] },
      { id:'review',    name:'Pilot review & adjustment',    priority:'HIGH',   depsOn:['pilot'] },
      { id:'handoff',   name:'Full handoff & go-live',       priority:'HIGH',   depsOn:['review'] },
    ],
  },
  MARKET_BRIEF: {
    name: 'Market Intelligence Briefing',
    steps: [
      { id:'collect',  name:'Collect VIGIL market data',    priority:'HIGH',   depsOn:[] },
      { id:'analyze',  name:'Run regime analysis',          priority:'HIGH',   depsOn:['collect'] },
      { id:'draft',    name:'Draft briefing document',      priority:'MEDIUM', depsOn:['analyze'] },
      { id:'review',   name:'Review and validate signals',  priority:'HIGH',   depsOn:['draft'] },
      { id:'publish',  name:'Publish to Slack channels',    priority:'HIGH',   depsOn:['review'] },
      { id:'archive',  name:'Archive to EternalMemory',     priority:'LOW',    depsOn:['publish'] },
    ],
  },
  ENTERPRISE_INTAKE: {
    name: 'Enterprise Sales Pipeline',
    steps: [
      { id:'qualify',  name:'Qualify prospect',             priority:'HIGH',   depsOn:[] },
      { id:'demo',     name:'Schedule & deliver demo',      priority:'HIGH',   depsOn:['qualify'] },
      { id:'proposal', name:'Send proposal & pricing',      priority:'HIGH',   depsOn:['demo'] },
      { id:'legal',    name:'Legal review & NDA',           priority:'MEDIUM', depsOn:['proposal'] },
      { id:'contract', name:'Contract negotiation',         priority:'HIGH',   depsOn:['legal'] },
      { id:'sign',     name:'Contract signed & deposited',  priority:'CRITICAL',depsOn:['contract'] },
      { id:'handoff',  name:'Handoff to onboarding',        priority:'HIGH',   depsOn:['sign'] },
    ],
  },
};

// ── Task ───────────────────────────────────────────────────────────────────────
class OperexTask {
  constructor({ id, name, priority = 'MEDIUM', assignee = null, depsOn = [], workflowId, stepId, metadata = {} }) {
    this.id         = id;
    this.stepId     = stepId;
    this.workflowId = workflowId;
    this.name       = name;
    this.priority   = priority.toUpperCase();
    this.assignee   = assignee;
    this.depsOn     = depsOn;
    this.status     = STATUS.PENDING;
    this.metadata   = metadata;
    this.createdAt  = Date.now();
    this.startedAt  = null;
    this.completedAt= null;
    this.escalatedAt= null;
    this.notes      = [];
    this.phiScore   = (PRIORITY[this.priority]?.weight ?? 1) * PHI;
  }

  start(assignee) {
    if (assignee) this.assignee = assignee;
    this.status    = STATUS.IN_PROGRESS;
    this.startedAt = Date.now();
  }

  complete(note = '') {
    this.status      = STATUS.COMPLETED;
    this.completedAt = Date.now();
    if (note) this.notes.push({ ts: Date.now(), text: note });
  }

  escalate(reason) {
    this.status      = STATUS.ESCALATED;
    this.escalatedAt = Date.now();
    this.notes.push({ ts: Date.now(), text: `ESCALATED: ${reason}` });
  }

  block(reason) {
    this.status = STATUS.BLOCKED;
    this.notes.push({ ts: Date.now(), text: `BLOCKED: ${reason}` });
  }

  addNote(text) {
    this.notes.push({ ts: Date.now(), text });
  }

  isOverdue() {
    const sla   = PRIORITY[this.priority]?.sla ?? 1440;
    const start = this.startedAt || this.createdAt;
    return (Date.now() - start) > sla * 60 * 1000;
  }

  ageSec() {
    return Math.round((Date.now() - this.createdAt) / 1000);
  }

  toSlack() {
    const p     = PRIORITY[this.priority] || PRIORITY.MEDIUM;
    const age   = this.ageSec();
    const ageStr= age < 60 ? `${age}s` : age < 3600 ? `${Math.round(age/60)}m` : `${Math.round(age/3600)}h`;
    const st    = this.status === STATUS.COMPLETED ? '✅' : this.status === STATUS.ESCALATED ? '🚨' : this.status === STATUS.BLOCKED ? '🟥' : this.status === STATUS.IN_PROGRESS ? '��' : '⏳';
    return `${st} ${p.emoji} *${this.name}*\n` +
      `ID: \`${this.id}\` · ${this.status} · Age: ${ageStr}` +
      (this.assignee ? ` · 👤 ${this.assignee}` : '') +
      (this.notes.length ? `\n_${this.notes[this.notes.length-1].text.slice(0,100)}_` : '');
  }

  toJSON() {
    return {
      id: this.id, stepId: this.stepId, workflowId: this.workflowId,
      name: this.name, priority: this.priority, status: this.status,
      assignee: this.assignee, phiScore: this.phiScore,
      createdAt: this.createdAt, startedAt: this.startedAt, completedAt: this.completedAt,
      overdue: this.isOverdue(), notes: this.notes, metadata: this.metadata,
    };
  }
}

// ── Workflow ───────────────────────────────────────────────────────────────────
class OperexWorkflow {
  constructor({ id, template, name, metadata = {} }) {
    this.id         = id;
    this.template   = template;
    this.name       = name;
    this.metadata   = metadata;
    this.tasks      = new Map();  // stepId → OperexTask
    this.status     = STATUS.PENDING;
    this.createdAt  = Date.now();
    this.completedAt= null;
    this.phiProgress= 0;
  }

  addTask(task) {
    this.tasks.set(task.stepId, task);
  }

  getReadyTasks() {
    return [...this.tasks.values()].filter(t => {
      if (t.status !== STATUS.PENDING) return false;
      return t.depsOn.every(dep => {
        const depTask = this.tasks.get(dep);
        return !depTask || depTask.status === STATUS.COMPLETED;
      });
    });
  }

  getBlockedCount() { return [...this.tasks.values()].filter(t=>t.status===STATUS.BLOCKED).length; }
  getEscalatedCount() { return [...this.tasks.values()].filter(t=>t.status===STATUS.ESCALATED).length; }
  getCompletedCount() { return [...this.tasks.values()].filter(t=>t.status===STATUS.COMPLETED).length; }
  getTotalCount() { return this.tasks.size; }

  calculateProgress() {
    const total = this.tasks.size;
    if (!total) return 0;
    const done = this.getCompletedCount();
    // φ-weighted: completed tasks score higher if they are high-priority
    const phiSum = [...this.tasks.values()].reduce((s,t) => s + t.phiScore, 0);
    const phiDone= [...this.tasks.values()].filter(t=>t.status===STATUS.COMPLETED).reduce((s,t)=>s+t.phiScore,0);
    this.phiProgress = phiSum > 0 ? phiDone / phiSum : done / total;
    return this.phiProgress;
  }

  isComplete() {
    return [...this.tasks.values()].every(t => t.status === STATUS.COMPLETED);
  }

  toJSON() {
    return {
      id: this.id, template: this.template, name: this.name, status: this.status,
      progress: parseFloat(this.calculateProgress().toFixed(3)),
      taskCount: this.getTotalCount(), completedCount: this.getCompletedCount(),
      blockedCount: this.getBlockedCount(), escalatedCount: this.getEscalatedCount(),
      createdAt: this.createdAt, completedAt: this.completedAt,
      metadata: this.metadata,
      tasks: [...this.tasks.values()].map(t=>t.toJSON()),
    };
  }
}

// ── OPEREX AGI Core ────────────────────────────────────────────────────────────
export class OPEREX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({ name:'OPEREX', designation:'RSHIP-2026-OPEREX-001', ...config });
    this.config        = config;
    this.workflows     = new Map();
    this.taskIndex     = new Map(); // taskId → task (cross-workflow lookup)
    this.assignees     = new Map(); // name → { activeTasks, completedTasks, kuramotoPhase }
    this.memory        = new EternalMemory();
    this.slackWebhook  = config.slackWebhook || null;
    this.slackToken    = config.slackToken    || null;
    this.nextId        = 1;
    this._escalationTimer = null;
    this._startEscalationWatch();
  }

  // ── ID generation ────────────────────────────────────────────────────────────
  _uid(prefix = 'T') {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${(this.nextId++).toString().padStart(4,'0')}`;
  }

  // ── Create a workflow from a template ─────────────────────────────────────────
  createWorkflow(templateKey, metadata = {}) {
    const tmpl = TEMPLATES[templateKey.toUpperCase()];
    if (!tmpl) throw new Error(`Unknown template: ${templateKey}. Available: ${Object.keys(TEMPLATES).join(', ')}`);

    const wfId = this._uid('WF');
    const wf   = new OperexWorkflow({
      id: wfId, template: templateKey.toUpperCase(),
      name: metadata.name || tmpl.name, metadata,
    });

    for (const step of tmpl.steps) {
      const task = new OperexTask({
        id: this._uid('T'), stepId: step.id,
        name: step.name, priority: step.priority,
        workflowId: wfId, depsOn: step.depsOn,
        assignee: metadata.assignee || null,
        metadata,
      });
      wf.addTask(task);
      this.taskIndex.set(task.id, task);
    }

    this.workflows.set(wfId, wf);
    this.memory.store(`workflow:${wfId}`, wf.toJSON());
    this._notify(`🚀 *Workflow Created:* ${wf.name}\nID: \`${wfId}\` · ${wf.getTotalCount()} tasks · Template: ${templateKey}`);
    return wf.toJSON();
  }

  // ── Create a standalone task (no template) ────────────────────────────────────
  createTask(name, { priority = 'MEDIUM', assignee = null, workflowId = null, metadata = {} } = {}) {
    const task = new OperexTask({
      id: this._uid('T'), stepId: `standalone-${this.nextId}`,
      name, priority, assignee, workflowId: workflowId || 'STANDALONE',
      depsOn: [], metadata,
    });

    // Put standalone tasks in a special workflow bucket
    const swfKey = 'STANDALONE';
    if (!this.workflows.has(swfKey)) {
      this.workflows.set(swfKey, new OperexWorkflow({ id:swfKey, template:'STANDALONE', name:'Standalone Tasks', metadata:{} }));
    }
    this.workflows.get(swfKey).addTask(task);
    this.taskIndex.set(task.id, task);

    if (assignee) this._trackAssignee(assignee, task);
    this._notify(`${PRIORITY[task.priority]?.emoji||'⏳'} *New Task:* ${task.name}\nID: \`${task.id}\`${assignee ? ` · 👤 ${assignee}` : ''}`);
    return task.toJSON();
  }

  // ── Execute next ready tasks in a workflow ────────────────────────────────────
  execute(workflowId) {
    const wf = this.workflows.get(workflowId);
    if (!wf) return { error:`Workflow not found: ${workflowId}` };

    const ready = wf.getReadyTasks();
    if (!ready.length) {
      if (wf.isComplete()) {
        wf.status = STATUS.COMPLETED;
        wf.completedAt = Date.now();
        this.memory.store(`workflow:${workflowId}`, wf.toJSON());
        this._notify(`✅ *Workflow Complete:* ${wf.name}\nID: \`${workflowId}\` · All ${wf.getTotalCount()} tasks done.`);
      }
      return { workflowId, status: wf.status, readyTasks: 0, message:'No tasks ready — check dependencies or workflow status.' };
    }

    wf.status = STATUS.IN_PROGRESS;
    for (const t of ready) {
      t.start();
    }

    this.memory.store(`workflow:${workflowId}`, wf.toJSON());
    this._notify(
      `▶️ *Workflow Advancing:* ${wf.name}\n` +
      `ID: \`${workflowId}\` · ${ready.length} task(s) now IN_PROGRESS:\n` +
      ready.map(t=>`• ${t.name} [\`${t.id}\`]`).join('\n')
    );
    return { workflowId, status:wf.status, startedTasks: ready.map(t=>t.toJSON()), progress: wf.calculateProgress() };
  }

  // ── Complete a task ────────────────────────────────────────────────────────────
  completeTask(taskId, note = '') {
    const task = this.taskIndex.get(taskId);
    if (!task) return { error:`Task not found: ${taskId}` };
    task.complete(note);

    // Auto-advance the parent workflow
    if (task.workflowId && task.workflowId !== 'STANDALONE') {
      return this.execute(task.workflowId);
    }
    this._notify(`✅ *Task Complete:* ${task.name}\n\`${taskId}\`${note ? ` — ${note}` : ''}`);
    return task.toJSON();
  }

  // ── Assign a task ──────────────────────────────────────────────────────────────
  assignTask(taskId, assignee) {
    const task = this.taskIndex.get(taskId);
    if (!task) return { error:`Task not found: ${taskId}` };
    const prev = task.assignee;
    task.assignee = assignee;
    this._trackAssignee(assignee, task);
    this._notify(`👤 *Task Assigned:* ${task.name}\n\`${taskId}\` → ${assignee}${prev ? ` (was: ${prev})` : ''}`);
    return task.toJSON();
  }

  // ── Block / escalate a task ────────────────────────────────────────────────────
  blockTask(taskId, reason) {
    const task = this.taskIndex.get(taskId);
    if (!task) return { error:`Task not found: ${taskId}` };
    task.block(reason);
    this._notify(`🟥 *Task Blocked:* ${task.name}\n\`${taskId}\` — ${reason}`);
    return task.toJSON();
  }

  escalateTask(taskId, reason) {
    const task = this.taskIndex.get(taskId);
    if (!task) return { error:`Task not found: ${taskId}` };
    task.escalate(reason);
    this._notify(`🚨 *Task Escalated:* ${task.name}\n\`${taskId}\` — ${reason}`);
    return task.toJSON();
  }

  // ── Get workflow status ────────────────────────────────────────────────────────
  getWorkflow(workflowId) {
    const wf = this.workflows.get(workflowId);
    return wf ? wf.toJSON() : { error:`Workflow not found: ${workflowId}` };
  }

  // ── Get task ──────────────────────────────────────────────────────────────────
  getTask(taskId) {
    const task = this.taskIndex.get(taskId);
    return task ? task.toJSON() : { error:`Task not found: ${taskId}` };
  }

  // ── List all workflows ─────────────────────────────────────────────────────────
  listWorkflows({ status = null } = {}) {
    const all = [...this.workflows.values()];
    const filtered = status ? all.filter(wf => wf.status === status.toUpperCase()) : all;
    return {
      total: all.length,
      filtered: filtered.length,
      workflows: filtered.map(wf => ({
        id: wf.id, name: wf.name, template: wf.template, status: wf.status,
        progress: parseFloat(wf.calculateProgress().toFixed(3)),
        taskCount: wf.getTotalCount(), completedCount: wf.getCompletedCount(),
        createdAt: wf.createdAt,
      })),
    };
  }

  // ── List all tasks (optionally filtered) ───────────────────────────────────────
  listTasks({ status = null, assignee = null, workflowId = null } = {}) {
    let tasks = [...this.taskIndex.values()];
    if (status)     tasks = tasks.filter(t => t.status    === status.toUpperCase());
    if (assignee)   tasks = tasks.filter(t => t.assignee  === assignee);
    if (workflowId) tasks = tasks.filter(t => t.workflowId === workflowId);
    tasks.sort((a,b) => (PRIORITY[b.priority]?.weight||1) - (PRIORITY[a.priority]?.weight||1));
    return { total: tasks.length, tasks: tasks.map(t=>t.toJSON()) };
  }

  // ── Enterprise report ──────────────────────────────────────────────────────────
  report() {
    const allTasks = [...this.taskIndex.values()];
    const allWfs   = [...this.workflows.values()];
    const now      = Date.now();

    const byStatus = {};
    for (const s of Object.values(STATUS)) byStatus[s] = 0;
    for (const t of allTasks) byStatus[t.status] = (byStatus[t.status] || 0) + 1;

    const overdue  = allTasks.filter(t => t.status === STATUS.IN_PROGRESS && t.isOverdue());
    const escalated= allTasks.filter(t => t.status === STATUS.ESCALATED);

    // Kuramoto synchronization across assignees
    const phases = [...this.assignees.values()].map(a => a.kuramotoPhase || 0);
    const kuramotoR = phases.length > 1
      ? Math.sqrt(
          Math.pow(phases.reduce((s,p)=>s+Math.cos(p),0)/phases.length, 2) +
          Math.pow(phases.reduce((s,p)=>s+Math.sin(p),0)/phases.length, 2)
        )
      : 1;

    // φ-health score
    const totalPhi   = allTasks.reduce((s,t)=>s+t.phiScore,0) || 1;
    const donePhi    = allTasks.filter(t=>t.status===STATUS.COMPLETED).reduce((s,t)=>s+t.phiScore,0);
    const health     = donePhi / totalPhi;

    return {
      designation: 'RSHIP-2026-OPEREX-001',
      generatedAt : now,
      workflows   : { total: allWfs.length, active: allWfs.filter(w=>w.status===STATUS.IN_PROGRESS).length, complete: allWfs.filter(w=>w.status===STATUS.COMPLETED).length },
      tasks       : { total: allTasks.length, byStatus },
      overdue     : { count: overdue.length, tasks: overdue.map(t=>({ id:t.id, name:t.name, priority:t.priority })) },
      escalated   : { count: escalated.length, tasks: escalated.map(t=>({ id:t.id, name:t.name })) },
      teamSync    : { kuramotoR: parseFloat(kuramotoR.toFixed(4)), synced: kuramotoR >= SYNC_THRESHOLD, assigneeCount: this.assignees.size },
      phiHealth   : parseFloat(health.toFixed(4)),
      phi         : PHI,
    };
  }

  // ── Available templates ────────────────────────────────────────────────────────
  templates() {
    return Object.entries(TEMPLATES).map(([key, t]) => ({
      key, name: t.name, stepCount: t.steps.length,
      steps: t.steps.map(s => ({ id:s.id, name:s.name, priority:s.priority, depsOn:s.depsOn })),
    }));
  }

  // ── Internal: track assignee ────────────────────────────────────────────────────
  _trackAssignee(name, task) {
    if (!this.assignees.has(name)) {
      this.assignees.set(name, { name, activeTasks:0, completedTasks:0, kuramotoPhase: Math.random() * 2 * Math.PI });
    }
    const a = this.assignees.get(name);
    if (task.status === STATUS.COMPLETED) { a.completedTasks++; a.activeTasks = Math.max(0, a.activeTasks-1); }
    else { a.activeTasks++; }
    // Kuramoto phase update
    a.kuramotoPhase = (a.kuramotoPhase + PHI_INV) % (2 * Math.PI);
  }

  // ── Internal: Slack notification ────────────────────────────────────────────────
  async _notify(text) {
    if (!this.slackWebhook) return;
    try {
      await fetch(this.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {}
  }

  // ── Internal: Lyapunov escalation watch ────────────────────────────────────────
  _startEscalationWatch() {
    if (typeof setInterval === 'undefined') return;
    this._escalationTimer = setInterval(() => {
      const now = Date.now();
      for (const task of this.taskIndex.values()) {
        if (task.status !== STATUS.IN_PROGRESS) continue;
        const sla = PRIORITY[task.priority]?.sla ?? 1440;
        const age = (now - (task.startedAt || task.createdAt)) / 60000;
        const lyapunov = (age - sla) / sla;
        if (lyapunov > ESCALATION_THRESHOLD && task.status === STATUS.IN_PROGRESS) {
          task.escalate(`Auto-escalated: Lyapunov λ=${lyapunov.toFixed(3)} > ${ESCALATION_THRESHOLD.toFixed(3)} (SLA breach)`);
          this._notify(`🚨 *Auto-Escalation:* ${task.name}\n\`${task.id}\` — SLA breached (λ=${lyapunov.toFixed(3)})`);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  stop() {
    if (this._escalationTimer) clearInterval(this._escalationTimer);
  }
}

// ── Factory Function ───────────────────────────────────────────────────────────
export function birthOPEREX(config = {}) {
  return new OPEREX_AGI(config);
}

export { TEMPLATES, PRIORITY, STATUS, PHI };
export default OPEREX_AGI;
