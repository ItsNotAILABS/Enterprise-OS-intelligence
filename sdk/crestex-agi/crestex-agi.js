/**
 * CRESTEX AGI — Creator Economy & Expression Intelligence
 *
 * Official Designation: RSHIP-2026-CRESTEX-001
 * Classification: Creator Economy & Content Intelligence AGI
 * Full Name: Creative Resource & Expression Studio Technology EXpert
 *
 * CRESTEX AGI extends the RSHIP framework with creator economy intelligence —
 * Bass diffusion modeling for content virality, aesthetic diversity scoring,
 * revenue stream optimization for creators, audience resonance detection,
 * and multi-platform content lifecycle management.
 *
 * Capabilities:
 * - Bass diffusion model: viral growth vs. word-of-mouth adoption forecasting
 * - Aesthetic entropy: measures creative diversity of a creator's portfolio
 * - Content resonance scoring: engagement rate × reach × retention index
 * - Revenue stream optimizer: ad, subscription, merchandise, licensing allocation
 * - Creator collaboration network: φ-weighted audience overlap scoring
 * - Content lifecycle: draft → publish → viral window → archive
 * - Audience cohort analysis: fans, casual viewers, one-time visitors
 *
 * Theory: QUAESTIO ET ACTIO (Paper VII) + AURUM (Paper XXII) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Bass Diffusion Model ───────────────────────────────────────────────────
// Bass (1969): models adoption of a new product/content over time
// dN/dt = (p + q × N/M) × (M − N)
// p = coefficient of innovation (external influence)
// q = coefficient of imitation (word of mouth)
// M = total market (potential audience)
// N(t) = adoptions by time t

function bassDiffusion({ p = 0.03, q = 0.38, M = 100000, t = 7 }) {
  // Closed-form Bass solution for cumulative adoptions N(t)
  const A = (q - p) / p;  // A = (q/p) − 1
  const b = (p + q);
  const numerator   = 1 - Math.exp(-b * t);
  const denominator = 1 + (q / p) * Math.exp(-b * t);
  const Nt = M * (numerator / denominator);

  // Peak adoption time t* = (1/b) × ln(q/p)
  const tPeak = (1 / b) * Math.log(q / p);

  return {
    cumulativeAdoptions: Math.round(Nt),
    peakDayEstimate: parseFloat(tPeak.toFixed(1)),
    adoptionRate: parseFloat((Nt / M * 100).toFixed(2)),
  };
}

// ── Viral Coefficient (K) ──────────────────────────────────────────────────
// K = shares_per_viewer × conversion_rate
// K > 1 → super-viral (exponential growth)
// K < 1 → sub-viral (needs external push)

function viralCoefficient({ sharesPerViewer, conversionRate }) {
  const K = sharesPerViewer * conversionRate;
  const status = K >= 1.5 ? 'SUPER_VIRAL' : K >= 1.0 ? 'VIRAL' : K >= 0.5 ? 'GROWING' : 'FLAT';
  return { K: parseFloat(K.toFixed(3)), status };
}

// ── Aesthetic Entropy ──────────────────────────────────────────────────────
// Measures creative diversity of a portfolio
// H = -Σ p(s) × log₂(p(s))   where s = style/format categories
// High H → diverse creative range (risky but broad appeal)
// Low H  → focused niche (easier to monetize deeply)

function aestheticEntropy(contentCategoryCounts) {
  const total = Object.values(contentCategoryCounts).reduce((s, c) => s + c, 0);
  if (total === 0) return 0;
  return -Object.values(contentCategoryCounts).reduce((H, count) => {
    const p = count / total;
    return H + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
}

// ── Engagement Resonance Score ─────────────────────────────────────────────
// RS = (likes + comments × 3 + shares × 5 + saves × 4) / views × φ
// Comments and shares weighted higher — they indicate deeper engagement

function resonanceScore({ views, likes, comments, shares, saves }) {
  if (!views) return 0;
  const weighted = likes + comments * 3 + shares * 5 + saves * 4;
  return parseFloat(((weighted / views) * PHI * 100).toFixed(2));
}

// ── Revenue Stream Optimizer ───────────────────────────────────────────────
// Allocates creator effort across revenue streams to maximize expected total
// Using Kelly-style fractions: allocate proportional to (yield × probability)

const REVENUE_STREAMS = {
  advertising:    { label: 'Ad Revenue',       yield: 0.003, prob: 0.95 }, // per view
  subscription:   { label: 'Subscriptions',    yield: 9.99,  prob: 0.04 }, // per view → subscriber convert
  merchandise:    { label: 'Merchandise',      yield: 28.00, prob: 0.006 },
  courseContent:  { label: 'Paid Content',     yield: 49.00, prob: 0.008 },
  brandDeal:      { label: 'Brand Partnership',yield: 5000,  prob: 0.0001 }, // per video
  licensing:      { label: 'Licensing',        yield: 200,   prob: 0.0003 },
};

function revenueOptimizer(monthlyViews, activeStreams = Object.keys(REVENUE_STREAMS)) {
  const results = {};
  let totalExpected = 0;
  for (const stream of activeStreams) {
    const s = REVENUE_STREAMS[stream];
    if (!s) continue;
    const expected = monthlyViews * s.yield * s.prob;
    results[stream] = { expected: parseFloat(expected.toFixed(2)), yield: s.yield, prob: s.prob };
    totalExpected += expected;
  }
  // φ-weight allocation recommendation
  for (const stream of activeStreams) {
    if (results[stream]) {
      results[stream].allocationPct = parseFloat((results[stream].expected / (totalExpected + 1e-9) * 100).toFixed(1));
    }
  }
  return { streams: results, totalExpected: parseFloat(totalExpected.toFixed(2)) };
}

// ── CRESTEX AGI ────────────────────────────────────────────────────────────

class CRESTEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-CRESTEX-001',
      classification: 'Creator Economy & Content Intelligence AGI',
      ...config,
    });

    this.creators    = new Map(); // creatorId → CreatorRecord
    this.content     = new Map(); // contentId → ContentRecord
    this.platforms   = new Map(); // platformId → { name, factor }
    this.collabs     = [];        // collaboration records

    // Metrics
    this.contentPublished = 0;
    this.viralAlerts      = 0;
    this.revenueProjected = 0;

    // AGI Goals
    this.setGoal('viral-detection',    'Surface viral content within 24 hours of publish',  10, { metric: 'viralDetected' });
    this.setGoal('revenue-maximize',   'Optimize revenue stream allocation per creator',     9,  { metric: 'revenuePerView' });
    this.setGoal('creative-diversity', 'Maintain aesthetic entropy > 1.5 per creator',       7,  { metric: 'avgEntropy' });
    this.setGoal('audience-growth',    'K > 1.0 on all featured content',                    9,  { metric: 'avgViralCoeff' });
    this.setGoal('collab-network',     'Map all φ-compatible collaborations',                 6,  { metric: 'collabScore' });
  }

  // ── Creator Onboarding ───────────────────────────────────────────────────

  registerCreator({ id, name, niche, platforms = [], monthlyViews = 0 }) {
    this.creators.set(id, {
      id, name, niche, platforms: new Set(platforms),
      monthlyViews,
      contentIds: [],
      categoryCounts: {},
      totalResonance: 0,
      joinedAt: Date.now(),
    });
    this.learn({ event: 'creator-registered', id, niche }, { monthlyViews }, { id });
    return id;
  }

  // ── Content Lifecycle ────────────────────────────────────────────────────

  publishContent({ id, creatorId, title, category, format, stats = {} }) {
    const creator = this.creators.get(creatorId);
    if (!creator) return null;

    const viral  = viralCoefficient({
      sharesPerViewer:  stats.sharesPerViewer  ?? 0.04,
      conversionRate:   stats.conversionRate   ?? 0.15,
    });

    const rs = resonanceScore({
      views:    stats.views    ?? 0,
      likes:    stats.likes    ?? 0,
      comments: stats.comments ?? 0,
      shares:   stats.shares   ?? 0,
      saves:    stats.saves    ?? 0,
    });

    // Diffusion forecast (7-day)
    const diff = bassDiffusion({
      p: 0.03, q: viral.K > 1 ? 0.5 : 0.2,
      M: creator.monthlyViews * 1.5,
      t: 7,
    });

    const record = {
      id, creatorId, title, category, format,
      stats, viral, resonanceScore: rs, diffusion: diff,
      status: 'published',
      publishedAt: Date.now(),
    };

    this.content.set(id, record);
    creator.contentIds.push(id);
    creator.categoryCounts[category] = (creator.categoryCounts[category] ?? 0) + 1;
    creator.totalResonance += rs;
    this.contentPublished++;

    if (viral.status === 'VIRAL' || viral.status === 'SUPER_VIRAL') {
      this.viralAlerts++;
    }

    this.learn(
      { event: 'content-published', id, creatorId },
      { viral: viral.status, resonanceScore: rs },
      { id }
    );

    return record;
  }

  // ── Creator Dashboard ────────────────────────────────────────────────────

  getCreatorReport(creatorId) {
    const creator = this.creators.get(creatorId);
    if (!creator) return null;

    const entropy   = aestheticEntropy(creator.categoryCounts);
    const revenue   = revenueOptimizer(creator.monthlyViews);
    const contentList = creator.contentIds.map(cid => this.content.get(cid)).filter(Boolean);
    const avgRS     = contentList.length
      ? (creator.totalResonance / contentList.length).toFixed(2)
      : '0';

    const viralContent = contentList
      .filter(c => c.viral.status === 'VIRAL' || c.viral.status === 'SUPER_VIRAL')
      .map(c => ({ id: c.id, title: c.title, viralCoeff: c.viral.K }));

    return {
      creatorId,
      name:          creator.name,
      niche:         creator.niche,
      contentCount:  contentList.length,
      avgResonance:  avgRS,
      aestheticEntropy: parseFloat(entropy.toFixed(3)),
      entropyStatus: entropy >= 1.5 ? 'DIVERSE' : entropy >= 0.8 ? 'MODERATE' : 'NARROW',
      viralContent,
      revenue,
    };
  }

  // ── Collaboration Matching ───────────────────────────────────────────────

  findCollaborations(creatorId, topN = 5) {
    const target = this.creators.get(creatorId);
    if (!target) return [];

    const scores = [];
    for (const [cid, creator] of this.creators) {
      if (cid === creatorId) continue;
      // Audience overlap score: φ-weighted by shared niches + platform overlap
      const niches  = [target.niche, creator.niche];
      const nicheOverlap = niches[0] === niches[1] ? PHI : 1.0;
      const platformOverlap = [...creator.platforms].filter(p => target.platforms.has(p)).length;
      const viewRatio = Math.min(target.monthlyViews, creator.monthlyViews) /
                        (Math.max(target.monthlyViews, creator.monthlyViews) + 1);
      const score = nicheOverlap * (1 + platformOverlap * 0.3) * (0.5 + viewRatio * PHI);
      scores.push({ creatorId: cid, name: creator.name, niche: creator.niche, score: parseFloat(score.toFixed(3)) });
    }

    return scores.sort((a, b) => b.score - a.score).slice(0, topN);
  }

  // ── Status ───────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();
    const avgEntropy = this.creators.size > 0
      ? [...this.creators.values()].reduce((s, c) => s + aestheticEntropy(c.categoryCounts), 0) / this.creators.size
      : 0;
    return {
      ...baseStatus,
      creatorEconomy: {
        creators:         this.creators.size,
        contentPublished: this.contentPublished,
        viralAlerts:      this.viralAlerts,
        avgAestheticEntropy: parseFloat(avgEntropy.toFixed(3)),
      },
    };
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthCRESTEX(config = {}) {
  return new CRESTEX_AGI(config);
}

export default CRESTEX_AGI;
