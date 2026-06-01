"""
test_products.py — Test Suite for User-Facing Python Products

Tests for:
  - SovereignDashboard (sovereign_dashboard.py)
  - GovernanceMonitor (governance_monitor.py)
  - PortfolioAnalyzer (portfolio_analyzer.py)
  - SovereignVault (sovereign_vault.py)
  - AITaskRunner (ai_task_runner.py)

Run: python -m pytest test_products.py -v
"""

import json
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from sovereign_dashboard import SovereignDashboard, HealthStatus, DashboardSnapshot
from governance_monitor import (
    GovernanceMonitor, Proposal, ProposalType, ProposalStatus,
    AlertRule, UrgencyLevel,
)
from portfolio_analyzer import (
    PortfolioAnalyzer, PortfolioAsset, AssetClass, RiskLevel,
)
from sovereign_vault import (
    SovereignVault, MemoryType, RetentionPolicy, VaultEntry,
)
from ai_task_runner import AITaskRunner, TaskStatus
from organism_ai import TaskType, Priority


# ── SovereignDashboard ─────────────────────────────────────────────────────────

class TestSovereignDashboard:

    def test_initial_state(self):
        dashboard = SovereignDashboard()
        snapshot = dashboard.get_snapshot()
        assert snapshot.heartbeat_count == 0
        # Before any heartbeats, system reports CRITICAL (no pulse detected yet)
        assert snapshot.overall_health == HealthStatus.CRITICAL

    def test_pulse_increments_heartbeat(self):
        dashboard = SovereignDashboard()
        dashboard.pulse()
        dashboard.pulse()
        snapshot = dashboard.get_snapshot()
        assert snapshot.heartbeat_count == 2

    def test_simulate_activity(self):
        dashboard = SovereignDashboard()
        dashboard.simulate_activity(20)
        snapshot = dashboard.get_snapshot()
        assert snapshot.heartbeat_count == 20
        assert snapshot.model_metrics["total_routed"] > 0

    def test_export_report_json_serializable(self):
        dashboard = SovereignDashboard()
        dashboard.simulate_activity(10)
        report = dashboard.export_report()
        json_str = json.dumps(report)
        assert len(json_str) > 0
        assert report["report_type"] == "ORGANISM_HEALTH_DASHBOARD"

    def test_render_terminal_produces_string(self):
        dashboard = SovereignDashboard()
        dashboard.simulate_activity(10)
        output = dashboard.render_terminal()
        assert "SOVEREIGN ORGANISM DASHBOARD" in output
        assert "Heartbeats" in output

    def test_vitals_include_expected_metrics(self):
        dashboard = SovereignDashboard()
        dashboard.simulate_activity(5)
        vitals = dashboard.get_vitals()
        names = [v.name for v in vitals]
        assert "Heartbeat Rate" in names
        assert "Model Success Rate" in names
        assert "Model Fleet Size" in names


# ── GovernanceMonitor ──────────────────────────────────────────────────────────

class TestGovernanceMonitor:

    def test_ingest_proposal(self):
        monitor = GovernanceMonitor()
        p = Proposal(title="Test Proposal", proposal_type=ProposalType.MOTION)
        result = monitor.ingest_proposal(p)
        assert result.phi_score > 0
        assert result.urgency is not None

    def test_get_all_proposals(self):
        monitor = GovernanceMonitor()
        monitor.ingest_proposal(Proposal(title="A", proposal_type=ProposalType.MOTION))
        monitor.ingest_proposal(Proposal(title="B", proposal_type=ProposalType.NETWORK_ECONOMICS))
        all_proposals = monitor.get_all_proposals()
        assert len(all_proposals) == 2

    def test_alert_rule_triggers(self):
        monitor = GovernanceMonitor()
        monitor.add_alert_rule(AlertRule(name="High", condition="urgency >= HIGH"))
        p = Proposal(
            title="Network Change",
            proposal_type=ProposalType.NETWORK_ECONOMICS,
            total_voting_power=100_000,
            yes_votes=80_000,
        )
        monitor.ingest_proposal(p)
        alerts = monitor.get_pending_alerts()
        assert len(alerts) >= 1

    def test_acknowledge_alert(self):
        monitor = GovernanceMonitor()
        monitor.add_alert_rule(AlertRule(name="All High", condition="urgency >= HIGH"))
        monitor.ingest_proposal(Proposal(
            title="X", proposal_type=ProposalType.UPGRADE_NETWORK,
            total_voting_power=100_000, yes_votes=90_000,
        ))
        alerts = monitor.get_pending_alerts()
        assert len(alerts) > 0
        monitor.acknowledge_alert(alerts[0].alert_id)
        assert len(monitor.get_pending_alerts()) == 0

    def test_statistics(self):
        monitor = GovernanceMonitor()
        monitor.ingest_proposal(Proposal(title="P1", proposal_type=ProposalType.MOTION))
        stats = monitor.get_statistics()
        assert stats["total_proposals"] == 1

    def test_filter_by_status(self):
        monitor = GovernanceMonitor()
        p = Proposal(title="P1", proposal_type=ProposalType.MOTION)
        monitor.ingest_proposal(p)
        monitor.update_proposal_status(p.proposal_id, ProposalStatus.ADOPTED)
        open_proposals = monitor.get_all_proposals(ProposalStatus.OPEN)
        adopted_proposals = monitor.get_all_proposals(ProposalStatus.ADOPTED)
        assert len(open_proposals) == 0
        assert len(adopted_proposals) == 1

    def test_generate_digest(self):
        monitor = GovernanceMonitor()
        monitor.ingest_proposal(Proposal(title="Test", proposal_type=ProposalType.MOTION))
        digest = monitor.generate_governance_digest()
        assert "GOVERNANCE INTELLIGENCE DIGEST" in digest


# ── PortfolioAnalyzer ──────────────────────────────────────────────────────────

class TestPortfolioAnalyzer:

    def _sample_asset(self) -> PortfolioAsset:
        return PortfolioAsset(
            name="Test Asset",
            asset_class=AssetClass.SAAS_PLATFORM,
            current_value_usd=1_000_000,
            monthly_revenue_usd=50_000,
            growth_rate=0.05,
            volatility=0.10,
            market_share=0.10,
            maturity_years=2.0,
        )

    def test_analyze_single_asset(self):
        analyzer = PortfolioAnalyzer()
        analyzer.add_asset(self._sample_asset())
        analysis = analyzer.analyze()
        assert analysis.total_value_usd == 1_000_000
        assert len(analysis.asset_risks) == 1
        assert len(analysis.performance) == 1

    def test_analyze_empty_portfolio(self):
        analyzer = PortfolioAnalyzer()
        analysis = analyzer.analyze()
        assert analysis.total_value_usd == 0.0

    def test_monte_carlo_range(self):
        analyzer = PortfolioAnalyzer()
        analyzer.add_asset(self._sample_asset())
        analysis = analyzer.analyze(horizon_months=12)
        assert analysis.monte_carlo_p5_usd <= analysis.monte_carlo_p50_usd
        assert analysis.monte_carlo_p50_usd <= analysis.monte_carlo_p95_usd

    def test_high_volatility_higher_risk(self):
        analyzer = PortfolioAnalyzer()
        low_vol = PortfolioAsset(
            name="Low Vol", current_value_usd=1_000_000,
            growth_rate=0.05, volatility=0.05, maturity_years=3.0,
        )
        high_vol = PortfolioAsset(
            name="High Vol", current_value_usd=1_000_000,
            growth_rate=0.05, volatility=0.40, maturity_years=3.0,
            dependencies=["a", "b", "c", "d"],
        )
        analyzer.add_asset(low_vol)
        analyzer.add_asset(high_vol)
        analysis = analyzer.analyze()
        assert analysis.asset_risks[1].risk_score > analysis.asset_risks[0].risk_score

    def test_executive_summary(self):
        analyzer = PortfolioAnalyzer()
        analyzer.add_asset(self._sample_asset())
        analysis = analyzer.analyze()
        summary = analyzer.generate_executive_summary(analysis)
        assert "ENTERPRISE PORTFOLIO ANALYSIS" in summary

    def test_export_json(self):
        analyzer = PortfolioAnalyzer()
        analyzer.add_asset(self._sample_asset())
        analysis = analyzer.analyze()
        export = analyzer.export_analysis(analysis)
        json_str = json.dumps(export)
        assert len(json_str) > 0
        assert export["report_type"] == "PORTFOLIO_ANALYSIS"

    def test_remove_asset(self):
        analyzer = PortfolioAnalyzer()
        asset = self._sample_asset()
        analyzer.add_asset(asset)
        assert analyzer.asset_count == 1
        analyzer.remove_asset(asset.asset_id)
        assert analyzer.asset_count == 0


# ── SovereignVault ─────────────────────────────────────────────────────────────

class TestSovereignVault:

    def test_add_and_get(self):
        vault = SovereignVault()
        entry = vault.add("Test memory", tags=["test"])
        retrieved = vault.get(entry.entry_id)
        assert retrieved is not None
        assert retrieved.content == "Test memory"

    def test_search(self):
        vault = SovereignVault()
        vault.add("The organism heartbeat fires every 873ms", tags=["organism"])
        vault.add("Phi math drives routing", tags=["math"])
        results = vault.search("heartbeat")
        assert len(results) >= 1
        assert "heartbeat" in results[0].entry.content

    def test_search_by_tag(self):
        vault = SovereignVault()
        vault.add("Entry A", tags=["alpha", "beta"])
        vault.add("Entry B", tags=["gamma"])
        results = vault.search_by_tag("alpha")
        assert len(results) == 1

    def test_update_entry(self):
        vault = SovereignVault()
        entry = vault.add("Original content")
        vault.update(entry.entry_id, content="Updated content")
        updated = vault.get(entry.entry_id)
        assert updated.content == "Updated content"

    def test_delete_entry(self):
        vault = SovereignVault()
        entry = vault.add("To be deleted")
        assert vault.delete(entry.entry_id) is True
        assert vault.get(entry.entry_id) is None

    def test_link_entries(self):
        vault = SovereignVault()
        a = vault.add("Entry A")
        b = vault.add("Entry B")
        assert vault.link(a.entry_id, b.entry_id) is True
        assert b.entry_id in vault.get(a.entry_id).links
        assert a.entry_id in vault.get(b.entry_id).links

    def test_timeline(self):
        vault = SovereignVault()
        vault.add("First")
        vault.add("Second")
        vault.add("Third")
        timeline = vault.timeline(2)
        assert len(timeline) == 2

    def test_statistics(self):
        vault = SovereignVault()
        vault.add("Note one", memory_type=MemoryType.NOTE, tags=["a"])
        vault.add("Insight two", memory_type=MemoryType.INSIGHT, tags=["b"])
        stats = vault.statistics()
        assert stats.total_entries == 2
        assert "note" in stats.by_type
        assert "insight" in stats.by_type

    def test_export_import_roundtrip(self):
        vault = SovereignVault()
        vault.add("Memory Alpha", tags=["alpha"])
        vault.add("Memory Beta", tags=["beta"])
        exported = vault.export_vault()

        vault2 = SovereignVault()
        imported_count = vault2.import_vault(exported)
        assert imported_count == 2
        stats = vault2.statistics()
        assert stats.total_entries == 2

    def test_most_important(self):
        vault = SovereignVault()
        vault.add("Low importance", importance=0.1)
        vault.add("High importance", importance=0.95)
        vault.add("Medium importance", importance=0.5)
        top = vault.most_important(2)
        assert top[0].importance == 0.95

    def test_importance_clamped(self):
        vault = SovereignVault()
        entry = vault.add("Over limit", importance=5.0)
        assert entry.importance == 1.0


# ── AITaskRunner ───────────────────────────────────────────────────────────────

class TestAITaskRunner:

    def test_submit_task(self):
        runner = AITaskRunner()
        task = runner.submit("Test task", task_type=TaskType.REASONING)
        assert task.status == TaskStatus.QUEUED
        assert task.description == "Test task"

    def test_execute_task(self):
        runner = AITaskRunner()
        task = runner.submit("Analyze this", task_type=TaskType.ANALYSIS)
        result = runner.execute(task.task_id)
        assert result.status in (TaskStatus.COMPLETED, TaskStatus.FAILED)
        assert result.assigned_model is not None
        assert result.latency_ms > 0

    def test_execute_assigns_model(self):
        runner = AITaskRunner()
        task = runner.submit("Code this", task_type=TaskType.CODING, priority=Priority.HIGH)
        runner.execute(task.task_id)
        assert task.assigned_model is not None

    def test_submit_batch(self):
        runner = AITaskRunner()
        batch = runner.submit_batch([
            {"description": "Task 1", "type": "reasoning"},
            {"description": "Task 2", "type": "coding"},
        ])
        assert len(batch.tasks) == 2

    def test_execute_batch(self):
        runner = AITaskRunner()
        batch = runner.submit_batch([
            {"description": "Batch task 1", "type": "analysis"},
            {"description": "Batch task 2", "type": "creative"},
        ])
        result = runner.execute_batch(batch.batch_id)
        assert result.completed_count + result.failed_count == 2

    def test_cancel_queued_task(self):
        runner = AITaskRunner()
        task = runner.submit("Cancel me")
        assert runner.cancel(task.task_id) is True
        assert task.status == TaskStatus.CANCELLED

    def test_cannot_cancel_executed_task(self):
        runner = AITaskRunner()
        task = runner.submit("Run me")
        runner.execute(task.task_id)
        assert runner.cancel(task.task_id) is False

    def test_get_queue(self):
        runner = AITaskRunner()
        runner.submit("Low", priority=Priority.LOW)
        runner.submit("Critical", priority=Priority.CRITICAL)
        queue = runner.get_queue()
        assert queue[0].priority == Priority.CRITICAL

    def test_statistics(self):
        runner = AITaskRunner()
        task = runner.submit("Stat test")
        runner.execute(task.task_id)
        stats = runner.get_statistics()
        assert stats["total_executed"] == 1
        assert stats["total_submitted"] >= 1

    def test_leaderboard(self):
        runner = AITaskRunner()
        leaderboard = runner.get_leaderboard()
        assert len(leaderboard) == 40  # All seeded models

    def test_render_terminal(self):
        runner = AITaskRunner()
        runner.submit("Render test")
        runner.execute(list(runner._tasks.keys())[0])
        output = runner.render_terminal()
        assert "AI TASK RUNNER" in output
