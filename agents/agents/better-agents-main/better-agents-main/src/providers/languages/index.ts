import { PythonLanguageProvider } from "./python/index.js";
import { TypeScriptLanguageProvider } from "./typescript/index.js";

export type LanguageKnowledge = {
  /** Setup instructions (e.g. "Python w/uv + pytest") */
  setupInstructions: string;
  /** File extension patterns */
  sourceExtensions: string[];
  /** Test framework name */
  testFramework: string;
};

/**
 * Interface for language providers.
 * Each language provides knowledge about setup and conventions.
 *
 * @example
 * ```ts
 * const provider = getLanguageProvider({ language: 'python' });
 * const knowledge = provider.getKnowledge();
 * ```
 */
export interface LanguageProvider {
  readonly id: string;
  readonly displayName: string;

  getKnowledge(): LanguageKnowledge;
}

const PROVIDERS: Record<string, LanguageProvider> = {
  typescript: TypeScriptLanguageProvider,
  python: PythonLanguageProvider,
};

/**
 * Gets a language provider by ID.
 *
 * @param params - Parameters object
 * @param params.language - Language identifier
 * @returns Language provider instance
 *
 * @example
 * ```ts
 * const provider = getLanguageProvider({ language: 'python' });
 * ```
 */
export const getLanguageProvider = ({
  language,
}: {
  language: string;
}): LanguageProvider => {
  const provider = PROVIDERS[language];
  if (!provider) {
    throw new Error(`Language provider not found: ${language}`);
  }
  return provider;
};

/**
 * Gets all available language providers.
 *
 * @returns Array of language providers
 *
 * @example
 * ```ts
 * const languages = getAllLanguages();
 * ```
 */
export const getAllLanguages = (): LanguageProvider[] => {
  return Object.values(PROVIDERS);
};

