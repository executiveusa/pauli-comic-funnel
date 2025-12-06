import type { LLMProviderProvider } from "../index.js";

/**
 * Anthropic (Claude) LLM provider implementation.
 */
export const AnthropicProvider: LLMProviderProvider = {
  id: "anthropic",
  displayName: "Anthropic (Claude)",
  apiKeyUrl: "https://console.anthropic.com/settings/keys",

  getEnvVariables: ({ apiKey }) => [
    { key: "ANTHROPIC_API_KEY", value: apiKey },
  ],
};

