package com.medina.organism;

import java.util.*;

/**
 * EnterpriseConnector — Java adapter for wiring enterprise systems into the
 * sovereign organism intelligence substrate.
 *
 * <p>Supports eight production connector families:
 * <ul>
 *   <li>Salesforce — CRM entity synchronisation</li>
 *   <li>SAP — ERP transaction bridging</li>
 *   <li>Google Workspace — calendar / drive / gmail</li>
 *   <li>Slack — messaging dispatch</li>
 *   <li>HubSpot — marketing / contact sync</li>
 *   <li>Stripe — payment event streaming</li>
 *   <li>Twilio — SMS / voice dispatch</li>
 *   <li>Shopify — order / product sync</li>
 * </ul>
 *
 * <p>Each connector normalises enterprise data into the organism's canonical
 * JSON event envelope and publishes it to the organism's intelligence wire.
 *
 * <p>Ring: Interface Ring | Wire: intelligence-wire/connectors
 */
public final class EnterpriseConnector {

    // ── Connector types ───────────────────────────────────────────────────────

    public enum ConnectorType {
        SALESFORCE, SAP, GOOGLE_WORKSPACE, SLACK,
        HUBSPOT, STRIPE, TWILIO, SHOPIFY
    }

    // ── Event envelope ────────────────────────────────────────────────────────

    public record OrganismEvent(
            String        eventId,
            ConnectorType source,
            String        eventType,
            Map<String, Object> payload,
            long          timestamp
    ) {
        @Override public String toString() {
            return "OrganismEvent{id='" + eventId
                 + "', source=" + source
                 + ", type='" + eventType + '\''
                 + ", ts=" + timestamp + '}';
        }
    }

    // ── Connector configuration ───────────────────────────────────────────────

    public record ConnectorConfig(
            ConnectorType type,
            String        apiKey,
            String        baseUrl,
            Map<String, String> options
    ) {}

    // ── Event handler ─────────────────────────────────────────────────────────

    @FunctionalInterface
    public interface EventHandler {
        void onEvent(OrganismEvent event);
    }

    // ── State ─────────────────────────────────────────────────────────────────

    private final Map<ConnectorType, ConnectorConfig> configs     = new EnumMap<>(ConnectorType.class);
    private final List<EventHandler>                  handlers    = new ArrayList<>();
    private final Map<ConnectorType, Long>            eventCounts = new EnumMap<>(ConnectorType.class);
    private long totalEvents = 0;
    private long eventIdSeq  = 0;

    // ── Constructor ───────────────────────────────────────────────────────────

    public EnterpriseConnector() {
        for (ConnectorType t : ConnectorType.values()) {
            eventCounts.put(t, 0L);
        }
    }

    // ── Configuration ─────────────────────────────────────────────────────────

    /**
     * Register a connector with its API credentials.
     *
     * @param config Connector configuration
     * @return       This connector (fluent API)
     */
    public EnterpriseConnector register(ConnectorConfig config) {
        configs.put(config.type(), config);
        return this;
    }

    /**
     * Register a global event handler invoked for every organism event.
     *
     * @param handler Event handler
     * @return        This connector (fluent API)
     */
    public EnterpriseConnector onEvent(EventHandler handler) {
        handlers.add(handler);
        return this;
    }

    // ── Ingest (enterprise → organism) ───────────────────────────────────────

    /**
     * Ingest a raw enterprise payload and normalise it into an organism event.
     *
     * @param source    Source connector type
     * @param eventType Connector-specific event type (e.g. "LEAD_CREATED")
     * @param rawData   Raw key-value data from the enterprise system
     * @return          The normalised OrganismEvent
     */
    public OrganismEvent ingest(ConnectorType source,
                                String eventType,
                                Map<String, Object> rawData) {
        if (!configs.containsKey(source)) {
            throw new OrganismException("Connector not registered: " + source);
        }

        final Map<String, Object> normalised = normalise(source, eventType, rawData);
        final OrganismEvent event = new OrganismEvent(
                nextEventId(),
                source,
                eventType,
                Collections.unmodifiableMap(normalised),
                System.currentTimeMillis()
        );

        publish(event);
        return event;
    }

    // ── Dispatch (organism → enterprise) ─────────────────────────────────────

    /**
     * Dispatch an organism command to an enterprise system.
     *
     * <p>In production, this makes an authenticated API call to the connector
     * endpoint.  Here we return a simulated acknowledgement.
     *
     * @param target    Target connector type
     * @param action    Action to perform (e.g. "SEND_MESSAGE", "CREATE_DEAL")
     * @param params    Action parameters
     * @return          Acknowledgement map {status, refId, timestamp}
     */
    public Map<String, Object> dispatch(ConnectorType target,
                                        String action,
                                        Map<String, Object> params) {
        if (!configs.containsKey(target)) {
            throw new OrganismException("Connector not registered: " + target);
        }

        // TODO: integrate with real HTTP clients (OkHttp / Retrofit) per connector
        final String refId = target.name().toLowerCase() + "-" + System.currentTimeMillis();
        return Map.of(
            "status",    "dispatched",
            "connector", target.name(),
            "action",    action,
            "refId",     refId,
            "timestamp", System.currentTimeMillis()
        );
    }

    // ── Diagnostics ───────────────────────────────────────────────────────────

    public Map<ConnectorType, Long> getEventCounts() {
        return Collections.unmodifiableMap(eventCounts);
    }

    public long getTotalEvents() { return totalEvents; }

    public Set<ConnectorType> getRegisteredConnectors() {
        return Collections.unmodifiableSet(configs.keySet());
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private String nextEventId() {
        return "evt-" + (++eventIdSeq) + "-" + System.currentTimeMillis();
    }

    private void publish(OrganismEvent event) {
        totalEvents++;
        eventCounts.merge(event.source(), 1L, Long::sum);
        for (EventHandler h : handlers) {
            try {
                h.onEvent(event);
            } catch (Exception e) {
                // log but do not propagate — organism is resilient
                System.err.println("[EnterpriseConnector] Handler error: " + e.getMessage());
            }
        }
    }

    /**
     * Normalise raw enterprise data into the organism's canonical field set.
     * Extend per connector type for full field mapping.
     */
    private Map<String, Object> normalise(ConnectorType source,
                                          String eventType,
                                          Map<String, Object> raw) {
        final Map<String, Object> out = new LinkedHashMap<>();
        out.put("_source",    source.name());
        out.put("_eventType", eventType);

        // Connector-specific normalisation
        switch (source) {
            case SALESFORCE -> {
                out.put("entityId",   raw.getOrDefault("Id",   ""));
                out.put("entityType", raw.getOrDefault("type", "Lead"));
                out.put("owner",      raw.getOrDefault("OwnerId", ""));
                out.putAll(raw);
            }
            case SLACK -> {
                out.put("channel",  raw.getOrDefault("channel", ""));
                out.put("user",     raw.getOrDefault("user", ""));
                out.put("text",     raw.getOrDefault("text", ""));
                out.put("ts",       raw.getOrDefault("ts", ""));
            }
            case STRIPE -> {
                out.put("chargeId", raw.getOrDefault("id", ""));
                out.put("amount",   raw.getOrDefault("amount", 0));
                out.put("currency", raw.getOrDefault("currency", "usd"));
                out.put("status",   raw.getOrDefault("status", ""));
            }
            case SHOPIFY -> {
                out.put("orderId",  raw.getOrDefault("id", ""));
                out.put("total",    raw.getOrDefault("total_price", "0.00"));
                out.put("email",    raw.getOrDefault("email", ""));
            }
            default -> out.putAll(raw);
        }

        return out;
    }
}
