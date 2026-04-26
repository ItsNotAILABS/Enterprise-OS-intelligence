/**
 * @medina/enterprise-integration-sdk — v1.0.0
 *
 * Plug any enterprise into a sovereign intelligence substrate.
 * Company onboarding, 22 connector templates, campaign management,
 * multi-channel messaging, and export pipelines.
 */

export { CompanyOnboarding } from './onboarding.js';

export {
  BaseConnector,
  SalesforceConnector,
  SAPConnector,
  OracleConnector,
  WorkdayConnector,
  ServiceNowConnector,
  NetSuiteConnector,
  QuickBooksConnector,
  Microsoft365Connector,
  JiraConnector,
  GitHubConnector,
  PlaidConnector,
  DocuSignConnector,
  ZendeskConnector,
  AWSConnector,
  AzureConnector,
  GCPConnector,
  GoogleConnector,
  SlackConnector,
  HubSpotConnector,
  StripeConnector,
  TwilioConnector,
  ShopifyConnector,
} from './connectors/index.js';

export { CampaignManager } from './campaign-manager.js';
export { MultiChannelMessenger } from './messaging.js';
export { ExportPipeline } from './export-pipeline.js';
