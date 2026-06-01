"""
ip_valuation.py — Intellectual Property Valuation Engine

Python implementation of sovereign IP valuation for Enterprise OS Intelligence.

Provides:
  - Multi-method IP valuation (Cost, Market, Income, Relief-from-Royalty)
  - Technology readiness level (TRL) assessment
  - Phi-weighted composite scoring across IP dimensions
  - Portfolio aggregation with synergy multipliers
  - Prior art defensibility scoring
  - Report generation for IP disclosure and licensing

Ring: Governance Ring | Wire: intelligence-wire/valuation

Copyright (c) 2026 Alfredo Medina Hernandez. All Rights Reserved.
Medina Tech · Dallas, Texas
"""

from __future__ import annotations

import json
import math
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum, auto
from typing import Any, Optional


# ── Constants ──────────────────────────────────────────────────────────────────

PHI = 1.618033988749895
PHI_INV = 1.0 / PHI


# ── Enums ──────────────────────────────────────────────────────────────────────

class IPCategory(Enum):
    SOFTWARE_ARCHITECTURE = auto()
    ALGORITHM = auto()
    PROTOCOL = auto()
    DATA_STRUCTURE = auto()
    AI_MODEL = auto()
    TRADE_SECRET = auto()
    RESEARCH_PAPER = auto()
    SYSTEM_DESIGN = auto()


class ValuationMethod(Enum):
    COST = auto()           # Replacement cost approach
    MARKET = auto()         # Comparable transactions
    INCOME = auto()         # Discounted future cash flows
    RELIEF_FROM_ROYALTY = auto()  # Royalty savings method


class TechnologyReadinessLevel(Enum):
    TRL_1 = 1   # Basic principles observed
    TRL_2 = 2   # Technology concept formulated
    TRL_3 = 3   # Experimental proof of concept
    TRL_4 = 4   # Technology validated in lab
    TRL_5 = 5   # Technology validated in relevant environment
    TRL_6 = 6   # Technology demonstrated in relevant environment
    TRL_7 = 7   # System prototype demonstration
    TRL_8 = 8   # System complete and qualified
    TRL_9 = 9   # Actual system proven in operational environment


# ── Data Classes ───────────────────────────────────────────────────────────────

@dataclass
class IPAsset:
    """Represents a single intellectual property asset."""
    asset_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    category: IPCategory = IPCategory.SOFTWARE_ARCHITECTURE
    description: str = ""
    trl: TechnologyReadinessLevel = TechnologyReadinessLevel.TRL_5
    prior_art_date: Optional[str] = None
    lines_of_code: int = 0
    research_papers: int = 0
    unique_algorithms: int = 0
    dependencies: list[str] = field(default_factory=list)
    defensibility_score: float = 0.0  # 0.0 to 1.0


@dataclass
class ValuationResult:
    """Result of a single valuation method applied to an asset."""
    method: ValuationMethod
    value_usd: float
    confidence: float  # 0.0 to 1.0
    assumptions: list[str] = field(default_factory=list)
    breakdown: dict[str, float] = field(default_factory=dict)


@dataclass
class CompositeValuation:
    """Phi-weighted composite valuation across multiple methods."""
    asset_id: str
    asset_name: str
    individual_valuations: list[ValuationResult] = field(default_factory=list)
    composite_value_usd: float = 0.0
    confidence: float = 0.0
    trl_multiplier: float = 1.0
    defensibility_multiplier: float = 1.0
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


@dataclass
class PortfolioValuation:
    """Aggregated valuation for an entire IP portfolio."""
    portfolio_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    portfolio_name: str = ""
    asset_valuations: list[CompositeValuation] = field(default_factory=list)
    total_value_usd: float = 0.0
    synergy_multiplier: float = 1.0
    synergy_adjusted_value_usd: float = 0.0
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


# ── Valuation Engine ───────────────────────────────────────────────────────────

class IPValuationEngine:
    """
    Phi-weighted multi-method IP valuation engine.

    Applies four standard IP valuation approaches and combines them
    using phi-harmonic weighting based on confidence levels.

    Usage
    -----
    >>> engine = IPValuationEngine()
    >>> asset = IPAsset(name="ORO Governance Organism", category=IPCategory.SOFTWARE_ARCHITECTURE)
    >>> result = engine.value_asset(asset)
    >>> print(f"${result.composite_value_usd:,.0f}")
    """

    # ── Industry benchmarks (per-unit cost bases) ──────────────────────────────

    COST_PER_LOC: float = 75.0            # USD per line of code (senior engineer)
    COST_PER_PAPER: float = 150_000.0     # Research paper development cost
    COST_PER_ALGORITHM: float = 500_000.0 # Novel algorithm R&D cost
    MARKET_MULTIPLIER_BASE: float = 3.5   # Market value / cost ratio for novel IP
    ROYALTY_RATE_BASE: float = 0.05       # 5% royalty rate for software IP
    DISCOUNT_RATE: float = 0.12           # 12% WACC for tech IP
    REVENUE_HORIZON_YEARS: int = 10       # Income valuation horizon

    # ── TRL multipliers (TRL → value realization factor) ───────────────────────

    TRL_MULTIPLIERS: dict[int, float] = {
        1: 0.10, 2: 0.15, 3: 0.25, 4: 0.40, 5: 0.55,
        6: 0.70, 7: 0.82, 8: 0.92, 9: 1.00,
    }

    def __init__(self) -> None:
        self._valuations: list[CompositeValuation] = []

    # ── Cost approach ──────────────────────────────────────────────────────────

    def _value_cost(self, asset: IPAsset) -> ValuationResult:
        """Replacement cost approach: what would it cost to recreate?"""
        loc_cost = asset.lines_of_code * self.COST_PER_LOC
        paper_cost = asset.research_papers * self.COST_PER_PAPER
        algo_cost = asset.unique_algorithms * self.COST_PER_ALGORITHM
        overhead = (loc_cost + paper_cost + algo_cost) * 0.35  # Management overhead

        total = loc_cost + paper_cost + algo_cost + overhead
        confidence = min(0.85, 0.5 + (asset.lines_of_code / 100_000) * 0.35)

        return ValuationResult(
            method=ValuationMethod.COST,
            value_usd=total,
            confidence=confidence,
            assumptions=[
                f"Cost/LOC: ${self.COST_PER_LOC}",
                f"Cost/paper: ${self.COST_PER_PAPER:,.0f}",
                f"Cost/algorithm: ${self.COST_PER_ALGORITHM:,.0f}",
                "35% overhead factor applied",
            ],
            breakdown={
                "lines_of_code_cost": loc_cost,
                "research_papers_cost": paper_cost,
                "algorithms_cost": algo_cost,
                "overhead": overhead,
            },
        )

    # ── Market approach ────────────────────────────────────────────────────────

    def _value_market(self, asset: IPAsset) -> ValuationResult:
        """Market comparable approach: what do similar assets sell for?"""
        cost_val = self._value_cost(asset)
        category_mult = {
            IPCategory.SOFTWARE_ARCHITECTURE: 4.0,
            IPCategory.ALGORITHM: 5.0,
            IPCategory.PROTOCOL: 3.5,
            IPCategory.DATA_STRUCTURE: 3.0,
            IPCategory.AI_MODEL: 6.0,
            IPCategory.TRADE_SECRET: 4.5,
            IPCategory.RESEARCH_PAPER: 2.0,
            IPCategory.SYSTEM_DESIGN: 3.8,
        }
        mult = category_mult.get(asset.category, self.MARKET_MULTIPLIER_BASE)

        # Phi-adjust multiplier by TRL
        trl_factor = self.TRL_MULTIPLIERS.get(asset.trl.value, 0.55)
        adjusted_mult = mult * (PHI_INV + trl_factor * (1.0 - PHI_INV))

        total = cost_val.value_usd * adjusted_mult
        confidence = 0.55 * asset.defensibility_score + 0.20

        return ValuationResult(
            method=ValuationMethod.MARKET,
            value_usd=total,
            confidence=confidence,
            assumptions=[
                f"Category multiplier: {mult:.1f}x",
                f"TRL-adjusted multiplier: {adjusted_mult:.2f}x",
                f"Based on cost replacement of ${cost_val.value_usd:,.0f}",
            ],
            breakdown={
                "base_cost": cost_val.value_usd,
                "category_multiplier": mult,
                "trl_adjusted_multiplier": adjusted_mult,
            },
        )

    # ── Income approach ────────────────────────────────────────────────────────

    def _value_income(self, asset: IPAsset) -> ValuationResult:
        """Discounted cash flow approach: projected future revenues from IP."""
        # Estimate annual revenue potential based on asset characteristics
        base_annual = (
            asset.lines_of_code * 2.5 +
            asset.research_papers * 50_000 +
            asset.unique_algorithms * 200_000
        )
        trl_factor = self.TRL_MULTIPLIERS.get(asset.trl.value, 0.55)
        adjusted_annual = base_annual * trl_factor

        # DCF over horizon
        dcf_sum = 0.0
        for year in range(1, self.REVENUE_HORIZON_YEARS + 1):
            # Revenue grows at phi-rate, capped
            growth = min(PHI_INV ** year, 1.0)
            cash_flow = adjusted_annual * growth
            discounted = cash_flow / ((1 + self.DISCOUNT_RATE) ** year)
            dcf_sum += discounted

        confidence = trl_factor * 0.6 + asset.defensibility_score * 0.3

        return ValuationResult(
            method=ValuationMethod.INCOME,
            value_usd=dcf_sum,
            confidence=min(confidence, 0.75),
            assumptions=[
                f"Base annual revenue: ${adjusted_annual:,.0f}",
                f"Discount rate: {self.DISCOUNT_RATE*100:.0f}%",
                f"Horizon: {self.REVENUE_HORIZON_YEARS} years",
                "Phi-decay growth model applied",
            ],
            breakdown={
                "base_annual_revenue": base_annual,
                "trl_adjusted_annual": adjusted_annual,
                "dcf_total": dcf_sum,
            },
        )

    # ── Relief from royalty ────────────────────────────────────────────────────

    def _value_royalty(self, asset: IPAsset) -> ValuationResult:
        """Relief-from-royalty: what royalties would you pay if you didn't own it?"""
        income_val = self._value_income(asset)
        base_revenue = income_val.breakdown.get("trl_adjusted_annual", 0.0)

        # Royalty rate adjusted by category
        royalty_rates = {
            IPCategory.SOFTWARE_ARCHITECTURE: 0.08,
            IPCategory.ALGORITHM: 0.10,
            IPCategory.PROTOCOL: 0.06,
            IPCategory.DATA_STRUCTURE: 0.05,
            IPCategory.AI_MODEL: 0.12,
            IPCategory.TRADE_SECRET: 0.09,
            IPCategory.RESEARCH_PAPER: 0.03,
            IPCategory.SYSTEM_DESIGN: 0.07,
        }
        rate = royalty_rates.get(asset.category, self.ROYALTY_RATE_BASE)

        # Present value of royalty savings
        pv_royalty = 0.0
        for year in range(1, self.REVENUE_HORIZON_YEARS + 1):
            growth = min(PHI_INV ** year, 1.0)
            royalty_saving = base_revenue * growth * rate
            discounted = royalty_saving / ((1 + self.DISCOUNT_RATE) ** year)
            pv_royalty += discounted

        confidence = 0.65 * asset.defensibility_score + 0.25

        return ValuationResult(
            method=ValuationMethod.RELIEF_FROM_ROYALTY,
            value_usd=pv_royalty,
            confidence=min(confidence, 0.80),
            assumptions=[
                f"Royalty rate: {rate*100:.1f}%",
                f"Base revenue: ${base_revenue:,.0f}",
                f"Discount rate: {self.DISCOUNT_RATE*100:.0f}%",
            ],
            breakdown={
                "royalty_rate": rate,
                "base_revenue": base_revenue,
                "pv_royalty_savings": pv_royalty,
            },
        )

    # ── Composite valuation ────────────────────────────────────────────────────

    def value_asset(self, asset: IPAsset) -> CompositeValuation:
        """
        Apply all four valuation methods and compute phi-weighted composite.

        The composite uses confidence-weighted harmonic averaging
        with phi-scaling to favor higher-confidence methods.
        """
        valuations = [
            self._value_cost(asset),
            self._value_market(asset),
            self._value_income(asset),
            self._value_royalty(asset),
        ]

        # Phi-weighted composite: weight = confidence^phi
        weighted_sum = 0.0
        weight_total = 0.0
        for v in valuations:
            w = v.confidence ** PHI
            weighted_sum += v.value_usd * w
            weight_total += w

        composite_value = weighted_sum / weight_total if weight_total > 0 else 0.0

        # TRL and defensibility multipliers
        trl_mult = self.TRL_MULTIPLIERS.get(asset.trl.value, 0.55)
        def_mult = 0.5 + asset.defensibility_score * 0.5  # Range [0.5, 1.0]

        # Final adjusted value
        adjusted_value = composite_value * trl_mult * def_mult

        avg_confidence = sum(v.confidence for v in valuations) / len(valuations)

        result = CompositeValuation(
            asset_id=asset.asset_id,
            asset_name=asset.name,
            individual_valuations=valuations,
            composite_value_usd=adjusted_value,
            confidence=avg_confidence,
            trl_multiplier=trl_mult,
            defensibility_multiplier=def_mult,
        )
        self._valuations.append(result)
        return result

    # ── Portfolio valuation ────────────────────────────────────────────────────

    def value_portfolio(
        self, portfolio_name: str, assets: list[IPAsset]
    ) -> PortfolioValuation:
        """
        Value an entire IP portfolio with synergy effects.

        Synergy multiplier grows with portfolio breadth (more categories)
        using phi-harmonic scaling.
        """
        asset_vals = [self.value_asset(a) for a in assets]
        total = sum(av.composite_value_usd for av in asset_vals)

        # Synergy: more diverse categories → greater total value
        unique_categories = len(set(a.category for a in assets))
        synergy = 1.0 + (unique_categories - 1) * PHI_INV * 0.1  # +6.18% per category

        return PortfolioValuation(
            portfolio_name=portfolio_name,
            asset_valuations=asset_vals,
            total_value_usd=total,
            synergy_multiplier=synergy,
            synergy_adjusted_value_usd=total * synergy,
        )

    # ── Defensibility scoring ──────────────────────────────────────────────────

    @staticmethod
    def compute_defensibility(
        has_prior_art: bool = False,
        novel_algorithms: int = 0,
        published_papers: int = 0,
        unique_architecture: bool = False,
        trade_secret_protected: bool = False,
        years_of_development: float = 0.0,
    ) -> float:
        """
        Compute defensibility score (0.0 to 1.0) based on IP strength factors.
        """
        score = 0.0
        if has_prior_art:
            score += 0.20
        if novel_algorithms > 0:
            score += min(novel_algorithms * 0.05, 0.20)
        if published_papers > 0:
            score += min(published_papers * 0.02, 0.20)
        if unique_architecture:
            score += 0.15
        if trade_secret_protected:
            score += 0.15
        if years_of_development > 0:
            score += min(years_of_development * 0.02, 0.10)
        return min(score, 1.0)

    # ── Report generation ──────────────────────────────────────────────────────

    def generate_report(self, valuation: CompositeValuation) -> dict[str, Any]:
        """Generate structured IP valuation report."""
        return {
            "report_type": "IP_VALUATION",
            "asset_id": valuation.asset_id,
            "asset_name": valuation.asset_name,
            "composite_value_usd": round(valuation.composite_value_usd, 2),
            "confidence": round(valuation.confidence, 4),
            "trl_multiplier": valuation.trl_multiplier,
            "defensibility_multiplier": valuation.defensibility_multiplier,
            "methods": [
                {
                    "method": v.method.name,
                    "value_usd": round(v.value_usd, 2),
                    "confidence": round(v.confidence, 4),
                    "assumptions": v.assumptions,
                }
                for v in valuation.individual_valuations
            ],
            "timestamp": valuation.timestamp,
        }

    def generate_portfolio_report(self, pv: PortfolioValuation) -> dict[str, Any]:
        """Generate structured portfolio-level IP valuation report."""
        return {
            "report_type": "PORTFOLIO_IP_VALUATION",
            "portfolio_id": pv.portfolio_id,
            "portfolio_name": pv.portfolio_name,
            "total_value_usd": round(pv.total_value_usd, 2),
            "synergy_multiplier": round(pv.synergy_multiplier, 4),
            "synergy_adjusted_value_usd": round(pv.synergy_adjusted_value_usd, 2),
            "asset_count": len(pv.asset_valuations),
            "assets": [
                {
                    "name": av.asset_name,
                    "value_usd": round(av.composite_value_usd, 2),
                    "confidence": round(av.confidence, 4),
                }
                for av in pv.asset_valuations
            ],
            "timestamp": pv.timestamp,
        }
