#!/usr/bin/env julia
"""
Production Transformers Runtime Test Suite
RSHIP-2026-PRODUCTION-TEST-001

Comprehensive testing for production transformer runtime execution.
"""

using Test
using LinearAlgebra
using Statistics
using Random
using Dates

# Set seed for reproducibility
Random.seed!(42)

println("=" ^ 80)
println("PRODUCTION TRANSFORMERS RUNTIME TEST SUITE")
println("RSHIP-2026-PRODUCTION-TEST-001")
println("=" ^ 80)
println()

# Include production modules
include("../substrate/transformers/ProductionTransformers.jl")
include("../substrate/transformers/RuntimeIntegration.jl")
include("../substrate/transformers/Benchmarks.jl")
include("../substrate/transformers/WorkloadHarness.jl")

const _TINY_D_MODEL = 64
const _TINY_LAYERS = 2
const _TINY_HEADS = 4
const _TINY_D_FF = 128
const _TINY_VOCAB = 1000

tiny_encoder() = EncoderTransformer(d_model=_TINY_D_MODEL, num_layers=_TINY_LAYERS, num_heads=_TINY_HEADS, d_ff=_TINY_D_FF, dropout=0.0)
tiny_decoder() = DecoderTransformer(d_model=_TINY_D_MODEL, num_layers=_TINY_LAYERS, num_heads=_TINY_HEADS, d_ff=_TINY_D_FF, vocab_size=_TINY_VOCAB, dropout=0.0)
tiny_production() = ProductionTransformer(d_model=_TINY_D_MODEL, num_encoder_layers=1, num_decoder_layers=1, num_heads=_TINY_HEADS, d_ff=_TINY_D_FF, vocab_size=_TINY_VOCAB)

# ═══════════════════════════════════════════════════════════════════════════════
# Test: Production Components
# ═══════════════════════════════════════════════════════════════════════════════

@testset "Production Components" begin
    d_model = 64
    seq_len = 16
    
    @testset "Positional Encoding" begin
        pe = PositionalEncoding(d_model; max_len=100)
        @test pe.d_model == d_model
        @test pe.max_len == 100
        @test size(pe.encodings) == (100, d_model)
        
        x = randn(seq_len, d_model)
        encoded = encode_position(pe, x)
        @test size(encoded) == (seq_len, d_model)
        
        println("✓ Positional Encoding passed")
    end
    
    @testset "Layer Normalization" begin
        ln = LayerNorm(d_model)
        @test length(ln.gamma) == d_model
        @test length(ln.beta) == d_model
        
        x = randn(seq_len, d_model)
        normalized = normalize(ln, x)
        @test size(normalized) == (seq_len, d_model)
        
        # Check normalization properties (approximately)
        row_means = mean(normalized, dims=2)
        row_stds = std(normalized, dims=2, corrected=false)
        @test all(abs.(row_means) .< 1.0)
        
        println("✓ Layer Normalization passed")
    end
    
    @testset "Multi-Head Attention" begin
        num_heads = 4
        mha = MultiHeadAttention(d_model; num_heads=num_heads)
        @test mha.d_model == d_model
        @test mha.num_heads == num_heads
        @test mha.d_k == d_model ÷ num_heads
        
        Q = randn(seq_len, d_model)
        K = randn(seq_len, d_model)
        V = randn(seq_len, d_model)
        
        output = attend(mha, Q, K, V)
        @test size(output) == (seq_len, d_model)
        
        println("✓ Multi-Head Attention passed")
    end
    
    @testset "Feed-Forward Network" begin
        d_ff = d_model * 4
        ff = FeedForward(d_model; d_ff=d_ff)
        @test ff.d_model == d_model
        @test ff.d_ff == d_ff
        
        x = randn(seq_len, d_model)
        output = forward(ff, x)
        @test size(output) == (seq_len, d_model)
        
        # Test GELU activation
        @test gelu(0.0) ≈ 0.0 atol=1e-10
        @test gelu(1.0) > 0.5  # GELU(1) ≈ 0.84
        
        println("✓ Feed-Forward Network passed")
    end
    
    @testset "Encoder Layer" begin
        layer = EncoderLayer(d_model; num_heads=4, d_ff=d_model*4)
        x = randn(seq_len, d_model)
        
        output = encode(layer, x)
        @test size(output) == (seq_len, d_model)
        
        println("✓ Encoder Layer passed")
    end
    
    @testset "Decoder Layer" begin
        layer = DecoderLayer(d_model; num_heads=4, d_ff=d_model*4)
        x = randn(seq_len, d_model)
        encoder_output = randn(seq_len, d_model)
        
        output = decode(layer, x, encoder_output)
        @test size(output) == (seq_len, d_model)
        
        println("✓ Decoder Layer passed")
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# Test: Production Transformers
# ═══════════════════════════════════════════════════════════════════════════════

@testset "Production Transformers" begin
    d_model = 64
    vocab_size = 1000
    
    @testset "Production Transformer (Encoder-Decoder)" begin
        transformer = ProductionTransformer(
            d_model=d_model,
            num_encoder_layers=2,
            num_decoder_layers=2,
            num_heads=4,
            d_ff=d_model*2,
            vocab_size=vocab_size
        )
        
        @test transformer.state == INITIALIZING
        initialize!(transformer)
        @test transformer.state == READY
        
        source = randn(16, d_model)
        target = randn(8, d_model)
        
        logits = forward_pass(transformer, source, target)
        @test size(logits) == (8, vocab_size)
        
        st = status(transformer)
        @test st.d_model == d_model
        @test st.total_forward_passes == 1
        
        println("✓ Production Transformer passed")
    end
    
    @testset "Encoder Transformer" begin
        encoder = EncoderTransformer(
            d_model=d_model,
            num_layers=2,
            num_heads=4,
            d_ff=d_model*2
        )
        
        x = randn(16, d_model)
        encoded, pooled = encode_and_pool(encoder, x)
        
        @test size(encoded) == (16, d_model)
        @test length(pooled) == d_model
        
        println("✓ Encoder Transformer passed")
    end
    
    @testset "Decoder Transformer" begin
        decoder = DecoderTransformer(
            d_model=d_model,
            num_layers=2,
            num_heads=4,
            d_ff=d_model*2,
            vocab_size=vocab_size
        )
        
        x = randn(8, d_model)
        logits = generate_next(decoder, x)
        
        @test length(logits) == vocab_size
        
        # Test greedy decode
        generated = greedy_decode(decoder, x; max_length=5)
        @test length(generated) == 5
        @test all(1 .<= generated .<= vocab_size)
        
        println("✓ Decoder Transformer passed")
    end
    
    @testset "Causal Mask Generation" begin
        mask = generate_causal_mask(4)
        @test size(mask) == (4, 4)
        @test mask[1, 1] == true
        @test mask[1, 2] == false
        @test mask[2, 1] == true
        @test mask[2, 2] == true
        @test mask[4, 4] == true
        
        println("✓ Causal Mask passed")
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# Test: Runtime Integration
# ═══════════════════════════════════════════════════════════════════════════════

@testset "Runtime Integration" begin
    @testset "Runtime Metrics" begin
        metrics = RuntimeMetrics()
        
        record_request!(metrics, 100, 10.5, true)
        record_request!(metrics, 50, 8.2, true)
        record_request!(metrics, 0, 0.0, false)
        
        @test metrics.total_requests == 3
        @test metrics.successful_requests == 2
        @test metrics.failed_requests == 1
        @test metrics.total_tokens_processed == 150
        
        summary = summarize(metrics)
        @test summary.total_requests == 3
        @test summary.total_tokens == 150
        
        println("✓ Runtime Metrics passed")
    end
    
    @testset "Transformer Pool" begin
        pool = TransformerPool(EncoderTransformer, 2; builder=tiny_encoder)
        
        @test length(pool.instances) == 2
        @test all(pool.active)
        @test all(pool.load .== 0)
        
        instance, idx = get_instance(pool)
        @test pool.load[idx] == 1
        
        release_instance!(pool, idx)
        @test pool.load[idx] == 0
        
        # Test scaling
        @test scale_up!(pool) == true
        @test length(pool.instances) == 3
        
        println("✓ Transformer Pool passed")
    end
    
    @testset "Runtime Executor" begin
        executor = RuntimeExecutor(
            encoder_count=1,
            execution_mode=SEQUENTIAL,
            encoder_builder=tiny_encoder
        )
        
        @test executor.state == INITIALIZING
        initialize!(executor)
        @test executor.state == READY
        
        x = randn(8, _TINY_D_MODEL)
        encoded, pooled = execute_encoder(executor, x)
        @test size(encoded) == (8, _TINY_D_MODEL)
        
        st = status(executor)
        @test st.state == READY
        @test st.has_encoder_pool == true
        
        println("✓ Runtime Executor passed")
    end
    
    @testset "Runtime Scheduler" begin
        executor = RuntimeExecutor(encoder_count=1, encoder_builder=tiny_encoder)
        initialize!(executor)
        
        scheduler = RuntimeScheduler(executor)
        
        request = RuntimeRequest(:encoder, Dict{Symbol, Any}(:input => randn(4, _TINY_D_MODEL)))
        request_id = submit!(scheduler, request)
        
        @test !isempty(scheduler.pending_queue)
        
        result = process_next!(scheduler)
        @test result !== nothing
        @test isempty(scheduler.pending_queue)
        @test request_id in scheduler.completed
        
        println("✓ Runtime Scheduler passed")
    end
    
    @testset "Integrated Runtime" begin
        runtime = IntegratedRuntime(
            production_instances=0,
            encoder_instances=0,
            decoder_instances=0,
            alpha_omega_dimension=32,
            execution_mode=SEQUENTIAL
        )
        
        @test runtime.state == INITIALIZING
        start!(runtime)
        @test runtime.state == READY
        
        # Test Alpha-Omega transformation
        x = randn(32)
        transformed = apply_alpha_omega!(runtime, x; pipeline=[:phi])
        @test length(transformed) == 32
        
        st = runtime_status(runtime)
        @test st.state == READY
        @test st.has_alpha_omega == true
        
        # Test shutdown
        shutdown!(runtime)
        @test runtime.state == SHUTDOWN
        
        println("✓ Integrated Runtime passed")
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# Test: Benchmarks
# ═══════════════════════════════════════════════════════════════════════════════

@testset "Benchmarks" begin
    @testset "Basic Benchmark" begin
        result = benchmark(() -> sleep(0.001), "Sleep Test"; iterations=10, warmup=2)
        
        @test result.name == "Sleep Test"
        @test result.iterations == 10
        @test result.mean_time_ms > 0.5  # At least 0.5ms for 1ms sleep
        @test result.min_time_ms <= result.mean_time_ms
        @test result.max_time_ms >= result.mean_time_ms
        @test result.p50_time_ms > 0
        
        println("✓ Basic Benchmark passed")
    end
    
    @testset "Benchmark Suite" begin
        suite = BenchmarkSuite("Test Suite")
        @test suite.completed === nothing
        
        result1 = benchmark(() -> sum(randn(100)), "Sum 100"; iterations=10)
        result2 = benchmark(() -> sum(randn(1000)), "Sum 1000"; iterations=10)
        
        add_result!(suite, result1)
        add_result!(suite, result2)
        
        @test length(suite.results) == 2
        
        complete!(suite)
        @test suite.completed !== nothing
        
        println("✓ Benchmark Suite passed")
    end
    
    @testset "Component Benchmarks" begin
        # Quick benchmarks with small sizes
        result = benchmark_attention(32, 8; iterations=5)
        @test result.mean_time_ms > 0
        
        result = benchmark_feedforward(32, 64, 8; iterations=5)
        @test result.mean_time_ms > 0
        
        println("✓ Component Benchmarks passed")
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# Workload Simulation: Latency, Memory, Scaling
# ═══════════════════════════════════════════════════════════════════════════════

@testset "Workload Simulation" begin
    @testset "Pipeline Workload (Multi-step)" begin
        d_model = 64
        seq_len = 8
        ao_dim = 32

        runtime = IntegratedRuntime(
            production_instances=0,
            encoder_instances=1,
            decoder_instances=0,
            alpha_omega_dimension=ao_dim,
            execution_mode=SEQUENTIAL,
            encoder_builder=() -> EncoderTransformer(
                d_model=d_model,
                num_layers=2,
                num_heads=4,
                d_ff=128,
                dropout=0.0
            )
        )
        start!(runtime)

        run = run_pipeline_workload!(
            runtime;
            iterations=10,
            d_model=d_model,
            seq_len=seq_len,
            alpha_omega_dimension=ao_dim,
            snapshot_interval=2,
            name="test-pipeline"
        )
        summary = workload_summary(run)

        @test summary.steps == 20  # 2 stages per iteration
        @test summary.errors == 0
        @test isfinite(summary.p50_latency_ms)
        @test summary.peak_rss_mb >= 0.0

        shutdown!(runtime)
        println("✓ Pipeline workload passed")
    end

    @testset "Burst Autoscale (Queue Pressure)" begin
        d_model = 64
        seq_len = 8
        ao_dim = 16

        runtime = IntegratedRuntime(
            production_instances=0,
            encoder_instances=1,
            decoder_instances=0,
            alpha_omega_dimension=ao_dim,
            execution_mode=SEQUENTIAL,
            encoder_builder=() -> EncoderTransformer(
                d_model=d_model,
                num_layers=2,
                num_heads=4,
                d_ff=128,
                dropout=0.0
            )
        )
        start!(runtime)

        requests = RuntimeRequest[]
        for _ in 1:40
            push!(requests, RuntimeRequest(:encoder, Dict{Symbol, Any}(:input => randn(seq_len, d_model)); priority=5))
        end

        run = run_burst_workload!(
            runtime.scheduler,
            requests;
            autoscale=true,
            threshold_per_instance=10,
            snapshot_interval=10,
            name="test-burst"
        )

        @test isempty(run.errors)
        @test length(run.scale_events) > 0
        @test runtime.executor.encoder_pool !== nothing
        @test length(runtime.executor.encoder_pool.instances) > 1

        st = status(runtime.executor)
        @test st.metrics.total_requests == 40
        @test st.metrics.success_rate == 1.0

        shutdown!(runtime)
        println("✓ Burst autoscale passed")
    end

    @testset "Spike Workload (Sustained + Bursts)" begin
        d_model = 64
        seq_len = 8
        ao_dim = 16

        runtime = IntegratedRuntime(
            production_instances=0,
            encoder_instances=1,
            decoder_instances=0,
            alpha_omega_dimension=ao_dim,
            execution_mode=SEQUENTIAL,
            encoder_builder=tiny_encoder
        )
        start!(runtime)

        run = run_spike_workload!(
            runtime.scheduler;
            ticks=20,
            base_requests_per_tick=1,
            spike_every=5,
            spike_requests=15,
            request_builder=() -> RuntimeRequest(:encoder, Dict{Symbol, Any}(:input => randn(seq_len, d_model)); priority=5),
            autoscale=true,
            threshold_per_instance=6,
            snapshot_interval=5,
            name="test-spike"
        )
        summary = workload_summary(run)

        @test summary.steps > 0
        @test summary.errors == 0
        @test summary.scale_events > 0
        @test isfinite(summary.memory_growth_rss_mb)

        shutdown!(runtime)
        println("✓ Spike workload passed")
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# Performance Test: Full Pipeline
# ═══════════════════════════════════════════════════════════════════════════════

@testset "Full Pipeline Performance" begin
    println("\n>>> Running full pipeline performance test...")
    
    # Create integrated runtime
    runtime = IntegratedRuntime(
        production_instances=0,
        encoder_instances=1,
        decoder_instances=0,
        alpha_omega_dimension=64,
        execution_mode=SEQUENTIAL,
        encoder_builder=tiny_encoder
    )
    start!(runtime)
    
    # Test encoder pipeline
    x = randn(32, _TINY_D_MODEL)
    start_time = time()
    encoded, pooled = execute_encoder(runtime.executor, x)
    encoder_time = (time() - start_time) * 1000
    
    @test size(encoded) == (32, _TINY_D_MODEL)
    @test encoder_time < 5000  # Should complete within 5 seconds
    
    # Test Alpha-Omega pipeline
    y = randn(64)
    start_time = time()
    transformed = apply_alpha_omega!(runtime, y; pipeline=[:alpha, :phi, :spectral])
    ao_time = (time() - start_time) * 1000
    
    @test length(transformed) == 64
    @test ao_time < 1000  # Should complete within 1 second
    
    # Get status
    st = runtime_status(runtime)
    println("  Runtime uptime: $(round(st.uptime_seconds, digits=2))s")
    println("  Encoder time: $(round(encoder_time, digits=2))ms")
    println("  Alpha-Omega time: $(round(ao_time, digits=2))ms")
    
    shutdown!(runtime)
    
    println("✓ Full Pipeline Performance passed")
end

# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════

println()
println("=" ^ 80)
println("PRODUCTION TRANSFORMERS RUNTIME TESTS PASSED")
println("RSHIP-2026-PRODUCTION-TEST-001 - VALIDATED")
println("=" ^ 80)
