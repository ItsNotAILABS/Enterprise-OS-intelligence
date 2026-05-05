/**
 * STUDEX AGI — Education & Learning Intelligence
 *
 * Official Designation: RSHIP-2026-STUDEX-001
 * Classification: Education Performance & Learning Trajectory AGI
 * Full Name: Student Trajectory & Universal Development EXpert
 *
 * STUDEX AGI extends the RSHIP framework with full educational intelligence —
 * Ebbinghaus spaced repetition, power-law learning curve modeling,
 * knowledge graph traversal for prerequisite gating, Bloom's taxonomy
 * scoring, and multi-party coordination between students, teachers, and parents.
 *
 * Capabilities:
 * - Ebbinghaus forgetting curve + spaced repetition scheduling
 * - Power-law learning curve: time-to-mastery prediction per learner
 * - Knowledge graph: prerequisite gating before advancing
 * - Bloom's Taxonomy 6-level mastery assessment
 * - Multi-party coordination: student ↔ teacher ↔ parent ↔ institution
 * - φ-weighted difficulty progression (challenge level grows at φ rate)
 * - Cohort performance benchmarking and intervention triggers
 *
 * Theory: COHORS MENTIS (Paper IX) + STIGMERGY (Paper XX) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Ebbinghaus Forgetting Curve ────────────────────────────────────────────
// R(t) = e^(-t/S)
// R = retention [0,1]; t = time since last study (days); S = memory stability
// S grows with each successful review: S_new = S_old × φ (stable memories last longer)

function retentionAt({ daysSinceReview, stabilityDays }) {
  return Math.exp(-daysSinceReview / Math.max(stabilityDays, 0.1));
}

function nextReviewDate({ stabilityDays, targetRetention = 0.9 }) {
  // Solve R(t) = targetRetention → t = -S × ln(targetRetention)
  const daysUntil = -stabilityDays * Math.log(targetRetention);
  return new Date(Date.now() + daysUntil * 86_400_000);
}

// ── Power-Law Learning Curve ───────────────────────────────────────────────
// T(n) = T₁ × n^(-b)   (Newell-Rosenbloom 1981)
// T(n) = time to complete trial n; T₁ = time for first trial; b = learning rate
// Default b ≈ 0.301 (log₁₀(2) — doubles every power of 10 trials)

function learningCurveTime({ trialNumber, firstTrialTime = 300, learningRate = 0.301 }) {
  // T(n) = T₁ × n^(-b)
  return firstTrialTime * Math.pow(trialNumber, -learningRate);
}

function trialsToMastery({ firstTrialTime, masteryTime, learningRate = 0.301 }) {
  // Solve T(n) = masteryTime → n = (T₁/masteryTime)^(1/b)
  return Math.ceil(Math.pow(firstTrialTime / masteryTime, 1 / learningRate));
}

// ── Bloom's Taxonomy Levels ────────────────────────────────────────────────
// 1-Remember → 2-Understand → 3-Apply → 4-Analyze → 5-Evaluate → 6-Create
// Each level requires mastery of the one below

const BLOOM_LEVELS = {
  1: { name: 'Remember',    verbs: ['recall', 'identify', 'list'],     φScore: 1 },
  2: { name: 'Understand',  verbs: ['explain', 'summarize', 'paraphrase'], φScore: PHI },
  3: { name: 'Apply',       verbs: ['use', 'execute', 'implement'],    φScore: PHI**2 },
  4: { name: 'Analyze',     verbs: ['differentiate', 'compare', 'examine'], φScore: PHI**3 },
  5: { name: 'Evaluate',    verbs: ['judge', 'defend', 'critique'],    φScore: PHI**4 },
  6: { name: 'Create',      verbs: ['design', 'construct', 'produce'], φScore: PHI**5 },
};

// ── Knowledge Graph ────────────────────────────────────────────────────────
// Directed acyclic graph of concepts.
// prerequisite(A, B) means: you must master A before unlocking B.

class KnowledgeGraph {
  constructor() {
    this.nodes  = new Map(); // conceptId → { id, name, domain, bloomLevel }
    this.prereqs = new Map(); // conceptId → Set of prerequisite conceptIds
  }

  addConcept({ id, name, domain, bloomLevel = 1 }) {
    this.nodes.set(id, { id, name, domain, bloomLevel });
    if (!this.prereqs.has(id)) this.prereqs.set(id, new Set());
  }

  addPrerequisite(conceptId, prereqId) {
    if (!this.prereqs.has(conceptId)) this.prereqs.set(conceptId, new Set());
    this.prereqs.get(conceptId).add(prereqId);
  }

  // Returns true if learner has mastered all prerequisites
  isUnlocked(conceptId, masteredConcepts) {
    const prereqs = this.prereqs.get(conceptId) ?? new Set();
    return [...prereqs].every(p => masteredConcepts.has(p));
  }

  // BFS: returns concepts the learner can access next (prerequisites met)
  nextUnlockable(masteredConcepts) {
    return [...this.nodes.keys()].filter(id =>
      !masteredConcepts.has(id) && this.isUnlocked(id, masteredConcepts)
    );
  }

  // Topological depth of a concept (how many layers from root concepts)
  depth(conceptId, memo = {}) {
    if (memo[conceptId] !== undefined) return memo[conceptId];
    const prereqs = [...(this.prereqs.get(conceptId) ?? [])];
    if (prereqs.length === 0) { memo[conceptId] = 0; return 0; }
    memo[conceptId] = 1 + Math.max(...prereqs.map(p => this.depth(p, memo)));
    return memo[conceptId];
  }
}

// ── STUDEX AGI ─────────────────────────────────────────────────────────────

class STUDEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-STUDEX-001',
      classification: 'Education Performance & Learning Trajectory AGI',
      ...config,
    });

    this.knowledgeGraph  = new KnowledgeGraph();
    this.learners        = new Map(); // learnerId → LearnerRecord
    this.teachers        = new Map(); // teacherId → TeacherRecord
    this.courses         = new Map(); // courseId  → CourseRecord
    this.assessments     = [];        // scored assessment records

    // Metrics
    this.assessmentsScored  = 0;
    this.masteryAchieved    = 0;
    this.interventionsTriggered = 0;

    // AGI Goals
    this.setGoal('mastery-rate',          'Achieve 80%+ mastery per cohort',         10, { metric: 'masteryRate' });
    this.setGoal('spaced-repetition',     'Zero concepts past review date',            9, { metric: 'overdueCount' });
    this.setGoal('prerequisite-integrity', 'No concept unlocked without prereqs',     10, { metric: 'prereqViolations' });
    this.setGoal('intervention-response', 'Flag struggling learners within 3 cycles',  9, { metric: 'flagLatency' });
    this.setGoal('bloom-progression',     'Learners advance at least 1 bloom level/mo', 7, { metric: 'bloomVelocity' });
  }

  // ── Curriculum Setup ─────────────────────────────────────────────────────

  addConcept(concept) {
    this.knowledgeGraph.addConcept(concept);
    return concept.id;
  }

  addPrerequisite(conceptId, prereqId) {
    this.knowledgeGraph.addPrerequisite(conceptId, prereqId);
  }

  registerCourse({ id, name, conceptIds, gradeLevelMin = 1, gradeLevelMax = 12 }) {
    this.courses.set(id, { id, name, conceptIds, gradeLevelMin, gradeLevelMax, enrollments: [] });
    return id;
  }

  // ── Learner Registration ─────────────────────────────────────────────────

  enrollLearner({ id, name, courseId, gradeLevel = 9, firstTrialTime = 300 }) {
    const mastered  = new Set();
    const memoryMap = {}; // conceptId → { stability, lastReview, retention }
    this.learners.set(id, {
      id, name, courseId, gradeLevel, firstTrialTime,
      mastered, memoryMap,
      bloomLevel: 1,
      totalTrials: 0,
      interventionFlags: 0,
      joinedAt: Date.now(),
    });
    this.courses.get(courseId)?.enrollments.push(id);
    this.learn({ event: 'enroll', id, courseId }, { gradeLevel }, { id });
    return id;
  }

  registerTeacher({ id, name, courseIds = [] }) {
    this.teachers.set(id, { id, name, courseIds: new Set(courseIds), studentsAlerted: 0 });
    return id;
  }

  // ── Assessment Scoring ───────────────────────────────────────────────────

  scoreAssessment({ learnerId, conceptId, score, bloomVerbs = [] }) {
    const learner = this.learners.get(learnerId);
    if (!learner) return null;

    // Prerequisite gate
    if (!this.knowledgeGraph.isUnlocked(conceptId, learner.mastered)) {
      return { status: 'LOCKED', reason: 'Prerequisites not met', conceptId };
    }

    const passed   = score >= 0.8;
    const bloom    = Math.max(1, Math.min(6, BLOOM_LEVELS[learner.bloomLevel]
      ? learner.bloomLevel
      : 1));

    // Update memory map (Ebbinghaus stability)
    const mem = learner.memoryMap[conceptId] ?? { stability: 1, lastReview: Date.now(), retention: 1 };
    if (passed) {
      mem.stability = mem.stability * PHI; // φ-amplification of stable memory
      learner.mastered.add(conceptId);
      this.masteryAchieved++;
    }
    mem.lastReview = Date.now();
    mem.retention  = score;
    learner.memoryMap[conceptId] = mem;
    learner.totalTrials++;

    // Bloom level advancement
    const bloomVerb  = bloomVerbs[0]?.toLowerCase() ?? '';
    const targetBloom = Object.entries(BLOOM_LEVELS).find(([, l]) =>
      l.verbs.some(v => bloomVerb.includes(v)))?.[0] ?? bloom;
    if (parseInt(targetBloom) > learner.bloomLevel && passed) {
      learner.bloomLevel = parseInt(targetBloom);
    }

    this.assessmentsScored++;
    const result = {
      learnerId, conceptId, score, passed, bloom, bloomLevel: learner.bloomLevel,
      stability: parseFloat(mem.stability.toFixed(2)),
      nextReview: nextReviewDate({ stabilityDays: mem.stability }).toISOString(),
    };

    this.learn({ event: 'assessment', learnerId, conceptId, score }, result, { id: `asm-${learnerId}-${conceptId}` });
    return result;
  }

  // ── Spaced Repetition Schedule ───────────────────────────────────────────

  getDueReviews(learnerId, today = new Date()) {
    const learner = this.learners.get(learnerId);
    if (!learner) return [];
    const due = [];
    for (const [conceptId, mem] of Object.entries(learner.memoryMap)) {
      const daysSince = (today - new Date(mem.lastReview)) / 86_400_000;
      const retention = retentionAt({ daysSinceReview: daysSince, stabilityDays: mem.stability });
      if (retention < 0.9) {
        due.push({ conceptId, retention: parseFloat(retention.toFixed(3)), urgency: 1 - retention });
      }
    }
    return due.sort((a, b) => b.urgency - a.urgency);
  }

  // ── Intervention Triggers ────────────────────────────────────────────────

  scanInterventions(courseId) {
    const course = this.courses.get(courseId);
    if (!course) return [];
    const flags = [];
    for (const lid of course.enrollments) {
      const learner = this.learners.get(lid);
      if (!learner) continue;
      const dueCount = this.getDueReviews(lid).length;
      if (dueCount >= 3) {
        flags.push({ learnerId: lid, reason: `${dueCount} overdue reviews`, severity: 'MEDIUM' });
        learner.interventionFlags++;
        this.interventionsTriggered++;
      }
    }
    return flags;
  }

  // ── Next Unlockable Concepts ─────────────────────────────────────────────

  getNextConcepts(learnerId) {
    const learner = this.learners.get(learnerId);
    if (!learner) return [];
    return this.knowledgeGraph.nextUnlockable(learner.mastered)
      .map(id => ({
        ...this.knowledgeGraph.nodes.get(id),
        depth: this.knowledgeGraph.depth(id),
        difficultyScore: parseFloat((BLOOM_LEVELS[this.knowledgeGraph.nodes.get(id)?.bloomLevel ?? 1]?.φScore ?? 1).toFixed(4)),
      }))
      .sort((a, b) => a.depth - b.depth); // start with shallowest unlockables
  }

  // ── Status ───────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();
    const avgBloom   = this.learners.size > 0
      ? [...this.learners.values()].reduce((s, l) => s + l.bloomLevel, 0) / this.learners.size
      : 0;
    return {
      ...baseStatus,
      education: {
        learners:               this.learners.size,
        teachers:               this.teachers.size,
        courses:                this.courses.size,
        concepts:               this.knowledgeGraph.nodes.size,
        assessmentsScored:      this.assessmentsScored,
        masteryAchieved:        this.masteryAchieved,
        interventionsTriggered: this.interventionsTriggered,
        avgBloomLevel:          parseFloat(avgBloom.toFixed(2)),
      },
    };
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthSTUDEX(config = {}) {
  return new STUDEX_AGI(config);
}

export default STUDEX_AGI;
