import type { AgentFramework, ProgrammingLanguage } from "../../types.js";
import { getFrameworksByLanguage } from "../../providers/frameworks/index.js";

/**
 * Builds framework choices based on the selected programming language.
 *
 * @param params - Parameters object
 * @param params.language - The selected programming language
 * @returns Array of framework choices for the language
 *
 * @example
 * ```ts
 * const choices = buildFrameworkChoices({ language: 'python' });
 * ```
 */
export const buildFrameworkChoices = ({
  language,
}: {
  language: ProgrammingLanguage;
}) => {
  return getFrameworksByLanguage({ language }).map((provider) => ({
    name: provider.displayName,
    value: provider.id as AgentFramework,
  }));
};
