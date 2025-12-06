import { describe, it, beforeEach, afterEach } from "vitest";
import { CLITestRunner } from "../utils/cli-test-runner.js";

describe("better-agents init - complete user flow", () => {
  let runner: CLITestRunner;

  beforeEach(() => {
    runner = new CLITestRunner();
  });

  afterEach(async () => {
    await runner.cleanup();
  });

  describe("full flow scenarios", () => {
    it.todo("completes typescript + agno project setup");
    // When implemented:
    // await runner
    //   .command('init', 'test-project')
    //   .expectPrompt('Welcome to Better Agents')
    //   .expectPrompt('What programming language')
    //   .input('typescript')
    //   .expectPrompt('What agent framework')
    //   .input('agno')
    //   .expectPrompt('What coding assistant')
    //   .input('claude-code')
    //   .expectPrompt('What LLM provider')
    //   .input('openai')
    //   .expectPrompt('Enter your OpenAI API key')
    //   .input('sk-test123')
    //   .expectPrompt('Enter your LangWatch API key')
    //   .input('lw_test123')
    //   .expectPrompt('What do you want to build')
    //   .input('Build a chatbot')
    //   .expectOutput('Project structure created')
    //   .expectOutput('MCP configuration set up')
    //   .expectOutput('Agno configuration set up')
    //   .expectOutput('AGENTS.md generated')
    //   .expectOutput('Project setup complete')
    //   .expectFile('src/prompts/sample.ts')
    //   .expectFile('src/scenarios/sample.test.ts')
    //   .expectFile('evaluations/sample.ts')
    //   .expectFile('.env')
    //   .expectFile('.gitignore')
    //   .expectFile('AGENTS.md')
    //   .expectFile('.cursorrules')
    //   .expectFileContains('.env', 'OPENAI_API_KEY=sk-test123')
    //   .expectFileContains('.env', 'LANGWATCH_API_KEY=lw_test123')
    //   .expectFileToMatchInlineSnapshot('.env')
    //   .expectFileToMatchInlineSnapshot('src/prompts/sample.ts')
    //   .run();

    it.todo("completes typescript + mastra project setup");

    it.todo("completes python + agno project setup");
  });

  describe("prompt sequence validation", () => {
    it.todo("displays welcome message");

    it.todo("prompts for language selection");

    it.todo("prompts for framework after language");

    it.todo(
      "shows only typescript-compatible frameworks when typescript selected"
    );

    it.todo("shows only python-compatible frameworks when python selected");

    it.todo("prompts for coding assistant");

    it.todo("prompts for LLM provider");

    it.todo("displays LangWatch authorization URL before key prompt");

    it.todo("prompts for OpenAI API key with masked input");

    it.todo("prompts for LangWatch API key with masked input");

    it.todo("prompts for project goal");
  });

  describe("input validation", () => {
    it.todo("re-prompts when OpenAI key is invalid");
    // When implemented:
    // await runner
    //   .command('init', 'test')
    //   // ... navigate to API key prompt ...
    //   .expectPrompt('Enter your OpenAI API key')
    //   .input('invalid-key')
    //   .expectOutput("must start with 'sk-'")
    //   .expectPrompt('Enter your OpenAI API key')
    //   .input('sk-valid123')
    //   .run();

    it.todo("re-prompts when LangWatch key is invalid");

    it.todo("re-prompts when project goal is empty");

    it.todo("accepts valid inputs and proceeds");
  });

  describe("file generation", () => {
    describe("when typescript + agno", () => {
      it.todo("creates correct directory structure");

      it.todo("generates typescript main entry point");

      it.todo("generates typescript scenario test");

      it.todo("includes agno-specific tools configuration");

      it.todo("includes agno rules in .cursorrules");

      it.todo("generates AGENTS.md with agno guidance");
    });

    describe("when typescript + mastra", () => {
      it.todo("generates mastra-compatible entry point");

      it.todo("skips agno-specific configuration");
    });

    describe("when python + agno", () => {
      it.todo("generates python main entry point");

      it.todo("generates python scenario test");

      it.todo("uses python-compatible file structure");
    });
  });

  describe("file content verification", () => {
    it.todo("generates .env with correct API keys");

    it.todo("generates .gitignore with appropriate patterns");

    it.todo("generates sample prompt file");

    it.todo("generates sample scenario test");

    it.todo("generates sample evaluation file");

    it.todo("generates MCP settings configuration");

    it.todo("generates AGENTS.md with project-specific content");
  });

  describe("progress indication", () => {
    it.todo("displays spinner during setup");

    it.todo("updates spinner text after structure creation");

    it.todo("updates spinner text after MCP setup");

    it.todo("updates spinner text after framework setup");

    it.todo("updates spinner text after documentation generation");

    it.todo("displays success message on completion");

    it.todo("displays project location path");
  });

  describe("assistant kickoff", () => {
    it.todo("displays assistant instructions after setup");

    it.todo("includes project goal in assistant context");
  });

  describe("error handling", () => {
    it.todo("handles directory creation failure");

    it.todo("handles file generation failure");

    it.todo("displays error message on failure");

    it.todo("exits with non-zero code on error");

    it.todo("fails spinner on error");
  });

  describe("existing directory handling", () => {
    it.todo("uses existing directory without error");

    it.todo("creates subdirectories in existing directory");
  });
});
