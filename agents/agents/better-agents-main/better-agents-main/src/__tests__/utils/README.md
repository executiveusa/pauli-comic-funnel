# E2E Test Utilities

Utilities for end-to-end testing of the better-agents CLI.

## CLITestRunner

Fluent API for testing CLI user interactions.

### Example

```typescript
import { CLITestRunner } from "./utils/cli-test-runner.js";

it("creates a project", async () => {
  const runner = new CLITestRunner();

  await runner
    .command('init', 'my-project')
    .expectPrompt('What programming language')
    .input('typescript')
    .expectPrompt('What agent framework')
    .input('agno')
    .expectOutput('Project setup complete')
    .expectFile('src/main.ts')
    .expectFileToMatchInlineSnapshot('package.json')
    .run();

  await runner.cleanup();
});
```

## Helper Functions

- **spawnCLI** - Spawns CLI process with stdin injection
- **createTempDir** - Creates isolated temp directory
- **cleanupTempDir** - Removes temp directory

