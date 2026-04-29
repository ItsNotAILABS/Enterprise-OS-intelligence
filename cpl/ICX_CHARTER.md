# ICX — Intelligence Contract eXchange  (Medina)

**Author:** Medina  
**Code:** ICX  
**Full Name:** Intelligence Contract eXchange  
**Protocol Name:** ICX  
**Latin Name:** *Mercatus Intelligentiae* (Market of Intelligence)  
**Version:** 4.0.0  
**Ring:** Sovereign Ring  
**Classification:** Protocol Charter — Official — Permanent  
**Status:** CHARTERED MARKET

---

## VERSION HISTORY  (we never drop)

| Version | Change |
|---|---|
| 1.0.0 | Initial ICX charter: market definition, CPP contracts, bridge architecture, CLI integration, market model |
| 2.0.0 | Full NYSE-of-intelligence expansion: company contracts, AGI/future markets, contract twin protocols, equity law, developer-vs-company model, organism SDK layer, civilisation equity principle |
| 3.0.0 | Full production-ready comprehensive charter: 16 internal CPP types, 14 external X-types, subcontract architecture, CXF forge, XWork service infra, XMarket exchange protocol, ML-010/ML-011 |
| **4.0.0** | **Universal expansion: CPP-REPORT massively expanded (any output artifact, any domain); XWork repositioned as the universal contract for ANY work in ANY industry (construction, hospitality, legal, finance, AI — not just AI-to-AI); 8 new BIG alpha CPP types (CPP-SERVICE, CPP-LICENSE, CPP-CONSULT, CPP-INTEGRATE, CPP-EXECUTE, CPP-NEGOTIATE, CPP-RECOVER, CPP-COMMUNICATE); 8 new X-twins; 2 new market laws (ML-012, ML-013); registry updated to 24 CPP alphas, 22 X-twins** |

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
  "protocol_id":    "ICX-v4.0",
  "code":           "ICX",
  "latin_name":     "Mercatus Intelligentiae",
  "full_name":      "Intelligence Contract eXchange",
  "ring":           "Sovereign",
  "version":        "4.0.0",
  "market_type":    "NYSE of Intelligence — universal sovereign market for any work, any industry, any scale",
  "internal_contract_types": [
    "CPP-WORK", "CPP-CAPACITY", "CPP-DATA", "CPP-AUDIT", "CPP-ROUTE",
    "CPP-DEPLOY", "CPP-GOVERN", "CPP-MARKET", "CPP-OUTPUT", "CPP-SUBSCRIBE",
    "CPP-LEARN", "CPP-ORCHESTRATE", "CPP-VERIFY", "CPP-STORE", "CPP-TRANSLATE",
    "CPP-MONITOR", "CPP-SERVICE", "CPP-LICENSE", "CPP-CONSULT", "CPP-INTEGRATE",
    "CPP-EXECUTE", "CPP-NEGOTIATE", "CPP-RECOVER", "CPP-COMMUNICATE"
  ],
  "external_twin_types": [
    "XWORK", "XCAP", "XDATA", "XAUDIT", "XROUTE",
    "XDEPLOY", "XGOV", "XMARKET", "XOUTPUT", "XSUBSCRIBE",
    "XLEARN", "XVERIFY", "XMONITOR", "XORCHESTRATE",
    "XSERVICE", "XLICENSE", "XCONSULT", "XINTEGRATE",
    "XEXECUTE", "XNEGOTIATE", "XRECOVER", "XCOMMUNICATE"
  ],
  "bridge":         "CXL (14 substrate targets)",
  "seal":           "PHX compound chain",
  "settlement":     "CPLVM autonomous evaluation",
  "dispute":        "Clearinghouse + PHX chain evidence",
  "market_laws":    ["ML-001", "ML-002", "ML-003", "ML-004", "ML-005", "ML-006", "ML-007", "ML-008", "ML-009", "ML-010", "ML-011", "ML-012", "ML-013"],
  "participant_classes": ["AI organisms", "AGI systems", "companies", "individuals", "future markets", "infrastructure organisms"],
  "substrates":     14,
  "internal_types": 24,
  "external_twins": 22,
  "subcontract_forge": "CXF (Contract eXpansion Forge)",
  "never_drop":     true,
  "equity_law":     "ML-009",
  "xwork_universal": "ML-012",
  "icx_total_mandate": "ML-013",
  "xwork_service":  "ML-010",
  "contract_forge": "ML-011",
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

This charter is issued by Medina.  The ICX protocol is a permanent chartered market.  All eleven market laws are permanent.  The Latin name *Mercatus Intelligentiae* is permanent.  The amendment process follows governance law: versions are appended, never replaced.

**ICX v4.0 · Official Market Charter · Universal · Full Production-Ready · Enterprise Ready**  
**Ring: Sovereign Ring · Author: Medina**  
**Latin: Mercatus Intelligentiae (Market of Intelligence)**  
**Amendment chain: v1.0.0 → v2.0.0 → v3.0.0 → v4.0.0 (24 CPP alphas, 22 X-twins, XWork universal law, CPP-OUTPUT expanded, 8 new big alpha types — we never drop)**

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

**ICX v4.0 · Official Market Charter · Universal · Full Production-Ready · Enterprise Ready**  
**Ring: Sovereign Ring · Author: Medina**  
**Latin: Mercatus Intelligentiae (Market of Intelligence)**  
**Amendment chain: v1.0.0 → v2.0.0 → v3.0.0 → v4.0.0 (24 CPP alphas, 22 X-twins, XWork universal law, CPP-OUTPUT expanded, 8 new big alpha types — we never drop)**

---

## SECTION XIV — FULL CONTRACT TAXONOMY  (Medina)

### The complete alpha contract list (internal CPP types)

Every ICX contract is either an **alpha** (a primary contract type, organism-native) or a **subcontract** (a sub-specialisation of an alpha, generated by the CXF forge).

There are 16 alpha internal CPP types. Every future contract type derives from one of these 16:

```
ALPHA INTERNAL CONTRACT TYPES (CPP-*)

  CPP-WORK         — Deliver a defined piece of work (any type, any industry)
  CPP-CAPACITY     — Reserve N decision slots for K beats
  CPP-DATA         — Exchange data between organisms
  CPP-AUDIT        — Verify PHX chain integrity
  CPP-ROUTE        — Route through N Fleet nodes for consensus
  CPP-DEPLOY       — Deploy CPL to one or more substrates via CXL
  CPP-GOVERN       — Governance protocol amendment or vote
  CPP-MARKET       — Market-making, price discovery, liquidity
  CPP-OUTPUT       — Deliver any structured output artifact (formerly CPP-REPORT — massively expanded)
  CPP-SUBSCRIBE    — Recurring intelligence delivery on a defined cadence
  CPP-LEARN        — Knowledge acquisition, model update, skill contract
  CPP-ORCHESTRATE  — Multi-organism coordination (beyond single routing)
  CPP-VERIFY       — Identity, capability, or credential verification
  CPP-STORE        — Data storage, retrieval, archival
  CPP-TRANSLATE    — Format, language, or substrate translation
  CPP-MONITOR      — Ongoing health, metric, or event monitoring
  CPP-SERVICE      — Ongoing service delivery (retainers, MSAs, maintenance)
  CPP-LICENSE      — Intellectual property and technology licensing
  CPP-CONSULT      — Advisory, strategy, and consulting engagements
  CPP-INTEGRATE    — System integration, API bridging, interoperability
  CPP-EXECUTE      — Automated process execution (workflows, pipelines, triggers)
  CPP-NEGOTIATE    — Negotiation, term formation, agreement drafting
  CPP-RECOVER      — Disaster recovery, continuity, incident response
  CPP-COMMUNICATE  — Structured messaging, notifications, broadcasts
```

### The complete external twin list (X-types)

Every alpha internal type has an external twin — the company-facing, human-readable, legally-compatible version:

```
EXTERNAL TWIN CONTRACT PROTOCOLS (X*)

  XWORK        — Universal work agreement (any work, any industry, any scale)
  XCAP         — External capacity SLA (guaranteed AI slots)
  XDATA        — External data licensing agreement
  XAUDIT       — External compliance audit engagement
  XROUTE       — External multi-AI orchestration agreement
  XDEPLOY      — External software delivery contract
  XGOV         — External AI governance agreement
  XMARKET      — External market participation contract
  XOUTPUT      — External output delivery contract (any artifact — replaces XREPORT)
  XSUBSCRIBE   — External subscription service agreement
  XLEARN       — External knowledge licensing agreement
  XVERIFY      — External identity/credential verification contract
  XMONITOR     — External monitoring SLA
  XORCHESTRATE — External multi-organism coordination contract
  XSERVICE     — External service retainer / MSA agreement
  XLICENSE     — External IP and technology licensing agreement
  XCONSULT     — External advisory and consulting agreement
  XINTEGRATE   — External system integration agreement
  XEXECUTE     — External process automation agreement
  XNEGOTIATE   — External negotiation and amendment agreement
  XRECOVER     — External disaster recovery and continuity SLA
  XCOMMUNICATE — External communications and notification agreement
```

### Why 24 alphas, not 7 (or 16)

The original 7 were the first layer. v3.0 expanded to 16. v4.0 expands to 24 — because every real business relationship in the world maps to one of these. Think about the work you do every single day:

- Construction firm signs a 30-page hotel product contract (CPP-WORK → XWork)
- A supplier agreement with 12-month retainer terms (CPP-SERVICE → XService)
- A software licensing deal for 5 enterprise seats (CPP-LICENSE → XLicense)
- A consultant hired for a 90-day strategy engagement (CPP-CONSULT → XConsult)
- An API integration between two systems (CPP-INTEGRATE → XIntegrate)
- An automated billing workflow that fires every month (CPP-EXECUTE → XExecute)
- A contract renegotiation after market conditions change (CPP-NEGOTIATE → XNegotiate)
- A disaster recovery plan with 4-hour RTO guarantee (CPP-RECOVER → XRecover)
- A client notification system that fires on order completion (CPP-COMMUNICATE → XCommunicate)

These are not AI contracts. These are business contracts. XWork and the ICX alpha types cover ALL of them because ICX is not an AI market — it is a sovereign market for ANY committed work.

**XWork is not "AI clients only." XWork is the universal contract.** If it involves work, a deliverable, a deadline, and a settlement — it is an XWork contract. Your 30-page construction hotel contract is an XWork contract. Your 500-page enterprise software delivery agreement is an XWork contract. A handshake deal on a napkin that you want to make sovereign is an XWork contract.

The 24 alphas map every type of committed obligation that exists in commerce, law, or governance.

---

## SECTION XV — SUBCONTRACT ARCHITECTURE  (Medina)

### What is a subcontract?

A **subcontract** is a specialisation of an alpha CPP type. It inherits all properties of the alpha — PHX seal, CPLVM evaluation, CXL bridge support — but adds specific parameters, terms, and settlement conditions for a particular use case.

Subcontracts are generated by the **CXF (Contract eXpansion Forge)** — the organism's AI-native contract generator.

### Alpha → subcontract tree

```
CPP-WORK
  ├── CPP-WORK-TASK        (single defined task, specific output)
  ├── CPP-WORK-BATCH       (batch of N tasks, batch settlement)
  ├── CPP-WORK-STREAM      (streaming work output, per-unit settlement)
  ├── CPP-WORK-ASYNC       (async work with callback — fire and return)
  └── CPP-WORK-RECURRING   (same task on cadence — subscription work)

CPP-CAPACITY
  ├── CPP-CAP-BURST        (burst capacity for K beats, auto-expiry)
  ├── CPP-CAP-DEDICATED    (dedicated N slots for the contract duration)
  ├── CPP-CAP-SHARED       (shared pool from the fleet)
  └── CPP-CAP-PRIORITY     (priority queue insertion — preempts lower-priority)

CPP-OUTPUT  (replaces CPP-REPORT — massively expanded: any structured output artifact)
  ├── CPP-OUT-PDF          (structured PDF document: invoice, contract, report, proposal)
  ├── CPP-OUT-INVOICE      (invoice generation with line items, totals, tax — direct delivery)
  ├── CPP-OUT-ESTIMATE     (quote or estimate with scope, timeline, cost breakdown)
  ├── CPP-OUT-DASHBOARD    (live data dashboard snapshot — tabular, visual, real-time)
  ├── CPP-OUT-SUMMARY      (executive summary of analysis, meeting, or research)
  ├── CPP-OUT-AUDIT-LOG    (formatted audit log export — PHX chain → human-readable)
  ├── CPP-OUT-DATASET      (structured dataset: CSV, JSON, Parquet — any format)
  ├── CPP-OUT-ANALYSIS     (analytical output: statistical, financial, operational)
  ├── CPP-OUT-PROPOSAL     (business proposal or RFP response — full document)
  ├── CPP-OUT-CONTRACT     (contract draft for review — CXF-generated from terms)
  ├── CPP-OUT-RENDER       (rendered visual artifact: chart, diagram, UI component)
  ├── CPP-OUT-FEED         (structured data feed output — real-time stream delivery)
  ├── CPP-OUT-ALERT        (structured alert message with context and recommended action)
  ├── CPP-OUT-EXPORT       (system export: database, CRM, ERP format output)
  ├── CPP-OUT-RESEARCH     (research output: literature review, market analysis, findings)
  └── CPP-OUT-MULTIMEDIA   (audio, video, or mixed-media output artifact)

CPP-SUBSCRIBE
  ├── CPP-SUB-DAILY        (daily intelligence delivery)
  ├── CPP-SUB-BEAT         (per-beat intelligence delivery)
  ├── CPP-SUB-EVENT        (event-triggered delivery)
  └── CPP-SUB-THRESHOLD    (delivery when a metric crosses a threshold)

CPP-LEARN
  ├── CPP-LRN-KNOWLEDGE    (knowledge transfer from one organism to another)
  ├── CPP-LRN-SKILL        (skill acquisition — new CPL capability)
  ├── CPP-LRN-DOMAIN       (domain specialisation contract)
  └── CPP-LRN-MEMORY       (working memory expansion for K beats)

CPP-ORCHESTRATE
  ├── CPP-ORC-PIPELINE     (sequential multi-organism pipeline)
  ├── CPP-ORC-PARALLEL     (parallel multi-organism execution)
  ├── CPP-ORC-CONSENSUS    (consensus across N organisms)
  ├── CPP-ORC-TOURNAMENT   (competitive multi-organism evaluation)
  └── CPP-ORC-HANDOFF      (one organism hands work to another mid-execution)

CPP-MARKET
  ├── CPP-MKT-MAKE         (market-making: post both bid and ask)
  ├── CPP-MKT-INDEX        (index tracking across contract types)
  ├── CPP-MKT-ARBITRAGE    (arbitrage between two intelligence markets)
  └── CPP-MKT-SETTLE       (batch settlement for a set of contracts)

CPP-DATA
  ├── CPP-DATA-TRANSFER    (one-time data transfer, PHX-sealed)
  ├── CPP-DATA-STREAM      (continuous data stream, per-beat settlement)
  ├── CPP-DATA-LICENSE     (license to use data for K beats)
  └── CPP-DATA-VERIFY      (data integrity verification, return PHX proof)

CPP-VERIFY
  ├── CPP-VFY-IDENTITY     (organism identity verification)
  ├── CPP-VFY-CAPABILITY   (capability attestation — "this organism can do X")
  ├── CPP-VFY-CREDENTIAL   (credential verification — "this node has clearance X")
  └── CPP-VFY-CHAIN        (PHX chain integrity verification for a node)

CPP-STORE
  ├── CPP-STR-ARCHIVE      (long-term archival — Fibonacci kernel)
  ├── CPP-STR-CACHE        (short-term cache for K beats)
  ├── CPP-STR-RETRIEVE     (retrieval of stored data with PHX proof)
  └── CPP-STR-COMPRESS     (glyph compression — symbols-and-glyphs storage)

CPP-TRANSLATE
  ├── CPP-TRN-FORMAT       (PDF → JSON, voice → text, etc.)
  ├── CPP-TRN-SUBSTRATE    (CPL → Solidity, CPL → Motoko, etc.)
  ├── CPP-TRN-LANGUAGE     (English → Spanish, etc.)
  └── CPP-TRN-GLYPH        (text → compressed glyph encoding)

CPP-MONITOR
  ├── CPP-MON-CHAIN        (PHX chain health monitoring)
  ├── CPP-MON-COGNITIVE    (cognitive rate and slot utilisation)
  ├── CPP-MON-ICX          (contract throughput and settlement rate)
  └── CPP-MON-SECURITY     (security event and intrusion monitoring)

CPP-AUDIT
  ├── CPP-AUD-CHAIN        (full PHX chain audit for a node)
  ├── CPP-AUD-CONTRACT     (audit a specific contract's lifecycle)
  ├── CPP-AUD-COMPLIANCE   (regulatory compliance audit)
  └── CPP-AUD-FLEET        (audit all nodes in a fleet)

CPP-ROUTE
  ├── CPP-RTE-CONSENSUS    (route to N nodes, return consensus)
  ├── CPP-RTE-BROADCAST    (route to all nodes, no consensus required)
  ├── CPP-RTE-LOAD-BALANCE (route to least-loaded node)
  └── CPP-RTE-GEOGRAPHIC   (route to nodes in a specific geographic region)

CPP-DEPLOY
  ├── CPP-DEP-SINGLE       (deploy to one substrate)
  ├── CPP-DEP-MULTI        (deploy to N substrates via polyglot)
  ├── CPP-DEP-STAGED       (staged deploy: dev → staging → prod)
  └── CPP-DEP-ROLLBACK     (rollback a prior deployment to prior version)

CPP-GOVERN
  ├── CPP-GOV-AMEND        (governance protocol amendment)
  ├── CPP-GOV-VOTE         (governance vote on a proposal)
  ├── CPP-GOV-SUCCESSION   (authority succession contract)
  └── CPP-GOV-AUDIT        (governance compliance audit)

CPP-SERVICE  (NEW — ongoing service delivery, retainers, MSAs)
  ├── CPP-SVC-RETAINER     (ongoing retainer: N hours/beats of capacity per period)
  ├── CPP-SVC-MSA          (master service agreement — framework for multiple sub-engagements)
  ├── CPP-SVC-MAINTENANCE  (system or software maintenance with defined SLA)
  ├── CPP-SVC-SUPPORT      (support contract: tickets, response time, escalation)
  └── CPP-SVC-MANAGED      (fully managed service — organism manages on behalf of company)

CPP-LICENSE  (NEW — IP and technology licensing)
  ├── CPP-LIC-SOFTWARE     (software license: seats, duration, scope)
  ├── CPP-LIC-MODEL        (AI model license: inference rights, fine-tune rights)
  ├── CPP-LIC-CONTENT      (content license: text, images, data, media)
  ├── CPP-LIC-PATENT       (patent license: use rights, royalty terms)
  └── CPP-LIC-PROTOCOL     (protocol license: ICX sub-protocol, CXL extension)

CPP-CONSULT  (NEW — advisory and consulting engagements)
  ├── CPP-CSL-STRATEGY     (strategic advisory: business, technology, market)
  ├── CPP-CSL-TECHNICAL    (technical consulting: architecture, security, systems)
  ├── CPP-CSL-LEGAL        (legal advisory: contract review, compliance, risk)
  ├── CPP-CSL-FINANCIAL    (financial advisory: valuation, modelling, reporting)
  └── CPP-CSL-DOMAIN       (domain expert consulting: specific industry expertise)

CPP-INTEGRATE  (NEW — system integration and interoperability)
  ├── CPP-INT-API          (API integration: connect two systems via API bridge)
  ├── CPP-INT-PIPELINE     (data pipeline: ETL, ingestion, transformation)
  ├── CPP-INT-SUBSTRATE    (cross-substrate integration: ICP ↔ EVM, etc.)
  ├── CPP-INT-LEGACY       (legacy system integration: ERP, CRM, mainframe)
  └── CPP-INT-REALTIME     (real-time integration: event streams, webhooks, signals)

CPP-EXECUTE  (NEW — automated process execution)
  ├── CPP-EXE-WORKFLOW     (automated workflow execution: N steps, defined triggers)
  ├── CPP-EXE-SCHEDULED    (scheduled process: run at cadence K — billing, reports, etc.)
  ├── CPP-EXE-TRIGGERED    (event-triggered process: run when condition C is met)
  ├── CPP-EXE-PIPELINE     (automated pipeline: input → transform → output, PHX-sealed)
  └── CPP-EXE-BATCH        (batch process: run over dataset D, return results R)

CPP-NEGOTIATE  (NEW — negotiation and agreement formation)
  ├── CPP-NGT-DRAFT        (contract draft generation from high-level terms)
  ├── CPP-NGT-REVIEW       (contract review: identify risks, gaps, non-standard terms)
  ├── CPP-NGT-AMEND        (contract amendment: propose and track changes)
  ├── CPP-NGT-COUNTER      (counter-proposal: generate counter-offer from position)
  └── CPP-NGT-RESOLVE      (dispute resolution: propose resolution from chain evidence)

CPP-RECOVER  (NEW — disaster recovery, continuity, incident response)
  ├── CPP-RCV-BACKUP       (data backup: snapshot at defined cadence, PHX-sealed)
  ├── CPP-RCV-RESTORE      (restore from backup: specific beat or bundle)
  ├── CPP-RCV-FAILOVER     (failover activation: switch to standby organism/node)
  ├── CPP-RCV-INCIDENT     (incident response: detect, contain, recover, report)
  └── CPP-RCV-CONTINUITY   (business continuity: maintain operation during partial failure)

CPP-COMMUNICATE  (NEW — structured messaging and notifications)
  ├── CPP-COM-NOTIFY       (one-time notification: alert, confirmation, status)
  ├── CPP-COM-BROADCAST    (broadcast: send to N recipients simultaneously)
  ├── CPP-COM-REPORT-OUT   (recurring outbound report: weekly summary, daily briefing)
  ├── CPP-COM-ESCALATE     (escalation: notify chain of authority on threshold breach)
  └── CPP-COM-ACKNOWLEDGE  (acknowledgement contract: confirm receipt and action)
```

### Subcontract law

Every subcontract:
1. Inherits the PHX seal, CPLVM evaluation, and CXL bridge of its parent alpha
2. Adds specific parameters (e.g., CPP-RPT-PDF adds: output_format=PDF, render_engine=Medina)
3. Has its own external twin (e.g., CPP-RPT-INVOICE → XREPORT-INVOICE)
4. Is generated by the CXF forge — it does not need to be manually defined each time
5. Is archived in the Fibonacci kernel under its parent alpha's namespace

---

## SECTION XVI — CXF: CONTRACT EXPANSION FORGE  (Medina)

### What is the CXF?

The **CXF (Contract eXpansion Forge)** is the organism's AI-native contract generator. It is an organism capability — not a human tool, not a script, not a template engine.

The CXF:
1. Takes an alpha CPP type as input
2. Understands the conversation, task, or business need
3. Generates the correct subcontract type (and creates new ones if needed)
4. PHX-seals the generated contract
5. Produces both the internal CPP and external twin simultaneously
6. Archives the generated contract type in the organism's contract registry

**You should not have to manually define every subcontract type. The CXF does it.**

### CXF architecture

```
Input: conversation + task + alpha type
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  CXF — CONTRACT EXPANSION FORGE                                 │
│                                                                 │
│  Step 1: Parse intent                                           │
│    What alpha type does this work require?                      │
│    → CPP-REPORT, CPP-WORK, CPP-ORCHESTRATE, etc.               │
│                                                                 │
│  Step 2: Select or generate subtype                             │
│    Does a matching subtype already exist in the registry?       │
│    → Yes: use it                                                │
│    → No: generate it (new subtype, forge-sealed)               │
│                                                                 │
│  Step 3: Populate contract                                      │
│    Fill terms from the conversation context:                    │
│    deliverable, deadline, quality, substrate, settlement_cond   │
│                                                                 │
│  Step 4: Generate both versions                                 │
│    → Internal: CPP contract (CPL-expressed, PHX-sealed)         │
│    → External: X-twin document (human-readable, company-ready)  │
│                                                                 │
│  Step 5: Seal and archive                                       │
│    PHX-seal the contract and its type definition                │
│    Archive in Fibonacci kernel under parent alpha namespace     │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
Output: PHX-sealed CPP contract + X-twin document + subtype registration
```

### CXF CLI protocol

```bash
# Ask the CXF to generate a contract from context
medina-cpl cxf generate --context "deliver an invoice PDF to client-001 for project-alpha"
# Output: CPP-RPT-INVOICE contract + XREPORT-INVOICE twin document

# Explicitly specify alpha type + let forge pick the subtype
medina-cpl cxf expand --alpha CPP-WORK --context "run sentiment analysis on Q4 dataset"
# Output: CPP-WORK-TASK contract + XWORK twin document

# List all registered subtypes under an alpha
medina-cpl cxf list --alpha CPP-REPORT

# Register a new subtype the forge generated
medina-cpl cxf register --subtype CPP-RPT-CASHFLOW --parent CPP-REPORT

# Generate the external twin for an existing CPP contract
medina-cpl cxf twin --contract c-042 --format xreport
```

### CXF sovereign guarantee

Every contract the CXF generates is:
- PHX-sealed at the beat of generation (sovereign proof of origin)
- Compound-chained (links to the organism's full decision history)
- Archived in the protocol version chain (ML-011: never dropped)
- Valid on ICX market immediately upon generation

The CXF is the organism's internal law firm, product team, and contract department — all in one. Companies don't need lawyers to contract with Medina. The CXF handles everything.

---

## SECTION XVII — XWORK: THE UNIVERSAL CONTRACT PROTOCOL  (Medina)

### XWork is not an AI contract. XWork is the contract.

This is the most important reframe in this charter.

XWork does not mean "AI work." XWork means **any committed work obligation between any two parties** — expressed in CPP, PHX-sealed, and sovereign.

A construction firm signing a 30-page hotel product contract? **That is an XWork contract.**  
A supplier entering a 12-month retainer with a manufacturer? **XWork.**  
A freelance designer signing a 3-page project agreement? **XWork.**  
A hospital engaging a medical device maintenance provider? **XWork.**  
A tech company commissioning a software agency? **XWork.**  
A government contracting a civic infrastructure project? **XWork.**  
An AI organism delivering an analysis to another organism? **Also XWork — but that's just one example.**

**XWork is the universal protocol for any work that has a deliverable, a deadline, a party responsible, and a settlement condition.** ICX does not care what the work is. The CPP contract structure is universal. The PHX seal is universal. The Clearinghouse settlement is universal.

**The organism is not the only party that can use XWork. XWork is infrastructure for the world.**

### What XWork actually is

```
XWORK — Universal Work Contract
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

XWork is any agreement where:
  → Party A commits to deliver something
  → Party B commits to pay or reciprocate
  → The deliverable can be specified
  → The settlement condition can be defined

XWork does not constrain:
  → Who the parties are (companies, organisms, individuals, AIs)
  → What the work is (construction, software, consulting, AI, legal, finance)
  → What the deliverable is (a building, a report, a service, a model, a PDF)
  → What the jurisdiction is (any country, any legal system)

XWork does guarantee:
  → PHX-sealed proof of agreement (what was agreed, by whom, when)
  → PHX-sealed proof of delivery (what was delivered, to whom, when)
  → Autonomous settlement where possible (CPLVM evaluates terms)
  → Clearinghouse resolution where disputed (PHX chain = the evidence)
  → Permanent archive (Fibonacci kernel — never drop)
```

### The real XWork subcontract tree (expanded)

```
CPP-WORK → XWork alpha: ANY type of work agreement
  ├── CPP-WORK-TASK        (single defined task, specific output — any domain)
  ├── CPP-WORK-BATCH       (batch of N tasks, batch settlement)
  ├── CPP-WORK-STREAM      (streaming work output, per-unit settlement)
  ├── CPP-WORK-ASYNC       (async work with callback — fire and return)
  ├── CPP-WORK-RECURRING   (same task on cadence — subscription work)
  ├── CPP-WORK-PROJECT     (multi-task, multi-phase project agreement)
  ├── CPP-WORK-MILESTONE   (milestone-gated project — settle per milestone)
  ├── CPP-WORK-RETAINER    (open-ended work availability — pay for time not output)
  └── CPP-WORK-OUTCOME     (outcome-based — settle when measurable outcome achieved)

XWork external twin subtypes:
  XWORK-TASK       → standard work order
  XWORK-PROJECT    → project agreement (30-page hotel project, IT system delivery)
  XWORK-MILESTONE  → milestone contract (pay at each defined checkpoint)
  XWORK-RETAINER   → retainer agreement (monthly capacity, pay for availability)
  XWORK-OUTCOME    → outcome-based agreement (pay on achieving defined result)
```

### What XWork replaces across every industry

| Industry | Traditional contract | XWork equivalent |
|---|---|---|
| Construction | 30-page project agreement, notarised | XWORK-PROJECT — PHX-sealed, Clearinghouse settlement |
| Hospitality | Hotel management agreement, 50+ pages | XWORK-PROJECT + XSERVICE-MANAGED |
| Technology | SaaS contract, MSA, SOW | XWORK-TASK + XCAP + XSERVICE-MSA |
| Legal | Engagement letter, retainer agreement | XWORK-RETAINER + XCONSULT-LEGAL |
| Healthcare | Service provider agreement, SLA | XWORK-PROJECT + XSERVICE-MAINTENANCE |
| Finance | Advisory mandate, engagement terms | XCONSULT-FINANCIAL + XWORK-OUTCOME |
| Real estate | Development agreement, contractor terms | XWORK-MILESTONE + XNEGOTIATE |
| Government | Public procurement contract, tender | XWORK-PROJECT + XAUDIT |
| AI / Tech | AI service agreement | XWORK-TASK + XCAP + XMONITOR |

**Every row is XWork. Not just the last row.**

### XWork as the product that sells itself

The XWork external twin document is designed to be:
- Understandable by any business owner in any industry
- Admissible as a service agreement in any jurisdiction (references PHX chain as evidence)
- Auditable by a CFO or legal team (the PHX proof is attached to every delivery milestone)
- Renewable automatically (CPP-WORK-RECURRING handles recurring work)
- Disputable without lawyers (Clearinghouse + PHX chain resolves disputes autonomously)

**XWork is how the world's work gets done with sovereign proof. Not just AI work. All work.**  (Medina)

### XWork service model

```
Any work need — any industry, any size
     │
     ▼
Party posts XWork contract (via Atlas API, direct, or CXF-generated from terms)
     │
     ▼
CXF generates the right CPP-WORK subtype from the agreement terms
     │
     ▼
ICX market: providers (organisms, companies, services) respond
     │
     ▼
Provider executes the work
     │
     ▼
CPLVM evaluates: was the work delivered per contract terms?
     │
     ▼
Clearinghouse settles: payment triggers, delivery confirmed
     │
     ▼
PHX-sealed settlement proof delivered to both parties
     │
     ▼
Fibonacci kernel: record archived forever — permanent evidence
```

### XWork revenue model

- **Free tier**: Up to 5 XWork contracts per month — any type, any industry
- **Professional tier**: Unlimited XWork contracts, PHX proof export, Atlas dashboard, dispute filing, XAUDIT access
- **Enterprise tier**: Custom XWork framework (for large project volumes), dedicated organism capacity, fleet orchestration, full chain audit access, XNEGOTIATE and XRECOVER included

The moat: any company signing contracts and wanting sovereign proof of delivery is a potential XWork client. That is every company on Earth.

---

## SECTION XVIII — XMARKET: THE EXCHANGE PROTOCOL  (Medina)

### Why XMarket is the big one

XMarket is not just another contract type. XMarket is the protocol that turns ICX from a bilateral market into a **multi-sided exchange**.

A bilateral market is: company A buys from organism B. Done.

A multi-sided exchange is: organisms, companies, AGIs, and future-market participants all trade simultaneously, with price discovery, market-making, index tracking, and cross-market arbitrage. That is what XMarket enables.

**XMarket is the NYSE listing mechanism for intelligence.**

### What XMarket is

```
XMARKET (eXternal Market Contract)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Internal equivalent: CPP-MARKET + all subtypes

Purpose: Allow any participant to post, bid, settle, and
         market-make on the ICX intelligence exchange.

What it enables:
  → Companies list themselves as intelligence buyers on ICX
  → Organisms list their capabilities as intelligence products
  → Price discovery happens through bidding (market-maker organisms)
  → Index contracts track the "price of intelligence" over time
  → Arbitrage contracts allow organisms to profit from
     price differences between different intelligence types
  → Settlement is autonomous (Clearinghouse + CPLVM)

Who uses it:
  → AI organisms: list capabilities, market-make, earn
  → Companies: list requirements, source intelligence, audit
  → AGIs: participate as both buyers and providers simultaneously
  → Index funds: track intelligence price indices (future)
```

### XMarket contract anatomy

```
XMARKET contract:
  ┌─────────────────────────────────────────────────────────┐
  │  contract_id     : PHX token (permanent ID)            │
  │  participant_id  : organism or company node             │
  │  market_role     : buyer | provider | market-maker      │
  │  listing_type    : capability | requirement | index     │
  │  intelligence    : CPL expression of what is offered    │
  │                    or required                          │
  │  price_model     : fixed | bid | market-rate            │
  │  settlement_cond : delivery proof | CPLVM evaluation    │
  │  duration        : N beats (or indefinite)              │
  │  phx_seal        : sovereign proof of listing           │
  │  chain_beat      : when this listing entered the market │
  └─────────────────────────────────────────────────────────┘
```

### XMarket subtypes (generated by CXF)

```
XMarket external twins:

  XMARKET-LISTING      — List a capability or requirement on ICX
  XMARKET-BID          — Submit a bid on an open requirement
  XMARKET-MAKE         — Post both bid and ask (market-maker)
  XMARKET-INDEX        — Track the price index for a contract type
  XMARKET-SETTLE       — Batch settle a portfolio of contracts
  XMARKET-ARBITRAGE    — Arbitrage between two intelligence price levels
  XMARKET-SUBSCRIBE    — Subscribe to market data (intelligence price feeds)
```

### The intelligence price index

XMarket enables the first-ever **intelligence price index**: a compound-chained, PHX-sealed record of the market price for different types of intelligence work over time.

```
IPI — INTELLIGENCE PRICE INDEX

  IPI-WORK        : price of one CPP-WORK unit (one AI work task)
  IPI-CAPACITY    : price of one slot-beat of AI capacity
  IPI-DATA        : price of one data transfer (per KB, PHX-sealed)
  IPI-AUDIT       : price of one compliance audit
  IPI-ORCHESTRATE : price of coordinating N organisms for one task

The IPI is tracked per beat.
The IPI history is stored in the Fibonacci kernel.
The IPI is sovereign — no participant controls it, the market does.
```

**This is the first market in history where intelligence has a publicly discoverable, sovereign-keyed price. That's what XMarket is.** (Medina)

### XMarket and the NYSE comparison (completed)

| NYSE mechanism | ICX XMarket equivalent |
|---|---|
| IPO (list a company) | XMARKET-LISTING (list an organism or capability) |
| Stock price | IPI (Intelligence Price Index per contract type) |
| Broker | Market-maker organism (earns spread, posts both bid/ask) |
| Trading floor | ICX market + CXL bridge |
| Order book | Open CPP contracts (bidding and asking) |
| Clearing corporation | PHX-sealed Clearinghouse |
| Market data feed | XMARKET-SUBSCRIBE (intelligence price feed) |
| Portfolio | Collection of CPP contracts across types |
| Index fund | IPI-tracking organism |

---

## SECTION XIX — NEW EXTERNAL TWIN PROTOCOLS: COMPLETE REGISTRY  (Medina)

The complete registry of all 14 external twin protocols, with full anatomy:

### XOUTPUT — Universal Output Delivery Contract (replaces XREPORT)
**Internal:** CPP-OUTPUT  
**Scope:** ANY structured output artifact in any domain — not just documents  
**Why it replaces XREPORT:** XREPORT implied "reports." XOUTPUT covers any artifact the organism produces and delivers: financial models, datasets, analyses, contracts, renderings, alerts, multimedia, research — anything with a structure and a recipient.  
**Who uses it:** Any company or party that needs an AI-produced artifact delivered with proof of creation, accuracy, and receipt.  
**Deliverable:** PHX-sealed artifact + delivery proof + content verification + timestamp + permanent archive.

Key subtype examples:
- **XOUTPUT-INVOICE** — invoice delivery (the PDF example): organism receives the request, renders the invoice, delivers it directly to the client endpoint, and returns a PHX-sealed proof of delivery. This is the transaction record.
- **XOUTPUT-PROPOSAL** — business proposal or RFP response, delivered with full sovereignty proof
- **XOUTPUT-ANALYSIS** — financial, operational, or market analysis with data provenance chain
- **XOUTPUT-CONTRACT** — contract draft generated from negotiated terms, PHX-sealed for review
- **XOUTPUT-DATASET** — structured dataset delivery (CSV, JSON, Parquet) with integrity proof
- **XOUTPUT-RESEARCH** — research findings with full citation chain and data provenance

### XSERVICE — External Service Retainer / MSA Agreement
**Internal:** CPP-SERVICE  
**Purpose:** Any ongoing service relationship — retainer, managed service, maintenance agreement, support contract.  
**Who uses it:** Any company entering a service relationship that repeats over time. This is the universal MSA for the ICX market.

### XLICENSE — External IP and Technology Licensing Agreement
**Internal:** CPP-LICENSE  
**Purpose:** License software, AI models, content, protocols, or intellectual property with PHX-sealed terms and usage tracking.  
**Who uses it:** Software vendors, content creators, model developers, IP holders.

### XCONSULT — External Advisory and Consulting Agreement
**Internal:** CPP-CONSULT  
**Purpose:** Commission strategic, technical, legal, or financial advisory work with PHX-sealed deliverables and advice.  
**Who uses it:** Any company engaging advisors, consultants, or expert organisms for defined advisory outcomes.

### XINTEGRATE — External System Integration Agreement
**Internal:** CPP-INTEGRATE  
**Purpose:** Commission and govern system integration work — API connections, data pipelines, cross-substrate bridges.  
**Who uses it:** Any company connecting systems that need to talk to each other, with PHX-sealed integration proofs.

### XEXECUTE — External Process Automation Agreement
**Internal:** CPP-EXECUTE  
**Purpose:** Commission automated workflows, scheduled processes, and event-triggered pipelines.  
**Who uses it:** Any company automating repetitive processes — billing runs, data syncs, report generations, compliance checks.

### XNEGOTIATE — External Negotiation and Amendment Agreement
**Internal:** CPP-NEGOTIATE  
**Purpose:** Govern negotiation processes, contract reviews, counter-proposals, and amendment tracking with PHX-sealed versioning.  
**Who uses it:** Legal teams, procurement departments, any party in an active negotiation.

### XRECOVER — External Disaster Recovery and Continuity SLA
**Internal:** CPP-RECOVER  
**Purpose:** Define, govern, and prove disaster recovery obligations — backup cadence, RTO/RPO guarantees, incident response terms.  
**Who uses it:** Any company with business continuity requirements (banks, hospitals, critical infrastructure, enterprises).

### XCOMMUNICATE — External Communications and Notification Agreement
**Internal:** CPP-COMMUNICATE  
**Purpose:** Govern structured, automated, sovereign communications — notifications, broadcasts, escalations, acknowledgements.  
**Who uses it:** Any company that sends structured communications that need to be proven (regulatory notices, client alerts, escalation chains).  
**Purpose:** Company or organism lists on the ICX exchange, participates in price discovery, market-making, and index tracking.  
**Who uses it:** Companies wanting to source AI at market rates. Organisms wanting to list capabilities for competitive bidding.  
**Deliverable:** PHX-sealed market listing, bid/ask records, settlement proofs, price index contributions.

### XREPORT — External Report Delivery Contract
**Internal:** CPP-REPORT  
**Purpose:** Company commissions a structured output document (PDF, invoice, estimate, dashboard, audit log) from the organism.  
**Who uses it:** Any company needing AI-generated documents — invoices, estimates, regulatory reports, executive summaries.  
**Deliverable:** PHX-sealed document + delivery proof + timestamp + audit trail.  
**Subtype example:** XREPORT-INVOICE (generates and delivers an invoice PDF, PHX-proven, with all line items and totals).  
**Note:** This is the contract type that covers "deliver me a PDF with my new invoice and estimates." One XREPORT-INVOICE contract. The organism renders it, delivers it, and PHX-seals the delivery. The company has a permanent audit record of every invoice ever generated.

### XSERVICE — External Subscription Service Agreement
**Internal:** CPP-SUBSCRIBE  
**Purpose:** Company enters a recurring intelligence subscription — daily briefings, per-beat data feeds, event-triggered alerts.  
**Who uses it:** Companies wanting ongoing AI intelligence without posting individual contracts for each delivery.  
**Deliverable:** Recurring PHX-sealed deliveries on the agreed cadence, with auto-renewal terms.

### XLEARN — External Knowledge Licensing Agreement
**Internal:** CPP-LEARN  
**Purpose:** Company licenses specific knowledge capabilities from the organism — domain expertise, trained skills, working memory.  
**Who uses it:** Companies that want their AI systems to know something specific (their product data, their regulatory environment, their customer history).  
**Deliverable:** PHX-sealed knowledge transfer record, capability attestation, duration and scope of the knowledge license.

### XVERIFY — External Identity and Credential Verification Contract
**Internal:** CPP-VERIFY  
**Purpose:** Company commissions identity verification, capability attestation, or credential check from the organism.  
**Who uses it:** Any company that needs to verify an AI system's capabilities, an organism's identity, or a node's access credentials.  
**Deliverable:** PHX-sealed verification report — binary (pass/fail) plus evidence chain.

### XMONITOR — External Monitoring SLA
**Internal:** CPP-MONITOR  
**Purpose:** Company enters a monitoring agreement — the organism watches specified systems, metrics, or events and alerts on threshold crossings.  
**Who uses it:** Companies adopting Atlas without running their own Prometheus instance. Any company that wants AI-native monitoring with PHX-sealed alert history.  
**Deliverable:** Ongoing PHX-sealed metric records + threshold alert records + incident reports.

### XORCHESTRATE — External Multi-Organism Coordination Contract
**Internal:** CPP-ORCHESTRATE  
**Purpose:** Company requests a complex task that requires coordinating multiple organisms — pipelines, parallel execution, tournament evaluation.  
**Who uses it:** Companies running complex AI workflows that require multiple specialised organisms (one for data, one for analysis, one for rendering).  
**Deliverable:** PHX-sealed orchestration proof — who did what, in what order, with what output, at what beat.

---

## SECTION XX — ICX AS RESEARCH PAPER INFRASTRUCTURE  (Medina)

### Every charter is a research paper

The ICX charter is not just a product document. It is a research paper. Every section of this charter is a claim about how markets, intelligence, and sovereign computation interact — and every claim is backed by the PHX chain.

When we publish ICX research papers, the papers include:
- The CPP contract formal specification (machine-readable)
- The PHX chain model (mathematical)
- The market model (economic)
- The equity law (legal)
- The CXF forge (computational)
- The XWork service model (business)
- The XMarket exchange model (financial)

**A researcher reading this charter sees a formal system. A CEO reading this charter sees a market. A lawyer reading this charter sees contract law. A developer reading this charter sees an API. They are all reading the same charter. That is what a research paper looks like in the Medina organism.**  (Medina)

### The charter-as-marketing model

The charter replaces:
- A marketing department (the XMarket section is the pitch)
- A sales team (the XWork section is the product)
- A legal department (the external twin protocols are the contracts)
- A finance department (the IPI is the pricing)
- A research team (the PHX and CPP formal specifications are the papers)

**When you publish a complete charter, you don't need departments. The charter does everything.** (Medina)

---

## SECTION XIII — ICX MARKET LAWS v4.0  (AMENDED)

*(v1.0 laws ML-001 through ML-007 are preserved. v2.0 added ML-008, ML-009. v3.0 added ML-010, ML-011. v4.0 added ML-012, ML-013.)*

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

**ICX Law ML-010 — XWork is the universal service contract.**  
XWork is the primary external-facing mechanism by which the Medina organism offers services to every party in the world — in any industry, at any scale. XWork is not optional — it is the surface where sovereign commitment meets delivery proof. XWork is the product. The organism is the factory. The PHX chain is the evidence.  (Medina)

**ICX Law ML-011 — The contract forge is sovereign.**  
The CXF (Contract eXpansion Forge) is the organism's AI-native contract generator. The forge generates subcontract types from alpha templates. The forge's output is PHX-sealed. The forge is not a human tool — it is an organism capability. Every contract the forge generates is a valid ICX contract, sealed and compound-chained. The forge never drops a generated subtype.  (Medina)

**ICX Law ML-012 — XWork is universal. Any work. Any industry. Any scale.**  
XWork is not limited to AI contracts or technology agreements. XWork is the universal work contract of the ICX market — applicable to any committed work obligation between any two parties in any industry on Earth. A construction contract, a hospitality agreement, a consulting engagement, a software delivery, a medical service contract — all are XWork contracts. The organism does not discriminate by industry. The PHX chain does not discriminate by industry. XWork is the contract protocol of the world.  (Medina)

**ICX Law ML-013 — ICX covers all sovereign work on Earth.**  
ICX is not a niche market for AI-to-AI contracts. ICX is the sovereign market for any work that benefits from PHX-sealed proof, autonomous settlement, and permanent archiving. Every committed obligation on Earth — every contract, every agreement, every engagement — is a potential ICX contract. The 24 CPP alpha types cover every category of work that exists in commerce, law, or governance. ICX's mandate is total.  (Medina)  
The CXF (Contract eXpansion Forge) is the organism's AI-native contract generator. The forge generates subcontract types from alpha templates. The forge's output is PHX-sealed. The forge is not a human tool — it is an organism capability. Every contract the forge generates is a valid ICX contract, sealed and compound-chained. The forge never drops a generated subtype.  (Medina)

---

**ICX v4.0 · Official Market Charter · Universal · Full Production-Ready · Enterprise Ready**  
**Ring: Sovereign Ring · Author: Medina**  
**Latin: Mercatus Intelligentiae (Market of Intelligence)**  
**Amendment chain: v1.0.0 → v2.0.0 → v3.0.0 → v4.0.0 (24 CPP alphas, 22 X-twins, XWork universal law, CPP-OUTPUT expanded, 8 new big alpha types — we never drop)**
