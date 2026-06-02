"""
test_encryption.py — Tests for Sovereign Encryption Engine

Covers:
  - AES-256-GCM encrypt/decrypt
  - Key validation and tamper detection
  - Ed25519 signing helpers
  - Organism wire sealing/opening
"""

import base64
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from encryption import (
    AES_KEY_BYTES,
    DecryptionError,
    EncryptionError,
    EncryptedPayload,
    OrganismCipher,
    OrganismWireMessage,
    SignatureError,
    decrypt,
    derive_key,
    encrypt,
    generate_aes_key,
    generate_keypair,
    public_key_from_hex,
    public_key_hex,
    sign,
    signature_hex,
    verify,
)


def test_aes_gcm_roundtrip():
    key = generate_aes_key()
    payload = encrypt(key, b"hello-world")
    assert isinstance(payload, EncryptedPayload)
    assert payload.nonce and payload.ciphertext

    plaintext = decrypt(key, payload)
    assert plaintext == b"hello-world"


def test_encrypt_rejects_wrong_key_length():
    with pytest.raises(EncryptionError):
        encrypt(b"x" * (AES_KEY_BYTES - 1), b"data")


def test_decrypt_rejects_wrong_key_length():
    payload = EncryptedPayload(nonce=base64.b64encode(b"x" * 12).decode(), ciphertext="")
    with pytest.raises(DecryptionError):
        decrypt(b"x" * (AES_KEY_BYTES - 1), payload)


def test_decrypt_detects_tampering():
    key = generate_aes_key()
    payload = encrypt(key, b"tamper-me")

    raw_ct = base64.b64decode(payload.ciphertext)
    tampered_ct = raw_ct[:-1] + bytes([raw_ct[-1] ^ 0x01])
    tampered = EncryptedPayload(
        nonce=payload.nonce,
        ciphertext=base64.b64encode(tampered_ct).decode(),
    )

    with pytest.raises(DecryptionError):
        decrypt(key, tampered)


def test_ed25519_sign_verify_helpers():
    sk, vk = generate_keypair()
    msg = b"hello-sign"
    sig = sign(sk, msg)
    assert verify(vk, msg, sig) is True
    assert verify(vk, msg + b"!", sig) is False

    vk2 = public_key_from_hex(public_key_hex(vk))
    assert verify(vk2, msg, sig) is True


def test_hkdf_derive_key_is_stable():
    master = b"m" * 64
    salt = b"s" * 16
    info = b"organism-encryption-v1"
    k1 = derive_key(master, salt, info)
    k2 = derive_key(master, salt, info)
    assert k1 == k2
    assert len(k1) == AES_KEY_BYTES


def test_organism_cipher_seal_open_roundtrip():
    key = generate_aes_key()
    sender = OrganismCipher("sender", "Sovereign", key)
    receiver = OrganismCipher("receiver", "Sovereign", key)

    sender.tick()
    msg = sender.seal(b"wire-payload", payload_type="UNIT_TEST", recipient_id="receiver")
    assert isinstance(msg, OrganismWireMessage)
    assert msg.beat == 1

    plaintext = receiver.open(msg)
    assert plaintext == b"wire-payload"


def test_organism_cipher_rejects_tampered_ciphertext():
    key = generate_aes_key()
    sender = OrganismCipher("sender", "Sovereign", key)
    receiver = OrganismCipher("receiver", "Sovereign", key)

    msg = sender.seal(b"wire-payload", payload_type="UNIT_TEST", recipient_id="receiver")
    d = msg.to_dict()
    d["ciphertext"] = d["ciphertext"][:-2] + "AA"
    tampered = OrganismWireMessage.from_dict(d)

    with pytest.raises(SignatureError):
        receiver.open(tampered)

