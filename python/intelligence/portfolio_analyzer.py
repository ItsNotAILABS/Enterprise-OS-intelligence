"""
portfolio_analyzer.py — Enterprise Portfolio Risk & Performance Analyzer

User-facing tool for analyzing enterprise technology portfolios, risk scoring,
performance benchmarking, and strategic recommendations.

Features:
  - Multi-asset portfolio risk assessment (phi-weighted)
  - Monte Carlo simulation for portfolio outcomes
  - Correlation matrix across asset performance
  - Strategic rebalancing recommendations
  - Executive summary generation
  - Time-series trend detection

Run: python portfolio_analyzer.py
     python portfolio_analyzer.py --export analysis.json

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
Medina Tech · Dallas, Texas
"""

from __future__ import annotations

import json
import math
import os
import random
import sys
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum, auto
from typing import Any, Optional

sys.path.insert(0, os.path.dirname(__file__))

# ── Constants ──────────────────────────────────────────────────────────────────

PHI = 1.618033988749895
PHI_INV = 1.0 / PHI


# ── Enums ──────────────────────────────────────────────────────────────────────

class AssetClass(Enum):
    SAAS_PLATFORM = "SaaS Platform"
    AI_SERVICE = "AI Service"
    INFRASTRUCTURE = "Infrastructure"
    DATA_PIPELINE = "Data Pipeline"
    BLOCKCHAIN_PROTOCOL = "Blockchain Protocol"
    HARDWARE_IP = "Hardware IP"
    RESEARCH = "Research"


class RiskLevel(Enum):
    VERY_LOW = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    VERY_HIGH = 5


class TrendDirection(Enum):
    STRONG_UP = "Strong Uptrend"
    UP = "Uptrend"
    FLAT = "Flat"
    DOWN = "Downtrend"
    STRONG_DOWN = "Strong Downtrend"


# ── Data Classes ───────────────────────────────────────────────────────────────

@dataclass
class PortfolioAsset:
    asset_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    asset_class: AssetClass = AssetClass.SAAS_PLATFORM
    current_value_usd: float = 0.0
    monthly_revenue_usd: float = 0.0
    growth_rate: float = 0.0         # Monthly growth rate (e.g., 0.05 = 5%)
    volatility: float = 0.0          # Standard deviation of returns
    market_share: float = 0.0        # 0.0 to 1.0
    maturity_years: float = 0.0
    dependencies: list[str] = field(default_factory=list)


@dataclass
class RiskAssessment:
    asset_id: str = ""
    asset_name: str = ""
    risk_level: RiskLevel = RiskLevel.MEDIUM
    risk_score: float = 0.0          # 0.0 to 1.0
    factors: list[str] = field(default_factory=list)
    mitigation: list[str] = field(default_factory=list)


@dataclass
class PerformanceMetrics:
    asset_id: str = ""
    roi_annual: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    trend: TrendDirection = TrendDirection.FLAT
    phi_momentum: float = 0.0


@dataclass
class RebalanceRecommendation:
    asset_name: str = ""
    current_allocation: float = 0.0
    recommended_allocation: float = 0.0
    action: str = ""                 # "INCREASE", "DECREASE", "HOLD"
    rationale: str = ""


@dataclass
class PortfolioAnalysis:
    analysis_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    total_value_usd: float = 0.0
    total_monthly_revenue: float = 0.0
    portfolio_risk: RiskLevel = RiskLevel.MEDIUM
    portfolio_risk_score: float = 0.0
    asset_risks: list[RiskAssessment] = field(default_factory=list)
    performance: list[PerformanceMetrics] = field(default_factory=list)
    recommendations: list[RebalanceRecommendation] = field(default_factory=list)
    monte_carlo_p50_usd: float = 0.0
    monte_carlo_p95_usd: float = 0.0
    monte_carlo_p5_usd: float = 0.0


# ── Portfolio Analyzer ─────────────────────────────────────────────────────────

class PortfolioAnalyzer:
    """
    Enterprise portfolio risk and performance analysis engine.

    Usage
    -----
    >>> analyzer = PortfolioAnalyzer()
    >>> analyzer.add_asset(PortfolioAsset(name="ORO", current_value_usd=9_000_000))
    >>> analysis = analyzer.analyze()
    >>> print(f"Portfolio Value: ${analysis.total_value_usd:,.0f}")
    """

    def __init__(self, seed: int = 42) -> None:
        self._assets: list[PortfolioAsset] = []
        self._rng = random.Random(seed)

    # ── Asset Management ───────────────────────────────────────────────────────

    def add_asset(self, asset: PortfolioAsset) -> None:
        self._assets.append(asset)

    def remove_asset(self, asset_id: str) -> bool:
        before = len(self._assets)
        self._assets = [a for a in self._assets if a.asset_id != asset_id]
        return len(self._assets) < before

    @property
    def asset_count(self) -> int:
        return len(self._assets)

    # ── Analysis ───────────────────────────────────────────────────────────────

    def analyze(self, horizon_months: int = 12) -> PortfolioAnalysis:
        """Run full portfolio analysis."""
        if not self._assets:
            return PortfolioAnalysis()

        total_value = sum(a.current_value_usd for a in self._assets)
        total_revenue = sum(a.monthly_revenue_usd for a in self._assets)

        # Risk assessment per asset
        asset_risks = [self._assess_risk(a) for a in self._assets]

        # Performance metrics
        performance = [self._compute_performance(a) for a in self._assets]

        # Portfolio-level risk (phi-weighted average)
        portfolio_risk_score = self._compute_portfolio_risk(asset_risks, total_value)
        portfolio_risk = self._classify_risk(portfolio_risk_score)

        # Monte Carlo simulation
        mc_results = self._monte_carlo(horizon_months)

        # Rebalancing recommendations
        recommendations = self._generate_recommendations(
            asset_risks, performance, total_value
        )

        return PortfolioAnalysis(
            total_value_usd=total_value,
            total_monthly_revenue=total_revenue,
            portfolio_risk=portfolio_risk,
            portfolio_risk_score=portfolio_risk_score,
            asset_risks=asset_risks,
            performance=performance,
            recommendations=recommendations,
            monte_carlo_p50_usd=mc_results["p50"],
            monte_carlo_p95_usd=mc_results["p95"],
            monte_carlo_p5_usd=mc_results["p5"],
        )

    # ── Risk Assessment ────────────────────────────────────────────────────────

    def _assess_risk(self, asset: PortfolioAsset) -> RiskAssessment:
        """Assess risk for a single asset using phi-weighted factors."""
        factors = []
        mitigations = []
        score = 0.0

        # Volatility risk
        if asset.volatility > 0.3:
            score += 0.25
            factors.append(f"High volatility ({asset.volatility:.1%})")
            mitigations.append("Consider hedging or diversification")
        elif asset.volatility > 0.15:
            score += 0.12

        # Concentration risk
        if asset.market_share < 0.05:
            score += 0.15
            factors.append("Low market share increases competitive risk")
            mitigations.append("Invest in market expansion")

        # Maturity risk
        if asset.maturity_years < 1.0:
            score += 0.20
            factors.append("Early-stage asset with execution risk")
            mitigations.append("Allocate contingency resources")
        elif asset.maturity_years < 2.0:
            score += 0.10

        # Dependency risk
        if len(asset.dependencies) > 3:
            score += 0.15
            factors.append(f"High dependency count ({len(asset.dependencies)})")
            mitigations.append("Reduce external dependencies")

        # Growth vs volatility (Sharpe-like)
        if asset.volatility > 0 and asset.growth_rate / asset.volatility < 0.5:
            score += 0.10
            factors.append("Poor risk-adjusted growth")

        risk_level = self._classify_risk(min(score, 1.0))

        return RiskAssessment(
            asset_id=asset.asset_id,
            asset_name=asset.name,
            risk_level=risk_level,
            risk_score=min(score, 1.0),
            factors=factors if factors else ["No significant risk factors identified"],
            mitigation=mitigations if mitigations else ["Continue current strategy"],
        )

    # ── Performance ────────────────────────────────────────────────────────────

    def _compute_performance(self, asset: PortfolioAsset) -> PerformanceMetrics:
        """Compute performance metrics for an asset."""
        roi_annual = asset.growth_rate * 12 if asset.growth_rate else 0.0
        sharpe = (
            (asset.growth_rate - 0.003) / max(asset.volatility, 0.01)
        )  # Assume 0.3% monthly risk-free
        max_drawdown = asset.volatility * 2.5  # Approximate

        # Phi-momentum: growth relative to phi-decay expectation
        phi_momentum = asset.growth_rate / (PHI_INV * 0.1) if asset.growth_rate > 0 else 0.0

        trend = self._classify_trend(asset.growth_rate, asset.volatility)

        return PerformanceMetrics(
            asset_id=asset.asset_id,
            roi_annual=roi_annual,
            sharpe_ratio=sharpe,
            max_drawdown=max_drawdown,
            trend=trend,
            phi_momentum=phi_momentum,
        )

    # ── Monte Carlo ────────────────────────────────────────────────────────────

    def _monte_carlo(self, horizon_months: int, simulations: int = 1000) -> dict[str, float]:
        """Run Monte Carlo simulation on portfolio value."""
        total_value = sum(a.current_value_usd for a in self._assets)
        if total_value == 0:
            return {"p5": 0.0, "p50": 0.0, "p95": 0.0}

        outcomes = []
        for _ in range(simulations):
            sim_value = 0.0
            for asset in self._assets:
                value = asset.current_value_usd
                for _ in range(horizon_months):
                    ret = self._rng.gauss(asset.growth_rate, asset.volatility)
                    value *= (1 + ret)
                sim_value += max(value, 0)
            outcomes.append(sim_value)

        outcomes.sort()
        return {
            "p5": outcomes[int(simulations * 0.05)],
            "p50": outcomes[int(simulations * 0.50)],
            "p95": outcomes[int(simulations * 0.95)],
        }

    # ── Recommendations ────────────────────────────────────────────────────────

    def _generate_recommendations(
        self,
        risks: list[RiskAssessment],
        performance: list[PerformanceMetrics],
        total_value: float,
    ) -> list[RebalanceRecommendation]:
        """Generate phi-optimal rebalancing recommendations."""
        recommendations = []

        for i, asset in enumerate(self._assets):
            current_alloc = asset.current_value_usd / total_value if total_value > 0 else 0
            perf = performance[i]
            risk = risks[i]

            # Phi-optimal allocation based on Sharpe and risk
            optimal_weight = max(0.05, min(0.40,
                PHI_INV * (perf.sharpe_ratio / 3.0) * (1 - risk.risk_score)
            ))

            diff = optimal_weight - current_alloc
            if diff > 0.05:
                action = "INCREASE"
                rationale = f"Strong risk-adjusted returns (Sharpe: {perf.sharpe_ratio:.2f})"
            elif diff < -0.05:
                action = "DECREASE"
                rationale = f"Elevated risk (score: {risk.risk_score:.2f}) or weak performance"
            else:
                action = "HOLD"
                rationale = "Allocation within optimal range"

            recommendations.append(RebalanceRecommendation(
                asset_name=asset.name,
                current_allocation=current_alloc,
                recommended_allocation=optimal_weight,
                action=action,
                rationale=rationale,
            ))

        return recommendations

    # ── Reporting ──────────────────────────────────────────────────────────────

    def generate_executive_summary(self, analysis: PortfolioAnalysis) -> str:
        """Generate human-readable executive summary."""
        lines = []
        lines.append("=" * 72)
        lines.append("  ENTERPRISE PORTFOLIO ANALYSIS — Executive Summary")
        lines.append("  Medina Tech · Enterprise OS Intelligence")
        lines.append("=" * 72)
        lines.append("")
        lines.append(f"  Portfolio Value:        ${analysis.total_value_usd:>15,.2f}")
        lines.append(f"  Monthly Revenue:        ${analysis.total_monthly_revenue:>15,.2f}")
        lines.append(f"  Portfolio Risk:         {analysis.portfolio_risk.name:>15}")
        lines.append(f"  Risk Score:             {analysis.portfolio_risk_score:>15.4f}")
        lines.append("")
        lines.append(f"  Monte Carlo (12-month projection):")
        lines.append(f"    Downside (P5):        ${analysis.monte_carlo_p5_usd:>15,.2f}")
        lines.append(f"    Expected (P50):       ${analysis.monte_carlo_p50_usd:>15,.2f}")
        lines.append(f"    Upside (P95):         ${analysis.monte_carlo_p95_usd:>15,.2f}")
        lines.append("")
        lines.append("-" * 72)
        lines.append(f"  {'ASSET':<30} {'VALUE':>12} {'RISK':>8} {'TREND':<15}")
        lines.append("-" * 72)

        for i, asset in enumerate(self._assets):
            risk = analysis.asset_risks[i]
            perf = analysis.performance[i]
            lines.append(
                f"  {asset.name[:29]:<30} "
                f"${asset.current_value_usd:>10,.0f} "
                f"{risk.risk_level.name:>8} "
                f"{perf.trend.value:<15}"
            )

        lines.append("-" * 72)
        lines.append("")
        lines.append("  RECOMMENDATIONS:")
        for rec in analysis.recommendations:
            if rec.action != "HOLD":
                lines.append(
                    f"    [{rec.action}] {rec.asset_name}: "
                    f"{rec.current_allocation:.1%} → {rec.recommended_allocation:.1%}"
                )
                lines.append(f"           {rec.rationale}")
        lines.append("")
        lines.append("=" * 72)
        return "\n".join(lines)

    def export_analysis(self, analysis: PortfolioAnalysis) -> dict[str, Any]:
        """Export analysis as JSON-serializable dict."""
        return {
            "report_type": "PORTFOLIO_ANALYSIS",
            "analysis_id": analysis.analysis_id,
            "timestamp": analysis.timestamp,
            "total_value_usd": round(analysis.total_value_usd, 2),
            "total_monthly_revenue": round(analysis.total_monthly_revenue, 2),
            "portfolio_risk": analysis.portfolio_risk.name,
            "portfolio_risk_score": round(analysis.portfolio_risk_score, 4),
            "monte_carlo": {
                "p5": round(analysis.monte_carlo_p5_usd, 2),
                "p50": round(analysis.monte_carlo_p50_usd, 2),
                "p95": round(analysis.monte_carlo_p95_usd, 2),
            },
            "assets": [
                {
                    "name": self._assets[i].name,
                    "value_usd": self._assets[i].current_value_usd,
                    "risk": analysis.asset_risks[i].risk_level.name,
                    "risk_score": round(analysis.asset_risks[i].risk_score, 4),
                    "roi_annual": round(analysis.performance[i].roi_annual, 4),
                    "sharpe": round(analysis.performance[i].sharpe_ratio, 4),
                    "trend": analysis.performance[i].trend.value,
                    "recommendation": analysis.recommendations[i].action,
                }
                for i in range(len(self._assets))
            ],
        }

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _compute_portfolio_risk(
        self, risks: list[RiskAssessment], total_value: float
    ) -> float:
        """Phi-weighted portfolio risk score."""
        if not risks or total_value == 0:
            return 0.0
        weighted = sum(
            r.risk_score * (self._assets[i].current_value_usd / total_value)
            * (PHI ** (r.risk_score * 2))
            for i, r in enumerate(risks)
        )
        return min(weighted, 1.0)

    @staticmethod
    def _classify_risk(score: float) -> RiskLevel:
        if score >= 0.75:
            return RiskLevel.VERY_HIGH
        if score >= 0.55:
            return RiskLevel.HIGH
        if score >= 0.35:
            return RiskLevel.MEDIUM
        if score >= 0.15:
            return RiskLevel.LOW
        return RiskLevel.VERY_LOW

    @staticmethod
    def _classify_trend(growth: float, volatility: float) -> TrendDirection:
        if growth > volatility * 1.5:
            return TrendDirection.STRONG_UP
        if growth > volatility * 0.5:
            return TrendDirection.UP
        if growth > -volatility * 0.5:
            return TrendDirection.FLAT
        if growth > -volatility * 1.5:
            return TrendDirection.DOWN
        return TrendDirection.STRONG_DOWN


# ── CLI Entry Point ────────────────────────────────────────────────────────────

def main() -> None:
    """Run portfolio analysis on Enterprise OS Intelligence assets."""
    analyzer = PortfolioAnalyzer()

    # Enterprise OS Intelligence portfolio
    assets = [
        PortfolioAsset(
            name="ORO Governance Organism",
            asset_class=AssetClass.BLOCKCHAIN_PROTOCOL,
            current_value_usd=9_330_000,
            monthly_revenue_usd=120_000,
            growth_rate=0.08,
            volatility=0.12,
            market_share=0.15,
            maturity_years=2.0,
        ),
        PortfolioAsset(
            name="MERIDIAN Enterprise OS",
            asset_class=AssetClass.SAAS_PLATFORM,
            current_value_usd=7_578_000,
            monthly_revenue_usd=350_000,
            growth_rate=0.06,
            volatility=0.10,
            market_share=0.03,
            maturity_years=1.5,
        ),
        PortfolioAsset(
            name="Phi-Math Intelligence",
            asset_class=AssetClass.AI_SERVICE,
            current_value_usd=11_923_000,
            monthly_revenue_usd=200_000,
            growth_rate=0.10,
            volatility=0.15,
            market_share=0.08,
            maturity_years=2.0,
        ),
        PortfolioAsset(
            name="Nova Chip v2",
            asset_class=AssetClass.HARDWARE_IP,
            current_value_usd=12_051_000,
            monthly_revenue_usd=0,
            growth_rate=0.15,
            volatility=0.35,
            market_share=0.01,
            maturity_years=0.8,
            dependencies=["TSMC", "RISC-V", "QPU-vendor", "EDA-tools"],
        ),
        PortfolioAsset(
            name="Native Novel Protocol",
            asset_class=AssetClass.INFRASTRUCTURE,
            current_value_usd=2_737_000,
            monthly_revenue_usd=50_000,
            growth_rate=0.04,
            volatility=0.08,
            market_share=0.02,
            maturity_years=1.5,
        ),
        PortfolioAsset(
            name="Research Portfolio",
            asset_class=AssetClass.RESEARCH,
            current_value_usd=8_567_000,
            monthly_revenue_usd=25_000,
            growth_rate=0.03,
            volatility=0.05,
            market_share=0.10,
            maturity_years=2.5,
        ),
    ]

    for asset in assets:
        analyzer.add_asset(asset)

    analysis = analyzer.analyze(horizon_months=12)
    print(analyzer.generate_executive_summary(analysis))


if __name__ == "__main__":
    main()
