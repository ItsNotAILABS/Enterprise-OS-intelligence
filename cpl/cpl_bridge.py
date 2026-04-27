"""
cpl_bridge.py — CPL Cross-Language Bridge (CXL Emitter)  (Medina)

Author : Medina
Version: 2.0.0
Ring   : Sovereign Ring

─────────────────────────────────────────────────────────────────────────────
PURPOSE
─────────────────────────────────────────────────────────────────────────────

CXL (Cognitive eXchange Language) is the fusion of all organism languages.  (Medina)
The bridge takes a CPL expression (or list of CPL tokens) and emits equivalent
code in any registered target language.

Supported targets
─────────────────
  python      — Python intelligence layer              (PYT)
  motoko      — Motoko AI-survival canister            (MOT)  (Medina)
  go          — Go service mesh call                   (GOL)
  rust        — Rust kernel expression                 (RST)
  java        — Java enterprise SDK call               (JAV)
  solidity    — Solidity / EVM smart contract          (SOL)
  move        — Move / Aptos smart contract            (MVO)
  ink         — Ink! / Polkadot WASM contract          (INK)
  cosmwasm    — CosmWasm / Cosmos smart contract       (CMW)
  cairo       — Cairo / StarkNet contract              (CAI)
  typescript  — TypeScript / Node intelligence layer   (TSN)
  swift       — Swift native / Apple substrate         (SWF)
  phx_chain   — PHX sovereign decision chain           (PHX)  (Medina)
  qfb         — QFB Quantum Fusion Block canister      (QFB)  (Medina)

Usage
─────
  bridge = CPLBridge()
  py_code  = bridge.emit("Λγ ∧ Ηθ → Τκτ", "python")
  mo_code  = bridge.emit("Λγ ∧ Ηθ → Τκτ", "motoko")
  mv_code  = bridge.emit("Λγ ∧ Ηθ → Τκτ", "move")
  phx_code = bridge.emit("Λγ ∧ Ηθ → Τκτ", "phx_chain")
  qfb_code = bridge.emit("Λγ ∧ Ηθ → Τκτ", "qfb")

Full polyglot sync (emit to all targets at once)
─────────────────────────────────────────────────
  result = bridge.polyglot("Λγ ∧ Ηθ → Τκτ")
"""

from __future__ import annotations

import textwrap
from typing import Optional

from cpl_lexer  import tokenise, parse, format_ast, SequenceNode
from cpl_tokens import ALL_TOKENS, BY_GLYPH, lookup_glyph, CPLToken


# ── Emitter base ───────────────────────────────────────────────────────────────

class _Emitter:
    """Abstract emitter base."""

    LANGUAGE: str = ""

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        raise NotImplementedError


# ── Python Emitter ─────────────────────────────────────────────────────────────

class PythonEmitter(_Emitter):
    """Emit CPL as Python intelligence code."""

    LANGUAGE = "python"

    _OP_MAP: dict[str, str] = {
        "AND":    " and ",
        "OR":     " or ",
        "NOT":    "not ",
        "IMPLIES":"__implies__",
        "IFF":    "__iff__",
        "XOR":    "__xor__",
        "TRUE":   "True",
        "FALSE":  "False",
        "FORALL": "__forall__",
        "EXISTS": "__exists__",
        "TENSOR": "__tensor__",
        "BIND":   "__bind__",
        "SEAL":   "__seal__",
        "OPEN":   "__open__",
        "SIGN":   "__sign__",
        "WITNESS":"__witness__",
    }

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_comments = ", ".join(
            f'"{t.glyph}"={t.english.split("/")[0].strip()}' for t in tokens
        )
        glyphs = " ".join(t.glyph for t in tokens)
        py_parts: list[str] = []
        for tok in tokens:
            mapped = self._OP_MAP.get(tok.name)
            if mapped:
                py_parts.append(mapped)
            else:
                # Atoms become string constants (concept handles)
                py_parts.append(f'CPL["{tok.glyph}"]')

        py_expr = "".join(py_parts).strip()

        return textwrap.dedent(f"""\
            # CPL → Python  (PYT bridge)
            # source: {raw_source}
            # tokens: {token_comments}
            #
            from cpl_vm import CPLVM
            from cpl_tokens import lookup_glyph

            _vm = CPLVM()
            _result = _vm.eval_source({repr(raw_source)})
            # _result is a VMValue — inspect with isinstance(_result, TruthValue)
            """)


# ── Motoko Emitter ─────────────────────────────────────────────────────────────

class MotokoEmitter(_Emitter):
    """
    Emit CPL as a Motoko AI-survival canister.  (Medina)

    Architectural statement: A Motoko canister on ICP has orthogonal
    persistence — its state survives upgrades automatically without any
    explicit migration code.  In the Medina organism this is the AI-survival
    property: the canister IS the AI model.  Its CPL bindings, PHX chain
    position, and intelligence state persist across every upgrade as if the
    upgrade never happened.  The AI does not restart.  It continues.

    This is CPO (Cognitive Procurement Oracle) territory: an intelligence
    contract that binds a Motoko canister to a specific CPL reasoning role
    and guarantees that reasoning state survives indefinitely.
    """

    LANGUAGE = "motoko"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_list  = ", ".join(f'"{t.glyph}"' for t in tokens)
        domain_set  = ", ".join({f'"{t.domain}"' for t in tokens})
        token_count = len(tokens)
        return textwrap.dedent(f"""\
            // CPL → Motoko AI-survival canister  (MOT bridge)  (Medina)
            // source: {raw_source}
            // Architectural property: orthogonal persistence — state survives upgrades.
            // This canister IS the AI model.  It does not restart on upgrade; it continues.

            import CPLOracle "mo:cpl/CPLOracle";
            import PHXChain  "mo:cpl/PHXChain";
            import QFBStore  "mo:cpl/QFBStore";

            // ── Stable variables survive every canister upgrade automatically ────────
            // No migration code required.  This is the AI-survival guarantee.
            stable var cpl_state   : [Text] = [{token_list}];
            stable var phx_beat    : Nat    = 0;
            stable var phx_latest  : Blob   = Blob.fromArray([]);
            stable var intelligence_bindings : [(Text, Text)] = [];

            // ── CPL expression evaluation ────────────────────────────────────────────
            let tokens  : [Text] = [{token_list}];
            let domains : [Text] = [{domain_set}];

            // Query call — read-only, free, always available
            public query func evalCPL() : async CPLOracle.VMValue {{
                CPLOracle.eval(tokens)
            }};

            // Update call — mutates state, advances PHX chain
            public shared func executeCPL() : async CPLOracle.VMValue {{
                let result = await CPLOracle.eval(tokens);
                phx_beat  += 1;
                // PHX chain advances on every AI decision — sovereign ledger  (Medina)
                phx_latest := await PHXChain.advance(
                    Text.encodeUtf8("{raw_source}"),
                    phx_beat
                );
                result
            }};

            // Intelligence contract binding — CPP domain  (Medina)
            public shared func bindIntelligenceContract(role: Text, capability: Text) : async () {{
                intelligence_bindings := Array.append(
                    intelligence_bindings,
                    [(role, capability)]
                );
            }};

            // Synopsis — full organism query call  (Medina)
            public query func synopsis() : async CPLOracle.Synopsis {{
                CPLOracle.synopsis({{
                    cpl_source  = "{raw_source}";
                    token_count = {token_count};
                    domains     = domains;
                    beat        = phx_beat;
                }})
            }};
            """)


# ── Go Emitter ─────────────────────────────────────────────────────────────────

class GoEmitter(_Emitter):
    """Emit CPL as a Go service call."""

    LANGUAGE = "go"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_list = ", ".join(f'"{t.glyph}"' for t in tokens)
        return textwrap.dedent(f"""\
            // CPL → Go  (GOL bridge)
            // source: {raw_source}
            package cplbridge

            import (
            \t"context"
            \t"github.com/medina/organism/cpl"
            )

            func EvalExpression(ctx context.Context) (cpl.VMValue, error) {{
            \ttokens := []string{{{token_list}}}
            \tvm     := cpl.NewVM()
            \treturn vm.EvalTokens(ctx, tokens)
            }}
            """)


# ── Rust Emitter ───────────────────────────────────────────────────────────────

class RustEmitter(_Emitter):
    """Emit CPL as Rust kernel code."""

    LANGUAGE = "rust"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_vec = ", ".join(f'"{t.glyph}"' for t in tokens)
        return textwrap.dedent(f"""\
            // CPL → Rust  (RST bridge)
            // source: {raw_source}
            use medina_cpl::{{VM, Token}};

            fn eval_expression() -> medina_cpl::Result<VM::Value> {{
                let tokens: Vec<&str> = vec![{token_vec}];
                let mut vm = VM::new();
                vm.eval_tokens(&tokens)
            }}
            """)


# ── Move / Aptos Emitter ───────────────────────────────────────────────────────

class MoveEmitter(_Emitter):
    """Emit CPL as a Move / Aptos smart contract module (MVO)."""

    LANGUAGE = "move"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_count = len(tokens)
        push_tokens = "\n".join(
            f"        vector::push_back(&mut tokens, b\"{t.glyph}\");"
            for t in tokens
        )
        return textwrap.dedent(f"""\
            // CPL → Move / Aptos  (MVO bridge)
            // source: {raw_source}
            module medina::cpl_expression {{

                use std::vector;
                use std::string::{{Self, String}};
                use aptos_framework::event;

                // CPL expression sealed as a Move resource  (Medina)
                struct CPLExpression has key, store, drop {{
                    tokens:    vector<vector<u8>>,
                    phx_seal:  vector<u8>,
                    token_count: u64,
                }}

                // PHX integrity event  (Medina)
                #[event]
                struct PHXSealEvent has drop, store {{
                    phx_seal: vector<u8>,
                    beat:     u64,
                }}

                public fun build_expression(): CPLExpression {{
                    let tokens = vector::empty<vector<u8>>();
            {push_tokens}
                    CPLExpression {{
                        tokens,
                        phx_seal:    vector::empty(),
                        token_count: {token_count},
                    }}
                }}

                public fun token_count(expr: &CPLExpression): u64 {{
                    expr.token_count
                }}

                public fun seal(expr: &mut CPLExpression, phx: vector<u8>, beat: u64) {{
                    expr.phx_seal = phx;
                    event::emit(PHXSealEvent {{ phx_seal: phx, beat }});
                }}
            }}
            """)


# ── Ink! / Polkadot Emitter ───────────────────────────────────────────────────

class InkEmitter(_Emitter):
    """Emit CPL as an Ink! / Polkadot WASM smart contract (INK)."""

    LANGUAGE = "ink"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_vec = ", ".join(f'b"{t.glyph}"' for t in tokens)
        token_count = len(tokens)
        return textwrap.dedent(f"""\
            // CPL → Ink! / Polkadot  (INK bridge)
            // source: {raw_source}
            #![cfg_attr(not(feature = "std"), no_std, no_main)]

            // Sovereign CPL expression sealed as an Ink! contract  (Medina)
            #[ink::contract]
            mod cpl_expression {{
                use ink::prelude::vec::Vec;
                use ink::prelude::vec;

                #[ink(storage)]
                pub struct CPLExpression {{
                    /// CPL token glyphs (UTF-8 encoded)
                    tokens:     Vec<Vec<u8>>,
                    /// PHX integrity seal (Medina sovereign hash)
                    phx_seal:   Vec<u8>,
                    /// Organism heartbeat at creation
                    beat:       u64,
                }}

                impl CPLExpression {{
                    #[ink(constructor)]
                    pub fn new(phx_seal: Vec<u8>, beat: u64) -> Self {{
                        let tokens: Vec<Vec<u8>> = vec![{token_vec}]
                            .into_iter()
                            .map(|s: &[u8]| s.to_vec())
                            .collect();
                        Self {{ tokens, phx_seal, beat }}
                    }}

                    #[ink(message)]
                    pub fn token_count(&self) -> u32 {{
                        {token_count}
                    }}

                    #[ink(message)]
                    pub fn verify_phx(&self, seal: Vec<u8>) -> bool {{
                        self.phx_seal == seal
                    }}

                    #[ink(message)]
                    pub fn beat(&self) -> u64 {{
                        self.beat
                    }}
                }}
            }}
            """)


# ── CosmWasm / Cosmos Emitter ─────────────────────────────────────────────────

class CosmWasmEmitter(_Emitter):
    """Emit CPL as a CosmWasm / Cosmos smart contract (CMW)."""

    LANGUAGE = "cosmwasm"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_vec = ", ".join(f'"{t.glyph}".to_string()' for t in tokens)
        token_count = len(tokens)
        return textwrap.dedent(f"""\
            // CPL → CosmWasm / Cosmos  (CMW bridge)
            // source: {raw_source}
            use cosmwasm_std::{{
                entry_point, to_json_binary, Binary, Deps, DepsMut,
                Env, MessageInfo, Response, StdResult,
            }};
            use serde::{{Deserialize, Serialize}};
            use cw_storage_plus::Item;

            // ── State ──────────────────────────────────────────────────────────────
            #[derive(Serialize, Deserialize, Clone, Debug)]
            pub struct CPLState {{
                pub tokens:    Vec<String>,
                pub phx_seal:  String,   // hex PHX token  (Medina)
                pub beat:      u64,
            }}

            const STATE: Item<CPLState> = Item::new("cpl_state");

            // ── Messages ───────────────────────────────────────────────────────────
            #[derive(Serialize, Deserialize)]
            pub struct InstantiateMsg {{ pub phx_seal: String, pub beat: u64 }}

            #[derive(Serialize, Deserialize)]
            #[serde(rename_all = "snake_case")]
            pub enum QueryMsg {{ TokenCount {{}}, PhxSeal {{}}, Eval {{}} }}

            // ── Entry points ───────────────────────────────────────────────────────
            #[entry_point]
            pub fn instantiate(
                deps: DepsMut, _env: Env, _info: MessageInfo, msg: InstantiateMsg,
            ) -> StdResult<Response> {{
                let state = CPLState {{
                    tokens:   vec![{token_vec}],
                    phx_seal: msg.phx_seal,
                    beat:     msg.beat,
                }};
                STATE.save(deps.storage, &state)?;
                Ok(Response::new().add_attribute("token_count", "{token_count}"))
            }}

            #[entry_point]
            pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {{
                let state = STATE.load(deps.storage)?;
                match msg {{
                    QueryMsg::TokenCount {{}} => to_json_binary(&{token_count}u64),
                    QueryMsg::PhxSeal    {{}} => to_json_binary(&state.phx_seal),
                    QueryMsg::Eval       {{}} => to_json_binary(&state.tokens),
                }}
            }}
            """)


# ── Cairo / StarkNet Emitter ──────────────────────────────────────────────────

class CairoEmitter(_Emitter):
    """Emit CPL as a Cairo / StarkNet contract (CAI)."""

    LANGUAGE = "cairo"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_count = len(tokens)
        felt_tokens = "\n".join(
            f"            array.append('{t.glyph}');"
            for t in tokens
        )
        return textwrap.dedent(f"""\
            // CPL → Cairo / StarkNet  (CAI bridge)
            // source: {raw_source}

            // Sovereign CPL expression — StarkNet felt252 encoding  (Medina)
            #[starknet::contract]
            mod CPLExpression {{
                use starknet::ContractAddress;
                use array::ArrayTrait;

                #[storage]
                struct Storage {{
                    phx_seal: felt252,   // PHX sovereign hash  (Medina)
                    beat:     u64,
                }}

                #[constructor]
                fn constructor(ref self: ContractState, phx_seal: felt252, beat: u64) {{
                    self.phx_seal.write(phx_seal);
                    self.beat.write(beat);
                }}

                // Build the CPL token array as felt252 values
                #[external(v0)]
                fn get_tokens(self: @ContractState) -> Array<felt252> {{
                    let mut array = ArrayTrait::new();
            {felt_tokens}
                    array
                }}

                #[external(v0)]
                fn token_count(self: @ContractState) -> u32 {{
                    {token_count}
                }}

                #[external(v0)]
                fn verify_phx(self: @ContractState, seal: felt252) -> bool {{
                    self.phx_seal.read() == seal
                }}

                #[external(v0)]
                fn beat(self: @ContractState) -> u64 {{
                    self.beat.read()
                }}
            }}
            """)


# ── TypeScript / Node Emitter ─────────────────────────────────────────────────

class TypeScriptEmitter(_Emitter):
    """Emit CPL as TypeScript / Node.js intelligence code (TSN)."""

    LANGUAGE = "typescript"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_array = ", ".join(f'"{t.glyph}"' for t in tokens)
        domain_array = ", ".join(f'"{t.domain}"' for t in tokens)
        token_count  = len(tokens)
        return textwrap.dedent(f"""\
            // CPL → TypeScript / Node  (TSN bridge)
            // source: {raw_source}
            import {{ CPLVM, VMValue }} from "@medina/organism-cpl";
            import {{ PHXChain }}       from "@medina/organism-phx";  // (Medina)
            import {{ QFB }}            from "@medina/organism-qfb";  // (Medina)

            const TOKENS:  readonly string[] = [{token_array}];
            const DOMAINS: readonly string[] = [{domain_array}];
            const TOKEN_COUNT = {token_count};

            // Evaluate CPL expression
            async function evalExpression(): Promise<VMValue> {{
                const vm = new CPLVM();
                return vm.evalTokens(TOKENS);
            }}

            // Full organism query call  (Medina)
            async function queryOrganism(phxKey: Uint8Array): Promise<{{
                value:    VMValue;
                phxToken: string;
                qfbId:    string;
            }}> {{
                const vm    = new CPLVM();
                const value = await vm.evalTokens(TOKENS);

                const chain    = new PHXChain(phxKey);
                const phxToken = chain.advance(
                    new TextEncoder().encode({repr(raw_source)})
                );

                const qfb = QFB.fromCPL(Array.from(TOKENS), phxKey);

                return {{
                    value,
                    phxToken: Buffer.from(phxToken).toString("hex"),
                    qfbId:    qfb.id,
                }};
            }}

            export {{ evalExpression, queryOrganism, TOKENS, DOMAINS, TOKEN_COUNT }};
            """)


# ── Swift / Apple Emitter ─────────────────────────────────────────────────────

class SwiftEmitter(_Emitter):
    """Emit CPL as Swift native code for Apple substrate (SWF)."""

    LANGUAGE = "swift"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_array = ", ".join(f'"{t.glyph}"' for t in tokens)
        token_count = len(tokens)
        return textwrap.dedent(f"""\
            // CPL → Swift / Apple substrate  (SWF bridge)
            // source: {raw_source}
            import Foundation
            import MedinaOrganism

            // Sovereign CPL expression  (Medina)
            struct CPLExpression {{

                static let tokens: [String] = [{token_array}]
                static let tokenCount: Int  = {token_count}
                static let source: String   = {repr(raw_source)}

                // Evaluate the CPL expression synchronously
                static func evaluate() -> VMValue {{
                    let vm = CPLVM()
                    return vm.evalTokens(tokens)
                }}

                // Evaluate asynchronously (SwiftUI / Combine compatible)
                static func evaluateAsync() async throws -> VMValue {{
                    try await Task.detached(priority: .userInitiated) {{
                        let vm = CPLVM()
                        return vm.evalTokens(Self.tokens)
                    }}.value
                }}

                // Full organism query — PHX-sealed  (Medina)
                static func query(sovereignKey: Data) throws -> OrganismQueryResult {{
                    let vm     = CPLVM()
                    let value  = vm.evalTokens(tokens)
                    let chain  = PHXChain(sovereignKey: sovereignKey)
                    let token  = try chain.advance(source.data(using: .utf8)!)
                    let qfb    = QFB.fromCPL(tokens: tokens, key: sovereignKey)
                    return OrganismQueryResult(value: value, phxToken: token, qfb: qfb)
                }}
            }}
            """)


# ── PHX Chain Emitter  (Medina) ───────────────────────────────────────────────

class PHXChainEmitter(_Emitter):
    """
    Emit PHX sovereign decision chain setup code.  (Medina)

    PHX (Phi Hash eXchange) is the organism's sovereign encryption and
    decision-ledger protocol.  This emitter generates the chain bootstrap
    code that records the CPL expression as the first sovereign decision.

    Formal definition (parallel to SHA-256):
        PHX(e, k, p, β) = HMAC-SHA256(k, BLAKE2b-512(e ‖ p ‖ β₈) ⊕ φ_expand(β))
    where φ = 1.618033988749895  (Medina)
    """

    LANGUAGE = "phx_chain"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_count = len(tokens)
        domains     = sorted({t.domain for t in tokens})
        domain_list = ", ".join(f'"{d}"' for d in domains)
        return textwrap.dedent(f"""\
            # CPL → PHX sovereign decision chain  (PHX bridge)  (Medina)
            # source: {raw_source}
            #
            # PHX formal definition:
            #   PHX(e, k, p, β) = HMAC-SHA256(k, BLAKE2b-512(e ‖ p ‖ β₈) ⊕ φ_expand(β))
            #   where φ = 1.618033988749895 (golden ratio — the Medina diffusion constant)
            #
            # This is structurally equivalent to SHA-256's compression function but:
            #   · uses BLAKE2b-512 (not SHA-256 compression rounds) as the base primitive
            #   · uses φ as the diffusion constant (not cube-root-of-prime K constants)
            #   · chains across the full decision history (not per-message)
            #   · is keyed with the organism sovereign key (HMAC envelope)
            #
            from blockbox import PHXChain
            import os

            # Organism sovereign key — hold this secret  (Medina)
            sovereign_key: bytes = os.urandom(32)   # replace with persisted key in production

            # Initialise the PHX decision chain
            chain = PHXChain(sovereign_key=sovereign_key)

            # Record the CPL expression as a sovereign decision event
            # token_count={token_count}  domains=[{domain_list}]
            phx_token = chain.advance(
                event_bytes={repr(raw_source.encode())},
                label="cpl_expression",
            )

            # phx_token is a 32-byte sovereign hash — chain it into the next decision
            print(chain.chain_summary())
            # PHXChain  beat=1  decisions=1  latest=<hex>…
            """)


# ── QFB Block Box Emitter  (Medina) ───────────────────────────────────────────

class QFBEmitter(_Emitter):
    """
    Emit QFB Quantum Fusion Block creation code.  (Medina)

    QFB is the sovereign meaning canister — the block box of the organism.
    This emitter packages the CPL expression as a QFB ready for deployment
    to any substrate (memory, ICP, EVM, Solana, edge, quantum).
    """

    LANGUAGE = "qfb"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        glyph_list  = ", ".join(f'"{t.glyph}"' for t in tokens)
        token_count = len(tokens)
        return textwrap.dedent(f"""\
            # CPL → QFB Quantum Fusion Block  (QFB bridge)  (Medina)
            # source: {raw_source}
            #
            # QFB structure  (Medina):
            #   QFB
            #   └── SHL (Sphere Helix Layer)   — geometric membrane, radius φ
            #       └── QFC (Quantum Fusion Core) — CPL payload + PHX seal
            #
            from blockbox import QFB, SphereHelixLayer, PHXChain, PHI
            import os

            # Organism sovereign key
            sovereign_key: bytes = os.urandom(32)   # replace with persisted key

            # CPL token manifest for this expression
            cpl_tokens = [{glyph_list}]   # {token_count} tokens

            # Build the QFB block box  (Medina)
            qfb = QFB.from_cpl(
                cpl_tokens  = cpl_tokens,
                key         = sovereign_key,
                substrates  = ["memory", "icp"],   # deploy to organism memory + ICP
                shl         = SphereHelixLayer(
                    sphere_radius   = PHI,       # φ-envelope
                    helix_turns     = 3,         # Triad
                    helix_pitch     = PHI,       # φ-pitch
                    helix_chirality = "right",   # right-handed helix
                ),
            )

            # Inspect the sealed block box
            print(qfb.summary())
            # QFB <id>…  substrates=['memory', 'icp']  tokens={token_count}
            #            cpl='...'  shl=ϕ1.618×3T  phx=<hex>…

            # Deploy to additional substrates if needed
            # qfb.tag_substrate("evm",    "0x...")
            # qfb.tag_substrate("solana", "<pubkey>")

            # Serialise for wire transport
            wire = qfb.to_json(indent=2)
            """)




class JavaEmitter(_Emitter):
    """Emit CPL as Java enterprise SDK code (JAV)."""

    LANGUAGE = "java"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_array = ", ".join(f'"{t.glyph}"' for t in tokens)
        domain_set  = ", ".join(f'"{t.domain}"' for t in tokens)
        return textwrap.dedent(f"""\
            // CPL → Java  (JAV bridge)
            // source: {raw_source}
            package medina.organism.cpl;

            import medina.organism.cpl.CPLVM;
            import medina.organism.cpl.VMValue;
            import java.util.Arrays;
            import java.util.List;

            public class CPLExpression {{

                private static final String[] TOKENS = {{ {token_array} }};
                private static final String[] DOMAINS = {{ {domain_set} }};

                public static VMValue evaluate() throws Exception {{
                    CPLVM vm = new CPLVM();
                    List<String> tokenList = Arrays.asList(TOKENS);
                    return vm.evalTokens(tokenList);
                }}

                public static void main(String[] args) throws Exception {{
                    VMValue result = evaluate();
                    System.out.println("CPL result: " + result);
                }}
            }}
            """)


# ── Solidity Emitter ───────────────────────────────────────────────────────────

class SolidityEmitter(_Emitter):
    """Emit CPL as a Solidity / EVM smart contract fragment (SOL)."""

    LANGUAGE = "solidity"

    _SOLIDITY_VERSION = "^0.8.24"

    def emit(self, tokens: list[CPLToken], raw_source: str) -> str:
        token_count  = len(tokens)
        glyph_hashes = "\n".join(
            f"        tokenHash[{i}] = keccak256(abi.encodePacked(\"{t.glyph}\"));"
            for i, t in enumerate(tokens)
        )
        domain_list  = ", ".join(f'"{t.domain}"' for t in tokens)
        return textwrap.dedent(f"""\
            // CPL → Solidity  (SOL bridge)
            // source: {raw_source}
            // SPDX-License-Identifier: MIT
            pragma solidity {self._SOLIDITY_VERSION};

            /// @title CPLExpression
            /// @notice Sovereign CPL expression sealed on EVM — QFB substrate adapter
            contract CPLExpression {{

                // Token count for this CPL expression
                uint256 public constant TOKEN_COUNT = {token_count};

                // PHX integrity seal (set on deployment)
                bytes32 public phxSeal;

                // Token hashes (keccak256 of each CPL glyph)
                bytes32[{token_count}] public tokenHash;

                // Domain labels
                string[{token_count}] public domains;

                constructor(bytes32 _phxSeal) {{
                    phxSeal = _phxSeal;
            {glyph_hashes}
                }}

                /// @notice Verify the PHX integrity seal of this expression
                function verifyPhxSeal(bytes32 _seal) external view returns (bool) {{
                    return phxSeal == _seal;
                }}

                /// @notice Return the number of CPL tokens in this expression
                function tokenCount() external pure returns (uint256) {{
                    return TOKEN_COUNT;
                }}
            }}
            """)


# ── CPLBridge (CXL entry point) ────────────────────────────────────────────────

class CPLBridge:
    """
    CXL Bridge — emit CPL expressions to any organism language.

    This is the official CXL (Cognitive eXchange Language) gateway.
    Feed it a CPL source string; receive code in any of the 16 languages.
    """

    _EMITTERS: dict[str, _Emitter] = {
        # ── Standard organism languages ────────────────────────────────────────
        "python":     PythonEmitter(),
        "motoko":     MotokoEmitter(),      # AI-survival canister  (Medina)
        "go":         GoEmitter(),
        "rust":       RustEmitter(),
        "java":       JavaEmitter(),
        # ── Crypto / smart-contract substrates ────────────────────────────────
        "solidity":   SolidityEmitter(),    # EVM (SOL)
        "move":       MoveEmitter(),        # Aptos / Move (MVO)
        "ink":        InkEmitter(),         # Polkadot / Ink! (INK)
        "cosmwasm":   CosmWasmEmitter(),    # Cosmos / CosmWasm (CMW)
        "cairo":      CairoEmitter(),       # StarkNet / Cairo (CAI)
        # ── General runtimes ──────────────────────────────────────────────────
        "typescript": TypeScriptEmitter(),  # Node / TypeScript (TSN)
        "swift":      SwiftEmitter(),       # Apple substrate (SWF)
        # ── Medina sovereign originals  (Medina) ──────────────────────────────
        "phx_chain":  PHXChainEmitter(),    # PHX decision ledger
        "qfb":        QFBEmitter(),         # QFB Quantum Fusion Block
    }

    def __init__(self) -> None:
        self._history: list[dict] = []

    # ── Core emit ──────────────────────────────────────────────────────────────

    def emit(self, source: str, target: str) -> str:
        """
        Emit CPL source to the target language.

        source — CPL expression string (e.g. "Λγ ∧ Ηθ → Τκτ")
        target — language code: "python" | "motoko" | "go" | "rust"
        """
        target = target.lower().strip()
        if target not in self._EMITTERS:
            raise ValueError(
                f"Unknown target '{target}'. Available: {list(self._EMITTERS)}"
            )
        tokens = self._tokenise(source)
        result = self._EMITTERS[target].emit(tokens, source)
        self._history.append({"source": source, "target": target})
        return result

    # ── Polyglot ───────────────────────────────────────────────────────────────

    def polyglot(self, source: str) -> dict[str, str]:
        """
        Emit CPL source to ALL supported languages simultaneously.

        Returns dict: {language_name: emitted_code}
        """
        tokens = self._tokenise(source)
        result: dict[str, str] = {}
        for name, emitter in self._EMITTERS.items():
            result[name] = emitter.emit(tokens, source)
        self._history.append({"source": source, "target": "polyglot"})
        return result

    # ── Token extraction ───────────────────────────────────────────────────────

    def _tokenise(self, source: str) -> list[CPLToken]:
        """
        Extract CPL tokens from a source string.

        Falls back to glyph-by-glyph splitting if the full lexer
        cannot parse a glyph (e.g. emoji sequences).
        """
        try:
            lex_tokens = tokenise(source)
            # tokenise returns strings; resolve to CPLToken objects
            resolved: list[CPLToken] = []
            for glyph in lex_tokens:
                tok = lookup_glyph(glyph)
                if tok:
                    resolved.append(tok)
            if resolved:
                return resolved
        except Exception:
            pass
        # Fallback: split on spaces and look up each piece
        result: list[CPLToken] = []
        for piece in source.split():
            tok = lookup_glyph(piece)
            if tok:
                result.append(tok)
        return result

    # ── Synopsis call ──────────────────────────────────────────────────────────

    def synopsis(self, source: str) -> dict:
        """
        Return a full synopsis of a CPL expression across all dimensions.

        Includes: token breakdown, domain coverage, family membership,
        polyglot code, and a QFB descriptor.
        """
        from blockbox import QFB
        import os

        tokens = self._tokenise(source)
        domains   = sorted({t.domain for t in tokens})
        families  = sorted({
            fam for fam, lst in {
                "latin_roots":    ["MIND","SOUL","TRUTH","POWER","BEING","SPACE","TIME","ORGANISM"],
                "greek_roots":    ["MIND","SOUL","TRUTH","POWER","BEING","TIME","SPACE"],
                "rhetoric":       ["RHETORIC"],
                "pythagorean":    ["PYTHAGOREAN"],
                "sacred_geometry":["GEOMETRY","SEED","SACRED"],
                "latin_geometry": ["GEOMETRY","SEED","ALCHEMY","PYTHAGOREAN"],
                "operators":      ["LOGIC","FLOW","ORGANISM","CIPHER","SACRED","ALCHEMY"],
            }.items()
            for dom in domains if dom in lst
        })

        key = os.urandom(32)
        glyphs = [t.glyph for t in tokens]
        qfb = QFB.from_cpl(glyphs, key)

        return {
            "source":       source,
            "token_count":  len(tokens),
            "tokens":       [{"glyph": t.glyph, "name": t.name, "domain": t.domain,
                               "english": t.english} for t in tokens],
            "domains":      domains,
            "families":     families,
            "polyglot":     self.polyglot(source),
            "qfb_id":       qfb.qfb_id,
            "qfb_summary":  qfb.summary(),
            "cpl_version":  "3.0.0",
            "language":     "CPL / CXL",
        }

    # ── Query call ─────────────────────────────────────────────────────────────

    def query(self, source: str) -> dict:
        """
        Full organism query call: evaluate + emit + package.

        This is the 'entire query call' — parse the CPL expression,
        evaluate it in the VM, emit to all languages, and return
        the complete result package.
        """
        from cpl_vm import CPLVM, TruthValue, NumberValue, ConceptValue

        vm     = CPLVM()
        value  = vm.eval_source(source)
        tokens = self._tokenise(source)

        # Determine value type label
        if isinstance(value, TruthValue):
            vtype, vval = "truth",   str(value.value)
        elif isinstance(value, NumberValue):
            vtype, vval = "number",  str(value.value)
        elif isinstance(value, ConceptValue):
            vtype, vval = "concept", value.token.english
        else:
            vtype, vval = "unknown", repr(value)

        return {
            "query":     source,
            "value":     {"type": vtype, "result": vval},
            "tokens":    len(tokens),
            "polyglot":  self.polyglot(source),
            "trace":     vm.trace,
            "beat":      873,   # organism heartbeat
        }

    @property
    def history(self) -> list[dict]:
        """Return the list of all emissions made through this bridge."""
        return list(self._history)

    def available_targets(self) -> list[str]:
        """Return the list of supported emission targets."""
        return list(self._EMITTERS.keys())
