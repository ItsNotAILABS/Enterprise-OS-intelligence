/**
 * OPERATIONAL AGENTS — The Workers of the Civilization
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * These are the specialized AI agents that perform specific functions within
 * the civilization. They work autonomously and coordinate through the organs.
 * 
 * CUSTOS    — The Guardian (security, compliance, access control)
 * FABRICOR  — The Builder (artifact generation, document creation)
 * NUNTIUS   — The Messenger (routing, delivery, communication)
 * ARBITER   — The Judge (quorum decisions, conflict resolution)
 * MEDICUS   — The Healer (self-healing, recovery, repair)
 * MAGISTER  — The Teacher (training, knowledge transfer)
 * SCRIBA    — The Scribe (logging, records, audit trail)
 * VIGIL     — The Watcher (monitoring, alerting, observability)
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ══════════════════════════════════════════════════════════════════════════════
// BASE AGENT CLASS
// ══════════════════════════════════════════════════════════════════════════════

class BaseAgent extends EventEmitter {
  constructor(name, latinMeaning, chrono) {
    super();
    this.name = name;
    this.latinMeaning = latinMeaning;
    this._chrono = chrono;
    this._alive = false;
    this._taskCount = 0;
    this._loop = null;
    this._intervalMs = 100;
  }

  awaken() {
    if (this._alive) return { awakened: false };
    this._alive = true;
    this._loop = setInterval(() => this._work(), this._intervalMs);
    this._log(`${this.name}_AWAKENED`);
    this.emit('awakened', { agent: this.name });
    return { awakened: true, agent: this.name };
  }

  sleep() {
    if (!this._alive) return { sleeping: false };
    this._alive = false;
    if (this._loop) clearInterval(this._loop);
    this._log(`${this.name}_SLEEPING`);
    this.emit('sleeping', { agent: this.name });
    return { sleeping: true, agent: this.name };
  }

  isAlive() { return this._alive; }

  _work() {
    // Override in subclass
  }

  _log(type, data = {}) {
    if (this._chrono) {
      this._chrono.append({ type, agent: this.name, ...data, timestamp: new Date().toISOString() });
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOS — THE GUARDIAN
// ══════════════════════════════════════════════════════════════════════════════

export class CUSTOS extends BaseAgent {
  constructor({ chrono }) {
    super('CUSTOS', 'Guardian, Protector, Keeper', chrono);
    this._accessPolicies = new Map();
    this._violations = [];
    this._securityEvents = [];
  }

  /**
   * Define an access policy.
   */
  definePolicy(policyId, policy) {
    this._accessPolicies.set(policyId, {
      policyId,
      resource: policy.resource,
      allowedRoles: policy.allowedRoles || [],
      conditions: policy.conditions || {},
      createdAt: new Date().toISOString(),
    });
    this._log('POLICY_DEFINED', { policyId, resource: policy.resource });
    return { defined: true, policyId };
  }

  /**
   * Check if access is allowed.
   */
  checkAccess(resource, role, context = {}) {
    for (const [policyId, policy] of this._accessPolicies) {
      if (policy.resource === resource || policy.resource === '*') {
        const allowed = policy.allowedRoles.includes(role) || policy.allowedRoles.includes('*');
        if (!allowed) {
          this._violations.push({
            resource, role, context, policyId,
            timestamp: new Date().toISOString(),
          });
          this._log('ACCESS_DENIED', { resource, role, policyId });
          this.emit('access_denied', { resource, role });
          return { allowed: false, reason: `Policy ${policyId} denies access` };
        }
      }
    }
    this._log('ACCESS_GRANTED', { resource, role });
    return { allowed: true };
  }

  /**
   * Report a security event.
   */
  reportSecurityEvent(event) {
    const secEvent = {
      eventId: `SEC-${Date.now()}`,
      ...event,
      reportedAt: new Date().toISOString(),
    };
    this._securityEvents.push(secEvent);
    this._log('SECURITY_EVENT', secEvent);
    this.emit('security_event', secEvent);
    return { reported: true, eventId: secEvent.eventId };
  }

  _work() {
    if (!this._alive) return;
    this._taskCount++;
    // Periodic security scan
    if (this._taskCount % 100 === 0) {
      this.emit('heartbeat', { agent: 'CUSTOS', violations: this._violations.length });
    }
  }

  getState() {
    return {
      policies: this._accessPolicies.size,
      violations: this._violations.length,
      securityEvents: this._securityEvents.length,
      isAlive: this._alive,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FABRICOR — THE BUILDER
// ══════════════════════════════════════════════════════════════════════════════

export class FABRICOR extends BaseAgent {
  constructor({ chrono, corpus }) {
    super('FABRICOR', 'Builder, Maker, Creator', chrono);
    this._corpus = corpus;
    this._artifactQueue = [];
    this._generatedArtifacts = new Map();
  }

  /**
   * Queue an artifact for generation.
   */
  queueArtifact(spec) {
    const requestId = `FAB-${Date.now()}`;
    this._artifactQueue.push({ requestId, spec, queuedAt: new Date().toISOString() });
    this._log('ARTIFACT_QUEUED', { requestId, type: spec.type });
    return { queued: true, requestId };
  }

  /**
   * Generate an artifact immediately.
   */
  generateNow(spec) {
    const artifactId = `ART-${Date.now()}`;
    const artifact = this._buildArtifact(spec);
    this._generatedArtifacts.set(artifactId, artifact);
    this._log('ARTIFACT_GENERATED', { artifactId, type: spec.type });
    this.emit('artifact_generated', { artifactId, artifact });
    return { generated: true, artifactId, artifact };
  }

  _buildArtifact(spec) {
    switch (spec.type) {
      case 'REPORT':
        return this._buildReport(spec);
      case 'DOCUMENT':
        return this._buildDocument(spec);
      case 'FLOW':
        return this._buildFlow(spec);
      case 'SCHEMA':
        return this._buildSchema(spec);
      default:
        return { type: spec.type, data: spec.data, generatedBy: 'FABRICOR', at: new Date().toISOString() };
    }
  }

  _buildReport(spec) {
    return {
      type: 'REPORT',
      title: spec.title || 'Generated Report',
      sections: spec.sections || [],
      data: spec.data || {},
      metadata: { generatedBy: 'FABRICOR', at: new Date().toISOString() },
    };
  }

  _buildDocument(spec) {
    return {
      type: 'DOCUMENT',
      title: spec.title || 'Generated Document',
      content: spec.content || '',
      format: spec.format || 'text',
      metadata: { generatedBy: 'FABRICOR', at: new Date().toISOString() },
    };
  }

  _buildFlow(spec) {
    return {
      type: 'FLOW',
      name: spec.name || 'Generated Flow',
      steps: spec.steps || [],
      triggers: spec.triggers || [],
      metadata: { generatedBy: 'FABRICOR', at: new Date().toISOString() },
    };
  }

  _buildSchema(spec) {
    return {
      type: 'SCHEMA',
      name: spec.name || 'Generated Schema',
      fields: spec.fields || {},
      relationships: spec.relationships || [],
      metadata: { generatedBy: 'FABRICOR', at: new Date().toISOString() },
    };
  }

  _work() {
    if (!this._alive) return;
    this._taskCount++;
    // Process artifact queue
    if (this._artifactQueue.length > 0) {
      const item = this._artifactQueue.shift();
      const result = this.generateNow(item.spec);
      item.result = result;
    }
  }

  getState() {
    return {
      queueLength: this._artifactQueue.length,
      generatedCount: this._generatedArtifacts.size,
      isAlive: this._alive,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// NUNTIUS — THE MESSENGER
// ══════════════════════════════════════════════════════════════════════════════

export class NUNTIUS extends BaseAgent {
  constructor({ chrono, nexoris }) {
    super('NUNTIUS', 'Messenger, Herald, Announcer', chrono);
    this._nexoris = nexoris;
    this._messageQueue = [];
    this._deliveredMessages = [];
    this._subscribers = new Map();
  }

  /**
   * Send a message.
   */
  send(message) {
    const messageId = `MSG-${Date.now()}`;
    const msg = {
      messageId,
      from: message.from,
      to: message.to,
      content: message.content,
      priority: message.priority || 5,
      sentAt: new Date().toISOString(),
      status: 'queued',
    };
    this._messageQueue.push(msg);
    this._log('MESSAGE_SENT', { messageId, from: message.from, to: message.to });
    return { sent: true, messageId };
  }

  /**
   * Subscribe to a topic.
   */
  subscribe(topic, handler) {
    if (!this._subscribers.has(topic)) {
      this._subscribers.set(topic, []);
    }
    this._subscribers.get(topic).push(handler);
    this._log('SUBSCRIBED', { topic });
    return { subscribed: true, topic };
  }

  /**
   * Publish to a topic.
   */
  publish(topic, content) {
    const handlers = this._subscribers.get(topic) || [];
    for (const handler of handlers) {
      try {
        handler(content);
      } catch (e) {
        // Continue on error
      }
    }
    this._log('PUBLISHED', { topic, subscriberCount: handlers.length });
    this.emit('published', { topic, content });
    return { published: true, topic, reached: handlers.length };
  }

  _work() {
    if (!this._alive) return;
    this._taskCount++;
    // Deliver queued messages
    if (this._messageQueue.length > 0) {
      const msg = this._messageQueue.shift();
      msg.status = 'delivered';
      msg.deliveredAt = new Date().toISOString();
      this._deliveredMessages.push(msg);
      this.emit('message_delivered', msg);
    }
  }

  getState() {
    return {
      queueLength: this._messageQueue.length,
      deliveredCount: this._deliveredMessages.length,
      topics: this._subscribers.size,
      isAlive: this._alive,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ARBITER — THE JUDGE
// ══════════════════════════════════════════════════════════════════════════════

export class ARBITER extends BaseAgent {
  constructor({ chrono, cognovex }) {
    super('ARBITER', 'Judge, Arbiter, Decision-Maker', chrono);
    this._cognovex = cognovex;
    this._pendingDecisions = [];
    this._madeDecisions = [];
    this._quorumThreshold = 0.6; // 60% agreement needed
  }

  /**
   * Submit a decision for arbitration.
   */
  submitDecision(decision) {
    const decisionId = `DEC-${Date.now()}`;
    const dec = {
      decisionId,
      question: decision.question,
      options: decision.options,
      votes: new Map(),
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    this._pendingDecisions.push(dec);
    this._log('DECISION_SUBMITTED', { decisionId, question: decision.question });
    return { submitted: true, decisionId };
  }

  /**
   * Cast a vote on a decision.
   */
  vote(decisionId, voterId, option) {
    const decision = this._pendingDecisions.find(d => d.decisionId === decisionId);
    if (!decision) return { voted: false, error: 'Decision not found' };
    
    decision.votes.set(voterId, option);
    this._log('VOTE_CAST', { decisionId, voterId, option });
    
    // Check if quorum reached
    this._checkQuorum(decision);
    
    return { voted: true, decisionId, totalVotes: decision.votes.size };
  }

  _checkQuorum(decision) {
    if (decision.options.length === 0) return;
    
    const voteCounts = new Map();
    for (const [voterId, option] of decision.votes) {
      voteCounts.set(option, (voteCounts.get(option) || 0) + 1);
    }
    
    const totalVotes = decision.votes.size;
    for (const [option, count] of voteCounts) {
      if (count / totalVotes >= this._quorumThreshold) {
        decision.status = 'decided';
        decision.result = option;
        decision.decidedAt = new Date().toISOString();
        this._madeDecisions.push(decision);
        this._pendingDecisions = this._pendingDecisions.filter(d => d.decisionId !== decision.decisionId);
        this._log('QUORUM_REACHED', { decisionId: decision.decisionId, result: option });
        this.emit('decision_made', { decisionId: decision.decisionId, result: option });
        return;
      }
    }
  }

  _work() {
    if (!this._alive) return;
    this._taskCount++;
    // Periodic decision review
    if (this._taskCount % 50 === 0) {
      this.emit('heartbeat', { agent: 'ARBITER', pending: this._pendingDecisions.length });
    }
  }

  getState() {
    return {
      pendingDecisions: this._pendingDecisions.length,
      madeDecisions: this._madeDecisions.length,
      quorumThreshold: this._quorumThreshold,
      isAlive: this._alive,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MEDICUS — THE HEALER
// ══════════════════════════════════════════════════════════════════════════════

export class MEDICUS extends BaseAgent {
  constructor({ chrono }) {
    super('MEDICUS', 'Healer, Doctor, Physician', chrono);
    this._healthChecks = new Map();
    this._healingQueue = [];
    this._healedCount = 0;
  }

  /**
   * Register a health check for a component.
   */
  registerHealthCheck(componentId, checker) {
    this._healthChecks.set(componentId, {
      componentId,
      checker,
      lastCheck: null,
      healthy: true,
    });
    this._log('HEALTH_CHECK_REGISTERED', { componentId });
    return { registered: true, componentId };
  }

  /**
   * Report a problem for healing.
   */
  reportProblem(problem) {
    const problemId = `PROB-${Date.now()}`;
    this._healingQueue.push({
      problemId,
      component: problem.component,
      description: problem.description,
      severity: problem.severity || 'medium',
      reportedAt: new Date().toISOString(),
      status: 'pending',
    });
    this._log('PROBLEM_REPORTED', { problemId, component: problem.component });
    this.emit('problem_reported', { problemId });
    return { reported: true, problemId };
  }

  /**
   * Attempt to heal a problem.
   */
  heal(problemId) {
    const problem = this._healingQueue.find(p => p.problemId === problemId);
    if (!problem) return { healed: false, error: 'Problem not found' };
    
    // Simulate healing attempt
    problem.status = 'healed';
    problem.healedAt = new Date().toISOString();
    this._healedCount++;
    this._healingQueue = this._healingQueue.filter(p => p.problemId !== problemId);
    
    this._log('PROBLEM_HEALED', { problemId, component: problem.component });
    this.emit('healed', { problemId, component: problem.component });
    
    return { healed: true, problemId };
  }

  _work() {
    if (!this._alive) return;
    this._taskCount++;
    
    // Run health checks
    if (this._taskCount % 10 === 0) {
      for (const [componentId, check] of this._healthChecks) {
        try {
          const result = check.checker();
          check.healthy = result;
          check.lastCheck = new Date().toISOString();
          if (!result) {
            this.reportProblem({ component: componentId, description: 'Health check failed', severity: 'high' });
          }
        } catch (e) {
          check.healthy = false;
        }
      }
    }
    
    // Auto-heal pending problems
    if (this._healingQueue.length > 0 && this._taskCount % 5 === 0) {
      const problem = this._healingQueue[0];
      this.heal(problem.problemId);
    }
  }

  getState() {
    return {
      healthChecks: this._healthChecks.size,
      pendingProblems: this._healingQueue.length,
      healedCount: this._healedCount,
      isAlive: this._alive,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAGISTER — THE TEACHER
// ══════════════════════════════════════════════════════════════════════════════

export class MAGISTER extends BaseAgent {
  constructor({ chrono, memoria }) {
    super('MAGISTER', 'Teacher, Master, Instructor', chrono);
    this._memoria = memoria;
    this._knowledge = new Map();
    this._trainingQueue = [];
    this._trainedCount = 0;
  }

  /**
   * Teach a concept.
   */
  teach(concept) {
    const conceptId = `CONCEPT-${Date.now()}`;
    this._knowledge.set(conceptId, {
      conceptId,
      name: concept.name,
      description: concept.description,
      examples: concept.examples || [],
      taughtAt: new Date().toISOString(),
    });
    
    // Store in MEMORIA if available
    if (this._memoria) {
      this._memoria.storeFact(conceptId, concept, ['knowledge', concept.name]);
    }
    
    this._log('CONCEPT_TAUGHT', { conceptId, name: concept.name });
    this.emit('taught', { conceptId, name: concept.name });
    
    return { taught: true, conceptId };
  }

  /**
   * Queue training.
   */
  queueTraining(training) {
    const trainingId = `TRAIN-${Date.now()}`;
    this._trainingQueue.push({
      trainingId,
      topic: training.topic,
      material: training.material,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    });
    this._log('TRAINING_QUEUED', { trainingId, topic: training.topic });
    return { queued: true, trainingId };
  }

  /**
   * Execute training.
   */
  train(trainingId) {
    const training = this._trainingQueue.find(t => t.trainingId === trainingId);
    if (!training) return { trained: false, error: 'Training not found' };
    
    training.status = 'completed';
    training.completedAt = new Date().toISOString();
    this._trainedCount++;
    this._trainingQueue = this._trainingQueue.filter(t => t.trainingId !== trainingId);
    
    this._log('TRAINING_COMPLETED', { trainingId, topic: training.topic });
    this.emit('trained', { trainingId, topic: training.topic });
    
    return { trained: true, trainingId };
  }

  _work() {
    if (!this._alive) return;
    this._taskCount++;
    
    // Process training queue
    if (this._trainingQueue.length > 0 && this._taskCount % 10 === 0) {
      const training = this._trainingQueue[0];
      this.train(training.trainingId);
    }
  }

  getState() {
    return {
      knowledgeCount: this._knowledge.size,
      pendingTraining: this._trainingQueue.length,
      trainedCount: this._trainedCount,
      isAlive: this._alive,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SCRIBA — THE SCRIBE
// ══════════════════════════════════════════════════════════════════════════════

export class SCRIBA extends BaseAgent {
  constructor({ chrono }) {
    super('SCRIBA', 'Scribe, Writer, Recorder', chrono);
    this._records = [];
    this._auditTrail = [];
  }

  /**
   * Record an event.
   */
  record(event) {
    const recordId = `REC-${Date.now()}`;
    const record = {
      recordId,
      type: event.type,
      data: event.data,
      source: event.source,
      recordedAt: new Date().toISOString(),
    };
    this._records.push(record);
    
    // Also log to CHRONO
    this._log('EVENT_RECORDED', { recordId, type: event.type });
    
    return { recorded: true, recordId };
  }

  /**
   * Create an audit entry.
   */
  audit(entry) {
    const auditId = `AUDIT-${Date.now()}`;
    const audit = {
      auditId,
      action: entry.action,
      actor: entry.actor,
      resource: entry.resource,
      result: entry.result,
      auditedAt: new Date().toISOString(),
    };
    this._auditTrail.push(audit);
    this._log('AUDIT_ENTRY', audit);
    
    return { audited: true, auditId };
  }

  /**
   * Search records.
   */
  searchRecords(query) {
    const queryLower = query.toLowerCase();
    return this._records.filter(r => 
      JSON.stringify(r).toLowerCase().includes(queryLower)
    );
  }

  _work() {
    if (!this._alive) return;
    this._taskCount++;
    if (this._taskCount % 100 === 0) {
      this.emit('heartbeat', { agent: 'SCRIBA', records: this._records.length });
    }
  }

  getState() {
    return {
      recordCount: this._records.length,
      auditCount: this._auditTrail.length,
      isAlive: this._alive,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// VIGIL — THE WATCHER
// ══════════════════════════════════════════════════════════════════════════════

export class VIGIL extends BaseAgent {
  constructor({ chrono }) {
    super('VIGIL', 'Watcher, Sentinel, Guardian', chrono);
    this._monitors = new Map();
    this._alerts = [];
    this._metrics = new Map();
  }

  /**
   * Register a monitor.
   */
  monitor(monitorId, config) {
    this._monitors.set(monitorId, {
      monitorId,
      target: config.target,
      check: config.check,
      threshold: config.threshold,
      interval: config.interval || 1000,
      lastCheck: null,
      status: 'healthy',
    });
    this._log('MONITOR_REGISTERED', { monitorId, target: config.target });
    return { registered: true, monitorId };
  }

  /**
   * Record a metric.
   */
  recordMetric(metricId, value) {
    if (!this._metrics.has(metricId)) {
      this._metrics.set(metricId, []);
    }
    this._metrics.get(metricId).push({
      value,
      recordedAt: new Date().toISOString(),
    });
    
    // Keep only last 1000 values per metric
    const values = this._metrics.get(metricId);
    if (values.length > 1000) {
      values.shift();
    }
    
    return { recorded: true, metricId, value };
  }

  /**
   * Get metric statistics.
   */
  getMetricStats(metricId) {
    const values = this._metrics.get(metricId);
    if (!values || values.length === 0) return null;
    
    const nums = values.map(v => v.value);
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / nums.length;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    
    return { metricId, count: nums.length, avg, min, max };
  }

  /**
   * Raise an alert.
   */
  alert(alert) {
    const alertId = `ALERT-${Date.now()}`;
    const alertObj = {
      alertId,
      level: alert.level || 'warning',
      message: alert.message,
      source: alert.source,
      raisedAt: new Date().toISOString(),
      acknowledged: false,
    };
    this._alerts.push(alertObj);
    this._log('ALERT_RAISED', alertObj);
    this.emit('alert', alertObj);
    
    return { alerted: true, alertId };
  }

  _work() {
    if (!this._alive) return;
    this._taskCount++;
    
    // Run monitors
    if (this._taskCount % 10 === 0) {
      for (const [monitorId, monitor] of this._monitors) {
        try {
          const result = monitor.check();
          monitor.lastCheck = new Date().toISOString();
          
          if (monitor.threshold && result > monitor.threshold) {
            monitor.status = 'warning';
            this.alert({
              level: 'warning',
              message: `Monitor ${monitorId} exceeded threshold: ${result} > ${monitor.threshold}`,
              source: monitorId,
            });
          } else {
            monitor.status = 'healthy';
          }
        } catch (e) {
          monitor.status = 'error';
        }
      }
    }
  }

  getState() {
    return {
      monitorCount: this._monitors.size,
      alertCount: this._alerts.length,
      metricCount: this._metrics.size,
      isAlive: this._alive,
    };
  }
}
