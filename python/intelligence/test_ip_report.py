"""
test_ip_report.py — Tests for portfolio report construction
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from ip_report import build_enterprise_os_portfolio


def test_build_portfolio_contains_expected_assets():
    assets = build_enterprise_os_portfolio()
    assert len(assets) > 0

    names = [a.name for a in assets]
    assert len(set(names)) == len(names)
    assert "ORO — Organism for Runtime Observation" in names


def test_defensibility_scores_are_in_range_and_stable_for_oro():
    assets = build_enterprise_os_portfolio()
    for a in assets:
        assert 0.0 <= a.defensibility_score <= 1.0

    oro = next(a for a in assets if a.name == "ORO — Organism for Runtime Observation")
    assert oro.defensibility_score == pytest.approx(0.94)

