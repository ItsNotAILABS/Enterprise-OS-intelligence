/**
 * ai_division.mo — Autonomous AI Division Canister  (Medina)
 *
 * Author  : Medina
 * Version : 1.0.0
 * Ring    : Sovereign Ring
 * Code    : AID-MOTOKO
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS THIS?
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * On-chain AI Division for ICP.  Each team generates its own cycles,
 * mints bronze block boxes (canisters), and scales on Fibonacci growth.
 *
 * Canister calls:
 *   1. boot()                  — boot all 5 teams
 *   2. tick_all()              — advance all teams by one cycle
 *   3. mint_blockbox(team, payload) — mint a bronze block box
 *   4. scale_to(level)         — scale all teams to Fibonacci level
 *   5. division_status()       — full status query
 *   6. team_status(team)       — single team status
 *   7. scaling_curve()         — the full Fibonacci growth curve
 *
 * Ring: Sovereign Ring
 */

import Time    "mo:base/Time";
import Nat     "mo:base/Nat";
import Nat8    "mo:base/Nat8";
import Nat64   "mo:base/Nat64";
import Int     "mo:base/Int";
import Float   "mo:base/Float";
import Text    "mo:base/Text";
import Array   "mo:base/Array";
import Buffer  "mo:base/Buffer";
import Blob    "mo:base/Blob";
import Hash    "mo:base/Hash";
import Iter    "mo:base/Iter";
import Result  "mo:base/Result";

// ── Types ─────────────────────────────────────────────────────────────────────

public type TeamStatus = {
  team_id   : Text;
  role      : Text;
  beat      : Nat64;
  tokens    : Nat64;
  boxes     : Nat64;
  level     : Nat64;
  capacity  : Nat64;
};

public type DivisionStatus = {
  code         : Text;
  name         : Text;
  version      : Text;
  booted       : Bool;
  global_beat  : Nat64;
  team_count   : Nat64;
  total_tokens : Nat64;
  total_boxes  : Nat64;
  heartbeat_ms : Nat64;
  medina       : Bool;
};

public type BlockBoxRecord = {
  box_id     : Text;
  tier       : Text;
  team       : Text;
  payload    : Text;
  beat       : Nat64;
  created_ms : Int;
};

public type ScalingEntry = {
  level    : Nat64;
  name     : Text;
  capacity : Nat64;
};

// ── Actor ─────────────────────────────────────────────────────────────────────

actor AIDivision {

  let HEARTBEAT_MS : Nat64 = 873;
  let TEAM_ROLES : [Text] = ["sovereign", "intelligence", "frontend", "backend", "education"];

  // Fibonacci scaling levels
  let SCALING : [ScalingEntry] = [
    { level = 0; name = "genesis";     capacity = 0 },
    { level = 1; name = "seed";        capacity = 1 },
    { level = 2; name = "micro";       capacity = 13 },
    { level = 3; name = "school";      capacity = 144 },
    { level = 4; name = "department";  capacity = 6765 },
    { level = 5; name = "institution"; capacity = 46368 },
  ];

  // ── Stable state ──────────────────────────────────────────────────────────

  stable var booted       : Bool  = false;
  stable var global_beat  : Nat64 = 0;

  // Per-team state: parallel arrays indexed by team index (0..4)
  stable var team_beats   : [Nat64] = [0, 0, 0, 0, 0];
  stable var team_tokens  : [Nat64] = [0, 0, 0, 0, 0];
  stable var team_boxes   : [Nat64] = [0, 0, 0, 0, 0];
  stable var team_levels  : [Nat64] = [0, 0, 0, 0, 0];
  stable var blockbox_log : [BlockBoxRecord] = [];

  // ── Helpers ───────────────────────────────────────────────────────────────

  func _teamIndex(role : Text) : ?Nat {
    var i = 0;
    for (r in TEAM_ROLES.vals()) {
      if (r == role) return ?i;
      i += 1;
    };
    null
  };

  func _updateArr(arr : [Nat64], idx : Nat, val : Nat64) : [Nat64] {
    Array.tabulate<Nat64>(arr.size(), func(i) {
      if (i == idx) val else arr[i]
    })
  };

  // ── Boot ──────────────────────────────────────────────────────────────────

  public shared(_msg) func boot() : async Result.Result<Text, Text> {
    if (booted) return #err("Already booted");
    booted := true;
    #ok("AI Division booted — 5 teams active")
  };

  // ── Tick All ──────────────────────────────────────────────────────────────

  public shared(_msg) func tick_all() : async Result.Result<DivisionStatus, Text> {
    if (not booted) return #err("Not booted");
    
    var i = 0;
    let slots : Nat64 = 16;
    for (_r in TEAM_ROLES.vals()) {
      team_beats  := _updateArr(team_beats,  i, team_beats[i] + 1);
      team_tokens := _updateArr(team_tokens, i, team_tokens[i] + slots);
      i += 1;
    };
    global_beat := global_beat + 1;

    #ok(await division_status())
  };

  // ── Mint Block Box ────────────────────────────────────────────────────────

  public shared(_msg) func mint_blockbox(team : Text, payload : Text) : async Result.Result<BlockBoxRecord, Text> {
    if (not booted) return #err("Not booted");
    switch (_teamIndex(team)) {
      case null #err("Unknown team: " # team);
      case (?idx) {
        let beat = team_beats[idx];
        team_boxes := _updateArr(team_boxes, idx, team_boxes[idx] + 1);

        let record : BlockBoxRecord = {
          box_id     = "bb-" # team # "-" # Nat64.toText(beat);
          tier       = "bronze";
          team       = team;
          payload    = payload;
          beat       = beat;
          created_ms = Time.now() / 1_000_000;
        };

        blockbox_log := Array.append(blockbox_log, [record]);
        #ok(record)
      };
    }
  };

  // ── Scale ─────────────────────────────────────────────────────────────────

  public shared(_msg) func scale_to(level : Nat64) : async Result.Result<Text, Text> {
    if (not booted) return #err("Not booted");
    if (Nat64.toNat(level) >= SCALING.size()) return #err("Level out of range");

    let cap = SCALING[Nat64.toNat(level)].capacity;
    var i = 0;
    for (_r in TEAM_ROLES.vals()) {
      team_levels := _updateArr(team_levels, i, level);
      i += 1;
    };

    #ok("Scaled all teams to level " # Nat64.toText(level) # " — capacity " # Nat64.toText(cap))
  };

  // ── Queries ───────────────────────────────────────────────────────────────

  public query func division_status() : async DivisionStatus {
    var total_t : Nat64 = 0;
    var total_b : Nat64 = 0;
    for (i in Iter.range(0, 4)) {
      total_t += team_tokens[i];
      total_b += team_boxes[i];
    };
    {
      code         = "AID";
      name         = "AI Division";
      version      = "1.0.0";
      booted       = booted;
      global_beat  = global_beat;
      team_count   = 5;
      total_tokens = total_t;
      total_boxes  = total_b;
      heartbeat_ms = HEARTBEAT_MS;
      medina       = true;
    }
  };

  public query func team_status(role : Text) : async Result.Result<TeamStatus, Text> {
    switch (_teamIndex(role)) {
      case null #err("Unknown team: " # role);
      case (?idx) {
        let cap = if (Nat64.toNat(team_levels[idx]) < SCALING.size()) {
          SCALING[Nat64.toNat(team_levels[idx])].capacity
        } else { 0 };
        #ok({
          team_id  = "team-" # role;
          role     = role;
          beat     = team_beats[idx];
          tokens   = team_tokens[idx];
          boxes    = team_boxes[idx];
          level    = team_levels[idx];
          capacity = cap;
        })
      };
    }
  };

  public query func scaling_curve() : async [ScalingEntry] { SCALING };

  public query func all_blockboxes() : async [BlockBoxRecord] { blockbox_log };

};
