/**
 * @medina/student-ai — examples/study-session.js
 *
 * Example: Study a passage from a history or science textbook.
 * Get a study guide, quiz questions, flashcards, and a fill-in-the-blank drill.
 *
 * Run: node examples/study-session.js
 */

import { StudentAI } from '../src/index.js';

const ai = new StudentAI();

// ── Sample passage (AP US History style) ───────────────────────────────────
const PASSAGE = `
THE INDUSTRIAL REVOLUTION IN AMERICA — 1820–1870

The Industrial Revolution transformed the United States from a largely agrarian society into
an industrial powerhouse over the course of the nineteenth century. The shift began in New England,
where the first textile mills were established in the 1820s along rivers that provided waterpower.
Lowell, Massachusetts became the model industrial city, employing thousands of young women from
rural farms — the so-called "Lowell Girls" — in large factory complexes.

Steam power replaced waterpower by the 1840s, freeing factories from river locations and enabling
industrial growth across the interior of the continent. The expansion of the railroad network was
central to this transformation. By 1869, the transcontinental railroad connected the Atlantic and
Pacific coasts, enabling the movement of raw materials and finished goods at unprecedented scale.

Industrialization created a new working class. Conditions in early factories were often dangerous —
twelve to fourteen hour days, child labor, and unsafe machinery were common. Workers began to
organize in response, forming early labor unions in the 1830s and 1840s. The first major strikes
occurred in the textile and shoemaking industries, demanding shorter hours and better pay.

The economic consequences were profound. Industrial output in the United States grew by more than
500% between 1820 and 1870. Cities grew rapidly as workers migrated from rural areas. Immigration
from Europe — particularly Ireland and Germany — provided much of the industrial labor force.
Inequality increased as factory owners accumulated substantial wealth while workers earned subsistence wages.
`;

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  @medina/student-ai — Study Session Demo             ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // 1. Study guide
  console.log('── 1. STUDY GUIDE ─────────────────────────────────────\n');
  const guide = ai.study(PASSAGE);
  console.log('SUMMARY:\n', guide.summary, '\n');
  console.log('KEY TOPICS:    ', guide.topics.join(', '));
  console.log('READING TIME:  ', guide.stats.readingTime);
  console.log('HARD WORDS:    ', guide.hardWords.join(', ') || 'None found');

  // 2. Quiz questions
  console.log('\n── 2. QUIZ QUESTIONS ──────────────────────────────────\n');
  const quiz = ai.quiz(PASSAGE, 4);
  quiz.forEach((q, i) => {
    console.log(`Q${i + 1}: ${q.question}`);
    console.log(`   Hint: ${q.hint}\n`);
  });

  // 3. Flashcards
  console.log('── 3. FLASHCARDS ──────────────────────────────────────\n');
  const cards = ai.flashcards(PASSAGE, 5);
  cards.forEach(c => {
    console.log(`FRONT: ${c.front}`);
    console.log(`BACK:  ${c.back}\n`);
  });

  // 4. Ask a question
  console.log('── 4. ASK YOUR NOTES ──────────────────────────────────\n');
  const q = ai.ask('Why did factories move away from rivers?', PASSAGE);
  console.log('Q: Why did factories move away from rivers?');
  console.log(`A: ${q.answer}`);
  console.log(`   ${q.encouragement}\n`);

  // 5. Outline
  console.log('── 5. OUTLINE ─────────────────────────────────────────\n');
  const outline = ai.outline(PASSAGE);
  console.log(outline.title);
  outline.sections.forEach(s => {
    console.log(`\n  ${s.heading}`);
    s.points.slice(0, 2).forEach(p => console.log(`    • ${p.slice(0, 80)}...`));
  });

  // 6. Explain
  console.log('\n── 6. EXPLAIN (simplify dense sentences) ──────────────\n');
  const explanation = ai.explain(PASSAGE);
  console.log('Reading level:', explanation.readingLevel);
  explanation.simplified.slice(0, 2).forEach(s => console.log('\n', s));

  console.log('\n── Done. Go get that A. ───────────────────────────────\n');
}

run().catch(console.error);
