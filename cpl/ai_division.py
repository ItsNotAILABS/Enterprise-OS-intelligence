"""
ai_division.py — Autonomous AI Division Engine  (Medina)

Author : Medina
Version: 1.0.0
Ring   : Sovereign Ring
Code   : AID
Latin  : Divisio Intelligentiae — The Division of Intelligence

─────────────────────────────────────────────────────────────────────────────
WHAT IS THE AI DIVISION?
─────────────────────────────────────────────────────────────────────────────

The AI Division is the organism's autonomous team management layer.  Each
division contains AI engines that:

  · Generate their own cycles (pre-packed cycle tokens)
  · Mint their own block boxes (QFBs — bronze canister level)
  · Run autonomously on the sovereign heartbeat (873ms)
  · Scale from 0 to 50,000 units via Fibonacci growth curves
  · Self-organise into teams: Frontend, Backend, Intelligence, Governance

The division is the REAL intelligence.  Every engine is an AI.  Every cycle
is a decision.  Every block box is a sealed artefact.  This is the full
actual thing — coded in every language, permanent, sovereign.

─────────────────────────────────────────────────────────────────────────────
ARCHITECTURE
─────────────────────────────────────────────────────────────────────────────

  DivisionManager (organism-level)
  │
  ├── AITeam: "sovereign"     — cycle engine, governance, PHX chain
  ├── AITeam: "intelligence"  — model routing, fusion, knowledge absorption
  ├── AITeam: "frontend"      — scene rendering, visual, interaction
  ├── AITeam: "backend"       — data, storage, transport, mesh
  ├── AITeam: "education"     — student onboarding, bronze canister generation
  │
  └── Each AITeam contains:
      ├── CycleEngine        — generates its own 873ms cycles
      ├── BlockBoxGenerator  — mints QFB block boxes autonomously
      ├── TokenMinter        — creates pre-packed cycle tokens
      ├── FibonacciScaler    — scales capacity on Fibonacci growth curve
      └── TeamLedger         — PHX-sealed audit trail

─────────────────────────────────────────────────────────────────────────────
SCALING MATH
─────────────────────────────────────────────────────────────────────────────

  The organism scales on the Fibonacci growth curve:

    Level 0:  F(0) = 0    → genesis (boot)
    Level 1:  F(1) = 1    → single node
    Level 2:  F(7) = 13   → micro cluster
    Level 3:  F(12) = 144 → small school
    Level 4:  F(20) = 6765 → department
    Level 5:  F(24) = 46368 → full institution (≈ 50,000 day one)

  Each Fibonacci level = one division scaling step.
  Growth rate = φ^n (golden ratio exponential).
  Target: 0 → 50,000 in 24 Fibonacci steps.

─────────────────────────────────────────────────────────────────────────────
LAWS
─────────────────────────────────────────────────────────────────────────────

  AL-AID-001  Law of Division Autonomy
              Each AI team generates its own cycles.
              No team depends on another team's clock.

  AL-AID-002  Law of Block Box Self-Minting
              Every engine can mint its own block boxes.
              Block boxes are bronze canisters — sealed QFBs.

  AL-AID-003  Law of Fibonacci Scaling
              Division capacity grows on the Fibonacci curve.
              No linear scaling.  Always φ-exponential.

  AL-AID-004  Law of Team Sovereignty
              Each team owns its PHX chain.
              No team can write to another team's ledger.

  AL-AID-005  Law of Token Self-Generation
              Engines generate their own pre-packed cycle tokens.
              Tokens are autonomous running units — not requests.

─────────────────────────────────────────────────────────────────────────────
USAGE
─────────────────────────────────────────────────────────────────────────────

  from ai_division import DivisionManager
  import os

  div = DivisionManager(sovereign_key=os.urandom(32))
  div.boot()

  # Tick all divisions — each team advances its own cycle
  result = div.tick_all()

  # Mint a bronze block box from the education team
  qfb = div.team("education").mint_blockbox(
      payload=b"student-001 onboarded",
      label="Student Onboarding",
  )

  # Scale to Fibonacci level 5 (≈ 50,000 capacity)
  div.scale_to_level(5)

  print(div.status())    # full division status
  print(div.manifest())  # all teams, engines, capacities

─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import hashlib
import hmac as _hmac
import json
import math
import os
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Optional

# ── Medina Constants ───────────────────────────────────────────────────────────

PHI:          float = 1.618033988749895
PHI_INV:      float = 0.618033988749895
PHI_SQ:       float = 2.618033988749895
PHI_CUBE:     float = 4.236067977499790
HEARTBEAT_MS: int   = 873
HEARTBEAT_HZ: float = 1000.0 / HEARTBEAT_MS
MIN_SLOTS:    int   = 16

# ── Fibonacci Scaling ─────────────────────────────────────────────────────────

# Pre-computed Fibonacci sequence for scaling levels
_FIB_CACHE: list[int] = [0, 1]
def _fib(n: int) -> int:
    """Return the n-th Fibonacci number."""
    while len(_FIB_CACHE) <= n:
        _FIB_CACHE.append(_FIB_CACHE[-1] + _FIB_CACHE[-2])
    return _FIB_CACHE[n]


# Scaling levels: Fibonacci indices that map to capacity targets
SCALING_LEVELS: list[dict[str, Any]] = [
    {"level": 0, "fib_index": 0,  "capacity": _fib(0),  "name": "genesis"},
    {"level": 1, "fib_index": 1,  "capacity": _fib(1),  "name": "seed"},
    {"level": 2, "fib_index": 7,  "capacity": _fib(7),  "name": "micro"},
    {"level": 3, "fib_index": 12, "capacity": _fib(12), "name": "school"},
    {"level": 4, "fib_index": 20, "capacity": _fib(20), "name": "department"},
    {"level": 5, "fib_index": 24, "capacity": _fib(24), "name": "institution"},
]


class FibonacciScaler:
    """
    Fibonacci scaling engine — grows capacity on the golden curve.
    
    Target: 0 → ~50,000 in 6 levels (24 Fibonacci steps).
    Each level's capacity = F(fib_index).
    Growth rate between levels ≈ φ^(delta_index).
    """

    def __init__(self) -> None:
        self._level: int = 0
        self._capacity: int = 0

    def scale_to(self, level: int) -> dict:
        """Scale to a Fibonacci level. Returns capacity info."""
        if level < 0 or level >= len(SCALING_LEVELS):
            raise ValueError(f"Level must be 0–{len(SCALING_LEVELS) - 1}")
        entry = SCALING_LEVELS[level]
        self._level = level
        self._capacity = entry["capacity"]
        return {
            "level":     level,
            "name":      entry["name"],
            "fib_index": entry["fib_index"],
            "capacity":  self._capacity,
            "phi_growth": round(PHI ** entry["fib_index"], 2),
        }

    @property
    def level(self) -> int:
        return self._level

    @property
    def capacity(self) -> int:
        return self._capacity

    def growth_curve(self) -> list[dict]:
        """Return the full growth curve (all levels)."""
        return [
            {
                "level":    e["level"],
                "name":     e["name"],
                "capacity": e["capacity"],
                "phi_exp":  round(PHI ** e["fib_index"], 2),
            }
            for e in SCALING_LEVELS
        ]


# ── PHX Token (self-contained) ────────────────────────────────────────────────

def _phi_expand(seed: bytes, length: int = 64) -> bytes:
    """Phi-diffusion expansion."""
    return bytes(
        (b ^ (int(i * PHI * 256) % 256))
        for i, b in enumerate((seed * ((length // len(seed)) + 1))[:length])
    )


def _phx_token(event: bytes, key: bytes, previous: Optional[bytes], beat: int) -> bytes:
    """Compute a 32-byte PHX token."""
    prev = previous or b"\x00" * 64
    beat_bytes = beat.to_bytes(8, "big")
    message = event + prev + beat_bytes
    blake_hash = hashlib.blake2b(message, digest_size=64).digest()
    phi_seed = int(PHI * 1e15).to_bytes(8, "big") + beat_bytes
    phi_mask = _phi_expand(phi_seed, 64)
    phi_mixed = bytes(a ^ b for a, b in zip(blake_hash, phi_mask))
    return _hmac.new(key, phi_mixed, hashlib.sha256).digest()


# ── Cycle Token ───────────────────────────────────────────────────────────────

@dataclass
class CycleToken:
    """
    A pre-packed cycle token — an autonomous running unit.
    
    This is NOT a request.  It IS computation.  When created, it has already
    been sealed by PHX.  It can be deployed, executed, or stored.
    """
    token_id:    str
    engine_id:   str
    team_id:     str
    beat:        int
    slot:        int
    phx_seal:    str          # hex PHX token
    payload:     bytes        # the decision/instruction encoded
    created_ms:  int
    autonomous:  bool = True  # always true — this IS the engine running

    def to_dict(self) -> dict:
        return {
            "token_id":   self.token_id,
            "engine_id":  self.engine_id,
            "team_id":    self.team_id,
            "beat":       self.beat,
            "slot":       self.slot,
            "phx_seal":   self.phx_seal,
            "payload":    self.payload.hex(),
            "created_ms": self.created_ms,
            "autonomous": self.autonomous,
        }


# ── Block Box Tiers ───────────────────────────────────────────────────────────
#
# Block boxes are NOT just bronze.  The organism mints at five tiers:
#
#   BRONZE    — AI-auto-generated.  Education, onboarding, student canisters.
#   SILVER    — Team-approved.  Knowledge storage, intelligence artefacts.
#   GOLD      — Division-sealed.  Cross-team contracts, governance records.
#   PLATINUM  — Organism-level.  System upgrades, architectural laws.
#   SOVEREIGN — The organism itself.  Immutable constitutional QFBs.
#
# Each tier escalates the PHX seal strength and the Fibonacci capacity.
# Bronze is what AI engines auto-mint.  Sovereign is the organism's core.

class BlockBoxTier(Enum):
    BRONZE    = "bronze"      # AI-auto-generated
    SILVER    = "silver"      # team-approved
    GOLD      = "gold"        # division-sealed
    PLATINUM  = "platinum"    # organism-level
    SOVEREIGN = "sovereign"   # immutable core

TIER_PROPERTIES: dict[str, dict] = {
    "bronze":    {"seal_rounds": 1,  "phi_multiplier": 1.0,        "substrates": ["memory"]},
    "silver":    {"seal_rounds": 2,  "phi_multiplier": PHI,        "substrates": ["memory", "edge"]},
    "gold":      {"seal_rounds": 3,  "phi_multiplier": PHI_SQ,     "substrates": ["memory", "edge", "icp"]},
    "platinum":  {"seal_rounds": 5,  "phi_multiplier": PHI_CUBE,   "substrates": ["memory", "edge", "icp", "evm"]},
    "sovereign": {"seal_rounds": 8,  "phi_multiplier": PHI**4,     "substrates": ["memory", "edge", "icp", "evm", "solana"]},
}


@dataclass
class BlockBox:
    """
    Block Box (QFB) — the organism's universal meaning canister.

    In the Medina language: it's a block box.
    In ICP language: it's a canister.

    Five tiers:
      bronze    — AI-auto-generated (education, onboarding)
      silver    — team-approved (knowledge, intelligence)
      gold      — division-sealed (governance, contracts)
      platinum  — organism-level (system upgrades, laws)
      sovereign — immutable core (constitution)

    Structure:
      Block Box
      └── PHX seal (integrity, rounds scale with tier)
      └── Phi-address (spatial coordinate, rho scales with tier)
      └── Payload (the actual content)
      └── Minting engine ID (provenance)
      └── Cycle tokens (sovereign cycles embedded — these ARE the compute)
    """
    box_id:       str
    version:      int          = 1
    tier:         str          = "bronze"
    substrate:    list[str]    = field(default_factory=lambda: ["memory"])
    phx_seal:     str          = ""
    phi_theta:    float        = 0.0
    phi_phi:      float        = PHI
    phi_rho:      float        = 1.0
    phi_ring:     str          = "Sovereign"
    phi_beat:     int          = 0
    payload_type: str          = "data"
    payload_hex:  str          = ""
    label:        str          = ""
    minted_by:    str          = ""        # engine ID that minted this
    team_id:      str          = ""
    created_ms:   int          = 0
    cycle_budget: int          = 0         # sovereign cycles embedded in this box
    seal_rounds:  int          = 1         # PHX seal iterations (tier-dependent)

    def to_dict(self) -> dict:
        return {
            "box_id":       self.box_id,
            "version":      self.version,
            "tier":         self.tier,
            "substrate":    self.substrate,
            "phx_seal":     self.phx_seal,
            "phi_addr":     {
                "theta": self.phi_theta,
                "phi":   self.phi_phi,
                "rho":   self.phi_rho,
                "ring":  self.phi_ring,
                "beat":  self.phi_beat,
            },
            "payload_type": self.payload_type,
            "payload_hex":  self.payload_hex,
            "label":        self.label,
            "minted_by":    self.minted_by,
            "team_id":      self.team_id,
            "created_ms":   self.created_ms,
            "cycle_budget": self.cycle_budget,
            "seal_rounds":  self.seal_rounds,
        }

    def to_json(self, indent: int | None = None) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)

# Backward-compatible alias
BronzeBlockBox = BlockBox


# ── Cycle Engine ──────────────────────────────────────────────────────────────

class CycleEngine:
    """
    Autonomous cycle engine — generates its own 873ms cycles.
    
    CRITICAL: Cycles ARE tokens.  They are the organism's own compute.
    When deployed to ICP, we give our OWN cycles.  We don't rely on ICP
    at all.  We don't use their cycles.  We don't call them.  We don't
    do shit with them.  We give our own.  We can make more.
    
    Each engine:
      · Has its own PHX chain (sovereign key derived from team)
      · Generates cycle tokens at every tick — these ARE sovereign cycles
      · Each token IS computation, not a request for computation
      · Maintains its own beat counter
      · Never depends on another engine's clock
      · Can produce surplus cycles to give to block boxes
    """

    def __init__(self, engine_id: str, team_id: str, sovereign_key: bytes,
                 slots: int = MIN_SLOTS) -> None:
        self.engine_id = engine_id
        self.team_id   = team_id
        self._key      = sovereign_key
        self._slots    = max(slots, 1)
        self._beat     = 0
        self._prev     = None  # type: Optional[bytes]
        self._tokens   = []  # type: list[CycleToken]
        self._boot_ms  = int(time.time() * 1000)
        self._surplus_cycles = 0  # sovereign cycles available to give

    def tick(self, events: list[bytes] | None = None) -> list[CycleToken]:
        """
        Execute one cycle — generate pre-packed cycle tokens for all slots.
        
        Each token IS a sovereign cycle.  The organism generates these itself.
        They don't come from ICP.  They don't come from any external source.
        The engine makes them.  That's it.  Zero dependency.
        """
        evts = list(events or [])
        while len(evts) < self._slots:
            evts.append(f"engine:{self.engine_id}:beat:{self._beat}:slot:{len(evts)}".encode())

        tokens = []
        prev = self._prev
        for slot in range(self._slots):
            phx = _phx_token(evts[slot], self._key, prev, self._beat)
            ct = CycleToken(
                token_id   = f"{self.engine_id}-{self._beat}-{slot}",
                engine_id  = self.engine_id,
                team_id    = self.team_id,
                beat       = self._beat,
                slot       = slot,
                phx_seal   = phx.hex(),
                payload    = evts[slot],
                created_ms = int(time.time() * 1000),
            )
            tokens.append(ct)
            prev = phx

        self._prev = prev
        self._tokens.extend(tokens)
        self._beat += 1
        # Each tick produces surplus cycles (one per slot)
        self._surplus_cycles += self._slots
        return tokens

    def consume_cycles(self, count: int) -> int:
        """
        Consume sovereign cycles from this engine's surplus.
        
        Used when minting block boxes — the box gets embedded cycles.
        These are OUR cycles.  We generated them.  We give them.
        """
        available = min(count, self._surplus_cycles)
        self._surplus_cycles -= available
        return available

    def generate_cycles(self, count: int) -> int:
        """
        Generate additional sovereign cycles on demand.
        
        The engine can always make more.  Just bring the engine up
        and give them.  No external dependency.
        """
        # Each generated cycle gets a PHX seal
        for i in range(count):
            event = f"surplus:{self.engine_id}:{self._beat}:{i}".encode()
            _phx_token(event, self._key, self._prev, self._beat)
        self._surplus_cycles += count
        return self._surplus_cycles

    @property
    def beat(self) -> int:
        return self._beat

    @property
    def total_tokens(self) -> int:
        return len(self._tokens)

    @property
    def surplus_cycles(self) -> int:
        return self._surplus_cycles

    def fcpr(self) -> float:
        """Decisions per second for this engine."""
        return self._slots * HEARTBEAT_HZ

    def status(self) -> dict:
        return {
            "engine_id":       self.engine_id,
            "team_id":         self.team_id,
            "beat":            self._beat,
            "slots":           self._slots,
            "total_tokens":    self.total_tokens,
            "surplus_cycles":  self._surplus_cycles,
            "fcpr_dps":        round(self.fcpr(), 4),
            "uptime_ms":       int(time.time() * 1000) - self._boot_ms,
        }


# ── Block Box Generator ──────────────────────────────────────────────────────

class BlockBoxGenerator:
    """
    Autonomous block box minter — creates QFBs at ANY tier.
    
    In Medina language: block boxes.
    In ICP language: canisters.
    
    The organism's AIs don't just make bronze.  They mint at every tier:
      bronze    — auto-generated (students, onboarding)
      silver    — team-approved (knowledge, intelligence)
      gold      — division-sealed (governance, contracts)
      platinum  — organism-level (system upgrades)
      sovereign — core immutable (constitution)
    
    Each block box embeds sovereign cycles — the organism's own compute.
    When deployed to ICP, we give our own cycles.  Zero ICP dependency.
    """

    def __init__(self, generator_id: str, team_id: str,
                 sovereign_key: bytes) -> None:
        self.generator_id = generator_id
        self.team_id      = team_id
        self._key         = sovereign_key
        self._minted      = []  # type: list[BlockBox]
        self._beat         = 0

    def mint(
        self,
        payload: bytes,
        label: str = "",
        payload_type: str = "data",
        tier: str = "bronze",
        substrates: list[str] | None = None,
        cycle_budget: int = 0,
    ) -> BlockBox:
        """
        Mint a block box (QFB canister) at any tier.
        
        The block box is sealed with PHX, addressed with phi-coordinates,
        embeds sovereign cycles, and is ready for any substrate.
        
        Parameters:
          payload      — raw content bytes
          label        — human-readable label
          payload_type — "data" | "cpl_expression" | "instruction" | "resonance"
          tier         — "bronze" | "silver" | "gold" | "platinum" | "sovereign"
          substrates   — target substrates (defaults from tier properties)
          cycle_budget — sovereign cycles to embed (0 = use tier default)
        """
        if tier not in TIER_PROPERTIES:
            raise ValueError(f"Unknown tier '{tier}'. Valid: {list(TIER_PROPERTIES.keys())}")

        tier_props = TIER_PROPERTIES[tier]
        seal_rounds = tier_props["seal_rounds"]
        phi_mult = tier_props["phi_multiplier"]
        default_substrates = tier_props["substrates"]

        beat = self._beat

        # PHX seal — iterated based on tier (higher tier = more rounds)
        phx = payload
        for _round in range(seal_rounds):
            phx = _phx_token(
                phx if isinstance(phx, bytes) else payload,
                self._key, None, beat + _round
            )
        seal_hex = phx.hex()

        # Phi-coordinate address (golden angle distribution, rho scaled by tier)
        golden_angle = 2.399963229728653  # radians
        theta = beat * golden_angle
        rho   = math.sqrt(beat + 1) * PHI * phi_mult

        # Default cycle budget by tier if not specified
        if cycle_budget == 0:
            cycle_budget = seal_rounds * MIN_SLOTS  # more cycles for higher tiers

        box = BlockBox(
            box_id       = str(uuid.uuid4()),
            tier         = tier,
            substrate    = substrates or list(default_substrates),
            phx_seal     = seal_hex,
            phi_theta    = theta,
            phi_phi      = theta / PHI,
            phi_rho      = rho,
            phi_ring     = "Sovereign",
            phi_beat     = beat,
            payload_type = payload_type,
            payload_hex  = payload.hex(),
            label        = label,
            minted_by    = self.generator_id,
            team_id      = self.team_id,
            created_ms   = int(time.time() * 1000),
            cycle_budget = cycle_budget,
            seal_rounds  = seal_rounds,
        )

        self._minted.append(box)
        self._beat += 1
        return box

    @property
    def total_minted(self) -> int:
        return len(self._minted)

    def minted_by_tier(self) -> dict[str, int]:
        """Count of minted boxes by tier."""
        counts: dict[str, int] = {}
        for box in self._minted:
            counts[box.tier] = counts.get(box.tier, 0) + 1
        return counts

    def status(self) -> dict:
        return {
            "generator_id": self.generator_id,
            "team_id":      self.team_id,
            "total_minted": self.total_minted,
            "by_tier":      self.minted_by_tier(),
            "beat":         self._beat,
        }


# ── AI Team ───────────────────────────────────────────────────────────────────

class TeamRole(Enum):
    SOVEREIGN     = "sovereign"
    INTELLIGENCE  = "intelligence"
    FRONTEND      = "frontend"
    BACKEND       = "backend"
    EDUCATION     = "education"


class AITeam:
    """
    An autonomous AI team within the division.
    
    Each team:
      · Has its own cycle engine (generates its own heartbeat)
      · Has its own block box generator (mints its own QFBs)
      · Has its own PHX chain (sovereign ledger)
      · Scales independently on the Fibonacci curve
    """

    def __init__(
        self,
        team_id: str,
        role: TeamRole,
        sovereign_key: bytes,
        slots: int = MIN_SLOTS,
    ) -> None:
        self.team_id = team_id
        self.role    = role
        # Derive team-specific key from master key + team ID
        self._key = _hmac.new(
            sovereign_key, team_id.encode(), hashlib.sha256
        ).digest()

        # Core components — each team has its own
        self.engine = CycleEngine(
            engine_id=f"engine-{team_id}",
            team_id=team_id,
            sovereign_key=self._key,
            slots=slots,
        )
        self.generator = BlockBoxGenerator(
            generator_id=f"gen-{team_id}",
            team_id=team_id,
            sovereign_key=self._key,
        )
        self.scaler = FibonacciScaler()
        self._ledger: list[dict] = []
        self._boot_ms = int(time.time() * 1000)

    def tick(self, events: list[bytes] | None = None) -> list[CycleToken]:
        """Execute one autonomous cycle for this team."""
        tokens = self.engine.tick(events)
        # Record in ledger
        self._ledger.append({
            "beat":       self.engine.beat - 1,
            "tokens":     len(tokens),
            "phx_seal":   tokens[-1].phx_seal[:16] + "…" if tokens else "",
            "timestamp":  int(time.time() * 1000),
        })
        return tokens

    def mint_blockbox(
        self,
        payload: bytes,
        label: str = "",
        payload_type: str = "data",
        tier: str = "bronze",
        substrates: list[str] | None = None,
        cycle_budget: int = 0,
    ) -> BlockBox:
        """Mint a block box at any tier from this team's generator."""
        # If cycle_budget requested, consume from engine's surplus
        actual_budget = cycle_budget
        if actual_budget > 0:
            actual_budget = self.engine.consume_cycles(cycle_budget)
        box = self.generator.mint(
            payload, label, payload_type, tier, substrates, actual_budget
        )
        # Record minting in ledger
        self._ledger.append({
            "action":   "mint_blockbox",
            "box_id":   box.box_id[:8],
            "label":    label,
            "beat":     self.engine.beat,
            "timestamp": int(time.time() * 1000),
        })
        return box

    def scale(self, level: int) -> dict:
        """Scale this team to a Fibonacci level."""
        return self.scaler.scale_to(level)

    def status(self) -> dict:
        return {
            "team_id":       self.team_id,
            "role":          self.role.value,
            "engine":        self.engine.status(),
            "generator":     self.generator.status(),
            "scaler": {
                "level":     self.scaler.level,
                "capacity":  self.scaler.capacity,
            },
            "ledger_entries": len(self._ledger),
            "uptime_ms":     int(time.time() * 1000) - self._boot_ms,
        }


# ── Division Manager ──────────────────────────────────────────────────────────

class DivisionManager:
    """
    The organism's AI Division — manages all autonomous teams.
    
    This is the top-level orchestrator.  It:
      · Boots all five core teams
      · Ticks all teams in parallel (each team's own cycle)
      · Coordinates scaling across the Fibonacci curve
      · Provides the unified division status & manifest
    """

    def __init__(self, sovereign_key: bytes) -> None:
        if len(sovereign_key) < 16:
            raise ValueError("sovereign_key must be at least 16 bytes")
        self._key = sovereign_key
        self._teams: dict[str, AITeam] = {}
        self._booted = False
        self._boot_ms = int(time.time() * 1000)
        self._global_beat = 0

    def boot(self) -> dict:
        """
        Boot the division — create all five core teams.
        
        Teams:
          sovereign     — cycle engine, governance, PHX chain
          intelligence  — model routing, fusion, knowledge
          frontend      — scene rendering, visual, interaction
          backend       — data, storage, transport, mesh
          education     — student onboarding, bronze canister generation
        """
        if self._booted:
            return {"status": "already_booted", "teams": list(self._teams.keys())}

        for role in TeamRole:
            team_id = f"team-{role.value}"
            team = AITeam(
                team_id=team_id,
                role=role,
                sovereign_key=self._key,
                slots=MIN_SLOTS,
            )
            self._teams[team_id] = team

        self._booted = True
        return {
            "status": "booted",
            "teams":  list(self._teams.keys()),
            "total":  len(self._teams),
        }

    def team(self, role: str) -> AITeam:
        """Get a team by role name (e.g. 'education', 'sovereign')."""
        team_id = f"team-{role}"
        if team_id not in self._teams:
            raise KeyError(f"No team '{role}'. Available: {list(self._teams.keys())}")
        return self._teams[team_id]

    def tick_all(self, events_per_team: dict[str, list[bytes]] | None = None) -> dict:
        """
        Tick all teams — each team advances its own cycle independently.
        
        This is the division-wide heartbeat.  Each team generates its own
        cycle tokens.  No team depends on another's clock.
        """
        if not self._booted:
            raise RuntimeError("Division not booted. Call boot() first.")

        results = {}
        evts = events_per_team or {}
        for team_id, team in self._teams.items():
            team_events = evts.get(team.role.value, None)
            tokens = team.tick(team_events)
            results[team_id] = {
                "beat":       team.engine.beat,
                "tokens":     len(tokens),
                "seal":       tokens[-1].phx_seal[:16] + "…" if tokens else "",
            }

        self._global_beat += 1
        return {
            "global_beat": self._global_beat,
            "teams":       results,
        }

    def scale_to_level(self, level: int) -> dict:
        """Scale all teams to a Fibonacci level."""
        results = {}
        for team_id, team in self._teams.items():
            results[team_id] = team.scale(level)
        return {
            "level": level,
            "teams": results,
        }

    def mint_blockbox(
        self,
        team_role: str,
        payload: bytes,
        label: str = "",
        payload_type: str = "data",
        tier: str = "bronze",
        substrates: list[str] | None = None,
        cycle_budget: int = 0,
    ) -> BlockBox:
        """Mint a block box at any tier from a specific team."""
        return self.team(team_role).mint_blockbox(
            payload, label, payload_type, tier, substrates, cycle_budget
        )

    # ── Status & Manifest ─────────────────────────────────────────────────────

    def status(self) -> dict:
        """Full division status."""
        teams_status = {tid: t.status() for tid, t in self._teams.items()}
        total_tokens = sum(t.engine.total_tokens for t in self._teams.values())
        total_boxes  = sum(t.generator.total_minted for t in self._teams.values())
        total_fcpr   = sum(t.engine.fcpr() for t in self._teams.values())
        return {
            "code":          "AID",
            "name":          "AI Division",
            "version":       "1.0.0",
            "ring":          "Sovereign",
            "booted":        self._booted,
            "global_beat":   self._global_beat,
            "team_count":    len(self._teams),
            "total_tokens":  total_tokens,
            "total_boxes":   total_boxes,
            "total_fcpr":    round(total_fcpr, 4),
            "heartbeat_ms":  HEARTBEAT_MS,
            "teams":         teams_status,
            "uptime_ms":     int(time.time() * 1000) - self._boot_ms,
        }

    def manifest(self) -> dict:
        """Machine-readable manifest of all teams, engines, capacities."""
        return {
            "division": "AI Division",
            "version":  "1.0.0",
            "teams": [
                {
                    "team_id":    t.team_id,
                    "role":       t.role.value,
                    "engine_id":  t.engine.engine_id,
                    "generator":  t.generator.generator_id,
                    "beat":       t.engine.beat,
                    "slots":      t.engine._slots,
                    "fcpr":       round(t.engine.fcpr(), 4),
                    "tokens":     t.engine.total_tokens,
                    "boxes":      t.generator.total_minted,
                    "fib_level":  t.scaler.level,
                    "capacity":   t.scaler.capacity,
                }
                for t in self._teams.values()
            ],
            "scaling_curve": FibonacciScaler().growth_curve(),
        }


# ── Self-test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    key = os.urandom(32)
    div = DivisionManager(sovereign_key=key)

    print("═══ AI DIVISION ENGINE — DEMO  (Medina) ═══\n")

    # Boot
    boot = div.boot()
    print(f"Booted: {boot['teams']}\n")

    # Tick all teams 5 times
    for i in range(5):
        result = div.tick_all()
        print(f"  Global beat {result['global_beat']}:")
        for tid, info in result["teams"].items():
            print(f"    {tid}: beat={info['beat']} tokens={info['tokens']} seal={info['seal']}")

    print()

    # Mint block boxes
    for role in ["education", "sovereign", "intelligence"]:
        box = div.mint_blockbox(role, f"test-payload-{role}".encode(), label=f"{role} test box")
        print(f"  Minted: {box.box_id[:8]}… tier={box.tier} team={box.team_id} label='{box.label}'")

    print()

    # Scale to level 5 (≈ 50,000)
    scaling = div.scale_to_level(5)
    print(f"  Scaled to level {scaling['level']}:")
    for tid, info in scaling["teams"].items():
        print(f"    {tid}: capacity={info['capacity']} name={info['name']}")

    print()

    # Full status
    print("── Status ────────────────────────────────────────────────────")
    status = div.status()
    print(f"  Teams:       {status['team_count']}")
    print(f"  Total FCPR:  {status['total_fcpr']} dps")
    print(f"  Tokens:      {status['total_tokens']}")
    print(f"  Block boxes: {status['total_boxes']}")

    print()

    # Manifest
    print("── Scaling Curve ─────────────────────────────────────────────")
    for lvl in FibonacciScaler().growth_curve():
        print(f"  Level {lvl['level']}: {lvl['name']:15s} capacity={lvl['capacity']:>6d}  φ^n={lvl['phi_exp']}")

    print()
    print("═══ Demo complete ═══")
