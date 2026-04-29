/**
 * @medina/silver-canister — School-Level Sovereign System
 *
 * The Silver Canister is the school-level orchestration layer that controls
 * all Bronze Canisters (students) and manages the entire school system.
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                           SILVER CANISTER                                   │
 * │                     School-Level Sovereign System                           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │                                                                             │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
 * │  │   CHRONO    │  │   CEREBEX   │  │   NEXORIS   │  │  COGNOVEX   │        │
 * │  │ Audit Trail │  │  Analytics  │  │   Routing   │  │  Decisions  │        │
 * │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
 * │                                                                             │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │                        SUBSYSTEMS                                    │   │
 * │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
 * │  │  │ Curriculum  │  │Announcements│  │  Calendar   │                  │   │
 * │  │  │ Repository  │  │    Board    │  │  Academic   │                  │   │
 * │  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
 * │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
 * │  │  │  Resource   │  │   School    │  │  Student    │                  │   │
 * │  │  │  Inventory  │  │  Analytics  │  │  Services   │                  │   │
 * │  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
 * │  │  ┌─────────────┐                                                    │   │
 * │  │  │ Compliance  │                                                    │   │
 * │  │  │   Engine    │                                                    │   │
 * │  │  └─────────────┘                                                    │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │                                                                             │
 * │  ┌─────────────────────────────────────────────────────────────────────┐   │
 * │  │                      BRONZE CANISTERS                                │   │
 * │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
 * │  │  │Student 1│  │Student 2│  │Student 3│  │Student 4│  │  ...    │   │   │
 * │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │   │
 * │  └─────────────────────────────────────────────────────────────────────┘   │
 * │                                                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * Theory basis:
 *   Paper XV   — ASK III: school-level canister architecture
 *   Paper V    — LEGES ANIMAE: Behavioral Laws enforcement
 *   Paper XIX  — CIVITAS MERIDIANA: civic infrastructure layer
 *   Paper XX   — STIGMERGY: immutable pheromone trail (CHRONO)
 *   Paper X    — EXECUTIO UNIVERSALIS: query = act = learn = log
 *
 * SILVER CANISTER — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

// ═══════════════════════════════════════════════════════════════════════════
// Main Export: SilverCanister
// ═══════════════════════════════════════════════════════════════════════════

export { SilverCanister } from './silver-canister.js';

// ═══════════════════════════════════════════════════════════════════════════
// Subsystem Exports
// ═══════════════════════════════════════════════════════════════════════════

export { CurriculumRepository } from './curriculum-repository.js';
export { AnnouncementBoard } from './announcement-board.js';
export { AcademicCalendar } from './academic-calendar.js';
export { ResourceInventory } from './resource-inventory.js';
export { SchoolAnalytics } from './school-analytics.js';
export { StudentServices } from './student-services.js';
export { ComplianceEngine } from './compliance-engine.js';
