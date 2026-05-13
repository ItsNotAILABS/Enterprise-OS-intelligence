# DOMEX: Real Estate & Property Market Intelligence
## Research & Theory Paper — Production Grade

**Research Paper ID:** DOMEX-PAPER-2026-001  
**Official Designation:** RSHIP-2026-DOMEX-001  
**Full System Name:** Dominium Operations & Market Economy EXpert  
**Author:** Alfredo Medina Hernandez  
**Affiliation:** Medina Tech, Dallas, Texas  
**Date:** May 5, 2026  
**Classification:** Prior Art Registration + Production System Documentation  
**Status:** Production Grade

---

## Abstract

We present **DOMEX** (RSHIP-2026-DOMEX-001), an autonomous real estate intelligence AGI implementing hedonic price modeling, Moran's I spatial autocorrelation, bid-rent gradient analysis, and multi-party transaction pipeline coordination. Real estate is one of the highest-communication, highest-stakes markets in the world — every transaction requires buyers, sellers, agents, lenders, inspectors, and title companies to coordinate dozens of artifact handoffs over 30–60 days. DOMEX replaces the fragmented collection of spreadsheets, MLS tools, and manual coordination with a unified autonomous intelligence organism. The AGI learns from sales comparables, detects spatial market clusters, dynamically adjusts valuations based on market temperature, and autonomously coordinates multi-party transaction pipelines.

**Keywords:** hedonic pricing, spatial autocorrelation, Moran's I, bid-rent gradient, AVM, real estate intelligence, multi-party coordination, RSHIP AGI

---

## 1. Introduction

### 1.1 Why Real Estate Needs AGI

Real estate is a $43 trillion market in the United States alone. Yet the industry runs on:
- Manual CMA (Comparative Market Analysis) — spreadsheets
- Fragmented MLS data — different systems per region
- Email and phone coordination — no unified pipeline
- Delayed market signals — days-on-market data is often 2 weeks stale

The result: billions in mispriced properties annually, thousands of failed transactions from coordination breakdowns, and massive information asymmetry between institutional investors and individual buyers.

### 1.2 The DOMEX Approach

DOMEX applies three mathematical layers:
1. **Hedonic pricing** — breaks property value into measurable attribute contributions
2. **Spatial intelligence** — detects which neighborhoods are price-clustering together
3. **Market temperature** — real-time demand/supply signal from days-on-market

And one operational layer:
4. **Transaction pipeline** — coordinates all parties through listing → offer → escrow → close

---

## 2. Theoretical Foundations

### 2.1 Hedonic Price Model

Lancaster (1966) proposed that consumers value goods by their characteristics, not the goods themselves. Applied to real estate, the hedonic model treats a property's price as the sum of its attribute values:

$$\ln P = \beta_0 + \sum_{i=1}^{n} \beta_i x_i + \varepsilon$$

The log-linear form is standard — it allows for percentage interpretations of coefficients:

| Attribute | Coefficient $\beta_i$ | Interpretation |
|-----------|----------------------|---------------|
| sqft | 0.00048 | +0.048% per sq ft |
| beds | 0.042 | +4.2% per bedroom |
| baths | 0.085 | +8.5% per bathroom |
| yearBuilt | 0.0015 | +1.5% per year newer (vs 1990) |
| schoolScore | 0.028 | +2.8% per school rating point |
| crimeIndex | −0.019 | −1.9% per crime index point |

DOMEX implements the full hedonic valuation as:

$$P = P_0 \cdot e^{\sum_i \beta_i x_i}$$

This gives the automated valuation model (AVM) baseline, which is then adjusted by comparable sales and market temperature.

### 2.2 φ-Weighted Comparable Selection

Given subject property $S$ and a pool of recent sales, DOMEX scores each comparable $C_j$ as:

$$\text{score}(S, C_j) = \frac{1}{1 + \phi^{-1} \cdot \frac{t_{now} - t_{sale_j}}{86400}} \cdot (1 - \delta_{sqft}) \cdot (1 - \delta_{beds}) \cdot \frac{1}{1 + d_{ij}}$$

where:
- The first factor gives φ-weighted temporal recency (recent sales count $\phi$ more)
- $\delta_{sqft}, \delta_{beds}$ = normalized difference in sqft and bedrooms
- $d_{ij}$ = distance from subject to comparable in km

Top 3 comps by score are used for the weighted average adjustment:

$$\text{comp adjustment} = \phi^{-1} \times \left(\frac{\sum_j \text{score}_j \cdot P_j}{\sum_j \text{score}_j} - P_{hedonic}\right)$$

### 2.3 Bid-Rent Gradient

Alonso (1964) showed that property prices decay with distance from the central business district (CBD) because commute costs increase:

$$R(d) = R_0 \cdot e^{-t \cdot d}$$

where:
- $R_0$ = rent/price at CBD
- $t$ = transport cost parameter (≈ 0.08 for typical US metro)
- $d$ = distance from CBD in km

This produces the classic "urban price gradient" — the price decay curve that explains why DFW properties near Downtown Dallas trade at 2–3× the price of properties 40 km out, holding all other attributes equal.

DOMEX uses bid-rent as a secondary valuation anchor when no comparables are available for a submarket.

### 2.4 Moran's I Spatial Autocorrelation

Moran (1950) introduced the spatial autocorrelation statistic to measure whether geographic values cluster:

$$I = \frac{N}{W} \cdot \frac{\sum_i \sum_j w_{ij}(x_i - \bar{x})(x_j - \bar{x})}{\sum_i (x_i - \bar{x})^2}$$

where:
- $N$ = number of spatial units (neighborhoods/zip codes)
- $w_{ij}$ = spatial weight (1 if neighbors, 0 otherwise)
- $W = \sum_i \sum_j w_{ij}$ = sum of all weights

Interpretation:
- $I \approx +1$ → strong positive spatial autocorrelation (expensive neighborhoods cluster)
- $I \approx 0$ → random spatial pattern
- $I \approx -1$ → checkerboard pattern (expensive next to cheap)

DOMEX uses Moran's I to detect:
1. **Price bubble formation** — rising I in a region signals neighborhood gentrification
2. **Investment clustering** — high I in commercial districts signals institutional activity
3. **Arbitrage opportunities** — low-I zones have undervalued pockets within expensive clusters

### 2.5 Days-on-Market Market Temperature

The DOM (Days on Market) signal is the most reliable real-time market indicator:

| DOM | Market Type | Price Bias | DOMEX Action |
|-----|-------------|-----------|--------------|
| < 21 days | HOT (seller's market) | +3% adj | Raise list price recommendation |
| 21–60 days | BALANCED | 0% adj | Hold at hedonic + comp value |
| > 60 days | COLD (buyer's market) | −4% adj | Reduce price to stimulate activity |

---

## 3. Multi-Party Transaction Pipeline

### 3.1 The 7-Stage Pipeline

Every real estate transaction traverses the same stages:

```
[1] LISTING    → property listed, DOMEX valuation assigned
[2] OFFER      → buyer submits offer, DOMEX scores vs. AVM
[3] NEGOTIATION→ counter-offers tracked, spread analysis
[4] ACCEPTANCE → binding agreement, parties locked in
[5] INSPECTION → inspection report artifact registered
[6] ESCROW     → title search, lender approval artifacts
[7] CLOSED     → transfer of title, learning signal to hedonic model
```

### 3.2 Artifact Handoffs in a Transaction

Using FORMEX as the routing backbone:

| Artifact | From | To |
|---------|------|-----|
| Listing sheet | Seller | Agent |
| CMA report | DOMEX | Agent + Buyer |
| Offer letter | Buyer | Seller (via Agent) |
| Inspection report | Inspector | Buyer |
| Appraisal report | Appraiser | Lender |
| Title commitment | Title Co | All parties |
| Closing disclosure | Lender | Buyer |

DOMEX tracks all 7+ artifacts through the pipeline and flags when any handoff is overdue.

---

## 4. Market Opportunity

### 4.1 US Real Estate Market Scale

| Segment | Market Size | DOMEX Target |
|---------|-------------|-------------|
| Residential transactions | 5.5M/yr | AVM + transaction coordination |
| Real estate agents | 1.5M licensed | Lead scoring + comparative tool |
| Buyers/sellers | 11M/yr | Valuation + pipeline transparency |
| Institutional investors | $1T/yr | Spatial clustering + bulk AVM |
| Property management | 118M rental units | Rent optimization |

### 4.2 Product Applications

1. **Consumer app:** "What's my home worth today?" — DOMEX AVM + market signal
2. **Agent tool:** Automated CMA with φ-weighted comps + presentation
3. **Investor dashboard:** Moran's I clustering map + bid-rent gradient visualization
4. **Transaction coordinator:** Full pipeline with artifact tracking + party alerts

---

## 5. Prior Art Claims

1. **φ-Weighted Temporal Comparable Scoring** — Application of golden ratio temporal recency weighting in comparable sales selection for automated valuation models

2. **AGI-Native Transaction Pipeline Coordination** — Multi-party real estate transaction pipeline (listing through close) implemented as RSHIP AGI goal-driven autonomous coordination

3. **Bid-Rent + Hedonic Dual-Anchor AVM** — Automated valuation model combining hedonic regression and bid-rent gradient as dual anchors within an AGI learning framework

4. **Days-on-Market Market Temperature Signal as AGI Goal Input** — DOM-based market temperature classification (HOT/BALANCED/COLD) integrated as a goal-progress signal in an AGI system

---

## References

1. Lancaster, K.J. (1966). *A New Approach to Consumer Theory.* Journal of Political Economy.
2. Rosen, S. (1974). *Hedonic Prices and Implicit Markets.* Journal of Political Economy.
3. Alonso, W. (1964). *Location and Land Use.* Harvard University Press.
4. Moran, P.A.P. (1950). *Notes on Continuous Stochastic Phenomena.* Biometrika.
5. Medina, A.H. (2026). *AURUM — Paper XXII.* RSHIP Theoretical Framework.

**© 2026 Alfredo Medina Hernandez / Medina Tech. All Rights Reserved.**
