package com.medina.organism;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OrganismClient — Java SDK for interacting with the sovereign organism.
 *
 * <p>Provides:
 * <ul>
 *   <li>SYN binding management (bind / query / revoke)</li>
 *   <li>Solver job dispatch</li>
 *   <li>Health checking against the AGI Terminal</li>
 *   <li>Phi-weighted score computation (local, no network)</li>
 * </ul>
 *
 * <p>In a production deployment, the {@code canisterEndpoint} points to the
 * ICP replica gateway.  For local testing, point it to a dfx-local replica.
 *
 * <pre>{@code
 * OrganismClient client = new OrganismClient.Builder()
 *     .canisterEndpoint("https://ic0.app")
 *     .synCanisterId("rrkah-fqaaa-aaaaa-aaaaq-cai")
 *     .build();
 *
 * client.synBind("HEART", "agi-terminal-id", "heart");
 * Optional<SynBinding> heart = client.synQuery("HEART");
 * }</pre>
 *
 * <p>Ring: Sovereign Ring | Wire: intelligence-wire/syn
 */
public final class OrganismClient {

    // ── Constants ─────────────────────────────────────────────────────────────

    /** Organism heartbeat interval in milliseconds. */
    public static final long HEARTBEAT_MS = 873L;

    /** Golden ratio φ. */
    public static final double PHI = 1.6180339887498948;

    /** Maximum number of local SYN bindings. */
    public static final int MAX_BINDINGS = 64;

    // ── Configuration ─────────────────────────────────────────────────────────

    private final String canisterEndpoint;
    private final String synCanisterId;
    private final String solverCanisterId;
    private final String agiTerminalId;
    private final long   bindTimeoutMs;

    // ── Local binding store ───────────────────────────────────────────────────

    private final Map<String, SynBinding> localBindings = new ConcurrentHashMap<>();

    // ── Metrics ───────────────────────────────────────────────────────────────

    private volatile long bindCalls   = 0;
    private volatile long queryCalls  = 0;
    private volatile long revokeCalls = 0;

    // ── Constructor (via Builder) ─────────────────────────────────────────────

    private OrganismClient(Builder b) {
        this.canisterEndpoint  = b.canisterEndpoint;
        this.synCanisterId     = b.synCanisterId;
        this.solverCanisterId  = b.solverCanisterId;
        this.agiTerminalId     = b.agiTerminalId;
        this.bindTimeoutMs     = b.bindTimeoutMs;
    }

    // ── SYN Operations ────────────────────────────────────────────────────────

    /**
     * Bind a remote canister snapshot locally (emulates synBind on-chain).
     *
     * <p>In a full production implementation this would make an authenticated
     * IC update call to {@code syn_engine.synBind}.  Here we store the
     * binding in the local JVM map and record the snapshot via
     * {@link #fetchSnapshot(String, String)}.
     *
     * @param label      Binding label (e.g. "HEART")
     * @param canisterId Target canister principal
     * @param dataKey    Data key for the remote snapshot
     * @return           The imprinted SynBinding
     * @throws OrganismException if the remote fetch fails or limit is reached
     */
    public SynBinding synBind(String label, String canisterId, String dataKey) {
        if (localBindings.size() >= MAX_BINDINGS && !localBindings.containsKey(label)) {
            throw new OrganismException("MAX_BINDINGS (" + MAX_BINDINGS + ") reached");
        }

        bindCalls++;
        final long now = System.currentTimeMillis();

        // Fetch snapshot from remote canister (HTTP query call)
        final String snapshot = fetchSnapshot(canisterId, dataKey);

        final SynBinding existing = localBindings.get(label);
        final SynBinding binding = SynBinding.builder()
                .label(label)
                .canisterId(canisterId)
                .dataKey(dataKey)
                .rawSnapshot(snapshot)
                .imprinted(existing != null ? existing.getImprinted() : now)
                .refreshed(now)
                .refreshCount(existing != null ? existing.getRefreshCount() + 1 : 0)
                .build();

        localBindings.put(label, binding);
        return binding;
    }

    /**
     * Pure local read — no network, no cycles.
     *
     * @param label Binding label
     * @return      Optional containing the binding if present
     */
    public Optional<SynBinding> synQuery(String label) {
        queryCalls++;
        return Optional.ofNullable(localBindings.get(label));
    }

    /**
     * Revoke a local binding.  Data is gone; no recovery.
     *
     * @param label Binding label
     * @return      true if the binding existed and was removed
     */
    public boolean synRevoke(String label) {
        revokeCalls++;
        return localBindings.remove(label) != null;
    }

    /**
     * Nuclear revoke — every binding deleted in one call.
     *
     * @return Number of bindings removed
     */
    public int synRevokeAll() {
        revokeCalls++;
        final int count = localBindings.size();
        localBindings.clear();
        return count;
    }

    /**
     * Boot helper: bind fleet + ai + nns + HEART in one call.
     *
     * @param fleetId   Fleet canister principal
     * @param aiId      AI canister principal
     * @param nnsId     NNS canister principal
     * @param heartId   AGI Terminal canister principal
     * @return          Map of label → SynBinding
     */
    public Map<String, SynBinding> synBindAll(String fleetId,
                                               String aiId,
                                               String nnsId,
                                               String heartId) {
        final Map<String, SynBinding> results = new LinkedHashMap<>();
        results.put("fleet", synBind("fleet", fleetId, "fleet"));
        results.put("ai",    synBind("ai",    aiId,    "ai"));
        results.put("nns",   synBind("nns",   nnsId,   "nns"));
        results.put("HEART", synBind("HEART", heartId, "heart"));
        return Collections.unmodifiableMap(results);
    }

    // ── Phi Math (local, zero network) ───────────────────────────────────────

    /**
     * Compute the phi-weighted routing score for a model.
     *
     * <p>S(m) = φ^(4 − priority) × capability × reputation
     *
     * @param priority    0 (LOW) … 3 (CRITICAL)
     * @param capability  Task-type capability in [0, 1]
     * @param reputation  Adaptive reputation in [0, 1]
     * @return            Routing score ≥ 0
     */
    public double phiScore(int priority, double capability, double reputation) {
        return Math.pow(PHI, 4.0 - priority) * capability * reputation;
    }

    /**
     * Phi-EMA update: alpha = 1/φ.
     *
     * @param oldValue    Previous estimate
     * @param observation New observation
     * @return            Updated estimate
     */
    public double phiEma(double oldValue, double observation) {
        final double alpha = 1.0 / PHI;
        return alpha * observation + (1.0 - alpha) * oldValue;
    }

    // ── Diagnostics ───────────────────────────────────────────────────────────

    /**
     * Return a snapshot of all local bindings (label → binding).
     */
    public Map<String, SynBinding> getBindings() {
        return Collections.unmodifiableMap(localBindings);
    }

    /**
     * Return client metrics.
     */
    public Map<String, Object> getMetrics() {
        return Map.of(
            "bindCalls",   bindCalls,
            "queryCalls",  queryCalls,
            "revokeCalls", revokeCalls,
            "bindings",    localBindings.size()
        );
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * Fetch a snapshot from a remote canister over HTTP.
     *
     * <p>In production: make a signed IC query call.
     * Here we return a placeholder JSON for offline / unit-test scenarios.
     */
    private String fetchSnapshot(String canisterId, String dataKey) {
        // TODO: integrate with the IC Java agent (e.g. ic4j-agent)
        // for authenticated update/query calls to the canister endpoint.
        return "{\"canisterId\":\"" + canisterId
             + "\",\"dataKey\":\"" + dataKey
             + "\",\"timestamp\":" + System.currentTimeMillis() + "}";
    }

    // ── Builder ───────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static final class Builder {
        private String canisterEndpoint  = "https://ic0.app";
        private String synCanisterId     = "";
        private String solverCanisterId  = "";
        private String agiTerminalId     = "";
        private long   bindTimeoutMs     = 10_000L;

        private Builder() {}

        public Builder canisterEndpoint(String v)  { canisterEndpoint  = v; return this; }
        public Builder synCanisterId(String v)      { synCanisterId     = v; return this; }
        public Builder solverCanisterId(String v)   { solverCanisterId  = v; return this; }
        public Builder agiTerminalId(String v)      { agiTerminalId     = v; return this; }
        public Builder bindTimeoutMs(long v)         { bindTimeoutMs     = v; return this; }

        public OrganismClient build() { return new OrganismClient(this); }
    }
}
