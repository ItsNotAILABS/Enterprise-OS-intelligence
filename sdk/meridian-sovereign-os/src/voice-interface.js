/**
 * Voice Interface — Classroom Voice Layer for MERIDIAN Sovereign OS
 *
 * Theory: EXECUTIO UNIVERSALIS (Paper X) — one operation: query, act, learn, log
 *         LEGES ANIMAE (Paper V) — behavioral laws L72–L79 govern every interaction
 *
 * Extends the HDI (Human Device Interface) from a single-user architect tool to
 * a multi-user classroom deployment. Every student gets a sovereign voice session
 * backed by their own canister and Internet Identity, while the teacher manages
 * classroom-wide boundaries without ever accessing student canister contents.
 *
 * The teacher CANNOT:
 *   - Access student canister contents (sovereignty — L73)
 *   - Override L72–L79 core behavioral laws (frozen by Paper V)
 *   - View individual student command history (only anonymized aggregates)
 *
 * The teacher CAN:
 *   - Set topic restrictions, time limits, complexity levels
 *   - Control external data source access
 *   - Broadcast prompts to all active sessions
 *   - View anonymized engagement metrics
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { BehavioralLaws } from './edu-config.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CORE_LAWS = ['L72', 'L73', 'L74', 'L75', 'L76', 'L77', 'L78', 'L79'];

const DEFAULT_TEACHER_BOUNDARIES = Object.freeze({
  topicRestrictions:       [],
  sessionTimeLimitMs:      45 * 60 * 1000,  // 45 minutes
  complexityLevel:         'age-appropriate',
  allowExternalDataSources: false,
});

const INTENT_PATTERNS = [
  { pattern: /\b(what|explain|describe|define|who|when|where)\b/i,      type: 'QUERY' },
  { pattern: /\b(create|build|make|generate|write|draw)\b/i,            type: 'CREATE' },
  { pattern: /\b(analyze|compare|evaluate|assess|review)\b/i,           type: 'ANALYZE' },
  { pattern: /\b(help|assist|guide|show me|teach)\b/i,                  type: 'ASSIST' },
  { pattern: /\b(delete|remove|clear|reset|undo)\b/i,                   type: 'MODIFY' },
  { pattern: /\b(save|export|share|submit|send)\b/i,                    type: 'PERSIST' },
  { pattern: /\b(stop|pause|end|quit|exit)\b/i,                         type: 'SESSION_CONTROL' },
];

// ---------------------------------------------------------------------------
// VoiceTranscriber — audio-to-text / text-to-audio stubs
// ---------------------------------------------------------------------------

export class VoiceTranscriber {
  /**
   * @param {object} [options]
   * @param {string} [options.language]   - BCP-47 language tag (default 'en-US')
   * @param {number} [options.sampleRate] - Audio sample rate in Hz (default 16000)
   */
  constructor({ language = 'en-US', sampleRate = 16000 } = {}) {
    this.language   = language;
    this.sampleRate = sampleRate;
  }

  // ── Core transcription (stub) ───────────────────────────────────────────

  /**
   * Transcribe raw audio to text.
   *
   * In production this connects to speech recognition (Web Speech API, Whisper,
   * etc.). The stub returns a structured response so the protocol is exercised.
   *
   * @param {Uint8Array|ArrayBuffer} audioBuffer - Raw audio data
   * @returns {Promise<{ transcript: string, confidence: number, language: string }>}
   */
  async transcribe(audioBuffer) {
    const byteLength = audioBuffer?.byteLength ?? 0;
    if (byteLength === 0) {
      return { transcript: '', confidence: 0, language: this.language };
    }
    // Stub: echo the byte length so callers can verify the pipeline is wired
    return {
      transcript: `[transcribed ${byteLength} bytes]`,
      confidence: 0.95,
      language:   this.language,
    };
  }

  // ── Text-to-speech (stub) ───────────────────────────────────────────────

  /**
   * Synthesize text into audio.
   *
   * @param {string} text - Text to convert to speech
   * @returns {Promise<{ audioBuffer: Uint8Array, duration: number }>}
   */
  async synthesize(text) {
    const str = String(text || '');
    // Stub: approximate duration at ~150 words per minute
    const wordCount = str.split(/\s+/).filter(Boolean).length;
    const duration  = (wordCount / 150) * 60;
    return {
      audioBuffer: new Uint8Array(0),
      duration,
    };
  }
}

// ---------------------------------------------------------------------------
// VoiceSession — a single student's voice session
// ---------------------------------------------------------------------------

export class VoiceSession {
  /**
   * @param {object} options
   * @param {string} options.studentId         - Unique student identifier
   * @param {string} options.internetIdentity  - Student's Internet Identity principal
   * @param {string} options.canisterId        - Student's sovereign canister ID
   * @param {BehavioralLaws} options.behavioralLaws - Behavioral law instance for validation
   * @param {object} [options.teacherBoundaries]    - Teacher-configured boundaries
   * @param {VoiceTranscriber} [options.transcriber] - Transcriber instance
   */
  constructor({ studentId, internetIdentity, canisterId, behavioralLaws, teacherBoundaries = null, transcriber = null }) {
    if (!studentId) throw new Error('VoiceSession requires a studentId');
    if (!internetIdentity) throw new Error('VoiceSession requires an internetIdentity');
    if (!canisterId) throw new Error('VoiceSession requires a canisterId');
    if (!behavioralLaws) throw new Error('VoiceSession requires behavioralLaws');

    this.studentId         = studentId;
    this.internetIdentity  = internetIdentity;
    this.canisterId        = canisterId;
    this.behavioralLaws    = behavioralLaws;
    this.teacherBoundaries = { ...DEFAULT_TEACHER_BOUNDARIES, ...teacherBoundaries };
    this._transcriber      = transcriber || new VoiceTranscriber();

    this._active       = false;
    this._paused       = false;
    this._startedAt    = null;
    this._endedAt      = null;
    this._pausedAt     = null;
    this._pausedTotal  = 0;
    this._commands     = [];
    this._chrono       = null;
    this._cerebex      = null;
  }

  // ── Engine injection ────────────────────────────────────────────────────

  setChrono(chrono)   { this._chrono  = chrono;  return this; }
  setCerebex(cerebex) { this._cerebex = cerebex; return this; }

  // ── Session lifecycle ───────────────────────────────────────────────────

  /**
   * Begin a voice session. Logs the start to CHRONO.
   */
  startSession() {
    if (this._active) throw new Error('Session already active');
    this._active    = true;
    this._paused    = false;
    this._startedAt = Date.now();
    this._endedAt   = null;
    this._pausedTotal = 0;
    this._log('VOICE_SESSION_START', { studentId: this.studentId, canisterId: this.canisterId });
  }

  /**
   * End the session. Persists final state and logs to CHRONO.
   */
  endSession() {
    if (!this._active) return;
    if (this._paused) this._resumeInternal();
    this._active  = false;
    this._endedAt = Date.now();
    this._log('VOICE_SESSION_END', {
      studentId: this.studentId,
      duration:  this.sessionDuration,
      commandCount: this._commands.length,
    });
  }

  pauseSession() {
    if (!this._active || this._paused) return;
    this._paused   = true;
    this._pausedAt = Date.now();
    this._log('VOICE_SESSION_PAUSE', { studentId: this.studentId });
  }

  resumeSession() {
    if (!this._active || !this._paused) return;
    this._resumeInternal();
    this._log('VOICE_SESSION_RESUME', { studentId: this.studentId });
  }

  /** @private */
  _resumeInternal() {
    this._pausedTotal += Date.now() - this._pausedAt;
    this._paused   = false;
    this._pausedAt = null;
  }

  // ── Voice input processing ─────────────────────────────────────────────

  /**
   * Process raw audio input through the full pipeline:
   *   1. Transcribe audio → text
   *   2. Extract intent from transcript
   *   3. Check behavioral boundaries
   *   4. Route to CEREBEX (if wired) or return intent
   *
   * @param {Uint8Array|ArrayBuffer} audioBuffer - Raw audio data
   * @returns {Promise<{ transcript: string, intent: object, action: object }>}
   */
  async processVoiceInput(audioBuffer) {
    this._assertActive();
    this._checkTimeLimit();

    const { transcript, confidence } = await this._transcriber.transcribe(audioBuffer);
    if (!transcript) {
      return { transcript: '', intent: null, action: { type: 'NO_INPUT', inputMode: 'voice' } };
    }

    const intent = this.extractIntent(transcript);
    intent.confidence = confidence;
    intent.inputMode  = 'voice';

    const boundaryCheck = this.checkBoundaries(intent);
    if (!boundaryCheck.allowed) {
      this._recordCommand(transcript, intent, boundaryCheck);
      return { transcript, intent, action: boundaryCheck };
    }

    const action = await this._executeIntent(intent, transcript);
    this._recordCommand(transcript, intent, action);
    return { transcript, intent, action };
  }

  /**
   * Text fallback — identical pipeline to voice (L79 Voice Parity).
   *
   * @param {string} text - Raw text input
   * @returns {Promise<{ transcript: string, intent: object, action: object }>}
   */
  async processTextInput(text) {
    this._assertActive();
    this._checkTimeLimit();

    const transcript = String(text || '').trim();
    if (!transcript) {
      return { transcript: '', intent: null, action: { type: 'NO_INPUT', inputMode: 'text' } };
    }

    const intent = this.extractIntent(transcript);
    intent.confidence = 1.0;
    intent.inputMode  = 'text';

    const boundaryCheck = this.checkBoundaries(intent);
    if (!boundaryCheck.allowed) {
      this._recordCommand(transcript, intent, boundaryCheck);
      return { transcript, intent, action: boundaryCheck };
    }

    const action = await this._executeIntent(intent, transcript);
    this._recordCommand(transcript, intent, action);
    return { transcript, intent, action };
  }

  // ── Intent extraction ──────────────────────────────────────────────────

  /**
   * Parse natural language into a structured intent object.
   *
   * @param {string} transcript - Natural language text
   * @returns {{ type: string, raw: string, tokens: string[], entities: string[] }}
   */
  extractIntent(transcript) {
    const raw    = String(transcript).trim();
    const tokens = raw.toLowerCase().split(/\s+/).filter(Boolean);

    let type = 'GENERAL';
    for (const { pattern, type: t } of INTENT_PATTERNS) {
      if (pattern.test(raw)) { type = t; break; }
    }

    // Extract quoted or capitalized entities as potential parameters
    const entities = [];
    const quoted = raw.match(/"([^"]+)"|'([^']+)'/g);
    if (quoted) entities.push(...quoted.map((q) => q.replace(/["']/g, '')));

    return { type, raw, tokens, entities };
  }

  // ── Behavioral boundary enforcement ─────────────────────────────────────

  /**
   * Validate an intent against behavioral laws (L72–L79) and teacher boundaries.
   *
   * @param {object} intent - Structured intent from extractIntent()
   * @returns {{ allowed: boolean, law?: string, reason: string }}
   */
  checkBoundaries(intent) {
    // Core behavioral laws — non-overridable
    const lawCheck = this.behavioralLaws.validate({
      type:      intent.type,
      content:   intent.raw,
      inputMode: intent.inputMode || 'text',
      actor:     'student',
      explanation: `Student ${intent.inputMode || 'text'} command: ${intent.type}`,
    });
    if (!lawCheck.allowed) return lawCheck;

    // Teacher topic restrictions
    const { topicRestrictions } = this.teacherBoundaries;
    if (topicRestrictions.length > 0) {
      const raw = intent.raw.toLowerCase();
      const topicAllowed = topicRestrictions.some((topic) => raw.includes(topic.toLowerCase()));
      if (!topicAllowed) {
        return {
          allowed: false,
          law:    'TEACHER_TOPIC',
          reason: `Topic not within allowed subjects: ${topicRestrictions.join(', ')}`,
        };
      }
    }

    // Teacher external data source restriction
    if (!this.teacherBoundaries.allowExternalDataSources && intent.type === 'PERSIST') {
      const externalSignals = /\b(fetch|download|import|api|url|http|external)\b/i;
      if (externalSignals.test(intent.raw)) {
        return {
          allowed: false,
          law:    'TEACHER_EXTERNAL',
          reason: 'External data source access is disabled by teacher',
        };
      }
    }

    return { allowed: true, reason: 'Intent passes all boundaries' };
  }

  // ── Session state ───────────────────────────────────────────────────────

  get active()          { return this._active && !this._paused; }
  get sessionDuration() {
    if (!this._startedAt) return 0;
    const end = this._endedAt || Date.now();
    return end - this._startedAt - this._pausedTotal;
  }
  get commandHistory()  { return [...this._commands]; }

  // ── Private helpers ─────────────────────────────────────────────────────

  /** @private */
  _assertActive() {
    if (!this._active) throw new Error('VoiceSession is not active');
    if (this._paused) throw new Error('VoiceSession is paused');
  }

  /** @private */
  _checkTimeLimit() {
    const limit = this.teacherBoundaries.sessionTimeLimitMs;
    if (limit && this.sessionDuration > limit) {
      this.endSession();
      throw new Error(`Session time limit exceeded (${Math.round(limit / 60000)}m)`);
    }
  }

  /** @private */
  async _executeIntent(intent, transcript) {
    if (this._cerebex) {
      const result = this._cerebex.route(transcript);
      return {
        type:       'EXECUTED',
        inputMode:  intent.inputMode,
        intentType: intent.type,
        topCategory:       result.executionPlan.topCategory,
        activatedCount:    result.activatedCategories.length,
        freeEnergy:        result.freeEnergy,
      };
    }
    // Without CEREBEX, return the structured intent as the action
    return {
      type:       'INTENT_RESOLVED',
      inputMode:  intent.inputMode,
      intentType: intent.type,
    };
  }

  /** @private */
  _recordCommand(transcript, intent, action) {
    this._commands.push({
      timestamp:  new Date().toISOString(),
      transcript: transcript.slice(0, 200),
      intentType: intent.type,
      actionType: action.type,
      allowed:    action.allowed !== false,
    });
    this._log('VOICE_COMMAND', {
      studentId:  this.studentId,
      intentType: intent.type,
      actionType: action.type,
      allowed:    action.allowed !== false,
    });
  }

  /** @private */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({ type, ...data });
    }
  }
}

// ---------------------------------------------------------------------------
// ClassroomVoiceManager — multi-student classroom voice session manager
// ---------------------------------------------------------------------------

export class ClassroomVoiceManager {
  /**
   * @param {object} options
   * @param {string} options.classroomId          - Unique classroom identifier
   * @param {string} options.teacherId            - Teacher's identifier
   * @param {number} [options.maxConcurrentSessions] - Max simultaneous sessions (default 40)
   * @param {BehavioralLaws} [options.behavioralLaws] - Shared behavioral laws instance
   */
  constructor({ classroomId, teacherId, maxConcurrentSessions = 40, behavioralLaws = null }) {
    if (!classroomId) throw new Error('ClassroomVoiceManager requires a classroomId');
    if (!teacherId) throw new Error('ClassroomVoiceManager requires a teacherId');

    this.classroomId          = classroomId;
    this.teacherId            = teacherId;
    this.maxConcurrentSessions = maxConcurrentSessions;
    this.behavioralLaws       = behavioralLaws || new BehavioralLaws();

    /** @type {Map<string, VoiceSession>} */
    this._sessions           = new Map();
    this._teacherBoundaries  = { ...DEFAULT_TEACHER_BOUNDARIES };
    this._chrono             = null;
    this._cerebex            = null;
    this._broadcastLog       = [];
    this._createdAt          = new Date().toISOString();
  }

  // ── Engine injection ────────────────────────────────────────────────────

  /**
   * Inject CHRONO for immutable audit logging.
   * @param {object} chrono - CHRONO instance
   * @returns {ClassroomVoiceManager} this (for chaining)
   */
  setChrono(chrono) {
    this._chrono = chrono;
    // Propagate to existing sessions
    for (const session of this._sessions.values()) {
      session.setChrono(chrono);
    }
    return this;
  }

  /**
   * Inject CEREBEX for intent routing.
   * @param {object} cerebex - CEREBEX instance
   * @returns {ClassroomVoiceManager} this (for chaining)
   */
  setCerebex(cerebex) {
    this._cerebex = cerebex;
    for (const session of this._sessions.values()) {
      session.setCerebex(cerebex);
    }
    return this;
  }

  // ── Session management ─────────────────────────────────────────────────

  /**
   * Provision a new student voice session within this classroom.
   *
   * @param {string} studentId         - Unique student identifier
   * @param {string} internetIdentity  - Student's Internet Identity principal
   * @param {string} [canisterId]      - Student's canister ID (defaults to derived)
   * @returns {VoiceSession}
   */
  createSession(studentId, internetIdentity, canisterId = null) {
    if (this._sessions.has(studentId)) {
      throw new Error(`Session already exists for student: ${studentId}`);
    }
    if (this._sessions.size >= this.maxConcurrentSessions) {
      throw new Error(`Maximum concurrent sessions reached (${this.maxConcurrentSessions})`);
    }

    const session = new VoiceSession({
      studentId,
      internetIdentity,
      canisterId:       canisterId || `canister-${studentId}`,
      behavioralLaws:   this.behavioralLaws,
      teacherBoundaries: this._teacherBoundaries,
    });

    if (this._chrono) session.setChrono(this._chrono);
    if (this._cerebex) session.setCerebex(this._cerebex);

    this._sessions.set(studentId, session);
    session.startSession();

    this._log('CLASSROOM_SESSION_CREATED', {
      classroomId: this.classroomId,
      studentId,
      activeSessions: this._sessions.size,
    });

    return session;
  }

  /**
   * Retrieve an existing student session.
   * @param {string} studentId
   * @returns {VoiceSession|undefined}
   */
  getSession(studentId) {
    return this._sessions.get(studentId);
  }

  /**
   * End and remove a student's voice session.
   * @param {string} studentId
   */
  endSession(studentId) {
    const session = this._sessions.get(studentId);
    if (!session) return;
    session.endSession();
    this._sessions.delete(studentId);
    this._log('CLASSROOM_SESSION_ENDED', {
      classroomId: this.classroomId,
      studentId,
      activeSessions: this._sessions.size,
    });
  }

  /**
   * End all active student sessions (e.g. class over).
   */
  endAllSessions() {
    for (const [studentId] of this._sessions) {
      this.endSession(studentId);
    }
    this._log('CLASSROOM_ALL_SESSIONS_ENDED', {
      classroomId: this.classroomId,
    });
  }

  // ── Teacher controls ───────────────────────────────────────────────────

  /**
   * Configure a teacher-level boundary. Teachers can set topic restrictions,
   * time limits, complexity levels, and external access — but CANNOT override
   * core behavioral laws (L72–L79) or access student canister contents.
   *
   * @param {string} law    - Boundary key: 'topicRestrictions' | 'sessionTimeLimitMs' |
   *                          'complexityLevel' | 'allowExternalDataSources'
   * @param {*}      config - Value to set
   */
  setTeacherBoundary(law, config) {
    // Guard: teachers cannot override core behavioral laws
    if (CORE_LAWS.includes(law)) {
      throw new Error(`Teacher cannot override core behavioral law: ${law}`);
    }

    const validKeys = Object.keys(DEFAULT_TEACHER_BOUNDARIES);
    if (!validKeys.includes(law)) {
      throw new Error(`Unknown teacher boundary: ${law}. Valid: ${validKeys.join(', ')}`);
    }

    this._teacherBoundaries[law] = config;

    // Propagate to all active sessions
    for (const session of this._sessions.values()) {
      session.teacherBoundaries = { ...this._teacherBoundaries };
    }

    this._log('TEACHER_BOUNDARY_SET', {
      classroomId: this.classroomId,
      teacherId:   this.teacherId,
      boundary:    law,
    });
  }

  /**
   * Return anonymized activity data for the teacher dashboard.
   * Individual student command history is NOT included — only aggregates.
   *
   * @returns {object}
   */
  getTeacherDashboardData() {
    const sessions   = [...this._sessions.values()];
    const activeSessions = sessions.filter((s) => s.active);

    let totalCommands = 0;
    const intentDistribution = {};
    for (const session of sessions) {
      const cmds = session.commandHistory;
      totalCommands += cmds.length;
      for (const cmd of cmds) {
        intentDistribution[cmd.intentType] = (intentDistribution[cmd.intentType] || 0) + 1;
      }
    }

    return {
      classroomId:        this.classroomId,
      totalSessions:      this._sessions.size,
      activeSessions:     activeSessions.length,
      totalCommands,
      intentDistribution,
      averageSessionDuration: sessions.length
        ? sessions.reduce((sum, s) => sum + s.sessionDuration, 0) / sessions.length
        : 0,
      teacherBoundaries: { ...this._teacherBoundaries },
      broadcastCount:    this._broadcastLog.length,
    };
  }

  // ── Broadcast ──────────────────────────────────────────────────────────

  /**
   * Broadcast a prompt or question to all active student sessions.
   * Returns the number of students who received the broadcast.
   *
   * @param {string} prompt - The prompt or question to broadcast
   * @returns {Promise<{ delivered: number, studentIds: string[] }>}
   */
  async broadcastPrompt(prompt) {
    const text = String(prompt || '').trim();
    if (!text) throw new Error('Broadcast prompt cannot be empty');

    const delivered  = [];
    for (const [studentId, session] of this._sessions) {
      if (session.active) {
        await session.processTextInput(text);
        delivered.push(studentId);
      }
    }

    this._broadcastLog.push({
      timestamp: new Date().toISOString(),
      prompt:    text.slice(0, 200),
      delivered: delivered.length,
    });

    this._log('CLASSROOM_BROADCAST', {
      classroomId: this.classroomId,
      teacherId:   this.teacherId,
      delivered:   delivered.length,
    });

    return { delivered: delivered.length, studentIds: delivered };
  }

  // ── Statistics ─────────────────────────────────────────────────────────

  /**
   * Classroom statistics: active sessions, total commands, engagement.
   *
   * @returns {object}
   */
  getClassroomStats() {
    const sessions = [...this._sessions.values()];
    const activeSessions = sessions.filter((s) => s.active);

    let totalCommands  = 0;
    let totalAllowed   = 0;
    let totalBlocked   = 0;
    for (const session of sessions) {
      for (const cmd of session.commandHistory) {
        totalCommands++;
        if (cmd.allowed) totalAllowed++; else totalBlocked++;
      }
    }

    return {
      classroomId:     this.classroomId,
      totalSessions:   this._sessions.size,
      activeSessions:  activeSessions.length,
      totalCommands,
      allowedCommands: totalAllowed,
      blockedCommands: totalBlocked,
      engagementRate:  totalCommands > 0 ? totalAllowed / totalCommands : 0,
      averageSessionDuration: sessions.length
        ? sessions.reduce((sum, s) => sum + s.sessionDuration, 0) / sessions.length
        : 0,
    };
  }

  // ── CHRONO integration ─────────────────────────────────────────────────

  /**
   * Return the full classroom voice activity audit log (anonymized).
   * Student identifiers are hashed; individual command content is omitted.
   *
   * @returns {object[]}
   */
  auditLog() {
    const entries = [];

    for (const [studentId, session] of this._sessions) {
      const anonymizedId = `student-${hashCode(studentId)}`;
      for (const cmd of session.commandHistory) {
        entries.push({
          anonymizedStudent: anonymizedId,
          timestamp:         cmd.timestamp,
          intentType:        cmd.intentType,
          actionType:        cmd.actionType,
          allowed:           cmd.allowed,
          // NOTE: transcript is intentionally omitted — student sovereignty
        });
      }
    }

    return entries;
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /** @private */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({ type, ...data });
    }
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Simple deterministic hash for anonymization (not cryptographic).
 * @param {string} str
 * @returns {string}
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
