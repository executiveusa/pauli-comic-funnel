# 08-DOCS: Documentation

**Purpose**: Comprehensive project documentation

---

## Documentation Structure

```
08-DOCS/
├── architecture/              # System architecture
│   ├── pauli-master-architecture.md
│   ├── agent-hierarchy.md
│   └── data-flow.md
├── protocols/                 # Operational protocols
│   ├── jcp-protocol.md
│   ├── bmad-a2a-protocol.md
│   └── adversarial-review.md
├── guides/                    # How-to guides
│   ├── adding-new-skill.md
│   ├── creating-mcp-server.md
│   └── voice-commands.md
├── api/                       # API documentation
│   ├── pauli-prime-api.md
│   ├── skill-orchestrator-api.md
│   └── database-schema.md
├── llms/                      # llms.txt generated files
│   └── (auto-generated from markdown)
└── README.md                  # This file
```

---

## llms.txt System

All markdown documentation is automatically converted to `llms.txt` format for optimal LLM retrieval.

**Setup**:
```bash
pip install llms-txt
python llms_watcher.py  # Runs continuously, watches for markdown changes
```

**How it works**:
1. Developer writes markdown in `08-DOCS/`
2. Watcher detects file change
3. Converts markdown → llms.txt
4. Saves to `08-DOCS/llms/`
5. Agents prefer llms.txt for context retrieval

---

## Key Documents

**For Developers**:
- `architecture/pauli-master-architecture.md` - Complete system design
- `guides/adding-new-skill.md` - How to create new Cloud Skills
- `api/database-schema.md` - Database structure

**For Agents**:
- `llms/` directory - Machine-readable documentation
- `protocols/` - Operating procedures
- `api/` - Programmatic interfaces

---

## Documentation Standards

**All documentation must include**:
1. Purpose statement
2. Usage examples
3. Related files/components
4. Last updated date

**Markdown format**:
- Use GitHub-flavored markdown
- Include code examples
- Link to related docs
- Keep concise and scannable

---

## Status

**Current**: Basic READMEs in all directories
**Next**: Create pauli-master-architecture.md
**Priority**: HIGH (critical for agent context)
