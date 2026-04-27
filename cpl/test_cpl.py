"""
test_cpl.py — CPL test suite (v2.0)

Tests for:
  - cpl_tokens  : token dictionary, all 7 families, lookups, domains
  - cpl_lexer   : tokenisation, parsing, AST
  - cpl_encoder : binary encode/decode, roundtrip
  - cpl_vm      : expression evaluation, Pythagorean constants, sacred geometry

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


if __name__ == "__main__":
    import subprocess, sys
    result = subprocess.run(
        [sys.executable, "-m", "pytest", __file__, "-v"],
        capture_output=False,
    )
    sys.exit(result.returncode)
