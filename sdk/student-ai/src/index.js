/**
 * @medina/student-ai — src/index.js
 * ──────────────────────────────────────────────────────────────────────────────
 * AI study companion — summarize, quiz, flashcard, outline, explain, Q&A.
 * Pure JavaScript NLP. Zero dependencies. Zero API calls. Works offline.
 *
 * Theory reference:
 *   Paper XIII — DE SUBSTRATO EPISTEMICO (PROT-052)
 *   Epistemic substrate for knowledge architecture: documents embedded
 *   architecturally in a reasoning system reshape how it forms answers.
 *   The StudentAI class treats input text as epistemic substrate — structuring
 *   comprehension through term-frequency scoring, cosine similarity, and
 *   sentence-level importance ranking rather than surface-level keyword matching.
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Dallas, Texas
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ── Stopwords ──────────────────────────────────────────────────────────────────

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

// ── Encouragements ─────────────────────────────────────────────────────────────

const ENCOURAGEMENTS = [
  'Keep going — you\'re building real understanding!',
  'Great question. Curiosity is how you get ahead.',
  'You\'re on the right track. Keep reviewing!',
  'Solid question — that\'s how deep learning happens.',
  'Keep it up — every question makes you sharper.',
];

// ── Text utilities ─────────────────────────────────────────────────────────────

/**
 * Split text into sentences.
 * @param {string} text
 * @returns {string[]}
 */
function splitSentences(text) {
  return text
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
}

/**
 * Tokenize into lowercase words, stripping punctuation.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return text.toLowerCase().match(/[a-z']+(?:'[a-z]+)*/g) || [];
}

/**
 * Content words only (no stopwords, length ≥ 3).
 * @param {string[]} tokens
 * @returns {string[]}
 */
function contentWords(tokens) {
  return tokens.filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

/**
 * Count syllables in a word (Flesch-Kincaid approximation).
 * @param {string} word
 * @returns {number}
 */
function syllables(word) {
  word = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

/**
 * Count total syllables in text.
 * @param {string[]} words
 * @returns {number}
 */
function totalSyllables(words) {
  return words.reduce((n, w) => n + syllables(w), 0);
}

// ── TF-IDF scoring ─────────────────────────────────────────────────────────────

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
 * Compute IDF across sentences.
 * @param {string[][]} sentenceTokens - array of token arrays per sentence
 * @returns {Map<string, number>}
 */
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

/**
 * Score each sentence by TF-IDF sum of its content words.
 * @param {string[]} sentences
 * @returns {{ sentence: string, score: number, tokens: string[] }[]}
 */
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
    // Normalize by sentence length to avoid bias toward long sentences
    if (tokens.length > 0) score /= Math.sqrt(tokens.length);
    return { sentence, score, tokens };
  });
}

// ── Key term extraction ────────────────────────────────────────────────────────

/**
 * Extract key terms ranked by significance.
 * @param {string} text
 * @param {number} [maxTerms=10]
 * @returns {string[]}
 */
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

// ── Cosine similarity ──────────────────────────────────────────────────────────

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

// ── Flesch-Kincaid ─────────────────────────────────────────────────────────────

/**
 * Compute Flesch-Kincaid reading grade level.
 * @param {number} words
 * @param {number} sentences
 * @param {number} syllableCount
 * @returns {number}
 */
function fleschKincaidGrade(words, sentences, syllableCount) {
  if (sentences === 0 || words === 0) return 0;
  return (
    0.39 * (words / sentences) +
    11.8 * (syllableCount / words) -
    15.59
  );
}

/**
 * Map grade level to a human-readable label.
 * @param {number} grade
 * @returns {string}
 */
function readingLevelLabel(grade) {
  if (grade <= 5) return 'Elementary (Grade 5 or below)';
  if (grade <= 8) return 'Middle School (Grades 6–8)';
  if (grade <= 12) return 'High School (Grades 9–12)';
  if (grade <= 16) return 'College (Grades 13–16)';
  return 'Graduate / Professional';
}

// ── StudentAI class ────────────────────────────────────────────────────────────

/**
 * AI study companion — pure-JS NLP, zero dependencies.
 *
 * @example
 *   const ai = new StudentAI();
 *   const guide = ai.study(text);
 *   const quiz  = ai.quiz(text, 5);
 */
export class StudentAI {

  // ── study ──────────────────────────────────────────────────────────────────

  /**
   * Generate a study guide from text.
   * @param {string} text
   * @returns {{ summary: string, keyPoints: string[], topics: string[], hardWords: string[], sections: string[], stats: object }}
   */
  study(text) {
    const sentences = splitSentences(text);
    const scored = scoreSentences(sentences);
    const sorted = [...scored].sort((a, b) => b.score - a.score);

    // Summary: top sentences in original order
    const topCount = Math.max(3, Math.ceil(sentences.length * 0.25));
    const topSet = new Set(sorted.slice(0, topCount).map(s => s.sentence));
    const summary = sentences.filter(s => topSet.has(s)).join(' ');

    // Key points: the top-scoring sentences
    const keyPoints = sorted.slice(0, Math.min(5, sorted.length)).map(s => s.sentence);

    // Topics: key terms
    const topics = extractKeyTerms(text, 8);

    // Hard words: long or multi-syllable words
    const allTokens = tokenize(text);
    const hardWords = [...new Set(
      allTokens.filter(w => w.length >= 8 && syllables(w) >= 3)
    )].slice(0, 10);

    // Sections: detect paragraph-level breaks
    const sections = text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 20)
      .map(p => {
        const s = splitSentences(p);
        return s[0] || p.slice(0, 80);
      });

    const stats = this.stats(text);

    return { summary, keyPoints, topics, hardWords, sections, stats };
  }

  // ── quiz ───────────────────────────────────────────────────────────────────

  /**
   * Generate quiz questions from text.
   * @param {string} text
   * @param {number} [count=5]
   * @returns {{ question: string, hint: string, answer: string }[]}
   */
  quiz(text, count = 5) {
    const sentences = splitSentences(text);
    const scored = scoreSentences(sentences);
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    const keyTerms = extractKeyTerms(text, 20);

    const questions = [];
    const used = new Set();

    for (const entry of sorted) {
      if (questions.length >= count) break;
      if (used.has(entry.sentence)) continue;

      // Find a key term in this sentence to blank out
      const sentenceTokens = tokenize(entry.sentence);
      const target = keyTerms.find(
        t => sentenceTokens.includes(t) && t.length >= 4
      );

      if (!target) continue;
      used.add(entry.sentence);

      // Build fill-in-the-blank question
      const blanked = entry.sentence.replace(
        new RegExp(`\\b${target}\\b`, 'gi'),
        '________'
      );

      // Hint: first letter + length
      const hint = `Starts with "${target[0].toUpperCase()}", ${target.length} letters`;

      questions.push({
        question: blanked,
        hint,
        answer: target,
      });
    }

    // If we couldn't find enough key-term sentences, fall back to comprehension Qs
    if (questions.length < count) {
      for (const entry of sorted) {
        if (questions.length >= count) break;
        if (used.has(entry.sentence)) continue;
        used.add(entry.sentence);

        questions.push({
          question: `What does the following mean? "${entry.sentence}"`,
          hint: 'Re-read the passage carefully.',
          answer: entry.sentence,
        });
      }
    }

    return questions.slice(0, count);
  }

  // ── flashcards ─────────────────────────────────────────────────────────────

  /**
   * Generate flashcards pairing key terms with explanatory sentences.
   * @param {string} text
   * @param {number} [count=5]
   * @returns {{ front: string, back: string }[]}
   */
  flashcards(text, count = 5) {
    const sentences = splitSentences(text);
    const keyTerms = extractKeyTerms(text, count * 2);
    const cards = [];
    const usedSentences = new Set();

    for (const term of keyTerms) {
      if (cards.length >= count) break;

      // Find best sentence explaining this term
      let best = null;
      let bestScore = -1;

      for (const s of sentences) {
        if (usedSentences.has(s)) continue;
        const lower = s.toLowerCase();
        if (!lower.includes(term)) continue;

        // Prefer sentences that contain more context
        const score = contentWords(tokenize(s)).length;
        if (score > bestScore) {
          bestScore = score;
          best = s;
        }
      }

      if (best) {
        usedSentences.add(best);
        cards.push({
          front: `What is "${term}"?`,
          back: best,
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
        const concept = terms[0] || 'this concept';
        cards.push({
          front: `Explain: ${concept}`,
          back: entry.sentence,
        });
      }
    }

    return cards.slice(0, count);
  }

  // ── ask ────────────────────────────────────────────────────────────────────

  /**
   * Answer a question using cosine similarity against note sentences.
   * @param {string} question
   * @param {string} notes
   * @returns {{ answer: string, confidence: number, found: boolean, encouragement: string }}
   */
  ask(question, notes) {
    const qTokens = contentWords(tokenize(question));
    const sentences = splitSentences(notes);

    if (sentences.length === 0 || qTokens.length === 0) {
      return {
        answer: 'I couldn\'t find enough information in your notes to answer that.',
        confidence: 0,
        found: false,
        encouragement: ENCOURAGEMENTS[0],
      };
    }

    // Score each sentence by cosine similarity to the question
    let bestScore = -1;
    let bestSentence = sentences[0];
    const results = [];

    for (const s of sentences) {
      const sTokens = contentWords(tokenize(s));
      const sim = cosineSimilarity(qTokens, sTokens);
      results.push({ sentence: s, score: sim });
      if (sim > bestScore) {
        bestScore = sim;
        bestSentence = s;
      }
    }

    // Gather top matches for a composite answer
    results.sort((a, b) => b.score - a.score);
    const topMatches = results
      .filter(r => r.score > 0.05)
      .slice(0, 2);

    const answer = topMatches.length > 0
      ? topMatches.map(r => r.sentence).join(' ')
      : bestSentence;

    const confidence = Math.min(Math.round(bestScore * 100), 100);
    const found = bestScore > 0.1;
    const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];

    return { answer, confidence, found, encouragement };
  }

  // ── outline ────────────────────────────────────────────────────────────────

  /**
   * Generate a structured outline from text.
   * @param {string} text
   * @returns {{ title: string, sections: { heading: string, points: string[] }[] }}
   */
  outline(text) {
    const paragraphs = text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 10);

    // Try to extract a title from the first line
    const firstLine = text.trim().split('\n')[0].trim();
    const title = firstLine.length > 0 && firstLine.length < 120
      ? firstLine.replace(/^#+\s*/, '')
      : 'Untitled Document';

    const sections = [];

    for (const para of paragraphs) {
      const sentences = splitSentences(para);
      if (sentences.length === 0) continue;

      // Heading: derive from first sentence or key terms
      const paraTerms = extractKeyTerms(para, 3);
      const heading = paraTerms.length > 0
        ? paraTerms.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
        : sentences[0].slice(0, 60);

      // Points: all sentences as bullet points
      const points = sentences.map(s => s.trim());

      sections.push({ heading, points });
    }

    // Merge very short sections into neighbors
    if (sections.length === 0) {
      sections.push({
        heading: 'Main Content',
        points: splitSentences(text),
      });
    }

    return { title, sections };
  }

  // ── explain ────────────────────────────────────────────────────────────────

  /**
   * Simplify dense sentences and report reading level.
   * @param {string} text
   * @returns {{ simplified: string[], original: string[], readingLevel: string }}
   */
  explain(text) {
    const sentences = splitSentences(text);
    const allWords = tokenize(text);
    const syllableCount = totalSyllables(allWords);
    const grade = fleschKincaidGrade(allWords.length, sentences.length, syllableCount);

    // Find sentences with high complexity (long words, many syllables)
    const complex = sentences
      .map(s => {
        const words = tokenize(s);
        const avgSyl = words.length > 0 ? totalSyllables(words) / words.length : 0;
        const avgLen = words.length > 0 ? words.reduce((n, w) => n + w.length, 0) / words.length : 0;
        return { sentence: s, difficulty: avgSyl * 2 + avgLen, words };
      })
      .sort((a, b) => b.difficulty - a.difficulty);

    // Simplify top complex sentences
    const simplified = complex.slice(0, Math.min(5, complex.length)).map(c => {
      return simplify(c.sentence);
    });

    const original = complex.slice(0, Math.min(5, complex.length)).map(c => c.sentence);

    return {
      simplified,
      original,
      readingLevel: readingLevelLabel(grade),
    };
  }

  // ── stats ──────────────────────────────────────────────────────────────────

  /**
   * Compute text statistics.
   * @param {string} text
   * @returns {{ words: number, sentences: number, readingTime: string, avgWordsPerSentence: number }}
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

    return { words: wordCount, sentences: sentenceCount, readingTime, avgWordsPerSentence };
  }
}

// ── Simplification helper ──────────────────────────────────────────────────────

/**
 * Produce a simpler version of a sentence by shortening, removing parentheticals,
 * and breaking long clauses.
 * @param {string} sentence
 * @returns {string}
 */
function simplify(sentence) {
  let s = sentence;

  // Remove parenthetical asides
  s = s.replace(/\s*—\s*[^—]*?\s*—\s*/g, ' ');
  s = s.replace(/\s*\([^)]*\)\s*/g, ' ');

  // Break at semicolons — keep only the first clause
  if (s.includes(';')) {
    s = s.split(';')[0].trim();
    if (!s.endsWith('.')) s += '.';
  }

  // If still long, take first main clause before a comma-conjunction
  if (s.length > 120) {
    const conjMatch = s.match(/^(.{40,}?),\s*(?:and|but|which|where|while|enabling|freeing)\s/i);
    if (conjMatch) {
      s = conjMatch[1].trim();
      if (!s.endsWith('.')) s += '.';
    }
  }

  // Clean up whitespace
  s = s.replace(/\s{2,}/g, ' ').trim();

  return s;
}
