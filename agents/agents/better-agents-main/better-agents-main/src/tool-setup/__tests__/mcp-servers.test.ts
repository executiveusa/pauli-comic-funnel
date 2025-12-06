import { describe, it } from 'vitest';

describe('setupMCPServers', () => {
  describe('when framework is mastra', () => {
    it.todo('includes mastra MCP server');
  });

  describe('when framework is agno', () => {
    it.todo('does not include mastra MCP server');
  });

  describe('when codingAssistant is claude-code', () => {
    it.todo('writes .mcp.json file');
  });

  it.todo('always includes langwatch MCP server');
});

