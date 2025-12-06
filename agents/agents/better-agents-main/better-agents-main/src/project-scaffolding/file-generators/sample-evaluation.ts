import * as fs from "fs/promises";
import * as path from "path";
import type { ProgrammingLanguage } from "../../types.js";

/**
 * Generates sample evaluation Jupyter notebook in tests/evaluations/.
 *
 * @param params - Parameters object
 * @param params.projectPath - Absolute path to project root
 * @param params.language - Programming language (python or typescript)
 * @returns Promise that resolves when file is written
 *
 * @example
 * ```ts
 * await generateSampleEvaluation({ projectPath: '/path', language: 'python' });
 * ```
 */
export const generateSampleEvaluation = async ({
  projectPath,
  language,
}: {
  projectPath: string;
  language: ProgrammingLanguage;
}): Promise<void> => {
  const sampleEvalNotebook = {
    cells: [
      {
        cell_type: "markdown",
        metadata: {},
        source: [
          "# Sample Evaluation\n",
          "\n",
          "This notebook demonstrates how to evaluate your agent using LangWatch.",
        ],
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          "# TODO: Add your evaluation code here using LangWatch Evaluations API\n",
          "# Refer to LangWatch MCP for documentation on how to use evaluations",
        ],
      },
    ],
    metadata: {
      kernelspec: {
        display_name: language === "python" ? "Python 3" : "TypeScript",
        language,
        name: language === "python" ? "python3" : "tslab",
      },
    },
    nbformat: 4,
    nbformat_minor: 4,
  };

  await fs.writeFile(
    path.join(projectPath, "tests", "evaluations", "example_eval.ipynb"),
    JSON.stringify(sampleEvalNotebook, null, 2)
  );
};
