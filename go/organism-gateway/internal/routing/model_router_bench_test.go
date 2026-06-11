package routing

import "testing"

func BenchmarkModelRouterRoute(b *testing.B) {
	r := NewModelRouter()
	task := Task{ID: "bench", Type: TaskReasoning, Priority: PriorityHigh}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.Route(task)
	}
}

func BenchmarkModelRouterCascadeFallback(b *testing.B) {
	r := NewModelRouter()
	task := Task{ID: "bench", Type: TaskAnalysis, Priority: PriorityCritical}
	failed := map[string]bool{
		"gpt-4o":      true,
		"gpt-4-turbo": true,
		"gpt-4.1":     true,
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = r.CascadeFallback(task, failed)
	}
}

