import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules'],
  },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: 'Domain code must stay framework-free.',
            },
            {
              name: 'react-dom',
              message: 'Domain code must stay framework-free.',
            },
            {
              name: 'dexie',
              message: 'Domain code must not import persistence infrastructure.',
            },
          ],
          patterns: [
            {
              group: ['../infra/*', '../../infra/*', '../ui/*', '../../ui/*'],
              message: 'Domain code must not import app infrastructure or UI.',
            },
          ],
        },
      ],
    },
  },
);
