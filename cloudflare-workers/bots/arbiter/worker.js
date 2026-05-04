/**
 * ARBITER — Enterprise Task & Workflow Bot
 *
 * Designation:  RSHIP-BOT-ARB-001
 * Latin:        arbiter (task master · workflow judge · orchestrator)
 * Type:         ENTERPRISE WORKFLOW BOT · Cloudflare Worker
 *
 * ARBITER is the Slack interface for the OPEREX AGI.
 * Create workflows, assign tasks, track progress, and close work —
 * all from a single Slack slash command.
 *
 * Everything is self-contained in this Worker — OPEREX logic lives here
 * (no external AGI host required). State is in-memory per worker instance.
 *
 * Slash command: /task [subcommand] [args]
 *   /task new DEPLOYMENT agent=CEREBRUM         → Create deployment workflow from template
 *   /task new INCIDENT client=AcmeCorp          → Create incident response workflow
 *   /task new ONBOARDING name="ACME Onboarding" → Create onboarding workflow
 *   /task workflow [WF-ID]                       → Show workflow status + all tasks
 *   /task workflows                              → List all active workflows
 *   /task create [task name] priority=HIGH       → Create a standalone task
 *   /task assign [TASK-ID] [assignee]            → Assign a task to someone
 *   /task done [TASK-ID] [optional note]         → Mark a task complete (auto-advances workflow)
 *   /task block [TASK-ID] [reason]               → Mark task blocked
 *   /task escalate [TASK-ID] [reason]            → Escalate task
 *   /task list [pending|in_progress|blocked]     → List tasks by status
 *   /task report                                 → Full enterprise workflow report
 *   /task templates                              → Show all available workflow templates
 *   /task help                                   → Command reference
 *
 * Routes:
 *   POST /slack/command     → Slash command handler
 *   POST /slack/events      → Events API
 *   GET  /api/workflows     → All workflows (JSON)
 *   GET  /api/tasks         → All tasks (JSON)
 *   GET  /api/report        → Enterprise report (JSON)
 *   GET  /api/status        → Bot health
 *   GET  /                  → Info page
 *
 * © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved.
 */

'use strict';

// ── OPEREX AGI — embedded (no external import needed in Worker) ─────────────────
const PHI     = 1.618033988749895;
const PHI_INV = 1 / PHI;
const PHI2    = PHI * PHI;
const PHI_INV2= PHI_INV * PHI_INV;
const ESCALATION_THRESHOLD = PHI_INV2;

const STATUS = Object.freeze({
  PENDING    : 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  BLOCKED    : 'BLOCKED',
  ESCALATED  : 'ESCALATED',
  COMPLETED  : 'COMPLETED',
  CANCELLED  : 'CANCELLED',
});

const PRIORITY = Object.freeze({
  CRITICAL : { name:'CRITICAL', weight: PHI2,    emoji:'🔴', sla: 30   },
  HIGH     : { name:'HIGH',     weight: PHI,     emoji:'🟠', sla: 240  },
  MEDIUM   : { name:'MEDIUM',   weight: 1,       emoji:'🟡', sla: 1440 },
  LOW      : { name:'LOW',      weight: PHI_INV, emoji:'🟢', sla: 4320 },
});

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
      { id:'detect',     name:'Detect & classify',       priority:'CRITICAL', depsOn:[] },
      { id:'triage',     name:'Triage & assign severity', priority:'CRITICAL', depsOn:['detect'] },
      { id:'contain',    name:'Contain the incident',    priority:'CRITICAL', depsOn:['triage'] },
      { id:'mitigate',   name:'Apply mitigation',        priority:'HIGH',     depsOn:['contain'] },
      { id:'resolve',    name:'Resolve & restore',       priority:'HIGH',     depsOn:['mitigate'] },
      { id:'postmortem', name:'Post-mortem report',      priority:'MEDIUM',   depsOn:['resolve'] },
      { id:'archive',    name:'Archive & close',         priority:'LOW',      depsOn:['postmortem'] },
    ],
  },
  ONBOARDING: {
    name: 'Enterprise Client Onboarding',
    steps: [
      { id:'kickoff',   name:'Kickoff call',             priority:'HIGH',   depsOn:[] },
      { id:'provision', name:'Provision RSHIP',          priority:'HIGH',   depsOn:['kickoff'] },
      { id:'config',    name:'Configure agents',         priority:'HIGH',   depsOn:['provision'] },
      { id:'training',  name:'Team training',            priority:'MEDIUM', depsOn:['config'] },
      { id:'pilot',     name:'2-week pilot run',         priority:'MEDIUM', depsOn:['training'] },
      { id:'review',    name:'Pilot review',             priority:'HIGH',   depsOn:['pilot'] },
      { id:'handoff',   name:'Full handoff & go-live',   priority:'HIGH',   depsOn:['review'] },
    ],
  },
  MARKET_BRIEF: {
    name: 'Market Intelligence Briefing',
    steps: [
      { id:'collect',  name:'Collect VIGIL data',        priority:'HIGH',   depsOn:[] },
      { id:'analyze',  name:'Run regime analysis',       priority:'HIGH',   depsOn:['collect'] },
      { id:'draft',    name:'Draft briefing',            priority:'MEDIUM', depsOn:['analyze'] },
      { id:'review',   name:'Review signals',            priority:'HIGH',   depsOn:['draft'] },
      { id:'publish',  name:'Publish to Slack',          priority:'HIGH',   depsOn:['review'] },
      { id:'archive',  name:'Archive to memory',         priority:'LOW',    depsOn:['publish'] },
    ],
  },
  ENTERPRISE_INTAKE: {
    name: 'Enterprise Sales Pipeline',
    steps: [
      { id:'qualify',  name:'Qualify prospect',          priority:'HIGH',    depsOn:[] },
      { id:'demo',     name:'Schedule & deliver demo',   priority:'HIGH',    depsOn:['qualify'] },
      { id:'proposal', name:'Send proposal',             priority:'HIGH',    depsOn:['demo'] },
      { id:'legal',    name:'Legal review & NDA',        priority:'MEDIUM',  depsOn:['proposal'] },
      { id:'contract', name:'Contract negotiation',      priority:'HIGH',    depsOn:['legal'] },
      { id:'sign',     name:'Contract signed',           priority:'CRITICAL',depsOn:['contract'] },
      { id:'handoff',  name:'Handoff to onboarding',     priority:'HIGH',    depsOn:['sign'] },
    ],
  },
};

// ── Embedded OPEREX state (per worker instance) ────────────────────────────────
const workflows  = new Map();
const taskIndex  = new Map();
let nextId = 1;
let startTime = Date.now();
let requestCount = 0;

function uid(prefix = 'T') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${(nextId++).toString().padStart(4,'0')}`;
}

function taskStatus(t) {
  if (t.status === STATUS.COMPLETED)  return '✅';
  if (t.status === STATUS.ESCALATED)  return '🚨';
  if (t.status === STATUS.BLOCKED)    return '🟥';
  if (t.status === STATUS.IN_PROGRESS)return '🔵';
  if (t.status === STATUS.CANCELLED)  return '❌';
  return '⏳';
}

function isOverdue(t) {
  const sla   = PRIORITY[t.priority]?.sla ?? 1440;
  const start = t.startedAt || t.createdAt;
  return t.status === STATUS.IN_PROGRESS && (Date.now() - start) > sla * 60 * 1000;
}

function ageStr(t) {
  const age = Math.round((Date.now() - t.createdAt) / 1000);
  return age < 60 ? `${age}s` : age < 3600 ? `${Math.round(age/60)}m` : `${Math.round(age/3600)}h`;
}

// ── Create workflow ────────────────────────────────────────────────────────────
function createWorkflow(templateKey, meta = {}) {
  const tmpl = TEMPLATES[templateKey.toUpperCase()];
  if (!tmpl) return null;
  const wfId = uid('WF');
  const wf   = { id:wfId, template:templateKey.toUpperCase(), name:meta.name||tmpl.name, metadata:meta, status:STATUS.PENDING, tasks:new Map(), createdAt:Date.now(), completedAt:null };
  for (const step of tmpl.steps) {
    const task = { id:uid('T'), stepId:step.id, workflowId:wfId, name:step.name, priority:step.priority, depsOn:step.depsOn, status:STATUS.PENDING, assignee:meta.assignee||null, notes:[], createdAt:Date.now(), startedAt:null, completedAt:null, metadata:meta };
    wf.tasks.set(step.id, task);
    taskIndex.set(task.id, task);
  }
  workflows.set(wfId, wf);
  return wf;
}

function createStandaloneTask(name, { priority='MEDIUM', assignee=null } = {}) {
  const task = { id:uid('T'), stepId:`s-${nextId}`, workflowId:'STANDALONE', name, priority:priority.toUpperCase(), depsOn:[], status:STATUS.PENDING, assignee, notes:[], createdAt:Date.now(), startedAt:null, completedAt:null, metadata:{} };
  if (!workflows.has('STANDALONE')) {
    workflows.set('STANDALONE', { id:'STANDALONE', template:'STANDALONE', name:'Standalone Tasks', status:STATUS.IN_PROGRESS, tasks:new Map(), createdAt:Date.now(), completedAt:null, metadata:{} });
  }
  workflows.get('STANDALONE').tasks.set(task.stepId, task);
  taskIndex.set(task.id, task);
  return task;
}

function getReadyTasks(wf) {
  return [...wf.tasks.values()].filter(t => {
    if (t.status !== STATUS.PENDING) return false;
    return t.depsOn.every(dep => {
      const d = wf.tasks.get(dep);
      return !d || d.status === STATUS.COMPLETED;
    });
  });
}

function advanceWorkflow(wf) {
  if ([...wf.tasks.values()].every(t=>t.status===STATUS.COMPLETED)) {
    wf.status = STATUS.COMPLETED;
    wf.completedAt = Date.now();
    return { advanced:false, completed:true };
  }
  const ready = getReadyTasks(wf);
  if (!ready.length) return { advanced:false, completed:false };
  wf.status = STATUS.IN_PROGRESS;
  ready.forEach(t => { t.status = STATUS.IN_PROGRESS; t.startedAt = Date.now(); });
  return { advanced:true, completed:false, startedTasks:ready };
}

function wfProgress(wf) {
  const tasks  = [...wf.tasks.values()];
  const total  = tasks.reduce((s,t)=>(PRIORITY[t.priority]?.weight||1)+s,0) || 1;
  const done   = tasks.filter(t=>t.status===STATUS.COMPLETED).reduce((s,t)=>(PRIORITY[t.priority]?.weight||1)+s,0);
  return parseFloat((done/total).toFixed(3));
}

function progressBar(prog) {
  const filled = Math.round(prog * 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${Math.round(prog*100)}%`;
}

// ── Block Kit helpers ──────────────────────────────────────────────────────────
const mkH  = t => ({ type:'header', text:{type:'plain_text', text:t, emoji:true} });
const mkS  = t => ({ type:'section', text:{type:'mrkdwn', text:t} });
const mkD  = ()=> ({ type:'divider' });
const mkF  = fs => ({ type:'section', fields:fs.map(f=>({type:'mrkdwn',text:f})) });
const mkCx = els => ({ type:'context', elements:els.map(t=>({type:'mrkdwn',text:t})) });

// ── Commands ───────────────────────────────────────────────────────────────────

function cmdNew(args) {
  const parts   = (args || '').trim().split(/\s+/);
  const tmplKey = (parts[0] || '').toUpperCase();
  if (!TEMPLATES[tmplKey]) {
    return { blocks:[
      mkH('⚠ Unknown Template'),
      mkS(`\`${tmplKey}\` is not a valid template.\n\n*Available:*\n` + Object.entries(TEMPLATES).map(([k,t])=>`• \`${k}\` — ${t.name} (${t.steps.length} steps)`).join('\n')),
      mkCx(['ARBITER · RSHIP-BOT-ARB-001', 'Use /task templates for full details']),
    ]};
  }

  // Parse key=value metadata from remaining args
  const meta = {};
  for (const part of parts.slice(1)) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      const k = part.slice(0,eq).trim();
      const v = part.slice(eq+1).replace(/^["']|["']$/g,'').trim();
      meta[k] = v;
    }
  }
  if (!meta.name) meta.name = `${TEMPLATES[tmplKey].name}${Object.keys(meta).length ? ' — '+Object.values(meta).filter(Boolean).slice(0,2).join(', ') : ''}`;

  const wf = createWorkflow(tmplKey, meta);
  const advanced = advanceWorkflow(wf);
  const tasks = [...wf.tasks.values()];

  const taskLines = tasks.map(t =>
    `${taskStatus(t)} ${PRIORITY[t.priority]?.emoji||'⏳'} \`${t.id}\` *${t.name}*${t.depsOn.length ? ` — after: ${t.depsOn.join(', ')}` : ' — ✅ READY NOW'}`
  );

  return { blocks:[
    mkH(`🚀 Workflow Created: ${wf.name}`),
    mkF([
      `*Workflow ID*\n\`${wf.id}\``,
      `*Template*\n${tmplKey}`,
      `*Tasks*\n${tasks.length}`,
      `*Status*\n${wf.status}`,
    ]),
    mkD(),
    mkS('*Task Graph:*\n' + taskLines.join('\n')),
    mkD(),
    mkS(`*Next:* Type \`/task done [TASK-ID]\` when each task is complete — workflow advances automatically.`),
    mkCx([`ARBITER · RSHIP-BOT-ARB-001`, `φ = ${PHI.toFixed(4)}`]),
  ]};
}

function cmdWorkflow(wfId) {
  if (!wfId) return cmdWorkflows();
  const wf = workflows.get(wfId);
  if (!wf) return { blocks:[mkH('⚠ Workflow Not Found'), mkS(`\`${wfId}\` — not found. Use \`/task workflows\` to list all.`)] };

  const tasks   = [...wf.tasks.values()];
  const prog    = wfProgress(wf);
  const overdues= tasks.filter(t=>isOverdue(t));
  const escalated= tasks.filter(t=>t.status===STATUS.ESCALATED);
  const taskLines= tasks.map(t => {
    const od = isOverdue(t) ? ' ⚠ OVERDUE' : '';
    return `${taskStatus(t)} ${PRIORITY[t.priority]?.emoji||'⏳'} \`${t.id}\` *${t.name}*${t.assignee?` — 👤 ${t.assignee}`:''}${od}`;
  });

  const stEmoji = wf.status===STATUS.COMPLETED?'✅':wf.status===STATUS.IN_PROGRESS?'🔵':'⏳';

  return { blocks:[
    mkH(`${stEmoji} ${wf.name}`),
    mkF([
      `*Workflow ID*\n\`${wf.id}\``,
      `*Template*\n${wf.template}`,
      `*Status*\n${wf.status}`,
      `*Progress*\n\`${progressBar(prog)}\``,
      `*Tasks*\n${tasks.filter(t=>t.status===STATUS.COMPLETED).length} / ${tasks.length} done`,
      `*Overdue*\n${overdues.length > 0 ? `⚠ ${overdues.length}` : '✅ 0'}`,
    ]),
    mkD(),
    mkS('*Tasks:*\n' + taskLines.join('\n')),
    escalated.length > 0 ? mkS('*🚨 Escalated:*\n' + escalated.map(t=>`• \`${t.id}\` ${t.name}\n${t.notes.slice(-1).map(n=>n.text).join('')}`).join('\n')) : null,
    mkCx([`ARBITER · RSHIP-BOT-ARB-001`, `Created: ${new Date(wf.createdAt).toUTCString()}`]),
  ].filter(Boolean)};
}

function cmdWorkflows() {
  const all = [...workflows.values()].filter(wf=>wf.id!=='STANDALONE');
  if (!all.length) return { blocks:[mkH('⬡ No Workflows Yet'), mkS('Use `/task new [TEMPLATE]` to create your first workflow.\n\nTemplates: `DEPLOYMENT` · `INCIDENT` · `ONBOARDING` · `MARKET_BRIEF` · `ENTERPRISE_INTAKE`'), mkCx(['ARBITER · RSHIP-BOT-ARB-001'])] };

  const lines = all.map(wf => {
    const prog = wfProgress(wf);
    const st   = wf.status===STATUS.COMPLETED?'✅':wf.status===STATUS.IN_PROGRESS?'🔵':'⏳';
    const tasks= [...wf.tasks.values()];
    const done = tasks.filter(t=>t.status===STATUS.COMPLETED).length;
    return `${st} \`${wf.id}\` *${wf.name}*\n\`${progressBar(prog)}\` · ${done}/${tasks.length} tasks`;
  });

  return { blocks:[
    mkH(`⬡ Active Workflows (${all.length})`),
    mkS(lines.join('\n\n')),
    mkCx(['ARBITER · RSHIP-BOT-ARB-001', 'Use /task workflow [WF-ID] for details']),
  ]};
}

function cmdCreate(args) {
  const parts   = (args||'').trim().split(/\s+/);
  const priority = parts.find(p=>p.toLowerCase().startsWith('priority='))?.split('=')[1]?.toUpperCase() || 'MEDIUM';
  const assignee = parts.find(p=>p.toLowerCase().startsWith('assign='))?.split('=')[1] || null;
  const name     = parts.filter(p=>!p.includes('=')).join(' ').trim() || 'Unnamed Task';
  const task     = createStandaloneTask(name, { priority, assignee });
  return { blocks:[
    mkH(`⏳ Task Created`),
    mkF([
      `*Task ID*\n\`${task.id}\``,
      `*Name*\n${task.name}`,
      `*Priority*\n${PRIORITY[task.priority]?.emoji||'⏳'} ${task.priority}`,
      `*Assignee*\n${task.assignee || '—'}`,
    ]),
    mkS(`Mark done: \`/task done ${task.id}\`${task.assignee?'':`\nAssign: \`/task assign ${task.id} [name]\``}`),
    mkCx(['ARBITER · RSHIP-BOT-ARB-001']),
  ]};
}

function cmdAssign(args) {
  const parts    = (args||'').trim().split(/\s+/);
  const taskId   = parts[0];
  const assignee = parts.slice(1).join(' ').replace('@','').trim();
  const task     = taskIndex.get(taskId);
  if (!task) return { blocks:[mkH('⚠ Task Not Found'), mkS(`\`${taskId}\` — not found.`)] };
  if (!assignee) return { blocks:[mkH('⚠ No Assignee'), mkS(`Usage: \`/task assign ${taskId} [person-name]\``)] };
  task.assignee = assignee;
  return { blocks:[
    mkH(`👤 Task Assigned`),
    mkS(`*${task.name}*\n\`${task.id}\` → 👤 *${assignee}*`),
    mkCx(['ARBITER · RSHIP-BOT-ARB-001']),
  ]};
}

function cmdDone(args) {
  const parts  = (args||'').trim().split(/\s+/);
  const taskId = parts[0];
  const note   = parts.slice(1).join(' ');
  const task   = taskIndex.get(taskId);
  if (!task) return { blocks:[mkH('⚠ Task Not Found'), mkS(`\`${taskId}\` — not found.`)] };

  task.status      = STATUS.COMPLETED;
  task.completedAt = Date.now();
  if (note) task.notes.push({ ts:Date.now(), text:note });

  // Auto-advance workflow
  let advanceResult = null;
  if (task.workflowId && task.workflowId !== 'STANDALONE') {
    const wf = workflows.get(task.workflowId);
    if (wf) advanceResult = advanceWorkflow(wf);
  }

  const blocks = [
    mkH(`✅ Task Complete: ${task.name}`),
    mkF([
      `*Task ID*\n\`${task.id}\``,
      `*Completed*\n${new Date().toUTCString()}`,
    ]),
  ];

  if (note) blocks.push(mkS(`_"${note}"_`));

  if (advanceResult?.completed) {
    const wf = workflows.get(task.workflowId);
    blocks.push(mkD());
    blocks.push(mkS(`🎉 *Workflow Complete!* All tasks in *${wf.name}* are done.\n\`${task.workflowId}\``));
  } else if (advanceResult?.advanced) {
    blocks.push(mkD());
    blocks.push(mkS(`▶️ *Workflow Advanced* — next tasks now in progress:\n` +
      advanceResult.startedTasks.map(t=>`• \`${t.id}\` ${t.name}`).join('\n')));
  }

  blocks.push(mkCx(['ARBITER · RSHIP-BOT-ARB-001']));
  return { blocks };
}

function cmdBlock(args) {
  const parts  = (args||'').trim().split(/\s+/);
  const taskId = parts[0];
  const reason = parts.slice(1).join(' ') || 'No reason given';
  const task   = taskIndex.get(taskId);
  if (!task) return { blocks:[mkH('⚠ Task Not Found'), mkS(`\`${taskId}\` — not found.`)] };
  task.status = STATUS.BLOCKED;
  task.notes.push({ ts:Date.now(), text:`BLOCKED: ${reason}` });
  return { blocks:[
    mkH(`🟥 Task Blocked: ${task.name}`),
    mkS(`\`${task.id}\` — *${reason}*\n\nUnblock: \`/task done ${task.id} [note]\``),
    mkCx(['ARBITER · RSHIP-BOT-ARB-001']),
  ]};
}

function cmdEscalate(args) {
  const parts  = (args||'').trim().split(/\s+/);
  const taskId = parts[0];
  const reason = parts.slice(1).join(' ') || 'No reason given';
  const task   = taskIndex.get(taskId);
  if (!task) return { blocks:[mkH('⚠ Task Not Found'), mkS(`\`${taskId}\` — not found.`)] };
  task.status = STATUS.ESCALATED;
  task.escalatedAt = Date.now();
  task.notes.push({ ts:Date.now(), text:`ESCALATED: ${reason}` });
  return { blocks:[
    mkH(`🚨 Task Escalated: ${task.name}`),
    mkS(`\`${task.id}\` — *${reason}*`),
    mkF([
      `*Priority*\n${PRIORITY[task.priority]?.emoji||'⏳'} ${task.priority}`,
      `*Assignee*\n${task.assignee||'—'}`,
    ]),
    mkCx(['ARBITER · RSHIP-BOT-ARB-001']),
  ]};
}

function cmdList(args) {
  const filter = (args||'').trim().toUpperCase() || null;
  let tasks = [...taskIndex.values()];
  if (filter && STATUS[filter]) tasks = tasks.filter(t=>t.status===STATUS[filter]);
  tasks.sort((a,b)=>(PRIORITY[b.priority]?.weight||1)-(PRIORITY[a.priority]?.weight||1));

  if (!tasks.length) return { blocks:[mkH(`⬡ No Tasks${filter ? ` — ${filter}` : ''}`), mkS('No tasks found. Use `/task create [name]` or `/task new [TEMPLATE]`.')] };

  const lines = tasks.slice(0,15).map(t => {
    const od = isOverdue(t) ? ' ⚠' : '';
    return `${taskStatus(t)} ${PRIORITY[t.priority]?.emoji||'⏳'} \`${t.id}\` *${t.name}*${t.assignee?` — 👤 ${t.assignee}`:''}${od}`;
  });

  return { blocks:[
    mkH(`⬡ Tasks${filter ? ` — ${filter}` : ''} (${tasks.length})`),
    mkS(lines.join('\n') + (tasks.length > 15 ? `\n_…and ${tasks.length-15} more_` : '')),
    mkCx(['ARBITER · RSHIP-BOT-ARB-001', 'Use /task workflow [WF-ID] for workflow context']),
  ]};
}

function cmdReport() {
  const allTasks = [...taskIndex.values()];
  const allWfs   = [...workflows.values()];

  const byStatus = {};
  for (const s of Object.values(STATUS)) byStatus[s] = 0;
  for (const t of allTasks) byStatus[t.status] = (byStatus[t.status]||0)+1;

  const overdues  = allTasks.filter(t=>isOverdue(t));
  const escalated = allTasks.filter(t=>t.status===STATUS.ESCALATED);
  const activeWfs = allWfs.filter(w=>w.status===STATUS.IN_PROGRESS);
  const doneWfs   = allWfs.filter(w=>w.status===STATUS.COMPLETED);

  // φ-health
  const totalPhi = allTasks.reduce((s,t)=>s+(PRIORITY[t.priority]?.weight||1),0) || 1;
  const donePhi  = allTasks.filter(t=>t.status===STATUS.COMPLETED).reduce((s,t)=>s+(PRIORITY[t.priority]?.weight||1),0);
  const health   = parseFloat((donePhi/totalPhi).toFixed(3));

  return { blocks:[
    mkH(`◉ ARBITER — Enterprise Workflow Report`),
    mkF([
      `*Workflows*\n${allWfs.length} total`,
      `*Active*\n🔵 ${activeWfs.length}`,
      `*Complete*\n✅ ${doneWfs.length}`,
      `*φ-Health*\n${health} / 1.0`,
      `*Tasks Total*\n${allTasks.length}`,
      `*Done*\n✅ ${byStatus[STATUS.COMPLETED]}`,
      `*In Progress*\n🔵 ${byStatus[STATUS.IN_PROGRESS]}`,
      `*Blocked*\n🟥 ${byStatus[STATUS.BLOCKED]}`,
      `*Overdue*\n${overdues.length > 0 ? `⚠ ${overdues.length}` : '✅ 0'}`,
      `*Escalated*\n${escalated.length > 0 ? `🚨 ${escalated.length}` : '✅ 0'}`,
      `*Pending*\n⏳ ${byStatus[STATUS.PENDING]}`,
      `*φ*\n${PHI.toFixed(4)}`,
    ]),
    overdues.length > 0 ? mkS('*⚠ Overdue Tasks:*\n' + overdues.slice(0,5).map(t=>`• \`${t.id}\` ${t.name} — ${ageStr(t)} old`).join('\n')) : null,
    escalated.length > 0 ? mkS('*🚨 Escalated Tasks:*\n' + escalated.slice(0,5).map(t=>`• \`${t.id}\` ${t.name}`).join('\n')) : null,
    mkCx([`ARBITER · RSHIP-BOT-ARB-001`, `Generated: ${new Date().toUTCString()}`]),
  ].filter(Boolean)};
}

function cmdTemplates() {
  const lines = Object.entries(TEMPLATES).map(([key, t]) => {
    const steps = t.steps.map(s => {
      const deps = s.depsOn.length ? ` → after: ${s.depsOn.join(', ')}` : ' → STARTS HERE';
      return `  • \`${s.id}\` ${s.name} [${s.priority}]${deps}`;
    }).join('\n');
    return `*\`${key}\` — ${t.name}* (${t.steps.length} steps)\n${steps}`;
  });

  return { blocks:[
    mkH('⬡ OPEREX Workflow Templates'),
    mkS(lines.join('\n\n')),
    mkD(),
    mkS('*Create one:*\n`/task new DEPLOYMENT agent=CEREBRUM`\n`/task new INCIDENT client=AcmeCorp`\n`/task new ONBOARDING name="Acme Onboarding"`\n`/task new ENTERPRISE_INTAKE`\n`/task new MARKET_BRIEF`'),
    mkCx([`ARBITER · RSHIP-BOT-ARB-001`, 'RSHIP-2026-OPEREX-001 · φ-weighted task priority']),
  ]};
}

function cmdHelp() {
  return { blocks:[
    mkH('⬡ ARBITER — Task & Workflow Bot'),
    mkS('*Powered by OPEREX AGI — create workflows, assign tasks, track enterprise work from Slack.*'),
    mkD(),
    mkS([
      '`/task new DEPLOYMENT [key=val]`      — Create deployment pipeline workflow',
      '`/task new INCIDENT [key=val]`        — Create incident response workflow',
      '`/task new ONBOARDING [name=...]`     — Create enterprise onboarding pipeline',
      '`/task new MARKET_BRIEF`              — Create market intelligence briefing workflow',
      '`/task new ENTERPRISE_INTAKE`         — Create enterprise sales pipeline',
      '`/task workflow [WF-ID]`              — Show full workflow status + all tasks',
      '`/task workflows`                     — List all workflows',
      '`/task create [task name] [priority=HIGH] [assign=name]` — Standalone task',
      '`/task assign [TASK-ID] [name]`       — Assign task to someone',
      '`/task done [TASK-ID] [note]`         — Complete task (auto-advances workflow)',
      '`/task block [TASK-ID] [reason]`      — Mark task blocked',
      '`/task escalate [TASK-ID] [reason]`   — Escalate task',
      '`/task list [status]`                 — List tasks (pending/in_progress/blocked/escalated)',
      '`/task report`                        — Full enterprise workflow report',
      '`/task templates`                     — All workflow templates with step graphs',
      '`/task help`                          — This reference',
    ].join('\n')),
    mkD(),
    mkCx([
      'ARBITER · RSHIP-BOT-ARB-001',
      'OPEREX AGI · RSHIP-2026-OPEREX-001',
      `φ = ${PHI}`,
    ]),
  ]};
}

// ── Route /task command ────────────────────────────────────────────────────────
function routeCommand(text) {
  const [sub, ...rest] = (text || 'help').trim().split(/\s+/);
  const arg = rest.join(' ').trim();
  switch(sub.toLowerCase()) {
    case 'new':         return cmdNew(arg);
    case 'workflow':    return cmdWorkflow(arg);
    case 'workflows':   return cmdWorkflows();
    case 'create':      return cmdCreate(arg);
    case 'assign':      return cmdAssign(arg);
    case 'done':        return cmdDone(arg);
    case 'complete':    return cmdDone(arg);
    case 'block':       return cmdBlock(arg);
    case 'escalate':    return cmdEscalate(arg);
    case 'list':        return cmdList(arg);
    case 'report':      return cmdReport();
    case 'templates':   return cmdTemplates();
    case 'template':    return cmdTemplates();
    case 'help':        return cmdHelp();
    default:
      // /task WF-1ABC or /task T-1ABC — look up by ID
      if (arg === '' && (sub.startsWith('WF-') || sub.startsWith('T-'))) {
        return sub.startsWith('WF-') ? cmdWorkflow(sub) : { blocks:[mkH('Task Lookup'), mkS(taskIndex.get(sub)?.name ? taskIndex.get(sub).name + ' — ' + taskIndex.get(sub).status : 'Task not found.')] };
      }
      return cmdHelp();
  }
}

// ── Slack signature verification ───────────────────────────────────────────────
async function verifySlack(request, rawBody, secret) {
  if (!secret) return true;
  const ts  = request.headers.get('x-slack-request-timestamp') || '0';
  const sig = request.headers.get('x-slack-signature') || '';
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name:'HMAC', hash:'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`v0:${ts}:${rawBody}`));
  const hex = 'v0=' + [...new Uint8Array(mac)].map(b=>b.toString(16).padStart(2,'0')).join('');
  return hex === sig;
}

function parseBody(raw) {
  const p = {};
  for (const pair of raw.split('&')) {
    const [k,v] = pair.split('=').map(decodeURIComponent);
    p[k.replace(/\+/g,' ')] = (v||'').replace(/\+/g,' ');
  }
  return p;
}

// ── Info page ──────────────────────────────────────────────────────────────────
function buildInfoPage() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>ARBITER — RSHIP Task & Workflow Bot</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#02050f;color:#c8d8f8;font-family:'Courier New',monospace;padding:48px;max-width:800px;margin:0 auto}
h1{font-size:2.5rem;color:#00ccff;margin-bottom:8px}
.latin{font-size:.9rem;color:#445566;font-style:italic;margin-bottom:32px}
h2{font-size:1rem;color:#8899bb;letter-spacing:.1em;text-transform:uppercase;margin:32px 0 12px}
code{background:#060d1a;border:1px solid #0d2030;padding:2px 8px;border-radius:3px;color:#ffd700;font-size:.82rem}
pre{background:#060d1a;border:1px solid #0d2030;padding:20px;border-radius:6px;font-size:.78rem;color:#6699cc;overflow-x:auto;line-height:1.7;margin:8px 0 20px}
.cmd{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #060d1a;flex-wrap:wrap}
.cmd-name{min-width:360px;color:#ffd700;font-size:.82rem}
.cmd-desc{color:#667788;font-size:.82rem;line-height:1.5}
footer{margin-top:48px;color:#223344;font-size:.75rem}
</style></head><body>
<h1>⬡ ARBITER</h1>
<div class="latin">arbiter · "task master · workflow judge · orchestrator" · RSHIP-BOT-ARB-001</div>
<p style="color:#667788;line-height:1.7;font-size:.88rem">Enterprise task and workflow orchestration, powered by OPEREX AGI (RSHIP-2026-OPEREX-001). Create workflows, assign tasks, track progress, and close enterprise work — all from a single Slack command.</p>

<h2>Slash Commands</h2>
<div class="cmd"><div class="cmd-name"><code>/task new DEPLOYMENT agent=CEREBRUM</code></div><div class="cmd-desc">Create a 7-step agent deployment workflow</div></div>
<div class="cmd"><div class="cmd-name"><code>/task new INCIDENT client=AcmeCorp</code></div><div class="cmd-desc">Create an incident response pipeline</div></div>
<div class="cmd"><div class="cmd-name"><code>/task new ONBOARDING name="Acme"</code></div><div class="cmd-desc">Create an enterprise client onboarding workflow</div></div>
<div class="cmd"><div class="cmd-name"><code>/task new ENTERPRISE_INTAKE</code></div><div class="cmd-desc">Create enterprise sales pipeline</div></div>
<div class="cmd"><div class="cmd-name"><code>/task new MARKET_BRIEF</code></div><div class="cmd-desc">Create market intelligence briefing workflow</div></div>
<div class="cmd"><div class="cmd-name"><code>/task workflow [WF-ID]</code></div><div class="cmd-desc">Full workflow status, progress bar, all tasks</div></div>
<div class="cmd"><div class="cmd-name"><code>/task workflows</code></div><div class="cmd-desc">List all active workflows</div></div>
<div class="cmd"><div class="cmd-name"><code>/task create [name] priority=HIGH</code></div><div class="cmd-desc">Create standalone task</div></div>
<div class="cmd"><div class="cmd-name"><code>/task assign [TASK-ID] [name]</code></div><div class="cmd-desc">Assign task to a person</div></div>
<div class="cmd"><div class="cmd-name"><code>/task done [TASK-ID] [note]</code></div><div class="cmd-desc">Complete task — auto-advances workflow to next steps</div></div>
<div class="cmd"><div class="cmd-name"><code>/task block [TASK-ID] [reason]</code></div><div class="cmd-desc">Mark task as blocked</div></div>
<div class="cmd"><div class="cmd-name"><code>/task escalate [TASK-ID] [reason]</code></div><div class="cmd-desc">Escalate task urgently</div></div>
<div class="cmd"><div class="cmd-name"><code>/task list [status]</code></div><div class="cmd-desc">List tasks by status</div></div>
<div class="cmd"><div class="cmd-name"><code>/task report</code></div><div class="cmd-desc">Full enterprise workflow report with φ-health score</div></div>
<div class="cmd"><div class="cmd-name"><code>/task templates</code></div><div class="cmd-desc">All 5 workflow templates with full step graphs</div></div>

<h2>API Endpoints</h2>
<pre>GET /api/workflows   → All workflows (JSON)
GET /api/tasks       → All tasks (JSON)
GET /api/report      → Enterprise report (JSON)
GET /api/status      → Bot health</pre>

<h2>Powered By</h2>
<pre>OPEREX AGI — RSHIP-2026-OPEREX-001
OPERations EXecution Intelligence
φ-priority scoring · DAG workflow execution
Lyapunov escalation detection · Kuramoto team sync</pre>

<footer>© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved</footer>
</body></html>`;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    requestCount++;
    const url  = new URL(request.url);
    const path = url.pathname;
    const cors = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS' };

    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});

    if (path === '/slack/command' && request.method === 'POST') {
      const raw   = await request.text();
      const valid = await verifySlack(request, raw, env.SLACK_SIGNING_SECRET);
      if (!valid) return new Response('Unauthorized',{status:401});
      const params  = parseBody(raw);
      const payload = routeCommand(params.text || '');
      return Response.json({ response_type:'in_channel', ...payload });
    }

    if (path === '/slack/events' && request.method === 'POST') {
      const raw  = await request.text();
      const valid= await verifySlack(request, raw, env.SLACK_SIGNING_SECRET);
      if (!valid) return new Response('Unauthorized',{status:401});
      const body = JSON.parse(raw);
      if (body.type === 'url_verification') return Response.json({ challenge:body.challenge });
      return Response.json({ok:true});
    }

    if (path === '/api/workflows')
      return Response.json({
        total: workflows.size,
        workflows: [...workflows.values()].map(wf => ({
          id:wf.id, name:wf.name, template:wf.template, status:wf.status,
          progress:wfProgress(wf), taskCount:[...wf.tasks.values()].length,
        }))
      }, {headers:cors});

    if (path === '/api/tasks')
      return Response.json({ total:taskIndex.size, tasks:[...taskIndex.values()] }, {headers:cors});

    if (path === '/api/report') {
      const all = [...taskIndex.values()];
      const byStatus = {};
      for (const s of Object.values(STATUS)) byStatus[s]=0;
      for (const t of all) byStatus[t.status]=(byStatus[t.status]||0)+1;
      return Response.json({ workflows:workflows.size, tasks:taskIndex.size, byStatus, phi:PHI }, {headers:cors});
    }

    if (path === '/api/status')
      return Response.json({
        designation:'RSHIP-BOT-ARB-001', name:'ARBITER', type:'WORKFLOW_BOT',
        poweredBy:'OPEREX AGI · RSHIP-2026-OPEREX-001',
        latin:'arbiter', meaning:'task master · workflow judge · orchestrator',
        commands:['/task new','/task workflow','/task workflows','/task create','/task assign','/task done','/task block','/task escalate','/task list','/task report','/task templates','/task help'],
        templates:Object.keys(TEMPLATES),
        workflows:workflows.size, tasks:taskIndex.size,
        requestCount, uptimeSec:parseFloat(((Date.now()-startTime)/1000).toFixed(2)),
        phi:PHI, alive:true
      }, {headers:cors});

    if (path === '/')
      return new Response(buildInfoPage(),{headers:{'Content-Type':'text/html;charset=UTF-8',...cors}});

    return Response.json({ error:'NOT_FOUND', path,
      available:['/','/slack/command','/slack/events','/api/workflows','/api/tasks','/api/report','/api/status']
    }, {status:404, headers:cors});
  },
};
