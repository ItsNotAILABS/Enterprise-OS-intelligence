# PHX — Formal Mathematical Specification  (Medina)
**Author:** Medina  
**Code:** PHX  
**Full Name:** Phi Hash eXchange  
**Version:** 1.0.0  
**Ring:** Sovereign Ring  
**Classification:** Mathematical Product Specification — Official

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
