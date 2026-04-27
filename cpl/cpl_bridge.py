"""
cpl_bridge.py — CPL Cross-Language Bridge (CXL Emitter)

Author : Medina
Version: 1.0.0
Ring   : Sovereign Ring

─────────────────────────────────────────────────────────────────────────────
PURPOSE
─────────────────────────────────────────────────────────────────────────────

CXL (Cognitive eXchange Language) is the fusion of all 16 organism languages.
The bridge here takes a CPL expression (or a list of CPL tokens) and emits
equivalent code in the target language.

Supported targets
─────────────────
  python   — Python intelligence layer  (PYT)
  motoko   — Motoko ICP canister call   (MOT)
  go       — Go service call            (GOL)
  rust     — Rust kernel expression     (RST)

Usage
─────
  bridge = CPLBridge()
  py_code  = bridge.emit("Λγ ∧ Ηθ → Τκτ", "python")
  mo_code  = bridge.emit("Λγ ∧ Ηθ → Τκτ", "motoko")
  go_code  = bridge.emit("Λγ ∧ Ηθ → Τκτ", "go")
  rs_code  = bridge.emit("Λγ ∧ Ηθ → Τκτ", "rust")

Full polyglot sync (emit to all targets at once)
─────────────────────────────────────────────────
  result = bridge.polyglot("Λγ ∧ Ηθ → Τκτ")
  # result["python"], result["motoko"], result["go"], result["rust"]
"""

from __future__ import annotations

import textwrap
from typing import Optional

from cpl_lexer  import tokenise, parse, format_ast, SequenceNode
from cpl_tokens import ALL_TOKENS, BY_GLYPH, lookup_glyph, CPLToken


# ── Emitter base ───────────────────────────────────────────────────────────────

class _Emitter:
    """Abstract emitter base."""

    LANGUAGE: str = ""

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        raise NotImplementedError


# ── Python Emitter ─────────────────────────────────────────────────────────────

class PythonEmitter(_Emitter):
    """Emit CPL as Python intelligence code."""

    LANGUAGE = "python"

    _OP_MAP: dict[str, str] = {
        "AND":    " and ",
        "OR":     " or ",
        "NOT":    "not ",
        "IMPLIES":"__implies__",
        "IFF":    "__iff__",
        "XOR":    "__xor__",
        "TRUE":   "True",
        "FALSE":  "False",
        "FORALL": "__forall__",
        "EXISTS": "__exists__",
        "TENSOR": "__tensor__",
        "BIND":   "__bind__",
        "SEAL":   "__seal__",
        "OPEN":   "__open__",
        "SIGN":   "__sign__",
        "WITNESS":"__witness__",
    }

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_comments = ", ".join(
            f'"{t.glyph}"={t.english.split("/")[0].strip()}' for t in tokens
        )
        glyphs = " ".join(t.glyph for t in tokens)
        py_parts: list[str] = []
        for tok in tokens:
            mapped = self._OP_MAP.get(tok.name)
            if mapped:
                py_parts.append(mapped)
            else:
                # Atoms become string constants (concept handles)
                py_parts.append(f'CPL["{tok.glyph}"]')

        py_expr = "".join(py_parts).strip()

        return textwrap.dedent(f"""\
            # CPL → Python  (PYT bridge)
            # source: {raw_source}
            # tokens: {token_comments}
            #
            from cpl_vm import CPLVM
            from cpl_tokens import lookup_glyph

            _vm = CPLVM()
            _result = _vm.eval_source({repr(raw_source)})
            # _result is a VMValue — inspect with isinstance(_result, TruthValue)
            """)


# ── Motoko Emitter ─────────────────────────────────────────────────────────────

class MotokoEmitter(_Emitter):
    """Emit CPL as a Motoko canister call fragment."""

    LANGUAGE = "motoko"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_list = ", ".join(f'"{t.glyph}"' for t in tokens)
        domain_set = ", ".join({f'"{t.domain}"' for t in tokens})
        return textwrap.dedent(f"""\
            // CPL → Motoko  (MOT bridge)
            // source: {raw_source}

            import CPLOracle "mo:cpl/CPLOracle";

            // Token sequence
            let tokens : [Text] = [{token_list}];
            let domains : [Text] = [{domain_set}];

            // Execute via CPL oracle canister
            let result = await CPLOracle.eval(tokens);

            // Query call pattern (synopsis canister)
            let synopsis = await CPLOracle.synopsis({{
              cpl_source  = "{raw_source}";
              token_count = {len(tokens)};
              domains     = domains;
            }});
            """)


# ── Go Emitter ─────────────────────────────────────────────────────────────────

class GoEmitter(_Emitter):
    """Emit CPL as a Go service call."""

    LANGUAGE = "go"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_list = ", ".join(f'"{t.glyph}"' for t in tokens)
        return textwrap.dedent(f"""\
            // CPL → Go  (GOL bridge)
            // source: {raw_source}
            package cplbridge

            import (
            \t"context"
            \t"github.com/medina/organism/cpl"
            )

            func EvalExpression(ctx context.Context) (cpl.VMValue, error) {{
            \ttokens := []string{{{token_list}}}
            \tvm     := cpl.NewVM()
            \treturn vm.EvalTokens(ctx, tokens)
            }}
            """)


# ── Rust Emitter ───────────────────────────────────────────────────────────────

class RustEmitter(_Emitter):
    """Emit CPL as Rust kernel code."""

    LANGUAGE = "rust"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_vec = ", ".join(f'"{t.glyph}"' for t in tokens)
        return textwrap.dedent(f"""\
            // CPL → Rust  (RST bridge)
            // source: {raw_source}
            use medina_cpl::{{VM, Token}};

            fn eval_expression() -> medina_cpl::Result<VM::Value> {{
                let tokens: Vec<&str> = vec![{token_vec}];
                let mut vm = VM::new();
                vm.eval_tokens(&tokens)
            }}
            """)


# ── CPLBridge (CXL entry point) ────────────────────────────────────────────────

class CPLBridge:
    """
    CXL Bridge — emit CPL expressions to any organism language.

    This is the official CXL (Cognitive eXchange Language) gateway.
    Feed it a CPL source string; receive code in any of the 16 languages.
    """

    _EMITTERS: dict[str, _Emitter] = {
        "python": PythonEmitter(),
        "motoko": MotokoEmitter(),
        "go":     GoEmitter(),
        "rust":   RustEmitter(),
    }

    def __init__(self) -> None:
        self._history: list[dict] = []

    # ── Core emit ──────────────────────────────────────────────────────────────

    def emit(self, source: str, target: str) -> str:
        """
        Emit CPL source to the target language.

        source — CPL expression string (e.g. "Λγ ∧ Ηθ → Τκτ")
        target — language code: "python" | "motoko" | "go" | "rust"
        """
        target = target.lower().strip()
        if target not in self._EMITTERS:
            raise ValueError(
                f"Unknown target '{target}'. Available: {list(self._EMITTERS)}"
            )
        tokens = self._tokenise(source)
        result = self._EMITTERS[target].emit(tokens, source)
        self._history.append({"source": source, "target": target})
        return result

    # ── Polyglot ───────────────────────────────────────────────────────────────

    def polyglot(self, source: str) -> dict[str, str]:
        """
        Emit CPL source to ALL supported languages simultaneously.

        Returns dict: {language_name: emitted_code}
        """
        tokens = self._tokenise(source)
        result: dict[str, str] = {}
        for name, emitter in self._EMITTERS.items():
            result[name] = emitter.emit(tokens, source)
        self._history.append({"source": source, "target": "polyglot"})
        return result

    # ── Token extraction ───────────────────────────────────────────────────────

    def _tokenise(self, source: str) -> list[CPLToken]:
        """
        Extract CPL tokens from a source string.

        Falls back to glyph-by-glyph splitting if the full lexer
        cannot parse a glyph (e.g. emoji sequences).
        """
        try:
            lex_tokens = tokenise(source)
            # tokenise returns strings; resolve to CPLToken objects
            resolved: list[CPLToken] = []
            for glyph in lex_tokens:
                tok = lookup_glyph(glyph)
                if tok:
                    resolved.append(tok)
            if resolved:
                return resolved
        except Exception:
            pass
        # Fallback: split on spaces and look up each piece
        result: list[CPLToken] = []
        for piece in source.split():
            tok = lookup_glyph(piece)
            if tok:
                result.append(tok)
        return result

    # ── Synopsis call ──────────────────────────────────────────────────────────

    def synopsis(self, source: str) -> dict:
        """
        Return a full synopsis of a CPL expression across all dimensions.

        Includes: token breakdown, domain coverage, family membership,
        polyglot code, and a QFB descriptor.
        """
        from blockbox import QFB
        import os

        tokens = self._tokenise(source)
        domains   = sorted({t.domain for t in tokens})
        families  = sorted({
            fam for fam, lst in {
                "latin_roots":    ["MIND","SOUL","TRUTH","POWER","BEING","SPACE","TIME","ORGANISM"],
                "greek_roots":    ["MIND","SOUL","TRUTH","POWER","BEING","TIME","SPACE"],
                "rhetoric":       ["RHETORIC"],
                "pythagorean":    ["PYTHAGOREAN"],
                "sacred_geometry":["GEOMETRY","SEED","SACRED"],
                "latin_geometry": ["GEOMETRY","SEED","ALCHEMY","PYTHAGOREAN"],
                "operators":      ["LOGIC","FLOW","ORGANISM","CIPHER","SACRED","ALCHEMY"],
            }.items()
            for dom in domains if dom in lst
        })

        key = os.urandom(32)
        glyphs = [t.glyph for t in tokens]
        qfb = QFB.from_cpl(glyphs, key)

        return {
            "source":       source,
            "token_count":  len(tokens),
            "tokens":       [{"glyph": t.glyph, "name": t.name, "domain": t.domain,
                               "english": t.english} for t in tokens],
            "domains":      domains,
            "families":     families,
            "polyglot":     self.polyglot(source),
            "qfb_id":       qfb.qfb_id,
            "qfb_summary":  qfb.summary(),
            "cpl_version":  "3.0.0",
            "language":     "CPL / CXL",
        }

    # ── Query call ─────────────────────────────────────────────────────────────

    def query(self, source: str) -> dict:
        """
        Full organism query call: evaluate + emit + package.

        This is the 'entire query call' — parse the CPL expression,
        evaluate it in the VM, emit to all languages, and return
        the complete result package.
        """
        from cpl_vm import CPLVM, TruthValue, NumberValue, ConceptValue

        vm     = CPLVM()
        value  = vm.eval_source(source)
        tokens = self._tokenise(source)

        # Determine value type label
        if isinstance(value, TruthValue):
            vtype, vval = "truth",   str(value.value)
        elif isinstance(value, NumberValue):
            vtype, vval = "number",  str(value.value)
        elif isinstance(value, ConceptValue):
            vtype, vval = "concept", value.token.english
        else:
            vtype, vval = "unknown", repr(value)

        return {
            "query":     source,
            "value":     {"type": vtype, "result": vval},
            "tokens":    len(tokens),
            "polyglot":  self.polyglot(source),
            "trace":     vm.trace,
            "beat":      873,   # organism heartbeat
        }

    @property
    def history(self) -> list[dict]:
        """Return the list of all emissions made through this bridge."""
        return list(self._history)

    def available_targets(self) -> list[str]:
        """Return the list of supported emission targets."""
        return list(self._EMITTERS.keys())
