/**
 * nova_chip.hpp — Nova Virtual Chip Architecture
 *
 * The organism IS a chip. Every engine, every transformer, every mesh
 * is a processing unit on a virtual die. This header defines the
 * complete Nova Chip ISA (Instruction Set Architecture) and hardware
 * abstraction for the organism runtime.
 *
 * Architecture:
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │                    NOVA CHIP DIE LAYOUT                         │
 *   ├─────────┬─────────┬─────────┬─────────┬─────────┬─────────────┤
 *   │  CORE-0 │  CORE-1 │  CORE-2 │  CORE-3 │  CORE-4 │   CORE-5    │
 *   │ (Sov.)  │ (Intel.)│ (Trans.)│ (Infer.)│ (Mem.)  │  (Emerg.)   │
 *   ├─────────┴─────────┴─────────┴─────────┴─────────┴─────────────┤
 *   │              NOVA INTERCONNECT BUS (φ-clock)                    │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  L1-CACHE │ L2-CACHE │ REGISTER FILE │ PIPELINE │ DMA ENGINE   │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │              MEMORY CONTROLLER (KV-Cache / Weight Store)        │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │              I/O RING (Task Input / Token Output)               │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Cores:
 *   Core 0: Sovereign Controller — orchestrates all other cores
 *   Core 1: Intelligence Core — reasoning, planning, chain-of-thought
 *   Core 2: Transformer Core — attention, FFN, normalization pipelines
 *   Core 3: Inference Core — token generation, speculative decoding
 *   Core 4: Memory Core — KV-cache, weight management, holographic recall
 *   Core 5: Emergence Core — phase detection, novelty, adaptation
 *
 * Clock: φ-frequency (1/873ms base cycle, overclockable to GHz virtual)
 * ISA: NOVA-ISA-v1 with 64 instructions, 32 registers, 8 pipelines
 * Bus: 512-bit wide φ-interconnect with priority lanes
 *
 * Ring: Sovereign Ring | Native Layer (C++)
 * © 2026 Medina Tech · Dallas, Texas
 */

#pragma once

#include "phi_math.hpp"

#include <string>
#include <vector>
#include <array>
#include <map>
#include <queue>
#include <memory>
#include <atomic>
#include <mutex>
#include <thread>
#include <chrono>
#include <functional>
#include <cstdint>
#include <cmath>
#include <bitset>
#include <optional>
#include <variant>

namespace organism { namespace nova {

using Clock     = std::chrono::steady_clock;
using TimePoint = Clock::time_point;

// ═══════════════════════════════════════════════════════════════════════════════
// NOVA CHIP CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

constexpr int NUM_CORES         = 6;       // Physical cores on die
constexpr int NUM_REGISTERS     = 32;      // Per-core register file
constexpr int NUM_PIPELINES     = 8;       // Execution pipelines
constexpr int BUS_WIDTH_BITS    = 512;     // Interconnect bus width
constexpr int L1_CACHE_KB       = 256;     // Per-core L1
constexpr int L2_CACHE_MB       = 16;      // Shared L2
constexpr int L3_CACHE_MB       = 256;     // Die-level L3 (weight cache)
constexpr int MAX_INSTRUCTIONS  = 64;      // ISA instruction count
constexpr int PIPELINE_DEPTH    = 5;       // Stages per pipeline

// Clock frequencies (virtual)
constexpr double BASE_CLOCK_HZ  = 1.0 / 0.873;    // ~1.145 Hz (heartbeat)
constexpr double TURBO_CLOCK_HZ = 4'000'000'000.0; // 4 GHz virtual turbo
constexpr double PHI_CLOCK_HZ   = phi::PHI * 1e9;  // φ GHz ≈ 1.618 GHz

// ═══════════════════════════════════════════════════════════════════════════════
// NOVA ISA (Instruction Set Architecture)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Nova Instruction Opcodes — The organism's native instruction set.
 * Each instruction maps to a fundamental organism operation.
 */
enum class Opcode : uint8_t {
    // ── Arithmetic & Logic (0x00-0x0F) ──
    NOP       = 0x00,  // No operation
    ADD       = 0x01,  // Add registers
    MUL       = 0x02,  // Multiply (matrix mul for tensors)
    FMA       = 0x03,  // Fused multiply-add
    DOT       = 0x04,  // Dot product (attention score)
    SOFTMAX   = 0x05,  // Softmax activation
    GELU      = 0x06,  // GeLU activation
    SWIGLU    = 0x07,  // SwiGLU (LLaMA FFN)
    RMSNORM   = 0x08,  // RMS normalization
    ROPE      = 0x09,  // Rotary position embedding
    QUANTIZE  = 0x0A,  // Quantize tensor (FP→INT4)
    DEQUANT   = 0x0B,  // Dequantize tensor (INT4→FP)

    // ── Memory Operations (0x10-0x1F) ──
    LOAD      = 0x10,  // Load from weight store
    STORE     = 0x11,  // Store to cache
    KV_READ   = 0x12,  // Read from KV-cache
    KV_WRITE  = 0x13,  // Write to KV-cache
    KV_EVICT  = 0x14,  // Evict KV-cache entries
    MMAP      = 0x15,  // Memory-map weight file
    PREFETCH  = 0x16,  // Prefetch next layer weights
    DMA_COPY  = 0x17,  // DMA transfer between cores

    // ── Control Flow (0x20-0x2F) ──
    BRANCH    = 0x20,  // Conditional branch
    CALL      = 0x21,  // Call subroutine (invoke engine)
    RET       = 0x22,  // Return from subroutine
    YIELD     = 0x23,  // Yield to scheduler
    HALT      = 0x24,  // Halt core
    BARRIER   = 0x25,  // Synchronization barrier
    FORK      = 0x26,  // Fork execution to another core
    JOIN      = 0x27,  // Join forked execution

    // ── Inference Operations (0x30-0x3F) ──
    GENERATE  = 0x30,  // Generate next token
    SAMPLE    = 0x31,  // Sample from logits
    SPEC_DRAFT= 0x32,  // Speculative: draft tokens
    SPEC_VERIFY=0x33,  // Speculative: verify batch
    DECODE    = 0x34,  // Decode token to text
    ENCODE    = 0x35,  // Encode text to tokens
    ATTEND    = 0x36,  // Full attention pass
    FFN_PASS  = 0x37,  // Feed-forward network pass

    // ── Organism Operations (0x40-0x4F) ──
    HEARTBEAT = 0x40,  // φ-heartbeat cycle
    EMERGE    = 0x41,  // Trigger emergence detection
    RESONATE  = 0x42,  // φ-resonance between cores
    CONSENSUS = 0x43,  // Swarm consensus round
    CHECKPOINT= 0x44,  // Save state checkpoint
    RECOVER   = 0x45,  // Recover from checkpoint
    ADAPT     = 0x46,  // Adaptive parameter update
    SEAL      = 0x47,  // Cryptographic seal (block box)
};

inline const char* opcode_name(Opcode op) {
    switch (op) {
        case Opcode::NOP:       return "NOP";
        case Opcode::ADD:       return "ADD";
        case Opcode::MUL:       return "MUL";
        case Opcode::FMA:       return "FMA";
        case Opcode::DOT:       return "DOT";
        case Opcode::SOFTMAX:   return "SOFTMAX";
        case Opcode::GELU:      return "GELU";
        case Opcode::SWIGLU:    return "SWIGLU";
        case Opcode::RMSNORM:   return "RMSNORM";
        case Opcode::ROPE:      return "ROPE";
        case Opcode::QUANTIZE:  return "QUANTIZE";
        case Opcode::DEQUANT:   return "DEQUANT";
        case Opcode::LOAD:      return "LOAD";
        case Opcode::STORE:     return "STORE";
        case Opcode::KV_READ:   return "KV_READ";
        case Opcode::KV_WRITE:  return "KV_WRITE";
        case Opcode::KV_EVICT:  return "KV_EVICT";
        case Opcode::MMAP:      return "MMAP";
        case Opcode::PREFETCH:  return "PREFETCH";
        case Opcode::DMA_COPY:  return "DMA_COPY";
        case Opcode::BRANCH:    return "BRANCH";
        case Opcode::CALL:      return "CALL";
        case Opcode::RET:       return "RET";
        case Opcode::YIELD:     return "YIELD";
        case Opcode::HALT:      return "HALT";
        case Opcode::BARRIER:   return "BARRIER";
        case Opcode::FORK:      return "FORK";
        case Opcode::JOIN:      return "JOIN";
        case Opcode::GENERATE:  return "GENERATE";
        case Opcode::SAMPLE:    return "SAMPLE";
        case Opcode::SPEC_DRAFT:return "SPEC_DRAFT";
        case Opcode::SPEC_VERIFY:return "SPEC_VERIFY";
        case Opcode::DECODE:    return "DECODE";
        case Opcode::ENCODE:    return "ENCODE";
        case Opcode::ATTEND:    return "ATTEND";
        case Opcode::FFN_PASS:  return "FFN_PASS";
        case Opcode::HEARTBEAT: return "HEARTBEAT";
        case Opcode::EMERGE:    return "EMERGE";
        case Opcode::RESONATE:  return "RESONATE";
        case Opcode::CONSENSUS: return "CONSENSUS";
        case Opcode::CHECKPOINT:return "CHECKPOINT";
        case Opcode::RECOVER:   return "RECOVER";
        case Opcode::ADAPT:     return "ADAPT";
        case Opcode::SEAL:      return "SEAL";
    }
    return "UNKNOWN";
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTRUCTION FORMAT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Nova Instruction — 64-bit encoded instruction word.
 *
 * Format: [opcode:8][dst:5][src1:5][src2:5][imm:16][flags:8][reserved:17]
 */
struct Instruction {
    Opcode   opcode;
    uint8_t  dst;        // Destination register (0-31)
    uint8_t  src1;       // Source register 1
    uint8_t  src2;       // Source register 2
    uint16_t immediate;  // Immediate value / offset
    uint8_t  flags;      // Condition flags, width specifier

    Instruction() : opcode(Opcode::NOP), dst(0), src1(0), src2(0),
                    immediate(0), flags(0) {}

    Instruction(Opcode op, uint8_t d, uint8_t s1, uint8_t s2,
                uint16_t imm = 0, uint8_t fl = 0)
        : opcode(op), dst(d), src1(s1), src2(s2), immediate(imm), flags(fl) {}

    /** Encode to 64-bit word */
    uint64_t encode() const {
        uint64_t word = 0;
        word |= static_cast<uint64_t>(opcode) << 56;
        word |= static_cast<uint64_t>(dst & 0x1F) << 51;
        word |= static_cast<uint64_t>(src1 & 0x1F) << 46;
        word |= static_cast<uint64_t>(src2 & 0x1F) << 41;
        word |= static_cast<uint64_t>(immediate) << 25;
        word |= static_cast<uint64_t>(flags) << 17;
        return word;
    }

    /** Decode from 64-bit word */
    static Instruction decode(uint64_t word) {
        Instruction instr;
        instr.opcode    = static_cast<Opcode>((word >> 56) & 0xFF);
        instr.dst       = (word >> 51) & 0x1F;
        instr.src1      = (word >> 46) & 0x1F;
        instr.src2      = (word >> 41) & 0x1F;
        instr.immediate = (word >> 25) & 0xFFFF;
        instr.flags     = (word >> 17) & 0xFF;
        return instr;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTER FILE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Register value — can hold scalar, vector reference, or pointer.
 */
using RegisterValue = std::variant<
    double,          // Scalar (float64)
    int64_t,         // Integer
    uint64_t,        // Address / pointer
    std::vector<float>*  // Tensor reference
>;

/**
 * Per-core register file — 32 general-purpose + special registers.
 */
struct RegisterFile {
    std::array<RegisterValue, NUM_REGISTERS> gpr;  // General purpose
    uint64_t pc;           // Program counter
    uint64_t sp;           // Stack pointer
    uint64_t fp;           // Frame pointer
    uint64_t lr;           // Link register (return address)
    uint64_t status;       // Status register (flags)
    double   phi_accum;    // φ-accumulator for resonance

    RegisterFile() : pc(0), sp(0), fp(0), lr(0), status(0),
                     phi_accum(phi::PHI) {
        for (auto& r : gpr) r = int64_t(0);
    }

    void set_scalar(int idx, double val) { gpr[idx] = val; }
    void set_int(int idx, int64_t val)   { gpr[idx] = val; }
    void set_addr(int idx, uint64_t val) { gpr[idx] = val; }

    double get_scalar(int idx) const {
        if (auto* v = std::get_if<double>(&gpr[idx])) return *v;
        if (auto* v = std::get_if<int64_t>(&gpr[idx])) return static_cast<double>(*v);
        return 0.0;
    }

    int64_t get_int(int idx) const {
        if (auto* v = std::get_if<int64_t>(&gpr[idx])) return *v;
        if (auto* v = std::get_if<double>(&gpr[idx])) return static_cast<int64_t>(*v);
        return 0;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE STAGE
// ═══════════════════════════════════════════════════════════════════════════════

enum class PipelineStage : int {
    FETCH     = 0,  // Fetch instruction
    DECODE    = 1,  // Decode opcode & operands
    EXECUTE   = 2,  // Execute operation
    MEMORY    = 3,  // Memory access
    WRITEBACK = 4,  // Write results
};

/**
 * Pipeline slot — one instruction in flight.
 */
struct PipelineSlot {
    PipelineStage stage;
    Instruction   instr;
    bool          valid;
    bool          stalled;
    uint64_t      cycle_entered;

    PipelineSlot() : stage(PipelineStage::FETCH), valid(false),
                     stalled(false), cycle_entered(0) {}
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOVA CORE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Core specialization types — each core has a designated role.
 */
enum class CoreRole : int {
    SOVEREIGN    = 0,  // Orchestrator / scheduler
    INTELLIGENCE = 1,  // Reasoning & planning
    TRANSFORMER  = 2,  // Attention & FFN
    INFERENCE    = 3,  // Token generation
    MEMORY       = 4,  // KV-cache & weight management
    EMERGENCE    = 5,  // Phase detection & adaptation
};

inline const char* core_role_name(CoreRole r) {
    switch (r) {
        case CoreRole::SOVEREIGN:    return "SOVEREIGN";
        case CoreRole::INTELLIGENCE: return "INTELLIGENCE";
        case CoreRole::TRANSFORMER:  return "TRANSFORMER";
        case CoreRole::INFERENCE:    return "INFERENCE";
        case CoreRole::MEMORY:       return "MEMORY";
        case CoreRole::EMERGENCE:    return "EMERGENCE";
    }
    return "UNKNOWN";
}

/**
 * Core state enumeration.
 */
enum class CoreState : int {
    IDLE      = 0,
    RUNNING   = 1,
    STALLED   = 2,  // Waiting on memory / barrier
    HALTED    = 3,
    SLEEPING  = 4,  // Power-saving
};

/**
 * Nova Core — One processing unit on the virtual die.
 *
 * Each core has:
 *   - 32 registers
 *   - 8 pipeline stages (superscalar)
 *   - L1 cache (256KB)
 *   - Instruction queue
 *   - Performance counters
 */
struct NovaCore {
    int              id;
    CoreRole         role;
    CoreState        state;
    RegisterFile     regs;

    // Pipeline (superscalar: 8 slots)
    std::array<PipelineSlot, NUM_PIPELINES> pipeline;

    // Instruction queue
    std::queue<Instruction> instr_queue;
    int max_queue_depth;

    // Performance counters
    uint64_t cycles_executed;
    uint64_t instructions_retired;
    uint64_t cache_hits;
    uint64_t cache_misses;
    uint64_t stall_cycles;
    uint64_t branch_predictions;
    uint64_t branch_misses;
    double   ipc;  // Instructions per cycle

    // Thermal
    double   temperature_c;
    double   power_watts;
    double   clock_mhz;

    // Local memory (L1 simulation)
    std::vector<float> l1_cache;

    NovaCore(int core_id, CoreRole core_role)
        : id(core_id), role(core_role), state(CoreState::IDLE),
          max_queue_depth(256),
          cycles_executed(0), instructions_retired(0),
          cache_hits(0), cache_misses(0), stall_cycles(0),
          branch_predictions(0), branch_misses(0), ipc(0.0),
          temperature_c(35.0), power_watts(5.0),
          clock_mhz(PHI_CLOCK_HZ / 1e6)
    {
        l1_cache.resize(L1_CACHE_KB * 1024 / sizeof(float), 0.0f);
    }

    /** Queue an instruction for execution */
    bool enqueue(const Instruction& instr) {
        if (static_cast<int>(instr_queue.size()) >= max_queue_depth) return false;
        instr_queue.push(instr);
        return true;
    }

    /** Execute one cycle — advance pipeline */
    void tick() {
        if (state == CoreState::HALTED || state == CoreState::SLEEPING) return;

        cycles_executed++;

        // Advance pipeline stages (from back to front to avoid overwrites)
        for (int p = NUM_PIPELINES - 1; p >= 0; --p) {
            auto& slot = pipeline[p];
            if (!slot.valid) continue;

            if (slot.stalled) {
                stall_cycles++;
                continue;
            }

            // Advance stage
            int stage_val = static_cast<int>(slot.stage);
            if (stage_val < static_cast<int>(PipelineStage::WRITEBACK)) {
                slot.stage = static_cast<PipelineStage>(stage_val + 1);
            } else {
                // Instruction retired
                instructions_retired++;
                slot.valid = false;
            }
        }

        // Fetch new instruction into empty pipeline slot
        if (!instr_queue.empty()) {
            for (auto& slot : pipeline) {
                if (!slot.valid) {
                    slot.instr = instr_queue.front();
                    instr_queue.pop();
                    slot.stage = PipelineStage::FETCH;
                    slot.valid = true;
                    slot.stalled = false;
                    slot.cycle_entered = cycles_executed;
                    break;
                }
            }
        }

        // Update IPC
        if (cycles_executed > 0) {
            ipc = static_cast<double>(instructions_retired) /
                  static_cast<double>(cycles_executed);
        }

        // Update state
        state = instr_queue.empty() && !any_pipeline_active()
                ? CoreState::IDLE : CoreState::RUNNING;
    }

    bool any_pipeline_active() const {
        for (auto& s : pipeline) if (s.valid) return true;
        return false;
    }

    /** Get core utilization (0-1) */
    double utilization() const {
        if (cycles_executed == 0) return 0.0;
        return 1.0 - (static_cast<double>(stall_cycles) /
                       static_cast<double>(cycles_executed));
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOVA BUS (φ-Interconnect)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bus message — data transferred between cores.
 */
struct BusMessage {
    int      src_core;
    int      dst_core;    // -1 = broadcast
    Opcode   opcode;      // What operation triggered this
    uint64_t address;     // Memory address or register reference
    uint64_t payload;     // Data payload
    int      priority;    // 0=low, 3=critical
    uint64_t timestamp;   // Cycle when sent
};

/**
 * Nova Interconnect Bus — 512-bit wide φ-clocked bus.
 * Priority lanes ensure sovereign operations never stall.
 */
struct NovaBus {
    std::array<std::queue<BusMessage>, 4> priority_lanes;  // 4 priority levels
    uint64_t total_transfers;
    uint64_t total_bytes;
    uint64_t bus_cycles;
    double   bandwidth_gbps;  // Current bandwidth utilization
    mutable std::mutex bus_mutex;

    NovaBus() : total_transfers(0), total_bytes(0), bus_cycles(0),
                bandwidth_gbps(0.0) {}

    /** Send message on the bus */
    void send(const BusMessage& msg) {
        std::lock_guard<std::mutex> lock(bus_mutex);
        int lane = std::min(msg.priority, 3);
        priority_lanes[lane].push(msg);
        total_transfers++;
        total_bytes += BUS_WIDTH_BITS / 8;  // One bus-width transfer
    }

    /** Receive next message for a core (priority-ordered) */
    std::optional<BusMessage> receive(int core_id) {
        std::lock_guard<std::mutex> lock(bus_mutex);
        // Check from highest priority to lowest
        for (int p = 3; p >= 0; --p) {
            auto& lane = priority_lanes[p];
            // Find message destined for this core
            std::queue<BusMessage> temp;
            std::optional<BusMessage> found;
            while (!lane.empty()) {
                auto msg = lane.front();
                lane.pop();
                if (!found && (msg.dst_core == core_id || msg.dst_core == -1)) {
                    found = msg;
                } else {
                    temp.push(msg);
                }
            }
            // Put remaining back
            while (!temp.empty()) {
                lane.push(temp.front());
                temp.pop();
            }
            if (found) return found;
        }
        return std::nullopt;
    }

    /** Tick the bus — process one cycle */
    void tick() {
        bus_cycles++;
        // Update bandwidth metric
        if (bus_cycles > 0) {
            bandwidth_gbps = (static_cast<double>(total_bytes) / 1e9) /
                             (static_cast<double>(bus_cycles) * 0.873 / 1000.0);
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOVA CHIP (Complete Virtual Processor)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NovaChip — The complete virtual processor that IS the organism.
 *
 * Contains:
 *   - 6 specialized cores
 *   - φ-interconnect bus
 *   - Shared L2/L3 cache
 *   - Memory controller
 *   - DMA engine
 *   - Thermal monitor
 *   - Clock manager
 */
class NovaChip {
public:
    NovaChip() : cycle_count_(0), running_(false), clock_hz_(PHI_CLOCK_HZ) {
        // Initialize cores with their roles
        cores_[0] = std::make_unique<NovaCore>(0, CoreRole::SOVEREIGN);
        cores_[1] = std::make_unique<NovaCore>(1, CoreRole::INTELLIGENCE);
        cores_[2] = std::make_unique<NovaCore>(2, CoreRole::TRANSFORMER);
        cores_[3] = std::make_unique<NovaCore>(3, CoreRole::INFERENCE);
        cores_[4] = std::make_unique<NovaCore>(4, CoreRole::MEMORY);
        cores_[5] = std::make_unique<NovaCore>(5, CoreRole::EMERGENCE);

        // Allocate shared caches
        l2_cache_.resize(L2_CACHE_MB * 1024 * 1024 / sizeof(float), 0.0f);
        // L3 is too large to fully allocate — use lazy allocation
        l3_allocated_mb_ = 0;

        start_time_ = Clock::now();
    }

    // ── Lifecycle ────────────────────────────────────────────────────────

    /** Power on the chip — all cores to IDLE */
    void power_on() {
        running_ = true;
        for (auto& core : cores_) {
            core->state = CoreState::IDLE;
        }
    }

    /** Power off — halt all cores */
    void power_off() {
        running_ = false;
        for (auto& core : cores_) {
            core->state = CoreState::HALTED;
        }
    }

    // ── Clock ────────────────────────────────────────────────────────────

    /** Execute one clock cycle across all cores and bus */
    void tick() {
        if (!running_) return;
        cycle_count_++;

        // Tick all cores
        for (auto& core : cores_) {
            core->tick();
        }

        // Tick the bus
        bus_.tick();

        // Heartbeat check (every ~873 virtual cycles at base clock)
        if (cycle_count_ % 873 == 0) {
            heartbeat();
        }
    }

    /** Execute N cycles */
    void run_cycles(uint64_t n) {
        for (uint64_t i = 0; i < n; ++i) tick();
    }

    // ── Instruction Dispatch ─────────────────────────────────────────────

    /** Dispatch instruction to appropriate core */
    bool dispatch(const Instruction& instr) {
        int target = route_instruction(instr);
        return cores_[target]->enqueue(instr);
    }

    /** Dispatch a batch of instructions (for pipelining) */
    int dispatch_batch(const std::vector<Instruction>& instrs) {
        int dispatched = 0;
        for (auto& instr : instrs) {
            if (dispatch(instr)) dispatched++;
        }
        return dispatched;
    }

    // ── Program Execution ────────────────────────────────────────────────

    /**
     * Execute a transformer layer as a sequence of Nova instructions.
     * This is the fundamental operation: one layer = one program.
     */
    std::vector<Instruction> compile_transformer_layer(int layer_idx) {
        std::vector<Instruction> program;

        // RMSNorm → Attention → Residual → RMSNorm → FFN → Residual
        program.push_back({Opcode::RMSNORM, 0, 0, 0, static_cast<uint16_t>(layer_idx)});
        program.push_back({Opcode::ROPE, 1, 0, 0});
        program.push_back({Opcode::KV_WRITE, 2, 1, 0});
        program.push_back({Opcode::KV_READ, 3, 0, 0});
        program.push_back({Opcode::DOT, 4, 1, 3});        // Q·K^T
        program.push_back({Opcode::SOFTMAX, 5, 4, 0});    // softmax(scores)
        program.push_back({Opcode::MUL, 6, 5, 3});        // attn · V
        program.push_back({Opcode::ADD, 7, 6, 0});        // residual
        program.push_back({Opcode::RMSNORM, 8, 7, 0});    // FFN norm
        program.push_back({Opcode::SWIGLU, 9, 8, 0});     // SwiGLU FFN
        program.push_back({Opcode::ADD, 10, 9, 7});       // residual
        program.push_back({Opcode::STORE, 0, 10, 0, static_cast<uint16_t>(layer_idx)});

        return program;
    }

    /**
     * Compile full 70B forward pass (80 layers).
     */
    std::vector<Instruction> compile_forward_pass() {
        std::vector<Instruction> program;

        // Encode input
        program.push_back({Opcode::ENCODE, 0, 0, 0});
        program.push_back({Opcode::LOAD, 1, 0, 0});  // Load embeddings

        // 80 transformer layers
        for (int l = 0; l < 80; ++l) {
            auto layer_prog = compile_transformer_layer(l);
            program.insert(program.end(), layer_prog.begin(), layer_prog.end());

            // Prefetch next layer
            if (l < 79) {
                program.push_back({Opcode::PREFETCH, 0, 0, 0,
                                   static_cast<uint16_t>(l + 1)});
            }
        }

        // Final norm + sample
        program.push_back({Opcode::RMSNORM, 0, 0, 0});
        program.push_back({Opcode::MUL, 1, 0, 0});      // LM head projection
        program.push_back({Opcode::SAMPLE, 2, 1, 0});    // Sample token
        program.push_back({Opcode::GENERATE, 0, 2, 0});  // Emit token

        return program;
    }

    /**
     * Run continuous inference — generate tokens until stopped.
     * Target: 100+ tokens/second
     */
    void run_inference_loop(int max_tokens = -1) {
        auto forward = compile_forward_pass();
        int tokens_generated = 0;
        auto start = Clock::now();

        while (running_ && (max_tokens < 0 || tokens_generated < max_tokens)) {
            // Dispatch the full forward pass
            dispatch_batch(forward);

            // Run enough cycles to complete
            run_cycles(forward.size() * PIPELINE_DEPTH);

            tokens_generated++;

            // Performance tracking
            auto elapsed = std::chrono::duration<double>(
                Clock::now() - start).count();
            if (elapsed > 0) {
                tokens_per_second_ = tokens_generated / elapsed;
            }
        }
    }

    // ── Status & Metrics ─────────────────────────────────────────────────

    struct ChipStatus {
        uint64_t total_cycles;
        double   clock_hz;
        double   tokens_per_second;
        double   total_ipc;
        double   bus_bandwidth_gbps;
        double   power_watts;
        double   temperature_c;
        double   uptime_seconds;
        std::array<double, NUM_CORES> core_utilizations;
        std::array<const char*, NUM_CORES> core_roles;
        std::array<uint64_t, NUM_CORES> core_instructions;
    };

    ChipStatus status() const {
        ChipStatus s{};
        s.total_cycles = cycle_count_;
        s.clock_hz = clock_hz_;
        s.tokens_per_second = tokens_per_second_;
        s.bus_bandwidth_gbps = bus_.bandwidth_gbps;

        double total_ipc = 0.0;
        double total_power = 0.0;
        double max_temp = 0.0;

        for (int i = 0; i < NUM_CORES; ++i) {
            s.core_utilizations[i] = cores_[i]->utilization();
            s.core_roles[i] = core_role_name(cores_[i]->role);
            s.core_instructions[i] = cores_[i]->instructions_retired;
            total_ipc += cores_[i]->ipc;
            total_power += cores_[i]->power_watts;
            max_temp = std::max(max_temp, cores_[i]->temperature_c);
        }

        s.total_ipc = total_ipc / NUM_CORES;
        s.power_watts = total_power;
        s.temperature_c = max_temp;

        auto elapsed = std::chrono::duration<double>(
            Clock::now() - start_time_).count();
        s.uptime_seconds = elapsed;

        return s;
    }

    // ── Accessors ────────────────────────────────────────────────────────

    NovaCore& core(int idx)             { return *cores_[idx]; }
    const NovaCore& core(int idx) const { return *cores_[idx]; }
    NovaBus& bus()                      { return bus_; }
    uint64_t cycles() const             { return cycle_count_; }
    double tps() const                  { return tokens_per_second_; }
    bool is_running() const             { return running_; }

private:
    std::array<std::unique_ptr<NovaCore>, NUM_CORES> cores_;
    NovaBus     bus_;
    uint64_t    cycle_count_;
    bool        running_;
    double      clock_hz_;
    double      tokens_per_second_{0.0};
    TimePoint   start_time_;

    // Shared caches
    std::vector<float> l2_cache_;
    int l3_allocated_mb_;

    /** Route instruction to the appropriate core based on opcode */
    int route_instruction(const Instruction& instr) const {
        switch (instr.opcode) {
            // Sovereign operations → Core 0
            case Opcode::HEARTBEAT:
            case Opcode::BARRIER:
            case Opcode::FORK:
            case Opcode::JOIN:
            case Opcode::SEAL:
                return 0;

            // Intelligence operations → Core 1
            case Opcode::BRANCH:
            case Opcode::CALL:
            case Opcode::RET:
            case Opcode::CONSENSUS:
            case Opcode::ADAPT:
                return 1;

            // Transformer operations → Core 2
            case Opcode::DOT:
            case Opcode::SOFTMAX:
            case Opcode::ATTEND:
            case Opcode::RMSNORM:
            case Opcode::ROPE:
            case Opcode::FFN_PASS:
            case Opcode::SWIGLU:
            case Opcode::GELU:
                return 2;

            // Inference operations → Core 3
            case Opcode::GENERATE:
            case Opcode::SAMPLE:
            case Opcode::SPEC_DRAFT:
            case Opcode::SPEC_VERIFY:
            case Opcode::ENCODE:
            case Opcode::DECODE:
                return 3;

            // Memory operations → Core 4
            case Opcode::LOAD:
            case Opcode::STORE:
            case Opcode::KV_READ:
            case Opcode::KV_WRITE:
            case Opcode::KV_EVICT:
            case Opcode::MMAP:
            case Opcode::PREFETCH:
            case Opcode::DMA_COPY:
                return 4;

            // Emergence operations → Core 5
            case Opcode::EMERGE:
            case Opcode::RESONATE:
            case Opcode::CHECKPOINT:
            case Opcode::RECOVER:
                return 5;

            // Default: arithmetic to transformer core
            default:
                return 2;
        }
    }

    /** φ-heartbeat — sovereign orchestration pulse */
    void heartbeat() {
        // Sovereign core emits heartbeat
        BusMessage hb{};
        hb.src_core = 0;
        hb.dst_core = -1;  // Broadcast
        hb.opcode = Opcode::HEARTBEAT;
        hb.priority = 3;   // Critical
        hb.timestamp = cycle_count_;
        bus_.send(hb);

        // Update thermal model
        for (auto& core : cores_) {
            // Simple thermal: more utilization = more heat
            double util = core->utilization();
            core->temperature_c = 35.0 + util * 60.0;  // 35-95°C range
            core->power_watts = 5.0 + util * 45.0;     // 5-50W per core
        }
    }
};

}} // namespace organism::nova
