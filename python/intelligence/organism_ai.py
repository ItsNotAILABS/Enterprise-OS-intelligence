"""
organism_ai.py — AI Model Orchestration Engine

Python implementation of the organism's AI intelligence layer.

Provides:
  - Multi-model task routing with phi-weighted scoring
  - Adaptive reputation tracking via phi-EMA
  - Cascade fallback across 40 model families
  - Workforce management: register agents, assign tasks, rebalance
  - Heartbeat-driven job processing (873 ms pulse)

Ring: Interface Ring | Wire: intelligence-wire/fusion
"""

from __future__ import annotations

import math
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Optional


# ── Constants ──────────────────────────────────────────────────────────────────

PHI          = 1.618033988749895
PHI_INV      = 1.0 / PHI
HEARTBEAT_MS = 873


# ── Task types and priorities ──────────────────────────────────────────────────

class TaskType(Enum):
    REASONING     = auto()
    CODING        = auto()
    CREATIVE      = auto()
    ANALYSIS      = auto()
    CONVERSATION  = auto()


class Priority(Enum):
    LOW      = 0
    NORMAL   = 1
    HIGH     = 2
    CRITICAL = 3


# ── Data classes ───────────────────────────────────────────────────────────────

@dataclass
class Task:
    task_id:  str              = field(default_factory=lambda: str(uuid.uuid4()))
    type:     TaskType         = TaskType.REASONING
    priority: Priority         = Priority.NORMAL
    payload:  str              = ""


@dataclass
class RoutingResult:
    model_id:     Optional[str]
    score:        float
    alternatives: list[str]


@dataclass
class ModelEntry:
    model_id:      str
    capabilities:  dict[TaskType, float]
    reputation:    float = 0.80
    total_tasks:   int   = 0
    success_count: int   = 0
    avg_latency_ms: float = HEARTBEAT_MS

    def score(self, task: Task) -> float:
        cap = self.capabilities.get(task.type, 0.5)
        return (PHI ** (4 - task.priority.value)) * cap * self.reputation


# ── IntelligenceOrchestrator ───────────────────────────────────────────────────

class IntelligenceOrchestrator:
    """
    Phi-weighted multi-model AI orchestrator.

    Usage
    -----
    >>> orch = IntelligenceOrchestrator()
    >>> result = orch.route(Task(type=TaskType.CODING, priority=Priority.HIGH))
    >>> print(result.model_id)
    """

    def __init__(self) -> None:
        self._models: dict[str, ModelEntry] = {}
        self._total_routed  = 0
        self._total_success = 0
        self._total_latency = 0.0
        self._seed_default_models()

    # ── Routing ───────────────────────────────────────────────────────────────

    def route(self, task: Task) -> RoutingResult:
        """Route a task to the best model."""
        scored = sorted(
            ((m.model_id, m.score(task)) for m in self._models.values()),
            key=lambda x: x[1],
            reverse=True,
        )
        self._total_routed += 1
        if not scored:
            return RoutingResult(model_id=None, score=0.0, alternatives=[])
        return RoutingResult(
            model_id     = scored[0][0],
            score        = scored[0][1],
            alternatives = [s[0] for s in scored[1:4]],
        )

    def cascade_fallback(self, task: Task, failed: set[str]) -> RoutingResult:
        """Find the best untried model after failures (phi-decay on position)."""
        candidates = sorted(
            ((m.model_id, m.score(task)) for m in self._models.values()
             if m.model_id not in failed),
            key=lambda x: x[1],
            reverse=True,
        )
        # Apply phi-weighted position decay
        adjusted = [
            (model_id, score * (PHI ** -i))
            for i, (model_id, score) in enumerate(candidates)
        ]
        adjusted.sort(key=lambda x: x[1], reverse=True)
        if not adjusted:
            return RoutingResult(model_id=None, score=0.0, alternatives=[])
        return RoutingResult(
            model_id     = adjusted[0][0],
            score        = adjusted[0][1],
            alternatives = [],
        )

    def record_outcome(self, model_id: str, success: bool, latency_ms: float) -> None:
        """Update model reputation via phi-EMA."""
        m = self._models.get(model_id)
        if not m:
            raise ValueError(f"Unknown model: {model_id}")
        m.total_tasks   += 1
        if success:
            m.success_count += 1
        m.reputation    = PHI_INV * (1.0 if success else 0.0) + (1.0 - PHI_INV) * m.reputation
        m.avg_latency_ms = PHI_INV * latency_ms + (1.0 - PHI_INV) * m.avg_latency_ms
        if success:
            self._total_success += 1
        self._total_latency += latency_ms

    def rebalance(self) -> None:
        """Recompute routing weights from empirical success rates."""
        for m in self._models.values():
            if m.total_tasks > 0:
                empirical = m.success_count / m.total_tasks
                m.reputation = PHI_INV * empirical + (1.0 - PHI_INV) * m.reputation

    # ── Metrics ───────────────────────────────────────────────────────────────

    def metrics(self) -> dict[str, Any]:
        top = max(self._models.values(), key=lambda m: m.reputation, default=None)
        return {
            "total_routed":   self._total_routed,
            "success_rate":   self._total_success / self._total_routed if self._total_routed else 0.0,
            "avg_latency_ms": self._total_latency / self._total_routed if self._total_routed else 0.0,
            "top_model":      top.model_id if top else None,
            "model_count":    len(self._models),
        }

    def get_routing_table(self) -> list[dict[str, Any]]:
        return [
            {
                "model_id":       m.model_id,
                "reputation":     round(m.reputation, 4),
                "total_tasks":    m.total_tasks,
                "success_rate":   round(m.success_count / m.total_tasks, 4) if m.total_tasks else 0.0,
                "avg_latency_ms": round(m.avg_latency_ms, 1),
                "capabilities":   {t.name: round(c, 2) for t, c in m.capabilities.items()},
            }
            for m in self._models.values()
        ]

    # ── Heartbeat integration ─────────────────────────────────────────────────

    def on_heartbeat(self, beat_number: int) -> dict[str, Any]:
        """
        Called every 873 ms by the organism heartbeat.
        Every 50 beats, rebalances routing weights.
        """
        if beat_number % 50 == 0:
            self.rebalance()
            return {"action": "rebalanced", "beat": beat_number, **self.metrics()}
        return {"action": "noop", "beat": beat_number}

    # ── Default model seeding ─────────────────────────────────────────────────

    def _cap(self, r: float, c: float, cr: float, a: float, cv: float) -> dict[TaskType, float]:
        return {
            TaskType.REASONING:    r,
            TaskType.CODING:       c,
            TaskType.CREATIVE:     cr,
            TaskType.ANALYSIS:     a,
            TaskType.CONVERSATION: cv,
        }

    def _seed(self, model_id: str, caps: dict[TaskType, float]) -> None:
        self._models[model_id] = ModelEntry(model_id=model_id, capabilities=caps)

    def _seed_default_models(self) -> None:
        s = self._seed; c = self._cap
        s("gpt-4o",           c(0.90, 0.85, 0.80, 0.88, 0.85))
        s("gpt-4-turbo",      c(0.88, 0.83, 0.78, 0.86, 0.84))
        s("gpt-4",            c(0.85, 0.80, 0.75, 0.85, 0.83))
        s("gpt-3.5-turbo",    c(0.75, 0.70, 0.70, 0.72, 0.80))
        s("o1-preview",       c(0.92, 0.87, 0.70, 0.91, 0.70))
        s("o1-mini",          c(0.88, 0.83, 0.65, 0.87, 0.68))
        s("o3-mini",          c(0.90, 0.86, 0.68, 0.89, 0.70))
        s("o3",               c(0.93, 0.88, 0.72, 0.92, 0.72))
        s("claude-3.5-sonnet",c(0.88, 0.80, 0.90, 0.87, 0.88))
        s("claude-3.5-haiku", c(0.82, 0.75, 0.85, 0.80, 0.85))
        s("claude-3-opus",    c(0.87, 0.78, 0.92, 0.86, 0.90))
        s("claude-3-sonnet",  c(0.85, 0.76, 0.88, 0.84, 0.88))
        s("claude-3-haiku",   c(0.78, 0.70, 0.82, 0.76, 0.82))
        s("claude-4",         c(0.92, 0.84, 0.94, 0.90, 0.92))
        s("gemini-2.0-flash", c(0.84, 0.78, 0.80, 0.88, 0.82))
        s("gemini-1.5-pro",   c(0.85, 0.76, 0.80, 0.90, 0.80))
        s("gemini-1.5-flash", c(0.80, 0.72, 0.76, 0.85, 0.78))
        s("gemini-ultra",     c(0.88, 0.80, 0.84, 0.92, 0.84))
        s("llama-3.1-405b",   c(0.80, 0.82, 0.70, 0.78, 0.75))
        s("llama-3.1-70b",    c(0.75, 0.80, 0.65, 0.72, 0.72))
        s("llama-3.1-8b",     c(0.65, 0.70, 0.58, 0.62, 0.65))
        s("llama-3.2-90b",    c(0.78, 0.82, 0.68, 0.75, 0.74))
        s("mistral-large",    c(0.78, 0.82, 0.70, 0.76, 0.74))
        s("mistral-medium",   c(0.72, 0.76, 0.65, 0.70, 0.70))
        s("mistral-small",    c(0.65, 0.70, 0.60, 0.63, 0.65))
        s("mixtral-8x22b",    c(0.76, 0.82, 0.68, 0.74, 0.72))
        s("mixtral-8x7b",     c(0.70, 0.76, 0.62, 0.68, 0.68))
        s("command-r-plus",   c(0.78, 0.72, 0.74, 0.80, 0.78))
        s("command-r",        c(0.72, 0.66, 0.68, 0.74, 0.72))
        s("command-light",    c(0.60, 0.55, 0.58, 0.62, 0.65))
        s("deepseek-v3",      c(0.82, 0.88, 0.68, 0.80, 0.72))
        s("deepseek-r1",      c(0.80, 0.85, 0.64, 0.78, 0.70))
        s("deepseek-coder",   c(0.70, 0.90, 0.50, 0.68, 0.60))
        s("qwen-2.5-72b",     c(0.78, 0.80, 0.70, 0.76, 0.72))
        s("qwen-2.5-32b",     c(0.72, 0.74, 0.65, 0.70, 0.68))
        s("phi-3-medium",     c(0.65, 0.72, 0.60, 0.64, 0.65))
        s("phi-3-mini",       c(0.58, 0.65, 0.55, 0.58, 0.60))
        s("dbrx",             c(0.72, 0.74, 0.64, 0.70, 0.68))
        s("gpt-5-mini",       c(0.86, 0.82, 0.80, 0.88, 0.86))
        s("gemma-2-27b",      c(0.70, 0.72, 0.66, 0.68, 0.68))
