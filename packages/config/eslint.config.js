import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  {
    ignores: ['dist/**', 'lib/**', 'es/**', '*.min.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...(config.languageOptions ?? {}),
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: {
        ...(config.languageOptions?.parserOptions ?? {}),
        project: resolve(__dirname, './tsconfig.json'),
      },
    },
    rules: {
      ...(config.rules ?? {}),
      'no-console': 'error',
    },
  })),
]);
