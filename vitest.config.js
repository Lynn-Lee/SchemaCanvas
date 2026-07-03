import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: true,
    exclude: [...configDefaults.exclude, 'src/test/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        ...configDefaults.coverage.exclude,
        'src/test/**',
        '**/*.test.{js,jsx}',
      ],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 30,
        statements: 40,
      },
    },
  },
});
