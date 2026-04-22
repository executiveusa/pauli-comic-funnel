import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
  vi.stubEnv('COPILOTKIT_API_KEY', 'test-copilotkit-key');
  vi.stubEnv('NOTION_API_TOKEN', 'test-notion-token');
  vi.stubEnv('NOTION_API_KEY', 'test-notion-key');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
