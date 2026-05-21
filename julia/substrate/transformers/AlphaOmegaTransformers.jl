"""
    AlphaOmegaTransformers

RSHIP-2026-ALPHA-OMEGA-TRANSFORMERS-001

Alpha Omega Transformer Collection - Deep Mathematical Operations
Master module aggregating all transformer types for AGI substrate.

The transformers implement the full spectrum from Genesis (Alpha/Α) 
to Completion (Omega/Ω), covering:

1. AlphaTransformer - Beginning/Genesis operations
2. OmegaTransformer - Convergence/Completion operations
3. PhiTransformer - Golden ratio scaling
4. ManifoldTransformer - Differential geometry
5. TensorTransformer - Higher-order tensors
6. SpectralTransformer - Eigenvalue decomposition
7. FractalTransformer - Self-similar patterns
8. CategoryTransformer - Category theory
9. ToposTransformer - Topos theory
10. HypergraphTransformer - Higher-order graphs
11. InformationTransformer - Information theory
12. SymplecticTransformer - Hamiltonian mechanics

Mathematical Unification:
- All transformers share φ (golden ratio) weighting
- All implement transform(T, x) → x' interface
- All track metrics and provide status()
"""

# Include all transformer modules
include("AlphaTransformer.jl")
include("OmegaTransformer.jl")
include("PhiTransformer.jl")
include("ManifoldTransformer.jl")
include("TensorTransformer.jl")
include("SpectralTransformer.jl")
include("FractalTransformer.jl")
include("CategoryTransformer.jl")
include("ToposTransformer.jl")
include("HypergraphTransformer.jl")
include("InformationTransformer.jl")
include("SymplecticTransformer.jl")

# ═══════════════════════════════════════════════════════════════════════════════
# UNIFIED TRANSFORMER INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Abstract type for all Alpha-Omega Transformers
"""
abstract type AbstractTransformer end

"""
Unified transformer chain applying multiple transformations
"""
mutable struct TransformerChain
    id::String
    transformers::Vector{Any}
    active::Vector{Bool}
    metrics::Dict{Symbol,Float64}
end

"""
    TransformerChain(transformers...)

Create a chain of transformers.
"""
function TransformerChain(transformers...)
    TransformerChain(
        "CHAIN-$(rand(10000:99999))",
        collect(transformers),
        fill(true, length(transformers)),
        Dict{Symbol,Float64}(:chain_transforms => 0.0)
    )
end

"""
    chain_transform(chain::TransformerChain, input::Vector{Float64})

Apply all active transformers in sequence.
"""
function chain_transform(chain::TransformerChain, input::Vector{Float64})
    result = copy(input)
    
    for (i, transformer) in enumerate(chain.transformers)
        if chain.active[i]
            result = transform(transformer, result)
        end
    end
    
    chain.metrics[:chain_transforms] += 1.0
    return result
end

"""
    toggle_transformer!(chain::TransformerChain, index::Int, active::Bool)

Enable/disable a transformer in the chain.
"""
function toggle_transformer!(chain::TransformerChain, index::Int, active::Bool)
    if 1 <= index <= length(chain.active)
        chain.active[index] = active
    end
end

"""
Full transformer suite with all 12 transformers
"""
mutable struct FullTransformerSuite
    alpha::AlphaTransformer
    omega::OmegaTransformer
    phi::PhiTransformer
    manifold::ManifoldTransformer
    tensor::TensorTransformer
    spectral::SpectralTransformer
    fractal::FractalTransformer
    category::CategoryTransformer
    topos::ToposTransformer
    hypergraph::HypergraphTransformer
    information::InformationTransformer
    symplectic::SymplecticTransformer
end

"""
    FullTransformerSuite(dimension::Int)

Create full suite with all transformers.
"""
function FullTransformerSuite(dimension::Int)
    FullTransformerSuite(
        AlphaTransformer(dimension),
        OmegaTransformer(dimension),
        PhiTransformer(dimension),
        ManifoldTransformer(dimension),
        TensorTransformer(dimension),
        SpectralTransformer(dimension),
        FractalTransformer(dimension),
        CategoryTransformer(dimension),
        ToposTransformer(dimension),
        HypergraphTransformer(dimension),
        InformationTransformer(dimension),
        SymplecticTransformer(dimension)
    )
end

"""
    full_transform(suite::FullTransformerSuite, input::Vector{Float64}; 
                   pipeline=[:phi, :spectral, :information])

Apply specified transformer pipeline.
"""
function full_transform(suite::FullTransformerSuite, input::Vector{Float64}; 
                        pipeline::Vector{Symbol}=[:phi, :spectral, :information])
    result = copy(input)
    
    for name in pipeline
        transformer = getfield(suite, name)
        result = transform(transformer, result)
    end
    
    return result
end

"""
    suite_status(suite::FullTransformerSuite)

Get status of all transformers in suite.
"""
function suite_status(suite::FullTransformerSuite)
    return (
        alpha = status(suite.alpha),
        omega = status(suite.omega),
        phi = status(suite.phi),
        manifold = status(suite.manifold),
        tensor = status(suite.tensor),
        spectral = status(suite.spectral),
        fractal = status(suite.fractal),
        category = status(suite.category),
        topos = status(suite.topos),
        hypergraph = status(suite.hypergraph),
        information = status(suite.information),
        symplectic = status(suite.symplectic)
    )
end

# Export unified interface
export TransformerChain, chain_transform, toggle_transformer!
export FullTransformerSuite, full_transform, suite_status

# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCTION TRANSFORMERS & RUNTIME INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════════

include("ProductionTransformers.jl")
include("RuntimeIntegration.jl")
include("Benchmarks.jl")
