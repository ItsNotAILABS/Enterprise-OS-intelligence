/**
 * @medina/analyst-ai — examples/analyze-report.js
 *
 * Example: Turn a board meeting packet into an executive brief,
 * extract action items, compare this quarter vs last quarter.
 *
 * Run: node examples/analyze-report.js
 */

import { AnalystAI } from '../src/index.js';

const ai = new AnalystAI();

// ── Sample Q1 report ────────────────────────────────────────────────────────
const Q1_REPORT = `
QUARTERLY BUSINESS REVIEW — Q1 2026

Revenue came in at $4.2M, up 18% from Q4 2025. Gross margin held at 71%.
Customer acquisition cost dropped to $380, down from $520 last quarter.
Net revenue retention is at 112%, driven by expansion in the enterprise segment.

RISKS AND BLOCKERS
Sales cycle has extended to 67 days on average, up from 48 days in Q4.
Three enterprise deals totaling $1.1M are stalled at legal review.
The engineering team is 2 sprints behind on the API roadmap due to two unexpected departures.
Customer support ticket volume increased 34% without headcount growth.

OPPORTUNITIES
The mid-market segment is showing strong inbound demand — 40 qualified leads this quarter vs 22 in Q4.
A strategic partnership with Denova Systems could unlock $800K in co-sell pipeline.
There is an opportunity to expand the existing Hartwell account from $180K ARR to $350K ARR.

DECISIONS MADE
The leadership team agreed to hire two senior engineers by May 15, 2026.
We approved a $120K budget for the Denova partnership pilot.
Sales leadership will implement a new deal review process by April 30, 2026.
The board confirmed we are proceeding with the Series B preparation timeline.

NEXT STEPS
Marcus will own the Hartwell expansion proposal by April 28.
Legal team to unblock the three stalled deals by May 1.
Engineering to provide revised API timeline by April 30.
CEO to schedule Series B advisor meetings in May.
`;

const Q4_REPORT = `
QUARTERLY BUSINESS REVIEW — Q4 2025

Revenue was $3.56M, up 12% from Q3. Gross margin at 69%.
Customer acquisition cost was $520. Net revenue retention at 108%.

RISKS AND BLOCKERS
Competition in the SMB segment increased with two new entrants.
Sales cycle averaged 48 days. Several deals pushed to Q1.
Engineering velocity slowed in December due to holiday schedule.

OPPORTUNITIES
Enterprise segment demand is growing. Five inbound enterprise leads this quarter.
Potential to expand two existing accounts. International expansion being evaluated.

DECISIONS MADE
Board approved 2026 headcount plan. Sales team to grow from 8 to 12 by Q2 2026.
New pricing model approved for the enterprise tier.

NEXT STEPS
Sales to finalize 2026 territory assignments by January 15.
Product to deliver new enterprise dashboard by February 28.
Finance to complete 2025 audit by March 31.
`;

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  @medina/analyst-ai — Business Report Demo           ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // 1. Executive brief
  console.log('── 1. EXECUTIVE BRIEF (Q1 2026) ───────────────────────\n');
  const brief = ai.brief(Q1_REPORT);
  console.log('SUMMARY:\n', brief.summary, '\n');
  console.log('KEY METRICS:', brief.keyMetrics.join('  '));
  console.log('KEY DATES:  ', brief.keyDates.slice(0, 5).join(', '));

  // 2. Extract action items
  console.log('\n── 2. ACTION ITEMS ────────────────────────────────────\n');
  const actions = ai.extract(Q1_REPORT, 'actions');
  actions.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));

  // 3. Extract risks
  console.log('\n── 3. RISKS ───────────────────────────────────────────\n');
  const risks = ai.extract(Q1_REPORT, 'risks');
  risks.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));

  // 4. Ask a question
  console.log('\n── 4. ASK A QUESTION ──────────────────────────────────\n');
  const q = ai.ask('What is the plan for the Series B?', Q1_REPORT);
  console.log('Q: What is the plan for the Series B?');
  console.log(`A: ${q.answer}`);
  console.log(`   Confidence: ${q.confidence}`);

  // 5. Compare Q4 vs Q1
  console.log('\n── 5. COMPARE Q4 → Q1 ────────────────────────────────\n');
  const diff = ai.compare(Q4_REPORT, Q1_REPORT);
  console.log(`Similarity:    ${diff.similarity}`);
  console.log(`Shared themes: ${diff.sharedThemes.join(', ')}`);
  console.log(`New in Q1:     ${diff.addedInB.join(', ')}`);

  // 6. Trend analysis across both quarters
  console.log('\n── 6. TRENDS (Q4 + Q1) ────────────────────────────────\n');
  const trends = ai.trends([Q4_REPORT, Q1_REPORT]);
  console.log('Recurring themes:', trends.themes.join(', '));

  // 7. Score Q1 report against executive checklist
  console.log('\n── 7. REPORT QUALITY SCORE ────────────────────────────\n');
  const scored = ai.score(Q1_REPORT, [
    'includes revenue figures',
    'mentions risk or blockers',
    'has action items or next steps',
    'includes decisions made',
    'mentions growth opportunities',
    'has timeline or dates',
  ]);
  console.log(`Score: ${scored.score}/100 (${scored.grade})`);
  console.log('Passed:', scored.passed.map(p => `✓ ${p}`).join('\n       '));
  if (scored.failed.length) console.log('Missed:', scored.failed.map(f => `✗ ${f}`).join('\n       '));

  console.log('\n── Done. No data left this machine. ───────────────────\n');
}

run().catch(console.error);
