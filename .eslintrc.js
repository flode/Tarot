module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
    },
    plugins: ['eslint-plugin-import', 'eslint-plugin-jsdoc', '@typescript-eslint'],
    rules: {
        '@typescript-eslint/array-type': 'warn',
        '@typescript-eslint/consistent-type-assertions': 'warn',
        '@typescript-eslint/dot-notation': 'warn',
        '@typescript-eslint/member-delimiter-style': [
            'warn',
            {
                multiline: {
                    delimiter: 'semi',
                    requireLast: true,
                },
                singleline: {
                    delimiter: 'semi',
                    requireLast: false,
                },
            },
        ],
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-shadow': [
            'warn',
            {
                hoist: 'all',
            },
        ],
        '@typescript-eslint/no-unused-expressions': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/prefer-for-of': 'warn',
        '@typescript-eslint/prefer-function-type': 'warn',
        '@typescript-eslint/prefer-namespace-keyword': 'warn',
        '@typescript-eslint/quotes': ['warn', 'single'],
        '@typescript-eslint/semi': ['warn', 'always'],
        '@typescript-eslint/unified-signatures': 'warn',
        'arrow-parens': ['warn', 'as-needed'],
        eqeqeq: ['warn', 'smart'],
        'guard-for-in': 'warn',
        'import/order': [
            'warn',
            {
                'newlines-between': 'always',
                alphabetize: { order: 'asc', caseInsensitive: true },
                groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
            },
        ],
        'jsdoc/check-alignment': 'warn',
        'jsdoc/check-indentation': 'warn',
        'jsdoc/newline-after-description': 'warn',
        'max-len': [
            'warn',
            {
                code: 140,
            },
        ],
        'new-parens': 'warn',
        'no-bitwise': 'warn',
        'no-caller': 'warn',
        'no-console': [
            'warn',
            {
                allow: [
                    'warn',
                    'dir',
                    'time',
                    'timeEnd',
                    'timeLog',
                    'trace',
                    'assert',
                    'clear',
                    'count',
                    'countReset',
                    'group',
                    'groupEnd',
                    'table',
                    'debug',
                    'info',
                    'dirxml',
                    'error',
                    'groupCollapsed',
                    'Console',
                    'profile',
                    'profileEnd',
                    'timeStamp',
                    'context',
                ],
            },
        ],
        'no-empty-function': 'warn',
        'no-eval': 'warn',
        'no-new-wrappers': 'warn',
        'no-throw-literal': 'warn',
        'no-trailing-spaces': 'warn',
        'no-undef-init': 'warn',
        'no-unused-labels': 'warn',
        'no-var': 'warn',
        'object-shorthand': 'warn',
        'one-var': ['warn', 'never'],
        'prefer-const': 'warn',
        radix: 'warn',
        'spaced-comment': [
            'warn',
            'always',
            {
                markers: ['/'],
            },
        ],
    },
};
