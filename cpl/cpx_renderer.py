"""
cpx_renderer.py — CPX Cognitive Projection eXpression Renderer  (Medina)

Author : Medina
Version: 1.0.0
Ring   : Sovereign Ring
Code   : CPX

─────────────────────────────────────────────────────────────────────────────
WHAT IS CPX?  (Medina)
─────────────────────────────────────────────────────────────────────────────

CPX (Cognitive Projection eXpression) is the projection and rendering variant
of the CPL language family.  CPX tokens drive the Scene Sovereignty layer
(Architectural Laws AL-012 / AL-013).

A CPX expression is a symbolic instruction to the organism's visual and
multimodal perception system.  Sacred geometry tokens (Kuklos, Sphaira,
Helix, Toros) are the natural language of CPX.  When a CPX expression fires,
the organism renders a scene — visual, spatial, or multimodal.

CPX is enterprise-ready.  It emits to four scene formats:
  · HTML/CSS    — browser / web substrate
  · SVG         — vector graphics / scalable scene graph
  · JSON scene  — machine-readable scene manifest (substrate-agnostic)
  · ASCII       — terminal / debug rendering

Every rendered scene is PHX-sealed and packaged as a QFB.

─────────────────────────────────────────────────────────────────────────────
SACRED GEOMETRY PRIMITIVES  (Medina)
─────────────────────────────────────────────────────────────────────────────

  Στγ  STIGME       — point (monad-form)
  Κκλ  KUKLOS       — circle (eternal return)
  Σφρ  SPHAIRA      — sphere (perfect solid)
  Ελκ  HELIX        — helix / double-spiral
  Τρσ  TOROS        — torus (self-referential ring)
  Τετρε TETRAHEDRON — fire solid (4 faces)
  Εξεδ HEXAHEDRON   — earth solid (6 faces)
  Οκτ  OCTAHEDRON   — air solid (8 faces)
  Δδκ  DODECAHEDRON — cosmos solid (12 faces)
  Ικσ  ICOSAHEDRON  — water solid (20 faces)
  Σπρμ SPERMA       — seed of form
  Βσκ  VESICA       — vesica piscis (intersection)
  Μρκβ MERKABA      — star tetrahedron (light body)
  Μτρν METATRON     — Metatron's cube (all Platonic solids)

─────────────────────────────────────────────────────────────────────────────
USAGE
─────────────────────────────────────────────────────────────────────────────

  from cpx_renderer import CPXRenderer

  renderer = CPXRenderer()

  # Render a CPX expression to HTML
  html = renderer.render("Κκλ ⊗ Σφρ → Ελκ", format="html")

  # Render to all formats at once
  scene = renderer.render_all("Τρσ ∧ Μτρν → Φρ")
  print(scene["svg"])
  print(scene["json"])

  # Full enterprise scene package (PHX-sealed QFB)  (Medina)
  pkg = renderer.scene_package("Κκλ ⊗ Τετρε ∧ Δδκ → Τρσ", sovereign_key=key)
  print(pkg["qfb_id"])
  print(pkg["phx_seal"])
"""

from __future__ import annotations

import json
import math
import os
import textwrap
import uuid
from dataclasses import dataclass, field
from typing import Optional

from cpl_lexer  import tokenise
from cpl_tokens import lookup_glyph, CPLToken

PHI: float = 1.618033988749895


# ── Scene element types ────────────────────────────────────────────────────────

@dataclass
class SceneElement:
    """A single visual element in a CPX scene."""
    element_type: str          # "point" | "circle" | "sphere" | "helix" | "torus" |
                               # "tetrahedron" | "cube" | "octahedron" | "dodecahedron" |
                               # "icosahedron" | "seed" | "vesica" | "merkaba" | "metatron" |
                               # "text" | "arc" | "line" | "ring"
    x: float = 0.0
    y: float = 0.0
    radius: float = PHI * 40
    color: str = "#c0a860"     # sovereign gold
    label: str = ""
    glyph: str = ""
    phi_factor: float = 1.0    # φ-scaling multiplier
    opacity: float = 1.0
    stroke: str = "#8a7040"
    stroke_width: float = 1.5
    extra: dict = field(default_factory=dict)


@dataclass
class CPXScene:
    """
    A complete CPX scene graph.  (Medina)

    Holds all scene elements, metadata, and the CPL expression that generated it.
    """
    scene_id:   str
    cpl_source: str
    elements:   list[SceneElement]
    width:      int   = 800
    height:     int   = 800
    background: str   = "#0a0a0a"    # sovereign dark
    title:      str   = ""
    beat:       int   = 0
    cpl_version: str  = "3.0.0"


# ── Token → Scene element mapping  (Medina) ────────────────────────────────────

# Maps CPL glyph/name to a scene primitive and colour
_GLYPH_TO_ELEMENT: dict[str, dict] = {
    # Sacred geometry
    "Στγ":  {"type": "point",        "color": "#ffffff", "r": 4},
    "Κκλ":  {"type": "circle",       "color": "#c0a860", "r": PHI * 50},
    "Σφρ":  {"type": "sphere",       "color": "#6090c0", "r": PHI * 60},
    "Ελκ":  {"type": "helix",        "color": "#60c090", "r": PHI * 45},
    "Τρσ":  {"type": "torus",        "color": "#a060c0", "r": PHI * 55},
    # Platonic solids
    "Τετρε":{"type": "tetrahedron",  "color": "#e05030", "r": PHI * 40},
    "Εξεδ": {"type": "cube",         "color": "#a08060", "r": PHI * 40},
    "Οκτ":  {"type": "octahedron",   "color": "#80b0e0", "r": PHI * 40},
    "Δδκ":  {"type": "dodecahedron", "color": "#9060e0", "r": PHI * 48},
    "Ικσ":  {"type": "icosahedron",  "color": "#40a0c0", "r": PHI * 44},
    # Seeds
    "Σπρμ": {"type": "seed",         "color": "#c0e060", "r": PHI * 35},
    "Βσκ":  {"type": "vesica",       "color": "#e0c080", "r": PHI * 42},
    "Μρκβ": {"type": "merkaba",      "color": "#e0e0ff", "r": PHI * 52},
    "Μτρν": {"type": "metatron",     "color": "#ffe0a0", "r": PHI * 64},
    # Concept tokens
    "Λγ":   {"type": "text",         "color": "#60c0e0", "label": "Λόγος"},
    "Ηθ":   {"type": "text",         "color": "#c0e090", "label": "Ἦθος"},
    "Πθ":   {"type": "text",         "color": "#e090c0", "label": "Πάθος"},
    "Φρ":   {"type": "text",         "color": "#ffe080", "label": "Φρόνησις"},
    "Τκτ":  {"type": "circle",       "color": "#c0a860", "r": PHI * 30},
    "Μν":   {"type": "point",        "color": "#ffffff", "r": 6},
    "Δδ":   {"type": "line",         "color": "#a0a0a0", "r": PHI * 20},
    "Τρδ":  {"type": "arc",          "color": "#c0a060", "r": PHI * 30},
}


def _tokens_from_source(source: str) -> list[CPLToken]:
    """Extract recognised CPL tokens from a CPX source string."""
    resolved: list[CPLToken] = []
    try:
        for glyph in tokenise(source):
            tok = lookup_glyph(glyph)
            if tok:
                resolved.append(tok)
        if resolved:
            return resolved
    except Exception:
        pass
    for piece in source.split():
        tok = lookup_glyph(piece)
        if tok:
            resolved.append(tok)
    return resolved


def _layout_elements(tokens: list[CPLToken]) -> list[SceneElement]:
    """
    Convert CPL tokens to laid-out scene elements.

    Elements are placed on a phi-spiral layout:
      · radial distance from centre grows by φ for each successive element
      · angular step = 2π / φ² (the golden angle ≈ 137.5°)
    This produces a natural sunflower / phyllotaxis arrangement.  (Medina)
    """
    elements: list[SceneElement] = []
    golden_angle = 2 * math.pi / (PHI ** 2)
    cx, cy = 400.0, 400.0   # canvas centre

    for i, tok in enumerate(tokens):
        spec = _GLYPH_TO_ELEMENT.get(tok.glyph)
        if spec is None:
            # Unknown glyph: render as labelled text node
            spec = {"type": "text", "color": "#808080", "label": tok.english[:12]}

        # Phi-spiral position
        if i == 0:
            x, y = cx, cy
        else:
            r     = (i ** 0.5) * PHI * 22
            angle = i * golden_angle
            x     = cx + r * math.cos(angle)
            y     = cy + r * math.sin(angle)

        elem = SceneElement(
            element_type = spec["type"],
            x            = round(x, 2),
            y            = round(y, 2),
            radius       = spec.get("r", PHI * 30),
            color        = spec["color"],
            label        = spec.get("label", tok.glyph),
            glyph        = tok.glyph,
            phi_factor   = PHI ** (i % 3),
            opacity      = max(0.4, 1.0 - i * 0.07),
        )
        elements.append(elem)

    return elements


# ── Render targets ─────────────────────────────────────────────────────────────

def _render_svg(scene: CPXScene) -> str:
    """Render a CPX scene to SVG."""
    w, h = scene.width, scene.height
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}">',
        f'  <!-- CPX Scene  (Medina)  id={scene.scene_id} -->',
        f'  <!-- source: {scene.cpl_source} -->',
        f'  <rect width="{w}" height="{h}" fill="{scene.background}"/>',
        f'  <g id="cpl-scene">',
    ]

    for el in scene.elements:
        x, y, r = el.x, el.y, el.radius
        c, sc, sw = el.color, el.stroke, el.stroke_width
        op = el.opacity

        if el.element_type == "point":
            lines.append(
                f'    <circle cx="{x}" cy="{y}" r="{min(r, 6)}" '
                f'fill="{c}" opacity="{op:.2f}"/>'
            )
        elif el.element_type in ("circle", "sphere", "torus", "seed", "vesica"):
            lines.append(
                f'    <circle cx="{x}" cy="{y}" r="{r:.1f}" '
                f'fill="none" stroke="{c}" stroke-width="{sw}" opacity="{op:.2f}"/>'
            )
            if el.element_type == "torus":
                # Torus: inner ring at r/φ
                r2 = r / PHI
                lines.append(
                    f'    <circle cx="{x}" cy="{y}" r="{r2:.1f}" '
                    f'fill="none" stroke="{c}" stroke-width="{sw * 0.6:.1f}" '
                    f'opacity="{op * 0.6:.2f}" stroke-dasharray="4 3"/>'
                )
        elif el.element_type == "helix":
            # Helix: two overlapping arcs (double helix suggestion)
            lines.append(
                f'    <ellipse cx="{x}" cy="{y}" rx="{r * 0.4:.1f}" ry="{r:.1f}" '
                f'fill="none" stroke="{c}" stroke-width="{sw}" opacity="{op:.2f}"/>'
            )
            lines.append(
                f'    <ellipse cx="{x}" cy="{y}" rx="{r * 0.4:.1f}" ry="{r:.1f}" '
                f'fill="none" stroke="{el.stroke}" stroke-width="{sw * 0.7:.1f}" '
                f'opacity="{op * 0.5:.2f}" transform="rotate(60 {x} {y})"/>'
            )
        elif el.element_type in ("tetrahedron", "octahedron"):
            # Triangle-based solids
            pts = " ".join(
                f"{x + r * math.cos(a):.1f},{y + r * math.sin(a):.1f}"
                for a in [math.pi / 2, math.pi * 7 / 6, math.pi * 11 / 6]
            )
            lines.append(
                f'    <polygon points="{pts}" fill="none" '
                f'stroke="{c}" stroke-width="{sw}" opacity="{op:.2f}"/>'
            )
        elif el.element_type in ("cube", "hexahedron"):
            x1, y1 = x - r * 0.6, y - r * 0.6
            side = r * 1.2
            lines.append(
                f'    <rect x="{x1:.1f}" y="{y1:.1f}" width="{side:.1f}" '
                f'height="{side:.1f}" fill="none" '
                f'stroke="{c}" stroke-width="{sw}" opacity="{op:.2f}"/>'
            )
        elif el.element_type in ("dodecahedron", "icosahedron", "merkaba", "metatron"):
            # Pentagon-based / complex: render as nested circles suggestion
            for k in range(1, 4):
                rk = r * (k / 3.0)
                rot = k * 12
                lines.append(
                    f'    <circle cx="{x}" cy="{y}" r="{rk:.1f}" fill="none" '
                    f'stroke="{c}" stroke-width="{sw * 0.7:.1f}" '
                    f'opacity="{op * 0.6:.2f}" '
                    f'transform="rotate({rot} {x} {y})"/>'
                )
        elif el.element_type == "arc":
            lines.append(
                f'    <path d="M {x - r:.1f} {y} A {r:.1f} {r:.1f} 0 0 1 {x + r:.1f} {y}" '
                f'fill="none" stroke="{c}" stroke-width="{sw}" opacity="{op:.2f}"/>'
            )
        elif el.element_type == "line":
            lines.append(
                f'    <line x1="{x - r:.1f}" y1="{y}" x2="{x + r:.1f}" y2="{y}" '
                f'stroke="{c}" stroke-width="{sw}" opacity="{op:.2f}"/>'
            )
        elif el.element_type == "text":
            lines.append(
                f'    <text x="{x:.1f}" y="{y:.1f}" fill="{c}" '
                f'font-family="serif" font-size="14" text-anchor="middle" '
                f'opacity="{op:.2f}">{el.label or el.glyph}</text>'
            )

        # Glyph label below each non-text element
        if el.element_type != "text" and el.glyph:
            ly = y + r + 14
            lines.append(
                f'    <text x="{x:.1f}" y="{ly:.1f}" fill="{c}" '
                f'font-family="serif" font-size="11" text-anchor="middle" '
                f'opacity="{min(op, 0.7):.2f}">{el.glyph}</text>'
            )

    lines += [
        f'  </g>',
        f'  <text x="10" y="{h - 10}" fill="#444" font-family="monospace" '
        f'font-size="9">CPX {scene.cpl_version} · (Medina) · beat={scene.beat}</text>',
        '</svg>',
    ]
    return "\n".join(lines)


def _render_html(scene: CPXScene) -> str:
    """Render a CPX scene as a self-contained HTML page."""
    svg_body = _render_svg(scene)
    title = scene.title or f"CPX Scene — {scene.cpl_source[:40]}"
    return textwrap.dedent(f"""\
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>{title}</title>
          <!-- CPX Scene Sovereignty Layer  (Medina) -->
          <style>
            body {{
              margin: 0; background: #050505; display: flex;
              justify-content: center; align-items: center;
              min-height: 100vh; font-family: serif;
            }}
            .cpx-container {{
              position: relative; border: 1px solid #2a2a2a;
              border-radius: 4px; overflow: hidden;
            }}
            .cpx-meta {{
              position: absolute; bottom: 8px; left: 8px;
              color: #444; font-size: 10px; font-family: monospace;
              pointer-events: none;
            }}
          </style>
        </head>
        <body>
          <div class="cpx-container">
            {svg_body}
            <div class="cpx-meta">
              CPX {scene.cpl_version} · (Medina) · id={scene.scene_id[:8]}
            </div>
          </div>
        </body>
        </html>
        """)


def _render_json(scene: CPXScene) -> str:
    """Render a CPX scene as a JSON scene manifest."""
    manifest = {
        "cpx_version":  scene.cpl_version,
        "scene_id":     scene.scene_id,
        "cpl_source":   scene.cpl_source,
        "beat":         scene.beat,
        "canvas":       {"width": scene.width, "height": scene.height,
                         "background": scene.background},
        "element_count": len(scene.elements),
        "elements": [
            {
                "type":       el.element_type,
                "glyph":      el.glyph,
                "label":      el.label,
                "x":          el.x,
                "y":          el.y,
                "radius":     round(el.radius, 3),
                "color":      el.color,
                "opacity":    round(el.opacity, 3),
                "phi_factor": round(el.phi_factor, 6),
            }
            for el in scene.elements
        ],
        "medina": True,
    }
    return json.dumps(manifest, ensure_ascii=False, indent=2)


def _render_ascii(scene: CPXScene) -> str:
    """Render a CPX scene as ASCII art for terminal / debug output."""
    W, H = 60, 24
    grid = [[" "] * W for _ in range(H)]

    for el in scene.elements:
        # Map scene coords (0–800) to grid coords
        gx = int(el.x / scene.width  * (W - 1))
        gy = int(el.y / scene.height * (H - 1))
        gx = max(0, min(W - 1, gx))
        gy = max(0, min(H - 1, gy))

        symbol_map = {
            "point":       "·",
            "circle":      "○",
            "sphere":      "◉",
            "helix":       "∿",
            "torus":       "⊗",
            "tetrahedron": "△",
            "cube":        "□",
            "octahedron":  "◇",
            "dodecahedron":"⬡",
            "icosahedron": "◈",
            "seed":        "✦",
            "vesica":      "⊙",
            "merkaba":     "✶",
            "metatron":    "❋",
            "text":        "T",
            "arc":         "⌒",
            "line":        "─",
            "ring":        "◎",
        }
        sym = symbol_map.get(el.element_type, "?")
        grid[gy][gx] = sym

    rows = ["┌" + "─" * W + "┐"]
    for row in grid:
        rows.append("│" + "".join(row) + "│")
    rows.append("└" + "─" * W + "┘")
    rows.append(f"CPX (Medina)  id={scene.scene_id[:8]}  source: {scene.cpl_source[:40]}")
    rows.append(f"elements={len(scene.elements)}  beat={scene.beat}")
    return "\n".join(rows)


# ── CPXRenderer  (Medina) ──────────────────────────────────────────────────────

class CPXRenderer:
    """
    CPX Enterprise Renderer.  (Medina)

    The official rendering engine for CPX (Cognitive Projection eXpression).
    Converts CPL token sequences into visual scenes across four output formats.

    Architectural law: AL-012 / AL-013 — Scene Sovereignty.

    Every rendered scene is:
      · Laid out on a phi-spiral (golden-angle phyllotaxis)  (Medina)
      · PHX-sealed (every render is a sovereign organism decision)  (Medina)
      · QFB-packaged (the scene can be deployed to any substrate)  (Medina)

    Usage
    ─────
      renderer = CPXRenderer()
      html = renderer.render("Κκλ ⊗ Σφρ → Ελκ", format="html")
      all  = renderer.render_all("Τρσ ∧ Μτρν → Φρ")
      pkg  = renderer.scene_package("Κκλ → Τρσ", sovereign_key=key)
    """

    FORMATS: tuple[str, ...] = ("html", "svg", "json", "ascii")

    def __init__(self, width: int = 800, height: int = 800) -> None:
        self._width  = width
        self._height = height
        self._renders: list[dict] = []

    # ── Core ──────────────────────────────────────────────────────────────────

    def build_scene(self, source: str, beat: int = 0, title: str = "") -> CPXScene:
        """Parse a CPX expression and build a CPXScene."""
        tokens   = _tokens_from_source(source)
        elements = _layout_elements(tokens)
        return CPXScene(
            scene_id   = str(uuid.uuid4()),
            cpl_source = source,
            elements   = elements,
            width      = self._width,
            height     = self._height,
            title      = title or f"CPX · {source[:30]}",
            beat       = beat,
        )

    def render(self, source: str, format: str = "svg", beat: int = 0) -> str:
        """
        Render a CPX expression to the given format.

        format — "html" | "svg" | "json" | "ascii"
        """
        fmt = format.lower().strip()
        if fmt not in self.FORMATS:
            raise ValueError(
                f"Unknown CPX format '{fmt}'. Available: {list(self.FORMATS)}"
            )
        scene = self.build_scene(source, beat=beat)
        result = self._dispatch(scene, fmt)
        self._renders.append({"source": source, "format": fmt, "scene_id": scene.scene_id})
        return result

    def render_all(self, source: str, beat: int = 0) -> dict[str, str]:
        """
        Render a CPX expression to ALL formats simultaneously.

        Returns dict: {format_name: rendered_output}
        """
        scene = self.build_scene(source, beat=beat)
        result = {fmt: self._dispatch(scene, fmt) for fmt in self.FORMATS}
        self._renders.append({"source": source, "format": "all", "scene_id": scene.scene_id})
        return result

    # ── PHX-sealed scene package  (Medina) ────────────────────────────────────

    def scene_package(
        self,
        source:       str,
        sovereign_key: bytes,
        formats:      tuple[str, ...] = ("html", "svg", "json"),
        substrates:   Optional[list[str]] = None,
        beat:         int = 0,
    ) -> dict:
        """
        Full enterprise scene package.  (Medina)

        Renders the CPX expression, PHX-seals it as a sovereign decision,
        and packages it as a QFB block box.

        Returns a dict with:
          · scene_id, qfb_id, phx_seal
          · renders: {format: rendered_output}
          · qfb_summary
          · element_count, token_count
        """
        from blockbox import QFB, PHXChain

        scene   = self.build_scene(source, beat=beat)
        renders = {fmt: self._dispatch(scene, fmt) for fmt in formats}

        # PHX-seal the render as a sovereign decision
        chain     = PHXChain(sovereign_key=sovereign_key)
        phx_token = chain.advance(
            event_bytes=source.encode("utf-8"),
            label=f"cpx_render:{scene.scene_id[:8]}",
        )

        # Package as QFB  (Medina)
        qfb = QFB.from_cpl(
            cpl_tokens = [el.glyph for el in scene.elements if el.glyph],
            key        = sovereign_key,
            substrates = substrates or ["memory"],
            beat       = beat,
        )

        return {
            "scene_id":     scene.scene_id,
            "qfb_id":       qfb.qfb_id,
            "phx_seal":     phx_token.hex(),
            "qfb_summary":  qfb.summary(),
            "cpl_source":   source,
            "token_count":  len(scene.elements),
            "element_count":len(scene.elements),
            "renders":      renders,
            "beat":         beat,
            "medina":       True,
        }

    # ── Dispatch ──────────────────────────────────────────────────────────────

    def _dispatch(self, scene: CPXScene, fmt: str) -> str:
        if fmt == "html":    return _render_html(scene)
        if fmt == "svg":     return _render_svg(scene)
        if fmt == "json":    return _render_json(scene)
        if fmt == "ascii":   return _render_ascii(scene)
        raise ValueError(fmt)

    # ── Introspection ─────────────────────────────────────────────────────────

    @property
    def render_history(self) -> list[dict]:
        """Return all renders performed by this renderer."""
        return list(self._renders)

    def available_formats(self) -> tuple[str, ...]:
        return self.FORMATS
