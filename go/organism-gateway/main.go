// main.go — Organism Gateway HTTP Server
//
// Exposes the organism intelligence substrate as an HTTP/JSON API.
// All endpoints are encrypted in transit (use TLS in production).
//
// Routes
// ──────
//   GET  /health              — liveness check
//   POST /syn/bind            — imprint a SYN binding
//   GET  /syn/query?label=X   — query a binding (local, instant)
//   POST /syn/revoke          — revoke a binding
//   POST /syn/revoke-all      — nuclear revoke all
//   GET  /syn/status          — list all binding metadata
//   POST /route               — phi-weighted model routing
//   POST /route/fallback      — cascade fallback routing
//   POST /route/outcome       — record routing outcome
//   GET  /metrics             — aggregate gateway metrics
//
// Ring: Interface Ring | Go Gateway

package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	orgcrypto "organism-gateway/internal/crypto"
	"organism-gateway/internal/routing"
	"organism-gateway/internal/syn"
)

// ── Server ────────────────────────────────────────────────────────────────────

type Server struct {
	router   *routing.ModelRouter
	synProxy *syn.SynProxy
	aesKey   [32]byte
	startAt  time.Time
}

func NewServer() (*Server, error) {
	// Derive the ring AES key from environment variables (or a default for dev)
	masterSecret := envOr("ORGANISM_MASTER_SECRET", "dev-master-secret-change-in-prod")
	salt         := envOr("ORGANISM_KEY_SALT",      "organism-gateway-salt-v1")
	aesKey, err  := orgcrypto.DeriveKey([]byte(masterSecret), []byte(salt), []byte("organism-aes-key-v1"))
	if err != nil {
		return nil, fmt.Errorf("derive AES key: %w", err)
	}

	return &Server{
		router:   routing.NewModelRouter(),
		synProxy: syn.NewSynProxy(aesKey),
		aesKey:   aesKey,
		startAt:  time.Now(),
	}, nil
}

// ── Handlers ──────────────────────────────────────────────────────────────────

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]interface{}{
		"status":    "alive",
		"uptime_ms": time.Since(s.startAt).Milliseconds(),
		"models":    s.router.ModelCount(),
		"bindings":  s.synProxy.BindingCount(),
		"timestamp": time.Now().UnixMilli(),
	})
}

// POST /syn/bind  {"label":"HEART","canister_id":"...","data_key":"...","snapshot":"..."}
func (s *Server) handleSynBind(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Label      string `json:"label"`
		CanisterID string `json:"canister_id"`
		DataKey    string `json:"data_key"`
		Snapshot   string `json:"snapshot"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, "invalid JSON: "+err.Error())
		return
	}
	if req.Label == "" || req.CanisterID == "" || req.DataKey == "" {
		writeErr(w, 400, "label, canister_id and data_key are required")
		return
	}
	snapshot := req.Snapshot
	if snapshot == "" {
		snapshot = fmt.Sprintf(`{"canister_id":%q,"data_key":%q,"ts":%d}`,
			req.CanisterID, req.DataKey, time.Now().UnixMilli())
	}
	binding, err := s.synProxy.SynBind(req.Label, req.CanisterID, req.DataKey, []byte(snapshot))
	if err != nil {
		writeErr(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]interface{}{
		"ok":            true,
		"label":         binding.Label,
		"refresh_count": binding.RefreshCount,
		"imprinted":     binding.Imprinted,
		"refreshed":     binding.Refreshed,
	})
}

// GET /syn/query?label=X
func (s *Server) handleSynQuery(w http.ResponseWriter, r *http.Request) {
	label := r.URL.Query().Get("label")
	if label == "" {
		writeErr(w, 400, "label query parameter is required")
		return
	}
	binding, err := s.synProxy.SynQuery(label)
	if err != nil {
		writeErr(w, 404, "not found: "+label)
		return
	}
	writeJSON(w, 200, map[string]interface{}{
		"label":         binding.Label,
		"canister_id":   binding.CanisterID,
		"data_key":      binding.DataKey,
		"raw_snapshot":  binding.RawSnapshot,
		"refresh_count": binding.RefreshCount,
		"staleness_ms":  binding.StalenessMs(),
		"age_ms":        binding.AgeMs(),
	})
}

// POST /syn/revoke  {"label":"HEART"}
func (s *Server) handleSynRevoke(w http.ResponseWriter, r *http.Request) {
	var req struct{ Label string `json:"label"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	if err := s.synProxy.SynRevoke(req.Label); err != nil {
		writeErr(w, 404, err.Error())
		return
	}
	writeJSON(w, 200, map[string]interface{}{"ok": true, "revoked": req.Label})
}

// POST /syn/revoke-all
func (s *Server) handleSynRevokeAll(w http.ResponseWriter, r *http.Request) {
	count := s.synProxy.SynRevokeAll()
	writeJSON(w, 200, map[string]interface{}{"ok": true, "revoked": count})
}

// GET /syn/status
func (s *Server) handleSynStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, s.synProxy.Status())
}

// POST /route  {"task_type":"CODING","priority":3}
func (s *Server) handleRoute(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID       string `json:"id"`
		TaskType string `json:"task_type"`
		Priority int    `json:"priority"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	task := routing.Task{
		ID:       req.ID,
		Type:     routing.TaskType(req.TaskType),
		Priority: routing.Priority(req.Priority),
	}
	result := s.router.Route(task)
	writeJSON(w, 200, map[string]interface{}{
		"model_id":     result.ModelID,
		"score":        result.Score,
		"alternatives": result.Alternatives,
	})
}

// POST /route/fallback  {"task_type":"CODING","priority":3,"failed":["gpt-4o"]}
func (s *Server) handleRouteFallback(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID       string   `json:"id"`
		TaskType string   `json:"task_type"`
		Priority int      `json:"priority"`
		Failed   []string `json:"failed"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	task := routing.Task{
		ID:       req.ID,
		Type:     routing.TaskType(req.TaskType),
		Priority: routing.Priority(req.Priority),
	}
	failed := make(map[string]bool)
	for _, f := range req.Failed { failed[f] = true }

	result := s.router.CascadeFallback(task, failed)
	writeJSON(w, 200, map[string]interface{}{
		"model_id": result.ModelID,
		"score":    result.Score,
	})
}

// POST /route/outcome  {"model_id":"gpt-4o","success":true,"latency_ms":320}
func (s *Server) handleRouteOutcome(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ModelID   string  `json:"model_id"`
		Success   bool    `json:"success"`
		LatencyMs float64 `json:"latency_ms"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, 400, err.Error())
		return
	}
	s.router.RecordOutcome(req.ModelID, req.Success, req.LatencyMs)
	writeJSON(w, 200, map[string]interface{}{"ok": true})
}

// GET /metrics
func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	m := s.router.Metrics()
	m["uptime_ms"]  = time.Since(s.startAt).Milliseconds()
	m["bindings"]   = s.synProxy.BindingCount()
	writeJSON(w, 200, m)
}

// ── Router setup ──────────────────────────────────────────────────────────────

func (s *Server) routes() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health",          s.handleHealth)
	mux.HandleFunc("POST /syn/bind",        s.handleSynBind)
	mux.HandleFunc("GET /syn/query",        s.handleSynQuery)
	mux.HandleFunc("POST /syn/revoke",      s.handleSynRevoke)
	mux.HandleFunc("POST /syn/revoke-all",  s.handleSynRevokeAll)
	mux.HandleFunc("GET /syn/status",       s.handleSynStatus)
	mux.HandleFunc("POST /route",           s.handleRoute)
	mux.HandleFunc("POST /route/fallback",  s.handleRouteFallback)
	mux.HandleFunc("POST /route/outcome",   s.handleRouteOutcome)
	mux.HandleFunc("GET /metrics",          s.handleMetrics)
	return mux
}

// ── Main ──────────────────────────────────────────────────────────────────────

func main() {
	srv, err := NewServer()
	if err != nil {
		log.Fatalf("server init: %v", err)
	}

	addr := envOr("ORGANISM_ADDR", ":8873") // 8873 — echoes the 873 ms heartbeat

	httpSrv := &http.Server{
		Addr:         addr,
		Handler:      srv.routes(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS13,
		},
	}

	log.Printf("Organism Gateway listening on %s", addr)
	log.Printf("Models pre-seeded: %d", srv.router.ModelCount())
	log.Printf("AES key derived from ORGANISM_MASTER_SECRET")

	// In production: httpSrv.ListenAndServeTLS(certFile, keyFile)
	// For dev, plain HTTP:
	if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen: %v", err)
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
