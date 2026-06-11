package division

import "testing"

func BenchmarkCycleEngineTick(b *testing.B) {
	engine := NewCycleEngine("engine-bench", RoleSovereign, []byte("bench-key"))
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = engine.Tick()
	}
}

func BenchmarkBlockBoxMint(b *testing.B) {
	gen := NewBlockBoxGenerator("gen-bench", RoleBackend, []byte("bench-key"))
	payload := []byte("payload")
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = gen.Mint(payload, TierGold)
	}
}

