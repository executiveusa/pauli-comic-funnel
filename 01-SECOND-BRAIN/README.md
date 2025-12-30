# 01-SECOND-BRAIN: Knowledge Repository

**Purpose**: Centralized knowledge base from ChatGPT exports, Google Drive, and learned context

---

## Structure

```
01-SECOND-BRAIN/
├── chatgpt-exports/       # Raw ChatGPT conversation exports
├── parsed-knowledge/      # Processed and indexed documents
├── sync-scripts/          # Google Drive → Second Brain pipeline
├── index/                 # Search indices for fast retrieval
└── README.md             # This file
```

---

## Sync Protocol

**Source**: Google Drive folder "Second Brain Exports"
**Frequency**: Daily at 3:00 AM
**Process**:
1. Fetch new ChatGPT exports from Drive
2. Parse using Outlines library
3. Extract structured knowledge
4. Index for agent retrieval
5. Make available via conversation_search tool

---

## Usage

PAULI-PRIME queries this system when:
- User asks about past decisions
- Context needed for new projects
- Historical patterns useful for current task
- Retrieving specific conversations

---

## Status

**Implementation**: PENDING
**Dependencies**: Google Drive API credentials
**Priority**: MEDIUM (needed for full autonomy, not critical for MVP)
