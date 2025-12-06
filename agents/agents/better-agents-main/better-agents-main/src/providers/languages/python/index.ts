import type { LanguageProvider } from "../index.js";
import { getKnowledge } from "./knowledge.js";

/**
 * Python language provider implementation.
 */
export const PythonLanguageProvider: LanguageProvider = {
  id: "python",
  displayName: "Python",
  getKnowledge,
};

