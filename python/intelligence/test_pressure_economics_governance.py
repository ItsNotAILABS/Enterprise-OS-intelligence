"""
test_pressure_economics_governance.py — Economics + Governance pressure tests

These tests intentionally drive higher volumes to ensure the governance and
valuation engines remain deterministic and consistent under load.
"""

from __future__ import annotations

import os
import random
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from governance_monitor import (
    AlertRule,
    GovernanceMonitor,
    Proposal,
    ProposalStatus,
    ProposalType,
    UrgencyLevel,
)
from ip_valuation import IPCategory, IPAsset, IPValuationEngine, PHI_INV


def _proposal(i: int, proposal_type: ProposalType, participation: float) -> Proposal:
    total_power = 450_000_000.0
    participation = max(0.0, min(1.0, participation))
    yes_votes = total_power * participation
    return Proposal(
        title=f"[{i:04d}] {proposal_type.value} pressure test",
        proposal_type=proposal_type,
        total_voting_power=total_power,
        yes_votes=yes_votes,
        no_votes=0.0,
    )


def test_governance_pressure_ingest_sorting_stats_and_digest():
    monitor = GovernanceMonitor()

    monitor.add_alert_rule(AlertRule(name="High urgency", condition="urgency >= HIGH"))
    monitor.add_alert_rule(AlertRule(name="Network economics", condition="type == NETWORK_ECONOMICS"))
    monitor.add_alert_rule(AlertRule(name="Score threshold", condition="score > 0.65"))

    rng = random.Random(1337)
    types = [
        ProposalType.MOTION,
        ProposalType.NETWORK_ECONOMICS,
        ProposalType.UPGRADE_NETWORK,
        ProposalType.CREATE_SUBNET,
        ProposalType.SNS_INIT,
    ]

    n = 250
    expected_network_econ = 0
    expected_score_gt = 0
    for i in range(n):
        t = rng.choice(types)
        if t == ProposalType.NETWORK_ECONOMICS:
            expected_network_econ += 1

        # Bias participation to include a meaningful tail of high-urgency.
        participation = min(1.0, (rng.random() ** 0.35))
        p = monitor.ingest_proposal(_proposal(i, t, participation))
        if p.phi_score > 0.65:
            expected_score_gt += 1

    stats = monitor.get_statistics()
    assert stats["total_proposals"] == n
    assert stats["by_status"][ProposalStatus.OPEN.value] == n

    proposals = monitor.get_all_proposals(ProposalStatus.OPEN)
    assert proposals[0].phi_score >= proposals[-1].phi_score
    assert 0.0 <= stats["avg_phi_score"] <= 1.0

    digest = monitor.generate_governance_digest()
    assert "GOVERNANCE INTELLIGENCE DIGEST" in digest
    assert "Open Proposals" in digest

    pending = monitor.get_pending_alerts()
    # Every network economics proposal should trigger its type rule at least once.
    assert sum(1 for a in pending if "Network economics" in a.message) == expected_network_econ
    # "score > 0.65" should match tracked count.
    assert sum(1 for a in pending if "Score threshold" in a.message) == expected_score_gt
    # Some proposals should exceed HIGH urgency under the biased distribution.
    assert any(a.urgency.value >= UrgencyLevel.HIGH.value for a in pending)


def test_governance_pressure_watchers_and_acknowledgement():
    monitor = GovernanceMonitor()
    monitor.add_alert_rule(AlertRule(name="Critical only", condition="urgency >= CRITICAL"))

    observed = []
    monitor.register_watcher(lambda alert: observed.append(alert.alert_id))

    # Ensure CRITICAL classification: high type weight + full participation.
    monitor.ingest_proposal(_proposal(0, ProposalType.NETWORK_ECONOMICS, 1.0))
    pending = monitor.get_pending_alerts()
    assert len(pending) >= 1
    assert pending[0].alert_id in observed

    alert_id = pending[0].alert_id
    assert monitor.acknowledge_alert(alert_id) is True
    assert all(a.acknowledged is True for a in monitor._alerts if a.alert_id == alert_id)
    assert monitor.acknowledge_alert("does-not-exist") is False


def test_economics_pressure_portfolio_valuation_synergy_and_monotonicity():
    engine = IPValuationEngine()
    categories = list(IPCategory)

    # Construct a diverse portfolio to exercise synergy multiplier.
    assets = []
    for i in range(40):
        cat = categories[i % len(categories)]
        assets.append(
            IPAsset(
                name=f"Asset {i:02d}",
                category=cat,
                lines_of_code=10_000 + i * 50,
                research_papers=(i % 5),
                unique_algorithms=(i % 9),
                defensibility_score=min(1.0, 0.2 + 0.02 * i),
            )
        )

    # Assign TRLs without relying on enum ordering internals.
    from ip_valuation import TechnologyReadinessLevel
    trls = list(TechnologyReadinessLevel)
    for i, a in enumerate(assets):
        a.trl = trls[1 + (i % (len(trls) - 1))]

    pv = engine.value_portfolio("pressure", assets)
    assert pv.total_value_usd > 0
    assert pv.synergy_adjusted_value_usd >= pv.total_value_usd

    unique_categories = len(set(a.category for a in assets))
    expected_synergy = 1.0 + (unique_categories - 1) * PHI_INV * 0.1
    assert pv.synergy_multiplier == pytest.approx(expected_synergy)

    # Economic monotonicity smoke check: more LOC should increase value (all else equal).
    base = IPAsset(
        name="Base",
        category=IPCategory.ALGORITHM,
        lines_of_code=1_000,
        research_papers=0,
        unique_algorithms=1,
        defensibility_score=0.6,
    )
    bigger = IPAsset(
        name="Bigger",
        category=IPCategory.ALGORITHM,
        lines_of_code=5_000,
        research_papers=0,
        unique_algorithms=1,
        defensibility_score=0.6,
    )
    from ip_valuation import TechnologyReadinessLevel
    base.trl = TechnologyReadinessLevel.TRL_8
    bigger.trl = TechnologyReadinessLevel.TRL_8
    assert engine.value_asset(bigger).composite_value_usd > engine.value_asset(base).composite_value_usd
