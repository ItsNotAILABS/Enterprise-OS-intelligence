// ai_division.rs — Autonomous AI Division Engine  (Medina)
//
// Author : Medina
// Version: 1.0.0
// Ring   : Sovereign Ring
// Code   : AID
// Latin  : Divisio Intelligentiae — The Division of Intelligence
//
// Rust-native AI division: team registry, autonomous cycle engines,
// bronze block box factory, Fibonacci scaling.
//
// Each team generates its own cycles.  Each engine mints its own tokens.
// No team depends on another team's clock.  Fibonacci growth to 50,000.

use crate::phi_math::{HEARTBEAT_MS, phi_hash};

/// Heartbeat frequency in Hz.
pub const HEARTBEAT_HZ: f64 = 1000.0 / HEARTBEAT_MS as f64;

/// Minimum cognitive slots per engine.
pub const MIN_SLOTS: usize = 16;

// ── Fibonacci scaling ─────────────────────────────────────────────────────────

/// Return the n-th Fibonacci number.
#[must_use]
pub fn fibonacci(n: usize) -> u64 {
    if n == 0 { return 0; }
    if n == 1 { return 1; }
    let (mut a, mut b) = (0u64, 1u64);
    for _ in 2..=n {
        let c = a.saturating_add(b);
        a = b;
        b = c;
    }
    b
}

/// Scaling level definition.
#[derive(Debug, Clone)]
pub struct ScalingLevel {
    pub level: usize,
    pub fib_index: usize,
    pub capacity: u64,
    pub name: &'static str,
}

/// The six Fibonacci scaling levels (0 → ~50,000).
pub const SCALING_LEVELS: [ScalingLevel; 6] = [
    ScalingLevel { level: 0, fib_index: 0,  capacity: 0,     name: "genesis" },
    ScalingLevel { level: 1, fib_index: 1,  capacity: 1,     name: "seed" },
    ScalingLevel { level: 2, fib_index: 7,  capacity: 13,    name: "micro" },
    ScalingLevel { level: 3, fib_index: 12, capacity: 144,   name: "school" },
    ScalingLevel { level: 4, fib_index: 20, capacity: 6765,  name: "department" },
    ScalingLevel { level: 5, fib_index: 24, capacity: 46368, name: "institution" },
];

/// Fibonacci scaler state.
#[derive(Debug, Clone)]
pub struct FibonacciScaler {
    pub level: usize,
    pub capacity: u64,
}

impl FibonacciScaler {
    #[must_use]
    pub fn new() -> Self {
        Self { level: 0, capacity: 0 }
    }

    /// Scale to a given level (0–5).
    pub fn scale_to(&mut self, level: usize) -> &ScalingLevel {
        assert!(level < SCALING_LEVELS.len(), "Level out of range");
        let entry = &SCALING_LEVELS[level];
        self.level = level;
        self.capacity = entry.capacity;
        entry
    }
}

impl Default for FibonacciScaler {
    fn default() -> Self { Self::new() }
}

// ── Team roles ────────────────────────────────────────────────────────────────

/// AI team roles within the division.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TeamRole {
    Sovereign,
    Intelligence,
    Frontend,
    Backend,
    Education,
}

impl TeamRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            TeamRole::Sovereign    => "sovereign",
            TeamRole::Intelligence => "intelligence",
            TeamRole::Frontend     => "frontend",
            TeamRole::Backend      => "backend",
            TeamRole::Education    => "education",
        }
    }

    pub fn all() -> &'static [TeamRole] {
        &[
            TeamRole::Sovereign,
            TeamRole::Intelligence,
            TeamRole::Frontend,
            TeamRole::Backend,
            TeamRole::Education,
        ]
    }
}

// ── Cycle Token ───────────────────────────────────────────────────────────────

/// A pre-packed autonomous cycle token.
#[derive(Debug, Clone)]
pub struct CycleToken {
    pub engine_id: String,
    pub team_role: TeamRole,
    pub beat: u64,
    pub slot: usize,
    pub phx_hash: u32,     // phi-resonance hash of the token
    pub autonomous: bool,  // always true
}

// ── Cycle Engine ──────────────────────────────────────────────────────────────

/// Autonomous cycle engine — generates its own 873ms cycles.
#[derive(Debug, Clone)]
pub struct CycleEngine {
    pub engine_id: String,
    pub team_role: TeamRole,
    pub slots: usize,
    pub beat: u64,
    pub total_tokens: u64,
}

impl CycleEngine {
    #[must_use]
    pub fn new(engine_id: &str, team_role: TeamRole, slots: usize) -> Self {
        Self {
            engine_id: engine_id.to_string(),
            team_role,
            slots: slots.max(1),
            beat: 0,
            total_tokens: 0,
        }
    }

    /// Execute one cycle — generate pre-packed tokens for all slots.
    pub fn tick(&mut self) -> Vec<CycleToken> {
        let mut tokens = Vec::with_capacity(self.slots);
        for slot in 0..self.slots {
            let input = format!("{}:{}:{}", self.engine_id, self.beat, slot);
            let hash = phi_hash(input.as_bytes());
            tokens.push(CycleToken {
                engine_id: self.engine_id.clone(),
                team_role: self.team_role,
                beat: self.beat,
                slot,
                phx_hash: hash,
                autonomous: true,
            });
        }
        self.total_tokens += self.slots as u64;
        self.beat += 1;
        tokens
    }

    /// Full Cognitive Processing Rate for this engine.
    #[must_use]
    pub fn fcpr(&self) -> f64 {
        self.slots as f64 * HEARTBEAT_HZ
    }
}

// ── Bronze Block Box ──────────────────────────────────────────────────────────

/// A bronze-tier block box (QFB canister) minted by AI engines.
#[derive(Debug, Clone)]
pub struct BronzeBlockBox {
    pub box_id: u64,
    pub tier: &'static str,
    pub phx_hash: u32,
    pub minted_by: String,
    pub team_role: TeamRole,
    pub beat: u64,
}

/// Block box generator — mints bronze QFBs autonomously.
#[derive(Debug, Clone)]
pub struct BlockBoxGenerator {
    pub generator_id: String,
    pub team_role: TeamRole,
    pub total_minted: u64,
    beat: u64,
}

impl BlockBoxGenerator {
    #[must_use]
    pub fn new(generator_id: &str, team_role: TeamRole) -> Self {
        Self {
            generator_id: generator_id.to_string(),
            team_role,
            total_minted: 0,
            beat: 0,
        }
    }

    /// Mint a bronze block box.
    pub fn mint(&mut self, payload: &[u8]) -> BronzeBlockBox {
        let hash = phi_hash(payload);
        let box_id = self.beat;
        self.beat += 1;
        self.total_minted += 1;
        BronzeBlockBox {
            box_id,
            tier: "bronze",
            phx_hash: hash,
            minted_by: self.generator_id.clone(),
            team_role: self.team_role,
            beat: box_id,
        }
    }
}

// ── AI Team ───────────────────────────────────────────────────────────────────

/// An autonomous AI team within the division.
#[derive(Debug, Clone)]
pub struct AITeam {
    pub team_id: String,
    pub role: TeamRole,
    pub engine: CycleEngine,
    pub generator: BlockBoxGenerator,
    pub scaler: FibonacciScaler,
}

impl AITeam {
    #[must_use]
    pub fn new(role: TeamRole, slots: usize) -> Self {
        let team_id = format!("team-{}", role.as_str());
        Self {
            engine: CycleEngine::new(
                &format!("engine-{}", role.as_str()),
                role,
                slots,
            ),
            generator: BlockBoxGenerator::new(
                &format!("gen-{}", role.as_str()),
                role,
            ),
            scaler: FibonacciScaler::new(),
            team_id,
            role,
        }
    }

    /// Tick this team's cycle engine.
    pub fn tick(&mut self) -> Vec<CycleToken> {
        self.engine.tick()
    }

    /// Mint a bronze block box from this team.
    pub fn mint_blockbox(&mut self, payload: &[u8]) -> BronzeBlockBox {
        self.generator.mint(payload)
    }

    /// Scale this team to a Fibonacci level.
    pub fn scale(&mut self, level: usize) -> &ScalingLevel {
        self.scaler.scale_to(level)
    }
}

// ── Division Manager ──────────────────────────────────────────────────────────

/// Top-level AI Division manager.
#[derive(Debug, Clone)]
pub struct DivisionManager {
    pub teams: Vec<AITeam>,
    pub global_beat: u64,
    pub booted: bool,
}

impl DivisionManager {
    /// Create a new division (unbooted).
    #[must_use]
    pub fn new() -> Self {
        Self {
            teams: Vec::new(),
            global_beat: 0,
            booted: false,
        }
    }

    /// Boot the division — create all five core teams.
    pub fn boot(&mut self, slots: usize) {
        if self.booted { return; }
        for &role in TeamRole::all() {
            self.teams.push(AITeam::new(role, slots));
        }
        self.booted = true;
    }

    /// Tick all teams.
    pub fn tick_all(&mut self) -> u64 {
        for team in &mut self.teams {
            team.tick();
        }
        self.global_beat += 1;
        self.global_beat
    }

    /// Scale all teams to a Fibonacci level.
    pub fn scale_all(&mut self, level: usize) {
        for team in &mut self.teams {
            team.scale(level);
        }
    }

    /// Total FCPR across all teams.
    #[must_use]
    pub fn total_fcpr(&self) -> f64 {
        self.teams.iter().map(|t| t.engine.fcpr()).sum()
    }

    /// Total tokens generated across all teams.
    #[must_use]
    pub fn total_tokens(&self) -> u64 {
        self.teams.iter().map(|t| t.engine.total_tokens).sum()
    }

    /// Total block boxes minted across all teams.
    #[must_use]
    pub fn total_boxes(&self) -> u64 {
        self.teams.iter().map(|t| t.generator.total_minted).sum()
    }
}

impl Default for DivisionManager {
    fn default() -> Self { Self::new() }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fibonacci_values() {
        assert_eq!(fibonacci(0), 0);
        assert_eq!(fibonacci(1), 1);
        assert_eq!(fibonacci(7), 13);
        assert_eq!(fibonacci(12), 144);
        assert_eq!(fibonacci(20), 6765);
        assert_eq!(fibonacci(24), 46368);
    }

    #[test]
    fn scaler_levels() {
        let mut scaler = FibonacciScaler::new();
        let lvl = scaler.scale_to(5);
        assert_eq!(lvl.capacity, 46368);
        assert_eq!(scaler.capacity, 46368);
    }

    #[test]
    fn cycle_engine_tick() {
        let mut engine = CycleEngine::new("test-engine", TeamRole::Sovereign, 16);
        let tokens = engine.tick();
        assert_eq!(tokens.len(), 16);
        assert_eq!(engine.beat, 1);
        assert_eq!(engine.total_tokens, 16);
        assert!(tokens[0].autonomous);
    }

    #[test]
    fn blockbox_mint() {
        let mut gen = BlockBoxGenerator::new("test-gen", TeamRole::Education);
        let bbox = gen.mint(b"student-001");
        assert_eq!(bbox.tier, "bronze");
        assert_eq!(gen.total_minted, 1);
    }

    #[test]
    fn division_boot_and_tick() {
        let mut div = DivisionManager::new();
        div.boot(16);
        assert_eq!(div.teams.len(), 5);
        assert!(div.booted);

        let beat = div.tick_all();
        assert_eq!(beat, 1);
        assert_eq!(div.total_tokens(), 80); // 5 teams × 16 slots
    }

    #[test]
    fn division_scale() {
        let mut div = DivisionManager::new();
        div.boot(16);
        div.scale_all(5);
        for team in &div.teams {
            assert_eq!(team.scaler.capacity, 46368);
        }
    }

    #[test]
    fn division_fcpr() {
        let mut div = DivisionManager::new();
        div.boot(16);
        // 5 teams × 16 slots × HEARTBEAT_HZ
        let expected = 5.0 * 16.0 * HEARTBEAT_HZ;
        assert!((div.total_fcpr() - expected).abs() < 0.01);
    }

    #[test]
    fn team_mint_blockbox() {
        let mut team = AITeam::new(TeamRole::Education, 16);
        let bbox = team.mint_blockbox(b"student onboarding payload");
        assert_eq!(bbox.tier, "bronze");
        assert_eq!(team.generator.total_minted, 1);
    }
}
