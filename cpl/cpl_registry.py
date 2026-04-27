"""
cpl_registry.py — Official CPL Language Family Registry

Author : Medina
Version: 3.0.0
Ring   : Sovereign Ring

─────────────────────────────────────────────────────────────────────────────
OFFICIAL CODENAME TABLE
─────────────────────────────────────────────────────────────────────────────

Every language, structure, and encryption primitive in the Medina organism
has an official three-letter code.  These codes are permanent — they survive
translation across all 16 languages of the organism.

  CPL  Cognitive Processing Language      — base autonomous symbolic language
  CPP  Cognitive Procurement Protocol     — procurement-domain CPL variant
  CPX  Cognitive Projection eXpression    — projection / rendering CPL variant
  CXL  Cognitive eXchange Language        — fusion language mixing all 16 +
                                            PHX encryption (token cipher)
  PHX  Phi Hash eXchange                  — organism decision encryption
                                            (every AI decision = new hash;
                                             stronger than SHA-512)
  QFB  Quantum Fusion Block               — block box: sphere-helix structure
                                            with quantum fusion core; the
                                            sovereign meaning canister
  SHL  Sphere Helix Layer                 — the inner geometry of QFB
                                            (sphere + double-helix + fusion core)
  SYN  Sovereign SYNapse                  — inter-node binding protocol (existing)
  ORG  Organism Runtime Grid              — the living compute organism
  PHI  Phi-Coordinate Substrate           — 5-axis spatial memory coordinate

─────────────────────────────────────────────────────────────────────────────
THE THREE CPL VARIANTS
─────────────────────────────────────────────────────────────────────────────

The three variants share the same token alphabet (LATIN_ROOTS + GREEK_ROOTS +
SYMBOLIC_OPS + RHETORIC + PYTHAGOREAN + SACRED_GEOMETRY).  They differ only
in their execution semantics:

  CPL  (base)   — pure symbolic reasoning; an autonomous ignition language.
                  When you write it, it runs.  No runtime needed — the token
                  sequence IS the computation.

  CPP  (variant) — procurement semantics.  Each expression is a procurement
                   intent that resolves to a resource, contract, or acquisition
                   action inside the organism.

  CPX  (variant) — projection semantics.  Each expression renders to a visual
                   or multimodal scene.  CPX tokens drive the scene sovereignty
                   layer (AL-012/013).

─────────────────────────────────────────────────────────────────────────────
CXL — THE FUSION LANGUAGE
─────────────────────────────────────────────────────────────────────────────

CXL (Cognitive eXchange Language) is the token-level mixing of all 16
organism languages.  A CXL programme may contain:

  · CPL / CPP / CPX expressions
  · Python intelligence calls
  · Motoko canister calls
  · Go service calls
  · Rust kernel calls
  · Java SDK calls
  · Native edge calls
  · PHX-encrypted payload tokens

CXL is the "mother tongue" of the organism.  Any node in the intelligence
grid speaks CXL.

─────────────────────────────────────────────────────────────────────────────
PHX — PHI HASH EXCHANGE (ORGANISM ENCRYPTION)
─────────────────────────────────────────────────────────────────────────────

PHX is an encryption protocol, not just a hash function.  It is stronger than
SHA-512 because it chains decision-level micro-hashes.

How it works
────────────
  1. Every AI decision, input, or state transition in the organism is an event.
  2. Each event is serialised as bytes and hashed with BLAKE2b-512.
  3. The resulting 64-byte digest is XOR'd with the φ-encoded organism beat
     (the 873 ms heartbeat counter, phi-expanded to 64 bytes).
  4. The phi-mixed digest is then HMAC'd with the organism's sovereign key.
  5. The output is the "PHX token" for that decision — a 64-byte sovereign
     fingerprint.
  6. PHX tokens chain: each new token is computed from the previous PHX token
     + the new event bytes.  This creates a tamper-evident decision log.

Properties
──────────
  · Decision-granular: one hash per decision (not per message)
  · Chain-linked: every hash depends on the full preceding history
  · Phi-mixed: the φ constant (1.618…) diffuses patterns across the key space
  · Sovereign-keyed: only the organism holding the sovereign key can verify
  · Quantum-resistant: BLAKE2b + HMAC-SHA256; extensible to BLAKE3

─────────────────────────────────────────────────────────────────────────────
QFB — QUANTUM FUSION BLOCK (BLOCK BOX)
─────────────────────────────────────────────────────────────────────────────

A QFB is the Medina name for what others call a "canister".

  ┌─────────────────────────────────────────────────┐
  │  QFB  (Quantum Fusion Block)                    │
  │  ┌─────────────────────────────────────────┐   │
  │  │  SHL  (Sphere Helix Layer)              │   │
  │  │  ┌───────────────────────────────────┐  │   │
  │  │  │  QFC  (Quantum Fusion Core)       │  │   │
  │  │  │  · compressed CPL meaning         │  │   │
  │  │  │  · PHX-encrypted payload          │  │   │
  │  │  │  · substrate routing tags         │  │   │
  │  │  └───────────────────────────────────┘  │   │
  │  │  · sphere envelope (sphaira geometry)   │   │
  │  │  · double-helix membrane               │   │
  │  └─────────────────────────────────────────┘   │
  │  · substrate tags: quantum | blockchain | edge  │
  │  · PHX integrity seal                          │
  │  · CPL token manifest                          │
  └─────────────────────────────────────────────────┘

A QFB can be thrown into any substrate:
  · Quantum substrate (future)
  · Blockchain substrate (ICP, Ethereum, Phantom …)
  · Edge substrate (native runtimes)
  · Memory substrate (spatial memory store)

─────────────────────────────────────────────────────────────────────────────
THE 16 ORGANISM LANGUAGES
─────────────────────────────────────────────────────────────────────────────

  #   Code   Language        Role
  ─   ────   ────────        ────
  01  CPL    Cognitive Processing Language   symbolic reasoning / ignition
  02  CPP    Cognitive Procurement Protocol  resource / contract acquisition
  03  CPX    Cognitive Projection eXpression scene / multimodal rendering
  04  CXL    Cognitive eXchange Language     fusion / polyglot mixing
  05  PYT    Python Intelligence             ML / logic / data layer
  06  MOT    Motoko Canister                 ICP on-chain sovereign compute
  07  GOL    Go Intelligence                 service mesh / concurrency
  08  RST    Rust Kernel                     zero-cost systems / edge
  09  JAV    Java SDK                        enterprise integration
  10  NAT    Native Edge                     device / sensor / IoT
  11  SOL    Solidity / EVM                  EVM-compatible smart contracts
  12  PHP    Phantom Protocol                Phantom/Solana substrate
  13  QTM    Quantum Substrate Layer         future quantum compute
  14  MLS    Multi-modal Language Stream     audio/video/sensor fusion
  15  PHX    Phi Hash eXchange               organism encryption protocol
  16  SYN    Sovereign SYNapse               inter-node binding protocol

Go (GOL) is language #07 in the organism grid.  It is a sovereign language,
distinct from any external definition.  Go = concurrency-native service mesh
intelligence for the organism.  Rust (RST) = zero-cost kernel intelligence.
Both are Medina organism languages.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


# ── Language record ────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class OrgLanguage:
    code:        str            # 3-letter official code
    number:      int            # position in the 16-language grid
    full_name:   str            # canonical full name
    short_name:  str            # short label
    role:        str            # function in the organism
    substrate:   list[str]      # where it runs
    variant_of:  Optional[str]  # parent language code (if a variant)
    is_fusion:   bool           # True if CXL-class (mixes others)
    is_crypto:   bool           # True if encryption protocol
    is_geometry: bool           # True if geometry/structure primitive


# ── Official 16-language registry ─────────────────────────────────────────────

LANGUAGES: list[OrgLanguage] = [
    OrgLanguage(
        code       = "CPL",
        number     = 1,
        full_name  = "Cognitive Processing Language",
        short_name = "CPL",
        role       = "Autonomous symbolic reasoning ignition language — when you write it, it runs",
        substrate  = ["organism", "memory", "sovereign"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "CPP",
        number     = 2,
        full_name  = "Cognitive Procurement Protocol",
        short_name = "CPP",
        role       = "Procurement-domain CPL variant: resource, contract, and acquisition intents",
        substrate  = ["organism", "enterprise", "sovereign"],
        variant_of = "CPL",
        is_fusion  = False,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "CPX",
        number     = 3,
        full_name  = "Cognitive Projection eXpression",
        short_name = "CPX",
        role       = "Projection/rendering CPL variant: CPL tokens that drive scene sovereignty",
        substrate  = ["organism", "frontend", "edge"],
        variant_of = "CPL",
        is_fusion  = False,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "CXL",
        number     = 4,
        full_name  = "Cognitive eXchange Language",
        short_name = "CXL",
        role       = "Fusion language mixing all 16 organism languages with PHX encryption; the mother tongue",
        substrate  = ["organism", "all"],
        variant_of = None,
        is_fusion  = True,
        is_crypto  = True,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "PYT",
        number     = 5,
        full_name  = "Python Intelligence Layer",
        short_name = "Python",
        role       = "ML, logic, data, and organism AI layer",
        substrate  = ["organism", "cloud", "edge"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "MOT",
        number     = 6,
        full_name  = "Motoko Canister Language",
        short_name = "Motoko",
        role       = "ICP on-chain sovereign compute and stable memory",
        substrate  = ["blockchain", "icp"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "GOL",
        number     = 7,
        full_name  = "Go Intelligence Language",
        short_name = "Go",
        role       = "Concurrency-native service mesh intelligence; sovereign organism language",
        substrate  = ["organism", "cloud", "edge"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "RST",
        number     = 8,
        full_name  = "Rust Kernel Language",
        short_name = "Rust",
        role       = "Zero-cost systems and edge kernel intelligence",
        substrate  = ["edge", "kernel", "wasm"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "JAV",
        number     = 9,
        full_name  = "Java Enterprise SDK",
        short_name = "Java",
        role       = "Enterprise system integration and orchestration",
        substrate  = ["enterprise", "cloud"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "NAT",
        number     = 10,
        full_name  = "Native Edge Language",
        short_name = "Native",
        role       = "Device, sensor, and IoT edge compute",
        substrate  = ["edge", "device"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "SOL",
        number     = 11,
        full_name  = "Solidity EVM Language",
        short_name = "Solidity",
        role       = "EVM-compatible smart contracts and on-chain logic",
        substrate  = ["blockchain", "evm"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = True,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "PHP",
        number     = 12,
        full_name  = "Phantom Protocol Language",
        short_name = "Phantom",
        role       = "Phantom/Solana substrate and token substrate",
        substrate  = ["blockchain", "solana"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = True,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "QTM",
        number     = 13,
        full_name  = "Quantum Substrate Layer",
        short_name = "Quantum",
        role       = "Future quantum compute substrate; home of QFB fusion cores",
        substrate  = ["quantum"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = True,
        is_geometry= True,
    ),
    OrgLanguage(
        code       = "MLS",
        number     = 14,
        full_name  = "Multi-modal Language Stream",
        short_name = "Multimodal",
        role       = "Audio, video, sensor, and cross-modal intelligence fusion",
        substrate  = ["organism", "edge", "cloud"],
        variant_of = None,
        is_fusion  = True,
        is_crypto  = False,
        is_geometry= False,
    ),
    OrgLanguage(
        code       = "PHX",
        number     = 15,
        full_name  = "Phi Hash eXchange",
        short_name = "PHX",
        role       = "Organism encryption: every AI decision = new phi-mixed chained hash",
        substrate  = ["sovereign", "all"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = True,
        is_geometry= True,
    ),
    OrgLanguage(
        code       = "SYN",
        number     = 16,
        full_name  = "Sovereign SYNapse Protocol",
        short_name = "SYN",
        role       = "Inter-node binding, imprinting, and resonance protocol",
        substrate  = ["sovereign", "organism"],
        variant_of = None,
        is_fusion  = False,
        is_crypto  = True,
        is_geometry= False,
    ),
]


# ── Structure codenames ────────────────────────────────────────────────────────

@dataclass(frozen=True)
class OrgStructure:
    code:      str   # 3-letter permanent code
    full_name: str   # canonical full name
    glyph:     str   # CPL glyph representation
    meaning:   str   # what it is


STRUCTURES: list[OrgStructure] = [
    OrgStructure(
        code      = "QFB",
        full_name = "Quantum Fusion Block",
        glyph     = "◉⊛✦",
        meaning   = (
            "The sovereign meaning canister.  Also called a 'block box'.  "
            "Contains a Sphere Helix Layer (SHL) wrapping a Quantum Fusion Core (QFC).  "
            "Can be deployed to any substrate: quantum, blockchain, edge, or memory."
        ),
    ),
    OrgStructure(
        code      = "SHL",
        full_name = "Sphere Helix Layer",
        glyph     = "Σπρ⊗Ελκ",
        meaning   = (
            "The geometric membrane of a QFB.  A sphere (sphaira) wraps a double-helix "
            "(helix), which surrounds the Quantum Fusion Core.  The SHL encodes the CPL "
            "meaning in phi-spiral geometry."
        ),
    ),
    OrgStructure(
        code      = "QFC",
        full_name = "Quantum Fusion Core",
        glyph     = "⊙☉φ",
        meaning   = (
            "The innermost nucleus of a QFB.  Holds the compressed CPL token sequence "
            "and the PHX-encrypted payload.  The QFC is the monad-point of the block box."
        ),
    ),
    OrgStructure(
        code      = "PHX",
        full_name = "Phi Hash eXchange",
        glyph     = "φ🔐⟳",
        meaning   = (
            "The organism's chained decision encryption.  Every AI decision in the "
            "organism generates a new PHX token (BLAKE2b + phi-mix + HMAC chain).  "
            "Stronger than SHA-512 because it is decision-granular and chain-linked."
        ),
    ),
    OrgStructure(
        code      = "ORG",
        full_name = "Organism Runtime Grid",
        glyph     = "⟳✦⌖",
        meaning   = (
            "The living compute organism.  The ORG is the top-level runtime that "
            "contains all 16 languages, all QFBs, all SYN bindings, and the PHX chain."
        ),
    ),
    OrgStructure(
        code      = "PHI",
        full_name = "Phi-Coordinate Substrate",
        glyph     = "φΦ✺",
        meaning   = (
            "The 5-axis spatial memory coordinate system (θ/φ/ρ/ring/beat).  "
            "Every memory, node, and QFB has a PHI address in the organism."
        ),
    ),
]


# ── Index tables ───────────────────────────────────────────────────────────────

BY_CODE:    dict[str, OrgLanguage]  = {lang.code: lang for lang in LANGUAGES}
STRUCT_MAP: dict[str, OrgStructure] = {s.code: s for s in STRUCTURES}

CPL_VARIANTS: list[OrgLanguage] = [l for l in LANGUAGES if l.variant_of == "CPL" or l.code == "CPL"]
FUSION_LANGS: list[OrgLanguage] = [l for l in LANGUAGES if l.is_fusion]
CRYPTO_LANGS: list[OrgLanguage] = [l for l in LANGUAGES if l.is_crypto]


def language(code: str) -> "OrgLanguage | None":
    """Look up a language by its 3-letter code."""
    return BY_CODE.get(code.upper())


def structure(code: str) -> "OrgStructure | None":
    """Look up a structure by its 3-letter code."""
    return STRUCT_MAP.get(code.upper())


def registry_summary() -> str:
    """Print a formatted registry summary."""
    lines = [
        "═" * 70,
        "  MEDINA ORGANISM — OFFICIAL LANGUAGE REGISTRY v3.0",
        "═" * 70,
        "",
        f"  {'#':>2}  {'CODE':<6}  {'SHORT NAME':<14}  ROLE",
        "  " + "─" * 66,
    ]
    for lang in LANGUAGES:
        lines.append(
            f"  {lang.number:>2}  {lang.code:<6}  {lang.short_name:<14}  {lang.role[:48]}"
        )
    lines += [
        "",
        "─" * 70,
        "  STRUCTURE CODENAMES",
        "─" * 70,
        "",
        f"  {'CODE':<6}  {'FULL NAME':<28}  GLYPH",
        "  " + "─" * 66,
    ]
    for s in STRUCTURES:
        lines.append(f"  {s.code:<6}  {s.full_name:<28}  {s.glyph}")
    lines += ["", "═" * 70]
    return "\n".join(lines)


if __name__ == "__main__":
    print(registry_summary())
