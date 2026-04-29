// Package crypto provides AES-256-GCM authenticated encryption and
// Ed25519 digital signatures for the organism gateway.
//
// Only the Go standard library is used — no third-party dependencies.
//
// Ring: Sovereign Ring | Go Gateway
package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"io"

	"golang.org/x/crypto/hkdf"
)

// ── Errors ────────────────────────────────────────────────────────────────────

var (
	ErrEncryption     = errors.New("encryption failed")
	ErrDecryption     = errors.New("decryption failed: authentication tag mismatch")
	ErrInvalidNonce   = errors.New("invalid nonce: must be 12 bytes")
	ErrInvalidKey     = errors.New("invalid key: must be 32 bytes")
	ErrInvalidSig     = errors.New("invalid signature")
	ErrKeyDerivation  = errors.New("key derivation failed")
)

// ── EncryptedPayload ──────────────────────────────────────────────────────────

// EncryptedPayload holds the base64-encoded nonce and ciphertext+tag
// produced by AES-256-GCM encryption.
type EncryptedPayload struct {
	Nonce      string `json:"nonce"`      // 12-byte random nonce, base64
	Ciphertext string `json:"ciphertext"` // ciphertext + 16-byte GCM tag, base64
}

// ── AES-256-GCM ───────────────────────────────────────────────────────────────

// Encrypt encrypts plaintext with AES-256-GCM using the provided 32-byte key.
// A random 12-byte nonce is generated internally.
func Encrypt(key []byte, plaintext []byte) (*EncryptedPayload, error) {
	if len(key) != 32 {
		return nil, ErrInvalidKey
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, ErrEncryption
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, ErrEncryption
	}

	nonce := make([]byte, gcm.NonceSize()) // 12 bytes
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, ErrEncryption
	}

	ct := gcm.Seal(nil, nonce, plaintext, nil)
	return &EncryptedPayload{
		Nonce:      base64.StdEncoding.EncodeToString(nonce),
		Ciphertext: base64.StdEncoding.EncodeToString(ct),
	}, nil
}

// Decrypt decrypts an EncryptedPayload using AES-256-GCM.
// Returns the original plaintext or ErrDecryption if the tag is invalid.
func Decrypt(key []byte, payload *EncryptedPayload) ([]byte, error) {
	if len(key) != 32 {
		return nil, ErrInvalidKey
	}
	nonce, err := base64.StdEncoding.DecodeString(payload.Nonce)
	if err != nil || len(nonce) != 12 {
		return nil, ErrInvalidNonce
	}
	ct, err := base64.StdEncoding.DecodeString(payload.Ciphertext)
	if err != nil {
		return nil, ErrDecryption
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, ErrDecryption
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, ErrDecryption
	}

	plaintext, err := gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return nil, ErrDecryption
	}
	return plaintext, nil
}

// ── Ed25519 ───────────────────────────────────────────────────────────────────

// GenerateKeypair generates a fresh Ed25519 keypair.
func GenerateKeypair() (ed25519.PublicKey, ed25519.PrivateKey, error) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	return pub, priv, err
}

// Sign signs a message with the given Ed25519 private key.
func Sign(priv ed25519.PrivateKey, message []byte) []byte {
	return ed25519.Sign(priv, message)
}

// Verify verifies an Ed25519 signature.
func Verify(pub ed25519.PublicKey, message, sig []byte) bool {
	return ed25519.Verify(pub, message, sig)
}

// PubKeyHex encodes an Ed25519 public key to lowercase hex.
func PubKeyHex(pub ed25519.PublicKey) string {
	return hex.EncodeToString(pub)
}

// SigHex encodes a signature to lowercase hex.
func SigHex(sig []byte) string {
	return hex.EncodeToString(sig)
}

// ── HKDF key derivation ───────────────────────────────────────────────────────

// DeriveKey derives a 32-byte AES key using HKDF-SHA256.
//
//   master — high-entropy input key material
//   salt   — optional non-secret randomness
//   info   — context label (e.g. []byte("organism-encryption-v1"))
func DeriveKey(master, salt, info []byte) ([32]byte, error) {
	r := hkdf.New(sha256.New, master, salt, info)
	var key [32]byte
	if _, err := io.ReadFull(r, key[:]); err != nil {
		return key, ErrKeyDerivation
	}
	return key, nil
}

// ── SHA-256 hash ──────────────────────────────────────────────────────────────

// SHA256Hex returns the hex-encoded SHA-256 hash of data.
func SHA256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

// ── Random key generation ─────────────────────────────────────────────────────

// GenerateAESKey returns 32 cryptographically secure random bytes.
func GenerateAESKey() ([32]byte, error) {
	var key [32]byte
	_, err := io.ReadFull(rand.Reader, key[:])
	return key, err
}

// ── Constant-time comparison ─────────────────────────────────────────────────

// ConstantTimeEqual compares two byte slices in constant time.
func ConstantTimeEqual(a, b []byte) bool {
	return subtle.ConstantTimeCompare(a, b) == 1
}
