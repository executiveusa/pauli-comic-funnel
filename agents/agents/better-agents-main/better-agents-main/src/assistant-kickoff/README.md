# Assistant Kickoff

Builds and displays initial instructions for starting the coding assistant.

## Responsibilities
- Build initial prompt for AI assistant
- Display setup instructions to user
- Format command-line instructions

## Main Export
- `kickoffAssistant(projectPath, config)` → `Promise<void>`

## Structure
- `build-initial-prompt.ts` - Constructs AI prompt
- `display-instructions.ts` - Formats and displays instructions

## Dependencies
- `chalk` - Terminal formatting
- `../types` - ProjectConfig type definitions

