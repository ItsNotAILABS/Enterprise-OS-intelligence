/**
 * ai_division.hpp — Native AI Division Engine (Medina)
 *
 * C++ native implementation of the AI Division.
 * Five autonomous teams, five block box tiers, sovereign cycles as tokens,
 * Fibonacci scaling to 50,000.
 *
 * Cycles ARE tokens.  The organism generates its own compute.
 * Zero ICP dependency.  We give our own cycles.  We can make more.
 *
 * Block boxes: Bronze → Silver → Gold → Platinum → Sovereign.
 *
 * Ring: Sovereign Ring | Native Layer (C++)
 */

#pragma once

#include "phi_math.hpp"

#include <string>
#include <vector>
#include <map>
#include <array>
#include <cstdint>
#include <chrono>
#include <mutex>
#include <atomic>
#include <sstream>
#include <functional>

namespace organism {

// ── Block Box Tiers ──────────────────────────────────────────────────────────

enum class BlockBoxTier : int {
    Bronze    = 0,
    Silver    = 1,
    Gold      = 2,
    Platinum  = 3,
    Sovereign = 4,
};

inline const char* tier_name(BlockBoxTier t) {
    switch (t) {
        case BlockBoxTier::Bronze:    return "bronze";
        case BlockBoxTier::Silver:    return "silver";
        case BlockBoxTier::Gold:      return "gold";
        case BlockBoxTier::Platinum:  return "platinum";
        case BlockBoxTier::Sovereign: return "sovereign";
    }
    return "unknown";
}

inline int tier_seal_rounds(BlockBoxTier t) {
    switch (t) {
        case BlockBoxTier::Bronze:    return 1;
        case BlockBoxTier::Silver:    return 2;
        case BlockBoxTier::Gold:      return 3;
        case BlockBoxTier::Platinum:  return 5;
        case BlockBoxTier::Sovereign: return 8;
    }
    return 1;
}

inline int tier_cycle_budget(BlockBoxTier t) {
    return tier_seal_rounds(t) * 16;  // MIN_SLOTS
}

constexpr BlockBoxTier ALL_TIERS[] = {
    BlockBoxTier::Bronze, BlockBoxTier::Silver, BlockBoxTier::Gold,
    BlockBoxTier::Platinum, BlockBoxTier::Sovereign
};

// ── Team Roles ───────────────────────────────────────────────────────────────

enum class TeamRole : int {
    Sovereign    = 0,
    Intelligence = 1,
    Frontend     = 2,
    Backend      = 3,
    Education    = 4,
};

inline const char* role_name(TeamRole r) {
    switch (r) {
        case TeamRole::Sovereign:    return "sovereign";
        case TeamRole::Intelligence: return "intelligence";
        case TeamRole::Frontend:     return "frontend";
        case TeamRole::Backend:      return "backend";
        case TeamRole::Education:    return "education";
    }
    return "unknown";
}

constexpr TeamRole ALL_ROLES[] = {
    TeamRole::Sovereign, TeamRole::Intelligence, TeamRole::Frontend,
    TeamRole::Backend, TeamRole::Education
};

// ── Fibonacci ────────────────────────────────────────────────────────────────

inline uint64_t fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    uint64_t a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        uint64_t c = a + b;
        a = b;
        b = c;
    }
    return b;
}

struct ScalingLevel {
    int      level;
    int      fib_index;
    uint64_t capacity;
    const char* name;
};

constexpr ScalingLevel SCALING_LEVELS[] = {
    {0, 0,  0,     "genesis"},
    {1, 1,  1,     "seed"},
    {2, 7,  13,    "micro"},
    {3, 12, 144,   "school"},
    {4, 20, 6765,  "department"},
    {5, 24, 46368, "institution"},
};

constexpr int NUM_SCALING_LEVELS = sizeof(SCALING_LEVELS) / sizeof(ScalingLevel);

// ── Cycle Token ──────────────────────────────────────────────────────────────

struct CycleToken {
    std::string engine_id;
    TeamRole    team_role;
    uint64_t    beat;
    int         slot;
    uint32_t    phx_hash;
    bool        autonomous;  // always true
};

// ── Block Box ────────────────────────────────────────────────────────────────

struct BlockBox {
    uint64_t     box_id;
    BlockBoxTier tier;
    uint32_t     phx_hash;
    std::string  minted_by;
    TeamRole     team_role;
    uint64_t     beat;
    int          cycle_budget;
    int          seal_rounds;
};

// ── Cycle Engine ─────────────────────────────────────────────────────────────

class CycleEngine {
public:
    std::string engine_id;
    TeamRole    team_role;
    int         slots;
    uint64_t    beat          = 0;
    uint64_t    total_tokens  = 0;
    uint64_t    surplus_cycles = 0;

    CycleEngine(const std::string& id, TeamRole role, int slots = 16)
        : engine_id(id), team_role(role), slots(slots < 1 ? 1 : slots) {}

    std::vector<CycleToken> tick() {
        std::vector<CycleToken> tokens;
        tokens.reserve(slots);
        for (int s = 0; s < slots; s++) {
            std::string input = engine_id + ":" + std::to_string(beat) + ":" + std::to_string(s);
            tokens.push_back(CycleToken{
                engine_id, team_role, beat, s,
                phi_hash(input.c_str(), input.size()), true
            });
        }
        total_tokens += slots;
        surplus_cycles += slots;
        beat++;
        return tokens;
    }

    uint64_t consume_cycles(uint64_t count) {
        uint64_t available = std::min(count, surplus_cycles);
        surplus_cycles -= available;
        return available;
    }

    uint64_t generate_cycles(uint64_t count) {
        surplus_cycles += count;
        return surplus_cycles;
    }

    double fcpr() const {
        return static_cast<double>(slots) * (1000.0 / HEARTBEAT_MS);
    }
};

// ── Block Box Generator ──────────────────────────────────────────────────────

class BlockBoxGenerator {
public:
    std::string generator_id;
    TeamRole    team_role;
    uint64_t    total_minted = 0;
    std::array<uint64_t, 5> minted_by_tier = {0, 0, 0, 0, 0};

    BlockBoxGenerator(const std::string& id, TeamRole role)
        : generator_id(id), team_role(role) {}

    BlockBox mint(const std::string& payload, BlockBoxTier tier) {
        uint32_t hash = phi_hash(payload.c_str(), payload.size());
        uint64_t id = beat_++;
        total_minted++;
        minted_by_tier[static_cast<int>(tier)]++;
        return BlockBox{
            id, tier, hash, generator_id, team_role, id,
            tier_cycle_budget(tier), tier_seal_rounds(tier)
        };
    }

private:
    uint64_t beat_ = 0;
};

// ── AI Team ──────────────────────────────────────────────────────────────────

class AITeam {
public:
    std::string       team_id;
    TeamRole          role;
    CycleEngine       engine;
    BlockBoxGenerator generator;
    int               level    = 0;
    uint64_t          capacity = 0;

    AITeam(TeamRole r, int slots = 16)
        : team_id(std::string("team-") + role_name(r)),
          role(r),
          engine(std::string("engine-") + role_name(r), r, slots),
          generator(std::string("gen-") + role_name(r), r) {}

    std::vector<CycleToken> tick() { return engine.tick(); }

    BlockBox mint_blockbox(const std::string& payload, BlockBoxTier tier) {
        return generator.mint(payload, tier);
    }

    void scale_to(int lvl) {
        if (lvl >= 0 && lvl < NUM_SCALING_LEVELS) {
            level = lvl;
            capacity = SCALING_LEVELS[lvl].capacity;
        }
    }
};

// ── Division Manager ─────────────────────────────────────────────────────────

class DivisionManager {
public:
    std::vector<AITeam> teams;
    uint64_t            global_beat = 0;
    bool                booted      = false;

    void boot(int slots = 16) {
        if (booted) return;
        for (auto r : ALL_ROLES) {
            teams.emplace_back(r, slots);
        }
        booted = true;
    }

    uint64_t tick_all() {
        for (auto& team : teams) team.tick();
        return ++global_beat;
    }

    void scale_all(int level) {
        for (auto& team : teams) team.scale_to(level);
    }

    double total_fcpr() const {
        double sum = 0;
        for (auto& t : teams) sum += t.engine.fcpr();
        return sum;
    }

    uint64_t total_tokens() const {
        uint64_t sum = 0;
        for (auto& t : teams) sum += t.engine.total_tokens;
        return sum;
    }

    uint64_t total_boxes() const {
        uint64_t sum = 0;
        for (auto& t : teams) sum += t.generator.total_minted;
        return sum;
    }
};

} // namespace organism
