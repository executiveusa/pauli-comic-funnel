import * as fs from "fs/promises";
import * as path from "path";
import type { ProjectConfig } from "../../types.js";

/**
 * Generates main entry point file (main.py or index.ts) in src/app directory.
 *
 * @param params - Parameters object
 * @param params.projectPath - Absolute path to project root
 * @param params.config - Project configuration
 * @returns Promise that resolves when file is written
 *
 * @example
 * ```ts
 * await generateMainEntryPoint({ projectPath: '/path', config });
 * ```
 */
export const generateMainEntryPoint = async ({
  projectPath,
  config,
}: {
  projectPath: string;
  config: ProjectConfig;
}): Promise<void> => {
  const srcDir = config.framework === "mastra" ? "src" : "app";

  const mainFileContent =
    config.language === "python"
      ? `"""
Main entry point for your agent.
"""

def main():
    print("Welcome to your agent!")
    # TODO: Implement your agent logic here

if __name__ == "__main__":
    main()
`
      : `/**
 * Main entry point for your agent.
 */

const main = () => {
  console.log("Welcome to your agent!");
  // TODO: Implement your agent logic here
};

main();
`;

  const mainFileName = config.language === "python" ? "main.py" : "index.ts";
  await fs.writeFile(
    path.join(projectPath, srcDir, mainFileName),
    mainFileContent
  );
};
