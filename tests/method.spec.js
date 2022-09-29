#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const { resolve } = require('path');

const MDMethod = require('../src/md-generators/method.js');
const LuaParser = require('../src/parser.js');

const METHOD_TEMPLATE_FILE = './__test_templates__/METHOD_TEMPLATE.md';
const BAD_TEMPLATE_FILE = './__test_templates__/BAD_TEMPLATE.md';

describe('MDMethod', () => {
    it('Successfully generates a MD file', async () => {
        const methodTemplate = await fs.readFile(resolve(__dirname, METHOD_TEMPLATE_FILE), 'utf8');

        const md = new MDMethod('./home', methodTemplate);
        expect(md).not.toBe(undefined);

        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.method_test.lua`));
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

        const md = new MDMethod('./home', classTemplate);
        expect(md).not.toBe(undefined);

        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.method_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        const mdGen = md.generate(data.blocks[0]);
        expect(mdGen).toMatchSnapshot();
    });

    it('Handles missing fields', async () => {
        const classTemplate = await fs.readFile(resolve(__dirname, METHOD_TEMPLATE_FILE), 'utf8');

        const md = new MDMethod('./home', classTemplate);
        expect(md).not.toBe(undefined);

        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.bad_method_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        const mdGen = md.generate(data.blocks[0]);
        expect(mdGen).toMatchSnapshot();
    });
});
