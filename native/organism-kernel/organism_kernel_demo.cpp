/**
 * organism_kernel_demo.cpp — Demo / smoke-test for the native kernel executor.
 *
 * Compile:
 *   g++ -std=c++20 -O2 -Wall -Wextra \
 *       -I../phi-math \
 *       organism_kernel_demo.cpp -o organism_kernel_demo
 *
 * Or via CMake:
 *   cmake -S .. -B build && cmake --build build
 */

#include "../phi-math/phi_math.hpp"
#include "organism_kernel.hpp"

#include <iostream>
#include <string>
#include <thread>
#include <chrono>

// ── Helper: pretty-print a KernelResult ──────────────────────────────────────

static void print_result(const organism::KernelResult& r) {
    std::cout << "  execId  : " << r.executionId      << "\n"
              << "  success : " << (r.success ? "true" : "false") << "\n"
              << "  output  : " << r.output            << "\n"
              << "  duration: " << r.durationUs << " µs\n"
              << "  budget% : " << r.resourcesUsed     << "%\n";
    if (!r.error.empty())
        std::cout << "  error   : " << r.error << "\n";
}

// ── Kernel implementations ────────────────────────────────────────────────────

// Phi-score kernel: scores a (priority, capability, reputation) triple
static std::string phi_score_kernel(const std::string& input,
                                    const organism::KernelConfig&) {
    // Very simple toy parser: "priority=2,cap=0.85,rep=0.9"
    int    prio = 2;
    double cap  = 0.85;
    double rep  = 0.90;
    // (In production, use a JSON parser)
    auto field = [&](const char* key, auto& out) {
        const std::string k = std::string(key) + "=";
        auto pos = input.find(k);
        if (pos != std::string::npos) {
            std::istringstream ss(input.substr(pos + k.size()));
            ss >> out;
        }
    };
    field("priority", prio);
    field("cap",      cap);
    field("rep",      rep);

    const double score = phi::phi_score(prio, cap, rep);
    return "{\"score\":" + std::to_string(score) + "}";
}

// Fibonacci kernel: returns Fibonacci sequence of length N
static std::string fib_kernel(const std::string& input,
                               const organism::KernelConfig&) {
    std::size_t n = 10;
    {
        auto pos = input.find("n=");
        if (pos != std::string::npos) {
            std::istringstream ss(input.substr(pos + 2));
            ss >> n;
        }
    }
    const auto seq = phi::fibonacci(n);
    std::string out = "{\"fib\":[";
    for (std::size_t i = 0; i < seq.size(); ++i) {
        if (i) out += ",";
        out += std::to_string(seq[i]);
    }
    out += "]}";
    return out;
}

// Kuramoto kernel: one step of the Kuramoto oscillator
static std::string kuramoto_kernel(const std::string& /*input*/,
                                   const organism::KernelConfig&) {
    // Four organism nodes at different natural frequencies
    std::vector<double> phases = {0.0, 1.0, 2.0, 3.0};
    std::vector<double> freqs  = {1.0, 1.1, 0.9, 1.05};
    const double coupling = 2.0;
    const double dt       = phi::HEARTBEAT_MS / 1000.0; // 0.873 s

    phi::kuramoto_step(phases, freqs, coupling, dt);
    const double r = phi::kuramoto_order(phases);

    std::string out = "{\"order_parameter\":" + std::to_string(r) + ",\"phases\":[";
    for (std::size_t i = 0; i < phases.size(); ++i) {
        if (i) out += ",";
        out += std::to_string(phases[i]);
    }
    out += "]}";
    return out;
}

// ── Main ─────────────────────────────────────────────────────────────────────

int main() {
    std::cout << "═══ Organism Kernel Executor — Demo ═══\n\n";

    organism::KernelExecutor executor;

    // ── Load kernels ──────────────────────────────────────────────────────────
    executor.loadKernel("phi-score", phi_score_kernel, {
        .priority       = organism::Priority::HIGH,
        .timeout        = std::chrono::microseconds{100'000}, // 100 ms
        .resourceBudget = 10.0,
        .description    = "φ-weighted routing score",
    });

    executor.loadKernel("fibonacci", fib_kernel, {
        .priority       = organism::Priority::NORMAL,
        .timeout        = std::chrono::microseconds{50'000},
        .resourceBudget = 5.0,
        .description    = "Fibonacci sequence generator",
    });

    executor.loadKernel("kuramoto", kuramoto_kernel, {
        .priority       = organism::Priority::CRITICAL,
        .timeout        = std::chrono::microseconds{200'000},
        .resourceBudget = 20.0,
        .description    = "Kuramoto cross-organism oscillator",
    });

    std::cout << "Loaded " << executor.kernelCount() << " kernels\n\n";

    // ── Execute immediately ───────────────────────────────────────────────────
    std::cout << "── phi-score kernel ──────────────────────────────────────\n";
    auto r1 = executor.execute("phi-score", "priority=2,cap=0.85,rep=0.9");
    print_result(r1);

    std::cout << "\n── fibonacci kernel (n=12) ───────────────────────────────\n";
    auto r2 = executor.execute("fibonacci", "n=12");
    print_result(r2);

    std::cout << "\n── kuramoto kernel ───────────────────────────────────────\n";
    auto r3 = executor.execute("kuramoto", "{}");
    print_result(r3);

    // ── Schedule a kernel for beat 1 ─────────────────────────────────────────
    std::cout << "\n── Scheduling phi-score for beat 1 ───────────────────────\n";
    const std::string sid = executor.schedule("phi-score", "priority=3,cap=0.95,rep=0.88", 1);
    std::cout << "  scheduleId: " << sid << "\n";

    // Simulate heartbeat tick
    const std::size_t ran = executor.onBeat(1);
    std::cout << "  Kernels executed on beat 1: " << ran << "\n";

    // ── Phi-coordinate demo ───────────────────────────────────────────────────
    std::cout << "\n── Phi coordinates (indices 0–4) ─────────────────────────\n";
    for (std::size_t i = 0; i < 5; ++i) {
        const phi::PhiCoord c = phi::phi_coordinate(i);
        std::cout << "  [" << i << "] θ=" << c.theta
                  << " φ=" << c.phi
                  << " ρ=" << c.rho
                  << " ring=" << c.ring
                  << " beat=" << c.beat << "\n";
    }

    // ── Execution log ─────────────────────────────────────────────────────────
    std::cout << "\n── Execution log (last 10) ───────────────────────────────\n";
    for (const auto& entry : executor.getLog(10))
        std::cout << "  " << entry << "\n";

    std::cout << "\n═══ Demo complete ═══\n";
    return 0;
}
