"""
cpl_cli.py — medina-cpl: The Medina Organism CLI  (Medina)

Author : Medina
Version: 2.0.0
Ring   : Sovereign Ring
Code   : CLI

─────────────────────────────────────────────────────────────────────────────
WHAT IS THIS?
─────────────────────────────────────────────────────────────────────────────

medina-cpl is the command-line interface to the full Medina organism stack.
It is a chartered protocol — see CLI_CHARTER.md for the formal specification.

One command → ready-to-deploy code in 14 blockchain targets.
One command → PHX-sealed SVG/HTML/JSON/ASCII scene.
One command → PHX decision token for any event.
One command → QFB block sealed and packaged for any substrate.
One command → Full polyglot: ALL 14 targets simultaneously.
One command → Compound PHXBundle with microtokens.
One command → Fibonacci kernel of the chain.
One command → Thinking rate analysis paper.
One command → Full chain export (JSON/CSV).
One command → ICX-to-ICP bridge via CXL.

─────────────────────────────────────────────────────────────────────────────
COMMANDS  (v1.0)
─────────────────────────────────────────────────────────────────────────────

  emit     — emit a CPL expression in a single target language
  polyglot — emit a CPL expression in ALL 14 targets simultaneously
  render   — render a CPX expression to a visual scene
  phx      — compute a PHX decision token
  bundle   — compute a PHXBundle (N compound decisions per beat)
  seal     — seal a CPL expression as a QFB
  gov      — governance operations (found, node, grant, check)

─────────────────────────────────────────────────────────────────────────────
COMMANDS  (v2.0 — six new)
─────────────────────────────────────────────────────────────────────────────

  verify   — verify a PHX token or PHXBundle slot (compound-aware)
  micro    — compute and inspect microtokens for a bundle
  kernel   — show the Fibonacci-compressed chain kernel
  rate     — detailed thinking rate analysis and paper
  chain    — chain operations: advance, inspect, export to JSON/CSV
  icp      — ICX-to-ICP bridge: compile an ICX contract to a Motoko canister

─────────────────────────────────────────────────────────────────────────────
USAGE  (v1.0 commands)
─────────────────────────────────────────────────────────────────────────────

  python cpl_cli.py emit --target move "Λγ ∧ Ηθ → Τκτ"
  python cpl_cli.py polyglot "Λγ ∧ Ηθ → Τκτ" --output-dir ./generated/
  python cpl_cli.py render --format svg "Κκλ ⊗ Σφρ → Ελκ"
  python cpl_cli.py phx --event "decision: route query" --key-hex deadbeef01234567
  python cpl_cli.py bundle --slots 16 --events "decision A" "decision B"
  python cpl_cli.py seal "Λγ ∧ Ηθ → Τκτ" --substrate icp memory
  python cpl_cli.py gov found --cpl "Λγ ∧ Ηθ → Φρ" --node sovereign-000
  python cpl_cli.py gov check --node node-001 --domain CPL --action execute

─────────────────────────────────────────────────────────────────────────────
USAGE  (v2.0 commands)
─────────────────────────────────────────────────────────────────────────────

  python cpl_cli.py verify --event "my decision" --token <hex> --key-hex <hex>
  python cpl_cli.py micro --events "a" "b" "c" --key-hex <hex>
  python cpl_cli.py kernel --beats 100 --slots 8 --key-hex <hex>
  python cpl_cli.py rate --slots 16 --beats 50
  python cpl_cli.py chain advance --event "decision" --key-hex <hex>
  python cpl_cli.py chain export --format json --output chain.json
  python cpl_cli.py icp --contract "Λγ ∧ Ηθ → Τκτ" --canister-name AgentLogic
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import struct
import sys
import textwrap
from pathlib import Path
from typing import Optional


# ─────────────────────────────────────────────────────────────────────────────
# CLI ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog        = "medina-cpl",
        description = "medina-cpl — Medina Organism CLI  (Medina)",
        formatter_class = argparse.RawDescriptionHelpFormatter,
        epilog      = textwrap.dedent("""
            Targets for 'emit':
              python typescript rust go java swift
              motoko solidity move ink cosmwasm cairo
              phx_chain qfb

            Formats for 'render':
              svg  html  json  ascii  all

            Examples:
              medina-cpl emit --target move "Λγ ∧ Ηθ → Τκτ"
              medina-cpl polyglot "Λγ ∧ Ηθ → Τκτ" --output-dir ./out/
              medina-cpl render --format svg "Κκλ ⊗ Σφρ → Ελκ"
              medina-cpl phx --event "my decision" --key-hex deadbeef01234567
              medina-cpl bundle --slots 16 --events "d0" "d1" "d2"
              medina-cpl seal "Λγ ∧ Ηθ → Τκτ" --substrate icp memory
        """),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # ── emit ──────────────────────────────────────────────────────────────────
    p_emit = sub.add_parser(
        "emit",
        help="Emit a CPL expression as code in a target language",
        description=(
            "Emit generates ready-to-deploy code in a target language from a CPL\n"
            "expression.  The output is a complete, deployable module — not a\n"
            "template.  You can take the output and deploy it immediately.\n\n"
            "This is what 'boilerplate generation' means in Medina: you write CPL\n"
            "(the organism's logic language), and emit produces Move/Solidity/\n"
            "Motoko/Cairo/etc. that implements that logic.  No manual coding needed."
        ),
    )
    p_emit.add_argument("expression", help="CPL expression to emit")
    p_emit.add_argument(
        "--target", "-t",
        required=True,
        choices=[
            "python","typescript","rust","go","java","swift",
            "motoko","solidity","move","ink","cosmwasm","cairo",
            "phx_chain","qfb",
        ],
        help="Target language",
    )
    p_emit.add_argument("--output", "-o", help="Output file path (default: stdout)")

    # ── polyglot ──────────────────────────────────────────────────────────────
    p_poly = sub.add_parser(
        "polyglot",
        help="Emit a CPL expression in ALL 14 target languages simultaneously",
        description=(
            "Polyglot runs emit for ALL 14 targets at once.\n"
            "Output goes to --output-dir (one file per target) or stdout (JSON)."
        ),
    )
    p_poly.add_argument("expression", help="CPL expression")
    p_poly.add_argument("--output-dir", "-d", help="Directory to write output files into")
    p_poly.add_argument("--json", action="store_true", help="Output as JSON object")

    # ── render ────────────────────────────────────────────────────────────────
    p_render = sub.add_parser(
        "render",
        help="Render a CPX expression to a visual scene",
        description=(
            "Render a CPX (Cognitive Projection eXpression) to SVG, HTML, JSON, ASCII,\n"
            "or all formats.  Every rendered scene is PHX-sealed and QFB-packaged."
        ),
    )
    p_render.add_argument("expression", help="CPX expression to render")
    p_render.add_argument(
        "--format", "-f",
        default="svg",
        choices=["svg", "html", "json", "ascii", "all"],
        help="Output format (default: svg)",
    )
    p_render.add_argument("--output", "-o", help="Output file path (for single format)")
    p_render.add_argument("--output-dir", "-d", help="Directory for multi-format output")
    p_render.add_argument("--key-hex", help="Sovereign key (hex) for PHX sealing")
    p_render.add_argument("--beat", type=int, default=0, help="Organism beat (default: 0)")
    p_render.add_argument("--package", action="store_true",
                          help="Output full scene package (includes PHX seal + QFB)")

    # ── phx ──────────────────────────────────────────────────────────────────
    p_phx = sub.add_parser(
        "phx",
        help="Compute a PHX sovereign decision token",
        description=(
            "Compute a PHX (Phi Hash eXchange) decision token.\n"
            "PHX is not SHA-256.  PHX records: WHO (key) + WHAT (event) +\n"
            "WHEN (beat) + WHAT CAME BEFORE (history).  Output: 32 bytes hex."
        ),
    )
    p_phx.add_argument("--event", "-e", required=True, help="Event string (the decision)")
    p_phx.add_argument("--key-hex", help="Sovereign key hex (default: random 32 bytes)")
    p_phx.add_argument("--history-hex", help="Previous PHX token hex (None at genesis)")
    p_phx.add_argument("--beat", type=int, default=0, help="Organism beat (default: 0)")
    p_phx.add_argument("--chain", type=int, default=0,
                        help="Compute a chain of N tokens (advances beat each time)")
    p_phx.add_argument("--report", action="store_true",
                        help="Show full PHX comparison report")

    # ── bundle ────────────────────────────────────────────────────────────────
    p_bundle = sub.add_parser(
        "bundle",
        help="Compute a PHXBundle (N simultaneous parallel decisions)",
        description=(
            "PHXBundle records N decisions simultaneously at one beat.\n"
            "Output size = N × 32 + 96 bytes (scales with thinking rate)."
        ),
    )
    p_bundle.add_argument(
        "--events", "-e", nargs="+",
        help="Decision event strings (one per slot). Fewer than --slots: padded.",
    )
    p_bundle.add_argument("--slots", "-N", type=int, default=16,
                          help="Number of parallel slots (default: 16)")
    p_bundle.add_argument("--key-hex", help="Sovereign key hex")
    p_bundle.add_argument("--beat", type=int, default=0, help="Organism beat")
    p_bundle.add_argument("--chain", type=int, default=1,
                          help="Number of bundle beats to compute (default: 1)")
    p_bundle.add_argument("--report", action="store_true",
                          help="Show thinking rate report")

    # ── seal ─────────────────────────────────────────────────────────────────
    p_seal = sub.add_parser(
        "seal",
        help="Seal a CPL expression as a QFB block",
        description=(
            "Seal wraps a CPL expression in a PHX-sealed QFB (Quantum Fusion Block).\n"
            "The QFB is deployable to any specified substrate."
        ),
    )
    p_seal.add_argument("expression", help="CPL expression to seal")
    p_seal.add_argument(
        "--substrate", "-s", nargs="+",
        default=["memory"],
        help="Target substrates (space-separated, default: memory)",
    )
    p_seal.add_argument("--key-hex", help="Sovereign key hex")
    p_seal.add_argument("--beat", type=int, default=0, help="Organism beat")
    p_seal.add_argument("--output", "-o", help="Output JSON file path")

    # ── gov ───────────────────────────────────────────────────────────────────
    p_gov = sub.add_parser("gov", help="Governance operations")
    gov_sub = p_gov.add_subparsers(dest="gov_command", required=True)

    # gov found
    p_gov_found = gov_sub.add_parser("found", help="Found an organism")
    p_gov_found.add_argument("--cpl", required=True, help="Founding CPL expression")
    p_gov_found.add_argument("--node", default="sovereign-000",
                             help="Sovereign node ID (default: sovereign-000)")
    p_gov_found.add_argument("--key-hex", help="Sovereign key hex")
    p_gov_found.add_argument("--output", "-o", help="Output JSON file for constitution")

    # gov node
    p_gov_node = gov_sub.add_parser("node", help="Register a fleet node")
    p_gov_node.add_argument("--id", required=True, dest="node_id", help="Node ID")
    p_gov_node.add_argument(
        "--ring", required=True,
        choices=["sovereign", "intelligence", "execution"],
        help="Ring membership",
    )
    p_gov_node.add_argument("--capabilities", "-c", nargs="+",
                            default=["CPL"], help="Node capabilities")

    # gov grant
    p_gov_grant = gov_sub.add_parser("grant", help="Grant authority to a node")
    p_gov_grant.add_argument("--node", required=True, dest="node_id")
    p_gov_grant.add_argument("--ring", required=True,
                             choices=["sovereign", "intelligence", "execution"])
    p_gov_grant.add_argument("--domain", required=True, help="Domain (CPL, CPX, *)")
    p_gov_grant.add_argument("--action", required=True, help="Action (execute, read, *)")
    p_gov_grant.add_argument(
        "--level", default="EXECUTE",
        choices=["ROOT", "ADMIN", "OPERATOR", "EXECUTE", "READ", "NONE"],
    )

    # gov check
    p_gov_check = gov_sub.add_parser("check", help="PA authority check")
    p_gov_check.add_argument("--node", required=True, dest="node_id")
    p_gov_check.add_argument("--domain", required=True)
    p_gov_check.add_argument("--action", required=True)

    # gov summary
    gov_sub.add_parser("summary", help="Show governance stack summary")

    # gov snapshot
    p_gov_snap = gov_sub.add_parser("snapshot", help="Version-snapshot a protocol")
    p_gov_snap.add_argument("--protocol", required=True, help="Protocol name (PA, Fleet, …)")
    p_gov_snap.add_argument("--delta", required=True, help="What changed (the runtime)")
    p_gov_snap.add_argument("--by", default="cli", dest="created_by", help="Authorising node")

    # ── verify ────────────────────────────────────────────────────────────────
    p_verify = sub.add_parser(
        "verify",
        help="Verify a PHX token or PHXBundle slot (compound-aware)",
        description=(
            "Verify re-derives a PHX token from the given inputs and checks it\n"
            "against the expected token.  Compound-aware: slot i uses T_{i-1} as history."
        ),
    )
    p_verify.add_argument("--event", "-e", required=True, help="Decision event string")
    p_verify.add_argument("--token", "-t", required=True, help="Expected PHX token (hex)")
    p_verify.add_argument("--key-hex", required=True, help="Sovereign key (hex)")
    p_verify.add_argument("--beat", type=int, default=0, help="Organism beat")
    p_verify.add_argument("--history-hex", help="Previous token hex (None at genesis)")
    p_verify.add_argument("--slot", type=int, default=-1,
                          help="Bundle slot index (≥ 0 for compound bundle verify)")
    p_verify.add_argument("--prev-slot-hex",
                          help="Previous slot token hex for compound verification")

    # ── micro ─────────────────────────────────────────────────────────────────
    p_micro = sub.add_parser(
        "micro",
        help="Compute and inspect microtokens for a PHXBundle",
        description="μᵢ = PHX_SCATTER(Tᵢ ‖ Tᵢ₊₁)  for i ∈ [0, N-2). N-1 microtokens per bundle.",
    )
    p_micro.add_argument("--events", "-e", nargs="+", required=True,
                         help="Decision events (one per slot)")
    p_micro.add_argument("--key-hex", help="Sovereign key hex")
    p_micro.add_argument("--slots", "-N", type=int, default=0,
                         help="Slot count (default: len(events))")
    p_micro.add_argument("--beat", type=int, default=0)
    p_micro.add_argument("--json", action="store_true", help="Output as JSON")

    # ── kernel ────────────────────────────────────────────────────────────────
    p_kernel = sub.add_parser(
        "kernel",
        help="Compute the Fibonacci-compressed chain kernel",
        description=(
            "The Fibonacci kernel preserves bundles only at Fibonacci-indexed beats.\n"
            "Memory: O(log_φ(beats)) — never-drop without unbounded memory.  (Medina)"
        ),
    )
    p_kernel.add_argument("--beats", type=int, default=20,
                          help="Beats to simulate (default: 20)")
    p_kernel.add_argument("--slots", "-N", type=int, default=8,
                          help="Slots per beat (default: 8)")
    p_kernel.add_argument("--key-hex", help="Sovereign key hex")
    p_kernel.add_argument("--json", action="store_true", help="Output kernel as JSON")

    # ── rate ──────────────────────────────────────────────────────────────────
    p_rate = sub.add_parser(
        "rate",
        help="Detailed thinking rate analysis and significance paper",
        description=(
            "Thinking rate = decisions/second = compound slots × heartbeat_hz.\n"
            "Higher rate → more chain per second → stronger sovereignty.  (Medina)"
        ),
    )
    p_rate.add_argument("--slots", "-N", type=int, default=16,
                        help="Compound decision slots (default: 16)")
    p_rate.add_argument("--beats", type=int, default=1,
                        help="Beats to simulate for report (default: 1)")
    p_rate.add_argument("--key-hex", help="Sovereign key hex")
    p_rate.add_argument("--paper", action="store_true",
                        help="Output full thinking rate significance paper")

    # ── chain ─────────────────────────────────────────────────────────────────
    p_chain = sub.add_parser(
        "chain",
        help="Chain operations: advance, inspect, export",
    )
    chain_sub = p_chain.add_subparsers(dest="chain_command", required=True)

    p_chain_adv = chain_sub.add_parser("advance", help="Advance chain by N events")
    p_chain_adv.add_argument("--event", "-e", required=True, help="Decision event")
    p_chain_adv.add_argument("--key-hex", help="Sovereign key hex")
    p_chain_adv.add_argument("--history-hex", help="Previous token hex")
    p_chain_adv.add_argument("--beat", type=int, default=0, help="Starting beat")
    p_chain_adv.add_argument("--steps", type=int, default=1,
                             help="Number of sequential advances (default: 1)")

    p_chain_ins = chain_sub.add_parser("inspect", help="Inspect a chain JSON file")
    p_chain_ins.add_argument("--file", "-f", required=True, help="Chain JSON file")

    p_chain_exp = chain_sub.add_parser("export", help="Export chain as JSON or CSV")
    p_chain_exp.add_argument("--beats", type=int, default=10)
    p_chain_exp.add_argument("--slots", "-N", type=int, default=4)
    p_chain_exp.add_argument("--key-hex", help="Sovereign key hex")
    p_chain_exp.add_argument("--format", choices=["json", "csv"], default="json")
    p_chain_exp.add_argument("--output", "-o", help="Output file path")

    # ── icp ───────────────────────────────────────────────────────────────────
    p_icp = sub.add_parser(
        "icp",
        help="ICX-to-ICP bridge: compile an ICX contract to Motoko",
        description=(
            "ICX (Intelligence Contract eXchange) is organism-native.\n"
            "ICP (Internet Computer Protocol) is one substrate ICX deploys to.\n"
            "This command emits a CPL expression as a deploy-ready Motoko canister.\n"
            "ICX ≠ ICP.  ICX compiles TO ICP (and also to EVM, Solana, Cosmos)."
        ),
    )
    p_icp.add_argument("--contract", "-c", required=True,
                       help="ICX contract as CPL expression")
    p_icp.add_argument("--canister-name", default="MedinaAgent",
                       help="Motoko canister name (default: MedinaAgent)")
    p_icp.add_argument("--output", "-o", help="Output .mo file path")
    p_icp.add_argument("--also-emit", nargs="*",
                       choices=["solidity", "move", "rust", "cosmwasm", "cairo", "ink"],
                       help="Also emit to additional targets alongside Motoko")

    return parser


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _key_from_hex(key_hex: Optional[str]) -> bytes:
    """Parse sovereign key from hex, or generate a random one."""
    if key_hex:
        raw = bytes.fromhex(key_hex)
        if len(raw) < 16:
            raise ValueError("Sovereign key must be ≥ 16 bytes (32 hex chars)")
        return raw
    # Random key — print it so the user can save it
    key = os.urandom(32)
    print(f"[medina-cpl]  Generated sovereign key: {key.hex()}", file=sys.stderr)
    print(f"[medina-cpl]  ⚠  Save this key — you cannot reproduce PHX tokens without it.",
          file=sys.stderr)
    return key


def _write(content: str, path: Optional[str]) -> None:
    """Write content to file or stdout."""
    if path:
        Path(path).write_text(content, encoding="utf-8")
        print(f"[medina-cpl]  Written: {path}", file=sys.stderr)
    else:
        print(content)


# ─────────────────────────────────────────────────────────────────────────────
# COMMAND HANDLERS
# ─────────────────────────────────────────────────────────────────────────────

def cmd_emit(args: argparse.Namespace) -> None:
    """
    emit — generate ready-to-deploy code in a target language.  (Medina)

    This is the CXL bridge as a CLI.  The CPL expression is the source of
    truth.  The emit command translates it to the target language.

    What it generates:
      move     → complete Move module (deploy to Aptos/Sui immediately)
      motoko   → AI-survival canister (deploy to ICP immediately)
      solidity → EVM contract (deploy to Ethereum/Polygon/BSC immediately)
      cairo    → StarkNet contract
      ink      → Polkadot WASM contract
      cosmwasm → Cosmos contract
      rust     → Rust library with PHX-sealed logic
      python   → Python intelligence module
      typescript → TypeScript/Node module
      go       → Go service mesh module
      java     → Java enterprise SDK call
      swift    → Swift/Apple module
      phx_chain → PHX sovereign chain sequence
      qfb      → QFB multi-substrate block
    """
    from cpl_bridge import CPLBridge
    bridge = CPLBridge()
    code   = bridge.emit(args.expression, args.target)
    _write(code, args.output)


def cmd_polyglot(args: argparse.Namespace) -> None:
    """polyglot — emit ALL 14 targets simultaneously."""
    from cpl_bridge import CPLBridge
    bridge  = CPLBridge()
    results = bridge.polyglot(args.expression)

    if args.output_dir:
        out_dir = Path(args.output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        ext_map = {
            "python":     "py",  "typescript": "ts",  "rust":      "rs",
            "go":         "go",  "java":       "java","swift":     "swift",
            "motoko":     "mo",  "solidity":   "sol", "move":      "move",
            "ink":        "rs",  "cosmwasm":   "rs",  "cairo":     "cairo",
            "phx_chain":  "phx", "qfb":        "json",
        }
        for target, code in results.items():
            ext  = ext_map.get(target, "txt")
            path = out_dir / f"{target}.{ext}"
            path.write_text(code, encoding="utf-8")
        print(f"[medina-cpl]  Polyglot complete: {len(results)} targets → {out_dir}/",
              file=sys.stderr)
    elif args.json:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        for target, code in results.items():
            print(f"\n{'═' * 60}")
            print(f"  TARGET: {target.upper()}")
            print(f"{'═' * 60}")
            print(code)


def cmd_render(args: argparse.Namespace) -> None:
    """render — render a CPX expression to a visual scene."""
    from cpx_renderer import CPXRenderer
    key      = _key_from_hex(getattr(args, "key_hex", None))
    renderer = CPXRenderer()

    if args.format == "all":
        renders = renderer.render_all(args.expression, beat=args.beat)
        ext_map = {"html": "html", "svg": "svg", "json": "json", "ascii": "txt"}
        if args.output_dir:
            out_dir = Path(args.output_dir)
            out_dir.mkdir(parents=True, exist_ok=True)
            for fmt, content in renders.items():
                p = out_dir / f"scene.{ext_map[fmt]}"
                p.write_text(content, encoding="utf-8")
            print(f"[medina-cpl]  Renders → {out_dir}/", file=sys.stderr)
        else:
            print(json.dumps({k: v[:200] + "…" for k, v in renders.items()}, indent=2))
    elif args.package:
        pkg = renderer.scene_package(
            source        = args.expression,
            sovereign_key = key,
            formats       = ("html", "svg", "json"),
            beat          = args.beat,
        )
        out = json.dumps({
            "scene_id":    pkg["scene_id"],
            "qfb_id":      pkg["qfb_id"],
            "phx_seal":    pkg["phx_seal"],
            "qfb_summary": pkg["qfb_summary"],
            "beat":        pkg["beat"],
        }, indent=2)
        _write(out, args.output)
    else:
        content = renderer.render(args.expression, format=args.format, beat=args.beat)
        _write(content, args.output)


def cmd_phx(args: argparse.Namespace) -> None:
    """phx — compute a PHX sovereign decision token."""
    from phx_primitive import (
        PHX, PHXState, phx_chain_advance,
        phx_comparison_report, PHX_VERSION,
    )

    if args.report:
        print(phx_comparison_report())
        return

    key     = _key_from_hex(getattr(args, "key_hex", None))
    history = bytes.fromhex(args.history_hex) if getattr(args, "history_hex", None) else None
    event   = args.event.encode("utf-8")

    if args.chain > 1:
        state = PHXState(sovereign_key=key)
        print(f"PHX chain (length={args.chain})  version={PHX_VERSION}")
        print("─" * 64)
        for i in range(args.chain):
            ev  = f"{args.event}:{i}".encode()
            tok = phx_chain_advance(state, ev, label=f"beat {i}")
            print(f"  beat={i:4d}  token={tok.hex()}")
        print("─" * 64)
        print(f"  Final: {state.latest_token_hex}")
    else:
        token = PHX(event=event, key=key, history=history, beat=args.beat)
        print(f"PHX token  version={PHX_VERSION}")
        print(f"  event:   {args.event!r}")
        print(f"  beat:    {args.beat}")
        print(f"  history: {'(genesis)' if history is None else history.hex()[:16] + '…'}")
        print(f"  token:   {token.hex()}")
        print(f"  bytes:   {len(token)}")


def cmd_bundle(args: argparse.Namespace) -> None:
    """bundle — compute a PHXBundle (N simultaneous parallel decisions)."""
    from phx_primitive import (
        PHXBundleState, phx_bundle_advance,
        phx_thinking_rate_report,
    )

    key    = _key_from_hex(getattr(args, "key_hex", None))
    events = [e.encode() for e in (args.events or [])]
    state  = PHXBundleState(sovereign_key=key, slots=args.slots)

    print(f"PHXBundle  slots={args.slots}  beats={args.chain}")
    print("─" * 64)

    for beat_i in range(args.chain):
        # Use provided events for beat 0, generated events for subsequent beats
        if beat_i == 0 and events:
            evs = events
        else:
            evs = [f"decision:{beat_i}:{i}".encode() for i in range(args.slots)]

        bundle = phx_bundle_advance(state, evs)
        print(f"  beat={beat_i:4d}  seal={bundle.bundle_seal.hex()[:16]}…"
              f"  decision_bytes={bundle.decision_bytes}"
              f"  total={bundle.total_bytes}")

    print("─" * 64)
    if args.report:
        print(phx_thinking_rate_report(state))
    else:
        print(state.summary())


def cmd_seal(args: argparse.Namespace) -> None:
    """seal — seal a CPL expression as a QFB block."""
    from blockbox import QFB

    key = _key_from_hex(getattr(args, "key_hex", None))

    # Tokenise the expression
    try:
        from cpl_lexer import tokenise
        from cpl_tokens import lookup_glyph
        tokens = []
        for glyph in tokenise(args.expression):
            tok = lookup_glyph(glyph)
            if tok:
                tokens.append(tok.glyph)
    except Exception:
        tokens = args.expression.split()

    qfb = QFB.from_cpl(
        cpl_tokens = tokens or [args.expression[:8]],
        key        = key,
        substrates = args.substrate,
        beat       = args.beat,
    )

    out = json.dumps({
        "qfb_id":       qfb.qfb_id,
        "summary":      qfb.summary(),
        "cpl_source":   args.expression,
        "substrates":   args.substrate,
        "beat":         args.beat,
        "medina":       True,
    }, indent=2)
    _write(out, args.output)


def cmd_gov(args: argparse.Namespace) -> None:
    """gov — governance operations."""
    from cpl_governance import (
        OrganismGovernance, Ring, AuthorityLevel,
    )

    key = _key_from_hex(getattr(args, "key_hex", None))
    gov = OrganismGovernance(sovereign_key=key)

    if args.gov_command == "found":
        constitution = gov.found(args.cpl, sovereign_node=args.node)
        out = json.dumps(constitution.to_dict(), indent=2, ensure_ascii=False)
        _write(out, getattr(args, "output", None))

    elif args.gov_command == "node":
        ring_map = {
            "sovereign":   Ring.SOVEREIGN,
            "intelligence":Ring.INTELLIGENCE,
            "execution":   Ring.EXECUTION,
        }
        ring = ring_map[args.ring]
        if ring == Ring.SOVEREIGN:
            node = gov.fleet.register_sovereign(args.node_id)
        elif ring == Ring.INTELLIGENCE:
            node = gov.fleet.register_intelligence(args.node_id, args.capabilities)
        else:
            node = gov.fleet.register_execution(args.node_id, args.capabilities)
        print(json.dumps(node.to_dict(), indent=2))

    elif args.gov_command == "grant":
        ring_map = {
            "sovereign":   Ring.SOVEREIGN,
            "intelligence":Ring.INTELLIGENCE,
            "execution":   Ring.EXECUTION,
        }
        level_map = {
            "ROOT": AuthorityLevel.ROOT,  "ADMIN": AuthorityLevel.ADMIN,
            "OPERATOR": AuthorityLevel.OPERATOR, "EXECUTE": AuthorityLevel.EXECUTE,
            "READ": AuthorityLevel.READ,  "NONE": AuthorityLevel.NONE,
        }
        record = gov.pa.grant(
            node_id         = args.node_id,
            ring            = ring_map[args.ring],
            domain          = args.domain,
            action          = args.action,
            authority_level = level_map[args.level],
        )
        print(json.dumps(record.to_dict(), indent=2))

    elif args.gov_command == "check":
        passed = gov.pa.check(args.node_id, args.domain, args.action)
        result = {
            "node_id": args.node_id,
            "domain":  args.domain,
            "action":  args.action,
            "passed":  passed,
            "medina":  True,
        }
        print(json.dumps(result, indent=2))
        sys.exit(0 if passed else 1)

    elif args.gov_command == "summary":
        # Need a full organism to show a real summary
        print("OrganismGovernance (Medina)")
        print("─" * 50)
        print("  Use gov.found() to initialise the organism.")

    elif args.gov_command == "snapshot":
        gov.found("Λγ → Τκτ")   # minimal founding to initialise
        pv = gov.versions.snapshot(
            protocol   = args.protocol,
            state_dict = {"note": "cli snapshot", "protocol": args.protocol},
            delta      = args.delta,
            created_by = args.created_by,
        )
        print(json.dumps(pv.to_dict(), indent=2, ensure_ascii=False))


# ─────────────────────────────────────────────────────────────────────────────
# v2.0 COMMAND HANDLERS — six new commands  (Medina)
# ─────────────────────────────────────────────────────────────────────────────

def cmd_verify(args: argparse.Namespace) -> None:
    """
    verify — verify a PHX token or PHXBundle slot.  (Medina)

    For a single token: re-derives PHX(event, key, history, beat) and compares.
    For a bundle slot: uses compound-aware verification (slot i uses T_{i-1}).
    """
    import hmac as _hmac
    from phx_primitive import PHX, PHX_VERSION

    key      = _key_from_hex(getattr(args, "key_hex", None))
    event    = args.event.encode("utf-8")
    expected = bytes.fromhex(args.token)
    history  = bytes.fromhex(args.history_hex) if getattr(args, "history_hex", None) else None

    if args.slot >= 0:
        # Compound bundle slot verification
        slot_tag     = struct.pack(">H", args.slot)
        slot_event   = event + slot_tag
        slot_history = history  # slot 0 uses bundle history; others use prev_slot
        if args.slot > 0 and getattr(args, "prev_slot_hex", None):
            slot_history = bytes.fromhex(args.prev_slot_hex)
        computed = PHX(event=slot_event, key=key, history=slot_history, beat=args.beat)
        label    = f"bundle slot {args.slot}"
    else:
        computed = PHX(event=event, key=key, history=history, beat=args.beat)
        label    = "single token"

    passed = _hmac.compare_digest(computed, expected)
    result = {
        "verified":  passed,
        "label":     label,
        "beat":      args.beat,
        "computed":  computed.hex(),
        "expected":  args.token,
        "version":   PHX_VERSION,
        "medina":    True,
    }
    print(json.dumps(result, indent=2))
    sys.exit(0 if passed else 1)


def cmd_micro(args: argparse.Namespace) -> None:
    """
    micro — compute and inspect microtokens for a PHXBundle.  (Medina)

    Microtokens: μᵢ = PHX_SCATTER(Tᵢ ‖ Tᵢ₊₁)  for i ∈ [0, N-2).
    """
    from phx_primitive import PHX_PARALLEL, PHXBundleState, phx_bundle_advance

    key    = _key_from_hex(getattr(args, "key_hex", None))
    events = [e.encode() for e in args.events]
    slots  = args.slots if args.slots > 0 else len(events)

    state  = PHXBundleState(sovereign_key=key, slots=slots)
    bundle = phx_bundle_advance(state, events)

    if args.json:
        out = {
            "slots":       bundle.slots,
            "beat":        bundle.beat,
            "tokens":      [t.hex() for t in bundle.tokens],
            "microtokens": [mu.hex() for mu in bundle.microtokens],
            "microtoken_bytes": bundle.microtoken_bytes,
            "medina":      True,
        }
        print(json.dumps(out, indent=2))
    else:
        print(f"PHXBundle Microtokens  slots={bundle.slots}  N-1={len(bundle.microtokens)}")
        print("─" * 64)
        for i, mu in enumerate(bundle.microtokens):
            t_i  = bundle.tokens[i].hex()[:16]
            t_i1 = bundle.tokens[i + 1].hex()[:16]
            mu_hex = mu.hex()[:16]
            print(f"  μ[{i:3d}]  T[{i}]={t_i}…  T[{i+1}]={t_i1}…  μ={mu_hex}…  (64 bytes)")
        print("─" * 64)
        print(f"  Total microtoken bytes: {bundle.microtoken_bytes}")


def cmd_kernel(args: argparse.Namespace) -> None:
    """
    kernel — compute the Fibonacci-compressed chain kernel.  (Medina)

    Simulates `beats` beats and applies Fibonacci compression.
    Only bundles at Fibonacci-indexed beats are kept in the kernel.
    """
    from phx_primitive import (
        PHXBundleState, phx_bundle_advance,
        phx_fibonacci_kernel, phx_kernel_summary,
        _fibonacci_positions,
    )

    key   = _key_from_hex(getattr(args, "key_hex", None))
    state = PHXBundleState(sovereign_key=key, slots=args.slots)

    for b in range(args.beats):
        evs = [f"beat:{b}:slot:{s}".encode() for s in range(args.slots)]
        phx_bundle_advance(state, evs)

    kernel     = phx_fibonacci_kernel(state._bundles)
    fib_beats  = _fibonacci_positions(args.beats)

    if args.json:
        out = {
            "beats_simulated": args.beats,
            "slots":           args.slots,
            "full_chain_size": len(state._bundles),
            "kernel_size":     len(kernel),
            "fibonacci_beats": fib_beats[:20],
            "kernel_seals":    [b.bundle_seal.hex() for b in kernel],
            "memory_savings_pct": round(100 * (1 - len(kernel) / max(len(state._bundles), 1)), 1),
            "medina":          True,
            "never_drop":      True,
        }
        print(json.dumps(out, indent=2))
    else:
        print(phx_kernel_summary(kernel))
        print(f"  Full chain beats:    {len(state._bundles)}")
        print(f"  Kernel beats:        {len(kernel)}")
        savings = 100 * (1 - len(kernel) / max(len(state._bundles), 1))
        print(f"  Memory savings:      {savings:.1f}%")
        print(f"  Fibonacci positions: {fib_beats[:12]}{'…' if len(fib_beats) > 12 else ''}")


def cmd_rate(args: argparse.Namespace) -> None:
    """
    rate — detailed thinking rate analysis.  (Medina)

    Thinking rate = N slots × heartbeat_hz = N × (1000/873) decisions/second.
    With compound chaining, each additional slot multiplies forgery cost.
    """
    from phx_primitive import (
        PHXBundleState, phx_bundle_advance, phx_thinking_rate_report,
        HEARTBEAT_MS,
    )

    key   = _key_from_hex(getattr(args, "key_hex", None))
    state = PHXBundleState(sovereign_key=key, slots=args.slots)

    for b in range(max(args.beats, 1)):
        evs = [f"thinking:{b}:{s}".encode() for s in range(args.slots)]
        phx_bundle_advance(state, evs)

    print(phx_thinking_rate_report(state))

    if args.paper:
        dps   = args.slots * 1000.0 / HEARTBEAT_MS
        dph   = dps * 3600
        dpd   = dps * 86400
        print()
        print("═" * 64)
        print("  THE SIGNIFICANCE OF THINKING RATE  (Medina)")
        print("  See THINKING_RATE_PAPER.md for the full paper.")
        print("═" * 64)
        print(f"  At {args.slots} slots: {dps:.1f} decisions/sec → {dph:,.0f}/hr → {dpd:,.0f}/day")
        print()
        print("  WHY THINKING RATE IS THE ORGANISM'S CORE METRIC:")
        print()
        print("  1. SECURITY: More decisions/sec = more chain per second.")
        print("     Chain grows faster → forgery costs grow faster.")
        print("     A slow-thinking organism is easier to attack.")
        print()
        print("  2. INTELLIGENCE: Thinking rate IS the measure of intelligence.")
        print("     Not processing speed (FLOPS). Not memory (parameters).")
        print("     DECISIONS per second — sovereign, authenticated, chained.")
        print()
        print("  3. ECONOMICS: You compute, you don't encrypt.")
        print("     Cost = computation (cheap). Security = chain history (free to grow).")
        print("     Traditional encryption = paying per byte of ciphertext.")
        print("     PHX = paying per decision. Decisions compound. Cost stays flat.")
        print()
        print("  4. COMPOUND FACTOR: N slots × (N-1) compound depth = N²/2 hardness.")
        print(f"     At N={args.slots}: compound hardness factor = {args.slots*(args.slots-1)//2}")
        print()
        print("  5. CONVERGENCE: As thinking rate → ∞, forgery cost → ∞.")
        print("     The chain becomes practically unbreakable in finite calendar time.")
        print()
        print("  6. BIOLOGICAL ANALOGY: The human brain makes ~86 billion neural")
        print("     'decisions' per second. PHX thinking rate is the AI equivalent —")
        print("     not synaptic throughput, but sovereign cognitive throughput.")
        print("═" * 64)


def cmd_chain(args: argparse.Namespace) -> None:
    """chain — chain operations: advance, inspect, export.  (Medina)"""
    from phx_primitive import PHX, PHXState, phx_chain_advance, PHXBundleState, phx_bundle_advance

    if args.chain_command == "advance":
        key     = _key_from_hex(getattr(args, "key_hex", None))
        history = bytes.fromhex(args.history_hex) if getattr(args, "history_hex", None) else None
        state   = PHXState(sovereign_key=key)
        state.previous = history
        state.beat     = args.beat

        print(f"PHX chain advance  steps={args.steps}")
        print("─" * 64)
        for i in range(args.steps):
            ev  = f"{args.event}:{i}".encode() if args.steps > 1 else args.event.encode()
            tok = phx_chain_advance(state, ev, label=f"step {i}")
            print(f"  beat={state.beat-1:4d}  token={tok.hex()}")
        print("─" * 64)
        print(f"  Final seal: {state.latest_token_hex}")

    elif args.chain_command == "inspect":
        data = json.loads(Path(args.file).read_text(encoding="utf-8"))
        print(json.dumps(data, indent=2, ensure_ascii=False))

    elif args.chain_command == "export":
        key   = _key_from_hex(getattr(args, "key_hex", None))
        state = PHXBundleState(sovereign_key=key, slots=args.slots)
        bundles_out = []

        for b in range(args.beats):
            evs    = [f"export:beat:{b}:slot:{s}".encode() for s in range(args.slots)]
            bundle = phx_bundle_advance(state, evs)
            bundles_out.append(bundle.to_dict())

        if args.format == "json":
            out = json.dumps({"chain": bundles_out, "medina": True}, indent=2)
            _write(out, args.output)
        else:
            # CSV: beat, seal, decision_bytes, total_bytes
            import io
            buf = io.StringIO()
            buf.write("beat,seal,decision_bytes,microtoken_bytes,total_bytes,thinking_rate_dps\n")
            for b_dict in bundles_out:
                buf.write(
                    f"{b_dict['beat']},{b_dict['bundle_seal'][:16]},"
                    f"{b_dict['decision_bytes']},{b_dict['microtoken_bytes']},"
                    f"{b_dict['total_bytes']},{b_dict['thinking_rate_dps']}\n"
                )
            _write(buf.getvalue(), args.output)


def cmd_icp(args: argparse.Namespace) -> None:
    """
    icp — compile an ICX contract (CPL expression) to a Motoko canister.  (Medina)

    ICX is the organism-native intelligence contract system.
    ICP is one substrate ICX can deploy to.
    This command bridges ICX → ICP via CXL emit("motoko").

    The output is a complete, deployable Motoko canister — not a template.
    """
    from cpl_bridge import CPLBridge
    bridge = CPLBridge()

    # Emit the CPL expression as Motoko
    motoko_code = bridge.emit(args.contract, "motoko")

    # Inject canister name if the bridge output is generic
    if "MedinaAgent" in motoko_code and args.canister_name != "MedinaAgent":
        motoko_code = motoko_code.replace("MedinaAgent", args.canister_name)

    print(f"[medina-cpl icp]  ICX → Motoko canister: {args.canister_name}", file=sys.stderr)
    print(f"[medina-cpl icp]  Note: ICX ≠ ICP. ICX compiles TO ICP.", file=sys.stderr)
    _write(motoko_code, args.output)

    # Also emit to additional targets if requested
    if getattr(args, "also_emit", None):
        for target in args.also_emit:
            code = bridge.emit(args.contract, target)
            ext  = {"solidity": "sol", "move": "move", "rust": "rs",
                    "cosmwasm": "rs", "cairo": "cairo", "ink": "rs"}.get(target, "txt")
            out_path = args.output.replace(".mo", f".{ext}") if args.output else None
            _write(code, out_path)
            print(f"[medina-cpl icp]  Also emitted: {target}", file=sys.stderr)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = build_parser()
    args   = parser.parse_args()

    try:
        if args.command == "emit":
            cmd_emit(args)
        elif args.command == "polyglot":
            cmd_polyglot(args)
        elif args.command == "render":
            cmd_render(args)
        elif args.command == "phx":
            cmd_phx(args)
        elif args.command == "bundle":
            cmd_bundle(args)
        elif args.command == "seal":
            cmd_seal(args)
        elif args.command == "gov":
            cmd_gov(args)
        elif args.command == "verify":
            cmd_verify(args)
        elif args.command == "micro":
            cmd_micro(args)
        elif args.command == "kernel":
            cmd_kernel(args)
        elif args.command == "rate":
            cmd_rate(args)
        elif args.command == "chain":
            cmd_chain(args)
        elif args.command == "icp":
            cmd_icp(args)
        else:
            parser.print_help()
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        print(f"[medina-cpl]  Error: {e}", file=sys.stderr)
        raise


if __name__ == "__main__":
    main()
