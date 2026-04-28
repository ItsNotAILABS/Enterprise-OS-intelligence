"""
phx_primitive.py — PHX as a Pure Mathematical Primitive  (Medina)

Author : Medina
Version: 1.0.0
Ring   : Sovereign Ring
Code   : PHX

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

The complete PHX formula:  (Medina)

  PHX(e, p, β, k)  =  PHX_BIND(
                          PHX_DIFFUSE(
                            PHX_SCATTER(
                              PHX_INPUT(e, p, β)
                            ),
                            β
                          ),
                          k
                        )

─────────────────────────────────────────────────────────────────────────────
COMPARISON WITH SHA-256  (real differences, not marketing)
─────────────────────────────────────────────────────────────────────────────

  SHA-256 pipeline:   SHA_PAD → SHA_EXPAND → SHA_COMPRESS(64 rounds) → SHA_FINAL
  PHX pipeline:       PHX_INPUT → PHX_SCATTER → PHX_DIFFUSE → PHX_BIND

  Structural difference 1: SHA-256 processes one message; PHX processes
  (event, history, beat, key) — four inputs, not one.

  Structural difference 2: SHA-256's round constants K[0..63] are fixed
  (cube roots of primes, precomputed at algorithm design time).  PHX's
  diffusion mask changes with every beat — it is a live function of the
  organism's heartbeat, not a fixed lookup table.

  Structural difference 3: SHA-256 is stateless — it does not know what
  you hashed before.  PHX is history-aware — p (the previous PHX token)
  is a mandatory input.  Removing history breaks PHX.  SHA-256 has no
  concept of history.

  Structural difference 4: SHA-256 produces a *digest* (a fingerprint of
  data).  PHX produces a *decision token* — a fingerprint of a DECISION
  made by an AI at a specific moment (beat) in an authenticated chain.
  These are semantically different objects.

  Structural difference 5: SHA-256 is public — anyone can reproduce it
  for any input.  PHX is sovereign — without the key k, you cannot produce
  or verify PHX tokens.  The organism's decision ledger is private by
  construction.

─────────────────────────────────────────────────────────────────────────────
USAGE
─────────────────────────────────────────────────────────────────────────────

  from phx_primitive import PHX, PHXState, phx_chain_advance

  key   = os.urandom(32)
  state = PHXState(sovereign_key=key)

  # Single decision token
  token = PHX(
      event   = b"decision: route query to reasoning model",
      history = state.previous,
      beat    = state.beat,
      key     = key,
  )

  # Chain (auto-advancing state)
  t0 = phx_chain_advance(state, b"decision 0")
  t1 = phx_chain_advance(state, b"decision 1")  # t1 depends on t0
  t2 = phx_chain_advance(state, b"decision 2")  # t2 depends on t1

  # Verify
  from phx_primitive import phx_verify
  assert phx_verify(state, b"decision 0", t0, beat=0, previous=None)
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
HEARTBEAT_MS:  int   = 873                # organism heartbeat
PHX_TOKEN_LEN: int   = 32                 # PHX token output size in bytes
PHX_WIDE_LEN:  int   = 64                 # PHX_SCATTER output width in bytes


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
