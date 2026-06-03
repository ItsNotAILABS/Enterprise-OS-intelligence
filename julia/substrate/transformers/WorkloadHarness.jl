"""
    WorkloadHarness

RSHIP-2026-WORKLOAD-HARNESS-001

Simulated workloads for exercising the runtime integration layer in a way that
can run quickly in CI (small iteration counts) or continuously in a sandbox
(long-running, 24/7) while tracking:
- latency distributions
- memory snapshots (RSS when available)
- scaling events (pool scale-up)

This file is intentionally dependency-light (Base/StdLib only).
"""

using Statistics
using Dates
using Random

const _PROC_STATUS_PATH = "/proc/self/status"

function _read_proc_status_kb(key::AbstractString)
    if !isfile(_PROC_STATUS_PATH)
        return nothing
    end

    open(_PROC_STATUS_PATH, "r") do io
        for line in eachline(io)
            if startswith(line, key)
                parts = split(strip(line))
                if length(parts) >= 2
                    return parse(Float64, parts[2])
                end
            end
        end
    end

    return nothing
end

"""
Return current process RSS in MB when available, otherwise fall back to Julia live heap MB.
"""
function current_rss_mb()
    kb = _read_proc_status_kb("VmRSS:")
    if kb === nothing
        return Base.gc_live_bytes() / 1e6
    end
    return kb / 1024
end

"""
Return Julia live heap size in MB.
"""
current_heap_live_mb() = Base.gc_live_bytes() / 1e6

struct WorkloadEvent
    timestamp::DateTime
    event::Symbol
    details::NamedTuple
end

mutable struct WorkloadRun
    name::String
    started::DateTime
    completed::Union{Nothing, DateTime}
    latencies_ms::Vector{Float64}
    rss_mb::Vector{Float64}
    heap_live_mb::Vector{Float64}
    scale_events::Vector{WorkloadEvent}
    errors::Vector{Any}
end

function WorkloadRun(name::String)
    WorkloadRun(
        name,
        now(),
        nothing,
        Float64[],
        Float64[],
        Float64[],
        WorkloadEvent[],
        Any[]
    )
end

function snapshot!(run::WorkloadRun)
    push!(run.rss_mb, current_rss_mb())
    push!(run.heap_live_mb, current_heap_live_mb())
    return run
end

function _emit!(run::WorkloadRun, event::Symbol; details::NamedTuple=(;))
    push!(run.scale_events, WorkloadEvent(now(), event, details))
    return run
end

"""
Scale up a pool based on pending queue pressure.

Returns `true` when a new instance is created.
"""
function maybe_scale_up!(pool, pending::Int; threshold_per_instance::Int=4)
    active = max(1, sum(pool.active))
    if pending > active * threshold_per_instance
        return scale_up!(pool)
    end
    return false
end

"""
Run a burst workload through a `RuntimeScheduler`.

The scheduler processes requests sequentially today, but this still validates:
- queue pressure + scaling decisions
- executor metrics + latency distribution
- memory snapshots over time
"""
function run_burst_workload!(
    scheduler,
    requests;
    name::String="burst-workload",
    autoscale::Bool=true,
    threshold_per_instance::Int=4,
    snapshot_interval::Int=1
)
    run = WorkloadRun(name)
    snapshot!(run)

    for req in requests
        submit!(scheduler, req)
    end

    processed = 0
    while !isempty(scheduler.pending_queue) || !isempty(scheduler.processing)
        if autoscale
            pending = length(scheduler.pending_queue)
            executor = scheduler.executor
            if executor.production_pool !== nothing && maybe_scale_up!(executor.production_pool, pending; threshold_per_instance=threshold_per_instance)
                _emit!(run, :scale_up; details=(; pool=:production, pending))
            end
            if executor.encoder_pool !== nothing && maybe_scale_up!(executor.encoder_pool, pending; threshold_per_instance=threshold_per_instance)
                _emit!(run, :scale_up; details=(; pool=:encoder, pending))
            end
            if executor.decoder_pool !== nothing && maybe_scale_up!(executor.decoder_pool, pending; threshold_per_instance=threshold_per_instance)
                _emit!(run, :scale_up; details=(; pool=:decoder, pending))
            end
        end

        start_ns = time_ns()
        result = process_next!(scheduler)
        elapsed_ms = (time_ns() - start_ns) / 1e6

        if result === nothing
            continue
        end

        push!(run.latencies_ms, elapsed_ms)
        processed += 1

        if result isa NamedTuple && haskey(result, :error)
            push!(run.errors, result)
        end

        if snapshot_interval > 0 && (processed % snapshot_interval == 0)
            snapshot!(run)
        end
    end

    run.completed = now()
    return run
end

"""
Run a simple multi-step runtime pipeline repeatedly and record stage latencies.

Stages:
- encoder execution
- alpha-omega transformation
"""
function run_pipeline_workload!(
    runtime;
    iterations::Int=25,
    d_model::Int=128,
    seq_len::Int=16,
    alpha_omega_dimension::Int=64,
    pipeline::Vector{Symbol}=[:alpha, :phi, :spectral],
    name::String="pipeline-workload",
    snapshot_interval::Int=1,
    seed::Int=42
)
    Random.seed!(seed)
    run = WorkloadRun(name)
    snapshot!(run)

    for i in 1:iterations
        x = randn(seq_len, d_model)
        stage_start_ns = time_ns()
        execute_encoder(runtime.executor, x)
        stage_ms = (time_ns() - stage_start_ns) / 1e6
        push!(run.latencies_ms, stage_ms)

        y = randn(alpha_omega_dimension)
        stage_start_ns = time_ns()
        apply_alpha_omega!(runtime, y; pipeline=pipeline)
        stage_ms = (time_ns() - stage_start_ns) / 1e6
        push!(run.latencies_ms, stage_ms)

        if snapshot_interval > 0 && (i % snapshot_interval == 0)
            snapshot!(run)
        end
    end

    run.completed = now()
    return run
end

function workload_summary(run::WorkloadRun)
    lat = run.latencies_ms
    return (
        name = run.name,
        started = run.started,
        completed = run.completed,
        steps = length(lat),
        errors = length(run.errors),
        p50_latency_ms = isempty(lat) ? 0.0 : quantile(lat, 0.5),
        p95_latency_ms = isempty(lat) ? 0.0 : quantile(lat, 0.95),
        p99_latency_ms = isempty(lat) ? 0.0 : quantile(lat, 0.99),
        peak_rss_mb = isempty(run.rss_mb) ? 0.0 : maximum(run.rss_mb),
        peak_heap_live_mb = isempty(run.heap_live_mb) ? 0.0 : maximum(run.heap_live_mb),
        scale_events = length(run.scale_events)
    )
end

export WorkloadRun, WorkloadEvent
export current_rss_mb, current_heap_live_mb
export run_burst_workload!, run_pipeline_workload!, workload_summary
