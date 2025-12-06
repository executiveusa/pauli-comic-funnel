import type { LanguageKnowledge } from "../index.js";

/**
 * Returns TypeScript language knowledge.
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
  setupInstructions: "TypeScript with pnpm + vitest (install pnpm for them if they don't have it)",
  sourceExtensions: [".ts", ".tsx"],
  testFramework: "vitest",
});

