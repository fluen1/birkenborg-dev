import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['worker/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
