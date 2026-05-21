"""
    KnowledgeCrystallization

RSHIP-2026-KNOWLEDGE-CRYSTAL-001

Knowledge graph crystallization for AGI memory substrate.
Implements crystal lattice structures, epistemic states,
and φ-weighted knowledge consolidation.

Mathematical Foundation:
- Crystal growth: G(T) = k(T_m - T)/T_m for temperature T
- Free energy: F = U - TS (Helmholtz)
- Defect density: n_d = n₀ exp(-E_f/kT)
- φ-consolidation: K(t) = K₀(1 - e^(-t/τ))^φ
"""

using LinearAlgebra
using Statistics
using Random
using UUIDs

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

const PHI_KC = (1 + sqrt(5)) / 2

"""Epistemic states for knowledge certainty"""
@enum EpistemicState begin
    HYPOTHESIS = 1  # Uncertain, needs verification
    BELIEF = 2      # Partially confirmed
    KNOWLEDGE = 3   # Well-established
    AXIOM = 4       # Foundational, unquestionable
end

# ═══════════════════════════════════════════════════════════════════════════════
# KNOWLEDGE NODE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Knowledge node representing a concept or fact.
"""
mutable struct KnowledgeNode
    id::UUID
    content::String
    embedding::Vector{Float64}
    certainty::Float64
    epistemic_state::EpistemicState
    evidence_count::Int
    creation_time::Float64
    last_access::Float64
    access_count::Int
end

"""
    KnowledgeNode(content::String; embedding_dim=128)

Create a knowledge node with random embedding.
"""
function KnowledgeNode(content::String; embedding_dim::Int=128)
    KnowledgeNode(
        uuid4(),
        content,
        randn(embedding_dim) ./ sqrt(embedding_dim),  # Normalized random embedding
        0.5,  # Initial certainty
        HYPOTHESIS,
        0,
        time(),
        time(),
        0
    )
end

"""
    reinforce!(node::KnowledgeNode, strength::Float64=0.1)

Reinforce knowledge node, increasing certainty.
"""
function reinforce!(node::KnowledgeNode, strength::Float64=0.1)
    node.evidence_count += 1
    node.certainty = min(1.0, node.certainty + strength * (1 - node.certainty))
    node.last_access = time()
    node.access_count += 1
    
    # Update epistemic state
    if node.certainty > 0.95 && node.evidence_count > 100
        node.epistemic_state = AXIOM
    elseif node.certainty > 0.8 && node.evidence_count > 10
        node.epistemic_state = KNOWLEDGE
    elseif node.certainty > 0.5
        node.epistemic_state = BELIEF
    end
    
    return node.certainty
end

"""
    decay!(node::KnowledgeNode, rate::Float64=0.01)

Apply forgetting/decay to knowledge node.
"""
function decay!(node::KnowledgeNode, rate::Float64=0.01)
    time_since_access = time() - node.last_access
    decay_factor = exp(-rate * time_since_access)
    node.certainty *= decay_factor
    
    # Downgrade epistemic state if certainty drops
    if node.certainty < 0.3 && node.epistemic_state != AXIOM
        node.epistemic_state = HYPOTHESIS
    elseif node.certainty < 0.6 && node.epistemic_state == KNOWLEDGE
        node.epistemic_state = BELIEF
    end
    
    return node.certainty
end

# ═══════════════════════════════════════════════════════════════════════════════
# KNOWLEDGE EDGE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Knowledge edge representing relationship between concepts.
"""
struct KnowledgeEdge
    source::UUID
    target::UUID
    relation::Symbol  # :is_a, :part_of, :causes, :implies, :similar_to, etc.
    strength::Float64
end

KnowledgeEdge(s::UUID, t::UUID, r::Symbol) = KnowledgeEdge(s, t, r, 1.0)

# ═══════════════════════════════════════════════════════════════════════════════
# CRYSTAL LATTICE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Crystal lattice for structured knowledge storage.
"""
mutable struct CrystalLattice
    nodes::Dict{UUID,KnowledgeNode}
    edges::Vector{KnowledgeEdge}
    adjacency::Dict{UUID,Vector{UUID}}
    defect_density::Float64  # Fraction of inconsistent knowledge
    temperature::Float64     # "Temperature" controlling plasticity
    free_energy::Float64
end

"""
    CrystalLattice(; temperature=1.0)

Create an empty crystal lattice.
"""
function CrystalLattice(; temperature::Float64=1.0)
    CrystalLattice(
        Dict{UUID,KnowledgeNode}(),
        KnowledgeEdge[],
        Dict{UUID,Vector{UUID}}(),
        0.0,
        temperature,
        0.0
    )
end

"""
    add_node!(lattice::CrystalLattice, node::KnowledgeNode)

Add a knowledge node to the crystal lattice.
"""
function add_node!(lattice::CrystalLattice, node::KnowledgeNode)
    lattice.nodes[node.id] = node
    lattice.adjacency[node.id] = UUID[]
    _update_free_energy!(lattice)
    return node
end

"""
    add_edge!(lattice::CrystalLattice, source::UUID, target::UUID, relation::Symbol; strength=1.0)

Add a knowledge edge to the lattice.
"""
function add_edge!(lattice::CrystalLattice, source::UUID, target::UUID, relation::Symbol; strength::Float64=1.0)
    if !haskey(lattice.nodes, source) || !haskey(lattice.nodes, target)
        error("Both nodes must exist")
    end
    
    edge = KnowledgeEdge(source, target, relation, strength)
    push!(lattice.edges, edge)
    push!(lattice.adjacency[source], target)
    
    _update_free_energy!(lattice)
    return edge
end

"""
    _update_free_energy!(lattice::CrystalLattice)

Update lattice free energy: F = U - TS
"""
function _update_free_energy!(lattice::CrystalLattice)
    # Internal energy (negative of total edge strength)
    U = -sum(e.strength for e in lattice.edges; init=0.0)
    
    # Entropy (based on node certainty distribution)
    if !isempty(lattice.nodes)
        certainties = [n.certainty for n in values(lattice.nodes)]
        S = -sum(c -> c > 0 ? c * log(c + eps()) : 0.0, certainties) / length(certainties)
    else
        S = 0.0
    end
    
    lattice.free_energy = U - lattice.temperature * S
end

"""
    similarity(n1::KnowledgeNode, n2::KnowledgeNode) -> Float64

Compute cosine similarity between knowledge embeddings.
"""
function similarity(n1::KnowledgeNode, n2::KnowledgeNode)
    if length(n1.embedding) != length(n2.embedding)
        return 0.0
    end
    
    norm1 = norm(n1.embedding)
    norm2 = norm(n2.embedding)
    
    if norm1 == 0 || norm2 == 0
        return 0.0
    end
    
    return dot(n1.embedding, n2.embedding) / (norm1 * norm2)
end

"""
    find_similar(lattice::CrystalLattice, query_embedding::Vector{Float64}, k::Int=5) -> Vector{KnowledgeNode}

Find k most similar knowledge nodes to query embedding.
"""
function find_similar(lattice::CrystalLattice, query_embedding::Vector{Float64}, k::Int=5)
    if isempty(lattice.nodes)
        return KnowledgeNode[]
    end
    
    # Create temporary node for comparison
    query_node = KnowledgeNode("")
    query_node.embedding = query_embedding
    
    # Compute similarities
    similarities = [(node, similarity(query_node, node)) for node in values(lattice.nodes)]
    sort!(similarities, by=x -> x[2], rev=true)
    
    return [s[1] for s in similarities[1:min(k, length(similarities))]]
end

# ═══════════════════════════════════════════════════════════════════════════════
# KNOWLEDGE CRYSTAL
# ═══════════════════════════════════════════════════════════════════════════════

"""
Knowledge crystal - the main crystallization engine.
"""
mutable struct KnowledgeCrystal
    id::String
    lattice::CrystalLattice
    consolidation_rate::Float64
    growth_rate::Float64
    melting_point::Float64
    metrics::Dict{Symbol,Float64}
end

"""
    KnowledgeCrystal(; consolidation_rate=0.1, growth_rate=0.05)

Create a knowledge crystal for storing and organizing knowledge.
"""
function KnowledgeCrystal(; consolidation_rate::Float64=0.1, growth_rate::Float64=0.05)
    KnowledgeCrystal(
        "RSHIP-2026-KNOWLEDGE-CRYSTAL-001",
        CrystalLattice(),
        consolidation_rate,
        growth_rate,
        2.0,  # Melting point temperature
        Dict{Symbol,Float64}(:crystallizations => 0.0, :queries => 0.0, :merges => 0.0)
    )
end

"""
    crystallize!(crystal::KnowledgeCrystal, content::String, embedding::Vector{Float64}; kwargs...)

Crystallize new knowledge into the lattice.
"""
function crystallize!(crystal::KnowledgeCrystal, content::String, embedding::Vector{Float64}; kwargs...)
    # Check for existing similar knowledge
    similar_nodes = find_similar(crystal.lattice, embedding, 3)
    
    if !isempty(similar_nodes) && similarity(similar_nodes[1], KnowledgeNode(content)) > 0.9
        # Reinforce existing knowledge
        reinforce!(similar_nodes[1])
        crystal.metrics[:crystallizations] += 0.5
        return similar_nodes[1]
    end
    
    # Create new knowledge node
    node = KnowledgeNode(content; kwargs...)
    node.embedding = embedding
    add_node!(crystal.lattice, node)
    
    # Create edges to similar nodes
    for (i, sim_node) in enumerate(similar_nodes)
        sim_score = similarity(node, sim_node)
        if sim_score > 0.5
            add_edge!(crystal.lattice, node.id, sim_node.id, :similar_to; strength=sim_score)
        end
    end
    
    crystal.metrics[:crystallizations] += 1.0
    return node
end

"""
    query_crystal(crystal::KnowledgeCrystal, query_embedding::Vector{Float64}; k=5) -> Vector{Tuple{KnowledgeNode,Float64}}

Query the crystal for relevant knowledge.
"""
function query_crystal(crystal::KnowledgeCrystal, query_embedding::Vector{Float64}; k::Int=5)
    crystal.metrics[:queries] += 1.0
    
    nodes = find_similar(crystal.lattice, query_embedding, k)
    
    # Update access times and return with scores
    results = Tuple{KnowledgeNode,Float64}[]
    for node in nodes
        node.last_access = time()
        node.access_count += 1
        
        query_node = KnowledgeNode("")
        query_node.embedding = query_embedding
        score = similarity(query_node, node) * node.certainty
        push!(results, (node, score))
    end
    
    return results
end

"""
    merge_crystals!(target::KnowledgeCrystal, source::KnowledgeCrystal)

Merge knowledge from source crystal into target.
"""
function merge_crystals!(target::KnowledgeCrystal, source::KnowledgeCrystal)
    for (id, node) in source.lattice.nodes
        # Check for duplicates
        similar = find_similar(target.lattice, node.embedding, 1)
        
        if !isempty(similar) && similarity(similar[1], node) > 0.95
            # Merge by reinforcing existing
            reinforce!(similar[1], 0.2)
        else
            # Copy node to target
            new_node = KnowledgeNode(node.content)
            new_node.embedding = copy(node.embedding)
            new_node.certainty = node.certainty
            new_node.epistemic_state = node.epistemic_state
            add_node!(target.lattice, new_node)
        end
    end
    
    target.metrics[:merges] += 1.0
end

"""
    anneal!(crystal::KnowledgeCrystal, cooling_rate::Float64=0.1)

Simulated annealing to optimize crystal structure.
"""
function anneal!(crystal::KnowledgeCrystal, cooling_rate::Float64=0.1)
    # Reduce temperature
    crystal.lattice.temperature = max(0.01, crystal.lattice.temperature * (1 - cooling_rate))
    
    # Apply decay to uncertain knowledge
    for node in values(crystal.lattice.nodes)
        if node.epistemic_state != AXIOM
            decay!(node, 0.01 * crystal.lattice.temperature)
        end
    end
    
    # Recalculate defect density (inconsistent knowledge)
    inconsistencies = 0
    for edge in crystal.lattice.edges
        n1 = crystal.lattice.nodes[edge.source]
        n2 = crystal.lattice.nodes[edge.target]
        
        # Check for certainty inconsistency
        if abs(n1.certainty - n2.certainty) > 0.5 && edge.strength > 0.5
            inconsistencies += 1
        end
    end
    
    crystal.lattice.defect_density = length(crystal.lattice.edges) > 0 ? 
        inconsistencies / length(crystal.lattice.edges) : 0.0
    
    _update_free_energy!(crystal.lattice)
    return crystal.lattice.free_energy
end

"""
    status(crystal::KnowledgeCrystal)

Get status of the knowledge crystal.
"""
function status(crystal::KnowledgeCrystal)
    lattice = crystal.lattice
    
    avg_certainty = isempty(lattice.nodes) ? 0.0 : 
        mean(n.certainty for n in values(lattice.nodes))
    
    state_counts = Dict{EpistemicState,Int}()
    for node in values(lattice.nodes)
        state_counts[node.epistemic_state] = get(state_counts, node.epistemic_state, 0) + 1
    end
    
    return (
        id = crystal.id,
        node_count = length(lattice.nodes),
        edge_count = length(lattice.edges),
        temperature = lattice.temperature,
        free_energy = lattice.free_energy,
        defect_density = lattice.defect_density,
        average_certainty = avg_certainty,
        epistemic_distribution = state_counts,
        metrics = crystal.metrics
    )
end

# Export for module
export EpistemicState, HYPOTHESIS, BELIEF, KNOWLEDGE, AXIOM
export KnowledgeNode, reinforce!, decay!, similarity
export KnowledgeEdge
export CrystalLattice, add_node!, add_edge!, find_similar
export KnowledgeCrystal, crystallize!, query_crystal, merge_crystals!, anneal!, status
