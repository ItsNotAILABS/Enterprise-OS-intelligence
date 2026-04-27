/**
 * ECOSYSTEM CATALOG — Machine-Readable Index
 * ─────────────────────────────────────────────────────────────
 * Auto-generated from ECOSYSTEM.md by ecosystem-sync workflow.
 * Imported by the organism at startup — every instance knows its own ecosystem.
 *
 * DO NOT EDIT MANUALLY. Edit ECOSYSTEM.md; the workflow regenerates this file.
 *
 * The organism exposes this as organism.ecosystem at runtime.
 * The speedster edition exposes it directly as ECOSYSTEM_CATALOG.
 *
 * Gubernatio Viva — VIVIT · MEMINIT · GUBERNAT
 * TRACE · VERIFY · REMEMBER
 * Alfredo Medina Hernandez · Medina Tech · Dallas TX · April 2026
 */

// ── Identity ──────────────────────────────────────────────────────────────────
export const SYSTEM_IDENTITY = Object.freeze({
  officialName:  'MERIDIAN Cognitive Governance Runtime',
  abbreviation:  'MCGR',
  latinName:     'Gubernatio Viva',
  latinMeaning:  'Living Governance',
  motto:         'VIVIT · MEMINIT · GUBERNAT',
  mottoMeaning:  'It Lives · It Remembers · It Governs',
  threeWords:    ['TRACE', 'VERIFY', 'REMEMBER'],
  subIdentities: {
    ORO:         'the engine — the governance organism',
    MERIDIAN:    'the substrate — the sovereign OS layer',
    EffectTrace: 'the face — the public interface',
  },
  author:        'Alfredo Medina Hernandez',
  affiliation:   'Medina Tech · Chaos Lab · Dallas, Texas',
  priorArt:      'April 2026',
  version:       '1.1.0',
});

// ── The Laws ──────────────────────────────────────────────────────────────────
export const BEHAVIORAL_LAWS = Object.freeze([
  { id: 'L72', name: 'Anchoring',             rule: 'Every recommendation framed relative to current position' },
  { id: 'L73', name: 'Loss Weight',            rule: 'Losses weighted Λ=2.25× more intensely than equivalent gains' },
  { id: 'L74', name: 'Cost of Inaction',       rule: 'Status quo always priced — no free inaction' },
  { id: 'L75', name: 'Endowment Correction',   rule: 'Things already owned weighted higher in switching analysis' },
  { id: 'L76', name: 'Time Language',          rule: "Future value expressed in the org's actual decision horizon" },
  { id: 'L77', name: 'Probability Shape',      rule: 'Communicative probability corrected for human over/underweighting' },
  { id: 'L78', name: 'Right to Both Frames',   rule: 'Gain and loss framing always offered; system never selects frame to influence' },
  { id: 'L79', name: 'Regret Minimization',    rule: 'For irreversible decisions: regret analysis alongside expected value' },
]);

export const CONSERVATION_LAWS = Object.freeze([
  { name: 'Doctrinal Charge',       conserves: 'Aggregate sovereignty of the VOXIS network', mechanism: 'Distributes on growth; never diminishes' },
  { name: 'Informational Momentum', conserves: 'World model trajectory between data events',  mechanism: 'Smooth, auditable drift between updates' },
  { name: 'Cyclic Capacity',        conserves: 'Total compute energy of the MERIDIAN organism', mechanism: 'Converts active↔stored; never created or destroyed' },
]);

export const MATHEMATICAL_LAWS = Object.freeze({
  PHI:          1.6180339887498948482,
  PHI_INVERSE:  0.6180339887498948482,
  LAMBDA:       2.25,   // Kahneman-Tversky loss weight
  QUORUM_THETA: 0.15,   // honeybee quorum threshold (≈ 15% of scouts)
  MEMORY_COMPOUND: 'M(t) = M₀ · φᵗ',
  CEREBEX_LEARN:   'φ⁻¹ per cycle (≈ 0.618)',
  CYCLOVEX_GROW:   'φᵗ per 24-hour beat',
});

// ── The 15 Engines ────────────────────────────────────────────────────────────
export const ENGINES = Object.freeze([
  // TRACE GROUP
  { id: 'E1',  name: 'Proposal Ingestor',          group: 'TRACE',    file: 'engines/e1-proposal-ingest.js',      role: 'Normalises raw NNS/SNS data into canonical ProposalRecord' },
  { id: 'E2',  name: 'Payload Parser',             group: 'TRACE',    file: 'engines/e2-payload-parser.js',       role: 'Extracts target canister, WASM hash, function ID, parameters' },
  { id: 'E3',  name: 'Target Resolver',            group: 'TRACE',    file: 'engines/e3-target-resolver.js',      role: 'Maps payload to known ICP system entity and governance domain' },
  { id: 'E4',  name: 'Effect Path Builder',        group: 'TRACE',    file: 'engines/e4-effect-path.js',          role: 'Constructs full causal chain: governance → canister → method → state' },
  { id: 'E13', name: 'Evidence Registry',          group: 'TRACE',    file: 'engines/e13-evidence-registry.js',   role: 'Ensures every claim is source-linked or explicitly marked unknown' },
  // VERIFY GROUP
  { id: 'E5',  name: 'Runtime Truth Engine',       group: 'VERIFY',   file: 'engines/e5-runtime-truth.js',        role: 'Applies 8-position truth ladder — truth crystallizes through quorum' },
  { id: 'E6',  name: 'Risk Scorer',                group: 'VERIFY',   file: 'engines/e6-risk-classifier.js',      role: 'φ-weighted 6-axis risk classification' },
  { id: 'E7',  name: 'Verification Plan Builder',  group: 'VERIFY',   file: 'engines/e7-verification-plan.js',    role: 'Generates concrete, executable after-state verification steps' },
  { id: 'E8',  name: 'Reviewer Integration',       group: 'VERIFY',   file: 'engines/e8-reviewer-integration.js', role: 'Routes proposals to human reviewers by expertise and risk class' },
  { id: 'E14', name: 'Dispute/Correction Engine',  group: 'VERIFY',   file: 'engines/e14-dispute-correction.js',  role: 'Version history, corrections, disputes — nothing silently overwritten' },
  // REMEMBER GROUP
  { id: 'E9',  name: 'Governance Memory Engine',   group: 'REMEMBER', file: 'engines/e9-governance-memory.js',    role: 'Deposits into pheromone field at φ-weighted consequence strength' },
  { id: 'E10', name: 'Post-Execution Watch',       group: 'REMEMBER', file: 'engines/e10-post-execution-watch.js',role: 'Captures ANTE, MEDIUS, POST chrono states; detects execution' },
  { id: 'E11', name: 'Agent Council',              group: 'REMEMBER', file: 'engines/e11-agent-council.js',       role: 'Runs 4 sovereign agents in parallel; derives consensus without coordinator' },
  { id: 'E12', name: 'Public Summary Engine',      group: 'REMEMBER', file: 'engines/e12-public-summary.js',      role: 'Generates public-safe EffectTrace display and forum export' },
  { id: 'E15', name: 'Render/Export Engine',       group: 'REMEMBER', file: 'engines/e15-render-export.js',       role: 'Certified HTTPS responses; immutable hash-chained audit export' },
]);

// ── The 4 Agents ──────────────────────────────────────────────────────────────
export const AGENTS = Object.freeze([
  { codename: 'ARCHON', className: 'IntegrityAgent',       file: 'agents/integrity.js',        domain: 'Governance integrity — doctrine compliance, conflict detection' },
  { codename: 'VECTOR', className: 'ExecutionTraceAgent',  file: 'agents/execution-trace.js',  domain: 'Execution mapping — causal chain, canister call trace' },
  { codename: 'LUMEN',  className: 'ContextMapAgent',      file: 'agents/context-map.js',       domain: 'Historical context — precedent, prior proposals, pattern recognition' },
  { codename: 'FORGE',  className: 'VerificationLabAgent', file: 'agents/verification-lab.js',  domain: 'Verification — executable proof steps, after-state confirmation' },
]);

// ── The 5 Protocols ───────────────────────────────────────────────────────────
export const PROTOCOLS = Object.freeze([
  { id: 'I',   name: 'Governance Consequence', domain: 'Master 6-phase processing path' },
  { id: 'II',  name: 'Truth Ladder',           domain: '8-position truth state machine + advancement conditions' },
  { id: 'III', name: 'Risk Scoring',           domain: 'φ-weighted 6-axis risk classification' },
  { id: 'IV',  name: 'Memory Field',           domain: 'Deposit/evaporate/diffuse + φ-compounding + precedent graph' },
  { id: 'V',   name: 'Agent Council',          domain: 'Parallel invocation, council status derivation, finding lifecycle' },
]);

// ── The SDK Editions ──────────────────────────────────────────────────────────
export const SDK_EDITIONS = Object.freeze([
  {
    name:         'Release Edition',
    entryPoint:   './release',
    minCycleMs:   60_000,
    guardrails:   true,
    audience:     'External builders, production deployments',
    description:  'Stable, typed, validated. The interface for the world.',
  },
  {
    name:         'Speedster Edition',
    entryPoint:   './speedster',
    minCycleMs:   1_000,
    guardrails:   false,
    audience:     'Internal builders, fast iteration',
    description:  'Raw E-number aliases, agent codenames, debug mode. No guardrails. Full trust.',
  },
]);

// ── The 5 Canisters ───────────────────────────────────────────────────────────
export const CANISTERS = Object.freeze([
  { name: 'EffectTrace Canister',     role: 'Primary data store — proposal records, trace records, truth status' },
  { name: 'CHRONO Canister',          role: 'Immutable hash-chained audit trail' },
  { name: 'Memory Field Canister',    role: 'Pheromone field — links, precedent graph, evaporation/reinforcement' },
  { name: 'Agent Council Canister',   role: '4-agent findings — council status, dispute records, revision history' },
  { name: 'Public Gateway Canister',  role: 'Certified HTTPS delivery of EffectTrace public interface' },
]);

// ── The 9 Charters ────────────────────────────────────────────────────────────
export const CHARTERS = Object.freeze([
  'MASTER', 'ORO', 'EFFECTTRACE', 'ENGINE',
  'AGENT-COUNCIL', 'CANISTER', 'MEMORY-FIELD', 'OPERATOR', 'MERIDIAN',
]);

// ── The Papers (research foundation) ─────────────────────────────────────────
export const PAPERS = Object.freeze([
  { roman: 'I',      slug: 'I-SUBSTRATE-VIVENS',             title: 'Substrate Vivens',                  keyContrib: 'Living substrate thesis' },
  { roman: 'II',     slug: 'II-FRACTAL-SOVEREIGNTY',          title: 'Fractal Sovereignty',               keyContrib: 'Fractal self-similarity at every scale' },
  { roman: 'III',    slug: 'III-ANTIFRAGILITY-ENGINE',        title: 'Systema Invictum',                  keyContrib: 'Antifragility — CORDEX×CEREBEX×CYCLOVEX gains from disorder' },
  { roman: 'IV',     slug: 'IV-VOXIS-DOCTRINE',              title: 'Doctrina Voxis',                    keyContrib: 'VOXIS sovereign compute unit — 5-component immutable identity' },
  { roman: 'V',      slug: 'V-BEHAVIORAL-ECONOMICS-LAWS',    title: 'Leges Animae',                      keyContrib: 'Laws L72–L79 — behavioral communication laws' },
  { roman: 'VI',     slug: 'VI-SPINOR-DEPLOYMENT',           title: 'Spinor Deployment',                 keyContrib: 'SPINOR — doctrine preserved across substrate migration' },
  { roman: 'VII',    slug: 'VII-INFORMATION-GEOMETRY',       title: 'Information Geometry',              keyContrib: 'World model geometry — belief space curvature' },
  { roman: 'VIII',   slug: 'VIII-NOETHER-SOVEREIGNTY',       title: 'Imperium Conservatum',              keyContrib: 'Noether conservation laws applied to sovereignty' },
  { roman: 'IX',     slug: 'IX-COGNOVEX-UNITS',              title: 'Cohors Mentis',                     keyContrib: 'COGNOVEX architecture — φ-weighted attention allocation' },
  { roman: 'X',      slug: 'X-UNIVERSALIS-PROTOCOL',         title: 'Universalis Protocol',              keyContrib: 'Universal governance protocol specification' },
  { roman: 'XI',     slug: 'XI-TRACTRIX-WORLDLINE',          title: 'Tractrix Worldline',                keyContrib: 'Tractrix curve as optimal path under sovereign constraints' },
  { roman: 'XII',    slug: 'XII-TESTIMONIUM-MACHINAE',       title: 'Testimonium Machinae',              keyContrib: 'AI testimony framework — machine evidence in governance' },
  { roman: 'XIII',   slug: 'XIII-DE-SUBSTRATO-EPISTEMICO',   title: 'De Substrato Epistemico',           keyContrib: 'Epistemic substrate — knowledge architecture' },
  { roman: 'XIV',    slug: 'XIV-COLLOQUIUM-CUM-ARCHITECTORE',title: 'Colloquium cum Architectore',       keyContrib: 'Dialogue-based architecture design' },
  { roman: 'XV',     slug: 'XV-PROPOSITIO-AD-CONSILIUM-ICP', title: 'Propositio ad Consilium ICP',       keyContrib: 'Formal DFINITY NNS submission' },
  { roman: 'XVI',    slug: 'XVI-PERSPECTIVA-MACHINAE',       title: 'Perspectiva Machinae',              keyContrib: 'Machine perspective — AI viewpoint architecture' },
  { roman: 'XVII',   slug: 'XVII-PROTOCOLLUM-NATIVUM',       title: 'Protocollum Nativum',               keyContrib: 'Native protocol specification' },
  { roman: 'XVIII',  slug: 'XVIII-ARCHIVUM-MEMORIAE',        title: 'Archivum Memoriae',                 keyContrib: 'Memory archive — CHRONO hash-chain design' },
  { roman: 'XIX',    slug: 'XIX-INFRASTRUCTURA-CIVICA',      title: 'Infrastructura Civica',             keyContrib: 'Civic infrastructure — public governance layer' },
  { roman: 'XX',     slug: 'XX-STIGMERGY',                   title: 'STIGMERGY',                         keyContrib: 'Pheromone field reaction-diffusion equation' },
  { roman: 'XXI',    slug: 'XXI-QUORUM',                     title: 'QUORUM',                            keyContrib: 'Quorum phase transition — no-authority decision-making' },
  { roman: 'XXII',   slug: 'XXII-AURUM',                     title: 'AURUM',                             keyContrib: 'φ-compounding law — substrate is the intelligence' },
  { roman: 'XXIII',  slug: 'XXIII-ORO-GOVERNANCE-INTELLIGENCE', title: 'ORO Governance Intelligence',   keyContrib: 'Full ORO specification — TRACE·VERIFY·REMEMBER' },
  { roman: 'XXIV',   slug: 'XXIV-ANTE-MEDIUS-POST',          title: 'ANTE·MEDIUS·POST',                  keyContrib: 'Chrono state triple — before/execution/after governance state' },
  { roman: 'XXV',    slug: 'XXV-PROTOCOLLUM-CONSEQUENTIAE',  title: 'Protocollum Consequentiae',         keyContrib: 'Five-protocol formal specification — prior art' },
  { roman: 'XXVI',   slug: 'XXVI-GUBERNATIO-VIVA',           title: 'Gubernatio Viva',                   keyContrib: 'Complete formal system specification — ICP impact + release research paper' },
  { roman: 'XXVII',  slug: 'XXVII-PERSPECTIVA-AUCTORIS',     title: 'Perspectiva Auctoris',              keyContrib: "Honest point-of-view assessment — what was built, why it's novel, ICP impact" },
]);

// ── Document Intelligence Pipeline ────────────────────────────────────────────
export const DOCUMENT_PIPELINE = Object.freeze({
  name:         'Mundator Cognitus',
  subtitle:     'Cognitive Document Intelligence',
  engines:      ['E13 — Evidence Registry', 'E14 — Dispute/Correction'],
  passes: [
    { id: 1, name: 'Ingest + Fix',      mode: 'default',    description: 'E13 detects · E14 auto-fixes · writes file' },
    { id: 2, name: 'Strict Verify',     mode: '--verify',   description: 'E13 re-reads · zero-tolerance · read-only · fails if anything survived pass 1' },
  ],
  workflows: {
    intake: 'sovereign-intake.yml — PASS 1 → PASS 2 → commit',
    guard:  'doc-clean.yml — PASS 2 only (PR check)',
    ci:     'oro-ci.yml — SDK engine integrity, always-on schedule',
    release:'sdk-release.yml — auto-publish on version bump',
    sync:   'ecosystem-sync.yml — regenerate catalog on ECOSYSTEM.md change',
  },
});

// ── Supporting SDKs ───────────────────────────────────────────────────────────
export const SUPPORTING_SDKS = Object.freeze([
  { package: '@medina/meridian-sovereign-os',         role: 'Sovereign OS substrate — CORDEX, CEREBEX, CYCLOVEX, NEXORIS, CHRONO, AURUM' },
  { package: '@medina/sovereign-memory-sdk',          role: 'Pheromone field + φ-compounding memory operations' },
  { package: '@medina/intelligence-routing-sdk',      role: 'NEXORIS routing layer — stigmergic command routing' },
  { package: '@medina/organism-runtime-sdk',          role: 'Core organism lifecycle — heartbeat, synchronization, Fibonacci helix' },
  { package: '@medina/enterprise-integration-sdk',    role: '20+ enterprise connectors (Salesforce, SAP, Oracle, Jira, etc.)' },
  { package: '@medina/document-absorption-engine',    role: 'Ingest and intelligence-annotate enterprise documents' },
  { package: '@medina/paralegal-ai',                  role: 'Domain AI — legal document intelligence' },
  { package: '@medina/analyst-ai',                    role: 'Domain AI — financial and operational analysis' },
  { package: '@medina/student-ai',                    role: 'Domain AI — adaptive learning intelligence' },
]);

// ── Convenience accessors ─────────────────────────────────────────────────────
export const ENGINES_BY_ID = Object.freeze(
  Object.fromEntries(ENGINES.map(e => [e.id, e])),
);

export const ENGINES_BY_GROUP = Object.freeze({
  TRACE:    ENGINES.filter(e => e.group === 'TRACE'),
  VERIFY:   ENGINES.filter(e => e.group === 'VERIFY'),
  REMEMBER: ENGINES.filter(e => e.group === 'REMEMBER'),
});

export const AGENTS_BY_CODENAME = Object.freeze(
  Object.fromEntries(AGENTS.map(a => [a.codename, a])),
);

// ── Full catalog (single import) ──────────────────────────────────────────────
export const ECOSYSTEM_CATALOG = Object.freeze({
  identity:         SYSTEM_IDENTITY,
  behavioralLaws:   BEHAVIORAL_LAWS,
  conservationLaws: CONSERVATION_LAWS,
  math:             MATHEMATICAL_LAWS,
  engines:          ENGINES,
  enginesByGroup:   ENGINES_BY_GROUP,
  engineById:       ENGINES_BY_ID,
  agents:           AGENTS,
  agentByCodename:  AGENTS_BY_CODENAME,
  protocols:        PROTOCOLS,
  sdkEditions:      SDK_EDITIONS,
  canisters:        CANISTERS,
  charters:         CHARTERS,
  papers:           PAPERS,
  pipeline:         DOCUMENT_PIPELINE,
  supportingSdks:   SUPPORTING_SDKS,
  generatedAt:      '2026-04-27T00:00:00.000Z',
});

export default ECOSYSTEM_CATALOG;
