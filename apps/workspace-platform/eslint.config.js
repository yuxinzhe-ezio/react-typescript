import rootConfig from '../../eslint.config.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  ...rootConfig,
  {
    // 修复子项目的tsconfig路径
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: resolve(__dirname, './tsconfig.json'),
      },
    },
  },
];
