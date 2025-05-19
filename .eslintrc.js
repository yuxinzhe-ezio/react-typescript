module.exports = {
  root: true,
  // extends: ["@byted/eslint-config-eden/react-ts"],
  plugins: ['react', 'prettier', 'simple-import-sort', 'react-hooks'],
  rules: {
    'arrow-body-style': 'warn',
    eqeqeq: 'warn',
    'one-var': 'off',
    'max-lines-per-function': ['error', { max: 300 }],
    'object-curly-spacing': ['error', 'always'],
    'no-new-wrappers': 'off',
    'no-unneeded-ternary': 'off',
    'prefer-promise-reject-errors': 'off',
    quotes: [2, 'single'],
    'quote-props': 'off',
    'require-await': 'off',

    'react/button-has-type': 'off',
    'react/destructuring-assignment': 'off',
    'react/no-unknown-property': 'off',
    'react/jsx-indent-props': 'off',

    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/method-signature-style': 'off',
    '@typescript-eslint/naming-convention': 'off', // 关闭命名规则的检查
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-unnecessary-type-constraint': 'off',
    '@typescript-eslint/quotes': 'off',

    'prettier/prettier': [
      'error',
      {
        bracketSpacing: true,
        bracketSameLine: false,
        jsxBracketSameLine: false,
        useTabs: false,
      },
    ],

    // 最佳实践
    'simple-import-sort/imports': [
      'warn',
      {
        groups: [
          // `react` related packages & side effect imports come first.
          ['^react', '^\\u0000'],
          // Node.js builtins. You could also generate this regex if you use a `.js` config.
          // For example: `^(${require("module").builtinModules.join("|")})(/|$)`
          [
            '^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)',
          ],
          // Other packages.
          ['^\\w', '^@\\w'],
          // Internal packages.
          [
            '^(@|@assets|assets|@styles|styles|@static|static|@utils|utils|@tools|tools|@hooks|hooks|@pages|pages|@components|components|@component|component|@service|service|@services|services|@constants|@store|store|@types|types|@src|src|@providers|providers|@containers|containers|@layout|layout)(/.*|$)',
          ],
          [
            // Parent imports. Put `..` last.
            '^\\.\\.(?!/?$)',
            '^\\.\\./?$',
            // Other relative imports. Put same-folder imports and `.` last.
            '^\\./(?=.*/)(?!/?$)',
            '^\\.(?!/?$)',
            '^\\./?$',
          ],
          [
            // Image imports.
            '^.+\\.(gif|png|jpg|jpeg|webp|svg)$',
            // Style imports.
            '^.+\\.(sass|scss|less|css)$',
          ],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',
  },
};
