/******************************************************************************
******************************************************************************
**
** Copyright (c) 2011-2017 VRVis Zentrum für Virtual Reality und Visualisierung
** Forschungs-GmbH All rights reserved.
**
************************************************************
**
** THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF VRVis GmbH The copyright
** notice above does not evidence any actual or intended publication of such
** code.
**
******************************************************************************
******************************************************************************/

// author: Nicolas Swoboda <swoboda@vrvis.at>

// learn more about ES Lint at https://survivejs.com/webpack/developing/linting/

module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  'extends': ['eslint:recommended', 'plugin:react/recommended', 'plugin:flowtype/recommended'],
  'plugins': [
    'flowtype'
  ],
  parserOptions: {
    'ecmaVersion': 8,
    'sourceType': 'module',
    'ecmaFeatures': {
      'jsx': true,
      'experimentalObjectRestSpread': true
    }
  },
  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'indent': ['error', 'tab', { 'SwitchCase': 1 }],
    'no-mixed-spaces-and-tabs': 1, // disallow mixed spaces and tabs for indentation
    //'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'no-console': 0,
  },
};
