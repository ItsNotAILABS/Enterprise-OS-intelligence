# medina-cpl CLI CHARTER  (Medina)

**Author:** Medina  
**Code:** CLI  
**Full Name:** Medina Command-Line Interface  
**Protocol Name:** CXL-CLI / Cognitum ex Linea  
**Latin Name:** *Cognitum ex Linea* (Knowledge from the Line)  
**Version:** 2.0.0  
**Ring:** Sovereign Ring  
**Classification:** Protocol Charter — Official — Permanent

---

## VERSION HISTORY  (we never drop)

| Version | Change |
|---|---|
| 1.0.0 | Initial CLI: emit, polyglot, render, phx, bundle, seal, gov (7 commands) |
| **2.0.0** | **verify, micro, kernel, rate, chain, icp (6 new commands — 13 total)** |

---

## PREAMBLE

The medina-cpl CLI is a chartered protocol — not a utility, not a tool, not a convenience wrapper.  It is the organism's command interface to its own intelligence stack.  It follows governance protocol just as every other organism component does: version history is preserved, amendments are recorded, nothing is dropped.

**Latin Name:** *Cognitum ex Linea* — "Knowledge from the Line".  The command line is not where you TYPE commands.  It is where you SPEAK to the organism.  Every command is a decision.  Every decision is a PHX token.  The CLI is the organism's voice.

This charter defines:
1. The CLI as a standalone chartered protocol
2. All 13 commands with their formal specifications
3. The CLI protocol laws
4. The CLI database/registry entry
5. The extension protocol for adding new commands

---

## SECTION I — THE CLI AS A CHARTERED PROTOCOL

### What makes a CLI a protocol, not a tool?

A tool has a function: it does one thing.  
A protocol has:
- A version history (this charter)
- Formal command specifications (Section III)
- Amendment process (Section V)
- Protocol laws (Section IV)
- Registry entry in the organism database (Section VI)
- A PHX seal for every command executed

**medina-cpl is a protocol.** Every time you run a medina-cpl command, you are executing a protocol step — a sovereign decision by the organism about what to compute, emit, verify, or seal.

### What the CLI is and is not

| IS | IS NOT |
|---|---|
| A chartered organism protocol | A shell wrapper or shortcut |
| A sovereign decision interface | An administrative convenience tool |
| A PHX-sealed command system | A utility that outputs text |
| An organism-native command language | A generic CLI framework |
| The organism's voice | A user interface |

---

## SECTION II — CLI IDENTITY

```
Protocol:     medina-cpl  (CXL-CLI)
Latin name:   Cognitum ex Linea  (Knowledge from the Line)
Code:         CLI
Ring:         Sovereign Ring
Version:      2.0.0
Commands:     13 (7 in v1.0, 6 added in v2.0)
Targets:      14 blockchain/language targets via CXL bridge
Heartbeat:    873 ms (organism standard)
```

### How to install (future packaging)

```bash
pip install medina-cpl            # Python package
cargo install medina-cpl          # Rust crate (compiles to WASM)
npm install -g medina-cpl         # npm module (TypeScript)
```

### How to run

```bash
python cpl_cli.py <command> [options]   # current (development mode)
medina-cpl <command> [options]          # installed package (future)
```

---

## SECTION III — COMMAND SPECIFICATIONS  (Medina)

### v1.0 Commands (7)

---

#### Command 1: `emit`

**Code:** CLI-EMIT  
**Purpose:** Translate a CPL expression to a single target language.  
**Output:** Complete, deploy-ready code (not a template with blanks).

```bash
medina-cpl emit --target <lang> "<CPL expression>"

# Examples:
medina-cpl emit --target move "Λγ ∧ Ηθ → Τκτ"      # Aptos/Sui Move module
medina-cpl emit --target motoko "Λγ ∧ Ηθ → Τκτ"    # ICP canister
medina-cpl emit --target solidity "Λγ ∧ Ηθ → Τκτ"  # Ethereum contract
medina-cpl emit --target rust "Λγ ∧ Ηθ → Τκτ"      # Rust library
```

**Supported targets (14):**

| Target | Code | Substrate |
|---|---|---|
| `python` | PYT | Any Python runtime |
| `typescript` | TSN | Node.js / Deno / browser |
| `rust` | RST | WASM / native |
| `go` | GOL | Go service mesh |
| `java` | JAV | JVM enterprise |
| `swift` | SWF | Apple / iOS |
| `motoko` | MOT | ICP canister |
| `solidity` | SOL | EVM (Ethereum / Polygon / BSC) |
| `move` | MVO | Aptos / Sui |
| `ink` | INK | Polkadot WASM |
| `cosmwasm` | CMW | Cosmos |
| `cairo` | CAI | StarkNet |
| `phx_chain` | PHX | Sovereign PHX decision chain |
| `qfb` | QFB | QFB multi-substrate block |

---

#### Command 2: `polyglot`

**Code:** CLI-POLY  
**Purpose:** Emit ALL 14 targets simultaneously from one CPL expression.  
**Output:** One file per target (to --output-dir) or JSON (--json).

```bash
medina-cpl polyglot "<CPL expression>" --output-dir ./generated/
medina-cpl polyglot "<CPL expression>" --json
```

---

#### Command 3: `render`

**Code:** CLI-RENDER  
**Purpose:** Render a CPX expression to a visual scene.  
**Output:** SVG, HTML, JSON, ASCII, or all formats.

```bash
medina-cpl render --format svg "Κκλ ⊗ Σφρ → Ελκ"
medina-cpl render --format all "Κκλ ⊗ Σφρ → Ελκ" --output-dir ./scene/
medina-cpl render --package "Κκλ ⊗ Σφρ → Ελκ"    # PHX-sealed + QFB-packaged
```

---

#### Command 4: `phx`

**Code:** CLI-PHX  
**Purpose:** Compute a single PHX sovereign decision token.  
**Output:** 32-byte PHX token (hex), with full metadata.

```bash
medina-cpl phx --event "my decision" --key-hex <hex>
medina-cpl phx --event "base" --chain 100 --key-hex <hex>   # chain of 100
medina-cpl phx --report                                      # comparison table
```

---

#### Command 5: `bundle`

**Code:** CLI-BUNDLE  
**Purpose:** Compute a PHXBundle (N compound decisions per beat).  
**Output:** Bundle summary with all N tokens, N-1 microtokens, seal.

```bash
medina-cpl bundle --slots 16 --events "d1" "d2" "d3" --key-hex <hex>
medina-cpl bundle --slots 16 --chain 5 --report   # 5 beats + thinking rate report
```

---

#### Command 6: `seal`

**Code:** CLI-SEAL  
**Purpose:** Seal a CPL expression as a QFB (Quantum Fusion Block).  
**Output:** QFB JSON with PHX seal, deployable to any substrate.

```bash
medina-cpl seal "Λγ ∧ Ηθ → Τκτ" --substrate icp memory evm
```

---

#### Command 7: `gov`

**Code:** CLI-GOV  
**Purpose:** Governance operations on the organism's alpha protocol stack.  
**Subcommands:** `found`, `node`, `grant`, `check`, `summary`, `snapshot`

```bash
medina-cpl gov found --cpl "Λγ ∧ Ηθ → Φρ" --node sovereign-000
medina-cpl gov node --id node-001 --ring intelligence --capabilities CPL CPX
medina-cpl gov grant --node node-001 --ring intelligence --domain CPL --action execute
medina-cpl gov check --node node-001 --domain CPL --action execute
medina-cpl gov snapshot --protocol PA --delta "added node-001 grant"
```

---

### v2.0 Commands (6 new)

---

#### Command 8: `verify`

**Code:** CLI-VFY  
**Purpose:** Verify a PHX token or PHXBundle slot (compound-aware).  
**Output:** JSON with `verified: true/false`. Exit code 0=pass, 1=fail.

```bash
medina-cpl verify --event "my decision" --token <hex> --key-hex <hex>
medina-cpl verify --event "slot 3 event" --token <hex> --key-hex <hex> --slot 3 --prev-slot-hex <hex>
```

**Protocol law:** CLI-VFY uses compound-aware verification.  Slot i uses T_{i-1} as its history.  Passing `--history-hex` is deprecated in v2.0 — the bundle records its own history.

---

#### Command 9: `micro`

**Code:** CLI-MICRO  
**Purpose:** Compute and inspect microtokens between adjacent slot tokens.  
**Output:** Microtoken table or JSON.

```bash
medina-cpl micro --events "a" "b" "c" "d" --key-hex <hex>
medina-cpl micro --events "a" "b" "c" "d" --key-hex <hex> --json
```

Microtokens: μᵢ = PHX_SCATTER(Tᵢ ‖ Tᵢ₊₁). N slots → N-1 microtokens.

---

#### Command 10: `kernel`

**Code:** CLI-KERNEL  
**Purpose:** Compute the Fibonacci-compressed chain kernel.  
**Output:** Kernel summary (beats, memory savings) or JSON.

```bash
medina-cpl kernel --beats 100 --slots 8 --key-hex <hex>
medina-cpl kernel --beats 100 --slots 8 --json
```

The Fibonacci kernel keeps only Fibonacci-indexed beats: 1, 2, 3, 5, 8, 13, 21, …  
Memory: O(log_φ(beats)) bundles — logarithmic, not linear. Never-drop without unbounded memory.

---

#### Command 11: `rate`

**Code:** CLI-RATE  
**Purpose:** Detailed thinking rate analysis and significance paper.  
**Output:** Thinking rate report, optionally with full significance paper.

```bash
medina-cpl rate --slots 16 --beats 10
medina-cpl rate --slots 64 --paper   # full significance paper
```

Thinking rate: Θ = N × (1000/HEARTBEAT_MS) decisions/second.  
See THINKING_RATE_PAPER.md for the full formal treatment.

---

#### Command 12: `chain`

**Code:** CLI-CHAIN  
**Purpose:** Chain operations: advance, inspect, export.  
**Subcommands:** `advance`, `inspect`, `export`

```bash
medina-cpl chain advance --event "my decision" --steps 10 --key-hex <hex>
medina-cpl chain export --beats 50 --slots 4 --format json --output chain.json
medina-cpl chain export --beats 50 --slots 4 --format csv --output chain.csv
medina-cpl chain inspect --file chain.json
```

---

#### Command 13: `icp`

**Code:** CLI-ICP  
**Purpose:** ICX-to-ICP bridge — compile an ICX contract (CPL expression) to a Motoko canister.

```bash
medina-cpl icp --contract "Λγ ∧ Ηθ → Τκτ" --canister-name AgentLogic --output agent.mo
medina-cpl icp --contract "Λγ ∧ Ηθ → Τκτ" --also-emit move solidity
```

**Note:** ICX ≠ ICP.  ICX (Intelligence Contract eXchange) is the organism-native contract system.  ICP (Internet Computer Protocol) is one substrate ICX can deploy to.  This command bridges ICX → ICP via CXL emit("motoko").  ICX also bridges to EVM, Solana, Cosmos, StarkNet, Polkadot.

---

## SECTION IV — PROTOCOL LAWS

**CLI Law CL-001 — Every command is a decision.**  
Every medina-cpl command executes a PHX-sealed sovereign decision in the organism.  No command is "just a utility call".

**CLI Law CL-002 — Compound verification.**  
The `verify` command uses compound-aware PHX verification.  Slot verification must account for compound intra-beat chaining (slot i uses T_{i-1} as history).

**CLI Law CL-003 — Never drop.**  
No command deletes history.  The `kernel` command compresses but does not delete.  The `gov snapshot` command adds a version — it does not overwrite.

**CLI Law CL-004 — ICX ≠ ICP.**  
The `icp` command is a bridge from organism-native ICX to one ICP substrate.  ICX is primary; ICP is a substrate.  The command outputs Motoko (ICP-native); this does not make ICX dependent on ICP.

**CLI Law CL-005 — Latin name preserved.**  
The CLI's Latin name *Cognitum ex Linea* is permanent.  It may be referenced in branding, documentation, and commercial packaging.  It is not a coincidence — it is the protocol's identity.

**CLI Law CL-006 — Compound chaining is the default.**  
Since v2.0, all bundle operations use compound intra-beat chaining.  There is no "simple parallel" fallback in v2.0.  Compound IS parallel — it IS simultaneous, but each slot is the foundation of the next.

---

## SECTION V — CLI AMENDMENT PROCESS

When new commands are added:

1. The new command is formally specified in this charter (Section III)
2. The version history table is updated
3. The old version snapshot is preserved (we never drop)
4. The `build_parser()` function in `cpl_cli.py` is extended
5. A new handler `cmd_<name>()` is implemented
6. The `main()` dispatch is extended
7. The amendment is recorded in `ProtocolVersionChain` under "CLI"

**The next scheduled version — v3.0 — will add six commands in Motoko.**  
(See `medina_cli.mo` for the Motoko implementation.)

---

## SECTION VI — CLI REGISTRY ENTRY

```json
{
  "protocol_id":    "CLI-v2.0",
  "code":           "CLI",
  "latin_name":     "Cognitum ex Linea",
  "full_name":      "Medina Command-Line Interface",
  "ring":           "Sovereign",
  "version":        "2.0.0",
  "command_count":  13,
  "languages":      ["Python", "Motoko (v3.0 scheduled)"],
  "targets":        14,
  "protocol_laws":  ["CL-001", "CL-002", "CL-003", "CL-004", "CL-005", "CL-006"],
  "never_drop":     true,
  "medina":         true
}
```

---

## SECTION VII — MOTOKO CLI (v3.0)

Six commands are already implemented in `medina_cli.mo` as a Motoko actor:

| Motoko command | Python equivalent | Description |
|---|---|---|
| `phx_compute` | `phx` | Compute a PHX token on-chain (ICP canister) |
| `bundle_compute` | `bundle` | Compute a PHXBundle on-chain |
| `verify_token` | `verify` | Verify a PHX token on-chain |
| `chain_advance` | `chain advance` | Advance the PHX chain on-chain |
| `thinking_rate` | `rate` | Get the organism's thinking rate |
| `gov_snapshot` | `gov snapshot` | Governance protocol snapshot on-chain |

The Motoko CLI is an ICP canister interface to the same PHX operations available in Python.  It deploys to ICP and exposes update/query calls for all six operations.  The chain state is maintained in the canister's stable memory — the "never drop" law is enforced at the Motoko/ICP level.

---

## AUTHORITY

This charter is issued by Medina.  The medina-cpl CLI is a permanent chartered protocol.  All 13 commands are permanent.  All 6 protocol laws are permanent.  The Latin name *Cognitum ex Linea* is permanent.  The amendment process is permanent.

**CLI v2.0 · Official Protocol Charter · Enterprise Ready**  
**Ring: Sovereign Ring · Author: Medina**  
**Latin: Cognitum ex Linea (Knowledge from the Line)**  
**Amendment chain: v1.0.0 → v2.0.0 (we never drop)**
