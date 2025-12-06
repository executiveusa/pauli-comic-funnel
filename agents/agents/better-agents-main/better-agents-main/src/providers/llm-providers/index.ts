import { OpenAIProvider } from "./openai/index.js";
import { AnthropicProvider } from "./anthropic/index.js";
import { GeminiProvider } from "./gemini/index.js";
import { BedrockProvider } from "./bedrock/index.js";
import { OpenRouterProvider } from "./openrouter/index.js";
import { GrokProvider } from "./grok/index.js";

export type EnvVariable = {
  key: string;
  value: string;
};

export type CredentialInput = {
  key: string;
  label: string;
  type: "password" | "text";
  defaultValue?: string;
  validate?: (value: string) => string | boolean;
};

/**
 * Interface for LLM provider configuration.
 * Each provider returns environment variables needed for API access.
 *
 * @example
 * ```ts
 * const provider = getLLMProvider({ provider: 'openai' });
 * const envVars = provider.getEnvVariables({ apiKey: 'sk-...' });
 * ```
 */
export interface LLMProviderProvider {
  readonly id: string;
  readonly displayName: string;

  /** URL where users can get their API key */
  readonly apiKeyUrl: string;

  /** Optional additional credentials this provider needs (beyond the main API key) */
  readonly additionalCredentials?: CredentialInput[];

  /** Returns environment variables needed for this provider */
  getEnvVariables(params: {
    apiKey: string;
    additionalInputs?: Record<string, string>;
  }): EnvVariable[];

  /** Validates API key format/connectivity */
  validateApiKey?(params: { apiKey: string }): Promise<boolean>;
}

const PROVIDERS: Record<string, LLMProviderProvider> = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  gemini: GeminiProvider,
  bedrock: BedrockProvider,
  openrouter: OpenRouterProvider,
  grok: GrokProvider,
};

/**
 * Gets an LLM provider by ID.
 *
 * @param params - Parameters object
 * @param params.provider - LLM provider identifier
 * @returns LLM provider instance
 *
 * @example
 * ```ts
 * const provider = getLLMProvider({ provider: 'openai' });
 * ```
 */
export const getLLMProvider = ({
  provider,
}: {
  provider: string;
}): LLMProviderProvider => {
  const llmProvider = PROVIDERS[provider];
  if (!llmProvider) {
    throw new Error(`LLM provider not found: ${provider}`);
  }
  return llmProvider;
};

/**
 * Gets all available LLM providers.
 *
 * @returns Array of LLM providers
 *
 * @example
 * ```ts
 * const providers = getAllLLMProviders();
 * ```
 */
export const getAllLLMProviders = (): LLMProviderProvider[] => {
  return Object.values(PROVIDERS);
};

