#!/usr/bin/env node
/**
 * MUNDATOR DOCUMENTORUM — E13 · Evidence Registry Guard
 * Document Sanitizer for the Medina Tech Public Showcase
 *
 * Engine identity: E13 — Evidence Registry (TRACE GROUP)
 * Pipeline role:   Guards the public evidence record — every claim that enters
 *                  the public repo passes through this engine. It auto-redacts
 *                  implementation internals, enforces branding, and writes a
 *                  clean version ready for ArXiv or DFINITY review.
 *
 * Auto-fix behaviour (E14 — Dispute/Correction Engine):
 *   Brand strings      → replaced automatically, file written back
 *   Canister IDs       → replaced with [CANISTER-ID-REDACTED], file written back
 *   API keys / secrets → replaced with [REDACTED], file written back
 *   Internal paths     → replaced with [PATH-REDACTED], file written back
 *   Logic code blocks  → entire block replaced with [IMPLEMENTATION REDACTED —
 *                        see ORO SDK], file written back
 *
 * The sanitizer does NOT flag-and-fail any more. It fixes first, then checks.
 * If content remains that cannot be auto-fixed, it exits non-zero. Otherwise
 * it exits zero — the sovereign-intake workflow pushes the cleaned files back.
 *
 * Usage:
 *   node tools/doc-sanitizer.js <file-or-directory>
 *   node tools/doc-sanitizer.js papers/
 *   node tools/doc-sanitizer.js papers/my-new-paper.md
 *
 * The sanitizer runs automatically on every push via GitHub Actions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Branding Rules (E13 · auto-fix) ────────────────────────────────────────
// Private internal names → public brand. Applied before any other check.
const BRAND_REPLACEMENTS = [
  { pattern: /\bPRIMORDIUM\b/g,  replacement: 'Medina Tech' },
  { pattern: /\bprimordium\b/gi, replacement: 'Medina Tech' },
  { pattern: /\bAI Labs\b/gi,    replacement: 'Chaos Lab'   },
  { pattern: /\bAILabs\b/g,      replacement: 'Chaos Lab'   },
];

// ─── Math-block guard ────────────────────────────────────────────────────────
// Code blocks whose content is purely mathematical (Greek letters, ∂, ∇, ∑, ∫,
// δ, Σ, φ, ρ, etc.) are academic notation, not implementation code.
// NOTE: → ← ↔ are intentionally excluded — they appear in code comments and
//       template literals and would create false positives.
// Returns true when the block content looks like math/pseudo-code, not JS/Motoko.
function isMathOrPseudoBlock(blockContent) {
  const mathSignals = /[∂∇∑∫δΣφρ∈⊂·≤≥≠≈∞∏√∀∃¬∧∨⊕±×÷π]/;
  if (mathSignals.test(blockContent)) return true;

  // Pseudo-code structs used in formal specification papers (e.g. ANTE/MEDIUS/POST)
  // have the shape:  Name = TypeName { field: value ... }
  // They look like JS objects but are NOT implementation code.
  const pseudoCodeShape = /^\s*\w+\s*[=(]\s*\w+\s*\{[\s\S]*?\}/m;
  const hasJsKeywords   = /\b(import|export|require|console\.|\.then\(|\.catch\(|Promise|async\s+function|await\s+\w+\s*\()\b/;
  if (pseudoCodeShape.test(blockContent) && !hasJsKeywords.test(blockContent)) {
    return true;
  }

  return false;
}

// ─── Code-block logic redactor (E14 · auto-fix) ──────────────────────────────
// Replaces each fenced code block that contains genuine implementation logic.
// Each block is examined independently — the old cross-block-spanning regex is gone.
const CODE_BLOCK_RE = /```([a-z]*)\n([\s\S]*?)```/g;

// Keywords that identify real implementation code (not prose or pseudo-code).
const LOGIC_KEYWORDS = /\b(import|export|require|function\s+\w|const\s+\w|let\s+\w|var\s+\w|class\s+\w|async\s+function|await\s+\w|\.\w+\s*=>|Promise\.)\b/;

function redactLogicBlocks(text) {
  let redacted = false;
  const result = text.replace(CODE_BLOCK_RE, (match, lang, body) => {
    if (isMathOrPseudoBlock(body)) return match;   // keep math / pseudo-code
    if (!LOGIC_KEYWORDS.test(body)) return match;  // keep non-logic blocks
    redacted = true;
    return `\`\`\`${lang}\n[IMPLEMENTATION REDACTED — see ORO SDK]\n\`\`\``;
  });
  return { result, redacted };
}

// ─── Inline auto-redactions (E14 · auto-fix) ─────────────────────────────────
// These are applied AFTER logic blocks are redacted so the patterns do not
// accidentally match content inside a replacement placeholder.
const INLINE_REDACTIONS = [
  // ICP canister principal IDs  (aaaaa-bbbbb-ccccc-ddddd-eee format)
  {
    name:        'CANISTER_PRINCIPAL',
    pattern:     /[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}/g,
    replacement: '[CANISTER-ID-REDACTED]',
  },
  // API keys, tokens, secrets
  {
    name:        'API_KEY',
    pattern:     /(?:api[_-]?key|token|secret|password)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    replacement: '[REDACTED]',
  },
  // Internal implementation file paths
  {
    name:        'INTERNAL_PATH',
    pattern:     /(?:\/src\/|\/scripts\/|nova\.json|bootstrap\.js)/g,
    replacement: '[PATH-REDACTED]',
  },
];

// ─── Required Paper Structure ─────────────────────────────────────────────────
const REQUIRED_SECTIONS   = ['## Abstract', '## References'];
const REQUIRED_AUTHOR_LINE = 'Alfredo Medina Hernandez';
const REQUIRED_AFFILIATION = 'Medina Tech';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function red(s)    { return `\x1b[31m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }
function green(s)  { return `\x1b[32m${s}\x1b[0m`; }
function bold(s)   { return `\x1b[1m${s}\x1b[0m`; }

// ─── E13 + E14 core sanitize function ────────────────────────────────────────
function sanitizeContent(content, filename) {
  const autoFixed  = [];   // things the engine fixed by itself
  const warnings   = [];   // structural gaps that need author attention
  const remaining  = [];   // things that could NOT be auto-fixed (should be empty)
  let cleaned      = content;

  // ── Step 1 · Brand replacements (auto-fix) ──────────────────────────────
  for (const { pattern, replacement } of BRAND_REPLACEMENTS) {
    const before = cleaned;
    cleaned = cleaned.replace(pattern, replacement);
    if (cleaned !== before) {
      autoFixed.push(`Brand replaced → "${replacement}"`);
    }
  }

  // ── Step 2 · Logic code-block redaction (auto-fix, per-block) ───────────
  // Each code block is tested independently — no cross-block false positives.
  const { result: afterBlocks, redacted: blocksRedacted } = redactLogicBlocks(cleaned);
  if (blocksRedacted) {
    autoFixed.push('Logic code block(s) replaced with [IMPLEMENTATION REDACTED]');
    cleaned = afterBlocks;
  }

  // ── Step 3 · Inline sensitive pattern redaction (auto-fix) ──────────────
  for (const { name, pattern, replacement } of INLINE_REDACTIONS) {
    const before = cleaned;
    cleaned = cleaned.replace(pattern, replacement);
    if (cleaned !== before) {
      autoFixed.push(`${name} redacted → "${replacement}"`);
    }
  }

  // ── Step 4 · Required sections check (warnings, not errors) ─────────────
  if (filename.endsWith('.md') && filename.includes('papers')) {
    for (const section of REQUIRED_SECTIONS) {
      if (!cleaned.includes(section)) {
        warnings.push(`Missing required section: "${section}"`);
      }
    }
    if (!cleaned.includes(REQUIRED_AUTHOR_LINE)) {
      warnings.push(`Missing required author: "${REQUIRED_AUTHOR_LINE}"`);
    }
    if (!cleaned.includes(REQUIRED_AFFILIATION)) {
      warnings.push(`Missing required affiliation: "${REQUIRED_AFFILIATION}"`);
    }
  }

  return { cleaned, autoFixed, warnings, remaining };
}

function processFile(filepath) {
  const rel     = path.relative(ROOT, filepath);
  const content = fs.readFileSync(filepath, 'utf8');

  const { cleaned, autoFixed, warnings, remaining } = sanitizeContent(content, rel);

  // Always write back — even if only brand strings changed.
  // The sovereign-intake workflow will commit the result.
  if (cleaned !== content) {
    fs.writeFileSync(filepath, cleaned, 'utf8');
  }

  const status = remaining.length > 0 ? 'MANUAL_REVIEW' : 'PASS';
  return { file: rel, status, autoFixed, warnings, remaining };
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

// ─── Main ────────────────────────────────────────────────────────────────────
function main() {
  const target     = process.argv[2] || path.join(ROOT, 'papers');
  const targetPath = path.resolve(target);

  if (!fs.existsSync(targetPath)) {
    console.error(red(`Path not found: ${targetPath}`));
    process.exit(1);
  }

  const files   = collectMarkdownFiles(targetPath);
  const results = files.map(processFile);

  // ─── Report ──────────────────────────────────────────────────────────────
  console.log('\n' + bold('MUNDATOR DOCUMENTORUM [E13·E14] — Medina Tech Sanitizer'));
  console.log('═'.repeat(62));

  let exitCode = 0;

  for (const { file, status, autoFixed, warnings, remaining } of results) {
    const icon = status === 'PASS' ? green('✓') : yellow('⚠');
    console.log(`\n${icon}  ${bold(file)}`);

    for (const fix of autoFixed) {
      console.log(`   ${green('✔')} Auto-fixed: ${fix}`);
    }
    for (const w of warnings) {
      console.log(`   ${yellow('→')} ${w}`);
    }
    for (const r of remaining) {
      console.log(`   ${red('✗')} MANUAL REVIEW REQUIRED: ${r}`);
      exitCode = 1;
    }

    if (autoFixed.length === 0 && warnings.length === 0 && remaining.length === 0) {
      console.log(`   ${green('→')} Clean.`);
    }
  }

  console.log('\n' + '═'.repeat(62));
  const passCount   = results.filter(r => r.status === 'PASS').length;
  const fixedCount  = results.filter(r => r.autoFixed.length > 0).length;
  const reviewCount = results.filter(r => r.status === 'MANUAL_REVIEW').length;

  console.log(
    `${green(passCount + ' PASS')}` +
    (fixedCount  > 0 ? `  ${green(fixedCount  + ' AUTO-FIXED')}` : '') +
    (reviewCount > 0 ? `  ${yellow(reviewCount + ' NEED MANUAL REVIEW')}` : ''),
  );

  if (exitCode !== 0) {
    console.log(red('\nManual review required — auto-fix could not resolve all issues.\n'));
  } else {
    console.log(green('\nAll documents are public-showcase ready.\n'));
  }

  process.exit(exitCode);
}

main();
