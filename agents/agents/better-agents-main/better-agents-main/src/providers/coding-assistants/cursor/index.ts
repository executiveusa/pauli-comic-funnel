import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../../../utils/logger/index.js";
import type { CodingAssistantProvider } from "../index.js";

/**
 * Cursor assistant provider implementation.
 * Writes MCP configuration as .cursor/mcp.json in project root.
 */
export const CursorCodingAssistantProvider: CodingAssistantProvider = {
  id: "cursor",
  displayName: "Cursor",
  command: "",

  async isAvailable(): Promise<{
    installed: boolean;
    installCommand?: string;
  }> {
    // Cursor is always available as it's an IDE, not a CLI tool
    return { installed: true };
  },

  async writeMCPConfig({ projectPath, config }) {
    // Create .cursor directory
    const cursorDir = path.join(projectPath, ".cursor");
    await fs.mkdir(cursorDir, { recursive: true });

    // Write MCP config to .cursor/mcp.json
    const mcpConfigPath = path.join(cursorDir, "mcp.json");
    await fs.writeFile(mcpConfigPath, JSON.stringify(config, null, 2));
  },

  async launch({
    projectPath,
  }: {
    projectPath: string;
    prompt: string;
  }): Promise<void> {
    // Cursor doesn't support CLI launching, show instructions instead
    logger.userWarning("To start with Cursor:");
    logger.userInfo("  1. Open Cursor");
    logger.userInfo(`  2. Open the folder: ${projectPath}`);
    logger.userInfo("  3. Use the initial prompt above with Cursor Composer");
  },
};
