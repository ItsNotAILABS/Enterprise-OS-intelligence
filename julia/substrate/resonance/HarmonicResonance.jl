"""
    HarmonicResonance

RSHIP-2026-HARMONIC-RESONANCE-001

Harmonic analysis substrate for AGI frequency coupling.
Implements Fourier analysis, wavelet decomposition, and
resonance detection for distributed intelligence systems.

Mathematical Foundation:
- Fourier series: f(t) = a₀/2 + Σₙ(aₙcos(nωt) + bₙsin(nωt))
- Power spectral density: S(f) = |F{x(t)}|²
- Wavelet transform: W(a,b) = ∫x(t)ψ*((t-b)/a)dt
- Resonance condition: ω_drive ≈ ω_natural
"""

using LinearAlgebra
using Statistics
using Random

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

const PHI_HR = (1 + sqrt(5)) / 2
const SCHUMANN_HR = 7.83

# ═══════════════════════════════════════════════════════════════════════════════
# HARMONIC MODE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Harmonic mode representing a single frequency component.
"""
struct HarmonicMode
    frequency::Float64
    amplitude::Float64
    phase::Float64
    decay_rate::Float64  # For damped oscillations
end

HarmonicMode(f::Float64, a::Float64) = HarmonicMode(f, a, 0.0, 0.0)

"""
    evaluate(mode::HarmonicMode, t::Float64) -> Float64

Evaluate the harmonic mode at time t.
"""
function evaluate(mode::HarmonicMode, t::Float64)
    damping = exp(-mode.decay_rate * t)
    return damping * mode.amplitude * cos(2π * mode.frequency * t + mode.phase)
end

"""
    energy(mode::HarmonicMode) -> Float64

Compute energy of the harmonic mode (proportional to amplitude²).
"""
energy(mode::HarmonicMode) = 0.5 * mode.amplitude^2

# ═══════════════════════════════════════════════════════════════════════════════
# RESONANCE SPECTRUM
# ═══════════════════════════════════════════════════════════════════════════════

"""
Resonance spectrum containing multiple harmonic modes.
"""
mutable struct ResonanceSpectrum
    modes::Vector{HarmonicMode}
    fundamental::Float64
    sampling_rate::Float64
    quality_factor::Float64  # Q = f₀ / Δf (sharpness of resonance)
end

"""
    ResonanceSpectrum(fundamental::Float64; sampling_rate=1000.0, Q=10.0)

Create a resonance spectrum with given fundamental frequency.
"""
function ResonanceSpectrum(fundamental::Float64; sampling_rate::Float64=1000.0, Q::Float64=10.0)
    ResonanceSpectrum(HarmonicMode[], fundamental, sampling_rate, Q)
end

"""
    add_harmonic!(spectrum::ResonanceSpectrum, n::Int, amplitude::Float64; phase=0.0)

Add the nth harmonic to the spectrum.
"""
function add_harmonic!(spectrum::ResonanceSpectrum, n::Int, amplitude::Float64; phase::Float64=0.0)
    freq = n * spectrum.fundamental
    decay = spectrum.fundamental / (spectrum.quality_factor * n)  # Higher harmonics decay faster
    mode = HarmonicMode(freq, amplitude, phase, decay)
    push!(spectrum.modes, mode)
    return mode
end

"""
    generate_signal(spectrum::ResonanceSpectrum, duration::Float64) -> Vector{Float64}

Generate time-domain signal from spectrum.
"""
function generate_signal(spectrum::ResonanceSpectrum, duration::Float64)
    n_samples = Int(ceil(duration * spectrum.sampling_rate))
    dt = 1.0 / spectrum.sampling_rate
    t = collect(0:n_samples-1) .* dt
    
    signal = zeros(n_samples)
    for mode in spectrum.modes
        for i in 1:n_samples
            signal[i] += evaluate(mode, t[i])
        end
    end
    
    return signal
end

"""
    total_energy(spectrum::ResonanceSpectrum) -> Float64

Compute total energy in the spectrum.
"""
total_energy(spectrum::ResonanceSpectrum) = sum(energy(m) for m in spectrum.modes; init=0.0)

# ═══════════════════════════════════════════════════════════════════════════════
# FOURIER ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    dft(signal::Vector{Float64}) -> Vector{ComplexF64}

Compute Discrete Fourier Transform.
"""
function dft(signal::Vector{Float64})
    N = length(signal)
    X = zeros(ComplexF64, N)
    
    for k in 0:(N-1)
        for n in 0:(N-1)
            X[k+1] += signal[n+1] * exp(-2π * im * k * n / N)
        end
    end
    
    return X
end

"""
    idft(spectrum::Vector{ComplexF64}) -> Vector{Float64}

Compute Inverse Discrete Fourier Transform.
"""
function idft(spectrum::Vector{ComplexF64})
    N = length(spectrum)
    x = zeros(N)
    
    for n in 0:(N-1)
        for k in 0:(N-1)
            x[n+1] += real(spectrum[k+1] * exp(2π * im * k * n / N))
        end
        x[n+1] /= N
    end
    
    return x
end

"""
    power_spectrum(signal::Vector{Float64}, sampling_rate::Float64) -> Tuple{Vector{Float64}, Vector{Float64}}

Compute power spectral density.
Returns (frequencies, powers).
"""
function power_spectrum(signal::Vector{Float64}, sampling_rate::Float64)
    N = length(signal)
    X = dft(signal)
    
    # Power = |X|² / N²
    powers = (abs2.(X) ./ N^2)[1:N÷2+1]
    powers[2:end-1] .*= 2  # Account for negative frequencies
    
    frequencies = collect(0:N÷2) .* (sampling_rate / N)
    
    return (frequencies, powers)
end

"""
    find_peaks(powers::Vector{Float64}, frequencies::Vector{Float64}; threshold=0.01) -> Vector{NamedTuple}

Find spectral peaks above threshold.
"""
function find_peaks(powers::Vector{Float64}, frequencies::Vector{Float64}; threshold::Float64=0.01)
    peaks = NamedTuple{(:frequency, :power, :index), Tuple{Float64, Float64, Int}}[]
    max_power = maximum(powers)
    abs_threshold = threshold * max_power
    
    for i in 2:(length(powers)-1)
        if powers[i] > powers[i-1] && powers[i] > powers[i+1] && powers[i] > abs_threshold
            push!(peaks, (frequency=frequencies[i], power=powers[i], index=i))
        end
    end
    
    sort!(peaks, by=x -> x.power, rev=true)
    return peaks
end

# ═══════════════════════════════════════════════════════════════════════════════
# WAVELET ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

"""
Morlet wavelet for time-frequency analysis.
"""
struct MorletWavelet
    center_frequency::Float64
    bandwidth::Float64
end

MorletWavelet() = MorletWavelet(1.0, 1.0)

"""
    evaluate_wavelet(w::MorletWavelet, t::Float64, scale::Float64) -> ComplexF64

Evaluate Morlet wavelet: ψ(t) = exp(-t²/2σ²) * exp(iω₀t)
"""
function evaluate_wavelet(w::MorletWavelet, t::Float64, scale::Float64)
    σ = w.bandwidth * scale
    ω₀ = 2π * w.center_frequency / scale
    gaussian = exp(-t^2 / (2σ^2))
    oscillation = exp(im * ω₀ * t)
    return gaussian * oscillation / sqrt(scale)
end

"""
    cwt(signal::Vector{Float64}, scales::Vector{Float64}, wavelet::MorletWavelet) -> Matrix{ComplexF64}

Compute Continuous Wavelet Transform.
"""
function cwt(signal::Vector{Float64}, scales::Vector{Float64}, wavelet::MorletWavelet)
    N = length(signal)
    n_scales = length(scales)
    coefficients = zeros(ComplexF64, n_scales, N)
    
    for (si, scale) in enumerate(scales)
        for n in 1:N
            # Convolution with scaled wavelet
            for k in 1:N
                t = k - n
                ψ = evaluate_wavelet(wavelet, Float64(t), scale)
                coefficients[si, n] += signal[k] * conj(ψ)
            end
        end
    end
    
    return coefficients
end

"""
    scalogram(coefficients::Matrix{ComplexF64}) -> Matrix{Float64}

Compute scalogram (wavelet power spectrum).
"""
scalogram(coefficients::Matrix{ComplexF64}) = abs2.(coefficients)

# ═══════════════════════════════════════════════════════════════════════════════
# HARMONIC RESONATOR
# ═══════════════════════════════════════════════════════════════════════════════

"""
Harmonic resonator for frequency coupling and phase locking.
"""
mutable struct HarmonicResonator
    id::String
    natural_frequency::Float64
    damping::Float64
    position::Float64
    velocity::Float64
    coupled_resonators::Vector{Tuple{HarmonicResonator,Float64}}  # (resonator, coupling)
    history::Vector{NamedTuple{(:t, :x, :v), Tuple{Float64, Float64, Float64}}}
end

"""
    HarmonicResonator(id::String; frequency=SCHUMANN_HR, damping=0.1)

Create a harmonic resonator.
"""
function HarmonicResonator(id::String; frequency::Float64=SCHUMANN_HR, damping::Float64=0.1)
    HarmonicResonator(
        id,
        frequency,
        damping,
        0.0,
        1.0,  # Initial velocity for oscillation
        Tuple{HarmonicResonator,Float64}[],
        NamedTuple{(:t, :x, :v), Tuple{Float64, Float64, Float64}}[]
    )
end

"""
    couple_resonators!(r1::HarmonicResonator, r2::HarmonicResonator, strength::Float64)

Couple two resonators with given coupling strength.
"""
function couple_resonators!(r1::HarmonicResonator, r2::HarmonicResonator, strength::Float64)
    push!(r1.coupled_resonators, (r2, strength))
    push!(r2.coupled_resonators, (r1, strength))
end

"""
    step!(resonator::HarmonicResonator, dt::Float64, driving_force::Float64=0.0)

Advance resonator by one time step using velocity Verlet.

Equation of motion: ẍ + 2γẋ + ω₀²x = F(t) + Σ κᵢ(xᵢ - x)
"""
function step!(resonator::HarmonicResonator, dt::Float64, driving_force::Float64=0.0)
    ω₀ = 2π * resonator.natural_frequency
    γ = resonator.damping
    
    x, v = resonator.position, resonator.velocity
    
    # Coupling force from other resonators
    coupling_force = 0.0
    for (other, κ) in resonator.coupled_resonators
        coupling_force += κ * (other.position - x)
    end
    
    # Total force
    F = driving_force + coupling_force
    
    # Acceleration: a = F - 2γv - ω₀²x
    a = F - 2γ*v - ω₀^2*x
    
    # Velocity Verlet integration
    x_new = x + v*dt + 0.5*a*dt^2
    a_new = F - 2γ*v - ω₀^2*x_new  # Updated acceleration
    v_new = v + 0.5*(a + a_new)*dt
    
    resonator.position = x_new
    resonator.velocity = v_new
    
    # Record history
    t = isempty(resonator.history) ? 0.0 : resonator.history[end].t + dt
    push!(resonator.history, (t=t, x=x_new, v=v_new))
    
    return (x=x_new, v=v_new)
end

"""
    energy(resonator::HarmonicResonator) -> Float64

Compute total mechanical energy E = KE + PE.
"""
function energy(resonator::HarmonicResonator)
    ω₀ = 2π * resonator.natural_frequency
    KE = 0.5 * resonator.velocity^2
    PE = 0.5 * ω₀^2 * resonator.position^2
    return KE + PE
end

"""
    analyze_spectrum(resonator::HarmonicResonator; sampling_rate=1000.0) -> NamedTuple

Analyze frequency spectrum of resonator history.
"""
function analyze_spectrum(resonator::HarmonicResonator; sampling_rate::Float64=1000.0)
    if length(resonator.history) < 10
        return (fundamental=resonator.natural_frequency, peaks=[], quality_factor=0.0)
    end
    
    signal = [h.x for h in resonator.history]
    freqs, powers = power_spectrum(signal, sampling_rate)
    peaks = find_peaks(powers, freqs)
    
    # Find fundamental (highest power peak)
    fundamental = isempty(peaks) ? resonator.natural_frequency : peaks[1].frequency
    
    # Estimate quality factor from peak width
    Q = resonator.natural_frequency / (resonator.damping + eps())
    
    return (fundamental=fundamental, peaks=peaks, quality_factor=Q)
end

"""
    find_resonances(signal::Vector{Float64}, sampling_rate::Float64; threshold=0.1) -> Vector{Float64}

Find resonance frequencies in a signal.
"""
function find_resonances(signal::Vector{Float64}, sampling_rate::Float64; threshold::Float64=0.1)
    freqs, powers = power_spectrum(signal, sampling_rate)
    peaks = find_peaks(powers, freqs; threshold=threshold)
    return [p.frequency for p in peaks]
end

"""
    status(resonator::HarmonicResonator)

Get status of the harmonic resonator.
"""
function status(resonator::HarmonicResonator)
    return (
        id = resonator.id,
        natural_frequency = resonator.natural_frequency,
        damping = resonator.damping,
        position = resonator.position,
        velocity = resonator.velocity,
        energy = energy(resonator),
        coupled_count = length(resonator.coupled_resonators),
        history_length = length(resonator.history)
    )
end

# Export for module
export HarmonicMode, evaluate, energy
export ResonanceSpectrum, add_harmonic!, generate_signal, total_energy
export dft, idft, power_spectrum, find_peaks
export MorletWavelet, evaluate_wavelet, cwt, scalogram
export HarmonicResonator, couple_resonators!, step!, analyze_spectrum, find_resonances, status
