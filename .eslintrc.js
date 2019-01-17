/* eslint-disable */
module.exports = {
  globals: {
    server: true,
  },
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  env: {
    browser: true,
  },
  plugins: ['prettier'],

  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'prettier',
  ],
  rules: {
    // Formatting
    'prettier/prettier': 'error',
  },
  overrides: [
    // node files
    {
      files: [],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2015
      },
      env: {
        browser: false,
        node: true
      }
    },
    {
      files: [
        '**/*.test.js'
      ],
      globals: {
        currentURL: true,
        currentPath: true,
        andThen: true,
        loginUser: true,
        visit: true,
        textShouldContain: true,
        currencyToNumber: true,
        fillIn: true,
        click: true,
        triggerEvent: true,
      }
    }
  ]
};
