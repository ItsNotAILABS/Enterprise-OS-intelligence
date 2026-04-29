package crypto_test

import (
	"testing"

	orgcrypto "organism-gateway/internal/crypto"
)

func TestAESGCMRoundtrip(t *testing.T) {
	key, err := orgcrypto.GenerateAESKey()
	if err != nil {
		t.Fatal(err)
	}
	msg := []byte("The organism heartbeat never stops.")
	enc, err := orgcrypto.Encrypt(key[:], msg)
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}
	dec, err := orgcrypto.Decrypt(key[:], enc)
	if err != nil {
		t.Fatalf("decrypt: %v", err)
	}
	if string(dec) != string(msg) {
		t.Fatalf("expected %q, got %q", msg, dec)
	}
}

func TestAESGCMWrongKeyFails(t *testing.T) {
	k1, _ := orgcrypto.GenerateAESKey()
	k2, _ := orgcrypto.GenerateAESKey()
	enc, _ := orgcrypto.Encrypt(k1[:], []byte("secret"))
	_, err  := orgcrypto.Decrypt(k2[:], enc)
	if err == nil {
		t.Fatal("expected decryption failure with wrong key")
	}
}

func TestAESGCMTamperedCiphertextFails(t *testing.T) {
	key, _ := orgcrypto.GenerateAESKey()
	enc, _ := orgcrypto.Encrypt(key[:], []byte("tamper me"))
	// break ciphertext
	enc.Ciphertext = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="
	_, err := orgcrypto.Decrypt(key[:], enc)
	if err == nil {
		t.Fatal("expected tampered ciphertext to fail")
	}
}

func TestEd25519SignVerify(t *testing.T) {
	pub, priv, err := orgcrypto.GenerateKeypair()
	if err != nil {
		t.Fatal(err)
	}
	msg := []byte("sovereign organism")
	sig := orgcrypto.Sign(priv, msg)
	if !orgcrypto.Verify(pub, msg, sig) {
		t.Fatal("signature verification failed")
	}
}

func TestEd25519WrongMessageFails(t *testing.T) {
	pub, priv, _ := orgcrypto.GenerateKeypair()
	sig := orgcrypto.Sign(priv, []byte("original"))
	if orgcrypto.Verify(pub, []byte("tampered"), sig) {
		t.Fatal("expected verification to fail for tampered message")
	}
}

func TestHKDFDeterministic(t *testing.T) {
	k1, err1 := orgcrypto.DeriveKey([]byte("master"), []byte("salt"), []byte("info"))
	k2, err2 := orgcrypto.DeriveKey([]byte("master"), []byte("salt"), []byte("info"))
	if err1 != nil || err2 != nil {
		t.Fatal("DeriveKey errors")
	}
	if k1 != k2 {
		t.Fatal("HKDF not deterministic")
	}
}

func TestHKDFDifferentInfoDiffers(t *testing.T) {
	k1, _ := orgcrypto.DeriveKey([]byte("master"), []byte("salt"), []byte("info-a"))
	k2, _ := orgcrypto.DeriveKey([]byte("master"), []byte("salt"), []byte("info-b"))
	if k1 == k2 {
		t.Fatal("HKDF with different info must produce different keys")
	}
}

func TestSHA256Hex(t *testing.T) {
	h1 := orgcrypto.SHA256Hex([]byte("hello"))
	h2 := orgcrypto.SHA256Hex([]byte("hello"))
	if h1 != h2 {
		t.Fatal("SHA256Hex not deterministic")
	}
	if len(h1) != 64 {
		t.Fatalf("expected 64 hex chars, got %d", len(h1))
	}
}

func TestConstantTimeEqual(t *testing.T) {
	a := []byte("organism")
	b := []byte("organism")
	c := []byte("other")
	if !orgcrypto.ConstantTimeEqual(a, b) {
		t.Fatal("equal slices should be equal")
	}
	if orgcrypto.ConstantTimeEqual(a, c) {
		t.Fatal("different slices should not be equal")
	}
}
