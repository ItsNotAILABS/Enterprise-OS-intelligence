"""
cpl_cli.py — medina-cpl: The Medina Organism CLI  (Medina)

Author : Medina
Version: 1.0.0
Ring   : Sovereign Ring
Code   : CLI

─────────────────────────────────────────────────────────────────────────────
WHAT IS THIS?
─────────────────────────────────────────────────────────────────────────────

medina-cpl is the command-line interface to the full Medina organism stack.

One command → ready-to-deploy code in 14 blockchain targets.
One command → PHX-sealed SVG/HTML/JSON/ASCII scene.
One command → PHX decision token for any event.
One command → QFB block sealed and packaged for any substrate.
One command → Full polyglot: ALL 14 targets simultaneously.

─────────────────────────────────────────────────────────────────────────────
COMMANDS
─────────────────────────────────────────────────────────────────────────────

  emit     — emit a CPL expression in a single target language
  polyglot — emit a CPL expression in ALL 14 targets simultaneously
  render   — render a CPX expression to a visual scene
  phx      — compute a PHX decision token
  bundle   — compute a PHXBundle (N parallel decisions)
  seal     — seal a CPL expression as a QFB
  gov      — governance operations (found, node, grant, check)

─────────────────────────────────────────────────────────────────────────────
USAGE
─────────────────────────────────────────────────────────────────────────────

  # Emit to Move (Aptos/Sui)
  python cpl_cli.py emit --target move "Λγ ∧ Ηθ → Τκτ"

  # Emit to Motoko (ICP canister)
  python cpl_cli.py emit --target motoko "Λγ ∧ Ηθ → Τκτ"

  # Emit to Solidity (EVM)
  python cpl_cli.py emit --target solidity "Λγ ∧ Ηθ → Τκτ"

  # Emit to ALL targets at once (polyglot)
  python cpl_cli.py polyglot "Λγ ∧ Ηθ → Τκτ" --output-dir ./generated/

  # Render to SVG
  python cpl_cli.py render --format svg "Κκλ ⊗ Σφρ → Ελκ"

  # Render all formats
  python cpl_cli.py render --format all "Κκλ ⊗ Σφρ → Ελκ" --output-dir ./scene/

  # Compute PHX token
  python cpl_cli.py phx --event "decision: route query" --key-hex deadbeef01234567

  # Compute PHXBundle (16 parallel decisions)
  python cpl_cli.py bundle --slots 16 --events "decision A" "decision B" "decision C"

  # Seal a QFB
  python cpl_cli.py seal "Λγ ∧ Ηθ → Τκτ" --substrate icp memory

  # Governance: found an organism
  python cpl_cli.py gov found --cpl "Λγ ∧ Ηθ → Φρ" --node sovereign-000

  # Governance: check PA
  python cpl_cli.py gov check --node node-001 --domain CPL --action execute
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
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
        else:
            parser.print_help()
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        print(f"[medina-cpl]  Error: {e}", file=sys.stderr)
        raise


if __name__ == "__main__":
    main()
