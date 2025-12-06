import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

/**
 * Creates a temporary directory for test isolation.
 *
 * @returns Promise resolving to temp directory path
 *
 * @example
 * ```ts
 * const tmpDir = await createTempDir();
 * // Use tmpDir for test
 * await cleanupTempDir({ dirPath: tmpDir });
 * ```
 */
export const createTempDir = async (): Promise<string> => {
  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "better-agents-test-")
  );
  return tmpDir;
};

/**
 * Removes a temporary directory and all its contents.
 *
 * @param params - Cleanup parameters
 * @returns Promise that resolves when cleanup is complete
 *
 * @example
 * ```ts
 * await cleanupTempDir({ dirPath: '/tmp/test-123' });
 * ```
 */
export const cleanupTempDir = async (params: {
  dirPath: string;
}): Promise<void> => {
  const { dirPath } = params;
  await fs.rm(dirPath, { recursive: true, force: true });
};

