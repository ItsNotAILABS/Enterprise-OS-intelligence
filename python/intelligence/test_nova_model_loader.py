"""
test_nova_model_loader.py — Tests for Nova model loading primitives
"""

import os
import struct
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from nova_model_loader import GGUFParser, GGUF_MAGIC, ModelFormat


def test_gguf_parse_header_missing_file_returns_default(tmp_path):
    parser = GGUFParser(str(tmp_path / "missing.gguf"))
    meta = parser.parse_header()
    assert meta.format == ModelFormat.GGUF
    assert meta.file_size_bytes == 0
    assert meta.n_layers > 0


def test_gguf_parse_header_invalid_magic_raises(tmp_path):
    p = tmp_path / "bad.gguf"
    p.write_bytes(struct.pack("<I", 0xDEADBEEF) + b"\x00" * 20)

    parser = GGUFParser(str(p))
    with pytest.raises(ValueError, match="Invalid GGUF magic"):
        parser.parse_header()


def test_gguf_parse_header_valid_minimal_header(tmp_path):
    p = tmp_path / "ok.gguf"
    version = 3
    tensor_count = 50
    kv_count = 0
    data = (
        struct.pack("<I", GGUF_MAGIC)
        + struct.pack("<I", version)
        + struct.pack("<Q", tensor_count)
        + struct.pack("<Q", kv_count)
    )
    p.write_bytes(data)

    parser = GGUFParser(str(p))
    meta = parser.parse_header()
    assert meta.format == ModelFormat.GGUF
    assert meta.file_size_bytes == len(data)
    assert meta.n_layers == tensor_count // 10


def test_gguf_memory_map_missing_file_is_false(tmp_path):
    parser = GGUFParser(str(tmp_path / "missing.gguf"))
    assert parser.memory_map() is False


def test_gguf_memory_map_existing_file_is_true_and_close_is_idempotent(tmp_path):
    p = tmp_path / "ok.gguf"
    p.write_bytes(struct.pack("<I", GGUF_MAGIC) + b"\x00" * 64)

    parser = GGUFParser(str(p))
    assert parser.memory_map() is True
    parser.close()
    parser.close()

