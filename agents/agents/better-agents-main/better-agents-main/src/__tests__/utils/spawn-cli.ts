import { spawn } from "child_process";
import * as path from "path";

/**
 * Spawns the CLI process for testing.
 *
 * @param params - Command parameters
 * @returns Promise resolving to CLI execution result
 *
 * @example
 * ```ts
 * const result = await spawnCLI({
 *   args: ['init', 'test-project'],
 *   inputs: ['typescript\n', 'agno\n'],
 *   cwd: '/tmp/test'
 * });
 * ```
 */
export const spawnCLI = async (params: {
  args: string[];
  inputs: string[];
  cwd: string;
}): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> => {
  const { args, inputs, cwd } = params;

  return new Promise((resolve, reject) => {
    // Path to the built CLI entry point
    const cliPath = path.join(process.cwd(), "dist", "index.js");

    const child = spawn("node", [cliPath, ...args], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        // Disable inquirer's TTY detection to treat stdin as plain input
        NODE_ENV: "test",
        // Force inquirer to use non-TTY mode
        CI: "true",
        // Ensure stdin is not detected as a TTY
        TERM: "dumb",
      },
      // Detach from parent's stdio to prevent TTY inheritance
      detached: false,
    });

    let stdout = "";
    let stderr = "";
    let inputIndex = 0;

    let lastOutputLength = 0;

    child.stdout?.on("data", (data) => {
      const text = data.toString();
      stdout += text;

      // Only output to console if DEBUG_CLI env var is set
      if (process.env.DEBUG_CLI) {
        process.stdout.write(text);
      }

      // Detect any prompt (inquirer prompts all start with "? ")
      // We only look at new data since last check to avoid re-triggering
      const newText = stdout.slice(lastOutputLength);
      lastOutputLength = stdout.length;

      // If we see a prompt marker and have inputs left to send, send the next one
      const hasPrompt = newText.includes("? ");

      if (inputIndex < inputs.length && hasPrompt) {
        setTimeout(() => {
          if (inputIndex < inputs.length && child.stdin && inputs[inputIndex]) {
            child.stdin.write(inputs[inputIndex]);
            inputIndex++;
          }
        }, 150);
      }
    });

    child.stderr?.on("data", (data) => {
      const text = data.toString();
      stderr += text;

      // Only output to console if DEBUG_CLI env var is set
      if (process.env.DEBUG_CLI) {
        process.stderr.write(text);
      }
    });

    child.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
      });
    });

    child.on("error", (error) => {
      reject(error);
    });

    // Send first input after a short delay to let CLI initialize
    setTimeout(() => {
      if (inputs.length > 0 && inputIndex === 0 && child.stdin && inputs[0]) {
        child.stdin.write(inputs[inputIndex]);
        inputIndex++;
      }
    }, 200);
  });
};
