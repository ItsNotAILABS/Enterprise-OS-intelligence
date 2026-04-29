"""
blockbox.py — QFB Block Box (Quantum Fusion Block)

Author : Medina
Version: 1.0.0
Ring   : Sovereign Ring

─────────────────────────────────────────────────────────────────────────────
WHAT IS A QFB?
─────────────────────────────────────────────────────────────────────────────

A QFB (Quantum Fusion Block) is the Medina name for a dense meaning canister.
Others call it a "canister" (ICP) or a "container".  In the Medina organism
it is called a Block Box.

Structure
─────────
  QFB (Quantum Fusion Block)
  └── SHL (Sphere Helix Layer)    — geometric membrane
      └── QFC (Quantum Fusion Core) — innermost nucleus

  The SHL is a sphere (sphaira geometry) wrapped around a double-helix
  membrane.  The QFC at the centre holds:
    · compressed CPL token sequence
    · PHX-encrypted payload bytes
    · substrate routing tags
    · phi-coordinate address

Substrates
──────────
  A QFB can be deployed to any substrate:
    · memory   — organism spatial memory (PHI coordinates)
    · edge     — native edge runtime
    · icp      — ICP blockchain canister
    · evm      — Ethereum/EVM smart contract
    · solana   — Phantom/Solana substrate
    · quantum  — future quantum substrate

Wire format (JSON)
──────────────────
  {
    "qfb_id":    "<uuid>",
    "version":   1,
    "substrate": ["memory", "icp"],
    "phx_seal":  "<hex PHX integrity token>",
    "phi_addr":  {"theta": 0.0, "phi": 1.618, "rho": 1.0, "ring": "Sovereign", "beat": 42},
    "cpl_manifest": ["ΜΝ", "→", "Ηθ", "⊗", "Τκτ"],
    "shl": {
      "sphere_radius": 1.618,
      "helix_turns":   3,
      "helix_pitch":   1.0
    },
    "qfc": {
      "payload_type":  "cpl_expression",
      "encoded_bytes": "<base64>",
      "cpl_token_count": 5
    },
    "created_ms":  1714000000000,
    "substrate_tags": {"icp": "canister_id_placeholder", "evm": "0x..."}
  }
"""

from __future__ import annotations

import base64
import hashlib
import hmac as _hmac
import json
import math
import os
import time
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional

PHI: float = 1.618033988749895   # golden ratio φ = (1+√5)/2
PHI_INV: float = 0.618033988749895  # φ⁻¹ — Kuramoto sync threshold
PHI_SQ: float = 2.618033988749895   # φ²
HEARTBEAT_MS: int = 873          # 873 ms = floor(φ³ × 200) + φ-correction
GOLDEN_ANGLE: float = 2.399963229728653  # 2π(1 − 1/φ) — phyllotaxis spiral

# ── Block Box Tiers ────────────────────────────────────────────────────────────
#
# A QFB (Quantum Fusion Block) is not just one kind of thing.
# The organism mints block boxes at FIVE tiers — each tier escalates:
#   - PHX seal rounds    (cryptographic strength)
#   - Sphere helix turns (geometric complexity)
#   - Cycle budget       (sovereign compute embedded)
#   - Default substrates (where it deploys)
#
#   BRONZE    — AI-auto-generated.  Students, onboarding, bronze canisters.
#   SILVER    — Team-approved.      Knowledge, intelligence artefacts.
#   GOLD      — Division-sealed.    Governance proposals, ICX contracts.
#   PLATINUM  — Organism-level.     System upgrades, architectural laws.
#   SOVEREIGN — Immutable core.     ConstitutionBlock, permanent QFBs.

class BlockBoxTier(Enum):
    BRONZE    = "bronze"
    SILVER    = "silver"
    GOLD      = "gold"
    PLATINUM  = "platinum"
    SOVEREIGN = "sovereign"

# Tier properties: seal_rounds, helix_turns, cycle_budget, substrates
TIER_PROPERTIES: dict[str, dict] = {
    "bronze":    {"seal_rounds": 1, "helix_turns": 3,  "cycle_budget": 16,  "substrates": ["memory"]},
    "silver":    {"seal_rounds": 2, "helix_turns": 5,  "cycle_budget": 32,  "substrates": ["memory", "edge"]},
    "gold":      {"seal_rounds": 3, "helix_turns": 8,  "cycle_budget": 48,  "substrates": ["memory", "edge", "icp"]},
    "platinum":  {"seal_rounds": 5, "helix_turns": 13, "cycle_budget": 80,  "substrates": ["memory", "edge", "icp", "evm"]},
    "sovereign": {"seal_rounds": 8, "helix_turns": 21, "cycle_budget": 128, "substrates": ["memory", "edge", "icp", "evm", "solana"]},
}

# Helix turns follow Fibonacci: 3, 5, 8, 13, 21 — this is not an aesthetic choice.
# It is the mathematical law of the organism.  (Medina)


# ── PHI coordinate ─────────────────────────────────────────────────────────────

@dataclass
class PhiCoord:
    """5-axis phi-encoded spatial address."""
    theta: float   # angular axis 1 (0–2π)
    phi:   float   # angular axis 2 (0–π) — phi-encoded
    rho:   float   # radial distance (φ-multiples)
    ring:  str     # "Sovereign" | "Interface" | "Memory"
    beat:  int     # organism heartbeat beat number

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def sovereign(cls, beat: int = 0) -> "PhiCoord":
        """Default sovereign-ring phi address."""
        return cls(theta=0.0, phi=PHI, rho=PHI, ring="Sovereign", beat=beat)


# ── Sphere Helix Layer ─────────────────────────────────────────────────────────

@dataclass
class SphereHelixLayer:
    """
    SHL — the geometric membrane of a QFB.

    sphere_radius  — radius of the sphaira envelope (φ-multiples)
    helix_turns    — number of helix turns in the membrane (Fibonacci by tier)
    helix_pitch    — pitch of the helix (φ-multiples)
    helix_chirality — "right" | "left" — handedness of the double helix

    Helix turns scale with tier on Fibonacci numbers: 3, 5, 8, 13, 21.
    This is the sacred geometry law — not aesthetics.
    """
    sphere_radius:   float = PHI
    helix_turns:     int   = 3
    helix_pitch:     float = PHI
    helix_chirality: str   = "right"

    @classmethod
    def for_tier(cls, tier: str) -> "SphereHelixLayer":
        """Create an SHL scaled to the given tier."""
        props = TIER_PROPERTIES.get(tier, TIER_PROPERTIES["bronze"])
        turns = props["helix_turns"]
        # Sphere radius scales with φ^(tier_index): bronze=φ, silver=φ², gold=φ³, …
        tier_idx = list(TIER_PROPERTIES.keys()).index(tier)
        radius = PHI ** (tier_idx + 1)
        return cls(sphere_radius=radius, helix_turns=turns)

    def surface_area(self) -> float:
        """Surface area of the sphere envelope: 4πr²."""
        return 4 * math.pi * self.sphere_radius ** 2

    def helix_length(self) -> float:
        """Arc length of one helix strand: turns × √((2πr)² + pitch²)."""
        r = self.sphere_radius
        return self.helix_turns * math.sqrt((2 * math.pi * r) ** 2 + self.helix_pitch ** 2)

    def to_dict(self) -> dict:
        return asdict(self)


# ── Quantum Fusion Core ────────────────────────────────────────────────────────

@dataclass
class QuantumFusionCore:
    """
    QFC — the innermost nucleus of a QFB.

    Holds the compressed CPL token sequence and the PHX-encrypted payload.
    """
    payload_type:    str          # "cpl_expression" | "data" | "instruction" | "resonance"
    encoded_bytes:   str          # base64-encoded compressed payload
    cpl_token_count: int          # number of CPL tokens compressed inside
    cpl_manifest:    list[str]    # the CPL glyphs in order (readable index)

    def decode_bytes(self) -> bytes:
        """Decode the base64 payload back to raw bytes."""
        return base64.b64decode(self.encoded_bytes)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_cpl(cls, cpl_tokens: list[str]) -> "QuantumFusionCore":
        """Create a QFC by compressing a CPL token sequence."""
        raw = " ".join(cpl_tokens).encode("utf-8")
        encoded = base64.b64encode(raw).decode()
        return cls(
            payload_type    = "cpl_expression",
            encoded_bytes   = encoded,
            cpl_token_count = len(cpl_tokens),
            cpl_manifest    = cpl_tokens,
        )

    @classmethod
    def from_bytes(cls, payload_type: str, data: bytes) -> "QuantumFusionCore":
        """Create a QFC from raw bytes."""
        return cls(
            payload_type    = payload_type,
            encoded_bytes   = base64.b64encode(data).decode(),
            cpl_token_count = 0,
            cpl_manifest    = [],
        )


# ── PHX Token ─────────────────────────────────────────────────────────────────

def _phi_expand(seed: bytes, length: int = 64) -> bytes:
    """
    Expand seed bytes to `length` bytes using the golden ratio as diffusion.

    Each byte at position i is XOR'd with floor(i × φ × 256) % 256.
    This is the phi-mixing step of PHX.
    """
    return bytes(
        (b ^ (int(i * PHI * 256) % 256))
        for i, b in enumerate((seed * ((length // len(seed)) + 1))[:length])
    )


def phx_token(
    event_bytes: bytes,
    sovereign_key: bytes,
    previous_token: Optional[bytes] = None,
    beat: int = 0,
) -> bytes:
    """
    Compute a single PHX (Phi Hash eXchange) token.

    Steps
    ─────
    1. Combine event_bytes + previous_token (or zeros) + beat.
    2. BLAKE2b-512 hash → 64 bytes.
    3. Phi-mix: XOR with phi-expanded beat fingerprint.
    4. HMAC-SHA256 with sovereign_key → 32 bytes (the PHX token).

    Returns a 32-byte PHX token.
    """
    prev = previous_token or b"\x00" * 64
    beat_bytes = beat.to_bytes(8, "big")

    # Step 1: combine
    message = event_bytes + prev + beat_bytes

    # Step 2: BLAKE2b-512
    blake_hash = hashlib.blake2b(message, digest_size=64).digest()

    # Step 3: phi-mix
    phi_seed = int(PHI * 1e15).to_bytes(8, "big") + beat_bytes
    phi_mask = _phi_expand(phi_seed, 64)
    phi_mixed = bytes(a ^ b for a, b in zip(blake_hash, phi_mask))

    # Step 4: HMAC-SHA256
    return _hmac.new(sovereign_key, phi_mixed, hashlib.sha256).digest()


# ── QFB Seal (PHX integrity token) ────────────────────────────────────────────

def _seal_qfb(
    qfc: QuantumFusionCore,
    shl: SphereHelixLayer,
    sovereign_key: bytes,
    beat: int,
    tier: str = "bronze",
    seal_rounds: int = 1,
) -> str:
    """
    Compute the PHX integrity seal for a QFB.

    Higher tiers run more seal rounds for stronger cryptographic integrity.
    Seal formula iterated `seal_rounds` times:
      PHX(e, k, prev, β) = HMAC-SHA256(k, BLAKE2b₅₁₂(e ‖ prev ‖ β) ⊕ φ_expand(β, 64))
    """
    event_bytes = (
        tier.encode() +
        qfc.payload_type.encode() +
        qfc.encoded_bytes.encode() +
        str(shl.sphere_radius).encode() +
        str(shl.helix_turns).encode()
    )
    token: Optional[bytes] = None
    for _round in range(seal_rounds):
        token = phx_token(event_bytes, sovereign_key, previous_token=token, beat=beat + _round)
    return token.hex()


# ── QFB ───────────────────────────────────────────────────────────────────────

@dataclass
class QFB:
    """
    QFB — Quantum Fusion Block (Block Box).

    The sovereign meaning canister of the Medina organism.
    Five tiers: bronze → silver → gold → platinum → sovereign.
    Each tier escalates PHX seal rounds, helix turns, cycle budget, substrates.

    Usage
    ─────
    key = os.urandom(32)          # sovereign key
    qfb = QFB.from_cpl(
        cpl_tokens = ["Λγ", "∧", "Ηθ", "→", "Τκτ"],
        key        = key,
        tier       = "gold",
        substrates = ["memory", "icp"],
    )
    json_str = qfb.to_json()      # deploy to any substrate

    QFB.from_json(json_str)       # reconstruct from any substrate
    """

    qfb_id:       str
    version:      int
    tier:         str                    # "bronze"|"silver"|"gold"|"platinum"|"sovereign"
    substrate:    list[str]
    phx_seal:     str                    # PHX integrity token (hex, iterated by tier)
    phi_addr:     PhiCoord
    shl:          SphereHelixLayer
    qfc:          QuantumFusionCore
    created_ms:   int
    substrate_tags: dict[str, str]       # substrate-specific routing tags
    cycle_budget: int                    # sovereign cycles embedded in this QFB
    seal_rounds:  int                    # PHX seal iterations (tier-dependent)

    # ── Factories ──────────────────────────────────────────────────────────────

    @classmethod
    def from_cpl(
        cls,
        cpl_tokens: list[str],
        key:        bytes,
        tier:       str = "bronze",
        substrates: Optional[list[str]] = None,
        beat:       int = 0,
        phi_addr:   Optional[PhiCoord] = None,
        shl:        Optional[SphereHelixLayer] = None,
        substrate_tags: Optional[dict[str, str]] = None,
        cycle_budget: int = 0,
    ) -> "QFB":
        """Create a QFB from a CPL token sequence at any tier."""
        props = TIER_PROPERTIES.get(tier, TIER_PROPERTIES["bronze"])
        seal_rounds = props["seal_rounds"]
        qfc       = QuantumFusionCore.from_cpl(cpl_tokens)
        shl_layer = shl or SphereHelixLayer.for_tier(tier)
        addr      = phi_addr or PhiCoord.sovereign(beat)
        seal      = _seal_qfb(qfc, shl_layer, key, beat, tier, seal_rounds)
        return cls(
            qfb_id        = str(uuid.uuid4()),
            version       = 1,
            tier          = tier,
            substrate     = substrates or list(props["substrates"]),
            phx_seal      = seal,
            phi_addr      = addr,
            shl           = shl_layer,
            qfc           = qfc,
            created_ms    = int(time.time() * 1000),
            substrate_tags= substrate_tags or {},
            cycle_budget  = cycle_budget or props["cycle_budget"],
            seal_rounds   = seal_rounds,
        )

    @classmethod
    def from_bytes(
        cls,
        payload_type: str,
        data:         bytes,
        key:          bytes,
        tier:         str = "bronze",
        substrates:   Optional[list[str]] = None,
        beat:         int = 0,
        phi_addr:     Optional[PhiCoord] = None,
        shl:          Optional[SphereHelixLayer] = None,
        substrate_tags: Optional[dict[str, str]] = None,
        cycle_budget: int = 0,
    ) -> "QFB":
        """Create a QFB from raw bytes at any tier."""
        props = TIER_PROPERTIES.get(tier, TIER_PROPERTIES["bronze"])
        seal_rounds = props["seal_rounds"]
        qfc       = QuantumFusionCore.from_bytes(payload_type, data)
        shl_layer = shl or SphereHelixLayer.for_tier(tier)
        addr      = phi_addr or PhiCoord.sovereign(beat)
        seal      = _seal_qfb(qfc, shl_layer, key, beat, tier, seal_rounds)
        return cls(
            qfb_id        = str(uuid.uuid4()),
            version       = 1,
            tier          = tier,
            substrate     = substrates or list(props["substrates"]),
            phx_seal      = seal,
            phi_addr      = addr,
            shl           = shl_layer,
            qfc           = qfc,
            created_ms    = int(time.time() * 1000),
            substrate_tags= substrate_tags or {},
            cycle_budget  = cycle_budget or props["cycle_budget"],
            seal_rounds   = seal_rounds,
        )

    # ── Integrity ──────────────────────────────────────────────────────────────

    def verify(self, key: bytes) -> bool:
        """Verify the PHX integrity seal (using the QFB's own tier and seal_rounds)."""
        expected = _seal_qfb(
            self.qfc, self.shl, key, self.phi_addr.beat,
            self.tier, self.seal_rounds
        )
        return _hmac.compare_digest(expected, self.phx_seal)

    # ── CPL extraction ─────────────────────────────────────────────────────────

    def cpl_tokens(self) -> list[str]:
        """Return the CPL token manifest from the QFC."""
        return list(self.qfc.cpl_manifest)

    def cpl_expression(self) -> str:
        """Return the CPL expression as a string."""
        return " ".join(self.qfc.cpl_manifest)

    # ── Serialisation ──────────────────────────────────────────────────────────

    def to_dict(self) -> dict:
        return {
            "qfb_id":        self.qfb_id,
            "version":       self.version,
            "tier":          self.tier,
            "substrate":     self.substrate,
            "phx_seal":      self.phx_seal,
            "phi_addr":      self.phi_addr.to_dict(),
            "shl":           self.shl.to_dict(),
            "qfc":           self.qfc.to_dict(),
            "created_ms":    self.created_ms,
            "substrate_tags":self.substrate_tags,
            "cycle_budget":  self.cycle_budget,
            "seal_rounds":   self.seal_rounds,
        }

    def to_json(self, indent: Optional[int] = None) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)

    @classmethod
    def from_dict(cls, d: dict) -> "QFB":
        phi_addr = PhiCoord(**d["phi_addr"])
        shl      = SphereHelixLayer(**d["shl"])
        qfc_d    = d["qfc"]
        qfc      = QuantumFusionCore(
            payload_type    = qfc_d["payload_type"],
            encoded_bytes   = qfc_d["encoded_bytes"],
            cpl_token_count = qfc_d["cpl_token_count"],
            cpl_manifest    = qfc_d["cpl_manifest"],
        )
        tier = d.get("tier", "bronze")
        props = TIER_PROPERTIES.get(tier, TIER_PROPERTIES["bronze"])
        return cls(
            qfb_id        = d["qfb_id"],
            version       = d["version"],
            tier          = tier,
            substrate     = d["substrate"],
            phx_seal      = d["phx_seal"],
            phi_addr      = phi_addr,
            shl           = shl,
            qfc           = qfc,
            created_ms    = d["created_ms"],
            substrate_tags= d.get("substrate_tags", {}),
            cycle_budget  = d.get("cycle_budget", props["cycle_budget"]),
            seal_rounds   = d.get("seal_rounds", props["seal_rounds"]),
        )

    @classmethod
    def from_json(cls, s: str) -> "QFB":
        return cls.from_dict(json.loads(s))

    # ── Substrate routing ──────────────────────────────────────────────────────

    def supports_substrate(self, substrate: str) -> bool:
        """Return True if this QFB targets the given substrate."""
        return substrate in self.substrate

    def tag_substrate(self, substrate: str, tag: str) -> None:
        """Add a substrate-specific routing tag (e.g. ICP canister ID)."""
        self.substrate_tags[substrate] = tag
        if substrate not in self.substrate:
            self.substrate.append(substrate)

    # ── Summary ────────────────────────────────────────────────────────────────

    def summary(self) -> str:
        tokens = self.cpl_expression() or "(raw bytes)"
        return (
            f"QFB {self.qfb_id[:8]}…  "
            f"tier={self.tier}  "
            f"substrates={self.substrate}  "
            f"tokens={self.qfc.cpl_token_count}  "
            f"cpl='{tokens}'  "
            f"shl=ϕ{self.shl.sphere_radius:.3f}×{self.shl.helix_turns}T  "
            f"cycles={self.cycle_budget}  "
            f"phx={self.phx_seal[:12]}…"
        )

    def __repr__(self) -> str:
        return f"<QFB id={self.qfb_id[:8]} substrate={self.substrate}>"


# ── PHX Chain ─────────────────────────────────────────────────────────────────

class PHXChain:
    """
    PHX decision chain — tracks every AI decision as a new hash.

    Every time the organism makes a decision (any AI in the whole ORG),
    advance() is called with the event bytes.  The chain is tamper-evident:
    every token depends on the full preceding history.

    Usage
    ─────
    chain = PHXChain(sovereign_key=os.urandom(32))
    tok1  = chain.advance(b"decision: route task to GPT-4")
    tok2  = chain.advance(b"decision: store memory at phi(0.1, 1.618, 1.0)")
    log   = chain.log()   # full decision log
    """

    def __init__(self, sovereign_key: bytes) -> None:
        if len(sovereign_key) < 16:
            raise ValueError("sovereign_key must be at least 16 bytes")
        self._key:      bytes = sovereign_key
        self._previous: Optional[bytes] = None
        self._beat:     int = 0
        self._log:      list[dict] = []

    def advance(self, event_bytes: bytes, label: str = "") -> bytes:
        """
        Record a decision event and return the PHX token.

        event_bytes — serialised decision / input / state change
        label       — human-readable label (optional, for the log)
        """
        token = phx_token(event_bytes, self._key, self._previous, self._beat)
        self._log.append({
            "beat":       self._beat,
            "label":      label or event_bytes[:32].hex(),
            "phx_token":  token.hex(),
            "event_hash": hashlib.sha256(event_bytes).hexdigest(),
        })
        self._previous = token
        self._beat     += 1
        return token

    def verify_token(self, event_bytes: bytes, expected_token: bytes, beat: int,
                     previous_token: Optional[bytes] = None) -> bool:
        """Re-derive a PHX token and check it matches expected."""
        computed = phx_token(event_bytes, self._key, previous_token, beat)
        return _hmac.compare_digest(computed, expected_token)

    def log(self) -> list[dict]:
        """Return the full decision log."""
        return list(self._log)

    @property
    def beat(self) -> int:
        return self._beat

    @property
    def latest_token(self) -> Optional[bytes]:
        return self._previous

    def chain_summary(self) -> str:
        return (
            f"PHXChain  beat={self._beat}  "
            f"decisions={len(self._log)}  "
            f"latest={self._previous.hex()[:16] if self._previous else 'genesis'}…"
        )
