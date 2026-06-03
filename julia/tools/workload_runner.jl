#!/usr/bin/env julia
"""
Workload Runner (RSHIP-2026-WORKLOAD-HARNESS-001)

Runs simulated runtime workloads to measure latency, memory growth, and scaling behavior.

Examples:
  julia --project=julia julia/tools/workload_runner.jl --mode=pipeline --iterations=50
  julia --project=julia julia/tools/workload_runner.jl --mode=burst --requests=200 --threshold=2
  julia --project=julia julia/tools/workload_runner.jl --mode=spike --ticks=120 --spike_every=20 --spike_requests=50
  julia --project=julia julia/tools/workload_runner.jl --mode=both --loops=-1
"""

using Dates

include("../substrate/transformers/ProductionTransformers.jl")
include("../substrate/transformers/RuntimeIntegration.jl")
include("../substrate/transformers/WorkloadHarness.jl")

function _parse_kv_args(args)
    opts = Dict{String, String}()
    for arg in args
        if startswith(arg, "--") && occursin("=", arg)
            k, v = split(arg[3:end], "=", limit=2)
            opts[k] = v
        end
    end
    return opts
end

function _get_int(opts, key, default)
    return haskey(opts, key) ? parse(Int, opts[key]) : default
end

function _get_str(opts, key, default)
    return haskey(opts, key) ? opts[key] : default
end

function _print_summary(summary)
    println("=" ^ 80)
    println("WORKLOAD SUMMARY: ", summary.name)
    println("=" ^ 80)
    println("Steps:            ", summary.steps)
    println("Errors:           ", summary.errors)
    println("Scale events:     ", summary.scale_events)
    println("Latency p50 (ms): ", round(summary.p50_latency_ms, digits=3))
    println("Latency p95 (ms): ", round(summary.p95_latency_ms, digits=3))
    println("Latency p99 (ms): ", round(summary.p99_latency_ms, digits=3))
    println("Peak RSS (MB):    ", round(summary.peak_rss_mb, digits=2))
    println("Peak heap (MB):   ", round(summary.peak_heap_live_mb, digits=2))
end

function _write_snapshots(path::String, run::WorkloadRun)
    open(path, "w") do io
        println(io, "idx\trss_mb\theap_live_mb")
        for i in 1:length(run.rss_mb)
            println(io, "$(i)\t$(run.rss_mb[i])\t$(run.heap_live_mb[i])")
        end
    end
end

opts = _parse_kv_args(ARGS)
mode = _get_str(opts, "mode", "both")  # pipeline|burst|spike|both
loops = _get_int(opts, "loops", 1)     # -1 for forever

# Pipeline options
iterations = _get_int(opts, "iterations", 50)
d_model = _get_int(opts, "d_model", 128)
seq_len = _get_int(opts, "seq_len", 16)
alpha_omega_dimension = _get_int(opts, "alpha_omega_dimension", 64)

# Burst options
requests_n = _get_int(opts, "requests", 200)
threshold = _get_int(opts, "threshold", 4)

# Spike options
ticks = _get_int(opts, "ticks", 120)
base_per_tick = _get_int(opts, "base_per_tick", 2)
spike_every = _get_int(opts, "spike_every", 20)
spike_requests = _get_int(opts, "spike_requests", 50)

snapshots_out = get(opts, "snapshots_out", "")

runtime = IntegratedRuntime(
    production_instances=0,
    encoder_instances=1,
    decoder_instances=0,
    alpha_omega_dimension=alpha_omega_dimension,
    execution_mode=SEQUENTIAL,
    encoder_builder=() -> EncoderTransformer(
        d_model=d_model,
        num_layers=2,
        num_heads=max(1, min(4, d_model ÷ 16)),
        d_ff=max(64, d_model * 2),
        dropout=0.0
    )
)
start!(runtime)

loop_idx = 0
while loops < 0 || loop_idx < loops
    loop_idx += 1
    println("\n>>> Workload loop $(loop_idx) @ $(now())")

    if mode == "pipeline" || mode == "both"
        run = run_pipeline_workload!(
            runtime;
            iterations=iterations,
            d_model=d_model,
            seq_len=seq_len,
            alpha_omega_dimension=alpha_omega_dimension,
            name="pipeline(iter=$(iterations), d=$(d_model), seq=$(seq_len))"
        )
        _print_summary(workload_summary(run))
        if !isempty(snapshots_out)
            _write_snapshots(snapshots_out * ".pipeline.tsv", run)
        end
    end

    if mode == "burst" || mode == "both"
        scheduler = runtime.scheduler
        reqs = RuntimeRequest[]
        for _ in 1:requests_n
            push!(reqs, RuntimeRequest(:encoder, Dict{Symbol, Any}(:input => randn(seq_len, d_model)); priority=5))
        end
        run = run_burst_workload!(
            scheduler,
            reqs;
            autoscale=true,
            threshold_per_instance=threshold,
            name="burst(n=$(requests_n), threshold=$(threshold))",
            snapshot_interval=max(1, requests_n ÷ 20)
        )
        _print_summary(workload_summary(run))
        if !isempty(snapshots_out)
            _write_snapshots(snapshots_out * ".burst.tsv", run)
        end
    end

    if mode == "spike" || mode == "both"
        scheduler = runtime.scheduler
        run = run_spike_workload!(
            scheduler;
            ticks=ticks,
            base_requests_per_tick=base_per_tick,
            spike_every=spike_every,
            spike_requests=spike_requests,
            request_builder=() -> RuntimeRequest(:encoder, Dict{Symbol, Any}(:input => randn(seq_len, d_model)); priority=5),
            autoscale=true,
            threshold_per_instance=threshold,
            snapshot_interval=max(1, (ticks * base_per_tick + spike_requests) ÷ 50),
            name="spike(ticks=$(ticks), spike_every=$(spike_every), spike=$(spike_requests))"
        )
        _print_summary(workload_summary(run))
        if !isempty(snapshots_out)
            _write_snapshots(snapshots_out * ".spike.tsv", run)
        end
    end
end

shutdown!(runtime)
