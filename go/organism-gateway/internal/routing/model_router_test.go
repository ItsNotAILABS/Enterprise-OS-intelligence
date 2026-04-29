package routing_test

import (
	"testing"

	"organism-gateway/internal/routing"
)

func TestRoute_ReturnsModel(t *testing.T) {
	r := routing.NewModelRouter()
	result := r.Route(routing.Task{Type: routing.TaskReasoning, Priority: routing.PriorityHigh})
	if result.ModelID == "" {
		t.Fatal("expected a model to be routed")
	}
	if result.Score <= 0 {
		t.Fatal("score must be positive")
	}
}

func TestRoute_HasAlternatives(t *testing.T) {
	r := routing.NewModelRouter()
	result := r.Route(routing.Task{Type: routing.TaskCoding, Priority: routing.PriorityNormal})
	if len(result.Alternatives) == 0 {
		t.Fatal("expected at least one alternative")
	}
}

func TestCascadeFallback_ExcludesFailed(t *testing.T) {
	r := routing.NewModelRouter()
	task := routing.Task{Type: routing.TaskAnalysis, Priority: routing.PriorityCritical}
	first := r.Route(task)
	failed := map[string]bool{first.ModelID: true}
	fallback := r.CascadeFallback(task, failed)
	if fallback.ModelID == first.ModelID {
		t.Fatal("fallback must not return the same (failed) model")
	}
}

func TestRecordOutcome_UpdatesReputation(t *testing.T) {
	r := routing.NewModelRouter()
	task := routing.Task{Type: routing.TaskReasoning, Priority: routing.PriorityNormal}
	r.Route(task) // increments totalRouted so success_rate is meaningful
	for i := 0; i < 20; i++ {
		r.RecordOutcome("claude-4", true, 300)
		r.Route(task) // keep totalRouted growing alongside successes
	}
	m := r.Metrics()
	sr, _ := m["success_rate"].(float64)
	if sr <= 0 {
		t.Fatal("success_rate must be positive after recording successes")
	}
}

func TestRebalance_DoesNotPanic(t *testing.T) {
	r := routing.NewModelRouter()
	r.RecordOutcome("gpt-4o", true, 500)
	r.Rebalance() // must not panic
}

func TestPhiScore(t *testing.T) {
	s := routing.PhiScore(routing.PriorityCritical, 0.9, 0.8)
	if s <= 0 {
		t.Fatal("phi score must be positive")
	}
}

func Test40ModelsSeed(t *testing.T) {
	r := routing.NewModelRouter()
	if r.ModelCount() != 40 {
		t.Fatalf("expected 40 models, got %d", r.ModelCount())
	}
}
