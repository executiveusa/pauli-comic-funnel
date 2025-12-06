import * as fs from "fs/promises";
import * as path from "path";

/**
 * Generates sample prompt YAML file in prompts/ directory.
 *
 * @param params - Parameters object
 * @param params.projectPath - Absolute path to project root
 * @returns Promise that resolves when file is written
 *
 * @example
 * ```ts
 * await generateSamplePrompt({ projectPath: '/path/to/project' });
 * ```
 */
export const generateSamplePrompt = async ({
  projectPath,
}: {
  projectPath: string;
}): Promise<void> => {
  const samplePromptYaml = `# Sample prompt for your agent
model: gpt-4o
temperature: 0.7
messages:
  - role: system
    content: |
      You are a helpful AI assistant.
`;

  await fs.writeFile(
    path.join(projectPath, "prompts", "sample_prompt.yaml"),
    samplePromptYaml
  );

  await fs.writeFile(
    path.join(projectPath, "prompts.json"),
    JSON.stringify({ prompts: [] }, null, 2)
  );
};
