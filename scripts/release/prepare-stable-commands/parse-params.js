#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const figlet = require('figlet');

const paramDefinitions = [
  {
    name: 'version',
    type: String,
    description: 'Version of published canary release (e.g. 0.0.0-ddaf2b07c)',
  },
];

module.exports = () => {
  const params = commandLineArgs(paramDefinitions);

  if (!params.version) {
    const usage = commandLineUsage([
      {
        content: chalk
          .hex('#61dafb')
          .bold(figlet.textSync('react', {font: 'Graffiti'})),
        raw: true,
      },
      {
        content: 'Prepare a published canary release to be promoted to stable.',
      },
      {
        header: 'Options',
        optionList: paramDefinitions,
      },
      {
        header: 'Examples',
        content: [
          {
            desc: 'Example:',
            example:
              '$ ./prepare-stable.js [bold]{--version=}[underline]{0.0.0-ddaf2b07c}',
          },
        ],
      },
    ]);
    console.log(usage);
    process.exit(1);
  }

  return params;
};
