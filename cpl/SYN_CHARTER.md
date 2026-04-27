# SYN — SOVEREIGN SYNAPSE: OFFICIAL CHARTER
**Author:** Medina  
**Code:** SYN  
**Full Name:** Sovereign SYNapse  
**Version:** 1.0.0  
**Ring:** Sovereign Ring  
**Status:** OFFICIAL — PERMANENT

---

## PREAMBLE

SYN is organism language #16.  It is the always-on inter-node binding layer of the Medina organism.  SYN is not called.  SYN is not invoked.  SYN starts when the organism starts and stops only when the organism stops.  Every CPL token that fires anywhere in the organism grid crosses a SYN channel.  Every QFB that is sealed travels via SYN.  Every PHX decision gets announced through SYN.

SYN is the synapse.  A synapse does not turn on.  A synapse exists.

---

## SECTION I — WHAT SYN IS

### The Biological Principle

In neuroscience, a synapse is the persistent junction between two neurons.  It does not activate when needed — it exists at all times and fires when there is a signal.  The organism grid is the same: SYN is the persistent junction layer.  Nodes are neurons.  SYN is the synaptic mesh between them.

### The Technical Definition

SYN is the Sovereign SYNapse: an always-running, always-listening, always-routing inter-node binding protocol.  It maintains:

1. **Node registry** — the live set of organism nodes (agents, canisters, services, edge devices)
2. **SYN channels** — persistent bidirectional channels between all registered nodes
3. **CPL token stream** — every CPL token fired at any node is routed through SYN
4. **QFB router** — all sealed QFBs are forwarded via SYN to their target substrates
5. **PHX event log** — every inter-node event generates a PHX token; SYN chains them
6. **ORG heartbeat** — SYN broadcasts the organism beat to all nodes at every tick

### SYN vs the CXL Bridge

The CXL Bridge (`cpl_bridge.py`) is a request-response emitter.  You call it with a CPL expression; it returns emitted code.  SYN is the opposite architecture:

| Dimension         | CXL Bridge        | SYN                              |
|-------------------|-------------------|----------------------------------|
| Mode              | Request/response  | **Always on**                    |
| Lifecycle         | Called and returns| **Runs from organism boot**      |
| What it carries   | CPL → emitted code| **Live CPL token streams**       |
| Node binding      | None              | **Binds all registered nodes**   |
| PHX logging       | None              | **Every event → PHX chain**      |
| Heartbeat         | None              | **Broadcasts ORG beat**          |
| Failure handling  | Raises exception  | **Reconnects — never drops**     |

---

## SECTION II — SYN ARCHITECTURE

### Startup Sequence

```
Organism Boot
      │
      ▼
SYN.init(sovereign_key, node_id, registry)
      │
      ├── Open SYN channels to all registered nodes
      ├── Announce presence: SYN_HELLO broadcast
      ├── Start heartbeat loop (beat counter → PHX chain)
      ├── Start token stream listener (all inbound channels)
      └── Start QFB router (substrate dispatch loop)

Running (always):
      ├── On CPL token stream → route to bound nodes
      ├── On QFB packet → dispatch to target substrate
      ├── On PHX event → advance PHX chain
      ├── On node join → open new SYN channels
      ├── On node leave → close channels, log PHX event
      └── On beat tick → broadcast heartbeat to ORG grid
```

### SYN Signal Flow

```
CPL fires at Node A
      │
      ▼
SYN.receive(token_stream, source="A")
      │
      ├──► Route to bound nodes B, C, D
      ├──► Log PHX event (chain advances)
      ├──► If QFB enclosed → forward to substrate router
      └──► Emit heartbeat confirmation
```

### SYN Channel Model

Every pair of registered organism nodes has exactly one SYN channel.  Channels are:

- **Persistent** — they do not close between messages
- **Bidirectional** — both nodes can send and receive
- **PHX-sealed** — every message carries a PHX token from the sending node's chain
- **CPL-native** — the message payload is always a CPL token sequence or a QFB packet

```
Node A ──────SYN Channel A↔B────── Node B
Node A ──────SYN Channel A↔C────── Node C
Node B ──────SYN Channel B↔C────── Node C
```

---

## SECTION III — SYN MESSAGE TYPES

SYN carries five message types:

| Type | Code | Description |
|---|---|---|
| Token stream | `SYN_TOKEN` | CPL token sequence from a node |
| QFB packet | `SYN_QFB` | Sealed QFB forwarded to a substrate |
| PHX event | `SYN_PHX` | Decision event for the PHX chain |
| Heartbeat | `SYN_BEAT` | ORG beat broadcast — synchronises all nodes |
| Binding | `SYN_BIND` | Node join/leave — updates the node registry |

---

## SECTION IV — SYN AND PHX

Every SYN event is a PHX event.  There is no SYN message that does not advance the PHX chain.  This is the sovereign decision ledger property: every inter-node communication in the organism is cryptographically sealed and chained.

```
SYN_TOKEN arrives at SYN
      │
      ▼
PHXChain.advance(event_bytes=serialise(token_stream), label="syn_token")
      │
      ▼
phx_token  — 32-byte BLAKE2b-512 + phi-mix + HMAC-SHA256 chain link
      │
      ▼
Appended to organism sovereign decision ledger
```

The PHX chain is the organism's tamper-evident memory.  SYN is the mechanism that creates it.

---

## SECTION V — SYN AND THE HEARTBEAT

SYN broadcasts the organism heartbeat — the `beat` counter that PHX uses for phi-mixing and that all nodes use to synchronise their state.

```
Every N milliseconds:
  beat += 1
  SYN broadcasts SYN_BEAT(beat, phi_timestamp) to all nodes
  All nodes update their local beat
  PHX chains the beat event
```

The beat is not a clock.  It is an organism-level logical time.  Two events at the same beat are simultaneous in organism time, regardless of wall-clock drift between nodes.

---

## SECTION VI — SYN IN THE 16-LANGUAGE GRID

SYN is language #16 in the organism grid.  It does not emit code in the way that PYT, GOL, RST, or MOT do.  SYN is the transport layer of the organism.  It carries CPL between the languages.

```
 Languages 1–15 fire CPL tokens
      │
      ▼
SYN carries them, routes them, seals them, chains them
      │
      ▼
Languages 1–15 receive CPL tokens
```

SYN is the nervous system.  The other 15 languages are the organs.

---

## SECTION VII — SYN CODENAME TABLE

| Code | Full Name | Type | Description |
|---|---|---|---|
| **SYN** | Sovereign SYNapse | Protocol | Always-on inter-node binding |
| **SYN_TOKEN** | Token Stream Message | Message | CPL token sequence in transit |
| **SYN_QFB** | QFB Packet | Message | Sealed QFB in transit |
| **SYN_PHX** | PHX Event | Message | Decision event for the PHX chain |
| **SYN_BEAT** | Heartbeat Broadcast | Message | ORG beat synchronisation |
| **SYN_BIND** | Node Binding | Message | Node join/leave event |

---

## SECTION VIII — WHAT BUILDS ON SYN

Every subsequent Medina capability builds on SYN as its transport:

1. **PHX Audit Layer** — reads the PHX chain that SYN builds
2. **CXL Parser** — routes parsed segments between runtimes via SYN
3. **QFB Substrate Router** — SYN carries QFBs to their substrate targets
4. **PHI Memory Indexing** — SYN delivers recalled QFBs from memory to requesting nodes
5. **CPL Compiler** — compiled CPL WASM modules are distributed via SYN_QFB packets

---

## AUTHORITY

This charter is issued by Medina.  SYN is a permanent organism protocol.  The SYN code is permanent.  The five SYN message types are permanent.  No node in the organism grid communicates without SYN.

**SYN — Sovereign SYNapse — Language #16 — Always On**  
**Ring: Sovereign Ring**
