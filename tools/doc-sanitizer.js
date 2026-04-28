#!/usr/bin/env node
/**
 * MUNDATOR COGNITUS — Cognitive Document Intelligence [E13·E14]
 * ─────────────────────────────────────────────────────────────
 * Formerly: Mundator Documentorum (single-pass flag-and-report)
 * Upgraded:  Two-pass AI engine flow
 *
 * Engine identity:
 *   E13 — Evidence Registry  (TRACE GROUP)   — knows what claims exist
 *   E14 — Dispute/Correction (VERIFY GROUP)  — fixes what is wrong
 *
 * Two-pass AI pipeline:
 *
 *   PASS 1 — INGEST + FIX  (default mode)
 *     E1  Ingest raw document from disk
 *     E13 Detect all sensitive / non-compliant content
 *     E14 Auto-fix: brand replacements, canister IDs, logic code blocks,
 *                   API keys, internal paths
 *     Write cleaned file back to disk
 *     Exit 0 if auto-fix resolved everything; exit 1 if manual intervention needed
 *
 *   PASS 2 — VERIFY  (--verify flag)
 *     E13 Re-read the file that PASS 1 wrote
 *     Confirm that zero sensitive patterns remain (strict read-only, no writes)
 *     If any pattern survived PASS 1, exit 1 and print the offending sample
 *     If everything is clean, exit 0 — file is sovereign-public-ready
 *
 * Workflow:  sovereign-intake.yml runs PASS 1, then PASS 2, then commits.
 *            doc-clean.yml runs PASS 2 only (guard check on PRs).
 *
 * Usage:
 *   node tools/doc-sanitizer.js papers/           # PASS 1 — ingest + fix
 *   node tools/doc-sanitizer.js papers/ --verify  # PASS 2 — strict verify
 *   node tools/doc-sanitizer.js papers/my-doc.md  # single file, PASS 1
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Execution mode ─────────────────────────────────────────────────────────
const VERIFY_MODE = process.argv.includes('--verify');
const TARGET_ARG  = process.argv.find(
  a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1],
) ?? path.join(ROOT, 'papers');

// ─── Branding Rules (E14 · auto-fix · PASS 1 only) ────────────────────────
const BRAND_REPLACEMENTS = [
  { pattern: /\bPRIMORDIUM\b/g,  replacement: 'Medina Tech' },
  { pattern: /\bprimordium\b/gi, replacement: 'Medina Tech' },
  { pattern: /\bAI Labs\b/gi,    replacement: 'Chaos Lab'   },
  { pattern: /\bAILabs\b/g,      replacement: 'Chaos Lab'   },
];

// ─── Math-block guard ───────────────────────────────────────────────────────
// Code blocks containing math notation (Greek letters, ∂, ∇, ∑, ∫, etc.)
// are academic notation, not implementation code.
// NOTE: → ← ↔ excluded — they appear in code comments/template literals.
// NOTE: · (U+00B7, middle dot) is the mathematical interpunct, not ambiguous.
function isMathOrPseudoBlock(blockContent) {
  const mathSignals = /[∂∇∑∫δΣφρ∈⊂·≤≥≠≈∞∏√∀∃¬∧∨⊕±×÷π]/;
  if (mathSignals.test(blockContent)) return true;
  // Pseudo-code structs: Name = TypeName { field: value ... }
  // Avoid \b next to non-word characters (dots, parentheses).
  const pseudoCodeShape = /^\s*\w+\s*[=(]\s*\w+\s*\{[\s\S]*?\}/m;
  const hasJsKeywords   = /\b(?:import|export|require|Promise)\b|console\.|\.then\(|\.catch\(|\basync\s+function|\bawait\s+\w+\s*\(/;
  if (pseudoCodeShape.test(blockContent) && !hasJsKeywords.test(blockContent)) {
    return true;
  }
  return false;
}

// ─── Code-block redactor (E14 · auto-fix · PASS 1) ────────────────────────
const CODE_BLOCK_RE  = /```([a-z]*)\n([\s\S]*?)```/g;
const LOGIC_KEYWORDS = /\b(?:import|export|require)\b|\bfunction\s+\w|\bconst\s+\w|\blet\s+\w|\bvar\s+\w|\bclass\s+\w|\basync\s+function|\bawait\s+\w|\.\w+\s*=>|Promise\./;

function redactLogicBlocks(text) {
  let redacted = false;
  const result = text.replace(CODE_BLOCK_RE, (match, lang, body) => {
    if (isMathOrPseudoBlock(body)) return match;
    if (!LOGIC_KEYWORDS.test(body)) return match;
    redacted = true;
    return `\`\`\`${lang}\n[IMPLEMENTATION REDACTED — see ORO SDK]\n\`\`\``;
  });
  return { result, redacted };
}

// ─── Inline sensitive patterns (both passes) ───────────────────────────────
const INLINE_REDACTIONS = [
  {
    name:        'CANISTER_PRINCIPAL',
    pattern:     /[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}/g,
    replacement: '[CANISTER-ID-REDACTED]',
  },
  {
    name:        'API_KEY',
    pattern:     /(?:api[_-]?key|token|secret|password)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    replacement: '[REDACTED]',
  },
  {
    name:        'INTERNAL_PATH',
    pattern:     /(?:["'`](?:[./\\]+)?src\/|\/scripts\/|nova\.json|bootstrap\.js)/g,
    replacement: '[PATH-REDACTED]',
  },
];

// ─── PASS 2 residual logic detector ───────────────────────────────────────
function detectResidualLogicBlocks(text) {
  const residuals = [];
  text.replace(CODE_BLOCK_RE, (match, lang, body) => {
    if (isMathOrPseudoBlock(body)) return match;
    if (!LOGIC_KEYWORDS.test(body)) return match;
    residuals.push({ lang, sample: body.slice(0, 80) });
    return match;
  });
  return residuals;
}

// ─── Required Paper Structure ──────────────────────────────────────────────
const REQUIRED_SECTIONS   = ['## Abstract', '## References'];
const REQUIRED_AUTHOR_LINE = 'Alfredo Medina Hernandez';
const REQUIRED_AFFILIATION = 'Medina Tech';

// ─── Helpers ───────────────────────────────────────────────────────────────
function red(s)    { return `\x1b[31m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }
function green(s)  { return `\x1b[32m${s}\x1b[0m`; }
function cyan(s)   { return `\x1b[36m${s}\x1b[0m`; }
function bold(s)   { return `\x1b[1m${s}\x1b[0m`; }

// ─── PASS 1: Ingest + Fix (E13 detects · E14 auto-fixes · writes file) ────
function pass1Fix(content, filename) {
  const autoFixed = [];
  const warnings  = [];
  const remaining = [];
  let cleaned     = content;

  for (const { pattern, replacement } of BRAND_REPLACEMENTS) {
    const before = cleaned;
    cleaned = cleaned.replace(pattern, replacement);
    if (cleaned !== before) autoFixed.push(`Brand replaced → "${replacement}"`);
  }

  const { result: afterBlocks, redacted } = redactLogicBlocks(cleaned);
  if (redacted) {
    autoFixed.push('Logic code block(s) replaced with [IMPLEMENTATION REDACTED]');
    cleaned = afterBlocks;
  }

  for (const { name, pattern, replacement } of INLINE_REDACTIONS) {
    const before = cleaned;
    cleaned = cleaned.replace(pattern, replacement);
    if (cleaned !== before) autoFixed.push(`${name} redacted → "${replacement}"`);
  }

  if (filename.endsWith('.md') && filename.includes('papers')) {
    for (const section of REQUIRED_SECTIONS) {
      if (!cleaned.includes(section)) warnings.push(`Missing required section: "${section}"`);
    }
    if (!cleaned.includes(REQUIRED_AUTHOR_LINE)) warnings.push(`Missing required author: "${REQUIRED_AUTHOR_LINE}"`);
    if (!cleaned.includes(REQUIRED_AFFILIATION))  warnings.push(`Missing required affiliation: "${REQUIRED_AFFILIATION}"`);
  }

  return { cleaned, autoFixed, warnings, remaining };
}

// ─── PASS 2: Strict Verify (E13 strict · read-only · fails if issue survives)
function pass2Verify(content) {
  const failures = [];

  for (const b of detectResidualLogicBlocks(content)) {
    failures.push({ type: 'RESIDUAL_CODE_BLOCK', detail: `lang=${b.lang || 'plain'} — sample: ${b.sample}…` });
  }

  for (const { name, pattern } of INLINE_REDACTIONS) {
    const clone = new RegExp(pattern.source, pattern.flags);
    const matches = content.match(clone);
    if (matches) failures.push({ type: `RESIDUAL_${name}`, detail: `×${matches.length} — sample: ${matches[0].slice(0, 80)}` });
  }

  for (const { pattern } of BRAND_REPLACEMENTS) {
    const clone = new RegExp(pattern.source, pattern.flags);
    if (clone.test(content)) failures.push({ type: 'RESIDUAL_BRAND_STRING', detail: pattern.source });
  }

  return failures;
}

// ─── File processor ────────────────────────────────────────────────────────
function processFile(filepath) {
  const rel     = path.relative(ROOT, filepath);
  const content = fs.readFileSync(filepath, 'utf8');

  if (VERIFY_MODE) {
    const failures = pass2Verify(content);
    return {
      file: rel, pass: 2,
      status:    failures.length === 0 ? 'VERIFIED' : 'VERIFY_FAIL',
      failures,
      autoFixed: [], warnings: [],
    };
  }

  const { cleaned, autoFixed, warnings, remaining } = pass1Fix(content, rel);
  if (cleaned !== content) fs.writeFileSync(filepath, cleaned, 'utf8');

  return {
    file: rel, pass: 1,
    status:    remaining.length > 0 ? 'MANUAL_REVIEW' : 'FIXED',
    remaining, autoFixed, warnings, failures: [],
  };
}

function collectMarkdownFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true })
    .flatMap(entry => {
      const full = path.join(target, entry.name);
      if (entry.isDirectory()) return collectMarkdownFiles(full);
      if (entry.name.endsWith('.md')) return [full];
      return [];
    });
}

// ─── Main ──────────────────────────────────────────────────────────────────
function main() {
  const targetPath = path.resolve(TARGET_ARG);
  if (!fs.existsSync(targetPath)) {
    console.error(red(`Path not found: ${targetPath}`));
    process.exit(1);
  }

  const files   = collectMarkdownFiles(targetPath);
  const results = files.map(processFile);

  const passLabel = VERIFY_MODE ? 'PASS 2 — STRICT VERIFY [E13]' : 'PASS 1 — INGEST + FIX [E13·E14]';
  console.log('\n' + bold(`MUNDATOR COGNITUS — ${passLabel}`));
  console.log('═'.repeat(62));

  let exitCode = 0;

  for (const r of results) {
    const ok   = r.status === 'FIXED' || r.status === 'VERIFIED';
    const icon = ok ? green('✓') : (r.status === 'MANUAL_REVIEW' ? red('✗') : yellow('⚠'));
    console.log(`\n${icon}  ${bold(r.file)}`);

    for (const fix of (r.autoFixed ?? [])) console.log(`   ${green('✔')} Auto-fixed: ${fix}`);
    for (const w   of (r.warnings  ?? [])) console.log(`   ${yellow('→')} ${w}`);
    for (const f   of (r.failures  ?? [])) {
      console.log(`   ${red('✗')} VERIFY FAIL [${f.type}]: ${f.detail}`);
      exitCode = 1;
    }
    for (const rem of (r.remaining ?? [])) {
      console.log(`   ${red('✗')} MANUAL REVIEW REQUIRED: ${rem}`);
      exitCode = 1;
    }

    if (ok && (r.autoFixed ?? []).length === 0 && (r.warnings ?? []).length === 0) {
      console.log(`   ${green('→')} ${VERIFY_MODE ? 'Verified sovereign-public-ready.' : 'Clean — no changes needed.'}`);
    }
  }

  console.log('\n' + '═'.repeat(62));

  if (VERIFY_MODE) {
    const verified = results.filter(r => r.status === 'VERIFIED').length;
    const failed   = results.filter(r => r.status === 'VERIFY_FAIL').length;
    console.log(`${green(verified + ' VERIFIED')}${failed > 0 ? `  ${red(failed + ' VERIFY FAIL')}` : ''}`);
    if (exitCode !== 0) {
      console.log(red('\n[PASS 2] Content survived PASS 1 — manual redaction required before commit.\n'));
    } else {
      console.log(cyan('\n[PASS 2] All documents verified. Proceeding to commit.\n'));
    }
  } else {
    const fixed  = results.filter(r => r.autoFixed.length > 0).length;
    const clean  = results.filter(r => r.status === 'FIXED' && r.autoFixed.length === 0).length;
    const manual = results.filter(r => r.status === 'MANUAL_REVIEW').length;
    console.log(
      `${green(clean + ' CLEAN')}` +
      (fixed  > 0 ? `  ${green(fixed  + ' AUTO-FIXED')}` : '') +
      (manual > 0 ? `  ${red(manual + ' MANUAL REVIEW')}` : ''),
    );
    if (exitCode !== 0) {
      console.log(red('\n[PASS 1] Manual review required — auto-fix could not resolve all issues.\n'));
    } else {
      console.log(cyan('\n[PASS 1] All documents processed. Proceeding to PASS 2 verification.\n'));
    }
  }

  process.exit(exitCode);
}

main();
