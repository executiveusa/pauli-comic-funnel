import chalk from "chalk";
import { getAllCodingAssistants } from "../../providers/coding-assistants/index.js";
import type { CodingAssistant } from "../../types.js";
import { CodingAssistantUtils } from "../../utils/coding-assistant.util";

type Choice = {
  name: string;
  value: CodingAssistant;
};

/**
 * Builds coding assistant choices with installed agents shown first in white,
 * and not installed agents shown later in gray with "(not installed)" suffix.
 *
 * @returns Promise resolving to array of choice objects for inquirer
 *
 * @example
 * ```ts
 * const choices = await buildCodingAssistantChoices();
 * // Returns: [
 * //   { name: "Claude Code", value: "claude-code" },
 * //   { name: chalk.gray("Cursor CLI (not installed)"), value: "cursor-cli" }
 * // ]
 * ```
 */
export const buildCodingAssistantChoices = async (): Promise<Choice[]> => {
  const assistants = getAllCodingAssistants();
  const installedMap = await CodingAssistantUtils.detectInstalledAgents();

  const installed: Choice[] = [];
  const notInstalled: Choice[] = [];

  for (const assistant of assistants) {
    const isInstalled = installedMap[assistant.id];
    const choice: Choice = {
      name: isInstalled
        ? assistant.displayName
        : chalk.gray(`${assistant.displayName} (not installed)`),
      value: assistant.id as CodingAssistant,
    };

    if (isInstalled) {
      installed.push(choice);
    } else {
      notInstalled.push(choice);
    }
  }

  return [...installed, ...notInstalled];
};

