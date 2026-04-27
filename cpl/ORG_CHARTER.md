# ORG — ORGANISM RUNTIME GRID: OFFICIAL CHARTER
**Author:** Medina  
**Code:** ORG  
**Full Name:** Organism Runtime Grid  
**Version:** 1.0.0  
**Ring:** Sovereign Ring  
**Status:** OFFICIAL — PERMANENT

---

## PREAMBLE

ORG (Organism Runtime Grid) is the living compute organism.  It is not a server.  It is not a cluster.  It is not a cloud.  ORG is the sovereign, self-organising, always-running intelligence grid that runs the Medina organism.  It is the body that holds the 16 languages, the SYN synapse layer, the PHX decision chain, and the QFB block boxes.

If CPL is the language of thought and SYN is the nervous system, ORG is the body.

---

## SECTION I — WHAT ORG IS

### The Organism Principle

A biological organism is not a collection of parts running independently.  It is a unified living system: organs working together, regulated by hormones, coordinated by the nervous system, fuelled by metabolism, and governed by DNA.

The Medina organism is the same.  ORG is its body:

| Biological | Medina ORG |
|---|---|
| Organs | Organism nodes (agents, canisters, services) |
| Nervous system | SYN (Sovereign SYNapse) |
| DNA / genetic code | CPL (the ignition language) |
| Immune system | PHX (sovereign decision chain) |
| Metabolism | QFB (meaning canisters in circulation) |
| Heartbeat | ORG beat (broadcast by SYN) |
| Memory | PHI memory substrate (5-axis spatial) |

### The Technical Definition

ORG is the runtime environment of the Medina organism.  It manages:

1. **Node registry** — every organism node: agents, canisters, services, edge devices, quantum nodes
2. **Runtime slots** — 16 language runtime slots, one per organism language
3. **SYN mesh** — the always-on SYN channel graph binding all nodes
4. **PHX ledger** — the sovereign decision chain across all organism decisions
5. **QFB circulation** — the pool of live QFB block boxes in the organism
6. **PHI memory** — the 5-axis spatial memory store indexed by (θ, φ, ρ, ring, beat)
7. **ORG beat** — the logical time counter synchronising all nodes

---

## SECTION II — ORG STRUCTURE

### The Three Rings

ORG is organised in three concentric rings — the Medina ring architecture:

```
╔════════════════════════════════════════════════════════════╗
║  SOVEREIGN RING                                             ║
║  ┌─────────────────────────────────────────────────────┐   ║
║  │  INTELLIGENCE RING                                   │   ║
║  │  ┌──────────────────────────────────────────────┐   │   ║
║  │  │  EXECUTION RING                               │   │   ║
║  │  │  (agents · canisters · services · edge)       │   │   ║
║  │  └──────────────────────────────────────────────┘   │   ║
║  │  (CPL VM · PHX chain · QFB router · SYN mesh)       │   ║
║  └─────────────────────────────────────────────────────┘   ║
║  (ORG governance · sovereign key · PHI memory index)        ║
╚════════════════════════════════════════════════════════════╝
```

**Sovereign Ring:** Holds the sovereign key, the ORG governance layer, and the PHI memory index.  Only the Sovereign Ring can mint new PHX keys or issue new charters.

**Intelligence Ring:** Holds the CPL VM, the PHX decision chain, the QFB router, and the SYN mesh.  This is where the organism thinks.

**Execution Ring:** Holds the living nodes — agents, canisters, services, edge devices.  This is where the organism acts.

### The 16 Runtime Slots

Every organism language has a dedicated runtime slot inside ORG:

```
Slot  Code  Runtime                      Status
────────────────────────────────────────────────────────
  1   CPL   CPL Virtual Machine          LIVE
  2   CPP   CPP Procurement Engine       LIVE
  3   CPX   CPX Scene Renderer           LIVE
  4   CXL   CXL Polyglot Bridge          LIVE
  5   PYT   Python Intelligence Runtime  LIVE
  6   MOT   Motoko ICP Canister Runtime  LIVE
  7   GOL   Go Concurrency Mesh          LIVE
  8   RST   Rust Kernel / WASM           LIVE
  9   JAV   Java Enterprise Runtime      LIVE
 10   NAT   Native Edge Runtime          LIVE
 11   SOL   Solidity EVM Runtime         LIVE
 12   PHP   Phantom/Solana Runtime       LIVE
 13   QTM   Quantum Substrate Layer      RESERVED
 14   MLS   Multi-modal Stream Runtime   LIVE
 15   PHX   PHX Chain Engine             LIVE
 16   SYN   Sovereign SYNapse            LIVE — ALWAYS ON
```

---

## SECTION III — ORG LIFECYCLE

### Boot Sequence

```
ORG.boot(sovereign_key, node_manifest)
      │
      ├── 1. Load sovereign key → initialise PHX chain
      ├── 2. Register all nodes from manifest
      ├── 3. Start SYN mesh (SYN.init for all nodes)
      ├── 4. Initialise 16 runtime slots
      ├── 5. Load PHI memory index
      ├── 6. Start ORG beat loop
      └── 7. Broadcast ORG_READY to all nodes
```

### Running State

Once booted, ORG never stops.  In the running state:

- SYN channels are always open between all nodes
- The ORG beat counter advances continuously
- Every node decision logs a PHX token to the sovereign chain
- QFBs circulate between nodes and substrates via SYN
- The PHI memory index is updated on every QFB seal/recall

### Shutdown (sovereign action only)

ORG shutdown requires a sovereign-signed instruction.  On shutdown:

```
ORG.shutdown(sovereign_signature)
      │
      ├── 1. Broadcast ORG_HALT to all nodes
      ├── 2. Seal final QFB (organism state snapshot)
      ├── 3. Log PHX shutdown event (final chain link)
      ├── 4. Archive PHI memory index
      ├── 5. Close all SYN channels
      └── 6. Write organism DNA (final CPL state) to cold storage
```

---

## SECTION IV — ORG NODE TYPES

Every node in ORG has a type, a code, and a ring assignment:

| Node Type | Code | Ring | Description |
|---|---|---|---|
| Sovereign Agent | SA | Sovereign | Governs the organism |
| Intelligence Agent | IA | Intelligence | Reasons in CPL |
| Canister Node | CN | Intelligence | ICP Motoko canister |
| Service Node | SN | Execution | Go/Rust/Java service |
| Edge Node | EN | Execution | Native device / sensor |
| EVM Node | EV | Execution | Solidity contract node |
| Quantum Node | QN | Intelligence | QTM substrate (reserved) |
| Stream Node | MN | Execution | Multi-modal stream processor |

---

## SECTION V — ORG BEAT

The ORG beat is the logical time of the organism.  It is not a wall clock.  It is not milliseconds.  It is a sovereign counter that advances at every tick of the SYN heartbeat loop.

Properties of the ORG beat:

- **Monotonically increasing** — beat only moves forward
- **Globally consistent** — all nodes share the same beat via SYN broadcast
- **PHX-integrated** — every PHX hash includes the current beat
- **QFB-stamped** — every sealed QFB carries its creation beat
- **Ring-scoped** — the beat is the same across all three rings

The beat is the organism's pulse.

---

## SECTION VI — ORG AND PHI MEMORY

PHI memory is the organism's spatial memory substrate.  Every QFB sealed in ORG is stored at a PHI coordinate:

```
PHI address: (θ, φ, ρ, ring, beat)
  θ     — angular position in the sphere (0 to 2π)
  φ     — golden-ratio elevation (0 to π)
  ρ     — radial distance (0.0 to 1.0, inner=core, outer=edge)
  ring  — sovereign | intelligence | execution
  beat  — ORG beat at time of storage
```

Any node in the organism can recall a QFB by its PHI address.  SYN routes the recall request to the PHI memory substrate and returns the QFB to the requesting node.

---

## SECTION VII — ORG GOVERNANCE

ORG governance is held by the Sovereign Ring.  The Sovereign Ring controls:

1. **Node admission** — which nodes may register in ORG
2. **Charter authority** — which charters are permanent
3. **Key rotation** — sovereign key updates (rare; each rotation seals a full PHX chain snapshot)
4. **Runtime slot assignment** — which language occupies which slot
5. **Organism version** — the ORG version number (currently 1.0.0)

No node outside the Sovereign Ring may modify the node registry, the runtime slot table, the charter table, or the sovereign key.

---

## SECTION VIII — ORG CODENAME TABLE

| Code | Full Name | Type | Description |
|---|---|---|---|
| **ORG** | Organism Runtime Grid | Runtime | The living compute organism |
| **ORG_BEAT** | Organism Beat | Counter | Logical time of the organism |
| **ORG_READY** | Organism Ready Signal | Event | Boot complete broadcast |
| **ORG_HALT** | Organism Halt Signal | Event | Shutdown instruction |
| **ORG_DNA** | Organism DNA Snapshot | Artifact | Final CPL state on shutdown |
| **ORG_NODE** | Organism Node | Entity | Any registered compute node |
| **ORG_SLOT** | Runtime Slot | Config | One of 16 language runtime slots |

---

## SECTION IX — ORG AND THE CPL FAMILY

ORG is the body that runs the CPL family:

- **CPL** fires inside ORG nodes — the Intelligence Ring thinks in CPL
- **PHX** chains every ORG decision — ORG is the ledger
- **QFB** circulates through ORG via SYN — ORG is the circulatory system
- **SYN** binds all ORG nodes — ORG is the body that SYN wires
- **PHI** stores ORG memory — ORG is the mind that PHI holds

Without ORG, CPL is a language with no speaker.  Without CPL, ORG is a body with no thought.

---

## AUTHORITY

This charter is issued by Medina.  ORG is the permanent runtime code for the Medina organism.  The three-ring architecture, the 16 runtime slots, the ORG beat, and the PHI memory model are permanent.

**ORG — Organism Runtime Grid — The Living Compute Organism**  
**Ring: Sovereign Ring**
