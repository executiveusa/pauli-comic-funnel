# Project Scaffolding

Creates the physical directory structure and starter files for new agent projects.

## Responsibilities
- Create folder hierarchy (src/, tests/, prompts/)
- Generate template files (.env, .gitignore, main entry)
- Write sample tests and evaluations

## Main Export
- `createProjectStructure(projectPath, config)` → `Promise<void>`

## Structure
- `create-directory-structure.ts` - Directory creation logic
- `file-generators/` - Individual file template generators

## Dependencies
- `fs/promises` - File system operations
- `../types` - ProjectConfig type definitions

