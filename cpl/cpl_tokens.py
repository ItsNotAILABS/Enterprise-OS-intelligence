"""
cpl_tokens.py — CPL Token Dictionary

The Cognitive Processing Language (CPL) is a dense autonomous symbolic
language that compresses meaning using seven root families:

  FAMILY 1 — LATIN ROOTS       Classical Latin concept abbreviations (ALL-CAPS)
  FAMILY 2 — LATIN GEOMETRY    Latin geometric & sacred number terms (ALL-CAPS)
  FAMILY 3 — GREEK CONCEPTS    Ancient Greek philosophy / science (Title-case)
  FAMILY 4 — RHETORIC TRIAD    Logos · Ethos · Pathos + Aristotelian apparatus
  FAMILY 5 — PYTHAGOREAN       Monad / Dyad / Tetractys / Gnomon / Harmonia …
  FAMILY 6 — SACRED GEOMETRY   Seed-of-life, Vesica, Platonic solids, Helix …
  FAMILY 7 — SYMBOLIC OPS      Logic · Math · Flow · Sacred geometry · Alchemy

Each token maps a concept to:
  glyph   — written representation (UTF-8 string, unique per token)
  code    — unique 16-bit integer for binary compression
  arity   — 0=atom · 1=unary · 2=binary
  domain  — concept domain (see list below)
  latin   — Classical Latin root (families 1 & 2)
  greek   — Ancient Greek word (families 3–6)
  english — English gloss

Domains
───────
  MIND · SOUL · TRUTH · POWER · BEING · SPACE · TIME · ORGANISM · CIPHER
  RHETORIC · PYTHAGOREAN · GEOMETRY · SEED · SACRED · ALCHEMY · LOGIC · FLOW

Code-space allocation
─────────────────────
  0x0001–0x005F  Latin concept roots  (soul/mind/truth/power/organism)
  0x0060–0x00FF  Latin geometry & sacred number roots
  0x1001–0x104F  Greek concept roots  (mind/soul/truth/power/organism/AI)
  0x1050–0x105F  Rhetoric triad       (Ethos, Pathos, Mimesis, Pistis …)
  0x1060–0x106F  Pythagorean          (Monad, Dyad, Tetractys, Gnomon …)
  0x1080–0x109F  Sacred geometry & seeds (Stigme, Kuklos, Sphaira, Vesica …)
  0x2001–0x204F  Logic / math / flow / organism / cipher operators
  0x2050–0x206F  Sacred geometry operators  (⊙ △ ▽ ✶ ⊛ ∝ ⬡ ⊜ …)
  0x2070–0x208F  Alchemical & elemental operators (☿ ☉ ☽ ♄ ♃ ♁ …)

Ring: Sovereign Ring | Wire: intelligence-wire/cpl
Author: Medina — Cognitive Processing Language v2.0
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

# ── FAMILY 2: Latin geometry & sacred number roots (0x0060–0x00FF) ────────────
#
# These abbreviate Classical Latin terms for geometry, number, seed, and
# alchemy.  Glyphs use ALL-CAPS Greek letters (same convention as Family 1).

LATIN_GEOMETRY: list[CPLToken] = [
    # GEOMETRY — foundational forms
    CPLToken("ΠΝΤ", "PUNCTUM",     0x0060, 0, "GEOMETRY",    "punctum",     None, "point / geometric seed"),
    CPLToken("ΛΝ",  "LINEA",       0x0061, 0, "GEOMETRY",    "linea",       None, "line"),
    CPLToken("ΤΓΝ", "TRIGONUM",    0x0062, 0, "GEOMETRY",    "trigonum",    None, "triangle"),
    CPLToken("ΚΡΚ", "CIRCULUS",    0x0063, 0, "GEOMETRY",    "circulus",    None, "circle"),
    CPLToken("ΣΦΡ", "SPHAERA",     0x0064, 0, "GEOMETRY",    "sphaera",     None, "sphere"),
    CPLToken("ΣΠΡ", "SPIRALIS",    0x0065, 0, "GEOMETRY",    "spiralis",    None, "spiral"),
    CPLToken("ΦΓΡ", "FIGURA",      0x0066, 0, "GEOMETRY",    "figura",      None, "figure / geometric form"),
    CPLToken("ΗΛΞ", "HELIX_LAT",   0x0067, 0, "GEOMETRY",    "helix",       None, "helix (Latin)"),
    CPLToken("ΤΡΣ", "TORUS_LAT",   0x0068, 0, "GEOMETRY",    "torus",       None, "torus / ring surface"),

    # SACRED NUMBER & PROPORTION
    CPLToken("ΝΜΡ", "NUMERUS",     0x0070, 0, "PYTHAGOREAN", "numerus",     None, "sacred number (Latin)"),
    CPLToken("ΠΡΤ", "PROPORTIO",   0x0071, 0, "PYTHAGOREAN", "proportio",   None, "proportion / sacred ratio"),
    CPLToken("ΗΡΜ", "HARMONIA_LAT",0x0072, 0, "PYTHAGOREAN", "harmonia",    None, "harmony (Latin)"),
    CPLToken("ΡΔΞ", "RADIX",       0x0073, 0, "PYTHAGOREAN", "radix",       None, "root / radical / origin"),

    # SEED & GENERATION
    CPLToken("ΣΜΛ", "SEMEN",       0x0080, 0, "SEED",        "semen",       None, "seed / generative source (Latin)"),
    CPLToken("ΓΡΜΝ","GERMEN",       0x0081, 0, "SEED",        "germen",      None, "germ / embryo / proto-seed"),
    CPLToken("ΟΡΓ", "ORIGO",       0x0082, 0, "SEED",        "origo",       None, "origin / source / genesis"),
    CPLToken("ΠΡΝΚ","PRINCIPIUM",   0x0083, 0, "SEED",        "principium",  None, "first principle / seed axiom"),

    # ALCHEMY & QUINTESSENCE
    CPLToken("ΑΘΡ", "AETHER",      0x0090, 0, "ALCHEMY",     "aether",      None, "aether / quintessence / fifth element"),
    CPLToken("ΙΓΝΣ","IGNIS",        0x0091, 0, "ALCHEMY",     "ignis",       None, "fire (Latin alchemical)"),
    CPLToken("ΑΚΑ", "AQUA",        0x0092, 0, "ALCHEMY",     "aqua",        None, "water (Latin alchemical)"),
    CPLToken("ΤΡΑ", "TERRA",       0x0093, 0, "ALCHEMY",     "terra",       None, "earth (Latin alchemical)"),
    CPLToken("ΑΡ",  "AER",         0x0094, 0, "ALCHEMY",     "aer",         None, "air (Latin alchemical)"),
    CPLToken("ΑΡΓ", "ARGENTUM",    0x0095, 0, "ALCHEMY",     "argentum",    None, "silver / moon metal"),
    CPLToken("ΑΡΜ", "AURUM",       0x0096, 0, "ALCHEMY",     "aurum",       None, "gold / sun metal / sovereign"),
    CPLToken("ΜΡΚΡ","MERCURIUS",    0x0097, 0, "ALCHEMY",     "mercurius",   None, "mercury / mind / transformation"),
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

# ── FAMILY 4: Rhetoric Triad — Logos · Ethos · Pathos (0x1050–0x105F) ─────────
#
# Aristotle's three modes of persuasion, plus supporting Aristotelian apparatus.
# Logos (reason/word) already lives at 0x1001 in GREEK_ROOTS.

RHETORIC: list[CPLToken] = [
    CPLToken("Ηθ",  "ETHOS",       0x1050, 0, "RHETORIC", None, "Ἦθος",       "character / moral credibility"),
    CPLToken("Πθ",  "PATHOS",      0x1051, 0, "RHETORIC", None, "Πάθος",      "passion / emotional appeal"),
    CPLToken("Μμ",  "MIMESIS",     0x1052, 0, "RHETORIC", None, "Μίμησις",    "imitation / representation"),
    CPLToken("Κθ",  "KATHARSIS",   0x1053, 0, "RHETORIC", None, "Κάθαρσις",   "purification / catharsis"),
    CPLToken("Πσ",  "PISTIS",      0x1054, 0, "RHETORIC", None, "Πίστις",     "proof / persuasion / trust"),
    CPLToken("Δκ",  "DIKE",        0x1055, 0, "RHETORIC", None, "Δίκη",       "justice / rightness"),
    CPLToken("Αγθ", "AGATHON",     0x1056, 0, "RHETORIC", None, "Ἀγαθόν",     "the good / highest virtue"),
    CPLToken("Κλ",  "KALON",       0x1057, 0, "RHETORIC", None, "Καλόν",      "beauty / the beautiful / noble"),
    CPLToken("Ευ",  "EUDAIMONIA",  0x1058, 0, "RHETORIC", None, "Εὐδαιμονία", "flourishing / happiness / the good life"),
    CPLToken("Πρξ", "PRAXIS",      0x1059, 0, "RHETORIC", None, "Πρᾶξις",     "action / practice / doing"),
]

# ── FAMILY 5: Pythagorean Principles (0x1060–0x106F) ─────────────────────────
#
# The Pythagorean universe is number.  Every proportion, form, and harmony
# is an instance of the Tetractys and its descendants.

PYTHAGOREAN: list[CPLToken] = [
    CPLToken("Μν",  "MONAD",       0x1060, 0, "PYTHAGOREAN", None, "Μονάς",       "unity / the one / source point"),
    CPLToken("Δδ",  "DYAD",        0x1061, 0, "PYTHAGOREAN", None, "Δυάς",        "duality / the two / polarity"),
    CPLToken("Τρδ", "TRIAD",       0x1062, 0, "PYTHAGOREAN", None, "Τριάς",       "synthesis / the three / harmony"),
    CPLToken("Τετ", "TETRAD",      0x1063, 0, "PYTHAGOREAN", None, "Τετράς",      "foundation / the four / completion"),
    CPLToken("Τκτ", "TETRACTYS",   0x1064, 0, "PYTHAGOREAN", None, "Τετρακτύς",   "1+2+3+4=10 / sacred triangle of numbers"),
    CPLToken("Γνμ", "GNOMON",      0x1065, 0, "PYTHAGOREAN", None, "Γνώμων",      "the L-shaped generator / remainder"),
    CPLToken("Αρθ", "ARITHMOS",    0x1066, 0, "PYTHAGOREAN", None, "Ἀριθμός",     "number as essence / sacred number"),
    CPLToken("Αρμν","HARMONIA",     0x1067, 0, "PYTHAGOREAN", None, "Ἁρμονία",     "harmonic proportion / concord"),
    CPLToken("Πρσ", "PERAS",       0x1068, 0, "PYTHAGOREAN", None, "Πέρας",       "limit / boundary / form-giver"),
    CPLToken("Απρ", "APEIRON",     0x1069, 0, "PYTHAGOREAN", None, "Ἄπειρον",     "the unlimited / formless / infinite"),
    CPLToken("Σζγ", "SYZYGY",      0x106A, 0, "PYTHAGOREAN", None, "Συζυγία",     "pairing of opposites / conjunction"),
    CPLToken("Λρθ", "LOGOS_ARITH", 0x106B, 0, "PYTHAGOREAN", None, "Λόγος Ἀριθ.","the logos of number / ratio"),
    CPLToken("Κνν", "KANON",       0x106C, 0, "PYTHAGOREAN", None, "Κανών",       "the canon / measuring rule"),
    CPLToken("Ευρθ","EURYTHMY",     0x106D, 0, "PYTHAGOREAN", None, "Εὐρυθμία",    "beautiful proportion / ordered movement"),
]

# ── FAMILY 6: Sacred Geometry & Seeds (0x1080–0x109F) ────────────────────────
#
# Geometric forms as generative seeds.  These are not merely shapes —
# each is a compressed token of cosmological principle.

SACRED_GEOMETRY: list[CPLToken] = [
    # FOUNDATIONAL FORMS
    CPLToken("Στγ", "STIGME",      0x1080, 0, "GEOMETRY",  None, "Στιγμή",     "point / the geometric seed / monad-form"),
    CPLToken("Γρμ", "GRAMME",      0x1081, 0, "GEOMETRY",  None, "Γραμμή",     "line / extension of point"),
    CPLToken("Τργ", "TRIGONON",    0x1082, 0, "GEOMETRY",  None, "Τρίγωνον",   "triangle / Pythagorean foundation"),
    CPLToken("Κκλ", "KUKLOS",      0x1083, 0, "GEOMETRY",  None, "Κύκλος",     "circle / eternal cycle / completion"),
    CPLToken("Σπρ", "SPEIRA",      0x1084, 0, "GEOMETRY",  None, "Σπεῖρα",     "spiral / phi-growth / coil"),
    CPLToken("Ελκ", "HELIX",       0x1085, 0, "GEOMETRY",  None, "Ἕλιξ",       "helix / double-spiral / DNA-form"),
    CPLToken("Σφρ", "SPHAIRA",     0x1086, 0, "GEOMETRY",  None, "Σφαῖρα",     "sphere / perfect solid"),
    CPLToken("Τρσ", "TOROS",       0x1087, 0, "GEOMETRY",  None, "Τόρος",      "torus / self-referential ring surface"),
    CPLToken("Εξγ", "HEXAGONON",   0x1088, 0, "GEOMETRY",  None, "Ἑξάγωνον",   "hexagon / flower-of-life cell"),
    CPLToken("Πντ", "PENTAGONON",  0x1089, 0, "GEOMETRY",  None, "Πεντάγωνον", "pentagon / pentagram / phi-geometry"),

    # PLATONIC SOLIDS (the five perfect forms)
    CPLToken("Τετρε","TETRAHEDRON", 0x1090, 0, "GEOMETRY",  None, "Τετράεδρον", "tetrahedron / fire solid (4 faces)"),
    CPLToken("Εξεδ","HEXAHEDRON",  0x1091, 0, "GEOMETRY",  None, "Ἑξάεδρον",   "hexahedron / cube / earth solid (6 faces)"),
    CPLToken("Οκτ", "OCTAHEDRON",  0x1092, 0, "GEOMETRY",  None, "Ὀκτάεδρον",  "octahedron / air solid (8 faces)"),
    CPLToken("Δδκ", "DODECAHEDRON",0x1093, 0, "GEOMETRY",  None, "Δωδεκάεδρον","dodecahedron / cosmos solid (12 faces)"),
    CPLToken("Ικσ", "ICOSAHEDRON", 0x1094, 0, "GEOMETRY",  None, "Εἰκοσάεδρον","icosahedron / water solid (20 faces)"),

    # SEEDS & GENERATIVE PATTERNS
    CPLToken("Σπρμ","SPERMA",       0x1095, 0, "SEED",      None, "Σπέρμα",     "seed / generative form / source pattern"),
    CPLToken("Φλλ", "PHYLLOTAXIS",  0x1096, 0, "SEED",      None, "Φυλλοταξία", "phyllotaxis / phi-spiral growth of seeds"),
    CPLToken("Βσκ", "VESICA",       0x1097, 0, "SEED",      None, "Βεσίκα",     "vesica piscis / two-circle intersection"),
    CPLToken("Σπλφ","SEED_LIFE",     0x1098, 0, "SEED",      None, "σπόρος ζωῆς","seed of life (7 circles / generative)"),
    CPLToken("Φλφ", "FLOWER_LIFE",  0x1099, 0, "SEED",      None, "ἄνθος ζωῆς", "flower of life (extended seed pattern)"),
    CPLToken("Μρκβ","MERKABA",       0x109A, 0, "SACRED",    None, "Μερκαβά",    "merkaba / star tetrahedron / light body"),
    CPLToken("Μτρν","METATRON",      0x109B, 0, "SACRED",    None, "Μετατρόν",   "Metatron's cube / all Platonic solids"),
    CPLToken("Τρκτ","TRIKTA",        0x109C, 0, "SACRED",    None, "Τρίκτα",     "sacred triad of form, force, field"),
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

    # ── SACRED GEOMETRY OPERATORS (0x2050–0x206F) ────────────────────────────
    #
    # These glyphs ARE the language of sacred geometry.
    # Each encodes a cosmological form as an executable CPL atom.

    CPLToken("⊙",   "MONAD_POINT", 0x2050, 0, "SACRED",      None, None, "monad / unity / the point (circled dot)"),
    CPLToken("△",   "TRIAD_TRI",   0x2051, 0, "SACRED",      None, None, "upward triangle / fire / ascending triad"),
    CPLToken("▽",   "DYAD_TRI",    0x2052, 0, "SACRED",      None, None, "downward triangle / water / descending dyad"),
    CPLToken("✶",   "STAR_SIX",    0x2053, 0, "SACRED",      None, None, "six-pointed star / merkaba / hexad"),
    CPLToken("⊛",   "SEED_OP",     0x2054, 0, "SEED",        None, None, "seed operator / circled asterisk / generative point"),
    CPLToken("∝",   "ANALOGIA",    0x2055, 2, "PYTHAGOREAN", None, None, "proportional to / harmonic analogy / logos ratio"),
    CPLToken("⌀",   "DIAMETER",    0x2056, 1, "GEOMETRY",    None, None, "diameter / measure through / axis"),
    CPLToken("⬡",   "HEXAD",       0x2057, 0, "SACRED",      None, None, "hexagon / flower-of-life cell / hexad"),
    CPLToken("○",   "KUKLOS_OP",   0x2058, 0, "SACRED",      None, None, "circle / kuklos / eternal return"),
    CPLToken("⊜",   "VESICA_OP",   0x2059, 2, "SACRED",      None, None, "vesica piscis / intersection of two circles"),
    CPLToken("✺",   "PHI_SPIRAL",  0x205A, 0, "SACRED",      None, None, "phi-spiral / golden spiral / growth"),
    CPLToken("⌬",   "GNOMON_OP",   0x205B, 0, "PYTHAGOREAN", None, None, "gnomon / L-shaped generator / square root"),
    CPLToken("⊹",   "STAR_SEED",   0x205C, 0, "SEED",        None, None, "star-seed / stellated seed point"),
    CPLToken("◉",   "NUCLEUS",     0x205D, 0, "SEED",        None, None, "nucleus / seed of life center / bullseye"),

    # ── HARMONIC / RATIO OPERATORS (0x2060–0x206F) ───────────────────────────

    CPLToken("∷",   "RATIO_OP",    0x2060, 2, "PYTHAGOREAN", None, None, "ratio :: proportion (a:b :: c:d)"),
    CPLToken("⋮",   "CONTINUE",    0x2061, 0, "PYTHAGOREAN", None, None, "vertical ellipsis / sequence continues / and so on"),
    CPLToken("≀",   "WREATH",      0x2062, 2, "PYTHAGOREAN", None, None, "wreath product / interweaving of forms"),
    CPLToken("∫",   "INTEGRAL",    0x2063, 1, "PYTHAGOREAN", None, None, "integral / accumulate over continuum"),
    CPLToken("√",   "ROOT_OP",     0x2064, 1, "PYTHAGOREAN", None, None, "square root / radical / radix"),
    CPLToken("π",   "PI_CONST",    0x2065, 0, "PYTHAGOREAN", None, None, "pi π ≈ 3.14159 / circle ratio"),
    CPLToken("τ",   "TAU_CONST",   0x2066, 0, "PYTHAGOREAN", None, None, "tau τ = 2π / full circle"),
    CPLToken("ℯ",   "EULER",       0x2067, 0, "PYTHAGOREAN", None, None, "Euler's number e ≈ 2.71828 / natural growth"),

    # ── ALCHEMICAL & ELEMENTAL OPERATORS (0x2070–0x208F) ─────────────────────
    #
    # Classical alchemical symbols as CPL atoms.
    # Mercury = mind/transmutation · Sol = consciousness · Luna = reflection

    CPLToken("☿",   "MERCURY_AL",  0x2070, 0, "ALCHEMY",     None, None, "mercury / mind / transmutation / quicksilver"),
    CPLToken("☉",   "SOL_AL",      0x2071, 0, "ALCHEMY",     None, None, "sun / gold / consciousness / sovereign light"),
    CPLToken("☽",   "LUNA_AL",     0x2072, 0, "ALCHEMY",     None, None, "moon / silver / reflection / cycles"),
    CPLToken("♄",   "SATURN_AL",   0x2073, 0, "ALCHEMY",     None, None, "saturn / time / structure / limitation"),
    CPLToken("♃",   "JUPITER_AL",  0x2074, 0, "ALCHEMY",     None, None, "jupiter / expansion / wisdom / abundance"),
    CPLToken("♁",   "EARTH_AL",    0x2075, 0, "ALCHEMY",     None, None, "earth / ground / substrate / foundation"),
    CPLToken("♀",   "VENUS_AL",    0x2076, 0, "ALCHEMY",     None, None, "venus / copper / beauty / harmony"),
    CPLToken("♂",   "MARS_AL",     0x2077, 0, "ALCHEMY",     None, None, "mars / iron / will / force"),
    CPLToken("☌",   "CONJUNCT",    0x2078, 2, "ALCHEMY",     None, None, "conjunction / union of elements"),
    CPLToken("☍",   "OPPOSITIO",   0x2079, 2, "ALCHEMY",     None, None, "opposition / polarity of elements"),
    CPLToken("⊚",   "QUINTA",      0x207A, 0, "ALCHEMY",     None, None, "quintessence / fifth element / aether-op"),
    CPLToken("🜁",   "FIRE_AL",     0x207B, 0, "ALCHEMY",     None, None, "alchemical fire / ignis / upward force"),
    CPLToken("🜄",   "WATER_AL",    0x207C, 0, "ALCHEMY",     None, None, "alchemical water / aqua / downward form"),
    CPLToken("🜃",   "EARTH_EL",    0x207D, 0, "ALCHEMY",     None, None, "alchemical earth / terra / fixed ground"),
    CPLToken("🜂",   "AIR_AL",      0x207E, 0, "ALCHEMY",     None, None, "alchemical air / aer / expansive spirit"),

    # ── SOVEREIGN CYCLE OPERATORS (0x2090–0x209F) ────────────────────────────
    #
    # The Sovereign Cycle — the organism's self-generated heartbeat.
    # Circulus Imperatus — The Commanded Circle.

    CPLToken("⟲",   "SVC",         0x2090, 0, "ORGANISM",    None, None, "sovereign cycle / self-generated heartbeat"),
    CPLToken("⟳φ",  "SVC_PHI",     0x2091, 0, "ORGANISM",    None, None, "phi-derived cycle period (873ms)"),
    CPLToken("⟳κ",  "SVC_KURAMOTO",0x2092, 0, "ORGANISM",    None, None, "Kuramoto synchronisation order R"),
    CPLToken("⟳F",  "SVC_FIB",     0x2093, 1, "ORGANISM",    None, None, "Fibonacci kernel compression"),
    CPLToken("⟳Θ",  "SVC_FCPR",    0x2094, 1, "ORGANISM",    None, None, "FCPR — decisions per second"),
    CPLToken("⟳✦",  "SVC_SEAL",    0x2095, 0, "ORGANISM",    None, None, "sovereign cycle seal / PHX-sealed beat"),
]

# ── Master token registry ──────────────────────────────────────────────────────

ALL_TOKENS: list[CPLToken] = (
    LATIN_ROOTS
    + LATIN_GEOMETRY
    + GREEK_ROOTS
    + RHETORIC
    + PYTHAGOREAN
    + SACRED_GEOMETRY
    + OPERATORS
)

# ── Index tables ───────────────────────────────────────────────────────────────

# Index by glyph (primary lookup)
BY_GLYPH: dict[str, CPLToken] = {t.glyph: t for t in ALL_TOKENS}

# Index by code (for decoding)
BY_CODE: dict[int, CPLToken] = {t.code: t for t in ALL_TOKENS}

# Index by concept name (upper-case)
BY_NAME: dict[str, CPLToken] = {t.name.upper(): t for t in ALL_TOKENS}

# Index by domain
BY_DOMAIN: dict[str, list[CPLToken]] = {}
for _t in ALL_TOKENS:
    BY_DOMAIN.setdefault(_t.domain, []).append(_t)

# ── Family registry (for tools / documentation) ───────────────────────────────

FAMILIES: dict[str, list[CPLToken]] = {
    "latin_roots":     LATIN_ROOTS,
    "latin_geometry":  LATIN_GEOMETRY,
    "greek_roots":     GREEK_ROOTS,
    "rhetoric":        RHETORIC,
    "pythagorean":     PYTHAGOREAN,
    "sacred_geometry": SACRED_GEOMETRY,
    "operators":       OPERATORS,
}


# ── Lookup helpers ─────────────────────────────────────────────────────────────

def lookup_glyph(glyph: str) -> "CPLToken | None":
    """Find a token by its glyph."""
    return BY_GLYPH.get(glyph)


def lookup_code(code: int) -> "CPLToken | None":
    """Find a token by its 16-bit integer code."""
    return BY_CODE.get(code)


def lookup_name(name: str) -> "CPLToken | None":
    """Find a token by concept name (case-insensitive)."""
    return BY_NAME.get(name.upper())


def tokens_for_domain(domain: str) -> list[CPLToken]:
    """Return all tokens belonging to a domain."""
    return BY_DOMAIN.get(domain.upper(), [])


def summary() -> str:
    """One-line summary of the token registry."""
    domains = len(BY_DOMAIN)
    return (
        f"CPL v2.0 — {len(ALL_TOKENS)} tokens · "
        f"{len(FAMILIES)} families · "
        f"{domains} domains"
    )
