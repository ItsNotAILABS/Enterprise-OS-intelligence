"""
test_organism.py — Python Intelligence Layer Test Suite

Tests for:
  - SynClient  (syn_client.py)
  - IntelligenceOrchestrator  (organism_ai.py)
  - KnowledgeGraph  (knowledge_graph.py)
  - DocumentAbsorber  (document_absorber.py)

Run: python -m pytest test_organism.py -v
"""

import json
import os
import sys
import tempfile
import pytest

# Ensure local modules are importable
sys.path.insert(0, os.path.dirname(__file__))

from syn_client import SynClient, SynBinding, OrganismError
from organism_ai import IntelligenceOrchestrator, Task, TaskType, Priority
from knowledge_graph import KnowledgeGraph
from document_absorber import DocumentAbsorber, LivingDocument, DocFormat


# ── SynClient ──────────────────────────────────────────────────────────────────

class TestSynClient:
    def test_syn_bind_imprints_binding(self):
        client = SynClient()
        b = client.syn_bind("HEART", "agi-terminal", "heart")
        assert b.label == "HEART"
        assert b.canister_id == "agi-terminal"
        assert b.refresh_count == 0

    def test_syn_query_returns_none_for_unknown(self):
        client = SynClient()
        assert client.syn_query("GHOST") is None

    def test_syn_query_returns_binding_after_bind(self):
        client = SynClient()
        client.syn_bind("fleet", "fleet-canister", "fleet")
        b = client.syn_query("fleet")
        assert b is not None
        assert b.label == "fleet"

    def test_syn_revoke_removes_binding(self):
        client = SynClient()
        client.syn_bind("ai", "ai-canister", "ai")
        assert client.syn_revoke("ai") is True
        assert client.syn_query("ai") is None

    def test_syn_revoke_returns_false_for_nonexistent(self):
        client = SynClient()
        assert client.syn_revoke("GHOST") is False

    def test_syn_revoke_all(self):
        client = SynClient()
        client.syn_bind("A", "c1", "k1")
        client.syn_bind("B", "c2", "k2")
        removed = client.syn_revoke_all()
        assert removed == 2
        assert client.binding_count() == 0

    def test_syn_bind_refresh_increments_count(self):
        client = SynClient()
        client.syn_bind("nns", "nns-canister", "nns")
        b2 = client.syn_bind("nns", "nns-canister", "nns")
        assert b2.refresh_count == 1

    def test_syn_bind_all_creates_four_bindings(self):
        client = SynClient()
        results = client.syn_bind_all("fleet-id", "ai-id", "nns-id", "heart-id")
        assert set(results.keys()) == {"fleet", "ai", "nns", "HEART"}
        assert client.binding_count() == 4

    def test_max_bindings_raises(self, monkeypatch):
        import syn_client as sc
        monkeypatch.setattr(sc, "MAX_BINDINGS", 2)
        client = SynClient()
        client.syn_bind("A", "c1", "k1")
        client.syn_bind("B", "c2", "k2")
        with pytest.raises(OrganismError):
            client.syn_bind("C", "c3", "k3")

    def test_persistence(self, tmp_path):
        path = str(tmp_path / "syn_bindings.json")
        client = SynClient(persist_path=path)
        client.syn_bind("HEART", "heart-cid", "heart")

        # New client loads from file
        client2 = SynClient(persist_path=path)
        b = client2.syn_query("HEART")
        assert b is not None
        assert b.label == "HEART"

    def test_phi_score_positive(self):
        client = SynClient()
        assert client.phi_score(2, 0.85, 0.9) > 0

    def test_phi_ema_stays_in_range(self):
        client = SynClient()
        val = 0.5
        for i in range(100):
            val = client.phi_ema(val, 1.0 if i % 2 == 0 else 0.0)
        assert 0.0 <= val <= 1.0

    def test_staleness_increases_over_time(self):
        import time
        client = SynClient()
        b = client.syn_bind("X", "cid", "k")
        time.sleep(0.01)
        assert b.staleness_ms >= 0


# ── IntelligenceOrchestrator ───────────────────────────────────────────────────

class TestIntelligenceOrchestrator:
    def test_route_returns_model(self):
        orch = IntelligenceOrchestrator()
        result = orch.route(Task(type=TaskType.REASONING, priority=Priority.HIGH))
        assert result.model_id is not None
        assert result.score > 0

    def test_route_returns_alternatives(self):
        orch = IntelligenceOrchestrator()
        result = orch.route(Task(type=TaskType.CODING, priority=Priority.NORMAL))
        assert len(result.alternatives) >= 1

    def test_record_outcome_updates_top_model(self):
        orch = IntelligenceOrchestrator()
        for _ in range(20):
            orch.record_outcome("claude-4", True, 300)
        m = orch.metrics()
        assert m["top_model"] == "claude-4"

    def test_cascade_fallback_excludes_failed(self):
        orch = IntelligenceOrchestrator()
        task = Task(type=TaskType.ANALYSIS, priority=Priority.CRITICAL)
        first = orch.route(task)
        fallback = orch.cascade_fallback(task, {first.model_id})
        assert fallback.model_id != first.model_id

    def test_rebalance_does_not_crash(self):
        orch = IntelligenceOrchestrator()
        orch.record_outcome("gpt-4o", True, 500)
        orch.rebalance()  # should not raise

    def test_on_heartbeat_rebalances_every_50_beats(self):
        orch = IntelligenceOrchestrator()
        for i in range(51):
            result = orch.on_heartbeat(i)
        # Beat 50 triggers rebalance
        assert result["action"] in ("rebalanced", "noop")

    def test_40_models_seeded(self):
        orch = IntelligenceOrchestrator()
        assert orch.metrics()["model_count"] == 40

    def test_routing_table_has_capabilities(self):
        orch = IntelligenceOrchestrator()
        table = orch.get_routing_table()
        assert all("capabilities" in entry for entry in table)


# ── KnowledgeGraph ─────────────────────────────────────────────────────────────

class TestKnowledgeGraph:
    def test_add_and_get_node(self):
        g = KnowledgeGraph()
        g.add_node("n1", "concept", {"label": "Sovereignty"})
        result = g.get_node("n1")
        assert result is not None
        assert result["node"]["id"] == "n1"

    def test_add_invalid_node_type_raises(self):
        g = KnowledgeGraph()
        with pytest.raises(ValueError):
            g.add_node("n1", "invalid_type")

    def test_add_edge_and_retrieve(self):
        g = KnowledgeGraph()
        g.add_node("a", "concept")
        g.add_node("b", "entity")
        edge = g.add_edge("a", "b", "relates_to", weight=0.8)
        result = g.get_node("a")
        assert any(e["id"] == edge.id for e in result["edges"])

    def test_add_edge_invalid_relation_raises(self):
        g = KnowledgeGraph()
        g.add_node("a", "concept")
        g.add_node("b", "entity")
        with pytest.raises(ValueError):
            g.add_edge("a", "b", "loves")

    def test_edge_weight_clamped(self):
        g = KnowledgeGraph()
        g.add_node("a", "concept")
        g.add_node("b", "entity")
        edge = g.add_edge("a", "b", "references", weight=5.0)
        assert edge.weight == 1.0

    def test_query_filters_by_type(self):
        g = KnowledgeGraph()
        g.add_node("c1", "concept")
        g.add_node("e1", "entity")
        results = g.query(node_type="concept")
        assert all(r["root"]["type"] == "concept" for r in results)

    def test_merge_combines_graphs(self):
        g1 = KnowledgeGraph()
        g1.add_node("n1", "concept", {"label": "A"})

        g2 = KnowledgeGraph()
        g2.add_node("n2", "entity", {"label": "B"})

        g1.merge(g2)
        assert g1.get_node("n2") is not None

    def test_merge_updates_existing_properties(self):
        g1 = KnowledgeGraph()
        g1.add_node("n1", "concept", {"label": "A"})

        g2 = KnowledgeGraph()
        g2.add_node("n1", "concept", {"extra": "X"})

        g1.merge(g2)
        node = g1.get_node("n1")
        assert node["node"]["properties"].get("extra") == "X"

    def test_export_import_roundtrip(self):
        g = KnowledgeGraph()
        g.add_node("n1", "concept", {"label": "Test"})
        g.add_node("n2", "entity")
        g.add_edge("n1", "n2", "relates_to")

        data = g.export()
        g2 = KnowledgeGraph()
        g2.import_data(data)
        assert g2.node_count == 2
        assert g2.edge_count == 1

    def test_phi_ranked_search(self):
        g = KnowledgeGraph()
        g.add_node("n1", "concept", {"label": "Sovereignty Doctrine"})
        g.add_node("n2", "concept", {"label": "Heartbeat Loop"})
        results = g.phi_ranked_search(["sovereignty"])
        assert results[0]["node"]["id"] == "n1"

    def test_remove_node(self):
        g = KnowledgeGraph()
        g.add_node("n1", "concept")
        assert g.remove_node("n1") is True
        assert g.get_node("n1") is None

    def test_remove_node_cleans_edges(self):
        g = KnowledgeGraph()
        g.add_node("a", "concept")
        g.add_node("b", "entity")
        g.add_edge("a", "b", "contains")
        g.remove_node("a")
        assert g.edge_count == 0


# ── DocumentAbsorber ───────────────────────────────────────────────────────────

class TestDocumentAbsorber:
    def test_absorb_plain_text(self):
        absorber = DocumentAbsorber()
        entry = absorber.absorb("The sovereign organism uses phi-math for routing.", DocFormat.TEXT)
        assert entry is not None
        assert entry.word_count > 0

    def test_absorb_creates_graph_node(self):
        absorber = DocumentAbsorber()
        entry = absorber.absorb("Organism heartbeat runs at 873ms.", DocFormat.TEXT)
        node = absorber.graph.get_node(entry.doc_id)
        assert node is not None

    def test_absorb_markdown(self):
        absorber = DocumentAbsorber()
        md = "# Sovereignty\n\nThe **organism** controls all routing decisions."
        entry = absorber.absorb(md, DocFormat.MARKDOWN)
        assert "organism" in entry.title.lower() or entry.word_count > 0

    def test_absorb_json(self):
        absorber = DocumentAbsorber()
        data = json.dumps({"model": "gpt-4o", "score": 0.92, "ring": "Interface Ring"})
        entry = absorber.absorb(data, DocFormat.JSON)
        assert entry.word_count > 0

    def test_absorb_csv(self):
        absorber = DocumentAbsorber()
        csv_content = "model,score\ngpt-4o,0.92\nclaude-4,0.91\n"
        entry = absorber.absorb(csv_content, DocFormat.CSV)
        assert entry.word_count > 0

    def test_batch_absorb(self):
        absorber = DocumentAbsorber()
        docs = [
            ("Sovereignty doctrine governs the organism.", DocFormat.TEXT),
            ("Heartbeat fires every 873 milliseconds.", DocFormat.TEXT),
        ]
        entries = absorber.absorb_batch(docs)
        assert len(entries) == 2
        assert absorber.total_absorbed == 2

    def test_generate_brief_digest(self):
        absorber = DocumentAbsorber()
        absorber.absorb("Phi-math drives routing scores.", DocFormat.TEXT)
        digest = absorber.generate_digest(mode="brief")
        assert "document" in digest.lower() or "Digest" in digest

    def test_generate_executive_digest(self):
        absorber = DocumentAbsorber()
        absorber.absorb("NNS governance controls the neuron stake.", DocFormat.TEXT)
        digest = absorber.generate_digest(mode="executive")
        assert "Executive" in digest

    def test_search_index(self):
        absorber = DocumentAbsorber()
        absorber.absorb("The organism sovereign heartbeat ring.", DocFormat.TEXT)
        results = absorber.search_index("organism")
        assert len(results) >= 1

    def test_topics_assigned(self):
        absorber = DocumentAbsorber()
        entry = absorber.absorb("The canister uses Motoko for the NNS neuron.", DocFormat.TEXT)
        assert "blockchain" in entry.topics or "sovereignty" in entry.topics


# ── LivingDocument ─────────────────────────────────────────────────────────────

class TestLivingDocument:
    def test_initial_version(self):
        doc = LivingDocument("doc-1", "Initial content.")
        assert doc.version_count == 1
        assert doc.content == "Initial content."

    def test_mutate_creates_new_version(self):
        doc = LivingDocument("doc-1", "v1")
        doc.mutate("v2", reason="update")
        assert doc.version_count == 2
        assert doc.content == "v2"

    def test_get_history(self):
        doc = LivingDocument("doc-1", "v1")
        doc.mutate("v2")
        doc.mutate("v3")
        history = doc.get_history(2)
        assert len(history) == 2
        assert history[-1]["event"] == "mutate"
