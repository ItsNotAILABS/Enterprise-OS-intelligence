// Package syn provides the SYN Synapse Binding Engine proxy for the
// organism gateway.
//
// synBind  — fetch a snapshot from a remote node and store it locally
// synQuery — pure local read, no network
// synRevoke — destroy one binding
//
// Ring: Sovereign Ring | Go Gateway | Wire: intelligence-wire/syn
package syn

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	orgcrypto "organism-gateway/internal/crypto"
)

// ── Constants ─────────────────────────────────────────────────────────────────

const MaxBindings = 64

// ── Errors ─────────────────────────────────────────────────────────────────────

var (
	ErrMaxBindings = errors.New("MAX_BINDINGS reached")
	ErrNotFound    = errors.New("binding not found")
)

// ── SynBinding ────────────────────────────────────────────────────────────────

// SynBinding holds a single imprinted snapshot from a remote node.
type SynBinding struct {
	Label        string `json:"label"`
	CanisterID   string `json:"canister_id"`
	DataKey      string `json:"data_key"`
	RawSnapshot  string `json:"raw_snapshot"`
	Imprinted    int64  `json:"imprinted"`    // Unix ms
	Refreshed    int64  `json:"refreshed"`    // Unix ms
	RefreshCount int    `json:"refresh_count"`
}

// StalenessMs returns milliseconds since the last refresh.
func (b *SynBinding) StalenessMs() int64 {
	return nowMs() - b.Refreshed
}

// AgeMs returns milliseconds since first imprint.
func (b *SynBinding) AgeMs() int64 {
	return nowMs() - b.Imprinted
}

// ── EncryptedBinding ──────────────────────────────────────────────────────────

// EncryptedBinding stores an encrypted SynBinding alongside its HMAC tag.
// All snapshots at rest in the Go proxy are encrypted with the ring AES key.
type EncryptedBinding struct {
	Label     string                    `json:"label"`
	Encrypted *orgcrypto.EncryptedPayload `json:"encrypted"`
	Hash      string                    `json:"hash"` // SHA-256 of plaintext
}

// ── SynProxy ─────────────────────────────────────────────────────────────────

// SynProxy is the in-process SYN binding store for the organism gateway.
//
// All bindings are AES-256-GCM encrypted at rest.
type SynProxy struct {
	mu       sync.RWMutex
	bindings map[string]*EncryptedBinding
	aesKey   [32]byte
}

// NewSynProxy creates a SynProxy secured by the given 32-byte AES key.
func NewSynProxy(aesKey [32]byte) *SynProxy {
	return &SynProxy{
		bindings: make(map[string]*EncryptedBinding),
		aesKey:   aesKey,
	}
}

// SynBind imprints a snapshot from a remote node.
// In production, `fetchSnapshot` would call the ICP HTTP gateway.
// Here it accepts the snapshot bytes directly for offline use.
func (p *SynProxy) SynBind(label, canisterID, dataKey string, snapshot []byte) (*SynBinding, error) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if len(p.bindings) >= MaxBindings {
		if _, exists := p.bindings[label]; !exists {
			return nil, ErrMaxBindings
		}
	}

	now := nowMs()
	existing := p.bindings[label]
	imprinted := now
	refreshCount := 0
	if existing != nil {
		refreshCount = p.unsafeDecodeBinding(existing).RefreshCount + 1
		imprinted = p.unsafeDecodeBinding(existing).Imprinted
	}

	binding := &SynBinding{
		Label:        label,
		CanisterID:   canisterID,
		DataKey:      dataKey,
		RawSnapshot:  string(snapshot),
		Imprinted:    imprinted,
		Refreshed:    now,
		RefreshCount: refreshCount,
	}

	enc, err := p.encryptBinding(binding)
	if err != nil {
		return nil, fmt.Errorf("synBind encrypt: %w", err)
	}
	p.bindings[label] = enc
	return binding, nil
}

// SynQuery performs a pure local read and decrypts the binding.
// No network. No cycles. Instant.
func (p *SynProxy) SynQuery(label string) (*SynBinding, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	enc, ok := p.bindings[label]
	if !ok {
		return nil, ErrNotFound
	}
	b := p.unsafeDecodeBinding(enc)
	return b, nil
}

// SynRevoke destroys a binding. Data is gone; no recovery.
func (p *SynProxy) SynRevoke(label string) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if _, ok := p.bindings[label]; !ok {
		return ErrNotFound
	}
	delete(p.bindings, label)
	return nil
}

// SynRevokeAll deletes every binding. Nuclear.
func (p *SynProxy) SynRevokeAll() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	n := len(p.bindings)
	p.bindings = make(map[string]*EncryptedBinding)
	return n
}

// BindingCount returns the number of active bindings.
func (p *SynProxy) BindingCount() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return len(p.bindings)
}

// Status returns metadata for all bindings (without decrypted snapshots).
func (p *SynProxy) Status() []map[string]interface{} {
	p.mu.RLock()
	defer p.mu.RUnlock()

	result := make([]map[string]interface{}, 0, len(p.bindings))
	for _, enc := range p.bindings {
		b := p.unsafeDecodeBinding(enc)
		result = append(result, map[string]interface{}{
			"label":         b.Label,
			"canister_id":   b.CanisterID,
			"data_key":      b.DataKey,
			"refresh_count": b.RefreshCount,
			"staleness_ms":  b.StalenessMs(),
			"age_ms":        b.AgeMs(),
		})
	}
	return result
}

// ── Internal helpers ──────────────────────────────────────────────────────────

func (p *SynProxy) encryptBinding(b *SynBinding) (*EncryptedBinding, error) {
	data, err := json.Marshal(b)
	if err != nil {
		return nil, err
	}
	enc, err := orgcrypto.Encrypt(p.aesKey[:], data)
	if err != nil {
		return nil, err
	}
	return &EncryptedBinding{
		Label:     b.Label,
		Encrypted: enc,
		Hash:      orgcrypto.SHA256Hex(data),
	}, nil
}

// unsafeDecodeBinding decrypts a binding without acquiring the mutex.
// Must be called with the read or write lock held.
func (p *SynProxy) unsafeDecodeBinding(enc *EncryptedBinding) *SynBinding {
	data, err := orgcrypto.Decrypt(p.aesKey[:], enc.Encrypted)
	if err != nil {
		return &SynBinding{Label: enc.Label} // degraded mode
	}
	var b SynBinding
	_ = json.Unmarshal(data, &b)
	return &b
}

func nowMs() int64 {
	return time.Now().UnixMilli()
}
