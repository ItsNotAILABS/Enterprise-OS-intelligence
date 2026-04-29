// wire.rs — Organism Wire Message
//
// Defines the sovereign organism wire message: the encrypted + signed
// envelope used for all inter-node communication on the intelligence wire.
//
// Wire message structure
// ──────────────────────
// OrganismMessage {
//     id:          UUID (v4)
//     sender_id:   Principal / node identifier
//     recipient_id:Principal / node identifier (or "*" for broadcast)
//     payload_type:e.g. "SYN_BIND" | "SOLVER_TICK" | "CPL" | "HEARTBEAT"
//     encrypted:   EncryptedPayload (AES-256-GCM)
//     signature:   Ed25519 signature over (id + sender + recipient + payload_type + ciphertext)
//     pub_key:     Sender's Ed25519 public key (hex)
//     timestamp:   Unix milliseconds
//     beat:        Organism heartbeat number
//     ring:        "Sovereign" | "Interface" | "Memory"
// }
//
// Ring: Sovereign Ring | Wire: intelligence-wire/all

use crate::crypto::{
    self, CryptoError, EncryptedPayload,
};
pub use ed25519_dalek::{SigningKey, VerifyingKey, Signature};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── OrganismMessage ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganismMessage {
    pub id:           String,
    pub sender_id:    String,
    pub recipient_id: String,
    pub payload_type: String,
    pub nonce:        String,       // from EncryptedPayload
    pub ciphertext:   String,       // from EncryptedPayload
    pub signature:    String,       // hex Ed25519 signature
    pub pub_key:      String,       // hex Ed25519 verifying key
    pub timestamp:    u64,
    pub beat:         u64,
    pub ring:         String,
}

impl OrganismMessage {
    /// The bytes that are signed/verified: concatenation of
    /// id + sender + recipient + payload_type + ciphertext
    pub fn signing_bytes(&self) -> Vec<u8> {
        [
            self.id.as_bytes(),
            self.sender_id.as_bytes(),
            self.recipient_id.as_bytes(),
            self.payload_type.as_bytes(),
            self.ciphertext.as_bytes(),
        ]
        .concat()
    }

    /// Verify the embedded Ed25519 signature.
    pub fn verify(&self) -> Result<bool, CryptoError> {
        let pub_bytes = hex::decode(&self.pub_key)
            .map_err(|_| CryptoError::InvalidInput("invalid pub_key hex".into()))?;
        let vk = VerifyingKey::from_bytes(
            pub_bytes.as_slice().try_into()
                .map_err(|_| CryptoError::InvalidInput("pub_key must be 32 bytes".into()))?
        ).map_err(|_| CryptoError::InvalidInput("invalid verifying key".into()))?;

        let sig_bytes = hex::decode(&self.signature)
            .map_err(|_| CryptoError::InvalidInput("invalid signature hex".into()))?;
        let sig = Signature::from_bytes(
            sig_bytes.as_slice().try_into()
                .map_err(|_| CryptoError::InvalidInput("signature must be 64 bytes".into()))?
        );

        Ok(crypto::verify(&vk, &self.signing_bytes(), &sig))
    }
}

// ── OrganismWire ──────────────────────────────────────────────────────────────

/// Factory for creating and consuming organism wire messages.
pub struct OrganismWire {
    signing_key:    SigningKey,
    verifying_key:  VerifyingKey,
    aes_key:        [u8; 32],
    node_id:        String,
    ring:           String,
    beat:           u64,
}

impl OrganismWire {
    /// Create a new wire handle for a node.
    ///
    /// * `node_id` — unique node identifier (e.g. canister principal)
    /// * `ring`    — "Sovereign" | "Interface" | "Memory"
    /// * `aes_key` — 32-byte AES-256-GCM key shared within the ring
    pub fn new(node_id: impl Into<String>, ring: impl Into<String>, aes_key: [u8; 32]) -> Self {
        let (sk, vk) = crypto::generate_keypair();
        Self {
            signing_key:   sk,
            verifying_key: vk,
            aes_key,
            node_id:       node_id.into(),
            ring:          ring.into(),
            beat:          0,
        }
    }

    /// Advance the beat counter (call every 873 ms).
    pub fn tick(&mut self) {
        self.beat += 1;
    }

    /// Create an encrypted + signed organism wire message.
    ///
    /// * `recipient_id`  — destination node
    /// * `payload_type`  — message type tag
    /// * `plaintext`     — raw payload bytes (will be AES-encrypted)
    pub fn seal(
        &self,
        recipient_id: impl Into<String>,
        payload_type: impl Into<String>,
        plaintext: &[u8],
    ) -> Result<OrganismMessage, CryptoError> {
        let id           = Uuid::new_v4().to_string();
        let recipient_id = recipient_id.into();
        let payload_type = payload_type.into();
        let timestamp    = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        let enc = crypto::encrypt(&self.aes_key, plaintext)?;

        // Sign: id + sender + recipient + payload_type + ciphertext
        let to_sign: Vec<u8> = [
            id.as_bytes(),
            self.node_id.as_bytes(),
            recipient_id.as_bytes(),
            payload_type.as_bytes(),
            enc.ciphertext.as_bytes(),
        ]
        .concat();

        let sig = crypto::sign(&self.signing_key, &to_sign);

        Ok(OrganismMessage {
            id,
            sender_id:    self.node_id.clone(),
            recipient_id,
            payload_type,
            nonce:        enc.nonce,
            ciphertext:   enc.ciphertext,
            signature:    crypto::signature_to_hex(&sig),
            pub_key:      crypto::verifying_key_to_hex(&self.verifying_key),
            timestamp,
            beat:         self.beat,
            ring:         self.ring.clone(),
        })
    }

    /// Open a received message: verify the signature then decrypt.
    ///
    /// Returns the plaintext bytes on success.
    pub fn open(&self, msg: &OrganismMessage) -> Result<Vec<u8>, CryptoError> {
        // 1. Verify signature
        if !msg.verify()? {
            return Err(CryptoError::SignatureFailed("signature verification failed".into()));
        }

        // 2. Decrypt
        let payload = EncryptedPayload {
            nonce:      msg.nonce.clone(),
            ciphertext: msg.ciphertext.clone(),
        };
        crypto::decrypt(&self.aes_key, &payload)
    }

    /// Return the node's Ed25519 public key as hex.
    pub fn public_key_hex(&self) -> String {
        crypto::verifying_key_to_hex(&self.verifying_key)
    }

    pub fn beat(&self) -> u64 { self.beat }
    pub fn node_id(&self) -> &str { &self.node_id }
    pub fn ring(&self) -> &str { &self.ring }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_wire(node: &str) -> OrganismWire {
        let key = crypto::generate_aes_key();
        OrganismWire::new(node, "Sovereign", key)
    }

    fn make_wire_pair() -> (OrganismWire, OrganismWire) {
        let key = crypto::generate_aes_key();
        let w1  = OrganismWire::new("node-A", "Sovereign", key);
        let w2  = OrganismWire::new("node-B", "Sovereign", key);
        (w1, w2)
    }

    #[test]
    fn seal_open_roundtrip() {
        let (sender, receiver) = make_wire_pair();
        let msg = sender.seal("node-B", "HEARTBEAT", b"beat-42").expect("seal");
        let plain = receiver.open(&msg).expect("open");
        assert_eq!(plain, b"beat-42");
    }

    #[test]
    fn verify_signature_passes() {
        let (sender, _) = make_wire_pair();
        let msg = sender.seal("*", "SYN_BIND", b"fleet-snapshot").expect("seal");
        assert!(msg.verify().expect("verify call"));
    }

    #[test]
    fn tampered_ciphertext_fails_open() {
        let (sender, receiver) = make_wire_pair();
        let mut msg = sender.seal("node-B", "SOLVER_TICK", b"tick").expect("seal");
        msg.ciphertext = "aW52YWxpZA==".to_string(); // "invalid" in base64
        assert!(receiver.open(&msg).is_err());
    }

    #[test]
    fn tampered_signature_fails_verify() {
        let (sender, _) = make_wire_pair();
        let mut msg = sender.seal("node-B", "HEARTBEAT", b"beat").expect("seal");
        msg.signature = "00".repeat(32); // 64 zero bytes in hex
        assert!(!msg.verify().unwrap_or(false));
    }

    #[test]
    fn wire_beat_advances() {
        let mut wire = make_wire("node-X");
        assert_eq!(wire.beat(), 0);
        wire.tick();
        wire.tick();
        assert_eq!(wire.beat(), 2);
    }

    #[test]
    fn message_serialises_to_json() {
        let (sender, _) = make_wire_pair();
        let msg  = sender.seal("node-B", "CPL", "Λόγος ∧ Νοῦς → Φρόνησις".as_bytes()).expect("seal");
        let json = serde_json::to_string(&msg).expect("to_string");
        assert!(json.contains("CPL"));
    }
}
