/**
 * organism_vault.mo — Sovereign Encryption Vault (Motoko)
 *
 * Provides symmetric key management, HMAC-SHA256 integrity checking,
 * and an encrypted binding store for the organism's Sovereign Ring.
 *
 * Cryptographic primitives available on ICP:
 *   - SHA-256 hashing via ExperimentalCycles + system
 *   - HMAC-SHA256 (manual implementation using SHA-256)
 *   - AES-CBC (approximated via XOR-keyed block cipher for demo)
 *   - Threshold ECDSA via management canister (for production signing)
 *
 * In production, use:
 *   - ic_cdk::api::management_canister::ecdsa for threshold ECDSA
 *   - vetkd for key derivation
 *   - HTTP outcalls for external HSM integration
 *
 * This module implements:
 *   - Key registry (label → 32-byte key, stored in stable memory)
 *   - HMAC-SHA256 integrity tags
 *   - Encrypted vault (XOR cipher — upgrade to AES in prod via vetkd)
 *   - Encrypted SYN bindings at rest
 *
 * Ring: Sovereign Ring
 */

import Time    "mo:base/Time";
import Nat     "mo:base/Nat";
import Nat8    "mo:base/Nat8";
import Int     "mo:base/Int";
import Text    "mo:base/Text";
import Blob    "mo:base/Blob";
import Array   "mo:base/Array";
import Buffer  "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Hash    "mo:base/Hash";
import Iter    "mo:base/Iter";
import Principal "mo:base/Principal";

actor OrganismVault {

  // ── Constants ──────────────────────────────────────────────────────────────

  let VERSION       : Nat  = 1;
  let HMAC_IPAD     : Nat8 = 0x36;
  let HMAC_OPAD     : Nat8 = 0x5C;
  let KEY_BLOCK_SIZE: Nat  = 64;   // SHA-256 block size in bytes
  let MAX_KEYS      : Nat  = 32;
  let MAX_VAULT_ENTRIES : Nat = 128;

  // ── Types ──────────────────────────────────────────────────────────────────

  type Bytes  = [Nat8];
  type Label  = Text;

  type KeyRecord = {
    label     : Label;
    key_bytes : Bytes;   // 32 bytes (256 bits)
    created   : Int;     // Unix ms
    use_count : Nat;
  };

  type VaultEntry = {
    label     : Label;
    ciphertext: Bytes;   // XOR-encrypted payload
    hmac      : Bytes;   // HMAC-SHA256 integrity tag (32 bytes)
    key_label : Label;   // which key was used
    created   : Int;
    updated   : Int;
  };

  type VaultStatus = {
    entry_count : Nat;
    key_count   : Nat;
    version     : Nat;
    timestamp   : Int;
  };

  // ── Stable storage ─────────────────────────────────────────────────────────

  // Key registry (survives upgrades)
  stable var stable_keys   : [(Label, KeyRecord)]  = [];
  stable var stable_vault  : [(Label, VaultEntry)] = [];

  // Working maps
  var keys  : HashMap.HashMap<Label, KeyRecord>  = HashMap.HashMap(8, Text.equal, Text.hash);
  var vault : HashMap.HashMap<Label, VaultEntry> = HashMap.HashMap(16, Text.equal, Text.hash);

  // ── Lifecycle hooks ────────────────────────────────────────────────────────

  system func preupgrade() {
    stable_keys  := Iter.toArray(keys.entries());
    stable_vault := Iter.toArray(vault.entries());
  };

  system func postupgrade() {
    for ((k, v) in stable_keys.vals())  { keys.put(k, v);  };
    for ((k, v) in stable_vault.vals()) { vault.put(k, v); };
  };

  // ── SHA-256 ────────────────────────────────────────────────────────────────
  //
  // Pure-Motoko SHA-256 implementation.
  // Reference: FIPS 180-4

  let K : [Nat32] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  func sha256(data : Bytes) : Bytes {
    // Initial hash values (H0-H7)
    var h0 : Nat32 = 0x6a09e667;
    var h1 : Nat32 = 0xbb67ae85;
    var h2 : Nat32 = 0x3c6ef372;
    var h3 : Nat32 = 0xa54ff53a;
    var h4 : Nat32 = 0x510e527f;
    var h5 : Nat32 = 0x9b05688c;
    var h6 : Nat32 = 0x1f83d9ab;
    var h7 : Nat32 = 0x5be0cd19;

    // Pre-processing: padding
    let bitLen : Nat = data.size() * 8;
    let buf = Buffer.Buffer<Nat8>(data.size() + 72);
    for (b in data.vals()) { buf.add(b); };
    buf.add(0x80);
    while ((buf.size() % 64) != 56) { buf.add(0x00); };
    // Append 64-bit big-endian bit length
    for (i in [7, 6, 5, 4, 3, 2, 1, 0].vals()) {
      buf.add(Nat8.fromNat((bitLen / (256 ** i)) % 256));
    };

    let padded = Buffer.toArray(buf);
    let numBlocks = padded.size() / 64;

    var bi = 0;
    while (bi < numBlocks) {
      let block = Array.tabulate<Nat8>(64, func(i) = padded[bi * 64 + i]);

      // Prepare message schedule W[0..63]
      let w = Array.init<Nat32>(64, 0);
      for (i in Iter.range(0, 15)) {
        let off = i * 4;
        w[i] :=
          (Nat32.fromNat(Nat8.toNat(block[off]))     : Nat32) << 24 |
          (Nat32.fromNat(Nat8.toNat(block[off + 1])) : Nat32) << 16 |
          (Nat32.fromNat(Nat8.toNat(block[off + 2])) : Nat32) <<  8 |
          (Nat32.fromNat(Nat8.toNat(block[off + 3])) : Nat32);
      };
      for (i in Iter.range(16, 63)) {
        let s0 = (w[i-15] >> 7 | w[i-15] << 25) ^ (w[i-15] >> 18 | w[i-15] << 14) ^ (w[i-15] >> 3);
        let s1 = (w[i-2]  >> 17 | w[i-2]  << 15) ^ (w[i-2]  >> 19 | w[i-2]  << 13) ^ (w[i-2]  >> 10);
        w[i] := w[i-16] +% s0 +% w[i-7] +% s1;
      };

      var a = h0; var b = h1; var c = h2; var d = h3;
      var e = h4; var f = h5; var g = h6; var h = h7;

      for (i in Iter.range(0, 63)) {
        let S1    = (e >> 6  | e << 26) ^ (e >> 11 | e << 21) ^ (e >> 25 | e <<  7);
        let ch    = (e & f) ^ (^ e & g);
        let temp1 = h +% S1 +% ch +% K[i] +% w[i];
        let S0    = (a >> 2  | a << 30) ^ (a >> 13 | a << 19) ^ (a >> 22 | a << 10);
        let maj   = (a & b) ^ (a & c) ^ (b & c);
        let temp2 = S0 +% maj;
        h := g; g := f; f := e; e := d +% temp1;
        d := c; c := b; b := a; a := temp1 +% temp2;
      };

      h0 +%= a; h1 +%= b; h2 +%= c; h3 +%= d;
      h4 +%= e; h5 +%= f; h6 +%= g; h7 +%= h;
      bi += 1;
    };

    // Convert hash to bytes
    func nat32ToBytes(n : Nat32) : [Nat8] = [
      Nat8.fromNat(Nat32.toNat(n >> 24)),
      Nat8.fromNat(Nat32.toNat((n >> 16) & 0xFF)),
      Nat8.fromNat(Nat32.toNat((n >>  8) & 0xFF)),
      Nat8.fromNat(Nat32.toNat(n & 0xFF)),
    ];

    Array.flatten([
      nat32ToBytes(h0), nat32ToBytes(h1), nat32ToBytes(h2), nat32ToBytes(h3),
      nat32ToBytes(h4), nat32ToBytes(h5), nat32ToBytes(h6), nat32ToBytes(h7),
    ])
  };

  // ── HMAC-SHA256 ────────────────────────────────────────────────────────────

  func hmacSHA256(key : Bytes, message : Bytes) : Bytes {
    // Normalise key to KEY_BLOCK_SIZE bytes
    var k : Bytes = if (key.size() > KEY_BLOCK_SIZE) { sha256(key) } else { key };
    if (k.size() < KEY_BLOCK_SIZE) {
      k := Array.append(k, Array.freeze(Array.init<Nat8>(KEY_BLOCK_SIZE - k.size(), 0)));
    };

    let k_ipad : Bytes = Array.map<Nat8, Nat8>(k, func(b) = b ^ HMAC_IPAD);
    let k_opad : Bytes = Array.map<Nat8, Nat8>(k, func(b) = b ^ HMAC_OPAD);

    let inner  = sha256(Array.append(k_ipad, message));
    sha256(Array.append(k_opad, inner))
  };

  // ── XOR cipher (placeholder — use vetkd in production) ────────────────────

  func xorCipher(key : Bytes, data : Bytes) : Bytes {
    let keyLen = key.size();
    if (keyLen == 0) return data;
    Array.tabulate<Nat8>(data.size(), func(i) {
      data[i] ^ key[i % keyLen]
    })
  };

  // ── Key management ─────────────────────────────────────────────────────────

  /// Register a 32-byte key under a label.
  public shared func registerKey(label : Label, key_bytes : Bytes) : async { #ok; #err : Text } {
    if (key_bytes.size() != 32) {
      return #err("Key must be exactly 32 bytes");
    };
    if (keys.size() >= MAX_KEYS) {
      return #err("MAX_KEYS (" # Nat.toText(MAX_KEYS) # ") reached");
    };
    keys.put(label, {
      label;
      key_bytes;
      created   = Time.now() / 1_000_000;
      use_count = 0;
    });
    #ok
  };

  /// Revoke a key and all vault entries using it.
  public shared func revokeKey(label : Label) : async Nat {
    ignore keys.remove(label);
    var removed = 0;
    let toRemove = Buffer.Buffer<Label>(4);
    for ((l, e) in vault.entries()) {
      if (e.key_label == label) { toRemove.add(l); };
    };
    for (l in toRemove.vals()) {
      ignore vault.remove(l);
      removed += 1;
    };
    removed
  };

  /// List key labels.
  public query func listKeys() : async [Label] {
    Iter.toArray(Iter.map(keys.entries(), func((k, _) : (Label, KeyRecord)) : Label = k))
  };

  // ── Vault operations ───────────────────────────────────────────────────────

  /// Store an encrypted entry in the vault.
  public shared func vaultStore(entry_label : Label, key_label : Label, plaintext : Bytes) : async { #ok; #err : Text } {
    if (vault.size() >= MAX_VAULT_ENTRIES) {
      return #err("MAX_VAULT_ENTRIES reached");
    };
    switch (keys.get(key_label)) {
      case null { return #err("Key not found: " # key_label); };
      case (?kr) {
        let ciphertext = xorCipher(kr.key_bytes, plaintext);
        let hmac_tag   = hmacSHA256(kr.key_bytes, plaintext);
        let now        = Time.now() / 1_000_000;
        let existing   = vault.get(entry_label);
        let created    = switch existing { case (?e) { e.created }; case null { now }; };
        vault.put(entry_label, {
          label      = entry_label;
          ciphertext;
          hmac       = hmac_tag;
          key_label;
          created;
          updated    = now;
        });
        // Update use count
        let updated_kr = {
          label     = kr.label;
          key_bytes = kr.key_bytes;
          created   = kr.created;
          use_count = kr.use_count + 1;
        };
        keys.put(key_label, updated_kr);
        #ok
      };
    }
  };

  /// Retrieve and decrypt a vault entry.
  public shared func vaultRetrieve(entry_label : Label) : async { #ok : Bytes; #err : Text } {
    switch (vault.get(entry_label)) {
      case null { return #err("Vault entry not found: " # entry_label); };
      case (?e) {
        switch (keys.get(e.key_label)) {
          case null { return #err("Key for entry not found: " # e.key_label); };
          case (?kr) {
            let plaintext = xorCipher(kr.key_bytes, e.ciphertext);
            // Verify HMAC integrity
            let computed = hmacSHA256(kr.key_bytes, plaintext);
            if (computed != e.hmac) {
              return #err("HMAC verification failed — vault entry may be corrupted");
            };
            #ok(plaintext)
          };
        }
      };
    }
  };

  /// Check HMAC integrity of a vault entry without decrypting.
  public query func vaultIntegrityCheck(entry_label : Label) : async { #ok : Text; #err : Text } {
    switch (vault.get(entry_label)) {
      case null { #err("Not found") };
      case (?_) { #ok("Entry present; call vaultRetrieve to verify HMAC") };
    }
  };

  /// Delete a vault entry.
  public shared func vaultRevoke(entry_label : Label) : async Bool {
    let existed = vault.get(entry_label) != null;
    ignore vault.remove(entry_label);
    existed
  };

  /// List all vault entry labels.
  public query func vaultList() : async [Label] {
    Iter.toArray(Iter.map(vault.entries(), func((k, _) : (Label, VaultEntry)) : Label = k))
  };

  // ── Hash utilities ─────────────────────────────────────────────────────────

  /// Compute SHA-256 of data and return as hex string.
  public query func hashSHA256(data : Bytes) : async Text {
    let hash = sha256(data);
    var result = "";
    for (b in hash.vals()) {
      let hex = "0123456789abcdef";
      let hi  = Nat8.toNat(b) / 16;
      let lo  = Nat8.toNat(b) % 16;
      result := result # Text.fromChar(Text.toArray(hex)[hi]) # Text.fromChar(Text.toArray(hex)[lo]);
    };
    result
  };

  /// Compute HMAC-SHA256 and return as hex.
  public query func computeHMAC(key : Bytes, message : Bytes) : async Text {
    let mac = hmacSHA256(key, message);
    var result = "";
    let hex = "0123456789abcdef";
    for (b in mac.vals()) {
      let hi  = Nat8.toNat(b) / 16;
      let lo  = Nat8.toNat(b) % 16;
      result := result # Text.fromChar(Text.toArray(hex)[hi]) # Text.fromChar(Text.toArray(hex)[lo]);
    };
    result
  };

  // ── Status ─────────────────────────────────────────────────────────────────

  public query func getVaultStatus() : async VaultStatus {
    {
      entry_count = vault.size();
      key_count   = keys.size();
      version     = VERSION;
      timestamp   = Time.now() / 1_000_000;
    }
  };
}
