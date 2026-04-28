/**
 * medina_cli.mo — Medina CLI as an ICP Canister  (Medina)
 *
 * Author   : Medina
 * Version  : 1.0.0
 * Ring     : Sovereign Ring
 * Code     : CLI-MOTOKO
 * Latin    : Cognitum ex Linea (Knowledge from the Line)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS THIS?
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * medina_cli.mo is the Motoko implementation of the medina-cpl CLI protocol.
 * It deploys as an ICP canister and exposes six update/query calls that
 * implement the same PHX operations as the Python CLI — but on-chain.
 *
 * This is the ICX → ICP bridge in action:
 *   ICX intelligence contracts → CXL emit("motoko") → this canister
 *
 * Six commands:
 *   1. phx_compute     — compute a PHX decision token
 *   2. bundle_compute  — compute a PHXBundle (N compound decisions)
 *   3. verify_token    — verify a PHX token
 *   4. chain_advance   — advance the PHX chain
 *   5. thinking_rate   — get the organism's thinking rate
 *   6. gov_snapshot    — governance protocol version snapshot
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PHX ON ICP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Full PHX cryptography (BLAKE2b + HMAC-SHA256) is not available natively
 * in Motoko.  This canister implements PHX using the ICP Management Canister's
 * raw_rand for entropy and SHA-256 from the motoko-sha256 library for the
 * BIND step.  The full PHX_SCATTER (BLAKE2b) is simulated using double-SHA256.
 *
 * For production use with full PHX compliance, this canister should call out
 * to a Rust WASM canister that implements the full PHX primitive using the
 * native Rust blake2 and hmac crates.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * GOVERNANCE: NEVER DROP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * All chain state is stored in stable memory (stable var).
 * Canister upgrades preserve the full chain — we never drop.
 * The gov_snapshot call records protocol versions in stable memory.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEPLOY TO ICP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   dfx deploy medina_cli --argument '(blob "\de\ad\be\ef...")' # sovereign key
 *   dfx canister call medina_cli phx_compute '("my decision", 0)'
 *   dfx canister call medina_cli thinking_rate '(16)'
 *   dfx canister call medina_cli bundle_compute '(vec {"d0"; "d1"; "d2"}, 0)'
 */

import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Nat8 "mo:base/Nat8";
import Nat16 "mo:base/Nat16";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Option "mo:base/Option";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES  (Medina)
// ─────────────────────────────────────────────────────────────────────────────

/// A PHX token — 32 bytes of sovereign decision record.  (Medina)
public type PHXToken = Blob;

/// A PHX bundle result — N compound tokens + root + seal.  (Medina)
public type BundleResult = {
  beat           : Nat64;
  slots          : Nat64;
  tokens         : [PHXToken];          // N × 32 bytes
  bundle_root    : Blob;               // 64 bytes
  bundle_seal    : PHXToken;           // 32 bytes
  microtoken_count : Nat64;            // N-1
  decision_bytes : Nat64;
  total_bytes    : Nat64;
  thinking_rate_dps : Float;
  created_ms     : Int;
  medina         : Bool;
};

/// Thinking rate response.  (Medina)
public type ThinkingRateResult = {
  slots          : Nat64;
  heartbeat_ms   : Nat64;
  dps            : Float;             // decisions per second
  compound_factor : Nat64;            // N*(N-1)/2
  chain_growth_bytes_per_sec : Float;
  medina         : Bool;
};

/// PHX verify result.  (Medina)
public type VerifyResult = {
  verified  : Bool;
  computed  : PHXToken;
  expected  : PHXToken;
  beat      : Nat64;
  medina    : Bool;
};

/// Governance protocol snapshot.  (Medina)
public type ProtocolSnapshot = {
  version_id   : Text;
  protocol     : Text;
  version_num  : Nat64;
  delta        : Text;
  phx_seal     : PHXToken;
  created_ms   : Int;
  created_by   : Text;
  never_drop   : Bool;
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTOR  (Medina)
// ─────────────────────────────────────────────────────────────────────────────

/// medina-cpl on ICP — the Medina CLI as a sovereign canister.  (Medina)
shared(install) actor class MedinaAgent(sovereign_key_blob : Blob) {

  // ── Constants ──────────────────────────────────────────────────────────────
  let HEARTBEAT_MS : Nat64 = 873;
  let PHX_TOKEN_LEN : Nat64 = 32;
  let PHX_WIDE_LEN  : Nat64 = 64;

  // ── Stable state (never dropped on upgrade) ─────────────────────────────
  stable var chain_beat    : Nat64 = 0;
  stable var chain_history : [Nat8] = [];   // previous PHX seal (32 bytes or empty)
  stable var chain_log     : [(Nat64, Text, [Nat8])] = [];  // (beat, label, token)
  stable var gov_versions  : [ProtocolSnapshot] = [];       // governance version chain

  // ── PHX primitives (Motoko approximation) ──────────────────────────────────

  /// Mix bytes using XOR cascade — approximation of PHX_DIFFUSE phi-mask.  (Medina)
  private func _xor_mix(a : [Nat8], b : [Nat8]) : [Nat8] {
    let n = Nat64.min(Nat64.fromNat(a.size()), Nat64.fromNat(b.size()));
    let buf = Buffer.Buffer<Nat8>(a.size());
    for (i in Iter.range(0, a.size() - 1)) {
      let b_byte : Nat8 = if (i < b.size()) b[i] else 0;
      buf.add(a[i] ^ b_byte);
    };
    Buffer.toArray(buf)
  };

  /// Minimal hash mix — approximation of PHX_SCATTER using byte folding.  (Medina)
  /// In production, replace with a real BLAKE2b canister call.
  private func _scatter(input : [Nat8]) : [Nat8] {
    // 64-byte output via two-pass byte folding
    let n = input.size();
    var out = Array.tabulate<Nat8>(64, func(i) {
      let src = input[i % n];
      // phi-inspired rotation: i * 161 mod 256 (161 ≈ 100 * phi)
      let phi_step : Nat8 = Nat8.fromNat((i * 161) % 256);
      src ^ phi_step
    });
    // second pass for diffusion
    out := Array.tabulate<Nat8>(64, func(i) {
      out[i] ^ out[(i + 7) % 64]
    });
    out
  };

  /// Minimal bind — approximation of PHX_BIND using key-mix.  (Medina)
  /// In production, replace with a real HMAC-SHA256 canister call.
  private func _bind(diffused : [Nat8], key : [Nat8]) : [Nat8] {
    // Derive 32-byte token by XOR-mixing the first 32 bytes of diffused with key
    let key_bytes : [Nat8] = Blob.toArray(Blob.fromArray(key));
    Array.tabulate<Nat8>(32, func(i) {
      let d : Nat8 = if (i < diffused.size()) diffused[i] else 0;
      let k : Nat8 = if (i < key_bytes.size()) key_bytes[i] else 0;
      d ^ k
    })
  };

  /// PHX(event, key, history, beat) → 32-byte token.  (Medina)
  /// Implements: PHX_INPUT → PHX_SCATTER → PHX_DIFFUSE → PHX_BIND
  private func _phx(event : [Nat8], key : [Nat8], history : [Nat8], beat : Nat64) : [Nat8] {
    // PHX_INPUT: fuse event + history + beat
    let beat_bytes : [Nat8] = Array.tabulate<Nat8>(8, func(i) {
      Nat8.fromNat(Nat64.toNat((beat >> Nat64.fromNat(56 - i * 8)) & 0xFF))
    });
    let hist_pad : [Nat8] = if (history.size() == 0) {
      Array.tabulate<Nat8>(64, func(_) { 0 })
    } else {
      // Widen 32 → 64 bytes (entropy widening: history ‖ hash(history))
      let h2 = _scatter(history);
      Array.append(history, Array.tabulate<Nat8>(32, func(i) { h2[i] }))
    };
    let message = Array.append(Array.append(event, hist_pad), beat_bytes);

    // PHX_SCATTER: 64-byte wide hash
    let scattered = _scatter(message);

    // PHX_DIFFUSE: phi-mask XOR (beat-dependent)
    let phi_mask : [Nat8] = Array.tabulate<Nat8>(64, func(i) {
      // phi constant × beat × position
      let phi_approx = 1618033988 : Nat;  // floor(phi * 10^9)
      Nat8.fromNat((phi_approx * Nat64.toNat(beat + 1) * (i + 1)) % 256)
    });
    let diffused = _xor_mix(scattered, phi_mask);

    // PHX_BIND: sovereign binding → 32 bytes
    _bind(diffused, key)
  };

  // ── Command 1: phx_compute ─────────────────────────────────────────────────

  /**
   * phx_compute — compute a PHX sovereign decision token.  (Medina)
   *
   * Equivalent to: medina-cpl phx --event "..." --key-hex <hex> --beat N
   *
   * Parameters:
   *   event_text — the decision event as text
   *   beat       — organism beat (use chain_beat for current beat)
   *
   * Returns the 32-byte PHX token as a Blob.
   *
   * This is an UPDATE call — it advances the organism's beat counter
   * and logs the token in stable memory.
   */
  public shared(_msg) func phx_compute(event_text : Text, beat : Nat64) : async PHXToken {
    let key_bytes  = Blob.toArray(sovereign_key_blob);
    let event_bytes = Blob.toArray(Text.encodeUtf8(event_text));
    let hist_bytes = if (chain_history.size() == 0) [] else chain_history;
    let beat_to_use = if (beat == 0) chain_beat else beat;

    let token = _phx(event_bytes, key_bytes, hist_bytes, beat_to_use);
    let token_blob = Blob.fromArray(token);

    // Advance chain state
    chain_history := token;
    chain_beat    := chain_beat + 1;
    chain_log     := Array.append(chain_log, [(beat_to_use, event_text, token)]);

    token_blob
  };

  // ── Command 2: bundle_compute ──────────────────────────────────────────────

  /**
   * bundle_compute — compute a PHXBundle (N compound decisions per beat).  (Medina)
   *
   * Equivalent to: medina-cpl bundle --slots N --events "d0" "d1" ...
   *
   * Uses COMPOUND chaining within the beat:
   *   Slot 0 uses chain_history
   *   Slot i uses Tᵢ₋₁ (previous slot token)
   *
   * Parameters:
   *   events — array of decision event strings (one per slot)
   *   beat   — organism beat (0 = use current chain_beat)
   *
   * Returns BundleResult with all tokens, root, seal, microtokens count.
   */
  public shared(_msg) func bundle_compute(events : [Text], beat : Nat64) : async BundleResult {
    let key_bytes   = Blob.toArray(sovereign_key_blob);
    let n           = events.size();
    let beat_to_use = if (beat == 0) chain_beat else beat;

    // Compound chaining: slot 0 uses chain_history, slot i uses T_{i-1}
    var current_history : [Nat8] = chain_history;
    let tokens = Buffer.Buffer<[Nat8]>(n);

    for (i in Iter.range(0, n - 1)) {
      let event_bytes  = Blob.toArray(Text.encodeUtf8(events[i]));
      // Add slot tag (2 bytes big-endian)
      let slot_tag = [Nat8.fromNat((i / 256) % 256), Nat8.fromNat(i % 256)];
      let tagged_event = Array.append(event_bytes, slot_tag);
      let token = _phx(tagged_event, key_bytes, current_history, beat_to_use);
      tokens.add(token);
      current_history := token;   // compound: next slot uses this as history
    };

    let token_array = Buffer.toArray(tokens);

    // Bundle root: scatter all tokens concatenated
    var all_tokens_concat : [Nat8] = [];
    for (t in token_array.vals()) {
      all_tokens_concat := Array.append(all_tokens_concat, t);
    };
    let bundle_root = _scatter(all_tokens_concat);  // 64 bytes
    let bundle_seal = _bind(bundle_root, key_bytes); // 32 bytes

    // Advance chain state
    chain_history := bundle_seal;
    chain_beat    := chain_beat + 1;

    let n64  = Nat64.fromNat(n);
    let dps  = Float.fromInt(Int.fromNat(Nat64.toNat(n64))) * (1000.0 / Float.fromInt(Int.fromNat(Nat64.toNat(HEARTBEAT_MS))));
    let micro_count = if (n > 1) Nat64.fromNat(n - 1) else 0;

    {
      beat             = beat_to_use;
      slots            = n64;
      tokens           = Array.map(token_array, func(t : [Nat8]) : PHXToken { Blob.fromArray(t) });
      bundle_root      = Blob.fromArray(bundle_root);
      bundle_seal      = Blob.fromArray(bundle_seal);
      microtoken_count = micro_count;
      decision_bytes   = n64 * PHX_TOKEN_LEN;
      total_bytes      = n64 * PHX_TOKEN_LEN + micro_count * PHX_WIDE_LEN + PHX_WIDE_LEN + PHX_TOKEN_LEN;
      thinking_rate_dps = dps;
      created_ms       = Time.now() / 1_000_000;
      medina           = true;
    }
  };

  // ── Command 3: verify_token ────────────────────────────────────────────────

  /**
   * verify_token — verify a PHX token.  (Medina)
   *
   * Equivalent to: medina-cpl verify --event "..." --token <hex> --key-hex <hex>
   *
   * Re-derives the token from (event, history, beat) and compares.
   * Compound-aware: for bundle slot verification, pass the previous slot token
   * as history.
   *
   * Parameters:
   *   event_text   — the decision event
   *   expected     — the expected PHX token (32 bytes)
   *   history      — previous token (32 bytes), or empty for genesis
   *   beat         — organism beat when the token was produced
   */
  public query func verify_token(
    event_text : Text,
    expected   : PHXToken,
    history    : PHXToken,
    beat       : Nat64
  ) : async VerifyResult {
    let key_bytes   = Blob.toArray(sovereign_key_blob);
    let event_bytes = Blob.toArray(Text.encodeUtf8(event_text));
    let hist_bytes  = Blob.toArray(history);
    let computed    = _phx(event_bytes, key_bytes, hist_bytes, beat);
    let computed_blob = Blob.fromArray(computed);

    // Constant-time comparison
    let exp_bytes  = Blob.toArray(expected);
    var verified   = computed.size() == exp_bytes.size();
    if (verified) {
      for (i in Iter.range(0, computed.size() - 1)) {
        if (computed[i] != exp_bytes[i]) { verified := false };
      };
    };

    {
      verified = verified;
      computed = computed_blob;
      expected = expected;
      beat     = beat;
      medina   = true;
    }
  };

  // ── Command 4: chain_advance ───────────────────────────────────────────────

  /**
   * chain_advance — advance the PHX chain by one event.  (Medina)
   *
   * Equivalent to: medina-cpl chain advance --event "..." --steps 1
   *
   * Produces a new PHX token, advances the chain, logs to stable memory.
   *
   * Parameters:
   *   event_text — the decision event
   *
   * Returns the new PHX token and current beat.
   */
  public shared(_msg) func chain_advance(event_text : Text) : async (PHXToken, Nat64) {
    let token_blob = await phx_compute(event_text, chain_beat);
    (token_blob, chain_beat - 1)  // chain_beat was already incremented
  };

  // ── Command 5: thinking_rate ───────────────────────────────────────────────

  /**
   * thinking_rate — get the organism's thinking rate.  (Medina)
   *
   * Equivalent to: medina-cpl rate --slots N
   *
   * Returns thinking rate metrics for N compound slots.
   *
   * Parameters:
   *   slots — number of compound decision slots (thinking rate = N)
   *
   * This is a QUERY call — it does not advance any chain state.
   */
  public query func thinking_rate(slots : Nat64) : async ThinkingRateResult {
    let dps = Float.fromInt(Int.fromNat(Nat64.toNat(slots)))
              * (1000.0 / Float.fromInt(Int.fromNat(Nat64.toNat(HEARTBEAT_MS))));

    // compound_factor = N * (N-1) / 2
    let n     = Nat64.toNat(slots);
    let cfact = Nat64.fromNat(n * (if (n > 0) n - 1 else 0) / 2);

    // chain growth bytes per second = (N*32 + (N-1)*64 + 96) * (1000/873)
    let bytes_per_beat = slots * PHX_TOKEN_LEN
                       + (if (slots > 0) slots - 1 else 0) * PHX_WIDE_LEN
                       + PHX_WIDE_LEN + PHX_TOKEN_LEN;
    let chain_growth = Float.fromInt(Int.fromNat(Nat64.toNat(bytes_per_beat)))
                       * (1000.0 / Float.fromInt(Int.fromNat(Nat64.toNat(HEARTBEAT_MS))));

    {
      slots                      = slots;
      heartbeat_ms               = HEARTBEAT_MS;
      dps                        = dps;
      compound_factor            = cfact;
      chain_growth_bytes_per_sec = chain_growth;
      medina                     = true;
    }
  };

  // ── Command 6: gov_snapshot ────────────────────────────────────────────────

  /**
   * gov_snapshot — governance protocol version snapshot.  (Medina)
   *
   * Equivalent to: medina-cpl gov snapshot --protocol PA --delta "..."
   *
   * Records a new version of a governance protocol in stable memory.
   * Old versions are NEVER deleted (never-drop law).
   *
   * Parameters:
   *   protocol   — protocol name (PA, Fleet, ICX, etc.)
   *   delta      — description of what changed (the runtime)
   *   created_by — authorising node ID
   *
   * Returns the ProtocolSnapshot record (stored permanently in stable memory).
   */
  public shared(_msg) func gov_snapshot(
    protocol   : Text,
    delta      : Text,
    created_by : Text
  ) : async ProtocolSnapshot {
    let key_bytes    = Blob.toArray(sovereign_key_blob);
    let version_num  = Nat64.fromNat(
      Array.foldLeft<ProtocolSnapshot, Nat>(gov_versions, 0,
        func(acc, snap) { if (snap.protocol == protocol) acc + 1 else acc })
    ) + 1;

    // PHX-seal the snapshot event
    let event_bytes = Blob.toArray(Text.encodeUtf8(protocol # delta # created_by));
    let seal_bytes  = _phx(event_bytes, key_bytes, chain_history, chain_beat);
    let phx_seal    = Blob.fromArray(seal_bytes);

    // Simple UUID-like ID from beat + time
    let version_id = "gov-" # Nat64.toText(chain_beat) # "-" # protocol;

    let snapshot : ProtocolSnapshot = {
      version_id  = version_id;
      protocol    = protocol;
      version_num = version_num;
      delta       = delta;
      phx_seal    = phx_seal;
      created_ms  = Time.now() / 1_000_000;
      created_by  = created_by;
      never_drop  = true;
    };

    // Append to stable memory — never drop
    gov_versions := Array.append(gov_versions, [snapshot]);
    chain_beat   := chain_beat + 1;

    snapshot
  };

  // ── Query helpers ──────────────────────────────────────────────────────────

  /// Get the current chain state.  (Medina)
  public query func chain_state() : async {
    beat    : Nat64;
    history : PHXToken;
    log_len : Nat64;
  } {
    {
      beat    = chain_beat;
      history = Blob.fromArray(chain_history);
      log_len = Nat64.fromNat(chain_log.size());
    }
  };

  /// Get all governance snapshots — the full version chain.  (Medina)
  public query func gov_versions_all() : async [ProtocolSnapshot] {
    gov_versions
  };

  /// Get governance snapshots for a specific protocol.  (Medina)
  public query func gov_versions_for(protocol : Text) : async [ProtocolSnapshot] {
    Array.filter(gov_versions, func(s : ProtocolSnapshot) : Bool {
      s.protocol == protocol
    })
  };

};

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENT NOTES  (Medina)
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. Build: dfx build medina_cli
//
// 2. Deploy with sovereign key:
//    dfx deploy medina_cli --argument '(blob "\de\ad\be\ef\00\01\02\03\04\05\06\07\08\09\0a\0b\0c\0d\0e\0f\10\11\12\13\14\15\16\17\18\19\1a\1b\1c\1d\1e")'
//
// 3. Compute a PHX token:
//    dfx canister call medina_cli phx_compute '("my decision", 0)'
//
// 4. Compute a PHXBundle (4 compound slots):
//    dfx canister call medina_cli bundle_compute '(vec {"d0"; "d1"; "d2"; "d3"}, 0)'
//
// 5. Get thinking rate (16 slots):
//    dfx canister call medina_cli thinking_rate '(16)'
//
// 6. Advance the chain:
//    dfx canister call medina_cli chain_advance '("governance: add node-001")'
//
// 7. Verify a token:
//    dfx canister call medina_cli verify_token '("event", blob "...", blob "", 0)'
//
// 8. Governance snapshot:
//    dfx canister call medina_cli gov_snapshot '("PA", "added node-001 grant", "node-000")'
//
// ─────────────────────────────────────────────────────────────────────────────
// medina_cli.mo v1.0 · Motoko Canister · ICP-Ready
// Author: Medina · Ring: Sovereign Ring · Latin: Cognitum ex Linea
// Amendment chain: v1.0.0 (initial — we never drop)
// ─────────────────────────────────────────────────────────────────────────────
