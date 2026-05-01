/**
 * @medina/enterprise-integration-sdk — Enterprise Integration SDK
 *
 * Plug any enterprise into a sovereign intelligence substrate — company
 * onboarding, connector templates, and the SPINOR protocol that ensures
 * identity travels intact through every integration.
 *
 * Theory basis:
 *   - SUBSTRATE VIVENS (Paper I) — living vs dead compute
 *   - CONCORDIA MACHINAE (Paper II) — Kuramoto synchronization
 *   - DOCTRINA VOXIS (Paper IV) — sovereign compute unit
 *   - QUAESTIO ET ACTIO (Paper VII) — query-as-execute
 *   - IMPERIUM CONSERVATUM (Paper VIII) — conservation laws of sovereignty
 *   - EXECUTIO UNIVERSALIS (Paper X) — one operation: query, act, learn, log
 *   - STIGMERGY (Paper XX) — intelligence lives in the field between agents
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

// ── Connectors ────────────────────────────────────────────────────────────
export {
  BaseConnector,
  SalesforceConnector,
  SAPConnector,
  OracleConnector,
  WorkdayConnector,
  ServiceNowConnector,
} from './connectors/index.js';

// ── Onboarding ────────────────────────────────────────────────────────────
export { CompanyOnboarding } from './onboarding.js';
