"""
    EmergenceEngine

RSHIP-2026-EMERGENCE-ENGINE-001

Phase transition detection and emergence analysis for AGI systems.
Implements order parameter dynamics, criticality detection, and 
φ-weighted emergence amplification.

Mathematical Foundation:
- Landau theory: F = a(T-Tc)m² + bm⁴ (free energy expansion)
- Scaling relations: m ~ |T-Tc|^β, χ ~ |T-Tc|^(-γ)
- Renormalization group flow for universality classes
- Ising model for binary order parameters
"""

using LinearAlgebra
using Statistics
using Random

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

const PHI_LOCAL = (1 + sqrt(5)) / 2

"""Phase states for emergence detection"""
@enum PhaseState begin
    SUBCRITICAL = 1
    CRITICAL = 2
    SUPERCRITICAL = 3
end

"""Emergence types"""
@enum EmergenceType begin
    WEAK = 1        # Predictable from components
    STRONG = 2      # Unpredictable, truly emergent
    PHASE_CRITICAL = 3  # At phase transition boundary
end

# ═══════════════════════════════════════════════════════════════════════════════
# ORDER PARAMETER
# ═══════════════════════════════════════════════════════════════════════════════

"""
Order parameter tracking for phase transitions.

The order parameter m characterizes the system's macroscopic state:
- m = 0 in disordered phase
- m ≠ 0 in ordered phase
- |∂m/∂T| → ∞ at critical point
"""
mutable struct OrderParameter
    dimensions::Int
    values::Vector{Float64}
    history::Vector{NamedTuple{(:values, :magnitude, :timestamp), Tuple{Vector{Float64}, Float64, Float64}}}
    max_history::Int
end

"""
    OrderParameter(dimensions::Int=1; max_history::Int=1000)

Create a new order parameter with specified dimensions.
"""
function OrderParameter(dimensions::Int=1; max_history::Int=1000)
    OrderParameter(
        dimensions,
        zeros(dimensions),
        NamedTuple{(:values, :magnitude, :timestamp), Tuple{Vector{Float64}, Float64, Float64}}[],
        max_history
    )
end

"""
    update_order_parameter!(op::OrderParameter, new_values::Vector{Float64})

Update the order parameter with new values.
"""
function update_order_parameter!(op::OrderParameter, new_values::Vector{Float64})
    @assert length(new_values) == op.dimensions "Dimension mismatch"
    
    op.values = new_values
    mag = norm(new_values)
    
    push!(op.history, (values=copy(new_values), magnitude=mag, timestamp=time()))
    
    if length(op.history) > op.max_history
        popfirst!(op.history)
    end
    
    return mag
end

"""
    magnitude(op::OrderParameter)

Compute the magnitude of the order parameter: |m| = √(Σ mᵢ²)
"""
function magnitude(op::OrderParameter)
    norm(op.values)
end

"""
    derivative(op::OrderParameter)

Compute the time derivative of the order parameter magnitude.
"""
function derivative(op::OrderParameter)
    if length(op.history) < 2
        return 0.0
    end
    
    recent = op.history[max(1, end-9):end]
    if length(recent) < 2
        return 0.0
    end
    
    dt = recent[end].timestamp - recent[1].timestamp
    dm = recent[end].magnitude - recent[1].magnitude
    
    return dt > 0 ? dm / dt : 0.0
end

"""
    get_susceptibility(op::OrderParameter)

Compute susceptibility χ = ∂⟨m⟩/∂h ≈ Var(m) near criticality.

High susceptibility indicates proximity to phase transition.
"""
function get_susceptibility(op::OrderParameter)
    if length(op.history) < 10
        return 0.0
    end
    
    mags = [h.magnitude for h in op.history[max(1, end-19):end]]
    μ = mean(mags)
    variance = var(mags, corrected=false)
    
    # φ-weighted susceptibility
    return variance * PHI_LOCAL
end

"""
    autocorrelation(op::OrderParameter, lag::Int=1)

Compute autocorrelation function C(τ) = ⟨m(t)m(t+τ)⟩ - ⟨m⟩².

Near criticality, C(τ) ~ τ^(-α) (power law decay).
"""
function autocorrelation(op::OrderParameter, lag::Int=1)
    if length(op.history) < lag + 10
        return 0.0
    end
    
    mags = [h.magnitude for h in op.history]
    n = length(mags) - lag
    μ = mean(mags)
    
    num = 0.0
    den = 0.0
    for i in 1:n
        num += (mags[i] - μ) * (mags[i + lag] - μ)
        den += (mags[i] - μ)^2
    end
    
    return den > 0 ? num / den : 0.0
end

# ═══════════════════════════════════════════════════════════════════════════════
# CRITICALITY DETECTOR
# ═══════════════════════════════════════════════════════════════════════════════

"""
Criticality detector for phase transition identification.

Monitors:
1. Susceptibility divergence: χ ~ |T-Tc|^(-γ)
2. Correlation length divergence: ξ ~ |T-Tc|^(-ν)
3. Critical slowing down: τ ~ |T-Tc|^(-zν)
"""
mutable struct CriticalityDetector
    order_parameter::OrderParameter
    critical_threshold::Float64
    state::PhaseState
    critical_exponent::Float64
    correlation_length::Float64
    relaxation_time::Float64
end

"""
    CriticalityDetector(; dimensions=1, threshold=0.1, exponent=0.5)

Create a criticality detector with specified parameters.
"""
function CriticalityDetector(; dimensions::Int=1, threshold::Float64=0.1, exponent::Float64=0.5)
    CriticalityDetector(
        OrderParameter(dimensions),
        threshold,
        SUBCRITICAL,
        exponent,
        1.0,
        1.0
    )
end

"""
    update!(detector::CriticalityDetector, values::Vector{Float64})

Update the detector with new order parameter values.
"""
function update!(detector::CriticalityDetector, values::Vector{Float64})
    update_order_parameter!(detector.order_parameter, values)
    _detect_phase_transition!(detector)
    return detector.state
end

"""
    _detect_phase_transition!(detector::CriticalityDetector)

Internal function to detect phase transitions.
"""
function _detect_phase_transition!(detector::CriticalityDetector)
    χ = get_susceptibility(detector.order_parameter)
    ρ = autocorrelation(detector.order_parameter)
    dm_dt = abs(derivative(detector.order_parameter))
    
    # Critical score combines susceptibility and correlation
    critical_score = (χ + abs(ρ)) / 2
    
    # Update correlation length estimate (ξ ~ χ^(1/γ))
    detector.correlation_length = max(1.0, χ^(1/1.75))  # γ ≈ 1.75 for 3D Ising
    
    # Update relaxation time (critical slowing down)
    detector.relaxation_time = max(1.0, χ^(1/detector.critical_exponent))
    
    # Phase classification
    m = magnitude(detector.order_parameter)
    
    if critical_score > 1.0 / detector.critical_threshold
        detector.state = CRITICAL
    elseif m > PHI_LOCAL
        detector.state = SUPERCRITICAL
    else
        detector.state = SUBCRITICAL
    end
end

"""
    scaling_exponent(detector::CriticalityDetector)

Estimate the critical scaling exponent β from: m ~ |T-Tc|^β
"""
function scaling_exponent(detector::CriticalityDetector)
    mags = [h.magnitude for h in detector.order_parameter.history[max(1, end-49):end]]
    
    if length(mags) < 10
        return detector.critical_exponent
    end
    
    # Filter positive values for log-log regression
    positive_mags = filter(m -> m > 0, mags)
    if length(positive_mags) < 5
        return detector.critical_exponent
    end
    
    log_mags = log.(positive_mags)
    n = length(log_mags)
    x = collect(1:n)
    
    # Linear regression in log-log space
    sum_x = sum(x)
    sum_y = sum(log_mags)
    sum_xy = sum(x .* log_mags)
    sum_x2 = sum(x .^ 2)
    
    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x^2)
    
    return abs(slope) > 0 ? abs(slope) : detector.critical_exponent
end

# ═══════════════════════════════════════════════════════════════════════════════
# EMERGENCE DETECTOR
# ═══════════════════════════════════════════════════════════════════════════════

"""
Emergence detector for collective behavior analysis.

Detects when system behavior cannot be predicted from component behavior:
E = H_system - Σ H_components
"""
mutable struct EmergenceDetector
    components::Dict{String,Vector{Float64}}
    emergence_threshold::Float64
    window_size::Int
    history::Vector{NamedTuple{(:emergence, :system_entropy, :timestamp), Tuple{Float64, Float64, Float64}}}
end

"""
    EmergenceDetector(; threshold=0.3, window=100)

Create an emergence detector.
"""
function EmergenceDetector(; threshold::Float64=0.3, window::Int=100)
    EmergenceDetector(
        Dict{String,Vector{Float64}}(),
        threshold,
        window,
        NamedTuple{(:emergence, :system_entropy, :timestamp), Tuple{Float64, Float64, Float64}}[]
    )
end

"""
    register_component!(detector::EmergenceDetector, id::String, initial_state::Vector{Float64})

Register a component for emergence monitoring.
"""
function register_component!(detector::EmergenceDetector, id::String, initial_state::Vector{Float64})
    detector.components[id] = initial_state
end

"""
    update_component!(detector::EmergenceDetector, id::String, state::Vector{Float64})

Update component state and check for emergence.
"""
function update_component!(detector::EmergenceDetector, id::String, state::Vector{Float64})
    if !haskey(detector.components, id)
        return (emergence=0.0, type=WEAK)
    end
    
    detector.components[id] = state
    return _detect_emergence!(detector)
end

"""
    _detect_emergence!(detector::EmergenceDetector)

Internal emergence detection using information-theoretic measures.
"""
function _detect_emergence!(detector::EmergenceDetector)
    if length(detector.components) < 2
        return (emergence=0.0, type=WEAK)
    end
    
    # System entropy (joint)
    all_states = vcat(values(detector.components)...)
    H_system = _entropy(all_states)
    
    # Sum of component entropies
    H_components = sum(_entropy(s) for s in values(detector.components))
    H_avg = H_components / length(detector.components)
    
    # Emergence = System entropy - Average component entropy
    # Positive means emergent properties exist
    emergence = H_system - H_avg
    
    # Record history
    push!(detector.history, (emergence=emergence, system_entropy=H_system, timestamp=time()))
    if length(detector.history) > detector.window_size
        popfirst!(detector.history)
    end
    
    # Classify emergence type
    emergence_type = if emergence > detector.emergence_threshold * PHI_LOCAL
        STRONG
    elseif abs(emergence) < detector.emergence_threshold / PHI_LOCAL
        PHASE_CRITICAL
    else
        WEAK
    end
    
    return (emergence=emergence, type=emergence_type)
end

"""
    _entropy(values::Vector{Float64}, bins::Int=10)

Compute discrete entropy of a signal.
"""
function _entropy(values::Vector{Float64}, bins::Int=10)
    if isempty(values)
        return 0.0
    end
    
    # Discretize
    min_v, max_v = extrema(values)
    if max_v == min_v
        return 0.0
    end
    
    discretized = floor.(Int, (values .- min_v) ./ (max_v - min_v + eps()) .* bins) .+ 1
    discretized = clamp.(discretized, 1, bins)
    
    # Count occurrences
    counts = zeros(Int, bins)
    for d in discretized
        counts[d] += 1
    end
    
    # Compute entropy
    n = length(values)
    entropy = 0.0
    for c in counts
        if c > 0
            p = c / n
            entropy -= p * log2(p)
        end
    end
    
    return entropy
end

# ═══════════════════════════════════════════════════════════════════════════════
# EMERGENCE ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Main emergence engine combining criticality and emergence detection.
"""
mutable struct EmergenceEngine
    id::String
    criticality_detector::CriticalityDetector
    emergence_detector::EmergenceDetector
    ising_lattice::Matrix{Int8}
    temperature::Float64
    coupling::Float64
    running::Bool
end

"""
    EmergenceEngine(; dimensions=1, lattice_size=32)

Create an emergence engine with Ising model support.
"""
function EmergenceEngine(; dimensions::Int=1, lattice_size::Int=32)
    # Initialize Ising lattice with random spins
    lattice = rand([-1, 1], lattice_size, lattice_size) .|> Int8
    
    EmergenceEngine(
        "RSHIP-2026-EMERGENCE-001",
        CriticalityDetector(dimensions=dimensions),
        EmergenceDetector(),
        lattice,
        2.27,  # Near critical temperature for 2D Ising
        1.0,
        false
    )
end

"""
    register_neuron!(engine::EmergenceEngine, id::String, initial_state::Float64=0.0)

Register a neuron/component for emergence monitoring.
"""
function register_neuron!(engine::EmergenceEngine, id::String, initial_state::Float64=0.0)
    register_component!(engine.emergence_detector, id, [initial_state])
end

"""
    detect_emergence(engine::EmergenceEngine, values::Vector{Float64})

Unified emergence detection combining multiple methods.
"""
function detect_emergence(engine::EmergenceEngine, values::Vector{Float64})
    # Update criticality detector
    phase_state = update!(engine.criticality_detector, values)
    
    # Update emergence detector with average as system state
    avg_val = mean(values)
    emergence_result = update_component!(engine.emergence_detector, "system", [avg_val])
    
    # Ising lattice magnetization
    magnetization = ising_magnetization(engine)
    
    return (
        phase_state = phase_state,
        emergence_type = emergence_result.type,
        emergence_magnitude = emergence_result.emergence,
        susceptibility = get_susceptibility(engine.criticality_detector.order_parameter),
        correlation_length = engine.criticality_detector.correlation_length,
        magnetization = magnetization,
        is_critical = phase_state == CRITICAL
    )
end

"""
    ising_step!(engine::EmergenceEngine)

Perform one Metropolis step of the Ising model.

H = -J Σ_{⟨i,j⟩} σᵢσⱼ
"""
function ising_step!(engine::EmergenceEngine)
    L = size(engine.ising_lattice, 1)
    β = 1.0 / engine.temperature
    J = engine.coupling
    
    for _ in 1:(L^2)
        # Random site
        i, j = rand(1:L), rand(1:L)
        σ = engine.ising_lattice[i, j]
        
        # Neighbor sum with periodic boundaries
        neighbor_sum = engine.ising_lattice[mod1(i-1, L), j] +
                       engine.ising_lattice[mod1(i+1, L), j] +
                       engine.ising_lattice[i, mod1(j-1, L)] +
                       engine.ising_lattice[i, mod1(j+1, L)]
        
        # Energy change for spin flip
        ΔE = 2 * J * σ * neighbor_sum
        
        # Metropolis acceptance
        if ΔE < 0 || rand() < exp(-β * ΔE)
            engine.ising_lattice[i, j] = -σ
        end
    end
end

"""
    ising_magnetization(engine::EmergenceEngine)

Compute magnetization m = (1/N)Σᵢσᵢ of the Ising lattice.
"""
function ising_magnetization(engine::EmergenceEngine)
    N = length(engine.ising_lattice)
    return sum(engine.ising_lattice) / N
end

"""
    ising_energy(engine::EmergenceEngine)

Compute energy E = -J Σ_{⟨i,j⟩} σᵢσⱼ of the Ising lattice.
"""
function ising_energy(engine::EmergenceEngine)
    L = size(engine.ising_lattice, 1)
    J = engine.coupling
    E = 0.0
    
    for i in 1:L, j in 1:L
        σ = engine.ising_lattice[i, j]
        # Only count right and down neighbors to avoid double counting
        E -= J * σ * (engine.ising_lattice[mod1(i+1, L), j] + 
                      engine.ising_lattice[i, mod1(j+1, L)])
    end
    
    return E
end

"""
    status(engine::EmergenceEngine)

Get comprehensive status of the emergence engine.
"""
function status(engine::EmergenceEngine)
    return (
        id = engine.id,
        phase_state = engine.criticality_detector.state,
        order_parameter = magnitude(engine.criticality_detector.order_parameter),
        susceptibility = get_susceptibility(engine.criticality_detector.order_parameter),
        correlation_length = engine.criticality_detector.correlation_length,
        relaxation_time = engine.criticality_detector.relaxation_time,
        scaling_exponent = scaling_exponent(engine.criticality_detector),
        ising_temperature = engine.temperature,
        ising_magnetization = ising_magnetization(engine),
        ising_energy = ising_energy(engine),
        component_count = length(engine.emergence_detector.components),
        running = engine.running
    )
end

# Export for module
export PhaseState, EmergenceType, SUBCRITICAL, CRITICAL, SUPERCRITICAL, WEAK, STRONG, PHASE_CRITICAL
export OrderParameter, update_order_parameter!, magnitude, derivative, get_susceptibility, autocorrelation
export CriticalityDetector, update!, scaling_exponent
export EmergenceDetector, register_component!, update_component!
export EmergenceEngine, register_neuron!, detect_emergence, ising_step!, ising_magnetization, ising_energy, status
