import type { ProjectConfig } from "../types.js";
import { createDirectories } from "./create-directory-structure.js";
import { generateEnvFiles } from "./file-generators/env-files.js";
import { generateGitignore } from "./file-generators/gitignore-generator.js";
import { generateSamplePrompt } from "./file-generators/sample-prompt-file.js";
import { generateSampleEvaluation } from "./file-generators/sample-evaluation.js";
import { generateSampleScenario } from "./file-generators/sample-scenario-test.js";
import { generateMainEntryPoint } from "./file-generators/main-entry-point.js";

/**
 * Creates complete project structure including directories and starter files.
 *
 * @param params - Parameters object
 * @param params.projectPath - Absolute path to project root
 * @param params.config - Project configuration
 * @returns Promise that resolves when structure is created
 *
 * @example
 * ```ts
 * await createProjectStructure({ projectPath: '/path/to/project', config });
 * ```
 */
export const createProjectStructure = async ({
  projectPath,
  config,
}: {
  projectPath: string;
  config: ProjectConfig;
}): Promise<void> => {
  await createDirectories({ projectPath, config });

  await generateEnvFiles({
    projectPath,
    config,
  });

  await generateGitignore({ projectPath });
  await generateSamplePrompt({ projectPath });
  await generateSampleEvaluation({ projectPath, language: config.language });
  await generateSampleScenario({ projectPath, language: config.language });
  await generateMainEntryPoint({ projectPath, config });
};
