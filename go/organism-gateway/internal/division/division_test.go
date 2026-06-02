package division

import (
	"testing"
)

func TestFibonacci(t *testing.T) {
	tests := []struct {
		n    int
		want uint64
	}{
		{-1, 0},
		{0, 0},
		{1, 1},
		{2, 1},
		{3, 2},
		{7, 13},
		{12, 144},
	}
	for _, tt := range tests {
		if got := Fibonacci(tt.n); got != tt.want {
			t.Fatalf("Fibonacci(%d)=%d want %d", tt.n, got, tt.want)
		}
	}
}

func TestCycleEngineTickMintsDeterministicTokens(t *testing.T) {
	key := []byte("unit-test-key")
	engine := NewCycleEngine("engine-test", RoleSovereign, key)

	tokens0 := engine.Tick()
	if len(tokens0) != MinSlots {
		t.Fatalf("Tick() minted %d tokens, want %d", len(tokens0), MinSlots)
	}
	if engine.Beat != 1 {
		t.Fatalf("Beat=%d want 1", engine.Beat)
	}
	if engine.TotalTokens != uint64(MinSlots) {
		t.Fatalf("TotalTokens=%d want %d", engine.TotalTokens, MinSlots)
	}
	if engine.SurplusCycles != uint64(MinSlots) {
		t.Fatalf("SurplusCycles=%d want %d", engine.SurplusCycles, MinSlots)
	}

	// Same engine state, same seal for same slot+beat
	payload := []byte("engine-test:0:0")
	wantSeal := phxSeal(payload, key)
	if tokens0[0].PHXSeal != wantSeal {
		t.Fatalf("PHXSeal=%q want %q", tokens0[0].PHXSeal, wantSeal)
	}
	if tokens0[0].Slot != 0 || tokens0[0].Beat != 0 {
		t.Fatalf("token0 slot/beat=%d/%d want 0/0", tokens0[0].Slot, tokens0[0].Beat)
	}

	tokens1 := engine.Tick()
	if tokens1[0].Beat != 1 {
		t.Fatalf("token beat=%d want 1", tokens1[0].Beat)
	}
	if engine.Beat != 2 {
		t.Fatalf("Beat=%d want 2", engine.Beat)
	}
}

func TestCycleEngineConsumeAndGenerateCycles(t *testing.T) {
	engine := NewCycleEngine("engine-test", RoleSovereign, []byte("k"))
	engine.Tick()

	if got := engine.ConsumeCycles(1); got != 1 {
		t.Fatalf("ConsumeCycles(1)=%d want 1", got)
	}
	if engine.SurplusCycles != uint64(MinSlots-1) {
		t.Fatalf("SurplusCycles=%d want %d", engine.SurplusCycles, MinSlots-1)
	}

	// Consuming more than available clamps to available.
	got := engine.ConsumeCycles(9999)
	if got != uint64(MinSlots-1) {
		t.Fatalf("ConsumeCycles clamp=%d want %d", got, MinSlots-1)
	}
	if engine.SurplusCycles != 0 {
		t.Fatalf("SurplusCycles=%d want 0", engine.SurplusCycles)
	}

	engine.GenerateCycles(10)
	if engine.SurplusCycles != 10 {
		t.Fatalf("GenerateCycles SurplusCycles=%d want 10", engine.SurplusCycles)
	}
}

func TestBlockBoxGeneratorMintUsesTierProperties(t *testing.T) {
	key := []byte("unit-test-key")
	gen := NewBlockBoxGenerator("gen-test", RoleBackend, key)

	box := gen.Mint([]byte("payload"), TierGold)
	if box.Tier != TierGold {
		t.Fatalf("Tier=%s want %s", box.Tier, TierGold)
	}
	props := TierProps[TierGold]
	if box.CycleBudget != props.CycleBudget || box.SealRounds != props.SealRounds {
		t.Fatalf("props mismatch: budget=%d/%d rounds=%d/%d", box.CycleBudget, props.CycleBudget, box.SealRounds, props.SealRounds)
	}
	if box.PHXSeal == "" {
		t.Fatalf("PHXSeal should not be empty")
	}
	if gen.TotalMinted != 1 {
		t.Fatalf("TotalMinted=%d want 1", gen.TotalMinted)
	}
	if gen.MintedByTier[TierGold] != 1 {
		t.Fatalf("MintedByTier[%s]=%d want 1", TierGold, gen.MintedByTier[TierGold])
	}
}

func TestDivisionManagerBootAndTickAll(t *testing.T) {
	d := NewDivisionManager([]byte("k"))
	d.Boot()
	if !d.Booted {
		t.Fatalf("Booted=false want true")
	}
	if len(d.Teams) != len(AllRoles) {
		t.Fatalf("Teams=%d want %d", len(d.Teams), len(AllRoles))
	}

	prevBeat := d.GlobalBeat
	newBeat := d.TickAll()
	if newBeat != prevBeat+1 {
		t.Fatalf("TickAll beat=%d want %d", newBeat, prevBeat+1)
	}
	if d.TotalTokens() == 0 {
		t.Fatalf("expected tokens after TickAll")
	}
}

