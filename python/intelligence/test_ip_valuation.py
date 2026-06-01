"""
test_ip_valuation.py — IP Valuation Engine Test Suite

Tests for:
  - IPValuationEngine (ip_valuation.py)
  - Cost / Market / Income / Royalty methods
  - Composite and portfolio valuation
  - Defensibility scoring
  - Report generation

Run: python -m pytest test_ip_valuation.py -v
"""

import json
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from ip_valuation import (
    IPValuationEngine,
    IPAsset,
    IPCategory,
    TechnologyReadinessLevel,
    ValuationMethod,
    CompositeValuation,
    PortfolioValuation,
)


# ── IPValuationEngine ──────────────────────────────────────────────────────────

class TestIPValuationEngine:

    def _sample_asset(self) -> IPAsset:
        return IPAsset(
            name="Test Asset",
            category=IPCategory.SOFTWARE_ARCHITECTURE,
            trl=TechnologyReadinessLevel.TRL_7,
            lines_of_code=10_000,
            research_papers=3,
            unique_algorithms=4,
            defensibility_score=0.75,
        )

    def test_value_asset_returns_composite(self):
        engine = IPValuationEngine()
        asset = self._sample_asset()
        result = engine.value_asset(asset)
        assert isinstance(result, CompositeValuation)
        assert result.composite_value_usd > 0

    def test_value_asset_has_four_methods(self):
        engine = IPValuationEngine()
        asset = self._sample_asset()
        result = engine.value_asset(asset)
        assert len(result.individual_valuations) == 4

    def test_all_methods_positive_value(self):
        engine = IPValuationEngine()
        asset = self._sample_asset()
        result = engine.value_asset(asset)
        for v in result.individual_valuations:
            assert v.value_usd > 0

    def test_cost_method_breakdown(self):
        engine = IPValuationEngine()
        asset = self._sample_asset()
        result = engine.value_asset(asset)
        cost_val = next(
            v for v in result.individual_valuations
            if v.method == ValuationMethod.COST
        )
        assert "lines_of_code_cost" in cost_val.breakdown
        assert "research_papers_cost" in cost_val.breakdown
        assert "algorithms_cost" in cost_val.breakdown
        assert "overhead" in cost_val.breakdown

    def test_market_multiplier_applied(self):
        engine = IPValuationEngine()
        asset = self._sample_asset()
        result = engine.value_asset(asset)
        cost_val = next(
            v for v in result.individual_valuations
            if v.method == ValuationMethod.COST
        )
        market_val = next(
            v for v in result.individual_valuations
            if v.method == ValuationMethod.MARKET
        )
        assert market_val.value_usd > cost_val.value_usd

    def test_higher_trl_increases_value(self):
        engine = IPValuationEngine()
        low_trl = IPAsset(
            name="Low TRL",
            category=IPCategory.ALGORITHM,
            trl=TechnologyReadinessLevel.TRL_2,
            lines_of_code=5_000,
            research_papers=1,
            unique_algorithms=2,
            defensibility_score=0.5,
        )
        high_trl = IPAsset(
            name="High TRL",
            category=IPCategory.ALGORITHM,
            trl=TechnologyReadinessLevel.TRL_9,
            lines_of_code=5_000,
            research_papers=1,
            unique_algorithms=2,
            defensibility_score=0.5,
        )
        low_result = engine.value_asset(low_trl)
        high_result = engine.value_asset(high_trl)
        assert high_result.composite_value_usd > low_result.composite_value_usd

    def test_defensibility_affects_value(self):
        engine = IPValuationEngine()
        low_def = IPAsset(
            name="Low Def",
            category=IPCategory.PROTOCOL,
            trl=TechnologyReadinessLevel.TRL_6,
            lines_of_code=5_000,
            research_papers=1,
            unique_algorithms=2,
            defensibility_score=0.2,
        )
        high_def = IPAsset(
            name="High Def",
            category=IPCategory.PROTOCOL,
            trl=TechnologyReadinessLevel.TRL_6,
            lines_of_code=5_000,
            research_papers=1,
            unique_algorithms=2,
            defensibility_score=0.95,
        )
        low_result = engine.value_asset(low_def)
        high_result = engine.value_asset(high_def)
        assert high_result.composite_value_usd > low_result.composite_value_usd

    def test_portfolio_valuation(self):
        engine = IPValuationEngine()
        assets = [
            IPAsset(
                name="Asset A",
                category=IPCategory.SOFTWARE_ARCHITECTURE,
                trl=TechnologyReadinessLevel.TRL_7,
                lines_of_code=10_000,
                research_papers=2,
                unique_algorithms=3,
                defensibility_score=0.7,
            ),
            IPAsset(
                name="Asset B",
                category=IPCategory.ALGORITHM,
                trl=TechnologyReadinessLevel.TRL_6,
                lines_of_code=5_000,
                research_papers=1,
                unique_algorithms=5,
                defensibility_score=0.8,
            ),
        ]
        pv = engine.value_portfolio("Test Portfolio", assets)
        assert isinstance(pv, PortfolioValuation)
        assert pv.total_value_usd > 0
        assert pv.synergy_multiplier > 1.0
        assert pv.synergy_adjusted_value_usd > pv.total_value_usd

    def test_synergy_increases_with_diversity(self):
        engine = IPValuationEngine()
        # Same category
        same = [
            IPAsset(name="A", category=IPCategory.ALGORITHM,
                    trl=TechnologyReadinessLevel.TRL_5,
                    lines_of_code=1_000, research_papers=1,
                    unique_algorithms=1, defensibility_score=0.5),
            IPAsset(name="B", category=IPCategory.ALGORITHM,
                    trl=TechnologyReadinessLevel.TRL_5,
                    lines_of_code=1_000, research_papers=1,
                    unique_algorithms=1, defensibility_score=0.5),
        ]
        # Diverse categories
        diverse = [
            IPAsset(name="A", category=IPCategory.ALGORITHM,
                    trl=TechnologyReadinessLevel.TRL_5,
                    lines_of_code=1_000, research_papers=1,
                    unique_algorithms=1, defensibility_score=0.5),
            IPAsset(name="B", category=IPCategory.PROTOCOL,
                    trl=TechnologyReadinessLevel.TRL_5,
                    lines_of_code=1_000, research_papers=1,
                    unique_algorithms=1, defensibility_score=0.5),
        ]
        pv_same = engine.value_portfolio("Same", same)
        pv_diverse = engine.value_portfolio("Diverse", diverse)
        assert pv_diverse.synergy_multiplier > pv_same.synergy_multiplier


# ── Defensibility ──────────────────────────────────────────────────────────────

class TestDefensibility:

    def test_zero_factors_returns_zero(self):
        score = IPValuationEngine.compute_defensibility()
        assert score == 0.0

    def test_all_factors_returns_max(self):
        score = IPValuationEngine.compute_defensibility(
            has_prior_art=True,
            novel_algorithms=10,
            published_papers=20,
            unique_architecture=True,
            trade_secret_protected=True,
            years_of_development=10.0,
        )
        assert score == 1.0

    def test_prior_art_adds_score(self):
        without = IPValuationEngine.compute_defensibility(has_prior_art=False)
        with_art = IPValuationEngine.compute_defensibility(has_prior_art=True)
        assert with_art > without

    def test_score_capped_at_one(self):
        score = IPValuationEngine.compute_defensibility(
            has_prior_art=True,
            novel_algorithms=100,
            published_papers=100,
            unique_architecture=True,
            trade_secret_protected=True,
            years_of_development=100.0,
        )
        assert score == 1.0


# ── Report generation ──────────────────────────────────────────────────────────

class TestReportGeneration:

    def test_generate_asset_report(self):
        engine = IPValuationEngine()
        asset = IPAsset(
            name="Test",
            category=IPCategory.AI_MODEL,
            trl=TechnologyReadinessLevel.TRL_5,
            lines_of_code=8_000,
            research_papers=2,
            unique_algorithms=3,
            defensibility_score=0.6,
        )
        valuation = engine.value_asset(asset)
        report = engine.generate_report(valuation)
        assert report["report_type"] == "IP_VALUATION"
        assert report["composite_value_usd"] > 0
        assert len(report["methods"]) == 4

    def test_generate_portfolio_report(self):
        engine = IPValuationEngine()
        assets = [
            IPAsset(name="X", category=IPCategory.PROTOCOL,
                    trl=TechnologyReadinessLevel.TRL_6,
                    lines_of_code=5_000, research_papers=1,
                    unique_algorithms=2, defensibility_score=0.7),
        ]
        pv = engine.value_portfolio("TestPortfolio", assets)
        report = engine.generate_portfolio_report(pv)
        assert report["report_type"] == "PORTFOLIO_IP_VALUATION"
        assert report["portfolio_name"] == "TestPortfolio"
        assert report["asset_count"] == 1

    def test_report_serializable_as_json(self):
        engine = IPValuationEngine()
        asset = IPAsset(
            name="JSON Test",
            category=IPCategory.TRADE_SECRET,
            trl=TechnologyReadinessLevel.TRL_4,
            lines_of_code=3_000,
            research_papers=1,
            unique_algorithms=1,
            defensibility_score=0.5,
        )
        valuation = engine.value_asset(asset)
        report = engine.generate_report(valuation)
        # Should not raise
        json_str = json.dumps(report)
        assert len(json_str) > 0
