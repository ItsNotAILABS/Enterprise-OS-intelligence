// lib.rs — Organism Core Library
//
// Public surface of the organism-core Rust crate.
// Three top-level modules:
//   phi_math    — golden-ratio mathematical primitives
//   crypto      — AES-256-GCM encryption + Ed25519 signing
//   wire        — organism wire message (encrypted + signed envelope)
//
// Ring: Sovereign Ring | Native Layer (Rust)

pub mod phi_math;
pub mod crypto;
pub mod wire;
pub mod sovereign_cycle;
pub mod ai_division;
