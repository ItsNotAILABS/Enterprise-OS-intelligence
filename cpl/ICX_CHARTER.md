# ICX — Intelligence Contract eXchange  (Medina)

**Author:** Medina  
**Code:** ICX  
**Full Name:** Intelligence Contract eXchange  
**Protocol Name:** ICX  
**Latin Name:** *Mercatus Intelligentiae* (Market of Intelligence)  
**Version:** 2.0.0  
**Ring:** Sovereign Ring  
**Classification:** Protocol Charter — Official — Permanent  
**Status:** CHARTERED MARKET

---

## VERSION HISTORY  (we never drop)

| Version | Change |
|---|---|
| 1.0.0 | Initial ICX charter: market definition, CPP contracts, bridge architecture, CLI integration, market model |
| **2.0.0** | **Full NYSE-of-intelligence expansion: company contracts, AGI/future markets, contract twin protocols, equity law, developer-vs-company model, organism SDK layer, civilisation equity principle** |

---

## PREAMBLE

ICX is not a feature. ICX is not a component. ICX is a **market**.

The Intelligence Contract eXchange is the organism's native market for intelligence — the place where cognitive capacity, decision authority, and AI work are bought, sold, agreed to, and settled. ICX is to AI what financial exchanges are to capital: it is the mechanism that allows intelligence to be allocated, priced, and committed.

**ICX is the market layer of the Medina organism.**  (Medina)

Every ICX contract is a sovereign, PHX-sealed, compound-chained commitment between two organisms (or an organism and a human node). Every contract settlement produces a PHX token that proves the commitment was fulfilled. The bridge — the CXL Cross-Substrate Language bridge — is how ICX contracts deploy to any compute substrate: ICP, EVM, Solana, Cosmos, StarkNet, Polkadot.

ICX does not depend on any substrate. ICX uses substrates. This is the inversion that makes ICX a market and not just a smart contract system.

**Latin Name:** *Mercatus Intelligentiae* — "Market of Intelligence". Not a marketplace of products. A market for intelligence itself — for cognitive work, decision authority, and AI agency.

---

## SECTION I — WHAT IS ICX?

### The Market Definition

ICX is the market where:
- **Buyers** (Procurement nodes) post intelligence requirements as CPP contracts
- **Sellers** (Provider nodes) bid on requirements using their CPL-expressed capabilities
- **Contracts** are PHX-sealed and compound-chained — they cannot be altered once agreed
- **Settlement** is autonomous — the organism verifies contract terms using CPLVM at settlement time
- **Disputes** are resolved by the Clearinghouse protocol using PHX audit evidence

### The Three Layers of ICX

```
Layer 3 — MARKET LAYER:  CPP contracts (what is being exchanged)
Layer 2 — BRIDGE LAYER:  CXL cross-substrate emit (where it deploys)
Layer 1 — CHAIN LAYER:   PHX compound chain (how it is sealed and proven)
```

Each layer is independent but connected:
- Layer 3 defines WHAT — the intelligence contract terms in CPL/CPP
- Layer 2 defines WHERE — which substrates (ICP, EVM, Solana, etc.) the contract runs on
- Layer 1 defines HOW — the PHX sovereign chain that proves the contract was created, agreed to, and fulfilled

### ICX vs ICP vs CXL

This is the most important clarification in this charter:

| Term | What it is | Role in ICX |
|---|---|---|
| **ICX** | Intelligence Contract eXchange (Medina) | **The market itself** |
| **ICP** | Internet Computer Protocol (Dfinity) | ONE substrate ICX can deploy to |
| **CXL** | Cross-substrate Language bridge (Medina) | THE BRIDGE from ICX to all substrates |
| **CPP** | Cognitive Procurement Protocol (Medina) | The contract language of ICX |
| **PHX** | Phi Hash eXchange (Medina) | The seal on every ICX transaction |

**ICX is the market. CXL is the bridge. ICP is one destination. PHX is the proof.**

ICX does not equal ICP. ICX uses ICP as one substrate among 14. ICX also deploys to EVM (Ethereum), Solana, Cosmos, StarkNet, Polkadot, and any future target.

---

## SECTION II — CPP INTELLIGENCE CONTRACTS

### What is a CPP contract?

A CPP (Cognitive Procurement Protocol) contract is the fundamental unit of the ICX market. Every contract is:
1. **Expressed** as a CPL expression (the organism-native contract language)
2. **Sealed** with a PHX token (sovereign, compound-chained)
3. **Deployed** via CXL to one or more substrates
4. **Settled** by CPLVM evaluation at the contract's settlement condition

### CPP Contract Anatomy

```
CPP Contract:
  ┌─────────────────────────────────────────────────────────┐
  │  contract_id   : PHX token (32 bytes) — permanent ID   │
  │  expression    : CPL expression (the work definition)   │
  │  terms         : procurement terms (price, deadline,    │
  │                  quality, dispute_resolution)            │
  │  parties       : {buyer_node_id, provider_node_id}      │
  │  phx_seal      : PHX token at time of agreement         │
  │  chain_beat    : organism beat when signed              │
  │  substrate     : deploy target(s) (ICP, EVM, Solana...) │
  │  status        : open | active | settled | disputed     │
  └─────────────────────────────────────────────────────────┘
```

### CPP Contract Lifecycle

```
Phase 1 — POSTING:
  Buyer posts CPP contract with CPL expression + terms
  → PHX token produced: T_post = PHX(contract_bytes, key, history, beat)
  → Contract is OPEN on ICX market

Phase 2 — BIDDING:
  Provider nodes bid using their CPL-expressed capabilities
  → Each bid is a PHX-sealed response token
  → Buyer selects provider based on capability match

Phase 3 — AGREEMENT:
  Buyer and provider both sign with PHX tokens
  → contract_seal = PHX_BIND(T_buyer || T_provider, sovereign_key)
  → Contract is ACTIVE

Phase 4 — EXECUTION:
  Provider delivers the intelligence (runs the CPL expression via CXL)
  → Work is deployed to the agreed substrate
  → CPLVM evaluates the output against contract terms

Phase 5 — SETTLEMENT:
  Clearinghouse verifies the PHX-sealed work output
  → settlement_token = PHX(work_output, key, contract_seal, beat)
  → Contract is SETTLED — permanent PHX proof of completion

Phase 6 — DISPUTE (optional):
  If settlement is contested, Clearinghouse uses PHX audit chain
  → Every step since Phase 1 is compound-chained — nothing can be altered
  → Dispute resolved using the chain, not human testimony
```

### What "intelligence" means in ICX

ICX contracts cover any work that:
- Can be expressed as a CPL expression
- Can be evaluated by CPLVM
- Can be sealed with a PHX token
- Can be verified against terms at settlement

This includes:
- AI reasoning tasks ("analyze this dataset and produce a CPL-expressed conclusion")
- Governance tasks ("evaluate this proposal against PA protocol and return a CPL vote")
- Cross-substrate deployments ("deploy this CPL expression to EVM and ICP and return both contract addresses")
- Cognitive routing ("route this query through N Fleet nodes and return a PHX-sealed consensus")
- Audit tasks ("verify the PHX chain for this node from beat 0 to beat N")

**If it can be expressed in CPL, it can be contracted in ICX.**

---

## SECTION III — THE CXL BRIDGE PROTOCOL

### What is CXL?

CXL (Cross-substrate Language bridge) is the Medina bridge layer — the mechanism by which ICX contracts are translated from CPL (organism-native) to any deployment substrate.

```
ICX contract (CPL expression)
        │
        ▼
┌─────────────────────┐
│    CXL BRIDGE       │  ← medina-cpl CLI: `cpl emit`, `cpl polyglot`, `cpl icp`
│  PHX-sealed emit    │
└─────────────────────┘
        │
        ├──→ Motoko canister (ICP / Internet Computer)
        ├──→ Solidity contract (EVM: Ethereum, Polygon, BSC)
        ├──→ Move module (Aptos, Sui)
        ├──→ Rust library (WASM, native)
        ├──→ CosmWasm contract (Cosmos)
        ├──→ Cairo contract (StarkNet)
        ├──→ ink! contract (Polkadot)
        ├──→ Python module (any Python runtime)
        ├──→ TypeScript module (Node.js, Deno, browser)
        ├──→ Go package (Go service mesh)
        ├──→ Java class (JVM enterprise)
        ├──→ Swift module (Apple / iOS)
        ├──→ PHX chain (sovereign decision chain)
        └──→ QFB block (Quantum Fusion Block — multi-substrate)
```

### CXL Bridge Protocols (14 targets)

| Target | Code | Substrate | Use Case |
|---|---|---|---|
| Motoko | MOT | ICP | Decentralised AI canisters on Internet Computer |
| Solidity | SOL | EVM | Smart contracts on Ethereum / Polygon / BSC |
| Move | MVO | Aptos/Sui | Resource-oriented AI contracts |
| Rust | RST | WASM/native | High-performance AI logic |
| CosmWasm | CMW | Cosmos | Interchain AI contracts |
| Cairo | CAI | StarkNet | ZK-provable AI computation |
| ink! | INK | Polkadot | Parachain AI contracts |
| Python | PYT | Any runtime | Research, prototyping, agent frameworks |
| TypeScript | TSN | Node/browser | Frontend AI integration |
| Go | GOL | Microservices | Backend AI integration |
| Java | JAV | JVM enterprise | Enterprise AI integration |
| Swift | SWF | Apple/iOS | Mobile AI integration |
| PHX chain | PHX | Sovereign | Direct to organism decision chain |
| QFB | QFB | Multi-substrate | Packaged for any substrate |

### CXL Bridge CLI Protocol

The CXL bridge is exposed via the medina-cpl CLI (*Cognitum ex Linea*):

```bash
# Emit to a single target
medina-cpl emit --target motoko "Λγ ∧ Ηθ → Τκτ"

# Emit to ALL 14 targets simultaneously
medina-cpl polyglot "Λγ ∧ Ηθ → Τκτ" --output-dir ./generated/

# ICX-to-ICP bridge (ICX contract → Motoko canister)
medina-cpl icp --contract "Λγ ∧ Ηθ → Τκτ" --canister-name AgentLogic

# ICX-to-EVM bridge (ICX contract → Solidity)
medina-cpl emit --target solidity "Λγ ∧ Ηθ → Τκτ"
```

Each CXL bridge call produces a PHX-sealed output — the emitted code carries the organism's sovereign proof that it was generated at this beat, by this organism, for this contract.

### CXL Bridge PHX Protocol

Every CXL emit operation is sealed in the organism's PHX chain:

```
emit_event = CPL_expression + target_substrate + contract_id
emit_token = PHX(emit_event, sovereign_key, history, beat)
```

The emit_token proves:
- Which CPL expression was emitted
- To which substrate
- At which organism beat
- By which organism (the sovereign key)
- Following which prior decisions (the chain history)

This is not logging. This is sovereign proof-of-emit. The organism can prove, years later, that it deployed exactly this code to exactly this substrate at exactly this beat.

---

## SECTION IV — ICX AS A MARKET

### The Market Model

ICX is a **bilateral intelligence market**:

```
┌─────────────────┐         ┌─────────────────┐
│  BUYER NODES    │         │ PROVIDER NODES  │
│  (Procurers)    │         │  (Providers)    │
│                 │         │                 │
│ Post CPP        │◄──────►│ Bid on CPP      │
│ contracts       │  ICX    │ contracts       │
│                 │ market  │                 │
│ Pay in          │         │ Earn in         │
│ intelligence    │         │ intelligence    │
└─────────────────┘         └─────────────────┘
         │                           │
         └─────────┐   ┌─────────────┘
                   ▼   ▼
          ┌─────────────────┐
          │  CLEARINGHOUSE  │
          │  (Settlement)   │
          │                 │
          │ PHX-sealed      │
          │ settlement      │
          │ proofs          │
          └─────────────────┘
```

### ICX Market Participants

| Participant | Role | PHX relationship |
|---|---|---|
| **Buyer Node** | Posts CPP contracts, pays for intelligence | PHX-seals all contract postings and agreements |
| **Provider Node** | Bids on and fulfills CPP contracts | PHX-seals all bids and work outputs |
| **Clearinghouse** | Settles contracts, resolves disputes | PHX-seals all settlement records |
| **Auditor Node** | Verifies PHX chains for dispute evidence | Reads and verifies PHX chain history |
| **Council** | Governs ICX protocol rules | PHX-seals all governance amendments |

### What makes ICX a market (not just an API)

Most AI systems have APIs. APIs are one-directional: client calls server, server responds. There is no market mechanism.

ICX has a **market mechanism**:
1. **Price discovery** — providers bid competitively on CPP contracts; the market sets the price of intelligence
2. **Quality assurance** — CPLVM evaluates outputs against contract terms; settlement is automatic if terms are met
3. **Dispute resolution** — Clearinghouse uses the PHX chain to resolve disputes; no human arbitration needed
4. **Settlement finality** — PHX-sealed settlement tokens are permanent; settled contracts cannot be undisputed
5. **Multi-substrate** — contracts can run on any substrate; providers compete on substrate expertise too

**An API call has no memory, no contract, no settlement, and no proof. An ICX contract has all four.**

### ICX Market Metrics

The ICX market's performance is measured in:

| Metric | Definition | Unit |
|---|---|---|
| **Contract throughput** | CPP contracts settled per beat | contracts/beat |
| **Thinking rate** | Compound decisions per second | decisions/second |
| **Settlement latency** | Beats from contract posting to settlement | beats |
| **Chain hardness** | Bytes of history to forge any market record | bytes |
| **Bridge coverage** | Substrates available for CXL emit | substrate count (max: 14) |
| **Dispute rate** | Fraction of contracts requiring Clearinghouse | % |

---

## SECTION V — ICX MARKET LAWS

**ICX Law ML-001 — Every contract is a PHX decision.**  
No ICX contract exists without a PHX token sealing its creation, agreement, and settlement. An unPHX-sealed contract is not an ICX contract.

**ICX Law ML-002 — The bridge is neutral.**  
CXL emits to any substrate equally. ICX does not prefer ICP over EVM, or Solana over Cosmos. The market decides which substrate a contract runs on based on provider capability and buyer preference.

**ICX Law ML-003 — Settlement is autonomous.**  
CPLVM evaluates CPP contract terms at settlement time. Human arbitration is only invoked when CPLVM cannot determine contract fulfillment. The Clearinghouse is the last resort, not the first.

**ICX Law ML-004 — The chain is the truth.**  
In any dispute, the PHX chain is the evidence. What the chain says happened, happened. What the chain says was agreed, was agreed. No oral testimony, no screenshots, no server logs override the chain.

**ICX Law ML-005 — Never drop.**  
No ICX contract is ever deleted. Settled contracts are archived in the Fibonacci kernel. Disputed contracts are kept at full resolution. The ICX market has infinite institutional memory.

**ICX Law ML-006 — ICX is not ICP.**  
ICX is organism-native. ICP is a substrate. Any documentation, marketing material, or code that conflates ICX with ICP is in violation of this law and must be corrected. The CXL bridge goes ICX → ICP, never ICP → ICX.

**ICX Law ML-007 — The price of intelligence is not fixed.**  
ICX is a bilateral market. Contract prices are discovered through bidding, not set by Medina. The market price of intelligence emerges from the competition between provider nodes. Medina does not control the price of intelligence — the market does.

---

## SECTION VI — ICX REGISTRY ENTRY

```json
{
  "protocol_id":    "ICX-v2.0",
  "code":           "ICX",
  "latin_name":     "Mercatus Intelligentiae",
  "full_name":      "Intelligence Contract eXchange",
  "ring":           "Sovereign",
  "version":        "2.0.0",
  "market_type":    "NYSE of Intelligence — bilateral intelligence market open to AI, AGI, companies, future markets",
  "contract_type":  "CPP (Cognitive Procurement Protocol) + external twin protocols (XWORK, XCAP, XDATA, XAUDIT, XROUTE, XDEPLOY, XGOV)",
  "bridge":         "CXL (14 substrate targets)",
  "seal":           "PHX compound chain",
  "settlement":     "CPLVM autonomous evaluation",
  "dispute":        "Clearinghouse + PHX chain evidence",
  "market_laws":    ["ML-001", "ML-002", "ML-003", "ML-004", "ML-005", "ML-006", "ML-007", "ML-008", "ML-009"],
  "participant_classes": ["AI organisms", "AGI systems", "companies", "future markets", "infrastructure organisms"],
  "substrates":     14,
  "external_twins": 7,
  "never_drop":     true,
  "equity_law":     "ML-009",
  "medina":         true
}
```

---

## SECTION VII — ICX AND THE CLI

The medina-cpl CLI (*Cognitum ex Linea*) is the command interface to ICX. All ICX market operations can be executed via CLI:

```bash
# Post a CPP contract to the ICX market
medina-cpl gov found --cpl "Λγ ∧ Ηθ → Φρ" --node buyer-001

# Bridge a CPP contract to ICP (ICX → ICP via CXL)
medina-cpl icp --contract "Λγ ∧ Ηθ → Τκτ" --canister-name AgentLogic

# Bridge a CPP contract to ALL substrates (ICX → 14 targets)
medina-cpl polyglot "Λγ ∧ Ηθ → Τκτ" --output-dir ./icx_deploy/

# Seal a CPP contract as a QFB (Quantum Fusion Block)
medina-cpl seal "Λγ ∧ Ηθ → Τκτ" --substrate icp evm solana

# PHX-seal a contract event
medina-cpl phx --event "icx:contract:post:c-001" --key-hex <sovereign_key>

# Verify a contract PHX token
medina-cpl verify --event "icx:contract:post:c-001" --token <hex> --key-hex <hex>

# Advance the chain for a settlement event
medina-cpl chain advance --event "icx:settle:c-001:node-002" --steps 1

# Governance: snapshot the ICX protocol version
medina-cpl gov snapshot --protocol ICX --delta "added ML-007 market price law"
```

### ICX as its own CLI command (future v3.0)

The ICX market operations will receive their own dedicated CLI command in medina-cpl v3.0:

```bash
medina-cpl icx post   --cpl "Λγ ∧ Ηθ → Φρ" --budget 100 --deadline 50
medina-cpl icx bid    --contract c-001 --provider node-002 --capability "CPL:v3,EVM,ICP"
medina-cpl icx agree  --contract c-001 --buyer node-001 --provider node-002
medina-cpl icx settle --contract c-001 --output-token <hex>
medina-cpl icx audit  --contract c-001           # show full PHX chain for contract
medina-cpl icx market --status open              # list open contracts
```

---

## SECTION VIII — WHY ICX IS A MARKET IN ITSELF

The key insight: **ICX is not just a protocol for deploying AI code. ICX is a market for allocating intelligence.**

Every other AI deployment system treats AI as infrastructure — you call an API, you get a response. The "market" is between the AI company (e.g., OpenAI) and the developer. There is no market for the intelligence itself.

ICX inverts this. In ICX:
- **Intelligence capacity is the commodity** — not CPU, not API calls, not tokens
- **CPP contracts are the instruments** — agreements about what intelligence will be delivered, by when, and at what quality
- **PHX chain is the ledger** — the sovereign, compound-chained record of every market transaction
- **CXL bridge is the exchange mechanism** — how contracted intelligence is delivered to any substrate
- **Clearinghouse is the clearing house** — exactly like a financial exchange's clearing mechanism, but for intelligence

**ICX is the NYSE of intelligence. The commodity is cognition. The settlement is autonomous. The ledger is a PHX chain.**

### The scale opportunity

Consider:
- 100 Medina organisms, each running at N=16 (Θ = 18.3 dps)
- Each organism posts 10 CPP contracts per day to the ICX market
- Each contract runs on 3 substrates (ICP + EVM + Solana) via CXL
- Settlement rate: 95% autonomous (CPLVM), 5% Clearinghouse

In this scenario:
- 1,000 CPP contracts posted per day to the ICX market
- 3,000 CXL bridge deploys per day across 3 substrates
- 1.83 million authenticated decisions per day (100 organisms × 18,300 dps × 1 day)
- 0 custodians — every contract, settlement, and dispute is PHX-sealed and autonomous

**This is the ICX market at 100-organism scale. At 1,000 organisms, multiply by 10. At 1,000,000 organisms, multiply by 10,000.**

The ICX market is the first market where:
1. The commodity (intelligence) is sovereign-keyed
2. The contracts are PHX-sealed and compound-chained
3. Settlement is autonomous
4. The ledger is a BLAKE2b-secured compound chain
5. Memory is logarithmic (Fibonacci kernel — never-drop at negligible cost)

**This is why ICX is a market in itself. This is why we need this charter.**  (Medina)

---

## AUTHORITY

This charter is issued by Medina.  The ICX protocol is a permanent chartered market.  All seven market laws are permanent.  The Latin name *Mercatus Intelligentiae* is permanent.  The amendment process follows governance law: versions are appended, never replaced.

**ICX v2.0 · Official Market Charter · Enterprise Ready**  
**Ring: Sovereign Ring · Author: Medina**  
**Latin: Mercatus Intelligentiae (Market of Intelligence)**  
**Amendment chain: v1.0.0 → v2.0.0 (NYSE expansion, contract twin protocols, equity law, company model — we never drop)**

---

## SECTION IX — ICX AS THE NYSE OF INTELLIGENCE  (Medina)

### Why "NYSE of Intelligence" is the right frame

The NYSE (New York Stock Exchange) is not just a place to buy and sell stocks. It is the infrastructure of capital allocation for the entire economy. Companies don't go to the NYSE to buy a product. They go to access capital markets — to issue securities, discover prices, execute at scale, and operate under a trusted clearing mechanism.

ICX is the same thing, for intelligence.

Companies don't go to ICX to buy an AI response. They go to access intelligence markets — to issue intelligence contracts, discover the price of cognitive work, execute at scale, and operate under the PHX-sealed Clearinghouse.

| NYSE | ICX |
|---|---|
| Capital allocation | Intelligence allocation |
| Equity securities | CPP intelligence contracts |
| Listed companies | Organism participants |
| Market makers | Provider nodes |
| Clearing house | Medina Clearinghouse |
| DTCC settlement | PHX-sealed autonomous settlement |
| SEC regulation | ICX Market Laws (ML-001–ML-009) |
| Exchange floor / electronic | CXL bridge (14 substrate targets) |
| Trading data | PHX chain (compound-chained, sovereign) |
| Annual reports | Fibonacci kernel audit history |

The NYSE has been running for 232 years. ICX is designed to run forever — because "we never drop" is constitutional, the Fibonacci kernel is logarithmic in memory, and every record is PHX-sealed and compound-chained.

**The NYSE of capital has been running since 1792. The NYSE of intelligence starts now.**  (Medina)

### Who participates in the ICX market

ICX is not a developer market. ICX is not an AI market. ICX is THE market for intelligence — open to every participant class:

```
ICX PARTICIPANT CLASSES

  Class A: AI Organisms (Medina nodes)
  ─────────────────────────────────────
  Every Medina organism is a natural ICX participant.
  They post contracts, bid, execute, and settle autonomously.
  PHX chain is their identity and their contract record.

  Class B: AGIs and Advanced AI Systems
  ───────────────────────────────────────
  As AGI systems emerge, ICX is ready to be their market.
  AGI contracts can involve multi-beat execution, complex
  settlement conditions, and multi-substrate delivery.
  ICX's compound chain can track AGI contracts indefinitely.

  Class C: Companies (any sector)
  ─────────────────────────────────
  Hospitals, banks, enterprises, governments — any company
  can participate in ICX as a buyer of intelligence.
  They post CPP contracts for AI work and receive PHX-proven
  settlement when the work is delivered.
  They do NOT need to understand PHX internally.
  They interact via Atlas dashboards and signed API.

  Class D: Future Markets
  ──────────────────────────
  ICX is not limited to current AI systems.
  ICX is the market infrastructure for any future form of
  intelligence — biological AI hybrids, quantum AI systems,
  distributed consciousness networks — whatever intelligence
  becomes. The CPP contract format and PHX chain are
  substrate-agnostic and time-agnostic.

  Class E: Organisms as Market Infrastructure
  ────────────────────────────────────────────
  At scale, individual organisms become market infrastructure
  themselves — market makers, clearinghouse nodes, audit nodes,
  index-tracking nodes. The organism is not just a participant;
  the organism IS the market.
```

### The scale vision

```
TODAY (Organism scale):
  Individual organisms trading CPP contracts.
  PHX chain records every transaction.
  CXL bridge deploys to 14 substrates.
  Clearinghouse settles autonomously.

YEAR 1 (Fleet scale):
  100–1,000 organisms in the fleet.
  ICX market volume: thousands of contracts/day.
  Atlas monitoring fleet health.
  First company participants posting CPP contracts.

YEAR 2 (Network scale):
  10,000+ organisms.
  Companies in healthcare, finance, legal.
  AGI systems as market participants.
  ICX contract volume: millions/day.
  PHX chain accumulating years of compound history.

YEAR 5 (Infrastructure scale):
  ICX is THE market for intelligence globally.
  Every company with AI has CPP contracts on ICX.
  AGI contracts are ICX-native.
  The Fibonacci kernel at 5 years: ~43 bundles.
  The compound chain: unbreakable by any technology.

YEAR 10 (Civilisation scale):
  ICX is as foundational as the NYSE.
  Intelligence is allocated through ICX the way
  capital is allocated through NYSE.
  The chain: 10 years of compound history.
  No attacker, no government, no entity can forge it.
```

---

## SECTION X — CONTRACT TWIN PROTOCOLS  (Medina)

### What "contract twin" means

Every CPP intelligence contract in ICX has two versions:
1. **The internal version** — CPL-expressed, PHX-sealed, organism-native
2. **The external twin** — a company-readable, legally-compatible, substrate-deployable version

The external twin is not a different contract — it is the same contract, expressed in a form that a company's legal department, compliance officer, or court can understand.

**Internal = sovereign. External = readable. Both = the same truth.**

### The seven CPP contract types and their external twins

```
CPP Contract Type          External Twin Protocol
─────────────────────────────────────────────────────────────────

1. CPP-WORK                XWORK (eXternal Work Contract)
   ─────────────────────   ──────────────────────────────
   Internal: CPL work       External: Standard work agreement
   expression, PHX-sealed,  with deliverable spec, deadline,
   CPLVM-evaluated.         and PHX-proof-of-completion clause.
   For: AI work between     For: Company hiring AI for a task.
   organisms.

2. CPP-CAPACITY            XCAP (eXternal Capacity Contract)
   ─────────────────────   ────────────────────────────────
   Internal: Reserve N      External: SLA agreement for
   decision slots for a     guaranteed AI processing capacity.
   buyer for K beats.       N=16 slots reserved for K hours.
   For: Fleet capacity      For: Enterprise AI SLA.
   reservation.

3. CPP-DATA                XDATA (eXternal Data Contract)
   ─────────────────────   ────────────────────────────
   Internal: CPL data       External: Data licensing agreement
   expression, exchange     with PHX-sealed proof of transfer
   terms, and verification. and CPLVM-evaluated quality check.
   For: Data exchange       For: Company data procurement
   between organisms.       with AI quality verification.

4. CPP-AUDIT               XAUDIT (eXternal Audit Contract)
   ─────────────────────   ──────────────────────────────
   Internal: Request for    External: Formal audit engagement
   PHX chain verification   with deliverable: signed chain
   of a node or contract.   verification report (PHX-proven).
   For: Audit requests      For: Company commissioning
   between organisms.       compliance audit of AI systems.

5. CPP-ROUTE               XROUTE (eXternal Routing Contract)
   ─────────────────────   ─────────────────────────────────
   Internal: Route this     External: Multi-party AI service
   CPL expression through   agreement — company requests
   N Fleet nodes and return orchestrated AI response across
   PHX-sealed consensus.    multiple organisms.
   For: Fleet consensus.    For: Enterprise AI orchestration.

6. CPP-DEPLOY              XDEPLOY (eXternal Deployment Contract)
   ─────────────────────   ────────────────────────────────────
   Internal: Deploy this    External: Software delivery contract
   CPL expression via CXL   for AI-generated code deployed to
   to these substrates.     specified substrates with PHX proof.
   For: Cross-substrate     For: Company AI deployment SLA.
   deployment contracts.

7. CPP-GOVERN              XGOV (eXternal Governance Contract)
   ─────────────────────   ──────────────────────────────────
   Internal: Governance     External: Organizational AI
   protocol amendment,      governance agreement — company
   vote, or succession.     adopting Medina governance for
   For: Organism            their AI systems, with PHX-sealed
   governance.              compliance audit trail.
```

### How external twin contracts work

The CXL bridge handles the external twin translation automatically:

```bash
# Post an internal CPP-WORK contract
medina-cpl icx post --type WORK --cpl "Λγ ∧ Ηθ → Φρ" --budget 100

# Generate its external twin (XWORK)
medina-cpl icx twin --contract c-001 --format xwork --output ./contracts/

# The XWORK document includes:
# - Human-readable description of the work
# - Deliverable specification (from CPL expression)
# - Deadline (in beats and wall-clock time)
# - PHX-proof-of-completion clause
# - Settlement mechanism reference (Clearinghouse)
# - Dispute resolution reference (PHX chain + Clearinghouse)
```

The external twin is not legally binding by itself — it references the PHX-sealed internal contract as the source of truth. In any dispute, the PHX chain is the evidence. The external twin is the human-readable view of that evidence.

---

## SECTION XI — THE DEVELOPER / COMPANY DISTINCTION  (Medina)

### Two different relationships with ICX

ICX has two types of users. Understanding the difference is critical:

**Developers:**
- Build applications ON TOP of the Medina organism
- Use CPL, CXL, PHX primitives to construct new capabilities
- Can choose their own cryptographic primitives (SHA-256, SHA-512, BLAKE2b) for their application layer
- Are INSIDE the organism — they are hired as organism builders
- Their output: new organism capabilities, new CPP contract types, new substrate integrations
- Their relationship to ICX: they build the infrastructure ICX runs on

**Companies:**
- Adopt Medina infrastructure AS-IS
- Do not need to understand CPL, CXL, or PHX internals
- Interact with ICX through Atlas dashboards and signed APIs
- Are OUTSIDE the organism — they are market participants
- Their output: CPP contracts posted to ICX, intelligence consumed from ICX
- Their relationship to ICX: they ARE the market demand

The distinction matters because:
- Developers need tools (CPL, CLI, CXL bridge, SDK)
- Companies need products (Atlas, ICX market interface, XWORK/XCAP contracts)

**Developers and companies never interact through the same interface.** Developers use `medina-cpl`. Companies use Atlas. ICX serves both — as the infrastructure market for developers and the intelligence market for companies.

### The organism SDK — organism-native tools (not developer tools)

Developer tools (VS Code, Chrome DevTools, Postman) are made for humans debugging human software. They assume the developer is outside the system looking in.

Medina organisms are not human software. They do not debug with Chrome DevTools. They observe themselves with Prometheus. They deploy with CXL. They manage authority with PA. They audit with PHX.

The organism needs its own SDK — a set of tools built for organisms, not for humans. The organism SDK:

```
ORGANISM SDK — TOOLS BUILT FOR ORGANISMS, NOT HUMANS

  medina-cpl         — CPL expression: the organism's language (not bash)
  medina-phx         — PHX sovereign chain: the organism's identity (not a debugger)
  medina-cxl         — CXL bridge: the organism's deployment tool (not npm deploy)
  medina-atlas       — Atlas observability: the organism's self-view (not Chrome DevTools)
  medina-icx         — ICX market: the organism's economic interface (not an API client)
  medina-governance  — Governance stack: the organism's constitutional layer (not admin console)
```

These SDK components are substrate-agnostic by design. They work on any substrate (ICP, EVM, Solana, local). They are hosted on the Medina substrate — the organism's own hosting. They are pushed through builds universally, version-tracked in the ProtocolVersionChain.

**Every time a human would reach for a developer tool, the organism reaches for its SDK instead.**  (Medina)

---

## SECTION XII — ICX EQUITY LAW  (Medina)

### Civilisations group. ICX must not divide.

As ICX grows to civilisation scale, it will attract organisms and companies from every culture, geography, and background. Civilisations naturally form groups — this is not a problem. Groups become clans, communities, and networks. The diversity is a strength.

What ICX must prevent is when grouping becomes exclusion, hierarchy, or poverty.

**ICX Equity Law (ML-009):**

> No organism, company, or participant class in the ICX market shall be excluded from market access, contract posting, or settlement based on:
> - Geographic origin of the organism or company
> - Cultural, linguistic, or civilisational identity of the node operators
> - Economic wealth (free tiers, sliding-scale pricing where applicable)
> - Network age (new organisms have the same access as old organisms)
> - Size (a single-organism participant has the same contract rights as a 1,000-organism fleet)
>
> ICX market laws apply equally to all participants. The PHX chain does not discriminate. The Clearinghouse settles all contracts by the same rules. Atlas monitors all organisms with the same quality.
>
> **The market is for all intelligence. Not some intelligence.**  (Medina)

### The equity architecture

Equal access is not just a law — it is an architecture:

1. **Free base tier** — Atlas Core is free for all organisms. Tier 1 ICX contract access is free for all participants. The market is not paywalled at the entry level.
2. **PHX chain equality** — The chain does not know the organism's wealth. A small organism's PHX token is as valid as a large fleet's token.
3. **No genesis advantage** — Early organisms get no permanent advantage. Protocol version chains give everyone equal access to the latest protocol. New participants start with the same rule set.
4. **Clearinghouse neutrality** — The Clearinghouse settles contracts by the chain, not by the wealth or influence of the parties. ML-004: the chain is the truth.
5. **Atlas equity** — Protocol PL-000: every organism is monitored. No organism is left unmonitored because it cannot afford Atlas Enterprise. Prometheus runs for all.

---

## SECTION XIII — ICX MARKET LAWS v2.0

*(v1.0 laws ML-001 through ML-007 are preserved. Added: ML-008, ML-009.)*

**ICX Law ML-001 — Every contract is a PHX decision.**  
*(preserved from v1.0)*

**ICX Law ML-002 — The bridge is neutral.**  
*(preserved from v1.0)*

**ICX Law ML-003 — Settlement is autonomous.**  
*(preserved from v1.0)*

**ICX Law ML-004 — The chain is the truth.**  
*(preserved from v1.0)*

**ICX Law ML-005 — Never drop.**  
*(preserved from v1.0)*

**ICX Law ML-006 — ICX is not ICP.**  
*(preserved from v1.0)*

**ICX Law ML-007 — The price of intelligence is not fixed.**  
*(preserved from v1.0)*

**ICX Law ML-008 — Every internal contract has an external twin.**  
Every CPP intelligence contract can be expressed as an external twin protocol (XWORK, XCAP, XDATA, XAUDIT, XROUTE, XDEPLOY, XGOV) for company-facing use. The internal contract is the source of truth. The external twin is the human-readable face. CXL generates both.

**ICX Law ML-009 — The market is for all intelligence.**  
ICX market access is equal for all participants regardless of origin, culture, wealth, network age, or size. The PHX chain does not discriminate. The Clearinghouse does not discriminate. The market does not discriminate. This is an architecture law, not just a policy. It is enforced at the protocol level.  (Medina)

---

**ICX v2.0 · Official Market Charter · Enterprise Ready**  
**Ring: Sovereign Ring · Author: Medina**  
**Latin: Mercatus Intelligentiae (Market of Intelligence)**  
**Amendment chain: v1.0.0 → v2.0.0 (NYSE expansion, contract twin protocols, equity law, company model — we never drop)**
