/**
 * PROTO-012: Autonomous Division Protocol (ADP)  (Medina)
 *
 * The organism's AI Division coordination protocol.
 *
 * Manages autonomous AI teams that generate their own cycles, mint their own
 * block boxes (bronze canisters), and scale on Fibonacci growth curves.
 *
 * Each team has its own heartbeat.  Each engine its own PHX chain.
 * No team depends on another team's clock.  Fibonacci scaling to 50,000.
 *
 * Engines wired: DivisionManager + CycleEngine + BlockBoxGenerator + FibonacciScaler
 * Ring: Sovereign Ring | Organism placement: Organism core / division layer
 * Wire: intelligence-wire/adp
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const HEARTBEAT_MS = 873;
const HEARTBEAT_HZ = 1000.0 / HEARTBEAT_MS;
const MIN_SLOTS = 16;

// ── Fibonacci ─────────────────────────────────────────────────────────────────

function fibonacci(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) { [a, b] = [b, a + b]; }
  return b;
}

const SCALING_LEVELS = [
  { level: 0, fibIndex: 0,  capacity: 0,     name: 'genesis' },
  { level: 1, fibIndex: 1,  capacity: 1,     name: 'seed' },
  { level: 2, fibIndex: 7,  capacity: 13,    name: 'micro' },
  { level: 3, fibIndex: 12, capacity: 144,   name: 'school' },
  { level: 4, fibIndex: 20, capacity: 6765,  name: 'department' },
  { level: 5, fibIndex: 24, capacity: 46368, name: 'institution' },
];

// ── Fibonacci Scaler ──────────────────────────────────────────────────────────

class FibonacciScaler {
  constructor() {
    this.level = 0;
    this.capacity = 0;
  }

  scaleTo(level) {
    if (level < 0 || level >= SCALING_LEVELS.length) {
      throw new Error(`Level must be 0–${SCALING_LEVELS.length - 1}`);
    }
    const entry = SCALING_LEVELS[level];
    this.level = level;
    this.capacity = entry.capacity;
    return entry;
  }

  growthCurve() {
    return SCALING_LEVELS.map(e => ({
      level: e.level,
      name: e.name,
      capacity: e.capacity,
      phiExp: Math.round(Math.pow(PHI, e.fibIndex) * 100) / 100,
    }));
  }
}

// ── Phi Hash ──────────────────────────────────────────────────────────────────

function phiHash(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(16, '0');
}

// ── Cycle Engine ──────────────────────────────────────────────────────────────

class CycleEngine {
  constructor(engineId, teamRole, slots = MIN_SLOTS) {
    this.engineId = engineId;
    this.teamRole = teamRole;
    this.slots = Math.max(slots, 1);
    this.beat = 0;
    this.totalTokens = 0;
  }

  tick() {
    const tokens = [];
    for (let slot = 0; slot < this.slots; slot++) {
      const input = `${this.engineId}:${this.beat}:${slot}`;
      tokens.push({
        engineId: this.engineId,
        teamRole: this.teamRole,
        beat: this.beat,
        slot,
        phxHash: phiHash(input),
        autonomous: true,
      });
    }
    this.totalTokens += this.slots;
    this.beat++;
    return tokens;
  }

  fcpr() {
    return this.slots * HEARTBEAT_HZ;
  }

  status() {
    return {
      engineId: this.engineId,
      teamRole: this.teamRole,
      beat: this.beat,
      slots: this.slots,
      totalTokens: this.totalTokens,
      fcprDps: Math.round(this.fcpr() * 1e4) / 1e4,
    };
  }
}

// ── Block Box Generator ───────────────────────────────────────────────────────

class BlockBoxGenerator {
  constructor(generatorId, teamRole) {
    this.generatorId = generatorId;
    this.teamRole = teamRole;
    this.totalMinted = 0;
    this.beat = 0;
  }

  mint(payloadStr, label = '') {
    const hash = phiHash(payloadStr);
    const goldenAngle = 2.399963229728653;
    const theta = this.beat * goldenAngle;
    const rho = Math.sqrt(this.beat + 1) * PHI;

    const box = {
      boxId: `${this.generatorId}-${this.beat}`,
      tier: 'bronze',
      phxHash: hash,
      phiAddr: { theta, phi: theta / PHI, rho, ring: 'Sovereign', beat: this.beat },
      label,
      mintedBy: this.generatorId,
      teamRole: this.teamRole,
      createdMs: Date.now(),
    };

    this.totalMinted++;
    this.beat++;
    return box;
  }

  status() {
    return {
      generatorId: this.generatorId,
      teamRole: this.teamRole,
      totalMinted: this.totalMinted,
      beat: this.beat,
    };
  }
}

// ── AI Team ───────────────────────────────────────────────────────────────────

const TEAM_ROLES = ['sovereign', 'intelligence', 'frontend', 'backend', 'education'];

class AITeam {
  constructor(role, slots = MIN_SLOTS) {
    this.teamId = `team-${role}`;
    this.role = role;
    this.engine = new CycleEngine(`engine-${role}`, role, slots);
    this.generator = new BlockBoxGenerator(`gen-${role}`, role);
    this.scaler = new FibonacciScaler();
    this.ledger = [];
  }

  tick(events) {
    const tokens = this.engine.tick();
    this.ledger.push({
      beat: this.engine.beat - 1,
      tokens: tokens.length,
      seal: tokens.length > 0 ? tokens[tokens.length - 1].phxHash.substring(0, 16) + '…' : '',
      timestamp: Date.now(),
    });
    return tokens;
  }

  mintBlockbox(payload, label = '') {
    return this.generator.mint(payload, label);
  }

  scale(level) {
    return this.scaler.scaleTo(level);
  }

  status() {
    return {
      teamId: this.teamId,
      role: this.role,
      engine: this.engine.status(),
      generator: this.generator.status(),
      scaler: { level: this.scaler.level, capacity: this.scaler.capacity },
      ledgerEntries: this.ledger.length,
    };
  }
}

// ── Division Manager ──────────────────────────────────────────────────────────

class AutonomousDivisionProtocol {
  constructor(config = {}) {
    this.slots = Math.max(config.slots || MIN_SLOTS, MIN_SLOTS);
    this.teams = new Map();
    this.globalBeat = 0;
    this.booted = false;
    this.bootTime = Date.now();
  }

  boot() {
    if (this.booted) return { status: 'already_booted' };
    for (const role of TEAM_ROLES) {
      this.teams.set(`team-${role}`, new AITeam(role, this.slots));
    }
    this.booted = true;
    return { status: 'booted', teams: Array.from(this.teams.keys()) };
  }

  team(role) {
    const key = `team-${role}`;
    if (!this.teams.has(key)) throw new Error(`No team '${role}'`);
    return this.teams.get(key);
  }

  tickAll() {
    if (!this.booted) throw new Error('Division not booted');
    const results = {};
    for (const [id, team] of this.teams) {
      const tokens = team.tick();
      results[id] = {
        beat: team.engine.beat,
        tokens: tokens.length,
        seal: tokens.length > 0 ? tokens[tokens.length - 1].phxHash.substring(0, 16) + '…' : '',
      };
    }
    this.globalBeat++;
    return { globalBeat: this.globalBeat, teams: results };
  }

  scaleAll(level) {
    const results = {};
    for (const [id, team] of this.teams) {
      results[id] = team.scale(level);
    }
    return { level, teams: results };
  }

  totalFcpr() {
    let total = 0;
    for (const team of this.teams.values()) total += team.engine.fcpr();
    return total;
  }

  totalTokens() {
    let total = 0;
    for (const team of this.teams.values()) total += team.engine.totalTokens;
    return total;
  }

  totalBoxes() {
    let total = 0;
    for (const team of this.teams.values()) total += team.generator.totalMinted;
    return total;
  }

  status() {
    const teamsStatus = {};
    for (const [id, team] of this.teams) {
      teamsStatus[id] = team.status();
    }
    return {
      code: 'AID',
      name: 'AI Division',
      version: '1.0.0',
      ring: 'Sovereign',
      booted: this.booted,
      globalBeat: this.globalBeat,
      teamCount: this.teams.size,
      totalTokens: this.totalTokens(),
      totalBoxes: this.totalBoxes(),
      totalFcpr: Math.round(this.totalFcpr() * 1e4) / 1e4,
      heartbeatMs: HEARTBEAT_MS,
      teams: teamsStatus,
      uptimeMs: Date.now() - this.bootTime,
    };
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  PHI,
  PHI_INV,
  HEARTBEAT_MS,
  HEARTBEAT_HZ,
  MIN_SLOTS,
  TEAM_ROLES,
  SCALING_LEVELS,
  fibonacci,
  FibonacciScaler,
  CycleEngine,
  BlockBoxGenerator,
  AITeam,
  AutonomousDivisionProtocol,
};
