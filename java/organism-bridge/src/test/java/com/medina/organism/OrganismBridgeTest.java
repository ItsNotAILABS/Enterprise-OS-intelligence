package com.medina.organism;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the Organism Bridge Java SDK.
 */
class OrganismBridgeTest {

    // ── OrganismClient / SYN ──────────────────────────────────────────────────

    @Test
    @DisplayName("synBind imprints a local binding")
    void synBind_imprintsLocalBinding() {
        final OrganismClient client = OrganismClient.builder().build();
        final SynBinding binding = client.synBind("HEART", "agi-terminal-id", "heart");

        assertNotNull(binding);
        assertEquals("HEART", binding.getLabel());
        assertEquals("agi-terminal-id", binding.getCanisterId());
        assertEquals("heart", binding.getDataKey());
        assertEquals(0, binding.getRefreshCount());
    }

    @Test
    @DisplayName("synQuery returns empty for unknown label")
    void synQuery_unknownLabel_returnsEmpty() {
        final OrganismClient client = OrganismClient.builder().build();
        final Optional<SynBinding> result = client.synQuery("UNKNOWN");
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("synQuery returns the binding after synBind")
    void synQuery_returnsBindingAfterBind() {
        final OrganismClient client = OrganismClient.builder().build();
        client.synBind("fleet", "fleet-canister", "fleet");

        final Optional<SynBinding> result = client.synQuery("fleet");
        assertTrue(result.isPresent());
        assertEquals("fleet", result.get().getLabel());
    }

    @Test
    @DisplayName("synRevoke removes the binding")
    void synRevoke_removesBinding() {
        final OrganismClient client = OrganismClient.builder().build();
        client.synBind("ai", "ai-canister", "ai");

        assertTrue(client.synRevoke("ai"));
        assertTrue(client.synQuery("ai").isEmpty());
    }

    @Test
    @DisplayName("synRevoke returns false for non-existent label")
    void synRevoke_nonExistent_returnsFalse() {
        final OrganismClient client = OrganismClient.builder().build();
        assertFalse(client.synRevoke("GHOST"));
    }

    @Test
    @DisplayName("synRevokeAll clears all bindings")
    void synRevokeAll_clearsAll() {
        final OrganismClient client = OrganismClient.builder().build();
        client.synBind("A", "c1", "k1");
        client.synBind("B", "c2", "k2");
        client.synBind("C", "c3", "k3");

        final int removed = client.synRevokeAll();
        assertEquals(3, removed);
        assertEquals(0, client.getBindings().size());
    }

    @Test
    @DisplayName("second synBind increments refreshCount")
    void synBind_refresh_incrementsCount() {
        final OrganismClient client = OrganismClient.builder().build();
        client.synBind("nns", "nns-canister", "nns");
        final SynBinding refreshed = client.synBind("nns", "nns-canister", "nns");

        assertEquals(1, refreshed.getRefreshCount());
    }

    // ── Phi math ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("phiScore returns a positive value")
    void phiScore_returnsPositive() {
        final OrganismClient client = OrganismClient.builder().build();
        final double score = client.phiScore(2, 0.85, 0.9);
        assertTrue(score > 0);
    }

    @Test
    @DisplayName("phiEma stays in [0,1] for bounded inputs")
    void phiEma_staysInRange() {
        final OrganismClient client = OrganismClient.builder().build();
        double val = 0.5;
        for (int i = 0; i < 100; i++) {
            val = client.phiEma(val, i % 2 == 0 ? 1.0 : 0.0);
        }
        assertTrue(val >= 0.0 && val <= 1.0);
    }

    // ── IntelligenceRouter ────────────────────────────────────────────────────

    @Test
    @DisplayName("route returns a valid model for a reasoning task")
    void router_routesReasoningTask() {
        final IntelligenceRouter router = new IntelligenceRouter();
        final IntelligenceRouter.RoutingResult result =
                router.route(new IntelligenceRouter.Task(
                        "t1",
                        IntelligenceRouter.TaskType.REASONING,
                        IntelligenceRouter.Priority.HIGH));

        assertNotNull(result.modelId());
        assertTrue(result.score() > 0);
        assertFalse(result.alternatives().isEmpty());
    }

    @Test
    @DisplayName("recordOutcome updates reputation")
    void router_recordOutcome_updatesReputation() {
        final IntelligenceRouter router = new IntelligenceRouter();
        // Record many successes for GPT-4o
        for (int i = 0; i < 10; i++) {
            router.recordOutcome("gpt-4o", true, 500);
        }
        final Map<String, Object> metrics = router.getMetrics();
        assertEquals("gpt-4o", metrics.get("topModel"));
    }

    @Test
    @DisplayName("cascadeFallback excludes failed models")
    void router_cascadeFallback_excludesFailedModels() {
        final IntelligenceRouter router = new IntelligenceRouter();
        final IntelligenceRouter.Task task = new IntelligenceRouter.Task(
                "t2", IntelligenceRouter.TaskType.CODING,
                IntelligenceRouter.Priority.CRITICAL);

        final IntelligenceRouter.RoutingResult first = router.route(task);
        final IntelligenceRouter.RoutingResult fallback =
                router.cascadeFallback(task, Set.of(first.modelId()));

        assertNotNull(fallback.modelId());
        assertNotEquals(first.modelId(), fallback.modelId());
    }

    // ── EnterpriseConnector ───────────────────────────────────────────────────

    @Test
    @DisplayName("ingest normalises a Salesforce event")
    void connector_ingest_salesforce() {
        final EnterpriseConnector connector = new EnterpriseConnector();
        connector.register(new EnterpriseConnector.ConnectorConfig(
                EnterpriseConnector.ConnectorType.SALESFORCE,
                "test-api-key", "https://api.salesforce.com", Map.of()));

        final var payload = Map.<String, Object>of("Id", "003abc", "type", "Contact", "OwnerId", "005xyz");
        final EnterpriseConnector.OrganismEvent event =
                connector.ingest(EnterpriseConnector.ConnectorType.SALESFORCE, "CONTACT_CREATED", payload);

        assertNotNull(event.eventId());
        assertEquals(EnterpriseConnector.ConnectorType.SALESFORCE, event.source());
        assertEquals("CONTACT_CREATED", event.eventType());
        assertEquals("003abc", event.payload().get("entityId"));
    }

    @Test
    @DisplayName("event handler is called on ingest")
    void connector_eventHandler_isCalled() {
        final EnterpriseConnector connector = new EnterpriseConnector();
        connector.register(new EnterpriseConnector.ConnectorConfig(
                EnterpriseConnector.ConnectorType.SLACK,
                "xoxb-token", "https://slack.com/api", Map.of()));

        final List<EnterpriseConnector.OrganismEvent> received = new java.util.ArrayList<>();
        connector.onEvent(received::add);

        connector.ingest(EnterpriseConnector.ConnectorType.SLACK, "MESSAGE",
                Map.of("channel", "#general", "user", "U001", "text", "Hello organism", "ts", "12345"));

        assertEquals(1, received.size());
        assertEquals("#general", received.get(0).payload().get("channel"));
    }

    @Test
    @DisplayName("ingest on unregistered connector throws OrganismException")
    void connector_ingest_unregistered_throws() {
        final EnterpriseConnector connector = new EnterpriseConnector();
        assertThrows(OrganismException.class, () ->
                connector.ingest(EnterpriseConnector.ConnectorType.STRIPE,
                        "CHARGE_SUCCEEDED", Map.of()));
    }

    @Test
    @DisplayName("dispatch returns acknowledgement")
    void connector_dispatch_returnsAck() {
        final EnterpriseConnector connector = new EnterpriseConnector();
        connector.register(new EnterpriseConnector.ConnectorConfig(
                EnterpriseConnector.ConnectorType.TWILIO,
                "ACxxx", "https://api.twilio.com", Map.of()));

        final Map<String, Object> ack = connector.dispatch(
                EnterpriseConnector.ConnectorType.TWILIO,
                "SEND_SMS",
                Map.of("to", "+1555000000", "body", "Organism heartbeat OK"));

        assertEquals("dispatched", ack.get("status"));
        assertEquals("TWILIO", ack.get("connector"));
    }
}
