# Documentation

Generates the AGENTS.md guide file with best practices and guidelines.

## Responsibilities
- Build comprehensive agent development guide
- Include testing pyramid methodology
- Add framework-specific guidelines
- Generate workflow instructions

## Main Export
- `generateAgentsGuide(projectPath, config)` → `Promise<void>`

## Structure
- `generate-agents-guide.ts` - Main orchestrator
- `sections/` - Individual section builders for modular content

## Dependencies
- `fs/promises` - File system operations
- `../types` - ProjectConfig type definitions

