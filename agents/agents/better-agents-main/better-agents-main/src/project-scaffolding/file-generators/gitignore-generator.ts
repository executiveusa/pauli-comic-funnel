import * as fs from "fs/promises";
import * as path from "path";

/**
 * Generates .gitignore file with common patterns for agent projects.
 *
 * @param params - Parameters object
 * @param params.projectPath - Absolute path to project root
 * @returns Promise that resolves when file is written
 *
 * @example
 * ```ts
 * await generateGitignore({ projectPath: '/path/to/project' });
 * ```
 */
export const generateGitignore = async ({
  projectPath,
}: {
  projectPath: string;
}): Promise<void> => {
  const gitignoreContent = `# Environment variables
.env

# Dependencies
node_modules/
__pycache__/
*.pyc
venv/
.venv/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
*.egg-info/
`;

  await fs.writeFile(path.join(projectPath, ".gitignore"), gitignoreContent);
};
