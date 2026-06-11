"""
pressure_benchmark.py — Governance + Economics benchmark runner

This is a lightweight benchmark harness (stdlib-only) that measures:
  - latency (wall time)
  - peak memory growth (tracemalloc)
  - scaling exponent estimate (log-log slope across N)

Run:
  python pressure_benchmark.py
  python pressure_benchmark.py --json
  python pressure_benchmark.py --max-n 2000
"""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import sys
import time
import tracemalloc
from dataclasses import dataclass
from typing import Any

sys.path.insert(0, os.path.dirname(__file__))

from governance_monitor import GovernanceMonitor, Proposal, ProposalType
from ip_valuation import IPCategory, IPAsset, IPValuationEngine, TechnologyReadinessLevel


@dataclass(frozen=True)
class BenchPoint:
    n: int
    wall_ms: float
    peak_kb: float


def _measure(fn) -> tuple[float, float, Any]:
    tracemalloc.start()
    start = time.perf_counter()
    result = fn()
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return elapsed_ms, peak / 1024.0, result


def _slope(points: list[BenchPoint]) -> float | None:
    if len(points) < 2:
        return None
    xs = [math.log(p.n) for p in points]
    ys = [math.log(max(p.wall_ms, 1e-9)) for p in points]
    x_mean = sum(xs) / len(xs)
    y_mean = sum(ys) / len(ys)
    denom = sum((x - x_mean) ** 2 for x in xs)
    if denom == 0:
        return None
    return sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys)) / denom


def _bench_governance(n: int, seed: int) -> None:
    rng = random.Random(seed)
    monitor = GovernanceMonitor()
    types = [
        ProposalType.MOTION,
        ProposalType.NETWORK_ECONOMICS,
        ProposalType.UPGRADE_NETWORK,
        ProposalType.CREATE_SUBNET,
        ProposalType.SNS_INIT,
    ]
    total_power = 450_000_000.0
    for i in range(n):
        t = rng.choice(types)
        participation = min(1.0, (rng.random() ** 0.35))
        yes_votes = total_power * participation
        monitor.ingest_proposal(
            Proposal(
                title=f"[{i:05d}] {t.value} benchmark",
                proposal_type=t,
                total_voting_power=total_power,
                yes_votes=yes_votes,
                no_votes=0.0,
            )
        )
    _ = monitor.get_statistics()
    _ = monitor.generate_governance_digest()


def _bench_economics(n: int) -> None:
    engine = IPValuationEngine()
    categories = list(IPCategory)
    trls = list(TechnologyReadinessLevel)

    assets: list[IPAsset] = []
    for i in range(n):
        assets.append(
            IPAsset(
                name=f"Asset {i:05d}",
                category=categories[i % len(categories)],
                lines_of_code=10_000 + i * 3,
                research_papers=i % 5,
                unique_algorithms=i % 9,
                defensibility_score=min(1.0, 0.2 + 0.0005 * i),
                trl=trls[1 + (i % (len(trls) - 1))],
            )
        )

    _ = engine.value_portfolio("bench", assets)


def run(max_n: int, seed: int) -> dict[str, Any]:
    sizes = [250, 500, 1000, 2000]
    sizes = [n for n in sizes if n <= max_n]
    if not sizes:
        sizes = [max_n]

    gov_points: list[BenchPoint] = []
    eco_points: list[BenchPoint] = []

    for n in sizes:
        wall_ms, peak_kb, _ = _measure(lambda n=n: _bench_governance(n, seed))
        gov_points.append(BenchPoint(n=n, wall_ms=wall_ms, peak_kb=peak_kb))

    for n in sizes:
        wall_ms, peak_kb, _ = _measure(lambda n=n: _bench_economics(n))
        eco_points.append(BenchPoint(n=n, wall_ms=wall_ms, peak_kb=peak_kb))

    result = {
        "meta": {
            "seed": seed,
            "sizes": sizes,
        },
        "governance": {
            "points": [p.__dict__ for p in gov_points],
            "time_slope": _slope(gov_points),
        },
        "economics": {
            "points": [p.__dict__ for p in eco_points],
            "time_slope": _slope(eco_points),
        },
    }
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-n", type=int, default=2000)
    parser.add_argument("--seed", type=int, default=1337)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    data = run(max_n=args.max_n, seed=args.seed)
    if args.json:
        print(json.dumps(data, indent=2))
        return

    print("=" * 72)
    print("GOVERNANCE + ECONOMICS BENCHMARK")
    print("=" * 72)
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()

