package syn_test

import (
	"testing"

	orgcrypto "organism-gateway/internal/crypto"
	"organism-gateway/internal/syn"
)

func makeProxy(t *testing.T) *syn.SynProxy {
	t.Helper()
	key, err := orgcrypto.GenerateAESKey()
	if err != nil {
		t.Fatal(err)
	}
	return syn.NewSynProxy(key)
}

func TestSynBind_ImprinstsBinding(t *testing.T) {
	p := makeProxy(t)
	b, err := p.SynBind("HEART", "agi-terminal", "heart", []byte(`{"status":"alive"}`))
	if err != nil {
		t.Fatal(err)
	}
	if b.Label != "HEART" {
		t.Fatalf("expected label HEART, got %s", b.Label)
	}
	if b.RefreshCount != 0 {
		t.Fatalf("expected refresh_count=0, got %d", b.RefreshCount)
	}
}

func TestSynQuery_NotFound(t *testing.T) {
	p := makeProxy(t)
	_, err := p.SynQuery("GHOST")
	if err != syn.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestSynQuery_ReturnsBinding(t *testing.T) {
	p := makeProxy(t)
	p.SynBind("fleet", "fleet-cid", "fleet", []byte("snap"))
	b, err := p.SynQuery("fleet")
	if err != nil {
		t.Fatal(err)
	}
	if b.Label != "fleet" {
		t.Fatalf("expected fleet, got %s", b.Label)
	}
}

func TestSynRevoke_Removes(t *testing.T) {
	p := makeProxy(t)
	p.SynBind("ai", "ai-cid", "ai", []byte("{}"))
	if err := p.SynRevoke("ai"); err != nil {
		t.Fatal(err)
	}
	if _, err := p.SynQuery("ai"); err != syn.ErrNotFound {
		t.Fatal("expected ErrNotFound after revoke")
	}
}

func TestSynRevoke_NotFound(t *testing.T) {
	p := makeProxy(t)
	if err := p.SynRevoke("GHOST"); err != syn.ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestSynRevokeAll_ClearsAll(t *testing.T) {
	p := makeProxy(t)
	p.SynBind("A", "c1", "k1", []byte("{}"))
	p.SynBind("B", "c2", "k2", []byte("{}"))
	n := p.SynRevokeAll()
	if n != 2 {
		t.Fatalf("expected 2 removed, got %d", n)
	}
	if p.BindingCount() != 0 {
		t.Fatal("expected 0 bindings after revokeAll")
	}
}

func TestSynBind_Refresh_IncrementsCount(t *testing.T) {
	p := makeProxy(t)
	p.SynBind("nns", "nns-cid", "nns", []byte("snap1"))
	b, _ := p.SynBind("nns", "nns-cid", "nns", []byte("snap2"))
	if b.RefreshCount != 1 {
		t.Fatalf("expected refresh_count=1, got %d", b.RefreshCount)
	}
}

func TestBindingEncryptedAtRest(t *testing.T) {
	p := makeProxy(t)
	// Bind with sensitive data
	secret := []byte(`{"neuron_stake":999999}`)
	p.SynBind("secret", "cid", "key", secret)

	// Status should NOT expose raw_snapshot
	status := p.Status()
	if len(status) != 1 {
		t.Fatalf("expected 1 status entry, got %d", len(status))
	}
	// Status only returns metadata, never the raw snapshot
	if _, hasRaw := status[0]["raw_snapshot"]; hasRaw {
		t.Fatal("Status must not expose raw_snapshot")
	}
}

func TestSynStatus_ReturnMetadata(t *testing.T) {
	p := makeProxy(t)
	p.SynBind("X", "cx", "kx", []byte("{}"))
	status := p.Status()
	if len(status) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(status))
	}
	if status[0]["label"] != "X" {
		t.Fatalf("expected label X, got %v", status[0]["label"])
	}
}
