"""
test_cpl.py — CPL test suite (v3.0)

Tests for:
  - cpl_tokens   : token dictionary, all 7 families, lookups, domains
  - cpl_lexer    : tokenisation, parsing, AST
  - cpl_encoder  : binary encode/decode, roundtrip
  - cpl_vm       : expression evaluation, Pythagorean constants, sacred geometry
  - cpl_registry : official language/structure codenames, 16-language grid
  - blockbox     : QFB, SHL, QFC, PHXChain, phi-expansion
  - cpl_bridge   : CPLBridge polyglot emission, synopsis, query call

Run with: pytest test_cpl.py -v
"""

from __future__ import annotations

import pytest

from cpl_tokens import (
    ALL_TOKENS, BY_GLYPH, BY_CODE, BY_NAME, BY_DOMAIN, FAMILIES,
    LATIN_ROOTS, LATIN_GEOMETRY, GREEK_ROOTS,
    RHETORIC, PYTHAGOREAN, SACRED_GEOMETRY, OPERATORS,
    lookup_glyph, lookup_code, lookup_name, tokens_for_domain, summary,
    CPLToken,
)
from cpl_lexer import (
    CPLLexer, CPLParser, tokenise, parse, format_ast,
    AtomNode, LiteralNode, UnaryNode, BinaryNode,
    CallNode, GroupNode, QuantifierNode, SequenceNode,
)
from cpl_encoder import (
    CPLEncoder, CPLDecoder, encode, decode, roundtrip, compression_ratio
)
from cpl_vm import (
    CPLVM, Environment, TruthValue, ConceptValue,
    NumberValue, SymbolValue, BindingValue,
    _TRUE, _FALSE, _UNK,
)


# ═══════════════════════════════════════════════════════════════════════════════
# TOKEN DICTIONARY TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestTokenDictionary:

    def test_all_tokens_have_unique_codes(self):
        codes = [t.code for t in ALL_TOKENS]
        assert len(codes) == len(set(codes)), "Token codes must be unique"

    def test_all_tokens_have_unique_glyphs(self):
        glyphs = [t.glyph for t in ALL_TOKENS]
        assert len(glyphs) == len(set(glyphs)), "Glyphs must be unique"

    def test_latin_roots_in_correct_code_range(self):
        for tok in LATIN_ROOTS:
            assert 0x0001 <= tok.code <= 0x0FFF, f"{tok.glyph} code {tok.code:#06x} out of Latin range"

    def test_greek_roots_in_correct_code_range(self):
        for tok in GREEK_ROOTS:
            assert 0x1000 <= tok.code <= 0x1FFF, f"{tok.glyph} code {tok.code:#06x} out of Greek range"

    def test_operators_in_correct_code_range(self):
        for tok in OPERATORS:
            assert 0x2000 <= tok.code <= 0x2FFF, f"{tok.glyph} code {tok.code:#06x} out of Operator range"

    def test_lookup_glyph_found(self):
        assert lookup_glyph("Λγ") is not None
        assert lookup_glyph("∧") is not None
        assert lookup_glyph("Ψχ") is not None

    def test_lookup_glyph_not_found(self):
        assert lookup_glyph("XYZ_NONEXISTENT") is None

    def test_lookup_code_found(self):
        assert lookup_code(0x2001) is not None  # ∧
        assert lookup_code(0x1001) is not None  # Λγ (LOGOS)

    def test_lookup_name_case_insensitive(self):
        tok = lookup_name("logos")
        assert tok is not None
        assert tok.name == "LOGOS"

    def test_every_token_has_english(self):
        for tok in ALL_TOKENS:
            assert tok.english, f"Token {tok.glyph} missing english gloss"

    def test_by_glyph_index_complete(self):
        assert len(BY_GLYPH) == len(ALL_TOKENS)

    def test_by_code_index_complete(self):
        assert len(BY_CODE) == len(ALL_TOKENS)

    def test_phi_glyph_code(self):
        phi = lookup_glyph("φ")
        assert phi is not None
        assert phi.name == "PHI"

    def test_implies_operator(self):
        implies = lookup_glyph("→")
        assert implies is not None
        assert implies.name == "IMPLIES"

    def test_logical_and_arity(self):
        tok = lookup_glyph("∧")
        assert tok.arity == 2

    def test_unary_not_arity(self):
        tok = lookup_glyph("¬")
        assert tok.arity == 1

    def test_atom_arity(self):
        tok = lookup_glyph("Λγ")
        assert tok.arity == 0

    def test_domain_is_set(self):
        for tok in ALL_TOKENS:
            assert tok.domain, f"Token {tok.glyph} has empty domain"


# ═══════════════════════════════════════════════════════════════════════════════
# LEXER TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestLexer:

    def test_tokenise_simple(self):
        tokens = tokenise("Λγ ∧ Νσ")
        kinds  = [t.kind for t in tokens if t.kind != "EOF"]
        assert kinds == ["GLYPH", "GLYPH", "GLYPH"]

    def test_tokenise_implication(self):
        tokens = tokenise("Λγ → Φρ")
        glyphs = [t.token.glyph for t in tokens if t.kind == "GLYPH"]
        assert "→" in glyphs

    def test_tokenise_parens(self):
        tokens = tokenise("(Λγ ∧ Νσ)")
        kinds  = [t.kind for t in tokens if t.kind != "EOF"]
        assert "LPAREN" in kinds
        assert "RPAREN" in kinds

    def test_tokenise_literal_word(self):
        tokens = tokenise("HEART")
        lit = [t for t in tokens if t.kind == "GLYPH" and t.value == "HEART"]
        # HEART is an unknown word → LITERAL
        lits = [t for t in tokens if t.kind == "LITERAL"]
        assert lits or lit  # either resolved or kept as literal

    def test_tokenise_quantifier_colon(self):
        tokens = tokenise("∀ x: Λγ")
        kinds  = [t.kind for t in tokens if t.kind != "EOF"]
        assert "COLON" in kinds

    def test_tokenise_comma(self):
        tokens = tokenise("Συ(Λγ, Νσ)")
        kinds  = [t.kind for t in tokens if t.kind != "EOF"]
        assert "COMMA" in kinds

    def test_tokenise_greek_glyph(self):
        tokens = tokenise("Ψχ")
        glyph_tokens = [t for t in tokens if t.kind == "GLYPH"]
        assert len(glyph_tokens) == 1
        assert glyph_tokens[0].token.glyph == "Ψχ"

    def test_tokenise_all_logic_ops(self):
        src = "⊤ ∧ ¬ ⊥ ∨ → ↔ ⊕"
        tokens = tokenise(src)
        glyphs = {t.token.glyph for t in tokens if t.kind == "GLYPH"}
        assert "∧" in glyphs
        assert "¬" in glyphs
        assert "∨" in glyphs

    def test_tokenise_phi_constant(self):
        tokens = tokenise("φ ≈ Φ")
        glyphs = [t.token.glyph for t in tokens if t.kind == "GLYPH"]
        assert "φ" in glyphs

    def test_eof_always_present(self):
        tokens = tokenise("")
        assert tokens[-1].kind == "EOF"

    def test_eof_non_empty(self):
        tokens = tokenise("Λγ")
        assert tokens[-1].kind == "EOF"


# ═══════════════════════════════════════════════════════════════════════════════
# PARSER TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestParser:

    def test_parse_atom(self):
        ast = parse("Λγ")
        assert isinstance(ast, AtomNode)
        assert ast.token.glyph == "Λγ"

    def test_parse_binary_and(self):
        ast = parse("Λγ ∧ Νσ")
        assert isinstance(ast, BinaryNode)
        assert ast.operator.glyph == "∧"

    def test_parse_binary_implies(self):
        ast = parse("Νσ → Φρ")
        assert isinstance(ast, BinaryNode)
        assert ast.operator.glyph == "→"

    def test_parse_unary_not(self):
        ast = parse("¬ Αθ")
        assert isinstance(ast, UnaryNode)
        assert ast.operator.glyph == "¬"

    def test_parse_group(self):
        ast = parse("(Λγ ∧ Νσ)")
        assert isinstance(ast, GroupNode)

    def test_parse_call(self):
        ast = parse("Συ(Λγ, Νσ)")
        assert isinstance(ast, CallNode)
        assert ast.callee.glyph == "Συ"
        assert len(ast.arguments) == 2

    def test_parse_quantifier_forall(self):
        ast = parse("∀ x: Λγ")
        assert isinstance(ast, QuantifierNode)
        assert ast.quantifier.glyph == "∀"
        assert ast.variable == "x"

    def test_parse_quantifier_exists(self):
        ast = parse("∃ x: Ψχ")
        assert isinstance(ast, QuantifierNode)
        assert ast.quantifier.glyph == "∃"

    def test_parse_nested_binary(self):
        ast = parse("Λγ ∧ Νσ → Φρ")
        # → has lower precedence than ∧, so: (Λγ ∧ Νσ) → Φρ
        assert isinstance(ast, BinaryNode)
        assert ast.operator.glyph == "→"

    def test_parse_sequence(self):
        ast = parse("Λγ Νσ Φρ")
        assert isinstance(ast, SequenceNode)
        assert len(ast.nodes) == 3

    def test_format_ast_produces_string(self):
        ast = parse("Λγ ∧ Νσ → Φρ")
        s = format_ast(ast)
        assert isinstance(s, str)
        assert len(s) > 0

    def test_format_ast_contains_operator(self):
        ast = parse("Λγ ∧ Νσ")
        s = format_ast(ast)
        assert "∧" in s or "conjunction" in s.lower() or "BINARY" in s

    def test_str_atom(self):
        ast = parse("Λγ")
        assert "Λγ" in str(ast)

    def test_str_binary(self):
        ast = parse("Λγ ∧ Νσ")
        s = str(ast)
        assert "Λγ" in s
        assert "∧" in s
        assert "Νσ" in s


# ═══════════════════════════════════════════════════════════════════════════════
# ENCODER / DECODER TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestEncoder:

    def test_encode_returns_bytes(self):
        assert isinstance(encode("Λγ ∧ Νσ"), bytes)

    def test_encode_has_magic_header(self):
        data = encode("Λγ")
        assert data[0] == 0xC0
        assert data[1] == 0xA1
        assert data[2] == 0x01  # version

    def test_encode_then_decode_simple(self):
        src = "Λγ ∧ Νσ"
        decoded = roundtrip(src)
        # Decoded must contain the original glyphs
        assert "Λγ" in decoded
        assert "∧" in decoded
        assert "Νσ" in decoded

    def test_encode_then_decode_implication(self):
        src = "Λγ → Φρ"
        decoded = roundtrip(src)
        assert "Λγ" in decoded
        assert "→" in decoded

    def test_encode_then_decode_not(self):
        src = "¬ Αθ"
        decoded = roundtrip(src)
        assert "¬" in decoded

    def test_encode_then_decode_phi(self):
        src = "φ ∧ Φ"
        decoded = roundtrip(src)
        assert "φ" in decoded

    def test_encode_then_decode_parens(self):
        src = "(Λγ ∧ Νσ)"
        decoded = roundtrip(src)
        assert "(" in decoded
        assert ")" in decoded

    def test_encode_empty_string(self):
        data = encode("")
        assert len(data) == 4  # header only

    def test_decode_invalid_magic_raises(self):
        with pytest.raises(ValueError, match="magic"):
            decode(b"\x00\x00\x00\x00")

    def test_decode_too_short_raises(self):
        with pytest.raises(ValueError):
            decode(b"\x01\x02")

    def test_compression_ratio_type(self):
        src = "Λγ ∧ Νσ → Φρ"
        data = encode(src)
        ratio = compression_ratio(src, data)
        assert isinstance(ratio, float)

    def test_batch_encode_decode(self):
        enc = CPLEncoder()
        dec = CPLDecoder()
        exprs = ["Λγ ∧ Νσ", "¬ Αθ → Ψδ"]
        batch = enc.encode_batch(exprs)
        assert isinstance(batch, bytes)

    def test_encode_logical_and_produces_correct_code(self):
        import struct
        data = encode("∧")
        # body starts at byte 4, first word = code of ∧ = 0x2001
        code = struct.unpack(">H", data[4:6])[0]
        assert code == 0x2001, f"Expected 0x2001 for ∧, got {code:#06x}"

    def test_encode_implies_operator(self):
        import struct
        data = encode("→")
        code = struct.unpack(">H", data[4:6])[0]
        assert code == 0x2004  # → = 0x2004


# ═══════════════════════════════════════════════════════════════════════════════
# VM EVALUATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestVM:

    def test_eval_true_atom(self):
        vm  = CPLVM()
        val = vm.eval_source("⊤")
        assert isinstance(val, TruthValue)
        assert val.value is True

    def test_eval_false_atom(self):
        vm  = CPLVM()
        val = vm.eval_source("⊥")
        assert isinstance(val, TruthValue)
        assert val.value is False

    def test_eval_true_and_true(self):
        vm  = CPLVM()
        val = vm.eval_source("⊤ ∧ ⊤")
        assert isinstance(val, TruthValue)
        assert val.value is True

    def test_eval_true_and_false(self):
        vm  = CPLVM()
        val = vm.eval_source("⊤ ∧ ⊥")
        assert isinstance(val, TruthValue)
        assert val.value is False

    def test_eval_false_or_true(self):
        vm  = CPLVM()
        val = vm.eval_source("⊥ ∨ ⊤")
        assert isinstance(val, TruthValue)
        assert val.value is True

    def test_eval_not_true(self):
        vm  = CPLVM()
        val = vm.eval_source("¬ ⊤")
        assert isinstance(val, TruthValue)
        assert val.value is False

    def test_eval_not_false(self):
        vm  = CPLVM()
        val = vm.eval_source("¬ ⊥")
        assert isinstance(val, TruthValue)
        assert val.value is True

    def test_eval_false_implies_anything(self):
        vm  = CPLVM()
        val = vm.eval_source("⊥ → ⊥")
        assert isinstance(val, TruthValue)
        assert val.value is True

    def test_eval_true_implies_true(self):
        vm  = CPLVM()
        val = vm.eval_source("⊤ → ⊤")
        assert isinstance(val, TruthValue)
        assert val.value is True

    def test_eval_true_implies_false(self):
        vm  = CPLVM()
        val = vm.eval_source("⊤ → ⊥")
        assert isinstance(val, TruthValue)
        assert val.value is False

    def test_eval_concept_atom(self):
        vm  = CPLVM()
        val = vm.eval_source("Λγ")
        assert isinstance(val, ConceptValue)
        assert val.token.glyph == "Λγ"

    def test_eval_phi_constant(self):
        vm  = CPLVM()
        val = vm.eval_source("φ")
        assert isinstance(val, NumberValue)
        assert abs(val.value - 1.618033988749895) < 1e-10

    def test_eval_heartbeat_constant(self):
        vm  = CPLVM()
        val = vm.eval_source("⟳")
        assert isinstance(val, NumberValue)
        assert val.value == 873.0

    def test_eval_bind_operator(self):
        vm  = CPLVM()
        val = vm.eval_source("Λγ ⊞ ⊤")
        assert isinstance(val, BindingValue)
        assert val.label == "Λγ"

    def test_eval_bound_value_resolves(self):
        vm = CPLVM()
        vm.bind("Λγ", _TRUE)
        val = vm.eval_source("Λγ")
        assert isinstance(val, TruthValue)
        assert val.value is True

    def test_eval_forall_quantifier(self):
        vm  = CPLVM()
        # ∀ x: ⊤ → ⊤ should be True
        val = vm.eval_source("∀ x: ⊤")
        assert isinstance(val, TruthValue)
        assert val.value is True

    def test_eval_not_not_is_identity(self):
        vm = CPLVM()
        assert vm.eval_source("¬ ¬ ⊤").value is True
        assert vm.eval_source("¬ ¬ ⊥").value is False

    def test_eval_biconditional_true_true(self):
        vm  = CPLVM()
        val = vm.eval_source("⊤ ↔ ⊤")
        assert val.value is True

    def test_eval_biconditional_true_false(self):
        vm  = CPLVM()
        val = vm.eval_source("⊤ ↔ ⊥")
        assert val.value is False

    def test_eval_sequence_returns_last(self):
        vm  = CPLVM()
        val = vm.eval_source("Λγ Νσ ⊤")
        assert isinstance(val, TruthValue)
        assert val.value is True

    def test_eval_synthesis_call(self):
        vm  = CPLVM()
        val = vm.eval_source("Συ(Λγ, Νσ)")
        assert isinstance(val, SymbolValue)
        assert "Λγ" in str(val) or "Συ" in str(val)

    def test_environment_child_scope(self):
        env   = Environment()
        child = env.child()
        child.set("X", _TRUE)
        assert child.get("X").value is True
        assert env.get("X") is None

    def test_environment_revoke(self):
        env = Environment()
        env.set("X", _TRUE)
        env.revoke("X")
        assert env.get("X") is None

    def test_vm_trace_populated(self):
        vm = CPLVM()
        vm.eval_source("Λγ ∧ Νσ")
        assert len(vm.trace) > 0

    def test_vm_reset_trace(self):
        vm = CPLVM()
        vm.eval_source("Λγ")
        vm.reset_trace()
        assert vm.trace == []

    def test_vm_environment_summary(self):
        vm = CPLVM()
        vm.bind("Λγ", _TRUE)
        summary = vm.environment_summary()
        assert "Λγ" in summary


# ═══════════════════════════════════════════════════════════════════════════════
# LATIN GEOMETRY FAMILY TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestLatinGeometry:

    def test_family_is_nonempty(self):
        assert len(LATIN_GEOMETRY) > 0

    def test_all_codes_in_range(self):
        for tok in LATIN_GEOMETRY:
            assert 0x0060 <= tok.code <= 0x00FF, \
                f"{tok.name} code {tok.code:#06x} out of Latin-Geometry range"

    def test_all_glyphs_uppercase(self):
        # Latin geometry glyphs use ALL-CAPS Greek letters (same convention as LATIN_ROOTS)
        for tok in LATIN_GEOMETRY:
            assert tok.glyph == tok.glyph.upper(), \
                f"{tok.name} glyph '{tok.glyph}' should be all-caps"

    def test_punctum_is_point(self):
        tok = lookup_name("PUNCTUM")
        assert tok is not None
        assert tok.domain == "GEOMETRY"
        assert "point" in tok.english.lower()

    def test_semen_is_seed(self):
        tok = lookup_name("SEMEN")
        assert tok is not None
        assert tok.domain == "SEED"
        assert "seed" in tok.english.lower()

    def test_aether_is_alchemy(self):
        tok = lookup_name("AETHER")
        assert tok is not None
        assert tok.domain == "ALCHEMY"

    def test_harmonia_lat_is_pythagorean(self):
        tok = lookup_name("HARMONIA_LAT")
        assert tok is not None
        assert tok.domain == "PYTHAGOREAN"

    def test_aurum_is_gold(self):
        tok = lookup_name("AURUM")
        assert tok is not None
        assert "gold" in tok.english.lower()

    def test_all_have_latin_field(self):
        for tok in LATIN_GEOMETRY:
            assert tok.latin is not None, f"{tok.name} missing latin root"


# ═══════════════════════════════════════════════════════════════════════════════
# RHETORIC TRIAD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestRhetoric:

    def test_family_size(self):
        assert len(RHETORIC) >= 5   # at minimum: Ethos, Pathos + 3 more

    def test_all_codes_in_range(self):
        for tok in RHETORIC:
            assert 0x1050 <= tok.code <= 0x105F, \
                f"{tok.name} code {tok.code:#06x} out of Rhetoric range"

    def test_ethos_present(self):
        tok = lookup_name("ETHOS")
        assert tok is not None
        assert tok.domain == "RHETORIC"
        assert "Ἦθος" in (tok.greek or "")

    def test_pathos_present(self):
        tok = lookup_name("PATHOS")
        assert tok is not None
        assert tok.domain == "RHETORIC"
        assert "Πάθος" in (tok.greek or "")

    def test_logos_still_present(self):
        # LOGOS lives in GREEK_ROOTS (0x1001) — the first of the triad
        tok = lookup_name("LOGOS")
        assert tok is not None
        assert tok.code == 0x1001

    def test_rhetoric_triad_complete(self):
        # All three Aristotelian appeals must be in the token registry
        logos  = lookup_name("LOGOS")
        ethos  = lookup_name("ETHOS")
        pathos = lookup_name("PATHOS")
        assert logos  is not None, "LOGOS missing"
        assert ethos  is not None, "ETHOS missing"
        assert pathos is not None, "PATHOS missing"

    def test_eudaimonia_in_rhetoric(self):
        tok = lookup_name("EUDAIMONIA")
        assert tok is not None
        assert "flourishing" in tok.english.lower() or "happiness" in tok.english.lower()

    def test_katharsis_greek_root(self):
        tok = lookup_name("KATHARSIS")
        assert tok is not None
        assert tok.greek is not None

    def test_praxis_is_action(self):
        tok = lookup_name("PRAXIS")
        assert tok is not None
        assert "action" in tok.english.lower()

    def test_all_rhetoric_have_greek(self):
        for tok in RHETORIC:
            assert tok.greek is not None, f"RHETORIC token {tok.name} missing greek field"


# ═══════════════════════════════════════════════════════════════════════════════
# PYTHAGOREAN PRINCIPLES TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestPythagorean:

    def test_family_size(self):
        assert len(PYTHAGOREAN) >= 10

    def test_all_codes_in_range(self):
        for tok in PYTHAGOREAN:
            assert 0x1060 <= tok.code <= 0x106F, \
                f"{tok.name} code {tok.code:#06x} out of Pythagorean range"

    def test_monad_present(self):
        tok = lookup_name("MONAD")
        assert tok is not None
        assert tok.domain == "PYTHAGOREAN"
        assert "unity" in tok.english.lower() or "one" in tok.english.lower()

    def test_dyad_present(self):
        tok = lookup_name("DYAD")
        assert tok is not None

    def test_triad_present(self):
        tok = lookup_name("TRIAD")
        assert tok is not None

    def test_tetractys_present(self):
        tok = lookup_name("TETRACTYS")
        assert tok is not None
        assert "10" in tok.english or "1+2+3+4" in tok.english

    def test_gnomon_present(self):
        tok = lookup_name("GNOMON")
        assert tok is not None

    def test_harmonia_present(self):
        tok = lookup_name("HARMONIA")
        assert tok is not None
        assert "harmoni" in tok.english.lower() or "proportion" in tok.english.lower()

    def test_apeiron_present(self):
        tok = lookup_name("APEIRON")
        assert tok is not None
        assert "unlimited" in tok.english.lower() or "infinite" in tok.english.lower()

    def test_peras_present(self):
        tok = lookup_name("PERAS")
        assert tok is not None
        assert "limit" in tok.english.lower()

    def test_syzygy_present(self):
        tok = lookup_name("SYZYGY")
        assert tok is not None
        assert "pairing" in tok.english.lower() or "conjunction" in tok.english.lower()

    def test_monad_through_tetrad_ordered(self):
        # codes must be sequential: MONAD < DYAD < TRIAD < TETRAD
        m = lookup_name("MONAD").code
        d = lookup_name("DYAD").code
        t = lookup_name("TRIAD").code
        q = lookup_name("TETRAD").code
        assert m < d < t < q

    def test_vm_monad_resolves_to_one(self):
        vm = CPLVM()
        val = vm.eval_source("Μν")
        assert isinstance(val, NumberValue)
        assert val.value == 1.0

    def test_vm_dyad_resolves_to_two(self):
        vm = CPLVM()
        val = vm.eval_source("Δδ")
        assert isinstance(val, NumberValue)
        assert val.value == 2.0

    def test_vm_triad_resolves_to_three(self):
        vm = CPLVM()
        val = vm.eval_source("Τρδ")
        assert isinstance(val, NumberValue)
        assert val.value == 3.0

    def test_vm_tetractys_resolves_to_ten(self):
        vm = CPLVM()
        val = vm.eval_source("Τκτ")
        assert isinstance(val, NumberValue)
        assert val.value == 10.0

    def test_encode_decode_pythagorean(self):
        src = "Μν ∧ Δδ → Τρδ"
        decoded = roundtrip(src)
        assert "Μν" in decoded
        assert "→" in decoded


# ═══════════════════════════════════════════════════════════════════════════════
# SACRED GEOMETRY & SEEDS TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestSacredGeometry:

    def test_family_size(self):
        assert len(SACRED_GEOMETRY) >= 15

    def test_all_codes_in_range(self):
        for tok in SACRED_GEOMETRY:
            assert 0x1080 <= tok.code <= 0x109F, \
                f"{tok.name} code {tok.code:#06x} out of Sacred-Geometry range"

    def test_stigme_is_point(self):
        tok = lookup_name("STIGME")
        assert tok is not None
        assert "point" in tok.english.lower()
        assert tok.domain == "GEOMETRY"

    def test_kuklos_is_circle(self):
        tok = lookup_name("KUKLOS")
        assert tok is not None
        assert "circle" in tok.english.lower()

    def test_sphaira_is_sphere(self):
        tok = lookup_name("SPHAIRA")
        assert tok is not None
        assert "sphere" in tok.english.lower()

    def test_helix_present(self):
        tok = lookup_name("HELIX")
        assert tok is not None
        assert "helix" in tok.english.lower()

    def test_toros_is_torus(self):
        tok = lookup_name("TOROS")
        assert tok is not None
        assert "torus" in tok.english.lower()

    def test_five_platonic_solids_present(self):
        names = ["TETRAHEDRON", "HEXAHEDRON", "OCTAHEDRON", "DODECAHEDRON", "ICOSAHEDRON"]
        for name in names:
            tok = lookup_name(name)
            assert tok is not None, f"Platonic solid {name} missing"

    def test_sperma_is_seed(self):
        tok = lookup_name("SPERMA")
        assert tok is not None
        assert tok.domain == "SEED"
        assert "seed" in tok.english.lower()

    def test_vesica_is_two_circles(self):
        tok = lookup_name("VESICA")
        assert tok is not None
        assert "circle" in tok.english.lower() or "piscis" in tok.english.lower()

    def test_seed_of_life_present(self):
        tok = lookup_name("SEED_LIFE")
        assert tok is not None
        assert tok.domain == "SEED"

    def test_flower_of_life_present(self):
        tok = lookup_name("FLOWER_LIFE")
        assert tok is not None

    def test_merkaba_present(self):
        tok = lookup_name("MERKABA")
        assert tok is not None
        assert "star" in tok.english.lower() or "merkaba" in tok.english.lower()

    def test_metatron_present(self):
        tok = lookup_name("METATRON")
        assert tok is not None
        assert "platonic" in tok.english.lower() or "cube" in tok.english.lower()

    def test_phyllotaxis_phi_growth(self):
        tok = lookup_name("PHYLLOTAXIS")
        assert tok is not None
        assert "phi" in tok.english.lower() or "spiral" in tok.english.lower()

    def test_trigonon_is_triangle(self):
        tok = lookup_name("TRIGONON")
        assert tok is not None
        assert "triangle" in tok.english.lower()

    def test_encode_decode_sacred(self):
        src = "Στγ → Γρμ → Τργ → Κκλ"
        decoded = roundtrip(src)
        assert "Στγ" in decoded
        assert "→" in decoded


# ═══════════════════════════════════════════════════════════════════════════════
# SACRED GEOMETRY OPERATOR TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestSacredOperators:

    def test_monad_point_operator(self):
        tok = lookup_glyph("⊙")
        assert tok is not None
        assert tok.name == "MONAD_POINT"
        assert tok.domain == "SACRED"

    def test_triad_triangle_operator(self):
        tok = lookup_glyph("△")
        assert tok is not None
        assert tok.name == "TRIAD_TRI"

    def test_dyad_inverted_triangle(self):
        tok = lookup_glyph("▽")
        assert tok is not None
        assert tok.name == "DYAD_TRI"

    def test_star_six_merkaba(self):
        tok = lookup_glyph("✶")
        assert tok is not None
        assert tok.name == "STAR_SIX"

    def test_seed_operator(self):
        tok = lookup_glyph("⊛")
        assert tok is not None
        assert tok.name == "SEED_OP"
        assert tok.domain == "SEED"

    def test_analogia_is_proportional(self):
        tok = lookup_glyph("∝")
        assert tok is not None
        assert tok.name == "ANALOGIA"
        assert tok.arity == 2

    def test_hexad_operator(self):
        tok = lookup_glyph("⬡")
        assert tok is not None
        assert tok.name == "HEXAD"

    def test_vesica_operator(self):
        tok = lookup_glyph("⊜")
        assert tok is not None
        assert tok.name == "VESICA_OP"
        assert tok.arity == 2

    def test_pi_constant(self):
        tok = lookup_glyph("π")
        assert tok is not None
        assert tok.name == "PI_CONST"

    def test_tau_constant(self):
        tok = lookup_glyph("τ")
        assert tok is not None
        assert tok.name == "TAU_CONST"

    def test_euler_constant(self):
        tok = lookup_glyph("ℯ")
        assert tok is not None
        assert tok.name == "EULER"

    def test_vm_pi_resolves(self):
        import math
        vm = CPLVM()
        val = vm.eval_source("π")
        assert isinstance(val, NumberValue)
        assert abs(val.value - math.pi) < 1e-10

    def test_vm_tau_equals_two_pi(self):
        import math
        vm = CPLVM()
        val = vm.eval_source("τ")
        assert isinstance(val, NumberValue)
        assert abs(val.value - 2 * math.pi) < 1e-10

    def test_vm_monad_point_is_unity(self):
        vm = CPLVM()
        val = vm.eval_source("⊙")
        assert isinstance(val, NumberValue)
        assert val.value == 1.0

    def test_sacred_code_range(self):
        sacred_ops = [t for t in OPERATORS if 0x2050 <= t.code <= 0x206F]
        assert len(sacred_ops) >= 8

    def test_ratio_operator(self):
        tok = lookup_glyph("∷")
        assert tok is not None
        assert tok.name == "RATIO_OP"
        assert tok.arity == 2

    def test_integral_operator(self):
        tok = lookup_glyph("∫")
        assert tok is not None
        assert tok.name == "INTEGRAL"

    def test_sqrt_operator(self):
        tok = lookup_glyph("√")
        assert tok is not None
        assert tok.name == "ROOT_OP"


# ═══════════════════════════════════════════════════════════════════════════════
# ALCHEMICAL OPERATOR TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestAlchemy:

    def test_mercury_present(self):
        tok = lookup_glyph("☿")
        assert tok is not None
        assert tok.name == "MERCURY_AL"
        assert tok.domain == "ALCHEMY"

    def test_sol_present(self):
        tok = lookup_glyph("☉")
        assert tok is not None
        assert tok.name == "SOL_AL"
        assert "sun" in tok.english.lower() or "gold" in tok.english.lower()

    def test_luna_present(self):
        tok = lookup_glyph("☽")
        assert tok is not None
        assert tok.name == "LUNA_AL"

    def test_saturn_present(self):
        tok = lookup_glyph("♄")
        assert tok is not None
        assert tok.name == "SATURN_AL"
        assert "time" in tok.english.lower() or "structure" in tok.english.lower()

    def test_jupiter_present(self):
        tok = lookup_glyph("♃")
        assert tok is not None
        assert tok.name == "JUPITER_AL"

    def test_conjunct_is_binary(self):
        tok = lookup_glyph("☌")
        assert tok is not None
        assert tok.name == "CONJUNCT"
        assert tok.arity == 2

    def test_oppositio_is_binary(self):
        tok = lookup_glyph("☍")
        assert tok is not None
        assert tok.arity == 2

    def test_quinta_is_fifth_element(self):
        tok = lookup_glyph("⊚")
        assert tok is not None
        assert tok.name == "QUINTA"
        assert "quintessence" in tok.english.lower() or "fifth" in tok.english.lower()

    def test_vm_quinta_is_five(self):
        vm = CPLVM()
        val = vm.eval_source("⊚")
        assert isinstance(val, NumberValue)
        assert val.value == 5.0

    def test_fire_element(self):
        tok = lookup_glyph("🜁")
        assert tok is not None
        assert tok.name == "FIRE_AL"

    def test_water_element(self):
        tok = lookup_glyph("🜄")
        assert tok is not None
        assert tok.name == "WATER_AL"

    def test_alchemy_code_range(self):
        alch_ops = [t for t in OPERATORS if 0x2070 <= t.code <= 0x208F]
        assert len(alch_ops) >= 8

    def test_vm_fire_resolves_to_one(self):
        vm = CPLVM()
        val = vm.eval_source("🜁")
        assert isinstance(val, NumberValue)
        assert val.value == 1.0

    def test_encode_decode_alchemy(self):
        src = "☿ ⊗ ☉ → ⊚"
        decoded = roundtrip(src)
        assert "☿" in decoded
        assert "☉" in decoded


# ═══════════════════════════════════════════════════════════════════════════════
# CROSS-FAMILY REGISTRY TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestRegistry:

    def test_families_dict_has_all_seven(self):
        assert "latin_roots"     in FAMILIES
        assert "latin_geometry"  in FAMILIES
        assert "greek_roots"     in FAMILIES
        assert "rhetoric"        in FAMILIES
        assert "pythagorean"     in FAMILIES
        assert "sacred_geometry" in FAMILIES
        assert "operators"       in FAMILIES

    def test_total_token_count_grew(self):
        # v2.0 must have substantially more tokens than v1.0 (which had 121)
        assert len(ALL_TOKENS) > 180

    def test_all_tokens_globally_unique_codes(self):
        codes = [t.code for t in ALL_TOKENS]
        assert len(codes) == len(set(codes)), "All token codes must be globally unique"

    def test_all_tokens_globally_unique_glyphs(self):
        glyphs = [t.glyph for t in ALL_TOKENS]
        assert len(glyphs) == len(set(glyphs)), "All glyphs must be globally unique"

    def test_by_domain_populated(self):
        assert "RHETORIC"    in BY_DOMAIN
        assert "PYTHAGOREAN" in BY_DOMAIN
        assert "GEOMETRY"    in BY_DOMAIN
        assert "SEED"        in BY_DOMAIN
        assert "SACRED"      in BY_DOMAIN
        assert "ALCHEMY"     in BY_DOMAIN

    def test_tokens_for_domain_geometry(self):
        geom = tokens_for_domain("GEOMETRY")
        assert len(geom) >= 5

    def test_tokens_for_domain_seed(self):
        seeds = tokens_for_domain("SEED")
        assert len(seeds) >= 4

    def test_tokens_for_domain_alchemy(self):
        alch = tokens_for_domain("ALCHEMY")
        assert len(alch) >= 5

    def test_summary_string(self):
        s = summary()
        assert "CPL" in s
        assert "tokens" in s

    def test_lookup_name_rhetoric(self):
        assert lookup_name("ethos")  is not None
        assert lookup_name("pathos") is not None

    def test_lookup_name_pythagorean(self):
        assert lookup_name("TETRACTYS") is not None
        assert lookup_name("gnomon")    is not None

    def test_lookup_name_sacred(self):
        assert lookup_name("merkaba") is not None
        assert lookup_name("vesica")  is not None

    def test_encode_decode_cross_family(self):
        # Mix rhetoric + pythagorean + sacred geometry + alchemy in one expression
        src = "Ηθ ∧ Πθ → (Τκτ ∝ φ) ⊗ ☉"
        decoded = roundtrip(src)
        assert "Ηθ" in decoded
        assert "φ" in decoded

    def test_full_cpl_expression(self):
        # "Logos AND Ethos AND Pathos imply Phronesis, grounded in the Tetractys"
        src = "Λγ ∧ Ηθ ∧ Πθ → Φρ ⊗ Τκτ"
        decoded = roundtrip(src)
        assert "Λγ" in decoded
        assert "Φρ" in decoded

    def test_seed_of_life_expression(self):
        src = "⊛ → Σπλφ → Φλφ → Μτρν"
        decoded = roundtrip(src)
        assert "⊛" in decoded

    def test_platonic_solids_sequence(self):
        # Fire → Air → Water → Earth → Cosmos
        src = "Τετρε → Οκτ → Ικσ → Εξεδ → Δδκ"
        decoded = roundtrip(src)
        assert "Τετρε" in decoded
        assert "Δδκ" in decoded


# ═══════════════════════════════════════════════════════════════════════════════
# CPL REGISTRY TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCPLRegistry:

    def setup_method(self):
        from cpl_registry import LANGUAGES, STRUCTURES, BY_CODE, STRUCT_MAP, \
            CPL_VARIANTS, FUSION_LANGS, CRYPTO_LANGS, language, structure, registry_summary
        self.LANGUAGES      = LANGUAGES
        self.STRUCTURES     = STRUCTURES
        self.BY_CODE        = BY_CODE
        self.STRUCT_MAP     = STRUCT_MAP
        self.CPL_VARIANTS   = CPL_VARIANTS
        self.FUSION_LANGS   = FUSION_LANGS
        self.CRYPTO_LANGS   = CRYPTO_LANGS
        self.language       = language
        self.structure      = structure
        self.registry_summary = registry_summary

    def test_sixteen_languages(self):
        assert len(self.LANGUAGES) == 16

    def test_unique_codes(self):
        codes = [l.code for l in self.LANGUAGES]
        assert len(codes) == len(set(codes)), "Language codes must be unique"

    def test_unique_numbers(self):
        nums = [l.number for l in self.LANGUAGES]
        assert sorted(nums) == list(range(1, 17))

    def test_cpl_is_number_one(self):
        lang = self.language("CPL")
        assert lang is not None
        assert lang.number == 1

    def test_cxl_is_fusion(self):
        lang = self.language("CXL")
        assert lang is not None
        assert lang.is_fusion

    def test_phx_is_crypto(self):
        lang = self.language("PHX")
        assert lang is not None
        assert lang.is_crypto

    def test_three_cpl_variants(self):
        # CPL, CPP, CPX
        assert len(self.CPL_VARIANTS) == 3
        codes = {v.code for v in self.CPL_VARIANTS}
        assert "CPL" in codes
        assert "CPP" in codes
        assert "CPX" in codes

    def test_go_is_gol(self):
        lang = self.language("GOL")
        assert lang is not None
        assert "Go" in lang.short_name
        assert lang.number == 7

    def test_rust_is_rst(self):
        lang = self.language("RST")
        assert lang is not None
        assert lang.number == 8

    def test_motoko_is_mot(self):
        lang = self.language("MOT")
        assert lang is not None
        assert "ICP" in lang.role or "canister" in lang.role.lower()

    def test_python_is_pyt(self):
        lang = self.language("PYT")
        assert lang is not None

    def test_syn_is_sixteen(self):
        lang = self.language("SYN")
        assert lang is not None
        assert lang.number == 16

    def test_six_structures(self):
        assert len(self.STRUCTURES) >= 5

    def test_qfb_structure(self):
        s = self.structure("QFB")
        assert s is not None
        assert "Quantum Fusion Block" in s.full_name

    def test_shl_structure(self):
        s = self.structure("SHL")
        assert s is not None
        assert "Sphere Helix" in s.full_name

    def test_qfc_structure(self):
        s = self.structure("QFC")
        assert s is not None
        assert "Core" in s.full_name

    def test_phx_structure(self):
        s = self.structure("PHX")
        assert s is not None
        assert "Phi Hash" in s.full_name

    def test_registry_summary_contains_all_codes(self):
        s = self.registry_summary()
        for code in ["CPL","CPP","CPX","CXL","PYT","MOT","GOL","RST","PHX","SYN"]:
            assert code in s, f"Code {code} missing from registry summary"

    def test_unknown_language_returns_none(self):
        assert self.language("XYZ") is None

    def test_unknown_structure_returns_none(self):
        assert self.structure("ZZZ") is None

    def test_fusion_langs_includes_cxl_and_mls(self):
        codes = {l.code for l in self.FUSION_LANGS}
        assert "CXL" in codes
        assert "MLS" in codes


# ═══════════════════════════════════════════════════════════════════════════════
# QFB (BLOCK BOX) TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestQFB:

    def setup_method(self):
        import os
        from blockbox import (
            QFB, SphereHelixLayer, QuantumFusionCore, PhiCoord,
            PHXChain, phx_token, _phi_expand,
        )
        self.QFB                = QFB
        self.SphereHelixLayer   = SphereHelixLayer
        self.QuantumFusionCore  = QuantumFusionCore
        self.PhiCoord           = PhiCoord
        self.PHXChain           = PHXChain
        self.phx_token          = phx_token
        self._phi_expand        = _phi_expand
        self.key                = os.urandom(32)

    def test_create_from_cpl(self):
        qfb = self.QFB.from_cpl(["Λγ", "∧", "Ηθ", "→", "Τκτ"], self.key)
        assert qfb.qfb_id
        assert qfb.version == 1
        assert "Λγ" in qfb.cpl_tokens()

    def test_create_from_bytes(self):
        qfb = self.QFB.from_bytes("data", b"hello organism", self.key)
        assert qfb.qfc.payload_type == "data"
        assert b"hello organism" in qfb.qfc.decode_bytes()

    def test_verify_integrity(self):
        qfb = self.QFB.from_cpl(["Μν", "→", "Τκτ"], self.key)
        assert qfb.verify(self.key)

    def test_wrong_key_fails_verify(self):
        import os
        qfb = self.QFB.from_cpl(["Μν", "→", "Τκτ"], self.key)
        assert not qfb.verify(os.urandom(32))

    def test_json_roundtrip(self):
        qfb = self.QFB.from_cpl(["Ηθ", "⊗", "Πθ"], self.key)
        json_str = qfb.to_json()
        restored = self.QFB.from_json(json_str)
        assert restored.qfb_id        == qfb.qfb_id
        assert restored.phx_seal      == qfb.phx_seal
        assert restored.cpl_tokens()  == qfb.cpl_tokens()

    def test_dict_roundtrip(self):
        qfb = self.QFB.from_cpl(["☿", "⊗", "☉"], self.key)
        restored = self.QFB.from_dict(qfb.to_dict())
        assert restored.qfb_id == qfb.qfb_id

    def test_cpl_expression(self):
        tokens = ["Λγ", "∧", "Ηθ"]
        qfb = self.QFB.from_cpl(tokens, self.key)
        assert qfb.cpl_expression() == "Λγ ∧ Ηθ"

    def test_substrate_default_is_memory(self):
        qfb = self.QFB.from_cpl(["Μν"], self.key)
        assert "memory" in qfb.substrate

    def test_substrate_tagging(self):
        qfb = self.QFB.from_cpl(["Μν"], self.key)
        qfb.tag_substrate("icp", "canister-abc-123")
        assert "icp" in qfb.substrate
        assert qfb.substrate_tags["icp"] == "canister-abc-123"

    def test_supports_substrate(self):
        qfb = self.QFB.from_cpl(["Μν"], self.key, substrates=["memory", "icp"])
        assert qfb.supports_substrate("memory")
        assert qfb.supports_substrate("icp")
        assert not qfb.supports_substrate("quantum")

    def test_phi_coord_sovereign(self):
        coord = self.PhiCoord.sovereign(beat=42)
        assert coord.ring == "Sovereign"
        assert coord.beat == 42
        assert abs(coord.phi - 1.618033988749895) < 1e-10

    def test_shl_surface_area(self):
        import math
        shl = self.SphereHelixLayer(sphere_radius=1.618)
        area = shl.surface_area()
        assert abs(area - 4 * math.pi * 1.618 ** 2) < 1e-6

    def test_shl_helix_length_positive(self):
        shl = self.SphereHelixLayer()
        assert shl.helix_length() > 0

    def test_qfc_from_cpl(self):
        qfc = self.QuantumFusionCore.from_cpl(["△", "▽", "✶"])
        assert qfc.payload_type == "cpl_expression"
        assert qfc.cpl_token_count == 3
        assert "△" in qfc.cpl_manifest

    def test_qfc_decode_bytes(self):
        qfc = self.QuantumFusionCore.from_cpl(["Μν", "Δδ"])
        raw = qfc.decode_bytes()
        assert "Μν".encode("utf-8") in raw

    def test_summary_contains_qfb(self):
        qfb = self.QFB.from_cpl(["Λγ"], self.key)
        s = qfb.summary()
        assert "QFB" in s
        assert "substrates" in s

    def test_qfb_with_all_substrates(self):
        qfb = self.QFB.from_cpl(
            ["⊙", "☿", "Τκτ"], self.key,
            substrates=["memory", "icp", "evm", "solana", "edge"],
        )
        for sub in ["memory", "icp", "evm", "solana", "edge"]:
            assert qfb.supports_substrate(sub)

    def test_phi_expand_length(self):
        seed = b"phi-test"
        expanded = self._phi_expand(seed, 64)
        assert len(expanded) == 64

    def test_phi_expand_differs_from_seed(self):
        seed = b"\x00" * 64
        expanded = self._phi_expand(seed, 64)
        # phi-expanded zeros should not all be zero
        assert any(b != 0 for b in expanded)


# ═══════════════════════════════════════════════════════════════════════════════
# PHX CHAIN TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestPHXChain:

    def setup_method(self):
        import os
        from blockbox import PHXChain, phx_token
        self.key      = os.urandom(32)
        self.PHXChain = PHXChain
        self.phx_token = phx_token

    def test_single_decision(self):
        chain = self.PHXChain(self.key)
        tok = chain.advance(b"decision: route to GPT-4", label="routing")
        assert len(tok) == 32

    def test_chain_advances_beat(self):
        chain = self.PHXChain(self.key)
        chain.advance(b"event-1")
        chain.advance(b"event-2")
        assert chain.beat == 2

    def test_tokens_are_different(self):
        chain = self.PHXChain(self.key)
        t1 = chain.advance(b"event-1")
        t2 = chain.advance(b"event-2")
        assert t1 != t2

    def test_same_event_different_beat_different_token(self):
        chain = self.PHXChain(self.key)
        t1 = chain.advance(b"same-event")
        t2 = chain.advance(b"same-event")
        assert t1 != t2   # beat differs → tokens differ

    def test_log_tracks_decisions(self):
        chain = self.PHXChain(self.key)
        chain.advance(b"decision-1", label="d1")
        chain.advance(b"decision-2", label="d2")
        log = chain.log()
        assert len(log) == 2
        assert log[0]["label"] == "d1"
        assert log[1]["label"] == "d2"

    def test_log_contains_phx_token_hex(self):
        chain = self.PHXChain(self.key)
        tok = chain.advance(b"event")
        log = chain.log()
        assert log[0]["phx_token"] == tok.hex()

    def test_latest_token_is_last(self):
        chain = self.PHXChain(self.key)
        chain.advance(b"a")
        t = chain.advance(b"b")
        assert chain.latest_token == t

    def test_chain_summary(self):
        chain = self.PHXChain(self.key)
        chain.advance(b"x")
        s = chain.chain_summary()
        assert "PHXChain" in s
        assert "beat=1" in s

    def test_phx_token_is_32_bytes(self):
        tok = self.phx_token(b"event", self.key, beat=0)
        assert len(tok) == 32

    def test_phx_token_changes_with_previous(self):
        t1 = self.phx_token(b"event", self.key, previous_token=None, beat=0)
        t2 = self.phx_token(b"event", self.key, previous_token=t1, beat=1)
        assert t1 != t2

    def test_phx_token_changes_with_key(self):
        import os
        k2 = os.urandom(32)
        t1 = self.phx_token(b"event", self.key, beat=0)
        t2 = self.phx_token(b"event", k2, beat=0)
        assert t1 != t2

    def test_short_key_raises(self):
        with pytest.raises(ValueError):
            self.PHXChain(b"short")

    def test_genesis_token_no_previous(self):
        chain = self.PHXChain(self.key)
        tok = chain.advance(b"genesis")
        assert tok is not None
        assert len(tok) == 32


# ═══════════════════════════════════════════════════════════════════════════════
# CPL BRIDGE (CXL) TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCPLBridge:

    def setup_method(self):
        from cpl_bridge import CPLBridge
        self.bridge = CPLBridge()

    def test_available_targets(self):
        targets = self.bridge.available_targets()
        assert "python" in targets
        assert "motoko" in targets
        assert "go"     in targets
        assert "rust"   in targets

    def test_emit_python(self):
        code = self.bridge.emit("Λγ ∧ Ηθ → Τκτ", "python")
        assert "python" in code.lower() or "CPLVM" in code or "cpl_vm" in code.lower()

    def test_emit_motoko(self):
        code = self.bridge.emit("Λγ ∧ Ηθ → Τκτ", "motoko")
        assert "Motoko" in code or "motoko" in code.lower() or "mo:" in code.lower()

    def test_emit_go(self):
        code = self.bridge.emit("Λγ ∧ Ηθ → Τκτ", "go")
        assert "go" in code.lower() or "Go" in code or "golang" in code.lower() \
               or "package" in code or "func" in code

    def test_emit_rust(self):
        code = self.bridge.emit("Λγ ∧ Ηθ → Τκτ", "rust")
        assert "rust" in code.lower() or "fn " in code or "Vec" in code

    def test_emit_unknown_target_raises(self):
        with pytest.raises(ValueError):
            self.bridge.emit("Λγ", "cobol")

    def test_polyglot_returns_all_targets(self):
        result = self.bridge.polyglot("Μν → Δδ → Τρδ")
        assert set(result.keys()) == {
            "python", "motoko", "go", "rust", "java",
            "solidity", "move", "ink", "cosmwasm", "cairo",
            "typescript", "swift", "phx_chain", "qfb",
        }

    def test_polyglot_all_non_empty(self):
        result = self.bridge.polyglot("Μν → Δδ")
        for name, code in result.items():
            assert len(code) > 0, f"{name} emitted empty code"

    def test_source_in_python_output(self):
        src = "Ηθ ∧ Πθ"
        code = self.bridge.emit(src, "python")
        # Source should appear as a comment or string in the output
        assert "Ηθ" in code or "ETHOS" in code

    def test_source_in_motoko_output(self):
        src = "Ηθ ∧ Πθ"
        code = self.bridge.emit(src, "motoko")
        assert "Ηθ" in code or "ETHOS" in code

    def test_history_grows(self):
        self.bridge.emit("Μν", "python")
        self.bridge.emit("Δδ", "rust")
        assert len(self.bridge.history) == 2

    def test_query_returns_value(self):
        result = self.bridge.query("⊤")
        assert "value" in result
        assert result["value"]["type"] == "truth"
        assert result["value"]["result"] == "True"

    def test_query_returns_polyglot(self):
        result = self.bridge.query("Μν → Δδ")
        assert "polyglot" in result
        assert "python" in result["polyglot"]

    def test_query_beat_is_873(self):
        result = self.bridge.query("φ")
        assert result["beat"] == 873

    def test_synopsis_token_count(self):
        result = self.bridge.synopsis("Λγ ∧ Ηθ ∧ Πθ")
        # Should find at least 3 tokens (Λγ, Ηθ, Πθ — ∧ may not be in token dict)
        assert result["token_count"] >= 3

    def test_synopsis_qfb_id(self):
        result = self.bridge.synopsis("Τκτ → φ")
        assert "qfb_id" in result
        assert len(result["qfb_id"]) > 8

    def test_synopsis_domains_populated(self):
        result = self.bridge.synopsis("Ηθ ∧ Πθ → Τκτ")
        assert len(result["domains"]) >= 1

    def test_synopsis_cpl_version(self):
        result = self.bridge.synopsis("Μν")
        assert result["cpl_version"] == "3.0.0"

    def test_bridge_cpl_plus_pythagorean(self):
        # Full rhetoric + Pythagorean expression
        src = "Λγ ∧ Ηθ ∧ Πθ → Φρ ⊗ Τκτ"
        result = self.bridge.polyglot(src)
        assert all(len(code) > 20 for code in result.values())

    def test_bridge_sacred_geometry_expression(self):
        src = "⊙ → Στγ → Κκλ → Σφρ"
        result = self.bridge.polyglot(src)
        assert "python" in result

    def test_bridge_alchemy_expression(self):
        src = "☿ ⊗ ☉ → ⊚"
        result = self.bridge.polyglot(src)
        assert all(len(code) > 0 for code in result.values())


if __name__ == "__main__":
    import subprocess, sys
    result = subprocess.run(
        [sys.executable, "-m", "pytest", __file__, "-v"],
        capture_output=False,
    )
    sys.exit(result.returncode)
