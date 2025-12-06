import type { LanguageProvider } from "../index.js";
import { getKnowledge } from "./knowledge.js";

/**
 * TypeScript language provider implementation.
 */
export const TypeScriptLanguageProvider: LanguageProvider = {
  id: "typescript",
  displayName: "TypeScript",
  getKnowledge,
};

