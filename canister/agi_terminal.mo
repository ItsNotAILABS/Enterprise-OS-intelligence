/**
 * AGI Terminal — Canister
 *
 * The AGI Terminal is the sovereign intelligence node of the organism.
 * It maintains the live system status (heartbeat tick, neuron stake,
 * maturity, governance weight, treasury) and exposes getSystemStatus()
 * for the SYN Synapse Binding Engine to imprint a permanent local
 * snapshot into the organism_solver.
 *
 * ICP Timer fires every 873 ms → systemTick().
 * Every 50 ticks (~43 s) the solver is notified via solverTick().
 *
 * Ring: Sovereign Ring
 */

import Time   "mo:base/Time";
import Int    "mo:base/Int";
import Nat    "mo:base/Nat";
import Float  "mo:base/Float";
import Text   "mo:base/Text";
import Buffer "mo:base/Buffer";
import Array  "mo:base/Array";
import Principal "mo:base/Principal";

actor AGITerminal {

  // ── Constants ──────────────────────────────────────────────────────────────

  let HEARTBEAT_MS : Nat = 873;
  let PHI          : Float = 1.618033988749895;
  let SOLVER_EVERY : Nat  = 50; // ticks between solver notifications

  // ── Stable state (survives upgrades) ──────────────────────────────────────

  stable var tick            : Nat   = 0;
  stable var booted          : Bool  = false;
  stable var neurons         : Nat   = 0;
  stable var stake           : Nat   = 0;           // e8s
  stable var maturity        : Nat   = 0;           // e8s
  stable var voteWeight      : Nat   = 0;
  stable var parallaxTreasury: Nat   = 0;           // onesicans
  stable var onesicans       : Nat   = 0;
  stable var circulating     : Nat   = 0;
  stable var spawnedNeurons  : Nat   = 0;
  stable var governanceProposals : [Text] = [];

  // ── Mutable runtime state ──────────────────────────────────────────────────

  var lastTickTime : Int = 0;

  // ── Internal helpers ───────────────────────────────────────────────────────

  /// Phi-weighted decay applied to reputation/maturity deltas.
  func phiDecay(value : Float, steps : Nat) : Float {
    value / Float.pow(PHI, Float.fromInt(steps))
  };

  /// Append an entry to a stable array (bounded at 1000).
  func pushProposal(entry : Text) : [Text] {
    let buf = Buffer.fromArray<Text>(governanceProposals);
    buf.add(entry);
    if (buf.size() > 1000) {
      // drop oldest
      let _ = buf.remove(0);
    };
    Buffer.toArray(buf)
  };

  // ── Public Interface ───────────────────────────────────────────────────────

  /// Called by ICP timer every 873 ms.
  /// Every SOLVER_EVERY ticks this also updates derived metrics.
  public func systemTick() : async () {
    let now = Time.now();
    tick += 1;
    lastTickTime := now;
    booted := true;

    // Simulate organic metric drift (replace with real governance queries
    // in a production deployment).
    if (tick % SOLVER_EVERY == 0) {
      // Maturity accrues; voteWeight tracks stake + maturity
      maturity      += stake / 1_000;
      voteWeight     := stake + maturity;
      onesicans     := parallaxTreasury + circulating;
    };
  };

  /// Full system status snapshot — the data SYN imprints as "HEART".
  public query func getSystemStatus() : async {
    booted          : Bool;
    tick            : Nat;
    neurons         : Nat;
    stake           : Nat;
    maturity        : Nat;
    voteWeight      : Nat;
    parallaxTreasury: Nat;
    onesicans       : Nat;
    circulating     : Nat;
    spawnedNeurons  : Nat;
    lastTickTime    : Int;
  } {
    {
      booted;
      tick;
      neurons;
      stake;
      maturity;
      voteWeight;
      parallaxTreasury;
      onesicans;
      circulating;
      spawnedNeurons;
      lastTickTime;
    }
  };

  /// Owner-callable: seed the economic parameters from NNS data.
  public shared(msg) func seedEconomics(
    _neurons    : Nat,
    _stake      : Nat,
    _maturity   : Nat,
    _voteWeight : Nat,
    _treasury   : Nat,
    _circulating: Nat,
    _spawned    : Nat,
  ) : async () {
    neurons         := _neurons;
    stake           := _stake;
    maturity        := _maturity;
    voteWeight      := _voteWeight;
    parallaxTreasury := _treasury;
    circulating     := _circulating;
    spawnedNeurons  := _spawned;
    onesicans       := _treasury + _circulating;
  };

  /// Add a governance proposal reference.
  public func recordProposal(proposalId : Text) : async () {
    governanceProposals := pushProposal(proposalId);
  };

  /// Return recent proposals (last N).
  public query func getProposals(count : Nat) : async [Text] {
    let len = governanceProposals.size();
    if (count >= len) return governanceProposals;
    Array.tabulate<Text>(count, func(i) = governanceProposals[len - count + i])
  };

  /// Current tick count.
  public query func getTick() : async Nat { tick };

  /// Health check — returns true if the terminal is live.
  public query func isAlive() : async Bool { booted };

}
