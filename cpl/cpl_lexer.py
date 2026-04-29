"""
cpl_lexer.py — CPL Lexer and Parser

Tokenises CPL source code into a stream of CPLToken references,
then parses the stream into an Abstract Syntax Tree (AST).

CPL source uses space-separated tokens.  Parentheses group sub-expressions.

Grammar (simplified BNF)
────────────────────────
expression ::= atom
             | unary_op expression
             | expression binary_op expression
             | '(' expression ')'

Examples
────────
  Λγ ∧ Νσ → Φρ
  ∀ Ψχ: Αθ(Ψχ) → Λγ ∧ Νσ
  ⊗(ΜΜ, ΔΝΜ) → ΚΝΩ(ΑΝΜ)
  ✦ ⊞ HEART ⋈ Φ-SIGNUM

Ring: Sovereign Ring | Wire: intelligence-wire/cpl
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Optional, Union

from cpl_tokens import CPLToken, BY_GLYPH, lookup_glyph, lookup_name


# ── Lexer tokens ───────────────────────────────────────────────────────────────

@dataclass
class LexToken:
    kind:  str          # "GLYPH" | "LPAREN" | "RPAREN" | "COLON" | "COMMA" | "LITERAL" | "EOF"
    value: str          # raw text
    token: Optional[CPLToken] = None  # resolved CPL token (if kind == "GLYPH")
    pos:   int = 0

    def __str__(self) -> str:
        if self.token:
            return f"[{self.token.glyph}={self.token.name}]"
        return f"[{self.kind}:{self.value!r}]"


# ── AST nodes ──────────────────────────────────────────────────────────────────

@dataclass
class AtomNode:
    token: CPLToken
    def __str__(self): return self.token.glyph

@dataclass
class LiteralNode:
    value: str
    def __str__(self): return self.value

@dataclass
class UnaryNode:
    operator: CPLToken
    operand:  "ASTNode"
    def __str__(self): return f"({self.operator.glyph} {self.operand})"

@dataclass
class BinaryNode:
    operator: CPLToken
    left:     "ASTNode"
    right:    "ASTNode"
    def __str__(self): return f"({self.left} {self.operator.glyph} {self.right})"

@dataclass
class CallNode:
    callee:    CPLToken
    arguments: list["ASTNode"]
    def __str__(self):
        args = ", ".join(str(a) for a in self.arguments)
        return f"{self.callee.glyph}({args})"

@dataclass
class GroupNode:
    inner: "ASTNode"
    def __str__(self): return f"({self.inner})"

@dataclass
class QuantifierNode:
    quantifier: CPLToken          # ∀ or ∃
    variable:   str               # variable name (e.g. "x")
    body:       "ASTNode"
    def __str__(self): return f"{self.quantifier.glyph} {self.variable}: {self.body}"

@dataclass
class SequenceNode:
    nodes: list["ASTNode"]
    def __str__(self): return " ".join(str(n) for n in self.nodes)

ASTNode = Union[
    AtomNode, LiteralNode, UnaryNode, BinaryNode,
    CallNode, GroupNode, QuantifierNode, SequenceNode
]


# ── CPLLexer ───────────────────────────────────────────────────────────────────

class CPLLexer:
    """
    Tokenise a CPL source string into a flat list of LexTokens.

    Strategy:
      1. Try to match any known glyph (longest match wins)
      2. Match structural characters: ( ) : ,
      3. Match identifier literals (letters/digits/-)
    """

    def __init__(self) -> None:
        # Sort glyphs longest-first so multi-char glyphs match before shorter ones
        self._glyphs = sorted(BY_GLYPH.keys(), key=len, reverse=True)

    def tokenise(self, source: str) -> list[LexToken]:
        tokens: list[LexToken] = []
        pos = 0
        src = source.strip()

        while pos < len(src):
            # Skip whitespace
            if src[pos].isspace():
                pos += 1
                continue

            # Try structural characters
            if src[pos] == '(':
                tokens.append(LexToken("LPAREN", "(", pos=pos)); pos += 1; continue
            if src[pos] == ')':
                tokens.append(LexToken("RPAREN", ")", pos=pos)); pos += 1; continue
            if src[pos] == ':':
                tokens.append(LexToken("COLON",  ":", pos=pos)); pos += 1; continue
            if src[pos] == ',':
                tokens.append(LexToken("COMMA",  ",", pos=pos)); pos += 1; continue

            # Try CPL glyphs (longest match first)
            matched = False
            for glyph in self._glyphs:
                if src[pos:pos + len(glyph)] == glyph:
                    tok = BY_GLYPH[glyph]
                    tokens.append(LexToken("GLYPH", glyph, token=tok, pos=pos))
                    pos += len(glyph)
                    matched = True
                    break

            if not matched:
                # Collect a literal word (ASCII identifier)
                m = re.match(r'[A-Za-z_][A-Za-z0-9_\-]*', src[pos:])
                if m:
                    word = m.group(0)
                    # Try resolving as a concept name
                    resolved = lookup_name(word)
                    if resolved:
                        tokens.append(LexToken("GLYPH", word, token=resolved, pos=pos))
                    else:
                        tokens.append(LexToken("LITERAL", word, pos=pos))
                    pos += len(word)
                else:
                    # Unknown single character — skip with warning
                    pos += 1

        tokens.append(LexToken("EOF", "", pos=pos))
        return tokens


# ── CPLParser ──────────────────────────────────────────────────────────────────

class CPLParser:
    """
    Recursive-descent parser that converts a token stream to an AST.

    Precedence (lowest to highest):
      1. →  ↔  (implication, biconditional)
      2. ∨
      3. ∧
      4. ¬  (prefix unary)
      5. Atoms, literals, call expressions, groups
    """

    # Binary operators in ascending precedence groups
    _BINOP_PREC: dict[str, int] = {
        "↔": 1, "→": 1,
        "∨": 2,
        "∧": 3,
        "≡": 4, "≈": 4, "≠": 4,
        "⊕": 5,
        "⊗": 6, "⋈": 6,
        "⊞": 7,
    }

    # Prefix unary operators
    _UNARY_OPS: set[str] = {"¬", "∃", "∀", "∄", "↑", "↓", "↻", "Σ", "Π", "∇", "👁", "⊘"}

    def __init__(self, tokens: list[LexToken]) -> None:
        self._tokens = tokens
        self._pos = 0

    def _peek(self) -> LexToken:
        return self._tokens[self._pos]

    def _advance(self) -> LexToken:
        t = self._tokens[self._pos]
        if t.kind != "EOF":
            self._pos += 1
        return t

    def _expect(self, kind: str) -> LexToken:
        t = self._peek()
        if t.kind != kind:
            raise SyntaxError(f"Expected {kind}, got {t.kind!r} at pos {t.pos}")
        return self._advance()

    # ── Entry point ──────────────────────────────────────────────────────────

    def parse(self) -> ASTNode:
        """Parse the full expression and return an AST."""
        nodes = []
        while self._peek().kind != "EOF":
            nodes.append(self._parse_expr(0))
        if len(nodes) == 1:
            return nodes[0]
        return SequenceNode(nodes)

    # ── Pratt-style expression parsing ───────────────────────────────────────

    def _parse_expr(self, min_prec: int = 0) -> ASTNode:
        left = self._parse_prefix()

        while True:
            tok = self._peek()
            if tok.kind != "GLYPH" or tok.token is None:
                break
            glyph = tok.token.glyph
            prec  = self._BINOP_PREC.get(glyph, -1)
            if prec < 0 or prec <= min_prec:
                break
            self._advance()
            right = self._parse_expr(prec)
            left  = BinaryNode(tok.token, left, right)

        return left

    def _parse_prefix(self) -> ASTNode:
        tok = self._peek()

        # Grouped expression
        if tok.kind == "LPAREN":
            self._advance()
            inner = self._parse_expr(0)
            self._expect("RPAREN")
            return GroupNode(inner)

        # Quantifier: ∀ x: body  or  ∃ x: body
        if tok.kind == "GLYPH" and tok.token and tok.token.glyph in ("∀", "∃", "∄"):
            self._advance()
            var_tok = self._advance()
            var_name = var_tok.value
            self._expect("COLON")
            body = self._parse_expr(0)
            return QuantifierNode(tok.token, var_name, body)

        # Unary prefix
        if tok.kind == "GLYPH" and tok.token and tok.token.glyph in self._UNARY_OPS:
            self._advance()
            operand = self._parse_prefix()
            return UnaryNode(tok.token, operand)

        # Atom or call
        if tok.kind == "GLYPH" and tok.token:
            self._advance()
            # Function call: GLYPH(arg, arg, ...)
            if self._peek().kind == "LPAREN":
                self._advance()  # consume (
                args: list[ASTNode] = []
                while self._peek().kind != "RPAREN":
                    args.append(self._parse_expr(0))
                    if self._peek().kind == "COMMA":
                        self._advance()
                self._expect("RPAREN")
                return CallNode(tok.token, args)
            return AtomNode(tok.token)

        # Literal
        if tok.kind == "LITERAL":
            self._advance()
            return LiteralNode(tok.value)

        raise SyntaxError(f"Unexpected token {tok} at pos {tok.pos}")


# ── Public API ─────────────────────────────────────────────────────────────────

def tokenise(source: str) -> list[LexToken]:
    """Tokenise a CPL expression string."""
    return CPLLexer().tokenise(source)


def parse(source: str) -> ASTNode:
    """Parse a CPL expression string into an AST."""
    tokens = tokenise(source)
    return CPLParser(tokens).parse()


def format_ast(node: ASTNode, indent: int = 0) -> str:
    """Return an indented tree representation of an AST node."""
    pad = "  " * indent
    if isinstance(node, AtomNode):
        return f"{pad}ATOM({node.token.glyph} = {node.token.english})"
    if isinstance(node, LiteralNode):
        return f"{pad}LITERAL({node.value})"
    if isinstance(node, UnaryNode):
        return (f"{pad}UNARY({node.operator.glyph})\n"
                + format_ast(node.operand, indent + 1))
    if isinstance(node, BinaryNode):
        return (f"{pad}BINARY({node.operator.glyph} = {node.operator.english})\n"
                + format_ast(node.left,  indent + 1) + "\n"
                + format_ast(node.right, indent + 1))
    if isinstance(node, CallNode):
        args_str = "\n".join(format_ast(a, indent + 1) for a in node.arguments)
        return f"{pad}CALL({node.callee.glyph})\n{args_str}"
    if isinstance(node, GroupNode):
        return f"{pad}GROUP\n" + format_ast(node.inner, indent + 1)
    if isinstance(node, QuantifierNode):
        return (f"{pad}QUANTIFIER({node.quantifier.glyph} {node.variable})\n"
                + format_ast(node.body, indent + 1))
    if isinstance(node, SequenceNode):
        parts = "\n".join(format_ast(n, indent + 1) for n in node.nodes)
        return f"{pad}SEQUENCE\n{parts}"
    return f"{pad}UNKNOWN"
