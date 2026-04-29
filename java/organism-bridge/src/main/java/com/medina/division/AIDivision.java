package com.medina.division;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * AIDivision — Autonomous AI Division Engine (Medina)
 *
 * <p>The organism's division manager.  Five autonomous teams, five block box
 * tiers, sovereign cycles as tokens, Fibonacci scaling to 50,000.</p>
 *
 * <p>Cycles ARE tokens.  The organism generates its own compute.
 * Zero ICP dependency.  We give our own cycles.  We can make more.</p>
 *
 * <p>Block boxes: Bronze → Silver → Gold → Platinum → Sovereign.</p>
 *
 * <p>Ring: Sovereign Ring | Java Bridge</p>
 */
public final class AIDivision {

    // ── Constants ────────────────────────────────────────────────────────────

    public static final int HEARTBEAT_MS = 873;
    public static final double HEARTBEAT_HZ = 1000.0 / HEARTBEAT_MS;
    public static final double PHI = 1.618033988749895;
    public static final int MIN_SLOTS = 16;

    // ── Block Box Tiers ──────────────────────────────────────────────────────

    public enum BlockBoxTier {
        BRONZE(1, 16),
        SILVER(2, 32),
        GOLD(3, 48),
        PLATINUM(5, 80),
        SOVEREIGN(8, 128);

        public final int sealRounds;
        public final int defaultCycleBudget;

        BlockBoxTier(int sealRounds, int defaultCycleBudget) {
            this.sealRounds = sealRounds;
            this.defaultCycleBudget = defaultCycleBudget;
        }
    }

    // ── Team Roles ───────────────────────────────────────────────────────────

    public enum TeamRole {
        SOVEREIGN, INTELLIGENCE, FRONTEND, BACKEND, EDUCATION
    }

    // ── Fibonacci ────────────────────────────────────────────────────────────

    public static long fibonacci(int n) {
        if (n <= 0) return 0;
        if (n == 1) return 1;
        long a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            long c = a + b;
            a = b;
            b = c;
        }
        return b;
    }

    // ── Scaling Levels ───────────────────────────────────────────────────────

    public static final int[][] SCALING_LEVELS = {
        {0, 0, 0},       // genesis
        {1, 1, 1},       // seed
        {2, 7, 13},      // micro
        {3, 12, 144},    // school
        {4, 20, 6765},   // department
        {5, 24, 46368},  // institution
    };

    // ── Cycle Token ──────────────────────────────────────────────────────────

    public static final class CycleToken {
        public final String engineId;
        public final TeamRole teamRole;
        public final long beat;
        public final int slot;
        public final String phxSeal;
        public final boolean autonomous;

        CycleToken(String engineId, TeamRole teamRole, long beat, int slot, String phxSeal) {
            this.engineId = engineId;
            this.teamRole = teamRole;
            this.beat = beat;
            this.slot = slot;
            this.phxSeal = phxSeal;
            this.autonomous = true;
        }
    }

    // ── Block Box ────────────────────────────────────────────────────────────

    public static final class BlockBox {
        public final String boxId;
        public final BlockBoxTier tier;
        public final String phxSeal;
        public final String mintedBy;
        public final TeamRole teamRole;
        public final long beat;
        public final int cycleBudget;
        public final int sealRounds;
        public final long createdMs;

        BlockBox(String boxId, BlockBoxTier tier, String phxSeal, String mintedBy,
                 TeamRole teamRole, long beat, int cycleBudget, int sealRounds) {
            this.boxId = boxId;
            this.tier = tier;
            this.phxSeal = phxSeal;
            this.mintedBy = mintedBy;
            this.teamRole = teamRole;
            this.beat = beat;
            this.cycleBudget = cycleBudget;
            this.sealRounds = sealRounds;
            this.createdMs = System.currentTimeMillis();
        }
    }

    // ── PHX Seal ─────────────────────────────────────────────────────────────

    private static String phxSeal(byte[] payload, byte[] key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            byte[] hash = mac.doFinal(payload);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("HMAC-SHA256 failed", e);
        }
    }

    // ── Cycle Engine ─────────────────────────────────────────────────────────

    public static final class CycleEngine {
        public final String engineId;
        public final TeamRole teamRole;
        public final int slots;
        private final byte[] key;
        private final AtomicLong beat = new AtomicLong(0);
        private final AtomicLong totalTokens = new AtomicLong(0);
        private final AtomicLong surplusCycles = new AtomicLong(0);

        CycleEngine(String engineId, TeamRole teamRole, byte[] key) {
            this.engineId = engineId;
            this.teamRole = teamRole;
            this.slots = MIN_SLOTS;
            this.key = key;
        }

        public List<CycleToken> tick() {
            long currentBeat = beat.getAndIncrement();
            List<CycleToken> tokens = new ArrayList<>(slots);
            for (int slot = 0; slot < slots; slot++) {
                String input = engineId + ":" + currentBeat + ":" + slot;
                String seal = phxSeal(input.getBytes(StandardCharsets.UTF_8), key);
                tokens.add(new CycleToken(engineId, teamRole, currentBeat, slot, seal));
            }
            totalTokens.addAndGet(slots);
            surplusCycles.addAndGet(slots);
            return tokens;
        }

        public long consumeCycles(long count) {
            long available = Math.min(count, surplusCycles.get());
            surplusCycles.addAndGet(-available);
            return available;
        }

        public long generateCycles(long count) {
            return surplusCycles.addAndGet(count);
        }

        public long getBeat() { return beat.get(); }
        public long getTotalTokens() { return totalTokens.get(); }
        public long getSurplusCycles() { return surplusCycles.get(); }
        public double fcpr() { return slots * HEARTBEAT_HZ; }
    }

    // ── Block Box Generator ──────────────────────────────────────────────────

    public static final class BlockBoxGenerator {
        public final String generatorId;
        public final TeamRole teamRole;
        private final byte[] key;
        private final AtomicLong totalMinted = new AtomicLong(0);
        private final ConcurrentHashMap<BlockBoxTier, AtomicLong> mintedByTier = new ConcurrentHashMap<>();
        private final AtomicLong beat = new AtomicLong(0);

        BlockBoxGenerator(String generatorId, TeamRole teamRole, byte[] key) {
            this.generatorId = generatorId;
            this.teamRole = teamRole;
            this.key = key;
            for (BlockBoxTier t : BlockBoxTier.values()) {
                mintedByTier.put(t, new AtomicLong(0));
            }
        }

        public BlockBox mint(byte[] payload, BlockBoxTier tier) {
            long currentBeat = beat.getAndIncrement();
            String seal = phxSeal(payload, key);
            totalMinted.incrementAndGet();
            mintedByTier.get(tier).incrementAndGet();
            return new BlockBox(
                generatorId + "-" + currentBeat, tier, seal, generatorId,
                teamRole, currentBeat, tier.defaultCycleBudget, tier.sealRounds
            );
        }

        public long getTotalMinted() { return totalMinted.get(); }
        public Map<BlockBoxTier, Long> getMintedByTier() {
            Map<BlockBoxTier, Long> result = new EnumMap<>(BlockBoxTier.class);
            mintedByTier.forEach((k, v) -> result.put(k, v.get()));
            return result;
        }
    }

    // ── AI Team ──────────────────────────────────────────────────────────────

    public static final class AITeam {
        public final String teamId;
        public final TeamRole role;
        public final CycleEngine engine;
        public final BlockBoxGenerator generator;
        private int level = 0;
        private long capacity = 0;

        AITeam(TeamRole role, byte[] masterKey) {
            this.teamId = "team-" + role.name().toLowerCase();
            this.role = role;
            byte[] derived = phxSeal(role.name().getBytes(StandardCharsets.UTF_8), masterKey)
                .getBytes(StandardCharsets.UTF_8);
            this.engine = new CycleEngine("engine-" + role.name().toLowerCase(), role, derived);
            this.generator = new BlockBoxGenerator("gen-" + role.name().toLowerCase(), role, derived);
        }

        public List<CycleToken> tick() { return engine.tick(); }
        public BlockBox mintBlockBox(byte[] payload, BlockBoxTier tier) {
            return generator.mint(payload, tier);
        }
        public void scaleTo(int lvl) {
            if (lvl >= 0 && lvl < SCALING_LEVELS.length) {
                level = lvl;
                capacity = SCALING_LEVELS[lvl][2];
            }
        }
        public int getLevel() { return level; }
        public long getCapacity() { return capacity; }
    }

    // ── Division Manager ─────────────────────────────────────────────────────

    private final Map<TeamRole, AITeam> teams = new ConcurrentHashMap<>();
    private final AtomicLong globalBeat = new AtomicLong(0);
    private volatile boolean booted = false;
    private final byte[] key;

    public AIDivision(byte[] sovereignKey) {
        this.key = Arrays.copyOf(sovereignKey, sovereignKey.length);
    }

    public synchronized void boot() {
        if (booted) return;
        for (TeamRole role : TeamRole.values()) {
            teams.put(role, new AITeam(role, key));
        }
        booted = true;
    }

    public AITeam team(TeamRole role) {
        AITeam t = teams.get(role);
        if (t == null) throw new IllegalStateException("No team: " + role);
        return t;
    }

    public long tickAll() {
        for (AITeam team : teams.values()) {
            team.tick();
        }
        return globalBeat.incrementAndGet();
    }

    public void scaleAll(int level) {
        for (AITeam team : teams.values()) {
            team.scaleTo(level);
        }
    }

    public long totalTokens() {
        return teams.values().stream().mapToLong(t -> t.engine.getTotalTokens()).sum();
    }

    public long totalBoxes() {
        return teams.values().stream().mapToLong(t -> t.generator.getTotalMinted()).sum();
    }

    public double totalFCPR() {
        return teams.values().stream().mapToDouble(t -> t.engine.fcpr()).sum();
    }

    public boolean isBooted() { return booted; }
    public long getGlobalBeat() { return globalBeat.get(); }
    public int teamCount() { return teams.size(); }
}
