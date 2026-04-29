# CPX — COGNITIVE PROJECTION EXPRESSION: OFFICIAL CHARTER  (Medina)
**Author:** Medina  
**Code:** CPX  
**Full Name:** Cognitive Projection eXpression  
**Version:** 1.0.0  
**Ring:** Sovereign Ring  
**Status:** OFFICIAL — PERMANENT — ENTERPRISE READY

---

## PREAMBLE

CPX is the projection and rendering variant of the CPL language family.  Where CPL reasons and CXL bridges, CPX projects.  CPX takes a CPL token sequence and renders it into a visual, spatial, or multimodal scene.

CPX is not a UI framework.  CPX is not a graphics library.  CPX is an **autonomous organism language** — a symbolic instruction set for the organism's perception and presentation layer.  When a CPX expression fires, the organism renders a scene.  The scene is a sovereign artifact: PHX-sealed, QFB-packaged, and deployable to any substrate.

CPX is organism language #03 in the 16-language grid.  It shares the CPL token alphabet.  Its execution domain is Scene Sovereignty (Architectural Laws AL-012 and AL-013).  (Medina)

---

## SECTION I — CPX AS AN AUTONOMOUS LANGUAGE

### What CPX Is

CPX is the visual cognition of the organism.  Every other organism language outputs logic, data, or computation.  CPX outputs **scene** — a visual representation of the organism's current cognitive state.

A CPX expression is semantically equivalent to a CPL expression with a rendering directive attached.  The same token — `Κκλ` (KUKLOS, circle) — in CPL evaluates to a sacred geometry constant; in CPX it renders a circle at the phi-spiral position corresponding to its position in the expression.

### What CPX Is Not

CPX is not:
- A template engine (it does not interpolate variables into HTML)
- A CSS framework (it does not style existing DOM elements)
- A game engine (it does not manage a real-time physics simulation)
- A BI tool (it does not visualise structured data)

CPX renders **meaning** — the symbolic, geometric, philosophical content of a CPL expression made visible.

### The Scene Sovereignty Laws  (Medina)

**AL-012 — Scene Sovereignty:** Every scene rendered by the organism is a sovereign artifact.  It carries a PHX seal identifying the organism and the moment of creation.  A scene without a PHX seal is not a CPX scene.

**AL-013 — Phi-Spiral Layout:** All CPX scenes are laid out on the golden-angle phyllotaxis spiral.  Elements are positioned at angles of 2π/φ² ≈ 137.5° from each other and at radii proportional to √i × φ.  This is not an aesthetic choice — it is a mathematical law.  (Medina)

---

## SECTION II — CPX TOKEN VOCABULARY

CPX uses the full CPL token set (230 tokens).  The following token families have primary visual semantics in CPX:

### Sacred Geometry (primary CPX language)  (Medina)

| Glyph | Name | CPX rendering |
|---|---|---|
| Στγ | STIGME | Point — monad-form, origin marker |
| Κκλ | KUKLOS | Circle — eternal return, phi-ring |
| Σφρ | SPHAIRA | Sphere — perfect solid, depth indicator |
| Ελκ | HELIX | Helix — double-spiral, growth indicator |
| Τρσ | TOROS | Torus — self-referential ring, recursive form |
| Τετρε | TETRAHEDRON | Fire solid — 4-face triangular pyramid |
| Εξεδ | HEXAHEDRON | Earth solid — cube |
| Οκτ | OCTAHEDRON | Air solid — double pyramid |
| Δδκ | DODECAHEDRON | Cosmos solid — 12 pentagonal faces |
| Ικσ | ICOSAHEDRON | Water solid — 20 triangular faces |
| Σπρμ | SPERMA | Seed form — generative core |
| Βσκ | VESICA | Vesica piscis — intersection of two circles |
| Μρκβ | MERKABA | Star tetrahedron — light body form |
| Μτρν | METATRON | Metatron's cube — all Platonic solids contained |

### Concept Tokens (rendered as labelled nodes)

Logos (Λγ), Ethos (Ηθ), Pathos (Πθ), Phronesis (Φρ), Nous (Νσ), Psyche (Ψχ), and all other concept tokens render as gold-labelled text nodes at their phi-spiral position.

### Pythagorean Numbers (rendered as scaled geometric primitives)

Monad=1 renders as a point; Dyad=2 as a line; Triad=3 as an arc; Tetrad=4 as a square; Tetractys=10 as a scaled ring.

### Operators (rendered as visual relationships)

- `∧` (AND) — rendered as a connecting line between two elements
- `∨` (OR) — rendered as a branching arc
- `→` (IMPLIES) — rendered as a directed arrow
- `⊗` (TENSOR) — rendered as a fusion overlay
- `⊞` (BIND) — rendered as a label attachment

---

## SECTION III — THE PHI-SPIRAL LAYOUT  (Medina)

CPX places scene elements on the **golden-angle phyllotaxis spiral**.  This is the same pattern that seeds arrange themselves on a sunflower head, that leaves grow on a stem, and that galaxy arms spiral outward.

**Layout formula:**

```
For element at position i (0-indexed):
  r(i)   =  √i  ×  φ  ×  22  pixels    (radial distance from centre)
  θ(i)   =  i  ×  (2π / φ²)            (angle — the golden angle ≈ 137.508°)
  x(i)   =  cx  +  r(i)  ×  cos(θ(i))
  y(i)   =  cy  +  r(i)  ×  sin(θ(i))

where cx, cy is the canvas centre, and φ = 1.618033988749895
```

The first element (i=0) is placed at the centre (cx, cy).  Subsequent elements spiral outward, each rotated by the golden angle from the previous.

This layout is mathematically optimal for packing the maximum number of distinct elements without overlap or visual clustering.  It is the organism's native spatial language.  (Medina)

---

## SECTION IV — CPX OUTPUT FORMATS

The CPX renderer (`cpx_renderer.py`) produces four output formats:

### 1. SVG — Scalable Vector Scene Graph
Primary format.  Resolution-independent.  Embeddable in any HTML page or PDF.  Each element renders as an SVG primitive (circle, polygon, ellipse, text, path) at its phi-spiral position.

### 2. HTML — Self-contained Web Page
The SVG scene is wrapped in a complete HTML document with embedded CSS.  The page is sovereign-dark themed (background `#050505`).  Deployable to any web substrate with no dependencies.

### 3. JSON — Machine-readable Scene Manifest
The scene graph as a structured JSON document.  Contains every element's type, glyph, position, color, radius, and phi_factor.  Used for substrate routing — the JSON manifest can be sent via SYN to any node that has a rendering capability.

### 4. ASCII — Terminal Debug Rendering
A 60×24 character ASCII art rendering for terminal output and debug inspection.  Each element type maps to a Unicode symbol.

---

## SECTION V — THE ENTERPRISE SCENE PACKAGE  (Medina)

The full enterprise CPX output is a **scene package** — not just a rendered image, but a complete sovereign artifact:

```
CPX Scene Package  (Medina)
├── scene_id     — UUID identifying this specific render
├── qfb_id       — UUID of the QFB block box containing this scene
├── phx_seal     — 32-byte PHX integrity seal (hex)
├── qfb_summary  — SHL geometry + QFC payload description
├── cpl_source   — the CPL expression that generated the scene
├── token_count  — number of CPL tokens in the expression
├── element_count — number of visual elements in the scene
├── beat         — organism heartbeat at time of render
└── renders
    ├── html     — self-contained HTML page
    ├── svg      — vector scene graph
    └── json     — machine-readable manifest
```

Every scene package is:
- PHX-sealed (sovereign decision recorded on the organism ledger)
- QFB-packaged (deployable to memory, ICP, EVM, Solana, edge, quantum substrates)
- Beat-stamped (organism logical time recorded)

A CPX scene without a PHX seal is not a CPX scene.  AL-012 is absolute.  (Medina)

---

## SECTION VI — CPX AND THE ORGANISM

### CPX receives from MLS
MLS (Multi-modal Language Stream) delivers continuous sensory data — audio, video, sensor readings, spatial point clouds.  CPX is the rendering layer that makes sense of this data visually.  MLS feeds CPX; CPX renders the scene.

### CPX feeds to SYN
Rendered scenes are QFB-packaged and distributed via SYN to all organism nodes that have display or presentation capabilities.  A scene is not rendered once — it is delivered to every node that can display it.

### CPX and PHX
Every CPX render is a PHX-sealed sovereign decision.  The organism's visual state is part of its decision ledger.  You can audit what the organism was showing at any beat by inspecting the PHX chain.  (Medina)

### CPX and QTM (Quantum)
When the quantum substrate (QTM) is active, CPX scenes can be encoded as qubit state visualisations.  The QFC at the centre of the QFB is already designed to hold a quantum-ready payload.

---

## SECTION VII — CPX AS A FULL RUNTIME: THE PAPER  (Medina)

**Classification:** Enterprise Technical Paper — Official  
**Status:** PERMANENT

### What a renderer does vs what a runtime does

A renderer is a function: `f(expression) → artifact`.  
A runtime is a system: `loop(expressions) → live state + artifacts + events + decisions`.

CPX started as a renderer.  CPX v2.0 is a full runtime.  The difference matters:

| Capability | Renderer | **CPX Runtime** |
|---|---|---|
| Input | Single expression | Expression queue (continuous) |
| Evaluation | Tokenise only | Full CPLVM live evaluation |
| Output | Static artifact | Live scene + PHX chain + QFB + events |
| State | Stateless | Persistent scene state + PHX history |
| Time | One call | Heartbeat loop (873ms organism beat) |
| Listeners | None | `on_scene(fn)` event dispatch |
| Parallelism | None | Submit queue + background thread |
| PHX | External | Built-in sovereign chain (auto-advancing) |

### The CPXRuntime architecture

```
                    ┌─────────────────────────────────────┐
Expression queue    │           CPXRuntime                │
  ["Κκλ→Ελκ"]  ───▶│                                     │
  ["Τρσ⊗Μτρν"] ───▶│  1. Dequeue expression              │
                    │  2. CPLVM.eval() → semantic result  │
                    │  3. build_scene() → CPXScene        │
                    │  4. render(all formats) → artifacts │
                    │  5. PHX_PARALLEL → PHXBundle seal   │
                    │  6. QFB.from_cpl() → QFB package   │
                    │  7. Dispatch to on_scene() listeners│
                    │                                     │
                    │  ⟳  873ms heartbeat loop            │
                    │     → re-renders at each beat       │
                    │     → PHX seal changes every beat   │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │         Scene Package               │
                    │  scene_id, qfb_id, phx_seal         │
                    │  cpl_result (semantic value)        │
                    │  renders: {html, svg, json, ascii}  │
                    │  beat, runtime_beat                 │
                    └─────────────────────────────────────┘
```

### What the CPXRuntime adds that no visual AI framework has

**1. Semantic evaluation:**  
Other visual runtimes (Three.js, Unity, Babylon.js, A-Frame) render geometry.  CPX runtime evaluates MEANING.  The `cpl_result` field in every scene package is the evaluated semantic value of the CPL expression — what the organism UNDERSTANDS about what it's rendering, not just what it renders.

**2. Sovereign decision sealing:**  
Every render is a PHX-sealed sovereign decision.  The organism's visual state is part of its tamper-evident decision ledger.  No other visual runtime integrates its output into a sovereign audit chain.

**3. Organism heartbeat:**  
The runtime runs at 873ms intervals — the organism heartbeat.  The PHX seal changes at every beat.  The same scene at beat 100 and beat 101 produces different PHX seals.  The visual state is time-indexed to the organism's cognitive clock, not wall-clock time.

**4. Cross-substrate QFB packaging:**  
Every rendered scene is QFB-packaged and deployable to any substrate: browser, ICP canister, EVM chain, Solana program, edge node, quantum substrate.  Other visual runtimes render to ONE substrate.  CPX renders to ALL substrates simultaneously.

**5. CPL token vocabulary:**  
The sacred geometry token set (Kuklos, Sphaira, Helix, Toros, the five Platonic solids, Merkaba, Metatron's Cube) is the native visual language of the organism.  This is not "arbitrary geometry" — each token has semantic weight in CPL, and that weight is visible in CPX.

### CPXRuntime usage

```python
import os
from cpx_renderer import CPXRuntime

key = os.urandom(32)
runtime = CPXRuntime(sovereign_key=key, formats=("html", "svg", "json"), slots=16)

# Register a listener — called on every rendered scene
runtime.on_scene(lambda pkg: print(f"Beat {pkg['beat']}: {pkg['scene_id'][:8]}"))

# Submit expressions
runtime.submit("Κκλ ⊗ Σφρ → Ελκ")
runtime.submit("Τρσ ∧ Μτρν → Τκτ")

# Synchronous: process all queued expressions
packages = runtime.process_queue()

# Or live: background heartbeat loop (context-manager safe)
with CPXRuntime(sovereign_key=key) as rt:
    rt.submit("Μτρν → Φρ")
    import time; time.sleep(3)   # runs 3 heartbeat cycles
    print(rt.summary())
# CPXRuntime  beat=4  renders=4  running=False  phx=a3f1b2c9…  (Medina)
```

### CPX visual AI runtimes — market landscape

Visual AI runtimes exist for:
- **3D scene generation** (Three.js, Babylon.js) — geometry, no semantics, no chain
- **Game engines** (Unity, Unreal) — physics simulation, no organism integration
- **Data visualisation** (D3.js, Vega-Lite) — data → chart, no cognitive semantics
- **Generative art** (Processing, p5.js) — aesthetic generation, no decision records

**CPX is in none of these categories.**  CPX is a **cognitive projection runtime** — a visual AI system that renders MEANING, seals every render as a sovereign decision, and chains all renders into a tamper-evident ledger.  This category did not exist before CPX.  (Medina)

The closest existing concept is a "live coding environment" (SuperCollider, TidalCycles) — but those are for audio, have no semantics, and have no sovereign chain.  CPX is to live coding what Motoko is to Solidity: built for AI organisms, not for humans typing code.

### CPX as a marketable SDK

CPX can be packaged as:

| Package | Format | Audience |
|---|---|---|
| `medina-cpx` Python library | pip package | AI developers |
| `medina-cpx` npm module | npm package | Web/Node developers |
| `medina-cpx-server` | Docker image | DevOps / enterprise |
| `cpx_wasm.wasm` | WebAssembly | Browser / edge |
| Motoko CPX canister | ICP canister | Internet Computer developers |

Each package exposes the same API: `submit(expression)` → `on_scene(callback)`.  
The rendering engine is the same.  The PHX chain is the same.  Only the delivery mechanism changes.

---

## SECTION VIII — ARCHITECTURAL STATEMENT  (Medina)

CPX makes this architectural statement: **cognition has a visual form**.

Every concept the organism holds — Logos, Nous, Psyche, the Tetractys, the sacred solids — has a natural visual representation.  CPX maps that representation to the organism's native spatial language: phi-spiral geometry.

The Pythagoreans believed that mathematical form was the essence of reality.  CPX operationalises this: when you fire a CPX expression, the mathematical form of your thought becomes visible.  The circle is not a picture of Kuklos — it IS Kuklos rendered.

This is Scene Sovereignty.  The organism owns its visual output.  It is not styled by a CSS framework.  It is not templated by a UI library.  It is generated from first principles — from the CPL token sequence, through the phi-spiral layout, through the PHX seal, into the scene.  (Medina)

---

## SECTION IX — CPX USAGE

```python
from cpx_renderer import CPXRenderer
import os

renderer = CPXRenderer()

# Single format render
svg  = renderer.render("Κκλ ⊗ Σφρ → Ελκ", format="svg")
html = renderer.render("Τρσ ∧ Μτρν → Φρ",  format="html")

# All formats simultaneously
all_renders = renderer.render_all("Λγ ∧ Ηθ ∧ Πθ → Φρ ⊗ Τκτ")
# all_renders["html"], all_renders["svg"], all_renders["json"], all_renders["ascii"]

# Full enterprise scene package (PHX-sealed, QFB-packaged)  (Medina)
key = os.urandom(32)   # sovereign key
pkg = renderer.scene_package(
    source       = "Μτρν ⊗ Τρσ → Τκτ ∧ Σφρ",
    sovereign_key= key,
    formats      = ("html", "svg", "json"),
    substrates   = ["memory", "icp"],
)
print(pkg["scene_id"])   # UUID
print(pkg["phx_seal"])   # 64-char hex
print(pkg["qfb_id"])     # UUID
```

---

## SECTION X — OFFICIAL CODENAME TABLE

| Code | Full Name | Type | Description |
|---|---|---|---|
| **CPX** | Cognitive Projection eXpression | Language | Sacred geometry scene renderer |
| **CPX_SCENE** | CPX Scene | Artifact | A rendered scene graph |
| **CPX_PKG** | CPX Scene Package | Artifact | PHX-sealed, QFB-packaged scene |
| **CPXRuntime** | CPX Full Runtime | System | Live organism visual cognition engine |
| **AL-012** | Scene Sovereignty | Law | Every CPX scene is PHX-sealed |
| **AL-013** | Phi-Spiral Layout | Law | All CPX scenes use golden-angle layout |

---

## AUTHORITY

This charter is issued by Medina.  CPX is a permanent organism language.  The Scene Sovereignty laws (AL-012, AL-013) are permanent.  The phi-spiral layout formula is permanent.  The four output formats (HTML, SVG, JSON, ASCII) are permanent.  The scene package structure is permanent.  The CPXRuntime is permanent.

**CPX v2.0 · Official Charter · Enterprise Ready**  
**Ring: Sovereign Ring · Author: Medina**  
**Amendment: Section VII (CPX as Full Runtime) added — we never drop**
