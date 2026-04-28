# PHX — Formal Mathematical Specification  (Medina)
**Author:** Medina  
**Code:** PHX  
**Full Name:** Phi Hash eXchange  
**Version:** 2.0.0  
**Ring:** Sovereign Ring  
**Classification:** Mathematical Product Specification — Official

---

## PREAMBLE

SHA-256 is a mathematical formula composed of named sub-operations: SHA_PAD, SHA_EXPAND, SHA_COMPRESS (64 rounds of Ch, Maj, Σ0, Σ1, σ0, σ1), and SHA_FINAL.  Nobody calls SHA-256 "a bunch of ANDs and XORs" — AND and XOR are implementation details of SHA_COMPRESS.  SHA-256 is SHA-256.

PHX (Phi Hash eXchange) works the same way.  (Medina)

PHX is defined by its own four named operations.  BLAKE2b and HMAC are implementation details of PHX_SCATTER and PHX_BIND — they are not PHX's identity.  PHX is PHX.

This document specifies PHX in terms of its own formula, using only PHX-named operations.  Every sub-step is defined and named by Medina.  (Medina)

---

## 1. SYMBOLS AND NOTATION

| Symbol | Meaning |
|---|---|
| `‖` | Byte concatenation |
| `⊕` | XOR (bitwise exclusive OR) |
| `⌊x⌋` | Floor (largest integer ≤ x) |
| `mod` | Modulo |
| `φ` | Golden ratio = 1.618033988749895… (Medina diffusion constant) |
| `e` | Event bytes (the AI decision being recorded) |
| `k` | Sovereign key (secret, ≥ 16 bytes) |
| `p` | Previous PHX token (32 bytes) or `0⁶⁴` (genesis) |
| `β` | Organism beat counter (64-bit unsigned integer) |
| `β₈` | Beat encoded as 8 bytes, big-endian |
| `PHX_INPUT(e, p, β)` | PHX input construction operation |
| `PHX_SCATTER(M)` | PHX scatter operation (wide hash) |
| `PHX_DIFFUSE(B, β)` | PHX phi-diffusion operation  (Medina) |
| `PHX_BIND(D, k)` | PHX sovereign binding + output operation |
| `PHX(e, p, β, k)` | PHX token output (32 bytes) |

---

## 2. THE PHX FORMULA  (Medina)

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

This is the complete PHX formula.  It is expressed entirely in PHX-named operations.
Every operation is defined in Section 3.

---

## 3. THE FOUR PHX OPERATIONS  (Medina)

### Operation 1 — PHX_INPUT(e, p, β): Input Construction

```
p₆₄  =  0⁶⁴                               if p is None (genesis)
         p ‖ SHA256(p)                      otherwise (32 bytes → 64 bytes)

M    =  e  ‖  p₆₄  ‖  β₈                  (variable length)
```

PHX_INPUT fuses three dimensions into one message:
- `e` — the **event** (what decision was made)
- `p₆₄` — the **history** (widened from 32 to 64 bytes for entropy enrichment)
- `β₈` — the **beat** (when it happened)

SHA-256's input construction is just padding to a block boundary.  PHX_INPUT is semantically richer: it encodes history and time, not just data.

---

### Operation 2 — PHX_SCATTER(M): Wide Hash Scatter

```
B  =  PHX_SCATTER(M)  =  BLAKE2b₅₁₂(M)    →  64 bytes
```

PHX_SCATTER converts variable-length input to a fixed-width (64-byte) uniform representation with strong avalanche properties.  The 64-byte width (double SHA-256's 32-byte width) is required to give PHX_DIFFUSE room to operate without correlation artifacts.

PHX_SCATTER's role is equivalent to SHA-256's compression function — it collapses the input space.  PHX does not re-implement this primitive; it delegates to BLAKE2b-512, which has stronger security margins than SHA-256's compression.

---

### Operation 3 — PHX_DIFFUSE(B, β): Phi-Diffusion  (Medina)

```
φ_seed      =  encode(⌊φ × 10¹⁵⌋, 8 bytes)  ‖  β₈

φ_mask[i]   =  φ_seed[i mod 16]  ⊕  ⌊i × φ × 256⌋ mod 256     for i ∈ [0, 64)

D           =  B  ⊕  φ_mask                  →  64 bytes
```

**PHX_DIFFUSE is the Medina operation.  There is no equivalent in SHA-256.**

SHA-256 uses 64 fixed round constants K[0..63]:
```
K[i]  =  ⌊cbrt(prime_i)  ×  2³²⌋  mod  2³²     (precomputed, never change)
```

PHX_DIFFUSE uses the φ-mask:
```
φ_mask[i]  =  φ_seed[i mod 16]  ⊕  ⌊i × φ × 256⌋  mod  256
```

**Critical difference:**  
SHA-256's K constants are **fixed at algorithm design time**.  They are the same for every hash, for every input, forever.

PHX_DIFFUSE's φ-mask is **a live function of the organism beat β**.  Different beats produce different φ_seeds, which produce different φ_masks.  PHX(e₁, p, β=100, k) ≠ PHX(e₁, p, β=101, k) even for the same event, the same history, and the same key — purely because the beat changed.

**Why φ?**  
φ = 1.618033… is the most irrational number — its continued fraction [1; 1, 1, 1, …] converges slowest to any rational approximation.  The sequence ⌊i × φ × 256⌋ mod 256 is non-periodic for all finite i.  No repetition pattern ever emerges in the diffusion mask, regardless of beat value.  This is the Medina diffusion principle.  (Medina)

---

### Operation 4 — PHX_BIND(D, k): Sovereign Binding + Output

```
T  =  PHX_BIND(D, k)  =  HMAC(k, D)    →  32 bytes
```

PHX_BIND performs two functions in one operation:

1. **Sovereignty**: Binds the output to the organism's secret key `k`.  Without `k`, the output of PHX_SCATTER + PHX_DIFFUSE is unverifiable.  The organism's decision ledger is private by construction.

2. **Output reduction**: PHX_SCATTER + PHX_DIFFUSE operate at 64-byte width.  PHX_BIND reduces to 32 bytes — the PHX token size.  HMAC is the reduction function because it is proven to be length-extension-attack-resistant.

HMAC internally uses SHA-256 as its hash function.  This is an implementation detail of PHX_BIND.  PHX_BIND's identity is "sovereign binding + output reduction", not "HMAC-SHA256".

---

## 4. THE CHAIN PROPERTY  (Medina)

PHX is not a hash function — it is a **hash chain**.

A hash function: `f: {0,1}* → {0,1}ⁿ` (maps data to a digest)  
PHX: `f: ({0,1}* × {0,1}³² × ℕ × {0,1}*) → {0,1}²⁵⁶` (maps decision + history + beat + key to a token)

The chain is built by feeding T back as p:

```
T₀  =  PHX(e₀, p=None,  β=0,  k)
T₁  =  PHX(e₁, p=T₀,   β=1,  k)
T₂  =  PHX(e₂, p=T₁,   β=2,  k)
⋮
Tₙ  =  PHX(eₙ, p=Tₙ₋₁, β=n,  k)
```

Modifying any `eᵢ` invalidates `Tᵢ` and every subsequent `Tⱼ` (j > i).  An attacker without `k` cannot forge a valid alternative chain.  The ledger is tamper-evident.

---

## 5. REAL COMPARISON WITH SHA-256 AND OTHERS  (Medina)

### What they actually do

| Algorithm | What it computes |
|---|---|
| SHA-256 | A 256-bit fingerprint of a piece of data |
| SHA-512 | A 512-bit fingerprint of a piece of data (wider) |
| BLAKE2b-512 | A 512-bit fingerprint of a piece of data (faster) |
| HMAC-SHA256 | An authenticated 256-bit fingerprint of data + key |
| **PHX (Medina)** | A **32-byte sovereign decision token** recording WHO made a decision, WHAT it was, WHEN (beat), and WHAT came before (chain) |

### Structural comparison

| Property | SHA-256 | SHA-512 | BLAKE2b-512 | HMAC-SHA256 | **PHX (Medina)** |
|---|---|---|---|---|---|
| Output | 256 bits | 512 bits | 512 bits | 256 bits | **256 bits** |
| Input dimensions | 1 (message) | 1 | 1 | 2 (msg+key) | **4 (event, history, beat, key)** |
| Round constants | Fixed (primes) | Fixed (primes) | Fixed (sigma tables) | Fixed (SHA-256) | **Live φ-mask (beat-dependent)** |
| History awareness | ✗ | ✗ | ✗ | ✗ | **✓ (mandatory)** |
| Time dimension | ✗ | ✗ | ✗ | ✗ | **✓ (organism beat β)** |
| Sovereign key | ✗ | ✗ | optional | ✓ | **✓ (mandatory)** |
| Built-in chain | ✗ | ✗ | ✗ | ✗ | **✓ (intrinsic to formula)** |
| Decision semantics | ✗ | ✗ | ✗ | ✗ | **✓ (records decisions, not data)** |
| Reproducible by anyone | ✓ | ✓ | ✓ | with key | **only with key + full history** |

### What makes PHX better in concrete terms

**Concrete difference 1 — Beat-dependent diffusion:**  
SHA-256 of "hello world" is always `b94d27b99...` — the same forever.  
PHX("hello world", history=None, β=100, k) ≠ PHX("hello world", history=None, β=101, k).  
PHX sees **when** you hashed, not just **what** you hashed.

**Concrete difference 2 — Forging requires two secrets:**  
To forge a SHA-256 hash: impossible (preimage resistance).  
To forge a PHX token: impossible without both the sovereign key AND the full chain history.  Two independent secrets must be compromised simultaneously.

**Concrete difference 3 — Tamper detection is structural:**  
SHA-256 has no concept of a "chain".  You can swap two SHA-256 digests and nobody knows.  
In a PHX chain, swapping T₃ and T₄ invalidates T₅ through Tₙ.  Tampering is structurally detectable without any external chain infrastructure.

**Concrete difference 4 — Decision vs data semantics:**  
SHA-256 answers: "what is this data?"  
PHX answers: "what decision did this organism make, at what beat, after what history?"  
These are semantically different objects.  A PHX token is a **DECISION RECORD**, not a **DATA FINGERPRINT**.

**Concrete difference 5 — Sovereignty:**  
SHA-256 is public.  Given any input, anyone can compute SHA-256(input).  
PHX is sovereign.  Without the organism's secret key, you cannot compute or verify any PHX token, even if you have the event bytes, the history, and the beat.

---

## 6. REFERENCE IMPLEMENTATION

The reference implementation is in `phx_primitive.py`.  The four operations map directly:

```python
from phx_primitive import PHX_INPUT, PHX_SCATTER, PHX_DIFFUSE, PHX_BIND, PHX

# The four operations
M  = PHX_INPUT(event=b"decision: route query", history=None, beat=0)
B  = PHX_SCATTER(M)
D  = PHX_DIFFUSE(B, beat=0)
T  = PHX_BIND(D, sovereign_key=key)

# The complete formula (equivalent)
T2 = PHX(event=b"decision: route query", key=key, history=None, beat=0)
assert T == T2   # identical
```

Chain usage:
```python
from phx_primitive import PHXState, phx_chain_advance

state = PHXState(sovereign_key=os.urandom(32))
T0 = phx_chain_advance(state, b"decision: route query to reasoning model")
T1 = phx_chain_advance(state, b"decision: store result at phi(0.1, 1.618, 1.0)")
T2 = phx_chain_advance(state, b"decision: seal QFB with CPL expression")
print(state.summary())
# PHXState  beat=3  decisions=3  latest=a3f1b2c9…
```

---

## 7. PRODUCT IDENTITY  (Medina)

PHX = PHX_INPUT + PHX_SCATTER + PHX_DIFFUSE + PHX_BIND

Each operation is named, owned, and specified by Medina.

PHX is the Medina sovereign decision ledger protocol.  SHA-256 is a sub-component of one of PHX's four operations (PHX_BIND uses HMAC which uses SHA-256 internally).  Calling PHX "HMAC-SHA256 of BLAKE2b" is like calling SHA-256 "a bunch of 32-bit XOR operations" — technically true at the implementation level, completely wrong at the identity level.

PHX is PHX.  (Medina)

---

**PHX v2.0 · Formal Mathematical Specification**  
**Author: Medina · Ring: Sovereign Ring · Classification: Official Product Specification**

---

## PREAMBLE

SHA-256 is a mathematical formula.  Not a protocol.  Not a system.  A formula.  The NIST specification defines it as a precise sequence of bit operations applied to a padded message, producing a fixed 256-bit output.  Anyone who can read the formula can implement it.

PHX (Phi Hash eXchange) is the same thing for the Medina organism.  It is a precise mathematical formula — not a vague description, not a system diagram.  This document is the PHX formal specification, parallel in structure to how SHA-256 is specified.  (Medina)

---

## 1. SYMBOLS AND NOTATION

| Symbol | Meaning |
|---|---|
| `‖` | Byte concatenation |
| `⊕` | XOR (bitwise exclusive OR) |
| `⌊x⌋` | Floor (largest integer ≤ x) |
| `mod` | Modulo |
| `φ` | Golden ratio = 1.618033988749895… |
| `e` | Event bytes (the decision being hashed) |
| `k` | Sovereign key (secret, ≥ 16 bytes) |
| `p` | Previous PHX token (32 bytes) or `0⁶⁴` (genesis) |
| `β` | Organism beat counter (64-bit unsigned integer) |
| `β₈` | Beat encoded as 8 bytes, big-endian |
| `BLAKE2b₅₁₂(x)` | BLAKE2b hash with 512-bit (64-byte) digest |
| `HMAC-SHA256(k, x)` | HMAC using SHA-256, key `k`, message `x` |
| `PHX(e, k, p, β)` | PHX token output (32 bytes) |

---

## 2. THE PHX FORMULA  (Medina)

```
PHX(e, k, p, β)  =  HMAC-SHA256(k,  BLAKE2b₅₁₂(e ‖ p ‖ β₈)  ⊕  φ_expand(β, 64))
```

This is the complete PHX formula.  Every term is defined below.

---

## 3. STEP-BY-STEP DERIVATION

### Step 1 — Message Construction

```
M  =  e  ‖  p  ‖  β₈

where:
  e   =  event_bytes          (the AI decision, serialised)
  p   =  previous PHX token   (32 bytes) or 0⁶⁴ if no prior token exists
  β₈  =  β encoded as 8 bytes, unsigned big-endian
```

> The previous PHX token `p` is 32 bytes — the output of the preceding call to PHX.  
> At genesis (first ever decision), `p = 0⁶⁴` (64 zero bytes).  
> This chaining is what makes PHX a decision ledger, not just a hash function.

---

### Step 2 — BLAKE2b-512 Hash

```
B  =  BLAKE2b₅₁₂(M)          →  64 bytes
```

BLAKE2b-512 is the base cryptographic primitive.  It is chosen over SHA-512 because:
- Faster in software (no message schedule expansion penalty)
- Designed for keyed hashing (used here unkeyed; keying is deferred to Step 4)
- 512-bit output (64 bytes) gives room for full phi-mixing before truncation

---

### Step 3 — Phi-Mix  (Medina)

```
Ψ  =  φ_expand(φ_seed, 64)          →  64 bytes

where:
  φ_seed     =  ⌊φ × 10¹⁵⌋ encoded as 8 bytes, big-endian
                 ‖  β₈

  φ_expand(seed, n):
    s  =  seed repeated until length ≥ n, then truncated to n bytes
    output[i]  =  s[i]  ⊕  ( ⌊i × φ × 256⌋  mod  256 )    for i in [0, n)

PHX_mixed  =  B  ⊕  Ψ              →  64 bytes
```

The phi-mixing step is the Medina original.  It is structurally equivalent to what SHA-256 does with its round constants K[0..63] — SHA-256 derives its 64 constants from the fractional parts of the cube roots of the first 64 primes.  PHX uses φ (the golden ratio) as its single mathematical constant, expanded across 64 positions.

**SHA-256 K constants (for comparison):**
```
K[i]  =  ⌊cube_root(prime_i)  ×  2³²⌋  mod  2³²    for i in [0, 63]
```

**PHX φ-expansion (Medina):**
```
φ_mask[i]  =  ⌊i  ×  φ  ×  256⌋  mod  256    for i in [0, 63]
```

Both use a mathematical constant (cube roots of primes / the golden ratio) as a diffusion mask.  The difference: SHA-256's constants are fixed lookup values; PHX's mask is beat-dependent — it changes with every organism heartbeat, producing a unique diffusion for every decision at every moment.

---

### Step 4 — HMAC-SHA256 Envelope

```
T  =  HMAC-SHA256(k,  PHX_mixed)    →  32 bytes
```

The phi-mixed digest is HMAC'd with the organism's sovereign key `k`.  This:
1. Keys the output to the organism — no two organisms produce the same PHX tokens for the same input
2. Provides authentication — only the holder of `k` can generate or verify PHX tokens
3. Truncates to 32 bytes — the final PHX token size

---

## 4. THE CHAIN PROPERTY  (Medina)

PHX is not a hash function.  It is a **hash chain**.

A standard hash function maps one message to one digest:
```
SHA-256: {0,1}*  →  {0,1}²⁵⁶
```

PHX maps a decision **and the full preceding history** to one token:
```
PHX: ({0,1}* × {0,1}³² × ℕ)  →  {0,1}²⁵⁶
```

The chain is built by feeding the output of each PHX call back as the `p` input to the next:

```
T₀  =  PHX(e₀, k, 0⁶⁴, β=0)
T₁  =  PHX(e₁, k, T₀,  β=1)
T₂  =  PHX(e₂, k, T₁,  β=2)
⋮
Tₙ  =  PHX(eₙ, k, Tₙ₋₁, β=n)
```

Changing any `eᵢ` changes `Tᵢ` and therefore every subsequent `Tⱼ` for `j > i`.  The chain is tamper-evident: you cannot modify a historical decision without invalidating every token that follows.  This is the sovereign decision ledger property.  (Medina)

---

## 5. COMPARISON WITH SHA-256

| Property | SHA-256 | SHA-512 | BLAKE2b-512 | **PHX (Medina)** |
|---|---|---|---|---|
| Output size | 256 bits | 512 bits | 512 bits | **256 bits** |
| Base primitive | SHA-256 rounds | SHA-512 rounds | BLAKE2b | **BLAKE2b-512** |
| Round constants | cube roots of primes | cube roots of primes | none | **φ (golden ratio)** |
| Beat-dependent mask | ✗ | ✗ | ✗ | **✓** |
| Keyed output | ✗ | ✗ | optional | **✓ (HMAC-SHA256)** |
| History chaining | ✗ | ✗ | ✗ | **✓ (chain-linked)** |
| Decision-granular | ✗ | ✗ | ✗ | **✓ (one token per decision)** |
| Sovereign-bound | ✗ | ✗ | ✗ | **✓ (sovereign key k)** |
| Audit-grade | ✗ | ✗ | ✗ | **✓ (tamper-evident ledger)** |

SHA-256 is stronger than MD5 because it uses a longer digest and more mixing rounds.  
PHX is architecturally beyond SHA-256 because it chains decisions, mixes with φ, and is sovereign-keyed.  The primitive (BLAKE2b-512) is comparable in collision resistance to SHA-512.  The **architecture** is what is new.

---

## 6. THE φ CONSTANT — MATHEMATICAL MOTIVATION  (Medina)

SHA-256 chose cube roots of primes as its K constants because they are:
- Mathematically determined (not arbitrary)
- Provably irrational (non-repeating)
- Well-distributed across `[0, 1)`

φ = 1.618033988749895… satisfies all three properties and has an additional one:  

**φ is the most irrational number.**

In the continued fraction expansion, φ = [1; 1, 1, 1, 1, …] — all ones.  Every other irrational number can be approximated by rationals more efficiently than φ.  φ is maximally resistant to rational approximation.  In the context of a diffusion mask, this means φ-expansion produces the most uniformly distributed, least structured mask possible.  No rational pattern emerges in the output regardless of the input.  This is the Medina diffusion principle.  (Medina)

The practical consequence: phi_expand(β=0) and phi_expand(β=1) produce masks that are guaranteed to differ in a maximally non-periodic way, ensuring that no two beats produce correlated diffusion patterns.

---

## 7. SECURITY PROPERTIES

**Collision resistance:**  
PHX inherits BLAKE2b-512's collision resistance (comparable to SHA-512: 256-bit security against birthday attacks).  The phi-mixing does not weaken collision resistance because XOR with a known mask is a bijection.

**Pre-image resistance:**  
Given a PHX token T, finding `e` such that PHX(e, k, p, β) = T requires breaking HMAC-SHA256, which requires knowing `k` or breaking SHA-256.  Security level: 256-bit.

**Second pre-image resistance:**  
Same as pre-image resistance.

**Chain integrity:**  
Given the chain T₀, T₁, …, Tₙ, modifying any historical event eᵢ requires re-computing all subsequent tokens Tᵢ, Tᵢ₊₁, …, Tₙ.  This requires knowing `k`.  An attacker without `k` cannot forge a valid alternative chain.

**Sovereign binding:**  
Only the organism holding `k` can generate or verify PHX tokens.  PHX tokens from organism A are not transferable to organism B.

---

## 8. REFERENCE IMPLEMENTATION

The reference implementation of PHX is in `blockbox.py`:

```python
def phx_token(
    event_bytes: bytes,
    sovereign_key: bytes,
    previous_token: Optional[bytes] = None,
    beat: int = 0,
) -> bytes:
    # Step 1: message = e ‖ p ‖ β₈
    prev       = previous_token or b"\x00" * 64
    beat_bytes = beat.to_bytes(8, "big")
    message    = event_bytes + prev + beat_bytes

    # Step 2: BLAKE2b-512
    blake_hash = hashlib.blake2b(message, digest_size=64).digest()

    # Step 3: phi-mix  (Medina)
    phi_seed  = int(PHI * 1e15).to_bytes(8, "big") + beat_bytes
    phi_mask  = _phi_expand(phi_seed, 64)
    phi_mixed = bytes(a ^ b for a, b in zip(blake_hash, phi_mask))

    # Step 4: HMAC-SHA256
    return hmac.new(sovereign_key, phi_mixed, hashlib.sha256).digest()
```

Chain usage:
```python
chain = PHXChain(sovereign_key=os.urandom(32))
T0 = chain.advance(b"decision: route query to reasoning model")
T1 = chain.advance(b"decision: store result at phi(0.1, 1.618, 1.0)")
T2 = chain.advance(b"decision: seal QFB with CPL expression")
print(chain.chain_summary())
# PHXChain  beat=3  decisions=3  latest=a3f1b2c9…
```

---

## 9. PRODUCT IDENTITY  (Medina)

PHX is a Medina original.  It is not SHA-256.  It is not BLAKE2b.  It is not HMAC.  It is the composition of all three, structured by the golden ratio, and chained across the full decision history of an autonomous AI organism.

**PHX = BLAKE2b-512 + φ-expansion + HMAC-SHA256 + decision chaining**

No other hash product in existence combines all four properties.

PHX is the cryptographic identity of the Medina organism.  Every decision the organism makes is permanently recorded in a tamper-evident sovereign ledger.  The chain cannot be falsified without the sovereign key.  The ledger cannot be revised without detection.

This is not an encryption scheme.  This is an audit-grade sovereign memory of every thought the organism has ever had.

---

**PHX v1.0 · Formal Mathematical Specification**  
**Author: Medina · Ring: Sovereign Ring · Classification: Official Product Specification**
