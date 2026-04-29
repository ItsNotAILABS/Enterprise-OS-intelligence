# @medina/paralegal-ai — v0.1.0-alpha

**AI paralegal for legal professionals.**

Analyze contracts, flag risk clauses, get plain-language answers, draft standard redlines, and compare document versions — all embedded in your application. No API key. No subscription. No data ever leaves your machine.

**Creator:** Alfredo Medina Hernandez · Medina Tech · Dallas, Texas

---

## Install

```bash
npm install @medina/paralegal-ai
```

## Quick Start

```js
import { ParalegalAI } from '@medina/paralegal-ai';

const ai = new ParalegalAI();

// Analyze a contract for risk
const report = ai.analyze(contractText);
console.log(report.riskScore);     // 0–100 (lower is better)
console.log(report.critical);      // Critical issues with recommendations
console.log(report.summary);       // Plain-language risk summary

// Ask a plain-language question
const answer = ai.ask('What happens if we miss a payment?', contractText);
console.log(answer.answer);        // The most relevant passage
console.log(answer.confidence);    // 0.0–1.0

// Draft a redline
const draft = ai.draft('ip-carveout');
console.log(draft.text);           // Ready-to-send clause language
console.log(draft.notes);          // Acceptance rate and notes

// Compare two contract versions
const diff = ai.compare(v1, v2);
console.log(diff.similarity);      // e.g. "70%"
console.log(diff.addedInB);        // New themes in version 2
```

---

## API

### `ai.analyze(text)` → `AnalysisResult`
Full risk report. Returns `riskScore` (0–100), `critical`, `high`, `moderate`, `low` issue arrays with recommendations, `keyDates`, `topKeywords`, and a plain-language `summary`.

### `ai.risks(text)` → `{ issues, score, riskLevel }`
Quick risk scan. Returns all issues as a flat list.

### `ai.ask(question, context)` → `{ answer, confidence, found, tip }`
Plain-language Q&A. Pass the question and the document text — returns the most relevant passage with a confidence score.

### `ai.summarize(text, length?)` → `{ summary, keyTerms, keyDates, stats }`
Key passages and terms. `length` controls number of sentences (default: 4).

### `ai.draft(type)` → `{ title, section, text, notes }`
Ready-to-use redline clause. Available types:

| Key | Clause |
|---|---|
| `liability-cap` | Mutual liability cap at 2× contract value |
| `consequential-waiver` | Mutual waiver of consequential damages |
| `ip-carveout` | Pre-existing IP carve-out |
| `late-payment` | 1.5%/month late payment interest |
| `mutual-termination` | Mutual termination for convenience |
| `arbitration` | Binding arbitration in your jurisdiction |
| `confidentiality-definition` | Narrowed confidentiality definition |

### `ai.availableDrafts()` → `Array`
List all available draft types with their keys.

### `ai.compare(docA, docB)` → `{ similarity, sharedThemes, uniqueToA, uniqueToB }`
Compare two documents. Returns similarity percentage and what changed.

### `ai.timeline(text)` → `string[]`
Extract all dates and deadlines from a document.

---

## Risk Categories Detected

- **Liability**: Unlimited liability, consequential damages exposure
- **Intellectual Property**: Broad IP assignment, work-for-hire classification
- **Payment**: Extended terms (60+ days), missing late fee provisions
- **Termination**: Convenience termination, short cure periods
- **Governing Law**: Out-of-state jurisdiction
- **Confidentiality**: Overly broad confidentiality scope
- **Contract Terms**: Auto-renewal traps

---

## Example

```bash
node examples/review-contract.js
```

---

## How It Works

Everything runs locally on your machine. The risk detection uses a pattern library built from real legal risk categories. The Q&A uses sentence scoring and similarity matching to find the most relevant passage for any question. No model API, no cloud, no subscription — the intelligence is embedded in the library.

---

*Medina Tech · Chaos Lab · Dallas, Texas · medinasitech@outlook.com*
*Part of the MERIDIAN Sovereign OS ecosystem · github.com/FreddyCreates/Enterprise-OS-intelligence*
