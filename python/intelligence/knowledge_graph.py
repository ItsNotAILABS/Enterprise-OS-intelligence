"""
knowledge_graph.py — Sovereign Knowledge Graph

Python implementation of the organism's knowledge graph engine.

Provides:
  - Typed node and edge management (concept / entity / document / fact)
  - BFS traversal with depth and relation filters
  - Graph merging (equivalent to KnowledgeGraph.merge() in JS)
  - Phi-resonance node scoring (relevance × phi-distance weight)
  - Export / import as JSON for persistence

Ring: Memory Ring | Wire: intelligence-wire/graph
"""

from __future__ import annotations

import json
import math
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

PHI = 1.618033988749895

# ── Allowed types and relations ────────────────────────────────────────────────

NODE_TYPES    = {"concept", "entity", "document", "fact"}
EDGE_RELATIONS = {"references", "contains", "relates_to", "derived_from", "contradicts"}


# ── Data classes ───────────────────────────────────────────────────────────────

@dataclass
class Node:
    id:         str
    type:       str
    properties: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        return {"id": self.id, "type": self.type,
                "properties": self.properties, "created_at": self.created_at}


@dataclass
class Edge:
    id:         str = field(default_factory=lambda: str(uuid.uuid4()))
    source_id:  str = ""
    target_id:  str = ""
    relation:   str = ""
    weight:     float = 1.0
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        return {"id": self.id, "source_id": self.source_id, "target_id": self.target_id,
                "relation": self.relation, "weight": self.weight, "created_at": self.created_at}


# ── KnowledgeGraph ─────────────────────────────────────────────────────────────

class KnowledgeGraph:
    """
    In-memory knowledge graph with phi-resonance scoring.

    Example
    -------
    >>> g = KnowledgeGraph()
    >>> g.add_node("n1", "concept", {"label": "Sovereignty"})
    >>> g.add_node("n2", "entity",  {"label": "Organism"})
    >>> g.add_edge("n1", "n2", "relates_to", weight=0.9)
    >>> results = g.query(node_type="concept")
    """

    def __init__(self) -> None:
        self._nodes:     dict[str, Node]       = {}
        self._edges:     dict[str, Edge]       = {}
        self._adjacency: dict[str, set[str]]   = {}  # node_id → set[edge_id]

    # ── Nodes ─────────────────────────────────────────────────────────────────

    def add_node(self, node_id: str, node_type: str,
                 properties: Optional[dict] = None) -> Node:
        """Add a node to the graph."""
        if not node_id:
            raise ValueError("node_id is required")
        if node_type not in NODE_TYPES:
            raise ValueError(f"Invalid node type '{node_type}'. Use: {NODE_TYPES}")
        node = Node(id=node_id, type=node_type, properties=dict(properties or {}))
        self._nodes[node_id] = node
        self._adjacency.setdefault(node_id, set())
        return node

    def get_node(self, node_id: str) -> Optional[dict]:
        """Return node + its touching edges."""
        node = self._nodes.get(node_id)
        if node is None:
            return None
        edges = [self._edges[eid].to_dict()
                 for eid in self._adjacency.get(node_id, set())
                 if eid in self._edges]
        return {"node": node.to_dict(), "edges": edges}

    def remove_node(self, node_id: str) -> bool:
        """Remove a node and all its edges."""
        if node_id not in self._nodes:
            return False
        # Remove all touching edges
        for eid in list(self._adjacency.get(node_id, set())):
            edge = self._edges.pop(eid, None)
            if edge:
                other = edge.target_id if edge.source_id == node_id else edge.source_id
                self._adjacency.get(other, set()).discard(eid)
        del self._adjacency[node_id]
        del self._nodes[node_id]
        return True

    # ── Edges ─────────────────────────────────────────────────────────────────

    def add_edge(self, source_id: str, target_id: str,
                 relation: str, weight: float = 1.0) -> Edge:
        """Add a directed edge between two nodes."""
        if source_id not in self._nodes:
            raise ValueError(f"Source node '{source_id}' not found")
        if target_id not in self._nodes:
            raise ValueError(f"Target node '{target_id}' not found")
        if relation not in EDGE_RELATIONS:
            raise ValueError(f"Invalid relation '{relation}'. Use: {EDGE_RELATIONS}")

        edge = Edge(
            source_id = source_id,
            target_id = target_id,
            relation  = relation,
            weight    = max(0.0, min(1.0, weight)),
        )
        self._edges[edge.id] = edge
        self._adjacency[source_id].add(edge.id)
        self._adjacency[target_id].add(edge.id)
        return edge

    # ── Query ─────────────────────────────────────────────────────────────────

    def query(
        self,
        node_type: Optional[str] = None,
        relation:  Optional[str] = None,
        depth:     int = 1,
    ) -> list[dict]:
        """
        Query the graph.  Returns each matching node together with its
        BFS-connected subgraph up to ``depth`` hops.
        """
        seeds = list(self._nodes.values())
        if node_type:
            seeds = [n for n in seeds if n.type == node_type]

        results = []
        for seed in seeds:
            visited: set[str] = set()
            connected = self._traverse(seed.id, relation, depth, visited)
            results.append({"root": seed.to_dict(), "connected": connected})
        return results

    # ── Phi-resonance scoring ─────────────────────────────────────────────────

    def phi_score_node(self, node_id: str, query_terms: list[str]) -> float:
        """
        Compute a phi-resonance relevance score for a node.

        Score = Σ_i (match_weight_i × φ^(-i))  where match_weight is 1.0 if
        the query term appears in the node label or properties, 0 otherwise.
        """
        node = self._nodes.get(node_id)
        if not node:
            return 0.0
        text = json.dumps(node.to_dict()).lower()
        score = sum(
            (1.0 if term.lower() in text else 0.0) * (PHI ** -i)
            for i, term in enumerate(query_terms)
        )
        return score

    def phi_ranked_search(self, query_terms: list[str],
                          node_type: Optional[str] = None,
                          top_k: int = 10) -> list[dict]:
        """
        Return the top-K nodes ranked by phi-resonance score.
        """
        candidates = [
            n for n in self._nodes.values()
            if node_type is None or n.type == node_type
        ]
        scored = [
            {"node": n.to_dict(), "score": self.phi_score_node(n.id, query_terms)}
            for n in candidates
        ]
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    # ── Merge ─────────────────────────────────────────────────────────────────

    def merge(self, other: "KnowledgeGraph") -> None:
        """Merge another graph into this one.  Existing node properties are deep-merged."""
        data = other.export()
        for node_data in data["nodes"]:
            nid = node_data["id"]
            if nid in self._nodes:
                self._nodes[nid].properties.update(node_data["properties"])
            else:
                self.add_node(nid, node_data["type"], node_data["properties"])
        for edge_data in data["edges"]:
            # Skip duplicate source/target/relation triples
            duplicate = any(
                e.source_id == edge_data["source_id"]
                and e.target_id == edge_data["target_id"]
                and e.relation == edge_data["relation"]
                for e in self._edges.values()
            )
            if (not duplicate
                    and edge_data["source_id"] in self._nodes
                    and edge_data["target_id"] in self._nodes):
                self.add_edge(
                    edge_data["source_id"],
                    edge_data["target_id"],
                    edge_data["relation"],
                    edge_data["weight"],
                )

    # ── Export / Import ───────────────────────────────────────────────────────

    def export(self) -> dict[str, list]:
        """Export the full graph as a JSON-serialisable dict."""
        return {
            "nodes": [n.to_dict() for n in self._nodes.values()],
            "edges": [e.to_dict() for e in self._edges.values()],
        }

    def import_data(self, data: dict) -> None:
        """Import nodes and edges from a previously exported dict."""
        for n in data.get("nodes", []):
            if n["id"] not in self._nodes:
                self.add_node(n["id"], n["type"], n.get("properties", {}))
        for e in data.get("edges", []):
            if (e["source_id"] in self._nodes and e["target_id"] in self._nodes):
                try:
                    self.add_edge(e["source_id"], e["target_id"],
                                  e["relation"], e.get("weight", 1.0))
                except ValueError:
                    pass  # skip invalid edges

    @property
    def node_count(self) -> int:
        return len(self._nodes)

    @property
    def edge_count(self) -> int:
        return len(self._edges)

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _traverse(
        self,
        start_id: str,
        relation: Optional[str],
        max_depth: int,
        visited: set[str],
    ) -> list[dict]:
        result  = []
        frontier = [(start_id, 0)]

        while frontier:
            node_id, depth = frontier.pop(0)
            if node_id in visited or depth > max_depth:
                continue
            visited.add(node_id)

            for eid in self._adjacency.get(node_id, set()):
                edge = self._edges.get(eid)
                if not edge:
                    continue
                if relation and edge.relation != relation:
                    continue
                neighbor_id = edge.target_id if edge.source_id == node_id else edge.source_id
                neighbor    = self._nodes.get(neighbor_id)
                if neighbor and neighbor_id not in visited:
                    result.append({"node": neighbor.to_dict(), "edge": edge.to_dict()})
                    frontier.append((neighbor_id, depth + 1))

        return result
