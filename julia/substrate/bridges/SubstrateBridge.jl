"""
    SubstrateBridge

RSHIP-2026-SUBSTRATE-BRIDGE-001

Core bridge infrastructure for cross-system intelligence routing.
Implements φ-weighted routing, signal propagation, and substrate connectivity.

Mathematical Foundation:
- Graph Laplacian for signal diffusion: ∂u/∂t = -L·u
- φ-weighted edge strengths: w_ij = φ^(-d_ij/d_0)
- Kuramoto synchronization for phase alignment
"""

using LinearAlgebra
using Statistics
using Random
using UUIDs

# ═══════════════════════════════════════════════════════════════════════════════
# TYPES
# ═══════════════════════════════════════════════════════════════════════════════

"""
Bridge node representing a substrate endpoint.
"""
struct BridgeNode
    id::UUID
    name::String
    capacity::Float64
    latency::Float64
    phase::Float64
    state::Vector{Float64}
    metadata::Dict{String,Any}
end

"""
Bridge edge connecting two substrate nodes.
"""
mutable struct BridgeEdge
    source::UUID
    target::UUID
    weight::Float64
    bandwidth::Float64
    latency::Float64
    active::Bool
    signal_history::Vector{Float64}
end

"""
Bridge metrics for monitoring.
"""
mutable struct BridgeMetrics
    total_signals::Int64
    total_bytes::Float64
    average_latency::Float64
    coherence::Float64
    throughput::Float64
    error_rate::Float64
    last_update::Float64
end

"""
Substrate bridge for cross-system intelligence routing.
"""
mutable struct SubstrateBridge
    id::UUID
    name::String
    nodes::Dict{UUID,BridgeNode}
    edges::Vector{BridgeEdge}
    adjacency::Matrix{Float64}
    laplacian::Matrix{Float64}
    metrics::BridgeMetrics
    phi::Float64
    heartbeat_interval::Float64
    running::Bool
end

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTRUCTORS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    BridgeNode(name::String; capacity=1.0, latency=0.0)

Create a new bridge node with specified parameters.
"""
function BridgeNode(name::String; capacity::Float64=1.0, latency::Float64=0.0)
    BridgeNode(
        uuid4(),
        name,
        capacity,
        latency,
        rand() * 2π,  # Random initial phase
        zeros(Float64, 8),  # State vector
        Dict{String,Any}()
    )
end

"""
    BridgeEdge(source::UUID, target::UUID; weight=1.0, bandwidth=1.0)

Create a new bridge edge connecting two nodes.
"""
function BridgeEdge(source::UUID, target::UUID; weight::Float64=1.0, bandwidth::Float64=1.0)
    BridgeEdge(
        source,
        target,
        weight,
        bandwidth,
        0.0,
        true,
        Float64[]
    )
end

"""
    BridgeMetrics()

Initialize bridge metrics with default values.
"""
function BridgeMetrics()
    BridgeMetrics(0, 0.0, 0.0, 1.0, 0.0, 0.0, time())
end

"""
    create_bridge(name::String; phi=PHI)

Create a new substrate bridge with φ-weighted routing.
"""
function create_bridge(name::String; phi::Float64=(1+sqrt(5))/2)
    SubstrateBridge(
        uuid4(),
        name,
        Dict{UUID,BridgeNode}(),
        BridgeEdge[],
        zeros(0, 0),
        zeros(0, 0),
        BridgeMetrics(),
        phi,
        873.0,  # Heartbeat in ms
        false
    )
end

# ═══════════════════════════════════════════════════════════════════════════════
# GRAPH OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    add_node!(bridge::SubstrateBridge, node::BridgeNode)

Add a node to the substrate bridge.
"""
function add_node!(bridge::SubstrateBridge, node::BridgeNode)
    bridge.nodes[node.id] = node
    _rebuild_matrices!(bridge)
    return node
end

"""
    connect_nodes!(bridge::SubstrateBridge, source::UUID, target::UUID; kwargs...)

Connect two nodes in the substrate bridge with φ-weighted edge.
"""
function connect_nodes!(bridge::SubstrateBridge, source::UUID, target::UUID; 
                        weight::Float64=1.0, bandwidth::Float64=1.0, bidirectional::Bool=true)
    
    if !haskey(bridge.nodes, source) || !haskey(bridge.nodes, target)
        error("Both nodes must exist in the bridge")
    end
    
    # φ-weighted distance calculation
    node_s = bridge.nodes[source]
    node_t = bridge.nodes[target]
    phase_diff = abs(node_s.phase - node_t.phase)
    phi_weight = bridge.phi^(-phase_diff / π)
    
    edge = BridgeEdge(source, target; weight=weight * phi_weight, bandwidth=bandwidth)
    push!(bridge.edges, edge)
    
    if bidirectional
        reverse_edge = BridgeEdge(target, source; weight=weight * phi_weight, bandwidth=bandwidth)
        push!(bridge.edges, reverse_edge)
    end
    
    _rebuild_matrices!(bridge)
    return edge
end

"""
    _rebuild_matrices!(bridge::SubstrateBridge)

Rebuild adjacency and Laplacian matrices after topology change.
"""
function _rebuild_matrices!(bridge::SubstrateBridge)
    n = length(bridge.nodes)
    if n == 0
        bridge.adjacency = zeros(0, 0)
        bridge.laplacian = zeros(0, 0)
        return
    end
    
    # Create node index mapping
    node_ids = collect(keys(bridge.nodes))
    id_to_idx = Dict(id => i for (i, id) in enumerate(node_ids))
    
    # Build adjacency matrix
    A = zeros(n, n)
    for edge in bridge.edges
        if edge.active
            i = id_to_idx[edge.source]
            j = id_to_idx[edge.target]
            A[i, j] = edge.weight
        end
    end
    
    # Build Laplacian: L = D - A
    D = Diagonal(vec(sum(A, dims=2)))
    L = D - A
    
    bridge.adjacency = A
    bridge.laplacian = L
end

# ═══════════════════════════════════════════════════════════════════════════════
# SIGNAL ROUTING
# ═══════════════════════════════════════════════════════════════════════════════

"""
    route_signal(bridge::SubstrateBridge, source::UUID, target::UUID, signal::Vector{Float64})

Route a signal through the substrate bridge using φ-weighted shortest path.

Uses the graph Laplacian for diffusion-based routing:
∂u/∂t = -L·u + f(source)
"""
function route_signal(bridge::SubstrateBridge, source::UUID, target::UUID, 
                      signal::Vector{Float64})
    
    if !haskey(bridge.nodes, source) || !haskey(bridge.nodes, target)
        return (success=false, path=UUID[], signal=Float64[], latency=Inf)
    end
    
    n = length(bridge.nodes)
    node_ids = collect(keys(bridge.nodes))
    id_to_idx = Dict(id => i for (i, id) in enumerate(node_ids))
    idx_to_id = Dict(i => id for (i, id) in enumerate(node_ids))
    
    # Dijkstra's algorithm with φ-weighted edges
    source_idx = id_to_idx[source]
    target_idx = id_to_idx[target]
    
    dist = fill(Inf, n)
    prev = fill(-1, n)
    dist[source_idx] = 0.0
    visited = falses(n)
    
    for _ in 1:n
        # Find minimum distance unvisited node
        min_dist = Inf
        u = -1
        for i in 1:n
            if !visited[i] && dist[i] < min_dist
                min_dist = dist[i]
                u = i
            end
        end
        
        if u == -1 || u == target_idx
            break
        end
        
        visited[u] = true
        
        # Update neighbors
        for v in 1:n
            if bridge.adjacency[u, v] > 0 && !visited[v]
                # φ-weighted distance
                alt = dist[u] + 1.0 / (bridge.adjacency[u, v] * bridge.phi)
                if alt < dist[v]
                    dist[v] = alt
                    prev[v] = u
                end
            end
        end
    end
    
    # Reconstruct path
    path = UUID[]
    if prev[target_idx] != -1 || source_idx == target_idx
        u = target_idx
        while u != -1
            pushfirst!(path, idx_to_id[u])
            u = prev[u]
        end
    end
    
    # Signal transformation along path
    transformed_signal = copy(signal)
    total_latency = 0.0
    
    for i in 1:(length(path)-1)
        edge_weight = bridge.adjacency[id_to_idx[path[i]], id_to_idx[path[i+1]]]
        # φ-weighted attenuation
        transformed_signal .*= edge_weight * bridge.phi^(-0.1)
        total_latency += 1.0 / edge_weight
    end
    
    # Update metrics
    bridge.metrics.total_signals += 1
    bridge.metrics.average_latency = (bridge.metrics.average_latency * 
        (bridge.metrics.total_signals - 1) + total_latency) / bridge.metrics.total_signals
    bridge.metrics.last_update = time()
    
    return (success=true, path=path, signal=transformed_signal, latency=total_latency)
end

# ═══════════════════════════════════════════════════════════════════════════════
# DIFFUSION AND SYNCHRONIZATION
# ═══════════════════════════════════════════════════════════════════════════════

"""
    propagate!(bridge::SubstrateBridge, initial_state::Dict{UUID,Vector{Float64}}, dt::Float64=0.1)

Propagate state through the substrate using Laplacian diffusion.

Implements: ∂u/∂t = -L·u
"""
function propagate!(bridge::SubstrateBridge, initial_state::Dict{UUID,Vector{Float64}}, 
                    dt::Float64=0.1)
    
    n = length(bridge.nodes)
    if n == 0
        return Dict{UUID,Vector{Float64}}()
    end
    
    node_ids = collect(keys(bridge.nodes))
    id_to_idx = Dict(id => i for (i, id) in enumerate(node_ids))
    
    # Determine state dimension
    state_dim = 0
    for (id, s) in initial_state
        state_dim = length(s)
        break
    end
    if state_dim == 0
        return initial_state
    end
    
    # Build state matrix (n x state_dim)
    U = zeros(n, state_dim)
    for (id, state) in initial_state
        if haskey(id_to_idx, id)
            U[id_to_idx[id], :] = state
        end
    end
    
    # Diffusion step: U_new = U - dt * L * U
    U_new = U - dt * bridge.laplacian * U
    
    # Convert back to dictionary
    result = Dict{UUID,Vector{Float64}}()
    for (i, id) in enumerate(node_ids)
        result[id] = U_new[i, :]
    end
    
    return result
end

"""
    synchronize_phases!(bridge::SubstrateBridge, coupling::Float64=1.0, dt::Float64=0.01)

Synchronize node phases using Kuramoto model.

Kuramoto dynamics: dθ_i/dt = ω_i + (K/N) Σ_j sin(θ_j - θ_i)
"""
function synchronize_phases!(bridge::SubstrateBridge, coupling::Float64=1.0, dt::Float64=0.01)
    n = length(bridge.nodes)
    if n < 2
        return 1.0  # Perfect coherence with single node
    end
    
    node_ids = collect(keys(bridge.nodes))
    phases = [bridge.nodes[id].phase for id in node_ids]
    frequencies = [bridge.phi * (1 + 0.1 * randn()) for _ in 1:n]  # Natural frequencies
    
    # Kuramoto update
    new_phases = copy(phases)
    for i in 1:n
        phase_sum = 0.0
        for j in 1:n
            if i != j && bridge.adjacency[i, j] > 0
                phase_sum += bridge.adjacency[i, j] * sin(phases[j] - phases[i])
            end
        end
        new_phases[i] = phases[i] + dt * (frequencies[i] + (coupling / n) * phase_sum)
    end
    
    # Update phases in nodes (create new nodes since BridgeNode is immutable)
    for (i, id) in enumerate(node_ids)
        old_node = bridge.nodes[id]
        bridge.nodes[id] = BridgeNode(
            old_node.id,
            old_node.name,
            old_node.capacity,
            old_node.latency,
            new_phases[i],
            old_node.state,
            old_node.metadata
        )
    end
    
    # Calculate order parameter R = |Σ exp(iθ)| / N
    complex_sum = sum(exp(im * θ) for θ in new_phases)
    coherence = abs(complex_sum) / n
    
    bridge.metrics.coherence = coherence
    return coherence
end

# ═══════════════════════════════════════════════════════════════════════════════
# SPECTRAL ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    spectral_gap(bridge::SubstrateBridge)

Compute the spectral gap of the bridge Laplacian.

The spectral gap λ₂ - λ₁ indicates connectivity strength.
Larger gap = faster mixing = better synchronization.
"""
function spectral_gap(bridge::SubstrateBridge)
    n = size(bridge.laplacian, 1)
    if n < 2
        return 0.0
    end
    
    eigenvalues = eigvals(Symmetric(bridge.laplacian))
    sort!(eigenvalues)
    
    # λ₁ should be 0 for connected graph, λ₂ is the Fiedler value
    return eigenvalues[2] - eigenvalues[1]
end

"""
    fiedler_vector(bridge::SubstrateBridge)

Compute the Fiedler vector (eigenvector of second smallest eigenvalue).

Used for graph partitioning and community detection.
"""
function fiedler_vector(bridge::SubstrateBridge)
    n = size(bridge.laplacian, 1)
    if n < 2
        return Float64[]
    end
    
    F = eigen(Symmetric(bridge.laplacian))
    # Sort by eigenvalue
    perm = sortperm(F.values)
    # Second eigenvector (first is constant for connected graph)
    return F.vectors[:, perm[2]]
end

# ═══════════════════════════════════════════════════════════════════════════════
# BRIDGE STATUS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    status(bridge::SubstrateBridge)

Get comprehensive status of the substrate bridge.
"""
function status(bridge::SubstrateBridge)
    n = length(bridge.nodes)
    m = length(bridge.edges)
    
    return (
        id = bridge.id,
        name = bridge.name,
        node_count = n,
        edge_count = m,
        phi = bridge.phi,
        spectral_gap = n >= 2 ? spectral_gap(bridge) : 0.0,
        coherence = bridge.metrics.coherence,
        total_signals = bridge.metrics.total_signals,
        average_latency = bridge.metrics.average_latency,
        throughput = bridge.metrics.throughput,
        error_rate = bridge.metrics.error_rate,
        running = bridge.running
    )
end

# Export for module
export BridgeNode, BridgeEdge, BridgeMetrics, SubstrateBridge
export create_bridge, add_node!, connect_nodes!, route_signal, propagate!
export synchronize_phases!, spectral_gap, fiedler_vector, status
