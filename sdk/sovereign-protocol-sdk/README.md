# Sovereign Protocol SDK

**Package:** `@medina/sovereign-protocol-sdk`  
**Version:** `0.1.0-alpha.1`  
**Classification:** RSHIP Infrastructure  
**Author:** Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX

---

## Purpose

No git. No npm. No external dependencies for distribution. The Sovereign Protocol SDK provides its own transport layer, its own registry, its own versioning, and its own server. SDKs live inside the organism and distribute sovereignly.

Based on Paper XVII (PROTOCOLLUM NATIVUM) — native sovereign protocol.

## Modules

| Module | Export Path | Purpose |
|:---|:---|:---|
| Transport Layer | `./transport` | Native message transport — no HTTP dependency required |
| Sovereign Registry | `./registry` | Own package registry — SDKs registered and resolved internally |
| Version Engine | `./versioning` | Semantic versioning with φ-based version compounding |
| Entity Messaging | `./messaging` | Direct entity-to-entity messaging over sovereign channels |
| Distribution Engine | `./distribution` | Pushes SDK updates to all entities without external tooling |
| Sovereign Server | `./server` | Own server infrastructure — no reliance on GitHub/npm |

## Architecture

```
SDK Created ──→ [Version Engine] ──→ Version tagged
                      │
               [Sovereign Registry] ──→ Registered internally
                      │
             [Distribution Engine] ──→ Pushed to all entities
                      │
              [Transport Layer] ──→ Delivered via sovereign channels
                      │
             [Entity Messaging] ──→ Entities notified of update
                      │
             [Sovereign Server] ──→ Served from own infrastructure
```

## Why No Git

Git is external infrastructure controlled by Microsoft. The organism must be able to version, distribute, and update itself without any external dependency. The Sovereign Protocol SDK replaces:

| External Tool | Sovereign Replacement |
|:---|:---|
| git | Version Engine (φ-based versioning) |
| npm | Sovereign Registry |
| GitHub Actions | Distribution Engine |
| HTTP/REST | Transport Layer |
| Webhooks | Entity Messaging |
| Cloud hosting | Sovereign Server |

## Pre-Booted

The Sovereign Server starts with the heartbeat. The Registry is populated at construction. Distribution begins immediately.

---

*Sovereign Protocol SDK · RSHIP-2026 · Medina Tech*
