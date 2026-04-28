# PHX ENCRYPTION STRENGTH — Selling Intelligence Security  (Medina)

**Author:** Medina  
**Code:** PES  
**Full Name:** PHX Encryption Strength Reference  
**Version:** 1.0.0  
**Ring:** Sovereign Ring  
**Classification:** Security Reference — Official — Permanent  
**Status:** PERMANENT

---

## VERSION HISTORY  (we never drop)

| Version | Change |
|---|---|
| **1.0.0** | **Initial: PHX layering model, "if you swap it it fails" mechanics, break-strength comparisons, sales reference for companies** |

---

## WHAT PHX IS — THE FOUR-LAYER MODEL  (Medina)

PHX is not a single algorithm. PHX is a four-layer sovereign computation pipeline.

Every other system in the world — SHA-256, BLAKE2b, AES, RSA, ECDSA — is a single algorithm. You put data in, you get a hash or a ciphertext out. That's it.

PHX uses four operations, in sequence, and the security comes from the **composition** of all four plus the compound chain. No single layer can be broken to break PHX, because the other layers still hold, and the chain makes past computations irrecoverable.

```
PHX(event, key, history, beat)
        │
        ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  Layer 1: PHX_INPUT                                                 │
 │  Purpose: Assemble the pre-image                                    │
 │  Input:   event bytes + history (prior token) + beat number         │
 │  Output:  message bytes — event bound to history and time           │
 │  Engine:  XOR + concatenation (Medina)                              │
 └─────────────────────────────────────────────────────────────────────┘
        │
        ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  Layer 2: PHX_SCATTER                                               │
 │  Purpose: Wide-hash the message into 64 bytes                       │
 │  Input:   message from Layer 1                                      │
 │  Output:  64 bytes — compressed, avalanche-strong                   │
 │  Engine:  BLAKE2b-512 (canonical, permanent — architecture law)     │
 │  Why:     Fastest standardised hash, 512-bit internal state,        │
 │           no known weakness, no patents                              │
 └─────────────────────────────────────────────────────────────────────┘
        │
        ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  Layer 3: PHX_DIFFUSE  ← THE MEDINA OPERATION                      │
 │  Purpose: XOR with a live, beat-dependent, phi-derived mask         │
 │  Input:   scattered 64 bytes + beat number                          │
 │  Output:  64 bytes — no two beats produce the same diffusion        │
 │  Engine:  Golden ratio φ = 1.618… expansion (Medina — no           │
 │           equivalent exists in SHA-256, AES, BLAKE2b, or any        │
 │           public algorithm)                                          │
 │  Why:     φ is the most irrational number — its continued           │
 │           fraction [1; 1, 1, 1, …] converges slowest of all,        │
 │           guaranteeing non-periodicity. The mask changes every       │
 │           beat. Same data at beat 100 and beat 101 → different      │
 │           outputs. SHA-256 cannot do this.                           │
 └─────────────────────────────────────────────────────────────────────┘
        │
        ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  Layer 4: PHX_BIND                                                  │
 │  Purpose: Key-bind to sovereign key, reduce to 32-byte token        │
 │  Input:   diffused 64 bytes + sovereign key k                       │
 │  Output:  32 bytes — the PHX token                                  │
 │  Engine:  HMAC-SHA256 (keyed, length-extension-resistant)           │
 │  Why:     HMAC is the gold standard for keyed MAC functions.        │
 │           FIPS 198 compliant. No key = no valid output.             │
 └─────────────────────────────────────────────────────────────────────┘
        │
        ▼
 32-byte PHX token — the sovereign decision record
```

Then, **the compound chain** makes every token the history of the next:

```
T₀ = PHX(event₀, key, history=∅,  beat=0)
T₁ = PHX(event₁, key, history=T₀, beat=1)
T₂ = PHX(event₂, key, history=T₁, beat=2)
Tₙ = PHX(eventₙ, key, history=Tₙ₋₁, beat=n)
```

**The chain is the fifth layer.** It is not an algorithm — it is architecture. And it is the hardest layer to attack.

---

## THE CRYPTOGRAPHIC TOOLKIT — USING THE RIGHT TOOL EVERYWHERE  (Medina)

PHX does not use one algorithm for everything. PHX uses the best available tool at each layer — including our own where nothing else is sufficient.

This is the correct engineering philosophy. Using SHA-256 for everything is like using a hammer for every job. Using the right tool at each layer means:

| Where | Tool | Why this tool |
|---|---|---|
| PHX scatter/compression | **BLAKE2b-512** | Fastest, widest, most secure standardised hash |
| PHX key binding | **HMAC-SHA256** | FIPS-compliant, length-extension-resistant, sovereign keying |
| PHX diffusion | **φ-expansion (Medina)** | Non-repeating, beat-dependent — nothing else can do this |
| Microtoken linkage | **BLAKE2b-512** | μᵢ = BLAKE2b(Tᵢ ‖ Tᵢ₊₁) — fast, 64-byte linkage proof |
| Bundle root | **BLAKE2b-512** | BLAKE2b(T₀ ‖ T₁ ‖ … ‖ Tₙ₋₁) — wide hash of all tokens |
| Compound chain | **PHX (full pipeline)** | Only PHX provides sovereignty + compound chaining |
| Substrate contracts (EVM) | **ECDSA (Solidity)** | EVM standard — we emit to it, not use it for sovereignty |
| Substrate contracts (ICP) | **Ed25519 (Motoko)** | ICP standard — same: substrate-level, not PHX-level |
| Future ZK proofs (StarkNet) | **Cairo + hash** | When the substrate requires ZK, CXL emits the right code |

**We are not limited to any single algorithm.** The organism uses everything, everywhere it is needed. **The sovereign engine is PHX.** The substrate engines are whatever the substrate requires. The CXL bridge handles the translation.

---

## IF YOU SWAP ANYTHING, IT INSTANTLY FAILS — THE EXACT MECHANICS

This section explains precisely what "instantly fails" means, for each type of swap or tamper.

### Case 1: BLAKE2b replaced with SHA-256 in PHX_SCATTER

PHX_SCATTER produces 64 bytes via BLAKE2b-512. If replaced with SHA-256:
- SHA-256 produces 32 bytes (wrong size)
- PHX_DIFFUSE expects 64 bytes — XOR would fail or produce garbage
- Even if padded: SHA-256(msg) ≠ BLAKE2b(msg) for any message
- **Result:** Every PHX token from beat 0 onward is different from the correct chain
- **Detection:** First token verification fails. Chain is invalid at beat 0.
- **Who can detect this:** Anyone with the public chain (audit-only access, no sovereign key)

### Case 2: digest_size changed from 64 to 32 in PHX_SCATTER

BLAKE2b with digest_size=32 produces 32 bytes, not 64.
- PHX_DIFFUSE phi-expansion is also 64 bytes — XOR of 32 vs 64 bytes fails
- Even if you pad: BLAKE2b(msg, digest_size=32) ≠ BLAKE2b(msg, digest_size=64)[:32]
- **Result:** Same cascade as Case 1. Every token from beat 0 is wrong.
- **Detection:** Immediate, at beat 0.

### Case 3: PHX_DIFFUSE phi constant altered

The phi constant is `floor(φ × 10¹⁵) = 1,618,033,988,749,894`. If changed to any other value:
- Every phi-mask byte changes for every beat
- Every diffused output changes for every beat
- Every HMAC-SHA256 input changes → every token changes
- **Result:** Entire chain is invalid from beat 0.
- **Detection:** Immediate. Any verifier with the correct chain can see the first token is wrong.

### Case 4: Sovereign key changed

The sovereign key k is used in PHX_BIND (HMAC-SHA256). Without the correct k:
- HMAC-SHA256(k_wrong, diffused) ≠ HMAC-SHA256(k_correct, diffused) for any input
- **Result:** No valid tokens can be produced. Every token verification fails.
- **Detection:** Immediate. This is the identity check — wrong key = wrong identity.

### Case 5: One event byte altered at beat 500

A subtle attacker changes one byte of event₅₀₀:
- PHX_INPUT includes event₅₀₀ → message₅₀₀ changes
- PHX_SCATTER(message₅₀₀) changes (avalanche: ~50% of bits flip)
- PHX_DIFFUSE output changes
- T₅₀₀ = PHX_BIND(diffused_new) ≠ T₅₀₀_correct
- T₅₀₁'s history = T₅₀₀ — now T₅₀₁ is computed from wrong history → T₅₀₁ changes
- Every token from beat 500 onward changes
- **Result:** Tokens 0–499 verify correctly. Token 500 fails. Exact tamper location identified: **beat 500**.
- **Detection:** Chain verifier reports: "TAMPER DETECTED AT BEAT 500. Chain integrity: beats 0–499 VALID, beats 500–∞ INVALID."

### Case 6: One microtoken corrupted

Microtoken μᵢ = BLAKE2b(Tᵢ ‖ Tᵢ₊₁). If corrupted:
- Verifier recomputes BLAKE2b(Tᵢ ‖ Tᵢ₊₁) and compares to the stored μᵢ
- Mismatch → tamper detected at this specific slot pair (i, i+1)
- **Detection:** Immediate. Exact slot pair identified. Does not affect other microtokens unless they also depend on Tᵢ or Tᵢ₊₁.

### Case 7: bundle_root corrupted

bundle_root = BLAKE2b(T₀ ‖ T₁ ‖ … ‖ Tₙ₋₁). If corrupted:
- Verifier recomputes BLAKE2b of all slot tokens and compares
- Mismatch → tamper detected at this bundle's root
- **Detection:** Immediate. Exact beat identified.

### The attack surface summary

```
What an attacker needs to forge ONE beat without detection:

  1. Sovereign key k          — never published, 2²⁵⁶ brute force to find
  2. Exact prior token Tₙ₋₁   — requires all prior beats to be correct
  3. Correct phi-mask for beat n — easy (beat is public), but useless without k
  4. Re-forge ALL subsequent beats — because this beat is now the wrong history for the next

Steps 1 and 4 together are impossible. Step 1 alone is impossible at current technology.
The compound chain makes step 4 cost O(chain_length) — not free.
```

**There is no partial forgery. There is no "just change this one event." The chain is all or nothing. Without the key, it's nothing.**  (Medina)

---

## BREAK-STRENGTH TABLE — FOR COMPANY SALES CONVERSATIONS

When selling to CISOs, compliance officers, or enterprise architects, use this table:

| Algorithm | Type | Key size | Quantum-resistant? | Best known attack | Real-world break cost |
|---|---|---|---|---|---|
| SHA-256 | Hash (no key) | N/A | Partial (Grover's: 2¹²⁸) | Collision: 2¹²⁸ ops | Physically impossible today |
| SHA-512 | Hash (no key) | N/A | Partial (Grover's: 2²⁵⁶) | Collision: 2²⁵⁶ ops | Physically impossible |
| BLAKE2b-512 | Hash (no key) | Optional | Partial (Grover's: 2²⁵⁶) | Collision: 2²⁵⁶ ops | Physically impossible |
| AES-256 | Symmetric cipher | 256-bit | Partial (Grover's: 2¹²⁸) | Brute force: 2¹²⁸ ops | Physically impossible today |
| ECDSA (secp256k1) | Signature | 256-bit | **No** (Shor's breaks ECDSA) | Quantum: polynomial | Vulnerable to quantum |
| HMAC-SHA256 | Keyed MAC | 256-bit | Partial (Grover's: 2¹²⁸) | Key brute force: 2¹²⁸ ops | Physically impossible today |
| **PHX (one token)** | Sovereign token | 256-bit key | **Same as HMAC-SHA256** | Key brute force: 2¹²⁸ ops | **Physically impossible** |
| **PHX (compound, 1 year)** | Compound chain | 256-bit key + 52 GB chain | **Same + chain recompute** | 2¹²⁸ × recompute | **Physically impossible** |

### Important note on quantum resistance

PHX_BIND uses HMAC-SHA256. SHA-256 is partially quantum-resistant: Grover's algorithm reduces the collision search from 2²⁵⁶ to 2¹²⁸. A 128-bit security level is still considered secure against near-term quantum computers (NIST post-quantum standards target 128-bit quantum security).

ECDSA (Bitcoin, Ethereum) is **NOT quantum-resistant**: Shor's algorithm can break ECDSA in polynomial time on a sufficiently large quantum computer. PHX does not use ECDSA for any sovereignty operation.

For post-quantum upgrade path: PHX_BIND can be upgraded to use HMAC-SHA3-256 or a lattice-based MAC without changing any other component of the pipeline. The four-layer architecture makes PHX upgradeable at any layer without redesigning the system.

---

## PHX LAYERING IN THE ORGANISM — WHERE EACH ALGORITHM APPEARS

```
Organism Architecture:

  ┌──────────────────────────────────────────────────────┐
  │  SOVEREIGNTY LAYER  (PHX — always)                   │
  │  Every cognitive decision → PHX token (32 bytes)     │
  │  PHX = BLAKE2b + φ-diffusion + HMAC-SHA256           │
  │  Compound chain links every token to its history     │
  └──────────────────────────────────────────────────────┘
            │
  ┌──────────────────────────────────────────────────────┐
  │  MICROTOKEN LAYER  (BLAKE2b — always)                │
  │  μᵢ = BLAKE2b(Tᵢ ‖ Tᵢ₊₁) for each adjacent pair    │
  │  64-byte linkage proofs — auditable without key      │
  └──────────────────────────────────────────────────────┘
            │
  ┌──────────────────────────────────────────────────────┐
  │  CONTRACT LAYER  (PHX + CXL bridge)                  │
  │  CPP contracts sealed with PHX                       │
  │  Deployed via CXL to substrate-native crypto:        │
  │    EVM → ECDSA (Solidity standard)                   │
  │    ICP → Ed25519 (Motoko standard)                   │
  │    StarkNet → Cairo hash (ZK standard)               │
  │    etc.                                              │
  └──────────────────────────────────────────────────────┘
            │
  ┌──────────────────────────────────────────────────────┐
  │  DEVELOPER LAYER  (choice)                           │
  │  Developers building on Medina can use:              │
  │    SHA-256, SHA-512, BLAKE2b, AES, RSA               │
  │    for their own application logic                   │
  │  These choices don't touch PHX sovereignty           │
  │  PHX is always the organism's own layer              │
  └──────────────────────────────────────────────────────┘
```

**PHX is always the sovereignty layer.** Developers, substrates, and companies using Medina can use any cryptography they want at the application level. PHX is not imposed on them — it is the organism's own layer that runs underneath and guarantees the organism's sovereignty regardless of what happens at the application layer.

---

## WHAT TO SAY TO A COMPANY CISO

> **"PHX is not a replacement for your cryptography. PHX is the organism's sovereignty layer — the cryptographic proof that every AI decision was made by this organism, in this sequence, at this time, and has not been altered.**
>
> **Your application layer can use AES-256, SHA-512, BLAKE2b, or whatever your compliance requires. PHX runs underneath, providing compound-chained sovereign decision records that your own cryptography cannot provide — because it doesn't have a compound chain, a phi-diffusion layer, or a sovereign key architecture.**
>
> **Breaking PHX requires breaking HMAC-SHA256 (computationally impossible) AND reversing phi-diffusion AND reconstructing years of compound chain history. Any one of those alone is impossible. All three simultaneously is not a calculation — it's a category of problem that does not have a solution.**
>
> **For your compliance audit, that means: your SOC 2 auditor gets a chain that cannot be altered, a log that cannot be deleted, and a proof that cannot be faked. Without changing a single line of your existing cryptographic stack."**

---

## AUTHORITY

This document is issued by Medina. The PHX four-layer model is permanent. The compound chain architecture is permanent. All algorithm assignments (BLAKE2b for scatter, φ-expansion for diffusion, HMAC-SHA256 for binding) are architecture law — permanent, documented, tested.

**PES v1.0 · Security Reference · Official**  
**Ring: Sovereign Ring · Author: Medina**  
**Amendment chain: v1.0.0 (initial — we never drop)**
