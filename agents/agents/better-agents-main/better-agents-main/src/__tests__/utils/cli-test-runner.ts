import * as fs from "fs/promises";
import * as path from "path";
import { expect } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import { spawnCLI } from "./spawn-cli.js";
import { createTempDir, cleanupTempDir } from "./temp-dir.js";

const execAsync = promisify(exec);

/**
 * Fluent test runner for CLI interactions.
 *
 * @example
 * ```ts
 * await new CLITestRunner()
 *   .command('init', 'my-project')
 *   .expectPrompt('What language?')
 *   .input('typescript')
 *   .expectFile('.env')
 *   .expectFileToMatchInlineSnapshot('package.json')
 *   .run();
 * ```
 */
export class CLITestRunner {
  private args: string[] = [];
  private interactions: Array<{
    type: "expectPrompt" | "input" | "expectOutput";
    value: string;
  }> = [];
  private fileExpectations: string[] = [];
  private contentExpectations: Array<{
    file: string;
    contains: string;
  }> = [];
  private snapshotExpectations: Array<{
    file: string;
    snapshot?: string;
  }> = [];
  private execCommands: Array<{
    command: string;
    cwd?: string;
    env?: Record<string, string>;
    expectSuccess?: boolean;
    expectOutput?: RegExp | string;
  }> = [];
  private tmpDir?: string;
  private projectPath?: string;

  /**
   * Set the CLI command and arguments.
   *
   * @param cmd - Command name
   * @param args - Command arguments
   * @returns This runner for chaining
   *
   * @example
   * ```ts
   * runner.command('init', 'my-project')
   * ```
   */
  command(cmd: string, ...args: string[]): this {
    this.args = [cmd, ...args];
    return this;
  }

  /**
   * Expect a prompt to appear in stdout.
   *
   * @param text - Text to expect in prompt
   * @returns This runner for chaining
   *
   * @example
   * ```ts
   * runner.expectPrompt('What programming language')
   * ```
   */
  expectPrompt(text: string): this {
    this.interactions.push({ type: "expectPrompt", value: text });
    return this;
  }

  /**
   * Provide input to stdin.
   *
   * @param value - Input value to send
   * @returns This runner for chaining
   *
   * @example
   * ```ts
   * runner.input('typescript')
   * ```
   */
  input(value: string): this {
    this.interactions.push({ type: "input", value });
    return this;
  }

  /**
   * Expect output text in stdout.
   *
   * @param text - Text to expect in output
   * @returns This runner for chaining
   *
   * @example
   * ```ts
   * runner.expectOutput('Project setup complete')
   * ```
   */
  expectOutput(text: string): this {
    this.interactions.push({ type: "expectOutput", value: text });
    return this;
  }

  /**
   * Expect a file to exist.
   *
   * @param filePath - Relative path to file in project
   * @returns This runner for chaining
   *
   * @example
   * ```ts
   * runner.expectFile('src/main.ts')
   * ```
   */
  expectFile(filePath: string): this {
    this.fileExpectations.push(filePath);
    return this;
  }

  /**
   * Expect file to contain specific text.
   *
   * @param file - Relative path to file
   * @param content - Text that should be in file
   * @returns This runner for chaining
   *
   * @example
   * ```ts
   * runner.expectFileContains('.env', 'OPENAI_API_KEY=sk-')
   * ```
   */
  expectFileContains(file: string, content: string): this {
    this.contentExpectations.push({ file, contains: content });
    return this;
  }

  /**
   * Verifies file content matches inline snapshot.
   *
   * @param file - Relative path to file in project
   * @param snapshot - Optional snapshot (Vitest will auto-fill)
   * @returns This runner for chaining
   *
   * @example
   * ```ts
   * runner.expectFileToMatchInlineSnapshot('package.json')
   * // On first run with -u, Vitest will write the snapshot:
   * runner.expectFileToMatchInlineSnapshot('package.json', `
   *   {
   *     "name": "test",
   *     ...
   *   }
   * `)
   * ```
   */
  expectFileToMatchInlineSnapshot(file: string, snapshot?: string): this {
    this.snapshotExpectations.push({ file, snapshot });
    return this;
  }

  /**
   * Execute a command in the generated project directory.
   *
   * @param command - Shell command to execute
   * @param options - Execution options
   * @returns This runner for chaining
   *
   * @example
   * ```ts
   * runner.exec('pnpm install', { expectSuccess: true })
   * runner.exec('pnpm test', {
   *   expectSuccess: true,
   *   expectOutput: /PASS.*scenario/
   * })
   * ```
   */
  exec(
    command: string,
    options?: {
      cwd?: string;
      env?: Record<string, string>;
      expectSuccess?: boolean;
      expectOutput?: RegExp | string;
    }
  ): this {
    this.execCommands.push({
      command,
      cwd: options?.cwd,
      env: options?.env,
      expectSuccess: options?.expectSuccess,
      expectOutput: options?.expectOutput,
    });
    return this;
  }

  /**
   * Execute the CLI command and verify all expectations.
   *
   * @returns Promise that resolves when test completes
   *
   * @example
   * ```ts
   * await runner.command('init').input('typescript').run();
   * ```
   */
  async run(): Promise<void> {
    const tmpDir = await createTempDir();
    this.tmpDir = tmpDir;

    // Extract project name from args (e.g., 'init project-name')
    const projectName =
      this.args[0] === "init" && this.args[1] ? this.args[1] : "test-project";
    this.projectPath = path.join(tmpDir, projectName);

    // Build input stream from interactions
    const inputs = this.interactions
      .filter((i) => i.type === "input")
      .map((i) => i.value + "\n");

    const result = await spawnCLI({
      args: this.args,
      inputs,
      cwd: tmpDir,
    });

    // Verify prompts and outputs in order
    let lastIndex = 0;
    for (const interaction of this.interactions) {
      if (
        interaction.type === "expectPrompt" ||
        interaction.type === "expectOutput"
      ) {
        const foundIndex = result.stdout.indexOf(interaction.value, lastIndex);
        expect(
          foundIndex,
          `Expected to find "${
            interaction.value
          }" after index ${lastIndex}, but it was ${
            foundIndex === -1 ? "not found" : "found earlier"
          }`
        ).toBeGreaterThanOrEqual(lastIndex);
        lastIndex = foundIndex + interaction.value.length;
      }
    }

    // Verify files exist
    for (const file of this.fileExpectations) {
      const filePath = path.join(this.projectPath ?? this.tmpDir, file);
      await expect(fs.access(filePath)).resolves.not.toThrow();
    }

    // Verify file contents
    for (const { file, contains } of this.contentExpectations) {
      const content = await fs.readFile(
        path.join(this.projectPath ?? this.tmpDir, file),
        "utf-8"
      );
      expect(content).toContain(contains);
    }

    // Verify snapshots
    for (const { file, snapshot } of this.snapshotExpectations) {
      const content = await fs.readFile(
        path.join(this.projectPath ?? this.tmpDir, file),
        "utf-8"
      );
      // Normalize line endings and trim for consistency
      const normalized = content.trim().replace(/\r\n/g, "\n");

      if (snapshot !== undefined) {
        expect(normalized).toMatchInlineSnapshot(snapshot);
      } else {
        expect(normalized).toMatchInlineSnapshot();
      }
    }

    // Execute commands
    for (const cmd of this.execCommands) {
      const execCwd = cmd.cwd
        ? path.join(this.projectPath ?? this.tmpDir, cmd.cwd)
        : this.projectPath ?? this.tmpDir;

      try {
        const execResult = await execAsync(cmd.command, {
          cwd: execCwd,
          env: { ...process.env, ...cmd.env },
        });

        if (cmd.expectSuccess) {
          expect(execResult).toBeDefined();
        }

        if (cmd.expectOutput) {
          const output = execResult.stdout + execResult.stderr;
          if (typeof cmd.expectOutput === "string") {
            expect(output).toContain(cmd.expectOutput);
          } else {
            expect(output).toMatch(cmd.expectOutput);
          }
        }
      } catch (error) {
        const error_ = error as { stdout: string; stderr: string };
        if (cmd.expectSuccess) {
          throw new Error(
            `Command "${cmd.command}" failed:\nstdout: ${error_.stdout}\nstderr: ${error_.stderr}`
          );
        }
      }
    }

    expect(result.exitCode).toBe(0);
  }

  /**
   * Clean up temporary directories created by this test.
   *
   * @returns Promise that resolves when cleanup completes
   *
   * @example
   * ```ts
   * afterEach(async () => {
   *   await runner.cleanup();
   * });
   * ```
   */
  async cleanup(): Promise<void> {
    if (this.tmpDir) {
      await cleanupTempDir({ dirPath: this.tmpDir });
    }
  }
}
