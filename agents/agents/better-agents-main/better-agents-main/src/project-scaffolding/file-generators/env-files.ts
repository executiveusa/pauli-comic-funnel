import * as fs from "fs/promises";
import * as path from "path";
import type { ProjectConfig } from "../../types.js";
import { getLLMProvider } from "../../providers/llm-providers/index.js";

/**
 * Generates .env.example and .env files with API key placeholders.
 *
 * @param params - Parameters object
 * @param params.projectPath - Absolute path to project root
 * @param params.config - Project configuration with LLM provider details
 * @returns Promise that resolves when files are written
 *
 * @example
 * ```ts
 * await generateEnvFiles({ projectPath: '/path', config });
 * ```
 */
export const generateEnvFiles = async ({
  projectPath,
  config,
}: {
  projectPath: string;
  config: ProjectConfig;
}): Promise<void> => {
  const provider = getLLMProvider({ provider: config.llmProvider });
  const envVars = provider.getEnvVariables({
    apiKey: config.llmApiKey,
    additionalInputs: config.llmAdditionalInputs,
  });

  // Generate .env.example with placeholders
  const envExampleLines = [
    "# LLM Provider API Keys",
    ...envVars.map((v) => `${v.key}=your_${v.key.toLowerCase()}_here`),
    "",
    "# LangWatch",
    "LANGWATCH_API_KEY=your_langwatch_api_key_here",
  ];
  const envExample = envExampleLines.join("\n") + "\n";

  await fs.writeFile(path.join(projectPath, ".env.example"), envExample);

  // Generate .env with actual values
  const envContentLines = [
    "# LLM Provider API Keys",
    ...envVars.map((v) => `${v.key}=${v.value}`),
    "",
    "# LangWatch",
    `LANGWATCH_API_KEY=${config.langwatchApiKey}`,
  ];
  const envContent = envContentLines.join("\n") + "\n";

  await fs.writeFile(path.join(projectPath, ".env"), envContent);
};
