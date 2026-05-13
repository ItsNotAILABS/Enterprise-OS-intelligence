/**
 * DOMEX AGI — Real Estate & Property Market Intelligence
 *
 * Official Designation: RSHIP-2026-DOMEX-001
 * Classification: Real Estate Economics & Property Market AGI
 * Full Name: Dominium Operations & Market Economy EXpert
 *
 * DOMEX AGI extends the RSHIP framework with full real-estate intelligence —
 * hedonic pricing, spatial autocorrelation, bid-rent gradient analysis,
 * multi-party transaction coordination, and property market demand forecasting.
 *
 * Capabilities:
 * - Hedonic price model: decompose property value into attribute components
 * - Moran's I spatial autocorrelation: detect spatial clustering of prices
 * - Bid-rent gradient: distance-from-CBD price decay curve
 * - Multi-party coordination: buyers, sellers, agents, lenders, inspectors
 * - Demand-supply imbalance detection (days-on-market signal)
 * - φ-weighted comparable selection for AVM (automated valuation model)
 * - Transaction pipeline: listing → offer → escrow → close
 *
 * Theory: QUAESTIO ET ACTIO (Paper VII) + AURUM (Paper XXII) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Hedonic Price Model ────────────────────────────────────────────────────
// P = exp(β₀ + Σ βᵢ xᵢ + ε)
// Property value is the product of exponential attribute contributions
// Coefficients βᵢ learned from sales comparables

const DEFAULT_HEDONIC_COEFS = {
  sqft:        0.00048,  // per sq ft (log-linear)
  beds:        0.042,    // per bedroom
  baths:       0.085,    // per bathroom
  garages:     0.038,    // per garage stall
  lotSqft:     0.000012, // per sq ft of lot
  yearBuilt:   0.0015,   // per year (recency premium)
  poolBonus:   0.065,    // pool presence dummy
  schoolScore: 0.028,    // per school rating point (1–10)
  crimeIndex:  -0.019,   // per crime-index point (inverse)
};

function hedonicValuation(property, coefs = DEFAULT_HEDONIC_COEFS) {
  const {
    sqft = 1800, beds = 3, baths = 2, garages = 1, lotSqft = 6000,
    yearBuilt = 2000, hasPool = false, schoolScore = 7, crimeIndex = 30,
    basePrice = 200000,
  } = property;

  const logAdj =
    coefs.sqft        * sqft +
    coefs.beds         * beds +
    coefs.baths        * baths +
    coefs.garages      * garages +
    coefs.lotSqft      * lotSqft +
    coefs.yearBuilt    * (yearBuilt - 1990) +
    coefs.poolBonus    * (hasPool ? 1 : 0) +
    coefs.schoolScore  * schoolScore +
    coefs.crimeIndex   * crimeIndex;

  return Math.round(basePrice * Math.exp(logAdj));
}

// ── Bid-Rent Gradient ──────────────────────────────────────────────────────
// Rent/price decays with distance from CBD (Central Business District)
// R(d) = R₀ × e^(-t × d)
// t = transport cost parameter; d = km from CBD

function bidRentGradient({ distKmFromCBD, cbdRent = 500000, transportCost = 0.08 }) {
  return Math.round(cbdRent * Math.exp(-transportCost * distKmFromCBD));
}

// ── Moran's I Spatial Autocorrelation ─────────────────────────────────────
// I = (N / W) × (Σᵢ Σⱼ wᵢⱼ (xᵢ − x̄)(xⱼ − x̄)) / Σᵢ (xᵢ − x̄)²
// I ≈ 1: strong positive cluster (expensive areas cluster together)
// I ≈ −1: checkerboard dispersion
// I ≈ 0: random

function moransI(prices, weightMatrix) {
  const n    = prices.length;
  const mean = prices.reduce((s, p) => s + p, 0) / n;
  const deviations = prices.map(p => p - mean);

  let numerator   = 0;
  let denominator = 0;
  let W           = 0;

  for (let i = 0; i < n; i++) {
    denominator += deviations[i] ** 2;
    for (let j = 0; j < n; j++) {
      const w = weightMatrix[i]?.[j] ?? 0;
      W += w;
      numerator += w * deviations[i] * deviations[j];
    }
  }

  if (W === 0 || denominator === 0) return 0;
  return (n / W) * (numerator / denominator);
}

// ── Days-on-Market Demand Signal ──────────────────────────────────────────
// DOM < 21 days   → HOT market (seller's market)
// DOM 21–60 days  → BALANCED market
// DOM > 60 days   → COLD market (buyer's market)

function marketSignal(avgDaysOnMarket) {
  if (avgDaysOnMarket < 21)  return { signal: 'HOT',      bias: 'seller', priceAdjustment:  0.03 };
  if (avgDaysOnMarket <= 60) return { signal: 'BALANCED', bias: 'neutral', priceAdjustment: 0 };
  return                            { signal: 'COLD',     bias: 'buyer',  priceAdjustment: -0.04 };
}

// ── Comparable Sales Selection ─────────────────────────────────────────────
// φ-weighted similarity score: properties closer in time get φ boost

function comparableScore(subject, comp) {
  const ageDaysWeight = 1 / (1 + (Date.now() - comp.saleDate) / 86_400_000 * PHI_INV);
  const sqftDiff    = Math.abs(subject.sqft    - comp.sqft)    / (subject.sqft    + 1);
  const bedsDiff    = Math.abs(subject.beds    - comp.beds)    / (subject.beds    + 1);
  const bathsDiff   = Math.abs(subject.baths   - comp.baths)   / (subject.baths   + 1);
  const distScore   = 1 / (1 + comp.distFromSubjectKm);
  const similarity  = (1 - sqftDiff) * (1 - bedsDiff) * (1 - bathsDiff) * distScore;
  return similarity * ageDaysWeight;
}

// ── DOMEX AGI ─────────────────────────────────────────────────────────────

class DOMEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-DOMEX-001',
      classification: 'Real Estate Economics & Property Market AGI',
      ...config,
    });

    // Registry
    this.properties   = new Map(); // propId → property record
    this.transactions = new Map(); // txId   → transaction pipeline
    this.parties      = new Map(); // partyId → { id, role, activeTxs }
    this.markets      = new Map(); // zipCode → { listings, sold, avgDOM }

    // Coefficients (learnable)
    this.hedonicCoefs = { ...DEFAULT_HEDONIC_COEFS, ...(config.hedonicCoefs ?? {}) };

    // Metrics
    this.valuationsRun    = 0;
    this.transactionsClosed = 0;

    // AGI Goals
    this.setGoal('valuation-accuracy',     'AVM error < 5% vs sale price',         10, { metric: 'avmError' });
    this.setGoal('transaction-velocity',   'Median close time < 45 days',           9, { metric: 'medianCloseDays' });
    this.setGoal('market-intelligence',    'Update market signal every cycle',       8, { metric: 'signalFreshness' });
    this.setGoal('party-coordination',     'Zero coordination gaps in pipeline',    10, { metric: 'gapCount' });
  }

  // ── Property Registration ────────────────────────────────────────────────

  listProperty(prop) {
    const id = prop.id ?? `PROP-${Date.now()}`;
    const record = {
      ...prop,
      id,
      listDate: Date.now(),
      status: 'active',
      hedonicValue: hedonicValuation(prop, this.hedonicCoefs),
      bidRentValue: bidRentGradient({ distKmFromCBD: prop.distKmFromCBD ?? 20 }),
    };
    this.properties.set(id, record);

    // Update market stats for zip
    const zip = prop.zipCode ?? 'UNKNOWN';
    if (!this.markets.has(zip)) this.markets.set(zip, { listings: 0, sold: 0, salePrices: [], domSum: 0, domCount: 0 });
    this.markets.get(zip).listings++;

    this.learn({ event: 'property-listed', id }, { hedonicValue: record.hedonicValue }, { id });
    return record;
  }

  // ── Automated Valuation ──────────────────────────────────────────────────

  valuate(propId, comparables = []) {
    const prop = this.properties.get(propId);
    if (!prop) return null;

    this.valuationsRun++;

    // Hedonic base
    const hedonicValue = hedonicValuation(prop, this.hedonicCoefs);

    // Comparable adjustment (if comps provided)
    let compAdj = 0;
    if (comparables.length > 0) {
      const scored = comparables.map(c => ({ ...c, score: comparableScore(prop, c) }));
      const topComps = scored.sort((a, b) => b.score - a.score).slice(0, 3);
      const totalScore = topComps.reduce((s, c) => s + c.score, 0);
      if (totalScore > 0) {
        const weightedSalePrice = topComps.reduce((s, c) => s + c.salePrice * c.score, 0) / totalScore;
        compAdj = (weightedSalePrice - hedonicValue) * PHI_INV; // blend toward comps
      }
    }

    // Market signal adjustment
    const zip    = prop.zipCode ?? 'UNKNOWN';
    const market = this.markets.get(zip);
    const avgDOM = market?.domCount > 0 ? market.domSum / market.domCount : 45;
    const signal = marketSignal(avgDOM);
    const mktAdj = hedonicValue * signal.priceAdjustment;

    const finalValue = Math.round(hedonicValue + compAdj + mktAdj);

    const result = {
      propId,
      hedonicValue,
      compAdjustment: Math.round(compAdj),
      marketAdjustment: Math.round(mktAdj),
      finalValue,
      marketSignal: signal,
      confidence: comparables.length >= 3 ? 0.87 : 0.72,
    };

    this.learn({ event: 'valuation', propId }, result, { id: `val-${propId}` });
    return result;
  }

  // ── Transaction Pipeline ─────────────────────────────────────────────────

  registerParty({ id, role, name }) {
    this.parties.set(id, { id, role, name, activeTxs: new Set() });
    return id;
  }

  openTransaction({ id, propId, buyerId, sellerId, agentId, offerPrice }) {
    const tx = {
      id: id ?? `TX-${Date.now()}`,
      propId, buyerId, sellerId, agentId, offerPrice,
      status: 'offer',
      timeline: [{ stage: 'offer', ts: Date.now(), notes: `Offer: $${offerPrice.toLocaleString()}` }],
      openedAt: Date.now(),
    };
    this.transactions.set(tx.id, tx);
    [buyerId, sellerId, agentId].filter(Boolean).forEach(pid => {
      this.parties.get(pid)?.activeTxs.add(tx.id);
    });
    this.learn({ event: 'tx-opened', txId: tx.id, propId }, { offerPrice }, { id: tx.id });
    return tx.id;
  }

  advanceTransaction(txId, newStage, notes = '') {
    const tx = this.transactions.get(txId);
    if (!tx) return null;
    tx.status = newStage;
    tx.timeline.push({ stage: newStage, ts: Date.now(), notes });
    if (newStage === 'closed') {
      tx.closedAt = Date.now();
      this.transactionsClosed++;
      const prop = this.properties.get(tx.propId);
      if (prop) {
        const dom = (tx.closedAt - prop.listDate) / 86_400_000;
        const zip = prop.zipCode ?? 'UNKNOWN';
        const mkt = this.markets.get(zip);
        if (mkt) { mkt.sold++; mkt.salePrices.push(tx.offerPrice); mkt.domSum += dom; mkt.domCount++; }
        prop.status = 'sold';
      }
    }
    return tx;
  }

  // ── Market Intelligence ──────────────────────────────────────────────────

  getMarketReport(zipCode) {
    const market = this.markets.get(zipCode);
    if (!market || market.domCount === 0) return { zipCode, status: 'insufficient-data' };

    const avgDOM     = market.domSum / market.domCount;
    const signal     = marketSignal(avgDOM);
    const avgPrice   = market.salePrices.length
      ? market.salePrices.reduce((s, p) => s + p, 0) / market.salePrices.length
      : null;
    const listToSale = market.listings > 0 ? (market.sold / market.listings) * 100 : 0;

    return {
      zipCode, avgDOM: Math.round(avgDOM), signal: signal.signal,
      bias: signal.bias, avgSalePrice: avgPrice ? Math.round(avgPrice) : null,
      activeListings: market.listings - market.sold,
      listToSaleRatio: parseFloat(listToSale.toFixed(1)),
    };
  }

  spatialClusteringScore(zipCodes, priceMap) {
    // Simple Moran's I over provided prices
    const prices   = zipCodes.map(z => priceMap[z] ?? 0);
    const n        = prices.length;
    const weights  = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (__, j) => (i !== j && Math.abs(i - j) <= 2 ? 1 : 0))
    );
    return moransI(prices, weights);
  }

  getAGIStatus() {
    const baseStatus = this.getStatus();
    return {
      ...baseStatus,
      realEstate: {
        propertiesListed:  this.properties.size,
        transactionsOpen:  [...this.transactions.values()].filter(t => t.status !== 'closed').length,
        transactionsClosed: this.transactionsClosed,
        partiesRegistered:  this.parties.size,
        marketsTracked:     this.markets.size,
        valuationsRun:      this.valuationsRun,
      },
    };
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthDOMEX(config = {}) {
  return new DOMEX_AGI(config);
}

export default DOMEX_AGI;
