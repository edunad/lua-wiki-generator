#!/usr/bin/env node
'use strict';

import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import { MDClass } from '../src/md-generators/class.js';
import { LuaParser } from '../src/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLASS_TEMPLATE_FILE = './__test_templates__/CLASS_TEMPLATE.md';

describe('MDGenerators', () => {
    it('Generates a Class MD', async () => {
        const classTemplate = await fs.readFile(resolve(__dirname, CLASS_TEMPLATE_FILE), 'utf8');

        const md = new MDClass('./home', classTemplate);
        expect(md).not.toBe(undefined);

        const parser = new LuaParser(resolve(__dirname, `./ias.class_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        const mdGen = md.generate(data.blocks[0]);
        expect(mdGen).toMatchSnapshot();
    });
});
