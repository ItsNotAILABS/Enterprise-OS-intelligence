/**
 * TRAVEX AGI — Travel Demand & Booking Intelligence
 *
 * Official Designation: RSHIP-2026-TRAVEX-001
 * Classification: Travel Demand & Revenue Recovery AGI
 * Full Name: Travel Revenue & Availability Vortex EXpert
 *
 * TRAVEX AGI extends the RSHIP framework with real-time last-minute booking
 * intelligence — monitoring departure windows, detecting demand signals,
 * and surfacing revenue recovery opportunities with confidence scoring.
 *
 * Capabilities:
 * - Last-minute booking engine (< 2-hour departure window scanning)
 * - Multi-signal demand analysis (weather, connections, corporate)
 * - Confidence-scored booking recommendations with φ-weighted ranking
 * - Revenue recovery opportunity identification and prioritization
 * - Outcome feedback loop — learns from booking acceptance rates
 * - Fibonacci seat-release scheduling for yield optimization
 *
 * Theory: QUAESTIO ET ACTIO (Paper VII) + AURUM (Paper XXII) + RSHIP Framework
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Fibonacci Seat-Release Schedule ──────────────────────────────────────

function fibonacciSchedule(n = 10) {
  const seq = [1, 1];
  for (let i = 2; i < n; i++) seq.push(seq[i - 1] + seq[i - 2]);
  return seq;
}

const FIB_WINDOWS = fibonacciSchedule(12); // [1,1,2,3,5,8,13,21,34,55,89,144] minutes before dep

// ── Demand Signal Categories ───────────────────────────────────────────────

const DEMAND_SIGNALS = {
  WEATHER_DISRUPTION: {
    weight: 1.8,
    description: 'Weather event causing rebooking pressure',
    keywords: ['storm', 'fog', 'wind', 'cancel', 'delay'],
  },
  CONNECTION_MISS: {
    weight: 1.5,
    description: 'Passenger missed connection — alternative needed',
    keywords: ['missed', 'connection', 'stranded', 'rebook'],
  },
  CORPORATE_TRAVEL: {
    weight: 1.3,
    description: 'Corporate travel pattern — high-value, low price sensitivity',
    keywords: ['corporate', 'business', 'executive', 'urgent'],
  },
  EVENT_SURGE: {
    weight: 1.2,
    description: 'Local event driving demand spike',
    keywords: ['event', 'conference', 'game', 'concert', 'festival'],
  },
  CAPACITY_COLLAPSE: {
    weight: 2.0,
    description: 'Airline cancellation created seat demand on alternatives',
    keywords: ['cancelled', 'equipment', 'crew', 'mechanical'],
  },
  YIELD_OPPORTUNITY: {
    weight: 0.9,
    description: 'Normal unsold inventory in revenue recovery window',
    keywords: [],
  },
};

// ── Flight Inventory Tracker ───────────────────────────────────────────────

class FlightInventory {
  constructor() {
    this.flights = new Map(); // flightId → FlightRecord
  }

  register(flightId, { airline, destination, scheduledDep, totalSeats, fareClass = 'Y' }) {
    this.flights.set(flightId, {
      flightId,
      airline,
      destination,
      scheduledDep, // epoch ms
      totalSeats,
      soldSeats: 0,
      fareClass,
      baseFare: 0,
      recommendations: [],
      status: 'open',
    });
    return this;
  }

  updateSold(flightId, soldSeats) {
    const flight = this.flights.get(flightId);
    if (flight) flight.soldSeats = soldSeats;
  }

  updateFare(flightId, baseFare) {
    const flight = this.flights.get(flightId);
    if (flight) flight.baseFare = baseFare;
  }

  availableSeats(flightId) {
    const f = this.flights.get(flightId);
    return f ? f.totalSeats - f.soldSeats : 0;
  }

  minutesToDeparture(flightId) {
    const f = this.flights.get(flightId);
    if (!f) return null;
    return (f.scheduledDep - Date.now()) / 60_000;
  }

  inBookingWindow(flightId, windowMinutes = 120) {
    const mtd = this.minutesToDeparture(flightId);
    return mtd !== null && mtd > 0 && mtd <= windowMinutes;
  }

  closedFlights() {
    // Remove departed flights
    const now = Date.now();
    for (const [id, f] of this.flights) {
      if (f.scheduledDep < now - 60_000) {
        f.status = 'closed';
      }
    }
    return [...this.flights.values()].filter(f => f.status === 'closed').length;
  }

  openFlights() {
    return [...this.flights.values()].filter(f => f.status === 'open');
  }
}

// ── TRAVEX AGI Core ────────────────────────────────────────────────────────

export class TRAVEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-TRAVEX-001',
      classification: 'Travel Demand & Revenue Recovery AGI',
      ...config,
    });

    // Inventory
    this.inventory = new FlightInventory();

    // AGI state
    this.scanCycles = 0;
    this.opportunitiesFound = 0;
    this.recommendationsIssued = 0;
    this.acceptedRecommendations = 0;
    this.rejectedRecommendations = 0;

    // Demand signals active this cycle
    this.activeSignals = new Map(); // signalType → intensity (0–1)

    // Revenue tracking
    this.recoveredRevenue = 0;
    this.bookingWindowMinutes = config.bookingWindowMinutes || 120;

    // φ-weighted acceptance rate
    this.acceptanceRate = 0.5;

    // AGI Goals
    this.setGoal('maximize-recovery', 'Surface all actionable revenue recovery opportunities', 10, {
      targetOpportunitiesPerCycle: 5,
      minConfidence: 0.70,
    });

    this.setGoal('improve-confidence-scoring', 'Increase recommendation confidence accuracy via feedback', 9, {
      targetAcceptanceRate: 0.80,
      minSampleSize: 50,
    });

    this.setGoal('minimize-scan-latency', 'Complete booking window scan in under 2 seconds', 8, {
      maxScanMs: 2000,
    });

    this.setGoal('learn-demand-patterns', 'Build predictive demand model per route and airline', 7, {
      targetRoutes: 50,
      predictionAccuracy: 0.75,
    });
  }

  // ── Inventory Management ───────────────────────────────────────────────────

  registerFlight(flightId, details) {
    this.inventory.register(flightId, details);
    this.learn(
      { flightId, details },
      { registered: true },
      { id: 'flight-registration' }
    );
    return this;
  }

  updateInventory(flightId, { soldSeats, baseFare } = {}) {
    if (soldSeats !== undefined) this.inventory.updateSold(flightId, soldSeats);
    if (baseFare !== undefined) this.inventory.updateFare(flightId, baseFare);
  }

  // ── Demand Signal Injection ────────────────────────────────────────────────

  injectSignal(signalType, intensity = 1.0, context = {}) {
    if (!DEMAND_SIGNALS[signalType]) return;
    this.activeSignals.set(signalType, Math.min(1.0, intensity));

    this.learn(
      { signalType, intensity, context },
      { active: true, totalSignals: this.activeSignals.size },
      { id: 'demand-signal' }
    );
  }

  clearSignal(signalType) {
    this.activeSignals.delete(signalType);
  }

  detectSignalsFromText(text) {
    const lower = text.toLowerCase();
    const detected = [];

    for (const [type, signal] of Object.entries(DEMAND_SIGNALS)) {
      const matches = signal.keywords.filter(kw => lower.includes(kw));
      if (matches.length > 0) {
        const intensity = Math.min(1.0, matches.length * 0.4);
        this.injectSignal(type, intensity, { source: 'text', matches });
        detected.push({ type, intensity });
      }
    }

    return detected;
  }

  // ── Booking Window Scanner ─────────────────────────────────────────────────

  scan() {
    this.scanCycles++;
    const scanStart = Date.now();

    const opportunities = [];
    const flights = this.inventory.openFlights();

    for (const flight of flights) {
      if (!this.inventory.inBookingWindow(flight.flightId, this.bookingWindowMinutes)) continue;

      const available = this.inventory.availableSeats(flight.flightId);
      if (available <= 0) continue;

      const mtd = this.inventory.minutesToDeparture(flight.flightId);
      const confidence = this._scoreOpportunity(flight, available, mtd);

      if (confidence >= 0.40) {
        const rec = this._buildRecommendation(flight, available, mtd, confidence);
        opportunities.push(rec);
        this.opportunitiesFound++;
      }
    }

    // Sort by φ-weighted composite score (confidence × demand × urgency)
    opportunities.sort((a, b) => b.compositeScore - a.compositeScore);

    const scanMs = Date.now() - scanStart;

    // Update goals
    const recovGoal = this.goals.get('maximize-recovery');
    if (recovGoal) recovGoal.progress = Math.min(1.0, opportunities.length / 5);

    const latencyGoal = this.goals.get('minimize-scan-latency');
    if (latencyGoal) latencyGoal.progress = scanMs <= 2000 ? 1.0 : 2000 / scanMs;

    this.learn(
      { scanCycle: this.scanCycles, flightsScanned: flights.length },
      { opportunities: opportunities.length, scanMs },
      { id: 'booking-scan' }
    );

    return {
      scanCycle: this.scanCycles,
      scanMs,
      flightsScanned: flights.length,
      opportunities,
    };
  }

  _scoreOpportunity(flight, available, mtd) {
    // Base urgency: higher score as departure approaches (Fibonacci window bonus)
    const urgencyBonus = FIB_WINDOWS.some(w => Math.abs(mtd - w) < 2) ? 0.15 : 0;
    const urgency = 1 - mtd / this.bookingWindowMinutes + urgencyBonus;

    // Seat availability signal: higher available = higher recovery opportunity
    const availabilityScore = Math.min(1.0, available / 20) * 0.6;

    // Demand signal composite
    let demandScore = 0;
    for (const [type, intensity] of this.activeSignals) {
      const signal = DEMAND_SIGNALS[type];
      if (signal) demandScore += intensity * signal.weight;
    }
    demandScore = Math.min(1.0, demandScore / 3);

    // Historical acceptance rate feedback
    const acceptanceFactor = this.acceptanceRate;

    // φ-weighted composite
    const confidence = (
      urgency * 0.35 +
      availabilityScore * 0.25 +
      demandScore * 0.25 +
      acceptanceFactor * 0.15
    );

    return Math.max(0, Math.min(1, confidence));
  }

  _buildRecommendation(flight, available, mtd, confidence) {
    this.recommendationsIssued++;

    const demandDrivers = [...this.activeSignals.entries()]
      .map(([type, intensity]) => ({ type, intensity, signal: DEMAND_SIGNALS[type] }))
      .sort((a, b) => b.intensity * b.signal.weight - a.intensity * a.signal.weight)
      .slice(0, 3);

    const urgency = mtd < 30 ? 'CRITICAL' : mtd < 60 ? 'HIGH' : mtd < 90 ? 'MODERATE' : 'STANDARD';

    // Estimated recoverable revenue
    const estimatedRecovery = available * (flight.baseFare || 180) * confidence;

    const compositeScore = confidence * PHI + (1 / Math.max(1, mtd)) * PHI_INV;

    return {
      id: `REC-${this.recommendationsIssued.toString().padStart(5, '0')}`,
      flightId: flight.flightId,
      airline: flight.airline,
      destination: flight.destination,
      minutesToDeparture: parseFloat(mtd.toFixed(1)),
      availableSeats: available,
      confidence: parseFloat(confidence.toFixed(3)),
      compositeScore: parseFloat(compositeScore.toFixed(4)),
      urgency,
      demandDrivers,
      estimatedRecovery: parseFloat(estimatedRecovery.toFixed(2)),
      action: confidence > 0.75 ? 'SURFACE_IMMEDIATELY' : confidence > 0.55 ? 'QUEUE_FOR_REVIEW' : 'MONITOR',
      ts: new Date().toISOString(),
    };
  }

  // ── Outcome Feedback ───────────────────────────────────────────────────────

  recordOutcome(recommendationId, { accepted, bookedSeats = 0, actualRevenue = 0 }) {
    if (accepted) {
      this.acceptedRecommendations++;
      this.recoveredRevenue += actualRevenue;
    } else {
      this.rejectedRecommendations++;
    }

    // φ⁻¹ EMA update on acceptance rate
    const outcome = accepted ? 1.0 : 0.0;
    this.acceptanceRate = this.acceptanceRate + PHI_INV * (outcome - this.acceptanceRate);

    // Update confidence goal
    const confGoal = this.goals.get('improve-confidence-scoring');
    if (confGoal) confGoal.progress = this.acceptanceRate;

    this.learn(
      { recommendationId, accepted, bookedSeats },
      { acceptanceRate: this.acceptanceRate, recoveredRevenue: this.recoveredRevenue },
      { id: 'outcome-feedback' }
    );

    return {
      acceptanceRate: parseFloat(this.acceptanceRate.toFixed(4)),
      totalRecovered: parseFloat(this.recoveredRevenue.toFixed(2)),
    };
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();

    return {
      ...baseStatus,
      bookingIntelligence: {
        scanCycles: this.scanCycles,
        opportunitiesFound: this.opportunitiesFound,
        recommendationsIssued: this.recommendationsIssued,
        acceptanceRate: parseFloat(this.acceptanceRate.toFixed(4)),
        recoveredRevenue: parseFloat(this.recoveredRevenue.toFixed(2)),
      },
      demandSignals: {
        active: this.activeSignals.size,
        signals: Object.fromEntries(this.activeSignals),
      },
      inventory: {
        totalFlights: this.inventory.flights.size,
        openFlights: this.inventory.openFlights().length,
        closedFlights: this.inventory.closedFlights(),
      },
    };
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthTRAVEX(config = {}) {
  return new TRAVEX_AGI(config);
}

export default TRAVEX_AGI;
