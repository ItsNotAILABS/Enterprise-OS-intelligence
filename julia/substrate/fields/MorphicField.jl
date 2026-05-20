"""
    MorphicField

RSHIP-2026-MORPHIC-FIELD-001

Morphogenetic field modeling for AGI collective intelligence.
Implements field resonance, morphic inheritance, and φ-weighted 
pattern propagation based on Sheldrake's morphic resonance theory.

Mathematical Foundation:
- Field equations: ∂φ/∂t = D∇²φ + λφ(1-φ²) (Allen-Cahn dynamics)
- Resonance coupling: F_ij = A·exp(-|r_i - r_j|²/2σ²)·cos(ω_ij·t + δ)
- Pattern inheritance via convolution with memory kernel
"""

using LinearAlgebra
using Statistics
using Random
using UUIDs

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

const PHI_MF = (1 + sqrt(5)) / 2
const SCHUMANN_MF = 7.83

"""Field types"""
@enum FieldType begin
    BEHAVIORAL = 1
    STRUCTURAL = 2
    COGNITIVE = 3
    COLLECTIVE = 4
end

"""Resonance modes"""
@enum ResonanceMode begin
    HARMONIC = 1
    CHAOTIC = 2
    ENTRAINING = 3
    DECOUPLED = 4
end

# ═══════════════════════════════════════════════════════════════════════════════
# MORPHIC PATTERN
# ═══════════════════════════════════════════════════════════════════════════════

"""
Morphic pattern representing a repeatable form in the field.

Each pattern has:
- Template: the structural/behavioral form
- Strength: how well-established the pattern is
- Frequency: resonance frequency for coupling
"""
mutable struct MorphicPattern
    id::UUID
    template::Vector{Float64}
    strength::Float64
    frequency::Float64
    inheritance::Vector{UUID}
    instance_count::Int
    mutations::Vector{Vector{Float64}}
    created::Float64
    last_resonance::Float64
    resonance_count::Int
end

"""
    MorphicPattern(template::Vector{Float64}; strength=1.0, frequency=SCHUMANN_MF)

Create a new morphic pattern with specified template.
"""
function MorphicPattern(template::Vector{Float64}; strength::Float64=1.0, frequency::Float64=SCHUMANN_MF)
    MorphicPattern(
        uuid4(),
        template,
        strength,
        frequency,
        UUID[],
        0,
        Vector{Float64}[],
        time(),
        time(),
        0
    )
end

"""
    inherit!(child::MorphicPattern, parent::MorphicPattern; mutation_rate=0.1)

Inherit pattern from parent with optional mutation.
"""
function inherit!(child::MorphicPattern, parent::MorphicPattern; mutation_rate::Float64=0.1)
    push!(child.inheritance, parent.id)
    
    # Mutate template
    child.template = copy(parent.template)
    for i in eachindex(child.template)
        if rand() < mutation_rate
            child.template[i] *= (1.0 + (rand() - 0.5) * mutation_rate)
        end
    end
    
    # Inherit frequency with φ-weighting
    child.frequency = parent.frequency * PHI_MF / (PHI_MF + 1)
    
    return child
end

"""
    resonate!(pattern::MorphicPattern)

Trigger resonance, strengthening the pattern.
"""
function resonate!(pattern::MorphicPattern)
    pattern.last_resonance = time()
    pattern.resonance_count += 1
    pattern.strength = min(10.0, pattern.strength + 0.001 * pattern.instance_count)
    return pattern.strength
end

"""
    decay!(pattern::MorphicPattern, rate::Float64=0.0001)

Apply temporal decay to pattern strength.
"""
function decay!(pattern::MorphicPattern, rate::Float64=0.0001)
    time_since = time() - pattern.last_resonance
    pattern.strength *= exp(-rate * time_since)
    return pattern.strength
end

"""
    similarity(p1::MorphicPattern, p2::MorphicPattern) -> Float64

Compute similarity between two patterns using cosine similarity.
"""
function similarity(p1::MorphicPattern, p2::MorphicPattern)
    if length(p1.template) != length(p2.template)
        return 0.0
    end
    
    norm1 = norm(p1.template)
    norm2 = norm(p2.template)
    
    if norm1 == 0 || norm2 == 0
        return 0.0
    end
    
    return dot(p1.template, p2.template) / (norm1 * norm2)
end

# ═══════════════════════════════════════════════════════════════════════════════
# FIELD RESONANCE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Field resonance dynamics between patterns.

Implements coupled oscillator dynamics:
dφ_i/dt = ω_i + Σ_j K_ij sin(φ_j - φ_i)
"""
mutable struct FieldResonance
    frequencies::Vector{Float64}
    phases::Vector{Float64}
    coupling_matrix::Matrix{Float64}
    order_parameter::Float64
    mode::ResonanceMode
end

"""
    FieldResonance(n::Int)

Create field resonance dynamics for n oscillators.
"""
function FieldResonance(n::Int)
    FieldResonance(
        SCHUMANN_MF .* (1.0 .+ 0.1 .* randn(n)),  # Natural frequencies near Schumann
        2π .* rand(n),  # Random initial phases
        ones(n, n) / n,  # Uniform coupling
        0.0,
        HARMONIC
    )
end

"""
    step!(resonance::FieldResonance, dt::Float64=0.01)

Advance resonance dynamics by one time step (Kuramoto model).
"""
function step!(resonance::FieldResonance, dt::Float64=0.01)
    n = length(resonance.phases)
    new_phases = copy(resonance.phases)
    
    for i in 1:n
        coupling_sum = 0.0
        for j in 1:n
            if i != j
                coupling_sum += resonance.coupling_matrix[i, j] * sin(resonance.phases[j] - resonance.phases[i])
            end
        end
        new_phases[i] = resonance.phases[i] + dt * (resonance.frequencies[i] + coupling_sum)
    end
    
    resonance.phases = mod.(new_phases, 2π)
    
    # Compute order parameter R = |Σ exp(iθ)| / N
    complex_sum = sum(exp(im * θ) for θ in resonance.phases)
    resonance.order_parameter = abs(complex_sum) / n
    
    # Determine mode
    resonance.mode = if resonance.order_parameter > 0.8
        HARMONIC
    elseif resonance.order_parameter > 0.5
        ENTRAINING
    elseif resonance.order_parameter > 0.2
        CHAOTIC
    else
        DECOUPLED
    end
    
    return resonance.order_parameter
end

# ═══════════════════════════════════════════════════════════════════════════════
# MORPHIC FIELD
# ═══════════════════════════════════════════════════════════════════════════════

"""
Morphic field containing patterns and resonance dynamics.
"""
mutable struct MorphicField
    id::UUID
    field_type::FieldType
    patterns::Dict{UUID,MorphicPattern}
    resonance::Union{FieldResonance,Nothing}
    field_strength::Float64
    coherence::Float64
    frequency::Float64
    coupling::Dict{UUID,Tuple{MorphicField,Float64}}
    lattice::Matrix{Float64}
    metrics::Dict{Symbol,Int}
end

"""
    create_field(field_type::FieldType; frequency=SCHUMANN_MF, lattice_size=32)

Create a new morphic field with specified type.
"""
function create_field(field_type::FieldType; frequency::Float64=SCHUMANN_MF, lattice_size::Int=32)
    # Initialize Allen-Cahn field lattice with random noise
    lattice = 0.1 .* randn(lattice_size, lattice_size)
    
    MorphicField(
        uuid4(),
        field_type,
        Dict{UUID,MorphicPattern}(),
        nothing,
        1.0,
        1.0,
        frequency,
        Dict{UUID,Tuple{MorphicField,Float64}}(),
        lattice,
        Dict{Symbol,Int}(:patterns_created => 0, :resonance_events => 0, :inheritance_events => 0)
    )
end

"""
    add_pattern!(field::MorphicField, template::Vector{Float64}; kwargs...)

Add a new pattern to the field.
"""
function add_pattern!(field::MorphicField, template::Vector{Float64}; kwargs...)
    pattern = MorphicPattern(template; frequency=field.frequency, kwargs...)
    field.patterns[pattern.id] = pattern
    field.metrics[:patterns_created] += 1
    
    # Update resonance dynamics
    _update_resonance!(field)
    
    return pattern
end

"""
    inherit_pattern!(field::MorphicField, child_template::Vector{Float64}, parent_id::UUID; kwargs...)

Create pattern by inheriting from existing pattern.
"""
function inherit_pattern!(field::MorphicField, child_template::Vector{Float64}, parent_id::UUID; kwargs...)
    if !haskey(field.patterns, parent_id)
        return (success=false, reason="Parent not found", pattern=nothing)
    end
    
    parent = field.patterns[parent_id]
    child = add_pattern!(field, child_template; kwargs...)
    inherit!(child, parent)
    field.metrics[:inheritance_events] += 1
    
    return (success=true, reason="", pattern=child)
end

"""
    _update_resonance!(field::MorphicField)

Update resonance dynamics after topology change.
"""
function _update_resonance!(field::MorphicField)
    n = length(field.patterns)
    if n == 0
        field.resonance = nothing
        return
    end
    
    field.resonance = FieldResonance(n)
    patterns = collect(values(field.patterns))
    
    # Set frequencies from patterns
    field.resonance.frequencies = [p.frequency for p in patterns]
    
    # Set coupling from pattern similarities
    for i in 1:n
        for j in 1:n
            if i != j
                field.resonance.coupling_matrix[i, j] = similarity(patterns[i], patterns[j])
            end
        end
    end
end

"""
    resonate!(field::MorphicField)

Trigger field-wide resonance cycle.
"""
function resonate!(field::MorphicField)
    # Resonate all patterns
    for (id, pattern) in field.patterns
        resonate!(pattern)
    end
    
    # Step resonance dynamics
    if field.resonance !== nothing
        step!(field.resonance)
        field.coherence = field.resonance.order_parameter
    end
    
    field.metrics[:resonance_events] += 1
    return field.coherence
end

"""
    allen_cahn_step!(field::MorphicField, dt::Float64=0.1, D::Float64=1.0, λ::Float64=1.0)

Evolve field lattice according to Allen-Cahn equation:
∂φ/∂t = D∇²φ + λφ(1-φ²)

This creates pattern-forming dynamics with stable domains.
"""
function allen_cahn_step!(field::MorphicField, dt::Float64=0.1, D::Float64=1.0, λ::Float64=1.0)
    L = size(field.lattice, 1)
    φ = field.lattice
    φ_new = copy(φ)
    
    for i in 1:L
        for j in 1:L
            # Laplacian with periodic boundaries
            laplacian = (φ[mod1(i+1, L), j] + φ[mod1(i-1, L), j] +
                        φ[i, mod1(j+1, L)] + φ[i, mod1(j-1, L)] - 4*φ[i, j])
            
            # Allen-Cahn update
            reaction = λ * φ[i, j] * (1 - φ[i, j]^2)
            φ_new[i, j] = φ[i, j] + dt * (D * laplacian + reaction)
        end
    end
    
    field.lattice = clamp.(φ_new, -1.0, 1.0)
    return field.lattice
end

"""
    couple!(field1::MorphicField, field2::MorphicField, strength::Float64=1.0)

Couple two morphic fields for cross-field resonance.
"""
function couple!(field1::MorphicField, field2::MorphicField, strength::Float64=1.0)
    field1.coupling[field2.id] = (field2, strength)
    field2.coupling[field1.id] = (field1, strength)
    return (field1.id, field2.id)
end

"""
    propagate_pattern!(field::MorphicField, pattern_id::UUID)

Propagate pattern to coupled fields.
"""
function propagate_pattern!(field::MorphicField, pattern_id::UUID)
    if !haskey(field.patterns, pattern_id)
        return Vector{UUID}()
    end
    
    pattern = field.patterns[pattern_id]
    propagated_ids = UUID[]
    
    for (coupled_id, (coupled_field, strength)) in field.coupling
        propagation_strength = pattern.strength * strength * field.field_strength
        
        if propagation_strength > 0.5
            new_pattern = add_pattern!(coupled_field, pattern.template; 
                                       strength=propagation_strength,
                                       frequency=pattern.frequency * strength)
            inherit!(new_pattern, pattern)
            push!(propagated_ids, new_pattern.id)
        end
    end
    
    return propagated_ids
end

"""
    find_resonant(field::MorphicField, template::Vector{Float64}, threshold::Float64=0.7)

Find patterns resonant with given template.
"""
function find_resonant(field::MorphicField, template::Vector{Float64}, threshold::Float64=0.7)
    test_pattern = MorphicPattern(template)
    resonant = Tuple{MorphicPattern,Float64}[]
    
    for (id, pattern) in field.patterns
        sim = similarity(pattern, test_pattern)
        if sim >= threshold
            push!(resonant, (pattern, sim))
        end
    end
    
    # Sort by similarity * strength (resonance score)
    sort!(resonant, by=x -> x[2] * x[1].strength, rev=true)
    return resonant
end

"""
    decay!(field::MorphicField, rate::Float64=0.0001)

Apply decay to all patterns in the field.
"""
function decay!(field::MorphicField, rate::Float64=0.0001)
    for (id, pattern) in field.patterns
        decay!(pattern, rate)
    end
    field.field_strength *= 0.9999
end

"""
    field_energy(field::MorphicField) -> Float64

Compute total field energy (Ginzburg-Landau functional).

E = ∫[D/2|∇φ|² + V(φ)]dx

where V(φ) = λ/4(1-φ²)²
"""
function field_energy(field::MorphicField)
    L = size(field.lattice, 1)
    φ = field.lattice
    D = 1.0
    λ = 1.0
    
    energy = 0.0
    for i in 1:L
        for j in 1:L
            # Gradient energy (squared gradient)
            ∇φ_x = (φ[mod1(i+1, L), j] - φ[i, j])
            ∇φ_y = (φ[i, mod1(j+1, L)] - φ[i, j])
            gradient_energy = D/2 * (∇φ_x^2 + ∇φ_y^2)
            
            # Potential energy
            potential_energy = λ/4 * (1 - φ[i, j]^2)^2
            
            energy += gradient_energy + potential_energy
        end
    end
    
    return energy
end

"""
    status(field::MorphicField)

Get comprehensive status of the morphic field.
"""
function status(field::MorphicField)
    mode = field.resonance !== nothing ? field.resonance.mode : DECOUPLED
    
    total_strength = sum(p.strength for p in values(field.patterns); init=0.0)
    avg_strength = length(field.patterns) > 0 ? total_strength / length(field.patterns) : 0.0
    
    return (
        id = field.id,
        type = field.field_type,
        pattern_count = length(field.patterns),
        resonance_mode = mode,
        field_strength = field.field_strength,
        coherence = field.coherence,
        frequency = field.frequency,
        coupling_count = length(field.coupling),
        average_pattern_strength = avg_strength,
        field_energy = field_energy(field),
        metrics = field.metrics
    )
end

# Export for module
export FieldType, BEHAVIORAL, STRUCTURAL, COGNITIVE, COLLECTIVE
export ResonanceMode, HARMONIC, CHAOTIC, ENTRAINING, DECOUPLED
export MorphicPattern, inherit!, resonate!, decay!, similarity
export FieldResonance, step!
export MorphicField, create_field, add_pattern!, inherit_pattern!, couple!, propagate_pattern!
export find_resonant, allen_cahn_step!, field_energy, status
