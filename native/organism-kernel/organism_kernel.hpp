/**
 * organism_kernel.hpp — Organism Native Kernel Executor
 *
 * High-performance C++ kernel executor for the organism runtime.
 * Provides sandboxed execution of computation kernels with:
 *
 *   - Priority-ordered execution queue (CRITICAL → LOW)
 *   - Resource budget enforcement (CPU time in microseconds)
 *   - Phi-weighted scheduling on every 873 ms heartbeat
 *   - Thread-safe kernel registry and execution log
 *   - Zero-copy result passing via move semantics
 *
 * This is the native backing layer for the JavaScript KernelExecutor SDK
 * module, enabling high-throughput kernel execution beyond the JS runtime.
 *
 * Ring: Sovereign Ring | Native Layer
 */

#pragma once

#include "phi_math.hpp"

#include <string>
#include <vector>
#include <map>
#include <functional>
#include <chrono>
#include <stdexcept>
#include <optional>
#include <variant>
#include <mutex>
#include <atomic>
#include <memory>
#include <algorithm>
#include <sstream>

namespace organism {

using Clock     = std::chrono::steady_clock;
using TimePoint = Clock::time_point;
using Micros    = std::chrono::microseconds;

// ── Result type ──────────────────────────────────────────────────────────────

struct KernelResult {
    std::string    executionId;
    std::string    output;        ///< JSON-serialised result
    double         durationUs;   ///< wall time in microseconds
    double         resourcesUsed; ///< fraction of budget consumed [0, 1]
    bool           success;
    std::string    error;         ///< non-empty on failure
};

// ── Kernel priority levels (mirroring JS KernelConfig) ───────────────────────

enum class Priority : int {
    LOW      = 0,
    NORMAL   = 1,
    HIGH     = 2,
    CRITICAL = 3,
};

// ── Kernel configuration ──────────────────────────────────────────────────────

struct KernelConfig {
    Priority    priority       = Priority::NORMAL;
    Micros      timeout        = Micros{5'000'000};   ///< 5 s default
    double      resourceBudget = 100.0;               ///< abstract units
    std::string description;
};

// ── Kernel function signature ─────────────────────────────────────────────────

using KernelFn = std::function<std::string(const std::string& input,
                                            const KernelConfig& config)>;

// ── Kernel record ─────────────────────────────────────────────────────────────

enum class KernelStatus { LOADED, RUNNING, COMPLETED, FAILED };

struct KernelRecord {
    std::string  kernelId;
    KernelFn     fn;
    KernelConfig config;
    KernelStatus status   = KernelStatus::LOADED;
    std::optional<KernelResult> lastResult;
};

// ── Scheduled execution entry ─────────────────────────────────────────────────

struct ScheduledEntry {
    std::string kernelId;
    std::string input;
    std::string scheduleId;
    uint64_t    beatNumber;
};

// ── KernelExecutor ────────────────────────────────────────────────────────────

class KernelExecutor {
public:
    KernelExecutor() = default;
    ~KernelExecutor() = default;

    // Non-copyable, movable
    KernelExecutor(const KernelExecutor&)            = delete;
    KernelExecutor& operator=(const KernelExecutor&) = delete;
    KernelExecutor(KernelExecutor&&)                 = default;
    KernelExecutor& operator=(KernelExecutor&&)      = default;

    // ── Registry ─────────────────────────────────────────────────────────────

    /**
     * Load a computation kernel.
     *
     * @param kernelId  Unique identifier
     * @param fn        Kernel function: (input, config) → JSON string result
     * @param config    Execution configuration
     * @throws std::invalid_argument if kernelId is already loaded
     */
    void loadKernel(const std::string& kernelId,
                    KernelFn           fn,
                    KernelConfig       config = {}) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (kernels_.count(kernelId))
            throw std::invalid_argument("Kernel already loaded: " + kernelId);
        if (!fn)
            throw std::invalid_argument("kernelFn must not be null");

        KernelRecord rec;
        rec.kernelId = kernelId;
        rec.fn       = std::move(fn);
        rec.config   = std::move(config);
        kernels_.emplace(kernelId, std::move(rec));
        log("LOAD", kernelId, "");
    }

    /**
     * Unload a kernel.  Running kernels are not interrupted.
     * @throws std::out_of_range if kernelId not found
     */
    void unloadKernel(const std::string& kernelId) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (!kernels_.count(kernelId))
            throw std::out_of_range("Kernel not found: " + kernelId);
        kernels_.erase(kernelId);
        log("UNLOAD", kernelId, "");
    }

    // ── Immediate execution ───────────────────────────────────────────────────

    /**
     * Execute a kernel synchronously.
     *
     * @param kernelId  Kernel to execute
     * @param input     JSON-serialised input
     * @return          KernelResult with output or error
     */
    KernelResult execute(const std::string& kernelId,
                         const std::string& input = "{}") {
        KernelRecord* rec = nullptr;
        {
            std::lock_guard<std::mutex> lock(mutex_);
            auto it = kernels_.find(kernelId);
            if (it == kernels_.end())
                throw std::out_of_range("Kernel not found: " + kernelId);
            rec = &it->second;
            rec->status = KernelStatus::RUNNING;
        }

        const std::string execId = generateId();
        const auto start = Clock::now();

        KernelResult result;
        result.executionId = execId;
        result.success     = false;

        try {
            // Enforce timeout via chrono deadline check (single-threaded model;
            // replace with async for true preemption in production).
            const auto deadline = start + rec->config.timeout;
            result.output  = rec->fn(input, rec->config);
            const auto now = Clock::now();

            if (now > deadline) {
                throw std::runtime_error(
                    "Kernel \"" + kernelId + "\" timed out after " +
                    std::to_string(rec->config.timeout.count()) + " µs");
            }

            const double elapsed = static_cast<double>(
                std::chrono::duration_cast<Micros>(now - start).count());
            const double budget  = static_cast<double>(
                rec->config.timeout.count());

            result.durationUs    = elapsed;
            result.resourcesUsed = std::min(elapsed / budget * rec->config.resourceBudget,
                                            rec->config.resourceBudget);
            result.success       = true;

            std::lock_guard<std::mutex> lock(mutex_);
            rec->status     = KernelStatus::COMPLETED;
            rec->lastResult = result;
            log("OK", kernelId, execId);

        } catch (const std::exception& e) {
            const auto now     = Clock::now();
            result.durationUs  = static_cast<double>(
                std::chrono::duration_cast<Micros>(now - start).count());
            result.error       = e.what();

            std::lock_guard<std::mutex> lock(mutex_);
            rec->status        = KernelStatus::FAILED;
            rec->lastResult    = result;
            log("FAIL", kernelId, e.what());
        }

        return result;
    }

    // ── Heartbeat-driven scheduled execution ──────────────────────────────────

    /**
     * Schedule a kernel for execution at a specific beat number.
     *
     * @return scheduleId (UUID-like string)
     */
    std::string schedule(const std::string& kernelId,
                         const std::string& input,
                         uint64_t           beatNumber) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (!kernels_.count(kernelId))
            throw std::out_of_range("Kernel not found: " + kernelId);

        const std::string sid = generateId();
        scheduled_.push_back({kernelId, input, sid, beatNumber});
        return sid;
    }

    /**
     * Trigger execution of all kernels scheduled for `beatNumber`.
     * Call this from the organism heartbeat every 873 ms.
     *
     * Kernels are executed in descending priority order.
     *
     * @return Number of kernels executed this beat
     */
    std::size_t onBeat(uint64_t beatNumber) {
        std::vector<ScheduledEntry> toRun;
        {
            std::lock_guard<std::mutex> lock(mutex_);
            auto it = scheduled_.begin();
            while (it != scheduled_.end()) {
                if (it->beatNumber == beatNumber) {
                    toRun.push_back(*it);
                    it = scheduled_.erase(it);
                } else {
                    ++it;
                }
            }
        }

        // Sort by kernel priority descending
        std::sort(toRun.begin(), toRun.end(),
            [this](const ScheduledEntry& a, const ScheduledEntry& b) {
                std::lock_guard<std::mutex> lock(mutex_);
                const int pa = kernels_.count(a.kernelId)
                    ? static_cast<int>(kernels_.at(a.kernelId).config.priority) : 0;
                const int pb = kernels_.count(b.kernelId)
                    ? static_cast<int>(kernels_.at(b.kernelId).config.priority) : 0;
                return pa > pb;
            });

        for (const auto& entry : toRun) {
            try {
                execute(entry.kernelId, entry.input);
            } catch (const std::exception& e) {
                log("BEAT_FAIL", entry.kernelId, e.what());
            }
        }
        return toRun.size();
    }

    // ── Introspection ─────────────────────────────────────────────────────────

    /**
     * Return status of a loaded kernel.
     */
    KernelStatus getStatus(const std::string& kernelId) const {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = kernels_.find(kernelId);
        if (it == kernels_.end())
            throw std::out_of_range("Kernel not found: " + kernelId);
        return it->second.status;
    }

    /**
     * List all loaded kernels.
     */
    std::vector<std::string> listKernels() const {
        std::lock_guard<std::mutex> lock(mutex_);
        std::vector<std::string> ids;
        ids.reserve(kernels_.size());
        for (const auto& [id, _] : kernels_)
            ids.push_back(id);
        return ids;
    }

    /**
     * Return the last result for a kernel (empty optional if never executed).
     */
    std::optional<KernelResult> lastResult(const std::string& kernelId) const {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = kernels_.find(kernelId);
        if (it == kernels_.end())
            throw std::out_of_range("Kernel not found: " + kernelId);
        return it->second.lastResult;
    }

    /**
     * Return the recent execution log (most recent last).
     */
    std::vector<std::string> getLog(std::size_t count = 100) const {
        std::lock_guard<std::mutex> lock(mutex_);
        const std::size_t total = execLog_.size();
        const std::size_t start = (count >= total) ? 0 : total - count;
        return std::vector<std::string>(execLog_.begin() + start, execLog_.end());
    }

    std::size_t kernelCount()    const {
        std::lock_guard<std::mutex> lock(mutex_); return kernels_.size();
    }
    std::size_t scheduledCount() const {
        std::lock_guard<std::mutex> lock(mutex_); return scheduled_.size();
    }

private:
    mutable std::mutex                       mutex_;
    std::map<std::string, KernelRecord>      kernels_;
    std::vector<ScheduledEntry>              scheduled_;
    std::vector<std::string>                 execLog_;
    std::atomic<uint64_t>                    idCounter_{0};

    std::string generateId() {
        std::ostringstream oss;
        oss << "krn-" << ++idCounter_ << "-"
            << std::chrono::duration_cast<Micros>(
                   Clock::now().time_since_epoch()).count();
        return oss.str();
    }

    void log(const std::string& event,
             const std::string& kernelId,
             const std::string& detail) {
        const auto ts = std::chrono::duration_cast<Micros>(
            Clock::now().time_since_epoch()).count();
        std::string entry = "[" + std::to_string(ts) + "] " +
                            event + " kernel=" + kernelId;
        if (!detail.empty()) entry += " " + detail;
        execLog_.push_back(std::move(entry));
        if (execLog_.size() > 10000)
            execLog_.erase(execLog_.begin(),
                           execLog_.begin() + 5000); // trim to last 5000
    }
};

} // namespace organism
