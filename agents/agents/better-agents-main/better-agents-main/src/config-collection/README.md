# Config Collection

Gathers user input for project initialization via interactive prompts.

## Responsibilities

- Collect language/framework choices
- Validate API keys (OpenAI, LangWatch)
- Capture project goals

## Main Export

- `collectConfig()` → `ProjectConfig`

## Structure

- `collect-config.ts` - Main orchestrator
- `validators/` - API key and input validation logic
- `choice-builders/` - Dynamic choice generation for prompts

## Dependencies

- `@inquirer/prompts` - Interactive CLI prompts
- `../types` - ProjectConfig type definitions
