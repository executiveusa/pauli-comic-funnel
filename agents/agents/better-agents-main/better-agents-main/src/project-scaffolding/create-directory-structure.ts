import * as fs from "fs/promises";
import * as path from "path";
import type { ProjectConfig } from "../types.js";

/**
 * Creates the directory structure for a new agent project.
 *
 * @param params - Parameters object
 * @param params.projectPath - Absolute path to project root
 * @param params.config - Project configuration
 * @returns Promise that resolves when directories are created
 *
 * @example
 * ```ts
 * await createDirectories({ projectPath: '/path/to/project', config });
 * ```
 */
export const createDirectories = async ({
  projectPath,
  config,
}: {
  projectPath: string;
  config: ProjectConfig;
}): Promise<void> => {
  const srcDir = config.framework === "mastra" ? "src" : "app";

  const directories = [
    srcDir,
    "prompts",
    "tests",
    "tests/evaluations",
    "tests/scenarios",
  ];

  for (const dir of directories) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }
};
