// phi_math.rs — Phi-Math Primitives
//
// High-performance Rust implementation of the golden-ratio (φ) primitives
// used throughout the organism runtime.
//
//   • phi_score(priority, capability, reputation)  → f64
//   • phi_ema(old, observation)                    → f64
//   • phi_decay(value, steps)                       → f64
//   • phi_coordinate(n)                             → PhiCoord
//   • fibonacci(n)                                  → Vec<u64>
//   • lucas(n)                                      → Vec<u64>
//   • kuramoto_step(&mut phases, freqs, K, dt)
//   • kuramoto_order(&phases)                       → f64
//   • phi_hash(data)                                → u32
//
// Ring: Sovereign Ring | Rust Native Layer

/// Golden ratio φ = (1 + √5) / 2
pub const PHI: f64 = 1.618_033_988_749_895;
/// Reciprocal 1/φ
pub const PHI_INV: f64 = 0.618_033_988_749_895;
/// Golden angle in radians
pub const GOLDEN_ANGLE: f64 = 2.399_963_229_728_653;
/// Organism heartbeat interval in ms
pub const HEARTBEAT_MS: u64 = 873;

// ── Phi-weighted score ────────────────────────────────────────────────────────

/// Compute the phi-weighted routing score.
///
/// `S = φ^(4 − priority) × capability × reputation`
///
/// * `priority`    — 0 (LOW) … 3 (CRITICAL)
/// * `capability`  — task-type capability in \[0, 1\]
/// * `reputation`  — adaptive reputation in \[0, 1\]
#[inline]
#[must_use]
pub fn phi_score(priority: i32, capability: f64, reputation: f64) -> f64 {
    PHI.powi(4 - priority) * capability * reputation
}

/// Phi-exponential moving average.  alpha = 1/φ ≈ 0.618
#[inline]
#[must_use]
pub fn phi_ema(old_value: f64, observation: f64) -> f64 {
    PHI_INV * observation + (1.0 - PHI_INV) * old_value
}

/// Phi-decay: divide a value by φ^steps.
#[inline]
#[must_use]
pub fn phi_decay(value: f64, steps: u32) -> f64 {
    value / PHI.powi(steps as i32)
}

// ── Phi coordinate (5-axis spatial memory) ────────────────────────────────────

/// Five-axis spatial coordinate for the organism's spatial memory store.
#[derive(Debug, Clone, PartialEq)]
pub struct PhiCoord {
    pub theta: f64,
    pub phi:   f64,
    pub rho:   f64,
    pub ring:  usize,
    pub beat:  usize,
}

/// Generate a PhiCoord from a flat index using phyllotaxis spiral.
#[must_use]
pub fn phi_coordinate(n: usize, ring_count: usize, beat_res: usize) -> PhiCoord {
    let ring_count = if ring_count == 0 { 7 } else { ring_count };
    let beat_res   = if beat_res   == 0 { 64 } else { beat_res };
    let rho   = ((n + 1) as f64).sqrt();
    let theta = n as f64 * GOLDEN_ANGLE;
    PhiCoord {
        theta,
        phi:  theta / PHI,
        rho,
        ring: (rho as usize) % ring_count,
        beat: ((n as f64 * PHI) as usize) % beat_res,
    }
}

/// Euclidean distance between two PhiCoords in (θ, φ, ρ) space.
#[must_use]
pub fn phi_distance(a: &PhiCoord, b: &PhiCoord) -> f64 {
    let dt = a.theta - b.theta;
    let dp = a.phi   - b.phi;
    let dr = a.rho   - b.rho;
    (dt * dt + dp * dp + dr * dr).sqrt()
}

// ── Fibonacci / Lucas ─────────────────────────────────────────────────────────

/// Return the first `n` Fibonacci numbers (F(0)=0, F(1)=1, …).
#[must_use]
pub fn fibonacci(n: usize) -> Vec<u64> {
    if n == 0 { return vec![]; }
    let mut seq = vec![0u64; n];
    if n > 1 { seq[1] = 1; }
    for i in 2..n {
        seq[i] = seq[i - 1].saturating_add(seq[i - 2]);
    }
    seq
}

/// Return the first `n` Lucas numbers (L(0)=2, L(1)=1, …).
#[must_use]
pub fn lucas(n: usize) -> Vec<u64> {
    if n == 0 { return vec![]; }
    let mut seq = vec![0u64; n];
    seq[0] = 2;
    if n > 1 { seq[1] = 1; }
    for i in 2..n {
        seq[i] = seq[i - 1].saturating_add(seq[i - 2]);
    }
    seq
}

// ── Kuramoto oscillator ───────────────────────────────────────────────────────

/// Advance Kuramoto oscillators by one time step.
///
/// `dθ_i/dt = ω_i + (K/N) Σ_j sin(θ_j − θ_i)`
///
/// * `phases`   — phase vector (radians), updated in place
/// * `freqs`    — natural frequency vector (rad/s)
/// * `coupling` — coupling constant K
/// * `dt`       — time step in seconds (default 0.873 s)
pub fn kuramoto_step(phases: &mut [f64], freqs: &[f64], coupling: f64, dt: f64) {
    assert_eq!(phases.len(), freqs.len(), "phases and freqs must have equal length");
    let n = phases.len() as f64;
    let deltas: Vec<f64> = phases
        .iter()
        .zip(freqs.iter())
        .map(|(&theta_i, &omega_i)| {
            let interaction: f64 = phases.iter().map(|&theta_j| (theta_j - theta_i).sin()).sum();
            omega_i + (coupling / n) * interaction
        })
        .collect();
    for (theta, d) in phases.iter_mut().zip(deltas.iter()) {
        *theta += d * dt;
    }
}

/// Compute the Kuramoto order parameter r ∈ \[0, 1\].
/// r ≈ 1 → full synchronisation; r ≈ 0 → incoherence.
#[must_use]
pub fn kuramoto_order(phases: &[f64]) -> f64 {
    if phases.is_empty() { return 0.0; }
    let (re, im): (f64, f64) = phases.iter().fold((0.0, 0.0), |(re, im), &theta| {
        (re + theta.cos(), im + theta.sin())
    });
    let n = phases.len() as f64;
    ((re / n).powi(2) + (im / n).powi(2)).sqrt()
}

// ── Phi-resonance hash ────────────────────────────────────────────────────────

/// Lightweight phi-resonance hash (non-cryptographic, same algorithm as JS).
#[must_use]
pub fn phi_hash(data: &[u8]) -> u32 {
    let mut h: i32 = 0;
    for &b in data {
        h = h.wrapping_shl(5).wrapping_sub(h).wrapping_add(b as i32);
    }
    h as u32
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn phi_score_positive() {
        assert!(phi_score(2, 0.85, 0.9) > 0.0);
    }

    #[test]
    fn phi_score_formula_consistent() {
        // phi_score uses φ^(4-priority). With LOW=0 and CRITICAL=3:
        //   LOW:      φ^4 ≈ 6.854
        //   CRITICAL: φ^1 ≈ 1.618
        // The multiplier is identical for all models in the same task,
        // so priority only scales absolute scores, not the model ordering.
        let low_score  = phi_score(0, 1.0, 1.0);
        let crit_score = phi_score(3, 1.0, 1.0);
        // Both must be positive
        assert!(low_score > 0.0);
        assert!(crit_score > 0.0);
        // LOW exponent (4) > CRITICAL exponent (1), so low_score > crit_score
        assert!(low_score > crit_score, "phi^4 must exceed phi^1");
    }

    #[test]
    fn phi_ema_converges() {
        let mut v = 0.5f64;
        for _ in 0..200 { v = phi_ema(v, 1.0); }
        assert!((v - 1.0).abs() < 0.01);
    }

    #[test]
    fn phi_decay_decreases() {
        assert!(phi_decay(100.0, 1) < 100.0);
        assert!(phi_decay(100.0, 2) < phi_decay(100.0, 1));
    }

    #[test]
    fn fibonacci_first_ten() {
        let fib = fibonacci(10);
        assert_eq!(fib, vec![0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
    }

    #[test]
    fn lucas_first_five() {
        let l = lucas(5);
        assert_eq!(l[0], 2);
        assert_eq!(l[1], 1);
        assert_eq!(l[2], 3);
    }

    #[test]
    fn kuramoto_order_full_sync() {
        let phases = vec![0.0f64; 5];
        assert!((kuramoto_order(&phases) - 1.0).abs() < 1e-9);
    }

    #[test]
    fn kuramoto_step_changes_phases() {
        let mut phases = vec![0.0, 1.0, 2.0, 3.0];
        let freqs      = vec![1.0, 1.1, 0.9, 1.05];
        let before = phases.clone();
        kuramoto_step(&mut phases, &freqs, 2.0, 0.873);
        assert!(phases != before);
    }

    #[test]
    fn phi_coordinate_deterministic() {
        let a = phi_coordinate(5, 7, 64);
        let b = phi_coordinate(5, 7, 64);
        assert_eq!(a, b);
    }

    #[test]
    fn phi_hash_deterministic() {
        assert_eq!(phi_hash(b"hello"), phi_hash(b"hello"));
    }
}
