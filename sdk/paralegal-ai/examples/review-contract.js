/**
 * @medina/paralegal-ai — examples/review-contract.js
 *
 * Example: Review a contract, get risks, draft a redline, compare two versions.
 *
 * Run: node examples/review-contract.js
 */

import { ParalegalAI } from '../src/index.js';

const ai = new ParalegalAI();

// ── Sample contract text (abbreviated for demo) ────────────────────────────
const CONTRACT = `
MASTER SERVICES AGREEMENT

This Agreement is entered into between Hartwell Industrial LLC ("Client") and Meridian Legal Group ("Firm").

1. SERVICES
Firm shall provide legal consulting services as described in each Statement of Work.

2. PAYMENT TERMS
Client shall pay all invoices within sixty (60) days of receipt. No interest or late fees apply.

3. INTELLECTUAL PROPERTY
All works, inventions, deliverables, tools, frameworks, and materials created by Firm in the scope
of Services are hereby assigned to Client in perpetuity without additional compensation.

4. LIABILITY
Neither party limits its liability under this Agreement. Client shall indemnify and hold harmless
Firm for any and all damages, including consequential and indirect damages, arising from Client's use
of the deliverables, without any limitation whatsoever.

5. TERM AND TERMINATION
This Agreement commences on January 15, 2026 and continues for one year. Client may terminate
this Agreement for convenience at any time without notice or cause. Auto-renewal occurs unless
Client provides 7 days written notice before the renewal date of December 31, 2026.

6. GOVERNING LAW
This Agreement shall be governed by the laws of Delaware. All disputes shall be resolved
in the courts of the State of Delaware.

7. CONFIDENTIALITY
All information, data, materials, and communications exchanged between the parties shall be
deemed confidential and proprietary, regardless of form or medium of disclosure.
`;

const CONTRACT_V2 = `
MASTER SERVICES AGREEMENT — REVISED

This Agreement is entered into between Hartwell Industrial LLC ("Client") and Meridian Legal Group ("Firm").

1. SERVICES
Firm shall provide legal consulting services as described in each Statement of Work.

2. PAYMENT TERMS
Client shall pay all invoices within thirty (30) days of receipt. Invoices unpaid after
the due date accrue interest at 1.5% per month.

3. INTELLECTUAL PROPERTY
Deliverables specifically created for Client under this Agreement are assigned to Client.
Pre-existing tools, frameworks, and general-purpose materials remain Firm's property.

4. LIABILITY
Each party's total liability is capped at fees paid in the preceding twelve months.
Neither party is liable for consequential or indirect damages, except for breach of
confidentiality or intellectual property infringement.

5. TERM AND TERMINATION
Either party may terminate for convenience with thirty (30) days written notice.

6. GOVERNING LAW
This Agreement shall be governed by the laws of Texas with binding arbitration in Dallas.

7. CONFIDENTIALITY
"Confidential Information" means information designated in writing as confidential or
that a reasonable person would understand to be confidential given the circumstances.
`;

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  @medina/paralegal-ai — Contract Review Demo         ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // 1. Full risk analysis
  console.log('── 1. ANALYZE CONTRACT ────────────────────────────────\n');
  const analysis = ai.analyze(CONTRACT);
  console.log(`Risk Score:   ${analysis.riskScore}/100 (${analysis.riskLevel})`);
  console.log(`Total Issues: ${analysis.totalIssues}`);
  console.log(`Summary:      ${analysis.summary}\n`);

  if (analysis.critical.length) {
    console.log('CRITICAL ISSUES:');
    analysis.critical.forEach(r => {
      console.log(`  [${r.category}] ${r.label}`);
      console.log(`    → ${r.recommendation}\n`);
    });
  }

  if (analysis.moderate.length) {
    console.log('MODERATE ISSUES:');
    analysis.moderate.forEach(r => console.log(`  [${r.category}] ${r.label}`));
  }

  console.log('\nKey Dates Found:', analysis.keyDates.join(', ') || 'None');
  console.log('Top Keywords:  ', analysis.topKeywords.join(', '));

  // 2. Ask a question
  console.log('\n── 2. ASK A QUESTION ──────────────────────────────────\n');
  const q = ai.ask('What happens if the client terminates the contract early?', CONTRACT);
  console.log('Q: What happens if the client terminates early?');
  console.log(`A: ${q.answer}`);
  console.log(`   Confidence: ${q.confidence} — ${q.tip}`);

  // 3. Draft a redline
  console.log('\n── 3. DRAFT REDLINE ───────────────────────────────────\n');
  const redline = ai.draft('ip-carveout');
  console.log(`Draft: ${redline.title} (${redline.section})`);
  console.log(`Text:\n${redline.text}`);
  console.log(`\nNotes: ${redline.notes}`);

  // 4. Compare original vs revised
  console.log('\n── 4. COMPARE VERSIONS ────────────────────────────────\n');
  const diff = ai.compare(CONTRACT, CONTRACT_V2);
  console.log(`Similarity:    ${diff.similarity}`);
  console.log(`Shared Themes: ${diff.sharedThemes.join(', ')}`);
  console.log(`Changed in V2: ${diff.uniqueToB.join(', ')}`);

  // 5. List available drafts
  console.log('\n── 5. AVAILABLE REDLINE DRAFTS ────────────────────────\n');
  ai.availableDrafts().forEach(d => console.log(`  ${d.key.padEnd(28)} — ${d.title}`));

  console.log('\n── Done. No data left this machine. ───────────────────\n');
}

run().catch(console.error);
