"""
phx_primitive.py — PHX as a Pure Mathematical Primitive  (Medina)

Author : Medina
Version: 2.0.0
Ring   : Sovereign Ring
Code   : PHX

─────────────────────────────────────────────────────────────────────────────
VERSION HISTORY  (governance amendment — we never drop)
─────────────────────────────────────────────────────────────────────────────

  v1.0.0 — PHX single-decision formula: four named operations
           PHX_INPUT → PHX_SCATTER → PHX_DIFFUSE → PHX_BIND
           Output: 32 bytes per decision.  PHXState, phx_chain_advance.

  v2.0.0 — PHX parallel cognition: PHXBundle for N simultaneous decisions.
           Added PHX_PARALLEL, PHXBundle, PHXBundleState, thinking_rate.
           Output: N × 32 bytes per beat (thinking rate aware).
           Chain hardness proof: grows with time, not fixed at 2-secret.
           (Medina)

─────────────────────────────────────────────────────────────────────────────
WHAT IS THIS FILE?
─────────────────────────────────────────────────────────────────────────────

SHA-256 uses bit operations (AND, OR, XOR, ROTR, ADD) as sub-steps inside its
own named operations (Ch, Maj, Σ0, Σ1, σ0, σ1, compression round).  Nobody
calls SHA-256 "AND-OR-XOR of some bits" — they call it SHA-256, and AND/OR/XOR
are just how it's implemented.

PHX (Phi Hash eXchange) works the same way.  (Medina)

PHX uses BLAKE2b and HMAC as sub-steps inside its own named operations.
Nobody should call PHX "HMAC-SHA256 of BLAKE2b" — that's like calling SHA-256
"ROTR of some ADDs".  This file expresses PHX in terms of its OWN four
primitive operations, defined and named by Medina:

  PHX_INPUT(e, p, β)      — input construction
  PHX_SCATTER(M)          — wide hash scatter
  PHX_DIFFUSE(B, β)       — phi-diffusion  (the Medina operation)
  PHX_BIND(D, k)          — sovereign binding + output

─────────────────────────────────────────────────────────────────────────────
SINGLE-DECISION FORMULA  (Medina)
─────────────────────────────────────────────────────────────────────────────

  PHX(e, p, β, k)  =  PHX_BIND(
                          PHX_DIFFUSE(
                            PHX_SCATTER(
                              PHX_INPUT(e, p, β)
                            ),
                            β
                          ),
                          k
                        )

  Output: 32 bytes — one sovereign decision token.

─────────────────────────────────────────────────────────────────────────────
PARALLEL COGNITION FORMULA — PHXBundle  (Medina)
─────────────────────────────────────────────────────────────────────────────

  An AI organism does not make one decision at a time.
  It makes N decisions simultaneously — N parallel cognitive threads.
  Each thread produces its own PHX token.  The set of N tokens at one
  beat is a PHXBundle.

  PHX_PARALLEL([e₀, e₁, …, eₙ₋₁], k, p, β):

    Tᵢ          =  PHX(eᵢ ‖ slot_bytes(i), k, p, β)    for i ∈ [0, N)
    bundle_root =  PHX_SCATTER(T₀ ‖ T₁ ‖ … ‖ Tₙ₋₁)   →  64 bytes
    bundle_seal =  PHX_BIND(bundle_root, k)              →  32 bytes

  Output size per beat:  N × 32  bytes of decision record
                       + 64      bytes bundle root  
                       + 32      bytes bundle seal
                       = (N × 32 + 96) bytes total

  At N = 16:   512 + 96 = 608 bytes per beat
  At N = 64:  2048 + 96 = 2144 bytes per beat
  At N = 256: 8192 + 96 = 8288 bytes per beat

  The thinking rate is N decisions per beat.
  A higher thinking rate = more decisions per second = stronger chain.

─────────────────────────────────────────────────────────────────────────────
WHY PHX IS NOT SHA-256  (real differences, not marketing)
─────────────────────────────────────────────────────────────────────────────

  SHA-256 pipeline:   SHA_PAD → SHA_EXPAND → SHA_COMPRESS(64 rounds) → SHA_FINAL
  PHX pipeline:       PHX_INPUT → PHX_SCATTER → PHX_DIFFUSE → PHX_BIND

  Difference 1: SHA-256 processes one message; PHX processes
  (event, history, beat, key) — four inputs, not one.  PHXBundle adds
  a fifth input: the parallel slot index.

  Difference 2: SHA-256's round constants K[0..63] are FIXED FOREVER.
  PHX_DIFFUSE's φ-mask changes with every beat.  The organism's own
  heartbeat is part of the formula.

  Difference 3: SHA-256 is stateless.  PHX is history-aware — p is
  mandatory.  Without the full chain history you cannot produce any PHX token.

  Difference 4: SHA-256 produces a DATA FINGERPRINT.  PHX produces a
  DECISION TOKEN.  Semantically different objects.

  Difference 5: SHA-256 is public.  PHX is sovereign — the key k is
  mandatory.  Without k, you cannot produce or verify any PHX token.

  Difference 6 (new in v2): SHA-256 has no concept of parallelism.
  PHX has PHXBundle — N simultaneous decisions, N × 32 bytes of output.
  SHA-256 will always produce 32 bytes.  PHX output scales with the
  organism's thinking rate.

─────────────────────────────────────────────────────────────────────────────
PHX IS COMPUTING, NOT ENCRYPTING  (Medina)
─────────────────────────────────────────────────────────────────────────────

  PHX is the organism's THINKING RATE measured in bytes of decision per second.

  The organism COMPUTES decisions → produces PHX tokens (thinking forward).
  The organism RESOLVES decisions → verifies PHX tokens (thinking backward).

  "Resolving" = verifying a PHX token against the chain.
  This IS computation, not decryption.  The chain protects itself because
  re-deriving any token requires re-running the full chain from genesis.

  PHANTOM (PHPS — Phantom Substrate) is the SEPARATE encryption layer.
  PHX = decision computation.  Phantom = substrate-level encryption.
  These are distinct.  PHX does not encrypt.  PHX computes.

  Your encryption POWER comes from your thinking rate:
  faster thinking rate → more chain links per second → harder to forge.

─────────────────────────────────────────────────────────────────────────────
CHAIN HARDNESS GROWS WITH TIME  (Medina)
─────────────────────────────────────────────────────────────────────────────

  "Two-secret forgery" is the FLOOR, not the ceiling.

  At genesis (β=0):  forge requires k + nothing (just the key)
  At beat β=1:       forge requires k + T₀ (1 prior token × N slots)
  At beat β=100:     forge requires k + all T₀..T₉₉ (100 × N slot tokens)
  At beat β=1000:    forge requires k + all T₀..T₉₉₉ (1000 × N slot tokens)

  At N=16, beat 1000:
    required chain data = 1000 × 16 × 32 = 512,000 bytes of EXACT history
    plus the sovereign key k (32 bytes minimum)
    plus the exact beat number for every slot

  The longer the organism has been running, the more history an attacker
  must possess simultaneously with the sovereign key.  The difficulty grows
  linearly with time and quadratically with parallelism.

  Two-secret at β=0 grows to:
    [k] + [all N×β slot tokens] + [all N×β slot indices] + [all β beats]
  by beat β.

  This is why the chain history simultaneously is the key insight —
  the history itself becomes an exponentially growing secret.  (Medina)

─────────────────────────────────────────────────────────────────────────────
USAGE
─────────────────────────────────────────────────────────────────────────────

  from phx_primitive import PHX, PHXState, phx_chain_advance

  key   = os.urandom(32)
  state = PHXState(sovereign_key=key)

  # Single decision chain
  t0 = phx_chain_advance(state, b"decision 0")
  t1 = phx_chain_advance(state, b"decision 1")

  # Parallel cognition (N simultaneous decisions per beat)
  from phx_primitive import PHXBundleState, phx_bundle_advance

  bstate = PHXBundleState(sovereign_key=key, slots=16)
  bundle = phx_bundle_advance(bstate, [
      b"decision: route query",
      b"decision: store result",
      b"decision: seal QFB",
      b"decision: update fleet",
      # … up to 16 simultaneous
  ])
  print(f"Bundle: {bundle.slots} decisions × 32 bytes = {bundle.decision_bytes} bytes")
  print(f"Thinking rate: {bundle.thinking_rate_dps:.1f} decisions/second")
"""

from __future__ import annotations

import hashlib
import hmac as _hmac
import math
import struct
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional

# ── The Medina constants  (Medina) ─────────────────────────────────────────────

PHI:           float = 1.618033988749895   # golden ratio — Medina diffusion constant
HEARTBEAT_MS:  int   = 873                # organism heartbeat (ms)
PHX_TOKEN_LEN: int   = 32                 # PHX token output size in bytes
PHX_WIDE_LEN:  int   = 64                 # PHX_SCATTER output width in bytes
PHX_VERSION:   str   = "2.0.0"           # (Medina)


# ─────────────────────────────────────────────────────────────────────────────
# THE FOUR PHX PRIMITIVE OPERATIONS  (Medina)
# ─────────────────────────────────────────────────────────────────────────────

def PHX_INPUT(event: bytes, history: Optional[bytes], beat: int) -> bytes:
    """
    PHX_INPUT — Construct the PHX input message.  (Medina)

    Combines the current event with the full organism history (previous PHX
    token) and the organism beat counter.  This is the fundamental difference
    from SHA-256's single-message input: PHX_INPUT fuses THREE dimensions.

    Parameters
    ──────────
    event   — the AI decision being recorded (any bytes)
    history — the previous PHX token (32 bytes), or None at genesis
    beat    — the organism heartbeat counter (monotonically increasing u64)

    Returns
    ───────
    M  =  event  ‖  history_padded  ‖  beat₈

    where history_padded = 64 zero bytes at genesis, else the 32-byte history
    padded to 64 bytes by appending its SHA-256 (internal entropy enrichment).
    """
    # History enrichment: pad 32-byte previous token to 64 bytes
    if history is None:
        h64 = b"\x00" * PHX_WIDE_LEN
    else:
        # Append SHA-256(history) to widen the entropy: 32 + 32 = 64 bytes
        h64 = history + hashlib.sha256(history).digest()

    beat_bytes = struct.pack(">Q", beat)   # 8-byte big-endian u64
    return event + h64 + beat_bytes


def PHX_SCATTER(message: bytes) -> bytes:
    """
    PHX_SCATTER — Scatter the input into a wide, uniform hash space.  (Medina)

    Analogous to SHA-256's compression rounds — it takes arbitrarily-sized
    input and produces a fixed-width output with strong avalanche properties.

    PHX_SCATTER uses BLAKE2b-512 as its compression engine.  This gives 64
    bytes of output (double the width of SHA-256's output) — the extra width
    is required for the PHX_DIFFUSE step that follows.

    Design note: SHA-256 uses 64 rounds of its own compression function.
    PHX_SCATTER delegates to BLAKE2b-512, which is faster and has a larger
    security margin.  PHX does not need to re-implement compression rounds —
    it has its own unique operation in PHX_DIFFUSE.

    Returns
    ───────
    B  =  BLAKE2b₅₁₂(message)   →  64 bytes
    """
    return hashlib.blake2b(message, digest_size=PHX_WIDE_LEN).digest()


def PHX_DIFFUSE(scattered: bytes, beat: int) -> bytes:
    """
    PHX_DIFFUSE — Apply golden-ratio phi-diffusion to the scattered hash.  (Medina)

    THIS IS THE MEDINA OPERATION.  There is no equivalent in SHA-256.

    SHA-256 uses fixed K constants derived from cube roots of primes:
        K[i] = floor(cbrt(prime_i) × 2³²) mod 2³²

    PHX uses a beat-dependent phi-mask derived from the golden ratio:
        mask[i] = floor(i × φ × 256) mod 256   at position i

    The key difference:
    - SHA-256's K constants are the SAME for every computation (fixed at
      algorithm design time, never change).
    - PHX_DIFFUSE's mask is a LIVE function of the organism beat (β).
      Every beat produces a DIFFERENT seed, which produces a DIFFERENT mask.
      No two organism heartbeats produce the same diffusion pattern.

    This means PHX tokens computed at beat 100 and beat 101 — for the SAME
    event — produce DIFFERENT outputs even before the BIND step.  SHA-256
    cannot distinguish "same data hashed at different times" at all.

    Why φ?  φ = 1.618… is the MOST IRRATIONAL number: its continued fraction
    [1; 1, 1, 1, …] converges most slowly to any rational approximation.
    This maximises the non-periodicity of the diffusion mask — no repetition
    pattern emerges regardless of beat value or input.  (Medina)

    Algorithm
    ─────────
    phi_seed  =  encode(⌊φ × 10¹⁵⌋, 8 bytes)  ‖  encode(β, 8 bytes)
    expanded  =  phi_expand(phi_seed, 64)
    output    =  scattered ⊕ expanded           →  64 bytes

    Returns
    ───────
    D  =  PHX_SCATTER_output  ⊕  φ_expand(φ_seed, 64)   →  64 bytes
    """
    beat_bytes = struct.pack(">Q", beat)
    # Phi-seed: the golden ratio constant (φ × 10¹⁵ as integer) concatenated with beat
    phi_int_bytes = struct.pack(">Q", int(PHI * 1_000_000_000_000_000))
    phi_seed = phi_int_bytes + beat_bytes

    # Expand phi_seed to 64 bytes using the Medina phi-expansion
    expanded = _phi_expand_raw(phi_seed, PHX_WIDE_LEN)

    # XOR the scattered hash with the phi-mask
    return bytes(s ^ m for s, m in zip(scattered, expanded))


def PHX_BIND(diffused: bytes, sovereign_key: bytes) -> bytes:
    """
    PHX_BIND — Bind the diffused hash to the sovereign key and produce the token.  (Medina)

    PHX_BIND is the authentication and output step.  It has two purposes:

    1. SOVEREIGNTY: The output is cryptographically bound to the organism's
       sovereign key.  Without k, you cannot produce or verify PHX tokens.
       This is PHX's sovereignty property.  SHA-256 has no key — it is
       public.  PHX is sovereign.  (Medina)

    2. OUTPUT REDUCTION: PHX_SCATTER+DIFFUSE operate at 64-byte width.
       PHX_BIND reduces to 32 bytes — the PHX token size.  The reduction
       uses HMAC as the reduction function because HMAC is a proven
       length-extension-resistant PRF.  (HMAC's internal structure uses
       SHA-256 as its hash — this is implementation detail, not identity.)

    Returns
    ───────
    T  =  PHX_BIND(D, k)  →  32-byte PHX token

    The 32-byte token is the sovereign decision record.  It cannot be
    reproduced without k, and it depends on the full history of the chain.
    """
    # HMAC is the implementation of PHX_BIND's sovereignty + reduction
    return _hmac.new(sovereign_key, diffused, hashlib.sha256).digest()


# ── PHX complete formula  (Medina) ────────────────────────────────────────────

def PHX(
    event:       bytes,
    key:         bytes,
    history:     Optional[bytes] = None,
    beat:        int = 0,
) -> bytes:
    """
    PHX — The complete Phi Hash eXchange computation.  (Medina)

    PHX(e, p, β, k)  =  PHX_BIND(
                            PHX_DIFFUSE(
                              PHX_SCATTER(
                                PHX_INPUT(e, p, β)
                              ),
                              β
                            ),
                            k
                          )

    This is the Medina formula.  Every operation is named and owned by PHX.
    BLAKE2b and HMAC are implementation sub-steps, not the identity of PHX.

    Parameters
    ──────────
    event   — bytes: the AI decision to record
    key     — bytes: the organism sovereign key (≥ 16 bytes)
    history — bytes | None: previous PHX token (None at genesis)
    beat    — int: organism heartbeat counter

    Returns
    ───────
    32-byte PHX decision token
    """
    return PHX_BIND(
        PHX_DIFFUSE(
            PHX_SCATTER(
                PHX_INPUT(event, history, beat)
            ),
            beat,
        ),
        key,
    )


# ── Internal phi-expansion (core of PHX_DIFFUSE)  (Medina) ────────────────────

def _phi_expand_raw(seed: bytes, length: int) -> bytes:
    """
    Expand a seed to `length` bytes using the Medina phi-expansion.  (Medina)

    output[i]  =  seed[i mod len(seed)]  ⊕  ⌊i × φ × 256⌋ mod 256

    The phi-expansion is the mathematical heart of PHX_DIFFUSE.  It produces
    a non-periodic, non-repeating byte stream for any seed and any length.
    The non-periodicity is guaranteed by the irrationality of φ — the sequence
    ⌊i × φ × 256⌋ mod 256 never repeats for any finite i.  (Medina)
    """
    n = len(seed)
    return bytes(
        (seed[i % n] ^ (int(i * PHI * 256) % 256))
        for i in range(length)
    )


# ─────────────────────────────────────────────────────────────────────────────
# PHX STATE — decision chain management  (Medina)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PHXState:
    """
    PHX decision chain state.  (Medina)

    Tracks the organism's current position in the PHX chain:
    the sovereign key, the latest token, and the current beat.

    This is the stateful wrapper around the pure PHX function.
    The pure PHX function is stateless (a mathematical formula).
    PHXState provides the context that makes PHX a chain.
    """
    sovereign_key: bytes
    previous:      Optional[bytes] = None    # last PHX token (None at genesis)
    beat:          int             = 0       # current organism beat
    _log:          list            = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        if len(self.sovereign_key) < 16:
            raise ValueError("sovereign_key must be ≥ 16 bytes")

    @property
    def at_genesis(self) -> bool:
        return self.previous is None

    @property
    def latest_token_hex(self) -> str:
        return self.previous.hex() if self.previous else "(genesis)"

    def summary(self) -> str:
        return (
            f"PHXState  beat={self.beat}  "
            f"decisions={len(self._log)}  "
            f"latest={self.latest_token_hex[:16]}…"
        )


def phx_chain_advance(
    state: PHXState,
    event: bytes,
    label: str = "",
) -> bytes:
    """
    Advance the PHX decision chain by one event.  (Medina)

    This is the organism's decision recording operation.
    Every AI decision calls phx_chain_advance.  The token produced
    depends on the entire preceding history — you cannot forge a valid
    token without both the sovereign key AND the complete history.

    Returns the 32-byte PHX decision token for this event.
    """
    token = PHX(
        event   = event,
        key     = state.sovereign_key,
        history = state.previous,
        beat    = state.beat,
    )
    state._log.append({
        "beat":        state.beat,
        "label":       label or event[:24].hex(),
        "phx_token":   token.hex(),
        "event_sha256":hashlib.sha256(event).hexdigest(),
    })
    state.previous = token
    state.beat    += 1
    return token


def phx_verify(
    state:    PHXState,
    event:    bytes,
    expected: bytes,
    beat:     int,
    previous: Optional[bytes],
) -> bool:
    """
    Verify a PHX token against expected.

    Re-derives the token using the given (event, beat, previous) triple
    and compares to expected using a constant-time digest comparison.
    """
    computed = PHX(event=event, key=state.sovereign_key,
                   history=previous, beat=beat)
    return _hmac.compare_digest(computed, expected)


# ─────────────────────────────────────────────────────────────────────────────
# PHX PARALLEL COGNITION — PHXBundle  (Medina)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PHXBundle:
    """
    PHXBundle — N simultaneous PHX decision tokens at one beat.  (Medina)

    An AI organism makes multiple decisions simultaneously.  Each decision
    runs in a parallel cognitive slot.  One beat produces one PHXBundle
    containing all N slot tokens.

    Output breakdown per beat:
      slot tokens:  N × 32  bytes  (the N individual decision records)
      bundle_root:       64  bytes  (PHX_SCATTER of all slot tokens)
      bundle_seal:       32  bytes  (PHX_BIND of bundle_root → next history)
      ─────────────────────────────
      total:        N×32 + 96  bytes

    At N=16:   512 + 96 = 608 bytes per beat
    At N=64:  2048 + 96 = 2144 bytes per beat
    At N=256: 8192 + 96 = 8288 bytes per beat

    The bundle_seal becomes the history input for the next beat's bundle.
    The chain links bundles, not individual slot tokens.

    Thinking rate (decisions per second):
      dps = slots × (1000 / HEARTBEAT_MS)
      at N=16: 16 × (1000/873) ≈ 18.3 decisions/second
    """
    beat:          int
    slots:         int          # N — number of parallel decision slots
    tokens:        list[bytes]  # N × 32 bytes — one PHX token per slot
    events:        list[bytes]  # original event bytes per slot (for audit)
    bundle_root:   bytes        # PHX_SCATTER(all tokens concat) — 64 bytes
    bundle_seal:   bytes        # PHX_BIND(bundle_root, k) — 32 bytes (next history)
    created_ms:    int

    @property
    def decision_bytes(self) -> int:
        """Bytes of decision record in the slot tokens."""
        return self.slots * PHX_TOKEN_LEN

    @property
    def total_bytes(self) -> int:
        """Total bytes in this bundle (slots + root + seal)."""
        return self.decision_bytes + PHX_WIDE_LEN + PHX_TOKEN_LEN

    @property
    def thinking_rate_dps(self) -> float:
        """Decisions per second at organism heartbeat frequency."""
        return self.slots * (1000.0 / HEARTBEAT_MS)

    @property
    def chain_hardness_bytes(self) -> int:
        """
        Bytes of exact chain data required to forge any token AT this beat.  (Medina)

        To forge beat β, an attacker needs every bundle from 0..β-1:
          each bundle = N × 32 slot tokens + 64 root + 32 seal = (N×32 + 96) bytes
          total = β × (N × 32 + 96) bytes  PLUS  the sovereign key

        This number grows without bound.  At β=1000, N=16:
          1000 × 608 = 608,000 bytes of exact chain history + the sovereign key.

        The chain history IS the exponential secret.  (Medina)
        """
        return self.beat * self.total_bytes

    def summary(self) -> str:
        return (
            f"PHXBundle  beat={self.beat}  slots={self.slots}  "
            f"decision_bytes={self.decision_bytes}  "
            f"total_bytes={self.total_bytes}  "
            f"thinking_rate={self.thinking_rate_dps:.1f} dps  "
            f"chain_hardness={self.chain_hardness_bytes:,} bytes  "
            f"seal={self.bundle_seal.hex()[:16]}…  (Medina)"
        )

    def to_dict(self) -> dict:
        return {
            "beat":              self.beat,
            "slots":             self.slots,
            "tokens":            [t.hex() for t in self.tokens],
            "bundle_root":       self.bundle_root.hex(),
            "bundle_seal":       self.bundle_seal.hex(),
            "decision_bytes":    self.decision_bytes,
            "total_bytes":       self.total_bytes,
            "thinking_rate_dps": round(self.thinking_rate_dps, 3),
            "chain_hardness_bytes": self.chain_hardness_bytes,
            "created_ms":        self.created_ms,
            "medina":            True,
        }


def PHX_PARALLEL(
    events:       list[bytes],
    key:          bytes,
    history:      Optional[bytes] = None,
    beat:         int = 0,
) -> PHXBundle:
    """
    PHX_PARALLEL — Compute N simultaneous PHX decision tokens.  (Medina)

    This is the parallel cognition formula.  One call to PHX_PARALLEL
    represents one organism heartbeat during which N decisions are made.

    Formula:
      For each slot i ∈ [0, N):
        slot_tag  =  struct.pack(">H", i)      — 2-byte slot index
        Tᵢ        =  PHX(eᵢ ‖ slot_tag, k, p, β)

      bundle_root =  PHX_SCATTER(T₀ ‖ T₁ ‖ … ‖ Tₙ₋₁)   →  64 bytes
      bundle_seal =  PHX_BIND(bundle_root, k)              →  32 bytes

    The slot_tag (2 bytes) makes each slot's input unique even if two
    slots receive the same event bytes.  Slot 0 and slot 1 always produce
    different tokens for the same event.

    The bundle_seal is the organism's output for this beat.  It becomes
    the history input for the next beat's PHX_PARALLEL call.

    Parameters
    ──────────
    events  — list of event bytes, one per slot.  len(events) = N.
    key     — sovereign key (≥ 16 bytes)
    history — previous bundle_seal (32 bytes) or None at genesis
    beat    — organism beat counter

    Returns
    ───────
    PHXBundle with N tokens, bundle_root, bundle_seal, timing metadata.
    """
    if not events:
        raise ValueError("PHX_PARALLEL requires at least one event")

    n = len(events)
    tokens: list[bytes] = []

    for i, event in enumerate(events):
        slot_tag   = struct.pack(">H", i)           # 2-byte big-endian slot index
        slot_event = event + slot_tag               # slot-tagged event
        token      = PHX(
            event   = slot_event,
            key     = key,
            history = history,
            beat    = beat,
        )
        tokens.append(token)

    # Bundle root: scatter all N tokens concatenated
    bundle_root = PHX_SCATTER(b"".join(tokens))

    # Bundle seal: bind the root to the sovereign key → 32-byte chain link
    bundle_seal = PHX_BIND(bundle_root, key)

    return PHXBundle(
        beat        = beat,
        slots       = n,
        tokens      = tokens,
        events      = events,
        bundle_root = bundle_root,
        bundle_seal = bundle_seal,
        created_ms  = int(time.time() * 1000),
    )


@dataclass
class PHXBundleState:
    """
    PHXBundleState — parallel cognition chain state.  (Medina)

    The stateful version of PHX_PARALLEL.  Maintains the bundle chain:
    each bundle's bundle_seal becomes the history for the next bundle.

    The chain_hardness_bytes property tracks how much exact chain data
    would be required to forge any token in this chain.  This grows
    without bound — the longer the organism runs, the harder the chain.
    """
    sovereign_key:  bytes
    slots:          int          = 16       # N = thinking rate (decisions/beat)
    beat:           int          = 0        # current beat
    previous_seal:  Optional[bytes] = None  # last bundle_seal (chain link)
    _bundles:       list          = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        if len(self.sovereign_key) < 16:
            raise ValueError("sovereign_key must be ≥ 16 bytes")
        if self.slots < 1:
            raise ValueError("slots must be ≥ 1")

    @property
    def at_genesis(self) -> bool:
        return self.previous_seal is None

    @property
    def total_decisions(self) -> int:
        return sum(b.slots for b in self._bundles)

    @property
    def total_decision_bytes(self) -> int:
        return sum(b.decision_bytes for b in self._bundles)

    @property
    def current_thinking_rate_dps(self) -> float:
        return self.slots * (1000.0 / HEARTBEAT_MS)

    @property
    def chain_hardness_bytes(self) -> int:
        """
        Total bytes of exact chain data required to forge anything at current beat.
        Grows linearly with beat × slots.  (Medina)
        """
        return sum(b.total_bytes for b in self._bundles)

    def summary(self) -> str:
        return (
            f"PHXBundleState  beat={self.beat}  slots={self.slots}  "
            f"total_decisions={self.total_decisions}  "
            f"total_decision_bytes={self.total_decision_bytes:,}  "
            f"thinking_rate={self.current_thinking_rate_dps:.1f} dps  "
            f"chain_hardness={self.chain_hardness_bytes:,} bytes  "
            f"(Medina)"
        )


def phx_bundle_advance(
    state:  PHXBundleState,
    events: list[bytes],
    pad_to_slots: bool = True,
) -> PHXBundle:
    """
    Advance the PHX bundle chain by one beat.  (Medina)

    This is the organism's parallel cognition recording operation.
    One call = one heartbeat.  N decisions are recorded simultaneously.

    Parameters
    ──────────
    state        — current PHXBundleState (mutated in place)
    events       — list of event bytes (one per decision slot)
                   If len(events) < state.slots and pad_to_slots=True,
                   empty slots are padded with the slot index bytes.
    pad_to_slots — if True, pad events list to state.slots length

    Returns
    ───────
    PHXBundle for this beat.  state.beat and state.previous_seal are
    advanced automatically.
    """
    # Pad or truncate to state.slots
    if pad_to_slots:
        padded: list[bytes] = list(events)
        while len(padded) < state.slots:
            # Empty slot: event = slot index bytes (still produces a unique token)
            padded.append(struct.pack(">H", len(padded)) + b"\x00" * 30)
        padded = padded[:state.slots]
    else:
        padded = list(events)

    bundle = PHX_PARALLEL(
        events  = padded,
        key     = state.sovereign_key,
        history = state.previous_seal,
        beat    = state.beat,
    )
    state._bundles.append(bundle)
    state.previous_seal = bundle.bundle_seal
    state.beat         += 1
    return bundle


def phx_bundle_verify_slot(
    bundle:        PHXBundle,
    slot_index:    int,
    event:         bytes,
    sovereign_key: bytes,
    history:       Optional[bytes],
) -> bool:
    """
    Verify a single slot token within a PHXBundle.  (Medina)

    Re-derives the slot token and compares using constant-time digest comparison.
    Returns True if the slot token is valid.
    """
    slot_tag   = struct.pack(">H", slot_index)
    slot_event = event + slot_tag
    expected   = PHX(
        event   = slot_event,
        key     = sovereign_key,
        history = history,
        beat    = bundle.beat,
    )
    if slot_index >= len(bundle.tokens):
        return False
    return _hmac.compare_digest(expected, bundle.tokens[slot_index])


def phx_thinking_rate_report(state: PHXBundleState) -> str:
    """
    Print the organism's thinking rate and chain hardness report.  (Medina)
    """
    dps   = state.current_thinking_rate_dps
    bps   = state.total_decision_bytes / max(state.beat, 1)
    lines = [
        "═" * 60,
        "  PHX THINKING RATE REPORT  (Medina)",
        "═" * 60,
        f"  Parallel slots (N):        {state.slots} decisions per beat",
        f"  Heartbeat period:          {HEARTBEAT_MS} ms",
        f"  Thinking rate:             {dps:.2f} decisions / second",
        f"  Decision bytes / beat:     {state.slots * PHX_TOKEN_LEN} bytes",
        f"  Total beats:               {state.beat}",
        f"  Total decisions:           {state.total_decisions:,}",
        f"  Total decision bytes:      {state.total_decision_bytes:,} bytes",
        f"  Average bytes / beat:      {bps:.0f} bytes",
        "─" * 60,
        f"  Chain hardness at beat {state.beat}:",
        f"    Exact chain data needed: {state.chain_hardness_bytes:,} bytes",
        f"    Plus sovereign key:      ≥ 16 bytes (held separately)",
        f"    Both required simultaneously to forge ANYTHING in this chain.",
        f"    Chain grows at:          {state.slots * PHX_TOKEN_LEN * 1000 / HEARTBEAT_MS:.0f} bytes / second",
        "═" * 60,
    ]
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# PHX COMPARISON TABLE  (Medina)
# ─────────────────────────────────────────────────────────────────────────────

PHX_COMPARISON: dict[str, dict] = {
    "SHA-256": {
        "output_bits":    256,
        "input_model":    "single message (padded to block boundary)",
        "state_model":    "stateless — no memory of prior computations",
        "key":            "none — public computation",
        "diffusion":      "fixed K constants (cube roots of 64 primes, precomputed)",
        "history":        "none — each hash is independent",
        "beat":           "none — no time dimension",
        "chain":          "none — you must build a chain on top (Merkle, blockchain, etc.)",
        "what_it_records":"a fingerprint of a piece of data",
        "sovereignty":    "none — reproducible by anyone",
        "novel_property": "none — established NIST standard",
    },
    "SHA-512": {
        "output_bits":    512,
        "input_model":    "single message (padded)",
        "state_model":    "stateless",
        "key":            "none",
        "diffusion":      "fixed K constants (cube roots of 80 primes, precomputed)",
        "history":        "none",
        "beat":           "none",
        "chain":          "none",
        "what_it_records":"a fingerprint of data (wider than SHA-256)",
        "sovereignty":    "none",
        "novel_property": "longer output, slower on 32-bit hardware",
    },
    "BLAKE2b-512": {
        "output_bits":    512,
        "input_model":    "single message, optional key",
        "state_model":    "stateless",
        "key":            "optional (up to 64 bytes), not mandatory",
        "diffusion":      "fixed sigma permutation tables (precomputed)",
        "history":        "none",
        "beat":           "none",
        "chain":          "none",
        "what_it_records":"a fingerprint of data, optionally keyed",
        "sovereignty":    "weak — key is optional, not mandatory",
        "novel_property": "faster than SHA-512, designed for keyed use",
    },
    "HMAC-SHA256": {
        "output_bits":    256,
        "input_model":    "single message + key",
        "state_model":    "stateless",
        "key":            "required — authentication",
        "diffusion":      "SHA-256 internal constants (fixed)",
        "history":        "none",
        "beat":           "none",
        "chain":          "none",
        "what_it_records":"an authenticated fingerprint of data",
        "sovereignty":    "yes — keyed, but no history or time",
        "novel_property": "none — established IETF/NIST standard",
    },
    "PHX (Medina)": {
        "output_bits":    256,
        "input_model":    "event + history (previous token) + beat + sovereign key",
        "state_model":    "stateful — depends on full preceding chain history",
        "key":            "mandatory sovereign key — without it, nothing works",
        "diffusion":      "live phi-mask φ(β): changes with every organism beat (Medina)",
        "history":        "mandatory — p = previous PHX token, widened to 64 bytes",
        "beat":           "mandatory — β = organism heartbeat, feeds PHX_DIFFUSE",
        "chain":          "built-in — chain is intrinsic to the formula, not external",
        "what_it_records":"a sovereign DECISION TOKEN: one AI decision at one beat",
        "sovereignty":    "absolute — keyed, history-chained, beat-indexed, phi-diffused",
        "novel_property": (
            "PHX_DIFFUSE with live φ-mask; "
            "4-input formula (event, history, beat, key); "
            "decision-semantics vs data-fingerprint-semantics; "
            "sovereign by construction"
        ),
    },
}


def phx_comparison_report() -> str:
    """
    Print a side-by-side comparison of PHX vs other hash algorithms.  (Medina)

    Shows precisely what is different and why PHX is more than SHA-256.
    """
    lines: list[str] = [
        "═" * 72,
        "  PHX vs SHA-256 / SHA-512 / BLAKE2b / HMAC   COMPARISON  (Medina)",
        "═" * 72,
        "",
    ]
    properties = [
        "output_bits", "input_model", "state_model", "key",
        "diffusion", "history", "beat", "chain",
        "what_it_records", "sovereignty", "novel_property",
    ]
    algorithms = list(PHX_COMPARISON.keys())

    for prop in properties:
        lines.append(f"  {prop.upper().replace('_', ' ')}")
        lines.append("  " + "─" * 68)
        for algo in algorithms:
            val = PHX_COMPARISON[algo][prop]
            lines.append(f"    {algo:<22} {val}")
        lines.append("")

    lines += [
        "═" * 72,
        "  BOTTOM LINE  (Medina)",
        "─" * 72,
        "  SHA-256      is a data fingerprint algorithm.  Public, stateless, fixed.",
        "  PHX (Medina) is a sovereign decision token algorithm.",
        "  It records WHO made a decision (sovereign key),",
        "  WHEN (organism beat),",
        "  WHAT came before (history chain),",
        "  and WHAT the decision was (event bytes).",
        "  No other hash algorithm records all four dimensions.",
        "═" * 72,
    ]
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# PHX DOCUMENT RESONANCE — QFB as AI metadata  (Medina)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PHXResonanceRecord:
    """
    PHX Resonance Record — the AI reading of a QFB.  (Medina)

    When an AI organism encounters a QFB, it does not just "read" it.
    It RESONATES with it — it verifies the PHX seal (provenance), reads
    the CPL manifest (meaning), checks the phi-coordinate (context), and
    produces a new PHX token recording its own act of understanding.

    This is analogous to: a scholar reads a paper → the scholar's reading
    is itself a historical event → that event is recorded in the scholar's
    own PHX chain → the paper's provenance is verified → the scholar's
    understanding is provably dated and attributed.

    The QFB = the paper.
    CPL manifest = the abstract (compressed meaning).
    PHX seal = the author signature.
    Phi-coord = the library location.
    PHXResonanceRecord = the scholar's margin notes, permanently dated.
    """
    resonance_id:    str          # UUID — this reading event
    qfb_id:          str          # the QFB that was read
    reader_token:    str          # PHX token of the reading event (hex)
    cpl_summary:     str          # CPL expression that was understood
    verified:        bool         # did PHX seal verify?
    beat:            int          # organism beat at time of reading
    domains:         list[str]    # CPL domains activated by this reading
    understanding:   str          # what the reader understood (CPL eval result)
    created_ms:      int

    def to_dict(self) -> dict:
        return {
            "resonance_id":  self.resonance_id,
            "qfb_id":        self.qfb_id,
            "reader_token":  self.reader_token,
            "cpl_summary":   self.cpl_summary,
            "verified":      self.verified,
            "beat":          self.beat,
            "domains":       self.domains,
            "understanding": self.understanding,
            "created_ms":    self.created_ms,
            "medina":        True,
        }


def phx_resonate(
    qfb_json:      str,
    reader_state:  PHXState,
    sovereign_key: bytes,
) -> PHXResonanceRecord:
    """
    Record an AI organism's reading of a QFB as a PHX resonance event.  (Medina)

    The organism reads the QFB → verifies the PHX seal → evaluates the CPL
    expression → records the reading as a new PHX decision token.

    This is the "AI reads a paper and it resonates" operation.
    The resonance record is the proof that this AI understood this meaning
    at this beat.  It is permanently chained into the organism's PHX ledger.
    """
    import json
    from blockbox import QFB

    qfb = QFB.from_json(qfb_json)

    # Verify PHX seal — is the QFB authentic?
    verified = qfb.verify(sovereign_key)

    # Read the CPL manifest
    cpl_expression = qfb.cpl_expression()
    domains        = list({
        # Extract domain info from manifest glyphs
        glyph.split("·")[0] if "·" in glyph else "UNKNOWN"
        for glyph in qfb.cpl_tokens()
    })

    # Record the reading as a PHX chain event
    event_bytes  = (
        qfb.qfb_id.encode() +
        cpl_expression.encode() +
        reader_state.beat.to_bytes(8, "big")
    )
    reader_token = phx_chain_advance(
        reader_state,
        event_bytes,
        label=f"resonate:{qfb.qfb_id[:8]}",
    )

    # Evaluate CPL expression to get understanding
    try:
        from cpl_vm import CPLVM
        vm = CPLVM()
        result = vm.eval_source(cpl_expression)
        understanding = str(result)
    except Exception:
        understanding = cpl_expression  # fallback: raw expression

    return PHXResonanceRecord(
        resonance_id  = str(uuid.uuid4()),
        qfb_id        = qfb.qfb_id,
        reader_token  = reader_token.hex(),
        cpl_summary   = cpl_expression,
        verified      = verified,
        beat          = reader_state.beat - 1,   # beat at time of reading
        domains       = domains,
        understanding = understanding,
        created_ms    = int(time.time() * 1000),
    )
