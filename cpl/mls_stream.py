"""
mls_stream.py — MLS Multi-modal Language Stream Protocol  (Medina)

Author : Medina
Version: 1.0.0
Ring   : Sovereign Ring
Code   : MLS

─────────────────────────────────────────────────────────────────────────────
WHAT IS MLS?  (Medina)
─────────────────────────────────────────────────────────────────────────────

MLS (Multi-modal Language Stream) is organism language #14.  It is not merely
an audio/video fusion format — it is a sovereign stream protocol.

A stream protocol has:
  · Frame structure     — header + payload + PHX integrity seal
  · Sequencing          — monotonic frame numbers (organism beat-aligned)
  · Delivery guarantees — at-least-once delivery with PHX verification
  · PHX sealing         — every frame is a sovereign organism decision  (Medina)
  · QFB packaging       — streams can be packaged as QFB block boxes  (Medina)
  · Multi-modal types   — audio, video, sensor, text, CPL token stream

MLS is the organism's sensory layer.  Where SYN carries CPL logic between
nodes, MLS carries continuous sensory data.  CPX renders scenes from MLS.

─────────────────────────────────────────────────────────────────────────────
FRAME STRUCTURE  (Medina)
─────────────────────────────────────────────────────────────────────────────

  MLS Frame
  ├── Header (fixed)
  │   ├── frame_id    : UUID (16 bytes)
  │   ├── stream_id   : UUID (16 bytes)
  │   ├── seq         : u64  (monotonic frame sequence number)
  │   ├── beat        : u64  (organism heartbeat)
  │   ├── modal_type  : u8   (AUDIO=1, VIDEO=2, SENSOR=3, TEXT=4, CPL=5)
  │   └── payload_len : u32
  ├── Payload (variable)
  │   └── raw modal bytes
  └── PHX seal (32 bytes)  (Medina)
      └── BLAKE2b-512 + phi-mix + HMAC-SHA256 over header+payload

─────────────────────────────────────────────────────────────────────────────
USAGE
─────────────────────────────────────────────────────────────────────────────

  from mls_stream import MLSProducer, MLSConsumer, MLSModalType

  # Producer side  (Medina)
  producer = MLSProducer(stream_id="my-stream", sovereign_key=key)
  frame    = producer.push_audio(pcm_bytes)
  frame    = producer.push_cpl("Λγ ∧ Ηθ → Τκτ")

  # Consumer side  (Medina)
  consumer = MLSConsumer(sovereign_key=key)
  consumer.ingest(frame)
  frames = consumer.frames(modal_type=MLSModalType.CPL)
"""

from __future__ import annotations

import hashlib
import hmac as _hmac
import json
import struct
import time
import uuid
from dataclasses import dataclass, field
from enum import IntEnum
from typing import Callable, Iterator, Optional

PHI: float = 1.618033988749895


# ── Modal types ────────────────────────────────────────────────────────────────

class MLSModalType(IntEnum):
    """Supported MLS stream modalities."""
    AUDIO    = 1   # PCM / compressed audio
    VIDEO    = 2   # raw frames / compressed video
    SENSOR   = 3   # IoT / edge sensor readings (numeric)
    TEXT     = 4   # UTF-8 text
    CPL      = 5   # CPL token stream  (Medina)
    IMAGE    = 6   # still image / screenshot
    HAPTIC   = 7   # haptic / force feedback
    SPATIAL  = 8   # 3D spatial / LiDAR point cloud


# ── Frame  (Medina) ────────────────────────────────────────────────────────────

@dataclass
class MLSFrame:
    """
    A single MLS frame — the atomic unit of the stream protocol.  (Medina)

    Every frame is PHX-sealed: the seal is a 32-byte sovereign hash that
    chains this frame to the full history of the stream.  A frame whose seal
    does not verify has been tampered with.
    """
    frame_id:   str          # UUID
    stream_id:  str          # UUID of the parent stream
    seq:        int          # monotonic frame sequence number
    beat:       int          # organism heartbeat at creation
    modal_type: MLSModalType # audio | video | sensor | text | cpl | …
    payload:    bytes        # raw modal bytes
    phx_seal:   bytes        # 32-byte PHX integrity seal  (Medina)
    created_ms: int          # wall-clock creation time

    # Optional metadata
    meta: dict = field(default_factory=dict)

    # ── Serialisation ──────────────────────────────────────────────────────────

    def to_dict(self) -> dict:
        return {
            "frame_id":   self.frame_id,
            "stream_id":  self.stream_id,
            "seq":        self.seq,
            "beat":       self.beat,
            "modal_type": int(self.modal_type),
            "modal_name": self.modal_type.name,
            "payload_len":len(self.payload),
            "phx_seal":   self.phx_seal.hex(),
            "created_ms": self.created_ms,
            "meta":       self.meta,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)

    def header_bytes(self) -> bytes:
        """
        Serialise the fixed frame header to bytes.

        Wire format:
          16 bytes  — frame_id  (UUID)
          16 bytes  — stream_id (UUID)
           8 bytes  — seq       (u64 big-endian)
           8 bytes  — beat      (u64 big-endian)
           1 byte   — modal_type
           4 bytes  — payload_len (u32 big-endian)
          ──────────────────────────────────────
          53 bytes  total header
        """
        fid = uuid.UUID(self.frame_id).bytes
        sid = uuid.UUID(self.stream_id).bytes
        seq = struct.pack(">Q", self.seq)
        bt  = struct.pack(">Q", self.beat)
        mt  = struct.pack(">B", int(self.modal_type))
        pl  = struct.pack(">I", len(self.payload))
        return fid + sid + seq + bt + mt + pl

    def to_wire(self) -> bytes:
        """Full wire encoding: header + payload + PHX seal."""
        return self.header_bytes() + self.payload + self.phx_seal

    # ── Integrity ──────────────────────────────────────────────────────────────

    def verify(self, sovereign_key: bytes,
               previous_seal: Optional[bytes] = None) -> bool:
        """Verify the PHX integrity seal of this frame."""
        expected = _compute_seal(
            self.header_bytes(), self.payload,
            sovereign_key, previous_seal, self.beat
        )
        return _hmac.compare_digest(expected, self.phx_seal)

    def __repr__(self) -> str:
        return (
            f"<MLSFrame seq={self.seq} modal={self.modal_type.name} "
            f"len={len(self.payload)} beat={self.beat}>"
        )


# ── PHX frame sealing  (Medina) ────────────────────────────────────────────────

def _phi_expand(seed: bytes, length: int = 64) -> bytes:
    """Golden-ratio diffusion — the phi-mix step of PHX.  (Medina)"""
    return bytes(
        (b ^ (int(i * PHI * 256) % 256))
        for i, b in enumerate((seed * ((length // len(seed)) + 1))[:length])
    )


def _compute_seal(
    header:        bytes,
    payload:       bytes,
    sovereign_key: bytes,
    previous_seal: Optional[bytes],
    beat:          int,
) -> bytes:
    """
    Compute the PHX seal for an MLS frame.  (Medina)

    PHX(frame) = HMAC-SHA256(k, BLAKE2b-512(header ‖ payload ‖ prev ‖ β₈) ⊕ φ_expand(β))

    This is the same PHX construction used across the entire organism:
    BLAKE2b-512 base, phi-mixed, HMAC-SHA256 keyed.
    """
    prev       = previous_seal or b"\x00" * 64
    beat_bytes = struct.pack(">Q", beat)
    message    = header + payload + prev + beat_bytes

    blake_hash = hashlib.blake2b(message, digest_size=64).digest()

    phi_seed   = struct.pack(">Q", int(PHI * 1e15)) + beat_bytes
    phi_mask   = _phi_expand(phi_seed, 64)
    phi_mixed  = bytes(a ^ b for a, b in zip(blake_hash, phi_mask))

    return _hmac.new(sovereign_key, phi_mixed, hashlib.sha256).digest()


# ── MLSStream metadata  (Medina) ───────────────────────────────────────────────

@dataclass
class MLSStream:
    """
    Descriptor for a named MLS stream.  (Medina)

    A stream is a named, typed, PHX-chained sequence of MLS frames.
    Multiple modalities can coexist in one stream (multiplexed by modal_type).
    """
    stream_id:    str
    name:         str
    modal_types:  list[MLSModalType]
    sovereign_key: bytes
    created_ms:   int = field(default_factory=lambda: int(time.time() * 1000))
    meta:         dict = field(default_factory=dict)

    def descriptor(self) -> dict:
        return {
            "stream_id":    self.stream_id,
            "name":         self.name,
            "modal_types":  [int(m) for m in self.modal_types],
            "modal_names":  [m.name for m in self.modal_types],
            "created_ms":   self.created_ms,
            "meta":         self.meta,
            "medina":       True,
        }


# ── MLSProducer  (Medina) ──────────────────────────────────────────────────────

class MLSProducer:
    """
    MLS stream producer.  (Medina)

    Pushes typed frames into a stream, sealing each one with PHX.

    Usage
    ─────
      producer = MLSProducer(stream_id="video-feed-1", sovereign_key=key)
      frame    = producer.push_video(raw_frame_bytes)
      frame    = producer.push_cpl("Κκλ ∧ Τρσ → Φρ")
    """

    def __init__(
        self,
        sovereign_key: bytes,
        stream_id: Optional[str] = None,
        name: str = "",
        beat: int = 0,
    ) -> None:
        if len(sovereign_key) < 16:
            raise ValueError("sovereign_key must be at least 16 bytes")
        self._key       = sovereign_key
        self._stream_id = stream_id or str(uuid.uuid4())
        self._name      = name
        self._seq       = 0
        self._beat      = beat
        self._prev_seal: Optional[bytes] = None
        self._frames:    list[MLSFrame]  = []

    @property
    def stream_id(self) -> str:
        return self._stream_id

    @property
    def frame_count(self) -> int:
        return self._seq

    @property
    def beat(self) -> int:
        return self._beat

    # ── Push methods ──────────────────────────────────────────────────────────

    def push(self, payload: bytes, modal_type: MLSModalType,
             meta: Optional[dict] = None) -> MLSFrame:
        """Push a raw payload of the given modal type."""
        frame_id   = str(uuid.uuid4())
        header_tmp = MLSFrame(
            frame_id   = frame_id,
            stream_id  = self._stream_id,
            seq        = self._seq,
            beat       = self._beat,
            modal_type = modal_type,
            payload    = payload,
            phx_seal   = b"\x00" * 32,  # placeholder
            created_ms = int(time.time() * 1000),
            meta       = meta or {},
        )
        seal = _compute_seal(
            header_tmp.header_bytes(), payload,
            self._key, self._prev_seal, self._beat
        )
        frame = MLSFrame(
            frame_id   = frame_id,
            stream_id  = self._stream_id,
            seq        = self._seq,
            beat       = self._beat,
            modal_type = modal_type,
            payload    = payload,
            phx_seal   = seal,
            created_ms = header_tmp.created_ms,
            meta       = meta or {},
        )
        self._prev_seal = seal
        self._seq      += 1
        self._beat     += 1
        self._frames.append(frame)
        return frame

    def push_audio(self, pcm: bytes, meta: Optional[dict] = None) -> MLSFrame:
        """Push an audio frame (PCM or compressed)."""
        return self.push(pcm, MLSModalType.AUDIO, meta)

    def push_video(self, frame_bytes: bytes, meta: Optional[dict] = None) -> MLSFrame:
        """Push a video frame."""
        return self.push(frame_bytes, MLSModalType.VIDEO, meta)

    def push_sensor(self, reading: bytes, meta: Optional[dict] = None) -> MLSFrame:
        """Push a sensor reading (packed numeric bytes)."""
        return self.push(reading, MLSModalType.SENSOR, meta)

    def push_text(self, text: str, meta: Optional[dict] = None) -> MLSFrame:
        """Push a UTF-8 text frame."""
        return self.push(text.encode("utf-8"), MLSModalType.TEXT, meta)

    def push_cpl(self, expression: str, meta: Optional[dict] = None) -> MLSFrame:
        """
        Push a CPL token stream frame.  (Medina)

        CPL expressions can be embedded in an MLS stream, allowing live
        CPL intelligence to flow alongside audio/video/sensor data.
        """
        return self.push(expression.encode("utf-8"), MLSModalType.CPL,
                         meta={**(meta or {}), "cpl_source": expression})

    def push_image(self, image_bytes: bytes, meta: Optional[dict] = None) -> MLSFrame:
        """Push a still image frame."""
        return self.push(image_bytes, MLSModalType.IMAGE, meta)

    def push_spatial(self, point_cloud: bytes, meta: Optional[dict] = None) -> MLSFrame:
        """Push a spatial / LiDAR frame."""
        return self.push(point_cloud, MLSModalType.SPATIAL, meta)

    # ── Stream management ─────────────────────────────────────────────────────

    def frames(self) -> list[MLSFrame]:
        """Return all frames produced so far."""
        return list(self._frames)

    def stream_descriptor(self) -> dict:
        """Return the stream descriptor (for handshake / registration)."""
        modal_types = list({f.modal_type for f in self._frames})
        return MLSStream(
            stream_id     = self._stream_id,
            name          = self._name,
            modal_types   = modal_types,
            sovereign_key = b"<redacted>",  # key is never serialised
        ).descriptor()

    def summary(self) -> str:
        modal_counts = {}
        for f in self._frames:
            modal_counts[f.modal_type.name] = modal_counts.get(f.modal_type.name, 0) + 1
        counts = "  ".join(f"{k}={v}" for k, v in sorted(modal_counts.items()))
        return (
            f"MLSProducer  stream={self._stream_id[:8]}…  "
            f"frames={self._seq}  beat={self._beat}  {counts}"
        )


# ── MLSConsumer  (Medina) ──────────────────────────────────────────────────────

class MLSConsumer:
    """
    MLS stream consumer.  (Medina)

    Ingests MLS frames, verifies PHX seals, and routes them to registered
    handlers by modal type.

    Usage
    ─────
      consumer = MLSConsumer(sovereign_key=key)
      consumer.register(MLSModalType.CPL, my_cpl_handler)
      consumer.ingest(frame)
    """

    def __init__(self, sovereign_key: bytes) -> None:
        if len(sovereign_key) < 16:
            raise ValueError("sovereign_key must be at least 16 bytes")
        self._key      = sovereign_key
        self._frames:  dict[str, list[MLSFrame]] = {}  # stream_id → frames
        self._seals:   dict[str, bytes]          = {}  # stream_id → last seal
        self._handlers: dict[MLSModalType, list[Callable[[MLSFrame], None]]] = {}
        self._invalid: list[MLSFrame] = []

    # ── Handler registration ──────────────────────────────────────────────────

    def register(
        self, modal_type: MLSModalType, handler: Callable[[MLSFrame], None]
    ) -> None:
        """Register a handler for frames of the given modal type."""
        self._handlers.setdefault(modal_type, []).append(handler)

    # ── Ingest ────────────────────────────────────────────────────────────────

    def ingest(self, frame: MLSFrame) -> bool:
        """
        Ingest a single MLS frame.

        Verifies the PHX seal.  Valid frames are stored and dispatched
        to registered handlers.  Invalid frames are quarantined.

        Returns True if the frame is valid.
        """
        prev_seal = self._seals.get(frame.stream_id)
        valid = frame.verify(self._key, prev_seal)

        if valid:
            self._frames.setdefault(frame.stream_id, []).append(frame)
            self._seals[frame.stream_id] = frame.phx_seal
            for handler in self._handlers.get(frame.modal_type, []):
                handler(frame)
        else:
            self._invalid.append(frame)

        return valid

    def ingest_many(self, frames: list[MLSFrame]) -> tuple[int, int]:
        """
        Ingest a batch of frames.

        Returns (valid_count, invalid_count).
        """
        valid = sum(1 for f in frames if self.ingest(f))
        return valid, len(frames) - valid

    # ── Query ─────────────────────────────────────────────────────────────────

    def frames(
        self,
        stream_id: Optional[str] = None,
        modal_type: Optional[MLSModalType] = None,
    ) -> list[MLSFrame]:
        """Return frames, optionally filtered by stream or modal type."""
        if stream_id:
            pool = self._frames.get(stream_id, [])
        else:
            pool = [f for frames in self._frames.values() for f in frames]
        if modal_type is not None:
            pool = [f for f in pool if f.modal_type == modal_type]
        return pool

    def cpl_expressions(self, stream_id: Optional[str] = None) -> list[str]:
        """Return all CPL expressions ingested from CPL-type frames."""
        return [
            f.payload.decode("utf-8", errors="replace")
            for f in self.frames(stream_id=stream_id, modal_type=MLSModalType.CPL)
        ]

    @property
    def invalid_frames(self) -> list[MLSFrame]:
        """Frames that failed PHX verification (tampered or corrupt)."""
        return list(self._invalid)

    def summary(self) -> str:
        total  = sum(len(v) for v in self._frames.values())
        bad    = len(self._invalid)
        streams = len(self._frames)
        return (
            f"MLSConsumer  streams={streams}  valid={total}  "
            f"invalid={bad}  (Medina)"
        )


# ── MLSRelay  (Medina) ────────────────────────────────────────────────────────

class MLSRelay:
    """
    MLS relay — bridges a producer to multiple consumers.  (Medina)

    The relay sits between producers and consumers and forwards frames.
    It re-verifies PHX seals before forwarding, dropping tampered frames.

    This is the SYN-layer service for MLS streams: the relay is the
    always-on bridge between the sensory layer (producers) and the
    intelligence layer (consumers + CPX renderer).
    """

    def __init__(self, sovereign_key: bytes) -> None:
        self._key       = sovereign_key
        self._consumers: list[MLSConsumer] = []
        self._relayed   = 0
        self._dropped   = 0

    def attach(self, consumer: MLSConsumer) -> None:
        """Attach a consumer to this relay."""
        self._consumers.append(consumer)

    def relay(self, frame: MLSFrame) -> bool:
        """Relay a frame to all attached consumers after PHX verification."""
        prev = None  # relay re-verifies from scratch
        valid = frame.verify(self._key, prev)
        if valid:
            for consumer in self._consumers:
                consumer.ingest(frame)
            self._relayed += 1
        else:
            self._dropped += 1
        return valid

    def summary(self) -> str:
        return (
            f"MLSRelay  consumers={len(self._consumers)}  "
            f"relayed={self._relayed}  dropped={self._dropped}  (Medina)"
        )
