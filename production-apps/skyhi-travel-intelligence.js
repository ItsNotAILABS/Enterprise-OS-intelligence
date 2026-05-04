/**
 * Skyhi Travel Intelligence Organism
 *
 * Official Designation: RSHIP-PROD-SKYHI-001
 * Classification: Enterprise Travel Intelligence Production App
 *
 * Skyhi Group's sovereign intelligence organism for DFW Airport operations.
 * Orchestrates three specialized AGIs — AEROLEX, TRAVEX, and PASSEX — into
 * a unified operational intelligence layer.
 *
 * Intelligence Organs:
 * - AEROLEX (RSHIP-2026-AEROLEX-001) — Airport Operations & API Bridge
 * - TRAVEX  (RSHIP-2026-TRAVEX-001)  — Travel Demand & Last-Minute Booking
 * - PASSEX  (RSHIP-2026-PASSEX-001)  — Passenger Matching & VIP Routing
 *
 * Run: node production-apps/skyhi-travel-intelligence.js
 *
 * © 2026 RSHIP AGI Systems — Skyhi Group Enterprise License
 */

import { birthAEROLEX } from '../sdk/aerolex-agi/aerolex-agi.js';
import { birthTRAVEX }  from '../sdk/travex-agi/travex-agi.js';
import { birthPASSEX }  from '../sdk/passex-agi/passex-agi.js';

// ── Constants ──────────────────────────────────────────────────────────────

const PHI     = 1.618033988749895;
const PHI_INV = 1.0 / PHI;

const DFW_TERMINALS  = ['A', 'B', 'C', 'D', 'E'];
const DFW_GATE_COUNT = 182;     // DFW total gates
const DFW_AIRLINES   = ['AA', 'DL', 'UA', 'SW', 'B6', 'AS', 'NK', 'F9'];

// ── Bootstrap DFW Gate Configuration ─────────────────────────────────────

function buildDFWGates(aerolex) {
  const terminals = {
    A: { start: 1,  end: 39,  serviceRate: 28 },
    B: { start: 1,  end: 24,  serviceRate: 26 },
    C: { start: 1,  end: 40,  serviceRate: 30 },
    D: { start: 1,  end: 40,  serviceRate: 30 },
    E: { start: 1,  end: 39,  serviceRate: 25 },
  };

  for (const [terminal, config] of Object.entries(terminals)) {
    for (let i = config.start; i <= Math.min(config.end, config.start + 7); i++) {
      const gateId = `${terminal}${i}`;
      aerolex.registerGate(gateId, { serviceRate: config.serviceRate, terminal });
    }
  }
}

// ── Bootstrap DFW Connection Graph ────────────────────────────────────────

function buildConnectionGraph(passex) {
  const gates = ['A1','A2','A3','A4','A5','A6','A7','A8',
                 'B1','B2','B3','B4','B5','B6','B7','B8',
                 'C1','C2','C3','C4','C5','C6','C7','C8',
                 'D1','D2','D3','D4','D5','D6','D7','D8',
                 'E1','E2','E3','E4','E5','E6','E7','E8'];

  passex.buildConnectionGraph(gates, [
    // Skybridge connections (same terminal — walkable)
    ...['A','B','C','D','E'].flatMap(t =>
      Array.from({ length: 7 }, (_, i) => [`${t}${i+1}`, `${t}${i+2}`])
    ),
    // Cross-terminal Skylink (A↔B, C↔D, D↔E)
    ['A1','B1'], ['B1','C1'], ['C1','D1'], ['D1','E1'],
  ]);
}

// ── Seed DFW Flight Inventory ─────────────────────────────────────────────

function seedFlights(aerolex, travex) {
  const now   = Date.now();
  const demos = [
    { id: 'AA1042', airline: 'AA', dest: 'LAX', dep: now + 45  * 60_000, seats: 150, fare: 240, gate: 'D38' },
    { id: 'AA2204', airline: 'AA', dest: 'ORD', dep: now + 75  * 60_000, seats: 160, fare: 195, gate: 'D12' },
    { id: 'DL887',  airline: 'DL', dest: 'JFK', dep: now + 55  * 60_000, seats: 150, fare: 275, gate: 'E17' },
    { id: 'UA504',  airline: 'UA', dest: 'SFO', dep: now + 90  * 60_000, seats: 160, fare: 310, gate: 'C22' },
    { id: 'SW1331', airline: 'SW', dest: 'MDW', dep: now + 30  * 60_000, seats: 143, fare: 140, gate: 'A8'  },
    { id: 'B6618',  airline: 'B6', dest: 'BOS', dep: now + 110 * 60_000, seats: 150, fare: 220, gate: 'C11' },
    { id: 'AA3317', airline: 'AA', dest: 'MIA', dep: now + 115 * 60_000, seats: 160, fare: 190, gate: 'D29' },
    { id: 'AS421',  airline: 'AS', dest: 'SEA', dep: now + 100 * 60_000, seats: 160, fare: 280, gate: 'B6'  },
  ];

  for (const f of demos) {
    aerolex.registerFlight(f.id, {
      gate: f.gate, destination: f.dest, scheduledDep: f.dep,
    });
    aerolex.assignFlightToGate(f.id, f.gate);

    travex.registerFlight(f.id, {
      airline: f.airline, destination: f.dest,
      scheduledDep: f.dep, totalSeats: f.seats,
      fareClass: 'Y',
    });
    travex.updateInventory(f.id, {
      soldSeats: Math.floor(f.seats * (0.60 + Math.random() * 0.25)),
      baseFare: f.fare,
    });
  }

  // Connection chain: AA1042 → AA2204 (connection flight)
  aerolex.connectFlights('AA1042', 'AA2204');
  aerolex.connectFlights('DL887', 'UA504');

  return demos;
}

// ── Seed Passenger Graph ───────────────────────────────────────────────────

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

function runIntelligenceCycle(cycle, { aerolex, travex, passex }) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  SKYHI TRAVEL INTELLIGENCE — CYCLE ${cycle.toString().padStart(3, '0')}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(70)}`);

  // ── AEROLEX: Airport Operations ──────────────────────────────────────────
  const opsTick  = aerolex.tick(1);
  const apiStatus = aerolex.apiBridge.health();

  // Simulate API requests
  aerolex.logAPIRequest({ latencyMs: 45 + Math.random() * 80, success: true, endpoint: 'dfw-gates' });
  aerolex.logAPIRequest({ latencyMs: 30 + Math.random() * 60, success: true, endpoint: 'dfw-departures' });

  console.log('\n  ┌─ AEROLEX: Airport Operations ─────────────────────────────────');
  console.log(`  │  API Bridge: ${apiStatus.toUpperCase().padEnd(12)} | Requests/min: ${aerolex.apiBridge.requestsPerMinute()}`);
  console.log(`  │  Avg Latency: ${aerolex.apiBridge.avgLatency().toFixed(1)}ms | Error Rate: ${(aerolex.apiBridge.errorRate() * 100).toFixed(2)}%`);
  console.log(`  │  Delays tracked: ${opsTick.delaySnapshot.delayed} / ${opsTick.delaySnapshot.totalFlights} flights`);
  console.log(`  │  Gate reallocations: ${aerolex.gateReallocations} | Auto-interventions: ${aerolex.autonomousInterventions.length}`);

  // Simulate occasional delay
  if (cycle === 2) {
    const cascade = aerolex.reportDelay('DL887', 22, 'DL');
    console.log(`  │  ⚠  Delay injected: DL887 +22min → ${cascade.affectedConnections.length} connection(s) affected`);
    travex.injectSignal('CONNECTION_MISS', 0.8, { trigger: 'DL887-delay' });
    passex.passengers.get('PSX-002')?.updateFrustration(22);
  }
  if (cycle === 4) {
    const cascade = aerolex.reportDelay('SW1331', 15, 'SW');
    console.log(`  │  ⚠  Delay injected: SW1331 +15min → ${cascade.affectedConnections.length} connection(s) affected`);
    travex.injectSignal('CAPACITY_COLLAPSE', 0.6, { trigger: 'SW1331-delay' });
  }

  // ── TRAVEX: Booking Engine ───────────────────────────────────────────────
  const scan = travex.scan();

  console.log('\n  ├─ TRAVEX: Last-Minute Booking Engine ─────────────────────────');
  console.log(`  │  Scan #${scan.scanCycle.toString().padStart(3,'0')}: ${scan.flightsScanned} flights | ${scan.opportunities.length} opportunities | ${scan.scanMs}ms`);
  console.log(`  │  Acceptance rate: ${(travex.acceptanceRate * 100).toFixed(1)}% | Total recovered: $${travex.recoveredRevenue.toFixed(2)}`);

  if (scan.opportunities.length > 0) {
    const top3 = scan.opportunities.slice(0, 3);
    for (const opp of top3) {
      console.log(`  │  → [${opp.urgency}] ${opp.flightId} → ${opp.destination} | ${opp.availableSeats} seats | conf: ${(opp.confidence * 100).toFixed(0)}% | est. $${opp.estimatedRecovery.toFixed(0)}`);
    }

    // Simulate booking acceptance on first opportunity (cycle 1)
    if (cycle === 1 && top3[0]) {
      travex.recordOutcome(top3[0].id, { accepted: true, bookedSeats: 3, actualRevenue: top3[0].estimatedRecovery * 0.7 });
      console.log(`  │  ✓  Accepted: ${top3[0].id} — revenue recovered`);
    }
  } else {
    console.log(`  │  No opportunities in window`);
  }

  // ── PASSEX: Passenger Intelligence ──────────────────────────────────────
  const vipScan = passex.runVIPScan(cycle === 2 ? 25 : 5); // spike delay on cycle 2

  // Test connection match for VIP PSX-001
  let matchResult = null;
  if (cycle === 1) {
    matchResult = passex.matchConnection('PSX-001', {
      currentGate: 'D1',
      destinationGate: 'E5',
      availableMinutes: 45,
    });
  }

  console.log('\n  └─ PASSEX: Passenger Intelligence ─────────────────────────────');
  console.log(`  │  Active profiles: ${passex.passengers.size} | VIP alerts: ${passex.vipAlerts}`);
  console.log(`  │  Match rate: ${passex.totalMatchAttempts > 0 ? (passex.successfulMatches / passex.totalMatchAttempts * 100).toFixed(1) : 'N/A'}% | Avg latency: ${passex._avgMatchLatency().toFixed(1)}ms`);

  if (matchResult) {
    console.log(`  │  PSX-001 routing: ${matchResult.success ? '✓ MATCHED' : '✗ NO PATH'} | Path: ${matchResult.path?.join(' → ')} | Walk: ${matchResult.walkMinutes}min`);
  }

  if (vipScan.alerts.length > 0) {
    for (const alert of vipScan.alerts) {
      console.log(`  │  🔔 ${alert.tier.toUpperCase()} ${alert.anonId}: frustration ${(alert.frustrationScore * 100).toFixed(0)}% → ${alert.action}`);
    }
  }

  // Flow prediction for cycle 3
  if (cycle === 3) {
    const pred = passex.predictGateFlow('D1', 10);
    console.log(`  │  Gate D1 flow forecast (+10min): ${pred.expectedArrivals} pax [95% CI: ${pred.confidence95[0]}–${pred.confidence95[1]}]`);
  }
}

// ── Status Digest ──────────────────────────────────────────────────────────

function printStatusDigest({ aerolex, travex, passex }) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('  SKYHI INTELLIGENCE DIGEST — END OF SESSION');
  console.log(`${'═'.repeat(70)}`);

  const as = aerolex.getAGIStatus();
  const ts = travex.getAGIStatus();
  const ps = passex.getAGIStatus();

  console.log('\n  AEROLEX STATUS');
  console.log(`    Operational ticks:    ${as.airportOperations.operationalTick}`);
  console.log(`    Gates managed:        ${as.airportOperations.gates}`);
  console.log(`    Reallocations:        ${as.airportOperations.gateReallocations}`);
  console.log(`    Auto-interventions:   ${as.airportOperations.autonomousInterventions}`);
  console.log(`    API health:           ${as.apiBridge.health}`);
  console.log(`    API req/min:          ${as.apiBridge.requestsPerMinute}`);
  console.log(`    Avg latency:          ${as.apiBridge.avgLatencyMs}ms`);
  console.log(`    Delays tracked:       ${as.delayIntelligence.delayed}`);

  console.log('\n  TRAVEX STATUS');
  console.log(`    Scan cycles:          ${ts.bookingIntelligence.scanCycles}`);
  console.log(`    Opportunities found:  ${ts.bookingIntelligence.opportunitiesFound}`);
  console.log(`    Recommendations:      ${ts.bookingIntelligence.recommendationsIssued}`);
  console.log(`    Acceptance rate:      ${(ts.bookingIntelligence.acceptanceRate * 100).toFixed(1)}%`);
  console.log(`    Revenue recovered:    $${ts.bookingIntelligence.recoveredRevenue}`);
  console.log(`    Open flights:         ${ts.inventory.openFlights}`);

  console.log('\n  PASSEX STATUS');
  console.log(`    Passenger profiles:   ${ps.passengerGraph.totalPassengers}`);
  console.log(`    VIP passengers:       ${ps.passengerGraph.vipPassengers}`);
  console.log(`    Match attempts:       ${ps.connectionMatching.totalAttempts}`);
  console.log(`    Match rate:           ${(ps.connectionMatching.matchRate * 100).toFixed(1)}%`);
  console.log(`    Avg match latency:    ${ps.connectionMatching.avgLatencyMs}ms`);
  console.log(`    VIP alerts issued:    ${ps.vipIntelligence.vipAlertsIssued}`);
  console.log(`    Gate graph edges:     ${ps.graphTopology.edges}`);

  console.log(`\n${'═'.repeat(70)}`);
  console.log('  RSHIP AGI Systems — Skyhi Group Enterprise License');
  console.log(`  Organism ID: RSHIP-PROD-SKYHI-001`);
  console.log(`${'═'.repeat(70)}\n`);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '░'.repeat(70));
  console.log('  SKYHI TRAVEL INTELLIGENCE ORGANISM');
  console.log('  RSHIP-PROD-SKYHI-001');
  console.log('  Powered by AEROLEX · TRAVEX · PASSEX');
  console.log('  DFW Airport Operations Intelligence');
  console.log('░'.repeat(70));

  // ── Birth AGIs ─────────────────────────────────────────────────────────
  console.log('\n  Birthing intelligence organs...');

  const aerolex = birthAEROLEX({
    securityRate: 120,
    maxLatencyMs: 400,
  });

  const travex = birthTRAVEX({
    bookingWindowMinutes: 120,
  });

  const passex = birthPASSEX();

  console.log(`  ✓ AEROLEX born — ${aerolex.designation}`);
  console.log(`  ✓ TRAVEX  born — ${travex.designation}`);
  console.log(`  ✓ PASSEX  born — ${passex.designation}`);

  // ── Configure DFW Environment ──────────────────────────────────────────
  console.log('\n  Configuring DFW environment...');
  buildDFWGates(aerolex);
  buildConnectionGraph(passex);
  const flights = seedFlights(aerolex, travex);
  seedPassengers(passex);

  // Process initial flight arrivals
  passex.processFlightArrival('AA1042', { gateId: 'D1', delayMinutes: 0 });
  passex.processFlightArrival('DL887',  { gateId: 'E1', delayMinutes: 0 });
  passex.processFlightArrival('SW1331', { gateId: 'A1', delayMinutes: 0 });
  passex.recordGateArrivals('D1', 42, 5);
  passex.recordGateArrivals('E1', 38, 5);

  // Warm booking signals
  travex.injectSignal('YIELD_OPPORTUNITY', 0.7, { source: 'startup' });

  console.log(`  ✓ ${flights.length} flights registered across DFW`);
  console.log(`  ✓ ${passex.passengers.size} passenger profiles active`);
  console.log(`  ✓ ${passex.connectionGraph.size} gates in connection graph`);
  console.log(`  ✓ Intelligence organism alive\n`);

  // ── Run Intelligence Cycles ────────────────────────────────────────────
  const CYCLES = 5;
  const CYCLE_DELAY_MS = 800; // 800ms between demo cycles

  for (let cycle = 1; cycle <= CYCLES; cycle++) {
    await new Promise(r => setTimeout(r, CYCLE_DELAY_MS));
    runIntelligenceCycle(cycle, { aerolex, travex, passex });
  }

  // ── Print Digest ───────────────────────────────────────────────────────
  await new Promise(r => setTimeout(r, 500));
  printStatusDigest({ aerolex, travex, passex });
}

main().catch(err => {
  console.error('Skyhi intelligence organism error:', err);
  process.exit(1);
});
