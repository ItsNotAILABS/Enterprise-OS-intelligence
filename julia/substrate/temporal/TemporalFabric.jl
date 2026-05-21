"""
    TemporalFabric

RSHIP-2026-TEMPORAL-FABRIC-001

Time-series fabric for intelligence temporal analysis.
Implements causal cones, time slicing, and φ-weighted
temporal pattern recognition.

Mathematical Foundation:
- Minkowski metric: ds² = c²dt² - dx² - dy² - dz²
- Causal cone: {(t', x'): (t'-t)² ≥ |x'-x|²/c², t' > t}
- Temporal kernel: K(t,s) = exp(-|t-s|/τ) for exponential memory
- φ-weighted history: w(τ) = φ^(-τ/τ₀) for recency weighting
"""

using LinearAlgebra
using Statistics
using Random

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

const PHI_TF = (1 + sqrt(5)) / 2
const SCHUMANN_TF = 7.83

# ═══════════════════════════════════════════════════════════════════════════════
# TIME SLICE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Time slice representing state at a specific moment.
"""
struct TimeSlice
    timestamp::Float64
    state::Vector{Float64}
    metadata::Dict{String,Any}
    entropy::Float64
end

"""
    TimeSlice(timestamp::Float64, state::Vector{Float64}; metadata=Dict())

Create a time slice with computed entropy.
"""
function TimeSlice(timestamp::Float64, state::Vector{Float64}; metadata::Dict{String,Any}=Dict{String,Any}())
    # Compute state entropy
    p = abs.(state) ./ (sum(abs.(state)) + eps())
    entropy = -sum(x -> x > 0 ? x * log2(x) : 0.0, p)
    TimeSlice(timestamp, state, metadata, entropy)
end

"""
    interpolate(s1::TimeSlice, s2::TimeSlice, t::Float64) -> TimeSlice

Linearly interpolate between two time slices.
"""
function interpolate(s1::TimeSlice, s2::TimeSlice, t::Float64)
    if s1.timestamp == s2.timestamp
        return s1
    end
    
    α = (t - s1.timestamp) / (s2.timestamp - s1.timestamp)
    α = clamp(α, 0.0, 1.0)
    
    new_state = (1 - α) .* s1.state .+ α .* s2.state
    return TimeSlice(t, new_state)
end

# ═══════════════════════════════════════════════════════════════════════════════
# CAUSAL CONE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Causal cone defining causally connected events.
"""
struct CausalCone
    apex_time::Float64
    apex_position::Vector{Float64}
    propagation_speed::Float64  # Information propagation speed
    direction::Symbol  # :future (forward cone) or :past (backward cone)
end

"""
    CausalCone(t::Float64, x::Vector{Float64}; speed=1.0, direction=:future)

Create a causal cone with apex at (t, x).
"""
function CausalCone(t::Float64, x::Vector{Float64}; speed::Float64=1.0, direction::Symbol=:future)
    CausalCone(t, x, speed, direction)
end

"""
    is_inside(cone::CausalCone, t::Float64, x::Vector{Float64}) -> Bool

Check if event (t, x) is inside the causal cone.
"""
function is_inside(cone::CausalCone, t::Float64, x::Vector{Float64})
    dt = t - cone.apex_time
    dx = norm(x - cone.apex_position)
    
    # Check time direction
    if cone.direction == :future && dt < 0
        return false
    elseif cone.direction == :past && dt > 0
        return false
    end
    
    # Check causal constraint: |dx| ≤ c|dt|
    return dx <= cone.propagation_speed * abs(dt)
end

"""
    cone_volume(cone::CausalCone, t_max::Float64) -> Float64

Compute volume of causal cone up to time t_max.
"""
function cone_volume(cone::CausalCone, t_max::Float64)
    dt = abs(t_max - cone.apex_time)
    r = cone.propagation_speed * dt
    # Volume of cone in n dimensions
    n = length(cone.apex_position)
    if n == 1
        return 2 * r * dt  # 2D spacetime
    elseif n == 2
        return π * r^2 * dt / 3  # 3D spacetime cone
    elseif n == 3
        return π^2 * r^3 * dt / 4  # 4D spacetime hypercone
    else
        return dt * r^n  # Approximate
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# TEMPORAL FABRIC
# ═══════════════════════════════════════════════════════════════════════════════

"""
Temporal fabric weaving past, present, and future states.
"""
mutable struct TemporalFabric
    id::String
    slices::Vector{TimeSlice}
    max_history::Int
    memory_decay::Float64  # τ₀ for φ-weighted decay
    state_dimension::Int
    causal_cones::Vector{CausalCone}
    metrics::Dict{Symbol,Float64}
end

"""
    TemporalFabric(; state_dim=8, max_history=1000, decay=1.0)

Create a temporal fabric for state evolution tracking.
"""
function TemporalFabric(; state_dim::Int=8, max_history::Int=1000, decay::Float64=1.0)
    TemporalFabric(
        "RSHIP-2026-TEMPORAL-FABRIC-001",
        TimeSlice[],
        max_history,
        decay,
        state_dim,
        CausalCone[],
        Dict{Symbol,Float64}(:total_entropy => 0.0, :causal_violations => 0.0)
    )
end

"""
    weave_fabric!(fabric::TemporalFabric, state::Vector{Float64}, t::Float64=time())

Add a new time slice to the fabric.
"""
function weave_fabric!(fabric::TemporalFabric, state::Vector{Float64}, t::Float64=time())
    @assert length(state) == fabric.state_dimension "State dimension mismatch"
    
    slice = TimeSlice(t, state)
    push!(fabric.slices, slice)
    
    # Maintain history limit
    if length(fabric.slices) > fabric.max_history
        popfirst!(fabric.slices)
    end
    
    # Update metrics
    fabric.metrics[:total_entropy] += slice.entropy
    
    return slice
end

"""
    query_history(fabric::TemporalFabric, t_start::Float64, t_end::Float64) -> Vector{TimeSlice}

Query time slices within a time range.
"""
function query_history(fabric::TemporalFabric, t_start::Float64, t_end::Float64)
    return filter(s -> t_start <= s.timestamp <= t_end, fabric.slices)
end

"""
    weighted_history(fabric::TemporalFabric, t::Float64=time()) -> Vector{Float64}

Compute φ-weighted average of historical states.
"""
function weighted_history(fabric::TemporalFabric, t::Float64=time())
    if isempty(fabric.slices)
        return zeros(fabric.state_dimension)
    end
    
    weighted_sum = zeros(fabric.state_dimension)
    total_weight = 0.0
    
    for slice in fabric.slices
        τ = t - slice.timestamp
        if τ >= 0
            weight = PHI_TF^(-τ / fabric.memory_decay)
            weighted_sum .+= weight .* slice.state
            total_weight += weight
        end
    end
    
    return total_weight > 0 ? weighted_sum ./ total_weight : zeros(fabric.state_dimension)
end

"""
    project_future(fabric::TemporalFabric, horizon::Float64; method=:linear) -> TimeSlice

Project future state based on historical trends.
"""
function project_future(fabric::TemporalFabric, horizon::Float64; method::Symbol=:linear)
    if length(fabric.slices) < 2
        return TimeSlice(time() + horizon, zeros(fabric.state_dimension))
    end
    
    t_now = fabric.slices[end].timestamp
    t_future = t_now + horizon
    
    if method == :linear
        # Linear extrapolation from last two points
        s1 = fabric.slices[end-1]
        s2 = fabric.slices[end]
        dt = s2.timestamp - s1.timestamp
        
        if dt > 0
            velocity = (s2.state .- s1.state) ./ dt
            future_state = s2.state .+ velocity .* horizon
            return TimeSlice(t_future, future_state)
        end
    elseif method == :exponential
        # Exponential smoothing
        α = 0.3  # Smoothing factor
        smoothed = fabric.slices[1].state
        
        for i in 2:length(fabric.slices)
            smoothed = α .* fabric.slices[i].state .+ (1 - α) .* smoothed
        end
        
        # Extrapolate with trend
        recent_trend = fabric.slices[end].state .- fabric.slices[max(1, end-5)].state
        future_state = smoothed .+ recent_trend .* (horizon / fabric.memory_decay)
        return TimeSlice(t_future, future_state)
    elseif method == :phi_weighted
        # φ-weighted projection
        weighted = weighted_history(fabric, t_now)
        current = fabric.slices[end].state
        
        # Project with φ-weighted blend
        future_state = PHI_TF .* current .- (PHI_TF - 1) .* weighted
        return TimeSlice(t_future, future_state)
    end
    
    return TimeSlice(t_future, fabric.slices[end].state)
end

"""
    add_causal_cone!(fabric::TemporalFabric, t::Float64, x::Vector{Float64}; kwargs...)

Add a causal cone to track causally connected events.
"""
function add_causal_cone!(fabric::TemporalFabric, t::Float64, x::Vector{Float64}; kwargs...)
    cone = CausalCone(t, x; kwargs...)
    push!(fabric.causal_cones, cone)
    return cone
end

"""
    check_causality(fabric::TemporalFabric, t::Float64, x::Vector{Float64}) -> Bool

Check if event (t, x) is causally connected to any cone.
"""
function check_causality(fabric::TemporalFabric, t::Float64, x::Vector{Float64})
    for cone in fabric.causal_cones
        if is_inside(cone, t, x)
            return true
        end
    end
    return false
end

# ═══════════════════════════════════════════════════════════════════════════════
# TIME SERIES ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    autocorrelation_tf(fabric::TemporalFabric, max_lag::Int=50) -> Vector{Float64}

Compute autocorrelation function of state trajectory.
"""
function autocorrelation_tf(fabric::TemporalFabric, max_lag::Int=50)
    if length(fabric.slices) < max_lag + 10
        return zeros(max_lag + 1)
    end
    
    # Use first component for simplicity
    signal = [s.state[1] for s in fabric.slices]
    n = length(signal)
    μ = mean(signal)
    
    acf = zeros(max_lag + 1)
    var_signal = sum((signal[i] - μ)^2 for i in 1:n)
    
    for lag in 0:max_lag
        cov = sum((signal[i] - μ) * (signal[i+lag] - μ) for i in 1:(n-lag))
        acf[lag+1] = var_signal > 0 ? cov / var_signal : 0.0
    end
    
    return acf
end

"""
    detect_periodicity(fabric::TemporalFabric) -> NamedTuple

Detect periodic patterns in the temporal fabric.
"""
function detect_periodicity(fabric::TemporalFabric)
    if length(fabric.slices) < 20
        return (period=0.0, confidence=0.0, dominant_frequency=0.0)
    end
    
    # Autocorrelation-based period detection
    acf = autocorrelation_tf(fabric, min(100, length(fabric.slices) ÷ 2))
    
    # Find peaks in ACF (excluding lag 0)
    peaks = Int[]
    for i in 3:(length(acf)-1)
        if acf[i] > acf[i-1] && acf[i] > acf[i+1] && acf[i] > 0.1
            push!(peaks, i - 1)  # Convert to lag
        end
    end
    
    if isempty(peaks)
        return (period=0.0, confidence=0.0, dominant_frequency=0.0)
    end
    
    # Primary period is first peak
    period = peaks[1]
    confidence = acf[period + 1]
    
    # Estimate frequency from timestamps
    if length(fabric.slices) >= 2
        dt = (fabric.slices[end].timestamp - fabric.slices[1].timestamp) / (length(fabric.slices) - 1)
        freq = dt > 0 ? 1.0 / (period * dt) : 0.0
    else
        freq = 0.0
    end
    
    return (period=period, confidence=confidence, dominant_frequency=freq)
end

"""
    temporal_entropy(fabric::TemporalFabric) -> Float64

Compute temporal entropy (entropy rate of state evolution).
"""
function temporal_entropy(fabric::TemporalFabric)
    if length(fabric.slices) < 2
        return 0.0
    end
    
    # Compute differences (velocities)
    diffs = [fabric.slices[i].state .- fabric.slices[i-1].state for i in 2:length(fabric.slices)]
    
    # Discretize and compute entropy
    all_diffs = vcat(diffs...)
    if isempty(all_diffs)
        return 0.0
    end
    
    # Histogram-based entropy
    bins = 20
    min_v, max_v = extrema(all_diffs)
    if max_v == min_v
        return 0.0
    end
    
    counts = zeros(Int, bins)
    for d in all_diffs
        idx = clamp(Int(floor((d - min_v) / (max_v - min_v + eps()) * bins)) + 1, 1, bins)
        counts[idx] += 1
    end
    
    n = sum(counts)
    entropy = 0.0
    for c in counts
        if c > 0
            p = c / n
            entropy -= p * log2(p)
        end
    end
    
    return entropy
end

"""
    status(fabric::TemporalFabric)

Get status of the temporal fabric.
"""
function status(fabric::TemporalFabric)
    periodicity = detect_periodicity(fabric)
    
    return (
        id = fabric.id,
        slice_count = length(fabric.slices),
        time_span = length(fabric.slices) >= 2 ? 
            fabric.slices[end].timestamp - fabric.slices[1].timestamp : 0.0,
        state_dimension = fabric.state_dimension,
        memory_decay = fabric.memory_decay,
        causal_cone_count = length(fabric.causal_cones),
        temporal_entropy = temporal_entropy(fabric),
        periodicity = periodicity,
        metrics = fabric.metrics
    )
end

# Export for module
export TimeSlice, interpolate
export CausalCone, is_inside, cone_volume
export TemporalFabric, weave_fabric!, query_history, weighted_history, project_future
export add_causal_cone!, check_causality
export autocorrelation_tf, detect_periodicity, temporal_entropy, status
