// sovereign_cycle.rs — The Sovereign Cycle Engine  (Medina)
//
// Author : Medina
// Version: 1.0.0
// Ring   : Sovereign Ring
// Code   : SVC
// Latin  : Circulus Imperatus — The Commanded Circle
//
// The organism's self-generated heartbeat: 873ms per beat, N=16 parallel
// cognitive slots, PHX-sealed compound chain, Fibonacci kernel compression,
// Kuramoto synchronisation.
//
// No external compute purchased.  No cycles requested.  The organism beats.

use crate::phi_math::{self, PHI_INV, HEARTBEAT_MS};

/// Heartbeat frequency in Hz.
pub const HEARTBEAT_HZ: f64 = 1000.0 / HEARTBEAT_MS as f64;

/// Minimum cognitive slots per beat.
pub const MIN_SLOTS: usize = 16;

/// Sovereign decision record bytes at N=16.
pub const RECORD_BYTES_N16: usize = 1568;

/// Kuramoto synchronisation threshold = 1/φ ≈ 0.618.
pub const SYNC_THRESHOLD: f64 = PHI_INV;

// ── Fibonacci check ───────────────────────────────────────────────────────────

/// Return true if `n` is a Fibonacci number (O(1) perfect-square test).
#[must_use]
pub fn is_fibonacci(n: u64) -> bool {
    fn is_perfect_sq(x: u64) -> bool {
        let s = (x as f64).sqrt() as u64;
        // check s-1, s, s+1 to handle floating-point edge cases
        for &c in &[s.saturating_sub(1), s, s + 1] {
            if c.checked_mul(c) == Some(x) {
                return true;
            }
        }
        false
    }
    let five_n_sq = 5u64.saturating_mul(n).saturating_mul(n);
    is_perfect_sq(five_n_sq.saturating_add(4)) || is_perfect_sq(five_n_sq.saturating_sub(4))
}

// ── FCPR (Full Cognitive Processing Rate) ─────────────────────────────────────

/// Compute the Full Cognitive Processing Rate (decisions per second).
#[inline]
#[must_use]
pub fn fcpr(slots: usize) -> f64 {
    slots as f64 * HEARTBEAT_HZ
}

/// Compute the record size in bytes for a given slot count.
///
/// `N×32 (slot tokens) + (N-1)×64 (microtokens) + 32 (root) + 32 (seal)`
#[inline]
#[must_use]
pub fn record_bytes(slots: usize) -> usize {
    slots * 32 + slots.saturating_sub(1) * 64 + 32 + 32
}

/// Chain growth rate in bytes per second.
#[inline]
#[must_use]
pub fn chain_growth_bps(slots: usize) -> f64 {
    record_bytes(slots) as f64 * HEARTBEAT_HZ
}

// ── Fibonacci Kernel ──────────────────────────────────────────────────────────

/// Fibonacci kernel compression state.
///
/// Bundles at Fibonacci-indexed beats are preserved verbatim (32-byte seal).
/// All other bundles are crystallised into a single rolling hash.
/// Memory grows O(log_φ(beat)), not O(beat).
#[derive(Debug, Clone)]
pub struct FibonacciKernel {
    /// Preserved Fibonacci-indexed seals: (beat, seal).
    preserved: Vec<(u64, [u8; 32])>,
    /// Crystallised non-Fibonacci hash.
    crystal: Option<[u8; 32]>,
    /// Count of crystallised bundles.
    crystal_count: u64,
}

impl FibonacciKernel {
    /// Create a new empty kernel.
    #[must_use]
    pub fn new() -> Self {
        Self {
            preserved: Vec::new(),
            crystal: None,
            crystal_count: 0,
        }
    }

    /// Ingest a bundle seal at a given beat.
    pub fn ingest(&mut self, beat: u64, seal: [u8; 32]) {
        if is_fibonacci(beat) {
            self.preserved.push((beat, seal));
        } else {
            match self.crystal {
                None => self.crystal = Some(seal),
                Some(prev) => {
                    let mut combined = [0u8; 64];
                    combined[..32].copy_from_slice(&prev);
                    combined[32..].copy_from_slice(&seal);
                    // BLAKE3 fold
                    self.crystal = Some(*blake3::hash(&combined).as_bytes());
                }
            }
            self.crystal_count += 1;
        }
    }

    /// Number of preserved Fibonacci seals.
    #[must_use]
    pub fn preserved_count(&self) -> usize {
        self.preserved.len()
    }

    /// Number of crystallised non-Fibonacci bundles.
    #[must_use]
    pub fn crystal_count(&self) -> u64 {
        self.crystal_count
    }

    /// Total beats ingested.
    #[must_use]
    pub fn total_ingested(&self) -> u64 {
        self.preserved.len() as u64 + self.crystal_count
    }

    /// Total memory used by the kernel in bytes.
    #[must_use]
    pub fn size_bytes(&self) -> usize {
        self.preserved.len() * 32 + if self.crystal.is_some() { 32 } else { 0 }
    }
}

impl Default for FibonacciKernel {
    fn default() -> Self {
        Self::new()
    }
}

// ── Sovereign Cycle Status ───────────────────────────────────────────────────

/// Status snapshot of the Sovereign Cycle engine.
#[derive(Debug, Clone)]
pub struct CycleStatus {
    pub beat: u64,
    pub slots: usize,
    pub heartbeat_ms: u64,
    pub fcpr_dps: f64,
    pub record_bytes_per_beat: usize,
    pub chain_growth_bps: f64,
    pub kuramoto_r: f64,
    pub synchronised: bool,
    pub kernel_preserved: usize,
    pub kernel_crystallised: u64,
    pub kernel_size_bytes: usize,
}

/// Compute a full cycle status snapshot.
#[must_use]
pub fn cycle_status(
    beat: u64,
    slots: usize,
    kuramoto_phases: &[f64],
) -> CycleStatus {
    let r = phi_math::kuramoto_order(kuramoto_phases);
    CycleStatus {
        beat,
        slots,
        heartbeat_ms: HEARTBEAT_MS,
        fcpr_dps: fcpr(slots),
        record_bytes_per_beat: record_bytes(slots),
        chain_growth_bps: chain_growth_bps(slots),
        kuramoto_r: r,
        synchronised: r >= SYNC_THRESHOLD,
        kernel_preserved: 0,
        kernel_crystallised: 0,
        kernel_size_bytes: 0,
    }
}

/// Return true if the organism is synchronised (R ≥ φ⁻¹).
#[inline]
#[must_use]
pub fn is_synchronised(kuramoto_r: f64) -> bool {
    kuramoto_r >= SYNC_THRESHOLD
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fibonacci_check() {
        // First several Fibonacci numbers
        let fibs = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
        for &f in &fibs {
            assert!(is_fibonacci(f), "{f} should be Fibonacci");
        }
        // Non-Fibonacci
        for &nf in &[4u64, 6, 7, 9, 10, 11, 12, 14, 15] {
            assert!(!is_fibonacci(nf), "{nf} should not be Fibonacci");
        }
    }

    #[test]
    fn fcpr_n16() {
        let rate = fcpr(16);
        // 16 × (1000/873) ≈ 18.33
        assert!(rate > 18.0 && rate < 19.0);
    }

    #[test]
    fn record_bytes_n16() {
        // 16×32 + 15×64 + 32 + 32 = 512 + 960 + 64 = 1536
        assert_eq!(record_bytes(16), 1536);
    }

    #[test]
    fn fibonacci_kernel_compression() {
        let mut kernel = FibonacciKernel::new();
        for beat in 0..100u64 {
            kernel.ingest(beat, [beat as u8; 32]);
        }
        // Should have preserved only Fibonacci-indexed beats
        // Fibonacci numbers ≤ 99: 0,1,2,3,5,8,13,21,34,55,89 = 11
        // But 1 appears twice in Fibonacci sequence, kernel sees beat=1 once
        assert!(kernel.preserved_count() <= 12);
        assert!(kernel.crystal_count() > 80);
        // Kernel size should be much less than 100 × 32
        assert!(kernel.size_bytes() < 100 * 32);
    }

    #[test]
    fn sync_threshold() {
        assert!(is_synchronised(0.62));
        assert!(!is_synchronised(0.5));
        assert!(is_synchronised(PHI_INV));
    }

    #[test]
    fn chain_growth_positive() {
        assert!(chain_growth_bps(16) > 0.0);
    }

    #[test]
    fn cycle_status_snapshot() {
        let phases = vec![0.0f64; 4];
        let status = cycle_status(42, 16, &phases);
        assert_eq!(status.beat, 42);
        assert_eq!(status.slots, 16);
        assert!(status.synchronised);
    }
}
