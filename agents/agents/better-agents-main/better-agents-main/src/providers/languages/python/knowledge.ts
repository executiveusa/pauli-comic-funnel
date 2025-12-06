import type { LanguageKnowledge } from "../index.js";

/**
 * Returns Python language knowledge.
 *
 * @returns Language knowledge object
 *
 * @example
 * ```ts
 * const knowledge = getKnowledge();
 * console.log(knowledge.testFramework);
 * ```
 */
export const getKnowledge = (): LanguageKnowledge => ({
  setupInstructions: "Python with uv + pytest (install uv for them if they don't have it)",
  sourceExtensions: [".py"],
  testFramework: "pytest",
});

