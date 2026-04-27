// crypto.rs — Sovereign Encryption Engine
//
// Production-grade cryptographic primitives for the organism:
//
//   AES-256-GCM authenticated encryption
//     encrypt(key, plaintext) → (nonce, ciphertext, tag)
//     decrypt(key, nonce, ciphertext) → plaintext
//
//   Ed25519 digital signatures
//     generate_keypair()  → (SigningKey, VerifyingKey)
//     sign(key, message)  → Signature
//     verify(key, message, sig) → bool
//
//   HKDF key derivation
//     derive_key(master, salt, info) → [u8; 32]
//
//   BLAKE3 content hashing
//     blake3_hash(data) → [u8; 32]
//
//   Helpers
//     encode_b64(bytes)  → String
//     decode_b64(s)      → Vec<u8>
//
// Ring: Sovereign Ring | Rust Native Layer

use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng as AeadOsRng},
    Aes256Gcm, Key, Nonce,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use ed25519_dalek::{SigningKey, Signature, Signer, Verifier, VerifyingKey};
use hkdf::Hkdf;
use rand::{rngs::OsRng, RngCore};
use sha2::Sha256;
use blake3;
use std::fmt;

// ── Error type ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq)]
pub enum CryptoError {
    EncryptionFailed(String),
    DecryptionFailed(String),
    SignatureFailed(String),
    KeyDerivationFailed(String),
    InvalidInput(String),
}

impl fmt::Display for CryptoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CryptoError::EncryptionFailed(m)    => write!(f, "Encryption failed: {m}"),
            CryptoError::DecryptionFailed(m)    => write!(f, "Decryption failed: {m}"),
            CryptoError::SignatureFailed(m)      => write!(f, "Signature failed: {m}"),
            CryptoError::KeyDerivationFailed(m) => write!(f, "Key derivation failed: {m}"),
            CryptoError::InvalidInput(m)         => write!(f, "Invalid input: {m}"),
        }
    }
}

impl std::error::Error for CryptoError {}

// ── AES-256-GCM ───────────────────────────────────────────────────────────────

/// Result of an AES-256-GCM encryption operation.
#[derive(Debug, Clone)]
pub struct EncryptedPayload {
    /// 12-byte random nonce (base64-encoded)
    pub nonce: String,
    /// Ciphertext + 16-byte GCM authentication tag (base64-encoded)
    pub ciphertext: String,
}

/// Encrypt `plaintext` with AES-256-GCM.
///
/// `key` must be exactly 32 bytes.
/// Generates a random 12-byte nonce internally.
pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<EncryptedPayload, CryptoError> {
    let cipher_key = Key::<Aes256Gcm>::from_slice(key);
    let cipher     = Aes256Gcm::new(cipher_key);
    let nonce      = Aes256Gcm::generate_nonce(&mut AeadOsRng);

    let ciphertext = cipher
        .encrypt(&nonce, plaintext)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

    Ok(EncryptedPayload {
        nonce:      B64.encode(nonce.as_slice()),
        ciphertext: B64.encode(&ciphertext),
    })
}

/// Decrypt an `EncryptedPayload` with AES-256-GCM.
///
/// Returns the original plaintext bytes, or `CryptoError::DecryptionFailed`
/// if the key is wrong or the ciphertext has been tampered with.
pub fn decrypt(key: &[u8; 32], payload: &EncryptedPayload) -> Result<Vec<u8>, CryptoError> {
    let nonce_bytes = B64.decode(&payload.nonce)
        .map_err(|_| CryptoError::InvalidInput("invalid nonce base64".into()))?;
    let ct_bytes = B64.decode(&payload.ciphertext)
        .map_err(|_| CryptoError::InvalidInput("invalid ciphertext base64".into()))?;

    if nonce_bytes.len() != 12 {
        return Err(CryptoError::InvalidInput(format!(
            "nonce must be 12 bytes, got {}", nonce_bytes.len()
        )));
    }

    let nonce  = Nonce::from_slice(&nonce_bytes);
    let cipher_key = Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(cipher_key);

    cipher
        .decrypt(nonce, ct_bytes.as_ref())
        .map_err(|_| CryptoError::DecryptionFailed("authentication tag mismatch".into()))
}

// ── Ed25519 signatures ────────────────────────────────────────────────────────

/// Generate a fresh Ed25519 keypair.
/// Returns `(signing_key, verifying_key)`.
pub fn generate_keypair() -> (SigningKey, VerifyingKey) {
    let signing_key = SigningKey::generate(&mut OsRng);
    let verifying   = signing_key.verifying_key();
    (signing_key, verifying)
}

/// Sign a message with an Ed25519 `SigningKey`.
/// Returns the 64-byte signature.
pub fn sign(key: &SigningKey, message: &[u8]) -> Signature {
    key.sign(message)
}

/// Verify an Ed25519 signature.
pub fn verify(key: &VerifyingKey, message: &[u8], sig: &Signature) -> bool {
    key.verify(message, sig).is_ok()
}

/// Encode an Ed25519 public key to a lowercase hex string.
pub fn verifying_key_to_hex(key: &VerifyingKey) -> String {
    hex::encode(key.as_bytes())
}

/// Encode an Ed25519 signature to a lowercase hex string.
pub fn signature_to_hex(sig: &Signature) -> String {
    hex::encode(sig.to_bytes())
}

// ── HKDF key derivation ───────────────────────────────────────────────────────

/// Derive a 32-byte AES key from a master secret using HKDF-SHA256.
///
/// * `master` — high-entropy input key material
/// * `salt`   — optional non-secret randomness (can be empty)
/// * `info`   — context label (e.g. b"organism-encryption-v1")
pub fn derive_key(master: &[u8], salt: &[u8], info: &[u8]) -> Result<[u8; 32], CryptoError> {
    let hk = Hkdf::<Sha256>::new(Some(salt), master);
    let mut okm = [0u8; 32];
    hk.expand(info, &mut okm)
        .map_err(|e| CryptoError::KeyDerivationFailed(e.to_string()))?;
    Ok(okm)
}

// ── BLAKE3 hashing ────────────────────────────────────────────────────────────

/// Compute a BLAKE3 hash of `data`. Returns 32 bytes.
#[must_use]
pub fn blake3_hash(data: &[u8]) -> [u8; 32] {
    *blake3::hash(data).as_bytes()
}

/// Compute BLAKE3 hash and return as hex string.
#[must_use]
pub fn blake3_hash_hex(data: &[u8]) -> String {
    hex::encode(blake3_hash(data))
}

// ── Random key generation ─────────────────────────────────────────────────────

/// Generate 32 cryptographically-secure random bytes for use as an AES-256 key.
pub fn generate_aes_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    OsRng.fill_bytes(&mut key);
    key
}

// ── Base64 helpers ────────────────────────────────────────────────────────────

/// Encode bytes to standard base64.
#[must_use]
pub fn encode_b64(data: &[u8]) -> String {
    B64.encode(data)
}

/// Decode standard base64 to bytes.
pub fn decode_b64(s: &str) -> Result<Vec<u8>, CryptoError> {
    B64.decode(s).map_err(|_| CryptoError::InvalidInput("invalid base64".into()))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aes_gcm_roundtrip() {
        let key  = generate_aes_key();
        let msg  = b"The organism heartbeat never stops.";
        let enc  = encrypt(&key, msg).expect("encryption failed");
        let dec  = decrypt(&key, &enc).expect("decryption failed");
        assert_eq!(dec, msg);
    }

    #[test]
    fn aes_gcm_wrong_key_fails() {
        let key1 = generate_aes_key();
        let key2 = generate_aes_key();
        let enc  = encrypt(&key1, b"secret").expect("encrypt");
        assert!(decrypt(&key2, &enc).is_err());
    }

    #[test]
    fn aes_gcm_tampered_ciphertext_fails() {
        let key = generate_aes_key();
        let mut enc = encrypt(&key, b"tamper me").expect("encrypt");
        // Flip a byte in the ciphertext
        let mut ct_bytes = B64.decode(&enc.ciphertext).unwrap();
        ct_bytes[0] ^= 0xFF;
        enc.ciphertext = B64.encode(&ct_bytes);
        assert!(decrypt(&key, &enc).is_err());
    }

    #[test]
    fn ed25519_sign_verify() {
        let (sk, vk) = generate_keypair();
        let msg  = b"sovereign organism";
        let sig  = sign(&sk, msg);
        assert!(verify(&vk, msg, &sig));
    }

    #[test]
    fn ed25519_wrong_message_fails() {
        let (sk, vk) = generate_keypair();
        let sig  = sign(&sk, b"original");
        assert!(!verify(&vk, b"tampered", &sig));
    }

    #[test]
    fn hkdf_derive_key_deterministic() {
        let master = b"my-master-secret";
        let salt   = b"organism-salt";
        let info   = b"organism-encryption-v1";
        let k1 = derive_key(master, salt, info).unwrap();
        let k2 = derive_key(master, salt, info).unwrap();
        assert_eq!(k1, k2);
    }

    #[test]
    fn blake3_hash_deterministic() {
        assert_eq!(blake3_hash(b"hello"), blake3_hash(b"hello"));
    }

    #[test]
    fn blake3_hash_differs() {
        assert_ne!(blake3_hash(b"hello"), blake3_hash(b"world"));
    }

    #[test]
    fn base64_roundtrip() {
        let data = b"organism-core-v1";
        let enc  = encode_b64(data);
        let dec  = decode_b64(&enc).unwrap();
        assert_eq!(dec, data);
    }
}
