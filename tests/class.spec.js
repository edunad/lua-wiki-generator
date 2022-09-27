#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const { resolve } = require('path');

const MDClass = require('../src/md-generators/class.js');
const LuaParser = require('../src/parser.js');

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
