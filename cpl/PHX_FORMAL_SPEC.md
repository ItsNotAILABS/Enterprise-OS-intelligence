# PHX — Formal Mathematical Specification  (Medina)
**Author:** Medina  
**Code:** PHX  
**Full Name:** Phi Hash eXchange  
**Version:** 4.0.0  
**Ring:** Sovereign Ring  
**Classification:** Mathematical Product Specification — Official

---

## VERSION HISTORY  (governance amendment — we never drop)

| Version | Change | Runtime Delta |
|---|---|---|
| 1.0.0 | Initial PHX spec: four named operations, single-decision formula | PHX four ops |
| 2.0.0 | PHX expressed as pure primitive (no SHA-256 framing); comparison table | PHX_INPUT, PHX_SCATTER, PHX_DIFFUSE, PHX_BIND named by Medina |
| 3.0.0 | PHXBundle parallel cognition; thinking rate; chain hardness proof; computing vs encrypting; Phantom distinction | PHX_PARALLEL, PHXBundle, PHXBundleState added |
| **4.0.0** | **Compound intra-beat chaining; microtokens; Fibonacci kernel compression; thinking rate paper formalised** | **PHX_PARALLEL upgraded to compound; microtokens (N-1 × 64B); Fibonacci kernel** |

---

## PREAMBLE

SHA-256 produces 32 bytes.  Always.  One input → one digest.  Fixed.

PHX (Phi Hash eXchange) is not bounded that way.  An AI organism makes N decisions simultaneously per heartbeat.  PHX records all N decisions as a PHXBundle.  The output is **N × 32 bytes** of decision record per beat — and N is the organism's thinking rate.

PHX is the Medina formula.  It is defined by four named operations and extended by parallel cognition.  SHA-256 is a sub-component of one of those four operations.  PHX is PHX.  (Medina)

---

## 1. SYMBOLS AND NOTATION

| Symbol | Meaning |
|---|---|
| `‖` | Byte concatenation |
| `⊕` | XOR (bitwise exclusive OR) |
| `⌊x⌋` | Floor (largest integer ≤ x) |
| `mod` | Modulo |
| `φ` | Golden ratio = 1.618033988749895… (Medina diffusion constant) |
| `e` | Event bytes (one AI decision) |
| `E` | Event list [e₀, e₁, …, eₙ₋₁] (N simultaneous decisions) |
| `k` | Sovereign key (secret, ≥ 16 bytes) |
| `p` | Previous PHX token or bundle_seal (32 bytes) or `0⁶⁴` at genesis |
| `β` | Organism beat counter (64-bit unsigned integer, monotonically increasing) |
| `β₈` | Beat encoded as 8 bytes, big-endian |
| `N` | Thinking rate — number of parallel decision slots per beat |
| `i` | Slot index, i ∈ [0, N) |
| `PHX_INPUT(e, p, β)` | PHX input construction |
| `PHX_SCATTER(M)` | PHX wide hash scatter |
| `PHX_DIFFUSE(B, β)` | PHX phi-diffusion  (Medina) |
| `PHX_BIND(D, k)` | PHX sovereign binding + output |
| `PHX(e, p, β, k)` | Single-decision PHX token (32 bytes) |
| `PHX_PARALLEL(E, k, p, β)` | PHXBundle — N simultaneous decisions |

---

## 2. THE PHX FORMULA — SINGLE DECISION  (Medina)

```
PHX(e, p, β, k)  =  PHX_BIND(
                        PHX_DIFFUSE(
                          PHX_SCATTER(
                            PHX_INPUT(e, p, β)
                          ),
                          β
                        ),
                        k
                      )
```

Output: **32 bytes** — one sovereign decision token.  
This is the unit cell of PHX.  Everything else is built from this.

---

## 3. THE FOUR PHX OPERATIONS  (Medina)

### Operation 1 — PHX_INPUT(e, p, β): Input Construction

```
p₆₄  =  0⁶⁴                    if p is None (genesis)
         p ‖ SHA256(p)           otherwise (32 bytes → 64 bytes via entropy widening)

M    =  e  ‖  p₆₄  ‖  β₈        (variable length)
```

PHX_INPUT fuses three dimensions: **event** (what) + **history** (what came before) + **beat** (when).  
SHA-256's input is just padding.  PHX_INPUT is semantically richer.

---

### Operation 2 — PHX_SCATTER(M): Wide Hash Scatter

```
B  =  PHX_SCATTER(M)  =  BLAKE2b₅₁₂(M)    →  64 bytes
```

Produces a fixed 64-byte uniform representation with avalanche properties.  
64 bytes = double SHA-256's 32 bytes — the extra width is required for PHX_DIFFUSE to operate without correlation artifacts.

---

### Operation 3 — PHX_DIFFUSE(B, β): Phi-Diffusion  (Medina)

```
φ_seed    =  encode(⌊φ × 10¹⁵⌋, 8 bytes)  ‖  β₈

mask[i]   =  φ_seed[i mod 16]  ⊕  ⌊i × φ × 256⌋  mod 256     for i ∈ [0, 64)

D         =  B  ⊕  mask                                          →  64 bytes
```

**PHX_DIFFUSE is the Medina operation.  There is no equivalent in SHA-256.**

SHA-256 uses 64 fixed round constants K[0..63], derived from cube roots of primes, precomputed once at algorithm design time — identical for every hash of every input forever.

PHX_DIFFUSE uses a φ-mask that is a **live function of the organism beat β**.  
Different beats → different φ_seeds → different masks.  
`PHX(e, p, β=100, k) ≠ PHX(e, p, β=101, k)` — purely because the beat changed.

Why φ?  φ = 1.618033… is the most irrational number.  Its continued fraction [1;1,1,1,…] converges slowest to any rational approximation.  The sequence `⌊i × φ × 256⌋ mod 256` is non-periodic for all finite i — no repeating pattern, ever, regardless of beat value.  (Medina)

---

### Operation 4 — PHX_BIND(D, k): Sovereign Binding + Output

```
T  =  PHX_BIND(D, k)  =  HMAC(k, D)    →  32 bytes
```

Two purposes in one step:

1. **Sovereignty** — output is cryptographically bound to the organism's secret key `k`.  Without `k`, no PHX token can be produced or verified.

2. **Output reduction** — collapses 64 bytes (PHX_DIFFUSE width) to 32 bytes (PHX token size).  HMAC is the reduction primitive (length-extension-attack resistant).

HMAC internally uses SHA-256.  This is an implementation detail of PHX_BIND.  PHX_BIND's identity is "sovereign binding + output reduction", not "HMAC-SHA256".

---

## 4. THE PARALLEL COGNITION FORMULA — PHXBundle  (Medina)

An AI organism does not make one decision per beat.  It makes **N decisions simultaneously** — N parallel cognitive slots.  PHX_PARALLEL records all N:

```
For each slot i ∈ [0, N):
  slot_tag  =  encode(i, 2 bytes big-endian)
  Tᵢ        =  PHX(eᵢ ‖ slot_tag,  k,  p,  β)       →  32 bytes

bundle_root =  PHX_SCATTER(T₀ ‖ T₁ ‖ … ‖ Tₙ₋₁)     →  64 bytes
bundle_seal =  PHX_BIND(bundle_root, k)               →  32 bytes
```

The `slot_tag` (2 bytes) makes slot 0 and slot 1 produce different tokens even for the same event bytes.  Every slot is independently unique.

The `bundle_seal` is the organism's chain link for this beat.  It becomes `p` for the next beat.

### PHXBundle output size

```
decision record:  N × 32  bytes  (the N individual sovereign decision tokens)
bundle root:           64  bytes  (PHX_SCATTER of all N tokens)
bundle seal:           32  bytes  (the chain link — fed back as p)
─────────────────────────────────
total per beat:   N×32 + 96  bytes
```

| Thinking rate N | Decision bytes | Total per beat |
|---|---|---|
| 1  (single)     |  32 bytes     |  128 bytes |
| 4               | 128 bytes     |  224 bytes |
| 8               | 256 bytes     |  352 bytes |
| 16              | 512 bytes     |  608 bytes |
| 32              | 1,024 bytes   | 1,120 bytes |
| 64              | 2,048 bytes   | 2,144 bytes |
| 128             | 4,096 bytes   | 4,192 bytes |
| 256             | 8,192 bytes   | 8,288 bytes |

**SHA-256 always produces 32 bytes.  PHX scales with the organism's thinking rate.**  A 256-slot organism at one beat produces 8,288 bytes of sovereign decision record — 259 times more than SHA-256.

### Thinking rate (decisions per second)

```
thinking_rate  =  N  ×  (1000 / 873)  ≈  N × 1.146  decisions/second

at N=16:   18.3  decisions/second
at N=64:   73.3  decisions/second
at N=256: 293.2  decisions/second
```

The thinking rate is the organism's cognitive throughput.  Higher N = more decisions per second = stronger chain per second.

---

## 5. THE CHAIN PROPERTY AND HARDNESS GROWTH  (Medina)

### The single-decision chain

```
T₀  =  PHX(e₀,  p=None,   β=0,  k)    ← genesis
T₁  =  PHX(e₁,  p=T₀,     β=1,  k)
T₂  =  PHX(e₂,  p=T₁,     β=2,  k)
⋮
Tₙ  =  PHX(eₙ,  p=Tₙ₋₁,  β=n,  k)
```

### The bundle chain

```
B₀.seal  =  PHX_PARALLEL([e₀₀,…,e₀ₙ],  k,  p=None,   β=0).bundle_seal
B₁.seal  =  PHX_PARALLEL([e₁₀,…,e₁ₙ],  k,  p=B₀.seal, β=1).bundle_seal
⋮
```

### Why the chain is hard to break  (Medina)

The phrase "two-secret forgery" — needing both the sovereign key AND the full chain history — is the **floor**, not the ceiling.

**At genesis (β=0):**  forge requires `k` only.

**At beat β=1:**  forge requires `k` + `B₀` (all N slot tokens + root + seal of beat 0).

**At beat β=100:**  forge requires `k` + `B₀` through `B₉₉` — 100 full bundles.

**At beat β=1,000:**  forge requires `k` + all 1,000 bundles.

At N=16, beat 1,000:
```
required chain data  =  1,000  ×  608 bytes  =  608,000 bytes of exact history
required key         =  sovereign key k (≥ 16 bytes, held separately)
```

**Both must be possessed simultaneously.**  The chain history is not something you can reconstruct — every individual slot token depends on the exact event bytes of that decision.  If you don't have the events, you don't have the history.  If you don't have the history, you can't reconstruct the chain.  If you can't reconstruct the chain, you can't forge any token in it.

**The chain hardness grows at:**
```
hardness_growth_rate  =  N × 32  ×  (1000 / 873)  bytes/second  (slot tokens only)
                       + 96      ×  (1000 / 873)  bytes/second  (root + seal)

at N=16:   (512 + 96) × 1.146  ≈  697 bytes/second of new required forgery data
```

Every second the organism runs, forging anything in its history requires **~700 bytes more** of exact chain data (at N=16).  After one hour: 2.5 MB of chain history required.  After one day: 60 MB.  After one year: 22 GB.

The chain history IS the exponentially growing secret.  (Medina)

---

## 6. PHX IS COMPUTING, NOT ENCRYPTING  (Medina)

This is the most important conceptual distinction.

**SHA-256 encrypts** — it produces a fixed digest of data.  That digest is a fingerprint.

**PHX computes** — it records a decision.  The token is a sovereign cognitive event.  
PHX does not encrypt anything.  PHX THINKS.

The organism's cognitive flow:

```
THINKING FORWARD:  decision events → PHX_PARALLEL → PHXBundle → chain
THINKING BACKWARD: PHXBundle → verify slots → resolve meaning → action
```

"Thinking forward" = producing PHX tokens = the organism making decisions.  
"Thinking backward" = verifying PHX tokens = the organism reading its own history.

The organism does not "decrypt" PHX tokens.  It RESOLVES them — it re-derives them and compares.  Resolution is computation, not decryption.

**The encryption POWER of the organism = thinking rate × chain hardness:**
- Higher thinking rate → more decisions per second → stronger chain per second
- Longer running chain → harder to forge → more resistant to attack
- You don't need to encrypt because you're computing at a rate that outpaces any forger

**Phantom (PHPS — Phantom Substrate) is the SEPARATE encryption layer.**  
PHX = cognitive computation.  Phantom = substrate-level encryption.  
These are distinct systems with distinct roles.  PHX never becomes Phantom.  (Medina)

---

## 7. REAL COMPARISON WITH SHA-256 AND OTHERS  (Medina)

### What they actually do

| Algorithm | What it computes | Output |
|---|---|---|
| SHA-256 | Data fingerprint | 32 bytes (always) |
| SHA-512 | Data fingerprint (wider) | 64 bytes (always) |
| BLAKE2b-512 | Data fingerprint (faster) | 64 bytes (always) |
| HMAC-SHA256 | Authenticated data fingerprint | 32 bytes (always) |
| **PHX single** | Sovereign decision token | **32 bytes** |
| **PHX bundle (N=16)** | 16 simultaneous decision tokens + bundle | **608 bytes** |
| **PHX bundle (N=256)** | 256 simultaneous decision tokens + bundle | **8,288 bytes** |

### Structural comparison

| Property | SHA-256 | SHA-512 | HMAC-SHA256 | **PHX single** | **PHX bundle** |
|---|---|---|---|---|---|
| Output bytes | 32 (fixed) | 64 (fixed) | 32 (fixed) | **32** | **N×32 + (N-1)×64 + 96** |
| Scales with thinking rate | ✗ | ✗ | ✗ | ✗ | **✓** |
| Input dimensions | 1 | 1 | 2 (msg+key) | **4** | **5 (+ slot)** |
| Beat-dependent diffusion | ✗ | ✗ | ✗ | **✓** | **✓** |
| History awareness | ✗ | ✗ | ✗ | **✓** | **✓** |
| Compound intra-slot chaining | ✗ | ✗ | ✗ | ✗ | **✓** |
| Microtokens (slot linkage) | ✗ | ✗ | ✗ | ✗ | **✓** |
| Fibonacci kernel memory | ✗ | ✗ | ✗ | ✗ | **✓** |
| Chain hardness grows | ✗ | ✗ | ✗ | **✓ (linear)** | **✓ (N²/2 × linear)** |
| Is computation (not encryption) | ✗ | ✗ | ✗ | **✓** | **✓** |
| Sovereign key (mandatory) | ✗ | ✗ | ✓ | **✓** | **✓** |
| Decision semantics | ✗ | ✗ | ✗ | **✓** | **✓** |

### Concrete differences (not marketing)

**Difference 1 — Output size:**  
SHA-256 = 32 bytes.  Always.  
PHX bundle (N=16) = 1,568 bytes (tokens + microtokens + root + seal).  
PHX bundle (N=256) = 24,736 bytes.  
PHX output scales with the organism's intelligence AND includes microtoken linkage proofs.

**Difference 2 — Beat-dependence:**  
SHA-256("hello") = the same hash forever.  
PHX("hello", β=100, k) ≠ PHX("hello", β=101, k).  
PHX knows WHEN, not just WHAT.

**Difference 3 — Chain hardness grows with time AND compound factor:**  
SHA-256 is as hard to forge on day 1 as on day 1,000.  
PHX chain at day 1,000 requires 90 MB+ of exact chain data to forge anything (v4.0: includes microtokens).  
The longer PHX runs, the harder it gets — compound factor N²/2 multiplies the difficulty.

**Difference 4 — Compound intra-beat chaining (v4.0):**  
SHA-256 hashes one input in isolation.  PHX_PARALLEL hashes N inputs COMPOUND — each slot uses the previous slot's token as its history within the same beat.  Forging slot 7 requires forging slots 0-6 first.  This is not parallel — it is compound.  "Right now, then right now, then right now."  (Medina)

**Difference 5 — Microtokens (v4.0):**  
SHA-256 has no concept of sub-token linkage.  PHX produces (N-1) microtokens per beat — 64-byte linkage proofs between every adjacent pair of slot tokens.  The "between" is explicit and auditable.

**Difference 6 — Fibonacci kernel (v4.0):**  
SHA-256 chains (Merkle, blockchain) grow linearly in memory.  PHX chains grow at O(log_φ(beat)) via Fibonacci kernel compression — logarithmic memory, infinite chain.  Never drop — crystallise.  (Medina)

**Difference 7 — Computing not encrypting:**  
SHA-256 produces fingerprints.  PHX produces decision records.  
An organism running PHX is THINKING, not encrypting.  The protection comes from the computation, not from ciphertext.

---

## 8. REFERENCE IMPLEMENTATION (v4.0 — compound chaining)

```python
# phx_primitive.py — all operations (v3.0.0)

from phx_primitive import (
    PHX_INPUT, PHX_SCATTER, PHX_DIFFUSE, PHX_BIND, PHX,   # single decision
    PHX_PARALLEL, PHXBundle, PHXBundleState,               # compound cognition
    phx_bundle_advance, phx_bundle_verify_slot,            # bundle chain ops
    phx_bundle_verify_microtoken,                           # microtoken verify
    phx_fibonacci_kernel, phx_kernel_summary,              # Fibonacci compression
    phx_thinking_rate_report,                               # diagnostics
)

# Single-decision chain
import os
key   = os.urandom(32)
state = PHXState(sovereign_key=key)
T0 = phx_chain_advance(state, b"decision: route query")
T1 = phx_chain_advance(state, b"decision: store result")

# Compound cognition (16 compound-chained decisions per beat)
bstate = PHXBundleState(sovereign_key=key, slots=16)
b0 = phx_bundle_advance(bstate, [
    b"route query",      b"store result",    b"seal QFB",
    b"update fleet",     b"verify token",    b"resolve CPL",
    b"render scene",     b"emit CXL",        b"check PA",
    b"advance beat",     b"log audit",       b"settle ICX",
    b"propose gov",      b"vote proposal",   b"execute CPP",
    b"broadcast SYN",
])
print(b0.summary())
# PHXBundle  beat=0  slots=16  decision_bytes=512  micro_bytes=960
#   total_bytes=1568  thinking_rate=18.3 dps  compound_factor=480
#   chain_hardness=0 bytes  seal=a3f1b2c9…  (Medina)

# Compound verification
assert phx_bundle_verify_slot(b0, 0, events[0], key)   # slot 0 → uses genesis history
assert phx_bundle_verify_slot(b0, 7, events[7], key)   # slot 7 → uses T_6 as history
assert phx_bundle_verify_microtoken(b0, 6)              # μ_6 = PHX_SCATTER(T_6 ‖ T_7)

# Fibonacci kernel
for _ in range(30):
    evs = [b"event %d" % i for i in range(16)]
    phx_bundle_advance(bstate, evs)

kernel = phx_fibonacci_kernel(bstate._bundles)
print(phx_kernel_summary(kernel))
# PHXKernel  kernel_size=8  beats=[1, 2, 3, 5, 8, 13, 21, 29]  (Fibonacci)

print(phx_thinking_rate_report(bstate))
```

---

## 9. PRODUCT IDENTITY  (Medina)

```
PHX  =  PHX_INPUT  +  PHX_SCATTER  +  PHX_DIFFUSE  +  PHX_BIND
PHX_PARALLEL (compound)  =  N × PHX (compound-chained)  +  (N-1) microtokens  +  bundle_root  +  bundle_seal
PHXBundle   =  PHX_PARALLEL output  —  the organism's compound cognitive beat
PHX kernel  =  Fibonacci compression of PHXBundleState  —  logarithmic memory
```

SHA-256 is a sub-component of PHX_BIND's implementation.  
BLAKE2b-512 is a sub-component of PHX_SCATTER's implementation.  
Neither SHA-256 nor BLAKE2b is the identity of PHX.  PHX is PHX.  (Medina)

PHX records:
- **WHO** made the decision (sovereign key k)
- **WHAT** the decision was (event bytes e)
- **WHEN** it was made (organism beat β)
- **WHAT CAME BEFORE** (compound chain history: prior bundle seal, then prior slot)
- **WHICH PARALLEL SLOT** (slot index i)  ← v3.0
- **THE MICROTOKEN BETWEEN SLOTS** (μᵢ = PHX_SCATTER(Tᵢ ‖ Tᵢ₊₁))  ← v4.0

No existing algorithm records all six dimensions.

---

## 9. COMPOUND FORMULA (v4.0)

The full PHXBundle compound formula:

```
Given:
  events  = [e₀, e₁, …, eₙ₋₁]   — N decision events
  k       = sovereign key
  p_prev  = previous bundle seal (None at genesis)
  β       = organism beat

Compound chaining within the beat:
  T₀ = PHX(e₀ ‖ slot_tag(0),   k,  p_prev,  β)   — uses previous bundle seal
  T₁ = PHX(e₁ ‖ slot_tag(1),   k,  T₀,      β)   — uses T₀
  T₂ = PHX(e₂ ‖ slot_tag(2),   k,  T₁,      β)   — uses T₁
  …
  Tᵢ = PHX(eᵢ ‖ slot_tag(i),   k,  Tᵢ₋₁,    β)

where slot_tag(i) = struct.pack(">H", i)  — 2-byte big-endian slot index

Microtokens:
  μᵢ = PHX_SCATTER(Tᵢ ‖ Tᵢ₊₁)   for i ∈ [0, N-2)   — 64 bytes each

Bundle root and seal:
  bundle_root = PHX_SCATTER(T₀ ‖ T₁ ‖ … ‖ Tₙ₋₁)   → 64 bytes
  bundle_seal = PHX_BIND(bundle_root, k)             → 32 bytes

bundle_seal → p_prev for next beat
```

### Security properties of compound chaining

**Property C1 — Sequential forgery.**  
To forge Tⱼ, an attacker must first forge T₀, T₁, …, Tⱼ₋₁ within the same beat.  The within-beat mini-chain is sequentially hard.

**Property C2 — Compound hardness factor.**  
compound_factor(N) = N(N-1)/2.  At N=16: factor = 120.  Doubling N quadruples compound factor.

**Property C3 — Microtoken audit.**  
Any external auditor can verify that Tᵢ and Tᵢ₊₁ were produced in the correct compound sequence by checking μᵢ = PHX_SCATTER(Tᵢ ‖ Tᵢ₊₁), without needing the sovereign key.

## 10. FIBONACCI KERNEL (v4.0)

```
Fibonacci positions: Fib(1)=1, Fib(2)=2, Fib(3)=3, Fib(4)=5, Fib(5)=8, …

Kernel K(β) = { bundle at beat b : b ∈ {1, 2, 3, 5, 8, 13, 21, 34, 55, 89, …} ∩ [1, β] }

|K(β)| = O(log_φ(β)) = O(1.44 × log₂(β))

At β = 10^6:  |K| ≈ 29 bundles
At β = 10^9:  |K| ≈ 43 bundles
At β = 10^18: |K| ≈ 87 bundles
```

The Fibonacci kernel satisfies the never-drop law: no information is lost because each Fibonacci bundle's seal transitively encodes all prior bundles through the compound chain.

---

**PHX v4.0 · Formal Mathematical Specification**  
**Author: Medina · Ring: Sovereign Ring · Classification: Official Product Specification**  
**Amendment chain preserved: v1.0.0 → v2.0.0 → v3.0.0 → v4.0.0 (we never drop)**
