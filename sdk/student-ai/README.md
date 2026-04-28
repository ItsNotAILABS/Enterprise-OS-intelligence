# @medina/student-ai — v0.1.0-alpha

**AI study companion for students.**

Summarize chapters, generate quiz questions, make flashcards, get plain-language explanations, and ask questions about your notes — all embedded, no subscription, works offline.

**Creator:** Alfredo Medina Hernandez · Medina Tech · Dallas, Texas

---

## Install

```bash
npm install @medina/student-ai
```

## Quick Start

```js
import { StudentAI } from '@medina/student-ai';

const ai = new StudentAI();

// Study a chapter or article
const guide = ai.study(chapterText);
console.log(guide.summary);        // Key points
console.log(guide.topics);         // What this is about
console.log(guide.hardWords);      // Words to look up
console.log(guide.stats.readingTime); // How long to read

// Generate quiz questions
const quiz = ai.quiz(chapterText, 5);
quiz.forEach(q => {
  console.log(q.question);         // The question
  console.log(q.hint);             // A hint to find the answer
  console.log(q.answer);           // The answer (check yourself)
});

// Make flashcards
const cards = ai.flashcards(chapterText, 8);
cards.forEach(c => {
  console.log(c.front);            // Term/concept
  console.log(c.back);             // Definition/explanation
});

// Ask a question about your notes
const answer = ai.ask('What caused the Civil War?', myNotes);
console.log(answer.answer);        // Most relevant passage
console.log(answer.encouragement); // Study tip

// Build an outline
const outline = ai.outline(chapterText);
outline.sections.forEach(s => {
  console.log(s.heading);          // Section title
  console.log(s.points);           // Key points in this section
});

// Explain a dense passage in simpler terms
const explanation = ai.explain(denseText);
console.log(explanation.simplified); // Simplified restatements
console.log(explanation.readingLevel); // How hard is this to read
```

---

## API

### `ai.study(text, options?)` → `StudyGuide`
Study guide from any reading. Returns `summary`, `keyPoints`, `topics`, `hardWords`, `sections`, and `stats`.

Options: `{ keyPoints: 4 }` — number of key points to extract.

### `ai.quiz(text, count?)` → `Array<{ question, hint, answer }>`
Generate quiz questions. `count` = how many questions (default: 5).

### `ai.flashcards(text, count?)` → `Array<{ front, back }>`
Flashcards for every key term. `count` = how many cards (default: 8).

### `ai.ask(question, notes)` → `{ answer, confidence, found, encouragement }`
Ask a question and get the most relevant passage from your notes, with a study tip.

### `ai.outline(text)` → `{ title, sections: Array<{ heading, points }> }`
Hierarchical outline — great for essay prep.

### `ai.explain(text)` → `{ simplified, original, readingLevel }`
Simplified restatement of complex sentences. Reading level assessment.

### `ai.stats(text)` → `{ words, sentences, readingTime, avgWordsPerSentence }`
Word count, sentence count, estimated reading time.

---

## Example

```bash
node examples/study-session.js
```

---

## How It Works

Sentence scoring surfaces the passages that carry the most information-dense vocabulary in the text. Quiz generation finds the most important sentences and converts them into questions. Flashcards pair key terms with the sentences that best explain them. Q&A uses similarity matching to find the passage most relevant to your question. Everything runs locally — no account, no internet, no subscription.

---

*Medina Tech · Chaos Lab · Dallas, Texas · medinasitech@outlook.com*
*Part of the MERIDIAN Sovereign OS ecosystem · github.com/FreddyCreates/Enterprise-OS-intelligence*
