#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const { resolve } = require('path');

const MDParser = require('../src/md.js');
const LuaParser = require('../src/parser.js');

const METHOD_TEMPLATE_FILE = './__test_templates__/METHOD_TEMPLATE.md';
const EXTENSION_TEMPLATE_FILE = './__test_templates__/EXTENSION_TEMPLATE.md';
const CLASS_TEMPLATE_FILE = './__test_templates__/CLASS_TEMPLATE.md';
const GVAR_TEMPLATE_FILE = './__test_templates__/GVAR_TEMPLATE.md';
const CUSTOM_METHOD_TEMPLATE_FILE = './__test_templates__/CUSTOM_METHOD_TEMPLATE.md';
const BAD_TEMPLATE_FILE = './__test_templates__/BAD_TEMPLATE.md';

const OUTPUT_FOLDER = './readme';

describe('MDMethod', () => {
    beforeAll(async () => {
        this.templates = {
            method: await fs.readFile(resolve(__dirname, METHOD_TEMPLATE_FILE), 'utf8'),
            extension: await fs.readFile(resolve(__dirname, EXTENSION_TEMPLATE_FILE), 'utf8'),
            class: await fs.readFile(resolve(__dirname, CLASS_TEMPLATE_FILE), 'utf8'),
            gvar: await fs.readFile(resolve(__dirname, GVAR_TEMPLATE_FILE), 'utf8'),
            custom_method: await fs.readFile(resolve(__dirname, CUSTOM_METHOD_TEMPLATE_FILE), 'utf8'),

            invalid: await fs.readFile(resolve(__dirname, BAD_TEMPLATE_FILE), 'utf8'),
        };
    });

    beforeEach(() => {
        MDParser.setTextMDParser(null);
        MDParser.setLinkMDParser(null);
        MDParser.setHintMDParser(null);
    });

    it('Successfully generates a class MD file', async () => {
        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.class_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        expect(MDParser.generate(OUTPUT_FOLDER, this.templates.class, data.blocks[0])).toMatchSnapshot();
    });

    it('Successfully generates a method MD file', async () => {
        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.method_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        expect(MDParser.generate(OUTPUT_FOLDER, this.templates.method, data.blocks[0])).toMatchSnapshot();
    });

    it('Successfully generates a extension MD file', async () => {
        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.extension_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        expect(MDParser.generate(OUTPUT_FOLDER, this.templates.extension, data.blocks[0])).toMatchSnapshot();
    });

    it('Successfully generates a gvar MD file', async () => {
        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.gvar_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        expect(MDParser.generate(OUTPUT_FOLDER, this.templates.gvar, data.blocks[0])).toMatchSnapshot();
    });

    it('Successfully handles unknown fields', async () => {
        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.method_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        expect(MDParser.generate(OUTPUT_FOLDER, this.templates.invalid, data.blocks[0])).toMatchSnapshot();
    });

    it('Successfully handles missing fields', async () => {
        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.bad_method_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        expect(MDParser.generate(OUTPUT_FOLDER, this.templates.method, data.blocks[0])).toMatchSnapshot();
    });

    it('Successfully handles custom parsers', async () => {
        const parser = new LuaParser(resolve(__dirname, `./__test_lua__/ias.method_test.lua`));
        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();
        expect(data).not.toBe(undefined);
        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        MDParser.setTextMDParser((outputFolder, template, block) => {
            return [true, template.replace('$MY_CUSTOM_METHOD$', block.type)];
        });

        MDParser.setLinkMDParser((type, outputFolder, data) => {
            if (type === '$TITLE_NAME$') {
                return `[TITLE](My title link)`;
            }

            return template;
        });

        MDParser.setHintMDParser((hint) => {
            return `:::\n${hint.type} -> ${hint.message}\n`;
        });

        expect(MDParser.generate(OUTPUT_FOLDER, this.templates.custom_method, data.blocks[0])).toMatchSnapshot();
    });
});
