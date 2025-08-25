export const CODE_FILE_EXTENSIONS: readonly string[] = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
];

export const IGNORED_DIRECTORIES: ReadonlySet<string> = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.output',
  '.nuxt',
  '.vite',
]);

// Match .vue strings inside quotes (import/require/dynamic import, etc.)
export const VUE_IMPORT_STRING_REGEX: RegExp = /(['"`])([^'"`]*?\.vue)\1/g;
