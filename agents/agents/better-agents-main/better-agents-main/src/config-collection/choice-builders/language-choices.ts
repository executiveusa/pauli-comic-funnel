import type { ProgrammingLanguage } from "../../types.js";

/**
 * Builds the list of programming language choices for the CLI prompt.
 *
 * @returns Array of language choices
 *
 * @example
 * ```ts
 * const choices = buildLanguageChoices();
 * // Returns: [{ name: 'Python', value: 'python' }, { name: 'TypeScript', value: 'typescript' }]
 * ```
 */
export const buildLanguageChoices = () => {
  return [
    { name: "TypeScript", value: "typescript" as ProgrammingLanguage },
    { name: "Python", value: "python" as ProgrammingLanguage },
  ];
};
