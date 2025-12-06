import type { LLMProviderProvider } from "../index.js";

/**
 * xAI Grok LLM provider implementation.
 */
export const GrokProvider: LLMProviderProvider = {
  id: "grok",
  displayName: "xAI (Grok)",
  apiKeyUrl: "https://console.x.ai/team",

  getEnvVariables: ({ apiKey }) => [
    { key: "XAI_API_KEY", value: apiKey },
  ],
};

