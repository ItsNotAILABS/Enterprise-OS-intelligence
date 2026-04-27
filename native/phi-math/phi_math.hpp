/**
 * phi_math.hpp — Phi-Math Library
 *
 * High-performance C++ implementation of the golden-ratio (φ) mathematical
 * primitives used throughout the organism runtime:
 *
 *   - Phi-weighted scoring  S(m) = φ^(4−priority) × capability × reputation
 *   - Phi-coordinate generation for spatial memory addressing
 *   - Phi-resonance decay for adaptive routing and memory lineage
 *   - Fibonacci/Lucas sequence generation
 *   - Kuramoto oscillator synchronisation (cross-organism resonance)
 *
 * All functions are constexpr or inline where possible for zero-overhead
 * integration into the organism kernel executor.
 *
 * Ring: Sovereign Ring | Native Layer
 */

#pragma once

#include <cmath>
#include <cstddef>
#include <cstdint>
#include <array>
#include <vector>
#include <stdexcept>

namespace phi {

// ── Constants ────────────────────────────────────────────────────────────────

/// Golden ratio φ = (1 + √5) / 2
inline constexpr double PHI         = 1.6180339887498948482;
/// Golden angle in radians  2π(1 − 1/φ)
inline constexpr double GOLDEN_ANGLE = 2.3999632297286530000;
/// Organism heartbeat interval in milliseconds
inline constexpr int    HEARTBEAT_MS = 873;
/// Reciprocal of φ (= φ − 1)
inline constexpr double PHI_INV      = 0.6180339887498948482;

// ── Phi-Weighted Score ────────────────────────────────────────────────────────

/**
 * Compute the phi-weighted routing score for a model.
 *
 * Formula: S = φ^(4 - priority) × capability × reputation
 *
 * @param priority    Integer priority 0 (LOW) … 3 (CRITICAL)
 * @param capability  Task-type capability score in [0, 1]
 * @param reputation  Adaptive reputation in [0, 1]
 * @return Routing score ≥ 0
 */
[[nodiscard]] inline double
phi_score(int priority, double capability, double reputation) noexcept {
    return std::pow(PHI, 4.0 - static_cast<double>(priority))
         * capability * reputation;
}

/**
 * Phi-weighted exponential moving average (EMA) update.
 * alpha = 1/φ ≈ 0.618
 *
 * new_value = alpha × observation + (1 − alpha) × old_value
 */
[[nodiscard]] inline double
phi_ema(double old_value, double observation) noexcept {
    return PHI_INV * observation + (1.0 - PHI_INV) * old_value;
}

/**
 * Phi-decay: reduce a value by φ^steps.
 * Used for cascade fallback scoring in SovereignRoutingProtocol.
 */
[[nodiscard]] inline double
phi_decay(double value, int steps) noexcept {
    return value / std::pow(PHI, static_cast<double>(steps));
}

// ── Phi Coordinates (5-axis spatial memory) ───────────────────────────────────

/**
 * Five-axis spatial coordinate for SpatialMemoryStore.
 */
struct PhiCoord {
    double theta;  ///< azimuth angle (radians)
    double phi;    ///< polar angle (radians)
    double rho;    ///< radial distance
    int    ring;   ///< concentric ring index [0, ringCount)
    int    beat;   ///< temporal beat slot [0, beatResolution)
};

/**
 * Generate a PhiCoord from a flat index using phyllotaxis spiral.
 *
 * @param n           Memory index (≥ 0)
 * @param ring_count  Number of concentric rings (default 7)
 * @param beat_res    Beat resolution per ring (default 64)
 * @return            Spatial coordinate
 */
[[nodiscard]] inline PhiCoord
phi_coordinate(std::size_t n,
               int ring_count  = 7,
               int beat_res    = 64) noexcept {
    const double r     = std::sqrt(static_cast<double>(n) + 1.0);
    const double angle = static_cast<double>(n) * GOLDEN_ANGLE;
    const int    ring  = static_cast<int>(r) % ring_count;
    const int    beat  = static_cast<int>(
        static_cast<double>(n) * PHI) % beat_res;
    return {
        angle,                         // theta
        angle / PHI,                   // phi  (golden ratio scaled)
        r,                             // rho
        ring,
        beat,
    };
}

/**
 * Euclidean distance between two PhiCoords in (θ, φ, ρ) space.
 */
[[nodiscard]] inline double
phi_distance(const PhiCoord& a, const PhiCoord& b) noexcept {
    const double dt = a.theta - b.theta;
    const double dp = a.phi   - b.phi;
    const double dr = a.rho   - b.rho;
    return std::sqrt(dt*dt + dp*dp + dr*dr);
}

// ── Fibonacci / Lucas Sequences ────────────────────────────────────────────────

/**
 * Return the first N Fibonacci numbers (F(0)=0, F(1)=1, …).
 */
[[nodiscard]] inline std::vector<uint64_t>
fibonacci(std::size_t n) {
    if (n == 0) return {};
    std::vector<uint64_t> seq(n);
    seq[0] = 0;
    if (n > 1) seq[1] = 1;
    for (std::size_t i = 2; i < n; ++i)
        seq[i] = seq[i-1] + seq[i-2];
    return seq;
}

/**
 * Return the first N Lucas numbers (L(0)=2, L(1)=1, …).
 */
[[nodiscard]] inline std::vector<uint64_t>
lucas(std::size_t n) {
    if (n == 0) return {};
    std::vector<uint64_t> seq(n);
    seq[0] = 2;
    if (n > 1) seq[1] = 1;
    for (std::size_t i = 2; i < n; ++i)
        seq[i] = seq[i-1] + seq[i-2];
    return seq;
}

// ── Kuramoto Oscillator (cross-organism resonance) ────────────────────────────

/**
 * Advance a set of Kuramoto oscillators by one time step.
 *
 * Each oscillator has a natural frequency ω_i and phase θ_i.
 * The coupling term drives synchronisation via:
 *   dθ_i/dt = ω_i + (K/N) Σ_j sin(θ_j − θ_i)
 *
 * @param phases      Phase vector (radians) — updated in place
 * @param freqs       Natural frequency vector (rad/s)
 * @param coupling    Coupling constant K
 * @param dt          Time step (seconds) — default 0.873 (heartbeat in s)
 */
inline void
kuramoto_step(std::vector<double>& phases,
              const std::vector<double>& freqs,
              double coupling,
              double dt = 0.873) {
    const std::size_t N = phases.size();
    if (N == 0 || freqs.size() != N)
        throw std::invalid_argument("phases and freqs must have the same non-zero size");

    std::vector<double> dphi(N, 0.0);
    for (std::size_t i = 0; i < N; ++i) {
        double interaction = 0.0;
        for (std::size_t j = 0; j < N; ++j)
            interaction += std::sin(phases[j] - phases[i]);
        dphi[i] = freqs[i] + (coupling / static_cast<double>(N)) * interaction;
    }
    for (std::size_t i = 0; i < N; ++i)
        phases[i] += dphi[i] * dt;
}

/**
 * Compute the Kuramoto order parameter r ∈ [0, 1].
 * r ≈ 1 → full synchronisation; r ≈ 0 → incoherence.
 */
[[nodiscard]] inline double
kuramoto_order(const std::vector<double>& phases) noexcept {
    if (phases.empty()) return 0.0;
    double re = 0.0, im = 0.0;
    for (const double theta : phases) {
        re += std::cos(theta);
        im += std::sin(theta);
    }
    const double N = static_cast<double>(phases.size());
    return std::sqrt((re/N)*(re/N) + (im/N)*(im/N));
}

// ── Phi-Resonance Hash ────────────────────────────────────────────────────────

/**
 * Lightweight phi-resonance hash for memory record integrity.
 * Maps an arbitrary-length string to a 32-bit deterministic value.
 *
 * Uses the same algorithm as SpatialMemoryStore._hash in JS.
 */
[[nodiscard]] inline uint32_t
phi_hash(const char* data, std::size_t len) noexcept {
    int32_t h = 0;
    for (std::size_t i = 0; i < len; ++i) {
        h = ((h << 5) - h + static_cast<unsigned char>(data[i]));
    }
    return static_cast<uint32_t>(h);
}

[[nodiscard]] inline uint32_t
phi_hash(const std::string& s) noexcept {
    return phi_hash(s.data(), s.size());
}

} // namespace phi
