/**
 * BRONZE-CANISTER — Sovereign Student Compute Unit
 * ──────────────────────────────────────────────────────────────────────────────
 * The Bronze Canister is the centerpiece of the education product. Each student
 * gets one sovereign ICP canister that carries:
 *
 *   - CHRONO audit trail as a learning portfolio
 *   - CEREBEX world model of the student's learning trajectory
 *   - VOXIS sovereign doctrine (SL-0 education)
 *   - StudentMemory persistent vault (Sovereign Memory)
 *   - StudentIdentity (Internet Identity)
 *   - BehavioralLaws L72–L79 validation on every action
 *   - Voice-native interface via HDI + VoiceSession
 *   - StudentAI study tools (study, quiz, flashcards, ask)
 *
 * The student speaks. The canister acts. Everything is logged. Nothing is lost.
 *
 * Theory basis:
 *   Paper XV   — ASK III: Bronze Canister product architecture
 *   Paper V    — LEGES ANIMAE: Behavioral Laws L72–L79
 *   Paper XIII — DE SUBSTRATO EPISTEMICO: epistemic substrate
 *   Paper IV   — DOCTRINA VOXIS: sovereign compute unit
 *   Paper XIX  — CIVITAS MERIDIANA: civic infrastructure layer
 *   Paper XX   — STIGMERGY: immutable pheromone trail (CHRONO)
 *   Paper X    — EXECUTIO UNIVERSALIS: query = act = learn = log
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

import {
  CHRONO,
  CEREBEX,
  VOXIS,
  HDI,
  NEXORIS,
  BehavioralLaws,
  EduConfig,
  VoiceSession,
} from '../../meridian-sovereign-os/src/index.js';

import { StudentAI } from '../../student-ai/src/index.js';
import { StudentIdentity } from './student-identity.js';
import { StudentMemory } from './student-memory.js';

// ---------------------------------------------------------------------------
// BronzeCanister
// ---------------------------------------------------------------------------

export class BronzeCanister {
  /**
   * Create a Bronze Canister for a student.
   *
   * @param {object} options
   * @param {string} options.studentId  - Unique student identifier
   * @param {number} [options.grade]    - Student grade level (1–12+)
   * @param {string} options.schoolId   - School identifier
   * @param {string} [options.canisterId] - ICP canister identifier (auto-generated if omitted)
   */
  constructor({ studentId, grade = 0, schoolId, canisterId = null }) {
    if (!studentId) throw new Error('BronzeCanister requires a studentId');
    if (!schoolId) throw new Error('BronzeCanister requires a schoolId');

    /** @type {string} */
    this.studentId = studentId;

    /** @type {number} */
    this.grade = grade;

    /** @type {string} */
    this.schoolId = schoolId;

    /** @type {string} */
    this.canisterId = canisterId || `BC::${schoolId}::${studentId}`;

    // ── Internal state ────────────────────────────────────────────────────
    /** @type {boolean} */
    this._provisioned = false;

    /** @type {boolean} */
    this._active = false;

    /** @type {string|null} */
    this._lastAction = null;

    /** @type {number} */
    this._sessionCount = 0;

    /** @type {number} */
    this._commandCount = 0;

    // ── Engines (initialized on provision) ────────────────────────────────
    /** @type {object|null} */
    this._chrono = null;

    /** @type {object|null} */
    this._cerebex = null;

    /** @type {object|null} */
    this._voxis = null;

    /** @type {object|null} */
    this._hdi = null;

    /** @type {object|null} */
    this._nexoris = null;

    /** @type {object|null} */
    this._laws = null;

    /** @type {object|null} */
    this._eduConfig = null;

    /** @type {object|null} */
    this._voiceSession = null;

    /** @type {object|null} */
    this._identity = null;

    /** @type {object|null} */
    this._memory = null;

    /** @type {object|null} */
    this._studentAI = null;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Provision the Bronze Canister.
   * Initializes CHRONO, CEREBEX, VOXIS, behavioral laws, identity, memory,
   * and the student AI study tools.
   *
   * @returns {{ provisioned: boolean, canisterId: string, studentId: string, engines: string[] }}
   */
  provision() {
    if (this._provisioned) {
      return {
        provisioned: true,
        canisterId: this.canisterId,
        studentId: this.studentId,
        message: 'Already provisioned',
        engines: this._listEngines(),
      };
    }

    // ── 1. CHRONO — immutable hash-chain audit trail ──────────────────────
    this._chrono = new CHRONO({ genesisLabel: `BRONZE_CANISTER::${this.canisterId}` });

    // ── 2. NEXORIS — pheromone field for routing ──────────────────────────
    this._nexoris = new NEXORIS({ couplingStrength: 1.0 });
    this._nexoris.setChrono(this._chrono);

    // ── 3. CEREBEX — world model of student's learning trajectory ─────────
    this._cerebex = new CEREBEX();
    this._cerebex.setChrono(this._chrono);

    // ── 4. VOXIS — sovereign compute unit with SL-0 education doctrine ────
    this._voxis = new VOXIS({ domain: 'EDUCATION' });
    this._voxis.setChrono(this._chrono);

    // ── 5. Behavioral Laws L72–L79 ────────────────────────────────────────
    this._laws = new BehavioralLaws({ strictMode: true });

    // ── 6. EduConfig — educational deployment wrapper ─────────────────────
    this._eduConfig = new EduConfig({
      studentId: this.studentId,
      grade: this.grade,
      laws: this._laws,
    });
    this._eduConfig.setChrono(this._chrono);

    // ── 7. HDI — natural language → pipeline interface ────────────────────
    this._hdi = new HDI(
      { cerebex: this._cerebex, nexoris: this._nexoris, chrono: this._chrono },
      `BC::${this.studentId}`,
    );

    // ── 8. StudentIdentity — sovereign Internet Identity ──────────────────
    this._identity = new StudentIdentity({
      studentId: this.studentId,
      displayName: this.studentId,
      grade: this.grade,
      schoolId: this.schoolId,
    });
    this._identity.provision();

    // ── 9. VoiceSession — speech-to-action pipeline ───────────────────────
    this._voiceSession = new VoiceSession({
      studentId: this.studentId,
      internetIdentity: this._identity.export().principal || this.studentId,
      canisterId: this.canisterId,
      behavioralLaws: this._laws,
    });

    // ── 10. StudentMemory — persistent memory vault ───────────────────────
    this._memory = new StudentMemory({ studentId: this.studentId });
    this._memory.setChrono(this._chrono);

    // ── 11. StudentAI — study tools ───────────────────────────────────────
    this._studentAI = new StudentAI();

    // ── Mark provisioned ──────────────────────────────────────────────────
    this._provisioned = true;
    this._active = true;
    this._sessionCount = 1;
    this._lastAction = new Date().toISOString();

    this._chrono.append({
      type: 'CANISTER_PROVISIONED',
      studentId: this.studentId,
      canisterId: this.canisterId,
      grade: this.grade,
      schoolId: this.schoolId,
      timestamp: this._lastAction,
    });

    return {
      provisioned: true,
      canisterId: this.canisterId,
      studentId: this.studentId,
      engines: this._listEngines(),
    };
  }

  /**
   * Destroy the canister — exports all data first, then deactivates.
   * Data is never lost (L78 Persistence Guarantee).
   *
   * @returns {{ destroyed: boolean, canisterId: string, exportedData: object }}
   */
  destroy() {
    const exportedData = this.exportData();

    this._active = false;
    this._touchAction();

    if (this._chrono) {
      this._chrono.append({
        type: 'CANISTER_DESTROYED',
        studentId: this.studentId,
        canisterId: this.canisterId,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      destroyed: true,
      canisterId: this.canisterId,
      exportedData,
    };
  }

  // ── Voice-native build interface ────────────────────────────────────────

  /**
   * Student speaks, canister acts.
   * Routes through HDI with L72–L79 behavioral law enforcement.
   *
   * @param {string} input - Natural language command or question
   * @param {object} [options]
   * @param {string} [options.inputMode] - 'voice' or 'text' (default 'text')
   * @returns {Promise<object>} Execution result or block notice
   */
  async speak(input, options = {}) {
    this._ensureProvisioned();

    const inputMode = options.inputMode || 'text';

    // L72–L79 validation
    const validation = this._laws.validate({
      type: 'SPEAK',
      content: input,
      inputMode,
      explanation: `Student command: ${input}`,
      actor: 'student',
    });

    if (!validation.allowed) {
      this._chrono.append({
        type: 'SPEAK_BLOCKED',
        studentId: this.studentId,
        input: input.slice(0, 100),
        law: validation.law,
        reason: validation.reason,
        timestamp: new Date().toISOString(),
      });
      return { blocked: true, law: validation.law, reason: validation.reason };
    }

    // Route through HDI
    const result = await this._hdi.execute(input);

    this._commandCount++;
    this._touchAction();

    this._chrono.append({
      type: 'SPEAK',
      studentId: this.studentId,
      inputMode,
      command: input.slice(0, 200),
      categoriesActivated: result.activatedCategories?.length ?? 0,
      timestamp: this._lastAction,
    });

    return result;
  }

  // ── Persistent memory (Sovereign Memory Vault) ──────────────────────────

  /**
   * Store a value to persistent memory.
   *
   * @param {string} key  - Memory key
   * @param {*}      data - Data to remember
   * @returns {{ stored: boolean, key: string, size: number, entryCount: number }}
   */
  remember(key, data) {
    this._ensureProvisioned();
    this._touchAction();
    return this._memory.store(key, data);
  }

  /**
   * Retrieve a value from persistent memory.
   *
   * @param {string} key - Memory key
   * @returns {{ found: boolean, key: string, value: *, metadata: object }|{ found: boolean, key: string }}
   */
  recall(key) {
    this._ensureProvisioned();
    return this._memory.retrieve(key);
  }

  /**
   * Search across all stored memories.
   *
   * @param {string} query - Natural language search query
   * @returns {{ results: Array, query: string, total: number }}
   */
  search(query) {
    this._ensureProvisioned();
    return this._memory.search(query);
  }

  // ── Portfolio ───────────────────────────────────────────────────────────

  /**
   * Returns the CHRONO audit trail as portfolio entries.
   * Each entry is a build action the student took.
   *
   * @returns {object[]} Portfolio entries
   */
  portfolio() {
    this._ensureProvisioned();

    const chain = typeof this._chrono.chain === 'function'
      ? this._chrono.chain()
      : [];

    return chain
      .filter(entry => entry.data && entry.data.studentId === this.studentId)
      .map(entry => ({
        index: entry.index,
        type: entry.data.type,
        timestamp: entry.data.timestamp || entry.timestamp,
        hash: entry.hash,
        data: entry.data,
        shared: entry.data.shared ?? false,
      }));
  }

  /**
   * Export all student data — identity, memory, portfolio, canister state.
   * L73 Data Sovereignty: the student can always take their data.
   *
   * @returns {{ studentId: string, canisterId: string, identity: object, memory: object, portfolio: object[], status: object, exportedAt: string }}
   */
  exportData() {
    const identity = this._identity ? this._identity.export() : null;
    const memory = this._memory ? this._memory.export() : null;
    const portfolioEntries = this._provisioned ? this.portfolio() : [];
    const canisterStatus = this.status();

    return {
      studentId: this.studentId,
      canisterId: this.canisterId,
      identity,
      memory,
      portfolio: portfolioEntries,
      status: canisterStatus,
      exportedAt: new Date().toISOString(),
    };
  }

  // ── Study tools integration ─────────────────────────────────────────────

  /**
   * Generate a study guide from text. Delegates to StudentAI.
   *
   * @param {string} text - Reading material
   * @param {object} [options] - StudentAI options
   * @returns {object} Study guide
   */
  study(text, options) {
    this._ensureProvisioned();
    this._touchAction();
    this._logStudyAction('STUDY', text);
    return this._studentAI.study(text, options);
  }

  /**
   * Generate quiz questions from text. Delegates to StudentAI.
   *
   * @param {string} text  - Source material
   * @param {number} [n=5] - Number of questions
   * @returns {Array<{ question: string, hint: string, answer: string }>}
   */
  quiz(text, n) {
    this._ensureProvisioned();
    this._touchAction();
    this._logStudyAction('QUIZ', text);
    return this._studentAI.quiz(text, n);
  }

  /**
   * Generate flashcards from text. Delegates to StudentAI.
   *
   * @param {string} text  - Source material
   * @param {number} [n=8] - Number of flashcards
   * @returns {Array<{ front: string, back: string }>}
   */
  flashcards(text, n) {
    this._ensureProvisioned();
    this._touchAction();
    this._logStudyAction('FLASHCARDS', text);
    return this._studentAI.flashcards(text, n);
  }

  /**
   * Ask a question about notes. Delegates to StudentAI.
   *
   * @param {string} question - The question
   * @param {string} notes    - Notes to search
   * @returns {{ answer: string, confidence: number, found: boolean, encouragement: string }}
   */
  ask(question, notes) {
    this._ensureProvisioned();
    this._touchAction();
    this._logStudyAction('ASK', question);
    return this._studentAI.ask(question, notes);
  }

  // ── State ───────────────────────────────────────────────────────────────

  /**
   * Current canister status.
   *
   * @returns {{ provisioned: boolean, active: boolean, memoryCount: number, chronoLength: number, grade: number, schoolId: string, canisterId: string, studentId: string, sessionCount: number, commandCount: number, lastAction: string|null }}
   */
  status() {
    return {
      provisioned: this._provisioned,
      active: this._active,
      memoryCount: this._memory ? this._memory.stats().entryCount : 0,
      chronoLength: this._chrono ? (typeof this._chrono.chain === 'function' ? this._chrono.chain().length : 0) : 0,
      grade: this.grade,
      schoolId: this.schoolId,
      canisterId: this.canisterId,
      studentId: this.studentId,
      sessionCount: this._sessionCount,
      commandCount: this._commandCount,
      lastAction: this._lastAction,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /** @private */
  _ensureProvisioned() {
    if (!this._provisioned) {
      throw new Error(`BronzeCanister ${this.canisterId} is not provisioned — call provision() first`);
    }
  }

  /** @private */
  _touchAction() {
    this._lastAction = new Date().toISOString();
  }

  /** @private */
  _logStudyAction(type, content) {
    if (this._chrono) {
      this._chrono.append({
        type: `STUDY_${type}`,
        studentId: this.studentId,
        contentLength: content ? content.length : 0,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /** @private */
  _listEngines() {
    return ['CHRONO', 'CEREBEX', 'VOXIS', 'HDI', 'NEXORIS', 'BehavioralLaws', 'EduConfig', 'VoiceSession', 'StudentIdentity', 'StudentMemory', 'StudentAI'];
  }
}
