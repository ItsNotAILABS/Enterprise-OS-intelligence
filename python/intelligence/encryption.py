"""
encryption.py — Sovereign Encryption Engine (Python)

Production-grade cryptographic primitives for the organism's Python layer.

Primitives
──────────
  AES-256-GCM authenticated encryption
    encrypt(key, plaintext) → EncryptedPayload
    decrypt(key, payload)   → plaintext bytes

  Ed25519 digital signatures
    generate_keypair()      → (SigningKey, VerifyingKey)
    sign(key, message)      → bytes (signature)
    verify(pub, message, sig) → bool

  HKDF-SHA256 key derivation
    derive_key(master, salt, info) → bytes[32]

  SHA-256 / BLAKE2b hashing
    sha256_hex(data) → str
    blake2b_hex(data) → str

  Organism message sealing (AES + Ed25519)
    OrganismCipher.seal(plaintext, payload_type, recipient)  → dict
    OrganismCipher.open(msg)                                 → plaintext bytes

Only the standard library + `cryptography` package are used.

Install: pip install cryptography

Ring: Sovereign Ring | Python Intelligence Layer
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
import uuid
from dataclasses import dataclass, field, asdict
from typing import Optional

# cryptography package — pip install cryptography
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey, Ed25519PublicKey,
)
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.primitives.serialization import (
    Encoding, PublicFormat, PrivateFormat, NoEncryption,
)
from cryptography.exceptions import InvalidSignature
import base64

# ── Constants ──────────────────────────────────────────────────────────────────

AES_KEY_BYTES    = 32       # AES-256
GCM_NONCE_BYTES  = 12       # GCM standard nonce size
VERSION_BYTE     = 0x01


# ── Error types ────────────────────────────────────────────────────────────────

class EncryptionError(Exception):
    pass

class DecryptionError(Exception):
    pass

class SignatureError(Exception):
    pass


# ── EncryptedPayload ──────────────────────────────────────────────────────────

@dataclass
class EncryptedPayload:
    """Result of an AES-256-GCM encryption operation."""
    nonce:      str   # base64-encoded 12-byte nonce
    ciphertext: str   # base64-encoded ciphertext + 16-byte GCM tag

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "EncryptedPayload":
        return cls(nonce=d["nonce"], ciphertext=d["ciphertext"])


# ── AES-256-GCM ───────────────────────────────────────────────────────────────

def encrypt(key: bytes, plaintext: bytes) -> EncryptedPayload:
    """
    Encrypt plaintext with AES-256-GCM.

    key must be exactly 32 bytes (AES-256).
    A random 12-byte nonce is generated automatically.
    The returned EncryptedPayload.ciphertext includes the 16-byte GCM auth tag.
    """
    if len(key) != AES_KEY_BYTES:
        raise EncryptionError(f"Key must be {AES_KEY_BYTES} bytes, got {len(key)}")
    nonce = os.urandom(GCM_NONCE_BYTES)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, plaintext, None)
    return EncryptedPayload(
        nonce      = base64.b64encode(nonce).decode(),
        ciphertext = base64.b64encode(ct).decode(),
    )


def decrypt(key: bytes, payload: EncryptedPayload) -> bytes:
    """
    Decrypt an EncryptedPayload with AES-256-GCM.

    Raises DecryptionError if the key is wrong or the payload has been tampered.
    """
    if len(key) != AES_KEY_BYTES:
        raise DecryptionError(f"Key must be {AES_KEY_BYTES} bytes")
    try:
        nonce = base64.b64decode(payload.nonce)
        ct    = base64.b64decode(payload.ciphertext)
    except Exception as e:
        raise DecryptionError(f"Invalid base64 payload: {e}") from e

    if len(nonce) != GCM_NONCE_BYTES:
        raise DecryptionError(f"Nonce must be {GCM_NONCE_BYTES} bytes, got {len(nonce)}")

    aesgcm = AESGCM(key)
    try:
        return aesgcm.decrypt(nonce, ct, None)
    except Exception as e:
        raise DecryptionError("Authentication tag mismatch — payload tampered or wrong key") from e


# ── AES-256-GCM with dict convenience ────────────────────────────────────────

def encrypt_dict(key: bytes, data: dict) -> EncryptedPayload:
    """Serialise a dict to JSON then encrypt."""
    return encrypt(key, json.dumps(data, separators=(",", ":")).encode())


def decrypt_dict(key: bytes, payload: EncryptedPayload) -> dict:
    """Decrypt and deserialise a dict."""
    return json.loads(decrypt(key, payload))


# ── Ed25519 signatures ────────────────────────────────────────────────────────

def generate_keypair() -> tuple[Ed25519PrivateKey, Ed25519PublicKey]:
    """Generate a fresh Ed25519 keypair."""
    sk = Ed25519PrivateKey.generate()
    return sk, sk.public_key()


def sign(private_key: Ed25519PrivateKey, message: bytes) -> bytes:
    """Sign a message with an Ed25519 private key. Returns 64-byte signature."""
    return private_key.sign(message)


def verify(public_key: Ed25519PublicKey, message: bytes, signature: bytes) -> bool:
    """Verify an Ed25519 signature. Returns True on success."""
    try:
        public_key.verify(signature, message)
        return True
    except InvalidSignature:
        return False


def public_key_hex(pub: Ed25519PublicKey) -> str:
    """Encode a public key to lowercase hex."""
    raw = pub.public_bytes(Encoding.Raw, PublicFormat.Raw)
    return raw.hex()


def signature_hex(sig: bytes) -> str:
    """Encode a signature to lowercase hex."""
    return sig.hex()


def public_key_from_hex(hex_str: str) -> Ed25519PublicKey:
    """Reconstruct an Ed25519PublicKey from a hex string."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey as _PK
    raw = bytes.fromhex(hex_str)
    from cryptography.hazmat.primitives.serialization import load_der_public_key
    # Use from_public_bytes if available, otherwise reconstruct via DER
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
    import struct
    # Raw Ed25519 key reconstruction
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    # The public_bytes_raw path
    sk_dummy = Ed25519PrivateKey.generate()
    # Load from raw bytes by reconstructing a SubjectPublicKeyInfo DER wrapper
    # ed25519 OID prefix
    der_prefix = bytes.fromhex("302a300506032b6570032100")
    der = der_prefix + raw
    from cryptography.hazmat.primitives.serialization import load_der_public_key
    return load_der_public_key(der)


# ── HKDF key derivation ───────────────────────────────────────────────────────

def derive_key(
    master: bytes,
    salt:   bytes,
    info:   bytes,
    length: int = AES_KEY_BYTES,
) -> bytes:
    """
    Derive a key from master secret using HKDF-SHA256.

    master — high-entropy input key material
    salt   — optional non-secret randomness
    info   — context label (e.g. b"organism-encryption-v1")
    length — output key length in bytes (default 32 for AES-256)
    """
    hkdf = HKDF(algorithm=SHA256(), length=length, salt=salt, info=info)
    return hkdf.derive(master)


# ── Hashing ───────────────────────────────────────────────────────────────────

def sha256_hex(data: bytes) -> str:
    """Return the hex-encoded SHA-256 hash of data."""
    return hashlib.sha256(data).hexdigest()


def blake2b_hex(data: bytes, digest_size: int = 32) -> str:
    """Return the hex-encoded BLAKE2b hash of data."""
    return hashlib.blake2b(data, digest_size=digest_size).hexdigest()


def hmac_sha256(key: bytes, message: bytes) -> bytes:
    """Compute HMAC-SHA256 and return 32 bytes."""
    return hmac.new(key, message, hashlib.sha256).digest()


# ── Random key generation ─────────────────────────────────────────────────────

def generate_aes_key() -> bytes:
    """Generate 32 cryptographically-secure random bytes for AES-256."""
    return os.urandom(AES_KEY_BYTES)


# ── OrganismCipher — wire message sealing ─────────────────────────────────────

@dataclass
class OrganismWireMessage:
    """
    Encrypted + signed organism wire message.

    All inter-node communication on the intelligence wire uses this envelope.
    The payload is AES-256-GCM encrypted; the whole message is Ed25519 signed.
    """
    id:           str
    sender_id:    str
    recipient_id: str
    payload_type: str
    nonce:        str           # from EncryptedPayload
    ciphertext:   str           # from EncryptedPayload (AES-256-GCM)
    signature:    str           # hex Ed25519 signature
    pub_key:      str           # hex Ed25519 verifying key
    timestamp:    int           # Unix milliseconds
    beat:         int           # organism heartbeat number
    ring:         str           # "Sovereign" | "Interface" | "Memory"

    def signing_bytes(self) -> bytes:
        """Bytes that are signed: id + sender + recipient + payload_type + ciphertext."""
        return (
            self.id           +
            self.sender_id    +
            self.recipient_id +
            self.payload_type +
            self.ciphertext
        ).encode()

    def verify_signature(self) -> bool:
        """Verify the embedded Ed25519 signature."""
        try:
            pub = public_key_from_hex(self.pub_key)
            sig = bytes.fromhex(self.signature)
            return verify(pub, self.signing_bytes(), sig)
        except Exception:
            return False

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "OrganismWireMessage":
        return cls(**d)

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, s: str) -> "OrganismWireMessage":
        return cls.from_dict(json.loads(s))


class OrganismCipher:
    """
    Factory for sealing and opening organism wire messages.

    Usage
    ─────
    sender   = OrganismCipher("agi-terminal",    "Sovereign", aes_key)
    receiver = OrganismCipher("organism-solver", "Sovereign", aes_key)

    msg      = sender.seal(b"tick-42", "SOLVER_TICK", "organism-solver")
    plain    = receiver.open(msg)
    """

    def __init__(
        self,
        node_id:  str,
        ring:     str,
        aes_key:  bytes,
    ) -> None:
        if len(aes_key) != AES_KEY_BYTES:
            raise EncryptionError(f"aes_key must be {AES_KEY_BYTES} bytes")
        self._node_id = node_id
        self._ring    = ring
        self._aes_key = aes_key
        self._sk, self._vk = generate_keypair()
        self._beat: int = 0

    def tick(self) -> None:
        """Advance the beat counter (call every 873 ms)."""
        self._beat += 1

    def seal(
        self,
        plaintext:    bytes,
        payload_type: str,
        recipient_id: str,
    ) -> OrganismWireMessage:
        """Encrypt and sign a plaintext payload."""
        msg_id = str(uuid.uuid4())
        enc    = encrypt(self._aes_key, plaintext)
        ts     = int(time.time() * 1000)

        # Sign: id + sender + recipient + type + ciphertext
        to_sign = (msg_id + self._node_id + recipient_id + payload_type + enc.ciphertext).encode()
        sig     = sign(self._sk, to_sign)

        return OrganismWireMessage(
            id           = msg_id,
            sender_id    = self._node_id,
            recipient_id = recipient_id,
            payload_type = payload_type,
            nonce        = enc.nonce,
            ciphertext   = enc.ciphertext,
            signature    = signature_hex(sig),
            pub_key      = public_key_hex(self._vk),
            timestamp    = ts,
            beat         = self._beat,
            ring         = self._ring,
        )

    def open(self, msg: OrganismWireMessage) -> bytes:
        """Verify the signature and decrypt the payload."""
        if not msg.verify_signature():
            raise SignatureError("Wire message signature verification failed")
        payload = EncryptedPayload(nonce=msg.nonce, ciphertext=msg.ciphertext)
        return decrypt(self._aes_key, payload)

    @property
    def node_id(self) -> str:
        return self._node_id

    @property
    def beat(self) -> int:
        return self._beat

    @property
    def public_key_hex_str(self) -> str:
        return public_key_hex(self._vk)
