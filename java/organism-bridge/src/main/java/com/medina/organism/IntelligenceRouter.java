package com.medina.organism;

import java.util.*;

/**
 * IntelligenceRouter — Java port of the φ-weighted AI model routing engine.
 *
 * <p>Routes tasks to the best available AI model using the scoring formula:
 * <pre>
 *   S(m) = φ^(4 − priority) × capability(m, taskType) × reputation(m)
 * </pre>
 *
 * <p>Supports:
 * <ul>
 *   <li>40 pre-registered AI model families (GPT, Claude, Gemini, Llama, …)</li>
 *   <li>Adaptive reputation via phi-EMA outcome recording</li>
 *   <li>Cascade fallback with phi-weighted decay</li>
 *   <li>Routing table rebalancing</li>
 * </ul>
 *
 * <p>Ring: Interface Ring | Wire: intelligence-wire/router
 */
public final class IntelligenceRouter {

    // ── Constants ─────────────────────────────────────────────────────────────

    public static final double PHI      = 1.6180339887498948;
    public static final double PHI_INV  = 1.0 / PHI;
    public static final int    HEARTBEAT = 873;

    // ── Task types ────────────────────────────────────────────────────────────

    public enum TaskType { REASONING, CODING, CREATIVE, ANALYSIS, CONVERSATION }

    // ── Priority levels ───────────────────────────────────────────────────────

    public enum Priority { LOW, NORMAL, HIGH, CRITICAL;
        public int ordinal0() {
            return switch (this) {
                case LOW      -> 0;
                case NORMAL   -> 1;
                case HIGH     -> 2;
                case CRITICAL -> 3;
            };
        }
    }

    // ── Task ─────────────────────────────────────────────────────────────────

    public record Task(String id, TaskType type, Priority priority) {}

    // ── Model entry ───────────────────────────────────────────────────────────

    public static final class ModelEntry {
        private final String id;
        private final Map<TaskType, Double> capabilities;
        private double reputation;
        private long   totalTasks;
        private long   successCount;
        private double avgLatencyMs;

        ModelEntry(String id, Map<TaskType, Double> caps, double reputation) {
            this.id          = id;
            this.capabilities = new EnumMap<>(caps);
            this.reputation  = reputation;
            this.totalTasks  = 0;
            this.successCount = 0;
            this.avgLatencyMs = HEARTBEAT;
        }

        public String  getId()           { return id;           }
        public double  getReputation()   { return reputation;   }
        public long    getTotalTasks()   { return totalTasks;   }
        public double  getAvgLatencyMs() { return avgLatencyMs; }

        double capability(TaskType t) {
            return capabilities.getOrDefault(t, 0.5);
        }

        double score(Task task) {
            return Math.pow(PHI, 4 - task.priority().ordinal0())
                 * capability(task.type())
                 * reputation;
        }
    }

    // ── Routing result ────────────────────────────────────────────────────────

    public record RoutingResult(String modelId, double score, List<String> alternatives) {}

    // ── Internal state ────────────────────────────────────────────────────────

    private final Map<String, ModelEntry> routingTable = new LinkedHashMap<>();
    private long totalRouted  = 0;
    private long totalSuccess = 0;
    private long totalLatency = 0;

    // ── Constructor ───────────────────────────────────────────────────────────

    public IntelligenceRouter() {
        seedDefaultModels();
    }

    // ── Core routing ──────────────────────────────────────────────────────────

    /**
     * Route a task to the best model.
     *
     * @param task Task to route
     * @return     RoutingResult with the chosen model ID and alternatives
     */
    public RoutingResult route(Task task) {
        final List<Map.Entry<String, Double>> scored = new ArrayList<>();
        for (final ModelEntry m : routingTable.values()) {
            scored.add(Map.entry(m.id, m.score(task)));
        }
        scored.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        totalRouted++;
        if (scored.isEmpty()) {
            return new RoutingResult(null, 0.0, Collections.emptyList());
        }

        final List<String> alts = scored.stream()
                .skip(1).limit(3)
                .map(Map.Entry::getKey)
                .toList();

        return new RoutingResult(scored.get(0).getKey(), scored.get(0).getValue(), alts);
    }

    /**
     * Record the outcome of a routed task.  Updates reputation via phi-EMA.
     *
     * @param modelId    Model that executed the task
     * @param success    Whether the task succeeded
     * @param latencyMs  Observed latency in milliseconds
     */
    public void recordOutcome(String modelId, boolean success, long latencyMs) {
        final ModelEntry m = routingTable.get(modelId);
        if (m == null) throw new OrganismException("Unknown model: " + modelId);

        m.totalTasks++;
        if (success) m.successCount++;
        m.reputation   = PHI_INV * (success ? 1.0 : 0.0) + (1.0 - PHI_INV) * m.reputation;
        m.avgLatencyMs = PHI_INV * latencyMs + (1.0 - PHI_INV) * m.avgLatencyMs;

        if (success) totalSuccess++;
        totalLatency += latencyMs;
    }

    /**
     * Cascade fallback: find the best untried model after failures.
     *
     * @param task         Task requiring fallback
     * @param failedModels Models that have already been tried and failed
     * @return             RoutingResult for the next candidate
     */
    public RoutingResult cascadeFallback(Task task, Set<String> failedModels) {
        final List<Map.Entry<String, Double>> candidates = new ArrayList<>();
        for (final ModelEntry m : routingTable.values()) {
            if (failedModels.contains(m.id)) continue;
            candidates.add(Map.entry(m.id, m.score(task)));
        }
        candidates.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        // Apply phi-weighted decay to fallback positions
        for (int i = 0; i < candidates.size(); i++) {
            final double adjusted = candidates.get(i).getValue()
                                  * Math.pow(PHI, -i);
            candidates.set(i, Map.entry(candidates.get(i).getKey(), adjusted));
        }
        candidates.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        if (candidates.isEmpty()) {
            return new RoutingResult(null, 0.0, Collections.emptyList());
        }
        return new RoutingResult(candidates.get(0).getKey(),
                                 candidates.get(0).getValue(),
                                 Collections.emptyList());
    }

    /**
     * Rebalance routing weights using accumulated empirical success rates.
     */
    public void rebalance() {
        for (final ModelEntry m : routingTable.values()) {
            if (m.totalTasks > 0) {
                final double empirical = (double) m.successCount / m.totalTasks;
                m.reputation = PHI_INV * empirical + (1.0 - PHI_INV) * m.reputation;
            }
        }
    }

    // ── Introspection ─────────────────────────────────────────────────────────

    public Map<String, Object> getMetrics() {
        String topModel = null;
        double topRep   = -1;
        for (final ModelEntry m : routingTable.values()) {
            if (m.reputation > topRep) {
                topRep   = m.reputation;
                topModel = m.id;
            }
        }
        return Map.of(
            "totalRouted",  totalRouted,
            "successRate",  totalRouted > 0 ? (double) totalSuccess / totalRouted : 0.0,
            "avgLatencyMs", totalRouted > 0 ? (double) totalLatency / totalRouted : 0.0,
            "topModel",     topModel != null ? topModel : ""
        );
    }

    public int modelCount() { return routingTable.size(); }

    // ── Default model seeding ─────────────────────────────────────────────────

    private void seedDefaultModels() {
        // 40 model families — mirrors SovereignRoutingProtocol.js
        seed("gpt-4o",          cap(0.90, 0.85, 0.80, 0.88, 0.85));
        seed("gpt-4-turbo",     cap(0.88, 0.83, 0.78, 0.86, 0.84));
        seed("gpt-4",           cap(0.85, 0.80, 0.75, 0.85, 0.83));
        seed("gpt-3.5-turbo",   cap(0.75, 0.70, 0.70, 0.72, 0.80));
        seed("o1-preview",      cap(0.92, 0.87, 0.70, 0.91, 0.70));
        seed("o1-mini",         cap(0.88, 0.83, 0.65, 0.87, 0.68));
        seed("o3-mini",         cap(0.90, 0.86, 0.68, 0.89, 0.70));
        seed("o3",              cap(0.93, 0.88, 0.72, 0.92, 0.72));
        seed("claude-3.5-sonnet",cap(0.88, 0.80, 0.90, 0.87, 0.88));
        seed("claude-3.5-haiku", cap(0.82, 0.75, 0.85, 0.80, 0.85));
        seed("claude-3-opus",    cap(0.87, 0.78, 0.92, 0.86, 0.90));
        seed("claude-3-sonnet",  cap(0.85, 0.76, 0.88, 0.84, 0.88));
        seed("claude-3-haiku",   cap(0.78, 0.70, 0.82, 0.76, 0.82));
        seed("claude-4",         cap(0.92, 0.84, 0.94, 0.90, 0.92));
        seed("gemini-2.0-flash", cap(0.84, 0.78, 0.80, 0.88, 0.82));
        seed("gemini-1.5-pro",   cap(0.85, 0.76, 0.80, 0.90, 0.80));
        seed("gemini-1.5-flash", cap(0.80, 0.72, 0.76, 0.85, 0.78));
        seed("gemini-ultra",     cap(0.88, 0.80, 0.84, 0.92, 0.84));
        seed("llama-3.1-405b",   cap(0.80, 0.82, 0.70, 0.78, 0.75));
        seed("llama-3.1-70b",    cap(0.75, 0.80, 0.65, 0.72, 0.72));
        seed("llama-3.1-8b",     cap(0.65, 0.70, 0.58, 0.62, 0.65));
        seed("llama-3.2-90b",    cap(0.78, 0.82, 0.68, 0.75, 0.74));
        seed("mistral-large",    cap(0.78, 0.82, 0.70, 0.76, 0.74));
        seed("mistral-medium",   cap(0.72, 0.76, 0.65, 0.70, 0.70));
        seed("mistral-small",    cap(0.65, 0.70, 0.60, 0.63, 0.65));
        seed("mixtral-8x22b",    cap(0.76, 0.82, 0.68, 0.74, 0.72));
        seed("mixtral-8x7b",     cap(0.70, 0.76, 0.62, 0.68, 0.68));
        seed("command-r-plus",   cap(0.78, 0.72, 0.74, 0.80, 0.78));
        seed("command-r",        cap(0.72, 0.66, 0.68, 0.74, 0.72));
        seed("command-light",    cap(0.60, 0.55, 0.58, 0.62, 0.65));
        seed("deepseek-v3",      cap(0.82, 0.88, 0.68, 0.80, 0.72));
        seed("deepseek-r1",      cap(0.80, 0.85, 0.64, 0.78, 0.70));
        seed("deepseek-coder",   cap(0.70, 0.90, 0.50, 0.68, 0.60));
        seed("qwen-2.5-72b",     cap(0.78, 0.80, 0.70, 0.76, 0.72));
        seed("qwen-2.5-32b",     cap(0.72, 0.74, 0.65, 0.70, 0.68));
        seed("phi-3-medium",     cap(0.65, 0.72, 0.60, 0.64, 0.65));
        seed("phi-3-mini",       cap(0.58, 0.65, 0.55, 0.58, 0.60));
        seed("dbrx",             cap(0.72, 0.74, 0.64, 0.70, 0.68));
        seed("gpt-5-mini",       cap(0.86, 0.82, 0.80, 0.88, 0.86));
        seed("gemma-2-27b",      cap(0.70, 0.72, 0.66, 0.68, 0.68));
    }

    private static Map<TaskType, Double> cap(double r, double c, double cr,
                                              double a, double cv) {
        final EnumMap<TaskType, Double> m = new EnumMap<>(TaskType.class);
        m.put(TaskType.REASONING,     r);
        m.put(TaskType.CODING,        c);
        m.put(TaskType.CREATIVE,      cr);
        m.put(TaskType.ANALYSIS,      a);
        m.put(TaskType.CONVERSATION,  cv);
        return m;
    }

    private void seed(String id, Map<TaskType, Double> caps) {
        routingTable.put(id, new ModelEntry(id, caps, 0.80));
    }
}
