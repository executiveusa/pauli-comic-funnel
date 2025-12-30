# 06-MCP-SERVERS: Model Context Protocol Servers

**Purpose**: Custom MCP servers that extend Claude's capabilities

---

## MCP Servers

Model Context Protocol (MCP) allows building custom tools and data sources for Claude agents.

**Planned Servers**:

| Server | Purpose | Status |
|--------|---------|--------|
| `pauli-notion-mcp/` | Notion database access for agents | PENDING |
| `pauli-second-brain-mcp/` | Second Brain knowledge retrieval | PENDING |
| `pauli-github-mcp/` | Enhanced GitHub operations | PENDING |
| `pauli-supabase-mcp/` | Direct database access for agents | PENDING |

---

## Use Cases

**Notion MCP**:
- Agents can query/update Notion databases
- Access project status, tasks, decisions
- Update records as tasks complete

**Second Brain MCP**:
- Semantic search across ChatGPT exports
- Retrieve past conversations
- Find relevant context for current tasks

**GitHub MCP**:
- Advanced repository operations
- PR creation/management
- Issue tracking
- Commit analysis

**Supabase MCP**:
- Direct database queries
- Real-time subscriptions
- Edge function invocation

---

## Implementation

**Status**: PENDING
**Priority**: MEDIUM (useful for advanced agent capabilities)
**Dependencies**: MCP SDK, relevant API credentials

---

## Related

See `03-CLOUD-SKILLS/11-mcp-builder/` for the Cloud Skill that builds MCP servers.
