#!/usr/bin/env node
'use strict';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs-extra';

import IASWikiExtract from './index.js';
import pck from './package.json' assert { type: 'json' };

process.stdout.write('\u001b[2J\u001b[0;0H'); // Clear screen
console.debug(`┬  ┬ ┬┌─┐   ┬ ┬┬┬┌─┬   ┌─┐┌─┐┌┐┌┌─┐┬─┐┌─┐┌┬┐┌─┐┬─┐`);
console.debug(`│  │ │├─┤───││││├┴┐│───│ ┬├┤ │││├┤ ├┬┘├─┤ │ │ │├┬┘`);
console.debug(`┴─┘└─┘┴ ┴   └┴┘┴┴ ┴┴   └─┘└─┘┘└┘└─┘┴└─┴ ┴ ┴ └─┘┴└─ | Ver: \x1b[35m%s\x1b[0m\n`, pck.version);

yargs(hideBin(process.argv)) // eslint-disable-line
    .scriptName('lua-wiki-generator')
    .usage('$0 <cmd> [args]')
    .option('path', {
        alias: 'p',
        describe: 'Lua files path',
        demandOption: true,
    })
    .option('out', {
        alias: 'o',
        describe: 'Output path',
        demandOption: true,
    })
    .option('method', {
        alias: 'm',
        describe: 'Method template path',
        demandOption: true,
    })
    .option('class', {
        alias: 'c',
        describe: 'Class template path',
        demandOption: true,
    })
    .option('extension', {
        alias: 'e',
        describe: 'Extension template path',
        demandOption: true,
    })
    .option('summary', {
        alias: 's',
        describe: 'Summary template path',
        demandOption: true,
    })
    .command('generate', '- Generate the wiki', {}, async (argv) => {
        if (!argv.path) throw new Error('Missing lib path');
        if (!argv.out) throw new Error('Missing output path');

        if (!argv.method) throw new Error('Missing method template path');
        if (!argv.class) throw new Error('Missing class template path');
        if (!argv.extension) throw new Error('Missing extension template path');
        if (!argv.summary) throw new Error('Missing summary template path');

        const methodTemplate = await fs.readFile(argv.method, 'utf8');
        const classTemplate = await fs.readFile(argv.class, 'utf8');
        const extensionTemplate = await fs.readFile(argv.extension, 'utf8');
        const summaryTemplate = await fs.readFile(argv.summary, 'utf8');

        await new IASWikiExtract(argv.path, argv.out, {
            summary: summaryTemplate,
            method: methodTemplate,
            class: classTemplate,
            extension: extensionTemplate,
        }).extract();
    })
    .demandCommand(1, '')
    .parse();
