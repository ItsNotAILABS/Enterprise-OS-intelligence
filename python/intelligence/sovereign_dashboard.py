"""
sovereign_dashboard.py — Real-Time Organism Health Dashboard

User-facing CLI dashboard showing live organism vitals, model routing
performance, knowledge graph growth, and system health metrics.

Features:
  - Live heartbeat status with phi-pulse visualization
  - Model routing efficiency breakdown
  - Knowledge graph statistics and growth rate
  - Document absorption throughput
  - Alert stream for anomalies
  - Exportable health reports (JSON / human-readable)

Run: python sovereign_dashboard.py
     python sovereign_dashboard.py --export report.json
     python sovereign_dashboard.py --watch

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
Medina Tech · Dallas, Texas
"""

from __future__ import annotations

import json
import math
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum, auto
from typing import Any, Optional

sys.path.insert(0, os.path.dirname(__file__))

from organism_ai import IntelligenceOrchestrator, Task, TaskType, Priority
from knowledge_graph import KnowledgeGraph
from document_absorber import DocumentAbsorber, DocFormat

# ── Constants ──────────────────────────────────────────────────────────────────

PHI = 1.618033988749895
PHI_INV = 1.0 / PHI
HEARTBEAT_MS = 873


# ── Health Status ──────────────────────────────────────────────────────────────

class HealthStatus(Enum):
    OPTIMAL = "OPTIMAL"
    NOMINAL = "NOMINAL"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"


# ── Data Classes ───────────────────────────────────────────────────────────────

@dataclass
class VitalSign:
    name: str
    value: float
    unit: str
    status: HealthStatus
    threshold_warn: float
    threshold_critical: float


@dataclass
class DashboardSnapshot:
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    heartbeat_count: int = 0
    uptime_seconds: float = 0.0
    overall_health: HealthStatus = HealthStatus.NOMINAL
    vitals: list[VitalSign] = field(default_factory=list)
    alerts: list[dict[str, Any]] = field(default_factory=list)
    model_metrics: dict[str, Any] = field(default_factory=dict)
    graph_metrics: dict[str, Any] = field(default_factory=dict)
    absorber_metrics: dict[str, Any] = field(default_factory=dict)


# ── Dashboard Engine ───────────────────────────────────────────────────────────

class SovereignDashboard:
    """
    Real-time organism health monitoring dashboard.

    Usage
    -----
    >>> dashboard = SovereignDashboard()
    >>> dashboard.pulse()  # Run one heartbeat cycle
    >>> snapshot = dashboard.get_snapshot()
    >>> print(snapshot.overall_health.value)
    'NOMINAL'
    """

    def __init__(self) -> None:
        self._orchestrator = IntelligenceOrchestrator()
        self._graph = KnowledgeGraph()
        self._absorber = DocumentAbsorber()
        self._start_time = time.time()
        self._beat_count = 0
        self._alerts: list[dict[str, Any]] = []
        self._history: list[DashboardSnapshot] = []

    # ── Heartbeat ──────────────────────────────────────────────────────────────

    def pulse(self) -> dict[str, Any]:
        """Execute one heartbeat cycle and collect metrics."""
        self._beat_count += 1
        result = self._orchestrator.on_heartbeat(self._beat_count)

        # Check for anomalies
        metrics = self._orchestrator.metrics()
        if metrics["success_rate"] < 0.5 and metrics["total_routed"] > 10:
            self._emit_alert("LOW_SUCCESS_RATE", f"Success rate: {metrics['success_rate']:.1%}")
        if metrics["avg_latency_ms"] > HEARTBEAT_MS * 3:
            self._emit_alert("HIGH_LATENCY", f"Avg latency: {metrics['avg_latency_ms']:.0f}ms")

        return result

    # ── Metrics Collection ─────────────────────────────────────────────────────

    def get_vitals(self) -> list[VitalSign]:
        """Collect all organism vital signs."""
        metrics = self._orchestrator.metrics()
        uptime = time.time() - self._start_time

        return [
            VitalSign(
                name="Heartbeat Rate",
                value=self._beat_count / max(uptime, 1) * 1000,
                unit="beats/s",
                status=HealthStatus.OPTIMAL if self._beat_count > 0 else HealthStatus.CRITICAL,
                threshold_warn=0.5,
                threshold_critical=0.1,
            ),
            VitalSign(
                name="Model Success Rate",
                value=metrics["success_rate"] * 100,
                unit="%",
                status=self._rate_status(metrics["success_rate"]),
                threshold_warn=70.0,
                threshold_critical=50.0,
            ),
            VitalSign(
                name="Avg Routing Latency",
                value=metrics["avg_latency_ms"],
                unit="ms",
                status=self._latency_status(metrics["avg_latency_ms"]),
                threshold_warn=HEARTBEAT_MS * 2,
                threshold_critical=HEARTBEAT_MS * 5,
            ),
            VitalSign(
                name="Model Fleet Size",
                value=metrics["model_count"],
                unit="models",
                status=HealthStatus.OPTIMAL if metrics["model_count"] >= 30 else HealthStatus.DEGRADED,
                threshold_warn=20,
                threshold_critical=5,
            ),
            VitalSign(
                name="Knowledge Nodes",
                value=self._graph.node_count,
                unit="nodes",
                status=HealthStatus.NOMINAL,
                threshold_warn=0,
                threshold_critical=0,
            ),
            VitalSign(
                name="Documents Absorbed",
                value=self._absorber.total_absorbed,
                unit="docs",
                status=HealthStatus.NOMINAL,
                threshold_warn=0,
                threshold_critical=0,
            ),
        ]

    def get_snapshot(self) -> DashboardSnapshot:
        """Get complete dashboard state snapshot."""
        vitals = self.get_vitals()
        overall = self._compute_overall_health(vitals)

        snapshot = DashboardSnapshot(
            heartbeat_count=self._beat_count,
            uptime_seconds=time.time() - self._start_time,
            overall_health=overall,
            vitals=vitals,
            alerts=self._alerts[-20:],  # Last 20 alerts
            model_metrics=self._orchestrator.metrics(),
            graph_metrics={
                "node_count": self._graph.node_count,
                "edge_count": self._graph.edge_count,
            },
            absorber_metrics={
                "total_absorbed": self._absorber.total_absorbed,
            },
        )
        self._history.append(snapshot)
        return snapshot

    # ── Simulation (Demo Mode) ─────────────────────────────────────────────────

    def simulate_activity(self, cycles: int = 50) -> None:
        """Simulate organism activity for demonstration."""
        tasks = [
            Task(type=TaskType.REASONING, priority=Priority.HIGH, payload="Analyze governance"),
            Task(type=TaskType.CODING, priority=Priority.NORMAL, payload="Generate module"),
            Task(type=TaskType.ANALYSIS, priority=Priority.CRITICAL, payload="Risk assessment"),
            Task(type=TaskType.CREATIVE, priority=Priority.LOW, payload="Draft report"),
            Task(type=TaskType.CONVERSATION, priority=Priority.NORMAL, payload="User query"),
        ]

        for i in range(cycles):
            self.pulse()
            task = tasks[i % len(tasks)]
            result = self._orchestrator.route(task)
            if result.model_id:
                success = (i % 7) != 0  # ~85% success rate
                latency = 200 + (i * 37) % 800
                self._orchestrator.record_outcome(result.model_id, success, latency)

        # Add some knowledge graph content
        self._graph.add_node("governance", "concept", {"label": "ICP Governance"})
        self._graph.add_node("organism", "entity", {"label": "ORO Organism"})
        self._graph.add_edge("organism", "governance", "contains")

        # Absorb some documents
        self._absorber.absorb("Governance intelligence monitors NNS proposals.", DocFormat.TEXT)
        self._absorber.absorb("Phi-math drives all routing and scoring.", DocFormat.TEXT)

    # ── Export ─────────────────────────────────────────────────────────────────

    def export_report(self) -> dict[str, Any]:
        """Export full dashboard report as JSON-serializable dict."""
        snapshot = self.get_snapshot()
        return {
            "report_type": "ORGANISM_HEALTH_DASHBOARD",
            "timestamp": snapshot.timestamp,
            "heartbeat_count": snapshot.heartbeat_count,
            "uptime_seconds": round(snapshot.uptime_seconds, 2),
            "overall_health": snapshot.overall_health.value,
            "vitals": [
                {
                    "name": v.name,
                    "value": round(v.value, 2),
                    "unit": v.unit,
                    "status": v.status.value,
                }
                for v in snapshot.vitals
            ],
            "alerts": snapshot.alerts,
            "model_metrics": snapshot.model_metrics,
            "graph_metrics": snapshot.graph_metrics,
            "absorber_metrics": snapshot.absorber_metrics,
        }

    # ── Rendering ──────────────────────────────────────────────────────────────

    def render_terminal(self) -> str:
        """Render dashboard as a formatted terminal string."""
        snapshot = self.get_snapshot()
        lines = []
        lines.append("=" * 72)
        lines.append("  SOVEREIGN ORGANISM DASHBOARD — Enterprise OS Intelligence")
        lines.append("  Medina Tech · Real-Time Health Monitor")
        lines.append("=" * 72)
        lines.append("")
        lines.append(f"  Status: {snapshot.overall_health.value}  |  "
                     f"Heartbeats: {snapshot.heartbeat_count}  |  "
                     f"Uptime: {snapshot.uptime_seconds:.1f}s")
        lines.append("")
        lines.append("-" * 72)
        lines.append(f"  {'VITAL':<30} {'VALUE':>10} {'UNIT':<10} {'STATUS':<10}")
        lines.append("-" * 72)

        for v in snapshot.vitals:
            lines.append(
                f"  {v.name:<30} {v.value:>10.1f} {v.unit:<10} {v.status.value:<10}"
            )

        lines.append("-" * 72)

        if snapshot.alerts:
            lines.append("")
            lines.append("  RECENT ALERTS:")
            for alert in snapshot.alerts[-5:]:
                lines.append(f"    [{alert['severity']}] {alert['type']}: {alert['message']}")

        lines.append("")
        lines.append(f"  Top Model: {snapshot.model_metrics.get('top_model', 'N/A')}")
        lines.append(f"  Total Routed: {snapshot.model_metrics.get('total_routed', 0)}")
        lines.append("=" * 72)
        return "\n".join(lines)

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _emit_alert(self, alert_type: str, message: str) -> None:
        self._alerts.append({
            "type": alert_type,
            "message": message,
            "severity": "WARN",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    @staticmethod
    def _rate_status(rate: float) -> HealthStatus:
        if rate >= 0.85:
            return HealthStatus.OPTIMAL
        if rate >= 0.70:
            return HealthStatus.NOMINAL
        if rate >= 0.50:
            return HealthStatus.DEGRADED
        return HealthStatus.CRITICAL

    @staticmethod
    def _latency_status(latency: float) -> HealthStatus:
        if latency <= HEARTBEAT_MS:
            return HealthStatus.OPTIMAL
        if latency <= HEARTBEAT_MS * 2:
            return HealthStatus.NOMINAL
        if latency <= HEARTBEAT_MS * 4:
            return HealthStatus.DEGRADED
        return HealthStatus.CRITICAL

    @staticmethod
    def _compute_overall_health(vitals: list[VitalSign]) -> HealthStatus:
        if any(v.status == HealthStatus.CRITICAL for v in vitals):
            return HealthStatus.CRITICAL
        if any(v.status == HealthStatus.DEGRADED for v in vitals):
            return HealthStatus.DEGRADED
        if all(v.status == HealthStatus.OPTIMAL for v in vitals):
            return HealthStatus.OPTIMAL
        return HealthStatus.NOMINAL


# ── CLI Entry Point ────────────────────────────────────────────────────────────

def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Sovereign Organism Dashboard")
    parser.add_argument("--export", type=str, help="Export report to JSON file")
    parser.add_argument("--watch", action="store_true", help="Continuous monitoring mode")
    parser.add_argument("--cycles", type=int, default=50, help="Simulation cycles")
    args = parser.parse_args()

    dashboard = SovereignDashboard()
    dashboard.simulate_activity(args.cycles)

    if args.export:
        report = dashboard.export_report()
        with open(args.export, "w") as f:
            json.dump(report, f, indent=2)
        print(f"Report exported to: {args.export}")
    elif args.watch:
        print(dashboard.render_terminal())
        print("\n[Watch mode: press Ctrl+C to exit]")
        try:
            while True:
                time.sleep(HEARTBEAT_MS / 1000)
                dashboard.pulse()
                print("\033[H\033[J")  # Clear terminal
                print(dashboard.render_terminal())
        except KeyboardInterrupt:
            print("\nDashboard stopped.")
    else:
        print(dashboard.render_terminal())


if __name__ == "__main__":
    main()
