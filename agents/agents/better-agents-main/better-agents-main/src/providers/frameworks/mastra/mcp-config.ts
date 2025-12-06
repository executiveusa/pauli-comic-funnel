import type { MCPServerConfig } from "../index.js";

/**
 * Returns Mastra MCP server configuration.
 *
 * @returns MCP server configuration object
 *
 * @example
 * ```ts
 * const mcpConfig = getMCPConfig();
 * ```
 */
export const getMCPConfig = (): MCPServerConfig => ({
  type: "stdio",
  command: "npx",
  args: ["-y", "@mastra/mcp-docs-server"],
});

