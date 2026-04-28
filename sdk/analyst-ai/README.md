# @medina/analyst-ai — v0.1.0-alpha

**AI analyst for business professionals.**

Turn long reports, meeting notes, emails, and presentations into executive briefs, action items, risk flags, and trend insights — all embedded, no API key, no data leaves your machine.

**Creator:** Alfredo Medina Hernandez · Medina Tech · Dallas, Texas

---

## Install

```bash
npm install @medina/analyst-ai
```

## Quick Start

```js
import { AnalystAI } from '@medina/analyst-ai';

const ai = new AnalystAI();

// Generate an executive brief from any document
const brief = ai.brief(reportText);
console.log(brief.summary);        // Key points summary
console.log(brief.actions);        // Action items extracted
console.log(brief.risks);          // Risk/blocker mentions
console.log(brief.keyMetrics);     // All numbers and figures

// Extract specific information
const actionItems = ai.extract(reportText, 'actions');
const risks       = ai.extract(reportText, 'risks');
const numbers     = ai.extract(reportText, 'numbers');

// Ask a question about a document
const answer = ai.ask('What is the plan for Q3?', reportText);
console.log(answer.answer);        // Most relevant passage
console.log(answer.confidence);    // 0.0–1.0

// Find recurring themes across multiple reports
const { themes } = ai.trends([q1Report, q2Report, q3Report]);
console.log(themes);               // Words that keep appearing

// Compare two report versions
const diff = ai.compare(lastMonth, thisMonth);
console.log(diff.similarity);      // e.g. "60%"
console.log(diff.addedInB);        // New topics this month

// Score a document against criteria
const score = ai.score(proposal, [
  'includes budget',
  'mentions timeline',
  'has risk section',
  'defines success metrics',
]);
console.log(score.score);          // 0–100
console.log(score.grade);          // "Strong" / "Adequate" / "Needs work"
```

---

## API

### `ai.brief(text, options?)` → `BriefResult`
Executive brief. Returns `summary`, `keyMetrics`, `keyDates`, `decisions`, `actions`, `risks`, `opportunities`, `topKeywords`, and `stats`.

Options: `{ summaryLength: 4 }` — number of summary sentences.

### `ai.extract(text, type)` → `string[]`
Extract a specific type of information. Types:

| Type | What it finds |
|---|---|
| `actions` | Action items and next steps |
| `decisions` | Decisions that were made |
| `risks` | Risks, blockers, concerns |
| `numbers` | All numeric values and metrics |
| `dates` | Dates and deadlines |
| `sections` | Document section headings |
| `keywords` | Top subject matter keywords |
| `opportunities` | Growth opportunities |

### `ai.ask(question, context)` → `{ answer, confidence, found }`
Plain-language Q&A over any document.

### `ai.trends(texts[])` → `{ themes, frequency }`
Pass an array of documents. Returns keywords that appear consistently across all of them — great for finding what keeps coming up in weekly reports.

### `ai.compare(docA, docB)` → `{ similarity, sharedThemes, addedInB, removedFromA }`
Compare two documents for similarity and topic shift.

### `ai.score(text, criteria[])` → `{ score, grade, passed, failed }`
Grade a document against a checklist. Each criterion is a plain-language phrase.

### `ai.summarize(text, length?)` → `{ summary, topKeywords, stats }`
Clean summary. `length` = number of sentences (default: 3).

---

## Example

```bash
node examples/analyze-report.js
```

---

## How It Works

Sentence scoring ranks passages by how often their terms appear across the whole document — the sentences that use the most important vocabulary of the text rise to the top. Pattern matching extracts action items, decisions, risks, and opportunities. Cosine similarity powers document comparison and Q&A. All embedded, zero external calls.

---

*Medina Tech · Chaos Lab · Dallas, Texas · medinasitech@outlook.com*
*Part of the MERIDIAN Sovereign OS ecosystem · github.com/FreddyCreates/Enterprise-OS-intelligence*
