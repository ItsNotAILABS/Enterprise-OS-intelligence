/**
 * SYN — Synapse Binding Engine Canister
 *
 * One purpose: kill the query forever.
 *
 * synBind(label, canisterId, dataKey)
 *   → query the remote canister ONCE, imprint the full state snapshot
 *     into stable memory. Zero future cross-canister calls for that binding.
 *
 * synQuery(label)   → pure local read. No network. No cycles. Instant.
 * synRevoke(label)  → owner destroys that binding. Data is gone.
 * synRevokeAll()    → nuclear. Every binding deleted in one call.
 * synBindAll()      → boot helper: fleet + ai + nns + HEART in one shot.
 *
 * Bindings survive upgrades via preupgrade/postupgrade hooks.
 * Up to MAX_BINDINGS simultaneous bindings.
 *
 * Ring: Sovereign Ring | Wire: intelligence-wire/syn
 */

import Text      "mo:base/Text";
import Nat       "mo:base/Nat";
import Array     "mo:base/Array";
import Time      "mo:base/Time";
import Buffer    "mo:base/Buffer";
import Principal "mo:base/Principal";
import HashMap   "mo:base/HashMap";
import Iter      "mo:base/Iter";
import Result    "mo:base/Result";

// ── Type aliases ──────────────────────────────────────────────────────────────

type Label      = Text;
type CanisterId = Principal;
type DataKey    = Text;

type BindingValue = {
  raw    : Text;      // JSON-serialised snapshot
  imprinted : Int;   // imprint timestamp (ns)
  refreshed : Int;   // last refresh timestamp (ns)
  refreshCount : Nat;
};

type BindingEntry = {
  label     : Label;
  canisterId: CanisterId;
  dataKey   : DataKey;
  value     : BindingValue;
};

// Stable serialisation helpers
type StableBinding = (Label, CanisterId, DataKey, Text, Int, Int, Nat);

// ── Actor definition ──────────────────────────────────────────────────────────

actor SYN {

  // ── Constants ────────────────────────────────────────────────────────────

  let MAX_BINDINGS : Nat = 64;

  // ── Stable storage (survives upgrades) ───────────────────────────────────

  stable var stableBindings   : [StableBinding] = [];
  stable var initialized      : Bool             = false;
  stable var owner            : Principal        = Principal.fromText("aaaaa-aa");

  // ── Live in-memory map (rebuilt from stable on postupgrade) ──────────────

  var bindings : HashMap.HashMap<Label, BindingEntry> =
    HashMap.HashMap<Label, BindingEntry>(16, Text.equal, Text.hash);

  // ── Upgrade hooks ─────────────────────────────────────────────────────────

  system func preupgrade() {
    let buf = Buffer.Buffer<StableBinding>(bindings.size());
    for ((lbl, e) in bindings.entries()) {
      buf.add((
        e.label,
        e.canisterId,
        e.dataKey,
        e.value.raw,
        e.value.imprinted,
        e.value.refreshed,
        e.value.refreshCount,
      ));
    };
    stableBindings := Buffer.toArray(buf);
  };

  system func postupgrade() {
    for ((lbl, cid, key, raw, imp, ref, cnt) in stableBindings.vals()) {
      let entry : BindingEntry = {
        label      = lbl;
        canisterId = cid;
        dataKey    = key;
        value      = {
          raw          = raw;
          imprinted    = imp;
          refreshed    = ref;
          refreshCount = cnt;
        };
      };
      bindings.put(lbl, entry);
    };
  };

  // ── Initialisation ────────────────────────────────────────────────────────

  public shared(msg) func initialize() : async Result.Result<Text, Text> {
    if (initialized) return #err("Already initialized");
    owner       := msg.caller;
    initialized := true;
    #ok("SYN initialized. Owner: " # Principal.toText(owner))
  };

  // ── Owner guard ───────────────────────────────────────────────────────────

  func assertOwner(caller : Principal) : Result.Result<(), Text> {
    if (not initialized)        return #err("Not initialized");
    if (caller != owner)        return #err("Caller is not the owner");
    #ok(())
  };

  // ── Core SYN Operations ───────────────────────────────────────────────────

  /**
   * synBind — Query the remote canister ONCE and imprint the snapshot locally.
   *
   * The AGI Terminal's getSystemStatus is modelled as a generic inter-canister
   * query keyed by dataKey.  In production, route dataKey to the right method.
   */
  public shared(msg) func synBind(
    label     : Label,
    canisterId: CanisterId,
    dataKey   : DataKey,
  ) : async Result.Result<Text, Text> {
    switch (assertOwner(msg.caller)) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };

    if (bindings.size() >= MAX_BINDINGS and bindings.get(label) == null) {
      return #err("MAX_BINDINGS (" # Nat.toText(MAX_BINDINGS) # ") reached");
    };

    // Inter-canister query to fetch the snapshot
    let remoteActor : actor {
      getSystemStatus : () -> async Text;
    } = actor(Principal.toText(canisterId));

    let snapshot = try {
      await remoteActor.getSystemStatus()
    } catch (e) {
      return #err("Remote query failed for key=" # dataKey)
    };

    let now = Time.now();
    let existing = bindings.get(label);
    let refreshCount = switch (existing) {
      case null 0;
      case (?e) e.value.refreshCount + 1;
    };
    let imprinted = switch (existing) {
      case null now;
      case (?e) e.value.imprinted;
    };

    let entry : BindingEntry = {
      label;
      canisterId;
      dataKey;
      value = {
        raw          = snapshot;
        imprinted;
        refreshed    = now;
        refreshCount;
      };
    };

    bindings.put(label, entry);
    #ok("synBind OK: label=" # label # " refreshCount=" # Nat.toText(refreshCount))
  };

  /**
   * synQuery — Pure local read. No network. No cycles. Instant.
   */
  public query func synQuery(label : Label) : async Result.Result<BindingValue, Text> {
    switch (bindings.get(label)) {
      case null  #err("No binding for label: " # label);
      case (?e)  #ok(e.value);
    }
  };

  /**
   * synRevoke — Owner destroys a binding. Data is gone. No recovery.
   */
  public shared(msg) func synRevoke(label : Label) : async Result.Result<Text, Text> {
    switch (assertOwner(msg.caller)) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    switch (bindings.remove(label)) {
      case null #err("No binding for label: " # label);
      case (_)  #ok("Revoked: " # label);
    }
  };

  /**
   * synRevokeAll — Nuclear. Every binding deleted in one call.
   */
  public shared(msg) func synRevokeAll() : async Result.Result<Text, Text> {
    switch (assertOwner(msg.caller)) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };
    let count = bindings.size();
    bindings := HashMap.HashMap<Label, BindingEntry>(16, Text.equal, Text.hash);
    stableBindings := [];
    #ok("Revoked all " # Nat.toText(count) # " bindings")
  };

  /**
   * synBindAll — Boot helper: bind fleet + ai + nns + HEART in one call.
   * Requires the caller to supply the four canister principals.
   */
  public shared(msg) func synBindAll(
    fleetId : CanisterId,
    aiId    : CanisterId,
    nnsId   : CanisterId,
    heartId : CanisterId,
  ) : async Result.Result<[Text], Text> {
    switch (assertOwner(msg.caller)) {
      case (#err(e)) return #err(e);
      case (#ok(_)) {};
    };

    let results = Buffer.Buffer<Text>(4);
    for ((lbl, cid, key) in [
      ("fleet", fleetId, "fleet"),
      ("ai",    aiId,    "ai"),
      ("nns",   nnsId,   "nns"),
      ("HEART", heartId, "heart"),
    ].vals()) {
      let r = await synBind(lbl, cid, key);
      switch (r) {
        case (#ok(s))  results.add("OK:" # s);
        case (#err(e)) results.add("ERR:" # e);
      };
    };
    #ok(Buffer.toArray(results))
  };

  // ── Diagnostics ───────────────────────────────────────────────────────────

  /// List all active binding labels and their metadata (not the raw snapshot).
  public query func synStatus() : async [{
    label        : Label;
    canisterId   : CanisterId;
    dataKey      : DataKey;
    imprinted    : Int;
    refreshed    : Int;
    refreshCount : Nat;
  }] {
    Iter.toArray(
      Iter.map<(Label, BindingEntry), {label:Label; canisterId:CanisterId; dataKey:DataKey; imprinted:Int; refreshed:Int; refreshCount:Nat}>(
        bindings.entries(),
        func((_lbl, e)) {{
          label        = e.label;
          canisterId   = e.canisterId;
          dataKey      = e.dataKey;
          imprinted    = e.value.imprinted;
          refreshed    = e.value.refreshed;
          refreshCount = e.value.refreshCount;
        }}
      )
    )
  };

  /// Number of active bindings.
  public query func bindingCount() : async Nat { bindings.size() };

  /// True if initialized.
  public query func isInitialized() : async Bool { initialized };

}
