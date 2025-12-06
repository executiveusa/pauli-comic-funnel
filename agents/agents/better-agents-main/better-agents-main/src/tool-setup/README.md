# Tool Setup

Configures external tools and services for the agent project.

## Responsibilities
- Set up MCP (Model Context Protocol) servers
- Configure framework-specific tools (Agno)
- Download and install required configuration files

## Main Exports
- `setupMCPServers(projectPath, config)` → `Promise<void>`
- `setupAgnoTools(projectPath)` → `Promise<void>`

## Structure
- `mcp/` - MCP server configuration
- `agno/` - Agno-specific tooling setup

## Dependencies
- `fs/promises` - File system operations
- `fetch` - HTTP requests for downloading configs

