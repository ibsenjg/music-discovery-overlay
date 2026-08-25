export interface FutureProviderDefinition {
  id: 'openai' | 'anthropic';
  label: string;
  enabled: false;
  auth: 'provider-api-credentials';
  secretLifetime: 'tab-session-only';
}

/**
 * Non-callable architecture metadata. Consumer ChatGPT and Claude
 * subscriptions are not API credentials. A future implementation must use
 * official provider auth and keep secrets in per-tab memory.
 */
export const FUTURE_PROVIDERS: FutureProviderDefinition[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    enabled: false,
    auth: 'provider-api-credentials',
    secretLifetime: 'tab-session-only',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    enabled: false,
    auth: 'provider-api-credentials',
    secretLifetime: 'tab-session-only',
  },
];
