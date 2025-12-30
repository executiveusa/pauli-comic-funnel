# 02-NOTION-SYNC: Notion Database Synchronization

**Purpose**: Bidirectional sync between local markdown files and Notion databases

---

## Structure

```
02-NOTION-SYNC/
├── databases/             # Local markdown mirrors of Notion DBs
│   ├── projects/         # Project tracking
│   ├── tasks/            # Task management
│   ├── skills/           # Cloud Skills catalog
│   ├── agents/           # Agent registry
│   ├── decisions/        # Decision log
│   └── financials/       # Financial tracking
├── sync-scripts/         # Node.js sync engine
└── README.md            # This file
```

---

## Sync Protocol

**Direction**: Bidirectional (Local ↔ Notion)
**Frequency**: Every 15 minutes
**Conflict Resolution**: Local wins by default (configurable)
**Technology**: Notion API + custom sync engine

---

## Database Mappings

| Local Folder | Notion Database | Purpose |
|--------------|-----------------|---------|
| `databases/projects/` | Projects DB | Active projects and clients |
| `databases/tasks/` | Tasks DB | Task tracking and assignment |
| `databases/skills/` | Skills DB | 18 Cloud Skills documentation |
| `databases/agents/` | Agents DB | Agent registry and performance |
| `databases/decisions/` | Decisions DB | Architecture decision records |
| `databases/financials/` | Financials DB | Revenue, expenses, runway |

---

## Implementation

**Status**: PENDING
**Dependencies**: Notion API key, database IDs
**Priority**: HIGH (operational database for PAULI)

---

## How It Works

1. **Markdown → Notion**:
   - Local file saved with frontmatter
   - Sync script detects change
   - Converts markdown to Notion blocks
   - Updates Notion page

2. **Notion → Markdown**:
   - Notion page updated via UI or API
   - Sync script detects change
   - Converts Notion blocks to markdown
   - Updates local file

3. **Frontmatter Structure**:
   ```yaml
   ---
   notion_id: abc123
   last_modified: 2025-12-30T00:00:00Z
   database: projects
   status: active
   ---
   ```
