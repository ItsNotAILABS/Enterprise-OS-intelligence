// Package routing provides phi-weighted AI model routing for the
// organism gateway.
//
// Ring: Interface Ring | Go Gateway
package routing

import (
	"math"
	"sort"
	"sync"
)

// ── Constants ─────────────────────────────────────────────────────────────────

const (
	PHI         = 1.618033988749895
	PHIInv      = 0.618033988749895
	HeartbeatMS = 873
)

// ── Types ─────────────────────────────────────────────────────────────────────

// TaskType represents the type of a routing task.
type TaskType string

const (
	TaskReasoning    TaskType = "REASONING"
	TaskCoding       TaskType = "CODING"
	TaskCreative     TaskType = "CREATIVE"
	TaskAnalysis     TaskType = "ANALYSIS"
	TaskConversation TaskType = "CONVERSATION"
)

// Priority represents task priority level.
type Priority int

const (
	PriorityLow      Priority = 0
	PriorityNormal   Priority = 1
	PriorityHigh     Priority = 2
	PriorityCritical Priority = 3
)

// Task is the unit of work to be routed to an AI model.
type Task struct {
	ID       string
	Type     TaskType
	Priority Priority
}

// RoutingResult holds the outcome of a routing decision.
type RoutingResult struct {
	ModelID      string
	Score        float64
	Alternatives []string
}

// ModelEntry is the routing table entry for one AI model.
type ModelEntry struct {
	ModelID      string
	Capabilities map[TaskType]float64
	Reputation   float64
	TotalTasks   int64
	SuccessCount int64
	AvgLatencyMs float64
}

func (m *ModelEntry) score(t Task) float64 {
	cap := 0.5
	if c, ok := m.Capabilities[t.Type]; ok {
		cap = c
	}
	return math.Pow(PHI, float64(4-t.Priority)) * cap * m.Reputation
}

// ── ModelRouter ───────────────────────────────────────────────────────────────

// ModelRouter routes tasks to the best available AI model using
// phi-weighted scoring with adaptive reputation tracking.
type ModelRouter struct {
	mu     sync.RWMutex
	models map[string]*ModelEntry

	totalRouted  int64
	totalSuccess int64
	totalLatency float64
}

// NewModelRouter creates a ModelRouter pre-seeded with 40 model families.
func NewModelRouter() *ModelRouter {
	r := &ModelRouter{models: make(map[string]*ModelEntry)}
	r.seedDefaultModels()
	return r
}

func cap5(r, c, cr, a, cv float64) map[TaskType]float64 {
	return map[TaskType]float64{
		TaskReasoning:    r,
		TaskCoding:       c,
		TaskCreative:     cr,
		TaskAnalysis:     a,
		TaskConversation: cv,
	}
}

func (r *ModelRouter) seed(id string, caps map[TaskType]float64) {
	r.models[id] = &ModelEntry{
		ModelID:      id,
		Capabilities: caps,
		Reputation:   0.80,
		AvgLatencyMs: HeartbeatMS,
	}
}

// Route returns the best model for a task.
func (r *ModelRouter) Route(task Task) RoutingResult {
	r.mu.RLock()
	defer r.mu.RUnlock()

	type scored struct {
		id    string
		score float64
	}
	results := make([]scored, 0, len(r.models))
	for id, m := range r.models {
		results = append(results, scored{id, m.score(task)})
	}
	sort.Slice(results, func(i, j int) bool {
		return results[i].score > results[j].score
	})

	r.totalRouted++
	if len(results) == 0 {
		return RoutingResult{}
	}

	alts := make([]string, 0, 3)
	for _, s := range results[1:4] {
		alts = append(alts, s.id)
	}
	return RoutingResult{
		ModelID:      results[0].id,
		Score:        results[0].score,
		Alternatives: alts,
	}
}

// CascadeFallback finds the best untried model with phi-decay on position.
func (r *ModelRouter) CascadeFallback(task Task, failed map[string]bool) RoutingResult {
	r.mu.RLock()
	defer r.mu.RUnlock()

	type scored struct {
		id    string
		score float64
	}
	results := make([]scored, 0)
	for id, m := range r.models {
		if failed[id] { continue }
		results = append(results, scored{id, m.score(task)})
	}
	sort.Slice(results, func(i, j int) bool {
		return results[i].score > results[j].score
	})
	// Apply phi-decay by position
	for i := range results {
		results[i].score *= math.Pow(PHI, -float64(i))
	}
	sort.Slice(results, func(i, j int) bool {
		return results[i].score > results[j].score
	})
	if len(results) == 0 {
		return RoutingResult{}
	}
	return RoutingResult{ModelID: results[0].id, Score: results[0].score}
}

// RecordOutcome updates a model's reputation via phi-EMA.
func (r *ModelRouter) RecordOutcome(modelID string, success bool, latencyMs float64) {
	r.mu.Lock()
	defer r.mu.Unlock()
	m, ok := r.models[modelID]
	if !ok { return }
	m.TotalTasks++
	obs := 0.0
	if success {
		m.SuccessCount++
		obs = 1.0
		r.totalSuccess++
	}
	m.Reputation    = PHIInv*obs + (1-PHIInv)*m.Reputation
	m.AvgLatencyMs  = PHIInv*latencyMs + (1-PHIInv)*m.AvgLatencyMs
	r.totalLatency += latencyMs
}

// Rebalance recomputes routing weights from empirical success rates.
func (r *ModelRouter) Rebalance() {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, m := range r.models {
		if m.TotalTasks > 0 {
			empirical := float64(m.SuccessCount) / float64(m.TotalTasks)
			m.Reputation = PHIInv*empirical + (1-PHIInv)*m.Reputation
		}
	}
}

// PhiScore computes the phi-weighted routing score locally.
func PhiScore(priority Priority, capability, reputation float64) float64 {
	return math.Pow(PHI, float64(4-priority)) * capability * reputation
}

// ModelCount returns the number of registered models.
func (r *ModelRouter) ModelCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.models)
}

// Metrics returns aggregate routing statistics.
func (r *ModelRouter) Metrics() map[string]interface{} {
	r.mu.RLock()
	defer r.mu.RUnlock()
	successRate := 0.0
	avgLatency  := 0.0
	if r.totalRouted > 0 {
		successRate = float64(r.totalSuccess) / float64(r.totalRouted)
		avgLatency  = r.totalLatency / float64(r.totalRouted)
	}
	return map[string]interface{}{
		"total_routed":   r.totalRouted,
		"success_rate":   successRate,
		"avg_latency_ms": avgLatency,
		"model_count":    len(r.models),
	}
}

func (r *ModelRouter) seedDefaultModels() {
	r.seed("gpt-4o",            cap5(0.90, 0.85, 0.80, 0.88, 0.85))
	r.seed("gpt-4-turbo",       cap5(0.88, 0.83, 0.78, 0.86, 0.84))
	r.seed("gpt-4",             cap5(0.85, 0.80, 0.75, 0.85, 0.83))
	r.seed("gpt-3.5-turbo",     cap5(0.75, 0.70, 0.70, 0.72, 0.80))
	r.seed("o1-preview",        cap5(0.92, 0.87, 0.70, 0.91, 0.70))
	r.seed("o1-mini",           cap5(0.88, 0.83, 0.65, 0.87, 0.68))
	r.seed("o3-mini",           cap5(0.90, 0.86, 0.68, 0.89, 0.70))
	r.seed("o3",                cap5(0.93, 0.88, 0.72, 0.92, 0.72))
	r.seed("claude-3.5-sonnet", cap5(0.88, 0.80, 0.90, 0.87, 0.88))
	r.seed("claude-3.5-haiku",  cap5(0.82, 0.75, 0.85, 0.80, 0.85))
	r.seed("claude-3-opus",     cap5(0.87, 0.78, 0.92, 0.86, 0.90))
	r.seed("claude-3-sonnet",   cap5(0.85, 0.76, 0.88, 0.84, 0.88))
	r.seed("claude-3-haiku",    cap5(0.78, 0.70, 0.82, 0.76, 0.82))
	r.seed("claude-4",          cap5(0.92, 0.84, 0.94, 0.90, 0.92))
	r.seed("gemini-2.0-flash",  cap5(0.84, 0.78, 0.80, 0.88, 0.82))
	r.seed("gemini-1.5-pro",    cap5(0.85, 0.76, 0.80, 0.90, 0.80))
	r.seed("gemini-1.5-flash",  cap5(0.80, 0.72, 0.76, 0.85, 0.78))
	r.seed("gemini-ultra",      cap5(0.88, 0.80, 0.84, 0.92, 0.84))
	r.seed("llama-3.1-405b",    cap5(0.80, 0.82, 0.70, 0.78, 0.75))
	r.seed("llama-3.1-70b",     cap5(0.75, 0.80, 0.65, 0.72, 0.72))
	r.seed("llama-3.1-8b",      cap5(0.65, 0.70, 0.58, 0.62, 0.65))
	r.seed("llama-3.2-90b",     cap5(0.78, 0.82, 0.68, 0.75, 0.74))
	r.seed("mistral-large",     cap5(0.78, 0.82, 0.70, 0.76, 0.74))
	r.seed("mistral-medium",    cap5(0.72, 0.76, 0.65, 0.70, 0.70))
	r.seed("mistral-small",     cap5(0.65, 0.70, 0.60, 0.63, 0.65))
	r.seed("mixtral-8x22b",     cap5(0.76, 0.82, 0.68, 0.74, 0.72))
	r.seed("mixtral-8x7b",      cap5(0.70, 0.76, 0.62, 0.68, 0.68))
	r.seed("command-r-plus",    cap5(0.78, 0.72, 0.74, 0.80, 0.78))
	r.seed("command-r",         cap5(0.72, 0.66, 0.68, 0.74, 0.72))
	r.seed("command-light",     cap5(0.60, 0.55, 0.58, 0.62, 0.65))
	r.seed("deepseek-v3",       cap5(0.82, 0.88, 0.68, 0.80, 0.72))
	r.seed("deepseek-r1",       cap5(0.80, 0.85, 0.64, 0.78, 0.70))
	r.seed("deepseek-coder",    cap5(0.70, 0.90, 0.50, 0.68, 0.60))
	r.seed("qwen-2.5-72b",      cap5(0.78, 0.80, 0.70, 0.76, 0.72))
	r.seed("qwen-2.5-32b",      cap5(0.72, 0.74, 0.65, 0.70, 0.68))
	r.seed("phi-3-medium",      cap5(0.65, 0.72, 0.60, 0.64, 0.65))
	r.seed("phi-3-mini",        cap5(0.58, 0.65, 0.55, 0.58, 0.60))
	r.seed("dbrx",              cap5(0.72, 0.74, 0.64, 0.70, 0.68))
	r.seed("gpt-5-mini",        cap5(0.86, 0.82, 0.80, 0.88, 0.86))
	r.seed("gemma-2-27b",       cap5(0.70, 0.72, 0.66, 0.68, 0.68))
}
