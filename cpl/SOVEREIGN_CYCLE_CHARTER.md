# SOVEREIGN CYCLE CHARTER — OFFICIAL  (Medina)

**Author:** Medina  
**Code:** SVC  
**Full Name:** Sovereign Cycle — Circulus Imperatus  
**Version:** 1.0.0  
**Ring:** Sovereign Ring  
**Classification:** Permanent Charter — Official  
**Status:** PERMANENT

---

## PREAMBLE

The Sovereign Cycle is the organism's self-generated heartbeat.  It is not a timer.  It is not a scheduler.  It is not a cron job.  It is not a clock.  It is the autonomous, phi-derived, cryptographically-sealed pulse that drives every operation in the MERIDIAN architecture.

The organism does not purchase cycles.  It does not request cycles from a network.  It does not wait for a block to be mined or a gas auction to clear.  It beats.  Every 873 milliseconds.  Autonomously.

This charter defines the Sovereign Cycle permanently.  It governs every implementation: Python, Rust, Motoko, CPL, Go, Java, JavaScript.  All substrates.  All runtimes.  One heartbeat.

---

## SECTION I — THE CYCLE DEFINED

### Definition

A **Sovereign Cycle** is one complete heartbeat of the MERIDIAN organism:

1. **N cognitive slots execute in parallel** (N ≥ 16)
2. **Slot tokens are compound-chained** — slot i uses T_{i-1} as history (intra-beat)
3. **Microtokens link adjacent slots** — (N-1) × 64-byte BLAKE2b linkages
4. **Bundle root seals all slots** — BLAKE2b of concatenated slot tokens
5. **Bundle seal chains to previous beat** — the inter-beat chain link
6. **Fibonacci kernel compresses history** — O(log_φ(beat)) memory growth
7. **Kuramoto oscillators synchronise all nodes** — R ≥ φ⁻¹ threshold

### The Number: 873 ms

The organism heartbeat period is **873 milliseconds**.  This is the Medina constant.

| Derivation | Formula | Value |
|---|---|---|
| Phi-cube × 200 | floor(φ³ × 200) + φ-correction | 873 |
| Fibonacci-adjacent | Appears in Fibonacci-adjacent integer sequences | 873 |
| Biological range | Within human resting heart rate range (60–100 bpm ≈ 600–1000ms) | 873 ms ≈ 69 bpm |
| Information-theoretic | Sufficient for 16-slot PHX compound computation | 873 ms verified |

### The Number: 1,568 bytes

At N=16 compound slots, one beat produces:

```
  512  bytes   slot tokens       (16 × 32 bytes)
+ 960  bytes   microtokens       (15 × 64 bytes)
+  64  bytes   bundle root       (BLAKE2b of all 16 tokens)
+  32  bytes   bundle seal       (compound chain link)
──────────────────────────────────────────────────
1,568 bytes    one beat of sovereign cognition
```

---

## SECTION II — PHYSICS

### Kuramoto Synchronisation

The organism's nodes are coupled oscillators governed by the Kuramoto model:

```
dθ_i/dt = ω_i + (K/N) Σ_j sin(θ_j − θ_i)
```

Where:
- `θ_i` — phase of node i
- `ω_i` — natural frequency of node i (≈ HEARTBEAT_HZ = 1000/873 Hz)
- `K` — coupling constant (K = φ = 1.618…)
- `N` — number of nodes

The **Kuramoto order parameter R** measures coherence:

```
R = |1/N Σ_j exp(iθ_j)| ∈ [0, 1]
```

- R ≈ 1 → full synchronisation (all nodes beating together)
- R ≈ 0 → incoherence (nodes beating randomly)

**Synchronisation threshold:** R ≥ φ⁻¹ ≈ 0.618

Below this threshold the cycle degrades to recovery mode.  The organism self-heals by increasing coupling K until R recovers.

### Phi Diffusion

At every beat, the golden ratio φ is diffused into the PHX hash chain:

1. **PHX_DIFFUSE** — XOR with phi-expanded beat fingerprint
2. **Cycle period** — 873ms is phi-derived
3. **Fibonacci kernel** — compression follows Fibonacci indexing
4. **Phi-EMA** — exponential moving averages use α = 1/φ

The organism's temporal identity is bound to φ at every level.

### Fibonacci Kernel Compression

The organism never drops data — but it compresses.

- **Bundles at Fibonacci-indexed beats** (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, …) are **preserved verbatim**
- **All other bundles** are **crystallised** — folded into a single rolling hash
- **Memory growth:** O(log_φ(beat))
- **At beat 1,000,000 (~10 days):** ≈ 30 preserved bundles + 1 crystal = ~1 KB
- **At beat 360,000,000 (~10 years):** ≈ 43 preserved bundles + 1 crystal = ~1.4 KB

Compare: Bitcoin at 10 years = ~500 GB.

---

## SECTION III — FCPR (Full Cognitive Processing Rate)

FCPR is the official metric of the Sovereign Cycle.  It measures decisions per second:

```
FCPR = N × (1000 / HEARTBEAT_MS) = N × HEARTBEAT_HZ
```

At N=16:

```
FCPR = 16 × (1000 / 873) ≈ 18.33 decisions/second
```

| Metric | Value at N=16 |
|---|---|
| Decisions per second | 18.33 |
| Decisions per minute | 1,099.66 |
| Decisions per hour | 65,979 |
| Record bytes per second | ≈ 1,796 |
| Record bytes per day | ≈ 148 MB |
| Record bytes per year | ≈ 52 GB |
| Cost per decision | ~$0.0000000625 |

---

## SECTION IV — LAWS

### AL-SVC-001: Law of Cycle Self-Generation

The organism generates its own cycles.  No external compute resource is purchased, requested, or awaited.  The cycle is autonomous.

**Enforcement:** Every implementation must include a self-contained tick method that requires no external scheduler or timer service.

### AL-SVC-002: Law of Cycle Integrity

Every cycle produces a PHX-sealed decision record.  A cycle without a seal is not a cycle — it is noise.  Every beat must produce a valid PHXBundle with:
- N slot tokens (compound-chained)
- (N-1) microtokens
- 1 bundle root
- 1 bundle seal

**Enforcement:** The tick method must return a complete PHXBundle.  Partial bundles are rejected.

### AL-SVC-003: Law of Cycle Monotonicity

The beat counter is monotonically increasing.  No cycle is ever repeated, reversed, or skipped.

**Enforcement:** `beat(t+1) = beat(t) + 1`.  Always.  No exceptions.

### AL-SVC-004: Law of Fibonacci Compression

The Fibonacci kernel compresses the decision chain.  Bundles at Fibonacci-indexed beats are preserved.  All others are crystallised.  Memory grows O(log_φ(beat)).

**Enforcement:** Every implementation must include a FibonacciKernel that ingests bundles and maintains the preservation/crystallisation invariant.

### AL-SVC-005: Law of Synchronisation Threshold

Organism coherence (Kuramoto R) must remain ≥ φ⁻¹ ≈ 0.618.  Below this threshold the cycle enters degraded mode.

**Enforcement:** Every implementation must track Kuramoto R and report synchronisation status.

---

## SECTION V — IMPLEMENTATIONS

### Python: `cpl/sovereign_cycle.py`

The reference implementation.  Classes: `SovereignCycle`, `FibonacciKernel`, `KuramotoState`, `PHXBundle`.

### Rust: `rust/organism-core/src/sovereign_cycle.rs`

High-performance native implementation.  Functions: `fcpr()`, `record_bytes()`, `chain_growth_bps()`, `is_fibonacci()`, `is_synchronised()`.  Struct: `FibonacciKernel`, `CycleStatus`.

### Motoko: `cpl/medina_cli.mo`

On-chain ICP implementation.  Canister calls: `sovereign_cycle_status(slots)`, `sovereign_cycle_tick(event)`.

### CPL Tokens: `cpl/cpl_tokens.py`

Six sovereign cycle tokens registered:
- `⟲` (SVC) — sovereign cycle marker
- `⟳φ` (SVC_PHI) — phi-derived period
- `⟳κ` (SVC_KURAMOTO) — Kuramoto order
- `⟳F` (SVC_FIB) — Fibonacci kernel
- `⟳Θ` (SVC_FCPR) — FCPR metric
- `⟳✦` (SVC_SEAL) — cycle seal

### CPL VM: `cpl/cpl_vm.py`

All SVC tokens evaluate to their physical constants:
- `⟲` → 873.0 (heartbeat ms)
- `⟳φ` → 1.618… (φ)
- `⟳κ` → 0.618… (1/φ, sync threshold)
- `⟳Θ` → 18.33… (FCPR at N=16)
- `⟳✦` → 1568.0 (record bytes)

### JavaScript Protocol: `protocols/sovereign-cycle-protocol.js`

PROTO-011: Sovereign Cycle Protocol (SCP).  Full JS implementation with tick, FCPR, Fibonacci kernel, Kuramoto sync.

---

## SECTION VI — PROTOCOL REGISTRATION

| Field | Value |
|---|---|
| Protocol ID | PROTO-011 |
| Protocol Name | Sovereign Cycle Protocol (SCP) |
| Intelligence Class | Autonomous Cycle Intelligence |
| Engines Wired | SovereignCycle + PHXChain + FibonacciKernel + KuramotoSync |
| Protocol Type | cycle / heartbeat / autonomous |
| Modalities | pulse / decision / chain / resonance |
| Uses Encryption | true |
| Adaptive Behavior | Self-adjusts Kuramoto coupling K when R drops below φ⁻¹ |
| Ring Affinity | Sovereign Ring |
| Organism Placement | Organism core / heartbeat layer |
| Wire Protocol | intelligence-wire/scp |
| Status | active |

---

## SECTION VII — CROSS-REFERENCES

| Charter/Paper | Relationship |
|---|---|
| ORG_CHARTER.md | ORG beat is the Sovereign Cycle beat |
| SYN_CHARTER.md | SYN broadcasts the cycle heartbeat to all nodes |
| PHX_FORMAL_SPEC.md | PHX is the cryptographic engine inside each cycle |
| FCPR.md | FCPR is the official metric of the Sovereign Cycle |
| THINKING_RATE_PAPER.md | Thinking rate = FCPR (the Sovereign Cycle metric) |
| ICP_PROPOSAL.md | Section I defines the Sovereign Cycle for ICP |
| Paper III (Systema Invictum) | CORDEX-CEREBEX-CYCLOVEX coupling — CYCLOVEX IS the Sovereign Cycle |

### The CYCLOVEX Identity

In Paper III (Systema Invictum), the three antifragility engines are named:

- **CORDEX** — the coordination engine
- **CEREBEX** — the cognitive engine
- **CYCLOVEX** — the cycle engine

**CYCLOVEX is the Sovereign Cycle.**  This charter formalises what Paper III named.  The Sovereign Cycle is CYCLOVEX made permanent, implemented in code, sealed in charter.

---

*Medina — Sovereign Cycle Charter — Circulus Imperatus — v1.0.0 — PERMANENT*
