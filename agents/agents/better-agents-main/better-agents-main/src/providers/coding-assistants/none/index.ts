import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../../../utils/logger/index.js";
import type { CodingAssistantProvider } from "../index.js";

/**
 * None provider - for users who want to set up the project but prompt their assistant manually.
 * Writes MCP configuration in both .mcp.json and .cursor/mcp.json for compatibility.
 * Also creates CLAUDE.md for Claude Code compatibility.
 */
export const NoneCodingAssistantProvider: CodingAssistantProvider = {
  id: "none",
  displayName: "None - I will prompt it myself",
  command: "",

  async isAvailable(): Promise<{
    installed: boolean;
    installCommand?: string;
  }> {
    // "None" option is always available since it doesn't require installation
    return { installed: true };
  },

  async writeMCPConfig({ projectPath, config }) {
    // Write MCP config to .mcp.json (for Claude Code and others)
    const mcpConfigPath = path.join(projectPath, ".mcp.json");
    await fs.writeFile(mcpConfigPath, JSON.stringify(config, null, 2));

    // Also write to .cursor/mcp.json for Cursor compatibility
    const cursorDir = path.join(projectPath, ".cursor");
    await fs.mkdir(cursorDir, { recursive: true });
    const cursorMcpPath = path.join(cursorDir, "mcp.json");
    await fs.writeFile(cursorMcpPath, JSON.stringify(config, null, 2));

    // Create CLAUDE.md that references AGENTS.md
    const claudeMdPath = path.join(projectPath, "CLAUDE.md");
    const claudeMdContent = `@AGENTS.md\n`;
    await fs.writeFile(claudeMdPath, claudeMdContent);
  },

  async launch(_params: {
    projectPath: string;
    prompt: string;
  }): Promise<void> {
    // No auto-launch - just show instructions
    logger.userInfo(
      "When you're ready, use the initial prompt above with your coding assistant."
    );
  },
};
