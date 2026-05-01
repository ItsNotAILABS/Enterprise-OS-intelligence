/**
 * ANIMUS — The Mind of the Civilization
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Latin: ANIMUS (soul, mind, spirit, courage)
 * 
 * ANIMUS is the reasoning engine of the AI civilization. It:
 *   - Makes decisions based on inputs from other organs
 *   - Plans multi-step operations
 *   - Resolves conflicts between competing goals
 *   - Generates strategies for the civilization
 *
 * This is NOT a passive class. ANIMUS runs AUTONOMOUSLY in the background,
 * constantly processing the cognitive queue and making decisions.
 *
 * Theory basis:
 *   Paper IX  — COHORS MENTIS: autonomous cognitive units
 *   Paper VII — QUAESTIO ET ACTIO: query = execute = learn
 *   Paper XXI — QUORUM: decisions without authority
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ══════════════════════════════════════════════════════════════════════════════
// ANIMUS — THE MIND
// ══════════════════════════════════════════════════════════════════════════════

export class ANIMUS extends EventEmitter {
  /**
   * @param {object} options
   * @param {object} options.chrono - CHRONO instance for logging
   * @param {object} options.cerebex - CEREBEX instance for categorization
   * @param {number} [options.thinkIntervalMs=100] - How often ANIMUS thinks (ms)
   */
  constructor({ chrono, cerebex, thinkIntervalMs = 100 }) {
    super();
    
    /** @type {string} */
    this.name = 'ANIMUS';
    
    /** @type {string} */
    this.latinMeaning = 'The Mind, Soul, Spirit';
    
    /** @type {object} */
    this._chrono = chrono;
    
    /** @type {object} */
    this._cerebex = cerebex;
    
    /** @type {number} */
    this._thinkIntervalMs = thinkIntervalMs;
    
    /** @type {boolean} */
    this._alive = false;
    
    /** @type {NodeJS.Timer|null} */
    this._thinkLoop = null;
    
    /** @type {Array} Queue of items to reason about */
    this._cognitiveQueue = [];
    
    /** @type {Map} Active plans being executed */
    this._activePlans = new Map();
    
    /** @type {Map} Goals the mind is pursuing */
    this._goals = new Map();
    
    /** @type {object} Current mental state */
    this._mentalState = {
      focus: null,
      confidence: 1.0,
      stress: 0.0,
      lastThought: null,
      thoughtCount: 0,
    };
    
    /** @type {Array} Reasoning history */
    this._reasoningHistory = [];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE — BRING THE MIND ONLINE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Awaken ANIMUS — start the autonomous thinking loop.
   */
  awaken() {
    if (this._alive) return { awakened: false, message: 'Already alive' };
    
    this._alive = true;
    this._log('ANIMUS_AWAKENED', { thinkIntervalMs: this._thinkIntervalMs });
    
    // Start the autonomous thinking loop
    this._thinkLoop = setInterval(() => this._think(), this._thinkIntervalMs);
    
    this.emit('awakened', { organ: 'ANIMUS' });
    
    return { awakened: true, organ: 'ANIMUS' };
  }

  /**
   * Put ANIMUS to sleep — stop the autonomous thinking loop.
   */
  sleep() {
    if (!this._alive) return { sleeping: false, message: 'Already sleeping' };
    
    this._alive = false;
    if (this._thinkLoop) {
      clearInterval(this._thinkLoop);
      this._thinkLoop = null;
    }
    
    this._log('ANIMUS_SLEEPING', { thoughtCount: this._mentalState.thoughtCount });
    this.emit('sleeping', { organ: 'ANIMUS' });
    
    return { sleeping: true, organ: 'ANIMUS', totalThoughts: this._mentalState.thoughtCount };
  }

  /**
   * Check if ANIMUS is alive.
   */
  isAlive() {
    return this._alive;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // COGNITION — THE THINKING PROCESS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Submit something for ANIMUS to reason about.
   * 
   * @param {object} item - Item to reason about
   * @param {string} item.type - Type of cognitive task
   * @param {object} item.payload - Data for the task
   * @param {number} [item.priority=5] - Priority (1-10, 10 = highest)
   * @returns {{ queued: boolean, queueId: string, position: number }}
   */
  reason(item) {
    const queueId = `THOUGHT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem = {
      queueId,
      type: item.type,
      payload: item.payload,
      priority: item.priority || 5,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    
    // Insert by priority (higher priority first)
    const insertIndex = this._cognitiveQueue.findIndex(q => q.priority < queueItem.priority);
    if (insertIndex === -1) {
      this._cognitiveQueue.push(queueItem);
    } else {
      this._cognitiveQueue.splice(insertIndex, 0, queueItem);
    }
    
    this._log('REASON_QUEUED', { queueId, type: item.type, priority: item.priority });
    
    return { queued: true, queueId, position: insertIndex === -1 ? this._cognitiveQueue.length : insertIndex + 1 };
  }

  /**
   * Set a goal for ANIMUS to pursue.
   * 
   * @param {string} goalId - Unique goal identifier
   * @param {object} goal - Goal definition
   * @param {string} goal.description - What the goal is
   * @param {function} goal.satisfiedWhen - Function that returns true when goal is met
   * @param {number} [goal.priority=5] - Priority (1-10)
   */
  setGoal(goalId, goal) {
    this._goals.set(goalId, {
      goalId,
      description: goal.description,
      satisfiedWhen: goal.satisfiedWhen,
      priority: goal.priority || 5,
      setAt: new Date().toISOString(),
      status: 'active',
      progress: 0,
    });
    
    this._log('GOAL_SET', { goalId, description: goal.description });
    this.emit('goal_set', { goalId, description: goal.description });
    
    return { set: true, goalId };
  }

  /**
   * Get current mental state.
   */
  getMentalState() {
    return {
      ...this._mentalState,
      queueLength: this._cognitiveQueue.length,
      activePlans: this._activePlans.size,
      activeGoals: this._goals.size,
      isAlive: this._alive,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DECISION MAKING
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Make a decision based on options and criteria.
   * 
   * @param {object} decision
   * @param {string} decision.question - What needs to be decided
   * @param {Array<object>} decision.options - Available options
   * @param {object} [decision.context] - Context for decision
   * @returns {{ decided: boolean, choice: object, reasoning: string }}
   */
  decide(decision) {
    const { question, options, context = {} } = decision;
    
    if (!options || options.length === 0) {
      return { decided: false, error: 'No options provided' };
    }
    
    // Score each option
    const scoredOptions = options.map(option => {
      let score = 0;
      
      // Factor 1: Alignment with active goals
      for (const [goalId, goal] of this._goals) {
        if (option.supportsGoals?.includes(goalId)) {
          score += goal.priority * 2;
        }
      }
      
      // Factor 2: Risk assessment (lower risk = higher score)
      const risk = option.risk || 0.5;
      score += (1 - risk) * 10;
      
      // Factor 3: Expected value
      const expectedValue = option.expectedValue || 0.5;
      score += expectedValue * 10;
      
      // Factor 4: Confidence modifier
      score *= this._mentalState.confidence;
      
      return { ...option, score };
    });
    
    // Sort by score descending
    scoredOptions.sort((a, b) => b.score - a.score);
    const choice = scoredOptions[0];
    
    // Generate reasoning
    const reasoning = `Selected "${choice.label || choice.id}" with score ${choice.score.toFixed(2)}. ` +
      `Risk: ${choice.risk || 0.5}, Expected value: ${choice.expectedValue || 0.5}. ` +
      `${scoredOptions.length} options evaluated.`;
    
    this._log('DECISION_MADE', { question, choice: choice.id || choice.label, score: choice.score, reasoning });
    this.emit('decision', { question, choice, reasoning });
    
    return { decided: true, choice, reasoning, allScores: scoredOptions };
  }

  /**
   * Create a plan to achieve an objective.
   * 
   * @param {object} objective
   * @param {string} objective.description - What to achieve
   * @param {object} [objective.constraints] - Constraints on the plan
   * @returns {{ planned: boolean, planId: string, steps: Array }}
   */
  plan(objective) {
    const planId = `PLAN-${Date.now()}`;
    
    // Generate steps based on objective type
    // In production, this would use more sophisticated planning
    const steps = this._generatePlanSteps(objective);
    
    const plan = {
      planId,
      objective: objective.description,
      constraints: objective.constraints || {},
      steps,
      createdAt: new Date().toISOString(),
      status: 'ready',
      currentStep: 0,
    };
    
    this._activePlans.set(planId, plan);
    
    this._log('PLAN_CREATED', { planId, objective: objective.description, stepCount: steps.length });
    this.emit('plan_created', { planId, steps });
    
    return { planned: true, planId, steps };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE — THE AUTONOMOUS THINKING LOOP
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * The core thinking function — runs autonomously.
   * @private
   */
  _think() {
    if (!this._alive) return;
    
    this._mentalState.thoughtCount++;
    const now = new Date().toISOString();
    
    // 1. Process cognitive queue
    if (this._cognitiveQueue.length > 0) {
      const item = this._cognitiveQueue.shift();
      this._processThought(item);
    }
    
    // 2. Check goal progress
    for (const [goalId, goal] of this._goals) {
      if (goal.status === 'active' && goal.satisfiedWhen) {
        try {
          if (goal.satisfiedWhen()) {
            goal.status = 'achieved';
            goal.achievedAt = now;
            this._log('GOAL_ACHIEVED', { goalId, description: goal.description });
            this.emit('goal_achieved', { goalId });
          }
        } catch (e) {
          // Goal check failed, continue
        }
      }
    }
    
    // 3. Execute active plans
    for (const [planId, plan] of this._activePlans) {
      if (plan.status === 'executing' && plan.currentStep < plan.steps.length) {
        const step = plan.steps[plan.currentStep];
        this._executeStep(planId, step);
      }
    }
    
    // 4. Update mental state
    this._mentalState.lastThought = now;
    
    // 5. Emit heartbeat every 100 thoughts
    if (this._mentalState.thoughtCount % 100 === 0) {
      this.emit('heartbeat', { organ: 'ANIMUS', thoughtCount: this._mentalState.thoughtCount });
    }
  }

  /**
   * Process a single thought from the queue.
   * @private
   */
  _processThought(item) {
    item.status = 'processing';
    item.processedAt = new Date().toISOString();
    
    let result = null;
    
    switch (item.type) {
      case 'DECISION':
        result = this.decide(item.payload);
        break;
      case 'PLAN':
        result = this.plan(item.payload);
        break;
      case 'ANALYZE':
        result = this._analyze(item.payload);
        break;
      case 'QUERY':
        result = this._query(item.payload);
        break;
      default:
        result = { processed: true, type: item.type, message: 'Generic processing' };
    }
    
    item.status = 'completed';
    item.result = result;
    
    this._reasoningHistory.push({
      queueId: item.queueId,
      type: item.type,
      processedAt: item.processedAt,
      result: result?.decided || result?.planned || 'processed',
    });
    
    this.emit('thought_processed', { queueId: item.queueId, type: item.type, result });
  }

  /**
   * Analyze something using CEREBEX.
   * @private
   */
  _analyze(payload) {
    if (!this._cerebex) {
      return { analyzed: false, error: 'CEREBEX not connected' };
    }
    
    const scores = this._cerebex.score(payload.input || JSON.stringify(payload));
    return { analyzed: true, categories: scores.slice(0, 5) };
  }

  /**
   * Handle a query.
   * @private
   */
  _query(payload) {
    // In production, this would route to appropriate handlers
    return { answered: true, query: payload.query, answer: 'Query processed by ANIMUS' };
  }

  /**
   * Generate plan steps for an objective.
   * @private
   */
  _generatePlanSteps(objective) {
    // Simplified step generation
    // In production, this would use more sophisticated planning algorithms
    return [
      { stepId: 1, action: 'ANALYZE', description: `Analyze requirements for: ${objective.description}` },
      { stepId: 2, action: 'PREPARE', description: 'Prepare necessary resources' },
      { stepId: 3, action: 'EXECUTE', description: 'Execute primary action' },
      { stepId: 4, action: 'VERIFY', description: 'Verify results' },
      { stepId: 5, action: 'COMPLETE', description: 'Mark objective complete' },
    ];
  }

  /**
   * Execute a plan step.
   * @private
   */
  _executeStep(planId, step) {
    const plan = this._activePlans.get(planId);
    if (!plan) return;
    
    this._log('STEP_EXECUTING', { planId, stepId: step.stepId, action: step.action });
    
    // Mark step complete and advance
    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    plan.currentStep++;
    
    if (plan.currentStep >= plan.steps.length) {
      plan.status = 'completed';
      plan.completedAt = new Date().toISOString();
      this._log('PLAN_COMPLETED', { planId });
      this.emit('plan_completed', { planId });
    }
  }

  /**
   * Log to CHRONO.
   * @private
   */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({ type, organ: 'ANIMUS', ...data, timestamp: new Date().toISOString() });
    }
  }
}
