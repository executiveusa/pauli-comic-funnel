import type { ProjectConfig } from '../types.js';
import { logger } from '../utils/logger/index.js';
import { buildInitialPrompt } from './build-initial-prompt.js';
import { getCodingAssistantProvider } from '../providers/coding-assistants/index.js';

/**
 * Kicks off the coding assistant with initial instructions.
 *
 * @param params - Parameters object
 * @param params.projectPath - Absolute path to project root
 * @param params.config - Project configuration
 * @returns Promise that resolves when assistant is launched
 *
 * @example
 * ```ts
 * await kickoffAssistant({ projectPath: '/path/to/project', config });
 * ```
 */
export const kickoffAssistant = async ({
  projectPath,
  config
}: {
  projectPath: string;
  config: ProjectConfig;
}): Promise<void> => {
  const prompt = buildInitialPrompt({ config });
  const provider = getCodingAssistantProvider({ assistant: config.codingAssistant });

  logger.userSuccess('Project setup complete!');
  logger.userInfo('Initial prompt:');
  logger.userInfo('--------------------------------');
  logger.userInfo(`${prompt}`);
  logger.userInfo('--------------------------------');
  logger.userInfo(`Go to the project directory:\n\n    cd ${projectPath}\n`);

  // Let the provider handle its own launch behavior
  await provider.launch({ projectPath, prompt });
};

