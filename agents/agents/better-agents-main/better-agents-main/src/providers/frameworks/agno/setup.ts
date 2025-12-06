import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../../../utils/logger/index.js";

const AGNO_CURSORRULES_URL =
  "https://raw.githubusercontent.com/agno-agi/agno/main/.cursorrules";
const AGNO_LLMS_TXT_URL = "https://docs.agno.com/llms.txt";

/**
 * Performs Agno-specific setup: downloads .cursorrules and llms.txt
 *
 * @param params - Parameters object
 * @param params.projectPath - Absolute path to project root
 * @returns Promise that resolves when setup is complete
 *
 * @example
 * ```ts
 * await setup({ projectPath: '/path/to/project' });
 * ```
 */
export const setup = async ({
  projectPath,
}: {
  projectPath: string;
}): Promise<void> => {
  await Promise.all([
    fetchFile({
      url: AGNO_CURSORRULES_URL,
      targetPath: path.join(projectPath, ".cursorrules"),
      fallback:
        "# Agno cursor rules\n# Please manually download from: " +
        AGNO_CURSORRULES_URL,
    }),
    fetchFile({
      url: AGNO_LLMS_TXT_URL,
      targetPath: path.join(projectPath, "llms.txt"),
      fallback:
        "# Agno LLMs documentation\n# Please manually download from: " +
        AGNO_LLMS_TXT_URL,
    }),
  ]);
};

const fetchFile = async ({
  url,
  targetPath,
  fallback,
}: {
  url: string;
  targetPath: string;
  fallback: string;
}): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const content = await response.text();
    await fs.writeFile(targetPath, content);
  } catch {
    logger.userWarning(`Could not fetch ${url}, using fallback`);
    await fs.writeFile(targetPath, fallback);
  }
};
