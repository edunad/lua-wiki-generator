#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const { resolve } = require('path');

const MDClass = require('../src/md-generators/class.js');
const LuaParser = require('../src/parser.js');

const CLASS_TEMPLATE_FILE = './__test_templates__/CLASS_TEMPLATE.md';
const BAD_TEMPLATE_FILE = './__test_templates__/BAD_TEMPLATE.md';

describe('MDClass', () => {
    it('Successfully generates a MD file', async () => {
        const classTemplate = await fs.readFile(resolve(__dirname, CLASS_TEMPLATE_FILE), 'utf8');

        const md = new MDClass('./home', classTemplate);
        expect(md).not.toBe(undefined);

        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.class_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        const mdGen = md.generate(data.blocks[0]);
        expect(mdGen).toMatchSnapshot();
    });

    it('Handles unknown fields', async () => {
        const classTemplate = await fs.readFile(resolve(__dirname, BAD_TEMPLATE_FILE), 'utf8');

        const md = new MDClass('./home', classTemplate);
        expect(md).not.toBe(undefined);

        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.class_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        const mdGen = md.generate(data.blocks[0]);
        expect(mdGen).toMatchSnapshot();
    });

    it('Handles missing fields', async () => {
        const classTemplate = await fs.readFile(resolve(__dirname, CLASS_TEMPLATE_FILE), 'utf8');

        const md = new MDClass('./home', classTemplate);
        expect(md).not.toBe(undefined);

        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.bad_class_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        const mdGen = md.generate(data.blocks[0]);
        expect(mdGen).toMatchSnapshot();
    });
});
