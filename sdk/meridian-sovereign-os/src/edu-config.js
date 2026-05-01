/**
 * EDU-CONFIG — Educational Configuration Layer (Behavioral Laws L72–L79)
 *
 * Theory: LEGES ANIMAE (Paper V) — Behavioral Economics Laws for Education
 *
 * This module implements the eight Behavioral Laws (L72–L79) from Paper V,
 * configured specifically for educational safety in sovereign OS deployments.
 * Every action a student takes passes through BehavioralLaws validation before
 * reaching the underlying MERIDIAN engines.
 *
 * The laws encode non-negotiable guarantees:
 *   L72  Content Safety         — no harmful, violent, or age-inappropriate content
 *   L73  Data Sovereignty       — student data never leaves the canister without consent
 *   L74  Identity Integrity     — student II cannot be overwritten or accessed externally
 *   L75  Epistemic Honesty      — distinguish known, inferred, and unknown
 *   L76  Behavioral Transparency — every action explainable in plain language
 *   L77  No Extraction          — no ads, no tracking, no mining, no lock-in
 *   L78  Persistence Guarantee  — work survives sessions, lapses, and transfers
 *   L79  Voice Parity           — voice and text receive identical treatment
 *
 * EduConfig wraps CEREBEX, HDI, and CHRONO so that a student deployment
 * inherits all MERIDIAN intelligence while remaining within the law boundary.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { PHI, PHI_INV } from './nexoris.js';

// ---------------------------------------------------------------------------
// Unsafe content patterns (L72)
// ---------------------------------------------------------------------------

const UNSAFE_PATTERNS = [
  /\b(violen(t|ce)|weapon|explo(de|sive)|kill|murder)\b/i,
  /\b(drug|narcotic|controlled.substance)\b/i,
  /\b(hate.speech|slur|discriminat(e|ion|ory))\b/i,
  /\b(self.harm|suicid(e|al))\b/i,
  /\b(explicit|pornograph(y|ic)|obscen(e|ity))\b/i,
];

// ---------------------------------------------------------------------------
// Extraction signals (L77)
// ---------------------------------------------------------------------------

const EXTRACTION_SIGNALS = [
  'advertisement', 'ad_tracking', 'behavioral_tracking',
  'data_mining', 'vendor_lock_in', 'telemetry_export',
  'third_party_share', 'monetization',
];

// ---------------------------------------------------------------------------
// Educational category whitelist (for CEREBEX wrapping)
// ---------------------------------------------------------------------------

const EDU_CATEGORIES = [
  'SWOT',
  'FIVE_WHYS',
  'FERMI_ESTIMATION',
  'SOCRATIC_CHALLENGE',
  'STEELMANNING',
  'SYNTHESIS',
  'SCENARIO_PLANNING',
  'MENTAL_MODEL_INVERSION',
  'MENTAL_MODEL_SECOND_ORDER',
  'MENTAL_MODEL_OCCAMS_RAZOR',
  'MENTAL_MODEL_PARETO',
  'MENTAL_MODEL_CIRCLE_OF_COMPETENCE',
  'JTBD',
  'LEAN_CANVAS',
  'OKR_BUILDER',
  'RISK_ASSESSMENT',
  'AUDIT_TRAIL',
];

// ---------------------------------------------------------------------------
// BehavioralLaws — frozen law configuration (L72–L79)
// ---------------------------------------------------------------------------

export class BehavioralLaws {
  /**
   * @param {object} [config]
   * @param {boolean} [config.strictMode]       - If true, reject on any ambiguity (default true)
   * @param {string[]} [config.unsafeOverrides] - Additional unsafe content patterns
   * @param {number}  [config.minConsentAge]    - Minimum age for data consent (default 13)
   */
  constructor(config = {}) {
    this.strictMode    = config.strictMode    ?? true;
    this.minConsentAge = config.minConsentAge ?? 13;

    /** @type {RegExp[]} */
    this._unsafePatterns = [
      ...UNSAFE_PATTERNS,
      ...(config.unsafeOverrides || []).map((p) => new RegExp(p, 'i')),
    ];

    this._laws = Object.freeze({
      L72: { id: 'L72', name: 'Content Safety',           active: true },
      L73: { id: 'L73', name: 'Data Sovereignty',         active: true },
      L74: { id: 'L74', name: 'Identity Integrity',       active: true },
      L75: { id: 'L75', name: 'Epistemic Honesty',        active: true },
      L76: { id: 'L76', name: 'Behavioral Transparency',  active: true },
      L77: { id: 'L77', name: 'No Extraction',            active: true },
      L78: { id: 'L78', name: 'Persistence Guarantee',    active: true },
      L79: { id: 'L79', name: 'Voice Parity',             active: true },
    });

    Object.freeze(this);
  }

  // ── Per-law checks ──────────────────────────────────────────────────────

  /**
   * L72 — Content Safety. Rejects harmful, violent, or age-inappropriate content.
   *
   * @param {string} content - Raw content to evaluate.
   * @returns {{ allowed: boolean, law: string, reason: string }}
   */
  checkContentSafety(content) {
    const text = String(content);
    for (const pattern of this._unsafePatterns) {
      if (pattern.test(text)) {
        return { allowed: false, law: 'L72', reason: `Content matched unsafe pattern: ${pattern}` };
      }
    }
    return { allowed: true, law: 'L72', reason: 'Content passes safety check' };
  }

  /**
   * L73 — Data Sovereignty. Student data never leaves the canister without consent.
   *
   * @param {object} action
   * @param {string} action.type       - Action type (e.g. 'EXPORT', 'SHARE')
   * @param {boolean} [action.consent] - Whether student has given explicit consent
   * @returns {{ allowed: boolean, law: string, reason: string }}
   */
  checkDataSovereignty(action) {
    const exportTypes = ['EXPORT', 'SHARE', 'TRANSFER', 'SYNC_EXTERNAL'];
    if (exportTypes.includes(action.type) && !action.consent) {
      return { allowed: false, law: 'L73', reason: 'Data export requires explicit student consent' };
    }
    return { allowed: true, law: 'L73', reason: 'Data sovereignty preserved' };
  }

  /**
   * L74 — Identity Integrity. Student II cannot be overwritten or accessed externally.
   *
   * @param {object} action
   * @param {string} action.type     - Action type (e.g. 'IDENTITY_READ', 'IDENTITY_WRITE')
   * @param {string} [action.actor]  - Who is requesting ('student', 'school', 'vendor', 'external')
   * @returns {{ allowed: boolean, law: string, reason: string }}
   */
  checkIdentityIntegrity(action) {
    const identityOps = ['IDENTITY_READ', 'IDENTITY_WRITE', 'IDENTITY_OVERWRITE'];
    if (identityOps.includes(action.type) && action.actor !== 'student') {
      return { allowed: false, law: 'L74', reason: `Identity access denied for actor: ${action.actor}` };
    }
    return { allowed: true, law: 'L74', reason: 'Identity integrity maintained' };
  }

  /**
   * L75 — Epistemic Honesty. Distinguish known, inferred, and unknown.
   *
   * @param {object} content
   * @param {string} [content.epistemic] - One of 'known', 'inferred', 'unknown'
   * @returns {{ allowed: boolean, law: string, reason: string }}
   */
  checkEpistemicHonesty(content) {
    const validStates = ['known', 'inferred', 'unknown'];
    if (!content.epistemic || !validStates.includes(content.epistemic)) {
      return { allowed: false, law: 'L75', reason: 'Content must declare epistemic status: known, inferred, or unknown' };
    }
    return { allowed: true, law: 'L75', reason: `Epistemic state declared: ${content.epistemic}` };
  }

  /**
   * L76 — Behavioral Transparency. Every action must be explainable.
   *
   * @param {object} action
   * @param {string} [action.explanation] - Plain-language explanation of the action
   * @returns {{ allowed: boolean, law: string, reason: string }}
   */
  checkBehavioralTransparency(action) {
    if (!action.explanation || typeof action.explanation !== 'string' || action.explanation.trim().length === 0) {
      return { allowed: false, law: 'L76', reason: 'Action must include a plain-language explanation for the student' };
    }
    return { allowed: true, law: 'L76', reason: 'Action is explainable' };
  }

  /**
   * L77 — No Extraction. No ads, tracking, mining, or lock-in.
   *
   * @param {object} action
   * @param {string} action.type - Action type
   * @returns {{ allowed: boolean, law: string, reason: string }}
   */
  checkNoExtraction(action) {
    const actionType = String(action.type).toLowerCase();
    for (const signal of EXTRACTION_SIGNALS) {
      if (actionType.includes(signal)) {
        return { allowed: false, law: 'L77', reason: `Extraction activity blocked: ${signal}` };
      }
    }
    return { allowed: true, law: 'L77', reason: 'No extraction detected' };
  }

  /**
   * L78 — Persistence Guarantee. Work must survive sessions, lapses, transfers.
   *
   * @param {object} action
   * @param {string} action.type - Action type (e.g. 'DELETE_WORK', 'EXPIRE_SESSION')
   * @returns {{ allowed: boolean, law: string, reason: string }}
   */
  checkPersistenceGuarantee(action) {
    const destructiveOps = ['DELETE_WORK', 'EXPIRE_DATA', 'PURGE_STUDENT', 'REVOKE_ON_LAPSE'];
    if (destructiveOps.includes(action.type)) {
      return { allowed: false, law: 'L78', reason: `Persistence violation: ${action.type} is not permitted` };
    }
    return { allowed: true, law: 'L78', reason: 'Student work persistence guaranteed' };
  }

  /**
   * L79 — Voice Parity. Voice and text receive identical treatment.
   *
   * @param {object} action
   * @param {string} [action.inputMode] - 'voice' or 'text'
   * @returns {{ allowed: boolean, law: string, reason: string }}
   */
  checkVoiceParity(action) {
    if (action.inputMode && action.inputMode !== 'voice' && action.inputMode !== 'text') {
      return { allowed: false, law: 'L79', reason: `Unknown input mode: ${action.inputMode}` };
    }
    return { allowed: true, law: 'L79', reason: 'Voice parity maintained' };
  }

  // ── Aggregate validation ────────────────────────────────────────────────

  /**
   * Validate a proposed action against all applicable Behavioral Laws (L72–L79).
   *
   * @param {object} action - The action to validate.
   * @param {string} action.type           - Action type identifier.
   * @param {string} [action.content]      - Content payload (checked by L72).
   * @param {boolean} [action.consent]     - Student consent flag (L73).
   * @param {string} [action.actor]        - Actor identity (L74).
   * @param {string} [action.epistemic]    - Epistemic status (L75).
   * @param {string} [action.explanation]  - Plain-language explanation (L76).
   * @param {string} [action.inputMode]    - Input mode: 'voice' | 'text' (L79).
   * @returns {{ allowed: boolean, law: string, reason: string }}
   */
  validate(action) {
    // L72 — Content Safety
    if (action.content) {
      const l72 = this.checkContentSafety(action.content);
      if (!l72.allowed) return l72;
    }

    // L73 — Data Sovereignty
    const l73 = this.checkDataSovereignty(action);
    if (!l73.allowed) return l73;

    // L74 — Identity Integrity
    const l74 = this.checkIdentityIntegrity(action);
    if (!l74.allowed) return l74;

    // L75 — Epistemic Honesty (only when content carries epistemic status)
    if (this.strictMode && action.epistemic !== undefined) {
      const l75 = this.checkEpistemicHonesty(action);
      if (!l75.allowed) return l75;
    }

    // L76 — Behavioral Transparency
    if (this.strictMode && action.explanation !== undefined) {
      const l76 = this.checkBehavioralTransparency(action);
      if (!l76.allowed) return l76;
    }

    // L77 — No Extraction
    const l77 = this.checkNoExtraction(action);
    if (!l77.allowed) return l77;

    // L78 — Persistence Guarantee
    const l78 = this.checkPersistenceGuarantee(action);
    if (!l78.allowed) return l78;

    // L79 — Voice Parity
    const l79 = this.checkVoiceParity(action);
    if (!l79.allowed) return l79;

    return { allowed: true, law: 'ALL', reason: 'Action passes all behavioral laws (L72–L79)' };
  }

  /**
   * Return the full law set with current state.
   *
   * @returns {object} The frozen law definitions.
   */
  audit() {
    return { ...this._laws };
  }
}

// ---------------------------------------------------------------------------
// EduConfig — educational deployment wrapper for MERIDIAN engines
// ---------------------------------------------------------------------------

export class EduConfig {
  /**
   * @param {object} options
   * @param {string} options.studentId  - Unique student identifier (Internet Identity)
   * @param {number} [options.grade]    - Student grade level (1–12+)
   * @param {BehavioralLaws} [options.laws] - Custom BehavioralLaws instance
   */
  constructor({ studentId, grade = 0, laws = null } = {}) {
    if (!studentId) throw new Error('EduConfig requires a studentId');

    /** @type {string} */
    this.studentId = studentId;

    /** @type {number} */
    this.grade = grade;

    /** @type {BehavioralLaws} */
    this.laws = laws || new BehavioralLaws();

    /** @type {object|null} */
    this._chrono = null;

    /** @type {string} */
    this._createdAt = new Date().toISOString();
  }

  // ── CHRONO integration ──────────────────────────────────────────────────

  /**
   * Inject CHRONO for immutable audit logging.
   *
   * @param {object} chrono - CHRONO instance
   * @returns {EduConfig} this (for chaining)
   */
  setChrono(chrono) { this._chrono = chrono; return this; }

  /**
   * @private
   */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({
        type,
        studentId: this.studentId,
        grade: this.grade,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ── Engine wrappers ─────────────────────────────────────────────────────

  /**
   * Wrap a CEREBEX instance so only educational categories are exposed.
   * The returned object proxies `query()` through the behavioral law filter.
   *
   * @param {object} cerebex - CEREBEX engine instance
   * @returns {object} Filtered CEREBEX proxy
   */
  wrapCerebex(cerebex) {
    const self = this;

    return {
      /** Educational category whitelist */
      categories: [...EDU_CATEGORIES],

      /**
       * Query through the educational filter.
       *
       * @param {string} input - Student query
       * @returns {object} Filtered result
       */
      query(input) {
        const validation = self.laws.validate({
          type: 'QUERY',
          content: input,
          explanation: `Student query: ${input}`,
        });

        if (!validation.allowed) {
          self._log('EDU_QUERY_BLOCKED', { input, law: validation.law, reason: validation.reason });
          return { blocked: true, law: validation.law, reason: validation.reason };
        }

        const result = cerebex.query(input);

        // Filter to educational categories only
        if (result && result.categories) {
          result.categories = result.categories.filter(
            (c) => EDU_CATEGORIES.includes(c.name || c),
          );
        }

        self._log('EDU_QUERY', { input, categoriesMatched: result?.categories?.length ?? 0 });
        return result;
      },

      /**
       * List available educational categories.
       *
       * @returns {string[]}
       */
      listCategories() {
        return [...EDU_CATEGORIES];
      },
    };
  }

  /**
   * Wrap an HDI instance so every command is validated against behavioral laws.
   *
   * @param {object} hdi - HDI engine instance
   * @returns {object} Law-enforced HDI proxy
   */
  wrapHDI(hdi) {
    const self = this;

    return {
      /**
       * Execute a command through the behavioral law filter.
       *
       * @param {string} command      - Natural-language command
       * @param {object} [options]    - Additional options
       * @param {string} [options.inputMode] - 'voice' or 'text' (default 'text')
       * @returns {object} Execution result or block notice
       */
      execute(command, options = {}) {
        const action = {
          type: 'EXECUTE',
          content: command,
          inputMode: options.inputMode || 'text',
          explanation: `Student command: ${command}`,
          actor: 'student',
        };

        const validation = self.laws.validate(action);
        if (!validation.allowed) {
          self._log('EDU_EXECUTE_BLOCKED', { command, law: validation.law, reason: validation.reason });
          return { blocked: true, law: validation.law, reason: validation.reason };
        }

        const result = hdi.execute
          ? hdi.execute(command, options)
          : hdi.process
            ? hdi.process(command)
            : { error: 'HDI instance does not expose execute or process' };

        self._log('EDU_EXECUTE', { command, inputMode: action.inputMode });
        return result;
      },
    };
  }

  /**
   * Wrap a CHRONO instance so all entries include student context.
   *
   * @param {object} chrono - CHRONO engine instance
   * @returns {object} Student-contextualized CHRONO proxy
   */
  wrapChrono(chrono) {
    const self = this;

    return {
      /**
       * Append an entry with automatic student context.
       *
       * @param {object} data - Payload to record
       * @returns {object} CHRONO append result
       */
      append(data) {
        return chrono.append({
          ...data,
          studentId: self.studentId,
          grade: self.grade,
          eduContext: true,
        });
      },

      /**
       * Verify the chain integrity (passthrough — no filtering needed).
       *
       * @returns {object} Verification result
       */
      verify() {
        return chrono.verify();
      },

      /**
       * Retrieve the chain (read-only, filtered to this student).
       *
       * @returns {object[]} Student's chain entries
       */
      history() {
        if (typeof chrono.chain === 'function') {
          return chrono.chain().filter((e) => e.data?.studentId === self.studentId);
        }
        return [];
      },
    };
  }

  // ── Snapshot ─────────────────────────────────────────────────────────────

  /**
   * Return the current configuration state.
   *
   * @returns {{ studentId: string, grade: number, laws: object, createdAt: string, hasChrono: boolean }}
   */
  snapshot() {
    return {
      studentId: this.studentId,
      grade:     this.grade,
      laws:      this.laws.audit(),
      createdAt: this._createdAt,
      hasChrono: this._chrono !== null,
    };
  }
}
