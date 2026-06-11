"""
    Benchmarks

RSHIP-2026-BENCHMARKS-001

Production Benchmark Suite for Transformer Performance Validation
Comprehensive benchmarking for:
- Latency measurement (p50, p95, p99)
- Throughput calculation (tokens/second)
- Memory profiling
- Scaling efficiency
- φ-transformation accuracy

© 2026 Medina Tech · Dallas, Texas
"""

using LinearAlgebra
using Statistics
using Random
using Dates

# ═══════════════════════════════════════════════════════════════════════════════
# BENCHMARK CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

const PHI_BENCH = (1 + sqrt(5)) / 2
const _PROC_STATUS_PATH_BENCH = "/proc/self/status"

function _read_proc_status_kb_bench(key::AbstractString)
    if !isfile(_PROC_STATUS_PATH_BENCH)
        return nothing
    end

    open(_PROC_STATUS_PATH_BENCH, "r") do io
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
function current_rss_mb_bench()
    kb = _read_proc_status_kb_bench("VmRSS:")
    if kb === nothing
        return Base.gc_live_bytes() / 1e6
    end
    return kb / 1024
end

"""Benchmark result container"""
struct BenchmarkResult
    name::String
    iterations::Int
    mean_time_ms::Float64
    std_time_ms::Float64
    min_time_ms::Float64
    max_time_ms::Float64
    p50_time_ms::Float64
    p95_time_ms::Float64
    p99_time_ms::Float64
    throughput::Float64
    memory_mb::Float64              # peak RSS (preferred) or live heap MB
    memory_growth_mb::Float64       # end - start (RSS preferred)
    bytes_allocated_per_iter::Float64
    gc_time_ms_per_iter::Float64
    compile_time_ms_per_iter::Float64
    timestamp::DateTime
end

"""Benchmark suite container"""
mutable struct BenchmarkSuite
    name::String
    results::Vector{BenchmarkResult}
    started::DateTime
    completed::Union{Nothing, DateTime}
    config::Dict{Symbol, Any}
end

"""Create benchmark suite"""
function BenchmarkSuite(name::String; config::Dict{Symbol, Any}=Dict{Symbol, Any}())
    BenchmarkSuite(
        name,
        BenchmarkResult[],
        now(),
        nothing,
        config
    )
end

# ═══════════════════════════════════════════════════════════════════════════════
# TIMING UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════

"""Run benchmark with timing"""
function benchmark(f::Function, name::String; 
                   iterations::Int=100, 
                   warmup::Int=10,
                   tokens_per_iter::Int=1)
    # Warmup runs
    for _ in 1:warmup
        f()
    end
    
    # Timed runs
    times = Float64[]
    bytes_sum = 0.0
    gctime_sum_ms = 0.0
    compile_sum_ms = 0.0

    start_mem_mb = current_rss_mb_bench()
    peak_mem_mb = start_mem_mb
    
    for _ in 1:iterations
        t = @timed f()
        elapsed_ms = t.time * 1000
        push!(times, elapsed_ms)

        bytes_sum += t.bytes
        gctime_sum_ms += t.gctime * 1000
        compile_sum_ms += t.compile_time * 1000

        mem_mb = current_rss_mb_bench()
        peak_mem_mb = max(peak_mem_mb, mem_mb)
    end

    end_mem_mb = current_rss_mb_bench()
    memory_growth_mb = end_mem_mb - start_mem_mb
    
    # Calculate statistics
    mean_t = mean(times)
    std_t = std(times)
    min_t = minimum(times)
    max_t = maximum(times)
    p50_t = quantile(times, 0.5)
    p95_t = quantile(times, 0.95)
    p99_t = quantile(times, 0.99)
    
    # Throughput (tokens per second)
    throughput = tokens_per_iter / (mean_t / 1000)
    
    BenchmarkResult(
        name,
        iterations,
        mean_t,
        std_t,
        min_t,
        max_t,
        p50_t,
        p95_t,
        p99_t,
        throughput,
        peak_mem_mb,
        memory_growth_mb,
        bytes_sum / iterations,
        gctime_sum_ms / iterations,
        compile_sum_ms / iterations,
        now()
    )
end

"""
Run a fixed-duration CPU-pressure benchmark.

This is useful for "24/7" sandboxes where you want stable, time-boxed pressure
and consistent metrics regardless of per-iteration speed.
"""
function cpu_pressure_benchmark(f::Function, name::String;
                                seconds::Float64=2.0,
                                warmup::Int=10,
                                tokens_per_iter::Int=1)
    for _ in 1:warmup
        f()
    end

    times = Float64[]
    bytes_sum = 0.0
    gctime_sum_ms = 0.0
    compile_sum_ms = 0.0

    start_mem_mb = current_rss_mb_bench()
    peak_mem_mb = start_mem_mb

    start_ns = time_ns()
    iters = 0
    while (time_ns() - start_ns) / 1e9 < seconds
        t = @timed f()
        push!(times, t.time * 1000)
        bytes_sum += t.bytes
        gctime_sum_ms += t.gctime * 1000
        compile_sum_ms += t.compile_time * 1000
        iters += 1

        mem_mb = current_rss_mb_bench()
        peak_mem_mb = max(peak_mem_mb, mem_mb)
    end

    if isempty(times)
        error("cpu_pressure_benchmark produced no samples (seconds=$seconds)")
    end

    end_mem_mb = current_rss_mb_bench()
    memory_growth_mb = end_mem_mb - start_mem_mb

    mean_t = mean(times)
    std_t = std(times)
    min_t = minimum(times)
    max_t = maximum(times)
    p50_t = quantile(times, 0.5)
    p95_t = quantile(times, 0.95)
    p99_t = quantile(times, 0.99)
    throughput = tokens_per_iter / (mean_t / 1000)

    BenchmarkResult(
        name * " (cpu_pressure=$(seconds)s)",
        iters,
        mean_t,
        std_t,
        min_t,
        max_t,
        p50_t,
        p95_t,
        p99_t,
        throughput,
        peak_mem_mb,
        memory_growth_mb,
        bytes_sum / iters,
        gctime_sum_ms / iters,
        compile_sum_ms / iters,
        now()
    )
end

"""
Estimate a power-law exponent for scaling behavior: y ≈ c * x^k.

Returns exponent `k` and R² on the log-log fit.
"""
function estimate_powerlaw(xs::AbstractVector{<:Real}, ys::AbstractVector{<:Real})
    if length(xs) != length(ys)
        error("xs and ys must have same length")
    end

    x = Float64[]
    y = Float64[]
    for (xi, yi) in zip(xs, ys)
        if xi > 0 && yi > 0 && isfinite(xi) && isfinite(yi)
            push!(x, Float64(xi))
            push!(y, Float64(yi))
        end
    end

    if length(x) < 2
        return (exponent = 0.0, r2 = 0.0, n = length(x))
    end

    lx = log.(x)
    ly = log.(y)

    vx = var(lx)
    if vx == 0.0
        return (exponent = 0.0, r2 = 0.0, n = length(x))
    end

    slope = cov(lx, ly) / vx
    intercept = mean(ly) - slope * mean(lx)
    yhat = intercept .+ slope .* lx

    ss_res = sum((ly .- yhat) .^ 2)
    ss_tot = sum((ly .- mean(ly)) .^ 2)
    r2 = ss_tot == 0.0 ? 0.0 : max(0.0, 1.0 - ss_res / ss_tot)

    return (exponent = slope, r2 = r2, n = length(x))
end

"""Add result to suite"""
function add_result!(suite::BenchmarkSuite, result::BenchmarkResult)
    push!(suite.results, result)
end

"""Complete benchmark suite"""
function complete!(suite::BenchmarkSuite)
    suite.completed = now()
end

# ═══════════════════════════════════════════════════════════════════════════════
# TRANSFORMER BENCHMARKS
# ═══════════════════════════════════════════════════════════════════════════════

"""
Benchmark multi-head attention
"""
function benchmark_attention(d_model::Int, seq_len::Int; iterations::Int=100)
    mha = MultiHeadAttention(d_model)
    Q = randn(seq_len, d_model)
    K = randn(seq_len, d_model)
    V = randn(seq_len, d_model)
    
    benchmark(() -> attend(mha, Q, K, V), 
              "MultiHeadAttention(d=$d_model, seq=$seq_len)";
              iterations=iterations,
              tokens_per_iter=seq_len)
end

"""
Benchmark feed-forward network
"""
function benchmark_feedforward(d_model::Int, d_ff::Int, seq_len::Int; iterations::Int=100)
    ff = FeedForward(d_model; d_ff=d_ff)
    x = randn(seq_len, d_model)
    
    benchmark(() -> forward(ff, x),
              "FeedForward(d=$d_model, ff=$d_ff, seq=$seq_len)";
              iterations=iterations,
              tokens_per_iter=seq_len)
end

"""
Benchmark encoder layer
"""
function benchmark_encoder_layer(d_model::Int, seq_len::Int; iterations::Int=100)
    layer = EncoderLayer(d_model)
    x = randn(seq_len, d_model)
    
    benchmark(() -> encode(layer, x),
              "EncoderLayer(d=$d_model, seq=$seq_len)";
              iterations=iterations,
              tokens_per_iter=seq_len)
end

"""
Benchmark full production transformer
"""
function benchmark_production_transformer(d_model::Int, num_layers::Int, 
                                          seq_len::Int; iterations::Int=50)
    transformer = ProductionTransformer(
        d_model=d_model,
        num_encoder_layers=num_layers,
        num_decoder_layers=num_layers
    )
    initialize!(transformer)
    
    source = randn(seq_len, d_model)
    target = randn(seq_len ÷ 2, d_model)
    
    benchmark(() -> forward_pass(transformer, source, target),
              "ProductionTransformer(d=$d_model, L=$num_layers, seq=$seq_len)";
              iterations=iterations,
              tokens_per_iter=seq_len + seq_len ÷ 2)
end

"""
Benchmark encoder-only transformer
"""
function benchmark_encoder_transformer(d_model::Int, num_layers::Int,
                                       seq_len::Int; iterations::Int=50)
    encoder = EncoderTransformer(d_model=d_model, num_layers=num_layers)
    x = randn(seq_len, d_model)
    
    benchmark(() -> encode_and_pool(encoder, x),
              "EncoderTransformer(d=$d_model, L=$num_layers, seq=$seq_len)";
              iterations=iterations,
              tokens_per_iter=seq_len)
end

"""
Benchmark decoder-only transformer
"""
function benchmark_decoder_transformer(d_model::Int, num_layers::Int,
                                       seq_len::Int; iterations::Int=50)
    decoder = DecoderTransformer(d_model=d_model, num_layers=num_layers)
    x = randn(seq_len, d_model)
    
    benchmark(() -> generate_next(decoder, x),
              "DecoderTransformer(d=$d_model, L=$num_layers, seq=$seq_len)";
              iterations=iterations,
              tokens_per_iter=1)  # Single token generation
end

# ═══════════════════════════════════════════════════════════════════════════════
# ALPHA-OMEGA BENCHMARKS
# ═══════════════════════════════════════════════════════════════════════════════

"""
Benchmark Alpha transformer
"""
function benchmark_alpha(dimension::Int; iterations::Int=100)
    alpha = AlphaTransformer(dimension)
    x = randn(dimension)
    
    benchmark(() -> transform(alpha, x),
              "AlphaTransformer(d=$dimension)";
              iterations=iterations,
              tokens_per_iter=dimension)
end

"""
Benchmark Phi transformer
"""
function benchmark_phi(dimension::Int; iterations::Int=100)
    phi = PhiTransformer(dimension)
    x = randn(dimension)
    
    benchmark(() -> transform(phi, x),
              "PhiTransformer(d=$dimension)";
              iterations=iterations,
              tokens_per_iter=dimension)
end

"""
Benchmark Spectral transformer
"""
function benchmark_spectral(dimension::Int; iterations::Int=100)
    spectral = SpectralTransformer(dimension)
    x = randn(dimension)
    
    benchmark(() -> transform(spectral, x),
              "SpectralTransformer(d=$dimension)";
              iterations=iterations,
              tokens_per_iter=dimension)
end

"""
Benchmark full transformer chain
"""
function benchmark_transformer_chain(dimension::Int; iterations::Int=50)
    chain = TransformerChain(
        AlphaTransformer(dimension),
        PhiTransformer(dimension),
        SpectralTransformer(dimension)
    )
    x = randn(dimension)
    
    benchmark(() -> chain_transform(chain, x),
              "TransformerChain(d=$dimension, 3 transformers)";
              iterations=iterations,
              tokens_per_iter=dimension)
end

# ═══════════════════════════════════════════════════════════════════════════════
# SCALING BENCHMARKS
# ═══════════════════════════════════════════════════════════════════════════════

"""
Benchmark scaling behavior with sequence length
"""
function benchmark_sequence_scaling(d_model::Int; 
                                    seq_lengths::Vector{Int}=[32, 64, 128, 256, 512],
                                    iterations::Int=20)
    results = BenchmarkResult[]
    
    for seq_len in seq_lengths
        result = benchmark_encoder_layer(d_model, seq_len; iterations=iterations)
        push!(results, result)
    end
    
    return results
end

"""
Run sequence scaling and estimate algorithmic complexity exponent k for mean latency.
"""
function run_sequence_scaling_with_complexity(d_model::Int;
                                              seq_lengths::Vector{Int}=[32, 64, 128, 256, 512],
                                              iterations::Int=20)
    results = benchmark_sequence_scaling(d_model; seq_lengths=seq_lengths, iterations=iterations)
    ys = [r.mean_time_ms for r in results]
    complexity = estimate_powerlaw(seq_lengths, ys)
    return (sizes = seq_lengths, results = results, complexity = complexity)
end

"""
Benchmark scaling behavior with model dimension
"""
function benchmark_dimension_scaling(seq_len::Int;
                                     dimensions::Vector{Int}=[64, 128, 256, 512],
                                     iterations::Int=20)
    results = BenchmarkResult[]
    
    for d_model in dimensions
        result = benchmark_encoder_layer(d_model, seq_len; iterations=iterations)
        push!(results, result)
    end
    
    return results
end

"""
Run dimension scaling and estimate algorithmic complexity exponent k for mean latency.
"""
function run_dimension_scaling_with_complexity(seq_len::Int;
                                               dimensions::Vector{Int}=[64, 128, 256, 512],
                                               iterations::Int=20)
    results = benchmark_dimension_scaling(seq_len; dimensions=dimensions, iterations=iterations)
    ys = [r.mean_time_ms for r in results]
    complexity = estimate_powerlaw(dimensions, ys)
    return (sizes = dimensions, results = results, complexity = complexity)
end

"""
Benchmark scaling behavior with number of layers
"""
function benchmark_layer_scaling(d_model::Int, seq_len::Int;
                                 layer_counts::Vector{Int}=[1, 2, 4, 6, 8, 12],
                                 iterations::Int=20)
    results = BenchmarkResult[]
    
    for num_layers in layer_counts
        result = benchmark_encoder_transformer(d_model, num_layers, seq_len; 
                                               iterations=iterations)
        push!(results, result)
    end
    
    return results
end

"""
Run layer scaling and estimate algorithmic complexity exponent k for mean latency.
"""
function run_layer_scaling_with_complexity(d_model::Int, seq_len::Int;
                                           layer_counts::Vector{Int}=[1, 2, 4, 6, 8, 12],
                                           iterations::Int=20)
    results = benchmark_layer_scaling(d_model, seq_len; layer_counts=layer_counts, iterations=iterations)
    ys = [r.mean_time_ms for r in results]
    complexity = estimate_powerlaw(layer_counts, ys)
    return (sizes = layer_counts, results = results, complexity = complexity)
end

# ═══════════════════════════════════════════════════════════════════════════════
# COMPREHENSIVE BENCHMARK SUITE
# ═══════════════════════════════════════════════════════════════════════════════

"""
Run comprehensive benchmark suite
"""
function run_comprehensive_benchmarks(; 
    d_model::Int=256,
    seq_len::Int=64,
    iterations::Int=50
)
    suite = BenchmarkSuite("Comprehensive Production Benchmarks")
    
    println("=" ^ 80)
    println("RUNNING COMPREHENSIVE BENCHMARK SUITE")
    println("=" ^ 80)
    println()
    
    # Component benchmarks
    println(">>> Benchmarking components...")
    
    println("  - Multi-Head Attention...")
    add_result!(suite, benchmark_attention(d_model, seq_len; iterations=iterations))
    
    println("  - Feed-Forward Network...")
    add_result!(suite, benchmark_feedforward(d_model, d_model * 4, seq_len; iterations=iterations))
    
    println("  - Encoder Layer...")
    add_result!(suite, benchmark_encoder_layer(d_model, seq_len; iterations=iterations))
    
    # Full model benchmarks
    println("\n>>> Benchmarking full models...")
    
    println("  - Production Transformer...")
    add_result!(suite, benchmark_production_transformer(d_model, 4, seq_len; iterations=min(20, iterations)))
    
    println("  - Encoder Transformer...")
    add_result!(suite, benchmark_encoder_transformer(d_model, 6, seq_len; iterations=min(20, iterations)))
    
    println("  - Decoder Transformer...")
    add_result!(suite, benchmark_decoder_transformer(d_model, 6, seq_len; iterations=min(20, iterations)))
    
    # Alpha-Omega benchmarks
    println("\n>>> Benchmarking Alpha-Omega transformers...")
    
    println("  - Alpha Transformer...")
    add_result!(suite, benchmark_alpha(d_model; iterations=iterations))
    
    println("  - Phi Transformer...")
    add_result!(suite, benchmark_phi(d_model; iterations=iterations))
    
    println("  - Spectral Transformer...")
    add_result!(suite, benchmark_spectral(d_model; iterations=iterations))
    
    println("  - Transformer Chain...")
    add_result!(suite, benchmark_transformer_chain(d_model; iterations=min(30, iterations)))
    
    complete!(suite)
    
    println("\n" * "=" ^ 80)
    println("BENCHMARK COMPLETE")
    println("=" ^ 80)
    
    return suite
end

"""
Run CPU-pressure and complexity scaling benchmarks (fast defaults).
"""
function run_pressure_and_complexity_benchmarks(;
    d_model::Int=128,
    seq_len::Int=32,
    iterations::Int=10,
    pressure_seconds::Float64=2.0
)
    suite = BenchmarkSuite("Pressure + Complexity Benchmarks")

    println("=" ^ 80)
    println("RUNNING PRESSURE + COMPLEXITY BENCHMARK SUITE")
    println("=" ^ 80)
    println()

    println(">>> CPU pressure...")
    layer = EncoderLayer(d_model)
    x = randn(seq_len, d_model)
    add_result!(suite, cpu_pressure_benchmark(() -> encode(layer, x), "EncoderLayer CPU Pressure"; seconds=pressure_seconds, tokens_per_iter=seq_len))

    println("\n>>> Scaling complexity (mean latency exponents)...")
    seq = run_sequence_scaling_with_complexity(d_model; seq_lengths=[16, 32, 64, 128], iterations=iterations)
    dim = run_dimension_scaling_with_complexity(seq_len; dimensions=[32, 64, 128, 256], iterations=iterations)
    lay = run_layer_scaling_with_complexity(d_model, seq_len; layer_counts=[1, 2, 4, 8], iterations=iterations)

    println("  - Sequence exponent k ≈ $(round(seq.complexity.exponent, digits=3)) (R²=$(round(seq.complexity.r2, digits=3)))")
    println("  - Dimension exponent k ≈ $(round(dim.complexity.exponent, digits=3)) (R²=$(round(dim.complexity.r2, digits=3)))")
    println("  - Layers exponent k ≈ $(round(lay.complexity.exponent, digits=3)) (R²=$(round(lay.complexity.r2, digits=3)))")

    complete!(suite)
    return (suite = suite, sequence = seq, dimension = dim, layers = lay)
end

"""
Print benchmark results
"""
function print_results(suite::BenchmarkSuite)
    println("\n" * "=" ^ 100)
    println("BENCHMARK RESULTS: $(suite.name)")
    println("Started: $(suite.started)")
    println("Completed: $(suite.completed)")
    println("=" ^ 100)
    println()
    
    # Header
    println(rpad("Benchmark", 60), " | ",
            rpad("Mean (ms)", 12), " | ",
            rpad("P95 (ms)", 12), " | ",
            rpad("P99 (ms)", 12), " | ",
            rpad("Throughput", 15), " | ",
            rpad("MemΔ (MB)", 10))
    println("-" ^ 120)
    
    for result in suite.results
        println(rpad(result.name, 60), " | ",
                rpad(round(result.mean_time_ms, digits=3), 12), " | ",
                rpad(round(result.p95_time_ms, digits=3), 12), " | ",
                rpad(round(result.p99_time_ms, digits=3), 12), " | ",
                rpad("$(round(result.throughput, digits=1)) tok/s", 15), " | ",
                rpad(round(result.memory_growth_mb, digits=2), 10))
    end
    
    println("-" ^ 120)
end

"""
Generate benchmark report as markdown
"""
function generate_report(suite::BenchmarkSuite)
    report = """
# Benchmark Report: $(suite.name)

**Started:** $(suite.started)
**Completed:** $(suite.completed)

## Results Summary

| Benchmark | Mean (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Throughput | MemΔ (MB) | Bytes/iter | GC ms/iter |
|-----------|-----------|----------|----------|----------|------------|-----------|-----------|-----------|
"""
    
    for result in suite.results
        name = result.name
        mean_t = round(result.mean_time_ms, digits=3)
        p50_t = round(result.p50_time_ms, digits=3)
        p95_t = round(result.p95_time_ms, digits=3)
        p99_t = round(result.p99_time_ms, digits=3)
        throughput = round(result.throughput, digits=1)
        mem_delta = round(result.memory_growth_mb, digits=2)
        bytes_iter = round(result.bytes_allocated_per_iter, digits=0)
        gc_ms_iter = round(result.gc_time_ms_per_iter, digits=3)
        report *= "| $name | $mean_t | $p50_t | $p95_t | $p99_t | $throughput tok/s | $mem_delta | $bytes_iter | $gc_ms_iter |\n"
    end
    
    report *= """

## Configuration

- Golden ratio scaling: φ = $(PHI_BENCH)
- Iterations per benchmark: varies by complexity
- Warmup iterations: 10

## System Information

- Memory usage tracked per benchmark (peak RSS when available)
- Memory growth = end - start per benchmark
- Times measured in milliseconds
- Throughput in tokens per second

---
*Generated by RSHIP-2026-BENCHMARKS-001*
"""
    
    return report
end

# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

export BenchmarkResult, BenchmarkSuite
export benchmark, cpu_pressure_benchmark, add_result!, complete!
export estimate_powerlaw
export benchmark_attention, benchmark_feedforward, benchmark_encoder_layer
export benchmark_production_transformer, benchmark_encoder_transformer, benchmark_decoder_transformer
export benchmark_alpha, benchmark_phi, benchmark_spectral, benchmark_transformer_chain
export benchmark_sequence_scaling, benchmark_dimension_scaling, benchmark_layer_scaling
export run_sequence_scaling_with_complexity, run_dimension_scaling_with_complexity, run_layer_scaling_with_complexity
export run_comprehensive_benchmarks, run_pressure_and_complexity_benchmarks, print_results, generate_report
