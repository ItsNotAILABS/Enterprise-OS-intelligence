/**
 * DOCUMENT ABSORPTION ENGINE
 * RSHIP-2026-DOC-ABSORB-001
 *
 * Document Absorption Engine provides intelligent document processing
 * and knowledge extraction for AGI systems. Implements multi-format
 * parsing, semantic extraction, and φ-weighted relevance scoring.
 *
 * @module document-absorption-engine
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

const DocumentType = {
  TEXT: 'text',
  MARKDOWN: 'markdown',
  JSON: 'json',
  CODE: 'code',
  STRUCTURED: 'structured'
};

const ChunkStrategy = {
  FIXED: 'fixed',
  SEMANTIC: 'semantic',
  PARAGRAPH: 'paragraph',
  SENTENCE: 'sentence'
};

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════

class Document {
  constructor(content, options = {}) {
    this.id = options.id || crypto.randomUUID();
    this.content = content;
    this.type = options.type || this._detectType(content);
    this.metadata = options.metadata || {};
    this.chunks = [];
    this.entities = [];
    this.keywords = [];
    this.summary = null;
    this.embedding = null;
    this.created = Date.now();
    this.processed = false;
  }

  _detectType(content) {
    if (typeof content !== 'string') return DocumentType.STRUCTURED;

    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      try {
        JSON.parse(content);
        return DocumentType.JSON;
      } catch (e) {
        // Not JSON
      }
    }

    if (content.includes('```') || /^#+\s/.test(content)) {
      return DocumentType.MARKDOWN;
    }

    if (/^(const|let|var|function|class|import|export)\s/.test(content)) {
      return DocumentType.CODE;
    }

    return DocumentType.TEXT;
  }

  wordCount() {
    return this.content.split(/\s+/).filter(w => w.length > 0).length;
  }

  hash() {
    return crypto.createHash('sha256').update(this.content).digest('hex');
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      metadata: this.metadata,
      wordCount: this.wordCount(),
      chunkCount: this.chunks.length,
      entityCount: this.entities.length,
      keywordCount: this.keywords.length,
      hasSummary: this.summary !== null,
      hasEmbedding: this.embedding !== null,
      processed: this.processed
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHUNKER
// ═══════════════════════════════════════════════════════════════════════════

class DocumentChunker {
  constructor(options = {}) {
    this.strategy = options.strategy || ChunkStrategy.SEMANTIC;
    this.chunkSize = options.chunkSize || 500;
    this.overlap = options.overlap || 50;
  }

  chunk(document) {
    switch (this.strategy) {
      case ChunkStrategy.FIXED:
        return this._fixedChunk(document.content);
      case ChunkStrategy.PARAGRAPH:
        return this._paragraphChunk(document.content);
      case ChunkStrategy.SENTENCE:
        return this._sentenceChunk(document.content);
      case ChunkStrategy.SEMANTIC:
      default:
        return this._semanticChunk(document.content);
    }
  }

  _fixedChunk(content) {
    const chunks = [];
    let start = 0;

    while (start < content.length) {
      const end = Math.min(start + this.chunkSize, content.length);
      chunks.push({
        text: content.slice(start, end),
        start,
        end,
        index: chunks.length
      });
      start = end - this.overlap;
    }

    return chunks;
  }

  _paragraphChunk(content) {
    const paragraphs = content.split(/\n\n+/);
    return paragraphs.map((text, index) => ({
      text: text.trim(),
      index,
      type: 'paragraph'
    })).filter(c => c.text.length > 0);
  }

  _sentenceChunk(content) {
    const sentences = content.split(/(?<=[.!?])\s+/);
    return sentences.map((text, index) => ({
      text: text.trim(),
      index,
      type: 'sentence'
    })).filter(c => c.text.length > 0);
  }

  _semanticChunk(content) {
    // Hybrid approach: respect paragraph boundaries but limit size
    const paragraphs = content.split(/\n\n+/);
    const chunks = [];

    for (const para of paragraphs) {
      if (para.length <= this.chunkSize) {
        if (para.trim().length > 0) {
          chunks.push({
            text: para.trim(),
            index: chunks.length,
            type: 'semantic'
          });
        }
      } else {
        // Split large paragraphs at sentence boundaries
        const sentences = para.split(/(?<=[.!?])\s+/);
        let current = '';

        for (const sentence of sentences) {
          if ((current + sentence).length > this.chunkSize && current.length > 0) {
            chunks.push({
              text: current.trim(),
              index: chunks.length,
              type: 'semantic'
            });
            current = sentence;
          } else {
            current += (current.length > 0 ? ' ' : '') + sentence;
          }
        }

        if (current.trim().length > 0) {
          chunks.push({
            text: current.trim(),
            index: chunks.length,
            type: 'semantic'
          });
        }
      }
    }

    return chunks;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════

class EntityExtractor {
  constructor() {
    this.patterns = new Map();
    this._registerDefaultPatterns();
  }

  _registerDefaultPatterns() {
    // RSHIP entities
    this.patterns.set('rship_id', /RSHIP-\d{4}-[A-Z]+-\d{3}/g);

    // Technical terms
    this.patterns.set('protocol', /PROTO-\d{3}/g);

    // Numbers and measurements
    this.patterns.set('number', /\b\d+(\.\d+)?\b/g);
    this.patterns.set('percentage', /\b\d+(\.\d+)?%/g);

    // φ references
    this.patterns.set('phi', /φ[⁰¹²³⁴⁵⁶⁷⁸⁹\-]*/g);

    // URLs
    this.patterns.set('url', /https?:\/\/[^\s]+/g);

    // Email
    this.patterns.set('email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
  }

  registerPattern(name, pattern) {
    this.patterns.set(name, pattern);
  }

  extract(content) {
    const entities = [];

    for (const [type, pattern] of this.patterns) {
      const matches = content.match(pattern) || [];
      for (const match of matches) {
        entities.push({
          type,
          value: match,
          positions: this._findPositions(content, match)
        });
      }
    }

    return entities;
  }

  _findPositions(content, match) {
    const positions = [];
    let pos = 0;

    while ((pos = content.indexOf(match, pos)) !== -1) {
      positions.push(pos);
      pos += match.length;
    }

    return positions;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// KEYWORD EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════

class KeywordExtractor {
  constructor(options = {}) {
    this.minFrequency = options.minFrequency || 2;
    this.maxKeywords = options.maxKeywords || 20;
    this.stopwords = new Set(options.stopwords || [
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall',
      'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
      'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then', 'once',
      'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either',
      'neither', 'not', 'only', 'own', 'same', 'than', 'too',
      'very', 'just', 'also', 'now', 'this', 'that', 'these',
      'those', 'it', 'its'
    ]);
  }

  extract(content) {
    // Tokenize
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.stopwords.has(w));

    // Count frequencies
    const freq = new Map();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    // Sort by frequency with φ-weighted scoring
    const keywords = Array.from(freq.entries())
      .filter(([, count]) => count >= this.minFrequency)
      .map(([word, count]) => ({
        word,
        frequency: count,
        score: count * Math.pow(PHI, -Math.log(word.length))
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxKeywords);

    return keywords;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════

class DocumentProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.chunker = new DocumentChunker(options.chunker);
    this.entityExtractor = new EntityExtractor();
    this.keywordExtractor = new KeywordExtractor(options.keywords);
  }

  async process(document) {
    if (!(document instanceof Document)) {
      document = new Document(document);
    }

    // Chunk
    document.chunks = this.chunker.chunk(document);
    this.emit('chunked', { id: document.id, chunkCount: document.chunks.length });

    // Extract entities
    document.entities = this.entityExtractor.extract(document.content);
    this.emit('entities-extracted', { id: document.id, entityCount: document.entities.length });

    // Extract keywords
    document.keywords = this.keywordExtractor.extract(document.content);
    this.emit('keywords-extracted', { id: document.id, keywordCount: document.keywords.length });

    // Generate summary (simple extractive)
    document.summary = this._generateSummary(document);

    document.processed = true;
    this.emit('processed', { id: document.id });

    return document;
  }

  _generateSummary(document, maxSentences = 3) {
    const sentences = document.content
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.length > 20);

    if (sentences.length === 0) return document.content.slice(0, 200);

    // Score sentences by keyword density
    const keywordSet = new Set(document.keywords.map(k => k.word));

    const scored = sentences.map(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      const keywordCount = words.filter(w => keywordSet.has(w)).length;
      return {
        sentence,
        score: keywordCount / words.length
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .map(s => s.sentence)
      .join(' ');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT STORE
// ═══════════════════════════════════════════════════════════════════════════

class DocumentStore extends EventEmitter {
  constructor() {
    super();
    this.documents = new Map();
    this.processor = new DocumentProcessor();
  }

  async ingest(content, metadata = {}) {
    const document = new Document(content, { metadata });
    await this.processor.process(document);

    this.documents.set(document.id, document);
    this.emit('ingested', { id: document.id });

    return document;
  }

  get(id) {
    return this.documents.get(id) || null;
  }

  search(query, limit = 10) {
    const queryWords = new Set(
      query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    );

    const results = [];

    for (const [, doc] of this.documents) {
      let score = 0;

      // Keyword match
      for (const kw of doc.keywords) {
        if (queryWords.has(kw.word)) {
          score += kw.score;
        }
      }

      // Entity match
      for (const entity of doc.entities) {
        if (query.includes(entity.value)) {
          score += PHI;
        }
      }

      if (score > 0) {
        results.push({ document: doc, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  status() {
    return {
      documentCount: this.documents.size,
      totalChunks: Array.from(this.documents.values())
        .reduce((sum, d) => sum + d.chunks.length, 0),
      totalEntities: Array.from(this.documents.values())
        .reduce((sum, d) => sum + d.entities.length, 0)
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  DocumentType,
  ChunkStrategy,
  Document,
  DocumentChunker,
  EntityExtractor,
  KeywordExtractor,
  DocumentProcessor,
  DocumentStore
};
