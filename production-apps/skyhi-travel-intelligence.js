/**
 * Skyhi Travel Intelligence Organism
 *
 * Official Designation: RSHIP-PROD-SKYHI-001
 * Classification: Enterprise Aviation Intelligence Platform
 *
 * The full-spectrum travel intelligence platform for the aviation ecosystem —
 * airports, airlines, booking platforms, pilots, flight attendants, and
 * ground crew. Multiple companies connect via the multi-tenant API gateway.
 *
 * Intelligence Organs:
 * - AEROLEX (RSHIP-2026-AEROLEX-001) — Airport Operations & API Bridge
 * - TRAVEX  (RSHIP-2026-TRAVEX-001)  — Travel Demand & Last-Minute Booking
 * - PASSEX  (RSHIP-2026-PASSEX-001)  — Passenger Matching & VIP Routing
 * - CREWEX  (RSHIP-2026-CREWEX-001)  — Crew Scheduling & Fatigue Intelligence
 * - VISITEX (RSHIP-2026-VISITEX-001) — Visitor & Booking Platform Gateway
 *
 * Tenant Ecosystem:
 *   AIRLINES:          American Airlines, Delta, United, Southwest, JetBlue, Alaska
 *   AIRPORTS:          DFW International
 *   BOOKING PLATFORMS: Expedia, Booking.com, Google Flights, Kayak, Travelport
 *   CORPORATE TMC:     American Express GBT, BCD Travel
 *
 * Run: node production-apps/skyhi-travel-intelligence.js
 *
 * © 2026 RSHIP AGI Systems — Skyhi Group Enterprise License
 */

import { birthAEROLEX } from '../sdk/aerolex-agi/aerolex-agi.js';
import { birthTRAVEX }  from '../sdk/travex-agi/travex-agi.js';
import { birthPASSEX }  from '../sdk/passex-agi/passex-agi.js';
import { birthCREWEX }  from '../sdk/crewex-agi/crewex-agi.js';
import { birthVISITEX } from '../sdk/visitex-agi/visitex-agi.js';

// ── Constants ──────────────────────────────────────────────────────────────

const PHI     = 1.618033988749895;
const PHI_INV = 1.0 / PHI;

const DFW_AIRLINES = ['AA', 'DL', 'UA', 'SW', 'B6', 'AS', 'NK', 'F9'];

// ── Configure DFW Gates ────────────────────────────────────────────────────

function buildDFWGates(aerolex) {
  const terminals = {
    A: { start: 1, end: 8, serviceRate: 28 },
    B: { start: 1, end: 8, serviceRate: 26 },
    C: { start: 1, end: 8, serviceRate: 30 },
    D: { start: 1, end: 8, serviceRate: 30 },
    E: { start: 1, end: 8, serviceRate: 25 },
  };
  for (const [terminal, config] of Object.entries(terminals)) {
    for (let i = config.start; i <= config.end; i++) {
      aerolex.registerGate(`${terminal}${i}`, { serviceRate: config.serviceRate, terminal });
    }
  }
}

// ── Configure Passenger Connection Graph ──────────────────────────────────

function buildConnectionGraph(passex) {
  const gates = ['A','B','C','D','E'].flatMap(t =>
    Array.from({ length: 8 }, (_, i) => `${t}${i+1}`)
  );
  passex.buildConnectionGraph(gates, [
    ...['A','B','C','D','E'].flatMap(t =>
      Array.from({ length: 7 }, (_, i) => [`${t}${i+1}`, `${t}${i+2}`])
    ),
    ['A1','B1'], ['B1','C1'], ['C1','D1'], ['D1','E1'],
  ]);
}

// ── Configure VISITEX Routes ───────────────────────────────────────────────

function buildRoutes(visitex) {
  const routes = [
    ['DFW-LAX', { airline: 'AA', distKm: 1982, capacity: 150 }],
    ['DFW-ORD', { airline: 'AA', distKm: 1443, capacity: 160 }],
    ['DFW-JFK', { airline: 'DL', distKm: 2475, capacity: 150 }],
    ['DFW-SFO', { airline: 'UA', distKm: 2858, capacity: 160 }],
    ['DFW-MDW', { airline: 'SW', distKm: 1443, capacity: 143 }],
    ['DFW-BOS', { airline: 'B6', distKm: 2699, capacity: 150 }],
    ['DFW-MIA', { airline: 'AA', distKm: 1865, capacity: 160 }],
    ['DFW-SEA', { airline: 'AS', distKm: 2833, capacity: 160 }],
  ];
  for (const [key, details] of routes) visitex.registerRoute(key, details);
}

// ── Register Multi-Tenant Ecosystem ───────────────────────────────────────

function buildTenants(visitex) {
  // Airlines
  const airlines = [
    { id: 'TENANT-AA', name: 'American Airlines', type: 'AIRLINE', tier: 'enterprise',
      routes: ['DFW-LAX','DFW-ORD','DFW-MIA'] },
    { id: 'TENANT-DL', name: 'Delta Air Lines',   type: 'AIRLINE', tier: 'enterprise',
      routes: ['DFW-JFK'] },
    { id: 'TENANT-UA', name: 'United Airlines',   type: 'AIRLINE', tier: 'enterprise',
      routes: ['DFW-SFO'] },
    { id: 'TENANT-SW', name: 'Southwest Airlines',type: 'AIRLINE', tier: 'premium',
      routes: ['DFW-MDW'] },
    { id: 'TENANT-B6', name: 'JetBlue Airways',   type: 'AIRLINE', tier: 'premium',
      routes: ['DFW-BOS'] },
    { id: 'TENANT-AS', name: 'Alaska Airlines',   type: 'AIRLINE', tier: 'premium',
      routes: ['DFW-SEA'] },
  ];

  // Airport
  const airports = [
    { id: 'TENANT-DFW', name: 'DFW International Airport', type: 'AIRPORT', tier: 'enterprise',
      routes: [] }, // receives all events
  ];

  // Booking Platforms
  const platforms = [
    { id: 'TENANT-EXPEDIA',    name: 'Expedia',           type: 'OTA',       tier: 'enterprise', routes: [] },
    { id: 'TENANT-BOOKING',    name: 'Booking.com',       type: 'OTA',       tier: 'enterprise', routes: [] },
    { id: 'TENANT-GOOGLE',     name: 'Google Flights',    type: 'OTA',       tier: 'enterprise', routes: [] },
    { id: 'TENANT-KAYAK',      name: 'Kayak',             type: 'METASEARCH',tier: 'premium',    routes: [] },
    { id: 'TENANT-TRAVELPORT', name: 'Travelport GDS',    type: 'GDS',       tier: 'enterprise', routes: [] },
    { id: 'TENANT-AMEXGBT',    name: 'Amex GBT',          type: 'CORPORATE', tier: 'enterprise', routes: [] },
    { id: 'TENANT-BCD',        name: 'BCD Travel',        type: 'CORPORATE', tier: 'premium',    routes: [] },
  ];

  for (const t of [...airlines, ...airports, ...platforms]) {
    visitex.registerTenant(t.id, t);
  }
}

// ── Seed Aviation Crew ─────────────────────────────────────────────────────

function seedCrew(crewex) {
  const now = Date.now();
  const sixMonths = new Date(now + 180 * 86_400_000).toISOString().slice(0,10);

  // Pilots
  crewex.registerCrew('PILOT-AA-001', {
    role: 'pilot', airline: 'AA', base: 'DFW',
    typeRatings: ['B737', 'B757', 'A320'],
    medCertExpiry: sixMonths, seniority: 12,
    recencyFlights: [{ type: 'B737', ts: now - 5 * 86_400_000 }],
  });
  crewex.registerCrew('PILOT-AA-002', {
    role: 'pilot', airline: 'AA', base: 'DFW',
    typeRatings: ['B737', 'A320'],
    medCertExpiry: sixMonths, seniority: 5,
    recencyFlights: [{ type: 'B737', ts: now - 2 * 86_400_000 }],
  });
  crewex.registerCrew('PILOT-DL-001', {
    role: 'pilot', airline: 'DL', base: 'DFW',
    typeRatings: ['B757', 'A330'],
    medCertExpiry: sixMonths, seniority: 9,
    recencyFlights: [{ type: 'B757', ts: now - 10 * 86_400_000 }],
  });
  crewex.registerCrew('PILOT-UA-001', {
    role: 'pilot', airline: 'UA', base: 'DFW',
    typeRatings: ['B737', 'B787'],
    medCertExpiry: sixMonths, seniority: 7,
    recencyFlights: [{ type: 'B737', ts: now - 3 * 86_400_000 }],
  });

  // Flight Attendants
  const fas = ['FA-AA-001','FA-AA-002','FA-DL-001','FA-UA-001','FA-SW-001','FA-B6-001'];
  const faAirlines = ['AA','AA','DL','UA','SW','B6'];
  for (let i = 0; i < fas.length; i++) {
    crewex.registerCrew(fas[i], {
      role: 'fa', airline: faAirlines[i], base: 'DFW',
      typeRatings: ['B737','A320'], medCertExpiry: sixMonths, seniority: i + 1,
      recencyFlights: [{ type: 'B737', ts: now - i * 86_400_000 }],
    });
  }

  // Ground Crew
  const ground = [
    'GND-DFW-001','GND-DFW-002','GND-DFW-003','GND-DFW-004',
    'GND-DFW-005','GND-DFW-006','GND-DFW-007','GND-DFW-008',
  ];
  for (const id of ground) {
    crewex.registerCrew(id, {
      role: 'ground', airline: 'DFW', base: 'DFW',
      typeRatings: [], medCertExpiry: sixMonths, seniority: 1,
    });
    crewex.shiftScheduler.registerStaff(id, { role: 'ground', available: true });
  }

  // Ground shifts
  const shiftStart = now;
  crewex.shiftScheduler.addShift('SHIFT-AM-A',  { start: shiftStart, end: shiftStart + 8*3_600_000, role: 'ground', gateArea: 'A', minCrew: 2 });
  crewex.shiftScheduler.addShift('SHIFT-AM-D',  { start: shiftStart, end: shiftStart + 8*3_600_000, role: 'ground', gateArea: 'D', minCrew: 2 });
  crewex.shiftScheduler.addShift('SHIFT-PM-C',  { start: shiftStart, end: shiftStart + 8*3_600_000, role: 'ground', gateArea: 'C', minCrew: 2 });
  crewex.shiftScheduler.addShift('SHIFT-PM-E',  { start: shiftStart, end: shiftStart + 8*3_600_000, role: 'ground', gateArea: 'E', minCrew: 2 });

  // Trips
  crewex.registerTrip('TRIP-AA-DFW-LAX', { airline: 'AA', flightNumbers: ['AA1042'], aircraftType: 'B737', base: 'DFW' });
  crewex.registerTrip('TRIP-DL-DFW-JFK', { airline: 'DL', flightNumbers: ['DL887'],  aircraftType: 'B757', base: 'DFW' });

  // Assign bidlines
  crewex.assignBidline('PILOT-AA-001', ['TRIP-AA-DFW-LAX']);
  crewex.assignBidline('PILOT-AA-002', ['TRIP-AA-DFW-LAX']);
  crewex.assignBidline('PILOT-DL-001', ['TRIP-DL-DFW-JFK']);
  crewex.assignBidline('FA-AA-001',    ['TRIP-AA-DFW-LAX']);
  crewex.assignBidline('FA-DL-001',    ['TRIP-DL-DFW-JFK']);
}

// ── Seed Flights ───────────────────────────────────────────────────────────

function seedFlights(aerolex, travex, visitex) {
  const now = Date.now();
  const demos = [
    { id: 'AA1042', airline: 'AA', dest: 'LAX', dep: now + 45  * 60_000, seats: 150, fare: 240, gate: 'D1', route: 'DFW-LAX' },
    { id: 'AA2204', airline: 'AA', dest: 'ORD', dep: now + 75  * 60_000, seats: 160, fare: 195, gate: 'D2', route: 'DFW-ORD' },
    { id: 'DL887',  airline: 'DL', dest: 'JFK', dep: now + 55  * 60_000, seats: 150, fare: 275, gate: 'E1', route: 'DFW-JFK' },
    { id: 'UA504',  airline: 'UA', dest: 'SFO', dep: now + 90  * 60_000, seats: 160, fare: 310, gate: 'C1', route: 'DFW-SFO' },
    { id: 'SW1331', airline: 'SW', dest: 'MDW', dep: now + 30  * 60_000, seats: 143, fare: 140, gate: 'A1', route: 'DFW-MDW' },
    { id: 'B6618',  airline: 'B6', dest: 'BOS', dep: now + 110 * 60_000, seats: 150, fare: 220, gate: 'C2', route: 'DFW-BOS' },
    { id: 'AA3317', airline: 'AA', dest: 'MIA', dep: now + 115 * 60_000, seats: 160, fare: 190, gate: 'D3', route: 'DFW-MIA' },
    { id: 'AS421',  airline: 'AS', dest: 'SEA', dep: now + 100 * 60_000, seats: 160, fare: 280, gate: 'B1', route: 'DFW-SEA' },
  ];

  for (const f of demos) {
    aerolex.registerFlight(f.id, { gate: f.gate, destination: f.dest, scheduledDep: f.dep });
    aerolex.assignFlightToGate(f.id, f.gate);

    travex.registerFlight(f.id, {
      airline: f.airline, destination: f.dest, scheduledDep: f.dep,
      totalSeats: f.seats, fareClass: 'Y',
    });
    const sold = Math.floor(f.seats * (0.60 + Math.random() * 0.25));
    travex.updateInventory(f.id, { soldSeats: sold, baseFare: f.fare });

    // Seed booking signals into VISITEX
    visitex._handleBookingSignal(
      { tenantId: `TENANT-${f.airline}`, name: f.airline },
      { routeKey: f.route, fareClass: 'Y', amount: f.fare, channel: 'DIRECT',
        loadFactor: sold / f.seats }
    );
  }

  aerolex.connectFlights('AA1042', 'AA2204');
  aerolex.connectFlights('DL887',  'UA504');
  return demos;
}

// ── Seed Passengers ────────────────────────────────────────────────────────

function seedPassengers(passex) {
  const profiles = [
    { anonId: 'PSX-001', tier: 'vip',       origin: 'NYC', dest: 'LAX', inbound: 'AA1042', outbound: 'UA504'  },
    { anonId: 'PSX-002', tier: 'preferred',  origin: 'ORD', dest: 'MIA', inbound: 'DL887',  outbound: 'AA3317' },
    { anonId: 'PSX-003', tier: 'standard',   origin: 'SEA', dest: 'BOS', inbound: 'AS421',  outbound: 'B6618'  },
    { anonId: 'PSX-004', tier: 'vip',        origin: 'SFO', dest: 'ORD', inbound: 'UA504',  outbound: 'AA2204' },
    { anonId: 'PSX-005', tier: 'preferred',  origin: 'MDW', dest: 'JFK', inbound: 'SW1331', outbound: 'DL887'  },
    { anonId: 'PSX-006', tier: 'standard',   origin: 'LAX', dest: 'MIA', inbound: 'AA1042', outbound: 'AA3317' },
    { anonId: 'PSX-007', tier: 'preferred',  origin: 'BOS', dest: 'SEA', inbound: 'B6618',  outbound: 'AS421'  },
    { anonId: 'PSX-008', tier: 'standard',   origin: 'MIA', dest: 'ORD', inbound: 'AA3317', outbound: 'AA2204' },
  ];
  for (const p of profiles) passex.registerPassenger(p.anonId, p);
}

// ── Intelligence Cycle ─────────────────────────────────────────────────────

function runIntelligenceCycle(cycle, { aerolex, travex, passex, crewex, visitex }) {
  console.log(`\n${'═'.repeat(72)}`);
  console.log(`  SKYHI AVIATION INTELLIGENCE — CYCLE ${cycle.toString().padStart(3, '0')}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(72)}`);

  // ── AEROLEX: Airport Operations ──────────────────────────────────────────
  const opsTick = aerolex.tick(1);
  aerolex.logAPIRequest({ latencyMs: 40 + Math.random() * 70, success: true, endpoint: 'dfw-gates' });
  aerolex.logAPIRequest({ latencyMs: 25 + Math.random() * 55, success: true, endpoint: 'dfw-departures' });

  console.log('\n  ┌─ AEROLEX: Airport Operations ──────────────────────────────────');
  console.log(`  │  API: ${aerolex.apiBridge.health().toUpperCase().padEnd(10)} | ${aerolex.apiBridge.requestsPerMinute()} req/min | ${aerolex.apiBridge.avgLatency().toFixed(0)}ms avg`);
  console.log(`  │  Delays: ${opsTick.delaySnapshot.delayed}/${opsTick.delaySnapshot.totalFlights} flights | Interventions: ${aerolex.autonomousInterventions.length}`);

  if (cycle === 2) {
    const cascade = aerolex.reportDelay('DL887', 22, 'DL');
    console.log(`  │  ⚠  DL887 +22min → ${cascade.affectedConnections.length} connection(s) cascaded`);
    travex.injectSignal('CONNECTION_MISS', 0.8, { trigger: 'DL887-22min' });
    visitex.broadcastFlightEvent({ type: 'DELAY', flightId: 'DL887', delayMinutes: 22, routeKey: 'DFW-JFK' });
    passex.passengers.get('PSX-002')?.updateFrustration(22);
    crewex.crew.get('PILOT-DL-001') && (crewex.crew.get('PILOT-DL-001').wakingHours += 0.4);
  }

  if (cycle === 4) {
    const cascade = aerolex.reportDelay('SW1331', 15, 'SW');
    console.log(`  │  ⚠  SW1331 +15min → ${cascade.affectedConnections.length} connection(s) cascaded`);
    travex.injectSignal('CAPACITY_COLLAPSE', 0.65, { trigger: 'SW1331-15min' });
    visitex.broadcastFlightEvent({ type: 'DELAY', flightId: 'SW1331', delayMinutes: 15, routeKey: 'DFW-MDW' });
  }

  // ── TRAVEX: Booking Intelligence ─────────────────────────────────────────
  const scan = travex.scan();

  console.log('\n  ├─ TRAVEX: Last-Minute Booking Engine ──────────────────────────');
  console.log(`  │  Scan #${scan.scanCycle}: ${scan.flightsScanned} flights | ${scan.opportunities.length} opps | ${scan.scanMs}ms | acc: ${(travex.acceptanceRate*100).toFixed(0)}%`);

  const topOpps = scan.opportunities.slice(0, 3);
  for (const opp of topOpps) {
    console.log(`  │  → [${opp.urgency}] ${opp.flightId}→${opp.destination} | ${opp.availableSeats} seats | ${(opp.confidence*100).toFixed(0)}% conf | $${opp.estimatedRecovery.toFixed(0)}`);
  }

  if (cycle === 1 && topOpps[0]) {
    travex.recordOutcome(topOpps[0].id, { accepted: true, bookedSeats: 4, actualRevenue: topOpps[0].estimatedRecovery * 0.72 });
    console.log(`  │  ✓  Booked: ${topOpps[0].id} — $${(topOpps[0].estimatedRecovery * 0.72).toFixed(0)} recovered`);
  }

  // ── PASSEX: Passenger Intelligence ───────────────────────────────────────
  const vipScan = passex.runVIPScan(cycle === 2 ? 25 : 5);

  console.log('\n  ├─ PASSEX: Passenger Intelligence ──────────────────────────────');
  console.log(`  │  ${passex.passengers.size} profiles | VIP alerts: ${passex.vipAlerts} | match rate: ${passex.totalMatchAttempts > 0 ? (passex.successfulMatches/passex.totalMatchAttempts*100).toFixed(0) : 'N/A'}%`);

  if (cycle === 1) {
    const m = passex.matchConnection('PSX-001', { currentGate: 'D1', destinationGate: 'E5', availableMinutes: 45 });
    console.log(`  │  PSX-001: ${m.success ? '✓' : '✗'} ${m.path?.join('→')} | ${m.walkMinutes}min walk`);
  }

  if (cycle === 3) {
    const m = passex.matchConnection('PSX-004', { currentGate: 'C1', destinationGate: 'D2', availableMinutes: 30 });
    console.log(`  │  PSX-004: ${m.success ? '✓' : '✗'} ${m.path?.join('→')} | ${m.walkMinutes}min walk`);
    const pred = passex.predictGateFlow('D1', 10);
    console.log(`  │  Gate D1 forecast +10min: ${pred.expectedArrivals} pax [±${pred.stddev}]`);
  }

  for (const alert of vipScan.alerts) {
    console.log(`  │  🔔 ${alert.tier.toUpperCase()} ${alert.anonId}: ${(alert.frustrationScore*100).toFixed(0)}% → ${alert.action}`);
  }

  // ── CREWEX: Crew Intelligence ─────────────────────────────────────────────
  const fatigueReport = crewex.scanFatigue(cycle === 2 ? 22 : 0);
  const aaFlightCoverage = crewex.checkFlightCoverage('TRIP-AA-DFW-LAX');

  console.log('\n  ├─ CREWEX: Aviation Crew Intelligence ──────────────────────────');
  console.log(`  │  Crew: ${crewex.crew.size} registered | ${[...crewex.crew.values()].filter(c=>c.role==='pilot').length} pilots | ${[...crewex.crew.values()].filter(c=>c.role==='fa').length} FAs | ${[...crewex.crew.values()].filter(c=>c.role==='ground').length} ground`);
  console.log(`  │  AA1042 coverage: ${aaFlightCoverage.covered ? '✓ COVERED' : '✗ UNCOVERED'} (${aaFlightCoverage.qualifiedPilots}/2 pilots)`);

  if (fatigueReport.alerts.length > 0) {
    for (const a of fatigueReport.alerts) {
      console.log(`  │  ⚠  ${a.role.toUpperCase()} ${a.crewId}: fatigue ${a.fatigueScore}/7 → ${a.severity} — ${a.recommendation}`);
    }
  } else {
    console.log(`  │  Fatigue: all crew within safe limits`);
  }

  if (cycle === 1) {
    const sched = crewex.scheduleGroundCrew();
    console.log(`  │  Ground shifts: ${sched.coverage.covered}/${sched.coverage.totalShifts} covered`);
  }

  if (cycle === 3) {
    // Compliance check on active pilots
    const check1 = crewex.checkCompliance('PILOT-AA-001');
    const check2 = crewex.checkCompliance('PILOT-DL-001');
    console.log(`  │  Part 117 check — AA pilot: ${check1.compliant ? '✓ COMPLIANT' : '✗ VIOLATION'} | DL pilot: ${check2.compliant ? '✓ COMPLIANT' : '✗ VIOLATION'}`);
  }

  // ── VISITEX: Booking Platform Gateway ────────────────────────────────────
  // Simulate API calls from multiple tenants
  const expFare = visitex.apiRequest('TENANT-EXPEDIA', { endpoint: 'GET /fares', params: { routeKey: 'DFW-LAX', channel: 'OTA' } });
  const dlYield  = visitex.apiRequest('TENANT-DL',     { endpoint: 'GET /route-yield', params: { routeKey: 'DFW-JFK' } });
  const forecast = visitex.apiRequest('TENANT-AMEXGBT',{ endpoint: 'GET /demand-forecast', params: { origin: 'DFW', destination: 'LAX', windowDays: 30 } });
  const optimized = visitex.optimizeAllFares();

  console.log('\n  └─ VISITEX: Multi-Tenant Booking Gateway ───────────────────────');
  console.log(`  │  Tenants: ${visitex.tenants.size} | API calls: ${visitex.apiCallsTotal} | Events queued: ${visitex.webhookEventsQueued}`);
  const byType = visitex.tenantsByType();
  console.log(`  │  ${Object.entries(byType).map(([t,n]) => `${t}:${n}`).join(' | ')}`);
  if (expFare.success) {
    console.log(`  │  Expedia DFW-LAX: Y $${expFare.fares?.Y} | J $${expFare.fares?.J} | F $${expFare.fares?.F}`);
  }
  if (dlYield.success) {
    console.log(`  │  DL DFW-JFK yield: LF ${(dlYield.avgLoadFactor*100).toFixed(0)}% | top ch: ${dlYield.topChannel} | opt fare: $${dlYield.optimalFare}`);
  }
  if (forecast.success) {
    console.log(`  │  Amex GBT DFW→LAX: ${forecast.projectedPassengers} pax / 30d | ${forecast.dailyAvg}/day | Kelly: ${forecast.kellyAllocation}`);
  }
  const raiseFare = optimized.filter(r => r.action === 'RAISE_FARE').length;
  const reduceFare = optimized.filter(r => r.action === 'REDUCE_FARE').length;
  console.log(`  │  Fare optimizer: ${raiseFare} routes RAISE | ${reduceFare} routes REDUCE | ${optimized.length - raiseFare - reduceFare} HOLD`);
}

// ── Final Status Digest ────────────────────────────────────────────────────

function printStatusDigest({ aerolex, travex, passex, crewex, visitex }) {
  console.log(`\n${'═'.repeat(72)}`);
  console.log('  SKYHI AVIATION INTELLIGENCE — SESSION DIGEST');
  console.log(`${'═'.repeat(72)}`);

  const as = aerolex.getAGIStatus();
  const ts = travex.getAGIStatus();
  const ps = passex.getAGIStatus();
  const cs = crewex.getAGIStatus();
  const vs = visitex.getAGIStatus();

  const row = (label, value) =>
    console.log(`    ${label.padEnd(28)} ${value}`);

  console.log('\n  ▸ AEROLEX — Airport Operations');
  row('Operational ticks:',          String(as.airportOperations.operationalTick));
  row('Gates managed:',              String(as.airportOperations.gates));
  row('Auto-interventions:',         String(as.airportOperations.autonomousInterventions));
  row('API health:',                 as.apiBridge.health);
  row('Avg API latency:',            `${as.apiBridge.avgLatencyMs}ms`);

  console.log('\n  ▸ TRAVEX — Booking Intelligence');
  row('Scan cycles:',                String(ts.bookingIntelligence.scanCycles));
  row('Opportunities found:',        String(ts.bookingIntelligence.opportunitiesFound));
  row('Acceptance rate:',            `${(ts.bookingIntelligence.acceptanceRate * 100).toFixed(1)}%`);
  row('Revenue recovered:',          `$${ts.bookingIntelligence.recoveredRevenue}`);

  console.log('\n  ▸ PASSEX — Passenger Intelligence');
  row('Active profiles:',            String(ps.passengerGraph.totalPassengers));
  row('VIP passengers:',             String(ps.passengerGraph.vipPassengers));
  row('Connection match rate:',      `${(ps.connectionMatching.matchRate * 100).toFixed(1)}%`);
  row('Avg match latency:',          `${ps.connectionMatching.avgLatencyMs}ms`);
  row('VIP alerts issued:',          String(ps.vipIntelligence.vipAlertsIssued));

  console.log('\n  ▸ CREWEX — Aviation Crew Intelligence');
  row('Total crew:',                 String(cs.crewIntelligence.totalCrew));
  row('Pilots:',                     String(cs.crewIntelligence.pilots));
  row('Flight attendants:',          String(cs.crewIntelligence.flightAttendants));
  row('Ground crew:',                String(cs.crewIntelligence.groundCrew));
  row('Airlines tracked:',           String(cs.crewIntelligence.airlinesTracked));
  row('Compliance checks:',          String(cs.compliance.checksPerformed));
  row('FAA violations:',             String(cs.compliance.violations));
  row('Fatigue alerts:',             String(cs.compliance.fatigueAlerts));
  row('Auto-reassignments:',         String(cs.compliance.autoReassignments));
  row('Shifts covered:',             `${cs.scheduling.covered}/${cs.scheduling.totalShifts}`);

  console.log('\n  ▸ VISITEX — Booking Platform Gateway');
  row('Tenants registered:',         String(vs.multiTenantGateway.totalTenants));
  row('Tenant types:',               Object.entries(vs.multiTenantGateway.byType).map(([t,n]) => `${t}:${n}`).join(', '));
  row('Total API calls:',            String(vs.multiTenantGateway.apiCallsTotal));
  row('Webhook events:',             String(vs.multiTenantGateway.webhookEventsQueued));
  row('Routes tracked:',             String(vs.routeIntelligence.routesTracked));
  row('Fare optimizations:',         String(vs.routeIntelligence.fareOptimizations));
  row('Demand forecasts:',           String(vs.routeIntelligence.demandForecasts));

  console.log(`\n${'═'.repeat(72)}`);
  console.log('  Platform: RSHIP-PROD-SKYHI-001 | AGIs: AEROLEX·TRAVEX·PASSEX·CREWEX·VISITEX');
  console.log('  © 2026 RSHIP AGI Systems — Skyhi Group Enterprise License');
  console.log(`${'═'.repeat(72)}\n`);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '░'.repeat(72));
  console.log('  SKYHI AVIATION INTELLIGENCE PLATFORM');
  console.log('  RSHIP-PROD-SKYHI-001 — Full Ecosystem Edition');
  console.log('  AEROLEX · TRAVEX · PASSEX · CREWEX · VISITEX');
  console.log('  Airports · Airlines · Booking Platforms · Pilots · Cabin Crew');
  console.log('░'.repeat(72));

  // ── Birth all 5 AGIs ───────────────────────────────────────────────────
  console.log('\n  Birthing intelligence organs...');

  const aerolex = birthAEROLEX({ securityRate: 120, maxLatencyMs: 400 });
  const travex   = birthTRAVEX({ bookingWindowMinutes: 120 });
  const passex   = birthPASSEX();
  const crewex   = birthCREWEX();
  const visitex  = birthVISITEX();

  console.log(`  ✓ AEROLEX  born — ${aerolex.designation}`);
  console.log(`  ✓ TRAVEX   born — ${travex.designation}`);
  console.log(`  ✓ PASSEX   born — ${passex.designation}`);
  console.log(`  ✓ CREWEX   born — ${crewex.designation}`);
  console.log(`  ✓ VISITEX  born — ${visitex.designation}`);

  // ── Configure Platform Environment ────────────────────────────────────
  console.log('\n  Configuring platform environment...');

  buildDFWGates(aerolex);
  buildConnectionGraph(passex);
  buildRoutes(visitex);
  buildTenants(visitex);
  seedCrew(crewex);
  const flights = seedFlights(aerolex, travex, visitex);
  seedPassengers(passex);

  passex.processFlightArrival('AA1042', { gateId: 'D1', delayMinutes: 0 });
  passex.processFlightArrival('DL887',  { gateId: 'E1', delayMinutes: 0 });
  passex.processFlightArrival('SW1331', { gateId: 'A1', delayMinutes: 0 });
  passex.recordGateArrivals('D1', 42, 5);
  passex.recordGateArrivals('E1', 38, 5);

  travex.injectSignal('YIELD_OPPORTUNITY', 0.7, { source: 'startup' });

  // Pilot duty starts
  crewex.reportDutyStart('PILOT-AA-001', { flightHours: 0 });
  crewex.reportDutyStart('PILOT-AA-002', { flightHours: 0 });
  crewex.reportDutyStart('PILOT-DL-001', { flightHours: 0 });

  console.log(`  ✓ ${flights.length} flights active across DFW`);
  console.log(`  ✓ ${crewex.crew.size} crew registered (${[...crewex.crew.values()].filter(c=>c.role==='pilot').length} pilots, ${[...crewex.crew.values()].filter(c=>c.role==='fa').length} FAs, ${[...crewex.crew.values()].filter(c=>c.role==='ground').length} ground)`);
  console.log(`  ✓ ${visitex.tenants.size} tenants in booking gateway (${[...visitex.tenants.values()].filter(t=>t.type==='AIRLINE').length} airlines, ${[...visitex.tenants.values()].filter(t=>t.type==='OTA'||t.type==='METASEARCH'||t.type==='GDS').length} platforms)`);
  console.log(`  ✓ ${passex.passengers.size} passenger profiles active`);
  console.log(`  ✓ ${passex.connectionGraph.size} gates in connection graph`);
  console.log(`  ✓ Platform organism alive\n`);

  // ── Run 5 Intelligence Cycles ──────────────────────────────────────────
  for (let cycle = 1; cycle <= 5; cycle++) {
    await new Promise(r => setTimeout(r, 700));
    runIntelligenceCycle(cycle, { aerolex, travex, passex, crewex, visitex });
  }

  // ── Final Digest ───────────────────────────────────────────────────────
  await new Promise(r => setTimeout(r, 400));
  printStatusDigest({ aerolex, travex, passex, crewex, visitex });
}

main().catch(err => {
  console.error('Skyhi platform error:', err);
  process.exit(1);
});
