"""
syn_client.py — Python SYN Synapse Binding Engine Client

Pure-Python port of the SYN Binding Engine for the organism's intelligence layer.

Operations
----------
synBind(label, canister_id, data_key)   → query once, imprint locally forever
synQuery(label)                          → pure local read, no network, instant
synRevoke(label)                         → destroy one binding
synRevokeAll()                           → nuclear — all bindings gone
synBindAll(fleet, ai, nns, heart)        → boot helper, four bindings in one call

Bindings are persisted to a JSON file so they survive process restarts
(equivalent to ICP stable memory).

Ring: Sovereign Ring | Wire: intelligence-wire/syn
"""

from __future__ import annotations

import json
import time
import uuid
import os
from dataclasses import dataclass, field, asdict
from typing import Any, Optional
from pathlib import Path


# ── Constants ──────────────────────────────────────────────────────────────────

PHI          = 1.618033988749895
HEARTBEAT_MS = 873
MAX_BINDINGS = 64

# ── SynBinding ─────────────────────────────────────────────────────────────────

@dataclass
class SynBinding:
    label:         str
    canister_id:   str
    data_key:      str
    raw_snapshot:  str  = "{}"
    imprinted:     int  = field(default_factory=lambda: int(time.time() * 1000))
    refreshed:     int  = field(default_factory=lambda: int(time.time() * 1000))
    refresh_count: int  = 0

    @property
    def staleness_ms(self) -> int:
        """Milliseconds since last refresh."""
        return int(time.time() * 1000) - self.refreshed

    @property
    def age_ms(self) -> int:
        """Milliseconds since first imprint."""
        return int(time.time() * 1000) - self.imprinted

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "SynBinding":
        return cls(**d)

    def __str__(self) -> str:
        return (
            f"SynBinding(label={self.label!r}, canister_id={self.canister_id!r}, "
            f"data_key={self.data_key!r}, refresh_count={self.refresh_count}, "
            f"staleness={self.staleness_ms}ms)"
        )


# ── SynClient ──────────────────────────────────────────────────────────────────

class SynClient:
    """
    Python SYN Synapse Binding Engine client.

    Parameters
    ----------
    persist_path:
        Optional file path for JSON persistence (survives process restarts).
        Set to None to keep bindings in-memory only.
    canister_endpoint:
        Base URL of the IC replica gateway (default: https://ic0.app).
    """

    def __init__(
        self,
        persist_path: Optional[str] = None,
        canister_endpoint: str = "https://ic0.app",
    ) -> None:
        self._endpoint = canister_endpoint
        self._persist_path = Path(persist_path) if persist_path else None
        self._bindings: dict[str, SynBinding] = {}

        if self._persist_path and self._persist_path.exists():
            self._load()

    # ── Core SYN operations ───────────────────────────────────────────────────

    def syn_bind(
        self,
        label: str,
        canister_id: str,
        data_key: str,
    ) -> SynBinding:
        """
        Query the remote canister once and imprint the snapshot locally.

        In a production ICP deployment, this sends an authenticated query
        call to ``canister_id`` and receives the serialised snapshot.
        Here, a placeholder JSON is used and you can subclass
        :meth:`_fetch_snapshot` to plug in the real IC agent.
        """
        if len(self._bindings) >= MAX_BINDINGS and label not in self._bindings:
            raise OrganismError(f"MAX_BINDINGS ({MAX_BINDINGS}) reached")

        snapshot = self._fetch_snapshot(canister_id, data_key)
        now = int(time.time() * 1000)
        existing = self._bindings.get(label)

        binding = SynBinding(
            label         = label,
            canister_id   = canister_id,
            data_key      = data_key,
            raw_snapshot  = snapshot,
            imprinted     = existing.imprinted if existing else now,
            refreshed     = now,
            refresh_count = (existing.refresh_count + 1) if existing else 0,
        )
        self._bindings[label] = binding
        self._persist()
        return binding

    def syn_query(self, label: str) -> Optional[SynBinding]:
        """Pure local read — no network, no cycles, instant."""
        return self._bindings.get(label)

    def syn_revoke(self, label: str) -> bool:
        """Destroy a binding.  Returns True if it existed."""
        existed = label in self._bindings
        if existed:
            del self._bindings[label]
            self._persist()
        return existed

    def syn_revoke_all(self) -> int:
        """Nuclear — every binding deleted.  Returns count removed."""
        count = len(self._bindings)
        self._bindings.clear()
        self._persist()
        return count

    def syn_bind_all(
        self,
        fleet_id: str,
        ai_id:    str,
        nns_id:   str,
        heart_id: str,
    ) -> dict[str, SynBinding]:
        """Boot helper: bind fleet + ai + nns + HEART in one call."""
        return {
            "fleet": self.syn_bind("fleet", fleet_id, "fleet"),
            "ai":    self.syn_bind("ai",    ai_id,    "ai"),
            "nns":   self.syn_bind("nns",   nns_id,   "nns"),
            "HEART": self.syn_bind("HEART", heart_id, "heart"),
        }

    # ── Diagnostics ───────────────────────────────────────────────────────────

    def status(self) -> list[dict]:
        """Return status of all active bindings (metadata, not raw snapshot)."""
        return [
            {
                "label":         b.label,
                "canister_id":   b.canister_id,
                "data_key":      b.data_key,
                "refresh_count": b.refresh_count,
                "staleness_ms":  b.staleness_ms,
                "age_ms":        b.age_ms,
            }
            for b in self._bindings.values()
        ]

    def binding_count(self) -> int:
        return len(self._bindings)

    # ── Phi math helpers (local, zero network) ────────────────────────────────

    @staticmethod
    def phi_score(priority: int, capability: float, reputation: float) -> float:
        """S(m) = φ^(4 − priority) × capability × reputation"""
        return (PHI ** (4 - priority)) * capability * reputation

    @staticmethod
    def phi_ema(old_value: float, observation: float) -> float:
        """Exponential moving average with alpha = 1/φ."""
        alpha = 1.0 / PHI
        return alpha * observation + (1.0 - alpha) * old_value

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _fetch_snapshot(self, canister_id: str, data_key: str) -> str:
        """
        Fetch a snapshot from a remote canister.

        Override this method in production to use the IC HTTP gateway
        or an IC agent library (e.g. ``ic-py``).
        """
        # Placeholder: return a minimal JSON envelope
        return json.dumps({
            "canister_id": canister_id,
            "data_key":    data_key,
            "timestamp":   int(time.time() * 1000),
            "_source":     "syn_client_placeholder",
        })

    def _persist(self) -> None:
        if not self._persist_path:
            return
        data = {label: b.to_dict() for label, b in self._bindings.items()}
        self._persist_path.parent.mkdir(parents=True, exist_ok=True)
        self._persist_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def _load(self) -> None:
        try:
            raw = json.loads(self._persist_path.read_text(encoding="utf-8"))
            self._bindings = {
                label: SynBinding.from_dict(d) for label, d in raw.items()
            }
        except (json.JSONDecodeError, KeyError, TypeError):
            self._bindings = {}


# ── Exception ──────────────────────────────────────────────────────────────────

class OrganismError(Exception):
    """Base exception for the organism Python SDK."""
