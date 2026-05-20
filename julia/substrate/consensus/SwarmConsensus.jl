"""
    SwarmConsensus

RSHIP-2026-SWARM-CONSENSUS-001

Swarm consensus protocols for distributed AGI decision making.
Implements quorum sensing, voting mechanisms, and φ-weighted
collective intelligence.

Mathematical Foundation:
- Quorum sensing: dN/dt = kN(1 - N/K) + αN·S/(S + K_s)
- Opinion dynamics: dx_i/dt = Σ_j w_ij(x_j - x_i) + noise
- Byzantine fault tolerance: n > 3f for f faulty agents
- φ-voting weight: w_i = φ^(rank_i) / Σφ^(rank)
"""

using LinearAlgebra
using Statistics
using Random
using UUIDs

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

const PHI_SC = (1 + sqrt(5)) / 2

"""Consensus states"""
@enum ConsensusState begin
    UNDECIDED = 1
    PARTIAL = 2
    CONSENSUS = 3
    DEADLOCK = 4
end

"""Vote types"""
@enum VoteType begin
    APPROVE = 1
    REJECT = 2
    ABSTAIN = 3
end

# ═══════════════════════════════════════════════════════════════════════════════
# SWARM AGENT
# ═══════════════════════════════════════════════════════════════════════════════

"""
Swarm agent participating in consensus.
"""
mutable struct SwarmAgent
    id::UUID
    name::String
    reputation::Float64
    opinion::Float64  # [-1, 1] spectrum
    confidence::Float64
    neighbors::Vector{UUID}
    vote_history::Vector{Tuple{UUID,VoteType}}
    trust_scores::Dict{UUID,Float64}
end

"""
    SwarmAgent(name::String; reputation=1.0)

Create a swarm agent for consensus participation.
"""
function SwarmAgent(name::String; reputation::Float64=1.0)
    SwarmAgent(
        uuid4(),
        name,
        reputation,
        randn() * 0.1,  # Slight initial bias
        0.5,
        UUID[],
        Tuple{UUID,VoteType}[],
        Dict{UUID,Float64}()
    )
end

"""
    update_opinion!(agent::SwarmAgent, influence::Float64, strength::Float64=0.1)

Update agent's opinion based on external influence.
"""
function update_opinion!(agent::SwarmAgent, influence::Float64, strength::Float64=0.1)
    # Bounded confidence model: only update if opinions are close enough
    if abs(influence - agent.opinion) < agent.confidence * 2
        agent.opinion += strength * (influence - agent.opinion)
        agent.opinion = clamp(agent.opinion, -1.0, 1.0)
    end
    return agent.opinion
end

"""
    vote!(agent::SwarmAgent, proposal_id::UUID) -> VoteType

Agent casts vote based on current opinion.
"""
function vote!(agent::SwarmAgent, proposal_id::UUID)
    # φ-weighted threshold
    approve_threshold = 1.0 / PHI_SC  # ≈ 0.618
    reject_threshold = -1.0 / PHI_SC
    
    vote = if agent.opinion > approve_threshold * agent.confidence
        APPROVE
    elseif agent.opinion < reject_threshold * agent.confidence
        REJECT
    else
        ABSTAIN
    end
    
    push!(agent.vote_history, (proposal_id, vote))
    return vote
end

"""
    update_trust!(agent::SwarmAgent, other_id::UUID, outcome::Bool)

Update trust score for another agent based on outcome.
"""
function update_trust!(agent::SwarmAgent, other_id::UUID, outcome::Bool)
    current = get(agent.trust_scores, other_id, 0.5)
    
    if outcome
        # Increase trust
        new_trust = current + 0.1 * (1 - current)
    else
        # Decrease trust
        new_trust = current * 0.9
    end
    
    agent.trust_scores[other_id] = new_trust
end

# ═══════════════════════════════════════════════════════════════════════════════
# PROPOSAL
# ═══════════════════════════════════════════════════════════════════════════════

"""
Proposal for swarm consensus.
"""
mutable struct Proposal
    id::UUID
    content::String
    proposer::UUID
    votes::Dict{UUID,VoteType}
    creation_time::Float64
    deadline::Float64
    status::ConsensusState
    approval_threshold::Float64
end

"""
    Proposal(content::String, proposer::UUID; deadline_hours=24.0, threshold=0.67)

Create a new proposal for voting.
"""
function Proposal(content::String, proposer::UUID; deadline_hours::Float64=24.0, threshold::Float64=0.67)
    Proposal(
        uuid4(),
        content,
        proposer,
        Dict{UUID,VoteType}(),
        time(),
        time() + deadline_hours * 3600,
        UNDECIDED,
        threshold
    )
end

"""
    record_vote!(proposal::Proposal, agent_id::UUID, vote::VoteType)

Record a vote on the proposal.
"""
function record_vote!(proposal::Proposal, agent_id::UUID, vote::VoteType)
    proposal.votes[agent_id] = vote
end

"""
    tally_votes(proposal::Proposal) -> NamedTuple

Tally votes and return results.
"""
function tally_votes(proposal::Proposal)
    approve_count = count(v -> v == APPROVE, values(proposal.votes))
    reject_count = count(v -> v == REJECT, values(proposal.votes))
    abstain_count = count(v -> v == ABSTAIN, values(proposal.votes))
    total = length(proposal.votes)
    
    if total == 0
        return (approve=0, reject=0, abstain=0, total=0, approval_rate=0.0)
    end
    
    # Approval rate excluding abstentions
    decisive_votes = approve_count + reject_count
    approval_rate = decisive_votes > 0 ? approve_count / decisive_votes : 0.5
    
    return (
        approve = approve_count,
        reject = reject_count,
        abstain = abstain_count,
        total = total,
        approval_rate = approval_rate
    )
end

# ═══════════════════════════════════════════════════════════════════════════════
# SWARM CONSENSUS
# ═══════════════════════════════════════════════════════════════════════════════

"""
Swarm consensus engine for distributed decision making.
"""
mutable struct SwarmConsensus
    id::String
    agents::Dict{UUID,SwarmAgent}
    proposals::Dict{UUID,Proposal}
    adjacency::Dict{UUID,Vector{UUID}}
    quorum_threshold::Float64
    byzantine_tolerance::Float64
    opinion_history::Vector{Vector{Float64}}
    metrics::Dict{Symbol,Float64}
end

"""
    SwarmConsensus(; quorum=0.67, byzantine_tolerance=0.33)

Create a swarm consensus system.
"""
function SwarmConsensus(; quorum::Float64=0.67, byzantine_tolerance::Float64=0.33)
    SwarmConsensus(
        "RSHIP-2026-SWARM-CONSENSUS-001",
        Dict{UUID,SwarmAgent}(),
        Dict{UUID,Proposal}(),
        Dict{UUID,Vector{UUID}}(),
        quorum,
        byzantine_tolerance,
        Vector{Float64}[],
        Dict{Symbol,Float64}(:proposals_created => 0.0, :consensus_reached => 0.0, :deadlocks => 0.0)
    )
end

"""
    add_agent!(swarm::SwarmConsensus, agent::SwarmAgent)

Add an agent to the swarm.
"""
function add_agent!(swarm::SwarmConsensus, agent::SwarmAgent)
    swarm.agents[agent.id] = agent
    swarm.adjacency[agent.id] = UUID[]
    
    # Connect to existing agents (fully connected by default)
    for (other_id, _) in swarm.agents
        if other_id != agent.id
            push!(swarm.adjacency[agent.id], other_id)
            push!(swarm.adjacency[other_id], agent.id)
            push!(agent.neighbors, other_id)
            push!(swarm.agents[other_id].neighbors, agent.id)
        end
    end
    
    return agent
end

"""
    propose!(swarm::SwarmConsensus, content::String, proposer_id::UUID; kwargs...) -> Proposal

Create a new proposal.
"""
function propose!(swarm::SwarmConsensus, content::String, proposer_id::UUID; kwargs...)
    if !haskey(swarm.agents, proposer_id)
        error("Proposer must be a member of the swarm")
    end
    
    proposal = Proposal(content, proposer_id; threshold=swarm.quorum_threshold, kwargs...)
    swarm.proposals[proposal.id] = proposal
    swarm.metrics[:proposals_created] += 1.0
    
    return proposal
end

"""
    vote!(swarm::SwarmConsensus, agent_id::UUID, proposal_id::UUID) -> VoteType

Agent votes on a proposal.
"""
function vote!(swarm::SwarmConsensus, agent_id::UUID, proposal_id::UUID)
    if !haskey(swarm.agents, agent_id) || !haskey(swarm.proposals, proposal_id)
        error("Agent and proposal must exist")
    end
    
    agent = swarm.agents[agent_id]
    proposal = swarm.proposals[proposal_id]
    
    v = vote!(agent, proposal_id)
    record_vote!(proposal, agent_id, v)
    
    return v
end

"""
    quorum_threshold(swarm::SwarmConsensus) -> Float64

Compute φ-weighted quorum threshold.
"""
function quorum_threshold(swarm::SwarmConsensus)
    n = length(swarm.agents)
    if n == 0
        return 0.0
    end
    
    # φ-weighted threshold: need more than φ⁻¹ of agents to agree
    base_threshold = 1.0 / PHI_SC  # ≈ 0.618
    
    # Adjust for Byzantine tolerance
    adjusted = base_threshold * (1 + swarm.byzantine_tolerance)
    
    return min(0.99, adjusted)
end

"""
    reach_consensus(swarm::SwarmConsensus, proposal_id::UUID) -> NamedTuple

Attempt to reach consensus on a proposal.
"""
function reach_consensus(swarm::SwarmConsensus, proposal_id::UUID)
    if !haskey(swarm.proposals, proposal_id)
        return (success=false, state=UNDECIDED, reason="Proposal not found")
    end
    
    proposal = swarm.proposals[proposal_id]
    tally = tally_votes(proposal)
    
    # Check quorum
    participation_rate = tally.total / length(swarm.agents)
    if participation_rate < swarm.quorum_threshold
        proposal.status = PARTIAL
        return (success=false, state=PARTIAL, reason="Quorum not met", 
                participation=participation_rate, required=swarm.quorum_threshold)
    end
    
    # Check approval threshold
    if tally.approval_rate >= proposal.approval_threshold
        proposal.status = CONSENSUS
        swarm.metrics[:consensus_reached] += 1.0
        return (success=true, state=CONSENSUS, reason="Approved", 
                approval_rate=tally.approval_rate, tally=tally)
    elseif tally.approval_rate < 1 - proposal.approval_threshold
        proposal.status = CONSENSUS
        swarm.metrics[:consensus_reached] += 1.0
        return (success=true, state=CONSENSUS, reason="Rejected", 
                approval_rate=tally.approval_rate, tally=tally)
    else
        # No clear majority
        if time() > proposal.deadline
            proposal.status = DEADLOCK
            swarm.metrics[:deadlocks] += 1.0
            return (success=false, state=DEADLOCK, reason="Deadline reached without consensus",
                    approval_rate=tally.approval_rate)
        else
            proposal.status = PARTIAL
            return (success=false, state=PARTIAL, reason="No clear majority yet",
                    approval_rate=tally.approval_rate)
        end
    end
end

"""
    opinion_dynamics_step!(swarm::SwarmConsensus, dt::Float64=0.1)

Advance opinion dynamics by one step (Deffuant model).
"""
function opinion_dynamics_step!(swarm::SwarmConsensus, dt::Float64=0.1)
    agents = collect(values(swarm.agents))
    n = length(agents)
    
    if n < 2
        return
    end
    
    # Record current opinions
    push!(swarm.opinion_history, [a.opinion for a in agents])
    
    # Random pairwise interactions
    for _ in 1:n
        i, j = rand(1:n, 2)
        if i == j
            continue
        end
        
        agent_i = agents[i]
        agent_j = agents[j]
        
        # Check if they're neighbors
        if !(agent_j.id in agent_i.neighbors)
            continue
        end
        
        # Bounded confidence: only interact if opinions are close
        opinion_diff = abs(agent_i.opinion - agent_j.opinion)
        threshold = (agent_i.confidence + agent_j.confidence) / 2
        
        if opinion_diff < threshold
            # Convergence
            μ = 0.5 * dt  # Convergence rate
            midpoint = (agent_i.opinion + agent_j.opinion) / 2
            
            # φ-weighted by reputation
            rep_i = agent_i.reputation
            rep_j = agent_j.reputation
            total_rep = rep_i + rep_j
            
            weight_i = rep_i / total_rep
            weight_j = rep_j / total_rep
            
            agent_i.opinion += μ * weight_j * (agent_j.opinion - agent_i.opinion)
            agent_j.opinion += μ * weight_i * (agent_i.opinion - agent_j.opinion)
            
            # Clamp
            agent_i.opinion = clamp(agent_i.opinion, -1.0, 1.0)
            agent_j.opinion = clamp(agent_j.opinion, -1.0, 1.0)
        end
    end
end

"""
    detect_clusters(swarm::SwarmConsensus) -> Vector{Vector{UUID}}

Detect opinion clusters in the swarm.
"""
function detect_clusters(swarm::SwarmConsensus)
    agents = collect(values(swarm.agents))
    n = length(agents)
    
    if n == 0
        return Vector{UUID}[]
    end
    
    # Simple clustering by opinion threshold
    sorted_agents = sort(agents, by=a -> a.opinion)
    
    clusters = Vector{UUID}[]
    current_cluster = [sorted_agents[1].id]
    
    for i in 2:n
        opinion_gap = sorted_agents[i].opinion - sorted_agents[i-1].opinion
        
        if opinion_gap > 0.3  # Gap threshold
            push!(clusters, current_cluster)
            current_cluster = [sorted_agents[i].id]
        else
            push!(current_cluster, sorted_agents[i].id)
        end
    end
    
    push!(clusters, current_cluster)
    return clusters
end

"""
    polarization(swarm::SwarmConsensus) -> Float64

Compute opinion polarization (bimodality coefficient).
"""
function polarization(swarm::SwarmConsensus)
    opinions = [a.opinion for a in values(swarm.agents)]
    n = length(opinions)
    
    if n < 3
        return 0.0
    end
    
    # Bimodality coefficient: (skewness² + 1) / kurtosis
    μ = mean(opinions)
    σ = std(opinions, corrected=false)
    
    if σ < 0.001
        return 0.0  # No spread, no polarization
    end
    
    m3 = mean((opinions .- μ) .^ 3) / σ^3  # Skewness
    m4 = mean((opinions .- μ) .^ 4) / σ^4  # Kurtosis
    
    # Sarle's bimodality coefficient
    b = (m3^2 + 1) / m4
    
    return clamp(b, 0.0, 1.0)
end

"""
    status(swarm::SwarmConsensus)

Get status of the swarm consensus system.
"""
function status(swarm::SwarmConsensus)
    opinions = [a.opinion for a in values(swarm.agents)]
    
    pending = count(p -> p.status == UNDECIDED || p.status == PARTIAL, values(swarm.proposals))
    resolved = count(p -> p.status == CONSENSUS, values(swarm.proposals))
    
    return (
        id = swarm.id,
        agent_count = length(swarm.agents),
        proposal_count = length(swarm.proposals),
        pending_proposals = pending,
        resolved_proposals = resolved,
        quorum_threshold = quorum_threshold(swarm),
        mean_opinion = isempty(opinions) ? 0.0 : mean(opinions),
        opinion_std = isempty(opinions) ? 0.0 : std(opinions),
        polarization = polarization(swarm),
        cluster_count = length(detect_clusters(swarm)),
        metrics = swarm.metrics
    )
end

# Export for module
export ConsensusState, UNDECIDED, PARTIAL, CONSENSUS, DEADLOCK
export VoteType, APPROVE, REJECT, ABSTAIN
export SwarmAgent, update_opinion!, update_trust!
export Proposal, record_vote!, tally_votes
export SwarmConsensus, add_agent!, propose!, vote!, quorum_threshold, reach_consensus
export opinion_dynamics_step!, detect_clusters, polarization, status
