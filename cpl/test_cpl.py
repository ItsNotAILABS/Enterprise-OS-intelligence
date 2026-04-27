"""
test_cpl.py — CPL test suite

Tests for:
  - cpl_tokens  : token dictionary, lookups
  - cpl_lexer   : tokenisation, parsing, AST
  - cpl_encoder : binary encode/decode, roundtrip
  - cpl_vm      : expression evaluation, environment, quantifiers

Run with: pytest test_cpl.py -v
"""

from __future__ import annotations

import pytest

from cpl_tokens import (
    ALL_TOKENS, BY_GLYPH, BY_CODE, BY_NAME,
    LATIN_ROOTS, GREEK_ROOTS, OPERATORS,
    lookup_glyph, lookup_code, lookup_name,
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


if __name__ == "__main__":
    import subprocess, sys
    result = subprocess.run(
        [sys.executable, "-m", "pytest", __file__, "-v"],
        capture_output=False,
    )
    sys.exit(result.returncode)
