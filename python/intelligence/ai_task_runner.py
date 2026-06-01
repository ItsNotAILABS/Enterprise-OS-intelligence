"""
ai_task_runner.py — Multi-Model AI Task Execution CLI

User-facing tool for submitting, routing, and tracking AI tasks across
the organism's 40-model fleet with real-time status and results.

Features:
  - Submit tasks with natural language descriptions
  - Automatic model selection via phi-weighted routing
  - Task queue with priority management
  - Real-time execution tracking
  - Result history and comparison
  - Batch task processing
  - Model performance leaderboard

Run: python ai_task_runner.py
     python ai_task_runner.py --task "Analyze market trends" --priority HIGH
     python ai_task_runner.py --batch tasks.json
     python ai_task_runner.py --leaderboard

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
Medina Tech · Dallas, Texas
"""

from __future__ import annotations

import json
import os
import sys
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum, auto
from typing import Any, Optional

sys.path.insert(0, os.path.dirname(__file__))

from organism_ai import (
    IntelligenceOrchestrator,
    Task,
    TaskType,
    Priority,
    RoutingResult,
)

# ── Constants ──────────────────────────────────────────────────────────────────

PHI = 1.618033988749895
PHI_INV = 1.0 / PHI


# ── Enums ──────────────────────────────────────────────────────────────────────

class TaskStatus(Enum):
    QUEUED = "queued"
    ROUTING = "routing"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# ── Data Classes ───────────────────────────────────────────────────────────────

@dataclass
class UserTask:
    task_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    description: str = ""
    task_type: TaskType = TaskType.REASONING
    priority: Priority = Priority.NORMAL
    status: TaskStatus = TaskStatus.QUEUED
    assigned_model: Optional[str] = None
    alternatives: list[str] = field(default_factory=list)
    routing_score: float = 0.0
    submitted_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[str] = None
    latency_ms: float = 0.0
    success: bool = False
    retries: int = 0


@dataclass
class TaskBatch:
    batch_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tasks: list[UserTask] = field(default_factory=list)
    submitted_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    completed_count: int = 0
    failed_count: int = 0


@dataclass
class ModelLeaderboardEntry:
    model_id: str = ""
    total_tasks: int = 0
    success_rate: float = 0.0
    avg_latency_ms: float = 0.0
    reputation: float = 0.0
    rank: int = 0


# ── Task Runner ────────────────────────────────────────────────────────────────

class AITaskRunner:
    """
    User-facing multi-model AI task execution engine.

    Routes tasks to the best available model, tracks execution,
    manages retries, and provides performance analytics.

    Usage
    -----
    >>> runner = AITaskRunner()
    >>> task = runner.submit("Analyze this governance proposal", task_type=TaskType.ANALYSIS)
    >>> runner.execute(task.task_id)
    >>> print(task.status, task.assigned_model)
    """

    MAX_RETRIES = 3

    def __init__(self) -> None:
        self._orchestrator = IntelligenceOrchestrator()
        self._tasks: dict[str, UserTask] = {}
        self._batches: list[TaskBatch] = []
        self._history: list[UserTask] = []

    # ── Task Submission ────────────────────────────────────────────────────────

    def submit(
        self,
        description: str,
        task_type: TaskType = TaskType.REASONING,
        priority: Priority = Priority.NORMAL,
    ) -> UserTask:
        """Submit a new task for execution."""
        task = UserTask(
            description=description,
            task_type=task_type,
            priority=priority,
        )
        self._tasks[task.task_id] = task
        return task

    def submit_batch(self, tasks: list[dict[str, Any]]) -> TaskBatch:
        """Submit a batch of tasks."""
        batch = TaskBatch()
        for t in tasks:
            task_type = TaskType[t.get("type", "REASONING").upper()]
            priority = Priority[t.get("priority", "NORMAL").upper()]
            user_task = self.submit(
                description=t.get("description", ""),
                task_type=task_type,
                priority=priority,
            )
            batch.tasks.append(user_task)
        self._batches.append(batch)
        return batch

    # ── Execution ──────────────────────────────────────────────────────────────

    def execute(self, task_id: str) -> UserTask:
        """Route and execute a single task."""
        task = self._tasks.get(task_id)
        if not task:
            raise ValueError(f"Task not found: {task_id}")

        # Route
        task.status = TaskStatus.ROUTING
        internal_task = Task(
            type=task.task_type,
            priority=task.priority,
            payload=task.description,
        )
        routing = self._orchestrator.route(internal_task)

        task.assigned_model = routing.model_id
        task.alternatives = routing.alternatives
        task.routing_score = routing.score

        # Execute (simulated — in production, this calls the actual model API)
        task.status = TaskStatus.EXECUTING
        task.started_at = datetime.now(timezone.utc).isoformat()

        # Simulate execution
        latency = self._simulate_latency(routing.model_id)
        success = self._simulate_success(routing.model_id, task.priority)

        task.latency_ms = latency
        task.success = success

        if success:
            task.status = TaskStatus.COMPLETED
            task.result = self._generate_simulated_result(task)
        else:
            # Retry with cascade fallback
            failed_models = {routing.model_id}
            while task.retries < self.MAX_RETRIES and not task.success:
                task.retries += 1
                fallback = self._orchestrator.cascade_fallback(internal_task, failed_models)
                if not fallback.model_id:
                    break
                task.assigned_model = fallback.model_id
                failed_models.add(fallback.model_id)
                latency = self._simulate_latency(fallback.model_id)
                success = self._simulate_success(fallback.model_id, task.priority)
                task.latency_ms += latency
                task.success = success

            if task.success:
                task.status = TaskStatus.COMPLETED
                task.result = self._generate_simulated_result(task)
            else:
                task.status = TaskStatus.FAILED
                task.result = "All model attempts exhausted."

        task.completed_at = datetime.now(timezone.utc).isoformat()

        # Record outcome
        if task.assigned_model:
            self._orchestrator.record_outcome(
                task.assigned_model, task.success, task.latency_ms
            )

        self._history.append(task)
        return task

    def execute_batch(self, batch_id: str) -> TaskBatch:
        """Execute all tasks in a batch."""
        batch = next((b for b in self._batches if b.batch_id == batch_id), None)
        if not batch:
            raise ValueError(f"Batch not found: {batch_id}")

        for task in batch.tasks:
            self.execute(task.task_id)
            if task.success:
                batch.completed_count += 1
            else:
                batch.failed_count += 1

        return batch

    def cancel(self, task_id: str) -> bool:
        """Cancel a queued task."""
        task = self._tasks.get(task_id)
        if task and task.status == TaskStatus.QUEUED:
            task.status = TaskStatus.CANCELLED
            return True
        return False

    # ── Queries ────────────────────────────────────────────────────────────────

    def get_task(self, task_id: str) -> Optional[UserTask]:
        return self._tasks.get(task_id)

    def get_queue(self) -> list[UserTask]:
        """Get all queued tasks sorted by priority."""
        queued = [t for t in self._tasks.values() if t.status == TaskStatus.QUEUED]
        return sorted(queued, key=lambda t: t.priority.value, reverse=True)

    def get_history(self, limit: int = 20) -> list[UserTask]:
        """Get task execution history."""
        return self._history[-limit:]

    # ── Analytics ──────────────────────────────────────────────────────────────

    def get_leaderboard(self) -> list[ModelLeaderboardEntry]:
        """Get model performance leaderboard."""
        table = self._orchestrator.get_routing_table()
        entries = []
        for i, row in enumerate(
            sorted(table, key=lambda r: r["reputation"], reverse=True)
        ):
            entries.append(ModelLeaderboardEntry(
                model_id=row["model_id"],
                total_tasks=row["total_tasks"],
                success_rate=row["success_rate"],
                avg_latency_ms=row["avg_latency_ms"],
                reputation=row["reputation"],
                rank=i + 1,
            ))
        return entries

    def get_statistics(self) -> dict[str, Any]:
        """Get task execution statistics."""
        completed = [t for t in self._history if t.status == TaskStatus.COMPLETED]
        failed = [t for t in self._history if t.status == TaskStatus.FAILED]

        avg_latency = (
            sum(t.latency_ms for t in completed) / len(completed)
            if completed else 0.0
        )

        return {
            "total_submitted": len(self._tasks),
            "total_executed": len(self._history),
            "completed": len(completed),
            "failed": len(failed),
            "success_rate": len(completed) / max(len(self._history), 1),
            "avg_latency_ms": round(avg_latency, 1),
            "total_retries": sum(t.retries for t in self._history),
            "batches": len(self._batches),
        }

    # ── Rendering ──────────────────────────────────────────────────────────────

    def render_terminal(self) -> str:
        """Render task runner status for terminal display."""
        stats = self.get_statistics()
        lines = []
        lines.append("=" * 72)
        lines.append("  AI TASK RUNNER — Multi-Model Intelligence Executor")
        lines.append("  Enterprise OS Intelligence · 40-Model Fleet")
        lines.append("=" * 72)
        lines.append("")
        lines.append(f"  Tasks Executed:  {stats['total_executed']}")
        lines.append(f"  Success Rate:    {stats['success_rate']:.1%}")
        lines.append(f"  Avg Latency:     {stats['avg_latency_ms']:.0f}ms")
        lines.append(f"  Total Retries:   {stats['total_retries']}")
        lines.append("")

        # Recent history
        history = self.get_history(8)
        if history:
            lines.append("-" * 72)
            lines.append(f"  {'TASK':<35} {'MODEL':<18} {'STATUS':<10} {'ms':>6}")
            lines.append("-" * 72)
            for t in history:
                desc = t.description[:34]
                model = (t.assigned_model or "N/A")[:17]
                lines.append(
                    f"  {desc:<35} {model:<18} "
                    f"{t.status.value:<10} {t.latency_ms:>6.0f}"
                )

        # Leaderboard (top 5)
        leaderboard = self.get_leaderboard()[:5]
        if leaderboard:
            lines.append("")
            lines.append("-" * 72)
            lines.append("  TOP MODELS:")
            for entry in leaderboard:
                lines.append(
                    f"    #{entry.rank} {entry.model_id:<20} "
                    f"Rep: {entry.reputation:.3f}  "
                    f"Tasks: {entry.total_tasks}"
                )

        lines.append("")
        lines.append("=" * 72)
        return "\n".join(lines)

    # ── Internal Simulation ────────────────────────────────────────────────────

    def _simulate_latency(self, model_id: Optional[str]) -> float:
        """Simulate model response latency."""
        base = 400.0
        if model_id:
            if "gpt" in model_id:
                base = 500.0
            elif "claude" in model_id:
                base = 450.0
            elif "gemini" in model_id:
                base = 350.0
            elif "llama" in model_id:
                base = 300.0
        # Add phi-scaled jitter
        jitter = (hash(model_id or "") % 200) * PHI_INV
        return base + jitter

    def _simulate_success(self, model_id: Optional[str], priority: Priority) -> bool:
        """Simulate whether execution succeeds."""
        # Higher priority tasks have slightly lower success (harder)
        base_rate = 0.88
        priority_penalty = priority.value * 0.02
        # Use deterministic hash for reproducibility
        h = hash((model_id, time.time_ns() // 1_000_000))
        threshold = base_rate - priority_penalty
        return (h % 100) / 100 < threshold

    def _generate_simulated_result(self, task: UserTask) -> str:
        """Generate a simulated result for demonstration."""
        results = {
            TaskType.REASONING: f"Analysis complete: {task.description[:50]}. "
                                f"Key insight identified via phi-weighted reasoning.",
            TaskType.CODING: f"Code generated for: {task.description[:50]}. "
                            f"Implementation follows sovereign architecture patterns.",
            TaskType.CREATIVE: f"Creative output for: {task.description[:50]}. "
                              f"Generated with phi-harmonic style transfer.",
            TaskType.ANALYSIS: f"Data analysis: {task.description[:50]}. "
                              f"3 patterns detected, 2 anomalies flagged.",
            TaskType.CONVERSATION: f"Response to: {task.description[:50]}. "
                                  f"Contextual reply with organism memory integration.",
        }
        return results.get(task.task_type, "Task completed successfully.")


# ── CLI Entry Point ────────────────────────────────────────────────────────────

def main() -> None:
    """Run AI task runner with sample tasks."""
    runner = AITaskRunner()

    # Submit and execute sample tasks
    tasks = [
        ("Analyze ICP governance proposal #12345 for network impact", TaskType.ANALYSIS, Priority.HIGH),
        ("Generate phi-weighted sorting algorithm", TaskType.CODING, Priority.NORMAL),
        ("Draft executive summary for Q2 portfolio review", TaskType.CREATIVE, Priority.NORMAL),
        ("Evaluate Nova Chip v2 thermal constraints", TaskType.REASONING, Priority.CRITICAL),
        ("Explain organism heartbeat architecture to new team member", TaskType.CONVERSATION, Priority.LOW),
        ("Predict market response to new subnet creation", TaskType.ANALYSIS, Priority.HIGH),
        ("Implement cascade fallback for model routing", TaskType.CODING, Priority.HIGH),
        ("Design sovereignty doctrine infographic", TaskType.CREATIVE, Priority.LOW),
    ]

    for desc, task_type, priority in tasks:
        task = runner.submit(desc, task_type=task_type, priority=priority)
        runner.execute(task.task_id)

    # Display results
    print(runner.render_terminal())


if __name__ == "__main__":
    main()
