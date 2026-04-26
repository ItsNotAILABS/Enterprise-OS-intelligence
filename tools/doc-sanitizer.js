#!/usr/bin/env node
/**
 * MUNDATOR DOCUMENTORUM
 * Document Sanitizer for the Medina Tech Public Showcase
 *
 * Every document that enters the public repo passes through this model.
 * It reads the document, strips anything that reveals implementation
 * internals, enforces branding, and writes a clean version ready for
 * ArXiv or DFINITY review.
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

// ─── Branding Rules ──────────────────────────────────────────────────────────
// Any of these private names found in a public document get flagged or replaced.
const BRAND_REPLACEMENTS = [
  { pattern: /\bPRIMORDIUM\b/g,          replacement: 'Medina Tech' },
  { pattern: /\bprimordium\b/gi,         replacement: 'Medina Tech' },
  { pattern: /\bAI Labs\b/gi,            replacement: 'Chaos Lab' },
  { pattern: /\bAILabs\b/g,             replacement: 'Chaos Lab' },
];

// ─── Sensitive Pattern Detectors ─────────────────────────────────────────────
// These patterns in a document body signal implementation detail that should
// not be in a public showcase paper. The sanitizer flags them for manual review.
const SENSITIVE_PATTERNS = [
  // JavaScript / code blocks with real logic
  { name: 'CODE_BLOCK_WITH_LOGIC',   pattern: /```[a-z]*\n[\s\S]*?(function|const|class|import|export|=>|async|await)[\s\S]*?```/g },
  // Specific canister IDs or principal strings
  { name: 'CANISTER_PRINCIPAL',      pattern: /[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}/g },
  // API keys or tokens
  { name: 'API_KEY',                 pattern: /(?:api[_-]?key|token|secret|password)\s*[:=]\s*['"][^'"]{8,}['"]/gi },
  // Internal file paths
  { name: 'INTERNAL_PATH',           pattern: /(?:\/src\/|\/scripts\/|nova\.json|bootstrap\.js)/g },
  // Raw equation implementations (protect the sauce)
  { name: 'IMPLEMENTATION_FORMULA',  pattern: /(?:\.js|\.ts|\.mo|\.rs)\b.*?\(.*?=>.*?\)/g },
];

// ─── Required Paper Structure ─────────────────────────────────────────────────
const REQUIRED_SECTIONS = ['## Abstract', '## References'];
const REQUIRED_AUTHOR_LINE = 'Alfredo Medina Hernandez';
const REQUIRED_AFFILIATION  = 'Medina Tech';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function red(s)    { return `\x1b[31m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }
function green(s)  { return `\x1b[32m${s}\x1b[0m`; }
function bold(s)   { return `\x1b[1m${s}\x1b[0m`; }

function sanitizeContent(content, filename) {
  const issues   = [];
  const warnings = [];
  let cleaned    = content;

  // 1. Brand replacements (auto-fix)
  for (const { pattern, replacement } of BRAND_REPLACEMENTS) {
    const before = cleaned;
    cleaned = cleaned.replace(pattern, replacement);
    if (cleaned !== before) {
      warnings.push(`Brand auto-fixed: replaced with "${replacement}"`);
    }
  }

  // 2. Sensitive pattern detection (flag for review)
  for (const { name, pattern } of SENSITIVE_PATTERNS) {
    const matches = cleaned.match(pattern);
    if (matches) {
      issues.push({
        type: name,
        count: matches.length,
        sample: matches[0].slice(0, 80),
      });
    }
  }

  // 3. Required sections check (papers only)
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

  return { cleaned, issues, warnings };
}

function processFile(filepath) {
  const rel     = path.relative(ROOT, filepath);
  const content = fs.readFileSync(filepath, 'utf8');

  const { cleaned, issues, warnings } = sanitizeContent(content, rel);

  let status = 'PASS';
  if (issues.length > 0) status = 'REVIEW';

  // Write cleaned content back if anything changed
  if (cleaned !== content) {
    fs.writeFileSync(filepath, cleaned, 'utf8');
  }

  return { file: rel, status, issues, warnings };
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
  const target = process.argv[2] || path.join(ROOT, 'papers');
  const targetPath = path.resolve(target);

  if (!fs.existsSync(targetPath)) {
    console.error(red(`Path not found: ${targetPath}`));
    process.exit(1);
  }

  const files   = collectMarkdownFiles(targetPath);
  const results = files.map(processFile);

  // ─── Report ────────────────────────────────────────────────────────────────
  console.log('\n' + bold('MUNDATOR DOCUMENTORUM — Medina Tech Public Repo Sanitizer'));
  console.log('═'.repeat(62));

  let exitCode = 0;

  for (const { file, status, issues, warnings } of results) {
    const icon = status === 'PASS' ? green('✓') : yellow('⚠');
    console.log(`\n${icon}  ${bold(file)}`);

    for (const w of warnings) {
      console.log(`   ${yellow('→')} ${w}`);
    }

    for (const iss of issues) {
      console.log(`   ${red('✗')} SENSITIVE [${iss.type}] (×${iss.count})`);
      console.log(`     sample: ${iss.sample}…`);
      exitCode = 1;
    }

    if (status === 'PASS' && warnings.length === 0) {
      console.log(`   ${green('→')} Clean.`);
    }
  }

  console.log('\n' + '═'.repeat(62));
  const passCount   = results.filter(r => r.status === 'PASS').length;
  const reviewCount = results.filter(r => r.status === 'REVIEW').length;
  console.log(`${green(passCount + ' PASS')}  ${reviewCount > 0 ? yellow(reviewCount + ' NEED REVIEW') : ''}`);

  if (exitCode !== 0) {
    console.log(red('\nRemove or redact the flagged content before this repo goes public.\n'));
  } else {
    console.log(green('\nAll documents are public-showcase ready.\n'));
  }

  process.exit(exitCode);
}

main();
