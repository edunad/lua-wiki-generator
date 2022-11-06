#!/usr/bin/env node
'use strict';

const { hideBin } = require('yargs/helpers');
const { readFile } = require('fs-extra');

const IASWikiExtract = require('./index.js');
const pck = require('./package.json');

process.stdout.write('\u001b[2J\u001b[0;0H'); // Clear screen
console.debug(`┬  ┬ ┬┌─┐   ┬ ┬┬┬┌─┬   ┌─┐┌─┐┌┐┌┌─┐┬─┐┌─┐┌┬┐┌─┐┬─┐`);
console.debug(`│  │ │├─┤───││││├┴┐│───│ ┬├┤ │││├┤ ├┬┘├─┤ │ │ │├┬┘`);
console.debug(`┴─┘└─┘┴ ┴   └┴┘┴┴ ┴┴   └─┘└─┘┘└┘└─┘┴└─┴ ┴ ┴ └─┘┴└─ | Ver: \x1b[35m%s\x1b[0m\n`, pck.version);

require('yargs')(hideBin(process.argv)) // eslint-disable-line
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
        demandOption: false,
    })
    .option('class', {
        alias: 'c',
        describe: 'Class template path',
        demandOption: false,
    })
    .option('extension', {
        alias: 'e',
        describe: 'Extension template path',
        demandOption: false,
    })
    .option('gvar', {
        alias: 'gv',
        describe: 'Global consts (G_) template path',
        demandOption: false,
    })
    .option('summary', {
        alias: 's',
        describe: 'Summary template path',
        demandOption: false,
    })
    .command('generate', '- Generate the wiki', {}, async (argv) => {
        if (!argv.path) throw new Error('Missing lib path');
        if (!argv.out) throw new Error('Missing output path');

        let summaryTemplate = undefined;
        let methodTemplate = undefined;
        let classTemplate = undefined;
        let extensionTemplate = undefined;
        let gvarTemplate = undefined;

        if (argv.summary) summaryTemplate = await readFile(argv.summary, 'utf8');

        if (argv.method) methodTemplate = await readFile(argv.method, 'utf8');
        if (argv.class) classTemplate = await readFile(argv.class, 'utf8');
        if (argv.extension) extensionTemplate = await readFile(argv.extension, 'utf8');
        if (argv.gvar) gvarTemplate = await readFile(argv.gvar, 'utf8');

        await new IASWikiExtract(argv.path, argv.out, {
            templates: {
                summary: summaryTemplate,
                method: methodTemplate,
                class: classTemplate,
                extension: extensionTemplate,
                gvar: gvarTemplate,
            },
        }).extract();
    })
    .demandCommand(1, '')
    .parse();
