"""
cpl_encoder.py — CPL Binary Encoder / Decoder

Encodes CPL source into compact binary form (2 bytes per token + framing)
and decodes back to a canonical CPL string.

Binary format
─────────────
Header (4 bytes):
  Bytes 0-1: magic   0xCPL1  (0xC0, 0xA1 for CPL version 1)
  Byte    2: version 0x01
  Byte    3: token count (max 255 tokens per expression)

Body (2 bytes per token):
  Each 16-bit word = token code from cpl_tokens.BY_CODE
  Special code 0xFFFF = LITERAL_FOLLOWS (next 4 bytes = null-padded ASCII)

Separator between expressions: 0x0000

Ring: Sovereign Ring | Wire: intelligence-wire/cpl
"""

from __future__ import annotations

import struct
from typing import Optional

from cpl_tokens import BY_CODE, ALL_TOKENS, CPLToken, lookup_glyph, lookup_name
from cpl_lexer import tokenise, parse, LexToken, ASTNode


# ── Magic bytes ────────────────────────────────────────────────────────────────

MAGIC_B0 = 0xC0
MAGIC_B1 = 0xA1
VERSION  = 0x01

LITERAL_MARKER = 0xFFFF
SEP_MARKER     = 0x0000


# ── CPLEncoder ────────────────────────────────────────────────────────────────

class CPLEncoder:
    """
    Encode CPL source code to a compact binary bytearray.

    Each token uses exactly 2 bytes (its 16-bit code).
    Unknown words use LITERAL_MARKER + 4-byte ASCII payload.

    Usage
    ─────
    enc = CPLEncoder()
    data = enc.encode("Λγ ∧ Νσ → Φρ")
    # data is a bytes object
    """

    def encode(self, source: str) -> bytes:
        """Encode a CPL expression string to bytes."""
        lex_tokens = tokenise(source)
        codes: list[int] = []

        for tok in lex_tokens:
            if tok.kind == "EOF":
                break
            if tok.kind in ("LPAREN", "RPAREN"):
                # Map parentheses to structural codes
                codes.append(0xFFF0 if tok.kind == "LPAREN" else 0xFFF1)
            elif tok.kind == "COLON":
                codes.append(0xFFF2)
            elif tok.kind == "COMMA":
                codes.append(0xFFF3)
            elif tok.kind == "GLYPH" and tok.token is not None:
                codes.append(tok.token.code)
            elif tok.kind == "LITERAL":
                codes.append(LITERAL_MARKER)
                # Store up to 4 ASCII bytes of the literal
                raw = tok.value[:4].encode("ascii", errors="replace")
                # Pad to 4 bytes
                raw = raw.ljust(4, b"\x00")
                # Encode as two 16-bit words
                codes.append((raw[0] << 8) | raw[1])
                codes.append((raw[2] << 8) | raw[3])

        token_count = min(len(codes), 255)
        # Header
        header = bytes([MAGIC_B0, MAGIC_B1, VERSION, token_count])
        # Body: big-endian 16-bit codes
        body = struct.pack(f">{len(codes)}H", *codes)
        return header + body

    def encode_batch(self, expressions: list[str]) -> bytes:
        """Encode multiple CPL expressions separated by SEP_MARKER."""
        parts = []
        for expr in expressions:
            parts.append(self.encode(expr))
            parts.append(struct.pack(">H", SEP_MARKER))
        return b"".join(parts)


# ── CPLDecoder ────────────────────────────────────────────────────────────────

class CPLDecoder:
    """
    Decode binary-encoded CPL back to a canonical CPL string.

    Usage
    ─────
    dec = CPLDecoder()
    source = dec.decode(data)
    """

    def decode(self, data: bytes) -> str:
        """Decode CPL bytes to a source string."""
        if len(data) < 4:
            raise ValueError("Data too short to be a valid CPL binary")
        if data[0] != MAGIC_B0 or data[1] != MAGIC_B1:
            raise ValueError(f"Invalid CPL magic bytes: {data[0]:02X} {data[1]:02X}")
        if data[2] != VERSION:
            raise ValueError(f"Unsupported CPL version: {data[2]}")

        body = data[4:]
        num_words = len(body) // 2
        if num_words == 0:
            return ""

        words = struct.unpack(f">{num_words}H", body[:num_words * 2])

        parts: list[str] = []
        i = 0
        while i < len(words):
            w = words[i]
            if w == SEP_MARKER:
                break
            if w == LITERAL_MARKER:
                # Next two words are the literal payload
                if i + 2 < len(words):
                    w1, w2 = words[i + 1], words[i + 2]
                    raw = bytes([w1 >> 8, w1 & 0xFF, w2 >> 8, w2 & 0xFF])
                    lit = raw.rstrip(b"\x00").decode("ascii", errors="replace")
                    parts.append(lit)
                    i += 3
                    continue
            elif w == 0xFFF0:
                parts.append("(")
            elif w == 0xFFF1:
                parts.append(")")
            elif w == 0xFFF2:
                parts.append(":")
            elif w == 0xFFF3:
                parts.append(",")
            else:
                tok = BY_CODE.get(w)
                if tok:
                    parts.append(tok.glyph)
                else:
                    parts.append(f"?{w:04X}?")
            i += 1

        return " ".join(parts)

    def decode_batch(self, data: bytes) -> list[str]:
        """Decode batch-encoded CPL expressions (split on SEP_MARKER)."""
        # Split at separator markers
        expressions = []
        start = 0
        i = 4  # skip first header
        while i < len(data) - 1:
            # Look for SEP_MARKER (0x00 0x00) after a valid header
            if data[i] == 0x00 and data[i + 1] == 0x00:
                chunk = data[start:i]
                if len(chunk) >= 4:
                    try:
                        expressions.append(self.decode(chunk))
                    except ValueError:
                        pass
                i += 2
                start = i
                # Look for next header
                if i < len(data) - 3 and data[i] == MAGIC_B0:
                    i += 4  # skip next header
            else:
                i += 2
        return expressions


# ── Phi-compression ratio ─────────────────────────────────────────────────────

def compression_ratio(source: str, encoded: bytes) -> float:
    """
    Compute the compression ratio of CPL encoding vs raw UTF-8.
    Returns bytes_saved / original_bytes.  Positive = compression.
    """
    original = len(source.encode("utf-8"))
    compressed = len(encoded)
    if original == 0:
        return 0.0
    return (original - compressed) / original


# ── Public API ────────────────────────────────────────────────────────────────

_encoder = CPLEncoder()
_decoder = CPLDecoder()


def encode(source: str) -> bytes:
    """Encode CPL source to binary bytes."""
    return _encoder.encode(source)


def decode(data: bytes) -> str:
    """Decode binary CPL bytes to a source string."""
    return _decoder.decode(data)


def roundtrip(source: str) -> str:
    """Encode then decode — useful for testing."""
    return decode(encode(source))
