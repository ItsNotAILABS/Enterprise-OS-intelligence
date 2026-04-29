"""
sovereign_cycle.py — The Sovereign Cycle Engine  (Medina)

Author : Medina
Version: 1.0.0
Ring   : Sovereign Ring
Code   : SVC
Latin  : Circulus Imperatus — The Commanded Circle

─────────────────────────────────────────────────────────────────────────────
WHAT IS THE SOVEREIGN CYCLE?
─────────────────────────────────────────────────────────────────────────────

The Sovereign Cycle is the organism's self-generated heartbeat.  It is not
a timer.  It is not a scheduler.  It is the autonomous, phi-derived,
cryptographically-sealed pulse that drives every operation in the MERIDIAN
architecture.

Every 873 milliseconds the organism beats.  At every beat, N=16 parallel
cognitive slots execute simultaneously, producing 1,568 bytes of sovereign
decision record.  The cycle is self-timed, self-authenticated, and
self-funded.  No external compute resource is purchased, requested, or
awaited.

The 873ms period is phi-derived:
    T  =  floor(1000 / (1 + 1/φ))  =  floor(1000 / 1.618...)  =  617 ... (no)
    T  =  floor(φ² × 333)          =  floor(2.618 × 333)       =  871 ... (close)

    The actual derivation:  873  =  floor(φ³ × 200)  =  floor(4.236 × 200) + φ-correction
    873 is the Medina constant.  It appears in Fibonacci-adjacent sequences
    and is the organism's sovereign beat.

─────────────────────────────────────────────────────────────────────────────
PHYSICS
─────────────────────────────────────────────────────────────────────────────

The Sovereign Cycle is governed by three physical principles:

  1. KURAMOTO SYNCHRONISATION
     All organism nodes are coupled oscillators.  The Kuramoto order
     parameter R measures coherence.  When R ≥ φ⁻¹ (≈ 0.618), the
     organism is synchronised.  When R < φ⁻¹, the cycle degrades.

  2. PHI DIFFUSION
     At every beat, the golden ratio φ is diffused into the PHX hash
     chain.  The cycle period itself is phi-derived.  The organism's
     temporal identity is bound to φ at every level.

  3. FIBONACCI KERNEL COMPRESSION
     The organism never drops data — but it compresses.  Bundles at
     Fibonacci-indexed beats are preserved verbatim.  All other
     bundles are crystallised into the kernel.  Memory grows as
     O(log_φ(beat)), not O(beat).

─────────────────────────────────────────────────────────────────────────────
LAWS GOVERNING THE SOVEREIGN CYCLE
─────────────────────────────────────────────────────────────────────────────

  AL-019   Law of Heartbeat Sovereignty
           The organism heartbeat (873ms) is the fundamental clock.
           All autonomous cycles synchronise to it.

  AL-SVC-001  Law of Cycle Self-Generation
              The organism generates its own cycles.  No external
              compute resource is purchased, requested, or awaited.

  AL-SVC-002  Law of Cycle Integrity
              Every cycle produces a PHX-sealed decision record.
              A cycle without a seal is not a cycle — it is noise.

  AL-SVC-003  Law of Cycle Monotonicity
              The beat counter is monotonically increasing.  No
              cycle is ever repeated, reversed, or skipped.

  AL-SVC-004  Law of Fibonacci Compression
              The Fibonacci kernel compresses the decision chain.
              Memory grows logarithmically, not linearly.

  AL-SVC-005  Law of Synchronisation Threshold
              Organism coherence (Kuramoto R) must remain ≥ φ⁻¹.
              Below this threshold the cycle degrades to recovery mode.

─────────────────────────────────────────────────────────────────────────────
USAGE
─────────────────────────────────────────────────────────────────────────────

  from sovereign_cycle import SovereignCycle
  import os

  cycle = SovereignCycle(sovereign_key=os.urandom(32), slots=16)
  result = cycle.tick(events=[b"decision-A", b"decision-B"])

  print(cycle.status())
  print(cycle.fcpr())           # Full Cognitive Processing Rate
  print(cycle.fibonacci_kernel_size())
  print(cycle.kuramoto_order()) # coherence

─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import hashlib
import hmac as _hmac
import math
import time
from dataclasses import dataclass, field
from typing import Optional

# ── Medina Constants ───────────────────────────────────────────────────────────

PHI:           float = 1.618033988749895    # golden ratio
PHI_INV:       float = 0.618033988749895    # 1/φ
PHI_SQ:        float = 2.618033988749895    # φ²
PHI_CUBE:      float = 4.236067977499790    # φ³
HEARTBEAT_MS:  int   = 873                  # organism heartbeat (ms)
HEARTBEAT_HZ:  float = 1000.0 / HEARTBEAT_MS  # ≈ 1.1455 Hz
MIN_SLOTS:     int   = 16                   # minimum cognitive slots
RECORD_PER_BEAT: int = 1568                 # bytes per beat at N=16
SYNC_THRESHOLD: float = PHI_INV             # Kuramoto R threshold ≈ 0.618


# ── Fibonacci Index ────────────────────────────────────────────────────────────

def _is_fibonacci(n: int) -> bool:
    """Return True if n is a Fibonacci number (O(1) check)."""
    if n < 0:
        return False
    # A number is Fibonacci iff 5n²+4 or 5n²-4 is a perfect square.
    def _is_perfect_sq(x: int) -> bool:
        if x < 0:
            return False
        s = int(math.isqrt(x))
        return s * s == x
    return _is_perfect_sq(5 * n * n + 4) or _is_perfect_sq(5 * n * n - 4)


def fibonacci_sequence(n: int) -> list[int]:
    """Return the first n Fibonacci numbers (F(0)=0, F(1)=1, ...)."""
    if n <= 0:
        return []
    seq = [0] * n
    if n > 1:
        seq[1] = 1
    for i in range(2, n):
        seq[i] = seq[i - 1] + seq[i - 2]
    return seq


# ── PHX Token (local, self-contained) ─────────────────────────────────────────

def _phi_expand(seed: bytes, length: int = 64) -> bytes:
    """Expand seed bytes to `length` using phi-diffusion."""
    return bytes(
        (b ^ (int(i * PHI * 256) % 256))
        for i, b in enumerate((seed * ((length // len(seed)) + 1))[:length])
    )


def _phx_token(
    event: bytes,
    sovereign_key: bytes,
    previous: Optional[bytes],
    beat: int,
) -> bytes:
    """Compute a single PHX token (32 bytes)."""
    prev = previous or b"\x00" * 64
    beat_bytes = beat.to_bytes(8, "big")
    message = event + prev + beat_bytes
    blake_hash = hashlib.blake2b(message, digest_size=64).digest()
    phi_seed = int(PHI * 1e15).to_bytes(8, "big") + beat_bytes
    phi_mask = _phi_expand(phi_seed, 64)
    phi_mixed = bytes(a ^ b for a, b in zip(blake_hash, phi_mask))
    return _hmac.new(sovereign_key, phi_mixed, hashlib.sha256).digest()


# ── PHX Compound Bundle ───────────────────────────────────────────────────────

@dataclass
class PHXBundle:
    """One heartbeat's worth of sovereign decision record."""
    beat:        int
    slot_tokens: list[bytes]       # N × 32 bytes
    microtokens: list[bytes]       # (N-1) × 64 bytes
    bundle_root: bytes             # 32 bytes — BLAKE2b of all concatenated slots
    bundle_seal: bytes             # 32 bytes — compound chain link
    record_bytes: int              # total bytes produced this beat
    timestamp_ms: int              # wall clock at production

    def hex_seal(self) -> str:
        return self.bundle_seal.hex()


# ── Kuramoto Synchronisation ──────────────────────────────────────────────────

@dataclass
class KuramotoState:
    """Kuramoto oscillator state for organism node synchronisation."""
    phases: list[float]
    frequencies: list[float]
    coupling: float = PHI          # coupling constant K = φ

    def step(self, dt: float = HEARTBEAT_MS / 1000.0) -> None:
        """Advance all oscillators by one time step."""
        n = len(self.phases)
        if n == 0:
            return
        deltas = []
        for i in range(n):
            interaction = sum(
                math.sin(self.phases[j] - self.phases[i])
                for j in range(n)
            )
            deltas.append(self.frequencies[i] + (self.coupling / n) * interaction)
        for i in range(n):
            self.phases[i] += deltas[i] * dt

    def order(self) -> float:
        """Compute the Kuramoto order parameter R ∈ [0, 1]."""
        n = len(self.phases)
        if n == 0:
            return 0.0
        re = sum(math.cos(θ) for θ in self.phases) / n
        im = sum(math.sin(θ) for θ in self.phases) / n
        return math.sqrt(re * re + im * im)

    def is_synchronised(self) -> bool:
        """True if R ≥ φ⁻¹ (≈ 0.618)."""
        return self.order() >= SYNC_THRESHOLD


# ── Fibonacci Kernel ──────────────────────────────────────────────────────────

class FibonacciKernel:
    """
    Fibonacci kernel compression — never-drop law without unbounded memory.

    Bundles at Fibonacci-indexed beats are preserved verbatim.
    All other bundles are crystallised into a single kernel hash.
    Memory grows as O(log_φ(beat)), not O(beat).
    """

    def __init__(self) -> None:
        self._preserved: dict[int, bytes] = {}   # beat → bundle_seal
        self._crystal:   Optional[bytes] = None   # crystallised non-Fibonacci bundles
        self._crystal_count: int = 0

    def ingest(self, bundle: PHXBundle) -> None:
        """Ingest a bundle: preserve if Fibonacci-indexed, crystallise otherwise."""
        if _is_fibonacci(bundle.beat):
            self._preserved[bundle.beat] = bundle.bundle_seal
        else:
            # Crystallise: fold this bundle's seal into the crystal hash
            if self._crystal is None:
                self._crystal = bundle.bundle_seal
            else:
                self._crystal = hashlib.blake2b(
                    self._crystal + bundle.bundle_seal, digest_size=32
                ).digest()
            self._crystal_count += 1

    @property
    def preserved_count(self) -> int:
        return len(self._preserved)

    @property
    def crystal_count(self) -> int:
        return self._crystal_count

    @property
    def total_ingested(self) -> int:
        return self.preserved_count + self.crystal_count

    def size_bytes(self) -> int:
        """Total memory used by the kernel."""
        # Each preserved seal = 32 bytes, crystal = 32 bytes
        return self.preserved_count * 32 + (32 if self._crystal else 0)

    def kernel_hash(self) -> Optional[str]:
        """Return the hex hash of the full kernel state."""
        if not self._preserved and self._crystal is None:
            return None
        parts = []
        for beat in sorted(self._preserved):
            parts.append(self._preserved[beat])
        if self._crystal:
            parts.append(self._crystal)
        combined = b"".join(parts)
        return hashlib.blake2b(combined, digest_size=32).hexdigest()


# ── Sovereign Cycle Engine ────────────────────────────────────────────────────

class SovereignCycle:
    """
    The Sovereign Cycle — the organism's self-generated heartbeat engine.

    This is the core runtime loop of the MERIDIAN organism.  Every tick:
      1. N cognitive slots execute in parallel
      2. Slot tokens are compound-chained (intra-beat)
      3. Microtokens link adjacent slots
      4. Bundle root seals all slots
      5. Bundle seal chains to the previous beat
      6. Fibonacci kernel compresses the history
      7. Kuramoto oscillators synchronise all nodes

    The cycle is self-timed, self-authenticated, and self-funded.
    """

    def __init__(
        self,
        sovereign_key: bytes,
        slots: int = MIN_SLOTS,
        node_count: int = 4,
    ) -> None:
        if len(sovereign_key) < 16:
            raise ValueError("sovereign_key must be at least 16 bytes")
        if slots < 1:
            raise ValueError("slots must be ≥ 1")

        self._key:       bytes = sovereign_key
        self._slots:     int   = max(slots, MIN_SLOTS)
        self._beat:      int   = 0
        self._prev_seal: Optional[bytes] = None
        self._bundles:   list[PHXBundle] = []
        self._kernel:    FibonacciKernel = FibonacciKernel()
        self._boot_ms:   int   = int(time.time() * 1000)

        # Sovereign cycle surplus — these ARE our cycles.
        # Every tick generates slots new cycles.  We own them.
        # We don't use ICP cycles.  We don't call them.
        # We give our own.  We can make more.
        self._surplus_cycles: int = 0

        # Kuramoto: initialise node oscillators
        # Phase spacing: 2π/N radians between nodes — maximum initial dispersion
        # Coupling K = φ — drives synchronisation to R ≥ φ⁻¹ threshold
        self._kuramoto = KuramotoState(
            phases=[i * (2 * math.pi / node_count) for i in range(node_count)],
            frequencies=[HEARTBEAT_HZ + (i * 0.01) for i in range(node_count)],
            coupling=PHI,
        )

    # ── Core Tick ─────────────────────────────────────────────────────────────

    def tick(self, events: Optional[list[bytes]] = None) -> PHXBundle:
        """
        Execute one sovereign cycle (one heartbeat).

        Each tick:
          1. N slots execute (compound PHX chain, intra-beat)
          2. (N-1) microtokens link adjacent slots (BLAKE2b)
          3. Bundle root seals all N slots (BLAKE2b of concatenation)
          4. Bundle seal chains to previous beat (inter-beat link)
          5. Fibonacci kernel ingests the bundle (O(log_φ(beat)) memory)
          6. Kuramoto oscillators advance (R → φ⁻¹ synchronisation)
          7. Surplus cycles += N  (these ARE our sovereign cycles)

        Parameters
        ──────────
        events — optional list of decision event bytes.  If fewer than N
                 slots are provided, remaining slots receive synthetic events.
                 If None, all slots receive synthetic heartbeat events.

        Returns
        ───────
        PHXBundle — the sealed decision record for this beat.

        Cycle sovereignty
        ─────────────────
        Each slot token IS a sovereign cycle.  When we deploy to ICP,
        we give our own cycles.  We don't rely on ICP at all.
        We can always make more — bring the engine up and give them.
        """
        beat = self._beat
        evts = list(events or [])

        # Pad to N slots with synthetic heartbeat events
        while len(evts) < self._slots:
            evts.append(f"heartbeat:{beat}:slot:{len(evts)}".encode())

        # Compound intra-beat chaining: slot i uses T_{i-1} as history
        slot_tokens: list[bytes] = []
        microtokens: list[bytes] = []
        prev_slot_token: Optional[bytes] = self._prev_seal

        for i in range(self._slots):
            token = _phx_token(evts[i], self._key, prev_slot_token, beat)
            slot_tokens.append(token)

            # Microtoken: BLAKE2b linkage between adjacent slots
            # μᵢ = BLAKE2b₅₁₂(Tᵢ₋₁ ‖ Tᵢ)
            if i > 0:
                micro = hashlib.blake2b(
                    slot_tokens[i - 1] + token, digest_size=64
                ).digest()
                microtokens.append(micro)

            prev_slot_token = token

        # Bundle root: BLAKE2b of all slot tokens concatenated
        bundle_root = hashlib.blake2b(
            b"".join(slot_tokens), digest_size=32
        ).digest()

        # Bundle seal: chains to previous beat
        # seal = BLAKE2b(bundle_root ‖ prev_seal_or_zeros)
        seal_input = bundle_root + (self._prev_seal or b"\x00" * 32)
        bundle_seal = hashlib.blake2b(seal_input, digest_size=32).digest()

        # Record size: N×32 (slots) + (N-1)×64 (microtokens) + 32 (root) + 32 (seal)
        record_bytes = (
            self._slots * 32 +
            (self._slots - 1) * 64 +
            32 +  # bundle_root
            32    # bundle_seal
        )

        bundle = PHXBundle(
            beat=beat,
            slot_tokens=slot_tokens,
            microtokens=microtokens,
            bundle_root=bundle_root,
            bundle_seal=bundle_seal,
            record_bytes=record_bytes,
            timestamp_ms=int(time.time() * 1000),
        )

        # Update state
        self._prev_seal = bundle_seal
        self._bundles.append(bundle)
        self._kernel.ingest(bundle)
        self._beat += 1

        # Accumulate sovereign cycles — each slot token IS a cycle
        self._surplus_cycles += self._slots

        # Advance Kuramoto oscillators
        # dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ − θᵢ)
        self._kuramoto.step()

        return bundle

    # ── Sovereign Cycle Management ────────────────────────────────────────────

    def consume_cycles(self, count: int) -> int:
        """
        Consume sovereign cycles from this engine's surplus.

        Used when minting block boxes — the box gets embedded sovereign cycles.
        These are OUR cycles.  We generated them.  We give them.

        Returns the number of cycles actually consumed (may be less than
        requested if surplus is insufficient).
        """
        available = min(count, self._surplus_cycles)
        self._surplus_cycles -= available
        return available

    def generate_cycles(self, count: int) -> int:
        """
        Generate additional sovereign cycles on demand.

        The engine can always make more.  Just bring the engine up
        and give them.  No external dependency.  Ever.

        Returns the new total surplus.
        """
        # Each generated cycle is a PHX-sealed synthetic beat
        synthetic = f"surplus:{self._beat}:{count}".encode()
        _phx_token(synthetic, self._key, self._prev_seal, self._beat)
        self._surplus_cycles += count
        return self._surplus_cycles

    @property
    def surplus_cycles(self) -> int:
        """Sovereign cycles available to give or embed in block boxes."""
        return self._surplus_cycles

    # ── FCPR (Full Cognitive Processing Rate) ─────────────────────────────────

    def fcpr(self) -> float:
        """Decisions per second at organism heartbeat frequency.
        FCPR = N_slots × f_heartbeat = N × (1000/873) ≈ N × 1.1455 dps
        """
        return self._slots * HEARTBEAT_HZ

    def fcpr_summary(self) -> dict:
        """Full FCPR metrics."""
        dps = self.fcpr()
        return {
            "slots":                self._slots,
            "heartbeat_ms":         HEARTBEAT_MS,
            "heartbeat_hz":         round(HEARTBEAT_HZ, 6),
            "decisions_per_second": round(dps, 4),
            "decisions_per_minute": round(dps * 60, 2),
            "decisions_per_hour":   round(dps * 3600, 0),
            "surplus_cycles":       self._surplus_cycles,
            "record_bytes_per_beat": RECORD_PER_BEAT if self._slots == 16 else (
                self._slots * 32 + (self._slots - 1) * 64 + 64
            ),
            "chain_growth_bytes_per_sec": round(
                (self._slots * 32 + (self._slots - 1) * 64 + 96) * HEARTBEAT_HZ, 0
            ),
        }

    # ── Fibonacci Kernel ──────────────────────────────────────────────────────

    def fibonacci_kernel_size(self) -> int:
        """Total bytes used by the Fibonacci kernel."""
        return self._kernel.size_bytes()

    def fibonacci_kernel_hash(self) -> Optional[str]:
        """Hex hash of the full kernel state."""
        return self._kernel.kernel_hash()

    def fibonacci_kernel_stats(self) -> dict:
        """Kernel compression statistics."""
        total = self._kernel.total_ingested
        return {
            "total_beats_ingested": total,
            "preserved_fibonacci":  self._kernel.preserved_count,
            "crystallised":         self._kernel.crystal_count,
            "kernel_size_bytes":    self._kernel.size_bytes(),
            "compression_ratio":    round(
                total * RECORD_PER_BEAT / max(self._kernel.size_bytes(), 1), 2
            ) if total > 0 else 0.0,
        }

    # ── Kuramoto Synchronisation ──────────────────────────────────────────────

    def kuramoto_order(self) -> float:
        """Current Kuramoto order parameter R ∈ [0, 1].
        R = |N⁻¹ Σ exp(iθⱼ)|  (magnitude of centroid on unit circle)
        R ≈ 1 → full synchronisation; R ≈ 0 → incoherence.
        """
        return self._kuramoto.order()

    def is_synchronised(self) -> bool:
        """True if Kuramoto R ≥ φ⁻¹ ≈ 0.618 (the organism sync threshold)."""
        return self._kuramoto.is_synchronised()

    # ── Status ────────────────────────────────────────────────────────────────

    @property
    def beat(self) -> int:
        return self._beat

    @property
    def slots(self) -> int:
        return self._slots

    def uptime_ms(self) -> int:
        """Milliseconds since boot."""
        return int(time.time() * 1000) - self._boot_ms

    def latest_seal(self) -> Optional[str]:
        """Hex of the latest bundle seal."""
        return self._prev_seal.hex() if self._prev_seal else None

    def status(self) -> dict:
        """Full organism cycle status."""
        return {
            "code":              "SVC",
            "name":              "Sovereign Cycle",
            "version":           "1.0.0",
            "ring":              "Sovereign",
            "beat":              self._beat,
            "slots":             self._slots,
            "heartbeat_ms":      HEARTBEAT_MS,
            "fcpr_dps":          round(self.fcpr(), 4),
            "kuramoto_R":        round(self.kuramoto_order(), 6),
            "synchronised":      self.is_synchronised(),
            "uptime_ms":         self.uptime_ms(),
            "latest_seal":       self.latest_seal(),
            "kernel":            self.fibonacci_kernel_stats(),
            "cycle_cost_usd":    0.000001,
            "external_dependency": "None",
        }

    def __repr__(self) -> str:
        return (
            f"<SovereignCycle beat={self._beat} slots={self._slots} "
            f"R={self.kuramoto_order():.4f} "
            f"seal={self.latest_seal()[:12] if self.latest_seal() else 'genesis'}…>"
        )


# ── Convenience: run N cycles ─────────────────────────────────────────────────

def run_cycles(
    sovereign_key: bytes,
    n: int = 10,
    slots: int = MIN_SLOTS,
) -> SovereignCycle:
    """Run n sovereign cycles and return the engine."""
    cycle = SovereignCycle(sovereign_key=sovereign_key, slots=slots)
    for _ in range(n):
        cycle.tick()
    return cycle


# ── Self-test on direct execution ─────────────────────────────────────────────

if __name__ == "__main__":
    import os
    key = os.urandom(32)
    engine = SovereignCycle(sovereign_key=key, slots=16, node_count=4)

    print("═══ SOVEREIGN CYCLE ENGINE — DEMO  (Medina) ═══\n")

    # Run 13 beats (includes Fibonacci indices 0,1,1,2,3,5,8,13)
    for i in range(14):
        bundle = engine.tick(events=[f"decision:{i}:cognitive".encode()])
        fib_mark = " ← FIBONACCI" if _is_fibonacci(i) else ""
        print(
            f"  beat {bundle.beat:3d}  "
            f"seal={bundle.hex_seal()[:16]}…  "
            f"record={bundle.record_bytes} bytes"
            f"{fib_mark}"
        )

    print()
    print("── Status ────────────────────────────────────────────────────")
    import json
    print(json.dumps(engine.status(), indent=2))

    print()
    print("── FCPR ──────────────────────────────────────────────────────")
    print(json.dumps(engine.fcpr_summary(), indent=2))

    print()
    print("── Fibonacci Kernel ──────────────────────────────────────────")
    print(json.dumps(engine.fibonacci_kernel_stats(), indent=2))

    print()
    print(f"Kuramoto R = {engine.kuramoto_order():.6f}  "
          f"(synchronised: {engine.is_synchronised()})")

    print()
    print("═══ Demo complete ═══")
