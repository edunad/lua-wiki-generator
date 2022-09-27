#!/usr/bin/env node
'use strict';

import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { MDMethod } from '../src/md-generators/method.js';
import { LuaParser } from '../src/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const METHOD_TEMPLATE_FILE = './__test_templates__/METHOD_TEMPLATE.md';

describe('MDGenerators', () => {
    it('Generates a Method MD', async () => {
        const methodTemplate = await fs.readFile(resolve(__dirname, METHOD_TEMPLATE_FILE), 'utf8');

        const md = new MDMethod('./home', methodTemplate);
        expect(md).not.toBe(undefined);

        const parser = new LuaParser(resolve(__dirname, `./ias.method_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        const mdGen = md.generate(data.blocks[0]);
        expect(mdGen).toMatchSnapshot();
    });
});
