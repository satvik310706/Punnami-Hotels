import { StandardCheckoutClient, Env } from '@phonepe-pg/pg-sdk-node';

let _client: StandardCheckoutClient | null = null;

export function getPhonePeClient(): StandardCheckoutClient {
  if (_client) return _client;

  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersionStr = process.env.PHONEPE_CLIENT_VERSION;
  const envStr = process.env.PHONEPE_ENV;

  if (!clientId || !clientSecret) {
    throw new Error('Missing PhonePe credentials (PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET).');
  }

  const clientVersion = Number(clientVersionStr || '1');
  const env = envStr === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

  _client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
  return _client;
}
