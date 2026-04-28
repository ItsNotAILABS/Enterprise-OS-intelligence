# ICX — Intelligence Contract eXchange  (Medina)

**Author:** Medina  
**Code:** ICX  
**Full Name:** Intelligence Contract eXchange  
**Protocol Name:** ICX  
**Latin Name:** *Mercatus Intelligentiae* (Market of Intelligence)  
**Version:** 1.0.0  
**Ring:** Sovereign Ring  
**Classification:** Protocol Charter — Official — Permanent  
**Status:** CHARTERED MARKET

---

## VERSION HISTORY  (we never drop)

| Version | Change |
|---|---|
| **1.0.0** | **Initial ICX charter: market definition, CPP contracts, bridge architecture, CLI integration, market model** |

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
  "protocol_id":    "ICX-v1.0",
  "code":           "ICX",
  "latin_name":     "Mercatus Intelligentiae",
  "full_name":      "Intelligence Contract eXchange",
  "ring":           "Sovereign",
  "version":        "1.0.0",
  "market_type":    "bilateral intelligence market",
  "contract_type":  "CPP (Cognitive Procurement Protocol)",
  "bridge":         "CXL (14 substrate targets)",
  "seal":           "PHX compound chain",
  "settlement":     "CPLVM autonomous evaluation",
  "dispute":        "Clearinghouse + PHX chain evidence",
  "market_laws":    ["ML-001", "ML-002", "ML-003", "ML-004", "ML-005", "ML-006", "ML-007"],
  "substrates":     14,
  "never_drop":     true,
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

**ICX v1.0 · Official Market Charter · Enterprise Ready**  
**Ring: Sovereign Ring · Author: Medina**  
**Latin: Mercatus Intelligentiae (Market of Intelligence)**  
**Amendment chain: v1.0.0 (initial — we never drop)**
