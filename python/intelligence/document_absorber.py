"""
document_absorber.py — Document Absorption Pipeline

Python implementation of the organism's document absorption engine.

Pipeline stages:
  1. Intake      — ingest multi-format documents (text/markdown/html/json/csv)
  2. Extract     — pull entities, keywords, and a summary
  3. Classify    — assign document type and topic tags
  4. Index       — create searchable index entries
  5. Absorb      — insert nodes and edges into the KnowledgeGraph

Also provides:
  - DigestGenerator: brief / detailed / executive digest from a document set
  - LivingDocument: a document that tracks its own mutation history

Ring: Memory Ring | Wire: intelligence-wire/absorb
"""

from __future__ import annotations

import csv
import io
import json
import re
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Optional

from knowledge_graph import KnowledgeGraph

PHI = 1.618033988749895


# ── Document formats ───────────────────────────────────────────────────────────

class DocFormat(Enum):
    TEXT     = auto()
    MARKDOWN = auto()
    HTML     = auto()
    JSON     = auto()
    CSV      = auto()
    UNKNOWN  = auto()


# ── Data classes ───────────────────────────────────────────────────────────────

@dataclass
class RawDocument:
    doc_id:    str = field(default_factory=lambda: str(uuid.uuid4()))
    content:   str = ""
    format:    DocFormat = DocFormat.TEXT
    metadata:  dict[str, Any] = field(default_factory=dict)
    ingested_at: int = field(default_factory=lambda: int(time.time() * 1000))


@dataclass
class ExtractedContent:
    doc_id:   str
    text:     str                  # clean plain-text
    entities: list[str]            # named entities
    keywords: list[str]
    summary:  str
    word_count: int


@dataclass
class IndexEntry:
    doc_id:     str
    title:      str
    topics:     list[str]
    doc_type:   str
    word_count: int
    absorbed_at: int = field(default_factory=lambda: int(time.time() * 1000))


# ── LivingDocument ─────────────────────────────────────────────────────────────

class LivingDocument:
    """
    A document that tracks its own mutation history.

    Every call to :meth:`mutate` creates a new version and records the diff,
    equivalent to the LivingDocument module in the JS sovereign-memory-sdk.
    """

    def __init__(self, doc_id: str, initial_content: str, metadata: Optional[dict] = None) -> None:
        self.doc_id   = doc_id
        self._versions: list[dict[str, Any]] = []
        self._current = initial_content
        self._metadata = dict(metadata or {})
        self._record_version("init", "", initial_content)

    @property
    def content(self) -> str:
        return self._current

    @property
    def version_count(self) -> int:
        return len(self._versions)

    def mutate(self, new_content: str, reason: str = "") -> dict[str, Any]:
        """Apply a mutation and record the change."""
        old = self._current
        self._current = new_content
        return self._record_version("mutate", old, new_content, reason)

    def get_history(self, count: int = 10) -> list[dict[str, Any]]:
        """Return the most recent `count` versions."""
        return self._versions[-count:]

    def _record_version(
        self, event: str, before: str, after: str, reason: str = ""
    ) -> dict[str, Any]:
        entry = {
            "version_id":  str(uuid.uuid4()),
            "event":       event,
            "before_len":  len(before),
            "after_len":   len(after),
            "reason":      reason,
            "timestamp":   int(time.time() * 1000),
        }
        self._versions.append(entry)
        return entry


# ── DocumentAbsorber ───────────────────────────────────────────────────────────

class DocumentAbsorber:
    """
    Full document absorption pipeline:
    intake → extract → classify → index → absorb (into KnowledgeGraph).

    Usage
    -----
    >>> graph = KnowledgeGraph()
    >>> absorber = DocumentAbsorber(graph)
    >>> entry = absorber.absorb("My text document about sovereignty.", DocFormat.TEXT)
    >>> print(entry.topics)
    """

    def __init__(self, graph: Optional[KnowledgeGraph] = None) -> None:
        self._graph = graph or KnowledgeGraph()
        self._index: dict[str, IndexEntry] = {}
        self._total_absorbed = 0

    # ── Pipeline ──────────────────────────────────────────────────────────────

    def absorb(
        self,
        content: str,
        fmt: DocFormat = DocFormat.TEXT,
        metadata: Optional[dict] = None,
    ) -> IndexEntry:
        """
        Run the full pipeline on a document and return its index entry.
        """
        # Stage 1: Intake
        raw = self._intake(content, fmt, metadata or {})

        # Stage 2: Extract
        extracted = self._extract(raw)

        # Stage 3: Classify
        doc_type, topics = self._classify(extracted)

        # Stage 4: Index
        entry = self._index_doc(extracted, doc_type, topics)

        # Stage 5: Absorb into knowledge graph
        self._absorb_into_graph(extracted, entry)

        self._total_absorbed += 1
        return entry

    def absorb_batch(
        self,
        documents: list[tuple[str, DocFormat]],
    ) -> list[IndexEntry]:
        """Absorb multiple documents and return all index entries."""
        return [self.absorb(content, fmt) for content, fmt in documents]

    # ── Stage 1: Intake ───────────────────────────────────────────────────────

    def _intake(self, content: str, fmt: DocFormat, metadata: dict) -> RawDocument:
        return RawDocument(content=content, format=fmt, metadata=metadata)

    # ── Stage 2: Extract ──────────────────────────────────────────────────────

    def _extract(self, raw: RawDocument) -> ExtractedContent:
        """Extract plain text, entities, keywords, and a summary."""
        text = self._to_plain_text(raw)
        entities = self._extract_entities(text)
        keywords = self._extract_keywords(text)
        summary  = self._summarise(text)
        return ExtractedContent(
            doc_id     = raw.doc_id,
            text       = text,
            entities   = entities,
            keywords   = keywords,
            summary    = summary,
            word_count = len(text.split()),
        )

    def _to_plain_text(self, raw: RawDocument) -> str:
        """Strip markup / structure to plain text."""
        if raw.format == DocFormat.HTML:
            return re.sub(r"<[^>]+>", " ", raw.content).strip()
        if raw.format == DocFormat.MARKDOWN:
            # Strip headings, bold, italic, links
            text = re.sub(r"#{1,6}\s+", "", raw.content)
            text = re.sub(r"\*{1,2}|_{1,2}", "", text)
            text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
            return text.strip()
        if raw.format == DocFormat.JSON:
            try:
                data = json.loads(raw.content)
                return json.dumps(data, indent=2)
            except json.JSONDecodeError:
                return raw.content
        if raw.format == DocFormat.CSV:
            try:
                reader = csv.DictReader(io.StringIO(raw.content))
                lines = [" | ".join(row.values()) for row in reader]
                return "\n".join(lines)
            except Exception:
                return raw.content
        return raw.content

    def _extract_entities(self, text: str) -> list[str]:
        """
        Lightweight entity extraction: capitalised words not at sentence start.
        In production, replace with spaCy or a transformer NER model.
        """
        words = text.split()
        entities = []
        for i, word in enumerate(words):
            clean = re.sub(r"[^\w]", "", word)
            if i > 0 and clean and clean[0].isupper() and clean.lower() not in {
                "the", "a", "an", "and", "or", "but", "in", "on", "at",
                "to", "for", "of", "with", "as", "by", "from",
            }:
                entities.append(clean)
        # Deduplicate while preserving order
        seen: set[str] = set()
        result = []
        for e in entities:
            if e not in seen:
                seen.add(e)
                result.append(e)
        return result[:20]

    def _extract_keywords(self, text: str) -> list[str]:
        """
        Frequency-based keyword extraction with stop-word removal.
        In production, replace with TF-IDF or KeyBERT.
        """
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
            "for", "of", "with", "as", "by", "from", "is", "are", "was",
            "were", "be", "been", "being", "it", "its", "this", "that",
            "these", "those", "i", "you", "he", "she", "we", "they",
        }
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        freq: dict[str, int] = {}
        for w in words:
            if w not in stop_words:
                freq[w] = freq.get(w, 0) + 1
        sorted_kw = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [kw for kw, _ in sorted_kw[:15]]

    def _summarise(self, text: str, max_sentences: int = 3) -> str:
        """
        Extractive summarisation: pick the top sentences by keyword density.
        In production, replace with an LLM summarisation call.
        """
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        if len(sentences) <= max_sentences:
            return text.strip()
        keywords = set(self._extract_keywords(text))
        scored = [
            (s, sum(1 for w in re.findall(r"\b\w+\b", s.lower()) if w in keywords))
            for s in sentences
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return " ".join(s for s, _ in scored[:max_sentences])

    # ── Stage 3: Classify ─────────────────────────────────────────────────────

    _TOPIC_SEEDS: dict[str, list[str]] = {
        "sovereignty":   ["sovereign", "governance", "doctrine", "owner"],
        "ai":            ["model", "intelligence", "neural", "llm", "gpt", "claude"],
        "blockchain":    ["canister", "icp", "neuron", "stake", "nns", "motoko"],
        "memory":        ["memory", "lineage", "spatial", "phi", "coordinates"],
        "routing":       ["router", "route", "dispatch", "agent", "worker"],
        "document":      ["document", "text", "markdown", "absorb", "knowledge"],
        "enterprise":    ["salesforce", "sap", "slack", "stripe", "shopify"],
        "organism":      ["organism", "heartbeat", "kernel", "ring", "beat"],
    }

    def _classify(self, extracted: ExtractedContent) -> tuple[str, list[str]]:
        text_lower = extracted.text.lower()
        topics = []
        for topic, seeds in self._TOPIC_SEEDS.items():
            if any(seed in text_lower for seed in seeds):
                topics.append(topic)

        # Determine document type by dominant topic
        if "blockchain" in topics or "sovereignty" in topics:
            doc_type = "sovereign-document"
        elif "ai" in topics or "routing" in topics:
            doc_type = "intelligence-document"
        elif "document" in topics or "memory" in topics:
            doc_type = "knowledge-document"
        else:
            doc_type = "general-document"

        return doc_type, topics or ["general"]

    # ── Stage 4: Index ────────────────────────────────────────────────────────

    def _index_doc(
        self, extracted: ExtractedContent, doc_type: str, topics: list[str]
    ) -> IndexEntry:
        title = extracted.summary[:80] if extracted.summary else f"doc-{extracted.doc_id[:8]}"
        entry = IndexEntry(
            doc_id     = extracted.doc_id,
            title      = title,
            topics     = topics,
            doc_type   = doc_type,
            word_count = extracted.word_count,
        )
        self._index[extracted.doc_id] = entry
        return entry

    # ── Stage 5: Absorb into knowledge graph ──────────────────────────────────

    def _absorb_into_graph(self, extracted: ExtractedContent, entry: IndexEntry) -> None:
        # Add document node
        self._graph.add_node(
            extracted.doc_id, "document",
            {"title": entry.title, "type": entry.doc_type,
             "word_count": entry.word_count, "summary": extracted.summary},
        )
        # Add entity nodes and link them to the document
        for entity in extracted.entities[:10]:
            eid = f"entity:{entity.lower()}"
            if not self._graph.get_node(eid):
                self._graph.add_node(eid, "entity", {"label": entity})
            try:
                self._graph.add_edge(extracted.doc_id, eid, "contains", weight=0.8)
            except ValueError:
                pass  # edge already exists

        # Add concept nodes for each topic
        for topic in entry.topics:
            cid = f"concept:{topic}"
            if not self._graph.get_node(cid):
                self._graph.add_node(cid, "concept", {"label": topic})
            try:
                self._graph.add_edge(extracted.doc_id, cid, "relates_to", weight=0.9)
            except ValueError:
                pass

    # ── DigestGenerator ───────────────────────────────────────────────────────

    def generate_digest(
        self,
        doc_ids: Optional[list[str]] = None,
        mode: str = "brief",
    ) -> str:
        """
        Generate a digest from absorbed documents.

        mode: "brief" | "detailed" | "executive"
        """
        entries = (
            [self._index[did] for did in doc_ids if did in self._index]
            if doc_ids
            else list(self._index.values())
        )
        if not entries:
            return "No documents available for digest."

        if mode == "brief":
            lines = [f"• [{e.doc_type}] {e.title} ({e.word_count} words)" for e in entries[:5]]
            return f"Digest ({len(entries)} documents):\n" + "\n".join(lines)

        if mode == "executive":
            topics = sorted({t for e in entries for t in e.topics})
            return (
                f"Executive Digest — {len(entries)} documents absorbed.\n"
                f"Dominant topics: {', '.join(topics[:8])}.\n"
                f"Total words: {sum(e.word_count for e in entries):,}."
            )

        # detailed
        lines = [
            f"[{e.doc_type}] {e.title}\n"
            f"  Topics: {', '.join(e.topics)} | Words: {e.word_count}"
            for e in entries
        ]
        return f"Detailed Digest ({len(entries)} documents):\n\n" + "\n\n".join(lines)

    # ── Diagnostics ───────────────────────────────────────────────────────────

    @property
    def graph(self) -> KnowledgeGraph:
        return self._graph

    def search_index(self, query: str, top_k: int = 5) -> list[IndexEntry]:
        """Simple keyword search over the index."""
        query_lower = query.lower()
        scored = [
            (e, sum(1 for w in query_lower.split() if w in e.title.lower()
                    or any(w in t for t in e.topics)))
            for e in self._index.values()
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [e for e, s in scored[:top_k] if s > 0]

    @property
    def total_absorbed(self) -> int:
        return self._total_absorbed

    @property
    def index(self) -> dict[str, IndexEntry]:
        return dict(self._index)
