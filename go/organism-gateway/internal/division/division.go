// Package division implements the AI Division engine for the organism gateway.
//
// The AI Division manages autonomous teams that generate their own sovereign
// cycles, mint block boxes at five tiers, and scale on Fibonacci growth curves.
//
// Cycles ARE tokens.  The organism generates its own compute.  When deployed
// to ICP, we give our OWN cycles.  Zero ICP dependency.  We can always make
// more — just bring the engine up and give them.
//
// Block boxes are NOT just bronze.  Five tiers:
//   Bronze    — AI-auto-generated (students, onboarding)
//   Silver    — team-approved (knowledge, intelligence)
//   Gold      — division-sealed (governance, contracts)
//   Platinum  — organism-level (system upgrades, laws)
//   Sovereign — immutable core (constitution)
//
// Ring: Sovereign Ring | Go Gateway
package division

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"
)

// ── Constants ────────────────────────────────────────────────────────────────

const (
	HeartbeatMS = 873
	HeartbeatHz = 1000.0 / HeartbeatMS
	MinSlots    = 16
	PHI         = 1.618033988749895
)

// ── Block Box Tiers ──────────────────────────────────────────────────────────

type BlockBoxTier string

const (
	TierBronze    BlockBoxTier = "bronze"
	TierSilver    BlockBoxTier = "silver"
	TierGold      BlockBoxTier = "gold"
	TierPlatinum  BlockBoxTier = "platinum"
	TierSovereign BlockBoxTier = "sovereign"
)

var AllTiers = []BlockBoxTier{TierBronze, TierSilver, TierGold, TierPlatinum, TierSovereign}

type TierProperties struct {
	SealRounds    int
	CycleBudget   int
}

var TierProps = map[BlockBoxTier]TierProperties{
	TierBronze:    {SealRounds: 1, CycleBudget: 16},
	TierSilver:    {SealRounds: 2, CycleBudget: 32},
	TierGold:      {SealRounds: 3, CycleBudget: 48},
	TierPlatinum:  {SealRounds: 5, CycleBudget: 80},
	TierSovereign: {SealRounds: 8, CycleBudget: 128},
}

// ── Team Roles ───────────────────────────────────────────────────────────────

type TeamRole string

const (
	RoleSovereign    TeamRole = "sovereign"
	RoleIntelligence TeamRole = "intelligence"
	RoleFrontend     TeamRole = "frontend"
	RoleBackend      TeamRole = "backend"
	RoleEducation    TeamRole = "education"
)

var AllRoles = []TeamRole{RoleSovereign, RoleIntelligence, RoleFrontend, RoleBackend, RoleEducation}

// ── Fibonacci ────────────────────────────────────────────────────────────────

func Fibonacci(n int) uint64 {
	if n <= 0 {
		return 0
	}
	if n == 1 {
		return 1
	}
	a, b := uint64(0), uint64(1)
	for i := 2; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

type ScalingLevel struct {
	Level    int
	FibIndex int
	Capacity uint64
	Name     string
}

var ScalingLevels = []ScalingLevel{
	{0, 0, 0, "genesis"},
	{1, 1, 1, "seed"},
	{2, 7, 13, "micro"},
	{3, 12, 144, "school"},
	{4, 20, 6765, "department"},
	{5, 24, 46368, "institution"},
}

// ── PHX Token ────────────────────────────────────────────────────────────────

func phxSeal(payload []byte, key []byte) string {
	mac := hmac.New(sha256.New, key)
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}

// ── Cycle Token ──────────────────────────────────────────────────────────────

type CycleToken struct {
	EngineID   string   `json:"engine_id"`
	TeamRole   TeamRole `json:"team_role"`
	Beat       uint64   `json:"beat"`
	Slot       int      `json:"slot"`
	PHXSeal    string   `json:"phx_seal"`
	Autonomous bool     `json:"autonomous"`
}

// ── Block Box ────────────────────────────────────────────────────────────────

type BlockBox struct {
	BoxID       string       `json:"box_id"`
	Tier        BlockBoxTier `json:"tier"`
	PHXSeal     string       `json:"phx_seal"`
	MintedBy    string       `json:"minted_by"`
	TeamRole    TeamRole     `json:"team_role"`
	Beat        uint64       `json:"beat"`
	CycleBudget int          `json:"cycle_budget"`
	SealRounds  int          `json:"seal_rounds"`
	CreatedMs   int64        `json:"created_ms"`
}

// ── Cycle Engine ─────────────────────────────────────────────────────────────

type CycleEngine struct {
	mu            sync.Mutex
	EngineID      string
	TeamRole      TeamRole
	Slots         int
	Beat          uint64
	TotalTokens   uint64
	SurplusCycles uint64
	key           []byte
}

func NewCycleEngine(engineID string, role TeamRole, key []byte) *CycleEngine {
	return &CycleEngine{
		EngineID: engineID,
		TeamRole: role,
		Slots:    MinSlots,
		key:      key,
	}
}

func (e *CycleEngine) Tick() []CycleToken {
	e.mu.Lock()
	defer e.mu.Unlock()

	tokens := make([]CycleToken, e.Slots)
	for slot := 0; slot < e.Slots; slot++ {
		payload := fmt.Sprintf("%s:%d:%d", e.EngineID, e.Beat, slot)
		tokens[slot] = CycleToken{
			EngineID:   e.EngineID,
			TeamRole:   e.TeamRole,
			Beat:       e.Beat,
			Slot:       slot,
			PHXSeal:    phxSeal([]byte(payload), e.key),
			Autonomous: true,
		}
	}
	e.TotalTokens += uint64(e.Slots)
	e.SurplusCycles += uint64(e.Slots)
	e.Beat++
	return tokens
}

func (e *CycleEngine) ConsumeCycles(count uint64) uint64 {
	e.mu.Lock()
	defer e.mu.Unlock()
	if count > e.SurplusCycles {
		count = e.SurplusCycles
	}
	e.SurplusCycles -= count
	return count
}

func (e *CycleEngine) GenerateCycles(count uint64) uint64 {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.SurplusCycles += count
	return e.SurplusCycles
}

func (e *CycleEngine) FCPR() float64 {
	return float64(e.Slots) * HeartbeatHz
}

// ── Block Box Generator ──────────────────────────────────────────────────────

type BlockBoxGenerator struct {
	mu          sync.Mutex
	GeneratorID string
	TeamRole    TeamRole
	TotalMinted uint64
	MintedByTier map[BlockBoxTier]uint64
	beat        uint64
	key         []byte
}

func NewBlockBoxGenerator(genID string, role TeamRole, key []byte) *BlockBoxGenerator {
	return &BlockBoxGenerator{
		GeneratorID:  genID,
		TeamRole:     role,
		MintedByTier: make(map[BlockBoxTier]uint64),
		key:          key,
	}
}

func (g *BlockBoxGenerator) Mint(payload []byte, tier BlockBoxTier) BlockBox {
	g.mu.Lock()
	defer g.mu.Unlock()

	props := TierProps[tier]
	seal := phxSeal(payload, g.key)
	box := BlockBox{
		BoxID:       fmt.Sprintf("%s-%d", g.GeneratorID, g.beat),
		Tier:        tier,
		PHXSeal:     seal,
		MintedBy:    g.GeneratorID,
		TeamRole:    g.TeamRole,
		Beat:        g.beat,
		CycleBudget: props.CycleBudget,
		SealRounds:  props.SealRounds,
		CreatedMs:   time.Now().UnixMilli(),
	}
	g.beat++
	g.TotalMinted++
	g.MintedByTier[tier]++
	return box
}

// ── AI Team ──────────────────────────────────────────────────────────────────

type AITeam struct {
	TeamID    string
	Role      TeamRole
	Engine    *CycleEngine
	Generator *BlockBoxGenerator
	Level     int
	Capacity  uint64
}

func NewAITeam(role TeamRole, key []byte) *AITeam {
	teamKey := hmac.New(sha256.New, key)
	teamKey.Write([]byte(string(role)))
	derived := teamKey.Sum(nil)

	return &AITeam{
		TeamID:    fmt.Sprintf("team-%s", role),
		Role:      role,
		Engine:    NewCycleEngine(fmt.Sprintf("engine-%s", role), role, derived),
		Generator: NewBlockBoxGenerator(fmt.Sprintf("gen-%s", role), role, derived),
	}
}

func (t *AITeam) Tick() []CycleToken {
	return t.Engine.Tick()
}

func (t *AITeam) MintBlockBox(payload []byte, tier BlockBoxTier) BlockBox {
	return t.Generator.Mint(payload, tier)
}

func (t *AITeam) ScaleTo(level int) {
	if level >= 0 && level < len(ScalingLevels) {
		t.Level = level
		t.Capacity = ScalingLevels[level].Capacity
	}
}

// ── Division Manager ─────────────────────────────────────────────────────────

type DivisionManager struct {
	mu         sync.Mutex
	Teams      map[TeamRole]*AITeam
	GlobalBeat uint64
	Booted     bool
	key        []byte
}

func NewDivisionManager(key []byte) *DivisionManager {
	return &DivisionManager{
		Teams: make(map[TeamRole]*AITeam),
		key:   key,
	}
}

func (d *DivisionManager) Boot() {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.Booted {
		return
	}
	for _, role := range AllRoles {
		d.Teams[role] = NewAITeam(role, d.key)
	}
	d.Booted = true
}

func (d *DivisionManager) TickAll() uint64 {
	d.mu.Lock()
	defer d.mu.Unlock()
	for _, team := range d.Teams {
		team.Tick()
	}
	d.GlobalBeat++
	return d.GlobalBeat
}

func (d *DivisionManager) ScaleAll(level int) {
	d.mu.Lock()
	defer d.mu.Unlock()
	for _, team := range d.Teams {
		team.ScaleTo(level)
	}
}

func (d *DivisionManager) TotalTokens() uint64 {
	var total uint64
	for _, team := range d.Teams {
		total += team.Engine.TotalTokens
	}
	return total
}

func (d *DivisionManager) TotalBoxes() uint64 {
	var total uint64
	for _, team := range d.Teams {
		total += team.Generator.TotalMinted
	}
	return total
}

func (d *DivisionManager) TotalFCPR() float64 {
	var total float64
	for _, team := range d.Teams {
		total += team.Engine.FCPR()
	}
	return total
}
