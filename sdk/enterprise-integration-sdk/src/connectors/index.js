/**
 * Enterprise Connectors — SPINOR Protocol Integrations
 *
 * Re-exports all enterprise connectors. Each connector implements the SPINOR
 * protocol: identity travels intact through the integration; every action is
 * logged to CHRONO; CEREBEX world model updates with each data event.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

export { BaseConnector } from './base-connector.js';
export { SalesforceConnector } from './salesforce.js';
export { SAPConnector } from './sap.js';
export { OracleConnector } from './oracle.js';
export { WorkdayConnector } from './workday.js';
export { ServiceNowConnector } from './servicenow.js';
