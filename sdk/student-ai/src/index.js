/**
 * @medina/student-ai — src/index.js
 * ══════════════════════════════════════════════════════════════════════════════
 * DEEP-TECH EDUCATIONAL INTELLIGENCE SYSTEM
 * 
 * A powerful AI study companion powered by MERIDIAN intelligence engines:
 *   - CEREBEX: 40-category world model with φ⁻¹ learning coefficient
 *   - NEXORIS: Pheromone field routing with Kuramoto synchronization
 *   - COGNOVEX: Quorum commitment dynamics for Bloom's Taxonomy evaluation
 *
 * Theory References:
 *   Paper VII  — QUAESTIO ET ACTIO (Query-as-Execute)
 *   Paper IX   — COHORS MENTIS (Autonomous Cognitive Units)
 *   Paper XIII — DE SUBSTRATO EPISTEMICO (Epistemic Substrate)
 *   Paper XX   — STIGMERGY (Intelligence Lives in the Field)
 *   Paper XXI  — QUORUM (Decisions Without Authority)
 *   Paper XXII — AURUM (φ as Structural Attractor)
 *
 * This is not basic NLP. This is a living educational intelligence system that:
 *   - Maps subjects to analytical categories and builds a world model
 *   - Uses φ⁻¹ learning rate for optimal knowledge accumulation
 *   - Tracks which study paths work best via pheromone reinforcement
 *   - Evaluates understanding via Bloom's Taxonomy quorum consensus
 *   - Implements spaced repetition with golden-ratio intervals
 *   - Adapts difficulty based on mastery state
 *   - Detects weaknesses via free energy analysis
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Dallas, Texas
 * ══════════════════════════════════════════════════════════════════════════════
 */

import {
  CEREBEX,
  CATEGORIES,
  NEXORIS,
  PHI,
  PHI_INV,
  CognovexNetwork,
  CHRONO,
} from '../../meridian-sovereign-os/src/index.js';

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

// Golden ratio constants for learning algorithms
const GOLDEN_RATIO = PHI;          // φ ≈ 1.618
const GOLDEN_RATIO_INV = PHI_INV;  // φ⁻¹ ≈ 0.618

// Quorum threshold: φ⁻⁴ ≈ 0.146
const QUORUM_THRESHOLD = Math.pow(PHI_INV, 4);

// Bloom's Taxonomy cognitive domains (COGNOVEX units)
const BLOOM_DOMAINS = [
  'RECALL',         // Knowledge retrieval
  'COMPREHENSION',  // Understanding meaning
  'APPLICATION',    // Using knowledge in new situations
  'ANALYSIS',       // Breaking down information
  'SYNTHESIS',      // Combining elements into new patterns
  'EVALUATION',     // Making judgments
];

// Educational subject categories (mapped to CEREBEX analytical categories)
const SUBJECT_CATEGORY_MAP = {
  // STEM
  'mathematics':    ['FERMI_ESTIMATION', 'MENTAL_MODEL_PARETO', 'SCENARIO_PLANNING'],
  'physics':        ['FERMI_ESTIMATION', 'FAILURE_MODE_ANALYSIS', 'MENTAL_MODEL_SECOND_ORDER'],
  'chemistry':      ['FAILURE_MODE_ANALYSIS', 'SYNTHESIS', 'RISK_ASSESSMENT'],
  'biology':        ['MENTAL_MODEL_SECOND_ORDER', 'FAILURE_MODE_ANALYSIS', 'SYNTHESIS'],
  'computer_science': ['BUILD_MVP_SPEC', 'MENTAL_MODEL_OCCAMS_RAZOR', 'IT_WORKFLOW'],
  // Business
  'economics':      ['LTV_CAC', 'UNIT_ECONOMICS', 'TAM_SAM_SOM', 'REVENUE_PLANNING'],
  'business':       ['SWOT', 'PORTERS_FIVE_FORCES', 'LEAN_CANVAS', 'MOAT_ANALYSIS'],
  'marketing':      ['JTBD', 'TAM_SAM_SOM', 'CRM_UPDATE'],
  'finance':        ['UNIT_ECONOMICS', 'LTV_CAC', 'FINANCIAL_CLOSE', 'RISK_ASSESSMENT'],
  // Humanities
  'history':        ['CHRONO_ANCHORING', 'MENTAL_MODEL_SECOND_ORDER', 'SOCRATIC_CHALLENGE'],
  'philosophy':     ['SOCRATIC_CHALLENGE', 'STEELMANNING', 'MENTAL_MODEL_INVERSION'],
  'literature':     ['SYNTHESIS', 'SOCRATIC_CHALLENGE', 'MENTAL_MODEL_CIRCLE_OF_COMPETENCE'],
  'psychology':     ['FIVE_WHYS', 'MENTAL_MODEL_SECOND_ORDER', 'JTBD'],
  // Strategy
  'strategy':       ['EXECUTIVE_SYNTHESIS', 'OKR_BUILDER', 'SCENARIO_PLANNING'],
  'general':        ['SYNTHESIS', 'SOCRATIC_CHALLENGE', 'FIVE_WHYS'],
};

// Mastery levels with thresholds
const MASTERY_LEVELS = {
  NOVICE:   { threshold: 0.00, label: 'Novice',   icon: '○' },
  BRONZE:   { threshold: 0.25, label: 'Bronze',   icon: '🥉' },
  SILVER:   { threshold: 0.50, label: 'Silver',   icon: '🥈' },
  GOLD:     { threshold: 0.75, label: 'Gold',     icon: '🥇' },
  PLATINUM: { threshold: 0.90, label: 'Platinum', icon: '💎' },
};

// Spaced repetition intervals (Leitner boxes with φ scaling)
// Box 1: 1 day, Box 2: φ days, Box 3: φ² days, etc.
const SR_INTERVALS = [
  1,                        // Box 1: 1 day
  GOLDEN_RATIO,             // Box 2: ~1.6 days
  GOLDEN_RATIO ** 2,        // Box 3: ~2.6 days
  GOLDEN_RATIO ** 3,        // Box 4: ~4.2 days
  GOLDEN_RATIO ** 4,        // Box 5: ~6.9 days
  GOLDEN_RATIO ** 5,        // Box 6: ~11.1 days
  GOLDEN_RATIO ** 6,        // Box 7: ~18 days
  GOLDEN_RATIO ** 7,        // Box 8: ~29 days
];

// Difficulty levels
const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

// Quiz types
const QUIZ_TYPES = ['fill_blank', 'multiple_choice', 'matching', 'essay', 'concept_map'];

// ══════════════════════════════════════════════════════════════════════════════
// STOPWORDS
// ══════════════════════════════════════════════════════════════════════════════

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'get', 'got', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'let', 'may', 'me', 'might', 'more', 'most', 'must', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'per', 'quite', 's', 'same',
  'shall', 'she', 'should', 'so', 'some', 'such', 't', 'than', 'that', 'the',
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'upon', 'us',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself',
  'yourselves', 'also', 'even', 'still', 'well', 'much', 'many', 'often',
  'called', 'however', 'became', 'began', 'become', 'made', 'new', 'like',
]);

// ══════════════════════════════════════════════════════════════════════════════
// ENCOURAGEMENTS (adaptive based on performance)
// ══════════════════════════════════════════════════════════════════════════════

const ENCOURAGEMENTS = {
  streak: [
    '🔥 {streak} day streak! The pheromone trails are strong!',
    '⚡ {streak} days of consistent learning — your neural pathways are strengthening!',
    '🚀 {streak} day streak! You\'re in the φ-flow state!',
  ],
  mastery_up: [
    '📈 Level up! You\'ve reached {level} mastery in {topic}!',
    '🎯 Breakthrough! {topic} comprehension crystallized at {level}!',
    '✨ Quorum achieved! Your understanding of {topic} has solidified!',
  ],
  correct: [
    '✓ Excellent! Reinforcing that pathway...',
    '✓ Perfect recall! Knowledge consolidated.',
    '✓ Strong connection! φ-learning applied.',
  ],
  incorrect: [
    '○ Not quite — this area needs more attention.',
    '○ Knowledge gap detected. Adding to review queue.',
    '○ Free energy increased — let\'s reduce uncertainty here.',
  ],
  general: [
    'Keep going — you\'re building real understanding!',
    'Great question. Curiosity is how you get ahead.',
    'You\'re on the right track. Keep reviewing!',
    'Solid question — that\'s how deep learning happens.',
    'Keep it up — every question makes you sharper.',
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// TEXT UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function splitSentences(text) {
  return text
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
}

function tokenize(text) {
  return text.toLowerCase().match(/[a-z']+(?:'[a-z]+)*/g) || [];
}

function contentWords(tokens) {
  return tokens.filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

function syllables(word) {
  word = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function totalSyllables(words) {
  return words.reduce((n, w) => n + syllables(w), 0);
}

// ══════════════════════════════════════════════════════════════════════════════
// TF-IDF SCORING
// ══════════════════════════════════════════════════════════════════════════════

function termFrequency(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

function inverseDocFrequency(sentenceTokens) {
  const N = sentenceTokens.length;
  const df = new Map();
  for (const tokens of sentenceTokens) {
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = new Map();
  for (const [term, count] of df) {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
  }
  return idf;
}

function scoreSentences(sentences) {
  const tokenized = sentences.map(s => contentWords(tokenize(s)));
  const idf = inverseDocFrequency(tokenized);
  const globalTf = termFrequency(tokenized.flat());

  return sentences.map((sentence, i) => {
    const tokens = tokenized[i];
    let score = 0;
    const tf = termFrequency(tokens);
    for (const [term, count] of tf) {
      score += count * (idf.get(term) || 1) * Math.log((globalTf.get(term) || 1) + 1);
    }
    if (tokens.length > 0) score /= Math.sqrt(tokens.length);
    return { sentence, score, tokens };
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// KEY TERM EXTRACTION
// ══════════════════════════════════════════════════════════════════════════════

function extractKeyTerms(text, maxTerms = 10) {
  const tokens = contentWords(tokenize(text));
  const tf = termFrequency(tokens);
  const avg = tokens.length / Math.max(tf.size, 1);

  return [...tf.entries()]
    .filter(([, count]) => count >= Math.max(avg * 0.5, 2))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([term]) => term);
}

// ══════════════════════════════════════════════════════════════════════════════
// COSINE SIMILARITY
// ══════════════════════════════════════════════════════════════════════════════

function cosineSimilarity(a, b) {
  const tfA = termFrequency(a);
  const tfB = termFrequency(b);
  const allTerms = new Set([...tfA.keys(), ...tfB.keys()]);

  let dot = 0, magA = 0, magB = 0;
  for (const t of allTerms) {
    const va = tfA.get(t) || 0;
    const vb = tfB.get(t) || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ══════════════════════════════════════════════════════════════════════════════
// FLESCH-KINCAID
// ══════════════════════════════════════════════════════════════════════════════

function fleschKincaidGrade(words, sentences, syllableCount) {
  if (sentences === 0 || words === 0) return 0;
  return (
    0.39 * (words / sentences) +
    11.8 * (syllableCount / words) -
    15.59
  );
}

function readingLevelLabel(grade) {
  if (grade <= 5) return 'Elementary (Grade 5 or below)';
  if (grade <= 8) return 'Middle School (Grades 6–8)';
  if (grade <= 12) return 'High School (Grades 9–12)';
  if (grade <= 16) return 'College (Grades 13–16)';
  return 'Graduate / Professional';
}

// ══════════════════════════════════════════════════════════════════════════════
// SIMPLIFICATION HELPER
// ══════════════════════════════════════════════════════════════════════════════

function simplify(sentence) {
  let s = sentence;
  s = s.replace(/\s*—\s*[^—]*?\s*—\s*/g, ' ');
  s = s.replace(/\s*\([^)]*\)\s*/g, ' ');
  if (s.includes(';')) {
    s = s.split(';')[0].trim();
    if (!s.endsWith('.')) s += '.';
  }
  if (s.length > 120) {
    const conjMatch = s.match(/^(.{40,}?),\s*(?:and|but|which|where|while|enabling|freeing)\s/i);
    if (conjMatch) {
      s = conjMatch[1].trim();
      if (!s.endsWith('.')) s += '.';
    }
  }
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONCEPT GRAPH NODE
// ══════════════════════════════════════════════════════════════════════════════

class ConceptNode {
  constructor(term) {
    this.term = term;
    this.connections = new Map(); // term -> strength
    this.mastery = 0;
    this.lastSeen = null;
    this.exposureCount = 0;
  }

  connect(otherTerm, strength = 1) {
    const current = this.connections.get(otherTerm) || 0;
    this.connections.set(otherTerm, current + strength);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SPACED REPETITION CARD
// ══════════════════════════════════════════════════════════════════════════════

class SRCard {
  constructor(front, back, concept) {
    this.id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.front = front;
    this.back = back;
    this.concept = concept;
    this.box = 0;                // Leitner box index
    this.dueDate = new Date();   // When card is due
    this.lastReview = null;
    this.correctStreak = 0;
    this.totalReviews = 0;
    this.correctReviews = 0;
    this.recallProbability = 0.5; // Estimated probability of recall
  }

  recordAnswer(correct) {
    this.lastReview = new Date();
    this.totalReviews++;
    
    if (correct) {
      this.correctReviews++;
      this.correctStreak++;
      // Advance to next box (max box 7)
      this.box = Math.min(this.box + 1, SR_INTERVALS.length - 1);
    } else {
      this.correctStreak = 0;
      // Fall back to box 0
      this.box = Math.max(0, this.box - 2);
    }

    // Calculate next due date based on box interval
    const intervalDays = SR_INTERVALS[this.box];
    this.dueDate = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

    // Update recall probability (φ⁻¹ weighted EMA)
    const outcome = correct ? 1 : 0;
    this.recallProbability = this.recallProbability + GOLDEN_RATIO_INV * (outcome - this.recallProbability);
  }

  isDue() {
    return new Date() >= this.dueDate;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// STUDENTAI CLASS — DEEP-TECH EDUCATIONAL INTELLIGENCE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * StudentAI — Powered by MERIDIAN Intelligence Engines
 *
 * A living educational intelligence system that:
 *   - Builds a world model of your knowledge state (CEREBEX)
 *   - Routes study suggestions via pheromone field (NEXORIS)
 *   - Evaluates comprehension via Bloom's Taxonomy quorum (COGNOVEX)
 *   - Implements spaced repetition with φ-intervals
 *   - Adapts difficulty based on mastery
 *   - Detects weaknesses via free energy analysis
 *
 * @example
 *   const ai = new StudentAI({ subject: 'physics' });
 *   const guide = ai.study(chapterText);
 *   const trajectory = ai.learningTrajectory();
 */
export class StudentAI {
  /**
   * @param {object} [options]
   * @param {string} [options.subject='general'] - Subject area for category mapping
   * @param {string} [options.studentId] - Optional student identifier for persistence
   * @param {number} [options.difficultyLevel=1] - Starting difficulty (0-3)
   */
  constructor(options = {}) {
    const {
      subject = 'general',
      studentId = `student_${Date.now()}`,
      difficultyLevel = 1,
    } = options;

    this.studentId = studentId;
    this.subject = subject;
    this.difficultyLevel = Math.max(0, Math.min(3, difficultyLevel));

    // ── MERIDIAN Intelligence Engines ──
    this._cerebex = new CEREBEX();
    this._nexoris = new NEXORIS({ evaporationRate: 0.03, diffusionRate: 0.08 });
    this._cognovex = new CognovexNetwork({
      alpha: 0.4,   // Higher recruitment for faster learning feedback
      beta: 0.03,   // Lower abandonment to retain knowledge state
      gamma: 0.02,
    });

    // Initialize CHRONO for learning history
    this._chrono = new CHRONO();
    this._cerebex.setChrono(this._chrono);
    this._nexoris.setChrono(this._chrono);
    this._cognovex.setChrono(this._chrono).setNexoris(this._nexoris);

    // Initialize Bloom's Taxonomy cognitive units
    for (const domain of BLOOM_DOMAINS) {
      this._cognovex.addUnit(`bloom_${domain.toLowerCase()}`, domain);
    }

    // ── Learning State ──
    this._knowledgeGraph = new Map();      // term -> ConceptNode
    this._topicMastery = new Map();        // topic -> mastery score
    this._srCards = new Map();             // cardId -> SRCard
    this._studySessions = [];              // Session history
    this._answerHistory = [];              // Answer tracking
    this._streak = { current: 0, longest: 0, lastDate: null };
    this._totalStudyTime = 0;              // Minutes
    this._questionsAnswered = 0;
    this._correctAnswers = 0;

    // ── Performance Metrics ──
    this._learningVelocity = 0;            // Rate of mastery gain
    this._retentionRate = 0.5;             // Estimated retention
    this._weaknesses = [];                 // Areas with high free energy

    // Log initialization
    this._chrono.append({
      type: 'STUDENT_AI_INIT',
      studentId: this.studentId,
      subject: this.subject,
      difficultyLevel: this.difficultyLevel,
      timestamp: new Date().toISOString(),
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CORE STUDY METHODS (Enhanced with MERIDIAN Intelligence)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a comprehensive study guide with deep analysis.
   * Maps content to analytical categories and builds knowledge graph.
   *
   * @param {string} text - Study material
   * @param {object} [options]
   * @param {string} [options.topic] - Optional topic name for tracking
   * @returns {object} Deep study analysis
   */
  study(text, options = {}) {
    const { topic = 'general_study' } = options;
    const startTime = Date.now();

    const sentences = splitSentences(text);
    const scored = scoreSentences(sentences);
    const sorted = [...scored].sort((a, b) => b.score - a.score);

    // ── CEREBEX: Route through world model ──
    const cerebexRouting = this._cerebex.route(text.slice(0, 500));
    const activatedCategories = cerebexRouting.activatedCategories;
    const freeEnergy = cerebexRouting.freeEnergy;

    // ── Build knowledge graph from content ──
    const keyTerms = extractKeyTerms(text, 20);
    this._buildKnowledgeGraphFromContent(keyTerms, sentences);

    // ── NEXORIS: Reinforce successful study path ──
    const studyPath = `STUDY:${this.subject}:${topic}`;
    this._nexoris.reinforce(studyPath, 1.0);
    this._nexoris.tick();

    // ── COGNOVEX: Evaluate comprehension potential ──
    for (const domain of BLOOM_DOMAINS) {
      const unit = this._cognovex.unit(`bloom_${domain.toLowerCase()}`);
      if (unit) {
        const quality = this._estimateBloomLevel(text, domain);
        unit.observe(topic, quality);
      }
    }
    const quorumState = this._cognovex.tick();

    // Summary: top sentences in original order
    const topCount = Math.max(3, Math.ceil(sentences.length * 0.25));
    const topSet = new Set(sorted.slice(0, topCount).map(s => s.sentence));
    const summary = sentences.filter(s => topSet.has(s)).join(' ');

    // Key points
    const keyPoints = sorted.slice(0, Math.min(5, sorted.length)).map(s => s.sentence);

    // Hard words
    const allTokens = tokenize(text);
    const hardWords = [...new Set(
      allTokens.filter(w => w.length >= 8 && syllables(w) >= 3)
    )].slice(0, 10);

    // Sections
    const sections = text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 20)
      .map(p => {
        const s = splitSentences(p);
        return s[0] || p.slice(0, 80);
      });

    const stats = this.stats(text);

    // Update topic mastery (φ⁻¹ learning)
    const priorMastery = this._topicMastery.get(topic) || 0;
    const studySignal = Math.min(1, 0.3 + (1 - freeEnergy) * 0.4);
    const newMastery = priorMastery + GOLDEN_RATIO_INV * (studySignal - priorMastery);
    this._topicMastery.set(topic, newMastery);

    // Track session
    const sessionDuration = (Date.now() - startTime) / 60000;
    this._recordStudySession(topic, sessionDuration, 'study');

    // Log to CHRONO
    this._chrono.append({
      type: 'STUDY_SESSION',
      topic,
      sentenceCount: sentences.length,
      keyTermCount: keyTerms.length,
      freeEnergy,
      masteryDelta: newMastery - priorMastery,
      activatedCategories: activatedCategories.slice(0, 5).map(c => c.category),
    });

    return {
      summary,
      keyPoints,
      topics: keyTerms.slice(0, 8),
      hardWords,
      sections,
      stats,
      // Deep analysis additions
      cerebexAnalysis: {
        activatedCategories: activatedCategories.slice(0, 10),
        freeEnergy: Math.round(freeEnergy * 1000) / 1000,
        worldModelEntropy: this._cerebex._entropy(),
        relevantFrameworks: activatedCategories.slice(0, 3).map(c => c.category),
      },
      knowledgeState: {
        topicMastery: Math.round(newMastery * 100),
        masteryLevel: this._getMasteryLevel(newMastery),
        conceptsLearned: keyTerms.length,
        graphNodes: this._knowledgeGraph.size,
      },
      bloomAnalysis: {
        quorumState: quorumState.crystallized ? 'CRYSTALLIZED' : 'FORMING',
        commitmentField: quorumState.commitmentField,
        threshold: Math.round(quorumState.threshold * 100) / 100,
      },
      recommendations: this._generateStudyRecommendations(topic, freeEnergy),
    };
  }

  /**
   * Generate quiz questions with multiple types and adaptive difficulty.
   *
   * @param {string} text - Source material
   * @param {number} [count=5] - Number of questions
   * @param {object} [options]
   * @param {string[]} [options.types] - Quiz types to include
   * @param {boolean} [options.adaptive=true] - Adjust to difficulty level
   * @returns {object[]} Quiz questions
   */
  quiz(text, count = 5, options = {}) {
    const {
      types = ['fill_blank', 'multiple_choice', 'essay'],
      adaptive = true,
    } = options;

    const sentences = splitSentences(text);
    const scored = scoreSentences(sentences);
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    const keyTerms = extractKeyTerms(text, 30);

    const questions = [];
    const used = new Set();

    // Adjust question complexity based on difficulty
    const targetDifficulty = adaptive ? this.difficultyLevel : 1;

    for (const entry of sorted) {
      if (questions.length >= count) break;
      if (used.has(entry.sentence)) continue;

      const sentenceTokens = tokenize(entry.sentence);
      const target = keyTerms.find(t => sentenceTokens.includes(t) && t.length >= 4);

      if (!target) continue;
      used.add(entry.sentence);

      // Rotate through question types
      const typeIndex = questions.length % types.length;
      const questionType = types[typeIndex];

      const question = this._generateQuestion(
        entry.sentence,
        target,
        questionType,
        targetDifficulty,
        keyTerms
      );

      if (question) {
        questions.push(question);
      }
    }

    // Fallback comprehension questions
    if (questions.length < count) {
      for (const entry of sorted) {
        if (questions.length >= count) break;
        if (used.has(entry.sentence)) continue;
        used.add(entry.sentence);

        questions.push({
          type: 'essay',
          question: `Explain the following in your own words: "${entry.sentence}"`,
          hint: 'Focus on the key concepts and their relationships.',
          answer: entry.sentence,
          bloomLevel: 'COMPREHENSION',
          difficulty: DIFFICULTY_LEVELS[targetDifficulty],
          points: 3,
        });
      }
    }

    // Route through NEXORIS
    this._nexoris.reinforce(`QUIZ:${this.subject}`, 0.8);
    this._nexoris.tick();

    return questions.slice(0, count);
  }

  /**
   * Generate smart flashcards with spaced repetition scheduling.
   *
   * @param {string} text - Source material
   * @param {number} [count=5] - Number of cards
   * @returns {object[]} Flashcards with SR metadata
   */
  flashcards(text, count = 5) {
    const sentences = splitSentences(text);
    const keyTerms = extractKeyTerms(text, count * 2);
    const cards = [];
    const usedSentences = new Set();

    for (const term of keyTerms) {
      if (cards.length >= count) break;

      let best = null;
      let bestScore = -1;

      for (const s of sentences) {
        if (usedSentences.has(s)) continue;
        const lower = s.toLowerCase();
        if (!lower.includes(term)) continue;

        const score = contentWords(tokenize(s)).length;
        if (score > bestScore) {
          bestScore = score;
          best = s;
        }
      }

      if (best) {
        usedSentences.add(best);

        // Create SRCard
        const srCard = new SRCard(
          `What is "${term}"?`,
          best,
          term
        );
        this._srCards.set(srCard.id, srCard);

        // Update knowledge graph
        this._ensureConceptNode(term);

        cards.push({
          id: srCard.id,
          front: srCard.front,
          back: srCard.back,
          concept: term,
          box: srCard.box,
          dueDate: srCard.dueDate.toISOString(),
          recallProbability: Math.round(srCard.recallProbability * 100),
          intervalDays: SR_INTERVALS[srCard.box].toFixed(1),
        });
      }
    }

    // Pad with top-scored sentences if needed
    if (cards.length < count) {
      const scored = scoreSentences(sentences);
      const sorted = [...scored].sort((a, b) => b.score - a.score);
      for (const entry of sorted) {
        if (cards.length >= count) break;
        if (usedSentences.has(entry.sentence)) continue;
        usedSentences.add(entry.sentence);

        const terms = contentWords(tokenize(entry.sentence));
        const concept = terms[0] || 'concept';

        const srCard = new SRCard(
          `Explain: ${concept}`,
          entry.sentence,
          concept
        );
        this._srCards.set(srCard.id, srCard);

        cards.push({
          id: srCard.id,
          front: srCard.front,
          back: srCard.back,
          concept,
          box: srCard.box,
          dueDate: srCard.dueDate.toISOString(),
          recallProbability: Math.round(srCard.recallProbability * 100),
          intervalDays: SR_INTERVALS[srCard.box].toFixed(1),
        });
      }
    }

    // Reinforce flashcard study path
    this._nexoris.reinforce(`FLASHCARDS:${this.subject}`, 0.9);
    this._nexoris.tick();

    return cards.slice(0, count);
  }

  /**
   * Answer a question using COGNOVEX-powered synthesis.
   *
   * @param {string} question - User's question
   * @param {string} notes - Context notes
   * @returns {object} Answer with cognitive analysis
   */
  ask(question, notes) {
    const qTokens = contentWords(tokenize(question));
    const sentences = splitSentences(notes);

    if (sentences.length === 0 || qTokens.length === 0) {
      return {
        answer: 'I couldn\'t find enough information in your notes to answer that.',
        confidence: 0,
        found: false,
        encouragement: this._getEncouragement('general'),
        cognitiveAnalysis: null,
      };
    }

    // Score sentences by similarity
    const results = [];
    for (const s of sentences) {
      const sTokens = contentWords(tokenize(s));
      const sim = cosineSimilarity(qTokens, sTokens);
      results.push({ sentence: s, score: sim });
    }
    results.sort((a, b) => b.score - a.score);

    const bestScore = results[0].score;
    const topMatches = results.filter(r => r.score > 0.05).slice(0, 3);
    const answer = topMatches.length > 0
      ? topMatches.map(r => r.sentence).join(' ')
      : results[0].sentence;

    // ── COGNOVEX: Evaluate comprehension via Bloom's units ──
    const bloomEvaluations = {};
    for (const domain of BLOOM_DOMAINS) {
      const unit = this._cognovex.unit(`bloom_${domain.toLowerCase()}`);
      if (unit) {
        const quality = this._evaluateBloomForQuestion(question, answer, domain);
        unit.observe('question_answer', quality);
        bloomEvaluations[domain] = Math.round(quality * 100);
      }
    }
    const quorumState = this._cognovex.tick();

    // Determine cognitive level of the question
    const questionBloomLevel = this._classifyQuestionBloomLevel(question);

    // Route through CEREBEX
    const cerebexScore = this._cerebex.score(question);
    const relevantCategories = cerebexScore.filter(c => c.score > 0.2).slice(0, 3);

    const confidence = Math.min(Math.round(bestScore * 100), 100);
    const found = bestScore > 0.1;

    return {
      answer,
      confidence,
      found,
      encouragement: this._getEncouragement('general'),
      cognitiveAnalysis: {
        questionLevel: questionBloomLevel,
        bloomEvaluations,
        quorumState: quorumState.crystallized ? 'CRYSTALLIZED' : 'FORMING',
        relevantCategories: relevantCategories.map(c => c.category),
        synthesisQuality: Math.round((1 - this._cerebex._entropy() / 100) * 100),
      },
      matchedSentences: topMatches.length,
    };
  }

  /**
   * Generate enhanced outline with concept mapping.
   *
   * @param {string} text - Source material
   * @returns {object} Structured outline with concept map
   */
  outline(text) {
    const paragraphs = text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 10);

    const firstLine = text.trim().split('\n')[0].trim();
    const title = firstLine.length > 0 && firstLine.length < 120
      ? firstLine.replace(/^#+\s*/, '')
      : 'Untitled Document';

    const sections = [];
    const allConcepts = [];

    for (const para of paragraphs) {
      const sentences = splitSentences(para);
      if (sentences.length === 0) continue;

      const paraTerms = extractKeyTerms(para, 5);
      allConcepts.push(...paraTerms);

      const heading = paraTerms.length > 0
        ? paraTerms.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
        : sentences[0].slice(0, 60);

      const points = sentences.map(s => s.trim());

      sections.push({
        heading,
        points,
        keyConcepts: paraTerms,
        sentenceCount: sentences.length,
      });
    }

    if (sections.length === 0) {
      sections.push({
        heading: 'Main Content',
        points: splitSentences(text),
        keyConcepts: extractKeyTerms(text, 5),
        sentenceCount: splitSentences(text).length,
      });
    }

    // Build concept connections
    const uniqueConcepts = [...new Set(allConcepts)];
    const conceptMap = this._buildConceptMap(uniqueConcepts, text);

    return {
      title,
      sections,
      conceptMap,
      totalConcepts: uniqueConcepts.length,
      totalSentences: sections.reduce((n, s) => n + s.sentenceCount, 0),
    };
  }

  /**
   * Multi-level simplification with difficulty adaptation.
   *
   * @param {string} text - Complex text
   * @param {object} [options]
   * @param {number} [options.targetLevel] - Target reading level (0-4)
   * @returns {object} Simplified versions at multiple levels
   */
  explain(text, options = {}) {
    const { targetLevel = 2 } = options;

    const sentences = splitSentences(text);
    const allWords = tokenize(text);
    const syllableCount = totalSyllables(allWords);
    const grade = fleschKincaidGrade(allWords.length, sentences.length, syllableCount);

    // Find complex sentences
    const complex = sentences
      .map(s => {
        const words = tokenize(s);
        const avgSyl = words.length > 0 ? totalSyllables(words) / words.length : 0;
        const avgLen = words.length > 0 ? words.reduce((n, w) => n + w.length, 0) / words.length : 0;
        return { sentence: s, difficulty: avgSyl * 2 + avgLen, words };
      })
      .sort((a, b) => b.difficulty - a.difficulty);

    // Generate multi-level simplifications
    const levels = {
      elementary: [],   // Grade 5
      middle: [],       // Grade 8
      high: [],         // Grade 12
    };

    for (const c of complex.slice(0, 5)) {
      levels.elementary.push(this._simplifyToLevel(c.sentence, 0));
      levels.middle.push(this._simplifyToLevel(c.sentence, 1));
      levels.high.push(simplify(c.sentence));
    }

    const original = complex.slice(0, 5).map(c => c.sentence);

    // CEREBEX analysis
    const cerebexRouting = this._cerebex.score(text.slice(0, 300));

    return {
      original,
      simplified: levels.high,
      levels,
      readingLevel: readingLevelLabel(grade),
      gradeLevel: Math.round(grade * 10) / 10,
      targetLevel: ['Elementary', 'Middle School', 'High School', 'College', 'Graduate'][targetLevel],
      complexityMetrics: {
        avgSyllablesPerWord: (syllableCount / allWords.length).toFixed(2),
        avgWordsPerSentence: (allWords.length / sentences.length).toFixed(1),
        hardWordCount: allWords.filter(w => syllables(w) >= 3).length,
      },
      relevantFrameworks: cerebexRouting.slice(0, 3).map(c => c.category),
    };
  }

  /**
   * Get text statistics.
   */
  stats(text) {
    const words = tokenize(text);
    const sentences = splitSentences(text);
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0
      ? Math.round((wordCount / sentenceCount) * 10) / 10
      : 0;
    const minutes = Math.ceil(wordCount / 200);
    const readingTime = minutes <= 1 ? '~1 min' : `~${minutes} min`;

    return {
      words: wordCount,
      sentences: sentenceCount,
      readingTime,
      avgWordsPerSentence,
      uniqueTerms: new Set(contentWords(words)).size,
      complexityScore: this._calculateComplexityScore(text),
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADVANCED LEARNING METHODS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get CEREBEX world model view of learning trajectory.
   */
  learningTrajectory() {
    const worldModel = this._cerebex.worldModel();
    const subjectCategories = SUBJECT_CATEGORY_MAP[this.subject] || SUBJECT_CATEGORY_MAP.general;

    // Filter to relevant categories for this subject
    const relevantModel = worldModel.filter(
      c => subjectCategories.includes(c.category) || c.score > 0.4
    );

    return {
      studentId: this.studentId,
      subject: this.subject,
      worldModel: relevantModel.slice(0, 15),
      totalEntropy: this._cerebex._entropy(),
      queryCount: this._cerebex.queryCount,
      learningCoefficient: `φ⁻¹ ≈ ${GOLDEN_RATIO_INV.toFixed(4)}`,
      topStrengths: relevantModel.slice(0, 3).map(c => c.category),
      focusAreas: relevantModel.filter(c => c.score < 0.4).slice(0, 3).map(c => c.category),
      categoryMasteryDistribution: this._getCategoryMasteryDistribution(),
    };
  }

  /**
   * Get NEXORIS pheromone-gradient study recommendations.
   */
  recommendNextStudy() {
    // Get pheromone field state
    const fieldSnapshot = this._nexoris.fieldSnapshot();
    const fieldEntries = Object.entries(fieldSnapshot);

    // Sort by concentration
    fieldEntries.sort((a, b) => b[1] - a[1]);

    // Analyze study patterns
    const studyPaths = fieldEntries.filter(([key]) => key.startsWith('STUDY:'));
    const quizPaths = fieldEntries.filter(([key]) => key.startsWith('QUIZ:'));
    const flashcardPaths = fieldEntries.filter(([key]) => key.startsWith('FLASHCARDS:'));

    // Identify weak areas (low pheromone or high free energy)
    const weakTopics = [...this._topicMastery.entries()]
      .filter(([, mastery]) => mastery < 0.5)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    // Cards due for review
    const dueCards = this.spacedRepetitionDue();

    // Generate recommendations
    const recommendations = [];

    if (dueCards.length > 0) {
      recommendations.push({
        action: 'REVIEW_FLASHCARDS',
        priority: 'HIGH',
        reason: `${dueCards.length} cards are due for spaced repetition review`,
        details: dueCards.slice(0, 3).map(c => c.concept),
      });
    }

    if (weakTopics.length > 0) {
      recommendations.push({
        action: 'STUDY_WEAK_TOPICS',
        priority: 'MEDIUM',
        reason: 'These topics have low mastery scores',
        details: weakTopics,
      });
    }

    // Recommend based on highest-reinforced paths
    if (studyPaths.length > 0) {
      const topStudyPath = studyPaths[0][0].split(':').slice(2).join(':') || 'general';
      recommendations.push({
        action: 'CONTINUE_STUDY',
        priority: 'MEDIUM',
        reason: 'Your most successful study path',
        details: [topStudyPath],
      });
    }

    // Recommend quiz if enough material studied
    if (this._studySessions.length > 0 && quizPaths.length < studyPaths.length) {
      recommendations.push({
        action: 'TAKE_QUIZ',
        priority: 'LOW',
        reason: 'Test your knowledge to reinforce learning',
        details: ['Practice retrieval to strengthen neural pathways'],
      });
    }

    return {
      recommendations,
      pheromoneFieldStrength: fieldEntries.length,
      orderParameter: this._nexoris.orderParameter,
      synchronized: this._nexoris.synchronized,
      studyPathStrength: studyPaths.slice(0, 5).map(([key, val]) => ({
        path: key,
        concentration: Math.round(val * 1000) / 1000,
      })),
    };
  }

  /**
   * Get per-topic mastery report.
   */
  masteryReport() {
    const topicEntries = [...this._topicMastery.entries()];
    topicEntries.sort((a, b) => b[1] - a[1]);

    const report = topicEntries.map(([topic, mastery]) => ({
      topic,
      mastery: Math.round(mastery * 100),
      level: this._getMasteryLevel(mastery),
      icon: this._getMasteryIcon(mastery),
    }));

    // Calculate overall mastery
    const avgMastery = topicEntries.length > 0
      ? topicEntries.reduce((sum, [, m]) => sum + m, 0) / topicEntries.length
      : 0;

    return {
      topics: report,
      overallMastery: Math.round(avgMastery * 100),
      overallLevel: this._getMasteryLevel(avgMastery),
      totalTopics: topicEntries.length,
      platinumCount: report.filter(r => r.level === 'Platinum').length,
      goldCount: report.filter(r => r.level === 'Gold').length,
      silverCount: report.filter(r => r.level === 'Silver').length,
      bronzeCount: report.filter(r => r.level === 'Bronze').length,
      noviceCount: report.filter(r => r.level === 'Novice').length,
    };
  }

  /**
   * Get knowledge graph with concept connections.
   */
  knowledgeGraph() {
    const nodes = [];
    const edges = [];

    for (const [term, node] of this._knowledgeGraph) {
      nodes.push({
        id: term,
        mastery: Math.round(node.mastery * 100),
        exposureCount: node.exposureCount,
        connectionCount: node.connections.size,
        lastSeen: node.lastSeen,
      });

      for (const [target, strength] of node.connections) {
        edges.push({
          source: term,
          target,
          strength: Math.round(strength * 100) / 100,
        });
      }
    }

    // Deduplicate edges (A→B and B→A become one bidirectional edge)
    const edgeMap = new Map();
    for (const edge of edges) {
      const key = [edge.source, edge.target].sort().join('↔');
      const existing = edgeMap.get(key);
      if (existing) {
        existing.strength = Math.max(existing.strength, edge.strength);
        existing.bidirectional = true;
      } else {
        edgeMap.set(key, { ...edge, bidirectional: false });
      }
    }

    return {
      nodes,
      edges: [...edgeMap.values()],
      totalConcepts: nodes.length,
      totalConnections: edgeMap.size,
      averageConnectivity: nodes.length > 0
        ? (edges.length / nodes.length).toFixed(2)
        : 0,
      mostConnected: nodes.sort((a, b) => b.connectionCount - a.connectionCount).slice(0, 5),
    };
  }

  /**
   * Get flashcards due for spaced repetition review.
   */
  spacedRepetitionDue() {
    const now = new Date();
    const dueCards = [];

    for (const [, card] of this._srCards) {
      if (card.isDue()) {
        dueCards.push({
          id: card.id,
          front: card.front,
          back: card.back,
          concept: card.concept,
          box: card.box,
          overdueDays: Math.max(0, (now - card.dueDate) / (24 * 60 * 60 * 1000)),
          recallProbability: Math.round(card.recallProbability * 100),
          totalReviews: card.totalReviews,
          correctRate: card.totalReviews > 0
            ? Math.round((card.correctReviews / card.totalReviews) * 100)
            : 0,
        });
      }
    }

    // Sort by most overdue first
    dueCards.sort((a, b) => b.overdueDays - a.overdueDays);

    return dueCards;
  }

  /**
   * Get current study streak status.
   */
  studyStreak() {
    return {
      current: this._streak.current,
      longest: this._streak.longest,
      lastStudyDate: this._streak.lastDate,
      streakMultiplier: 1 + (this._streak.current * 0.1),
      nextMilestone: this._getNextStreakMilestone(),
      encouragement: this._streak.current > 0
        ? this._getEncouragement('streak').replace('{streak}', this._streak.current)
        : 'Start your streak by studying today!',
    };
  }

  /**
   * Get current adaptive difficulty settings.
   */
  adaptiveDifficulty() {
    const correctRate = this._questionsAnswered > 0
      ? this._correctAnswers / this._questionsAnswered
      : 0.5;

    // Suggest difficulty adjustment
    let suggestion = 'MAINTAIN';
    if (correctRate > 0.85 && this.difficultyLevel < 3) {
      suggestion = 'INCREASE';
    } else if (correctRate < 0.5 && this.difficultyLevel > 0) {
      suggestion = 'DECREASE';
    }

    return {
      currentLevel: this.difficultyLevel,
      levelName: DIFFICULTY_LEVELS[this.difficultyLevel],
      correctRate: Math.round(correctRate * 100),
      questionsAnswered: this._questionsAnswered,
      correctAnswers: this._correctAnswers,
      suggestion,
      allLevels: DIFFICULTY_LEVELS,
    };
  }

  /**
   * Analyze weaknesses using free energy analysis.
   */
  weaknessAnalysis() {
    // Get CEREBEX free energy per category
    const worldModel = this._cerebex.worldModel();
    const weakCategories = worldModel
      .filter(c => c.score < 0.4)
      .slice(0, 10);

    // Analyze topic mastery
    const weakTopics = [...this._topicMastery.entries()]
      .filter(([, mastery]) => mastery < 0.5)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5);

    // Analyze flashcard performance
    const weakCards = [];
    for (const [, card] of this._srCards) {
      if (card.recallProbability < 0.4 && card.totalReviews > 0) {
        weakCards.push({
          concept: card.concept,
          recallProbability: Math.round(card.recallProbability * 100),
          box: card.box,
        });
      }
    }
    weakCards.sort((a, b) => a.recallProbability - b.recallProbability);

    // Calculate overall free energy
    const overallFreeEnergy = worldModel.reduce(
      (sum, c) => sum + (1 - c.score) ** 2,
      0
    ) / worldModel.length;

    return {
      overallFreeEnergy: Math.round(overallFreeEnergy * 1000) / 1000,
      freeEnergyInterpretation: overallFreeEnergy > 0.5
        ? 'High uncertainty — more study needed'
        : overallFreeEnergy > 0.25
          ? 'Moderate understanding — focus on weak areas'
          : 'Strong grasp — maintain with review',
      weakCategories: weakCategories.map(c => ({
        category: c.category,
        score: Math.round(c.score * 100),
        gap: Math.round((0.5 - c.score) * 100),
      })),
      weakTopics: weakTopics.map(([topic, mastery]) => ({
        topic,
        mastery: Math.round(mastery * 100),
        gap: Math.round((0.5 - mastery) * 100),
      })),
      weakFlashcards: weakCards.slice(0, 5),
      recommendations: this._generateWeaknessRecommendations(weakCategories, weakTopics, weakCards),
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TRACKING METHODS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Record an answer (correct or incorrect) — feeds back into learning system.
   *
   * @param {boolean} correct - Whether the answer was correct
   * @param {object} [context]
   * @param {string} [context.cardId] - Flashcard ID if applicable
   * @param {string} [context.topic] - Topic context
   * @param {string} [context.bloomLevel] - Bloom's level
   */
  recordAnswer(correct, context = {}) {
    const { cardId, topic = 'general', bloomLevel = 'RECALL' } = context;

    this._questionsAnswered++;
    if (correct) this._correctAnswers++;

    this._answerHistory.push({
      timestamp: new Date().toISOString(),
      correct,
      topic,
      bloomLevel,
    });

    // Update flashcard if applicable
    if (cardId && this._srCards.has(cardId)) {
      const card = this._srCards.get(cardId);
      card.recordAnswer(correct);

      // Update concept mastery in knowledge graph
      const node = this._knowledgeGraph.get(card.concept);
      if (node) {
        const delta = correct ? 0.1 : -0.05;
        node.mastery = Math.max(0, Math.min(1, node.mastery + delta));
      }
    }

    // NEXORIS: Reinforce or weaken pathway
    const pathKey = `ANSWER:${this.subject}:${topic}`;
    this._nexoris.reinforce(pathKey, correct ? 1.0 : 0.2);

    // COGNOVEX: Observe answer quality
    const bloomUnit = this._cognovex.unit(`bloom_${bloomLevel.toLowerCase()}`);
    if (bloomUnit) {
      bloomUnit.observe(topic, correct ? 1.0 : 0.0);
    }
    this._cognovex.tick();

    // Update topic mastery (φ⁻¹ learning)
    const priorMastery = this._topicMastery.get(topic) || 0.5;
    const signal = correct ? Math.min(1, priorMastery + 0.1) : Math.max(0, priorMastery - 0.05);
    const newMastery = priorMastery + GOLDEN_RATIO_INV * (signal - priorMastery);
    this._topicMastery.set(topic, newMastery);

    // Adjust difficulty if needed
    this._maybeAdjustDifficulty();

    // Log to CHRONO
    this._chrono.append({
      type: 'ANSWER_RECORDED',
      correct,
      topic,
      bloomLevel,
      cardId,
      newMastery: Math.round(newMastery * 100),
    });

    return {
      recorded: true,
      encouragement: this._getEncouragement(correct ? 'correct' : 'incorrect'),
      masteryChange: correct ? '+' : '-',
      newMastery: Math.round(newMastery * 100),
    };
  }

  /**
   * Record a study session.
   *
   * @param {number} durationMinutes - Session duration
   * @param {string} [topic='general'] - Topic studied
   */
  recordStudySession(durationMinutes, topic = 'general') {
    this._recordStudySession(topic, durationMinutes, 'manual');
    return {
      recorded: true,
      totalStudyTime: this._totalStudyTime,
      streak: this._streak.current,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPORT METHODS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Export full learning state for persistence or analysis.
   */
  exportProgress() {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      studentId: this.studentId,
      subject: this.subject,
      difficultyLevel: this.difficultyLevel,

      // Statistics
      stats: {
        totalStudyTime: this._totalStudyTime,
        questionsAnswered: this._questionsAnswered,
        correctAnswers: this._correctAnswers,
        correctRate: this._questionsAnswered > 0
          ? Math.round((this._correctAnswers / this._questionsAnswered) * 100)
          : 0,
        studySessions: this._studySessions.length,
      },

      // Streak
      streak: this._streak,

      // Mastery
      topicMastery: Object.fromEntries(this._topicMastery),
      masteryReport: this.masteryReport(),

      // Knowledge graph (serialized)
      knowledgeGraph: {
        nodes: [...this._knowledgeGraph.entries()].map(([term, node]) => ({
          term,
          mastery: node.mastery,
          exposureCount: node.exposureCount,
          connections: Object.fromEntries(node.connections),
        })),
      },

      // Flashcards
      flashcards: [...this._srCards.entries()].map(([id, card]) => ({
        id,
        front: card.front,
        back: card.back,
        concept: card.concept,
        box: card.box,
        dueDate: card.dueDate.toISOString(),
        recallProbability: card.recallProbability,
        totalReviews: card.totalReviews,
        correctReviews: card.correctReviews,
      })),

      // CEREBEX world model
      cerebexWorldModel: this._cerebex.worldModel(),

      // NEXORIS pheromone field
      nexorisPheromoneField: this._nexoris.fieldSnapshot(),

      // COGNOVEX commitment state
      cognovexState: this._cognovex.collectiveSelfReport(),

      // Answer history (last 100)
      recentAnswers: this._answerHistory.slice(-100),

      // Learning analytics
      analytics: {
        learningVelocity: this._learningVelocity,
        retentionRate: this._retentionRate,
        weaknessAnalysis: this.weaknessAnalysis(),
      },

      // CHRONO log (last 50 entries)
      chronoLog: this._chrono.all().slice(-50),
    };
  }

  /**
   * Import previously exported progress.
   *
   * @param {object} data - Exported progress data
   */
  importProgress(data) {
    if (!data || data.version !== '1.0.0') {
      throw new Error('Invalid or incompatible progress data');
    }

    this.studentId = data.studentId || this.studentId;
    this.subject = data.subject || this.subject;
    this.difficultyLevel = data.difficultyLevel ?? this.difficultyLevel;

    // Restore stats
    if (data.stats) {
      this._totalStudyTime = data.stats.totalStudyTime || 0;
      this._questionsAnswered = data.stats.questionsAnswered || 0;
      this._correctAnswers = data.stats.correctAnswers || 0;
    }

    // Restore streak
    if (data.streak) {
      this._streak = data.streak;
    }

    // Restore topic mastery
    if (data.topicMastery) {
      this._topicMastery = new Map(Object.entries(data.topicMastery));
    }

    // Restore knowledge graph
    if (data.knowledgeGraph?.nodes) {
      for (const nodeData of data.knowledgeGraph.nodes) {
        const node = new ConceptNode(nodeData.term);
        node.mastery = nodeData.mastery || 0;
        node.exposureCount = nodeData.exposureCount || 0;
        node.connections = new Map(Object.entries(nodeData.connections || {}));
        this._knowledgeGraph.set(nodeData.term, node);
      }
    }

    // Restore flashcards
    if (data.flashcards) {
      for (const cardData of data.flashcards) {
        const card = new SRCard(cardData.front, cardData.back, cardData.concept);
        card.id = cardData.id;
        card.box = cardData.box || 0;
        card.dueDate = new Date(cardData.dueDate || Date.now());
        card.recallProbability = cardData.recallProbability ?? 0.5;
        card.totalReviews = cardData.totalReviews || 0;
        card.correctReviews = cardData.correctReviews || 0;
        this._srCards.set(card.id, card);
      }
    }

    // Log import
    this._chrono.append({
      type: 'PROGRESS_IMPORTED',
      studentId: this.studentId,
      importedTopics: this._topicMastery.size,
      importedCards: this._srCards.size,
    });

    return { imported: true, topicsRestored: this._topicMastery.size, cardsRestored: this._srCards.size };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPER METHODS
  // ══════════════════════════════════════════════════════════════════════════

  _buildKnowledgeGraphFromContent(keyTerms, sentences) {
    // Ensure nodes exist
    for (const term of keyTerms) {
      this._ensureConceptNode(term);
    }

    // Build connections based on co-occurrence in sentences
    for (const sentence of sentences) {
      const sentenceTerms = keyTerms.filter(t => sentence.toLowerCase().includes(t));
      for (let i = 0; i < sentenceTerms.length; i++) {
        for (let j = i + 1; j < sentenceTerms.length; j++) {
          const nodeA = this._knowledgeGraph.get(sentenceTerms[i]);
          const nodeB = this._knowledgeGraph.get(sentenceTerms[j]);
          if (nodeA && nodeB) {
            nodeA.connect(sentenceTerms[j], 0.5);
            nodeB.connect(sentenceTerms[i], 0.5);
          }
        }
      }
    }

    // Update exposure
    for (const term of keyTerms) {
      const node = this._knowledgeGraph.get(term);
      if (node) {
        node.exposureCount++;
        node.lastSeen = new Date();
        // Small mastery boost for exposure
        node.mastery = Math.min(1, node.mastery + 0.05);
      }
    }
  }

  _ensureConceptNode(term) {
    if (!this._knowledgeGraph.has(term)) {
      this._knowledgeGraph.set(term, new ConceptNode(term));
    }
    return this._knowledgeGraph.get(term);
  }

  _getMasteryLevel(mastery) {
    if (mastery >= MASTERY_LEVELS.PLATINUM.threshold) return 'Platinum';
    if (mastery >= MASTERY_LEVELS.GOLD.threshold) return 'Gold';
    if (mastery >= MASTERY_LEVELS.SILVER.threshold) return 'Silver';
    if (mastery >= MASTERY_LEVELS.BRONZE.threshold) return 'Bronze';
    return 'Novice';
  }

  _getMasteryIcon(mastery) {
    if (mastery >= MASTERY_LEVELS.PLATINUM.threshold) return MASTERY_LEVELS.PLATINUM.icon;
    if (mastery >= MASTERY_LEVELS.GOLD.threshold) return MASTERY_LEVELS.GOLD.icon;
    if (mastery >= MASTERY_LEVELS.SILVER.threshold) return MASTERY_LEVELS.SILVER.icon;
    if (mastery >= MASTERY_LEVELS.BRONZE.threshold) return MASTERY_LEVELS.BRONZE.icon;
    return MASTERY_LEVELS.NOVICE.icon;
  }

  _estimateBloomLevel(text, domain) {
    const lower = text.toLowerCase();
    const signals = {
      RECALL: ['define', 'list', 'name', 'state', 'identify', 'recall'],
      COMPREHENSION: ['explain', 'describe', 'summarize', 'interpret', 'paraphrase'],
      APPLICATION: ['apply', 'demonstrate', 'use', 'solve', 'implement'],
      ANALYSIS: ['analyze', 'compare', 'contrast', 'differentiate', 'examine'],
      SYNTHESIS: ['create', 'design', 'compose', 'construct', 'develop'],
      EVALUATION: ['evaluate', 'judge', 'critique', 'justify', 'assess'],
    };

    const domainSignals = signals[domain] || [];
    let score = 0.3; // Base score

    for (const signal of domainSignals) {
      if (lower.includes(signal)) {
        score += 0.15;
      }
    }

    return Math.min(1, score);
  }

  _evaluateBloomForQuestion(question, answer, domain) {
    const qLower = question.toLowerCase();
    const aLower = answer.toLowerCase();

    // Simple heuristic based on question complexity and answer completeness
    let score = 0.4;

    // Question complexity
    const questionWords = tokenize(question).length;
    if (questionWords > 10) score += 0.1;

    // Answer relevance (term overlap)
    const qTerms = contentWords(tokenize(question));
    const aTerms = contentWords(tokenize(answer));
    const overlap = qTerms.filter(t => aTerms.includes(t)).length;
    if (overlap > 0) score += Math.min(0.3, overlap * 0.1);

    return Math.min(1, score);
  }

  _classifyQuestionBloomLevel(question) {
    const lower = question.toLowerCase();

    if (/^(what is|define|name|list|identify|state)\b/.test(lower)) return 'RECALL';
    if (/^(explain|describe|summarize|interpret)\b/.test(lower)) return 'COMPREHENSION';
    if (/^(how would|apply|demonstrate|use|solve)\b/.test(lower)) return 'APPLICATION';
    if (/^(why|analyze|compare|contrast|examine)\b/.test(lower)) return 'ANALYSIS';
    if (/^(create|design|develop|propose)\b/.test(lower)) return 'SYNTHESIS';
    if (/^(evaluate|judge|justify|assess)\b/.test(lower)) return 'EVALUATION';

    return 'COMPREHENSION'; // Default
  }

  _generateQuestion(sentence, target, type, difficulty, keyTerms) {
    switch (type) {
      case 'fill_blank': {
        const blanked = sentence.replace(
          new RegExp(`\\b${target}\\b`, 'gi'),
          '________'
        );
        return {
          type: 'fill_blank',
          question: blanked,
          hint: `Starts with "${target[0].toUpperCase()}", ${target.length} letters`,
          answer: target,
          bloomLevel: 'RECALL',
          difficulty: DIFFICULTY_LEVELS[difficulty],
          points: 1,
        };
      }

      case 'multiple_choice': {
        // Generate distractors from other key terms
        const distractors = keyTerms
          .filter(t => t !== target && t.length >= 3)
          .slice(0, 3);

        if (distractors.length < 3) {
          // Fall back to fill blank if not enough distractors
          return this._generateQuestion(sentence, target, 'fill_blank', difficulty, keyTerms);
        }

        const options = [target, ...distractors].sort(() => Math.random() - 0.5);
        const blanked = sentence.replace(
          new RegExp(`\\b${target}\\b`, 'gi'),
          '________'
        );

        return {
          type: 'multiple_choice',
          question: blanked,
          options,
          answer: target,
          hint: `Think about what fits contextually`,
          bloomLevel: 'COMPREHENSION',
          difficulty: DIFFICULTY_LEVELS[difficulty],
          points: 2,
        };
      }

      case 'essay': {
        return {
          type: 'essay',
          question: `Explain the concept of "${target}" in your own words, using the following context: "${sentence}"`,
          hint: 'Consider the key relationships and implications.',
          answer: sentence,
          bloomLevel: 'SYNTHESIS',
          difficulty: DIFFICULTY_LEVELS[difficulty],
          points: 5,
        };
      }

      case 'matching': {
        // For matching, we'd need multiple terms - simplified here
        return this._generateQuestion(sentence, target, 'multiple_choice', difficulty, keyTerms);
      }

      case 'concept_map': {
        const related = keyTerms.filter(t => t !== target).slice(0, 3);
        return {
          type: 'concept_map',
          question: `Draw connections between "${target}" and these related concepts: ${related.join(', ')}`,
          concepts: [target, ...related],
          context: sentence,
          hint: 'Think about how these ideas relate to each other.',
          bloomLevel: 'ANALYSIS',
          difficulty: DIFFICULTY_LEVELS[difficulty],
          points: 4,
        };
      }

      default:
        return this._generateQuestion(sentence, target, 'fill_blank', difficulty, keyTerms);
    }
  }

  _simplifyToLevel(sentence, level) {
    let s = simplify(sentence);

    if (level === 0) {
      // Elementary: break into very short pieces
      const words = tokenize(s);
      if (words.length > 12) {
        s = words.slice(0, 12).join(' ') + '...';
      }
      // Replace complex words with simpler alternatives (simplified heuristic)
      s = s.replace(/\b(\w{10,})\b/g, (match) => {
        const simpler = match.slice(0, 6) + '...';
        return simpler;
      });
    }

    return s;
  }

  _buildConceptMap(concepts, text) {
    const map = {
      nodes: concepts.map(c => ({ id: c, label: c })),
      edges: [],
    };

    // Find co-occurrences
    const sentences = splitSentences(text);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      const present = concepts.filter(c => lower.includes(c));

      for (let i = 0; i < present.length; i++) {
        for (let j = i + 1; j < present.length; j++) {
          map.edges.push({
            source: present[i],
            target: present[j],
            context: sentence.slice(0, 50),
          });
        }
      }
    }

    return map;
  }

  _recordStudySession(topic, durationMinutes, sessionType) {
    this._studySessions.push({
      timestamp: new Date().toISOString(),
      topic,
      duration: durationMinutes,
      type: sessionType,
    });

    this._totalStudyTime += durationMinutes;

    // Update streak
    const today = new Date().toDateString();
    if (this._streak.lastDate !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      if (this._streak.lastDate === yesterday) {
        this._streak.current++;
      } else {
        this._streak.current = 1;
      }
      this._streak.lastDate = today;
      this._streak.longest = Math.max(this._streak.longest, this._streak.current);
    }

    // Calculate learning velocity
    const recentSessions = this._studySessions.slice(-10);
    if (recentSessions.length >= 2) {
      const firstTime = new Date(recentSessions[0].timestamp).getTime();
      const lastTime = new Date(recentSessions[recentSessions.length - 1].timestamp).getTime();
      const daysDiff = (lastTime - firstTime) / (24 * 60 * 60 * 1000) || 1;
      this._learningVelocity = recentSessions.length / daysDiff;
    }
  }

  _generateStudyRecommendations(topic, freeEnergy) {
    const recommendations = [];

    if (freeEnergy > 0.5) {
      recommendations.push({
        type: 'REVIEW',
        message: 'High uncertainty detected. Consider re-reading key sections.',
        priority: 'HIGH',
      });
    }

    if (this._srCards.size > 0) {
      const dueCount = this.spacedRepetitionDue().length;
      if (dueCount > 0) {
        recommendations.push({
          type: 'FLASHCARD_REVIEW',
          message: `${dueCount} flashcards due for review.`,
          priority: dueCount > 5 ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    recommendations.push({
      type: 'QUIZ',
      message: 'Test your understanding with a quiz.',
      priority: 'LOW',
    });

    return recommendations;
  }

  _generateWeaknessRecommendations(weakCategories, weakTopics, weakCards) {
    const recs = [];

    if (weakCategories.length > 0) {
      recs.push({
        type: 'CATEGORY_FOCUS',
        message: `Focus on these analytical areas: ${weakCategories.slice(0, 3).map(c => c.category).join(', ')}`,
      });
    }

    if (weakTopics.length > 0) {
      recs.push({
        type: 'TOPIC_REVIEW',
        message: `Review these topics: ${weakTopics.slice(0, 3).map(t => t.topic).join(', ')}`,
      });
    }

    if (weakCards.length > 0) {
      recs.push({
        type: 'FLASHCARD_DRILL',
        message: `Drill these concepts: ${weakCards.slice(0, 3).map(c => c.concept).join(', ')}`,
      });
    }

    return recs;
  }

  _getCategoryMasteryDistribution() {
    const worldModel = this._cerebex.worldModel();
    const distribution = { high: 0, medium: 0, low: 0 };

    for (const { score } of worldModel) {
      if (score >= 0.6) distribution.high++;
      else if (score >= 0.3) distribution.medium++;
      else distribution.low++;
    }

    return distribution;
  }

  _getNextStreakMilestone() {
    const milestones = [7, 14, 30, 60, 100, 365];
    for (const m of milestones) {
      if (this._streak.current < m) {
        return { target: m, daysAway: m - this._streak.current };
      }
    }
    return { target: this._streak.current + 100, daysAway: 100 };
  }

  _maybeAdjustDifficulty() {
    // Auto-adjust difficulty based on recent performance
    const recentAnswers = this._answerHistory.slice(-20);
    if (recentAnswers.length < 10) return;

    const correctRate = recentAnswers.filter(a => a.correct).length / recentAnswers.length;

    if (correctRate > 0.9 && this.difficultyLevel < 3) {
      this.difficultyLevel++;
      this._chrono.append({
        type: 'DIFFICULTY_ADJUSTED',
        newLevel: this.difficultyLevel,
        reason: 'High performance',
      });
    } else if (correctRate < 0.4 && this.difficultyLevel > 0) {
      this.difficultyLevel--;
      this._chrono.append({
        type: 'DIFFICULTY_ADJUSTED',
        newLevel: this.difficultyLevel,
        reason: 'Low performance',
      });
    }
  }

  _getEncouragement(type) {
    const pool = ENCOURAGEMENTS[type] || ENCOURAGEMENTS.general;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  _calculateComplexityScore(text) {
    const sentences = splitSentences(text);
    const words = tokenize(text);
    const syllableCount = totalSyllables(words);

    const avgSyllables = words.length > 0 ? syllableCount / words.length : 0;
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

    // Normalized complexity score (0-100)
    return Math.min(100, Math.round((avgSyllables * 20 + avgSentenceLength * 2)));
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════════════

export {
  GOLDEN_RATIO as PHI,
  GOLDEN_RATIO_INV as PHI_INV,
  BLOOM_DOMAINS,
  MASTERY_LEVELS,
  DIFFICULTY_LEVELS,
  QUIZ_TYPES,
  SR_INTERVALS,
};
