"""
cpl_tokens.py — CPL Token Dictionary

The Cognitive Processing Language (CPL) uses three glyph families to
compress meaning into dense, unambiguous tokens:

  FAMILY 1: ANCIENT LATIN ROOTS (concept roots from Classical Latin)
  FAMILY 2: GREEK LETTER CONCEPTS (from Ancient Greek philosophy/science)
  FAMILY 3: SYMBOLIC OPERATORS  (logic, math, flow, relation symbols)

Each token maps a human concept to:
  - glyph:   the written representation
  - code:    a unique 16-bit integer (used for binary compression)
  - arity:   0=atom, 1=unary, 2=binary, N=n-ary
  - domain:  MIND | LOGIC | FLOW | SPACE | TIME | ORGANISM | CIPHER

Token codes are allocated as:
  0x0000–0x0FFF  Latin concept roots
  0x1000–0x1FFF  Greek concept roots
  0x2000–0x2FFF  Symbolic operators

Ring: Sovereign Ring | Wire: intelligence-wire/cpl
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional


# ── Token dataclass ────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class CPLToken:
    glyph:   str            # the symbol/glyph/abbreviation
    name:    str            # human-readable concept name
    code:    int            # 16-bit integer code
    arity:   int            # number of arguments (0=atom, 1=unary, 2=binary)
    domain:  str            # concept domain
    latin:   Optional[str]  # Latin root (if Family 1)
    greek:   Optional[str]  # Greek word (if Family 2)
    english: str            # English gloss


# ── FAMILY 1: Latin concept roots ─────────────────────────────────────────────

LATIN_ROOTS: list[CPLToken] = [
    # MIND & COGNITION
    CPLToken("ΜΝ",  "MENTE",       0x0001, 0, "MIND",     "mens/mentis",       None,         "mind"),
    CPLToken("ΚΝΩ", "COGNITIO",    0x0002, 1, "MIND",     "cognitio",          None,         "cognition/knowing"),
    CPLToken("ΙΝΤ", "INTELLECTUS", 0x0003, 0, "MIND",     "intellectus",       None,         "intellect"),
    CPLToken("ΡΑΤ", "RATIO",       0x0004, 0, "MIND",     "ratio",             None,         "reason"),
    CPLToken("ΣΝΣ", "SENSUS",      0x0005, 0, "MIND",     "sensus",            None,         "sense/perception"),
    CPLToken("ΙΜΑ", "IMAGO",       0x0006, 0, "MIND",     "imago",             None,         "image/representation"),
    CPLToken("ΙΝΖ", "INTENTIO",    0x0007, 1, "MIND",     "intentio",          None,         "intention"),
    CPLToken("ΑΤΤ", "ATTENTIO",    0x0008, 1, "MIND",     "attentio",          None,         "attention"),
    CPLToken("ΜΜ",  "MEMORIA",     0x0009, 0, "MIND",     "memoria",           None,         "memory"),
    CPLToken("ΣΜΝ", "SOMNUS",      0x000A, 0, "MIND",     "somnus",            None,         "unconscious/sleep"),

    # SOUL & WILL
    CPLToken("ΑΝΜ", "ANIMUS",      0x0010, 0, "SOUL",     "animus",            None,         "soul/spirit"),
    CPLToken("ΒΛΘ", "VOLUNTAS",    0x0011, 1, "SOUL",     "voluntas",          None,         "will/volition"),
    CPLToken("ΑΦΦ", "AFFECTUS",    0x0012, 0, "SOUL",     "affectus",          None,         "feeling/affect"),
    CPLToken("ΔΣΡ", "DESIDERIUM",  0x0013, 0, "SOUL",     "desiderium",        None,         "desire"),
    CPLToken("ΤΜΡ", "TIMOR",       0x0014, 0, "SOUL",     "timor",             None,         "fear"),

    # TRUTH & KNOWLEDGE
    CPLToken("ΑΛΘ", "VERITAS",     0x0020, 0, "TRUTH",    "veritas",           None,         "truth"),
    CPLToken("ΣΚΡ", "SCIENTIA",    0x0021, 0, "TRUTH",    "scientia",          None,         "knowledge/science"),
    CPLToken("ΣΠΝ", "SAPIENTIA",   0x0022, 0, "TRUTH",    "sapientia",         None,         "wisdom"),
    CPLToken("ΕΡΡ", "ERROR",       0x0023, 0, "TRUTH",    "error",             None,         "error/falsehood"),
    CPLToken("ΔΒΤ", "DUBITATIO",   0x0024, 0, "TRUTH",    "dubitatio",         None,         "doubt"),

    # POWER & ACTION
    CPLToken("ΔΝΜ", "POTENTIA",    0x0030, 0, "POWER",    "potentia",          None,         "power/potential"),
    CPLToken("ΑΧ",  "ACTIO",       0x0031, 1, "POWER",    "actio",             None,         "action"),
    CPLToken("ΑΡΤ", "ARS",         0x0032, 0, "POWER",    "ars/artis",         None,         "art/skill"),
    CPLToken("ΟΡΔ", "ORDO",        0x0033, 0, "POWER",    "ordo",              None,         "order/structure"),
    CPLToken("ΛΓΣ", "LEX",         0x0034, 0, "POWER",    "lex/legis",         None,         "law/rule"),
    CPLToken("ΔΜΝ", "DOMINIUM",    0x0035, 0, "POWER",    "dominium",          None,         "sovereignty/dominion"),
    CPLToken("ΑΧΤ", "AUCTORITAS",  0x0036, 0, "POWER",    "auctoritas",        None,         "authority"),

    # SPACE & BEING
    CPLToken("ΛΧΣ", "LOCUS",       0x0040, 0, "SPACE",    "locus",             None,         "place/location"),
    CPLToken("ΤΜΠ", "TEMPUS",      0x0041, 0, "TIME",     "tempus",            None,         "time"),
    CPLToken("ΕΝΣ", "ESSE",        0x0042, 0, "BEING",    "esse",              None,         "being/existence"),
    CPLToken("ΝΗΛ", "NIHIL",       0x0043, 0, "BEING",    "nihil",             None,         "nothing/null"),
    CPLToken("ΟΜΝ", "OMNE",        0x0044, 0, "BEING",    "omne",              None,         "all/everything"),
    CPLToken("ΠΡΣ", "PARS",        0x0045, 0, "BEING",    "pars/partis",       None,         "part/component"),
    CPLToken("ΦΡΜ", "FORMA",       0x0046, 0, "BEING",    "forma",             None,         "form/structure"),

    # ORGANISM CONCEPTS
    CPLToken("ΦΛΣ", "FLUXUS",      0x0050, 0, "ORGANISM", "fluxus",            None,         "flow/stream"),
    CPLToken("ΠΛΣ", "PULSUS",      0x0051, 0, "ORGANISM", "pulsus",            None,         "pulse/heartbeat"),
    CPLToken("ΝΔΣ", "NODUS",       0x0052, 0, "ORGANISM", "nodus",             None,         "node"),
    CPLToken("ΡΤΣ", "RETE",        0x0053, 0, "ORGANISM", "rete",              None,         "network/web"),
    CPLToken("ΣΓΝ", "SIGNUM",      0x0054, 0, "ORGANISM", "signum",            None,         "signal/sign"),
    CPLToken("ΑΓΝ", "AGENS",       0x0055, 0, "ORGANISM", "agens",             None,         "agent"),
]

# ── FAMILY 2: Greek concept roots ──────────────────────────────────────────────

GREEK_ROOTS: list[CPLToken] = [
    # MIND & REASON
    CPLToken("Λγ",  "LOGOS",       0x1001, 0, "MIND",     None, "Λόγος",        "reason/word/logic"),
    CPLToken("Νσ",  "NOUS",        0x1002, 0, "MIND",     None, "Νοῦς",         "mind/intellect"),
    CPLToken("Φρ",  "PHRONESIS",   0x1003, 0, "MIND",     None, "Φρόνησις",     "practical wisdom"),
    CPLToken("Σφ",  "SOPHIA",      0x1004, 0, "MIND",     None, "Σοφία",        "wisdom"),
    CPLToken("Επ",  "EPISTEME",    0x1005, 0, "MIND",     None, "Ἐπιστήμη",     "scientific knowledge"),
    CPLToken("Δξ",  "DOXA",        0x1006, 0, "MIND",     None, "Δόξα",         "belief/opinion"),
    CPLToken("Ασθ", "AISTHESIS",   0x1007, 0, "MIND",     None, "Αἴσθησις",     "perception/sensation"),
    CPLToken("Νη",  "NOEMA",       0x1008, 0, "MIND",     None, "Νόημα",        "thought-content"),
    CPLToken("Μνη", "MNEME",       0x1009, 0, "MIND",     None, "Μνήμη",        "memory"),
    CPLToken("Φτ",  "PHANTASIA",   0x100A, 0, "MIND",     None, "Φαντασία",     "imagination"),

    # SOUL & BEING
    CPLToken("Ψχ",  "PSYCHE",      0x1010, 0, "SOUL",     None, "Ψυχή",         "soul/psyche"),
    CPLToken("Πν",  "PNEUMA",      0x1011, 0, "SOUL",     None, "Πνεῦμα",       "spirit/breath"),
    CPLToken("Αρ",  "ARETE",       0x1012, 0, "SOUL",     None, "Ἀρετή",        "virtue/excellence"),
    CPLToken("Εδ",  "EIDOS",       0x1013, 0, "BEING",    None, "Εἶδος",        "form/idea"),
    CPLToken("Ον",  "ONTOS",       0x1014, 0, "BEING",    None, "Ὄντος",        "being"),
    CPLToken("Κσ",  "KAIROS",      0x1015, 0, "TIME",     None, "Καιρός",       "right moment"),
    CPLToken("Χρ",  "CHRONOS",     0x1016, 0, "TIME",     None, "Χρόνος",       "chronological time"),
    CPLToken("Τπ",  "TOPOS",       0x1017, 0, "SPACE",    None, "Τόπος",        "place/space"),

    # TRUTH & REALITY
    CPLToken("Αθ",  "ALETHEIA",    0x1020, 0, "TRUTH",    None, "Ἀλήθεια",      "truth/un-concealment"),
    CPLToken("Ψδ",  "PSEUDOS",     0x1021, 0, "TRUTH",    None, "Ψεῦδος",       "falsehood"),
    CPLToken("Αρχ", "ARCHE",       0x1022, 0, "TRUTH",    None, "Ἀρχή",         "origin/principle"),
    CPLToken("Τλ",  "TELOS",       0x1023, 0, "MIND",     None, "Τέλος",        "purpose/end"),
    CPLToken("Αν",  "ANAMNESIS",   0x1024, 0, "MIND",     None, "Ἀνάμνησις",    "recollection"),

    # POWER & NATURE
    CPLToken("Δν",  "DYNAMIS",     0x1030, 0, "POWER",    None, "Δύναμις",      "power/capacity"),
    CPLToken("Εν",  "ENERGEIA",    0x1031, 0, "POWER",    None, "Ἐνέργεια",     "actuality/energy"),
    CPLToken("Φσ",  "PHYSIS",      0x1032, 0, "ORGANISM", None, "Φύσις",        "nature/growth"),
    CPLToken("Κσμ", "KOSMOS",      0x1033, 0, "BEING",    None, "Κόσμος",       "ordered universe"),
    CPLToken("Χσ",  "CHAOS",       0x1034, 0, "BEING",    None, "Χάος",         "primordial void"),
    CPLToken("Λγσ", "LOGOS_SPERMA",0x1035, 0, "ORGANISM", None, "Λόγος σπερμ.", "generative reason"),

    # ORGANISM / AI
    CPLToken("Κβ",  "KYBERNETES",  0x1040, 0, "ORGANISM", None, "Κυβερνήτης",   "steersman/governor"),
    CPLToken("Αλγ", "ALGORITHMIA", 0x1041, 0, "ORGANISM", None, "Ἀλγόρυθμος",   "algorithm"),
    CPLToken("Συ",  "SYNTHESIS",   0x1042, 2, "MIND",     None, "Σύνθεσις",     "synthesis"),
    CPLToken("Ανλ", "ANALYSIS",    0x1043, 1, "MIND",     None, "Ἀνάλυσις",     "analysis"),
    CPLToken("Δλγ", "DIALEKTIKE",  0x1044, 2, "MIND",     None, "Διαλεκτική",   "dialectic"),
    CPLToken("Μθ",  "METHODOS",    0x1045, 0, "MIND",     None, "Μέθοδος",      "method"),
    CPLToken("Τχ",  "TECHNE",      0x1046, 0, "POWER",    None, "Τέχνη",        "art/craft/technology"),
]

# ── FAMILY 3: Symbolic operators ───────────────────────────────────────────────

OPERATORS: list[CPLToken] = [
    # LOGICAL OPERATORS
    CPLToken("∧",   "AND",         0x2001, 2, "LOGIC",    None, None, "logical conjunction (AND)"),
    CPLToken("∨",   "OR",          0x2002, 2, "LOGIC",    None, None, "logical disjunction (OR)"),
    CPLToken("¬",   "NOT",         0x2003, 1, "LOGIC",    None, None, "logical negation (NOT)"),
    CPLToken("→",   "IMPLIES",     0x2004, 2, "LOGIC",    None, None, "material implication"),
    CPLToken("↔",   "IFF",         0x2005, 2, "LOGIC",    None, None, "biconditional (if and only if)"),
    CPLToken("⊕",   "XOR",         0x2006, 2, "LOGIC",    None, None, "exclusive or"),
    CPLToken("⊤",   "TRUE",        0x2007, 0, "LOGIC",    None, None, "tautology/always true"),
    CPLToken("⊥",   "FALSE",       0x2008, 0, "LOGIC",    None, None, "contradiction/always false"),

    # QUANTIFIERS
    CPLToken("∀",   "FORALL",      0x2010, 1, "LOGIC",    None, None, "for all / universal"),
    CPLToken("∃",   "EXISTS",      0x2011, 1, "LOGIC",    None, None, "there exists / existential"),
    CPLToken("∄",   "NEXISTS",     0x2012, 1, "LOGIC",    None, None, "there does not exist"),
    CPLToken("∈",   "IN",          0x2013, 2, "LOGIC",    None, None, "element of / belongs to"),
    CPLToken("∉",   "NOTIN",       0x2014, 2, "LOGIC",    None, None, "not element of"),
    CPLToken("⊂",   "SUBSET",      0x2015, 2, "LOGIC",    None, None, "strict subset of"),
    CPLToken("⊆",   "SUBSETEQ",    0x2016, 2, "LOGIC",    None, None, "subset or equal"),
    CPLToken("∩",   "INTER",       0x2017, 2, "LOGIC",    None, None, "intersection"),
    CPLToken("∪",   "UNION",       0x2018, 2, "LOGIC",    None, None, "union"),

    # MATHEMATICAL / PHI
    CPLToken("φ",   "PHI",         0x2020, 0, "SPACE",    None, None, "golden ratio φ ≈ 1.618"),
    CPLToken("Φ",   "PHI_UPPER",   0x2021, 0, "SPACE",    None, None, "phi (uppercase) / organism beat"),
    CPLToken("∞",   "INFIN",       0x2022, 0, "TIME",     None, None, "infinity / eternal"),
    CPLToken("Δ",   "DELTA",       0x2023, 0, "SPACE",    None, None, "change / difference"),
    CPLToken("Σ",   "SIGMA",       0x2024, 1, "LOGIC",    None, None, "sum over / accumulate"),
    CPLToken("Π",   "PI_OP",       0x2025, 1, "LOGIC",    None, None, "product over"),
    CPLToken("∇",   "NABLA",       0x2026, 1, "SPACE",    None, None, "gradient / descent"),
    CPLToken("∂",   "PARTIAL",     0x2027, 2, "SPACE",    None, None, "partial derivative"),
    CPLToken("≡",   "EQUIV",       0x2028, 2, "LOGIC",    None, None, "identical / definitionally equal"),
    CPLToken("≈",   "APPROX",      0x2029, 2, "LOGIC",    None, None, "approximately equal"),
    CPLToken("≠",   "NEQ",         0x202A, 2, "LOGIC",    None, None, "not equal"),
    CPLToken("ℵ",   "ALEPH",       0x202B, 0, "LOGIC",    None, None, "aleph / cardinality of infinite sets"),

    # FLOW / ORGANISM OPERATORS
    CPLToken("⊗",   "TENSOR",      0x2030, 2, "FLOW",     None, None, "tensor product / deep binding"),
    CPLToken("⊞",   "BIND",        0x2031, 2, "ORGANISM", None, None, "SYN bind / imprint"),
    CPLToken("↑",   "ESCALATE",    0x2032, 1, "ORGANISM", None, None, "escalate / promote"),
    CPLToken("↓",   "REDUCE",      0x2033, 1, "ORGANISM", None, None, "reduce / demote"),
    CPLToken("↻",   "CYCLE",       0x2034, 1, "ORGANISM", None, None, "cycle / repeat"),
    CPLToken("⟳",   "HEARTBEAT",   0x2035, 0, "ORGANISM", None, None, "organism heartbeat (873ms)"),
    CPLToken("✦",   "SOVEREIGN",   0x2036, 0, "ORGANISM", None, None, "sovereign ring marker"),
    CPLToken("⌖",   "NODE",        0x2037, 0, "ORGANISM", None, None, "organism node"),
    CPLToken("⋈",   "JOIN",        0x2038, 2, "ORGANISM", None, None, "join / merge"),
    CPLToken("⊘",   "REVOKE",      0x2039, 1, "ORGANISM", None, None, "revoke / cancel"),

    # CIPHER / ENCRYPTION OPERATORS
    CPLToken("🔐",  "SEAL",        0x2040, 2, "CIPHER",   None, None, "encrypt and sign"),
    CPLToken("🔓",  "OPEN",        0x2041, 2, "CIPHER",   None, None, "verify and decrypt"),
    CPLToken("🔑",  "KEY",         0x2042, 0, "CIPHER",   None, None, "cryptographic key"),
    CPLToken("✍",   "SIGN",        0x2043, 2, "CIPHER",   None, None, "digital signature"),
    CPLToken("👁",   "WITNESS",     0x2044, 1, "CIPHER",   None, None, "witness / verify"),
    CPLToken("🛡",   "SHIELD",      0x2045, 0, "CIPHER",   None, None, "integrity protection"),
]

# ── Master token registry ──────────────────────────────────────────────────────

ALL_TOKENS: list[CPLToken] = LATIN_ROOTS + GREEK_ROOTS + OPERATORS

# Index by glyph (primary lookup)
BY_GLYPH: dict[str, CPLToken] = {t.glyph: t for t in ALL_TOKENS}

# Index by code (for decoding)
BY_CODE: dict[int, CPLToken] = {t.code: t for t in ALL_TOKENS}

# Index by concept name (upper-case)
BY_NAME: dict[str, CPLToken] = {t.name.upper(): t for t in ALL_TOKENS}


def lookup_glyph(glyph: str) -> "CPLToken | None":
    """Find a token by its glyph."""
    return BY_GLYPH.get(glyph)


def lookup_code(code: int) -> "CPLToken | None":
    """Find a token by its 16-bit integer code."""
    return BY_CODE.get(code)


def lookup_name(name: str) -> "CPLToken | None":
    """Find a token by concept name (case-insensitive)."""
    return BY_NAME.get(name.upper())
