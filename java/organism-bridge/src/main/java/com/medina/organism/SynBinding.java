package com.medina.organism;

/**
 * SynBinding — Immutable value object representing a single SYN binding
 * imprinted from a remote canister into the organism solver's local memory.
 *
 * <p>Mirrors the {@code BindingEntry} type in {@code syn_engine.mo}.
 *
 * <p>Ring: Sovereign Ring | Wire: intelligence-wire/syn
 */
public final class SynBinding {

    /** Human-readable label (e.g. "HEART", "fleet", "ai", "nns"). */
    private final String label;

    /** ICP canister principal ID that was queried. */
    private final String canisterId;

    /** Data key used to select the snapshot on the remote canister. */
    private final String dataKey;

    /** JSON-serialised raw snapshot imprinted from the remote canister. */
    private final String rawSnapshot;

    /** Epoch milliseconds when this binding was first imprinted. */
    private final long imprinted;

    /** Epoch milliseconds of the most recent refresh. */
    private final long refreshed;

    /** Number of times this binding has been refreshed (0 = first imprint). */
    private final int refreshCount;

    // ── Constructor ───────────────────────────────────────────────────────────

    private SynBinding(Builder builder) {
        this.label        = builder.label;
        this.canisterId   = builder.canisterId;
        this.dataKey      = builder.dataKey;
        this.rawSnapshot  = builder.rawSnapshot;
        this.imprinted    = builder.imprinted;
        this.refreshed    = builder.refreshed;
        this.refreshCount = builder.refreshCount;
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public String getLabel()        { return label;        }
    public String getCanisterId()   { return canisterId;   }
    public String getDataKey()      { return dataKey;      }
    public String getRawSnapshot()  { return rawSnapshot;  }
    public long   getImprinted()    { return imprinted;    }
    public long   getRefreshed()    { return refreshed;    }
    public int    getRefreshCount() { return refreshCount; }

    /**
     * Staleness in milliseconds since the last refresh.
     */
    public long staleness() {
        return System.currentTimeMillis() - refreshed;
    }

    /**
     * Age in milliseconds since first imprint.
     */
    public long age() {
        return System.currentTimeMillis() - imprinted;
    }

    @Override
    public String toString() {
        return "SynBinding{label='" + label + '\''
             + ", canisterId='" + canisterId + '\''
             + ", dataKey='" + dataKey + '\''
             + ", refreshCount=" + refreshCount
             + ", staleness=" + staleness() + "ms}";
    }

    // ── Builder ───────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static final class Builder {
        private String label;
        private String canisterId;
        private String dataKey;
        private String rawSnapshot  = "{}";
        private long   imprinted    = System.currentTimeMillis();
        private long   refreshed    = System.currentTimeMillis();
        private int    refreshCount = 0;

        private Builder() {}

        public Builder label(String label)               { this.label = label;               return this; }
        public Builder canisterId(String canisterId)     { this.canisterId = canisterId;     return this; }
        public Builder dataKey(String dataKey)           { this.dataKey = dataKey;           return this; }
        public Builder rawSnapshot(String rawSnapshot)   { this.rawSnapshot = rawSnapshot;   return this; }
        public Builder imprinted(long imprinted)         { this.imprinted = imprinted;       return this; }
        public Builder refreshed(long refreshed)         { this.refreshed = refreshed;       return this; }
        public Builder refreshCount(int refreshCount)    { this.refreshCount = refreshCount; return this; }

        public SynBinding build() {
            if (label == null || label.isBlank())
                throw new IllegalArgumentException("label is required");
            if (canisterId == null || canisterId.isBlank())
                throw new IllegalArgumentException("canisterId is required");
            if (dataKey == null || dataKey.isBlank())
                throw new IllegalArgumentException("dataKey is required");
            return new SynBinding(this);
        }
    }
}
