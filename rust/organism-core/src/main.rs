// main.rs — Organism Core Demo
//
// Demonstrates phi-math, encryption, and wire message sealing/opening.

use organism_core::{
    crypto,
    phi_math,
    wire::OrganismWire,
};

fn main() {
    println!("═══ Organism Core (Rust) — Demo ═══\n");

    // ── Phi math ──────────────────────────────────────────────────────────────
    println!("── Phi Math ──────────────────────────────────────────────────");
    let score = phi_math::phi_score(3, 0.92, 0.88);
    println!("  phi_score(CRITICAL, 0.92, 0.88) = {:.6}", score);
    println!("  fibonacci(10) = {:?}", phi_math::fibonacci(10));
    println!("  phi_decay(100, 3) = {:.4}", phi_math::phi_decay(100.0, 3));

    let mut phases = vec![0.0f64, 1.0, 2.0, 3.0];
    let freqs = vec![1.0, 1.1, 0.9, 1.05];
    phi_math::kuramoto_step(&mut phases, &freqs, 2.0, 0.873);
    println!("  kuramoto_order = {:.4}", phi_math::kuramoto_order(&phases));
    println!();

    // ── Encryption ────────────────────────────────────────────────────────────
    println!("── AES-256-GCM Encryption ────────────────────────────────────");
    let aes_key = crypto::generate_aes_key();
    let plaintext = "Sovereign organism - encrypted payload".as_bytes();
    let enc = crypto::encrypt(&aes_key, plaintext).expect("encrypt");
    println!("  nonce:      {}", enc.nonce);
    println!("  ciphertext: {}...", &enc.ciphertext[..32]);
    let dec = crypto::decrypt(&aes_key, &enc).expect("decrypt");
    println!("  decrypted:  {}", String::from_utf8_lossy(&dec));
    println!();

    // ── Ed25519 signing ───────────────────────────────────────────────────────
    println!("── Ed25519 Signing ───────────────────────────────────────────");
    let (sk, vk) = crypto::generate_keypair();
    let message = b"The organism intelligence substrate is sovereign.";
    let sig = crypto::sign(&sk, message);
    let valid = crypto::verify(&vk, message, &sig);
    println!("  pub_key:  {}...", &crypto::verifying_key_to_hex(&vk)[..16]);
    println!("  sig:      {}...", &crypto::signature_to_hex(&sig)[..16]);
    println!("  valid:    {}", valid);
    println!();

    // ── HKDF key derivation ───────────────────────────────────────────────────
    println!("── HKDF-SHA256 Key Derivation ────────────────────────────────");
    let derived = crypto::derive_key(
        b"master-secret",
        b"organism-salt",
        b"organism-encryption-v1",
    ).expect("derive_key");
    println!("  derived key (hex): {}...", hex::encode(&derived[..8]));
    println!();

    // ── BLAKE3 ────────────────────────────────────────────────────────────────
    println!("── BLAKE3 Hash ───────────────────────────────────────────────");
    let h = crypto::blake3_hash_hex("Λόγος ∧ Νοῦς → Φρόνησις".as_bytes());
    println!("  BLAKE3(CPL payload) = {}...", &h[..32]);
    println!();

    // ── Organism wire message ─────────────────────────────────────────────────
    println!("── Organism Wire Message (seal → open) ───────────────────────");
    let shared_key = crypto::generate_aes_key();
    let mut sender   = OrganismWire::new("agi-terminal", "Sovereign", shared_key);
    let     receiver = OrganismWire::new("organism-solver", "Sovereign", shared_key);

    sender.tick(); // beat 1
    let msg = sender
        .seal("organism-solver", "CPL", "Λόγος".as_bytes()) // Λόγος = Logos/Word
        .expect("seal");
    println!("  msg_id:       {}", msg.id);
    println!("  payload_type: {}", msg.payload_type);
    println!("  beat:         {}", msg.beat);
    println!("  sig_valid:    {}", msg.verify().unwrap_or(false));
    let plaintext = receiver.open(&msg).expect("open");
    println!("  decrypted:    {}", String::from_utf8_lossy(&plaintext));
    println!();

    println!("═══ Demo complete ═══");
}
