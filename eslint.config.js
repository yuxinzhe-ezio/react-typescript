import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default defineConfig([
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'lib/**',
      'coverage/**',
      '*.min.js',
      'apps/web/public/**',
      'apps/web/scripts/**',
      'apps/web/config/**'
    ]
  },

  // Base configuration
  js.configs.recommended,
  
  // TypeScript configuration
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx}']
  })),

  // React + TypeScript configuration
  {
    files: ['**/src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'simple-import-sort': simpleImportSort
    },
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.json', './apps/*/tsconfig.json']
      }
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      // React essentials
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript essentials
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Import sorting rules - best practices
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            // React related packages and side effects imports
            ['^react', '^vue', '^\\u0000'],
            // Node.js built-in modules
            [
              '^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)',
            ],
            // Other third-party packages
            ['^\\w', '^@\\w'],
            // Internal packages
            [
              '^(@|@assets|assets|@styles|styles|@static|static|@utils|utils|@tools|tools|@hooks|hooks|@pages|pages|@components|components|@component|component|@service|service|@services|services|@constants|@store|store|@types|types|@src|src|@providers|providers|@containers|containers|@layout|layout)(/.*|$)',
            ],
            [
              // Parent imports
              '^\\.\\.(?!/?$)',
              '^\\.\\./?$',
              // Other relative imports
              '^\\./(?=.*/)(?!/?$)',
              '^\\.(?!/?$)',
              '^\\./?$',
            ],
            [
              // Image imports
              '^.+\\.(gif|png|jpg|jpeg|webp|svg)$',
              // Style imports
              '^.+\\.(sass|scss|less|css)$',
            ],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Code quality
      'no-console': 'off',
      'no-duplicate-imports': 'error',
      'prefer-object-spread': 'error'
    }
  },

  // Prettier (must be last)
  prettierConfig
]);
