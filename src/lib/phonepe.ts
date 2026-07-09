/**
 * PhonePe Payment Gateway — Punnami Hotels
 *
 * Uses the official @phonepe-pg/pg-sdk-node v2 SDK.
 * The SDK handles OAuth2 token exchange, request signing, and retries internally.
 *
 * Required env vars:
 *   PHONEPE_CLIENT_ID      — Client ID from PhonePe Business Developer Settings
 *   PHONEPE_CLIENT_SECRET  — Client Secret from PhonePe Business Developer Settings
 *   PHONEPE_CLIENT_VERSION — Client Version shown in Developer Settings (usually "1")
 *   PHONEPE_ENV            — "SANDBOX" or "PRODUCTION"
 */

import { StandardCheckoutClient, Env } from '@phonepe-pg/pg-sdk-node';

// Re-export the SDK request/prefill builders so route handlers don't need to
// import from the SDK package directly (single import point).
export {
  StandardCheckoutPayRequest,
  PrefillUserLoginDetails,
} from '@phonepe-pg/pg-sdk-node';

let _client: StandardCheckoutClient | null = null;

export function getPhonePeClient(): StandardCheckoutClient {
  // Return cached singleton — the SDK manages its own OAuth token lifecycle
  if (_client) return _client;

  const clientId     = (process.env.PHONEPE_CLIENT_ID     || '').replace(/^"|"$/g, '').trim();
  const clientSecret = (process.env.PHONEPE_CLIENT_SECRET || '').replace(/^"|"$/g, '').trim();
  const versionStr   = (process.env.PHONEPE_CLIENT_VERSION || '1').replace(/^"|"$/g, '').trim();
  const envStr       = (process.env.PHONEPE_ENV            || '').replace(/^"|"$/g, '').trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing PhonePe credentials. ' +
      'Ensure PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET are set in your .env file.'
    );
  }

  const clientVersion = parseInt(versionStr, 10) || 1;
  const env = envStr.toUpperCase() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

  _client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
  return _client;
}
