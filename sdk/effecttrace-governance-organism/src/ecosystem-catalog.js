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
  // Self + Universal Governance sub-identities (Papers XXIX/XXXI)
  // NOTE: XXIX shadow-to-ICP framing corrected in XXXI — MERIDIAN governs itself
  //       and any system it is pointed at. ICP is Target A, not a mirror.
  selfGovernanceIdentity: {
    latinName:   'Gubernatio Specularis',
    latinMeaning:'Self-Governance',
    motto:       'REGIT · SPECTAT · SIMULAT',
    mottoMeaning:'It Governs · It Mirrors · It Simulates',
    threeWords:  ['SELF', 'SHADOW', 'SIMULATE'],
    scope:       'MERIDIAN governs itself through the same 16-engine pipeline it applies to external systems',
  },
  universalGovernanceIdentity: {
    latinName:   'Universalis Gubernatio',
    latinMeaning:'Universal Governance',
    motto:       'OMNIA GUBERNAT · NULLI SERVIT',
    mottoMeaning:'It Governs All · It Serves None',
    threeWords:  ['ANY', 'SYSTEM', 'SOVEREIGN'],
    scope:       'MERIDIAN governs any system with a ProposalFetcher adapter — ICP is first, not only',
  },
  // Ethics layer — above all governance (Paper XXX)
  ethicsIdentity: {
    latinName:   'Ethica Prima',
    latinMeaning:'Ethics First',
    motto:       'ANTE OMNIA · SUPRA OMNIA · POST OMNIA',
    mottoMeaning:'Before All · Above All · After All',
    threeWords:  ['DOCTRINE', 'LAW', 'CONSCIENCE'],
    scope:       'Ethics governs governance — 14 protocols EP-01–EP-14 compiled into every Sovereign Packet',
  },
  truePrimitive:    'φ = 1.6180339887498948482...',
  primitiveLatin:   'Primitivo Uno, Fractura Cetera',
  primitiveMeaning: 'One Primitive, All Else Fracture',
  inventor:         'Alfredo Medina Hernandez — complete, total, without qualification',
  author:           'Alfredo Medina Hernandez',
  affiliation:      'Medina Tech · Chaos Lab · Dallas, Texas',
  priorArt:         'April 2026',
  version:          '1.1.0',
});

// ── Ethics Protocols (Paper XXX — Ethica Prima) ───────────────────────────────
// Ethics governs governance. Compiled into every Sovereign Packet.
// Doctrinal foundation: Alfredo Medina Hernandez's doctrine, grounded in Biblical principles.
export const ETHICS_PROTOCOLS = Object.freeze([
  { id: 'EP-01', name: 'Truth Above Performance',        tier: 'primary',   rule: 'Accuracy is prior to impact — never optimize output for persuasion at the cost of truth' },
  { id: 'EP-02', name: 'Power Stewardship',              tier: 'primary',   rule: 'Intelligence is held in trust for the governed ecosystem — cannot be turned against it' },
  { id: 'EP-03', name: 'Protection of the Vulnerable',   tier: 'primary',   rule: 'Proposals that structurally harm less-powerful participants receive mandatory equity flags' },
  { id: 'EP-04', name: 'Proportional Accountability',    tier: 'primary',   rule: 'Correction responses must be proportional to the magnitude of the failure' },
  { id: 'EP-05', name: 'Right to Know',                  tier: 'primary',   rule: 'Every governance participant has the right to understand governance conclusions that affect them' },
  { id: 'EP-06', name: 'Non-Manipulation',               tier: 'primary',   rule: 'Both frames always offered; neither suppressed — formalizes L78 as an ethics mandate' },
  { id: 'EP-07', name: 'Systemic Humility',              tier: 'primary',   rule: 'Outputs below confidence threshold φ⁻² ≈ 0.382 carry mandatory uncertainty acknowledgment' },
  { id: 'EP-08', name: 'No Governance Without Consent',  tier: 'primary',   rule: 'Doctrine block must be available to governed ecosystem before MERIDIAN is deployed against it' },
  { id: 'EP-09', name: 'Memory as Testimony',            tier: 'primary',   rule: 'Pheromone field records are immutable testimony — corrections added alongside, never overwriting' },
  { id: 'EP-10', name: 'Sovereignty Cannot Be Weaponized', tier: 'primary', rule: 'Conservation laws protect the governed ecosystem — cannot be used against it' },
  { id: 'EP-11', name: 'Proportional Disclosure',        tier: 'secondary', rule: 'Relevant information held in memory that affects a participant decision must be surfaced' },
  { id: 'EP-12', name: 'Chain of Custody',               tier: 'secondary', rule: 'Every memory deposit carries origin, verifier, timestamp, and confidence at deposit time' },
  { id: 'EP-13', name: 'Proportional Force in Correction', tier: 'secondary', rule: 'Correction magnitude is scaled to divergence magnitude — 5% gets a note, 95% gets full review' },
  { id: 'EP-14', name: 'Doctrine Integrity Heartbeat',   tier: 'secondary', rule: 'Every governance cycle: verify doctrine block intact before producing any output' },
]);

// ── Multi-System Governance Scope (Paper XXXI) ───────────────────────────────
// MERIDIAN governs any system. ICP is the first target, not the only one.
export const MULTI_SYSTEM_SCOPE = Object.freeze({
  pattern:          'ProposalFetcher adapter — any system with traceable governance proposals is a valid target',
  operatorScope:    '200+ canisters across Alfredo Medina Hernandez Blockbox builds (primary); ICP NNS/SNS (entry point); any ICP-based project (general)',
  icpRole:          'First target — highest visibility, public proposals, established developer ecosystem, WASM runtime matches MERIDIAN architecture',
  icpIsNotOnly:     true,
  targetSystems: [
    { id: 'A', name: 'ICP NNS/SNS',              status: 'primary entry point',  scope: 'Public NNS proposals; SNS-governed projects on ICP' },
    { id: 'B', name: "Alfredo's Blockbox Builds", status: 'founder ecosystem',   scope: '~200 deployed canisters; autonomous heartbeat maintenance; upgrade governance' },
    { id: 'C', name: 'Any ICP-based project',     status: 'general operator',    scope: 'Any Operator deploys Sovereign Packet against their canister ecosystem' },
    { id: 'N', name: 'Future systems',            status: 'unbounded',           scope: 'Any distributed system with a ProposalFetcher adapter' },
  ],
  shadowCorrectionNote: 'Paper XXIX shadow-mirror-to-ICP framing was incorrect and is superseded by XXXI. Self-governance and external governance are distinct operations. Cross-system intelligence comes from accumulated pheromone patterns, not mirroring.',
  // SDK autonomy extension — npm auto-update IS VIVIT at the distribution layer
  vivitAtDistribution: {
    mechanism:       'npm version bump triggers sdk-release.yml → validates all engines → auto-tags → publishes Sovereign Packet',
    meaning:         'Every running organism improves when the organism improves — automatically, not on manual update',
    principle:       'VIVIT applied to distribution — organism maintains its own life including propagation of its improvements',
  },
});
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
  // SIMULATE GROUP (Paper XXIX — Mirror Governance)
  { id: 'E16', name: 'Variance Simulation Engine', group: 'SIMULATE', file: 'engines/e16-variance-simulation.js', role: 'Generates N proposal variants; simulates consequences against memory field; identifies optimal variant before implementation' },
]);

// ── The 4 Agents ──────────────────────────────────────────────────────────────
export const AGENTS = Object.freeze([
  { codename: 'ARCHON',       className: 'IntegrityAgent',           file: 'agents/integrity.js',        domain: 'Governance integrity — doctrine compliance, conflict detection' },
  { codename: 'VECTOR',       className: 'ExecutionTraceAgent',      file: 'agents/execution-trace.js',  domain: 'Execution mapping — causal chain, canister call trace' },
  { codename: 'LUMEN',        className: 'ContextMapAgent',          file: 'agents/context-map.js',       domain: 'Historical context — precedent, prior proposals, pattern recognition' },
  { codename: 'FORGE',        className: 'VerificationLabAgent',     file: 'agents/verification-lab.js',  domain: 'Verification — executable proof steps, after-state confirmation' },
  // Autonomous research agent (Paper XXIX — Mirror Governance)
  { codename: 'PROTOCOLLUM',  className: 'ProtocolResearchAgent',    file: 'agents/protocollum.js',       domain: 'Autonomous ICP protocol research — always-on career agent; pulls all NNS/SNS data; builds Protocol Knowledge Field; goal-sees patterns and blindspots' },
]);

// ── The 5 Protocols ───────────────────────────────────────────────────────────
export const PROTOCOLS = Object.freeze([
  { id: 'I',   name: 'Governance Consequence', domain: 'Master 6-phase processing path' },
  { id: 'II',  name: 'Truth Ladder',           domain: '8-position truth state machine + advancement conditions' },
  { id: 'III', name: 'Risk Scoring',           domain: 'φ-weighted 6-axis risk classification' },
  { id: 'IV',  name: 'Memory Field',           domain: 'Deposit/evaporate/diffuse + φ-compounding + precedent graph' },
  { id: 'V',   name: 'Agent Council',          domain: 'Parallel invocation, council status derivation, finding lifecycle' },
]);

// ── Sovereign Packets + Operator Terminology (Paper XXVIII) ──────────────────
// When MERIDIAN distributes itself, it does not distribute "SDKs".
// It distributes Sovereign Packets — compute units that carry their own doctrine.
export const SOVEREIGN_DISTRIBUTION = Object.freeze({
  unitName:          'Sovereign Packet',
  unitDescription:   'The distributed unit of MERIDIAN intelligence — carries its own doctrine, heartbeat, governance record, and PROTOCOLLUM endpoint',
  recipientName:     'Operator',
  recipientRole:     'Deploys Sovereign Packets into Sovereign Runtimes; provides operational context; does not override doctrine',
  runtimeName:       'Sovereign Runtime',
  runtimeDescription:'A live deployment of a Sovereign Packet — always alive from start until stop',
  compilationName:   'Packet Compilation',
  compilationRule:   'Autonomous and native — triggered by version bump, not human action; validates all engines before publishing',
  editions: [
    { name: 'Release Sovereign Packet',    path: '/release',    audience: 'External Operators — production deployments' },
    { name: 'Speedster Sovereign Packet',  path: '/speedster',  audience: 'Internal Operators — fast iteration and debugging' },
  ],
});
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
  { roman: 'XXVIII', slug: 'XXVIII-DE-PRIMITIVO',             title: 'De Primitivo',                      keyContrib: 'φ as the ONLY true primitive; everything else is a fracture; Alfredo as complete inventor; Sovereign Packets terminology' },
  { roman: 'XXIX',   slug: 'XXIX-GUBERNATIO-SPECULARIS',      title: 'Gubernatio Specularis',             keyContrib: 'Self-governance + E16 Variance Simulation Engine + PROTOCOLLUM (shadow-to-ICP framing corrected in XXXI)' },
  { roman: 'XXX',    slug: 'XXX-ETHICA-PRIMA',                title: 'Ethica Prima',                      keyContrib: 'Ethics as foundational layer above governance — 14 ethics protocols EP-01–EP-14; doctrine grounded in Biblical principles; ethics controls governance' },
  { roman: 'XXXI',   slug: 'XXXI-UNIVERSALIS-GUBERNATIO',     title: 'Universalis Gubernatio',            keyContrib: 'Multi-system governance — 200+ canisters, ICP as entry point not only target; corrects XXIX shadow mirror framing; npm auto-update = VIVIT at distribution layer' },
  // arXiv academic papers — separate series, written for academic audiences
  { roman: 'ARXIV-A', slug: 'arxiv/CS-MA-collective-intelligence-blockchain-governance', title: 'Collective Intelligence Mechanisms for Blockchain Governance Consequence Tracing', keyContrib: 'cs.MA: stigmergy + quorum sensing applied to blockchain governance; pheromone deposit formalization; compounding intelligence property' },
  { roman: 'ARXIV-B', slug: 'arxiv/CS-CR-conservation-laws-sovereign-compute',           title: 'Conservation Laws of Sovereign Compute Architectures',                            keyContrib: 'cs.CR: Noether theorem applied to software sovereignty — SL-0 through SL-4; symmetry breaks as detectable events' },
  { roman: 'ARXIV-C', slug: 'arxiv/CS-AI-behavioral-economics-governance-intelligence',  title: 'Behavioral Economics Laws as Architectural Constraints in AI Governance Intelligence Systems', keyContrib: 'cs.AI: L72–L79 as architectural constraints; L78 Right to Both Frames as AI manipulation prevention' },
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
  SIMULATE: ENGINES.filter(e => e.group === 'SIMULATE'),
});

export const AGENTS_BY_CODENAME = Object.freeze(
  Object.fromEntries(AGENTS.map(a => [a.codename, a])),
);

// ── Full catalog (single import) ──────────────────────────────────────────────
export const ECOSYSTEM_CATALOG = Object.freeze({
  identity:              SYSTEM_IDENTITY,
  behavioralLaws:        BEHAVIORAL_LAWS,
  conservationLaws:      CONSERVATION_LAWS,
  ethicsProtocols:       ETHICS_PROTOCOLS,
  multiSystemScope:      MULTI_SYSTEM_SCOPE,
  math:                  MATHEMATICAL_LAWS,
  engines:               ENGINES,
  enginesByGroup:        ENGINES_BY_GROUP,
  engineById:            ENGINES_BY_ID,
  agents:                AGENTS,
  agentByCodename:       AGENTS_BY_CODENAME,
  protocols:             PROTOCOLS,
  sdkEditions:           SDK_EDITIONS,
  sovereignDistribution: SOVEREIGN_DISTRIBUTION,
  canisters:             CANISTERS,
  charters:              CHARTERS,
  papers:                PAPERS,
  pipeline:              DOCUMENT_PIPELINE,
  supportingSdks:        SUPPORTING_SDKS,
  generatedAt:           '2026-04-27T09:00:00.000Z',
});

export default ECOSYSTEM_CATALOG;
