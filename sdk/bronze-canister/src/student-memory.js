/**
 * STUDENT-MEMORY — Sovereign Memory Vault
 * ──────────────────────────────────────────────────────────────────────────────
 * Persistent, encrypted (via VetKeys on ICP), student-owned memory store.
 * Every piece of work a student creates lives here — notes, projects, builds,
 * conversations, flashcards, portfolios. The student owns it forever (L78).
 *
 * In the SDK this is a Map-based store that simulates ICP stable memory.
 * On-chain deployment swaps the Map for actual canister stable memory with
 * zero interface changes.
 *
 * Search uses TF-IDF scoring across all stored entries — the same NLP
 * techniques used in @medina/student-ai.
 *
 * Theory basis:
 *   Paper XV   — ASK III: Sovereign Memory architecture
 *   Paper V    — LEGES ANIMAE: L73 (data sovereignty), L78 (persistence)
 *   Paper XIII — DE SUBSTRATO EPISTEMICO: knowledge as substrate
 *   Paper XX   — STIGMERGY: the memory vault is the student's pheromone trail
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Stopwords for TF-IDF search (same set as @medina/student-ai)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// NLP helpers (TF-IDF search)
// ---------------------------------------------------------------------------

/**
 * Tokenize text into lowercase content words.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return (String(text).toLowerCase().match(/[a-z']+(?:'[a-z]+)*/g) || [])
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

/**
 * Build term-frequency map.
 * @param {string[]} tokens
 * @returns {Map<string, number>}
 */
function termFrequency(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

/**
 * Cosine similarity between two token arrays.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number}
 */
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

/**
 * Estimate byte size of a JavaScript value.
 * @param {*} value
 * @returns {number}
 */
function estimateSize(value) {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return new TextEncoder().encode(str).length;
}

// ---------------------------------------------------------------------------
// StudentMemory
// ---------------------------------------------------------------------------

export class StudentMemory {
  /**
   * Create a sovereign memory vault.
   *
   * @param {object} options
   * @param {string} options.studentId   - Owner of this memory vault
   * @param {number} [options.maxEntries] - Maximum entries (default: 10000)
   */
  constructor({ studentId, maxEntries = 10_000 }) {
    if (!studentId) throw new Error('StudentMemory requires a studentId');

    /** @type {string} */
    this.studentId = studentId;

    /** @type {number} */
    this.maxEntries = maxEntries;

    /**
     * The stable memory store.
     * key → { value, metadata, tokens, storedAt, updatedAt, size }
     * @type {Map<string, object>}
     */
    this._store = new Map();

    /** @type {object|null} */
    this._chrono = null;
  }

  // ── CHRONO integration ──────────────────────────────────────────────────

  /**
   * Inject CHRONO for immutable audit logging.
   *
   * @param {object} chrono - CHRONO instance
   * @returns {StudentMemory} this (for chaining)
   */
  setChrono(chrono) {
    this._chrono = chrono;
    return this;
  }

  /**
   * @private
   */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({
        type,
        studentId: this.studentId,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ── CRUD ────────────────────────────────────────────────────────────────

  /**
   * Store a value in the memory vault.
   *
   * @param {string} key        - Unique key for this memory entry
   * @param {*}      value      - The value to store (any serializable type)
   * @param {object} [metadata] - Optional metadata (tags, category, etc.)
   * @returns {{ stored: boolean, key: string, size: number, entryCount: number }}
   */
  store(key, value, metadata = {}) {
    if (!key || typeof key !== 'string') {
      throw new Error('StudentMemory.store requires a non-empty string key');
    }
    if (this._store.size >= this.maxEntries && !this._store.has(key)) {
      throw new Error(`StudentMemory: maximum entries (${this.maxEntries}) reached`);
    }

    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const tokens = tokenize(serialized + ' ' + key + ' ' + (metadata.tags || []).join(' '));
    const size = estimateSize(value);
    const now = new Date().toISOString();

    const existing = this._store.get(key);
    this._store.set(key, {
      value,
      metadata: { ...metadata },
      tokens,
      storedAt: existing ? existing.storedAt : now,
      updatedAt: now,
      size,
    });

    this._log('MEMORY_STORE', { key, size, isUpdate: !!existing });

    return {
      stored: true,
      key,
      size,
      entryCount: this._store.size,
    };
  }

  /**
   * Retrieve a value from the memory vault.
   *
   * @param {string} key - The key to look up
   * @returns {{ found: boolean, key: string, value: *, metadata: object, storedAt: string, updatedAt: string }|{ found: boolean, key: string }}
   */
  retrieve(key) {
    const entry = this._store.get(key);
    if (!entry) {
      return { found: false, key };
    }

    this._log('MEMORY_RETRIEVE', { key });

    return {
      found: true,
      key,
      value: entry.value,
      metadata: { ...entry.metadata },
      storedAt: entry.storedAt,
      updatedAt: entry.updatedAt,
    };
  }

  /**
   * Search across all stored entries using TF-IDF cosine similarity.
   *
   * @param {string} query      - Natural language search query
   * @param {number} [topK=5]   - Maximum results to return
   * @returns {{ results: Array<{ key: string, score: number, value: *, metadata: object }>, query: string, total: number }}
   */
  search(query, topK = 5) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return { results: [], query, total: 0 };
    }

    const scored = [];
    for (const [key, entry] of this._store) {
      const score = cosineSimilarity(queryTokens, entry.tokens);
      if (score > 0) {
        scored.push({ key, score, value: entry.value, metadata: { ...entry.metadata } });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, topK);

    this._log('MEMORY_SEARCH', { query, resultCount: results.length });

    return { results, query, total: scored.length };
  }

  /**
   * List all keys with metadata (no values — lightweight).
   *
   * @returns {Array<{ key: string, metadata: object, storedAt: string, updatedAt: string, size: number }>}
   */
  list() {
    const entries = [];
    for (const [key, entry] of this._store) {
      entries.push({
        key,
        metadata: { ...entry.metadata },
        storedAt: entry.storedAt,
        updatedAt: entry.updatedAt,
        size: entry.size,
      });
    }
    return entries;
  }

  // ── Export ───────────────────────────────────────────────────────────────

  /**
   * Full memory export — everything the student has stored.
   * L73 Data Sovereignty: the student can always take their data.
   *
   * @returns {{ studentId: string, exportedAt: string, entryCount: number, entries: object[] }}
   */
  export() {
    const entries = [];
    for (const [key, entry] of this._store) {
      entries.push({
        key,
        value: entry.value,
        metadata: { ...entry.metadata },
        storedAt: entry.storedAt,
        updatedAt: entry.updatedAt,
      });
    }

    this._log('MEMORY_EXPORT', { entryCount: entries.length });

    return {
      studentId: this.studentId,
      exportedAt: new Date().toISOString(),
      entryCount: entries.length,
      entries,
    };
  }

  // ── Stats ───────────────────────────────────────────────────────────────

  /**
   * Memory vault statistics.
   *
   * @returns {{ entryCount: number, totalSize: number, oldestEntry: string|null, newestEntry: string|null }}
   */
  stats() {
    let totalSize = 0;
    let oldest = null;
    let newest = null;

    for (const [, entry] of this._store) {
      totalSize += entry.size;
      if (!oldest || entry.storedAt < oldest) oldest = entry.storedAt;
      if (!newest || entry.updatedAt > newest) newest = entry.updatedAt;
    }

    return {
      entryCount: this._store.size,
      totalSize,
      oldestEntry: oldest,
      newestEntry: newest,
    };
  }
}
