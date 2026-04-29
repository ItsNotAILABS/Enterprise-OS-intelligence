"""
cpl_vm.py — CPL Virtual Machine

Evaluates parsed CPL AST nodes in a symbolic environment.

The VM operates on three value types:
  TRUTH   — boolean (True / False / Unknown)
  CONCEPT — a resolved CPL token (from cpl_tokens)
  NUMBER  — float (for phi-math expressions)

Standard reduction rules:
  ¬ TRUTH(x)          → TRUTH(not x)
  TRUTH(x) ∧ TRUTH(y) → TRUTH(x and y)
  TRUTH(x) ∨ TRUTH(y) → TRUTH(x or y)
  TRUTH(x) → TRUTH(y) → TRUTH((not x) or y)
  CONCEPT(x)          → CONCEPT(x)   (atoms reduce to themselves)
  ∀ v: body           → evaluate body with universal binding
  ∃ v: body           → evaluate body with existential binding

Built-in functions:
  ΚΝΩ(x)   → known(x)   returns whether x is bound in the environment
  ΑΛΘ(x)   → true_of(x) asks if x is marked as TRUTH=True
  Συ(a, b) → synthesise returns a new CONCEPT binding for a ∧ b
  ⊞(k, v)  → bind k to v in the environment; returns True
  ⊘(k)     → revoke k from the environment; returns True

Ring: Sovereign Ring | Wire: intelligence-wire/cpl
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional, Union

from cpl_tokens import CPLToken, lookup_glyph, lookup_name
from cpl_lexer import (
    ASTNode, AtomNode, LiteralNode, UnaryNode, BinaryNode,
    CallNode, GroupNode, QuantifierNode, SequenceNode, parse
)


# ── Value types ────────────────────────────────────────────────────────────────

@dataclass
class TruthValue:
    value: Optional[bool]  # True, False, or None (unknown)
    def __bool__(self): return bool(self.value)
    def __str__(self): return "⊤" if self.value else ("⊥" if self.value is False else "?")

@dataclass
class ConceptValue:
    token:  CPLToken
    label:  Optional[str] = None   # optional binding label
    def __str__(self):
        if self.label:
            return f"{self.token.glyph}[{self.label}]"
        return self.token.glyph

@dataclass
class NumberValue:
    value: float
    def __str__(self): return str(round(self.value, 6))

@dataclass
class SymbolValue:
    name: str
    def __str__(self): return self.name

@dataclass
class BindingValue:
    label: str
    bound: "VMValue"
    def __str__(self): return f"⊞({self.label}, {self.bound})"

VMValue = Union[TruthValue, ConceptValue, NumberValue, SymbolValue, BindingValue]

_TRUE  = TruthValue(True)
_FALSE = TruthValue(False)
_UNK   = TruthValue(None)


# ── Environment ────────────────────────────────────────────────────────────────

@dataclass
class Environment:
    """Symbol table: maps variable names and labels to VMValue."""
    bindings: dict[str, VMValue] = field(default_factory=dict)
    parent:   Optional["Environment"] = None

    def get(self, name: str) -> Optional[VMValue]:
        if name in self.bindings:
            return self.bindings[name]
        if self.parent:
            return self.parent.get(name)
        return None

    def set(self, name: str, value: VMValue) -> None:
        self.bindings[name] = value

    def revoke(self, name: str) -> bool:
        if name in self.bindings:
            del self.bindings[name]
            return True
        if self.parent:
            return self.parent.revoke(name)
        return False

    def child(self) -> "Environment":
        return Environment(parent=self)

    def keys(self) -> list[str]:
        own = list(self.bindings.keys())
        if self.parent:
            return own + [k for k in self.parent.keys() if k not in self.bindings]
        return own


# ── CPL VM ─────────────────────────────────────────────────────────────────────

class CPLVM:
    """
    The CPL Virtual Machine.

    Evaluates a parsed CPL AST in a given Environment and returns a VMValue.

    Usage
    ─────
    vm  = CPLVM()
    val = vm.eval_source("Λγ ∧ Νσ → Φρ")
    """

    def __init__(self, env: Optional[Environment] = None) -> None:
        self.env = env or Environment()
        self.trace: list[str] = []   # evaluation trace for debugging

    # ── Public entry points ───────────────────────────────────────────────────

    def eval_source(self, source: str) -> VMValue:
        """Parse and evaluate a CPL source string."""
        ast = parse(source)
        return self.eval(ast, self.env)

    def eval(self, node: ASTNode, env: Environment) -> VMValue:
        """Evaluate an AST node in the given environment."""
        self.trace.append(str(node))

        if isinstance(node, AtomNode):
            return self._eval_atom(node, env)
        if isinstance(node, LiteralNode):
            return self._eval_literal(node, env)
        if isinstance(node, UnaryNode):
            return self._eval_unary(node, env)
        if isinstance(node, BinaryNode):
            return self._eval_binary(node, env)
        if isinstance(node, CallNode):
            return self._eval_call(node, env)
        if isinstance(node, GroupNode):
            return self.eval(node.inner, env)
        if isinstance(node, QuantifierNode):
            return self._eval_quantifier(node, env)
        if isinstance(node, SequenceNode):
            results = [self.eval(n, env) for n in node.nodes]
            return results[-1] if results else _UNK
        return _UNK

    # ── Atom ─────────────────────────────────────────────────────────────────

    def _eval_atom(self, node: AtomNode, env: Environment) -> VMValue:
        # Check if this glyph is bound to something in the env
        bound = env.get(node.token.glyph) or env.get(node.token.name)
        if bound is not None:
            return bound

        # ── Boolean constants ─────────────────────────────────────────────────
        if node.token.glyph in ("⊤", "TRUE"):    return _TRUE
        if node.token.glyph in ("⊥", "FALSE"):   return _FALSE

        # ── Mathematical constants ────────────────────────────────────────────
        if node.token.glyph in ("∞", "INFIN"):   return NumberValue(float("inf"))
        if node.token.glyph in ("φ", "PHI"):     return NumberValue(1.618033988749895)
        if node.token.glyph in ("Φ", "PHI_UPPER"): return NumberValue(1.618033988749895)
        if node.token.glyph in ("π", "PI_CONST"): return NumberValue(3.141592653589793)
        if node.token.glyph in ("τ", "TAU_CONST"): return NumberValue(6.283185307179586)
        if node.token.glyph in ("ℯ", "EULER"):   return NumberValue(2.718281828459045)

        # ── Organism constants ────────────────────────────────────────────────
        if node.token.glyph in ("⟳", "HEARTBEAT"): return NumberValue(873.0)

        # ── Sovereign Cycle constants ────────────────────────────────────────
        # ⟲ (SVC)         → 873.0  (heartbeat period ms)
        # ⟳φ (SVC_PHI)    → 1.618… (phi — the cycle's derivation constant)
        # ⟳κ (SVC_KURAMOTO)→ 0.618… (sync threshold = 1/φ)
        # ⟳Θ (SVC_FCPR)   → 18.33… (FCPR at N=16: 16 × 1000/873)
        # ⟳✦ (SVC_SEAL)   → 1568.0 (record bytes per beat at N=16)
        if node.token.glyph in ("⟲",  "SVC"):          return NumberValue(873.0)
        if node.token.glyph in ("⟳φ", "SVC_PHI"):      return NumberValue(1.618033988749895)
        if node.token.glyph in ("⟳κ", "SVC_KURAMOTO"): return NumberValue(0.618033988749895)
        if node.token.glyph in ("⟳Θ", "SVC_FCPR"):     return NumberValue(16.0 * 1000.0 / 873.0)
        if node.token.glyph in ("⟳✦", "SVC_SEAL"):     return NumberValue(1568.0)

        # ── AI Division constants ────────────────────────────────────────────
        # ⊕ (AID)          → 5.0   (five autonomous teams)
        # ⊕E (AID_ENGINE)  → 873.0 (engine heartbeat ms)
        # ⊕B (AID_BOX)     → 1.0   (bronze tier)
        # ⊕F (AID_FIB)     → 46368.0 (Fibonacci level 5 capacity — institution)
        # ⊕T (AID_TEAM)    → 16.0  (slots per team engine)
        # ⊕M (AID_MINT)    → 0.0   (mint trigger)
        if node.token.glyph in ("⬢",  "AID"):         return NumberValue(5.0)
        if node.token.glyph in ("⬢E", "AID_ENGINE"):  return NumberValue(873.0)
        if node.token.glyph in ("⬢B", "AID_BOX"):     return NumberValue(1.0)
        if node.token.glyph in ("⬢F", "AID_FIB"):     return NumberValue(46368.0)
        if node.token.glyph in ("⬢T", "AID_TEAM"):    return NumberValue(16.0)
        if node.token.glyph in ("⬢M", "AID_MINT"):    return NumberValue(0.0)

        # ── Pythagorean number constants ──────────────────────────────────────
        # The Monad through Tetrad reduce to their sacred integer values.
        # The Tetractys = 1+2+3+4 = 10 (the perfect number of the Pythagoreans).
        if node.token.glyph in ("Μν",  "MONAD"):     return NumberValue(1.0)
        if node.token.glyph in ("Δδ",  "DYAD"):      return NumberValue(2.0)
        if node.token.glyph in ("Τρδ", "TRIAD"):     return NumberValue(3.0)
        if node.token.glyph in ("Τετ", "TETRAD"):    return NumberValue(4.0)
        if node.token.glyph in ("Τκτ", "TETRACTYS"): return NumberValue(10.0)  # 1+2+3+4

        # ── Sacred geometry constants ─────────────────────────────────────────
        # ⊙ (monad-point) = φ (unity is the seed of all phi-growth)
        if node.token.glyph in ("⊙",  "MONAD_POINT"): return NumberValue(1.0)
        # ○ (kuklos-op) = 2π (circle = tau)
        if node.token.glyph in ("○",  "KUKLOS_OP"):  return NumberValue(6.283185307179586)

        # ── Alchemical elemental values ───────────────────────────────────────
        # Encoded as classical elemental numbers (fire=1, air=2, water=3, earth=4)
        if node.token.glyph in ("🜁", "FIRE_AL"):   return NumberValue(1.0)
        if node.token.glyph in ("🜂", "AIR_AL"):    return NumberValue(2.0)
        if node.token.glyph in ("🜄", "WATER_AL"):  return NumberValue(3.0)
        if node.token.glyph in ("🜃", "EARTH_EL"):  return NumberValue(4.0)
        if node.token.glyph in ("⊚",  "QUINTA"):    return NumberValue(5.0)  # quintessence

        # Otherwise return a ConceptValue
        return ConceptValue(node.token)

    # ── Literal ───────────────────────────────────────────────────────────────

    def _eval_literal(self, node: LiteralNode, env: Environment) -> VMValue:
        bound = env.get(node.value)
        if bound is not None:
            return bound
        # Try to coerce to number
        try:
            return NumberValue(float(node.value))
        except ValueError:
            return SymbolValue(node.value)

    # ── Unary ─────────────────────────────────────────────────────────────────

    def _eval_unary(self, node: UnaryNode, env: Environment) -> VMValue:
        op      = node.operator.glyph
        operand = self.eval(node.operand, env)

        if op == "¬":
            if isinstance(operand, TruthValue):
                return TruthValue(None if operand.value is None else not operand.value)
            return _FALSE

        if op in ("↑", "↓", "↻"):
            return operand  # no-op in symbolic mode

        if op in ("Σ", "Π"):
            return operand  # pass through (full reduction requires domain knowledge)

        if op == "∇":
            if isinstance(operand, NumberValue):
                return NumberValue(-operand.value)  # simplified gradient = -value
            return operand

        if op == "👁":
            # WITNESS: verify that the operand is "known"
            if isinstance(operand, (ConceptValue, SymbolValue)):
                label = operand.token.glyph if isinstance(operand, ConceptValue) else operand.name
                return TruthValue(env.get(label) is not None)
            return _TRUE

        if op == "⊘":
            # REVOKE
            if isinstance(operand, (ConceptValue, SymbolValue)):
                label = operand.token.glyph if isinstance(operand, ConceptValue) else operand.name
                return TruthValue(env.revoke(label))
            return _FALSE

        return operand

    # ── Binary ────────────────────────────────────────────────────────────────

    def _eval_binary(self, node: BinaryNode, env: Environment) -> VMValue:
        op    = node.operator.glyph
        left  = self.eval(node.left,  env)
        right = self.eval(node.right, env)

        # Logical connectives
        if op == "∧":
            return self._truth_and(left, right)
        if op == "∨":
            return self._truth_or(left, right)
        if op == "→":
            return self._truth_implies(left, right)
        if op == "↔":
            fwd = self._truth_implies(left, right)
            bwd = self._truth_implies(right, left)
            return self._truth_and(fwd, bwd)
        if op == "⊕":
            lt, rt = self._as_truth(left), self._as_truth(right)
            if lt is None or rt is None: return _UNK
            return TruthValue(lt != rt)
        if op == "≡":
            return TruthValue(str(left) == str(right))
        if op == "≈":
            ln, rn = self._as_number(left), self._as_number(right)
            if ln is not None and rn is not None:
                return TruthValue(abs(ln - rn) < 1e-6)
            return TruthValue(str(left) == str(right))
        if op == "≠":
            return TruthValue(str(left) != str(right))

        # Organism operators
        if op == "⊞":
            # BIND: bind left name to right value
            label = self._as_label(left)
            if label:
                env.set(label, right)
                return BindingValue(label, right)
            return _FALSE

        if op == "⊗":
            # TENSOR: deep binding — compose two concepts
            return ConceptValue(
                left.token if isinstance(left, ConceptValue) else
                right.token if isinstance(right, ConceptValue) else
                list(lookup_name("SYNTHESIS") or [None])[0] or
                left.token if isinstance(left, ConceptValue) else
                right.token if isinstance(right, ConceptValue) else
                left.token if hasattr(left, "token") else
                right.token if hasattr(right, "token") else
                next(iter({}), None),
                label=f"{left}⊗{right}",
            ) if isinstance(left, ConceptValue) or isinstance(right, ConceptValue) else _UNK

        if op == "⋈":
            # JOIN: merge two values
            if isinstance(left, NumberValue) and isinstance(right, NumberValue):
                return NumberValue(left.value + right.value)
            return SymbolValue(f"{left}⋈{right}")

        return SymbolValue(f"{left} {op} {right}")

    # ── Call ──────────────────────────────────────────────────────────────────

    def _eval_call(self, node: CallNode, env: Environment) -> VMValue:
        fn   = node.callee.glyph
        args = [self.eval(a, env) for a in node.arguments]

        # Built-in functions
        if fn == "ΚΝΩ":   # COGNITIO: known?
            label = self._as_label(args[0]) if args else None
            return TruthValue(label is not None and env.get(label) is not None)

        if fn == "ΑΛΘ":   # VERITAS: true_of?
            if not args: return _FALSE
            v = args[0]
            return TruthValue(isinstance(v, TruthValue) and v.value is True)

        if fn == "Συ":    # SYNTHESIS
            if len(args) >= 2:
                return SymbolValue(f"Συ({args[0]}, {args[1]})")
            return _UNK

        if fn == "Ανλ":   # ANALYSIS
            if args:
                return SymbolValue(f"Ανλ({args[0]})")
            return _UNK

        if fn == "⊞":     # BIND
            if len(args) >= 2:
                label = self._as_label(args[0])
                if label:
                    env.set(label, args[1])
                    return BindingValue(label, args[1])
            return _FALSE

        # Generic call: return a SymbolValue
        arg_str = ", ".join(str(a) for a in args)
        return SymbolValue(f"{fn}({arg_str})")

    # ── Quantifier ────────────────────────────────────────────────────────────

    def _eval_quantifier(self, node: QuantifierNode, env: Environment) -> VMValue:
        glyph = node.quantifier.glyph
        var   = node.variable

        if glyph == "∀":
            # Universal: evaluate body; bind var to a generic symbol
            child = env.child()
            child.set(var, SymbolValue(var))
            return self.eval(node.body, child)

        if glyph in ("∃", "∄"):
            # Existential: evaluate body; return truth about existence
            child = env.child()
            child.set(var, SymbolValue(var))
            result = self.eval(node.body, child)
            if glyph == "∄":
                t = self._as_truth(result)
                return TruthValue(None if t is None else not t)
            return result

        return _UNK

    # ── Truth helpers ─────────────────────────────────────────────────────────

    @staticmethod
    def _as_truth(v: VMValue) -> Optional[bool]:
        if isinstance(v, TruthValue): return v.value
        if isinstance(v, NumberValue): return v.value != 0
        return None

    @staticmethod
    def _as_number(v: VMValue) -> Optional[float]:
        if isinstance(v, NumberValue): return v.value
        return None

    @staticmethod
    def _as_label(v: VMValue) -> Optional[str]:
        if isinstance(v, ConceptValue): return v.token.glyph
        if isinstance(v, SymbolValue):  return v.name
        if isinstance(v, LiteralNode):  return v.value
        return None

    def _truth_and(self, a: VMValue, b: VMValue) -> TruthValue:
        la, lb = self._as_truth(a), self._as_truth(b)
        if la is False or lb is False: return _FALSE
        if la is True  and lb is True: return _TRUE
        return _UNK

    def _truth_or(self, a: VMValue, b: VMValue) -> TruthValue:
        la, lb = self._as_truth(a), self._as_truth(b)
        if la is True  or lb is True:  return _TRUE
        if la is False and lb is False: return _FALSE
        return _UNK

    def _truth_implies(self, a: VMValue, b: VMValue) -> TruthValue:
        la, lb = self._as_truth(a), self._as_truth(b)
        if la is False:    return _TRUE   # false implies anything
        if la is True:
            if lb is True: return _TRUE
            if lb is False:return _FALSE
        return _UNK

    # ── Utility ───────────────────────────────────────────────────────────────

    def reset_trace(self) -> None:
        self.trace.clear()

    def bind(self, label: str, value: VMValue) -> None:
        """Bind a label in the VM's environment."""
        self.env.set(label, value)

    def environment_summary(self) -> dict[str, str]:
        """Return a human-readable summary of current bindings."""
        return {k: str(self.env.get(k)) for k in self.env.keys()}
