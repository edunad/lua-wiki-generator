#!/usr/bin/env node
'use strict';

import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { MDExtension } from '../src/md-generators/extension';
import { LuaParser } from '../src/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXTENSION_TEMPLATE_FILE = './__test_templates__/EXTENSION_TEMPLATE.md';

describe('MDGenerators', () => {
    it('Generates a Extension MD', async () => {
        const extensionTemplate = await fs.readFile(resolve(__dirname, EXTENSION_TEMPLATE_FILE), 'utf8');
        expect(extensionTemplate).not.toBe(undefined);

        const md = new MDExtension('./home', extensionTemplate);
        expect(md).not.toBe(undefined);

        const parser = new LuaParser(resolve(__dirname, `./ias.extension_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        const mdGen = md.generate(data.blocks[0]);
        expect(mdGen).toMatchSnapshot();
    });
});
